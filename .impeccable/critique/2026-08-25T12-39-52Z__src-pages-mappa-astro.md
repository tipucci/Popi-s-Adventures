---
target: nuova pagina mappa e coerenza navbar
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-25T12-39-52Z
slug: src-pages-mappa-astro
---
⚠️ DEGRADED: single-context (Assessment B sub-agent non ha restituito risultati dopo l’interruzione limitata; il fallback detector/browser è stato eseguito nel contesto principale dopo la conclusione indipendente di Assessment A)

## Design Health Score

| # | Euristica | Punteggio | Problema chiave |
|---|---|---:|---|
| 1 | Visibilità dello stato | 2/4 | Selezionando Como, la pagina annuncia 5 escursioni ma continua a mostrare “26 uscite” e quasi tutti i marker. |
| 2 | Corrispondenza col mondo reale | 4/4 | Geografia, nomi e controlli della mappa sono familiari e naturali. |
| 3 | Controllo e libertà | 4/4 | Toggle, reset, cronologia URL, fullscreen, Esc e ripristino focus sono solidi. |
| 4 | Coerenza e standard | 3/4 | La navigazione è prevedibile, ma lo stato attivo cambia linguaggio tra desktop e mobile. |
| 5 | Prevenzione degli errori | 3/4 | Stati vuoto/errore/riprova sono presenti; il significato della selezione area resta ambiguo. |
| 6 | Riconoscimento, non memoria | 3/4 | Etichette e legenda aiutano, ma l’utente deve dedurre se un’area filtra o centra. |
| 7 | Flessibilità ed efficienza | 3/4 | Fullscreen, URL diretto, tastiera e archivio offrono percorsi alternativi. |
| 8 | Design estetico e minimale | 3/4 | Caldo e fotografico su desktop; troppo orientato ai controlli nel primo viewport mobile. |
| 9 | Riconoscimento e recupero dagli errori | 4/4 | Copia chiara, retry ed escape dal fullscreen sono ben risolti. |
| 10 | Aiuto e documentazione | 2/4 | I cluster sono familiari, ma il contratto “area = filtro o focus” non è spiegato. |
| **Totale** |  | **31/40** | **Buono: base forte, IA mobile da correggere.** |

## Design Specificity Verdict

**Giudizio del revisore:** contenuti e dettagli sono autenticamente Popi’s Adventures—foto reali, marker di Gea, sottolineatura sunshine e tono affettuoso. L’interazione principale, però, resta in parte intercambiabile con una dashboard escursionistica generica: mappa, barre provinciali e record numerici dominano soprattutto su mobile.

**Scansione deterministica:** `detect.mjs --json src/pages/mappa.astro` ha restituito `[]`: zero finding sul file target. È un risultato pulito ma limitato al markup Astro; non smentisce i problemi di gerarchia e significato che vivono nei componenti importati e nel comportamento runtime.

**Overlay visivo:** nessun overlay `[Human]` affidabile. Il Browser disponibile espone una valutazione Playwright in sola lettura e nessun comando di iniezione mutabile; il server overlay non è stato avviato. Il fallback live ha comunque verificato DOM, viewport, stato corrente e geometrie della navbar in una scheda isolata.

## Impressione generale

La pagina è personale e convincente appena arrivano fotografie e Gea. La prima esperienza mobile, invece, sembra una directory provinciale: il prodotto promette “tracce”, ma chiede prima di scegliere tra conteggi e controlli. L’opportunità maggiore è rimettere la mappa al centro e rendere inequivocabile cosa fa una selezione.

## Cosa funziona

- Le fotografie e la sezione “Le preferite di Gea” sono il picco emotivo e rendono la pagina non replicabile da un prodotto generico.
- Desktop ha una composizione efficace: titolo, mappa ampia e rail laterale convivono nel primo viewport.
- La navbar è semanticamente solida: quattro destinazioni stabili, etichette visibili, `aria-current="page"` corretto e fullscreen che rimuove le distrazioni globali.

## Problemi prioritari

### [P1] Su mobile la directory nasconde la mappa

