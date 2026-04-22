# Tisanerie

A small, beautiful web app that recommends herbal infusions (tisanes) based on
what you need — stress, sleep, digestion, cold, focus, and more. Bilingual
(French / English), mobile-friendly, and hosted on Cloudflare Pages.

Live at **https://tisanerie.app**.

## Stack

- [Astro 5](https://astro.build) — static site generator
- React 18 islands for the interactive bits (need picker, fuzzy search,
  brewing timer, theme toggle)
- Tailwind CSS for styling with a sage / cream / amber palette
- Content collections (Zod-validated) drive the herb and need datasets
- Self-hosted `@fontsource-variable/fraunces` + `inter` — the only runtime
  third-party request is the optional Cloudflare Web Analytics beacon,
  enabled only when `PUBLIC_CF_ANALYTICS_TOKEN` is set at build time

## Local development

```bash
npm install
npm run dev            # http://localhost:4321/fr/
npm run build
npm run preview
```

## Deploying

### Cloudflare Pages

The production site is deployed via Cloudflare Pages, connected to the
GitHub repository; every push to `main` triggers a build.

- Build command: `npm run build`
- Build output directory: `dist`
- Node version: pinned via `.nvmrc`
- Environment variables:
  - `PUBLIC_CF_ANALYTICS_TOKEN` — Cloudflare Web Analytics beacon token
    (optional; if unset the beacon is omitted).

`public/_redirects` handles the language fallback (`/` → `/fr/`) and
`public/_headers` sets long-lived caching for hashed assets plus baseline
security headers.

## Project layout

```
src/
  content/
    config.ts            Zod schemas for herbs + needs
    herbs/*.json         ~25 plant entries (bilingual)
    needs/*.json         ~12 need entries (bilingual, with blends)
  i18n/
    fr.json, en.json     UI copy
    routes.ts            localized URL segments + helpers
    utils.ts             t() helper
  lib/
    matcher.ts           herb scoring against need keys
    types.ts
  components/
    pages/               shared page bodies reused by FR + EN routes
    *.astro, *.tsx       reusable cards, islands, layout
  pages/
    index.astro          language redirect
    [lang]/index.astro   home (FR + EN)
    fr/…, en/…           localized subpages
```

## Content model

Every herb and need is stored as a small JSON file with bilingual fields. To
add a plant, drop a new `src/content/herbs/my-plant.json` that matches the
schema in `src/content/config.ts`; the build will validate it and all pages
are regenerated automatically.

Informational only — not medical advice.
