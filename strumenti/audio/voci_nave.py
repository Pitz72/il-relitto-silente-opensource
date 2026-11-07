# Le voci della nave (documento 35): le quindici voci disegnate con ElevenLabs il 7 novembre 2026 (Voice Design,
# eleven_ttv_v3), approvate dall'autore («Vanno bene»). L'anteprima scelta di ogni disegno è già la presa: qui la si
# taglia in battute, soltanto nei silenzi (sono silenzi digitali, sotto −85 dB), e la si lavora come dice il §5:
#   - le echi (eco): l'aggancio del Sintonizzatore, cioè la voce che entra spostata di frequenza di +70 Hz (il
#     «metallo che parla» del filo di oggi) e in mezzo secondo scende al suo posto, come una radio a onde corte
#     quando la sintonia si ferma; poi una deriva lentissima di uno o due hertz, che lascia un filo di metallo;
#   - il secondo strato (profondo): lo stesso, ma l'aggancio viene dal basso (−70 Hz);
#   - la frase del Navarca al Piccolo (dorme): niente aggancio, è la stessa registrazione che va avanti;
#   - le gole (gola): l'aggancio, e la voce che sale dal coro e ci ricade (il volume ai due capi);
#   - il traduttore (traduttore): la stessa voce, che migliora con la matrice come dice il testo: al 4 % «metallica,
#     distorta», al 18 % «più chiara, più personale», al 75 % «quasi perfetta, malinconica»; dove il testo dice
#     «(intraducibile: …)» la voce non lo dice, e al suo posto c'è il tic del traduttore;
#   - l'Archivista (nastro): pulita, come un nastro di servizio;
#   - l'ultima voce (ultima): la più rovinata; i vuoti fra le parole si allungano, e la parola sopravvive appena.
# La banda della cuffia (150–7000 Hz) e il suo compressore li mette il motore, come al filo di oggi: qui no.
#
#   python strumenti/audio/voci_nave.py                         (tutte)
#   python strumenti/audio/voci_nave.py NV-08b-piccolo-mezza    (soltanto quelle nominate)
#
# Le sorgenti (le anteprime intere) stanno in audio/sorgenti/voce/disegni/, fuori da git; le scelte e i loro codici
# nel documento 35, §6. Ne escono audio/musica-ia/NV/NV-*.mp3 (44,1 kHz, mono, 112 kbps).
import os
import subprocess

import numpy as np
from scipy import signal

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
SORGENTI = os.path.join(RADICE, "audio", "sorgenti", "voce", "disegni")
USCITA = os.path.join(RADICE, "audio", "musica-ia", "NV")
SR = 44100

# (file d'uscita, presa, inizio, fine in secondi della presa, catena, opzioni). Inizio e fine cadono nei silenzi.
# Opzioni: "pause" = [(istante dentro un silenzio, secondi da aggiungere)]; "tic" = [(da, a)]: il tic del
# traduttore nel punto più quieto fra i due istanti; "vuoto" = quanto deve durare ogni silenzio (l'ultima voce).
BATTUTE = [
    ("NV-01-senza-ruolo", "01-senza-ruolo-c", 0.0, None, "eco", {}),
    ("NV-02-capitano", "02-capitano-f", 0.0, None, "eco", {}),
    ("NV-03-carico", "03-carico-a", 0.0, 7.70, "eco", {}),
    ("NV-03b-carico-gole", "03-carico-a", 8.45, None, "gola", {}),
    ("NV-03c-carico-deve", "03-carico-a", 6.85, 7.70, "dorme", {}),
    ("NV-04-bordo", "04-bordo-d", 0.0, None, "eco", {}),
    ("NV-05-botanico", "05-botanico-b", 0.0, 19.10, "eco", {}),
    ("NV-05b-botanico-profondo", "05-botanico-b", 19.40, None, "profondo", {}),
    ("NV-06-medico", "06-medico-c", 0.0, None, "eco", {}),
    ("NV-07-navarca", "07-navarca-a", 0.0, 13.80, "eco", {}),
    ("NV-07b-navarca-profondo", "07-navarca-a", 14.00, 39.70, "profondo", {}),
    ("NV-07c-navarca-dormi", "07-navarca-a", 40.00, None, "dorme", {}),
    ("NV-08-piccolo", "08-piccolo-a", 4.10, 7.95, "eco", {}),
    ("NV-09-navigazione", "09-navigazione-a", 0.0, None, "eco", {}),
    ("NV-10-scriba", "10-scriba-a", 0.0, None, "eco", {}),
    ("NV-11-custode", "11-custode-c", 0.0, 17.60, "eco", {}),
    ("NV-11b-custode-profondo", "11-custode-c", 18.30, None, "profondo", {}),
    # «Poi, più piano:»: la pausa fra i due pezzi del primo strato si allunga di 0,8 s, nel silenzio
    ("NV-12-ingegnere", "12-ingegnere-f", 0.0, 19.40, "eco", {"pause": [(7.30, 0.8)]}),
    ("NV-12b-ingegnere-profondo", "12-ingegnere-f", 20.30, 49.60, "profondo", {}),
    ("NV-12c-ingegnere-gole", "12-ingegnere-f", 50.10, None, "gola", {}),
    ("NV-13-archivista", "13-archivista-c", 0.0, None, "nastro", {}),
    ("NV-13b-archivista-breve", "13-archivista-c", 12.30, None, "nastro", {}),
    ("NV-14-lastra", "14-traduttore-a", 0.0, 9.40, "traduttore4", {"tic": [(1.86, 2.74), (5.95, 6.45)]}),
    ("NV-14b-cilindro", "14-traduttore-a", 9.60, 25.80, "traduttore18", {"tic": [(20.85, 21.60)]}),
    ("NV-14c-stele", "14-traduttore-a", 26.20, None, "traduttore75", {}),
    ("NV-15-ultima-voce", "15-ultima-a", 9.75, 18.90, "ultima", {"vuoto": 2.2}),
]

