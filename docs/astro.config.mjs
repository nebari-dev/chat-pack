import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { nebari } from '@nebari/starlight';
import rehypeMermaid from 'rehype-mermaid';
import remarkBaseLinks from './src/plugins/remark-base-links';

export default defineConfig({
  base: process.env.BASE || '/',
  site: process.env.SITE,
  integrations: [
    starlight({
      title: 'Nebari Chat Pack',
      description: 'Deploy a chat interface on Nebari.',
      // Shared Nebari identity (brand colors, fonts, logo, favicon, footer, and
      // GitHub social link) comes from the @nebari/starlight theme plugin. On the
      // portal the header logo returns users to the pack catalog.
      plugins: [nebari({ logoHref: 'https://packs.nebari.dev/' })],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/' },
            { label: 'Getting started', link: '/getting-started/' },
            { label: 'Agents & models', link: '/agents/' },
            { label: 'Tools', link: '/tools/' },
            { label: 'Branding & Configuration', link: '/branding/' },
            { label: 'Local development', link: '/local-development/' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Helm values', link: '/helm-values/' },
            { label: 'REST API', link: '/api-reference/' },
            { label: 'Architecture & auth', link: '/architecture/' },
          ],
        },
      ],
    }),
  ],
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    remarkPlugins: [[remarkBaseLinks, { base: process.env.BASE || '/' }]],
    rehypePlugins: [[rehypeMermaid, { strategy: 'inline-svg' }]],
  },
});
