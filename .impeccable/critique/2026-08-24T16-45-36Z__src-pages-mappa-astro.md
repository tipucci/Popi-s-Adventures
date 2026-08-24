---
target: pagina della mappa da estendere in dashboard e sezione statistiche
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-08-24T16-45-36Z
slug: src-pages-mappa-astro
---
# Critica della pagina Mappa

## Design Health Score

| # | Euristica | Punteggio | Problema chiave |
|---|---|---:|---|
| 1 | Visibilità dello stato | 2/4 | Nessuno stato di caricamento; l’errore non offre retry. |
| 2 | Corrispondenza col mondo reale | 3/4 | Mappa e controlli sono familiari; “In giro per il mondo” non chiarisce la funzione statistica. |
| 3 | Controllo e libertà | 3/4 | Fullscreen reversibile ed Escape funzionano; mancano reset vista e filtri territoriali. |
| 4 | Coerenza e standard | 2/4 | Il pannello scuro, i grandi raggi e la display serif divergono dal nuovo diario piatto definito in DESIGN.md. |
| 5 | Prevenzione degli errori | 2/4 | Lo scroll-wheel è gestito bene, ma marker Gea, standard e cluster non hanno legenda. |
| 6 | Riconoscimento anziché memoria | 2/4 | Per confrontare uscite e aree bisogna aprire e ricordare popup successivi. |
| 7 | Flessibilità ed efficienza | 1/4 | Zoom e fullscreen sono gli unici acceleratori; nessun accesso diretto a province, record o podio. |
| 8 | Design estetico e minimale | 3/4 | La vista è pulita, ma la semplicità diventa povertà informativa e il finale è brusco. |
| 9 | Diagnosi e recupero dagli errori | 2/4 | Messaggi comprensibili ma senza azione; l’empty state usa linguaggio da manutentore. |
| 10 | Aiuto e documentazione | 1/4 | Nessuna legenda o alternativa testuale alla geografia. |
| **Totale** |  | **21/40** | **Accettabile — base solida, miglioramenti sostanziali necessari.** |

## Verdetto di specificità

**Parzialmente autoriale, ma ancora troppo intercambiabile.** I marker personalizzati, il marker di Gea e la palette naturale appartengono a Popi’s Adventures. La composizione, però, resta “titolo + grande mappa in una card scura”: potrebbe funzionare quasi invariata in un portale turistico, immobiliare o logistico.

Mancano fotografie, ricordi, presenza della squadra e collegamenti fra geografia e giornate vissute. L’estensione deve trasformare la pagina in un **atlante narrativo del diario**, non in una dashboard da fitness tracker.

**Scansione deterministica:** `detect.mjs` sul target `src/pages/mappa.astro` ha restituito exit code 0 e `[]` (0 finding). È un probabile falso negativo di scope: il wrapper delega marker, popup, cluster, fullscreen e stati a `src/components/Mappa.jsx`, che il pass sul file pagina non ha analizzato direttamente.

**Evidenza browser:** la pagina è stata verificata live su desktop e mobile in schede nuove. Mappa, tile, cluster, fullscreen e popup si caricano. Sul desktop i cluster risultano come pulsanti nominati soltanto `9`, `8`, `2` ecc.; sul mobile la mappa fissa a 560 px viene parzialmente coperta dalla bottom navigation. La preflight per l’overlay Impeccable è rimasta bloccata e non è stata verificata: nessun overlay `[Human]` o risultato console viene quindi rivendicato.

## Impressione complessiva

La pagina ha un buon oggetto centrale, ma non ha ancora una storia. La geografia incuriosisce, poi costringe a esplorare marker uno per uno e termina direttamente nel footer. L’opportunità più grande è usare i dati per riaprire ricordi reali: aree in cui tornate, giornate da record e preferenze di Gea.

## Cosa funziona

- **Geografia familiare:** Leaflet, zoom, cluster e indicazioni stradali sono immediatamente comprensibili.
- **Gea è già un tratto proprietario:** il marker dedicato introduce personalità senza compromettere la leggibilità della mappa.
- **Fullscreen ben gestito:** uscita visibile, supporto Escape, conservazione di centro/zoom e scroll-wheel attivo soltanto nella modalità appropriata.

