import { createApiClient, useModuleApi } from '@querry-kit/nuxt/api';
import { type AxiosAdapter } from 'axios';

const adapter: AxiosAdapter = async (config) => ({
  data: {
    items: [
      { id: '1', title: 'The Left Hand of Darkness' },
      { id: '2', title: 'A Wizard of Earthsea' },
    ],
    meta: { itemCount: 2, pageCount: 1 },
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

export default defineNuxtPlugin(() => {
  const api = createApiClient({ apiBaseUrl: 'https://example.test', getToken: () => null });
  api.defaults.adapter = adapter;

  return {
    provide: {
      booksApi: useModuleApi<{ books: { item: { id: string; title: string }; create: never; update: never } }, 'books'>(
        api,
        'books',
      ),
    },
  };
});