# Le battute che sono un pezzo di un'altra già lavorata, identico, tagliato in un silenzio: (file d'uscita, battuta,
# secondi). Il mezzo giro del Piccolo, per il nodo «arrivati» («La domanda gira ancora una volta. «…perché non si
# muove…» Poi, per la prima volta, non ricomincia.»): il silenzio fra le due domande va da 1,14 a 1,74 s.
PEZZI = [
    ("NV-08b-piccolo-mezza", "NV-08-piccolo", 1.40),
]


def leggi(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def lento(n, hz, rng):
    """Un rumore lento, fra −1 e 1, che cambia al ritmo di «hz»."""
    r = signal.sosfiltfilt(signal.butter(2, hz, "lowpass", fs=SR, output="sos"), rng.standard_normal(n))
    return r / max(1e-9, np.abs(r).max())


def sposta(x, hz):
    """Lo spostamento di frequenza a banda laterale unica (come lo `Spostatore` del motore): ogni componente si
    sposta di `hz` (che può cambiare a ogni campione)."""
    fase = 2 * np.pi * np.cumsum(hz) / SR
    return np.real(signal.hilbert(x) * np.exp(1j * fase))


def banda(x, lo, hi, ordine=2):
    y = signal.sosfilt(signal.butter(ordine, lo, "highpass", fs=SR, output="sos"), x)
    return signal.sosfilt(signal.butter(ordine, hi, "lowpass", fs=SR, output="sos"), y)


def attacco(x):
    """Il primo istante con voce (−35 dB dal picco), in secondi."""
    soglia = 10 ** (-35 / 20) * np.abs(x).max()
    i = np.argmax(np.abs(x) > soglia)
    return i / SR


def silenzi(x, soglia_db=-50, minimo=0.25):
    hop = int(0.01 * SR)
    e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    sotto = 20 * np.log10(e / np.abs(x).max() + 1e-12) < soglia_db
    out, i = [], 0
    while i < len(sotto):
        if sotto[i]:
            j = i
            while j < len(sotto) and sotto[j]:
                j += 1
            if (j - i) * 0.01 >= minimo:
                out.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    return out


def aggancio(x, verso, rng):
    """L'aggancio del Sintonizzatore: da 70 Hz (sopra o sotto) a zero in mezzo secondo, dall'attacco della voce;
    poi la deriva, uno o due hertz."""
    t = np.arange(len(x)) / SR
    t0 = attacco(x) - 0.12
    hz = verso * 70.0 * np.exp(-np.clip(t - t0, 0, None) / 0.22)
    hz += 1.5 * lento(len(x), 0.25, rng)
    return sposta(x, hz)


def tic():
    """Il tic del traduttore: uno scatto e un bip breve a 1,2 kHz (il motore ha il suo; questo è per i file)."""
    n = int(0.035 * SR)
    t = np.arange(n) / SR
    bip = np.sin(2 * np.pi * 1200 * t) * np.exp(-t / 0.008)
    bip[:int(0.002 * SR)] += np.hanning(int(0.002 * SR)) * 0.8
    return bip * 10 ** (-14 / 20)


def frantuma(x, sr_bersaglio, bit):
    """Il digitale povero di una matrice che ancora non sa: campiona e tiene, e taglia i livelli."""
    idx = (np.floor(np.arange(len(x)) * sr_bersaglio / SR) * SR / sr_bersaglio).astype(int)
    y = x[np.clip(idx, 0, len(x) - 1)]
    q = 2 ** (bit - 1)
    return np.round(y * q) / q


def pettine(x, ms, quanto):
    k = int(SR * ms / 1000)
    y = x.copy()
    y[k:] += x[:-k] * quanto
    return y


def lavora(x, catena, opz, rng):
    if catena == "eco":
        return aggancio(x, +1, rng)
    if catena == "profondo":
        return aggancio(x, -1, rng)
    if catena == "dorme":
        return sposta(x, 1.5 * lento(len(x), 0.25, rng))
    if catena == "gola":
        y = aggancio(x, +1, rng)
        # sale dal coro e ci ricade: da −14 dB al pieno in 0,6 s dall'attacco, e di nuovo giù nell'ultimo 0,6 s
        # (in una battuta corta, un quarto della sua durata per parte)
        g = np.ones(len(y))
        a = int(attacco(x) * SR)
        n = int(min(0.6, len(y) / SR / 4) * SR)
        g[:a] = 10 ** (-14 / 20)
        g[a:a + n] = 10 ** (np.linspace(-14, 0, n) / 20)
        g[-n:] = np.minimum(g[-n:], 10 ** (np.linspace(0, -14, n) / 20))
        return y * g
    if catena.startswith("traduttore"):
        livello = int(catena[len("traduttore"):])
        n = len(x)
        if livello == 4:
            y = banda(x, 300, 3400, 4)
            y = sposta(y, 35 + 3 * lento(n, 0.5, rng))
            y = pettine(y, 3.1, 0.45)
            y = frantuma(y / max(1e-9, np.abs(y).max()) * 0.8, 8000, 6)
            y = np.tanh(3.0 * y) / np.tanh(3.0)
            # qualche inciampo della matrice: il suono che cala di 15 dB per 25–45 ms
            g = np.ones(n)
            pos = rng.uniform(0.8, 1.6)
            while pos < n / SR - 0.3:
                i0, lung = int(pos * SR), int(rng.uniform(0.025, 0.045) * SR)
                g[i0:i0 + lung] = np.minimum(g[i0:i0 + lung], 10 ** (-15 / 20) + (1 - 10 ** (-15 / 20)) *
                                             (1 - np.sin(np.linspace(0, np.pi, lung)) ** 0.3))
                pos += rng.uniform(1.4, 2.4)
            y = y * g
        elif livello == 18:
            y = banda(x, 200, 5000)
            y = sposta(y, 10 + 2 * lento(n, 0.4, rng))
            y = pettine(y, 3.1, 0.2)
            y = frantuma(y / max(1e-9, np.abs(y).max()) * 0.8, 16000, 10)
            y = np.tanh(1.6 * y) / np.tanh(1.6)
        else:
            y = banda(x, 120, 7500)
            y = sposta(y, 2 * lento(n, 0.3, rng))
            y = pettine(y, 3.1, 0.07)
            y = np.tanh(1.1 * y / max(1e-9, np.abs(y).max())) / np.tanh(1.1)
        return y
    if catena == "nastro":
        y = banda(x, 100, 8000)
        fr = signal.sosfilt(signal.butter(2, [3000, 10000], "bandpass", fs=SR, output="sos"), rng.standard_normal(len(y)))
        y = y / max(1e-9, np.abs(y).max()) + fr / np.sqrt(np.mean(fr ** 2)) * 10 ** (-58 / 20)
        return y
    if catena == "ultima":
        n = len(x)
        t = np.arange(n) / SR
        y = banda(x, 350, 3200, 4)
        y = sposta(y, 10 * np.sin(2 * np.pi * 0.6 * t) + 6 * lento(n, 1.5, rng))
        y = frantuma(y / max(1e-9, np.abs(y).max()) * 0.8, 11025, 8)
        # il livello che non tiene: da 0 a −6 dB, lento
        y = y * 10 ** (-3 * (1 + lento(n, 0.8, rng)) / 20)
        cr = np.zeros(n)
        for _ in range(int(n / SR * 4)):
            i = int(rng.uniform(0, n - 300))
            cr[i:i + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 40) * 10 ** (-32 / 20)
        return y + cr
    raise ValueError(catena)


def allunga_pause(x, pause, inizio):
    for istante, secondi in sorted(pause, reverse=True):
        i = int((istante - inizio) * SR)
        x = np.concatenate([x[:i], np.zeros(int(secondi * SR)), x[i:]])
    return x


def allunga_vuoti(x, durata):
    """L'ultima voce: ogni silenzio fra una parola e l'altra dura `durata` secondi (si aggiunge silenzio nel mezzo
    del silenzio che c'è)."""
    pezzi, prima = [], 0
    for a, b in silenzi(x):
        if a < 0.05 or b > len(x) / SR - 0.05:
            continue
        mezzo = int((a + b) / 2 * SR)
        pezzi += [x[prima:mezzo], np.zeros(max(0, int((durata - (b - a)) * SR)))]
        prima = mezzo
    pezzi.append(x[prima:])
    return np.concatenate(pezzi)


def rifila(x):
    """Toglie il silenzio ai due capi, lasciando 0,08 s davanti e 0,35 s dietro. Rende anche quanto ha tolto
    davanti, in campioni."""
    soglia = 10 ** (-50 / 20) * np.abs(x).max()
    sopra = np.where(np.abs(x) > soglia)[0]
    a = max(0, sopra[0] - int(0.08 * SR))
    b = min(len(x), sopra[-1] + int(0.35 * SR))
    return x[a:b], a


def scrivi(nome, y, catena):
    f = os.path.join(USCITA, nome + ".mp3")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "libmp3lame", "-b:a", "112k", "-write_xing", "1", f],
                   input=np.clip(y, -1, 1).astype(np.float32).tobytes(), check=True)
    print(f"{os.path.relpath(f, RADICE)}: {len(y) / SR:5.2f} s, {catena}")


