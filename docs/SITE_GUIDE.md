# Site Guide

`adampendleton.net` is a static Astro site. Pages are built once from Sanity content and served by Cloudflare Workers Static Assets. There is no server code, login, or client-side JavaScript on the public site.

## Routes

- `/`: `src/pages/index.astro`. The homepage text blocks and footer.
- `/robots.txt`: `src/pages/robots.txt.ts`. `Allow: /` normally, `Disallow: /` when `PUBLIC_NOINDEX=true`.
- Any other path: `src/pages/404.astro`, served with status 404 through `not_found_handling: "404-page"` in the Wrangler config.

The old Kirby `/image` carousel and `/video` pages were not rebuilt. `/image` returns 404 on purpose.

## Rendering Flow

1. `astro build` runs each page.
2. `getSiteSettings()` in `src/lib/siteSettings.ts` fetches the `siteSettings` document with the GROQ query in `src/lib/queries.ts`.
3. `toSiteSettings()` converts it into plain values. Portable Text becomes HTML (see "Portable Text Rendering"). Background images become Sanity CDN URLs through `src/lib/image.ts`.
4. `src/layouts/BaseLayout.astro` writes the appearance settings as CSS custom properties on `<html>`, and adds the canonical URL, robots meta, and favicons.
5. `src/styles/global.css` does the layout: fonts, sticky text blocks, footer, and the mobile breakpoint at `1024px`.
6. After the build, the `noindex-headers` integration in `astro.config.mjs` writes `dist/_headers` with `X-Robots-Tag: noindex` when `PUBLIC_NOINDEX=true`.

### Fallbacks

If Sanity can't be reached, or a field is empty, the build uses `fallbackSiteSettings` in `src/lib/siteSettings.ts` and the images in `public/images/`. Each field falls back separately, so a bad background image doesn't throw away CMS copy. `src/lib/siteSettings.test.mjs` covers this.

The fallback copy is the June 2026 Kirby text (“a central figure…”), not the current published copy (“a leading figure…”). A build that silently falls back will show outdated text. The `cms copy` check in `scripts/verify-preview.mjs` exists to catch that.

## Sanity

- Studio config: `sanity.config.ts` and `sanity.cli.ts`. Studio app ID `jxttu1qo1entgmzakeh2x575`, deployed with `bun run sanity:deploy`.
- Schema: `src/sanity/schemaTypes/siteSettings.ts`. A single document, ID `siteSettings`, shown in Studio as **Homepage** (`src/sanity/structure/index.ts`).
- Fields:
  - Content: `title`, `mainText[]` (each item holds a Portable Text `content` array), `footerText` (Portable Text).
  - Appearance: `frameHeight`, desktop/mobile background images, `backgroundPosition`, `bodyTextColor`, `backgroundColor`, `fontSize`, `mobileFontSize`, `blend`, `font`, `fontWeight`.
- `font` must be a family registered with `@font-face` in `global.css`: `ABCMonumentGrotesk`, `UnicaMedium`, or `Unica`. `fontWeight` (400/500/700) only appears for Monument Grotesk. Production uses Monument Grotesk 500.
- Generated types are in `sanity.types.ts`. Regenerate them with `bun run sanity:typegen` after schema changes.
- Content is read at build time with `useCdn: false`. Publishing in Studio fires the `cloudflare-rebuild` webhook, which rebuilds and deploys the site (see "Deployment").

### Portable Text Rendering

`portableTextToHtml()` in `src/lib/siteSettings.ts` matches the old Kirby markup:

- List items render as `<li><p>…</p></li>`. Press links rely on this.
- External links get `target="_blank" rel="noreferrer"`.
- A `\n` span whose `_key` contains `mobile` renders as `<br class="mobile-break">`, which only shows at `1024px` and below. Any other `\n` is a normal `<br>`. The footer depends on this key convention, so keep the keys when editing footer breaks.

### Scripts

