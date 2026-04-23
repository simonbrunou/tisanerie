# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Node version is pinned in `.nvmrc` (20).

- `npm install` — install dependencies
- `npm run dev` — Astro dev server at `http://localhost:4321/fr/`
- `npm run build` — static build to `dist/`
- `npm run preview` — serve the built site
- `npm run typecheck` — `astro check` (runs in CI)
- `npm run test` — Vitest single run (runs in CI)
- `npm run test:watch` — Vitest watch mode
- Run a single test file: `npx vitest run src/lib/matcher.test.ts`
- Run tests by name: `npx vitest run -t "scoreHerb"`

CI (`.github/workflows/ci.yml`) runs `npm ci` → typecheck → test → build on every push / PR. Production deploys happen via Cloudflare Pages' GitHub integration on push to `main`; there is no local deploy command.

## Architecture

### Astro 5 static site + React islands
Pages are `.astro`; interactive components (`NeedPicker.tsx`, `SearchBox.tsx` / `SearchResults.tsx`, `BrewingTimer.tsx`, `ThemeToggle.tsx`) are React, hydrated with `client:load`. Output is fully static — no SSR.

### Bilingual routing (FR default, EN second)
`astro.config.mjs` sets `prefixDefaultLocale: true`, so even French URLs carry `/fr/`. `src/i18n/routes.ts` owns the localized URL segments (`besoins`↔`needs`, `plantes`↔`herbs`, `decouvrir`↔`discover`, `recherche`↔`search`, `a-propos`↔`about`, `proprietes`↔`properties`, `afflictions`↔`afflictions`).

- Build internal links with `localizedPath(lang, key, slug?)`. **Never hardcode `/fr/...` or `/en/...`.**
- The locale switcher uses `swapLocaleInPath()`.
- `routeSegments` only builds links — it does not generate routes. If you rename a segment, you must also move the corresponding folder under `src/pages/{fr,en}/` to match.
- `trailingSlash: 'always'` and `build.format: 'directory'` are set; keep internal links ending in `/`.

### Page-pair pattern
Each user-facing page exists as two thin route files (`src/pages/fr/<segment>/[slug].astro` and `src/pages/en/<segment>/[slug].astro`) that both delegate to a shared body component in `src/components/pages/*Page.astro` (`HerbPage`, `NeedPage`, `TaxonPage`, `DiscoverPage`, `SearchPage`, `AboutPage`). The route files typically contain nothing more than `getStaticPaths` and `<SharedPage lang="fr|en" … />`. `src/pages/index.astro` is a root redirect that picks FR/EN from `navigator.language`; `public/_redirects` provides the server-side fallback (`/` → `/fr/`).

### Content collections are the data model
`src/content/config.ts` defines two Zod-validated collections:

- **`herbs`** — one JSON per plant in `src/content/herbs/*.json`. Bilingual fields `{ fr, en }`, brewing params, plus three taxonomy arrays:
  - `benefits` — needs it helps (required, non-empty)
  - `primaryBenefits` — subset of `benefits` that this herb is particularly strong for
  - `properties` — herbalist traits (`adaptogen`, `carminative`, …)
  - `afflictions` — symptoms (`insomnia`, `bloating`, …)
- **`needs`** — one JSON per need in `src/content/needs/*.json`. Each has exactly one `benefit` key plus optional `blends`.

The allowed keys for `benefits`, `properties`, and `afflictions` are enumerated as Zod enums in `config.ts`. **Adding a new key requires two things:** update the enum in `config.ts`, and add matching translations in `src/i18n/fr.json` and `src/i18n/en.json` under the `property.<key>` or `affliction.<key>` namespace — `searchItems.ts` and `HerbPage.astro` look them up via `` t(lang, `property.${key}`) ``.

Adding a herb or need is just dropping a JSON file; the build regenerates all pages. The build fails if the schema doesn't match.

### Matching & ranking
`src/lib/matcher.ts` is the single ranking algorithm. `scoreHerb` awards **2 points** for a `primaryBenefits` hit and **1 point** for a `benefits` hit; ties break by `popularity` (0–100). `herbsForNeed(herbs, need, limit)` is the entry point used on need pages.

### Derived taxonomy pages
`src/lib/taxons.ts` computes the set of `properties` / `afflictions` actually in use across all herbs, so `src/pages/{fr,en}/{proprietes,properties,afflictions}/[slug].astro` only emits pages for keys that at least one herb uses.

### Search index built at compile time
`src/lib/searchItems.ts` assembles a flat `SearchItem[]` (herbs + needs + properties + afflictions) with bilingual haystacks. It's serialized into the page payload; Fuse.js runs in the browser inside `SearchBox.tsx` / `SearchResults.tsx`.

### Layout, SEO, SW, theme
- `src/layouts/Base.astro` handles canonical URLs, `hreflang` alternates (via `swapLocaleInPath`), OG/Twitter tags, and the optional Cloudflare Web Analytics beacon (gated on `PUBLIC_CF_ANALYTICS_TOKEN` + `PROD`).
- `src/lib/jsonld.ts` builds breadcrumb + entity schema.org objects; pass them to `Base.astro` via the `jsonLd` prop.
- Dark mode: Tailwind `darkMode: 'class'`. `public/theme-init.js` sets the class pre-paint and is re-run across Astro view transitions via the `data-astro-rerun` attribute in `Base.astro` — don't remove that attribute.
- Service worker: `public/sw.js` + `public/sw-register.js` provide offline fallback to `public/offline.html`. `public/_headers` serves the SW with `Cache-Control: max-age=0` and hashed `/_astro/*` assets as immutable for a year.

### Path alias & tests
- `~/` resolves to `src/` in both Astro (`tsconfig.json` `paths`) and Vitest (`vitest.config.ts`). Prefer `~/lib/…` over relative imports.
- Tests live alongside source as `*.test.ts` under `src/`, Node environment (no DOM).

### i18n copy
All UI strings live in `src/i18n/fr.json` and `src/i18n/en.json`. Access them with `t(lang, key, params?)` from `src/i18n/utils.ts`; missing keys fall back to English, then to the key itself.

## Content conventions

The site is informational, not medical advice (see `README.md`). `src/components/SafetyNote.astro` renders herb warnings — don't strip them from pages.
