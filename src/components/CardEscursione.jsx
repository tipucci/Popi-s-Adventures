import { h } from "preact";
import { Droplets, PawPrint, RotateCcw, Utensils } from "lucide-preact";
import { withBase } from "../utils/base.js";
import { formatKilometers, formatMeters } from "../utils/format.js";

const featureBadges = [
  { key: "gea", label: "Con Gea", Icon: PawPrint },
  { key: "anello", label: "Anello", Icon: RotateCcw },
  { key: "rifugio", label: "Rifugio", Icon: Utensils },
  { key: "acqua", label: "Acqua", Icon: Droplets }
];

function formatDate(value) {
  if (!value) return "Data da definire";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function hasFeature(escursione, key) {
  const tags = (escursione.tag || []).map((item) => String(item).toLowerCase());
  return Boolean(escursione[key]) || tags.includes(key);
}

export default function CardEscursione({ escursione, hrefBase = "/escursioni" }) {
  const coverSrc = escursione.coverCard || escursione.cover;
  const isPlaceholder = typeof coverSrc === "string" && coverSrc.startsWith("data:image/svg+xml");
  const difficulty = String(escursione.difficolta || "").trim();
  const difficultyLabel = difficulty.toLowerCase() === "escursione" ? "" : difficulty;
  const partecipanti = (escursione.partecipanti || []).filter((item) => item === "gea");
  const activeFeatures = featureBadges.filter((item) =>
    item.key === "gea" ? partecipanti.includes("gea") : hasFeature(escursione, item.key)
  );

  const stats = [
    escursione.km > 0
      ? {
          label: "Km",
          value: formatKilometers(escursione.km)
        }
      : null,
    escursione.durata
      ? {
          label: "Durata",
          value: escursione.durata
        }
      : null,
    escursione.dislivello > 0
      ? {
          label: "D+",
          value: `${formatMeters(escursione.dislivello)} m`
        }
      : null
  ].filter(Boolean);

  return (
    <article class="group">
      <a
        href={withBase(`${hrefBase}/${escursione.slug}`)}
        class="block rounded-[14px] outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[5px] focus-visible:outline-[#3F6B4F]"
      >
        <figure class="relative m-0 aspect-[4/3] overflow-hidden rounded-[14px] bg-[#FFFDF7]">
          <img
            src={coverSrc}
            srcSet={escursione.coverSrcSet || undefined}
            sizes="(min-width: 1280px) 31vw, (min-width: 768px) 47vw, 96vw"
            alt={escursione.coverAlt || escursione.titolo}
            width="720"
            height="540"
            loading="lazy"
            decoding="async"
            class={`h-full w-full object-cover transition-[filter] duration-200 group-hover:saturate-105 motion-reduce:transition-none ${isPlaceholder ? "opacity-60" : ""}`}
          />
          {isPlaceholder && (
            <span class="absolute bottom-3 right-3 rounded-md bg-[#FFFDF7] px-2.5 py-1.5 text-xs font-bold text-[#25251F]">
              Foto in arrivo
            </span>
          )}
        </figure>

        <div class="pt-4">
          <h3 class="font-display text-xl font-semibold leading-tight tracking-[-0.015em] text-[#25251F] transition-colors duration-200 group-hover:text-[#3F6B4F] motion-reduce:transition-none">
            {escursione.titolo}
          </h3>
          <p class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-[#25251F]/70">
            <span>{escursione.luogo}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={escursione.data}>{formatDate(escursione.data)}</time>
            {difficultyLabel && (
              <>
                <span aria-hidden="true">·</span>
                <span>{difficultyLabel}</span>
              </>
            )}
          </p>

          {stats.length > 0 && (
            <dl class="mt-4 grid grid-cols-3 border-y border-[#DDD7C9] py-3 text-sm">
              {stats.map((stat) => (
                <div key={stat.label} class="border-r border-[#DDD7C9] px-3 first:pl-0 last:border-r-0 last:pr-0">
                  <dt class="text-xs font-bold uppercase tracking-[0.04em] text-[#3F6B4F]">
                    {stat.label === "D+" ? (
                      <abbr title="Dislivello positivo" aria-label="Dislivello positivo" class="no-underline">
                        D+
                      </abbr>
                    ) : stat.label}
                  </dt>
                  <dd class="mt-1 font-bold tabular-nums text-[#25251F]">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {activeFeatures.length > 0 && (
            <div class="mt-3 flex flex-wrap gap-2">
              {activeFeatures.map((item) => (
                <span
                  class={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                    item.key === "gea"
                      ? "bg-[#F2C94C] text-[#25251F]"
                      : "border border-[#DDD7C9] bg-[#FFFDF7]/65 text-[#3F6B4F]"
                  }`}
                >
                  <item.Icon size={15} strokeWidth={2} class="shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </a>
    </article>
  );
}
