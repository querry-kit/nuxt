# Example app

`examples/nuxt` is a small Nuxt application with a mocked Axios adapter. Its plugin imports `createApiClient` and `useModuleApi` from `@querry-kit/nuxt/api`, and imports the endpoint contract from `@querry-kit/nuxt/types`. It does not rely on private source-file paths or a server.

```sh
pnpm examples:check
pnpm examples:build
```

It is intentionally a consumer, not a second implementation: the Nuxt plugin owns the client configuration and typed endpoint map, while the app component owns presentation. Use it as a reference for supported package subpaths and type checking; it does not prescribe a UI library or state-management solution.
