import {
  useModuleApi
} from "./chunk-UV6CMWG7.js";
import {
  andWhere,
  filteringToWhere,
  parseJson,
  pathsToFieldsQuery,
  sortingToOrderBy
} from "./chunk-YS2BVSJL.js";

// src/table/index.ts
import { computed as computed3, ref as ref3, shallowRef, triggerRef, unref as unref2, watch as watch3 } from "vue";

// src/table/browser-storage.ts
function browserStorage() {
  try {
    return typeof globalThis.localStorage === "undefined" ? void 0 : globalThis.localStorage;
  } catch {
    return void 0;
  }
}

// src/table/has-column-id.ts
function hasColumnId(column) {
  return typeof column.id === "string" && column.id.length > 0;
}

// src/table/normalize-page.ts
function normalisePage(value) {
  const page = typeof value === "number" ? value : Number(value);
  return Number.isInteger(page) && page > 0 ? page : void 0;
}

// src/table/persisted-ref.ts
import { ref, watch } from "vue";
function persistedRef(key, fallback, storage, validate = (value) => value !== null && typeof value === typeof fallback) {
  let initial = fallback;
  try {
    const saved = parseJson(storage?.getItem(key), fallback);
    if (validate(saved)) initial = saved;
  } catch {
  }
  const state = ref(initial);
  watch(
    state,
    (value) => {
      try {
        storage?.setItem(key, JSON.stringify(value));
      } catch {
      }
    },
    { deep: true }
  );
  return state;
}

// src/table/preference-validation.ts
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function isSortingState(value) {
  return Array.isArray(value) && value.every(
    (item) => item !== null && typeof item === "object" && typeof item.id === "string" && typeof item.desc === "boolean"
  );
}
function isFilteringState(value) {
  if (value === null || typeof value !== "object") return false;
  const group = value;
  return (group.operator === "AND" || group.operator === "OR") && Array.isArray(group.filters) && group.filters.every(
    (filter) => filter !== null && typeof filter === "object" && typeof filter.id === "string" && typeof filter.field === "string" && (filter.operator === void 0 || ["in", "notIn", "equals", "not", "lt", "lte", "gt", "gte"].includes(filter.operator))
  );
}
function isPinningState(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.entries(value).every(([key, ids]) => ["left", "right"].includes(key) && isStringArray(ids));
}

