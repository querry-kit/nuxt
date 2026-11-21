import type { GroupNode, GroupPath } from '../types/grouping';
import { useGroupedSelection } from './grouped-selection';

type Item = { id?: string; status: string; priority: number };

function group(path: GroupPath, count: number): GroupNode<Item> {
  const { field, value } = path.at(-1)!;
  return {
    key: JSON.stringify(path),
    path,
    count,
    field,
    value,
    children: [],
    items: [],
    loading: false,
    loaded: false,
    expanded: false,
    hasMore: false,
    error: undefined,
  };
}

describe('useGroupedSelection', () => {
  it('tracks nested rules and row overrides without loading every matching item', () => {
    const selection = useGroupedSelection<Item>((item) => item.id);
    const open = group([{ field: 'status', value: 'open' }], 12);
    const urgent = group([...open.path, { field: 'priority', value: 1 }], 5);
    const first = { id: 'first', status: 'open', priority: 1 };
    const second = { id: 'second', status: 'open', priority: 2 };
    const missingId = { status: 'open', priority: 2 };
    const unrelated = { id: 'unrelated', status: 'closed', priority: 1 };

    expect(selection.groupState(open)).toBe(false);
    selection.selectGroup(open, true);
    expect(selection.groupState(open)).toBe(true);
    expect(selection.isSelected(missingId)).toBe(false);
    expect(selection.isSelected(first)).toBe(true);

    selection.selectGroup(urgent, false);
    selection.selectItems([first], true);
    selection.selectItems([second, missingId], false);
    selection.selectItems([unrelated], true);
    expect(selection.isSelected(second)).toBe(false);
    expect(selection.groupState(open)).toBe('indeterminate');
    expect(selection.groupState(urgent)).toBe('indeterminate');
    expect(selection.selectedCount.value).toBe(8);
    expect(selection.getSelection()).toEqual({
      includedGroups: [open.path],
      excludedGroups: [urgent.path],
      ids: ['first', 'unrelated'],
      excludedIds: ['second'],
    });

    selection.selectItems([second], true);
    selection.selectGroup(open, true);
    expect(selection.selectedCount.value).toBe(13);
    expect(selection.getSelection().ids).toEqual(['unrelated']);
    expect(selection.getSelection().excludedGroups).toEqual([]);
    selection.selectGroup(open, false);
    expect(selection.selectedCount.value).toBe(1);
    selection.clearSelection();
    expect(selection.selectedCount.value).toBe(0);
    expect(selection.isSelected(unrelated)).toBe(false);
  });
});
