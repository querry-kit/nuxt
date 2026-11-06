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
import { computed as computed2, ref as ref2, shallowRef, triggerRef, unref as unref2, watch as watch3 } from "vue";

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
import { computed, shallowReactive, unref, watch as watch2 } from "vue";
function useGroupedTable(options) {
  const name = options.persistenceKey ?? options.name;
  if (!name) throw new Error("useGroupedTable requires a persistenceKey or name.");
  const batchSize = options.groupBatchSize ?? 25;
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1e3)
    throw new Error("groupBatchSize must be an integer from 1 to 1000.");
  const storage = options.storage ?? browserStorage();
  const key = (suffix) => `table:${name}:${suffix}`;
  const allowed = new Set(options.groupableFields.filter((field) => !field.disabled).map((field) => field.value));
  const validGrouping = (value) => Array.isArray(value) && value.every((field) => typeof field === "string" && allowed.has(field)) && new Set(value).size === value.length;
  if (!validGrouping(options.defaultGrouping ?? []))
    throw new Error("defaultGrouping contains unavailable or repeated fields.");
  const grouping = persistedRef(key("grouping"), options.defaultGrouping ?? [], storage, validGrouping);
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
  const branch = () => ({
    children: [],
    items: [],
    loading: false,
    error: void 0,
    hasMore: true
  });
  const root = shallowReactive(branch());
  const api = useModuleApi(options.api, options.endpoint);
  let epoch = 0;
  let initialized = false;
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
  const load = async (path = []) => {
    const target = path.length ? find(path) : root;
    if (target.loading || !target.hasMore) return;
    const version = epoch;
    target.loading = true;
    target.error = void 0;
    try {
      if (!validGrouping(grouping.value)) throw new Error("Grouping contains unavailable or repeated fields.");
      const scopedWhere = andWhere(where.value, ...path.map(({ field: field2, value }) => ({ [field2]: { equals: value } })));
      const field = grouping.value[path.length];
      if (field) {
        const response = await api.groupBy({
          by: [field],
          where: JSON.stringify(scopedWhere ?? {}),
          orderBy: { [field]: "asc" },
          _count: { _all: true },
          take: batchSize + 1,
          skip: target.children.length
        });
        if (version !== epoch) return;
        const nodes = response.data.slice(0, batchSize).map((row) => {
          const value = row[field];
          const count = row._count?._all;
          if (!(value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) || typeof count !== "number" || !Number.isInteger(count) || count < 0)
            throw new Error("Invalid group-by response.");
          const nextPath = [...path, { field, value }];
          return shallowReactive({
            ...branch(),
            key: JSON.stringify(nextPath),
            path: nextPath,
            field,
            value,
            count,
            expanded: false,
            loaded: false
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
          perPage: itemsPerPage.value
        });
        if (version !== epoch) return;
        target.items = [...target.items, ...response.data.items];
        target.hasMore = target.items.length < response.data.meta.itemCount;
        await options.onRefreshed?.(target.items);
      }
      if ("loaded" in target) target.loaded = true;
    } catch (error) {
      if (version !== epoch) return;
      target.error = error;
      await options.onError?.(error);
    } finally {
      if (version === epoch) target.loading = false;
    }
  };
  const refresh = async () => {
    epoch++;
    Object.assign(root, branch());
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
    if (node.expanded && !node.loaded) await load(path);
  };
  const loadMoreGroups = async (parentPath = []) => {
    if (parentPath.length >= grouping.value.length) throw new Error("This branch contains records, not groups.");
    await load(parentPath);
  };
  const loadMoreItems = async (path) => {
    if (path.length !== grouping.value.length) throw new Error("This branch contains groups, not records.");
    await load(path);
  };
  watch2(
    [grouping, where, leafOrder, fields, itemsPerPage],
    () => {
      if (initialized) void refresh();
    },
    { deep: true }
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
    loadMoreItems
  };
}

// src/table/index.ts
var DEFAULT_ITEMS_PER_PAGE = 25;
function useTable(options) {
  const persistenceKey = options.persistenceKey ?? options.name;
  if (!persistenceKey) throw new Error("useTable requires a persistenceKey or name.");
  const storage = options.storage ?? browserStorage();
  const key = (suffix) => `table:${persistenceKey}:${suffix}`;
  const identityKey = options.identityKey ?? "id";
  const page = ref2(normalisePage(options.routePage?.value) ?? 1);
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
  const totalItems = ref2(0);
  const totalPages = ref2(0);
  const loading = ref2(false);
  const error = ref2();
  let requestVersion = 0;
  const availableColumns = computed2(() => options.columns.value.filter(hasColumnId));
  const syncColumnOrder = () => {
    const ids = availableColumns.value.map((column) => column.id);
    columnOrder.value = [
      ...columnOrder.value.filter((id) => ids.includes(id)),
      ...ids.filter((id) => !columnOrder.value.includes(id))
    ];
    columnVisibility.value = columnVisibility.value.filter((id) => ids.includes(id));
  };
  watch3(availableColumns, syncColumnOrder, { immediate: true, deep: true });
  const columns = computed2(
    () => columnOrder.value.map((id) => availableColumns.value.find((column) => column.id === id)).filter((column) => Boolean(column)).filter((column) => !columnVisibility.value.includes(column.id))
  );
  const fields = computed2(() => {
    const paths = new Set(options.staticFields ?? ["id"]);
    for (const column of columns.value) {
      if (column.id === "actions") continue;
      if (column.fields?.length) column.fields.forEach((field) => paths.add(`${column.id}.${field}`));
      else paths.add(column.id);
    }
    return pathsToFieldsQuery(paths);
  });
  const staticWhere = computed2(() => {
    const archive = options.isArchived === void 0 ? void 0 : { isArchived: options.isArchived };
    return andWhere(archive, unref2(options.staticFilter));
  });
  const where = computed2(() => andWhere(staticWhere.value, filteringToWhere(filtering.value)));
  const queryParams = computed2(() => ({
    page: page.value,
    perPage: itemsPerPage.value,
    where: where.value ? JSON.stringify(where.value) : void 0,
    orderBy: sortingToOrderBy(sorting.value) ? JSON.stringify(sortingToOrderBy(sorting.value)) : void 0,
    fields: fields.value,
    include: options.staticInclude
  }));
  watch3(page, (value) => {
    if (options.routePage && options.routePage.value !== value) options.routePage.value = value;
  });
  if (options.routePage) {
    watch3(options.routePage, (value) => {
      const next = normalisePage(value);
      if (next && next !== page.value) page.value = next;
    });
  }
  const api = useModuleApi(options.api, options.endpoint);
  const refresh = async () => {
    const version = ++requestVersion;
    loading.value = true;
    error.value = void 0;
    try {
      const response = await api.query(queryParams.value);
      if (version !== requestVersion) return;
      items.value = response.data.items;
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
  const updateRow = (row) => {
    const identity = row[identityKey];
    const index = items.value.findIndex((item) => Object.is(item[identityKey], identity));
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...row };
      triggerRef(items);
    }
  };
  watch3([queryParams, fields], () => void refresh(), { deep: true });
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
    updateRow
  };
}

export {
  useGroupedTable,
  useTable
};
//# sourceMappingURL=chunk-XBMRLQLH.js.map