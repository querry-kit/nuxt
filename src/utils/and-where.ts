/**
 * Combines non-empty Query Kit conditions with an `AND` expression.
 *
 * @param {Array<Record<string, unknown> | undefined>} conditions Optional where fragments.
 * @returns {Record<string, unknown> | undefined} One fragment unchanged, multiple fragments in an `AND`, or `undefined` for none.
 */
export function andWhere(
  ...conditions: Array<Record<string, unknown> | undefined>
): Record<string, unknown> | undefined {
  const present = conditions.filter((condition): condition is Record<string, unknown> => Boolean(condition));
  if (present.length === 0) return undefined;
  return present.length === 1 ? present[0] : { AND: present };
}