## Carico cognitivo

**2 fallimenti su 8: moderato.** Il problema attuale non è l’eccesso, ma l’assenza di segnali che aiutino a interpretare i punti.

- Superati: focus singolo, chunking, grouping spaziale, gerarchia, una cosa alla volta, progressive disclosure.
- **Minimal choices fallito:** compaiono molti marker/cluster insieme, senza priorità o guida.
- **Working memory fallito:** per capire un’area o confrontare uscite bisogna aprire popup successivi e ricordarne il contenuto.

La futura dashboard deve evitare l’estremo opposto: capitoli brevi — **territori**, **record**, **podio di Gea** — con non più di 3–4 elementi visibili per gruppo.

## Percorso emotivo

- **Ingresso:** caldo e promettente; titolo e geografia suscitano curiosità.
- **Picco:** vedere la concentrazione reale delle avventure e il marker fuori Italia.
- **Valle:** i cluster sono numeri senza provincia, fotografie o motivo per cui l’area conta.
- **Interazione:** il popup è utile ma puramente funzionale; non mostra data, metrica, Gea o immagine.
- **Finale:** brusco; dopo la mappa non c’è una scoperta o un ricordo da aprire.

La peak-end rule è debole: il picco appartiene alla cartografia, non alla squadra, e il finale non offre ricompensa narrativa.

## Direzione raccomandata: “Il nostro atlante”

La pagina dovrebbe restare centrata sulla mappa, ma assumere una gerarchia editoriale:

1. **Apertura breve:** titolo “Il nostro atlante” e una frase che spiega cosa si può scoprire; niente hero monumentale.
2. **Mappa + territori:** desktop con mappa dominante e classifica compatta delle aree a lato; mobile con sintesi delle prime 3 aree prima della mappa. Selezionando un’area, la mappa fa zoom e l’archivio si apre già filtrato.
3. **Giornate da record:** due momenti editoriali, non quattro KPI identici — escursione più lunga e maggior dislivello — ciascuno con foto locale, metrica, titolo e link al dettaglio.
4. **Podio di Gea:** top 3 con fotografie, posizione, rating e una zampa/annotazione breve; i pareggi restano espliciti.
5. **Chiusura:** link “Esplora tutte le escursioni” e/o area attiva nell’archivio, così la pagina non finisce nel vuoto.

La mappa deve restare geograficamente pulita. La personalità va intorno: underline giallo sull’area più visitata, piccola traccia disegnata fra i record, zampa sul podio e fotografie reali. Evitare card SaaS equivalenti, grafici circolari decorativi, gradienti e indicatori da performance sportiva.

## Fattibilità sui dati correnti

I campi necessari esistono già: `provincia`, `km`, `dislivello`, `voto`, presenza di Gea e coordinate. Sul foglio pubblicato corrente emergono già contenuti reali:

- **Aree più presenti:** Como e Parma, 5 uscite ciascuna; Lecco e Sondrio, 4.
- **Escursione più lunga:** Monte San Primo, 15,1 km.
- **Maggior dislivello:** Monte Spedone, 610 m D+.
- **Top Gea Rating:** Alpe Fraina e Preda Rossa, 5; Terz’Alpe, 4,5.

Due decisioni dati precedono la UI:

- `Provincia` contiene anche `Croazia`; o la sezione si chiama **Aree esplorate**, oppure il foglio separa provincia, regione e paese.
- `voto` è descritto dal loader come “Voto personale …/10”, ma dettaglio e filtri lo trattano come Gea Rating su 5. Serve una sorgente univoca `geaRating`, limitata alle uscite con Gea, con regole per valori mancanti e pareggi.

## Problemi prioritari

### [P1] La pagina è un vicolo cieco informativo

**Perché conta:** non risponde alle domande che rendono la mappa memorabile e non conduce naturalmente all’archivio o a una singola avventura.

