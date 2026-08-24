---
target: pagina di dettaglio delle escursioni
total_score: 20
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-24T17-03-34Z
slug: src-pages-escursioni-slug-astro
---
## Design Health Score

| # | Euristica | Punteggio | Problema chiave |
|---|---|---:|---|
| 1 | Visibilità dello stato | 2 | Posizione nel sito chiara, ma la lightbox non mostra indice e chiusura; mappa senza stato di caricamento. |
| 2 | Corrispondenza con il mondo reale | 3 | Linguaggio italiano e dati familiari; “03:15”, “Gea Rating” e “In giro per il mondo” sono poco naturali o specifici. |
| 3 | Controllo e libertà | 2 | Ritorno mobile e uscita dalla mappa sono chiari; la lightbox non ha un pulsante di chiusura visibile. |
| 4 | Coerenza e standard | 2 | I pattern sono comprensibili, ma appartengono al vecchio linguaggio visivo e la mappa introduce un secondo H1. |
| 5 | Prevenzione degli errori | 3 | L’upload ha buoni vincoli e anteprima; semantica e gestione del focus del modal sono incomplete. |
| 6 | Riconoscimento anziché memoria | 3 | Dati e navigazione sono etichettati; l’azione cover è icon-only e la lightbox non espone chiusura o posizione. |
| 7 | Flessibilità ed efficienza | n/a | Una pagina Experience/Read non richiede acceleratori da power user. |
| 8 | Design estetico e minimale | 2 | Pulito ma pesante: card statistiche, cover ripetuta, mappa dominante, pillole, ombre e controlli admin. |
| 9 | Riconoscimento e recupero dagli errori | 3 | Gli errori di mappa/upload usano copy comprensibile e preservano il contesto. |
| 10 | Aiuto e documentazione | n/a | La superficie è autoesplicativa e non necessita documentazione. |
| **Totale** |  | **20/32** | **Accettabile — miglioramento significativo necessario** |

## Verdetto sulla specificità

**Valutazione autoriale.** La pagina è riconoscibile come Popi’s Adventures grazie alle fotografie reali, alla Compagnia e al Gea Rating, ma la composizione che li contiene è intercambiabile con un generico tracker outdoor: hero con gradiente e testo sovrapposto, quattro tile prestazionali, pillole partecipanti, mappa scura, galleria uniforme, raggi molto grandi e ombre diffuse. La nuova home è invece piatta, guidata da Nunito, fotografia e accenti “marker on paper”. Qui mancano annotazioni affettuose, segni imperfetti, ritmo editoriale e gruppi fotografici capaci di far sentire il ricordo prima della performance.

**Scansione deterministica.** Il detector CLI sul template ha restituito `[]`: 0 finding. Nel DOM renderizzato ha però rilevato 7 target e 15 occorrenze, soprattutto combinazioni bordo sottile/ombra ampia nella navigazione mobile e nella mappa, annidamento di card nella mappa, hero eyebrow in maiuscolo tracciato e trasformazioni hover sulle immagini. I due avvisi di basso contrasto nella hero sono probabilmente falsi positivi perché il detector ha risolto come bianco lo sfondo fotografico oscurato. Anche `cream-palette`, padding Leaflet e nested-card della mappa sono avvisi contestuali o di gusto, non difetti da correggere automaticamente.

**Overlay visivi.** Iniezione e scansione sono riuscite nella scheda di valutazione: 7 target, 15 occorrenze. La scheda del sub-agent non poteva essere resa visibile all’utente, quindi non esiste un overlay affidabilmente visibile nel browser dell’utente. Le verifiche sono state svolte a 1280×720 e 390×844.

## Impressione generale

La pagina parte bene e finisce bene grazie alle foto, ma nel mezzo cambia identità: da diario personale diventa una scheda tecnica. La più grande opportunità è invertire questa gerarchia senza perdere utilità: **ricordo e persone davanti; dati e mappa come supporto compatto**.

Carico cognitivo moderato, con 2 fallimenti su 8: manca un focus unico perché i controlli di upload sono sempre presenti nel percorso pubblico; la gerarchia è contesa da quattro card equivalenti, dalla mappa ad alto contrasto e dal secondo H1. Chunking, grouping, memoria di lavoro e disclosure sono invece solidi; nessun punto decisionale supera quattro opzioni.

Il picco emotivo iniziale è la cover reale. Su mobile, però, il crop taglia parte di Tizi. Seguono quattro card-statistiche che producono la valle emotiva più lunga. Compagnia e Gea Rating restituiscono affetto, poi la mappa scura riporta al linguaggio da prodotto outdoor. La galleria crea il secondo picco ma ripete la cover e non aggiunge note o didascalie; l’ultimo elemento funzionale prima del footer è un upload, quindi il finale del ricordo viene interrotto dalla manutenzione.

