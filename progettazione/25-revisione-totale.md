# La revisione totale: criticità, difetti, estetica

Versione 1.0, 18 ottobre 2026. Chiesta dall’autore all’inizio della sessione, prima di riprendere le cose in sospeso: «una revisione totale del codice per individuare criticità gravissime, gravi, medie e lievi su ogni aspetto dello sviluppo del gioco, una revisione di bug, glitch e possibili problemi grafici e una analisi di miglioramento globale dell’estetica». Fotografa il repository al commit `29328d1` (versione 0.2.3). Non corregge niente: ogni voce dice dove sta il problema, che cosa succede a chi gioca e come lo si corregge. Le correzioni le decide l’autore.

---

## 0. In breve

**Lo stato è sano.** Tutte le prove passano: 65 in Rust, 81 in node, e i collaudi del gioco (14 percorsi, 1291 comandi giocati con i pulsanti e con i menu, i 6 finali raggiunti dai soli menu, il diario, gli eventi del suono, la tipografia dei 1131 testi dei `.fav`, la modalità scritta). Il controllo dei tipi è pulito, la console del browser non ha errori. I salvataggi sono scritti bene (sei posti fissi, nessun percorso arbitrario, scrittura atomica, impronte della storia e dello stato). Il motore audio non ha `unwrap` fuori dalle prove.

**Non ho trovato criticità gravissime**: niente che corrompa i salvataggi, che faccia cadere il gioco in un percorso normale o che apra una falla verso l’esterno. Ho trovato **5 criticità gravi**, **10 medie** e **15 lievi**, più **10 proposte per l’estetica**. Le gravi sono due difetti che chi gioca incontra (un pulsante di sviluppo dimenticato nella pausa; il suono che muore annullando la mossa dopo un finale) e tre rischi della distribuzione che vanno chiusi prima del primo tag (l’aggiornamento automatico, la chiave di firma, il flusso di rilascio senza prove).

| Gravità | Quante | Le voci |
|---|---|---|
| Gravissime | 0 | (§2) |
| Gravi | 5 | G1 misure tecniche nella pausa · G2 annullare dopo un finale · G3 aggiornamento che non trova il remake · G4 chiave di firma · G5 rilascio senza prove, Linux mai provato |
| Medie | 10 | M1 Python nel thread dell’interfaccia · M2 Opzioni che escono dal riquadro · M3 testi minuscoli a 1280 × 720 · M4 cambio di dispositivo audio · M5 lavoro pesante nel thread audio · M6 progressi persi uscendo · M7 errori senza uscita · M8 eccezione del motore ignorata · M9 salvataggi in Documenti · M10 disegno continuo da misurare |
| Lievi | 15 | §5 |
| Estetica | 10 | §6 |

**Le prime cinque cose da fare**, in ordine: togliere il pulsante delle misure dalla pausa (G1, pochi minuti); far ripartire il mondo sonoro quando si annulla la mossa di un finale (G2); spostare l’indirizzo dell’aggiornamento lontano da «Latest» e mettere al sicuro la chiave (G3, G4); rimettere il «chiudi» delle Opzioni dentro lo schermo (M2); proteggere la frequenza di campionamento del mondo sonoro (M4).

## 1. Come ho lavorato, e la scala

**Che cosa ho fatto.** Ho letto il codice che conta: il processo Tauri (`lib.rs`, `audio.rs`, `salvataggi.rs`), il mixer e la regia del suono (`mondo/mod.rs`, `regia.rs`, `musica.rs`, `musica_file.rs`), il ponte (`ponte.py`, tutto), il caricamento di Pyodide, la regia delle schermate (`Relitto.tsx`), il gioco (`Gioco.tsx`, tutto), i pannelli, la lamina, il ramo, il visore, il dialogo, il menu, l’intro e i loghi nei punti critici, la configurazione, il flusso di rilascio, il README e il CHANGELOG. Ho lanciato tutte le prove. Ho giocato nel browser dello sviluppo a cinque misure di finestra (1920 × 1080, 1440 × 900, 1280 × 720, 1093 × 614) con un controllo automatico di sovrapposizioni, contrasti, corpi minimi e testi tagliati. Ho reso su file, con `rendi_partita`, una traccia costruita apposta per G2 e l’ho misurata. Ho interrogato GitHub (sola lettura) per G3. Ho guardato il sorgente di kira per M4.

**La scala.**

- **Gravissima**: rende il gioco inservibile per molti, corrompe dati, compromette la sicurezza. Blocca un rilascio.
- **Grave**: un difetto che chi gioca incontra in un percorso comune, oppure un rischio che rompe la distribuzione. Va chiuso prima del primo rilascio pubblico.
- **Media**: un difetto in condizioni particolari, un glitch visibile, una fragilità o un rischio di prestazioni.
- **Lieve**: cosmetica, documenti, igiene del codice.

## 2. Gravissime: nessuna

Ho cercato in particolare: perdita o corruzione dei salvataggi (il formato ha versione e migrazione, la scrittura passa da un file provvisorio, il caricamento rifiutato non tocca la partita in corso; `collaudo/salvataggi.py`, rilanciato oggi, prova 463 salvataggi sui 14 percorsi e 11 rifiuti, tutti verdi); cadute del motore audio (nessun `unwrap` o indice non controllato nel codice che gira nel thread audio; l’unica `expect` è sul `livelli.json` incluso a compilazione, che le prove leggono); ingressi dall’esterno (la CSP permette solo `'self'`, nessuna risorsa dalla rete, Pyodide e lark sono nel pacchetto con l’impronta verificata, i posti dei salvataggi sono un elenco chiuso); il gioco non vincibile (i 6 finali si raggiungono dai soli menu). Nessuna di queste strade porta a un problema di questa gravità.

