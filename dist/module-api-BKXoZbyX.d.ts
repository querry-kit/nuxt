/** A map used to associate an endpoint with its resource and mutation payloads. */
type EndpointMap = Record<string, EndpointDefinition>;
/** The data contract for one REST endpoint. */
interface EndpointDefinition<TItem = unknown, TCreate = Partial<TItem>, TUpdate = Partial<TItem>> {
    item: TItem;
    create: TCreate;
    update: TUpdate;
}
/** Query Kit's paginated list response. */
interface PaginatedResponse<T> {
    items: T[];
    meta: PaginationMeta;
}
/** Metadata returned for a paginated resource query. */
interface PaginationMeta {
    itemCount: number;
    pageCount: number;
    [key: string]: unknown;
}
/** Values accepted as API query parameters. */
type QueryParameters = Record<string, unknown>;

export type { EndpointDefinition as E, PaginatedResponse as P, QueryParameters as Q, EndpointMap as a, PaginationMeta as b };
