# disegna_logo.py — il logo dell'eseguibile: il fuso e il seme (progettazione/24-copertina-e-logo.md, §3, strada A).
#
# Un fondo d'acciaio freddo; un campo di stelle; una lente nera appuntita (il «fuso», la massa del relitto: la
# forma dove le stelle mancano) che le mangia ai suoi bordi; nel suo centro un solo punto verde, il seme.
# Una sola descrizione geometrica, due uscite: il disegno vettoriale (grafica/logo/relitto.svg) e il master
# 1024 × 1024 (grafica/logo/relitto-1024.png), da cui `tauri icon` ricava tutte le misure dell'app.
#
# Uso (dalla radice del progetto):
#   python strumenti/logo/disegna_logo.py
#   python strumenti/logo/disegna_logo.py --prova      in più, il segno a 16, 32, 48 e 256 px su una tavola
#
# Nessun caso: le stelle vengono da un seme fisso, il disegno è sempre lo stesso.

import argparse
import math
import os
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(os.path.dirname(QUI))
USCITA = os.path.join(RADICE, "grafica", "logo")

L = 1024                         # il lato
RAGGIO_ANGOLI = 228              # gli angoli appena arrotondati, come le targhe
CENTRO = (L / 2, L / 2)
# il fuso: da una punta all'altra, e quanto è alto a metà
PUNTA_SX, PUNTA_DX = 64.0, 960.0
META_ALTEZZA = 104.0             # lungo e stretto: un fuso, non un occhio
ANGOLO = -26.0                   # in diagonale, come la Via Lattea dell'intro: niente simmetria da pupilla
SEME = (143, 240, 162)           # #8BF0A2, il verde del seme
SEME_R = 31.0
FONDO_CENTRO = (44, 60, 72)      # acciaio freddo, un poco più chiaro al centro: il nero del fuso deve leggersi
FONDO_BORDO = (13, 17, 22)
STELLA = (214, 226, 236)
N_STELLE = 120


def fuso():
    """Il contorno del fuso: due archi che si incontrano nelle punte (due curve quadratiche)."""
    cx, cy = CENTRO
    # una quadratica con il controllo a ±2h sta alta h a metà strada
    alto = (PUNTA_SX, cy), (cx, cy - 2 * META_ALTEZZA), (PUNTA_DX, cy)
    basso = (PUNTA_DX, cy), (cx, cy + 2 * META_ALTEZZA), (PUNTA_SX, cy)
    return alto, basso


def curva(p0, p1, p2, n=64):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]) for t in (i / n for i in range(n + 1))]


def ruota(x, y, gradi):
    """Il punto ruotato di `gradi` intorno al centro del quadro."""
    cx, cy = CENTRO
    a = math.radians(gradi)
    return (cx + (x - cx) * math.cos(a) - (y - cy) * math.sin(a), cy + (x - cx) * math.sin(a) + (y - cy) * math.cos(a))


def poligono_fuso():
    alto, basso = fuso()
    return [ruota(x, y, ANGOLO) for x, y in curva(*alto) + curva(*basso)[1:]]


def distanza_dal_fuso(x, y):
    """La distanza (approssimata) di un punto dal contorno del fuso; negativa dentro."""
    cx, cy = CENTRO
    x, y = ruota(x, y, -ANGOLO)          # il fuso è disegnato orizzontale, poi girato
    mezza = (PUNTA_DX - PUNTA_SX) / 2
    u = (x - cx) / mezza
    if abs(u) >= 1:
        return min(math.hypot(x - PUNTA_SX, y - cy), math.hypot(x - PUNTA_DX, y - cy))
    spessore = META_ALTEZZA * (1 - u * u)      # la quadratica: alta h al centro, zero alle punte
    return abs(y - cy) - spessore


def stelle():
    caso = random.Random(1972)
    fuori = []
    while len(fuori) < N_STELLE:
        x, y = caso.uniform(70, L - 70), caso.uniform(70, L - 70)
        # dentro gli angoli arrotondati
        if distanza_dal_fuso(x, y) < 14:
            continue
        r = caso.choice([1.8, 2.2, 2.6, 3.2, 3.8, 5.0]) * (L / 1024)
        luce = caso.uniform(0.35, 1.0)
        d = distanza_dal_fuso(x, y)
        # il fuso mangia le stelle ai suoi bordi: più vicine, più piccole e più spente
        if d < 150:
            k = max(0.0, (d - 14) / 136)
            r *= 0.35 + 0.65 * k
            luce *= 0.25 + 0.75 * k
        fuori.append((x, y, r, luce))
    return fuori


