import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.BASE_PATH || "/";
const normalizedBase = base.endsWith("/") ? base : `${base}/`;
const withBasePath = (path) => `${normalizedBase}${path.replace(/^\//, "")}`;

export default defineConfig({
  output: "static",
  site: process.env.SITE_URL || "https://example.com",
  base,
  integrations: [preact()],
  vite: {
    plugins: [
      tailwindcss(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        registerType: "autoUpdate",
        injectRegister: null,
        manifestFilename: "manifest.webmanifest",
        manifest: {
          id: normalizedBase,
          name: "Popi's Adventures",
          short_name: "Popi",
          description: "Diario di escursioni e checklist per preparare lo zaino.",
          lang: "it",
          start_url: normalizedBase,
          scope: normalizedBase,
          display: "standalone",
          orientation: "portrait",
          background_color: "#F5EBDC",
          theme_color: "#315334",
          icons: [
            {
              src: withBasePath("/icons/popi-192.png"),
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: withBasePath("/icons/popi-512.png"),
              sizes: "512x512",
              type: "image/png"
            },
            {
              src: withBasePath("/icons/popi-maskable-512.png"),
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            }
          ]
        },
        injectManifest: {
          globPatterns: ["**/*.{html,js,css,json,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        },
        devOptions: {
          enabled: false
        }
      })
    ],
    ssr: {
      noExternal: ["leaflet"]
    }
  }
});
