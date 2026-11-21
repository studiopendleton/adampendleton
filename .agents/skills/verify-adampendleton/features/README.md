# adampendleton verification map

This directory is the maintained source for verifying the public site. Read the index before driving the app, then use the matching feature file.

## Baseline preconditions

- Build with `PUBLIC_SITE_URL=https://adampendleton.net` and `PUBLIC_NOINDEX=true`.
- Serve `dist/` with `wrangler dev --config wrangler.preview.jsonc` on `http://127.0.0.1:8787`.
- Run `bun run test` for fallback branches before trusting the served homepage.
- Never drive a server this verification run did not start.

## Driving conventions

- Start every recipe from the preview build above.
- Treat every command as literal.
- Run HTTP checks through `bun run verify:preview`.
- Do not deploy, attach a custom domain, or change DNS from a verification run.

## Proof and skip reporting

- Capture the request and the resulting status, headers, and body, not only a screenshot.
- Record the feature id with the artifact in `artifacts/verify/preview-report.json`.
- Report an unreachable path with the command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph. It then uses exactly four H2 sections, in this order.

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with verify-preview`
4. `Gotchas`

## Features

- [Homepage](./homepage.md) covers published copy, press links, and the footer.
- [Not found](./not-found.md) covers an unknown path and the dropped `/image` route.
- [Crawler policy](./crawlers.md) covers the canonical URL, the robots header, and `robots.txt`.
