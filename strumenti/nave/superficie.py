# ============================================================================
#  La superficie della Santa Maria (documento 40, secondo passo): la tessitura
#  dello scafo, dipinta a partire dalla tabella delle misure e dalla scheda
#  05B del seguito («metallo trattato nudo», «toppe di scafo in tonalità di
#  metallo diverse», «fasciame rivettato, giunti di piastra, crateri da
#  micrometeorite, stencil consumato», l'arancione solo sulle marcature delle
#  due aperture, la matricola sulla fascia scura in basso).
#
#    python strumenti/nave/superficie.py   -> strumenti/nave/uscita/pelle-*.png
#                                          -> app/public/intro/nave/*.webp (la stessa, a metà misura, per l'intro)
#
#  Quattro immagini (fuori da git: si rifanno da qui, sempre uguali): il
#  colore, quanto è ruvido, quanto è metallo, il rilievo. Dove va ogni punto
#  lo dice pelle.py. Tutto è deciso da un numero solo (il seme, 1972): la nave
#  esce identica a ogni giro.
# ============================================================================
import sys
from pathlib import Path

import matplotlib
import numpy as np
from PIL import Image, ImageDraw, ImageFont

QUI = Path(__file__).resolve().parent
sys.path.insert(0, str(QUI))
import misure as M  # noqa: E402
import pelle as P  # noqa: E402

USCITA = QUI / "uscita"
INTRO = QUI.parents[1] / "app" / "public" / "intro" / "nave"  # la tessitura che l'intro del gioco carica
L, A, AS, PX = P.LARGA, P.ALTA, P.ALTA_SCAFO, P.PX
caso = np.random.default_rng(1972)

GRIGIO = np.array([131, 135, 140]) / 255  # la lamiera di tutti i giorni
SCURO = np.array([60, 64, 72]) / 255  # la fascia bassa: un'altra lega, più scura
TOPPE = [np.array(c) / 255 for c in ((156, 158, 159), (102, 106, 113), (138, 131, 122), (116, 123, 133), (146, 144, 139), (120, 122, 124))]
RUGGINE = np.array([104, 70, 50]) / 255
VERNICE = np.array([214, 217, 219]) / 255
ARANCIONE = np.array([0xF9, 0x73, 0x16]) / 255


def rumore(alta, larga, grana, ottave=4, calo=0.5):
    """Una macchia morbida fra 0 e 1. grana: quanto è grossa, in punti (o una coppia: larga, alta)."""
    gx, gy = grana if isinstance(grana, tuple) else (grana, grana)
    tot, peso, somma = np.zeros((alta, larga), np.float32), 1.0, 0.0
    for _ in range(ottave):
        piccolo = caso.random((max(2, int(alta / gy) + 2), max(2, int(larga / gx) + 2)), dtype=np.float32)
        tot += np.asarray(Image.fromarray(piccolo, mode="F").resize((larga, alta), Image.BICUBIC)) * peso
        somma += peso
        peso, gx, gy = peso * calo, max(1.5, gx / 2), max(1.5, gy / 2)
    return np.clip((tot / somma - 0.5) * 1.7 + 0.5, 0, 1)


