import { computed, ref, shallowReactive, unref, watch } from 'vue';
import { useModuleApi } from '../api/module-api';

import type {
  GroupBranch,
  GroupItemPage,
  GroupNode,
  GroupPath,
  GroupValue,
  UseGroupedTableOptions,
} from '../types/grouping';
import type { FilteringState, SortingRule, TableColumn, TableColumnInput } from '../types/table';
import type { TableLoadingMode } from '../types/table-options';
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
  const loadingOptions = options.loading;
  const loadingMode = ref<TableLoadingMode>(loadingOptions ? (loadingOptions.initialMode ?? 'pagination') : 'infinite');
  const preloadGroupItems = Boolean(loadingOptions && (loadingOptions.preloadGroupItems ?? true));
  for (const [name, size] of Object.entries({
    initialGroupItems: loadingOptions?.initialGroupItems,
    groupLoadMoreItems: loadingOptions?.groupLoadMoreItems,
  })) {
    if (size !== undefined && (!Number.isInteger(size) || size < 1 || size > 1000))
      throw new Error(`${name} must be an integer from 1 to 1000.`);
  }
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
  const itemPages = new WeakMap<GroupBranch<TItem>, GroupItemPage>();
  const api = useModuleApi(options.api, options.endpoint);
  let epoch = 0;
  let rowEpoch = 0;
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

  /**
   * Gets the reactive pagination state belonging to a loaded branch.
   * @param {GroupBranch<TItem>} target Branch whose row metadata is requested.
   * @returns {GroupItemPage} Current page and matching row count.
   */
  const pageFor = (target: GroupBranch<TItem>): GroupItemPage => {
    let state = itemPages.get(target);
    if (!state) {
      state = shallowReactive({
        page: 1,
        totalItems: 'count' in target && typeof target.count === 'number' ? target.count : 0,
      });
      itemPages.set(target, state);
    }
    return state;
  };

  /**
   * Gets the page state for a leaf. An empty path addresses the flat table.
   * @param {GroupPath} path Path to the record branch.
   * @returns {GroupItemPage} Reactive page state.
   */
  const getItemPage = (path: GroupPath = []): GroupItemPage => {
    if (path.length !== grouping.value.length) throw new Error('This branch contains groups, not records.');
    return pageFor(path.length ? find(path) : root);
  };

  /**
   * Starts first-page requests for visible leaves eligible for loading.
   * @param {GroupNode<TItem>[]} nodes Visible group headers.
   * @returns {Promise<void>} Completion of the eligible loads.
   */
  const loadVisibleLeaves = async (nodes: GroupNode<TItem>[]) => {
    await Promise.all(
      nodes.map(async (node) => {
        if (node.path.length === grouping.value.length) {
          if (!node.loaded && (node.expanded || (loadingMode.value === 'infinite' && preloadGroupItems))) {
            await load(node.path);
          }
        } else if (node.expanded) {
          await loadVisibleLeaves(node.children);
        }
      }),
    );
  };

  /**
   * Loads a group batch or the requested page or row batch for a record branch.
   * @param {GroupPath} path Branch to load.
   * @param {number} requestedPage Optional page for pagination mode.
   * @returns {Promise<void>} Completion of the branch request.
   */
  const load = async (path: GroupPath = [], requestedPage?: number) => {
    const target = path.length ? find(path) : root;
    const field = grouping.value[path.length];
    const append = loadingMode.value === 'infinite';
    if (target.loading || ((field || append) && !target.hasMore)) return;
    const version = epoch;
    const recordsVersion = rowEpoch;
    /** @returns {boolean} Whether this fetch still owns the branch state. */
    const current = () =>
      version === epoch &&
      (Boolean(field) || (recordsVersion === rowEpoch && append === (loadingMode.value === 'infinite')));
    target.loading = true;
    target.error = undefined;
    let newNodes: GroupNode<TItem>[] = [];
    try {
      if (!validGrouping(grouping.value)) throw new Error('Grouping contains unavailable or repeated fields.');
      const scopedWhere = andWhere(where.value, ...path.map(({ field, value }) => ({ [field]: { equals: value } })));
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
        newNodes = response.data.slice(0, batchSize).map((row): GroupNode<TItem> => {
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
        target.children = [...target.children, ...newNodes];
        target.hasMore = response.data.length > batchSize;
      } else {
        const state = pageFor(target);
        const offset = append ? target.items.length : 0;
        const size =
          append && path.length
            ? ((offset ? loadingOptions?.groupLoadMoreItems : loadingOptions?.initialGroupItems) ?? itemsPerPage.value)
            : itemsPerPage.value;
        const page = append ? Math.floor(offset / size) + 1 : (requestedPage ?? state.page);
        if (!append && page !== state.page) {
          state.page = page;
          target.items = [];
        }
        const query = {
          where: JSON.stringify(scopedWhere ?? {}),
          orderBy: leafOrder.value,
          fields: fields.value,
          include: options.staticInclude,
          perPage: size,
        };
        const { data: first } = await api.query({ ...query, page });
        if (!current()) return;
        const start = offset % size;
        const rows = first.items.slice(start) as TItem[];
        if (start && first.items.length === size && offset + rows.length < first.meta.itemCount) {
          const { data: next } = await api.query({ ...query, page: page + 1 });
          if (!current()) return;
          rows.push(...(next.items.slice(0, size - rows.length) as TItem[]));
        }
        state.totalItems = first.meta.itemCount;
        target.items = append ? [...target.items, ...rows] : rows;
        target.hasMore =
          rows.length > 0 && (append ? target.items.length < state.totalItems : page < first.meta.pageCount);
        await options.onRefreshed?.(target.items);
      }
      if ('loaded' in target) target.loaded = true;
    } catch (error) {
      if (!current()) return;
      target.error = error;
      await options.onError?.(error);
    } finally {
      if (current()) target.loading = false;
    }
    if (newNodes.length && version === epoch && (target === root || ('expanded' in target && target.expanded))) {
      await loadVisibleLeaves(newNodes);
    }
  };

  /** Reloads the root and invalidates all cached branches and in-flight results. */
  const refresh = async () => {
    epoch++;
    Object.assign(root, branch());
    Object.assign(pageFor(root), { page: 1, totalItems: 0 });
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
    if (!node.expanded) return;
    if (!node.loaded) await load(path);
    else await loadVisibleLeaves(node.children);
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

  /**
   * Requests a specific page of rows in pagination mode.
   * @param {GroupPath} path Leaf group path or empty flat-table path.
   * @param {number} page One-based page number.
   * @returns {Promise<void>} Completion of the optional page request.
   */
  const loadItemsPage = async (path: GroupPath, page: number) => {
    if (loadingMode.value !== 'pagination') return;
    const state = getItemPage(path);
    if (!Number.isInteger(page) || page < 1 || page > Math.max(1, Math.ceil(state.totalItems / itemsPerPage.value)))
      return;
    await load(path, page);
  };

  /**
   * Clears cached rows at leaves while retaining the fetched group tree.
   * @param {GroupBranch<TItem>} target Branch to visit.
   * @param {number} depth Number of group levels above the branch.
   */
  const resetRows = (target: GroupBranch<TItem>, depth: number) => {
    if (depth < grouping.value.length) {
      target.children.forEach((child) => resetRows(child, depth + 1));
      return;
    }
    Object.assign(target, branch());
    if ('loaded' in target) target.loaded = false;
    Object.assign(pageFor(target), { page: 1, totalItems: 'count' in target ? target.count : 0 });
  };

  watch(
    [grouping, where, leafOrder, fields, itemsPerPage],
    () => {
      if (initialized) void refresh();
    },
    { deep: true },
  );
  watch(loadingMode, async () => {
    if (!initialized) return;
    rowEpoch++;
    resetRows(root, 0);
    if (!grouping.value.length) await load();
    else await loadVisibleLeaves(root.children);
  });
  return {
    root,
    groups: computed(() => root.children),
    grouping,
    loadingMode,
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
    getItemPage,
    loadItemsPage,
  };
}
