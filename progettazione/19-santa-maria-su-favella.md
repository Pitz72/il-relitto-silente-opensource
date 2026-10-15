# Il Mistero della Santa Maria su FAVELLA: ha senso, si può fare?

Versione 1.0, 15 ottobre 2026. Valutazione chiesta dall’autore: «Il Mistero della Santa Maria» è
virtualmente finito, ma è programmato da zero, senza un motore come FAVELLA, con i rischi del caso;
si potrebbe ricostruirlo su FAVELLA 1.5.0? Costi e risorse non contano: contano il senso e la
fattibilità.

È una valutazione, non un piano approvato. Sta fra i documenti del Relitto perché riguarda FAVELLA e
le sue lezioni (05, 16); nel progetto della Santa Maria non è stato toccato niente.

**Che cosa ho letto.** Della Santa Maria (`IlMisteroDellaSantaMaria/gioco`, v0.47.5, 644 commit,
ultimo il 1° settembre 2026): `CLAUDE.md`, `devdocs/STATO.md`, `DA_FARE.md`, `ROADMAP.md`, le
decisioni ratificate (`preproduzione/production/DecisioniRatificate.md`), i tipi del gioco
(`src/game/types.ts`, `src/game/dialogs/types.ts`), la logica (`gameLogic.ts`, `microEvents.ts`), una
schermata intera (`S_01_plancia.ts`) e la parte di `GameShell.tsx` che governa trasmissioni, beat e
diario; i conteggi vengono da script sui sorgenti. Di FAVELLA: la grammatica 1.5.0, `gioco.py`,
`libreria_azioni.py`, e i documenti 05 e 16 di questo progetto.

---

## 1. In breve

**Si può fare: sì.** Quasi tutto quello che la Santa Maria fa ha già una forma in FAVELLA 1.5.0: le
schermate sono stanze, gli hotspot sono cose, i sei verbi sono azioni, i flag e i dati sono stati, le
varianti sono testi con `[se]`, i beat e le trasmissioni sono demoni. Il Relitto ha già dimostrato che
FAVELLA regge un’interfaccia grafica a pulsanti, con un ponte e un modello d’azione.

**Ma non con la 1.5.0 così com’è.** Mancano quattro cose che alla Santa Maria servono davvero (§6): un
identificativo per ogni testo (le 318 righe doppiate, e le lingue se restano nel piano); un dialogo
che parta da una regola o da un demone (le trasmissioni di Berg e di Akkaya); le catene di battute
senza scelta, anche del protagonista (91 nodi su 114); la libreria che non parli mai con la sua voce,
che è in seconda persona, dentro un gioco in prima persona e doppiato. Sono tutte cose generali: una
FAVELLA 1.6 che le avesse sarebbe migliore per qualunque storia.

**Ha senso: sì, a tre condizioni**, e per una ragione diversa da quella che sembra (§3). Il rischio
del «fatto da zero» la Santa Maria l’ha in gran parte già pagato; quello che resta sta in un punto
preciso, ed è proprio quello che FAVELLA toglierebbe. Le condizioni (§7): farlo **prima del
doppiaggio**, che è il prossimo anello della catena del progetto; lasciare **intatta l’interfaccia**
della Santa Maria e cambiare solo il cervello; dimostrare con una prova automatica che il gioco
ricostruito dice **le stesse righe, byte per byte e con gli stessi identificativi vocali**, del gioco
di oggi. Prima di tutto, un pilota piccolo con criteri di riuscita misurabili (§8).

**Non ha senso** se la priorità è far uscire la Santa Maria con le voci il prima possibile: il
rifacimento sposta il doppiaggio di mesi. E non ha senso farlo **dopo** il doppiaggio: le 318 clip
legate ai loro identificativi sono la cosa più costosa da rimettere in fila.

---

## 2. Che cos’è oggi la Santa Maria