def sfoca(a, raggio):
    """Una sfocatura a campana. Quelle larghe si fanno in piccolo e si riportano in grande."""
    a = np.ascontiguousarray(a, np.float32)
    h, w = a.shape
    if raggio > 4:
        passo = int(raggio // 2)
        piccolo = np.asarray(Image.fromarray(a, mode="F").resize((max(1, w // passo), max(1, h // passo)), Image.BOX))
        return np.asarray(Image.fromarray(sfoca(piccolo, raggio / passo), mode="F").resize((w, h), Image.BICUBIC))
    n = max(1, int(np.ceil(raggio * 3)))
    pesi = np.exp(-(np.arange(-n, n + 1) ** 2) / (2 * raggio * raggio)).astype(np.float32)
    pesi /= pesi.sum()
    for asse in (0, 1):
        largo = np.pad(a, [(n, n) if i == asse else (0, 0) for i in (0, 1)], mode="edge")
        a = np.zeros_like(a)
        for k, peso in enumerate(pesi):
            a += peso * (largo[k:k + h] if asse == 0 else largo[:, k:k + w])
    return a


def riga(s):
    return int(round(s / P.GIRO * AS))


def colonna(x):
    return int(round(x * PX))


class Tela:
    """Un pezzo del foglio (lo scafo srotolato, la piastra di poppa, la faccia del muso) e i suoi quattro strati."""

    def __init__(self, alta, larga):
        self.alta, self.larga = alta, larga
        self.colore = np.zeros((alta, larga, 3), np.float32)
        self.ruvido = np.full((alta, larga), 0.56, np.float32)
        self.metallo = np.full((alta, larga), 0.6, np.float32)
        self.rilievo = np.full((alta, larga), 0.5, np.float32)
        self.giunti = np.zeros((alta, larga), np.float32)
        self.rivetti = np.zeros((alta, larga), np.float32)

    def lamiera(self, r0, r1, c0, c1, tinta, metallo, ruvido, spessore, passo=13, rivetti=True):
        """Una lamiera: la sua tinta, la giunta sui bordi, la fila di rivetti appena dentro."""
        r0, r1, c0, c1 = max(r0, 0), min(r1, self.alta), max(c0, 0), min(c1, self.larga)
        if r1 - r0 < 3 or c1 - c0 < 3:
            return
        self.colore[r0:r1, c0:c1] = tinta
        self.metallo[r0:r1, c0:c1] = metallo
        self.ruvido[r0:r1, c0:c1] = ruvido
        # la lamiera è appena imbarcata, in dentro o in fuori: novant'anni di caldo e di freddo
        gobba = np.outer(np.sin(np.linspace(0, np.pi, r1 - r0)), np.sin(np.linspace(0, np.pi, c1 - c0))).astype(np.float32)
        self.rilievo[r0:r1, c0:c1] = 0.5 + spessore / 3 + float(np.clip(caso.normal(0, 0.11), -0.25, 0.25)) * min(1.0, (c1 - c0) / (2 * PX)) * gobba
        self.giunti[r0:r1, c0:c1] = 0
        self.rivetti[r0:r1, c0:c1] = 0
        for fetta in ((slice(r0, r0 + 2), slice(c0, c1)), (slice(r1 - 1, r1), slice(c0, c1)), (slice(r0, r1), slice(c0, c0 + 2)), (slice(r0, r1), slice(c1 - 1, c1))):
            self.giunti[fetta] = 1
        if rivetti and r1 - r0 > 14 and c1 - c0 > 14:
            for r in (r0 + 5, r1 - 6):
                for d in (0, 1):
                    self.rivetti[r:r + 2, c0 + 6 + d:c1 - 6:passo] = 1
            for c in (c0 + 5, c1 - 6):
                for d in (0, 1):
                    self.rivetti[r0 + 6 + d:r1 - 6:passo, c:c + 2] = 1

    def invecchia(self, colate, verso_x=True):
        """Le macchie larghe, la grana, lo sporco nelle giunte, i rivetti, i graffi, i crateri.
        colate: quanto pesano le colature in ogni riga (uno per riga; 0 dove non ce ne sono)."""
        h, w = self.alta, self.larga
        self.colore *= (0.8 + 0.38 * rumore(h, w, 260))[..., None]
        self.colore *= (0.94 + 0.12 * rumore(h, w, 6, 2))[..., None]
        self.ruvido += 0.16 * (rumore(h, w, 90) - 0.5)
        # le colature: righe scure che scendono lungo il giro, più fitte sotto le giunte
        strisce = np.clip((rumore(h, w, (7, 380), 2) - 0.6) * 4, 0, 1) * np.clip((rumore(h, w, 220, 2) - 0.35) * 2.5, 0, 1) * colate[:, None]
        sporco = np.clip(sfoca(self.giunti, 3.0) * 2.6, 0, 1)
        self.colore *= (1 - 0.26 * strisce)[..., None]
        self.metallo *= 1 - 0.5 * strisce
        vena = (strisce * np.clip(sfoca(self.giunti, 14.0) * 5, 0, 1) * rumore(h, w, 60, 2) * 0.55)[..., None]
        self.colore[:] = self.colore * (1 - vena) + RUGGINE * vena
        # le giunte: una riga scura, e lo sporco che ci si ferma intorno
        self.colore *= (1 - 0.3 * sporco)[..., None]
        self.colore *= (1 - 0.5 * self.giunti)[..., None]
        self.ruvido += 0.2 * sporco
        self.rilievo -= 0.08 * self.giunti
        # i rivetti: teste in rilievo, appena più scure
        self.colore *= (1 - 0.2 * self.rivetti)[..., None]
        self.rilievo += 0.1 * self.rivetti
        # i graffi: lunghi, sottili, nel verso del viaggio; scoprono metallo fresco
        foglio = Image.new("L", (w, h), 0)
        penna = ImageDraw.Draw(foglio)
        for _ in range(int(w * h / 9000)):
            x, y = caso.uniform(0, w), caso.uniform(0, h)
            lungo, pende = caso.uniform(15, 260) ** 1.0, caso.normal(0, 0.03)
            fine = (x + lungo, y + lungo * pende) if verso_x else (x + lungo * pende, y + lungo)
            penna.line([(x, y), fine], fill=int(caso.uniform(50, 210)), width=1)
        graffi = np.asarray(foglio, np.float32) / 255
        self.graffi = graffi
        self.colore += 0.11 * graffi[..., None]
        self.ruvido -= 0.2 * graffi
        self.metallo += 0.25 * graffi
        # i crateri da micrometeorite: più fitti verso prua (a sinistra del foglio dello scafo)
        quanti = int(w * h / 1500)
        cx = np.where(caso.random(quanti) < 0.45, caso.exponential(w * 0.12, quanti), caso.uniform(0, w, quanti)).astype(int) % w if verso_x else caso.integers(0, w, quanti)
        cy = caso.integers(0, h, quanti)
        buchi = np.zeros((h, w), np.float32)
        buchi[cy, cx] = 1
        grossi = caso.random(quanti) < 0.06
        for dy, dx in ((0, 1), (1, 0), (1, 1)):
            buchi[np.minimum(cy[grossi] + dy, h - 1), np.minimum(cx[grossi] + dx, w - 1)] = 1
        orlo = np.clip(sfoca(buchi, 1.3) * 6 - buchi, 0, 1)
        self.colore *= (1 - 0.55 * buchi)[..., None]
        self.colore += 0.09 * orlo[..., None]
        self.rilievo -= 0.12 * buchi
        self.usura = rumore(h, w, 9, 3)  # dove la vernice se n'è andata

    def vernicia(self, r0, c0, maschera, tinta, tenuta=0.3):
        """Vernice sulla lamiera, consumata: maschera fra 0 e 1, con la riga 0 in basso."""
        h, w = maschera.shape
        r0, c0 = int(round(r0)), int(round(c0))
        ra, rb, ca, cb = max(r0, 0), min(r0 + h, self.alta), max(c0, 0), min(c0 + w, self.larga)
        if rb <= ra or cb <= ca:
            return
        m = maschera[ra - r0:rb - r0, ca - c0:cb - c0]
        resta = np.clip((self.usura[ra:rb, ca:cb] - tenuta) * 7, 0, 1) * (1 - 0.8 * self.graffi[ra:rb, ca:cb]) * (1 - 0.7 * self.giunti[ra:rb, ca:cb])
        a = (m * resta * 0.93)[..., None]
        sotto = self.colore[ra:rb, ca:cb]
        ombra = (0.82 + 0.25 * self.usura[ra:rb, ca:cb])[..., None]
        self.colore[ra:rb, ca:cb] = sotto * (1 - a) + tinta * ombra * a
        self.metallo[ra:rb, ca:cb] *= 1 - a[..., 0]
        self.ruvido[ra:rb, ca:cb] = self.ruvido[ra:rb, ca:cb] * (1 - a[..., 0]) + 0.78 * a[..., 0]


def anni(t):
    """Novant'anni e più sullo scafo srotolato: le ordinate che si leggono sotto la pelle, le ammaccature, le
    saldature delle riparazioni, le perdite colate lungo i fianchi, il fondo di antiruggine dove il metallo si è
    scrostato, il muso sabbiato dalla polvere, la poppa cotta dal calore, i segni del carico intorno al portello."""
    h, w = t.alta, t.larga
    x = np.arange(w, dtype=np.float32) / PX  # i metri lungo la nave
    s = np.arange(h, dtype=np.float32) / h * P.GIRO  # i metri lungo il giro
    # le ordinate: una ogni due metri; fra l'una e l'altra la pelle rientra appena
    t.rilievo += ((np.abs(np.sin(np.pi * x / 2.0)) - 0.64) * 0.16)[None, :] * (0.5 + 0.9 * rumore(h, w, 300, 2))
    # le ammaccature: di più a prua e sul fianco del carico
    rr, cc = np.mgrid[0:h, 0:w].astype(np.float32)
    for _ in range(70):
        cx = caso.exponential(14) if caso.random() < 0.4 else caso.uniform(0, 80)
        cs = caso.uniform(P.S_FIANCO_S, P.S_GINOCCHIO_S) if caso.random() < 0.45 else caso.uniform(0, P.GIRO)
        raggio, fonda = caso.uniform(0.25, 1.1) * PX, caso.uniform(0.12, 0.42)
        r0, r1 = max(int(cs / P.GIRO * h - 3 * raggio), 0), min(int(cs / P.GIRO * h + 3 * raggio), h)
        c0, c1 = max(int(cx * PX - 3 * raggio), 0), min(int(cx * PX + 3 * raggio), w)
        if r1 <= r0 or c1 <= c0:
            continue
        buca = np.exp(-((rr[r0:r1, c0:c1] - cs / P.GIRO * h) ** 2 + (cc[r0:r1, c0:c1] - cx * PX) ** 2) / (2 * raggio * raggio))
        t.rilievo[r0:r1, c0:c1] -= fonda * buca
        t.colore[r0:r1, c0:c1] *= (1 - 0.12 * buca)[..., None]
        t.ruvido[r0:r1, c0:c1] += 0.08 * buca
    # le saldature delle riparazioni: cordoni chiari e storti, con l'alone scuro del calore intorno
    foglio = Image.new("L", (w, h), 0)
    penna = ImageDraw.Draw(foglio)
    for _ in range(110):
        px, py = caso.uniform(8 * PX, w), caso.uniform(0, h)
        verso = caso.uniform(0, 2 * np.pi) if caso.random() < 0.3 else caso.choice([0.0, np.pi / 2])
        punti = [(px, py)]
        for _ in range(int(caso.uniform(4, 22))):
            verso += caso.normal(0, 0.22)
            px, py = px + 7 * np.cos(verso), py + 7 * np.sin(verso)
            punti.append((px, py))
        penna.line(punti, fill=255, width=2)
    cordone = np.asarray(foglio, np.float32) / 255
    alone = np.clip(sfoca(cordone, 3.5) * 3.2, 0, 1)
    t.colore *= (1 - 0.33 * alone)[..., None]
    t.colore += 0.16 * cordone[..., None] * np.array([0.9, 0.95, 1.05], np.float32)
    t.rilievo += 0.09 * sfoca(cordone, 0.8)
    t.ruvido += 0.12 * alone - 0.15 * cordone
    # le perdite: una macchia che parte da un punto del fianco e cola verso la chiglia, bruna
    for _ in range(64):
        lato = caso.choice([-1, 1])
        px, z = caso.uniform(10, 79), caso.uniform(-0.5, 5.2)
        lunga, larga = caso.uniform(1.2, 5.0), caso.uniform(0.12, 0.45)
        capo = P.giro_fianco(lato, z)
        giu = s - capo if lato < 0 else capo - s  # quanti metri sotto il capo (verso la chiglia)
        lungo = np.where(giu < 0, 0, np.exp(-giu / lunga) * np.clip(giu / 0.15, 0, 1)).astype(np.float32)
        c0, c1 = max(int((px - 4 * larga) * PX), 0), min(int((px + 4 * larga) * PX), w)
        traverso = np.exp(-((x[c0:c1] - px) ** 2) / (2 * larga * larga))
        macchia = (lungo[:, None] * traverso[None, :] * caso.uniform(0.25, 0.6) * (0.55 + 0.45 * t.usura[:, c0:c1]))[..., None]
        t.colore[:, c0:c1] = t.colore[:, c0:c1] * (1 - macchia) + (RUGGINE * 0.55) * macchia
        t.metallo[:, c0:c1] *= 1 - 0.6 * macchia[..., 0]
        t.ruvido[:, c0:c1] += 0.15 * macchia[..., 0]
    # l'antiruggine che affiora dove il metallo si è scrostato: a chiazze, vicino alle giunte
    chiazze = np.clip((rumore(h, w, 5, 2) - 0.62) * 6, 0, 1) * np.clip((rumore(h, w, 140, 2) - 0.5) * 3, 0, 1) * np.clip(sfoca(t.giunti, 9.0) * 6, 0, 1)
    chiazze = (chiazze * 0.55)[..., None]
    t.colore[:] = t.colore * (1 - chiazze) + (RUGGINE * 0.8) * chiazze
    t.metallo *= 1 - 0.7 * chiazze[..., 0]
    # il muso, sabbiato dalla polvere di novant'anni: più chiaro, più opaco; la poppa, cotta: più bruna
    sabbia = np.clip(1 - x / 11.0, 0, 1)[None, :] * (0.6 + 0.4 * rumore(h, w, 80, 2))
    t.colore[:] = t.colore * (1 - 0.2 * sabbia)[..., None] + (0.2 * sabbia)[..., None] * np.array([0.62, 0.63, 0.63], np.float32)
    t.ruvido += 0.14 * sabbia
    cotta = (np.clip((x - 70.5) / 9.5, 0, 1) ** 1.5)[None, :] * (0.5 + 0.5 * rumore(h, w, 120, 2))
    t.colore *= 1 - 0.36 * cotta[..., None] * np.array([0.8, 1.0, 1.15], np.float32)
    t.ruvido += 0.1 * cotta
    # i segni del carico: graffi fitti e corti intorno al portello, e dove le staffe dei pannelli toccano lo scafo
    foglio = Image.new("L", (w, h), 0)
    penna = ImageDraw.Draw(foglio)
    cx0, cx1 = M.PORTELLO_DI_CARICO["x"]
    cz0, cz1 = M.PORTELLO_DI_CARICO["z"]
    for _ in range(900):
        px, z = caso.uniform(cx0 - 2.5, cx1 + 2.5), caso.uniform(cz0 - 1.4, cz1 + 0.8)
        if cx0 + 0.3 < px < cx1 - 0.3 and cz0 + 0.3 < z < cz1 - 0.3 and caso.random() < 0.8:
            continue
        lungo, verso = caso.uniform(4, 60), caso.normal(0, 0.5)
        a = (px * PX, P.giro_fianco(-1, z) / P.GIRO * h)
        penna.line([a, (a[0] + lungo * np.cos(verso), a[1] + lungo * np.sin(verso))], fill=int(caso.uniform(70, 230)), width=1)
    urti = np.asarray(foglio, np.float32) / 255
    t.colore += 0.14 * urti[..., None]
    t.ruvido -= 0.2 * urti
    t.metallo += 0.25 * urti
    t.graffi = np.maximum(t.graffi, urti)
    # lo sporco che si ferma sopra la fascia scura: il primo metro del fianco chiaro è più scuro
    for lato in (-1, 1):
        sopra = (s - P.giro_fianco(lato, P.QUOTE_FIANCO[0])) * lato
        velo = np.where((sopra > 0) & (sopra < 1.6), 1 - sopra / 1.6, 0).astype(np.float32)[:, None] * (0.4 + 0.6 * rumore(h, w, (40, 200), 2))
        t.colore *= (1 - 0.3 * velo)[..., None]


def tinta_lamiera(scura):
    """La tinta di una lamiera: quasi tutte del grigio di sempre, alcune di un altro metallo (le toppe)."""
    if scura:
        return SCURO * caso.uniform(0.8, 1.2), 0.45, 0.66, caso.uniform(-0.05, 0.05)
    u = caso.random()
    if u < 0.7:
        return GRIGIO * caso.uniform(0.92, 1.08), 0.6, caso.uniform(0.5, 0.6), caso.uniform(-0.05, 0.05)
    return TOPPE[caso.integers(len(TOPPE))] * caso.uniform(0.94, 1.06), caso.uniform(0.45, 0.75), caso.uniform(0.42, 0.68), caso.uniform(-0.03, 0.09)


def carattere(alta_maiuscola):
    """Un carattere da stencil, alto quanto si chiede (in punti del foglio)."""
    din = Path("C:/Windows/Fonts/bahnschrift.ttf")
    file = din if din.exists() else Path(matplotlib.get_data_path()) / "fonts" / "ttf" / "DejaVuSans-Bold.ttf"
    return ImageFont.truetype(str(file), int(round(alta_maiuscola / 0.7)))


def scritta(testo, alta_in_metri):
    """Una scritta come maschera fra 0 e 1, dritta (la riga 0 in alto), tagliata ai suoi bordi."""
    c = carattere(alta_in_metri * PX)
    x0, y0, x1, y1 = c.getbbox(testo)
    foglio = Image.new("L", (x1 - x0 + 4, y1 - y0 + 4), 0)
    ImageDraw.Draw(foglio).text((2 - x0, 2 - y0), testo, font=c, fill=255)
    return np.asarray(foglio, np.float32) / 255


def fascia(larga, alta, banda, smusso):
    """La fascia dipinta intorno a un'apertura: un anello con gli angoli tagliati, in metri."""
    w, h, b, k = (int(round(v * PX)) for v in (larga, alta, banda, smusso))
    foglio = Image.new("L", (w, h), 0)
    penna = ImageDraw.Draw(foglio)

    def ottagono(m, k):
        return [(m + k, m), (w - m - k, m), (w - m, m + k), (w - m, h - m - k), (w - m - k, h - m), (m + k, h - m), (m, h - m - k), (m, m + k)]
    penna.polygon(ottagono(0, k), fill=255)
    penna.polygon(ottagono(b, max(k - b // 2, 2)), fill=0)
    return np.asarray(foglio, np.float32) / 255


def matricola():
    """Le due righe della matricola in una maschera sola, dritta."""
    sopra, sotto = scritta("TSC-1972", 0.86), scritta("SANTA MARIA", 0.42)
    stacco = int(0.3 * PX)
    m = np.zeros((sopra.shape[0] + stacco + sotto.shape[0], max(sopra.shape[1], sotto.shape[1])), np.float32)
    m[:sopra.shape[0], (m.shape[1] - sopra.shape[1]) // 2:(m.shape[1] - sopra.shape[1]) // 2 + sopra.shape[1]] = sopra
    m[-sotto.shape[0]:, (m.shape[1] - sotto.shape[1]) // 2:(m.shape[1] - sotto.shape[1]) // 2 + sotto.shape[1]] = sotto
    return m


def sul_fianco(tela, maschera, x_mezzo, lato, z_alto, tinta, tenuta=0.3):
    """Posa una maschera dritta sul fianco: a sinistra la prua è a sinistra di chi guarda, a destra è a destra."""
    h, w = maschera.shape
    c0 = x_mezzo * PX - w / 2
    if lato < 0:  # sul fianco sinistro il giro scende quando si sale: la riga 0 del foglio è la cima della scritta
        tela.vernicia(riga(P.giro_fianco(-1, z_alto)), c0, maschera, tinta, tenuta)
    else:
        tela.vernicia(riga(P.giro_fianco(1, z_alto)) - h, c0, maschera[::-1, ::-1], tinta, tenuta)


# ============================================================================
#  Lo scafo srotolato
# ============================================================================
def fasce():
    """I corsi del fasciame lungo il giro: (da, a, se è della lega scura)."""
    f = []

    def tratto(s0, s1, n, scura):
        f.extend((s0 + (s1 - s0) * i / n, s0 + (s1 - s0) * (i + 1) / n, scura) for i in range(n))
    quote = [P.GIU + P.R, *P.QUOTE_FIANCO, P.SU - P.R]  # i corsi del fianco: il più basso è ancora della lega scura
    tratto(0, P.S_GINOCCHIO_D, 2, True)
    tratto(P.S_GINOCCHIO_D, P.S_FIANCO_D, 2, True)
    f.extend((P.giro_fianco(1, a), P.giro_fianco(1, b), a < -1) for a, b in zip(quote, quote[1:]))
    tratto(P.S_SPALLA_D, P.S_DORSO, 2, False)
    tratto(P.S_DORSO, P.S_SPALLA_S, 4, False)
    tratto(P.S_SPALLA_S, P.S_FIANCO_S, 2, False)
    f.extend((P.giro_fianco(-1, a), P.giro_fianco(-1, b), b < -1) for a, b in zip(quote[::-1], quote[-2::-1]))
    tratto(P.S_GINOCCHIO_S, P.S_FONDO_S, 2, True)
    tratto(P.S_FONDO_S, P.GIRO, 2, True)
    return f


def giunte(k):
    """Dove finiscono le lamiere di un corso: ai gomiti dello scafo, e poi ogni quattro metri, sfalsate."""
    xs = [0.0, 1.2, 4.0, 8.0, 12.0]
    x = 12.0 + (2.0 if k % 2 else 4.0) + caso.uniform(-0.4, 0.4)
    while x < 75.6:
        xs.append(x)
        x += caso.choice([4.0, 2.0, 6.0, 8.0], p=[0.62, 0.14, 0.14, 0.10]) + caso.uniform(-0.3, 0.3)
    return xs + [77.0, 80.0]


def vietato(lato, x0, x1, z0, z1):
    """Dove una toppa non si mette: sul portello di carico, sul portello d'uscita, sulla matricola."""
    def tocca(a0, a1, b0, b1):
        return x0 < a1 and x1 > a0 and z0 < b1 and z1 > b0
    if tocca(M.MATRICOLA_FIANCO["x"][0] - 1, M.MATRICOLA_FIANCO["x"][1] + 1, -9, M.MATRICOLA_FIANCO["z"][1] + 0.5):
        return True
    if lato < 0:
        return tocca(M.PORTELLO_DI_CARICO["x"][0] - 1, M.PORTELLO_DI_CARICO["x"][1] + 1, M.PORTELLO_DI_CARICO["z"][0] - 1, M.PORTELLO_DI_CARICO["z"][1] + 1)
    return tocca(M.PORTELLO_USCITA["x"][0] - 1, M.PORTELLO_USCITA["x"][1] + 1, -1, 3.4)


def scafo():
    t = Tela(AS, L)
    for k, (s0, s1, scura) in enumerate(fasce()):
        xs = giunte(k)
        for xa, xb in zip(xs, xs[1:]):
            t.lamiera(riga(s0), riga(s1), colonna(xa), colonna(xb), *tinta_lamiera(scura))
    # le toppe: lamiere più piccole messe sopra, con i loro rivetti fitti; sui fianchi e sul dorso
    for _ in range(46):
        lato = caso.choice([-1, 1, 0], p=[0.4, 0.4, 0.2])
        larga, alta = caso.uniform(0.9, 3.2), caso.uniform(0.6, 1.9)
        x0 = caso.uniform(9, 76)
        if lato:
            z0 = caso.uniform(-0.7, 4.6 - alta)
            if vietato(lato, x0, x0 + larga, z0, z0 + alta):
                continue
            s0, s1 = sorted((P.giro_fianco(lato, z0), P.giro_fianco(lato, z0 + alta)))
        else:
            s0 = P.giro_dorso(caso.uniform(-3.4, 3.4 - alta) + alta)
            s1 = s0 + alta
        tinta, metallo, ruvido, _ = tinta_lamiera(False)
        if caso.random() < 0.5:
            tinta = TOPPE[caso.integers(len(TOPPE))] * caso.uniform(0.92, 1.08)
        t.lamiera(riga(s0), riga(s1), colonna(x0), colonna(x0 + larga), tinta, metallo, ruvido, 0.18, passo=9)
    # le colature stanno sui fianchi e sulle spalle, non sul dorso né sotto
    s = np.arange(AS) / AS * P.GIRO
    colate = np.clip(np.minimum(s - P.S_GINOCCHIO_D, P.S_DORSO - s) / 2.5, 0, 1) + np.clip(np.minimum(s - P.S_SPALLA_S, P.S_FONDO_S - s) / 2.5, 0, 1)
    t.invecchia(np.clip(colate, 0, 1).astype(np.float32))
    anni(t)
    # la matricola, sui due fianchi, sulla fascia scura; le fasce arancioni intorno alle due aperture
    mx, mz1 = sum(M.MATRICOLA_FIANCO["x"]) / 2, M.MATRICOLA_FIANCO["z"][1]
    for lato in (-1, 1):
        sul_fianco(t, matricola(), mx, lato, mz1 - 0.05, VERNICE, 0.14)
    cx0, cx1 = M.PORTELLO_DI_CARICO["x"]
    cz0, cz1 = M.PORTELLO_DI_CARICO["z"]
    stacco, banda = 0.16, 0.32
    f = fascia(cx1 - cx0 + 2 * (stacco + banda), cz1 - cz0 + 2 * (stacco + banda), banda, 0.7)
    sul_fianco(t, f, (cx0 + cx1) / 2, -1, cz1 + stacco + banda, ARANCIONE, 0.2)
    ux0, ux1 = M.PORTELLO_USCITA["x"]
    uz0, uz1 = M.PORTELLO_USCITA["z"]
    stacco, banda = 0.08, 0.2
    f = fascia(ux1 - ux0 + 2 * (stacco + banda), uz1 - uz0 + 2 * (stacco + banda), banda, 0.25)
    sul_fianco(t, f, (ux0 + ux1) / 2, 1, uz1 + stacco + banda, ARANCIONE, 0.2)
    return t


# ============================================================================
#  La piastra di poppa e la faccia del muso
# ============================================================================
def poppa():
    x = M.LUNGHEZZA
    w, su, giu = M.mezza(x), M.dorso(x), M.chiglia(x)
    larga, alta = int(round(2 * w * PX)), int(round((su - giu) * PX))
    t = Tela(alta, larga)

    def r(z):
        return int(round((z - giu) * PX))

    def c(y):
        return int(round((y + w) * PX))
    for z0, z1, ys in ((giu, -0.6, (-w, -2.2, 2.2, w)), (-0.6, 1.9, (-w, -3.3, 0.4, 3.6, w)), (1.9, su, (-w, w))):
        for ya, yb in zip(ys, ys[1:]):
            t.lamiera(r(z0), r(z1), c(ya), c(yb), GRIGIO * caso.uniform(0.9, 1.06), 0.6, caso.uniform(0.5, 0.62), caso.uniform(-0.05, 0.05))
    t.invecchia(np.full(alta, 0.7, np.float32), verso_x=False)
    # il nero del fumo intorno agli scarichi, che sale
    rr, cc = np.mgrid[0:alta, 0:larga].astype(np.float32)
    for y in M.SCARICHI["y"]:
        dz, dy = (rr - r(M.SCARICHI["z"])) / PX, (cc - c(y)) / PX
        fumo = np.exp(-(dy ** 2) / 0.9 - np.where(dz > 0, dz ** 2 / 3.2, dz ** 2 / 0.8))
        t.colore *= (1 - 0.6 * fumo * (0.6 + 0.4 * t.usura))[..., None]
        t.ruvido += 0.2 * fumo
        t.metallo *= 1 - 0.6 * fumo
    # la matricola, ripetuta più piccola (qui la riga 0 è in basso: la maschera si capovolge)
    z0, z1 = M.MATRICOLA_POPPA["z"]
    sopra, sotto = scritta("TSC-1972", 1.05), scritta("SANTA MARIA", 0.55)
    t.vernicia(r(z1) - sopra.shape[0], c(0) - sopra.shape[1] / 2, sopra[::-1], VERNICE, 0.16)
    t.vernicia(r(z0), c(0) - sotto.shape[1] / 2, sotto[::-1], VERNICE, 0.16)
    return t


def muso():
    w, su, giu = M.mezza(0), M.dorso(0), M.chiglia(0)
    larga, alta = int(round(2 * w * PX)), int(round((su - giu) * PX))
    t = Tela(alta, larga)
    t.lamiera(0, alta, 0, larga, GRIGIO * 0.97, 0.6, 0.55, 0.0, rivetti=False)
    # un giro di rivetti intorno all'oblò
    raggio = (M.OBLO["diametro"] / 2 + 0.3) * PX
    for a in np.linspace(0, 2 * np.pi, 28, endpoint=False):
        rr, cc = int((M.OBLO["z"] - giu) * PX + raggio * np.sin(a)), int(w * PX + raggio * np.cos(a))
        t.rivetti[rr:rr + 2, cc:cc + 2] = 1
    t.invecchia(np.ones(alta, np.float32) * 0.6, verso_x=False)
    return t


def main():
    USCITA.mkdir(exist_ok=True)
    foglio = Tela(A, L)
    foglio.colore[:] = GRIGIO
    pezzi = ((scafo(), (0, 0)), (poppa(), (int(P.POPPA_ORIGINE[1]), int(P.POPPA_ORIGINE[0]))), (muso(), (int(P.MUSO_ORIGINE[1]), int(P.MUSO_ORIGINE[0]))))
    for t, (r0, c0) in pezzi:
        for strato in ("colore", "ruvido", "metallo", "rilievo"):
            getattr(foglio, strato)[r0:r0 + t.alta, c0:c0 + t.larga] = getattr(t, strato)
    # si scrive con la riga 0 in alto, come vogliono le immagini
    colore = (np.clip(foglio.colore[::-1], 0, 1) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(colore, "RGB").save(USCITA / "pelle-colore.png")
    for strato in ("ruvido", "metallo"):
        Image.fromarray((np.clip(getattr(foglio, strato)[::-1], 0, 1) * 255 + 0.5).astype(np.uint8), "L").save(USCITA / f"pelle-{strato}.png")
    rilievo = np.clip(sfoca(foglio.rilievo, 0.6)[::-1], 0, 1)
    Image.fromarray((rilievo * 65535 + 0.5).astype(np.uint16)).save(USCITA / "pelle-rilievo.png")
    Image.fromarray(colore, "RGB").resize((L // 2, A // 2), Image.LANCZOS).save(USCITA / "pelle-anteprima.jpg", quality=88)
    print("scritte le quattro immagini della pelle in", USCITA)
    # per l'intro del gioco, che disegna la nave dal vivo: le stesse quattro, a metà misura (circa 4 cm per punto)
    INTRO.mkdir(parents=True, exist_ok=True)
    meta = (L // 2, A // 2)
    Image.fromarray(colore, "RGB").resize(meta, Image.LANCZOS).save(INTRO / "colore.webp", quality=90, method=6)
    for strato in ("ruvido", "metallo"):
        Image.fromarray((np.clip(getattr(foglio, strato)[::-1], 0, 1) * 255 + 0.5).astype(np.uint8), "L").resize(meta, Image.LANCZOS).save(INTRO / f"{strato}.webp", quality=88, method=6)
    Image.fromarray((np.clip(sfoca(foglio.rilievo, 1.2)[::-1], 0, 1) * 255 + 0.5).astype(np.uint8), "L").resize(meta, Image.LANCZOS).save(INTRO / "rilievo.webp", quality=95, method=6)
    print("scritta la tessitura dell'intro in", INTRO)


if __name__ == "__main__":
    main()
