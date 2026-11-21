import { computed, shallowReactive } from 'vue';
import type { GroupNode, GroupPath } from '../types/grouping';

/**
 * Tracks group selections and individual row overrides across unloaded pages.
 *
 * @param getId Returns the stable ID of a selectable item.
 * @returns Selection counts, checkbox states, and explicit inclusion and exclusion rules.
 */
export function useGroupedSelection<TItem extends Record<string, unknown>>(getId: (item: TItem) => string | undefined) {
  const groups = shallowReactive(new Map<string, { node: GroupNode<TItem>; checked: boolean }>());
  const items = shallowReactive(new Map<string, { item: TItem; checked: boolean }>());

  /** Uses the closest matching group rule, so subgroup exceptions take precedence. */
  function groupDefault(matches: (path: GroupPath) => boolean): boolean {
    let depth = 0;
    let checked = false;
    for (const rule of groups.values()) {
      const { path } = rule.node;
      if (path.length > depth && matches(path)) {
        depth = path.length;
        checked = rule.checked;
      }
    }
    return checked;
  }

  /** Reads an explicit override first, then the inherited group state. */
  function isSelected(item: TItem): boolean {
    const id = getId(item);
    if (!id) return false;
    return (
      items.get(id)?.checked ??
      groupDefault(/** Matches the item against a group path. */ (path) => inGroup(item, path))
    );
  }

  /** Records only differences from the inherited state. */
  function selectItems(records: readonly TItem[], checked: boolean): void {
    for (const item of records) {
      const id = getId(item);
      if (!id) continue;
      if (checked === groupDefault(/** Matches the item against a group path. */ (path) => inGroup(item, path)))
        items.delete(id);
      else items.set(id, { item, checked });
    }
  }

  /** Replaces every override within a group with its new selection state. */
  function selectGroup(node: GroupNode<TItem>, checked: boolean): void {
    for (const [key, rule] of groups) {
      if (isUnder(rule.node.path, node.path)) groups.delete(key);
    }
    for (const [id, rule] of items) {
      if (inGroup(rule.item, node.path)) items.delete(id);
    }
    if (checked !== groupDefault(/** Matches ancestor rules. */ (path) => isUnder(node.path, path))) {
      groups.set(node.key, { node, checked });
    }
  }

  /** Counts selected items using already loaded group totals and explicit overrides. */
  function countSelected(node?: GroupNode<TItem>): number {
    let count =
      node && groupDefault(/** Finds the inherited state of this branch. */ (path) => isUnder(node.path, path))
        ? node.count
        : 0;
    for (const rule of groups.values()) {
      if (!node || (rule.node.path.length > node.path.length && isUnder(rule.node.path, node.path))) {
        count += rule.checked ? rule.node.count : -rule.node.count;
      }
    }
    for (const rule of items.values()) {
      if (!node || inGroup(rule.item, node.path)) count += rule.checked ? 1 : -1;
    }
    return count;
  }

  const selectedCount = computed(/** Counts selections across all groups and pages. */ () => countSelected());

  /** Returns the checkbox state for a whole group, including unloaded pages. */
  function groupState(node: GroupNode<TItem>): boolean | 'indeterminate' {
    const count = countSelected(node);
    return count > 0 && (count >= node.count ? true : 'indeterminate');
  }

  /** Returns the explicit rules independently of any bulk-operation contract. */
  function getSelection() {
    const includedGroups: GroupPath[] = [];
    const excludedGroups: GroupPath[] = [];
    const ids: string[] = [];
    const excludedIds: string[] = [];
    for (const rule of groups.values()) (rule.checked ? includedGroups : excludedGroups).push(rule.node.path);
    for (const [id, rule] of items) (rule.checked ? ids : excludedIds).push(id);
    return { includedGroups, excludedGroups, ids, excludedIds };
  }

  /** Starts a fresh selection after a scope change or successful deletion. */
  function clearSelection(): void {
    groups.clear();
    items.clear();
  }

  return { selectedCount, isSelected, groupState, selectItems, selectGroup, getSelection, clearSelection };
}

/** Checks whether any group key is specific to a descendant branch of the given prefix. */
function isUnder(path: GroupPath, prefix: GroupPath): boolean {
  return prefix.every(
    /** Compares path values at the same depth. */ ({ field, value }, index) =>
      path[index]?.field === field && path[index]?.value === value,
  );
}

/** Compares an item's projected scalar fields to its group path. */
function inGroup(item: Record<string, unknown>, path: GroupPath): boolean {
  return path.every(/** Matches each ancestor value. */ ({ field, value }) => item[field] === value);
}
