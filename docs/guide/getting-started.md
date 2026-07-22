# Getting started

Install the core package and its peers:

```sh
pnpm add @querry-kit/nuxt axios @tanstack/table-core @vueuse/core @vueuse/router vue vue-router
```

Create the HTTP client in the consumer application, where runtime configuration and authentication belong:

```ts
import { createApiClient } from '@querry-kit/nuxt/api';

const api = createApiClient({
  apiBaseUrl: runtimeConfig.public.apiBaseUrl,
  getToken: () => authStore.token,
});
```

The client targets `/api/v1`, adds `Request-Source` and `Timezone` headers, and only sends an `Authorization` header when `getToken` returns a token.

| Option           | Default          | Use it for                                                    |
| ---------------- | ---------------- | ------------------------------------------------------------- |
| `apiBaseUrl`     | —                | The backend origin. A trailing slash is accepted.             |
| `getToken`       | no header        | Resolving the latest token per request. It may be async.      |
| `resolveBaseUrl` | identity         | Tenant/workspace host rewriting before the API path is added. |
| `requestSource`  | `web`            | Backends that distinguish clients through `Request-Source`.   |
| `getTimezone`    | browser timezone | An explicit timezone; return `undefined` to omit it.          |

Then model resources once and receive typed CRUD payloads:

```ts
type Resources = {
  books: {
    item: { id: string; title: string };
    create: { title: string };
    update: { title?: string };
  };
};

const books = useModuleApi<Resources, 'books'>(api, 'books');
await books.update('book-1', { title: 'New title' });
```

`useModuleApi` exposes `query`, `get`, `findById`, `count`, `create`, `update`, and `delete`. Its endpoint argument accepts either `books` or `/books`; identifiers are URL encoded.
