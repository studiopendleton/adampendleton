# Migration Plan

This document tracks the plan to migrate `adampendleton.net` from the current Kirby/PHP site on a DigitalOcean droplet to a static-first site deployed on Cloudflare with Sanity as the CMS.

## Current Baseline

- Production web root on the droplet: `/var/www/adampendleton.net`
- Local server-state backup: `/Users/scozu/Developer/adampendleton-server-copy-2026-06-03`
- Local Kirby content copied into ignored repo paths:
  - `content/`
  - `media/`
- PHP needed for local Kirby baseline testing: `/opt/homebrew/opt/php@8.3/bin/php`
- Local baseline server command:

```sh
/opt/homebrew/opt/php@8.3/bin/php -S localhost:8000 kirby/router.php
```

- Local baseline URL: `http://localhost:8000`
- Verified local routes:
  - `/` returns the real Adam Pendleton homepage.
  - `/image` returns `200 OK`.
  - `/video` returns `404 Not Found` because the copied production content does not include a video page folder.

## Key Decisions

- Rebuild the public site as an Astro static site.
- Use Sanity as the CMS and source of editable content.
- Use Tailwind v4 for build/styling ergonomics, while preserving a small global CSS layer for exact site behavior.
- Use vanilla JavaScript for the public-site interactions unless a framework becomes clearly necessary.
- Deploy via Cloudflare Workers Static Assets from GitHub.
- Make GitHub the canonical code remote instead of a mirror of the droplet.
- Remove PHP and Kirby from the production runtime after cutover.
- Build and test the new app on a temporary Cloudflare domain before moving DNS from GoDaddy to Cloudflare.
- Defer video and image carousel work for the first Astro version because those features are not used on the current live site.

## Behavior To Preserve

- Homepage sticky scroll effect:
  - Each text block has a configurable `min-height`, currently `100vh`.
  - Text inside each block sticks at the top margin while the page scrolls.
  - Header and footer use the same blend/color behavior.
- Site-wide visual settings:
  - Desktop and mobile background images.
  - Background position.
  - Body text color.
  - Link hover background/text color.
  - Desktop font size and mobile font scale.
  - Optional `mix-blend-mode: multiply`.
- Image page:
  - Full-width Flickity carousel behavior.
  - Lazy image loading.
  - Left/right click zones with custom cursors.
  - Keyboard arrow navigation.
  - Mobile hides the desktop click zones.
- Footer:
  - Studio email and Instagram link.
  - Mobile line-break behavior.

## Baseline Capture

- Local Kirby was verified running on PHP `8.3.31` at `http://localhost:8000`.
- Captured baseline artifacts are in `docs/baseline/`:
  - `home-desktop-1440x1000.png`
  - `home-mobile-390x844.png`
  - `home-desktop-scroll-*.png`
  - `home-mobile-scroll-*.png`
  - `image-desktop-1440x1000.png`
  - `image-mobile-390x844.png`
  - `image-*-carousel-*.png`
  - `behavior-report.json`
  - `page@fe6e03e97a894062f8be260256a5678d.webm`
- Sticky behavior inspection confirmed homepage text elements use `position: sticky` with the top offset from `--margin`.
- Desktop `/image` renders `.previous` and `.next` half-screen click zones with SVG cursors.
- Mobile `/image` hides those desktop click zones at the current breakpoint.
- The copied live `/image` content currently renders one carousel cell because only one of the six referenced gallery image filenames exists locally.
- The image carousel baseline is retained for reference only. Rebuild is deferred unless a future content need requires image/gallery functionality.

## Content Inventory Findings

- `content/site.txt` contains the live site settings.
  - `mainText` has 4 visible text blocks and no hidden blocks.
  - `frameHeight` is `100`, producing `100vh` block minimum heights.
  - `footerText` contains the studio email, Instagram link, and `<br class="mobile-break">` markers.
  - Desktop and mobile background images are selected via Kirby file UUID references.
  - Appearance values are `backgroundPosition: top`, `bodyTextColor: rgb(35, 35, 35)`, `backgroundColor: #ffffff`, `fontSize: 3rem`, `mobileFontSize: 0.5`, `blend: true`, and `font: UnicaMedium`.
