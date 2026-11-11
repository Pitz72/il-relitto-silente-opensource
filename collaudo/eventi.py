# eventi.py — gli stati e gli eventi che il ponte manda al suono
# (app/src/motore/ponte.py: _suono_stati, _rileva; bibbia sonora, §1.6 e §2.4).
#
# Uso (dalla radice del progetto):
#   python collaudo/eventi.py
#   python collaudo/eventi.py -v        in più, il conto di ogni evento
#
# Che cosa controlla:
#   1. a ogni turno di ogni percorso il ponte manda tutti gli stati del suono,
#      e gli eventi hanno la loro forma;
#   2. ogni percorso che finisce la partita manda l'evento «finale» giusto: quello
#      che dice il testo del gioco (la frase del suo finale), e il nome del
#      percorso, se è uno dei sei finali;
#   3. in «Vivi» gli eventi principali arrivano nell'ordine della storia;
#   4. ogni evento della tabella del ponte scatta almeno una volta: sui percorsi,
#      o sui rami scritti qui per quelli che nessun percorso tocca (il bengala
#      acceso, il reattore toccato, la radio, l'archivio forzato, la ripresa
#      dopo un ANNULLA alla fine…);
#   5. i segni a sorte che si riconoscono dal testo sono ancora nel gioco, e così
#      le battute dell'Anziano con la voce (parola per parola), quelle delle voci
#      della nave, di Yusuf e di L.V., e le parti della voce di servizio; la voce di
#      servizio ha un file per parte, e la tabella del ponte, il manifest e il gioco
#      dicono le stesse cose;
#   6. il ponte non cambia la partita: lo stesso percorso giocato dal ponte e
#      giocato dal motore da solo arriva alla stessa impronta;
#   7. il congedo dell'Anziano non si disfa (revisione 37, G3): per il gioco la
#      fuga comincia al gesto «[Chiudi gli occhi e lascia andare.]», per lo
#      schermo e per il suono quando il colloquio finisce; a occhi chiusi non
#      c'è il pulsante che chiude la conversazione, e chi la chiude scrivendo
#      trova la stanza della fuga; chi parla all'Anziano nella fuga ha una
#      frase di racconto, e il seme resta dov'è.

import argparse
import collections
import glob
import json
import os
import sys

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(QUI)
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))
sys.path.insert(0, QUI)

import ponte                                      # noqa: E402
from compilatore import compila_mondo             # noqa: E402
from esploratore import Partita                   # noqa: E402
from regressioni import leggi_attese              # noqa: E402

STORIA = os.path.join(RADICE, "relitto-silente", "relitto.fav")

# «Vivi», nell'ordine in cui la storia li fa accadere.
ORDINE_VIVI = ("scansione_lunga", "accostamento", "arpioni", "vestizione", "kit", "boccaporto",
               "giuntura_trovata", "giuntura_tagliata", "discesa", "varco_richiuso", "pannello",
               "porta_interna", "primo_contatto", "teca_serra", "seme_preso", "grande_porta",
               "postazione", "porta_tonda", "dialogo", "fuga", "groviglio_desto", "casco_tolto", "finale")

# Il finale letto dal testo che il gioco scrive (finali.fav), e non dalla regola del ponte: una frase
# per finale. «La prima nota» è «Vivi» con una frase in più, e si cerca per prima. Così una regola del
# ponte rimasta indietro non passa (revisione 37, G2: dal 5 novembre il percorso prima-nota-in-stiva
# mandava «vivi», e questa prova accettava qualunque finale dai percorsi che non portano il nome di uno).
SEGNO_DEL_FINALE = (
    ("prima-nota", "Due cose che non si sono mai conosciute"),
    ("vivi", "Rotta ripresa. Carico: nessuno."),
    ("stiva-piena", "Destinazione: Magazzino Quattro."),
    ("doppio-fondo", "Nient'altro da dichiarare."),
    ("mani-vuote", "Nessun evento da registrare."),
)