- `scripts/upload-background-images.ts` (`bun run sanity:upload-backgrounds`) uploads `public/images/background-*.jpg` to Sanity and sets both image fields.
- `scripts/migrate-site-settings-pt.ts` (`bun run sanity:migrate-pt`) overwrites the published `siteSettings` copy and appearance with `src/sanity/seed/siteSettings.json`.

**Do not run `sanity:migrate-pt` as-is.** The seed still holds the June copy. Running it would overwrite the live biography, collections, press list, and footer with outdated text. Update the seed from the published document first, or retire the script.

## Making Changes

- Page text, press links, footer, colors, sizes, font, background images: edit in Studio and publish. The webhook rebuilds the site, and the change is live a few minutes later.
- Layout, sticky behavior, breakpoints, link styles: `src/styles/global.css`.
- `<head>`, CSS variables, favicons: `src/layouts/BaseLayout.astro`.
- Homepage markup: `src/pages/index.astro`.
- New editable field: add it to the schema, the GROQ query, `RawSettings`/`SiteSettings`/`toSiteSettings`, and the fallback, then run `sanity:typegen` and `sanity:schema-deploy`.
- New font: add the file to `public/fonts/`, add an `@font-face` in `global.css`, and add it to `registeredFonts` in the schema.

`public/fonts/` also holds unused fonts left over from Kirby (Grotesque MT, Recta, Univers, Venus, Gerstner, Lars, Folio) and a `fonts.css` that nothing loads.

## Deployment

Production is deployed by **Cloudflare Workers Builds**. The `adampendleton` worker is connected to the GitHub repo `studiopendleton/adampendleton`:

- A push or merge to `master` builds the site and deploys it to production.
- Each build reports back to GitHub as the `Workers Builds: adampendleton` check, which links to the build log in the Cloudflare dashboard.
- The build command, deploy command, environment variables, and custom domains (`adampendleton.net`, `www`) are all set in the dashboard. None of them are in this repo, and there is no GitHub Actions workflow.
- Sanity is read during the build, so Sanity changes also trigger a build. The Sanity webhook `cloudflare-rebuild` (dataset `production`, document create/update/delete, drafts excluded, no filter) sends a `POST` to a Workers Builds deploy hook. Publishing in Studio rebuilds and deploys production with no further steps. Check it with `bunx sanity hook list` and `bunx sanity hook logs cloudflare-rebuild`.

Two Workers Static Assets configs serve `dist/`:

| Config | Worker | Deployed by | Use |
| --- | --- | --- | --- |
| `wrangler.jsonc` | `adampendleton` | Workers Builds on push to `master` or Sanity publish, or `bun run deploy` by hand | Production |
| `wrangler.preview.jsonc` | `adampendleton-preview` | `bun run deploy:preview` by hand | `workers.dev` preview built with `PUBLIC_NOINDEX=true` and a production canonical URL |

Rules:

- Production builds must not have `PUBLIC_NOINDEX=true`. For a manual `bun run deploy`, check for a local `.env` first.
- Canonical URLs always point at `PUBLIC_SITE_URL`, which defaults to `https://adampendleton.net`, so preview hosts never become canonical.
- `astro preview` ignores `dist/_headers`. Use `bun run worker:preview` (`wrangler dev`) to see real headers locally.

## Verification

`.cursor/skills/verify-adampendleton/` is the runbook for checking a preview build. It builds with noindex, serves it with `wrangler dev --config wrangler.preview.jsonc` on `127.0.0.1:8787`, and runs:

```sh
bun run test
PREVIEW_ORIGIN=http://127.0.0.1:8787 bun run verify:preview
```

`verify:preview` checks the homepage status, canonical URL, robots meta/header, published copy, press-list markup, two mobile breaks, `robots.txt`, and the 404 page. It writes `artifacts/verify/preview-report.json`, which git ignores. It expects noindex, so it fails against production on purpose.
