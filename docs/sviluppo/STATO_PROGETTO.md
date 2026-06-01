# STATO DEL PROGETTO — IL RELITTO SILENTE
**Data:** 2026-06-01
**Versione corrente:** 1.5.1
**Fase:** Pre-pubblicazione · codice e gameplay congelati e verificati end-to-end · build cross-platform operative (Windows / macOS / Linux)

---

## 1. Salute tecnica

| Metrica | Stato |
|---|---|
| `npx tsc --noEmit` | ✅ Zero errori (v1.1.25) |
| `npm audit` | ✅ Zero vulnerabilità |
| Test regressione (v1.1.23) | ✅ Tutti i percorsi critici verificati |
| Dipendenze obsolete | ✅ Nessuna (stack aggiornato) |

**Stack effettivo:** React 19 · TypeScript 5.9 · Vite 8 · Tailwind CSS 4 · Electron 41 · electron-builder 26 · lodash.clonedeep 4.5

**Storage:** filesystem nativo via IPC Electron (`<userData>/saves/` + `settings.json`) — nessuna dipendenza da localStorage in produzione.

---

## 2. Architettura

Il gioco è costruito su un'architettura modulare a stanze indipendenti. Ogni stanza è un file TypeScript autonomo che esporta un oggetto `Room` con `description`, `items[]` e `commands[]`. Il parser centrale (`gameLogic.ts`) normalizza l'input e smista verso i handler delle stanze.

Il refactoring principale effettuato durante questa fase (v1.1.18) ha estratto i dati degli echi in `echoData.ts` — file condiviso senza dipendenze circolari — eliminando la duplicazione che aveva già causato una desincronizzazione dei testi.

**Salvataggio:** 5 slot manuali + autosave su filesystem nativo via IPC Electron (`<userData>/saves/`). Le impostazioni audio sono persistite separatamente su localStorage (solo preferenze UI, non stato di gioco).

---

## 3. Contenuto e parser

### Copertura comandi per stanza

| Comando | Copertura |
|---|---|
| GUARDA | 15/15 ✅ |
| ESAMINA | 15/15 ✅ |
| ANALIZZA | 12/15 ✅ (3 stanze senza analizzabili significativi: Plancia, Scafo Esterno, Anticamera) |
| TOCCA | 15/15 ✅ |
| PRENDI | dove applicabile ✅ |
| USA / USA X SU Y | dove applicabile ✅ |
| ENTRA | dove applicabile ✅ |
| PARLA | Santuario Centrale ✅ |

### Sintonizzatore (echi temporali)
11 stanze su 15 totali hanno un eco captabile. Le 4 prive di eco sono: Scafo Esterno, Arca della Memoria, Santuario Centrale e Anticamera del Santuario — ciascuna con giustificazione narrativa esplicita nel codice. La **Plancia** *ha* un eco (`echo_plancia`): insieme a Stiva e Camera di Compensazione fa parte delle `SEALED_ECHO_ROOMS`, i cui echi vengono catturati **retroattivamente** alla prima attivazione del Sintonizzatore (BUG B2), poiché quelle stanze si sigillano prima che il dispositivo sia disponibile.

A partire da v1.5.0, 4 stanze offrono anche un **eco profondo** (secondo strato): Laboratori (traduzione ≥75%), Serra (dopo aver liberato il Seme), Alloggi (dopo aver preso il Cilindro), Santuario del Silenzio (traduzione 100%). Tracciati separatamente (`echo_*_deep`), fuori dal conteggio 11/11 e dal punteggio.

### Parser normalizeCommand
Rimuove: accenti · articoli determinativi/indeterminativi · dimostrativi (quel/questo/…) · normalizza preposizioni (con/sopra→su) · rimuove preposizioni articolate dopo entra/vai · alias movimento (n/s/e/o/u/d/giu) · alias azione (x/l/i/inv/leggi→analizza/indossa→usa) · collassa spazi.

---

## 4. Audio

Il sistema audio usa esclusivamente Web Audio API procedurale (nessun file .ogg/.mp3). Sono presenti due subsistemi indipendenti:

