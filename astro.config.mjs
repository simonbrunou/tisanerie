import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://tisanerie.app',
  trailingSlash: 'always',
  prefetch: {
    defaultStrategy: 'viewport',
    prefetchAll: false,
  },
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: { fr: 'fr-FR', en: 'en-US' },
      },
      filter: (page) => page !== 'https://tisanerie.app/',
    }),
  ],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true,
      // Keep our own src/pages/index.astro (with OG tags) at `/` so crawlers
      // that don't follow redirects still get a rich link preview.
      redirectToDefaultLocale: false,
    },
  },
  build: {
    format: 'directory',
  },
});
