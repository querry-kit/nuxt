/**
 * Builds the compact Query Kit fields grammar from dot-separated field paths.
 *
 * @param {Iterable<string>} paths Field paths such as `id` and `author.name`.
 * @returns {string | undefined} The compact fields string, or `undefined` when no usable path is supplied.
 */
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
