# Attrezzi comuni della catena audio: leggere e scrivere con ffmpeg, filtri,
# loudness (ITU-R BS.1770), attacchi, anelli. Niente dipendenze oltre numpy e
# scipy; ffmpeg deve stare nel PATH.
import json
import subprocess

import numpy as np
from scipy import signal

SR = 48000


def leggi(percorso, sr=SR, canali=2):
    """Decodifica qualunque file in float32 [n, canali] alla frequenza voluta."""
    cmd = ["ffmpeg", "-v", "error", "-i", str(percorso), "-f", "f32le", "-ac", str(canali), "-ar", str(sr), "-"]
    dati = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(dati, dtype=np.float32).reshape(-1, canali).copy()


def scrivi(percorso, x, sr=SR, qualita=5):
    """Scrive in Ogg Vorbis (o WAV a 16 bit, se il nome finisce in .wav)."""
    x = np.asarray(x, dtype=np.float32)
    if x.ndim == 1:
        x = x[:, None]
    canali = x.shape[1]
    uscita = ["-c:a", "pcm_s16le"] if str(percorso).endswith(".wav") else ["-c:a", "libvorbis", "-q:a", str(qualita)]
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", str(canali), "-ar", str(sr), "-i", "-", *uscita, str(percorso)]
    subprocess.run(cmd, input=np.clip(x, -1, 1).tobytes(), check=True)


# --- filtri (le formule di Robert Bristow-Johnson) --------------------------------------
def biquad(tipo, f0, q=0.7071, guadagno_db=0.0, sr=SR):
    a = 10 ** (guadagno_db / 40)
    w = 2 * np.pi * f0 / sr
    cw, sw = np.cos(w), np.sin(w)
    al = sw / (2 * q)
    if tipo == "passabasso":
        b = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2]
        aa = [1 + al, -2 * cw, 1 - al]
    elif tipo == "passaalto":
        b = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2]
        aa = [1 + al, -2 * cw, 1 - al]
    elif tipo == "picco":
        b = [1 + al * a, -2 * cw, 1 - al * a]
        aa = [1 + al / a, -2 * cw, 1 - al / a]
    elif tipo == "notch":
        b = [1, -2 * cw, 1]
        aa = [1 + al, -2 * cw, 1 - al]
    elif tipo == "mensola_bassa":
        sq = 2 * np.sqrt(a) * al
        b = [a * ((a + 1) - (a - 1) * cw + sq), 2 * a * ((a - 1) - (a + 1) * cw), a * ((a + 1) - (a - 1) * cw - sq)]
        aa = [(a + 1) + (a - 1) * cw + sq, -2 * ((a - 1) + (a + 1) * cw), (a + 1) + (a - 1) * cw - sq]
    else:
        raise ValueError(tipo)
    b, aa = np.array(b) / aa[0], np.array(aa) / aa[0]
    return b, aa


def passaalto_ripido(x, fc, ordine=8, sr=SR):
    """Un passa-alto Butterworth ripido, a fase zero (si applica avanti e indietro)."""
    sos = signal.butter(ordine, fc, "highpass", fs=sr, output="sos")
    return np.asarray(signal.sosfiltfilt(sos, x, axis=0), dtype=np.float32)


def filtra(x, *filtri):
    for b, a in filtri:
        x = signal.lfilter(b, a, x, axis=0)
    return np.asarray(x, dtype=np.float32)


# --- loudness, ITU-R BS.1770-4 ------------------------------------------------------------
def _k(x, sr=SR):
    # i due stadi della pesatura K, ricalcolati per la frequenza data
    f0, g, q = 1681.974450955533, 3.999843853973347, 0.7071752369554196
    k = np.tan(np.pi * f0 / sr)
    vh = 10 ** (g / 20)
    vb = vh ** 0.4996667741545416
    a0 = 1 + k / q + k * k
    b1 = [(vh + vb * k / q + k * k) / a0, 2 * (k * k - vh) / a0, (vh - vb * k / q + k * k) / a0]
    a1 = [1, 2 * (k * k - 1) / a0, (1 - k / q + k * k) / a0]
    f0, q = 38.13547087602444, 0.5003270373238773
    k = np.tan(np.pi * f0 / sr)
    d = 1 + k / q + k * k
    a2 = [1, 2 * (k * k - 1) / d, (1 - k / q + k * k) / d]
    b2 = [1, -2, 1]
    return signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=0), axis=0)


