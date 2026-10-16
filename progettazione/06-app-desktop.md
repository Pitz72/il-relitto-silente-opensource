# Il Relitto Silente — l’app desktop

**Visione, stile, design e piano di fattibilità.** Versione 0.4, 14 ottobre 2026. Le decisioni
prese dopo le tavole sono nel §17 e nel §18 e valgono su tutto il resto del documento; quelle della
fase 2 (il modello d’azione) sono in `12-fase-2-ponte-e-modello.md`, quelle della fase 3 (il sistema
visivo) in `14-fase-3-sistema-visivo.md`.

Due tavole visive accompagnano questo documento. `06-proposte-visive.html`: le tre direzioni di
stile, lo schermo della direzione B nelle sue atmosfere, il visore dell’aria, il dialogo con Yusuf
e un abbozzo animato della sequenza d’apertura. `06-proposta-membrana.html`: la direzione C in
schermate complete, con la membrana che cresce, il menu a fiore, l’aria come cellula e il dialogo
con l’Anziano.

Dalla 0.1: l’autore preferisce la direzione C. Rivista con la membrana che cresce (§3), la C è
diventata anche la proposta di questo documento; il §4 descrive lo schermo nella forma B, che
resta valida come struttura (testo, strumenti, azioni), e il §4.7 dice che cosa cambia con la C.

---

## 0. In sintesi

Il Relitto Silente diventa un’applicazione desktop per Windows e Linux, costruita con **Tauri 2**
(Rust). Niente browser, niente server, niente rete: una finestra a schermo intero, il motore
FAVELLA vero al suo interno, un’interfaccia a pulsanti al posto del parser, suono, atmosfere di
colore, una sequenza d’apertura e sei sequenze di chiusura animate in codice.

L’idea che regge tutto: **il fiato è l’interfaccia**. Nel gioco ascoltare costa aria. Nell’app
la cifra dell’aria è il cuore dello schermo: lo colora, lo fa respirare, e quando scende sotto il
15% fa vacillare anche la tipografia, come già fanno le descrizioni.

| | |
|---|---|
| Piattaforma | Tauri 2 (Rust) + React 19 + TypeScript + Vite; il motore FAVELLA 1.4.4 in Python, dentro Pyodide |
| Sistemi | Windows 10/11 (installer e versione portatile), Linux (AppImage, .deb; Ubuntu 22.04 e successive) |
| Interazione | Solo pulsanti. Prova fatta: i 1.294 comandi dei 14 percorsi di collaudo si giocano tutti con i pulsanti del motore |
| Stile | **Deciso: «Membrana»** (C, rivista): sulla Santa Maria l’interfaccia è acciaio; al primo contatto il relitto la colonizza e la fa crescere a modo suo |
| Suono | Motore audio in Rust (`kira`): ambienti, respiro legato all’aria, il re del reattore come filo musicale |
| Intro e outro | Animate in codice (canvas e WebGL), sincronizzate alla colonna sonora; l’intro nasconde il caricamento del motore |
| Stima | 17–22 sessioni di lavoro, in undici fasi (§14). Il rischio maggiore è Linux (WebKitGTK), e la fase 1 serve a toglierlo per primo |

---

## 1. Da dove si parte

**Il gioco** è finito, rivisto e corretto (`04-revisione.md`): 23 stanze, 93 oggetti, 6 finali,
14 percorsi di collaudo con le loro attese.

**Il motore 1.4.4** porta due cose che rendono il progetto più semplice di quanto fosse per Il
Viaggiatore (che usava la 1.2.0):

- **i pulsanti** (`gioco.pulsanti`, grammatica §23.2): in ogni momento il motore restituisce in
  JSON la fase (gioco, dialogo, conferma, fine), le scelte, gli oggetti visibili e portati, i
  verbi con i loro oggetti, le uscite, i comandi di servizio. Con la frase
  `I comandi si scelgono con i pulsanti.` anche i verbi d’autore compaiono da subito;
- **il flusso di eventi** (§23.3): il motore non stampa testo, emette eventi tipizzati
  (`stanza`, `testo`, `elenco`, `dialogo`, `opzione`, `domanda`, `fine`…). L’interfaccia sa che
  cosa sta mostrando senza indovinarlo dal testo.

**Il precedente.** Il Viaggiatore ha già percorso questa strada con Electron: app React con il
motore in Pyodide, un ponte Python fra interfaccia e motore, un trailer procedurale su canvas con
la sua colonna sonora, salvataggi che rigiocano la partita e ne verificano l’impronta SHA-256,
aggiornamento automatico da GitHub, una CI che costruisce i pacchetti e li autoverifica. Quasi
tutto si riusa come idea, e una parte anche come codice (il ponte, i salvataggi, la struttura del
trailer). Cambia il guscio: Tauri al posto di Electron, Rust al posto di Node.

**Le misure fatte per questo documento.**

| Che cosa | Risultato |
|---|---|
| Copertura dei pulsanti | 1.294 comandi su 1.294 giocabili con i pulsanti del motore; 264 con una forma diversa che porta allo stesso stato («segui le teche chiuse» per «segui la parete», «usa la batteria con il pannello» per «…sul pannello») |
| Verbi per oggetto, tenendo solo quelli che l’autore ha scritto | 2,5 in media, 7 al massimo (il risuonatore: esamina, analizza, ascolta, prendi, stacca, tocca, usa) |
| Motore, in CPython | compilazione del gioco 0,25 s; 3,5 ms per turno compresi i pulsanti; istantanea dello stato 80 KB |
| Macchina di sviluppo | Rust 1.95 (MSVC), Visual Studio 2022 con il C++, Node 22, Python 3.12, runtime WebView2 155, WSL 2 con Ubuntu, `gh` |

In Pyodide il motore è più lento di qualche volta: la compilazione starà fra uno e tre secondi,
nascosta dietro l’intro; un turno resta sotto i 50 ms.

---

## 2. Visione

**Il fiato è l’interfaccia.** Sei principi, nell’ordine in cui vincono quando sono in conflitto.

1. **Il testo prima di tutto.** È un’avventura testuale scritta come un racconto. La colonna del
   testo ha la tipografia di un libro, le misure di un libro (65–75 caratteri per riga) e il posto
   migliore dello schermo. Il resto le gira intorno.
2. **Diegetico, non decorativo.** Ogni elemento dell’interfaccia esiste nel mondo del gioco. Sulla
   Santa Maria lo schermo è la console di bordo; con la tuta addosso diventa il visore. Il numero
   dell’aria è la cifra sul bordo del visore, la mappa è quella che il multiscanner ricostruisce,
   le immagini del relitto sono le sue letture. Niente che William non potrebbe vedere.
3. **L’atmosfera è uno stato del gioco.** Colore, luce, suono e movimento non decorano: dicono dove
   sei e quanto fiato ti resta. Le stesse variabili che il motore conta (l’atto, la fuga, la
   protezione vitale, l’aria) cambiano l’aspetto dello schermo.
4. **Pulsanti che si leggono come parole.** Ogni pulsante manda un comando che si potrebbe
   scrivere, in italiano. Si mostra solo ciò che ha senso per quella cosa, in quel momento.
5. **Niente web.** Niente selezione del testo per sbaglio, niente menu contestuale del browser,
   niente zoom col tasto Ctrl, niente barre di scorrimento di sistema, niente rete. Schermo
   intero, cursore proprio, tastiera completa.
6. **Accessibile senza compromessi visibili.** Movimento ridotto, testo più grande, colori non
   come unico segnale: sono opzioni, ma il gioco è progettato perché funzionino da subito.

---

## 3. Tre proposte di stile

Tutte e tre condividono la colonna di testo e il sistema a pulsanti. Cambia il modo in cui lo
schermo racconta il mondo. Si vedono una accanto all’altra nella tavola visiva, §1.

### A — «Registro»

