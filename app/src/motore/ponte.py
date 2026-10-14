# ============================================================================
#  ponte.py — il ponte fra l'interfaccia e il motore FAVELLA 1.4.4
# ----------------------------------------------------------------------------
#  Gira dentro Pyodide (l'app lo scrive nel filesystem di Pyodide e lo importa)
#  e, identico, in CPython (collaudo/pulsanti.py). Ogni funzione rel_*
#  restituisce una stringa JSON.
#
#  È infrastruttura, non motore: legge le strutture del motore senza cambiarle.
#  Il .fav non si tocca: il modo «solo pulsanti» lo imposta il ponte sulla
#  partita (mondo.modo_comandi), non la storia.
#
#  Fase 1 (prova tecnica): compila, avvia, esegue un comando; per ogni turno
#  restituisce gli eventi (raccogli_uscita), i pulsanti (gioco.pulsanti) e lo
#  stato che serve agli strumenti. In più trova il pulsante che gioca un
#  comando di un percorso di collaudo, per giocare i percorsi a soli pulsanti.
# ============================================================================
import contextlib
import copy
import hashlib
import io
import json
import os
import random
import time

from compilatore import compila_mondo
from favella_utils import raccogli_uscita
from gioco import elabora_comando, intestazione, mostra_stanza, pulsanti
from libreria_azioni import LIBRERIA_AZIONI
from strutture import VERSIONE_MOTORE

_base = None      # il mondo appena compilato: ogni partita ne è una copia
_mondo = None     # la partita in corso
_storia = None    # il file d'ingresso della storia


def _ms(t0, t1=None):
    return round(((t1 if t1 is not None else time.perf_counter()) - t0) * 1000, 3)


# ----------------------------------------------------------------------------
#  Compilare, avviare
# ----------------------------------------------------------------------------
def rel_compila(percorso):
    global _base, _storia
    t0 = time.perf_counter()
    rapporto = io.StringIO()
    try:
        with contextlib.redirect_stdout(rapporto):
            mondo = compila_mondo(percorso)
    except Exception as e:                                  # noqa: BLE001
        return json.dumps({"ok": False, "errore": f"{type(e).__name__}: {e}",
                           "rapporto": rapporto.getvalue()}, ensure_ascii=False)
    if mondo is None:
        return json.dumps({"ok": False, "errore": "compilazione fallita",
                           "rapporto": rapporto.getvalue()}, ensure_ascii=False)
    _base, _storia = mondo, percorso
    return json.dumps({"ok": True, "ms": _ms(t0), "stanze": len(mondo.stanze),
                       "oggetti": len(mondo.oggetti), "motore": VERSIONE_MOTORE,
                       "impronta_storia": impronta_storia()}, ensure_ascii=False)


def rel_avvia(seme=None):
    """Una partita nuova, copia del mondo compilato. `seme` fissa il caso come
    nel collaudo (regressioni.py usa 1); senza, vale quello del motore."""
    global _mondo
    t0 = time.perf_counter()
    m = copy.deepcopy(_base)
    m.carica_azioni(LIBRERIA_AZIONI)
    m.imposta_posizione_iniziale()
    m.modo_comandi = "pulsanti"
    if seme is not None:
        m.rng = random.Random(seme)
    with raccogli_uscita(m) as uscita:
        intestazione(m)
        mostra_stanza(m)
    _mondo = m
    return _turno(uscita.eventi, t0, time.perf_counter())


def rel_comando(comando):
    t0 = time.perf_counter()
    try:
        with raccogli_uscita(_mondo) as uscita:
            elabora_comando(_mondo, comando)
    except Exception as e:                                  # noqa: BLE001
        return json.dumps({"ok": False, "errore": f"{type(e).__name__}: {e}"}, ensure_ascii=False)
    return _turno(uscita.eventi, t0, time.perf_counter())


def _turno(eventi, t0, t1):
    p = pulsanti(_mondo)
    t2 = time.perf_counter()
    stato = _stato()
    t3 = time.perf_counter()
    turno = {"ok": True, "eventi": [e.come_dizionario() for e in eventi], "pulsanti": p,
             "stato": stato, "esito": _mondo.stato_partita}
    testo = json.dumps(turno, ensure_ascii=False)
    t4 = time.perf_counter()
    # i tempi entrano dopo la serializzazione che misurano: si aggiungono in coda
    tempi = {"motore": _ms(t0, t1), "pulsanti": _ms(t1, t2), "stato": _ms(t2, t3), "json": _ms(t3, t4)}
    return testo[:-1] + ', "ms": ' + json.dumps(tempi) + "}"


