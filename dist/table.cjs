"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/table/index.ts
var table_exports = {};
__export(table_exports, {
  useTable: () => useTable
});
module.exports = __toCommonJS(table_exports);
var import_vue = require("vue");

// src/utils.ts
var import_qs = __toESM(require("qs"), 1);
function serializeQuery(query = {}) {
  return import_qs.default.stringify(query, { addQueryPrefix: true, encodeValuesOnly: true });
}
function pathsToFieldsQuery(paths) {
  const tree = {};
  for (const path of paths) {
    const parts = path.split(".").filter(Boolean);
    if (parts.length === 0) continue;
    let cursor = tree;
    for (const [index, key] of parts.entries()) {
      const isLeaf = index === parts.length - 1;
      if (isLeaf) {
        if (cursor[key] === void 0) cursor[key] = true;
        continue;
      }
      if (cursor[key] === void 0 || cursor[key] === true) cursor[key] = {};
      cursor = cursor[key];
    }
  }
  const stringify = (node) => Object.entries(node).map(([key, value]) => value === true ? key : `${key}{${stringify(value)}}`).join(",");
  const result = stringify(tree);
  return result || void 0;
}
function unflatten(value) {
  const result = {};
  for (const [path, item] of Object.entries(value)) {
    const parts = path.split(".").filter(Boolean);
    if (parts.length === 0) continue;
    let cursor = result;
    for (const [index, part] of parts.entries()) {
      if (index === parts.length - 1) {
        cursor[part] = item;
      } else {
        const child = cursor[part];
        if (!child || typeof child !== "object" || Array.isArray(child)) cursor[part] = {};
        cursor = cursor[part];
      }
    }
  }
  return result;
}
function sortingToOrderBy(sorting) {
  if (sorting.length === 0) return void 0;
  return sorting.map(({ id, desc }) => unflatten({ [id]: desc ? "desc" : "asc" }));
}
function filteringToWhere(filtering) {
  const conditions = filtering.filters.filter((filter) => filter.value !== void 0).map((filter) => {
    const value = filter.operator ? { [filter.operator]: filter.value } : filter.value;
    return unflatten({ [filter.field]: value });
  });
  if (conditions.length === 0) return void 0;
  return filtering.operator === "OR" ? { OR: conditions } : conditions.length === 1 ? conditions[0] : { AND: conditions };
}
function andWhere(...conditions) {
  const present = conditions.filter((condition) => Boolean(condition));
  if (present.length === 0) return void 0;
  return present.length === 1 ? present[0] : { AND: present };
}
function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// src/module-api.ts
function useModuleApi(api, endpoint) {
  const path = `/${endpoint.replace(/^\/+/, "")}`;
  const withQuery = (query = {}) => serializeQuery(query);
  const resource = (id) => `${path}/${encodeURIComponent(String(id))}`;
  return {
    query(query = {}) {
      return api.get(`${path}${withQuery(query)}`);
    },
    get(id, query = {}) {
      return api.get(`${resource(id)}${withQuery(query)}`);
    },
    findById(id, query = {}) {
      return api.get(`${path}/find-by-id/${encodeURIComponent(String(id))}${withQuery(query)}`);
    },
    count(query = {}) {
      return api.get(`${path}/count${withQuery(query)}`);
    },
    create(data, query = {}) {
      return api.post(`${path}${withQuery(query)}`, data);
    },
    update(id, data, query = {}) {
      return api.patch(`${resource(id)}${withQuery(query)}`, data);
    },
    delete(id, query = {}) {
      return api.delete(`${resource(id)}${withQuery(query)}`);
    }
  };
}

// src/table/index.ts
var DEFAULT_ITEMS_PER_PAGE = 25;
function browserStorage() {
  try {
    return typeof localStorage === "undefined" ? void 0 : localStorage;
  } catch {
    return void 0;
  }
}
function persistedRef(key, fallback, storage) {
  const state = (0, import_vue.ref)(storage ? parseJson(storage.getItem(key), fallback) : fallback);
  (0, import_vue.watch)(
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
  const page = (0, import_vue.ref)(normalisePage(options.routePage?.value) ?? 1);
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
  const items = (0, import_vue.shallowRef)([]);
  const totalItems = (0, import_vue.ref)(0);
  const totalPages = (0, import_vue.ref)(0);
  const loading = (0, import_vue.ref)(false);
  const error = (0, import_vue.ref)();
  let requestVersion = 0;
  const syncColumnOrder = () => {
    const ids = options.columns.value.map((column) => column.id).filter(Boolean);
    columnOrder.value = [
      ...columnOrder.value.filter((id) => ids.includes(id)),
      ...ids.filter((id) => !columnOrder.value.includes(id))
    ];
    columnVisibility.value = columnVisibility.value.filter((id) => ids.includes(id));
  };
  (0, import_vue.watch)(options.columns, syncColumnOrder, { immediate: true, deep: true });
  const columns = (0, import_vue.computed)(
    () => columnOrder.value.map((id) => options.columns.value.find((column) => column.id === id)).filter((column) => Boolean(column)).filter((column) => !columnVisibility.value.includes(column.id))
  );
  const fields = (0, import_vue.computed)(() => {
    const paths = new Set(options.staticFields ?? ["id"]);
    for (const column of columns.value) {
      if (column.id === "actions") continue;
      if (column.fields?.length) column.fields.forEach((field) => paths.add(`${column.id}.${field}`));
      else paths.add(column.id);
    }
    return pathsToFieldsQuery(paths);
  });
  const staticWhere = (0, import_vue.computed)(() => {
    const archive = options.isArchived === void 0 ? void 0 : { isArchived: options.isArchived };
    return andWhere(archive, (0, import_vue.unref)(options.staticFilter));
  });
  const where = (0, import_vue.computed)(() => andWhere(staticWhere.value, filteringToWhere(filtering.value)));
  const queryParams = (0, import_vue.computed)(() => ({
    page: page.value,
    perPage: itemsPerPage.value,
    where: where.value ? JSON.stringify(where.value) : void 0,
    orderBy: sortingToOrderBy(sorting.value) ? JSON.stringify(sortingToOrderBy(sorting.value)) : void 0,
    fields: fields.value,
    include: options.staticInclude
  }));
  (0, import_vue.watch)(page, (value) => {
    if (options.routePage && options.routePage.value !== value) options.routePage.value = value;
  });
  if (options.routePage) {
    (0, import_vue.watch)(options.routePage, (value) => {
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
      (0, import_vue.triggerRef)(items);
    }
  };
  (0, import_vue.watch)([queryParams, fields], () => void refresh(), { deep: true });
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useTable
});
//# sourceMappingURL=table.cjs.map