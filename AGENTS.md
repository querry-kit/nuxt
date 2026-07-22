# Agent Guidelines

## Project Context

- This repository publishes `@querry-kit/nuxt`, a dual ESM/CommonJS TypeScript library for Vue 3 and Nuxt consumers.
- It provides framework-agnostic API, table, and autocomplete composables; it must not read Nuxt runtime configuration, stores, authentication state, or application event buses.
- Keep the package focused and dependency-light. Vue, Vue Router, VueUse, and TanStack Table Core remain peer dependencies; Axios and `qs` are runtime dependencies.

## Change Management

- Create a Changeset for every commit, including maintenance and documentation changes.
- Use a patch for fixes and documentation-only improvements, a minor release for additive public APIs, and a major release for breaking public API changes.
- Do not revert unrelated user changes, push without explicit authorization, or commit generated output.

## Public API and TypeScript

- Everything exported from `src/index.ts` and the configured package subpaths is public API: `.`, `./api`, `./table`, `./autocomplete`, `./types`, and `./utils`.
- Preserve both ESM and CommonJS compatibility. Add or change public exports only with matching JSDoc, tests, README, and VitePress updates.
- Use strict TypeScript, named exports, and `unknown` for unconstrained values. Keep implementation independent of Nuxt-only APIs.
- Public composables receive Axios clients and application state explicitly. Consumer applications own authentication, runtime config, workspace URL logic, global events, and endpoint maps.

## Testing and Verification

- Aim for 100% runtime line coverage; exclude only type-only and generated modules, never executable runtime code.
- For code changes, run `pnpm lint`, `pnpm check`, `pnpm build`, and `pnpm test:coverage`.
- For documentation changes, run `pnpm docs:build`; for example or workflow changes, run the corresponding package scripts or validate equivalent commands.
- For package export changes, verify the built ESM and CommonJS entrypoints.
- If a verification command cannot be run, report that explicitly.

## Git Workflow

- Keep commits scoped and intentional.
- Do not push without explicit user authorization.
- Check `git status --short --branch` before committing or pushing.
- When pushing a feature branch, open a draft pull request against the default branch and assign `@tobiaswaelde`.

## Release Workflow

- Develop on feature branches or `dev`, not directly on `main`.
- Changesets creates or updates release pull requests for versioning and changelog updates.
- Publishing uses the repository's npm Trusted Publishing workflow; do not publish manually unless explicitly requested.

## Documentation

- Keep the English README and VitePress documentation aligned with public APIs, examples, installation, and release workflow.
- Keep navigation, sidebar entries, and linked pages in sync for VitePress changes.
- Docs examples must use the published `@querry-kit/nuxt` package name and remain practical.
