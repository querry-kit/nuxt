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
