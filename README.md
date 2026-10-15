# Il Relitto Silente — remake

Cartella di lavoro per il remake de «Il Relitto Silente». Il punto di partenza è la
versione scritta in FAVELLA 1, importata dal repository
[Pitz72/FAVELLA1](https://github.com/Pitz72/FAVELLA1) (commit `cfb54d4`, 7 ottobre 2026),
insieme al motore che la fa girare.

## Struttura

| Cartella | Contenuto | Origine nel repo FAVELLA1 |
|----------|-----------|---------------------------|
| `relitto-silente/` | Il gioco, completo: quattordici moduli, uno per atto più i trasversali (aria, traduzione, voci, finali). 23 stanze, 93 oggetti, 6 finali. Ha il suo README con mappa e comandi | `esempi/demo/relitto-silente/`, riscritto |
| `motore/` | FAVELLA 1 **v1.5.0** (dal 15 ottobre 2026, dal tag `v1.5.0`; il gioco è scritto sulla 1.4.4 e gira identico, `progettazione/16-favella-1-5-0.md`): moduli Python, CLI `favella.py`, collaudatore, esploratore, esportazione HTML, playground, sidecar di Favella Studio, test | radice del repo |
| `motore/favella1/` | Libreria standard (`verbi`, `sinonimi`, `proprieta`) e galleria di storie brevi | `favella1/` |
| `motore/esempi/` | Le demo del repo, servono alla suite di test (alcuni test le cercano qui) | `esempi/` |
| `motore/documentazione/` | Specifica della grammatica 1.5.0, il piano della 1.5.0 e il manuale d’autore (PDF + sorgenti Typst) | `documentazione/` |
| `grafica/` | Copertina originale del gioco | `landingpage/immagini/covers-original/` |
| `collaudo/` | Un percorso per ogni finale (`vivi`, `prima-nota`, `stiva-piena`, `doppio-fondo`, `mani-vuote`, `due-lettere`), i due percorsi limite `tutto` e `limite-I3`, quattro prove di non regressione (`riprendi-risuonatore`, `stiva-al-limite`, `groviglio-ostinato`, `vivaio-ritorno`), `soluzione.txt`, `prova-atti-I-II.txt`, `soluzione-originale.txt` (per l’originale intatto). Ogni percorso dichiara in testa quello che deve succedere (`# atteso: …`): `regressioni.py` li gioca tutti e controlla. `trascrivi.py` gioca un percorso e ne scrive la trascrizione; tre trascrizioni pronte da leggere. I collaudi dell’app: `pulsanti.py` (i pulsanti grezzi del motore), `menu.mjs` (i soli menu del modello d’azione, con `servizio_ponte.py` e `ponte.mjs`), `salvataggi.py`, `eventi.py` (il suono), `tipografia.mjs` (la grammatica tipografica su tutti i percorsi e su tutto il testo dei `.fav`) | nuovo |
| `progettazione/` | Documenti di progetto: `01-mappa-espansione.md` (strato 1: struttura, mappa, meccaniche, finali), `02-strato-2-atti-I-II.md` (Atti I e II), `03-strati-3-5.md` (Atti III–V, finali, bilanciamento, audit chiuso), `04-revisione.md` (criticità di codice e storia trovate dopo gli strati, e come sono state corrette), `05-lezioni-per-favella.md` (cosa il Relitto ha insegnato sul motore, proposte per una versione futura), `05b-verifica-delle-lezioni.md` (le lezioni verificate sul motore 1.4.4, in pacchetti), `06-app-desktop.md`, `06-proposte-visive.html` e `06-proposta-membrana.html` (la seconda parte: l’app desktop in Tauri, visione, stile, piano di fattibilità, tavole visive), `07-prompt-prossima-sessione.md` (il prompt della sessione del 14 ottobre), `08-fase-1-prova-tecnica.md` (la prova tecnica dell’app: misure su Windows e Linux, rischi), `09-intro-storyboard.md` con `09-intro-tavola.html` e `09-prova-di-look.html` (l’intro: storyboard 2, tavola dei fotogrammi, il quadro finito della scala in WebGL2), `10-bibbia-sonora.md` (il suono, stanza per stanza ed evento per evento), `11-prompt-prossima-sessione.md` (il prompt della terza sessione), `12-fase-2-ponte-e-modello.md` (il ponte, il modello d’azione, i salvataggi, gli eventi del suono: decisioni e misure), `13-prompt-prossima-sessione.md` (il prompt della quarta sessione), `14-fase-3-sistema-visivo.md` (la prima metà della fase 3: i caratteri, le atmosfere, la lamina e la grammatica tipografica, il ramo e il fiore, il visore, il dialogo, i salvataggi su disco, la membrana che cresce), `15-prompt-prossima-sessione.md` (il prompt della quinta sessione), `16-favella-1-5-0.md` (che cosa cambia per il Relitto con FAVELLA 1.5.0, e come si è aggiornato il motore) | nuovo |
| `app/` | L’app desktop: Tauri 2 (`src-tauri/`, Rust, l’audio con `kira`), React e TypeScript (`src/`), il motore dentro Pyodide con il ponte `src/motore/ponte.py`, il modello d’azione in `src/azione/` (i menu, le azioni di situazione, i suggerimenti) con le sue prove in `prove/`, lo schermo del gioco nello stile «Membrana» in `src/gioco/` (la lamina del testo, il ramo e il fiore, il visore, il dialogo, i pannelli, i salvataggi, le vene) con i suoi stili e le atmosfere in `src/stile/`, l’intro in `src/intro/` (per ora l’animatic, con le immagini in `public/intro/`), il campionario delle misure in `src/campionario/`, la pagina della prova tecnica in `src/prova/`. Nel processo Tauri, i salvataggi su disco (`src-tauri/src/salvataggi.rs`) | nuovo |
| `audio/` | `LICENZE.md`, il registro delle licenze dei suoni, con l’impronta di ogni sorgente; le sorgenti grezze stanno in `audio/sorgenti/`, fuori da git | nuovo |
| `strumenti/` | `versione.mjs` (le versioni), `verifica_tipografia.py` (il contratto tipografico sui documenti), `linux/costruisci.sh` (la costruzione in WSL o su Linux), `intro/` (scontorno degli still, tempi dei testi, cattura, plancia), `audio/` (la catena dei suoni: dalle sorgenti ai file del gioco), `apostrofi.py` (gli apostrofi tipografici nella prosa) | nuovo |
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

I sei finali, e gli altri percorsi, con i soli menu del modello d’azione dell’app (Node 22):

```bash
node collaudo/menu.mjs
```

I salvataggi (salva e ricarica in ogni stanza di ogni percorso) e gli eventi del suono:

```bash
python collaudo/salvataggi.py
```

```bash
python collaudo/eventi.py
```

La grammatica tipografica dell’app su tutti i percorsi e su tutto il testo dei `.fav`:

```bash
node collaudo/tipografia.mjs
```

Le prove dell’app (il modello d’azione, l’intro, le atmosfere, la grammatica, il ramo, il visore):

```bash
npm --prefix app run prove
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

Il gioco è la pagina principale (`http://localhost:5274/`); `?prova` apre la pagina delle misure tecniche,
`?campionario` il campionario del sistema visivo, `?intro&revisione` l’animatic dell’intro.

```bash
npm --prefix app run tauri build
```

Test del motore (da `motore/`):

```bash
python test_collaudo.py
```

Dalla 1.5.0 `test_linguaggio.py` legge anche file del repository FAVELLA1 che la copia non porta (il
sito, lo Studio): si gira su un estratto del tag, che ha gli stessi file del motore di `motore/`
(1.286 passati, 0 falliti, il 15 ottobre 2026):

```bash
git -C ../../../GitHub/FAVELLA1 archive v1.5.0 | tar -x -C <cartella vuota>
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
- **L’intro: storyboard 2, approvato** (`progettazione/09-intro-storyboard.md`). La tavola e il quadro finito della scala sono in `progettazione/09-*.html`. **L’animatic** gira nell’app: `npm --prefix app run dev`, poi `http://localhost:5274/?intro&revisione` (§10 dello storyboard).
- **Il suono: la bibbia e il prototipo** (`progettazione/10-bibbia-sonora.md`). I tre ambienti (la plancia, lo scafo, il vestibolo) suonano nell’app e si ascoltano in `progettazione/ascolti/`. Il motore è in `app/src-tauri/src/mondo/`; `cargo run --release --example rendi_ambienti` li rende su file.
- **Fase 2, il ponte e il modello d’azione: chiusa** (`progettazione/12-fase-2-ponte-e-modello.md`). I sei finali si giocano con i soli menu dell’app (4 voci per cosa in media, contro le 33 del motore grezzo); salvare e ricaricare in ogni stanza dà la stessa partita (463 salvataggi su 463); il ponte manda al suono 51 stati e 84 tipi di evento.
- **Fase 3, il sistema visivo: a metà** (`progettazione/14-fase-3-sistema-visivo.md`). Il gioco si gioca
  nell’app con lo stile «Membrana»: l’acciaio della Santa Maria, la membrana che cresce al primo contatto,
  le atmosfere con i contrasti provati in 54 climi, la lamina del testo con la grammatica tipografica
  (ogni testo del gioco riconosciuto e ricostruito carattere per carattere), il ramo delle azioni e il
  fiore, il visore, il dialogo, i salvataggi su disco. Restano il diario, il menu principale, la
  schermata dei riconoscimenti e la partita intera giocata a mano.
- **Le decisioni dell’autore** dopo la seconda sessione: `progettazione/06-app-desktop.md`, §18.
- Versione: **0.2.0** (`versione.json`, `CHANGELOG.md`).

Il progetto è sotto git (repository locale, ramo `main`).

## Licenza

Il motore FAVELLA 1 è distribuito con licenza MIT (`motore/LICENSE`).
