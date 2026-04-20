# Tisanerie

A small, beautiful web app that recommends herbal infusions (tisanes) based on
what you need — stress, sleep, digestion, cold, focus, and more. Bilingual
(French / English), mobile-friendly, and deployable on a free plan of either
GitHub Pages or Cloudflare Pages.

## Stack

- [Astro 5](https://astro.build) — static site generator
- React 18 islands for the interactive bits (need picker, fuzzy search,
  brewing timer, theme toggle)
- Tailwind CSS for styling with a sage / cream / amber palette
- Content collections (Zod-validated) drive the herb and need datasets
- Self-hosted `@fontsource-variable/fraunces` + `inter` — no third-party
  requests at runtime

## Local development

```bash
npm install
npm run dev            # http://localhost:4321/fr/
npm run build
npm run preview
```

## Deploying

### GitHub Pages (automated)

The repository ships with `.github/workflows/deploy.yml`. On every push to
`main`, it runs `npm ci && GITHUB_PAGES=true npm run build` and publishes
`dist/` to Pages.

The `GITHUB_PAGES` flag makes `astro.config.mjs` emit with `base: '/tisanerie'`
so the site works under `https://<user>.github.io/tisanerie/`.

One-time setup: in the repo settings, open **Pages** and set the source to
**GitHub Actions**.

### Cloudflare Pages (manual, optional)

1. In the Cloudflare dashboard → Workers & Pages → Create → Pages → connect
   this repository.
2. Build command: `npm run build`.
3. Build output directory: `dist`.
4. Leave environment variables empty (so `base` stays at `/`).

`public/_redirects` handles the language fallback: `/` → `/fr/`.

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
