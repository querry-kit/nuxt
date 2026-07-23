# `useTable`

```ts
function useTable<TItem, TColumn extends TableColumnInput<TItem>>(options: UseTableOptions<TItem, TColumn>): TableState<TItem>;
```

`useTable` is headless remote-table state. It owns query composition and persistence, but not a table renderer, a router, or a global store. Column metadata is preserved verbatim, so a renderer can keep labels, accessors, and custom header data alongside the Query Kit `id` and `fields` metadata.

Import `useTable` from `@querry-kit/nuxt/table`; import `UseTableOptions`, `TableColumnInput`, and related contracts type-only from `@querry-kit/nuxt/types`. The table subpath publishes no storage, page-normalization, or column-filtering helpers.

## Returned state

| Value                                              | Description                                                 |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `page`, `itemsPerPage`                             | Current pagination; changing either triggers a new request. |
| `sorting`, `filtering`                             | Query Kit UI state persisted by `persistenceKey`.           |
| `columnOrder`, `columnVisibility`, `columnPinning` | Persisted presentational metadata for a renderer.           |
| `columns`, `fields`, `queryParams`                 | Derived visible columns, field grammar, and outgoing query. |
| `items`, `totalItems`, `totalPages`                | Latest accepted server response.                            |
| `loading`, `error`                                 | State of the most recent request.                           |

## Actions

| Action           | Behavior                                                                           |
| ---------------- | ---------------------------------------------------------------------------------- |
| `initialize()`   | Syncs the input route page, refreshes, then calls `onInitialized`.                 |
| `refresh()`      | Fetches the current query. A newer request wins over an older one.                 |
| `updateRow(row)` | Shallow-merges a row with the matching `identityKey` and triggers the shallow ref. |

See the [table guide](/guide/table) for the complete option reference and router-adapter example.
