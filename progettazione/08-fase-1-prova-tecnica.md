# Fase 1 — la prova tecnica

**Che cosa si è costruito, che cosa si è misurato, che cosa non ha funzionato.** 14 ottobre 2026,
versione 0.1.0. È la fase 1 del piano (`06-app-desktop.md`, §14): togliere subito i rischi, Linux per
primo. Si chiude con un sì o un no per ogni rischio del §13.2 (qui al §6).

---

## 1. In sintesi

Il motore FAVELLA vero gira dentro l’app, su Windows e su Linux, e la partita «Vivi» si gioca tutta
con i soli pulsanti del motore, dentro la finestra Tauri, su tutti e due i sistemi. Le misure stanno
larghe dentro i limiti del piano:

| | Windows (WebView2 155) | Linux in WSLg (WebKitGTK 2.52, grafica in software) |
|---|---|---|
| Dall’avvio del processo alla prima stanza | **1,7 s** | **2,8 s** |
| Un turno (motore, pulsanti, JSON), mediana e 95° percentile | **6,2 ms · 8,7 ms** | **7 ms · 11 ms** |
| «Vivi» a soli pulsanti | 78 comandi su 78, attese 4 su 4 | 78 su 78, 4 su 4 |
| Venature a 1920×1080 | **60 fps** fissi, anche con tre volte le vene | 51 fps (44 sotto sforzo): è il rendering in software |
| Audio: dal comando al primo blocco audio | **4,6 ms** in mediana, mai oltre 9,5 | 8 ms in mediana, mai oltre 19 |
| Audio sotto carico (venature in fuga e partita insieme) | nessun buco oltre 10,3 ms, zero errori | nessun buco oltre 24 ms, zero errori (dopo la correzione del §5.2) |
| Pacchetti | eseguibile portatile 9,3 MB, installer NSIS 7,0 MB | `.deb` 7,1 MiB, AppImage 82 MiB |

Due cose non si potevano provare qui e restano aperte: le prestazioni grafiche di WebKitGTK su una
scheda video vera (WSLg qui disegna con llvmpipe, cioè senza GPU) e la finestra bianca con i driver
NVIDIA. Il §7 dice come provarle su una macchina Linux vera.

## 2. Che cosa è stato costruito

| Dove | Che cosa |
|---|---|
| `app/` | Vite 8.3 + React 19.3 + TypeScript 7.0. Il motore (`../motore`, cinque moduli) e il gioco (`../relitto-silente`, quattordici moduli) entrano nel pacchetto come testo (`src/motore/sorgenti.ts`), mai copiati né modificati |
| `app/public/pyodide/` | Pyodide 0.27.8 (Python 3.12.7, lo stesso ramo del CPython dei collaudi) e la ruota di lark 1.3.1, con l’impronta verificata su PyPI a ogni build (`scripts/sincronizza.mjs`) |
| `app/src/motore/ponte.py` | il ponte: compila, avvia, esegue un comando; per ogni turno restituisce gli eventi (`raccogli_uscita`), i pulsanti (`gioco.pulsanti`, con `modo_comandi = "pulsanti"` impostato dal ponte sulla partita, il `.fav` non cambia) e lo stato degli strumenti (aria, matrice, echi, risonanze, chiavi, tracce, stanza, tuta, protezione vitale, fuga, stanze viste). In più trova il pulsante che gioca un comando di un percorso (§4) |
| `app/src/prova/` | la schermata grezza della prova: gioca a pulsanti, misura, scrive un rapporto JSON. Non è lo stile del gioco: lo stile resta la «Membrana» delle tavole, da costruire nella fase 3 |
| `app/src/prova/venature.ts` | il generatore delle venature di `06-proposta-membrana.html`, lo stesso algoritmo e lo stesso seme, più un modo con le venature ferme copiate da una tela in memoria |
| `app/src-tauri/` | Tauri 2.12 (Rust 1.95). `src/audio.rs`: kira 0.12.5 su cpal 0.18.2, il re del reattore sintetizzato (re2 a 73,42 Hz, otto armonici, due banchi scordati che battono), un campione in loop letto dalle risorse, il segnale per la latenza, la telemetria del flusso. `src/lib.rs`: i comandi per la pagina, il rapporto, la variabile per la grafica compatibile su Linux |
| `collaudo/pulsanti.py` | lo stesso ponte, in CPython, gioca i quattordici percorsi a soli pulsanti e controlla le loro attese |
| `strumenti/linux/costruisci.sh` | la build `.deb` e AppImage, in WSL o su una macchina Linux, con la prova a richiesta |

