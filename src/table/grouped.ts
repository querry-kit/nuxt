import { computed, shallowReactive, unref, watch } from 'vue';
import { useModuleApi } from '../api/module-api';
import type { GroupBranch, GroupNode, GroupPath, GroupValue, UseGroupedTableOptions } from '../types/grouping';
import type { FilteringState, SortingRule, TableColumn, TableColumnInput } from '../types/table';
import { andWhere } from '../utils/and-where';
import { filteringToWhere } from '../utils/filtering-to-where';
import { pathsToFieldsQuery } from '../utils/paths-to-fields-query';
import { sortingToOrderBy } from '../utils/sorting-to-order-by';
import { browserStorage } from './browser-storage';
import { hasColumnId } from './has-column-id';
import { persistedRef } from './persisted-ref';
import { isFilteringState, isPinningState, isSortingState, isStringArray } from './preference-validation';

/**
 * Loads nested groups and leaf records across all matching resources, one branch at a time.
 *
 * @param {UseGroupedTableOptions<TItem, TColumn>} options Endpoint, scalar grouping fields and portable table preferences.
 * @returns Reactive group tree, column/filter preferences and lazy-loading actions.
 */
export function useGroupedTable<
  TItem extends Record<string, unknown>,
  TColumn extends TableColumnInput<TItem, object> = TableColumnInput<TItem>,
