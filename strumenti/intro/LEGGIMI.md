# Strumenti dell’intro

Gli attrezzi con cui sono stati fatti la tavola (`progettazione/09-intro-tavola.html`) e la prova di look (`progettazione/09-prova-di-look.html`). Servono di nuovo quando l’intro si anima davvero.

Le immagini canoniche stanno fuori dal repo, nella cartella degli asset del Mistero della Santa Maria. Gli script la cercano nella variabile `RELITTO_IMMAGINI`; se manca, usano il percorso di questa macchina.

| File | Che cosa fa | Dipendenze |
| --- | --- | --- |
| `tempi.py` | Calcola i tempi dei testi con la regola dell’intro: almeno 0,35 s per parola + 2 s, mai meno di 4 s, entrata 1,2 s, uscita 1,0 s. Stampa un JSON con la durata e la tabella dei blocchi. | Python 3 |
| `scontorna_poppa.py` | Scontorna la Santa Maria dallo still canonico della poppa (clip03): poligono a mano, GrabCut a metà risoluzione, filtro guidato sull’alfa. Le gambe del cavalletto sono forme a sé, troppo sottili per GrabCut. | numpy, opencv-python |
| `scontorna_prua.py` | Lo stesso, dallo still canonico di tre quarti dal davanti (v2). | numpy, opencv-python |
| `cattura.ps1` | Fotografa una pagina WebGL con Edge senza finestra (SwiftShader): `cattura.ps1 <url> <file.png> [larghezza] [altezza]`. Con `?quadro=oblo` o `?quadro=faro` la prova di look dà le viste dall’oblò. | Edge, PowerShell |
| `plancia.py` | Compone i quadri della plancia: la vista nell’oblò di `s_01_b`, il radar sullo schermo verde, la spia della prossimità. `plancia.py <cartella>`: nella cartella devono esserci `oblo.png` e `faro.png`; ne escono `C1`, `C2`, `D1`, `H1`. | numpy, Pillow |
| `voce_lv.py` | La voce di L.V. (documento 09, §13): dal WAV che l’autore ha generato con la sintesi vocale di Google (la voce «Elio», 30 ottobre 2026) alla voce dell’intro, passata da una trasmittente leggera (banda 170 Hz–5,4 kHz dolce, un poco di presenza, il casco, una saturazione e un compressore lenti); scrive `audio/musica-ia/LV/LV-01-la-traccia.mp3` e l’inviluppo `app/src/intro/voce.ts`, e copia la sorgente in `audio/sorgenti/voce/` (fuori da git). Dove sta ogni frase nel file lo dice `VOCE` in `app/src/intro/scaletta.ts`. | numpy, scipy, ffmpeg |
| `trascrivi.py` | La trascrizione di una ripresa della voce, parola per parola con i tempi (faster-whisper large-v3, in locale): dice dove tagliare i pezzi di `VOCE` e trova le indicazioni lette ad alta voce dal modello; sull’intro resa da `rendi_intro` controlla che ci siano tutte le frasi. | faster-whisper |
| `momenti.mjs` | I momenti dell’intro e i pezzi della voce, in JSON, per `cargo run --release --example rendi_intro` (il suono dell’intro reso su file, con il motore del gioco). | Node |
| `fotografa.mjs` | Fotografa l’intro ai secondi dati, a 1920 × 1080, dalla revisione nel browser di sviluppo (`?intro&revisione`, con `npm --prefix app run dev` acceso): `node strumenti/intro/fotografa.mjs <cartella> 71 124.2 …`. Per guardarla scena per scena e mettere accanto il prima e il dopo (documento 09, §14). | Node, Edge |
| `filma.mjs` | Il filmato dell’intro, intero, con il suono: ogni fotogramma preso dalla revisione al suo istante esatto (l’intro si disegna dal tempo, non dall’orologio), a 1920 × 1080 e 30 fotogrammi al secondo, e passato a ffmpeg insieme al WAV di `rendi_intro`: `node strumenti/intro/filma.mjs <filmato.mp4> --suono intro.wav`. Com’è nel gioco di chi non ha toccato le opzioni (con la voce di L.V., senza i sottotitoli dei suoni); `--testi` la filma senza voce, con i testi; `--sottotitoli` aggiunge i sottotitoli dei suoni; `--da`, `--a` per un pezzo solo. Il minuto e il secondo del filmato sono quelli dell’intro. Tre minuti di intro, una dozzina di minuti di lavoro. Limite: nella revisione sotto l’intro non c’è il gioco, e negli ultimi secondi la plancia entra nell’ovale su un fondo nero. | Node, Edge, ffmpeg |
| `costo.mjs` | Quanto costa un fotogramma dello spazio, quadro per quadro, in millisecondi, a 1920 × 1080 e a qualità ridotta: `node strumenti/intro/costo.mjs`. Un confronto fra prima e dopo sulla stessa macchina. | Node, Edge |
| `cdp_edge.mjs` | La parte in comune dei tre: Edge senza finestra, con la scheda video vera, aperto sulla revisione dell’intro. Parla con Edge su un canale suo, senza compressione: quello di Node chiude in silenzio oltre i 4 MB a messaggio, e la foto della plancia sotto la grana li supera (era il motivo per cui le foto oltre il secondo 177 non riuscivano). | Node, Edge |
| `plancia_hd.py` | La plancia delle scene definitive (C, D, H): `s_01_b` intera, 3120 × 1328, con il vetro dell’oblò bucato, l’ombra dello spessore e un riflesso; più la stessa sfocata, per il cambio di fuoco. Scrive `plancia-hd.webp` e `plancia-sfocata.webp` in `app/public/intro/`. | numpy, Pillow |

Uso tipico:

```bash
python strumenti/intro/scontorna_poppa.py sm-poppa.png sm-poppa-prova.png
python strumenti/intro/tempi.py > tempi.json
```

L’intro nell’eseguibile vero, con il suono misurato dal motore e il testo a schermo mentre L.V. parla: `node strumenti/misure/intro_voce.mjs <exe> <cartella delle foto>` (il gioco si apre sullo schermo e va da solo per tre minuti).

La plancia è sempre `location/nuove/s_01_b.png`: mai `s_01.png`, mai `zoom_s01_teca.png`.

Dal 14 novembre 2026 la nave dell’intro è il modello vero (`app/public/intro/nave/`, scritto da `strumenti/nave/modello.py --intro` e `superficie.py`: documento 40); i due still non li usa più l’intro (`prua.webp` serve ancora alla copertina e alle viste dello scafo).

Le immagini dell’intro (`app/public/intro/`): i due still scontornati della nave (`poppa.webp`, `prua.webp`), dalla tavola e dalla prova di look; la plancia a piena risoluzione con l’oblò bucato e la sua versione sfocata (`plancia-hd.webp`, `plancia-sfocata.webp`, da `plancia_hd.py`), su cui la camera di C, D e H si muove; `plancia.webp`, la plancia della lente del gioco, in cui l’intro finisce. I quadri fermi dell’animatic (`plancia-radar`, `plancia-oblo`, `plancia-faro`, `lente`) non servono più dal 29 ottobre 2026: restano nella storia di git e nella tavola.

Le immagini dentro la tavola e la prova di look sono WebP in base64. Per cambiare un testo o una posizione si modifica l’HTML direttamente, con una sostituzione esatta: i file sono grandi e conviene non riscriverli interi.
