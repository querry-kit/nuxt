import { computed, ref, shallowRef, triggerRef, unref, watch } from 'vue';
import { useModuleApi } from '../api';
import type { FilteringState, SortingRule, TableColumn, TableColumnInput } from '../types/table';
import type { UseTableOptions } from '../types/table-options';
import { andWhere } from '../utils/and-where';
import { filteringToWhere } from '../utils/filtering-to-where';
import { pathsToFieldsQuery } from '../utils/paths-to-fields-query';
import { sortingToOrderBy } from '../utils/sorting-to-order-by';
import { browserStorage } from './browser-storage';
import { hasColumnId } from './has-column-id';
import { normalisePage } from './normalize-page';
import { persistedRef } from './persisted-ref';

const DEFAULT_ITEMS_PER_PAGE = 25;

/**
 * Fetches Query Kit list data and owns portable headless-table state.
 *
 * @typeParam TItem - Resource shape returned by the endpoint.
 * @typeParam TColumn - Renderer-specific column shape retained alongside the Query Kit column metadata.
 * @param options - Endpoint, reactive columns, and optional routing, persistence, and callback adapters.
 * @returns Reactive query and table state plus `initialize`, `refresh`, and `updateRow` actions.
 *
 * @remarks
 * The composable deliberately receives route and storage adapters from its consumer, so it can run
 * in Vue and Nuxt applications without depending on either application's router or runtime state.
 * Overlapping requests are versioned, ensuring an older response cannot overwrite newer table data.
 */
export function useTable<
  TItem extends Record<string, unknown>,
  TColumn extends TableColumnInput<TItem, object> = TableColumnInput<TItem>,
>(options: UseTableOptions<TItem, TColumn>) {
  const persistenceKey = options.persistenceKey ?? options.name;
  if (!persistenceKey) throw new Error('useTable requires a persistenceKey or name.');
  const storage = options.storage ?? browserStorage();
  // Namespace every persisted preference to prevent tables from sharing state accidentally.
  const key = (suffix: string) => `table:${persistenceKey}:${suffix}`;
  const identityKey = options.identityKey ?? ('id' as keyof TItem & string);

  /** Current page, optionally synchronized with a consumer-owned route ref. */
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
  // Only the most recent request may change state; query watchers can overlap.
  let requestVersion = 0;

  /** Columns with IDs, which are the only columns that participate in selection and persistence. */
  const availableColumns = computed(() => options.columns.value.filter(hasColumnId));
  /** Reconciles persisted column preferences with columns that are currently available. */
  const syncColumnOrder = () => {
    const ids = availableColumns.value.map((column) => column.id);
    columnOrder.value = [
      ...columnOrder.value.filter((id) => ids.includes(id)),
      ...ids.filter((id) => !columnOrder.value.includes(id)),
    ];
    columnVisibility.value = columnVisibility.value.filter((id) => ids.includes(id));
  };
  watch(availableColumns, syncColumnOrder, { immediate: true, deep: true });

  /** Visible columns in the user's persisted order. */
  const columns = computed(() =>
    columnOrder.value
      .map((id) => availableColumns.value.find((column) => column.id === id))
      .filter((column): column is TColumn & TableColumn<TItem> => Boolean(column))
      .filter((column) => !columnVisibility.value.includes(column.id)),
  );
  /** Query Kit field projection derived from visible data columns and required static fields. */
  const fields = computed(() => {
    const paths = new Set<string>(options.staticFields ?? ['id']);
    for (const column of columns.value) {
      if (column.id === 'actions') continue;
      if (column.fields?.length) column.fields.forEach((field) => paths.add(`${column.id}.${field}`));
      else paths.add(column.id);
    }
    return pathsToFieldsQuery(paths);
  });
  /** Filter that is always applied before user-controlled table filters. */
  const staticWhere = computed(() => {
    const archive = options.isArchived === undefined ? undefined : { isArchived: options.isArchived };
    return andWhere(archive, unref(options.staticFilter));
  });
  const where = computed(() => andWhere(staticWhere.value, filteringToWhere(filtering.value)));
  /** Serialized list-query parameters for the active page, filters, sorting, fields, and includes. */
  const queryParams = computed(() => ({
    page: page.value,
    perPage: itemsPerPage.value,
    where: where.value ? JSON.stringify(where.value) : undefined,
    orderBy: sortingToOrderBy(sorting.value) ? JSON.stringify(sortingToOrderBy(sorting.value)) : undefined,
    fields: fields.value,
    include: options.staticInclude,
  }));

  // Synchronize in both directions without requiring a Vue Router dependency.
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
  /**
   * Fetches the current query and replaces the rows and pagination metadata.
   *
   * A response is discarded when a newer request started before it settled.
   */
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

  /** Restores the initial route page, performs the first fetch, and then invokes `onInitialized`. */
  const initialize = async () => {
    const initialPage = normalisePage(options.routePage?.value);
    if (initialPage) page.value = initialPage;
    await refresh();
    await options.onInitialized?.();
  };

  /**
   * Merges an updated row into the loaded rows without refetching the table.
   *
   * The identity property defaults to `id` and can be configured through `identityKey`.
   */
  const updateRow = (row: TItem) => {
    const identity = row[identityKey];
    const index = items.value.findIndex((item) => Object.is(item[identityKey], identity));
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...row };
      triggerRef(items);
    }
  };

  // Any query-input change reloads data; stale-response protection in `refresh` handles overlap.
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
