# Fase 2 — il ponte e il modello d’azione

**Che cosa si è costruito, che cosa si è deciso, che cosa si è misurato.** 14 ottobre 2026, versione
0.2.0. È la fase 2 del piano (`06-app-desktop.md`, §14), che si chiude quando i sei finali si giocano
in CPython con il solo modello d’azione e salvare e caricare tornano allo stesso stato. Tutte e due le
cose sono vere: i numeri sono al §1, il modo per rifarli al §8.

L’autore ha delegato le scelte tecniche, pratiche e stilistiche di questa fase (06, §18): quelle
prese sono segnate con **Deciso** e si possono correggere.

---

## 1. In sintesi

| | Risultato |
|---|---|
| I sei finali giocati con i soli menu dell’app | **6 su 6**; con gli altri otto percorsi, 14 su 14 |
| I 1.294 comandi dei percorsi, con i soli menu | 1.109 con lo stesso comando, 179 con uno equivalente (stesso stato, stessa risposta), 3 con lo stesso stato e una risposta diversa («inventario», giocato con «aspetta»), 3 senza effetto e saltati («giù» dove non si scende) |
| Voci nel menu di una cosa | **4,1 in media, 10 al massimo** (il risuonatore). Il motore, a soli pulsanti, ne offre 33 |
| Suggerimenti in maiuscolo lungo i percorsi | 41, e tutti e 41 accendono un pulsante dei menu |
| Salvataggi provati | 463: a ogni cambio di stanza e a ogni dialogo di ogni percorso. Tutti tornano identici, e la partita ricaricata continua uguale passo per passo; al primo punto di ogni percorso arriva fino al finale con la stessa impronta |
| Rifiuti e segnalazioni del caricamento | 9 casi su 9: file illeggibile, formato estraneo o più recente, salvataggio danneggiato, storia cambiata («ricostruita»), impronta che non torna («diversa») |
| Eventi per il suono | 84 nella tabella del ponte, 84 visti (sui percorsi e su cinque rami scritti apposta); i sei finali riconosciuti; il ponte non cambia la partita |
| Il ponte dentro Pyodide (pagina di prova, Chromium) | «Vivi» 78 su 78, attese 4 su 4; un turno 7 ms in mediana, 11 al 95° percentile, 33 al massimo; salvataggio al passo 39: 1.658 byte, ricaricato in 243 ms, identico |

Il turno dentro Pyodide costava 6,2 ms nella fase 1; adesso ne costa 7, perché porta con sé le cose
con le loro regole, la mappa e gli stati del suono. Il limite del piano resta 50.

## 2. Che cosa è stato costruito

| Dove | Che cosa |
|---|---|
| `app/src/motore/ponte.py` | Il ponte per la 1.4, completo: per ogni turno gli eventi (con l’apertura a parte), i pulsanti del motore, le cose in vista con i fatti delle loro regole, lo stato del visore, gli stati e gli eventi del suono, il comando scomposto. I salvataggi a riprese. La ricerca del pulsante che gioca un comando, ristretta, se serve, ai comandi dei menu |
| `app/src/azione/modello.ts` | Il modello dei menu del §6 del 06: puro, senza DOM né stato. Da un turno del ponte fa i menu delle cose, le uscite con i loro tasti, le azioni di situazione, gli attrezzi in mano, il servizio, le scelte, i suggerimenti |
| `app/src/azione/situazione.ts` | La tabella delle quattro azioni di situazione |
| `app/src/azione/suggerimenti.ts` | Il riconoscimento dei suggerimenti in maiuscolo |
| `app/src/motore/tipi.ts`, `runtime.ts`, `sorgenti.ts` | I tipi del turno, del salvataggio e del caricamento; `salva`, `carica`, `impronta` nel motore dell’app; `versione.json` dentro Pyodide, dove il ponte legge il formato dei salvataggi |
| `app/prove/azione.test.ts` | 17 prove del modello su turni costruiti a mano (`npm --prefix app run prove`) |
| `collaudo/menu.mjs` | I percorsi giocati con i soli menu del modello: il modello in Node, il motore vero in CPython (`collaudo/servizio_ponte.py`) |
| `collaudo/salvataggi.py` | Salva e ricarica in ogni stanza di ogni percorso |
| `collaudo/eventi.py` | Gli stati e gli eventi del suono |
| `app/src/prova/Prova.tsx` | La pagina di prova salva e ricarica a metà della partita, dentro Pyodide |

