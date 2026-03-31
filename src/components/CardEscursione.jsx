import { h } from "preact";
import { withBase } from "../utils/base.js";

const partecipantiLabels = {
  meg: "Meg",
  tizi: "Tizi",
  gea: "Gea"
};

const featureBadges = [
  {
    key: "rifugio",
    label: "Rifugio",
    paths: [
      "M12 3.75 4.5 9v9.75h15V9L12 3.75Z",
      "M9.75 18.75v-4.5h4.5v4.5",
      "M8.25 10.5h.008v.008H8.25V10.5Z",
      "M15.75 10.5h.008v.008h-.008V10.5Z"
    ]
  },
  {
    key: "anello",
    label: "Anello",
    paths: [
      "M7.5 7.5h7.75a4.25 4.25 0 1 1 0 8.5H9.5",
      "M7.5 7.5 4.5 10.5",
      "M7.5 7.5 4.5 4.5",
      "M16.5 16h-7.75a4.25 4.25 0 1 1 0-8.5H14.5",
      "M16.5 16 19.5 13",
      "M16.5 16 19.5 19"
    ]
  },
  {
    key: "acqua",
    label: "Acqua",
    paths: [
      "M12 3.75s-4.5 5.06-4.5 8.25a4.5 4.5 0 1 0 9 0c0-3.19-4.5-8.25-4.5-8.25Z",
      "M10.25 14.25c.45.7 1.2 1.25 2.25 1.25 1.05 0 1.8-.55 2.25-1.25"
    ]
  }
];

function formatDate(value) {
  if (!value) return "Data da definire";

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(parsed);
}

function hasFeature(escursione, key) {
  const tags = (escursione.tag || []).map((item) => String(item).toLowerCase());
  return Boolean(escursione[key]) || tags.includes(key);
}

export default function CardEscursione({ escursione, hrefBase = "/escursioni" }) {
  const partecipanti = escursione.partecipanti || [];
  const features = featureBadges.filter((item) => hasFeature(escursione, item.key));

  return (
    <article class="group overflow-hidden rounded-[1.75rem] border border-white/70 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-2xl">
      <a href={withBase(`${hrefBase}/${escursione.slug}`)} class="block">
        <div class="relative aspect-[4/3] overflow-hidden">
          <img
            src={escursione.cover}
            alt={escursione.titolo}
            loading="lazy"
            class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div class="absolute left-4 top-4 rounded-full bg-forest-800/85 px-3 py-1 text-xs font-bold text-cream">
            {escursione.difficolta}
          </div>
        </div>

        <div class="space-y-4 p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-terracotta-600">
                {formatDate(escursione.data)}
              </p>
              <h3 class="mt-1 text-xl font-black text-forest-800">{escursione.titolo}</h3>
              <p class="mt-1 text-sm text-forest-700">{escursione.luogo}</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3 text-sm text-forest-700">
            <div class="rounded-2xl bg-terracotta-50 px-3 py-2">
              <p class="text-xs uppercase tracking-wide text-terracotta-600">Km</p>
              <p class="font-bold">{escursione.km}</p>
            </div>
            <div class="rounded-2xl bg-forest-50 px-3 py-2">
              <p class="text-xs uppercase tracking-wide text-forest-600">Durata</p>
              <p class="font-bold">{escursione.durata}</p>
            </div>
            <div class="rounded-2xl bg-sand px-3 py-2">
              <p class="text-xs uppercase tracking-wide text-forest-700">D+</p>
              <p class="font-bold">{escursione.dislivello} m</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            {partecipanti.map((item) => (
              <span class="rounded-full bg-cream px-3 py-1 text-xs font-bold text-forest-700">
                {partecipantiLabels[item] || item}
              </span>
            ))}
          </div>

          {features.length > 0 && (
            <div class="flex flex-wrap gap-2">
              {features.map((item) => (
                <span class="inline-flex items-center gap-2 rounded-full border border-terracotta-200/80 bg-terracotta-50/35 px-3 py-1.5 text-xs font-semibold text-terracotta-800">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-4.5 w-4.5 shrink-0"
                    aria-hidden="true"
                  >
                    {item.paths.map((path) => <path d={path}></path>)}
                  </svg>
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