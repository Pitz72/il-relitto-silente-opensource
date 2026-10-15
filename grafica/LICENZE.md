# Il registro delle immagini

Ogni immagine che entra nell’app ha una riga qui, prima di essere usata, come i suoni in `audio/LICENZE.md`. La tabella finisce nella schermata «Riconoscimenti e licenze» (`06-app-desktop.md`, §18.3), che la genera `strumenti/riconoscimenti.py`.

## Le regole

1. **Le immagini della Santa Maria vengono dagli asset canonici del sequel**, *Il mistero della Santa Maria*, che sono dell’autore, e si controllano una per una contro il canone del Relitto (06, §17.2): la plancia è `s_01_b`; mai `s_01`, `zoom_s01_teca`, `s_10_b`.
2. **Del relitto non esistono immagini**: lo si disegna in codice (06, §8). Le viste dall’oblò, le stelle e la massa sono rese in codice anche quando stanno dentro un quadro.
3. **Prima di vendere il gioco** si verificano i termini dello strumento con cui sono state generate le immagini del sequel (06, §8; D17).
4. **La copertina e il logo dell’eseguibile**, quando ci saranno, avranno la loro riga qui.

## I file

| File | Che cosa | Da dove | Autore | Licenza |
|---|---|---|---|---|
| `app/public/intro/poppa.webp` | la Santa Maria da poppa, scontornata | lo still canonico della poppa (clip03) del sequel, scontornato con `strumenti/intro/scontorna_poppa.py` | Simone Pizzi | dell’autore |
| `app/public/intro/prua.webp` | la Santa Maria di tre quarti dal davanti, scontornata | lo still canonico di tre quarti (v2) del sequel, scontornato con `strumenti/intro/scontorna_prua.py` | Simone Pizzi | dell’autore |
| `app/public/intro/plancia.webp` | la plancia, con la massa nell’oblò | `s_01_b` del sequel; la vista nell’oblò resa in codice (`strumenti/intro/plancia.py`) | Simone Pizzi | dell’autore |
| `app/public/intro/plancia-radar.webp` | la plancia, con il radar sullo schermo verde | `s_01_b` del sequel; il radar disegnato in codice | Simone Pizzi | dell’autore |
| `app/public/intro/plancia-oblo.webp` | l’oblò della plancia, da vicino | `s_01_b` del sequel; la vista resa in codice | Simone Pizzi | dell’autore |
| `app/public/intro/plancia-faro.webp` | l’oblò con il faro di prua acceso | `s_01_b` del sequel; il faro reso in codice | Simone Pizzi | dell’autore |
| `app/public/intro/lente.webp` | la plancia nella lente del visore | `s_01_b` del sequel, dalla tavola dell’intro | Simone Pizzi | dell’autore |

Tutto il resto che si vede (le stelle, la massa, le venature, la mappa, la cellula dell’aria, l’Anziano fatto di punti) è disegnato in codice dall’app.