**Perché conta:** a 390×844 le cinque aree e “Tutte le 11 aree” vengono prima della mappa. Nel controllo live la mappa iniziava a circa 607 px, mentre la navbar fissa iniziava a circa 664 px: nel primo stato utile resta solo una porzione minima e parzialmente coperta.

**Fix:** mostra la mappa subito dopo l’introduzione. Porta le aree sotto la mappa o dentro una disclosure compatta; dopo una selezione, mostra le escursioni in un accordion successivo alla mappa.

**Comando suggerito:** `$impeccable adapt src/pages/mappa.astro`

### [P1] La selezione area comunica due scope incompatibili

**Perché conta:** con Como selezionata il live status dice “5 escursioni”, la lista contiene 5 elementi, ma resta visibile “26 uscite” e il DOM conserva 25 marker/cluster. Sembra contemporaneamente filtro e semplice spostamento della camera.

**Fix:** scegli un contratto unico. O filtri davvero marker e conteggio, oppure rinomini l’azione “Centra su Como” e mostri “26 totali · 5 nell’area”, attenuando i punti esterni.

**Comando suggerito:** `$impeccable clarify src/pages/mappa.astro`

### [P2] Il rail delle aree supera il budget decisionale

**Perché conta:** all’ingresso ci sono 6 scelte; dopo Como diventano 13 azioni prima o attorno alla mappa. Su mobile il supporto alla navigazione diventa il compito principale.

**Fix:** mostra 3–4 aree suggerite più “Altre aree”. Mantieni area attiva e reset vicino alla mappa; rivela l’elenco escursioni solo su richiesta.

**Comando suggerito:** `$impeccable distill src/pages/mappa.astro`

### [P2] Navbar coerente nella struttura, divisa nel linguaggio visivo

**Perché conta:** desktop usa Leaf più sottolineatura Sunshine; mobile usa un grande riempimento Terracotta. Entrambi sono chiari, ma sembrano due sistemi di navigazione diversi. Inoltre la barra mobile fissa entra nel territorio della mappa inline.

**Fix:** conserva posizione, quattro voci e icone. Uniforma il concetto di stato corrente—per esempio fondo Paper/Leaf con lo stesso segno Sunshine—e aggiungi alla mappa mobile uno spazio inferiore che consideri altezza della navbar e safe area.

**Comando suggerito:** `$impeccable polish src/layouts/Layout.astro`

### [P2] Il linguaggio prestazionale compete con il diario

**Perché conta:** barre, record, ranking e stelle fanno emergere una dashboard fitness. Le foto compensano, ma arrivano tardi rispetto alla promessa narrativa.

**Fix:** conserva i numeri, ma accompagnali con data, compagni o una nota breve; anticipa un momento personale e riduci la dominanza visiva della metrica.

**Comando suggerito:** `$impeccable delight src/pages/mappa.astro`

## Persona Red Flags

**Casey, utente mobile distratto:** deve superare sei scelte prima della mappa; dopo Como, la lista di cinque escursioni la spinge ancora più in basso. La navbar persistente compete con il canvas.

**Jordan, prima visita:** “Como 5”, “26 uscite”, “Tutte” e “Tutte le 11 aree” descrivono azioni diverse con una gerarchia poco esplicita. Può interpretare lo stato come rotto.

**Sam, tastiera/screen reader:** la semantica è buona, ma dopo la selezione deve attraversare fino a 13 controlli prima di raggiungere la mappa; inoltre annuncio live e conteggio visibile raccontano scope diversi.

## Osservazioni minori

- La legenda con zampa non corrisponde esattamente al marker-ritratto di Gea.
- “Apri dettaglio” nel popup è corretto ma generico; “Apri il racconto” è più coerente col diario.
- “A parità di voto, prima la più recente” sembra documentazione di ordinamento più che una didascalia affettuosa.
- Il fullscreen è uno dei punti meglio risolti: chiaro, accessibile e privo di interferenze della navbar.

## Questions to Consider

- Il compito mobile primario è scegliere una provincia o esplorare le tracce?
- Quando si seleziona Como, vuoi filtrare davvero o soltanto centrare la mappa?
- Il ricordo di una giornata deve iniziare dal dislivello o da foto, persone e data?
