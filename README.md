# Il Relitto Silente — remake

Cartella di lavoro per il remake de «Il Relitto Silente». Il punto di partenza è la
versione scritta in FAVELLA 1, importata dal repository
[Pitz72/FAVELLA1](https://github.com/Pitz72/FAVELLA1) (commit `cfb54d4`, 7 ottobre 2026),
insieme al motore che la fa girare.

## Struttura

| Cartella | Contenuto | Origine nel repo FAVELLA1 |
|----------|-----------|---------------------------|
| `relitto-silente/` | Il gioco, completo: quattordici moduli, uno per atto più i trasversali (aria, traduzione, voci, finali). 23 stanze, 93 oggetti, 6 finali. Ha il suo README con mappa e comandi | `esempi/demo/relitto-silente/`, riscritto |
| `motore/` | FAVELLA 1 **v1.4.4** (versione definitiva): moduli Python, CLI `favella.py`, collaudatore, esploratore, esportazione HTML, playground, sidecar di Favella Studio, test | radice del repo |
| `motore/favella1/` | Libreria standard (`verbi`, `sinonimi`, `proprieta`) e galleria di storie brevi | `favella1/` |
| `motore/esempi/` | Le demo del repo, servono alla suite di test (alcuni test le cercano qui) | `esempi/` |
| `motore/documentazione/` | Specifica della grammatica 1.4.0 e manuale d’autore (PDF + sorgenti Typst) | `documentazione/` |
| `grafica/` | Copertina originale del gioco | `landingpage/immagini/covers-original/` |
| `collaudo/` | Un percorso per ogni finale (`vivi`, `prima-nota`, `stiva-piena`, `doppio-fondo`, `mani-vuote`, `due-lettere`), i due percorsi limite `tutto` e `limite-I3`, quattro prove di non regressione (`riprendi-risuonatore`, `stiva-al-limite`, `groviglio-ostinato`, `vivaio-ritorno`), `soluzione.txt`, `prova-atti-I-II.txt`, `soluzione-originale.txt` (per l’originale intatto). Ogni percorso dichiara in testa quello che deve succedere (`# atteso: …`): `regressioni.py` li gioca tutti e controlla. `trascrivi.py` gioca un percorso e ne scrive la trascrizione; tre trascrizioni pronte da leggere | nuovo |
| `progettazione/` | Documenti di progetto: `01-mappa-espansione.md` (strato 1: struttura, mappa, meccaniche, finali), `02-strato-2-atti-I-II.md` (Atti I e II), `03-strati-3-5.md` (Atti III–V, finali, bilanciamento, audit chiuso), `04-revisione.md` (criticità di codice e storia trovate dopo gli strati, e come sono state corrette), `05-lezioni-per-favella.md` (cosa il Relitto ha insegnato sul motore, proposte per una versione futura), `06-app-desktop.md`, `06-proposte-visive.html` e `06-proposta-membrana.html` (la seconda parte: l’app desktop in Tauri, visione, stile, piano di fattibilità, tavole visive), `07-prompt-prossima-sessione.md` (il prompt della sessione del 14 ottobre), `08-fase-1-prova-tecnica.md` (la prova tecnica dell’app: misure su Windows e Linux, rischi), `09-intro-storyboard.md` con `09-intro-tavola.html` e `09-prova-di-look.html` (l’intro: storyboard 2, tavola dei fotogrammi, il quadro finito della scala in WebGL2), `10-bibbia-sonora.md` (il suono, stanza per stanza ed evento per evento), `11-prompt-prossima-sessione.md` (da dove ripartire) | nuovo |
| `app/` | L’app desktop: Tauri 2 (`src-tauri/`, Rust, l’audio con `kira`), React e TypeScript (`src/`), il motore dentro Pyodide con il ponte `src/motore/ponte.py`. Per ora c’è la schermata grezza della prova tecnica, non lo stile del gioco | nuovo |
| `audio/` | `LICENZE.md`, il registro delle licenze dei suoni; le sorgenti grezze andranno in `audio/sorgenti/`, fuori da git | nuovo |
| `strumenti/` | `versione.mjs` (le versioni), `verifica_tipografia.py` (il contratto tipografico sui documenti), `linux/costruisci.sh` (la costruzione in WSL o su Linux), `intro/` (scontorno degli still, tempi dei testi, cattura, plancia) | nuovo |
| `sviluppo/` | `VERSIONI.md`: le regole delle versioni e dei messaggi di commit | nuovo |

Non sono stati importati Favella Studio (l’IDE Electron), il sito e il branding del repo.

Nella radice: `versione.json` (la versione del gioco, unica fonte) e `CHANGELOG.md` (il registro delle modifiche).

La copia in `motore/esempi/demo/relitto-silente/` è identica a `relitto-silente/` al momento
dell’importazione: resta lì come riferimento intatto dell’originale, mentre il remake si fa
in `relitto-silente/`.

## Requisiti

Python ≥ 3.10 e `lark` (unica dipendenza esterna del motore):

```bash
pip install "lark>=1.1"
```

## Comandi

Dalla radice del progetto:

```bash
python motore/favella.py gioca relitto-silente/relitto.fav
```

```bash
python motore/favella.py compila relitto-silente/relitto.fav
```

```bash
python motore/favella.py collaudo relitto-silente/relitto.fav --finali --percorso collaudo/vivi.txt --percorso collaudo/prima-nota.txt --percorso collaudo/stiva-piena.txt --percorso collaudo/doppio-fondo.txt --percorso collaudo/mani-vuote.txt --percorso collaudo/due-lettere.txt
```

```bash
python collaudo/regressioni.py --riprese
```

```bash
python collaudo/trascrivi.py relitto-silente/relitto.fav collaudo/vivi.txt -o collaudo/trascrizione-vivi.txt
```

```bash
python motore/favella.py esporta relitto-silente/relitto.fav
```

Il collaudo a pulsanti (i 14 percorsi attraverso il ponte dell’app):

```bash
python collaudo/pulsanti.py
```

Le versioni:

```bash
node strumenti/versione.mjs verifica
```

L’app (serve Node 22; Rust per l’eseguibile):

```bash
npm --prefix app install
```

```bash
npm --prefix app run dev
```

```bash
npm --prefix app run tauri build
```

Test del motore (da `motore/`):

```bash
python test_linguaggio.py
```

## Stato verificato all’importazione

- Compilazione: riuscita (15 stanze, 50 oggetti), nessun avviso del linter.
- Collaudo statico: vincibile, nessuna regola irraggiungibile segnalata.
- Collaudo dinamico: la soluzione in `collaudo/` raggiunge l’unico finale in 54 comandi.
- Test del motore: `test_linguaggio.py` 1180 passati, 0 falliti; `test_collaudo.py` 50 passati, 0 falliti.

## Stato del remake (strati 1–5 completi)

- Compilazione: 23 stanze, 93 oggetti, nessun avviso. Collaudatore statico: nessuna regola irraggiungibile.
- Finali: 6 dichiarati, 6 raggiunti dai percorsi in `collaudo/`. Gli invarianti dell’aria sono verificati (vedi `progettazione/03-strati-3-5.md`).
- Esploratore: 23 stanze su 23, nessuna anomalia, nessuna eccezione del motore.
- Il motore non è stato modificato.
- Revisione (`progettazione/04-revisione.md`): dodici problemi di codice, cinque di storia e cinque di collaudo, fra cui un bug grave (il risuonatore posato non si riprendeva). Tutti corretti; quattro percorsi nuovi impediscono che tornino.
- Collaudo di regressione: 14 percorsi su 14, più la prova di ripresa di ogni oggetto.

## Stato dell’app

- **Fase 1, la prova tecnica: chiusa** (`progettazione/08-fase-1-prova-tecnica.md`). Il motore vero gira dentro Pyodide nell’app Tauri; la partita si gioca a soli pulsanti; l’audio in Rust tiene. Su Windows: primo comando in circa 1,7 s, turni in 6 ms. Su Linux costruiti il .deb e l’AppImage; manca la prova su una macchina vera.
- **L’intro: storyboard 2** (`progettazione/09-intro-storyboard.md`), in attesa di approvazione. La tavola e il quadro finito della scala sono in `progettazione/09-*.html`.
- **Il suono: la bibbia** (`progettazione/10-bibbia-sonora.md`). Il prototipo dei tre ambienti aspetta il permesso per i file.
- Versione: **0.1.0** (`versione.json`, `CHANGELOG.md`).

Il progetto è sotto git (repository locale, ramo `main`).

## Licenza

Il motore FAVELLA 1 è distribuito con licenza MIT (`motore/LICENSE`).
