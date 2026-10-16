# FAVELLA 1.5.0: che cosa cambia per il Relitto

Versione 1.0, 15 ottobre 2026. Accompagna `05-lezioni-per-favella.md` e `05b-verifica-delle-lezioni.md`, e
risponde a una domanda: adesso che le lezioni del Relitto sono entrate nel motore, che cosa può farne il
Relitto, e a che prezzo.

L’ha scritto la sessione che ha portato FAVELLA dalla 1.4.4 alla 1.5.0, nel repository FAVELLA1. Il gioco,
l’app e la copia del motore in `motore/` **non sono stati toccati**: tutte le prove di questo documento sono
state fatte su copie, fuori da questa cartella. Il README e il prompt della sessione (documento 15) dicono che
il motore e i `.fav` non si toccano: aggiornare l’uno o gli altri resta una decisione dell’autore. Qui ci sono
gli elementi per prenderla.

---

## 1. In breve

- **FAVELLA 1.5.0 è pubblicata** dal 15 ottobre 2026: Release `v1.5.0` su GitHub (con gli installer per
  Windows, macOS e Linux), `favella1` 1.5.0 su PyPI, favella.eu (sito 2.9.0), il manuale in PDF (102 pagine).
  La specifica è `documentazione/grammatica-1.5.0.md` (§28), il piano del lavoro
  `documentazione/piano-1.5.0.md`, i dettagli nel CHANGELOG del repository. La terza edizione cartacea del
  manuale resta quella della 1.4.4.
- **Le venti lezioni sono chiuse** nella parte che il 05b raccomandava, e con loro N1, N2, N3, N4 e N6.
  Restano fuori, come diceva il pacchetto E: le descrizioni «più specifiche» (L2), le etichette di dialogo
  per personaggio (L11), il filtro dei pulsanti come comportamento del motore (L20) e la marcatura del
  genere dei testi (N5). L2 e il secondo punto di L11 si accendono con una frase d’autore (§3).
- **Il Relitto gira identico sul motore 1.5.0.** Le stesse partite giocate con il motore 1.4.4 e con il
  1.5.0 danno lo stesso testo e la stessa impronta a ogni passo: 39 partite (24 a caso e i 15 percorsi di
  `collaudo/`), 5.237 passi. Con il motore 1.5.0 al posto di quello in `motore/`, i collaudi del Relitto
  restano verdi, ponte compreso (§5).
- **Due livelli di adozione.** Aggiornare `motore/` senza toccare i `.fav` è sicuro e non cambia nessuna
  partita; il ponte può perdere i suoi rimedi (§4). Usare le frasi nuove vuol dire toccare i `.fav`, quindi
  l’impronta della storia, il CHANGELOG e il collaudo (§7).

---

## 2. Che cosa c’è di nuovo

Tutto è facoltativo: una storia che non usa le frasi nuove si comporta come nella 1.4, comando per comando
(provato su undici storie ufficiali, Il Viaggiatore compreso, e sul Relitto).

| Frase o funzione | Esempio | Lezione |
|---|---|---|
| il vincolo che ferma | `Prima di sintonizza qualcosa se la protezione è attiva: dire "PROTEZIONE VITALE." e basta.` | L1 |
| lo stato calcolato | `La protezione è attiva quando l'aria è meno di 30 e la fuga è lontana.` | L17 |
| la prima volta | `Invece di prendi il disco per la prima volta: …; altrimenti dire "…".` | L6 |
| spostare il giocatore | `e adesso il giocatore va nella gola` (mostra la stanza) · `si ritrova nella gola` (non la mostra) | L8 |
| il testo dopo le conseguenze | `… e adesso aumenta l'aria di 20 e poi dire "Aria: [aria]."` | L9 |
| più nomi in una riga | `I ganci si chiamano anche "casse", "uncini" e "rampini".` | L12 |
| i testi con un nome | `Il testo "presa di servizio" è "…".` e poi `[presa di servizio]` in qualunque testo | L10 |
| le regole su più verbi | `Invece di usa oppure accendi il faro: …` | L10 |
| la consultazione gratuita | `"esamina" non fa passare il tempo.` | L5 |
| il segnale per l’ospite | `e adesso segnala "gemito"` | N6 |
| l’arrivo | `Quando il giocatore entra nella stiva: …` (prima della descrizione) | L16 |
| l’uscita con una condizione | `La sala collega est a la gola se la fuga è iniziata; altrimenti "…".` | L7 |
| i fronti a fine turno | `I demoni guardano la fine del turno.` | L2, L11 |
| lo stato letto dall’interfaccia | `L'aria è un contatore (voluto).` | L4 |
| la riga di stato, l’IFID | `La riga di stato è "[luogo] · turno [turno]".` · `L'IFID è "…".` | idee della documentazione |

