import { FilteringState, QueryParameters, SortingRule } from './types.cjs';
import 'vue';

/**
 * Serializes a Query Kit request with the same bracket notation used by Nest resource endpoints.
 *
 * @param query - Query Kit query payload.
 * @returns A leading-question-mark query string, or an empty string for an empty payload.
 */
declare function serializeQuery(query?: QueryParameters): string;
/**
 * Builds the compact Query Kit fields grammar from dot-separated field paths.
 *
 * @param paths - Field paths such as `id` and `author.name`.
 * @returns The compact fields string, or `undefined` when no usable path is supplied.
 */
declare function pathsToFieldsQuery(paths: Iterable<string>): string | undefined;
/**
 * Expands dotted object keys into the nested shape expected by Query Kit.
 *
 * @param value - Flat mapping such as `{ 'author.name': 'asc' }`.
 * @returns The equivalent nested object.
 */
declare function unflatten(value: Record<string, unknown>): Record<string, unknown>;
/**
 * Converts table sorting state to Query Kit's nested `orderBy` payload.
 *
 * @param sorting - Ordered UI sorting rules.
 * @returns A Query Kit order-by array, or `undefined` when no rule is active.
 */
declare function sortingToOrderBy(sorting: readonly SortingRule[]): Record<string, unknown>[] | undefined;
/**
 * Converts UI filtering state to a Query Kit `where` payload.
 *
 * @param filtering - User-controlled filtering rules and their `AND`/`OR` operator.
 * @returns A nested Query Kit where expression, or `undefined` when no filter has a value.
 */
declare function filteringToWhere(filtering: FilteringState): Record<string, unknown> | undefined;
/**
 * Combines non-empty Query Kit conditions with an `AND` expression.
 *
 * @param conditions - Optional where fragments.
 * @returns One fragment unchanged, multiple fragments in an `AND`, or `undefined` for none.
 */
declare function andWhere(...conditions: Array<Record<string, unknown> | undefined>): Record<string, unknown> | undefined;
/**
 * Safely decodes JSON for persisted state and URL payloads.
 *
 * @typeParam T - Expected decoded value type.
 * @param value - Serialized JSON or an absent storage value.
 * @param fallback - Value returned for absent or invalid JSON.
 * @returns Decoded JSON or the fallback.
 */
declare function parseJson<T>(value: string | null | undefined, fallback: T): T;
/**
 * Compares plain object and array values structurally for reactive query watchers.
 *
 * @param left - First value.
 * @param right - Second value.
 * @returns Whether both values have the same recursive structure and scalar values.
 */
declare function isEqual(left: unknown, right: unknown): boolean;
/**
 * Deeply merges object query fragments; later scalar values replace earlier values.
 *
 * @typeParam T - Shape of the base query.
 * @param base - Existing query fragment.
 * @param extra - Fragment whose values take precedence.
 * @returns The merged query, preserving nested object properties from both inputs.
 */
declare function mergeQuery<T extends Record<string, unknown>>(base: T, extra: Record<string, unknown>): T;

export { andWhere, filteringToWhere, isEqual, mergeQuery, parseJson, pathsToFieldsQuery, serializeQuery, sortingToOrderBy, unflatten };
