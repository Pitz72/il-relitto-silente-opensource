# poster.py — il poster del Relitto Silente, ripensato come una locandina di cinema (15 novembre 2026, richiesta
# dell'autore: «La composizione è orrenda, il relitto da un verso, la Santa da un'altro»), e tutte le immagini che ne
# discendono.
#
# L'idea: il relitto è troppo grande per il quadro. Ne esce dai bordi e cancella le stelle; se ne vede solo il bordo
# di sotto, una curva lunga. La Santa Maria, piccola, gli va incontro da dietro: l'occhio parte dalla nave, sale
# lungo il fascio del faro, trova la macchia di luce sullo scafo nero e, più in là, il punto verde del seme. Nave,
# fascio e seme stanno su una linea sola, la diagonale che regge il quadro. Nel poster il titolo e i crediti stanno
# sotto, nel cielo vuoto, come nei titoli di testa dell'intro (Newsreader per i nomi, lo stencil per il titolo).
#
# Il poster l'autore l'ha approvato il 15 novembre 2026 ed è il punto di riferimento di tutte le immagini con il
# relitto e la nave: gli altri formati sono la stessa scena, riquadrata. Restano fuori quelle con la sola nave nello
# spazio (l'apertura della home della saga, il suo sfondo).
#
# Tutto in codice: il cielo e il fuso di componi.py, la nave dal render del modello (strumenti/nave/ritratto.py,
# ripresa «verso-il-relitto»), il fascio disegnato qui. Nessuna immagine generata.
#
# Uso (dalla radice del progetto):
#   python strumenti/copertina/poster.py [cartella] [formato …] [--en]
# Senza cartella scrive in grafica/copertine/ relitto-<formato>.png (relitto-<formato>-en.png con --en, per i formati
# con le scritte). I formati:
#   9x16       il poster (1440×2560): titolo, crediti, marchio; è anche la card del Relitto nella home del sito
#   poster     il poster da stampa, 2:3 (2400×3600)
#   21x9       la copertina larga, senza scritte
#   apertura-orizzontale, apertura-verticale   le aperture del sottosito del Relitto, senza scritte: la scena sta
#              dove la pagina non scrive il suo titolo
#   16x9       lo sfondo da scrivania (2752×1536), con il titolo in alto a sinistra sul nero del relitto
#   anteprima  lo stesso, con il titolo più grande e senza la riga: le anteprime social del sito (tagliate a 1200×630)
#   social     l'anteprima del repository (1280×640)
import json
import math
import os
import sys
import tempfile

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import distance_transform_edt, gaussian_filter

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, QUI)
import componi as c  # noqa: E402

RADICE = c.RADICE
NAVE = os.path.join(RADICE, "grafica", "nave", "santa-maria-verso-il-relitto.webp")
PUNTI = os.path.join(RADICE, "grafica", "nave", "santa-maria-verso-il-relitto.json")
FARO = np.array([1.0, 0.93, 0.80], np.float32)  # la luce calda della lampada, contro il cielo freddo

TESTI = {
    "it": dict(presenta=("RUNTIME MULTIMEDIA", "presenta"), righe=["IL RELITTO", "SILENTE"],
               riga="Una storia tratta dal libro Dal Registro della Santa Maria",
               crediti=[[("un gioco di", "SIMONE PIZZI")],
                        [("tema musicale originale di", "ALIRIO BRUNI")],
                        [("", "LEONARDO TOMASSETTI"), ("è William T. Eriksonn", "")],
                        [("produttore esecutivo", "MICHELA DE PAOLA")]]),
    "en": dict(presenta=("RUNTIME MULTIMEDIA", "presents"), righe=["THE SILENT", "WRECK"],
               riga="A story from the book Dal Registro della Santa Maria",
               crediti=[[("a game by", "SIMONE PIZZI")],
                        [("original theme by", "ALIRIO BRUNI")],
                        [("", "LEONARDO TOMASSETTI"), ("is William T. Eriksonn", "")],
                        [("executive producer", "MICHELA DE PAOLA")]]),
}