- `content/home/home.txt` only stores the home page title plus legacy media/autoplay/loop fields; homepage body content is site-level `mainText`.
- `content/image/image.txt` lists 6 gallery image references, but 5 referenced files are missing from the copied `content/image/` folder.
  - Existing active gallery reference: `apn-install-4b-ap_l.jpg`.
  - Missing active gallery references: `21-006_crop_jpg.jpg`, `19-033_ap_max.jpg`, `18-113_ap_jpg.jpg`, `20-039_ap-max.jpg`, `21-057_jpg-2.jpg`.
- `content/image/` contains 51 `.jpg.txt` image metadata files.
  - All 51 have captions.
  - All 51 have a `Work-description` field.
  - 10 contain non-empty work descriptions.
  - Kirby exposes that field in PHP as `work_description()` even though the flat-file label is `Work-description`.

## Sanity Content Model Draft

- `siteSettings` singleton:
  - `mainText[]` as portable text/block content, preserving Kirby block order and link markup.
  - `frameHeight` as a numeric viewport-height value; current live value is `100`.
  - `footerText` as portable text or controlled rich text with explicit mobile break support.
  - `desktopBackgroundImage`
  - `mobileBackgroundImage`
  - `backgroundPosition`
  - `bodyTextColor`
  - `backgroundColor`
  - `fontSize`
  - `mobileFontSize`
  - `blend`
  - `font`
- `imagePage`:
  - `title`
  - `slug`
  - `galleryImages[]` in explicit display order.
  - `navOrder`
- `galleryImage` object:
  - `image`
  - `sourceFilename` for import traceability.
  - `caption` as rich text/Kirbytext-compatible content.
  - `workDescription` as optional rich text/Kirbytext-compatible content; 10 copied image metadata files contain live values.
- `videoPage` if future content requires it:
  - `title`
  - `slug`
  - `videoFile`
  - `autoplay`
  - `loop`

For the first Astro version, `imagePage`, `galleryImage`, and `videoPage` are optional/deferred models. Keep the inventory for future reference, but do not let those features block the homepage/static-site migration.

## Import Plan Refinements

- Import `siteSettings` from `content/site.txt`, not `content/home/home.txt`, for homepage text and visual settings.
- Resolve Kirby file UUID references for desktop and mobile background images before importing to Sanity assets.
- Preserve Kirby `mainText` block order and HTML/Kirbytext link behavior; avoid flattening links into plain text.
- Import image metadata from all `content/image/*.jpg.txt` files into an asset metadata map so captions and work descriptions are not lost.
- Build `imagePage.galleryImages[]` from `content/image/image.txt` display order, but flag missing referenced files during import.
- For the current copied baseline, only `apn-install-4b-ap_l.jpg` can be imported as an active carousel item from `image.txt`; the other five references need either restored source files or a content decision before final migration.
- Keep `workDescription` in the Sanity image object even though most values are empty; live copied content proves the field is used.
- Store `sourceFilename` on imported gallery items to make post-import reconciliation possible.
- First import pass should focus on `siteSettings` only. Defer image/video import until those features are actively designed for the Astro site.

## DNS And Temporary Domain Notes

- DNS inventory is complete.
- The domain is currently hosted in GoDaddy.
- It is acceptable to build and review the new app on a temporary Cloudflare deployment domain before moving DNS records to Cloudflare.
- This does not block scaffolding or implementation.
- Before public cutover, configure production host/canonical URL behavior, Sanity CORS origins, analytics behavior, and any noindex/robots settings so the temporary domain does not become the canonical public URL.

## Astro And Cloudflare Scaffolding Best Practices

- Use Astro as a static site generator for the first version.
- Do not add `@astrojs/cloudflare` at scaffold time because the first version does not need SSR, sessions, server actions, or Cloudflare bindings.
- Deploy the static Astro build to Cloudflare Workers Static Assets, not Cloudflare Pages. Current Astro and Cloudflare docs recommend Workers for new projects.
- Use a minimal `wrangler.jsonc` for the static deployment:

