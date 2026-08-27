---
target: popi.tipucci.it/gea-gang
total_score: 16
max_score: 24
na_heuristics: 5,7,9,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-27T20-50-30Z
slug: src-pages-gea-gang-astro
---
## Design Health Score

| # | Euristica | Punteggio | Problema principale |
|---|---|---:|---|
| 1 | Visibilità dello stato | 2 | Nessun indicatore di posizione/fine del carousel; le frecce restano attive al limite. |
| 2 | Corrispondenza col mondo reale | 4 | Nomi, fotografie e voce italiana sono autentici e immediati. |
| 3 | Controllo e libertà | 3 | Navigazione sicura; su mobile lo swipe è l’unico controllo del carousel. |
| 4 | Coerenza e standard | 3 | Palette, tipografia e focus sono coerenti; la costruzione a card contraddice però il design system attuale. |
| 5 | Prevenzione degli errori | n/a | Pagina statica senza input o azioni rischiose. |
| 6 | Riconoscimento, non memoria | 2 | Lo sliver della card successiva aiuta, ma mancano posizione, stato corrente e invito esplicito ad aprire il profilo. |
| 7 | Flessibilità ed efficienza | n/a | Non significativa per questa semplice superficie Experience. |
| 8 | Estetica e minimalismo | 2 | Fotografie forti, ma pannelli annidati, bordi, ombre, badge e pill competono con loro. |
| 9 | Recupero dagli errori | n/a | Nessun percorso di errore generato dall’utente. |
| 10 | Aiuto e documentazione | n/a | Non necessari per questa galleria. |
| **Totale** |  | **16/24** | **Accettabile — 66,7%** |

## Design Specificity Verdict

**Contenuti autentici dentro una struttura intercambiabile.**

Le fotografie reali, i nomi e la scrittura affettuosa appartengono chiaramente a Popi’s Adventures. L’interfaccia, invece, è un carousel generico di profili: sostituendo i cani con persone, ricette o prodotti, la composizione funzionerebbe quasi invariata. La pagina dice “gang”, ma mostra quattro record isolati. Non c’è un gesto visivo che racconti relazione, avventure condivise o appartenenza.

Questo è il maggiore scarto rispetto al design system: “Hand-Drawn Adventure Journal”, “Flat Notebook” e “Precise Grid, Imperfect Ink” chiedono fotografia dominante, superfici piatte e segni affettivi mirati. Qui dominano card annidate, grandi raggi, ombre, badge numerati e pill.

**Scansione deterministica:** 1 advisory nel file `src/pages/gea-gang.astro`: `design-system-color` alla riga 183 per `rgba(138, 77, 45, 0.34)`. È un derivato terracotta plausibile per la scrollbar, quindi non è un difetto visivo grave; resta un colore non documentato.

**Evidenza browser:** il detector live ha registrato 5 categorie e 9 istanze: 3 card con bordo sottile + ombra ampia, 1 eyebrow sopra il titolo, 1 salto semantico `h1 → h3`, 1 palette crema e 3 hover transform sulle immagini. “Palette crema” è un falso positivo: coincide con il token Cream. Anche lo scale `1.03` delle immagini è consentito ed è disattivato con reduced motion. Il rilievo su bordi+ombre e il salto dei titoli sono reali. L’overlay è stato iniettato ed eseguito, ma la visibilità della tab non è supportata nei sub-agent: non si dichiara quindi un overlay affidabilmente visibile all’utente.

## Overall Impression

L’ingresso funziona: Gea tra i fiori, il tono informale e la palette calda creano subito affetto. Poi l’emozione si appiattisce, perché ogni personalità viene tradotta nello stesso blocco di campi e chip. L’opportunità più grande è trasformare il roster in un vero ritratto editoriale della gang, lasciando alle fotografie il comando.

## Cosa funziona

- **Le immagini sono vere e memorabili.** Gea, Luffy e Zeus sembrano momenti vissuti, non contenuti promozionali.
- **La voce distingue i personaggi rapidamente.** Frasi come “piccolo demonio” o “pensione anticipata” danno carattere senza dilungarsi.
- **Le basi di interazione sono solide.** Target da 44 px, focus visibile, scroll-snap, alt text e supporto a `prefers-reduced-motion` sono buone fondamenta.

