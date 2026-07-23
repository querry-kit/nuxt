import { ref, type Ref, watch } from 'vue';
import type { StorageLike } from '../types/table';
import { parseJson } from '../utils/parse-json';

export function persistedRef<T>(key: string, fallback: T, storage?: StorageLike): Ref<T> {
  const state = ref(storage ? parseJson(storage.getItem(key), fallback) : fallback) as Ref<T>;
  watch(
    state,
    (value) => {
      try {
        storage?.setItem(key, JSON.stringify(value));
      } catch {
        // Persistence is optional; quota and privacy errors must not break the table.
      }
    },
    { deep: true },
  );
  return state;
}