Senza frasi nuove: i `[se]` si annidano a ogni profondità, e uno sbilanciato è un errore con la riga giusta
(L14, N2); dentro le stringhe `’`, `‘`, `“` e `”` passano intatte (L13); il linter avvisa degli oggetti che
entrano in inventario senza essere prendibili (L3) e di ciò che si scrive e non si legge mai (L4), e non dà
più per inutile uno stato letto solo in un `[se]` (N3); un’opzione di dialogo con `collega` compila (N1); i
salvataggi non si dichiarano più diversi a torto (L18) e caricare non segna più la stanza come vista (L19).

Per chi collauda (L15): `favella1 trascrivi storia.fav percorso.txt`, e
`favella1 collaudo storia.fav --percorsi … [--traccia aria] [--riprese]`, con le attese nei commenti nelle
stesse forme dei percorsi del Relitto (`# atteso: esito vinta`, `# atteso: aria >= 20`, `# atteso: finale «…»`, `# atteso: mai «…»`), più
una condizione di FAVELLA (`# atteso: l'aria è almeno 20`). L’esploratore prova anche i verbi equivalenti
sulle stesse cose.

---

## 3. Le lezioni, una per una

| Lezione | Esito nella 1.5.0 |
|---|---|
| L1 vincoli trasversali | chiusa: `Prima di … e basta`, controllato prima di ogni altra regola, qualunque sia il bersaglio |
| L2 demoni e ordine dei moduli | chiusa **con una frase**: `I demoni guardano la fine del turno.` Come comportamento predefinito cambiava due storie ufficiali (Il Viaggiatore e «Cuori al caffè»), quindi si accende solo se l’autore lo scrive. Le descrizioni «più specifiche» restano fuori (E) |
| L3 inventario e prendibile | chiusa: avviso del linter |
| L4 stati scritti e mai letti | chiusa: avviso del linter, e `(voluto)` per ciò che legge solo l’interfaccia |
| L5 il tempo della consultazione | chiusa: `"esamina" non fa passare il tempo.` (anche per le regole d’autore su quel verbo che si limitano a `dire`) |
| L6 la prima volta | chiusa: `per la prima volta` sulle regole (vale finché la regola non è scattata) e sui demoni `Quando` (una volta sola nella partita) |
| L7 uscite condizionali | chiusa: collegamenti con `se`, con o senza testo `altrimenti` |
| L8 spostare il giocatore | chiusa: `va in` e `si ritrova in`; `è in` resta com’era (§6) |
| L9 i segnaposto e il valore di prima | chiusa: `e poi dire`, nelle regole, negli eventi, nei demoni e negli argomenti |
| L10 testi riusabili, più verbi | chiusa: testi con un nome, regole con `oppure` |
| L11 dialoghi | primo punto chiuso (N1); secondo chiuso con la stessa frase di L2 (i fronti `Quando` si valutano anche alla chiusura del dialogo); terzo, le etichette per personaggio, rinviato (E) |
| L12 lessico | chiusa: `si chiamano anche`, più nomi in una riga |
| L13 tipografia | chiusa |
| L14 `[se]` annidati | chiusa, con N2 |
| L15 strumenti di collaudo | chiusa: `trascrivi`, `--percorsi`, `--traccia`, `--riprese`, nati dai prototipi di `collaudo/` |
| L16 il finale dopo la stanza | chiusa: `Quando il giocatore entra in …` scatta prima della descrizione; se chiude la partita, la stanza non si stampa |
| L17 condizioni con un nome | chiusa: gli stati calcolati |
| L18 il punto di partenza dei salvataggi | chiusa: la stanza di partenza è vista prima che il motore fissi il punto di partenza; `apri_partita` e `nuova_partita` lo fissano dopo l’apertura |
| L19 caricare segna la stanza come vista | chiusa: CARICA ridisegna con `mostra_situazione`, che non cambia la partita |
| L20 i pulsanti senza filtro | primo passo chiuso: `pulsanti()` dà i `fatti`; il filtro resta all’ospite (E) |
| N1 opzione con `collega` | chiusa |
| N2 `[se]` sbilanciati | chiusa: errore di compilazione |
| N3 stato letto solo in un `[se]` | chiusa |
| N4 interfaccia per gli ospiti | chiusa: `nuova_partita`, `apri_partita`, `prova`, `mostra_situazione`, `riga_di_stato` in `gioco.py` |
| N5 il genere del testo | rinviata (FAVELLA 2) |
| N6 i segni del caso | chiusa: `segnala` |

