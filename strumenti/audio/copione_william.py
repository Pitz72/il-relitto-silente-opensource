# Il copione di William per Leonardo Tomassetti (documento 33, RN-H4; documento 35): dai .fav, tutto quello che
# William dice, diviso in blocchi di contesto, con quello che dicono gli altri accanto (in grigio, già registrato).
#
# Che cosa è di William (la divisione decisa il 29 ottobre e il 7 novembre 2026, documento 35, V1):
#   - il racconto, in prima persona, al presente: le descrizioni, le risposte, gli eventi, i finali;
#   - quello che dice ad alta voce: le opzioni dei dialoghi (non i gesti fra parentesi quadre, né «Chiudi la
#     comunicazione.» e «Lascia stare.», che sono azioni);
#   - le parole fra «» che nessun’altra voce dice: le incisioni lette con la matrice, le scritte, le citazioni;
#   - il numero dell’aria che legge sul visore ([aria]) e le fasce accese ([risveglio]).
# Non è di William: il prologo e la scatola nera (L.V.), l’Anziano, Yusuf, le voci della nave (le loro battute e le
# varianti brevi delle registrazioni), la voce di servizio (la tuta, lo scanner, la matrice, i suggerimenti), il
# nome di chi parla davanti alle voci della nave («IL NAVARCA:»), la riga del registro di bordo che chiude i
# finali (la dice il computer di bordo, con la voce di servizio: William il suo nome non lo dice mai), i messaggi
# del motore.
#
# Le frasi che cambiano con la partita («[se …]…[altrimenti]…[fine]») si dividono in pezzi: ogni pezzo è una presa,
# e il gioco li monta. Le prese uguali si registrano una volta sola.
#
#   python strumenti/audio/copione_william.py            scrive doppiaggio/william/copione.json
#   python strumenti/audio/copione_william.py --stato    i numeri
import hashlib
import json
import os
import re
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
STORIA = os.path.join(RADICE, "relitto-silente")
USCITA = os.path.join(RADICE, "doppiaggio", "william")
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))

# I capitoli, nell’ordine della storia; i moduli che attraversano il gioco in fondo.
CAPITOLI = [
    ("santamaria.fav", "SM", "Atto I · La Santa Maria"),
    ("ingresso.fav", "IN", "Atto II · L’ingresso nel relitto"),
    ("corridoio.fav", "CO", "Atto III · Il corridoio e la Grande Porta"),
    ("vita.fav", "VI", "Atto III · La serra, l’arca, le teche, il vivaio"),
    ("tecnica.fav", "TE", "Atto III · Il laboratorio e l’energia"),
    ("equipaggio.fav", "EQ", "Atto III · L’alloggio, il nido, il Piccolo"),
    ("memoria.fav", "ME", "Atto III · Il santuario del silenzio, lo scriptorium, l’archivio"),
    ("ponte.fav", "PO", "Atto IV · Il Ponte e l’Anziano"),
    ("fuga.fav", "FU", "Atto V · La fuga"),
    ("finali.fav", "FI", "I finali"),
    ("echi.fav", "EC", "Il Sintonizzatore: le echi, in tutta la nave"),
    ("traduci.fav", "TR", "La matrice di traduzione, in tutta la nave"),
    ("aria.fav", "AR", "L’aria della tuta"),
    ("relitto.fav", "RE", "Dappertutto"),
]
# Le opzioni che sono gesti o azioni, non parole: William non le dice.
AZIONI = {"Chiudi la comunicazione.", "Lascia stare."}
PARLANTI = {"anziano": "l’Anziano", "l'anziano": "l’Anziano", "yusuf": "Yusuf", "eco": "il Piccolo (eco)",
            "l'eco": "il Piccolo (eco)"}
# Le condizioni del gioco, dette come le direbbe William.
UMANE = [(r"\bil giocatore non ha\b", "non ho"), (r"\bil giocatore ha\b", "ho"),
         (r"\bil giocatore non è\b", "non sono"), (r"\bil giocatore è\b", "sono"),
         (r"\bc[aà]pita \((\d+) su (\d+)\)", r"a caso, \1 volta su \2"), (r"\bè almeno\b", "è almeno"),
         (r"\bè più di\b", "è sopra"), (r"\bè meno di\b", "è sotto"), (r"\bè al massimo\b", "è al massimo")]


def umana(c):
    if not c:
        return c
    for a, b in UMANE:
        c = re.sub(a, b, c)
    return c