// src/table/grouped.ts
import { computed, getCurrentScope, onScopeDispose, ref as ref2, shallowReactive, unref, watch as watch2 } from "vue";
function useGroupedTable(options) {
  const name = options.persistenceKey ?? options.name;
  if (!name) throw new Error("useGroupedTable requires a persistenceKey or name.");
  const batchSize = options.groupBatchSize ?? 25;
  const sumFields = options.groupSumFields ?? [];
  const sumSelector = sumFields.length ? Object.fromEntries(sumFields.map((field) => [field, true])) : void 0;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1e3)
    throw new Error("groupBatchSize must be an integer from 1 to 1000.");
  const storage = options.storage ?? browserStorage();
  const key = (suffix) => `table:${name}:${suffix}`;
  const allowed = new Set(options.groupableFields.filter((field) => !field.disabled).map((field) => field.value));
  const validGrouping = (value) => Array.isArray(value) && value.every((field) => typeof field === "string" && allowed.has(field)) && new Set(value).size === value.length;
  if (!validGrouping(options.defaultGrouping ?? []))
    throw new Error("defaultGrouping contains unavailable or repeated fields.");
  const grouping = persistedRef(key("grouping"), options.defaultGrouping ?? [], storage, validGrouping);
  const expandedPaths = options.persistExpansion ? persistedRef(key("expanded-groups"), [], storage, isStringArray) : void 0;
  const expandedKeys = computed(() => new Set(expandedPaths?.value));
  const loadingOptions = options.loading;
  const loadingMode = ref2(loadingOptions ? loadingOptions.initialMode ?? "pagination" : "infinite");
  const preloadGroupItems = Boolean(loadingOptions && (loadingOptions.preloadGroupItems ?? true));
  for (const [name2, size] of Object.entries({
    initialGroupItems: loadingOptions?.initialGroupItems,
    groupLoadMoreItems: loadingOptions?.groupLoadMoreItems
  })) {
    if (size !== void 0 && (!Number.isInteger(size) || size < 1 || size > 1e3))
      throw new Error(`${name2} must be an integer from 1 to 1000.`);
  }
  const sorting = persistedRef(key("sort"), [], storage, isSortingState);
  const filtering = persistedRef(
    key("filtering"),
    { operator: "AND", filters: [] },
    storage,
    isFilteringState
  );
  const itemsPerPage = persistedRef(
    key("items-per-page"),
    options.defaultItemsPerPage ?? 25,
    storage,
    (value) => typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 1e3
  );
  if (!Number.isInteger(itemsPerPage.value) || itemsPerPage.value < 1 || itemsPerPage.value > 1e3)
    throw new Error("defaultItemsPerPage must be an integer from 1 to 1000.");
  const columnOrder = persistedRef(key("column-order"), [], storage, isStringArray);
  const columnVisibility = persistedRef(key("invisible-columns"), [], storage, isStringArray);
  const columnPinning = persistedRef(key("column-pinning"), {}, storage, isPinningState);
  const identityKey = options.identityKey ?? "id";
  const availableColumns = computed(() => options.columns.value.filter(hasColumnId));
  watch2(
    availableColumns,
    (available) => {
      const ids = available.map((column) => column.id);
      columnOrder.value = [
        ...columnOrder.value.filter((id) => ids.includes(id)),
        ...ids.filter((id) => !columnOrder.value.includes(id))
      ];
      columnVisibility.value = columnVisibility.value.filter((id) => ids.includes(id));
    },
    { immediate: true, deep: true }
  );
  const columns = computed(
    () => columnOrder.value.map((id) => availableColumns.value.find((column) => column.id === id)).filter((column) => Boolean(column)).filter((column) => !columnVisibility.value.includes(column.id))
  );
  const fields = computed(() => {
    const paths = /* @__PURE__ */ new Set([identityKey, ...options.staticFields ?? [], ...grouping.value]);
    for (const column of columns.value) {
      if (column.id === "actions") continue;
      if (column.fields?.length) column.fields.forEach((field) => paths.add(`${column.id}.${field}`));
      else paths.add(column.id);
    }
    return pathsToFieldsQuery(paths);
  });
  const where = computed(
    () => andWhere(
      options.isArchived === void 0 ? void 0 : { isArchived: options.isArchived },
      unref(options.staticFilter),
      filteringToWhere(filtering.value)
    )
  );
  const leafOrder = computed(() => {
    const rules = [...sorting.value];
    if (!rules.some((rule) => rule.id === identityKey)) rules.push({ id: identityKey, desc: false });
    return sortingToOrderBy(rules);
  });
  const groupOrder = computed(
    () => grouping.value.map(
      (field) => [field, sorting.value.find(({ id }) => id === field)?.desc ? "desc" : "asc"]
    )
  );
  const groupOrderKey = computed(() => JSON.stringify(groupOrder.value));
  const branch = () => ({
    children: [],
    items: [],
    loading: false,
    error: void 0,
    hasMore: true
  });
  const root = shallowReactive(branch());
  const itemPages = /* @__PURE__ */ new WeakMap();
  const api = useModuleApi(options.api, options.endpoint);
  let epoch = 0;
  let rowEpoch = 0;
  let initialized = false;
  let bulkExpansion = 0;
  if (getCurrentScope()) onScopeDispose(() => void bulkExpansion++);
  const find = (path) => {
    let children = root.children;
    let result;
    for (const part of path) {
      result = children.find((node) => node.field === part.field && Object.is(node.value, part.value));
      if (!result) throw new Error("Unknown group path.");
      children = result.children;
    }
    if (!result) throw new Error("Group path must not be empty.");
    return result;
  };
  const pageFor = (target) => {
    let state = itemPages.get(target);
    if (!state) {
      state = shallowReactive({
        page: 1,
        totalItems: "count" in target && typeof target.count === "number" ? target.count : 0
      });
      itemPages.set(target, state);
    }
    return state;
  };
  const getItemPage = (path = []) => {
    if (path.length !== grouping.value.length) throw new Error("This branch contains groups, not records.");
    return pageFor(path.length ? find(path) : root);
  };
  const loadVisibleBranches = async (nodes) => {
    await Promise.all(
      nodes.map(async (node) => {
        const leaf = node.path.length === grouping.value.length;
        if (!node.loaded && (node.expanded || leaf && loadingMode.value === "infinite" && preloadGroupItems)) {
          await load(node.path);
        } else if (!leaf && node.expanded) {
          await loadVisibleBranches(node.children);
        }
      })
    );
  };
  const load = async (path = [], requestedPage) => {
    const target = path.length ? find(path) : root;
    const field = grouping.value[path.length];
    const append = loadingMode.value === "infinite";
    if (target.loading || (field || append) && !target.hasMore) return;
    const version = epoch;
    const recordsVersion = rowEpoch;
    const current = () => version === epoch && (Boolean(field) || recordsVersion === rowEpoch && append === (loadingMode.value === "infinite"));
    target.loading = true;
    target.error = void 0;
    let newNodes = [];
    try {
      if (!validGrouping(grouping.value)) throw new Error("Grouping contains unavailable or repeated fields.");
      const scopedWhere = andWhere(where.value, ...path.map(({ field: field2, value }) => ({ [field2]: { equals: value } })));
      if (field) {
        const response = await api.groupBy({
          by: [field],
          where: JSON.stringify(scopedWhere ?? {}),
          orderBy: { [field]: groupOrder.value[path.length]?.[1] ?? "asc" },
          _count: { _all: true },
          ...sumSelector && { _sum: sumSelector },
          take: batchSize + 1,
          skip: target.children.length
        });
        if (version !== epoch) return;
        newNodes = response.data.slice(0, batchSize).map((row) => {
          const value = row[field];
          const count = row._count?._all;
          if (!(value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) || typeof count !== "number" || !Number.isInteger(count) || count < 0)
            throw new Error("Invalid group-by response.");
          const nextPath = [...path, { field, value }];
          const pathKey = JSON.stringify(nextPath);
          const sums = row._sum;
          const sum = sumSelector ? Object.fromEntries(
            sumFields.map((key2) => {
              const total = sums?.[key2];
              if (total !== null && (typeof total !== "number" || !Number.isFinite(total))) {
                throw new Error("Invalid group-by sum.");
              }
              return [key2, total];
            })
          ) : void 0;
          return shallowReactive({
            ...branch(),
            key: pathKey,
            path: nextPath,
            field,
            value,
            count,
            ...sum && { sum },
            expanded: expandedKeys.value.has(pathKey),
            loaded: false
          });
        });
        target.children = [...target.children, ...newNodes];
        target.hasMore = response.data.length > batchSize;
      } else {
        const state = pageFor(target);
        const offset = append ? target.items.length : 0;
        const size = append && path.length ? (offset ? loadingOptions?.groupLoadMoreItems : loadingOptions?.initialGroupItems) ?? itemsPerPage.value : itemsPerPage.value;
        const page = append ? Math.floor(offset / size) + 1 : requestedPage ?? state.page;
        if (!append) state.requestedPage = page;
        const query = {
          where: JSON.stringify(scopedWhere ?? {}),
          orderBy: leafOrder.value,
          fields: fields.value,
          include: options.staticInclude,
          perPage: size
        };
        const { data: first } = await api.query({ ...query, page });
        if (!current()) return;
        const start = offset % size;
        const rows = first.items.slice(start);
        if (start && first.items.length === size && offset + rows.length < first.meta.itemCount) {
          const { data: next } = await api.query({ ...query, page: page + 1 });
          if (!current()) return;
          rows.push(...next.items.slice(0, size - rows.length));
        }
        state.totalItems = first.meta.itemCount;
        if (!append) {
          state.page = page;
          delete state.requestedPage;
        }
        target.items = append ? [...target.items, ...rows] : rows;
        target.hasMore = rows.length > 0 && (append ? target.items.length < state.totalItems : page < first.meta.pageCount);
        await options.onRefreshed?.(target.items);
      }
      if ("loaded" in target) target.loaded = true;
    } catch (error) {
      if (!current()) return;
      target.error = error;
      await options.onError?.(error);
    } finally {
      if (current()) target.loading = false;
    }
    if (newNodes.length && version === epoch && (target === root || "expanded" in target && target.expanded)) {
      await loadVisibleBranches(newNodes);
    }
  };
  const refresh = async () => {
    epoch++;
    Object.assign(root, branch());
    const state = pageFor(root);
    Object.assign(state, { page: 1, totalItems: 0 });
    delete state.requestedPage;
    await load();
  };
  const initialize = async () => {
    initialized = true;
    await refresh();
    await options.onInitialized?.();
  };
  const toggleGroup = async (path) => {
    const node = find(path);
    node.expanded = !node.expanded;
    if (expandedPaths) {
      const next = new Set(expandedKeys.value);
      if (node.expanded) next.add(node.key);
      else next.delete(node.key);
      expandedPaths.value = [...next];
    }
    if (!node.expanded) return;
    if (!node.loaded) await load(path);
    else await loadVisibleBranches(node.children);
  };
  const areGroupsExpanded = (target, depth) => {
    if (depth === grouping.value.length) return true;
    return (!target.hasMore || Boolean(target.error)) && target.children.every((node) => node.expanded && areGroupsExpanded(node, depth + 1));
  };
  const allGroupsExpanded = computed(() => root.children.length > 0 && areGroupsExpanded(root, 0));
  const collapseGroups = (nodes) => {
    for (const node of nodes) {
      node.expanded = false;
      collapseGroups(node.children);
    }
  };
  const setAllGroupsExpanded = async (expanded) => {
    const operation = ++bulkExpansion;
    if (!grouping.value.length) return;
    if (!expanded) {
      collapseGroups(root.children);
      if (expandedPaths) expandedPaths.value = [];
      return;
    }
    const version = epoch;
    const current = () => operation === bulkExpansion && version === epoch;
    const expandBranch = async (target, path) => {
      if (path.length === grouping.value.length) return;
      while (current() && target.hasMore && !target.loading && !target.error) await load(path);
      for (const node of target.children) {
        if (!current()) return;
        if (!node.expanded) await toggleGroup(node.path);
        else if (!node.loaded) await load(node.path);
        if (current() && node.expanded) await expandBranch(node, node.path);
      }
    };
    await expandBranch(root, []);
  };
  const loadMoreGroups = async (parentPath = []) => {
    if (parentPath.length >= grouping.value.length) throw new Error("This branch contains records, not groups.");
    await load(parentPath);
  };
  const loadMoreItems = async (path) => {
    if (path.length !== grouping.value.length) throw new Error("This branch contains groups, not records.");
    await load(path);
  };
  const loadItemsPage = async (path, page) => {
    if (loadingMode.value !== "pagination") return;
    const state = getItemPage(path);
    if (!Number.isInteger(page) || page < 1 || page > Math.max(1, Math.ceil(state.totalItems / itemsPerPage.value)))
      return;
    await load(path, page);
  };
  const resetRows = (target, depth) => {
    if (depth < grouping.value.length) {
      target.children.forEach((child) => resetRows(child, depth + 1));
      return;
    }
    Object.assign(target, branch());
    if ("loaded" in target) target.loaded = false;
    const state = pageFor(target);
    Object.assign(state, { page: 1, totalItems: "count" in target ? target.count : 0 });
    delete state.requestedPage;
  };
  watch2(
    [groupOrderKey, where, fields, itemsPerPage, leafOrder],
    async (current, previous) => {
      if (!initialized) return;
      if (!grouping.value.length || current.slice(0, 3).some((value, index) => value !== previous[index])) {
        await refresh();
        return;
      }
      rowEpoch++;
      resetRows(root, 0);
      await loadVisibleBranches(root.children);
    },
    { deep: true }
  );
  watch2(loadingMode, async () => {
    if (!initialized) return;
    rowEpoch++;
    resetRows(root, 0);
    if (!grouping.value.length) await load();
    else await loadVisibleBranches(root.children);
  });
  return {
    root,
    groups: computed(() => root.children),
    allGroupsExpanded,
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
    setAllGroupsExpanded,
    loadMoreGroups,
    loadMoreItems,
    getItemPage,
    loadItemsPage
  };
}

