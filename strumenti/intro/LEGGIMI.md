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
| `plancia_hd.py` | La plancia delle scene definitive (C, D, H): `s_01_b` intera, 3120 × 1328, con il vetro dell’oblò bucato, l’ombra dello spessore e un riflesso; più la stessa sfocata, per il cambio di fuoco. Scrive `plancia-hd.webp` e `plancia-sfocata.webp` in `app/public/intro/`. | numpy, Pillow |

Uso tipico:

```bash
python strumenti/intro/scontorna_poppa.py sm-poppa.png sm-poppa-prova.png
python strumenti/intro/tempi.py > tempi.json
```

L’intro nell’eseguibile vero, con il suono misurato dal motore e il testo a schermo mentre L.V. parla: `node strumenti/misure/intro_voce.mjs <exe> <cartella delle foto>` (il gioco si apre sullo schermo e va da solo per tre minuti).

La plancia è sempre `location/nuove/s_01_b.png`: mai `s_01.png`, mai `zoom_s01_teca.png`.

Le immagini dell’intro (`app/public/intro/`): i due still scontornati della nave (`poppa.webp`, `prua.webp`), dalla tavola e dalla prova di look; la plancia a piena risoluzione con l’oblò bucato e la sua versione sfocata (`plancia-hd.webp`, `plancia-sfocata.webp`, da `plancia_hd.py`), su cui la camera di C, D e H si muove; `plancia.webp`, la plancia della lente del gioco, in cui l’intro finisce. I quadri fermi dell’animatic (`plancia-radar`, `plancia-oblo`, `plancia-faro`, `lente`) non servono più dal 29 ottobre 2026: restano nella storia di git e nella tavola.

Le immagini dentro la tavola e la prova di look sono WebP in base64. Per cambiare un testo o una posizione si modifica l’HTML direttamente, con una sostituzione esatta: i file sono grandi e conviene non riscriverli interi.
