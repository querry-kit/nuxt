import {
  andWhere,
  filteringToWhere,
  isEqual,
  mergeQuery,
  parseJson,
  pathsToFieldsQuery,
  serializeQuery,
  sortingToOrderBy,
} from '../src/utils';

describe('Query Kit utilities', () => {
  it('loads every public barrel without a runtime side effect', async () => {
    const root = await import('../src/index');
    const api = await import('../src/api/index');
    const autocomplete = await import('../src/autocomplete/index');
    const table = await import('../src/table/index');
    const types = await import('../src/types/index');
    const utils = await import('../src/utils/index');

    expect(root.useTable).toBe(table.useTable);
    expect(api.useModuleApi).toBe(root.useModuleApi);
    expect(autocomplete.useAutocomplete).toBe(root.useAutocomplete);
    expect(types).toEqual({});
    expect(utils.serializeQuery).toBe(serializeQuery);
  });

  it('serializes values with qs bracket notation', () => {
    expect(serializeQuery({ page: 2, where: JSON.stringify({ active: true }), include: { owner: true } })).toBe(
      '?page=2&where=%7B%22active%22%3Atrue%7D&include[owner]=true',
    );
  });

  it('builds nested fields grammar and ignores empty paths', () => {
    expect(pathsToFieldsQuery(['id', 'owner.name', 'owner.email', '', '.'])).toBe('id,owner{name,email}');
    expect(pathsToFieldsQuery([])).toBeUndefined();
  });

  it('converts filters and sorting to Query Kit shapes', () => {
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
    expect(sortingToOrderBy([{ id: 'profile.name', desc: false }])).toEqual([{ profile: { name: 'asc' } }]);
    expect(andWhere({ active: true }, { tenantId: 'one' })).toEqual({ AND: [{ active: true }, { tenantId: 'one' }] });
  });

  it('merges nested autocomplete query fragments', () => {
    expect(mergeQuery({ where: { active: true }, include: { owner: true } }, { where: { id: { in: ['a'] } } })).toEqual(
      {
        where: { active: true, id: { in: ['a'] } },
        include: { owner: true },
      },
    );
  });

  it('handles invalid persisted JSON and structural equality edge cases', () => {
    expect(parseJson('{not json', ['fallback'])).toEqual(['fallback']);
    expect(parseJson('["saved"]', [])).toEqual(['saved']);
    expect(isEqual({ a: [1, { two: true }] }, { a: [1, { two: true }] })).toBe(true);
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isEqual([1], [1, 2])).toBe(false);
    expect(isEqual(null, {})).toBe(false);
    expect(mergeQuery({ value: ['old'] }, { value: ['new'] })).toEqual({ value: ['new'] });
  });
});
