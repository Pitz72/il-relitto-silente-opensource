# Registro delle modifiche

Le modifiche rilevanti al gioco e all’app, versione per versione. Formato
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); numeri di versione
[SemVer 2.0.0](https://semver.org/lang/it/) secondo le regole di
[`sviluppo/VERSIONI.md`](sviluppo/VERSIONI.md). Il *come* e il *perché* di ogni passo stanno nei
documenti di `progettazione/`.

## [Non rilasciato]

### Per chi gioca

- **L’intro è nuova, come al cinema.** La plancia della Santa Maria si vede nitida e grande; il fuoco passa dal radar all’oblò, e nell’oblò le stelle si spengono una a una dietro la sagoma nera; il faro si accende, cerca e si perde nel buio. Il titolo si scrive con i glifi alieni, che la matrice traduce lettera per lettera. Alla fine la camera esce dal nero del fuso, arretra fino alla plancia intera e la porta nel visore: lì comincia la partita, senza stacchi.
- **La registrazione dell’inizio respira**: il nastro della scatola nera si muove con il fiato e con il cuore, e si interrompe dove la traccia è rovinata.

### Cambiato

- **Le scene definitive dell’intro** (richiesta dell’autore del 29 ottobre 2026: «portare a livello top questa intro», con «un tocco cinematografico»; documento 09, §12). La scaletta, i tempi, i testi e il suono restano quelli dello storyboard (2:40,75; le 92 prove dell’app verdi), e la musica che verrà si potrà scrivere sugli stessi tempi. **C, D e H** non sono più quadri fermi a 1.280 punti: c’è una plancia sola, `s_01_b` intera a 3.120 × 1.328, con il vetro dell’oblò bucato (`strumenti/intro/plancia_hd.py`), e una camera che si muove sopra (`app/src/intro/plancia.ts`). Dietro il vetro il motore della scala disegna dal vivo la vista fuori (un quadro nuovo, `plancia`, e un’ottica che mette il quadro nel vetro o lo ingrandisce: `scala.ts`). In C il cambio di fuoco è vero, dalla console alla parete, con l’obiettivo che «respira»; il radar è a fosforo, con la scia, gli echi, il settore muto e le scritte «CONTATTO · N.ID.» ed «ECO — —»; la spia rossa della prossimità batte una volta al secondo e getta luce sulla console; le quattro stelle che si spengono sono punti veri del bordo del fuso, cercati quando l’intro si prepara, e le copre il fuso, non un tempo. In D il relè del faro si accende sotto lo schermo, la lampada esita una volta e il fascio entra dal basso a destra, cerca di pochi gradi nella polvere e si perde; la camera si accosta piano all’oblò. **H** entra nel nero del fuso sopra la nave ed esce dal vetro dell’oblò; arretra fino alla plancia intera, che con le bande che si ritirano diventa la telecamera di bordo (la scritta «cam 01 · plancia · tsc-1972», le righe del monitor, la tinta della lente) e vola nella lente del visore, allo stesso pixel (controllato). La partita parte sotto l’intro (`Relitto.tsx`), e l’intro si apre sul gioco; saltata prima, la partita parte come sempre. L’interfaccia finta della fase dell’animatic non c’è più. **A** ha il nastro della scatola nera ai lati della spia, che scorre dal centro: il fruscio, il respiro di L.V. che si accorcia, i quattro colpi del cuore, e i buchi della traccia negli stessi istanti del suono; la voce dell’apparecchio si stampa lettera per lettera con il cursore, quella di L.V. viene a fuoco salendo appena. **G**: i glifi si tracciano come incisi, con l’alone; la matrice aggancia ognuno con quattro angoli prima di tradurlo, e la lettera nasce ciano e si raffredda nel bianco; il titolo intero prende aria e una luce lo attraversa una volta. Sopra la plancia c’è la grana della scheda «Grafica» (mossa, ferma o niente). Il movimento ridotto ha la sua versione di ogni scena nuova. Misurato nel browser di sviluppo: 60 fotogrammi al secondo fissi in C, D e H. Le immagini dei quadri fermi (`plancia-radar`, `plancia-oblo`, `plancia-faro`, `lente`) escono dal gioco; entrano `plancia-hd.webp` (519 kB) e `plancia-sfocata.webp` (30 kB), nel registro delle immagini. Nello sviluppo, `?nuova` porta dritti all’intro di una partita nuova e `&da=150` la fa partire da quel secondo.

## [0.2.5-beta.6] - 2026-10-29

### Per chi gioca

- **William racconta in prima persona.** Tutto il gioco, dalla Santa Maria ai finali, ora lo dice lui: «Lancio la scansione lunga», «Sono fuori», «Qualcuno è arrivato fin qui prima di me». I suggerimenti per chi gioca stanno fra parentesi, come «(ANALIZZALA.)», e restano pulsanti.
- **I salvataggi di prima si caricano lo stesso**, con l’avviso che la storia è cambiata.

### Cambiato

- **La prima persona** (decisione dell’autore del 29 ottobre 2026, pensando a una versione recitata: William ha la voce di Leonardo Tomassetti, che nel *Mistero della Santa Maria* legge già in prima persona anche le descrizioni dei luoghi). Prima l’atto I, come prova, poi tutti gli atti: circa 370 frasi in tutti i quattordici `.fav`, la seconda eccezione al congelamento del 16 ottobre. William racconta al presente, in prima persona («Regolo la taglierina», «Mi siedo sullo scafo nero»); ogni indizio che parla a chi gioca va fra parentesi, staccato dal racconto («Lo scanner saprebbe leggerla. (ANALIZZALA.)», «(Adesso puoi ACCOSTARE.)», «(STACCALO.)»), e i 41 suggerimenti in maiuscolo trovano ancora tutti il loro pulsante (`collaudo/menu.mjs`). Restano come erano le voci degli altri (Yusuf, l’Anziano, le echi, L.V., le traduzioni), le etichette delle scelte e i messaggi del motore («Puoi vedere qui», «Uscite», «Stai portando»), che sono la voce del gioco e non di William. Cambiano con il testo l’ultima frase dell’intro (la plancia, `intro/Intro.tsx`), l’inizio del crollo nella fuga che il ponte riconosce per il suo segno (`motore/ponte.py`: senza, il crollo sarebbe rimasto muto), sei attese dei percorsi di `collaudo/` e i commenti che citano il testo (`regia.rs`, `stanze.rs`, `atmosfere.ts`, `suggerimenti.ts`); le trascrizioni sono rigenerate. Tutti i collaudi sono verdi: i quattordici percorsi, i pulsanti, i menu, gli scritti, il suono (gli stessi 1.826 eventi), il diario, i salvataggi, la tipografia e le 92 prove dell’app. Cambia l’impronta della storia: i salvataggi di prima si caricano «ricostruita», con l’avviso.

## [0.2.5-beta.5] - 2026-10-27

### Per chi gioca

- **Le stanze si vedono.** Nel relitto il multiscanner disegna ogni stanza quando ci entri, e la scansione cambia con quello che fai (la nicchia vuota, la teca dissolta, il pilastro acceso o spento, la mappa sulla cupola del Ponte); sulla Santa Maria le telecamere di bordo mostrano la cuccetta, la stiva, la sala macchine e, da fuori, lo scafo.
- **Le novità, dopo ogni aggiornamento.** Quando il gioco si riapre con una versione nuova, il menu dice in poche righe che cosa è cambiato; e prima di scaricarla, la domanda «È uscita la versione…» dice che cosa porta.
- **I loghi d’apertura scorrono lisci**, senza fermarsi a metà.
- **Le scritte piccole sono cresciute**: nessuna sotto i 12 pixel, anche sugli schermi piccoli.
- **A gioco fermo il computer si riposa**: la scheda video lavora meno della metà di prima.
- **Il testo segue la finestra**: allargandola o stringendola, la risposta resta in vista.
- **Dopo la sospensione del computer** lo sfondo del menu torna com’era, invece di restare nero.
- **In una finestra, senza lampi**: con l’opzione «Schermo intero: no, in una finestra» il gioco si apre direttamente in finestra, invece di passare un attimo dallo schermo intero.
- **Se l’audio si rompe, il gioco va avanti**: senza suono, invece di chiudersi.
- **Il sottotitolo nuovo**: «Una storia tratta da Il Registro della Santa Maria», nel menu, nell’intro e nei titoli di coda.
- **L’aria non scende sotto lo zero**: quando la tuta resta senza fiato, il visore segna 0, come dice il testo, e non più un numero sotto lo zero. I salvataggi fatti prima si caricano lo stesso, con l’avviso che la storia è cambiata.
- **Lo schermo di gioco è più vivo**: una grana leggera come su un monitor di bordo, la luce della stanza che respira dietro il testo, un segnale che corre sul filo delle azioni, il riflesso del casco e, quando l’aria è poca, il fiato che appanna il vetro.
- **I passaggi si vedono**: entrando in una stanza il nome si posa e la telecamera di bordo cambia canale; una cosa presa scivola fra quelle che porti; la cellula dell’aria si contrae a ogni consumo e si allarga con una ricarica; dietro i pannelli il gioco si sfoca.
- **Una scheda «Grafica» nelle Opzioni**: tre livelli, piena, leggera ed essenziale, e ogni effetto acceso o spento a parte.
- **Le vene hanno sempre il colore della zona**: cambiando zona restavano del colore di prima, rosse anche dopo la fuga.

### Aggiunto

- **Le novità dopo un aggiornamento** (nota dell’autore del 19 ottobre 2026; revisione 25, L15, la seconda metà). Ogni versione del CHANGELOG ha ora una sezione **«Per chi gioca»**, la prima: poche righe semplici, per chi gioca e non per chi programma, che scrivo io (decisione dell’autore). La build le mette nel gioco (`strumenti/changelog.mjs`, `app/vite.config.ts`); al primo arrivo al menu con una versione diversa dall’ultima vista, una finestra le mostra (`app/src/menu/FinestraNovita.tsx`): quelle di tutte le versioni arrivate da allora, la più recente prima, con «chiudi» sempre in vista. Le mostrano anche le pre-release; chi installa da zero non vede niente (per lui non c’è niente di nuovo), e nemmeno chi torna a una versione più vecchia. La versione vista si ricorda nel browser dell’app (`relitto.versione-vista`). Le stesse righe vanno nel corpo della release (`node strumenti/versione.mjs corpo`, in `rilascio.yml`), e quindi nel `latest.json`: la domanda «È uscita la versione…» le mostra prima di scaricare. `verifica --rilascio` non lascia rilasciare una versione senza le sue righe. La finestra e la domanda, quando si aprono da sole, non cerchiano il primo pulsante (come il menu), e il gioco cerca un altro aggiornamento solo dopo che le novità sono state chiuse. Nello sviluppo, `?novita` mostra la finestra con le righe di «Non rilasciato», e `?aggiornamento-finto` la domanda con le stesse righe.
- **Le viste delle stanze nel visore** (revisione 25, E1; documento 06, §8; il piano lo ha deciso l’autore: «genera tu le stanze del relitto usando immaginazione, dettagli presi dalla storia e la qualità SVG che sai fare tu», e per la Santa Maria «puoi usare tranquillamente le location del sequel», 19 ottobre 2026). Prima la lente aveva una vista vera in una stanza su ventitré, la plancia. **Il relitto** ha ora diciotto scansioni del multiscanner, una per stanza, disegnate in codice (`app/src/gioco/visore/scansioni/`): ogni stanza è descritta in metri, dal punto in cui ci si entra, con quello che dice il testo del gioco (le tre gole del vestibolo e il risuonatore nella nicchia, le teche forzate e il groviglio, il germinatoio, la Grande Porta con il diagramma di stelle e le tre tacche, le bobine e il vano vuoto, la serra con il seme e l’uomo in tuta, le capsule di stasi coperte di brina, i bassorilievi dei tre soli, i globi di testo dello scriptorium, i pilastri dell’arca con l’ultimo che pulsa d’ambra, le alcove a nido d’ape con il Navarca, i cento soli del nido, la stella del Ponte, il buio dell’anticamera, l’Anziano di punti di luce). Una telecamera virtuale la proietta in nuvole di punti per righe di scansione, come un lidar, con le linee, le masse scure, i bagliori e le marche verdi sugli oggetti schedati. Diciassette varianti seguono lo stato della partita (`turno.suono.stati`). Entrando nella stanza il multiscanner la legge una volta, da sinistra a destra; poi la scansione resta ferma e a gioco fermo non costa niente (la ricostruzione di prima ridisegnava la lente trenta volte al secondo). Nella fuga trema, con la protezione vitale si abbassa, nell’ipossia si appanna; con il movimento ridotto compare intera. Ogni scansione ha una frase per il lettore di schermo. Disegnarne una costa al più 4 ms. **La Santa Maria** ha le scene canoniche del sequel nella telecamera di bordo: la cuccetta (`s_03`), la sala macchine (`s_05`) e, per la stiva, la sua poppa con il boccaporto e le tute (`s_10`: la stiva del sequel, `s_04`, ha pallet e casse, quella del Relitto è vuota da sei settimane). Lo scafo è la telecamera esterna, composta in codice come le copertine (`strumenti/viste/scafo.py`): la Santa Maria canonica davanti alla massa nera, legata dalle funi degli arpioni, con la luce gialla del boccaporto. Le immagini nuove sono nel registro (`grafica/LICENZE.md`) e nei riconoscimenti. Nello sviluppo, `?scansioni` mostra tutte le scansioni con le loro varianti (`?scansioni=teche&grande` una sola, larga). Tre prove in node: ogni stanza ha la sua vista; ogni variante si disegna dentro la cornice, sempre uguale e in fretta; gli stati cambiano il disegno, la chiave e la frase.
- **L’interfaccia viva, il primo lotto** (richiesta dell’autore del 27 ottobre 2026: «un rafforzamento importante della parte estetica, animazioni, effetti, lievissime pulsazioni»; documento 30). La grana (`gioco/Grana.tsx`: una tessera di rumore fatta una volta, su uno strato che si sposta a scatti con una trasformazione), il riflesso del vetro del casco e il fiato che lo appanna sotto il 30 %, la luce della stanza dietro la lamina, il segnale sul filo alto del ramo; l’arrivo in una stanza (il nome e la sua riga di luce, la telecamera di bordo che cambia canale, le righe del monitor, la spia della registrazione); la cellula dell’aria che si contrae e si allarga; i baccelli che si spostano dal posto di prima (FLIP) e quelli nuovi che germogliano lungo il filo; la sfocatura dietro i pannelli (revisione 25, E6), con i movimenti dietro fermi. Tutto dietro il movimento ridotto, che lo ferma.
- **La scheda «Grafica» nelle Opzioni** (decisione dell’autore del 27 ottobre: niente si toglie, «al massimo fai un pannello impostazioni per la grafica più evoluto»; documento 30, §8). Tre livelli (piena, di base; leggera; essenziale) e un interruttore per la grana, le vene, la luce della stanza, il segnale, i riflessi e la sfocatura (`stile/opzioni.ts`, `QUALITA`, `qualitaDi`; gli attributi `data-grana`, `data-riflessi`, `data-luce`, `data-segnale`, `data-sfocatura` sulla radice dello schermo).

### Cambiato

- **Il motore Favella1 1.6.1** (richieste dell’autore del 26 e del 27 ottobre 2026; documento 29). La copia in `motore/` è rifatta dal tag `v1.6.1` (prima 1.5.0), con gli stessi file; i `.fav` non cambiano, come deciso il 16 ottobre. Il Relitto gioca identico: 255 partite giocate con la 1.5.0 e con la 1.6.0 (i percorsi di collaudo e partite a caso dell’esploratore), 39.083 passi, con la stessa impronta e gli stessi pulsanti a ogni passo; il testo cambia solo nell’eco di un nome sconosciuto scritto a mano (`Non vedo 'cammello' qui.` invece di `Non vedo 'un cammello' qui.`). La 1.6.1 cambia dalla 1.6.0 una sola espressione regolare, che trova le stesse dichiarazioni. Nella modalità a solo testo il motore capisce anche i comandi con un numero («prendi 2 il faro di prua» vale «prendi il faro di prua»), e il verbo nuovo «consuma», che nei menu non compare. Tutti i collaudi sono verdi, anche nell’eseguibile vero, e con il solo cambio di motore i salvataggi fatti con il motore 1.5.0 si caricano identici, senza avviso (provato anche sui sei salvataggi veri dell’autore). Le frasi nuove della 1.6 (l’invariante `resta sempre fra`, i passaggi `senza ritorno`, le relazioni, le procedure, gli oggetti contabili) non sono usate, tranne l’invariante per l’aria, che l’autore ha voluto il 27 ottobre (sotto, in «Corretto»); il documento 29 dice dove servirebbero le altre. Il prezzo è all’avvio: dentro Pyodide la storia si compila in 0,80 secondi invece di 0,62, durante la dichiarazione. La 1.6.0 ne prendeva 0,93, per un difetto di Favella1 che la 1.6.1 corregge (la ricerca degli oggetti contabili ripartiva da ogni carattere del sorgente); il resto è il parser della grammatica 1.6, più grande, che si costruisce a ogni avvio.
- **Il codice del gioco più ordinato** (revisione 25, L13). La tastiera del gioco è uscita da `Gioco.tsx` in un modulo suo (`gioco/tastiera.ts`), com’era; le sonde delle prove (quella dei finali, la prova dei salvataggi nell’eseguibile, il percorso di collaudo dello sviluppo) in `gioco/sonde.ts`: `Gioco.tsx` passa da 916 a 755 righe. I numeri romani degli atti, che stavano copiati in quattro file, e i mesi, in due, sono scritti una volta sola (`lib/italiano.ts`). Il campionario del sistema visivo (`?campionario`) non entra più nelle versioni da pubblicare; la pagina di prova sì, perché le prove automatiche girano nell’eseguibile vero. La spia del ponte che riconosce le cose nominate da un comando scritto non dipende più dal nome di una funzione del motore scritto in una stringa: se il motore la rinominasse, il ponte non partirebbe invece di diventare cieco in silenzio, e `collaudo/scritti.py` ora controlla che un comando scritto a mano risolva la stessa cosa del suo pulsante (con la spia accecata apposta, la prova cade). Restano com’erano, apposta, i comandi del prototipo nel motore audio (`Ambiente`, `Nave`, `Rampa`, `Cammina`): li usano la pagina di prova del suono e le registrazioni.
- **Un errore nell’audio non chiude più il gioco** (decisione dell’autore, 19 ottobre 2026; revisione 25, M4). L’eseguibile di rilascio era costruito con `panic = "abort"`: un errore in un punto qualunque, anche nel thread dell’audio, chiudeva tutto il gioco. Ora è `panic = "unwind"`: se cade il thread dell’audio, cade solo lui e il gioco continua muto. Provato nell’eseguibile con una caduta finta del thread dell’audio a metà della prova dei sei finali (in una build di prova, non nel repository): con `abort` il gioco si chiudeva lì, con `unwind` ha finito i sei finali e i titoli di coda. Il prezzo: l’eseguibile passa da 12,7 a 16,7 MB, ma compresso, come si scarica, da 9,0 a 9,7 MB.
- **Il sottotitolo del gioco** (decisione dell’autore, 19 ottobre 2026; revisione 25, L6): era «dal racconto «Il Relitto», in Dal registro della Santa Maria», con la prima parte in corsivo e il titolo del libro in tondo, al contrario dell’uso italiano. L’autore l’ha riscritto: «Una storia tratta da *Il Registro della Santa Maria*», in tondo e con il titolo del libro in corsivo, nel menu, nei titoli di coda, nel cartello del titolo dell’intro (anche nella frase per il lettore di schermo), nell’elenco dei riconoscimenti e nelle copertine social (`strumenti/copertina/componi.py`, rigenerate). Il cartello del titolo resta fermo i suoi 6,55 secondi dello storyboard anche se il sottotitolo ha una parola in meno: l’intro dura sempre 2:40,75, e la sua musica, ancora da fare, si potrà scrivere sui tempi di sempre.

### Corretto

- **I loghi d’apertura non si inceppano più** (revisione 25, M1): il motore del gioco si carica finiti i loghi, durante la dichiarazione. Prima le sue chiamate sincrone fermavano l’immagine dei loghi per quasi un secondo; ora durante i loghi resta un solo blocco di 79 ms, quando si montano.
- **Nessun testo sotto i 12 px** (revisione 25, M3, E5 ed E10): a 1280 × 720 (uno schermo 1920 × 1080 al 150 %) i tasti delle uscite scendevano a 8,5 px, gli attrezzi a 10,4, le didascalie del visore a 10,5. Ora ogni testo che si legge o si tocca sta a 12 px almeno: il ramo è un po’ più grande e si stringe solo fin dove resta leggibile (se non basta, una voce in più va nel «+N»); le etichette dei gruppi del ramo sono nel maiuscoletto delle targhe, sempre sopra il filo (sotto il filo basso uscivano dallo schermo); le scritte di servizio del visore hanno una forma sola, nella membrana come nell’acciaio. Controllato giocando i sei finali a tre misure di finestra.
- **Il gioco fermo non fa più lavorare la scheda video come un videogioco d’azione** (revisione 25, M10). Misurato nell’eseguibile: nel relitto, a gioco fermo, la pagina usava il 46–50 % di un core e la scheda video il 42–53 %. Le vene, la lente, la cellula e l’oscilloscopio ora disegnano a 30 fotogrammi al secondo, il respiro della lamina va a scatti lenti, l’impulso della mappa ha uno strato suo: la pagina scende al 16–28 % di un core e la scheda video al 16–22 %, come nel menu.
- **La risposta resta in vista quando cambia la finestra** (revisione 25, L9): la lamina sceglieva dove scorrere solo al turno nuovo, e allargando o stringendo la finestra la risposta poteva restare tagliata. Ora l’ancora si rifà quando la lamina o il suo testo cambiano misura (`ResizeObserver`), finché chi gioca non fa scorrere a mano: allora il testo resta dove l’ha messo, fino al turno dopo. Provato nel browser dello sviluppo da 1280 × 720 a 1000 × 460.
- **Lo sfondo del menu sopravvive alla perdita del contesto WebGL** (revisione 25, L10): quando il sistema toglie la scheda video alla pagina (un driver aggiornato, il ritorno dalla sospensione) lo sfondo restava nero o fermo. Ora il menu chiede il contesto indietro e, quando torna, rifà la scena da capo (`menu/Sfondo.tsx`); l’intro, se lo perde a metà, si salta e si va al gioco, come senza WebGL2. Provato nel browser dello sviluppo con `WEBGL_lose_context`: perso e restituito, lo sfondo torna a disegnare le stelle.
- **La finestra nasce come la vuole l’opzione** (revisione 25, L8): con «Schermo intero: no, in una finestra» il gioco partiva comunque a schermo intero (lo diceva `tauri.conf.json`) e ne usciva quando la pagina leggeva l’opzione, un lampo a ogni avvio. Ora la pagina ricorda l’opzione anche al processo Tauri (`finestra.json`, nella cartella della configurazione), che crea la finestra già nella forma giusta, nascosta finché non l’ha presa: così sparisce anche la finestra normale che, a schermo intero, si vedeva per 60 ms prima di allargarsi. Senza il file, a schermo intero, come prima. Misurato da fuori con le API di Windows, nell’eseguibile: la prima finestra visibile è già 1616 × 939 in finestra, o 1920 × 1080 a schermo intero, e non cambia.
- **I comandi lenti fuori dal thread principale** (revisione 25, L12): aprire il dispositivo audio (`audio_mondo_avvia`, `audio_avvia`) e scrivere un rapporto giravano nel thread principale, e la finestra si fermava per quel tempo. Ora girano a parte, come i salvataggi; gli altri comandi dell’audio restano dove sono, apposta, perché sono brevi e devono arrivare nell’ordine in cui la pagina li manda (il gioco aspetta che il mondo sonoro sia partito prima di mandarne).
- **Il percorso della cartella di lavoro non è più nell’eseguibile** (revisione 25, L7): il gioco ci cercava la musica come ultimo ripiego, anche nelle versioni da pubblicare. Ora il ripiego c’è solo nello sviluppo, e nell’eseguibile il percorso non entra nemmeno (controllato: nessuna traccia della cartella del progetto). Restano i percorsi interni delle librerie di Rust, che nelle versioni costruite su GitHub sono quelli della macchina di GitHub e non dicono niente di nessuno.
- **Il nome del motore è «Favella1»** (decisione dell’autore, 19 ottobre 2026; revisione 25, L5): la dichiarazione all’avvio lo scriveva già così, e il motore stesso si chiama da sé «favella1»; il piede del menu, i titoli di coda, il file «Riconoscimenti e licenze.txt», le etichette dei loghi per il lettore di schermo, la scritta del caricamento e il README dicevano invece «FAVELLA 1». Ora dicono «Favella1» (nel piede del menu «Favella1 1.5.0»). La scritta disegnata del logo resta «FAVELLA1», com’è il marchio; la riga di copyright della licenza del motore, che dice «FAVELLA 1», la corregge `strumenti/riconoscimenti.py` come già correggeva il nome dell’autore. I documenti di progetto dei giorni scorsi restano come sono stati scritti.
- **Le venature non si fermano più quando la finestra misura zero** (trovato provando le scansioni): ridotto il gioco a icona, la tela delle venature misurava zero, il disegno dalla memoria lanciava un errore e il ciclo delle vene si fermava per sempre, fino alla schermata dopo. Ora con una tela vuota non si disegna niente, e il ciclo dei disegni chiede il fotogramma dopo prima di disegnare, così un errore non lo ferma più (`gioco/ritmo.ts`).
- **Le vene con il colore del clima** (documento 30, 1.1). Dalla revisione 25 (M10) le vene leggevano i colori dal CSS una volta per clima, proprio quando il CSS li stava cambiando: tenevano quelli di prima fino al clima dopo (ciano nel laboratorio invece che azzurre, rosse davanti all’Anziano dopo la fuga). Ora li prendono dalla tavolozza del clima e li mescolano nel tempo del passaggio, come il resto dello schermo.
- **Le animazioni lente a piccoli passi** (documento 30, §8). Il respiro della luce, del vetro e del fiato, l’impulso della mappa, il segnale e la luce dei suggerimenti andavano a 60 fotogrammi e facevano ricomporre lo schermo intero a ogni fotogramma; a passi di 10–30 al secondo (`steps()`), invisibili a quella lentezza, e con le animazioni che partono una volta lasciate libere quando finiscono (`backwards`), il gioco fermo nel relitto costa alla scheda video l’11–15 %, contro il 15–18 % di prima del lotto e il 37–40 % del lotto con le animazioni a 60 (misurato nell’eseguibile, 1920 × 1080). `strumenti/misure/consumo.mjs` ora spegne le cose sugli elementi: il `<style>` aggiunto alla pagina, nell’eseguibile, lo blocca la politica di sicurezza dei contenuti.
- **L’aria resta fra 0 e 100** (decisione dell’autore del 27 ottobre 2026; documento 29, §6.1 e §9). Nella fuga l’aria scende di 4 a turno, 8 con il risuonatore, e nel turno della morte andava sotto lo zero: nel percorso `limite-I3` la partita finiva con l’aria a −5, e il visore segnava −5 mentre il testo dice «La cifra sul visore è a zero». Ora `aria.fav` dice `L'aria resta sempre fra 0 e 100.`, l’invariante di Favella1 1.6, e le cinque conseguenze `e adesso l'aria resta fra 0 e 100` scritte a mano dopo le ricariche (la cella di riserva in `santamaria.fav`, la ricarica al generatore in `tecnica.fav`) sono tolte: il tetto lo tiene l’invariante. È la prima riga dei `.fav` cambiata dal congelamento del 16 ottobre. Sui 2.529 comandi dei file di `collaudo/` il testo è identico, e l’impronta cambia in due passi soli, la morte di `limite-I3` e il passo dopo (aria 0 invece di −5); la soglia della morte scatta come prima. Nelle 255 partite del documento 29 (39.083 passi, con le partite a caso dell’esploratore) testo e pulsanti sono identici a ogni passo; l’impronta cambia in 16 passi, tutti a partita finita per l’aria, con 0 invece di un numero fra −1 e −5. Tutti i collaudi sono verdi, anche nell’eseguibile vero; `collaudo/finali-menu.json` si riscrive identico. Cambia l’impronta della storia, quindi i salvataggi di prima si caricano «ricostruita», con l’avviso che la storia è cambiata: provato sui sei salvataggi veri dell’autore, tutti ricostruiti fino al loro turno.

### Sicurezza

- **Le dipendenze e le azioni fissate** (revisione 25, L14): `@tauri-apps/plugin-process` e `@tauri-apps/plugin-updater` avevano il `^`, unici fra le dipendenze dell’app: ora sono fissate alla versione del lockfile (2.4.0 e 2.14.0). Le azioni dei flussi di GitHub erano fissate al numero maggiore (`@v4`), che chi le pubblica può spostare: ora all’impronta del commit, con la versione in un commento (`actions/checkout` v4.4.0, `actions/setup-node` v4.4.0, `actions/setup-python` v5.6.0, `swatinem/rust-cache` v2.9.2, `tauri-apps/tauri-action` v0.6.2, `dtolnay/rust-toolchain` sul canale `stable`). Le dipendenze di Rust le fissa già `Cargo.lock`, nel repository.
- **I nomi dei rapporti delle prove** (revisione 25, L11): `scrivi_rapporto` rifiutava le barre e `..` ma non i due punti, che su Windows aprono `C:nome` e i flussi alternativi (`nome:flusso`). Ora un nome è `prova-` seguito solo da lettere, cifre, punti, trattini e trattini bassi, che esclude anche i nomi riservati di Windows (CON, NUL…). Una prova in Rust.

## [0.2.5-beta.4] - 2026-10-19

### Cambiato

- **Nessuna modifica al gioco.** Questa pre-release serve a vedere dal vero la barra dell’aggiornamento: una 0.2.5-beta.3 installata la scarica mostrando i megabyte, e poi si installa.

## [0.2.5-beta.3] - 2026-10-19

### Aggiunto

- **Si vede l’aggiornamento che scarica** (nota dell’autore dopo la prima prova riuscita dell’aggiornamento automatico, 19 ottobre 2026; revisione 25, L15). Prima, dopo «Aggiorna», un avviso spariva in tre secondi e si restava ad aspettare senza sapere niente. Ora un pannello sopra il menu dice la versione che arriva, riempie una barra con i megabyte scaricati («Scarico l’aggiornamento: 21,3 di 43,9 MB (48 %).») e poi dice «Scaricato. Installo: il gioco si chiude e si riapre da solo.»; se qualcosa va storto lo dice, e il gioco resta com’era. Prima di scaricare, la partita in corso va da sola nel posto automatico, e la domanda lo dice.

## [0.2.5-beta.2] - 2026-10-19

### Cambiato

- **Nessuna modifica al gioco.** Questa pre-release serve a provare l’aggiornamento automatico (`sviluppo/VERSIONI.md`, §7): una 0.2.5-beta.1 installata da GitHub deve trovarla nel canale di prova, scaricarla, controllarne la firma e installarla.

## [0.2.5-beta.1] - 2026-10-19

### Aggiunto

- **I titoli di coda** (decisione dell’autore, 19 ottobre 2026; `app/src/riconoscimenti/Titoli.tsx`). I riconoscimenti non sono più una schermata da sito all’avvio: scorrono alla fine, come al cinema, con la loro canzone, **«Voice in the Deep»** (Lyria 3.5, 2:58; generata dall’autore con lo stile e il testo in inglese del documento 22, §5.9: la solitudine, l’estinzione, il lasciare una traccia). Il nastro va con l’orologio della canzone: l’ultimo cartello arriva quando la voce canta da sola l’ultima riga, «A voice in the deep», a 2:40,5, resta fermo tre secondi, e poi tutto va lentamente nel nero (sette secondi) mentre la canzone sfuma con lui (`Brano::Titoli` e `Comando::Sfuma` nel motore audio). Partono dopo un finale, con il pulsante «Titoli di coda» accanto ad «Annulla l’ultima mossa», «Ricomincia» e «Carica», e dalla voce «Riconoscimenti» del menu; alla fine si torna al menu. Il titolo e l’autore; le fondamenta, la musica, i suoni, le immagini e i caratteri, con il ruolo a sinistra e il nome a destra; le librerie, soli nomi, in un blocco fitto; i marchi. L’ultimo cartello è il titolo e, in bianco, i marchi di Runtime Multimedia e di FAVELLA 1 (`app/src/loghi/Marchi.tsx`, le forme dei loghi d’apertura). «salta», Esc o Invio li chiudono (nel nero in poco più di un secondo); la rotella del mouse li porta avanti e indietro; con il movimento ridotto si mostrano a pagine, che durano quanto serve per arrivare all’ultima riga con la voce. La prova dei finali nell’eseguibile, dopo l’ultimo finale, li fa partire e li salta.
- **Il file «Riconoscimenti e licenze.txt» accanto al gioco**: le righe di copyright e i testi interi delle licenze, che prima stavano nella schermata, in un file di testo da leggere con il Blocco note, nell’installazione e nella versione portatile. Lo scrive `strumenti/riconoscimenti.py` insieme all’elenco, e `--verifica` controlla anche lui.

### Cambiato

- **All’avvio, i loghi e la dichiarazione**: i riconoscimenti non compaiono più prima del gioco (e il gioco non ricorda più quali nomi sono stati visti).
- **La dichiarazione impaginata per lo schermo largo** (nota dell’autore sulla 0.2.4: è un gioco da scrivania, niente impaginazioni da telefono): non è più una pila stretta al centro, ma una lastra orizzontale, con la vena a sinistra, il testo allineato a sinistra, e «Buon divertimento» e «continua» sulla stessa riga. Come nel menu, «continua» non ha più il contorno all’arrivo.

### Corretto

- **Il menu non cerchia più la prima voce all’avvio** (nota dell’autore sulla 0.2.4): arrivando al menu senza aver cliccato un pulsante (per esempio quando la dichiarazione passa da sola) «Continua» aveva già il contorno, e a chi gioca col mouse sembrava già scelta. Il fuoco resta sulla prima voce, così Invio la prende, ma il contorno compare solo alla prima freccia.

## [0.2.4] - 2026-10-19

### Aggiunto

- **Le copertine social** (16 ottobre 2026; `progettazione/24-copertina-e-logo.md`, §9): in cinque formati (16:9, 21:9, 9:16, poster 2:3, anteprima 2:1), composte in codice (`strumenti/copertina/componi.py`): il fuso nero che mangia le stelle, il seme verde, la Santa Maria canonica, il titolo con i caratteri del gioco. L'anteprima da 1280 × 640 è nel repository (`grafica/copertine/`), le altre si rigenerano.
- **La revisione totale** (18 ottobre 2026; `progettazione/25-revisione-totale.md`): le criticità del codice per gravità (nessuna gravissima, 5 gravi, 10 medie, 15 lievi), i difetti trovati giocando a cinque misure di schermo, e dieci proposte per l’estetica.

### Corretto

- **La pausa non porta più alla pagina delle misure tecniche** (revisione 25, G1): il pulsante c’era in ogni build, ricaricava la pagina e la partita in memoria si perdeva. Ora c’è solo nello sviluppo.
- **Il «chiudi» delle Opzioni è sempre in vista** (revisione 25, M2): il pannello era più alto dello schermo e il pulsante finiva sotto il bordo, senza barra per accorgersene. Le schede e il piede restano fermi e scorre solo il foglio, con una sfumatura e «continua ↓» quando c’è altro.
- **Annullare la mossa di un finale non spegne più il mondo** (revisione 25, G2): dopo la morte, «Annulla l’ultima mossa» lasciava suonare la musica della chiusura sopra la partita e poi il mondo taceva del tutto, con il fiato fermo. Il ponte manda adesso l’evento `ripresa` quando un ANNULLA accorcia la sequenza dei comandi, e la regia lo tratta come un caricamento; un caricamento rimette a posto anche il fiato dopo gli ultimi respiri, la radio della plancia, i fondi, il re toccato e il filo. Una prova in Rust, un ramo nuovo in `collaudo/eventi.py`.
- **Cambiare le cuffie a partita in corso non stona più la musica** (revisione 25, M4): se il dispositivo passava a un’altra frequenza (per esempio da 48 a 44,1 kHz), la musica dai file suonava l’8 % più lenta e un semitono e mezzo più bassa, e i filtri del mondo si spostavano. Il mondo sonoro resta alla frequenza con cui è nato e la sua uscita si ricampiona; un mondo nuovo nasce alla frequenza del dispositivo di quel momento. Una prova in Rust.
- **Il thread audio non tocca più il disco e non libera la musica** (revisione 25, M5): quando un brano partiva, il thread audio cercava il file sul disco e creava un thread; quando un pezzo usciva di memoria, liberava lì decine di megabyte. Su un disco lento o con l’antivirus erano buchi possibili proprio all’ingresso di un brano. Ora i file si cercano una volta, quando nasce la biblioteca della musica, e un solo thread di lavoro decodifica e libera; il lettore non alloca più nel suo passo. Tre prove in Rust.
- **L’aggiornamento automatico legge un canale fisso** (revisione 25, G3): chiedeva la release «Latest» di GitHub, che nel repository è la v1.5.3 del gioco originale; l’indirizzo dava 404, «Cerca aggiornamenti» rispondeva «serve la rete» anche con la rete, e le release del remake, con numeri più bassi, rischiavano di non essere mai viste. Ora il gioco legge la release fissa `aggiornamenti` (le build di una pre-release `aggiornamenti-prova`), dove il nuovo flusso `canale.yml` copia il `latest.json` quando l’autore pubblica una versione. I messaggi distinguono la rete assente, il canale ancora vuoto e la firma sbagliata.
- **Le prove girano su GitHub, e il rilascio parte solo a prove verdi** (revisione 25, G5): il nuovo flusso `prove.yml` lancia a ogni push su `main` (non per i soli documenti) le prove in Rust, le 14 partite nel motore audio, i riconoscimenti e le versioni su Windows, e le prove in node con tutti i collaudi del gioco su Linux. `rilascio.yml` le chiama prima di costruire. Linux esce dal rilascio finché l’autore non lo prova su una macchina vera e non accende la variabile del repository `LINUX_PROVATO`.
- **La chiave di firma degli aggiornamenti è nuova, con una password** (revisione 25, G4): quella del 16 ottobre non aveva password e stava in una copia sola. La chiave pubblica in `tauri.conf.json` è cambiata: le consegne di prova 0.2.2 e 0.2.3 non si aggiorneranno da sole.
- **Uscendo non si perde più la stanza in corso** (revisione 25, M6): chiudendo la finestra (la X, Alt+F4) o con «Esci» dal menu, la partita in corso va nel posto automatico, e «Continua» la riprende da lì; prima si salvava solo al cambio di stanza. Nelle versioni da pubblicare i tasti del browser non fanno più niente: F5 e Ctrl+R ricaricavano la pagina e perdevano la partita, Ctrl+P stampava, Ctrl+F cercava, Alt+← tornava indietro.
- **Gli errori hanno una via d’uscita** (revisione 25, M7): se il gioco si inceppa compare una schermata con una frase, «Riavvia il gioco» (che prima salva, se può) e il dettaglio tecnico ripiegato, da copiare; prima c’era la pila delle chiamate in rosso, senza pulsanti. Se il motore non parte, il menu lo dice e offre di riavviare, invece di restare per sempre su «importazione del motore…». Senza WebGL2 l’intro si salta e si va al gioco, invece di restare sul messaggio.
- **Un comando che cade non lascia la partita a metà** (revisione 25, M8): se qualcosa si rompeva durante un comando (un demone, il turno, il ponte), il clic non faceva niente, senza dirlo, e la partita poteva restare a metà. Ora il ponte fotografa la partita prima di ogni comando e, se cade, la rimette com’era; il gioco dice «Questo comando non è andato a buon fine: la partita è rimasta com’era.».
- **I salvataggi resistono di più** (revisione 25, M9): se in Documenti non si può scrivere (l’«Accesso controllato alle cartelle» di Windows) i salvataggi vanno nella cartella dei dati del gioco, invece di fallire a ogni cambio di stanza; ogni file si scrive davvero su disco prima di prendere il posto del vecchio; se OneDrive o l’antivirus tengono il file per un attimo si riprova; il posto automatico tiene la versione di prima, da cui si riparte se l’ultima si rovina. Le operazioni sui salvataggi non fermano più l’interfaccia.
- **I riconoscimenti di lark** (revisione 25, L2): sotto il copyright compariva una riga del testo della licenza MIT.
- **Testi** (revisione 25, L1, L3, L4): il refuso «un’ avventura» nelle opzioni; il README diceva «versione 0.2.0» e «niente comandi da scrivere»; nel registro delle modifiche la 0.2.2 aveva due sezioni «Aggiunto» e la 0.2.1 diceva che la musica generata non era ancora collegata.

## [0.2.3] - 2026-10-16

### Aggiunto

- **Il logo e l'icona dell'eseguibile** (16 ottobre 2026; `progettazione/24-copertina-e-logo.md`): un fuso nero che mangia le stelle, con il seme verde al centro, disegnato in codice (`strumenti/logo/disegna_logo.py`; master e vettoriale in `grafica/logo/`). **Sostituisce l'icona di Tauri** (i due cerchi giallo e azzurro) nell'eseguibile, nell'installer e nel collegamento; le icone dell'app sono rigenerate dal master con `tauri icon`.

## [0.2.2] - 2026-10-16

### Aggiunto

- **La modalità a solo testo** (16 ottobre 2026; `progettazione/18-modalita-solo-testo.md`, §8): nelle opzioni, «Comandi: con i pulsanti / scritti». Scritti, il gioco è un'avventura testuale pura: una riga di comando al posto del ramo (Invio, frecce su e giù per i comandi già dati, Esc), l'elenco, le risposte del dialogo e le domande del motore nel testo, e le parole dell'app (SALVA, CARICA, DIARIO, OPZIONI, MENU, TASTI, RICOMINCIA, AIUTO). Il ponte capisce i comandi scritti («x placca», «prendila», «staccalo») come quelli dei pulsanti, così il diario e il suono non perdono niente. Nuovo collaudo `collaudo/scritti.py` e `tipografia.mjs --solo-testo`; cinque prove in node.
- **L'aggiornamento automatico** (16 ottobre 2026; `sviluppo/VERSIONI.md`, §7): il gioco cerca una versione nuova nelle release su GitHub (all'avvio se l'opzione «Aggiornamenti» lo vuole, di base sì; a mano dal menu, «Cerca aggiornamenti»), lo dice e chiede; installa solo pacchetti **firmati** con la chiave dell'autore (chiave pubblica in `tauri.conf.json`). Il flusso di rilascio (`.github/workflows/rilascio.yml`) costruisce Windows e Linux su un tag `v` + versione e prepara una bozza di release con il suo `latest.json`. Non provato su GitHub finché non c'è il primo tag.
- **I riconoscimenti della musica** (16 ottobre 2026): la schermata «Riconoscimenti e licenze» ha una sezione «La musica» con i 17 brani generati (titolo, dove suona, Lyria 3.5 o Suno, licenza), ricavata da `audio/musica-ia/REGISTRO.md` da `strumenti/riconoscimenti.py`. Poiché aggiunge nomi, la schermata si rivede al primo avvio dopo l'aggiornamento. La **dichiarazione sull'IA** dice anche della musica (testo approvato dall'autore).

## [0.2.1] - 2026-10-16

### Aggiunto

- **Il suono dell'intro** (16 ottobre 2026; storyboard, §11): l'intro ha adesso la sua colonna sonora, sintetizzata nel
  motore e legata ai momenti dell'animatic (fruscio e buchi della traccia, clic della spia, respiro, cuore, re nel
  vuoto, reattore, radar, relè del faro, brusio dalla radio, glifi e lettere del titolo, console che parte). La musica
  vera (B, E, G) aspetta Lyria: i prompt sono nel documento 22, §5.8; intanto suona una guida del re. Quattro prove in
  Rust, una in node; `rendi_intro` rende l'intro su file e dice il livello di ogni scena.
- **Il mix d'autore e la console di regia** (16 ottobre 2026, dall'ascolto dell'autore; bibbia sonora, §12): i livelli
  relativi dei canali (fiato, ventola, re, macchine, stanza, corpo, bengala, colpi, brusio, echi, radio, pulsanti,
  musica) sono decisi dalla regia in `app/src/gioco/livelli.json`, un file solo per il motore e per la pagina, e si
  regolano ascoltando con **Ctrl+Maiusc+M** (la console, in qualunque schermata): uno strumento di sviluppo, presente solo nello sviluppo e nelle consegne di ascolto (`RELITTO_REGIA=1`), non nelle versioni da pubblicare. Di partenza il fiato scende di 10 dB, la
  ventola, le macchine e la stanza di 6, il re di 4. **L'interfaccia ha il suo cursore** («Interfaccia» nella scheda
  Audio) e non sta più sul canale degli effetti. Due prove in Rust.
