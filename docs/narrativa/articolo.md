# Il Relitto Silente: Come ho costruito un'avventura testuale nel 2026 (e cosa ho imparato nel vuoto)

*di Simone Pizzi*

Fissare un cursore verde che lampeggia su uno schermo nero ha un fascino ipnotico. In un'epoca dominata da motori grafici fotorealistici e mondi virtuali sconfinati, l'idea di chiedere a un giocatore di leggere del testo e digitare dei comandi su una tastiera sembra, a prima vista, un anacronismo. Eppure, c'è una magia purissima in quell'interfaccia scarna. Non c'è grafica, non c'è voce, non c'è musica nel senso tradizionale del termine. C'è una storia, un parser e la finestra nera che attende il tuo input.

**Il Relitto Silente** è un'avventura testuale fantascientifica in italiano, nata come un esperimento e diventata il progetto di cui sono più soddisfatto da anni. 

*Nota per il lettore: questo articolo è un diario di sviluppo e una riflessione di game design, non un semplice comunicato promozionale. Il gioco è attualmente disponibile per il download gratuito sul mio sito, ma i paragrafi che seguono contengono spoiler oggettivi su meccaniche, enigmi e snodi narrativi. Siete avvisati.*

---

### Le Origini: Da un drago procedurale all'abisso cosmico

La genesi di questo progetto è stata tutt'altro che lineare. La primissima versione, che oggi sembra appartenere a un'altra era geologica, si intitolava *Il Cavaliere e il Drago*. Era un esperimento tecnico puro, costruito all'interno di Google AI Studio App Builder per testare l'integrazione di un'Intelligenza Artificiale (Google Gemini) all'interno di un'interfaccia React. L'idea era affascinante: usare l'IA come un vero e proprio Dungeon Master invisibile, capace di generare stanze, gestire l'inventario e rispondere dinamicamente alle follie del giocatore restituendo file JSON strutturati.

Funzionava. Ma mancava di anima.

L'imprevedibilità dell'algoritmo sacrificava il controllo autoriale. Le descrizioni erano generiche, il senso di progressione labile. Ho capito in fretta che se volevo creare un'atmosfera densa, tangibile, dovevo riprendere in mano la penna e il codice. Ho abbandonato il fantasy procedurale e ho abbracciato la fantascienza artigianale, passando a un motore statico e pre-programmato.

È importante essere espliciti su un aspetto metodologico: **Il Relitto Silente è stato realizzato con un'assistenza significativa e consapevole dei modelli di linguaggio**. Il percorso ha attraversato due fasi distinte. La prima, già descritta, è nata negli strumenti di Google. La seconda — quella che ha trasformato il progetto in ciò che è oggi — è stata condotta in stretta collaborazione con **Claude Sonnet 4.6 tramite Claude Code**, lo strumento di sviluppo assistito di Anthropic, che mi sta dando grandi soddisfazioni. Non si tratta di generazione automatica di contenuti: ogni scelta narrativa, ogni decisione di design, ogni riga di codice è stata discussa, verificata e voluta. L'IA è stata un interlocutore tecnico e creativo straordinariamente preciso; l'autorialità, la responsabilità e la visione sono rimaste mie.

La premessa narrativa è arrivata di getto. Un esploratore spaziale solitario, un mercante a bordo della vecchia nave *Santa Maria*, si avvicina a un relitto alieno dimenticato ai margini del sistema solare. La nave è morta da millenni, ma al suo interno c'è qualcosa che aspetta. E c'è anche la traccia impossibile di un essere umano passato di lì ottocento anni prima. Mi piaceva l'idea di un'archeologia doppia: il giocatore che esplora i resti di una civiltà aliena e, contemporaneamente, scopre i resti di un suo simile. Due solitudini parallele separate dai secoli.

### L'Architettura del Vuoto: Dal monolite ai moduli

La versione 1.0 era, tecnicamente parlando, un miracolo di ingegneria caotica. Lo stack era già quello definitivo, composto da React 19, TypeScript e Vite, ma l'architettura interna era piatta come un foglio di carta. Tutto viveva in un unico, enorme oggetto di stato globale. Le stanze erano ammucchiate l'una sull'altra in un file monolitico, con una logica condivisa che si contaminava costantemente. Aggiungere un comando nella *Stiva* rischiava di romperne uno nel *Ponte di Comando*. 

Tra la versione 1.0 e la successiva ho fatto una cosa che i manuali sconsigliano vivamente: ho smontato quasi tutto.

L'ho fatto perché, arrivato a un certo punto, ogni nuova funzionalità richiedeva di toccare tre file contemporaneamente e di tenere a mente dipendenze implicite non documentate. Il codice era diventato più opprimente del relitto che stavo programmando.

Il risultato più importante di questo titanico refactoring è stata la separazione netta tra dati e logica. Sono passato a un approccio *Entity-Component lite*. Ogni stanza è diventata un file TypeScript autonomo che esporta un oggetto specifico, dotato di una propria descrizione, dei propri oggetti interagibili e dei propri comandi locali. Il parser centrale smista l'input e non sa assolutamente nulla di narrativa. È un arbitro, non un attore.

