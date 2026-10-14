# Registro delle modifiche

Le modifiche rilevanti al gioco e all’app, versione per versione. Formato
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); numeri di versione
[SemVer 2.0.0](https://semver.org/lang/it/) secondo le regole di
[`sviluppo/VERSIONI.md`](sviluppo/VERSIONI.md). Il *come* e il *perché* di ogni passo stanno nei
documenti di `progettazione/`.

## [Non rilasciato]

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
