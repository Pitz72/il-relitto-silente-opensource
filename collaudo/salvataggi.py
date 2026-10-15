# salvataggi.py — salva in ogni stanza di ogni percorso, ricarica, e controlla
# che la partita torni la stessa (app/src/motore/ponte.py: rel_salva, rel_carica).
#
# Uso (dalla radice del progetto):
#   python collaudo/salvataggi.py                 tutti i percorsi con «# atteso:»
#   python collaudo/salvataggi.py collaudo/vivi.txt
#
# Per ogni percorso, a ogni cambio di stanza e a ogni ingresso in un dialogo:
#   1. si salva, e si ricarica il testo del salvataggio in una partita nuova;
#   2. il caricamento deve dire «identica», e l'impronta, lo stato del visore,
#      gli stati del suono e i pulsanti devono essere quelli della partita salvata;
#   3. le due partite giocano i cinque comandi successivi, e restano uguali passo
#      per passo (il caso compreso: il seme viaggia nel salvataggio).
# Al primo punto di ogni percorso la partita ricaricata gioca fino in fondo, e
# deve arrivare allo stesso esito con la stessa impronta.
# In più, le prove dei rifiuti: un file che non è un salvataggio, un formato
# più recente, un salvataggio danneggiato, una storia cambiata, un'impronta che
# non torna; e un caricamento rifiutato non tocca la partita in corso.

import argparse
import glob
import json
import os
import sys
import time

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(QUI)
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))
sys.path.insert(0, QUI)

import ponte                                      # noqa: E402
from regressioni import leggi_attese              # noqa: E402

STORIA = os.path.join(RADICE, "relitto-silente", "relitto.fav")
AVANTI = 5


def _foto():
    """Ciò che deve tornare uguale: impronta, visore, suono, pulsanti."""
    m = ponte._mondo
    stati = ponte._suono_stati()
    return {"impronta": m.impronta_stato(), "stato": ponte._stato(), "suono": stati,
            "pulsanti": ponte.pulsanti(m), "esito": m.stato_partita}


def _differenze(a, b):
    return [k for k in a if a[k] != b[k]]


def _scambia(mondo, seme):
    ponte._mondo, ponte._seme, ponte._ultimi = mondo, seme, None


def prova_punto(comandi, i, fino_in_fondo):
    """Salva dopo il comando i, ricarica, confronta; poi avanti insieme."""
    problemi = []
    originale = ponte._mondo
    atteso = _foto()
    testo = ponte.rel_salva("collaudo", None)
    esito = json.loads(ponte.rel_carica(testo))
    if not esito["ok"]:
        return [f"passo {i}: caricamento rifiutato ({esito['messaggio']})"]
    if esito["esito"] != "identica":
        problemi.append(f"passo {i}: il caricamento dice «{esito['esito']}»")
    caricata = ponte._mondo
    diff = _differenze(atteso, _foto())
    if diff:
        problemi.append(f"passo {i}: dopo il caricamento cambiano {', '.join(diff)}")
    resto = comandi[i:] if fino_in_fondo else comandi[i:i + AVANTI]
    for k, cmd in enumerate(resto, i + 1):
        for mondo in (originale, caricata):
            _scambia(mondo, 1)
            if mondo.stato_partita == "in_corso":
                ponte.rel_comando(cmd)
        _scambia(originale, 1)
        a = _foto()
        _scambia(caricata, 1)
        b = _foto()
        diff = _differenze(a, b)
        if diff:
            problemi.append(f"passo {i}, poi «{cmd}» (passo {k}): divergono {', '.join(diff)}")
            break
        if originale.stato_partita != "in_corso":
            break
    _scambia(originale, 1)
    return problemi


def gioca(percorso):
    """Gioca il percorso e prova ogni punto di salvataggio. Le due partite (la
    salvata e la ricaricata) avanzano insieme per qualche comando; poi si
    riparte dall'originale, che il caricamento non ha toccato."""
    dati = json.loads(ponte.rel_percorso(percorso))
    comandi = dati["comandi"]
    ponte.rel_avvia(1)
    problemi, punti = [], 0
    stanza, dialogo, primo = ponte._mondo.posizione_giocatore, None, True
    storia = []                      # i comandi giocati, per riavviare dopo una prova
    for i, cmd in enumerate(comandi, 1):
        if ponte._mondo.stato_partita != "in_corso":
            break
        ponte.rel_comando(cmd)
        storia.append(cmd)
        m = ponte._mondo
        cambio = m.posizione_giocatore != stanza or (m.dialogo_attivo and m.dialogo_attivo != dialogo)
        stanza, dialogo = m.posizione_giocatore, m.dialogo_attivo
        if not cambio and m.stato_partita == "in_corso":
            continue
        punti += 1
        # La prova fa avanzare l'originale: la si fa su una copia identica,
        # ricostruita rigiocando, così il percorso riprende da qui intatto.
        impronta = m.impronta_stato()
        copia = ponte.rel_salva()
        problemi += prova_punto(comandi, i, fino_in_fondo=primo)
        primo = False
        esito = json.loads(ponte.rel_carica(copia))
        if not esito["ok"] or ponte._mondo.impronta_stato() != impronta:
            problemi.append(f"passo {i}: la ripresa del percorso non torna")
            break
    return problemi, punti, len(storia)