Le sonde del 05b, rifatte sul motore 1.5.0 (e sul 1.4.4 per confronto): L1, L5, L8, L9 e L13 sul 1.4.4 non
compilano, sul 1.5.0 fanno ciò che dicono; L14 sul 1.4.4 lascia leggere pezzi di codice, sul 1.5.0 annida;
L18 sul 1.4.4 dice «non è identica», sul 1.5.0 la partita torna identica; L19 sul 1.4.4 segna la gola come
vista solo nella partita caricata, sul 1.5.0 in nessuna delle due; N3 sul 1.4.4 dà il falso avviso, sul
1.5.0 no. La soglia di L2, con la frase, scatta nel turno stesso (56, al primo `aspetta`).

---

## 4. Il ponte: che cosa si può togliere

Ogni rimedio del ponte nasce da un limite del motore 1.4.4, e la 1.5.0 ha la funzione che lo sostituisce.
Con il motore 1.5.0 i rimedi **continuano a funzionare** (i collaudi del §5 girano con il ponte com’è): si
possono togliere quando conviene, non è obbligatorio farlo subito.

| Nel ponte (`app/src/motore/ponte.py`) | Nella 1.5.0 (`gioco.py`) | Note |
|---|---|---|
| `_nuova_partita` (riga 100): copia, seme prima, apertura, `_stato_iniziale` e `_impronta_iniziale` fissati a mano dopo | `nuova_partita(_base, seme)` restituisce `(mondo, eventi dell’intestazione, eventi della stanza)`, con il punto di partenza fissato dopo l’apertura (L18) | il ponte imposta `modo_comandi = "pulsanti"` prima dell’intestazione: basta impostarlo una volta su `_base`, che `nuova_partita` copia |
| `_mostra_su_un_ramo` (riga 807), e l’import di `_mostra_nodo` | `mostra_situazione(m)`, dentro `raccogli_uscita` | ridisegna la stanza o la battuta del dialogo senza cambiare la partita (L19) |
| `_ramo` e `_SESSIONE` (riga 850, sedici campi copiati a mano) | `prova(m, comando)`: `impronta`, `testo`, `eventi`, `continua`, `esito`, `turno` | copre da sé ogni campo di sessione, anche quelli che il motore aggiungerà (N4). **Va sostituito prima di usare le frasi nuove**: la 1.5.0 ha campi di sessione che `_SESSIONE` non conosce (per esempio i segnali in attesa), e un ramo che li tocca li lascerebbe sporchi |
| `_indicizza` (riga 194) | `pulsanti(m)["fatti"]`: `per_cosa`, `in_coppia`, `senza_cosa`, `effetti` | stesso calcolo, ma per le sole cose in vista, che è ciò che usa `_cose`; `rel_indice`, che dà l’indice di tutte le cose, può restare com’è |
| i cinque segni del caso riconosciuti dal testo (§7 del documento 12) | `e adesso segnala "gemito"` nel `.fav`; il ponte riceve un evento `{"tipo": "segnale", "testo": "gemito", "dati": {"nome": "gemito"}}`, che nel terminale tace | richiede di toccare i `.fav` (§7); poi il collaudo che controlla l’inizio dei cinque testi non serve più |

Il caricamento del ponte resta suo (rigioca la sequenza dei comandi e confronta): la 1.5.0 non lo cambia. Il
CARICA del motore, che il ponte non usa, ora ridisegna con `mostra_situazione` come fa già il ponte.

---

## 5. Come si aggiorna `motore/`

