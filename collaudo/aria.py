# aria.py — gioca un percorso e misura l'aria passo per passo (RN-F1).
#
# Per la taratura a tavolino del documento 33: dopo ogni comando annota la stanza,
# la cifra dell'aria e quanto è cambiata, e alla fine dice dove si spende.
#
# Uso (dalla radice del progetto):
#   python collaudo/aria.py relitto-silente/relitto.fav collaudo/principiante-curioso.txt
#   python collaudo/aria.py relitto-silente/relitto.fav collaudo/*.txt
#   python collaudo/aria.py relitto-silente/relitto.fav PERCORSO --passi
#
# Il percorso è lo stesso dei file del collaudo (un comando per riga, «#…» ignorate).
# Nei percorsi da principiante (principiante-*.txt) chi gioca reagisce da solo alla
# protezione vitale: appena la tuta la accende usa la cella di riserva, come farebbe
# chi gioca per la prima volta. Così le partite restano vere anche se i numeri cambiano.
# La regola del registro (RN-F1): il curioso arriva alla Grande Porta con le tre
# chiavi sopra il 30%.

import argparse
import contextlib
import io
import os
import sys
from collections import defaultdict

QUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(QUI, "..", "motore"))

from compilatore import compila_mondo          # noqa: E402
from esploratore import Partita, leggi_percorso  # noqa: E402

CHIAVI = ("seme", "stele", "nucleo")


def _valore(m, nome):
    try:
        return m.valore_variabile(nome)
    except Exception:
        return m.variabili.get(nome)


def _voce(cmd, opzione):
    """La voce di spesa di un comando: il verbo, o «dialogo» per le scelte."""
    if opzione:
        return "dialogo"
    parola = cmd.split()[0].lower() if cmd.split() else ""
    return {"ascolta": "ascolta", "sintonizza": "sintonizza", "traduci": "traduci",
            "aspetta": "aspetta", "tocca": "tocca", "stacca": "stacca",
            "usa": "usa", "alimenta": "usa", "ricarica": "ricarica"}.get(parola, "altro")


CELLA = "usa la cella di riserva"
RICARICA = "ricarica la tuta"
LABORATORIO = "laboratorio di risonanza"
AVVISO_PONTE = "un conto che non le ho chiesto"
PRESA_NELLA_FUGA = "Posso strapparmi via"


def _strada(m, da, a):
    """I comandi di direzione da una stanza all'altra (le uscite di oggi), o None."""
    from collections import deque
    visti, coda = {da: []}, deque([da])
    while coda:
        qui = coda.popleft()
        if qui == a:
            return visti[qui]
        st = m.trova_stanza(qui)
        for direzione, dove in (st.uscite.items() if st else ()):
            if dove not in visti:
                visti[dove] = visti[qui] + [direzione]
                coda.append(dove)
    return None


def _a_ricaricare(m):
    """Andare al generatore, ricaricare e tornare dov'ero: i comandi, o []."""
    if _valore(m, "ricarica") != "disponibile" or _valore(m, "energia") != "ripristinata":
        return []
    qui = m.posizione_giocatore
    andata, ritorno = _strada(m, qui, LABORATORIO), _strada(m, LABORATORIO, qui)
    if andata is None or ritorno is None:
        return []
    return andata + [RICARICA] + ritorno


def _reazione(m, cmd, out, fuga, ignora_avviso=False):
    """Quello che un principiante fa da sé, senza che il percorso lo dica.
    Nella fuga: se il groviglio lo prende, si strappa via; sotto il 20, se ha
    ancora la cella, la usa. Prima: con la protezione vitale usa la cella, e se
    non l'ha più va a ricaricare; all'avviso del Ponte va a ricaricare (o usa la
    cella), poi passa (con ignora_avviso passa e basta); nel laboratorio, con
    l'aria a metà, ricarica."""
    aria = _valore(m, "aria")
    if fuga:
        if PRESA_NELLA_FUGA in out:
            return ["strappa il groviglio"]
        if aria < 20 and "cella di riserva" in m.inventario:
            return [CELLA]
        return []
    if m.dialogo_attivo:
        return []
    if AVVISO_PONTE in out:
        if ignora_avviso:
            return [cmd]
        if "cella di riserva" in m.inventario:
            return [CELLA, cmd]
        return _a_ricaricare(m) + [cmd]
    if aria < 30:
        if "cella di riserva" in m.inventario:
            return [CELLA]
        return _a_ricaricare(m)
    if (m.posizione_giocatore == LABORATORIO and aria <= 50
            and _valore(m, "ricarica") == "disponibile" and _valore(m, "energia") == "ripristinata"):
        return [RICARICA]
    return []


