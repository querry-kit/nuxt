import { TableColumnInput, SortingRule, FilteringState, FilteringField } from './index.cjs';
import * as vue from 'vue';
import { UseGroupedTableOptions, GroupBranch, GroupNode, GroupPath, UseTableOptions } from './index.cjs';
import 'axios';

/**
 * Loads nested groups and leaf records across all matching resources, one branch at a time.
 *
 * @param {UseGroupedTableOptions<TItem, TColumn>} options Endpoint, scalar grouping fields and portable table preferences.
 * @returns Reactive group tree, column/filter preferences and lazy-loading actions.
 */
declare function useGroupedTable<TItem extends Record<string, unknown>, TColumn extends TableColumnInput<TItem, object> = TableColumnInput<TItem>>(options: UseGroupedTableOptions<TItem, TColumn>): {
    root: vue.ShallowReactive<GroupBranch<TItem>>;
    groups: vue.ComputedRef<GroupNode<TItem>[]>;
    grouping: vue.Ref<string[], string[]>;
    sorting: vue.Ref<SortingRule[], SortingRule[]>;
    filtering: vue.Ref<FilteringState<FilteringField<string, string, unknown>>, FilteringState<FilteringField<string, string, unknown>>>;
    itemsPerPage: vue.Ref<number, number>;
    columns: vue.ComputedRef<(TColumn & Record<string, unknown> & {
        id?: string;
        fields?: string[];
    } & {
        id: string;
    })[]>;
    fields: vue.ComputedRef<string | undefined>;
    columnOrder: vue.Ref<string[], string[]>;
    columnVisibility: vue.Ref<string[], string[]>;
    columnPinning: vue.Ref<Record<string, string[]>, Record<string, string[]>>;
    initialize: () => Promise<void>;
    refresh: () => Promise<void>;
    toggleGroup: (path: GroupPath) => Promise<void>;
    loadMoreGroups: (parentPath?: GroupPath) => Promise<void>;
    loadMoreItems: (path: GroupPath) => Promise<void>;
};

/**
 * Fetches Query Kit list data and owns portable headless-table state.
 *
 * @typeParam TItem - Resource shape returned by the endpoint.
 * @typeParam TColumn - Renderer-specific column shape retained alongside the Query Kit column metadata.
 * @param options - Endpoint, reactive columns, and optional routing, persistence, and callback adapters.
 * @returns Reactive query and table state plus `initialize`, `refresh`, and `updateRow` actions.
 *
 * @remarks
 * The composable deliberately receives route and storage adapters from its consumer, so it can run
 * in Vue and Nuxt applications without depending on either application's router or runtime state.
 * Overlapping requests are versioned, ensuring an older response cannot overwrite newer table data.
 */
declare function useTable<TItem extends Record<string, unknown>, TColumn extends TableColumnInput<TItem, object> = TableColumnInput<TItem>>(options: UseTableOptions<TItem, TColumn>): {
    page: vue.Ref<number, number>;
    itemsPerPage: vue.Ref<number, number>;
    sorting: vue.Ref<SortingRule[], SortingRule[]>;
    filtering: vue.Ref<FilteringState<FilteringField<string, string, unknown>>, FilteringState<FilteringField<string, string, unknown>>>;
    columnOrder: vue.Ref<string[], string[]>;
    columnVisibility: vue.Ref<string[], string[]>;
    columnPinning: vue.Ref<Record<string, string[]>, Record<string, string[]>>;
    columns: vue.ComputedRef<(TColumn & Record<string, unknown> & {
        id?: string;
        fields?: string[];
    } & {
        id: string;
    })[]>;
    fields: vue.ComputedRef<string | undefined>;
    items: vue.ShallowRef<TItem[], TItem[]>;
    totalItems: vue.Ref<number, number>;
    totalPages: vue.Ref<number, number>;
    loading: vue.Ref<boolean, boolean>;
    error: vue.Ref<unknown, unknown>;
    queryParams: vue.ComputedRef<{
        page: number;
        perPage: number;
        where: string | undefined;
        orderBy: string | undefined;
        fields: string | undefined;
        include: Record<string, unknown> | undefined;
    }>;
    initialize: () => Promise<void>;
    refresh: () => Promise<void>;
    updateRow: (row: TItem) => void;
};

export { useGroupedTable, useTable };
