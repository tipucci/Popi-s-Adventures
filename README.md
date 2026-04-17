# Popi's Adventures

Diario personale di escursioni costruito con Astro. Il progetto genera una web app statica installabile con homepage, archivio delle uscite, pagine di dettaglio, sezione "Chi siamo", checklist "Prepara lo zaino" offline-friendly e vista mappa alimentata da un dataset esterno pubblicato su Google Sheets.

## Panoramica

Questo repository contiene il codice sorgente di un diario escursionistico personale, pensato per presentare in modo semplice e leggibile uscite, fotografie e metadati dei percorsi.

Il sito include:

- homepage con hero, highlights e uscite recenti
- archivio escursioni con ricerca e filtri lato client
- una pagina dedicata per ogni escursione
- una checklist "Prepara lo zaino" con persistenza locale
- una pagina mappa per le escursioni con coordinate
- un endpoint JSON statico generato in fase di build
- supporto PWA con manifest, service worker e fallback offline

I contenuti arrivano da una combinazione di:

- dati strutturati esterni pubblicati tramite Google Sheets
- immagini locali versionate nel repository
- testi e contenuti UI definiti direttamente nei componenti Astro e JSX

## Stack

- Astro 6
- Preact per i componenti interattivi
- Tailwind CSS 4 per lo styling
- Leaflet per la mappa
- `astro:assets` per la gestione delle immagini locali
- `vite-plugin-pwa` e Workbox per manifest, service worker e cache offline
- Vercel Speed Insights per la telemetria prestazionale lato client

## Funzionalità principali

- generazione statica di pagine ed endpoint API
- archivio escursioni con ricerca, filtri e sincronizzazione con l'URL
- pagine di dettaglio generate a partire da dati CSV esterni
- checklist "Prepara lo zaino" con elementi predefiniti, extra personalizzati e stato salvato in `localStorage`
- copertine e gallerie immagini locali per ogni escursione
- lightbox galleria nelle pagine di dettaglio
- pagina mappa con marker per le escursioni che hanno coordinate disponibili
- endpoint pre-renderizzato in `/api/escursioni.json`
- installabilità come web app standalone
- fallback offline e cache per app shell, pagine statiche, checklist zaino e API escursioni

## Struttura del progetto

```text
.
|-- public/
|   |-- icons/                 # Icone PWA
|   `-- leaflet/               # Asset marker di Leaflet
|-- src/
|   |-- assets/images/
|   |   |-- site/              # Immagini di sito (home, about, logo)
|   |   `-- hikes/             # Una cartella per ogni escursione
|   |-- components/            # Componenti UI Astro e Preact
|   |-- data/                  # Caricamento dati, registry immagini, metadata immagini
|   |-- layouts/               # Layout condivisi
|   |-- pages/                 # Route Astro
|   |   |-- api/               # Endpoint API statico
|   |   |-- escursioni/        # Archivio e pagine dettaglio escursioni
|   |   |-- offline.astro      # Fallback offline PWA
|   |   `-- prepara-lo-zaino.astro # Checklist zaino
|   |-- styles/                # Stili globali
|   |-- sw.ts                  # Service worker custom
|   `-- utils/                 # Utility piccole e riusabili
|-- scripts/
|   `-- build-sw.mjs           # Build service worker con injectManifest
|-- astro.config.mjs
|-- tailwind.config.js
`-- package.json
```

## Web app e offline

Il sito è configurato come PWA installabile:

- manifest web app generato in build con icone in `public/icons/`
- service worker custom in [src/sw.ts](./src/sw.ts)
- strategia `injectManifest` con precache dell'app shell e cache runtime per asset, pagine e API
- pagina fallback offline in [src/pages/offline.astro](./src/pages/offline.astro)
- checklist "Prepara lo zaino" utilizzabile offline dopo la prima visita, con stato salvato sul dispositivo

La mappa usa tile esterne e dati che possono richiedere rete: il supporto offline non promette una mappa completamente disponibile senza connessione.

## Setup locale

### Requisiti

- Node.js 20 o superiore
- npm

### Avvio

```bash
npm install
npm run dev
```

Per generare una build di produzione:

```bash
npm run build
npm run preview
```

## Variabili e configurazione

Il progetto usa due variabili di configurazione definite in [astro.config.mjs](./astro.config.mjs):

- `SITE_URL`
  Serve per costruire URL assoluti in metadata e dati strutturati. Il fallback attuale è `https://example.com`.
