# Adam Pendleton

Static Astro site for `adampendleton.net`, with homepage content edited in Sanity. It replaced the Kirby/PHP site, which is archived at `/Users/scozu/Developer/adampendleton-kirby`.

The site is live on Cloudflare. See `docs/SITE_GUIDE.md` for how it works and `docs/MIGRATION_PLAN.md` for migration history and open items.

## Stack

- Astro static output (no SSR adapter)
- Tailwind v4 via the Tailwind Vite plugin, plus hand-written CSS in `src/styles/global.css`
- Sanity for editable content, read at build time (project `tftrnrna`, dataset `production`)
- Cloudflare Workers Static Assets
- Bun for package management (Node `>=22.12`)

## Development

```sh
bun install
bun run dev          # Astro on http://localhost:4321
bun run sanity:dev   # Studio on http://localhost:3333
```

## Checks

```sh
bun run test    # unit tests for settings mapping and crawler policy
bun run check   # astro check
bun run build
```

## Deploy

Production deploys run on Cloudflare Workers Builds. The `adampendleton` worker is connected to `studiopendleton/adampendleton`, and every push to `master` builds and deploys it. Results show up as the `Workers Builds: adampendleton` check on the commit. Build settings and environment variables live in the Cloudflare dashboard, not in this repo.

Sanity content is read at build time. The Sanity webhook `cloudflare-rebuild` calls a Workers Builds deploy hook whenever a document in `production` is published or deleted, so Studio publishes go live without a push.

Manual deploys from a laptop are a fallback:

```sh
bun run deploy           # production worker "adampendleton"
bun run deploy:preview   # noindex worker "adampendleton-preview" on workers.dev
```

A manual production deploy must be built with `PUBLIC_NOINDEX` unset or `false`. Astro reads `.env`, so a local `.env` copied from `.env.example` (which sets `PUBLIC_NOINDEX=true`) will ship a noindexed production site.

## Environment

Copy `.env.example` to `.env` for local values. Every variable has a working default in code, so `.env` is optional. Do not commit private tokens.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PUBLIC_SITE_URL` | `https://adampendleton.net` | Origin used for canonical URLs |
| `PUBLIC_NOINDEX` | unset (indexable) | `true` adds noindex meta, `X-Robots-Tag`, and `Disallow: /` |
| `PUBLIC_SANITY_PROJECT_ID` / `PUBLIC_SANITY_DATASET` / `PUBLIC_SANITY_API_VERSION` | `tftrnrna` / `production` / `2026-06-04` | Build-time Sanity client |
| `SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET` | `tftrnrna` / `production` | Studio and Sanity CLI |