def finale_dal_testo(testo, esito):
    """Il finale che il gioco ha scritto: la morte è «Due lettere», gli altri hanno la loro frase."""
    if esito == "persa":
        return "due-lettere"
    testo = testo.replace("’", "'")
    return next((nome for nome, segno in SEGNO_DEL_FINALE if segno in testo), None)


def segni_dei_finali():
    """Le frasi qui sopra sono ancora in finali.fav, ognuna nei finali che deve riconoscere."""
    with open(os.path.join(RADICE, "relitto-silente", "finali.fav"), encoding="utf-8") as f:
        regole = [r for r in f.read().splitlines() if ": vinci " in r]
    problemi = []
    for nome, segno in SEGNO_DEL_FINALE:
        quante = sum(segno in r for r in regole)
        # la riga del registro di «Vivi» chiude anche «La prima nota»
        attese = 2 if nome == "vivi" else 1
        if quante != attese:
            problemi.append(f"la frase di «{nome}» («{segno}») è in {quante} finali di finali.fav, attesi {attese}")
    return problemi


# Gli eventi che scattano per passaggio di stato, per comando o per segno a sorte,
# più quelli che il ponte ricava da sé (stanza, aria, soglie, contatori, dialogo).
DERIVATI = ("inizio", "stanza", "boccaporto", "rientro", "discesa", "groviglio_prende", "casco_tolto", "voci",
            "dialogo", "dialogo_fine", "nodo", "chiave", "eco", "risonanza", "traccia", "taglio",
            "risuonata", "matrice", "traduzione_completa", "aria", "ambra", "ipossia", "protezione",
            "protezione_fine", "protezione_fuga", "attrezzo", "finale", "ripresa")

# I rami: (nome, il percorso da cui partire, fin dove giocarlo, i comandi, gli eventi attesi).
RAMI = (
    ("la radio", "tutto.txt", lambda m: True, ["ascolta la radio"], ["radio"]),
    ("il reattore toccato", "tutto.txt", lambda m: m.posizione_giocatore == "sala macchine",
     ["tocca il reattore"], ["reattore_toccato"]),
    ("il risuonatore toccato", "tutto.txt", lambda m: m.posizione_giocatore == "vestibolo delle gole",
     ["tocca il risuonatore"], ["risuonatore_toccato"]),
    ("il bengala nelle teche", "tutto.txt",
     lambda m: m.posizione_giocatore == "sala delle teche" and "bengala" in m.inventario,
     ["accendi il bengala", "aspetta", "aspetta", "aspetta"], ["bengala_acceso", "bengala_spento"]),
    # nessun percorso entra nell'arca della memoria prima dell'energia: ci si va dal corridoio
    ("l'archivio forzato", "tutto.txt",
     lambda m: m.posizione_giocatore == "corridoio principale" and m.variabili.get("energia") == "assente",
     ["nord", "ovest", "nord", "usa la taglierina sul terminale"], ["archivio_forzato"]),
    # ANNULLA dopo la morte: per il suono la partita riprende, come da un caricamento (revisione 25, G2)
    ("annullare un finale", "due-lettere.txt", lambda m: m.stato_partita != "in_corso", ["annulla"], ["ripresa"]),
)


def _nomi_della_tabella():
    nomi = {n for n, *_ in ponte._PASSAGGI} | set(ponte._PER_COMANDO.values()) | set(ponte.SEGNI_A_SORTE)
    return nomi | set(DERIVATI)


