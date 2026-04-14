import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [lit()],
  vite: {
    plugins: [], // we'll add more later if needed
    // This tells Vite to treat our Lit file as a client script
    optimizeDeps: {
      include: ['lit']
    }
  }
});