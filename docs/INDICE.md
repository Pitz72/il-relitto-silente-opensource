# INDICE DOCUMENTAZIONE — IL RELITTO SILENTE
**Versione:** 1.5.1 · **Data aggiornamento:** 2026-06-01

---

## Struttura

```
docs/
├── INDICE.md                          ← questo file
├── giocatore/                         ← documentazione per l'utente finale (inclusa negli ZIP di release)
│   ├── LEGGIMI.txt                    ← quick start
│   ├── MANUALE.md                     ← manuale operativo completo
│   ├── SOLUZIONE.md                   ← walkthrough e guida al 100%
│   ├── CARATTERISTICHE.txt            ← elenco caratteristiche e meccaniche
│   └── il_relitto_silente_manuale.pdf ← manuale in formato PDF
├── sviluppo/                          ← documentazione tecnica
│   ├── README.md                      ← scheda tecnica e istruzioni di build
│   └── STATO_PROGETTO.md              ← stato corrente del progetto
├── verifica/                          ← referti di verifica del codice corrente
│   └── SIMULAZIONE-INTEGRALE.md       ← simulazione end-to-end del motore (v1.5.1)
├── narrativa/                         ← documentazione del contenuto
│   ├── definizionenarrativa.md        ← roadmap narrativa N1–N11 (storico, v1.1.x)
│   └── articolo.md                    ← diario di sviluppo di Simone Pizzi
├── storico/                           ← documenti di audit e verifica datati [STORICO]
│   ├── analisi2026.md                 ← audit 21 criticità (chiuso a v1.1.0)
│   ├── analisimiglioramento2026.md    ← piano miglioramenti (archiviato a v1.1.23)
│   └── VERIFICA_WALKTHROUGH.md        ← simulazione mentale (snapshot 2026-03-21, v1.1.33)
└── changelog/                         ← un file per ogni versione rilasciata
    ├── 0.0.1.md … 0.4.9.md            ← fase sperimentale (prototipo AI Studio)
    ├── 1.0.0.md … 1.0.19.md           ← fase stabilizzazione e audit
    ├── 1.1.0.md … 1.1.40.md           ← fase funzionalità, narrativa, distribuzione
    ├── 1.2.0.md … 1.2.6.md            ← stabilizzazione comandi, inventario, mappa, HINT
    ├── 1.3.0.md … 1.3.4.md            ← fixing audit 2026-05-31 + revisione prosa
    ├── 1.4.0.md                       ← WS1 verbo TRADUCI · WS5 soluzioni multiple
    ├── 1.5.0.md                       ← WS2 echi profondi · WS3 verbo INCIDI
    └── 1.5.1.md                       ← rifinitura parser + verifica integrale
```

---

## Documenti per il giocatore

| File | Contenuto | Stato |
|---|---|---|
| `giocatore/LEGGIMI.txt` | Quick start: avvio, comandi essenziali, alias, tasti funzione | ✅ v1.5.1 |
| `giocatore/MANUALE.md` | Manuale completo: interfaccia, comandi (incl. TRADUCI/INCIDI), meccaniche, walkthrough sintetico | ✅ v1.5.1 |
| `giocatore/SOLUZIONE.md` | Walkthrough passo per passo + guida al 100% (echi, echi profondi, TRADUCI, INCIDI, statistiche) | ✅ v1.5.1 |
| `giocatore/CARATTERISTICHE.txt` | Elenco caratteristiche e meccaniche del gioco | ✅ v1.5.1 |
| `giocatore/il_relitto_silente_manuale.pdf` | Manuale in formato PDF | ⚠ rigenerare (versione PDF non allineata) |

> **Distribuzione:** l'intera cartella `giocatore/` (LEGGIMI, MANUALE, SOLUZIONE, CARATTERISTICHE, PDF) viene impacchettata negli ZIP di release per Windows/macOS/Linux dal workflow `build-release.yml` (step *Assemble distribution ZIP*). La sorgente di verità è questa cartella: aggiornandola qui, la prossima release ne eredita i contenuti. *(L'`extraFiles` in `package.json` aggiunge il solo `LEGGIMI.txt` accanto all'eseguibile non impacchettato; non è il canale di distribuzione principale.)*

---

## Documenti di sviluppo

