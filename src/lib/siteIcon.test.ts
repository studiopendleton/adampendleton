import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { iconLinkTags, verifySiteIcons, writeSiteIcons } from './siteIcon.ts';

const LINKS = [
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
  { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon', sizes: '16x16 32x32 48x48' },
  { rel: 'icon', href: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
  { rel: 'icon', href: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
  { rel: 'icon', href: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
];

function tempPublicDir(): { dir: string; url: URL } {
  const dir = mkdtempSync(path.join(tmpdir(), 'site-icons-'));
  return { dir, url: new URL(`${pathToFileURL(dir).href}/`) };
}

describe('site icons', () => {
  it('publishes six icon links in order', () => {
    assert.deepEqual(iconLinkTags(), LINKS);
  });

  it('writes a directory that verifies', () => {
    const { dir, url } = tempPublicDir();
    try {
      writeSiteIcons(url);
      verifySiteIcons(url);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('matches the icons in public/', () => {
    verifySiteIcons(new URL('../../public/', import.meta.url));
  });

  it('rejects an svg that follows prefers-color-scheme', () => {
    const { dir, url } = tempPublicDir();
    try {
      writeSiteIcons(url);
      writeFileSync(
        new URL('favicon.svg', url),
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    path { fill: #000; }
    @media (prefers-color-scheme: dark) {
      path { fill: #fff; }
    }
  </style>
  <rect width="32" height="32" fill="#000000"/>
</svg>
`,
      );
      assert.throws(() => verifySiteIcons(url));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('keeps icon paths out of the layout', () => {
    const layout = readFileSync(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8');
    assert.match(layout, /iconLinkTags\s*\(/);
    assert.equal(layout.includes('favicon.ico'), false);
    assert.equal(layout.includes('apple-touch-icon'), false);
  });
});
