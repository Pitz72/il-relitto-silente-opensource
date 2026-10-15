# Fase 3 — il sistema visivo

**Che cosa si è costruito, che cosa si è deciso, che cosa si è misurato.** 14 ottobre 2026, quarta
sessione, per la prima metà (§1–§11); dal 15 ottobre, quinta sessione, la seconda (§12 in poi). È la
fase 3 del piano (`06-app-desktop.md`, §14), che si chiude quando il
gioco si gioca dall’inizio alla fine nell’app, con lo stile definitivo, senza suoni né cinematiche.
La fase non è chiusa: la versione resta la 0.2.0 finché non lo sarà (sarà la 0.3.0).

L’autore ha delegato le scelte tecniche, pratiche e stilistiche (06, §18): quelle prese sono segnate
con **Deciso** e si possono correggere. Una sola scelta gli è stata chiesta, perché comportava un
download: i caratteri.

---

## 1. In sintesi

| | Risultato |
|---|---|
| I caratteri dentro l’app | Newsreader, IBM Plex Mono, Big Shoulders Stencil, Atkinson Hyperlegible Next: otto file woff2, 457 KB, solo il sottoinsieme latino |
| Le atmosfere | 54 climi (atmosfera, forma, zona, protezione, ipossia): ogni testo sopra 4,5:1, il più basso 4,82:1 (la targa nel visore con l’ipossia); il fuoco sopra 3:1 |
| La grammatica tipografica | sui 14 percorsi (1.308 turni) ogni evento si ricostruisce dai suoi blocchi carattere per carattere; nessun maiuscolo sconosciuto; i 41 suggerimenti del modello tutti nel testo; e sulle 1.131 stringhe dei `.fav`, nessun problema |
| Il ramo | nei percorsi si arriva a 26 baccelli in un turno (9 cose qui, 14 con te, 6 uscite, 3 azioni): le uscite e le cose qui restano sempre in vista, e quando i due fili sono pieni le cose che porti in più vanno nel «+N» (a metà di `limite-I3`, a 1920 × 1080, cinque su quattordici); il fiore più ricco (10 voci) sta su due anelli |
| I salvataggi | nell’eseguibile di rilascio, attraverso il processo Tauri: scritto, elencato, riletto uguale, caricato «identica» in 116 ms, stessa impronta; il salvataggio automatico al cambio di stanza |
| Le prove dell’app | 56 (erano 24): atmosfere 6, grammatica 13, ramo 10, visore 3; più 3 prove Rust dei salvataggi |
| Il collaudo del gioco | invariato e verde (il §9) |

## 2. Che cosa è stato costruito

| Dove | Che cosa |
|---|---|
| `app/src/stile/` | i caratteri (`caratteri.css`), le atmosfere (`atmosfere.ts`: l’unica fonte dei colori, con i contrasti), il foglio di base (`base.css`: le variabili registrate, il fuoco, il movimento ridotto), le opzioni di chi gioca (`opzioni.ts`) |
| `app/src/campionario/` | il campionario delle misure (`?campionario`): i caratteri, ogni atmosfera nei suoi ruoli di testo con i contrasti, il movimento |
| `app/src/gioco/lamina/` | la grammatica tipografica (`grammatica.ts`, pura) e la lamina del testo (`Lamina.tsx`) |
| `app/src/gioco/ramo/` | la geometria del ramo e del fiore (`geometria.ts`, pura), dal modello ai baccelli e ai petali (`azioni.ts`, pura), il componente (`Ramo.tsx`) |
| `app/src/gioco/visore/` | il visore (`Visore.tsx`): la lente, l’aria, i satelliti, la mappa (`mappa.ts`, pura), il cartello d’atto |
| `app/src/gioco/dialogo/`, `pannelli/` | il dialogo; la conferma, la pausa, i salvataggi, le opzioni, l’avviso |
| `app/src/gioco/vene/` | il generatore delle venature (venuto dalla prova tecnica) e la crescita della membrana |
| `app/src/gioco/salvataggi.ts`, `app/src-tauri/src/salvataggi.rs` | i salvataggi: l’archivio nella pagina, la scrittura e la lettura nel processo Tauri |
| `app/src/gioco/Gioco.tsx` | lo schermo del gioco, che adesso è la pagina principale |
| `collaudo/tipografia.mjs`, `collaudo/ponte.mjs` | il collaudo della grammatica; il ponte in Node, comune a `menu.mjs` |