| File | Contenuto | Stato |
|---|---|---|
| `sviluppo/README.md` | Stack, caratteristiche, comandi di build, struttura file chiave, tasti funzione | ✅ v1.5.1 |
| `sviluppo/STATO_PROGETTO.md` | Salute tecnica, architettura, copertura comandi, audio, UX, narrativa, distribuzione | ✅ v1.5.1 |

---

## Verifica del codice

| File | Contenuto | Stato |
|---|---|---|
| `verifica/SIMULAZIONE-INTEGRALE.md` | Referto della simulazione end-to-end del motore: 104 passi + 9 micro-test, 15/15 stanze, 11/11 echi, 4/4 echi profondi, traduzione 100%, finale, rating massimo, 0 fallimenti | ✅ v1.5.1 — 2026-06-01 |

---

## Documenti narrativi

| File | Contenuto | Stato |
|---|---|---|
| `narrativa/definizionenarrativa.md` | Roadmap N1–N11: analisi di ogni intervento narrativo, ordine operativo, note | [STORICO] — piano v1.1.x (2026-03-21) |
| `narrativa/articolo.md` | Diario di sviluppo pubblico di Simone Pizzi: origini, architettura, parser, audio, narrativa | Definitivo |

---

## Documenti storici e di audit

| File | Contenuto | Stato |
|---|---|---|
| `storico/analisi2026.md` | Audit completo delle 21 criticità (v1.0.1 Gold Master): gravissime, gravi, medie, leggere | [STORICO] — chiuso a v1.1.0 |
| `storico/analisimiglioramento2026.md` | Piano miglioramenti: parser, funzionalità, narrativa (P1–P10, E1–E5, A1–A8, S1–S10, D1–D7) | [STORICO] — archiviato a v1.1.23 |
| `storico/VERIFICA_WALKTHROUGH.md` | Simulazione mentale del percorso critico, 4 bug trovati e risolti (v1.1.34–v1.1.37) | [STORICO] — 2026-03-21 (v1.1.33). Per il codice attuale vedi `verifica/SIMULAZIONE-INTEGRALE.md` |

---

## Changelog

Ogni versione ha il proprio file in `changelog/X.Y.Z.md`. Il formato è uniforme: problema → soluzione → file modificati → verifica TSC.

### Fasi di sviluppo

| Intervallo | Versioni | Contenuto principale |
|---|---|---|
| Prototipo | v0.0.1–v0.4.9 | Sperimentazione con AI Studio, prime stanze, parser elementare |
| Stabilizzazione | v1.0.0–v1.0.19 | Audit 21 criticità, rifacimento estetico CRT, storage, font locale |
| Funzionalità | v1.1.0–v1.1.6 | Parser Levenshtein, item system, ambience, typewriter, UX |
| Contenuto | v1.1.7–v1.1.23 | Copertura comandi, echi, TOCCA, HINT, mappa, salvataggio, pausa, audio overlay |
| Qualità | v1.1.24–v1.1.25 | Storage filesystem, totalEchoes, Error Boundary |
| Narrativa | v1.1.26–v1.1.33 | N1–N11: monologhi, puzzle finale, Scriptorium, tacche L.V., Anticamera, echi |
| Bugfix finale | v1.1.34–v1.1.37 | 4 bug da simulazione walkthrough (monologo, Disco, Postazione, Cristallo) |
| Stabilizzazione | v1.1.38–v1.2.6 | Rifiniture comandi, inventario, mappa fog-of-war, HINT, sito |
| Fixing audit | v1.3.0–v1.3.4 | Correzione dei 26 bug dell'audit 2026-05-31 + revisione editoriale della prosa |
| Approfondimento gameplay | v1.4.0 | WS1: verbo `TRADUCI` (lettura stratificata) · WS5: soluzioni multiple (Stele) |
| Approfondimento gameplay | v1.5.0 | WS2: 4 echi profondi (Sintonizzatore a strati) · WS3: verbo `INCIDI` (traccia) |
| Rilascio | v1.5.1 | Rifinitura parser + simulazione integrale eseguibile (verifica end-to-end) |

### Ultimo changelog: `changelog/1.5.1.md`

---

*Indice aggiornato il 2026-06-01 · Il Relitto Silente Project · Simone Pizzi*