# ----------------------------------------------------------------------------
#  Lo stato che serve agli strumenti
# ----------------------------------------------------------------------------
def _intero(v):
    return v if isinstance(v, int) and not isinstance(v, bool) else None


def _stato():
    m = _mondo
    v = m.variabili
    stanza = m.trova_stanza(m.posizione_giocatore)
    aria = _intero(v.get("aria"))
    tuta = m.oggetti.get("tuta")
    return {
        "stanza": m.posizione_giocatore,
        "nome_stanza": stanza.nome_visualizzato if stanza is not None else None,
        "aria": aria,
        "traduzione": _intero(v.get("traduzione")),
        "echi": _intero(v.get("echi")),
        "risonanze": _intero(v.get("risonanze")),
        "chiavi": _intero(v.get("chiavi")),
        "tracce": _intero(v.get("tracce")),
        "fuga": v.get("fuga"),
        "ingresso": v.get("ingresso"),
        "contatto": v.get("contatto"),
        "energia": v.get("energia"),
        "tuta": bool(tuta is not None and "vestita" in tuta.proprieta),
        # la stessa soglia del gioco (aria.fav): sotto 30, prima della fuga
        "protezione": aria is not None and aria < 30 and v.get("fuga") == "lontana",
        "turno": m.turno_corrente,
        "inventario": [o for o in m.oggetti if o in m.inventario],
        "visitate": sorted(getattr(m, "stanze_visitate", ()) or ()),
        "dialogo": m.dialogo_attivo,
    }


def rel_stato():
    return json.dumps(_stato(), ensure_ascii=False)


# ----------------------------------------------------------------------------
#  L'impronta della storia: i sorgenti e il motore (per i salvataggi)
# ----------------------------------------------------------------------------
def impronta_storia():
    h = hashlib.sha256(VERSIONE_MOTORE.encode())
    cartella = os.path.dirname(_storia) if _storia else "."
    for nome in sorted(os.listdir(cartella)):
        if nome.endswith(".fav"):
            with open(os.path.join(cartella, nome), "rb") as f:
                h.update(nome.encode() + b"\0" + f.read().replace(b"\r\n", b"\n"))
    return h.hexdigest()


# ----------------------------------------------------------------------------
#  Giocare un percorso di collaudo con i soli pulsanti
# ----------------------------------------------------------------------------
#  Per ogni comando del percorso si cerca il pulsante che lo gioca, in tre gradi:
#    uguale        un pulsante manda lo stesso comando (o, in un dialogo,
#                  l'opzione ha la stessa etichetta);
#    equivalente   un pulsante porta allo stesso stato (stessa impronta) e il
#                  motore risponde con le stesse parole: «segui la parete» si
#                  gioca con «segui le teche chiuse», che il motore offre;
#    stesso stato  solo lo stato coincide, la risposta no. Succede ai comandi
#                  rifiutati che un percorso usa per far passare il tempo («giù»
#                  dove non si scende): con i pulsanti si aspetta. Il collaudo
#                  li elenca a parte.
#  Ogni prova si fa su un ramo della partita, poi disfatto.
_SESSIONE = ("_storia_stati", "ultimo_comando", "verbi_scoperti", "argomenti_scoperti",
             "_snap_dialogo", "annunci", "_registro_comandi", "_pos_registro",
             "_reg_ingresso_dialogo", "_turno_libero", "_in_conferma", "_uscita_richiesta",
             "_azione_riuscita", "_ambiguita", "_usa_in_sospeso", "_regola_scattata")


def _norm(testo):
    return " ".join(testo.replace("’", "'").lower().split()).rstrip(".")


def offerti(p=None):
    """Tutti i comandi che i pulsanti offrono adesso: [(comando, gruppo, etichetta)]."""
    p = p or pulsanti(_mondo)
    out = []
    for s in p["scelte"]:
        out.append((s["comando"], "scelta", s["etichetta"]))
    for u in p["uscite"]:
        out.append((u["comando"], "uscita", u["etichetta"]))
    for v in p["verbi"]:
        verbo = v["verbo"]
        if v["da_solo"]:
            out.append((verbo, "verbo", v["etichetta"]))
        for primo in v["primi"]:
            base = f"{verbo} {primo['testo']}"
            if v["secondo"] != "obbligatorio":
                out.append((base, "verbo", f"{v['etichetta']} · {primo['testo']}"))
            if v["secondo"] == "no":
                continue
            secondi = v.get("secondi") or (v.get("secondi_per") or {}).get(primo["id"], [])
            for s in secondi:
                if s.get("id") == primo["id"]:
                    continue
                out.append((f"{base} {s['testo']}", "verbo",
                            f"{v['etichetta']} · {primo['testo']} · {s['testo']}"))
    for s in p["servizio"]:
        out.append((s["comando"], "servizio", s["etichetta"]))
    return out


