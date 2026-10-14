import { isFilteringState, isPinningState, isSortingState, isStringArray } from './preference-validation';

describe('stored table preferences', () => {
  it('accepts usable values', () => {
    expect(isStringArray(['id'])).toBe(true);
    expect(isSortingState([{ id: 'name', desc: false }])).toBe(true);
    expect(isFilteringState({ operator: 'AND', filters: [{ id: '1', field: 'name', value: 'Ada' }] })).toBe(true);
    expect(isFilteringState({ operator: 'OR', filters: [{ id: '1', field: 'age', operator: 'gte', value: 18 }] })).toBe(
      true,
    );
    expect(isPinningState({ left: ['id'], right: [] })).toBe(true);
  });

  it('rejects wrong primitive, list and object shapes', () => {
    for (const value of [
      null,
      1,
      'wrong',
      [],
      {},
      { operator: 'X', filters: [] },
      { operator: 'AND', filters: null },
      { operator: 'OR', filters: [null, {}] },
    ]) {
      expect(isFilteringState(value)).toBe(false);
    }
    for (const value of [null, {}, [null], [1], [{ id: 1, desc: false }], [{ id: 'name', desc: 'false' }]]) {
      expect(isSortingState(value)).toBe(false);
    }
    for (const value of [null, 1, [], { left: null }, { left: [1] }, { other: [] }])
      expect(isPinningState(value)).toBe(false);
    expect(isStringArray(null)).toBe(false);
    expect(isStringArray([1])).toBe(false);
    expect(isFilteringState({ operator: 'AND', filters: [{ id: 1, field: 'x' }] })).toBe(false);
    expect(isFilteringState({ operator: 'AND', filters: [{ id: '1', field: 1 }] })).toBe(false);
    expect(isFilteringState({ operator: 'AND', filters: [{ id: '1', field: 'x', operator: 'bad' }] })).toBe(false);
  });
});