| | |
|---|---|
| Genere | avventura grafica ibrida: immagini fisse 1920 × 1080 con hotspot, griglia di sei verbi alla LucasArts (GUARDA, PRENDI, USA, APRI, PARLA, DAI), testo in un pannello, dialoghi ad albero. Nessun game over |
| Tecnica | Electron 41, React 19, TypeScript, Zustand; regola aurea: l’interfaccia è 1:1 con il prototipo HTML |
| Mondo | 10 schermate, 58 hotspot, 9 oggetti d’inventario, 33 flag, 11 dati, un contatore narrativo (i giorni all’ispezione), 8 enigmi, 4 atti |
| Testo | circa 930 stringhe, 74.000 caratteri, 11.700 parole (misura sui sorgenti di `src/game/`); il Relitto, per confronto, ha 221.000 caratteri di `.fav` |
| Dialoghi | 114 nodi in quattro alberi (Yusuf 45, Akkaya 40, Berg 18, i terminali 11): 91 nodi passano al successivo senza scelta, 35 sono battute di William, 33 scelte valgono una volta sola |
| Voce | 318 identificativi vocali nel codice; il copione per la sala si genera dal codice (DEC-018, DEC-066). Le registrazioni non ci sono ancora |
| Lingue | nel piano sei (IT, EN, FR, ES, PT, DE), parlato solo in italiano; la localizzazione non è fatta, la revisione la prepara (DEC-042) |
| Stato | v0.47.5; revisione dei testi in dodici lotti chiusa; playtest sospesi fino alla fine (DEC-102); meta-finale tagliato (DEC-101); la prossima decisione è quando mandare il testo in rilettura integrale, da cui parte la catena che porta al doppiaggio (DEC-097). Novembre non è un vincolo duro (DEC-099) |

---

## 3. Dove sta il rischio del «fatto da zero»

Il motore scritto a mano è piccolo e ordinato. `processAction` (`gameLogic.ts`, 421 righe) è una
funzione deterministica su dati tipizzati: ogni schermata dichiara i suoi bersagli, ogni bersaglio i
suoi verbi, ogni risposta il suo testo (anche in funzione dello stato), i suoi effetti e il suo
identificativo vocale. Quarantasette versioni, verifiche da capo a fondo, una partita completista,
tre collaudi di revisione e una «sonda totale» hanno già consumato gran parte del rischio di quella
parte.

Il rischio che resta sta altrove: **una parte delle regole del gioco vive dentro gli effetti di React**
in `GameShell.tsx` (1.094 righe). Le trasmissioni automatiche di Berg e di Akkaya, con le loro
condizioni di tempo e di stato (righe 830–913), il beat che aspetta la chiusura della lettera (263,
609, 1.066), le note del diario agganciate alle trasmissioni (139, 366–417), l’applicazione degli
effetti (462–474), i micro-eventi al cambio di schermata. Sono regole del mondo che scattano quando
React ridisegna, e il loro ordine dipende dalle dipendenze degli effetti. Il progetto stesso registra
difetti nati qui: la trasmissione di Berg che arrivava insieme al segnale del Ricercatore, e
`bergSeen`, che non entrava nel salvataggio finché le trasmissioni viste non sono passate nello stato
del gioco (v0.7.7).

Nessuno strumento può esplorare questa parte da solo, perché senza l’interfaccia non gira: per questo
le verifiche della logica della Santa Maria sono partite giocate, a mano o dagli agenti in Electron.
Gli strumenti di `tools/verifica/` misurano il testo, non il comportamento.

---

## 4. Che cosa porterebbe FAVELLA

1. **Tutte le regole in un posto solo, separate dall’interfaccia.** Trasmissioni, beat, micro-eventi,
   varianti d’ingresso diventano demoni ed eventi del motore, valutati a fine turno in un ordine
   dichiarato (`I demoni guardano la fine del turno.`). L’interfaccia torna a fare l’interfaccia.
