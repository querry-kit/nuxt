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

// src/autocomplete/index.ts
var autocomplete_exports = {};
__export(autocomplete_exports, {
  useAutocomplete: () => useAutocomplete
});
module.exports = __toCommonJS(autocomplete_exports);
var import_vue = require("vue");

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
    (next, previous) => {
      if (!isEqual(next, previous)) void loadItems();
    },
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useAutocomplete
});
//# sourceMappingURL=autocomplete.cjs.map