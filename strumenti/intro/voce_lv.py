# La voce di L.V. nell'intro (09-intro-storyboard.md, §13): la registrazione che l'autore ha
# generato con la sintesi vocale di Google (la voce «Elio», 30 ottobre 2026, sul testo rivisto; prima
# «Riko», 29 ottobre), passata da una trasmittente, ma poco.
#
#   python strumenti/intro/voce_lv.py <il file .wav dell'autore> <il nome della copia>
#   (per esempio: lv-gemini-elio-2026-10-30)
#
# La catena (rifatta il 7 novembre 2026, su indicazione dell'autore: «LV non lo ascolta William dal casco, è
# una registrazione che non ascolterà nessuno, si perde. Deve sembrare una cosa più sporca, come un vecchio
# nastro che si sta deteriorando»; prima era la trasmittente leggera del 30 ottobre, con il casco):
#   - la banda di un nastro vecchio: passa-alto a 180 Hz, passa-basso a 3,8 kHz, una gobba a 1,2 kHz (+2 dB);
#   - il trascinamento: una deriva lenta (fino allo 0,3 %) e un tremolio a 6,5 Hz, come ritardo variabile;
#   - la saturazione dell'ossido (tanh), le cadute (ogni 3–7 s, 80–250 ms, da −8 a −16 dB e più cupe), un
#     fruscio basso (−50 dB) e qualche crepitio; poi il compressore lento che alza i respiri;
#   - le parole restano tutte: nell'intro, mentre L.V. parla, il testo non c'è. La statica, con i suoi buchi, la
#     fa ancora il motore audio (il nastro dell'intro).
# Ne escono:
#   audio/musica-ia/LV/LV-01-la-traccia.mp3   la voce lavorata, intera (44,1 kHz, mono, 112 kbps)
#   app/src/intro/voce.ts                     il suo inviluppo, 40 valori al secondo, per il nastro
#                                             della scatola nera che si vede in A e per la spia in F
# La sorgente resta fuori da git, in audio/sorgenti/voce/; la sua impronta va in audio/musica-ia/REGISTRO.md.
import hashlib
import os
import shutil
import subprocess
import sys
import wave

import numpy as np
from scipy import signal

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
SORGENTE = sys.argv[1]
USCITA = os.path.join(RADICE, "audio", "musica-ia", "LV", "LV-01-la-traccia.mp3")
INVILUPPO = os.path.join(RADICE, "app", "src", "intro", "voce.ts")
COPIA = os.path.join(RADICE, "audio", "sorgenti", "voce", sys.argv[2] + ".wav")

w = wave.open(SORGENTE)
sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768.0
if ch > 1:
    x = x.reshape(-1, ch).mean(1)

