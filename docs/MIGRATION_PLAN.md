# Migration Plan

This document covers the move of `adampendleton.net` from a Kirby/PHP site on a DigitalOcean droplet to a static Astro site on Cloudflare, with Sanity as the CMS.

## Status

**The site is migrated and live.** Checked 2026-10-31:

- `adampendleton.net` and `www.adampendleton.net` resolve to Cloudflare (nameservers `terry`/`veronica.ns.cloudflare.com`) and serve the Astro build (`generator: Astro v6.4.4`).
- Production is indexable (`robots.txt` is `Allow: /`, with no `X-Robots-Tag` header). The canonical URL is `https://adampendleton.net/` on both hosts.
- The homepage shows the current published Sanity copy in ABC Monument Grotesk Medium (500), with background images from the Sanity CDN.
- `/image` and `/panel` return 404.
- Google Workspace mail records are in the Cloudflare zone: MX `aspmx.l.google.com` and the `alt1`–`alt4` hosts, SPF `include:_spf.google.com`, DMARC `p=none`, and the Google site-verification TXT.
- Cloudflare Workers Builds deploys the `adampendleton` worker on every push to `master`. The latest build, for `61f458f`, passed on 2026-10-27. The Sanity webhook `cloudflare-rebuild`, created 2026-10-27, triggers the same build on publish. Its two most recent deliveries (2026-10-28) returned 200.
- `bun run test` (8/8), `bun run check` (0 errors), and `bun run build` pass on `master`.

## Open Items

1. **Retire the droplet.** `161.35.62.228` still runs nginx and redirects `Host: adampendleton.net`. Once mail and HTTPS have been confirmed on Cloudflare, take a final backup and shut it down.
2. **`testing.adampendleton.net`.** It still resolves through Cloudflare and serves an HTML page. Decide whether to remove it.
3. **`www` vs apex.** `www` serves the site with status 200 and an apex canonical instead of redirecting. Add a Cloudflare redirect rule if a single host is wanted.
4. **Stale seed and fallback.** `src/sanity/seed/siteSettings.json` and `fallbackSiteSettings` in `src/lib/siteSettings.ts` still hold the June copy and font weight 400. Running `bun run sanity:migrate-pt` would overwrite the live copy. Refresh both from the published document, or remove the migration script.
5. **Analytics.** The Kirby site loaded mismatched Universal Analytics IDs (`UA-147761494-1` / `UA-19147768-1`). The new site has no analytics. Pick a current property if analytics are still wanted.
6. **Sanity CORS.** Make sure `https://adampendleton.net` and the preview `workers.dev` origin are allowed if any browser-side Sanity access is added. The current site only reads Sanity at build time, so nothing needs it today.
7. **Cleanup.**
   - Unused Kirby fonts and `public/fonts/fonts.css` are still in `public/`.
   - `public/svg/previous.svg` and `next.svg` (the carousel cursors) aren't used.
   - The remote branch `cursor/live-homepage-parity-a981` was never merged. Its copy changes are already in Sanity, and its code (a `SiteFooter` component, a fallback built from the seed JSON) branches from before PR #1. Rebase it or delete it.

## What Changed From The Kirby Site

- The homepage keeps the sticky-block behavior: each block is at least `frameHeight` vh, and its text sticks at `--margin`. It also keeps the multiply blend, background images, and mobile line breaks.
- The font changed from Unica Medium to ABC Monument Grotesk Medium. Unica is still available in Studio.
- The `/image` Flickity carousel, `/video`, and the Kirby Panel were dropped. They weren't in use.
- Google Analytics was not carried over.
- Live copy changed in the months after the June archive: the biography now opens with “a leading figure in contemporary art”, the collections paragraph is shorter, and the first press link is now the 2026 NYT “Painting the White Cube Black” piece. Sanity holds the current text.

## Timeline

- 2026-06-03: Captured a Kirby baseline locally (PHP 8.3) and inventoried the content.
- 2026-06-04: Set up Astro, Tailwind v4, and Workers Static Assets. Connected Sanity project `tftrnrna`/`production` and seeded `siteSettings` from Kirby.
- 2026-07-13: Moved the site from Kirby to Astro + Sanity in this repo. Homepage copy moved to Portable Text. Added Monument Grotesk and the Studio weight picker (PR #1).
- 2026-10-23: Compared against the live Kirby site. Copy differences were applied in Sanity.
- 2026-10-27: Connected Workers Builds to GitHub and added the Sanity `cloudflare-rebuild` webhook. Set the production canonical URL and noindex preview handling, added the verification skill (PR #3), and added the black favicon (PR #4).
- By 2026-10-31: DNS moved to Cloudflare and production is served by the `adampendleton` worker.

## Historical Reference

### Kirby Source

- Archived site: `/Users/scozu/Developer/adampendleton-kirby`
- Server-state backup: `/Users/scozu/Developer/adampendleton-server-copy-2026-06-03`
- Droplet web root: `/var/www/adampendleton.net`
- Baseline screenshots, scroll video, and behavior report: `docs/baseline/` (see its README)

### Kirby Content Inventory (June 2026)

- `content/site.txt` held the homepage: 4 `mainText` blocks, `frameHeight: 100`, footer with `<br class="mobile-break">`, and the appearance values `top`, `rgb(35, 35, 35)`, `#ffffff`, `3rem`, `0.5`, blend on, `UnicaMedium`.
- `content/home/home.txt` held only a title and legacy media fields.
- `content/image/image.txt` listed 6 gallery images. Only `apn-install-4b-ap_l.jpg` existed. The other five were missing: `21-006_crop_jpg.jpg`, `19-033_ap_max.jpg`, `18-113_ap_jpg.jpg`, `20-039_ap-max.jpg`, `21-057_jpg-2.jpg`.
- `content/image/` had 51 `.jpg.txt` metadata files, all with captions. 10 had non-empty `Work-description` values.

### Model For Rebuilding The Image Or Video Page

If `/image` or `/video` comes back, the draft model was:

- `imagePage`: `title`, `slug`, `galleryImages[]` in display order, `navOrder`.
- `galleryImage`: `image`, `sourceFilename`, `caption`, `workDescription`.
- `videoPage`: `title`, `slug`, `videoFile`, `autoplay`, `loop`.

Baseline behavior to match: a full-width carousel, lazy-loaded images, half-screen previous/next click zones with the SVG cursors (hidden at `1024px` and below), and arrow-key navigation. Import captions and work descriptions from the Kirby `.jpg.txt` files, and resolve the missing gallery files first.
