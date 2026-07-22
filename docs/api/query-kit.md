# Query Kit compatibility

The supported list response is:

```ts
type PaginatedResponse<T> = {
  items: T[];
  meta: { itemCount: number; pageCount: number };
};
```

| Parameter         | Shape emitted by this package                              |
| ----------------- | ---------------------------------------------------------- |
| `page`, `perPage` | Pagination numbers                                         |
| `where`           | JSON string of a nested Query Kit condition                |
| `orderBy`         | JSON string of nested ascending/descending rules           |
| `fields`          | Compact field grammar, for example `id,title,author{name}` |
| `include`         | Nested `qs` payload, for example `include[author]=true`    |

`where` and `orderBy` are serialized as JSON strings and encoded with `qs`. The `fields` parameter uses the existing Query Kit selection grammar. The table starts with `id` (unless `staticFields` changes that set), adds visible columns, and adds nested `column.fields` below each column ID.

The list response must use `items`, not `data`, and provide `meta.itemCount` and `meta.pageCount`. Authentication, workspace host replacement, endpoint maps, and backend authorization remain in the consumer application.
