# Il parser sotto i pulsanti, e una modalità a solo testo

Versione 1.0, 15 ottobre 2026. Risponde a tre domande dell’autore, fatte a fine sessione: se con i
pulsanti a fiore questa resta un’avventura testuale; se il parser dei comandi è soltanto nascosto;
se si può avere, nelle opzioni, una modalità «avventura testuale pura», solo parser, con tutta la
grafica che resta com’è. È un’analisi con una proposta: niente di quello che segue è deciso.
Le decisioni da prendere sono nel §6.

Ogni affermazione è controllata sul codice: il motore in `motore/` (FAVELLA 1.5.0), il ponte
(`app/src/motore/ponte.py`), il modello d’azione (`app/src/azione/`) e il gioco (`app/src/gioco/`).

---

## 1. In breve

1. **Sì, è un’avventura testuale.** Il gioco è il `.fav` del remake, che si gioca anche da terminale
   scrivendo i comandi (`python motore/favella.py gioca relitto-silente/relitto.fav`). Il mondo, gli
   oggetti, le regole, il tempo, l’aria e i finali sono quelli di una storia a parser. I pulsanti sono
   un modo di comporre la frase, non un altro gioco.
2. **Sì, il parser c’è, e lavora a ogni turno.** Ogni pulsante produce una frase italiana («esamina
   la radio», «usa la chiavetta con le teche aperte») e la passa al motore, che la legge con il suo
   parser, esattamente come se il giocatore l’avesse scritta. Nell’app non c’è un parser nascosto
   accanto ai pulsanti: c’è il parser e basta, e i pulsanti gli scrivono.
3. **Sì, la modalità a solo testo si può fare, e costa poco.** È il modo in cui il gioco è nato e in
   cui è collaudato. Va costruita la riga di comando (con la sua tastiera e i comandi che spettano
   all’app), il resto dello schermo resta identico. Stima: una sessione, due con le prove. Il punto
   più delicato non è il parser, ma il diario e il suono, che oggi capiscono un comando dalla forma
   che hanno i pulsanti (§5.7).

---

## 2. È ancora un’avventura testuale?

Sì, e lo dice la struttura, non l’etichetta.

- **La storia è tutta nel testo.** Le stanze, le cose, i dialoghi, l’aria che cala, i sei finali:
  tutto arriva come testo del motore. La grafica (la membrana, le venature, il visore, le atmosfere)
  lo veste e lo accompagna, ma non racconta niente che il testo non dica già.
- **Il mondo è simulato.** Ci sono oggetti con proprietà, un inventario, stati, contatori, uscite che
  si aprono e si chiudono, demoni che scattano a fine turno. Su ogni cosa si può tentare un verbo, e
  il motore risponde anche ai tentativi sbagliati. È questo che separa un’avventura testuale da una
  storia a scelte (Twine, Ink, i librogame), dove si sceglie solo fra le strade che l’autore ha
  tracciato.
- **I pulsanti compongono frasi.** Prima la cosa, poi il verbo, poi (con «Usa con…») la seconda
  cosa: il risultato è la stessa frase che un giocatore scriverebbe. Il precedente storico sono le avventure
  della Legend Entertainment nei primi anni Novanta (Gateway, Eric the Unready), dove menu di verbi e
  di oggetti costruivano la frase per il parser, e chi voleva poteva scriverla. Il Relitto nell’app fa la prima metà di questa scelta.

Che cosa cambia davvero con i pulsanti: **filtrano**. Il modello d’azione mostra su una cosa solo i
verbi che hanno un motivo (06, §6.1), in media 4,1 per cosa invece dei 33 che il motore offrirebbe.
Si perde la libertà di tentare un verbo che il gioco non prevede, e con lei il «trova il verbo
giusto», che nel parser è insieme una fatica e un piacere. Il collaudo garantisce che non si perda
niente di necessario: i 1.294 comandi dei 14 percorsi si giocano tutti con i soli menu
(`collaudo/menu.mjs`, `collaudo/pulsanti.py`).

