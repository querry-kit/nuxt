---
layout: home
hero:
  name: '@querry-kit/nuxt'
  text: Query Kit for Vue and Nuxt
  tagline: Typed API clients and portable remote state for Query Kit resource endpoints.
  image:
    src: /logo.svg
    alt: '@querry-kit/nuxt logo'
  actions:
    - theme: brand
      text: Getting Started
      link: /guide/getting-started
    - theme: alt
      text: Controller Contract
      link: /guide/controller-contract
    - theme: alt
      text: API Reference
      link: /api/
features:
  - title: Typed resource API
    icon: 🔌
    details: Configure one Axios client, describe endpoint payloads once, and use typed list, detail, count, and mutation methods everywhere.
    link: /api/client
    linkText: Explore the client
  - title: Headless remote tables
    icon: 📊
    details: Compose pagination, fields, filters, sorting, persistence, and stale-request protection without coupling to a UI library or router.
    link: /guide/table
    linkText: Build a table
  - title: Selection-safe autocomplete
    icon: ✨
    details: Keep selected resources available while search queries change, then hand plain reactive options to the component library of your choice.
    link: /guide/autocomplete
    linkText: Add autocomplete
  - title: Explicit backend contract
    icon: 🧭
    details: See the controller routes and Query Kit response shape required by the composables before connecting an application.
    link: /guide/controller-contract
    linkText: Read the contract
---
