# ============================================================================
#  Il foglio del modello della Santa Maria (documento 40): le viste rese da
#  modello.py, messe in un'immagine sola da 2560 × 1440 con i nomi scritti
#  grandi (l'autore vede poco). In alto le due viste di tre quarti, quelle
#  dell'intro; sotto i due fianchi.
#    python strumenti/nave/foglio.py NOME "titolo del passo"   -> progettazione/40-modello/NOME.jpg
#  Le viste (progettazione/40-modello/viste/) restano fuori da git: si rifanno con modello.py --viste.
# ============================================================================
import sys
from pathlib import Path

import matplotlib
from PIL import Image, ImageDraw, ImageFont

RADICE = Path(__file__).resolve().parents[2]
CARTELLA = RADICE / "progettazione" / "40-modello"
VISTE = CARTELLA / "viste"
FONDO, CHIARO, AMBRA, TENUE = "#0a0f1a", "#e6ece9", "#f2c46d", "#8c98a2"
CARATTERI = Path(matplotlib.get_data_path()) / "fonts" / "ttf"


def carattere(misura, grassetto=True):
    return ImageFont.truetype(str(CARATTERI / ("DejaVuSans-Bold.ttf" if grassetto else "DejaVuSans.ttf")), misura)


def ritaglio(nome, larga, alta):
    """Una vista, tagliata al centro nella forma che serve e portata alla misura data."""
    im = Image.open(VISTE / f"{nome}.png").convert("RGB")
    w, h = im.size
    taglio = round(w * alta / larga)
    return im.crop((0, (h - taglio) // 2, w, (h + taglio) // 2)).resize((larga, alta), Image.LANCZOS)


def main():
    nome_foglio = sys.argv[1] if len(sys.argv) > 1 else "foglio"
    passo = sys.argv[2] if len(sys.argv) > 2 else "la forma"
    foglio = Image.new("RGB", (2560, 1440), FONDO)
    d = ImageDraw.Draw(foglio)
    d.text((60, 30), "LA SANTA MARIA · TSC-1972", font=carattere(52), fill=CHIARO)
    d.text((60, 96), f"Il modello in Blender · {passo}", font=carattere(34), fill=AMBRA)
    d.text((2500, 52), "costruito dalla stessa tabella delle tavole · 80 × 13 × 12 metri", font=carattere(26, False), fill=TENUE, anchor="ra")
    riquadri = (
        ("1-da-prua-di-tre-quarti", "DA PRUA, DI TRE QUARTI", "il fianco sinistro: il portello di carico", 0, 160, 1280, 720),
        ("2-da-poppa-di-tre-quarti", "DA POPPA, DI TRE QUARTI", "il fianco destro: il portello d’uscita", 1280, 160, 1280, 720),
        ("3-fianco-sinistro", "IL FIANCO SINISTRO", "", 0, 960, 1280, 430),
        ("4-fianco-destro", "IL FIANCO DESTRO", "", 1280, 960, 1280, 430),
    )
    for nome, titolo, sotto, x, y, larga, alta in riquadri:
        foglio.paste(ritaglio(nome, larga, alta), (x, y + 50))
        d.text((x + 60, y + 8), titolo, font=carattere(30), fill=CHIARO)
        if sotto:
            d.text((x + larga - 60, y + 12), sotto, font=carattere(24, False), fill=TENUE, anchor="ra")
    CARTELLA.mkdir(parents=True, exist_ok=True)
    foglio.save(CARTELLA / f"{nome_foglio}.jpg", quality=90)
    print("scritto", CARTELLA / f"{nome_foglio}.jpg")


if __name__ == "__main__":
    main()
