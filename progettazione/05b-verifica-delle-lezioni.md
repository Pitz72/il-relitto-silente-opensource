# Le lezioni per FAVELLA, verificate sul motore

Versione 1.0, 15 ottobre 2026. Accompagna `05-lezioni-per-favella.md` (versione 1.2) e risponde a una
domanda: quanto varrebbe intervenire davvero sul motore, e dove.

Ogni lezione è stata controllata in due modi: sul sorgente del motore 1.4.4 (la copia in `motore/` è
identica, file per file, a quella del repository FAVELLA1) e con una storia-sonda di poche righe giocata
sul motore. I test del motore partono verdi (`test_linguaggio.py`: 1180 passati, 0 falliti). Né il motore
né il gioco sono stati modificati.

---

## 1. In breve

- **Diciotto lezioni su venti reggono come sono scritte.** Due vanno corrette: L8 vale solo per le regole
  `vai`, e nel Relitto produce un’incoerenza viva; il primo limite di L11 non è un limite del linguaggio
  ma un difetto dello scanner.
- **La verifica ha trovato tre difetti che il 05 non riporta** (N1–N3), e il ponte dell’app ne indica
  altri tre (N4–N6). Sono al §3.
- **Intervenire conviene, ma non tutto allo stesso modo.** Le proposte stanno in cinque pacchetti, con
  costi e rischi molto diversi (§4):

| Pacchetto | Che cosa | Frasi nuove | Rischio | Costo | Per chi |
|---|---|---|---|---|---|
| A. Correzioni (1.4.5) | L18, L19, N1, N2, N3, avvisi di L3 e L4 | nessuna | basso | una sessione | ogni autore, subito |
| B. Strumenti e ospiti | L15, i fatti di L20, N4 | nessuna | nullo per la grammatica | una o due sessioni | autori, Studio, sito, app |
| C. Linguaggio (1.5) | L1 con L17, L6, L8 con L9, L12, L13, L14, L10, L5, N6, L16, L7 | sì, compatibili | medio (grammatica LALR) | da tre a cinque sessioni | ogni autore |
| D. Semantica che cambia | i fronti di L2, la chiusura del dialogo di L11 | no | medio: le storie scritte possono cambiare | una sessione più le prove | ogni autore |
| E. Da rinviare | le descrizioni di L2, le etichette di L11, N5 | | | | FAVELLA 2 |

La raccomandazione è al §5. In una riga: il pacchetto A va fatto comunque; per il C la domanda vera è se
il Relitto debba essere la vetrina della 1.5.

---

## 2. Le lezioni, una per una

Per ogni lezione: se regge, dove sta nel codice, che cosa cambia nella proposta, quanto costa. «Piccolo»
vuol dire poche ore e un test; «medio» una sessione, con la grammatica toccata; «grande» più sessioni,
con il motore e gli strumenti (collaudo, Studio, sito).

### L1. Vincoli trasversali: confermata. Valore alto, costo medio

Sonda: una regola `Invece di sintonizza qualcosa se l'aria è meno di 30` perde contro `Invece di
sintonizza le piante`; una `Prima di` per categoria scatta ma lascia passare l’azione, che consuma l’aria
lo stesso. La precedenza è in `_cerca_regola` (`gioco.py:1197`): oggetti precisi, poi categorie, poi
regole globali. La `Prima di` è a `gioco.py:1560`.

Sulla proposta: la «`Prima di` che ferma» basta solo se il motore cerca **tutte** le regole che fermano,
prima della precedenza e nell’ordine in cui sono scritte. Con la precedenza di oggi una `Prima di`
scritta su un oggetto nasconderebbe quella per categoria, perché per ogni comando ne scatta una sola. La
forma può essere una coda della regola:

```
Prima di sintonizza qualcosa se il rosso: dire "PROTEZIONE VITALE…" e basta.
```

Vale per ogni gioco con un divieto generale: il buio, le mani piene, l’acqua, una ferita. Inform 7 lo fa
con le regole `check`. Nel Relitto, 44 regole diventano tre (i testi «PROTEZIONE VITALE» sono 24, le
condizioni «l’aria è meno di 30» 25).

### L2. Demoni e ordine dei moduli: confermata, ma la proposta va cambiata. Costo medio, rischio medio

