import qs from 'qs';

import type { FilteringState, QueryParameters, SortingRule } from './types';

/** Serializes a Query Kit request with the same bracket notation used by Nest resource endpoints. */
export function serializeQuery(query: QueryParameters = {}): string {
  return qs.stringify(query, { addQueryPrefix: true, encodeValuesOnly: true });
}

/** Builds the compact Query Kit fields grammar from dot-separated field paths. */
export function pathsToFieldsQuery(paths: Iterable<string>): string | undefined {
  interface Tree {
    [key: string]: Tree | true;
  }
  const tree: Tree = {};

  for (const path of paths) {
    const parts = path.split('.').filter(Boolean);
    if (parts.length === 0) continue;

    let cursor = tree;
    for (const [index, key] of parts.entries()) {
      const isLeaf = index === parts.length - 1;
      if (isLeaf) {
        if (cursor[key] === undefined) cursor[key] = true;
        continue;
      }

      if (cursor[key] === undefined || cursor[key] === true) cursor[key] = {};
      cursor = cursor[key] as Tree;
    }
  }

  const stringify = (node: Tree): string =>
    Object.entries(node)
      .map(([key, value]) => (value === true ? key : `${key}{${stringify(value)}}`))
      .join(',');

  const result = stringify(tree);
  return result || undefined;
}

/** Expands dotted object keys into the nested shape expected by Query Kit. */
export function unflatten(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [path, item] of Object.entries(value)) {
    const parts = path.split('.').filter(Boolean);
    if (parts.length === 0) continue;
    let cursor = result;
    for (const [index, part] of parts.entries()) {
      if (index === parts.length - 1) {
        cursor[part] = item;
      } else {
        const child = cursor[part];
        if (!child || typeof child !== 'object' || Array.isArray(child)) cursor[part] = {};
        cursor = cursor[part] as Record<string, unknown>;
      }
    }
  }
  return result;
}

/** Converts table sorting state to Query Kit's nested `orderBy` payload. */
export function sortingToOrderBy(sorting: readonly SortingRule[]): Record<string, unknown>[] | undefined {
  if (sorting.length === 0) return undefined;
  return sorting.map(({ id, desc }) => unflatten({ [id]: desc ? 'desc' : 'asc' }));
}

/** Converts UI filtering state to a Query Kit `where` payload. */
export function filteringToWhere(filtering: FilteringState): Record<string, unknown> | undefined {
  const conditions = filtering.filters
    .filter((filter) => filter.value !== undefined)
    .map((filter) => {
      const value = filter.operator ? { [filter.operator]: filter.value } : filter.value;
      return unflatten({ [filter.field]: value });
    });

  if (conditions.length === 0) return undefined;
  return filtering.operator === 'OR'
    ? { OR: conditions }
    : conditions.length === 1
      ? conditions[0]
      : { AND: conditions };
}

/** Combines non-empty Query Kit conditions with an `AND` expression. */
export function andWhere(
  ...conditions: Array<Record<string, unknown> | undefined>
): Record<string, unknown> | undefined {
  const present = conditions.filter((condition): condition is Record<string, unknown> => Boolean(condition));
  if (present.length === 0) return undefined;
  return present.length === 1 ? present[0] : { AND: present };
}

/** Safe JSON decoding for persisted state and URL payloads. */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** A small structural equality helper suitable for reactive query values. */
export function isEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, i) => isEqual(item, right[i]))
    );
  }
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const keys = Object.keys(leftRecord);
  return (
    keys.length === Object.keys(rightRecord).length && keys.every((key) => isEqual(leftRecord[key], rightRecord[key]))
  );
}

/** Deeply merges object query fragments; later scalar values replace earlier values. */
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
