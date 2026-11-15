# Le due voci dell'intro nello spazio (documento 09, §17; l'autore, 15 novembre 2026): quando il nero con la luce
# verde è diventato lo spazio parte il registro di bordo di William, detto da Leonardo Tomassetti; subito dopo, un
# beep di registrazione e il messaggio di Yusuf, in quattro pezzi separati da un beep, «come se fossero più pezzi, ma
# tutto molto legato, senza lasciare troppi spazi vuoti. Yusuf deve sembrare che parte dalla radio».
#
#   python strumenti/intro/voci_spazio.py [presa di William.wav]
#
# Senza argomento la presa di William è quella già copiata in audio/sorgenti/voce/ (fuori da git).
#
# Ne escono:
#   audio/musica-ia/WI/WI-01-registro-di-bordo.mp3   William: la presa intera, pulita. Tagliato solo il silenzio ai
#                                                    due capi; portata a livello, con i picchi tenuti sotto −3 dB
#   audio/musica-ia/YU/YU-09-messaggio-intro.mp3     Yusuf: beep, pezzo, beep, pezzo… dalla radio di plancia
#   app/src/intro/spazio.ts                          le durate e le frasi con i loro tempi, per la scaletta
#
# William non si tocca: nessun filtro, nessun taglio dentro la presa (i respiri e le pause sono suoi).
# Yusuf: la presa del 14 novembre (documento 35, §12) tagliata nei silenzi veri fra una frase e l'altra, mai dentro
# una frase; i pezzi tengono le loro pause, fra un pezzo e l'altro c'è il beep. La radio è quella di bordo
# (strumenti/audio/voce_yusuf.py), un poco più stretta perché è una registrazione riascoltata, con un filo di
# portante sotto che comincia con il primo beep e si chiude dopo l'ultima parola.
# Il beep: una nota sola, corta, nella tonalità del tema (un si), con il colore della stessa radio, due decibel
# sotto le parole: si deve sentire come il segno fra un messaggio e l'altro, non come un allarme.
import hashlib
import json
import os
import shutil
import subprocess
import sys

import numpy as np
from scipy import signal

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
SORGENTI = os.path.join(RADICE, "audio", "sorgenti", "voce")
MUSICA = os.path.join(RADICE, "audio", "musica-ia")
SR = 44100

WILLIAM_SORGENTE = "william-registro-intro-leonardo-2026-11-15.wav"
YUSUF_SORGENTE = "yusuf-messaggio-intro-presa1-2026-11-14.mp3"

# William: dove comincia e dove finisce il suono nella presa (i silenzi sotto −55 dB), e le frasi, per chi non sente
# la voce. (da, a) nella presa; il testo è quello che Leonardo ha letto (la versione scritta sul registro di carta).
WILLIAM_SUONO = (0.34, 41.88)
WILLIAM_FRASI = [
    (0.34, 6.32, "«Registro di bordo della Santa Maria. Matricola TSC-1972."),
    (7.22, 12.32, "Il capitano, William T. Eriksonn, che è anche tutto l’equipaggio."),
    (13.46, 16.70, "Navigazione regolare. Pilota automatico."),
    (17.62, 22.28, "Il reattore fa il suo solito lamento. Il giorno che smetterà, mi preoccuperò."),
    (23.34, 25.76, "Il quadrante del margine non lo guardo."),
    (26.28, 29.26, "Yusuf lo chiamerò quando avrò qualcosa da dirgli."),
    (30.50, 35.22, "Lo dico ad alta voce mentre lo scrivo. Spesso non ho di meglio da fare."),
    (36.42, 41.88, "Settimana sei. Stiva vuota. Nessun contatto. W. T.»"),
]
# quando dice il suo nome («William T. Eriksonn»): lì entra il credito di Leonardo
WILLIAM_NOME = 8.48

# Yusuf: i quattro pezzi (da, a) nella presa, tagliati nei silenzi, e le frasi di ogni pezzo con i loro tempi
YUSUF_PEZZI = [
    (0.00, 8.42, [(0.00, 8.32, "«William. Sono Yusuf. Lo so che li ricevi, i miei messaggi: la radio di quella carretta funziona benissimo, quando sei tu ad aver bisogno di qualcosa.")]),
    (8.64, 21.98, [(8.74, 15.66, "Sei settimane, maledetto. I filtri, le guarnizioni, la cella buona: tutto a credito, e da te non è arrivato niente."),
                   (15.88, 21.88, "Né i soldi né la roba. Qui c’è gente che chiede a me, non a te. Così mi farai finire nei guai, lo capisci?")]),
    (22.24, 28.04, [(22.34, 27.94, "…otto, nove, dieci. Richiamami. Anche solo per dirmi di no.")]),
    (28.36, None, [(28.46, 34.48, "E se quella carretta ti ha mollato alla deriva… almeno dimmelo. Magazzino Quattro, chiudo.»")]),
]
# «Sono Yusuf»: lì entra il credito
YUSUF_NOME = 0.46

