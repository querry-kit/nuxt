# Remote tables

`useTable` composes resource queries from column definitions and reactive table state. It keeps column order, visibility, pinning, and page size in local storage; only the current page is reflected in the route query.

```ts
const table = useTable({
  api,
  endpoint: 'books',
  persistenceKey: 'books',
  columns: columnDefinitions,
  staticInclude: { author: true },
  isArchived: false,
});

await table.initialize();
```

The composable sends `where` and `orderBy` as JSON values through `qs`, creates Nest-compatible `fields` selections, and ignores responses that finish after a newer request. Call `refresh()` explicitly after domain mutations or `updateRow()` for an in-place merge.

| Option                           | Purpose                                                                            |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `persistenceKey`                 | Required storage namespace. `name` remains a compatibility alias.                  |
| `columns`                        | Required `Ref` of column metadata. `actions` is never selected as a backend field. |
| `staticFields` / `staticInclude` | Fields or relation includes always requested in addition to visible columns.       |
| `staticFilter` / `isArchived`    | Reactive filter and archive condition applied before user filtering.               |
| `routePage`                      | A `Ref` supplied by the application; the composable never imports a router.        |
| `storage`                        | `localStorage`-compatible adapter. Storage failures do not interrupt a table.      |
| `identityKey`                    | Key used by `updateRow`; defaults to `id`.                                         |

### Lifecycle and state

Call `initialize()` after the consuming view is ready. It applies the initial route page, fetches rows, then runs `onInitialized`. Any change to page, page size, sort, filters, columns, or static filter requests fresh data. The returned `loading` and `error` refs always reflect the latest request; an old request that completes later cannot overwrite rows or errors.

To use a route query without coupling the package to Vue Router, pass the ref you already control:

```ts
const routePage = computed({
  get: () => Number(route.query.page ?? 1),
  set: (page) => router.replace({ query: { ...route.query, page } }),
});

const table = useTable({ api, endpoint: 'books', persistenceKey: 'books', columns, routePage });
```
