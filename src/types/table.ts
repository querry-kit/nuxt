import type { Ref } from 'vue';

/** A persisted key/value store, compatible with `localStorage`. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * A renderer-agnostic column description accepted by the table composable.
 *
 * `TMeta` lets applications retain renderer-specific metadata such as a label,
 * accessor, or header renderer without making this package depend on a UI library.
 */
export type TableColumnInput<TItem, TMeta extends object = Record<string, unknown>> = TMeta & {
  /** Omit the ID to exclude a conditional column from the table. */
  id?: string;
  /** Additional nested fields required when rendering this column. */
  fields?: string[];
};

/** A visible table column with a resolved ID. */
export type TableColumn<TItem, TMeta extends object = Record<string, unknown>> = TableColumnInput<TItem, TMeta> & {
  id: string;
};

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
