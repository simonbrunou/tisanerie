# Tisanerie

A small, beautiful web app that recommends herbal infusions (tisanes) based on
what you need — stress, sleep, digestion, cold, focus, and more. Bilingual
(French / English), mobile-friendly, and self-hosted on Coolify.

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

### Coolify (self-hosted)

The repository ships a multi-stage `Dockerfile` (Node 24 builder → Caddy 2
runner) and a `Caddyfile` that encodes the locale-prefix redirects, security
headers, and long-cache rules for hashed assets.

In Coolify, create a new application from the GitHub repository:

- Build pack: **Dockerfile**
- Port: **80**
- Health-check path: `/fr/`
- Environment variables (optional):
  - `PUBLIC_CF_ANALYTICS_TOKEN` — Cloudflare Web Analytics beacon token.
    Leave unset to omit the beacon entirely. The CSP in `Caddyfile` already
    whitelists `static.cloudflareinsights.com`, so toggling the token does
    not require a config change.

Public traffic reaches the container via a **Cloudflare Tunnel**, not a
publicly exposed port. `cloudflared` runs on the host (or as a sibling
container) and connects outbound to Cloudflare's edge; the tunnel's public
hostname is pointed at `http://<coolify-service-host>:80`. TLS therefore
terminates at Cloudflare's edge, the origin speaks plain HTTP, and the
container's port 80 only needs to be reachable from `cloudflared` on the
Docker network — it does **not** need to be exposed on the public internet.

Caddy still emits `Strict-Transport-Security`; Cloudflare passes it through
unchanged. If you want client IPs in Caddy's access log to reflect the real
visitor (via `CF-Connecting-IP`) rather than the `cloudflared` peer, add a
`servers { trusted_proxies static <cloudflared-ip>/32 }` block to the
`Caddyfile`.

To build the image locally:

```bash
docker build -t tisanerie .
docker run --rm -p 8080:80 tisanerie  # http://localhost:8080/fr/
```

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
