# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Gli utenti principali sono Tizi e Meg, che usano il sito per conservare e rivivere le proprie escursioni. Amici e altri escursionisti lo consultano per scoprire le uscite, le fotografie, i dati dei percorsi e le avventure condivise con Gea e la Gea Gang.

## Product Purpose

Popi's Adventures è un diario personale di escursioni che raccoglie giornate reali all'aria aperta, fotografie e informazioni pratiche sui percorsi. Deve rendere semplice ritrovare un'uscita, esplorare l'archivio e la mappa, preparare lo zaino e conservare nel tempo i ricordi della squadra.

Il prodotto ha successo quando le avventure rimangono facili da aggiornare, piacevoli da rivivere e utili da consultare soprattutto da mobile.

## Positioning

Il sito unisce il racconto autentico di Tizi, Meg e Gea a un archivio strutturato di percorsi, fotografie, mappa, statistiche, checklist offline e storie della Gea Gang. Non è un catalogo generico di itinerari: ogni contenuto nasce da un'esperienza realmente vissuta dalla squadra.

## Operating Context

- Le escursioni vengono mantenute in un Google Sheet pubblicato come CSV; Google Sheets resta la fonte dati principale.
- Le fotografie e gli asset del sito sono locali e versionati nel repository.
- Il sito viene consultato come web app mobile-first, anche in condizioni di connettività limitata per le funzionalità supportate offline.
- L'archivio, i filtri e la mappa servono a ritrovare e confrontare le uscite; la checklist accompagna la preparazione prima di partire.

## Capabilities and Constraints

- Homepage con hero, statistiche, uscite recenti e presentazione della squadra.
- Archivio escursioni con ricerca, filtri, ordinamento e paginazione.
- Pagine di dettaglio con copertina, dati del percorso, galleria e lightbox.
- Mappa delle escursioni dotate di coordinate.
- Checklist "Prepara lo zaino" persistente sul dispositivo e disponibile offline dopo la prima visita.
- Sezione Gea Gang con profili dei cani e collegamenti alle escursioni condivise.
- PWA installabile con service worker e fallback offline.
- Contenuti in italiano e basati esclusivamente su esperienze, dati e immagini reali; non inventare itinerari, raccomandazioni, prove o testimonianze.
- Usare immagini locali rispettando la struttura e le convenzioni definite dal progetto; non introdurre URL di immagini remote.
- Preservare l'architettura Astro con componenti interattivi Preact e mantenere il JavaScript lato client leggero.

## Brand Commitments

- Nome: **Popi's Adventures**.
- Protagonisti: Tizi, Meg e Gea; la Gea Gang è una parte riconoscibile dell'identità e del racconto.
- Voce italiana, personale, amichevole e concreta, centrata sulle giornate vissute insieme senza toni promozionali o affermazioni non verificabili.
- Conservare i loghi e le immagini reali presenti in `src/assets/images/site/`, `src/assets/images/dogs/` e `src/assets/images/hikes/`.

## Evidence on Hand

- Fotografie reali delle escursioni in `src/assets/images/hikes/`.
- Fotografie della squadra e dei cani in `src/assets/images/site/` e `src/assets/images/dogs/`.
- Dataset delle escursioni e della Gea Gang caricati e normalizzati dai moduli in `src/data/`.
- Contenuti, metadati, statistiche e funzionalità già implementati nelle pagine e nei componenti sotto `src/`.
- Non sono disponibili testimonianze, benchmark o affermazioni commerciali da usare come prova; non fabbricarli.

## Product Principles

1. Raccontare soltanto avventure e informazioni autentiche della squadra.
2. Rendere escursioni, fotografie e dati facili da ritrovare e consultare da mobile.
3. Unire memoria personale e utilità pratica senza trasformare il diario in un portale turistico generico.
4. Mantenere contenuti e immagini semplici da aggiornare attraverso le fonti già definite.
5. Conservare un'esperienza leggibile, leggera e affidabile anche con connettività limitata.

## Accessibility & Inclusion

Preservare HTML semantico, testi alternativi significativi, navigazione da tastiera, focus visibile, contrasto leggibile e supporto a `prefers-reduced-motion`. Non è stato indicato uno standard formale di conformità aggiuntivo.
