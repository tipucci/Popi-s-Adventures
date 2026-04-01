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

function sortGalleryEntries([pathA], [pathB]) {
  return pathA.localeCompare(pathB, "en");
}

function defaultCoverAlt(title) {
  return `${title} - immagine di copertina dell'escursione.`;
}

function defaultGalleryAlt(title, index) {
  return `${title} - foto ${String(index).padStart(2, "0")} della galleria.`;
}

export const siteImages = {
  heroHome: {
    src: getImage(siteImageModules, "../assets/images/site/home/hero-home.jpg"),
    alt: "Panorama naturale dal tono caldo usato come hero del sito Popi's Adventures."
  },
  aboutUs: {
    src: getImage(siteImageModules, "../assets/images/site/about/chi-siamo.jpg"),
    alt: "Foto di noi due insieme a Gea durante una giornata in natura.",
    caption: "Noi tre, tra sentieri, pause lente e giornate da ricordare."
  }
};

export function getHikeImages(slug, title) {
  const folderPrefix = `../assets/images/hikes/${slug}/`;
  const cover =
    hikeImageModules[`${folderPrefix}cover.jpg`] ||
    hikeImageModules[`${folderPrefix}cover.jpeg`] ||
    hikeImageModules[`${folderPrefix}cover.png`] ||
    hikeImageModules[`${folderPrefix}cover.webp`] ||
    hikeImageModules[`${folderPrefix}cover.avif`];

  if (!cover) {
    throw new Error(`Missing cover image for hike: ${slug}`);
  }

  const meta = hikeImageMeta[slug] || {};
  const gallery = Object.entries(hikeImageModules)
    .filter(([path]) => path.startsWith(folderPrefix) && /gallery-\d+\.(jpg|jpeg|png|webp|avif|svg)$/i.test(path))
    .sort(sortGalleryEntries)
    .map(([path, source], index) => {
      const file = path.split("/").at(-1);
      const entry = meta.gallery?.find((item) => item.file === file);

      return {
        src: normalizeImageSource(source),
        alt: entry?.alt || defaultGalleryAlt(title, index + 1),
        caption: entry?.caption || ""
      };
    });

  return {
    cover: {
      src: normalizeImageSource(cover),
      alt: meta.coverAlt || defaultCoverAlt(title)
    },
    gallery
  };
}