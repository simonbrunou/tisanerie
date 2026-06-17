import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = { '~': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      // Pure logic + Astro lib code (no DOM) — the existing suite.
      {
        resolve: { alias },
        test: { name: 'node', environment: 'node', include: ['src/**/*.test.ts'] },
      },
      // React islands — jsdom so component .test.tsx can render. esbuild handles the
      // automatic JSX runtime (avoids @vitejs/plugin-react, which conflicts with Astro's Vite).
      {
        resolve: { alias },
        esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
        test: { name: 'islands', environment: 'jsdom', include: ['src/**/*.test.tsx'] },
      },
    ],
  },
});