```jsonc
{
  "name": "adampendleton",
  "compatibility_date": "2026-06-04",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

- Add `src/pages/404.astro` so Cloudflare can serve a real custom 404 page with `not_found_handling: "404-page"`.
- Use `bun` for local package management and scripts.
- Use Node `22` for Cloudflare Workers Builds if deploying Astro 6 or newer; Astro 5 requires at least Node `18.17.1`.
- Add Tailwind v4 through Tailwind's Vite plugin. Do not use `@astrojs/tailwind`, which is deprecated for Tailwind v4.
- Keep `src/styles/global.css` as the bridge for exact Kirby behavior, with Tailwind imported first and the site-specific CSS variables/sticky behavior written explicitly.
- Prefer `.astro` components and vanilla browser scripts. Do not add React/Preact/Svelte/Vue unless a specific interaction requires it.
- Keep the first app structure simple:
  - `src/pages/index.astro`
  - `src/pages/404.astro`
  - `src/layouts/BaseLayout.astro`
  - `src/components/`
  - `src/styles/global.css`
  - `src/lib/sanity.ts`
  - `src/sanity/schemaTypes/`
  - `public/fonts/`
  - `public/svg/`
- Use Sanity as build-time data for the first version. Public read-only Sanity config can use public environment variables; only use private tokens if draft/preview or authenticated imports are added.
- Add Sanity CORS origins for local development, the temporary Cloudflare Workers domain, and the final production domain.
- Use environment-specific `PUBLIC_SITE_URL` and noindex/canonical metadata so temporary Cloudflare deployments do not become canonical public URLs.
- If SSR, sessions, image bindings, or Cloudflare runtime APIs become necessary later, add `@astrojs/cloudflare` then and test with the `workerd` runtime before deployment.

## Scaffold Status

- The Kirby/PHP runtime has been removed from the current repo after archiving it separately in `/Users/scozu/Developer/adampendleton-kirby`.
- The current repo now contains a static Astro app scaffold.
- Tailwind v4 is configured through `@tailwindcss/vite`.
- Sanity client code, `siteSettings` schema, and Studio config files are present.
- Sanity project ID is `tftrnrna`; dataset is `production`.
- Local `.env` is configured with the Sanity project/dataset, `PUBLIC_SITE_URL=http://localhost:4321`, and `PUBLIC_NOINDEX=true`.
- Sanity Studio exposes `siteSettings` as a single `Site Settings` document.
- The static fallback homepage content now matches the 4 visible Kirby `mainText` blocks, so the Astro build can mirror the live homepage if Sanity is unavailable.
- Sanity `siteSettings` has been seeded from the Kirby archive with 4 imported homepage HTML blocks, exact imported footer HTML, and the live appearance values.
- Local Sanity CORS origins now include `http://localhost:3333` and `http://localhost:4321`.
- Cloudflare Workers Static Assets is configured with `wrangler.jsonc`.
- Fonts, cursor SVGs, and current homepage background source images were ported from the Kirby archive into `public/`.
- Verification passed:
  - `bun run check`
  - `bun run build`
  - Local Wrangler preview served `/` as `200 OK` and missing routes as `404 Not Found`.
- Sanity CLI is authenticated as `jason@adampendleton.net` via Google and has administrator access to project `tftrnrna`.

## Build And Compare Status

Checked against the live Kirby site on 2026-10-23 (`https://adampendleton.net` and `https://www.adampendleton.net`).