**SFX (effetti sonori):**
- Toggle on/off + volume (default 70%) persistenti via IPC filesystem (localStorage come fallback web)
- `playTone` e `playNoise` rispettano il toggle e scalano il gain per il volume
- Suoni: keystroke, submit, item, magic, move, error, terminal beep

**Ambience:**
- Toggle on/off + volume (default 50%) persistenti via IPC filesystem (localStorage come fallback web)
- 5 profili procedurali: `ship` (basso 55/110 Hz + noise) · `alien_quiet` (432 Hz + LFO) · `alien_cold` (28 Hz + noise) · `alien_electric` (60/120 Hz square + noise) · `sacred` (528 Hz + LFO)
- Master GainNode con fade-in 1.5s all'avvio e fade-out 0.7s + timeout 750ms all'arresto — elimina click e artefatti
- Profilo cambia automaticamente ad ogni cambio stanza (mappatura in `App.tsx` → `ROOM_AMBIENCE`)
- Toggle in-game: comando `AUDIO` / `MUSICA` / `SUONO`
- Overlay impostazioni: comando `IMPOSTAZIONI` (slider live, aggiorna GainNode senza riavvio)

**Mappatura profilo → stanza** (`ROOM_AMBIENCE` in `App.tsx`):

| Profilo | Stanze |
|---|---|
| `ship` | Plancia della Santa Maria · Stiva |
| `alien_cold` | Scafo Esterno del Relitto · Camera di Compensazione · Arca Biologica |
| `alien_quiet` | Corridoio Principale · Alloggi dell'Equipaggio · Santuario del Silenzio · Scriptorium · Arca della Memoria |
| `alien_electric` | Serra Morente · Laboratori di Risonanza |
| `sacred` | Ponte di Comando · Santuario Centrale |
| *(silenzio)* | Anticamera Santuario — assenza audio come scelta narrativa deliberata |

---

## 5. UX

**Schermata pausa (F9 / ESC):** overlay con 5 opzioni (Continua / Salva / Carica / Ricomincia / Esci), tasti 1–5 + click, intercetta prima di tutti gli altri handler (`capture: true`, `zIndex: 110`).

**Salvataggio:** 5 slot manuali + autosave (slot 0, aggiornato ad ogni cambio stanza). L'overlay mostra stanza e timestamp per ogni slot.

**Mappa:** ASCII progressiva, rivela le stanze man mano che vengono visitate. Stanza corrente marcata con `[*NOME*]`.

**HINT:** sistema contestuale che analizza posizione, inventario e flag per suggerire il passo successivo. Copre tutti i punti di blocco noti.

**Statistiche fine partita:** barre `█░`, percentuali, rating su 4 livelli basato su scoperte/echi/traduzione.

---

## 6. Narrativa — stato

| Elemento | Stato |
|---|---|
| Arco narrativo principale (3 atti) | ✅ Completo |
| Monologhi interiori protagonista (N1–N3) | ✅ Completo (v1.1.26) |
| Taglio monologo Anziano (N4) | ✅ Completo (v1.1.26) — chirurgico |
| Puzzle finale senza suggerimento letterale (N5) | ✅ Completo (v1.1.27) |
| Scriptorium — fisicità della scrittura (N6) | ✅ Completo (v1.1.28) |
| Secondo punto di contatto L.V. — tacche (N7) | ✅ Completo (v1.1.29) |
| Anticamera del Santuario — nuova stanza (N8) | ✅ Completo (v1.1.30) — totalRooms 15 |
| Voce umana — traccia RF nelle tacche (N9) | ✅ Completo (v1.1.32) |
| Eco corridoio — identità deliberata (N10) | ✅ Completo (v1.1.31) |
| Porta ovest — forme in ANALIZZA non in ESAMINA (N11) | ✅ Completo (v1.1.33) |
| Echi temporali | ✅ 11/15 stanze (4 senza eco: Scafo Esterno, Arca Memoria, Santuario Centrale, Anticamera Santuario; Plancia/Stiva/Camera catturati retroattivamente) |
| Echi profondi (WS2, v1.5.0) | ✅ 4/4 — Laboratori (tp≥75), Serra (Seme), Alloggi (Cilindro), Santuario del Silenzio (tp=100); fuori dal punteggio |
| Traduzione come lente — verbo TRADUCI (WS1, v1.4.0) | ✅ Bassorilievi, proiettori, lastra, mappa; soglie 18/75/100 |
| Traccia del giocatore — verbo INCIDI (WS3, v1.5.0) | ✅ Corridoio, Arca (accanto a L.V.), Santuario del Silenzio; riflesso nell'epilogo |
| Soluzioni multiple Porta a Tre Punte (WS5, v1.4.0) | ✅ Deducibile da mappa stellare o da ANALIZZA STELE; energia comunque obbligatoria (`isHologramActive`) |
| K'tharr individualità (D4) | ✅ echo_lab espanso, Navarca riconoscibile, lista nomi ingegnere |
| Perché questo sistema solare (D5) | ✅ ANALIZZA MAPPA → "classe Giardino" |
| Traduzione 100% (D7) | ✅ Tono scanner + "Non sei più uno scopritore. Sei un testimone." |
| Mistero L.V./AURORA-7 (D3) | ✅ Silenzio deliberato — tre punti di contatto nel gioco |
| TOCCA atmosferico | ✅ 15/15 stanze |
| Sistema HINT | ✅ Copre tutti i punti di blocco noti |

