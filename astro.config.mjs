// @ts-check
import { writeFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { indexingFromFlag, noindexHeadersFile } from './src/lib/publicSite.ts';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    {
      name: 'noindex-headers',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const headers = noindexHeadersFile(indexingFromFlag(process.env.PUBLIC_NOINDEX));
          if (!headers) return;
          await writeFile(new URL('./_headers', dir), headers);
        },
      },
    },
  ],
});
