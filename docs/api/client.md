# Client and endpoints

`createApiClient(options, version?)` creates an Axios instance without assuming Nuxt, Pinia, cookies, or runtime configuration. Its base URL is `<resolved origin>/api/v1`; its request interceptor resolves the token and timezone for every request.

`useModuleApi(api, endpoint)` wraps a typed resource endpoint. It uses `qs` for nested request parameters and URL-encodes resource identifiers.

| Method                     | Request                        | Result                          |
| -------------------------- | ------------------------------ | ------------------------------- |
| `query(query?)`            | `GET /endpoint`                | `{ items, meta }` list response |
| `get(id, query?)`          | `GET /endpoint/:id`            | One item                        |
| `findById(id, query?)`     | `GET /endpoint/find-by-id/:id` | One item                        |
| `count(query?)`            | `GET /endpoint/count`          | Number                          |
| `create(data, query?)`     | `POST /endpoint`               | Created item                    |
| `update(id, data, query?)` | `PATCH /endpoint/:id`          | Updated item                    |
| `delete(id, query?)`       | `DELETE /endpoint/:id`         | Deleted item                    |

All public functions and types are available through explicit package exports:

```ts
import { createApiClient, useModuleApi } from '@querry-kit/nuxt/api';
import { useTable } from '@querry-kit/nuxt/table';
import { useAutocomplete } from '@querry-kit/nuxt/autocomplete';
```

The client and endpoint methods return ordinary Axios responses, so existing interceptors, cancellation, and error handling continue to work.