**La prova automatica.** Con `RELITTO_PROVA=esci` l’app va a schermo intero, gioca «Vivi» a pulsanti,
avvia l’audio e ne misura la latenza, misura le venature in cinque modi, ripete l’audio sotto carico
(venature in fuga e una seconda partita insieme), scrive il rapporto in `RELITTO_RAPPORTI` e si chiude.
Con `RELITTO_PROVA=audio` fa solo la parte dell’audio. Dura circa novanta secondi.

**Che cosa si è installato.** Su Windows le dipendenze npm e cargo elencate in `app/package.json` e
`app/src-tauri/Cargo.toml`. In WSL: le librerie di sviluppo di WebKitGTK 4.1 e ALSA con apt, Rust con
rustup, `tauri-cli` 2.12.2 con cargo. Il bundler di Tauri scarica da sé, da GitHub, gli strumenti di
NSIS (Windows) e `linuxdeploy` con `AppRun` (AppImage): in CI andranno messi in cache.

## 3. Le misure su Windows

Macchina di sviluppo: Ryzen 7 9700X, RTX 2070, schermo 1920×1080 a 60 Hz, scala 100%, Windows 11 Pro
(26100), WebView2 155. Build di rilascio, prova automatica a schermo intero; i numeri sono della
seconda prova, la prima dice lo stesso entro il 10%.

### 3.1 L’avvio

| Passo | ms |
|---|---|
| dal processo alla pagina pronta | 357 |
| `pyodide.js` | 4 |
| l’interprete (WebAssembly e libreria standard) | 727 |
| lark, dalla ruota | 13 |
| i diciannove file nel filesystem di Pyodide | 3 |
| l’import del motore | 172 |
| la compilazione del gioco | 437 |
| la prima stanza (con i pulsanti) | 22 |
| **dalla pagina al primo comando possibile** | **1.377** |

In CPython la compilazione costa 0,25 s: in Pyodide 0,44, meno del doppio. Il motore è pronto in
1,7 secondi dall’avvio del processo. Nell’intro il primo testo della scatola nera compare dopo quattro
secondi: il caricamento ci sta dietro con margine.

### 3.2 Il turno

Su 78 turni di «Vivi»: **6,2 ms in mediana, 8,7 al 95° percentile, 38 al massimo** (l’ultimo turno,
quello del finale). Dentro Python: il motore 4,5 ms, i pulsanti 1,2, il JSON 0,2. Il piano prevedeva
meno di 50 ms.

### 3.3 Le venature

A 1920×1080, sopra la schermata, in rAF:

| Modo | fps | intervallo al 99° percentile | disegno (95°) |
|---|---|---|---|
| crescita del primo contatto | 60 | 16,9 ms | 0,2 ms |
| relitto | 60 | 16,9 ms | 0,1 ms |
| fuga (lacerazioni e lampi) | 60 | 16,9 ms | 0,1 ms |
| relitto, venature ferme in memoria | 60 | 16,8 ms | 0,1 ms |
| sotto sforzo: tre volte le vene (57 vene, 1.381 punti) | 60 | 16,9 ms | 0,2 ms |

Nessun fotogramma perso. Il disegno vero lo fa la GPU, fuori da quei tempi: è il compositore, non il
JavaScript, quello che su Linux pesa (§4.2).

### 3.4 L’audio

| | |
|---|---|
| Sistema e formato | WASAPI, 48 kHz, blocchi interni di 128 campioni |
| Avvio del motore audio · lettura del campione OGG | 48 ms · 8 ms |
| Andata e ritorno di un comando Tauri | 1,0 ms in mediana, 1,8 al massimo |
| Dal comando al primo blocco audio che lo contiene | 4,6 ms in mediana, 9,4 al 95°, 9,5 al massimo |
| Intervallo massimo fra due blocchi, in quiete · sotto carico | 10,1 ms · 10,3 ms (il periodo di WASAPI) |
| CPU del thread audio | 0,9% in media, 1,5% al massimo |
| Errori del flusso | 0 |

Alla latenza misurata va aggiunto il buffer d’uscita di Windows (circa 10 ms in modo condiviso): un
suono parte fra 15 e 25 ms dopo il clic. Per un gioco a pulsanti è istantaneo. La musica come orologio
delle cinematiche (§9.1 del 06) si potrà verificare solo nella fase 6, con un brano vero.

### 3.5 I pacchetti