**Perché il modello è in TypeScript e il collaudo gira in Node.** Il modello deve essere uno solo:
quello che l’app mostra è quello che il collaudo prova. Scriverlo due volte, in TypeScript per l’app
e in Python per il collaudo, vorrebbe dire provare una copia. Node 22 legge il TypeScript da sé, senza
compilarlo e senza dipendenze nuove; il motore resta in CPython, come in tutti gli altri collaudi, e
parla con Node una riga di JSON per volta. «I sei finali in CPython con il solo modello d’azione»: il
motore è CPython, le scelte sono soltanto quelle dei menu.

## 3. Il ponte

### 3.1 Le funzioni

| Funzione | Che cosa fa |
|---|---|
| `rel_compila(percorso)` | Compila la storia, indicizza le regole dell’autore, legge `versione.json` |
| `rel_avvia(seme)` | Una partita nuova. L’intestazione e il prologo escono in `apertura`, separati dalla prima stanza: nell’app il prologo sta nell’intro, e sulla plancia non si ristampa |
| `rel_comando(comando)` | Un turno |
| `rel_stato()` | Lo stato del visore, da solo |
| `rel_salva(identita, creato)` | Il testo del salvataggio. La build e la data le passa l’app: il ponte resta deterministico |
| `rel_carica(testo)` | Rigioca un salvataggio. Se lo rifiuta, la partita in corso non cambia |
| `rel_impronta()` | L’impronta dello stato |
| `rel_indice()` | Le regole dell’autore per cosa, con i loro effetti (per il collaudo e per capire) |
| `rel_pulsante_per(comando, candidati)` | Il pulsante che gioca un comando di un percorso; con `candidati`, solo fra i comandi dei menu |
| `rel_percorso(percorso)` | I comandi e le attese di un percorso di collaudo |
| `rel_segni_a_sorte()` | Per il collaudo: i segni riconosciuti dal testo sono ancora nel gioco (§7) |

### 3.2 Il turno

| Campo | Che cosa porta |
|---|---|
| `eventi` | Il flusso del motore, tipizzato: stanza, testo, elenco, dialogo, opzione, sistema, fine |
| `apertura` | Solo nel primo turno: l’intestazione e il prologo |
| `pulsanti` | Ciò che il motore offre, grezzo (`gioco.pulsanti`) |
| `cose` | Le cose in vista: nome, altri nomi, se si prende, se è una persona, le radici delle proprietà, i verbi con una regola sulla cosa sola, quelli con una regola a due cose, gli effetti delle regole (§4.3) |
| `stato` | Il visore: stanza, atto e titolo dell’atto, aria, matrice, voci, chiavi, tracce, fuga, protezione vitale, inventario, stanze viste, la mappa con le uscite note, il dialogo e il suo nodo, e quali contatori sono già entrati nel gioco |
| `suono` | Gli stati per il suono e gli eventi del turno (§7) |
| `comando` | Il comando del turno in verbo, cosa e seconda cosa. Serve ai suggerimenti con il pronome e agli eventi per comando |
| `esito` | In corso, vinta, persa |

**L’atto.** È il più alto fra quelli delle stanze viste, e il quinto nella fuga: si ricava dalle
stanze visitate, che stanno nell’impronta, e quindi torna uguale dopo un caricamento. I titoli sono
quelli del documento 01: Il margine, Il brusio, Le voci, La mappa, La fuga.

**I contatori del visore** compaiono quando la loro meccanica entra nel gioco (06, §4.3): l’aria con la
tuta, la matrice alla prima lettura (la lastra dati la porta a 4), le voci con il Sintonizzatore, le
chiavi quando si è visto il corridoio della Grande Porta, le tracce di L.V. alla prima.

**La mappa.** Le stanze viste, con le uscite: una direzione nomina la stanza dove porta solo se quella
stanza è già stata vista, come fa il testo del gioco.

## 4. Il modello d’azione

### 4.1 Il menu di una cosa

Prima la cosa, poi il verbo (06, §6.1). Il motore, a soli pulsanti, offre ogni verbo su ogni cosa
(«firma la nave aliena»): il modello mostra un verbo su una cosa solo se ha un motivo.