// src/table/grouped-selection.ts
import { computed as computed2, shallowReactive as shallowReactive2 } from "vue";
function useGroupedSelection(getId) {
  const groups = shallowReactive2(/* @__PURE__ */ new Map());
  const items = shallowReactive2(/* @__PURE__ */ new Map());
  function groupDefault(matches) {
    let depth = 0;
    let checked = false;
    for (const rule of groups.values()) {
      const { path } = rule.node;
      if (path.length > depth && matches(path)) {
        depth = path.length;
        checked = rule.checked;
      }
    }
    return checked;
  }
  function isSelected(item) {
    const id = getId(item);
    if (!id) return false;
    return items.get(id)?.checked ?? groupDefault(
      /** Matches the item against a group path. */
      (path) => inGroup(item, path)
    );
  }
  function selectItems(records, checked) {
    for (const item of records) {
      const id = getId(item);
      if (!id) continue;
      if (checked === groupDefault(
        /** Matches the item against a group path. */
        (path) => inGroup(item, path)
      ))
        items.delete(id);
      else items.set(id, { item, checked });
    }
  }
  function selectGroup(node, checked) {
    for (const [key, rule] of groups) {
      if (isUnder(rule.node.path, node.path)) groups.delete(key);
    }
    for (const [id, rule] of items) {
      if (inGroup(rule.item, node.path)) items.delete(id);
    }
    if (checked !== groupDefault(
      /** Matches ancestor rules. */
      (path) => isUnder(node.path, path)
    )) {
      groups.set(node.key, { node, checked });
    }
  }
  function countSelected(node) {
    let count = node && groupDefault(
      /** Finds the inherited state of this branch. */
      (path) => isUnder(node.path, path)
    ) ? node.count : 0;
    for (const rule of groups.values()) {
      if (!node || rule.node.path.length > node.path.length && isUnder(rule.node.path, node.path)) {
        count += rule.checked ? rule.node.count : -rule.node.count;
      }
    }
    for (const rule of items.values()) {
      if (!node || inGroup(rule.item, node.path)) count += rule.checked ? 1 : -1;
    }
    return count;
  }
  const selectedCount = computed2(
    /** Counts selections across all groups and pages. */
    () => countSelected()
  );
  function groupState(node) {
    const count = countSelected(node);
    return count > 0 && (count >= node.count ? true : "indeterminate");
  }
  function getSelection() {
    const includedGroups = [];
    const excludedGroups = [];
    const ids = [];
    const excludedIds = [];
    for (const rule of groups.values()) (rule.checked ? includedGroups : excludedGroups).push(rule.node.path);
    for (const [id, rule] of items) (rule.checked ? ids : excludedIds).push(id);
    return { includedGroups, excludedGroups, ids, excludedIds };
  }
  function clearSelection() {
    groups.clear();
    items.clear();
  }
  return { selectedCount, isSelected, groupState, selectItems, selectGroup, getSelection, clearSelection };
}
function isUnder(path, prefix) {
  return prefix.every(
    /** Compares path values at the same depth. */
    ({ field, value }, index) => path[index]?.field === field && path[index]?.value === value
  );
}
function inGroup(item, path) {
  return path.every(
    /** Matches each ancestor value. */
    ({ field, value }) => item[field] === value
  );
}