1. **La copia.** `motore/` è una copia del repository FAVELLA1. Si rifà dal tag `v1.5.0`, file per file,
   con gli stessi nomi di oggi (i cinque moduli che l’app usa sono `favella_utils.py`, `strutture.py`,
   `libreria_azioni.py`, `compilatore.py` e `gioco.py`; gli altri servono ai collaudi e alla riga di
   comando, `favella.py`, `esploratore.py`, `collaudo.py`). Per esempio, dalla radice del Relitto:

   ```
   git -C ../../../GitHub/FAVELLA1 archive v1.5.0 CHANGELOG.md LICENSE MANIFEST.in README.md pyproject.toml collaudo.py compilatore.py esploratore.py esportazione.py favella.py favella_playground.py favella_server.py favella_utils.py gioco.py libreria_azioni.py strumenti_ide.py strutture.py test_collaudo.py test_linguaggio.py documentazione esempi favella1 | tar -x -C motore
   ```

   Sono gli stessi file e le stesse cartelle che `motore/` contiene oggi (il comando è provato). I file che
   nel repository non ci sono più restano dove sono, e non danno fastidio. Poi `VERSIONE_MOTORE` in
   `motore/strutture.py` dice `1.5.0`. Chi vuole solo la riga di comando può anche usare
   `pip install favella1==1.5.0`, ma l’app legge i file di `motore/`.
2. **Pyodide.** Non cambia niente nell’app: `app/src/motore/sorgenti.ts` porta dentro il pacchetto i cinque
   moduli da `motore/` come testo, e `app/scripts/sincronizza.mjs` resta com’è. Il motore chiede `lark>=1.1`:
   la ruota di Lark 1.3.1 che l’app già porta va bene.
3. **I collaudi.** Su una copia del Relitto con il motore 1.5.0 al posto di quello in `motore/`, e con il
   ponte com’è oggi:

   | Collaudo | Esito |
   |---|---|
   | `python collaudo/regressioni.py` | 14 percorsi su 14 |
   | `python collaudo/regressioni.py --riprese` | 14 percorsi su 14, con la prova di ripresa |
   | `python collaudo/pulsanti.py` | 14 percorsi su 14; 1.291 comandi, 1.112 con lo stesso comando, 179 con uno equivalente, nessuno con lo stesso stato e una risposta diversa |
   | `python collaudo/eventi.py` | 14 percorsi su 14; 84 eventi su 84; i cinque segni a sorte riconosciuti; il ponte non cambia la partita nei sei finali |
   | `python collaudo/salvataggi.py` | 14 percorsi su 14; 463 salvataggi, tutti ricaricati identici; i rifiuti e le segnalazioni (9 casi) |
   | `favella1 compila relitto-silente/relitto.fav` | 23 stanze, 93 oggetti, nessun avviso (come con il 1.4.4) |

   Non li ho girati: `node collaudo/menu.mjs`, `node collaudo/tipografia.mjs`, le prove dell’app e
   `cargo test`, che non dipendono dal motore se non attraverso il ponte, già provato da `pulsanti.py` ed
   `eventi.py`. Vanno girati comunque dopo l’aggiornamento, come ogni volta.
4. **I documenti del Relitto.** Il README dice «motore v1.4.4», e `sviluppo/VERSIONI.md` dice «1.4.4,
   congelato»: da aggiornare. Per il §3 di `VERSIONI.md` un motore FAVELLA *minor* nuovo è un MINOR del
   gioco (con le fasi, la decisione è dell’autore); la voce del CHANGELOG ha l’ambito `motore`.

---

## 6. I salvataggi

- **L’impronta della storia cambia.** `impronta_storia()` nel ponte è lo SHA-256 dei quattordici `.fav` e di
  `VERSIONE_MOTORE`: con il motore 1.5.0 cambia anche se i `.fav` restano uguali.
- **Un salvataggio fatto con il motore 1.4.4 si carica come «ricostruita»**, non «diversa»: è il caso
  «storia cambiata» del §4 di `VERSIONI.md`. La partita si rigioca sul motore nuovo, e poiché il Relitto
  gioca identico (§1) arriva allo stesso stato; il gioco dice comunque che è stata ricostruita, perché
  l’impronta della storia non è più quella. Se l’avviso disturba, il ponte può riconoscere il caso (stessa
  impronta dello stato, motore diverso) e tacere: è una scelta dell’app.
- **Il formato del file non cambia**: `formatoSalvataggi` resta 1.
- I salvataggi del terminale (`favella1 gioca`, SALVA e CARICA del motore) sono un’altra cosa: la 1.5.0
  accetta anche quelli fatti con la 1.4, il cui punto di partenza era calcolato nel modo vecchio.

---

## 7. Se l’autore decide di usare le frasi nuove

