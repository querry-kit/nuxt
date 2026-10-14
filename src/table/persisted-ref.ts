import { ref, type Ref, watch } from 'vue';
import type { StorageLike } from '../types/table';
import { parseJson } from '../utils/parse-json';

/**
 * Restores validated preferences and ignores unavailable or unwritable storage.
 *
 * @param {string} key Storage key.
 * @param {T} fallback Default preference.
 * @param {StorageLike} storage Optional persistence adapter.
 * @param {(value: unknown) => boolean} validate Checks the decoded preference's shape.
 * @returns {Ref<T>} Reactive preference, persisted on change.
 */
export function persistedRef<T>(
  key: string,
  fallback: T,
  storage?: StorageLike,
  validate: (value: unknown) => boolean = (value) => value !== null && typeof value === typeof fallback,
): Ref<T> {
  let initial = fallback;
  try {
    const saved: unknown = parseJson(storage?.getItem(key), fallback);
    if (validate(saved)) initial = saved as T;
  } catch {
    // Storage reads can fail in private or restricted browser contexts.
  }
  const state = ref(initial) as Ref<T>;
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