**`definizionenarrativa.md` — CHIUSO AL 100%** (N1–N11 implementati, v1.1.26–v1.1.33)

---

## 7. Simulazione e verifica walkthrough

**Verifica corrente (v1.5.1, 2026-06-01):** simulazione integrale **eseguibile** del motore (`processCommand` è puro) tramite l'harness `sim/playthrough.ts`. Referto completo: `../verifica/SIMULAZIONE-INTEGRALE.md`. Esito: 104 passi + 9 micro-test di branch, 15/15 stanze, 11/11 echi, 4/4 echi profondi, traduzione 100%, 3/3 tracce INCIDI, finale e rating massimo, **0 fallimenti**. Riproducibile come test di non-regressione (`npx tsc -p sim/tsconfig.sim.json` → `node sim/build/sim/playthrough.js`).

**Verifica storica (v1.1.33, 2026-03-21):** simulazione mentale del percorso critico in `../storico/VERIFICA_WALKTHROUGH.md` [STORICO]. Nessun blocco critico; tutti i rami convergono al finale. I 4 bug emersi sono stati corretti in v1.1.34–v1.1.37 (tabella sotto).

**Bug trovati e risolti durante la simulazione:**

| Versione | Bug | Fix |
|---|---|---|
| v1.1.34 | N2 monologo bypassabile via alias corpo (forma/alieno/resti/creatura) | Regex esteso in `arcaBiologica.ts` |
| v1.1.35 | Disco di Pietra — descrizione puntava alla porta ovest invece che all'Altare | Testo corretto in `scriptorium.ts` |
| v1.1.36 | Postazione Comandante — testo prematuro indipendente da `isWestDoorUnlocked` | Testo condizionale in `ponteDiComando.ts` |
| v1.1.37 | Attivazione Cristallo Dati funzionava solo nel Corridoio Principale | Handler promosso a comando globale in `gameLogic.ts` |

---

## 8. Debito tecnico residuo (non critico)

Nessuno di critico. Note minori:

- **ECHO_TEXTS** — unica fonte in `echoData.ts` dopo refactoring v1.1.18. Sistema pulito.
- **Circular import risk** — risolto con `echoData.ts` come file foglia senza dipendenze locali.
- **AudioContext policy** — l'inizializzazione avviene sul primo comando utente (policy browser). Su Electron il comportamento è identico.
- **Slider volume SFX** — non ha un GainNode master come l'ambience. Il volume è applicato al momento della creazione di ogni nodo; i suoni in riproduzione al momento del cambio non vengono retroattivamente modificati (accettabile data la durata brevissima degli SFX). Le preferenze audio sono persistite su `settings.json` (filesystem IPC) in Electron; localStorage è usato solo come fallback nella modalità web dev (`npm run dev` senza Electron).

---

## 9. Distribuzione — piattaforme ufficiali

