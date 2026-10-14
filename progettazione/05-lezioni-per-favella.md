# Cosa ha insegnato Il Relitto sul motore FAVELLA 1

Versione 1.1, 14 ottobre 2026. Motore 1.4.4, non modificato. La 1.1 aggiunge quello che le correzioni
della revisione (`04-revisione.md`, §5) hanno confermato, e la lezione L17.

FAVELLA 1 è chiuso alla 1.4.4. Queste note servono a una versione futura (una 1.5, o FAVELLA 2).
Il Relitto è il banco di prova più duro che il motore abbia avuto finora: quattordici moduli,
362 regole «Invece di», una risorsa che cala a ogni turno, tre dialoghi, sei finali. Ogni lezione
nasce da un punto preciso del gioco e dice quanto è costata, cosa propone, con che priorità.

Ogni affermazione sul motore è stata controllata sulla specifica (`motore/documentazione/
grammatica-1.4.0.md`) o con una storia di prova. Dove il motore sapeva già fare una cosa e il
gioco non l’ha usata, la nota lo dice: lì manca la documentazione, non il motore.

---

## In sintesi

| # | Lezione | Costo nel Relitto | Priorità |
|---|---|---|---|
| L1 | Mancano i vincoli trasversali | 44 regole ripetute | **Alta** |
| L2 | I demoni dipendono dall’ordine dei moduli | un bug (soglie in ritardo), una regola d’ordine da ricordare | **Alta** |
| L3 | Un oggetto messo in inventario da una regola non si riprende | un bug grave (C1) | **Alta**, costa poco |
| L4 | Il linter non vede gli stati scritti e mai letti | lo stesso difetto due volte (A2 nell’originale, C9 nel remake) | **Alta**, costa poco |
| L5 | Anche guardare costa un turno | nella fuga, leggere l’aria costa quattro punti d’aria | Media |
| L6 | Manca «la prima volta» | nove stati di guardia, tre testi sbagliati | Media |
| L7 | Mancano le uscite condizionali dichiarate | 16 regole di sbarramento, un’uscita chiusa che si vede | Media |
| L8 | Spostare il giocatore non mostra la stanza | descrizioni copiate nel testo delle regole | Media |
| L9 | I segnaposto leggono il valore di prima | testi che non possono dire la cifra giusta | Media |
| L10 | Mancano testi riusabili e regole su più verbi | 62 copie di 32 testi, 9.500 caratteri | Media |
| L11 | I dialoghi sono un mondo a parte | il congedo dell’Anziano costruito intorno a tre limiti | Media |
| L12 | Il lessico: «si chiama anche», un nome per riga | 217 righe, sgrammaticate con i plurali | Bassa |
| L13 | La tipografia italiana non passa intatta | apostrofi tipografici persi, virgolette doppie vietate | Bassa |
| L14 | Niente `[se]` annidati | «Vivi» e «La prima nota» quasi copie | Bassa |
| L15 | Gli strumenti di collaudo non bastano per le risorse | invarianti verificati a mano, due bug sfuggiti | **Alta** |
| L16 | Il finale arriva dopo la descrizione della stanza | l’elenco «Puoi vedere qui» prima del risveglio | Bassa |
| L17 | Mancano le condizioni con un nome | la stessa soglia scritta in due modi, un bug (C10) | Media |

---

## Le lezioni

### L1. Vincoli trasversali

**Nel Relitto.** La protezione vitale («sotto il 30% non si ascolta e non si traduce») è una
regola sola nel progetto e 21 regole nel codice, una per àncora e per testo. Lo stesso per «ti
serve il Sintonizzatore» (12) e «il risuonatore copre le voci» (11): 44 regole che dicono tre
cose. Ogni eco nuova ne chiede altre tre, e dimenticarne una è un bug.

**Perché.** Una regola su un oggetto preciso vince sempre su una regola per categoria (`qualcosa`,
`qualcosa di P`) o globale (§22.7). `Prima di` scatta e poi lascia proseguire l’azione: non può
fermarla. Un vincolo che vale per tutti gli oggetti quindi non si può scrivere una volta sola.

**Proposta.** Una precedenza esplicita per i vincoli, che vengono prima delle regole sugli
oggetti. Per esempio:

```
Prima di tutto, invece di sintonizza qualcosa se l'aria è meno di 30 e la fuga è lontana: dire "PROTEZIONE VITALE…".
```

