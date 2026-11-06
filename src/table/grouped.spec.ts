import type { AxiosInstance } from 'axios';
import qs from 'qs';
import { effectScope, nextTick, ref } from 'vue';
import type { GroupPath, UseGroupedTableOptions } from '../types/grouping';
import { useGroupedTable } from './grouped';

type Item = { id: string; status: string | null; category: string; active: boolean };
const data: Item[] = Array.from({ length: 84 }, (_, i) => ({
  id: String(i).padStart(3, '0'),
  status: i < 42 ? '001' : null,
  category: i % 2 ? 'a' : 'b',
  active: true,
}));
const matches = (item: Item, where: Record<string, unknown>): boolean =>
  Object.entries(where).every(([field, value]) => {
    if (field === 'AND') return (value as Record<string, unknown>[]).every((part) => matches(item, part));
    return Object.is(
      item[field as keyof Item],
      value && typeof value === 'object' ? (value as { equals: unknown }).equals : value,
    );
  });
function fixture(overrides: Partial<UseGroupedTableOptions<Item>> = {}) {
  const requests: Record<string, unknown>[] = [];
  const get = jest.fn(async (url: string) => {
    const query = qs.parse(url.split('?')[1] ?? '');
    requests.push(query);
    const filtered = data.filter((item) => matches(item, JSON.parse(query.where as string)));
    if (url.includes('/group-by')) {
      const field = (query.by as string[])[0] as keyof Item;
      const values = [...new Set(filtered.map((item) => item[field]))];
      return {
        data: values.slice(Number(query.skip), Number(query.skip) + Number(query.take)).map((value) => ({
          [field]: value,
          _count: { _all: filtered.filter((item) => Object.is(item[field], value)).length },
        })),
      };
    }
    const skip = (Number(query.page) - 1) * Number(query.perPage);
    return {
      data: {
        items: filtered.slice(skip, skip + Number(query.perPage)),
        meta: { itemCount: filtered.length, pageCount: Math.ceil(filtered.length / Number(query.perPage)) },
      },
    };
  });
  const scope = effectScope();
  const table = scope.run(() =>
    useGroupedTable<Item>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'tasks',
      persistenceKey: 'groups',
      storage: { getItem: () => null, setItem: jest.fn() },
      columns: ref([{ id: 'id' }, { id: 'status' }, { id: 'category' }, { id: 'actions' }]),
      groupableFields: [
        { value: 'status', label: 'Status' },
        { value: 'category', label: 'Category' },
      ],
      defaultGrouping: ['status', 'category'],
      groupBatchSize: 1,
      defaultItemsPerPage: 10,
      ...overrides,
    }),
  )!;
  return { table, get, requests, stop: () => scope.stop() };
}
const settle = async () => {
  for (let i = 0; i < 5; i++) await nextTick();
};

