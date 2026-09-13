import { d as FilteringState, e as SortingRule } from './table-DS2LRoSQ.cjs';
import { Q as QueryParameters } from './module-api-BKXoZbyX.cjs';
import 'vue';

/**
 * Combines non-empty Query Kit conditions with an `AND` expression.
 *
 * @param {Array<Record<string, unknown> | undefined>} conditions Optional where fragments.
 * @returns {Record<string, unknown> | undefined} One fragment unchanged, multiple fragments in an `AND`, or `undefined` for none.
 */
declare function andWhere(...conditions: Array<Record<string, unknown> | undefined>): Record<string, unknown> | undefined;

/**
 * Converts UI filtering state to a Query Kit `where` payload.
 *
 * @param {FilteringState} filtering User-controlled filtering rules and their `AND`/`OR` operator.
 * @returns {Record<string, unknown> | undefined} A nested Query Kit where expression, or `undefined` when no filter has a value.
 */
declare function filteringToWhere(filtering: FilteringState): Record<string, unknown> | undefined;

/**
 * Compares plain object and array values structurally for reactive query watchers.
 *
 * @param {unknown} left First value.
 * @param {unknown} right Second value.
 * @returns {boolean} Whether both values have the same recursive structure and scalar values.
 */
declare function isEqual(left: unknown, right: unknown): boolean;

/**
 * Deeply merges object query fragments; later scalar values replace earlier values.
 *
 * @typeParam T - Shape of the base query.
 * @param {T} base Existing query fragment.
 * @param {Record<string, unknown>} extra Fragment whose values take precedence.
 * @returns {T} The merged query, preserving nested object properties from both inputs.
 */
declare function mergeQuery<T extends Record<string, unknown>>(base: T, extra: Record<string, unknown>): T;

/**
 * Safely decodes JSON for persisted state and URL payloads.
 *
 * @typeParam T - Expected decoded value type.
 * @param {string | null | undefined} value - Serialized JSON or an absent storage value.
 * @param {T} fallback - Value returned for absent or invalid JSON.
 * @returns {T} Decoded JSON or the fallback.
 */
declare function parseJson<T>(value: string | null | undefined, fallback: T): T;

/**
 * Builds the compact Query Kit fields grammar from dot-separated field paths.
 *
 * @param {Iterable<string>} paths Field paths such as `id` and `author.name`.
 * @returns {string | undefined} The compact fields string, or `undefined` when no usable path is supplied.
 */
declare function pathsToFieldsQuery(paths: Iterable<string>): string | undefined;

/**
 * Serializes a Query Kit request with the same bracket notation used by Nest resource endpoints.
 *
 * @param {QueryParameters} query Query Kit query payload.
 * @returns {string} A leading-question-mark query string, or an empty string for an empty payload.
 */
declare function serializeQuery(query?: QueryParameters): string;

/**
 * Converts table sorting state to Query Kit's nested `orderBy` payload.
 *
 * @param {SortingRule[]} sorting Ordered UI sorting rules.
 * @returns {Record<string, unknown>[] | undefined} A Query Kit order-by array, or `undefined` when no rule is active.
 */
declare function sortingToOrderBy(sorting: readonly SortingRule[]): Record<string, unknown>[] | undefined;

/**
 * Expands dotted object keys into the nested shape expected by Query Kit.
 *
 * @param {Record<string, unknown>} value Flat mapping such as `{ 'author.name': 'asc' }`.
 * @returns {Record<string, unknown>} The equivalent nested object.
 */
declare function unflatten(value: Record<string, unknown>): Record<string, unknown>;

export { andWhere, filteringToWhere, isEqual, mergeQuery, parseJson, pathsToFieldsQuery, serializeQuery, sortingToOrderBy, unflatten };