Oppure una `Prima di` che può chiudere l’azione (`… e basta`).

### L2. I demoni e l’ordine dei moduli

**Nel Relitto.** Le soglie dell’aria (`Quando l'aria è al massimo 60 diventa vera`) vedono solo i
consumi dichiarati prima di loro. Quelli dei moduli successivi (il groviglio, il primo contatto)
le fanno scattare un turno dopo, con la cifra sbagliata (revisione, C4). Fra le descrizioni
condizionali e fra le regole vince la prima dichiarata: per questo ogni variante dei moduli che
precedono `fuga.fav` porta «e la fuga è lontana», e l’ordine degli `Includi` in `relitto.fav` è
diventato parte della logica del gioco.

**Proposta.**
- Demoni in due passate: prima tutti gli `Ogni turno` (gli effetti), poi tutti i `Quando` (i
  fronti), qualunque sia il modulo. Un fronte vede lo stato di fine turno.
- Fra le descrizioni condizionali, vince la più specifica (più condizioni), oppure una priorità
  dichiarabile. Il linter segnala due varianti che possono essere vere insieme.

**Nel gioco, dopo la revisione.** La correzione è stata spostare `aria.fav` in fondo alla lista
degli `Includi`. Ha funzionato, e conferma la lezione: l’ordine dei moduli è semantica, e niente
nel codice lo dice se non un commento.

### L3. Oggetti che entrano in inventario senza essere prendibili

**Nel Relitto.** Il risuonatore non è prendibile: lo si stacca con una regola che lo mette in
inventario. Una volta posato, il motore risponde «Non puoi prenderlo.» (revisione, C1). Le partite
a caso dell’esploratore non l’hanno trovato.

**Proposta.** Il linter avverte: «X può finire in inventario (regola …) ma non è prendibile: se
il giocatore lo lascia, non potrà riprenderlo». In alternativa `adesso X è in inventario` rende
X prendibile. (Il `prendibile` dinamico esiste già dalla 1.3: la correzione nel gioco è stata una
conseguenza, `e adesso il risuonatore è prendibile`.)

### L4. Stati scritti e mai letti

**Nel Relitto.** L’audit dell’originale aveva trovato due contatori che crescevano senza lettori
(`echi`, `risonanze`, A2). Il remake li ha corretti a metà: `gli echi` riceve ancora dodici
scritture e nessuna lettura, e `l'ultima voce` si scrive e non si legge (C9). Lo stesso difetto,
due volte, nello stesso gioco.

**Proposta.** Il linter elenca ogni stato e contatore che nessuna condizione e nessun segnaposto
legge. Costa poco, perché il linter conta già le proprietà assegnate da tutte le conseguenze
(§22.8).

### L5. Il tempo dei comandi di consultazione

**Nel Relitto.** `guarda`, `inventario` ed `esamina` fanno passare un turno (verificato: +1
ciascuno). Nella fuga ogni turno costa quattro punti d’aria: `esamina il visore` toglie aria per
dire quanta ne resta. Con il risuonatore addosso, controllare l’inventario costa un punto. Oggi
sono liberi solo i comandi non capiti e AIUTO (§22.1). Parlare con un personaggio, invece, non
consuma turni: lo si scopre giocando, e la specifica lo dice solo di passaggio (§19, a proposito
di `ancora`).

**Proposta.** Una dichiarazione d’autore: `"inventario" non fa passare il tempo.`, oppure una
frase per tutta la storia: `La consultazione non fa passare il tempo.` (guarda, esamina,
inventario, uscite). E una riga sulla specifica per il tempo dei dialoghi.

### L6. «La prima volta»

**Nel Relitto.** Nove stati nascono come guardia di un evento che deve succedere una volta sola
(alcuni poi servono anche altrove): il contatto, la connessione, la datazione, il solco, il
ritrovamento, il registro sfogliato, l’avviso, la voce dei nomi, lo specchio. I demoni `Quando` riscattano a ogni fronte (§6), e ogni evento una tantum va
sorvegliato a mano. Dove la guardia manca, il testo della prima presa torna a ogni presa (C6).

**Proposta.** Una condizione nativa, su regole e demoni:

```
Invece di prendi il disco per la prima volta: …
Quando il giocatore entra per la prima volta nella serra morente: …
```

### L7. Uscite condizionali

