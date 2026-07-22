import {
  useModuleApi
} from "./chunk-HNMNAHVE.js";
import {
  isEqual,
  mergeQuery
} from "./chunk-RROS6BGV.js";

// src/autocomplete/index.ts
import { computed, onMounted, ref, shallowRef, unref, watch } from "vue";
function useAutocomplete(options) {
  const identityKey = options.identityKey ?? "id";
  const currentValueItems = shallowRef([]);
  const queryItems = shallowRef([]);
  const currentLoading = ref(false);
  const queryLoading = ref(false);
  const error = ref();
  let currentRequest = 0;
  let queryRequest = 0;
  const api = useModuleApi(options.api, options.endpoint);
  const loading = computed(() => currentLoading.value || queryLoading.value);
  const selectedQuery = computed(() => {
    const selected = options.currentValue === void 0 ? void 0 : unref(options.currentValue);
    if (selected === null || selected === void 0 || Array.isArray(selected) && selected.length === 0)
      return void 0;
    return {
      where: { [identityKey]: Array.isArray(selected) ? { in: selected } : selected },
      perPage: 1e3
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
      const query = mergeQuery(unref(options.query) ?? {}, selected);
      const response = await api.query(query);
      if (request === currentRequest) currentValueItems.value = response.data.items;
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
      const response = await api.query(unref(options.query) ?? {});
      if (request === queryRequest) queryItems.value = response.data.items;
    } catch (caught) {
      if (request === queryRequest) {
        queryItems.value = [];
        error.value = caught;
      }
    } finally {
      if (request === queryRequest) queryLoading.value = false;
    }
  };
  const items = computed(() => {
    const seen = /* @__PURE__ */ new Set();
    const merged = [];
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
    { deep: true }
  );
  if (options.immediate !== false) onMounted(() => void initialize());
  return { items, loading, error, currentValueItems, queryItems, loadCurrentItems, loadItems, initialize, refresh };
}

export {
  useAutocomplete
};
//# sourceMappingURL=chunk-IZXNQCP2.js.map