def gioca(percorso, conta):
    """Gioca un percorso dal ponte; restituisce (problemi, eventi in ordine, finale, esito, il testo
    dell'ultimo turno)."""
    problemi, ordine, finale = [], [], None
    chiavi = None
    dati = json.loads(ponte.rel_percorso(percorso))
    turno = json.loads(ponte.rel_avvia(1))
    for cmd in [None] + dati["comandi"]:
        if cmd is not None:
            if turno["esito"] != "in_corso":
                break
            turno = json.loads(ponte.rel_comando(cmd))
        suono = turno["suono"]
        if chiavi is None:
            chiavi = set(suono["stati"])
        elif set(suono["stati"]) != chiavi:
            problemi.append(f"«{cmd}»: cambiano le chiavi degli stati del suono")
        for e in suono["eventi"]:
            if not isinstance(e, dict) or not isinstance(e.get("evento"), str):
                problemi.append(f"«{cmd}»: un evento senza nome")
                continue
            conta[e["evento"]] += 1
            ordine.append(e["evento"])
            if e["evento"] == "finale":
                finale = e.get("finale")
    testo = " ".join(str(e.get("testo", "")) for e in turno["eventi"] if isinstance(e, dict))
    return problemi, ordine, finale, turno["esito"], testo


def sottosequenza(attesa, ordine):
    it = iter(ordine)
    mancanti = [e for e in attesa if e not in it]
    return mancanti


def ramo(nome, percorso, fino, comandi, attesi, conta):
    dati = json.loads(ponte.rel_percorso(os.path.join(QUI, percorso)))
    ponte.rel_avvia(1)
    for cmd in dati["comandi"]:
        if fino(ponte._mondo):
            break
        ponte.rel_comando(cmd)
    else:
        # il punto di partenza può essere la fine stessa del percorso (un finale)
        if not fino(ponte._mondo):
            return f"{nome}: il percorso {percorso} non arriva mai al punto di partenza"
    visti = []
    for cmd in comandi:
        turno = json.loads(ponte.rel_comando(cmd))
        visti += [e["evento"] for e in turno["suono"]["eventi"]]
    for e in visti:
        conta[e] += 1
    mancanti = [e for e in attesi if e not in visti]
    return f"{nome}: non scattano {', '.join(mancanti)} (scattano {', '.join(visti)})" if mancanti else None


# La frase di chi guarda l'Anziano nella fuga (ponte.fav): è anche quella di chi gli parla.
NON_C_E_PIU = "Non c'è più. La sua luce è dentro il seme."


