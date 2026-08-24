import { h } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ArrowDownUp, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-preact";
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

function hasAdvancedFilters(filters) {
  return Boolean(
    filters.provincia ||
    filters.stagione ||
    filters.kmMin ||
    filters.kmMax ||
    filters.soloRifugio
  );
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
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    hasAdvancedFilters(normalizeInitialFilters(initialFilters))
  );
  const resultsHeadingRef = useRef(null);
  const shouldFocusResultsRef = useRef(false);
  const hasMountedUrlSyncRef = useRef(false);

  useEffect(() => {
    const syncFilters = () => {
      const nextFilters = parseFiltersFromSearch(window.location.search);
      if (hasAdvancedFilters(nextFilters)) setAdvancedOpen(true);
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

  const activeFilters = [
    filters.period && {
      key: "period",
      group: "primary",
      label: `Periodo: ${periodOptions.find((item) => item.value === filters.period)?.label || filters.period}`
    },
    filters.difficolta && {
      key: "difficolta",
      group: "primary",
      label: `Difficoltà: ${difficultyOptions.find((item) => item.value === filters.difficolta)?.label || filters.difficolta}`
    },
    filters.soloGea && { key: "soloGea", group: "primary", label: "Con Gea" },
    filters.provincia && { key: "provincia", group: "advanced", label: `Provincia: ${filters.provincia}` },
    filters.stagione && {
      key: "stagione",
      group: "advanced",
      label: `Stagione: ${seasonOptions.find((item) => item.value === filters.stagione)?.label || filters.stagione}`
    },
    (filters.kmMin || filters.kmMax) && {
      key: "km",
      group: "advanced",
      label: `Km: ${formatKilometerLabel(rangeKmMin)}–${formatKilometerLabel(rangeKmMax)}`
    },
    filters.soloRifugio && { key: "soloRifugio", group: "advanced", label: "Con rifugio" }
  ].filter(Boolean);

  const advancedFilterCount = activeFilters.filter((item) => item.group === "advanced").length;

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
    if (!hasMountedUrlSyncRef.current) {
      hasMountedUrlSyncRef.current = true;
      return;
    }

    const nextUrl = buildPaginationUrl(currentPage);
    window.history.replaceState({}, "", nextUrl);
    window.dispatchEvent(new CustomEvent("escursioni:filters-sync"));
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
    setFilters((current) => ({
      ...defaultFilters,
      search: current.search,
      sort: current.sort
    }));
  }

  function resetAllFilters() {
    const nextFilters = {
      ...defaultFilters,
      sort: filters.sort
    };

    setFilters(nextFilters);

    const params = new URLSearchParams();
    if (nextFilters.sort !== defaultFilters.sort) params.set("sort", nextFilters.sort);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
    window.dispatchEvent(new CustomEvent("escursioni:filters-sync"));
  }

  function clearFilter(key) {
    if (key === "km") {
      setFilters((current) => ({ ...current, kmMin: "", kmMax: "", page: 1 }));
      return;
    }

    updateField(key, defaultFilters[key]);
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
          margin-top: 0.7rem;
          border-radius: 9999px;
          border: 2px solid #3f6b4f;
          background: #fffdf7;
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
          border: 2px solid #3f6b4f;
          background: #fffdf7;
          box-shadow: 0 1px 2px rgba(25, 44, 33, 0.12);
          cursor: pointer;
        }
      `}</style>
      <div class="space-y-3">
        <details class="group border-y border-[#DDD7C9]">
          <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-1 py-2 text-left marker:hidden focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] sm:min-h-16 sm:py-3">
            <span class="flex flex-wrap items-baseline gap-x-1 text-base font-bold text-[#3F6B4F]">
              <span>Filtri</span>
              {activeFilters.length ? (
                <span class="text-sm font-semibold text-[#25251F]/70">
                  · {activeFilters.length} {activeFilters.length === 1 ? "attivo" : "attivi"}
                </span>
              ) : null}
            </span>
            <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center text-[#3F6B4F] transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none">
              <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
            </span>
          </summary>

          <div
            class={`px-1 pt-3 sm:px-2 sm:pt-4 ${
              advancedOpen
                ? "pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-6"
                : "pb-5 sm:pb-6"
            }`}
          >
            <div class="grid gap-3 md:grid-cols-3 md:gap-4">
              <label class="space-y-2 text-sm font-bold text-[#25251F]">
                <span>Periodo</span>
                <select
                  value={filters.period}
                  onInput={(event) => updateField("period", event.currentTarget.value)}
                  class="w-full rounded-2xl border border-[#DDD7C9] bg-[#FFFDF7] px-4 py-3 font-semibold text-[#25251F] outline-none transition-colors focus:border-[#3F6B4F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none"
                >
                  {periodOptions.map((item) => (
                    <option value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>

              <label class="space-y-2 text-sm font-bold text-[#25251F]">
                <span>Difficolt&agrave;</span>
                <select
                  value={filters.difficolta}
                  onInput={(event) => updateField("difficolta", event.currentTarget.value)}
                  class="w-full rounded-2xl border border-[#DDD7C9] bg-[#FFFDF7] px-4 py-3 font-semibold text-[#25251F] outline-none transition-colors focus:border-[#3F6B4F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none"
                >
                  {difficultyOptions.map((item) => (
                    <option value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>

              <div class="space-y-2 text-sm font-bold text-[#25251F]">
                <span>Con Gea</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={filters.soloGea}
                  onClick={() => updateField("soloGea", !filters.soloGea)}
                  class={`flex min-h-[54px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none ${
                    filters.soloGea
                      ? "border-[#3F6B4F] bg-[#3F6B4F] text-[#FFFDF7]"
                      : "border-[#DDD7C9] bg-[#FFFDF7] text-[#25251F]"
                  }`}
                >
                  <span>Con Gea</span>
                  <span
                    class={`relative h-7 w-12 rounded-full transition motion-reduce:transition-none ${
                      filters.soloGea ? "bg-white/30" : "bg-[#91A66D]/50"
                    }`}
                  >
                    <span
                      class={`absolute top-1 h-5 w-5 rounded-full bg-[#FFFDF7] shadow-sm transition motion-reduce:transition-none ${
                        filters.soloGea ? "left-6" : "left-1"
                      }`}
                    ></span>
                  </span>
                </button>
              </div>
            </div>

            <div class="mt-3 border-t border-[#DDD7C9] pt-2 md:mt-4 md:border-0 md:pt-0">
              <button
                type="button"
                aria-expanded={advancedOpen}
                aria-controls="advanced-filters"
                onClick={() => setAdvancedOpen((current) => !current)}
                class="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-bold text-[#3F6B4F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] md:hidden"
              >
                <span>
                  Altri criteri
                  {advancedFilterCount ? ` · ${advancedFilterCount}` : ""}
                </span>
                <ChevronDown
                  size={18}
                  strokeWidth={2}
                  aria-hidden="true"
                  class={`transition-transform duration-200 motion-reduce:transition-none ${advancedOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div
                id="advanced-filters"
                class={`${advancedOpen ? "grid" : "hidden"} mt-4 gap-4 md:grid md:grid-cols-2 xl:grid-cols-4`}
              >
                <label class="space-y-2 text-sm font-bold text-[#25251F]">
                  <span>Provincia</span>
                  <select
                    value={filters.provincia}
                    onInput={(event) => updateField("provincia", event.currentTarget.value)}
                    class="w-full rounded-2xl border border-[#DDD7C9] bg-[#FFFDF7] px-4 py-3 font-semibold text-[#25251F] outline-none transition-colors focus:border-[#3F6B4F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none"
                  >
                    <option value="">Tutte</option>
                    {provinceOptions.map((item) => (
                      <option value={item}>{item}</option>
                    ))}
                  </select>
                </label>

                <label class="space-y-2 text-sm font-bold text-[#25251F]">
                  <span>Stagione</span>
                  <select
                    value={filters.stagione}
                    onInput={(event) => updateField("stagione", event.currentTarget.value)}
                    class="w-full rounded-2xl border border-[#DDD7C9] bg-[#FFFDF7] px-4 py-3 font-semibold text-[#25251F] outline-none transition-colors focus:border-[#3F6B4F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none"
                  >
                    {seasonOptions.map((item) => (
                      <option value={item.value}>{item.label}</option>
                    ))}
                  </select>
                </label>

                <div class="space-y-2 text-sm font-bold text-[#25251F] xl:col-span-1">
                  <span>Km</span>
                  <div class="rounded-2xl border border-[#DDD7C9] bg-[#FFFDF7] px-4 py-4">
                    <div class="flex items-center justify-between gap-4 text-sm font-bold text-forest-700">
                      <span>{formatKilometerLabel(rangeKmMin)} km</span>
                      <span>{formatKilometerLabel(rangeKmMax)} km</span>
                    </div>
                    <div class="relative mt-3 h-11">
                      <div
                        class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-forest-100"
                        style={`background: linear-gradient(to right, #d7e4d2 0%, #d7e4d2 ${rangeStartPercent}%, #3f6b4f ${rangeStartPercent}%, #3f6b4f ${rangeEndPercent}%, #d7e4d2 ${rangeEndPercent}%, #d7e4d2 100%)`}
                      ></div>
                      <input
                        type="range"
                        min="0"
                        max={maxKm}
                        step="0.1"
                        value={rangeKmMin}
                        onInput={(event) => updateKmRange("min", event.currentTarget.value)}
                        class="km-range-input km-range-input--min absolute inset-0 z-10 w-full appearance-none bg-transparent outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F]"
                        aria-label="Km minimi"
                      />
                      <input
                        type="range"
                        min="0"
                        max={maxKm}
                        step="0.1"
                        value={rangeKmMax}
                        onInput={(event) => updateKmRange("max", event.currentTarget.value)}
                        class="km-range-input km-range-input--max absolute inset-0 z-20 w-full appearance-none bg-transparent outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F]"
                        aria-label="Km massimi"
                      />
                    </div>
                  </div>
                </div>

                <div class="space-y-2 text-sm font-bold text-[#25251F]">
                  <span>Con rifugio</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={filters.soloRifugio}
                    onClick={() => updateField("soloRifugio", !filters.soloRifugio)}
                    class={`flex min-h-[54px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none ${
                      filters.soloRifugio
                        ? "border-[#3F6B4F] bg-[#3F6B4F] text-[#FFFDF7]"
                        : "border-[#DDD7C9] bg-[#FFFDF7] text-[#25251F]"
                    }`}
                  >
                    <span>Con rifugio</span>
                    <span
                      class={`relative h-7 w-12 rounded-full transition motion-reduce:transition-none ${
                        filters.soloRifugio ? "bg-white/30" : "bg-[#91A66D]/50"
                      }`}
                    >
                      <span
                        class={`absolute top-1 h-5 w-5 rounded-full bg-[#FFFDF7] shadow-sm transition motion-reduce:transition-none ${
                          filters.soloRifugio ? "left-6" : "left-1"
                        }`}
                      ></span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </details>

        {activeFilters.length ? (
          <div class="flex flex-wrap items-center gap-2" aria-label="Filtri attivi">
            {activeFilters.map((item) => (
              <button
                type="button"
                onClick={() => clearFilter(item.key)}
                aria-label={`Rimuovi filtro ${item.label}`}
                class="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#DDD7C9] bg-[#FFFDF7]/70 px-3 py-2 text-sm font-bold text-[#3F6B4F] transition-colors hover:bg-[#FFFDF7] hover:text-[#25251F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F]"
              >
                <span>{item.label}</span>
                <X size={15} strokeWidth={2.4} aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              class="inline-flex min-h-11 items-center px-2 text-sm font-bold text-terracotta-700 underline decoration-terracotta-300 underline-offset-4 transition-colors hover:text-terracotta-800 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F]"
            >
              Azzera filtri
            </button>
          </div>
        ) : null}
      </div>

      <section class="space-y-4" aria-labelledby="results-heading">
        <div class="flex items-center justify-between gap-2 sm:gap-3">
          <h2
            id="results-heading"
            ref={resultsHeadingRef}
            tabindex="-1"
            aria-live="polite"
            aria-atomic="true"
            class="min-w-0 whitespace-nowrap text-xl font-extrabold text-[#25251f] outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] sm:text-2xl"
          >
            {filtered.length} {filtered.length === 1 ? "Escursione" : "Escursioni"}
          </h2>
          <div class="relative w-48 shrink-0 sm:w-auto sm:min-w-[13rem]">
            <span
              class="pointer-events-none absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[6px] bg-[#F2C94C] text-[#25251F]"
              aria-hidden="true"
            >
              <ArrowDownUp size={15} strokeWidth={2.4} />
            </span>
            <select
              aria-label="Ordina risultati"
              value={filters.sort}
              onInput={(event) => updateField("sort", event.currentTarget.value)}
              class="min-h-12 w-full appearance-none rounded-[10px] border border-[#DDD7C9] bg-[#FFFDF7] py-3 pl-11 pr-9 text-sm font-extrabold text-[#3F6B4F] outline-none transition-colors hover:border-[#91A66D] focus:border-[#3F6B4F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none"
            >
              {sortOptions.map((item) => (
                <option value={item.value}>{item.label}</option>
              ))}
            </select>
            <span
              class="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-[#3F6B4F]"
              aria-hidden="true"
            >
              <ChevronDown size={18} strokeWidth={2.4} />
            </span>
          </div>
        </div>

        {paginated.length ? (
          <div class="grid gap-x-6 gap-y-10 md:grid-cols-2 md:gap-y-12 xl:grid-cols-3">
            {paginated.map((item) => (
              <CardEscursione escursione={item} />
            ))}
          </div>
        ) : (
          <div class="rounded-[14px] border border-[#DDD7C9] bg-[#FFFDF7]/70 p-6 text-center text-[#25251F] sm:p-8">
            <p class="mx-auto max-w-xl leading-relaxed">
              Nessuna escursione corrisponde alla ricerca e ai filtri attuali.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              class="mt-4 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[#3F6B4F] px-[18px] py-3 text-sm font-bold text-[#FFFDF7] transition-colors hover:bg-[#25251F] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none"
            >
              Azzera ricerca e filtri
            </button>
          </div>
        )}

        {filtered.length > pageSize && (
          <nav aria-label="Pagine dei risultati" class="flex items-center justify-center gap-2 overflow-x-auto pb-1">
            {currentPage === 1 ? (
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DDD7C9] text-[#3F6B4F] opacity-40">
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
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DDD7C9] bg-[#FFFDF7] text-[#3F6B4F] transition-colors hover:bg-terracotta-50 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none"
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
                class={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none ${
                  page === currentPage
                    ? "bg-[#E66A4E] text-[#FFFDF7]"
                    : "bg-[#FFFDF7] text-[#3F6B4F] hover:bg-terracotta-50"
                }`}
              >
                {page}
              </a>
              ))}
            </div>

            {currentPage === totalPages ? (
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DDD7C9] text-[#3F6B4F] opacity-40">
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
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#DDD7C9] bg-[#FFFDF7] text-[#3F6B4F] transition-colors hover:bg-terracotta-50 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#3F6B4F] motion-reduce:transition-none"
              >
                <ChevronRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </a>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}

