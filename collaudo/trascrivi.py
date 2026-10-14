# trascrivi.py — gioca un percorso di comandi e ne scrive la trascrizione,
# come la vedrebbe chi gioca: prologo, prima stanza, poi «> comando» e risposta.
#
# Uso (dalla radice del progetto):
#   python collaudo/trascrivi.py relitto-silente/relitto.fav collaudo/soluzione.txt
#   python collaudo/trascrivi.py relitto-silente/relitto.fav collaudo/soluzione.txt -o collaudo/trascrizione.txt
#
# Il percorso è un file con un comando per riga; righe vuote e «#…» sono ignorate.
# A fine partita stampa lo stato: in corso, vinta o persa, e i contatori.

import argparse
import contextlib
import io
import os
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(QUI, "..", "motore"))

from compilatore import compila_mondo          # noqa: E402
from esploratore import Partita, leggi_percorso  # noqa: E402


def trascrivi(storia, percorso):
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        mondo = compila_mondo(storia)
    if mondo is None:
        # compila_mondo tace: le diagnostiche le stampa analizza_file.
        from compilatore import analizza_file
        diag = io.StringIO()
        with contextlib.redirect_stdout(diag):
            analizza_file(storia)
        return None, "Compilazione fallita:\n" + buf.getvalue() + diag.getvalue()
    p = Partita(mondo, seme=1)
    righe = []
    prologo = getattr(p.m, "prologo", None)
    if prologo:
        righe.append(prologo.replace("\\n", "\n").rstrip() + "\n")
    righe.append(p.risposte[0].rstrip() + "\n")
    for cmd in leggi_percorso(percorso):
        if not p.in_corso:
            righe.append(f"(partita finita: «{cmd}» e i seguenti non giocati)")
            break
        out = p.esegui(cmd)
        righe.append(f"> {cmd}\n{out.rstrip()}\n")
    contatori = {k: v for k, v in p.m.variabili.items()
                 if isinstance(v, int) and not isinstance(v, bool)}
    righe.append("=" * 60)
    righe.append(f"Stato: {p.m.stato_partita} · stanza: {p.m.posizione_giocatore} · "
                 f"comandi: {len(p.comandi)} · eccezioni del motore: {len(p.eccezioni)}")
    righe.append("Contatori: " + ", ".join(f"{k}={v}" for k, v in sorted(contatori.items())))
    for cmd, tb in p.eccezioni:
        righe.append(f"[ECCEZIONE] «{cmd}»\n{tb}")
    return p, "\n".join(righe) + "\n"


def main():
    ap = argparse.ArgumentParser(description="Trascrive una partita giocata da un percorso.")
    ap.add_argument("storia")
    ap.add_argument("percorso")
    ap.add_argument("-o", "--output", help="file in cui scrivere la trascrizione")
    a = ap.parse_args()
    p, testo = trascrivi(a.storia, a.percorso)
    if a.output:
        with io.open(a.output, "w", encoding="utf-8", newline="\n") as f:
            f.write(testo)
        print(testo.splitlines()[-2] if p else testo)
        print(f"Trascrizione scritta in {a.output}")
    else:
        sys.stdout.reconfigure(encoding="utf-8")
        print(testo)
    return 0 if p is not None else 2


if __name__ == "__main__":
    sys.exit(main())
