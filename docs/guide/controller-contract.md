---
description: 'Backend routes and response shapes required by @querry-kit/nuxt.'
---

# Controller Contract

`@querry-kit/nuxt` deliberately does not implement a backend. Its API and composables expect a Query Kit-compatible resource controller. The endpoint name passed to `useModuleApi`, `useTable`, or `useAutocomplete` is appended to the configured `/api/v1` base URL.

For `endpoint: 'books'`, these are the routes exposed by `useModuleApi`:

| Method   | Route                   | Used by                                | Required response                          |
| -------- | ----------------------- | -------------------------------------- | ------------------------------------------ |
| `GET`    | `/books`                | `query`, `useTable`, `useAutocomplete` | [Paginated list](#paginated-list-response) |
| `GET`    | `/books/:id`            | `get`                                  | One resource                               |
| `GET`    | `/books/find-by-id/:id` | `findById`                             | One resource                               |
| `GET`    | `/books/count`          | `count`                                | Number                                     |
| `POST`   | `/books`                | `create`                               | Created resource                           |
| `PATCH`  | `/books/:id`            | `update`                               | Updated resource                           |
| `DELETE` | `/books/:id`            | `delete`                               | Deleted resource                           |

The table and autocomplete only require the list route. Mutation routes are needed only when the application calls the corresponding `useModuleApi` method.

## Paginated List Response

The list route must return `items` and pagination metadata. The composables intentionally do not accept a `data` alias.

```ts
type PaginatedResponse<T> = {
  items: T[];
  meta: {
    itemCount: number;
    pageCount: number;
  };
};
```

`useTable` reads `items`, `meta.itemCount`, and `meta.pageCount`. `useAutocomplete` reads `items` from the same list response.

## Query Parameters

| Parameter         | Expected by                           | Purpose                                                  |
| ----------------- | ------------------------------------- | -------------------------------------------------------- |
| `page`, `perPage` | Table and list callers                | Pagination.                                              |
| `where`           | Table, autocomplete, and list callers | JSON-encoded Query Kit filter expression.                |
| `orderBy`         | Table and list callers                | JSON-encoded nested sort rules.                          |
| `fields`          | Table and list callers                | Compact field selection such as `id,title,author{name}`. |
| `include`         | Table and list callers                | Nested relation includes encoded with `qs`.              |

Read the [query conventions](/guide/query-conventions) for concrete serialized values. The controller must URL-decode those values and apply the same response contract.

## NestJS Reference

`@querry-kit/nest` contains the full controller pattern, including resource reads, writes, DTO mapping, fields projection, and OpenAPI metadata. Use its [CRUD Controller guide](https://querry-kit.github.io/nest/guide/crud-controller) as the server-side implementation reference.
