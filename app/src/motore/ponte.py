# ============================================================================
#  ponte.py — il ponte fra l'interfaccia e il motore FAVELLA 1.5.0
# ----------------------------------------------------------------------------
#  Gira dentro Pyodide (l'app lo scrive nel filesystem di Pyodide e lo importa)
#  e, identico, in CPython (i collaudi). Ogni funzione rel_* restituisce una
#  stringa JSON.
#
#  È infrastruttura, non motore: legge le strutture del motore senza cambiarle.
#  Il .fav non si tocca: il modo «solo pulsanti» lo imposta il ponte sulla
#  partita (mondo.modo_comandi), non la storia.
#
#  Per ogni turno il ponte restituisce:
#    eventi    il flusso del motore (raccogli_uscita): stanza, testo, elenco…
#    pulsanti  ciò che il motore offre (gioco.pulsanti), grezzo
#    cose      per ogni cosa in vista: le regole che l'autore ha scritto per
#              lei e i loro effetti, le radici delle sue proprietà, se si
#              prende. Sono i fatti
#              su cui il modello d'azione dell'app (src/azione) filtra i verbi
#    stato     ciò che serve al visore: aria, matrice, voci, chiavi, tracce,
#              atto, stanze viste con le uscite note, inventario
#    suono     gli stati che servono al suono e gli eventi del turno, trovati
#              per differenza fra prima e dopo (bibbia sonora, §1.6 e §2.4)
#    comando   il comando del turno, scomposto in verbo e cose
#    cronaca   il diario: la voce nuova del turno, e quante ce ne sono
#  In più: i salvataggi a riprese (rel_salva, rel_carica), il diario intero
#  (rel_diario) e la ricerca del pulsante che gioca un comando di un percorso
#  di collaudo.
# ============================================================================
import contextlib
import copy
import hashlib
import io
import json
import os
import time

from compilatore import compila_mondo
from favella_utils import radice_proprieta, raccogli_uscita
from gioco import (carica_da_dati, dati_salvataggio, elabora_comando, mostra_situazione,
                   nuova_partita, prova, pulsanti, risolvi_in_silenzio)
from libreria_azioni import LIBRERIA_AZIONI
from strutture import SEME_CASUALE_DEFAULT, VERSIONE_MOTORE, ConseguenzaProprieta, Mondo

_base = None      # il mondo appena compilato: ogni partita ne è una copia
_mondo = None     # la partita in corso
_storia = None    # il file d'ingresso della storia
_seme = None      # il seme del caso della partita in corso (entra nei salvataggi)
_indice = None    # le regole dell'autore, per cosa e per verbo (vedi _indicizza)
_versione = {}    # versione.json: la versione del gioco e il formato dei salvataggi
_ultimi = None    # i pulsanti dell'ultimo turno: servono a scomporre il comando dopo
_cronaca = []     # il diario: una voce per comando della sequenza effettiva (vedi _voce_di_cronaca)
_apertura = []    # il diario: gli eventi del prologo e della prima stanza
_chiave = 0       # il numero dell'ultima voce di cronaca, unico nella sessione

FORMATO = "il-relitto-silente/salvataggio"


def _ms(t0, t1=None):
    return round(((t1 if t1 is not None else time.perf_counter()) - t0) * 1000, 3)


def _json(dati):
    return json.dumps(dati, ensure_ascii=False)


# ----------------------------------------------------------------------------
#  Compilare, avviare
# ----------------------------------------------------------------------------
def rel_compila(percorso):
    global _base, _storia, _indice, _versione
    t0 = time.perf_counter()
    rapporto = io.StringIO()
    try:
        with contextlib.redirect_stdout(rapporto):
            mondo = compila_mondo(percorso)
    except Exception as e:                                  # noqa: BLE001
        return _json({"ok": False, "errore": f"{type(e).__name__}: {e}",
                      "rapporto": rapporto.getvalue()})
    if mondo is None:
        return _json({"ok": False, "errore": "compilazione fallita", "rapporto": rapporto.getvalue()})
    # il modo «solo pulsanti» è della partita, non della storia: si mette sul
    # mondo compilato, e ogni partita, che ne è una copia, lo eredita
    mondo.modo_comandi = "pulsanti"
    _base, _storia = mondo, percorso
    _versione = _leggi_versione(percorso)
    copia = copy.deepcopy(mondo)
    copia.carica_azioni(LIBRERIA_AZIONI)
    _indice = _indicizza(copia)
    return _json({"ok": True, "ms": _ms(t0), "stanze": len(mondo.stanze),
                  "oggetti": len(mondo.oggetti), "motore": VERSIONE_MOTORE,
                  "impronta_storia": impronta_storia(), "versione": _versione,
                  # tutte le parole dei verbi: la grammatica tipografica riconosce
                  # i suggerimenti anche nei turni passati (il diario)
                  "verbi": sorted(copia.azioni_del_verbo)})


def _leggi_versione(percorso):
    """versione.json sta nella radice del progetto, accanto alla cartella della
    storia (anche dentro Pyodide: l'app ce lo scrive). È l'unica fonte del numero
    del gioco e del formato dei salvataggi (sviluppo/VERSIONI.md)."""
    file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(percorso))), "versione.json")
    try:
        with open(file, encoding="utf-8") as f:
            dati = json.load(f)
    except (OSError, ValueError):
        dati = {}
    return {"gioco": dati.get("gioco"), "formatoSalvataggi": int(dati.get("formatoSalvataggi", 1))}


def _nuova_partita(seme):
    """Una partita nuova, copia del mondo compilato, con l'apertura già detta:
    restituisce il mondo e gli eventi dell'intestazione (con il prologo) e
    della prima stanza, separati. È nuova_partita del motore (dalla 1.5.0), che
    mette il seme prima dell'apertura e fissa il punto di partenza dei
    salvataggi dopo (L18): fino alla 0.2.0 il ponte lo faceva a mano."""
    return nuova_partita(_base, seme)


def rel_avvia(seme=None):
    """Una partita nuova. `seme` fissa il caso come nel collaudo (regressioni.py
    usa 1); senza, vale quello del motore. L'intestazione e il prologo escono a
    parte, in «apertura»: nell'app il prologo è nell'intro, e sulla plancia non
    si ristampa."""
    global _mondo, _seme, _ultimi, _cronaca, _apertura
    t0 = time.perf_counter()
    _seme = SEME_CASUALE_DEFAULT if seme is None else int(seme)
    _mondo, apertura, eventi = _nuova_partita(_seme)
    _ultimi = None
    _apertura = [e.come_dizionario() for e in apertura + eventi]
    _cronaca = []
    return _turno(eventi, t0, time.perf_counter(), prima=None, comando=None,
                  extra={"apertura": [e.come_dizionario() for e in apertura],
                         "cronaca": {"lunghezza": 0, "nuova": None}})


