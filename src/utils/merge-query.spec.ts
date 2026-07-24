import { mergeQuery } from './merge-query';

describe('mergeQuery', () => {
  it('merges nested object fragments and replaces scalar or array values', () => {
    expect(mergeQuery({ where: { active: true }, include: { owner: true } }, { where: { id: { in: ['a'] } } })).toEqual(
      {
        where: { active: true, id: { in: ['a'] } },
        include: { owner: true },
      },
    );
    expect(mergeQuery({ value: ['old'] }, { value: ['new'] })).toEqual({ value: ['new'] });
  });
});
