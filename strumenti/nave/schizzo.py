# ============================================================================
#  Lo schizzo della Santa Maria (documento 38): la nave come verrebbe con le
#  proposte del §6, di fianco e dall'alto, più il muso e la poppa. È uno schizzo
#  per decidere, non una schematica: forme grandi, scritte grandi, misure tonde.
#  Le misure stanno tutte qui sotto, in metri: la x va da prua (0) a poppa (80),
#  la y dal fianco sinistro (negativa) al destro (positiva), la z dal pavimento
#  del ponte (0) in su. Con le misure decise, dalla stessa tabella nasceranno le
#  schematiche e il modello.
#    python strumenti/nave/schizzo.py     -> progettazione/38-la-santa-maria-schizzo.png
# ============================================================================
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch, Polygon, Rectangle

RADICE = Path(__file__).resolve().parents[2]
USCITA = RADICE / "progettazione" / "38-la-santa-maria-schizzo.png"

# --- i colori: fondo blu notte, linee chiare, il caldo solo dove la nave si apre o brucia ----------
FONDO, SCAFO, LINEA, TENUE = "#0a0f1a", "#e6ece9", "#9fb6d9", "#8c98a2"
DENTRO, STANZA, STIVA, MACCHINE, TECNICO = "#101826", "#1c2a3d", "#24364f", "#33293a", "#131b28"
AMBRA, ARANCIO = "#f2c46d", "#f2803d"
K = 1.3  # quanto sono grandi le scritte

# --- le misure (metri) -------------------------------------------------------------------------------
L, MEZZA, SU, GIU = 80.0, 6.5, 7.5, -4.5  # la lunghezza, mezza larghezza, il dorso, la chiglia
BASSO = -2.6  # il pavimento della sala macchine, sotto quello del ponte
SCARICHI = (-3.4, -2.0, 2.0, 3.4)  # due coppie, sulla piastra di poppa
# le stanze: nome -> (x da, x a, y da, y a, z da, z a, colore)
STANZE = {
    "plancia": (3, 8, -2, 2, 0, 4.2, STANZA),
    "comunicazioni": (3.6, 7.6, 2, 4.4, 0, 2.6, STANZA),
    "corridoio": (8, 22, -0.9, 0.9, 0, 2.6, STANZA),
    "cuccetta": (8.5, 13.3, -4.6, -0.9, 0, 2.6, STANZA),
    "archivio": (14.3, 17.9, -4.6, -0.9, 0, 2.6, STANZA),
    "stiva": (22, 48, -4.5, 4.5, 0, 7, STIVA),
    "sala macchine": (48, 62, -4.4, 4.4, BASSO, 3.6, MACCHINE),
    "sezione strutturale": (62, 72, -1, 1, 0, 2.2, STANZA),
    "vano cieco": (65, 68, -4, -1, 0, 2.0, STANZA),
    "uscita": (71, 76, 3.4, 6.2, 0, 2.6, STANZA),
}


def profilo_fianco():
    """Lo scafo visto di fianco: il muso chiuso, il dorso, la piastra di poppa, la chiglia."""
    return [(0, 1.6), (0.6, 3.4), (2.5, 5.2), (6, 6.6), (11, SU), (77, SU), (L, 6.6), (L, -3.6), (77.5, GIU), (9, GIU), (4, -3.0), (1.2, -0.8)]


def profilo_pianta():
    """Lo scafo visto dall'alto: il muso tondo, i fianchi dritti, la poppa piatta."""
    meta = [(0, 0), (0.5, 1.6), (2.5, 3.6), (6, 5.4), (11, MEZZA), (L, MEZZA)]
    return meta + [(x, -y) for x, y in reversed(meta[1:])]


def scritta(ax, x, y, testo, misura=12, colore=SCAFO, peso="bold", **kw):
    ax.text(x, y, testo, fontsize=misura * K, color=colore, fontweight=peso, ha=kw.pop("ha", "center"), va=kw.pop("va", "center"), linespacing=1.15, zorder=9, **kw)