Sonda: aria da 64, una soglia `Quando l'aria è al massimo 60` dichiarata prima di due consumi da 4.
L’aria scende sotto 60 nel primo turno; la soglia scatta nel secondo e dice 56, quando a fine turno l’aria
è già 48. È C4. I demoni si valutano in un passaggio solo, nell’ordine di dichiarazione, e la memoria del
fronte si aggiorna durante il passaggio (`_processa_demoni`, `gioco.py:539`).

Le due passate del 05 (prima gli `Ogni turno`, poi i `Quando`) non bastano: nel Relitto l’aria la tolgono
anche demoni `Quando` (il primo contatto, la connessione). La regola giusta è un’altra: **un fronte vede
lo stato di fine turno.** Dopo il passaggio di oggi si rivalutano i `Quando` che non sono scattati,
finché nessuno scatta più; ogni demone scatta al più una volta per turno, quindi niente cicli. Nelle
storie già scritte alcuni demoni scatterebbero un turno prima: è il pacchetto D, con la prova sulle storie
ufficiali.

La seconda metà (vince la descrizione più specifica) è un cambio di significato grande e difficile da
definire: meglio non farlo. Le condizioni con un nome (L17) tolgono quasi tutto il bisogno.

### L3. Oggetti in inventario non prendibili: confermata. Costo piccolo

Sonda: `stacca il risuonatore`, `lascia il risuonatore`, `prendi il risuonatore`: «Non puoi prenderlo.».
Un avviso del linter costa poco e non cambia nessuna storia. L’alternativa (`è in inventario` rende
prendibile) cambia il significato di frasi già scritte, quindi meglio l’avviso. La prova di ripresa di L15
l’avrebbe trovato comunque.

### L4. Stati scritti e mai letti: confermata. Costo piccolo

`_lint_variabili_inutilizzate` (`compilatore.py:3108`) conta una scrittura come un uso. Basta dividere
le letture (condizioni, segnaposto, sorgente di una copia, quantità) dalle scritture. Due cautele. Uno
stato che legge solo l’interfaccia (l’aria del visore, gli stati del suono) avrebbe l’avviso: serve un
modo per dire che è voluto, come `(voluto)` per i sinonimi. E prima va corretto N3, altrimenti gli
avvisi falsi si moltiplicano.

### L5. Il tempo della consultazione: confermata. Costo da piccolo a medio

Sonda: `guarda`, `esamina` e `inventario` fanno passare un turno ciascuno; parlare e AIUTO no. Il turno
libero vale solo per gli errori del parser e per AIUTO (`gioco.py:471`, `gioco.py:1608`). Anche Inform fa
passare il tempo a chi guarda: l’impostazione di oggi è difendibile, e la dichiarazione d’autore è la
forma giusta.

Una trappola per chi la implementa: nel Relitto `esamina il visore` è una regola dell’autore, e dalla
1.4.3 ogni regola scattata fa passare il turno (`_regola_scattata`). La frase nuova deve lasciare libere
anche le regole di consultazione senza conseguenze, altrimenti il visore continua a costare aria.

### L6. «La prima volta»: confermata. Valore alto, costo medio

La memoria non può stare nella regola: le regole sono fra i campi statici, fuori dalle istantanee
(`_CAMPI_STATICI`, `strutture.py:1218`). Serve un insieme sul mondo che entri in ANNULLA, nei
salvataggi e nell’impronta. Da decidere che cosa conta: la prima volta che la regola scatta (semplice e
prevedibile, la consiglio) o la prima volta che il giocatore fa l’azione. Sui demoni, `Quando … per la
prima volta` vuol dire «una volta sola». Inform 7 ha la stessa forma. Nel Relitto: nove stati di guardia,
e C6.

### L7. Uscite condizionali: confermata. Costo medio-grande

Oggi la frase proposta non dà errore: crea una stanza che si chiama «gola se la fuga è iniziata», con un
avviso. La condizione tocca lo scanner della prima passata, il movimento, l’elenco delle uscite, i
pulsanti, il linter e il collaudo statico (la raggiungibilità), la mappa di Studio. È utile a tutti, le
porte sono ovunque, ma è la proposta più cara della lista. Nel Relitto: 17 regole `Invece di vai`, e C8.

### L8. Spostare il giocatore: da correggere, e il problema è più serio

Il motore **mostra** la stanza d’arrivo dopo una regola su un oggetto (`_applica_regola`,
`gioco.py:1302`) e **non** la mostra dopo una regola `Invece di vai`, per scelta della specifica (§22.7),
né dopo un demone, un evento o un’opzione di dialogo.

