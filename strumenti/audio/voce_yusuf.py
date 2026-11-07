# Le battute di Yusuf con la voce dell'autore (documento 33, RN-H1; documento 32, §3.11): la voce clonata
# dell'autore su ElevenLabs (Instant Voice Clone «Simone Pizzi», eleven_v4, 6 e 7 novembre 2026), tagliata
# soltanto ai due capi, nei silenzi veri fra una battuta e l'altra, e passata dalla stessa radio leggera di L.V.
# (strumenti/intro/voce_lv.py: «non rendiamo l'effetto pacchiano»):
#   - la banda di una radio buona: passa-alto a 170 Hz, passa-basso a 5,4 kHz (12 dB per ottava), +2,5 dB a 2 kHz;
#   - una saturazione appena (tanh) e un compressore lento;
#   - nell'atto I esce così dall'altoparlante della radio di plancia (l'autore, 7 novembre: «va bene»);
#   - nella fuga arriva nella cuffia della tuta, su un canale appena agganciato e ancora instabile (la funzione
#     instabile, sotto: banda stretta, l'aggancio che oscilla, il segnale che va e viene, la statica).
# Lo schiocco della linea e il clic del canale li fa il motore audio.
#
#   python strumenti/audio/voce_yusuf.py
#
# Le sorgenti (le prese intere di ElevenLabs) stanno in audio/sorgenti/voce/, fuori da git; le loro impronte vanno
# in audio/LICENZE.md. Ne escono audio/musica-ia/YU/YU-0n-*.mp3 (44,1 kHz, mono, 112 kbps).
import os
import subprocess

import numpy as np
from scipy import signal

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
SORGENTI = os.path.join(RADICE, "audio", "sorgenti", "voce")
USCITA = os.path.join(RADICE, "audio", "musica-ia", "YU")
SR = 44100

# (file d'uscita, presa, inizio, fine in secondi, catena). I tagli cadono nei silenzi sotto −60 dB trovati fra le
# battute (i tempi delle parole di Whisper, fra due battute vicine, sbagliano anche di un secondo).
BATTUTE = [
    ("YU-01-apertura", "yusuf-atto1-presa2-2026-11-07", 0.00, 6.01, "bordo"),
    ("YU-02-apertura-pezzo", "yusuf-atto1-presa2-2026-11-07", 6.66, 12.61, "bordo"),
    ("YU-03-credito", "yusuf-credito-presa3-2026-11-07", 0.00, None, "bordo"),
    ("YU-04-cosa", "yusuf-atto1-presa2-2026-11-07", 31.46, 41.83, "bordo"),
    ("YU-05-qualcuno", "yusuf-atto1-presa2-2026-11-07", 42.21, 49.41, "bordo"),
    ("YU-06-voce", "yusuf-atto1-presa2-2026-11-07", 49.91, None, "bordo"),
    ("YU-07-fuga-pezzo", "yusuf-fuga-pezzo-presa2-2026-11-06", 0.00, None, "instabile"),
    ("YU-08-fuga-nessuno", "yusuf-fuga-cerano-presa2-2026-11-06", 0.00, None, "instabile"),
]


