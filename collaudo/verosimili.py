# verosimili.py — tante partite da principiante verosimili, per il bilancio dell'aria (RN-F1).
#
# Tre partite scritte a mano sono tre esempi. Qui, da ogni percorso «intenzione»
# (collaudo/principiante-*.txt) si ricavano N partite diverse: ogni voce, ogni
# traduzione e ogni errore si fa oppure no, secondo il carattere di chi gioca; la
# cella e la ricarica le usa da sé, come farebbe un principiante (aria.py, reattivo).
# Il conto finale dice quanto è verosimile farcela: quanti arrivano alla Grande Porta
# sopra il 30%, quanti tornano vivi, con quanta aria, quanti sentono quasi tutto.
#
# Uso (dalla radice del progetto):
#   python collaudo/verosimili.py relitto-silente/relitto.fav
#   python collaudo/verosimili.py relitto-silente/relitto.fav -n 400 --seme 7
#   python collaudo/verosimili.py relitto-silente/relitto.fav --fuga 0.5   (errori nella fuga a metà)
#
# Le probabilità dei caratteri sono una scelta a tavolino (documento 33, RN-F1):
# «voce» è la prima eco di una cosa, «profondo» il secondo strato, «errore» toccare
# le venature o allungare la mano sull'arnese, «reagisce» abbassare il faro appena
# il groviglio lo sente, «pazienza» aspettare il pilastro invece della taglierina.
# Nella fuga, dove ogni turno costa aria: «spreco» è un passo perso prima di ogni mossa
# (guardarsi intorno, esaminare: le uscite sbagliate non costano), «deviazione» entrare
# nel vivaio dalla sala delle teche e tornare indietro, «ignora» passare oltre l'avviso
# del Ponte senza andare a ricaricare.
# Il «maldestro» è un curioso che fa quasi tutti gli errori: serve a vedere i più sfortunati.

import argparse
import contextlib
import io
import os
import random
import re
import statistics
import sys
from multiprocessing import Pool

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(QUI, "..", "motore"))
sys.path.insert(0, QUI)

CARATTERI = {
    "curioso": dict(base="principiante-curioso.txt", voce=.9, profondo=.8, traduci=.8,
                    errore=.6, reagisce=.5, pazienza=.7, spreco=.3, deviazione=.2, ignora=.3),
    "vuole tutto": dict(base="principiante-curioso.txt", voce=1, profondo=1, traduci=1,
                        errore=.6, reagisce=.5, pazienza=1, spreco=.3, deviazione=.2, ignora=.5),
    "medio": dict(base="principiante-curioso.txt", voce=.6, profondo=.4, traduci=.5,
                  errore=.5, reagisce=.5, pazienza=.5, spreco=.2, deviazione=.2, ignora=.3),
    "maldestro": dict(base="principiante-curioso.txt", voce=.8, profondo=.6, traduci=.7,
                      errore=.9, reagisce=.2, pazienza=.7, spreco=.4, deviazione=.4, ignora=.5),
    "sperduto": dict(base="principiante-sperduto.txt", voce=.8, profondo=.6, traduci=.9,
                     errore=.8, reagisce=.3, pazienza=.6, spreco=.5, deviazione=.5, ignora=.3),
    "frettoloso": dict(base="principiante-frettoloso.txt", voce=.5, profondo=0, traduci=0,
                       errore=.5, reagisce=.5, pazienza=0, spreco=.1, deviazione=.2, ignora=.3),
}

PRIMA_NOTA = "Due cose che non si sono mai conosciute"
ERRORI = ("tocca le venature", "prendi il risuonatore", "tocca il risuonatore")


def varia(comandi, c, rng):
    """Una partita: il percorso con le cose facoltative fatte oppure no."""
    out, i, viste = [], 0, {}
    semi = [k for k, x in enumerate(comandi) if x.lower() == "prendi il seme"]
    fuga = semi[-1] if semi else len(comandi)
    deviato = False
    while i < len(comandi):
        cmd = comandi[i]
        low = cmd.lower()
        if i > fuga:
            if rng.random() < c["spreco"]:
                out.append("guarda")
            out.append(cmd)
            if low == "ovest" and not deviato:
                deviato = True
                if rng.random() < c["deviazione"]:
                    out += ["ovest", "est"]
            i += 1
            continue
        if low == "parla con l'eco":
            j = i
            while j < len(comandi) and comandi[j] != "Lascia stare.":
                j += 1
            gruppo = comandi[i:j + 1]
            if rng.random() < c["voce"]:
                out += gruppo
            i = j + 1
            continue
        if low == "aspetta" and i + 1 < len(comandi) and comandi[i + 1].lower() == "aspetta":
            j = i
            while j < len(comandi) and comandi[j].lower() == "aspetta":
                j += 1
            out += comandi[i:j] if rng.random() < c["pazienza"] else ["usa la taglierina sul terminale"]
            i = j
            continue
        if low.startswith("sintonizza "):
            n = viste.get(low, 0)
            viste[low] = n + 1
            if rng.random() < (c["voce"] if n == 0 else c["profondo"]):
                out.append(cmd)
        elif low == "ascolta la scatola nera":
            if rng.random() < c["voce"]:
                out.append(cmd)
        elif low.startswith("traduci "):
            if rng.random() < c["traduci"]:
                out.append(cmd)
        elif low in ERRORI:
            if rng.random() < c["errore"]:
                out.append(cmd)
        elif low == "esamina il groviglio":
            out.append("abbassa il faro" if rng.random() < c["reagisce"] else cmd)
        else:
            out.append(cmd)
        i += 1
    return out


