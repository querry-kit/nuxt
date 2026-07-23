import { computed, onMounted, ref, shallowRef, unref, watch } from 'vue';
import { useModuleApi } from '../api';
import type { UseAutocompleteOptions } from '../types/autocomplete-options';
import type { QueryParameters } from '../types/module-api';
import { isEqual } from '../utils/is-equal';
import { mergeQuery } from '../utils/merge-query';

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
export function useAutocomplete<TItem extends Record<string, unknown>>(options: UseAutocompleteOptions<TItem>) {
  const identityKey = options.identityKey ?? ('id' as keyof TItem & string);
  const currentValueItems = shallowRef<TItem[]>([]);
  const queryItems = shallowRef<TItem[]>([]);
  const currentLoading = ref(false);
  const queryLoading = ref(false);
  const error = ref<unknown>();

  // A response may resolve after a newer request; its sequence number then makes it stale.
  let currentRequest = 0;
  let queryRequest = 0;
  const api = useModuleApi(options.api, options.endpoint);
  const loading = computed(() => currentLoading.value || queryLoading.value);

  /** Query that reloads the currently selected identities, if any. */
  const selectedQuery = computed<QueryParameters | undefined>(() => {
    const selected = options.currentValue === undefined ? undefined : unref(options.currentValue);
    if (selected === null || selected === undefined || (Array.isArray(selected) && selected.length === 0))
      return undefined;
    return {
      where: { [identityKey]: Array.isArray(selected) ? { in: selected } : selected },
      perPage: 1000,
    };
  });

  /**
   * Fetches the resources represented by `currentValue`.
   *
   * The selection query is merged with the consumer query so both requests use the same includes,
   * fields, and other shared query parameters.
   */
  const loadCurrentItems = async () => {
    const request = ++currentRequest;
    const selected = selectedQuery.value;
    if (!selected) {
      currentValueItems.value = [];
      return;
    }
    currentLoading.value = true;
    try {
      const query = mergeQuery((unref(options.query) ?? {}) as QueryParameters, selected);
      const response = await api.query(query);
      // Ignore an older response when the selection changed while it was in flight.
      if (request === currentRequest) currentValueItems.value = response.data.items as TItem[];
    } catch (caught) {
      if (request === currentRequest) {
        currentValueItems.value = [];
        error.value = caught;
      }
    } finally {
      if (request === currentRequest) currentLoading.value = false;
    }
  };

  /** Fetches resources matching the active consumer query. */
  const loadItems = async () => {
    const request = ++queryRequest;
    queryLoading.value = true;
    try {
      const response = await api.query((unref(options.query) ?? {}) as QueryParameters);
      // Ignore an older response when the search query changed while it was in flight.
      if (request === queryRequest) queryItems.value = response.data.items as TItem[];
    } catch (caught) {
      if (request === queryRequest) {
        queryItems.value = [];
        error.value = caught;
      }
    } finally {
      if (request === queryRequest) queryLoading.value = false;
    }
  };

  /**
   * Selected items first, followed by search results that have not already been seen.
   *
   * `itemDisabled` is applied only to the returned view; the cached API resources stay unchanged.
   */
  const items = computed<Array<TItem & { disabled?: boolean }>>(() => {
    const seen = new Set<unknown>();
    const merged: TItem[] = [];
    for (const item of [...currentValueItems.value, ...queryItems.value]) {
      const identity = item[identityKey];
      if (!seen.has(identity)) {
        seen.add(identity);
        merged.push(item);
      }
    }
    return options.itemDisabled ? merged.map((item) => ({ ...item, disabled: options.itemDisabled?.(item) })) : merged;
  });

  /** Loads the selected and searched resources concurrently. */
  const initialize = async () => {
    await Promise.all([loadCurrentItems(), loadItems()]);
  };

  /** Alias for {@link initialize}; provided as the conventional reload action. */
  const refresh = initialize;

  // Selection and search results are intentionally watched separately so one change does not reload both.
  watch(selectedQuery, (next, previous) => {
    if (!isEqual(next, previous)) void loadCurrentItems();
  });
  watch(
    () => unref(options.query),
    (next, previous) => {
      if (!isEqual(next, previous)) void loadItems();
    },
    { deep: true },
  );

  // Defer the initial request until the composable is mounted unless the consumer opts out.
  if (options.immediate !== false) onMounted(() => void initialize());

  return {
    items,
    loading,
    error,
    currentValueItems,
    queryItems,
    loadCurrentItems,
    loadItems,
    initialize,
    refresh,
  };
}