2. **Gli strumenti di collaudo del motore.** L’esploratore che percorre gli stati in cerca di vicoli
   ciechi, il collaudo dei finali, i percorsi con le attese, la traccia, le riprese, l’impronta della
   partita. Per un gioco senza game over e con la regola «nessun vicolo cieco», l’esploratore è la
   prova che oggi manca.
3. **Le garanzie del motore**: turni atomici, ANNULLA, salvataggi che si ricaricano identici perché
   rigiocano i comandi, il linter (stati scritti e mai letti, oggetti che non si riprendono).
4. **Un sorgente che l’autore legge e scrive nella sua lingua.** Le regole in italiano invece che in
   funzioni TypeScript annidate.
5. **Un motore solo per la saga.** Il Relitto è stato il banco di prova della 1.5.0; la Santa Maria
   lo sarebbe della 1.6, in una direzione nuova: l’avventura grafica, i verbi, la voce.
6. **La modalità a parser gratis**, come per il Relitto (documento 18): un’edizione «avventura
   testuale» della Santa Maria, accessibile ai lettori di schermo, senza scrivere niente di nuovo.

---

## 5. Che cosa FAVELLA 1.5.0 sa già fare

| Nella Santa Maria | In FAVELLA 1.5.0 |
|---|---|
| 10 schermate, uscite con condizione | stanze; `La sala collega est a … se …` (L7) |
| 58 hotspot, presenti o no secondo lo stato (`activeCondition`, `inactiveCondition`, `removedWhenOwned`) | cose di scena; posizioni e `prendibile` che cambiano per conseguenza |
| 9 oggetti d’inventario | cose prendibili |
| i sei verbi | le azioni della libreria (esamina, prendi, usa, apri, parla con, dai) e le regole `Invece di …` su ogni coppia verbo e cosa; `usaWith` sono le regole a due cose |
| i rifiuti per verbo (`FALLBACK`) e quelli a rotazione sugli oggetti in mano (`INV_FALLBACK`) | regole sulle categorie (`qualcosa`) con la precedenza delle regole sulle cose; la rotazione con le varianti in sequenza, da verificare nel pilota anche fuori dalle descrizioni |
| 33 flag, 11 dati, i giorni all’ispezione | stati, stati con valori, un contatore `(voluto)` che l’intestazione dell’interfaccia legge |
| 105 varianti di GUARDA per flag, prima e seconda visita | testi con `[se]` annidati (L14), `per la prima volta` (L6), `Quando il giocatore entra in …` (L16) |
| i beat dopo un’azione | `e poi dire` dopo le conseguenze (L9); i demoni |
| i micro-eventi casuali | `Ogni turno se càpita (1 su 5): …` |
| notifica, lettera, primi piani, sequenza finale | `segnala "…"` all’ospite (N6), che apre l’animazione o l’immagine |
| immagini per schermata e per stato | l’ospite, dalla stanza e dagli stati, come le viste del Relitto |
| dialoghi ad albero con condizioni ed effetti | `Il dialogo con … comincia con …`, opzioni con condizione e conseguenze (anche `collega`, N1), battute condizionali |
| salvataggi `.sm`, dieci posti e l’automatico | i salvataggi a riprese del motore, con l’impronta, come nel Relitto |
| il diario di bordo | la cronaca del ponte, come nel Relitto |

---

## 6. Che cosa manca alla 1.5.0

**G1. Un identificativo per ogni testo.** Ogni risposta della Santa Maria, e ogni variante, porta il
suo identificativo vocale: 318 nel codice, e il copione si genera da lì. In FAVELLA un testo non ha un
nome che arrivi all’ospite: i testi con un nome della 1.5.0 (`Il testo "x" è "…"`) sono una
sostituzione, e l’evento che esce porta solo le parole. **Serve** un identificativo che viaggi con
l’evento (sul testo detto, o sul testo con nome quando lo si dice). Il ripiego, una tabella che dal
testo esatto ricava la clip, si rompe alla prima correzione di una virgola.