Lo schermo è una pagina del registro di bordo. Fondo nero carta, testo serif grande, margini
larghi, intestazioni in maiuscoletto. L’interfaccia è quasi assente: un filo sottile in alto con
l’aria e l’atto, le azioni come voci di un indice a piè di pagina. Le immagini, quando ci sono,
sono vignette in duotono, come incisioni.

- **Riferimenti**: *80 Days* e *Heaven’s Vault* (inkle), la colonna di *Disco Elysium*.
- **Pro**: è la più fedele al libro (*Dal registro della Santa Maria*); la lettura è la migliore.
- **Contro**: poco «gioco commerciale» a colpo d’occhio; l’aria perde forza come presenza.

### B — «Visore» (consigliata)

L’interfaccia è il visore della tuta. Al centro la colonna del testo, pulita come nel Registro;
intorno, la cornice diegetica: il bordo del visore con la cifra dell’aria, la telemetria, la vista
del multiscanner, la mappa ricostruita. Prima della tuta lo stesso telaio è la console della Santa
Maria, in ambra; quando indossi la tuta, il visore si accende sopra la console. Nel relitto il
telaio si raffredda; nella fuga si incrina.

- **Riferimenti**: *Alien: Isolation* e *Observation* per l’interfaccia di bordo, *Citizen
  Sleeper* per il rapporto fra testo e strumenti, *Signalis* per la severità grafica.
- **Pro**: tiene insieme il testo da libro e l’impatto da gioco; ogni meccanica ha già il suo
  posto nel visore; le atmosfere hanno un telaio da trasformare.
- **Contro**: va tenuto a bada. Lo stile «HUD fantascientifico» tende al rumore (righe di
  scansione, numeri che scorrono, bagliori): la regola è che niente si muove vicino al testo
  mentre lo leggi.

### C — «Membrana»

Il linguaggio del relitto: una nave cresciuta, non costruita. Le linee dell’interfaccia sono
venature che crescono, si accendono e si spengono; il testo sta su una superficie che respira; le
cornici non hanno angoli. Il verde del seme e l’azzurro della luce del corridoio sono gli unici
colori.

- **Riferimenti**: le venature e la «madreperla» delle pareti del gioco, *Heaven’s Vault* per i
  glifi da tradurre.
- **Pro**: la più originale.
- **Contro** (nella prima stesura): non funziona sulla Santa Maria, che è acciaio; è la più
  costosa da animare e la meno leggibile per i contatori.

**C rivista: la membrana cresce.** I tre limiti si risolvono così (schermate complete in
`06-proposta-membrana.html`):

- **La Santa Maria è il punto di partenza.** La membrana non c’è dall’inizio. Nell’Atto I
  l’interfaccia è acciaio: angoli, targhe a stampo, ambra, l’aria come anello preciso. Al primo
  contatto nel vestibolo («per farsi sentire beve dalla tua stessa batteria») le venature entrano
  dai bordi, gli angoli della lamina del testo si arrotondano, la lente della vista diventa un
  occhio, l’anello dell’aria diventa una cellula. La nave che ascolta, il canale «aperto da
  remoto», la batteria che beve: l’interfaccia lo racconta. Nella protezione vitale le venature si
  spengono; nella fuga si lacerano e lampeggiano rosse; nel finale «Vivi», di nuovo sulla Santa
  Maria, resta una venatura verde sola: quella del seme.
- **La leggibilità.** Le forme si muovono, le cifre no: numeri mono grandi dentro le forme, ogni
  stato anche scritto. La lamina del testo respira solo ai bordi, in diciotto secondi; le
  venature crescono dai bordi dello schermo e girano intorno al testo e agli strumenti, senza
  attraversarli mai.
- **Il costo.** Le venature non sono disegnate a mano: le genera un algoritmo di crescita a
  ramificazioni, con le zone da evitare. Rispetto alla B, una o due sessioni in più nella fase 3;
  le venature su canvas entrano nella prova di prestazioni su Linux della fase 1.

**Proposta: C rivista**, che è la preferita dell’autore e, con la crescita, anche la più forte per
la storia: lo schermo cambia natura insieme a chi gioca. La B resta l’alternativa più economica e
più prudente; la struttura dello schermo (§4) vale per tutte e due.

---

## 4. Lo schermo di gioco (direzione B)

Riferimento 1920×1080, scala fino a 1280×720; sugli schermi più larghi crescono i margini, non la
colonna del testo.

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ATTO II · IL BRUSIO          VESTIBOLO DELLE GOLE                    ◐ ARIA 58  ▾ menu│  barra del visore
├───────────────────────────────────────────────────────┬──────────────────────────────┤
│                                                       │  VISTA · multiscanner        │
│   Vestibolo delle gole                                │  ┌────────────────────────┐  │
│                                                       │  │ ricostruzione a punti  │  │
│   Una sala bassa e tonda, la prima vera sala della    │  │ della stanza, oggetti  │  │
│   nave. Tre gole si aprono nella parete verso il      │  │ marcati                │  │
│   buio: quella larga, a ovest, sale verso una         │  └────────────────────────┘  │
│   luminescenza azzurrina; quella di mezzo scende…     │                              │
│                                                       │  ARIA        ◐ 58  ambra     │
│   > stacca il risuonatore                             │  MATRICE     ▮▮▯▯▯▯ 18%       │
│   Regoli la taglierina al minimo e incidi il bordo    │  VOCI        ▪▪▪▪▫ 4  ◆◆ 2    │
│   della nicchia…                                      │  CHIAVI      ◇◇◇              │
│                                                       │                              │
│   colonna del testo: 62–66% della larghezza           │  MAPPA (stanze viste)        │
├───────────────────────────────────────────────────────┴──────────────────────────────┤
│  USCITE  ⟵ ovest   ↓ giù   → est       QUI  [la nicchia] [le gole] [il risuonatore]   │  barra delle azioni
│  CON TE  [taglierina] [sintonizzatore] [faro ◐]          AZIONI  [aspetta] [diario]   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 La colonna del testo

- Il turno corrente sta in alto, in grande; i turni precedenti scivolano su e sbiadiscono, e si
  rileggono nel **diario**. Mai un muro di testo che scorre come un terminale.
- Il testo appare con una rivelazione rapida, a righe (non lettera per lettera), che un clic
  completa. Si può spegnere.
- Il comando appena dato compare sopra la risposta, piccolo, in maiuscoletto: «STACCA IL
  RISUONATORE». Così il diario resta la trascrizione della partita.
- I nomi degli oggetti nel testo si possono toccare (opzione, attiva di base): toccare «nicchia»
  nella descrizione apre il menu della nicchia, come toccare il suo pulsante.

### 4.2 La grammatica tipografica

Il motore manda il testo così com’è, byte per byte. L’interfaccia lo veste secondo il tipo di
evento e secondo pochi segni che il gioco già usa in modo costante.

| Che cosa | Come si riconosce | Trattamento |
|---|---|---|
| Nome della stanza | evento `stanza` | display grande, poi una riga sottile |
| Descrizione, risposta | evento `testo` | serif, 20–22 px, interlinea 1,55 |
| «Puoi vedere qui», «Uscite» | evento `elenco` | non si stampa: diventa la barra delle azioni |
| Voce del relitto | `IL NAVARCA:`, `LO SCRIBA:` (maiuscolo + due punti + «…») | rientro, corsivo, filo verticale ciano; il nome in maiuscoletto |
| Voce di L.V. (scatola nera) | caporali dopo «Nella cuffia, rovinata, una voce d’uomo» e nel prologo | carattere della registrazione: grana, buchi come pause grafiche, filo verde spento |
| Lettura dello scanner | `ANALISI`, `LETTURA:`, `MATRICE DI TRADUZIONE`, `DATAZIONE` | mono, maiuscoletto, su una fascia scura |
| Protezione vitale | `PROTEZIONE VITALE` | il visore lampeggia in rosso; la frase resta nel testo |
| Suggerimento del gioco | parentesi con un’azione in maiuscolo: «(PARLA CON L’ECO.)» | la parentesi diventa un pulsante evidenziato; il testo resta, attenuato |
| Dialogo | eventi `dialogo` e `opzione` | cambia la modalità dello schermo (§4.5) |
| Finale | evento `fine` | parte l’outro (§11) |

