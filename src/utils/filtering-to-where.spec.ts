import { filteringToWhere } from './filtering-to-where';

describe('filteringToWhere', () => {
  it('converts AND and OR filter states to nested Query Kit conditions', () => {
    expect(
      filteringToWhere({
        operator: 'AND',
        filters: [
          { id: '1', field: 'profile.active', value: true },
          { id: '2', field: 'name', operator: 'in', value: ['Ada'] },
          { id: '3', field: 'unused' },
        ],
      }),
    ).toEqual({ AND: [{ profile: { active: true } }, { name: { in: ['Ada'] } }] });
    expect(filteringToWhere({ operator: 'OR', filters: [{ id: '1', field: 'active', value: true }] })).toEqual({
      OR: [{ active: true }],
    });
  });

  it('returns a single condition directly and ignores missing filter values', () => {
    expect(filteringToWhere({ operator: 'AND', filters: [{ id: '1', field: 'active', value: true }] })).toEqual({
      active: true,
    });
    expect(filteringToWhere({ operator: 'AND', filters: [{ id: '1', field: 'inactive' }] })).toBeUndefined();
  });
});
