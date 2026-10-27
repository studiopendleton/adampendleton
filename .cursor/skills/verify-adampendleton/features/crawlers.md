# Crawler policy

The preview tells crawlers not to index it, and every page's canonical URL stays on `https://adampendleton.net`.

## Sub-features

- `canonical-home` points `/` at `https://adampendleton.net/`.
- `robots-header` sends `X-Robots-Tag: noindex` on HTML responses.
- `robots-file` serves `Disallow: /`.

## How to get to it (user POV)

- Open `/` and view the page source.
- Open `/robots.txt`.
- Open `/missing-page` and view the response headers.

## Driving it with verify-preview

Preconditions:

- The preview was built with `PUBLIC_SITE_URL=https://adampendleton.net` and `PUBLIC_NOINDEX=true`.
- The server is `wrangler dev --config wrangler.preview.jsonc` on `http://127.0.0.1:8787`.

- **Read the homepage head.** Run `PREVIEW_ORIGIN=http://127.0.0.1:8787 bun run verify:preview`. The report checks `canonical` and `robots meta` are ok.
- **Read the response header.** The report check `robots header` is ok and the detail contains `noindex`.
- **Read robots.txt.** The report checks `robots.txt status` and `robots.txt disallow` are ok.
- **Read the 404 header.** The report checks `missing robots header` and `missing canonical host` are ok.

## Gotchas

- A build without `PUBLIC_NOINDEX=true` serves `Allow: /` and no `X-Robots-Tag`. That build is not this preview.
- Unset `PUBLIC_SITE_URL` still canonicalizes to `https://adampendleton.net`. `http://localhost` in a built page means the helper regressed.
- Do not attach `adampendleton.net` to the worker to make the host match. The canonical URL is a tag, not the request host.
