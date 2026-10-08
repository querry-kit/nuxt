import { Ref } from 'vue';

/** A persisted key/value store, compatible with `localStorage`. */
interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
/**
 * A renderer-agnostic column description accepted by the table composable.
 *
 * `TMeta` lets applications retain renderer-specific metadata such as a label,
 * accessor, or header renderer without making this package depend on a UI library.
 */
type TableColumnInput<TItem, TMeta extends object = Record<string, unknown>> = TMeta & {
    /** Omit the ID to exclude a conditional column from the table. */
    id?: string;
    /** Additional nested fields required when rendering this column. */
    fields?: string[];
};
/** A visible table column with a resolved ID. */
type TableColumn<TItem, TMeta extends object = Record<string, unknown>> = TableColumnInput<TItem, TMeta> & {
    id: string;
};
/** TanStack-compatible sorting state without a dependency on its UI adapter. */
interface SortingRule {
    id: string;
    desc: boolean;
}
/** A selectable field offered by a sorting UI. */
type SortingField<TMeta extends object = object> = TMeta & {
    value: string;
    label: string;
};
/** A selectable field offered by a filtering UI. */
type FilterFieldDefinition<TType extends string = string, TMeta extends object = object> = TMeta & {
    value: string;
    label: string;
    type: TType;
};
/** The boolean operator used to combine filter conditions. */
type FilteringMode = 'AND' | 'OR';
/** Operators supported by the Query Kit `where` query convention. */
type FilteringFieldOperator = 'in' | 'notIn' | 'equals' | 'not' | 'lt' | 'lte' | 'gt' | 'gte';
/** A single Query Kit filtering condition. */
interface FilteringField<TType extends string = string, TOperator extends string = string, TValue = unknown> {
    id: string;
    field: string;
    type?: TType;
    operator?: TOperator;
    value?: TValue;
}
/** Filtering state emitted by the table UI. */
interface FilteringState<TField extends FilteringField = FilteringField> {
    operator: FilteringMode;
    filters: TField[];
}
/** Reactive URL query value used for page synchronisation without Vue Router. */
type RoutePageRef = Ref<number | string | null | undefined>;

export type { FilterFieldDefinition as F, RoutePageRef as R, SortingField as S, TableColumn as T, FilteringField as a, FilteringFieldOperator as b, FilteringMode as c, FilteringState as d, SortingRule as e, StorageLike as f, TableColumnInput as g };
