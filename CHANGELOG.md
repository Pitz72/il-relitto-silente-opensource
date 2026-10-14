# Registro delle modifiche

Le modifiche rilevanti al gioco e all’app, versione per versione. Formato
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); numeri di versione
[SemVer 2.0.0](https://semver.org/lang/it/) secondo le regole di
[`sviluppo/VERSIONI.md`](sviluppo/VERSIONI.md). Il *come* e il *perché* di ogni passo stanno nei
documenti di `progettazione/`.

## [Non rilasciato]

### Aggiunto

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
- **L’animatic dell’intro** (`app/src/intro/`, §10 di `progettazione/09-intro-storyboard.md`): tutte
  le scene sulla scaletta di 2:40,75, calcolata con la regola di lettura e provata contro la tabella
  dello storyboard; il motore della scala in un modulo (la scena E definitiva, e il margine di B); i
  glifi del titolo; il radar, la spia rossa e le stelle che si spengono disegnati dal vivo sui quadri
  della plancia; il salto, il movimento ridotto scena per scena, i sottotitoli dei suoni; una barra di
  revisione (`?intro&revisione`).

### Cambiato

- I suggerimenti riconoscono anche «se lo ANALIZZI» (il congiuntivo, con il pronome davanti): la
  proiezione del Ponte accende il suo Analizza.
- `collaudo/menu.mjs` prende il ponte in Node da `collaudo/ponte.mjs`, che usa anche il collaudo della
  tipografia.

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
