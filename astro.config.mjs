import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  integrations: [lit()],
  vite: {
    plugins: [], // we'll add more later if needed
    // This tells Vite to treat our Lit file as a client script
    optimizeDeps: {
      include: ['lit']
    }
  }
});