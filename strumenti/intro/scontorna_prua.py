# Scontorna la Santa Maria dallo still canonico di tre quarti dal davanti (v2).
# Un poligono tracciato a mano (coordinate dell'originale 6336×2688) fa da guida;
# GrabCut decide il bordo in una fascia intorno; un filtro guidato ammorbidisce
# l'alfa sui dettagli fini. Esce un PNG RGBA ritagliato sulla nave.
import os
import sys
import numpy as np
import cv2

SRC = os.environ.get("RELITTO_IMMAGINI", r"C:/Users/Utente/Documents/Claude/Projects/IL MISTERO DELLA SANTA MARIA/assets/assets di gioco/immagini") + r"/nave-esterno/still_3-4_canonico_v2_2026-09-01.png"
OUT = sys.argv[1] if len(sys.argv) > 1 else "santa-maria-prua.png"
PROVA = sys.argv[2] if len(sys.argv) > 2 else None

def cerchio(cx, cy, r, a0, a1, n):
    return [(cx + r * np.cos(np.radians(a)), cy - r * np.sin(np.radians(a))) for a in np.linspace(a0, a1, n)]

P = []
# lo still canonico v2: tre quarti dal davanti, la prua a sinistra
P += [(786, 640), (800, 590), (830, 545), (885, 508), (1060, 492), (1300, 474), (1305, 462), (1365, 462), (1400, 478)]
P += [(1456, 492), (1690, 498), (1700, 440)]
P += cerchio(1752, 392, 48, 200, 20, 8)
P += [(1800, 380), (1862, 398), (1866, 444), (1840, 470), (1885, 470), (1905, 478)]
P += cerchio(1942, 520, 62, 165, 20, 7)
P += [(2010, 528), (2185, 492), (2195, 478), (2255, 480), (2262, 532), (2380, 562), (2510, 558), (2520, 540), (2570, 548), (2580, 600)]
P += [(2650, 662), (2712, 716), (2672, 755), (2930, 815), (2960, 870), (3002, 900), (3008, 1030), (2955, 1048), (2985, 1150), (2905, 1150), (2890, 1085)]
P += [(2650, 1165), (2450, 1195), (2250, 1206), (2050, 1206), (1940, 1146), (1740, 1136), (1620, 1146), (1480, 1108), (1440, 1066)]
P += [(1240, 966), (1060, 876), (940, 806), (820, 706), (790, 670)]
GAMBE = []
img = cv2.imread(SRC, cv2.IMREAD_COLOR)
H, W = img.shape[:2]
X0, Y0, X1, Y1 = 700, 300, 3100, 1300
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
