---
target: pagina dello zaino
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-25T20-46-55Z
slug: src-pages-prepara-lo-zaino-astro
---
⚠️ DEGRADED: single-context (Assessment A sub-agent non ha restituito l’output; A completata inline, B completata dall’agent 01a03aa0-db47-7942-aa43-3c30d3c91d23)

## Design Health Score

| # | Euristica | Punteggio | Problema chiave |
|---|---|---:|---|
| 1 | Visibilità dello stato del sistema | 2 | Progresso presente, ma il conteggio globale sparisce su mobile e gli aggiornamenti non sono annunciati con `aria-live`. |
| 2 | Corrispondenza con il mondo reale | 4 | Linguaggio italiano, metafora dello zaino e categorie sono immediati e personali. |
| 3 | Controllo e libertà | 2 | Reset globale ed eliminazione degli extra sono immediati, senza conferma né annullamento. |
| 4 | Coerenza e standard | 3 | Pattern interni coerenti, ma raggi/ombre divergono dal design system documentato. |
| 5 | Prevenzione degli errori | 2 | Duplicati e campi vuoti sono gestiti; le azioni distruttive non hanno protezioni. |
| 6 | Riconoscimento anziché memoria | 3 | Etichette chiare; il riordino è comunicato solo da una maniglia senza istruzioni. |
| 7 | Flessibilità ed efficienza | 2 | Persistenza e reset aiutano, ma non esistono filtro “mancanti”, categorie collassabili o riordino accessibile. |
| 8 | Design estetico e minimalista | 2 | Pulito, ma troppo lungo e sovra-contenuto: card, pillole e ombre ripetono lo stesso peso visivo. |
| 9 | Riconoscimento e recupero dagli errori | 2 | Gli errori del form sono specifici; reset ed eliminazione non sono recuperabili. |
| 10 | Aiuto e documentazione | 2 | La funzione base si capisce, ma persistenza, riordino e comportamento offline non sono spiegati nel contesto. |
| **Totale** |  | **24/40** | **Accettabile — fondamenta solide, miglioramenti significativi necessari.** |

## Design Specificity Verdict

**Valutazione non ancorata:** la pagina è riconoscibile come Popi’s Adventures grazie alla palette calda, alla voce “Nuova avventura in arrivo”, alle categorie con emoji e soprattutto a Gea. La composizione, però, resta intercambiabile con una checklist generica: una sequenza di grandi card bianche, righe-pillola e ombre. La direzione “Hand-Drawn Adventure Journal” non arriva nell’interazione né nel payoff finale.

**Scansione deterministica:** il detector CLI restituisce `0` findings sia per `src/pages/prepara-lo-zaino.astro` sia per `src/components/ZainoChecklist.jsx`. Nel browser rileva invece 30 anti-pattern su mobile e 32 su desktop. Il segnale affidabile è la combinazione `gpt-thin-border-wide-shadow` (7/8 occorrenze) più `nested-cards` (21/22): le sezioni usano raggi da 32px e ombre `0 18px 40px`, in conflitto con i raggi 10–14px e la “Flat Notebook Rule” di DESIGN.md. `cream-palette` è un falso positivo; il cream è un token intenzionale. Anche `kicker-above-heading` è intenzionale. `nested-cards` sovrastima semanticamente le righe-control, ma fotografa correttamente la sovra-contenitorizzazione visiva.

**Overlay visivi:** l’iniezione del detector è riuscita a 390×844 e 1280×900. Gli overlay non sono visibili in una tab `[Human]` perché la visibilità dell’in-app browser non è supportata nei sub-agent; restano evidenza interna verificata, non una presentazione user-visible.

## Impressione generale

La pagina funziona ed è leggibile, ma non è ancora memorabile. La sua occasione più grande è diventare una checklist davvero ottimizzata per “sto partendo adesso”: meno tunnel verticale, stato globale più chiaro, azioni distruttive recuperabili e un finale che faccia sentire pronti a partire.

## Cosa funziona

1. **Fondamenta semantiche buone.** Un solo H1, categorie come region con H2, checkbox native, progressbar con valori ARIA, label visibili e messaggi d’errore con `role="alert"`.
2. **Persistenza utile e feedback immediato.** La spunta aggiorna progressbar e conteggio della categoria e resta dopo il reload; non c’è overflow orizzontale a 390px o 1280px.
3. **Voce autentica.** Gea, “Dimenticato qualcosa?” e il lessico concreto fanno percepire una checklist della squadra, non un template outdoor anonimo.

## Carico cognitivo e viaggio emotivo

**Carico cognitivo: moderato, 2 fallimenti su 8.** Falliscono chunking e progressive disclosure: la categoria Gea espone 12 righe e la pagina mobile misura circa 3.612px per 34 elementi. Raggruppamento, focus singolo e memoria di lavoro sono invece gestiti bene. Non è tanto un eccesso di decisioni simultanee quanto un eccesso di scansione continua.