def rel_comando(comando):
    global _ultimi
    t0 = time.perf_counter()
    prima = _suono_stati()
    prima_diario = _diario_stati(_mondo)
    analisi = _analizza(comando)
    try:
        with raccogli_uscita(_mondo) as uscita:
            elabora_comando(_mondo, comando)
    except Exception as e:                                  # noqa: BLE001
        return _json({"ok": False, "errore": f"{type(e).__name__}: {e}"})
    t1 = time.perf_counter()
    nuova = _aggiorna_cronaca(_mondo, comando, analisi, prima_diario, uscita.eventi)
    return _turno(uscita.eventi, t0, t1, prima=prima, comando=analisi,
                  extra={"cronaca": {"lunghezza": len(_cronaca), "nuova": nuova}})


def _turno(eventi, t0, t1, prima, comando, extra=None):
    global _ultimi
    p = pulsanti(_mondo)
    _ultimi = p
    t2 = time.perf_counter()
    stato = _stato()
    dopo = _suono_stati()
    lista = [e.come_dizionario() for e in eventi]
    suono = {"stati": dopo, "eventi": _rileva(prima, dopo, comando, lista)}
    t3 = time.perf_counter()
    turno = {"ok": True}
    if extra:
        turno.update(extra)
    turno.update({"eventi": lista, "pulsanti": p, "cose": _cose(p), "stato": stato,
                  "suono": suono, "comando": comando, "esito": _mondo.stato_partita})
    testo = _json(turno)
    t4 = time.perf_counter()
    # i tempi entrano dopo la serializzazione che misurano: si aggiungono in coda
    tempi = {"motore": _ms(t0, t1), "pulsanti": _ms(t1, t2), "stato": _ms(t2, t3), "json": _ms(t3, t4)}
    return testo[:-1] + ', "ms": ' + json.dumps(tempi) + "}"


# ----------------------------------------------------------------------------
#  Le regole dell'autore, per cosa (i fatti del modello d'azione)
# ----------------------------------------------------------------------------
#  Il motore, a soli pulsanti, offre ogni verbo d'autore su ogni cosa («firma la
#  nave aliena»). Il modello dell'app mostra un verbo su una cosa solo se ha un
#  motivo (06-app-desktop.md, §6.1): fra i motivi, che l'autore abbia scritto una
#  regola per quel verbo e quella cosa. Qui si raccolgono le regole, con il verbo
#  con cui il pulsante le gioca («leggi» è «esamina»), senza guardare le
#  condizioni: una regola scritta è un motivo anche quando oggi direbbe di no.
def _verbo_del_pulsante(m, parola):
    azioni = m.azioni_del_verbo.get(parola, ())
    di_libreria = [a for a in azioni if a not in Mondo.AZIONI_PERSONALIZZATE]
    if di_libreria and m.azioni.get(di_libreria[0]) is not None and m.azioni[di_libreria[0]].nomi:
        verbo = m.azioni[di_libreria[0]].nomi[0]
        # l'autore può aver preso per sé la parola della libreria («tocca»)
        if m.azione_del_verbo(verbo, con_oggetto=True) in Mondo.AZIONI_PERSONALIZZATE:
            return parola
        return verbo
    return parola


def _indicizza(m):
    """Le regole dell'autore per cosa: i verbi con una regola sulla cosa sola,
    quelli con una regola a due cose, quelli senza cosa. In più gli effetti: le
    proprietà (per radice) che un verbo dà alla sua cosa in qualche ramo delle
    sue regole («alza il faro» → pieno, «indossa la tuta» → vestita). Un verbo che
    non cambierebbe più niente il modello lo nasconde."""
    per_cosa, in_coppia, senza_cosa, effetti = {}, {}, set(), {}
    for r in m.regole:
        if r.verbo == "vai":
            continue
        verbo = _verbo_del_pulsante(m, r.verbo)
        if r.globale:
            senza_cosa.add(verbo)
        elif r.categoria is None:
            cosa = r.id_oggetto_bersaglio
            if r.id_oggetto_secondario is not None or r.categoria_secondaria is not None:
                in_coppia.setdefault(cosa, set()).add(verbo)
                continue
            per_cosa.setdefault(cosa, set()).add(verbo)
            rami = list(r.conseguenze) + (list(r.altrimenti[1]) if r.altrimenti else [])
            for c in rami:
                if isinstance(c, ConseguenzaProprieta) and c.id_oggetto == cosa and c.proprieta != "prendibile":
                    effetti.setdefault(cosa, {}).setdefault(verbo, set()).add(radice_proprieta(c.proprieta))
    return {"per_cosa": per_cosa, "in_coppia": in_coppia, "senza_cosa": senza_cosa, "effetti": effetti}


def rel_indice():
    i = _indice or {"per_cosa": {}, "in_coppia": {}, "senza_cosa": set(), "effetti": {}}
    return _json({"per_cosa": {k: sorted(v) for k, v in sorted(i["per_cosa"].items())},
                  "in_coppia": {k: sorted(v) for k, v in sorted(i["in_coppia"].items())},
                  "senza_cosa": sorted(i["senza_cosa"]),
                  "effetti": {k: {v: sorted(r) for v, r in sorted(e.items())} for k, e in sorted(i["effetti"].items())}})


def _cose(p):
    """Le cose in vista (quelle dei pulsanti), con i fatti per il modello."""
    m, i = _mondo, _indice
    out = []
    for voce in p.get("oggetti", ()):
        o = m.oggetti.get(voce["id"])
        if o is None:
            continue
        nomi = sorted(a for a, c in m.alias.items() if c == o.nome)
        out.append({
            "id": o.nome,
            "etichetta": voce["etichetta"],
            "con_te": voce["con_te"],
            "nome": o.nome_visualizzato,
            "nomi": nomi,
            "prendibile": bool(o.prendibile),
            "personaggio": bool(o.is_personaggio),
            "radici": sorted({radice_proprieta(x) for x in o.proprieta}),
            "regole": sorted(i["per_cosa"].get(o.nome, ())),
            "regole_in_coppia": sorted(i["in_coppia"].get(o.nome, ())),
            "effetti": {v: sorted(r) for v, r in sorted(i["effetti"].get(o.nome, {}).items())},
        })
    return out


