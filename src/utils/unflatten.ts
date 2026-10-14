/**
 * Expands dotted keys into nested objects, ignoring prototype-related paths.
 *
 * @param {Record<string, unknown>} value Flat mapping such as `{ 'author.name': 'asc' }`.
 * @returns {Record<string, unknown>} The equivalent nested object.
 */
export function unflatten(value: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [path, item] of Object.entries(value)) {
    const parts = path.split('.').filter(Boolean);
    if (parts.length === 0 || parts.some((part) => ['__proto__', 'constructor', 'prototype'].includes(part))) continue;
    let cursor = result;
    for (const [index, part] of parts.entries()) {
      if (index === parts.length - 1) {
        cursor[part] = item;
      } else {
        const child = Object.hasOwn(cursor, part) ? cursor[part] : undefined;
        if (!child || typeof child !== 'object' || Array.isArray(child)) cursor[part] = {};
        cursor = cursor[part] as Record<string, unknown>;
      }
    }
  }
  return result;
}
