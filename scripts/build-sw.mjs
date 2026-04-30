import { copyFile, mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { injectManifest } from "workbox-build";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(rootDir, "dist");
const clientDistDir = resolve(distDir, "client");
const vercelStaticDir = resolve(rootDir, ".vercel/output/static");
const tempDir = resolve(rootDir, ".pwa");
const bundledSw = resolve(tempDir, "sw-bundled.js");

async function directoryExists(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

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

const staticDir = (await directoryExists(clientDistDir)) ? clientDistDir : distDir;
const swDest = resolve(staticDir, "sw.js");

const { count, size, warnings } = await injectManifest({
  swSrc: bundledSw,
  swDest,
  globDirectory: staticDir,
  globPatterns: ["**/offline/index.html", "**/*.{js,css,png,svg,woff2}"],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
});

for (const warning of warnings) {
  console.warn(warning);
}

await rm(tempDir, { recursive: true, force: true });

if (await directoryExists(vercelStaticDir)) {
  await copyFile(swDest, resolve(vercelStaticDir, "sw.js"));
}

console.log(`PWA service worker generated: ${count} files, ${Math.round(size / 1024)} KiB precached.`);
