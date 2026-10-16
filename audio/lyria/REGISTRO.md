# Il registro della musica di Lyria 3.5

Ogni brano che l’autore genera in Google Flow Music (modello Lyria 3.5) ha una riga qui, **con il prompt esatto**. Serve a ritrovare come si è ottenuto un brano e a dire la verità nella dichiarazione sull’IA. Il metodo e i prompt stanno in `progettazione/22-musica-con-lyria.md`.

**I file** stanno accanto a questo registro, in `audio/lyria/<sigla>/`. **Il formato è MP3** (scelta dell’autore, 16 ottobre 2026: «non è un gioco commerciale, possiamo accontentarci»; circa 3,6 MB a brano) e **entra in git**, perché il gioco ne ha bisogno. I formati pesanti (WAV, M4A, FLAC) restano fuori (`.gitignore`). Gli originali scaricati, intatti, stanno in `<sigla>/originali/`.

## Come si compila

Una riga per ogni file che l’autore tiene, in ordine di data. Colonne:

| Colonna | Che cosa si scrive |
|---|---|
| **File** | il nome, es. `M1/M1-02.wav` |
| **Scheda** | la sigla del documento 22 (`M1`, `S2`, `A1`, `C1`, `T`…) |
| **Data** | il giorno della generazione |
| **Piano** | il piano di Flow Music quel giorno (gratuito, Starter, Plus, Member) |
| **Modello** | «Lyria 3.5» (come lo dice Flow Music) |
| **Strada** | A (prompt) o B (con la traccia guida: dire quale file è stato caricato) |
| **Prompt e correzioni** | il prompt incollato, **esatto**, e le frasi dette poi al Producer, in ordine |
| **Esito** | scartato, tenuto, scelto (e perché, in una riga) |
| **Impronta** | lo SHA-256 del file (lo calcolo io quando mi passa i file) |

## I brani

| File | Scheda | Data | Piano | Modello | Strada | Prompt e correzioni | Esito | Impronta (SHA-256 dell’originale) |
|---|---|---|---|---|---|---|---|---|
| `M1/M1-01-bare-resonance.mp3` («Bare Resonance», 2:55) | M1 | 16 ott 2026 | da scrivere | Lyria 3.5 | da scrivere | da scrivere (l’autore non l’ha ancora comunicato) | **tenuto**: «bellissima». Misure: re₂ a 73,2 Hz (−4 cent), con sol₂ e re₃ (una quarta, non il tritono); −16,2 LUFS, picco −1,4 dBFS; comincia piano e finisce in silenzio | `7f4bd1372054a8b1e7992a06c27664257e53be764d1d5a715677eed68a4a512d` |
| `M1/M1-02-resonant-void.mp3` («Resonant Void», 2:40) | M1 | 16 ott 2026 | da scrivere | Lyria 3.5 | da scrivere | da scrivere (l’autore non l’ha ancora comunicato) | **tenuto**: «bellissima». Misure: re₂ a 73,6 Hz (+5 cent), con la₁, la₂, la₃ e re₃ (una quinta); −16,6 LUFS, picco −1,7 dBFS; comincia piano e finisce in silenzio | `02d906e66ce17a2cda587197e374bd3274944e83d7565bb58af487259dd77704` |
| `S2/S2-01-below-the-iron-keel.mp3` («Below the Iron Keel», 0:56) | S2 | 16 ott 2026 | da scrivere | Lyria 3.5 | da scrivere | da scrivere (l’autore non ha ottenuto una durata di 30 secondi) | **da ascoltare**: va tagliata a 15–20 s (anteprima in `S2/anteprime/`). Misure: nessun bordone sul re: sta su re♯ (77,6 e 155,6 Hz), fa, sol♯ (104 Hz) e la♯, cioè nel mondo del sol♯, il relitto; −21 dB RMS all’inizio, poi cresce fino a −13; −11,9 LUFS, picco reale −0,2 dBFS (il più forte finora: il motore lo abbasserà di circa 11 dB); finisce in dissolvenza; ha il manifesto C2PA ma non la copertina | `04f18d72c31e84f71a2804b1eeff393da1943cf7c3167f10b489865ce16f15a4` |

Gli originali, intatti, stanno in `M1/originali/`: portano il manifesto C2PA di Google, che una modifica dei tag potrebbe invalidare. I file in `M1/` sono le copie di lavoro, con i tag scritti il 16 ottobre 2026 (titolo originale di Flow Music; artista «Simone Pizzi · Lyria 3.5»; album «Il Relitto Silente — Musica, menu principale»; genere Dark Ambient; commento con la provenienza); la copertina di Flow Music e il manifesto C2PA sono rimasti dentro.
