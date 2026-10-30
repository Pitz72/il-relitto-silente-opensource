# La voce di L.V. nell'intro (09-intro-storyboard.md, §13): la registrazione che l'autore ha
# generato con la sintesi vocale di Google (la voce «Elio», 30 ottobre 2026, sul testo rivisto; prima
# «Riko», 29 ottobre), passata da una trasmittente, ma poco.
#
#   python strumenti/intro/voce_lv.py <il file .wav dell'autore> <il nome della copia>
#   (per esempio: lv-gemini-elio-2026-10-30)
#
# La catena, leggera apposta («non rendiamo l'effetto pacchiano»):
#   - la banda di una radio buona, non di un telefono: passa-alto a 170 Hz, passa-basso a 5,4 kHz,
#     tutti e due dolci (12 dB per ottava), e un poco di presenza a 2 kHz (+2,5 dB);
#   - il casco: due riflessioni vicinissime (3,1 e 5,7 ms), sotto di 17 e 21 dB;
#   - la trasmittente: una saturazione appena (tanh), e un compressore lento che alza i respiri;
#   - niente rumore: la statica la fa il motore audio (il nastro dell'intro), con i suoi buchi.
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


y = signal.sosfilt(signal.butter(2, 170, "highpass", fs=SR, output="sos"), x)
y = signal.sosfilt(signal.butter(2, 5400, "lowpass", fs=SR, output="sos"), y)
b, a = biquad_picco(2000, 2.5, 0.9, SR)
y = signal.lfilter(b, a, y)
# il casco
for ms, giu in ((3.1, -17), (5.7, -21)):
    k = int(SR * ms / 1000)
    y[k:] += y[:-k] * 10 ** (giu / 20)
# la trasmittente: il picco a −6 dBFS, poi una saturazione appena
y *= 0.5 / max(1e-9, np.abs(y).max())
y = np.tanh(1.5 * y) / np.tanh(1.5)
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