### 4.3 Il visore: l’aria e gli altri contatori

I contatori compaiono quando la meccanica entra nel gioco: nessuno spiega niente prima del tempo.

| Strumento | Compare | Mostra |
|---|---|---|
| **Aria** | quando indossi la tuta | la cifra grande e un anello; verde, ambra sotto 60, rosso sotto 30, intermittente sotto 15. Il bordo del visore respira al ritmo del fiato, che accelera quando l’aria scende. A ogni consumo la cifra scende con un segno (−4) che si dissolve |
| **Protezione vitale** | sotto 30, prima della fuga | una fascia rossa sul visore; i pulsanti di ascolto e traduzione si spengono, con il motivo al passaggio del mouse |
| **Matrice** | alla prima analisi della lastra dati | la percentuale, e una fila di glifi che diventano lettere a ogni soglia (4, 18, 75, 100) |
| **Voci** | quando prendi il Sintonizzatore | gli echi di superficie come tacche, le risonanze profonde come rombi; senza il totale, per non dire quante ne mancano |
| **Chiavi** | quando vedi la Grande Porta | tre incavi (ovoidale, rettangolare, a faccette) che si riempiono |
| **Atto** | sempre | «ATTO II · IL BRUSIO» nella barra del visore, con un cartello animato al passaggio d’atto |

Le tracce di L.V. non stanno nel visore: hanno una pagina del diario, il **fascicolo L.V.**, che si
compone da sé (la giuntura, le tacche, il cavo guida, l’uomo, la voce).

### 4.4 La vista e la mappa

- **Vista.** Sulla Santa Maria è la telecamera di bordo di quella stanza; nel relitto è la
  ricostruzione del multiscanner (§8). Nel dialogo diventa il canale del comunicatore.
- **Mappa.** La disegna il multiscanner man mano: compaiono solo le stanze viste, con le uscite
  conosciute. Nella fuga i passaggi crollati si spengono.

### 4.5 Le modalità dello schermo

| Modalità | Quando | Che cosa cambia |
|---|---|---|
| Esplorazione | fase `gioco` | lo schermo descritto sopra |
| Dialogo | fase `dialogo` | la vista diventa grande (Yusuf al comunicatore, l’onda della voce giovane, la figura dell’Anziano); le opzioni sono carte numerate, da 1 a 9 sulla tastiera |
| Conferma | fase `conferma`, e i due punti di non ritorno | una domanda al centro, Sì e No; il resto si scurisce |
| Cartello d’atto | al cambio d’atto | due secondi, sopra il gioco, saltabili |
| Finale | evento `fine` | l’outro (§11) |

**Punti di non ritorno.** Il gioco ne ha due: entrare nell’anticamera e chiudere gli occhi davanti
all’Anziano. Il primo ha già il suo avviso nel testo; il secondo merita una conferma diegetica
(«Da qui non si torna.»), da decidere (D16).

### 4.6 Fuori dal gioco

- **Menu principale**: lo sfondo è la scena finale dell’intro (la massa che beve le stelle), viva
  e lentissima. Continua, Nuova partita, Carica, Opzioni, Registro dei finali, Riconoscimenti, Esci.
- **Pausa** (Esc): Riprendi, Salva, Carica, Opzioni, Menu principale.
- **Registro dei finali**: le sei righe del registro di bordo, che si sbloccano finale dopo finale.
  Invoglia a rigiocare senza parlare di «trofei».
- **Diario** (Tab): la trascrizione, il fascicolo L.V., le voci ascoltate (rileggibili), le
  traduzioni lette alla soglia più alta raggiunta.
- **Salvataggi**: sei posti più uno automatico a ogni cambio di stanza. Si salva con F5 e si carica
  con F9, come nel Viaggiatore.

### 4.7 Che cosa cambia con la C

La struttura resta (testo a sinistra, vista e strumenti a destra, azioni in basso); cambia la
forma, e con la forma alcune interazioni.

| Elemento | Direzione B | Direzione C |
|---|---|---|
| Testo | colonna in un riquadro | lamina dai bordi irregolari, che respira lentamente; nell’acciaio è un riquadro con l’intestazione del registro |
| Vista | riquadro | lente ovale, un occhio; nell’acciaio il riquadro della telecamera |
| Aria | anello, e la cifra nella barra del visore | cellula che respira e si contrae; nell’acciaio un anello graduato |
| Strumenti | righe di telemetria | satelliti intorno alla cellula: la matrice come glifi, le voci come spore |
| Mappa | stanze come riquadri | una costellazione: le stanze sono punti, i passaggi venature |
| Azioni | barra con bussola e pulsanti | un ramo che attraversa il fondo dello schermo; le cose sono baccelli, le uscite «bocche» |
| Menu di una cosa | pannello a destra | un fiore: i verbi si aprono a ghirlanda sopra il baccello, nella fascia libera sotto il testo |
| Suggerimenti in maiuscolo | pulsante acceso | la parola si accende di luce propria, come le venature |
| Dialogo con l’Anziano | carte numerate | la figura fatta di punti, i semi come risposte |

---

## 5. Le atmosfere

Il tema dello schermo è un insieme di variabili CSS (colori, luce, grana, movimento) e di
parametri audio. Cambia quando cambiano le variabili del gioco; il passaggio dura uno o due
secondi, mai di colpo.

| Atmosfera | Quando | Colori (fondo · testo · accento) | Luce e grana | Suono | Movimento |
|---|---|---|---|---|---|
| **Santa Maria** | Atto I | `#0E0C0A` · `#EDE3D3` · ambra `#F2A03D`, ruggine `#E07A3C`, acciaio `#9AA3A9` | luce al sodio, calda; grana di monitor | il re del reattore, la ventilazione, le lamiere | quasi fermo |
| **Visore** | tuta indossata | la stessa, più il bordo del visore e la cifra verde `#7DE39B` | un vetro sottile ai bordi | il fiato nel casco entra nel mix | il bordo respira |
| **Relitto** | dalla camera di compensazione | `#050C0E` · `#DDEEEF` · ciano `#5FD4DC`, verde vivo `#8BF0A2` | luce fredda azzurrina; venature che corrono lungo i bordi | il brusio (molte voci, nessuna intera); silenzi lunghi | lento, organico |
| **Zone del relitto** | per stanza | variazioni dell’accento: la serra secca e grigia, il laboratorio elettrico, il santuario bianco, l’anticamera nera | | ogni stanza ha il suo fondo sonoro | |
| **Protezione vitale** | aria sotto 30, prima della fuga | il rosso `#FF5247` entra nel visore | il faro scende: la vista si scurisce | i canali secondari tacciono: brusio e voci spariscono, resta il fiato | il bordo respira più in fretta |
| **Fuga** | Atto V | `#100607` · `#F3DEDB` · rosso `#FF5A4A`, ambra `#FFB020` | crepe di luce sui bordi | crolli, il groviglio, la nave che geme | tremito leggero del telaio, mai del testo |
| **Ipossia** | aria al massimo 15 | i colori si spengono del 60% | vignettatura, una leggera aberrazione ai bordi | un filtro passa-basso su tutto; il fiato si spezza | la spaziatura delle lettere vacilla appena |

Tutte le coppie testo-fondo superano 4,5:1 (fra 6,1 e 16,5); il colore dell’aria non è mai l’unico
segnale: anche la forma dell’anello e la scritta cambiano. Con «movimento ridotto» il tremito, la
vignettatura animata e il respiro del bordo si fermano, e l’ipossia resta solo come colore.

**Tipografia.** Tutti i caratteri sono SIL Open Font License e viaggiano dentro l’app.