# a 44,1 kHz: la frequenza dei file del gioco
SR = 44100
x = signal.resample_poly(x, SR // 300, sr // 300) if sr != SR else x


def biquad_picco(f0, guadagno_db, q, fs):
    a = 10 ** (guadagno_db / 40)
    w0 = 2 * np.pi * f0 / fs
    al = np.sin(w0) / (2 * q)
    b = [1 + al * a, -2 * np.cos(w0), 1 - al * a]
    d = [1 + al / a, -2 * np.cos(w0), 1 - al / a]
    return np.array(b) / d[0], np.array(d) / d[0]


rng = np.random.default_rng(1972)  # lo stesso nastro a ogni giro
t = np.arange(len(x)) / SR


def lento(hz):
    """Un rumore lento, fra −1 e 1, che cambia al ritmo di «hz»."""
    r = signal.sosfiltfilt(signal.butter(2, hz, "lowpass", fs=SR, output="sos"), rng.standard_normal(len(x)))
    return r / max(1e-9, np.abs(r).max())


# la banda di un nastro vecchio: gli acuti se ne sono andati, il basso è magro, una gobba di medi
y = signal.sosfilt(signal.butter(2, 180, "highpass", fs=SR, output="sos"), x)
y = signal.sosfilt(signal.butter(2, 3800, "lowpass", fs=SR, output="sos"), y)
b, a = biquad_picco(1200, 2.0, 0.8, SR)
y = signal.lfilter(b, a, y)
# il trascinamento che non tiene più il passo: una deriva lenta (0,3 % al massimo) e un tremolio veloce,
# come ritardo variabile intorno a 2 ms (i tempi di VOCE non si spostano)
ritardo = 2.0 + 0.8 * np.sin(2 * np.pi * 0.55 * t) + 0.3 * lento(0.3) + 0.02 * np.sin(2 * np.pi * 6.5 * t)
y = np.interp(np.arange(len(y)) - ritardo * SR / 1000, np.arange(len(y)), y)
# il nastro: il picco a −6 dBFS, poi la saturazione dell'ossido
y *= 0.5 / max(1e-9, np.abs(y).max())
y = np.tanh(2.2 * y) / np.tanh(2.2)
# le cadute dell'ossido: ogni 3–7 s il suono si abbassa di 8–16 dB e si fa più cupo, per 80–250 ms;
# la parola resta (non sono buchi: i buchi li fa la statica del motore)
cupo = signal.sosfilt(signal.butter(2, 1600, "lowpass", fs=SR, output="sos"), y)
caduta = np.zeros(len(y))
pos = rng.uniform(1.0, 3.0)
while pos < len(y) / SR - 0.5:
    lung, giu = rng.uniform(0.08, 0.25), rng.uniform(8, 16)
    i0, i1 = int(pos * SR), int((pos + lung) * SR)
    forma = np.sin(np.linspace(0, np.pi, i1 - i0)) ** 0.5
    caduta[i0:i1] = np.maximum(caduta[i0:i1], forma * giu)
    pos += lung + rng.uniform(3.0, 7.0)
mix = np.clip(caduta / 12, 0, 1)
y = (y * (1 - mix) + cupo * mix) * 10 ** (-caduta / 20)
# il fruscio del nastro, basso, e qualche crepitio del supporto rovinato
fruscio = signal.sosfilt(signal.butter(2, [2000, 9000], "bandpass", fs=SR, output="sos"), rng.standard_normal(len(y)))
y += fruscio / np.sqrt(np.mean(fruscio ** 2)) * 10 ** (-50 / 20) * (1 + 0.3 * lento(0.2))
for _ in range(int(len(y) / SR / 6)):
    i = int(rng.uniform(0, len(y) - 400))
    y[i:i + 400] += rng.standard_normal(400) * np.exp(-np.arange(400) / 60) * 10 ** (rng.uniform(-34, -28) / 20)
# il compressore: 2,5:1 sopra −30 dBFS di valore efficace, lento, con un poco di guadagno dopo
e = np.sqrt(signal.lfilter([0.002], [1, -0.998], y * y)) + 1e-9
liv = 20 * np.log10(e)
riduzione = np.where(liv > -30, (liv + 30) * (1 - 1 / 2.5), 0.0)
riduzione = signal.lfilter([0.01], [1, -0.99], riduzione)
y = y * 10 ** (-riduzione / 20)
y *= 0.89 / max(1e-9, np.abs(y).max())

os.makedirs(os.path.dirname(USCITA), exist_ok=True)
tmp = USCITA + ".wav"
with wave.open(tmp, "wb") as o:
    o.setnchannels(1)
    o.setsampwidth(2)
    o.setframerate(SR)
    o.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-c:a", "libmp3lame", "-b:a", "112k", "-ar", str(SR), "-ac", "1", "-write_xing", "1", USCITA], check=True)
os.remove(tmp)

# l'inviluppo: 40 al secondo, da 0 a 63, in una stringa (un carattere per valore)
passo = SR // 40
blocchi = len(y) // passo
rms = np.sqrt((y[: blocchi * passo].reshape(blocchi, passo) ** 2).mean(1))
db = 20 * np.log10(rms + 1e-9)
v = np.clip((db + 60) / 50, 0, 1)  # −60 dBFS → 0, −10 dBFS → 1
cifre = "".join(chr(48 + int(round(k * 63))) for k in v)
with open(INVILUPPO, "w", encoding="utf-8", newline="\r\n") as f:
    f.write("// La voce di L.V. (strumenti/intro/voce_lv.py, generato: non si ritocca a mano). Il suo inviluppo,\n")
    f.write("// 40 valori al secondo del file, da 0 (−60 dBFS) a 63 (−10 dBFS), un carattere ciascuno (codice − 48).\n")
    f.write(f"export const VOCE_PASSO = 1 / 40;\n")
    f.write(f"export const VOCE_INVILUPPO = {cifre!r};\n".replace("'", '"'))

os.makedirs(os.path.dirname(COPIA), exist_ok=True)
if os.path.abspath(SORGENTE) != os.path.abspath(COPIA):
    shutil.copyfile(SORGENTE, COPIA)
impronta = hashlib.sha256(open(COPIA, "rb").read()).hexdigest()
print(f"{os.path.relpath(USCITA, RADICE)}: {len(y) / SR:.2f} s, {os.path.getsize(USCITA) / 1024:.0f} kB")
print(f"inviluppo: {blocchi} valori; sorgente {os.path.relpath(COPIA, RADICE)}, sha256 {impronta}")
