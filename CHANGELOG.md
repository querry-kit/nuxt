# @querry-kit/nuxt

## 1.0.0

### Major Changes

- 0dfdbf2: Require Node.js 26.13.0 or newer and drop Node.js 24 support. Upgrade application runtimes and CI before updating.

### Minor Changes

- ae55a5f: Add scalar group-by API requests and lazy server-backed nested table groups.

### Patch Changes

- 0dfdbf2: Refresh compatible dependencies and the lockfile while preserving the TypeScript compatibility toolchain and security overrides.
- ae55a5f: Keep grouping documentation aligned with the current Node.js 26 baseline.
- ae55a5f: Document the typed JSON filter option for global query pipes.

## 0.2.10

### Patch Changes

- 33fee30: Declare VueUse 15 compatibility alongside existing VueUse 14 support. The module already builds and tests against VueUse 15; this aligns the published peer contract with validated consumers without dropping VueUse 14.

## 0.2.9

### Patch Changes

- fdd7739: Update stable dependencies and security fixes, and move development, CI, and application images to Node.js 26 LTS. Application runtimes now require Node.js 26; public library runtime support is preserved. TypeScript 7 builds use the TypeScript 6 compatibility API for lint and test tooling.

## 0.2.8

### Patch Changes

- 4c8546b: Remove the unused TanStack Table peer, prevent prototype pollution, validate stored table preferences, and fix autocomplete query updates and loading state.

## 0.2.7

### Patch Changes

- ee2d9c7: Refresh dependencies within their supported version ranges.

## 0.2.6

### Patch Changes

- 6fe4dcf: Resolve vulnerable transitive development dependencies.

## 0.2.5

### Patch Changes

- 3ce3252: Update runtime and development dependencies.

## 0.2.4

### Patch Changes

- 301a41c: Fix the Changesets v2 workflow input so release pull requests can be created and updated again.
- c78c2b0: Resolve vulnerable transitive browser data and YAML parser versions.
- 493c5e4: Update Jest to 30.5.1 and keep clean CI installs compatible with its watcher dependency.
- e05c99d: Update the development Vue Router version to 5.3.1.

## 0.2.3

### Patch Changes

- 944000b: Keep the central documentation changelog in sync after releases.

## 0.2.2

### Patch Changes

- f83b766: Update transitive dependencies to resolve security alerts.

## 0.2.1

### Patch Changes

- cf0b8b8: Add security reporting and repository maintenance configuration.

## 0.2.0

### Minor Changes

- 3583237: Add renderer-neutral filter and sorting field contracts to the public types API.

## 0.1.1

### Patch Changes

- 1359ef2: Expand test coverage across all runtime functions and branches.
- 4f3d55d: Move package documentation and examples to the central Querry Kit site.

## 0.1.0

### Minor Changes

- d54486a: Accept generic renderer metadata and optional column IDs through `useTable` without adding a UI dependency.

### Patch Changes

- 7233da0: Make package entrypoint exports explicit, keep implementation helpers private, and align documentation and the Nuxt example with the public subpaths.

## 0.0.5

### Patch Changes

- e0f6780: Standardize the English README and contributor guidance.

## 0.0.4

### Patch Changes

- dc05edd: Link the Nuxt documentation and README to the Querry Kit ecosystem overview.

## 0.0.3

### Patch Changes

- 245893b: Improve the documentation landing page, navigation, and backend controller contract guidance.

## 0.0.2

### Patch Changes

- 578e8a4: Improve the public API reference, lifecycle guidance, and JSDoc for Nuxt primitives.
- 7c74f64: Align the README status badges, release guidance, and project funding metadata with sibling packages.
- 8faa7ac: Build the package before validating the Nuxt example in CI.
