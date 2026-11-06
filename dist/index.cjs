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

// src/index.ts
var src_exports = {};
__export(src_exports, {
  andWhere: () => andWhere,
  createApiClient: () => createApiClient,
  filteringToWhere: () => filteringToWhere,
  isEqual: () => isEqual,
  mergeQuery: () => mergeQuery,
  parseJson: () => parseJson,
  pathsToFieldsQuery: () => pathsToFieldsQuery,
  serializeQuery: () => serializeQuery,
  sortingToOrderBy: () => sortingToOrderBy,
  unflatten: () => unflatten,
  useAutocomplete: () => useAutocomplete,
  useGroupedTable: () => useGroupedTable,
  useModuleApi: () => useModuleApi,
  useTable: () => useTable
});
module.exports = __toCommonJS(src_exports);

// src/api/api-client.ts
var import_axios = require("axios");
function createApiClient(options, version = "v1") {
  const { apiBaseUrl, getToken, resolveBaseUrl, requestSource = "web", getTimezone } = options;
  const resolved = resolveBaseUrl ? resolveBaseUrl(apiBaseUrl) : apiBaseUrl;
  const baseURL = `${resolved.replace(/\/$/, "")}/api/${version}`;
  const api = (0, import_axios.create)({ baseURL });
  api.interceptors.request.use(async (config) => {
    const headers = import_axios.AxiosHeaders.from(config.headers);
    headers.set("Request-Source", requestSource);
    const timezone = getTimezone?.() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) headers.set("Timezone", timezone);
    const token = await getToken?.();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    config.headers = headers;
    return config;
  });
  return api;
}

// src/utils/serialize-query.ts
var import_qs = __toESM(require("qs"), 1);
function serializeQuery(query = {}) {
  return import_qs.default.stringify(query, { addQueryPrefix: true, encodeValuesOnly: true });
}

// src/api/module-api.ts
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
    /**
     * Fetches scalar group keys and aggregates from an application-owned grouping route.
     *
     * @param {QueryParameters} query Group keys, filters, selectors and pagination.
     * @returns {Promise<AxiosResponse<TResult[]>>} Group rows, not resource items.
     */
    groupBy(query) {
      return api.get(`${path}/group-by${withQuery(query)}`);
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

// src/autocomplete/index.ts
var import_vue = require("vue");

// src/utils/is-equal.ts
function isEqual(left, right) {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, i) => isEqual(item, right[i]));
  }
  const leftRecord = left;
  const rightRecord = right;
  const keys = Object.keys(leftRecord);
  return keys.length === Object.keys(rightRecord).length && keys.every((key) => isEqual(leftRecord[key], rightRecord[key]));
}

// src/utils/merge-query.ts
function mergeQuery(base, extra) {
  const result = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const existing = result[key];
    result[key] = existing && value && typeof existing === "object" && typeof value === "object" && !Array.isArray(existing) && !Array.isArray(value) ? mergeQuery(existing, value) : value;
  }
  return result;
}

