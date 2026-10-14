# Scontorna la Santa Maria dallo still canonico della poppa (clip03).
# Un poligono tracciato a mano (coordinate dell'originale 6336×2688) fa da guida;
# GrabCut decide il bordo in una fascia intorno; un filtro guidato ammorbidisce
# l'alfa sui dettagli fini. Esce un PNG RGBA ritagliato sulla nave.
import os
import sys
import numpy as np
import cv2

SRC = os.environ.get("RELITTO_IMMAGINI", r"C:/Users/Utente/Documents/Claude/Projects/IL MISTERO DELLA SANTA MARIA/assets/assets di gioco/immagini") + r"/nave-esterno/still_clip03_poppa_2026-09-01.png"
OUT = sys.argv[1] if len(sys.argv) > 1 else "santa-maria-poppa.png"
PROVA = sys.argv[2] if len(sys.argv) > 2 else None

def cerchio(cx, cy, r, a0, a1, n):
    return [(cx + r * np.cos(np.radians(a)), cy - r * np.sin(np.radians(a))) for a in np.linspace(a0, a1, n)]

P = []
# la faccia di poppa, dall'angolo in alto a sinistra, verso destra
P += [(1192, 845), (1205, 830), (1355, 812), (1360, 792), (1465, 790), (1470, 806), (1820, 800)]
P += [(1823, 742), (2142, 735), (2148, 790)]                       # la ringhiera
P += [(2185, 770), (2186, 572), (2206, 566), (2210, 762)]          # l'antenna
P += [(2248, 760), (2252, 745), (2335, 745), (2345, 758)]          # il blocco sul tetto
P += [(2352, 745), (2362, 690)]
P += cerchio(2437, 620, 90, 205, 20, 12)                            # la cupola del sensore
P += [(2540, 592), (2604, 606), (2655, 656), (2705, 716), (2752, 755), (2835, 772)]
P += [(2850, 780), (2880, 772), (3092, 778), (3100, 806), (3098, 890)]   # il serbatoio
P += [(3195, 925), (3250, 906), (3318, 900), (3378, 922), (3395, 950), (3435, 998), (3485, 1062)]
P += cerchio(3558, 1147, 78, 100, -30, 8)                           # il tamburo
P += [(3622, 1236), (3645, 1318), (3684, 1300), (3795, 1352), (3830, 1360)]
P += [(3960, 1712), (3880, 1705), (3830, 1680), (3700, 1650), (3660, 1700)]   # i pannelli di destra
P += [(3668, 1850), (3625, 1935), (3500, 1962), (3300, 1983), (3100, 1990), (2900, 1983), (2700, 1962), (2500, 1922), (2380, 1852), (2340, 1765)]
# la piastra a pattino, verso sinistra; poi su per lo smusso della poppa (fra le
# gambe del cavalletto c'è cielo: le gambe sono forme a sé, più sotto)
P += [(2330, 1762), (1000, 1762), (998, 1728), (1170, 1726), (1152, 1660), (1114, 1566), (1101, 1500), (1086, 1480)]
P += [(982, 1478), (980, 1095), (1062, 1092), (1068, 1022), (1085, 1022), (1090, 1092), (1118, 1092)]
P += [(1140, 940), (1160, 900)]
GAMBE = [
    [(1096, 1564), (1109, 1567), (1035, 1728), (1021, 1728)],          # la gamba esterna del cavalletto
    [(1140, 1654), (1149, 1657), (1121, 1727), (1110, 1727)],          # la gamba interna
]

img = cv2.imread(SRC, cv2.IMREAD_COLOR)
H, W = img.shape[:2]
X0, Y0, X1, Y1 = 900, 480, 4040, 2060
reg = img[Y0:Y1, X0:X1].copy()
poli = np.array([[x - X0, y - Y0] for x, y in P], np.int32)
gambe = [np.array([[x - X0, y - Y0] for x, y in g], np.int32) for g in GAMBE]

k = 0.5                                     # GrabCut a metà risoluzione
piccolo = cv2.resize(reg, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
mask = np.zeros(piccolo.shape[:2], np.uint8)
cv2.fillPoly(mask, [np.round(poli * k).astype(np.int32)], 1)
sottili = np.zeros(piccolo.shape[:2], np.uint8)
cv2.fillPoly(sottili, [np.round(g * k).astype(np.int32) for g in gambe], 1)
fascia = 18
dentro = cv2.erode(mask, np.ones((2 * fascia + 1,) * 2, np.uint8))
fuori = cv2.dilate(mask, np.ones((2 * fascia + 1,) * 2, np.uint8))
gc = np.full(mask.shape, cv2.GC_BGD, np.uint8)
gc[fuori == 1] = cv2.GC_PR_BGD
gc[mask == 1] = cv2.GC_PR_FGD
gc[dentro == 1] = cv2.GC_FGD
bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(piccolo, gc, None, bgd, fgd, 6, cv2.GC_INIT_WITH_MASK)
fg = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 1.0, 0.0).astype(np.float32)
fg[sottili == 1] = 1.0                      # le gambe del cavalletto: troppo sottili per GrabCut

# alla risoluzione piena, con un filtro guidato sulla luminanza: segue i bordi veri
fg_full = cv2.resize(fg, (reg.shape[1], reg.shape[0]), interpolation=cv2.INTER_LINEAR)
guida = cv2.cvtColor(reg, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0

def filtro_guidato(I, p, r, eps):
    m = lambda x: cv2.boxFilter(x, -1, (r, r))
    mI, mp = m(I), m(p)
    cov = m(I * p) - mI * mp
    var = m(I * I) - mI * mI
    a = cov / (var + eps)
    b = mp - a * mI
    return m(a) * I + m(b)

alfa = np.clip(filtro_guidato(guida, fg_full, 9, 1e-3), 0, 1)
# fuori dalla fascia larga non c'è nave; dentro il poligono eroso è tutta nave
grande = np.zeros(reg.shape[:2], np.uint8)
cv2.fillPoly(grande, [poli] + gambe, 1)
alfa[cv2.dilate(grande, np.ones((81, 81), np.uint8)) == 0] = 0
nucleo = np.zeros(reg.shape[:2], np.uint8)
cv2.fillPoly(nucleo, [poli], 1)
alfa[cv2.erode(nucleo, np.ones((81, 81), np.uint8)) == 1] = 1
alfa = np.where(alfa < 0.04, 0, np.where(alfa > 0.96, 1, alfa))

# ritaglio stretto sulla nave
ys, xs = np.nonzero(alfa > 0)
y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
rgba = np.dstack([reg[y0:y1, x0:x1], (alfa[y0:y1, x0:x1] * 255).astype(np.uint8)])
cv2.imwrite(OUT, rgba)
print("nave", rgba.shape, "origine nell'originale", (X0 + x0, Y0 + y0))

if PROVA:   # la nave su un fondo magenta, per vedere il bordo
    a = alfa[y0:y1, x0:x1, None]
    fondo = np.zeros_like(reg[y0:y1, x0:x1]); fondo[:] = (180, 40, 200)
    comp = (reg[y0:y1, x0:x1] * a + fondo * (1 - a)).astype(np.uint8)
    cv2.imwrite(PROVA, comp)
