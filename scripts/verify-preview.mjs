#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.PREVIEW_ORIGIN ?? 'http://127.0.0.1:8787';
const evidencePath = new URL('../artifacts/verify/preview-report.json', import.meta.url);

const checks = [];

function record(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) console.error(`FAIL ${name}: ${detail}`);
  else console.log(`PASS ${name}`);
}

async function fetchText(path) {
  const response = await fetch(new URL(path, origin));
  const body = await response.text();
  return { response, body };
}

const home = await fetchText('/');
const robotsHeader = home.response.headers.get('x-robots-tag') ?? '';
record('homepage status', home.response.status === 200, `status ${home.response.status}`);
record(
  'canonical',
  home.body.includes('rel="canonical" href="https://adampendleton.net/"'),
  'homepage canonical href',
);
record(
  'robots meta',
  home.body.includes('name="robots" content="noindex, nofollow"'),
  'homepage robots meta',
);
record('robots header', robotsHeader.toLowerCase().includes('noindex'), robotsHeader || 'missing');
record(
  'cms copy',
  home.body.includes('leading figure'),
  'homepage uses published copy',
);
record('press list', home.body.includes('<li><p><a href="https://www.nytimes.com/'), 'press list markup');
const mobileBreaks = home.body.match(/<br class="mobile-break">/g) ?? [];
record('mobile breaks', mobileBreaks.length === 2, `count ${mobileBreaks.length}`);

const robots = await fetchText('/robots.txt');
record('robots.txt status', robots.response.status === 200, `status ${robots.response.status}`);
record('robots.txt disallow', robots.body.includes('Disallow: /'), robots.body.trim());

const missing = await fetchText('/missing-page');
record('missing status', missing.response.status === 404, `status ${missing.response.status}`);
record('missing copy', missing.body.includes('Page not found'), '404 body');
const missingHeader = missing.response.headers.get('x-robots-tag') ?? '';
record(
  'missing robots header',
  missingHeader.toLowerCase().includes('noindex'),
  missingHeader || 'missing',
);
record(
  'missing canonical host',
  missing.body.includes('https://adampendleton.net/'),
  '404 canonical host',
);

const report = {
  origin,
  ok: checks.every((check) => check.ok),
  checks,
};
await mkdir(new URL('./', evidencePath), { recursive: true });
await writeFile(evidencePath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`evidence ${evidencePath.pathname}`);
if (!report.ok) process.exit(1);
