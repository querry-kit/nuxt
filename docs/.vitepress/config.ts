import { defineConfig } from 'vitepress';

const repository = 'https://github.com/querry-kit/nuxt';

const sidebar = [
  {
    text: 'Guide',
    items: [
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Controller Contract', link: '/guide/controller-contract' },
      { text: 'Remote Tables', link: '/guide/table' },
      { text: 'Autocomplete', link: '/guide/autocomplete' },
      { text: 'Example App', link: '/guide/example-app' },
    ],
  },
  {
    text: 'Concepts',
    items: [{ text: 'Query Conventions', link: '/guide/query-conventions' }],
  },
  {
    text: 'API Reference',
    items: [
      { text: 'Overview', link: '/api/' },
      { text: 'Client and Endpoints', link: '/api/client' },
      { text: 'useTable', link: '/api/table' },
      { text: 'useAutocomplete', link: '/api/autocomplete' },
      { text: 'Backend Compatibility', link: '/api/query-kit' },
    ],
  },
];

export default defineConfig({
  base: '/nuxt/',
  title: '@querry-kit/nuxt',
  description: 'Developer documentation for @querry-kit/nuxt.',
  cleanUrls: true,
  head: [['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }]],
  lastUpdated: true,
  themeConfig: {
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: `${repository}/edit/main/docs/:path`,
      text: 'Edit this page on GitHub',
    },
    lastUpdated: {
      text: 'Last updated',
    },
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/' },
      { text: 'Ecosystem', link: 'https://querry-kit.github.io/querry-kit/' },
    ],
    sidebar,
    socialLinks: [{ icon: 'github', link: repository }],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Tobias Wälde',
    },
  },
});