def congedo():
    """Il congedo dell'Anziano, sul percorso di «Vivi» (revisione 37, G3)."""
    problemi = []
    comandi = json.loads(ponte.rel_percorso(os.path.join(QUI, "vivi.txt")))["comandi"]
    gesto = comandi.index("[Chiudi gli occhi e lascia andare.]")

    def fino(n):
        turno = json.loads(ponte.rel_avvia(1))
        for cmd in comandi[:n]:
            turno = json.loads(ponte.rel_comando(cmd))
        return turno

    def nomi(turno):
        return [e["evento"] for e in turno["suono"]["eventi"]]

    def nella_fuga():
        m = ponte._mondo
        return (m.variabili.get("fuga") == "iniziata" and m.oggetti["seme"].posizione == "santuario centrale"
                and "scuro" in m.oggetti["seme"].proprieta and "desto" in m.oggetti["groviglio"].proprieta)

    # a occhi chiusi: per il gioco la fuga c'è già, per chi gioca non ancora; e non c'è il pulsante per uscire
    fino(gesto)
    for cmd in comandi[gesto:gesto + 2]:
        t = json.loads(ponte.rel_comando(cmd))
        if not nella_fuga():
            problemi.append(f"dopo «{cmd}» per il gioco la fuga non è cominciata")
        if t["stato"]["nodo"] not in ponte.NODI_SENZA_USCITA:
            problemi.append(f"dopo «{cmd}» il nodo è «{t['stato']['nodo']}», non uno di quelli senza uscita")
        if t["stato"]["fuga"] != "lontana" or t["stato"]["atto"] == 5 or t["suono"]["stati"]["fuga"] != "lontana":
            problemi.append(f"dopo «{cmd}» lo schermo o il suono sono già nella fuga")
        if t["suono"]["stati"]["seme"] != "vivente" or t["suono"]["stati"]["groviglio"] != "quieto":
            problemi.append(f"dopo «{cmd}» per il suono il seme o il groviglio sono già cambiati")
        if {"fuga", "seme_spento", "groviglio_desto"} & set(nomi(t)):
            problemi.append(f"dopo «{cmd}» il suono della fuga è già partito")
        if any(s["comando"] == "esci" for s in t["pulsanti"]["scelte"]):
            problemi.append(f"dopo «{cmd}» c'è ancora il pulsante che chiude la conversazione")
        if any(a["id"] == "fuga" for a in ((t.get("cronaca") or {}).get("nuova") or {}).get("appunti", [])):
            problemi.append(f"dopo «{cmd}» il diario ha già l'appunto della fuga")
    # gli occhi aperti: tutto insieme, come prima
    t = json.loads(ponte.rel_comando(comandi[gesto + 2]))
    if not {"seme_spento", "fuga", "groviglio_desto", "dialogo_fine"} <= set(nomi(t)):
        problemi.append(f"«{comandi[gesto + 2]}» non manda insieme la fuga e la fine del dialogo ({', '.join(nomi(t))})")
    if t["stato"]["fuga"] != "iniziata" or t["stato"]["atto"] != 5:
        problemi.append(f"dopo «{comandi[gesto + 2]}» lo schermo non è nella fuga")

    # chi chiude la conversazione scrivendo, dall'uno e dall'altro nodo: la stanza è quella della fuga
    for n, dove in ((gesto + 1, "alla dissolvenza"), (gesto + 2, "all'ultima voce")):
        fino(n)
        t = json.loads(ponte.rel_comando("esci"))
        if ponte._mondo.in_dialogo() or not nella_fuga():
            problemi.append(f"«esci» {dove}: il congedo si è disfatto")
        if not {"fuga", "dialogo_fine"} <= set(nomi(t)) or t["stato"]["fuga"] != "iniziata":
            problemi.append(f"«esci» {dove}: per lo schermo o per il suono la fuga non è cominciata")
        t = json.loads(ponte.rel_comando("guarda"))
        visto = " ".join(e["testo"] for e in t["eventi"])
        if "galleggia la figura" in visto or "un seme" not in visto:
            problemi.append(f"«esci» {dove}: la stanza non è quella della fuga")

    # chi gli parla nella fuga: una frase di racconto, nessun colloquio, il seme in tasca
    fino(comandi.index("prendi il seme", gesto) + 1)
    t = json.loads(ponte.rel_comando("parla con l'anziano"))
    testi = [(e["tipo"], e["testo"]) for e in t["eventi"]]
    if ("testo", NON_C_E_PIU) not in testi or any(tipo in ("dialogo", "sistema", "opzione") for tipo, _ in testi):
        problemi.append(f"parlare all'Anziano nella fuga non dà la frase di racconto ({testi[:3]})")
    if t["stato"]["dialogo"] or {"dialogo", "nodo"} & set(nomi(t)):
        problemi.append("parlare all'Anziano nella fuga riapre il colloquio")
    if "seme" not in t["stato"]["inventario"]:
        problemi.append("parlare all'Anziano nella fuga toglie il seme di tasca")
    return problemi


def indisturbato(mondo, percorso):
    """Lo stesso percorso giocato dal motore da solo e dal ponte: stessa impronta."""
    dati = json.loads(ponte.rel_percorso(percorso))
    p = Partita(mondo, seme=1)
    ponte.rel_avvia(1)
    for cmd in dati["comandi"]:
        if not p.in_corso:
            break
        p.esegui(cmd)
        ponte.rel_comando(cmd)
        if p.m.impronta_stato() != ponte._mondo.impronta_stato():
            return f"{os.path.basename(percorso)}: dopo «{cmd}» il ponte e il motore divergono"
    return None


