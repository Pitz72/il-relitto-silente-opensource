# Versioni del Relitto Silente

Le regole con cui il gioco cambia numero. Riprendono quelle del Viaggiatore, adattate a Tauri e al
fatto che qui l’app è ancora in costruzione. Lo strumento che le applica è `strumenti/versione.mjs`.

## 1. Tre numeri, tre cose diverse

| Che cosa | Dove | Forma | Chi la decide |
|---|---|---|---|
| **Il gioco** | `versione.json` → `gioco` | SemVer 2.0.0: `MAJOR.MINOR.PATCH[-pre]` | questo documento |
| **Il motore FAVELLA** | `motore/strutture.py` → `VERSIONE_MOTORE` | SemVer del motore: 1.4.4, congelato | il repository del motore |
| **Il formato dei salvataggi** | `versione.json` → `formatoSalvataggi` | intero: 1, 2, 3… | cresce solo se i file cambiano in modo incompatibile |

`versione.json` è l’**unica fonte di verità**. Devono dire la stessa versione:

- `app/package.json` e il suo `package-lock.json`;
- `app/src-tauri/Cargo.toml` e la riga del pacchetto `il-relitto-silente` in `Cargo.lock`.

`app/src-tauri/tauri.conf.json` non porta un numero suo: il campo `version` vale
`"../package.json"`, e Tauri lo legge da lì. L’installer, l’eseguibile e i metadati del `.deb`
prendono quindi la versione di `package.json`.

La build aggiunge l’**identità**: commit e data (`app/vite.config.ts` → costante `__VERSIONE__`).
L’app la mostra e la scriverà in ogni salvataggio (`0.1.0 · 81e6a6d`).

Il gioco porta anche una **impronta della storia**: SHA-256 dei quattordici `.fav` e della versione
del motore (`impronta_storia()` nel ponte). Non sostituisce il numero: dice se un salvataggio è stato
fatto esattamente su questi sorgenti.

## 2. Prima della 1.0: un numero per fase

Finché l’app è in costruzione la versione è `0.MINOR.PATCH` (SemVer §4: lo sviluppo iniziale, dove
tutto può cambiare). Il MINOR segue le fasi del piano (`progettazione/06-app-desktop.md`, §14):

| Versione | Si chiude con |
|---|---|
| 0.1.0 | fase 1, la prova tecnica |
| 0.2.0 | fase 2, il ponte e il modello d’azione |
| 0.3.0 | fase 3, il sistema visivo: il gioco si gioca tutto nell’app |
| 0.4.0 … 0.8.0 | suono, riferimenti visivi, intro, outro, rifinitura |
| 0.9.0 | fase 9, i pacchetti e la CI |
| 1.0.0-beta.N, 1.0.0-rc.N | fase 10, la prova finale su hardware vero |
| **1.0.0** | il primo rilascio pubblico |

Le correzioni dentro una fase sono PATCH (0.3.1, 0.3.2). Una fase che si chiude in più passi può
usare le pre-release (0.3.0-alpha.1). Il numero non promette niente a nessuno finché non esce la 1.0.

## 3. Dalla 1.0: che cosa è «incompatibile» per un gioco

SemVer parla di API pubblica. Per il Relitto l’API pubblica è ciò su cui chi gioca fa affidamento fra
una versione e l’altra: **i suoi salvataggi** e **la storia che ha cominciato**.

### MAJOR (2.0.0): si rompe un patto con chi gioca

- un salvataggio di prima **non si carica più** (nuovo `formatoSalvataggi` senza migrazione);
- la storia viene **ristrutturata**: stanze tolte o riordinate, finali riscritti nel senso, meccaniche
  centrali cambiate (per esempio l’aria);
- la versione minima del sistema operativo o il modo di installare cambiano.

### MINOR (1.1.0): si aggiunge, senza rompere

- contenuti nuovi: una stanza, una voce, un finale in più; la scatola nera di L.V. recitata (D18);
- funzioni nuove dell’app: un’opzione, una lingua, un livello di qualità;
- un nuovo motore FAVELLA *minor* (che oggi non è previsto: il motore è congelato);
- ribilanciamenti che cambiano **l’esito** di sequenze già giocate: i salvataggi si rigiocano (§4),
  quindi un salvataggio vecchio si carica ma può arrivare in uno stato diverso. Il gioco lo dice.

### PATCH (1.0.1): si corregge

