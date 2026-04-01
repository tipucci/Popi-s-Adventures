import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import CardEscursione from "./CardEscursione.jsx";

const participantOptions = [
  { value: "meg", label: "Meg" },
  { value: "tizi", label: "Tizi" },
  { value: "gea", label: "Gea" }
];

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
  { value: "date-desc", label: "Pi\u00F9 recenti" },
  { value: "date-asc", label: "Meno recenti" },
  { value: "km-desc", label: "Pi\u00F9 lunghe" },
  { value: "km-asc", label: "Pi\u00F9 corte" }
];

const pageSize = 6;

const defaultFilters = {
  dateFrom: "",
  dateTo: "",
  kmMin: "",
  kmMax: "",
  difficolta: "",
  stagione: "",
  provincia: "",
  soloRifugio: false,
  partecipanti: [],
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
    dateFrom: input.dateFrom || "",
    dateTo: input.dateTo || "",
    kmMin: input.kmMin || "",
    kmMax: input.kmMax || "",
    difficolta: input.difficolta || "",
    stagione: input.stagione || "",
    provincia: String(input.provincia || input.tag || "").trim(),
    soloRifugio: input.soloRifugio === true || input.soloRifugio === "1" || input.soloRifugio === 1,
    partecipanti: parseArrayParam(input.partecipanti),
    sort: input.sort || "date-desc",
    page: normalizePage(input.page)
  };
}