- **Il lettore dei file di musica** (16 ottobre 2026; `progettazione/22-musica-con-lyria.md`, §10): il motore audio suona
  adesso i diciassette MP3 di `audio/musica-ia/`: il menu (due pezzi che si alternano), le soglie degli atti, i quattro
  letti dell'Anziano (uno per gruppo di nodi, incrociati al cambio di nodo, silenzio vero a «silenzio»), le chiusure dei
  finali. Ogni pezzo è portato allo stesso livello, passa dal cursore «Musica» e dalla pausa, non dalla sala (i file hanno il
  loro riverbero). Se un file manca suona la musica sintetizzata di prima. I file sono nelle risorse dell'installazione.
  Dieci prove in Rust più una sui file veri. **Da ascoltare nel gioco** prima di ogni integrazione sintetizzata.
- **La scheda «Audio» nelle opzioni** (16 ottobre 2026, richiesta dell’autore): le opzioni hanno due schede, «Gioco» e «Audio». In «Audio» tre cursori da mixer (0–100, anche con le frecce) — **Effetti** (tutto il suono del mondo), **Musica** e **Parlato** — più il volume generale, mono, dinamica e suoni intensi. Il parlato ha già il suo canale nel mixer in Rust (`Mix.parlato`), pronto per le voci che l’autore registrerà con il TTS di Google; per ora non ci passa niente. I vecchi cursori «Ambienti» e «Voci» non ci sono più: li muove tutti l’unico «Effetti». Una prova in Rust.
- **La licenza** (16 ottobre 2026, scelta dell’autore): **MIT per il codice** (`LICENSE`) e **CC BY-NC-SA 4.0 per
  la storia, i testi, le immagini e la musica**; la divisione precisa, le dipendenze di terzi, i loghi e la nota
  sull’intelligenza artificiale stanno in `LICENZE.md`. Vale anche per `old_version/`, dal commit che la introduce.
