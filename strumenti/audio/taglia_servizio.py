# La voce di servizio (documento 35, §11): dal WAV di Google AI Studio («Kira», generato dall'autore) alle 41 parti,
# una per file, come le vuole il motore audio.
#
#   1. le parole della presa con i tempi (faster-whisper large-v3, strumenti/intro/trascrivi.py), allineate a quelle
#      attese dal manifest (doppiaggio/servizio/manifest.json): un allineamento globale, che tollera le parole
#      storpiate («accascata» per «a cascata») e le cifre al posto delle lettere;
#   2. ogni confine cade in un silenzio vero fra due parti: fra i silenzi della presa, il più lungo vicino a dove
#      Whisper lo mette (i suoi tempi, fra due parti vicine, sbagliano anche di mezzo secondo); niente tagli dentro
#      una parte;
#   3. ogni parte, tagliata ai due capi con un margine, passa dalla sua catena leggera: la tuta (la protezione, le
#      scritte, le letture dello scanner, la matrice) appena dentro il casco, due riflessioni di pochi millesimi e
#      una banda un poco più stretta; i suggerimenti, che sono il gioco, puliti;
#   4. una seconda trascrizione di ogni file, confrontata con il testo atteso: dice quali riascoltare.
#
#   python strumenti/audio/taglia_servizio.py audio/sorgenti/voce/servizio-kira-2026-11-07.wav
#   python strumenti/audio/taglia_servizio.py <wav> --solo-tagli     senza la seconda trascrizione
#
# Ne escono audio/musica-ia/SV/SV-nn-*.mp3 (44,1 kHz, mono, 112 kbps) con IMPRONTE.sha256, e
# doppiaggio/servizio/tagli.json: per ogni parte il file, l'inizio e la fine nella presa, la seconda trascrizione e
# la somiglianza col testo. La presa sta in audio/sorgenti/voce/, fuori da git; la sua impronta va in
# audio/LICENZE.md.
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys

import numpy as np
from scipy import signal

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
SERVIZIO = os.path.join(RADICE, "doppiaggio", "servizio")
USCITA = os.path.join(RADICE, "audio", "musica-ia", "SV")
SR = 44100
SOGLIA_DB = -48.0     # sotto questo, in blocchi di 10 ms, è silenzio
TESTA, CODA = 0.06, 0.18   # i secondi di silenzio che restano davanti e dietro le parole
FINESTRA = 0.9        # quanto lontano da dove Whisper mette il confine si cerca il silenzio
SOMIGLIANZA = 0.85    # sotto, la parte va riascoltata
CASCO = {"protezione", "schermo", "lettura", "etichetta", "matrice"}
CIFRE = {"35": "trentacinque", "150": "centocinquant", "340": "trecentoquaranta", "100": "cento", "18": "diciotto",
         "4": "quattro", "75": "settantacinque"}


def gettoni(testo):
    """Le parole di un testo, minuscole, senza punteggiatura; le cifre di Whisper tornano lettere, «%» «per cento»."""
    t = testo.lower().replace("’", "'").replace("%", " per cento ")
    t = re.sub(r"\b(\d+)\b", lambda m: CIFRE.get(m.group(1), m.group(1)), t)
    t = t.replace("accascata", "a cascata").replace("centocinquant'anni", "centocinquant anni")
    return re.findall(r"[a-zà-ÿ]+|\d+", t)


def leggi(f, sr):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def energie(x, sr):
    hop = int(sr * 0.01)
    n = len(x) // hop
    e = (x[:n * hop].reshape(n, hop) ** 2).mean(axis=1)
    return 10 * np.log10(e + 1e-12)


def silenzi(db, minimo=0.2):
    """I tratti di silenzio (inizio, fine) in secondi, almeno `minimo` lunghi."""
    out, da = [], None
    for k, v in enumerate(list(db) + [0.0]):
        if v < SOGLIA_DB:
            da = k if da is None else da
        elif da is not None:
            if (k - da) * 0.01 >= minimo:
                out.append((da * 0.01, k * 0.01))
            da = None
    return out