Nel Relitto le due regole della discesa (`fuga.fav:34` e `fuga.fav:35`) hanno lo stesso testo e la
stessa destinazione, ma `vai giù` è una regola `vai` ed `entra il buio` una regola su un oggetto.
Riprodotte in una sonda: con `giù` si legge il testo e basta; con `entra il buio` si legge il testo, poi
la gola descritta una seconda volta, e la gola risulta vista. Due strade per lo stesso posto, due partite
diverse.

La proposta del 05 resta giusta, con una cautela: `è in` non va cambiato, perché molte storie contano
sulla stanza mostrata dopo una regola su un oggetto. Servono due forme esplicite accanto a quella di
oggi: una che mostra sempre (`il giocatore va in X`; «il giocatore» non è un’entità, e la frase dei
personaggi `ENTITA va in` non entra in conflitto) e una che tace sempre. Costo piccolo.

### L9. I segnaposto leggono il valore di prima: confermata. Costo piccolo-medio

Sonda: `usa la cella` (+20) dice «Aria: 50.». La risposta si scrive prima delle conseguenze
(`gioco.py:1294-1298`), e così nei demoni e negli eventi. Al posto di `[aria dopo]` propongo una coda
della regola, `e poi dire "…"`, scritta dopo le conseguenze: vale per ogni segnaposto, dopo uno
spostamento come dopo un contatore, e si legge come italiano.

### L10. Testi riusabili, regole su più verbi: confermata. Costo piccolo-medio

`o` è l’abbreviazione di ovest, quindi la forma possibile è `Invece di usa oppure accendi il faro`. Si
può fare nel compilatore, una regola per verbo, senza toccare il motore. Per i testi con un nome si può
riusare l’interpolazione che c’è già: un testo dichiarato una volta e richiamato con `[presa di
servizio]` dentro qualunque stringa. Nel Relitto: 62 copie di 32 testi.

### L11. Dialoghi: tre punti, tre verdetti

1. **«Le opzioni non accettano `collega`» è un difetto, non un limite** (N1). La frase di un’opzione non
   ha i due punti, e lo scanner della prima passata (`compilatore.py:285-288`) la prende per la
   dichiarazione di un collegamento: l’errore è «nome non valido», alla riga 1. Si corregge in poche
   righe.
2. **I demoni non scattano alla chiusura del dialogo: confermata.** `elabora_comando` esce prima del
   turno quando il dialogo si chiude (`gioco.py:731-739`): nella sonda la voce arriva solo dopo
   `aspetta`. Valutare i soli fronti `Quando` alla chiusura (senza turno e senza eventi a tempo) costa
   poco, ma cambia le storie scritte: pacchetto D. L’aggancio `Al termine del dialogo con X:` è una
   frase nuova, di costo medio.
3. **Etichette globali: confermata**, ma dalla 1.2.2 un avviso le protegge. Valore basso: da rinviare.

### L12. Lessico: confermata. Costo minimo

`si chiamano anche` e l’elenco su una riga sono due ritocchi alla grammatica, senza rischio. Nel Relitto,
219 righe. È la vittoria più facile della lista.

### L13. Tipografia: confermata. Valore alto per un motore della prosa, costo piccolo-medio

Sonda: «“ATTENZIONE”» dentro una stringa rompe la sintassi; «po’» esce con l’apostrofo dritto, `po'`. `normalizza_tipografia`
(`favella_utils.py:522`) passa su tutto il sorgente, stringhe comprese. Basta normalizzare fuori dalle
stringhe e conservare dentro `’ “ ”` (nei segnaposto i nomi vanno ancora normalizzati). Da controllare il
serializzatore di Studio, che riscrive i `.fav`. Oggi l’app rifà gli apostrofi a schermo (`tipografico()`
nella grammatica tipografica); il terminale e il sito non possono.

### L14. `[se]` annidati: confermata, ed è peggio (N2). Costo piccolo-medio

Non c’è errore: il riconoscimento è un’espressione regolare non avida (`favella_utils.py:86-87`) e il
giocatore legge pezzi di codice. Sonda, con tutte e due le condizioni vere: «Plancia. Trema.[se la tuta è
vestita] Sei protetto. Fine blocco.[fine]». Un analizzatore a pila risolve l’annidamento; anche senza,
il compilatore deve rifiutare i marcatori sbilanciati.