**G2. Le lingue**, se restano nel piano. Lo stesso identificativo di G1 permette all’ospite di
sostituire ogni testo con la sua traduzione da una tabella per lingua. In più, nessun testo composto
dal motore (elenchi, nomi con l’articolo, messaggi della libreria) deve arrivare allo schermo: la
grammatica di quei testi è italiana. Con G1 e G6 si può fare; senza, FAVELLA non è un motore per un
gioco in sei lingue.

**G3. Un dialogo che parte da una regola o da un demone.** Nella Santa Maria i dialoghi si aprono con
`USA` sul comunicatore, e le trasmissioni di Berg e il segnale di Akkaya arrivano da soli quando lo
stato è maturo. In FAVELLA un dialogo comincia solo con «parla con»: fra le conseguenze di regole,
eventi e demoni non c’è l’apertura di un dialogo. L’ospite potrebbe mandare «parla con Berg» quando
riceve un segnale, ma allora l’esploratore, che gioca senza ospite, quelle trasmissioni non le vede.
**Serve** una conseguenza come `e adesso comincia il dialogo con Berg`.

**G4. Le battute in fila e le battute del protagonista.** In FAVELLA un nodo ha un solo parlante, e da
un nodo si passa a un altro solo scegliendo un’opzione. Nella Santa Maria 91 nodi su 114 passano al
successivo da soli, e 35 sono battute di William dentro la trasmissione. **Serve** un passaggio
automatico da nodo a nodo, e un modo di dare una battuta al protagonista.

**G5. Le scelte che valgono una volta.** Sono 33: si possono fare con 33 stati e 33 condizioni, ma
un’opzione `una volta sola` nel motore è più semplice e non si sbaglia.

**G6. La voce della libreria.** La libreria di FAVELLA parla in seconda persona («Non vedi nulla del
genere qui.», «Hai messo…», «Preso: …») e solo una parte dei suoi messaggi si ridefinisce con
`Il messaggio "…" è "…"` (ventidue chiamate in `libreria_azioni.py` e `gioco.py`; le altre frasi sono
scritte nel codice). La Santa Maria è in prima persona, doppiata, con rifiuti scritti uno per uno
secondo criteri precisi («la riga parla di chi rifiuta», niente participi con genere). **Serve** che
ogni messaggio della libreria si possa ridefinire, o tacere, e un collaudo che fallisca se un testo
della libreria arriva allo schermo.

Minori, che si risolvono senza toccare il motore: le etichette che cambiano con lo stato (la teca «a
parete» e poi «sul banco»: due cose, o un nome che l’ospite sceglie dallo stato); il tempo reale dei
micro-eventi (cinque minuti di intervallo) diventa un intervallo in turni, ed è un piccolo cambio di
progetto da far approvare; il tutorial progressivo resta dell’ospite.

---

## 7. Le tre condizioni

1. **Prima del doppiaggio.** Oggi il testo non è ancora in rilettura integrale e le voci non sono
   registrate: è il momento in cui il rifacimento costa meno, e l’unico in cui gli identificativi
   vocali si possono ancora spostare senza riascoltare niente. Dopo, ogni clip va ricollegata e
   riverificata.
2. **L’interfaccia non si tocca.** La regola aurea della Santa Maria resta: il prototipo 1:1, i
   componenti di oggi. Cambia solo ciò che sta sotto: `processAction`, il motore dei dialoghi e le
   regole di `GameShell` lasciano il posto a un ponte verso FAVELLA, che gira in Pyodide dentro
   Electron come gira nel WebView del Relitto. Non serve passare a Tauri per farlo.
3. **Lo stesso gioco, dimostrato.** La revisione dei testi in dodici lotti vale solo se il testo resta
   identico. La prova è differenziale: il gioco di oggi fa da oracolo. Si registrano, nell’eseguibile
   attuale e con gli agenti in Electron che il progetto già usa, le tracce di ogni percorso (la
   soluzione, la partita completista, quelle dei collaudi): per ogni passo, ogni riga con il suo tipo,
   il suo testo e il suo identificativo vocale. Il gioco ricostruito deve rigiocarle e produrre le
   stesse righe, byte per byte. Ogni differenza è un difetto del rifacimento, o un difetto vecchio
   trovato; nessuna si accetta senza una decisione scritta.

