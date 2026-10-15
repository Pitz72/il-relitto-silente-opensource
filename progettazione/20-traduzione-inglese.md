# Il Relitto in inglese: si può fare?

Versione 1.0, 15 ottobre 2026. Valutazione chiesta dall’autore: FAVELLA 1 è una lingua per scrivere
storie in italiano, ma il gioco (il testo e i comandi a fiore, non il linguaggio) si può tradurre in
inglese? In inglese il parser non si attiverebbe: solo pulsanti. L’obiettivo è internazionalizzare il
gioco; serve una valutazione di fattibilità. È un’analisi con una proposta: niente di quello che segue
è deciso, a parte quello che l’autore ha già detto. Le decisioni sono nel §8.

I numeri vengono da misure sui sorgenti e da un censimento giocato: i quattordici percorsi di collaudo,
premuti con i pulsanti attraverso il ponte (come `collaudo/pulsanti.py`), con ogni riga a schermo
confrontata con le stringhe dei `.fav` (§3).

---

## 1. In breve

**Si può fare, e senza toccare né il motore né i `.fav`.** Il motore resta italiano e il parser
diventa un protocollo interno: i pulsanti continuano a mandargli «esamina la radio», e l’inglese è
soltanto quello che si vede. La traduzione si fa a valle del motore, nell’app.

Lo rende possibile un fatto misurato: **quasi tutto quello che arriva allo schermo è testo scritto
dall’autore nei `.fav`**. Il motore di suo compone pochissimo: cinque formule (come «Preso: …» e «Il
tempo passa.»), i nomi delle stanze, dei personaggi e delle cose. Il resto sono 832 stringhe, circa
19.500 parole, che si traducono una per una, con i loro rami `[se]` e i loro segnaposto.

**La parte difficile non è la tecnica, è la traduzione.** Diciannovemila parole di prosa letteraria,
in seconda persona e al presente, con una voce precisa, le iscrizioni aliene, le voci del relitto, i
giochi fra la matrice di traduzione e l’intraducibile. Una bozza si fa in fretta; un inglese che
regga il confronto con l’italiano chiede un revisore madrelingua e una partita intera letta da lui.

Il lavoro tecnico è di qualche sessione (tre, cinque con i collaudi in inglese). Il tempo della
traduzione dipende da chi la rivede.

---

## 2. Perché il motore può restare italiano

Il motore riceve frasi italiane e risponde con testo italiano. Con il solo modo a pulsanti (in
inglese il parser non si offre: è una scelta dell’autore), il giocatore non scrive mai: le frasi le
compone il modello d’azione, a partire dai menu del motore. Che restino in italiano non si vede.

Ne vengono tre cose buone:

- **i `.fav` restano congelati**, e con loro l’impronta della storia, i collaudi, i percorsi;
- **i salvataggi non hanno lingua**: sono la sequenza dei comandi, in italiano, che il motore
  rigioca. Una partita salvata in italiano si carica in inglese, e al contrario;
- **tutto quello che oggi riconosce il testo continua a lavorare sull’italiano**: la grammatica
  tipografica (le voci, le letture, la scatola nera), i suggerimenti in maiuscolo con la loro
  morfologia italiana (`suggerimenti.ts`: «ANALIZZALA», «adesso puoi ACCOSTARE»), il diario, gli eventi
  del suono. Si traduce dopo che hanno riconosciuto.

L’alternativa, tradurre dentro il motore (sostituire i testi nel mondo compilato, o una FAVELLA che
renda i testi in un’altra lingua), farebbe uscire inglese dal motore e costringerebbe a rifare in
inglese ogni riconoscitore, compresa la morfologia dei suggerimenti. Per il Relitto, con i `.fav`
congelati, tradurre a valle è più sicuro.

---

## 3. Che cosa va tradotto

### 3.1 Il testo dei `.fav`

Misura sulle stringhe dei quattordici `.fav` (tolti i commenti):

