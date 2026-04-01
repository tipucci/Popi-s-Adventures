const hikeEntries = [
  { slug: "2026-03-22-pietra-bismantova", title: "Pietra Bismantova" },
  { slug: "2026-03-01-cassina-enco", title: "Cassina Enco" },
  { slug: "2026-02-15-parco-fluviale-taro", title: "Parco Fluviale Taro" },
  { slug: "2026-02-08-terzalpe", title: "Terzalpe" },
  { slug: "2026-01-03-baita-patrizi", title: "Baita Patrizi" },
  { slug: "2025-11-08-lago-santo", title: "Lago Santo" },
  { slug: "2025-07-13-merlino", title: "Merlino" },
  { slug: "2024-11-02-valbrona", title: "Valbrona" },
  { slug: "2023-08-12-laghi-plitvice", title: "Laghi di Plitvice" },
  { slug: "2023-07-30-piani-resinelli", title: "Piani dei Resinelli" },
  { slug: "2023-04-01-salti-diavolo", title: "Salti del Diavolo" },
  { slug: "2022-10-30-lagoni", title: "Lagoni" },
  { slug: "2022-10-08-castello-bianello", title: "Castello di Bianello" }
];

export const hikeImageMeta = Object.fromEntries(
  hikeEntries.map(({ slug, title }) => [
    slug,
    {
      coverAlt: `${title} - copertina dell'escursione con atmosfera naturale e raccolta.`,
      gallery: [
        {
          file: "gallery-01.jpg",
          alt: `${title} - primo scatto della galleria dell'escursione.`,
          caption: "Primo placeholder locale, facile da sostituire con la foto definitiva."
        },
        {
          file: "gallery-02.jpg",
          alt: `${title} - secondo scatto della galleria dell'escursione.`,
          caption: "Secondo placeholder locale, pronto per una futura immagine reale."
        }
      ]
    }
  ])
);