# ----------------------------------------------------------------------------
#  Lo stato che serve al visore
# ----------------------------------------------------------------------------
#  Gli atti (01-mappa-espansione.md, §3): l'atto è il più alto fra quelli delle
#  stanze viste, e nella fuga è il quinto. Si ricava dalle stanze visitate, che
#  stanno nell'impronta: così torna uguale dopo un caricamento.
ATTI = {1: "Il margine", 2: "Il brusio", 3: "Le voci", 4: "La mappa", 5: "La fuga"}
_ATTO_DI = {
    "plancia": 1, "cuccetta": 1, "sala macchine": 1, "stiva": 1,
    "scafo": 2, "camera di compensazione": 2, "vestibolo delle gole": 2, "gola di mezzo": 2,
    "corridoio principale": 3, "santuario del silenzio": 3, "scriptorium": 3,
    "arca della memoria": 3, "serra morente": 3, "arca biologica": 3, "sala delle teche": 3,
    "vivaio": 3, "laboratorio di risonanza": 3, "alloggio dell'equipaggio": 3, "nido": 3,
    "ponte di comando": 4, "anticamera": 4, "santuario centrale": 4,
    "gola del ritorno": 5,
}


def _intero(v):
    return v if isinstance(v, int) and not isinstance(v, bool) else None


def _portati(m):
    return set(m.oggetti_portati()) | set(m.inventario)


def _atto(m):
    if m.variabili.get("fuga") == "iniziata":
        return 5
    viste = set(getattr(m, "stanze_visitate", ()) or ()) | {m.posizione_giocatore}
    return max([_ATTO_DI.get(s, 1) for s in viste] or [1])


def _mappa(m):
    """Le stanze viste, con le uscite note: una direzione porta a una stanza
    che si nomina solo se è già stata vista (come nel testo del gioco)."""
    viste = set(getattr(m, "stanze_visitate", ()) or ()) | {m.posizione_giocatore}
    mappa = {}
    for id_s in sorted(viste):
        s = m.trova_stanza(id_s)
        if s is None:
            continue
        mappa[id_s] = {"nome": s.nome_visualizzato, "atto": _ATTO_DI.get(id_s),
                       "uscite": {d: (dest if dest in viste else None)
                                  for d, dest in sorted(s.uscite.items())}}
    return mappa


def _stato():
    m = _mondo
    v = m.variabili
    stanza = m.trova_stanza(m.posizione_giocatore)
    aria = _intero(v.get("aria"))
    tuta = m.oggetti.get("tuta")
    portati = _portati(m)
    atto = _atto(m)
    visitate = set(getattr(m, "stanze_visitate", ()) or ())
    return {
        "stanza": m.posizione_giocatore,
        "nome_stanza": stanza.nome_visualizzato if stanza is not None else None,
        "atto": atto,
        "titolo_atto": ATTI[atto],
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
        # i contatori compaiono quando la loro meccanica entra nel gioco (06, §4.3)
        "mostra": {
            "aria": bool(tuta is not None and "vestita" in tuta.proprieta) or v.get("fuga") == "iniziata",
            "matrice": (_intero(v.get("traduzione")) or 0) > 0,
            "voci": "sintonizzatore" in portati or (v.get("echi") or 0) > 0,
            "chiavi": "corridoio principale" in visitate,
            "tracce": (_intero(v.get("tracce")) or 0) > 0,
        },
        "turno": m.turno_corrente,
        "inventario": [o for o in m.oggetti if o in m.inventario],
        "visitate": sorted(visitate),
        "mappa": _mappa(m),
        "dialogo": m.dialogo_attivo,
        "nodo": m.nodo_dialogo if m.dialogo_attivo else None,
    }


def rel_stato():
    return _json(_stato())


# ----------------------------------------------------------------------------
#  Il suono: gli stati e gli eventi del turno (bibbia sonora, §1.6 e §2.4)
# ----------------------------------------------------------------------------
#  Gli eventi si riconoscono dal cambio di stato fra prima e dopo il turno, mai
#  dal testo della risposta. Dove lo stato non cambia basta il comando (ascolta
#  il reattore, la seconda volta). L'unica eccezione sono i segni del relitto e
#  della fuga che il gioco tira a sorte e non lasciano stato (il gemito, i
#  crolli): li si riconosce dal testo intero della loro regola, che è congelato
#  come tutto il gioco, e il collaudo controlla che ci sia ancora.
def _prop(m, id_ogg, *valori):
    o = m.oggetti.get(id_ogg)
    if o is None:
        return None
    for val in valori:
        if val in o.proprieta:
            return val
    return None


def _suono_stati():
    m = _mondo
    v = m.variabili
    portati = _portati(m)
    aria = _intero(v.get("aria"))
    giuntura = m.oggetti.get("giuntura")
    return {
        "stanza": m.posizione_giocatore,
        "atto": _atto(m),
        "tuta": _prop(m, "tuta", "vestita") == "vestita",
        "aria": aria,
        "protezione": aria is not None and aria < 30 and v.get("fuga") == "lontana",
        "fuga": v.get("fuga"),
        "ingresso": v.get("ingresso"),
        "contatto": v.get("contatto"),
        "connessione": v.get("connessione"),
        "energia": v.get("energia"),
        "dialogo": m.dialogo_attivo,
        "nodo": m.nodo_dialogo if m.dialogo_attivo else None,
        # il faro del casco esiste per il suono da quando lo porti
        "faro": _prop(m, "faro del casco", "pieno", "basso") if "faro del casco" in portati else None,
        "bengala": _prop(m, "bengala", "acceso", "spento"),
        "minaccia": v.get("minaccia"),
        "groviglio": _prop(m, "groviglio", "quieto", "desto"),
        "teca": _prop(m, "teca", "sigillata", "svuotata"),
        "seme": _prop(m, "seme", "vivente", "scuro"),
        "seme_con_te": "seme" in portati,
        "risuonatore": _prop(m, "risuonatore", "incastrato", "staccato"),
        "risuonatore_con_te": "risuonatore" in portati,
        "taglio": _intero(v.get("taglio")),
        "archivio": v.get("archivio"),
        "nota": v.get("nota"),
        "aggancio": v.get("aggancio"),
        "scansione": v.get("scansione"),
        "proiezione": v.get("proiezione"),
        "sistema": v.get("sistema"),
        "ricarica": v.get("ricarica"),
        "voce_nomi": v.get("voce dei nomi"),
        "porta_interna": _prop(m, "porta interna", "aperta", "chiusa"),
        "porta_circolare": _prop(m, "porta circolare", "aperta", "chiusa"),
        "grande_porta": _prop(m, "grande porta", "aperta", "chiusa"),
        "pannello": _prop(m, "pannello", "acceso", "spento"),
        "giuntura": (_prop(m, "giuntura", "compatta", "tagliata")
                     if giuntura is not None and giuntura.posizione is not None else None),
        "altare": _prop(m, "altare", "serrato", "schiuso"),
        "terminale": _prop(m, "terminale", "spento", "acceso"),
        "cristallo": _prop(m, "cristallo", "opaco", "attivo"),
        "disco": _prop(m, "disco", "incastrato", "staccato"),
        "kit": _prop(m, "kit", "chiuso", "aperto"),
        "cassetta": _prop(m, "cassetta di ferraglia", "chiusa", "aperta"),
        "registro": _prop(m, "registro di bordo", "intonso", "sfogliato"),
        "tacche": _prop(m, "tacche", "vergine", "segnata"),
        "cella": "cella di riserva" in portati,
        "chiavi": _intero(v.get("chiavi")),
        "traduzione": _intero(v.get("traduzione")),
        "echi": _intero(v.get("echi")),
        "risonanze": _intero(v.get("risonanze")),
        "tracce": _intero(v.get("tracce")),
        # le cose che hanno già reso la loro eco
        "risonate": sorted(o.nome for o in m.oggetti.values()
                           if "risuonata" in o.proprieta or "risuonate" in o.proprieta),
        "esito": m.stato_partita,
    }


