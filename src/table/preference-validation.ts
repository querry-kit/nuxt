/**
 * Checks stored lists of column identities.
 *
 * @param {unknown} value Decoded preference.
 * @returns {boolean} Whether every entry is a string.
 */
export function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Checks stored sorting rules before query conversion.
 *
 * @param {unknown} value Decoded preference.
 * @returns {boolean} Whether every rule has an identity and direction.
 */
export function isSortingState(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null && typeof item === 'object' && typeof item.id === 'string' && typeof item.desc === 'boolean',
    )
  );
}

/**
 * Checks stored filter structures before query conversion.
 *
 * @param {unknown} value Decoded preference.
 * @returns {boolean} Whether the filter group and its rules are usable.
 */
export function isFilteringState(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  const group = value as { operator?: unknown; filters?: unknown };
  return (
    (group.operator === 'AND' || group.operator === 'OR') &&
    Array.isArray(group.filters) &&
    group.filters.every(
      (filter) =>
        filter !== null &&
        typeof filter === 'object' &&
        typeof filter.id === 'string' &&
        typeof filter.field === 'string' &&
        (filter.operator === undefined ||
          ['in', 'notIn', 'equals', 'not', 'lt', 'lte', 'gt', 'gte'].includes(filter.operator)),
    )
  );
}

/**
 * Checks stored pin groups before they reach table controls.
 *
 * @param {unknown} value Decoded preference.
 * @returns {boolean} Whether each pin group contains string identities.
 */
export function isPinningState(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.entries(value).every(([key, ids]) => ['left', 'right'].includes(key) && isStringArray(ids))
  );
}
