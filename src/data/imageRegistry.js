import { hikeImageMeta } from "./hikeImageMeta.js";

const siteImageModules = import.meta.glob("../assets/images/site/**/*.{jpg,jpeg,png,webp,avif,svg}", {
  eager: true,
  import: "default"
});

const hikeImageModules = import.meta.glob("../assets/images/hikes/**/*.{jpg,jpeg,png,webp,avif,svg}", {
  eager: true,
  import: "default"
});

function normalizeImageSource(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.src === "string") return value.src;
  return String(value);
}

function getImage(modules, key) {
  const value = modules[key];
  if (!value) {
    throw new Error(`Missing local image: ${key}`);
  }
  return normalizeImageSource(value);
}

function getPreferredSingleImage(modules, basePath) {
  for (const extension of imageExtensionPriority) {
    const match = modules[`${basePath}${extension}`];
    if (match) return normalizeImageSource(match);
  }

  throw new Error(`Missing local image: ${basePath}`);
}

function sortGalleryEntries([pathA], [pathB]) {
  return pathA.localeCompare(pathB, "en");
}

function defaultCoverAlt(title) {
  return `${title} - immagine di copertina dell'escursione.`;
}

function defaultGalleryAlt(title, index) {
  return `${title} - foto ${String(index).padStart(2, "0")} della galleria.`;
}

function createPlaceholderSvg({ title, subtitle }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#315f3d" />
          <stop offset="100%" stop-color="#5d8a55" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bg)" />
      <circle cx="1280" cy="160" r="110" fill="rgba(255,255,255,0.08)" />
      <path d="M0 720 L320 520 L560 660 L880 420 L1180 640 L1440 500 L1600 620 L1600 900 L0 900 Z" fill="rgba(14,37,22,0.28)" />
      <path d="M0 790 L250 620 L480 760 L760 560 L1010 740 L1320 590 L1600 760 L1600 900 L0 900 Z" fill="rgba(14,37,22,0.42)" />
      <text x="120" y="650" fill="#f6f0e1" font-family="Georgia, serif" font-size="84" font-weight="700">${title}</text>
      <text x="120" y="730" fill="rgba(246,240,225,0.85)" font-family="Arial, sans-serif" font-size="32">${subtitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

function createPlaceholderImage(title, alt, subtitle) {
  return {
    src: createPlaceholderSvg({ title, subtitle }),
    alt,
    caption: ""
  };
}

const imageExtensionPriority = [".avif", ".webp", ".jpg", ".jpeg", ".png", ".svg"];

export const siteImages = {
  heroHome: {
    src: getPreferredSingleImage(siteImageModules, "../assets/images/site/home/hero-home"),
    alt: "Panorama naturale dal tono caldo usato come hero del sito Popi's Adventures."
  },
  aboutUs: {
    src: getPreferredSingleImage(siteImageModules, "../assets/images/site/about/chi-siamo"),
    alt: "Foto di noi due insieme a Gea durante una giornata in natura.",
    caption: "Noi tre, tra sentieri, pause lente e giornate da ricordare."
  }
};

function getPreferredImage(modules, folderPrefix, baseName) {
  for (const extension of imageExtensionPriority) {
    const match = modules[`${folderPrefix}${baseName}${extension}`];
    if (match) return { source: match, file: `${baseName}${extension}` };
  }

  return null;
}

export function getHikeImages(slug, title) {
  const folderPrefix = `../assets/images/hikes/${slug}/`;
  const meta = hikeImageMeta[slug] || {};
  const cover = getPreferredImage(hikeImageModules, folderPrefix, "cover");

  const gallery = [...new Set(
    Object.keys(hikeImageModules)
      .filter((path) => path.startsWith(folderPrefix) && /gallery-\d+\.(jpg|jpeg|png|webp|avif|svg)$/i.test(path))
      .map((path) => path.split("/").at(-1).replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, ""))
  )]
    .sort((a, b) => a.localeCompare(b, "en"))
    .map((baseName, index) => {
      const image = getPreferredImage(hikeImageModules, folderPrefix, baseName);
      if (!image) return null;

      const entry = meta.gallery?.find((item) => item.file.replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, "") === baseName);

      return {
        src: normalizeImageSource(image.source),
        alt: entry?.alt || defaultGalleryAlt(title, index + 1),
        caption: entry?.caption || ""
      };
    })
    .filter(Boolean);

  const coverImage = cover
    ? {
        src: normalizeImageSource(cover.source),
        alt: meta.coverAlt || defaultCoverAlt(title)
      }
    : createPlaceholderImage(
        title,
        `${title} - immagine segnaposto in attesa della foto di copertina.`,
        "Immagine in arrivo"
      );

  const galleryImages = gallery.length
    ? gallery
    : [
        createPlaceholderImage(
          title,
          `${title} - immagine segnaposto della galleria.`,
          "Galleria in arrivo"
        )
      ];

  return {
    cover: coverImage,
    gallery: galleryImages
  };
}