- `BASE_PATH`
  Base path opzionale per deploy sotto una sottocartella. Il fallback attuale è `/`.

Esempio:

```bash
SITE_URL=https://your-domain.example BASE_PATH=/ npm run build
```

Non è richiesto un file `.env` locale per avviare il progetto, ma le variabili possono essere passate dalla shell o dalla piattaforma di deploy.

## Dati e aggiornamento contenuti

### Sorgente dati esterna

Il dataset delle escursioni viene caricato da un CSV pubblicato su Google Sheets, definito in [src/data/escursioni.js](./src/data/escursioni.js).

Caratteristiche attuali della sorgente:

- CSV pubblicato da Google Sheets
- scaricato durante la build e durante lo sviluppo locale
- normalizzato in campi utili al sito come `slug`, `cover`, `gallery`, `lat`, `lng`, tag e metadati derivati

Implicazioni importanti:

- la build dipende dalla raggiungibilità del CSV esterno
- se il CSV non è disponibile, il codice attuale restituisce una lista vuota invece di fallire la build
- la route `/api/escursioni.json` espone i dati normalizzati e anche l'URL sorgente

### Immagini e contenuti locali

Le immagini sono archiviate localmente nel repository e risolte tramite `import.meta.glob` in [src/data/imageRegistry.js](./src/data/imageRegistry.js).

Struttura prevista:

```text
src/assets/images/
  site/
    home/
    about/
    logo/
  hikes/
    <yyyy-mm-dd-slug>/
      cover.jpg|webp
      gallery-01.jpg|webp
      gallery-02.jpg|webp
      ...
```

Note operative:

- le immagini di sito vengono usate per hero homepage, sezione about e logo
- ogni escursione può avere una cover e una galleria
- alt text e metadata galleria sono configurati in [src/data/hikeImageMeta.js](./src/data/hikeImageMeta.js)
- se le immagini locali mancano, il progetto genera placeholder per evitare rotture di layout

Quando aggiungi una nuova escursione:

1. aggiungi la riga dati nella sorgente Google Sheet
2. verifica che lo slug generato corrisponda al nome della cartella immagini
3. aggiungi le immagini locali sotto `src/assets/images/hikes/<yyyy-mm-dd-slug>/`
4. aggiorna facoltativamente [src/data/hikeImageMeta.js](./src/data/hikeImageMeta.js) con alt text e caption

## Dipendenze esterne

Il progetto dipende da alcuni servizi e risorse esterne:

- Google Sheets
  Sorgente del dataset escursioni tramite CSV pubblicato.
- Google Fonts
  Font caricati in [src/styles/global.css](./src/styles/global.css).
- OpenStreetMap
  Tile usate da Leaflet come sfondo della mappa.
- Google Maps
  Usato per i link esterni di ricerca e indicazioni dai popup mappa.

Queste dipendenze sono rilevanti per privacy, performance e manutenzione. Se il progetto viene irrigidito per una produzione più solida, sono i primi punti da valutare per self-hosting o fallback migliori.

## Deploy

La configurazione Astro usa `output: "static"`, quindi il sito può essere pubblicato su qualunque hosting statico.

Prima del deploy:

1. imposta `SITE_URL` con il dominio pubblico finale
2. imposta `BASE_PATH` solo se il sito non viene servito dalla root del dominio
3. esegui `npm run build`
4. verifica che il CSV esterno sia raggiungibile durante la build

Il repository ignora la cartella locale `.vercel/`. Il progetto può essere distribuito su Vercel, GitHub Pages o altro hosting statico, purché la build abbia accesso alla sorgente dati esterna.

## Roadmap breve

- spostare più contenuti pubblici in file o collezioni dedicate
- ridurre l'accoppiamento diretto con Google Sheets come unica sorgente dati
- migliorare la documentazione del flusso immagini e manutenzione contenuti
- aggiungere controlli automatici per coerenza build e asset mancanti

## Licenza

Il codice sorgente di questo repository è distribuito con licenza MIT. Vedi [LICENSE](./LICENSE).

Immagini, fotografie personali, testi editoriali, contenuti del diario, branding e altri asset creativi non sono automaticamente inclusi nella licenza del software, salvo dove esplicitamente indicato. Vedi [NOTICE](./NOTICE).

In pratica:

- il codice può essere riutilizzato secondo i termini della licenza MIT
- foto, immagini, contenuti personali e branding non devono essere considerati riutilizzabili agli stessi termini
