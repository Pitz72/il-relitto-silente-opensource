# regressioni.py — gioca i percorsi di collaudo e controlla quello che dichiarano.
#
# Uso (dalla radice del progetto):
#   python collaudo/regressioni.py                  tutti i percorsi con «# atteso:»
#   python collaudo/regressioni.py collaudo/vivi.txt
#   python collaudo/regressioni.py --riprese        in più, la prova di ripresa
#   python collaudo/regressioni.py --storia altra/storia.fav   un'altra versione
#
# Un percorso dichiara le sue attese in righe di commento:
#   # atteso: esito vinta              (vinta, persa, in_corso)
#   # atteso: stanza sala delle teche  (dove finisce il giocatore)
#   # atteso: aria >= 20               (un contatore o uno stato: = != < <= > >=)
#   # atteso: finale «Rotta ripresa»   (l'ultima risposta contiene il testo)
#   # atteso: compare «perdi»          (almeno una risposta contiene il testo)
#   # atteso: mai «Non puoi prender»   (nessuna risposta contiene il testo)
#
# La prova di ripresa (--riprese), a ogni cambio di stanza lungo il percorso,
# prova a lasciare e riprendere ogni oggetto che il giocatore porta, su una
# copia della partita: segnala quelli che si posano e poi non si riprendono.
# È la prova che il collaudo dei finali e l'esploratore non fanno.

import argparse
import contextlib
import glob
import io
import operator
import os
import re
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(QUI)
sys.path.insert(0, os.path.join(RADICE, "motore"))

from compilatore import compila_mondo          # noqa: E402
from esploratore import Partita, leggi_percorso  # noqa: E402

STORIA = os.path.join(RADICE, "relitto-silente", "relitto.fav")
OPERATORI = {"=": operator.eq, "==": operator.eq, "!=": operator.ne, "<": operator.lt,
             "<=": operator.le, ">": operator.gt, ">=": operator.ge}


def leggi_attese(percorso):
    attese = []
    with io.open(percorso, encoding="utf-8") as f:
        for riga in f:
            m = re.match(r"\s*#\s*atteso:\s*(.+?)\s*$", riga)
            if m:
                attese.append(m.group(1))
    return attese


def controlla(attesa, p):
    """Restituisce None se l'attesa è rispettata, altrimenti il motivo."""
    m = re.match(r"esito\s+(\w+)$", attesa)
    if m:
        return None if p.m.stato_partita == m.group(1) else f"esito {p.m.stato_partita}"
    m = re.match(r"stanza\s+(.+)$", attesa)
    if m:
        return None if p.m.posizione_giocatore == m.group(1) else f"stanza {p.m.posizione_giocatore}"
    m = re.match(r"finale\s+«(.+)»$", attesa)
    if m:
        return None if m.group(1) in p.risposte[-1] else "l'ultima risposta non lo contiene"
    m = re.match(r"compare\s+«(.+)»$", attesa)
    if m:
        return None if any(m.group(1) in out for out in p.risposte[1:]) else "non compare mai"
    m = re.match(r"mai\s+«(.+)»$", attesa)
    if m:
        for cmd, out in zip(p.comandi, p.risposte[1:]):
            if m.group(1) in out:
                return f"compare dopo «{cmd}»"
        return None
    m = re.match(r"([\w' ]+?)\s*(==|!=|<=|>=|=|<|>)\s*(\S+)$", attesa)
    if m:
        nome, op, valore = m.group(1).strip(), m.group(2), m.group(3)
        if nome not in p.m.variabili:
            return f"«{nome}» non esiste"
        attuale = p.m.variabili[nome]
        atteso = int(valore) if re.fullmatch(r"-?\d+", valore) else valore
        try:
            ok = OPERATORI[op](attuale, atteso)
        except TypeError:
            ok = False
        return None if ok else f"{nome} = {attuale}"
    return "attesa non riconosciuta"


def prova_riprese(mondo, comandi):
    """Lascia e riprende ogni oggetto portato, a ogni cambio di stanza."""
    difetti = {}
    p = Partita(mondo, seme=1)
    stanza = p.m.posizione_giocatore
    for i, cmd in enumerate(comandi):
        if not p.in_corso:
            break
        p.esegui(cmd)
        if p.m.posizione_giocatore == stanza or p.m.dialogo_attivo or not p.in_corso:
            continue
        stanza = p.m.posizione_giocatore
        for oggetto in list(p.m.inventario):
            # Un ramo della partita, poi indietro: l'istantanea è quella di
            # ANNULLA (solo lo stato che cambia), più il generatore casuale.
            istantanea, caso = p.m.cattura_stato(), p.m.rng.getstate()
            nome = p.m.oggetti[oggetto].nome
            p.esegui(f"lascia {nome}")
            # (se nello stesso turno qualcosa ti sposta, l'oggetto resta dov'era: non conta)
            if oggetto not in p.m.inventario and p.in_corso and p.m.posizione_giocatore == stanza:
                risposta = p.esegui(f"prendi {nome}")
                if oggetto not in p.m.inventario:
                    difetti.setdefault(oggetto, (stanza, i + 1, risposta.strip().splitlines()[0]))
            p.m.ripristina_stato(istantanea)
            p.m.rng.setstate(caso)
    return difetti


def main():
    ap = argparse.ArgumentParser(description="Collaudo di regressione dei percorsi.")
    ap.add_argument("percorsi", nargs="*")
    ap.add_argument("--riprese", action="store_true", help="prova a lasciare e riprendere gli oggetti")
    ap.add_argument("--storia", default=STORIA, help="la storia da collaudare (predefinita: il gioco)")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")

    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        mondo = compila_mondo(a.storia)
    if mondo is None:
        print("Compilazione fallita:\n" + buf.getvalue())
        return 2

    percorsi = a.percorsi or sorted(f for f in glob.glob(os.path.join(QUI, "*.txt"))
                                    if leggi_attese(f))
    falliti = 0
    for percorso in percorsi:
        attese = leggi_attese(percorso)
        comandi = leggi_percorso(percorso)
        p = Partita(mondo, seme=1)
        for cmd in comandi:
            if not p.in_corso:
                break
            p.esegui(cmd)
        giocati = len(p.comandi)
        problemi = [(at, motivo) for at in attese if (motivo := controlla(at, p))]
        if p.eccezioni:
            problemi.append(("nessuna eccezione del motore", f"{len(p.eccezioni)} eccezioni"))
        if a.riprese:
            for oggetto, (stanza, passo, risposta) in prova_riprese(mondo, comandi).items():
                problemi.append((f"ripresa di «{oggetto}»", f"in {stanza}, passo {passo}: {risposta}"))
        nome = os.path.relpath(percorso, RADICE).replace(os.sep, "/")
        aria = p.m.variabili.get("aria")
        if problemi:
            falliti += 1
            print(f"[NO] {nome} ({giocati} comandi, aria {aria})")
            for attesa, motivo in problemi:
                print(f"     {attesa}: {motivo}")
        else:
            print(f"[OK] {nome} ({giocati} comandi, aria {aria}, {len(attese)} attese)")
    print(f"\nPercorsi: {len(percorsi)}; falliti: {falliti}.")
    return 1 if falliti else 0


if __name__ == "__main__":
    sys.exit(main())
