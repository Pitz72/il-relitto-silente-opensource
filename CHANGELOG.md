# Registro delle modifiche

Le modifiche rilevanti al gioco e all’app, versione per versione. Formato
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); numeri di versione
[SemVer 2.0.0](https://semver.org/lang/it/) secondo le regole di
[`sviluppo/VERSIONI.md`](sviluppo/VERSIONI.md). Il *come* e il *perché* di ogni passo stanno nei
documenti di `progettazione/`.

## [Non rilasciato]

### Aggiunto

- **L’animatic dell’intro** (`app/src/intro/`, §10 di `progettazione/09-intro-storyboard.md`): tutte
  le scene sulla scaletta di 2:40,75, calcolata con la regola di lettura e provata contro la tabella
  dello storyboard; il motore della scala in un modulo (la scena E definitiva, e il margine di B); i
  glifi del titolo; il radar, la spia rossa e le stelle che si spengono disegnati dal vivo sui quadri
  della plancia; il salto, il movimento ridotto scena per scena, i sottotitoli dei suoni; una barra di
  revisione (`?intro&revisione`).

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