| Ruolo | Carattere | Perché |
|---|---|---|
| Testo | **Newsreader** (variabile, con le dimensioni ottiche) | disegnato per leggere a schermo a lungo; corsivi belli per le voci |
| Strumenti, letture dello scanner | **IBM Plex Mono** | industriale senza essere freddo, come la Santa Maria |
| Cartelli e targhe della Santa Maria | **Big Shoulders Stencil** | la scritta TSC-1972 sullo scafo |
| Titolo | lettering disegnato in SVG, sulla base di Newsreader Display | si anima nell’intro (§10) |
| Alternativa di leggibilità | **Atkinson Hyperlegible** | per chi la sceglie nelle opzioni |

---

## 6. Il sistema a pulsanti

Il parser sparisce. Nel `.fav` cambia una riga sola, `I comandi si scelgono con i pulsanti.`;
il motore, il testo e i collaudi restano quelli.

### 6.1 Come si compone un’azione

**Prima la cosa, poi il verbo.** Si tocca una cosa (nella barra o nel testo) e si apre il suo
menu. Il menu mostra solo verbi che hanno senso per quella cosa:

1. **sempre**: Esamina; Prendi o Lascia; Usa con… se c’è con che cosa;
2. **gli attrezzi che porti**: Analizza (il multiscanner, dalla tuta in poi), Sintonizza (se hai il
   Sintonizzatore), Traduci (la matrice), Incidi e Taglia (se hai la taglierina). Il verbo nasce
   dall’attrezzo, quindi non svela niente;
3. **i verbi dell’autore** per quella cosa: quelli per cui il gioco ha una regola scritta (Stacca
   sul risuonatore, Firma e Completa sulla placca, Segui sulle teche chiuse, Suona sul sonaglio,
   Gira sul disco). In media restano 2,5 verbi per oggetto, al massimo 7;
4. **Parla con** per chi si può chiamare.

**Gli attrezzi come strumenti in mano.** Nella fascia «Con te» il Sintonizzatore, il
multiscanner, la matrice e la taglierina funzionano anche al contrario: si sceglie l’attrezzo, il
cursore lo prende, e si tocca la cosa. È il modo naturale per «sintonizzare la culla».

**Usa con…** si fa in due tocchi: prima la cosa che usi, poi quella su cui la usi. Le cose
possibili si illuminano tutte, non solo quelle giuste: decidere resta a chi gioca.

**Le azioni di situazione** (Accosta sulla plancia, Costeggia fra le teche, Rientra sullo scafo,
Ricarica la tuta al generatore) hanno un posto fisso, «Azioni», e compaiono dove servono:
una tabella di quattro righe nell’app, più i suggerimenti del testo.

**I suggerimenti del testo.** Il gioco scrive già i suoi indizi in maiuscolo: «Disinserisci il
pilota automatico: adesso puoi ACCOSTARE», «per portarlo via dovresti STACCARLO», «(Per chiamare
Yusuf: PARLA CON YUSUF.)». Il pulsante corrispondente si illumina per qualche secondo. Il testo
insegna il verbo, e l’interfaccia lo indica.

### 6.2 Tastiera

Tutto si fa senza mouse: ogni uscita ha il suo tasto (le frecce per i punti cardinali, `PagSu` e
`PagGiù` per su e giù, `Inizio` e `Fine` per dentro e fuori, il tastierino per le direzioni
intermedie: `TASTI_DELLE_USCITE` in `app/src/azione/modello.ts`), `D` per il diario, i numeri per le opzioni di dialogo, `Spazio` per completare il testo,
`Invio` per confermare, `Esc` per la pausa, `F5`/`F9` per salvare e caricare, `F11` per lo schermo
intero. Il fuoco è sempre visibile e ha lo stile del visore. `Tab` resta al fuoco, come vuole
l’accessibilità: per questo il diario è passato da `Tab` a `D` (`14-fase-3-sistema-visivo.md`, §5).
Tutto questo sta scritto nella pagina «Tasti» della pausa (`PannelloTasti` in
`app/src/gioco/pannelli/Pannelli.tsx`), perché lo schermo da solo non insegna Tab e Invio (14, §15).
Dopo un comando il fuoco torna sulla cosa da cui era partito, anche alla fine di un dialogo; «Usa con…» e
l’attrezzo in mano lo portano sulla prima cosa accesa.

### 6.3 Che cosa garantisce che non ci si blocchi

Filtrare i verbi è un rischio: un verbo nascosto per sbaglio è un gioco che non si finisce. Per
questo il collaudo dell’app gioca i sei finali **usando solo i menu dell’interfaccia**, con i suoi
filtri, e fallisce se un comando necessario non è raggiungibile (§15). La prova di copertura di
questo documento (1.294 su 1.294) è la base di quel collaudo.

### 6.4 Il campo di testo

Non c’è nell’app. Esiste solo nelle build di sviluppo, aperto da un tasto, per provare comandi
durante il lavoro (D20).

---

## 7. Il testo e i caratteri: che cosa non si tocca

Il testo del gioco arriva all’interfaccia esattamente come lo scrive il motore. L’interfaccia può
vestirlo, raggrupparlo, rivelarlo; non lo riscrive. Gli apostrofi, che nei `.fav` sono dritti per
un limite del compilatore (lezione L13), si possono rendere tipografici in fase di stampa a
schermo: è l’unica trasformazione permessa, ed è reversibile.

---

## 8. I riferimenti visivi

Una regola narrativa decide che cosa si vede: **la Santa Maria si fotografa, il relitto no.**
Il multiscanner scrive «MATERIALE NON IN ARCHIVIO»: del relitto non esistono immagini, solo letture.

| Dove | Che cosa si vede | Da dove viene |
|---|---|---|
| Plancia, cuccetta, sala macchine, stiva, boccaporto | la telecamera di bordo: l’immagine, una grana di sensore, una data in sovrimpressione, la luce al sodio | le scene della Santa Maria del sequel (`s_01_b` plancia, `s_03` cuccetta, `s_05` sala macchine, `s_04` stiva, `s_10` boccaporto e tute), trattate in codice. Mai `s_01` né `zoom_s01_teca`, che mostrano il seme nella teca del sequel; mai `s_10_b`, che ha una cassa del sequel (§17). La cuccetta del Relitto ha due brande, una mai usata: l’immagine va rifatta o ritoccata |
| Scafo | la telecamera esterna, la sagoma nera dove le stelle mancano | la Santa Maria del sequel (`still_3-4_canonico`) più il disegno in codice della massa |
| Relitto, 18 stanze | la ricostruzione del multiscanner: nuvole di punti, curve di livello, oggetti marcati, campi che il sensore non legge | **in codice**: una scena per stanza, disegnata da una piccola descrizione (forme, altezze, oggetti). Cambia con lo stato (la teca dissolta, la nicchia vuota, il pilastro acceso) |
| Yusuf | il comunicatore: il ritratto, il canale, l’onda della voce | il ritratto del sequel (`YUSUF_COM`), lo stesso volto del secondo gioco |
| L’eco del Piccolo | solo l’onda della registrazione, che gira su se stessa e, con la risposta giusta, si ferma | in codice |
| L’Anziano | una figura di luce fatta di punti, i bordi che si sfanno come una fotografia esposta troppe volte; al congedo si raccoglie in un punto e scende nel seme | in codice |
| La scatola nera di L.V. | la spia verde, l’onda rovinata con i buchi | in codice |
| Titolo, menu | la massa che beve le stelle, la Santa Maria con il faro di prua | in codice (è la scena finale dell’intro) |

La copertina originale (`grafica/cover-relitto.jpeg`) racconta la nave dell’originale, un
corridoio di metallo; il remake ha pareti «cresciute, con una trama fine come d’osso». Non va
usata come immagine del relitto; può restare come omaggio nei riconoscimenti.

Le immagini del sequel sono dell’autore. Se il gioco verrà venduto, conviene verificare i termini
dello strumento con cui sono state generate (D17).

---

## 9. Il suono

### 9.1 Architettura

