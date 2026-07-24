import { nextTick } from 'vue';

import { persistedRef } from './persisted-ref';

describe('persistedRef', () => {
  it('restores persisted values and writes updates', async () => {
    const values = new Map([['page-size', '50']]);
    const state = persistedRef('page-size', 25, {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });

    state.value = 100;
    await nextTick();

    expect(state.value).toBe(100);
    expect(values.get('page-size')).toBe('100');
  });

  it('uses the fallback and ignores persistence errors', async () => {
    const state = persistedRef('page-size', 25, {
      getItem: () => '{invalid',
      setItem: () => {
        throw new Error('quota exceeded');
      },
    });

    state.value = 50;
    await nextTick();

    expect(state.value).toBe(50);
  });

  it('uses its fallback without an optional storage adapter', () => {
    const state = persistedRef('page-size', 25);

    expect(state.value).toBe(25);
  });
});
