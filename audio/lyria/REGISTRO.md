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
| `S3/S3-01-glass-horizon.mp3` («Glass Horizon», 0:35) | S3 | 16 ott 2026 | da scrivere | Lyria 3.5 | da scrivere | da scrivere (l’autore non l’ha ancora comunicato) | **«quasi»** (l’autore): 35 s, si può tenere intera o tagliare (anteprima dei primi 18 s in `S3/anteprime/`). Misure: non ha né il sol♯ né il re: il centro è il fa (fa₂ 87,2 Hz, fa₃, fa₄) con il do e il re♯ (77,6 Hz), un accordo di fa con la settima, non l’accordo del clic; −11,6 LUFS, picco reale −0,2 dBFS (il motore lo abbasserà di circa 11 dB); nessun ritmo; finisce in dissolvenza; il re♯₂ sta a un semitono dal re del reattore: sotto il mondo battono insieme a 4 Hz circa | `bbd992fdbbee3df787319d80633e6a1216ee45410be8d706254de79b2237506c` |
| `S4/S4-01-beneath-the-stone-weight.mp3` («Beneath the Stone Weight», 0:56) | S4 | 16 ott 2026 | da scrivere | Lyria 3.5 | da scrivere | da scrivere (l’autore non l’ha ancora comunicato) | **tenuto intero** («bello tutto»; la parte da suonare nel gioco la decido io quando scrivo il lettore). Misure: stessa famiglia di S2 e S3, centro sul fa con il la♯ e il re♯ (fa₂ 87,2 Hz, fa₃, la♯₃, re♯₄) e un re♯ profondissimo a 38 Hz; non c’è il re, né il sol♯ del prompt; −11,9 LUFS; picco reale **+0,7 dBFS** (sopra lo zero nel MP3: nel motore, in virgola mobile, non satura, e comunque lo abbassa di circa 12 dB); nessun ritmo; finisce in dissolvenza | `9f7745ec9fa9e71b2a26f48a3038ef7f927d8cfe9b06e090708a845cb717c49e` |
| `S5/S5-01-below-the-keel.mp3` («Below the Keel», 1:08) | S5 | 16 ott 2026 | da scrivere | Lyria 3.5 | da scrivere | da scrivere (l’autore non l’ha ancora comunicato) | **tenuto** (l’autore: la fine di colpo è quella chiesta). Misure: il suono finisce a **65,06 s** con una caduta di circa un secondo (−14, −21, −42 dB) e poi 2,6 s di silenzio digitale: il lettore si ferma a 65,1 s, il file non si ritocca. Qui c’è il sol♯ del relitto (sol♯₂ 103,6 Hz, la♯₂, re♯₃ che è la sua quinta, fa♯₃, un mi₁ a 41 Hz): è l’unica soglia nel mondo del sol♯ come da prompt; una pulsazione costante di 61 al minuto per tutto il brano (il prompt chiedeva un cuore che accelera: non accelera); −12,2 LUFS, picco reale 0,0 dBFS; nessun ritmo di batteria | `c194a2e56937ced017563d0606157eaba0f0dcd9e1d02a182a628da74a2d71b9` |

Gli originali, intatti, stanno in `M1/originali/`: portano il manifesto C2PA di Google, che una modifica dei tag potrebbe invalidare. I file in `M1/` sono le copie di lavoro, con i tag scritti il 16 ottobre 2026 (titolo originale di Flow Music; artista «Simone Pizzi · Lyria 3.5»; album «Il Relitto Silente — Musica, menu principale»; genere Dark Ambient; commento con la provenienza); la copertina di Flow Music e il manifesto C2PA sono rimasti dentro.
