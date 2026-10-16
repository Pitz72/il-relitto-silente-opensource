> **ARCHIVIO — 2026-03-21**
> Questo documento è stato **dichiarato completo** alla versione v1.1.23.
> Tutti i task identificati sono stati risolti o scartati con motivazione.
> Il documento è conservato a fini storici e di riferimento. Non aggiornare.

---

# ANALISI E PIANO DI MIGLIORAMENTO — IL RELITTO SILENTE
**Documento redatto:** 2026-03-20
**Versione analizzata:** v1.0.19
**Chiuso:** 2026-03-21 · versione finale v1.1.23
**Ambito:** Parser/grammatica · Funzionalità · Narrativa · Piano miglioramenti

---

## INDICE

1. [Analisi del Parser e Sistema di Grammatica](#1-analisi-del-parser-e-sistema-di-grammatica)
2. [Analisi Funzionalità del Gioco](#2-analisi-funzionalità-del-gioco)
3. [Analisi Narrativa](#3-analisi-narrativa)
4. [Piano Miglioramenti](#4-piano-miglioramenti)

---

## 1. ANALISI DEL PARSER E SISTEMA DI GRAMMATICA

### 1.1 Architettura generale

Il sistema di parsing è ibrido a due livelli, evolutosi nel tempo:

**Livello 1 — `normalizeCommand()` (pre-processing universale):**
```
Input grezzo → normalizeCommand → comando normalizzato
```
- Rimozione diacritici (via NFD decomposition)
- Rimozione articoli determinativi/indeterminativi (il/lo/la/i/gli/le/un/uno/una/un'/l')
- Normalizzazione preposizioni (`con`, `sopra` → `su`)
- Abbreviazioni movimento (`n/s/e/o/u/d` → `nord/sud/est/ovest/alto/basso`)
- Abbreviazioni azioni (`l` → `guarda`, `i/inv` → `inventario`, `x` → `esamina`)
- Alias verbi (`indossa` → `usa`)
- Collasso spazi multipli

**Livello 2 — `processCommand()` (routing):**
1. Comandi globali hardcoded (`inizia`, `guarda`, `aiuto`, `echi`, `inventario`)
2. Loop su `room.commands[]` (regex prioritari per logica complessa, puzzle, movimento)
3. Item System: match verbo+oggetto su `room.items[]` con synonyms lookup
4. Fallback generici (USA X SU Y senza match, ANALIZZA generico)

### 1.2 Cosa funziona bene

**Rimozione articoli:** Solida e completa. Il giocatore può scrivere "prendi il disco di pietra", "prendi disco di pietra", "prendi disco" e tutti e tre i percorsi vengono gestiti correttamente dopo la normalizzazione.

**Priorità comandi stanza:** Il pattern "room.commands prima, item system dopo" garantisce che le logiche complesse (puzzle porte, interazioni state-dependent) sovrascrivano il comportamento default. È architetturalmente corretto.

**Regex cache:** `getCachedRegex()` compila ogni pattern una sola volta a livello di modulo. Corretto per performance, evita la compilazione ripetuta ad ogni frame.

**Feedback adattivo:** I fallback generici (`USA X SU Y` con item in inventario vs. senza) danno risposte diverse e contestuali, distinguendo "non ce l'hai" da "non ha effetto".

**Flag system per stato mondo:** L'approccio `picked_STANZA_ID` e i flag nomi-significativi (`isWearingSuit`, `semeLiberato`, `isPowerRestored`) rendono lo stato del mondo leggibile e mantenibile.

**Deep clone con lodash:** `cloneDeep(currentState)` prima di ogni mutazione garantisce immutabilità dello stato di partenza e correttezza del sistema save/load.

**Synonyms sugli Item:** La lista `synonyms[]` per ogni oggetto è generosa. `nave aliena` ha 10 alias (nave/relitto/ombra/anomalia/astronave/nave stellare/oblo/finestrino/vista), coprendo ragionevolmente le varianti lessicali del giocatore.

### 1.3 Problemi riscontrati

#### P1 — ~~CRITICO~~ ✅ RISOLTO v1.1.0: Nessun fuzzy matching / tolleranza typo
Il parser è case-insensitive e rimuove accenti, ma **un singolo carattere errato blocca silenziosamente qualsiasi comando**. Se il giocatore scrive "taglieian" o "taglierena", ottiene il fallback generico "Non capisco quel comando." senza alcun hint su cosa intendesse. In un'avventura testuale del 2026, un livello minimo di Levenshtein distance (distanza 1) o match per prefisso sarebbe atteso.

#### P2 — ~~CRITICO~~ ✅ RISOLTO v1.1.0: Puzzle "TOCCA TRE PUNTE" — barriera di input arbitraria
Nel Ponte di Comando, la porta finale si apre con il comando `tocca tre punte`. Questo è **il comando più arbitrario dell'intero gioco**. Il giocatore:
1. Ha visto la mappa stellare (sistema trino con 3 soli)
2. Ha capito il collegamento concettuale
3. Sa che deve "attivare" il meccanismo a punte

Ma la forma esatta `tocca tre punte` non è suggerita da nessun testo. Il comando regex `^(tocca|attiva|usa) (tre|3) punte( su porta)?$` è ragionevole, ma non copre varianti come `tocca 3 punte`, `attiva tre pulsanti`, `premi tre punte`. Non esiste nessuna riga di hint che suggerisca esattamente questa sintassi. **Alta probabilità di stallo**.

#### P3 — ~~MODERATO~~ ✅ RISOLTO v1.1.0: Item System duplica il match USA X SU Y
In `gameLogic.ts`, quando l'Item System incontra `usa X su Y`, re-esegue un match interno con `^(usa|attiva) (.+) (su|con|contro) (.+)$`. Questo crea **due percorsi paralleli** per lo stesso comando: il primo match del verbo cattura l'oggetto al livello Item, il secondo re-parsifica la stringa originale. In caso di ambiguità (es. oggetto source sia nella stanza che nell'inventario) il comportamento è difficile da prevedere.

#### P4 — ~~MODERATO~~ ✅ RISOLTO v1.1.0: Cilindro Mnemonico con onUse ingannevole
Il Cilindro Mnemonico ha `onUse` definito che restituisce:
```
"Non puoi usarlo direttamente. Prova ad analizzarlo con il tuo scanner."
```
Questo messaggio è fuorviante: in realtà `ANALIZZA CILINDRO` funziona correttamente **solo tramite un comando regex esplicito in `alloggiEquipaggio.ts`**. Se il giocatore scrive `USA CILINDRO` dall'inventario e poi `ANALIZZA CILINDRO` fuori dalla stanza degli alloggi (ad esempio nel Corridoio Principale), il comando **non funziona** perché il regex è definito solo localmente in quella stanza. Il giocatore torna agli Alloggi ma il cilindro è già nell'inventario e non c'è hint che lo dica.

#### P5 — ~~MODERATO~~ ✅ RISOLTO v1.1.0: ANALIZZA come comando in Item System vs. regex
Il comando `ANALIZZA` è gestito dall'Item System per gli oggetti definiti con `details`, ma esistono regex espliciti di `ANALIZZA` in molte stanze (corridoioPrincipale, santuarioDelSilenzio, alloggiEquipaggio). Questi regex hanno **precedenza sul sistema items** essendo nel loop `room.commands`. Questo crea incoerenza: `ANALIZZA LASTRA` funziona tramite item.details, `ANALIZZA CILINDRO` funziona solo tramite regex locale, `ANALIZZA NUCLEO` funziona in *due* stanze diverse (corridoio e arcaDellaMemoria, con testo identico). Se il giocatore analizza il nucleo prima nel corridoio, poi torna all'Arca, ottiene "hai già estratto l'eco" correttamente grazie al flag — ma il codice è duplicato tra i due file.

#### P6 — ~~MINORE~~ ✅ RISOLTO v1.1.9: Comando ENTRA incoerente tra stanze
`ENTRA` è gestito diversamente:
- `ponteDiComando.ts`: regex `^(entra|vai dentro|usa porta|vai porta|vai porta circolare)$`
- `cameraDiCompensazione.ts`: regex `^(entra|vai dentro)$` separato
- `scafoEsterno.ts`: regex `^(entra|entra apertura|((vai|va) )?(dentro|apertura))$`
Nessuno di questi copre `entra nella camera` o `entra nel santuario` (con preposizione + nome). Il giocatore abituale di testi scritti può tentare queste varianti.

#### P7 — MINORE: Articoli non rimossi da nomi composti nel fallback
`normalizeCommand` rimuove gli articoli iniziali, ma non quelli interni. In un comando come `usa disco di pietra su altare`, dopo normalizzazione si ottiene `usa disco pietra su altare` (solo se "di" non è nell'insieme degli articoli rimossi). Il regex in `santuarioDelSilenzio.ts` è `(usa) (disco|disco di pietra) su (altare|incavo)` — il "di" rimane, quindi funziona. Ma `usa quel disco su altare` o `usa questo disco su altare` non funzionerebbe. **Non è un problema reale per input normali**, ma è un'inconsistenza.

#### P8 — ~~MINORE~~ ✅ RISOLTO v1.1.10: `LEGGI` risponde sempre uguale
Il comando `LEGGI` in Scriptorium cattura qualsiasi `^(leggi) (.+)$` con "il testo alieno è incomprensibile a occhio nudo...". Questo è ragionevole nel contesto, ma `LEGGI LASTRA DATI` (che il giocatore potrebbe ragionevolmente tentare con la Lastra che ha appena trovato) dà la stessa risposta di `LEGGI PARETE`. Non c'è differenziazione per oggetti che *contengono* testo, anche se leggibile col scanner.

#### P9 — ~~MINORE~~ ✅ RISOLTO v1.1.8: Abbreviazioni movimento solo a carattere singolo
Il parser riconosce `n/s/e/o/u/d` come abbreviazioni. Non riconosce `no/su/so` (nordovest/su/sudovest) né la forma italiana `est`, `ovest` scritte senza spazio. Non è critico, ma le direzioni diagonali sono completamente assenti (giustificato dalla mappa, ma non esplicitato).

#### P10 — ~~MINORE~~ ✅ RISOLTO v1.1.7: Nessun comando `ASPETTA` / `Z`
Standard delle avventure testuali classiche (`Z` = wait, `ASPETTA`). Non è necessario narrativamente in questo gioco (nulla cambia nel tempo), ma la sua assenza può confondere chi viene da IF classica.

### 1.4 Mappa di copertura comandi per stanza

| Stanza | GUARDA | ESAMINA | ANALIZZA | PRENDI | USA X | USA X SU Y | TOCCA | ENTRA | PARLA |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Plancia | ✅ | ✅ | ✅ | — | ✅ (radio) | — | ✅ v1.1.12 | — | — |
| Stiva | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ v1.1.12 | — | — |
| Scafo Esterno | ✅ | ✅ | ✅ | — | — | ✅ | ✅ v1.1.12 | ✅ v1.1.9 | — |
| Camera Comp. | ✅ | ✅ | ✅ | — | — | ✅ | ✅ | ✅ v1.1.9 | — |
| Corridoio Princ. | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | — |
| Alloggi | ✅ | ✅ | ✅ | ✅ | — | — | ✅ v1.1.12 | — | — |
| Laboratori | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ v1.1.12 | — | — |
| Serra Morente | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ v1.1.12 | — | — |
| Arca Biologica | ✅ | ✅ | ✅ v1.1.11 | ✅ | — | — | ✅ v1.1.12 | — | — |
| Scriptorium | ✅ | ✅ | ✅ | ✅ | — | — | ✅ v1.1.12 | — | — |
| Santuario Sil. | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ v1.1.12 | — | — |
| Arca Memoria | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ v1.1.12 | — | — |
| Ponte Comando | ✅ | ✅ | — | — | ✅ | — | ✅ | ✅ v1.1.9 | — |
| Santuario Cent. | ✅ | ✅ | — | — | — | — | ✅ v1.1.12 | — | ✅ |

**Tutti i gap di TOCCA e ANALIZZA chiusi in v1.1.11–v1.1.12.**

---

## 2. ANALISI FUNZIONALITÀ DEL GIOCO

### 2.1 Struttura narrativa e mappa

Il gioco ha **14 stanze** organizzate in 4 aree concettuali:

```
[Plancia SM] → [Stiva] → [Scafo Esterno] → [Camera Comp.] → [Corridoio Principale]
                                                                      ↑
                                          [Laboratori Risonanza] ←───┤
                                          [Alloggi Equipaggio]  ←───┤
                                          [Serra Morente]       ←───┤
                                               ↓                    ↑
                                          [Arca Biologica]          │
                                          [Santuario Silenzio] ←────┤
                                               ↓                    ↑
                                          [Scriptorium]             │
                                               ↓                    ↑
                                          [Arca della Memoria] ─────┤
                                          [Ponte di Comando]  ←─────┘
                                               ↓
                                          [Santuario Centrale]
```

La struttura è lineare nella parte iniziale (Plancia → Camera di Compensazione), poi si apre in un hub (Corridoio Principale) con 5 direzioni, poi si richiude per il finale. È un design da avventura testuale classico, solido e ben rodato.

### 2.2 Flusso dei puzzle

Il gioco ha **7 puzzle principali** in sequenza logica:

| # | Puzzle | Oggetto | Stanza | Sblocca |
|---|---|---|---|---|
| 1 | Indossa tuta | Tuta Spaziale | Stiva | Uscita verso scafo |
| 2 | Analizza crepa → taglia | Taglierina al Plasma | Scafo Esterno | Ingresso al relitto |
| 3 | Attiva pannello con batteria | Batteria di Emergenza | Camera Comp. | Corridoio Principale |
| 4a | USA DISCO SU ALTARE | Disco di Pietra | Santuario Silenzio | Stele del Ricordo |
| 4b | USA TAGLIERINA SU TERMINALE | Taglierina | Arca della Memoria | Nucleo di Memoria |
| 4c | Sblocca teca con tavoletta | Tavoletta Incisa | Serra Morente | Seme Vivente |
| 5 | Attiva cristallo + generatore | Cristallo Dati | Corridoio+Lab. | Potere ripristinato |
| 6 | Inserisci 3 chiavi nella porta | Seme/Stele/Nucleo | Corridoio | Ponte di Comando |
| 7 | Esamina mappa → tocca 3 punte | — | Ponte Comando | Santuario Centrale |

**Punti di forza:**
- I puzzle 4a/4b/4c sono paralleli e indipendenti — il giocatore può risolverli in qualsiasi ordine
- I 3 oggetti chiave (Seme/Stele/Nucleo) hanno nomi tematici perfettamente coerenti
- Il puzzle del cristallo (attivalo con il dispositivo medico, inseriscilo nel generatore) ha una catena causale elegante
- La barriera "tuta spaziale obbligatoria" insegna la meccanica `USA oggetto` in sicurezza all'inizio

**Punti deboli:**
- Il puzzle 7 (tocca 3 punte) è un salto logico non supportato da hint esplicito
- Il dispositivo medico richiede analisi del cadavere per capire che "stringe qualcosa tra le mani" — ma `ANALIZZA CADAVERE` in Arca Biologica **non è definito**, solo `ESAMINA/GUARDA` e `ANALIZZA CAPSULE`. Il giocatore deve guardare il cadavere per vedere il riferimento agli oggetti, poi raccoglierli tramite il sistema item generico
- La catena "analizza scafo → trova crepa → analizza crepa → taglia crepa" richiede 4 passaggi dove molti giocatori tenterebbero `taglia scafo` al primo tentativo (risposta corretta, ma frustrante senza hint)

### 2.3 Gestione dell'inventario

L'inventario è una semplice lista di stringhe (`string[]`). Funziona, ma ha alcune limitazioni:
- Nessun limite di peso/capacità (realistico per questo tipo di gioco, corretto non averlo)
- Gli oggetti consumabili vengono rimossi correttamente (tavoletta, batteria, disco, tre chiavi)
- La Tuta Spaziale cambia nome in inventario ("Tuta Spaziale" → "Tuta Spaziale (indossata)") — design corretto che segnala lo stato
- Il Kit di Manutenzione si decompone nei suoi contenuti — meccanica classica e piacevole
- L'inventario mostrato è una lista piatta separata da virgole: funzionale ma non formattata

### 2.4 Sistema Echi Temporali

I 4 echi sono attivabili con il Sintonizzatore in 4 stanze specifiche (Plancia, Serra, Laboratori, Arca Biologica). Il sistema funziona correttamente:
- Ogni eco è registrato una volta sola (`state.echoes[]`)
- Il comando `ECHI` mostra tutti gli echi registrati con numerazione e testo completo
- I testi in `ECHO_TEXTS` sono duplicati rispetto a quelli in `laboratoriRisonanza.ts` — una fonte di verità singola sarebbe meglio

**Gap:** Il Sintonizzatore funziona in **4 stanze su 14**. Portarlo nelle altre 10 stanze restituisce sempre "solo statico". È una scelta narrativa legittima, ma gli Alloggi dell'Equipaggio, il Corridoio Principale, il Ponte di Comando sarebbero candidati ovvi per ulteriori echi.

### 2.5 Sistema di progressione narrativa (traduzione)

Il flag `translationProgress` progredisce attraverso 4 oggetti analizzati:
- Lastra Dati → 4% (frammentaria, primi indizi)
- Cilindro Mnemonico → 18% (più personale, il "seme-dell-anima")
- Stele del Ricordo → 75% (salto rivelatore, "tre soli sanguinarono")
- Nucleo di Memoria → 100% (conclusivo, "Log dell'Archivista")

La progressione percentuale è un'elegante meccanica narrativa che dà al giocatore la sensazione di decifrare attivamente la storia. Tuttavia:
- Il numero non è mai **mostrato visivamente** nell'interfaccia — esiste solo nel testo degli oggetti analizzati
- Non c'è continuità esplicita tra i frammenti: il giocatore non riceve un prompt "hai decodificato il 18% — continua ad analizzare" — dipende dalla memoria del giocatore

### 2.6 Stato di completamento funzionale complessivo

| Area | Stato | Note |
|---|---|---|
| Navigazione | ✅ Completa | Tutte le 14 stanze collegate |
| Puzzle | ✅ Completi | 7 puzzle principali funzionanti |
| Inventario | ✅ Funzionale | Gestione oggetti corretta |
| Echi | ✅ Funzionale | 4 echi attivi |
| Save/Load | ✅ Completo | 5 slot localStorage |
| Endgame | ✅ Presente | Monologo + gameOver con narrazione |
| Hint system | ❌ Assente | Nessun sistema di aiuto contestuale |
| Feedback parser | ⚠️ Parziale | Fallback generici, nessun "intendi...?" |
| Progressione visibile | ⚠️ Parziale | translationProgress non mostrato in UI |

---

## 3. ANALISI NARRATIVA

### 3.1 Struttura tematica

Il Relitto Silente è un'avventura di fantascienza speculativa con al centro il tema della **panspermia intenzionale**: una civiltà aliena morente che, invece di accettare la propria estinzione, ha deliberatamente "seminato" il proprio genoma nell'universo, dando origine (implicitamente) alla vita sulla Terra.

Questo è un tema di qualità letteraria genuina — presente in alcune delle migliori opere della SF hardscience (Clarke, Bear, Baxter) — e il gioco lo tratta con rispetto e coerenza interna.

**Il ciclo narrativo completo:**
```
Antefatto: Civiltà K'tharr (sistema trino) → dying civilization
           ↓
           "Grande Salto" → navi-arca lanciate verso galassie giovani
           ↓
           Questa nave: raggiunge il sistema solare in formazione
           Semina: DNA/vita nei pianeti giovani
           ↓
           Equipaggio muore (freeze, vecchiaia, collasso sistemi)
           ↓
           Millenni dopo: il protagonista (discendente biologico) entra nel relitto
           ↓
           Scoperta: "Tu sei quella nuova musica" — siamo i loro eredi
```

Il ciclo è narrativamente chiuso e tematicamente coerente. **La rivelazione funziona.**

### 3.2 Punti di forza narrativi

**Il linguaggio alieno intraducibile:** Le parole lasciate in lingua originale (`canto-radice`, `seme-dell-anima`, `dovere-gioia`) sono un tocco raffinato. Suggeriscono una cultura che pensa in modo concettualmente diverso dal nostro, senza rendere il tutto esoterico o illeggibile.

**Il monologo dell'Anziano:** È il momento più alto del gioco dal punto di vista letterario. "Tu sei quella nuova musica. Una melodia che potevamo solo immaginare, nata nel silenzio che ci siamo lasciati alle spalle." La metafora musicale, usata con coerenza (il "canto", la "sinfonia", la "prima nota"), è bella e originale nel contesto dell'IF italiana.

**La morte dell'astronauta umano nell'Arca Biologica:** Un particolare narrativo potente e sottoutilizzato. Un essere umano è già venuto qui, secoli fa, ed è morto. Chi era? Perché era solo? Come aveva trovato la nave? Questa è la più grande domanda che il gioco apre e non risponde. Può essere una scelta voluta (mistero residuo) o un buco narrativo da riempire.

**L'analisi delle capsule nell'Arca Biologica:** "Capisci la terribile verità. Questa non era una stiva. Era un'arca." Questo momento di shock e comprensione è ottimamente costruito — la ripetizione "deceduto... deceduto... deceduto" prima della conclusione ha il ritmo giusto.

**Il finale:** Il seme fossilizzato che ora pulsa come un "cuore addormentato in attesa della primavera" è un'immagine finale memorabile. La sequenza dissolvenza verso la plancia, il dubbio sul sogno/allucinazione, la scoperta dell'oggetto fisico — è strutturata come un finale cinematografico. Funziona.

**La mappa stellare come reveal silenzioso:** Mostrare la rotta verso il sistema solare senza spiegarlo a parole è una scelta narrativa matura. Il giocatore capisce da solo, e questo "capire insieme" al personaggio è il momento di connessione emotiva più forte.

### 3.3 Debolezze narrative

**D1 — Il protagonista è un guscio vuoto**
Il mercante della Santa Maria non ha: nome, storia personale rilevante, relazioni, paure specifiche, né un arco emotivo esplicito. Sappiamo solo che è "un lupo solitario" che cerca ricchezze di recupero. La trasformazione da "cacciatore di relitti" a "portatore di un'eredità cosmica" avviene implicitamente, non esplicitamente. Il giocatore intelligente la inferisce, ma non la *sente*. Aggiungere anche solo 3-4 monologhi interiori in momenti chiave ("mentre guardi le capsule vuote, pensi a...") cambierebbe radicalmente la profondità emotiva del personaggio.

**D2 — Gli echi sono 4 ma potrebbero essere molti di più**
Il Sintonizzatore funziona in 4 stanze, lasciando 10 stanze "mute". Il Ponte di Comando senza eco è un'occasione persa (il Capitano che impartisce l'ordine finale?). Gli Alloggi senza eco è un'occasione persa (il membro dell'equipaggio che si prepara a morire). Il Corridoio Principale, cuore della nave, senza eco è una scelta opinabile. Ogni stanza potrebbe avere la sua voce.

**D3 — Il cadavere umano nell'Arca Biologica è un mistero aperto senza risposta**
È uno dei dettagli più intriganti del gioco e viene lasciato completamente inesplorato. Chi era? Come è arrivato qui? È morto cercando di aprire le capsule? Era una spedizione scientifica? Un altro recuperante? Il giocatore che ci pensa troppo può sentire questo come un buco narrativo piuttosto che un mistero voluto.

**D4 — Il K'tharr non ha individualità**
La civiltà aliena emerge attraverso indizi, echi e resti, ma non ha mai un "volto" oltre all'Anziano finale. Il corpo negli Alloggi potrebbe avere il suo eco specifico. L'Ingegnere Capo dell'eco in laboratorio ("Evacuare il settore! SUBITO!") è l'unico momento di urgenza e paura — sarebbe bello espanderlo.

**D5 — La motivazione del "perché questo sistema solare"**
Il monologo finale spiega il "cosa" (panspermia intenzionale) e il "perché" filosofico (la vita non deve spegnersi), ma non il "perché qui". Perché il sistema solare? Perché la Terra in particolare? L'ipotesi potrebbe essere accennata nella mappa stellare — forse il sistema solare era già segnalato come "proto-fertile" nei loro dati astronomici.

**D6 — Nessuna reazione emotiva esplicita del protagonista alle grandi scoperte**
Quando il protagonista analizza le capsule e capisce che sono "tutti morti", il testo è in seconda persona narrativa ("Capisci la terribile verità"). Ma non c'è un momento dove il protagonista *dice* o *pensa* qualcosa in prima persona. L'IF tradizionale usa questo per creare empatia: "Devi sederti un momento. Tante vite." Un singolo momento del genere — non inflazionato — avrebbe grande impatto.

**D7 — La traduzione al 100% non ha un momento speciale**
Quando si analizza il Nucleo di Memoria e la traduzione raggiunge il 100%, questo avviene senza che il gioco riconosca che *hai completato la decifrazione*. Sarebbe narrativamente appropriato un commento del tipo "Il tuo scanner ha raggiunto il 100% di comprensione della lingua. Tutto ciò che troverai d'ora in poi sarà leggibile direttamente."

**D8 — Il finale ha un elemento stilistico anacronistico**
La riga finale del GameOver usa la classe Tailwind `text-yellow-300 text-2xl`:
```html
<span class="text-yellow-300 text-2xl mt-4 block text-center">FINE</span>
```
Questo è un residuo di prima del redesign CRT. Il colore giallo rompe completamente la palette fosforo P1 e l'immersione estetica del gioco. **Va corretto urgentemente.**

### 3.4 Coerenza linguistica e stilistica

Il gioco è scritto in italiano corretto con uno stile descrittivo preciso. Alcuni osservazioni:
- Il tono è uniformemente "terza persona distaccata con seconda persona di indirizzo" — coerente
- Le descrizioni delle stanze hanno una densità atmosferica appropriata, né troppo brevi né prolisse
- Il glossario alieno (`K'tharr`, sistema trino, Grande Salto, eco temporale) è usato con coerenza
- La tecnologia del protagonista (multiscanner, tuta EVA, taglierina al plasma, batteria di emergenza) è plausibile e non eccessivamente futuristica — scelta giusta per mantenere il giocatore ancorato al presente

### 3.5 Ritmo della progressione narrativa

La storia si rivela attraverso 8 momenti principali ordinati per profondità:

| Momento | Dove | Rivelazione | Impatto |
|---|---|---|---|
| 1 | Lastra Dati | "Giorno del Grande Salto" — primo frammento | Basso (4%) |
| 2 | Bassorilievi | L'esodo visivo della civiltà | Medio |
| 3 | Cilindro Mnemonico | Il "seme-dell-anima" — il viaggio era per noi | Medio (18%) |
| 4 | Capsule Arca Bio. | L'ecosistema perduto | Alto (choc) |
| 5 | Stele del Ricordo | "Tre soli sanguinarono" — la fine della loro civiltà | Alto (75%) |
| 6 | Nucleo di Memoria | L'archivista: "sappia che siamo esistiti" | Molto alto (100%) |
| 7 | Mappa Stellare | La rotta verso casa — visiva | Climax 1 |
| 8 | Monologo Anziano | "Sei la nostra discendenza" | Climax 2 |

Il ritmo è buono: l'intensità cresce con coerenza. Il salto da 18% a 75% (Stele) è il più grande e coincide con la rivelazione centrale — corretto narrativamente.

---

## 4. PIANO MIGLIORAMENTI

I miglioramenti sono organizzati in tre livelli di priorità. Ogni voce include stima di complessità implementativa (**B**=Bassa, **M**=Media, **A**=Alta).

---

### 4.1 ESSENZIALI — Da fare prima della distribuzione pubblica

**E1 — ~~Fix stile FINE nel GameOver~~ ✅ RISOLTO v1.1.1** · Complessità: **B**
Sostituire `<span class="text-yellow-300 text-2xl ...">FINE</span>` con uno span usando `color: var(--p-bright)` o `var(--p-main)`. Il giallo Tailwind rompe la palette fosforo e non ha scuse estetiche.

**E2 — ✅ Hint per il puzzle "TOCCA TRE PUNTE"** · Complessità: **B** · _Risolto in v1.1.0_
Aggiungere nel Ponte di Comando, dopo `ESAMINA PORTA CIRCOLARE` o dopo `ANALIZZA PORTA`, un testo esplicito:
> "Il pannello ha cinque piccole punte luminose retrattili. Potrebbero essere un codice a combinazione. Il numero giusto... tres soles in cuna. Forse la risposta era nella mappa."

Oppure, più elegante: aggiungere `TOCCA PUNTE`, `ATTIVA PUNTE`, `PREMI PUNTE` (senza il numero) come comandi validi che chiedono: "Quante? Ricorda la mappa stellare."

**E3 — ~~Fix ANALIZZA CADAVERE in Arca Biologica~~ ✅ RISOLTO v1.1.1** · Complessità: **B**
Aggiungere un regex `^(analizza) (cadavere|corpo|figura|astronauta)$` in `arcaBiologica.ts` con testo atmosferico:
> "La tuta indica un design terrestre, secoli più vecchio del tuo. Come ha trovato questa nave? Come è arrivato fin qui? Il tuo scanner non riesce a datare con precisione il momento della morte, ma è sicuramente avvenuto da molto, molto tempo. Ha trovato la stessa cosa che hai trovato tu, e non è uscito."

**E4 — ✅ Uniformare ANALIZZA NUCLEO (codice duplicato)** · Complessità: **B** · _Risolto in v1.1.0_
Il comando `analyzeMemoryCoreCommand` è definito identicamente sia in `corridoioPrincipale.ts` che in `arcaDellaMemoria.ts`. Spostarla in un file condiviso `game/commands/shared.ts` ed importarla in entrambe le stanze.

**E5 — ~~Fix "FINE" nel santuarioCentrale — palette CRT~~ ✅ RISOLTO v1.1.1** · Complessità: **B**
Vedi E1. Stesso file: `santuarioCentrale.ts`, riga 44. Anche il riferimento a `text-2xl` non ha senso nel contesto di scala CSS `transform: scale()` — va sostituito con `fontSize: '2.2rem'` inline.

---

### 4.2 AUSPICABILI — Miglioramenti significativi di qualità

**A1 — ~~Sistema HINT contestuale~~ ✅ RISOLTO v1.1.1** · Complessità: **M**
Aggiungere il comando `AIUTO` / `HINT` / `SUGGERIMENTO` con risposta contestuale basata sullo stato del gioco:
```typescript
function getContextualHint(state: PlayerState): string {
  if (!state.flags.isWearingSuit) return "Hai esplorato tutta la tua nave? Guarda cosa c'è nella stiva.";
  if (!state.flags.isHoleCut) return "Lo scafo è resistente, ma il tuo scanner potrebbe trovare un punto debole.";
  if (!state.flags.isPowerRestored) return "I macchinari nei laboratori sembrano aver bisogno di energia. Hai trovato qualcosa che potrebbe alimentarli?";
  // ... etc
}
```
Questo non risolve tutti i problemi di parser, ma riduce drasticamente il rischio di stallo.

**A2 — ~~Monologo interiore del protagonista~~ ✅ RISOLTO v1.1.2** · Complessità: **M**
Aggiungere 4-5 frammenti di riflessione in prima persona, attivati una sola volta tramite flag, nei momenti emotivamente più forti:
- Dopo analisi capsule arca biologica: il protagonista pensa all'enormità della perdita
- Dopo aver recuperato il Seme Vivente: "Stai portando l'ultima speranza di una civiltà in mano"
- Dopo aver visto la mappa stellare: "È casa tua. È sempre stata casa tua."
- Sulla plancia nel finale, prima di guardare il seme

**A3 — ~~Echi temporali aggiuntivi~~ ✅ RISOLTO v1.1.2** · Complessità: **M**
Espandere il sistema eco a 8 stanze (da 4 a 8), aggiungendo voci in:
- Alloggi Equipaggio: "Navarca: 'Questo sarà il mio ultimo ciclo di veglia. Ho chiesto di rimanere l'ultimo. Qualcuno deve spegnere le luci.'"
- Ponte di Comando: "Ufficiale di Navigazione: 'La rotta è confermata. Tra... 4.7 milioni di cicli... il sistema bersaglio sarà maturo. Noi non ci saremo. Loro sì.'"
- Corridoio Principale: "Voce anonima: 'Il Seme è al sicuro. La Stele è al sicuro. Il Nucleo è al sicuro. Abbiamo fatto tutto quello che potevamo.'"
- Camera di Compensazione: "Voce tecnica: 'Porta esterna sigillata. Protocollo silenzio attivato. Che la musica continui.'"

**A4 — ~~Barra di progresso traduzione visibile~~ ✅ RISOLTO v1.1.2** · Complessità: **M**
Aggiungere nell'UI un indicatore persistente della percentuale di traduzione raggiunta. Nel terminale, potrebbe apparire come una riga nella `TerminalOutput` ogni volta che la percentuale cambia:
```
> [MATRICE TRADUZIONE: ████░░░░ 18%]
```
Oppure come un indicatore fisso nel footer accanto alle F-key (solo durante il gioco).

**A5 — ✅ Risposta fuzzy / "intendi...?"** · Complessità: **M** · _Risolto in v1.1.0_
Implementare un semplice sistema di suggestion quando il fallback restituisce "Non capisco quel comando". Calcolo Levenshtein distance 1-2 sui verbi noti e sui nomi degli oggetti in stanza:
```typescript
const knownVerbs = ['guarda', 'esamina', 'analizza', 'prendi', 'usa', 'tocca', 'parla', 'entra'];
// Se la distanza di Levenshtein dal verbo inserito ≤ 2 da un verbo noto → suggerisci
```
Output: "Non capisco 'guaarda'. Intendevi GUARDA?"

**A6 — Mistero dell'astronauta umano — risposta opzionale** · Complessità: **M**
Nell'Arca Biologica, aggiungere analisi della tuta e di un eventuale documento/placchet che l'astronauta porta con sé. Non rispondere a tutto, ma dare abbastanza per far capire che era un esploratore solitario di un'era passata — il che aggiunge un layer: *altri prima di noi hanno trovato questa nave e non sono sopravvissuti per raccontarlo*.

**A7 — Titolo stanza come intestazione separata** · Complessità: **B**
I titoli delle stanze (es. "CORRIDOIO PRINCIPALE\n\n") sono attualmente embedded nel testo di description. Separare il titolo come campo `Room.title` e renderizzarlo in `TerminalOutput` con stile diverso (colore `var(--p-bright)`, letterspacing più ampio, sottolineatura o riga sopra/sotto). Questo migliora la leggibilità e la navigazione visiva dell'output.

**A8 — Comando NOTA / DIARIO** · Complessità: **M**
Aggiungere un comando `NOTE` / `DIARIO` / `LOG` che mostra una lista auto-generata delle scoperte principali del giocatore, basandosi sui flag attivi:
- Se `cilindroAnalizzato`: "Cilindro Mnemonico: parla di 'seme-dell-anima' e del Grande Salto (18%)"
- Se `steleAnalizzata`: "Stele del Ricordo: 'Tre soli sanguinarono. Il nostro corpo è polvere, il ricordo è una stella' (75%)"
Questo sostituisce la necessità di memoria del giocatore e supporta chi riprende la partita dopo tempo.

---

### 4.3 SUPERFLUI MA PERFETTI — Tocchi finali per la distribuzione premium

**S1 — Audio contestuale per le stanze** · Complessità: **A**
Aggiungere tracce audio ambientali (loop brevi, generati con Web Audio API o file .ogg):
- Rumori della nave (humming, fruscio ventilazione) sulla plancia e stiva
- Silenzio assoluto con leggero riverbero nelle stanze aliene
- Risonanza bassa nella camera di compensazione
- Rumore di cristalli/frequenze nei Laboratori
- Tonalità sacra, quasi gregoriana, nel Santuario Centrale
Non deve essere musica — solo texture ambientali che rafforzano l'immersione.

**S2 — Animazioni testo typewriter selettiva** · Complessità: **M**
Per i momenti narrativi chiave (monologo Anziano, gameOver, analisi capsule dell'Arca), aggiungere un'animazione typewriter lenta (`setTimeout` per carattere) invece dell'apparizione istantanea del testo. Velocità: ~40ms/carattere per il monologo finale, ~20ms per il resto. Con possibilità di skip con qualsiasi tasto.

**S3 — Inventario formattato con icone ASCII** · Complessità: **B**
Sostituire la lista piatta "stai trasportando: Tuta Spaziale (indossata), Taglierina al Plasma..." con un layout formattato:
```
INVENTARIO [6/∞]
 ► Tuta Spaziale (indossata)
 ► Taglierina al Plasma
 ► Batteria di Emergenza
 ► Lastra Dati
 ► Sintonizzatore di Frequenza
 ► Disco di Pietra
```
Con colore `var(--p-bright)` per `►` e colore `var(--p-main)` per i nomi.

**S4 — Mappa testuale con stanze scoperte** · Complessità: **M**
Aggiungere il comando `MAPPA` che mostra una rappresentazione ASCII delle stanze esplorate, aggiornata man mano:
```
[PLANCIA]─[STIVA]
              │
          [SCAFO EST.]
              │
          [CAMERA COMP.]
              │
          [CORRIDOIO PRINC.]──[ALLOGGI]
           /  │  \
   [SANTUARIO] [SERRA] [LABORATORI]
     SILENZIO    │
        │    [ARCA BIO.]
   [SCRIPTORIUM]
        │
   [ARCA MEMORIA]
```
Le stanze non ancora visitate appaiono come `[???]`, quelle visitate con il nome.

**S5 — Schermata crediti e colophon** · Complessità: **B**
Una schermata accessibile dal menu principale (F6 o voce "Crediti") con stile terminale anni '80:
```
IL RELITTO SILENTE  v1.0.x
─────────────────────────────
Testo e design: [Autore]
Engine: React 19 · TypeScript · Vite
Electron: 41
Font: Press Start 2P (Google Fonts)

Ispirato a: Zork · Infocom · Eric The Unready
Tema: Prima Luce · Arthur C. Clarke · Kim Stanley Robinson

"Ogni fine è una prima nota."
─────────────────────────────
```

**S6 — Easter egg: il vecchio lettore di ebook** · Complessità: **B**
Nella Stiva, tra le casse di minerale, c'è già un dettaglio nascosto: un lettore di ebook con sullo schermo rotto il titolo "...nello di Ghiaccio" (quasi certamente "Castello di Ghiaccio" o un'altra IF classica italiana). Rendere questo interattivo: `ESAMINA LETTORE` / `LEGGI LETTORE` dovrebbe dare un messaggio metafinzionale che omaggia le avventure testuali classiche. Attualmente l'oggetto non è interattivo.

**S7 — Sistema di statistiche fine partita** · Complessità: **M**
Nel GameOver, prima di "FINE", aggiungere una sezione stile tabella DOS:
```
RESOCONTO MISSIONE
──────────────────
Stanze esplorate:  14/14   ██████████ 100%
Echi raccolti:      4/4    ██████████ 100%
Traduzione:       100%     ██████████ COMPLETA
Oggetti analizzati: 12/18  ██████░░░░  67%
Tempo di gioco:    ~45 min
──────────────────
VALUTAZIONE: ARCHIVISTA COMPLETO
```
Questo premia l'esplorazione completista e dà una misura della completezza.

**S8 — Localizzazione (EN)** · Complessità: **A**
Preparare le basi per una versione inglese del gioco. Il sistema di rooms come moduli TypeScript si presta a una struttura `rooms/it/` e `rooms/en/`. La storia e i temi funzionano perfettamente in inglese e aprirebbero il gioco a un pubblico molto più ampio. Non richiede riscrittura dell'engine, solo un layer di i18n.

**S9 — Salvataggio automatico (autosave)** · Complessità: **B**
Salvare automaticamente nello slot 0 (slot speciale "AUTOSAVE") ogni volta che il giocatore entra in una nuova stanza. Il SaveLoadOverlay potrebbe mostrare questo slot in cima con etichetta speciale `[AUTOSAVE]`. Protegge contro chiusure accidentali e riduce la friczione per i giocatori che non pensano a salvare manualmente.

**S10 — Trailer / schermata "CHI SIAMO" con testo narrato** · Complessità: **M**
Una schermata opzionale (F1 dal menu principale, come intro alternativa) con testo narrato in stile terminal, che introduce il mondo del gioco come se fosse un documento di bordo:
```
TERMINALE DI BORDO — SANTA MARIA — LOG 2187.04.12
══════════════════════════════════════════════════
OGGETTO: Rapporto di prossimità
PRIORITÀ: Alta

Sensori a lungo raggio hanno rilevato corpo non identificato.
Massa stimata: 2.4 × 10⁸ tonnellate.
Emissioni energetiche: zero.
Segnature biologiche: zero.

Il relitto... aspetta.
```
Questa potrebbe essere la nuova versione del testo intro, più immersiva e coerente con l'estetica terminale.

---

## RIEPILOGO PRIORITÀ

| Codice | Tipo | Descrizione | Urgenza | Stato |
|---|---|---|---|---|
| E1 | Fix | Colore FINE nel GameOver (Tailwind → CSS var) | 🔴 Alta | ✅ v1.1.1 |
| E2 | Fix/UX | Hint puzzle "tocca tre punte" | 🔴 Alta | ✅ v1.1.0 |
| E3 | Fix | ANALIZZA CADAVERE in Arca Biologica | 🔴 Alta | ✅ v1.1.1 |
| E4 | Refactor | Deduplicazione analyzeMemoryCoreCommand | 🟡 Media | ✅ v1.1.0 |
| E5 | Fix | Stile "FINE" — font size e colore | 🔴 Alta | ✅ v1.1.1 |
| A1 | Feature | Sistema HINT contestuale | 🟡 Media | ✅ v1.1.1 |
| A2 | Narrativa | Monologhi interiori protagonista | 🟡 Media | ✅ v1.1.2 |
| A3 | Narrativa | Echi temporali aggiuntivi (×4) | 🟡 Media | ✅ v1.1.2 |
| A4 | UI | Indicatore progressione traduzione | 🟡 Media | ✅ v1.1.2 |
| A5 | Parser | Suggerimento fuzzy "intendi...?" | 🟡 Media | ✅ v1.1.0 |
| A6 | Narrativa | Mistero astronauta umano espanso | 🟢 Bassa | ✅ v1.1.3 |
| A7 | UI | Titolo stanza come campo separato | 🟢 Bassa | ✅ v1.1.3 |
| A8 | Feature | Comando NOTA/DIARIO | 🟢 Bassa | ✅ v1.1.3 |
| S1 | Audio | Texture ambientali per stanza | 🟢 Bassa | ✅ v1.1.3 — ripristinata v1.1.13 |
| S2 | UI | Typewriter per momenti chiave | 🟢 Bassa | ✅ v1.1.3 |
| S3 | UI | Inventario formattato ASCII | 🟢 Bassa | ✅ v1.1.4 |
| S4 | Feature | Mappa testuale ASCII progressiva | 🟢 Bassa | ✅ v1.1.4 |
| S5 | UI | Schermata crediti | 🟢 Bassa | ✅ v1.1.4 |
| S6 | Narrativa | Easter egg lettore ebook interattivo | 🟢 Bassa | ✅ v1.1.4 |
| S7 | UI | Statistiche fine partita | 🟢 Bassa | ✅ v1.1.4 |
| S8 | Feature | Localizzazione inglese | 🟢 Bassa | ❌ scartato — il gioco è pensato specificamente in italiano |
| S9 | Feature | Autosave slot 0 | 🟢 Bassa | ✅ v1.1.5 |
| S10 | UI | Intro terminale alternativa | 🟢 Bassa | ✅ v1.1.5 |

---

## CONCLUSIONI

Il Relitto Silente è un'avventura testuale narrativamente ambiziosa e tecnicamente solida. Il tema della panspermia intenzionale è originale nel panorama IF italiano, i puzzle sono logicamente coerenti (con l'eccezione critica del puzzle finale), e l'estetica CRT è genuinamente riuscita.

**Aggiornamento v1.1.1:** Tutti i blocchi essenziali (E1-E5) sono stati risolti. Il parser è robusto con fuzzy matching (A5), il puzzle finale è accessibile (E2), il cadavere rivela la sua storia (E3), la parola FINE ha la palette corretta (E1/E5), e il sistema HINT (A1) elimina il rischio di stallo anche per i giocatori meno esperti.

Il potenziale narrativo è più grande di quanto l'implementazione attuale mostri. Il protagonista ha bisogno di una voce (A2). Il K'tharr ha bisogno di più facce (A3). Il Sintonizzatore ha bisogno di più stanze dove cantare. Ma queste sono espansioni che possono essere aggiunte progressivamente, senza toccare l'architettura — e ciò è un merito del design modulare a stanze indipendenti.

**Il gioco è pronto per distribuzione pubblica.** Tutte le barriere essenziali alla giocabilità sono risolte. I miglioramenti A2-A8 e S1-S10 rimangono come piano di espansione post-lancio.

---

*Analisi redatta il 2026-03-20 su versione 1.0.19. Aggiornare a ogni nuova versione.*

---

## STATO LAVORI — RIEPILOGO FINALE (aggiornato a v1.1.6)

---

### ✅ COSE FATTE — elenco completo per versione

| Versione | ID | Descrizione |
|---|---|---|
| v1.1.0 | E2 | Hint puzzle "tocca tre punte" aggiunto al Ponte di Comando |
| v1.1.0 | E4 | Deduplicazione `analyzeMemoryCoreCommand` in file condiviso |
| v1.1.0 | A5 | Fuzzy matching con Levenshtein distance — "intendi...?" |
| v1.1.0 | P1–P5 | Parser critico: tolleranza typo, fix puzzle cilindro, fix ANALIZZA incoerente, fix USA X SU Y duplicato |
| v1.1.1 | E1 | Colore "FINE" nel GameOver — Tailwind rimosso, palette CRT |
| v1.1.1 | E3 | ANALIZZA CADAVERE in Arca Biologica aggiunto con testo atmosferico |
| v1.1.1 | E5 | Stile "FINE" in santuarioCentrale — font size inline, colore CRT |
| v1.1.1 | A1 | Sistema HINT contestuale (`getContextualHint`) — comando AIUTO/SUGGERIMENTO |
| v1.1.2 | A2 | Monologhi interiori del protagonista (4 momenti chiave con flag one-shot) |
| v1.1.2 | A3 | Echi temporali aggiuntivi — portati da 4 a 8 (Alloggi, Ponte, Corridoio, Camera) |
| v1.1.2 | A4 | Barra di progressione traduzione `[MATRICE TRADUZIONE: ████░░ 18%]` |
| v1.1.3 | A6 | Tuta astronauta umano nell'Arca Biologica — item `tuta_antica` con backstory AURORA-7/L.V. |
| v1.1.3 | A7 | Titolo stanza in `var(--p-bright)` rilevato automaticamente via regex in `TerminalOutput` |
| v1.1.3 | A8 | Comando NOTA/DIARIO — log auto-generato delle scoperte con barre progresso |
| v1.1.3 | S1 | Texture ambientali procedurali per stanza (Web Audio API, 5 profili: ship/alien_quiet/alien_cold/alien_electric/sacred) |
| v1.1.3 | S2 | Animazione typewriter per momenti narrativi chiave (`TypewriterLine`, skip con qualsiasi tasto) |
| v1.1.4 | S3 | Inventario HTML formattato con `►` bullet, header `INVENTARIO [N/∞]` |
| v1.1.4 | S4 | Mappa ASCII progressiva — `getMappa(state)` con stanze `[NOME]`/`[???]`/`[*NOME*]` e tracking `visitedRooms` |
| v1.1.4 | S5 | Schermata crediti — `GameState.Credits`, tasto F8, testo HTML stile terminale |
| v1.1.4 | S6 | Easter egg `lettore_ebook` nella Stiva — omaggia "Castello di Ghiaccio" di Paolo Vità |
| v1.1.4 | S7 | Statistiche fine partita — `getStats(state)` con barre `█░` e rating (4 livelli) |
| v1.1.5 | S9 | Autosave slot 0 — `writeAutosave` ad ogni cambio stanza, slot `[0]` nell'overlay |
| v1.1.5 | S10 | Intro terminale alternativa — 3 pagine stile documento di bordo S/V Santa Maria (HTML) |
| v1.1.6 | — | Patch: ambience disabilitata temporaneamente; F6/F7 overlay separato per inventario e mappa; delay comando ridotto 300ms→80ms; PaginatedScreen fix (replace invece di append); IntroScreen animata con beep acuti |
| v1.1.7 | P10 | Comando `ASPETTA` / `Z` / `ATTENDI` — messaggio atmosferico, nessun side-effect |
| v1.1.8 | P9 | Abbreviazione `giù`/`giu` → `basso` in `normalizeCommand` |
| v1.1.9 | P6 | Preprocessing `nel/nella/nell'/nello/nelle/in` dopo `entra/vai`; alias aggiuntivi in scafoEsterno, cameraDiCompensazione, ponteDiComando |
| v1.1.10 | P8 | Rimosso regex morto `^(leggi) (.+)$` da Scriptorium; aggiunto `^leggi$` con risposta orientativa |
| v1.1.11 | — | ANALIZZA gap Arca Biologica: `details` su `brina`, comando `analizza stanza/ambiente/aria` |
| v1.1.12 | — | TOCCA atmosferico: 11 stanze aggiunte, copertura TOCCA 14/14 |
| v1.1.13 | S1 | Ambience ripristinata: master GainNode, fade-in 1.5s/fade-out 0.7s, toggle AUDIO/MUSICA/SUONO in-game, persistenza localStorage |
| v1.1.14 | D4 | K'tharr individualità: echo_lab espanso con dilemma morale ingegnere; ESAMINA CADAVERE state-dependent (echo_alloggi → riconosce il Navarca); details banco_lavoro con lista nomi |
| v1.1.15 | D5 | Perché questo sistema solare: ANALIZZA MAPPA nel Ponte di Comando (solo se ologramma attivo) rivela annotazione "Proto-fertile. Classe Giardino." |
| v1.1.16 | D7 | Traduzione 100%: tono scanner + "MATRICE DI TRADUZIONE: 100%. DECODIFICA COMPLETATA." + riflessione finale ("Non sei più uno scopritore. Sei un testimone.") |
| v1.1.17 | P7 | Dimostrativi (quel/questo/quella/...) rimossi da normalizeCommand — `USA QUEL DISCO SU ALTARE` ora funziona |
| v1.1.18 | — | Refactoring ECHO_TEXTS: estratti in `echoData.ts` (unica fonte); `laboratoriRisonanza.ts` if/else → lookup map; sincronizzato echo_lab desincronizzato |
| v1.1.19 | — | Echi aggiuntivi: Scriptorium (Scriba/Stele), Stiva (Tecnico/Seme), Santuario del Silenzio (Custode) — Sintonizzatore 8→11/14 |
| v1.1.20 | D3 | Mistero L.V./AURORA-7: paragrafo finale che riconosce le domande aperte e le presenta come silenzio deliberato — non buco narrativo |
| v1.1.21 | — | Impostazioni audio: overlay IMPOSTAZIONI con toggle+slider per ambience e SFX, persistenza localStorage, volume real-time |
| v1.1.22 | — | Schermata pausa F9/ESC: overlay con Continua/Salva/Carica/Ricomincia/Esci, zIndex 110, keydown capture |
| v1.1.23 | — | Test di regressione pre-distribuzione: 7/7 puzzle ✅, 11/11 echi ✅, 15 flag ✅, 8 item ✅, normalizeCommand ✅ |
| — | S8 | Localizzazione inglese — **scartata definitivamente** (parser italofono, identità del gioco) |

---

### ⬜ COSE DA FARE — lista prioritizzata per versione finale

---

~~#### 🔴 AUDIO — ripristino ambience~~ ✅ RISOLTO v1.1.13

~~- **Ambience audio** (S1 implementata in v1.1.3, disabilitata in v1.1.6 per problemi tecnici): il sistema oscillatori Web Audio è intatto e funzionante ma disattivato via flag `AMBIENCE_ENABLED = false`. Va diagnosticato il problema concreto (volume, latenza, conflitti AudioContext) e ripristinato con eventuale slider di volume o opzione on/off nelle impostazioni. Candidato principale per la prossima patch.~~

---

#### 🟡 NARRATIVA — espansioni opzionali ma significative

- ~~**Voce del K'tharr (D4):**~~ ✅ RISOLTO v1.1.14 — echo_lab espanso con dilemma morale; ESAMINA CADAVERE collegato al Navarca via echo_alloggi; banco_lavoro con lista nomi dell'ingegnere.

- ~~**Perché questo sistema solare (D5):**~~ ✅ RISOLTO v1.1.15 — ANALIZZA MAPPA rivela annotazione "Proto-fertile. Classe Giardino." sulla destinazione.

- ~~**Momento speciale a traduzione 100% (D7):**~~ ✅ RISOLTO v1.1.16 — scanner tone + "MATRICE DI TRADUZIONE: 100%." + riflessione "Non sei più uno scopritore. Sei un testimone."

---

#### 🟡 CONTENUTO — espansioni stanze

- ~~**Echi aggiuntivi oltre gli 8:**~~ ✅ RISOLTO v1.1.19 — Sintonizzatore 11/14: aggiunti Scriptorium (Scriba), Stiva (Tecnico carico), Santuario del Silenzio (Custode). Le 3 restanti hanno giustificazione narrativa.

- ~~**TOCCA atmosferico in più stanze**~~ ✅ RISOLTO v1.1.12 — tutte le 14 stanze coprono TOCCA.

- ~~**ANALIZZA in Arca Biologica (gap dalla tabella 1.4)**~~ ✅ RISOLTO v1.1.11

---

#### 🟢 PARSER — miglioramenti minori

- ~~**P6 — ENTRA con preposizione + nome**~~ ✅ RISOLTO v1.1.9

- ~~**P7 — Dimostrativi non rimossi da normalizeCommand**~~ ✅ RISOLTO v1.1.17

- ~~**P10 — Comando ASPETTA/Z**~~ ✅ RISOLTO v1.1.7

---

#### 🟢 UX / DISTRIBUZIONE

- ~~**Impostazioni audio:**~~ ✅ RISOLTO v1.1.21 — overlay `IMPOSTAZIONI` con toggle+slider per ambience e SFX.

- ~~**Schermata "Pausa" in-game:**~~ ✅ RISOLTO v1.1.22 — F9/ESC durante il gioco apre overlay con Continua/Salva/Carica/Ricomincia/Esci.

- ~~**Test di regressione:**~~ ✅ RISOLTO v1.1.23 — speedrun 7/7 ✅, sintonizzatore 11/11 ✅, flag 15/15 ✅, item 8/8 ✅, parser ✅.

---

*Aggiornato il 2026-03-21 — versione corrente: v1.1.23*
