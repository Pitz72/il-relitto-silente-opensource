# I quadri della plancia per la tavola dell’intro: s_01_b con l'oblò che guarda
# fuori (le viste calcolate dalla prova di look) e il radar sullo schermo verde della console.
import math
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

IMMAGINI = os.environ.get("RELITTO_IMMAGINI", r"C:/Users/Utente/Documents/Claude/Projects/IL MISTERO DELLA SANTA MARIA/assets/assets di gioco/immagini")
PLANCIA = IMMAGINI + "/location/nuove/s_01_b.png"   # la plancia canonica: mai s_01.png
OUT = sys.argv[1] if len(sys.argv) > 1 else "fotogrammi"   # vi stanno oblo.png e faro.png; vi escono C1, C2, D1, H1
CX, CY, R = 1869, 631, 181          # il vetro dell'oblò in s_01_b
SCHERMO = (1746, 890, 1910, 998)     # il vetro dello schermo verde
MONO = "C:/Windows/Fonts/consola.ttf"

base = Image.open(PLANCIA).convert("RGB")
W, H = base.size


def oblo(img, vista, scala=1.0, riflesso=True):
    """Mette la vista (quadrata) nel vetro dell'oblò, con un bordo morbido e un riflesso."""
    v = Image.open(vista).convert("RGB")
    d = int(2 * R * scala)
    lato = min(v.size)
    v = v.crop(((v.width - lato) // 2, (v.height - lato) // 2, (v.width + lato) // 2, (v.height + lato) // 2)).resize((d, d), Image.LANCZOS)
    m = Image.new("L", (d, d), 0)
    ImageDraw.Draw(m).ellipse((2, 2, d - 3, d - 3), fill=255)
    m = m.filter(ImageFilter.GaussianBlur(2.2))
    if riflesso:   # il vetro: un arco di luce fredda in alto a sinistra, appena
        a = np.array(v).astype(np.float32)
        yy, xx = np.mgrid[0:d, 0:d] / d
        arco = np.exp(-((np.hypot(xx - 0.62, yy - 0.70) - 0.62) / 0.05) ** 2) * np.clip((0.6 - xx) / 0.3, 0, 1) * np.clip((0.6 - yy) / 0.3, 0, 1)
        a += arco[..., None] * np.array([20, 26, 30]) * 0.9
        a += (np.hypot(xx - 0.5, yy - 0.5) > 0.40)[..., None] * 0      # (nessun vignettaggio)
        v = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    img.paste(v, (CX - d // 2, CY - d // 2), m)


def radar(img, angolo=0.9, scritte=True):
    """Il radar sullo schermo verde: anelli, il fascio che gira, gli echi; un settore muto."""
    x0, y0, x1, y1 = SCHERMO
    w, h = x1 - x0, y1 - y0
    k = 4                                             # disegno a 4× e poi riduco: bordi morbidi
    s = Image.new("RGB", (w * k, h * k), (4, 16, 8))
    d = ImageDraw.Draw(s)
    cx, cy, rr = w * k * 0.40, h * k * 0.52, h * k * 0.42
    verde = (90, 240, 130)
    for f in (1.0, 0.66, 0.33):
        d.ellipse((cx - rr * f, cy - rr * f, cx + rr * f, cy + rr * f), outline=(30, 90, 50), width=k)
    d.line((cx - rr, cy, cx + rr, cy), fill=(24, 70, 40), width=k)
    d.line((cx, cy - rr, cx, cy + rr), fill=(24, 70, 40), width=k)
    # la scia del fascio
    for i in range(60):
        a = angolo - i * 0.02
        alfa = int(150 * (1 - i / 60) ** 2)
        d.line((cx, cy, cx + math.cos(a) * rr, cy - math.sin(a) * rr), fill=(20, alfa, 40), width=k)
    d.line((cx, cy, cx + math.cos(angolo) * rr, cy - math.sin(angolo) * rr), fill=verde, width=k)
    # gli echi: dappertutto, tranne nel settore della massa (fra 0,15 e 1,15 radianti)
    rng = np.random.default_rng(3)
    for _ in range(26):
        a = rng.uniform(0, 2 * math.pi)
        if 0.15 < a < 1.15:
            continue
        r = rr * rng.uniform(0.2, 0.95)
        dist = (angolo - a) % (2 * math.pi)
        luce = max(0.0, 1 - dist / 2.6)
        if luce <= 0:
            continue
        c = tuple(int(v * luce) for v in verde)
        px, py = cx + math.cos(a) * r, cy - math.sin(a) * r
        d.ellipse((px - 2.2 * k, py - 2.2 * k, px + 2.2 * k, py + 2.2 * k), fill=c)
    # il settore muto: un arco tratteggiato sul bordo, dove l'eco dovrebbe tornare
    d.arc((cx - rr * 1.04, cy - rr * 1.04, cx + rr * 1.04, cy + rr * 1.04), start=-math.degrees(1.15), end=-math.degrees(0.15), fill=(230, 180, 60), width=k)
    if scritte:
        f = ImageFont.truetype(MONO, 7 * k)
        d.text((w * k * 0.80, h * k * 0.14), "CONTATTO", fill=verde, font=f, anchor="mm")
        d.text((w * k * 0.80, h * k * 0.27), "N.ID.", fill=verde, font=f, anchor="mm")
        d.text((w * k * 0.80, h * k * 0.50), "ECO", fill=(150, 200, 160), font=f, anchor="mm")
        d.text((w * k * 0.80, h * k * 0.63), "— —", fill=(230, 180, 60), font=f, anchor="mm")
    s = s.resize((w, h), Image.LANCZOS)
    # il fosforo: un po' di bagliore
    alone = s.filter(ImageFilter.GaussianBlur(3))
    s = Image.fromarray(np.clip(np.array(s).astype(np.float32) + np.array(alone).astype(np.float32) * 0.6, 0, 255).astype(np.uint8))
    img.paste(s, (x0, y0))


def spia_rossa(img, accesa=True):
    """La spia della prossimità, sul bordo dello schermo: lampeggia da un'ora, senza suono."""
    a = np.array(img).astype(np.float32)
    x, y = 1922, 962
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    r = np.hypot(xx - x, yy - y)
    if accesa:
        a += (np.exp(-(r / 3.2) ** 2) * 255 + np.exp(-(r / 14) ** 2) * 60)[..., None] * np.array([1.0, 0.18, 0.12])
    else:
        a += (np.exp(-(r / 3.2) ** 2) * 50)[..., None] * np.array([1.0, 0.2, 0.15])
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def ritaglia(img, x0, y0, x1, y1, larghezza=1920):
    c = img.crop((x0, y0, x1, y1))
    return c.resize((larghezza, round(larghezza * c.height / c.width)), Image.LANCZOS)


def nei_bordi(img, larghezza=1920, altezza=1080):
    """Mette un quadro 2,39:1 nelle bande nere di un 16:9, come nell'intro."""
    tela = Image.new("RGB", (larghezza, altezza), (0, 0, 0))
    h = round(larghezza / 2.39)
    q = img.resize((larghezza, h), Image.LANCZOS)
    tela.paste(q, (0, (altezza - h) // 2))
    return tela


# C1: il radar a fuoco, l'oblò sfocato sopra
c1 = base.copy()
oblo(c1, OUT + "/oblo.png")
radar(c1)
c1 = spia_rossa(c1)
quadro = ritaglia(c1, 1380, 590, 2360, 1000)
sfoca = quadro.filter(ImageFilter.GaussianBlur(9))
maschera = Image.new("L", quadro.size, 0)
ImageDraw.Draw(maschera).rectangle((0, 0, quadro.width, int(quadro.height * 0.55)), fill=255)
maschera = maschera.filter(ImageFilter.GaussianBlur(60))
quadro = Image.composite(sfoca, quadro, maschera)
nei_bordi(quadro).save(OUT + "/C1.png")

# C2: il fuoco è passato all'oblò; il radar, sotto, è sfocato
c2 = base.copy()
oblo(c2, OUT + "/oblo.png")
radar(c2, angolo=2.4)
c2 = spia_rossa(c2, accesa=False)
quadro = ritaglia(c2, 1560, 430, 2180, 690 + 0)
nei_bordi(quadro).save(OUT + "/C2.png")

# D: lo stesso oblò, con il faro di prua acceso che si perde nel nero
d1 = base.copy()
oblo(d1, OUT + "/faro.png")
radar(d1, angolo=4.0)
quadro = ritaglia(d1, 1560, 430, 2180, 690)
nei_bordi(quadro).save(OUT + "/D1.png")

# H1: la plancia intera, il fuso nell'oblò: dove la partita comincia
h1 = base.copy()
oblo(h1, OUT + "/oblo.png")
radar(h1, angolo=5.2)
h1 = spia_rossa(h1)
nei_bordi(h1).save(OUT + "/H1.png")
h1.save(OUT + "/H1-pieno.png")
print("ok")