# ----------------------------------------------------------------------------
#  Il disegno vettoriale
# ----------------------------------------------------------------------------
def svg():
    cx, cy = CENTRO
    alto, basso = fuso()
    d = (f"M {alto[0][0]:.1f} {alto[0][1]:.1f} Q {alto[1][0]:.1f} {alto[1][1]:.1f} {alto[2][0]:.1f} {alto[2][1]:.1f} "
         f"Q {basso[1][0]:.1f} {basso[1][1]:.1f} {basso[2][0]:.1f} {basso[2][1]:.1f} Z")
    ss = "\n".join(f'    <circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#d6e2ec" opacity="{luce:.2f}"/>' for x, y, r, luce in stelle())
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {L} {L}" width="{L}" height="{L}" role="img" aria-label="Il Relitto Silente: il fuso nero che mangia le stelle, e un punto verde, il seme">
  <defs>
    <radialGradient id="fondo" cx="50%" cy="50%" r="72%">
      <stop offset="0" stop-color="rgb{FONDO_CENTRO}"/>
      <stop offset="1" stop-color="rgb{FONDO_BORDO}"/>
    </radialGradient>
    <radialGradient id="alone" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="rgb{SEME}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="rgb{SEME}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="quadro"><rect width="{L}" height="{L}" rx="{RAGGIO_ANGOLI}"/></clipPath>
  </defs>
  <g clip-path="url(#quadro)">
    <rect width="{L}" height="{L}" fill="url(#fondo)"/>
{ss}
    <path d="{d}" transform="rotate({ANGOLO} {cx} {cy})" fill="#000000" stroke="#46606c" stroke-opacity="0.55" stroke-width="3"/>
    <circle cx="{cx}" cy="{cy}" r="{SEME_R * 2.6:.0f}" fill="url(#alone)"/>
    <circle cx="{cx}" cy="{cy}" r="{SEME_R}" fill="rgb{SEME}"/>
  </g>
</svg>
"""


# ----------------------------------------------------------------------------
#  Il master in pixel (stessa geometria, resa a quattro volte la misura e poi ridotta)
# ----------------------------------------------------------------------------
def png(lato=L, sovra=4):
    S = lato * sovra
    k = S / L
    cx, cy = CENTRO
    # il fondo: un gradiente radiale, dal centro acciaio al bordo quasi nero
    g = Image.radial_gradient("L").resize((S, S)).point(lambda v: min(255, int(v / 1.44)))
    fondo = Image.composite(Image.new("RGB", (S, S), FONDO_BORDO), Image.new("RGB", (S, S), FONDO_CENTRO), g)
    img = fondo.convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    for x, y, r, luce in stelle():
        d.ellipse([(x - r) * k, (y - r) * k, (x + r) * k, (y + r) * k], fill=STELLA + (int(255 * luce),))
    poli = [(x * k, y * k) for x, y in poligono_fuso()]
    d.polygon(poli, fill=(0, 0, 0, 255))
    d.line(poli + [poli[0]], fill=(70, 96, 108, 140), width=int(3 * k), joint="curve")
    # l'alone del seme e il seme
    alone = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(alone).ellipse([(cx - SEME_R * 2.4) * k, (cy - SEME_R * 2.4) * k, (cx + SEME_R * 2.4) * k, (cy + SEME_R * 2.4) * k], fill=SEME + (150,))
    alone = alone.filter(ImageFilter.GaussianBlur(SEME_R * 1.3 * k))
    img = Image.alpha_composite(img, alone)
    d = ImageDraw.Draw(img, "RGBA")
    d.ellipse([(cx - SEME_R) * k, (cy - SEME_R) * k, (cx + SEME_R) * k, (cy + SEME_R) * k], fill=SEME + (255,))
    # gli angoli arrotondati: fuori, trasparente
    maschera = Image.new("L", (S, S), 0)
    ImageDraw.Draw(maschera).rounded_rectangle([0, 0, S - 1, S - 1], radius=RAGGIO_ANGOLI * k, fill=255)
    img.putalpha(ImageChops.multiply(img.getchannel("A"), maschera))
    return img.resize((lato, lato), Image.LANCZOS)


def tavola(master):
    """Il segno a 16, 32, 48, 64, 128 e 256 px, ingranditi e non, su un fondo chiaro e uno scuro."""
    misure = (16, 32, 48, 64, 128, 256)
    larga = sum(m + 24 for m in misure) + 24
    img = Image.new("RGB", (larga, 2 * 256 + 72), (245, 245, 245))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 256 + 36, larga, 2 * 256 + 72], fill=(18, 20, 24))
    for riga, base in enumerate(((245, 245, 245), (18, 20, 24))):
        x = 24
        for m in misure:
            piccolo = master.resize((m, m), Image.LANCZOS)
            img.paste(piccolo, (x, 18 + riga * (256 + 36) + (256 - m) // 2), piccolo)
            x += m + 24
    return img


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prova", action="store_true")
    a = ap.parse_args()
    os.makedirs(USCITA, exist_ok=True)
    with open(os.path.join(USCITA, "relitto.svg"), "w", encoding="utf-8", newline="\n") as f:
        f.write(svg())
    master = png()
    master.save(os.path.join(USCITA, "relitto-1024.png"))
    print("scritti grafica/logo/relitto.svg e grafica/logo/relitto-1024.png")
    if a.prova:
        tavola(master).save(os.path.join(USCITA, "prova-misure.png"))
        print("scritta grafica/logo/prova-misure.png")


if __name__ == "__main__":
    main()
