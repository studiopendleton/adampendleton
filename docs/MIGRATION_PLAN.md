# Migration Plan

This document covers the move of `adampendleton.net` from a Kirby/PHP site on a DigitalOcean droplet to a static Astro site on Cloudflare, with Sanity as the CMS.

## Status

**The site is migrated and live.** This repo, the Sanity `production` dataset, and the Cloudflare `adampendleton` worker are the source of truth. Checked 2026-10-31:

- `adampendleton.net` and `www.adampendleton.net` resolve to Cloudflare (nameservers `terry`/`veronica.ns.cloudflare.com`) and serve the Astro build.
- Production is indexable (`robots.txt` is `Allow: /`, with no `X-Robots-Tag` header). The canonical URL is `https://adampendleton.net/` on both hosts.
- The homepage shows the published Sanity copy in ABC Monument Grotesk Medium (500), with background images from the Sanity CDN.
- Google Workspace mail records are in the Cloudflare zone: MX `aspmx.l.google.com` and the `alt1`–`alt4` hosts, SPF `include:_spf.google.com`, DMARC `p=none`, and the Google site-verification TXT. Mail never went through the droplet.
- Cloudflare Workers Builds deploys on every push to `master`. The Sanity webhook `cloudflare-rebuild` triggers the same build on publish.
- `bun run test`, `bun run check`, and `bun run build` pass.

## Shutting Down The DigitalOcean Droplet

The droplet (`161.35.62.228`) still runs nginx and the Kirby site. Do these in order:

1. **Delete the wildcard DNS record in Cloudflare.** `*.adampendleton.net` still routes every subdomain except `www` (`testing.`, `staging.`, any random name) through Cloudflare to the droplet. Those subdomains serve the old Kirby homepage in Unica, and `/panel` serves the Kirby login. Delete the `*` record and any record that names `testing` or points at `161.35.62.228`. Then check that `https://testing.adampendleton.net/` stops responding. Keep the apex, `www`, MX, and TXT records.
2. **Take a final backup.** Kirby code is in this repo's git history (up to `c05c14b`), but `content/` and `media/` were never committed. That includes the 51 image captions and work descriptions. The local archives the June notes mention (`~/Developer/adampendleton-kirby`, `~/Developer/adampendleton-server-copy-2026-06-03`) are not on this machine. Take a DigitalOcean snapshot, or `rsync` `/var/www/adampendleton.net` somewhere durable.
3. **Check for other users of the droplet.** Look in `/etc/nginx/sites-enabled`, the crontab, and the DigitalOcean firewall/floating IPs for anything besides `adampendleton.net`.
4. **Power off, wait, then destroy.** Power the droplet off first. After a week with no breakage, destroy it and delete the snapshot when it's no longer needed.

## Other Open Items

- **`www` vs apex.** `www` serves the site with status 200 and an apex canonical instead of redirecting. Add a Cloudflare redirect rule if a single host is wanted.
- **Analytics.** The Kirby site loaded mismatched Universal Analytics IDs (`UA-147761494-1` / `UA-19147768-1`). The new site has no analytics. Pick a current property if analytics are still wanted.
- **Sanity CORS.** Only needed if browser-side Sanity access is added. The site reads Sanity at build time.

## What Changed From The Kirby Site

- The homepage keeps the sticky-block behavior: each block is at least `frameHeight` vh, and its text sticks at `--margin`. It also keeps the multiply blend, background images, and mobile line breaks.
- The font changed from Unica Medium to ABC Monument Grotesk Medium. Unica is still available in Studio.
- The `/image` Flickity carousel, `/video`, and the Kirby Panel were dropped. They weren't in use.
- Google Analytics was not carried over.
- Copy edited on the droplet after June was moved into Sanity. Sanity holds the current text.

## Timeline

- 2026-06-03: Captured a Kirby baseline locally and inventoried the content.
- 2026-06-04: Set up Astro, Tailwind v4, and Workers Static Assets. Connected Sanity project `tftrnrna`/`production` and seeded `siteSettings` from Kirby.
- 2026-07-13: Moved the site from Kirby to Astro + Sanity in this repo. Homepage copy moved to Portable Text. Added Monument Grotesk and the Studio weight picker (PR #1).
- 2026-10-23: Compared against the live Kirby site. Copy differences were applied in Sanity.
- 2026-10-27: Connected Workers Builds to GitHub and added the Sanity `cloudflare-rebuild` webhook. Set the production canonical URL and noindex preview handling, added the verification skill (PR #3), and added the black favicon (PR #4).
- By 2026-10-31: DNS moved to Cloudflare and production is served by the `adampendleton` worker.
- 2026-10-31: Removed migration-era leftovers:
  - the one-time Sanity seed and its import scripts
  - unused Kirby fonts and carousel cursors
  - the June baseline captures, which remain in git history
  - stale branches

  Refreshed the static fallback from the published document. Production builds now fail rather than publish the fallback when Sanity is unreachable.

## Historical Reference

### Kirby Content Inventory (June 2026)

- `content/site.txt` held the homepage: 4 `mainText` blocks, `frameHeight: 100`, footer with `<br class="mobile-break">`, and the appearance values `top`, `rgb(35, 35, 35)`, `#ffffff`, `3rem`, `0.5`, blend on, `UnicaMedium`.
- `content/image/image.txt` listed 6 gallery images. Only `apn-install-4b-ap_l.jpg` existed in the June copy.
- `content/image/` had 51 `.jpg.txt` metadata files, all with captions. 10 had non-empty `Work-description` values.

### Model For Rebuilding The Image Or Video Page

If `/image` or `/video` comes back, the draft model was:

- `imagePage`: `title`, `slug`, `galleryImages[]` in display order, `navOrder`.
- `galleryImage`: `image`, `sourceFilename`, `caption`, `workDescription`.
- `videoPage`: `title`, `slug`, `videoFile`, `autoplay`, `loop`.

The old behavior was a full-width carousel, lazy-loaded images, half-screen previous/next click zones with custom cursors (hidden at `1024px` and below), and arrow-key navigation. The source content is in the droplet backup from step 2 above. The June screenshots are in git history under `docs/baseline/` (removed after `05fb2cb`).
