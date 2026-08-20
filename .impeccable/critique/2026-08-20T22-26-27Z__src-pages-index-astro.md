---
target: homepage
total_score: 18
max_score: 28
na_heuristics: 5,7,10
p0_count: 0
p1_count: 3
timestamp: 2026-08-20T22-26-27Z
slug: src-pages-index-astro
---
Method: dual-agent (A: `/root/critique_design_a` · B: `/root/critique_evidence_b2`)

## 1. Overall assessment

La homepage è già autentica nei contenuti, ma ancora intercambiabile nell’interfaccia. Le fotografie reali, Gea, i nomi, i luoghi e il tono italiano appartengono chiaramente a Popi’s Adventures; la composizione — hero scura, navigazione in una grande pillola, quattro KPI, tre card equivalenti, pannello About e footer-directory — potrebbe invece appartenere a un prodotto travel/fitness generico.

Il primo schermo comunica “bel sito outdoor” più che “apro il diario di Tizi, Meg e Gea”. La fotografia crea calore, ma il passaggio immediato ai quattro numeri sposta il baricentro dalle memorie alla performance. La direzione di DESIGN.md è presente soprattutto nel contenuto, non ancora nel linguaggio visivo: mancano il Nunito come unica voce funzionale, il canvas piatto carta/crema, gli accenti-marker, la controlled asymmetry e pochi segni disegnati con uno scopo preciso.

**Verdetto di specificità:** content-authored, interface-interchangeable. La priorità non è aggiungere decorazione, ma rimettere in ordine i tre livelli: contenuto dominante, interfaccia quieta, personalità come firma.

### Verifica euristica

| # | Euristica | Voto | Sintesi |
|---|---|---:|---|
| 1 | Visibilità dello stato | 3 | Stato attivo chiaro; fallback dati senza retry. |
| 2 | Corrispondenza col mondo reale | 3 | Voce naturale; `D+`, icone non etichettate e chip “Escursione” richiedono interpretazione. |
| 3 | Controllo e libertà | 3 | Destinazioni stabili e card interamente cliccabili. |
| 4 | Coerenza e standard | 2 | Coerente internamente, ma in forte deriva da DESIGN.md. |
| 5 | Prevenzione errori | n/a | Nessun input o flusso distruttivo. |
| 6 | Riconoscimento, non memoria | 3 | Navigazione testuale chiara; significato delle icone nascosto. |
| 7 | Flessibilità/efficienza | n/a | Non applicabile a questa homepage esperienziale. |
| 8 | Estetica e minimalismo | 2 | Troppi pannelli, pillole, ombre, stati inattivi e contenuti nel footer. |
| 9 | Riconoscimento e recupero errori | 2 | Il timeout espone il CSV e non offre un’azione di recupero. |
| 10 | Aiuto/documentazione | n/a | Non richiesto per questa superficie. |
| **Totale** |  | **18/28** | **Accettabile, ma lontano dalla nuova direzione.** |

Il carico cognitivo è moderato: la lettura è ordinata, ma chunking, scelta minima e progressive disclosure soffrono. Su mobile, le statistiche occupano circa 592 px subito dopo l’hero e la sezione delle tre avventure circa 1.814 px: la parte più personale arriva troppo tardi.

## 2. What already works

- **Materiale umano vero.** Hero, fotografie delle escursioni, ritratto di Tizi/Meg/Gea, date, luoghi e copy affettuoso sono una base molto più forte di qualunque doodle.
- **About convincente.** “Chi sono i popi?” è il momento più vicino al diario desiderato: specifico, affettuoso, riconoscibile.
- **Navigazione comprensibile.** Le quattro destinazioni, lo stato attivo e la bottom navigation mobile danno un orientamento immediato.
- **Gerarchia informativa leggibile.** Data, titolo e luogo delle escursioni si scansionano bene; le metriche sono comprensibili quando non dominano.
- **Fondamenta accessibili.** Heading semantici, aree cliccabili generose, alt text presenti e gestione di `prefers-reduced-motion` meritano di restare.

## 3. Highest-impact problems

### 1. Le memorie arrivano dopo la performance

- **Problema attuale:** hero con due CTA generiche, poi quattro grandi KPI prima di qualsiasi racconto recente.
- **Conflitto con DESIGN.md:** la regola esplicita è “memories before performance”. Qui il percorso è fotografia → azioni di prodotto → dashboard.
- **Direzione desiderata:** far entrare nella più recente avventura come storia editoriale; comprimere i numeri in una riga secondaria o in piccole note a margine.
- **Impatto:** high.

### 2. Il nuovo linguaggio visivo non è ancora applicato

