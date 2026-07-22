import * as vue from 'vue';
import { Ref, MaybeRef } from 'vue';
import { AxiosInstance } from 'axios';
import { TableColumn, StorageLike, RoutePageRef, SortingRule, FilteringState } from './types.cjs';

/** Configuration for the headless Query Kit table composable. */
interface UseTableOptions<TItem extends Record<string, unknown>> {
    /** Axios client created and configured by the consumer. */
    api: AxiosInstance;
    /** Resource endpoint relative to the API version, for example `books`. */
    endpoint: string;
    /** Unique key used for local persistence. `name` is retained as an alias for compatibility. */
    persistenceKey?: string;
    /** Deprecated alias for `persistenceKey`. */
    name?: string;
    /** Reactive column descriptions. Their IDs determine the selected fields. */
    columns: Ref<readonly TableColumn<TItem>[]>;
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
/**
 * Fetches Query Kit list data and owns portable table state.
 *
 * Consumers provide route and storage adapters explicitly, keeping the composable usable in Vue and Nuxt alike.
 *
 * @typeParam TItem - Resource shape returned by the endpoint.
 * @param options - Endpoint, reactive columns, and optional routing, persistence, and callback adapters.
 * @returns Reactive table state plus `initialize`, `refresh`, and `updateRow` actions.
 */
declare function useTable<TItem extends Record<string, unknown>>(options: UseTableOptions<TItem>): {
    page: Ref<number, number>;
    itemsPerPage: Ref<number, number>;
    sorting: Ref<SortingRule[], SortingRule[]>;
    filtering: Ref<FilteringState, FilteringState>;
    columnOrder: Ref<string[], string[]>;
    columnVisibility: Ref<string[], string[]>;
    columnPinning: Ref<Record<string, string[]>, Record<string, string[]>>;
    columns: vue.ComputedRef<TableColumn<TItem>[]>;
    fields: vue.ComputedRef<string | undefined>;
    items: vue.ShallowRef<TItem[], TItem[]>;
    totalItems: Ref<number, number>;
    totalPages: Ref<number, number>;
    loading: Ref<boolean, boolean>;
    error: Ref<unknown, unknown>;
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

export { type UseTableOptions, useTable };
