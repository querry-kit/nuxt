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

// src/api/index.ts
var api_exports = {};
__export(api_exports, {
  createApiClient: () => createApiClient,
  useModuleApi: () => useModuleApi
});
module.exports = __toCommonJS(api_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createApiClient,
  useModuleApi
});
//# sourceMappingURL=api.cjs.map