# Registro delle modifiche

Le modifiche rilevanti al gioco e all’app, versione per versione. Formato
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); numeri di versione
[SemVer 2.0.0](https://semver.org/lang/it/) secondo le regole di
[`sviluppo/VERSIONI.md`](sviluppo/VERSIONI.md). Il *come* e il *perché* di ogni passo stanno nei
documenti di `progettazione/`.

## [Non rilasciato]

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
