import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

const isGithubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  site: isGithubPages ? 'https://simonbrunou.github.io' : 'https://tisanerie.pages.dev',
  base: isGithubPages ? '/tisanerie' : '/',
  trailingSlash: 'always',
  integrations: [react(), tailwind({ applyBaseStyles: false })],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  build: {
    format: 'directory',
  },
});
