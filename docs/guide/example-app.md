# Example app

`examples/nuxt` is a small Nuxt application with a mocked Axios adapter. It exercises `createApiClient`, `useModuleApi`, `useTable`, and `useAutocomplete` without requiring a server.

```sh
pnpm examples:check
pnpm examples:build
```

It is intentionally a consumer, not a second implementation: the Nuxt plugin owns the client configuration, and the app component owns its column metadata and presentation. Use it as a reference for package imports and type checking; it does not prescribe a UI library or state-management solution.
