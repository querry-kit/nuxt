# Query conventions

The primitives expect a Query Kit resource endpoint. They do not translate a backend-specific dialect; keeping that contract explicit makes the same client usable in Nuxt, plain Vue, and tests.

## List response

```ts
type PaginatedResponse<T> = {
  items: T[];
  meta: { itemCount: number; pageCount: number };
};
```

The table reads exactly those properties. A backend that returns `data` instead of `items` needs an adapter before it reaches `useTable` or `useAutocomplete`.

## Query encoding

Nested object parameters use `qs` bracket notation. Table filters and sort rules are JSON values because Query Kit accepts a nested expression:

```ts
{
  where: JSON.stringify({ AND: [{ isArchived: false }, { author: { name: { contains: 'Ada' } } }] }),
  orderBy: JSON.stringify([{ author: { name: 'asc' } }]),
  fields: 'id,title,author{name}',
}
```

`useModuleApi` accepts the same `QueryParameters` type, so feature-specific callers can use the exact serialization without adopting the table composable.
