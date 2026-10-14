# pulsanti.py — gioca i percorsi di collaudo con i soli pulsanti, attraverso
# il ponte dell'app (app/src/motore/ponte.py), e controlla le loro attese.
#
# Uso (dalla radice del progetto):
#   python collaudo/pulsanti.py                 tutti i percorsi con «# atteso:»
#   python collaudo/pulsanti.py collaudo/vivi.txt
#   python collaudo/pulsanti.py -v collaudo/vivi.txt    ogni passo, con il pulsante scelto
#
# Ogni comando del percorso diventa la pressione di un pulsante che il motore
# offre in quel momento: lo stesso comando, o uno che porta allo stesso stato
# (vedi rel_pulsante_per nel ponte). Un comando che non cambia niente, nemmeno
# il turno, si salta: con i pulsanti non si preme niente. Se nessun pulsante lo gioca, il percorso
# fallisce: è la prova che l'interfaccia a pulsanti non blocca nessun finale.
# È lo stesso ponte che gira in Pyodide dentro l'app.

import argparse
import glob
import json
import os
import sys
import time
from types import SimpleNamespace

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(QUI)
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))
sys.path.insert(0, QUI)

import ponte                                      # noqa: E402
from regressioni import controlla, leggi_attese   # noqa: E402

STORIA = os.path.join(RADICE, "relitto-silente", "relitto.fav")


def testo(turno):
    return "".join(("\n" if e.get("stacco") else "") + e["testo"] + "\n" for e in turno["eventi"])


def gioca(percorso, verboso=False):
    dati = json.loads(ponte.rel_percorso(percorso))
    turno = json.loads(ponte.rel_avvia(1))
    risposte, comandi, non_trovati = [testo(turno)], [], []
    modi = {"uguale": 0, "equivalente": 0, "stesso stato": [], "nessun effetto": []}
    for cmd in dati["comandi"]:
        if ponte._mondo.stato_partita != "in_corso":
            break
        scelta = json.loads(ponte.rel_pulsante_per(cmd))
        if not scelta["trovato"]:
            non_trovati.append(cmd)
            break
        if scelta["modo"] == "stesso stato":
            modi["stesso stato"].append(f"{cmd} → {scelta['comando']}")
        elif scelta["modo"] == "nessun effetto":
            modi["nessun effetto"].append(cmd)
        else:
            modi[scelta["modo"]] += 1
        if verboso:
            segno = {"uguale": "=", "equivalente": "≈", "stesso stato": "~", "nessun effetto": "∅"}[scelta["modo"]]
            print(f"  {segno} {cmd!r:42} → [{scelta['gruppo']}] {scelta['comando']}")
        if scelta["comando"] is None:
            continue   # un comando senza effetto: con i pulsanti non si preme niente
        turno = json.loads(ponte.rel_comando(scelta["comando"]))
        comandi.append(cmd)
        risposte.append(testo(turno))
    p = SimpleNamespace(m=ponte._mondo, risposte=risposte, comandi=comandi)
    problemi = [(a, motivo) for a in dati["attese"] if (motivo := controlla(a, p))]
    if non_trovati:
        problemi.append(("ogni comando ha il suo pulsante", f"nessun pulsante per «{non_trovati[0]}»"))
    return problemi, len(comandi), modi


def main():
    ap = argparse.ArgumentParser(description="I percorsi di collaudo a soli pulsanti.")
    ap.add_argument("percorsi", nargs="*")
    ap.add_argument("-v", "--verboso", action="store_true")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    esito = json.loads(ponte.rel_compila(STORIA))
    if not esito["ok"]:
        print("Compilazione fallita:", esito.get("errore"), esito.get("rapporto", ""))
        return 2
    percorsi = a.percorsi or sorted(f for f in glob.glob(os.path.join(QUI, "*.txt")) if leggi_attese(f))
    falliti, totale, conti = 0, 0, {"uguale": 0, "equivalente": 0, "stesso stato": 0, "nessun effetto": 0}
    for percorso in percorsi:
        t0 = time.perf_counter()
        problemi, giocati, modi = gioca(percorso, a.verboso)
        totale += giocati
        conti["uguale"] += modi["uguale"]
        conti["equivalente"] += modi["equivalente"]
        conti["stesso stato"] += len(modi["stesso stato"])
        conti["nessun effetto"] += len(modi["nessun effetto"])
        nome = os.path.relpath(percorso, RADICE).replace(os.sep, "/")
        dettaglio = (f"{giocati} pulsanti: {modi['uguale']} uguali, {modi['equivalente']} equivalenti, "
                     f"{len(modi['stesso stato'])} con lo stesso stato"
                     + (f", {len(modi['nessun effetto'])} senza effetto" if modi["nessun effetto"] else "")
                     + f"; {time.perf_counter() - t0:.1f} s")
        if problemi:
            falliti += 1
            print(f"[NO] {nome} ({dettaglio})")
            for attesa, motivo in problemi:
                print(f"     {attesa}: {motivo}")
        else:
            print(f"[OK] {nome} ({dettaglio})")
        for riga in sorted(set(modi["stesso stato"])):
            print(f"     ~ {riga} (risposta diversa)")
        for riga in sorted(set(modi["nessun effetto"])):
            print(f"     ∅ {riga} (non cambia niente: nessun pulsante)")
    print(f"\nPercorsi: {len(percorsi)}; falliti: {falliti}. Comandi giocati con i pulsanti: {totale}: "
          f"{conti['uguale']} con lo stesso comando, {conti['equivalente']} con uno equivalente "
          f"(stesso stato, stessa risposta), {conti['stesso stato']} con lo stesso stato e una risposta "
          f"diversa; {conti['nessun effetto']} comandi senza effetto, saltati.")
    return 1 if falliti else 0


if __name__ == "__main__":
    sys.exit(main())
