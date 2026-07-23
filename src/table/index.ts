import type { AxiosInstance } from 'axios';
import type { MaybeRef, Ref } from 'vue';
import { computed, ref, shallowRef, triggerRef, unref, watch } from 'vue';

import { useModuleApi } from '../module-api';
import type { FilteringState, RoutePageRef, SortingRule, StorageLike, TableColumn, TableColumnInput } from '../types';
import { andWhere, filteringToWhere, parseJson, pathsToFieldsQuery, sortingToOrderBy } from '../utils';

const DEFAULT_ITEMS_PER_PAGE = 25;

/** Configuration for the headless Query Kit table composable. */
export interface UseTableOptions<
  TItem extends Record<string, unknown>,
  TColumn extends TableColumnInput<TItem, object> = TableColumnInput<TItem>,
> {
  /** Axios client created and configured by the consumer. */
  api: AxiosInstance;
  /** Resource endpoint relative to the API version, for example `books`. */
  endpoint: string;
  /** Unique key used for local persistence. `name` is retained as an alias for compatibility. */
  persistenceKey?: string;
  /** Deprecated alias for `persistenceKey`. */
  name?: string;
  /** Reactive column descriptions. Their IDs determine the selected fields. */
  columns: Ref<readonly TColumn[]>;
  /** Fields always included in the backend selection; defaults to `id`. */
  staticFields?: string[];
  /** Static relation include payload sent with every query. */
  staticInclude?: Record<string, unknown>;
  /** Reactive filter added to every request before user-controlled filters. */
  staticFilter?: MaybeRef<Record<string, unknown> | undefined>;
  /** Adds an `isArchived` condition when specified. */
  isArchived?: boolean;
  /** Initial page size when no persisted preference exists; defaults to 25. */
  defaultItemsPerPage?: number;
  /** Persistence adapter; `localStorage` is used automatically when available. */
  storage?: StorageLike;
  /** A ref backed by the consumer's URL query parameter; no router is required. */
  routePage?: RoutePageRef;
  /** Row property used by `updateRow`; defaults to `id`. */
  identityKey?: keyof TItem & string;
  /** Called after the initial request has completed. */
  onInitialized?: () => void | Promise<void>;
  /** Called with current rows after each successful, non-stale request. */
  onRefreshed?: (items: TItem[]) => void | Promise<void>;
  /** Called for the latest request failure. */
  onError?: (error: unknown) => void | Promise<void>;
}

function browserStorage(): StorageLike | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

function persistedRef<T>(key: string, fallback: T, storage?: StorageLike): Ref<T> {
  const state = ref(storage ? parseJson(storage.getItem(key), fallback) : fallback) as Ref<T>;
  watch(
    state,
    (value) => {
      try {
        storage?.setItem(key, JSON.stringify(value));
      } catch {
        // Persistence is optional; quota and privacy errors must not break the table.
      }
    },
    { deep: true },
  );
  return state;
}

function normalisePage(value: unknown): number | undefined {
  const page = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(page) && page > 0 ? page : undefined;
}

/**
 * Fetches Query Kit list data and owns portable table state.
 *
 * Consumers provide route and storage adapters explicitly, keeping the composable usable in Vue and Nuxt alike.
 *
 * @typeParam TItem - Resource shape returned by the endpoint.
 * @param options - Endpoint, reactive columns, and optional routing, persistence, and callback adapters.
 * @returns Reactive table state plus `initialize`, `refresh`, and `updateRow` actions.
 */
function hasColumnId<TItem extends Record<string, unknown>, TColumn extends TableColumnInput<TItem, object>>(
  column: TColumn,
): column is TColumn & TableColumn<TItem> {
  return typeof column.id === 'string' && column.id.length > 0;
}

export function useTable<
  TItem extends Record<string, unknown>,
  TColumn extends TableColumnInput<TItem, object> = TableColumnInput<TItem>,
