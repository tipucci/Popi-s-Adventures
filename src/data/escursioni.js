import { getHikeImages } from "./imageRegistry.js";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT29EGlSwQbCjoc9lnwcS3x7VX8XommgfcI9qrFsrCZzQmlNEjoYqKq5YU1ZKhgHKnidVX8LWTLmTuT/pub?gid=0&single=true&output=csv";

const FETCH_TIMEOUT_MS = 8000;

function slugify(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeHeader(value = "") {
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function toNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return fallback;
  const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return Number.NaN;
  const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return ["si", "yes", "true", "1", "x"].includes(normalized);
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];
  return value
    .split(/[|,;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDateParts(value = "") {
  const text = String(value).trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return { year: Number(year), month: Number(month), day: Number(day) };
  }

  const euMatch = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (euMatch) {
    const [, day, month, rawYear] = euMatch;
    const year = rawYear.length === 2 ? Number(`20${rawYear}`) : Number(rawYear);
    return { year, month: Number(month), day: Number(day) };
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate()
  };
}

function normalizeDate(value) {
  const parts = parseDateParts(value);
  if (!parts) return "";
  const { year, month, day } = parts;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateToTime(value) {
  const normalized = normalizeDate(value);
  if (!normalized) return 0;
  return new Date(`${normalized}T00:00:00`).getTime();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }

  if (!rows.length) return [];

  const [headers, ...entries] = rows;
  const normalizedHeaders = headers.map(normalizeHeader);

  return entries
    .filter((entry) => entry.some((cell) => String(cell).trim() !== ""))
    .map((entry) => {
      const item = {};
      normalizedHeaders.forEach((header, index) => {
        item[header] = (entry[index] || "").trim();
      });
      return item;
    });
}

function hasGea(raw) {
  if (toBoolean(raw.cane) || toBoolean(raw.gea) || toBoolean(raw.con_gea)) {
    return true;
  }

  const partecipanti = toArray(raw.partecipanti).map((item) => slugify(item));
  return partecipanti.includes("gea") || partecipanti.includes("cane");
}

function normalizeParticipants(raw) {
  const people = ["meg", "tizi"];
  if (hasGea(raw)) {
    people.push("gea");
  }
  return people;
}

function getRifugioName(raw) {
  const value = raw.nome_rifugio || raw.rifugio || "";
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized || toBoolean(normalized) || ["no", "nessuno"].includes(normalized.toLowerCase())) {
    return "";
  }
  return normalized;
}

function hasRifugio(raw) {
  return toBoolean(raw.rifugio) || Boolean(getRifugioName(raw));
}

function normalizeTags(rawTag, rawFields) {
  const tags = new Set(toArray(rawTag).map((item) => item.toLowerCase()));
  if (rawFields.provincia) tags.add(rawFields.provincia.toLowerCase());
  if (toBoolean(rawFields.anello)) tags.add("anello");
  if (hasRifugio(rawFields)) tags.add("rifugio");
  if (toBoolean(rawFields.acqua)) tags.add("acqua");
  return [...tags].filter(Boolean);
}

function formatLuogo(raw) {
  const parts = [raw.luogo, raw.provincia].filter(Boolean);
  return parts.join(", ") || "Localit\u00E0 da definire";
}

function buildDescription(raw) {
  const parts = [];
  if (raw.note) parts.push(raw.note);
  if (raw.nome_rifugio) parts.push(`Rifugio: ${raw.nome_rifugio}.`);
  if (raw.voto) parts.push(`Voto personale: ${raw.voto}/10.`);
  return parts.join(" ") || "Escursione importata dal diario condiviso.";
}

function buildContentSlug(rawSlug, titolo, index = 0) {
  return rawSlug ? slugify(rawSlug) : slugify(titolo || `escursione-${index + 1}`);
}

function buildImageSlug(contentSlug, data) {
  const normalizedDate = normalizeDate(data);
  if (!normalizedDate) return contentSlug;
  if (contentSlug.startsWith(`${normalizedDate}-`)) return contentSlug;
  return `${normalizedDate}-${contentSlug}`;
}

async function toApiShape(raw, index = 0) {
  const gea = hasGea(raw);
  const nomeRifugio = getRifugioName(raw);
  const data = normalizeDate(raw.data || "");
  const titolo = raw.titolo || raw.gita || `Escursione ${index + 1}`;
  const slug = buildContentSlug(raw.slug || "", titolo, index);
  const imageSlug = buildImageSlug(slug, data);
  const images = await getHikeImages(imageSlug, titolo);

  return {
    data,
    titolo,
    luogo: raw.luogo || "",
    km: toNumber(raw.km),
    durata: raw.durata || "",
    dislivello: toNumber(raw.dislivello),
    difficolta: raw.difficolta || raw.tipo || "",
    partecipanti: raw.partecipanti || "",
    cane: gea,
    tag: raw.tag || "",
    note: raw.note || "",
    provincia: raw.provincia || "",
    acqua: toBoolean(raw.acqua),
    rifugio: hasRifugio(raw),
    nome_rifugio: nomeRifugio,
    anello: toBoolean(raw.anello),
    voto: toNumber(raw.voto),
    slug,
    imageSlug,
    lat: toOptionalNumber(raw.lat ?? raw.latitudine),
    lng: toOptionalNumber(raw.lng ?? raw.longitudine ?? raw.lon ?? raw.long),
    cover: images.cover.src,
    coverCard: images.cover.cardSrc || images.cover.src,
    coverSrcSet: images.cover.srcSet || "",
    coverAlt: images.cover.alt,
    gallery: images.gallery,
    foto: images.gallery.map((item) => item.src)
  };
}

export async function normalizeEscursione(raw, index = 0) {
  const api = await toApiShape(raw, index);
  const luogoCompleto = formatLuogo(api);
  const tag = normalizeTags(api.tag, api);
  const partecipanti = normalizeParticipants(raw);

  return {
    ...api,
    luogo: luogoCompleto,
    descrizione: buildDescription(api),
    durataMinuti: toNumber(api.durata),
    partecipanti,
    tag
  };
}

export function sortByDateDesc(a, b) {
  return dateToTime(b.data) - dateToTime(a.data);
}

function describeEscursioneRow(raw, index) {
  const title = raw?.titolo || raw?.gita || `Escursione ${index + 1}`;
  const date = normalizeDate(raw?.data || "");
  return date ? `${title} (${date})` : title;
}

async function normalizeEscursioniRows(rows) {
  const normalized = await Promise.all(
    rows.map(async (row, index) => {
      try {
        return await normalizeEscursione(row, index);
      } catch (error) {
        console.warn(
          `[escursioni] Escursione ignorata: ${describeEscursioneRow(row, index)}. ${error instanceof Error ? error.message : error}`
        );
        return null;
      }
    })
  );

  return normalized.filter(Boolean).sort(sortByDateDesc);
}

export async function fetchEscursioniCsv() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(CSV_URL, {
      signal: controller.signal,
      headers: {
        Accept: "text/csv,text/plain;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`CSV responded with ${response.status}`);
    }

    const text = await response.text();
    return parseCsv(text);
  } finally {
    clearTimeout(timeout);
  }
}

export async function getEscursioni() {
  try {
    const rows = await fetchEscursioniCsv();
    return await normalizeEscursioniRows(rows);
  } catch (error) {
    console.warn(
      `[escursioni] Impossibile caricare il CSV: ${error instanceof Error ? error.message : error}`
    );
    return [];
  }
}

export async function getEscursioneBySlug(slug) {
  const escursioni = await getEscursioni();
  return escursioni.find((item) => item.slug === slug);
}

export async function getEscursioniApiData() {
  try {
    const rows = await fetchEscursioniCsv();
    return await normalizeEscursioniRows(rows);
  } catch (error) {
    console.warn(
      `[escursioni] Impossibile caricare i dati API dal CSV: ${error instanceof Error ? error.message : error}`
    );
    return [];
  }
}

export function getCsvUrl() {
  return CSV_URL;
}

