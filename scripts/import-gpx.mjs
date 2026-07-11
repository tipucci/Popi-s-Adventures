import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const [, , inputPath] = process.argv;

function fail(message) {
  console.error(`Errore: ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`Warning: ${message}`);
}

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function getFirstTagText(xml, tagName) {
  const match = xml.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function getFirstNestedTagText(xml, parentTag, tagName) {
  const parentMatch = xml.match(new RegExp(`<${parentTag}(?:\\s[^>]*)?>([\\s\\S]*?)</${parentTag}>`, "i"));
  return parentMatch ? getFirstTagText(parentMatch[1], tagName) : "";
}

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

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatNumber(value, decimals) {
  if (!Number.isFinite(value)) return "";
  return String(Number(value.toFixed(decimals)));
}

function csvEscape(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function haversineMeters(from, to) {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseTrackpoints(xml) {
  const points = [];
  const trackpointPattern = /<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>/gi;
  let match;

  while ((match = trackpointPattern.exec(xml)) !== null) {
    const [, attributes, body] = match;
    const latMatch = attributes.match(/\blat=["']([^"']+)["']/i);
    const lngMatch = attributes.match(/\b(?:lon|lng)=["']([^"']+)["']/i);
    if (!latMatch || !lngMatch) continue;

    const lat = Number.parseFloat(latMatch[1]);
    const lng = Number.parseFloat(lngMatch[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const elevationText = getFirstTagText(body, "ele");
    const timeText = getFirstTagText(body, "time");
    const elevation = elevationText ? Number.parseFloat(elevationText) : Number.NaN;
    const time = timeText ? new Date(timeText) : null;

    points.push({
      lat,
      lng,
      elevation,
      time: time && !Number.isNaN(time.getTime()) ? time : null
    });
  }

  return points;
}

function calculateDistanceKm(points) {
  let meters = 0;
  for (let index = 1; index < points.length; index += 1) {
    meters += haversineMeters(points[index - 1], points[index]);
  }
  return meters / 1000;
}

function calculateElevationGain(points) {
  let gain = 0;
  let previousElevation = Number.NaN;

  points.forEach((point) => {
    if (!Number.isFinite(point.elevation)) return;
    if (Number.isFinite(previousElevation) && point.elevation > previousElevation) {
      gain += point.elevation - previousElevation;
    }
    previousElevation = point.elevation;
  });

  return gain;
}

function calculateDurationMinutes(points) {
  const times = points.map((point) => point.time).filter(Boolean);
  if (times.length < 2) return Number.NaN;

  const first = times[0].getTime();
  const last = times[times.length - 1].getTime();
  const duration = Math.round((last - first) / 60000);
  return duration > 0 ? duration : Number.NaN;
}

async function main() {
  if (!inputPath) {
    fail("passa un file GPX. Esempio: npm run import:gpx -- ./path/file.gpx");
  }

  const absolutePath = path.resolve(process.cwd(), inputPath);
  if (!existsSync(absolutePath)) {
    fail(`file non trovato: ${inputPath}`);
  }

  if (path.extname(absolutePath).toLowerCase() !== ".gpx") {
    fail("il file deve avere estensione .gpx");
  }

  const xml = await readFile(absolutePath, "utf8");
  const points = parseTrackpoints(xml);
  if (!points.length) {
    fail("nessun trackpoint trovato nel GPX. Verifica che il file contenga elementi <trkpt>.");
  }

  const title =
    getFirstNestedTagText(xml, "trk", "name") ||
    getFirstNestedTagText(xml, "metadata", "name") ||
    path.basename(absolutePath, path.extname(absolutePath));
  const firstPointWithTime = points.find((point) => point.time);
  const metadataDate = getFirstNestedTagText(xml, "metadata", "time");
  const fallbackDate = metadataDate ? new Date(metadataDate) : null;
  const date = formatDate(firstPointWithTime?.time || fallbackDate);

  const hasTimestamps = points.some((point) => point.time);
  const hasElevation = points.some((point) => Number.isFinite(point.elevation));
  if (!hasTimestamps) warn("timestamp mancanti: imported_duration_minutes e date potrebbero essere vuoti.");
  if (!hasElevation) warn("elevation mancante: imported_elevation_gain sara vuoto.");

  const normalizedTitle = title || "Escursione";
  const slugDate = date || "senza-data";
  const slug = `${slugDate}-${slugify(normalizedTitle) || "escursione"}`;
  const distanceKm = calculateDistanceKm(points);
  const elevationGain = hasElevation ? calculateElevationGain(points) : Number.NaN;
  const durationMinutes = hasTimestamps ? calculateDurationMinutes(points) : Number.NaN;
  const firstPoint = points[0];

  const row = {
    slug,
    title: normalizedTitle,
    date,
    imported_distance_km: formatNumber(distanceKm, 1),
    imported_elevation_gain: formatNumber(elevationGain, 0),
    imported_duration_minutes: Number.isFinite(durationMinutes) ? String(durationMinutes) : "",
    imported_lat: formatNumber(firstPoint.lat, 5),
    imported_lng: formatNumber(firstPoint.lng, 5),
    gpx_source: path.basename(absolutePath)
  };

  const headers = Object.keys(row);
  const values = headers.map((header) => csvEscape(row[header]));

  console.log("\nCSV per Google Sheets:");
  console.log(headers.join(","));
  console.log(values.join(","));
  console.log("\nJSON debug:");
  console.log(JSON.stringify(row, null, 2));
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
