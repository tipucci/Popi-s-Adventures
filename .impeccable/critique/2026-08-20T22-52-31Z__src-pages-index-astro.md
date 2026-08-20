---
target: homepage aggiornata
total_score: 22
max_score: 28
na_heuristics: 5,7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-20T22-52-31Z
slug: src-pages-index-astro
---
Method: dual-agent (A: `/root/recritique_design_a` · B: `/root/recritique_evidence_b2`)

## Valutazione complessiva

Il passaggio memories-first ha funzionato. La homepage ora appare autoriale e riconoscibilmente Popi’s: fotografia di Gea, voce italiana, Nunito rotondo, crema/Leaf/Sunshine, dati compatti e About costruiscono un diario condiviso anziché un prodotto fitness.

La nuova lettura è corretta: hero → ultima avventura → due ricordi fotografici → fatti accumulati → Tizi, Meg e Gea. Le statistiche non competono più con le memorie e le card recenti non sembrano più widget SaaS. Il limite principale è contenutistico ma decisivo: la memoria più importante, Monte Spedone, non ha una fotografia e apre quindi il diario con il contenuto visivamente meno personale. Il fallback è onesto e ben contenuto, ma non può sostituire l’emozione della foto promessa dalla CTA.

Il body della homepage è ormai coerente con DESIGN.md; header e soprattutto footer restano chiaramente appartenenti al sistema precedente.

## Design Health Score

| # | Euristica | Voto | Punto chiave |
|---|---|---:|---|
| 1 | Visibilità dello stato | 3 | Stato Home chiaro; feedback dei link riconoscibile. |
| 2 | Corrispondenza col mondo reale | 4 | “Apri il ricordo”, luoghi, date e “Foto in arrivo” parlano la lingua del diario. |
| 3 | Controllo e libertà | 3 | Home, archivio e mappa sono sempre raggiungibili. |
| 4 | Coerenza e standard | 2 | Corpo journal coerente; header e footer appartengono ancora al vecchio sistema. |
| 5 | Prevenzione errori | n/a | Nessun input o flusso distruttivo. |
| 6 | Riconoscimento, non memoria | 4 | Azioni e navigazione sono etichettate; nessun modello nascosto. |
| 7 | Flessibilità/efficienza | n/a | Non applicabile a una homepage Experience. |
| 8 | Estetica e minimalismo | 3 | Corpo molto più disciplinato; footer ancora sovraccarico. |
| 9 | Recupero dagli errori | 3 | Fallback espliciti e stato vuoto con “Riprova”. |
| 10 | Aiuto/documentazione | n/a | Non necessario per questa superficie. |
| **Totale** |  | **22/28** | **Good — 79%.** |

Il carico cognitivo è sceso da moderato diffuso a moderato localizzato: 2/8 fallimenti, entrambi nel footer. Il percorso principale rispetta il limite di quattro elementi; il footer presenta invece circa venti opzioni tra sei scorciatoie, quattro stagioni, province e “Vedi tutte”.

## Design specificity

**Verdetto:** authored and recognizably Popi’s. Non è più category-interchangeable.

La singola freccia gialla è riuscita: non riempie uno spazio, ma conduce dall’hero al diario. Anche il piccolo marker “Con Gea” firma la pagina senza trasformarla in scrapbook. L’asimmetria featured/secondary è motivata dal contenuto e non sembra variazione decorativa.

Il detector ha rilevato otto advisory, tutti `design-system-font-size`: due in `index.astro`, quattro in `HomeAdventureCard.astro` e due nel `Layout.astro`. Sono otto dichiarazioni distinte ma un solo difetto sistemico: taglie compatte introdotte fuori dalla scala tipografica documentata. Non sono falsi positivi rispetto a DESIGN.md, anche se alcune misure sono ragionevoli nel contesto.

Nessun overlay browser affidabile è disponibile: la valutazione visiva è stata eseguita nel browser, mentre il passaggio detector sostitutivo è stato deliberatamente limitato alla scansione deterministica dopo il blocco del primo agent B.

## Cosa funziona e va preservato

- **Hero:** Gea porta subito umanità; overlay leggibile, CTA primaria unica e mappa correttamente secondaria.
- **Gerarchia recente:** la prima memoria pesa più delle altre due e i dati sono una riga quieta, non pannelli metrici.
- **Stats:** “Il diario, fin qui” funziona come pausa retrospettiva, non come dashboard.
- **About:** fotografia autentica, copy personale e lieve sovrapposizione creano il secondo picco emotivo.
- **Personalità:** una sola freccia, sottolineature Sunshine e “Con Gea” sono sufficienti. Non aggiungere altri doodle in questa fase.
- **Accessibilità di base:** heading lineari, alt dell’hero descrittivo, focus visibili e tap target principali adeguati.

## Priority issues

### [P1] La memoria principale è quella meno fotografica