# Gli eventi per cambio di stato: (evento, stato, da, a). «da» None vuol dire
# «da qualunque valore»; un evento scatta quando lo stato passa da «da» ad «a».
_PASSAGGI = (
    # Atto I
    ("scansione_lunga", "scansione", "assente", "completa"),
    ("accostamento", "aggancio", "lontano", "accostato"),
    ("arpioni", "aggancio", "accostato", "fatto"),
    ("registro", "registro", "intonso", "sfogliato"),
    ("cassetta", "cassetta", "chiusa", "aperta"),
    ("kit", "kit", "chiuso", "aperto"),
    ("vestizione", "tuta", False, True),
    ("faro_basso", "faro", "pieno", "basso"),
    ("faro_pieno", "faro", "basso", "pieno"),
    ("cella", "cella", True, False),
    # Atto II
    ("giuntura_trovata", "giuntura", None, "compatta"),
    ("giuntura_tagliata", "giuntura", "compatta", "tagliata"),
    ("varco_richiuso", "ingresso", "aperto", "richiuso"),
    ("pannello", "pannello", "spento", "acceso"),
    ("porta_interna", "porta_interna", "chiusa", "aperta"),
    ("primo_contatto", "contatto", "nuovo", "avvenuto"),
    ("risuonatore_staccato", "risuonatore", "incastrato", "staccato"),
    ("connessione", "connessione", "nuova", "avvenuta"),
    # Atto III
    ("groviglio_sente", "minaccia", "lontana", "vicina"),
    ("bengala_acceso", "bengala", "spento", "acceso"),
    ("bengala_spento", "bengala", "acceso", "spento"),
    ("tacche", "tacche", "vergine", "segnata"),
    ("grande_porta", "grande_porta", "chiusa", "aperta"),
    ("energia", "energia", "assente", "ripristinata"),
    ("ricarica", "ricarica", "disponibile", "usata"),
    ("dispositivo_medico", "cristallo", "opaco", "attivo"),
    ("altare", "altare", "serrato", "schiuso"),
    ("disco_liberato", "disco", "incastrato", "staccato"),
    ("teca_serra", "teca", "sigillata", "svuotata"),
    ("seme_preso", "seme_con_te", False, True),
    ("seme_lasciato", "seme_con_te", True, False),
    ("seme_spento", "seme", "vivente", "scuro"),
    ("risuonatore_preso", "risuonatore_con_te", False, True),
    ("risuonatore_lasciato", "risuonatore_con_te", True, False),
    ("terminale", "terminale", "spento", "acceso"),
    ("archivio_saluta", "archivio", "intatto", "salutato"),
    ("archivio_forzato", "archivio", "intatto", "forzato"),
    ("postazione", "proiezione", "spenta", "attiva"),
    ("sistema", "sistema", "ignoto", "noto"),
    ("porta_tonda", "porta_circolare", "chiusa", "aperta"),
    ("nota_reattore", "nota", "ignota", "reattore"),
    ("nota_riconosciuta", "nota", None, "riconosciuta"),
    # Atto IV e V
    ("fuga", "fuga", "lontana", "iniziata"),
    ("groviglio_desto", "groviglio", "quieto", "desto"),
    ("voce_dei_nomi", "voce_nomi", "attesa", "udita"),
)

# Gli eventi per comando, dove lo stato può non cambiare: (verbo, cosa) → evento.
_PER_COMANDO = {
    ("ascolta", "reattore"): "reattore_ascoltato",
    ("tocca", "reattore"): "reattore_toccato",
    ("tocca", "venature spente"): "venature_spente",
    ("tocca", "venature verdi"): "venature_verdi",
    ("tocca", "risuonatore"): "risuonatore_toccato",
    ("suona", "sonaglio"): "sonaglio",
    ("usa", "sonaglio"): "sonaglio",
    ("ascolta", "radio"): "radio",
    ("ascolta", "scatola nera"): "scatola_nera",
}

# Gli attrezzi, per verbo (bibbia sonora, §5.7): il suono dell'attrezzo al lavoro.
_ATTREZZO_DEL_VERBO = {"analizza": "multiscanner", "traduci": "matrice", "sintonizza": "sintonizzatore",
                       "taglia": "taglierina", "incidi": "taglierina", "stacca": "taglierina"}

# I segni tirati a sorte che non lasciano stato: l'inizio del loro testo.
SEGNI_A_SORTE = {
    "assestamento": "Da qualche parte nella nave qualcosa si assesta",
    "brusio_cala": "Nella cuffia il brusio cala fino quasi a sparire",
    "pareti_lampo": "Per un battito, qualcosa nelle pareti si accende tutto insieme",
    "crollo": "Da qualche parte dietro di te qualcosa crolla",
    "incrinature": "Le pareti si incrinano in lunghe linee verdi",
}

# Le soglie del visore (aria.fav; bibbia sonora, §4.4).
_SOGLIE = (("ambra", 60), ("ipossia", 15))

FINALI = ("vivi", "prima-nota", "stiva-piena", "doppio-fondo", "mani-vuote", "due-lettere")


