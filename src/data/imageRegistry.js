import { getImage } from "astro:assets";
import { hikeImageMeta } from "./hikeImageMeta.js";

const siteImageModules = import.meta.glob("../assets/images/site/**/*.{jpg,jpeg,png,webp,avif,svg}", {
  eager: true,
  import: "default"
});

const hikeImageModules = import.meta.glob("../assets/images/hikes/**/*.{jpg,jpeg,png,webp,avif,svg}", {
  eager: true,
  import: "default"
});

const imageExtensionPriority = [".avif", ".webp", ".jpg", ".jpeg", ".png", ".svg"];

function normalizeImageSource(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.src === "string") return value.src;
  return String(value);
}

function getPreferredSingleImage(modules, basePath) {
  for (const extension of imageExtensionPriority) {
    const match = modules[`${basePath}${extension}`];
    if (match) return match;
  }

  throw new Error(`Missing local image: ${basePath}`);
}

function defaultCoverAlt(title) {
  return `${title} - immagine di copertina dell'escursione.`;
}

function defaultGalleryAlt(title, index) {
  return `${title} - foto ${String(index).padStart(2, "0")} della galleria.`;
}

function createPlaceholderSvg({ title }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="sky" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f4efe4" />
          <stop offset="100%" stop-color="#e2d7be" />
        </linearGradient>
        <linearGradient id="ridge" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#6f8a63" />
          <stop offset="100%" stop-color="#51684a" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sky)" />
      <circle cx="1260" cy="180" r="96" fill="rgba(255,255,255,0.45)" />
      <path d="M0 620 L220 520 L430 560 L660 430 L900 540 L1120 410 L1370 530 L1600 460 L1600 900 L0 900 Z" fill="rgba(93,117,79,0.24)" />
      <path d="M0 700 L280 500 L510 640 L760 470 L1010 650 L1280 520 L1600 670 L1600 900 L0 900 Z" fill="rgba(58,82,51,0.2)" />
      <path d="M0 770 L210 690 L400 730 L690 590 L930 760 L1180 640 L1440 720 L1600 680 L1600 900 L0 900 Z" fill="url(#ridge)" />
      <rect x="0" y="790" width="1600" height="110" fill="rgba(240,233,219,0.36)" />
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}

function createPlaceholderImage(title, alt) {
  const src = createPlaceholderSvg({ title });
  return {
    source: src,
    src,
    alt,
    caption: "",
    cardSrc: src,
    srcSet: ""
  };
}

function getPreferredImage(modules, folderPrefix, baseName) {
  for (const extension of imageExtensionPriority) {
    const match = modules[`${folderPrefix}${baseName}${extension}`];
    if (match) return { source: match, file: `${baseName}${extension}` };
  }

  return null;
}

async function createOptimizedVariant(source, options) {
  if (!source || typeof source === "string") {
    return null;
  }

  return getImage({
    src: source,
    format: "webp",
    ...options
  });
}

function buildSrcSet(entries) {
  return entries
    .filter((entry) => entry?.src && entry?.width)
    .map((entry) => `${entry.src} ${entry.width}w`)
    .join(", ");
}

const heroHomeSource = getPreferredSingleImage(siteImageModules, "../assets/images/site/home/popi-hero-desktop");
const aboutUsSource = getPreferredSingleImage(siteImageModules, "../assets/images/site/about/chi-siamo");

export const siteImages = {
  heroHome: {
    source: heroHomeSource,
    src: normalizeImageSource(heroHomeSource),
    alt: "Panorama naturale dal tono caldo usato come hero del sito Popi's Adventures."
  },
  aboutUs: {
    source: aboutUsSource,
    src: normalizeImageSource(aboutUsSource),
    alt: "Foto di noi due insieme a Gea durante una giornata in natura.",
    caption: "Noi tre, tra sentieri, pause lente e giornate da ricordare."
  }
};

export async function getHikeImages(slug, title) {
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
        source: image.source,
        src: normalizeImageSource(image.source),
        alt: entry?.alt || defaultGalleryAlt(title, index + 1),
        caption: entry?.caption || ""
      };
    })
    .filter(Boolean);

  const coverImage = cover
    ? (() => ({
        source: cover.source,
        src: normalizeImageSource(cover.source),
        alt: meta.coverAlt || defaultCoverAlt(title)
      }))()
    : createPlaceholderImage(
        title,
        `${title} - immagine segnaposto in attesa della foto di copertina.`
      );

  const galleryImages = gallery.length
    ? gallery
    : [
        createPlaceholderImage(
          title,
          `${title} - immagine segnaposto della galleria.`
        )
      ];

  if (!cover || typeof cover.source === "string") {
    return {
      cover: coverImage,
      gallery: galleryImages
    };
  }

  const [cardVariant, coverVariant] = await Promise.all([
    createOptimizedVariant(cover.source, { width: 720, quality: 68 }),
    createOptimizedVariant(cover.source, { width: 1440, quality: 74 })
  ]);

  return {
    cover: {
      ...coverImage,
      src: coverVariant?.src || coverImage.src,
      cardSrc: cardVariant?.src || coverImage.src,
      srcSet: buildSrcSet([cardVariant, coverVariant])
    },
    gallery: galleryImages
  };
}