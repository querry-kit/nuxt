/**
 * Expands dotted object keys into the nested shape expected by Query Kit.
 *
 * @param {Record<string, unknown>} value Flat mapping such as `{ 'author.name': 'asc' }`.
 * @returns {Record<string, unknown>} The equivalent nested object.
 */
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
