---
name: scaffold-herb
description: Scaffold a new herb (or need) entry in the tisanerie catalog — JSON content file, any new property/affliction/benefit enum key in BOTH schema locations, and fr+en translations — so `npm run build` and `npm run test` pass first try. Use when adding a plant or need to src/content.
---

# Scaffold a tisanerie herb or need

Herbs/needs are Zod-validated JSON content collections. Adding one is dropping a JSON file —
but a property/affliction/benefit key that isn't enumerated, or that lacks fr+en copy, fails
the build or `src/content/content.test.ts`. This skill produces an entry that passes first run.

## New herb
1. **Create** `src/content/herbs/<slug>.json` (slug = lowercase-hyphenated, becomes the URL and
   the blend-reference id). Shape (see `src/content.config.ts`):
   - `name`/`description`: `{ fr, en }`; `scientific`: string.
   - `benefits`: ≥1 from the `benefitKey` enum. `primaryBenefits`: MUST be a subset of
     `benefits` (enforced by content.test.ts).
   - `properties` / `afflictions`: from their enums; every key used needs `property.<key>` /
     `affliction.<key>` in BOTH i18n files.
   - `flavor`: `{ fr:[…], en:[…] }`; `part`: leaves|flowers|roots|bark|seeds|fruit|aerial.
   - `brewing`: `{ temperatureC 50–100 int, timeMin 1–30, gramsPerCup 0.5–10 }`.
   - optional `warnings:{fr,en}`, `emoji`, `image`, `popularity` 0–100.

2. **If you introduce a NEW enum key** (benefit/property/affliction), add it in BOTH places —
   they are duplicated and nothing guards the drift:
   - `src/content.config.ts` (the live Zod enum — gates `npm run build`), AND
   - `src/content/content.test.ts` (the recreated enum — gates `npm run test`; it avoids
     importing `astro:content`).
   Then add `property.<key>` / `affliction.<key>` to `src/i18n/fr.json` AND `src/i18n/en.json`
   (key sets must match exactly — parity is tested).

3. **Verify** (all must pass):
   ```bash
   npm run test     # schema, primaryBenefits⊆benefits, fr+en parity, blend refs
   npm run build    # astro Zod schema + page generation
   ```
   Confirm `dist/fr/plantes/<slug>/index.html` and `dist/en/herbs/<slug>/index.html` exist.

## New need
`src/content/needs/<id>.json`: `name/short/description:{fr,en}`, exactly one `benefit` (must be
served by ≥1 herb — tested), optional `related`, `safety:{fr,en}`, and `blends[]` where every
`herbs[]` ref is an existing herb slug (tested). Mirror brewing guidance in both languages.

## Reminder
A new enum key you forget to add to `content.test.ts` makes the schema and test disagree
silently — keep the two enum copies identical.
