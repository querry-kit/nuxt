# Query Kit Nuxt Packages

## Summary

- Create `@querry-kit/nuxt` in this repository as a tsup-built, dual ESM/CJS Vue library usable from Vue 3 and Nuxt.
- Create sibling repository `@querry-kit/nuxt-ui` at `~/Projects/querry-kit/nuxt-ui` as a Nuxt 4 module for customizable Nuxt UI table components, auto-imports, scoped translations, Storybook, and visual documentation.
- Publish `@querry-kit/nuxt@0.1.0` first. `@querry-kit/nuxt-ui` then consumes `@querry-kit/nuxt@^0.1.0` as its peer and development dependency; it does not rely on an unpublished workspace link or Git dependency.
- Mirror `@querry-kit/nest` standards: `AGENTS.md`, Changesets, VitePress docs, README, CI/release setup, strict TypeScript, examples, and 100% runtime line coverage.
- Do not migrate Tenant-Web or Machine-Admin-Web in this delivery; use them as behavior baselines. V1 ports only the table-related UI, not Core-Web's unrelated inputs, dialogs, buttons, auth components, stores, or layout components.

## `@querry-kit/nuxt`

- Build with tsup; publish typed ESM/CJS root plus `/api`, `/table`, `/autocomplete`, `/types`, and `/utils` subpaths.
- Use Vue, Vue Router, VueUse, and TanStack Table Core as peer dependencies. Use Axios and `qs` as runtime dependencies; keep Nuxt-specific APIs out of the core.
- Export generic endpoint maps, Query Kit request types, paginated response metadata, table columns, sorting, filtering, pinning, serialization, and comparison utilities.
- Provide `createApiClient(options, version?)` for `/api/v1`, token/header callbacks, request source, timezone, and base-URL resolution. It never reads Nuxt config, stores, or auth state.
- All data composables receive Axios explicitly:
  - `useModuleApi(api, endpoint)` implements Query Kit query, get, `findById`, count, create, update, and delete requests.
  - `useTable(options)` receives API, endpoint, reactive columns, static fields/include/filter, archive state, persistence key, pagination defaults, and callbacks.
  - `useAutocomplete(options)` receives API, endpoint, query, selected value, configurable identity key, and disabled predicate.
- Preserve Tenant-Web table behavior: column pinning, static include, archive filters, `findById`, configurable autocomplete identity key, robust equality, local-storage column/page-size persistence, URL page synchronization, and Nest-compatible fields selection.
- Serialize list requests with `qs` and preserve Tenant-Web's JSON-encoded `where` and `orderBy` values. Support the `@querry-kit/nest` `{ items, meta }` response shape with `meta.itemCount` and `meta.pageCount`.
- Remove app event-bus coupling; retain explicit `initialize`, `refresh`, and `updateRow`, callbacks, loading state, and observable error state. Supersede stale HTTP responses during reactive changes without replacing newer data.
- Include a standalone Nuxt example with mocked Axios responses.

## `@querry-kit/nuxt-ui`

- Create a Nuxt 4 module with `@querry-kit/nuxt`, `@nuxt/ui`, `@nuxtjs/i18n`, Vue, VueUse, and TanStack Table as explicit peers. Provide options to disable auto-imports and locale registration.
- Port the maintained Core-Web table behavior into collision-safe public components: `QuerryKitTableToolbar`, `QuerryKitTableSorting`, `QuerryKitTableFiltering`, `QuerryKitTableOptions`, and `QuerryKitTablePagination`.
- Preserve Core-Web's toolbar, sorting, filtering, column options/reordering/pinning, responsive layout, keyboard shortcuts, accessibility labels, and Nuxt UI styling. Use the stronger Tenant-Web/Core-Web behavior where sources differ.
- Implement `QuerryKitTablePagination` as a self-contained replacement for Tenant-Web's `LayoutTablePanelFooter`: page summary, configurable page sizes, pagination controls, keyboard navigation, and left/right regions. Do not depend on the CRM-specific `LayoutFooter`, which does not exist in Core-Web.
- Make every public component fully customizable:
  - Typed props cover labels, icons, sizes, available page sizes, UI classes/config, breakpoint behavior, field/column definitions, and shortcut enablement.
  - Named slots cover toolbar regions, triggers, popover/header content, items, empty states, action buttons, footer regions, and pagination controls.
  - Scoped slots expose the active table/filter/sort/column state and mutation actions, so consumers can replace internal rendering without duplicating logic.
  - Defaults preserve current Nuxt UI behavior; slots/props override only the requested region and do not require forks.
- Keep existing `v-model` contracts. Auto-imported component names use the `QuerryKit` prefix to avoid collisions with consumer components.
- Use collision-safe `querryKit.table.*` translation keys. Ship English/German records, merge them without replacing consumer messages, and export them for manual Vue-i18n integration and overrides.
- Add Storybook stories for defaults and customization points. Build Storybook, then use Playwright to capture versioned component screenshots into `docs/public/components`.
- Include a Nuxt example demonstrating custom toolbar slots, custom filter/option item rendering, overridden texts/icons, and a custom table pagination/footer.

## Tooling, linting, and documentation

- Replicate the Nest README/docs structure with installation, API setup, Nest Query Kit compatibility, table/autocomplete guides, UI customization and i18n references, examples, Storybook, screenshots, and release workflow.
- Adopt the Nest ESLint Flat Config baseline in both repositories: TypeScript recommended rules, Prettier as an error rule, and ignores for dependencies, build output, coverage, Nuxt output, and VitePress artifacts.
- Retain Nest's pragmatic TypeScript exceptions for explicit return types, module boundaries, empty object types, explicit `any`, and unused variables. Supply Node globals for scripts/configuration and test-runner globals in test files.
- Add the Tenant-Web Vue configuration wherever `.vue` files are linted: `eslint-plugin-vue` flat base, `typescript-eslint` parsing for `<script setup lang="ts">`, and the documented `vue/attributes-order` rule as a warning (directives, static attributes, dynamic attributes, events, then content).
- Use the CRM Prettier conventions in both repositories: 120-character print width, semicolons, single quotes, trailing commas, automatic end-of-line handling, Vue overrides, and `prettier-plugin-organize-imports`. The UI repository also uses `prettier-plugin-tailwindcss` to sort Nuxt UI/Tailwind classes.
- Provide `lint` and local-only `lint:fix` scripts. CI runs lint without automatic rewrites.

## Tests and verification

- Unit-test core serialization, fields selection, filtering/sorting, column persistence, URL sync, client headers/URLs, API methods, stale/error handling, autocomplete merge/deduplication, and table updates.
- Test Nuxt module registration and locale merging; component-test all default and overridden slot/prop paths, `v-model` behavior, keyboard interactions, and accessibility labels.
- Enforce 100% runtime line coverage. CI runs lint, typecheck, build, coverage, examples, docs, Storybook, screenshot verification, and ESM/CJS import smoke tests.

## Assumptions

- Supported backend contract is `@querry-kit/nest` `ResourceQuery`: list endpoints return `{ items, meta }`; filters/sort are JSON encoded through `qs`; `fields` uses its existing selection grammar.
- Product-app auth, workspace URL logic, runtime config, global events, and domain endpoint maps remain consumer responsibilities.
- The CRM folders are reference sources only; no CRM code or configuration is modified by this work.