| Dove sta | Stringhe | Parole | Caratteri |
|---|---|---|---|
| le risposte delle regole (`Invece di …`, `Prima di …`) | 369 | 9.137 | 53.232 |
| le descrizioni, il prologo, il titolo | 193 | 6.380 | 36.637 |
| i demoni e gli eventi (i finali compresi) | 29 | 1.990 | 11.487 |
| i dialoghi, le voci, le opzioni | 200 | 1.881 | 10.885 |
| altro | 41 | 82 | 579 |
| **totale** | **832** | **19.470** | **112.820** |

In più: i nomi di 23 stanze, delle cose e dei personaggi (quelli che compaiono sui pulsanti e nei
titoli), e i cinque titoli degli atti, che sono nel ponte (`ATTI` in `ponte.py`). Non si traducono le
219 righe di sinonimi (`si chiama anche`): servono al parser, che in inglese non c’è.

Per misura: 19.500 parole sono un racconto lungo, una settantina di cartelle.

### 3.2 Il testo che compone il motore

Il censimento ha giocato i quattordici percorsi con i pulsanti e, da ogni riga a schermo, ha tolto i
pezzi che vengono dai `.fav`. Quello che resta, in tutte le righe di tutti i percorsi:

| Formula del motore | Volte |
|---|---|
| `Il tempo passa.` (aspettare) | 117 |
| `--- <stanza> ---`, il titolo della stanza | 433 |
| `<personaggio>:` davanti a una battuta (l’Anziano, Yusuf, l’eco) | 82 |
| `Preso: <cosa>.` e `Lasciato: <cosa>.` | 110 |
| `Stai portando:` | 3 |
| `(Fine della conversazione.)` | 19 |
| `(La partita è finita. Scrivi ANNULLA…)` | 11, già nascosta dall’app |

Gli elenchi («Puoi vedere qui…», le uscite) l’app non li stampa: diventano il ramo. Le opzioni dei
dialoghi e le domande sono testo dei `.fav`.

I percorsi non premono ogni pulsante in ogni stanza: il censimento va allargato, con `prova()` del
motore, a tutti i pulsanti offerti a ogni passo, senza cambiare la partita. Se ne usciranno altre
formule della libreria (un rifiuto, «È troppo buio…»), saranno poche, e una tabella le copre.

### 3.3 L’interfaccia dell’app

Circa 260 stringhe nei componenti (stima larga sui `.tsx`), più quelle che l’app compone con la
grammatica italiana: la fascia di «Usa con…» («Usa la chiavetta con… tocca una cosa accesa»), il
titolo del fiore («Che cosa fare con …»), le etichette degli attrezzi («Multiscanner (analizza)»), le
note dell’aria sui petali («Ascolta −10»), i verbi dei petali, le uscite, i gruppi del ramo («Qui»,
«Con te», «e qui»), il visore, il diario e le sue pagine (`pagine.ts`), il menu, la pausa, le opzioni,
la pagina dei tasti, i salvataggi («Atto II · turno 20 · aria 54», le date), il registro dei finali,
i cartelli d’atto, gli avvisi, l’intro (i titoli e i sottotitoli dei suoni), la dichiarazione sull’IA,
i riconoscimenti (i titoli; i testi delle licenze restano nella loro lingua).

Il comando ripetuto sopra la risposta («› ESAMINA LA RADIO») e la trascrizione del diario mostrano
il comando italiano: in inglese si compongono dal pulsante premuto (il verbo e le cose, che l’app
conosce), e per una partita caricata dal comando registrato, che il ponte sa già scomporre.

---

## 4. Come si traduce a valle

### 4.1 Il catalogo dei modelli

L’unità di traduzione è la **stringa del `.fav` intera, con i suoi rami e i suoi segnaposto**, non la
riga che si vede. Un esempio dal corridoio:

`… le [se le tacche è segnata]quattro[altrimenti]tre[fine] tacche …`

si traduce

`… [se le tacche è segnata]four[altrimenti]three[fine] notches …`

con le stesse condizioni (che restano in italiano: sono codice, e il traduttore non le tocca), gli
stessi rami e gli stessi segnaposto (`[aria]`, `[traduzione]`, `[stanza]`).

