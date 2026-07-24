import type { AxiosInstance } from 'axios';

import type { UseAutocompleteOptions } from './autocomplete-options';

describe('autocomplete option types', () => {
  it('accepts a typed endpoint configuration', () => {
    const options: UseAutocompleteOptions<{ id: string; name: string }> = {
      api: {} as AxiosInstance,
      endpoint: 'users',
      identityKey: 'id',
      itemDisabled: (item) => item.name.length === 0,
    };

    expect(options.endpoint).toBe('users');
  });
});