**Perché conta:** “Scopri l’ultima avventura” promette un ricordo, ma Monte Spedone apre con un’illustrazione segnaposto. La pagina recupera con le due foto successive, però il primo momento editoriale resta il più debole.

**Fix:** scegliere consapevolmente tra cronologia pura e forza editoriale. Opzione A: mantenere Monte Spedone in evidenza e aggiungere appena possibile una vera cover locale. Opzione B: mettere in evidenza la più recente avventura con foto e presentare Monte Spedone come breve aggiornamento testuale “foto in arrivo”. Non eliminare l’etichetta onesta del fallback.

**Suggested command:** `$impeccable shape`.

### [P1] Il footer annulla la qualità dell’ending

**Perché conta:** dopo il picco umano dell’About, la pagina cambia genere: grande blocco scuro, serif, contenitore arrotondato e una matrice di link/pillole da portale outdoor. Il ricordo finale non è Tizi, Meg e Gea, ma una tassonomia.

**Fix:** lasciare 3–4 destinazioni ad alto valore e un solo ingresso all’archivio completo; usare Nunito e una chiusura crema/carta più quieta. Stagioni e province appartengono alla pagina Escursioni.

**Suggested command:** `$impeccable distill`.

### [P2] L’header resta app chrome del sistema precedente

**Perché conta:** capsula bianca, active pill terracotta, blur e ombra si scontrano con il body piatto e marker-on-paper. La navigazione è chiara, ma sembra provenire da un altro prodotto.

**Fix:** preservare le quattro etichette e lo stato attivo, riducendo elevazione e silhouette a capsula; usare Leaf/Ink e un accento Sunshine più vicino al linguaggio del diario.

**Suggested command:** `$impeccable quieter`.

### [P2] La bottom navigation mobile copre regolarmente il contenuto in lettura

**Perché conta:** il controllo resta accessibile al pollice, ma la capsula fissa da circa 74 px si sovrappone a titoli, metadati e About mentre si scorre. A 320 px le quattro etichette sono inoltre molto compresse.

**Fix:** mantenere il concetto bottom-nav ma ridurne l’impronta, aggiungere gestione esplicita della safe area e verificare spaziatura/label a 320 px e zoom 200%.

**Suggested command:** `$impeccable adapt`.

### [P3] La tipografia è visivamente coerente ma non ancora sistemica

**Perché conta:** il detector ha trovato `0.8125rem`, `0.9375rem`, `1.125rem`, `clamp(1.4rem, 4vw, 1.75rem)`, `2.2rem` e `11px` fuori dalla scala DESIGN.md. Non rompe l’esperienza, ma rende la futura manutenzione meno prevedibile.

**Fix:** ricondurre i contesti compatti a label/body/title documentati oppure estendere esplicitamente la scala se questi gradini sono davvero necessari.

**Suggested command:** `$impeccable typeset`.

## Persona red flags

**Jordan, prima visita:** l’azione iniziale è ora chiara e tutte le icone principali hanno etichette. Il footer reintroduce però tre modelli di scoperta simultanei — scorciatoie, stagioni e province — senza indicare quale usare. `D+` resta l’unico termine non immediato.

**Riley, stress tester:** il fallback fotografico è trasparente e cliccabile, e lo stato senza escursioni offre “Riprova”. Il rischio strutturale è che l’ordinamento puramente cronologico permetta sempre a una nuova voce senza media di sostituire una memoria visivamente più ricca.

**Casey, mobile distratto:** il percorso è molto più corto e la memoria arriva subito. La bottom navigation è comoda ma occupa una fascia costante del viewport e, a 320 px, etichette come “Escursioni” hanno margine ridotto.

## Emotional journey

- **Apertura:** picco forte e personale grazie a Gea e alla fotografia reale.
- **Ingresso nel diario:** gerarchia chiara, ma calo emotivo sul placeholder featured.
- **Recupero:** le due fotografie recenti ristabiliscono autenticità e varietà.
- **Secondo picco:** About, candid photograph e copy affettuoso.
- **Finale:** il footer diluisce l’effetto e chiude come directory.

## Minor observations

- Il pannello Paper dell’About è ancora piuttosto esteso; funziona, ma non deve crescere fino a diventare un’altra card dominante.
- Il fallback featured potrebbe guadagnare leggermente più contrasto nel motivo montano, restando dichiaratamente secondario.
- Il footer usa ancora `font-display` serif mentre il body aggiornato è Nunito.
- Durante l’ispezione il dev server ha restituito 404 per `/sw.js`; è un tema tecnico separato, da verificare con `$impeccable audit` se compare anche fuori dallo sviluppo locale.

## Questions to consider

- Conta di più che l’avventura featured sia l’ultima in assoluto o che sia la più recente con una fotografia autentica?
- La pagina dovrebbe terminare con una directory oppure con Tizi, Meg e Gea e un solo passo successivo?
- Quanto del vecchio linguaggio di header/footer vuoi conservare come continuità con le altre pagine?
