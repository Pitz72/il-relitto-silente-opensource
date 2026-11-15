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
| `app/public/intro/plancia-hd.webp` | la plancia dell’intro a piena risoluzione, con il vetro dell’oblò bucato (dietro, la vista fuori la disegna l’intro dal vivo) | `s_01_b` del sequel, intera; il buco e l’ombra del vetro in codice (`strumenti/intro/plancia_hd.py`) | Simone Pizzi | dell’autore |
| `app/public/intro/plancia-sfocata.webp` | la stessa, sfocata: il fondo del cambio di fuoco | `s_01_b` del sequel; la sfocatura in codice (`strumenti/intro/plancia_hd.py`) | Simone Pizzi | dell’autore |
| `app/public/viste/yusuf.webp` | Yusuf al comunicatore del Magazzino Quattro | il ritratto del sequel (`YUSUF_COM`, nella versione del gioco `com-yusuf.webp`) | Simone Pizzi | dell’autore |
| `app/public/viste/cuccetta.webp` | la cuccetta, nella telecamera di bordo | `s_03` del sequel (la cabina), ridotta a 1280 px | Simone Pizzi | dell’autore |
| `app/public/viste/stiva.webp` | la stiva verso poppa: il boccaporto esterno e le tute | `s_10` del sequel, ridotta a 1280 px (non `s_04`, che ha pallet e casse: la stiva del Relitto è vuota da sei settimane, 06 §17) | Simone Pizzi | dell’autore |
| `app/public/viste/sala-macchine.webp` | la sala macchine, nella telecamera di bordo | `s_05` del sequel, ridotta a 1280 px | Simone Pizzi | dell’autore |
| `app/public/viste/scafo.webp` | la telecamera esterna: la Santa Maria davanti alla massa nera, legata dalle funi degli arpioni | composta in codice da `strumenti/viste/scafo.py` con il cielo e la massa di `strumenti/copertina/componi.py` e `app/public/intro/prua.webp`; **nessuna immagine generata da strumenti di IA** | Simone Pizzi | dell’autore |

Tutto il resto che si vede (le stelle, la massa, le venature, la mappa, la cellula dell’aria, l’Anziano fatto di punti, le scansioni delle diciotto stanze del relitto nella lente del visore) è disegnato in codice dall’app.
| `grafica/logo/relitto-1024.png` | il logo dell’eseguibile: il fuso nero che mangia le stelle, con il seme al centro (il master; da qui `tauri icon` ricava le icone dell’app in `app/src-tauri/icons/`) | disegnato in codice da `strumenti/logo/disegna_logo.py` (progettazione/24-copertina-e-logo.md, §3, strada A), su indicazione dell’autore | Simone Pizzi | dell’autore |
| `grafica/logo/relitto.svg` | lo stesso logo, in vettoriale | lo stesso strumento | Simone Pizzi | dell’autore |
| `grafica/copertine/relitto-{9x16,poster,16x9,anteprima,social}{,-en}.png`, `relitto-21x9.png`, `relitto-apertura-{orizzontale,verticale}.png` | le copertine del gioco: il poster (9:16 e 2:3, con i crediti), lo sfondo 16:9, l’anteprima social, quella del repository (2:1), la copertina larga 21:9 e le due aperture del sito della saga, senza scritte, in italiano e in inglese. La scena è quella del poster approvato dall’autore il 15 novembre 2026: il relitto troppo grande per il quadro, la Santa Maria da dietro che gli va incontro, il fascio del faro che lo tocca, il seme sulla stessa linea | composte in codice da `strumenti/copertina/poster.py`, con il cielo e il fuso di `strumenti/copertina/componi.py`, la nave resa dal modello (`grafica/nave/santa-maria-verso-il-relitto.webp`, `strumenti/nave/ritratto.py`) e i caratteri del gioco; **nessuna immagine generata da strumenti di IA** | Simone Pizzi | dell’autore |
| `grafica/nave/santa-maria-verso-il-relitto.webp` (e il suo `.json`, dove cadono il faro e gli scarichi) | la Santa Maria da dietro e dall’alto, su fondo trasparente: la nave del poster e delle copertine | resa in Blender da `strumenti/nave/ritratto.py` (ripresa «verso-il-relitto») sul modello di `strumenti/nave/modello.py` (documento 40); **nessuna immagine generata da strumenti di IA** | Simone Pizzi | dell’autore |
| `grafica/nave/santa-maria-tre-quarti.webp` | la Santa Maria di tre quarti dal davanti, su fondo trasparente: il ritratto per il sito della saga (le immagini con la sola nave nello spazio) | reso in Blender da `strumenti/nave/ritratto.py` sul modello di `strumenti/nave/modello.py` (documento 40); **nessuna immagine generata da strumenti di IA** | Simone Pizzi | dell’autore |
| `grafica/logo/runtime-multimedia-colore.png` e `…-bianco.png` | il marchio ufficiale di Runtime Multimedia (a colori e in bianco, con la trasparenza), per i credits del poster | il kit dei loghi dell’autore (`J:/PODCAST/ASSETS/LOGO 2025/RUNTIME MULTIMEDIA/PNG/`) | Simone Pizzi | dell’autore |

