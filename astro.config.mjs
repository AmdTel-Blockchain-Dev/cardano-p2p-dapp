// @ts-check
import { defineConfig } from 'astro/config';
import qwikdev from '@qwikdev/astro';
import vercel from '@astrojs/vercel/static';

// https://astro.build/config
export default defineConfig({
  integrations: [qwikdev()],
  output: 'static',
  adapter: vercel({}),
  vite: {
    build: {
      target: 'es2022'
    },
    optimizeDeps: {
      exclude: ['lucid-cardano']
    },
    ssr: {
      external: ['lucid-cardano']
    }
  }
});