1. **Sempre** Esamina. Prendi, se la cosa si prende o se l’autore ha scritto una regola per
   prenderla; Lascia, se la porti. Apri o Chiudi, secondo lo stato, per le cose che si aprono. Usa,
   dove l’autore ha scritto una regola per usarla da sola; Usa con…, per le cose che porti e per
   quelle che una regola usa insieme a un’altra. Metti…, dove c’è una regola.
2. **Gli attrezzi**, sulle cose del mondo: Analizza (il multiscanner, dalla tuta in poi), Traduci (la
   matrice), Sintonizza (con il Sintonizzatore), Incidi e Taglia (con la taglierina).
3. **I verbi dell’autore**, dove c’è una regola per quella cosa: Stacca il risuonatore, Firma e
   Completa la placca, Segui le teche chiuse, Suona il sonaglio, Gira il disco, Alza e Abbassa il
   faro, Entra nel boccaporto…
4. **Parla con** chi si può chiamare.

Una regola scritta vale come motivo anche quando oggi direbbe di no: la risposta del gioco a un verbo
fuori tempo è già scritta («Prima bisogna aprirla.»), e il pulsante non deve indovinarla.

### 4.2 Le scelte prese

- **Deciso: la matrice nasce al primo contatto.** Il 06 lega Traduci alla matrice, ma non dice quando
  chi gioca sa di averla. Il gioco lo dice nel vestibolo: «La tuta prova a tradurre e ti restituisce
  una sillaba, poi niente». Da lì Traduci compare; prima, sulla Santa Maria con la tuta addosso,
  sarebbe un attrezzo che la storia non ha ancora mostrato.
- **Deciso: gli attrezzi si usano sul mondo.** Sulle cose che porti compaiono solo dove l’autore ha
  scritto una regola: si analizza la stele presa, non la propria cella d’aria; non si incide la
  taglierina con sé stessa. Con gli attrezzi su tutto, il menu di una cosa in tasca arrivava a 13
  voci.
- **Deciso: lo scanner di bordo.** Senza la tuta, Analizza compare solo dove l’autore lo ha previsto:
  la massa vista dalla plancia («una scansione lunga»).
- **Deciso: un verbo che non cambierebbe niente non compare.** Il ponte ricava dalle regole l’effetto
  di ogni verbo su ogni cosa («alza il faro» lo fa pieno, «indossa la tuta» la fa vestita). Se la cosa
  ha già tutto quello che il verbo le darebbe, il verbo sparisce: il faro pieno non si alza, la tuta
  indossata non si indossa, la porta aperta non si apre. Così Accendi e Alza, che sul faro l’autore
  ha scritto come sinonimi, non compaiono più insieme a Spegni e Abbassa: ne restano due. Esamina,
  Prendi e Lascia restano sempre (un disco posato deve potersi riprendere).
- **Deciso: Usa da solo solo con una regola.** «Usa la tuta», «usa la postazione», «usa la cella di
  riserva» sì; «usa il visore» no, perché il motore risponderebbe soltanto «Con cosa vuoi usarlo?».
- **Deciso: Usa con… mostra tutte le cose possibili**, non solo quelle giuste (06, §6.1): decidere
  resta a chi gioca. Le coppie scritte dall’autore il modello non le guarda.

### 4.3 Le azioni di situazione

Quattro righe in `situazione.ts`: **Accosta** sulla plancia, **Costeggia** nella sala delle teche,
**Rientra** sullo scafo, **Ricarica la tuta** nel laboratorio di risonanza. Compaiono nella loro
stanza, se il motore offre il comando; che cosa risponde il gioco fuori tempo (accostare due volte,
ricaricare a generatore spento) lo dice il testo. **Deciso:** i loro verbi non compaiono anche sulle
cose («Ricarica» sulla tuta, ovunque, era rumore).

### 4.4 Il resto dello schermo

- **Le uscite** hanno il loro tasto (06, §6.2): le frecce per i punti cardinali, PagSu e PagGiù per
  su e giù, Inizio e Fine per dentro e fuori, il tastierino per le direzioni intermedie.
- **Il servizio** è Guarda e Aspetta. Annulla, Salva e Carica sono dell’app, non del motore; l’inventario
  è la fascia «Con te».
- **Le scelte**, fuori dall’esplorazione: le risposte di un dialogo con i numeri da 1 a 9, il Sì e il
  No di una conferma con S e N.
