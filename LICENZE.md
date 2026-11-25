# Come è licenziato «Il Relitto Silente»

> **Nota del 31 ottobre 2026.** La licenza con cui verrà distribuito il gioco 1.0 è ancora in definizione. Le versioni già pubblicate, fino alla 0.2.5-beta.15 e alla demo dell’atto I, restano come dichiarato qui sotto.

Copyright © 2026 Simone Pizzi. Il repository ha **due licenze**, una per il codice e una per il contenuto creativo, scelte dall’autore il 16 ottobre 2026.

## In breve

| Che cosa | Licenza | Che cosa puoi fare |
|---|---|---|
| **Il codice** | [MIT](LICENSE) | tutto, anche venderlo, tenendo l’avviso di copyright |
| **La storia, i testi, le immagini, la musica** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.it) | giocarli, tradurli, rimescolarli e condividerli **citando l’autore**, **senza scopo commerciale**, e **alle stesse condizioni** |

Per citare l’autore: «© 2026 Simone Pizzi — Il Relitto Silente», con un link a questo repository.

## Che cosa sta sotto quale licenza

**MIT (il codice):**

- `app/src/`, `app/src-tauri/` (esclusa la musica e le immagini che l’app porta con sé), `app/scripts/`, `app/prove/`
- `strumenti/`, `collaudo/`, `sviluppo/` (gli strumenti, le prove e le regole di lavoro)
- `motore/`: il motore Favella1, copiato dal repository [Pitz72/FAVELLA1](https://github.com/Pitz72/FAVELLA1), con la sua licenza MIT (`motore/LICENSE`)

Le stringhe dell’interfaccia stanno nel codice e seguono il codice.

**CC BY-NC-SA 4.0 (il contenuto creativo):**

- `relitto-silente/`: la storia e i testi del gioco (i file `.fav`)
- `progettazione/` e `grafica/`: i documenti di progetto
- `app/public/`: le immagini
- `audio/musica-ia/`: la musica e le voci generate, **tranne** quello che è scritto qui sotto in «Che cosa non è coperto»

## Che cosa non è coperto

- **Le dipendenze di terzi** (crate Rust, pacchetti, caratteri, Pyodide) hanno le loro licenze, elencate nella schermata «Riconoscimenti e licenze» del gioco (`strumenti/riconoscimenti.py`) e, per i testi, in `strumenti/licenze/`. I caratteri Sora e Inter sono sotto OFL 1.1.
- **I loghi** di Runtime Multimedia e di Favella1 (`app/src/loghi/`) sono marchi dell’autore e **non sono concessi in licenza**. (Salvo diversa indicazione dell’autore.)
- **La voce di William** (`audio/musica-ia/WI/`) è di **Leonardo Tomassetti**, che l’ha registrata per questo gioco: è dell’attore, **sta fuori dalla licenza libera del gioco** e non si riusa senza il suo consenso.
- **«The Santa Maria Theme»** (`audio/musica-ia/SM/`), il tema dell’intro, è di **Alirio Bruni**: l’ha donato al progetto della Santa Maria, con libertà d’uso per il progetto (l’autore, 11 novembre 2026). Resta suo, non è musica generata, e **sta fuori dalla CC BY-NC-SA** del resto della cartella: chi vuole riusarlo fuori dal gioco lo chiede a lui.
- **I suoni del mondo** (le stanze, le macchine, gli eventi) sono sintetizzati dal codice (`app/src-tauri/src/mondo/`) e seguono la licenza del codice.

## Che cosa è stato fatto con l’intelligenza artificiale

- **La musica** è generata con **Lyria 3.5** (Google Flow Music), con **Suno** e con **ElevenLabs** (il canto del primo contatto e l’inno «Havela»), su indicazione dell’autore; ogni brano è nel registro `audio/musica-ia/REGISTRO.md`, con il modello e la pagina di origine. I brani di Lyria portano la filigrana SynthID; quelli di Suno i loro metadati. Il tema dell’intro non è generato: è di Alirio Bruni (vedi sopra).
- **Le voci**, tranne William: la voce di L.V. e quella di servizio (la tuta, i suggerimenti, il computer di bordo) sono generate con la sintesi vocale di Google (le voci «Elio» e «Kira»); quelle dell’Anziano e delle voci della nave sono disegnate con ElevenLabs; quella di Yusuf è la voce dell’autore, clonata con ElevenLabs. Il registro è in `audio/LICENZE.md`.
- **Alcune immagini** vengono dagli asset del seguito, *Il mistero della Santa Maria*, generati dall’autore con uno strumento di IA (registro in `grafica/LICENZE.md`).
- **Il codice e i documenti** sono stati scritti dall’autore con l’aiuto di Claude (Anthropic); il testo della dichiarazione sull’IA è nel gioco.

L’autore concede in licenza il contenuto generato **per quanto di sua spettanza**: **i Termini d’uso dei servizi che lo hanno generato prevalgono**, e il diritto d’autore su un’opera generata con l’IA non è sempre riconosciuto. Chi vuole usare questi file oltre la licenza deve controllare i Termini attuali di Google (Flow Music, la sintesi vocale), di Suno e di ElevenLabs.

## Il vecchio gioco

Il gioco originale (Electron e React) è stato nella cartella `old_version/` fino al 25 novembre 2026; da allora non sta più nel ramo principale, e resta nella storia del repository con i suoi tag (`v1.2.6`, `v1.5.1`, `v1.5.3`, `old-version-final`). **Non aveva una licenza**: la scelta di questo file vale per il suo codice (MIT) e per i suoi testi e contenuti (CC BY-NC-SA 4.0) dal commit che la introduce in avanti, come quando stava in `old_version/`.

## Il testo completo della licenza dei contenuti

[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.it).
