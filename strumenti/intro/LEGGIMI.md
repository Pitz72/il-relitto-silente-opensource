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
| `plancia_hd.py` | La plancia delle scene definitive (C, D, H): `s_01_b` intera, 3120 × 1328, con il vetro dell’oblò bucato, l’ombra dello spessore e un riflesso; più la stessa sfocata, per il cambio di fuoco. Scrive `plancia-hd.webp` e `plancia-sfocata.webp` in `app/public/intro/`. | numpy, Pillow |

Uso tipico:

```bash
python strumenti/intro/scontorna_poppa.py sm-poppa.png sm-poppa-prova.png
python strumenti/intro/tempi.py > tempi.json
```

La plancia è sempre `location/nuove/s_01_b.png`: mai `s_01.png`, mai `zoom_s01_teca.png`.

Le immagini dell’intro (`app/public/intro/`): i due still scontornati della nave (`poppa.webp`, `prua.webp`), dalla tavola e dalla prova di look; la plancia a piena risoluzione con l’oblò bucato e la sua versione sfocata (`plancia-hd.webp`, `plancia-sfocata.webp`, da `plancia_hd.py`), su cui la camera di C, D e H si muove; `plancia.webp`, la plancia della lente del gioco, in cui l’intro finisce. I quadri fermi dell’animatic (`plancia-radar`, `plancia-oblo`, `plancia-faro`, `lente`) non servono più dal 29 ottobre 2026: restano nella storia di git e nella tavola.

Le immagini dentro la tavola e la prova di look sono WebP in base64. Per cambiare un testo o una posizione si modifica l’HTML direttamente, con una sostituzione esatta: i file sono grandi e conviene non riscriverli interi.