**Viaggio emotivo:** l’apertura è calda, ma il centro diventa ripetitivo e il finale coincide con il form “Aggiungi elemento”. Al 100% cambiano bar e badge di categoria, ma manca un vero momento “zaino pronto”: nessun messaggio conclusivo, reazione di Gea o micro-celebrazione. Il peak-end è piatto.

## Problemi prioritari

### [P1] Reset ed eliminazione non sono recuperabili

**Perché conta:** “Svuota lo zaino” può cancellare decine di spunte con un tap; il cestino elimina un extra senza conferma. Sono azioni a impatto alto su dati persistenti e particolarmente esposte agli errori su mobile.

**Fix:** aggiungere undo temporaneo con toast per reset ed eliminazione; in alternativa conferma esplicita per il reset quando `checkedCount > 0`. Disabilitare o nascondere il reset a zero.

**Comando suggerito:** `$impeccable harden`

### [P1] Il riordino promette una funzione che touch e tastiera non possono usare bene

**Perché conta:** ogni riga mostra una maniglia, ma l’implementazione dipende da HTML5 drag events. La maniglia è `aria-hidden`, non esistono azioni da tastiera e il drag nativo è inaffidabile su touch: è una rottura diretta della promessa mobile-first.

**Fix:** offrire “Sposta su / Sposta giù” accessibili nel menu dell’elemento e un’interazione touch esplicita; oppure rimuovere la maniglia dove il riordino non è realmente disponibile.

**Comando suggerito:** `$impeccable adapt`

### [P2] Lo stato globale è debole proprio su mobile

**Perché conta:** a 390×844 l’header è alto circa 264px, il chip “34 da prendere” è nascosto e resta una barra quasi senza significato visivo. “Svuota lo zaino” occupa più attenzione del progresso anche quando non c’è nulla da svuotare.

**Fix:** comprimere l’header, mostrare sempre `1 di 34 pronti · 33 mancanti`, associare il testo alla progressbar e annunciare gli aggiornamenti con una regione `aria-live="polite"`.

**Comando suggerito:** `$impeccable layout`

### [P2] La pagina è un tunnel verticale

**Perché conta:** 34 elementi producono oltre 3.600px di documento mobile; “Aggiungi elemento” arriva solo dopo l’intera checklist. Gli elementi completati scendono subito in fondo alla categoria, riducendo il rumore ma causando un salto di layout e rendendo meno immediato annullare una spunta accidentale.

**Fix:** introdurre una vista predefinita “Da prendere”, categorie collassabili e auto-collasso delle categorie pronte; mantenere una vista “Tutto” e un accesso più vicino all’aggiunta. Evitare il riordino immediato della riga, oppure animarlo e offrire undo.

**Comando suggerito:** `$impeccable distill`

### [P2] L’identità visiva si ferma alla superficie e non premia il completamento

**Perché conta:** grandi card bianche, 32px di raggio, ombre larghe e righe-pillola costruiscono un’estetica morbida ma generica. La pagina più adatta alla personalità giocosa del prodotto non sfrutta i segni “marker-on-paper” né un finale affettivo.

**Fix:** rendere le sezioni più piatte, usare raggi 10–14px, separazione tramite spazio e divider; riservare la Paper surface ai gruppi che ne hanno bisogno. Al completamento, mostrare un breve “Zaino pronto, si parte!” con un singolo segno disegnato o una piccola reazione di Gea, rispettando `prefers-reduced-motion`.

**Comando suggerito:** `$impeccable delight`

## Persona Red Flags

**Jordan, prima visita:** vede una barra vuota e un grande reset prima di aver fatto qualsiasi cosa. Dopo la prima spunta, la riga “Telefono” si sposta subito in fondo: il comportamento è sorprendente e può sembrare che l’elemento sia sparito.

**Sam, tastiera/screen reader:** può spuntare le checkbox e i pulsanti icona custom hanno label corrette, ma non può riordinare. I cambi di conteggio non sono annunciati; il focus degli input dipende soprattutto da una variazione cromatica del bordo.

**Casey, mobile e distratta:** deve attraversare oltre 3.600px e 34 righe; il conteggio globale è nascosto e il drag non è affidabile con il pollice. La persistenza è un punto forte, ma reset senza undo e spostamento immediato delle righe aumentano il rischio di errore durante un’interruzione.

## Osservazioni minori

- Le righe sono alte 50px e l’intera label è cliccabile: buon target touch. I pulsanti modifica/elimina degli extra sono 40×40px, sotto il target consigliato di 44×44px.
- Correggere `1 mancanti` in `1 mancante`.
- La transition della progressbar non dichiara una variante `motion-reduce`.
- Nessun overflow orizzontale è emerso ai due breakpoint.
- Il fixed bottom nav è gestito con padding e scroll margin; il form di aggiunta resta sopra la nav nel test mobile.

## Domande da considerare

- La checklist deve ottimizzare la scansione di ciò che manca o anche la rassicurazione di ciò che è già pronto?
- Il riordino è davvero una funzione primaria, oppure la sua maniglia aggiunge più rumore e debito accessibile di quanto restituisca?
- Come dovrebbe sentirsi il momento in cui l’ultimo elemento viene spuntato: efficiente, affettuoso o celebrativo?