- `www` and the apex serve the same homepage. The only byte difference is Kirby’s obfuscated `mailto:` encoding.
- Public routes today: `/` (homepage), `/image` (still one Flickity cell), `/video` (404), `/panel` (redirects to login). No `robots.txt` or `sitemap.xml`.
- `/image` and `/video` stay out of v1, as planned. The live image page still has a single slide, `apn-install-4b-ap_l.jpg`, captioned “Installation view of ‘Adam Pendleton: Begin Again’ at David Kordansky Gallery, Los Angeles (2020)”.
- Desktop and mobile background JPEGs on the droplet are byte-identical to `public/images/background-desktop.jpg` and `public/images/background-mobile.jpg` (SHA-256 prefixes `22ec4b67886ce8e4` and `ecc8d81c4df4a8f2`). Sanity already has recompressed copies of those same dimensions. No image replacement was required.
- Appearance that still matches June and the live site: `frameHeight` 100, background position `top`, body color `rgb(35, 35, 35)`, hover/selection color `#ffffff`, desktop `3rem`, mobile scale `0.5`, blend multiply.
- The live font is still `UnicaMedium`. A July Studio edit had switched the Sanity document to ABC Monument Grotesk Medium. The seed and published document are set back to Unica Medium so the preview matches the live site. Monument Grotesk stays available in Studio.
- Homepage sticky behavior follows the live CSS: each text block is at least `100vh`, and the paragraph or list inside it sticks at `--margin` (`1.5rem` desktop, `0.75rem` at `1024px` and below). The page matte is black, matching `home.css`. Header and footer use the same multiply blend. The footer is a row pinned to the bottom of a `100vh - margin` frame.
- The static fallback renders `src/sanity/seed/siteSettings.json`, so a build still matches this copy if Sanity is unreachable.
- Preview HTML noindexes unless `PUBLIC_NOINDEX=false`, and the canonical URL defaults to `https://adampendleton.net` so a `workers.dev` host does not become canonical.
- `wrangler.jsonc` publishes Workers Static Assets to `workers.dev` only. It has no custom-domain route.
- Local `wrangler dev` on 2026-10-23 served `/` as `200`, unknown paths as the custom `404`, and `/image` as `404` (still deferred). In Chrome, the preview matched the live homepage text and sticky layout at 1440×1000 and 390×844: four `100vh` frames, the second paragraph stuck at the margin after scrolling, and the mobile footer read “For more information,” / “email the studio.” / blank line / “IG”.

### Copy changes since the June baseline

Live homepage copy was edited on the droplet after the June Kirby archive. Sanity already had the new biography and shortened collections paragraph (published 2026-07-13) but still had the June press list and footer.

1. Biography rewritten. It now leads with “Adam Pendleton is a leading figure in contemporary art,” mentions the Museum of Modern Art and the Hirshhorn, and says a solo exhibition at the Stedelijk Museum in Amsterdam opens in fall 2026. A non-breaking space remains before “exhibition”, and the live sentence ends with a non-breaking space.
2. Collections paragraph shortened to MoMA, Guggenheim, Whitney, the Studio Museum in Harlem, Tate, and the Pinakothek der Moderne.
3. Press list: “Adam Pendleton is Rethinking the Museum” (New York Times, 2021) was replaced by “Adam Pendleton Is Painting the White Cube Black” (`https://www.nytimes.com/2026/09/23/arts/design/adam-pendleton-amsterdam-artist.html`). The Frieze, T Magazine, and Hirshhorn links are unchanged.
4. Footer markup on the live site is `For more information,` plus a mobile-only break, `email the studio`, a second mobile-only break, then a break that is always visible before `IG`. The June import had one mobile break and a space before `IG`.

Not copied into v1, because they do not change the page:

- The Hirshhorn link’s `title` attribute repeats the visible headline.
- On that same link only, Kirby puts the `<br>` inside the `<em>`. The other three links, and this rebuild, put the break before the italic publication name.
- Google Analytics tags on the droplet (`gtag.js?id=UA-147761494-1` configured as `UA-19147768-1`). Leave them off the preview. Decide which property, if either, to restore at cutover.
- `/image` carousel and `/video`.

Re-applying the checked-in seed to the published Sanity document:

```sh
bun run sanity:migrate-pt
```

That script patches `siteSettings` in dataset `production` (project `tftrnrna`). It needs a Sanity CLI login with write access, the same way the June import was run.

## Preview Deploy

Do not attach `adampendleton.net` and do not change DNS.

From a clean shell (so a local `.env` with `PUBLIC_SITE_URL=http://localhost:4321` is overridden):

```sh
bun install
bun run deploy:preview
```

`deploy:preview` builds with `PUBLIC_SITE_URL=https://adampendleton.net` and `PUBLIC_NOINDEX=true`, then runs `wrangler deploy`. Wrangler prints the `workers.dev` URL, which will look like `https://adampendleton.<account-subdomain>.workers.dev`. The first deploy may ask for a Cloudflare login. It does not move DNS.

Local Worker preview, without deploying:

```sh
bun run worker:preview
```

