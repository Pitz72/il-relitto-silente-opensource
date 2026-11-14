# ============================================================================
#  Le schematiche della Santa Maria (documento 39), disegnate dalla tabella
#  delle misure (misure.py): tre tavole da 2560 × 1440.
#    1. fuori      i due fianchi, il muso, la poppa
#    2. dentro     la sezione lungo la nave e la pianta del ponte
#    3. sotto      la pianta del livello basso e tre sezioni di traverso
#  Ogni tavola è un foglio solo, in metri, con tutte le viste alla stessa scala
#  (20 punti per metro). Forme grandi e scritte grandi: l'autore vede poco.
#    python strumenti/nave/schematiche.py   -> progettazione/39-schematiche/tavola-N-….png
# ============================================================================
import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, Polygon, Rectangle

sys.path.insert(0, str(Path(__file__).resolve().parent))
import misure as M  # noqa: E402

RADICE = Path(__file__).resolve().parents[2]
CARTELLA = RADICE / "progettazione" / "39-schematiche"
FOGLIO = (128.0, 72.0)  # metri: 2560 × 1440 a 20 punti per metro

FONDO, SCAFO, LINEA, TENUE = "#0a0f1a", "#e6ece9", "#9fb6d9", "#8c98a2"
DENTRO, STANZA, STIVA, MACCHINE, TECNICO, SERVIZIO = "#101826", "#1c2a3d", "#24364f", "#33293a", "#131b28", "#182233"
AMBRA, ARANCIO, GIALLO = "#f2c46d", "#f2803d", "#ffe27a"
K = 1.25  # quanto sono grandi le scritte

COLORI = {"stiva": STIVA, "sala macchine": MACCHINE, "passaggio di servizio": SERVIZIO, "traversa": SERVIZIO}
NOMI = {"aria e acqua": "aria\ne acqua", "cambusa e bagno": "cambusa\ne bagno", "sezione strutturale": "sezione strutturale", "vano cieco": "vano\ncieco",
        "locale tecnico": "locale\ntecnico", "passaggio di servizio": "passaggio di servizio"}
PROPOSTE = ("aria e acqua", "cambusa e bagno", "deposito", "locale tecnico")  # nomi inventati qui: da confermare


class Vista:
    """Una vista sul foglio: porta due coordinate della nave in un punto del foglio."""

    def __init__(self, ax, ox, oy, sx=1.0, s=1.0):
        self.ax, self.ox, self.oy, self.sx, self.s = ax, ox, oy, sx, s

    def p(self, a, b):
        return (self.ox + self.sx * a * self.s, self.oy + b * self.s)

    def poligono(self, punti, **kw):
        self.ax.add_patch(Polygon([self.p(a, b) for a, b in punti], closed=True, **kw))

    def rett(self, a0, a1, b0, b1, **kw):
        self.poligono([(a0, b0), (a1, b0), (a1, b1), (a0, b1)], **kw)

    def linea(self, punti, **kw):
        xs, ys = zip(*[self.p(a, b) for a, b in punti])
        self.ax.plot(xs, ys, **kw)

    def cerchio(self, a, b, r, **kw):
        self.ax.add_patch(Circle(self.p(a, b), r * self.s, **kw))

    def scritta(self, a, b, testo, misura=10, colore=SCAFO, peso="bold", **kw):
        x, y = self.p(a, b)
        self.ax.text(x, y, testo, fontsize=misura * K, color=colore, fontweight=peso, ha=kw.pop("ha", "center"), va=kw.pop("va", "center"), linespacing=1.12, zorder=9, **kw)

    def freccia(self, testo, punto, dove, colore=SCAFO, misura=10, peso="normal", ha="center"):
        self.ax.annotate(testo, xy=self.p(*punto), xytext=self.p(*dove), color=colore, fontsize=misura * K, fontweight=peso, ha=ha, va="center", linespacing=1.12, zorder=9,
                         arrowprops=dict(arrowstyle="-", color=colore, linewidth=1.4, shrinkA=4, shrinkB=1))

    def quota(self, a0, a1, b, testo, verticale=False):
        """Una misura: la linea con le due punte e il numero."""
        da, a = (self.p(b, a0), self.p(b, a1)) if verticale else (self.p(a0, b), self.p(a1, b))
        self.ax.annotate("", xy=da, xytext=a, arrowprops=dict(arrowstyle="<->", color=TENUE, linewidth=1.3))
        if verticale:
            self.scritta(b + 1.5 * self.sx / self.s, (a0 + a1) / 2, testo, 10, TENUE, rotation=90)
        else:
            self.scritta((a0 + a1) / 2, b - 1.1 / self.s, testo, 10, TENUE)