- **Problema attuale:** Fraunces, verde bosco/terracotta precedente, gradienti, ombre, pillole e grandi raggi; nessun segno imperfetto o accento-marker significativo.
- **Conflitto con DESIGN.md:** contraddice “Hand-Drawn Adventure Journal”, Flat Notebook, Geometry Has a Job e la gerarchia Nunito 800.
- **Direzione desiderata:** prima riallineare font, palette, superfici piatte e geometrie; poi aggiungere solo 2–3 segni espressivi con funzione editoriale.
- **Impatto:** high.

### 3. Le escursioni recenti sembrano schede fitness

- **Problema attuale:** ogni card contiene tre mini-pannelli metrici e quattro icone circolari, incluse quelle inattive, dentro un altro guscio con raggio e ombra. La prima escursione, Pietra Bismantova, mostra inoltre un grande placeholder.
- **Conflitto con DESIGN.md:** la fotografia dovrebbe dominare e la riga dati dovrebbe sostenere il ricordo, non scomporlo in widget.
- **Direzione desiderata:** foto → titolo → luogo/data → una sola riga compatta (`km · D+ · durata`); mostrare solo caratteristiche attive e dare alla prima avventura un peso editoriale diverso.
- **Impatto:** high.

### 4. I contenitori sono diventati il linguaggio principale

- **Problema attuale:** header, hero, KPI, card, metriche, icone, About, footer e link sono quasi tutti scatole arrotondate, spesso elevate.
- **Conflitto con DESIGN.md:** un quaderno non trasforma ogni ricordo in un pannello fluttuante; raggruppamento e importanza dovrebbero nascere prima da spaziatura e tipografia.
- **Direzione desiderata:** superfici trasparenti, bordi solo quando servono, raggi moderati soprattutto sulle foto, ombre riservate a elementi davvero staccati.
- **Impatto:** medium.

### 5. Il footer chiude come un catalogo, non come un diario

- **Problema attuale:** scorciatoie, stagioni, undici province, conteggi e navigazione ripetuta generano un’altra area di discovery molto densa.
- **Conflitto con DESIGN.md:** l’ultimo momento è amministrativo e prodotto-centrico; la pagina perde il calore costruito dall’About.
- **Direzione desiderata:** spostare la tassonomia completa nell’archivio e chiudere con 3–4 percorsi essenziali più una breve nota affettuosa.
- **Impatto:** medium.

## 4. Section-by-section critique

### Header

Desktop: etichette e stato attivo funzionano, ma la grande capsula bianca con blur/ombra, il centro vuoto e la navigazione spostata a destra sembrano un app shell. Il carattere può arrivare da un sottolineato irregolare dello stato attivo, mantenendo però le etichette pulite.

Mobile: la bottom navigation è leggibile e comoda al pollice; va preservata come idea. La piccola marca isolata in alto sembra incompleta e la capsula fissa sottrae spazio visivo alle sezioni. Va alleggerita, non resa più fantasiosa.

### Hero

La fotografia di Gea nel paesaggio è la scelta giusta, ma l’overlay verde intenso ne attenua l’emozione. “Popi’s Adventures” più due CTA produce il pattern standard di una landing page. “Scopri le escursioni” può restare primario solo se apre davvero il ricordo più recente; “Apri la mappa” dovrebbe essere un’azione secondaria più quieta. Il trio Tizi/Meg/Gea non è ancora comprensibile abbastanza presto.

### Stats

I dati sono utili e il copy è amichevole, ma quattro card uguali fanno sembrare `17`, `54,2 km`, `2050 m` e `10 con Gea` il manifesto del sito. “Con Gea” è l’unico dato con potenziale affettivo: dovrebbe diventare un ponte narrativo verso Gea, non il quarto KPI. La sezione deve restare pulita e funzionale, ma molto più compatta.

### Recent adventures

Data, titolo e luogo funzionano; le fotografie disponibili sono il capitale emotivo principale. Le tre card equivalenti, i pannelli metrici, gli stati inattivi e l’hover-lift producono però un inventario. La prima card dovrebbe essere la “pagina aperta” del diario; Cassina Enco e Parco Fluviale Taro possono seguirla come ricordi secondari. Il placeholder dominante di Pietra Bismantova spezza la promessa photography-first: serve una foto reale oppure un trattamento “foto in arrivo” volutamente discreto.

### About

È la sezione più riuscita e quella da toccare meno. Fotografia e copy finalmente spiegano chi sono i popi, l’energia di Gea e il senso del diario. Il guscio a due colonne, il gradiente, l’ombra e l’effetto lift la rendono però una card convenzionale e suggeriscono click dove non c’è. Basta appiattirla e introdurre una lieve sovrapposizione o una breve nota a margine; non va trasformata in un collage.

### Footer