STRINGA = re.compile(r'"((?:[^"\\]|\\.)*)"')
DESCRIZIONE = re.compile(r"^La descrizione (?:del|della|dello|dei|delle|degli|di|dell')\s*(.+?)(?: se (.+?))? è \"")
RISPOSTA = re.compile(r"^Invece di (.+?)(?: se (.+?))?: dire \"")
EVENTO = re.compile(r"^Quando (.+?) diventa vera: (?:dire|perdi|vinci) \"")
FINALE = re.compile(r"^Quando (.+?): (?:dire|vinci|perdi) \"")
DEMONE = re.compile(r"^Ogni turno(?: se (.+?))?: dire \"")
DOPO = re.compile(r"^(.+?) dopo che (.+?): dire \"")
BATTUTA = re.compile(r"^(\S+?) al nodo \"(\w+)\" dice \"((?:[^\"\\]|\\.)*)\"(?: se (.+?))?\.$")
OPZIONE = re.compile(r"^Al nodo \"(\w+)\" l'opzione \"((?:[^\"\\]|\\.)*)\"(?: se (.+?))? (?:conduce|chiude)")
RAMO = re.compile(r"(\[se [^\]]*\]|\[altrimenti\]|\[fine\])")
ETICHETTA = re.compile(r"(?:^|(?<=[\s.]))((?:UNA |IL |LO |LA |L'|L’)?[A-ZÀÈÉÌÒÙ][A-ZÀÈÉÌÒÙ'’\- ]{2,}):\s*(?=«)")
REGISTRO = re.compile(r"Registro di bordo, TSC-1972\..*$", re.S)
# La matrice con il suo segnaposto, com'è nei .fav: la dice la voce di servizio, con il numero del momento.
MATRICE = re.compile(r"\((?:Matrice di traduzione|MATRICE DI TRADUZIONE): \[traduzione\]%(?: — DECODIFICA COMPLETATA)?\)?")
# Un blocco più lungo di così si divide, cosa per cosa (o nodo per nodo, nei dialoghi).
MAX_PRESE = 12
# Il titolo dei blocchi che nei .fav non hanno una sezione sopra.
SEZIONI = {"corridoio.fav": "CORRIDOIO PRINCIPALE", "tecnica.fav": "LABORATORIO DI RISONANZA",
           "fuga.fav": "LA FUGA", "finali.fav": "I FINALI", "echi.fav": "IL SINTONIZZATORE",
           "traduci.fav": "LA MATRICE DI TRADUZIONE", "aria.fav": "L'ARIA DELLA TUTA"}


def parole(t):
    return tuple(re.findall(r"\w+", re.sub(r"\([^)]*\)", " ", t.replace("’", "'")).lower()))


def carica_ponte():
    import ponte
    ponte.rel_compila(os.path.join(STORIA, "relitto.fav"))
    frammenti = []
    for nome, fr in {**ponte.VOCI_NAVE, **ponte.VOCI_YUSUF, **ponte.VOCI_LV}.items():
        for f in fr:
            frammenti.append((nome, parole(f)))
    return ponte, frammenti


def sottosequenza(a, b):
    it = iter(b)
    return all(x in it for x in a)


def struttura(testo):
    """Il testo come fila di parti fisse e di scelte: [("fisso", t)] e [("scelta", [(condizione, t), …])]; una
    scelta senza «[altrimenti]» ha anche il ramo vuoto."""
    out, rami, cond = [], None, None
    for parte in RAMO.split(testo):
        if not parte:
            continue
        if parte.startswith("[se "):
            cond = parte[4:-1]
            rami = [("se " + cond, "")]
        elif parte == "[altrimenti]":
            rami.append((f"altrimenti (se non: {cond})", ""))
        elif parte == "[fine]":
            if not any(c.startswith("altrimenti") for c, _ in rami):
                rami.append((f"altrimenti (se non: {cond})", ""))
            out.append(("scelta", rami))
            rami = None
        elif rami is not None:
            c, t = rami[-1]
            rami[-1] = (c, t + parte)
        else:
            out.append(("fisso", parte))
    return out


FINE_FRASE = re.compile(r"(?:[.!?…:»)]\s*|\n\s*)$")