def _finale(m):
    """Quale dei sei finali (finali.fav: le condizioni sono esclusive)."""
    if m.stato_partita == "persa":
        return "due-lettere"
    if m.stato_partita != "vinta":
        return None
    portati = _portati(m)
    seme, risuonatore = "seme" in portati, "risuonatore" in portati
    if seme and risuonatore:
        return "doppio-fondo"
    if seme:
        if (m.variabili.get("risonanze") or 0) >= 6 and m.variabili.get("nota") == "riconosciuta":
            return "prima-nota"
        return "vivi"
    return "stiva-piena" if risuonatore else "mani-vuote"


def _rileva(prima, dopo, comando, eventi):
    if prima is None:
        return [{"evento": "inizio", "stanza": dopo["stanza"]}]
    out = []
    if prima["stanza"] != dopo["stanza"]:
        out.append({"evento": "stanza", "da": prima["stanza"], "a": dopo["stanza"]})
        coppia = (prima["stanza"], dopo["stanza"])
        nome = {("stiva", "scafo"): "boccaporto", ("scafo", "stiva"): "rientro",
                ("scafo", "camera di compensazione"): "discesa"}.get(coppia)
        if nome:
            out.append({"evento": nome})
        if coppia == ("sala delle teche", "gola di mezzo") and prima["minaccia"] == "vicina":
            out.append({"evento": "groviglio_prende"})
        if dopo["stanza"] == "stiva" and dopo["fuga"] == "iniziata":
            out.append({"evento": "casco_tolto"})
    for nome, chiave, da, a in _PASSAGGI:
        if prima.get(chiave) != dopo.get(chiave) and dopo.get(chiave) == a and (da is None or prima.get(chiave) == da):
            out.append({"evento": nome})
    # il dialogo: chi, e i nodi (il silenzio dell'Anziano)
    if prima["dialogo"] != dopo["dialogo"]:
        if prima["dialogo"]:
            out.append({"evento": "dialogo_fine", "con": prima["dialogo"]})
        if dopo["dialogo"]:
            out.append({"evento": "dialogo", "con": dopo["dialogo"], "nodo": dopo["nodo"]})
    elif dopo["dialogo"] and prima["nodo"] != dopo["nodo"]:
        out.append({"evento": "nodo", "con": dopo["dialogo"], "nodo": dopo["nodo"]})
    # i contatori
    for chiave in ("chiavi", "echi", "risonanze", "tracce", "taglio"):
        a, b = prima.get(chiave) or 0, dopo.get(chiave) or 0
        if b > a:
            out.append({"evento": {"chiavi": "chiave", "echi": "eco", "risonanze": "risonanza",
                                   "tracce": "traccia", "taglio": "taglio"}[chiave], "valore": b})
    for cosa in sorted(set(dopo["risonate"]) - set(prima["risonate"])):
        out.append({"evento": "risuonata", "cosa": cosa})
    t0, t1 = prima.get("traduzione") or 0, dopo.get("traduzione") or 0
    if t1 > t0:
        out.append({"evento": "matrice", "valore": t1})
        if t0 < 100 <= t1:
            out.append({"evento": "traduzione_completa"})
    # l'aria e le soglie del visore
    a0, a1 = prima.get("aria"), dopo.get("aria")
    if a0 is not None and a1 is not None and a0 != a1:
        out.append({"evento": "aria", "da": a0, "a": a1, "differenza": a1 - a0})
        for nome, soglia in _SOGLIE:
            if a0 > soglia >= a1:
                out.append({"evento": nome})
    if prima["protezione"] != dopo["protezione"]:
        out.append({"evento": "protezione" if dopo["protezione"] else "protezione_fine"})
    if (a0 is not None and a1 is not None and a0 >= 30 > a1 and dopo["fuga"] == "iniziata"
            and prima["fuga"] == "iniziata"):
        out.append({"evento": "protezione_fuga"})
    # il comando
    if comando and comando.get("verbo"):
        nome = _PER_COMANDO.get((comando["verbo"], comando.get("cosa")))
        if nome and not (nome == "risuonatore_toccato" and dopo["risuonatore"] != "incastrato"):
            out.append({"evento": nome})
        attrezzo = _ATTREZZO_DEL_VERBO.get(comando["verbo"])
        if comando["verbo"] == "usa" and "taglierina" in (comando.get("cosa"), comando.get("secondo")):
            attrezzo = "taglierina"
        if attrezzo:
            out.append({"evento": "attrezzo", "attrezzo": attrezzo, "cosa": comando.get("cosa")})
    # i segni a sorte
    for e in eventi:
        if e["tipo"] != "testo":
            continue
        for nome, inizio in SEGNI_A_SORTE.items():
            if inizio in e["testo"]:
                out.append({"evento": nome})
    if prima["esito"] != dopo["esito"] and dopo["esito"] != "in_corso":
        out.append({"evento": "finale", "finale": _finale(_mondo), "esito": dopo["esito"]})
    return out


def rel_segni_a_sorte():
    """Per il collaudo: ogni segno a sorte deve essere ancora il testo di una
    regola «Ogni turno» del gioco (se no il rilevatore non lo vedrebbe più)."""
    testi = []
    for d in _base.demoni:
        for c in getattr(d, "conseguenze", ()) or ():
            for attr in ("testo", "messaggio", "risposta"):
                val = getattr(c, attr, None)
                if isinstance(val, str):
                    testi.append(val)
        val = getattr(d, "risposta", None)
        if isinstance(val, str):
            testi.append(val)
    return _json({nome: any(inizio in t for t in testi) for nome, inizio in SEGNI_A_SORTE.items()})


# ----------------------------------------------------------------------------
#  Il comando, scomposto
# ----------------------------------------------------------------------------
def _norm(testo):
    return " ".join(testo.replace("’", "'").lower().split()).rstrip(".")


def _voci(p):
    """Tutti i comandi che i pulsanti offrono, con verbo e cose: [dict]."""
    out = []
    for s in p["scelte"]:
        out.append({"comando": s["comando"], "gruppo": "scelta", "etichetta": s["etichetta"]})
    for u in p["uscite"]:
        out.append({"comando": u["comando"], "gruppo": "uscita", "etichetta": u["etichetta"],
                    "verbo": "vai", "cosa": u["comando"]})
    for v in p["verbi"]:
        verbo = v["verbo"]
        if v["da_solo"]:
            out.append({"comando": verbo, "gruppo": "verbo", "etichetta": v["etichetta"], "verbo": verbo})
        for primo in v["primi"]:
            base = f"{verbo} {primo['testo']}"
            if v["secondo"] != "obbligatorio":
                out.append({"comando": base, "gruppo": "verbo", "verbo": verbo, "cosa": primo["id"],
                            "etichetta": f"{v['etichetta']} · {primo['testo']}"})
            if v["secondo"] == "no":
                continue
            secondi = v.get("secondi") or (v.get("secondi_per") or {}).get(primo["id"], [])
            for s in secondi:
                if s.get("id") == primo["id"]:
                    continue
                out.append({"comando": f"{base} {s['testo']}", "gruppo": "verbo", "verbo": verbo,
                            "cosa": primo["id"], "secondo": s.get("id"),
                            "etichetta": f"{v['etichetta']} · {primo['testo']} · {s['testo']}"})
    for s in p["servizio"]:
        out.append({"comando": s["comando"], "gruppo": "servizio", "etichetta": s["etichetta"],
                    "verbo": s["comando"]})
    return out