def freccia(ax, testo, punto, dove, colore=SCAFO, misura=11, peso="normal", ha="center"):
    ax.annotate(testo, xy=punto, xytext=dove, color=colore, fontsize=misura * K, fontweight=peso, ha=ha, va="center", linespacing=1.15,
                arrowprops=dict(arrowstyle="-", color=colore, linewidth=1.5, shrinkA=4, shrinkB=2))


def prepara(ax, titolo):
    ax.set_facecolor(FONDO)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title(titolo, color=SCAFO, fontsize=17 * K, fontweight="bold", loc="left", pad=6)


def stanza(ax, nome, piano, **kw):
    x0, x1, y0, y1, z0, z1, col = STANZE[nome]
    a0, a1 = (y0, y1) if piano == "pianta" else (z0, z1)
    ax.add_patch(Rectangle((x0, a0), x1 - x0, a1 - a0, facecolor=col, edgecolor=LINEA, linewidth=1.8, zorder=3, **kw))


def estremi(ax):
    scritta(ax, -4.8, 0.8, "PRUA", 13, TENUE, rotation=90)
    scritta(ax, 88.8, 0.8, "POPPA", 13, TENUE, rotation=90)


def fianco(ax):
    prepara(ax, "DI FIANCO")
    ax.add_patch(Polygon(profilo_fianco(), closed=True, facecolor=DENTRO, edgecolor=SCAFO, linewidth=3, zorder=1))
    # lo spazio tecnico sotto il ponte
    ax.add_patch(Polygon([(9.5, GIU + 0.5), (48, GIU + 0.5), (48, 0), (3.5, 0), (4.6, -2.6)], closed=True, facecolor=TECNICO, edgecolor=TENUE, linewidth=1.2, linestyle=(0, (4, 3)), zorder=2))
    scritta(ax, 26.5, -2.0, "sotto il ponte: la struttura e i condotti.\nIl reattore si sente da qui, in ogni stanza", 10.5, TENUE, "normal")
    for nome in ("plancia", "corridoio", "stiva", "sala macchine", "sezione strutturale"):
        stanza(ax, nome, "fianco")
    stanza(ax, "uscita", "fianco", linestyle=(0, (5, 3)))
    scritta(ax, 5.5, 2.3, "PLANCIA", 10)
    scritta(ax, 15, 1.3, "CORRIDOIO · 14 m", 10.5)
    scritta(ax, 41, 4.9, "STIVA", 22)
    scritta(ax, 41, 2.3, "26 × 9 metri, alta 7\ni ganci e il braccio al soffitto", 10.5, LINEA, "normal")
    scritta(ax, 55, 2.6, "SALA MACCHINE", 11.5)
    scritta(ax, 55, -0.1, "il pavimento è più in basso:\nil reattore al centro,\ni due motori ai lati", 10, LINEA, "normal")
    scritta(ax, 67, 1.1, "sez. strutturale", 9.5, LINEA, "normal")
    scritta(ax, 73.5, 1.3, "USCITA", 9.5)
    # il portello di carico, sul fianco
    ax.add_patch(Rectangle((24, 0.4), 9, 5.2, facecolor="none", edgecolor=ARANCIO, linewidth=2.4, linestyle=(0, (6, 3)), zorder=7))
    scritta(ax, 28.5, 3.0, "portello\ndi carico\n(fianco sinistro)", 9.5, ARANCIO, "normal")
    # la botola e la scaletta, dal fondo della stiva
    ax.plot([46.6, 49.4], [0, BASSO], color=AMBRA, linewidth=3.2, zorder=5)
    for k in range(1, 6):
        ax.plot([46.6 + k * 0.47 - 0.35, 46.6 + k * 0.47 + 0.35], [-k * 0.43, -k * 0.43], color=AMBRA, linewidth=1.8, zorder=5)
    freccia(ax, "la botola e la scaletta", (47.8, -1.3), (40, -6.9), AMBRA, 11.5, "bold")
    # l'oblò, il faro, gli arpioni
    ax.plot([1.35, 2.05], [1.25, 2.95], color=AMBRA, linewidth=7, solid_capstyle="round", zorder=6)
    freccia(ax, "L'OBLÒ: uno solo, tondo", (1.6, 2.3), (-3.5, 10.9), AMBRA, 12, "bold", "left")
    ax.add_patch(Polygon([(7.5, 6.9), (9.6, 7.2), (9.6, 8.5), (7.3, 8.3)], closed=True, facecolor=SCAFO, edgecolor=SCAFO, zorder=6))
    freccia(ax, "il faro di prua", (8.5, 8.5), (18.5, 10.9))
    ax.add_patch(Polygon([(1.6, -1.2), (4.4, -2.0), (4.4, -2.9), (2.6, -2.4)], closed=True, facecolor=SCAFO, edgecolor=SCAFO, zorder=6))
    freccia(ax, "i due arpioni", (3, -2.3), (-3.5, -6.9), ha="left")
    # il collare di presa e i pannelli
    ax.add_patch(Rectangle((23, SU), 3, 0.7, facecolor=SCAFO, edgecolor=SCAFO, zorder=6))
    freccia(ax, "il collare di presa", (24.5, 8.2), (31, 10.9))
    for x0 in (12.3, 16.9, 50.2, 54.8):
        ax.add_patch(Rectangle((x0, 3.9), 4.1, 3.1, facecolor="none", edgecolor=LINEA, linewidth=1.4, hatch="++", zorder=7))
    freccia(ax, "i pannelli solari, sui due fianchi", (56.5, 7.0), (58, 10.9), LINEA)
    # gli scarichi
    ax.add_patch(Rectangle((L - 0.25, -3.1), 1.0, 1.6, facecolor=AMBRA, edgecolor=AMBRA, zorder=6))
    freccia(ax, "i quattro scarichi", (80.6, -2.3), (72, -6.9), AMBRA, 11.5, "bold")
    # le misure
    ax.annotate("", xy=(0, -8.7), xytext=(L, -8.7), arrowprops=dict(arrowstyle="<->", color=TENUE, linewidth=1.4))
    scritta(ax, 20, -9.7, "80 metri", 12, TENUE)
    ax.annotate("", xy=(83.6, GIU), xytext=(83.6, SU), arrowprops=dict(arrowstyle="<->", color=TENUE, linewidth=1.4))
    scritta(ax, 85.6, 1.5, "12 m", 12, TENUE, rotation=90)
    estremi(ax)
    ax.set_xlim(-6.5, 90.5)
    ax.set_ylim(-10.6, 12)