**Fix:** adottare la sequenza apertura → mappa/territori → record → podio di Gea → archivio filtrato. Ogni numero deve aprire un luogo o un ricordo reale.

**Comando suggerito:** `$impeccable shape`

### [P1] Il contratto del Gea Rating è ambiguo

**Perché conta:** una Top 3 costruita su `voto` potrebbe essere visivamente credibile ma semanticamente falsa.

**Fix:** introdurre una definizione dati univoca, scala esplicita 0–5, filtro `con Gea`, esclusione dei valori mancanti e tie-break dichiarato.

**Comando suggerito:** `$impeccable harden`

### [P1] Marker e cluster non sono abbastanza riconoscibili o accessibili

**Perché conta:** i marker singoli e i cluster non espongono nomi sufficienti; colore e logo non hanno un equivalente testuale. L’esplorazione resta inaccessibile a chi non usa la geografia visuale.

**Fix:** nomi come “Apri Laghi di Plitvice, Croazia”, cluster come “9 escursioni in quest’area”, legenda compatta e lista testuale sincronizzata.

**Comando suggerito:** `$impeccable audit`

### [P2] Il linguaggio visivo non porta ancora il diario sulla mappa

**Perché conta:** pannello verde scuro, ombra, raggi molto ampi e titolo serif descrivono una card outdoor generica più del “hand-drawn adventure journal”.

**Fix:** alleggerire il frame, allineare la tipografia e concentrare i segni manuali su province, record e podio, senza decorare la cartografia.

**Comando suggerito:** `$impeccable bolder`

### [P2] Mobile e stati di rete sono fragili

**Perché conta:** a 390×844 la mappa da 560 px viene coperta per circa 51 px dalla bottom navigation; il controllo fullscreen è lontano dal pollice e non esiste feedback durante il caricamento.

**Fix:** altezza mobile legata alla viewport, safe-area inferiore, sintesi prima della mappa, stato “Sto aprendo la mappa…”, retry e alternativa testuale.

**Comando suggerito:** `$impeccable adapt`

## Persona red flags

### Alex — power user

- Non può passare da una provincia all’altra, isolare le uscite con Gea o ordinare i record.
- Deve aprire marker uno per uno; fullscreen e zoom sono gli unici acceleratori.
- La futura classifica deve essere interattiva e aprire direttamente area o dettaglio.

### Sam — tastiera e screen reader

- Marker e cluster risultano focusable, ma i loro nomi accessibili sono assenti o soltanto numerici.
- Standard/Gea/cluster sono distinti visivamente senza legenda o lista alternativa.
- Il popup Leaflet espone “Close popup” in inglese dentro un’interfaccia italiana.

### Casey — mobile e rete lenta

- La bottom navigation si sovrappone alla mappa.
- Il controllo fullscreen è in alto a destra e la mappa monopolizza il primo viewport.
- Nessun feedback di caricamento o retry quando Leaflet/tile non arrivano.

Nessuna persona di progetto aggiuntiva: `AGENTS.md` non contiene una sezione `Design Context`.

## Osservazioni minori

- “In giro per il mondo” ha tono, ma non promette la nuova funzione.
- L’empty state con `lat`, `lng` e Google Sheet deve essere riservato all’amministrazione.
- Il popup guadagnerebbe molto con data, una metrica compatta, presenza di Gea e miniatura locale.
- La homepage mostra già i totali: la nuova pagina deve essere l’approfondimento, non un duplicato.
- La `<section>` esterna Astro e quella interna Preact non hanno label semantiche utili.

## Domande progettuali

- Ogni numero può riaprire una fotografia o un ricordo reale?
- La mappa è il primo protagonista o il fondale di una storia che inizia con “Dove torniamo sempre”?
- “Area più mappata” significa provincia, regione, nazione o una gerarchia adattiva?
- Il podio di Gea celebra davvero il percorso più bello per lei, o sta riutilizzando un voto umano?
- Come apparirebbe questa pagina se fosse un quaderno di Tizi e Meg, non il riepilogo annuale di un’app sportiva?
