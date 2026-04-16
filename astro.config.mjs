import { defineConfig } from "astro/config";
import lit from "@astrojs/lit";
import netlify from "@astrojs/netlify";

export default defineConfig({
  output: "server",
  adapter: netlify({
    middlewareMode: "classic",
    edgeMiddleware: false,
    imageCDN: false,
    devFeatures: {
      images: false,
      environmentVariables: false,
    },
  }),
  integrations: [lit()],
  vite: {
    plugins: [], // we'll add more later if needed
    // This tells Vite to treat our Lit file as a client script
    optimizeDeps: {
      include: ["lit"],
    },
    build: {
      // Increase chunk size warning limit
      // Helia library is ~50KB gzipped but with deps it's larger
      // This is acceptable for a dashboard-only feature
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Manual chunk splitting to isolate Helia in separate bundle
          manualChunks: (id) => {
            // Isolate Helia and libp2p dependencies into separate chunk
            if (
              id.includes("node_modules/helia") ||
              id.includes("node_modules/libp2p")
            ) {
              return "helia-vendor";
            }
          },
        },
      },
    },
  },
});
