# poster.py — il poster del Relitto Silente, ripensato come una locandina di cinema (15 novembre 2026, richiesta
# dell'autore: «La composizione è orrenda, il relitto da un verso, la Santa da un'altro»).
#
# L'idea: il relitto è troppo grande per il quadro. Ne esce da tre lati e cancella le stelle; se ne vede solo il
# bordo di sotto, una curva lunga. La Santa Maria, piccola, gli va incontro da dietro: l'occhio parte dalla nave,
# sale lungo il fascio del faro, trova la macchia di luce sullo scafo nero e, più in là, il punto verde del seme.
# Nave, fascio e seme stanno su una linea sola, la diagonale che regge il quadro. Il titolo e i crediti stanno sotto,
# nel cielo vuoto, come nei titoli di testa dell'intro (Newsreader per i nomi, lo stencil per il titolo).
#
# Tutto in codice: il cielo e il fuso di componi.py, la nave dal render del modello (strumenti/nave/ritratto.py,
# ripresa «verso-il-relitto»), il fascio disegnato qui. Nessuna immagine generata.
#
# Uso (dalla radice del progetto):
#   python strumenti/copertina/poster.py [cartella] [9x16|2x3 …] [--en]
# Senza cartella scrive in grafica/copertine/ relitto-poster-9x16.png (1440×2560) e relitto-poster-2x3.png (2400×3600).
import math
import os
import sys
import tempfile

import numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy.ndimage import gaussian_filter

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

# Le misure sono frazioni del quadro. fuso: i due punti e la mezza altezza (componi.py), scelti perché del fuso si veda
# solo il bordo di sotto; nave: dove sta il suo angolo in alto a sinistra e quanto è larga; colpo: dove il fascio tocca
# lo scafo; seme: il punto verde, più in là sulla stessa linea.
FORMATI = {
    "9x16": dict(L=1440, A=2560, p0=(-3.20, 0.181), p1=(3.51, -0.83), h=0.75, via=-62,
                 nave=(0.10, 0.50, 0.38), colpo=(0.585, 0.372), seme=(0.727, 0.241),
                 presenta=0.052, titolo=0.735, lettere=0.050, crediti=0.878, logo=0.17, marchio=0.935),
    "2x3": dict(L=2400, A=3600, p0=(-2.20, 0.181), p1=(2.51, -0.70), h=0.70, via=-58,
                nave=(0.12, 0.47, 0.34), colpo=(0.58, 0.36), seme=(0.70, 0.23),
                presenta=0.050, titolo=0.735, lettere=0.052, crediti=0.868, logo=0.15, marchio=0.930),
}


def newsreader(px, corsivo=False, peso=300):
    nome = "newsreader-latin-wght-italic.woff2" if corsivo else "newsreader-latin-wght-normal.woff2"
    dest = os.path.join(tempfile.gettempdir(), "relitto-poster-" + nome.replace(".woff2", ".ttf"))
    if not os.path.isfile(dest):
        f = TTFont(os.path.join(c.FONT, "newsreader", "files", nome))
        f.flavor = None
        f.save(dest)
    return c.font(dest, px, peso)


def maschera_fuso(s):
    L, A = s["L"], s["A"]
    sovra = 2
    m = Image.new("L", (L * sovra, A * sovra), 0)
    p0, p1 = (s["p0"][0] * L, s["p0"][1] * A), (s["p1"][0] * L, s["p1"][1] * A)
    ImageDraw.Draw(m).polygon(c.fuso_poligono(p0, p1, s["h"] * A, sovra), fill=255)
    return np.asarray(m.resize((L, A), Image.LANCZOS), np.float32) / 255


def metti_nave(img, s):
    """La nave, e dove le restano il faro e gli scarichi nel quadro."""
    import json
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