def misura(mondo, percorso, reattivo=False, comandi=None, ignora_avviso=False):
    """Gioca il percorso (o la lista `comandi`). Con reattivo=True chi gioca
    gestisce l'aria come un principiante (vedi _reazione): il percorso dice
    soltanto quello che vuole fare, la cella e la ricarica le usa da sé."""
    p = Partita(mondo, seme=1)
    m = p.m
    passi = []
    aria = _valore(m, "aria")
    tre_chiavi = None
    sotto30 = None
    coda = list(comandi) if comandi is not None else list(leggi_percorso(percorso))
    reazioni = 0
    while coda:
        cmd = coda.pop(0)
        if not p.in_corso:
            break
        opzione = bool(m.dialogo_attivo)
        out = p.esegui(cmd)
        nuova = _valore(m, "aria")
        fuga = _valore(m, "fuga") == "iniziata"
        chiavi = sum(1 for c in CHIAVI if c in m.inventario) + (_valore(m, "chiavi") or 0)
        passo = {
            "n": len(passi) + 1, "cmd": cmd, "stanza": m.posizione_giocatore,
            "aria": nuova, "delta": nuova - aria, "fuga": fuga,
            "voce": _voce(cmd, opzione), "chiavi": chiavi,
        }
        passi.append(passo)
        if sotto30 is None and nuova < 30 and not fuga:
            sotto30 = passo
        if tre_chiavi is None and chiavi >= 3 and m.posizione_giocatore == "corridoio principale":
            tre_chiavi = passo
        aria = nuova
        if reattivo and p.in_corso and reazioni < 40:
            r = _reazione(m, cmd, out, fuga, ignora_avviso)
            if r:
                reazioni += 1
                coda[:0] = r
    return p, passi, tre_chiavi, sotto30


def rapporto(nome, p, passi, tre_chiavi, sotto30, con_passi):
    m = p.m
    righe = [f"== {nome}"]
    if con_passi:
        for s in passi:
            segni = []
            if s["delta"]:
                segni.append(f"{s['delta']:+d}")
            if s is sotto30:
                segni.append("◀ sotto il 30")
            if s is tre_chiavi:
                segni.append("★ tre chiavi alla Grande Porta")
            if s["fuga"]:
                segni.append("fuga")
            righe.append(f"  {s['n']:3d}  {s['aria']:3d}  {s['cmd'][:44]:44s}  {s['stanza'][:24]:24s}  "
                         + " ".join(segni))
    prima = [s for s in passi if not s["fuga"]]
    minimo = min(prima, key=lambda s: s["aria"]) if prima else None
    inizio_fuga = next((s for s in passi if s["fuga"]), None)
    spese = defaultdict(int)
    for s in prima:
        if s["delta"] < 0:
            spese[s["voce"]] += -s["delta"]
    ricariche = sum(s["delta"] for s in prima if s["delta"] > 0)
    righe.append(f"  passi {len(passi)} · esito {m.stato_partita} · aria alla fine {_valore(m, 'aria')}")
    if tre_chiavi:
        righe.append(f"  tre chiavi alla Grande Porta: {tre_chiavi['aria']}% (passo {tre_chiavi['n']})")
    else:
        righe.append("  tre chiavi alla Grande Porta: mai")
    if sotto30:
        righe.append(f"  sotto il 30 la prima volta: passo {sotto30['n']}, «{sotto30['cmd']}», "
                     f"{sotto30['stanza']} ({sotto30['aria']}%)")
    else:
        righe.append("  sotto il 30 prima della fuga: mai")
    if minimo:
        righe.append(f"  minimo prima della fuga: {minimo['aria']}% (passo {minimo['n']}, {minimo['stanza']})")
    if inizio_fuga:
        righe.append(f"  la fuga comincia al passo {inizio_fuga['n']} con {inizio_fuga['aria'] - inizio_fuga['delta']}%")
    righe.append("  spese prima della fuga: " + ", ".join(
        f"{k} {v}" for k, v in sorted(spese.items(), key=lambda kv: -kv[1]))
        + f" · ricariche +{ricariche}")
    contatori = [f"{k}={_valore(m, k)}" for k in ("echi", "risonanze", "tracce", "traduzione")
                 if k in m.variabili]
    righe.append("  " + ", ".join(contatori))
    if p.eccezioni:
        righe.append(f"  [ECCEZIONI DEL MOTORE: {len(p.eccezioni)}]")
    return "\n".join(righe)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description="Misura l'aria lungo uno o più percorsi.")
    ap.add_argument("storia")
    ap.add_argument("percorsi", nargs="+")
    ap.add_argument("--passi", action="store_true", help="stampa ogni passo")
    ap.add_argument("--reattivo", action="store_true",
                    help="usa la cella appena scatta la protezione vitale (sempre, per i principiante-*.txt)")
    args = ap.parse_args()
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        mondo = compila_mondo(args.storia)
    if mondo is None:
        print("Compilazione fallita:\n" + buf.getvalue())
        return 1
    for percorso in args.percorsi:
        reattivo = args.reattivo or os.path.basename(percorso).startswith("principiante-")
        p, passi, tre, sotto = misura(mondo, percorso, reattivo)
        print(rapporto(os.path.basename(percorso), p, passi, tre, sotto, args.passi))
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
