import * as vue from 'vue';
import { c as TableColumnInput, S as SortingRule, a as FilteringState } from './table-DCyoADKT.js';
import { U as UseTableOptions } from './table-options-CnJ2L77V.js';
import 'axios';

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
    filtering: vue.Ref<FilteringState, FilteringState>;
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

export { useTable };