## Cosa funziona

- **Fotografia autentica:** hero e galleria rendono la pagina vissuta, non promozionale. Gli alt text sono significativi.
- **Compagnia e Gea Rating:** sono i momenti più specifici del prodotto; iconografia e testo funzionano insieme e Gea è parte del racconto.
- **Percorso leggibile:** titolo → dati → compagnia → mappa → foto è comprensibile; back mobile, bottom navigation, controlli mappa standard e target della galleria aiutano l’orientamento.

## Problemi prioritari

### [P1] Le statistiche trasformano il ricordo in una dashboard

**Perché conta:** su mobile quattro card full-width occupano gran parte dello scroll dopo la hero. Data, distanza e dislivello ricevono più spazio delle persone e della storia.

**Fix:** sostituirle con un `dl` compatto e senza card, in una o due righe: `11,6 km · 510 m D+ · 3 h 15 min`, più la data. Usare spazio e divisori, non quattro ombre.

**Comando suggerito:** `$impeccable layout`

### [P1] Il template appartiene ancora al linguaggio visivo precedente

**Perché conta:** font display serif, gradient overlay, slab verde scuro, uppercase tracciato, pillole, ombre e raggi da 1,75–2rem contraddicono il diario piatto e marker-on-paper stabilito dalla home.

**Fix:** ricomporre la pagina su cream/paper, Nunito, raggi 10–14px, raggruppamenti piatti, uno o due segni disegnati con significato e una composizione fotografica editoriale. Non basta cambiare i colori.

**Comando suggerito:** `$impeccable shape`

### [P2] La mappa è più autorevole del necessario

**Perché conta:** “In giro per il mondo” è un secondo H1 per una singola escursione e il pannello scuro diventa il blocco non fotografico più dominante.

**Fix:** usare un H2 come “Il percorso” o “Dove siamo stati”, ridurre altezza e chrome mobile, adottare un trattamento Paper discreto preservando i controlli Leaflet familiari.

**Comando suggerito:** `$impeccable distill`

### [P2] La galleria è funzionale ma non autoriale

**Perché conta:** ripete la cover, applica la stessa card a ogni foto e non aggiunge didascalie; la lightbox non ha chiusura visibile né indicatore `1/3`.

**Fix:** evitare la ripetizione della cover oppure darle un ruolo dichiarato, introdurre asimmetria controllata, usare brevi annotazioni solo quando esistono contenuti reali e aggiungere close da 44×44px più indice.

**Comando suggerito:** `$impeccable delight`

### [P2] I controlli di editing interrompono la lettura pubblica

**Perché conta:** matita cover e “Aggiungi foto” sono sempre visibili; alcuni controlli mobile sono circa 40px; il modal di upload non è un dialog con gestione completa del focus.

**Fix:** spostare gli upload in una modalità proprietario autenticata o in un unico menu “Modifica”; portare i target ad almeno 44px e aggiungere semantica dialog, Escape, focus trap e focus restoration.

**Comando suggerito:** `$impeccable harden`

## Red flag per persona

**Jordan, prima visita:** la matita sulla cover non spiega che si tratta di manutenzione; “Gea Rating” non è definito; `03:15` può sembrare un orario; la galleria non mostra come chiudersi.

**Casey, mobile e distratto:** dopo la hero il primo viewport contiene soltanto una parte delle quattro statistiche; compagnia, mappa e foto arrivano tardi. La bottom nav copre parte dell’area utile e alcuni target da 40px sono piccoli per l’uso a una mano.

**Sam, accessibilità:** il documento espone due H1; il modal upload non ha semantica/focus containment completo; la lightbox non ha un pulsante close esplicito. Funzionano invece alt significativi, frecce etichettate e focus visibile.

## Osservazioni minori

- Mostrare `3 h 15 min` invece di `03:15`.
- Il pannello Compagnia lascia molto spazio bianco accanto al piccolo Gea Rating su desktop.
- Le etichette uppercase molto tracciate rafforzano il tono da activity tracker.
- Il crop mobile della hero privilegia Meg e Gea ma taglia parte di Tizi.
- La chiusura del footer sulla parola “sorriso” è un buon finale emotivo e va preservata.

## Domande progettuali

- Se i dati supportano il ricordo, perché occupano più spazio verticale della compagnia?
- L’upload appartiene davvero al viaggio del lettore o a una modalità proprietario separata?
- Quale singola annotazione reale renderebbe questa escursione impossibile da confondere con una scheda itinerario generica?
- La mappa deve annunciarsi con la stessa forza del titolo o può restare quieta finché serve?
