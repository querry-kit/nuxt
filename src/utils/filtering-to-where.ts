import type { FilteringState } from '../types/table';
import { unflatten } from './unflatten';

/**
 * Converts UI filtering state to a Query Kit `where` payload.
 *
 * @param {FilteringState} filtering User-controlled filtering rules and their `AND`/`OR` operator.
 * @returns {Record<string, unknown> | undefined} A nested Query Kit where expression, or `undefined` when no filter has a value.
 */
export function filteringToWhere(filtering: FilteringState): Record<string, unknown> | undefined {
  const conditions = filtering.filters
    .filter((filter) => filter.value !== undefined)
    .map((filter) => {
      const value = filter.operator ? { [filter.operator]: filter.value } : filter.value;
      return unflatten({ [filter.field]: value });
    });

  if (conditions.length === 0) return undefined;
  if (filtering.operator === 'OR') return { OR: conditions };
  else if (conditions.length === 1) return conditions[0];
  else return { AND: conditions };
}