def servizio_coerente():
    """La voce di servizio (documento 35, §11): il manifest è quello dei testi del gioco di adesso, ogni parte
    tagliata ha il suo file, e la tabella del ponte è quella del manifest. Le parti ancora da generare
    (servizio-nuove.txt) non sono un errore: si dicono, e intanto il motore le salta."""
    cartella = os.path.join(RADICE, "doppiaggio", "servizio")
    manifest = json.load(open(os.path.join(cartella, "manifest.json"), encoding="utf-8"))
    tagli = json.load(open(os.path.join(cartella, "tagli.json"), encoding="utf-8"))["parti"]
    sys.path.insert(0, os.path.join(RADICE, "strumenti", "audio"))
    import voce_servizio                              # noqa: E402  (non taglia_servizio: vuole numpy e scipy)
    gia = set()
    nomi = {p["id"]: voce_servizio.nome_file(i + 1, p["voce"], gia) for i, p in enumerate(manifest["parti"])}
    problemi, attese, da_generare = [], {}, []
    for p in manifest["parti"]:
        t = tagli.get(p["id"])
        attese[nomi[p["id"]]] = (p["tipo"], p["gioco"])
        if not t:
            da_generare.append(nomi[p["id"]])
            continue
        if t["file"] != nomi[p["id"]]:
            problemi.append(f"il file di «{p['voce']}» si chiama {t['file']}, il manifest dice {nomi[p['id']]}")
        if not os.path.isfile(os.path.join(RADICE, "audio", "musica-ia", "SV", t["file"] + ".mp3")):
            problemi.append(f"manca il file {t['file']}.mp3")
    if attese != ponte.VOCI_SERVIZIO:
        problemi.append("la tabella VOCI_SERVIZIO del ponte non è quella del manifest")
    ora = {p["voce"] for p in voce_servizio.parti_di_servizio()}
    vecchie = {p["voce"] for p in manifest["parti"]}
    for v in sorted(ora - vecchie):
        problemi.append(f"una parte nuova nel gioco, da generare: «{v}» (strumenti/audio/voce_servizio.py)")
    for v in sorted(vecchie - ora):
        problemi.append(f"una parte che il gioco non ha più: «{v}»")
    return problemi, da_generare


