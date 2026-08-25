---
target: pagina di dettaglio delle escursioni dopo le modifiche apportate
total_score: 23
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-24T17-59-08Z
slug: src-pages-escursioni-slug-astro
---
# Critique — dettaglio escursione dopo le modifiche

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibilità dello stato del sistema | 3 | Stati di mappa, lightbox e upload chiari; manca un contesto visibile per la modalità editoriale. |
| 2 | Corrispondenza con il mondo reale | 3 | Linguaggio naturale, ma “Il percorso” mostra soltanto un punto. |
| 3 | Controllo e libertà | 3 | Uscite e focus sono ben gestiti; sostituzione cover senza annullamento. |
| 4 | Coerenza e standard | 3 | Sistema visivo coeso; chip cliccabili e statici hanno lo stesso aspetto. |
| 5 | Prevenzione degli errori | 2 | Validazioni presenti, ma mancano anteprima del crop, conferma sovrascrittura e recupero cover. |
| 6 | Riconoscimento invece di ricordo | 3 | Controlli leggibili; password e azionabilità dei chip richiedono inferenza. |
| 7 | Flessibilità ed efficienza | n/a | Superficie Experience, senza flusso esperto ripetitivo per il lettore. |
| 8 | Design estetico e minimale | 3 | Molto pulito; admin UI, mappa sovradimensionata e finale debole riducono il focus. |
| 9 | Recupero dagli errori | 3 | Retry e messaggi sono validi; nessun recupero dopo la sostituzione cover. |
| 10 | Aiuto e documentazione | n/a | Esperienza passiva: etichette e stati contestuali sono sufficienti. |
| **Totale** |  | **23/32** | **Buono, appena sopra la soglia del 70%.** |

## Design Specificity Verdict

**Fortemente autoriale per Popi’s Adventures: circa 8/10.** Fotografie reali, Gea sulla mappa, “La squadra di oggi”, compagni nominati e “Il voto di Gea” rendono la pagina difficilmente trasferibile a un prodotto generico. La palette calda e i segni disegnati seguono bene la direzione “Hand-Drawn Adventure Journal”. La specificità cala nella sequenza convenzionale titolo → dati → mappa → galleria, nella grande mappa Leaflet con un solo pin e nei controlli CMS pubblici.

Il detector CLI è pulito: **0 finding** sui quattro file della superficie. Il detector browser ha rilevato 4 gruppi/5 hit: quattro sono falsi positivi motivati (palette crema intenzionale, contenitore Leaflet edge-to-edge, attribuzione vendor, utility Tailwind non attiva nella pagina). Resta un advisory P3 sul bordo sottile più ombra da 40px della bottom navigation mobile, superiore al massimo di 24px definito dal design system. L’iniezione è riuscita in una scheda temporanea, ma non esiste un overlay visibile all’utente perché il runtime non consente la presentazione del browser da un sub-agent.

## Overall Impression

La pagina ora è pulita, personale e piacevole da leggere. La rimozione delle due frasi accessorie migliora il ritmo e il bordo singolo della mappa risolve il precedente effetto “cornice nella cornice”. La maggiore opportunità non è più cosmetica: bisogna decidere se la pagina è un diario per i visitatori o anche un editor pubblico, e se la mappa racconta davvero un percorso oppure soltanto un luogo.

## Cosa funziona

1. **Hero autentica e fotografica.** L’asimmetria desktop è editoriale; su mobile titolo, immagine e tre dati restano leggibili senza pressione orizzontale.
2. **Voce di prodotto riconoscibile.** “La squadra di oggi” e “Il voto di Gea” trasformano una scheda trekking in un ricordo condiviso.
3. **Craft delle interazioni.** Lightbox e fullscreen della mappa hanno target ampi, tastiera, ripristino del focus e stati chiari. Il nuovo bordo della mappa è coerente e non genera più rumore.

## Cognitive Load

**3 fallimenti su 8: carico moderato.** Falliscono focus singolo (lettura e amministrazione competono), chunking (otto chip dei partecipanti senza sottogruppi) e scelte minime (la mappa espone più di quattro target simultanei). Gerarchia, raggruppamento, continuità di memoria e progressive disclosure sono invece solidi. Le decisioni sopra quattro opzioni sono la mappa inline, gli otto chip visivamente equivalenti e i cinque link conclusivi del footer.