def pianta(ax):
    prepara(ax, "DALL'ALTO")
    ax.add_patch(Polygon(profilo_pianta(), closed=True, facecolor=DENTRO, edgecolor=SCAFO, linewidth=3, zorder=1))
    # il passaggio di servizio: dal fondo della stiva all'uscita, lungo la sala macchine
    ax.add_patch(Rectangle((44, 4.6), 27, 1.4, facecolor=STANZA, edgecolor=LINEA, linewidth=1.4, linestyle=(0, (5, 3)), zorder=2))
    scritta(ax, 57.5, 5.3, "passaggio di servizio", 9, LINEA, "normal")
    # i condotti dei motori verso gli scarichi: passano sotto le stanze di poppa
    for y in SCARICHI:
        ax.plot([61.5, L], [y, y], color=AMBRA, linewidth=1.3, linestyle=(0, (3, 4)), zorder=2)
    for nome in STANZE:
        stanza(ax, nome, "pianta")
    scritta(ax, 5.5, 0, "PLANCIA", 10)
    freccia(ax, "il modulo delle comunicazioni", (5.6, 4.4), (-3.5, 9.9), LINEA, 10.5, ha="left")
    scritta(ax, 15, 0, "CORRIDOIO", 9.5)
    scritta(ax, 10.9, -2.7, "CUCCETTA", 9)
    scritta(ax, 16.1, -2.7, "archivio", 9, LINEA, "normal")
    scritta(ax, 15.5, 3.3, "aria, acqua, scorte", 9.5, TENUE, "normal")
    scritta(ax, 34, 0.4, "STIVA", 22)
    freccia(ax, "SALA MACCHINE: il reattore al centro, un motore per lato", (55, 4.3), (48, 9.9), SCAFO, 11, "bold")
    scritta(ax, 67, 0, "sez. strutturale", 8.5, LINEA, "normal")
    scritta(ax, 66.5, -2.5, "vano\ncieco", 8.5, LINEA, "normal")
    scritta(ax, 73.5, 4.8, "USCITA", 9)
    # il reattore al centro, i due motori ai lati
    ax.add_patch(FancyBboxPatch((50.3, -1.0), 9.4, 2.0, boxstyle="round,pad=0.02,rounding_size=0.95", facecolor="#4a3a2c", edgecolor=AMBRA, linewidth=2, zorder=4))
    scritta(ax, 55, 0, "il reattore", 9.5, AMBRA)
    for y0, y1 in ((SCARICHI[0] - 0.6, SCARICHI[1] + 0.6), (SCARICHI[2] - 0.6, SCARICHI[3] + 0.6)):
        ax.add_patch(Rectangle((51, y0), 10.5, y1 - y0, facecolor="#3f3644", edgecolor=LINEA, linewidth=1.4, zorder=4))
        scritta(ax, 56.2, (y0 + y1) / 2, "motore", 9, LINEA, "normal")
    # gli scarichi: due coppie sulla piastra di poppa
    for y in SCARICHI:
        ax.add_patch(Rectangle((L - 0.2, y - 0.5), 1.0, 1.0, facecolor=AMBRA, edgecolor=AMBRA, zorder=6))
    # le aperture: l'oblò, l'oblò piccolo, il portello di carico, l'uscita
    ax.plot([1.7, 1.7], [-0.75, 0.75], color=AMBRA, linewidth=7, solid_capstyle="round", zorder=6)
    ax.add_patch(Circle((10.9, -MEZZA + 0.05), 0.3, facecolor=AMBRA, edgecolor=AMBRA, zorder=6))
    ax.plot([10.9, 10.9], [-4.6, -MEZZA], color=AMBRA, linewidth=1.4, linestyle=":", zorder=5)
    freccia(ax, "l'oblò piccolo della cuccetta:\nda questo lato, solo stelle", (10.9, -6.7), (-3.5, -10.2), AMBRA, 11, ha="left")
    ax.plot([24, 33], [-MEZZA, -MEZZA], color=ARANCIO, linewidth=8, zorder=6)
    freccia(ax, "il portello di carico", (28.5, -6.8), (33, -10.2), ARANCIO, 11.5, "bold")
    ax.plot([72, 75], [MEZZA, MEZZA], color=ARANCIO, linewidth=8, zorder=6)
    freccia(ax, "il portello d'uscita:\nla rampa, la luce gialla", (73.5, 6.8), (78, 9.6), ARANCIO, 11.5, "bold")
    # la porta della stiva, la botola, la porta del passaggio
    ax.plot([22, 22], [-0.9, 0.9], color=AMBRA, linewidth=4.5, zorder=6)
    ax.add_patch(Rectangle((45.4, -0.9), 1.9, 1.8, facecolor="none", edgecolor=AMBRA, linewidth=2.4, zorder=6))
    scritta(ax, 42.6, -2.1, "la botola", 10, AMBRA)
    ax.plot([45, 46.6], [4.5, 4.5], color=AMBRA, linewidth=4.5, zorder=6)
    # i fianchi
    scritta(ax, 58, -8.0, "FIANCO SINISTRO (babordo)", 11, TENUE)
    scritta(ax, 24, 7.7, "FIANCO DESTRO (tribordo): quello che resta contro il relitto", 11, TENUE)
    ax.annotate("", xy=(83.6, -MEZZA), xytext=(83.6, MEZZA), arrowprops=dict(arrowstyle="<->", color=TENUE, linewidth=1.4))
    scritta(ax, 85.6, 0, "13 m", 12, TENUE, rotation=90)
    estremi(ax)
    ax.set_xlim(-6.5, 90.5)
    ax.set_ylim(-11.8, 10.8)


