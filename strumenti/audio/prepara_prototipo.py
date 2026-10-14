# Prepara i suoni del prototipo dei tre ambienti (bibbia sonora, §8) a partire
# dalle sorgenti in audio/sorgenti/ (fuori da git, elencate in audio/LICENZE.md).
#
#   python -P strumenti/audio/prepara_prototipo.py
#
# Esce in app/src-tauri/risorse/audio/prototipo/: Ogg Vorbis a 48 kHz (le voci del
# brusio a 24 kHz, mono), più indice.json con l’elenco dei file e da dove vengono.
# Le scelte (tratti, tagli, filtri) vengono dall’ascolto delle sorgenti e dalla loro
# analisi: le righe tonali delle pompe e della ventola, i cicli dei respiri.
import glob
import os
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from scipy import signal

import comune as c

RADICE = Path(__file__).resolve().parents[2]
SORGENTI = RADICE / "audio" / "sorgenti"
USCITA = RADICE / "app" / "src-tauri" / "risorse" / "audio" / "prototipo"
indice = {}


def sorgente(cartella):
    return glob.glob(str(SORGENTI / cartella / "*"))[0]


def esporta(nome, x, origine, sr=c.SR, qualita=5):
    p = USCITA / nome
    p.parent.mkdir(parents=True, exist_ok=True)
    c.scrivi(p, x, sr, qualita)
    indice[nome] = {"origine": origine, "secondi": round(len(x) / sr, 3), "lufs": round(c.lufs(x, sr), 1)}


def mono(x):
    return x.mean(axis=1).astype(np.float32)


# --- i letti: anelli lunghi, ripuliti ---------------------------------------------------------
def letti():
    # P2, la ventilazione: il tratto più fermo è l’inizio (alla fine c’è uno scatto). Si toglie
    # il rombo a 32 Hz e si dà il colore di una bocchetta piccola.
    x = c.leggi(sorgente("freesound/166014"))
    x = x[: int(75 * c.SR)]
    rete = [c.biquad("notch", f, 10) for f in (60.0, 120.1, 180.0, 240.0)]   # il ronzio di rete (60 Hz, registrata in America)
    x = c.filtra(x, c.biquad("passaalto", 45, 0.7), c.biquad("notch", 32.2, 4), *rete, c.biquad("picco", 2500, 1.0, 3.0))
    esporta("letti/ventilazione.ogg", c.a_lufs(c.anello(x, 61, dissolvenza=4), -28), "P2")

    # P1, le pompe: cinque righe tonali (65, 141, 746, 858 e 1000 Hz) litigano con il re;
    # si tolgono con notch stretti. Sotto i 120 Hz si toglie un po’ di corpo: lì comanda il re.
    x = c.leggi(sorgente("freesound/839813"))
    i = int(83.5 * c.SR)
    x = x[i: i + int(75 * c.SR)]
    x = c.filtra(x, c.biquad("passaalto", 30, 0.7), c.biquad("notch", 65.2, 6), c.biquad("notch", 141.4, 6),
                 c.biquad("notch", 746.3, 8), c.biquad("notch", 858.4, 8), c.biquad("notch", 999.8, 8),
                 c.biquad("mensola_bassa", 120, 0.7, -6.0))
    esporta("letti/pompe.ogg", c.a_lufs(c.anello(x, 67, dissolvenza=4), -28), "P1")

    # C5, la ventola della tuta: il ronzio a 62 Hz e le sue armoniche sono forti (fino a
    # 48 dB sopra il fondo). Una ventola piccola, dentro un casco, è soprattutto aria:
    # le prime due righe si tolgono, le altre si abbassano di 24 dB.
    x = c.leggi(sorgente("freesound/336387"))
    x = x[int(7.2 * c.SR):]
    tagli = [c.biquad("notch", 62.3, 6), c.biquad("notch", 124.5, 6)]
    tagli += [c.biquad("picco", f, 6, -24.0) for f in (82.8, 104.0, 145.0, 186.8, 207.3, 249.0, 311.3, 576.4)]
    # sotto i 110 Hz c’era quasi tutta l’energia (il motore, non l’aria): un passa-alto ripido
    x = c.passaalto_ripido(c.filtra(x, *tagli, c.biquad("passabasso", 6500, 0.6)), 110)
    esporta("letti/ventola.ogg", c.a_lufs(c.anello(x, 29, dissolvenza=2.5), -28), "C5")


# --- i respiri: un ciclo (inspira ed espira) per file, mono ------------------------------------
# I tagli vengono dal grafico degli inviluppi e del baricentro spettrale: le
# inspirazioni sono le parti più acute.
RESPIRI = {
    "calmo": ("freesound/569568", [(4.40, 6.60)], -30),
    "sospiro": ("freesound/569568", [(0.18, 3.40)], -28),
    "teso": ("freesound/554906", [(1.00, 3.35), (3.35, 5.70)], -27),
    "pesante": ("freesound/163383", [(0.30, 1.20), (1.20, 2.05), (2.05, 2.95), (2.95, 3.75), (3.75, 4.25)], -24),
    "veloce": ("freesound/554907", [(0.00, 1.07), (1.07, 2.00), (2.00, 3.05), (3.05, 4.05), (4.05, 5.15)], -24),
    "sorpresa": ("freesound/554907", [(0.00, 0.56)], -24),
}


def respiri():
    sigle = {"freesound/569568": "C4", "freesound/554906": "C2", "freesound/163383": "C3", "freesound/554907": "C1"}
    for classe, (cartella, tagli, obiettivo) in RESPIRI.items():
        x = mono(c.leggi(sorgente(cartella)))
        x = c.filtra(x, c.biquad("passaalto", 80, 0.7))
        for k, (a, b) in enumerate(tagli, 1):
            pezzo = c.dissolvi(x[int(a * c.SR): int(b * c.SR)], 0.02, 0.12)
            esporta(f"fiato/{classe}-{k}.ogg", c.a_lufs(pezzo, obiettivo), sigle[cartella])