## 3. Gravi

### G1 · «La pagina delle misure tecniche» è nella pausa di chi gioca

**Dove.** `app/src/gioco/pannelli/Pannelli.tsx:170-172` disegna sempre il pulsante; `app/src/gioco/Gioco.tsx:824` lo collega a `location.search = "?prova"`. Non c’è nessun controllo `import.meta.env.DEV` né `__REGIA__`: è in ogni build, anche in quelle da pubblicare. Verificato nel browser: la pausa mostra «la pagina delle misure tecniche» sotto «Ricomincia da capo».

**Che cosa succede.** Chi lo tocca ricarica la pagina: Pyodide riparte da zero, la partita in corso (che vive solo in memoria) sparisce, e si arriva alla pagina di prova della fase 1, con i pulsanti del re, del campione, del segnale e le misure. Per tornare al gioco c’è «Il gioco», che ricarica di nuovo e ripassa dai loghi. Si salva solo ciò che il salvataggio automatico aveva scritto all’ultimo cambio di stanza.

**Correzione.** Mostrare il pulsante solo con `import.meta.env.DEV || __REGIA__` (come la console di regia), oppure toglierlo: la pagina si apre comunque con `?prova` nello sviluppo e con `RELITTO_PROVA` nell’eseguibile.

### G2 · Annullare la mossa di un finale lascia la musica della chiusura e poi il silenzio

**Dove.** La regia azzera lo stato della fine solo quando il turno è un inizio o un caricamento (`app/src-tauri/src/mondo/regia.rs:66`: `let carica = primo || inizio || ha("caricamento")`). Un finale programma la sua musica e il silenzio del mondo (`regia.rs:1289-1319`: a «Due lettere» la ventola si ferma, il fiato dà gli ultimi respiri, `Silenzio` dopo 24 s; agli altri `Silenzio` dopo 4 s, il risveglio sulla plancia con `casa = true` dopo 12 s, la musica dopo 14 s). Il silenzio mette `spento = true` e porta l’ingresso a zero (`mod.rs:737-739`). Il ponte manda il turno di «annulla» come un turno qualunque, e il motore audio non sa che cosa sia un «annulla».

**Che cosa succede.** Alla fine della partita la schermata offre «Annulla l’ultima mossa» (verificato nel browser, finale «La prima nota»). Chi muore asfissiato e annulla, il gesto più naturale in un’avventura testuale, riprende la partita con un mondo sonoro che sta ancora morendo: il fiato ha già dato gli ultimi respiri, la ventola è ferma, **la musica della chiusura suona sopra il gioco per una quarantina di secondi, e poi il mondo tace del tutto**, fino al prossimo caricamento o al ritorno al menu. Negli altri finali il mondo resta quello «di casa» (casco tolto, plancia del risveglio) mentre si è di nuovo nel relitto.

**La misura.** Ho preso la traccia di «Due lettere» (`collaudo/tracce/due-lettere.json`), ho aggiunto dopo il finale un turno identico al penultimo (lo stato a cui «annulla» riporta) e l’ho resa con `rendi_partita`, contro un controllo senza finale. Il finale arriva a 0:26, l’«annulla» a 0:36. Livello efficace in finestre di 5 s (il rendering non carica i file di musica, quindi qui suona il ripiego sintetizzato di «Due lettere»; nel gioco sarebbe `C5`):

| | 0:40–1:15 | 1:20 | 1:25 | 1:30 | 1:40 |
|---|---|---|---|---|---|
| con il finale annullato | da −29 a −32 dB (la musica della chiusura) | −41 | −54 | −67 | **−91 dB (silenzio)** |
| controllo, stesso stato senza finale | da −37 a −43 dB (il vestibolo) | −39 | −38 | −38 | −40 |

**Correzione.** Due pezzi, piccoli. Nel ponte: quando un comando riporta la partita da finita a in corso (o, più in generale, quando `_registro_comandi` si accorcia), aggiungere agli eventi del suono un evento `ripresa` (o lo stesso `caricamento`). Nella regia: trattarlo come un caricamento (`carica = true`), che già svuota le automazioni, rimette `spento`, `casa`, `ventola_spenta`, l’ingresso, e fa tacere la musica. Una prova in Rust con la traccia qui sopra (il livello dopo l’annullamento deve restare quello del controllo).

### G3 · L’aggiornamento automatico oggi non trova niente, e domani potrebbe non trovare il remake

**Dove.** `app/src-tauri/tauri.conf.json:43`: l’indirizzo è `…/releases/latest/download/latest.json`. Su GitHub la release «Latest» del repository è **la v1.5.3 del gioco originale** (verificato con `gh release list`), che non ha un `latest.json`: l’indirizzo risponde 404.

**Che cosa succede.**

1. Oggi, in ogni consegna, il controllo all’avvio fallisce in silenzio e «Cerca aggiornamenti» dal menu dice «Non riesco a controllare: serve la rete», anche con la rete (`Relitto.tsx:212` traduce ogni errore così).
2. Le **pre-release non diventano mai «Latest»**: la prova consigliata nel prompt 23 (`v0.9.0-beta.1`) non verrebbe vista da nessun gioco installato, e la prova direbbe che l’aggiornamento non funziona.
3. Quando l’autore pubblica a mano la bozza della 1.0.0, deve ricordarsi di segnarla «Set as the latest release». Il remake parte da numeri più bassi della v1.5.3: con la regola «legacy» di GitHub (data e numero di versione insieme), una release segnata in modo automatico può restare sotto la v1.5.3. Se resta lì, nessun gioco installato vede mai un aggiornamento, e non lo dice a nessuno.

