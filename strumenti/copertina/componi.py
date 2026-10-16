# componi.py — le copertine social del gioco, in cinque formati (progettazione/24-copertina-e-logo.md, §4, direzione A:
# «il muro nero»). Tutto in codice, senza strumenti di immagini: il cielo con la Via Lattea, il fuso nero che
# occupa il cielo e mangia le stelle ai suoi bordi, il punto verde del seme nel suo cuore; la Santa Maria
# canonica (app/public/intro/prua.webp) piccola in un angolo; il titolo con i caratteri del gioco.
#
# Uso (dalla radice del progetto):
#   python strumenti/copertina/componi.py                 tutti i formati, in grafica/copertine/
#   python strumenti/copertina/componi.py 16x9 poster     solo questi
#
# Il formato poster porta anche «un gioco di Simone Pizzi» e il marchio di Runtime Multimedia (grafica/logo/runtime-multimedia.png).
# Formati: 16x9 (2752×1536), 21x9 (3440×1440), 9x16 (1440×2560), poster (2400×3600, 2:3), social (1280×640, 2:1: l'anteprima
# del repository). Nessun caso: stelle e grana vengono da semi fissi, ogni volta lo stesso disegno.

import math
import os
import sys
import tempfile

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy.ndimage import gaussian_filter

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(os.path.dirname(QUI))
USCITA = os.path.join(RADICE, "grafica", "copertine")
NAVE = os.path.join(RADICE, "app", "public", "intro", "prua.webp")
FONT = os.path.join(RADICE, "app", "node_modules", "@fontsource-variable")

TITOLO = "IL RELITTO SILENTE"
RIGA = "dal racconto «Il Relitto», in Dal registro della Santa Maria"
CREDITO = "un gioco di Simone Pizzi"
# il marchio ufficiale di Runtime Multimedia (il kit dei loghi dell'autore): «colore» con i suoi colori (di base), «bianco» in monocromo (LOGO_RUNTIME=bianco)
LOGO_RUNTIME = os.path.join(RADICE, "grafica", "logo", "runtime-multimedia-" + os.environ.get("LOGO_RUNTIME", "colore") + ".png")

CIANO = np.array([95, 212, 220]) / 255
SEME = np.array([139, 240, 162]) / 255
ACCIAIO = np.array([70, 96, 108]) / 255
FREDDO = np.array([205, 216, 224]) / 255

# Per ogni formato: la misura, il fuso (due punti e mezza altezza, in frazione), la Santa Maria (angolo in alto a sinistra, larghezza),
# il titolo (centro, altezza delle lettere, allineamento), il seme (frazione lungo il fuso) e l'angolo della Via Lattea.
FORMATI = {
    "16x9": dict(L=2752, A=1536, p0=(0.30, 1.10), p1=(1.12, -0.08), h=0.27, nave=(0.055, 0.60, 0.26), titolo=(0.055, 0.15, 0.062, "sx"),
                 riga=0.020, seme=0.50, via=-28),
    "21x9": dict(L=3440, A=1440, p0=(0.40, 1.12), p1=(1.10, -0.10), h=0.30, nave=(0.050, 0.58, 0.22), titolo=(0.050, 0.15, 0.068, "sx"),
                 riga=0.022, seme=0.50, via=-22),
    "9x16": dict(L=1440, A=2560, p0=(1.14, 0.64), p1=(-0.16, 0.05), h=0.125, nave=(0.08, 0.515, 0.56), titolo=(0.5, 0.755, 0.050, "c"),
                 riga=0.0135, seme=0.46, via=-58),
    "poster": dict(L=2400, A=3600, p0=(1.14, 0.60), p1=(-0.16, 0.03), h=0.115, nave=(0.07, 0.555, 0.50), titolo=(0.5, 0.745, 0.050, "c"),
                   riga=0.0135, seme=0.46, via=-58, credito=True, logo=0.22, cornice=True),
    "social": dict(L=1280, A=640, p0=(0.34, 1.12), p1=(1.12, -0.12), h=0.32, nave=(0.05, 0.60, 0.26), titolo=(0.05, 0.16, 0.085, "sx"),
                   riga=0.026, seme=0.50, via=-28),
}


def caratteri():
    """I due caratteri del gioco, da woff2 variabili a TTF (in una cartella temporanea)."""
    cartella = os.path.join(tempfile.gettempdir(), "relitto-copertine-font")
    os.makedirs(cartella, exist_ok=True)
    out = {}
    for nome, pacchetto, file in (("stencil", "big-shoulders-stencil", "big-shoulders-stencil-latin-wght-normal.woff2"),
                                  ("corsivo", "newsreader", "newsreader-latin-wght-italic.woff2")):
        dest = os.path.join(cartella, nome + ".ttf")
        if not os.path.isfile(dest):
            f = TTFont(os.path.join(FONT, pacchetto, "files", file))
            f.flavor = None
            f.save(dest)
        out[nome] = dest
    return out