- **La musica generata** (`progettazione/22-musica-con-lyria.md`, `audio/musica-ia/`): i brani del menu, le soglie
  degli atti, i letti dell’Anziano, le chiusure dei finali e il tema, generati con Lyria 3.5 (Google Flow Music) e
  con Suno, in MP3, con il registro file per file. Li suona il lettore dei file di musica, qui sopra.
- **Il filo del Sintonizzatore** (bibbia sonora, §5.3 e §11.6): il flusso che si stacca dal brusio passa per uno
  spostamento di frequenza vero, a banda laterale unica (+60–90 Hz: il ritmo e l’intonazione restano, le
  parole no). Ogni eco ha la sua voce (l’Ingegnere urgente, le pareti del corridoio a quattro fili, il Capitano
  lento, l’Ufficiale medico piano, il Navarca tremante, il Custode grave…); il secondo strato è lo stesso filo,
  più grave e nudo, senza il coro; il Piccolo è un anello di quattro secondi che ricomincia uguale, e resta il
  fruscio quando smette; la lastra incisa non parla, graffia. Tredici prove in Rust; ascolto 15
  (`cargo run --release --example rendi_echi`).
- **La musica** (D14; `progettazione/21-la-musica.md`): scritta e generata nel motore audio, con i materiali del
  gioco (il re del reattore, il campo del sol♯ a un tritono, le voci tenute del brusio che cantano l’accordo del
  clic, il sonaglio, un tam-tam strofinato, il vetro del tema, il battito del seme). Suona il menu principale
  (quattro episodi in ordine sempre diverso, si ricompone da sola), la soglia dei cartelli d’atto dal secondo,
  l’Anziano nodo per nodo (dal sol♯ al re; per otto secondi, a «Resto ad ascoltare», niente) e la chiusura di cinque
  finali su sei (a «Mani vuote» il reattore, e basta). Ha la sua sala, il suo cursore nelle opzioni («Musica») e si
  abbassa nella pausa. Tredici prove in Rust; ascolti 14 (`cargo run --release --example rendi_musica`).
