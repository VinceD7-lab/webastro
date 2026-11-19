import type { APIRoute } from 'astro';
import { url } from '../lib/url';

/** robots.txt : tout est indexable ; le plan du site est produit par @astrojs/sitemap. */
export const GET: APIRoute = ({ site }) => {
  const plan = site ? new URL(url('/sitemap-index.xml'), site).href : url('/sitemap-index.xml');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${plan}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
