import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://personalportfolio.website',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    // Put the (small) stylesheet straight into each page: no extra request before first paint.
    inlineStylesheets: 'always',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
