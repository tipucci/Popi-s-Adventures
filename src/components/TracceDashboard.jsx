import { h } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { ArrowRight, MapPin, PawPrint, RotateCcw, Star } from "lucide-preact";
import Mappa from "./Mappa.jsx";
import { withBase } from "../utils/base.js";
import { formatKilometers, formatMeters } from "../utils/format.js";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "short",
  year: "numeric"
});
const AREA_PREVIEW_COUNT = 4;

function normalizeArea(value) {
  return String(value || "").trim().toLocaleLowerCase("it");
}

function dateValue(value) {
  const timestamp = new Date(`${value || ""}T00:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatDate(value) {
  if (!value) return "";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

function getGeaRating(item) {
  const value = Number(item?.voto);
  return Number.isFinite(value) && value > 0 ? Math.min(5, value) : 0;
}

function pickRecord(items, field) {
  return [...items]
    .filter((item) => Number(item?.[field]) > 0)
    .sort((a, b) => Number(b[field]) - Number(a[field]) || dateValue(b.data) - dateValue(a.data))[0];
}

function CoverImage({ hike, sizes, eager = false, className = "" }) {
  const src = hike?.coverCard || hike?.cover;
  const isPlaceholder = typeof src === "string" && src.startsWith("data:image/svg+xml");

  return (
    <img
      src={src}
      srcSet={hike?.coverSrcSet || undefined}
      sizes={sizes}
      alt={hike?.coverAlt || hike?.titolo || ""}
      width="960"
      height="720"
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      class={`h-full w-full object-cover ${isPlaceholder ? "opacity-60" : ""} ${className}`.trim()}
    />
  );
}

function RecordFeature({ hike, label, value, variant = "wide" }) {
  if (!hike) return null;

  return (
    <article class={variant === "offset" ? "lg:mt-14" : ""}>
      <a
        href={withBase(`/escursioni/${hike.slug}`)}
        class="group block rounded-[14px] outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[5px] focus-visible:outline-[#3F6B4F]"
      >
        <figure class={`m-0 overflow-hidden rounded-[14px] bg-[#FFFDF7] ${variant === "offset" ? "aspect-[5/4]" : "aspect-[16/10]"}`}>
          <CoverImage
            hike={hike}
            sizes={variant === "offset" ? "(min-width: 1024px) 34vw, 96vw" : "(min-width: 1024px) 54vw, 96vw"}
            className="transition-[filter] duration-200 group-hover:saturate-110 motion-reduce:transition-none"
          />
        </figure>
        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 pt-4">
          <div>
            <p class="text-sm font-bold text-[#E66A4E]">{label}</p>
            <h3 class="mt-1 text-xl font-bold leading-tight tracking-[-0.02em] text-[#25251F] group-hover:text-[#3F6B4F]">
              {hike.titolo}
            </h3>
            <p class="mt-1 text-sm text-[#25251F]/70">
              {hike.luogo}
              {hike.data && (
                <>
                  <span aria-hidden="true"> · </span>
                  <time dateTime={hike.data}>{formatDate(hike.data)}</time>
                </>
              )}
            </p>
          </div>
          <p class="whitespace-nowrap text-2xl font-bold tabular-nums tracking-[-0.02em] text-[#25251F]">{value}</p>
        </div>
      </a>
    </article>
  );
}

export default function TracceDashboard({ escursioni = [], initialArea = "" }) {
  const mappedHikes = useMemo(
    () => escursioni.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng)),
    [escursioni]
  );

  const areas = useMemo(() => {
    const counts = new Map();

    mappedHikes.forEach((item) => {
      const area = String(item.provincia || "").trim();
      if (!area) return;
      const key = normalizeArea(area);
      const current = counts.get(key) || { name: area, count: 0 };
      current.count += 1;
      counts.set(key, current);
    });

    return [...counts.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name, "it")
    );
  }, [mappedHikes]);

  const areaByKey = useMemo(() => new Map(areas.map((area) => [normalizeArea(area.name), area.name])), [areas]);
  const resolveArea = (value) => areaByKey.get(normalizeArea(value)) || "";
  const initialResolvedArea = resolveArea(initialArea);
  const [selectedArea, setSelectedArea] = useState(() => initialResolvedArea);
  const [showAllAreas, setShowAllAreas] = useState(
    () => Boolean(initialResolvedArea && !areas.slice(0, AREA_PREVIEW_COUNT).some((area) => area.name === initialResolvedArea))
  );

  const longestHike = useMemo(() => pickRecord(escursioni, "km"), [escursioni]);
  const highestClimb = useMemo(() => pickRecord(escursioni, "dislivello"), [escursioni]);
  const geaTopThree = useMemo(
    () =>
      [...escursioni]
        .filter((item) => item.cane && getGeaRating(item) > 0)
        .sort(
          (a, b) =>
            getGeaRating(b) - getGeaRating(a) ||
            dateValue(b.data) - dateValue(a.data) ||
            String(a.titolo).localeCompare(String(b.titolo), "it")
        )
        .slice(0, 3),
    [escursioni]
  );

  const selectedHikes = useMemo(
    () =>
      selectedArea
        ? mappedHikes
            .filter((item) => normalizeArea(item.provincia) === normalizeArea(selectedArea))
            .sort((a, b) => dateValue(b.data) - dateValue(a.data))
        : [],
    [mappedHikes, selectedArea]
  );

  const mapHikes = selectedArea ? selectedHikes : mappedHikes;
  const visibleAreas = showAllAreas ? areas : areas.slice(0, AREA_PREVIEW_COUNT);
  const maxAreaCount = Math.max(1, ...areas.map((area) => area.count));

  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const nextArea = resolveArea(params.get("area"));
      setSelectedArea(nextArea);

      if (nextArea && !areas.slice(0, AREA_PREVIEW_COUNT).some((area) => area.name === nextArea)) {
        setShowAllAreas(true);
      }
    }

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [areaByKey, areas]);

  function chooseArea(area) {
    const nextArea = selectedArea === area ? "" : area;
    const url = new URL(window.location.href);

    if (nextArea) url.searchParams.set("area", nextArea);
    else url.searchParams.delete("area");

    window.history.pushState({}, "", url);
    setSelectedArea(nextArea);
  }

  const archiveHref = selectedArea
    ? `${withBase("/escursioni")}?provincia=${encodeURIComponent(selectedArea)}`
    : withBase("/escursioni");

  return (
    <div class="traces-dashboard text-[#25251F]">
      <header class="max-w-3xl pb-7 pt-2 sm:pb-9 sm:pt-5">
        <h1 class="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
          Le nostre{" "}
          <span class="relative inline-block">
            <span class="relative z-10">tracce</span>
            <span class="absolute -inset-x-1 bottom-[0.04em] z-0 h-[0.24em] rounded-[50%] bg-[#F2C94C]/80" aria-hidden="true"></span>
          </span>
        </h1>
      </header>

      <section class="grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.65fr)] lg:gap-8" aria-label="Mappa e aree esplorate">
        <div class="min-w-0">
          <Mappa
            escursioni={mapHikes}
            height="clamp(280px, calc(100svh - 350px), 580px)"
            title={selectedArea ? `Escursioni in ${selectedArea}` : "Mappa delle escursioni"}
            selectedArea={selectedArea}
            showHeader={false}
            variant="journal"
          />
          <div class="flex flex-wrap items-center gap-x-5 gap-y-2 px-2 pt-3 text-xs font-bold text-[#25251F]/70">
            <span class="inline-flex items-center gap-2">
              <span class="h-3 w-3 rounded-full bg-[#E66A4E]" aria-hidden="true"></span>
              Escursione
            </span>
            <span class="inline-flex items-center gap-2">
              <PawPrint size={15} strokeWidth={2.2} class="text-[#3F6B4F]" aria-hidden="true" />
              Con Gea
            </span>
            <span class="ml-auto tabular-nums">
              {selectedArea ? `${mapHikes.length} a ${selectedArea}` : `${mappedHikes.length} uscite`}
            </span>
          </div>
        </div>

        <aside class="mt-16 min-w-0 border-y border-[#DDD7C9] py-5 md:mt-0 lg:border-b-0 lg:border-t-0 lg:py-2" aria-labelledby="areas-title">
          <div class="flex items-center justify-between gap-3">
            <h2 id="areas-title" class="text-2xl font-bold tracking-[-0.02em]">Aree esplorate</h2>
            {selectedArea && (
              <button
                type="button"
                onClick={() => chooseArea(selectedArea)}
                aria-label="Mostra tutte le escursioni sulla mappa"
                class="inline-flex min-h-11 items-center gap-2 rounded-[10px] px-2 text-sm font-bold text-[#3F6B4F] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] focus:ring-offset-2"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Tutte
              </button>
            )}
          </div>

          <ol class="mt-4">
            {visibleAreas.map((area) => {
              const isActive = selectedArea === area.name;
              return (
                <li key={area.name}>
                  <button
                    type="button"
                    onClick={() => chooseArea(area.name)}
                    aria-pressed={isActive}
                    aria-label={`${area.name}: ${area.count} escursioni. Filtra la mappa`}
                    class={`relative grid min-h-12 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[#DDD7C9] px-1 text-left outline-none transition-colors focus-visible:bg-[#FFFDF7] focus-visible:ring-2 focus-visible:ring-[#3F6B4F] motion-reduce:transition-none ${
                      isActive ? "text-[#3F6B4F]" : "hover:text-[#3F6B4F]"
                    }`}
                  >
                    <span class="font-bold">{area.name}</span>
                    <span class="font-bold tabular-nums">{area.count}</span>
                    <span
                      class={`absolute bottom-0 left-0 h-1 rounded-full ${isActive ? "bg-[#F2C94C]" : "bg-[#91A66D]/45"}`}
                      style={{ width: `${(area.count / maxAreaCount) * 100}%` }}
                      aria-hidden="true"
                    ></span>
                  </button>
                </li>
              );
            })}
          </ol>

          {areas.length > AREA_PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAllAreas((value) => !value)}
              class="mt-3 min-h-11 text-sm font-bold text-[#3F6B4F] underline decoration-2 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] focus:ring-offset-2"
            >
              {showAllAreas ? "Mostra meno" : `Altre ${areas.length - AREA_PREVIEW_COUNT} aree`}
            </button>
          )}

          {selectedArea && (
            <div class="mt-6 bg-[#FFFDF7] p-4" aria-label={`Escursioni in ${selectedArea}`}>
              <div class="flex items-center gap-2 text-[#3F6B4F]">
                <MapPin size={17} strokeWidth={2.2} aria-hidden="true" />
                <h3 class="font-bold">{selectedArea}</h3>
              </div>
              <ul class="mt-3 divide-y divide-[#DDD7C9]">
                {selectedHikes.slice(0, 6).map((hike) => (
                  <li key={hike.slug}>
                    <a
                      href={withBase(`/escursioni/${hike.slug}`)}
                      class="flex min-h-11 items-center justify-between gap-3 py-2 text-sm font-bold hover:text-[#3F6B4F] focus:outline-none focus:ring-2 focus:ring-[#3F6B4F]"
                    >
                      <span>{hike.titolo}</span>
                      <time dateTime={hike.data} class="shrink-0 text-xs font-semibold text-[#25251F]/75">
                        {formatDate(hike.data)}
                      </time>
                    </a>
                  </li>
                ))}
              </ul>
              <a href={archiveHref} class="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#3F6B4F] underline decoration-2 underline-offset-4">
                Vedi nell’archivio <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          )}

          <p class="sr-only" aria-live="polite">
            {selectedArea ? `Mappa filtrata: ${selectedHikes.length} escursioni in ${selectedArea}.` : "Mappa con tutte le escursioni."}
          </p>
        </aside>
      </section>

      {(longestHike || highestClimb) && (
        <section class="mt-20 sm:mt-24" aria-labelledby="records-title">
          <h2 id="records-title" class="text-3xl font-bold tracking-[-0.025em] sm:text-4xl">Giornate da ricordare</h2>
          <div class="mt-7 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
            <RecordFeature
              hike={longestHike}
              label="La più lunga"
              value={longestHike ? `${formatKilometers(longestHike.km)} km` : ""}
            />
            <RecordFeature
              hike={highestClimb}
              label="Più dislivello"
              value={highestClimb ? `${formatMeters(highestClimb.dislivello)} m D+` : ""}
              variant="offset"
            />
          </div>
        </section>
      )}

      {geaTopThree.length > 0 && (
        <section class="mt-20 border-t border-[#DDD7C9] pt-10 sm:mt-24 sm:pt-12" aria-labelledby="gea-top-title">
          <div class="flex items-center gap-3">
            <PawPrint size={24} strokeWidth={2.2} class="text-[#3F6B4F]" aria-hidden="true" />
            <h2 id="gea-top-title" class="text-3xl font-bold tracking-[-0.025em] sm:text-4xl">Le preferite di Gea</h2>
          </div>

          <ol class="mt-7 grid gap-7 sm:grid-cols-3">
            {geaTopThree.map((hike, index) => (
              <li key={hike.slug}>
                <a
                  href={withBase(`/escursioni/${hike.slug}`)}
                  class="group block rounded-[14px] outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[5px] focus-visible:outline-[#3F6B4F]"
                >
                  <figure class="relative m-0 aspect-[4/3] overflow-hidden rounded-[14px] bg-[#FFFDF7]">
                    <CoverImage
                      hike={hike}
                      sizes="(min-width: 640px) 31vw, 96vw"
                      className="transition-[filter] duration-200 group-hover:saturate-110 motion-reduce:transition-none"
                    />
                    <span class="absolute left-3 top-3 inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[#F2C94C] px-3 text-lg font-bold text-[#25251F]" aria-label={`${index + 1}ª posizione`}>
                      {index + 1}
                    </span>
                  </figure>
                  <div class="flex items-start justify-between gap-3 pt-4">
                    <div>
                      <h3 class="text-lg font-bold leading-tight tracking-[-0.02em] group-hover:text-[#3F6B4F]">{hike.titolo}</h3>
                      <p class="mt-1 text-sm text-[#25251F]/65">{formatDate(hike.data)}</p>
                    </div>
                    <span class="inline-flex shrink-0 items-center gap-1 font-bold tabular-nums text-[#E66A4E]" aria-label={`Voto di Gea: ${getGeaRating(hike)} su 5`}>
                      <Star size={17} strokeWidth={2} fill="currentColor" aria-hidden="true" />
                      {new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 }).format(getGeaRating(hike))}
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      <footer class="mt-20 border-t border-[#DDD7C9] py-10 sm:mt-24">
        <a
          href={withBase("/escursioni")}
          class="inline-flex min-h-11 items-center gap-3 text-lg font-bold text-[#3F6B4F] underline decoration-2 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-[#3F6B4F] focus:ring-offset-4"
        >
          Tutte le escursioni <ArrowRight size={20} strokeWidth={2.2} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