Ogni riga di questa tabella tocca i `.fav`: cambia l’impronta della storia, va nel CHANGELOG, e il collaudo
deve restare verde (i percorsi con le loro attese lo dicono subito). I numeri sono quelli del §6 del 05b.

| Oggi nel Relitto | Con la 1.5.0 | Attenzione |
|---|---|---|
| 24 testi «PROTEZIONE VITALE», 25 condizioni sull’aria, 46 «e la fuga è lontana» | uno stato calcolato (`La protezione è attiva quando …`, con la soglia di oggi) e qualche `Prima di … qualcosa se la protezione è attiva: dire "…" e basta.` | un vincolo vale per ogni bersaglio, anche per le cose che oggi non hanno la regola: controllare che sia voluto |
| l’ordine degli `Includi` è logica del gioco (`aria.fav` penultimo) | `I demoni guardano la fine del turno.` | cambia il momento di alcuni testi dopo i dialoghi: vedi sotto |
| nove stati di guardia | `per la prima volta` | |
| 17 regole `Invece di vai` che fanno da porte, uscite aperte a mano dai demoni | collegamenti con `se` | |
| descrizioni copiate nei testi, «la cifra scende» senza dire dove | `va in` o `si ritrova in`, `e poi dire "Aria: [aria]."` | §8 per la discesa |
| 62 copie di 32 testi | testi con un nome, regole su più verbi | |
| 219 righe `si chiama anche` | una riga per cosa | |
| apostrofi dritti nei `.fav`, rifatti a schermo dalla grammatica dell’app | `’` e `“”` direttamente nelle stringhe | la grammatica tipografica dell’app li riceverebbe già curvi: da controllare con `collaudo/tipografia.mjs` |
| il demone che chiude la partita entrando nella stiva | `Quando il giocatore entra nella stiva …` | |
| cinque segni del caso riconosciuti dal testo | `segnala "…"` | §4 |
| esaminare il visore costa aria | `"esamina" non fa passare il tempo.` | cambia l’equilibrio dell’aria: è una scelta di gioco, non una correzione |

**La frase dei fronti, provata sul Relitto.** Su una copia con `I demoni guardano la fine del turno.` in
fondo a `relitto.fav`, le 24 partite a caso restano identiche, e cambiano 10 dei 15 percorsi di `collaudo/`.
Ogni differenza comincia alla chiusura di un dialogo: i fronti `Quando` scattano subito, invece che dopo il
comando seguente (il secondo punto di L11). Dopo «[Apri gli occhi.]» il tremito della nave che apre la fuga
arriva con la fine della conversazione, invece che dopo `prendi il seme`; dopo «Lascia stare.» la soglia
rossa («29. La cifra è rossa…») arriva subito, invece che dopo la descrizione della stanza seguente. L’altra
metà della frase, le soglie che vedono la fine del turno (L2), nel Relitto non si vede: l’ordine degli
`Includi` aveva già risolto il problema, e con la frase quell’ordine smette di contare. Le attese dei percorsi
restano tutte vere (`regressioni.py`: 14 su 14). È probabilmente ciò che il 05b chiedeva, ma sposta un testo
in dieci percorsi e cambia le impronte da quel punto in poi: è una decisione dell’autore, da prendere
guardando le due scene.

---

## 8. La discesa: `fuga.fav:34-35` (L8)

Le due regole della discesa hanno lo stesso testo e la stessa destinazione, ma con il motore 1.4.4 non fanno
la stessa cosa: `vai giù` è una regola `vai`, e dopo il testo non mostra la gola; `entra il buio` è una regola
su un oggetto, e dopo il testo mostra la gola una seconda volta e la segna come vista. Con il motore 1.5.0, se
i `.fav` non cambiano, resta tutto così: `è in` non cambia significato, perché molte storie contano su come
si comporta oggi.

Con la 1.5.0 le due regole possono dire la stessa cosa. Due scelte:

- **`e adesso il giocatore si ritrova nella gola del ritorno`** in tutte e due: nessuna delle due mostra la
  gola. Per `vai giù` non cambia niente, e nessun percorso di `collaudo/` usa `entra il buio` (tutti scendono
  con `giù`): i percorsi restano identici. È la scelta che cambia meno.
