import { h } from "preact";
import { Droplets, PawPrint, RotateCcw, Utensils } from "lucide-preact";
import { withBase } from "../utils/base.js";
import { formatKilometers, formatMeters } from "../utils/format.js";

const featureBadges = [
  { key: "anello", label: "Sentiero ad anello", Icon: RotateCcw },
  { key: "gea", label: "Con Gea", Icon: PawPrint },
  { key: "rifugio", label: "Rifugio", Icon: Utensils },
  { key: "acqua", label: "Acqua", Icon: Droplets }
];

function formatDate(value) {
  if (!value) return "Data da definire";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function hasFeature(escursione, key) {
  const tags = (escursione.tag || []).map((item) => String(item).toLowerCase());
  return Boolean(escursione[key]) || tags.includes(key);
}

export default function CardEscursione({ escursione, hrefBase = "/escursioni" }) {
  const partecipanti = (escursione.partecipanti || []).filter((item) => item === "gea");
  const featureStates = featureBadges.map((item) => ({
    ...item,
    active: item.key === "gea" ? partecipanti.includes("gea") : hasFeature(escursione, item.key)
  }));

  const stats = [
    escursione.km > 0
      ? {
          label: "Km",
          value: formatKilometers(escursione.km),
          className: "bg-terracotta-50 text-terracotta-600",
          active: true
        }
      : {
          label: "Km",
          value: "--",
          className: "bg-slate-100 text-slate-400",
          active: false
        },
    escursione.durata
      ? {
          label: "Durata",
          value: escursione.durata,
          className: "bg-forest-50 text-forest-600",
          active: true
        }
      : {
          label: "Durata",
          value: "--",
          className: "bg-slate-100 text-slate-400",
          active: false
        },
    escursione.dislivello > 0
      ? {
          label: "D+",
          value: `${formatMeters(escursione.dislivello)} m`,
          className: "bg-sand text-forest-700",
          active: true
        }
      : {
          label: "D+",
          value: "--",
          className: "bg-slate-100 text-slate-400",
          active: false
        }
  ];

  return (
    <article class="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-2xl">
      <a href={withBase(`${hrefBase}/${escursione.slug}`)} class="block">
        <div class="relative aspect-[4/3] overflow-hidden">
          <img src={escursione.coverCard || escursione.cover} srcSet={escursione.coverSrcSet || undefined} sizes="(min-width: 1280px) 31vw, (min-width: 768px) 47vw, 96vw" alt={escursione.coverAlt || escursione.titolo} width="720" height="540" loading="lazy" decoding="async" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          {escursione.difficolta && <div class="absolute left-4 top-4 rounded-full bg-forest-800/85 px-3 py-1 text-xs font-bold text-cream">{escursione.difficolta}</div>}
        </div>

        <div class="space-y-4 p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-terracotta-600">{formatDate(escursione.data)}</p>
              <h3 class="mt-1 text-xl font-black text-forest-800">{escursione.titolo}</h3>
              <p class="mt-1 text-sm text-forest-700">{escursione.luogo}</p>
            </div>
          </div>

          <div class="grid min-h-[4.9rem] grid-cols-3 gap-3 text-sm text-forest-700">
            {stats.map((stat) => {
              const [bgClass, labelClass] = stat.className.split(" ");
              return (
                <div key={stat.label} class={`rounded-2xl px-3 py-2 ${bgClass} ${stat.active ? "" : "opacity-60"}`}>
                  <p class={`text-xs uppercase tracking-wide ${labelClass}`}>{stat.label}</p>
                  <p class={`font-bold ${stat.active ? "text-forest-800" : "text-slate-400"}`}>{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div class="flex flex-wrap gap-2">
            {featureStates.map((item) => (
              <span
                class={`inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-sm transition ${
                  item.active
                    ? "border-terracotta-300/80 bg-white text-terracotta-800"
                    : "border-terracotta-200/60 bg-white/55 text-terracotta-800/35 opacity-55"
                }`}
                title={item.label}
                aria-label={`${item.label}${item.active ? " disponibile" : " non disponibile"}`}
              >
                <item.Icon size={18} strokeWidth={2} class="shrink-0" aria-hidden="true" />
              </span>
            ))}
          </div>
        </div>
      </a>
    </article>
  );
}