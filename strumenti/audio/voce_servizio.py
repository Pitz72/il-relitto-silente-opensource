# La voce di servizio (documento 35, §11): la tuta e il gioco che parlano a chi gioca. Come nel Viaggiatore (la voce
# «Kira» di Google AI Studio, Gemini 3.8 Flash TTS, `strumenti/doppiaggio.py` del Viaggiatore), i testi si ricavano dal
# gioco, non si scrivono a mano: se un testo cambia, si rigenera il blocco.
#
# Che cosa dice la voce di servizio: quello che sullo schermo ha già uno stile a parte (app/src/gioco/lamina/
# grammatica.ts), cioè
#   - i suggerimenti fra parentesi, con il comando in maiuscolo: «(Per ascoltarla: ASCOLTA LA SCATOLA NERA. …)»;
#   - PROTEZIONE VITALE, la tuta;
#   - le scritte dei display («MATERIALE NON IN ARCHIVIO», «SOTTO 30, PROTEZIONE VITALE») e le letture dello scanner
#     (le righe «ANALISI…», «LETTURA:», «IDENTIFICAZIONE…», «DATAZIONE…», «Lunghezza:…»);
#   - le etichette dello scanner, ‹FLORA DI XYLOS›;
#   - la matrice di traduzione con la sua percentuale («Matrice di traduzione: 18%»; quello che William aggiunge nella
#     stessa parentesi resta suo);
#   - la riga del registro di bordo che chiude i finali («Registro di bordo, TSC-1972. Operatore W. T. Eriksonn. …»):
#     la dice il computer di bordo della Santa Maria, con la stessa voce (l'autore, 7 novembre 2026: «Lo legge la voce
#     di servizio, la voce del computer»), perché William il suo nome non lo dice mai.
# Le parti nuove, che non hanno ancora il loro file (doppiaggio/servizio/tagli.json), vanno anche in
# servizio-nuove.txt: si genera soltanto quello, con la stessa voce e la stessa descrizione.
# Il resto, compreso il numero dell'aria che William legge sul visore, è di William (Leonardo).
#
# Ne escono, in doppiaggio/servizio/:
#   servizio.txt    il testo da incollare in AI Studio: una parte per riga, `<long pause>` fra l'una e l'altra (serve a
#                   tagliare l'audio nei punti giusti). Le parole in maiuscolo sono abbassate, perché la voce le
#                   leggerebbe come enfasi; i nomi tornano con l'iniziale maiuscola.
#   manifest.json   per ogni parte: l'id (l'impronta del testo per la voce), il testo per la voce, il testo com'è nel
#                   gioco, il tipo, da dove viene; nello stesso ordine del blocco.
#
#   python strumenti/audio/voce_servizio.py           scrive i due file
#   python strumenti/audio/voce_servizio.py --stato   le parti, le parole, i minuti
import hashlib
import json
import os
import re
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
USCITA = os.path.join(RADICE, "doppiaggio", "servizio")
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))

MAIUSCOLA = "A-ZÀÈÉÌÒÙ"
# I nomi che nel maiuscolo tornano con l'iniziale maiuscola.
NOMI = {"YUSUF": "Yusuf", "XYLOS": "Xylos", "ANZIANO": "Anziano", "SANTA": "Santa", "MARIA": "Maria",
        "TSC-1972": "TSC 1972", "AURORA-7": "Aurora 7"}
# La riga del registro di bordo, in fondo ai finali.
REGISTRO = re.compile(r"^Registro di bordo, TSC-1972\..*$")
ORDINE = ["protezione", "schermo", "lettura", "etichetta", "matrice", "suggerimento", "registro"]
# Dentro le letture dello scanner, le frasi che sono di William: restano a lui, e la lettura si divide lì.
DI_WILLIAM = ["Provo con un'altra, e un'altra ancora:",
              "il calcolo parte, si ferma, riparte. Al terzo tentativo si arrende e scrive"]
# Quanto può durare un blocco: AI Studio ne fa circa sei minuti a richiesta; si sta sotto, con margine.
MAX_MINUTI = 5.0
# I valori che il gioco può scrivere al posto dei segnaposto: la matrice va a 4, 18, 75 e 100 (traduci.fav).
VALORI = {"traduzione": [4, 18, 75, 100]}
NUMERI = {4: "quattro", 18: "diciotto", 75: "settantacinque", 100: "cento"}
# Le righe che sono una lettura dello scanner o del computer di bordo (grammatica.ts, LETTURA).
LETTURA = re.compile(r"^(?:ANALISI\b|LETTURA:|IDENTIFICAZIONE\b|DATAZIONE\b|Lunghezza: )")
# I segni dentro una riga (grammatica.ts, SEGNI), con il tipo per la voce.
MATRICE = re.compile(r"\((?:Matrice di traduzione|MATRICE DI TRADUZIONE):[^)]*\)")
ETICHETTA = re.compile(r"‹[^›]*›")
SCHERMO = re.compile(r"SOTTO 30, PROTEZIONE VITALE|PROTEZIONE VITALE|MATERIALE NON IN ARCHIVIO|CHIUSURA RIFIUTATA|"
                     r"CANALE APERTO DA REMOTO|DECODIFICA COMPLETATA|"
                     rf"(?:ANALISI|IDENTIFICAZIONE|LETTURA|DATAZIONE)(?:\s+(?:[{MAIUSCOLA}]+['’])?[{MAIUSCOLA}]{{2,}})*")
