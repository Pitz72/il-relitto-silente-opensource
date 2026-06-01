# Il Relitto Silente

**v1.5.1** — Avventura testuale fantascientifica con parser in italiano

---

Sei il solitario pilota di una nave da carico che intercetta un segnale anomalo: un'antica nave stellare aliena, alla deriva e silenziosa. Bordi il relitto, esplora le sue ali decadenti, raccoglie tre artefatti — la vita, la cultura, la memoria dei costruttori — e svela il legame tra quella civiltà e l'umanità.

Il gioco emula l'estetica di un terminale a fosfori verdi anni '80. Tutto il testo è in italiano. Nessun file audio esterno: i suoni sono generati in tempo reale via Web Audio API.

---

## Download

Gli installer precompilati per ogni piattaforma si trovano nella sezione [Releases](../../releases).

| Piattaforma | Formato | Note |
|---|---|---|
| Windows | `.exe` (NSIS installer) | Installazione guidata |
| Linux | `.AppImage` | Portabile, nessuna installazione |
| macOS | `.dmg` | Trascina in Applicazioni — build non firmata: tasto destro → Apri |

---

## Caratteristiche

- **Parser in linguaggio naturale italiano** — normalizzazione articoli, accenti, abbreviazioni, preposizioni articolate, fuzzy match con distanza di Levenshtein
- **15 stanze** esplorabili, ognuna con descrizioni dinamiche basate sullo stato del giocatore
- **Sistema Echi Temporali** — il Sintonizzatore di Frequenza capta le ultime voci dell'equipaggio in 11 stanze su 15, più 4 *echi profondi* sbloccabili a condizioni correlate (fuori dal punteggio)
- **Traduzione come lente** — il verbo `TRADUCI` rilegge i testi alieni a strati (soglie 18/75/100) man mano che la matrice di traduzione avanza
- **Traccia del giocatore** — il verbo `INCIDI` lascia un tuo segno in tre punti della nave, richiamato nell'epilogo
- **Audio procedurale** — 5 profili ambientali (Web Audio API): nave umana, alieno quieto, alieno freddo, alieno elettrico, sacro
- **Sistema salvataggio** — 5 slot manuali + autosave su filesystem nativo via IPC Electron
- **HINT contestuale** — suggerimenti adattivi allo stato corrente (posizione, inventario, flag)
- **Mappa ASCII progressiva** che si rivela man mano si esplorano le stanze
- **Statistiche fine partita** con rating su 4 livelli (stanze visitate, echi, traduzione, oggetti analizzati)
- **Display virtuale 1920×1080** con scaling adattivo a qualsiasi risoluzione
- **Animazione typewriter** per i momenti narrativi chiave

---

## Comandi di gioco

| Comando | Azione |
|---|---|
| `VAI NORD / SUD / EST / OVEST` | Navigazione (anche `N S E O`) |
| `GUARDA` / `ESAMINA [oggetto]` | Osserva la stanza o un oggetto |
| `ANALIZZA [oggetto]` | Analisi tecnica con lo scanner |
| `TOCCA [oggetto]` | Risposta tattile e atmosferica |
| `TRADUCI [oggetto]` | Legge i testi alieni a strati (alias `DECIFRA`) |
| `INCIDI [bersaglio]` | Lascia un tuo segno in alcuni luoghi (alias `SCRIVI` / `MARCA` / `FIRMA`) |
| `PRENDI [oggetto]` | Aggiunge l'oggetto all'inventario |
| `USA [oggetto] SU [bersaglio]` | Usa o combina oggetti |
| `APRI [oggetto]` | Apre contenitori e accessi |
| `INVENTARIO` / `I` | Lista oggetti in possesso |
| `MAPPA` | Mappa ASCII delle stanze visitate |
| `ECHI` | Riascolta gli echi temporali registrati |
| `NOTA` / `DIARIO` | Log scoperte e barre di progressione |
| `HINT` / `SUGGERIMENTO` | Suggerimento contestuale |
| `SALVA` / `CARICA` | Gestione slot di salvataggio |
| `ASPETTA` / `Z` | Lascia trascorrere il tempo |
| `PULISCI` / `CLEAR` | Pulisce lo schermo |

**Tasti funzione:**

| Tasto | Contesto | Azione |
|---|---|---|
| F1 | Menu | Istruzioni |
| F2 | Menu | Inizia partita |
| F3 | Menu / Gioco | Carica |
| F4 | Gioco | Salva |
| F5 | Sempre | Esci |
| F6 | Gioco | Inventario |
| F7 | Gioco | Mappa |
| F8 | Menu | Crediti |
| F9 / ESC | Gioco | Pausa |

---

## Sviluppo locale

**Prerequisiti:** Node.js 22+, npm

```bash
# Installa le dipendenze
npm install

# Dev server web (localhost:3000)
npm run dev

# Avvia Electron in modalità sviluppo
npm run electron:dev

# Build installer Windows
npm run electron:build
```

---

## Stack tecnologico

| Componente | Versione |
|---|---|
| React | 19.x |
| TypeScript | 5.9.x |
| Vite | 8.x |
| Tailwind CSS | 4.x |
| Electron | 41.x |
| electron-builder | 26.x |

---

## Struttura del progetto

```
App.tsx                   Stato globale, GameState, scaling, overlay
types.ts                  Definizioni TypeScript centrali
game/
  gameLogic.ts            Parser comandi, HINT, statistiche, mappa
  gameData.ts             Registry delle 15 stanze
  echoData.ts             Testi degli echi temporali
  rooms/                  15 file stanza indipendenti
components/               10 componenti React (UI, overlay, schermate)
services/
  audioService.ts         SFX sintetici e ambience loop
  storageService.ts       Salvataggi via IPC Electron
electron/
  main.ts                 Processo principale, IPC handlers
  preload.ts              Context bridge (window.electronAPI)
docs/
  changelog/              Changelog per versione
  sviluppo/               Documentazione tecnica interna
```

---

## Build di release (GitHub Actions)

Il workflow `.github/workflows/build-release.yml` compila per tutte e tre le piattaforme **solo su avvio manuale** — nessun trigger automatico al push di tag o commit:

> GitHub → **Actions** → *Build Cross-Platform Release* → **Run workflow**

La versione viene letta da `package.json`. Se l'input `create_release` è attivo (default), il workflow crea il tag `vX.Y.Z` sul commit corrente e pubblica una GitHub Release. Ogni archivio è uno ZIP che contiene l'eseguibile e la documentazione completa per il giocatore (`LEGGIMI.txt`, `MANUALE.md`, `SOLUZIONE.md`, `CARATTERISTICHE.txt`, manuale PDF).

---

## Percorsi salvataggi

| Piattaforma | Percorso |
|---|---|
| Windows | `%APPDATA%\Il Relitto Silente\saves\` |
| macOS | `~/Library/Application Support/Il Relitto Silente/saves/` |
| Linux | `~/.config/Il Relitto Silente/saves/` |

I save file non sono portabili tra piattaforme diverse.
