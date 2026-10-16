# Come è licenziato «Il Relitto Silente»

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
- `motore/`: il motore FAVELLA 1, copiato dal repository [Pitz72/FAVELLA1](https://github.com/Pitz72/FAVELLA1), con la sua licenza MIT (`motore/LICENSE`)
- il codice di `old_version/` (la versione originale, in Electron e React)

Le stringhe dell’interfaccia stanno nel codice e seguono il codice.

**CC BY-NC-SA 4.0 (il contenuto creativo):**

- `relitto-silente/`: la storia e i testi del gioco (i file `.fav`)
- `progettazione/` e `grafica/`: i documenti di progetto
- `app/public/`: le immagini
- `audio/musica-ia/`: la musica
- i testi e i contenuti di `old_version/`

## Che cosa non è coperto

- **Le dipendenze di terzi** (crate Rust, pacchetti, caratteri, Pyodide) hanno le loro licenze, elencate nella schermata «Riconoscimenti e licenze» del gioco (`strumenti/riconoscimenti.py`) e, per i testi, in `strumenti/licenze/`. I caratteri Sora e Inter sono sotto OFL 1.1.
- **I loghi** di Runtime Multimedia e di FAVELLA 1 (`app/src/loghi/`) sono marchi dell’autore e **non sono concessi in licenza**. (Salvo diversa indicazione dell’autore.)
- **I suoni dell’app** sono sintetizzati dal codice (`app/src-tauri/src/mondo/`) e seguono la licenza del codice.

## Che cosa è stato fatto con l’intelligenza artificiale

- **La musica** è generata con **Lyria 3.5** (Google Flow Music) e con **Suno**, su indicazione dell’autore; ogni brano è nel registro `audio/musica-ia/REGISTRO.md`, con il modello e la pagina di origine. I brani di Lyria portano la filigrana SynthID; quelli di Suno i loro metadati.
- **Alcune immagini** sono generate con uno strumento di IA (registro in `grafica/LICENZE.md`).
- **Il codice e i documenti** sono stati scritti dall’autore con l’aiuto di Claude (Anthropic); il testo della dichiarazione sull’IA è nel gioco.

L’autore concede in licenza il contenuto generato **per quanto di sua spettanza**: **i Termini d’uso dei servizi che lo hanno generato prevalgono**, e il diritto d’autore su un’opera generata con l’IA non è sempre riconosciuto. Chi vuole usare questi file oltre la licenza deve controllare i Termini attuali di Google Flow Music e di Suno.

## Il vecchio gioco

`old_version/` è il gioco originale, con tutta la sua storia (tag `v1.2.6`, `v1.5.1`, `v1.5.3`, `old-version-final`). **Non aveva una licenza**: la scelta di questo file vale dal commit che la introduce in avanti, e si applica allo stesso modo al vecchio gioco.

## Il testo completo della licenza dei contenuti

[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.it).