- **Gli attrezzi in mano**: per ogni attrezzo i suoi verbi e le cose su cui si usano. È il percorso al
  contrario del §6.1 (si sceglie la taglierina, poi la giuntura); i comandi sono gli stessi dei menu.

## 5. I suggerimenti in maiuscolo

Il gioco scrive i suoi indizi in maiuscolo, in quattro forme, tutte riconosciute:

| Forma | Esempio | Diventa |
|---|---|---|
| il comando intero | «(Per chiamare Yusuf: PARLA CON YUSUF.)» | parla con Yusuf |
| il verbo, poi la cosa in minuscolo | «il multiscanner lo troverebbe: ANALIZZA lo scafo nero.» | analizza lo scafo nero |
| il verbo con il pronome | «Lo scanner saprebbe leggerla: ANALIZZALA.» | analizza la cosa del comando appena dato |
| l’infinito, anche con il pronome | «adesso puoi ACCOSTARE», «dovresti STACCARLO» | l’azione Accosta; stacca il risuonatore |

Una frase vale se la sua prima parola è un verbo che il motore conosce adesso, all’imperativo o
all’infinito, con o senza pronome. Le altre maiuscole del gioco (IL NAVARCA:, MATERIALE NON IN
ARCHIVIO, PROTEZIONE VITALE) non cominciano con un verbo e restano testo; le righe di sistema del
motore («Scrivi ANNULLA…») non si guardano. Una frase che non nomina una cosa precisa («SINTONIZZA
le cose delle stanze silenziose») accende l’attrezzo del suo verbo.

## 6. I salvataggi

### 6.1 Il file

| Campo | Che cosa |
|---|---|
| `formato` | `il-relitto-silente/salvataggio` |
| `versione` | il formato dei salvataggi, da `versione.json` (oggi 1) |
| `gioco`, `identita`, `creato`, `motore` | la versione del gioco, la build dell’app, la data, la versione del motore |
| `impronta_storia` | SHA-256 dei quattordici `.fav` e della versione del motore |
| `seme` | il seme del caso della partita |
| `riassunto` | stanza, atto, turno, aria, esito: per i posti dei salvataggi, senza rigiocare |
| `partita` | il salvataggio del motore: la sequenza effettiva dei comandi, l’impronta dello stato |

Caricare vuol dire rigiocare da capo, con lo stesso seme, e confrontare (`sviluppo/VERSIONI.md`, §4):
**identica** se storia e impronta tornano; **ricostruita** se la storia è cambiata dopo il salvataggio,
e il gioco lo dice; **diversa** se la storia è la stessa e l’impronta no, ed è un difetto. Un formato
più recente si rifiuta con un messaggio che chiede di aggiornare il gioco; uno più vecchio passa da
`_migra`, che oggi non ha niente da fare.

Il file lo scrive e lo legge il processo Tauri, nella cartella dei salvataggi (fase 3): il ponte dà e
riceve il testo.

### 6.2 Due difetti trovati, e corretti nel ponte

**Il punto di partenza era prima della prima stanza.** Il motore fissa lo stato da cui rigiocare
(`_stato_iniziale`) quando sistema il giocatore, prima di mostrare la plancia; ma mostrare la plancia
la segna come vista. Rigiocando da lì, la plancia risultava mai vista: un salvataggio nella stiva si
caricava «diverso». Il ponte fissa il punto di partenza dopo l’apertura, e mette il seme prima.

**Caricare segnava una stanza come vista.** Dopo un caricamento il motore rimostra la stanza, e
mostrarla la segna come vista. La gola del ritorno, nella fuga, si raggiunge con una regola che non la
mostra: nella partita caricata diventava vista, nell’originale no, e l’impronta non tornava più. Il
ponte mostra la stanza su un ramo della partita, poi disfatto.

Tutti e due vengono dal motore, che non si tocca: sono le lezioni L18 e L19 di `05-lezioni-per-favella.md`.

## 7. Il suono: gli stati e gli eventi

**Gli stati** (bibbia sonora, §2.4) sono 51: quelli del visore, più il faro del casco, il bengala, la
minaccia e il groviglio, la teca della serra, il seme e il risuonatore (com’è, e se lo porti), i tagli,
l’archivio, la nota, l’aggancio, la scansione, la proiezione, la ricarica, la voce dei nomi, le porte
(interna, circolare, la Grande Porta), il pannello, la giuntura, l’altare, il terminale, il cristallo,
il disco, il kit, la cassetta, il registro, le tacche, la cella d’aria, le cose che hanno già reso la
loro eco.

