import { mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { injectManifest } from "workbox-build";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const tempDir = resolve(rootDir, ".pwa");
const bundledSw = resolve(tempDir, "sw-bundled.js");
const swDest = resolve(distDir, "sw.js");

await mkdir(tempDir, { recursive: true });

await build({
  entryPoints: [resolve(rootDir, "src/sw.ts")],
  outfile: bundledSw,
  bundle: true,
  format: "iife",
  target: "es2020",
  minify: true,
  sourcemap: false,
  define: {
    "process.env.NODE_ENV": '"production"'
  }
});

const { count, size, warnings } = await injectManifest({
  swSrc: bundledSw,
  swDest,
  globDirectory: distDir,
  globPatterns: ["**/*.{html,js,css,json,png,svg,woff2}"],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
});

for (const warning of warnings) {
  console.warn(warning);
}

await rm(tempDir, { recursive: true, force: true });

console.log(`PWA service worker generated: ${count} files, ${Math.round(size / 1024)} KiB precached.`);
