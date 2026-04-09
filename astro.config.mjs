import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import tailwindcss from "@tailwindcss/vite";

const base = process.env.BASE_PATH || "/";

export default defineConfig({
  output: "static",
  site: process.env.SITE_URL || "https://example.com",
  base,
  integrations: [preact()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["leaflet"]
    }
  }
});