## Priority Issues

### [P1] La “gang” sembra un elenco di profili generico

**Perché conta:** una superficie Experience dovrebbe far emergere il ricordo. Outer card, pannello interno, doppio bordo, ombra, numero, metriche e tag trasformano invece i cani in schede database.

**Fix:** costruire un ritratto editoriale: Gea come ingresso, composizione asimmetrica degli altri membri, fotografie più libere, un solo percorso/zampa annotato e dati secondari trattati come testo quieto. Conservare immagini e copy reali.

**Comando suggerito:** `$impeccable bolder`

### [P2] Il carousel nasconde uno dei soli quattro membri e non comunica la posizione

**Perché conta:** a 1440×900 non si vedono tutti e quattro nonostante lo spazio disponibile; su mobile la scoperta dipende da una sottile porzione della card successiva. Al limite, le frecce desktop restano attive.

**Fix:** desktop in griglia/editorial layout 2×2. Se lo scroll-snap resta su mobile, aggiungere conteggio o indicatori, invito allo swipe e stati disabled corretti.

**Comando suggerito:** `$impeccable layout`

### [P2] La navigazione mobile copre la prima card

**Perché conta:** a 390×844 la card occupa circa `y=200–830`, mentre la nav fissa occupa `y=758–828`: circa 70–72 px di contenuto finiscono dietro la nav, inclusi i trait chip.

**Fix:** riservare una safe area reale prima della nav, ridurre l’altezza della scena iniziale o rendere i metadati progressivi. Verificare anche telefoni bassi.

**Comando suggerito:** `$impeccable adapt`

### [P2] Posizione nel sito e promessa delle card sono poco chiare

**Perché conta:** `active="gea-gang"` non corrisponde a nessuna voce definita nella navigazione, quindi il live DOM non contiene `aria-current`. Inoltre l’intera card è cliccabile, ma non compare un invito come “Conosci Gea” o una freccia.

**Fix:** creare uno stato contestuale per Gea Gang senza aggiungere automaticamente una quinta tab mobile; eliminare la ripetizione topbar/eyebrow e rendere esplicito cosa succede aprendo una card.

**Comando suggerito:** `$impeccable clarify`

## Persona Red Flags

**Jordan — prima visita**

- Non è esplicito che la card apra un profilo.
- Su mobile i controlli del carousel spariscono.
- Nessuno stato di navigazione spiega dove si trovi Gea Gang nell’architettura.
- Espressioni come “retrieving” e “Fetch Queen” hanno carattere, ma un visitatore esterno può non capirle.

**Riley — stress tester**

- La freccia avanti accetta click anche a fine carousel.
- Una risposta CSV valida ma vuota produce `dogs=[]`: comparirebbe solo il titolo, senza fallback o recupero.
- Il caso immagine mancante, invece, è gestito bene con “Foto in arrivo”.

**Casey — mobile distratto**

- La nav copre circa 72 px della card iniziale.
- Lo swipe è comunicato solo dallo sliver della card successiva.
- Le tre immagini reali ad alta risoluzione vengono caricate sul viewport mobile anche quando solo una è visibile; nel markup non c’è un `srcset` responsive.
- I target touch, fortunatamente, sono comodi.

## Minor Observations

- La gerarchia passa da `h1` direttamente a `h3`; i nomi dei cani dovrebbero essere `h2`.
- Il nome accessibile di ciascun link-card diventa molto lungo perché include alt, numero, razza, metriche, descrizione e tag.
- “Gea Gang” appare sia nella topbar mobile sia nell’eyebrow.
- La scrollbar desktop è visibile ma non comunica né conteggio né posizione.
- Il font è importato da Google in `global.css`, in tensione con l’obiettivo offline/connettività limitata.

## Questions to Consider

- Se questa è una gang, dove si vede visivamente il loro rapporto?
- Perché nascondere uno dei soli quattro membri su desktop?
- Deve sembrare un roster di record o una pagina di diario condivisa?
- Cosa promette la pagina profilo che l’indice non abbia già mostrato?
