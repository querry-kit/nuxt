import {
  serializeQuery
} from "./chunk-3Q5MFWY7.js";

// src/api/api-client.ts
import { AxiosHeaders, create } from "axios";
function createApiClient(options, version = "v1") {
  const { apiBaseUrl, getToken, resolveBaseUrl, requestSource = "web", getTimezone } = options;
  const resolved = resolveBaseUrl ? resolveBaseUrl(apiBaseUrl) : apiBaseUrl;
  const baseURL = `${resolved.replace(/\/$/, "")}/api/${version}`;
  const api = create({ baseURL });
  api.interceptors.request.use(async (config) => {
    const headers = AxiosHeaders.from(config.headers);
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

export {
  createApiClient,
  useModuleApi
};
//# sourceMappingURL=chunk-BQLRM3I3.js.map