// src/autocomplete/index.ts
function useAutocomplete(options) {
  const identityKey = options.identityKey ?? "id";
  const currentValueItems = (0, import_vue.shallowRef)([]);
  const queryItems = (0, import_vue.shallowRef)([]);
  const currentLoading = (0, import_vue.ref)(false);
  const queryLoading = (0, import_vue.ref)(false);
  const error = (0, import_vue.ref)();
  let currentRequest = 0;
  let queryRequest = 0;
  const api = useModuleApi(options.api, options.endpoint);
  const loading = (0, import_vue.computed)(() => currentLoading.value || queryLoading.value);
  const selectedQuery = (0, import_vue.computed)(() => {
    const selected = options.currentValue === void 0 ? void 0 : (0, import_vue.unref)(options.currentValue);
    if (selected === null || selected === void 0 || Array.isArray(selected) && selected.length === 0)
      return void 0;
    return {
      where: { [identityKey]: Array.isArray(selected) ? { in: selected } : selected },
      perPage: 1e3
    };
  });
  const loadCurrentItems = async () => {
    const request = ++currentRequest;
    const selected = selectedQuery.value;
    if (!selected) {
      currentValueItems.value = [];
      currentLoading.value = false;
      return;
    }
    currentLoading.value = true;
    try {
      const query = mergeQuery((0, import_vue.unref)(options.query) ?? {}, selected);
      const response = await api.query(query);
      if (request === currentRequest) currentValueItems.value = response.data.items;
    } catch (caught) {
      if (request === currentRequest) {
        currentValueItems.value = [];
        error.value = caught;
      }
    } finally {
      if (request === currentRequest) currentLoading.value = false;
    }
  };
  const loadItems = async () => {
    const request = ++queryRequest;
    queryLoading.value = true;
    try {
      const response = await api.query((0, import_vue.unref)(options.query) ?? {});
      if (request === queryRequest) queryItems.value = response.data.items;
    } catch (caught) {
      if (request === queryRequest) {
        queryItems.value = [];
        error.value = caught;
      }
    } finally {
      if (request === queryRequest) queryLoading.value = false;
    }
  };
  const items = (0, import_vue.computed)(() => {
    const seen = /* @__PURE__ */ new Set();
    const merged = [];
    for (const item of [...currentValueItems.value, ...queryItems.value]) {
      const identity = item[identityKey];
      if (!seen.has(identity)) {
        seen.add(identity);
        merged.push(item);
      }
    }
    return options.itemDisabled ? merged.map((item) => ({ ...item, disabled: options.itemDisabled?.(item) })) : merged;
  });
  const initialize = async () => {
    await Promise.all([loadCurrentItems(), loadItems()]);
  };
  const refresh = initialize;
  (0, import_vue.watch)(selectedQuery, (next, previous) => {
    if (!isEqual(next, previous)) void loadCurrentItems();
  });
  (0, import_vue.watch)(
    () => (0, import_vue.unref)(options.query),
    () => void loadItems(),
    { deep: true }
  );
  if (options.immediate !== false) (0, import_vue.onMounted)(() => void initialize());
  return {
    items,
    loading,
    error,
    currentValueItems,
    queryItems,
    loadCurrentItems,
    loadItems,
    initialize,
    refresh
  };
}

// src/table/index.ts
var import_vue4 = require("vue");

// src/utils/and-where.ts
function andWhere(...conditions) {
  const present = conditions.filter((condition) => Boolean(condition));
  if (present.length === 0) return void 0;
  return present.length === 1 ? present[0] : { AND: present };
}

// src/utils/unflatten.ts
function unflatten(value) {
  const result = {};
  for (const [path, item] of Object.entries(value)) {
    const parts = path.split(".").filter(Boolean);
    if (parts.length === 0 || parts.some((part) => ["__proto__", "constructor", "prototype"].includes(part))) continue;
    let cursor = result;
    for (const [index, part] of parts.entries()) {
      if (index === parts.length - 1) {
        cursor[part] = item;
      } else {
        const child = Object.hasOwn(cursor, part) ? cursor[part] : void 0;
        if (!child || typeof child !== "object" || Array.isArray(child)) cursor[part] = {};
        cursor = cursor[part];
      }
    }
  }
  return result;
}

// src/utils/filtering-to-where.ts
function filteringToWhere(filtering) {
  const conditions = filtering.filters.filter((filter) => filter.value !== void 0).map((filter) => {
    const value = filter.operator ? { [filter.operator]: filter.value } : filter.value;
    return unflatten({ [filter.field]: value });
  });
  if (conditions.length === 0) return void 0;
  if (filtering.operator === "OR") return { OR: conditions };
  else if (conditions.length === 1) return conditions[0];
  else return { AND: conditions };
}

// src/utils/paths-to-fields-query.ts
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

// src/utils/sorting-to-order-by.ts
function sortingToOrderBy(sorting) {
  if (sorting.length === 0) return void 0;
  return sorting.map(({ id, desc }) => unflatten({ [id]: desc ? "desc" : "asc" }));
}

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
var import_vue2 = require("vue");