def allinea(parti, parole):
    """Per ogni parte, (prima parola, ultima parola) riconosciute, in secondi; None se Whisper non ne ha preso
    nessuna."""
    attese, di_chi = [], []
    for i, p in enumerate(parti):
        g = gettoni(p["voce"])
        attese += g
        di_chi += [i] * len(g)
    rico, tempi = [], []
    for w in parole:
        for g in gettoni(w["p"]):
            rico.append(g)
            tempi.append((w["t0"], w["t1"]))
    sm = difflib.SequenceMatcher(None, attese, rico, autojunk=False)
    limiti = [None] * len(parti)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            i = di_chi[a + k]
            t0, t1 = tempi[b + k]
            limiti[i] = (t0, t1) if limiti[i] is None else (min(limiti[i][0], t0), max(limiti[i][1], t1))
    presi = sum(n for _, _, n in sm.get_matching_blocks())
    print(f"allineamento: {presi} parole su {len(attese)} attese, {len(rico)} riconosciute")
    return limiti


def confini(limiti, sil, durata):
    """Dove tagliare fra una parte e la successiva: nel silenzio più lungo vicino al confine di Whisper."""
    out = []
    for i in range(len(limiti) - 1):
        a, b = limiti[i], limiti[i + 1]
        if a is None or b is None:
            raise SystemExit(f"la parte {i + 1 if a is None else i + 2} non è stata riconosciuta: da riascoltare")
        lo, hi = a[1] - FINESTRA, b[0] + FINESTRA
        candidati = [(s, e) for s, e in sil if e > lo and s < hi]
        if not candidati:
            raise SystemExit(f"nessun silenzio fra la parte {i + 1} e la {i + 2} ({a[1]:.2f}–{b[0]:.2f} s)")
        centro = (a[1] + b[0]) / 2
        s, e = max(candidati, key=lambda c: (c[1] - c[0]) - 0.3 * abs((c[0] + c[1]) / 2 - centro))
        out.append(((s + e) / 2, s, e))
    return out


def casco(y):
    """La tuta: appena dentro il casco. Una banda un poco più stretta e due riflessioni di pochi millesimi."""
    y = signal.sosfilt(signal.butter(2, 140, "highpass", fs=SR, output="sos"), y)
    y = signal.sosfilt(signal.butter(2, 8500, "lowpass", fs=SR, output="sos"), y)
    out = y.copy()
    for ms, giu in ((2.4, -19), (4.9, -23)):
        k = int(SR * ms / 1000)
        out[k:] += y[:-k] * 10 ** (giu / 20)
    return out


def pulita(y):
    return signal.sosfilt(signal.butter(2, 70, "highpass", fs=SR, output="sos"), y)


def nome_file(n, voce, gia):
    """«SV-nn-» e le prime parole; la matrice con il suo numero; se il nome c'è già, anche l'ultima parola."""
    parole = re.findall(r"[a-zà-ÿ]+", voce.lower().replace("’", " "))
    parole = [p.translate(str.maketrans("àèéìòù", "aeeiou")) for p in parole]
    if parole[:3] == ["matrice", "di", "traduzione"]:
        coda = ["matrice", parole[3]] + (["completata"] if "decodifica" in parole else [])
    else:
        coda = parole[:4]
        if "-".join(coda) in gia:
            coda.append(parole[-1])
    gia.add("-".join(coda))
    return f"SV-{n:02d}-" + "-".join(coda)


