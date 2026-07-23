import type { SortingRule } from '../types/table';
import { unflatten } from './unflatten';

/**
 * Converts table sorting state to Query Kit's nested `orderBy` payload.
 *
 * @param {SortingRule[]} sorting Ordered UI sorting rules.
 * @returns {Record<string, unknown>[] | undefined} A Query Kit order-by array, or `undefined` when no rule is active.
 */
export function sortingToOrderBy(sorting: readonly SortingRule[]): Record<string, unknown>[] | undefined {
  if (sorting.length === 0) return undefined;
  return sorting.map(({ id, desc }) => unflatten({ [id]: desc ? 'desc' : 'asc' }));
}