def main(solo=None):
    os.makedirs(USCITA, exist_ok=True)
    cache = {}
    fatte = {}
    for k, (nome, presa, a, b, catena, opz) in enumerate(BATTUTE):
        # il numero k fa il caso di ogni battuta: si scorre tutta la tabella anche quando se ne fa una sola
        serve = solo is None or nome in solo or any(d == nome and p in solo for p, d, _ in PEZZI)
        if not serve:
            continue
        if presa not in cache:
            cache[presa] = leggi(os.path.join(SORGENTI, presa + ".mp3"))
        tutta = cache[presa].copy()
        rng = np.random.default_rng(3500 + k)
        # il tic va messo prima di tagliare, nel tempo della presa: nel punto più quieto fra i due istanti
        tics = []
        for da, fino in opz.get("tic", []):
            hop = int(0.005 * SR)
            i0, i1 = int(da * SR), int(fino * SR)
            e = [np.sqrt(np.mean(tutta[i:i + hop] ** 2)) for i in range(i0, i1 - hop, hop)]
            tics.append(i0 + int(np.argmin(e)) * hop)
        b2 = len(tutta) / SR if b is None else min(b, len(tutta) / SR)
        x = tutta[int(a * SR):int(b2 * SR)]
        posti = [(i - int(a * SR)) for i in tics]
        assert not (posti and (opz.get("pause") or opz.get("vuoto"))), "i tic non si spostano con le pause"
        if opz.get("pause"):
            x = allunga_pause(x, opz["pause"], a)
        if opz.get("vuoto"):
            x = allunga_vuoti(rifila(x)[0], opz["vuoto"])
        x, tolto = rifila(x)
        y = lavora(x, catena, opz, rng)
        for p in posti:
            q = p - tolto
            tk = tic() * np.abs(y).max()
            y[q:q + len(tk)] += tk[:len(y) - q]
        n_in, n_out = int(0.005 * SR), int(0.04 * SR)
        y[:n_in] *= np.linspace(0, 1, n_in)
        y[-n_out:] *= np.linspace(1, 0, n_out)
        y = y * 0.89 / max(1e-9, np.abs(y).max())
        fatte[nome] = y
        if solo is None or nome in solo:
            scrivi(nome, y, catena)
    for nome, da, fino in PEZZI:
        if solo is None or nome in solo:
            # lo stesso suono, allo stesso livello: si toglie la coda, con 40 ms di uscita nel silenzio
            y = fatte[da][:int(fino * SR)].copy()
            n_out = int(0.04 * SR)
            y[-n_out:] *= np.linspace(1, 0, n_out)
            scrivi(nome, y, "pezzo di " + da)


if __name__ == "__main__":
    import sys
    main(set(sys.argv[1:]) or None)
