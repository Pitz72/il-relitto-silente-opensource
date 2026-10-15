# Il prompt della prossima sessione

Da incollare all’inizio della prossima sessione. Sostituisce `15-prompt-prossima-sessione.md`, che era il prompt della quinta sessione (la seconda metà della fase 3, cominciata: il motore 1.5.0 e il diario).

---

Riprendiamo l’app de «Il Relitto Silente». Carica la memoria del progetto, poi leggi `README.md`, i §4–§6, §14, §17 e §18 di `progettazione/06-app-desktop.md` (lo schermo, le atmosfere, il sistema a pulsanti, lo stato delle fasi, le decisioni), `progettazione/06-proposta-membrana.html` (lo stile), `progettazione/14-fase-3-sistema-visivo.md` (la fase 3: che cosa c’è, le decisioni prese, il diario nel §12), `progettazione/12-fase-2-ponte-e-modello.md` (il ponte e il modello d’azione), `progettazione/16-favella-1-5-0.md` (il motore 1.5.0 e le decisioni che restano all’autore) e il §2.4 di `progettazione/10-bibbia-sonora.md`.

**Deciso, da non riaprire.**

- Il gioco è finito. Il testo del gioco e i `.fav` non si toccano senza una decisione dell’autore. Il motore in `motore/` è FAVELLA 1.5.0, copiato dal tag: non si cambia mai a mano. Usare nei `.fav` le frasi nuove della 1.5.0 (il §7 e il §8 del documento 16) resta una decisione dell’autore.
- Il collaudo resta verde: `python collaudo/regressioni.py --riprese` e `python collaudo/pulsanti.py` (14 percorsi su 14), `node collaudo/menu.mjs` (i sei finali con i soli menu), `python collaudo/salvataggi.py` (463 salvataggi, 11 casi di rifiuto), `python collaudo/eventi.py` (84 eventi), `python collaudo/diario.py` (la cronaca del diario, ricostruita identica), `node collaudo/tipografia.mjs` (la grammatica su tutti i percorsi e su tutto il testo dei `.fav`), `npm --prefix app run prove` (70 prove), `cargo test --lib` in `app/src-tauri` (4), `python strumenti/riconoscimenti.py --verifica`.
- Tauri 2 + React + TypeScript + Vite, con il motore vero in Pyodide. Niente web, niente server, niente rete. Solo pulsanti, nessun parser.
- Lo stile è la C, «Membrana», come in `06-proposta-membrana.html`; quello che è già costruito è nel documento 14. Le sue decisioni valgono, e si correggono se l’autore, guardandole, lo chiede.
- L’interfaccia prende i menu dal modello d’azione (`app/src/azione/`), il testo dalla grammatica tipografica (`app/src/gioco/lamina/grammatica.ts`) e il diario dalla cronaca del ponte, e non li ricostruisce. I colori vengono solo da `app/src/stile/atmosfere.ts`, provati sopra 4,5:1.
- Le immagini del sequel solo dopo il controllo di canone (la plancia è `s_01_b`; mai `s_01`, `zoom_s01_teca`, `s_10_b`; `s_03` e `s_04` da rifare).
- L’intro segue lo storyboard 2 approvato; l’animatic è in `app/src/intro/`. La musica (D14) è fatta con i materiali del gioco, generata nel motore audio. Il suono segue la bibbia sonora.
- Le licenze vanno in una schermata «Riconoscimenti e licenze» prima del gioco, generata da `audio/LICENZE.md` e dagli elenchi delle dipendenze, con il testo della SIL OFL dei caratteri.
- L’autore ha delegato le decisioni tecniche, pratiche e stilistiche: si prendono, si scrivono nei documenti, si correggono dopo.
- Prima di scaricare qualunque file (anche i pacchetti npm e i crate), si dice nome, fonte e dimensione. Per Freesound l’autore entra da sé nel pannello del browser; le sue credenziali non si scrivono mai.
- Le versioni seguono le fasi (`sviluppo/VERSIONI.md`): la fase 3 chiusa sarà la 0.3.0, e porterà anche il motore 1.5.0.

**Il lavoro: il resto della seconda metà della fase 3** (§14 del 06; si chiude quando il gioco si gioca dall’inizio alla fine nell’app, con lo stile definitivo, senza suoni né cinematiche). In quest’ordine.

1. **Lo sguardo dell’autore**, se non è già stato dato: con l’eseguibile (`app/src-tauri/target/release/il-relitto-silente.exe`) o il pannello del browser in vista, la rivelazione a righe, la crescita della membrana al primo contatto, il fiore che si apre, il cartello d’atto, il dialogo con l’Anziano, il diario, e adesso il menu principale (lo sfondo che respira), il registro dei finali e i riconoscimenti (14, §12 e §13). Correggere quello che non convince, e scriverlo nel documento 14.
2. **La copertina e il logo dell’eseguibile**, chiesti dall’autore: la direzione la dà lui; il logo diventa l’icona (fase 9) e la copertina va nel registro delle immagini e nei riconoscimenti.
3. **La partita intera nell’app.** Un collaudo che gioca i sei finali attraverso l’interfaccia nell’eseguibile vero (come `RELITTO_PROVA=salvataggi`), e una partita giocata a mano dall’autore, con il mouse e con la sola tastiera.
4. **La rifinitura e le prestazioni**: i nomi toccabili (oggi segnano anche parole generiche come «nave»), il testo grande a 1280 × 720, i testi lunghi nel dialogo, i livelli di qualità delle venature; la prova su Linux (WSL per costruire), dove si lancia anche `python strumenti/riconoscimenti.py` per aggiungere i crate di Linux all’elenco.
5. **La chiusura della fase**: la 0.3.0 (`node strumenti/versione.mjs`), il registro delle modifiche, il documento 14 completato.

Chiudere ogni passo con una prova nell’app (pannello del browser o Tauri), uno sguardo agli screenshot e un commit.

**Le regole di lavoro.**

- I testi italiani seguono la skill prosa-italiana e il suo contratto tipografico (caporali, apostrofi tipografici, «…»); `python strumenti/verifica_tipografia.py <file>` sui documenti nuovi.
- Prima di progettare interfacce, carica ui-ux-pro-max. Contrasto del testo almeno 4,5:1; movimento ridotto fin dall’inizio; il fuoco sempre visibile; tutto si fa anche con il solo mouse e con la sola tastiera.
- Se il pannello del browser è nascosto, `requestAnimationFrame` non gira e le transizioni restano a metà: le animazioni si controllano fotogramma per fotogramma (`window.__vene(k)`, `window.__gioco.percorso(nome, passi)` nel server di sviluppo), o si chiede all’autore di guardarle.
- Il server di sviluppo di un’altra sessione può occupare la porta 5274: c’è la configurazione `app-vite-5275` in `.claude/launch.json`.
- Commit locali frequenti, con l’attribuzione. Niente push e niente GitHub senza il permesso dell’autore.
- A fine sessione: lo stato nel §14 del 06, la memoria del progetto, il README, il CHANGELOG (e la versione, se una fase si chiude), il prompt della sessione dopo, un commit.
