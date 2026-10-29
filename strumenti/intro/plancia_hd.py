# La plancia dell'intro a piena risoluzione (09-intro-storyboard.md, §10: «le scene definitive»):
# s_01_b intera, 3120 × 1328, con il vetro dell'oblò bucato. Dietro il buco l'intro disegna dal vivo
# la vista fuori (il motore della scala), e la camera si muove su un'immagine sola: il radar e l'oblò
# di C, il faro di D, l'arretramento di H.
#
#   python strumenti/intro/plancia_hd.py            (scrive in app/public/intro/)
#
# Ne escono:
#   plancia-hd.webp        l'immagine nitida, con il buco: nel buco restano solo l'ombra dello
#                          spessore del vetro, sul bordo, e un riflesso freddo appena visibile
#   plancia-sfocata.webp   la stessa, sfocata e a metà risoluzione: il fondo del cambio di fuoco
import os
import sys
import numpy as np
from PIL import Image, ImageFilter

IMMAGINI = os.environ.get("RELITTO_IMMAGINI", r"C:/Users/Utente/Documents/Claude/Projects/IL MISTERO DELLA SANTA MARIA/assets/assets di gioco/immagini")
PLANCIA = IMMAGINI + "/location/nuove/s_01_b.png"   # la plancia canonica: mai s_01.png
QUI = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(QUI, "..", "..", "app", "public", "intro")
CX, CY, R = 1868.0, 632.0, 183.0   # il vetro dell'oblò, misurato sull'originale (plancia.py: 1869, 631, 181)

base = Image.open(PLANCIA).convert("RGB")
W, H = base.size
rgb = np.asarray(base).astype(np.float32)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
r = np.hypot(xx - CX, yy - CY)

# dentro il vetro: trasparente; sul bordo, l'ombra dello spessore (il tubo dell'oblò), e un arco di
# riflesso freddo in alto a sinistra, come in plancia.py
fuori = np.clip((r - R + 0.75) / 1.5, 0.0, 1.0)            # 1 sull'acciaio, 0 nel vetro, 1,5 px di bordo
ombra = np.clip((r - (R - 26.0)) / 26.0, 0.0, 1.0) ** 2.2 * 0.82
u, v = (xx - (CX - R)) / (2 * R), (yy - (CY - R)) / (2 * R)
arco = np.exp(-((np.hypot(u - 0.62, v - 0.70) - 0.62) / 0.045) ** 2) * np.clip((0.6 - u) / 0.3, 0, 1) * np.clip((0.6 - v) / 0.3, 0, 1)
arco *= (r < R)
alfa_vetro = np.maximum(ombra, arco * 0.10)
colore_vetro = np.where((arco * 0.10 > ombra)[..., None], np.array([200, 214, 228], np.float32), np.array([2, 3, 4], np.float32))
alfa = fuori + (1 - fuori) * alfa_vetro
col = rgb * fuori[..., None] + colore_vetro * (1 - fuori[..., None])
# premoltiplicato no: WebP vuole il colore dritto
rgba = np.dstack([np.clip(col, 0, 255), np.clip(alfa * 255, 0, 255)]).astype(np.uint8)
nitida = Image.fromarray(rgba, "RGBA")
nitida.save(os.path.join(OUT, "plancia-hd.webp"), quality=84, method=6)

# la sfocata: a metà, con un raggio che a piena risoluzione vale circa 9 px
mezza = nitida.resize((W // 2, H // 2), Image.LANCZOS)
# la sfocatura dell'alfa non deve portare nero dentro l'acciaio: si sfoca il colore premoltiplicato
a = np.asarray(mezza).astype(np.float32) / 255.0
pre = Image.fromarray(np.clip(np.dstack([a[..., :3] * a[..., 3:4], a[..., 3:4]]) * 255, 0, 255).astype(np.uint8), "RGBA")
pre = pre.filter(ImageFilter.GaussianBlur(4.5))
p = np.asarray(pre).astype(np.float32) / 255.0
al = np.maximum(p[..., 3:4], 1e-4)
dritta = np.dstack([np.clip(p[..., :3] / al, 0, 1), p[..., 3:4]])
Image.fromarray((dritta * 255).astype(np.uint8), "RGBA").save(os.path.join(OUT, "plancia-sfocata.webp"), quality=80, method=6)

for nome in ("plancia-hd.webp", "plancia-sfocata.webp"):
    f = os.path.join(OUT, nome)
    print(nome, Image.open(f).size, f"{os.path.getsize(f) / 1024:.0f} KB")