- **Il tocco dei pulsanti anche nel menu principale**, che ha adesso un suo mondo sonoro (sempre di membrana).
- **Il suono dei pulsanti** (bibbia sonora, §5.8 e §11.4): un tocco su ogni pulsante del gioco, diegetico e
  sotto i −24 dB. Sulla Santa Maria è acciaio (un interruttore che sceglie, un relè in due tempi che
  conferma, un relè che si apre e annulla); al primo contatto la membrana cresce in cinque secondi e il
  tocco si fa morbido e umido, con un filo vetroso dentro l’accordo del sol diesis; nella fuga ogni tocco
  strappa la membrana. La pagina dice solo il gesto (`app/src/gioco/tocco.ts`), il motore decide la voce
  dallo stato (`app/src-tauri/src/mondo/interfaccia.rs`). Otto prove in Rust, cinque in node, e l’ascolto
  `progettazione/ascolti/13-interfaccia.mp3` (`cargo run --release --example rendi_interfaccia`).
- **Il gioco suona** (bibbia sonora, §11): a ogni turno la partita manda al motore audio gli stati e gli
  eventi del ponte, e la regia in Rust fa le ventitré stanze (ognuna con la sua aria, il suo fondo e i
  suoi passi), le scene del mix, gli ottantacinque eventi e i finali. Il mondo sonoro si abbassa nella
  pausa e tace tornando al menu.