# Le misure sono frazioni del quadro. Il fuso si dà in uno dei due modi: p0, p1 e h come in componi.py (il poster
# approvato), oppure «bordo»: il punto più basso del bordo, la pendenza in gradi (sale verso destra) e lo spessore.
# nave: dove sta il suo angolo in alto a sinistra e quanto è larga; seme: il punto verde; colpo, se manca, si calcola:
# dove la linea dal faro al seme entra nel relitto, poco dentro.
FORMATI = {
    "9x16": dict(L=1440, A=2560, p0=(-3.20, 0.181), p1=(3.51, -0.83), h=0.75, via=-62,
                 nave=(0.10, 0.50, 0.38), colpo=(0.585, 0.372), seme=(0.727, 0.241), testo="poster",
                 presenta=0.052, titolo=0.735, lettere=0.050, crediti=0.878, logo=0.17, marchio=0.935),
    "poster": dict(L=2400, A=3600, bordo=(0.50, 0.405, 15, 0.75), via=-58, cielo=0.6,
                   nave=(0.13, 0.485, 0.36), seme=(0.715, 0.235), testo="poster",
                   presenta=0.050, titolo=0.742, lettere=0.050, crediti=0.880, logo=0.15, marchio=0.932),
    "21x9": dict(L=3440, A=1440, bordo=(0.58, 0.40, 8, 1.2), via=-22,
                 nave=(0.20, 0.63, 0.13), seme=(0.56, 0.17)),
    "16x9": dict(L=2752, A=1536, bordo=(0.56, 0.42, 10, 1.1), via=-28,
                 nave=(0.15, 0.63, 0.18), seme=(0.62, 0.20), testo="sfondo", titolo=(0.055, 0.17, 0.062), riga=0.020),
    "anteprima": dict(L=2752, A=1536, bordo=(0.56, 0.42, 10, 1.1), via=-28,
                      nave=(0.15, 0.63, 0.18), seme=(0.71, 0.24), testo="sfondo", titolo=(0.07, 0.24, 0.072), riga=0.0),
    "social": dict(L=1280, A=640, bordo=(0.57, 0.43, 10, 1.1), via=-28,
                   nave=(0.16, 0.63, 0.18), seme=(0.72, 0.25), testo="sfondo", titolo=(0.05, 0.19, 0.072), riga=0.024),
}
# Le aperture del sottosito del Relitto: la pagina scrive il suo titolo a sinistra e in basso e scurisce quei lati
# (RelittoPagina.astro, .apertura-velo), quindi la scena sta dove la pagina la lascia libera: da computer nel terzo di
# destra, da telefono nella parte alta, sopra il titolo.
FORMATI["apertura-orizzontale"] = dict(L=3440, A=1440, bordo=(0.62, 0.42, 8, 1.2), via=-22,
                                       nave=(0.725, 0.47, 0.12), seme=(0.94, 0.17))
FORMATI["apertura-verticale"] = dict(L=1440, A=2560, bordo=(0.50, 0.255, 15, 0.75), via=-62,
                                     nave=(0.10, 0.30, 0.40), seme=(0.64, 0.205))


def newsreader(px, corsivo=False, peso=300):
    nome = "newsreader-latin-wght-italic.woff2" if corsivo else "newsreader-latin-wght-normal.woff2"
    dest = os.path.join(tempfile.gettempdir(), "relitto-poster-" + nome.replace(".woff2", ".ttf"))
    if not os.path.isfile(dest):
        f = TTFont(os.path.join(c.FONT, "newsreader", "files", nome))
        f.flavor = None
        f.save(dest)
    return c.font(dest, px, peso)


def geometria(s):
    """Il fuso dato come lo si vede (il punto più basso del bordo, la pendenza, lo spessore) diventa i due punti e la
    mezza altezza di componi.py, con le punte lontanissime: nel quadro il bordo è una curva lunga e dolce."""
    if "bordo" not in s:
        return s
    L, A = s["L"], s["A"]
    ax, ay, gradi, h = s["bordo"]
    a = math.radians(gradi)
    u, n = (math.cos(a), -math.sin(a)), (math.sin(a), math.cos(a))
    cx, cy = ax * L - n[0] * h * A, ay * A - n[1] * h * A
    lc = 4 * max(L, A)
    return dict(s, h=h, p0=((cx - u[0] * lc) / L, (cy - u[1] * lc) / A), p1=((cx + u[0] * lc) / L, (cy + u[1] * lc) / A))


