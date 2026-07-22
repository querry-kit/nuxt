import type { AxiosInstance } from 'axios';
import { AxiosHeaders, create } from 'axios';

/** Supported Query Kit API path versions. */
export type ApiVersion = 'v1';

/** Options for creating an isolated Query Kit Axios client. */
export interface CreateApiClientOptions {
  /** Public API origin, with or without a trailing slash. */
  apiBaseUrl: string;
  /** Resolves the current access token for each request. Returning no value omits the Authorization header. */
  getToken?: () => string | null | Promise<string | null>;
  /** Rewrites the API origin, for example to replace a tenant-aware host. */
  resolveBaseUrl?: (apiBaseUrl: string) => string;
  /** Value sent in the `Request-Source` header. Defaults to `web`. */
  requestSource?: string;
  /** Resolves the timezone header. The browser timezone is used when it is omitted. */
  getTimezone?: () => string | undefined;
}

/**
 * Creates an Axios instance configured for a Query Kit REST API.
 *
 * The client is intentionally independent from Nuxt runtime configuration and application stores.
 *
 * @param options - Origin and per-request header resolvers owned by the consuming application.
 * @param version - API path version appended after `/api`; currently `v1`.
 * @returns An Axios instance whose base URL is `<origin>/api/<version>`.
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