Il suono gira in **Rust**, con `kira` (una libreria audio per giochi: missaggio, flussi, filtri,
riverbero, transizioni). L’interfaccia non riproduce suoni: manda al processo Rust dei **segnali**
(«stanza: vestibolo», «aria: 58», «evento: groviglio vicino», «fuga»), e il motore audio decide.

Perché in Rust e non nella pagina:

- su Linux l’audio della pagina passa da GStreamer, la fonte più comune di problemi nelle app
  Tauri (pacchetti mancanti, AppImage senza codec); `kira` passa da `cpal` e da ALSA, che su ogni
  distribuzione arriva a PulseAudio o a PipeWire;
- niente regole di autoplay della pagina: la musica dell’intro parte subito;
- l’audio non risente dei cali di fotogrammi durante le animazioni;
- è il lavoro vero che giustifica Rust in questa app.

L’intro e l’outro restano sincronizzati perché l’orologio è la musica: la pagina chiede al motore
audio la posizione del brano a ogni fotogramma, come faceva il trailer del Viaggiatore.

Il piano B (se `kira` dovesse dare problemi) è il Web Audio della pagina, con GStreamer incluso
nell’AppImage.

### 9.2 La tavolozza sonora

| Strato | Che cosa | Come |
|---|---|---|
| **Il re** | il reattore canta un re basso; il sonaglio del Piccolo suona un re; «La prima nota» lo fa risuonare in due | sintetizzato: un re (73,4 Hz) con armonici, battimenti lenti. È il filo musicale di tutto il gioco |
| Ambienti | Santa Maria: reattore, ventilazione, lamiere. Scafo: il silenzio, i magneti degli stivali, il cavo. Relitto: il brusio, gocce, scricchiolii organici; un fondo per ogni zona | registrati o sintetizzati, in strati che si incrociano |
| **Il fiato** | dentro il casco, sempre; accelera quando l’aria scende, si spezza sotto il 15% | campioni brevi in sequenza, guidati dalla cifra dell’aria |
| Il brusio | molte voci, nessuna intera | sintesi granulare su formanti; con il Sintonizzatore un filo si separa dal coro |
| Attrezzi | il multiscanner, la matrice che aggancia, il Sintonizzatore che cerca, la taglierina al plasma, il faro | effetti brevi, un suono per attrezzo |
| Interfaccia | tocchi, aperture dei menu, conferme | discreti, diegetici (il visore) |
| Eventi | il varco che si richiude, il primo contatto, il groviglio, la connessione che non si spegne, i crolli della fuga | effetti scritti per l’evento |
| Musica | il menu, i cartelli d’atto, l’Anziano, gli outro; l’intro a parte | scritta e generata nel motore con i materiali del gioco (D14, documento 21); il re ne è la nota base. L’intro aspetta il montaggio bloccato |

Il mix ha cinque canali (generale, ambienti, musica, effetti, voci) con i loro cursori nelle
opzioni. L’ipossia è un filtro sul canale generale; la protezione vitale ammutolisce il brusio.

---

## 10. La sequenza d’apertura

*Questa scaletta è la prima bozza: l’intro va ripensata con un respiro cinematografico e con la
massa enormemente più grande della Santa Maria (§17).*

Non un trailer: l’inizio del gioco. Dura circa 75 secondi, si salta con Esc, e mentre scorre il
motore si carica. Finisce sulla plancia, dove la partita comincia, senza stacco.

Prima: i marchi (Runtime Multimedia, FAVELLA 1) e un avviso («si gioca meglio in cuffia»), come nel
Viaggiatore.

| Tempo | Scena | Che cosa si vede | Che cosa si sente |
|---|---|---|---|
| 0–14 s | **La spia** | Buio. Una spia verde si accende. Una riga: «Scatola nera di una tuta extraveicolare. Traccia recuperata, integrità parziale.» Le frasi del prologo compaiono a pezzi, con i buchi della registrazione | un fruscio di nastro, un fiato |
| 14–22 s | **Il battito** | L’ultima frase, «La vedo pulsare. Non la so aprire.», si spegne. Resta un punto verde che batte | un battito basso, lontano |
| 22–36 s | **Il margine** | Il punto è una stella. La camera arretra: la Via Lattea, e la Santa Maria che la attraversa piano, la scritta TSC-1972 sullo scafo | entra il re del reattore |
| 36–48 s | **Il radar** | La schermata del radar: il fascio gira, gli echi tornano. In un settore non torna niente: lì le stelle si spengono una a una. La massa si vede solo per quello che manca | i bip del radar; nel settore muto, silenzio |
| 48–60 s | **Il faro** | Il faro di prua corre lungo la massa: la luce entra e non torna. Al bordo del fascio, per un istante, il brusio prende forma | sale il brusio, poi taglia di colpo |
| 60–70 s | **Il titolo** | Glifi K’tharr compaiono dove si è spento il faro e, uno per uno, la matrice li traduce: IL RELITTO SILENTE. Sotto, piccolo: «dal racconto *Il Relitto*, in *Dal registro della Santa Maria*» | la musica si chiude sul re |
| 70–76 s | **La plancia** | Il titolo si dissolve nel telaio dell’interfaccia, che si accende pezzo per pezzo come una console che si avvia; compare il testo della plancia | il reattore resta, la musica no |

Tutto è disegnato in codice: stelle e Via Lattea con rumore procedurale, la Santa Maria come
silhouette vettoriale ricavata dal modello del sequel, la massa come una forma di rumore che
copre le stelle, il radar e il faro come shader. Il tempo lo dà la musica.

---

## 11. Le sequenze di chiusura

Ogni finale ha la sua, costruita sullo stesso impianto: il testo del finale scorre per primo,
come pagina; poi la scena; poi la riga del registro di bordo scritta a mano sulla pagina del
registro; poi i titoli di coda. Fra 40 e 60 secondi, saltabili.

| Finale | La scena | Il suono |
|---|---|---|
| **Vivi** | Il radar ridà vuoto: le stelle tornano dove c’era la massa. Un pugno chiuso si apre: il seme scuro, un battito di luce verde | il re del reattore, il silenzio della plancia |
| **La prima nota** | Come «Vivi», poi due onde, quella del reattore e quella del seme, si allineano e diventano una | il re suonato in due, a tempo |
| **La stiva piena** | La stiva: dal risuonatore salgono cento onde sovrapposte. Il quadrante del margine passa al verde | il brusio, e la voce di Yusuf che non si sente |
| **Doppio fondo** | Un cassetto che si chiude, e un filo di luce verde che passa dalla fessura | il brusio dalla stiva, un battito sotto |
| **Mani vuote** | Il radar vuoto, le stelle, nient’altro. La pagina del registro: «Nessun evento da registrare.» | il reattore, e basta |
| **Due lettere** | Due lettere incise a colpi di luce al plasma, W ed E; prima della fuga la nave resta, nella fuga si muove e si porta via tutto | il fiato che si ferma; poi il re, da solo |

---

## 12. L’architettura