def font(percorso, px, peso):
    f = ImageFont.truetype(percorso, int(px))
    try:
        assi = f.get_variation_axes()
        valori = [peso if (a.get("name") in (b"Weight", "Weight") or a.get("name") == "Weight") else a.get("default", a["minimum"]) for a in assi]
        f.set_variation_by_axes(valori)
    except Exception:
        pass
    return f


# ----------------------------------------------------------------------------
#  Il cielo
# ----------------------------------------------------------------------------
def fuso_poligono(p0, p1, h, sovra):
    """Il contorno del fuso: due archi fra i punti p0 e p1 (pixel), alti h a metà."""
    (x0, y0), (x1, y1) = p0, p1
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    dx, dy = x1 - x0, y1 - y0
    lung = math.hypot(dx, dy)
    nx, ny = -dy / lung, dx / lung                      # la normale
    pts = []
    for lato in (1, -1):
        for i in range(0, 241):
            t = i / 240 if lato == 1 else 1 - i / 240
            # una quadratica: alta h a metà strada, zero alle punte
            spess = 4 * t * (1 - t) * h * lato
            pts.append(((x0 + dx * t + nx * spess) * sovra, (y0 + dy * t + ny * spess) * sovra))
    return pts


def cielo(s, caso):
    L, A = s["L"], s["A"]
    px = lambda f, g: (f * L, g * A)
    p0, p1 = px(*s["p0"]), px(*s["p1"])
    h = s["h"] * A
    yy, xx = np.mgrid[0:A, 0:L].astype(np.float32)
    # il fondo: nero azzurro, con un chiarore freddo dalla parte del sole (in alto a sinistra)
    luce = np.clip(1 - np.hypot((xx - 0.05 * L) / (1.1 * L), (yy - 0.0) / (1.1 * A)), 0, 1) ** 2.2
    img = np.zeros((A, L, 3), np.float32)
    img += np.array([4, 7, 11], np.float32)[None, None, :] / 255
    img += luce[..., None] * (np.array([17, 30, 40], np.float32) / 255)[None, None, :]

    # il fuso: la maschera (1 dentro), a doppia risoluzione per i bordi netti
    sovra = 2
    m = Image.new("L", (L * sovra, A * sovra), 0)
    ImageDraw.Draw(m).polygon(fuso_poligono(p0, p1, h, sovra), fill=255)
    maschera = np.asarray(m.resize((L, A), Image.LANCZOS), np.float32) / 255
    vicino = gaussian_filter(maschera, sigma=0.022 * min(L, A) * 1.6)         # quanto si è sotto il fuso: il bordo mangia le stelle

    # la Via Lattea: una banda diagonale di polvere e di stelle minute
    a = math.radians(s["via"])
    u = (xx - L / 2) * math.cos(a) + (yy - A / 2) * math.sin(a)
    v = -(xx - L / 2) * math.sin(a) + (yy - A / 2) * math.cos(a)
    banda = np.exp(-(v / (0.14 * min(L, A))) ** 2)
    nuvole = gaussian_filter(caso.random((A // 8 + 1, L // 8 + 1)).astype(np.float32), 3)
    nuvole = np.asarray(Image.fromarray((nuvole * 255).astype(np.uint8)).resize((L, A), Image.BICUBIC), np.float32) / 255
    nuvole = (nuvole - nuvole.mean()) / (nuvole.std() + 1e-6)
    polvere = np.clip(banda * (0.55 + 0.35 * nuvole), 0, 1)
    img += polvere[..., None] * (np.array([38, 50, 64], np.float32) / 255)[None, None, :] * (1 - vicino[..., None] * 0.9)

    # le stelle: più fitte nella banda, più piccole e più spente vicino al fuso
    n = int(L * A / 520)
    sx, sy = caso.uniform(0, L, n), caso.uniform(0, A, n)
    # una parte segue la banda
    k = caso.random(n)
    vb = (-(sx - L / 2) * math.sin(a) + (sy - A / 2) * math.cos(a))
    tieni = (k < 0.42) | (caso.random(n) < np.exp(-(vb / (0.16 * min(L, A))) ** 2) * 1.25)
    sx, sy = sx[tieni], sy[tieni]
    stelle = np.zeros((A, L), np.float32)
    for x, y in zip(sx, sy):
        ix, iy = int(x), int(y)
        if maschera[iy, ix] > 0.5:
            continue
        mangia = 1 - min(1.0, vicino[iy, ix] * 1.9)
        r = (0.55 + 2.2 * caso.random() ** 4) * (L / 2752) ** 0.6 * (0.35 + 0.65 * mangia)
        luce_s = (0.30 + 0.85 * caso.random() ** 1.6) * mangia
        raggio = int(math.ceil(r * 2.6)) + 1
        x0, x1, y0, y1 = max(0, ix - raggio), min(L, ix + raggio + 1), max(0, iy - raggio), min(A, iy + raggio + 1)
        gx, gy = np.meshgrid(np.arange(x0, x1) - x, np.arange(y0, y1) - y)
        stelle[y0:y1, x0:x1] += luce_s * np.exp(-(gx ** 2 + gy ** 2) / (2 * (r * 0.62) ** 2))
    tinte = np.array([[0.80, 0.88, 1.0], [1.0, 1.0, 1.0], [1.0, 0.92, 0.82]], np.float32)
    img += np.clip(stelle, 0, 1.4)[..., None] * (0.92 * tinte[1] + 0.08 * tinte[0])[None, None, :]

    # il bordo del fuso: un filo di luce fredda dalla parte del sole, e l'alone che si spegne
    bordo = np.clip(gaussian_filter(maschera, 2.2) - maschera, 0, 1)
    verso_sole = np.clip(1.15 - (xx / L + yy / A), 0.15, 1)
    img += bordo[..., None] * verso_sole[..., None] * (ACCIAIO * 1.1)[None, None, :] * 1.3
    img *= (1 - maschera[..., None])                                  # dentro: nero pieno

    # il seme: un punto verde, lontanissimo, nel cuore del fuso
    sx0 = p0[0] + (p1[0] - p0[0]) * s["seme"]
    sy0 = p0[1] + (p1[1] - p0[1]) * s["seme"]
    r = max(2.2, 0.0034 * L)
    d2 = (xx - sx0) ** 2 + (yy - sy0) ** 2
    img += (np.exp(-d2 / (2 * (r * 0.55) ** 2)))[..., None] * SEME[None, None, :]
    img += (0.22 * np.exp(-d2 / (2 * (r * 4.5) ** 2)))[..., None] * SEME[None, None, :]
    return np.clip(img, 0, 1), (sx0, sy0)


# ----------------------------------------------------------------------------
#  La Santa Maria, il titolo, la cornice
# ----------------------------------------------------------------------------
def metti_nave(img, s):
    L, A = s["L"], s["A"]
    nave = Image.open(NAVE).convert("RGBA")
    larghezza = int(s["nave"][2] * L)
    alt = int(nave.height * larghezza / nave.width)
    nave = nave.resize((larghezza, alt), Image.LANCZOS)
    x, y = int(s["nave"][0] * L), int(s["nave"][1] * A)
    a = np.asarray(nave, np.float32) / 255
    rgb, alpha = a[..., :3], a[..., 3:]
    # il sole viene da sinistra in alto: la nave è un poco più fredda e più scura dalla parte opposta
    gradiente = np.linspace(1.0, 0.72, larghezza, dtype=np.float32)[None, :, None]
    rgb = rgb * gradiente * np.array([0.93, 0.97, 1.0], np.float32)[None, None, :]
    zona = img[y:y + alt, x:x + larghezza]
    img[y:y + alt, x:x + larghezza] = zona * (1 - alpha) + rgb * alpha
    return img


def testo_con_spazio(draw, xy, testo, f, riempi, spazio, ancora):
    """Il testo lettera per lettera, con la spaziatura fra le lettere; ancora «sx» o «c»."""
    larg = [draw.textlength(c, font=f) for c in testo]
    totale = sum(larg) + spazio * (len(testo) - 1)
    x = xy[0] - (totale / 2 if ancora == "c" else 0)
    for c, w in zip(testo, larg):
        draw.text((x, xy[1]), c, font=f, fill=riempi, anchor="ls")
        x += w + spazio
    return totale


def metti_testo(img, s):
    L, A = s["L"], s["A"]
    tipi = caratteri()
    pil = Image.fromarray((img * 255).astype(np.uint8)).convert("RGBA")
    strato = Image.new("RGBA", pil.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(strato)
    cx, cy, ah, ancora = s["titolo"]
    px = ah * A
    f = font(tipi["stencil"], px * 1.34, 800)
    base = (int(cx * L), int(cy * A))
    freddo = tuple(int(v * 255) for v in FREDDO) + (255,)
    # il titolo su una riga; se è più largo del quadro si divide in due righe (formati stretti)
    larg_riga = sum(d.textlength(c, font=f) for c in TITOLO) + px * 0.2 * (len(TITOLO) - 1)
    if larg_riga > 0.86 * L:
        parti = ["IL RELITTO", "SILENTE"]
        for i, p in enumerate(parti):
            testo_con_spazio(d, (base[0], base[1] + i * px * 1.18), p, f, freddo, px * 0.17, ancora)
        sotto = base[1] + (len(parti) - 1) * px * 1.18
    else:
        testo_con_spazio(d, base, TITOLO, f, freddo, px * 0.2, ancora)
        sotto = base[1]
    # il filo verde del seme sotto il titolo, e la riga del racconto in corsivo
    fr = font(tipi["corsivo"], s["riga"] * A * 1.02, 400)
    riga_y = sotto + px * 0.78
    larg_t = d.textlength(RIGA, font=fr)
    x = base[0] - (larg_t / 2 if ancora == "c" else 0)
    verde = tuple(int(v * 255) for v in SEME)
    d.line([(x, sotto + px * 0.30), (x + px * 1.1, sotto + px * 0.30)], fill=verde + (255,), width=max(2, int(px * 0.045)))
    d.text((x, riga_y), RIGA, font=fr, fill=tuple(int(v * 255) for v in FREDDO * 0.66) + (255,), anchor="ls")
    if s.get("credito"):
        fc = font(tipi["corsivo"], s["riga"] * A * 1.02, 400)
        d.text((L / 2, A * 0.878), CREDITO, font=fc, fill=tuple(int(v * 255) for v in FREDDO * 0.8) + (255,), anchor="ms")
    if s.get("cornice"):
        m = int(0.035 * L)
        d.rectangle([m, m, L - m, A - m], outline=tuple(int(v * 255) for v in ACCIAIO * 1.1) + (120,), width=max(2, int(L * 0.0016)))
    # un'ombra morbida sotto le lettere, perché si leggano anche sulle stelle
    ombra = strato.filter(ImageFilter.GaussianBlur(px * 0.12))
    nero = Image.new("RGBA", pil.size, (0, 0, 0, 0))
    nero.putalpha(ombra.getchannel("A").point(lambda v: int(v * 0.65)))
    pil = Image.alpha_composite(Image.alpha_composite(pil, nero), strato)
    return np.asarray(pil.convert("RGB"), np.float32) / 255


def metti_logo(img, s):
    """Il marchio di Runtime Multimedia sotto i credits (un PNG con la trasparenza, dal kit dei loghi dell'autore)."""
    L, A = s["L"], s["A"]
    lg = Image.open(LOGO_RUNTIME).convert("RGBA")
    lg = lg.crop(lg.getchannel("A").getbbox())
    larghezza = int(s["logo"] * L)
    lg = lg.resize((larghezza, int(lg.height * larghezza / lg.width)), Image.LANCZOS)
    b = np.asarray(lg, np.float32) / 255
    x, y = int((L - larghezza) / 2), int(0.912 * A)
    zona = img[y:y + b.shape[0], x:x + b.shape[1]]
    img[y:y + b.shape[0], x:x + b.shape[1]] = zona * (1 - b[..., 3:]) + b[..., :3] * b[..., 3:]
    return img


def finitura(img, caso):
    """La vignettatura e una grana finissima, che toglie le bande dai gradienti."""
    A, L = img.shape[:2]
    yy, xx = np.mgrid[0:A, 0:L].astype(np.float32)
    vig = 1 - 0.28 * np.clip(np.hypot((xx - L / 2) / (L * 0.75), (yy - A / 2) / (A * 0.75)) - 0.35, 0, 1) ** 1.6
    img = img * vig[..., None]
    img += (caso.random(img.shape).astype(np.float32) - 0.5) * (2.4 / 255)
    return np.clip(img, 0, 1)


def componi(nome):
    s = FORMATI[nome]
    caso = np.random.default_rng(1972)
    img, seme = cielo(s, caso)
    img = metti_nave(img, s)
    img = metti_testo(img, s)
    if s.get("logo"):
        img = metti_logo(img, s)
    img = finitura(img, caso)
    os.makedirs(USCITA, exist_ok=True)
    percorso = os.path.join(USCITA, f"relitto-{nome}.png")
    Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(percorso, optimize=True)
    print(f"{percorso}  {s['L']}×{s['A']}")


if __name__ == "__main__":
    scelti = sys.argv[1:] or list(FORMATI)
    for n in scelti:
        componi(n)
