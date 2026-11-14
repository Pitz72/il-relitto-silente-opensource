# ============================================================================
#  Il confronto fra la nave di prima (la foto ritagliata) e la nave vera
#  nell'intro (documento 40): quattro fotogrammi dell'intro, presi con
#  strumenti/intro/fotografa.mjs prima e dopo, in un foglio solo da 2560 × 1440
#  con i nomi scritti grandi.
#    node strumenti/intro/fotografa.mjs "<cartella>/prima" 78 101.5      (con la nave di prima)
#    node strumenti/intro/fotografa.mjs "<cartella>/dopo" 78 101.5       (con la nave vera)
#    python strumenti/nave/confronto.py "<cartella>"   -> progettazione/40-modello/foglio-4-la-nave-nell-intro.jpg
#  Con le foto dei reattori (fotografa.mjs "<cartella>/spegnimento" 101.5 102.9 103.9 106) fa anche
#  foglio-5-i-reattori-si-spengono.jpg.
# ============================================================================
import sys
from pathlib import Path

import matplotlib
from PIL import Image, ImageDraw, ImageFont

RADICE = Path(__file__).resolve().parents[2]
FONDO, CHIARO, AMBRA, TENUE = "#0a0f1a", "#e6ece9", "#f2c46d", "#8c98a2"
CARATTERI = Path(matplotlib.get_data_path()) / "fonts" / "ttf"


def carattere(misura, grassetto=True):
    return ImageFont.truetype(str(CARATTERI / ("DejaVuSans-Bold.ttf" if grassetto else "DejaVuSans.ttf")), misura)


def main():
    cartella = Path(sys.argv[1])
    foglio = Image.new("RGB", (2560, 1440), FONDO)
    d = ImageDraw.Draw(foglio)
    d.text((60, 28), "LA SANTA MARIA NELL’INTRO", font=carattere(52), fill=CHIARO)
    d.text((60, 94), "a sinistra com’era: una foto ritagliata · a destra la nave vera, disegnata dal vivo", font=carattere(32), fill=AMBRA)
    # (il fotogramma, il ritaglio che si ingrandisce, il nome della scena)
    righe = (("t078.0", (300, 470, 1100, 830), "LA SCENA CON IL CIELO (ingrandita)"), ("t101.5", (0, 150, 1920, 1014), "LA SCENA DA DIETRO"))
    for r, (nome, taglio, titolo) in enumerate(righe):
        y = 170 + r * 640
        d.text((60, y), titolo, font=carattere(30), fill=CHIARO)
        for c, quando in enumerate(("prima", "dopo")):
            im = Image.open(cartella / quando / f"{nome}.png").convert("RGB").crop(taglio).resize((1250, 562), Image.LANCZOS)
            x = 20 + c * 1270
            foglio.paste(im, (x, y + 50))
            d.text((x + 1230, y + 6), "PRIMA" if c == 0 else "DOPO", font=carattere(28), fill=TENUE if c == 0 else AMBRA, anchor="ra")
    uscita = RADICE / "progettazione" / "40-modello" / "foglio-4-la-nave-nell-intro.jpg"
    foglio.save(uscita, quality=90)
    print("scritto", uscita)
    reattori(cartella)


def reattori(cartella):
    """I reattori che si spengono nella scena da dietro: quattro istanti in fila (se ci sono le foto)."""
    istanti = (("t101.5", "accesi"), ("t102.9", "la fiamma si accorcia"), ("t103.9", "resta la brace"), ("t106.0", "spenti: la nave va per inerzia"))
    if not all((cartella / "spegnimento" / f"{nome}.png").exists() for nome, _ in istanti):
        return
    foglio = Image.new("RGB", (2560, 620), FONDO)
    d = ImageDraw.Draw(foglio)
    d.text((60, 26), "I REATTORI SI SPENGONO", font=carattere(46), fill=CHIARO)
    d.text((2500, 40), "la scena da dietro, i primi cinque secondi · la poppa ingrandita", font=carattere(26, False), fill=TENUE, anchor="ra")
    for k, (nome, scritta) in enumerate(istanti):
        im = Image.open(cartella / "spegnimento" / f"{nome}.png").convert("RGB").crop((300, 420, 1100, 870)).resize((620, 349), Image.LANCZOS)
        x = 20 + k * 632
        foglio.paste(im, (x, 160))
        d.text((x + 10, 112), f"{k + 1}. {scritta}", font=carattere(27), fill=AMBRA)
    uscita = RADICE / "progettazione" / "40-modello" / "foglio-5-i-reattori-si-spengono.jpg"
    foglio.save(uscita, quality=90)
    print("scritto", uscita)


if __name__ == "__main__":
    main()
