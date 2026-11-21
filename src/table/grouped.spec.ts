import type { AxiosInstance } from 'axios';
import qs from 'qs';
import { effectScope, nextTick, ref } from 'vue';
import type { GroupPath, UseGroupedTableOptions } from '../types/grouping';
import { useGroupedTable } from './grouped';

type Item = { id: string; status: string | null; category: string; active: boolean; hours: number };
const data: Item[] = Array.from({ length: 84 }, (_, i) => ({
  id: String(i).padStart(3, '0'),
  status: i < 42 ? '001' : null,
  category: i % 2 ? 'a' : 'b',
  active: true,
  hours: 2,
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
  const get = jest.fn(async (url: string): Promise<{ data: unknown }> => {
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
  it('keeps committed leaf rows and sibling pages while a page is pending or fails', async () => {
    const f = fixture({ defaultGrouping: ['status'], loading: { initialMode: 'pagination' } });
    await f.table.initialize();
    await f.table.loadMoreGroups();
    const [first, second] = f.table.groups.value;
    await f.table.toggleGroup(first!.path);
    await f.table.toggleGroup(second!.path);
    const firstRows = first!.items;
    const siblingRows = second!.items;
    let reject!: (error: Error) => void;
    f.get.mockImplementationOnce(
      () =>
        new Promise((_, fail) => {
          reject = fail;
        }),
    );

    const previousRequests = f.get.mock.calls.length;
    const pending = f.table.loadItemsPage(first!.path, 2);
    expect(f.table.getItemPage(first!.path)).toEqual({ page: 1, totalItems: 42, requestedPage: 2 });
    expect(first!.items).toBe(firstRows);
    expect(second!.items).toBe(siblingRows);
    reject(new Error('Page failed'));
    await pending;
    expect(first!.items).toBe(firstRows);
    expect(f.table.getItemPage(first!.path).requestedPage).toBe(2);

    await f.table.loadItemsPage(first!.path, 2);
    expect(f.table.getItemPage(first!.path)).toEqual({ page: 2, totalItems: 42 });
    expect(first!.items[0]?.id).toBe('010');
    expect(second!.items).toBe(siblingRows);
    expect(f.get.mock.calls).toHaveLength(previousRequests + 2);
    f.stop();
  });

  it('expands every group batch and nested leaf, then clears saved expansion without requests', async () => {
    const setItem = jest.fn();
    const f = fixture({ persistExpansion: true, storage: { getItem: () => null, setItem } });
    await f.table.initialize();
    expect(f.table.groups.value).toHaveLength(1);
    expect(f.table.allGroupsExpanded.value).toBe(false);
    const first = f.table.groups.value[0]!;
    f.get.mockRejectedValueOnce(new Error('Group request failed'));
    await f.table.toggleGroup(first.path);
    expect(first.error).toEqual(new Error('Group request failed'));

    await f.table.setAllGroupsExpanded(true);
    const groups = f.table.groups.value;
    expect(groups).toHaveLength(2);
    expect(groups.map((parent) => parent.children.length)).toEqual([2, 2]);
    expect(groups.flatMap((parent) => parent.children.map((leaf) => leaf.items.length))).toEqual([10, 10, 10, 10]);
    expect(f.table.allGroupsExpanded.value).toBe(true);

    const requests = f.get.mock.calls.length;
    await f.table.setAllGroupsExpanded(false);
    expect(f.table.allGroupsExpanded.value).toBe(false);
    expect(groups.flatMap((node) => [node, ...node.children]).every((node) => !node.expanded)).toBe(true);
    expect(f.get).toHaveBeenCalledTimes(requests);
    expect(setItem).toHaveBeenLastCalledWith('table:groups:expanded-groups', '[]');
    f.stop();
  });

  it('restores nested expansion after refresh and remount without reopening a collapsed parent', async () => {
    const saved = new Map<string, string>();
    const storage = {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
    };
    const first = fixture({ storage, persistExpansion: true });
    await first.table.initialize();
    const parent = first.table.groups.value[0]!;
    await first.table.toggleGroup(parent.path);
    const child = parent.children[0]!;
    await first.table.toggleGroup(child.path);
    await first.table.refresh();
    const restored = first.table.groups.value[0]!;
    expect(restored.expanded).toBe(true);
    expect(restored.children[0]?.expanded).toBe(true);
    expect(restored.children[0]?.items).toHaveLength(10);
    await first.table.toggleGroup(parent.path);
    first.stop();

    const second = fixture({ storage, persistExpansion: true });
    await second.table.initialize();
    expect(second.table.groups.value[0]?.expanded).toBe(false);
    expect(second.get).toHaveBeenCalledTimes(1);
    await second.table.toggleGroup(parent.path);
    expect(second.table.groups.value[0]?.children[0]?.expanded).toBe(true);
    await second.table.toggleGroup(child.path);
    await second.table.refresh();
    expect(second.table.groups.value[0]?.children[0]?.expanded).toBe(false);
    second.stop();
  });

  it('applies group-key ordering and retains expanded groups when only leaf ordering changes', async () => {
    const f = fixture({ defaultGrouping: ['status'] });
    await f.table.initialize();
    const path = f.table.groups.value[0]!.path;
    await f.table.toggleGroup(path);
    const previousRequests = f.requests.length;

    f.table.sorting.value = [{ id: 'hours', desc: true }];
    await settle();
    expect(f.table.groups.value[0]?.expanded).toBe(true);
    expect(f.requests.slice(previousRequests).map(({ orderBy }) => orderBy)).toEqual([
      [{ hours: 'desc' }, { id: 'asc' }],
    ]);

    f.table.sorting.value = [{ id: 'status', desc: true }];
    await settle();
    expect(f.requests.at(-1)?.orderBy).toEqual({ status: 'desc' });
    f.stop();
  });

  it('requests group totals and validates them before publishing group nodes', async () => {
    const f = fixture({ groupSumFields: ['hours'] });
    f.get.mockResolvedValueOnce({ data: [{ status: '001', _count: { _all: 42 }, _sum: { hours: 84 } }] });
    await f.table.initialize();
    const query = qs.parse(f.get.mock.calls[0]?.[0].split('?')[1] ?? '');
    expect(query._sum).toEqual({ hours: 'true' });
    expect(f.table.groups.value[0]?.sum).toEqual({ hours: 84 });
    expect(f.table.groups.value[0]?.items).toEqual([]);

    f.get.mockResolvedValueOnce({ data: [{ status: null, _count: { _all: 42 }, _sum: { hours: null } }] });
    await f.table.refresh();
    expect(f.table.groups.value[0]?.sum).toEqual({ hours: null });

    f.get.mockResolvedValueOnce({ data: [{ status: '001', _count: { _all: 42 } }] });
    await f.table.refresh();
    expect(f.table.root.error).toEqual(new Error('Invalid group-by sum.'));
    expect(f.table.groups.value).toEqual([]);
    f.stop();
  });

  it('preloads displayed nested leaves and atomically appends unequal batches through the final row', async () => {
    const f = fixture({ loading: { initialMode: 'infinite', initialGroupItems: 3, groupLoadMoreItems: 5 } });
    expect(() => fixture({ loading: { initialGroupItems: 0 } })).toThrow('initialGroupItems');
    await f.table.initialize();
    expect(f.get).toHaveBeenCalledTimes(1);
    const parent = f.table.groups.value[0]!;
    await f.table.toggleGroup(parent.path);
    const leaf = parent.children[0]!;
    expect(leaf.expanded).toBe(false);
    expect(leaf.items).toHaveLength(3);
    const initial = leaf.items;
    const original = f.get.getMockImplementation()!;
    f.get.mockImplementationOnce(original).mockRejectedValueOnce(new Error('second page failed'));
    await f.table.loadMoreItems(leaf.path);
    expect(leaf.items).toBe(initial);
    expect(leaf.error).toBeInstanceOf(Error);
    await f.table.loadMoreItems(leaf.path);
    expect(leaf.items).toHaveLength(8);
    expect(f.requests.slice(-2).map(({ page, perPage }) => [page, perPage])).toEqual([
      ['1', '5'],
      ['2', '5'],
    ]);
    for (let i = 0; i < 3; i++) await f.table.loadMoreItems(leaf.path);
    expect(leaf.items.map(({ id }) => id)).toEqual(
      data.filter(({ status, category }) => status === '001' && category === leaf.value).map(({ id }) => id),
    );
    expect(leaf.hasMore).toBe(false);
    await f.table.toggleGroup(leaf.path);
    f.table.loadingMode.value = 'pagination';
    await settle();
    expect(parent.expanded).toBe(true);
    expect(leaf.expanded).toBe(true);
    expect(leaf.items).toHaveLength(10);
    f.stop();
  });

  it('switches independent leaf pages to lazy infinite batches and ignores a stale page', async () => {
    const f = fixture({ defaultGrouping: ['status'], loading: { preloadGroupItems: false, initialGroupItems: 3 } });
    await f.table.initialize();
    await f.table.loadMoreGroups();
    const [first, second] = f.table.groups.value as [
      NonNullable<(typeof f.table.groups.value)[0]>,
      NonNullable<(typeof f.table.groups.value)[0]>,
    ];
    await f.table.toggleGroup(first.path);
    await f.table.loadItemsPage(first.path, 2);
    expect(f.table.getItemPage(first.path)).toEqual({ page: 2, totalItems: 42 });
    expect(first.items[0]?.id).toBe('010');
    expect(f.table.getItemPage(second.path).page).toBe(1);
    expect(second.items).toEqual([]);

    let resolve!: (result: { data: { items: Item[]; meta: { itemCount: number; pageCount: number } } }) => void;
    f.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const pending = f.table.loadItemsPage(first.path, 3);
    f.table.loadingMode.value = 'infinite';
    await settle();
    resolve({ data: { items: data.slice(20, 30), meta: { itemCount: 42, pageCount: 5 } } });
    await pending;
    expect(f.table.groups.value[0]).toBe(first);
    expect(first.expanded).toBe(true);
    expect(first.items.map(({ id }) => id)).toEqual(['000', '001', '002']);
    expect(second.items).toEqual([]);
    await f.table.toggleGroup(second.path);
    expect(second.items).toHaveLength(3);
    f.stop();
  });

  it('paginates an ungrouped root and restarts it as a flat append list', async () => {
    const f = fixture({ defaultGrouping: [], loading: {} });
    await f.table.initialize();
    const state = f.table.getItemPage();
    await f.table.loadItemsPage([], 2);
    expect(state).toEqual({ page: 2, totalItems: 84 });
    expect(f.table.root.items[0]?.id).toBe('010');
    f.table.loadingMode.value = 'infinite';
    await settle();
    expect(state.page).toBe(1);
    await f.table.loadMoreItems([]);
    expect(f.table.root.items).toHaveLength(20);
    f.stop();
  });

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
