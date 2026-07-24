import { serializeQuery } from './serialize-query';

describe('serializeQuery', () => {
  it('serializes values with qs bracket notation', () => {
    expect(serializeQuery({ page: 2, where: JSON.stringify({ active: true }), include: { owner: true } })).toBe(
      '?page=2&where=%7B%22active%22%3Atrue%7D&include[owner]=true',
    );
  });
});