| Pacchetto | Dimensione |
|---|---|
| eseguibile portatile `il-relitto-silente.exe` (tutto dentro: Pyodide, motore, gioco, campione) | 9,3 MB |
| installer NSIS | 7,0 MB (6,65 MiB) |
| risorse della pagina prima della compressione (Pyodide 14 MB, il resto 1 MB) | 15 MB |

Tauri comprime le risorse con brotli dentro l’eseguibile: Pyodide passa da 14 a pochi MB. La stima del
06 (60–90 MB a gioco finito) resta sensata: lo spazio lo prenderanno l’audio e le immagini.

## 4. Linux in WSL

Ubuntu 24.04.3 in WSL 2 con WSLg, WebKitGTK 2.52.6 di Ubuntu. **WSLg qui disegna con llvmpipe**
(rendering in software, senza GPU: `glxinfo` dice «Accelerated: no»): per WebKitGTK è il caso peggiore,
e i numeri della grafica vanno letti così.

### 4.1 Build e pacchetti

| | |
|---|---|
| Build di rilascio da zero · ricostruzione | 172 s · 45 s |
| Eseguibile | 9,7 MB |
| `.deb` | 7,1 MiB: usa le librerie di sistema |
| AppImage | 82 MiB: porta con sé WebKitGTK e GTK. Senza GStreamer (`bundleMediaFramework: false`), che non serve perché l’audio è in Rust |

La build si fa in una copia nel filesystem di Linux (`~/relitto-build`): cargo su `/mnt/c` è lentissimo.
Il frontend si può costruire su Windows e copiare (`--senza-node`). Per le release l’AppImage va
costruita su Ubuntu 22.04 (glibc più vecchia, più distribuzioni coperte), come dice il §13.1 del 06.

### 4.2 Le misure

| | Eseguibile | AppImage |
|---|---|---|
| dal processo alla pagina | 626 ms | 268 ms |
| dalla pagina al primo comando | 2.138 ms (interprete 1.358, compilazione 495) | 2.217 ms |
| turno: mediana · 95° · massimo | 7 · 11 · 43 ms | 7 · 14 ms |
| «Vivi» a pulsanti | 78 su 78, attese 4 su 4 | 78 su 78, 4 su 4 |
| venature: crescita · relitto · fuga · ferme · sforzo | 56 · 51 · 51 · 53 · 44 fps | 56 · 50 · 50 · 51 · 43 fps |
| audio: dal comando al primo blocco, mediana · 95° | 8,1 · 17,8 ms | 7,6 ms in mediana |
| audio sotto carico: buco massimo · errori | 24 ms · 0 | 23 ms · 0 |

Pyodide gira dentro WebKitGTK e dentro il protocollo `tauri://` senza aggiustamenti, con la stessa
politica di sicurezza dei contenuti di Windows (`script-src 'self' 'wasm-unsafe-eval'`). Il disegno
delle venature costa 0,3 ms anche qui: i 51 fps li impone il compositore di WebKitGTK che, senza GPU,
rasterizza a mano un’intera finestra 1920×1080 a ogni fotogramma.

## 5. Che cosa non ha funzionato

### 5.1 Il ponte trovava pulsanti «equivalenti» sbagliati

La prima versione cercava, per un comando che non ha un pulsante identico, un pulsante che portasse la
partita nello stesso stato. Ma tutti i comandi che non cambiano niente portano allo stesso stato: «alza
il faro» in protezione vitale (la tuta non lo rialza) veniva giocato con «alza le teche aperte», e il
percorso `groviglio-ostinato` falliva, perché aspetta la frase «la tuta non ti ridà il faro».

**Correzione.** L’equivalenza ora chiede lo stesso stato **e** la stessa risposta del motore. I pulsanti
si provano in quest’ordine: lo stesso verbo, poi gli altri verbi sulla stessa cosa («leggi il
registro» si gioca con «esamina il registro di bordo»), poi il servizio («aspetta» per primo), poi il
resto. Solo quando nessun pulsante dà la stessa risposta ne vale uno con lo stesso stato, e il
collaudo lo elenca a parte.

**I numeri nuovi** (`python collaudo/pulsanti.py`): 14 percorsi su 14, 1.294 comandi; 1.112 con lo
stesso comando, 179 con uno equivalente (stesso stato, stessa risposta), **3 con lo stesso stato e una
risposta diversa**. Sono i «giù» che `groviglio-ostinato` scrive nella sala delle teche, dove non si
scende, solo per far passare il tempo: con i pulsanti il giù non c’è, e si aspetta. Il conto del §1
del 06 (1.294 su 1.294, di cui 264 «in una forma diversa») veniva dal criterio vecchio: il nuovo è più
severo, e il risultato regge lo stesso.

