import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ChevronLeft, ChevronRight } from "lucide-preact";
import CardEscursione from "./CardEscursione.jsx";

const seasonOptions = [
  { value: "", label: "Tutte" },
  { value: "primavera", label: "Primavera" },
  { value: "estate", label: "Estate" },
  { value: "autunno", label: "Autunno" },
  { value: "inverno", label: "Inverno" }
];

const difficultyOptions = [
  { value: "", label: "Tutte" },
  { value: "passeggiate", label: "Passeggiate" },
  { value: "escursioni", label: "Escursioni" }
];

const sortOptions = [
  { value: "date-desc", label: "Più recenti" },
  { value: "date-asc", label: "Meno recenti" },
  { value: "km-desc", label: "Più lunghe" },
  { value: "km-asc", label: "Più corte" },
  { value: "gea-rating", label: "Gea Rating" }
];

const periodOptions = [
  { value: "", label: "Sempre" },
  { value: "last-month", label: "Ultimo mese" },
  { value: "year-start", label: "Da inizio anno" }
];

const pageSize = 6;

const defaultFilters = {
  search: "",
  period: "",
  kmMin: "",
  kmMax: "",
  difficolta: "",
  stagione: "",
  provincia: "",
  soloRifugio: false,
  soloGea: false,
  sort: "date-desc",
  page: 1
};

function parseArrayParam(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? String(value).split(",").filter(Boolean) : [];
}

function normalizePage(value) {
  const page = Number(value || "1");
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function normalizeInitialFilters(input = {}) {
  return {
    ...defaultFilters,
    ...input,
    search: String(input.search || input.q || "").trim(),
    period: input.period || "",
    kmMin: input.kmMin || "",
    kmMax: input.kmMax || "",
    difficolta: input.difficolta || "",
    stagione: input.stagione || "",
    provincia: String(input.provincia || input.tag || "").trim(),
    soloRifugio: input.soloRifugio === true || input.soloRifugio === "1" || input.soloRifugio === 1,
    soloGea: input.soloGea === true || input.soloGea === "1" || input.soloGea === 1,
    sort: input.sort || "date-desc",
    page: normalizePage(input.page)
  };
}

function parseFiltersFromSearch(search) {
  const params = new URLSearchParams(search);
  return normalizeInitialFilters({
    search: params.get("q") || "",
    period: params.get("period") || "",
    kmMin: params.get("kmMin") || "",
    kmMax: params.get("kmMax") || "",
    difficolta: params.get("difficolta") || "",
    stagione: params.get("stagione") || "",
    provincia: params.get("provincia") || params.get("tag") || "",
    soloRifugio: params.get("soloRifugio") === "1",
    soloGea: params.get("soloGea") === "1",
    sort: params.get("sort") || "date-desc",
    page: params.get("page") || "1"
  });
}

function areFiltersEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getSeasonFromDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const month = date.getMonth() + 1;
  if (month === 12 || month <= 2) return "inverno";
  if (month >= 3 && month <= 5) return "primavera";
  if (month >= 6 && month <= 8) return "estate";
  return "autunno";
}