| Piattaforma | Formato | Stato | Note |
|---|---|---|---|
| 🪟 Windows | `.exe` NSIS | ✅ Ufficiale | Installazione guidata |
| 🐧 Linux | `.AppImage` | ✅ Ufficiale (da v1.2.5) | Portabile, nessuna installazione |
| 🍎 macOS | `.dmg` | ✅ Ufficiale (da v1.2.5) | Non firmato — tasto destro → Apri |

**Pipeline CI/CD:** GitHub Actions (`.github/workflows/build-release.yml`)
- Avvio **esclusivamente manuale** (`workflow_dispatch`) dal pannello GitHub Actions — nessun trigger automatico su push di tag o commit
- Versione letta da `package.json`; con `create_release` attivo crea il tag `vX.Y.Z` sul commit corrente e pubblica la Release
- Artifact: ZIP per piattaforma (`IlRelittoSilente-${version}-${os}.zip`) contenenti eseguibile + documentazione giocatore

**Percorsi salvataggi nativi (cross-platform via `app.getPath('userData')`):**
- Windows: `%APPDATA%\Il Relitto Silente\saves\`
- macOS: `~/Library/Application Support/Il Relitto Silente/saves/`
- Linux: `~/.config/Il Relitto Silente/saves/`

**Documentazione distribuita:** lo step *Assemble distribution ZIP* del workflow copia l'intera cartella `docs/giocatore/` (LEGGIMI.txt, MANUALE.md, SOLUZIONE.md, CARATTERISTICHE.txt, manuale PDF) accanto all'eseguibile in ogni ZIP di release, per tutte e tre le piattaforme. *(In aggiunta, l'`extraFiles` di `package.json` affianca il solo `LEGGIMI.txt` all'eseguibile non impacchettato su win/linux.)*

> ⚠ **Nota:** `il_relitto_silente_manuale.pdf` non è rigenerato automaticamente: la versione PDF resta indietro rispetto al `MANUALE.md` sorgente (non copre TRADUCI / echi profondi / INCIDI). Va rigenerato dal manuale aggiornato prima della pubblicazione, oppure escluso dallo ZIP.

---

## 10. Storico versioni (dalla v1.1.0)

| Versione | Contenuto |
|---|---|
| v1.1.0–v1.1.3 | E1–E5 (blocchi critici), A1–A8 (funzionalità), S1 ambience, S2 typewriter |
| v1.1.4 | S3–S7: inventario, mappa, crediti, easter egg, statistiche |
| v1.1.5 | S9 autosave, S10 intro animata |
| v1.1.6 | Patch: ambience disabilitata temp., F6/F7, perf, IntroScreen |
| v1.1.7 | P10: ASPETTA/Z |
| v1.1.8 | P9: giù→basso |
| v1.1.9 | P6: ENTRA con preposizione |
| v1.1.10 | P8: LEGGI cleanup Scriptorium |
| v1.1.11 | ANALIZZA gap Arca Biologica |
| v1.1.12 | TOCCA 14/14 stanze |
| v1.1.13 | S1: Ambience ripristinata con fade pulito |
| v1.1.14 | D4: K'tharr individualità |
| v1.1.15 | D5: ANALIZZA MAPPA → classe Giardino |
| v1.1.16 | D7: Traduzione 100% momento speciale |
| v1.1.17 | P7: dimostrativi rimossi da normalizeCommand |
| v1.1.18 | Refactoring: echoData.ts unica fonte di verità |
| v1.1.19 | Echi 8→11/14 (Scriptorium, Stiva, Santuario Silenzio) |
| v1.1.20 | D3: mistero L.V. — silenzio deliberato |
| v1.1.21 | Impostazioni audio: overlay con toggle + slider |
| v1.1.22 | Schermata pausa F9/ESC |
| v1.1.23 | Test regressione: tutti i percorsi verificati |
| v1.1.24 | Desktop storage: localStorage → filesystem IPC Electron |
| v1.1.25 | Bug fix: totalEchoes 8→11, allItems lazy cache, Error Boundary |
| v1.1.26 | Narrativa N1–N4: monologo ingresso relitto, monologo corpo umano, primo ingresso Santuario, taglio monologo Anziano |
| v1.1.27 | Narrativa N5: rimosso suggerimento letterale "TOCCA TRE PUNTE" dal puzzle finale |
| v1.1.28 | Narrativa N6: Scriptorium — lastra di lavoro, item fisso, TOCCA ISCRIZIONI |
| v1.1.29 | Narrativa N7: tacche umane nel Corridoio Principale, secondo punto di contatto L.V. |
| v1.1.30 | Narrativa N8: Anticamera Santuario — nuova location, mappa aggiornata, totalRooms 15 |
| v1.1.31 | Narrativa N10: eco corridoio — "VOCE ANONIMA" → "UNA VOCE — senza identificativo di ruolo" |
| v1.1.32 | Narrativa N9: frammento voce umana — traccia RF irrecuperabile in ANALIZZA TACCHE |
| v1.1.33 | Narrativa N11: porta ovest — forme incavi spostate da ESAMINA a ANALIZZA |
| v1.1.34 | Bugfix: N2 monologo bypassabile via alias corpo (forma/alieno/resti/creatura) |
| v1.1.35 | Bugfix: Disco di Pietra — descrizione puntava alla porta ovest invece che all'Altare |
| v1.1.36 | Bugfix: Postazione Comandante — testo condizionale su isWestDoorUnlocked |
| v1.1.37 | Bugfix: attivazione Cristallo Dati promossa a comando globale (funziona in ogni stanza) |
| v1.1.38 | Doc: manuale in-game aggiornato a v1.1.38; rating e metriche statistiche corretti in SOLUZIONE.md (C1, C2, C3) |
| v1.1.39 | Doc+codice: precisazione localStorage/IPC in STATO_PROGETTO; commento WORKAROUND rimosso da santuarioDelSilenzio.ts (M1, M2, M3) |
| v1.1.40 | Doc+codice: easter egg documentato in SOLUZIONE.md; mappatura audio aggiunta in STATO_PROGETTO; commento totalEchoes aggiornato in gameLogic.ts (L1, L2, L3) |
| v1.2.0 | Stabilizzazione sistema comandi: TOCCA Ponte di Comando, ANALIZZA Plancia tematico, fallback TOCCA globale, grammatica verbale, lookup inventario preciso (S1–S5) |
| v1.2.1 | UX: inventario visibile su sfondo scuro, mappa fog-of-war progressivo, HINT Ponte contestuale, HINT Anticamera/Laboratori/Alloggi (U1–U4) |
| v1.2.2 | Fix preposizione: PARTITA SALVATA NELLO SLOT X (App.tsx) |
| v1.2.3 | HINT: copertura in-room per Serra Morente, Santuario del Silenzio, Scriptorium, Arca della Memoria, Laboratori di Risonanza |
| v1.2.4 | Tipografia italiana: trattini em dash, virgolette «» in santuarioDelSilenzio e arcaDellaMemoria, separatori scanner in arcaBiologica |
| v1.2.5 | Revisione testuale: eliminazione cliché LLM (ozono, ronzio ×4, pungente, pesante) in 8 file stanza · **CI/CD: GitHub Actions cross-platform, macOS e Linux versioni ufficiali** |
| v1.2.6 | Allineamento versione mostrata e rifiniture pre-fixing |
| v1.3.0–v1.3.3 | **Fixing audit 2026-05-31**: corretti tutti i 26 bug (7 gravissimi, 9 gravi, 6 medi, 4 lievi); versioni UI lette da `package.json` |
| v1.3.4 | Revisione editoriale della prosa: sistema virgolette a 3 livelli formalizzato, sfoltiti i tic stilistici |
| v1.4.0 | **WS1** — verbo `TRADUCI`/`DECIFRA` (lettura stratificata, soglie 18/75/100) · **WS5** — Stele insegna il sistema trino (secondo percorso per la Porta a Tre Punte), gate energia preservato · alias verbi |
| v1.5.0 | **WS2** — 4 echi profondi (Sintonizzatore a strati, fuori dal punteggio) · **WS3** — verbo `INCIDI`/`SCRIVI`/`MARCA`/`FIRMA` (3 tracce + riflesso nell'epilogo) |
| v1.5.1 | Rifinitura parser (fuzzy, `ESAMINA/GUARDA <stanza>`, epilogo nomina L.V.) + **simulazione integrale eseguibile** (104 passi, 0 fallimenti) |

---

*Documento aggiornato il 2026-06-01.*