def rifiuti():
    """I caricamenti che devono essere rifiutati, o segnalati."""
    problemi, casi = [], []
    ponte.rel_avvia(1)
    for cmd in ("analizza la nave aliena", "accosta", "ovest"):
        ponte.rel_comando(cmd)
    buono = json.loads(ponte.rel_salva("collaudo", "2026-10-14T20:00:00"))
    prima = ponte._mondo.impronta_stato()

    def carica(dati, atteso_ok, atteso):
        casi.append(atteso)
        testo = dati if isinstance(dati, str) else json.dumps(dati)
        r = json.loads(ponte.rel_carica(testo))
        chiave = r.get("esito") if r["ok"] else r.get("motivo")
        if r["ok"] != atteso_ok or chiave != atteso:
            problemi.append(f"atteso {atteso}, avuto {chiave}: {r.get('messaggio')}")
        return r

    def con(**cambi):
        d = json.loads(json.dumps(buono))
        for k, v in cambi.items():
            if "." in k:
                a, b = k.split(".")
                d[a][b] = v
            else:
                d[k] = v
        return d

    for dati, motivo in (("non è json", "illeggibile"),
                         ({"formato": "altro"}, "formato"),
                         (con(versione=ponte._versione["formatoSalvataggi"] + 1), "piu_recente"),
                         (con(versione=0), "formato"),
                         (con(seme=None), "danneggiato"),
                         (con(**{"partita.comandi": None}), "motore")):
        carica(dati, False, motivo)
        if ponte._mondo.impronta_stato() != prima:
            problemi.append(f"il rifiuto «{motivo}» ha cambiato la partita in corso")
    carica(con(impronta_storia="0" * 64), True, "ricostruita")
    carica(con(**{"partita.impronta": "0" * 64}), True, "diversa")
    # gli stessi .fav con un motore di prima (un salvataggio della 0.2.0, motore
    # 1.4.4): identica se la partita torna, ricostruita se no
    vecchio = {"motore": "1.4.4", "impronta_storia": ponte.impronta_storia("1.4.4")}
    carica(con(**vecchio), True, "identica")
    carica(con(**vecchio, **{"partita.impronta": "0" * 64}), True, "ricostruita")
    carica(buono, True, "identica")
    if ponte._mondo.impronta_stato() != prima:
        problemi.append("il salvataggio buono non torna alla stessa impronta")
    for chiave in ("formato", "versione", "gioco", "identita", "creato", "motore", "impronta_storia",
                   "seme", "riassunto", "partita"):
        if chiave not in buono:
            problemi.append(f"nel salvataggio manca «{chiave}»")
    if buono["versione"] != ponte._versione["formatoSalvataggi"]:
        problemi.append("il formato del salvataggio non è quello di versione.json")
    return problemi, len(casi)


def main():
    ap = argparse.ArgumentParser(description="Salva e ricarica in ogni stanza dei percorsi.")
    ap.add_argument("percorsi", nargs="*")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    esito = json.loads(ponte.rel_compila(STORIA))
    if not esito["ok"]:
        print("Compilazione fallita:", esito.get("errore"), esito.get("rapporto", ""))
        return 2
    percorsi = a.percorsi or sorted(f for f in glob.glob(os.path.join(QUI, "*.txt")) if leggi_attese(f))
    falliti, totale = 0, 0
    for percorso in percorsi:
        t0 = time.perf_counter()
        problemi, punti, giocati = gioca(percorso)
        totale += punti
        nome = os.path.relpath(percorso, RADICE).replace(os.sep, "/")
        riga = f"{nome} ({giocati} comandi, {punti} salvataggi; {time.perf_counter() - t0:.1f} s)"
        if problemi:
            falliti += 1
            print(f"[NO] {riga}")
            for p in problemi[:8]:
                print(f"     {p}")
        else:
            print(f"[OK] {riga}")
    problemi, casi = rifiuti()
    print(f"[{'NO' if problemi else 'OK'}] i rifiuti e le segnalazioni ({casi} casi)")
    for p in problemi:
        print(f"     {p}")
    print(f"\nPercorsi: {len(percorsi)}; falliti: {falliti}. Salvataggi provati: {totale}.")
    return 1 if falliti or problemi else 0


if __name__ == "__main__":
    sys.exit(main())