// src/utils/parse-json.ts
function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// src/table/persisted-ref.ts
function persistedRef(key, fallback, storage, validate = (value) => value !== null && typeof value === typeof fallback) {
  let initial = fallback;
  try {
    const saved = parseJson(storage?.getItem(key), fallback);
    if (validate(saved)) initial = saved;
  } catch {
  }
  const state = (0, import_vue2.ref)(initial);
  (0, import_vue2.watch)(
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
var import_vue3 = require("vue");
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
  const availableColumns = (0, import_vue3.computed)(() => options.columns.value.filter(hasColumnId));
  (0, import_vue3.watch)(
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
  const columns = (0, import_vue3.computed)(
    () => columnOrder.value.map((id) => availableColumns.value.find((column) => column.id === id)).filter((column) => Boolean(column)).filter((column) => !columnVisibility.value.includes(column.id))
  );
  const fields = (0, import_vue3.computed)(() => {
    const paths = /* @__PURE__ */ new Set([identityKey, ...options.staticFields ?? [], ...grouping.value]);
    for (const column of columns.value) {
      if (column.id === "actions") continue;
      if (column.fields?.length) column.fields.forEach((field) => paths.add(`${column.id}.${field}`));
      else paths.add(column.id);
    }
    return pathsToFieldsQuery(paths);
  });
  const where = (0, import_vue3.computed)(
    () => andWhere(
      options.isArchived === void 0 ? void 0 : { isArchived: options.isArchived },
      (0, import_vue3.unref)(options.staticFilter),
      filteringToWhere(filtering.value)
    )
  );
  const leafOrder = (0, import_vue3.computed)(() => {
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
  const root = (0, import_vue3.shallowReactive)(branch());
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
          return (0, import_vue3.shallowReactive)({
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
  (0, import_vue3.watch)(
    [grouping, where, leafOrder, fields, itemsPerPage],
    () => {
      if (initialized) void refresh();
    },
    { deep: true }
  );
  return {
    root,
    groups: (0, import_vue3.computed)(() => root.children),
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
  const page = (0, import_vue4.ref)(normalisePage(options.routePage?.value) ?? 1);
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
  const items = (0, import_vue4.shallowRef)([]);
  const totalItems = (0, import_vue4.ref)(0);
  const totalPages = (0, import_vue4.ref)(0);
  const loading = (0, import_vue4.ref)(false);
  const error = (0, import_vue4.ref)();
  let requestVersion = 0;
  const availableColumns = (0, import_vue4.computed)(() => options.columns.value.filter(hasColumnId));
  const syncColumnOrder = () => {
    const ids = availableColumns.value.map((column) => column.id);
    columnOrder.value = [
      ...columnOrder.value.filter((id) => ids.includes(id)),
      ...ids.filter((id) => !columnOrder.value.includes(id))
    ];
    columnVisibility.value = columnVisibility.value.filter((id) => ids.includes(id));
  };
  (0, import_vue4.watch)(availableColumns, syncColumnOrder, { immediate: true, deep: true });
  const columns = (0, import_vue4.computed)(
    () => columnOrder.value.map((id) => availableColumns.value.find((column) => column.id === id)).filter((column) => Boolean(column)).filter((column) => !columnVisibility.value.includes(column.id))
  );
  const fields = (0, import_vue4.computed)(() => {
    const paths = new Set(options.staticFields ?? ["id"]);
    for (const column of columns.value) {
      if (column.id === "actions") continue;
      if (column.fields?.length) column.fields.forEach((field) => paths.add(`${column.id}.${field}`));
      else paths.add(column.id);
    }
    return pathsToFieldsQuery(paths);
  });
  const staticWhere = (0, import_vue4.computed)(() => {
    const archive = options.isArchived === void 0 ? void 0 : { isArchived: options.isArchived };
    return andWhere(archive, (0, import_vue4.unref)(options.staticFilter));
  });
  const where = (0, import_vue4.computed)(() => andWhere(staticWhere.value, filteringToWhere(filtering.value)));
  const queryParams = (0, import_vue4.computed)(() => ({
    page: page.value,
    perPage: itemsPerPage.value,
    where: where.value ? JSON.stringify(where.value) : void 0,
    orderBy: sortingToOrderBy(sorting.value) ? JSON.stringify(sortingToOrderBy(sorting.value)) : void 0,
    fields: fields.value,
    include: options.staticInclude
  }));
  (0, import_vue4.watch)(page, (value) => {
    if (options.routePage && options.routePage.value !== value) options.routePage.value = value;
  });
  if (options.routePage) {
    (0, import_vue4.watch)(options.routePage, (value) => {
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
      (0, import_vue4.triggerRef)(items);
    }
  };
  (0, import_vue4.watch)([queryParams, fields], () => void refresh(), { deep: true });
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
  andWhere,
  createApiClient,
  filteringToWhere,
  isEqual,
  mergeQuery,
  parseJson,
  pathsToFieldsQuery,
  serializeQuery,
  sortingToOrderBy,
  unflatten,
  useAutocomplete,
  useGroupedTable,
  useModuleApi,
  useTable
});
//# sourceMappingURL=index.cjs.map