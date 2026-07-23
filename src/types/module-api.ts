/** A map used to associate an endpoint with its resource and mutation payloads. */
export type EndpointMap = Record<string, EndpointDefinition>;

/** The data contract for one REST endpoint. */
export interface EndpointDefinition<TItem = unknown, TCreate = Partial<TItem>, TUpdate = Partial<TItem>> {
  item: TItem;
  create: TCreate;
  update: TUpdate;
}

/** Query Kit's paginated list response. */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Metadata returned for a paginated resource query. */
export interface PaginationMeta {
  itemCount: number;
  pageCount: number;
  [key: string]: unknown;
}

/** Values accepted as API query parameters. */
export type QueryParameters = Record<string, unknown>;