**Nel Relitto.** Sedici regole `Invece di vai` fanno da porte: la Grande Porta, la porta tonda,
il nodo di fibre, il boccaporto, la camera. Un’uscita sbarrata da una regola resta nell’elenco
delle uscite: la sala delle teche mostra «Est» per tutta la partita, chiusa fino alla fuga (C8).
Le uscite dinamiche (`adesso … collega`) ci sono e risolvono, ma vanno aperte e chiuse a mano.

**Proposta.** Un collegamento con condizione, che sbarra e nasconde insieme:

```
La sala delle teche collega est a la gola del ritorno se la fuga è iniziata.
```

con un testo facoltativo per chi prova a passare quando è chiuso.

### L8. Spostare il giocatore senza mostrare dove

**Nel Relitto.** `adesso il giocatore è in X` dentro una regola non stampa la stanza d’arrivo.
L’autore deve scriverla nel testo della regola: la discesa nella gola del ritorno ripete la
descrizione della stanza, e due regole (`vai giù`, `entra il buio`) la ripetono due volte.

**Proposta.** Due verbi distinti: `adesso il giocatore va in X` (mostra la stanza) e
`adesso il giocatore è in X` (silenzioso, come oggi).

### L9. Segnaposto e conseguenze

**Nel Relitto.** In una regola, `[aria]` mostra il valore di prima delle conseguenze. Per questo i
testi dei consumi dicono «la cifra scende» senza dire dove arriva, e `esamina il visore` mostra un
numero già vecchio a fine turno.

**Proposta.** `[aria dopo]`, o un’opzione che valuta i segnaposto dopo le conseguenze.

### L10. Testi riusabili, regole su più verbi

**Nel Relitto.** Trentadue testi lunghi compaiono più volte, 62 copie in tutto, circa 9.500
caratteri (il 4% del sorgente). Quasi sempre lo stesso gesto detto con verbi diversi: `accendi`,
`usa` e `lancia` il bengala; `ricarica`, `ricarica la tuta`, `usa la tuta sul generatore`;
`segui`, `tocca`, `costeggia`; `usa` e `metti` il disco. I sinonimi di verbo (§12) sono globali e
non aiutano quando due verbi della libreria vanno uniti per un oggetto solo.

**Proposta.**
- Regole su più verbi: `Invece di usa o accendi il faro di prua: …`.
- Testi con un nome: `Il testo «presa di servizio» è "…".` e poi `dire il testo «presa di
  servizio»`. Un testo corretto una volta è corretto ovunque.

### L11. Dialoghi

**Nel Relitto.** Tre limiti, tutti aggirati nel congedo dell’Anziano:
- le opzioni non accettano `collega`: il varco della fuga si apre da un demone;
- i demoni non scattano nel turno in cui un dialogo si chiude: l’ultima voce è diventata un nodo
  del dialogo invece di un evento;
- le etichette dei nodi valgono per tutta la storia: due personaggi non possono avere un nodo
  «domanda».

**Proposta.** Tutte le conseguenze anche nelle opzioni; un aggancio `Al termine del dialogo con
X: …`; etichette per personaggio.

### L12. Lessico

**Nel Relitto.** 217 righe `si chiama anche`, una per nome. Con i nomi plurali la frase diventa
«I ganci si chiama anche "casse"»: `si chiamano anche` non compila. Il resto della concordanza
invece funziona (`Le capsule sono una cosa.`, `Le capsule sono segnate.`: verificato su una storia
di prova), ma il gioco non l’ha usata e scrive «le capsule è segnata», «il generatore è svelata».

**Proposta.** `si chiamano anche`, e l’elenco in una riga: `si chiama anche "arnese", "matrice",
"macchina".` Nel manuale, un esempio di concordanza al plurale e al femminile, perché chi scrive
non lo dà per scontato.

### L13. Tipografia

**Nel Relitto.** Il compilatore trasforma gli apostrofi tipografici in dritti anche nel testo, e
le virgolette dritte chiudono la stringa: le virgolette doppie curve rompono la sintassi. Un
motore nato per la prosa italiana costringe a scrivere con la tipografia di una macchina da
scrivere.

**Proposta.** Conservare `’` nel testo; ammettere `“ ”` dentro le stringhe, o un delimitatore che
non si usa in prosa.

### L14. Varianti annidate

