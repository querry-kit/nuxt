import * as vue from 'vue';
import { U as UseAutocompleteOptions } from './autocomplete-options-Do_AQ8Hl.js';
import 'axios';
import './module-api-BKXoZbyX.js';

/**
 * Loads both selected and search-result resources, then combines them without duplicate identities.
 *
 * @typeParam TItem - Resource shape returned by the endpoint.
 * @param {UseAutocompleteOptions<TItem>} options - Endpoint, selected value, search query, and optional option decorator.
 * @returns Reactive items and loading state plus explicit loading and refresh actions.
 *
 * @remarks
 * Selected resources are fetched independently from the active search query. This keeps a selected
 * option renderable when it no longer matches the current search criteria. When requests overlap,
 * only the newest response for each request type is allowed to update state.
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

export { useAutocomplete };
