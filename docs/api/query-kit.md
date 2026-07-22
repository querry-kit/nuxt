# Query Kit compatibility

The supported list response is:

```ts
type PaginatedResponse<T> = {
  items: T[];
  meta: { itemCount: number; pageCount: number };
};
```

`where` and `orderBy` are serialized as JSON strings and encoded with `qs`. The `fields` parameter uses the existing Query Kit selection grammar, for example `id,title,author{name}`. Authentication, workspace host replacement, and endpoint maps stay in the consumer application.
