# Client and endpoints

`createApiClient(options, version?)` creates an Axios instance without assuming Nuxt, Pinia, cookies, or runtime configuration. `useModuleApi(api, endpoint)` wraps a typed resource endpoint and exposes `query`, `get`, `findById`, `count`, `create`, `update`, and `delete`.

All public functions and types are available through explicit package exports:

```ts
import { createApiClient, useModuleApi } from '@querry-kit/nuxt/api';
import { useTable } from '@querry-kit/nuxt/table';
import { useAutocomplete } from '@querry-kit/nuxt/autocomplete';
```
