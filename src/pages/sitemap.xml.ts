import type { APIRoute } from 'astro';
import { getContent } from '../lib/content';

export const GET: APIRoute = async ({ site }) => {
  const { projects, posts } = await getContent();
  const paths = [
    '/',
    '/resume/',
    '/projects/',
    '/certifications/',
    '/contact/',
    ...(posts.length ? ['/blog/'] : []),
    ...projects.map((p) => `/projects/${p.slug}/`),
    ...posts.map((p) => `/blog/${p.slug}/`),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${new URL(p, site).href}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
