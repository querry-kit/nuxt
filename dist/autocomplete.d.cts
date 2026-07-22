import * as vue from 'vue';
import { MaybeRef } from 'vue';
import { AxiosInstance } from 'axios';
import { QueryParameters } from './types.cjs';

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
/**
 * Loads both selected and search-result resources, then combines them without duplicate identities.
 *
 * @typeParam TItem - Resource shape returned by the endpoint.
 * @param options - Endpoint, selected value, search query, and optional option decorator.
 * @returns Reactive items and loading state plus explicit loading and refresh actions.
 */
declare function useAutocomplete<TItem extends Record<string, unknown>>(options: UseAutocompleteOptions<TItem>): {
    items: vue.ComputedRef<(TItem & {
        disabled?: boolean;
    })[]>;
    loading: vue.ComputedRef<boolean>;
    error: vue.Ref<unknown, unknown>;
    currentValueItems: vue.ShallowRef<TItem[], TItem[]>;
    queryItems: vue.ShallowRef<TItem[], TItem[]>;
    loadCurrentItems: () => Promise<void>;
    loadItems: () => Promise<void>;
    initialize: () => Promise<void>;
    refresh: () => Promise<void>;
};

export { type UseAutocompleteOptions, useAutocomplete };
