import type { AxiosInstance } from 'axios';
import { nextTick, ref } from 'vue';

import type { StorageLike, TableColumn, TableColumnInput } from '../types';
import { useTable } from './index';

type User = { id: string; name: string; owner?: { name: string }; isArchived?: boolean };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function memoryStorage(): StorageLike & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return { values, getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

describe('useTable', () => {
  it('requires an explicit persistence key', () => {
    expect(() =>
      useTable<User>({
        api: { get: jest.fn() } as unknown as AxiosInstance,
        endpoint: 'users',
        columns: ref([{ id: 'name' }]),
      }),
    ).toThrow('persistenceKey');
  });

  it('persists preferences, syncs the page, selects fields, and updates matching rows', async () => {
    const get = jest
      .fn()
      .mockResolvedValue({ data: { items: [{ id: '1', name: 'Ada' }], meta: { itemCount: 1, pageCount: 1 } } });
    const storage = memoryStorage();
    const routePage = ref<string | number>('3');
    const columns = ref<readonly TableColumn<User>[]>([
      { id: 'name' },
      { id: 'owner', fields: ['name'] },
      { id: 'actions' },
    ]);
    const table = useTable<User>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'users',
      persistenceKey: 'users',
      columns,
      routePage,
      storage,
      staticFilter: ref({ tenantId: 'tenant' }),
      isArchived: false,
    });

    await table.initialize();
    expect(table.page.value).toBe(3);
    expect(table.fields.value).toBe('id,name,owner{name}');
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining(
        'where=%7B%22AND%22%3A%5B%7B%22isArchived%22%3Afalse%7D%2C%7B%22tenantId%22%3A%22tenant%22%7D%5D%7D',
      ),
    );
    table.itemsPerPage.value = 50;
    table.columnVisibility.value = ['owner'];
    table.page.value = 4;
    await nextTick();
    expect(routePage.value).toBe(4);
    expect(storage.values.get('table:users:items-per-page')).toBe('50');
    expect(table.columns.value.map((column) => column.id)).toEqual(['name', 'actions']);
    table.updateRow({ id: '1', name: 'Grace' });
    expect(table.items.value).toEqual([{ id: '1', name: 'Grace' }]);
  });

  it('keeps newer results when an earlier request finishes last', async () => {
    const first = deferred<{ data: { items: User[]; meta: { itemCount: number; pageCount: number } } }>();
    const second = deferred<{ data: { items: User[]; meta: { itemCount: number; pageCount: number } } }>();
    const get = jest.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const table = useTable<User>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'users',
      persistenceKey: 'stale-users',
      columns: ref([{ id: 'name' }]),
      storage: memoryStorage(),
    });

    const oldRequest = table.refresh();
    const newRequest = table.refresh();
    second.resolve({ data: { items: [{ id: 'new', name: 'New' }], meta: { itemCount: 1, pageCount: 1 } } });
    await newRequest;
    first.resolve({ data: { items: [{ id: 'old', name: 'Old' }], meta: { itemCount: 1, pageCount: 1 } } });
    await oldRequest;

    expect(table.items.value).toEqual([{ id: 'new', name: 'New' }]);
    expect(table.loading.value).toBe(false);
  });

  it('ignores an error from a request superseded by a newer result', async () => {
    const first = deferred<{ data: { items: User[]; meta: { itemCount: number; pageCount: number } } }>();
    const get = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ data: { items: [{ id: 'new', name: 'New' }], meta: { itemCount: 1, pageCount: 1 } } });
    const table = useTable<User>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'users',
      persistenceKey: 'stale-error-users',
      columns: ref([{ id: 'name' }]),
      storage: memoryStorage(),
    });

    const oldRequest = table.refresh();
    await table.refresh();
    first.reject(new Error('offline'));
    await oldRequest;

    expect(table.items.value).toEqual([{ id: 'new', name: 'New' }]);
    expect(table.error.value).toBeUndefined();
  });

  it('uses browser storage and exposes request errors', async () => {
    const values = new Map<string, string>();
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
    const onError = jest.fn();
    const get = jest.fn().mockRejectedValue(new Error('offline'));
    const routePage = ref<number | string | null | undefined>(1);
    const table = useTable<User>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'users',
      persistenceKey: 'browser-users',
      columns: ref([{ id: 'name' }]),
      routePage,
      onError,
    });

    await table.refresh();
    routePage.value = '5';
    await nextTick();
    table.itemsPerPage.value = 10;
    await nextTick();

    expect(table.error.value).toBeInstanceOf(Error);
    expect(onError).toHaveBeenCalled();
    expect(table.page.value).toBe(5);
    expect(values.get('table:browser-users:items-per-page')).toBe('10');
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  it('continues when persistence fails', async () => {
    const persistenceError = useTable<User>({
      api: { get: jest.fn() } as unknown as AxiosInstance,
      endpoint: 'users',
      persistenceKey: 'unwritable-storage',
      columns: ref([{ id: 'name' }]),
      storage: {
        getItem: () => null,
        setItem: () => {
          throw new Error('quota exceeded');
        },
      },
    });
    persistenceError.itemsPerPage.value = 10;
    await nextTick();

    expect(persistenceError.itemsPerPage.value).toBe(10);
  });

  it('uses default query state, lifecycle callbacks, and full renderer metadata', async () => {
    const get = jest
      .fn()
      .mockResolvedValue({ data: { items: [{ id: '1', name: 'Ada' }], meta: { itemCount: 1, pageCount: 1 } } });
    const onInitialized = jest.fn();
    const onRefreshed = jest.fn();
    const table = useTable<User, TableColumnInput<User, { header: string; accessorKey?: string }>>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'users',
      persistenceKey: 'metadata-users',
      columns: ref([{ id: 'name', header: 'Name', accessorKey: 'name' }, { header: 'Conditional column' }]),
      storage: memoryStorage(),
      onInitialized,
      onRefreshed,
    });

    await table.initialize();

    expect(table.page.value).toBe(1);
    expect(table.queryParams.value.where).toBeUndefined();
    expect(table.queryParams.value.orderBy).toBeUndefined();
    table.sorting.value = [{ id: 'name', desc: false }];
    expect(table.queryParams.value.orderBy).toBe('[{"name":"asc"}]');
    expect(onRefreshed).toHaveBeenCalledWith([{ id: '1', name: 'Ada' }]);
    expect(onInitialized).toHaveBeenCalledTimes(1);
    expect(table.columns.value).toEqual([{ id: 'name', header: 'Name', accessorKey: 'name' }]);
    expect(table.fields.value).toBe('id,name');
  });
});