- errori di gioco, di testo, di impaginazione, refusi;
- correzioni che non cambiano l’esito di nessuna sequenza di comandi sensata;
- sicurezza, prestazioni, pacchetti.

In dubbio fra due livelli, si sceglie il più alto.

**Il testo del gioco.** I `.fav` sono finiti e rivisti (`progettazione/04-revisione.md`). Toccarli è
sempre una decisione dell’autore: ogni modifica cambia l’impronta della storia, va nel CHANGELOG e fa
salire almeno il PATCH. Il collaudo (`collaudo/regressioni.py --riprese` e `collaudo/pulsanti.py`)
deve restare verde.

## 4. I salvataggi come contratto

Un salvataggio contiene la **sequenza effettiva dei comandi** e l’**impronta** dello stato (SHA-256
di luogo, turno, variabili, oggetti, demoni, stato del generatore casuale). Caricare vuol dire
rigiocare e confrontare l’impronta, come nel Viaggiatore e come fa il motore 1.4.

- **Stessa storia e stesso motore** (impronta della storia uguale): il caricamento deve dare
  un’impronta **identica**. Se no è un difetto, non una scelta di versione.
- **Storia cambiata**: il salvataggio si rigioca sulla versione nuova e il gioco avvisa che la partita
  è stata ricostruita. È il caso MINOR del §3.
- **`formatoSalvataggi`** cresce quando cambia la *struttura del file*. Chi legge un formato più vecchio
  lo migra; un formato più nuovo viene rifiutato con un messaggio che chiede di aggiornare il gioco.
  Un formato che non si migra è MAJOR.

## 5. Pre-release

| Etichetta | Vuol dire |
|---|---|
| `alpha.N` | incompleta, può cambiare tutto |
| `beta.N` | completa nelle funzioni, in collaudo |
| `rc.N` | candidata: se non emergono problemi diventa la versione |

L’ordine è quello di SemVer §11: `1.0.0-alpha.1 < 1.0.0-beta.1 < 1.0.0-beta.2 < 1.0.0-rc.1 < 1.0.0`.

## 6. Commit

Messaggi nel formato **Conventional Commits**, in italiano, dal 14 ottobre 2026 (i commit precedenti
hanno un titolo libero):

```
tipo(ambito): che cosa cambia, al presente

Perché, se non è ovvio.
```

- **tipi**: `feat` (funzione nuova), `fix` (correzione), `docs`, `test`, `refactor`, `perf`,
  `build`, `ci`, `chore` (manutenzione, versioni)
- **ambiti**: `gioco` (i `.fav`), `motore`, `app` (la pagina), `tauri` (il processo Rust),
  `audio`, `intro`, `outro`, `salvataggi`, `collaudo`, `versioni`, `grafica`, `progettazione`
- un cambiamento incompatibile porta `!` dopo l’ambito e una riga `INCOMPATIBILE: …` nel corpo

Il tipo suggerisce il livello (`feat` → MINOR, `fix` → PATCH, `!` → MAJOR); decide comunque il §3.

## 7. CHANGELOG

`CHANGELOG.md` segue *Keep a Changelog*. In cima c’è sempre `## [Non rilasciato]`, dove si annota
ogni modifica mentre la si fa, con le sezioni **Aggiunto**, **Cambiato**, **Corretto**, **Rimosso**,
**Sicurezza**. Al rilascio lo strumento chiude la sezione con numero e data; le sue righe diventano le
note della release. Per i rilasci pubblici le note vanno anche in inglese, come chiede lo standard di
distribuzione Runtime (§2 e §8).

## 8. Come si chiude una versione

```bash
node strumenti/versione.mjs prepara minor
```

```bash
python collaudo/regressioni.py --riprese
```

```bash
python collaudo/pulsanti.py
```

```bash
node strumenti/versione.mjs verifica --rilascio
```

Poi il commit `chore(versioni): 0.2.0`. Gli altri comandi: `mostra` (le tre versioni), `verifica`
(la coerenza dei file), `note X.Y.Z` (le note di una versione).

**Tag e rilasci.** Per ora tutto resta locale: niente tag, niente GitHub. Il tag `v` + versione e la
release li crea il flusso di rilascio della fase 9 (CI su GitHub Actions, come il Viaggiatore e lo
standard Runtime), che rifiuta di partire se il tag esiste già. Un tag creato a mano prima di allora
lo bloccherebbe.
