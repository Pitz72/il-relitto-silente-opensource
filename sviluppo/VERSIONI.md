# Versioni del Relitto Silente

Le regole con cui il gioco cambia numero. Riprendono quelle del Viaggiatore, adattate a Tauri e al
fatto che qui l’app è ancora in costruzione. Lo strumento che le applica è `strumenti/versione.mjs`.

## 1. Tre numeri, tre cose diverse

| Che cosa | Dove | Forma | Chi la decide |
|---|---|---|---|
| **Il gioco** | `versione.json` → `gioco` | SemVer 2.0.0: `MAJOR.MINOR.PATCH[-pre]` | questo documento |
| **Il motore FAVELLA** | `motore/strutture.py` → `VERSIONE_MOTORE` | SemVer del motore: 1.5.0 (dal 15 ottobre 2026; prima 1.4.4) | il repository del motore; l’aggiornamento della copia, l’autore |
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

**Una PATCH a ogni consegna (decisione dell'autore, 16 ottobre 2026).** Prima il numero si muoveva solo a
fine fase, e per questo restava 0.2.0 anche dopo settimane di lavoro (suono, musica, opzioni audio, intro). Da
qui in poi **ogni consegna all'autore prende un numero nuovo** (0.2.1, 0.2.2…), con la sua sezione datata nel
CHANGELOG (`node strumenti/versione.mjs prepara patch`, poi il commit «chore(versioni): X.Y.Z»); il MINOR sale
quando si chiude una fase. La consegna si chiama «Il Relitto Silente X.Y.Z+commit»; se porta la console di regia
(`RELITTO_REGIA=1`, bibbia sonora §12) lo dice nel nome: «… (regia)». Le correzioni dentro una fase sono PATCH (0.3.1, 0.3.2). Una fase che si chiude in più passi può
usare le pre-release (0.3.0-alpha.1). Il numero non promette niente a nessuno finché non esce la 1.0.

### 2.1 Il remake è un programma a sé (decisione dell’autore, 16 ottobre 2026)

Il repository GitHub ospita anche il vecchio gioco (`old_version/`, Electron e React), che ha le sue
release: `v1.2.6`, `v1.5.1` e `v1.5.3`. **Il remake non ne è l’evoluzione: è un altro programma, con un altro
sviluppo, e comincia la sua numerazione da capo**: il primo rilascio pubblico è la **1.0.0**, come scritto sopra.
Ne vengono tre conseguenze:

- **Nessun conflitto di aggiornamento**: il vecchio gioco non aveva un aggiornamento automatico, quindi una sua
  installazione non cercherà mai di «aggiornarsi» al remake, e viceversa. Il remake avrà il suo.
- **I tag non si devono scontrare.** Il tag del remake è `v` + versione. Se la numerazione del remake arrivasse a
  un numero già usato dal vecchio gioco (**1.2.6, 1.5.1, 1.5.3**), si **salta al successivo** (1.2.7, 1.5.2…):
  un tag esistente non si riusa mai. Il flusso di rilascio rifiuta di partire se il tag esiste già.
- **Si distinguono a parole.** Le release del remake portano nel titolo «Il Relitto Silente (remake)»; GitHub
  segna «Latest» l’ultima pubblicata (non la versione più alta), e il README dice chiaramente che il
  vecchio gioco e il remake hanno due numerazioni.

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
- un nuovo motore FAVELLA *minor* (la copia in `motore/` si rifà dal tag e non si cambia mai a mano;
  la 1.5.0 è entrata prima della 1.0, con la fase 3);
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
rigiocare e confrontare l’impronta, come nel Viaggiatore e come fa il motore dalla 1.4.

- **Stessa storia e stesso motore** (impronta della storia uguale): il caricamento deve dare
  un’impronta **identica**. Se no è un difetto, non una scelta di versione.
- **Storia cambiata**: il salvataggio si rigioca sulla versione nuova e il gioco avvisa che la partita
  è stata ricostruita. È il caso MINOR del §3.
- **Solo il motore cambiato** (gli stessi `.fav`, un motore più nuovo: l’impronta della storia
  ricalcolata con la versione del motore scritta nel salvataggio torna): se la partita rigiocata
  arriva alla stessa impronta è **identica**, e il gioco non avvisa; se no è ricostruita, e il gioco
  dice che è cambiato il motore.
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
**Sicurezza**. Al rilascio lo strumento chiude la sezione con numero e data. Per i rilasci pubblici le
note vanno anche in inglese, come chiede lo standard di distribuzione Runtime (§2 e §8).

**Per chi gioca** (nota dell’autore del 19 ottobre 2026). Ogni versione ha, per prima, la sezione
`### Per chi gioca`: un elenco di poche righe semplici, che dicono a chi gioca che cosa c’è di nuovo
(non come è fatto), con l’inizio in grassetto. Le scrivo io, senza la sua approvazione (decisione
dell’autore). Sono le righe che il gioco mostra dopo un aggiornamento, nella finestra delle novità, e
che la release porta nel suo corpo (§7 dell’aggiornamento automatico, più sotto). Lo strumento le legge
con `strumenti/changelog.mjs`; `verifica --rilascio` non lascia rilasciare una versione che non le ha, e
`corpo` stampa il corpo della release. Una versione senza niente per chi gioca non si rilascia (la
regola dell’autore: niente release solo tecniche).

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
python strumenti/riconoscimenti.py --verifica
```

Poi l’eseguibile di rilascio (`npm --prefix app run tauri build -- --no-bundle`), e le prove dentro di lui:

```bash
python strumenti/prova_eseguibile.py finali
```

```bash
python strumenti/prova_eseguibile.py salvataggi
```

```bash
node strumenti/versione.mjs verifica --rilascio
```

Poi il commit `chore(versioni): 0.2.0`. Gli altri comandi: `mostra` (le tre versioni), `verifica`
(la coerenza dei file), `note X.Y.Z` (le note di una versione), `corpo X.Y.Z` (il corpo della release:
le righe «Per chi gioca» e il rimando al CHANGELOG).

**Tag e rilasci.** Dal 16 ottobre 2026 il repository è su GitHub (`Pitz72/il-relitto-silente-opensource`), ma
**non si crea nessun tag del remake a mano** (vedi §2.1). Il tag `v` + versione e la
release li crea il flusso di rilascio della fase 9 (CI su GitHub Actions, come il Viaggiatore e lo
standard Runtime), che rifiuta di partire se il tag esiste già. Un tag creato a mano prima di allora
lo bloccherebbe.

## 7. L'aggiornamento automatico e il rilascio (16 ottobre 2026)

- **Il flusso.** Si prepara la versione (`node strumenti/versione.mjs prepara …`), si fa il commit «chore(versioni)», si spinge
  il tag `v` + versione: `.github/workflows/rilascio.yml` costruisce Windows e Linux, firma i pacchetti e prepara una release **in
  bozza** con il suo `latest.json`; l'autore la pubblica a mano. Finché è bozza nessun gioco installato la vede.
- **Il gioco** controlla un indirizzo fisso, `https://github.com/Pitz72/il-relitto-silente-opensource/releases/download/aggiornamenti/latest.json`
  (`app/src-tauri/tauri.conf.json`, `app/src/aggiornamenti.ts`): all'avvio, se l'opzione «Aggiornamenti» lo vuole (di base sì), e a mano dal menu («Cerca aggiornamenti»).
  Se c'è una versione più alta lo dice e chiede; l'installazione la decide chi gioca. Il pacchetto deve essere **firmato** con la chiave
  privata dell'autore: la chiave pubblica sta in `tauri.conf.json`, e un pacchetto senza la firma giusta non si installa.
- **La chiave privata** non sta nel repository. Chi ce l'ha può firmare un «aggiornamento» che ogni gioco installato accetta; chi la
  perde non può più aggiornare i giochi già installati (andrebbero reinstallati a mano). La chiave di oggi è del **19 ottobre 2026**
  (revisione 25, G4; identificativo `26304917F4709F8A`), cifrata con una password a caso di 40 caratteri, come per PixelDebh:
  - `C:\Users\Utente\.relitto-signing\`: la chiave privata, la pubblica, un `LEGGIMI.txt` e `carica-i-segreti.ps1`; **non** la password;
  - `F:\Backup\Relitto-chiavi-firma-2026-10-19\`: la copia della chiave e la **password**, che esiste solo lì (così chi copia la
    cartella dal PC non porta via anche la password);
  - i Secrets del repository `TAURI_SIGNING_PRIVATE_KEY` (il contenuto della chiave) e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, che
    mette lo script, con F: collegato: `& "C:\Users\Utente\.relitto-signing\carica-i-segreti.ps1"`;
  - la chiave pubblica in `app/src-tauri/tauri.conf.json`, `plugins.updater.pubkey`.
  La prima chiave, del 16 ottobre, era senza password e in una copia sola: è nel Cestino. Le consegne di prova 0.2.2 e 0.2.3 la
  portano e non si aggiorneranno da sole; non importa, sono copie di prova.
- **Per rifare la chiave** (se andasse persa o rubata, prima di qualunque release pubblica): `node app/node_modules/@tauri-apps/cli/tauri.js
  signer generate -w <file> -p <password> --ci` (o senza `-p`, e la password la chiede a tastiera), poi le copie e i Secrets come sopra, e
  la chiave pubblica nuova in `tauri.conf.json`. Il 19 ottobre l'ha fatto uno script che non ha mai stampato la password e ha provato la
  firma due volte: con la password giusta riesce, con una sbagliata è rifiutata.
- **I canali, non «Latest»** (19 ottobre 2026, revisione 25, G3). Prima il gioco chiedeva la release «Latest» di GitHub, che in questo
  repository è la `v1.5.3` del gioco originale: l'indirizzo dava 404, e le release del remake, con numeri più bassi, rischiavano di non
  diventare mai «Latest»; le pre-release non lo diventano mai. Ora ci sono due release fisse, segnate come pre-release perché non diventino
  mai «Latest»: **`aggiornamenti`**, che leggono le versioni normali, e **`aggiornamenti-prova`**, che leggono le build di una pre-release
  (il flusso di rilascio aggiunge `app/src-tauri/tauri.prova.conf.json` quando il tag ha un trattino, `v0.9.0-beta.1`). Quando l'autore
  pubblica la bozza, `.github/workflows/canale.yml` copia il suo `latest.json` nel canale: una versione normale in tutti e due, una
  pre-release solo in quello di prova; la prima volta crea le release dei canali. Pubblicare è quindi il gesto che fa arrivare
  l'aggiornamento: finché la release è bozza, il canale resta com'era.
- **I messaggi** («Cerca aggiornamenti» dal menu): «Il gioco è aggiornato.»; «Non c'è ancora una versione da scaricare.» se il canale
  non ha un `latest.json` (prima della prima release pubblicata); «Non riesco a controllare: serve la rete.» per gli altri errori; e, se il
  pacchetto non porta la firma dell'autore, «L'aggiornamento non porta la firma dell'autore: non lo installo.»
- **Le novità dopo l’aggiornamento** (nota dell’autore, 19 ottobre 2026; revisione 25, L15). La build mette nel gioco le righe «Per
  chi gioca» del CHANGELOG (§7 del CHANGELOG, sopra) di tutte le versioni fino alla sua (`app/vite.config.ts`). Al primo arrivo al
  menu con una versione diversa dall’ultima vista, una finestra (`app/src/menu/FinestraNovita.tsx`) mostra quelle delle versioni
  arrivate da allora, la più recente prima; la versione vista si ricorda nel browser dell’app (`relitto.versione-vista`). Le decisioni
  dell’autore: **anche le pre-release** la mostrano; **chi installa da zero** non vede niente (ma chi aveva già giocato con una
  versione di prima, che non ricordava niente, vede le novità di questa: lo dicono i salvataggi, il registro dei finali o le
  opzioni); chi torna a una versione più vecchia nemmeno, e si ricorda la più nuova. Prima, il flusso di rilascio scrive le stesse
  righe nel **corpo della release** (`node strumenti/versione.mjs corpo`), che tauri-action copia nel `latest.json` («notes»): la
  domanda «È uscita la versione…» le mostra prima di scaricare. La domanda e la finestra, quando si aprono da sole, non cerchiano il
  primo pulsante. Nello sviluppo: `?novita` (la finestra con le righe di «Non rilasciato») e `?aggiornamento-finto` (la domanda).
- **Le build locali** (le consegne di ascolto) non sono firmate per l'aggiornamento: `createUpdaterArtifacts` sta solo in
  `app/src-tauri/tauri.rilascio.conf.json`, che usa il flusso di rilascio.
- **Prova.** Il client e i flussi non si possono provare del tutto prima del primo tag. La strada: si pubblica una pre-release (per esempio
  `v0.9.0-beta.1`) e la si installa; poi una seconda (`v0.9.0-beta.2`): la prima, che legge il canale di prova, deve trovarla, scaricarla e
  installarla. Solo dopo, la prima versione normale.
  **Fatta il 19 ottobre 2026, ed è riuscita.** `v0.2.5-beta.1` e `v0.2.5-beta.2` costruite e firmate da `rilascio.yml` (la firma
  porta la chiave `26304917F4709F8A`, la stessa di `tauri.conf.json`), pubblicate a mano come pre-release; `canale.yml` ha creato la
  release `aggiornamenti-prova` e ci ha messo il `latest.json` di ognuna. L’autore ha installato la beta.1 presa da GitHub: al menu il
  gioco gli ha chiesto di aggiornare alla beta.2, l’ha scaricata, ha avviato l’installatore, e si è riaperto alla beta.2 (controllato
  sull’eseguibile installato). Il canale `aggiornamenti`, quello delle versioni normali, è ancora vuoto (404): il gioco lo dice con
  «Non c’è ancora una versione da scaricare.» L’unica cosa che mancava era un segno che lo scaricamento andava avanti: la barra
  (revisione 25, L15) c’è dalla beta.3: la beta.2 installata si è aggiornata alla beta.3 come prima, e la beta.3 alla beta.4
  mostrando la barra con i megabyte e poi «Installo» (l’autore l’ha vista; controllato sull’eseguibile installato, 0.2.5-beta.4).