def a_frasi(st):
    """Ogni ramo comincia dopo la fine di una frase e finisce con la fine di una frase: si può registrare a pezzi."""
    prima = ""
    for k, (tipo, x) in enumerate(st):
        if tipo == "fisso":
            prima = x
            continue
        if prima and not FINE_FRASE.search(prima):
            return False
        for _, t in x:
            if t.strip() and not FINE_FRASE.search(t) and k + 1 < len(st):
                return False
        prima = "."
    return True


def spezza(testo):
    """Le prese di un testo: [(condizione, testo)]. Senza scelte, una presa. Se i rami sono frasi intere, una
    presa per ogni parte fissa e per ogni ramo (il gioco le monta: «None» per le parti che ci sono sempre);
    se un ramo sta dentro una frase, le frasi intere, una per combinazione (fino a otto)."""
    st = struttura(testo)
    scelte = [x for tipo, x in st if tipo == "scelta"]
    if not scelte:
        return [(None, testo)]
    combinazioni = 1
    for x in scelte:
        combinazioni *= len(x)
    if a_frasi(st) or combinazioni > 8:
        out = []
        for tipo, x in st:
            if tipo == "fisso":
                out.append((None, x))
            else:
                out += [(c, t) for c, t in x if t.strip()]
        return out
    import itertools
    out = []
    for scelta in itertools.product(*scelte):
        it = iter(scelta)
        testo_v, cond_v = "", []
        for tipo, x in st:
            if tipo == "fisso":
                testo_v += x
            else:
                c, t = next(it)
                testo_v += t
                cond_v.append(c)
        out.append(("intera: " + "; ".join(cond_v), " ".join(testo_v.split(" ")).replace("  ", " ")))
    return out


def segmenti(testo, parlante, ponte, frammenti):
    """Il testo diviso in segmenti: (tipo, testo, chi). I tipi: william, citazione (William legge o dice fra «»),
    voce (un’altra voce, già registrata), breve (variante breve di una registrazione), servizio, etichetta,
    registro."""
    t = testo.replace("’", "'")
    tipo = ["william"] * len(t)
    chi = [""] * len(t)

    def segna(a, b, ty, c=""):
        for k in range(a, b):
            tipo[k], chi[k] = ty, c

    # le virgolette intere, e quelle che un ramo «[se]» lascia aperte o chiuse a metà
    citate = list(re.finditer(r"«[^»]*»", t))
    m0 = re.match(r"^[^«]*?»", t)
    m1 = re.search(r"«[^»]*$", t)
    for m in citate + [x for x in (m0, m1) if x]:
        if parlante:
            segna(m.start(), m.end(), "voce", PARLANTI.get(parlante, parlante))
            continue
        p = parole(m.group(0))
        if not p:
            segna(m.start(), m.end(), "citazione")
            continue
        esatta = next((n for n, f in frammenti if f == p), None)
        # una variante breve: le sue parole, in ordine, dentro un frammento registrato (anche saltandone)
        dentro = next((n for n, f in frammenti if len(p) >= 3 and sottosequenza(p, f)), None)
        if esatta:
            segna(m.start(), m.end(), "voce", esatta)
        elif dentro:
            segna(m.start(), m.end(), "breve", dentro)
        else:
            segna(m.start(), m.end(), "citazione")
    for m in ETICHETTA.finditer(t):
        segna(m.start(1), m.end(), "etichetta")
    for nome, ty, cerca in ponte._SERVIZIO_CERCA:
        i = t.find(cerca)
        while i >= 0:
            if not (ty == "protezione" and ponte._ARTICOLO.search(t[max(0, i - 12):i])):
                # la matrice si porta via anche la sua parentesi chiusa
                fine = i + len(cerca) + (1 if ty == "matrice" and t[i + len(cerca):i + len(cerca) + 1] == ")" else 0)
                segna(i, fine, "servizio", nome)
            i = t.find(cerca, i + 1)
    for m in MATRICE.finditer(t):
        segna(m.start(), m.end(), "servizio", "la matrice")
    m = REGISTRO.search(t)
    if m:
        segna(m.start(), m.end(), "registro")
    out = []
    for k, c in enumerate(testo):
        if out and out[-1][0] == tipo[k] and out[-1][2] == chi[k]:
            out[-1][1] += c
        else:
            out.append([tipo[k], c, chi[k]])
    # la punteggiatura che segue un segmento d'altri resta con lui («PROTEZIONE VITALE. Con l'aria…»)
    for k in range(1, len(out)):
        if out[k][0] == "william" and out[k - 1][0] not in ("william", "citazione", "spazio"):
            m = re.match(r"^[.,:;]+", out[k][1])
            if m:
                out[k - 1][1] += m.group(0)
                out[k][1] = out[k][1][m.end():]
    out = [x for x in out if x[1]]
    # i soli spazi fra due segmenti non sono una battuta: restano spazi
    for s_ in out:
        if s_[0] == "william" and not s_[1].strip():
            s_[0] = "spazio"
    return [tuple(s_) for s_ in out]


