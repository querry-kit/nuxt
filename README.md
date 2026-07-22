# @querry-kit/nuxt

Typed Vue 3 and Nuxt primitives for APIs implementing the Query Kit `ResourceQuery` contract. The package provides an Axios client, typed resource endpoints, headless remote tables, and autocompletes while leaving Nuxt configuration, authentication, routing, and UI components in the application.

## Install

```sh
pnpm add @querry-kit/nuxt axios @tanstack/table-core @vueuse/core @vueuse/router vue vue-router
```

## Package exports

| Import                          | Purpose                                        |
| ------------------------------- | ---------------------------------------------- |
| `@querry-kit/nuxt/api`          | `createApiClient` and `useModuleApi`           |
| `@querry-kit/nuxt/table`        | Headless, remotely paginated `useTable`        |
| `@querry-kit/nuxt/autocomplete` | Selection-preserving `useAutocomplete`         |
| `@querry-kit/nuxt/types`        | Shared endpoint, table, and response contracts |
| `@querry-kit/nuxt/utils`        | Query serialization and query-state helpers    |

The root export re-exports the public runtime APIs; use the explicit subpaths when an import communicates intent better.

## Create a client and endpoint

```ts
import { createApiClient, useModuleApi } from '@querry-kit/nuxt/api';

type Resources = {
  users: {
    item: { id: string; name: string };
    create: { name: string };
    update: { name?: string };
  };
};

const api = createApiClient({
  apiBaseUrl: 'https://api.example.test',
  getToken: () => authStore.token,
});
const users = useModuleApi<Resources, 'users'>(api, 'users');
const response = await users.query({ page: 1, perPage: 25 });
```

`createApiClient` targets `/api/v1`, sends `Request-Source: web` and a timezone by default, and adds `Authorization` only if `getToken` supplies one. Supply `resolveBaseUrl` for tenant-aware host rewriting and `requestSource` if the backend distinguishes clients.

## Use remote state without a UI dependency

```ts
import { useTable } from '@querry-kit/nuxt/table';

const table = useTable({
  api,
  endpoint: 'users',
  persistenceKey: 'users',
  columns: ref([{ id: 'name' }, { id: 'team', fields: ['name'] }]),
  staticFilter: computed(() => ({ tenantId: activeTenant.value })),
});

await table.initialize();
```

The table selects `id,name,team{name}`, serializes its query with `qs`, persists user preferences through a configurable storage adapter, and discards stale responses. `useAutocomplete` similarly keeps selected resources present if the current search no longer returns them.

## Documentation

The VitePress site contains option tables, lifecycle details, Query Kit request conventions, and the runnable mocked Nuxt example. Build it locally with `pnpm docs:build`.

## Development

```sh
pnpm install
pnpm lint
pnpm check
pnpm test:coverage
pnpm build
pnpm examples:check
pnpm examples:build
pnpm docs:build
```

Follow-up changes use Changesets and are published through npm Trusted Publishing. The release workflow refuses to republish a version already present on npm, so the manually published `0.0.1` baseline is safe to tag and release from GitHub.
