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
pnpm add @querry-kit/nuxt axios @vueuse/core @vueuse/router vue vue-router
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

The workspace build allowlist permits the native scripts required by the test
toolchain, including Parcel's file watcher.

`pnpm test:coverage` collects all source files, prints the coverage summary, and writes HTML and LCOV reports to `coverage/`. GitHub Actions runs the same command and retains the report as a workflow artifact.

Dependency maintenance updates manifests and the pnpm lockfile within supported version ranges.

TanStack Table is not a peer dependency: the composables use renderer-independent column metadata and sorting state.

Query path expansion ignores `__proto__`, `constructor`, and `prototype` segments. Autocomplete reloads after nested query mutations and clears its loading state when a pending selection is removed. Stored table preferences are validated before use; malformed values or unavailable storage fall back to defaults.

## Development toolchain

Use Node.js 26.13.0 LTS and the package manager pinned in `package.json`. Published library runtime compatibility remains unchanged. Builds use TypeScript 7; ESLint and compiler-API consumers use the TypeScript 6 compatibility package. Dependency overrides, where present, pin security fixes for transitive packages; validate tests and documentation builds when changing them.

## Server-backed nested groups

`useGroupedTable` loads complete groups independently of ordinary list pagination.
Each header shows the count of all matching accessible records. Child groups and
leaf records load only when opened; each branch has its own continuation state.

```ts
import { useGroupedTable } from '@querry-kit/nuxt';
import type { GroupPath } from '@querry-kit/nuxt/types';

const table = useGroupedTable<Task>({
  api,
  endpoint: 'tasks',
  persistenceKey: 'tasks',
  columns,
  groupableFields: [
    { value: 'status', label: 'Status' },
    { value: 'category', label: 'Category' },
  ],
  defaultGrouping: ['status', 'category'],
  groupBatchSize: 25,
  defaultItemsPerPage: 25,
});

await table.initialize();
await table.loadMoreGroups(); // more root groups
// For a rendered group node:
await table.toggleGroup(node.path);
await table.loadMoreGroups(node.path); // child groups at an intermediate level
await table.loadMoreItems(leaf.path); // records at the final level
```

`groups` is a computed ref. `root` and each node expose `children`, `items`, `loading`,
`error`, and `hasMore`. Nodes also expose `key`, typed `path`, `field`, `value`,
`count`, `expanded`, and `loaded`. Use `node.key` as the renderer key and preserve
`node.path` as data, rather than building string paths from display labels.

The composable returns `grouping`, `sorting`, `filtering`, `itemsPerPage`, `columns`,
`fields`, `columnOrder`, `columnVisibility`, and `columnPinning` using existing table
preference conventions. Only the grouping selection is persisted; expansion and
loaded data remain in memory. Empty grouping loads a flat list through
`loadMoreItems([])`. `refresh()` discards cached groups and resets expansion.
Changing filters, grouping, sorting, fields, or page size invalidates pending results.
Errors remain local to the affected branch; call its load-more action again to retry.
Callbacks `onInitialized`, `onRefreshed` (the branch's accumulated records), and
`onError` are optional. A unique `identityKey` defaults to `id` and provides a stable
record-sort tie-breaker. Group keys sort ascending; grouping fields can be reordered.

The API client also exposes `groupBy<TResult>(query)`, returning an Axios response
whose data is `TResult[]`, from `GET /:resource/group-by`. A request uses bracket
notation for `by`, ordering and selectors; `where` is JSON encoded to preserve
scalar key types. Group continuation fetches one lookahead group and does not need
a total group count. There is no global record page in grouped mode.

Configure the backend routes as described in the Nest Query Service grouping guide:
use the same static/tenant/access constraints for counts and records, allowlist scalar
fields, enable `preserveJsonWhereTypes` on the service and, when used, on `QueryTransformPipe`. Client filtering is not authorization. Null keys remain real group values;
relations, date intervals, and snapshot-consistent pagination are outside this API.
After data mutations, call `refresh()` to reload counts and membership.