- Nelle opzioni, il suono: il volume, gli ambienti, gli effetti, le voci, il mono, la dinamica ridotta, i
  suoni intensi ridotti (bibbia, §2.5).
- `strumenti/audio/traccia.py` (le tracce sonore dei percorsi), gli esempi `prova_partite` (le quattordici
  partite giocate dal motore audio, con i loro controlli) e `rendi_partita` (una partita intera su file).
- **Il diario** (06, §4.6; D, la pausa o il pulsante in alto): la trascrizione di tutta la partita,
  con i cartelli degli atti; il fascicolo di chi è passato prima, che si compone da sé e prende il
  nome di L.V. solo dopo la placca; le voci ascoltate, da rileggere; le traduzioni, ognuna nella
  lettura fatta con la matrice più avanti, e i reperti. La cronaca la tiene il ponte, comando per
  comando, e dopo un caricamento la ricostruisce rigiocando (`rel_diario`, `cronaca` nel turno);
  le pagine le compone `app/src/gioco/diario/pagine.ts`. Il collaudo `collaudo/diario.py` e sette
  prove nuove.
- I pulsanti «diario» e «menu» sopra la lamina, per chi gioca con il mouse.
- **La pagina dei tasti**, nella pausa (06, §6.2): come si gioca senza mouse, in quattro gruppi
  (muoversi, le cose, il testo e le voci, la partita). Prima lo schermo mostrava i tasti delle uscite e
  dei pannelli, ma non che le cose si raggiungono con Tab e che Invio apre il fiore: l’autore, a mano,
  non aveva trovato come si gioca con la tastiera.
