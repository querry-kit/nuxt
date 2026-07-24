import { hasColumnId } from './has-column-id';

describe('hasColumnId', () => {
  it('accepts non-empty string identifiers only', () => {
    expect(hasColumnId({ id: 'name' })).toBe(true);
    expect(hasColumnId({ id: '' })).toBe(false);
    expect(hasColumnId({})).toBe(false);
  });
});