Nell’app, ogni testo che il motore manda si confronta con i modelli: il confronto dice quale modello
l’ha prodotto, quale ramo di ogni `[se]` ha scelto il motore e che valori hanno i segnaposto. Il
modello inglese si compone con le stesse scelte. Così le condizioni non si valutano due volte, e la
traduzione segue la partita anche nei rami che nessun percorso ha toccato.

Serve davvero il modello intero: dei 45 `[se]` dei `.fav`, sette dividono una frase a metà («la
spia è [se l’aggancio è fatto]verde[altrimenti]rossa[fine]», «la parete ti porta [se …]verso la gola
di mezzo…[altrimenti]verso il passaggio…»). Tradotti a pezzi, quei rami non si ricomporrebbero in un
inglese naturale.

Il catalogo lo produce uno strumento dai `.fav` (come già fa `collaudo/tipografia.mjs` per leggerne
tutto il testo); il traduttore riceve ogni modello con il suo contesto (il file, la regola, la stanza).
Se un giorno un testo dei `.fav` cambia, per una decisione dell’autore, lo strumento segnala il modello
che non ha più la sua traduzione.

### 4.2 Le formule e i nomi

Le formule del motore (§3.2) hanno il loro modello inglese con il nome della cosa al suo posto: «Preso:
la tuta.» diventa «Taken: the suit.». I nomi stanno in una tabella per identificativo: le stanze, le
cose, i personaggi, gli atti, i finali. Le etichette dei pulsanti vengono da lì, non dal motore.

### 4.3 La grammatica tipografica in inglese

La lamina riconosce i tipi di testo con una ventina di regole, molte delle quali sono parole italiane
(`Scatola nera di una tuta extraveicolare`, `Registro di bordo, `, `ANALISI`, `LETTURA:`,
`(intraducibile: …)`, `(Matrice di traduzione: …)`, `PROTEZIONE VITALE`, `MATERIALE NON IN ARCHIVIO`).
Sul testo inglese serve la stessa grammatica con le regole inglesi: un modulo con due insiemi di
regole, e `collaudo/tipografia.mjs` che controlla anche l’inglese su tutti i percorsi.

I suggerimenti si riconoscono sull’italiano, come oggi; nel testo inglese si accende il maiuscolo
nella stessa posizione d’ordine (il secondo suggerimento italiano è il secondo maiuscolo inglese). È
una regola per chi traduce, e il collaudo la verifica: ogni modello inglese ha i suoi maiuscoli, tanti
quanti l’italiano e nello stesso ordine.

I nomi toccabili nel testo (D15) cercano i nomi inglesi delle cose nel testo inglese, con la tabella
del §4.2.

### 4.4 Che cosa non cambia

Il motore, i `.fav`, il ponte (a parte i titoli degli atti, che passano all’app per identificativo),
i salvataggi, il modello d’azione (tranne le etichette), il suono, i collaudi italiani. La modalità a
solo testo del documento 18, se si farà, resta solo italiana.

---

## 5. La traduzione

È il cuore del lavoro, e la parte in cui si decide la qualità.

- **Una guida di stile**, prima di tradurre: la seconda persona e il presente; il ritmo delle frasi
  corte nei momenti d’aria bassa (il testo vacilla, e anche l’inglese deve vacillare); le voci del
  relitto; la riga del registro di bordo; i maiuscoli dei suggerimenti.
- **Un glossario** che l’autore approva: la matrice di traduzione, il Sintonizzatore, la taglierina, il
  margine, la protezione vitale, il Navarca, l’Anziano, l’eco, il seme, il risuonatore, il Magazzino
  Quattro, le iscrizioni e l’intraducibile.
- **La tipografia inglese**: le virgolette alte al posto dei caporali, il trattino lungo all’inglese,
  il maiuscolo dei suggerimenti che resta.
- **Chi traduce.** Proposta: una bozza fatta con Claude, sulla guida e sul glossario, modello per
  modello e con il contesto di ognuno; poi la revisione completa di un revisore madrelingua inglese
  (meglio se conosce la narrativa interattiva); poi una partita intera letta da lui dentro il gioco. La
  dichiarazione sull’IA, in inglese, dice anche questo.