def di_william(segs):
    return "".join(s[1] for s in segs if s[0] in ("william", "citazione")).strip()


def oggetto(p):
    """La cosa di cui parla una presa: per dividere i blocchi lunghi."""
    if p["tipo"] in ("battuta", "opzione"):
        return "nodo " + p["soggetto"].split()[-1]
    if p["tipo"] == "finale":
        return p["id"]
    s = p["soggetto"] or p["tipo"]
    if p["tipo"] == "risposta":
        verbo, _, resto = s.partition(" ")
        resto = re.split(r" (?:sul|sulla|sullo|sui|sulle|sugli|sull'|con|al|alla|allo|nel|nella) ", resto)[0]
        s = resto or verbo
    return re.sub(r"^(?:il|lo|la|i|gli|le|l')\s*", "", s)


def dividi(blocco):
    """I blocchi da dare all'attore. Un dialogo, nodo per nodo; i finali, uno per uno; un blocco lungo, in pezzi
    fino a MAX_PRESE prese, senza dividere le prese di una stessa cosa."""
    prese = blocco["prese"]
    dialogo = all(p["tipo"] in ("battuta", "opzione") for p in prese)
    finali = any(p["tipo"] == "finale" for p in prese)
    if len(prese) <= MAX_PRESE and not finali and not (dialogo and len(prese) > 6):
        return [blocco]
    gruppi = []
    for p in prese:
        o = oggetto(p)
        if gruppi and gruppi[-1][0] == o and p["tipo"] != "finale":
            gruppi[-1][1].append(p)
        else:
            gruppi.append((o, [p]))
    if dialogo or finali:
        return [dict(blocco, prese=q, cosa=o) for o, q in gruppi]
    uniti = []
    for o, q in gruppi:
        if uniti and len(uniti[-1][1]) + len(q) <= MAX_PRESE:
            uniti[-1][1].extend(q)
            uniti[-1][2].append(o)
        else:
            uniti.append((o, list(q), [o]))
    return [dict(blocco, prese=q, cosa=", ".join(os_)) for _, q, os_ in uniti]


def chiave(t):
    return " ".join(t.replace("’", "'").split())


def leggi_capitolo(nome):
    """Le righe con testo di un modulo, con il blocco (dai commenti) a cui appartengono."""
    righe = open(os.path.join(STORIA, nome), encoding="utf-8").read().split("\n")
    sezione, sotto, note = "", "", []
    out = []
    k = 0
    while k < len(righe):
        r = righe[k].strip()
        if r.startswith("# ===") and k + 2 < len(righe) and righe[k + 2].strip().startswith("# ==="):
            titolo = righe[k + 1].strip("# ").strip()
            if k > 5:
                sezione, sotto, note = titolo, "", []
            k += 3
            continue
        m = re.match(r"^# ---+ (.+?) -*$", r)
        if m:
            sotto, note = m.group(1).strip(), []
            k += 1
            continue
        if r.startswith("#"):
            note.append(r.lstrip("# ").strip())
            k += 1
            continue
        if '"' in r:
            out.append((k + 1, sezione, sotto, list(note), r))
        k += 1
    return out


def classifica(r):
    """(tipo, soggetto/azione, condizione, testo, parlante) o None se la riga non porta testo a schermo."""
    m = EVENTO.match(r) or FINALE.match(r)
    if m and re.search(r": (?:vinci|perdi) \"", r):
        return ("finale", "", m.group(1), STRINGA.search(r, m.end() - 1).group(1), None)
    m = BATTUTA.match(r)
    if m:
        return ("battuta", f"{m.group(1)} · {m.group(2)}", m.group(4), m.group(3), m.group(1).lower())
    m = OPZIONE.match(r)
    if m:
        return ("opzione", f"nodo {m.group(1)}", m.group(3), m.group(2), None)
    for tipo, rx in (("descrizione", DESCRIZIONE), ("risposta", RISPOSTA), ("evento", EVENTO), ("demone", DEMONE),
                     ("evento", FINALE), ("dopo", DOPO)):
        m = rx.match(r)
        if m:
            s = STRINGA.search(r, m.end() - 1)
            if tipo == "descrizione":
                return (tipo, m.group(1), m.group(2), s.group(1), None)
            if tipo == "risposta":
                return (tipo, m.group(1), m.group(2), s.group(1), None)
            if tipo == "demone":
                return (tipo, "ogni turno", m.group(1), s.group(1), None)
            if tipo == "dopo":
                return (tipo, m.group(1), m.group(2), s.group(1), None)
            return (tipo, "", m.group(1), s.group(1), None)
    return None