def main():
    ap = argparse.ArgumentParser(description="Gli eventi che il ponte manda al suono.")
    ap.add_argument("-v", "--verboso", action="store_true")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    esito = json.loads(ponte.rel_compila(STORIA))
    if not esito["ok"]:
        print("Compilazione fallita:", esito.get("errore"))
        return 2
    conta, falliti = collections.Counter(), 0
    percorsi = sorted(f for f in glob.glob(os.path.join(QUI, "*.txt")) if leggi_attese(f))
    for percorso in percorsi:
        nome = os.path.basename(percorso)[:-4]
        problemi, ordine, finale, esito_partita, testo = gioca(percorso, conta)
        if esito_partita != "in_corso":
            scritto = finale_dal_testo(testo, esito_partita)
            if scritto is None:
                problemi.append("il testo della fine non ha la frase di nessuno dei sei finali")
            elif finale != scritto:
                problemi.append(f"il ponte riconosce «{finale}», ma il testo del gioco è quello di «{scritto}»")
            if finale not in ponte.FINALI or (nome in ponte.FINALI and finale != nome):
                problemi.append(f"il finale riconosciuto è «{finale}», atteso «{nome if nome in ponte.FINALI else scritto}»")
        if nome == "vivi":
            mancanti = sottosequenza(ORDINE_VIVI, ordine)
            if mancanti:
                problemi.append(f"fuori ordine o mancanti: {', '.join(mancanti)}")
        riga = f"{nome} ({len(ordine)} eventi" + (f", finale «{finale}»" if finale else "") + ")"
        if problemi:
            falliti += 1
            print(f"[NO] {riga}")
            for p in problemi[:6]:
                print(f"     {p}")
        else:
            print(f"[OK] {riga}")

    frasi = segni_dei_finali()
    print(f"[{'NO' if frasi else 'OK'}] le frasi che dicono il finale, in finali.fav ({len(SEGNO_DEL_FINALE)})")
    for p in frasi:
        print(f"     {p}")

    rami = [r for r in (ramo(*x, conta) for x in RAMI) if r]
    print(f"[{'NO' if rami else 'OK'}] i rami ({len(RAMI)}): {', '.join(x[0] for x in RAMI)}")
    for r in rami:
        print(f"     {r}")

    mai = sorted(_nomi_della_tabella() - set(conta))
    ignoti = sorted(set(conta) - _nomi_della_tabella())
    print(f"[{'NO' if mai or ignoti else 'OK'}] la tabella: {len(_nomi_della_tabella())} eventi, "
          f"{len(_nomi_della_tabella()) - len(mai)} visti")
    if mai:
        print(f"     mai scattati: {', '.join(mai)}")
    if ignoti:
        print(f"     fuori dalla tabella: {', '.join(ignoti)}")

    segni = json.loads(ponte.rel_segni_a_sorte())
    persi = [n for n, c in segni.items() if not c]
    print(f"[{'NO' if persi else 'OK'}] i segni a sorte nel gioco ({len(segni)})")
    if persi:
        print(f"     non più nel gioco: {', '.join(persi)}")

    voci = json.loads(ponte.rel_voci_anziano())
    perse = [n for n, c in voci.items() if not c]
    print(f"[{'NO' if perse else 'OK'}] le battute dell'Anziano con la voce nel gioco ({len(voci)})")
    if perse:
        print(f"     non più nel gioco, parola per parola: {', '.join(perse)}")

    perse_anziano = perse
    voci = json.loads(ponte.rel_voci_nave())
    perse = [n for n, c in voci.items() if not c]
    print(f"[{'NO' if perse else 'OK'}] le battute delle voci della nave, di Yusuf e di L.V. e le parti della voce "
          f"di servizio nel gioco ({len(voci)})")
    if perse:
        print(f"     non più nel gioco, frammento per frammento: {', '.join(perse)}")
    perse = perse_anziano + perse

    servizio, da_generare = servizio_coerente()
    print(f"[{'NO' if servizio else 'OK'}] la voce di servizio: il manifest, i file e la tabella del ponte "
          f"({len(ponte.VOCI_SERVIZIO)} parti" + (f", {len(da_generare)} da generare" if da_generare else "") + ")")
    for p in servizio:
        print(f"     {p}")
    if da_generare:
        print(f"     da generare (doppiaggio/servizio/servizio-nuove.txt): {', '.join(da_generare)}")

    addio = congedo()
    print(f"[{'NO' if addio else 'OK'}] il congedo dell'Anziano non si disfa (a occhi chiusi, chiudendo, parlandogli nella fuga)")
    for p in addio:
        print(f"     {p}")

    mondo = compila_mondo(STORIA)
    divergenze = [d for d in (indisturbato(mondo, os.path.join(QUI, f"{n}.txt")) for n in ponte.FINALI) if d]
    print(f"[{'NO' if divergenze else 'OK'}] il ponte non cambia la partita (i sei finali)")
    for d in divergenze:
        print(f"     {d}")

    if a.verboso:
        print()
        for nome, n in sorted(conta.items()):
            print(f"  {n:5}  {nome}")
    sbagli = falliti + bool(frasi) + bool(rami) + bool(mai or ignoti) + bool(persi) + bool(perse) + bool(servizio) + bool(addio) + bool(divergenze)
    print(f"\nPercorsi: {len(percorsi)}; falliti: {falliti}. Eventi diversi: {len(conta)}; "
          f"eventi in tutto: {sum(conta.values())}.")
    return 1 if sbagli else 0


if __name__ == "__main__":
    sys.exit(main())