- **I loghi d’apertura** di Runtime Multimedia e di FAVELLA 1, animati e sonori, copiati pari pari dal
  Viaggiatore (`app/src/loghi/`), dopo un attimo di nero; Esc li salta. Con loro, i caratteri Sora e
  Inter (SIL OFL) nei riconoscimenti.
- **La dichiarazione d’apertura**: come è nato il gioco, a ogni avvio, sul fondo dei riconoscimenti.
- **Yusuf al comunicatore**: il suo ritratto del sequel nella vista del dialogo.
- L’opzione «Schermo intero», che si ricorda; F11 la cambia anche nel menu.
- **La prova dei finali nell’eseguibile** (`RELITTO_PROVA=finali`; `python strumenti/prova_eseguibile.py
  finali`): dal menu principale, l’intro saltata, poi i sei finali giocati cliccando nell’interfaccia vera
  ogni pulsante, che deve essere in vista; l’impronta finale deve essere quella del motore in CPython
  (`collaudo/finali-menu.json`, che scrive `collaudo/menu.mjs`), e i sei finali devono finire nel
  registro. Ogni pulsante del ramo, del fiore, del dialogo e della conferma dice nel DOM che cosa manda
  (`data-comando`, `data-avvia`).
- **Il menu principale** (06, §4.6): Continua (la partita in corso, o il salvataggio più recente),
  Nuova partita (con l’intro, che Esc salta), Carica, Opzioni, Registro dei finali, Riconoscimenti,
  Esci, sopra la scena finale dell’intro, viva e lentissima. Dalla pausa si torna al menu, e la partita
  resta (`rel_riprendi` nel ponte). Il motore comincia a caricarsi all’avvio, dietro.
