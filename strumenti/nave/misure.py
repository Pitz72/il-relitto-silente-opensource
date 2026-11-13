# ============================================================================
#  Le misure della Santa Maria (TSC-1972): l'unica tabella da cui nascono le
#  schematiche (schematiche.py) e, dopo, il modello in Blender. Viene dal
#  documento 38 (le otto decisioni dell'autore, 13 novembre 2026) e dal
#  documento 39, che dice riga per riga da dove arriva ogni numero: dal testo
#  di uno dei due giochi, da un'immagine approvata, o inventato qui (e allora è
#  una proposta, finché l'autore non l'ha vista).
#
#  Tutto in metri. x va da prua (0) a poppa (80); y dal fianco sinistro
#  (babordo, negativa) al destro (tribordo, positiva); z è l'altezza, e 0 è il
#  pavimento del ponte, l'unico dove si vive.
# ============================================================================

LUNGHEZZA = 80.0
PONTE = 0.0  # il pavimento del ponte
BASSO = -2.6  # il pavimento della sala macchine, più in basso (decisione N1)

# --- lo scafo: tre profili lungo la nave, per punti (x, valore) ---------------------------------------
# mezza larghezza, dorso (in alto) e chiglia (in basso). Corpo 13 × 12 m (N8); muso chiuso, corto (N2).
MEZZA_LARGHEZZA = [(0, 1.7), (1.2, 2.7), (4, 4.3), (8, 5.8), (12, 6.5), (80, 6.5)]
DORSO = [(0, 3.4), (1.2, 4.4), (4, 5.9), (8, 7.0), (12, 7.5), (77, 7.5), (80, 6.6)]
CHIGLIA = [(0, 0.4), (1.2, -0.6), (4, -2.6), (9, -4.5), (77.5, -4.5), (80, -3.6)]
RAGGIO = 2.2  # quanto sono tondi gli spigoli dello scafo, in sezione


def lungo(punti, x):
    """Il valore di un profilo nel punto x della nave."""
    if x <= punti[0][0]:
        return punti[0][1]
    for (x0, v0), (x1, v1) in zip(punti, punti[1:]):
        if x <= x1:
            return v0 + (v1 - v0) * (x - x0) / (x1 - x0)
    return punti[-1][1]


def mezza(x):
    return lungo(MEZZA_LARGHEZZA, x)


def dorso(x):
    return lungo(DORSO, x)


def chiglia(x):
    return lungo(CHIGLIA, x)


# --- le stanze: (x da, x a, y da, y a, z da, z a) ---------------------------------------------------------
STANZE = {
    # a prua
    "plancia": (1.6, 6.6, -2.0, 2.0, 0.0, 4.2),
    "comunicazioni": (3.4, 6.4, 2.2, 4.2, 0.0, 2.5),  # 2 × 3 m, addossato a tribordo «come un'aggiunta»
    "corridoio": (6.6, 20.6, -0.9, 0.9, 0.0, 2.6),  # 14 m
    "cuccetta": (7.4, 10.0, -5.3, -1.1, 0.0, 2.5),  # stretta, dalla porta allo scafo
    "archivio": (12.2, 15.2, -4.1, -1.1, 0.0, 2.5),  # 3 × 3 m
    "aria e acqua": (7.4, 12.0, 1.1, 5.4, 0.0, 2.5),
    "cambusa e bagno": (12.3, 16.0, 1.1, 5.9, 0.0, 2.5),
    "deposito": (16.3, 18.6, 1.1, 5.9, 0.0, 2.5),
    "locale tecnico": (15.6, 20.0, -5.9, -1.1, 0.0, 2.5),
    "traversa": (18.9, 20.6, 0.9, 6.0, 0.0, 2.4),  # dal fondo del corridoio al passaggio di servizio
    # al centro
    "stiva": (20.6, 46.6, -4.5, 4.5, 0.0, 7.0),  # 26 × 9 m, alta 7
    "passaggio di servizio": (20.6, 70.6, 4.8, 6.0, 0.0, 2.4),  # lungo il fianco destro, fino all'uscita
    # a poppa
    "sala macchine": (46.6, 60.6, -4.4, 4.4, BASSO, 3.6),
    "sezione strutturale": (60.6, 70.6, -1.0, 1.0, BASSO, -0.6),  # larga 2 m, bassa
    "vano cieco": (64.6, 67.6, -2.8, -1.0, BASSO, -0.6),  # 3 × 2 m, alto 2: in nessuna planimetria
    "uscita": (70.6, 75.6, 3.4, 6.0, 0.0, 2.6),
}
# il pozzo della sala macchine: sotto il ponte la sala è più larga, e ci stanno i motori
POZZO = (46.6, 60.6, -5.4, 5.4, BASSO, 0.0)
# lo spazio tecnico sotto il ponte: la struttura, i serbatoi, i condotti (non è un ponte)
SOTTO_IL_PONTE = (9.0, 46.6, -4.0, -0.3)  # x da, x a, z da, z a