def foglio(titolo, numero, scala="misure in metri · tutte le viste alla stessa scala"):
    fig = plt.figure(figsize=(25.6, 14.4), dpi=100, facecolor=FONDO)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, FOGLIO[0])
    ax.set_ylim(0, FOGLIO[1])
    ax.set_aspect("equal")
    ax.axis("off")
    ax.text(3, 68.2, "LA SANTA MARIA · TSC-1972", color=SCAFO, fontsize=24 * K, fontweight="bold", va="center")
    ax.text(3, 65.1, f"Tavola {numero} di 3 · {titolo}", color=AMBRA, fontsize=15 * K, fontweight="bold", va="center")
    ax.text(125, 68.2, "Schematica · approvata il 13 novembre 2026 · il 14: lanciarpioni, sensori, ormeggi", color=TENUE, fontsize=11 * K, va="center", ha="right")
    ax.text(125, 65.6, scala, color=TENUE, fontsize=11 * K, va="center", ha="right")
    # la scala: dieci metri
    ax.plot([113, 123], [62.6, 62.6], color=TENUE, linewidth=3)
    for x in (113, 118, 123):
        ax.plot([x, x], [62.2, 63.0], color=TENUE, linewidth=1.6)
    ax.text(118, 61.3, "10 metri", color=TENUE, fontsize=10 * K, ha="center", va="center")
    return fig, ax


def titolo_vista(ax, x, y, testo, sotto=""):
    ax.text(x, y, testo, color=SCAFO, fontsize=14 * K, fontweight="bold", va="center")
    if sotto:
        ax.text(x, y - 1.9, sotto, color=TENUE, fontsize=10 * K, va="center")


def profilo_fianco(passo=0.5):
    xs = [i * passo for i in range(int(M.LUNGHEZZA / passo) + 1)]
    return [(x, M.dorso(x)) for x in xs] + [(x, M.chiglia(x)) for x in reversed(xs)]


def profilo_pianta(passo=0.5):
    xs = [i * passo for i in range(int(M.LUNGHEZZA / passo) + 1)]
    return [(x, M.mezza(x)) for x in xs] + [(x, -M.mezza(x)) for x in reversed(xs)]


def traverso(v, x, **kw):
    """La sezione dello scafo nel punto x: un rettangolo dagli spigoli tondi."""
    w, su, giu = M.mezza(x), M.dorso(x), M.chiglia(x)
    r = min(M.RAGGIO, w * 0.8, (su - giu) * 0.4)
    v.ax.add_patch(FancyBboxPatch((v.ox - w * v.s, v.oy + giu * v.s), 2 * w * v.s, (su - giu) * v.s, boxstyle=f"round,pad=0,rounding_size={r * v.s}", **kw))