```
┌───────────────────────── processo Tauri (Rust) ─────────────────────────┐
│  finestra a schermo intero · salvataggi (Documenti/Il Relitto Silente)  │
│  registro tecnico · aggiornamenti · istanza unica · motore audio (kira) │
│        ▲ comandi Tauri (salva, carica, segnali audio, schermo)          │
├────────┼────────────────────────────────────────────────────────────────┤
│        │              WebView (WebView2 · WebKitGTK)                    │
│  React + TypeScript                                                     │
│   ├─ interfaccia: visore, colonna del testo, azioni, dialoghi, menu     │
│   ├─ temi: atmosfere come variabili CSS                                 │
│   ├─ cinematiche: intro e outro (canvas 2D + WebGL2)                    │
│   └─ ponte (TypeScript) ── Pyodide ── ponte.py ── motore FAVELLA 1.4.4  │
│                                          relitto-silente/*.fav          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Il ponte** (`ponte.py`) è infrastruttura, non motore. Per ogni comando restituisce in un JSON
solo: gli eventi del turno, i pulsanti, lo stato che serve al visore (aria, matrice, voci, chiavi,
tracce, atto, fuga, protezione, stanza, stanze viste, inventario). Si scrive di nuovo per la 1.4,
che rispetto alla 1.2 del Viaggiatore fa da sé metà del lavoro (eventi e pulsanti). Lo stesso file
gira in Pyodide nell’app e in CPython nei collaudi.

**Perché il motore in Pyodide.**

| | Pyodide nella pagina (consigliato) | Python accanto all’app (sidecar) | Riscrivere il motore |
|---|---|---|---|
| Lavoro | già fatto e collaudato nel Viaggiatore | congelare Python con PyInstaller, per ogni sistema | migliaia di righe e 1.180 test da rifare |
| Pacchetti | identici sui due sistemi | uno per sistema; su Windows gli eseguibili PyInstaller insospettiscono gli antivirus | |
| Fedeltà | il motore vero | il motore vero | un altro motore |
| Costo | circa 10 MB e 1–3 s all’avvio, coperti dall’intro | una comunicazione fra processi | |

**I salvataggi** seguono il Viaggiatore e il motore 1.4: un file JSON leggibile con la sequenza
effettiva dei comandi e l’impronta SHA-256 dello stato. Al caricamento il motore rigioca e
verifica. Così il salvataggio sopravvive agli aggiornamenti e ANNULLA funziona anche dopo.

**Dimensioni stimate.** Eseguibile Tauri circa 10 MB, Pyodide e motore circa 12 MB, caratteri
circa 1 MB, immagini 5–10 MB, audio 30–60 MB (OGG). Installer fra 60 e 90 MB; un’app Electron
parte da sola da 80–100 MB.

---

## 13. Fattibilità

### 13.1 Sistemi supportati

| Sistema | Requisiti | Pacchetti |
|---|---|---|
| Windows 10 (aggiornato) e 11 | runtime WebView2 (già presente; l’installer lo scarica se manca) | installer NSIS; versione portatile (un solo .exe, le risorse sono dentro) |
| Linux | webkit2gtk 4.1: Ubuntu 22.04+, Debian 12+, Mint 21+, Fedora 38+ | AppImage (costruita su Ubuntu 22.04 per la compatibilità), .deb; .rpm se serve |

### 13.2 Rischi

| Rischio | Probabilità | Come si affronta |
|---|---|---|
| **WebKitGTK su Linux** più lento di Chromium su canvas, WebGL e filtri CSS | alta | fase 1 dedicata a provarlo; tre livelli di qualità scelti dal tempo dei fotogrammi; niente `backdrop-filter` pesanti; le cinematiche su canvas a risoluzione adattiva |
| Finestra bianca su Linux con i driver NVIDIA proprietari (renderer DMABUF di WebKitGTK) | media | variabile d’ambiente impostata dall’app all’avvio, più un’opzione «compatibilità grafica» |
| Pyodide dentro il protocollo delle risorse di Tauri (tipo MIME del `.wasm`, percorsi) | bassa | fase 1; nel Viaggiatore Pyodide gira già da un protocollo interno, senza server |
| Audio in Rust: latenza fra segnale e suono, sincronia delle cinematiche | bassa | la musica fa da orologio; i segnali arrivano in meno di un millisecondo |
| Filtri dei verbi che nascondono un comando necessario | media | il collaudo dei sei finali giocati solo con i menu dell’app |
| Spoiler dei pulsanti (vedere «Completa» sulla placca prima di sapere) | media | i verbi d’autore compaiono solo sugli oggetti visti; la risposta del gioco a un verbo «presto» è già scritta («Non sai come finisce.») |
| Eseguibili non firmati: SmartScreen su Windows | certa | come per il Viaggiatore, un avviso al primo avvio; la firma è una spesa da decidere (D17) |
| Limiti del motore: FAVELLA 1 è chiuso | bassa | tutto ciò che serve sta nel ponte; un limite vero finisce in `05-lezioni-per-favella.md` |
| Tempo: animazioni e suono sono le parti più lunghe | alta | intro e outro hanno un loro calendario; l’app è giocabile e completa prima delle cinematiche |

### 13.3 Che cosa non serve fare

Niente versione web, niente server, niente conto utente, niente telemetria. Niente modifica al
motore.

---

## 14. Il piano, dalla A alla Z

Le fasi sono in ordine; quelle in **grassetto** stanno sul percorso critico. Le stime sono in
sessioni di lavoro come quella di oggi.

| Fase | Che cosa | Si chiude quando | Sessioni |
|---|---|---|---|
| **0. Decisioni** | Questo documento; le scelte D11–D20 (§16); la cartella dell’app | le decisioni sono prese | — |
| **1. Prova tecnica** | Tauri 2 + React + Vite; Pyodide con il motore 1.4.4 e il gioco; un ponte minimo; un suono da `kira`; una pagina con canvas e WebGL. Su Windows e su Linux (WSL per costruire, una macchina vera per provare) | il percorso «Vivi» si gioca con i pulsanti dentro la finestra Tauri, su tutti e due i sistemi; si misurano avvio, fotogrammi, audio | 1–2 |
| **2. Ponte e modello d’azione** | `ponte.py` per la 1.4 (eventi, pulsanti, stato del visore, salvataggi); il modello dei menu (§6) in TypeScript, puro e provabile; la tabella delle azioni di situazione; i suggerimenti in maiuscolo; il collaudo dei finali con i soli menu | i sei finali si giocano in CPython con il solo modello d’azione; salva e carica tornano allo stesso stato | 2 |
| **3. Sistema visivo** | caratteri, variabili, componenti: lamina del testo con la grammatica tipografica, strumenti, ramo delle azioni e menu a fiore, dialogo, conferma, diario, menu e opzioni; l’acciaio, la crescita della membrana, le atmosfere e l’ipossia; il generatore delle venature | il gioco si gioca dall’inizio alla fine nell’app, con lo stile definitivo, senza suoni né cinematiche | 4 |
| 4. Suono | motore audio in Rust, protocollo dei segnali, il re, il fiato, gli ambienti, il brusio, gli effetti, il mix e le opzioni | ogni stanza, ogni attrezzo e ogni evento ha il suo suono; il fiato segue l’aria | 2 |
| 5. Riferimenti visivi | le telecamere di bordo (trattamento delle immagini del sequel, la cuccetta da rifare), le ricostruzioni dello scanner per le 18 stanze del relitto, il comunicatore di Yusuf, l’eco, l’Anziano, la scatola nera | ogni stanza e ogni dialogo ha la sua vista, con i suoi stati | 2 |
| **6. Intro** | storyboard approvato, animatic, scene definitive, sincronia con la musica, caricamento del motore dietro | l’intro scorre, si salta, e consegna la plancia | 2–3 |
| 7. Outro | l’impianto comune e le sei scene, i titoli di coda, il registro dei finali | ogni finale ha la sua chiusura | 2 |
| 8. Rifinitura | transizioni, cartelli d’atto, accessibilità completa, tastiera, livelli di qualità, prestazioni su Linux | lista di controllo della rifinitura chiusa | 1–2 |
| **9. Pacchetti** | la copertina e il logo (l’icona dell’eseguibile, chiesti dall’autore il 15 ottobre 2026), installer NSIS, portatile, AppImage, .deb; registro tecnico; aggiornamento automatico firmato; `--autoverifica`; CI su GitHub Actions (Windows e Ubuntu 22.04) | la CI costruisce i pacchetti e li autoverifica (avvia, gioca, salva, ricarica) | 1–2 |
| 10. Prova finale | partite complete su hardware vero: Windows 10 e 11, Ubuntu 22.04 e 24.04, una Fedora, una macchina con NVIDIA; una partita di qualcuno che non conosce il gioco | nessun difetto bloccante; la release 1.0 | 1+ |

**Totale stimato: 17–22 sessioni.** Il gioco diventa giocabile nell’app alla fine della fase 3,
a circa metà del lavoro; da lì in poi ogni fase aggiunge senza rompere.

**Lo stato, al 15 ottobre 2026 (quinta sessione).**

| Fase | Stato |
|---|---|
| 0. Decisioni | chiusa; D14 (la musica) decisa nel §18 |
| 1. Prova tecnica | **chiusa**: `08-fase-1-prova-tecnica.md`. Il motore vero gira in Pyodide dentro Tauri, la partita si gioca a soli pulsanti (14 percorsi su 14, anche con `collaudo/pulsanti.py`), l’audio in Rust tiene. Windows misurato; Linux costruito in WSL (.deb e AppImage) e provato in WSLg; manca la macchina Linux vera (istruzioni nel §8 del documento 08) |
| 2. Ponte e modello d’azione | **chiusa**: `12-fase-2-ponte-e-modello.md`. Il ponte completo (eventi, pulsanti, cose con le loro regole, visore, suono, salvataggi a riprese); il modello dei menu in TypeScript (`app/src/azione/`). I sei finali si giocano con i soli menu (`collaudo/menu.mjs`, 14 percorsi su 14, 4,1 voci per cosa); 463 salvataggi su 463 tornano identici (`collaudo/salvataggi.py`); 84 eventi del suono su 84 (`collaudo/eventi.py`) |
| 3. Sistema visivo | **a metà** (prima delle quattro sessioni previste, più la crescita della membrana): `14-fase-3-sistema-visivo.md`. I caratteri dentro l’app; le atmosfere da un modulo solo, con i contrasti provati in 54 climi; la lamina con la grammatica tipografica, provata su tutti i percorsi e su tutto il testo dei `.fav` (`collaudo/tipografia.mjs`); il ramo a due fili e il fiore su due anelli; il visore con i contatori che compaiono quando servono; il dialogo, la conferma, la pausa e le opzioni; i salvataggi su disco (sei posti e l’automatico, F5 e F9), provati nell’eseguibile vero; la membrana che cresce al primo contatto. Il gioco è la pagina principale dell’app. **La seconda metà è cominciata** (quinta sessione): il motore è passato a FAVELLA 1.5.0 senza cambiare il gioco (`16-favella-1-5-0.md`, §10), e **il diario è fatto** (14, §12: la trascrizione, il fascicolo di L.V., le voci, le traduzioni; `collaudo/diario.py`), e **il menu principale, il registro dei finali e la schermata dei riconoscimenti** (14, §13: l’app si apre sul menu, sopra la scena della scala; l’elenco delle licenze è generato dalle fonti), e **la prova dei finali nell’eseguibile** (14, §14: i sei finali giocati cliccando nell’interfaccia vera, 563 passi in 42 secondi, l’impronta uguale a CPython; ha trovato e fatto correggere un difetto del ramo). L’autore ha giocato l’eseguibile e ha scritto i suoi appunti (14, §15): fatti lo schermo intero, i loghi del Viaggiatore, la dichiarazione sull’IA (il testo l’ha approvato), il suo nome, Yusuf al comunicatore, le risposte in colonna; poi, su sua richiesta, la pagina dei tasti nella pausa. Restano la rifinitura, la prova su Linux (con i crate Rust di Linux nei riconoscimenti), la chiusura con la 0.3.0; il suono dell’intro e una intro più bella sono delle fasi 4 e 6 |
| 4. Suono | progettata (`10-bibbia-sonora.md`) e provata. **Cominciata** (sesta sessione, 15 ottobre 2026): ascoltato il prototipo fatto con le registrazioni, l’autore ha deciso che ogni suono si fa con il codice (§19). Il prototipo dei tre ambienti è rifatto tutto in sintesi, in tempo reale, nel motore in `app/src-tauri/src/mondo/` (bibbia, §10: il re, la ventilazione, le pompe, la ventola, il fiato, la voce e il brusio, il metallo, le gocce, le crepe, il gemito, il riverbero delle stanze); nell’app costa dal 2 al 5% di un core, senza buchi né errori. Gli ascolti nuovi sono in `ascolti/` (11-…), e l’autore li ha approvati (16 ottobre). **Il gioco suona**: la partita manda ogni turno al motore, e la regia fa le 23 stanze, le scene, gli 85 eventi, i finali, i cursori e le opzioni d’accessibilità (bibbia, §11; le 14 partite di collaudo passano la prova del suono). L’autore ha ascoltato l’audio e dice che gli sembra ok (16 ottobre). **Il suono dell’interfaccia è fatto**: un tocco di acciaio sulla Santa Maria che si mescola con la membrana mentre cresce, e che nella fuga si strappa (bibbia, §11.4; ascolto 13), anche nel menu principale. **La musica è fatta** (D14, documento 21: il menu principale, la soglia degli atti, l’Anziano nodo per nodo, cinque chiusure, e il tema che le lega; ascolti 14). **Il filo del Sintonizzatore è fatto** (bibbia, §11.6: lo spostamento di frequenza vero, una voce per eco, il secondo strato, l’anello del Piccolo, il graffio della lastra; ascolto 15). Restano la musica dell’intro (con le scene definitive), le luci del Navarca, il montacarichi, la prova su Linux |
| 6. Intro | storyboard 2 **approvato** (§18), con la tavola e il quadro finito della scala (`09-prova-di-look.html`). **L’animatic è fatto**, dentro l’app (`app/src/intro/`, §10 del 09): tutte le scene sulla scaletta di 2:40,75, la scala e il margine nel motore definitivo, il resto su quadri fermi; il salto, il movimento ridotto, i sottotitoli dei suoni. Prossimi passi: le scene definitive, la musica, la sincronia |
| le altre | da cominciare. Sul percorso critico la prossima è ancora la 3, la sua seconda metà; l’intro (fase 6) può andare in parallelo |

Le versioni seguono le fasi (`sviluppo/VERSIONI.md`): la fase 1 chiusa è la **0.1.0**, la fase 2 la
**0.2.0**.

**Che cosa serve dall’autore.** Le decisioni del documento 18 (una modalità a solo testo, D21–D26) la risposta al documento 19 (la Santa Maria su FAVELLA) e le decisioni del documento 20 (il gioco in inglese, D28–D34); la direzione della copertina e del logo dell’eseguibile (da fare: il 15 ottobre 2026 l’autore li ha chiesti; andranno nel registro `grafica/LICENZE.md` e nei riconoscimenti); le decisioni del §16; l’approvazione dello storyboard dell’intro
prima di animarlo; la musica, se la si vuole composta (D14); la cuccetta con due brande; prove su
una macchina Linux vera; la creazione del repository su GitHub, quando sarà il momento di
pubblicare.

---

## 15. Il collaudo dell’app

Si aggiunge a quello del gioco, che resta com’è.

| Collaudo | Dove | Che cosa garantisce |
|---|---|---|
| Regressioni del gioco | `collaudo/regressioni.py` | il gioco non cambia (14 percorsi, la prova di ripresa) |
| Il ponte | Python, in CPython (`collaudo/eventi.py`, `collaudo/salvataggi.py`) | gli stati del visore e del suono sono completi a ogni turno, gli eventi del suono scattano tutti, il ponte non cambia la partita |
| **I finali con i soli menu** | `collaudo/menu.mjs`: il modello d’azione dell’app in Node, il motore in CPython | nessun filtro nasconde un comando necessario; ogni suggerimento in maiuscolo accende un pulsante |
| **I finali attraverso l’interfaccia** | l’eseguibile con `RELITTO_PROVA=finali` (`strumenti/prova_eseguibile.py finali`) | dal menu principale ai sei finali cliccando ogni pulsante, che deve essere in vista; il motore dentro l’app arriva alla stessa impronta di CPython; il registro dei finali si scrive |
| Il modello d’azione | TypeScript (`app/prove/azione.test.ts`) | i menu, le azioni di situazione, i suggerimenti, su turni costruiti a mano |
| Salvataggi | Python (`collaudo/salvataggi.py`) | salvare in ogni stanza di ogni percorso e ricaricare dà la stessa impronta, e la partita continua uguale |
| Grammatica tipografica | TypeScript | ogni tipo di testo del gioco (voci, letture, suggerimenti) si riconosce, su tutte le trascrizioni |
| Autoverifica dei pacchetti | CI | il pacchetto costruito parte, gioca, salva, ricarica |
| Prova su hardware | a mano | prestazioni, audio, schermo intero, driver |

---

## 16. Le decisioni da prendere

| # | Domanda | Proposta |
|---|---|---|
| D11 | Quale stile? | **Decisa: C, «Membrana», rivista**, come nelle schermate di `06-proposta-membrana.html` (§17) |
| D12 | I riferimenti visivi | telecamere di bordo con le immagini del sequel per la Santa Maria; ricostruzioni dello scanner in codice per il relitto |
| D13 | L’audio | in Rust con `kira`; il Web Audio come piano B |
| D14 | La musica | un tema composto per intro, Anziano e outro (come il brano del Viaggiatore), tutto il resto in codice; il re come nota base |
| D15 | Nomi degli oggetti toccabili nel testo | sì, attivi di base, disattivabili |
| D16 | Il costo in aria prima di agire | il visore stima il costo al passaggio sul pulsante («−4»), dopo che quel tipo di azione è stato provato una volta; conferma diegetica sul congedo dell’Anziano |
| D17 | Distribuzione | come il Viaggiatore: release su GitHub con aggiornamento automatico; itch.io come vetrina; Steam da valutare dopo la 1.0. Firma del codice: da decidere |
| D18 | Le voci | nessuna voce recitata nella 1.0; la scatola nera di L.V. recitata è il primo candidato per una 1.1 |
| D19 | Linux minimo | Ubuntu 22.04 e derivate, Debian 12, Fedora 38 |
| D20 | Il campo di testo | solo nelle build di sviluppo |

---

## 17. Decisioni prese dopo le tavole (14 ottobre 2026)

Dall’autore, dopo aver visto le due tavole. Valgono su tutto il resto del documento.

1. **Lo stile è la C, «Membrana», come nelle schermate di `06-proposta-membrana.html`**: look,
   colori e animazioni approvati. La B non si porta avanti.
2. **Le immagini del sequel vanno controllate una per una contro il canone del Relitto**, che è
   l’episodio precedente. La plancia è `s_01_b` (lo stesso ambiente senza teca); `s_01` e
   `zoom_s01_teca` sono escluse, perché mostrano il seme nella teca, cioè quello che in questo
   gioco si deve ancora trovare. `s_10_b` è esclusa (c’è una cassa del sequel); `s_10` va bene.
   `s_03` ha una branda sola, il Relitto ne vuole due (una mai usata); `s_04` ha pallet e casse,
   il Relitto ha la stiva vuota da sei settimane: tutte e due da rifare o ritoccare. Le due tavole
   usano già `s_01_b`.
3. **Il suono deve essere credibile e realistico il più possibile.** Ambienti e atmosfere costruiti
   su registrazioni vere (librerie con licenza compatibile con la distribuzione), elaborate e
   stratificate; la sintesi solo dove serve (il re del reattore, il brusio). Con la fisica giusta:
   nel vuoto non c’è suono, sullo scafo si sente solo quello che arriva per contatto (i magneti
   degli stivali, il cavo, il proprio corpo dentro la tuta).
4. **L’intro dell’abbozzo è solo una bozza.** Serve un’animazione di livello molto più alto, con
   un respiro cinematografico: i testi restano sullo schermo il tempo di leggerli, e un po’ di più;
   niente è compresso per stare in un minutaggio. La durata la decide il ritmo, non il contrario.
5. **La nave aliena è enormemente più grande della Santa Maria**, e l’intro deve farlo sentire: la
   Santa Maria è una cosa piccola davanti a un muro nero che occupa il cielo. (Il gioco dice
   «trecentoquaranta metri» e «massa: stima incerta, il doppio della Santa Maria»: la stima è
   dello scanner, che non sa leggere quel materiale; la scala visiva segue l’autore.)
6. Le prossime sessioni lavorano con lo sforzo al massimo, soprattutto sul design.

Il prompt della prossima sessione è in `07-prompt-prossima-sessione.md`.

---

## 18. Decisioni prese dopo la seconda sessione (14 ottobre 2026, sera)

L’autore ha delegato le decisioni tecniche, pratiche e stilistiche di questa fase: si prendono adesso e si correggono dopo, se serve. Valgono sul resto del documento, come quelle del §17.

1. **Lo storyboard 2 dell’intro è approvato** (`09-intro-storyboard.md`), con le cinque scelte del suo §8 come consigliate: il prologo diviso in due, il faro che si perde, il soffio di brusio alla radio, tutte le scene (2:40), la musica del punto 2.
2. **La musica (D14) è fatta con i materiali del gioco.** Il re del reattore come radice, il sonaglio, il tam-tam strofinato, le voci del brusio: una musica d’ambiente scritta e generata nel motore audio, senza brani di libreria. Si compone sul montaggio bloccato dell’intro, poi per l’Anziano e per le chiusure. Le macchine del relitto stanno intorno al sol diesis, a un tritono dal re (bibbia sonora, §1.3); la musica dell’Anziano va dal sol diesis al re. Un compositore resta possibile più avanti, e questa musica gli farebbe da traccia guida.
3. **Le licenze stanno in una schermata prima del gioco.** «Riconoscimenti e licenze» compare prima del gioco al primo avvio e dopo ogni aggiornamento che aggiunge nomi; si salta dopo tre secondi e resta sempre raggiungibile dal menu. Elenca i suoni (autore, fonte, licenza, anche quando la licenza non chiede niente), i caratteri (SIL OFL), le librerie (Pyodide, lark, Tauri, React, kira e le altre) con le loro licenze, le immagini. Si genera da `audio/LICENZE.md` e dagli elenchi delle dipendenze, così non resta mai indietro.
4. **I suoni si prendono dalle librerie.** Freesound in CC0 per primo, con l’account dell’autore (che entra da sé, nel pannello del browser); l’archivio Sonniss solo dove non c’è un’alternativa CC0 o di pubblico dominio, e nel registro i suoi file hanno «ridistribuibile: no». Nessuna registrazione è a carico dell’autore.
5. **I documenti vecchi passano agli apostrofi tipografici**, solo nella prosa, mai nel codice.

## 19. Decisioni prese nella sesta sessione (15 ottobre 2026)

1. **Il suono, per ora, è tutto sintetizzato.** Ascoltato il prototipo dei tre ambienti, fatto con le registrazioni di Freesound e di LibriVox, l’autore ha detto che i suoni scelti non andavano, e ha deciso: niente suoni campionati, ogni suono si fa con il codice, al meglio possibile; più avanti, se servirà, porterà lui dei suoni veri, generati o cercati. Supera il punto 4 del §18 e il §1.4 della bibbia sonora. Il prototipo è stato rifatto in sintesi lo stesso giorno (bibbia, §10); i dodici file scaricati non entrano più né nel gioco né nei riconoscimenti, e restano nel registro `audio/LICENZE.md` come storia.
2. **Gli ascolti sintetizzati vanno bene** (16 ottobre 2026): «Mi convincono». Da qui il gioco è collegato al motore audio (bibbia sonora, §11).
3. **L’audio del gioco va bene** (16 ottobre 2026): «Ho ascoltato l’audio e a me sembra ok». Si prosegue con il resto del §11.3 della bibbia: prima il tocco dei pulsanti (§11.4, fatto), poi la musica.
4. **La musica (D14) comincia, con il tocco del menu principale** (16 ottobre 2026): «Parti dalla musica (D14), con il tocco del menu principale». Fatta con i materiali del gioco, come dice il §18 (documento 21): il menu, le soglie degli atti, l’Anziano, le chiusure; l’intro aspetta le scene definitive.