### 5.2 L’audio in WSLg: buchi di secondi

Alla prima prova completa in WSLg, sotto carico, l’audio si è fermato per **6,2 secondi**, con 83
errori del flusso. Le prove successive hanno isolato la causa:

| Prova | Buco massimo | Errori | Latenza |
|---|---|---|---|
| ALSA, come la usa kira di suo | 1,3 s in quiete, 4,6 s sotto carico | centinaia di migliaia (`snd_pcm_avail_delay: I/O error`, xrun) | 9 ms |
| ALSA con un buffer fisso di 2048 campioni | 6,9 s | come sopra | 27 ms |
| protocollo PulseAudio di cpal, come lo usa kira | 2,0 s | sotto carico ricompaiono quelli di ALSA | 87 ms |
| protocollo PulseAudio, dispositivo fissato all’avvio | 2,4 s | 0 | 146 ms |
| **ALSA, dispositivo fissato all’avvio** | **24 ms** | **0 sotto carico** (10 all’avvio) | **8 ms** |

Il colpevole era una funzione di kira: ogni mezzo secondo interroga il sistema per seguire il
dispositivo predefinito, e in WSLg quella domanda, a flusso aperto, fa fallire il plugin ALSA che porta
l’audio a PulseAudio. **Correzione** (`audio.rs`): su Linux il dispositivo «default» di ALSA si sceglie
una volta all’avvio e si passa a kira, che così smette di interrogare. Il «default» di ALSA porta a
PipeWire o a PulseAudio, che spostano da soli il flusso quando cambia l’uscita (le cuffie). Il
protocollo PulseAudio di cpal resta compilato (Rust puro, nessuna libreria in più) e si prova con
`RELITTO_AUDIO_HOST=pulseaudio`. Su Windows non cambia niente: WASAPI con il controllo di kira non ha
dato un solo errore.

L’audio di WSLg passa per il protocollo del desktop remoto verso Windows, e non somiglia a quello di un
Linux vero: il verdetto su Linux spetta alla macchina vera (§7).

### 5.3 Altre cose da sapere

- **In modo «pulsanti» il motore offre ogni verbo d’autore su ogni oggetto** («firma la nave aliena»,
  «stacca i comandi di manovra»). È il modello grezzo, quello del §1 del 06: il filtro del §6.1 nella
  fase 2 non è un ritocco, è necessario.
- **Le venature senza animazione.** Nella tavola, con il movimento ridotto il ciclo si ferma prima del
  primo disegno e le venature non compaiono. Nell’app un fotogramma fermo va disegnato comunque.
- **I nomi dei pacchetti hanno spazi** («Il Relitto Silente_0.1.0_x64-setup.exe»): lo standard di
  distribuzione Runtime li vuole senza. Fase 9, con le icone vere (ora ci sono quelle di Tauri).
- **WSL gira come root** (l’utente predefinito della distribuzione): tutto è installato sotto `/root`.
  GTK stampa avvisi innocui (`gdk_seat_get_keyboard`) che in WSLg non hanno conseguenze.
- **React in sviluppo monta i componenti due volte** (StrictMode): il motore si carica una volta sola
  per pagina, con una promessa condivisa.

## 6. I rischi del §13.2: sì o no

«Sì» vuol dire che il rischio è tolto, «no» che non lo è (non ancora, o non si toglie).

| Rischio | Windows | Linux | Perché |
|---|---|---|---|
| WebKitGTK più lento di Chromium su canvas, WebGL e filtri | **sì** | **no** | in WSLg, senza GPU, 51 fps a 1920×1080; con la GPU sarà meglio, ma va misurato (§7). La fase 3 terrà comunque i livelli di qualità e le venature ferme in memoria |
| Finestra bianca con i driver NVIDIA (DMABUF) | — | **no** | qui non c’è un Linux con NVIDIA. La difesa è pronta: con `/proc/driver/nvidia` l’app spegne il renderer DMABUF da sola; `RELITTO_GRAFICA=compatibile` o `=normale` forzano la scelta |
| Pyodide dentro il protocollo delle risorse di Tauri | **sì** | **sì** | il `.wasm` si carica, la CSP stretta regge, zero errori sulla pagina, nell’eseguibile e nell’AppImage |
| Audio in Rust: latenza e sincronia | **sì** | **no** | Windows: 4,6 ms al primo blocco, nessun buco, zero errori. Linux: in WSLg tiene solo dopo la correzione del §5.2, e WSLg non fa testo; va confermato sulla macchina vera. La sincronia con la musica si prova nella fase 6 |
| Filtri dei verbi che nascondono un comando necessario | **sì** | **sì** | per i pulsanti grezzi del motore: 14 percorsi su 14, 1.291 comandi su 1.294 con la stessa risposta. I filtri dell’app non esistono ancora: la prova vera è nella fase 2, e `collaudo/pulsanti.py` ne è la base |
| Spoiler dei pulsanti | **no** | **no** | non riguarda la fase 1; la prova mostra che senza filtro il problema c’è tutto (§5.3) |
| Eseguibili non firmati (SmartScreen) | **no** | — | certo e non si toglie con il codice: decisione D17 |
| Limiti del motore: FAVELLA 1 è chiuso | **sì** | **sì** | il ponte ha fatto tutto senza toccare il motore né i `.fav` |
| Tempo: animazioni e suono sono le parti lunghe | **no** | **no** | non si toglie con una prova; la fase 1 ha preso una sessione, come previsto |