def maschera_fuso(s):
    L, A = s["L"], s["A"]
    sovra = 2
    m = Image.new("L", (L * sovra, A * sovra), 0)
    p0, p1 = (s["p0"][0] * L, s["p0"][1] * A), (s["p1"][0] * L, s["p1"][1] * A)
    ImageDraw.Draw(m).polygon(c.fuso_poligono(p0, p1, s["h"] * A, sovra), fill=255)
    return np.asarray(m.resize((L, A), Image.LANCZOS), np.float32) / 255


def cielo(s, caso):
    """Il cielo di componi.py, senza il suo seme. I formati grandi lo disegnano più piccolo e lo ingrandiscono: la
    Via Lattea di componi.py ha la grana a una scala fissa, e a 2400 punti di larghezza verrebbe a chiazze."""
    k = s.get("cielo", 1.0)
    img, _ = c.cielo(dict(s, L=int(s["L"] * k), A=int(s["A"] * k), seme=-5.0), caso)
    if k != 1.0:
        img = np.asarray(Image.fromarray((img * 255 + 0.5).astype(np.uint8)).resize((s["L"], s["A"]), Image.LANCZOS), np.float32) / 255
    return img


def metti_nave(img, s):
    """La nave, e dove le restano il faro e gli scarichi nel quadro."""
    L, A = s["L"], s["A"]
    nave = Image.open(NAVE).convert("RGBA")
    punti = json.load(open(PUNTI, encoding="utf-8"))
    larghezza = int(s["nave"][2] * L)
    k = larghezza / nave.width
    alt = int(nave.height * k)
    nave = nave.resize((larghezza, alt), Image.LANCZOS)
    x, y = int(s["nave"][0] * L), int(s["nave"][1] * A)
    a = np.asarray(nave, np.float32) / 255
    rgb, alpha = a[..., :3], a[..., 3:]
    zona = img[y:y + alt, x:x + larghezza]
    img[y:y + alt, x:x + larghezza] = zona * (1 - alpha) + rgb * alpha
    faro = (x + punti["faro"][0] * k, y + punti["faro"][1] * k)
    scarichi = [(x + q[0] * k, y + q[1] * k) for q in punti["scarichi"]]
    return img, faro, scarichi


def colpo(s, faro, maschera):
    """Dove il fascio tocca lo scafo, se il formato non lo dice: sulla linea dal faro al seme, poco dentro il bordo."""
    if "colpo" in s:
        return s
    L, A = s["L"], s["A"]
    sx, sy = s["seme"][0] * L, s["seme"][1] * A
    lung = math.hypot(sx - faro[0], sy - faro[1])
    for k in np.linspace(0, 1, 4000):
        x, y = faro[0] + (sx - faro[0]) * k, faro[1] + (sy - faro[1]) * k
        if maschera[int(y), int(x)] > 0.5:
            k = min(k + 0.028 * A / lung, 0.8)
            return dict(s, colpo=((faro[0] + (sx - faro[0]) * k) / L, (faro[1] + (sy - faro[1]) * k) / A))
    raise ValueError("il fascio non arriva al relitto: sposta il seme o il bordo")


