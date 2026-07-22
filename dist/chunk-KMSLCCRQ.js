import {
  useModuleApi
} from "./chunk-HNMNAHVE.js";
import {
  andWhere,
  filteringToWhere,
  parseJson,
  pathsToFieldsQuery,
  sortingToOrderBy
} from "./chunk-RROS6BGV.js";

// src/table/index.ts
import { computed, ref, shallowRef, triggerRef, unref, watch } from "vue";
var DEFAULT_ITEMS_PER_PAGE = 25;
function browserStorage() {
  try {
    return typeof localStorage === "undefined" ? void 0 : localStorage;
  } catch {
    return void 0;
  }
}
function persistedRef(key, fallback, storage) {
  const state = ref(storage ? parseJson(storage.getItem(key), fallback) : fallback);
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
function normalisePage(value) {
  const page = typeof value === "number" ? value : Number(value);
  return Number.isInteger(page) && page > 0 ? page : void 0;
}
function useTable(options) {
  const persistenceKey = options.persistenceKey ?? options.name;
  if (!persistenceKey) throw new Error("useTable requires a persistenceKey or name.");
  const storage = options.storage ?? browserStorage();
  const key = (suffix) => `table:${persistenceKey}:${suffix}`;
  const identityKey = options.identityKey ?? "id";
  const page = ref(normalisePage(options.routePage?.value) ?? 1);
  const itemsPerPage = persistedRef(
    key("items-per-page"),
    options.defaultItemsPerPage ?? DEFAULT_ITEMS_PER_PAGE,
    storage
  );
  const sorting = persistedRef(key("sort"), [], storage);
  const filtering = persistedRef(key("filtering"), { operator: "AND", filters: [] }, storage);
  const columnOrder = persistedRef(key("column-order"), [], storage);
  const columnVisibility = persistedRef(key("invisible-columns"), [], storage);
  const columnPinning = persistedRef(key("column-pinning"), {}, storage);
  const items = shallowRef([]);
  const totalItems = ref(0);
  const totalPages = ref(0);
  const loading = ref(false);
  const error = ref();
  let requestVersion = 0;
  const syncColumnOrder = () => {
    const ids = options.columns.value.map((column) => column.id).filter(Boolean);
    columnOrder.value = [
      ...columnOrder.value.filter((id) => ids.includes(id)),
      ...ids.filter((id) => !columnOrder.value.includes(id))
    ];
    columnVisibility.value = columnVisibility.value.filter((id) => ids.includes(id));
  };
  watch(options.columns, syncColumnOrder, { immediate: true, deep: true });
  const columns = computed(
    () => columnOrder.value.map((id) => options.columns.value.find((column) => column.id === id)).filter((column) => Boolean(column)).filter((column) => !columnVisibility.value.includes(column.id))
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
    updateRow
  };
}

export {
  useTable
};
//# sourceMappingURL=chunk-KMSLCCRQ.js.map