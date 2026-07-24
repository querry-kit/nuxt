import { isEqual } from './is-equal';

describe('isEqual', () => {
  it('compares nested plain objects and arrays structurally', () => {
    expect(isEqual({ a: [1, { two: true }] }, { a: [1, { two: true }] })).toBe(true);
    expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isEqual([1], [1, 2])).toBe(false);
    expect(isEqual([1], { 0: 1 })).toBe(false);
    expect(isEqual(null, {})).toBe(false);
  });
});
