---
target: navbar mobile
total_score: 24
max_score: 32
na_heuristics: 9,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-25T21-02-06Z
slug: src-layouts-layout-astro
---
# Critique della navbar mobile

## Design Health Score

| # | Euristica | Score | Problema chiave |
|---|---|---:|---|
| 1 | Visibilita dello stato | 2/4 | Stato attivo chiaro, ma Gea Gang viene dichiarata come Home. |
| 2 | Corrispondenza sistema / mondo reale | 4/4 | Etichette italiane e icone immediatamente riconoscibili. |
| 3 | Controllo e liberta | 3/4 | Home persistente e back contestuale; il back mobile resta debole. |
| 4 | Coerenza e standard | 2/4 | Desktop usa Leaf + Sunshine; mobile usa terracotta + doppia pill glassy. |
| 5 | Prevenzione degli errori | 3/4 | Target principali ampi; back sotto la soglia touch raccomandata. |
| 6 | Riconoscimento anziche memoria | 4/4 | Tutte le icone hanno un'etichetta visibile. |
| 7 | Flessibilita ed efficienza | 3/4 | Quattro destinazioni persistenti nel thumb zone. |
| 8 | Estetica e design minimale | 3/4 | Interfaccia pulita, ma topbar vuota e capsule annidate aggiungono chrome. |
| 9 | Recupero dagli errori | n/a | La navbar non produce stati di errore recuperabili. |
| 10 | Aiuto e documentazione | n/a | Le destinazioni sono autosufficienti; non serve documentazione dedicata. |
| **Totale** |  | **24/32** | **Buono: base solida, identita e coerenza da riallineare.** |

## Verdetto di specificita

**Parzialmente specifica, ma troppo intercambiabile.** Logo, Nunito e fondo Cream appartengono a Popi. Il dock inferiore, invece, usa il comune pattern da app fitness/travel: superficie bianca al 90%, backdrop blur, bordo chiaro, ombra e una seconda serie di pillole al suo interno. Senza il logo potrebbe appartenere quasi invariato a un prodotto diverso.

La divergenza e netta: desktop comunica la posizione con Leaf e una sottolineatura Sunshine; mobile passa a un riempimento terracotta scuro. DESIGN.md assegna Leaf agli stati di navigazione e riserva Tomato all'enfasi affettiva. Inoltre il sistema dichiara che le pill sono simboli funzionali per filtri, tag e stati compatti, non la silhouette predefinita della navigazione. Oggi la navbar sembra quindi "app chrome sopra il diario", non una parte dello stesso foglio.

**Scan deterministico:** il detector CLI sul target `src/layouts/Layout.astro` e pulito: 0 finding. La scansione live ha segnalato quattro warning, ma nessuno riguarda la navbar: ripetizione di "Con Gea", palette crema, underline di una card e transizione di `width` nella checklist. I primi tre sono falsi positivi contestuali o fuori scope; il quarto puo essere valido per la checklist, ma non per questa critique.

**Overlay visivo:** l'iniezione e la scansione nella scheda automatizzata sono riuscite, ma l'overlay non e stato reso visibile all'utente perche la visibilita del browser non e supportata nei thread sub-agent. Le evidenze affidabili usate come fallback sono screenshot, DOM snapshot e misure a 390x844 e 320x568.

## Impressione generale

La navbar funziona bene e non crea problemi di collisione, overflow o copertura dei contenuti. La sua opportunita maggiore e tutta di art direction: smettere di sembrare un dock generico e adottare la stessa grammatica Paper / Leaf / Sunshine del resto del diario.

## Cosa funziona

- **Ergonomia mobile solida.** A 390 px il dock misura 366x74 px e ogni voce 81x56 px; a 320 px resta leggibile con target 63,5x56 px e nessun overflow.
- **Riconoscibilita immediata.** Home, Escursioni, Mappa e Zaino uniscono icone familiari e testo; non esiste navigazione icon-only.
- **Buona gestione dell'ingombro inferiore.** Safe area, padding pagina e script sul focus impediscono alla nav fissa di coprire contenuti o controlli finali.

## Carico cognitivo e percorso emotivo

Carico cognitivo **moderato**, con due failure strutturali e uno contestuale:

- la topbar e alta 80 px ma spesso contiene soltanto il logo, quindi occupa spazio senza spiegare titolo o posizione corrente;
- su Gea Gang il dock evidenzia Home e costringe l'utente a ricostruire mentalmente una gerarchia che l'interfaccia non dichiara;
- quando il footer entra in vista, quattro link persistenti si sommano a quattro link footer, creando duplicazione. Il dock isolato resta invece entro il limite: esattamente quattro opzioni.

