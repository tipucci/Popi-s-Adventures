import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwind from "@astrojs/tailwind";

const base = process.env.BASE_PATH || "/";

export default defineConfig({
  output: "static",
  site: process.env.SITE_URL || "https://example.com",
  base,
  integrations: [
    preact(),
    tailwind({
      applyBaseStyles: false
    })
  ],
  vite: {
    ssr: {
      noExternal: ["leaflet"]
    }
  }
});
