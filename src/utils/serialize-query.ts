import qs from 'qs';
import type { QueryParameters } from '../types/module-api';

/**
 * Serializes a Query Kit request with the same bracket notation used by Nest resource endpoints.
 *
 * @param {QueryParameters} query Query Kit query payload.
 * @returns {string} A leading-question-mark query string, or an empty string for an empty payload.
 */
export function serializeQuery(query: QueryParameters = {}): string {
  return qs.stringify(query, { addQueryPrefix: true, encodeValuesOnly: true });
}