function parseDurationMinutes(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return 0;

  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    return Number(match[1]) * 60 + Number(match[2]);
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getDifficultyGroup(item) {
  const normalized = String(item?.difficolta || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (normalized.includes("passegg")) return "passeggiate";
  if (normalized) return "escursioni";

  const km = Number(item?.km) || 0;
  const dislivello = Number(item?.dislivello) || 0;
  const durataMinuti = Number(item?.durataMinuti) || parseDurationMinutes(item?.durata);

  if (km === 0 && dislivello === 0 && durataMinuti === 0) return "";
  if (dislivello >= 200 || km >= 6.5 || durataMinuti >= 100) return "escursioni";
  return "passeggiate";
}
function getPeriodStart(period) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (period === "last-month") {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return start.getTime();
  }

  if (period === "year-start") {
    return new Date(now.getFullYear(), 0, 1).getTime();
  }

  return null;
}

function getGeaRatingValue(item) {
  const rawCandidates = [item?.gea_rating, item?.geaRating, item?.rating_gea, item?.voto];
  const rawValue = rawCandidates.find((candidate) => candidate !== undefined && candidate !== null && candidate !== "");
  const numeric = Number(rawValue);
  return Number.isFinite(numeric) ? numeric : 0;
}
function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getSearchableText(item) {
  const values = [
    item?.titolo,
    item?.luogo,
    item?.provincia,
    item?.descrizione,
    item?.note,
    item?.nome_rifugio,
    Array.isArray(item?.tag) ? item.tag.join(" ") : item?.tag,
    Array.isArray(item?.partecipanti) ? item.partecipanti.join(" ") : item?.partecipanti
  ];

  return normalizeSearchText(values.filter(Boolean).join(" "));
}

function formatKilometerLabel(value) {
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(Number(value) || 0);
}

function matchesFilters(item, filters) {
  const date = new Date(item.data).getTime();
  const periodStart = getPeriodStart(filters.period);
  const kmMin = filters.kmMin ? Number(filters.kmMin) : null;
  const kmMax = filters.kmMax ? Number(filters.kmMax) : null;

  const normalizedSearch = normalizeSearchText(filters.search);

  const matchSearch = normalizedSearch
    ? getSearchableText(item).includes(normalizedSearch)
    : true;
  const matchPeriod = periodStart ? date >= periodStart : true;
  const matchKmMin = kmMin !== null ? item.km >= kmMin : true;
  const matchKmMax = kmMax !== null ? item.km <= kmMax : true;
  const matchDifficulty = filters.difficolta
    ? getDifficultyGroup(item) === filters.difficolta
    : true;
  const matchSeason = filters.stagione ? getSeasonFromDate(item.data) === filters.stagione : true;
  const matchProvince = filters.provincia
    ? String(item.provincia || "").toLowerCase() === filters.provincia.toLowerCase()
    : true;
  const matchRifugio = filters.soloRifugio ? item.rifugio : true;
  const matchGea = filters.soloGea ? item.cane : true;

  return (
    matchSearch &&
    matchPeriod &&
    matchKmMin &&
    matchKmMax &&
    matchDifficulty &&
    matchSeason &&
    matchProvince &&
    matchRifugio &&
    matchGea
  );
}

function sortItems(items, sort) {
  const list = [...items];

  switch (sort) {
    case "date-asc":
      return list.sort((a, b) => new Date(a.data) - new Date(b.data));
    case "km-desc":
      return list.sort((a, b) => b.km - a.km);
    case "km-asc":
      return list.sort((a, b) => a.km - b.km);
    case "gea-rating":
      return list.sort((a, b) => getGeaRatingValue(b) - getGeaRatingValue(a) || new Date(b.data) - new Date(a.data));
    case "date-desc":
    default:
      return list.sort((a, b) => new Date(b.data) - new Date(a.data));
  }
}
export default function Filtri({ escursioni = [], initialFilters = defaultFilters }) {
  const [filters, setFilters] = useState(() => normalizeInitialFilters(initialFilters));
  const resultsHeadingRef = useRef(null);
  const shouldFocusResultsRef = useRef(false);

  useEffect(() => {
    const syncFilters = () => {
      const nextFilters = parseFiltersFromSearch(window.location.search);
      setFilters((current) => (areFiltersEqual(current, nextFilters) ? current : nextFilters));
    };

    syncFilters();
    window.addEventListener("popstate", syncFilters);
    window.addEventListener("escursioni:filters-sync", syncFilters);

    return () => {
      window.removeEventListener("popstate", syncFilters);
      window.removeEventListener("escursioni:filters-sync", syncFilters);
    };
  }, []);

  const provinceOptions = useMemo(() => {
    const provinces = [
      ...new Set(
        escursioni
          .map((item) => String(item.provincia || "").trim())
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b, "it"));

    if (filters.provincia && !provinces.includes(filters.provincia)) {
      return [filters.provincia, ...provinces].sort((a, b) => a.localeCompare(b, "it"));
    }

    return provinces;
  }, [escursioni, filters.provincia]);

  const maxKm = useMemo(() => {
    const maxValue = Math.max(0, ...escursioni.map((item) => Number(item.km) || 0));
    return Math.ceil(maxValue * 10) / 10;
  }, [escursioni]);

  const selectedKmMin = filters.kmMin === "" ? 0 : Math.max(0, Math.min(Number(filters.kmMin) || 0, maxKm));
  const selectedKmMax = filters.kmMax === "" ? maxKm : Math.max(0, Math.min(Number(filters.kmMax) || 0, maxKm));
  const rangeKmMin = Math.min(selectedKmMin, selectedKmMax);
  const rangeKmMax = Math.max(selectedKmMin, selectedKmMax);
  const rangeStartPercent = maxKm > 0 ? (rangeKmMin / maxKm) * 100 : 0;
  const rangeEndPercent = maxKm > 0 ? (rangeKmMax / maxKm) * 100 : 100;

  const filtered = useMemo(() => {
    return sortItems(
      escursioni.filter((item) => matchesFilters(item, filters)),
      filters.sort
    );
  }, [escursioni, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (filters.page !== currentPage) {
      setFilters((current) => ({ ...current, page: currentPage }));
    }
  }, [currentPage, filters.page]);

  function buildPaginationUrl(page) {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.period) params.set("period", filters.period);
    if (filters.kmMin) params.set("kmMin", filters.kmMin);
    if (filters.kmMax) params.set("kmMax", filters.kmMax);
    if (filters.difficolta) params.set("difficolta", filters.difficolta);
    if (filters.stagione) params.set("stagione", filters.stagione);
    if (filters.provincia) params.set("provincia", filters.provincia);
    if (filters.soloRifugio) params.set("soloRifugio", "1");
    if (filters.soloGea) params.set("soloGea", "1");
    if (filters.sort && filters.sort !== "date-desc") params.set("sort", filters.sort);
    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    const path = typeof window === "undefined" ? "/escursioni" : window.location.pathname;
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    return `${path}${query ? `?${query}` : ""}${hash}`;
  }

  useEffect(() => {
    const nextUrl = buildPaginationUrl(currentPage);
    window.history.replaceState({}, "", nextUrl);
  }, [filters, currentPage]);

  useEffect(() => {
    if (!shouldFocusResultsRef.current || !resultsHeadingRef.current) return;

    shouldFocusResultsRef.current = false;
    resultsHeadingRef.current.focus({ preventScroll: true });
    resultsHeadingRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  function goToPage(page) {
    shouldFocusResultsRef.current = true;
    setFilters((current) => ({ ...current, page }));
  }

  function updateField(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: 1
    }));
  }

  function updateKmRange(boundary, value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;

    setFilters((current) => {
      const currentMin = current.kmMin === "" ? 0 : Number(current.kmMin) || 0;
      const currentMax = current.kmMax === "" ? maxKm : Number(current.kmMax) || maxKm;
      const safeValue = Math.max(0, Math.min(numeric, maxKm));
      const nextMin = boundary === "min" ? Math.min(safeValue, currentMax) : currentMin;
      const nextMax = boundary === "max" ? Math.max(safeValue, currentMin) : currentMax;

      return {
        ...current,
        kmMin: nextMin <= 0 ? "" : String(Math.round(nextMin * 10) / 10),
        kmMax: nextMax >= maxKm ? "" : String(Math.round(nextMax * 10) / 10),
        page: 1
      };
    });
  }

  function resetFilters() {
    setFilters(defaultFilters);
  }

  return (
    <div class="space-y-8">
      <style>{`
        .km-range-input {
          pointer-events: none;
        }

        .km-range-input::-webkit-slider-runnable-track {
          height: 100%;
          background: transparent;
        }

        .km-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto;
          width: 1.35rem;
          height: 1.35rem;
          margin-top: 0.35rem;
          border-radius: 9999px;
          border: 2px solid #94b78e;
          background: #f7f4ec;
          box-shadow: 0 1px 2px rgba(25, 44, 33, 0.12);
          cursor: pointer;
        }

        .km-range-input::-moz-range-track {
          height: 100%;
          background: transparent;
        }

        .km-range-input::-moz-range-thumb {
          pointer-events: auto;
          width: 1.35rem;
          height: 1.35rem;
          border-radius: 9999px;
          border: 2px solid #94b78e;
          background: #f7f4ec;
          box-shadow: 0 1px 2px rgba(25, 44, 33, 0.12);
          cursor: pointer;
        }
      `}</style>
      <details class="group overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-card backdrop-blur">
        <summary class="flex min-h-[5.5rem] cursor-pointer list-none items-center justify-between gap-4 rounded-[2rem] px-5 py-4 text-left marker:hidden sm:min-h-[5.75rem] sm:px-6 sm:py-4">
          <span class="text-lg font-black text-forest-800 sm:text-xl">Filtra le escursioni</span>
          <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sand bg-cream text-xl font-semibold leading-none text-forest-700 transition group-open:rotate-45">
            +
          </span>
        </summary>

        <div class="flex justify-end px-5 pb-5 sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={resetFilters}
            class="inline-flex items-center justify-center rounded-full border border-terracotta-200 px-4 py-2 text-sm font-bold text-terracotta-700 transition hover:bg-terracotta-50"
          >
            Reset filtri
          </button>
        </div>

        <div class="grid gap-4 px-5 pb-5 md:grid-cols-2 xl:grid-cols-4 sm:px-6 sm:pb-6">
          <label class="space-y-2 text-sm font-bold text-forest-800">
            <span>Periodo</span>
            <select
              value={filters.period}
              onInput={(event) => updateField("period", event.currentTarget.value)}
              class="w-full rounded-2xl border border-sand bg-cream px-4 py-3 font-semibold text-forest-800 outline-none transition focus:border-terracotta-400"
            >
              {periodOptions.map((item) => (
                <option value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label class="space-y-2 text-sm font-bold text-forest-800">
            <span>Difficolt&agrave;</span>
            <select
              value={filters.difficolta}
              onInput={(event) => updateField("difficolta", event.currentTarget.value)}
              class="w-full rounded-2xl border border-sand bg-cream px-4 py-3 font-semibold text-forest-800 outline-none transition focus:border-terracotta-400"
            >
              {difficultyOptions.map((item) => (
                <option value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <label class="space-y-2 text-sm font-bold text-forest-800">
            <span>Provincia</span>
            <select
              value={filters.provincia}
              onInput={(event) => updateField("provincia", event.currentTarget.value)}
              class="w-full rounded-2xl border border-sand bg-cream px-4 py-3 font-semibold text-forest-800 outline-none transition focus:border-terracotta-400"
            >
              <option value="">Tutte</option>
              {provinceOptions.map((item) => (
                <option value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label class="space-y-2 text-sm font-bold text-forest-800">
            <span>Stagione</span>
            <select
              value={filters.stagione}
              onInput={(event) => updateField("stagione", event.currentTarget.value)}
              class="w-full rounded-2xl border border-sand bg-cream px-4 py-3 font-semibold text-forest-800 outline-none transition focus:border-terracotta-400"
            >
              {seasonOptions.map((item) => (
                <option value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          <div class="space-y-2 text-sm font-bold text-forest-800 md:col-span-2 xl:col-span-2">
            <span>Km</span>
            <div class="rounded-[1.5rem] border border-sand bg-cream px-4 py-4">
              <div class="flex items-center justify-between gap-4 text-sm font-bold text-forest-700">
                <span>{formatKilometerLabel(rangeKmMin)} km</span>
                <span>{formatKilometerLabel(rangeKmMax)} km</span>
              </div>
              <div class="relative mt-4 h-8">
                <div
                  class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-forest-100"
                  style={`background: linear-gradient(to right, #d7e4d2 0%, #d7e4d2 ${rangeStartPercent}%, #315f3d ${rangeStartPercent}%, #315f3d ${rangeEndPercent}%, #d7e4d2 ${rangeEndPercent}%, #d7e4d2 100%)`}
                ></div>
                <input
                  type="range"
                  min="0"
                  max={maxKm}
                  step="0.1"
                  value={rangeKmMin}
                  onInput={(event) => updateKmRange("min", event.currentTarget.value)}
                  class="km-range-input km-range-input--min absolute inset-0 z-10 w-full appearance-none bg-transparent"
                  aria-label="Km minimi"
                />
                <input
                  type="range"
                  min="0"
                  max={maxKm}
                  step="0.1"
                  value={rangeKmMax}
                  onInput={(event) => updateKmRange("max", event.currentTarget.value)}
                  class="km-range-input km-range-input--max absolute inset-0 z-20 w-full appearance-none bg-transparent"
                  aria-label="Km massimi"
                />
              </div>
            </div>
          </div>

          <label class="space-y-2 text-sm font-bold text-forest-800 md:col-span-2 xl:col-span-1">
            <span>Con rifugio</span>
            <button
              type="button"
              role="switch"
              aria-checked={filters.soloRifugio}
              onClick={() => updateField("soloRifugio", !filters.soloRifugio)}
              class={`flex min-h-[54px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                filters.soloRifugio
                  ? "border-forest-700 bg-forest-700 text-white"
                  : "border-sand bg-cream text-forest-800"
              }`}
            >
              <span>Con rifugio</span>
              <span
                class={`relative h-7 w-12 rounded-full transition ${
                  filters.soloRifugio ? "bg-white/30" : "bg-forest-200"
                }`}
              >
                <span
                  class={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    filters.soloRifugio ? "left-6" : "left-1"
                  }`}
                ></span>
              </span>
            </button>
          </label>

          <label class="space-y-2 text-sm font-bold text-forest-800 md:col-span-2 xl:col-span-1">
            <span>Con Gea</span>
            <button
              type="button"
              role="switch"
              aria-checked={filters.soloGea}
              onClick={() => updateField("soloGea", !filters.soloGea)}
              class={`flex min-h-[54px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                filters.soloGea
                  ? "border-forest-700 bg-forest-700 text-white"
                  : "border-sand bg-cream text-forest-800"
              }`}
            >
              <span>Con Gea</span>
              <span
                class={`relative h-7 w-12 rounded-full transition ${
                  filters.soloGea ? "bg-white/30" : "bg-forest-200"
                }`}
              >
                <span
                  class={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    filters.soloGea ? "left-6" : "left-1"
                  }`}
                ></span>
              </span>
            </button>
          </label>
        </div>
      </details>

      <section class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 ref={resultsHeadingRef} tabindex="-1" class="text-2xl font-black text-forest-800 outline-none">Risultati ({filtered.length})</h3>
          </div>
          <div class="sm:min-w-[240px]">
            <select
              aria-label="Ordina risultati"
              value={filters.sort}
              onInput={(event) => updateField("sort", event.currentTarget.value)}
              class="w-full rounded-2xl border border-sand bg-cream px-4 py-3 font-semibold text-forest-800 outline-none transition focus:border-terracotta-400"
            >
              {sortOptions.map((item) => (
                <option value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
        </div>

        {paginated.length ? (
          <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {paginated.map((item) => (
              <CardEscursione escursione={item} />
            ))}
          </div>
        ) : (
          <div class="rounded-[1.75rem] border border-dashed border-terracotta-300 bg-white/70 p-8 text-center text-forest-700">
            Nessuna escursione corrisponde ai filtri attuali. Prova ad allargare i criteri.
          </div>
        )}

        {filtered.length > pageSize && (
          <div class="flex items-center justify-center gap-2 overflow-x-auto pb-1">
            {currentPage === 1 ? (
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sand text-forest-700 opacity-40">
                <ChevronLeft size={18} strokeWidth={2.4} aria-hidden="true" />
              </span>
            ) : (
              <a
                href={buildPaginationUrl(currentPage - 1)}
                onClick={(event) => {
                  event.preventDefault();
                  goToPage(currentPage - 1);
                }}
                aria-label="Pagina precedente"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sand bg-white text-forest-700 transition hover:bg-terracotta-50"
              >
                <ChevronLeft size={18} strokeWidth={2.4} aria-hidden="true" />
              </a>
            )}

            <div class="flex items-center gap-2 whitespace-nowrap">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <a
                href={buildPaginationUrl(page)}
                onClick={(event) => {
                  event.preventDefault();
                  goToPage(page);
                }}
                aria-current={page === currentPage ? "page" : undefined}
                class={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition ${
                  page === currentPage
                    ? "bg-terracotta-500 text-white"
                    : "bg-white text-forest-700 hover:bg-terracotta-50"
                }`}
              >
                {page}
              </a>
              ))}
            </div>

            {currentPage === totalPages ? (
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sand text-forest-700 opacity-40">
                <ChevronRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </span>
            ) : (
              <a
                href={buildPaginationUrl(currentPage + 1)}
                onClick={(event) => {
                  event.preventDefault();
                  goToPage(currentPage + 1);
                }}
                aria-label="Pagina successiva"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sand bg-white text-forest-700 transition hover:bg-terracotta-50"
              >
                <ChevronRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