_MONDO = None
_BASI = {}


def _inizia(storia):
    global _MONDO
    from compilatore import compila_mondo
    with contextlib.redirect_stdout(io.StringIO()):
        _MONDO = compila_mondo(storia)


def _gioca(compito):
    from esploratore import leggi_percorso
    import aria as A
    nome, seme, scala = compito
    c = dict(CARATTERI[nome])
    for k in ("spreco", "deviazione"):
        c[k] = min(1.0, c[k] * scala)
    if c["base"] not in _BASI:
        _BASI[c["base"]] = list(leggi_percorso(os.path.join(QUI, c["base"])))
    rng = random.Random(seme)
    comandi = varia(_BASI[c["base"]], c, rng)
    p, passi, tre, sotto = A.misura(_MONDO, None, True, comandi, ignora_avviso=rng.random() < c["ignora"])
    v = lambda k: A._valore(p.m, k) or 0
    prima_porta = [s for s in passi if not tre or s["n"] <= tre["n"]]
    return {
        "carattere": nome,
        "vinta": p.m.stato_partita == "vinta",
        "porta": tre["aria"] if tre else None,
        "protezione": any(s["aria"] < 30 and not s["fuga"] for s in prima_porta),
        "fine": v("aria"),
        "voci": v("echi") + v("risonanze"),
        "prima_nota": p.m.stato_partita == "vinta" and PRIMA_NOTA in (p.risposte[-1] if p.risposte else ""),
        "eccezioni": len(p.eccezioni),
    }


def simula(storia, caratteri=None, n=200, seme=1, processi=None, fuga=1.0):
    """fuga moltiplica gli errori nella fuga (spreco e deviazione): 0 è la fuga
    perfetta, 1 quella dei caratteri, 0.5 una via di mezzo."""
    caratteri = caratteri or list(CARATTERI)
    compiti = [(c, seme * 100003 + i, fuga) for c in caratteri for i in range(n)]
    with Pool(processi or max(1, (os.cpu_count() or 2) - 2), initializer=_inizia,
              initargs=(storia,)) as pool:
        esiti = pool.map(_gioca, compiti, chunksize=8)
    conto = {}
    for c in caratteri:
        e = [x for x in esiti if x["carattere"] == c]
        porte = [x["porta"] for x in e if x["porta"] is not None]
        vive = [x["fine"] for x in e if x["vinta"]]
        conto[c] = {
            "partite": len(e),
            "porta_sopra_30": sum(1 for a in porte if a > 30) / max(1, len(porte)),
            "protezione": sum(1 for x in e if x["protezione"]) / len(e),
            "vivi": len(vive) / len(e),
            "prima_nota": sum(1 for x in e if x["prima_nota"]) / len(e),
            "aria_mediana": statistics.median(vive) if vive else None,
            "aria_bassa": sorted(vive)[len(vive) // 10] if vive else None,
            "voci": statistics.mean(x["voci"] for x in e),
            "eccezioni": sum(x["eccezioni"] for x in e),
        }
    return conto


def tabella(conto):
    righe = [f"  {'carattere':12s} {'porta>30':>8s} {'protez.':>8s} {'vivi':>6s} {'1ª nota':>8s} "
             f"{'aria fine':>9s} {'10% più bassi':>13s} {'voci':>5s}"]
    for c, k in conto.items():
        pct = lambda x: f"{round(100 * x):d}%"
        righe.append(f"  {c:12s} {pct(k['porta_sopra_30']):>8s} {pct(k['protezione']):>8s} "
                     f"{pct(k['vivi']):>6s} {pct(k['prima_nota']):>8s} "
                     f"{str(k['aria_mediana']):>9s} {str(k['aria_bassa']):>13s} {k['voci']:5.1f}"
                     + (f"  [eccezioni {k['eccezioni']}]" if k["eccezioni"] else ""))
    return "\n".join(righe)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description="Partite da principiante verosimili: il bilancio dell'aria.")
    ap.add_argument("storia")
    ap.add_argument("-n", type=int, default=200, help="partite per carattere (200)")
    ap.add_argument("--seme", type=int, default=1)
    ap.add_argument("--fuga", type=float, default=1.0,
                    help="quanto sbagliano nella fuga: 0 mai, 1 come i caratteri (1)")
    args = ap.parse_args()
    print(tabella(simula(args.storia, n=args.n, seme=args.seme, fuga=args.fuga)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
