import { unflatten } from './unflatten';

describe('unflatten', () => {
  it('ignores prototype-related paths without changing shared prototypes', () => {
    expect(
      unflatten({
        '__proto__.auditMarker': 'polluted',
        'constructor.prototype.auditMarker': true,
        'safe.prototype.value': true,
      }),
    ).toEqual({});
    expect(Object.hasOwn(Object.prototype, 'auditMarker')).toBe(false);
    expect(unflatten({ 'toString.name': 'own' })).toEqual({ toString: { name: 'own' } });
  });

  it('expands usable paths and replaces conflicting intermediate values', () => {
    expect(unflatten({ '': 'ignored', profile: 'old', 'profile.name': 'Ada', tags: [], 'tags.name': 'Admin' })).toEqual(
      {
        profile: { name: 'Ada' },
        tags: { name: 'Admin' },
      },
    );
  });
});
