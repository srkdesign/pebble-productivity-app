// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",

  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      filename: "sw.js",
      scope: "/",

      includeAssets: ["favicon.ico", "icon-192.png", "icon-512.png"],

      manifest: {
        name: "Pebble Productivity App",
        short_name: "PebbleProd",

        start_url: "/",
        scope: "/",

        display: "standalone",
        display_override: ["standalone", "minimal-ui"],

        background_color: "#ffffff",
        theme_color: "#ffffff",

        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,mp3,webmanifest}"],

        additionalManifestEntries: [
          { url: "/logo/light.png", revision: null },
          { url: "/logo/dark.png", revision: null },
          { url: "/fonts/AveriaLibre-Bold.woff2", revision: null },
          { url: "/fonts/Manrope.woff2", revision: null },
          { url: "/sounds/completed.mp3", revision: null },
          { url: "index.html", revision: null },
        ],

        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/],

        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],

  build: {
    outDir: "../server/static",
    emptyOutDir: true,
  },

  server: {
    proxy: {
      "/api": "https://localhost:7676",
    },
  },
});
