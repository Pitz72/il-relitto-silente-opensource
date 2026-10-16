# Il prompt della prossima sessione

> **Superato** (16 ottobre 2026, sera): il prompt in vigore è il `23-prompt-prossima-sessione.md`. Questo resta come storia.

Da incollare all’inizio della prossima sessione. Sostituisce `13-prompt-prossima-sessione.md`, che era il prompt della quarta sessione (la prima metà della fase 3).

---

Riprendiamo l’app de «Il Relitto Silente». Carica la memoria del progetto, poi leggi `README.md`, i §4–§6, §14, §17 e §18 di `progettazione/06-app-desktop.md` (lo schermo, le atmosfere, il sistema a pulsanti, lo stato delle fasi, le decisioni), `progettazione/06-proposta-membrana.html` (lo stile), `progettazione/14-fase-3-sistema-visivo.md` (la prima metà della fase 3: che cosa c’è, le decisioni prese, che cosa resta), `progettazione/12-fase-2-ponte-e-modello.md` (il ponte e il modello d’azione) e il §2.4 di `progettazione/10-bibbia-sonora.md`.

**Deciso, da non riaprire.**

- Il gioco è finito. Il motore in `motore/` non si tocca, il testo del gioco non si tocca, i `.fav` non si toccano.
- Il collaudo resta verde: `python collaudo/regressioni.py --riprese` e `python collaudo/pulsanti.py` (14 percorsi su 14), `node collaudo/menu.mjs` (i sei finali con i soli menu), `python collaudo/salvataggi.py` (463 salvataggi), `python collaudo/eventi.py` (84 eventi), `node collaudo/tipografia.mjs` (la grammatica su tutti i percorsi e su tutto il testo dei `.fav`), `npm --prefix app run prove` (56 prove), `cargo test --lib` in `app/src-tauri`.
- Tauri 2 + React + TypeScript + Vite, con il motore vero in Pyodide. Niente web, niente server, niente rete. Solo pulsanti, nessun parser.
- Lo stile è la C, «Membrana», come in `06-proposta-membrana.html`; quello che è già costruito è nel documento 14. Le sue decisioni valgono, e si correggono se l’autore, guardandole, lo chiede: fra le altre il ramo a due fili, il fiore su due anelli, la mappa orientata come la bussola, Tab al fuoco e il diario su D, F5 e F9 che aprono i pannelli.
- L’interfaccia prende i menu dal modello d’azione (`app/src/azione/`) e il testo dalla grammatica tipografica (`app/src/gioco/lamina/grammatica.ts`), e non li ricostruisce. I colori vengono solo da `app/src/stile/atmosfere.ts`, provati sopra 4,5:1.
- Le immagini del sequel solo dopo il controllo di canone (la plancia è `s_01_b`; mai `s_01`, `zoom_s01_teca`, `s_10_b`; `s_03` e `s_04` da rifare).
- L’intro segue lo storyboard 2 approvato; l’animatic è in `app/src/intro/`. La musica (D14) è fatta con i materiali del gioco, generata nel motore audio. Il suono segue la bibbia sonora.
- Le licenze vanno in una schermata «Riconoscimenti e licenze» prima del gioco, generata da `audio/LICENZE.md` e dagli elenchi delle dipendenze, con il testo della SIL OFL dei caratteri.
- L’autore ha delegato le decisioni tecniche, pratiche e stilistiche: si prendono, si scrivono nei documenti, si correggono dopo.
- Prima di scaricare qualunque file (anche i pacchetti npm e i crate), si dice nome, fonte e dimensione. Per Freesound l’autore entra da sé nel pannello del browser; le sue credenziali non si scrivono mai.
- Le versioni seguono le fasi (`sviluppo/VERSIONI.md`): la fase 3 chiusa sarà la 0.3.0.

**Il lavoro: la seconda metà della fase 3** (§14 del 06; si chiude quando il gioco si gioca dall’inizio alla fine nell’app, con lo stile definitivo, senza suoni né cinematiche). In quest’ordine.

1. **Lo sguardo dell’autore.** Con il pannello del browser in vista (o l’app aperta), guardare insieme ciò che nella quarta sessione si è controllato solo fotogramma per fotogramma: la rivelazione a righe, la crescita della membrana al primo contatto, il fiore che si apre, il cartello d’atto, il dialogo con l’Anziano. Correggere quello che non convince, e scriverlo nel documento 14.
2. **Il diario** (D): la trascrizione della partita, il fascicolo L.V. che si compone da sé, le voci ascoltate (rileggibili), le traduzioni lette alla soglia più alta raggiunta (06, §4.1 e §4.6).
3. **Il menu principale e i riconoscimenti** (06, §4.6 e §18.3): Continua, Nuova partita, Carica, Opzioni, Registro dei finali (le sei righe del registro di bordo, che si sbloccano), Riconoscimenti; la schermata «Riconoscimenti e licenze» prima del gioco al primo avvio, generata dagli elenchi.
4. **La partita intera nell’app.** Un collaudo che gioca i sei finali attraverso l’interfaccia nell’eseguibile vero (come `RELITTO_PROVA=salvataggi`), e una partita giocata a mano dall’autore, con il mouse e con la sola tastiera.
5. **La rifinitura e le prestazioni**: i nomi toccabili (oggi segnano anche parole generiche come «nave»), il testo grande a 1280 × 720, i testi lunghi nel dialogo, i livelli di qualità delle venature; la prova su Linux (WSL per costruire).
6. **La chiusura della fase**: la 0.3.0 (`node strumenti/versione.mjs`), il registro delle modifiche, il documento 14 completato.

Chiudere ogni passo con una prova nell’app (pannello del browser o Tauri), uno sguardo agli screenshot e un commit.

**Le regole di lavoro.**

- I testi italiani seguono la skill prosa-italiana e il suo contratto tipografico (caporali, apostrofi tipografici, «…»); `python strumenti/verifica_tipografia.py <file>` sui documenti nuovi.
- Prima di progettare interfacce, carica ui-ux-pro-max. Contrasto del testo almeno 4,5:1; movimento ridotto fin dall’inizio; il fuoco sempre visibile.
- Se il pannello del browser è nascosto, `requestAnimationFrame` non gira e le transizioni restano a metà: le animazioni si controllano fotogramma per fotogramma (`window.__vene(k)`, `window.__gioco.percorso(nome, passi)` nel server di sviluppo), o si chiede all’autore di guardarle.
- Il server di sviluppo di un’altra sessione può occupare la porta 5274: c’è la configurazione `app-vite-5275` in `.claude/launch.json`.
- Commit locali frequenti, con l’attribuzione. Niente push e niente GitHub senza il permesso dell’autore.
- A fine sessione: lo stato nel §14 del 06, la memoria del progetto, il README, il CHANGELOG (e la versione, se una fase si chiude), il prompt della sessione dopo, un commit.
