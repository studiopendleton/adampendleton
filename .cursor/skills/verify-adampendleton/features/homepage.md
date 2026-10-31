# Homepage

The homepage shows the published studio text, press links, and footer on the background image.

## Sub-features

- `home-copy` shows the published biography, not the static fallback.
- `home-press` shows each press link as a paragraph inside a list item.
- `home-footer` hides two line breaks on desktop and keeps one before the Instagram link.

## How to get to it (user POV)

- Open `/`.

## Driving it with verify-preview

Preconditions:

- The preview server is healthy at `http://127.0.0.1:8787`.
- `dist/index.html` was built with `PUBLIC_NOINDEX=true`.

- **Open the homepage.** Request `/`. Run `PREVIEW_ORIGIN=http://127.0.0.1:8787 bun run verify:preview`. The report check `homepage status` is ok and the body contains `leading figure`.
- **Confirm published copy.** The same report check `cms copy` is ok. The body contains `leading figure`.
- **Confirm press markup.** The report check `press list` is ok. The body contains `<li><p><a href="https://www.nytimes.com/`.
- **Confirm the footer.** The report check `mobile breaks` is ok with count 2.

## Gotchas

- A production build fails if Sanity is unreachable, so the preview always serves fetched copy. A dev server falls back to the static copy in `src/lib/siteSettings.ts` instead.
- `cms copy` matches the published biography. If editors rewrite its opening, update the check in `scripts/verify-preview.mjs`.
- `bun run test` is the proof for a bad background image. The published homepage does not exercise that branch.
