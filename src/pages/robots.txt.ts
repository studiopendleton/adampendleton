import type { APIRoute } from 'astro';
import { indexingFromFlag, robotsTxt } from '../lib/publicSite';

export const GET: APIRoute = () => {
  const body = robotsTxt(indexingFromFlag(import.meta.env.PUBLIC_NOINDEX));
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
