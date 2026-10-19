# scritti.py — i comandi scritti e quelli dei pulsanti fanno la stessa partita, lo stesso diario e lo stesso suono
# (progettazione/18-modalita-solo-testo.md, §5.7 e §5.8).
#
# Uso (dalla radice del progetto):
#   python collaudo/scritti.py
#   python collaudo/scritti.py -v        in più, i comandi riscritti
#
# La modalità a solo testo manda al motore ciò che chi gioca scrive: «x placca», «prendila», «esamina placca»
# invece di «esamina la placca». Il diario (le tracce di L.V., le letture, i reperti, le iniziali sulla placca)
# e il suono (quale attrezzo, quale evento) devono capire una frase scritta come quella del pulsante.
#
# Che cosa controlla, per ogni percorso di collaudo:
#   1. il percorso è giocato a pulsanti (i suoi comandi, com'è scritto) e poi riscritto a mano in tre forme:
#      senza articoli («prendi chiave»), con l'abbreviazione («x» per «esamina») e con il pronome attaccato
#      («prendila» quando il comando riprende la cosa del comando prima);
#   2. dove una riscrittura non è un'altra lettura dello stesso comando (il motore la leggerebbe in un altro modo:
#      un nome ambiguo, un verbo che non ha l'abbreviazione) quel comando resta com'è, e lo si conta;
#   3. a ogni passo il turno riscritto ha gli stessi eventi di suono, lo stesso stato, la stessa voce del diario
#      (tracce, voce, lettura, reperti, iniziali) e alla fine la stessa impronta della partita;
#   4. la cronaca ricostruita dopo un salvataggio e un caricamento è uguale a quella giocata.

import argparse
import json
import os
import re
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(QUI)
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))
sys.path.insert(0, QUI)

import ponte                                      # noqa: E402

STORIA = os.path.join(RADICE, "relitto-silente", "relitto.fav")

PERCORSI = ("vivi", "prima-nota", "stiva-piena", "doppio-fondo", "mani-vuote", "due-lettere", "tutto", "limite-I3",
            "riprendi-risuonatore", "stiva-al-limite", "groviglio-ostinato", "vivaio-ritorno")
ARTICOLI = re.compile(r"\b(?:il|lo|la|i|gli|le|un|uno|una)\s+|\bl['’]", re.I)
# i campi della voce del diario che contano (non il testo del comando, che è come lo si è scritto)
CAMPI = ("tracce", "voce", "lettura", "reperti", "iniziali", "atto", "stanza", "turno")


def comandi_di(nome):
    return json.loads(ponte.rel_percorso(os.path.join(QUI, nome + ".txt")))["comandi"]


def gioca(comandi):
    """Gioca una sequenza; per ogni passo: (suono, voce del diario, cose risolte, impronta della partita)."""
    ponte.rel_avvia(1)
    passi = []
    for c in comandi:
        if ponte._mondo.stato_partita != "in_corso":
            break
        t = json.loads(ponte.rel_comando(c))
        if not t.get("ok", True):
            passi.append(("errore", t.get("errore"), None, None))
            break
        voce = (t.get("cronaca") or {}).get("nuova")
        passi.append((t["suono"]["eventi"], {k: voce[k] for k in CAMPI} if voce else None,
                      (t["comando"] or {}).get("cosa"), ponte._mondo.impronta_stato()))
    return passi, [dict(v) for v in ponte._cronaca]


def riscritture(comandi, cose):
    """Le forme scritte di ogni comando: [(senza articoli, x, pronome)] (None dove non si applicano)."""
    forme = []
    prima = None
    for c, cosa in zip(comandi, cose):
        parole = c.split()
        senza = ARTICOLI.sub("", c).strip() if len(parole) > 1 else None
        x = ("x " + c.split(" ", 1)[1]) if parole[0] in ("esamina", "guarda", "osserva") and len(parole) > 1 else None
        pron = None
        # il pronome solo se il comando è «verbo cosa» e riprende la cosa del comando prima
        if len(parole) == 3 and cosa and cosa == prima and parole[0] not in ("usa", "analizza", "traduci", "sintonizza", "incidi"):
            pron = parole[0] + ("la" if parole[1] in ("la", "l’", "l'", "le") else "lo")
        forme.append((senza, x, pron))
        prima = cosa
    return forme