# Una parentesi con dentro un maiuscolo di almeno due lettere: un suggerimento.
PARENTESI = re.compile(r"\(([^()]*)\)")
MAIUSCOLO = re.compile(rf"[{MAIUSCOLA}]{{2,}}")


def per_la_voce(testo):
    """Il testo come lo dice la voce: le parole in maiuscolo abbassate (i nomi con l'iniziale), le virgolette
    tipografiche, la prima lettera maiuscola."""
    def abbassa(m):
        w = m.group(0)
        return NOMI.get(w, w.lower())
    # le parole in maiuscolo (senza apostrofi né punti: «L'ANZIANO» è «L» + «ANZIANO»), e la lettera sola
    # davanti a un apostrofo («L'», «D'»); «L.V.» resta com'è
    t = re.sub(rf"[{MAIUSCOLA}][{MAIUSCOLA}0-9\-]+|[{MAIUSCOLA}](?=['’][{MAIUSCOLA}])", abbassa, testo)
    t = t.replace("'", "’").replace("‹", "").replace("›", "")
    # le percentuali della matrice in lettere, come le dice la voce
    t = re.sub(r"\b(\d+)%", lambda m: f"{NUMERI.get(int(m.group(1)), m.group(1))} per cento", t)
    t = " ".join(t.split()).strip()
    # dopo un punto, la maiuscola (le letture dello scanner: «… fuori produzione. Identificazione missione …»)
    t = re.sub(r"([.!?]\s+)([a-zàèéìòù])", lambda m: m.group(1) + m.group(2).upper(), t)
    if t and not t.endswith((".", "!", "?", "…", ":")):
        t += "."
    return t[0].upper() + t[1:] if t else t


def testi_del_gioco():
    """Tutti i testi d'autore del gioco, con la loro provenienza (come il compilatore li controlla)."""
    import ponte  # noqa: E402
    from strutture import testi_di_descrizione  # noqa: E402
    ponte.rel_compila(os.path.join(RADICE, "relitto-silente", "relitto.fav"))
    m = ponte._base
    out = []
    for ent in list(m.stanze.values()) + list(m.oggetti.values()):
        nome = getattr(ent, "nome", "?")
        out += [(f"descrizione di {nome}", t) for t in testi_di_descrizione(ent.descrizione)]
        for _, t in ent.descrizioni_condizionali:
            out += [(f"descrizione di {nome}", x) for x in testi_di_descrizione(t)]
    out += [("regola", r.risposta) for r in m.regole]
    out += [("evento", e.risposta) for e in m.eventi] + [("ogni turno", d.risposta) for d in m.demoni]
    # i testi dei finali: il messaggio della fine della partita
    for d in list(m.demoni) + list(m.eventi):
        for c in getattr(d, "conseguenze", ()) or ():
            if type(c).__name__ == "ConseguenzaFinePartita" and isinstance(getattr(c, "messaggio", None), str):
                out.append(("finale", c.messaggio))
    for chiave, n in m.dialogo_nodi.items():
        out.append((f"dialogo {chiave}", n.battuta))
        out += [(f"dialogo {chiave}", t) for _, t in n.battute_condizionali]
    return [(dove, t) for dove, t in out if isinstance(t, str) and t]


def pezzi_del_testo(t):
    """Il testo diviso nei rami delle parti condizionali: ogni ramo si sente da solo."""
    for pezzo in re.split(r"\[se [^\]]*\]|\[altrimenti\]|\[fine\]", t):
        yield from pezzo.split("\n")