def _ramo(comando):
    """Gioca `comando` su un ramo della partita e torna indietro: l'impronta
    dello stato a cui porta e il testo della risposta."""
    m = _mondo
    istantanea, caso = m.cattura_stato(), m.rng.getstate()
    sessione = {k: copy.copy(m.__dict__[k]) for k in _SESSIONE if k in m.__dict__}
    try:
        with raccogli_uscita(m) as uscita:
            elabora_comando(m, comando)
        return m.impronta_stato(), uscita.testo()
    except Exception:                                       # noqa: BLE001
        return None, None
    finally:
        m.ripristina_stato(istantanea)
        m.rng.setstate(caso)
        m.__dict__.update(sessione)


# Fra i pulsanti di servizio, quelli che giocano un turno; «aspetta» per primo:
# è il pulsante con cui si lascia passare il tempo.
_SERVIZIO_DI_GIOCO = ("aspetta", "guarda", "inventario")


def _scelta(t0, modo, voce, prove):
    cmd, gruppo, etichetta = voce
    return json.dumps({"trovato": True, "modo": modo, "comando": cmd, "gruppo": gruppo,
                       "etichetta": etichetta, "prove": prove, "ms": _ms(t0)}, ensure_ascii=False)


def rel_pulsante_per(comando):
    t0 = time.perf_counter()
    p = pulsanti(_mondo)
    voci = offerti(p)
    chiave = _norm(comando)
    for voce in voci:
        cmd, gruppo, etichetta = voce
        if _norm(cmd) == chiave or (gruppo == "scelta" and _norm(etichetta) == chiave):
            return _scelta(t0, "uguale", voce, 0)
    if p["fase"] != "gioco":
        return json.dumps({"trovato": False, "fase": p["fase"], "ms": _ms(t0)}, ensure_ascii=False)
    stato_atteso, testo_atteso = _ramo(comando)
    verbo = chiave.split(" ")[0] if chiave else ""
    stesso_verbo = [v for v in voci if v[1] != "servizio" and _norm(v[0]).split(" ")[0] == verbo]
    # le parole della cosa nominata: «leggi il registro» → «registro»
    parole = [w for w in chiave.replace("'", " ").split()[1:] if len(w) >= 4]
    stessa_cosa = [v for v in voci if v[1] != "servizio" and v not in stesso_verbo
                   and any(w in _norm(v[0]) for w in parole)]
    servizio = [v for v in voci if v[1] == "servizio" and v[0] in _SERVIZIO_DI_GIOCO]
    servizio.sort(key=lambda v: _SERVIZIO_DI_GIOCO.index(v[0]))
    altri = [v for v in voci if v[1] != "servizio" and v not in stesso_verbo and v not in stessa_cosa]
    # Prima lo stesso verbo, poi gli altri verbi sulla stessa cosa (un sinonimo:
    # «leggi» è «esamina»), poi il servizio («aspetta» per primo), poi tutto il
    # resto; se dopo il servizio c'è già un pulsante con lo stesso stato, ci si
    # ferma: il resto costerebbe centinaia di prove per niente.
    solo_stato, prove = None, 0
    for gruppo, fermati in ((stesso_verbo, False), (stessa_cosa, False), (servizio, True), (altri, False)):
        for voce in gruppo:
            prove += 1
            stato, testo = _ramo(voce[0])
            if stato is None or stato != stato_atteso:
                continue
            if testo == testo_atteso:
                return _scelta(t0, "equivalente", voce, prove)
            if solo_stato is None:
                solo_stato = voce
        if fermati and solo_stato is not None:
            break
    if solo_stato is not None:
        return _scelta(t0, "stesso stato", solo_stato, prove)
    return json.dumps({"trovato": False, "fase": p["fase"], "prove": prove, "ms": _ms(t0)},
                      ensure_ascii=False)


def rel_percorso(percorso):
    """I comandi di un percorso di collaudo, e le sue attese («# atteso: …»)."""
    comandi, attese = [], []
    with open(percorso, encoding="utf-8") as f:
        for riga in f:
            r = riga.strip()
            if r.startswith("#"):
                if r[1:].strip().startswith("atteso:"):
                    attese.append(r[1:].strip()[len("atteso:"):].strip())
            elif r:
                comandi.append(r)
    return json.dumps({"comandi": comandi, "attese": attese}, ensure_ascii=False)