>(options: UseTableOptions<TItem, TColumn>) {
  const persistenceKey = options.persistenceKey ?? options.name;
  if (!persistenceKey) throw new Error('useTable requires a persistenceKey or name.');
  const storage = options.storage ?? browserStorage();
  const key = (suffix: string) => `table:${persistenceKey}:${suffix}`;
  const identityKey = options.identityKey ?? ('id' as keyof TItem & string);

  const page = ref(normalisePage(options.routePage?.value) ?? 1);
  const itemsPerPage = persistedRef(
    key('items-per-page'),
    options.defaultItemsPerPage ?? DEFAULT_ITEMS_PER_PAGE,
    storage,
  );
  const sorting = persistedRef<SortingRule[]>(key('sort'), [], storage);
  const filtering = persistedRef<FilteringState>(key('filtering'), { operator: 'AND', filters: [] }, storage);
  const columnOrder = persistedRef<string[]>(key('column-order'), [], storage);
  const columnVisibility = persistedRef<string[]>(key('invisible-columns'), [], storage);
  const columnPinning = persistedRef<Record<string, string[]>>(key('column-pinning'), {}, storage);
  const items = shallowRef<TItem[]>([]);
  const totalItems = ref(0);
  const totalPages = ref(0);
  const loading = ref(false);
  const error = ref<unknown>();
  // Only the most recent request may change state; filter/page watchers can overlap.
  let requestVersion = 0;

  const availableColumns = computed(() => options.columns.value.filter(hasColumnId));
  const syncColumnOrder = () => {
    const ids = availableColumns.value.map((column) => column.id);
    columnOrder.value = [
      ...columnOrder.value.filter((id) => ids.includes(id)),
      ...ids.filter((id) => !columnOrder.value.includes(id)),
    ];
    columnVisibility.value = columnVisibility.value.filter((id) => ids.includes(id));
  };
  watch(availableColumns, syncColumnOrder, { immediate: true, deep: true });

  const columns = computed(() =>
    columnOrder.value
      .map((id) => availableColumns.value.find((column) => column.id === id))
      .filter((column): column is TColumn & TableColumn<TItem> => Boolean(column))
      .filter((column) => !columnVisibility.value.includes(column.id)),
  );
  const fields = computed(() => {
    const paths = new Set<string>(options.staticFields ?? ['id']);
    for (const column of columns.value) {
      if (column.id === 'actions') continue;
      if (column.fields?.length) column.fields.forEach((field) => paths.add(`${column.id}.${field}`));
      else paths.add(column.id);
    }
    return pathsToFieldsQuery(paths);
  });
  const staticWhere = computed(() => {
    const archive = options.isArchived === undefined ? undefined : { isArchived: options.isArchived };
    return andWhere(archive, unref(options.staticFilter));
  });
  const where = computed(() => andWhere(staticWhere.value, filteringToWhere(filtering.value)));
  const queryParams = computed(() => ({
    page: page.value,
    perPage: itemsPerPage.value,
    where: where.value ? JSON.stringify(where.value) : undefined,
    orderBy: sortingToOrderBy(sorting.value) ? JSON.stringify(sortingToOrderBy(sorting.value)) : undefined,
    fields: fields.value,
    include: options.staticInclude,
  }));

  watch(page, (value) => {
    if (options.routePage && options.routePage.value !== value) options.routePage.value = value;
  });
  if (options.routePage) {
    watch(options.routePage, (value) => {
      const next = normalisePage(value);
      if (next && next !== page.value) page.value = next;
    });
  }

  const api = useModuleApi(options.api, options.endpoint);
  const refresh = async () => {
    const version = ++requestVersion;
    loading.value = true;
    error.value = undefined;
    try {
      const response = await api.query(queryParams.value);
      if (version !== requestVersion) return;
      items.value = response.data.items as TItem[];
      totalItems.value = response.data.meta.itemCount;
      totalPages.value = response.data.meta.pageCount;
      await options.onRefreshed?.(items.value);
    } catch (caught) {
      if (version !== requestVersion) return;
      error.value = caught;
      await options.onError?.(caught);
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  };

  const initialize = async () => {
    const initialPage = normalisePage(options.routePage?.value);
    if (initialPage) page.value = initialPage;
    await refresh();
    await options.onInitialized?.();
  };

  const updateRow = (row: TItem) => {
    const identity = row[identityKey];
    const index = items.value.findIndex((item) => Object.is(item[identityKey], identity));
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...row };
      triggerRef(items);
    }
  };

  watch([queryParams, fields], () => void refresh(), { deep: true });

  return {
    page,
    itemsPerPage,
    sorting,
    filtering,
    columnOrder,
    columnVisibility,
    columnPinning,
    columns,
    fields,
    items,
    totalItems,
    totalPages,
    loading,
    error,
    queryParams,
    initialize,
    refresh,
    updateRow,
  };
}
