import { andWhere } from './and-where';

describe('andWhere', () => {
  it('combines multiple conditions and leaves a single condition unchanged', () => {
    expect(andWhere({ active: true }, { tenantId: 'one' })).toEqual({ AND: [{ active: true }, { tenantId: 'one' }] });
    expect(andWhere({ active: true })).toEqual({ active: true });
  });

  it('returns undefined when there are no conditions', () => {
    expect(andWhere()).toBeUndefined();
  });
});