**Correzione.** Rendere l’indirizzo indipendente da «Latest»: per esempio una release fissa con un tag dedicato (`aggiornamenti`) di cui il flusso di rilascio sostituisce il `latest.json` a ogni versione, oppure un file nel repository (`raw.githubusercontent.com/…/main/aggiornamenti/latest.json`) scritto dal flusso. Così funzionano anche le pre-release, se si vuole un canale di prova. In più, distinguere i messaggi: rete assente, nessun file (404), firma non valida.

### G4 · La chiave di firma degli aggiornamenti è senza password e in una copia sola

**Dove.** `C:\Users\Utente\.tauri\relitto-aggiornamenti.key`, creata senza password nella sessione del 16 ottobre. Non sta nel backup di `F:\Backup` (che copia la cartella del progetto) né nei Secrets di GitHub (prompt 23, punto 5). La chiave pubblica è già dentro le consegne dalla 0.2.2.

**Che cosa succede.** Se il disco si rompe, la chiave è persa: ogni copia installata con quella chiave pubblica non potrà mai più aggiornarsi da sola, e chi gioca dovrà reinstallare a mano. Se il file esce dal computer (un backup in cloud, un malware), chiunque lo abbia può firmare un «aggiornamento» che ogni gioco installato accetta e installa.

**Correzione.** Prima del primo tag: rigenerare la coppia **con una password** (oggi nessuna copia pubblica dipende ancora da questa chiave, quindi costa poco), metterla nei Secrets (`TAURI_SIGNING_PRIVATE_KEY` e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`), conservarne una copia fuori linea (una chiavetta, un gestore di password), aggiornare la chiave pubblica in `tauri.conf.json`.

### G5 · Il rilascio non è protetto: nessuna prova prima di costruire, e Linux esce senza essere mai stato provato

**Dove.** `.github/workflows/rilascio.yml` è l’unico flusso del repository. Controlla che il tag sia la versione, poi costruisce Windows e Linux e prepara la bozza. Non lancia `cargo test`, `npm run prove`, né i collaudi. Il pacchetto Linux (`.deb`, AppImage) non è mai stato avviato su una macchina vera (README, STRUTTURA, prompt 23).

**Che cosa succede.** Un tag spinto su un commit rotto produce installer pubblicabili; un AppImage che magari non suona (ALSA a dispositivo fisso), non disegna (WebKitGTK e WebGL2) o va a scatti finisce nella stessa release del Windows, con lo stesso `latest.json`.

**Correzione.** Un flusso `prove.yml` su ogni push a `main`: le prove Rust e node e i collaudi Python veloci (regressioni, pulsanti, eventi). Nel flusso di rilascio, un job di prove come `needs` della costruzione. Finché Linux non è provato, toglierlo dalla matrice (o pubblicarlo a parte, segnato come sperimentale).

## 4. Medie

### M1 · Il motore Python gira nel thread dell’interfaccia: i loghi si inceppano

**Dove.** `app/src/motore/runtime.ts:91-101`: l’importazione del ponte e la compilazione del gioco sono chiamate sincrone di Pyodide nel thread principale. `app/src/Relitto.tsx:93` le fa partire subito, mentre si disegnano i loghi (che vanno a `requestAnimationFrame`, `loghi/Loghi.tsx:55-72`, con il tempo preso dall’orologio).

**Che cosa succede.** Nel browser dello sviluppo ho misurato due blocchi del thread principale di **724 ms** e **823 ms** durante i loghi (nell’eseguibile la fase 1 misurava 495 ms per la sola compilazione, documento 08 §4.2). Il suono dei loghi, programmato sull’orologio dell’audio, prosegue; l’immagine si ferma e poi salta avanti. È la prima cosa che si vede del gioco. Per i turni il costo è piccolo (7 ms di mediana, 43 al massimo, stessa tabella); il caricamento di una partita lunga arriva a 333 ms nei collaudi, senza un segno che dica che si sta caricando.

**Correzione.** Subito: far partire `avviaMotore()` alla fine dei loghi, durante la dichiarazione (testo fermo, le dissolvenze CSS reggono un blocco). A medio termine: Pyodide in un Web Worker, con il ponte che risponde per messaggi. È il cambio più grande di questa lista, ma toglie ogni scatto (avvio, turni, caricamenti) e lascia le animazioni libere.

### M2 · Le Opzioni escono dal riquadro: il «chiudi» non si vede

**Dove.** `pannelli.css:20-21` limita il pannello a `86cqh` con `overflow-y: auto`; `base.css` nasconde ogni barra di scorrimento (`scrollbar-width: none`).

**Che cosa succede.** Misurato: a 1920 × 1080 il contenuto della scheda «Gioco» è alto 1027 px in un riquadro di 927, quello di «Audio» 1117 px; il «chiudi» sta a 1012–1057 px (fuori dal riquadro) e a 1102–1148 px (fuori dallo schermo). A 1280 × 720 succede lo stesso (811 px in 617). Chi gioca con il mouse, come l’autore, non vede né il pulsante né la barra: deve indovinare che si scorre con la rotella. Esc funziona. Pausa, Tasti, Diario e Salvataggi ci stanno.

**Correzione.** Un piede fisso del pannello con «chiudi» sempre visibile; le righe delle opzioni più compatte (la spiegazione accanto al nome invece che sotto, oppure due colonne a schermi larghi); un segno di scorrimento (una sfumatura in fondo quando c’è altro, come la «continua ↓» della lamina).

### M3 · A 1280 × 720 i testi del ramo scendono sotto la soglia di lettura

**Dove.** I baccelli si rimpiccioliscono con `--scala` (`ramo.css:50`, `:87`, `:89`); i tasti delle uscite stanno a `.68em` (`ramo.css:63`).

**Che cosa succede.** 1280 × 720 non è un caso raro: è uno schermo 1920 × 1080 al 150 %, l’impostazione predefinita di molti portatili da 13–14 pollici. Lì, misurato nel relitto (atto III, 11 stanze viste): i tasti delle uscite a **8,5 px**, gli attrezzi («multiscanner», «matrice») a **10,4 px**, «diario D» e «menu Esc» a 11,5 px, le didascalie del visore a 10,5 px. A 1093 × 614 (un 1366 × 768 al 125 %, a schermo intero) gli attrezzi scendono a 8,9 px, le etichette «attrezzi» e «con te» del filo basso escono di 1–6 px dal fondo dello schermo, e la risposta del turno resta tagliata sotto la lamina.

**Correzione.** Un pavimento di 12 px per ogni testo che si tocca e per i tasti (quando non ci stanno, meglio un «+N» in più che un baccello illeggibile); le etichette del filo basso sopra il filo, come quelle del filo alto, o con un margine minimo dal fondo.

### M4 · Cambiare dispositivo audio a partita in corso stona la musica (e può chiudere il gioco)

**Dove.** Il mondo sonoro prende la frequenza di campionamento una volta, all’avvio (`audio.rs:419`), e la usa per tutto: i filtri, i ritardi, il riverbero, il passo con cui il lettore legge gli MP3 (`musica_file.rs:313`), il `dt` della musica sintetizzata (`musica.rs:259`, `:526`). Su Windows kira segue il dispositivo predefinito: se cambia, riapre il flusso alla nuova frequenza e aggiorna solo il proprio `dt` (sorgente di kira 0.12.5, `backend/cpal/desktop/stream_manager.rs:182-209`).

**Che cosa succede.** Collegare a partita in corso delle cuffie a 44,1 kHz quando si giocava a 48 kHz (succede con molte cuffie USB e Bluetooth): **la musica dai file suona circa l’8 % più lenta e un semitono e mezzo più bassa** per il resto della sessione, la musica sintetizzata si sposta allo stesso modo, i filtri e il riverbero cambiano colore; il re del reattore, che usa il `dt` di kira, resta giusto, e il rapporto fra il re e la musica (la regola del documento 21) si rompe. Inoltre kira, se la riapertura del flusso fallisce (il dispositivo sparisce in quel momento), fa `unwrap()`: con `panic = "abort"` nel profilo di rilascio (`Cargo.toml`) il gioco si chiude di colpo, senza salvare.

**Correzione.** In `SuonoMondo::process`, confrontare `1/dt` con la frequenza del mondo; se cambia, ricostruire il mondo alla frequenza nuova conservando lo stato del gioco (basta rimandargli l’ultimo turno come caricamento, l’ultimo mix e i livelli), oppure dare ai filtri e al lettore la frequenza vera a ogni blocco. Valutare `panic = "unwind"` nel rilascio: trasforma una caduta del thread audio in un gioco muto invece che in un gioco chiuso, ma costa più del previsto (misurato il 19 ottobre: l’eseguibile passa da 5,6 a 9,5 MB, vedi §9).

### M5 · Lavoro pesante dentro il thread audio

**Dove.** Quando un brano parte, il thread audio chiama `is_file()` sul disco (`musica_file.rs:196`) e crea un thread (`musica_file.rs:219`); quando un pezzo esce di memoria, il thread audio libera fino a 30–35 MB di campioni (`retain` e `tieni`). Le lettere del turno arrivano in `Comando::Turno` con le loro stringhe, che si liberano lì.

**Che cosa succede.** Di solito niente; su un disco lento, con un antivirus che controlla ogni accesso, o con poca memoria, un buco nel suono proprio all’ingresso di un brano (la soglia di un atto, l’Anziano).

**Correzione.** Risolvere i percorsi dei 17 file una volta, all’avvio, fuori dal thread audio; un thread decodificatore fisso con un canale di richieste; restituire i pezzi da liberare a quel thread (un canale di ritorno) invece di lasciarli cadere nel thread audio.

### M6 · I progressi dall’ultimo cambio di stanza si perdono uscendo

**Dove.** «Esci» nel menu chiude subito (`Relitto.tsx:244`), anche con una partita in corso, mentre «Nuova partita» e «Carica» chiedono conferma; nessuno ascolta la chiusura della finestra (nessun `onCloseRequested`); `main.tsx:8-10` blocca solo i tasti dello zoom. Il salvataggio automatico scatta solo al cambio di stanza.

**Che cosa succede.** Alt+F4, la X della finestra in modalità finestra o «Esci» perdono tutto ciò che si è fatto nella stanza corrente. Da confermare nell’eseguibile: WebView2 tiene accesi i suoi tasti, quindi F5 nel menu e nell’intro, e Ctrl+R ovunque (anche nel gioco, dove il gestore esce subito se c’è Ctrl), ricaricano la pagina; Ctrl+P apre la stampa, Ctrl+F la ricerca.

**Correzione.** Salvare nel posto automatico alla richiesta di chiusura e prima di «Esci» (il turno corrente, non solo il cambio di stanza); la stessa conferma di «Nuova partita» su «Esci» con una partita non salvata; bloccare F5, Ctrl+R, Ctrl+P, Ctrl+F, Ctrl+G nell’app.

### M7 · Gli errori arrivano a chi gioca come una pila di chiamate, senza via d’uscita

**Dove.** `Gioco.tsx:868` mostra l’errore in un `<pre>` con lo stack; `Relitto.tsx:93` ignora un fallimento di `avviaMotore()`, e il menu resta su «importazione del motore favella…» per sempre; l’intro senza WebGL2 scrive «Questo sistema non ha WebGL2.» e nasconde l’indicazione «Esc · salta» (che compare solo a scena pronta).

**Correzione.** Una schermata d’errore del gioco, nello stile del momento: una frase umana, «Torna al menu», «Riprova», e il dettaglio tecnico ripiegato e copiabile; il menu che dice che il motore non è partito invece di aspettarlo; l’intro che, senza WebGL2, passa da sola al gioco.

### M8 · Un’eccezione del motore durante un comando passa in silenzio

**Dove.** `Gioco.tsx:292`: `gioca` chiama `m.comando(comando)` senza `try`; `runtime.ts` lancia un `Error` quando il ponte risponde `ok: false`. `ponte.py` (`rel_comando`) intercetta l’eccezione ma non riporta la partita allo stato di prima.

**Che cosa succede.** Se un comando fa cadere il motore (non è mai successo nei collaudi, ma il modo scritto accetta qualunque frase), il clic non fa niente, nessun messaggio, e la partita può restare a metà di un turno.

**Correzione.** `try` in `gioca` con un avviso («Il comando non è andato a buon fine») e, nel ponte, una fotografia prima del comando da rimettere se cade (il motore ha già `cattura_stato`, che usa per `prova`).

### M9 · I salvataggi in Documenti

**Dove.** `salvataggi.rs:43` (`document_dir()/Il Relitto Silente/salvataggi`); `scrivi_intero` (`:88`) scrive il provvisorio e lo rinomina senza `sync_all`.

**Che cosa succede.** Su Windows Documenti è spesso dentro OneDrive (la sincronizzazione può tenere aperto il file e far fallire il cambio di nome) e, con l’«Accesso controllato alle cartelle» di Defender acceso, un programma sconosciuto non ci può scrivere: ogni salvataggio, automatico compreso, fallisce con un avviso rosso a ogni cambio di stanza. Senza `sync_all`, uno spegnimento brusco subito dopo un salvataggio può lasciare un file vuoto.

**Correzione.** Valutare la cartella dei dati dell’app (o «Giochi salvati», `FOLDERID_SavedGames`) con un pulsante «Apri la cartella dei salvataggi»; se si resta in Documenti, un ripiego automatico nella cartella dei dati quando la scrittura è rifiutata. `File::sync_all()` sul provvisorio prima del cambio di nome, e una copia `.bak` del posto automatico.

### M10 · Quattro cicli di disegno continui, alla frequenza dello schermo

**Dove.** Le vene (`vene/Vene.tsx:115-126`, una tela grande quanto la finestra per la densità dei pixel, ridisegnata intera nella fuga e nell’ipossia), la lente del visore (`Visore.tsx:155-166`, 2400 punti per fotogramma), la cellula dell’aria (`Visore.tsx:214-224`), l’oscilloscopio del dialogo. Nessuno è limitato a una frequenza (lo sfondo del menu sì, a 20 fotogrammi al secondo); due chiamano `getComputedStyle` a ogni fotogramma.

**Che cosa succede.** Non l’ho potuto misurare (il pannello del browser nascosto ferma `requestAnimationFrame`). Su uno schermo a 144 Hz o in 4K, su una grafica integrata, è il genere di carico che accende le ventole e svuota la batteria per un gioco di testo.

**Correzione.** Prima misurare nell’eseguibile (CPU e GPU nel relitto, nella fuga, nel dialogo con l’Anziano). Poi, se serve: le vene e la lente a 30 fotogrammi al secondo come lo sfondo del menu, i colori letti una volta per cambio di clima invece che a ogni fotogramma.

## 5. Lievi

| | Dove | Che cosa | Correzione |
|---|---|---|---|
| L1 | `Pannelli.tsx:324` | Refuso nella spiegazione dei Comandi: «un’ avventura» con lo spazio dopo l’apostrofo | «un’avventura» |
| L2 | `strumenti/riconoscimenti.py:366` | Nei riconoscimenti, sotto «lark», compare come copyright una riga del testo MIT: «COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM…». Il ramo di lark non applica il filtro `_MODELLO` che vale per gli altri pacchetti | aggiungere `and not _MODELLO.search(r)` e rigenerare `elenco.json` |
| L3 | `README.md` | Dice «la versione attuale è la 0.2.0» (è la 0.2.3) e «niente comandi da scrivere» (c’è la modalità scritta) | aggiornare |
| L4 | `CHANGELOG.md` | La sezione 0.2.2 ha due titoli «Aggiunto»; la 0.2.1 dice insieme che la musica «non è ancora collegata» e che il lettore la suona | unire, togliere la frase superata |
| L5 | `riconoscimenti/Dichiarazione.tsx` | «Favella1», mentre altrove è «FAVELLA 1» (i loghi «FAVELLA1») | è un testo approvato: decide l’autore |
| L6 | `menu/Menu.tsx:63`, riconoscimenti | «dal racconto «Il Relitto», in» è in corsivo e il titolo del libro *Dal registro della Santa Maria* in tondo: l’uso italiano vuole il contrario (titolo del libro in corsivo, il racconto fra caporali, il resto in tondo) | invertire, se l’autore è d’accordo |
| L7 | `lib.rs:93` | L’eseguibile contiene il percorso della cartella di lavoro (`C:\Users\Utente\Documents\SVILUPPO\…\app\src-tauri`, verificato nel `.exe` della 0.2.3) e ci cerca la musica come terzo ripiego | il ripiego solo con `cfg!(debug_assertions)`; `--remap-path-prefix` nel rilascio |
| L8 | `tauri.conf.json:24` | Con l’opzione «no, in una finestra», l’app parte comunque a schermo intero e poi esce: un lampo a ogni avvio | decidere la finestra dal lato Rust leggendo la preferenza, o partire in finestra e andare a schermo intero dalla pagina |
| L9 | `lamina/Lamina.tsx:53-79` | La lamina sceglie dove scorrere solo al turno nuovo: cambiando la misura della finestra la risposta può restare tagliata | ripetere l’ancoraggio in un `ResizeObserver` |
| L10 | `intro/scala.ts:403`, `menu/Sfondo.tsx` | Nessuna gestione della perdita del contesto WebGL (driver aggiornato, ritorno dalla sospensione): lo sfondo del menu resta nero o fermo | ascoltare `webglcontextlost` e ricreare la scena |
| L11 | `lib.rs:152-164` | `scrivi_rapporto` rifiuta `/`, `\` e `..` ma non `:` (su Windows `C:nome` e i flussi alternativi `nome:flusso`) | accettare solo `[A-Za-z0-9._-]` |
| L12 | `lib.rs` | I comandi Tauri sono sincroni: girano nel thread principale (l’apertura del dispositivo audio in `audio_mondo_avvia`, la lettura dei salvataggi) | `#[tauri::command(async)]` per quelli che toccano disco e dispositivi |
| L13 | vari | Codice di prova nel pacchetto (pagina di prova, campionario, `PROVA_SALVATAGGI`), comandi del prototipo ancora nel motore audio (`Ambiente`, `Nave`, `Rampa`, `Cammina`…); `Gioco.tsx` di 872 righe che fa tastiera, salvataggi, sonde e modalità scritta; costanti doppie (`ROMANI` in quattro file, i mesi in due); il ponte che sostituisce `Mondo.registra_riferito` e riconosce il chiamante da `sys._getframe(1).f_code.co_name` (`ponte.py`, `_elabora_analizzando`), che si rompe in silenzio se il motore rinomina la funzione | riordino in rifinitura: un modulo per la tastiera, uno per i salvataggi; una prova del ponte che fallisca se lo spione non vede più niente |
| L14 | `app/package.json`, flussi | Due dipendenze con `^` (`plugin-process`, `plugin-updater`) fra tutte le altre fissate; le azioni di GitHub fissate al numero maggiore e non all’impronta | fissare |
| L15 | `aggiornamenti.ts`, `Relitto.tsx:196-216` | L’aggiornamento non mostra l’avanzamento (un installer di 16 MB su una rete lenta, con un avviso che sparisce dopo 3 secondi) né le note della versione | una barra con `onEvent` di `downloadAndInstall`, le note nella domanda |

## 6. L’estetica: analisi e proposte

### 6.1 Che cosa funziona già

L’identità c’è ed è riconoscibile: le due forme (l’acciaio della Santa Maria, con lo stencil delle targhe, la targa «TSC-1972 · registro di bordo», il bruno e l’ambra; la membrana del relitto, con la lamina dai bordi molli, le vene, l’azzurro e il verde) e le atmosfere che passano dall’una all’altra in un secondo e mezzo. La tavolozza è sobria e coerente (i colori passano tutti da `atmosfere.ts`), i caratteri sono scelti bene e tutti nel pacchetto. Il dialogo con l’Anziano (la figura di punti sopra la piattaforma olografica) è la pagina più bella del gioco; il ritratto di Yusuf con l’onda della voce funziona. La fuga in rosso, il visore con la cellula dell’aria che respira, la costellazione delle stanze viste: tutto ha un’idea dietro. Il controllo automatico non trova sovrapposizioni di pulsanti a nessuna misura, e i contrasti bassi sono solo quelli voluti (i turni passati, spenti).

Le debolezze stanno quasi tutte nei **punti di passaggio** (menu, riconoscimenti, finale) e nelle **parti ancora provvisorie** (le viste delle stanze), non nel cuore del gioco.

### 6.2 Le proposte, in ordine di effetto

**E1 · Il visore ha una vista vera in una stanza su ventitré.** Solo la plancia ha la sua immagine (`Visore.tsx:31`); le altre stanze della Santa Maria mostrano la grana di una telecamera spenta, quelle del relitto la stessa nuvola di punti (cupola e pavimento) con qualche variazione. È lo spazio più grande dello schermo dopo la lamina, e per quasi tutta la partita dice poco. Proposta: dividere il lavoro secondo la regola che il gioco ha già. **La Santa Maria è fotografica e analogica**: cinque stanze (plancia, cuccetta, stiva, sala macchine, scafo) con fotogrammi nello stile della plancia, trattati come una telecamera di bordo (righe, vignetta, il colore dell’ambra), immagini canoniche del sequel dove ci sono. **Il relitto è procedurale**: diciotto «scansioni» del multiscanner, una per stanza, disegnate in codice dai tratti che il testo dà (le tre gole del vestibolo, le alcove dell’alloggio, le teche, la culla, il diagramma di stelle del corridoio), in punti e linee come l’Anziano. Costa meno di diciotto immagini generate, non svela il relitto più di quanto faccia il testo, e resta nello stesso linguaggio della figura più riuscita del gioco.

**E2 · Il finale si legge in una casella che scorre.** Il testo di un finale è il più lungo del gioco (1294 px a 1280 × 720 per «La prima nota») e arriva nella lamina normale, con «continua ↓», mentre sotto il ramo è sostituito da tre pulsanti («Annulla l’ultima mossa», «Ricomincia», «Carica») e la lente mostra la grana scura di una telecamera senza immagine. Proposta: una **schermata del finale**: il visore e il ramo si ritirano, il testo a tutta altezza con la rivelazione lenta, il nome del finale come titolo (i nomi dell’autore), la riga del registro di bordo come un timbro in fondo, la musica della chiusura che già c’è; poi «Registro dei finali» e «Menu principale». La cornice `fine fine-…` in `Lamina.tsx` è già il punto da cui partire.

**E3 · Il menu principale e i riconoscimenti non portano il marchio.** Il logo approvato (il fuso nero con il seme verde, D41) e il titolo composto del poster non compaiono nel gioco: il menu ha «IL RELITTO SILENTE» in Newsreader maiuscolo con un filo verde, e le voci sono testo semplice; i riconoscimenti sembrano una pagina di documentazione. Proposta: il titolo del menu come sul poster (lo stencil, il seme come punto della «i» o accanto al titolo), il seme che pulsa piano sopra il fuso dello sfondo (la scena è già quella), le voci con uno stato di passaggio del mouse nello stile della membrana (un alone, una vena che cresce sotto), «Continua» più in evidenza delle altre. I riconoscimenti come titoli di coda sopra lo stesso sfondo del menu, con il logo in testa.

**E4 · La modalità scritta non usa lo spazio che libera.** Senza il ramo la lamina resta alta 34 unità e la riga di comando sta in fondo: in mezzo più di 200 px vuoti a 1920 × 1080, mentre il testo va già «continua ↓». Proposta: la lamina che scende fino alla riga di comando, e la riga vestita come un terminale (nell’acciaio la targa TSC-1972 e il cursore a blocco; nella membrana una fessura che respira).

**E5 · Il ramo ai margini.** Oltre al pavimento dei 12 px (M3): le etichette dei gruppi («uscite», «qui», «azioni», «attrezzi», «con te») in corsivo tenue a 12 px si leggono appena e cambiano posizione fra filo alto (sopra) e filo basso (sotto). O si scrivono nello stesso maiuscoletto mono del visore, sempre sopra il filo, o si tolgono: la forma dei baccelli (bocche per le uscite, baccelli per le cose, strumenti per gli attrezzi) dice già il gruppo.

**E6 · I pannelli.** Il velo scuro lascia leggibile il gioco dietro (lamina, visore), che compete con il pannello. Proposta: una sfocatura leggera del fondo (`backdrop-filter`), il piede fisso con «chiudi» (M2), e il pannello delle Opzioni in due colonne sopra i 1600 px.

**E7 · Lo schermo 16:10.** Il palco è sempre 16:9 (`gioco.css`, `.palco`): su un 1440 × 900 o un 1920 × 1200 restano due fasce sopra e sotto, con le vene che ci passano e il bordo del vetro del casco che disegna un rettangolo dentro lo schermo. Funziona, ma va deciso: o lo si tiene come cornice voluta (allora il bordo del palco va disegnato come una scelta, per esempio come l’orlo del visore), o si lascia crescere il palco in altezza fino al 16:10, con più spazio per la fascia del fiore, che è la più stretta.

**E8 · Due mondi di immagini, una regola sola.** Oggi convivono immagini fotorealistiche generate (la plancia, Yusuf, le scene dell’intro) e figure procedurali (l’Anziano, la lente del multiscanner, le vene). La divisione ha senso (vedi E1: la Santa Maria è ripresa da telecamere, il relitto è letto da uno strumento) e conviene scriverla come regola nel documento 14, così ogni immagine nuova sa da che parte sta.

**E9 · La prima impressione.** I loghi che saltano (M1) e il lampo dello schermo intero (L8) sono i primi secondi del gioco. Sistemati questi due, l’avvio (nero, loghi, dichiarazione, menu sopra la scena della scala) è già all’altezza.

**E10 · I numeri e le didascalie del visore.** Lo stencil, il mono e il serif convivono bene, ma le didascalie mono del visore («cam 01 · plancia · tsc-1972», «11 stanze viste», «multiscanner · materiale non in archivio») scendono a 10,5–11,5 px a 1280 × 720. Stesso pavimento dei 12 px, e un solo stile per tutte le scritte di servizio (maiuscoletto mono con la spaziatura delle targhe).

## 7. Che cosa ho verificato e che cosa no

**Verificato**: le prove (Rust 65, node 81, collaudi su 14 percorsi: regressioni, pulsanti, menu, eventi, diario, tipografia, modalità scritta, salvataggi; tutte verdi); il gioco nel browser dello sviluppo a cinque misure, con il controllo automatico; G1 nella pausa; G2 con il rendering e la misura; G3 su GitHub; L7 dentro l’eseguibile della 0.2.3; M4 nel sorgente di kira.

**Non verificato**, da fare nell’eseguibile o su un’altra macchina: i tasti di WebView2 (M6); il consumo di CPU e GPU dei cicli di disegno (M10); il comportamento reale al cambio di cuffie (M4, dedotto dal codice); i loghi e l’intro a schermo (nel pannello del browser nascosto `requestAnimationFrame` non gira: li ho letti, non visti); Linux (G5); NVDA nella modalità scritta.

## 8. L’ordine consigliato

1. **Subito, piccoli**: G1, M2, L1, L2, L3, L4. Una consegna.
2. **Il suono**: G2 (ponte e regia, con la prova), M4 (frequenza), M5 (thread audio). Una consegna da ascoltare: cuffie collegate a metà partita, morte e «annulla».
3. **Prima del primo tag**: G3, G4, G5, M6, M7, M8, M9, L7, L8, L15.
4. **Le prestazioni**: M1 (prima il motore dopo i loghi, poi il Worker), M3 con E5 ed E10, la misura di M10.
5. **L’estetica**: E2 (la schermata del finale) ed E3 (menu e riconoscimenti) sono i due interventi con più effetto per meno lavoro; E1 (le viste delle stanze) è il più grande e va pianificato con l’autore (quante immagini, quale strumento, quali scansioni in codice); poi E4, E6, E7.

## 9. Le correzioni fatte

**Lotto 1, 18 ottobre 2026** (scelto dall’autore: «correggi il lotto 1»), una voce per commit, tutte su GitHub:

- **G1** (`9869d4f`): la voce `misure` della pausa è `null` fuori dallo sviluppo; nella build di produzione il codice compilato dice `misure:null`, e il pulsante non compare.
- **M2 e L1** (`8900a99`): nelle Opzioni scorre solo il foglio, le schede e il piede restano fermi; una sfumatura e «continua ↓» quando c’è altro. Misurato: a 1920 × 1080 il «chiudi» sta a 912–957 px in un riquadro che finisce a 1004, a 1280 × 720 a 598–638 in uno che finisce a 670, in tutte e due le schede. Corretto il refuso «un’ avventura» e gli apostrofi dell’opzione Aggiornamenti.
- **L2** (`6715cd5`): il ramo di lark in `strumenti/riconoscimenti.py` usa il filtro degli altri pacchetti; l’elenco rigenerato perde solo la riga della licenza MIT, i nomi non cambiano.
- **L3 e L4**: il README non dice più un numero di versione fisso e nomina la modalità scritta; nel CHANGELOG la 0.2.2 ha una sezione «Aggiunto» sola, la 0.2.1 non si contraddice più, e il «Non rilasciato» elenca queste correzioni.

Prove dopo il lotto: node 81 su 81, tipi puliti, `riconoscimenti.py --verifica` e `versione.mjs verifica` in regola. Nessuna consegna nuova: la PATCH si prepara con la prossima.

**Lotto del suono, 18 ottobre 2026** (scelto dall’autore: G2, poi M4 e M5):

- **G2**: `rel_comando` confronta la lunghezza di `_registro_comandi` prima e dopo il comando; se si è accorciata (un ANNULLA) mette in testa agli eventi del suono `ripresa`. La regia la tratta come `caricamento` (`regia.rs`, `let carica = …`), e il caricamento rimette a posto in più il fiato dopo gli ultimi respiri (`Fiato::riprendi`, che mancava anche per un caricamento dopo la morte), la radio della plancia, i fondi, il re toccato, il fiato in ascolto e il filo. La prova `annullare_un_finale_riporta_il_mondo_di_prima` controlla le due strade: senza «annulla» la chiusura suona e il mondo si spegne (−80 dB); con «annulla» la chiusura tace, il livello resta entro 4 dB di quello di prima e il fiato si sente. Fallisce se si toglie la correzione. In `collaudo/eventi.py` il ramo «annullare un finale». La traccia del §3 rifatta: dopo l’«annulla» il mondo resta fra −38 e −42 dB fino a 1:55, come il controllo.
- **M4**: invece di ricostruire il mondo, `SuonoMondo::process` confronta `1/dt` con la frequenza del mondo e, se il dispositivo è passato a un’altra, lo fa rendere alla sua a pezzi di 64 frame e ricampiona l’uscita (`Ricampionatore`, interpolazione di Hermite a quattro punti, memoria riservata all’inizio). Così restano tutto lo stato, l’intro, la musica in corso. Il mondo nuovo nasce alla frequenza del dispositivo di quel momento, non a quella dell’avvio, e a 48 kHz se non si sa (prima `max(1)`: un mondo a 1 Hz). La prova `al_cambio_di_frequenza_la_musica_resta_intonata`: un mondo a 48 kHz reso per un dispositivo a 44,1 kHz tiene il la a 440 Hz (resi al vecchio modo, 404 Hz) e il livello entro mezzo decibel. **Non fatto**: `panic = "unwind"`. Misurato: l’eseguibile passa da 5 645 824 a 9 503 232 byte (+68 %), non i pochi kilobyte che avevo stimato. Resta `abort`, e la scelta all’autore: un gioco più grosso di 3,9 MB, o la chiusura del gioco nel caso raro in cui kira non riesce a riaprire il flusso.
- **M5**: `Biblioteca::nuova` (chiamata fuori dal thread audio, da `audio_mondo_avvia`) cerca i diciassette file una volta sola e fa partire un thread di lavoro, `relitto-musica`, che vive quanto la biblioteca. Il thread audio gli manda solo messaggi: `Decodifica(pezzo)` e `Butta(pezzo)`; il pezzo decodificato torna già dentro il suo `Arc`. `tieni` e le voci finite del lettore buttano i pezzi invece di liberarli; le caselle e le code del lettore sono riservate all’inizio, così il passo non alloca. Prove: `i_file_si_cercano_una_volta_sola`, `un_file_che_non_si_decodifica_diventa_mancante`, `i_pezzi_lasciati_andare_li_libera_il_thread_di_lavoro`; la prova sui file veri (ignorata di solito) passa.

Prove dopo il lotto del suono: Rust 70 su 70, i file veri, le 14 partite di `prova_partite` (con le tracce rifatte), `collaudo/eventi.py` e `collaudo/diario.py`, node 81 su 81. Non ancora fatto: l’ascolto nell’eseguibile (cuffie collegate a metà partita, la morte e «annulla») e la misura di CPU con `prova_eseguibile.py mondo`; vanno nella prossima consegna.
