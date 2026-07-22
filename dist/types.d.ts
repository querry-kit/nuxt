import { Ref } from 'vue';

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
/** A persisted key/value store, compatible with `localStorage`. */
interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
/** A lightweight column description shared by the core composables and UI package. */
interface TableColumn<T> {
    id: string;
    /** Additional nested fields required when rendering this column. */
    fields?: string[];
    /** Optional UI metadata deliberately left opaque to the headless core. */
    [key: string]: unknown;
}
/** TanStack-compatible sorting state without a dependency on its UI adapter. */
interface SortingRule {
    id: string;
    desc: boolean;
}
/** A single Query Kit filtering condition. */
interface FilteringField {
    id: string;
    field: string;
    type?: string;
    operator?: string;
    value?: unknown;
}
/** Filtering state emitted by the table UI. */
interface FilteringState {
    operator: 'AND' | 'OR';
    filters: FilteringField[];
}
/** Reactive URL query value used for page synchronisation without Vue Router. */
type RoutePageRef = Ref<number | string | null | undefined>;

export type { EndpointDefinition, EndpointMap, FilteringField, FilteringState, PaginatedResponse, PaginationMeta, QueryParameters, RoutePageRef, SortingRule, StorageLike, TableColumn };