- **Il registro dei finali**: sei righe del registro di bordo, con il nome del finale, la riga che il
  gioco scrive e la data; su disco accanto ai salvataggi (`registro_finali_leggi` e
  `registro_finali_scrivi` nel processo Tauri).
- **La schermata «Riconoscimenti e licenze»** (06, §18.3), al primo avvio e quando arrivano nomi nuovi,
  saltabile dopo tre secondi: il gioco, le fondamenta (FAVELLA, Pyodide, CPython, lark, Tauri, kira,
  React), i suoni, le immagini, i caratteri, le librerie della pagina e del programma con le loro righe
  di copyright, i testi delle licenze. La genera `strumenti/riconoscimenti.py` dalle fonti vere
  (`--verifica` controlla che non resti indietro); i testi delle licenze in `strumenti/licenze/`; il
  registro delle immagini nuovo, `grafica/LICENZE.md`.
- **Le fondamenta del sistema visivo** (fase 3): i quattro caratteri dentro l’app (Newsreader, IBM
  Plex Mono, Big Shoulders Stencil, Atkinson Hyperlegible Next; SIL OFL, dai pacchetti Fontsource,
  solo il sottoinsieme latino, 457 KB); le atmosfere come variabili CSS da un modulo solo
  (`app/src/stile/atmosfere.ts`): Santa Maria, visore, relitto con le sue zone, fuga, e la protezione
  vitale e l’ipossia sopra; la forma, acciaio fino al primo contatto e membrana dopo; i contrasti di
  ogni testo in 54 climi provati sopra 4,5:1 (`app/prove/atmosfere.test.ts`); il movimento ridotto
  come attributo unico della radice; le opzioni di chi gioca (movimento, carattere, testo grande); il
  campionario delle misure (`?campionario`).
- **La lamina del testo con la grammatica tipografica** (06, §4.1 e §4.2): il riconoscimento di ogni
  tipo di testo del gioco in TypeScript (`app/src/gioco/lamina/grammatica.ts`): la stanza, la prosa,
  le voci del relitto, la scatola nera di L.V. e il prologo, le letture dello scanner, il dialogo, la
  riga del registro dei finali, e dentro la prosa i suggerimenti (pulsanti), la protezione vitale, ciò
  che è scritto sugli schermi, le etichette, la matrice, gli intraducibili, le scritte a stampo e
  quelle graffiate, i nomi delle cose toccabili. Ogni blocco ricostruisce il testo del motore
  carattere per carattere; l’unica trasformazione è l’apostrofo tipografico, solo a schermo. Il
  collaudo `collaudo/tipografia.mjs` lo prova sui 14 percorsi (1.308 turni) e sulle 1.131 stringhe dei
  `.fav`. La lamina (`Lamina.tsx`): il comando sopra la risposta con il costo in aria, la rivelazione a
  righe che Spazio o un clic completano, il turno di prima spento sopra, l’acciaio e la membrana.
  La pagina del gioco in costruzione (`?gioco`).
- **Il ramo delle azioni e il fiore** (06, §4.7 e §6): i menu del modello d’azione su due fili, le
  uscite come bocche con il loro tasto, le cose come baccelli, le azioni in fondo; sotto, gli attrezzi
  della tuta e ciò che porti. Quando il filo alto non basta le cose in più scendono, e il «+N» resta
  per i casi in cui sono pieni tutti e due (il caso peggiore dei percorsi, 26 baccelli, ci sta). Il
  fiore di una cosa nella fascia fra il testo e il ramo, su due anelli: la base e i verbi dell’autore
  vicino, gli attrezzi fuori, con la nota dell’attrezzo o la stima dell’aria (D16). «Usa con…» in due
  tocchi con tutte le cose possibili accese; gli attrezzi in mano, con il mirino; i suggerimenti che
  accendono il loro pulsante per sei secondi; la tastiera del §6.2 (le uscite, i numeri delle
  risposte, Esc, le frecce dentro il fiore). La geometria è pura e provata (`app/prove/ramo.test.ts`).
- **Il visore** (06, §4.3, §4.4, §4.7): la lente (la telecamera di bordo sulla Santa Maria, la
  ricostruzione del multiscanner nel relitto, in attesa delle viste della fase 5); l’aria come anello
  graduato nell’acciaio e come cellula che respira nella membrana, con il segno del consumo che si
  dissolve; la matrice con i glifi che si accendono alle soglie, le voci come spore, i tre incavi
  delle chiavi; prima della tuta, la console di bordo. I contatori compaiono quando il ponte dice
  `mostra`. La mappa come costellazione delle stanze viste, orientata come la bussola del gioco, con
  i monconi delle uscite mai prese. Il cartello d’atto, la fascia della protezione vitale (con
  l’ascolto e la traduzione spenti e il motivo), il bordo del visore che respira, la vignettatura
  dell’ipossia, il tremito della fuga che non tocca mai il testo.
- **Il dialogo, la conferma, i salvataggi; la pagina del gioco** (06, §4.5 e §4.6). Il dialogo copre il
  palco: la vista grande (la figura di punti dell’Anziano, il comunicatore di Yusuf, l’onda dell’eco),
  chi parla, la battuta con le didascalie, le risposte come semi numerati. Il congedo dell’Anziano
  chiede conferma («Da qui non si torna.», D16); la conferma del motore ha la stessa forma, con S e N.
  I salvataggi su disco: sei posti più uno automatico a ogni cambio di stanza, scritti dal processo
  Tauri in Documenti/Il Relitto Silente (`src-tauri/src/salvataggi.rs`, con le sue prove), mostrati
  con il riassunto senza rigiocare; F5 salva, F9 carica. La pausa (Esc) con le opzioni, l’annullamento
  dell’ultima mossa, il ricominciare; F11 per lo schermo intero; alla fine della partita Ricomincia e
  Carica sono dell’app. La pagina del gioco è quella principale; la pagina di prova resta su `?prova`
  e per le prove automatiche (`RELITTO_PROVA`); `RELITTO_PROVA=salvataggi` prova i salvataggi
  nell’eseguibile vero e scrive un rapporto.
- **La crescita della membrana al primo contatto** (06, §3): le venature entrano dai bordi e crescono
  in cinque secondi intorno al testo e agli strumenti, con le zone vietate prese dalle misure vere
  dello schermo; prima dell’energia sono fioche, con l’energia si accendono; nella protezione vitale si
  spengono, nella fuga si lacerano e lampeggiano, nell’ipossia sbiadiscono. Con il movimento ridotto
  sono ferme e compaiono in dissolvenza. Il generatore della prova tecnica è passato al gioco
  (`app/src/gioco/vene/`), e la pagina di prova lo misura da lì.
- **Il documento della prima metà della fase 3** (`progettazione/14-fase-3-sistema-visivo.md`: che
  cosa c’è, le decisioni prese, le misure, che cosa resta) e il prompt della sessione dopo
  (`progettazione/15-prompt-prossima-sessione.md`).
- **L’animatic dell’intro** (`app/src/intro/`, §10 di `progettazione/09-intro-storyboard.md`): tutte
  le scene sulla scaletta di 2:40,75, calcolata con la regola di lettura e provata contro la tabella
  dello storyboard; il motore della scala in un modulo (la scena E definitiva, e il margine di B); i
  glifi del titolo; il radar, la spia rossa e le stelle che si spengono disegnati dal vivo sui quadri
  della plancia; il salto, il movimento ridotto scena per scena, i sottotitoli dei suoni; una barra di
  revisione (`?intro&revisione`).

### Cambiato

