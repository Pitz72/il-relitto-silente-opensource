# traccia.py — la traccia sonora di un percorso: i turni come il ponte li manda al suono.
#
# Uso (dalla radice del progetto):
#   python strumenti/audio/traccia.py collaudo/vivi.txt                 scrive la traccia accanto,
#                                                                         in tracce/vivi.json
#   python strumenti/audio/traccia.py collaudo/vivi.txt --uscita x.json
#   python strumenti/audio/traccia.py --tutti --cartella <cartella>       tutti i percorsi di collaudo
#
# Gioca il percorso con il ponte vero, in CPython, con il seme 1 (lo stesso del collaudo),
# e per ogni turno scrive il comando, quanti caratteri di testo porta (per dargli il tempo
# di essere letto) e `turno.suono`, cioè gli stati e gli eventi così come l'app li manda al
# motore audio. L'esempio Rust `rendi_partita` rende la traccia su file
# (app/src-tauri/examples/rendi_partita.rs); `prova_partite` la gioca tutta in fretta e
# controlla che il suono la regga.

import argparse
import glob
import json
import os
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(os.path.dirname(QUI))
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))
sys.path.insert(0, os.path.join(RADICE, "collaudo"))

import ponte                                  # noqa: E402
from regressioni import leggi_attese          # noqa: E402

STORIA = os.path.join(RADICE, "relitto-silente", "relitto.fav")


def caratteri(turno):
    """I caratteri di testo del turno: la stanza, le descrizioni, gli elenchi."""
    return sum(len(e.get("testo") or "") for e in turno.get("eventi", []) if isinstance(e, dict))


def traccia(percorso, seme=1):
    dati = json.loads(ponte.rel_percorso(percorso))
    t = json.loads(ponte.rel_avvia(seme))
    turni = [{"comando": None, "caratteri": caratteri(t), "suono": t["suono"]}]
    for comando in dati["comandi"]:
        if t["esito"] != "in_corso":
            break
        t = json.loads(ponte.rel_comando(comando))
        turni.append({"comando": comando, "caratteri": caratteri(t), "suono": t["suono"]})
    return {"percorso": os.path.basename(percorso)[:-4], "seme": seme, "esito": t["esito"], "turni": turni}


def scrivi(dati, uscita):
    os.makedirs(os.path.dirname(os.path.abspath(uscita)), exist_ok=True)
    with open(uscita, "w", encoding="utf-8", newline="\n") as f:
        json.dump(dati, f, ensure_ascii=False)


def main():
    ap = argparse.ArgumentParser(description="La traccia sonora di un percorso di collaudo.")
    ap.add_argument("percorso", nargs="?")
    ap.add_argument("--uscita")
    ap.add_argument("--tutti", action="store_true", help="tutti i percorsi di collaudo con un'attesa")
    ap.add_argument("--cartella", default=os.path.join(RADICE, "collaudo", "tracce"))
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    esito = json.loads(ponte.rel_compila(STORIA))
    if not esito["ok"]:
        print("Compilazione fallita:", esito.get("errore"))
        return 2
    if a.tutti:
        percorsi = sorted(f for f in glob.glob(os.path.join(RADICE, "collaudo", "*.txt")) if leggi_attese(f))
    elif a.percorso:
        percorsi = [a.percorso]
    else:
        ap.error("serve un percorso, o --tutti")
    for p in percorsi:
        dati = traccia(p)
        uscita = a.uscita if (a.uscita and not a.tutti) else os.path.join(a.cartella, dati["percorso"] + ".json")
        scrivi(dati, uscita)
        print(f"{dati['percorso']}: {len(dati['turni'])} turni, {dati['esito']} → {os.path.relpath(uscita, RADICE)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