BEEP_HZ = 987.77  # un si: la tonalità del tema della Santa Maria
BEEP_S = 0.30
BEEP_SOTTO_LE_PAROLE = -2.0  # dB, rispetto al livello delle parole di Yusuf (la mediana, come la misura il gioco)
PRIMA_DEL_PEZZO = 0.24  # dal beep alla voce
DOPO_IL_PEZZO = 0.30  # dalla voce al beep
CODA = 0.45  # dopo l'ultima parola la portante si chiude


def leggi(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def scrivi_mp3(x, f, kbps):
    os.makedirs(os.path.dirname(f), exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "libmp3lame", "-b:a", f"{kbps}k", "-write_xing", "1", f],
                   input=np.clip(x, -1, 1).astype(np.float32).tobytes(), check=True)


def parlato_db(x):
    """Il livello delle parole, come lo misura il lettore del gioco: la mediana dei pezzi di 50 ms entro 30 dB dal
    più forte."""
    n = int(0.05 * SR)
    e = np.array([10 * np.log10(np.mean(x[i:i + n] ** 2) + 1e-20) for i in range(0, len(x) - n, n)])
    p = np.sort(e[e > e.max() - 30])
    return p[len(p) // 2]


def sfuma(x, entra, esce):
    x = x.copy()
    a, b = int(entra * SR), int(esce * SR)
    x[:a] *= np.linspace(0, 1, a)
    x[-b:] *= np.linspace(1, 0, b)
    return x


def william(presa):
    x = leggi(presa)
    da, a = WILLIAM_SUONO
    testa, coda = 0.15, 0.35
    t0 = da - testa
    y = sfuma(x[int(t0 * SR):int((a + coda) * SR)], 0.01, 0.05)
    # il parlato a −23 dBFS; i picchi sopra −6 dB si piegano piano fino a un tetto di −3 (qualche consonante e basta)
    y *= 10 ** ((-23 - parlato_db(y)) / 20)
    soglia, tetto = 10 ** (-6 / 20), 10 ** (-3 / 20)
    sopra = np.abs(y) > soglia
    toccati = int(sopra.sum())
    y[sopra] = np.sign(y[sopra]) * (soglia + (tetto - soglia) * np.tanh((np.abs(y[sopra]) - soglia) / (tetto - soglia)))
    f = os.path.join(MUSICA, "WI", "WI-01-registro-di-bordo.mp3")
    scrivi_mp3(y, f, 160)
    print(f"{os.path.relpath(f, RADICE)}: {len(y) / SR:.2f} s, parlato {parlato_db(y):.1f} dB, picco {20 * np.log10(np.abs(y).max()):.1f} dB, "
          f"{toccati} campioni piegati su {len(y)}")
    frasi = [dict(da=round(d - t0, 2), a=round(e - t0, 2), testo=t) for d, e, t in WILLIAM_FRASI]
    return dict(dura=round(len(y) / SR, 2), nome=round(WILLIAM_NOME - t0, 2), frasi=frasi)


def picco(f0, guadagno_db, q):
    a = 10 ** (guadagno_db / 40)
    w0 = 2 * np.pi * f0 / SR
    al = np.sin(w0) / (2 * q)
    b = [1 + al * a, -2 * np.cos(w0), 1 - al * a]
    d = [1 + al / a, -2 * np.cos(w0), 1 - al / a]
    return np.array(b) / d[0], np.array(d) / d[0]


def banda(x):
    """Il colore della radio: la banda di bordo (voce_yusuf.py), un poco più stretta, con un filo di presenza."""
    y = signal.sosfilt(signal.butter(2, 250, "highpass", fs=SR, output="sos"), x)
    y = signal.sosfilt(signal.butter(2, 4300, "lowpass", fs=SR, output="sos"), y)
    return signal.lfilter(*picco(2000, 2.5, 0.9), y)


def radio(x):
    """La radio di plancia che riascolta una registrazione: la banda, una saturazione appena, un compressore lento."""
    y = banda(x)
    y *= 0.5 / max(1e-9, np.abs(y).max())
    y = np.tanh(1.5 * y) / np.tanh(1.5)
    e = np.sqrt(signal.lfilter([0.002], [1, -0.998], y * y)) + 1e-9
    liv = 20 * np.log10(e)
    riduzione = np.where(liv > -30, (liv + 30) * (1 - 1 / 2.5), 0.0)
    riduzione = signal.lfilter([0.01], [1, -0.99], riduzione)
    return y * 10 ** (-riduzione / 20)


def yusuf():
    x = leggi(os.path.join(SORGENTI, YUSUF_SORGENTE))
    t = np.arange(int(BEEP_S * SR)) / SR
    # il beep: una nota sola, l'attacco e il rilascio morbidi; il suo posto resta vuoto finché la voce non è
    # passata dalla radio, poi ci si mette al livello giusto rispetto alle parole
    nota = sfuma(np.sin(2 * np.pi * BEEP_HZ * t), 0.012, 0.05)
    beep = np.zeros(len(nota))
    pezzi, frasi, dove, posti = [], [], 0.0, []

    def metti(s):
        nonlocal dove
        pezzi.append(s)
        dove += len(s) / SR

    nome = None
    for k, (da, a, righe) in enumerate(YUSUF_PEZZI):
        a = len(x) / SR if a is None else a
        posti.append(int(round(dove * SR)))
        metti(beep)
        metti(np.zeros(int(PRIMA_DEL_PEZZO * SR)))
        t0 = dove - da
        if k == 0:
            nome = round(t0 + YUSUF_NOME, 2)
        for d, e, testo in righe:
            frasi.append(dict(da=round(t0 + d, 2), a=round(t0 + e, 2), testo=testo))
        metti(sfuma(x[int(da * SR):int(a * SR)], 0.005, 0.03))
        if k < len(YUSUF_PEZZI) - 1:
            metti(np.zeros(int(DOPO_IL_PEZZO * SR)))
    metti(np.zeros(int(CODA * SR)))
    y = radio(np.concatenate(pezzi))
    colorata = banda(nota)
    colorata *= 10 ** ((parlato_db(y) + BEEP_SOTTO_LE_PAROLE) / 20) / np.sqrt(np.mean(colorata ** 2))
    for i in posti:
        y[i:i + len(colorata)] += colorata
    # la portante: un soffio nella banda della radio, 30 dB sotto le parole; si apre con il primo beep e si chiude
    # da sé, con un piccolo sbuffo, dopo l'ultima parola
    rng = np.random.default_rng(1972)
    soffio = signal.sosfilt(signal.butter(2, [350, 4000], "bandpass", fs=SR, output="sos"), rng.standard_normal(len(y)))
    soffio *= 10 ** ((parlato_db(y) - 30) / 20) / np.sqrt(np.mean(soffio ** 2))
    fine = len(y) - int(0.20 * SR)
    busta = np.ones(len(y))
    busta[:int(0.03 * SR)] = np.linspace(0, 1, int(0.03 * SR))
    n = int(0.09 * SR)
    busta[fine:fine + n] = 1 + 1.6 * np.exp(-np.arange(n) / (0.02 * SR))  # lo sbuffo della portante che si chiude
    busta[fine + n:] = 0
    k = int(0.012 * SR)
    busta[fine + n - k:fine + n] *= np.linspace(1, 0, k)
    y = (y + soffio * busta)
    y[fine + n:] = 0
    y = y[:fine + n + int(0.05 * SR)]
    y *= 0.89 / np.abs(y).max()
    f = os.path.join(MUSICA, "YU", "YU-09-messaggio-intro.mp3")
    scrivi_mp3(y, f, 112)
    print(f"{os.path.relpath(f, RADICE)}: {len(y) / SR:.2f} s, parlato {parlato_db(y):.1f} dB, picco {20 * np.log10(np.abs(y).max()):.1f} dB")
    return dict(dura=round(len(y) / SR, 2), nome=nome, frasi=frasi)


def impronta(f):
    return hashlib.sha256(open(f, "rb").read()).hexdigest()


if __name__ == "__main__":
    presa = os.path.join(SORGENTI, WILLIAM_SORGENTE)
    if len(sys.argv) > 1:
        os.makedirs(SORGENTI, exist_ok=True)
        shutil.copyfile(sys.argv[1], presa)
    w = william(presa)
    u = yusuf()
    print("le sorgenti:")
    for f in (WILLIAM_SORGENTE, YUSUF_SORGENTE):
        print(f"  {f}  SHA-256 {impronta(os.path.join(SORGENTI, f))}")
    ts = os.path.join(RADICE, "app", "src", "intro", "spazio.ts")
    with open(ts, "w", encoding="utf-8", newline="\n") as o:
        o.write("// Scritto da strumenti/intro/voci_spazio.py: non si corregge a mano.\n"
                "// Le due voci dell'intro nello spazio (documento 09, §17): il registro di bordo di William, detto da\n"
                "// Leonardo Tomassetti, e il messaggio di Yusuf dalla radio. Un file ciascuna, che si suona intero:\n"
                "// quanto dura, quando dice il suo nome, e le frasi con i loro tempi nel file (per chi non sente la voce).\n"
                "export interface VoceNelloSpazio {\n  dura: number;\n  nome: number;\n  frasi: { da: number; a: number; testo: string }[];\n}\n\n")
        o.write("export const REGISTRO: VoceNelloSpazio = " + json.dumps(w, ensure_ascii=False, indent=2) + ";\n\n")
        o.write("export const MESSAGGIO: VoceNelloSpazio = " + json.dumps(u, ensure_ascii=False, indent=2) + ";\n")
    print(os.path.relpath(ts, RADICE))