## 3. Le fondamenta

**I caratteri.** Dai pacchetti Fontsource, che riconfezionano i file di Google Fonts, con le versioni
fissate (5.3.0) e le licenze nei loro `LICENSE`. Tutti i caratteri del testo del gioco stanno nel
sottoinsieme latino (le lettere accentate, «» ‹› … — ’), e solo quello entra nel pacchetto. I nomi
delle famiglie sono quelli che l’intro chiedeva già: l’animatic adesso ha il suo Newsreader.

- **Deciso (con l’autore): Atkinson Hyperlegible Next**, la revisione del 2025 del Braille Institute,
  al posto della prima versione: è variabile, ha i corsivi (le voci del relitto sono in corsivo) e
  più lingue. Nel 06 il nome resta quello della famiglia.
- **Deciso: le licenze dei caratteri andranno nella schermata «Riconoscimenti e licenze»** (06, §18.3),
  con il testo della SIL OFL: la licenza chiede che viaggi con i caratteri.

**Le atmosfere.** Un modulo solo, `atmosfere.ts`, dà allo schermo le variabili CSS e alla prova i
colori da misurare. Il passaggio fra un’atmosfera e l’altra dura un secondo e mezzo, perché le
variabili sono registrate (`@property`) e si possono interpolare.

- **Deciso: la protezione vitale e l’ipossia sono stati sopra l’atmosfera**, non atmosfere: la
  protezione spegne le venature e porta il rosso, l’ipossia spegne i colori del 60%. Lo spegnimento
  si fa in luce lineare, verso il grigio della stessa luminanza: il colore se ne va, il contrasto no.
- **Deciso: i colori del testo e quelli della decorazione sono ruoli diversi.** Le vene, il bordo,
  l’alone non portano mai parole; l’accento e l’accento 2 sì, e restano leggibili anche quando le vene
  si spengono.
