import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Query Kit Nuxt',
  description: 'Vue and Nuxt primitives for Query Kit APIs.',
  base: '/nuxt/',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/client' },
      { text: 'GitHub', link: 'https://github.com/querry-kit/nuxt' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Table', link: '/guide/table' },
            { text: 'Autocomplete', link: '/guide/autocomplete' },
            { text: 'Query conventions', link: '/guide/query-conventions' },
            { text: 'Example app', link: '/guide/example-app' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: 'Client and endpoints', link: '/api/client' },
            { text: 'Table', link: '/api/table' },
            { text: 'Autocomplete', link: '/api/autocomplete' },
            { text: 'Backend compatibility', link: '/api/query-kit' },
          ],
        },
      ],
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Querry Kit',
    },
  },
});