# --- i colpi, le gocce, il ghiaccio: pezzi brevi tagliati sugli attacchi -------------------------
def pezzi(x, attacchi, durata, prima=0.005, minimo=0.08):
    uscita = []
    for k, i in enumerate(attacchi):
        a = max(0, int(i - prima * c.SR))
        fine = int(i + durata * c.SR)
        if k + 1 < len(attacchi):
            fine = min(fine, int(attacchi[k + 1] - 0.01 * c.SR))
        if (fine - a) / c.SR >= minimo:
            uscita.append(c.dissolvi(x[a:fine], 0.002, min(0.15, (fine - a) / c.SR / 3)))
    return uscita


def colpi():
    x = c.leggi(sorgente("freesound/733837"))
    for k, p in enumerate(pezzi(x, c.attacchi(x, soglia_db=12), 1.4), 1):
        esporta(f"colpi/colpo-{k:02d}.ogg", c.a_picco(p, -3), "P3")
    # C6: la porta aperta e chiusa, al microfono a contatto: lunghi cigolii di metallo
    x = c.leggi(sorgente("freesound/718386"))
    att = c.attacchi(x, soglia_db=12)
    for k, p in enumerate(pezzi(x, att, 3.5, minimo=0.6), 1):
        esporta(f"colpi/cigolio-{k:02d}.ogg", c.a_picco(p, -3), "C6")


def gocce():
    x = c.leggi(sorgente("freesound/392668"))
    for k, p in enumerate(pezzi(x, c.attacchi(x, soglia_db=10), 1.0), 1):
        esporta(f"gocce/goccia-{k:02d}.ogg", c.a_picco(p, -6), "V2")


def ghiaccio():
    x = c.leggi(sorgente("freesound/737896"))
    att = c.attacchi(x, soglia_db=10)
    tutti = pezzi(x, att, 0.9)
    # le crepe: le 24 più forti
    forza = [float(np.max(np.abs(p))) for p in tutti]
    scelte = sorted(range(len(tutti)), key=lambda k: -forza[k])[:24]
    for n, k in enumerate(sorted(scelte), 1):
        esporta(f"ghiaccio/crepa-{n:02d}.ogg", c.a_picco(tutti[k], -3), "V3")
    # i gemiti: tratti di due secondi e mezzo intorno agli attacchi più forti, rallentati
    # di un’ottava e mezza (2,83 volte): il ghiaccio diventa una struttura enorme
    # che si assesta. Un passa-basso toglie il soffio che il rallentamento abbassa.
    rallenta = 2 ** 1.5
    usati = []
    for k in sorted(scelte, key=lambda k: -forza[k]):
        i = att[k]
        if any(abs(i - u) < 3 * c.SR for u in usati):
            continue
        usati.append(i)
        a, b = max(0, int(i - 0.1 * c.SR)), min(len(x), int(i + 2.4 * c.SR))
        n = int((b - a) * rallenta)
        lento = signal.resample(x[a:b].astype(np.float64), n, axis=0).astype(np.float32)
        lento = c.filtra(lento, c.biquad("passabasso", 2200, 0.7), c.biquad("passaalto", 25, 0.7))
        lento = c.dissolvi(lento, 0.01, 1.5)
        esporta(f"ghiaccio/gemito-{len(usati):02d}.ogg", c.a_picco(lento, -3), "V3")
        if len(usati) == 8:
            break


# --- le voci del brusio: LibriVox, una lettura per file ----------------------------------------
def voci():
    z = zipfile.ZipFile(sorgente("librivox/mpc001"))
    tmp = USCITA / "_tmp"
    tmp.mkdir(parents=True, exist_ok=True)
    k = 0
    for info in sorted(z.infolist(), key=lambda i: i.filename):
        if not info.filename.endswith(".mp3"):
            continue
        p = tmp / Path(info.filename).name
        p.write_bytes(z.read(info))
        x = mono(c.leggi(p, sr=24000))
        p.unlink()
        # via l’annuncio iniziale e il congedo di LibriVox, poi i silenzi lunghi
        x = x[int(15 * 24000): max(int(15 * 24000), len(x) - int(8 * 24000))]
        if len(x) < 24000 * 10:
            continue
        e = c.inviluppo(x, 24000, 0.05)
        parla = 20 * np.log10(e + 1e-9) > 20 * np.log10(np.percentile(e, 95) + 1e-9) - 30
        # si tengono le parti parlate, con 80 ms di margine, fino a 40 secondi
        margine = signal.convolve(parla.astype(float), np.ones(int(0.16 * 24000)), mode="same") > 0
        x = x[margine][: 40 * 24000]
        x = c.filtra(x, c.biquad("passaalto", 100, 0.7, sr=24000))
        k += 1
        esporta(f"voci/voce-{k:02d}.ogg", c.a_lufs(x, -23, sr=24000), "V1 " + Path(info.filename).stem, sr=24000, qualita=3)
    tmp.rmdir()


if __name__ == "__main__":
    USCITA.mkdir(parents=True, exist_ok=True)
    for f in USCITA.rglob("*.ogg"):
        f.unlink()
    letti()
    respiri()
    colpi()
    gocce()
    ghiaccio()
    voci()
    c.json_su(USCITA / "indice.json", indice)
    totale = sum(f.stat().st_size for f in USCITA.rglob("*.ogg"))
    print(f"{len(indice)} file, {totale / 1e6:.1f} MB in {USCITA}")
