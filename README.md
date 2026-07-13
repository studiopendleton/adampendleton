# Adam Pendleton

Astro static site scaffold for `adampendleton.net`, replacing the archived Kirby/PHP site.

## Stack

- Astro static output
- Tailwind v4 via the Tailwind Vite plugin
- Sanity for editable content
- Cloudflare Workers Static Assets
- Bun for package management

## Development

```sh
bun install
bun run dev
```

## Build

```sh
bun run build
```

## Cloudflare Preview

```sh
bun run worker:preview
```

## Deploy

```sh
bun run deploy
```

## Environment

Copy `.env.example` to `.env` for local values. Public Sanity values can be exposed to the browser/build. Do not commit private tokens.

## Archive

The previous Kirby/PHP site was archived separately at:

```text
/Users/scozu/Developer/adampendleton-kirby
```

Migration notes and baseline captures live in `docs/`.