## 7. La prova su una macchina Linux vera

Serve un computer con Linux installato (non una macchina virtuale) e una scheda grafica vera; meglio
due: una con grafica integrata Intel o AMD e una con **NVIDIA e driver proprietari**. Ubuntu 22.04 o
24.04, oppure Fedora 40 o successiva.

**1. Le dipendenze** (Ubuntu e Debian; su Fedora i nomi sono `webkit2gtk4.1-devel`,
`alsa-lib-devel` e simili):

```bash
sudo apt install build-essential curl wget file pkg-config rsync libwebkit2gtk-4.1-dev libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev libasound2-dev libdbus-1-dev
```

**2. Rust e `tauri-cli`** (una volta sola, una decina di minuti):

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

```bash
cargo install tauri-cli --version "^2" --locked
```

**3. Il progetto.** Copia la cartella del progetto sulla macchina (una chiavetta va bene), con dentro
`app/dist` costruita su Windows (`npm run build` in `app/`). Poi, dalla cartella del progetto:

```bash
bash strumenti/linux/costruisci.sh --senza-node --prova
```

Costruisce in `~/relitto-build`, poi avvia la prova completa: la finestra va a schermo intero, gioca,
suona (un ronzio basso, un fruscio di ventola, trenta bip brevi) e si chiude da sola dopo un minuto e
mezzo. Il rapporto finisce in `app/rapporti` dentro la copia (`~/relitto-build/app/rapporti`).

**4. L’audio sulle due strade:**

```bash
RELITTO_PROVA=audio RELITTO_RAPPORTI=~/rapporti ~/relitto-build/target/release/il-relitto-silente
```

```bash
RELITTO_PROVA=audio RELITTO_AUDIO_HOST=pulseaudio RELITTO_RAPPORTI=~/rapporti ~/relitto-build/target/release/il-relitto-silente
```

**5. Solo sulla macchina con NVIDIA:** la stessa prova completa forzando il renderer che dà problemi.
Se la finestra resta bianca, il rischio è vero e la difesa automatica serve:

```bash
RELITTO_GRAFICA=normale RELITTO_PROVA=esci RELITTO_RAPPORTI=~/rapporti ~/relitto-build/target/release/il-relitto-silente
```

**6. L’AppImage**, su una distribuzione diversa da quella della build, se ce l’hai:

```bash
chmod +x ~/relitto-build/target/release/bundle/appimage/*.AppImage
```

```bash
RELITTO_PROVA=esci RELITTO_RAPPORTI=~/rapporti ~/relitto-build/target/release/bundle/appimage/*.AppImage
```

**Che cosa guardare e ascoltare.** Il testo nitido; le venature che si muovono senza scatti, anche in
fuga; nessun crepitio né buco nell’audio, nemmeno mentre le venature lampeggiano. **Che cosa mandarmi:**
i file JSON della cartella dei rapporti, e due righe su che cosa hai visto e sentito.

## 8. Che cosa passa alla fase 2

- Il ponte cresce dal prototipo: salvataggi con la sequenza e l’impronta, il testo degli eventi per la
  grammatica tipografica, lo stato completo del visore (l’atto, le stanze viste con le uscite note).
  Il prologo, che nell’app sta nell’intro, non va ristampato sulla plancia.
- Il modello d’azione (§6 del 06) in TypeScript, con il collaudo dei finali a soli menu costruito su
  `collaudo/pulsanti.py`.
- L’audio su Linux: tenere il dispositivo fissato; decidere fra ALSA e il protocollo PulseAudio con i
  rapporti della macchina vera.
- La grafica su Linux: i livelli di qualità si decidono con i numeri della macchina vera.