def prova(nome, verboso):
    problemi = []
    comandi = comandi_di(nome)
    base, _ = gioca(comandi)
    cose = [p[2] for p in base]
    comandi = comandi[: len(base)]
    forme = riscritture(comandi, cose)
    # ogni comando si riscrive nella sua forma più scritta (pronome, poi «x», poi senza articoli); dove la partita
    # arriva in un altro punto la riscrittura era un'altra lettura del comando: si toglie e si riprova
    scelte = [next((f for f in reversed(fs) if f is not None), None) for fs in forme]
    scelte = [f if f != c else None for f, c in zip(scelte, comandi)]
    lasciati = 0
    for _ in range(80):
        tutte = [s or c for s, c in zip(scelte, comandi)]
        scritto, cronaca_s = gioca(tutte)
        divergente = next((n for n, (a, b) in enumerate(zip(base, scritto)) if a[3] != b[3]), None)
        if divergente is None and len(scritto) == len(base):
            break
        if divergente is None:
            divergente = len(scritto) - 1
        # la riscrittura colpevole: l'ultima fra i comandi fino a quello che diverge
        colpevoli = [n for n in range(min(divergente, len(comandi) - 1), -1, -1) if scelte[n]]
        if not colpevoli:
            problemi.append(f"{nome}: la partita diverge al passo {divergente + 1} senza nessuna riscrittura")
            break
        k = colpevoli[0]
        # se la forma più scritta non va, si prova una meno scritta (senza articoli)
        alternative = [f for f in forme[k] if f is not None and f != comandi[k] and f != scelte[k]]
        scelte[k] = alternative[0] if alternative and scelte[k] != forme[k][0] and forme[k][0] is not None and forme[k][0] != scelte[k] else None
        lasciati += 1
    else:
        problemi.append(f"{nome}: non si trova una riscrittura che dia la stessa partita")
    tutte = [s or c for s, c in zip(scelte, comandi)]
    scritto, cronaca_s = gioca(tutte)
    cambiati = sum(1 for a, b in zip(comandi, tutte) if a != b)
    if verboso:
        for a, b in zip(comandi, tutte):
            if a != b:
                print(f"    {a}  →  {b}")
    if len(scritto) != len(base):
        problemi.append(f"{nome}: {len(scritto)} passi scritti, {len(base)} a pulsanti")
    # un comando scritto a mano risolve la stessa cosa del suo pulsante: lo fa la spia del ponte, che guarda che
    # cosa il motore ha risolto davvero (revisione 25, L13). Se la spia diventa cieca, «indossala» e «usa taglierina
    # sulla giuntura» restano senza cosa. Fa eccezione «parla con»: il motore registra chi si ascolta altrove, e per
    # il suono e il diario basta il verbo
    for n, (a, b, c, o) in enumerate(zip(base, scritto, tutte, comandi), 1):
        if c != o and a[2] != b[2] and not o.startswith("parla "):
            problemi.append(f"{nome}, passo {n} ({c}, a pulsanti: {o}): la cosa risolta è diversa: {a[2]} / {b[2]}"
                            " (la spia di _elabora_analizzando)")
            break
    for n, (a, b) in enumerate(zip(base, scritto), 1):
        if a[3] != b[3]:
            problemi.append(f"{nome}, passo {n} ({tutte[n - 1]}): la partita scritta arriva a un punto diverso")
            break
        if a[0] != b[0]:
            problemi.append(f"{nome}, passo {n} ({tutte[n - 1]}, a pulsanti: {comandi[n - 1]}): il suono è diverso: {a[0]} / {b[0]}")
            break
        if a[1] != b[1]:
            diverse = sorted(k for k in (a[1] or {}) if (a[1] or {}).get(k) != (b[1] or {}).get(k))
            problemi.append(f"{nome}, passo {n} ({tutte[n - 1]}, a pulsanti: {comandi[n - 1]}): la voce del diario è diversa in {', '.join(diverse)}")
            break
    # il diario ricostruito dopo un caricamento è lo stesso di quello giocato
    r = json.loads(ponte.rel_carica(ponte.rel_salva("collaudo", "2026-10-16T12:00:00")))
    if not r["ok"] or r["esito"] != "identica":
        problemi.append(f"{nome}: il caricamento della partita scritta non è identico ({r.get('esito') or r.get('motivo')})")
    else:
        giocata = [{k: v[k] for k in CAMPI} for v in cronaca_s]
        ricostruita = [{k: v[k] for k in CAMPI} for v in r["diario"]["cronaca"]]
        if giocata != ricostruita:
            problemi.append(f"{nome}: la cronaca ricostruita non è uguale a quella giocata")
    return problemi, len(comandi), cambiati, lasciati


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-v", action="store_true")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    ponte.rel_compila(STORIA)
    tutti = []
    for nome in PERCORSI:
        problemi, n, cambiati, tenuti = prova(nome, a.v)
        print(f"{nome:<22} {n:>4} comandi, {cambiati:>3} scritti a mano, {tenuti:>3} riscritture tolte  {'ok' if not problemi else 'PROBLEMI'}")
        tutti += problemi
    for p in tutti:
        print("  ✗", p)
    print("Tutto uguale." if not tutti else f"{len(tutti)} problemi.")
    return 1 if tutti else 0


if __name__ == "__main__":
    sys.exit(main())
