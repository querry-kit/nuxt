import type { AxiosInstance } from 'axios';
import { nextTick, ref } from 'vue';

import { useAutocomplete } from '../src/autocomplete';
import { useTable } from '../src/table';
import type { StorageLike, TableColumn } from '../src/types';

type User = { id: string; name: string; owner?: { name: string }; isArchived?: boolean };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
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

  it('persists table preferences, syncs the page, selects fields and updates matching rows', async () => {
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

  it('keeps newer results and errors when an earlier request finishes last', async () => {
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

  it('accepts external URL page changes, uses browser storage and exposes request errors', async () => {
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

  it('continues when browser storage is unavailable or persistence fails', async () => {
    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => {
        throw new Error('storage unavailable');
      },
    });
    const withoutBrowserStorage = useTable<User>({
      api: { get: jest.fn() } as unknown as AxiosInstance,
      endpoint: 'users',
      persistenceKey: 'unavailable-storage',
      columns: ref([{ id: 'name' }]),
    });
    expect(withoutBrowserStorage.itemsPerPage.value).toBe(25);

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

    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
});

describe('useAutocomplete', () => {
  it('merges selected and query items by a configurable identity key', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce({
        data: { items: [{ code: 'a', name: 'Selected' }], meta: { itemCount: 1, pageCount: 1 } },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            { code: 'a', name: 'Search' },
            { code: 'b', name: 'Other' },
          ],
          meta: { itemCount: 2, pageCount: 1 },
        },
      });
    const autocomplete = useAutocomplete<{ code: string; name: string }>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'people',
      currentValue: ref('a'),
      query: ref({ where: { active: true } }),
      identityKey: 'code',
      itemDisabled: (item) => item.code === 'b',
      immediate: false,
    });

    await autocomplete.initialize();
    expect(autocomplete.items.value).toEqual([
      { code: 'a', name: 'Selected', disabled: false },
      { code: 'b', name: 'Other', disabled: true },
    ]);
    expect(get).toHaveBeenNthCalledWith(1, expect.stringContaining('where[active]=true&where[code]=a&perPage=1000'));
  });

  it('clears missing selected values and reports independent request errors', async () => {
    const get = jest.fn().mockRejectedValue(new Error('offline'));
    const autocomplete = useAutocomplete<{ id: string; name: string }>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'people',
      currentValue: ref<string | null>(null),
      immediate: false,
    });

    await autocomplete.loadCurrentItems();
    await autocomplete.loadItems();
    expect(autocomplete.currentValueItems.value).toEqual([]);
    expect(autocomplete.queryItems.value).toEqual([]);
    expect(autocomplete.error.value).toBeInstanceOf(Error);
    expect(autocomplete.loading.value).toBe(false);
  });

  it('clears selected items when their request fails', async () => {
    const autocomplete = useAutocomplete<{ id: string; name: string }>({
      api: { get: jest.fn().mockRejectedValue(new Error('offline')) } as unknown as AxiosInstance,
      endpoint: 'people',
      currentValue: ref('missing'),
      immediate: false,
    });

    await autocomplete.loadCurrentItems();
    expect(autocomplete.currentValueItems.value).toEqual([]);
    expect(autocomplete.error.value).toBeInstanceOf(Error);
    expect(autocomplete.loading.value).toBe(false);
  });

  it('reacts to selected-value and search-query changes without a disabled predicate', async () => {
    const selected = ref<string | null>('one');
    const query = ref({ search: 'first' });
    const get = jest
      .fn()
      .mockResolvedValue({ data: { items: [{ id: 'one', name: 'One' }], meta: { itemCount: 1, pageCount: 1 } } });
    const autocomplete = useAutocomplete<{ id: string; name: string }>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'people',
      currentValue: selected,
      query,
      immediate: false,
    });

    await autocomplete.initialize();
    selected.value = 'two';
    query.value = { search: 'second' };
    await nextTick();
    await Promise.resolve();
    expect(get).toHaveBeenCalledTimes(4);
    expect(autocomplete.items.value).toEqual([{ id: 'one', name: 'One' }]);
  });
});