- **Deciso: la targa d’acciaio è schiarita** (#918069): quella della tavola (#6E6152) stava a 3,1:1,
  quella dell’intro (#8A7A66) a 4,49.
- **Deciso: le zone del relitto** toccano la decorazione e il fondo, mai il testo: la serra secca e
  grigia, il laboratorio elettrico, i due santuari bianchi, l’anticamera nera.
- **Deciso: nella camera di compensazione la luce è già del relitto e l’interfaccia è ancora
  d’acciaio**, un acciaio freddo: la membrana cresce al primo contatto, nel vestibolo, non prima.

**Il movimento ridotto** è un attributo solo, sulla radice dello schermo: la preferenza del sistema,
o l’opzione (sistema, ridotto, pieno). Ogni animazione decorativa sta dietro «pieno». Con «ridotto»
restano i passaggi di colore, più brevi. **Deciso:** con il movimento ridotto anche la rivelazione a
righe è spenta (il testo compare tutto), e le venature compaiono ferme, in dissolvenza.

## 4. La lamina e la grammatica tipografica

La grammatica (`grammatica.ts`) prende gli eventi di un turno e li divide in blocchi e segmenti.

| Blocco | Come si riconosce | Come si veste |
|---|---|---|
| stanza | evento `stanza` | display grande, corsivo chiaro nella membrana; una riga sottile |
| paragrafo | ogni riga di un evento `testo` | serif, interlinea 1,58, al massimo 34 em (circa 72 caratteri) |
| voce del relitto | `IL NAVARCA:`, `LO XENO-BOTANICO, con un filo di voce più fermo:`, seguiti dal parlato fra caporali | rientro, filo verticale, il nome in maiuscoletto monospaziato, il parlato in corsivo, la narrazione dentro la voce attenuata |
| registrazione | la riga che finisce con «una voce d’uomo:», e il prologo | una fascia granulosa con il filo verde spento; «Un buco.» come pausa grafica fra due tratteggi |
| lettura | le righe che cominciano con ANALISI, LETTURA:, IDENTIFICAZIONE, DATAZIONE, «Lunghezza:» | monospaziato, su una fascia scura |
| dialogo | evento `dialogo` | chi parla, il parlato, le didascalie fra parentesi in corsivo |
| registro | «Registro di bordo, …» in fondo a un finale | monospaziato, sotto un filo |
| sistema | evento `sistema` | piccolo, monospaziato |

Dentro la prosa: i **suggerimenti** (pulsanti; la loro parentesi resta, attenuata), la **protezione
vitale**, ciò che è scritto su uno **schermo** (MATERIALE NON IN ARCHIVIO, CHIUSURA RIFIUTATA…),
le **etichette** dello scanner ‹…›, la **matrice** e gli **intraducibili**, le scritte **a stampo**
(TSC-1972, AURORA-7) e quelle **graffiate** (QUI PRIMA. IL SEME. NON SIAMO S—), i **nomi** delle cose
in vista, toccabili (D15). Il comando dato sta sopra la risposta, piccolo, con il costo in aria.

**Il testo non si riscrive** (06, §7). Ogni blocco porta la sua sorgente, e il testo dei suoi
segmenti la ricostruisce: il collaudo lo controlla evento per evento. L’unica trasformazione è
l’apostrofo tipografico, solo a schermo.

- **Deciso: i maiuscoli che non sono suggerimenti si riconoscono da un lessico** (schermo, stampo,
  graffio), perché il testo del gioco è congelato: il collaudo fallisce se ne compare uno nuovo.
  I suggerimenti invece si riconoscono dal verbo, come nel modello d’azione.
- **Deciso: il suggerimento «se lo ANALIZZI»** (la proiezione del Ponte) ora si riconosce: il
  presente dei verbi in -are, seconda persona, con il pronome davanti. Il modello non lo vedeva.
- **Deciso: i messaggi del motore che chiedono di scrivere un comando non si stampano** («Scrivi
  ANNULLA…»): l’app ha i suoi pulsanti per annullare, ricominciare, caricare.
- **Deciso: il prologo resta sopra la prima stanza, spento**, come traccia registrata: l’intro
  finisce lì.
- La rivelazione è una maschera a scatti, una riga alla volta (62 ms per riga); Spazio o un clic la
  completano. Il testo lungo comincia dall’alto, con «continua» in fondo.

## 5. Il ramo delle azioni e il fiore

I menu sono quelli del modello d’azione (`app/src/azione/`), mai ricostruiti.

- **Deciso: il ramo ha due fili.** Sopra le uscite (le bocche, con il loro tasto), le cose che stanno
  qui (i baccelli), le azioni; sotto, più sottile, gli attrezzi della tuta e ciò che porti. Un filo
  solo non basta: nei percorsi si arriva a 26 baccelli in un turno.
- **Deciso: quando il filo alto non basta, le cose in più scendono su quello basso**, con l’etichetta
  «e qui»; il «+N» resta per quando sono pieni tutti e due, e apre le cose nascoste come petali. Prima
  di nascondere, i baccelli si stringono fino all’80%.
- **Deciso: il fiore si apre sempre nella fascia fra la lamina e il filo alto**, anche per le cose
  del filo basso (il gambo passa fra i baccelli): non copre mai il testo. Due anelli: la base e i verbi
  dell’autore vicino, gli attrezzi fuori.
- **Deciso: il multiscanner e la matrice hanno un baccello loro** (sono della tuta) e si prendono in
  mano con un tocco; il Sintonizzatore e la taglierina sono cose che porti, e il loro fiore ha anche
  «Sintonizza…», «Incidi…», «Taglia…», che li mettono in mano.
- **Deciso: un attrezzo in mano accende solo le cose su cui i menu lo mostrano** (12, §4.2: non sulle
  cose che porti, se l’autore non l’ha previsto). Il cursore diventa un mirino.
- «Usa con…» accende tutte le cose possibili, non solo quelle giuste (06, §6.1); la fascia in alto
  dice che cosa si sta facendo, e Esc annulla.
- **Deciso: i suggerimenti accendono il loro pulsante per sei secondi**: la cosa, il petalo con il
  comando, l’azione, l’attrezzo.
- **Deciso (D16): la stima dell’aria è per verbo**, imparata la prima volta che quel verbo ha
  consumato aria, e compare come nota del petalo («Ascolta −10»). È una stima: lo stesso verbo può
  costare diverso su cose diverse.
- **Deciso: Tab resta al fuoco**, come vuole l’accessibilità; il diario, che il 06 metteva su Tab,
  andrà su D. Le frecce, che sono le uscite, dentro un fiore aperto passano da un petalo all’altro; le
  uscite valgono solo quando non è aperto niente.

## 6. Il visore

- **Deciso: la mappa è orientata come la bussola del gioco**: ovest a sinistra, nord in alto, la
  Santa Maria a est e il relitto che si addentra verso ovest. La tavola disegnava la progressione da
  sinistra a destra, cioè con l’ovest a destra: il baccello «ovest» e la mappa si sarebbero
  contraddetti. Su e giù scendono di un passo; le uscite verso stanze mai viste sono monconi.
- **Deciso: prima della tuta, la console di bordo**: il re del reattore, il margine nel rosso, il
  radar (il contatto non identificato, poi «340 m · non in archivio» dopo la scansione lunga). Sono
  fatti che la plancia dice già; dalla tuta in poi il visore mostra l’aria e i contatori, quando il
  ponte dice `mostra`.
- L’aria è un anello graduato nell’acciaio, una cellula che respira nella membrana (il periodo segue
  il livello, irregolare nell’ipossia, contratta nella protezione). A ogni consumo il segno (−2) si
  dissolve vicino alla cifra. Ogni stato è anche scritto.
- **Deciso: la matrice sono otto glifi, due per soglia** (4, 18, 75, 100), generati come quelli
  dell’intro. **Le chiavi si riempiono in ordine**: il ponte dà il numero, non quali.
- **Deciso: nella protezione vitale Ascolta, Sintonizza e Traduci si spengono**, con il motivo al
  passaggio («Protezione vitale: canali secondari chiusi»); anche il baccello della matrice.
- La lente: la telecamera della plancia (il quadro dell’intro); per le altre telecamere di bordo, la
  grana del sensore; nel relitto una ricostruzione generica, diversa per ogni stanza. **Le viste vere
  sono della fase 5.**
- Il cartello d’atto compare quando l’atto cresce, non al caricamento; si salta con un clic.
- Il bordo del visore respira con la tuta; la fuga fa tremare il telaio (il ramo, il visore), mai il
  testo; l’ipossia vignetta e fa vacillare la spaziatura.

## 7. Il dialogo, la conferma, i salvataggi

- Il dialogo copre il palco: la vista grande (l’Anziano fatto di punti, con la geometria stellare
  del pavimento; il comunicatore di Yusuf con l’onda della voce; l’eco come un’onda che gira su se
  stessa), le parole a sinistra, i semi numerati in basso, da 1 a 9. Anche queste viste sono
  provvisorie, fino alla fase 5.
- **Deciso (D16): il congedo dell’Anziano chiede conferma**: «Da qui non si torna.», con «Chiudi gli
  occhi» (S) e «Non ancora» (N). La conferma che chiede il motore ha la stessa forma.
- **I salvataggi** stanno in `Documenti/Il Relitto Silente/salvataggi` (`posto-1.json` …
  `posto-6.json`, `automatico.json`), scritti dal processo Tauri senza mai lasciare un file a metà
  (prima un provvisorio, poi lo si rinomina). L’elenco legge solo il `riassunto`. `RELITTO_SALVATAGGI`
  sposta la cartella.
- **Deciso: F5 e F9 aprono i pannelli**, non salvano e non caricano alla cieca: con sei posti, un
  salvataggio rapido sovrascriverebbe per sbaglio. Sovrascrivere un posto chiede conferma. Il
  salvataggio automatico scatta a ogni cambio di stanza, in silenzio.
- **Deciso: una partita nuova ha un seme a caso**; i collaudi e l’aiuto dello sviluppo usano il
  seme 1. Il seme viaggia nel salvataggio.
- La pausa (Esc): riprendi, salva, carica, annulla l’ultima mossa (l’annullamento del motore),
  opzioni, ricomincia da capo (con conferma), e la pagina delle misure. F11 per lo schermo intero.
- Alla fine della partita, Ricomincia e Carica sono dell’app; Annulla resta del motore.
- La pagina del gioco è quella principale; la pagina di prova resta su `?prova`, e per le prove
  automatiche della fase 1. **`RELITTO_PROVA=salvataggi`** prova i salvataggi nell’eseguibile vero e
  scrive un rapporto (nella cartella di `RELITTO_RAPPORTI`).

## 8. La crescita della membrana

Il generatore delle venature della prova tecnica è passato al gioco (`app/src/gioco/vene/`), e la
pagina di prova lo misura da lì. Le zone vietate sono le misure vere dello schermo (la lamina, la
lente, gli strumenti, la mappa, l’atto, i fili del ramo); la fascia del fiore resta libera, come
nella tavola. Al primo contatto le vene crescono in cinque secondi; prima che torni l’energia sono
fioche, dopo si accendono. Fuori dalla fuga e dalla crescita si disegnano una volta e a ogni
fotogramma passano solo le luci (il modo economico misurato nella fase 1).

## 9. Il collaudo

| Comando | Esito |
|---|---|
| `python collaudo/regressioni.py --riprese` | 14 su 14 |
| `python collaudo/pulsanti.py` | 14 su 14 |
| `node collaudo/menu.mjs` | 14 su 14, 6 finali su 6, 41 suggerimenti accesi |
| `python collaudo/salvataggi.py` | 463 su 463 |
| `python collaudo/eventi.py` | 84 eventi su 84 |
| `node collaudo/tipografia.mjs` | **nuovo**: 14 percorsi su 14, 1.308 turni; 1.131 stringhe, nessun problema |
| `npm --prefix app run prove` | 56 su 56 |
| `cargo test --lib` (in `app/src-tauri`) | 3 su 3, i salvataggi |
| l’eseguibile con `RELITTO_PROVA=salvataggi` | identica, stessa impronta |

## 10. Che cosa non si è potuto provare

- **Il movimento a velocità piena.** Per quasi tutta la sessione il pannello del browser era
  nascosto, e lì il ciclo dei fotogrammi non gira e le transizioni restano a metà. La rivelazione,
  la crescita della membrana, il fiore che si apre, il respiro della cellula sono stati controllati
  fotogramma per fotogramma o per stato, non guardati scorrere. Vanno guardati dall’autore.
- **Linux.** Le venature, la cellula e la lente insieme non sono state misurate su WebKitGTK.
- **Una partita intera a mano nell’app**, solo con il mouse e solo con la tastiera: i percorsi sono
  stati giocati con l’aiuto dello sviluppo, non bottone per bottone.

## 11. Che cosa resta per la seconda metà della fase 3

- **Il diario** (D): la trascrizione, il fascicolo L.V., le voci ascoltate, le traduzioni alla
  soglia più alta.
- **Il menu principale** (Continua, Nuova partita, Carica, Opzioni, Registro dei finali,
  Riconoscimenti) e **la schermata «Riconoscimenti e licenze»** prima del gioco (06, §18.3), generata
  da `audio/LICENZE.md` e dagli elenchi delle dipendenze, con la SIL OFL dei caratteri.
- **La partita intera nell’app**, a mano: è la condizione con cui la fase si chiude. Un collaudo dei
  finali giocati attraverso l’interfaccia, nell’eseguibile (come la prova dei salvataggi), lo
  renderebbe ripetibile.
- **La rifinitura dello stile**: i nomi toccabili (che oggi segnano anche parole generiche come
  «nave»), il cartello d’atto, i testi lunghi nel dialogo, la scala a 1280 × 720 con il testo grande.
- **Le prestazioni**: i livelli di qualità delle venature, la prova su Linux.
- **Un passaggio con un lettore di schermo.**

---

## 12. Il diario (quinta sessione)

Si apre con D, dalla pausa o con il pulsante «diario» in alto; si chiude con D o con Esc. Ha quattro
pagine, e una pagina compare solo quando ha qualcosa, come i contatori del visore (06, §4.3).

| Pagina | Che cosa | Da dove |
|---|---|---|
| Trascrizione | tutta la partita: il prologo, la prima stanza, poi ogni comando con la sua risposta e il suo costo in aria; un cartello dove cambia l’atto | sempre |
| Prima di te, poi L.V. | il fascicolo: le tracce di chi è passato prima, nell’ordine della sua strada (la giuntura, le tacche, il cavo guida, l’uomo, la sua voce) | dalla prima traccia |
| Voci | le voci ascoltate, da rileggere, nell’ordine in cui le hai sentite | dalla prima eco |
| Traduzioni | i reperti decifrati, e ogni iscrizione nella lettura fatta con la matrice più avanti | dalla prima lettura |

**La cronaca sta nel ponte.** Il ponte tiene una voce per ogni comando della sequenza effettiva del
motore (`_voce_di_cronaca` in `ponte.py`): gli eventi del turno, il costo in aria, la stanza, l’atto, e
i segni con cui l’app compone le pagine. I segni si trovano come quelli del suono, per differenza fra
prima e dopo e dal comando, mai dal testo: una traccia di L.V. è uno dei cinque stati che la segnano
(`TRACCE_LV`), una voce è un’eco o una risonanza in più, una lettura è «traduci» su una delle sei
iscrizioni quando il traduttore è acceso (non nella protezione vitale, non sulla mappa stellare
spenta), un reperto è uno dei quattro che diventa «decifrato», le iniziali sono la placca esaminata.
L’app riceve a ogni turno la voce nuova e la lunghezza della cronaca (`cronaca` nel turno), e le pagine
le compone `app/src/gioco/diario/pagine.ts`, puro.

- **Deciso: la cronaca segue la sequenza effettiva del motore** (`_registro_comandi`). Un turno
  disfatto con ANNULLA esce anche dal diario, con la traccia che aveva trovato; dopo un caricamento la
  cronaca si ricostruisce rigiocando la sequenza su una copia, raccogliendo ciò che il caricamento del
  motore rigioca in silenzio. Il salvataggio resta com’era, senza il testo della partita: costa circa
  40 ms su un caricamento di 230 (in CPython, il percorso «tutto», 151 comandi). Il comando si legge
  come il motore l’ha registrato («esci» è «fuori»), così il diario è lo stesso prima e dopo un
  caricamento; una scelta del dialogo si legge con le sue parole.
- **Deciso: il fascicolo non dice quante tracce mancano**: niente posti vuoti, niente numeri. Le
  tracce stanno nell’ordine della strada di L.V. (`vita.fav`), non in quello in cui le trovi.
- **Deciso: il nome L.V. lo dice il gioco, non il diario.** Le iniziali stanno solo sulla placca della
  serra; finché il giocatore non l’ha esaminata, la pagina si chiama «Prima di te» e il fascicolo
  «Qualcuno, prima di te». Il percorso «tutto» non esamina la placca, e il suo diario non dice mai L.V.
- **Deciso: una lettura per iscrizione**, quella fatta con la matrice più avanti (a pari matrice,
  l’ultima), con la soglia scritta accanto («matrice al 18%», «allo 0%»). I reperti, tutti, nell’ordine
  in cui li hai decifrati.
- **Deciso: nelle schede il nome della stanza non si ristampa** (lo dice la riga sopra, con il turno);
  nella trascrizione sì, perché è la partita come l’hai letta.
- **Deciso: i suggerimenti del passato restano accesi ma non si premono** (`TestoInerte` nella lamina):
  il loro momento è passato, e la grammatica li riconosce lo stesso, con tutte le parole dei verbi che
  il motore conosce (`verbi` nella compilazione).
- **Deciso: il diario è una pagina**, larga quanto la colonna della lamina e i suoi margini (41 em),
  non un pannello a tutto schermo; la trascrizione si apre sull’ultimo turno, le altre pagine
  dall’inizio. Le schede si scorrono con le frecce (il modello ARIA delle schede); Tab resta dentro il
  pannello, e le schede non scelte si raggiungono con le frecce.
- **Deciso: «diario» e «menu» hanno due pulsanti discreti** sopra l’angolo destro della lamina, per
  chi gioca con il mouse: fino a qui la pausa si apriva solo con Esc. Il 06 metteva il «menu» nella
  barra del visore (§4). Nella pausa c’è la voce «Diario», e D funziona anche da lì.

Un difetto trovato strada facendo: le righe per i lettori di schermo, che sono assolute, dentro un
foglio che scorre si appoggiavano al velo del pannello e allungavano lo schermo (che poteva scorrere di
lato a un `scrollIntoView`). Il foglio ha adesso la sua posizione.

| Prova | Esito |
|---|---|
| `python collaudo/diario.py` | **nuovo**: 14 percorsi su 14, 1.291 voci; la cronaca ricostruita dopo un caricamento è uguale a quella giocata, voce per voce; ANNULLA toglie il turno disfatto; le iniziali solo con la placca; la protezione vitale non è una lettura; il diario non cambia la partita |
| `npm --prefix app run prove` | 63 su 63 (sette nuove, `prove/diario.test.ts`) |
