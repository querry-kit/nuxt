import type { AxiosInstance } from 'axios';
import { AxiosHeaders, create } from 'axios';
import type { ApiVersion, CreateApiClientOptions } from '../types/api';

/**
 * Creates an Axios instance configured for a Query Kit REST API.
 *
 * The client is intentionally independent from Nuxt runtime configuration and application stores.
 *
 * @param {CreateApiClientOptions} options - Origin and per-request header resolvers owned by the consuming application.
 * @param {ApiVersion} version - API path version appended after `/api`; currently `v1`.
 * @returns An Axios instance whose base URL is `<origin>/api/<version>`.
 */
export function createApiClient(options: CreateApiClientOptions, version: ApiVersion = 'v1'): AxiosInstance {
  const { apiBaseUrl, getToken, resolveBaseUrl, requestSource = 'web', getTimezone } = options;

  const resolved = resolveBaseUrl ? resolveBaseUrl(apiBaseUrl) : apiBaseUrl;
  const baseURL = `${resolved.replace(/\/$/, '')}/api/${version}`;
  const api = create({ baseURL });

  api.interceptors.request.use(async (config) => {
    const headers = AxiosHeaders.from(config.headers);

    headers.set('Request-Source', requestSource);

    const timezone = getTimezone?.() ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) headers.set('Timezone', timezone);

    const token = await getToken?.();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    config.headers = headers;
    return config;
  });

  return api;
}