function parseFiltersFromSearch(search) {
  const params = new URLSearchParams(search);
  return normalizeInitialFilters({
    dateFrom: params.get("dateFrom") || "",
    dateTo: params.get("dateTo") || "",
    kmMin: params.get("kmMin") || "",
    kmMax: params.get("kmMax") || "",
    difficolta: params.get("difficolta") || "",
    stagione: params.get("stagione") || "",
    provincia: params.get("provincia") || params.get("tag") || "",
    soloRifugio: params.get("soloRifugio") === "1",
    partecipanti: parseArrayParam(params.get("partecipanti")),
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

function getDifficultyGroup(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (!normalized) return "";
  if (normalized.includes("passegg")) return "passeggiate";
  return "escursioni";
}

function matchesFilters(item, filters) {
  const date = new Date(item.data).getTime();
  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom).getTime() : null;
  const dateTo = filters.dateTo ? new Date(filters.dateTo).getTime() : null;
  const kmMin = filters.kmMin ? Number(filters.kmMin) : null;
  const kmMax = filters.kmMax ? Number(filters.kmMax) : null;

  const matchDateFrom = dateFrom ? date >= dateFrom : true;
  const matchDateTo = dateTo ? date <= dateTo : true;
  const matchKmMin = kmMin !== null ? item.km >= kmMin : true;
  const matchKmMax = kmMax !== null ? item.km <= kmMax : true;
  const matchDifficulty = filters.difficolta
    ? getDifficultyGroup(item.difficolta) === filters.difficolta
    : true;
  const matchSeason = filters.stagione ? getSeasonFromDate(item.data) === filters.stagione : true;
  const matchProvince = filters.provincia
    ? String(item.provincia || "").toLowerCase() === filters.provincia.toLowerCase()
    : true;
  const matchRifugio = filters.soloRifugio ? item.rifugio : true;
  const matchParticipants = filters.partecipanti.length
    ? filters.partecipanti.every((person) => item.partecipanti?.includes(person))
    : true;

  return (
    matchDateFrom &&
    matchDateTo &&
    matchKmMin &&
    matchKmMax &&
    matchDifficulty &&
    matchSeason &&
    matchProvince &&
    matchRifugio &&
    matchParticipants
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
    case "date-desc":
    default:
      return list.sort((a, b) => new Date(b.data) - new Date(a.data));
  }
}

export default function Filtri({ escursioni = [], initialFilters = defaultFilters }) {
  const [filters, setFilters] = useState(() => normalizeInitialFilters(initialFilters));

  useEffect(() => {
    const nextFilters = parseFiltersFromSearch(window.location.search);
    setFilters((current) => (areFiltersEqual(current, nextFilters) ? current : nextFilters));
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

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.kmMin) params.set("kmMin", filters.kmMin);
    if (filters.kmMax) params.set("kmMax", filters.kmMax);
    if (filters.difficolta) params.set("difficolta", filters.difficolta);
    if (filters.stagione) params.set("stagione", filters.stagione);
    if (filters.provincia) params.set("provincia", filters.provincia);
    if (filters.soloRifugio) params.set("soloRifugio", "1");
    if (filters.partecipanti.length) {
      params.set("partecipanti", filters.partecipanti.join(","));
    }
    if (filters.sort && filters.sort !== "date-desc") params.set("sort", filters.sort);
    if (currentPage > 1) params.set("page", String(currentPage));

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, [filters, currentPage]);

  function updateField(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: 1
    }));
  }

  function toggleParticipant(value) {
    setFilters((current) => {
      const alreadySelected = current.partecipanti.includes(value);
      return {
        ...current,
        partecipanti: alreadySelected
          ? current.partecipanti.filter((item) => item !== value)
          : [...current.partecipanti, value],
        page: 1
      };
    });
  }

  function resetFilters() {
    setFilters(defaultFilters);
  }

  return (
    <div class="space-y-8">
      <section class="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-card backdrop-blur sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.16em] text-terracotta-600">
              Elenco escursioni
            </p>
            <h2 class="mt-1 text-2xl font-black text-forest-800">Trova il sentiero giusto</h2>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            class="inline-flex items-center justify-center rounded-full border border-terracotta-200 px-4 py-2 text-sm font-bold text-terracotta-700 transition hover:bg-terracotta-50"
          >
            Reset filtri
          </button>
        </div>

        <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label class="space-y-2 text-sm font-bold text-forest-800">
            <span>Da data</span>
            <input
              type="date"
              value={filters.dateFrom}
              onInput={(event) => updateField("dateFrom", event.currentTarget.value)}
              class="w-full rounded-2xl border border-sand bg-cream px-4 py-3 font-semibold text-forest-800 outline-none transition focus:border-terracotta-400"
            />
          </label>

          <label class="space-y-2 text-sm font-bold text-forest-800">
            <span>A data</span>
            <input
              type="date"
              value={filters.dateTo}
              onInput={(event) => updateField("dateTo", event.currentTarget.value)}
              class="w-full rounded-2xl border border-sand bg-cream px-4 py-3 font-semibold text-forest-800 outline-none transition focus:border-terracotta-400"
            />
          </label>

          <label class="space-y-2 text-sm font-bold text-forest-800">
            <span>Km min</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={filters.kmMin}
              onInput={(event) => updateField("kmMin", event.currentTarget.value)}
              class="w-full rounded-2xl border border-sand bg-cream px-4 py-3 font-semibold text-forest-800 outline-none transition focus:border-terracotta-400"
            />
          </label>

          <label class="space-y-2 text-sm font-bold text-forest-800">
            <span>Km max</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={filters.kmMax}
              onInput={(event) => updateField("kmMax", event.currentTarget.value)}
              class="w-full rounded-2xl border border-sand bg-cream px-4 py-3 font-semibold text-forest-800 outline-none transition focus:border-terracotta-400"
            />
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

          <label class="space-y-2 text-sm font-bold text-forest-800 md:col-span-2 xl:col-span-1">
            <span>Rifugio</span>
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
              <span>Solo rifugio</span>
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

          <div class="space-y-2 text-sm font-bold text-forest-800 md:col-span-2 xl:col-span-4">
            <span>Compagnia</span>
            <div class="flex flex-wrap gap-2">
              {participantOptions.map((item) => (
                <button
                  type="button"
                  onClick={() => toggleParticipant(item.value)}
                  class={`rounded-full px-4 py-3 text-sm font-bold transition ${
                    filters.partecipanti.includes(item.value)
                      ? "bg-forest-700 text-white"
                      : "bg-cream text-forest-700 hover:bg-forest-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-sm font-semibold text-forest-700">{filtered.length} escursioni trovate</p>
            <h3 class="text-2xl font-black text-forest-800">Risultati</h3>
          </div>
          <label class="space-y-2 text-sm font-bold text-forest-800 sm:min-w-[240px]">
            <span class="block text-right sm:text-left">Ordina per</span>
            <select
              value={filters.sort}
              onInput={(event) => updateField("sort", event.currentTarget.value)}
              class="w-full rounded-2xl border border-sand bg-cream px-4 py-3 font-semibold text-forest-800 outline-none transition focus:border-terracotta-400"
            >
              {sortOptions.map((item) => (
                <option value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
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
          <div class="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setFilters((current) => ({ ...current, page: currentPage - 1 }))}
              class="rounded-full border border-sand px-4 py-2 text-sm font-bold text-forest-700 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Precedente
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                type="button"
                onClick={() => setFilters((current) => ({ ...current, page }))}
                class={`h-10 w-10 rounded-full text-sm font-bold transition ${
                  page === currentPage
                    ? "bg-terracotta-500 text-white"
                    : "bg-white text-forest-700"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setFilters((current) => ({ ...current, page: currentPage + 1 }))}
              class="rounded-full border border-sand px-4 py-2 text-sm font-bold text-forest-700 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              Successiva
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