### L15. Strumenti di collaudo: confermata. Valore alto, costo medio, nessun rischio per la grammatica

La riga di comando non ha `trascrivi`; il collaudo non ha attese né tracce. I prototipi del Relitto sono
pronti da portare (`collaudo/regressioni.py`, 163 righe; `collaudo/trascrivi.py`, 77). È la proposta con
la prova più forte: la ripresa ha trovato C1, che i percorsi e le partite a caso non vedevano.

### L16. Il finale dopo la stanza: confermata, ma c’è già una strada

Sonda: entrando nella stiva, prima «Puoi vedere qui: un kit.» e le uscite, poi il finale. Una regola
`Invece di vai` (o su un oggetto) che chiude la partita invece non stampa la stanza, perché la fine si
controlla prima (`gioco.py:1300`). Il Relitto ha usato un demone per avere più ingressi. Adesso basta una
riga nel manuale; più avanti, `Quando il giocatore entra in X`, prima della descrizione, utile anche per
gli arrivi in genere. Costo medio.

### L17. Condizioni con un nome: confermata. Valore alto, costo medio

Il nome va raccolto nella prima passata come gli stati; la condizione va valutata per riferimento, con il
controllo dei cicli; deve valere nei `se` e nei `[se]`, e il linter la deve vedere. Va con L1: insieme
portano la protezione vitale da più di venti regole a una, e tolgono la classe di errori di C10. Nel
Relitto «e la fuga è lontana» è scritto 46 volte.

### L18. Il punto di partenza dei salvataggi: confermata, e vale anche fuori dall’app. Costo minimo

Il terminale fa la stessa sequenza (`gioca()`, `gioco.py:2222-2229`). In una storia con «Le uscite
nominano solo le stanze visitate», un salvataggio fatto dopo la prima stanza si carica con il messaggio
«non è identica a quella salvata: la storia è cambiata dopo il salvataggio», che è falso, e la stanza di
partenza perde il nome nelle uscite («Uscite: Est, Sud.»). Fra le storie che ho trovato quella frase la
usa solo il Relitto, ma la frase è pubblica. La correzione è una riga: in `imposta_posizione_iniziale`
(`strutture.py:1300`) la stanza di partenza entra fra le viste prima dell’istantanea.

### L19. Caricare segna la stanza come vista: confermata. Costo piccolo

Sonda: dopo il caricamento in una stanza raggiunta in silenzio, la stanza risulta vista. Dopo CARICA,
`_gestisci_carica` (`gioco.py:1052-1057`) mostra la stanza, e mostrarla la segna; basta mostrarla senza
segnarla.

### L20. I pulsanti senza filtro: confermata, con una tensione di progetto

La specifica (§23.2, criterio 1) dice che i pulsanti filtrano solo con ciò che il giocatore sa già, mai
con ciò che scoprirebbe provando. Mostrare solo i verbi con una regola d’autore è un suggerimento:
«Stacca» su una cosa sola dice che lì c’è qualcosa. L’app l’ha scelto apposta, e a soli pulsanti ha
ragione, ma il motore non deve deciderlo da sé. Due passi: `pulsanti()` dà i fatti (i verbi con una
regola, i loro effetti), che oggi il ponte ricava in una trentina di righe (`_indicizza`); poi una frase
d’autore sceglie il filtro. La pagina esportata e le cassette del sito ne guadagnerebbero subito. Costo
piccolo il primo passo, medio il secondo.

---

## 3. Reperti nuovi

### 3.1 Difetti del motore trovati dalla verifica

| # | Difetto | Sonda | Correzione | Costo |
|---|---|---|---|---|
| N1 | Un’opzione di dialogo con `collega` non compila: lo scanner la prende per un collegamento, e l’errore dice «nome non valido» alla riga 1 | `Al nodo "addio" l'opzione "Vado." chiude il dialogo e adesso la sala collega est a la gola.` | lo scanner salta le frasi che cominciano con «Al nodo» | piccolo |
| N2 | `[se]` annidati o sbilanciati: nessun errore, e il giocatore legge «[se …]» e «[fine]» | L14 | errore di compilazione, poi l’annidamento | piccolo-medio |
| N3 | Uno stato letto solo dentro un `[se]` risulta «dichiarato ma mai usato» | `La descrizione della plancia è "Plancia.[se la fuga è vicina] Trema.[fine]".` | il linter conta le condizioni dei testi | piccolo |

### 3.2 Che cosa dice il ponte dell’app