## Next Steps

1. Capture the local Kirby baseline. Done 2026-06-03.
   - Open `http://localhost:8000`.
   - Take desktop and mobile screenshots of the homepage.
   - Record a short scroll capture of the sticky text effect.
   - Capture `/image` carousel behavior on desktop and mobile.

2. Inventory the copied Kirby content. Done 2026-06-03.
   - Review `content/site.txt`.
   - Review `content/home/home.txt`.
   - Review `content/image/image.txt`.
   - Review `content/image/*.jpg.txt`.
   - Confirm whether any `work_description` metadata exists in live content.

3. Inventory current DNS before Cloudflare changes. Done.
   - Record `A`, `AAAA`, `CNAME`, `MX`, `TXT`, SPF, DKIM, DMARC, and subdomain records.
   - Confirm whether `testing.adampendleton.net` should migrate or be retired.

4. Scaffold the replacement app. Done 2026-06-04.
   - Create Astro project structure.
   - Add Tailwind v4 via Tailwind's Vite plugin.
   - Add Sanity schema and queries for site settings/homepage content first.
   - Port fonts, cursor SVGs, and core CSS variables.
   - Add static Cloudflare Workers configuration.

5. Connect Sanity project. Done 2026-06-04.
   - Logged into Sanity CLI with the work profile `jason@adampendleton.net`.
   - Confirmed project `tftrnrna` and dataset `production`.
   - Added local Astro CORS origin `http://localhost:4321`; Studio origin `http://localhost:3333` was already present.
   - Seeded the `siteSettings` singleton from the Kirby archive.

6. Build and compare. Done 2026-10-23.
   - Homepage matches the live site on desktop and mobile, including sticky text, black page matte, Unica Medium, and the current biography, press list, and footer.
   - Compared with the June baseline screenshots for behavior, then with the live site for copy. The biography, collections paragraph, and first press link have changed since June. See “Build And Compare Status”.
   - `/image` and `/video` remain deferred.
   - `bun run check`, `bun run build`, and a local Wrangler preview are the release checks. Keep the droplet live until the `workers.dev` preview is accepted and DNS cutover is verified.

7. Cut over DNS, then retire the droplet. Not started. Jessica’s GoDaddy 2FA is required before anyone can change DNS.
   - Registrar DNS is still delegated to `ns1.mediatemple.net` and `ns2.mediatemple.net` (GoDaddy / Media Temple). Apex and `www` are A records to the droplet `161.35.62.228`. There is no `AAAA` record.
   - Mail must survive the move. MX is Google Workspace (`aspmx.l.google.com` and the `alt` hosts). `google-site-verification=nQ3I7f8aV9YzXRLuY16sLavpixPIvFjDHu_rYD535Jw` is the current TXT record. Re-check SPF, DKIM, and DMARC in the GoDaddy zone before editing, and copy every mail record into Cloudflare.
   - Confirm whether `testing.adampendleton.net` is still in the zone and whether it should move or be removed.
   - Deploy the preview with `bun run deploy:preview` and review that `workers.dev` URL on desktop and mobile. Do this before any DNS edit.
   - In GoDaddy, after Jessica approves the 2FA prompt, either move the nameservers to Cloudflare or replace only the web A/CNAME records. Prefer moving the zone so mail and web stay in one place. Do not change MX until the new zone has the same Google records.
   - Add `adampendleton.net` and `www.adampendleton.net` as Worker custom domains only after the zone answers from Cloudflare. Until then, `wrangler.jsonc` must not list those hostnames.
   - Add the preview `workers.dev` origin and `https://adampendleton.net` to the Sanity CORS list. Studio origins `http://localhost:3333` and `http://localhost:4321` are already there.
   - Production build, only when the domain is ready: `PUBLIC_SITE_URL=https://adampendleton.net PUBLIC_NOINDEX=false bun run build`, then deploy that build. Decide canonical host (`apex` or `www`) and redirect the other.
   - Decide analytics. The droplet loads one Universal Analytics id and configures a different one. Do not copy that pair onto the new site without choosing a current property.
   - After HTTPS, the homepage, and mail all check out on the new host, shut down the DigitalOcean droplet. Leave it running until that check is done.
