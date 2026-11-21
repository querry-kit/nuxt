import { g as TableColumnInput, f as StorageLike, R as RoutePageRef } from './table-DS2LRoSQ.cjs';
import { AxiosInstance } from 'axios';
import { Ref, MaybeRef } from 'vue';

/** How a table presents subsequent rows. */
type TableLoadingMode = 'pagination' | 'infinite';
/** Configuration for the headless Query Kit table composable. */
interface UseTableOptions<TItem extends Record<string, unknown>, TColumn extends TableColumnInput<TItem, object> = TableColumnInput<TItem>> {
    /** Axios client created and configured by the consumer. */
    api: AxiosInstance;
    /** Resource endpoint relative to the API version, for example `books`. */
    endpoint: string;
    /** Unique key used for local persistence. `name` is retained as an alias for compatibility. */
    persistenceKey?: string;
    /** Deprecated alias for `persistenceKey`. */
    name?: string;
    /** Reactive column descriptions. Their IDs determine the selected fields. */
    columns: Ref<readonly TColumn[]>;
    /** Fields always included in the backend selection; defaults to `id`. */
    staticFields?: string[];
    /** Static relation include payload sent with every query. */
    staticInclude?: Record<string, unknown>;
    /** Reactive filter added to every request before user-controlled filters. */
    staticFilter?: MaybeRef<Record<string, unknown> | undefined>;
    /** Adds an `isArchived` condition when specified. */
    isArchived?: boolean;
    /** Initial page size when no persisted preference exists; defaults to 25. */
    defaultItemsPerPage?: number;
    /** Initial row loading mode; defaults to pagination. */
    initialMode?: TableLoadingMode;
    /** Persistence adapter; `localStorage` is used automatically when available. */
    storage?: StorageLike;
    /** A ref backed by the consumer's URL query parameter; no router is required. */
    routePage?: RoutePageRef;
    /** Row property used by `updateRow`; defaults to `id`. */
    identityKey?: keyof TItem & string;
    /** Called after the initial request has completed. */
    onInitialized?: () => void | Promise<void>;
    /** Called with current rows after each successful, non-stale request. */
    onRefreshed?: (items: TItem[]) => void | Promise<void>;
    /** Called for the latest request failure. */
    onError?: (error: unknown) => void | Promise<void>;
}

/** JSON scalar group key. Date values can be represented as ISO strings. */
type GroupValue = string | number | boolean | null;
/** One selectable scalar field. Applications control labels and permitted fields. */
interface GroupingField {
    value: string;
    label: string;
    disabled?: boolean;
}
/** One typed equality predicate identifying a node in a nested group tree. */
interface GroupPathEntry {
    field: string;
    value: GroupValue;
}
/** Ordered ancestor predicates, including the current node. */
type GroupPath = readonly GroupPathEntry[];
/** Reactive state shared by group roots and nodes. */
interface GroupBranch<TItem> {
    children: GroupNode<TItem>[];
    items: TItem[];
    loading: boolean;
    error: unknown;
    hasMore: boolean;
}
/** A server-backed group containing child groups or leaf records. */
interface GroupNode<TItem> extends GroupBranch<TItem> {
    key: string;
    path: GroupPath;
    field: string;
    value: GroupValue;
    count: number;
    /** Requested sums over all matching records in this group, independent of its loaded rows. */
    sum?: Partial<Record<Extract<keyof TItem, string>, number | null>>;
    expanded: boolean;
    loaded: boolean;
}
/** Page state for an ungrouped root or a leaf group. */
interface GroupItemPage {
    page: number;
    totalItems: number;
    /** Pending or failed page request. The committed page stays visible until it succeeds. */
    requestedPage?: number;
}
/** Enables the grouped table's switchable row loading. */
interface GroupedTableLoadingOptions {
    /** Initial row loading mode; defaults to pagination. */
    initialMode?: TableLoadingMode;
    /** Initial number of rows per leaf in infinite mode; defaults to the page size. */
    initialGroupItems?: number;
    /** Number of additional rows per leaf in infinite mode; defaults to the page size. */
    groupLoadMoreItems?: number;
    /** Load the initial rows for visible, collapsed leaves in infinite mode; defaults to true. */
    preloadGroupItems?: boolean;
}
/** Options for lazy grouping across the complete filtered resource dataset. */
interface UseGroupedTableOptions<TItem extends Record<string, unknown>, TColumn extends TableColumnInput<TItem, object> = TableColumnInput<TItem>> extends Omit<UseTableOptions<TItem, TColumn>, 'routePage' | 'initialMode'> {
    /** Scalar fields permitted by the endpoint; never a substitute for server validation. */
    groupableFields: readonly GroupingField[];
    /** Initial ordered grouping when no valid saved preference exists. */
    defaultGrouping?: string[];
    /** Restores expanded group paths from the table's preference storage. Defaults to false. */
    persistExpansion?: boolean;
    /** Groups fetched per branch request; defaults to 25. */
    groupBatchSize?: number;
    /** Numeric fields to request in `_sum` with every group batch. */
    groupSumFields?: readonly Extract<keyof TItem, string>[];
    /** Enables pagination and configurable infinite loading while preserving existing defaults when omitted. */
    loading?: GroupedTableLoadingOptions;
}

export type { GroupBranch as G, TableLoadingMode as T, UseGroupedTableOptions as U, GroupItemPage as a, GroupNode as b, GroupPath as c, GroupPathEntry as d, GroupValue as e, GroupedTableLoadingOptions as f, GroupingField as g, UseTableOptions as h };
