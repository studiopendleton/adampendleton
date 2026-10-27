import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canonicalUrl,
  indexingFromFlag,
  noindexHeadersFile,
  robotsTxt,
  siteBaseUrl,
} from './publicSite.ts';

describe('public site address', () => {
  it('uses the production origin when PUBLIC_SITE_URL is missing', () => {
    assert.equal(siteBaseUrl(undefined), 'https://adampendleton.net');
    assert.equal(siteBaseUrl(''), 'https://adampendleton.net');
    assert.equal(siteBaseUrl('   '), 'https://adampendleton.net');
    assert.equal(canonicalUrl('/', undefined), 'https://adampendleton.net/');
    assert.equal(canonicalUrl('/missing', undefined), 'https://adampendleton.net/missing');
  });

  it('keeps an explicit local origin', () => {
    assert.equal(siteBaseUrl('http://localhost:4321'), 'http://localhost:4321');
    assert.equal(canonicalUrl('/', 'http://localhost:4321/'), 'http://localhost:4321/');
  });

  it('rejects a relative site address', () => {
    assert.throws(() => siteBaseUrl('/adampendleton'), /absolute URL/);
  });
});

describe('indexing', () => {
  it('disallows crawlers only when the preview flag is set', () => {
    assert.equal(indexingFromFlag('true'), 'noindex');
    assert.equal(indexingFromFlag(undefined), 'index');
    assert.equal(indexingFromFlag('false'), 'index');
    assert.match(robotsTxt('noindex'), /Disallow: \//);
    assert.match(robotsTxt('index'), /Allow: \//);
    assert.match(noindexHeadersFile('noindex') ?? '', /X-Robots-Tag: noindex/);
    assert.equal(noindexHeadersFile('index'), undefined);
  });
});