**Gli eventi** si trovano per differenza fra prima e dopo il turno (§1.6 della bibbia), in quattro modi:

| Modo | Esempi | Quanti |
|---|---|---|
| un passaggio di stato | la scansione lunga (assente → completa), gli arpioni (accostato → fatto), il primo contatto, la teca della serra, la fuga | 45 |
| ricavati dal ponte | la stanza e i passaggi di stanza con un nome (il boccaporto, la discesa, il casco tolto), il dialogo e i suoi nodi, i contatori (chiave, eco, risonanza, traccia, taglio), la matrice, l’aria con la differenza, le soglie (ambra, ipossia), la protezione vitale che entra ed esce, l’attrezzo al lavoro, il finale con il suo nome | 26 |
| il comando, dove lo stato non cambia | il reattore ascoltato e toccato, le venature toccate, il sonaglio suonato, la radio, la scatola nera | 8 |
| il testo, per i soli segni tirati a sorte | il gemito della nave, il brusio che cala, le pareti che si accendono, i crolli, le incrinature | 5 |

L’ultima riga è l’unica eccezione alla regola di non leggere il testo: quei segni non lasciano stato.
Li si riconosce dall’inizio del testo della loro regola, che è congelato come tutto il gioco, e il
collaudo controlla che ci sia ancora: se il testo cambiasse, il collaudo cadrebbe prima del suono.

Il caso del suono resta fuori dal gioco: il ponte non tira a sorte e non tocca lo stato. Il collaudo lo
controlla giocando i sei finali due volte, dal ponte e dal motore da solo: stessa impronta a ogni passo.

## 8. I collaudi

Dalla radice del progetto:

| Comando | Che cosa prova | Esito | Tempo |
|---|---|---|---|
| `python collaudo/regressioni.py --riprese` | il gioco non cambia | 14 su 14 | ~1 min |
| `python collaudo/pulsanti.py` | i percorsi con i pulsanti grezzi del motore | 14 su 14 | ~2 min |
| `node collaudo/menu.mjs` | **i percorsi con i soli menu del modello** | 14 su 14, 6 finali su 6, 41 suggerimenti accesi | ~1 min |
| `python collaudo/salvataggi.py` | **salva e ricarica in ogni stanza** | 463 su 463, 9 rifiuti su 9 | ~3 min |
| `python collaudo/eventi.py` | gli stati e gli eventi del suono | 84 eventi su 84, i finali, il ponte indisturbato | ~1 min |
| `npm --prefix app run prove` | il modello su turni costruiti a mano | 17 su 17 | 0,1 s |

Un comando di un percorso che non cambia niente, nemmeno il turno, ora si salta («senza effetto»):
con i menu non si preme niente. Prima lo si giocava con un altro comando a vuoto («usa la tuta», che
risponde «Con cosa vuoi usarla?»): uno stato uguale per caso, non una scelta di chi gioca.

## 9. Che cosa passa alla fase 3

- **Il fiore.** Le voci di un menu portano il loro gruppo (base, attrezzo, autore, dialogo): il fiore
  della membrana li può disporre su due anelli, la base vicino al baccello e gli attrezzi fuori. Dieci
  voci è il caso peggiore, e capita a una cosa sola.
- **Il costo in aria prima di agire** (D16): il ponte manda l’evento dell’aria con la differenza e il
  comando scomposto; il visore può stimare il costo di un verbo dopo averlo visto una volta. Non è nel
  modello di adesso.
- **I suggerimenti accesi** per qualche secondo, e i nomi delle cose toccabili nel testo (D15): il
  modello dice quale pulsante e quale cosa; il come è dell’interfaccia.
- **I salvataggi su disco**: sei posti più uno automatico a ogni cambio di stanza (06, §4.6), F5 e F9,
  scritti dal processo Tauri in Documenti. Il `riassunto` basta a mostrare i posti senza rigiocare.
- **La pagina di prova** resta quella grezza della fase 1, con i pulsanti del motore: l’interfaccia
  vera, con i menu del modello, è il lavoro della fase 3.