def offerti(p=None):
    """Tutti i comandi che i pulsanti offrono adesso: [(comando, gruppo, etichetta)]."""
    return [(v["comando"], v["gruppo"], v["etichetta"]) for v in _voci(p or pulsanti(_mondo))]


def _analizza(comando):
    """Il comando del turno in verbo e cose. Un comando nato da un pulsante si
    riconosce fra quelli offerti prima del turno; uno scritto (il campo delle
    build di sviluppo) si scompone come fa il motore, in silenzio."""
    chiave = _norm(comando)
    p = _ultimi if _ultimi is not None else pulsanti(_mondo)
    for v in _voci(p):
        if _norm(v["comando"]) == chiave:
            analisi = {"testo": comando, "verbo": v.get("verbo"), "cosa": v.get("cosa"),
                       "secondo": v.get("secondo"), "gruppo": v["gruppo"]}
            if v["gruppo"] == "scelta":
                analisi["etichetta"] = v["etichetta"]
            return analisi
    parole = chiave.split()
    if not parole:
        return {"testo": comando, "verbo": None, "cosa": None, "secondo": None, "gruppo": None}
    m = _mondo
    verbo = _verbo_del_pulsante(m, parole[0])
    cosa = None
    if len(parole) > 1:
        caso = m.rng.getstate()
        try:
            trovato, _ = risolvi_in_silenzio(m, " ".join(parole[1:]))
        except Exception:                                   # noqa: BLE001
            trovato = None
        finally:
            m.rng.setstate(caso)
        cosa = trovato if isinstance(trovato, str) and (trovato in m.oggetti or trovato in m.direzioni.values()) else None
    elif parole[0] in m.direzioni:
        verbo, cosa = "vai", m.direzioni[parole[0]]
    return {"testo": comando, "verbo": verbo, "cosa": cosa, "secondo": None, "gruppo": "scritto"}


# ----------------------------------------------------------------------------
#  Il diario: la cronaca della partita (06-app-desktop.md, §4.6)
# ----------------------------------------------------------------------------
#  Una voce per ogni comando della sequenza effettiva del motore
#  (_registro_comandi): un turno disfatto con ANNULLA esce anche dal diario, e
#  dopo un caricamento la cronaca si ricostruisce rigiocando la sequenza. Ogni
#  voce porta i segni con cui l'app compone le pagine del diario, trovati come
#  quelli del suono, per differenza fra prima e dopo e dal comando, mai dal
#  testo: le tracce di L.V., le voci ascoltate, le iscrizioni tradotte, i
#  reperti decifrati, la placca con le iniziali.

# Le cinque tracce di L.V. (relitto.fav, «tracce»; 06, §4.3), nell'ordine della
# sua strada, ognuna con lo stato che la segna.
TRACCE_LV = (("giuntura", "datazione", "nota"), ("tacche", "solco", "misurato"),
             ("cavo", "ritrovamento", "fatto"), ("uomo", "specchio", "visto"),
             ("voce", "diario", "ascoltato"))
# Le iscrizioni che la matrice legge a soglie, e i reperti che la fanno crescere
# (traduci.fav).
ISCRIZIONI = ("bassorilievo", "globo olografico", "lastra incisa", "mappa stellare",
              "tabelle di semina", "sostegno")
REPERTI = ("lastra dati", "cilindro mnemonico", "stele", "nucleo")


def _diario_stati(m):
    v = m.variabili
    aria = _intero(v.get("aria"))
    return {
        "tracce": [nome for nome, stato, valore in TRACCE_LV if v.get(stato) == valore],
        "decifrati": [r for r in REPERTI if _prop(m, r, "decifrato") == "decifrato"],
        "echi": _intero(v.get("echi")) or 0,
        "risonanze": _intero(v.get("risonanze")) or 0,
        "traduzione": _intero(v.get("traduzione")) or 0,
        "aria": aria,
        # le due regole che tengono spento il traduttore (traduci.fav)
        "protezione": aria is not None and aria < 30 and v.get("fuga") == "lontana",
        "proiezione": v.get("proiezione"),
    }


def _nome_di(m, id_ogg):
    o = m.oggetti.get(id_ogg)
    return o.nome_visualizzato if o is not None else id_ogg


def _voce_di_cronaca(m, comando, analisi, prima, dopo, eventi):
    """La voce del diario per un comando appena giocato su `m`."""
    global _chiave
    _chiave += 1
    verbo, cosa = analisi.get("verbo"), analisi.get("cosa")
    lettura = None
    if (verbo == "traduci" and cosa in ISCRIZIONI and not prima["protezione"]
            and not (cosa == "mappa stellare" and prima["proiezione"] == "spenta")):
        lettura = {"cosa": cosa, "nome": _nome_di(m, cosa), "matrice": prima["traduzione"]}
    a0, a1 = prima["aria"], dopo["aria"]
    stanza = m.trova_stanza(m.posizione_giocatore)
    return {
        "chiave": _chiave,
        # come lo si legge: una scelta del dialogo con le sue parole
        "comando": analisi.get("etichetta") or comando,
        "eventi": [e.come_dizionario() for e in eventi],
        "differenza": a1 - a0 if a0 is not None and a1 is not None and a1 != a0 else None,
        "stanza": m.posizione_giocatore,
        "nome_stanza": stanza.nome_visualizzato if stanza is not None else None,
        "atto": _atto(m),
        "titolo_atto": ATTI[_atto(m)],
        "turno": m.turno_corrente,
        "tracce": [t for t in dopo["tracce"] if t not in prima["tracce"]],
        "voce": dopo["echi"] > prima["echi"] or dopo["risonanze"] > prima["risonanze"],
        "lettura": lettura,
        "reperti": [{"cosa": r, "nome": _nome_di(m, r)} for r in dopo["decifrati"]
                    if r not in prima["decifrati"]],
        # le iniziali di L.V. si leggono soltanto sulla placca (vita.fav)
        "iniziali": verbo in ("esamina", "leggi") and cosa == "placca",
    }


