/**
 * Safely decodes JSON for persisted state and URL payloads.
 *
 * @typeParam T - Expected decoded value type.
 * @param {string | null | undefined} value - Serialized JSON or an absent storage value.
 * @param {T} fallback - Value returned for absent or invalid JSON.
 * @returns {T} Decoded JSON or the fallback.
 */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
