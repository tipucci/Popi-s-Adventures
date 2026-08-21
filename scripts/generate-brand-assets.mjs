import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const logoDir = path.join(root, "src/assets/images/site/logo");
const publicDir = path.join(root, "public");
const iconDir = path.join(publicDir, "icons");
const masterPath = path.join(logoDir, "gea-brand-master.png");

const colors = {
  cream: "#F7F1E3",
  ink: "#191C1B",
  leaf: "#91A66D",
  leafDark: "#7F925D",
  sunshine: "#F3A712"
};

await mkdir(iconDir, { recursive: true });

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const mark = await sharp(masterPath)
  .trim({ background: transparent, threshold: 8 })
  .png()
  .toBuffer();

function svgBuffer(content, width, height) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`
  );
}

async function resizedMark(width, height = width) {
  return sharp(mark)
    .resize({
      width,
      height,
      fit: "contain",
      background: transparent,
      withoutEnlargement: false
    })
    .png()
    .toBuffer();
}

async function writeLogo() {
  const width = 2000;
  const height = 627;
  const dog = await resizedMark(560, 560);
  const drawing = svgBuffer(
    `
      <style>
        .wordmark {
          font-family: "SignPainter", "Brush Script MT", "Bradley Hand", cursive;
          font-size: 324px;
          font-weight: 600;
          letter-spacing: -8px;
        }
        .descriptor {
          font-family: "Avenir Next", "Helvetica Neue", sans-serif;
          font-size: 88px;
          font-weight: 700;
          letter-spacing: 32px;
        }
      </style>
      <text class="wordmark" x="54" y="326" fill="${colors.ink}">Popi&apos;s</text>
      <path d="M92 390 C 350 344, 710 332, 1180 360" fill="none" stroke="${colors.sunshine}" stroke-width="19" stroke-linecap="round"/>
      <text class="descriptor" x="160" y="520" fill="${colors.ink}">ADVENTURES</text>
    `,
    width,
    height
  );

  await sharp({ create: { width, height, channels: 4, background: transparent } })
    .composite([
      { input: drawing, left: 0, top: 0 },
      { input: dog, left: 1405, top: 32 }
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(logoDir, "logo-horizontal.png"));
}

async function writeFavicon() {
  const size = 512;
  const circle = svgBuffer(
    `<circle cx="256" cy="256" r="232" fill="${colors.cream}"/>`,
    size,
    size
  );
  const dog = await resizedMark(360, 360);

  const favicon = await sharp({ create: { width: size, height: size, channels: 4, background: transparent } })
    .composite([
      { input: circle, left: 0, top: 0 },
      { input: dog, left: 76, top: 78 }
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(favicon).toFile(path.join(publicDir, "favicon.png"));
  await sharp(favicon).resize(192, 192).png({ compressionLevel: 9 }).toFile(path.join(publicDir, "favicon-192.png"));
  await sharp(favicon).resize(32, 32).png({ compressionLevel: 9 }).toFile(path.join(publicDir, "favicon-32.png"));
  await sharp(favicon).resize(16, 16).png({ compressionLevel: 9 }).toFile(path.join(publicDir, "favicon-16.png"));
}

function appBackground({ rounded }) {
  const radius = rounded ? 86 : 0;
  return svgBuffer(
    `
      <defs>
        <linearGradient id="leaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${colors.leaf}"/>
          <stop offset="1" stop-color="${colors.leafDark}"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="${radius}" fill="url(#leaf)"/>
    `,
    512,
    512
  );
}

async function renderAppIcon({ rounded, dogSize }) {
  const dog = await resizedMark(dogSize, dogSize);
  const offset = Math.round((512 - dogSize) / 2);

  return sharp({ create: { width: 512, height: 512, channels: 4, background: transparent } })
    .composite([
      { input: appBackground({ rounded }), left: 0, top: 0 },
      { input: dog, left: offset, top: offset + 4 }
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function writeAppIcons() {
  const appIcon = await renderAppIcon({ rounded: true, dogSize: 382 });
  const maskable = await renderAppIcon({ rounded: false, dogSize: 336 });
  const appleTouch = await renderAppIcon({ rounded: false, dogSize: 370 });

  await sharp(appIcon).toFile(path.join(iconDir, "app-icon-512.png"));
  await sharp(appIcon).resize(192, 192).png({ compressionLevel: 9 }).toFile(path.join(iconDir, "app-icon-192.png"));
  await sharp(maskable).toFile(path.join(iconDir, "app-icon-maskable-512.png"));
  await sharp(appleTouch).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(iconDir, "apple-touch-icon.png"));
  await sharp(appleTouch).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(publicDir, "apple-touch-icon.png"));
}

await Promise.all([writeLogo(), writeFavicon(), writeAppIcons()]);

console.log("Generated Popi's Adventures raster brand assets.");