def sezione(ax, titolo, raggio):
    prepara(ax, titolo)
    ax.add_patch(FancyBboxPatch((-MEZZA, GIU), 2 * MEZZA, SU - GIU, boxstyle=f"round,pad=0,rounding_size={raggio}", facecolor=DENTRO, edgecolor=SCAFO, linewidth=3))
    for x in (-MEZZA - 2.3, MEZZA + 0.6):
        ax.add_patch(Rectangle((x, 3.0), 1.7, 3.6, facecolor="none", edgecolor=LINEA, linewidth=1.4, hatch="++"))
    ax.set_xlim(-10.5, 10.5)
    ax.set_ylim(-7.4, 10.4)


def muso(ax):
    sezione(ax, "IL MUSO", 4.2)
    ax.add_patch(Circle((0, 2.1), 1.0, facecolor="#3a2c14", edgecolor=AMBRA, linewidth=4.5))
    scritta(ax, 0, -0.6, "un solo oblò,\ntondo", 12, AMBRA)
    ax.add_patch(Rectangle((-0.9, SU), 1.8, 1.1, facecolor=SCAFO, edgecolor=SCAFO))
    scritta(ax, 0, 9.5, "il faro", 10, SCAFO, "normal")
    for x in (-2.4, 2.4):
        ax.add_patch(Circle((x, -2.9), 0.42, facecolor=SCAFO, edgecolor=SCAFO))
    scritta(ax, 0, -5.9, "gli arpioni", 10, SCAFO, "normal")