>(options: UseGroupedTableOptions<TItem, TColumn>) {
  const name = options.persistenceKey ?? options.name;
  if (!name) throw new Error('useGroupedTable requires a persistenceKey or name.');
  const batchSize = options.groupBatchSize ?? 25;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000)
    throw new Error('groupBatchSize must be an integer from 1 to 1000.');
  const storage = options.storage ?? browserStorage();
  const key = (suffix: string) => `table:${name}:${suffix}`;
  const allowed = new Set(options.groupableFields.filter((field) => !field.disabled).map((field) => field.value));
  const validGrouping = (value: unknown): value is string[] =>
    Array.isArray(value) &&
    value.every((field: unknown) => typeof field === 'string' && allowed.has(field)) &&
    new Set(value).size === value.length;
  if (!validGrouping(options.defaultGrouping ?? []))
    throw new Error('defaultGrouping contains unavailable or repeated fields.');
  const grouping = persistedRef<string[]>(key('grouping'), options.defaultGrouping ?? [], storage, validGrouping);
  const sorting = persistedRef<SortingRule[]>(key('sort'), [], storage, isSortingState);
  const filtering = persistedRef<FilteringState>(
    key('filtering'),
    { operator: 'AND', filters: [] },
    storage,
    isFilteringState,
  );
  const itemsPerPage = persistedRef(
    key('items-per-page'),
    options.defaultItemsPerPage ?? 25,
    storage,
    (value) => typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 1000,
  );
  if (!Number.isInteger(itemsPerPage.value) || itemsPerPage.value < 1 || itemsPerPage.value > 1000)
    throw new Error('defaultItemsPerPage must be an integer from 1 to 1000.');
  const columnOrder = persistedRef<string[]>(key('column-order'), [], storage, isStringArray);
  const columnVisibility = persistedRef<string[]>(key('invisible-columns'), [], storage, isStringArray);
  const columnPinning = persistedRef<Record<string, string[]>>(key('column-pinning'), {}, storage, isPinningState);
  const identityKey = options.identityKey ?? 'id';
  const availableColumns = computed(() => options.columns.value.filter(hasColumnId));
  watch(
    availableColumns,
    (available) => {
      const ids = available.map((column) => column.id);
      columnOrder.value = [
        ...columnOrder.value.filter((id) => ids.includes(id)),
        ...ids.filter((id) => !columnOrder.value.includes(id)),
      ];
      columnVisibility.value = columnVisibility.value.filter((id) => ids.includes(id));
    },
    { immediate: true, deep: true },
  );
  const columns = computed(() =>
    columnOrder.value
      .map((id) => availableColumns.value.find((column) => column.id === id))
      .filter((column): column is TColumn & TableColumn<TItem> => Boolean(column))
      .filter((column) => !columnVisibility.value.includes(column.id)),
  );
  const fields = computed(() => {
    const paths = new Set<string>([identityKey, ...(options.staticFields ?? []), ...grouping.value]);
    for (const column of columns.value) {
      if (column.id === 'actions') continue;
      if (column.fields?.length) column.fields.forEach((field) => paths.add(`${column.id}.${field}`));
      else paths.add(column.id);
    }
    return pathsToFieldsQuery(paths);
  });
  const where = computed(() =>
    andWhere(
      options.isArchived === undefined ? undefined : { isArchived: options.isArchived },
      unref(options.staticFilter),
      filteringToWhere(filtering.value),
    ),
  );
  const leafOrder = computed(() => {
    const rules = [...sorting.value];
    if (!rules.some((rule) => rule.id === identityKey)) rules.push({ id: identityKey, desc: false });
    return sortingToOrderBy(rules);
  });
  const branch = (): GroupBranch<TItem> => ({
    children: [],
    items: [],
    loading: false,
    error: undefined,
    hasMore: true,
  });
  const root = shallowReactive(branch());
  const api = useModuleApi(options.api, options.endpoint);
  let epoch = 0;
  let initialized = false;

  const find = (path: GroupPath): GroupNode<TItem> => {
    let children = root.children;
    let result: GroupNode<TItem> | undefined;
    for (const part of path) {
      result = children.find((node) => node.field === part.field && Object.is(node.value, part.value));
      if (!result) throw new Error('Unknown group path.');
      children = result.children;
    }
    if (!result) throw new Error('Group path must not be empty.');
    return result;
  };

  const load = async (path: GroupPath = []) => {
    const target = path.length ? find(path) : root;
    if (target.loading || !target.hasMore) return;
    const version = epoch;
    target.loading = true;
    target.error = undefined;
    try {
      if (!validGrouping(grouping.value)) throw new Error('Grouping contains unavailable or repeated fields.');
      const scopedWhere = andWhere(where.value, ...path.map(({ field, value }) => ({ [field]: { equals: value } })));
      const field = grouping.value[path.length];
      if (field) {
        const response = await api.groupBy<Record<string, unknown>>({
          by: [field],
          where: JSON.stringify(scopedWhere ?? {}),
          orderBy: { [field]: 'asc' },
          _count: { _all: true },
          take: batchSize + 1,
          skip: target.children.length,
        });
        if (version !== epoch) return;
        const nodes = response.data.slice(0, batchSize).map((row): GroupNode<TItem> => {
          const value = row[field];
          const count = (row._count as { _all?: unknown } | undefined)?._all;
          if (
            !(
              value === null ||
              typeof value === 'string' ||
              typeof value === 'boolean' ||
              (typeof value === 'number' && Number.isFinite(value))
            ) ||
            typeof count !== 'number' ||
            !Number.isInteger(count) ||
            count < 0
          )
            throw new Error('Invalid group-by response.');
          const nextPath = [...path, { field, value: value as GroupValue }];
          return shallowReactive({
            ...branch(),
            key: JSON.stringify(nextPath),
            path: nextPath,
            field,
            value,
            count,
            expanded: false,
            loaded: false,
          });
        });
        target.children = [...target.children, ...nodes];
        target.hasMore = response.data.length > batchSize;
      } else {
        const response = await api.query({
          where: JSON.stringify(scopedWhere ?? {}),
          orderBy: leafOrder.value,
          fields: fields.value,
          include: options.staticInclude,
          page: Math.floor(target.items.length / itemsPerPage.value) + 1,
          perPage: itemsPerPage.value,
        });
        if (version !== epoch) return;
        target.items = [...target.items, ...(response.data.items as TItem[])];
        target.hasMore = target.items.length < response.data.meta.itemCount;
        await options.onRefreshed?.(target.items);
      }
      if ('loaded' in target) target.loaded = true;
    } catch (error) {
      if (version !== epoch) return;
      target.error = error;
      await options.onError?.(error);
    } finally {
      if (version === epoch) target.loading = false;
    }
  };

  /** Reloads the root and invalidates all cached branches and in-flight results. */
  const refresh = async () => {
    epoch++;
    Object.assign(root, branch());
    await load();
  };
  /** Fetches the root and invokes the consumer's initialization callback. */
  const initialize = async () => {
    initialized = true;
    await refresh();
    await options.onInitialized?.();
  };
  /**
   * Expands/collapses a group, fetching its children on first expansion.
   * @param {GroupPath} path Typed path including the target group.
   * @returns {Promise<void>} Completion of the optional fetch.
   */
  const toggleGroup = async (path: GroupPath) => {
    const node = find(path);
    node.expanded = !node.expanded;
    if (node.expanded && !node.loaded) await load(path);
  };
  /**
   * Appends the next group batch, or retries the previous failed request.
   * @param {GroupPath} parentPath Parent group; omitted for the root.
   * @returns {Promise<void>} Completion of the request.
   */
  const loadMoreGroups = async (parentPath: GroupPath = []) => {
    if (parentPath.length >= grouping.value.length) throw new Error('This branch contains records, not groups.');
    await load(parentPath);
  };
  /**
   * Appends the next record batch at a leaf; an empty path addresses an ungrouped list.
   * @param {GroupPath} path Leaf group path.
   * @returns {Promise<void>} Completion of the request.
   */
  const loadMoreItems = async (path: GroupPath) => {
    if (path.length !== grouping.value.length) throw new Error('This branch contains groups, not records.');
    await load(path);
  };
  watch(
    [grouping, where, leafOrder, fields, itemsPerPage],
    () => {
      if (initialized) void refresh();
    },
    { deep: true },
  );
  return {
    root,
    groups: computed(() => root.children),
    grouping,
    sorting,
    filtering,
    itemsPerPage,
    columns,
    fields,
    columnOrder,
    columnVisibility,
    columnPinning,
    initialize,
    refresh,
    toggleGroup,
    loadMoreGroups,
    loadMoreItems,
  };
}