Il nome giusto, per il gioco nell’app, è quindi **avventura testuale con interfaccia a pulsanti**.
Non è un punta e clicca: non ci sono personaggi che si muovono in una scena, e lo spazio si attraversa
con le uscite, non con il cursore.

---

## 3. Il parser c’è

Il percorso di un pulsante, passo per passo:

1. il modello d’azione (`app/src/azione/modello.ts`) prende i menu che il motore offre
   (`pulsanti()` in `motore/gioco.py`) e li filtra; ogni voce porta il suo comando già scritto, per
   esempio `esamina la radio`;
2. toccando il petalo, l’app chiama `rel_comando("esamina la radio")` nel ponte;
3. il ponte chiama `elabora_comando(mondo, "esamina la radio")`, la stessa funzione che usa il
   terminale: normalizza gli apostrofi, risolve le domande in sospeso («Quale intendi…?», «Con cosa
   vuoi usarla?»), riconosce i comandi di servizio (ANNULLA, ANCORA, SALVA, CARICA), poi in
   `_esegui_comando` cerca il verbo, risolve i nomi (anche parziali e con i pronomi), applica le regole
   dell’autore e quelle della libreria, fa passare il turno.

Tre fatti lo confermano.

- **FAVELLA ha una frase per scegliere il modo dei comandi**: `I comandi si scrivono.`,
  `I comandi si scelgono con i pulsanti.` oppure `I comandi si scrivono oppure si scelgono con i
  pulsanti.` (grammatica 1.5.0, `def_comandi`). Senza la frase valgono entrambi. Il `.fav` del
  Relitto non la dichiara; è il ponte che imposta `mondo.modo_comandi = "pulsanti"` sulla partita
  (riga 83), e quel modo cambia **soltanto** che cosa offre `pulsanti()` (ogni verbo d’autore su ogni
  cosa, invece dei soli verbi già scoperti). La lettura delle frasi non cambia.
- **I collaudi giocano frasi scritte.** I percorsi in `collaudo/*.txt` sono comandi digitati, anche
  abbreviati e con le risposte di dialogo scritte per esteso («Ho trovato una cosa.»).
  `collaudo/regressioni.py` li gioca attraverso il ponte; `collaudo/pulsanti.py` verifica che ognuno
  abbia un pulsante equivalente.
- **Il ponte sa già analizzare un comando scritto.** `_analizza` riconosce i comandi nati da un
  pulsante fra quelli offerti, e scompone «come fa il motore, in silenzio» quelli scritti
  (`"gruppo": "scritto"`). Era stato preparato per il campo di testo delle build di sviluppo (D20),
  che nell’app non è mai stato costruito.

Il parser non è stato nascosto: non gli è mai stata data una tastiera.

---

## 4. Una modalità a solo testo: si può fare?

Sì. Il motore, il ponte, i salvataggi, il diario, il suono e le atmosfere funzionano già con comandi
scritti, perché ogni comando, anche quello di un pulsante, arriva al motore come testo. Manca
l’interfaccia della scrittura: una riga di comando, la tastiera che le serve, e il passaggio all’app
dei comandi che non sono del mondo (salvare, caricare, ricominciare, aprire il diario).

Quello che la modalità porta in più, oltre al piacere di chi ama il genere:

- **l’accessibilità**: con un lettore di schermo, una riga di testo e una risposta che si legge da sé
  (la lamina è già una regione `aria-live`) sono il modo più semplice di giocare;
- **la libertà del parser**: tutti i verbi del gioco, i sinonimi, le abbreviazioni (`x`, `i`, `l`,
  `n`, `g`), i pronomi («esaminala»), più cose insieme («prendi la chiave e la torcia»);
- **la fedeltà all’originale**: il Relitto Silente è nato come avventura a parser.

---

## 5. La proposta

### 5.1 Che cosa resta identico

