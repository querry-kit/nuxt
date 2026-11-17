import type { TableColumnInput } from './table';
import type { TableLoadingMode, UseTableOptions } from './table-options';

/** JSON scalar group key. Date values can be represented as ISO strings. */
export type GroupValue = string | number | boolean | null;
/** One selectable scalar field. Applications control labels and permitted fields. */
export interface GroupingField {
  value: string;
  label: string;
  disabled?: boolean;
}
/** One typed equality predicate identifying a node in a nested group tree. */
export interface GroupPathEntry {
  field: string;
  value: GroupValue;
}
/** Ordered ancestor predicates, including the current node. */
export type GroupPath = readonly GroupPathEntry[];
/** Reactive state shared by group roots and nodes. */
export interface GroupBranch<TItem> {
  children: GroupNode<TItem>[];
  items: TItem[];
  loading: boolean;
  error: unknown;
  hasMore: boolean;
}
/** A server-backed group containing child groups or leaf records. */
export interface GroupNode<TItem> extends GroupBranch<TItem> {
  key: string;
  path: GroupPath;
  field: string;
  value: GroupValue;
  count: number;
  expanded: boolean;
  loaded: boolean;
}

/** Page state for an ungrouped root or a leaf group. */
export interface GroupItemPage {
  page: number;
  totalItems: number;
}

/** Enables the grouped table's switchable row loading. */
export interface GroupedTableLoadingOptions {
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
export interface UseGroupedTableOptions<
  TItem extends Record<string, unknown>,
  TColumn extends TableColumnInput<TItem, object> = TableColumnInput<TItem>,
> extends Omit<UseTableOptions<TItem, TColumn>, 'routePage' | 'initialMode'> {
  /** Scalar fields permitted by the endpoint; never a substitute for server validation. */
  groupableFields: readonly GroupingField[];
  /** Initial ordered grouping when no valid saved preference exists. */
  defaultGrouping?: string[];
  /** Groups fetched per branch request; defaults to 25. */
  groupBatchSize?: number;
  /** Enables pagination and configurable infinite loading while preserving existing defaults when omitted. */
  loading?: GroupedTableLoadingOptions;
}
