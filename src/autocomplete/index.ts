import type { AxiosInstance } from 'axios';
import type { MaybeRef } from 'vue';
import { computed, onMounted, ref, shallowRef, unref, watch } from 'vue';

import { useModuleApi } from '../module-api';
import type { QueryParameters } from '../types';
import { isEqual, mergeQuery } from '../utils';

/** Configuration for the portable Query Kit autocomplete composable. */
export interface UseAutocompleteOptions<TItem extends Record<string, unknown>> {
  api: AxiosInstance;
  endpoint: string;
  query?: MaybeRef<QueryParameters | undefined>;
  currentValue?: MaybeRef<string | number | Array<string | number> | null | undefined>;
  identityKey?: keyof TItem & string;
  itemDisabled?: (item: TItem) => boolean;
  /** Set false when the consumer wants to invoke `initialize` itself. */
  immediate?: boolean;
}

/**
 * Loads both selected and search-result resources, then combines them without duplicate identities.
 */
export function useAutocomplete<TItem extends Record<string, unknown>>(options: UseAutocompleteOptions<TItem>) {
  const identityKey = options.identityKey ?? ('id' as keyof TItem & string);
  const currentValueItems = shallowRef<TItem[]>([]);
  const queryItems = shallowRef<TItem[]>([]);
  const currentLoading = ref(false);
  const queryLoading = ref(false);
  const error = ref<unknown>();
  let currentRequest = 0;
  let queryRequest = 0;
  const api = useModuleApi(options.api, options.endpoint);
  const loading = computed(() => currentLoading.value || queryLoading.value);

  const selectedQuery = computed<QueryParameters | undefined>(() => {
    const selected = options.currentValue === undefined ? undefined : unref(options.currentValue);
    if (selected === null || selected === undefined || (Array.isArray(selected) && selected.length === 0))
      return undefined;
    return {
      where: { [identityKey]: Array.isArray(selected) ? { in: selected } : selected },
      perPage: 1000,
    };
  });

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

  const loadItems = async () => {
    const request = ++queryRequest;
    queryLoading.value = true;
    try {
      const response = await api.query((unref(options.query) ?? {}) as QueryParameters);
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

  const initialize = async () => {
    await Promise.all([loadCurrentItems(), loadItems()]);
  };
  const refresh = initialize;
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
  if (options.immediate !== false) onMounted(() => void initialize());

  return { items, loading, error, currentValueItems, queryItems, loadCurrentItems, loadItems, initialize, refresh };
}
