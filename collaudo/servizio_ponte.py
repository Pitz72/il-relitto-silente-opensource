# servizio_ponte.py — il ponte dell'app (app/src/motore/ponte.py) in CPython,
# a richiesta, su una riga di JSON per volta. Lo usa collaudo/menu.mjs: il
# modello d'azione dell'app è in TypeScript e gira in Node, il motore resta
# quello vero, in Python, come nei collaudi.
#
# Richiesta:  {"id": 1, "f": "rel_comando", "a": ["accosta"]}
# Risposta:   {"id": 1, "r": <il JSON che restituisce il ponte>}
#             {"id": 1, "errore": "…"}
# Oltre alle funzioni rel_* del ponte c'è «controlla»: le attese di un
# percorso (# atteso: …) sulla partita giocata fin qui, con le regole di
# regressioni.py.

import json
import os
import sys
import traceback
from types import SimpleNamespace

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(QUI)
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))
sys.path.insert(0, QUI)

import ponte                     # noqa: E402
from regressioni import controlla  # noqa: E402

_risposte, _comandi = [], []


def _testo(turno):
    return "".join(("\n" if e.get("stacco") else "") + e["testo"] + "\n" for e in turno["eventi"])


def avvia(seme=None):
    r = ponte.rel_avvia(seme)
    _risposte[:] = [_testo(json.loads(r))]
    _comandi.clear()
    return r


def comando(cmd):
    r = ponte.rel_comando(cmd)
    t = json.loads(r)
    if t.get("ok"):
        _comandi.append(cmd)
        _risposte.append(_testo(t))
    return r


def controlla_attese(attese):
    p = SimpleNamespace(m=ponte._mondo, risposte=_risposte, comandi=_comandi)
    return json.dumps([[a, motivo] for a in attese if (motivo := controlla(a, p))], ensure_ascii=False)


FUNZIONI = {
    "rel_compila": ponte.rel_compila,
    "rel_avvia": avvia,
    "rel_comando": comando,
    "rel_pulsante_per": ponte.rel_pulsante_per,
    "rel_percorso": ponte.rel_percorso,
    "rel_stato": ponte.rel_stato,
    "rel_salva": ponte.rel_salva,
    "rel_carica": ponte.rel_carica,
    "rel_indice": ponte.rel_indice,
    "rel_impronta": ponte.rel_impronta,
    "controlla": controlla_attese,
}


def main():
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    for riga in sys.stdin:
        if not riga.strip():
            continue
        richiesta = json.loads(riga)
        try:
            risultato = FUNZIONI[richiesta["f"]](*richiesta.get("a", []))
            risposta = {"id": richiesta["id"], "r": json.loads(risultato)}
        except Exception:                                   # noqa: BLE001
            risposta = {"id": richiesta.get("id"), "errore": traceback.format_exc()}
        sys.stdout.write(json.dumps(risposta, ensure_ascii=False) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
