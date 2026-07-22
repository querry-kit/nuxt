import type { Ref } from 'vue';

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

/** A persisted key/value store, compatible with `localStorage`. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** A lightweight column description shared by the core composables and UI package. */
export interface TableColumn<T> {
  id: string;
  /** Additional nested fields required when rendering this column. */
  fields?: string[];
  /** Optional UI metadata deliberately left opaque to the headless core. */
  [key: string]: unknown;
}

/** TanStack-compatible sorting state without a dependency on its UI adapter. */
export interface SortingRule {
  id: string;
  desc: boolean;
}

/** A single Query Kit filtering condition. */
export interface FilteringField {
  id: string;
  field: string;
  type?: string;
  operator?: string;
  value?: unknown;
}

/** Filtering state emitted by the table UI. */
export interface FilteringState {
  operator: 'AND' | 'OR';
  filters: FilteringField[];
}

/** Reactive URL query value used for page synchronisation without Vue Router. */
export type RoutePageRef = Ref<number | string | null | undefined>;