Tutto ciò che non è il modo di dare i comandi: la lamina con la rivelazione a righe e la grammatica
tipografica; il visore con la mappa, l’aria e i contatori; le venature, la crescita della membrana,
l’acciaio della Santa Maria, le atmosfere e l’ipossia; il dialogo con il ritratto di Yusuf, la vista
dell’Anziano e l’onda della voce; il diario; la pausa, i salvataggi, le opzioni; l’intro, i loghi, i
riconoscimenti, il menu; il suono, quando ci sarà.

### 5.2 Che cosa cambia: il ramo lascia il posto alla riga di comando

Nella fascia del ramo (le uscite, i baccelli, gli attrezzi, il fiore) compare una riga sola: il segno
`›`, lo stesso con cui la lamina ripete il comando dato, e il cursore. Nell’acciaio è la riga di un
terminale di bordo; nella membrana un filo che pulsa piano. Il comando scritto, dato con Invio,
compare sopra la risposta come oggi.

Si spengono anche i nomi toccabili nel testo (l’opzione resta, ma in questa modalità non vale) e
l’accensione dei pulsanti suggeriti. I suggerimenti in maiuscolo («adesso puoi ACCOSTARE») restano
nel testo, e tornano a essere quello per cui l’autore li aveva scritti: il modo in cui il gioco
insegna il verbo a chi scrive.

### 5.3 La tastiera

Le lettere, le cifre, lo spazio e le frecce appartengono alla riga. Quindi, in questa modalità:

| Tasto | Che cosa fa |
|---|---|
| qualunque lettera | scrive nella riga; se il testo sta comparendo, prima lo completa |
| Invio | dà il comando; su una riga vuota completa il testo |
| ↑ ↓ | i comandi già dati, come in ogni interprete (non più le uscite) |
| Esc | svuota la riga; se è vuota, apre la pausa |
| F5, F9, F11 | come oggi |
| D | scrive una «d»: il diario si apre dalla pausa, con il pulsante in alto o scrivendo DIARIO |

La pagina «Tasti» della pausa mostra la tabella del modo in uso.

Il completamento delle parole con Tab, tipico di alcuni interpreti moderni, non è puro: lo lascerei
fuori, o come opzione a parte (§6, D23).

### 5.4 I comandi che sono dell’app

Alcuni comandi il motore li sa eseguire da sé, ma nell’app devono passare dall’app, perché l’app ha
uno stato suo (il diario, le stime, i salvataggi su disco):

| Scritto | Nell’app |
|---|---|
| SALVA, CARICA | aprono i pannelli dei salvataggi (F5, F9); `salva 3` salva nel posto 3. Il motore li tratterebbe con i suoi file, che nell’app non si usano |
| RICOMINCIA | la conferma dell’app, come «Ricomincia da capo» nella pausa |
| DIARIO, TRASCRIZIONE | aprono il diario, la trascrizione alla sua pagina |
| OPZIONI, MENU | aprono la pausa o le opzioni |
| ESCI, FINE | li lascia al motore: «esci» in una stanza con un’uscita fuori è un movimento. Se il motore chiede di chiudere e il giocatore conferma, l’app torna al menu principale |
| AIUTO | il testo d’aiuto del motore, e sotto i verbi propri del gioco (quelli del README: `analizza`, `traduci`, `sintonizza`, `incidi`…) e i tasti |

ANNULLA e ANCORA restano del motore: il diario segue già ANNULLA (`_aggiorna_cronaca`).

### 5.5 Il dialogo e le domande

Nel dialogo la vista resta com’è: il ritratto, le battute, e le risposte numerate, che sono testo del
motore (gli eventi `opzione`) e non pulsanti. Si sceglie scrivendo il numero o la frase, anche in
parte, come il motore già accetta.

Le domande del motore (sì o no, «Quale intendi…?») oggi diventano il pannello della conferma; in
questa modalità restano nella lamina, e si risponde scrivendo. Le conferme che sono dell’app
(sovrascrivere un posto, ricominciare dalla pausa) restano pannelli: sono menu, non comandi del
gioco.

### 5.6 Che cosa si perde, ed è giusto così

