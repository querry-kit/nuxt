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
[![changesets](https://img.shields.io/github/actions/workflow/status/querry-kit/nuxt/changesets.yml?branch=main&label=changesets&logo=changesets&logoColor=white&style=for-the-badge)](https://github.com/querry-kit/nuxt/actions/workflows/changesets.yml)
[![npm publish](https://img.shields.io/github/actions/workflow/status/querry-kit/nuxt/release.yml?branch=main&label=npm%20publish&logo=githubactions&logoColor=white&style=for-the-badge)](https://github.com/querry-kit/nuxt/actions/workflows/release.yml)

Typed Vue 3 and Nuxt primitives for APIs implementing the Query Kit `ResourceQuery` contract: an Axios client, typed resource endpoints, headless remote tables, and autocompletes.

📖 Documentation: https://querry-kit.github.io/querry-kit/docs/nuxt

## 🌐 Querry Kit Ecosystem

The [Querry Kit overview](https://querry-kit.github.io/querry-kit/) connects the three main repositories:

- [`@querry-kit/nest`](https://github.com/querry-kit/nest) for the Query Kit-compatible NestJS API and controller patterns.
- [`@querry-kit/nuxt`](https://github.com/querry-kit/nuxt) for typed API clients and headless Vue/Nuxt data primitives.
- [`@querry-kit/nuxt-ui`](https://github.com/querry-kit/nuxt-ui) for Nuxt UI integrations built on these primitives.

It also contains the complete Workboard API-and-web-app example, which shows the packages working together end to end.

## 📚 Table of Contents <!-- omit in toc -->

- [🌐 Querry Kit Ecosystem](#-querry-kit-ecosystem)
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

| Import                          | Public contents                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@querry-kit/nuxt/api`          | `createApiClient`, `useModuleApi`                                                                                                                 |
| `@querry-kit/nuxt/table`        | `useTable`                                                                                                                                        |
| `@querry-kit/nuxt/autocomplete` | `useAutocomplete`                                                                                                                                 |
| `@querry-kit/nuxt/types`        | API contracts, headless table state, filter/sort field definitions, `UseTableOptions`, and `UseAutocompleteOptions`                               |
| `@querry-kit/nuxt/utils`        | `andWhere`, `filteringToWhere`, `isEqual`, `mergeQuery`, `parseJson`, `pathsToFieldsQuery`, `serializeQuery`, `sortingToOrderBy`, and `unflatten` |

The root export re-exports these runtime functions and type contracts. Use the explicit subpaths when an import communicates intent better. Internal split-file helpers such as table storage, page normalization, and column-ID checks are deliberately not package exports.

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

The package stays independent of Nuxt runtime configuration, application authentication, routers, stores, global events, and UI components. Consumers provide their own Axios instance, route ref, storage adapter, and endpoint map.

## 📖 Documentation

The complete API reference, guides, and examples live in the central Querry Kit documentation:
<https://querry-kit.github.io/querry-kit/docs/nuxt>

## 🛠 Development

```sh
pnpm install
pnpm lint
pnpm check
pnpm test
pnpm test:coverage
pnpm build
```

`pnpm test:coverage` collects all source files, prints the coverage summary, and writes HTML and LCOV reports to `coverage/`. GitHub Actions runs the same command and retains the report as a workflow artifact.
