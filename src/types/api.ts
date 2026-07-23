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