describe('useGroupedTable', () => {
  it('loads complete nested counts and leaves lazily, including null and numeric-looking strings', async () => {
    const f = fixture();
    await f.table.initialize();
    expect(f.table.groups.value).toHaveLength(1);
    const status = f.table.groups.value[0]!;
    expect(status.value).toBe('001');
    expect(status.count).toBe(42);
    await f.table.loadMoreGroups();
    expect(f.table.groups.value[1]!.value).toBeNull();
    expect(f.table.root.hasMore).toBe(false);
    await f.table.loadMoreGroups();
    await f.table.toggleGroup(status.path);
    expect(status.children[0]!.count).toBe(21);
    await f.table.loadMoreGroups(status.path);
    expect(status.children).toHaveLength(2);
    const leaf = status.children[0]!;
    await f.table.toggleGroup(leaf.path);
    expect(leaf.items).toHaveLength(10);
    expect(leaf.hasMore).toBe(true);
    await f.table.loadMoreItems(leaf.path);
    await f.table.loadMoreItems(leaf.path);
    expect(leaf.items).toHaveLength(21);
    expect(leaf.hasMore).toBe(false);
    expect(new Set(leaf.items.map((item) => item.id)).size).toBe(21);
    const requests = f.get.mock.calls.length;
    await f.table.toggleGroup(status.path);
    await f.table.toggleGroup(status.path);
    expect(f.get).toHaveBeenCalledTimes(requests);
    expect(f.requests.at(-1)?.where).toContain('001');
    f.stop();
  });

  it('loads flat lists, honors projections, fixed filters, callbacks and identity sorting', async () => {
    const onInitialized = jest.fn();
    const onRefreshed = jest.fn();
    const f = fixture({
      name: 'alias',
      persistenceKey: undefined,
      defaultGrouping: [],
      staticFilter: ref({ active: true }),
      isArchived: undefined,
      staticFields: ['active'],
      identityKey: 'id',
      onInitialized,
      onRefreshed,
      columns: ref([{ id: 'status', fields: ['name'] }, { id: 'actions' }]),
    });
    expect(f.table.fields.value).toContain('active');
    await f.table.initialize();
    await f.table.loadMoreItems([]);
    expect(f.table.root.items).toHaveLength(20);
    expect(onInitialized).toHaveBeenCalledTimes(1);
    expect(onRefreshed).toHaveBeenCalledTimes(2);
    expect(f.requests[0]!.orderBy).toEqual([{ id: 'asc' }]);
    f.table.sorting.value = [{ id: 'id', desc: true }];
    await settle();
    expect(f.table.root.items).toHaveLength(10);
    f.table.columnVisibility.value = ['status'];
    await settle();
    expect(f.table.columns.value).toEqual([{ id: 'actions' }]);
    f.stop();
  });

  it('invalidates grouping/filter changes and stores preferences', async () => {
    const saved = new Map<string, string>([
      ['table:groups:grouping', '["category"]'],
      ['table:groups:column-order', '["gone","status"]'],
      ['table:groups:invisible-columns', '["gone"]'],
    ]);
    const f = fixture({
      storage: {
        getItem: (key) => saved.get(key) ?? null,
        setItem: (key, value) => {
          saved.set(key, value);
        },
      },
    });
    expect(f.table.grouping.value).toEqual(['category']);
    expect(f.table.columnOrder.value).not.toContain('gone');
    expect(f.table.columnVisibility.value).toEqual([]);
    f.table.sorting.value = [{ id: 'status', desc: true }];
    await settle();
    expect(f.get).not.toHaveBeenCalled();
    await f.table.initialize();
    f.table.grouping.value = ['status'];
    await settle();
    expect(saved.get('table:groups:grouping')).toBe('["status"]');
    expect(f.table.groups.value[0]!.field).toBe('status');
    f.table.filtering.value = {
      operator: 'AND',
      filters: [{ id: 'f', field: 'status', operator: 'equals', value: 'missing' }],
    };
    await settle();
    expect(f.table.groups.value).toEqual([]);
    f.stop();
  });

  it('isolates errors, retries, ignores concurrent loads and stale successful responses', async () => {
    const onError = jest.fn();
    const f = fixture({ defaultGrouping: ['status'], onError });
    await f.table.initialize();
    const node = f.table.groups.value[0]!;
    f.get.mockRejectedValueOnce(new Error('offline'));
    await f.table.toggleGroup(node.path);
    expect(node.error).toBeInstanceOf(Error);
    expect(onError).toHaveBeenCalled();
    await f.table.loadMoreItems(node.path);
    expect(node.error).toBeUndefined();
    expect(node.items).toHaveLength(10);
    let resolve!: (result: { data: { items: Item[]; meta: { itemCount: number; pageCount: number } } }) => void;
    f.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const pending = f.table.loadMoreItems(node.path);
    const callCount = f.get.mock.calls.length;
    await f.table.loadMoreItems(node.path);
    expect(f.get).toHaveBeenCalledTimes(callCount);
    await f.table.refresh();
    resolve({ data: { items: data, meta: { itemCount: 84, pageCount: 9 } } });
    await pending;
    expect(f.table.groups.value[0]!.items).toEqual([]);
    f.stop();
  });

  it('ignores stale group responses and stale request failures', async () => {
    const f = fixture();
    let resolve!: (value: { data: never[] }) => void;
    f.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const pending = f.table.initialize();
    await f.table.refresh();
    resolve({ data: [] });
    await pending;
    expect(f.table.groups.value).toHaveLength(1);
    let reject!: (reason: Error) => void;
    f.get.mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );
    const stale = f.table.refresh();
    await f.table.refresh();
    reject(new Error('old'));
    await stale;
    expect(f.table.root.error).toBeUndefined();
    f.stop();
  });

  it('validates defaults, runtime grouping, responses and paths', async () => {
    expect(() => fixture({ persistenceKey: undefined, name: undefined })).toThrow('persistenceKey');
    expect(() => fixture({ groupBatchSize: 0 })).toThrow('groupBatchSize');
    expect(() => fixture({ defaultGrouping: ['unknown'] })).toThrow('defaultGrouping');
    expect(() => fixture({ defaultItemsPerPage: 0 })).toThrow('defaultItemsPerPage');
    const f = fixture();
    await f.table.initialize();
    await expect(f.table.toggleGroup([])).rejects.toThrow('empty');
    await expect(f.table.toggleGroup([{ field: 'status', value: 'missing' }])).rejects.toThrow('Unknown');
    await expect(f.table.loadMoreItems([])).rejects.toThrow('groups');
    const path: GroupPath = [
      { field: 'status', value: '001' },
      { field: 'category', value: 'a' },
    ];
    await expect(f.table.loadMoreGroups(path)).rejects.toThrow('records');
    f.table.grouping.value = ['unknown'];
    await settle();
    expect(f.table.root.error).toBeInstanceOf(Error);
    f.table.grouping.value = ['status'];
    await settle();
    f.get.mockResolvedValueOnce({ data: [{ status: {}, _count: { _all: 1 } }] } as never);
    await f.table.refresh();
    expect(f.table.root.error).toBeInstanceOf(Error);
    f.get.mockResolvedValueOnce({
      data: [
        { status: true, _count: { _all: 1 } },
        { status: 1, _count: { _all: 1 } },
      ],
    } as never);
    await f.table.refresh();
    expect(f.table.groups.value[0]!.value).toBe(true);
    f.get.mockResolvedValueOnce({ data: [{ status: 1, _count: { _all: 1 } }] } as never);
    await f.table.loadMoreGroups();
    expect(f.table.groups.value[1]!.value).toBe(1);
    expect(f.table.groups.value[1]!.key).not.toBe(f.table.groups.value[0]!.key);
    f.stop();
  });
});