---

## 6. Come si prova

- **Copertura statica**: ogni modello dei `.fav` ha la sua traduzione, con gli stessi rami, gli stessi
  segnaposto e gli stessi maiuscoli; ogni stringa dell’interfaccia sta nella tabella inglese, e nel
  codice non ne resta una italiana fuori dalle tabelle.
- **Copertura giocata**: i quattordici percorsi e ogni pulsante offerto a ogni passo (§3.2): nessuna
  riga resta senza modello, nessuna parola italiana arriva allo schermo.
- **La grammatica in inglese**: `collaudo/tipografia.mjs` con la lingua inglese, sugli stessi percorsi.
- **L’eseguibile**: la prova dei finali (`python strumenti/prova_eseguibile.py finali`) in inglese.
  Clicca i pulsanti per il comando che mandano (`data-comando`), che non ha lingua, e in più controlla
  che a schermo non compaia italiano.
- **Una persona**: la partita di un madrelingua che non conosce il gioco.

---

## 7. Come si farebbe

1. **Gli strumenti**: l’estrattore del catalogo dai `.fav`; il censimento delle formule, allargato a
   ogni pulsante; l’elenco delle stringhe dell’interfaccia.
2. **L’app a due lingue**: le tabelle `it` e `en`, le date e i numeri per lingua, l’opzione «Lingua»
   (alla prima apertura quella del sistema, poi si cambia quando si vuole, anche a metà partita).
3. **Il traduttore a valle**: il confronto con i modelli, le formule, i nomi, il comando ripetuto in
   inglese, la grammatica inglese, i suggerimenti per posizione.
4. **La traduzione**: guida, glossario, bozza, revisione, lettura nel gioco.
5. **I collaudi in inglese** (§6), e la partita del madrelingua.

Il punto 2 conviene cominciarlo presto, anche senza tradurre: ogni stringa che l’app aggiunge da qui in
poi (il suono, la rifinitura, i pacchetti) andrebbe scritta direttamente in tabella invece che nel
JSX, così non si accumula lavoro da rifare.

Il testo del gioco è congelato, quindi la traduzione dei `.fav` può partire in qualunque momento.
Quella dell’interfaccia conviene farla quando l’interfaccia è stabile, verso la fine (fasi 8 e 9).

Più avanti, una FAVELLA che dia a ogni testo un identificativo (la G1 del documento 19, che servirebbe
anche alla Santa Maria per le voci e le lingue) permetterebbe di togliere il confronto con i modelli:
il motore direbbe da sé quale testo ha detto e con quali rami. Per il Relitto non è necessario.

---

## 8. Le decisioni dell’autore

| # | Domanda | Proposta |
|---|---|---|
| D27 | In inglese il parser c’è? | **Deciso dall’autore**: no, solo pulsanti |
| D28 | Si fa l’inglese, e quando? | sì; da subito la regola delle stringhe in tabella (§7); il catalogo e la traduzione del testo quando l’autore vuole; l’inglese con la 1.0 o con una 1.1 |
| D29 | Chi traduce | bozza con Claude su guida e glossario, revisione completa di un madrelingua, partita letta nel gioco (§5) |
| D30 | Il titolo inglese | da scegliere: tradotto («The Silent Wreck») o lasciato in italiano come marchio |
| D31 | I nomi propri e i luoghi | William T. Eriksonn e la Santa Maria restano; per Magazzino Quattro, il Navarca, l’Anziano, il Sintonizzatore, L.V. decide l’autore nel glossario |
| D32 | Le etichette dei pulsanti | in italiano hanno l’articolo («la radio»); in inglese proporrei il nome nudo («radio»), come si usa nelle interfacce inglesi |
| D33 | La tipografia | quella inglese (virgolette alte al posto dei caporali) |
| D34 | Dove si sceglie la lingua | nelle opzioni, con quella del sistema alla prima apertura |