// src/table/index.ts
var DEFAULT_ITEMS_PER_PAGE = 25;
function useTable(options) {
  const persistenceKey = options.persistenceKey ?? options.name;
  if (!persistenceKey) throw new Error("useTable requires a persistenceKey or name.");
  const storage = options.storage ?? browserStorage();
  const key = (suffix) => `table:${persistenceKey}:${suffix}`;
  const identityKey = options.identityKey ?? "id";
  const loadingMode = ref3(options.initialMode ?? "pagination");
  const page = ref3(loadingMode.value === "infinite" ? 1 : normalisePage(options.routePage?.value) ?? 1);
  const itemsPerPage = persistedRef(
    key("items-per-page"),
    options.defaultItemsPerPage ?? DEFAULT_ITEMS_PER_PAGE,
    storage,
    (value) => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 1e3
  );
  const sorting = persistedRef(key("sort"), [], storage, isSortingState);
  const filtering = persistedRef(
    key("filtering"),
    { operator: "AND", filters: [] },
    storage,
    isFilteringState
  );
  const columnOrder = persistedRef(key("column-order"), [], storage, isStringArray);
  const columnVisibility = persistedRef(key("invisible-columns"), [], storage, isStringArray);
  const columnPinning = persistedRef(key("column-pinning"), {}, storage, isPinningState);
  const items = shallowRef([]);
  const totalItems = ref3(0);
  const totalPages = ref3(0);
  const loading = ref3(false);
  const error = ref3();
  let requestVersion = 0;
  const nextPage = ref3(1);
  const hasMore = computed3(() => loadingMode.value === "infinite" && nextPage.value <= totalPages.value);
  const availableColumns = computed3(() => options.columns.value.filter(hasColumnId));
  const syncColumnOrder = () => {
    const ids = availableColumns.value.map((column) => column.id);
    columnOrder.value = [
      ...columnOrder.value.filter((id) => ids.includes(id)),
      ...ids.filter((id) => !columnOrder.value.includes(id))
    ];
    columnVisibility.value = columnVisibility.value.filter((id) => ids.includes(id));
  };
  watch3(availableColumns, syncColumnOrder, { immediate: true, deep: true });
  const columns = computed3(
    () => columnOrder.value.map((id) => availableColumns.value.find((column) => column.id === id)).filter((column) => Boolean(column)).filter((column) => !columnVisibility.value.includes(column.id))
  );
  const fields = computed3(() => {
    const paths = new Set(options.staticFields ?? ["id"]);
    for (const column of columns.value) {
      if (column.id === "actions") continue;
      if (column.fields?.length) column.fields.forEach((field) => paths.add(`${column.id}.${field}`));
      else paths.add(column.id);
    }
    return pathsToFieldsQuery(paths);
  });
  const staticWhere = computed3(() => {
    const archive = options.isArchived === void 0 ? void 0 : { isArchived: options.isArchived };
    return andWhere(archive, unref2(options.staticFilter));
  });
  const where = computed3(() => andWhere(staticWhere.value, filteringToWhere(filtering.value)));
  const orderBy = computed3(() => {
    const rules = sorting.value;
    return sortingToOrderBy(
      loadingMode.value === "infinite" && !rules.some((rule) => rule.id === identityKey) ? [...rules, { id: identityKey, desc: false }] : rules
    );
  });
  const queryParams = computed3(() => ({
    page: loadingMode.value === "infinite" ? 1 : page.value,
    perPage: itemsPerPage.value,
    where: where.value ? JSON.stringify(where.value) : void 0,
    orderBy: orderBy.value ? JSON.stringify(orderBy.value) : void 0,
    fields: fields.value,
    include: options.staticInclude
  }));
  watch3(page, (value) => {
    if (loadingMode.value === "infinite" && value !== 1) {
      page.value = 1;
      return;
    }
    if (options.routePage && options.routePage.value !== value) options.routePage.value = value;
  });
  if (options.routePage) {
    watch3(options.routePage, (value) => {
      if (loadingMode.value === "infinite") {
        if (value !== 1) options.routePage.value = 1;
        return;
      }
      const next = normalisePage(value);
      if (next && next !== page.value) page.value = next;
    });
  }
  const api = useModuleApi(options.api, options.endpoint);
  const fetchPage = async (requestedPage, append) => {
    const version = ++requestVersion;
    const query = queryParams.value;
    const mode = loadingMode.value;
    loading.value = true;
    error.value = void 0;
    try {
      const response = await api.query({ ...query, page: requestedPage });
      if (version !== requestVersion || query !== queryParams.value || mode !== loadingMode.value) return;
      const rows = response.data.items;
      items.value = append ? [...items.value, ...rows] : rows;
      totalItems.value = response.data.meta.itemCount;
      totalPages.value = response.data.meta.pageCount;
      nextPage.value = rows.length ? requestedPage + 1 : totalPages.value + 1;
      await options.onRefreshed?.(items.value);
    } catch (caught) {
      if (version !== requestVersion || query !== queryParams.value || mode !== loadingMode.value) return;
      error.value = caught;
      await options.onError?.(caught);
    } finally {
      if (version === requestVersion) loading.value = false;
    }
  };
  const refresh = async () => {
    if (loadingMode.value === "infinite") {
      nextPage.value = 1;
      items.value = [];
      totalItems.value = 0;
      totalPages.value = 0;
    }
    await fetchPage(queryParams.value.page, false);
  };
  const loadMore = async () => {
    if (loadingMode.value !== "infinite" || loading.value || !hasMore.value && !error.value) return;
    await fetchPage(nextPage.value, true);
  };
  const initialize = async () => {
    const initialPage = normalisePage(options.routePage?.value);
    if (loadingMode.value === "infinite") {
      if (options.routePage) options.routePage.value = 1;
    } else if (initialPage) page.value = initialPage;
    await refresh();
    await options.onInitialized?.();
  };
  const updateRow = (row) => {
    const identity = row[identityKey];
    const index = items.value.findIndex((item) => Object.is(item[identityKey], identity));
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...row };
      triggerRef(items);
    }
  };
  watch3(
    [loadingMode, queryParams, fields],
    ([mode], [previousMode]) => {
      if (mode !== previousMode) {
        page.value = 1;
        items.value = [];
        totalItems.value = 0;
        totalPages.value = 0;
        if (options.routePage) options.routePage.value = 1;
      }
      void refresh();
    },
    { deep: true }
  );
  return {
    page,
    loadingMode,
    hasMore,
    loadMore,
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
    updateRow
  };
}

export {
  useGroupedTable,
  useGroupedSelection,
  useTable
};
//# sourceMappingURL=chunk-Z4PZF53D.js.map