def fascio(img, s, faro, maschera):
    """Il fascio del faro: un cono di luce calda, tenue, che sale fino allo scafo nero; dove lo tocca, una macchia
    di luce che mostra che il nero è una superficie, con una grana appena accennata. Il seme resta più in là."""
    L, A = s["L"], s["A"]
    yy, xx = np.mgrid[0:A, 0:L].astype(np.float32)
    fx, fy = faro
    cx, cy = s["colpo"][0] * L, s["colpo"][1] * A
    lung = math.hypot(cx - fx, cy - fy)
    ux, uy = (cx - fx) / lung, (cy - fy) / lung
    t = ((xx - fx) * ux + (yy - fy) * uy) / lung          # 0 alla lampada, 1 sullo scafo
    d = np.abs(-(xx - fx) * uy + (yy - fy) * ux)           # quanto si è lontani dall'asse
    larghezza = 0.004 * L + np.clip(t, 0, None) * lung * math.tan(math.radians(4.2))
    cono = np.exp(-(d / larghezza) ** 2 * 1.6) * (t > 0)
    lungo = np.exp(-np.clip(t, 0, None) * 0.7) * (t < 1.02)
    # il fascio passa davanti allo scafo nero fino al punto che tocca: si vede anche dentro la sagoma
    volume = cono * lungo * 0.42
    # la macchia sullo scafo: un'ellisse coricata di traverso al fascio, con la grana della superficie
    pu = (xx - cx) * ux + (yy - cy) * uy
    pv = -(xx - cx) * uy + (yy - cy) * ux
    r = lung * math.tan(math.radians(4.2)) + 0.004 * L
    # la luce arriva radente: la macchia si allunga in avanti, nel verso del fascio, e si spegne verso il seme
    avanti = np.where(pu > 0, r * 2.6, r * 0.7)
    macchia = np.exp(-((pu / avanti) ** 2 + (pv / (r * 1.05)) ** 2) * 1.6)
    caso = np.random.default_rng(72)
    grana = gaussian_filter(caso.random((A // 6 + 1, L // 6 + 1)).astype(np.float32), 1.2)
    grana = np.asarray(Image.fromarray((grana * 255).astype(np.uint8)).resize((L, A), Image.BICUBIC), np.float32) / 255
    # le costole del relitto: fasce parallele al suo bordo, che la luce fa affiorare
    from scipy.ndimage import distance_transform_edt
    dentro = distance_transform_edt(maschera > 0.5)
    costole = (0.5 + 0.5 * np.cos((dentro / (0.0048 * A) + 0.6 * grana) * 2 * math.pi)) ** 2
    superficie = macchia * maschera * (0.50 + 0.22 * grana + 0.28 * costole) * 0.55
    img = img + (volume + superficie)[..., None] * FARO[None, None, :] * np.array([0.92, 0.94, 1.0])[None, None, :]
    # la lampada stessa: un punto vivo con un alone stretto
    d2 = (xx - fx) ** 2 + (yy - fy) ** 2
    rr = 0.0022 * L
    img += (np.exp(-d2 / (2 * rr ** 2)) * 1.2 + 0.25 * np.exp(-d2 / (2 * (rr * 5) ** 2)))[..., None] * FARO[None, None, :]
    return img


def brace(img, s, scarichi):
    """I reattori spenti: resta la brace, un rosso cupo appena acceso in fondo agli scarichi (documento 40)."""
    L, A = s["L"], s["A"]
    yy, xx = np.mgrid[0:A, 0:L].astype(np.float32)
    rosso = np.array([1.0, 0.36, 0.14], np.float32)
    for x, y in scarichi:
        d2 = (xx - x) ** 2 + (yy - y) ** 2
        rr = 0.0024 * L
        img += (0.55 * np.exp(-d2 / (2 * rr ** 2)) + 0.10 * np.exp(-d2 / (2 * (rr * 4) ** 2)))[..., None] * rosso[None, None, :]
    return img


def bordo(img, s, maschera):
    """Il bordo del relitto: un filo di luce fredda, il riflesso delle stelle sulla sua pelle, più vivo verso destra
    (dove il cielo è più fitto); così il nero si legge come un oggetto e non come un buco."""
    from scipy.ndimage import distance_transform_edt
    L, A = s["L"], s["A"]
    dentro = distance_transform_edt(maschera > 0.5)
    xx = np.arange(L, dtype=np.float32)[None, :] / L
    filo = np.exp(-dentro / (0.0016 * A)) * (maschera > 0.5) * (0.35 + 0.65 * xx)
    alone = np.exp(-dentro / (0.02 * A)) * (maschera > 0.5) * 0.10 * (0.3 + 0.7 * xx)
    return img + (filo * 0.30 + alone * 0.25)[..., None] * (c.ACCIAIO * 1.6)[None, None, :]


def seme(img, s):
    L, A = s["L"], s["A"]
    yy, xx = np.mgrid[0:A, 0:L].astype(np.float32)
    d2 = (xx - s["seme"][0] * L) ** 2 + (yy - s["seme"][1] * A) ** 2
    r = max(2.2, 0.0032 * L)
    img += np.exp(-d2 / (2 * (r * 0.55) ** 2))[..., None] * c.SEME[None, None, :]
    img += (0.20 * np.exp(-d2 / (2 * (r * 5.0) ** 2)))[..., None] * c.SEME[None, None, :]
    return img


def scritte(img, s, t):
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
            # fra un credito e l'altro un punto mediano, come nel blocco di una locandina
            if j and ruolo and not ruolo[0].islower() or (j and nome and not ruolo):
                parti.append(("s", "·"))
            elif j and ruolo and ruolo.split()[0] not in ("è", "is"):
                parti.append(("s", "·"))
            if ruolo:
                parti.append(("p", ruolo))
            if nome:
                parti.append(("g", nome))
        larg = []
        for tipo, testo in parti:
            if tipo in "ps":
                larg.append(d.textlength(testo, font=fp))
            else:
                larg.append(sum(d.textlength(ch, font=fg) for ch in testo) + spazio * (len(testo) - 1))
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
    fp = newsreader(g * 1.05, True, 300)
    fg = newsreader(g, False, 300)
    sp = g * 0.30
    w_nome = sum(d.textlength(ch, font=fg) for ch in t["presenta"][0]) + sp * (len(t["presenta"][0]) - 1)
    w_p = d.textlength(t["presenta"][1], font=fp)
    x0 = (L - (w_nome + g * 0.55 + w_p)) / 2
    c.testo_con_spazio(d, (x0, s["presenta"] * A), t["presenta"][0], fg, nome_c, sp, "sx")
    d.text((x0 + w_nome + g * 0.55, s["presenta"] * A), t["presenta"][1], font=fp, fill=ruolo_c, anchor="ls")

    # il titolo, in stencil, su due righe
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

    # i crediti, come il blocco di una locandina: il gioco e la voce di William, poi il tema e il produttore
    g2 = px * 0.24
    y = s["crediti"] * A
    righe = [t["crediti"][0] + t["crediti"][2], t["crediti"][1] + t["crediti"][3]]
    for i, pezzi in enumerate(righe):
        riga_crediti(y + i * g2 * 2.0, pezzi, g2, g2 * 1.1)

    ombra = strato.filter(ImageFilter.GaussianBlur(px * 0.10))
    nero = Image.new("RGBA", pil.size, (0, 0, 0, 0))
    nero.putalpha(ombra.getchannel("A").point(lambda v: int(v * 0.6)))
    pil = Image.alpha_composite(Image.alpha_composite(pil, nero), strato)
    return np.asarray(pil.convert("RGB"), np.float32) / 255


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
    s = dict(FORMATI[nome])
    caso = np.random.default_rng(1972)
    # il cielo e il fuso di componi.py; il seme lo mette questo script, sulla linea del fascio (fuori dal quadro lì)
    cielo = dict(s, seme=-5.0)
    img, _ = c.cielo(cielo, caso)
    maschera = maschera_fuso(s)
    img = bordo(img, s, maschera)
    img, faro, scarichi = metti_nave(img, s)
    img = fascio(img, s, faro, maschera)
    img = brace(img, s, scarichi)
    img = seme(img, s)
    img = scritte(img, s, TESTI[lingua])
    img = logo(img, s)
    img = c.finitura(np.clip(img, 0, 1), caso)
    suffisso = "" if lingua == "it" else "-en"
    percorso = os.path.join(uscita, f"relitto-poster-{nome}{suffisso}.png")
    Image.fromarray((img * 255 + 0.5).astype(np.uint8)).save(percorso, optimize=True)
    print(f"{percorso}  {s['L']}×{s['A']}")
    return percorso


if __name__ == "__main__":
    argomenti = [a for a in sys.argv[1:] if not a.startswith("--")]
    uscita = argomenti[0] if argomenti and not argomenti[0] in FORMATI else c.USCITA
    nomi = [a for a in argomenti if a in FORMATI] or list(FORMATI)
    os.makedirs(uscita, exist_ok=True)
    for n in nomi:
        componi(n, "en" if "--en" in sys.argv else "it", uscita)
