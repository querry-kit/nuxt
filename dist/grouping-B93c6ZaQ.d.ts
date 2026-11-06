import { g as TableColumnInput, f as StorageLike, R as RoutePageRef } from './table-DS2LRoSQ.js';
import { AxiosInstance } from 'axios';
import { Ref, MaybeRef } from 'vue';

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
    expanded: boolean;
    loaded: boolean;
}
/** Options for lazy grouping across the complete filtered resource dataset. */
interface UseGroupedTableOptions<TItem extends Record<string, unknown>, TColumn extends TableColumnInput<TItem, object> = TableColumnInput<TItem>> extends Omit<UseTableOptions<TItem, TColumn>, 'routePage'> {
    /** Scalar fields permitted by the endpoint; never a substitute for server validation. */
    groupableFields: readonly GroupingField[];
    /** Initial ordered grouping when no valid saved preference exists. */
    defaultGrouping?: string[];
    /** Groups fetched per branch request; defaults to 25. */
    groupBatchSize?: number;
}

export type { GroupBranch as G, UseGroupedTableOptions as U, GroupNode as a, GroupPath as b, GroupPathEntry as c, GroupValue as d, GroupingField as e, UseTableOptions as f };
