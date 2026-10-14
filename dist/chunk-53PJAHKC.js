import {
  useModuleApi
} from "./chunk-BQLRM3I3.js";
import {
  andWhere,
  filteringToWhere,
  parseJson,
  pathsToFieldsQuery,
  sortingToOrderBy
} from "./chunk-YS2BVSJL.js";

// src/table/index.ts
import { computed, ref as ref2, shallowRef, triggerRef, unref, watch as watch2 } from "vue";

// src/table/browser-storage.ts
function browserStorage() {
  try {
    return typeof localStorage === "undefined" ? void 0 : localStorage;
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
  const availableColumns = computed(() => options.columns.value.filter(hasColumnId));
  const syncColumnOrder = () => {
    const ids = availableColumns.value.map((column) => column.id);
    columnOrder.value = [
      ...columnOrder.value.filter((id) => ids.includes(id)),
      ...ids.filter((id) => !columnOrder.value.includes(id))
    ];
    columnVisibility.value = columnVisibility.value.filter((id) => ids.includes(id));
  };
  watch2(availableColumns, syncColumnOrder, { immediate: true, deep: true });
  const columns = computed(
    () => columnOrder.value.map((id) => availableColumns.value.find((column) => column.id === id)).filter((column) => Boolean(column)).filter((column) => !columnVisibility.value.includes(column.id))
  );
  const fields = computed(() => {
    const paths = new Set(options.staticFields ?? ["id"]);
    for (const column of columns.value) {
      if (column.id === "actions") continue;
      if (column.fields?.length) column.fields.forEach((field) => paths.add(`${column.id}.${field}`));
      else paths.add(column.id);
    }
    return pathsToFieldsQuery(paths);
  });
  const staticWhere = computed(() => {
    const archive = options.isArchived === void 0 ? void 0 : { isArchived: options.isArchived };
    return andWhere(archive, unref(options.staticFilter));
  });
  const where = computed(() => andWhere(staticWhere.value, filteringToWhere(filtering.value)));
  const queryParams = computed(() => ({
    page: page.value,
    perPage: itemsPerPage.value,
    where: where.value ? JSON.stringify(where.value) : void 0,
    orderBy: sortingToOrderBy(sorting.value) ? JSON.stringify(sortingToOrderBy(sorting.value)) : void 0,
    fields: fields.value,
    include: options.staticInclude
  }));
  watch2(page, (value) => {
    if (options.routePage && options.routePage.value !== value) options.routePage.value = value;
  });
  if (options.routePage) {
    watch2(options.routePage, (value) => {
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
  watch2([queryParams, fields], () => void refresh(), { deep: true });
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
  useTable
};
//# sourceMappingURL=chunk-53PJAHKC.js.map