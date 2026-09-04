---
target: coerenza stilistica e UI della pagina escursione Oasi Campocatino
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-09-04T21-14-26Z
slug: src-pages-escursioni-slug-astro
---
Method: dual-agent (A: `/root/critique_design_a` · B: `/root/critique_evidence_b`)

## Design Health Score

| # | Euristica | Punteggio | Punto debole principale |
|---|---|---:|---|
| 1 | Visibilità dello stato | 3/4 | Navigazione attiva chiara; i controlli di modifica non chiariscono però quando e per chi siano disponibili. |
| 2 | Corrispondenza col mondo reale | 4/4 | Linguaggio naturale, ordine luogo/data e metafore di rifugio e impronta funzionano molto bene. |
| 3 | Controllo e libertà | 3/4 | Back, navigazione, mappa e lightbox sono solidi; i comandi admin pubblici aprono deviazioni evitabili. |
| 4 | Coerenza e standard | 3/4 | Sistema visivo coerente, ma persone cliccabili e non cliccabili hanno lo stesso identico trattamento. |
| 5 | Prevenzione degli errori | 3/4 | L’upload ha buoni vincoli; mostrarlo a ogni lettore incoraggia però un percorso errato. |
| 6 | Riconoscimento anziché memoria | 3/4 | Icone e controlli hanno etichette; l’interattività dei nomi non è riconoscibile a vista. |
| 7 | Flessibilità ed efficienza | 2/4 | Buon supporto base da tastiera, ma la barra mobile occupa sempre una parte importante del viewport. |
| 8 | Estetica e minimalismo | 3/4 | Pagina calma e leggibile; utility amministrative e moduli separati indeboliscono il racconto. |
| 9 | Riconoscimento e recupero dagli errori | 3/4 | Upload chiaro e recuperabile; lo stato di errore della mappa non emerge nella pagina. |
| 10 | Aiuto e documentazione | 2/4 | La lettura richiede poco aiuto, ma modalità admin e significato del rating non hanno contesto. |
| **Totale** |  | **29/40** | **Buona base, con problemi di coerenza ad alto impatto.** |

## Verdetto sulla specificità

Il sito possiede ingredienti fortemente riconoscibili: fotografie reali, palette carta–bosco, Alegreya, il marchio di Gea, l’impronta, il rating e il tono da diario italiano. La composizione complessiva resta però abbastanza convenzionale: hero → tre dati → compagnia → mappa → galleria.

“La squadra di oggi” dovrebbe essere il picco affettivo della pagina, ma oggi assomiglia a un riepilogo di database: cinque pillole, un rifugio e un rating distribuiti come tre widget. Il rating di Gea è il dettaglio più personale e riuscito, ma non basta ancora a unificare la scena.

Il detector automatico è pulito: 0 segnalazioni in `src/pages/escursioni/[slug].astro`. Questo conferma la correttezza meccanica, non la piena coerenza percettiva. Nessun falso positivo. Non è disponibile un overlay affidabile: il controllo è stato condotto con screenshot freschi desktop/mobile, accessibility tree e DOM renderizzato.

## Impressione generale

La pagina è già piacevole, leggibile e molto più caratteristica di una normale scheda escursione. La maggiore opportunità è trasformare la sezione “squadra” da insieme di metadati a breve capitolo del ricordo, senza aggiungere rumore.

## Cosa funziona

- L’apertura fotografica dà priorità alla giornata vissuta, non alla performance.
- Alegreya + Alegreya Sans, fondo crema e verde foglia costruiscono un’identità calda senza diventare infantili.
- Le fondamenta accessibili sono buone: struttura semantica, `dl` per i dati, controlli nominati, target da 44 px, focus visibile e rating con etichetta accessibile.

## Problemi prioritari

1. **[P1] Modalità lettore e amministratore sono mescolate.** “Modifica cover” e “Aggiungi foto” interrompono il racconto e conducono un normale visitatore verso una password. Correzione: mostrare gli upload solo in modalità admin autenticata o locale, con un unico ingresso discreto. Comando: `$impeccable distill`, poi `$impeccable harden`.
2. **[P1] Le descrizioni delle immagini di Campocatino sono generiche.** Testi come “foto 01 della galleria” e caption vuote contraddicono le regole del progetto. Correzione: alt specifici e caption brevi; bloccare upload/build quando resta un fallback generico. Comando: `$impeccable audit` + `$impeccable harden`.
3. **[P2] La squadra ha affordance ambigue e gerarchia interna debole.** Gea è un link, gli altri nomi no, ma tutte le pillole sembrano identiche. Rifugio e rating appaiono come blocchi indipendenti. Correzione: distinguere chiaramente i link e comporre “Con noi”, “Tappa” e “Voto di Gea” come un’unica banda editoriale. Comando: `$impeccable layout` + `$impeccable clarify`.
4. **[P2] Il ritmo emotivo cala prima della galleria.** La squadra è visivamente più debole della grande mappa tecnica. Correzione: dare maggiore continuità alla squadra e rendere la mappa un supporto più compatto, senza inventare copy. Comando: `$impeccable delight` + `$impeccable layout`.
5. **[P2] La barra mobile copre contenuto significativo.** Correzione: riservare spazio reale, ridurne l’ingombro oppure adottare hide-on-scroll-down/show-on-scroll-up ben testato. Comando: `$impeccable adapt`.

## Carico cognitivo

Moderato: 2 fallimenti su 8. Falliscono chunking e grouping nella sezione squadra. Non esistono veri punti decisionali con più di quattro azioni; le cinque pillole sono soprattutto un problema di affordance. Focus, sequenza lineare, memoria richiesta e progressive disclosure sono buoni.

## Percorso emotivo

La cover è un ottimo picco iniziale, subito interrotto dal comando “Modifica cover”. I dati creano una pausa utile. La squadra dovrebbe essere il secondo picco, ma oggi il formato da roster la raffredda. La mappa costituisce la valle più tecnica; la galleria recupera bene l’emozione finale, salvo perdere valore quando alt e caption sono generici.

## Red flag per persona

- **Jordan, prima visita:** può credere che modificare la cover sia un’azione pubblica. Nella squadra prova nomi visivamente identici e scopre solo dopo che uno è cliccabile e gli altri no.
- **Sam, screen reader o zoom elevato:** riceve descrizioni ordinali generiche delle foto e perde la storia visiva; la bottom navigation può coprire il contesto al 200%.
- **Casey, mobile e distratto:** apprezza i target grandi e la navigazione in basso, ma la barra copre contenuto e i comandi admin aggiungono decisioni irrilevanti.

## Osservazioni minori

- Su desktop la sezione squadra usa molta larghezza ma resta visivamente sottoriempita.
- “Rifugio Campocatino” dipende troppo dall’icona per chiarire il proprio ruolo.
- Il rating di Gea è riuscito e va conservato come momento affettivo principale.
- L’attribuzione Leaflet è piccola e compressa su mobile.
- `manifest.webmanifest` e `sw.js` restituiscono 404 in sviluppo.
- `.impeccable/design.json` risulta non allineato a `DESIGN.md`; non è stato aggiornato automaticamente.

## Domande progettuali

- La squadra deve raccontare soprattutto relazioni e memoria, oppure rimanere metadato compatto?
- La mappa merita davvero più peso visivo delle persone che hanno vissuto la giornata?