## Emotional Journey

La fotografia di gruppo crea un picco immediato; i dati sintetici rassicurano; il voto di Gea è il momento più memorabile. La mappa a pin singolo crea una valle utilitaria troppo lunga. La galleria recupera calore, ma il terzo scatto isolato e l’azione “Aggiungi foto” fanno terminare l’esperienza come manutenzione, non come ricordo o invito alla prossima avventura.

## Priority Issues

### [P1] I controlli amministrativi interrompono l’esperienza pubblica

**Perché conta:** “Modifica cover” appare prima della fotografia e “Aggiungi foto” chiude la galleria; per un visitatore sembrano azioni primarie e aprono una richiesta password senza contesto.

**Fix:** mostrarli solo in modalità amministratore autenticata oppure spostarli in `/admin`. Se devono restare inline, introdurre una modalità modifica persistente e aggiungere anteprima crop, conferma sovrascrittura e recupero.

**Comando suggerito:** `$impeccable distill`

### [P1] “Il percorso” promette una traccia ma mostra soltanto una posizione

**Perché conta:** il peso visivo della mappa suggerisce indicazioni pratiche che non esistono; l’utente trova solo un pin nell’area di Lecco.

**Fix:** se non esiste GPX, rinominare in “Dove siamo stati” o “Punto di partenza” e ridurre l’altezza inline. Se la traccia esiste, mostrare polilinea, partenza/arrivo e bounds del percorso.

**Comando suggerito:** `$impeccable clarify`

### [P2] La voce diaristica è debole nella pagina rappresentativa

**Perché conta:** descrizione hero e didascalie sono assenti; gli alt della galleria descrivono numeri di foto invece del significato del momento.

**Fix:** supportare una breve nota autentica “Com’è andata”, didascalie opzionali e alt descrittivi che nominino persone, Gea, luogo o azione, senza inventare contenuto.

**Comando suggerito:** `$impeccable clarify`

### [P2] Il terzo scatto lascia un vuoto algoritmico su desktop

**Perché conta:** i primi due scatti sembrano composti editorialmente; il terzo occupa cinque colonne e lascia sette colonne vuote, indebolendo il finale.

**Fix:** applicare una regola per quantità dispari: ultimo scatto a 7 o 12 colonne, oppure full-width come chiusura. Terminare con una nota o la prossima escursione, non con manutenzione UI.

**Comando suggerito:** `$impeccable layout`

### [P2] Mobile: immagini pesanti e navigazione persistente coprono il contenuto

**Perché conta:** asset da centinaia di KB e dimensioni molto superiori al viewport rallentano il cuore fotografico; la bottom navigation sovrappone mappa e immagini.

**Fix:** produrre thumbnail responsive con `srcset`/`sizes`, riservare gli asset grandi al lightbox e ridurre/nascondere temporaneamente la barra durante le viste immersive. Ridurre anche l’ombra della barra da 40px verso il token ambient da 24px.

**Comando suggerito:** `$impeccable optimize`

## Persona Red Flags

**Jordan, primo visitatore:** può scambiare “Modifica cover” per l’azione principale, non comprende la password amministrativa e interpreta “Il percorso” come una traccia reale. Il finale non suggerisce cosa leggere o esplorare dopo.

**Sam, tastiera/screen reader:** lightbox e mappa sono ben gestiti, ma gli alt delle foto sono generici; l’overlay upload non rende inert il documento sottostante; chip link e chip statici appaiono uguali; alcune etichette attenuate sono circa 4,23:1, sotto 4,5:1.

**Casey, mobile distratto:** la barra inferiore copre parti di mappa e fotografie, le sorgenti fotografiche sono sovradimensionate e il file input nativo può troncare il testo nel modal stretto.

## Minor Observations

- “Modifica foto di copertina” è più chiaro e coerente di “Modifica cover”.
- Le stringhe `e'` e `puo'` nell’upload andrebbero corrette in italiano tipografico.
- Testare il caso con tutti e tre i dati impostati su “Non disponibile”.
- Il marker di Gea è un dettaglio di brand eccellente.
- Il bordo/ombra della bottom navigation è l’unico advisory plausibile del detector browser, ma resta P3.