def main():
    presa = sys.argv[1]
    manifest = json.load(open(os.path.join(SERVIZIO, "manifest.json"), encoding="utf-8"))
    parti = manifest["parti"]
    tmp = os.path.join(os.environ.get("TEMP", "/tmp"), "taglia_servizio")
    os.makedirs(tmp, exist_ok=True)
    parole_json = os.path.join(tmp, "parole.json")
    impronta = hashlib.sha256(open(presa, "rb").read()).hexdigest()
    segno = os.path.join(tmp, "parole.sha256")
    if not (os.path.exists(parole_json) and os.path.exists(segno) and open(segno).read() == impronta):
        subprocess.run([sys.executable, os.path.join(RADICE, "strumenti", "intro", "trascrivi.py"), presa, parole_json],
                       check=True, stdout=subprocess.DEVNULL)
        open(segno, "w").write(impronta)
    parole = json.load(open(parole_json, encoding="utf-8"))

    x = leggi(presa, SR)
    durata = len(x) / SR
    db = energie(x, SR)
    sil = silenzi(db)
    limiti = allinea(parti, parole)
    tagli = confini(limiti, sil, durata)
    bordi = [0.0] + [c for c, _, _ in tagli] + [durata]

    os.makedirs(USCITA, exist_ok=True)
    for vecchio in os.listdir(USCITA):
        if vecchio.startswith("SV-") and vecchio.endswith(".mp3"):
            os.remove(os.path.join(USCITA, vecchio))
    rapporto, impronte, gia = {}, [], set()
    for i, p in enumerate(parti):
        a, b = bordi[i], bordi[i + 1]
        # le parole: dal primo all'ultimo blocco sopra la soglia, dentro i bordi
        k0, k1 = int(a * 100), min(int(b * 100), len(db))
        sopra = [k for k in range(k0, k1) if db[k] >= SOGLIA_DB]
        if not sopra:
            raise SystemExit(f"la parte {i + 1} è vuota")
        s = max(a, sopra[0] * 0.01 - TESTA)
        e = min(b, (sopra[-1] + 1) * 0.01 + CODA)
        y = x[int(s * SR):int(e * SR)].copy()
        y = casco(y) if p["tipo"] in CASCO else pulita(y)
        n_in, n_out = int(0.004 * SR), int(0.03 * SR)
        y[:n_in] *= np.linspace(0, 1, n_in)
        y[-n_out:] *= np.linspace(1, 0, n_out)
        y *= 0.89 / max(1e-9, np.abs(y).max())
        nome = nome_file(i + 1, p["voce"], gia)
        f = os.path.join(USCITA, nome + ".mp3")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-c:a", "libmp3lame", "-b:a", "112k", "-write_xing", "1", f],
                       input=np.clip(y, -1, 1).astype(np.float32).tobytes(), check=True)
        impronte.append(f"{hashlib.sha256(open(f, 'rb').read()).hexdigest()}  {nome}.mp3")
        rapporto[p["id"]] = {"file": nome, "tipo": p["tipo"], "inizio": round(s, 2), "fine": round(e, 2),
                             "durata": round(e - s, 2)}
        print(f"{nome:48} {s:7.2f}–{e:7.2f}  {e - s:5.2f} s  {p['tipo']}")
    with open(os.path.join(USCITA, "IMPRONTE.sha256"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(impronte) + "\n")

    if "--solo-tagli" not in sys.argv:
        from faster_whisper import WhisperModel
        modello = WhisperModel("large-v3", device="cpu", compute_type="int8")
        da_sentire = []
        for p in parti:
            r = rapporto[p["id"]]
            seg, _ = modello.transcribe(os.path.join(USCITA, r["file"] + ".mp3"), language="it", beam_size=5,
                                        vad_filter=False, condition_on_previous_text=False)
            detto = " ".join(s.text.strip() for s in seg)
            # per parole e per lettere: Whisper divide a modo suo le parole che si pronunciano uguali («a costa»
            # per «accosta», «traduci le» per «traducile»)
            sim = max(difflib.SequenceMatcher(None, gettoni(p["voce"]), gettoni(detto), autojunk=False).ratio(),
                      difflib.SequenceMatcher(None, "".join(gettoni(p["voce"])), "".join(gettoni(detto)),
                                              autojunk=False).ratio())
            r["whisper"], r["somiglianza"] = detto, round(sim, 2)
            segno_ = "  " if sim >= SOMIGLIANZA else "!!"
            print(f"{segno_} {sim:.2f}  {r['file']:44} {detto}")
            if sim < SOMIGLIANZA:
                da_sentire.append(r["file"])
        print(f"\n{len(parti)} parti; da riascoltare: {len(da_sentire)} {da_sentire}")
    with open(os.path.join(SERVIZIO, "tagli.json"), "w", encoding="utf-8", newline="\n") as fh:
        json.dump({"presa": os.path.basename(presa), "sha256": impronta, "parti": rapporto}, fh, ensure_ascii=False,
                  indent=1)
        fh.write("\n")


if __name__ == "__main__":
    main()
