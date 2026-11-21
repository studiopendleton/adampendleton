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

- **Open the homepage.** Request `/`. Run `PREVIEW_ORIGIN=http://127.0.0.1:8787 bun run verify:preview`. The report check `homepage status` is ok.
- **Confirm published copy.** The report check `text block` is ok. The body has at least one paragraph with text.
- **Confirm press markup.** The report checks `press links` and `press hrefs` are ok. Every press link href starts with `http`.
- **Confirm the footer.** Run `bun run test`. The footer mobile-break cases are covered there, not by `verify:preview`.

## Gotchas

- A production build fails if Sanity is unreachable, so the preview always serves fetched copy. A dev server falls back to the static copy in `src/lib/siteSettings.ts` instead.
- The checks are structural, so editing the Sanity copy does not need a script change.
- `bun run test` is the proof for a bad background image and the footer line breaks. The published homepage does not exercise those branches.