def _aggiorna_cronaca(m, comando, analisi, prima, eventi):
    """Allinea la cronaca alla sequenza effettiva del motore dopo un comando:
    la voce nuova, se il comando ci è entrato; nessuna, se non è entrato (un
    comando di servizio) o se ANNULLA l'ha accorciata."""
    n = len(m._registro_comandi)
    del _cronaca[n:]
    if n != len(_cronaca) + 1:
        return None
    # il comando come il motore l'ha registrato («esci» è «fuori»): lo stesso
    # che la cronaca ricostruita rilegge dopo un caricamento
    voce = _voce_di_cronaca(m, m._registro_comandi[-1], analisi, prima, _diario_stati(m), eventi)
    _cronaca.append(voce)
    return voce


_NESSUN_PULSANTE = {"scelte": [], "uscite": [], "verbi": [], "servizio": []}


def _ricostruisci_cronaca(seme, comandi):
    """La cronaca di una partita caricata: la sequenza rigiocata su una copia,
    raccogliendo ciò che il caricamento del motore rigioca in silenzio."""
    global _mondo, _ultimi
    vero, ultimi = _mondo, _ultimi
    m, apertura, stanza = _nuova_partita(seme)
    m._senza_istantanee = True        # nessun ANNULLA su questa copia: si va più in fretta
    _mondo, cronaca = m, []
    try:
        for c in comandi:
            if m.stato_partita != "in_corso":
                break
            # le scelte (un dialogo, una conferma) si leggono con le loro parole
            scelte = m.in_dialogo() or getattr(m, "_in_conferma", None) or getattr(m, "_ambiguita", None)
            _ultimi = pulsanti(m) if scelte else _NESSUN_PULSANTE
            prima = _diario_stati(m)
            analisi = _analizza(c)
            with raccogli_uscita(m) as uscita:
                elabora_comando(m, c)
            cronaca.append(_voce_di_cronaca(m, c, analisi, prima, _diario_stati(m), uscita.eventi))
    finally:
        _mondo, _ultimi = vero, ultimi
    return [e.come_dizionario() for e in apertura + stanza], cronaca


def rel_diario():
    """Il diario intero: il prologo con la prima stanza, e la cronaca."""
    return _json({"apertura": _apertura, "cronaca": _cronaca})


# ----------------------------------------------------------------------------
#  L'impronta della storia: i sorgenti e il motore (per i salvataggi)
# ----------------------------------------------------------------------------
def impronta_storia(motore=VERSIONE_MOTORE):
    """`motore`: la versione del motore con cui contare. Con quella scritta in un
    salvataggio dice se i sorgenti sono gli stessi anche quando il motore è
    cambiato dopo (rel_carica)."""
    h = hashlib.sha256(str(motore).encode())
    cartella = os.path.dirname(_storia) if _storia else "."
    for nome in sorted(os.listdir(cartella)):
        if nome.endswith(".fav"):
            with open(os.path.join(cartella, nome), "rb") as f:
                h.update(nome.encode() + b"\0" + f.read().replace(b"\r\n", b"\n"))
    return h.hexdigest()


# ----------------------------------------------------------------------------
#  I salvataggi, a riprese
# ----------------------------------------------------------------------------
#  Un salvataggio è la sequenza effettiva dei comandi (quella del motore, con i
#  turni disfatti già tolti), il seme del caso e due impronte: quella della
#  storia (i sorgenti) e quella dello stato. Caricare vuol dire rigiocare da
#  capo e confrontare (sviluppo/VERSIONI.md, §4):
#    identica     stessa storia, stessa impronta: il caso normale;
#    ricostruita  la storia è cambiata dopo il salvataggio: la partita si
#                 rigioca sulla versione nuova, e il gioco lo dice;
#    diversa      stessa storia e impronta diversa: un difetto, mai una scelta.
#  Se è cambiato soltanto il motore (gli stessi .fav, 1.4.4 → 1.5.0) e la
#  partita rigiocata torna alla stessa impronta, è identica: non c'è niente da
#  controllare. Se l'impronta non torna, è ricostruita.
#  Il file lo scrive e lo legge l'app (Tauri, nella cartella dei salvataggi);
#  il ponte dà e riceve il testo.
def rel_salva(identita=None, creato=None):
    """Il testo del salvataggio della partita in corso. `identita` è la build
    dell'app («0.2.0 · 81e6a6d»), `creato` la data (le mette l'app: il ponte
    resta deterministico)."""
    m = _mondo
    stato = _stato()
    dati = {
        "formato": FORMATO,
        "versione": _versione.get("formatoSalvataggi", 1),
        "gioco": _versione.get("gioco"),
        "identita": identita,
        "creato": creato,
        "motore": VERSIONE_MOTORE,
        "impronta_storia": impronta_storia(),
        "seme": _seme,
        "riassunto": {"stanza": stato["stanza"], "nome_stanza": stato["nome_stanza"],
                      "atto": stato["atto"], "titolo_atto": stato["titolo_atto"],
                      "turno": stato["turno"], "aria": stato["aria"], "esito": m.stato_partita},
        "partita": dati_salvataggio(m),
    }
    return json.dumps(dati, ensure_ascii=False, indent=1)


def _migra(dati):
    """I formati vecchi diventano quello di oggi. Il formato è 1 dalla 0.2.0:
    non c'è ancora niente da migrare (le migrazioni future vanno qui, una per
    passo, 1 → 2 → 3)."""
    return dati