> *L'architettura giusta non è quella che rende le cose facili da costruire. È quella che rende le cose difficili da rompere senza accorgersene.*

### Il Parser: La parte più sottovalutata del Game Design

Se c'è una cosa che chiunque voglia fare un'avventura testuale deve scolpirsi nella mente è questa: **il parser è il gioco**.

Non la storia, non gli enigmi, non l'estetica. Il parser. Se le parole del giocatore vengono fraintese o rifiutate per ragioni che sembrano arbitrarie, il patto fiduciario si rompe. La sospensione dell'incredulità, già fragile in un medium testuale, collassa miseramente. All'inizio, un comando innocuo come `usa il disco sull'altare` falliva silenziosamente perché l'articolo `il` mandava in crisi le espressioni regolari.

Ho dedicato al parser una cura maniacale. La funzione di normalizzazione dei comandi oggi rimuove accenti, articoli determinativi e indeterminativi, pronomi dimostrativi e collassa gli spazi multipli. Traduce preposizioni complesse (facendo sì che `con` o `sopra` diventino un semplice `su`), gestisce le abbreviazioni classiche come `x` per esamina e normalizza le direzioni spaziali. 

Il risultato di questo paziente lavoro di artigianato è che frasi come `usa quella maledetta taglierina sulla crepa dannata` e il semplice `usa taglierina su crepa` raggiungono oggi l'esatta medesima funzione logica. Il parser non è più un muro di gomma, ma un alleato flessibile.

### Costruire l'atmosfera senza un solo file MP3

Una delle decisioni più peculiari e soddisfacenti dell'intero progetto è stata quella di non usare alcun file audio. Niente MP3, niente campionamenti registrati. Tutta l'atmosfera sonora del gioco, che varia drasticamente da stanza a stanza, è generata proceduralmente in tempo reale tramite la *Web Audio API* del browser.

Ho programmato cinque profili ambientali distinti:
*   **Ship:** bassi a 55 e 110 Hz mescolati a rumore bianco, a simulare il respiro meccanico e faticoso della nave umana.
*   **Alien Quiet:** 432 Hz con un oscillatore a bassa frequenza, per restituire l'interno alieno che non è ostile, ma profondamente estraneo.
*   **Alien Cold:** 28 Hz, una vibrazione subsonica che trasmette il gelo dello spazio vuoto, un suono che si sente nello stomaco più che nelle orecchie.
*   **Alien Electric:** frequenze irregolari a onda quadra, per le stanze dove la tensione e il pericolo latente sono palpabili.
*   **Sacred:** 528 Hz con una modulazione morbidissima, riservata al Santuario Centrale per evocare la presenza di qualcosa di antico e deliberato.

Il cambio di area innesca incroci sonori calcolati al millisecondo, dissolvenze che impediscono artefatti o fastidiosi "click" digitali. Il giocatore non nota la transizione tecnica, percepisce solo che l'aria intorno a lui è cambiata.

### Dare un'anima al vuoto: La Narrativa e "Frequenza di Servizio"

Tecnicamente il gioco era finito molto prima di esserlo davvero. Tutti i puzzle scattavano, le stanze erano esplorabili e i tre atti si susseguivano correttamente. Eppure mancava qualcosa di vitale. Il protagonista non *sentiva* nulla. 

Si comportava come una telecamera su un treppiede. Raccoglieva dati e li riferiva con glaciale distacco. Trovava il cadavere di un astronauta umano, morto di stenti ottocento anni prima, e lo descriveva con la stessa emotività riservata a un pannello di controllo guasto.

Per risolvere questo problema, ho dovuto prima capire chi fosse davvero William, il pilota della *Santa Maria*. Per farlo, sono uscito dal codice e ho scritto un racconto prequel, intitolato **Frequenza di Servizio** (anch'esso disponibile gratuitamente sul sito). In questa storia, durante una noiosa traversata spaziale, William capta una voce femminile sulla frequenza morta della radio. Non è un SOS, ma la voce di una ragazza che parla di pioggia, di latte e di vita quotidiana. Alla fine, William scopre che la ragazza non è reale, ma è una Coscienza Virtuale addestrata con memorie umane, contenuta in una cassa stivata nella sua stessa nave e destinata a un parco a tema. Il dialogo struggente tra l'uomo isolato nello spazio e la macchina prigioniera nel buio digitale mi ha permesso di mettere a fuoco la profonda malinconia e l'umanità del protagonista.

Tornato al codice, ho applicato questa nuova consapevolezza con la regola dell'arte della sottrazione. Non ho inondato il gioco di testi, ma ho inserito monologhi interiori brevi e chirurgici. Il momento del ritrovamento del corpo umano ora è preceduto da una pausa reale, forzata dal comando `[PAUSE]`, obbligando il giocatore a premere Invio prima di continuare la lettura, perché alcune cose non si elaborano in tempo reale. Ho persino tagliato diverse frasi dal monologo finale dell'ologramma alieno, convinto che il vuoto lasciato da quelle parole comunicasse il senso di sacrificio molto meglio di una spiegazione didascalica.

### L'ultimo chilometro: La simulazione sistematica e i bug invisibili

Prima di dichiarare il gioco completo, ho compiuto un esercizio di pazienza estrema: ho chiesto a Claude di simulare l'intera partita dall'inizio alla fine, comando per comando, verificando ogni singolo ramo logico e ogni flag di stato. 

È stato illuminante. Sono emersi quattro bug critici che nessun test automatico avrebbe mai scovato, in quanto si trattava di errori di *game design* e non di sintassi.

Il primo riguardava il cadavere umano. Il monologo e le riflessioni associate potevano essere completamente bypassati se il giocatore digitava `esamina forma` invece di `esamina cadavere`. Il momento narrativo più forte del gioco poteva saltare per una semplice scelta di sinonimi non prevista dal codice.

Il secondo coinvolgeva il *Disco di Pietra*. La sua descrizione suggeriva erroneamente che i simboli incisi corrispondessero alla Grande Porta a Ovest, spingendo il giocatore a perdere frustranti decine di minuti nel posto sbagliato, quando invece andava usato sull'altare del Santuario.

Il terzo era un cortocircuito logico nel Ponte di Comando. Esaminando la postazione, il gioco rispondeva trionfalmente che la nave "riconosce che hai riunito l'eredità", anche se in realtà il giocatore non aveva ancora inserito i tre artefatti necessari, distruggendo la coerenza temporale degli eventi.

Il quarto, il più subdolo, riguardava l'attivazione del *Cristallo Dati*. L'azione era stata programmata come comando specifico della stanza del Corridoio Principale. Se un giocatore, agendo con logica, avesse tentato di combinare il cristallo e il dispositivo medico subito dopo averli raccolti nell'Arca Biologica, il gioco avrebbe restituito un fallimento silenzioso. Niente errori, niente indizi, solo il nulla.

Tutti e quattro i problemi sono stati risolti, ma senza quella simulazione sistematica sarebbero finiti dritti nella versione finale.

### Oltre il Browser: Il traguardo finale

Oggi *Il Relitto Silente* ha raggiunto la versione **1.5.1**.

Non è più una semplice pagina web. Grazie all'implementazione di un wrapper *Electron*, il gioco è un eseguibile desktop standalone per Windows. L'assenza della barra degli indirizzi, dei menu e delle distrazioni del browser cambia psicologicamente l'approccio dell'utente. Ora ci sono solo il giocatore, il buio e il cursore.

L'estetica visiva che si è sedimentata nel corso dello sviluppo è, a mio avviso, uno degli elementi più riusciti del progetto. Testo verde fosforescente su sfondo nero assoluto, carattere pixel art *Press Start 2P* che richiama direttamente i terminali a raggi catodici degli anni Ottanta — quell'unica tonalità di verde che, in certi monitor vintage, sembrava quasi radiosa. In basso, una barra di tasti funzione etichettata alla maniera di un vecchio menù DOS. Al centro, lo spazio netto del testo che scorre e il cursore che lampeggia, paziente. Non è nostalgia fine a se stessa: è coerenza narrativa. Un gioco che parla di civiltà perdute, di tempo che erode tutto e di voci che sopravvivono ai corpi non poteva che indossare il volto di qualcosa che sembra già sopravvissuto a un'era.

Il gioco vanta 15 stanze scritte a mano, 11 echi temporali captabili per ricostruire l'ultima notte della civiltà aliena, un sistema di traduzione progressivo che avanza a ogni scoperta, cinque slot di salvataggio manuale più un autosave su filesystem nativo, una mappa testuale ASCII a rivelazione progressiva — le stanze compaiono man mano che si esplorano, con la posizione corrente sempre marcata — e un sistema di suggerimenti contestuali che analizza posizione, inventario e flag per indicare il passo successivo senza mai fare spoiler sul come. C'è una schermata di pausa richiamabile in qualsiasi momento (tasto F9), con accesso rapido al salvataggio e al caricamento durante la partita. E al termine, una schermata di statistiche con barre e valutazione su quattro livelli, basata su scoperte, echi captati e percentuale di traduzione completata. Zero dipendenze critiche, zero errori di compilazione.

C'è qualcosa di profondamente affascinante nel costruire un'avventura testuale oggi. Molti lo considerano un formato defunto, sopravvissuto a stento in una nicchia di accademici e nostalgici. Io credo esattamente il contrario. 

Il testo puro, privo di appigli grafici o vocali, impone al lettore di partecipare attivamente alla costruzione del mondo. Ogni stanza che descrivo con il codice è in realtà una collaborazione silenziosa: io fornisco le coordinate spaziali e narrative, ma è la mente del giocatore a costruire lo spazio, a decidere l'odore dell'aria viziata e a dare un volto all'oscurità. 

Non è un limite del medium. È la sua magia più grande. 

Il relitto, in fondo, si dice sia silente. Ma lavorandoci per tutti questi mesi, ho scoperto che non è mai stato davvero vuoto.