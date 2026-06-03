---
name: testing-herb-catalog
description: Test new/changed herb and need entries in the tisanerie catalog end-to-end. Use when verifying additions to src/content/herbs or src/content/needs.
---

# Testing the tisanerie herb catalog

Tisanerie is a static Astro site. Herbs/needs are JSON content collections validated by Zod in `src/content.config.ts`. Adding a herb is just dropping a `src/content/herbs/<slug>.json` file using only the enumerated `benefits`/`properties`/`afflictions` keys (no schema/i18n change needed). The build regenerates all pages.

## Offline checks (fast, no browser)
```bash
npm install
npm run typecheck   # astro check, 0 errors expected
npm run test        # vitest, uses mock data (won't catch content issues)
npm run build       # fails if any JSON breaks the Zod schema
```
After build, confirm pages exist: `dist/fr/plantes/<slug>/index.html` and `dist/en/herbs/<slug>/index.html`.

## Browser testing (dev server)
```bash
npm run dev   # http://localhost:4321/fr/
```
Routes (see `src/i18n/routes.ts`): herbs = `/fr/plantes/<slug>/` ↔ `/en/herbs/<slug>/`; needs = `/fr/besoins/<needId>/` ↔ `/en/needs/<needId>/`. Slugs are the JSON filename; need IDs are the need filename (e.g. `mood`).

Primary flow to prove a new herb works:
1. **Bilingual page**: visit the herb page in FR, use the in-header locale switcher (🌐) to confirm EN renders. Check name, scientific, description, brewing params, and warning all localize.
2. **Fuzzy search**: the search box is on the HOME page (`/fr/`), NOT on `/fr/recherche/` (that page is the recommendations results and needs a `?need=` query). Type the herb name; it should appear linking to its page. Search index = `src/lib/searchItems.ts`.
3. **Matcher / need page**: on the home page, click a "Par besoin" button matching the herb's benefit, then click "Trouver mes tisanes →" (goes to `/fr/recherche/?need=<id>`). The herb should appear with "Correspondance · 2" for a primaryBenefit or "· 1" for a benefit (`src/lib/matcher.ts`: 2 pts primary, 1 pt benefit).

## Gotchas
- Clicking a "Par besoin" button toggles selection — clicking the same button twice deselects it. Select once, then click the separate "Trouver mes tisanes" button.
- Browser address-bar navigation can be unreliable in the test harness; prefer clicking in-page links (e.g. the Tisanerie logo to go home).
- `npm run test` uses mock fixtures, so it will NOT catch a bad enum key in a new herb — rely on `npm run build` for content validation.

## Devin Secrets Needed
- None. Fully static local site; no login or credentials required.