Il ponte è il primo ospite del motore scritto fuori dal motore, e dove fatica dice che cosa manca a un
ospite.

**N4. Manca un’interfaccia pubblica per gli ospiti.** Per provare un comando su un ramo, il ponte copia
sedici campi privati di sessione (`_SESSIONE`, `app/src/motore/ponte.py:851`), importa `_mostra_nodo`,
fissa a mano `_stato_iniziale` e `_impronta_iniziale` (`ponte.py:120`). Ogni ospite (terminale,
playground, pagina esportata, Studio, sito, l’app) riscrive la stessa apertura: il seme, l’intestazione,
la prima stanza. L18 nasce lì. E se il motore aggiunge un campo di sessione, il ponte si rompe in
silenzio. Proposta: poche funzioni pubbliche (`nuova_partita`, `prova` su un ramo disfatto,
`mostra_situazione`), con un test che controlla che il ramo copra ogni campo. Costo medio, nessuna frase
nuova: pacchetto B.

**N5. Il testo non dice che cos’è.** La grammatica tipografica dell’app ricostruisce da sé più di dodici
generi di testo (la voce del relitto, la registrazione, la lettura dello scanner, lo schermo, l’etichetta,
la matrice, lo stampo, il graffio, il suggerimento), con 459 righe di riconoscimento, 184 per i
suggerimenti, un lessico delle maiuscole e un collaudo su 1.131 stringhe. L’autore sapeva il genere di
ogni testo mentre lo scriveva. Una marcatura leggera dentro le stringhe, che il terminale ignora e gli
eventi portano come segmenti, lo direbbe una volta sola. Il caso più utile è il suggerimento: `[comando
analizza lo scafo]` si stamperebbe «ANALIZZA lo scafo» nel terminale e diventerebbe un pulsante dove ci
sono i pulsanti. Costo grande: è materia da FAVELLA 2.

**N6. I segni del caso non lasciano traccia.** Un esito di `càpita` non cambia lo stato: per far sentire
il gemito della nave il ponte riconosce cinque testi dal loro inizio, l’unica eccezione alla regola di non
leggere il testo. Una conseguenza `segnala "gemito"`, che manda soltanto un evento all’ospite e nel
terminale tace, costa poco ed è utile a ogni interfaccia con suono o immagini. Pacchetto C.

---

## 4. I pacchetti

**A. Correzioni, una 1.4.5.** L18, L19, N1, N2 (almeno l’errore di compilazione), N3, gli avvisi di L3 e
L4. Nessuna frase nuova, e il manuale non cambia: si aggiornano la specifica, il registro delle modifiche
e le copie del motore (sito, Studio, PyPI, `motore/` del Relitto). Il ponte del Relitto può togliere due
rimedi (`12-fase-2-ponte-e-modello.md`, §6.2).

**B. Strumenti e ospiti.** L15 (trascrivi, traccia, attese, prova di ripresa), N4 (l’interfaccia
pubblica), il primo passo di L20 (i fatti nei pulsanti). Può uscire con la 1.4.5 o con la 1.5: non tocca
la grammatica.

**C. Linguaggio, una 1.5.** In ordine di valore sul costo: L12; L1 con L17; L6; L8 con L9; L13; L14;
L10; L5; N6; L16; L7. Ogni frase nuova deve restare LALR(1) senza ambiguità (la guardia della suite lo
controlla) e non cambiare il significato delle frasi di oggi. Tocca il manuale: capitoli nuovi, quindi
una quarta edizione del libro.

**D. Semantica che cambia.** I fronti a fine turno (L2) e alla chiusura del dialogo (L11). Prima di
farli: giocare i percorsi di tutte le storie ufficiali con il motore vecchio e con il nuovo, e
confrontare l’impronta a ogni passo. Se qualcosa cambia si decide storia per storia, oppure si accendono
con una frase d’autore.

**E. Da rinviare.** Le descrizioni «più specifiche» (L2), le etichette per personaggio (L11), la
marcatura dei testi (N5), il filtro dei pulsanti come comportamento predefinito (L20).

---

## 5. Raccomandazione

1. **Il pacchetto A conviene comunque, e subito.** Sono difetti che colpiscono ogni autore, non solo il
   Relitto: un salvataggio che si dichiara «diverso» per una storia che non è cambiata, codice che arriva
   al giocatore, un errore che manda alla riga sbagliata. Non aggiunge frasi, quindi non contraddice il
   linguaggio chiuso della 1.4.
