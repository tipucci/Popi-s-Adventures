---
target: pagina delle escursioni, coerenza visiva rispetto alla nuova home
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 4
timestamp: 2026-08-21T09-25-32Z
slug: src-pages-escursioni-index-astro
---
Method: dual-agent (A: /root/critique_design_a · B: /root/critique_evidence_b)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2/4 | Il conteggio risultati e gli stati principali sono visibili, ma mancano riepilogo dei filtri attivi e annunci delle variazioni. |
| 2 | Match System / Real World | 3/4 | Il linguaggio italiano è naturale; “D+”, “Gea Rating” e le icone funzionali richiedono conoscenza precedente. |
| 3 | User Control and Freedom | 3/4 | Reset, URL condivisibili e cronologia funzionano bene; la via d’uscita è però nascosta nel pannello quando compare lo zero-results. |
| 4 | Consistency and Standards | 1/4 | Header e tela appartengono alla nuova home, ma le card archivio sembrano provenire da un prodotto precedente. |
| 5 | Error Prevention | 3/4 | Select e range vincolano bene i valori; restano poco chiari alcuni stati inattivi e il reset non necessario. |
| 6 | Recognition Rather Than Recall | 2/4 | Search e filtri sono etichettati, ma le quattro icone di servizio e i criteri attivi richiedono memoria. |
| 7 | Flexibility and Efficiency | 3/4 | Ricerca, filtri, ordinamento, paginazione e stato URL rendono l’archivio efficiente per chi ritorna. |
| 8 | Aesthetic and Minimalist Design | 1/4 | Ogni card ripete chip, tre pannelli statistici e quattro badge circolari; l’interfaccia compete con la fotografia. |
| 9 | Error Recovery | 2/4 | Il messaggio senza risultati è comprensibile ma non offre un’azione diretta di recupero. |
| 10 | Help and Documentation | 1/4 | Mancano spiegazioni contestuali per abbreviazioni, Gea Rating e vocabolario delle icone. |
| **Totale** |  | **21/40** | **Accettabile: fondamenta funzionali solide, discontinuità visiva importante.** |

## Design Specificity Verdict

**Verdetto: i contenuti sono inequivocabilmente di Popi’s; l’interfaccia dell’archivio è intercambiabile con un’app generica di trekking.**

La nuova home è autoriale: fotografia reale, carta calda, filigrana discreta, gerarchia editoriale, accenti Sunshine e linguaggio affettivo. L’archivio conserva le foto ma le racchiude nel vocabolario precedente: card bianche flottanti, raggi da 28 px, ombre profonde, tre riquadri statistici e quattro indicatori circolari ripetuti. Un activity tracker o un catalogo turistico potrebbe riutilizzare la stessa composizione senza cambiare quasi nulla.

La discontinuità è misurabile. La card featured della home è piatta, senza ombra, con una fotografia 373×280 px e dati compatti; la prima card archivio è 349×533 px, bianca, arrotondata e rialzata. Su mobile la prima memoria della home è circa 350×351 px, mentre una card archivio raggiunge circa 358×539 px. L’archivio condivide Nunito, canvas Cream e larghezza della griglia, ma non il linguaggio visivo.

**Scansione deterministica:** la route `src/pages/escursioni/index.astro` restituisce 0 finding perché delega quasi tutta l’interfaccia. La scansione supplementare di `Filtri.jsx` trova 3 occorrenze `design-system-color`: `#94b78e` alle righe 405 e 421 e `#315f3d` alla riga 509. Le prime due sono la stessa decisione cromatica duplicata per WebKit/Firefox, ma nessuna delle tre corrisponde ai token di `DESIGN.md`; sono residui reali della palette precedente. `CardEscursione.jsx` restituisce 0 finding: il detector non coglie la discrepanza compositiva, che resta il problema dominante.

**Visual overlay:** nessun overlay affidabile è disponibile. La preflight di mutazione del browser è fallita perché il titolo della pagina era esposto in sola lettura; il live server del detector non è quindi stato avviato. L’evidenza fallback è costituita da screenshot responsive, DOM, geometrie calcolate e console pulita.

## Overall Impression

La pagina è un buon strumento di ricerca, ma non è ancora il capitolo “archivio” della nuova home. Il filtro appena alleggerito va nella direzione giusta; ora sono le card, non i filtri, a dominare con il peso visivo sbagliato. L’opportunità maggiore è conservare la densità operativa dell’archivio usando la grammatica editoriale e piatta della home.

## What’s Working

1. **La fotografia autentica resta il contenuto principale.** Crop generosi, alt text e immagini responsive mantengono il legame con le esperienze reali.
2. **La meccanica dell’archivio è solida.** Ricerca, filtri, ordinamento, paginazione, reset, sincronizzazione URL e browser back sono pensati con cura.
3. **La base condivisa è già coerente.** Home e archivio usano lo stesso canvas `#F7F1E3`, Nunito, griglia da 1088 px e gutter mobile da 16 px; non c’è overflow orizzontale.

