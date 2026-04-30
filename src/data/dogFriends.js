const dogImageModules = import.meta.glob("../assets/images/dogs/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}", {
  eager: true,
  import: "default"
});

const DOG_FRIENDS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT29EGlSwQbCjoc9lnwcS3x7VX8XommgfcI9qrFsrCZzQmlNEjoYqKq5YU1ZKhgHKnidVX8LWTLmTuT/pub?gid=1886783810&single=true&output=csv";

const DOG_FRIENDS_FETCH_TIMEOUT_MS = 8000;
let dogFriendsPromise;

const FALLBACK_DOG_FRIENDS_CSV = `Nome,Razza,Peso,Descrizione,Tag,Data di nascita
Gea,Border Collie,17kg,"La padrona di casa: energia, intelligenza e voglia di sentiero.","energia pura, curiosa, fedelissima",06/02/2024
Luffy,Podenco,,"Agile, curioso e sempre pronto a partire in avanscoperta.","scattante, solare, esploratore",`;

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

export function slugifyDogName(name = "") {
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
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
      if (char === "\r" && next === "\n") index += 1;
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
      normalizedHeaders.forEach((header, headerIndex) => {
        item[header] = (entry[headerIndex] || "").trim();
      });
      return item;
    });
}

function parseCommaSeparatedList(value) {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeDate(value = "") {
  const text = String(value).trim();
  if (!text) return "";

  const euMatch = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (euMatch) {
    const [, day, month, rawYear] = euMatch;
    const year = rawYear.length === 2 ? Number(`20${rawYear}`) : Number(rawYear);
    return `${String(year).padStart(4, "0")}-${String(Number(month)).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
  }

  const isoMatch = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${String(year).padStart(4, "0")}-${String(Number(month)).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function toOptionalNumber(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDogFriend(raw) {
  const name = String(raw.nome || "").trim();
  if (!name) return null;

  const id = slugifyDogName(name);
  const birthDate = normalizeDate(raw.data_di_nascita || raw.data_nascita || "");

  return {
    id,
    name,
    breed: String(raw.razza || "").trim(),
    description: String(raw.descrizione || "").trim() || "Scheda in aggiornamento: presto arrivano piu' dettagli su questo compagno di avventure.",
    weightKg: toOptionalNumber(raw.peso),
    traits: parseCommaSeparatedList(raw.tag),
    birthDate,
    image: `${id}.jpg`
  };
}

async function fetchDogFriendsCsvRows() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOG_FRIENDS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(DOG_FRIENDS_CSV_URL, {
      signal: controller.signal,
      headers: {
        Accept: "text/csv,text/plain;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      throw new Error(`Dog friends CSV responded with ${response.status}`);
    }

    return parseCsv(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}

function getFallbackDogFriends() {
  return parseCsv(FALLBACK_DOG_FRIENDS_CSV)
    .map(normalizeDogFriend)
    .filter(Boolean);
}

export async function getDogFriends() {
  if (!dogFriendsPromise) {
    dogFriendsPromise = fetchDogFriendsCsvRows()
      .then((rows) => rows.map(normalizeDogFriend).filter(Boolean))
      .catch((error) => {
        console.warn(
          `[dog-friends] Impossibile caricare il CSV dei cani, uso il fallback locale: ${error instanceof Error ? error.message : error}`
        );
        return getFallbackDogFriends();
      });
  }

  return dogFriendsPromise;
}

export function getDogFriendByName(name = "", dogs = []) {
  const id = slugifyDogName(name);
  return dogs.find((dog) => dog.id === id) || null;
}

export function getDogFriendById(id = "", dogs = []) {
  const normalizedId = slugifyDogName(id);
  return dogs.find((dog) => dog.id === normalizedId) || null;
}

export function getDogFriendImage(imageName = "") {
  if (!imageName) return null;

  const normalizedName = String(imageName).trim().toLowerCase();
  const directMatch = dogImageModules[`../assets/images/dogs/${imageName}`];
  if (directMatch) return directMatch;

  const fallbackMatch = Object.entries(dogImageModules).find(([path]) => {
    const fileName = path.split("/").at(-1)?.toLowerCase() || "";
    return fileName === normalizedName;
  });

  return fallbackMatch?.[1] || null;
}

export function getDogFriendsCsvUrl() {
  return DOG_FRIENDS_CSV_URL;
}