Scorciatoie, stagioni e province sono utili nell’archivio, non tutte nella chiusura della homepage. La navigazione duplicata e i numerosi elementi boxed rendono il footer la parte più vicina a una piattaforma outdoor. Soprattutto su mobile, la bottom nav rende ancora meno necessario ripetere tutte le destinazioni.

### Stress-test persona

- **Prima visita:** `D+`, le icone circolari e “Escursione” non spiegano subito il loro significato; hero e CTA non indicano quale ricordo valga la pena aprire per primo.
- **Connessione debole:** il fallback comunica “il CSV non ha risposto entro 8 secondi”, espone un dettaglio tecnico e non dà un retry.
- **Mobile distratto:** stats e tre card molto alte ritardano “Chi sono i popi?”; la bottom nav fissa riduce ulteriormente il viewport disponibile.

## 5. Opportunities for human character

1. **Una freccia curva “ultima avventura” verso Pietra Bismantova.** Aiuta a capire dove si apre il diario e costruisce una gerarchia narrativa.
2. **Una breve traccia di zampette tra “Con Gea” e l’About.** Trasforma Gea da statistica a filo conduttore della pagina.
3. **Una linea-percorso imperfetta che collega i tre ricordi recenti.** Comunica successione e collezione; orizzontale su desktop, verticale su mobile.
4. **Un cerchio o sottolineato grezzo su un solo dettaglio reale della prima escursione.** Evidenzia ciò che è memorabile — data o luogo — senza inventare una storia.
5. **Un piccolo sole, cuore o stella accanto alla frase finale del diario.** Chiude con affetto invece che con tassonomia. Tutti i segni puramente decorativi devono essere `aria-hidden`.

Nessun doodle dovrebbe riempire uno spazio vuoto “perché manca qualcosa”: ciascuno deve orientare, collegare o dare enfasi.

## 6. What to remove or simplify

- Ridurre le quattro statistiche a una sola striscia compatta.
- Eliminare le icone-feature inattive e i tre riquadri metrici interni alle card.
- Rimuovere il chip generico “Escursione” quando non aggiunge informazione.
- Togliere la maggior parte di shell, gradienti, ombre, hover-lift e raggi oversize.
- Spostare l’elenco completo di stagioni e province nell’archivio.
- Demotare “Apri la mappa” a link secondario se l’ultima avventura diventa l’ingresso principale.
- Semplificare il fallback dati: messaggio umano breve più “Riprova”, senza citare CSV o otto secondi.

Il detector conferma la deriva: 17 segnalazioni grezze (2 warning, 15 advisory), equivalenti a 16 difetti unici dopo aver unito i due warning sulla stessa dichiarazione Fraunces. Le anomalie sono concentrate in About/Layout: font non dichiarato, colori, raggi e taglie fuori dai token di DESIGN.md. Non sono la causa completa del problema, ma corroborano il disallineamento visivo visto nel browser.

## 7. What to preserve

- Tutte le fotografie locali autentiche e il copy personale.
- La presenza delle tre avventure recenti e i loro dati reali.
- Le quattro destinazioni principali e uno stato attivo sempre riconoscibile.
- La bottom navigation mobile come modello, alleggerendone la resa.
- La fotografia e i testi dell’About, inclusa la personalità di Gea e l’idea delle giornate semplici “stanchi ma felici”.
- Il fondo crema e l’alto contrasto tra Ink/Leaf.
- L’ordine di lettura, i touch target, la semantica, gli alt text significativi e `prefers-reduced-motion`.
- La chiarezza funzionale di mappa, filtri e metadati: devono restare sobri, non diventare disegnini.

## 8. First implementation pass

Il passaggio minimo coerente, senza dipendenze e senza toccare le altre pagine, è:

1. Riallineare solo la homepage a Nunito, palette di DESIGN.md, superfici piatte, raggi moderati e ombre selettive.
2. Alleggerire l’overlay dell’hero e far puntare la CTA primaria all’ultima avventura; aggiungere una sola freccia SVG locale con funzione editoriale.
3. Trasformare i quattro KPI in una riga compatta di dati secondari.
4. Dare alla prima avventura un layout editoriale più grande; ridurre le altre due; comprimere le metriche in una riga e mostrare solo feature attive.
5. Appiattire l’About senza cambiarne fotografia o copy e aggiungere il solo richiamo di zampette se collega davvero “Con Gea” alla storia.

Questo primo passaggio sposterebbe subito la percezione da “piacevole dashboard escursionistica” a “diario outdoor personale”. La riduzione completa del footer e l’affinamento dell’header possono restare un secondo passaggio: sono importanti, ma non devono bloccare il riequilibrio iniziale tra memoria e performance.