## Priority Issues

### [P1] La pagina non ha un ingresso identitario

**Perché conta:** dalla home molto specifica si arriva direttamente a “Filtra le escursioni” e a un `h3` “Risultati (26)”. Manca un `h1`, l’orientamento semantico è debole e l’archivio sembra una utility separata.

**Fix:** aggiungere prima degli strumenti un’intestazione compatta, non un secondo hero: `h1` “Tutte le nostre avventure”, una riga personale che presenti le 26 giornate e un solo segno grafico discreto. Portare “Risultati” a `h2` e mantenere i titoli delle card come `h3`.

**Suggested command:** `$impeccable layout`

### [P1] Le card usano il linguaggio dashboard scartato dalla nuova home

**Perché conta:** shell bianche, ombre, raggio 28 px, hover lift, pannelli statistici e icone sempre presenti trasformano ricordi in attività misurate. La fotografia perde autorità e la coerenza si interrompe.

**Fix:** creare una variante archivio con outer card trasparente, raggio 14 px solo sulla foto, gerarchia `foto → titolo → luogo/data → 6,0 km · 610 m D+ · 3h 30m`. Mostrare soltanto i tratti presenti, con testo (`Con Gea`, `Rifugio`), eliminando le icone inattive. Sostituire lift e `shadow-2xl` con saturazione minima o cambio colore del titolo. Mantenere l’archivio più denso della home, ma nello stesso sistema.

**Suggested command:** `$impeccable distill`

### [P1] I filtri mobile espongono troppe decisioni e finiscono sotto la bottom navigation

**Perché conta:** il pannello aperto misura circa 760 px in un viewport alto 844 px e presenta sette criteri simultanei; “Con Gea” viene parzialmente coperto dalla navigazione fissa. I risultati spariscono completamente dalla prima schermata.

**Fix:** mantenere in primo livello Periodo, Difficoltà e Con Gea; spostare Provincia, Stagione, Km e Rifugio sotto “Altri criteri”. Mostrare `Filtri · 2 attivi`, chip rimovibili e “Azzera filtri” solo quando serve. Aggiungere padding inferiore pari alla bottom nav e safe area.

**Suggested command:** `$impeccable adapt`

### [P1] Focus e feedback dinamico sono incompleti

**Perché conta:** search e select rimuovono l’outline e mostrano solo un cambio bordo; card e paginazione non hanno un trattamento focus coerente. Il conteggio risultati cambia senza `aria-live` e lo zero-results non offre un reset operativo.

**Fix:** applicare lo stesso focus Leaf da 3 px della home a search, select, switch, card e paginazione; rendere il conteggio `aria-live="polite"`; aggiungere “Azzera ricerca e filtri” nello stato vuoto. Se restano icone, fornire etichette visibili e utilizzabili su touch/tastiera.

**Suggested command:** `$impeccable audit`

## Persona Red Flags

**Jordan, prima visita:** non trova un titolo che spieghi l’archivio. “D+”, “Gea Rating” e quattro simboli senza testo rallentano il confronto; gli stati attenuati sembrano disabilitati ma occupano lo stesso spazio.

**Sam, tastiera/screen reader:** la gerarchia inizia da `h3`; diversi controlli usano `outline-none`; card e paginazione non hanno focus progettato; le variazioni del numero di risultati non vengono annunciate.

**Casey, mobile e distratto:** aprendo i filtri incontra un form lungo quasi quanto il viewport, con l’ultimo criterio sotto la bottom nav. Ogni card richiede oltre mezzo viewport e allunga molto la scansione.

**Tizi/Meg, utenti di ritorno:** la meccanica consente di ritrovare rapidamente un’escursione, ma il payoff emotivo è debole: le giornate condivise appaiono come performance card e “Con Gea” diventa uno status tecnico tra quattro.

## Minor Observations

- Il chip “Escursione” compare quasi ovunque e differenzia poco.
- “Meno recenti” è meno naturale di “Dal meno recente”.
- Il placeholder di copertina non mostra il rassicurante “Foto in arrivo” già usato nella home.
- Tailwind conserva palette e `shadow-card` del sistema precedente, mentre la home usa i token Leaf/Sunshine/Tomato e superfici piatte.
- I target di paginazione da 40×40 px sono inferiori alla soglia mobile da 44 px mantenuta altrove.

## Questions to Consider

1. Quale dettaglio deve dimostrare, prima di qualsiasi filtro, che queste sono le memorie di Tizi, Meg e Gea e non un database di itinerari?
2. Quali dati meritano davvero spazio permanente su ogni card, e quali possono aspettare la pagina di dettaglio?
3. Su mobile i filtri devono servire prima chi cerca un’escursione nota o chi esplora senza una meta precisa?
4. L’ultima pagina dovrebbe terminare con numeri di paginazione o con un piccolo senso che il diario continua?
