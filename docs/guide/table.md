# Remote tables

`useTable` composes resource queries from column definitions and reactive table state. It keeps column order, visibility, pinning, and page size in local storage; only the current page is reflected in the route query.

```ts
const table = useTable({
  api,
  endpoint: 'books',
  persistenceKey: 'books',
  columnDefinitions,
  staticInclude: { author: true },
  isArchived: false,
});

await table.initialize();
```

The composable sends `where` and `orderBy` as JSON values through `qs`, creates Nest-compatible `fields` selections, and ignores responses that finish after a newer request. Call `refresh()` explicitly after domain mutations or `updateRow()` for an in-place merge.
