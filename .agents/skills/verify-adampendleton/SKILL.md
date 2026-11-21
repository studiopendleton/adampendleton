---
name: verify-adampendleton
description: Verify adampendleton.net changes before calling them done. Use after any change to the adampendleton.net site, its content rendering, headers, or scripts/verify-preview.mjs, and before reporting a preview or production check as complete.
---

# Verify adampendleton.net

The site is a static Astro homepage, a 404 page, and `robots.txt`. Content comes from Sanity at build time. There is no login. Run every command from the repo root.

## Rules

- Never deploy from this skill. No `wrangler deploy`, no `--remote`, no `--route`, no custom domain, no DNS or Cloudflare settings. Deploys need the owner's approval.
- Never edit `wrangler.jsonc`, `wrangler.preview.jsonc`, or the deploy scripts to make a check pass.
- Before a production build, check that `.env` does not set `PUBLIC_NOINDEX=true`.
- Against public URLs, only read. Do not run `verify:preview` against production: its noindex checks fail there on purpose.

## Flow

Run these in order. Stop at the first failure and report it.

**(a) Install from the lockfile**

```bash
bun install --frozen-lockfile
```

If this fails, stop and report. Do not edit `package.json` or `bun.lock`.

**(b) Unit tests** (fallback branches the published page does not show)

```bash
bun run test
```

**(c) Astro and type checks**

```bash
bun run check
```

**(d) Noindex build** (same settings as `deploy:preview`)

```bash
PUBLIC_SITE_URL=https://adampendleton.net PUBLIC_NOINDEX=true bun run build
```

The build reads public Sanity, so it needs network access. If Sanity cannot be reached, report the failure. Do not fall back to a different build.

**(e) Serve `dist/` locally and verify**

```bash
mkdir -p artifacts/verify
bunx wrangler dev --config wrangler.preview.jsonc --port 8787 --ip 127.0.0.1 --local --show-interactive-dev-session false > artifacts/verify/server.log 2>&1 &
echo $! > artifacts/verify/server.pid
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8787/
PREVIEW_ORIGIN=http://127.0.0.1:8787 bun run verify:preview
```

Retry the `curl` until it prints `200`. If it stays down, read `artifacts/verify/server.log`. Check that the response has `x-robots-tag: noindex`. That header proves this build is the one being served, not another process.

If port 8787 is already in use, do not kill that process. Check with `lsof -nP -iTCP:8787 -sTCP:LISTEN`, pick a free port, and use it for `--port`, the `curl`, and `PREVIEW_ORIGIN`. Check that `dist/index.html` contains `https://adampendleton.net/` and does not contain `http://localhost`.

**(f) PR preview** (after the PR's `Workers Builds: adampendleton` check passes)

```bash
PREVIEW_ORIGIN=https://<branch-slug>-adampendleton.adampendleton.workers.dev bun run verify:preview
```

For example, branch `agents/verify-skill` uses `https://agents-verify-skill-adampendleton.adampendleton.workers.dev`. Preview URLs return a plain `Not found` body for unknown paths, so `missing copy` and `missing canonical host` are expected to fail there. Report them as expected-skip, not pass. Every other check must pass.

**(g) Production smoke check** (read-only, only after an approved production deploy)

```bash
curl -sI https://adampendleton.net/
curl -s https://adampendleton.net/ | grep -io '<link rel="canonical"[^>]*>'
curl -s https://adampendleton.net/ | grep -io '<meta name="robots"[^>]*>' || echo 'no robots meta'
curl -sI https://www.adampendleton.net/
curl -s -o /dev/null -w '%{http_code}\n' https://adampendleton.net/missing-page
curl -s https://adampendleton.net/missing-page | grep -c 'Page not found'
```

Expected: the 404 status line prints `404` and the grep prints `1`.

Expected for the apex: status `200`, no `X-Robots-Tag: noindex` header, no robots meta with `noindex`, and canonical `https://adampendleton.net/`. Report what `www` returns (status and any redirect `location`). Do not change `www` behaviour from this skill.

## What `verify:preview` checks

- Homepage: status 200, canonical `https://adampendleton.net/`, robots meta `noindex, nofollow`, `X-Robots-Tag` containing `noindex`, at least one text paragraph, at least one press link, and every press link href starting with `http://` or `https://`.
- `/robots.txt`: status 200 and `Disallow: /`.
- `/missing-page`: status 404, the words `Page not found`, `X-Robots-Tag` containing `noindex`, and the canonical host `https://adampendleton.net/`.

It does not check wording of the copy or the mobile line breaks. `bun run test` covers the footer line breaks. Check `/image` by hand: it should return 404.

Evidence is written to `artifacts/verify/preview-report.json`. Report its `ok` value and the failed checks, if any.

## Cleanup

Stop only the wrangler process recorded in `artifacts/verify/server.pid`:

```bash
kill "$(cat artifacts/verify/server.pid)"
```

Leave `artifacts/verify/` in place. Do not delete `dist/`.

## Files

- `scripts/verify-preview.mjs` is the checker. It fetches a running origin. It does not start a server and it does not deploy.
- `features/` holds short notes per page: homepage, not found, crawler policy.

Update this skill in the same change when site behaviour it checks changes.
