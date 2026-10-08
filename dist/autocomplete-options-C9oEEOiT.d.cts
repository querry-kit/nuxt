import { AxiosInstance } from 'axios';
import { MaybeRef } from 'vue';
import { Q as QueryParameters } from './module-api-BKXoZbyX.cjs';

/** Configuration for the portable Query Kit autocomplete composable. */
interface UseAutocompleteOptions<TItem extends Record<string, unknown>> {
    /** Axios client created and configured by the consumer. */
    api: AxiosInstance;
    /** Resource endpoint relative to the API version, for example `users`. */
    endpoint: string;
    /** Reactive query used to fetch search results. */
    query?: MaybeRef<QueryParameters | undefined>;
    /** Selected identity or identities kept loaded even when absent from `query`. */
    currentValue?: MaybeRef<string | number | Array<string | number> | null | undefined>;
    /** Resource property used for selection and deduplication; defaults to `id`. */
    identityKey?: keyof TItem & string;
    /** Adds a derived `disabled` property to returned options. */
    itemDisabled?: (item: TItem) => boolean;
    /** Set false when the consumer wants to invoke `initialize` itself. */
    immediate?: boolean;
}

export type { UseAutocompleteOptions as U };
