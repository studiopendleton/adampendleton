---
name: verify-adampendleton
description: Drive the adampendleton static site the way a visitor does. Use to prove the homepage, the 404 page, canonical URLs, and the noindex workers.dev preview.
disable-model-invocation: true
---

# Verify adampendleton

The site is a static homepage and a 404 page. Sanity is read at build time. There is no login and no client-side editor.

## Launch

Build the noindex preview, then serve that build with Wrangler on loopback. Do not pass `--remote`, `--route`, or a custom domain.

```bash
PUBLIC_SITE_URL=https://adampendleton.net PUBLIC_NOINDEX=true bun run build
mkdir -p artifacts/verify
bunx wrangler dev --config wrangler.preview.jsonc --port 8787 --ip 127.0.0.1 --local --show-interactive-dev-session false > artifacts/verify/server.log 2>&1 &
echo $! > artifacts/verify/server.pid
```

Ready when `curl -fsS -o /dev/null -w '%{http_code}' http://127.0.0.1:8787/` prints `200`. If it stays down, read `artifacts/verify/server.log`.

`wrangler.preview.jsonc` names the worker `adampendleton-preview` and has no routes. Do not deploy from this skill. Do not switch the config to `wrangler.jsonc`.

## Doctor

Run this before a drive when the server looks wrong.

```bash
curl -sI http://127.0.0.1:8787/
```

The process in `artifacts/verify/server.pid` must be the listener on port 8787. The response must include `X-Robots-Tag: noindex`. `dist/index.html` must contain `https://adampendleton.net/` and must not contain `http://localhost`. If the header is missing, the dist directory is from a build that did not set `PUBLIC_NOINDEX=true`. Rebuild. Do not point the checker at a different port.

## Drive

`scripts/verify-preview.mjs` fetches the running site. It does not start a server and it does not deploy.

```bash
bun run test
PREVIEW_ORIGIN=http://127.0.0.1:8787 bun run verify:preview
```

`bun run test` proves the fallback branches the published homepage does not hit. A bad image keeps CMS copy, press links render as `<li><p>`, and every mobile break key stays mobile-only. `verify:preview` proves the served homepage, the crawler policy, and the 404 page.

Open `/` for the homepage. Open `/missing-page` for the 404 page. Open `/robots.txt` for the crawler file. There is no `/image` route. A 404 there is expected.

## Evidence

`artifacts/verify/preview-report.json` records each check, the origin, and whether the run passed. The homepage proof is the status, the canonical href `https://adampendleton.net/`, the robots meta, the `X-Robots-Tag` header, published copy (`leading figure`), press-list markup, and two mobile breaks. A production build stops if Sanity can't be reached, so a served homepage always has fetched copy. The 404 proof is status 404, the words `Page not found`, the same robots header, and a canonical host of `https://adampendleton.net`. `robots.txt` must contain `Disallow: /`.

Unit-test output is the proof for fallback branches. Do not treat a green `verify:preview` as proof of those branches. The published document hides them.

## Cleanup

Stop only the process recorded in `artifacts/verify/server.pid`.

```bash
kill "$(cat artifacts/verify/server.pid)"
```

Leave `artifacts/verify/preview-report.json` and `artifacts/verify/server.log` in place. Do not delete `dist/`.

## Helpers

`bun run verify:preview` runs `node scripts/verify-preview.mjs`. Set `PREVIEW_ORIGIN` when the server is not on `http://127.0.0.1:8787`.

Keep the map current with `/maintain-verification-skill` as the routes change.
