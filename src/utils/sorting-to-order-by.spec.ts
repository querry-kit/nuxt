import { sortingToOrderBy } from './sorting-to-order-by';

describe('sortingToOrderBy', () => {
  it('converts sorting rules to nested order-by conditions', () => {
    expect(sortingToOrderBy([{ id: 'profile.name', desc: false }])).toEqual([{ profile: { name: 'asc' } }]);
    expect(sortingToOrderBy([{ id: 'profile.name', desc: true }])).toEqual([{ profile: { name: 'desc' } }]);
  });

  it('returns undefined for an empty sorting state', () => {
    expect(sortingToOrderBy([])).toBeUndefined();
  });
});