---

## 8. Come si farebbe

1. **FAVELLA 1.6**, nel suo repository e con le sue prove: G1, G3, G4, G5, G6 (e G2 se le lingue
   restano). Sono funzioni generali, da progettare come lo sono state le lezioni del Relitto per la
   1.5.0.
2. **L’oracolo.** Il registratore delle tracce dal gioco di oggi, e il confronto.
3. **Il pilota**, piccolo ma completo: la Plancia (sette hotspot, l’enigma P_01, la notifica, le
   varianti d’ingresso per stato e per visita), gli oggetti che le servono, il dialogo con Berg
   (diciotto nodi) con la sua trasmissione automatica, i rifiuti per verbo. Riesce se:
   - sulle tracce del pilota, ogni riga coincide per tipo, testo e identificativo vocale;
   - le schermate della Santa Maria sono identiche a quelle di oggi;
   - l’esploratore gira sul pilota e non trova vicoli ciechi;
   - nessuna regola del gioco è finita nell’ospite per aggirare un limite del motore.
   Se fallisce su uno di questi punti, ci si ferma e si decide con i dati in mano.
4. **Il resto del gioco**, schermata per schermata, con le tracce come rete.
5. **Gli strumenti del progetto**: il copione per la sala si genera dal `.fav`; i controlli di
   `tools/verifica/` leggono il `.fav`.
6. **Il passaggio.** Quando tutte le tracce coincidono, la logica TypeScript va in archivio e la
   Santa Maria gioca su FAVELLA.

Per dare l’ordine di grandezza, non un preventivo: il mondo della Santa Maria è circa un terzo del
Relitto, ma i suoi dialoghi sono più fitti e ogni riga porta una voce. Il grosso del lavoro non è
scrivere il `.fav`: è la 1.6, l’oracolo e la verifica.

---

## 9. Le alternative

| | Che cosa | Quando sceglierla |
|---|---|---|
| A | La Santa Maria resta com’è, e va al doppiaggio | se conta uscire presto; il rischio residuo di `GameShell` si riduce spostando quelle regole in un modulo puro, provato senza interfaccia |
| B | Rifacimento su FAVELLA con un’interfaccia nuova | mai: rimette in gioco la regola aurea e tutto il lavoro sul prototipo |
| C | Rifacimento del solo cervello su FAVELLA, interfaccia intatta, prima del doppiaggio | se FAVELLA deve essere il motore della saga e la Santa Maria il suo secondo banco di prova |
| D | La Santa Maria esce com’è; il rifacimento, se mai, dopo | se si vuole la 1.6 senza legarla al calendario del gioco: ma dopo le voci costa molto di più |

---

## 10. La mia raccomandazione

**C**, con il pilota come porta d’ingresso: niente oltre il pilota finché i suoi quattro criteri non
sono verdi. È la sola strada in cui il rifacimento dà alla Santa Maria qualcosa che oggi non ha (le
regole fuori dall’interfaccia, l’esploratore) e a FAVELLA qualcosa che le serve (la voce, i dialoghi
come li scrive un gioco doppiato, forse le lingue), senza buttare il lavoro sul testo e
sull’interfaccia.

Se invece la priorità dell’autore è la Santa Maria in uscita con le sue voci, la risposta giusta è
**A**: il gioco è solido, e il suo punto fragile si cura senza cambiare motore.

**La risposta dell’autore (15 ottobre 2026): per la Santa Maria non c’è fretta.** Cade quindi la
ragione per A: la strada è C, quando l’autore deciderà di cominciarla, con la FAVELLA 1.6 per prima.
La G1 servirebbe anche all’inglese del Relitto (documento 20, §7).
