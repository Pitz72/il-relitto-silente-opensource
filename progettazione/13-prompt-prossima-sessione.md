# Il prompt della prossima sessione

Da incollare all’inizio della prossima sessione. Sostituisce `11-prompt-prossima-sessione.md`, che era il prompt della terza sessione (la fase 2 e l’animatic).

---

Riprendiamo l’app de «Il Relitto Silente». Carica la memoria del progetto, poi leggi `README.md`, i §4–§6, §14, §17 e §18 di `progettazione/06-app-desktop.md` (lo schermo, le atmosfere, il sistema a pulsanti, lo stato delle fasi, le decisioni), `progettazione/06-proposta-membrana.html` (lo stile), `progettazione/12-fase-2-ponte-e-modello.md` (il ponte e il modello d’azione), il §10 di `progettazione/09-intro-storyboard.md` (l’animatic) e il §2.4 di `progettazione/10-bibbia-sonora.md`.

**Deciso, da non riaprire.**

- Il gioco è finito. Il motore in `motore/` non si tocca, il testo del gioco non si tocca, i `.fav` non si toccano.
- Il collaudo resta verde: `python collaudo/regressioni.py --riprese` e `python collaudo/pulsanti.py` (14 percorsi su 14), `node collaudo/menu.mjs` (i sei finali con i soli menu), `python collaudo/salvataggi.py` (463 salvataggi), `python collaudo/eventi.py` (84 eventi), `npm --prefix app run prove` (24 prove).
- Tauri 2 + React + TypeScript + Vite, con il motore vero in Pyodide. Niente web, niente server, niente rete. Solo pulsanti, nessun parser.
- Lo stile è la C, «Membrana», come in `06-proposta-membrana.html`: acciaio sulla Santa Maria, la membrana che cresce dal primo contatto.
- La fase 2 è chiusa (0.2.0). L’interfaccia prende i menu dal modello d’azione (`app/src/azione/`) e non li ricostruisce: i verbi, le azioni di situazione, i suggerimenti, i tasti. Il ponte (`app/src/motore/ponte.py`) dà il visore (atto, mappa, contatori che compaiono quando servono), gli stati e gli eventi del suono, i salvataggi a riprese.
- Le immagini del sequel solo dopo il controllo di canone (la plancia è `s_01_b`; mai `s_01`, `zoom_s01_teca`, `s_10_b`; `s_03` e `s_04` da rifare).
- L’intro segue lo storyboard 2 approvato; l’animatic è in `app/src/intro/`. La musica (D14) è fatta con i materiali del gioco, generata nel motore audio. Il suono segue la bibbia sonora.
- Le licenze vanno in una schermata «Riconoscimenti e licenze» prima del gioco, generata da `audio/LICENZE.md` e dagli elenchi delle dipendenze.
- L’autore ha delegato le decisioni tecniche, pratiche e stilistiche: si prendono, si scrivono nei documenti, si correggono dopo.
- Prima di scaricare qualunque file (anche i caratteri e i pacchetti npm), si dice nome, fonte e dimensione. Per Freesound l’autore entra da sé nel pannello del browser; le sue credenziali non si scrivono mai.
- Le versioni seguono le fasi (`sviluppo/VERSIONI.md`): la fase 3 chiusa sarà la 0.3.0.

**Il lavoro: la fase 3, il sistema visivo** (§14 del 06; si chiude quando il gioco si gioca dall’inizio alla fine nell’app, con lo stile definitivo, senza suoni né cinematiche). È la fase più lunga del piano (quattro sessioni): questa ne fa la prima metà, in quest’ordine.

1. **Le fondamenta.** I caratteri dentro l’app (Newsreader, IBM Plex Mono, Big Shoulders Stencil, Atkinson Hyperlegible: SIL OFL, da scaricare dopo averne detto nome, fonte e dimensione); le variabili CSS delle atmosfere del §5 del 06 (Santa Maria, visore, relitto, protezione vitale, fuga, ipossia), con i contrasti misurati; il movimento ridotto fin dall’inizio.
2. **La lamina del testo con la grammatica tipografica** (§4.1, §4.2): ogni tipo di testo del gioco (stanza, risposta, voci del relitto, la voce di L.V., le letture dello scanner, la protezione vitale, i suggerimenti) riconosciuto in TypeScript e provato su tutte le trascrizioni dei percorsi (§15 del 06: «Grammatica tipografica»); gli apostrofi tipografici solo a schermo; il comando sopra la risposta; la rivelazione a righe.
3. **Il ramo delle azioni e il fiore**, dai menu del modello d’azione: le cose come baccelli, le uscite come bocche, i verbi in due anelli (base vicino, attrezzi fuori), Usa con… in due tocchi con tutte le cose possibili accese, gli attrezzi in mano, le azioni di situazione, i suggerimenti accesi per qualche secondo, la tastiera del §6.2.
4. **Il visore** nell’acciaio (l’anello dell’aria, la matrice, le voci, le chiavi, l’atto), con i contatori che compaiono quando il ponte dice `mostra`.
5. **Il dialogo e la conferma** (§4.5), **i salvataggi su disco** (sei posti e uno automatico a ogni cambio di stanza, F5 e F9, scritti dal processo Tauri; il `riassunto` del salvataggio per i posti) e la nuova pagina del gioco al posto della pagina di prova (che resta raggiungibile per le misure).
6. **Se resta tempo**: la crescita della membrana al primo contatto con il generatore delle venature (`app/src/prova/venature.ts`).

Chiudere ogni passo con una prova nell’app (pannello del browser o Tauri), uno sguardo agli screenshot e un commit.

**Le regole di lavoro.**

- I testi italiani seguono la skill prosa-italiana e il suo contratto tipografico (caporali, apostrofi tipografici, «…»); `python strumenti/verifica_tipografia.py <file>` sui documenti nuovi.
- Prima di progettare interfacce, carica ui-ux-pro-max. Contrasto del testo almeno 4,5:1; movimento ridotto fin dall’inizio; il fuoco sempre visibile.
- Se il pannello del browser è nascosto, `requestAnimationFrame` non gira: le animazioni si controllano fotogramma per fotogramma, o si chiede all’autore di guardarle.
- Commit locali frequenti, con l’attribuzione. Niente push e niente GitHub senza il permesso dell’autore.
- A fine sessione: lo stato nel §14 del 06, la memoria del progetto, il README, il CHANGELOG (e la versione, se una fase si chiude), il prompt della sessione dopo, un commit.
