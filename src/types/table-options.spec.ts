import type { AxiosInstance } from 'axios';
import { ref } from 'vue';

import type { UseTableOptions } from './table-options';

describe('table option types', () => {
  it('accepts a framework-neutral table configuration', () => {
    const options: UseTableOptions<{ id: string; name: string }> = {
      api: {} as AxiosInstance,
      endpoint: 'users',
      persistenceKey: 'users',
      columns: ref([{ id: 'name' }]),
      staticFilter: { active: true },
    };

    expect(options.persistenceKey).toBe('users');
  });
});
