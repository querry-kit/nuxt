# Query Kit Nuxt

Reusable Vue 3 and Nuxt building blocks for APIs implementing the Query Kit `ResourceQuery` contract. The core is headless: it manages remote state and emits plain reactive values, while the application owns visual components and framework integrations.

<div class="vp-doc">

<a class="VPButton brand" href="/nuxt/guide/getting-started">Get started</a>

</div>

## What belongs where

| Package responsibility                                                 | Application responsibility                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------------------- |
| Typed REST methods and Query Kit serialization                         | Nuxt runtime config and API origin                             |
| Table/autocomplete fetching, stale-request protection, and local state | Authentication, stores, router adapters, and visual components |
| Explicit storage and URL-page adapters                                 | Endpoint map and feature-specific permissions                  |

Give the package an Axios instance and explicit endpoint types; it supplies portable remote-data primitives without hidden global dependencies.