def main():
    ponte, frammenti = carica_ponte()
    viste = {}
    capitoli = []
    tot = {"prese": 0, "uguali": 0, "parole": 0, "parlato": 0, "citazione": 0}
    for nome, sigla, titolo in CAPITOLI:
        blocchi, corrente, n = [], None, 0
        for riga, sezione, sotto, note, r in leggi_capitolo(nome):
            c = classifica(r)
            if not c:
                continue
            tipo, soggetto, cond, testo, parlante = c
            if tipo == "opzione" and (testo.startswith("[") or testo in AZIONI):
                continue
            testo = testo.replace("\\n", "\n").replace('\\"', '"')
            pezzi = []
            for cp, t in spezza(testo):
                if tipo == "opzione":
                    segs = [("parlato", t, "")]
                else:
                    segs = segmenti(t, parlante, ponte, frammenti)
                w = di_william([(("william" if s[0] == "parlato" else s[0]), s[1], s[2]) for s in segs])
                pezzi.append({"condizione": umana(cp), "segmenti": segs, "william": w})
            if not any(p["william"] for p in pezzi):
                continue
            sezione = sezione or SEZIONI.get(nome, "")
            titolo_blocco = sezione + (f" · {sotto}" if sotto else "")
            if corrente is None or corrente["titolo"] != titolo_blocco:
                corrente = {"id": f"{sigla}-{len(blocchi) + 1:02d}", "titolo": titolo_blocco, "sezione": sezione,
                            "sotto": sotto, "note": note, "prese": []}
                blocchi.append(corrente)
            n += 1
            presa = {"id": f"{sigla}-{n:03d}", "tipo": tipo, "soggetto": soggetto, "condizione": umana(cond),
                     "riga": f"{nome}:{riga}", "pezzi": []}
            lettere = "abcdefghijklmnopqrstuvwxyz"
            utili = [p for p in pezzi if p["william"]]
            for j, p in enumerate(pezzi):
                if p["william"]:
                    pid = presa["id"] + (lettere[len([q for q in pezzi[:j] if q["william"]])] if len(utili) > 1 else "")
                    k = chiave(p["william"])
                    if k in viste:
                        p["uguale"] = viste[k]
                        tot["uguali"] += 1
                    else:
                        viste[k] = pid
                        tot["prese"] += 1
                        tot["parole"] += len(re.findall(r"\w+", p["william"]))
                        tot["parlato" if tipo == "opzione" else "william"] = tot.get("parlato" if tipo == "opzione" else "william", 0) + 1
                        tot["citazione"] += sum(len(re.findall(r"\w+", s[1])) for s in p["segmenti"] if s[0] == "citazione")
                    p["id"] = pid
                presa["pezzi"].append(p)
            corrente["prese"].append(presa)
        divisi = [b for blocco in blocchi for b in dividi(blocco)]
        for k, b in enumerate(divisi):
            b["id"] = f"{sigla}-{k + 1:02d}"
        capitoli.append({"sigla": sigla, "titolo": titolo, "file": nome, "blocchi": divisi})
    os.makedirs(USCITA, exist_ok=True)
    impronta = hashlib.sha256("".join(open(os.path.join(STORIA, f), encoding="utf-8").read()
                                      for f, _, _ in CAPITOLI).encode()).hexdigest()
    dati = {"impronta_fav": impronta, "totali": tot, "capitoli": capitoli}
    if "--stato" in sys.argv:
        for c in capitoli:
            print(f"{c['sigla']}  {len(c['blocchi']):3} blocchi  {sum(len(b['prese']) for b in c['blocchi']):4} prese  {c['titolo']}")
        print(tot)
        return
    with open(os.path.join(USCITA, "copione.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(dati, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"doppiaggio/william/copione.json: {sum(len(c['blocchi']) for c in capitoli)} blocchi, {tot}")


if __name__ == "__main__":
    main()
