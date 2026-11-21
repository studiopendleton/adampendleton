# Not found

An unknown path returns the 404 page. The old `/image` route is not part of this site.

## Sub-features

- `missing-page` shows `Page not found` with status 404.
- `dropped-image` also returns 404 for `/image`.

## How to get to it (user POV)

- Open any path other than `/` or `/robots.txt`, including `/missing-page` and `/image`.

## Driving it with verify-preview

Preconditions:

- The preview server is healthy at `http://127.0.0.1:8787`.
- `wrangler.preview.jsonc` sets `not_found_handling` to `404-page`.

- **Open an unknown path.** Request `/missing-page`. Run `PREVIEW_ORIGIN=http://127.0.0.1:8787 bun run verify:preview`. The report checks `missing status` and `missing copy` are ok.
- **Open the dropped image route.** Request `/image` with curl. Status is 404 and the body contains `Page not found`. The checker does not request `/image`. Record that curl beside the report.

## Gotchas

- Do not add an `/image` page to make this check pass.
- `astro preview` does not apply `dist/_headers`. Use `wrangler dev` with `wrangler.preview.jsonc`.
