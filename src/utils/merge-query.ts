/**
 * Deeply merges object query fragments; later scalar values replace earlier values.
 *
 * @typeParam T - Shape of the base query.
 * @param {T} base Existing query fragment.
 * @param {Record<string, unknown>} extra Fragment whose values take precedence.
 * @returns {T} The merged query, preserving nested object properties from both inputs.
 */
export function mergeQuery<T extends Record<string, unknown>>(base: T, extra: Record<string, unknown>): T {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    const existing = result[key];
    result[key] =
      existing &&
      value &&
      typeof existing === 'object' &&
      typeof value === 'object' &&
      !Array.isArray(existing) &&
      !Array.isArray(value)
        ? mergeQuery(existing as Record<string, unknown>, value as Record<string, unknown>)
        : value;
  }
  return result as T;
}