def fascio(img, s, faro, maschera):
    """Il fascio del faro: un cono di luce calda, tenue, che sale fino allo scafo nero; dove lo tocca, una macchia
    di luce che mostra che il nero è una superficie, e ne fa affiorare le costole. Il seme resta più in là."""
    L, A = s["L"], s["A"]
    yy, xx = np.mgrid[0:A, 0:L].astype(np.float32)
    fx, fy = faro
    cx, cy = s["colpo"][0] * L, s["colpo"][1] * A
    lung = math.hypot(cx - fx, cy - fy)
    ux, uy = (cx - fx) / lung, (cy - fy) / lung
    t = ((xx - fx) * ux + (yy - fy) * uy) / lung          # 0 alla lampada, 1 sullo scafo
    d = np.abs(-(xx - fx) * uy + (yy - fy) * ux)           # quanto si è lontani dall'asse
    scala = min(L, A) / 1440                               # le misure del poster, a qualunque formato
    larghezza = 0.004 * 1440 * scala + np.clip(t, 0, None) * lung * math.tan(math.radians(4.2))
    cono = np.exp(-(d / larghezza) ** 2 * 1.6) * (t > 0)
    lungo = np.exp(-np.clip(t, 0, None) * 0.7) * (t < 1.02)
    # il fascio passa davanti allo scafo nero fino al punto che tocca: si vede anche dentro la sagoma
    volume = cono * lungo * 0.42
    # la macchia: la luce arriva radente, si allunga in avanti nel verso del fascio e si spegne verso il seme
    pu = (xx - cx) * ux + (yy - cy) * uy
    pv = -(xx - cx) * uy + (yy - cy) * ux
    r = lung * math.tan(math.radians(4.2)) + 0.004 * 1440 * scala
    avanti = np.where(pu > 0, r * 2.6, r * 0.7)
    macchia = np.exp(-((pu / avanti) ** 2 + (pv / (r * 1.05)) ** 2) * 1.6)
    caso = np.random.default_rng(72)
    grana = gaussian_filter(caso.random((A // 6 + 1, L // 6 + 1)).astype(np.float32), 1.2)
    grana = np.asarray(Image.fromarray((grana * 255).astype(np.uint8)).resize((L, A), Image.BICUBIC), np.float32) / 255
    # le costole del relitto: fasce parallele al suo bordo, che la luce fa affiorare
    dentro = distance_transform_edt(maschera > 0.5)
    costole = (0.5 + 0.5 * np.cos((dentro / (0.0048 * 2560 * scala) + 0.6 * grana) * 2 * math.pi)) ** 2
    superficie = macchia * maschera * (0.50 + 0.22 * grana + 0.28 * costole) * 0.55
    img = img + (volume + superficie)[..., None] * FARO[None, None, :] * np.array([0.92, 0.94, 1.0])[None, None, :]
    # la lampada stessa: un punto vivo con un alone stretto
    d2 = (xx - fx) ** 2 + (yy - fy) ** 2
    rr = 0.0022 * 1440 * scala
    img += (np.exp(-d2 / (2 * rr ** 2)) * 1.2 + 0.25 * np.exp(-d2 / (2 * (rr * 5) ** 2)))[..., None] * FARO[None, None, :]
    return img


def brace(img, s, scarichi):
    """I reattori spenti: resta la brace, un rosso cupo appena acceso in fondo agli scarichi (documento 40)."""
    L, A = s["L"], s["A"]
    yy, xx = np.mgrid[0:A, 0:L].astype(np.float32)
    rosso = np.array([1.0, 0.36, 0.14], np.float32)
    rr = 0.0024 * 1440 * (s["nave"][2] * L) / (0.38 * 1440)  # come nel poster, in proporzione alla nave
    for x, y in scarichi:
        d2 = (xx - x) ** 2 + (yy - y) ** 2
        img += (0.55 * np.exp(-d2 / (2 * rr ** 2)) + 0.10 * np.exp(-d2 / (2 * (rr * 4) ** 2)))[..., None] * rosso[None, None, :]
    return img


def bordo(img, s, maschera):
    """Il bordo del relitto: un filo di luce fredda, il riflesso delle stelle sulla sua pelle, più vivo verso destra
    (dove il cielo è più fitto); così il nero si legge come un oggetto e non come un buco."""
    L, A = s["L"], s["A"]
    scala = min(L, A) / 1440
    dentro = distance_transform_edt(maschera > 0.5)
    xx = np.arange(L, dtype=np.float32)[None, :] / L
    filo = np.exp(-dentro / (0.0016 * 2560 * scala)) * (maschera > 0.5) * (0.35 + 0.65 * xx)
    alone = np.exp(-dentro / (0.02 * 2560 * scala)) * (maschera > 0.5) * 0.10 * (0.3 + 0.7 * xx)
    return img + (filo * 0.30 + alone * 0.25)[..., None] * (c.ACCIAIO * 1.6)[None, None, :]


def seme(img, s):
    L, A = s["L"], s["A"]
    yy, xx = np.mgrid[0:A, 0:L].astype(np.float32)
    d2 = (xx - s["seme"][0] * L) ** 2 + (yy - s["seme"][1] * A) ** 2
    r = max(2.2, 0.0032 * min(L, A))
    img += np.exp(-d2 / (2 * (r * 0.55) ** 2))[..., None] * c.SEME[None, None, :]
    img += (0.20 * np.exp(-d2 / (2 * (r * 5.0) ** 2)))[..., None] * c.SEME[None, None, :]
    return img


def ombreggia(pil, strato, px):
    """Un'ombra morbida sotto le lettere, perché si leggano anche sulle stelle."""
    ombra = strato.filter(ImageFilter.GaussianBlur(px * 0.10))
    nero = Image.new("RGBA", pil.size, (0, 0, 0, 0))
    nero.putalpha(ombra.getchannel("A").point(lambda v: int(v * 0.6)))
    pil = Image.alpha_composite(Image.alpha_composite(pil, nero), strato)
    return np.asarray(pil.convert("RGB"), np.float32) / 255


def scritte(img, s, t):
    """Il poster: chi presenta in alto, il titolo, la riga del libro, i crediti come il blocco di una locandina."""
    L, A = s["L"], s["A"]
    tipi = c.caratteri()
    pil = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).convert("RGBA")
    strato = Image.new("RGBA", pil.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(strato)
    nome_c = (233, 236, 234, 255)
    ruolo_c = (169, 177, 173, 255)

    def riga_crediti(y, pezzi, g_px, p_px):
        """Una riga di crediti centrata: il ruolo in corsivo minuscolo tenue, il nome in tondo maiuscolo spaziato."""
        fp, fg = newsreader(p_px, True, 300), newsreader(g_px, False, 300)
        spazio = g_px * 0.30
        parti = []
        for j, (ruolo, nome) in enumerate(pezzi):
            # fra un credito e l'altro un punto mediano; «è William…» resta attaccato al nome che lo precede
            if j and (nome or ruolo.split()[0] not in ("è", "is")):
                parti.append(("s", "·"))
            if ruolo:
                parti.append(("p", ruolo))
            if nome:
                parti.append(("g", nome))
        larg = [d.textlength(x, font=fp) if tipo in "ps" else sum(d.textlength(ch, font=fg) for ch in x) + spazio * (len(x) - 1)
                for tipo, x in parti]
        gap = g_px * 0.55
        tot = sum(larg) + gap * (len(parti) - 1) + gap * sum(1 for tp, _ in parti if tp == "s")
        if tot > 0.86 * L:  # troppo larga: la stessa riga, più piccola
            return riga_crediti(y, pezzi, g_px * 0.86 * L / tot, p_px * 0.86 * L / tot)
        x = (L - tot) / 2
        for (tipo, testo), w in zip(parti, larg):
            if tipo == "p":
                d.text((x, y), testo, font=fp, fill=ruolo_c, anchor="ls")
            elif tipo == "s":
                d.text((x + gap * 0.5, y), testo, font=fp, fill=ruolo_c, anchor="ls")
                x += gap
            else:
                c.testo_con_spazio(d, (x, y), testo, fg, nome_c, spazio, "sx")
            x += w + gap

    # in alto, sul nero del relitto: chi presenta («presenta» in corsivo, accanto al nome)
    g = s["lettere"] * A * 0.36
    fp, fg, sp = newsreader(g * 1.05, True, 300), newsreader(g, False, 300), g * 0.30
    w_nome = sum(d.textlength(ch, font=fg) for ch in t["presenta"][0]) + sp * (len(t["presenta"][0]) - 1)
    w_p = d.textlength(t["presenta"][1], font=fp)
    x0 = (L - (w_nome + g * 0.55 + w_p)) / 2
    c.testo_con_spazio(d, (x0, s["presenta"] * A), t["presenta"][0], fg, nome_c, sp, "sx")
    d.text((x0 + w_nome + g * 0.55, s["presenta"] * A), t["presenta"][1], font=fp, fill=ruolo_c, anchor="ls")

    # il titolo, in stencil, su due righe; il filo verde del seme e la riga del libro
    px = s["lettere"] * A
    f = c.font(tipi["stencil"], px * 1.34, 800)
    freddo = tuple(int(v * 255) for v in c.FREDDO) + (255,)
    y = s["titolo"] * A
    for i, p in enumerate(t["righe"]):
        c.testo_con_spazio(d, (L / 2, y + i * px * 1.18), p, f, freddo, px * 0.17, "c")
    sotto = y + px * 1.18
    verde = tuple(int(v * 255) for v in c.SEME) + (255,)
    d.line([(L / 2 - px * 0.55, sotto + px * 0.36), (L / 2 + px * 0.55, sotto + px * 0.36)], fill=verde, width=max(2, int(px * 0.04)))
    fr = newsreader(px * 0.30, True, 350)
    d.text((L / 2, sotto + px * 0.86), t["riga"], font=fr, fill=tuple(int(v * 255) for v in c.FREDDO * 0.70) + (255,), anchor="ms")

    # i crediti: il gioco e la voce di William, poi il tema e il produttore
    g2 = px * 0.24
    y = s["crediti"] * A
    for i, pezzi in enumerate([t["crediti"][0] + t["crediti"][2], t["crediti"][1] + t["crediti"][3]]):
        riga_crediti(y + i * g2 * 2.0, pezzi, g2, g2 * 1.1)
    return ombreggia(pil, strato, px)


def scritte_sfondo(img, s, t):
    """I formati orizzontali: il titolo su una riga in alto a sinistra, sul nero del relitto; sotto, il filo verde e
    la riga del libro (l'anteprima ha solo il filo)."""
    L, A = s["L"], s["A"]
    tipi = c.caratteri()
    pil = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).convert("RGBA")
    strato = Image.new("RGBA", pil.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(strato)
    x, y, ah = s["titolo"]
    x, y, px = x * L, y * A, ah * A
    f = c.font(tipi["stencil"], px * 1.34, 800)
    c.testo_con_spazio(d, (x, y), " ".join(t["righe"]), f, tuple(int(v * 255) for v in c.FREDDO) + (255,), px * 0.2, "sx")
    verde = tuple(int(v * 255) for v in c.SEME) + (255,)
    d.line([(x, y + px * 0.30), (x + px * 1.1, y + px * 0.30)], fill=verde, width=max(2, int(px * 0.045)))
    if s.get("riga"):
        fr = newsreader(s["riga"] * A * 1.05, True, 350)
        d.text((x, y + px * 0.80), t["riga"], font=fr, fill=tuple(int(v * 255) for v in c.FREDDO * 0.70) + (255,), anchor="ls")
    return ombreggia(pil, strato, px * 1.2)


def logo(img, s):
    """Il marchio di Runtime Multimedia, in fondo al centro, sotto i crediti."""
    L, A = s["L"], s["A"]
    lg = Image.open(c.LOGO_RUNTIME).convert("RGBA")
    lg = lg.crop(lg.getchannel("A").getbbox())
    larghezza = int(s["logo"] * L)
    lg = lg.resize((larghezza, int(lg.height * larghezza / lg.width)), Image.LANCZOS)
    b = np.asarray(lg, np.float32) / 255
    x, y = int((L - larghezza) / 2), int(s["marchio"] * A)
    zona = img[y:y + b.shape[0], x:x + b.shape[1]]
    img[y:y + b.shape[0], x:x + b.shape[1]] = zona * (1 - b[..., 3:]) + b[..., :3] * b[..., 3:]
    return img


def componi(nome, lingua, uscita):
    s = geometria(dict(FORMATI[nome]))
    caso = np.random.default_rng(1972)
    img = cielo(s, caso)  # il seme lo mette questo script, sulla linea del fascio
    maschera = maschera_fuso(s)
    img = bordo(img, s, maschera)
    img, faro, scarichi = metti_nave(img, s)
    s = colpo(s, faro, maschera)
    img = fascio(img, s, faro, maschera)
    img = brace(img, s, scarichi)
    img = seme(img, s)
    if s.get("testo") == "poster":
        img = scritte(img, s, TESTI[lingua])
        img = logo(img, s)
    elif s.get("testo") == "sfondo":
        img = scritte_sfondo(img, s, TESTI[lingua])
    img = c.finitura(np.clip(img, 0, 1), caso)
    suffisso = "-en" if lingua == "en" and s.get("testo") else ""
    percorso = os.path.join(uscita, f"relitto-{nome}{suffisso}.png")
    Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(percorso, optimize=True)
    print(f"{percorso}  {s['L']}×{s['A']}")
    return percorso


if __name__ == "__main__":
    argomenti = [a for a in sys.argv[1:] if not a.startswith("--")]
    uscita = argomenti.pop(0) if argomenti and argomenti[0] not in FORMATI else c.USCITA
    nomi = argomenti or list(FORMATI)
    os.makedirs(uscita, exist_ok=True)
    for n in nomi:
        componi(n, "en" if "--en" in sys.argv else "it", uscita)
