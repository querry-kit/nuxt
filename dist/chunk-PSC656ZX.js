// src/api.ts
import { AxiosHeaders, create } from "axios";
function createApiClient({ apiBaseUrl, getToken, resolveBaseUrl, requestSource = "web", getTimezone }, version = "v1") {
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

export {
  createApiClient
};
//# sourceMappingURL=chunk-PSC656ZX.js.map