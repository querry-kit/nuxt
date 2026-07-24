import { unflatten } from './unflatten';

describe('unflatten', () => {
  it('expands usable paths and replaces conflicting intermediate values', () => {
    expect(unflatten({ '': 'ignored', profile: 'old', 'profile.name': 'Ada', tags: [], 'tags.name': 'Admin' })).toEqual(
      {
        profile: { name: 'Ada' },
        tags: { name: 'Admin' },
      },
    );
  });
});