def parti_di_servizio():
    viste = {}
    for dove, testo in testi_del_gioco():
        for riga in pezzi_del_testo(testo):
            riga = riga.strip()
            if not riga:
                continue
            trovate = []
            if REGISTRO.match(riga):
                trovate.append(("registro", riga))
            elif LETTURA.match(riga):
                pezzi = [riga]
                for frase in DI_WILLIAM:
                    pezzi = [x for pezzo in pezzi for x in pezzo.split(frase)]
                for pezzo in pezzi:
                    pezzo = pezzo.strip()
                    if not pezzo:
                        continue
                    # una scritta dello schermo da sola resta una scritta dello schermo
                    if SCHERMO.fullmatch(pezzo.rstrip(".")):
                        trovate.append(("schermo", pezzo.rstrip(".")))
                    else:
                        trovate.append(("lettura", pezzo))
            else:
                for m in MATRICE.finditer(riga):
                    dentro = m.group(0)[1:-1]
                    # la lettura della matrice finisce con la percentuale (o è tutta una scritta di schermo); il resto
                    # della parentesi è di William
                    lettura = re.match(r"[^%]*%", dentro)
                    tutta_schermo = not re.search(r"[a-zàèéìòù]{2,}", re.sub(r"\[\w+\]", "", dentro.replace("Matrice di traduzione", "")))
                    trovate.append(("matrice", dentro if tutta_schermo or not lettura else lettura.group(0)))
                for m in ETICHETTA.finditer(riga):
                    trovate.append(("etichetta", m.group(0)))
                senza_parentesi = PARENTESI.sub(lambda m: " " * len(m.group(0)), riga)
                for m in SCHERMO.finditer(senza_parentesi):
                    tipo = "protezione" if m.group(0) == "PROTEZIONE VITALE" else "schermo"
                    trovate.append((tipo, m.group(0)))
                for m in PARENTESI.finditer(riga):
                    dentro = m.group(1)
                    if MATRICE.fullmatch(m.group(0)) or not MAIUSCOLO.search(dentro):
                        continue
                    if re.search(r"intraducibile:", dentro):
                        continue
                    trovate.append(("suggerimento", dentro))
            espanse = []
            for tipo, originale in trovate:
                m = re.search(r"\[(\w+)\]", originale)
                if not m:
                    espanse.append((tipo, originale))
                    continue
                if m.group(1) not in VALORI:
                    raise SystemExit(f"un segnaposto dentro una parte di servizio, da spezzare: {originale}")
                # una parte per valore; la decodifica completa c'è solo al cento per cento
                valori = [100] if "DECODIFICA COMPLETATA" in originale else VALORI[m.group(1)]
                espanse += [(tipo, originale.replace(m.group(0), str(v))) for v in valori]
            for tipo, originale in espanse:
                voce = per_la_voce(originale)
                if voce not in viste:
                    viste[voce] = {"id": hashlib.sha1(("servizio|" + voce).encode()).hexdigest()[:12], "voce": voce,
                                   "gioco": originale, "tipo": tipo, "da": []}
                if dove not in viste[voce]["da"]:
                    viste[voce]["da"].append(dove)
    # i tipi nuovi vanno in fondo: così le parti che hanno già un file non cambiano numero
    return sorted(viste.values(), key=lambda p: (ORDINE.index(p["tipo"]), p["voce"]))


def parole(t):
    return len(re.findall(r"\w[\w’]*", t))


def main():
    parti = parti_di_servizio()
    n = sum(parole(p["voce"]) for p in parti)
    # il passo di Kira nel Viaggiatore: circa 150 parole al minuto, più la pausa lunga fra le parti
    minuti = n / 150 + len(parti) * 1.2 / 60
    if "--stato" in sys.argv:
        for tipo in ORDINE:
            q = [p for p in parti if p["tipo"] == tipo]
            print(f"{tipo:13} {len(q):3} parti, {sum(parole(p['voce']) for p in q):4} parole")
        print(f"in tutto: {len(parti)} parti, {n} parole, circa {minuti:.1f} minuti")
        return
    # i blocchi: uno solo, se sta sotto il tetto; se no, più blocchi di lunghezza simile (servizio-a, servizio-b…)
    quanti = max(1, -(-int(minuti * 10) // int(MAX_MINUTI * 10)))
    os.makedirs(USCITA, exist_ok=True)
    for vecchio in os.listdir(USCITA):
        if vecchio.startswith("servizio") and vecchio.endswith(".txt") and vecchio != "servizio-nuove.txt":
            os.remove(os.path.join(USCITA, vecchio))
    blocchi = {}
    for k in range(quanti):
        nome = "servizio" if quanti == 1 else f"servizio-{chr(97 + k)}"
        blocchi[nome] = parti[k * len(parti) // quanti:(k + 1) * len(parti) // quanti]
        with open(os.path.join(USCITA, nome + ".txt"), "w", encoding="utf-8", newline="\n") as f:
            f.write("".join(p["voce"] + " <long pause>\n" for p in blocchi[nome]))
    with open(os.path.join(USCITA, "manifest.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump({"voce": "servizio", "blocchi": {b: [p["id"] for p in q] for b, q in blocchi.items()}, "parti": parti},
                  f, ensure_ascii=False, indent=1)
        f.write("\n")
    for nome, q in blocchi.items():
        m = sum(parole(p["voce"]) for p in q) / 150 + len(q) * 1.2 / 60
        print(f"doppiaggio/servizio/{nome}.txt: {len(q)} parti, circa {m:.1f} minuti")
    # le parti che non hanno ancora un file: da generare da sole
    tagli = os.path.join(USCITA, "tagli.json")
    fatte = set(json.load(open(tagli, encoding="utf-8"))["parti"]) if os.path.exists(tagli) else set()
    nuove = [p for p in parti if p["id"] not in fatte]
    if nuove and fatte:
        with open(os.path.join(USCITA, "servizio-nuove.txt"), "w", encoding="utf-8", newline="\n") as f:
            f.write("".join(p["voce"] + " <long pause>\n" for p in nuove))
        print(f"doppiaggio/servizio/servizio-nuove.txt: {len(nuove)} parti nuove, da generare")


if __name__ == "__main__":
    main()