def lufs(x, sr=SR):
    """Loudness integrata, con le due soglie (assoluta a −70 LUFS, relativa a −10 LU)."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = x[:, None]
    y = _k(x, sr)
    blocco, passo = int(0.4 * sr), int(0.1 * sr)
    if len(y) < blocco:
        return -70.0
    q = y ** 2
    c = np.concatenate([np.zeros((1, q.shape[1])), np.cumsum(q, axis=0)])
    inizi = np.arange(0, len(y) - blocco + 1, passo)
    z = ((c[inizi + blocco] - c[inizi]) / blocco).sum(axis=1)
    l = -0.691 + 10 * np.log10(z + 1e-12)
    z = z[l > -70]
    if not len(z):
        return -70.0
    soglia = -0.691 + 10 * np.log10(z.mean()) - 10
    z = z[(-0.691 + 10 * np.log10(z + 1e-12)) > soglia]
    return float(-0.691 + 10 * np.log10(z.mean()))


def a_lufs(x, obiettivo, sr=SR, picco_max=0.89):
    """Porta x alla loudness voluta, senza superare il picco dato."""
    g = 10 ** ((obiettivo - lufs(x, sr)) / 20)
    p = np.max(np.abs(x)) * g
    if p > picco_max:
        g *= picco_max / p
    return (x * g).astype(np.float32)


def a_picco(x, picco_db=-3.0):
    p = np.max(np.abs(x))
    return (x * (10 ** (picco_db / 20) / max(p, 1e-9))).astype(np.float32)


# --- tempo: inviluppi, attacchi, anelli ------------------------------------------------------
def inviluppo(x, sr=SR, finestra=0.01):
    m = x.mean(axis=1) if x.ndim == 2 else x
    n = max(1, int(finestra * sr))
    c = np.concatenate([[0.0], np.cumsum(m.astype(np.float64) ** 2)])
    e = (c[n:] - c[:-n]) / n
    e = np.concatenate([np.full(n // 2, e[0]), e, np.full(len(m) - len(e) - n // 2, e[-1])])
    return np.sqrt(np.maximum(e, 0))


def attacchi(x, sr=SR, soglia_db=12.0, distanza=0.25, finestra=0.005):
    """Gli istanti in cui l’energia sale di colpo sopra il fondo: colpi, gocce, crepe."""
    e = 20 * np.log10(inviluppo(x, sr, finestra) + 1e-9)
    passo = int(sr * 0.01)
    fondo = signal.medfilt(e[::passo], 101)
    fondo = np.repeat(fondo, passo)[: len(e)]
    if len(fondo) < len(e):
        fondo = np.concatenate([fondo, np.full(len(e) - len(fondo), fondo[-1])])
    sopra = e - fondo > soglia_db
    idx, ultimo = [], -1e18
    for i in np.flatnonzero(np.diff(sopra.astype(np.int8)) == 1):
        if (i - ultimo) / sr >= distanza:
            idx.append(int(i))
            ultimo = i
    return np.array(idx, dtype=np.int64)


def anello(x, durata, sr=SR, dissolvenza=3.0, inizio=0):
    """Un anello di `durata` secondi: la coda si dissolve nella testa a potenza costante."""
    n, d = int(durata * sr), int(dissolvenza * sr)
    pezzo = x[inizio: inizio + n + d].astype(np.float64)
    t = np.linspace(0, np.pi / 2, d)
    if pezzo.ndim == 2:
        t = t[:, None]
    testa, coda = pezzo[:d], pezzo[n: n + d]
    uscita = pezzo[:n].copy()
    uscita[:d] = testa * np.sin(t) + coda * np.cos(t)
    return uscita.astype(np.float32)


def tratto_piu_fermo(x, durata, sr=SR, finestra=1.0):
    """L’inizio del tratto lungo `durata` con la loudness più costante."""
    e = 20 * np.log10(inviluppo(x, sr, finestra)[:: int(sr * 0.25)] + 1e-9)
    n = int(durata / 0.25)
    migliori = [(float(np.std(e[i:i + n])), i) for i in range(0, max(1, len(e) - n))]
    return int(min(migliori)[1] * 0.25 * sr)


def picchi_tonali(x, sr=SR, fmin=20, fmax=2000, sopra_db=10.0):
    """Le righe tonali dello spettro medio: frequenza e quanto sporgono dal fondo."""
    m = x.mean(axis=1) if x.ndim == 2 else x
    f, p = signal.welch(m, sr, nperseg=1 << 16)
    db = 10 * np.log10(p + 1e-20)
    fondo = signal.medfilt(db, 201)
    righe = []
    for i in signal.find_peaks(db - fondo, height=sopra_db, distance=8)[0]:
        if fmin <= f[i] <= fmax:
            righe.append((float(f[i]), float(db[i] - fondo[i])))
    return sorted(righe, key=lambda r: -r[1])


def dissolvi(x, entrata=0.005, uscita=0.05, sr=SR):
    """Dissolvenze brevi ai bordi di un pezzo tagliato, per non avere scatti."""
    x = np.array(x, dtype=np.float32)
    a, b = int(entrata * sr), int(uscita * sr)
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None] if x.ndim == 2 else np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)[:, None] if x.ndim == 2 else np.linspace(1, 0, b)
    return x


def json_su(percorso, dati):
    with open(percorso, "w", encoding="utf-8", newline="\n") as f:
        json.dump(dati, f, ensure_ascii=False, indent=1)
