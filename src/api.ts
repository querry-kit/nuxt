import type { AxiosInstance } from 'axios';
import { AxiosHeaders, create } from 'axios';

/** Supported Query Kit API path versions. */
export type ApiVersion = 'v1';

/** Options for creating an isolated Query Kit Axios client. */
export interface CreateApiClientOptions {
  apiBaseUrl: string;
  getToken?: () => string | null | Promise<string | null>;
  resolveBaseUrl?: (apiBaseUrl: string) => string;
  requestSource?: string;
  getTimezone?: () => string | undefined;
}

/**
 * Creates an Axios instance configured for a Query Kit REST API.
 *
 * The client is intentionally independent from Nuxt runtime configuration and application stores.
 */
export function createApiClient(
  { apiBaseUrl, getToken, resolveBaseUrl, requestSource = 'web', getTimezone }: CreateApiClientOptions,
  version: ApiVersion = 'v1',
): AxiosInstance {
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