L'ingresso e caldo grazie a Cream e al logo; durante l'uso il dock rassicura per persistenza e raggiungibilita. La valle emotiva arriva quando la capsula glassy interrompe la metafora della carta e, su Gea Gang, lo stato Home incrina l'orientamento. Il finale di pagina duplica le scelte proprio dove il diario dovrebbe chiudersi in modo piu quieto.

## Problemi prioritari

### [P1] La posizione corrente e falsa su Gea Gang

**Perche conta:** `/gea-gang` e i relativi dettagli impostano `active="home"`. L'utente legge Gea Gang nella pagina ma vede Home selezionato: pagina corrente, genitore e destinazione diventano indistinguibili.

**Fix:** decidere esplicitamente la gerarchia. Se Gea Gang resta secondaria, permettere nessun item attivo e mostrare il titolo corrente nella topbar. Se diventa primaria, sostituire consapevolmente una delle quattro destinazioni; non aggiungere automaticamente una quinta voce.

**Comando suggerito:** `$impeccable clarify`

### [P2] Il dock contraddice il look del diario

**Perche conta:** blur, vetro bianco e doppia pill sono generici; il terracotta attivo non segue la grammatica Leaf + Sunshine usata su desktop e definita nel design system.

**Fix:** usare una superficie Paper opaca, bordo Border, raggio 10-14 px e niente blur. Eliminare le capsule annidate; rendere attivi icona e testo in Leaf con un secondo segnale Sunshine, per esempio un breve tratto irregolare o una sottolineatura controllata.

**Comando suggerito:** `$impeccable bolder`

### [P2] Topbar e dock non sembrano la stessa composizione

**Perche conta:** il dock usa 12 px dal bordo viewport, la topbar 16 px e il sistema dichiara un gutter mobile da 20 px. La topbar alta 80 px e spesso vuota per oltre meta larghezza.

**Fix:** scegliere un unico gutter mobile e assegnare alla topbar una funzione stabile: titolo pagina discreto, contesto o azione locale. Allineare topbar e dock alla stessa combinazione Paper / Leaf / Sunshine.

**Comando suggerito:** `$impeccable layout`

### [P2] Back e safe area superiore sono meno robusti del dock

**Perche conta:** il back contestuale e alto circa 34 px, sotto i 44 px raccomandati, non ha uno stile `focus-visible` esplicito e la topbar non applica `env(safe-area-inset-top)` nonostante `viewport-fit=cover`.

**Fix:** portare il back ad almeno 44 px, usare raggio 10 px, focus Leaf da 3 px e supporto `motion-reduce`; aggiungere la safe area superiore. Verificare anche zoom 200% e modalita PWA su dispositivo con notch.

**Comando suggerito:** `$impeccable adapt`

## Persona red flags

**Jordan, first-timer:** capisce subito le quattro destinazioni, ma su Gea Gang vede tre segnali conflittuali: contenuto Gea Gang, back verso Home e Home attiva. La topbar vuota non gli conferma dove si trova.

**Sam, accessibilita:** apprezza etichette visibili, `aria-current` e contrasti solidi; incontra pero un back sotto 44 px, senza focus progettato come il resto della navbar, e una topbar che non considera la safe area superiore.

**Casey, mobile distratto:** usa bene il dock con una mano e non subisce collisioni neppure a 320 px; il back, invece, e piccolo e in alto a destra. Il dock occupa circa 90 px verticali inclusa la distanza dal fondo, prima della safe area, riducendo la finestra disponibile per le fotografie sui viewport bassi.

## Osservazioni minori

- Il logo mobile non ha lo stesso feedback focus/hover gia progettato per il desktop.
- Le transizioni mobile non dichiarano `motion-reduce`, mentre il desktop si.
- L'ombra del back e piu enfatica dell'unico livello Ambient Low previsto dal design system.
- "Zaino" e una buona abbreviazione nel dock; il titolo pagina puo mantenere "Prepara lo zaino" senza creare ambiguita.
- Il `max-width: 448px` del dock funziona bene sui telefoni larghi e impedisce che le voci si disperdano.

## Domande provocatorie

- Se togliessimo il logo, cosa renderebbe questa navbar inequivocabilmente Popi?
- Gea Gang e una destinazione primaria o Home sta assorbendo una relazione che l'utente non puo intuire?
- Il dock deve sembrare un oggetto che galleggia sopra il diario o un segno tracciato sulla stessa carta?