# --- le macchine ----------------------------------------------------------------------------------------------
REATTORE = {"x": (48.6, 58.6), "y": 0.0, "z": -1.2, "diametro": 2.4}  # un cilindro, al centro
MOTORI = [{"x": (49.0, 60.0), "y": -3.9, "z": -1.3, "diametro": 2.4}, {"x": (49.0, 60.0), "y": 3.9, "z": -1.3, "diametro": 2.4}]
SCARICHI = {"y": (-4.6, -3.2, 3.2, 4.6), "z": -2.3, "diametro": 1.1}  # due coppie, sulla piastra di poppa (N3)
BOTOLA = {"x": (44.6, 46.2), "y": (-0.8, 0.8)}  # nel fondo della stiva
SCALETTA = ((45.4, 0.0), (47.5, BASSO))  # dalla botola al pavimento della sala macchine (x, z)

# --- le aperture nello scafo -------------------------------------------------------------------------------
OBLO = {"x": 0.0, "y": 0.0, "z": 1.9, "diametro": 1.1}  # l'unico, a prua (N2)
OBLO_CUCCETTA = {"x": 8.7, "z": 1.6, "diametro": 0.18}  # sul fianco sinistro, «grande quanto una mano» (N6)
PORTELLO_DI_CARICO = {"x": (30.0, 38.0), "z": (0.2, 5.2)}  # sul fianco sinistro, chiuso
PORTELLO_USCITA = {"x": (72.4, 73.6), "z": (0.0, 2.0)}  # sul fianco destro, a poppa (N4)
RAMPA = {"x": (72.0, 74.0), "sporge": 1.4}  # la pedana fuori dal portello d'uscita
PORTE = [  # (x, y, lungo quale asse corre la porta, larghezza)
    (6.6, 0.0, "y", 1.0),  # plancia–corridoio
    (5.0, 2.0, "x", 0.9),  # plancia–comunicazioni
    (8.2, -1.0, "x", 0.9),  # cuccetta: la prima a sinistra
    (13.0, -1.0, "x", 0.9),  # archivio
    (20.6, 0.0, "y", 1.6),  # il portello della stiva, in fondo al corridoio
    (19.6, 0.9, "x", 0.9),  # dal fondo del corridoio al passaggio di servizio
    (45.2, 4.5, "x", 1.0),  # dal fondo della stiva al passaggio di servizio
    (53.0, 4.6, "x", 0.9),  # dal passaggio alla sala macchine
    (70.6, 5.4, "y", 0.9),  # dal passaggio all'uscita
]

# --- fuori -------------------------------------------------------------------------------------------------------
PANNELLI = {"x": (21.0, 25.4, 38.6, 43.0), "lungo": 4.0, "z": (2.6, 6.0), "staffa": 0.9}  # per fianco: quattro
MATRICOLA_FIANCO = {"x": (9.5, 19.5), "z": (-3.4, -1.6)}  # in basso, a prua della stiva, sui due fianchi
MATRICOLA_POPPA = {"z": (2.2, 4.6)}
FARO = {"x": (8.0, 10.0), "z": (7.1, 8.5), "largo": 1.4}  # il riflettore di prua, sul dorso
RADAR = {"x": 12.6, "z": 8.6, "diametro": 1.6}
ANTENNA = {"x": 19.0, "z": 11.0}  # la radio a lungo raggio
COLLARE = {"x": (14.4, 17.4), "z": (7.5, 8.1), "largo": 3.0}  # il collare di presa, sul dorso
ARPIONI = {"x": (1.2, 4.4), "y": (-1.5, 1.5), "z": -1.7, "diametro": 0.5}  # due, sotto il muso
FANALI_POPPA = {"y": (-5.5, 5.5), "z": 5.6}  # d'ambra
LUCE_USCITA = {"x": 73.0, "z": 2.6}  # gialla, sopra il portello d'uscita
PEDANA_POPPA = {"z": -3.4, "sporge": 1.2}  # il camminamento sotto la piastra
