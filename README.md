# @querry-kit/nuxt

Typed Vue 3 and Nuxt primitives for Query Kit APIs: an Axios client, resource endpoints, remote tables, and autocompletes.

## Install

```sh
pnpm add @querry-kit/nuxt axios @tanstack/table-core @vueuse/core @vueuse/router vue vue-router
```

## Usage

```ts
import axios from 'axios';
import { useModuleApi } from '@querry-kit/nuxt/api';

const api = axios.create({ baseURL: 'https://api.example.test/api/v1' });
const users = useModuleApi(api, 'users');
const response = await users.query({ page: 1, perPage: 25 });
```

`@querry-kit/nuxt` is framework-neutral: applications supply their own Axios instance, authentication, runtime configuration, routing, and endpoint map.

## Documentation

The published guides cover API clients, remote tables, autocompletes, backend compatibility, and the runnable mocked Nuxt example. Build them locally with `pnpm docs:build`.

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

Releases are versioned with Changesets and published through npm Trusted Publishing.
