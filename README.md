# @querry-kit/nuxt <!-- omit in toc -->

[![npm](https://img.shields.io/npm/v/%40querry-kit%2Fnuxt?label=npm&logo=npm&logoColor=white&style=for-the-badge)](https://www.npmjs.com/package/@querry-kit/nuxt)
[![npm downloads](https://img.shields.io/npm/dm/%40querry-kit%2Fnuxt?label=downloads&logo=npm&logoColor=white&style=for-the-badge)](https://www.npmjs.com/package/@querry-kit/nuxt)
[![license](https://img.shields.io/npm/l/%40querry-kit%2Fnuxt?label=license&style=for-the-badge)](LICENSE)
[![node](https://img.shields.io/node/v/%40querry-kit%2Fnuxt?label=node&logo=nodedotjs&logoColor=white&style=for-the-badge)](package.json)
[![bundle size](https://img.shields.io/bundlephobia/minzip/%40querry-kit%2Fnuxt?label=size&logo=webpack&logoColor=white&style=for-the-badge)](https://bundlephobia.com/package/@querry-kit/nuxt)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178c6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![Buy Me a Coffee](https://img.shields.io/badge/buy_me_a_coffee-tobiaswaelde-ffdd00?logo=buymeacoffee&logoColor=000000&style=for-the-badge)](https://www.buymeacoffee.com/tobiaswaelde)

[![build](https://img.shields.io/github/actions/workflow/status/querry-kit/nuxt/build.yml?branch=main&label=build&logo=githubactions&logoColor=white&style=for-the-badge)](https://github.com/querry-kit/nuxt/actions/workflows/build.yml)
[![test](https://img.shields.io/github/actions/workflow/status/querry-kit/nuxt/test.yml?branch=main&label=test&logo=jest&logoColor=white&style=for-the-badge)](https://github.com/querry-kit/nuxt/actions/workflows/test.yml)
[![coverage](https://img.shields.io/github/actions/workflow/status/querry-kit/nuxt/test.yml?branch=main&label=coverage&logo=jest&logoColor=white&style=for-the-badge)](https://github.com/querry-kit/nuxt/actions/workflows/test.yml)
[![lint](https://img.shields.io/github/actions/workflow/status/querry-kit/nuxt/lint.yml?branch=main&label=lint&logo=eslint&logoColor=white&style=for-the-badge)](https://github.com/querry-kit/nuxt/actions/workflows/lint.yml)
[![docs](https://img.shields.io/github/actions/workflow/status/querry-kit/nuxt/docs.yml?branch=main&label=docs&logo=vitepress&logoColor=white&style=for-the-badge)](https://github.com/querry-kit/nuxt/actions/workflows/docs.yml)
[![changesets](https://img.shields.io/github/actions/workflow/status/querry-kit/nuxt/changesets.yml?branch=main&label=changesets&logo=changesets&logoColor=white&style=for-the-badge)](https://github.com/querry-kit/nuxt/actions/workflows/changesets.yml)
[![npm publish](https://img.shields.io/github/actions/workflow/status/querry-kit/nuxt/release.yml?branch=main&label=npm%20publish&logo=githubactions&logoColor=white&style=for-the-badge)](https://github.com/querry-kit/nuxt/actions/workflows/release.yml)

Typed Vue 3 and Nuxt primitives for APIs implementing the Query Kit `ResourceQuery` contract: an Axios client, typed resource endpoints, headless remote tables, and autocompletes.

📖 Documentation: https://querry-kit.github.io/nuxt/

## 📚 Table of Contents <!-- omit in toc -->

- [📦 Install](#-install)
- [🚀 Release Workflow](#-release-workflow)
- [🧩 Package exports](#-package-exports)
- [🔌 Create a client and endpoint](#-create-a-client-and-endpoint)
- [📊 Use remote state without a UI dependency](#-use-remote-state-without-a-ui-dependency)
- [📖 Documentation](#-documentation)
- [🛠 Development](#-development)

## 📦 Install

```sh
pnpm add @querry-kit/nuxt axios @tanstack/table-core @vueuse/core @vueuse/router vue vue-router
```

The current package version is published on npm. npm is the primary distribution channel.

## 🚀 Release Workflow

Releases are driven by Changesets and GitHub Actions. The `main` branch contains source, documentation, examples, and workflow configuration; distribution files are built in CI.

Package-visible changes should include a changeset:

```sh
pnpm changeset
```

When changes land on `main`, the `changesets` workflow creates or updates a release PR. That PR contains the version bump and changelog updates produced by:

```sh
pnpm changeset version
```

The npm publish workflow uses npm Trusted Publishing through GitHub Actions OIDC. After a release PR is merged, it runs the package checks, builds the distribution, publishes `@querry-kit/nuxt`, creates the `vX.Y.Z` tag, and creates a GitHub Release.

The release workflow checks npm before publishing. The manually published `0.0.1` baseline therefore remains safe: it is tagged and released from GitHub without an attempted duplicate publish.

## 🧩 Package exports

| Import                          | Purpose                                        |
| ------------------------------- | ---------------------------------------------- |
| `@querry-kit/nuxt/api`          | `createApiClient` and `useModuleApi`           |
| `@querry-kit/nuxt/table`        | Headless, remotely paginated `useTable`        |
| `@querry-kit/nuxt/autocomplete` | Selection-preserving `useAutocomplete`         |
| `@querry-kit/nuxt/types`        | Shared endpoint, table, and response contracts |
| `@querry-kit/nuxt/utils`        | Query serialization and query-state helpers    |

The root export re-exports the public runtime APIs; use the explicit subpaths when an import communicates intent better.

## 🔌 Create a client and endpoint

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

## 📊 Use remote state without a UI dependency

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

The package stays independent of Nuxt runtime configuration, application authentication, routers, stores, and UI components. Consumers provide their own Axios instance, route ref, storage adapter, and endpoint map.

## 📖 Documentation

- [Getting Started](https://querry-kit.github.io/nuxt/guide/getting-started)
- [Remote Tables](https://querry-kit.github.io/nuxt/guide/table)
- [Autocomplete](https://querry-kit.github.io/nuxt/guide/autocomplete)
- [Query conventions](https://querry-kit.github.io/nuxt/guide/query-conventions)
- [Example App](https://querry-kit.github.io/nuxt/guide/example-app)
- [Client and endpoints](https://querry-kit.github.io/nuxt/api/client)
- [Table API](https://querry-kit.github.io/nuxt/api/table)
- [Autocomplete API](https://querry-kit.github.io/nuxt/api/autocomplete)
- [Backend compatibility](https://querry-kit.github.io/nuxt/api/query-kit)

Run the VitePress documentation locally:

```sh
pnpm docs:dev
```

Build the documentation:

```sh
pnpm docs:build
```

## 🛠 Development

```sh
pnpm install
pnpm lint
pnpm check
pnpm test
pnpm test:coverage
pnpm build
pnpm examples:check
pnpm examples:build
pnpm docs:build
```

`pnpm test:coverage` collects all source files, prints the coverage summary, and writes HTML and LCOV reports to `coverage/`. GitHub Actions runs the same command and retains the report as a workflow artifact.
