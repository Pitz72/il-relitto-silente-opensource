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
#   2. ogni percorso che finisce la partita manda l'evento «finale» giusto (il
#      nome del percorso, se è uno dei sei finali);
#   3. in «Vivi» gli eventi principali arrivano nell'ordine della storia;
#   4. ogni evento della tabella del ponte scatta almeno una volta: sui percorsi,
#      o sui rami scritti qui per quelli che nessun percorso tocca (il bengala
#      acceso, il reattore toccato, la radio, l'archivio forzato…);
#   5. i segni a sorte che si riconoscono dal testo sono ancora nel gioco;
#   6. il ponte non cambia la partita: lo stesso percorso giocato dal ponte e
#      giocato dal motore da solo arriva alla stessa impronta.

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

# Gli eventi che scattano per passaggio di stato, per comando o per segno a sorte,
# più quelli che il ponte ricava da sé (stanza, aria, soglie, contatori, dialogo).
DERIVATI = ("inizio", "stanza", "boccaporto", "rientro", "discesa", "groviglio_prende", "casco_tolto",
            "dialogo", "dialogo_fine", "nodo", "chiave", "eco", "risonanza", "traccia", "taglio",
            "risuonata", "matrice", "traduzione_completa", "aria", "ambra", "ipossia", "protezione",
            "protezione_fine", "protezione_fuga", "attrezzo", "finale")

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
)


def _nomi_della_tabella():
    nomi = {n for n, *_ in ponte._PASSAGGI} | set(ponte._PER_COMANDO.values()) | set(ponte.SEGNI_A_SORTE)
    return nomi | set(DERIVATI)


def gioca(percorso, conta):
    """Gioca un percorso dal ponte; restituisce (problemi, eventi in ordine, finale)."""
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
    return problemi, ordine, finale, turno["esito"]


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
        return f"{nome}: il percorso {percorso} non arriva mai al punto di partenza"
    visti = []
    for cmd in comandi:
        turno = json.loads(ponte.rel_comando(cmd))
        visti += [e["evento"] for e in turno["suono"]["eventi"]]
    for e in visti:
        conta[e] += 1
    mancanti = [e for e in attesi if e not in visti]
    return f"{nome}: non scattano {', '.join(mancanti)} (scattano {', '.join(visti)})" if mancanti else None


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
        problemi, ordine, finale, esito_partita = gioca(percorso, conta)
        if esito_partita != "in_corso":
            atteso = nome if nome in ponte.FINALI else finale
            if finale != atteso or finale not in ponte.FINALI:
                problemi.append(f"il finale riconosciuto è «{finale}», atteso «{atteso}»")
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

    mondo = compila_mondo(STORIA)
    divergenze = [d for d in (indisturbato(mondo, os.path.join(QUI, f"{n}.txt")) for n in ponte.FINALI) if d]
    print(f"[{'NO' if divergenze else 'OK'}] il ponte non cambia la partita (i sei finali)")
    for d in divergenze:
        print(f"     {d}")

    if a.verboso:
        print()
        for nome, n in sorted(conta.items()):
            print(f"  {n:5}  {nome}")
    sbagli = falliti + bool(rami) + bool(mai or ignoti) + bool(persi) + bool(divergenze)
    print(f"\nPercorsi: {len(percorsi)}; falliti: {falliti}. Eventi diversi: {len(conta)}; "
          f"eventi in tutto: {sum(conta.values())}.")
    return 1 if sbagli else 0


if __name__ == "__main__":
    sys.exit(main())