- **Il suono è tutto sintetizzato** (decisione dell’autore, 15 ottobre 2026; bibbia sonora, §10). Il
  motore audio in Rust non legge più nessun file: il re, la ventilazione, le pompe, la ventola della
  tuta, il fiato, le voci del brusio, le lamiere, i relè, gli stivali, gli arpioni, l’urto degli
  scafi, il gemito della nave, le gocce, i granelli, le crepe e il riverbero delle stanze nascono da
  modelli fisici, in tempo reale (sintesi modale, attrito a scatti, bolle di van den Doel, voci a
  formanti, una rete di ritardi per le stanze). I dodici campioni del prototipo e i 109 file lavorati
  sono usciti dal pacchetto, dal repository e dalla schermata dei riconoscimenti, che adesso dice che
  ogni suono è sintetizzato. Il mondo sonoro parte in 26 ms invece di un secondo, e senza 86 MB di
  campioni in memoria. La pagina di prova fa suonare i colpi uno per uno; `examples/misura_strati.rs`
  misura ogni generatore; `python strumenti/prova_eseguibile.py mondo` misura il suono
  nell’eseguibile.
- L’app parte a schermo intero, nel nero, con i loghi; il nome dell’autore nei riconoscimenti è Simone
  Pizzi; le risposte dei dialoghi stanno una sotto l’altra.
- L’app si apre sul menu principale (o sui riconoscimenti, al primo avvio), non più dentro la partita;
  `?gioco` porta ancora dritti al gioco, per lo sviluppo. Le opzioni sono una sola per tutta l’app, e
  l’intro prende da lì il movimento ridotto.
- **Il motore passa a FAVELLA 1.5.0** (ambito `motore`; `progettazione/16-favella-1-5-0.md`). La copia in
  `motore/` si rifà dal tag `v1.5.0` del repository FAVELLA1; i `.fav` non cambiano e il gioco gioca
  identico, con lo stesso testo e la stessa impronta a ogni passo. Il ponte lascia i suoi tre rimedi
  per l’interfaccia pubblica degli ospiti: `nuova_partita` (il punto di partenza dopo l’apertura, L18),
  `prova` (il ramo disfatto, senza più sedici campi di sessione copiati a mano, N4) e
  `mostra_situazione` (la stanza ridisegnata dopo un caricamento senza segnarla come vista, L19).
  L’impronta della storia cambia con il motore: un salvataggio della 0.2.0 si carica comunque
  identico, perché il ponte riconosce che è cambiato soltanto il motore (`sviluppo/VERSIONI.md`, §4).
- I suggerimenti riconoscono anche «se lo ANALIZZI» (il presente, seconda persona, con il pronome davanti): la
  proiezione del Ponte accende il suo Analizza.
- `collaudo/menu.mjs` prende il ponte in Node da `collaudo/ponte.mjs`, che usa anche il collaudo della
  tipografia.
- Il diario passa da Tab a D (06, §6.2): Tab resta al fuoco della tastiera.
- La pagina di prova della fase 1 non è più la pagina principale dell’app: si apre con `?prova`, e
  parte da sola con `RELITTO_PROVA`.

### Corretto

- Con la tastiera, dopo un comando scelto nel fiore il fuoco si perdeva e Tab ripartiva da «diario»: ora
  torna sulla cosa da cui il comando era partito, anche alla fine di un dialogo. «Usa con…» e un
  attrezzo in mano portano il fuoco sulla prima cosa accesa, ed Esc lo riporta sulla cosa di partenza.
  Spazio su una cosa, mentre il testo sta comparendo, lo completa invece di riaprire il fiore.
- Con «Usa con…», quando la seconda cosa stava dietro un «+N», il ramo leggeva un petalo che non c’era
  più e l’app intera si smontava (succedeva con «usa il disco con l’altare»). L’ha trovato la prova dei
  finali nell’eseguibile.

## [0.2.0] - 2026-10-14

### Aggiunto

- **Il prototipo del suono** (bibbia sonora, §8): dodici sorgenti CC0 e di pubblico dominio,
  registrate in `audio/LICENZE.md`; la catena che ne fa 109 suoni (`strumenti/audio/`); il mondo
  sonoro in Rust (`app/src-tauri/src/mondo/`) con le cinque strade, il re, il fiato guidato
  dall’aria e il brusio granulare; la sezione «Suono» della pagina di prova e la sua misura
  automatica; tre ascolti in `progettazione/ascolti/`.
- **Le decisioni delegate dall’autore** (06, §18): lo storyboard dell’intro approvato, la musica
  fatta con i materiali del gioco, le licenze in una schermata prima del gioco.
- **L’app, fase 2 (il ponte e il modello d’azione).** Il ponte completo per FAVELLA 1.4: per ogni
  turno gli eventi (con l’intestazione e il prologo a parte), i pulsanti, le cose in vista con le
  regole dell’autore e i loro effetti, lo stato del visore (l’atto, la mappa delle stanze viste, i
  contatori che compaiono quando servono), il comando scomposto. Il modello dei menu in TypeScript
  (`app/src/azione/`): i verbi di una cosa filtrati per regole, attrezzi e stato, le quattro azioni di
  situazione, i tasti delle uscite, i suggerimenti in maiuscolo che accendono il loro pulsante.
  Decisioni e misure in `progettazione/12-fase-2-ponte-e-modello.md`.
- **I salvataggi** a riprese: il file con il formato di `versione.json`, l’impronta della storia, il
  seme, un riassunto per i posti, la sequenza dei comandi; il caricamento che rigioca e dice se la
  partita è identica, ricostruita su una storia cambiata o diversa; i rifiuti dei file estranei, più
  recenti o danneggiati.
- **Gli stati e gli eventi per il suono** (bibbia sonora, §1.6 e §2.4): 51 stati, 84 tipi di evento
  trovati per differenza fra prima e dopo il turno, il finale riconosciuto per nome.
- **I collaudi dell’app**: `collaudo/menu.mjs` (i sei finali con i soli menu), `collaudo/salvataggi.py`
  (salva e ricarica in ogni stanza), `collaudo/eventi.py` (il suono), le prove del modello
  (`npm --prefix app run prove`).

### Cambiato

- I documenti di progettazione usano gli apostrofi tipografici anche nelle parti vecchie
  (`strumenti/apostrofi.py`).
- Il collaudo a pulsanti salta i comandi che non cambiano niente, nemmeno il turno («giù» dove non si
  scende), invece di giocarli con un altro comando a vuoto.
- La pagina di prova non ristampa il prologo sulla plancia, e salva e ricarica a metà del percorso.

### Corretto

- Un salvataggio fatto dopo la prima stanza si caricava «diverso»: il punto di partenza del motore
  precede la prima stanza mostrata. Il ponte lo fissa dopo l’apertura (lezione L18).
- Caricare segnava come vista la stanza in cui si era, e dopo la gola del ritorno l’impronta non
  tornava più. Il ponte mostra la stanza su un ramo, poi disfatto (lezione L19).

## [0.1.0] - 2026-10-14

### Aggiunto

- **Il gioco, rifatto.** Il remake de «Il Relitto Silente» in FAVELLA 1.4.4: 23 stanze, 93 oggetti,
  6 finali, quattordici moduli; rivisto e corretto (`progettazione/04-revisione.md`). Collaudo:
  14 percorsi con le loro attese, più la prova di ripresa di ogni oggetto.
- **L’app, fase 1 (la prova tecnica).** Tauri 2 con React 19 e TypeScript; il motore FAVELLA vero
  dentro Pyodide, con lark, senza rete; il ponte (`app/src/motore/ponte.py`) che per ogni turno
  restituisce eventi, pulsanti e stato degli strumenti; una schermata grezza che gioca la partita a
  soli pulsanti; l’audio in Rust con kira (il re del reattore sintetizzato, un campione in loop); le
  venature della membrana su canvas. Misure in `progettazione/08-fase-1-prova-tecnica.md`.
- **Il collaudo a pulsanti** (`collaudo/pulsanti.py`): i 14 percorsi giocati con i soli pulsanti del
  motore, attraverso lo stesso ponte dell’app.
- **Le versioni**: `versione.json`, `sviluppo/VERSIONI.md`, `strumenti/versione.mjs`, questo registro.
- **L’intro, storyboard 2** (`progettazione/09-intro-storyboard.md`): otto scene, 2:40, i testi fermi
  il tempo di leggerli. La tavola dei fotogrammi chiave e il quadro finito della scala in WebGL2
  (`09-intro-tavola.html`, `09-prova-di-look.html`); gli strumenti con cui sono fatti in
  `strumenti/intro/`. In attesa di approvazione.
- **La bibbia sonora** (`progettazione/10-bibbia-sonora.md`): le 23 stanze e gli eventi, le cinque
  strade del suono con la fisica del vuoto, il fiato, il brusio, le fonti e le licenze. Il registro
  delle licenze dei suoni (`audio/LICENZE.md`).
