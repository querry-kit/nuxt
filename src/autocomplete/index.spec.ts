import type { AxiosInstance } from 'axios';
import { nextTick, ref } from 'vue';

import { useAutocomplete } from './index';

describe('useAutocomplete', () => {
  it('merges selected and query items by a configurable identity key', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce({
        data: { items: [{ code: 'a', name: 'Selected' }], meta: { itemCount: 1, pageCount: 1 } },
      })
      .mockResolvedValueOnce({
        data: {
          items: [
            { code: 'a', name: 'Search' },
            { code: 'b', name: 'Other' },
          ],
          meta: { itemCount: 2, pageCount: 1 },
        },
      });
    const autocomplete = useAutocomplete<{ code: string; name: string }>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'people',
      currentValue: ref('a'),
      query: ref({ where: { active: true } }),
      identityKey: 'code',
      itemDisabled: (item) => item.code === 'b',
      immediate: false,
    });

    await autocomplete.initialize();

    expect(autocomplete.items.value).toEqual([
      { code: 'a', name: 'Selected', disabled: false },
      { code: 'b', name: 'Other', disabled: true },
    ]);
    expect(get).toHaveBeenNthCalledWith(1, expect.stringContaining('where[active]=true&where[code]=a&perPage=1000'));
  });

  it('clears missing selected values and reports independent request errors', async () => {
    const get = jest.fn().mockRejectedValue(new Error('offline'));
    const autocomplete = useAutocomplete<{ id: string; name: string }>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'people',
      currentValue: ref<string | null>(null),
      immediate: false,
    });

    await autocomplete.loadCurrentItems();
    await autocomplete.loadItems();

    expect(autocomplete.currentValueItems.value).toEqual([]);
    expect(autocomplete.queryItems.value).toEqual([]);
    expect(autocomplete.error.value).toBeInstanceOf(Error);
    expect(autocomplete.loading.value).toBe(false);
  });

  it('does not request selected items when no selected-value ref is configured', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation();
    const get = jest.fn();
    try {
      const autocomplete = useAutocomplete<{ id: string; name: string }>({
        api: { get } as unknown as AxiosInstance,
        endpoint: 'people',
      });

      await autocomplete.loadCurrentItems();

      expect(autocomplete.currentValueItems.value).toEqual([]);
      expect(get).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('clears selected items when their request fails', async () => {
    const autocomplete = useAutocomplete<{ id: string; name: string }>({
      api: { get: jest.fn().mockRejectedValue(new Error('offline')) } as unknown as AxiosInstance,
      endpoint: 'people',
      currentValue: ref('missing'),
      immediate: false,
    });

    await autocomplete.loadCurrentItems();

    expect(autocomplete.currentValueItems.value).toEqual([]);
    expect(autocomplete.error.value).toBeInstanceOf(Error);
    expect(autocomplete.loading.value).toBe(false);
  });

  it('reacts to selected-value and search-query changes without a disabled predicate', async () => {
    const selected = ref<string | null>('one');
    const query = ref({ search: 'first' });
    const get = jest
      .fn()
      .mockResolvedValue({ data: { items: [{ id: 'one', name: 'One' }], meta: { itemCount: 1, pageCount: 1 } } });
    const autocomplete = useAutocomplete<{ id: string; name: string }>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'people',
      currentValue: selected,
      query,
      immediate: false,
    });

    await autocomplete.initialize();
    selected.value = 'two';
    query.value = { search: 'second' };
    await nextTick();
    await Promise.resolve();

    expect(get).toHaveBeenCalledTimes(4);
    expect(autocomplete.items.value).toEqual([{ id: 'one', name: 'One' }]);
  });

  it('queries multiple selected identities with an `in` condition', async () => {
    const get = jest.fn().mockResolvedValue({ data: { items: [], meta: { itemCount: 0, pageCount: 0 } } });
    const autocomplete = useAutocomplete<{ id: string; name: string }>({
      api: { get } as unknown as AxiosInstance,
      endpoint: 'people',
      currentValue: ref(['one', 'two']),
      immediate: false,
    });

    await autocomplete.loadCurrentItems();

    expect(get).toHaveBeenCalledWith(expect.stringContaining('where[id][in][0]=one&where[id][in][1]=two'));
  });
});