2. **Il pacchetto C è l’intervento vero, e vale la pena.** Le lezioni con più valore (L1, L6, L17, L10,
   L12) non sono manie del Relitto: sono forme che i sistemi maturi di narrativa interattiva hanno da
   tempo, e i loro costi nel Relitto (44 regole per tre vincoli, nove stati di guardia, 46 ripetizioni di
   una condizione, 219 righe di nomi) li pagherebbe chiunque scriva una storia grande. La domanda è di
   tempi. Il Relitto è nato per essere la demo che usa tutto il linguaggio: se deve essere la vetrina
   della 1.5, il pacchetto C va fatto prima che i suoi `.fav` si chiudano, e poi si riscrivono le parti
   che ne guadagnano (il §6 dice quali). Conviene raccogliere tutte le frasi nuove in una versione sola,
   per non rifare il libro due volte: la terza edizione è appena andata in stampa.
3. **Il pacchetto D solo con la prova sulle storie ufficiali**, perché cambia il comportamento di frasi
   già scritte.
4. **Una cosa da correggere nel Relitto già oggi**, motore o no: le due discese nella gola del ritorno
   (L8). `entra il buio` mostra la gola due volte e la segna come vista; `vai giù` no.

---

## 6. Che cosa cambierebbe nel Relitto

| Lezione | Oggi nel Relitto | Con l’intervento |
|---|---|---|
| L1, L17 | 24 testi «PROTEZIONE VITALE», 25 condizioni sull’aria, 46 «e la fuga è lontana» | tre vincoli e una condizione con un nome |
| L2 | l’ordine degli `Includi` è logica del gioco (`aria.fav` penultimo) | l’ordine torna libero |
| L6 | nove stati di guardia | `per la prima volta` |
| L7 | 17 regole `Invece di vai` che fanno da porte, uscite dinamiche aperte a mano | collegamenti con condizione |
| L8, L9 | descrizioni copiate nei testi, «la cifra scende» senza dire dove | `va in`, `e poi dire` |
| L10 | 62 copie di 32 testi | testi con un nome, regole su più verbi |
| L12 | 219 righe `si chiama anche` | una riga per cosa |
| L13 | apostrofi dritti nei `.fav`, rifatti a schermo dall’app | la tipografia nei `.fav` |
| L18, L19, N4 | due rimedi nel ponte, sedici campi privati copiati | funzioni pubbliche del motore |
| L20 | il ponte ricava i verbi dalle strutture interne | `pulsanti()` dà i fatti |
| N6 | cinque segni riconosciuti dal testo | `segnala` |

---

## Appendice: tre sonde

Le altre sono descritte nel testo, con il comando e la risposta. Si giocano con `python motore/favella.py
gioca`.

La soglia in ritardo (L2): `aspetta` tre volte; la soglia scatta al secondo turno e dice 56.

```
La plancia è una stanza.
La descrizione della plancia è "Plancia.".
L'aria è un contatore.
L'aria parte da 64.
Quando l'aria è al massimo 60: dire "La cifra passa all'ambra: [aria].".
Ogni turno se l'aria è più di 0: diminuisci l'aria di 4.
Ogni turno se l'aria è più di 0: diminuisci l'aria di 4.
```

Le due discese (L8): `giù` non mostra la gola; `entra il buio` la mostra e la segna come vista.

```
Il santuario è una stanza.
La descrizione del santuario è "Santuario.".
La gola è una stanza.
La descrizione della gola è "La gola, ripida e nera.".
Il buio è una cosa.
Il buio è nel santuario.
Il buio è di scena.
"entra" è un comando.
Il giocatore comincia nel santuario.
Le uscite nominano solo le stanze visitate.
Invece di vai giù: dire "Ti cali nella gola." e adesso il giocatore è nella gola.
Invece di entra il buio: dire "Ti cali nella gola." e adesso il giocatore è nella gola.
```

Il salvataggio «diverso» (L18): `ovest`, `salva`, poi `carica`. Il motore dice che la storia è cambiata, e
le uscite della stiva non nominano più la plancia.

```
La plancia è una stanza.
La descrizione della plancia è "Plancia.".
La stiva è una stanza.
La descrizione della stiva è "Stiva.".
La plancia collega ovest a la stiva.
Il giocatore comincia nella plancia.
Le uscite nominano solo le stanze visitate.
```
