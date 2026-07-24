import { pathsToFieldsQuery } from './paths-to-fields-query';

describe('pathsToFieldsQuery', () => {
  it('builds the nested fields grammar and ignores empty paths', () => {
    expect(pathsToFieldsQuery(['id', 'owner.name', 'owner.email', '', '.'])).toBe('id,owner{name,email}');
  });

  it('returns undefined without usable paths', () => {
    expect(pathsToFieldsQuery([])).toBeUndefined();
  });
});