def poppa(ax):
    sezione(ax, "LA POPPA", 1.6)
    scritta(ax, 0, 3.6, "TSC-1972", 16)
    scritta(ax, 0, 1.9, "SANTA MARIA", 10.5)
    for x in SCARICHI:
        ax.add_patch(Circle((x, -2.5), 0.58, facecolor="#3a2c14", edgecolor=AMBRA, linewidth=3.5))
    scritta(ax, 0, -6.2, "quattro scarichi,\nin due coppie", 11, AMBRA)


def main():
    fig = plt.figure(figsize=(25.6, 14.4), dpi=100, facecolor=FONDO)
    griglia = fig.add_gridspec(2, 2, width_ratios=[4.6, 1], height_ratios=[1, 1], left=0.015, right=0.99, top=0.895, bottom=0.02, wspace=0.02, hspace=0.14)
    fianco(fig.add_subplot(griglia[0, 0]))
    muso(fig.add_subplot(griglia[0, 1]))
    pianta(fig.add_subplot(griglia[1, 0]))
    poppa(fig.add_subplot(griglia[1, 1]))
    fig.text(0.015, 0.957, "LA SANTA MARIA · TSC-1972", color=SCAFO, fontsize=25 * K, fontweight="bold", va="center")
    fig.text(0.99, 0.957, "Schizzo della proposta (documento 38, §6).\nNon è ancora una schematica: le misure vere vengono dopo le decisioni.", color=TENUE, fontsize=12.5 * K, va="center", ha="right", linespacing=1.2)
    fig.savefig(USCITA, facecolor=FONDO)
    print("scritto", USCITA)


if __name__ == "__main__":
    main()