- **`e adesso il giocatore va nella gola del ritorno`** in tutte e due: tutte e due mostrano la gola dopo il
  testo, con le sue uscite, e la gola risulta vista. Cambia l’impronta di ogni percorso dalla discesa in poi,
  quindi le attese dei percorsi della fuga vanno ricontrollate. È la scelta che dà al giocatore la stanza
  d’arrivo descritta, come dopo ogni altro spostamento.

In tutti e due i casi il testo, che oggi è copiato, può diventare un testo con un nome
(`Il testo "la discesa" è "…".`, poi `dire "[la discesa]"` nelle due regole): le due regole hanno verbi e
bersagli diversi, quindi `oppure` non basta a unirle.

---

## 9. Da dove viene ogni cosa

- Il repository FAVELLA1, commit `c334f34` (tag `v1.5.0`): `documentazione/piano-1.5.0.md` (il piano
  approvato da Simone, con le decisioni), `documentazione/grammatica-1.5.0.md` §28 (la semantica precisa),
  `CHANGELOG.md` (1.5.0), il manuale (le frasi nuove nei capitoli a cui appartengono e nel riepilogo).
- Le prove sul Relitto di questo documento: le partite a caso e i percorsi di `collaudo/`, giocati con il
  motore 1.4.4 e con il 1.5.0 confrontando testo e impronta a ogni passo; i collaudi del Relitto su una
  copia della cartella con il motore 1.5.0; la frase dei fronti su un’altra copia. Nessun file di questa
  cartella è stato cambiato, tranne questo documento, che va committato da chi lavora al Relitto.

---

## 10. Com’è andata (15 ottobre 2026, quinta sessione)

L’autore ha deciso il primo livello del §1: il motore si aggiorna, i `.fav` restano come sono.

- **La copia.** `motore/` rifatta dal tag `v1.5.0`, con il comando del §5 per il codice, la libreria, la
  galleria, gli esempi e il manuale. Di `documentazione/` restano solo le parti che la copia portava già:
  la specifica della grammatica, che passa dalla 1.4.0 alla 1.5.0, il manuale, e in più il piano della
  1.5.0. I file del motore sono identici al tag (a parte i fine riga).
- **La suite del motore.** Dalla 1.5.0 `test_linguaggio.py` legge anche file del sito e di Studio, che
  la copia non porta: si gira su un estratto del tag, 1.286 passati e 0 falliti; `test_collaudo.py` gira
  nella copia, 50 su 50.
- **Il ponte**, prima com’era e poi senza i rimedi del §4: `_nuova_partita` è `nuova_partita`, `_ramo` è
  `prova`, `_mostra_su_un_ramo` è `mostra_situazione`. `_SESSIONE` e l’import di `_mostra_nodo` non ci
  sono più. `_indicizza` resta (serve anche a `rel_indice`, per tutte le cose), e restano i segni a
  sorte riconosciuti dal testo, perché `segnala` vorrebbe dire toccare i `.fav`.
- **I salvataggi.** Il ponte riconosce il caso del §6: se l’impronta della storia, ricalcolata con la
  versione del motore scritta nel salvataggio, torna, i `.fav` sono gli stessi ed è cambiato soltanto il
  motore. Allora una partita che torna alla stessa impronta è «identica», senza avviso; se non torna è
  «ricostruita», e l’avviso dice che è cambiato il motore. Il salvataggio automatico vero dell’autore
  (0.2.0, turno 17, motore 1.4.4) si carica «identica». `collaudo/salvataggi.py` prova i due casi nuovi
  (11 casi in tutto).
- **I collaudi**, con il ponte nuovo: regressioni con le riprese 14 su 14; pulsanti 14 su 14 (1.291
  comandi, 0 con lo stesso stato e una risposta diversa); menu 14 su 14, sei finali; salvataggi 463 su
  463; eventi 84 su 84; tipografia 14 su 14 e 1.131 stringhe; le prove dell’app 56 su 56; `cargo test`
  3 su 3.

Restano decisioni dell’autore, con le loro ragioni nei §7 e §8: le frasi nuove nei `.fav`, la frase dei
fronti, la discesa di `fuga.fav`.

---

## 11. La risposta dell'autore (16 ottobre 2026)

**§7 e §8: i `.fav` restano congelati.** Il motore 1.5.0 gira identico sul testo di oggi (14 percorsi su 14, salvataggi compatibili); le frasi nuove, la frase dei fronti e la scelta sulla discesa (`fuga.fav:34-35`) non si adottano. Se un giorno il testo si riapre, si riparte da questo documento.
