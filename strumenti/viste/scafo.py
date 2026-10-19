# scafo.py — la telecamera esterna della Santa Maria, per la lente del visore sullo scafo (revisione 25, E1;
# documento 06, §8: «la telecamera esterna, la sagoma nera dove le stelle mancano: la Santa Maria del sequel più il
# disegno in codice della massa»). Lo stesso cielo, la stessa massa e la stessa Santa Maria canonica delle copertine
# (strumenti/copertina/componi.py), inquadrati da vicino: il muro nero che mangia le stelle, la nave piccola davanti,
# e le due funi degli arpioni tese fra le due. Nessuna immagine generata: tutto in codice, con app/public/intro/prua.webp.
#
# Uso (dalla radice del progetto):
#   python strumenti/viste/scafo.py          scrive app/public/viste/scafo.webp

import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(os.path.dirname(QUI))
sys.path.insert(0, os.path.join(RADICE, "strumenti", "copertina"))
import componi  # noqa: E402

USCITA = os.path.join(RADICE, "app", "public", "viste", "scafo.webp")

# la cornice della lente (circa 2,07 : 1). La Santa Maria canonica guarda a sinistra (non si specchia: la sigla
# TSC-1972 si leggerebbe al contrario), quindi il fuso entra da sinistra e occupa il cielo davanti alla sua prua;
# il seme resta fuori (dalla telecamera di bordo non si vede)
S = dict(L=1280, A=620, p0=(0.70, 1.30), p1=(-0.30, -0.35), h=0.62, nave=(0.50, 0.50, 0.40), seme=-3.0, via=24)


def funi(img, s, da, a_):
    """Le due funi degli arpioni: dalla prua della Santa Maria alla massa, tese, appena illuminate."""
    L, A = s["L"], s["A"]
    sovra = 3
    m = Image.new("L", (L * sovra, A * sovra), 0)
    d = ImageDraw.Draw(m)
    for (x0, y0), (x1, y1) in zip(da, a_):
        d.line([(x0 * L * sovra, y0 * A * sovra), (x1 * L * sovra, y1 * A * sovra)], fill=255, width=int(1.6 * sovra))
    filo = np.asarray(m.resize((L, A), Image.LANCZOS), np.float32) / 255
    # più chiare vicino alla nave, dove arriva la luce gialla del boccaporto
    yy, xx = np.mgrid[0:A, 0:L].astype(np.float32)
    vicino = np.clip(0.15 + (xx - 0.25 * L) / (0.45 * L), 0.25, 1)
    img += filo[..., None] * vicino[..., None] * np.array([0.62, 0.64, 0.66], np.float32)[None, None, :]
    return img


def boccaporto(img, s, xy):
    """La luce gialla del boccaporto aperto, sulla fiancata della nave."""
    L, A = s["L"], s["A"]
    yy, xx = np.mgrid[0:A, 0:L].astype(np.float32)
    d2 = (xx - xy[0] * L) ** 2 + (yy - xy[1] * A) ** 2
    giallo = np.array([1.0, 0.78, 0.38], np.float32)
    img += np.exp(-d2 / (2 * 3.2 ** 2))[..., None] * giallo[None, None, :] * 0.9
    img += 0.16 * np.exp(-d2 / (2 * 26 ** 2))[..., None] * giallo[None, None, :]
    return img


def main():
    caso = np.random.default_rng(1105)
    img, _ = componi.cielo(S, caso)
    img = componi.metti_nave(img, S)
    # le funi partono dalla prua (a sinistra della nave) e finiscono nel nero della massa
    img = funi(img, S, [(0.525, 0.64), (0.535, 0.70)], [(0.24, 0.42), (0.22, 0.58)])
    img = boccaporto(img, S, (0.715, 0.78))
    img = componi.finitura(img, caso)
    # un poco di grana da telecamera: la lente la tratta poi come le altre (seppia, luce al sodio)
    img += (caso.random(img.shape[:2]).astype(np.float32)[..., None] - 0.5) * (6 / 255)
    img = np.clip(gaussian_filter(img, sigma=(0.4, 0.4, 0)), 0, 1)
    os.makedirs(os.path.dirname(USCITA), exist_ok=True)
    Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(USCITA, quality=82, method=6)
    print(f"{os.path.relpath(USCITA, RADICE)}  {S['L']}×{S['A']}")


if __name__ == "__main__":
    main()