# ============================================================================
#  Tavola 1: fuori
# ============================================================================
def fianco_fuori(v, lato):
    """Un fianco visto da fuori: lato -1 il sinistro (babordo), +1 il destro (tribordo)."""
    v.poligono(profilo_fianco(), facecolor=DENTRO, edgecolor=SCAFO, linewidth=2.6, zorder=1)
    for x in range(12, 80, 4):  # le giunte del fasciame, appena accennate
        v.linea([(x, M.chiglia(x) + 0.3), (x, M.dorso(x) - 0.3)], color="#1d2838", linewidth=1, zorder=2)
    v.linea([(4.5, 0), (80, 0)], color="#22304a", linewidth=1, linestyle=(0, (2, 4)), zorder=2)
    z0, z1 = M.PANNELLI["z"]
    for x0 in M.PANNELLI["x"]:
        v.rett(x0, x0 + M.PANNELLI["lungo"], z0, z1, facecolor=FONDO, edgecolor=LINEA, linewidth=1.3, hatch="++", zorder=4)
    # sul dorso: il faro, il radar, il collare, l'antenna
    fx0, fx1 = M.FARO["x"]
    v.poligono([(fx0, M.FARO["z"][0]), (fx1, M.FARO["z"][0] + 0.2), (fx1, M.FARO["z"][1] - 0.2), (fx0 - 0.3, M.FARO["z"][1])], facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
    v.linea([(M.RADAR["x"], 7.5), (M.RADAR["x"], M.RADAR["z"])], color=SCAFO, linewidth=2, zorder=5)
    v.linea([(M.RADAR["x"] - 0.8, M.RADAR["z"] + 0.3), (M.RADAR["x"] + 0.8, M.RADAR["z"] - 0.3)], color=SCAFO, linewidth=3.5, zorder=5)
    v.rett(*M.COLLARE["x"], *M.COLLARE["z"], facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
    v.linea([(M.ANTENNA["x"], 7.5), (M.ANTENNA["x"], M.ANTENNA["z"])], color=SCAFO, linewidth=1.6, zorder=5)
    # sotto il muso: il lanciarpioni (il mento, i due tubi che ne escono, i tamburi del cavo)
    lx0, lx1 = M.LANCIARPIONI["x"]
    fondo = M.LANCIARPIONI["z"]
    fine = next(lx0 + i * 0.05 for i in range(200) if M.chiglia(lx0 + i * 0.05) <= fondo)  # dove il mento rientra nello scafo
    v.poligono([(lx0, M.chiglia(lx0)), (lx0, M.ARPIONI["z"] - 0.45), (lx0 + M.LANCIARPIONI["fronte"], fondo), (fine, fondo)], facecolor=DENTRO, edgecolor=SCAFO, linewidth=2.2, zorder=3)
    v.rett(M.ARPIONI["x"][0], lx0, M.ARPIONI["z"] - 0.25, M.ARPIONI["z"] + 0.25, facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
    v.cerchio(M.TAMBURI["x"], M.TAMBURI["z"], M.TAMBURI["diametro"] / 2, facecolor=FONDO, edgecolor=SCAFO, linewidth=1.8, zorder=5)
    # i sensori: la griglia in piedi sul dorso, con il suo puntone, e il pannello sulla guancia del muso
    gx, (gz0, gz1) = M.SENSORI_DORSO["x"], M.SENSORI_DORSO["z"]
    v.linea([(gx, 7.5), (gx, gz0)], color=SCAFO, linewidth=2, zorder=5)
    v.linea([(gx + 1.5, 7.5), (gx, gz1 - 0.3)], color=SCAFO, linewidth=1.4, zorder=5)
    v.rett(gx - 0.14, gx + 0.14, gz0, gz1, facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
    v.rett(*M.SENSORI_PRUA["x"], *M.SENSORI_PRUA["z"], facecolor=FONDO, edgecolor=LINEA, linewidth=1.3, hatch="++", zorder=4)
    r = M.OBLO["diametro"] / 2
    v.linea([(-0.05, M.OBLO["z"] - r), (-0.05, M.OBLO["z"] + r)], color=AMBRA, linewidth=6, solid_capstyle="round", zorder=6)
    # a poppa: gli scarichi, i fanali, la pedana
    d = M.SCARICHI["diametro"] / 2
    v.rett(80, 80.6, M.SCARICHI["z"] - d, M.SCARICHI["z"] + d, facecolor=AMBRA, edgecolor=AMBRA, zorder=5)
    v.cerchio(80.1, M.FANALI_POPPA["z"], 0.32, facecolor=AMBRA, edgecolor=AMBRA, zorder=6)
    v.linea([(80, M.PEDANA_POPPA["z"]), (80 + M.PEDANA_POPPA["sporge"], M.PEDANA_POPPA["z"])], color=SCAFO, linewidth=2.5, zorder=5)
    # la matricola, in basso a prua della stiva
    mx0, mx1 = M.MATRICOLA_FIANCO["x"]
    mz0, mz1 = M.MATRICOLA_FIANCO["z"]
    v.scritta((mx0 + mx1) / 2, (mz0 + mz1) / 2 + 0.35, "TSC-1972", 11.5, TENUE)
    v.scritta((mx0 + mx1) / 2, (mz0 + mz1) / 2 - 0.75, "SANTA MARIA", 7, TENUE)
    if lato < 0:
        cx0, cx1 = M.PORTELLO_DI_CARICO["x"]
        cz0, cz1 = M.PORTELLO_DI_CARICO["z"]
        v.rett(cx0, cx1, cz0, cz1, facecolor="#141d2c", edgecolor=ARANCIO, linewidth=2.6, zorder=4)
        v.linea([((cx0 + cx1) / 2, cz0), ((cx0 + cx1) / 2, cz1)], color=ARANCIO, linewidth=1.2, zorder=5)
        v.cerchio(M.OBLO_CUCCETTA["x"], M.OBLO_CUCCETTA["z"], 0.22, facecolor=AMBRA, edgecolor=AMBRA, zorder=6)
        mezzo = M.ORMEGGI["largo"] / 2  # gli attacchi d'ormeggio: solo su questo fianco
        for x in M.ORMEGGI["x"]:
            for z in M.ORMEGGI["z"]:
                v.rett(x - mezzo, x + mezzo, z - mezzo, z + mezzo, facecolor="#141d2c", edgecolor=SCAFO, linewidth=1.8, zorder=4)
                v.cerchio(x, z, 0.24, facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
    else:
        ux0, ux1 = M.PORTELLO_USCITA["x"]
        v.rett(ux0, ux1, *M.PORTELLO_USCITA["z"], facecolor="#141d2c", edgecolor=ARANCIO, linewidth=2.6, zorder=4)
        v.cerchio(M.LUCE_USCITA["x"], M.LUCE_USCITA["z"], 0.3, facecolor=GIALLO, edgecolor=GIALLO, zorder=6)
        v.rett(*M.RAMPA["x"], -0.25, 0.0, facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
        s = M.STANZE["comunicazioni"]
        v.rett(s[0], s[1], s[4], s[5], facecolor="#141d2c", edgecolor=LINEA, linewidth=1.6, zorder=4)


def tavola_fuori():
    fig, ax = foglio("Fuori: i due fianchi, il muso, la poppa", 1)
    # --- il fianco sinistro (prua a sinistra)
    v = Vista(ax, 8, 43)
    titolo_vista(ax, 3, 59, "IL FIANCO SINISTRO (babordo)", "il portello di carico, l’oblò piccolo della cuccetta")
    fianco_fuori(v, -1)
    v.freccia("l’oblò", (0, 1.9), (-3.5, 6.5), AMBRA, 10.5, "bold")
    v.freccia("il lanciarpioni", (2.2, -2.3), (-1, -6.3), ha="left", peso="bold")
    v.freccia("la griglia dei sensori", (22.3, 10.2), (31.5, 11.7))
    v.freccia("gli attacchi d’ormeggio", (48.6, 0.7), (56, -6.3))
    v.freccia("il faro di prua", (9, 8.4), (5, 11.6))
    v.freccia("il radar", (12.6, 9.0), (11.5, 11.6))
    v.freccia("il collare\ndi presa", (16, 8.2), (17, 11.9))
    v.freccia("l’antenna della radio", (19.1, 10.8), (24, 13.0), ha="left")
    v.freccia("i pannelli solari: quattro per fianco, su staffe corte", (40.6, 6.0), (54, 10.4), LINEA)
    v.freccia("il portello di carico: 8 × 5 m, chiuso", (34, 0.2), (34, -6.3), ARANCIO, 10.5, "bold")
    v.freccia("l’oblò della cuccetta", (8.7, 1.4), (14, -6.3), AMBRA)
    v.freccia("i quattro scarichi", (80.5, -2.4), (72, -6.3), AMBRA, 10.5, "bold")
    v.freccia("i fanali d’ambra", (80.3, 5.8), (77, 10.4), AMBRA)
    v.quota(0, 80, -8.3, "80")
    v.quota(-4.5, 7.5, 84.6, "12", verticale=True)
    # --- il fianco destro (prua a destra)
    v = Vista(ax, 88, 14, -1.0)
    titolo_vista(ax, 3, 30, "IL FIANCO DESTRO (tribordo)", "il portello d’uscita; è il fianco che resta contro il relitto")
    fianco_fuori(v, +1)
    v.freccia("il portello d’uscita, con la luce gialla e la pedana", (73, 2.2), (60, 10.4), ARANCIO, 10.5, "bold")
    v.freccia("il modulo delle comunicazioni", (5, 2.5), (18, 10.4), LINEA)
    v.freccia("la matricola, sui due fianchi", (14.5, -3.2), (26, -6.3))
    v.freccia("i sensori di prua", (6, 4.3), (-2, 12.6))
    # --- il muso e la poppa
    v = Vista(ax, 108.5, 43, -1.0)
    titolo_vista(ax, 97, 59, "IL MUSO")
    traverso(v, 40, facecolor=DENTRO, edgecolor=SCAFO, linewidth=2.6, zorder=1)
    for x in (8, 4):
        traverso(v, x, facecolor=DENTRO, edgecolor="#5a6b7c", linewidth=1.3, zorder=2)
    traverso(v, 0, facecolor="#141d2c", edgecolor=SCAFO, linewidth=2, zorder=3)
    v.cerchio(0, M.OBLO["z"], M.OBLO["diametro"] / 2, facecolor="#3a2c14", edgecolor=AMBRA, linewidth=4, zorder=5)
    mezzo = M.LANCIARPIONI["largo"] / 2  # il mento del lanciarpioni, con i due tubi e i tamburi ai lati
    v.rett(-mezzo, mezzo, M.LANCIARPIONI["z"], M.chiglia(M.LANCIARPIONI["x"][0]) + 0.2, facecolor=DENTRO, edgecolor=SCAFO, linewidth=2, zorder=4)
    for lato in (-1, 1):
        v.rett(lato * mezzo, lato * (mezzo + M.TAMBURI["largo"]), M.TAMBURI["z"] - 0.45, M.TAMBURI["z"] + 0.45, facecolor=SCAFO, edgecolor=SCAFO, zorder=4)
    for y in M.ARPIONI["y"]:
        v.cerchio(y, M.ARPIONI["z"], 0.3, facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
    v.rett(-0.7, 0.7, *M.FARO["z"], facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
    v.freccia("il lanciarpioni", (1.6, -2.2), (-9.5, -5.2))
    s = M.STANZE["comunicazioni"]
    v.rett(s[2], s[3] + 0.3, s[4], s[5], facecolor="none", edgecolor=LINEA, linewidth=1.4, linestyle=(0, (4, 3)), zorder=4)
    lati_fuori(v)
    v.scritta(0, -6.0, "un solo oblò, tondo: 1,1 m", 10.5, AMBRA)
    v.quota(-6.5, 6.5, -8.3, "13")
    v = Vista(ax, 108.5, 14)
    titolo_vista(ax, 97, 30, "LA POPPA")
    traverso(v, 40, facecolor=DENTRO, edgecolor="#5a6b7c", linewidth=1.3, zorder=1)
    traverso(v, 80, facecolor="#141d2c", edgecolor=SCAFO, linewidth=2.6, zorder=2)
    v.scritta(0, 3.9, "TSC-1972", 15)
    v.scritta(0, 2.5, "SANTA MARIA", 9.5)
    for y in M.SCARICHI["y"]:
        v.cerchio(y, M.SCARICHI["z"], M.SCARICHI["diametro"] / 2, facecolor="#3a2c14", edgecolor=AMBRA, linewidth=3, zorder=5)
    for y in M.FANALI_POPPA["y"]:
        v.cerchio(y, M.FANALI_POPPA["z"], 0.32, facecolor=AMBRA, edgecolor=AMBRA, zorder=5)
    v.rett(-5.6, 5.6, M.PEDANA_POPPA["z"] - 0.2, M.PEDANA_POPPA["z"], facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
    v.rett(6.5, 6.5 + M.RAMPA["sporge"], -0.25, 0.0, facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
    lati_fuori(v)
    v.scritta(0, -6.0, "quattro scarichi, in due coppie", 10.5, AMBRA)
    return fig


def lati_fuori(v):
    """I pannelli visti di taglio, la griglia dei sensori, gli attacchi d'ormeggio, e i nomi dei due fianchi."""
    mezzo = M.SENSORI_DORSO["largo"] / 2
    v.rett(-mezzo, mezzo, *M.SENSORI_DORSO["z"], facecolor=FONDO, edgecolor=SCAFO, linewidth=1.4, hatch="++", zorder=2)
    for y in (-mezzo + 0.25, mezzo - 0.25):
        v.linea([(y, 7.4), (y, M.SENSORI_DORSO["z"][0])], color=SCAFO, linewidth=1.6, zorder=2)
    for z in M.ORMEGGI["z"]:
        v.rett(-6.5 - M.ORMEGGI["sporge"], -6.5, z - 0.36, z + 0.36, facecolor=SCAFO, edgecolor=SCAFO, zorder=4)
    z0, z1 = M.PANNELLI["z"]
    for lato in (-1, 1):
        y = lato * (6.5 + M.PANNELLI["staffa"])
        v.rett(y - 0.12, y + 0.12, z0, z1, facecolor=LINEA, edgecolor=LINEA, zorder=4)
        for z in (z0 + 0.6, z1 - 0.6):
            v.linea([(lato * 6.5, z), (y, z)], color=LINEA, linewidth=1.4, zorder=4)
    v.scritta(-9.3, -3.4, "sinistro", 9, TENUE, "normal")
    v.scritta(9.3, -3.4, "destro", 9, TENUE, "normal")


# ============================================================================
#  Tavola 2: dentro
# ============================================================================
def stanza_pianta(v, nome, etichetta=True, misura=8.5):
    x0, x1, y0, y1, _z0, _z1 = M.STANZE[nome]
    v.rett(x0, x1, y0, y1, facecolor=COLORI.get(nome, STANZA), edgecolor=LINEA, linewidth=1.6, zorder=3)
    if etichetta:
        testo = NOMI.get(nome, nome)
        proposta = nome in PROPOSTE
        v.scritta((x0 + x1) / 2, (y0 + y1) / 2, testo, misura, TENUE if proposta else SCAFO, "normal" if proposta else "bold")


def tavola_dentro():
    fig, ax = foglio("Dentro: la sezione lungo la nave e la pianta del ponte", 2)
    # --- la sezione lungo la nave, sul mezzo
    v = Vista(ax, 8, 43)
    titolo_vista(ax, 3, 59, "LA SEZIONE LUNGO LA NAVE", "tagliata nel mezzo, vista dal fianco sinistro: prua a sinistra")
    v.poligono(profilo_fianco(), facecolor=DENTRO, edgecolor=SCAFO, linewidth=2.6, zorder=1)
    sx0, sx1, sz0, sz1 = M.SOTTO_IL_PONTE
    v.poligono([(sx0, sz0), (sx1, sz0), (sx1, sz1), (4.6, sz1), (5.2, -2.6)], facecolor=TECNICO, edgecolor=TENUE, linewidth=1.1, linestyle=(0, (4, 3)), zorder=2)
    v.scritta(27, -2.2, "sotto il ponte: la struttura, i serbatoi, i condotti. Qui corre il re del reattore", 9, TENUE, "normal")
    v.rett(7.2, 20.2, 3.0, 6.6, facecolor=TECNICO, edgecolor=TENUE, linewidth=1.1, linestyle=(0, (4, 3)), zorder=2)
    v.scritta(13.7, 4.8, "serbatoi dell’aria e dell’acqua", 9, TENUE, "normal")
    for nome in ("plancia", "corridoio", "stiva", "sala macchine", "sezione strutturale"):
        x0, x1, _y0, _y1, z0, z1 = M.STANZE[nome]
        v.rett(x0, x1, z0, z1, facecolor=COLORI.get(nome, STANZA), edgecolor=LINEA, linewidth=1.8, zorder=3)
    x0, x1, _y0, _y1, z0, z1 = M.STANZE["uscita"]
    v.rett(x0, x1, z0, z1, facecolor="none", edgecolor=LINEA, linewidth=1.4, linestyle=(0, (5, 3)), zorder=4)
    v.scritta(73.1, 1.3, "uscita", 8.5, LINEA, "normal")
    v.scritta(4.1, 2.9, "PLANCIA", 9)
    v.scritta(4.1, 1.2, "alta 4,2", 8, LINEA, "normal")
    v.scritta(13.6, 1.3, "CORRIDOIO · alto 2,6", 9)
    v.scritta(33.6, 4.2, "STIVA", 20)
    v.scritta(33.6, 2.0, "alta 7 metri", 9.5, LINEA, "normal")
    v.scritta(53.6, 2.3, "SALA MACCHINE", 10.5)
    v.scritta(65.6, -1.6, "sezione strutturale", 8, LINEA, "normal")
    # il braccio su binario, i ganci
    v.linea([(21.2, 6.5), (46, 6.5)], color=LINEA, linewidth=2.2, zorder=5)
    v.linea([(40, 6.5), (40, 5.1)], color=LINEA, linewidth=1.6, zorder=5)
    v.freccia("il binario del braccio, i ganci", (30, 6.5), (33, 10.4), LINEA)
    # il reattore, la botola, la scaletta, il condotto degli scarichi
    rx0, rx1 = M.REATTORE["x"]
    r = M.REATTORE["diametro"] / 2
    px, py = v.p(rx0, M.REATTORE["z"] - r)
    ax.add_patch(FancyBboxPatch((px, py), rx1 - rx0, 2 * r, boxstyle="round,pad=0,rounding_size=1.0", facecolor="#4a3a2c", edgecolor=AMBRA, linewidth=2, zorder=5))
    v.scritta((rx0 + rx1) / 2, M.REATTORE["z"], "il reattore", 9, AMBRA)
    (bx, bz), (lx, lz) = M.SCALETTA
    v.linea([(bx, bz), (lx, lz)], color=AMBRA, linewidth=3, zorder=6)
    v.freccia("la botola e la scaletta", (46.3, -1.2), (40, -6.3), AMBRA, 10.5, "bold")
    v.linea([(60.6, M.SCARICHI["z"]), (80, M.SCARICHI["z"])], color=AMBRA, linewidth=1.4, linestyle=(0, (3, 4)), zorder=4)
    d = M.SCARICHI["diametro"] / 2
    v.rett(80, 80.6, M.SCARICHI["z"] - d, M.SCARICHI["z"] + d, facecolor=AMBRA, edgecolor=AMBRA, zorder=5)
    v.freccia("i condotti dei motori,\nfino agli scarichi", (72, -2.3), (72, -6.6), AMBRA)
    r = M.OBLO["diametro"] / 2
    v.linea([(0.0, M.OBLO["z"] - r), (1.6, M.OBLO["z"] - r)], color=AMBRA, linewidth=1.2, zorder=5)
    v.linea([(0.0, M.OBLO["z"] + r), (1.6, M.OBLO["z"] + r)], color=AMBRA, linewidth=1.2, zorder=5)
    v.linea([(0.6, M.OBLO["z"] - r), (0.6, M.OBLO["z"] + r)], color=AMBRA, linewidth=6, solid_capstyle="round", zorder=6)
    v.freccia("l’oblò, nel muso chiuso", (0.6, 2.4), (-3.5, 9.6), AMBRA, 10.5, "bold", "left")
    for a, b, t in ((1.6, 6.6, "5"), (6.6, 20.6, "14"), (20.6, 46.6, "26"), (46.6, 60.6, "14"), (60.6, 80, "19,4")):
        v.quota(a, b, -8.6, t)
    v.quota(M.BASSO, 0, 84.6, "2,6", verticale=True)
    # --- la pianta del ponte
    v = Vista(ax, 8, 15)
    titolo_vista(ax, 3, 30, "LA PIANTA DEL PONTE", "vista dall’alto: prua a sinistra, il fianco destro in alto")
    v.poligono(profilo_pianta(), facecolor=DENTRO, edgecolor=SCAFO, linewidth=2.6, zorder=1)
    for nome in M.STANZE:
        if nome in ("sezione strutturale", "vano cieco"):
            continue
        stanza_pianta(v, nome, etichetta=nome not in ("stiva", "plancia", "corridoio", "cuccetta", "comunicazioni", "traversa", "uscita", "archivio", "sala macchine", "deposito"))
    v.scritta(4.1, 0, "PLANCIA", 8.5)
    v.scritta(13.6, 0, "CORRIDOIO", 8.5)
    v.scritta(8.7, -3.2, "CUCCETTA", 8, rotation=90)
    v.scritta(13.7, -2.6, "archivio", 8, LINEA, "normal")
    v.scritta(17.45, 3.5, "deposito", 8, TENUE, "normal", rotation=90)
    v.scritta(33.6, 0, "STIVA", 20)
    v.scritta(33.6, -2.4, "26 × 9 metri", 9.5, LINEA, "normal")
    v.scritta(53.6, 0, "SALA MACCHINE", 10)
    v.scritta(53.6, -1.6, "(dall’alto: il pavimento è 2,6 m più giù)", 8, LINEA, "normal")
    v.scritta(73.1, 4.7, "USCITA", 8.5)
    v.freccia("il modulo delle comunicazioni", (4.9, 4.2), (-1, 9.2), LINEA, ha="left")
    v.rett(60.9, 79.4, -5.9, 3.1, facecolor=TECNICO, edgecolor=TENUE, linewidth=1.1, linestyle=(0, (4, 3)), zorder=2)
    v.scritta(70, -1.6, "sopra i condotti dei motori:\nla struttura di poppa", 8.5, TENUE, "normal")
    # le porte, la botola
    for x, y, asse, largo in M.PORTE:
        pezzi = [(x, y - largo / 2), (x, y + largo / 2)] if asse == "y" else [(x - largo / 2, y), (x + largo / 2, y)]
        v.linea(pezzi, color=AMBRA, linewidth=4.5, zorder=6)
    bx0, bx1 = M.BOTOLA["x"]
    by0, by1 = M.BOTOLA["y"]
    v.rett(bx0, bx1, by0, by1, facecolor="none", edgecolor=AMBRA, linewidth=2.4, zorder=6)
    v.scritta(42.4, -1.6, "la botola", 9, AMBRA)
    # le aperture nello scafo
    r = M.OBLO["diametro"] / 2
    v.linea([(0.0, -r), (0.0, r)], color=AMBRA, linewidth=6, solid_capstyle="round", zorder=6)
    v.cerchio(M.OBLO_CUCCETTA["x"], -M.mezza(M.OBLO_CUCCETTA["x"]), 0.3, facecolor=AMBRA, edgecolor=AMBRA, zorder=6)
    v.freccia("l’oblò piccolo della cuccetta", (8.7, -6.2), (-1, -9.6), AMBRA, ha="left")
    cx0, cx1 = M.PORTELLO_DI_CARICO["x"]
    v.linea([(cx0, -6.5), (cx1, -6.5)], color=ARANCIO, linewidth=8, zorder=6)
    v.rett(cx0, cx1, -6.5, -4.5, facecolor="none", edgecolor=ARANCIO, linewidth=1.2, linestyle=(0, (4, 3)), zorder=4)
    v.freccia("il portello di carico", (34, -6.8), (34, -9.6), ARANCIO, 10.5, "bold")
    ux0, ux1 = M.PORTELLO_USCITA["x"]
    v.linea([(ux0, 6.5), (ux1, 6.5)], color=ARANCIO, linewidth=8, zorder=6)
    v.rett(*M.RAMPA["x"], 6.5, 6.5 + M.RAMPA["sporge"], facecolor="none", edgecolor=SCAFO, linewidth=1.6, zorder=5)
    v.freccia("il portello d’uscita e la pedana", (73, 7.9), (62, 9.6), ARANCIO, 10.5, "bold")
    for y in M.SCARICHI["y"]:
        v.rett(80, 80.6, y - 0.55, y + 0.55, facecolor=AMBRA, edgecolor=AMBRA, zorder=5)
    v.scritta(40, 8.2, "FIANCO DESTRO (tribordo)", 9.5, TENUE)
    v.scritta(55, -8.2, "FIANCO SINISTRO (babordo)", 9.5, TENUE)
    v.quota(-6.5, 6.5, 84.6, "13", verticale=True)
    ax.text(3, 2.4, "In grigio, i locali che nessun testo nomina: i nomi sono una proposta.", color=TENUE, fontsize=10 * K, va="center")
    return fig


# ============================================================================
#  Tavola 3: sotto, e di traverso
# ============================================================================
INGRANDITE = 1.6  # le sezioni di traverso sono piccole: si disegnano più grandi


def sezione_traversa(ax, ox, oy, x, titolo, sotto):
    """Una sezione di traverso nel punto x, guardando verso poppa: il fianco sinistro è a destra."""
    v = Vista(ax, ox, oy, -1.0, INGRANDITE)
    titolo_vista(ax, ox - 17, oy + 16.6, titolo, sotto)
    traverso(v, x, facecolor=DENTRO, edgecolor=SCAFO, linewidth=2.6, zorder=1)
    for nome, (x0, x1, y0, y1, z0, z1) in M.STANZE.items():
        if x0 <= x <= x1:
            v.rett(y0, y1, z0, z1, facecolor=COLORI.get(nome, STANZA), edgecolor=LINEA, linewidth=1.6, zorder=3)
    v.scritta(-9.6, -3.9, "fianco\nsinistro", 9, TENUE, "normal")
    v.scritta(9.6, -3.9, "fianco\ndestro", 9, TENUE, "normal")
    return v


def tavola_sotto():
    fig, ax = foglio("Sotto il ponte, e tre sezioni di traverso", 3, "misure in metri · le tre sezioni di traverso sono ingrandite (× 1,6)")
    # --- la pianta del livello basso
    v = Vista(ax, 8, 47.5)
    titolo_vista(ax, 3, 59, "LA PIANTA DEL LIVELLO BASSO", "sotto il pavimento del ponte: prua a sinistra, il fianco destro in alto")
    v.poligono(profilo_pianta(), facecolor=DENTRO, edgecolor=SCAFO, linewidth=2.6, zorder=1)
    sx0, sx1, _sz0, _sz1 = M.SOTTO_IL_PONTE
    v.poligono([(sx0, -5.3), (sx1, -5.3), (sx1, 5.3), (sx0, 5.3)], facecolor=TECNICO, edgecolor=TENUE, linewidth=1.1, linestyle=(0, (4, 3)), zorder=2)
    v.scritta(27.8, 0, "la struttura, i serbatoi, i condotti\n(non è un ponte: ci si arriva dai pannelli del pavimento)", 10, TENUE, "normal")
    x0, x1, y0, y1, _z0, _z1 = M.POZZO
    v.rett(x0, x1, y0, y1, facecolor=MACCHINE, edgecolor=LINEA, linewidth=1.8, zorder=3)
    for nome in ("sezione strutturale", "vano cieco"):
        stanza_pianta(v, nome, misura=8)
    rx0, rx1 = M.REATTORE["x"]
    r = M.REATTORE["diametro"] / 2
    px, py = v.p(rx0, -r)
    ax.add_patch(FancyBboxPatch((px, py), rx1 - rx0, 2 * r, boxstyle="round,pad=0,rounding_size=1.0", facecolor="#4a3a2c", edgecolor=AMBRA, linewidth=2, zorder=5))
    v.scritta((rx0 + rx1) / 2, 0, "il reattore", 9.5, AMBRA)
    for m in M.MOTORI:
        mr = m["diametro"] / 2
        v.rett(m["x"][0], m["x"][1], m["y"] - mr, m["y"] + mr, facecolor="#3f3644", edgecolor=LINEA, linewidth=1.5, zorder=5)
        v.scritta((m["x"][0] + m["x"][1]) / 2, m["y"], "motore", 9, LINEA, "normal")
    for y in M.SCARICHI["y"]:
        v.linea([(60.6, y), (80, y)], color=AMBRA, linewidth=3.2, zorder=4)
        v.rett(80, 80.6, y - 0.55, y + 0.55, facecolor=AMBRA, edgecolor=AMBRA, zorder=5)
    (bx, _bz), (lx, _lz) = M.SCALETTA
    v.rett(46.7, lx, -0.5, 0.5, facecolor="none", edgecolor=AMBRA, linewidth=2.2, zorder=6)
    v.freccia("la scaletta, dalla botola della stiva", (47.1, -0.6), (36, -8.6), AMBRA, 10.5, "bold")
    v.freccia("SALA MACCHINE: il reattore al centro, un motore per lato", (53.6, 5.4), (50, 9.4), SCAFO, 10.5, "bold")
    v.freccia("i condotti dei motori", (70, 4.6), (74, 9.4), AMBRA)
    v.freccia("il vano cieco: non è in nessuna planimetria", (66.1, -2.8), (64, -8.6), LINEA)
    for a, b, t in ((46.6, 60.6, "14"), (60.6, 70.6, "10")):
        v.quota(a, b, -10.6, t)
    # --- tre sezioni di traverso
    v = sezione_traversa(ax, 22, 11, 4.0, "DI TRAVERSO: LA PLANCIA", "a 4 metri dalla prua, guardando verso poppa")
    v.scritta(0, 2.1, "PLANCIA", 10.5)
    v.freccia("le comunicazioni", (3.2, 2.5), (9.8, 6.2), LINEA)
    for y in M.ARPIONI["y"]:
        v.cerchio(y, M.ARPIONI["z"], 0.3, facecolor=SCAFO, edgecolor=SCAFO, zorder=5)
    v.freccia("i tubi degli arpioni", (-1.2, -1.75), (-9.5, -1.4))
    v = sezione_traversa(ax, 64, 11, 34.0, "DI TRAVERSO: LA STIVA", "a 34 metri dalla prua")
    v.scritta(0, 3.8, "STIVA", 20)
    v.scritta(0, 2.0, "9 × 7 metri", 10.5, LINEA, "normal")
    v.scritta(0, -2.1, "sotto il ponte", 9, TENUE, "normal")
    v.rett(-4.0, 4.0, -4.0, -0.3, facecolor=TECNICO, edgecolor=TENUE, linewidth=1.1, linestyle=(0, (4, 3)), zorder=2)
    v.linea([(0, 7.0), (0, 5.4)], color=LINEA, linewidth=1.8, zorder=5)
    v.rett(-0.6, 0.6, 6.5, 6.9, facecolor=LINEA, edgecolor=LINEA, zorder=5)
    cz0, cz1 = M.PORTELLO_DI_CARICO["z"]
    v.linea([(-6.5, cz0), (-6.5, cz1)], color=ARANCIO, linewidth=7, zorder=6)
    v.rett(-6.5, -4.5, cz0, cz1, facecolor="none", edgecolor=ARANCIO, linewidth=1.2, linestyle=(0, (4, 3)), zorder=4)
    v.freccia("il portello\ndi carico", (-6.7, 2.6), (-11.2, 0.6), ARANCIO, 10, "bold")
    v.freccia("il passaggio\ndi servizio", (5.4, 1.2), (11.2, 0.6), LINEA)
    z0, z1 = M.PANNELLI["z"]
    for lato in (-1, 1):
        y = lato * (6.5 + M.PANNELLI["staffa"])
        v.rett(y - 0.12, y + 0.12, z0, z1, facecolor=LINEA, edgecolor=LINEA, zorder=4)
        for z in (z0 + 0.6, z1 - 0.6):
            v.linea([(lato * 6.5, z), (y, z)], color=LINEA, linewidth=1.4, zorder=4)
    v = sezione_traversa(ax, 106, 11, 54.0, "DI TRAVERSO: LA SALA MACCHINE", "a 54 metri dalla prua")
    x0, x1, y0, y1, z0, z1 = M.POZZO
    v.rett(y0, y1, z0, z1, facecolor=MACCHINE, edgecolor=LINEA, linewidth=1.6, zorder=3)
    v.cerchio(M.REATTORE["y"], M.REATTORE["z"], M.REATTORE["diametro"] / 2, facecolor="#4a3a2c", edgecolor=AMBRA, linewidth=2.4, zorder=5)
    for m in M.MOTORI:
        v.cerchio(m["y"], m["z"], m["diametro"] / 2, facecolor="#3f3644", edgecolor=LINEA, linewidth=1.8, zorder=5)
    v.scritta(0, 1.9, "SALA MACCHINE", 11)
    v.freccia("il reattore", (0, -2.3), (0, -6.2), AMBRA, 10, "bold")
    v.freccia("un motore\nper lato", (-3.9, -2.4), (-10.5, -6.0), LINEA)
    v.freccia("il passaggio\ndi servizio", (5.4, 1.2), (11.2, 0.6), LINEA)
    v.quota(M.BASSO, 0, -8.2, "2,6", verticale=True)
    return fig


def main():
    CARTELLA.mkdir(parents=True, exist_ok=True)
    for nome, tavola in (("tavola-1-fuori", tavola_fuori), ("tavola-2-dentro", tavola_dentro), ("tavola-3-sotto", tavola_sotto)):
        fig = tavola()
        fig.savefig(CARTELLA / f"{nome}.png", facecolor=FONDO)
        plt.close(fig)
        print("scritta", CARTELLA / f"{nome}.png")


if __name__ == "__main__":
    main()
