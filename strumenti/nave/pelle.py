# ============================================================================
#  La pelle dello scafo della Santa Maria: come un punto dello scafo va sulla
#  tessitura. Lo usano superficie.py, che dipinge la tessitura, e modello.py,
#  che la stende sullo scafo: così una lamiera dipinta a un certo metro cade
#  su quel metro della nave. Solo libreria standard (lo legge anche Blender).
#
#  La tessitura è un foglio solo, 4096 × 2944 punti, circa 2 cm per punto:
#    - in basso (le prime 2368 righe) lo scafo «srotolato»: in orizzontale la
#      x della nave, da prua a poppa; in verticale il giro della sezione, in
#      metri, partendo da sotto la chiglia, in mezzo, e salendo dal fianco
#      destro: fondo, ginocchio, fianco destro, spalla, dorso, spalla, fianco
#      sinistro, ginocchio, fondo;
#    - in alto, la piastra di poppa (vista da dietro) e la faccia del muso
#      (vista da davanti).
#  Da x = 12 a x = 77 la sezione è sempre la stessa, e la tessitura è in scala;
#  a prua e a poppa, dove lo scafo si stringe, si stringe con lui.
# ============================================================================
import math

import misure as M

LARGA, ALTA_SCAFO, ALTA = 4096, 2368, 2944
PX = LARGA / M.LUNGHEZZA  # punti per metro: 51,2

# la sezione di mezzo
W, SU, GIU = M.mezza(40.0), M.dorso(40.0), M.chiglia(40.0)
R = min(M.RAGGIO, W * 0.8, (SU - GIU) * 0.4)
QUARTO = math.pi * R / 2  # uno spigolo tondo
FONDO = W - R  # mezzo fondo piatto (e mezzo dorso piatto)
LATO = SU - GIU - 2 * R  # il tratto piatto di un fianco
GIRO = 4 * FONDO + 4 * QUARTO + 2 * LATO  # tutto il giro: 46,2 metri

# dove comincia ogni tratto del giro
S_GINOCCHIO_D = FONDO
S_FIANCO_D = S_GINOCCHIO_D + QUARTO  # il piede del fianco destro (z = GIU + R)
S_SPALLA_D = S_FIANCO_D + LATO
S_DORSO = S_SPALLA_D + QUARTO  # il dorso piatto, da y = +FONDO a y = -FONDO
S_SPALLA_S = S_DORSO + 2 * FONDO
S_FIANCO_S = S_SPALLA_S + QUARTO  # la cima del fianco sinistro (z = SU - R)
S_GINOCCHIO_S = S_FIANCO_S + LATO
S_FONDO_S = S_GINOCCHIO_S + QUARTO


def giro_fianco(lato, z):
    """Dove sta nel giro un punto del fianco all'altezza z (lato +1 il destro, -1 il sinistro).
    Fuori dal tratto piatto continua sul tondo, come una vernice che gira con la lamiera."""
    su = z - (GIU + R)
    return S_FIANCO_D + su if lato > 0 else S_GINOCCHIO_S - su


def giro_dorso(y):
    return S_DORSO + (FONDO - y)


# i corsi del fasciame: dove finiscono lungo il giro. Lo scafo ha un punto su ognuno di questi confini,
# così a prua, dove si stringe, la giunta fra due corsi segue uno spigolo della maglia e non si seghetta.
QUOTE_FIANCO = (-0.9, 1.2, 3.25)  # le altezze fra un corso e l'altro, sul fianco
FRAZIONI_FIANCO = tuple((q - (GIU + R)) / LATO for q in QUOTE_FIANCO)
FRAZIONI_MEZZO_FONDO = (0.5,)
FRAZIONI_DORSO = (0.25, 0.5, 0.75)


def anello(w, su, giu, r, arco):
    """I punti (y, z) di una sezione: mezza larghezza w, dorso su, chiglia giu, spigoli di raggio r.
    Si parte da sotto la chiglia, in mezzo, e si sale dal fianco destro."""
    a, lato = w - r, su - giu - 2 * r

    def tondo(cy, cz, a0):
        return [(cy + r * math.cos(math.radians(a0 + 90 * i / arco)), cz + r * math.sin(math.radians(a0 + 90 * i / arco))) for i in range(arco + 1)]
    p = [(0.0, giu)] + [(a * f, giu) for f in FRAZIONI_MEZZO_FONDO]
    p += tondo(a, giu + r, 270) + [(w, giu + r + lato * f) for f in FRAZIONI_FIANCO]
    p += tondo(a, su - r, 0) + [(a - 2 * a * f, su) for f in FRAZIONI_DORSO]
    p += tondo(-a, su - r, 90) + [(-w, giu + r + lato * f) for f in reversed(FRAZIONI_FIANCO)]
    p += tondo(-a, giu + r, 180) + [(-a * f, giu) for f in reversed(FRAZIONI_MEZZO_FONDO)]
    return p


def giro_anello(arco):
    """Il giro di ogni punto dell'anello, nello stesso ordine. L'ultimo valore chiude il giro."""
    def tondo(inizio):
        return [inizio + QUARTO * i / arco for i in range(arco + 1)]
    s = [0.0] + [FONDO * f for f in FRAZIONI_MEZZO_FONDO]
    s += tondo(S_GINOCCHIO_D) + [S_FIANCO_D + LATO * f for f in FRAZIONI_FIANCO]
    s += tondo(S_SPALLA_D) + [S_DORSO + 2 * FONDO * f for f in FRAZIONI_DORSO]
    s += tondo(S_SPALLA_S) + [S_FIANCO_S + LATO * (1 - f) for f in reversed(FRAZIONI_FIANCO)]
    s += tondo(S_GINOCCHIO_S) + [S_FONDO_S + FONDO * (1 - f) for f in reversed(FRAZIONI_MEZZO_FONDO)]
    return s + [GIRO]


def punto_scafo(x, s):
    """Da (x della nave, giro) al punto della tessitura (colonna, riga dal basso)."""
    return x * PX, s / GIRO * ALTA_SCAFO


# la piastra di poppa, vista da dietro (la y cresce verso destra), e la faccia del muso, vista da davanti
POPPA_ORIGINE = (16, ALTA_SCAFO + 24)
MUSO_ORIGINE = (760, ALTA_SCAFO + 24)


def punto_poppa(y, z):
    return POPPA_ORIGINE[0] + (y + M.mezza(M.LUNGHEZZA)) * PX, POPPA_ORIGINE[1] + (z - M.chiglia(M.LUNGHEZZA)) * PX


def punto_muso(y, z):
    return MUSO_ORIGINE[0] + (M.mezza(0) - y) * PX, MUSO_ORIGINE[1] + (z - M.chiglia(0)) * PX