**Nel Relitto.** Niente `[se]` dentro un altro `[se]`. Le varianti che si incrociano diventano
testi interi duplicati: «La prima nota» ripete gran parte di «Vivi».

**Proposta.** Annidamento dei `[se]`, almeno su due livelli.

### L15. Strumenti di collaudo

**Nel Relitto.** Il collaudo dei finali dice se un finale si raggiunge, non con quanta aria. Gli
invarianti I1–I5 sono stati verificati leggendo i contatori a mano. Per leggere il gioco come lo
vede chi gioca è servito uno strumento scritto apposta (`collaudo/trascrivi.py`), e per la
revisione un altro che stampa l’aria dopo ogni comando. Due bug (C1, C3) sono sfuggiti sia ai
percorsi scritti sia alle partite a caso.

**Proposta.**
- `favella.py trascrivi`, nel motore.
- `--traccia aria`: il valore di una variabile dopo ogni comando.
- Asserzioni nei percorsi: `# verifica: l'aria è almeno 20`, controllate dal collaudo.
- Nell’esploratore, una prova di ripresa: per ogni oggetto che il giocatore può lasciare,
  lasciarlo e riprenderlo.

**Nel gioco, dopo la revisione.** `collaudo/regressioni.py` è un prototipo di queste proposte: legge
le attese scritte in testa ai percorsi (`# atteso: aria >= 20`, `# atteso: mai «…»`) e fa la prova
di ripresa usando le istantanee di ANNULLA (`cattura_stato`), così costa secondi e non minuti. Sulla
versione prima delle correzioni trova C1 da sola, anche in un percorso scritto per altro.

Un’altra cosa l’ha insegnata la revisione: **un invariante verificato da un percorso può reggersi su
un bug.** I3 («chi ascolta tutto non porta via il risuonatore») risultava vero perché si moriva
entrando in stiva (C3). Corretto il bug, il percorso vinceva. Le attese vanno scritte sul motivo
(«l’aria finisce sullo scafo»), non solo sull’esito («si perde»).

### L16. Il finale dopo la stanza

**Nel Relitto.** Entrando nella stiva per l’ultima volta, prima del risveglio il motore stampa la
descrizione della stanza, «Puoi vedere qui: un kit.» e le uscite. Il demone del finale scatta a
fine turno, dopo il movimento.

**Proposta.** Un demone che chiude la partita nel turno di un movimento sopprime la stampa della
stanza, oppure un aggancio `Quando il giocatore entra in X` che scatta prima della descrizione.

### L17. Condizioni con un nome

**Nel Relitto.** «Sotto il 30%, prima della fuga» è scritto più di venti volte: nelle regole come
`l'aria è meno di 30 e la fuga è lontana`, nella soglia come `l'aria è al massimo 30`. Le due forme
differiscono di un punto: con l’aria esattamente a 30 il visore diceva PROTEZIONE VITALE e la tuta
lasciava ascoltare (revisione, C10).

**Proposta.** Una condizione con un nome, dichiarata una volta e usata ovunque, anche nei `[se]`:

```
Il rosso è quando l'aria è meno di 30 e la fuga è lontana.
Invece di sintonizza le piante se il rosso: …
```

Va insieme a L1: con i vincoli trasversali e le condizioni con un nome, le regole della protezione
vitale, più di venti, diventano una.

---

## Cosa ha funzionato

Per equilibrio, le scelte del motore che il Relitto ha messo alla prova e che hanno retto:

- **I moduli** (`Includi`): quattordici file, uno per atto, senza attriti a parte l’ordine (L2).
- **`di scena`**: lo sfondo vive nella descrizione, l’essenziale lo elenca il motore. La regola di
  scrittura del gioco si è appoggiata tutta su questo.
- **Le uscite anonime** («Le uscite nominano solo le stanze visitate»): nessuna stanza svelata
  prima del tempo.
- **Le uscite dinamiche e il `prendibile` dinamico**: il varco che si richiude, il corridoio che
  crolla.
- **`càpita (N su M)`**: i segni della nave, rari e diversi.
- **Il collaudo dei finali e l’esploratore**: 6 finali su 6, nessuna eccezione in migliaia di
  comandi. Hanno i limiti di L15, ma senza di loro il remake non si sarebbe chiuso in un giorno.
- **I dialoghi fuori dal tempo**: per l’Anziano è la cosa giusta. Va solo scritto (L5).
