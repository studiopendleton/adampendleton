export const PRODUCTION_SITE_URL = 'https://adampendleton.net';

export type Indexing = 'index' | 'noindex';

export function siteBaseUrl(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return PRODUCTION_SITE_URL;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`PUBLIC_SITE_URL must be an absolute URL. Received "${value}".`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`PUBLIC_SITE_URL must use http or https. Received "${value}".`);
  }

  return url.origin;
}

export function canonicalUrl(pathname: string, raw: string | undefined): string {
  return new URL(pathname, siteBaseUrl(raw)).toString();
}

export function indexingFromFlag(raw: string | undefined): Indexing {
  return raw === 'true' ? 'noindex' : 'index';
}

export function robotsTxt(indexing: Indexing): string {
  switch (indexing) {
    case 'noindex':
      return 'User-agent: *\nDisallow: /\n';
    case 'index':
      return 'User-agent: *\nAllow: /\n';
    default: {
      const unreachable: never = indexing;
      return unreachable;
    }
  }
}

export function noindexHeadersFile(indexing: Indexing): string | undefined {
  switch (indexing) {
    case 'noindex':
      return '/*\n  X-Robots-Tag: noindex\n';
    case 'index':
      return undefined;
    default: {
      const unreachable: never = indexing;
      return unreachable;
    }
  }
}