- la stima dell’aria sul petalo (D16): nel parser il costo si impara giocando, guardando il visore;
- i suggerimenti accesi per sei secondi;
- il filtro dei verbi: chi scrive può tentare qualunque cosa, e ricevere un rifiuto.

### 5.7 Il punto debole: capire che cosa ha fatto un comando scritto

Il diario e il suono hanno bisogno di sapere quale verbo e quale cosa ha giocato il turno: la
traduzione di un’iscrizione va nella pagina delle traduzioni, la lettura della placca rivela le
iniziali di L.V., ogni attrezzo ha il suo suono. Per i pulsanti il ponte lo sa con certezza (il
comando è fra quelli offerti). Per un comando scritto `_analizza` prende la prima parola come verbo e
il resto come una cosa: funziona con «esamina la placca» e «x placca», ma non con «esaminala»
(pronome), «prendi la chiave e la torcia» (più cose), «usa X su Y» (la seconda cosa non la cerca), né
con la risposta a «Quale intendi…?».

Le parti del diario che vengono dallo stato (le tracce di L.V., le voci, i reperti) non hanno questo
problema: si trovano per differenza fra prima e dopo il turno. Lo hanno la lettura delle traduzioni,
le iniziali sulla placca e una parte degli eventi del suono.

Due rimedi, in ordine di bontà:

1. **nel motore**: un evento che dica all’ospite che cosa il parser ha capito (l’azione, la prima e
   la seconda cosa risolte, anche per i pronomi e gli elenchi). È una lezione per una FAVELLA futura,
   nello stile del documento 05, e servirebbe a qualunque interfaccia;
2. **nel ponte**, finché il motore non lo dà: ricavare il verbo e le cose dal comando che il motore
   ha registrato e dalle sue strutture (`_registro_comandi`, il pronome in memoria), con un collaudo
   che giochi i percorsi in forma abbreviata e controlli che il diario e il suono escano identici a
   quelli dei pulsanti.

### 5.8 Come si prova

- `python strumenti/prova_eseguibile.py` con un modo nuovo, che giochi i sei finali **scrivendo** i
  comandi dei percorsi nella riga, e controlli l’impronta finale come fa oggi la prova dei finali;
- un percorso riscritto con abbreviazioni e pronomi, per il diario e il suono (§5.7);
- la prova a mano con un lettore di schermo (NVDA su Windows);
- il passaggio da un modo all’altro a metà partita: lo stato è lo stesso, quindi deve funzionare
  senza perdere niente.

---

## 6. Le decisioni dell’autore

| # | Domanda | Proposta |
|---|---|---|
| D21 | Si fa la modalità a solo testo? | sì; nella fase 3 se si vuole subito, altrimenti nella rifinitura (fase 8) |
| D22 | Due modi o tre? | due, come chiesto: «con i pulsanti» (il modo standard) e «scritti» (avventura testuale). Un terzo modo, pulsanti e riga insieme, costa poco in più, ma mescola due esperienze: lo lascerei per dopo |
| D23 | Il completamento delle parole con Tab | no nella modalità pura; eventualmente un’opzione a parte |
| D24 | Dove si sceglie | nelle opzioni («Comandi»), e si può cambiare in qualunque momento; in più, una domanda alla prima partita nuova? Proposta: solo le opzioni |
| D25 | I messaggi del parser («Non capisco questo verbo.») | quelli della libreria, come nel terminale. Se l’autore li vuole nella voce del gioco, il ponte può ridefinirli sulla partita (come fa con il modo dei comandi) senza toccare i `.fav` |
| D26 | L’aiuto | il testo del motore più una pagina dell’app con i verbi del gioco e i tasti |

---

## 7. La risposta dell'autore (16 ottobre 2026)

**D21: sì, nella rifinitura** (fase 8), non prima. Le proposte D22–D26 restano quelle della tabella: due modi (pulsanti e scritti), niente Tab, la scelta nelle Opzioni («Comandi»), i messaggi del parser della libreria, l'aiuto con la pagina dei verbi e dei tasti. Ne parleremo di nuovo al momento di costruirla; per ora non si tocca niente.