def rel_carica(testo):
    global _mondo, _seme, _ultimi, _apertura, _cronaca
    t0 = time.perf_counter()

    def rifiuto(motivo, messaggio):
        return _json({"ok": False, "motivo": motivo, "messaggio": messaggio, "ms": _ms(t0)})

    try:
        dati = json.loads(testo)
    except (TypeError, ValueError):
        return rifiuto("illeggibile", "Il salvataggio è danneggiato: non si riesce a leggerlo.")
    if not isinstance(dati, dict) or dati.get("formato") != FORMATO:
        return rifiuto("formato", "Questo file non è un salvataggio del Relitto Silente.")
    formato = _versione.get("formatoSalvataggi", 1)
    versione = dati.get("versione")
    if not isinstance(versione, int) or versione < 1:
        return rifiuto("formato", "Il salvataggio è danneggiato: manca il numero del formato.")
    if versione > formato:
        return rifiuto("piu_recente", "Questo salvataggio viene da una versione più recente del gioco. "
                                      "Aggiorna Il Relitto Silente per caricarlo.")
    if versione < formato:
        dati = _migra(dati)
    partita = dati.get("partita")
    seme = dati.get("seme")
    if not isinstance(partita, dict) or not isinstance(seme, int):
        return rifiuto("danneggiato", "Il salvataggio è danneggiato: mancano la partita o il seme.")

    m, _, _ = _nuova_partita(seme)
    ok, messaggio = carica_da_dati(m, partita)
    if not ok:
        return rifiuto("motore", messaggio)
    stessa_storia = dati.get("impronta_storia") == impronta_storia()
    motore = dati.get("motore")
    solo_il_motore = (not stessa_storia and isinstance(motore, str) and motore != VERSIONE_MOTORE
                      and dati.get("impronta_storia") == impronta_storia(motore))
    identica = m.impronta_stato() == partita.get("impronta")
    if (stessa_storia or solo_il_motore) and identica:
        esito, messaggio = "identica", f"Partita caricata: turno {m.turno_corrente}."
    elif not stessa_storia:
        esito = "ricostruita"
        perche = "il motore del gioco è cambiato" if solo_il_motore else "la storia è cambiata"
        messaggio = (f"La partita è stata ricostruita sulla versione nuova del gioco (turno "
                     f"{m.turno_corrente}): {perche} dopo il salvataggio. "
                     f"Controlla che tutto sia come lo ricordi.")
    else:
        esito = "diversa"
        messaggio = (f"Partita caricata (turno {m.turno_corrente}), ma non è identica a quella "
                     f"salvata. Controlla che tutto sia come lo ricordi.")
    _mondo, _seme, _ultimi = m, seme, None
    _apertura, _cronaca = _ricostruisci_cronaca(seme, list(m._registro_comandi))
    eventi = _mostra_su_un_ramo(m)
    turno = json.loads(_turno(eventi, t0, time.perf_counter(), prima=None, comando=None))
    turno["suono"]["eventi"] = [{"evento": "caricamento", "stanza": m.posizione_giocatore}]
    turno["cronaca"] = {"lunghezza": len(_cronaca), "nuova": None}
    return _json({"ok": True, "esito": esito, "messaggio": messaggio, "impronta": m.impronta_stato(),
                  "turno": turno, "diario": {"apertura": _apertura, "cronaca": _cronaca},
                  "ms": _ms(t0)})


def _mostra_su_un_ramo(m):
    """La stanza (o la battuta del dialogo) da mostrare dopo un caricamento,
    senza cambiare la partita: mostra_situazione del motore (dalla 1.5.0, L19).
    Mostrare la stanza la segnerebbe come vista: una stanza raggiunta da una
    regola che non la mostra (la gola del ritorno, nella fuga) diventava vista
    solo nella partita caricata, e l'impronta non tornava più."""
    with raccogli_uscita(m) as uscita:
        mostra_situazione(m)
    return uscita.eventi


def rel_impronta():
    """L'impronta dello stato della partita in corso (per i collaudi)."""
    return _json({"impronta": _mondo.impronta_stato(), "turno": _mondo.turno_corrente})


# ----------------------------------------------------------------------------
#  Giocare un percorso di collaudo con i soli pulsanti
# ----------------------------------------------------------------------------
#  Per ogni comando del percorso si cerca il pulsante che lo gioca, in tre gradi:
#    uguale        un pulsante manda lo stesso comando (o, in un dialogo,
#                  l'opzione ha la stessa etichetta);
#    equivalente   un pulsante porta allo stesso stato (stessa impronta) e il
#                  motore risponde con le stesse parole: «segui la parete» si
#                  gioca con «segui le teche chiuse», che il motore offre;
#    stesso stato  solo lo stato coincide, la risposta no. Il collaudo li
#                  elenca a parte;
#    nessun effetto il comando non cambia niente, nemmeno il turno: «giù» dove
#                  non si scende («Non puoi andare in quella direzione.»). Con i
#                  pulsanti non si preme niente, e la partita resta la stessa.
#  I pulsanti sono quelli del motore oppure, con `candidati`, soltanto quelli
#  che il modello d'azione dell'app mostra nei suoi menu (collaudo/menu.mjs).
#  Ogni prova si fa su un ramo della partita, poi disfatto: prova del motore
#  (dalla 1.5.0, N4), che copre da sé ogni campo di sessione. Fino alla 0.2.0 il
#  ponte ne copiava sedici a mano.
def _ramo(comando):
    """Gioca `comando` su un ramo della partita e torna indietro: l'impronta
    dello stato a cui porta e il testo della risposta."""
    try:
        r = prova(_mondo, comando)
    except Exception:                                       # noqa: BLE001
        return None, None
    return r["impronta"], r["testo"]


# Fra i pulsanti di servizio, quelli che giocano un turno; «aspetta» per primo:
# è il pulsante con cui si lascia passare il tempo.
_SERVIZIO_DI_GIOCO = ("aspetta", "guarda", "inventario")


def _scelta(t0, modo, voce, prove):
    cmd, gruppo, etichetta = voce
    return _json({"trovato": True, "modo": modo, "comando": cmd, "gruppo": gruppo,
                  "etichetta": etichetta, "prove": prove, "ms": _ms(t0)})


def rel_pulsante_per(comando, candidati=None):
    """`candidati`: None (i pulsanti del motore) o il testo JSON di una lista di
    comandi (quelli del modello d'azione)."""
    t0 = time.perf_counter()
    p = pulsanti(_mondo)
    voci = offerti(p)
    if candidati is not None:
        ammessi = json.loads(candidati) if isinstance(candidati, str) else list(candidati)
        gruppi = {_norm(v[0]): v for v in voci}
        voci = [gruppi.get(_norm(c), (c, "verbo", c)) for c in ammessi]
    chiave = _norm(comando)
    for voce in voci:
        cmd, gruppo, etichetta = voce
        if _norm(cmd) == chiave or (gruppo == "scelta" and _norm(etichetta) == chiave):
            return _scelta(t0, "uguale", voce, 0)
    if p["fase"] != "gioco":
        return _json({"trovato": False, "fase": p["fase"], "ms": _ms(t0)})
    stato_atteso, testo_atteso = _ramo(comando)
    fermo = stato_atteso is not None and stato_atteso == _mondo.impronta_stato()
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
        if fermati and (solo_stato is not None or fermo):
            break
    if fermo:
        return _json({"trovato": True, "modo": "nessun effetto", "comando": None, "gruppo": None,
                      "etichetta": None, "prove": prove, "ms": _ms(t0)})
    if solo_stato is not None:
        return _scelta(t0, "stesso stato", solo_stato, prove)
    return _json({"trovato": False, "fase": p["fase"], "prove": prove, "ms": _ms(t0)})


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
    return _json({"comandi": comandi, "attese": attese})
