import { normalisePage } from './normalize-page';

describe('normalisePage', () => {
  it('accepts positive integer numbers and strings', () => {
    expect(normalisePage(2)).toBe(2);
    expect(normalisePage('3')).toBe(3);
  });

  it('rejects invalid page values', () => {
    expect(normalisePage(0)).toBeUndefined();
    expect(normalisePage(-1)).toBeUndefined();
    expect(normalisePage('1.5')).toBeUndefined();
    expect(normalisePage('invalid')).toBeUndefined();
  });
});