def leggi(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def biquad_picco(f0, guadagno_db, q, fs):
    a = 10 ** (guadagno_db / 40)
    w0 = 2 * np.pi * f0 / fs
    al = np.sin(w0) / (2 * q)
    b = [1 + al * a, -2 * np.cos(w0), 1 - al * a]
    d = [1 + al / a, -2 * np.cos(w0), 1 - al / a]
    return np.array(b) / d[0], np.array(d) / d[0]


def radio(x, casco):
    y = signal.sosfilt(signal.butter(2, 170, "highpass", fs=SR, output="sos"), x)
    y = signal.sosfilt(signal.butter(2, 5400, "lowpass", fs=SR, output="sos"), y)
    b, a = biquad_picco(2000, 2.5, 0.9, SR)
    y = signal.lfilter(b, a, y)
    if casco:
        for ms, giu in ((3.1, -17), (5.7, -21)):
            k = int(SR * ms / 1000)
            y[k:] += y[:-k] * 10 ** (giu / 20)
    y *= 0.5 / max(1e-9, np.abs(y).max())
    y = np.tanh(1.5 * y) / np.tanh(1.5)
    e = np.sqrt(signal.lfilter([0.002], [1, -0.998], y * y)) + 1e-9
    liv = 20 * np.log10(e)
    riduzione = np.where(liv > -30, (liv + 30) * (1 - 1 / 2.5), 0.0)
    riduzione = signal.lfilter([0.01], [1, -0.99], riduzione)
    y = y * 10 ** (-riduzione / 20)
    return y * 0.89 / max(1e-9, np.abs(y).max())


def instabile(x, seme):
    """La fuga: il canale della Santa Maria appena agganciato e ancora instabile (l'autore, 7 novembre 2026:
    «un suono disturbato, una frequenza radio finalmente agganciata ma ancora poco stabile»). Una banda stretta
    da radio di servizio, l'aggancio che oscilla e poi si assesta, il segnale che va e viene, qualche caduta, la
    statica che sale quando il segnale scende. Prima della voce, un attimo di statica: il canale che si apre."""
    rng = np.random.default_rng(seme)
    testa, coda = int(0.35 * SR), int(0.30 * SR)
    x = np.concatenate([np.zeros(testa), x, np.zeros(coda)])
    t = np.arange(len(x)) / SR

    def lento(hz):
        r = signal.sosfiltfilt(signal.butter(2, hz, "lowpass", fs=SR, output="sos"), rng.standard_normal(len(x)))
        return r / max(1e-9, np.abs(r).max())

    y = signal.sosfilt(signal.butter(3, 300, "highpass", fs=SR, output="sos"), x)
    y = signal.sosfilt(signal.butter(4, 3000, "lowpass", fs=SR, output="sos"), y)
    # l'aggancio che oscilla: un tremolio di intonazione (fino allo 0,6 %) che si calma in un secondo e mezzo
    prof = 0.006 * np.exp(-t / 1.5) + 0.0012
    ritardo = prof / (2 * np.pi * 4.0) * np.sin(2 * np.pi * 4.0 * t) * 1000 + 0.3 * lento(0.7) * prof / 0.006
    y = np.interp(np.arange(len(y)) - (ritardo + 2.0) * SR / 1000, np.arange(len(y)), y)
    # il segnale che va e viene (fino a −9 dB), e tre cadute brevi a −20 dB
    giu = np.clip(4.5 - 4.5 * lento(0.6) - 3 * np.exp(-t / 1.0), 0, 12)
    for _ in range(3):
        c = rng.uniform(0.6, len(x) / SR - 0.4)
        lung = rng.uniform(0.06, 0.14)
        i0, i1 = int(c * SR), int((c + lung) * SR)
        giu[i0:i1] = np.maximum(giu[i0:i1], 20 * np.sin(np.linspace(0, np.pi, i1 - i0)) ** 0.4)
    y = y * 10 ** (-giu / 20)
    y *= 0.5 / max(1e-9, np.abs(y).max())
    y = np.tanh(2.5 * y) / np.tanh(2.5)
    # il casco: la cuffia della tuta
    for ms, g in ((3.1, -17), (5.7, -21)):
        k = int(SR * ms / 1000)
        y[k:] += y[:-k] * 10 ** (g / 20)
    # la statica, nella stessa banda: sale quando il segnale scende, crepita di più all'aggancio
    st = signal.sosfilt(signal.butter(3, [300, 3000], "bandpass", fs=SR, output="sos"), rng.standard_normal(len(x)))
    st = st / np.sqrt(np.mean(st ** 2)) * 10 ** ((-36 + 0.9 * giu) / 20)
    st[:testa] *= 2.0
    crepitii = np.zeros(len(x))
    for _ in range(int(len(x) / SR * 6)):
        i = int(rng.uniform(0, len(x) - 300))
        peso = 1.0 + 3.0 * np.exp(-i / SR / 0.8)
        crepitii[i:i + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 40) * 10 ** (-30 / 20) * peso
    y = y + st + signal.sosfilt(signal.butter(2, 3500, "lowpass", fs=SR, output="sos"), crepitii)
    e = np.sqrt(signal.lfilter([0.002], [1, -0.998], y * y)) + 1e-9
    riduzione = np.where(20 * np.log10(e) > -30, (20 * np.log10(e) + 30) * (1 - 1 / 2.5), 0.0)
    y = y * 10 ** (-signal.lfilter([0.01], [1, -0.99], riduzione) / 20)
    n = int(0.02 * SR)
    y[:n] *= np.linspace(0, 1, n)
    y[-n:] *= np.linspace(1, 0, n)
    return y * 0.89 / max(1e-9, np.abs(y).max())


os.makedirs(USCITA, exist_ok=True)
for k, (nome, presa, a, b, catena) in enumerate(BATTUTE):
    x = leggi(os.path.join(SORGENTI, presa + ".mp3"))
    b = len(x) / SR if b is None else min(b, len(x) / SR)
    pezzo = x[int(a * SR):int(b * SR)].copy()
    n_in, n_out = int(0.005 * SR), int(0.03 * SR)
    pezzo[:n_in] *= np.linspace(0, 1, n_in)
    pezzo[-n_out:] *= np.linspace(1, 0, n_out)
    y = instabile(pezzo, 2201 + k) if catena == "instabile" else radio(pezzo, catena == "casco")
    f = os.path.join(USCITA, nome + ".mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "libmp3lame", "-b:a", "112k", "-write_xing", "1", f],
                   input=np.clip(y, -1, 1).astype(np.float32).tobytes(), check=True)
    print(f"{os.path.relpath(f, RADICE)}: {len(y) / SR:5.2f} s, {catena}")
