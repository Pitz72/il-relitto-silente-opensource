# Il prompt della prossima sessione

Da incollare all’inizio della prossima sessione. Sostituisce `07-prompt-prossima-sessione.md`, che era il prompt della sessione del 14 ottobre.

---

Riprendiamo l’app de «Il Relitto Silente». Carica la memoria del progetto, poi leggi `README.md`, il §17 e il §14 di `progettazione/06-app-desktop.md` (lo stato delle fasi), `progettazione/08-fase-1-prova-tecnica.md`, `progettazione/09-intro-storyboard.md` e `progettazione/10-bibbia-sonora.md`.

**Deciso, da non riaprire.**

- Il gioco è finito. Il motore in `motore/` non si tocca, il testo del gioco non si tocca, i `.fav` non si toccano. Il collaudo resta verde: `python collaudo/regressioni.py --riprese` (14 percorsi su 14) e `python collaudo/pulsanti.py` (14 su 14 a soli pulsanti).
- Tauri 2 + React + TypeScript + Vite, con il motore vero in Pyodide. Niente web, niente server, niente rete. Solo pulsanti, nessun parser.
- Lo stile è la C, «Membrana», come in `06-proposta-membrana.html`.
- Le immagini del sequel solo dopo il controllo di canone (la plancia è `s_01_b`; mai `s_01`, `zoom_s01_teca`, `s_10_b`; `s_03` e `s_04` da rifare).
- Il suono segue la bibbia sonora: registrazioni vere, la fisica del vuoto, il re come unica nota di casa.
- Prima di scaricare qualunque file, chiedimi il permesso con nome, fonte e dimensione.
- La musica (D14) non è decisa: chiedimela quando serve.
- Le versioni seguono le fasi (`sviluppo/VERSIONI.md`): la 0.1.0 è chiusa; la fase 2 chiusa sarà la 0.2.0.

**Il lavoro.**

1. **La fase 2, ponte e modello d’azione** (§14 del 06). `ponte.py` completo per la 1.4: eventi, pulsanti, stato del visore e salvataggi (a riprese, con l’impronta SHA-256 della storia e il formato dei salvataggi di `versione.json`). Il modello dei menu del §6 del 06 in TypeScript, puro e provabile; la tabella delle azioni di situazione; i suggerimenti in maiuscolo. Il collaudo dei sei finali con i soli menu. Il ponte espone anche gli stati che servono al suono (§2.4 della bibbia sonora). Si chiude quando i sei finali si giocano in CPython con il solo modello d’azione e salvare e caricare tornano allo stesso stato.
2. **Se ho dato il permesso per i file del §8.2 della bibbia sonora:** il prototipo dei tre ambienti (la plancia con il reattore, il casco sullo scafo, il vestibolo con il brusio). Ogni file va in `audio/sorgenti/` e ha la sua riga in `audio/LICENZE.md` con l’impronta SHA-256 prima di essere usato. Gli script di lavorazione vanno in `strumenti/audio/`.
3. **Se ho approvato lo storyboard dell’intro** (e le cinque scelte del suo §8): l’animatic, solo dopo la fase 2. Altrimenti si corregge lo storyboard secondo le mie note, e non si anima niente.

**Le regole di lavoro.**

- I testi italiani seguono la skill prosa-italiana e il suo contratto tipografico (caporali, apostrofi tipografici, «…»). I documenti vecchi hanno apostrofi dritti: non si convertono senza il mio permesso.
- Prima di progettare interfacce, carica ui-ux-pro-max. Contrasto del testo almeno 4,5:1; movimento ridotto fin dall’inizio.
- Commit locali frequenti, con l’attribuzione. Niente push e niente GitHub senza il mio permesso.
- A fine sessione: lo stato nel §14 del 06, la memoria del progetto, il README, il CHANGELOG (e la versione, se una fase si chiude), il prompt della sessione dopo, un commit.
