import { AxiosInstance } from 'axios';
import { Ref, MaybeRef } from 'vue';
import { c as TableColumnInput, b as StorageLike, R as RoutePageRef } from './table-DCyoADKT.js';

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

export type { UseTableOptions as U };
