# diario.py — la cronaca della partita che il ponte tiene per il diario
# (app/src/motore/ponte.py: _voce_di_cronaca, _aggiorna_cronaca,
# _ricostruisci_cronaca; 06-app-desktop.md, §4.6).
#
# Uso (dalla radice del progetto):
#   python collaudo/diario.py
#   python collaudo/diario.py -v        in più, i segni di ogni percorso
#
# Che cosa controlla:
#   1. a ogni turno di ogni percorso la cronaca ha una voce per ogni comando
#      della sequenza effettiva del motore, e la voce nuova è il turno appena
#      giocato (lo stesso testo che la lamina mostra);
#   2. dopo un salvataggio e un caricamento, la cronaca ricostruita rigiocando
#      è uguale a quella giocata, voce per voce (tranne il numero della voce);
#   3. ANNULLA toglie dalla cronaca il turno disfatto;
#   4. i segni del diario: nel percorso «tutto» le cinque tracce di L.V., le
#      voci, le iscrizioni tradotte, i reperti; le iniziali solo quando si
#      esamina la placca; una traduzione chiusa dalla protezione vitale non è
#      una lettura;
#   5. il diario non cambia la partita: la stessa impronta con e senza; e
#      riprendere la partita dal menu principale (rel_riprendi) non la cambia.

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
from esploratore import Partita                   # noqa: E402
from compilatore import compila_mondo             # noqa: E402
from regressioni import leggi_attese              # noqa: E402

STORIA = os.path.join(RADICE, "relitto-silente", "relitto.fav")


def comandi_di(percorso):
    return json.loads(ponte.rel_percorso(percorso))["comandi"]


def senza_chiave(voci):
    return [{k: v for k, v in voce.items() if k != "chiave"} for voce in voci]


def gioca(percorso):
    problemi = []
    ponte.rel_avvia(1)
    for i, cmd in enumerate(comandi_di(percorso), 1):
        if ponte._mondo.stato_partita != "in_corso":
            break
        t = json.loads(ponte.rel_comando(cmd))
        c = t["cronaca"]
        registro = ponte._mondo._registro_comandi
        if c["lunghezza"] != len(registro) or c["lunghezza"] != len(ponte._cronaca):
            problemi.append(f"passo {i} ({cmd}): {c['lunghezza']} voci, {len(registro)} comandi nel motore")
            break
        if c["nuova"] is not None and c["nuova"]["eventi"] != t["eventi"]:
            problemi.append(f"passo {i} ({cmd}): la voce nuova non è il turno appena giocato")
    vissuta = senza_chiave(ponte._cronaca)
    impronta = ponte._mondo.impronta_stato()
    t0 = time.perf_counter()
    r = json.loads(ponte.rel_carica(ponte.rel_salva("collaudo", "2026-10-15T12:00:00")))
    ms = (time.perf_counter() - t0) * 1000
    if not r["ok"] or r["esito"] != "identica":
        problemi.append(f"il caricamento non è identico: {r.get('esito') or r.get('motivo')}")
        return problemi, vissuta, ms
    ricostruita = senza_chiave(r["diario"]["cronaca"])
    if len(ricostruita) != len(vissuta):
        problemi.append(f"ricostruita: {len(ricostruita)} voci, giocata: {len(vissuta)}")
    for n, (a, b) in enumerate(zip(vissuta, ricostruita), 1):
        if a != b:
            diverse = sorted(k for k in a if a.get(k) != b.get(k))
            problemi.append(f"voce {n} ({a['comando']}): diversa dopo il caricamento in {', '.join(diverse)}")
            break
    if ponte._mondo.impronta_stato() != impronta:
        problemi.append("la ricostruzione ha cambiato la partita")
    return problemi, vissuta, ms


def segni(voci):
    return {
        "tracce": [t for v in voci for t in v["tracce"]],
        "iniziali": any(v["iniziali"] for v in voci),
        "voci": sum(1 for v in voci if v["voce"]),
        "letture": [(v["lettura"]["cosa"], v["lettura"]["matrice"]) for v in voci if v["lettura"]],
        "reperti": [r["cosa"] for v in voci for r in v["reperti"]],
    }


def annulla():
    """ANNULLA toglie il turno disfatto, anche quando aveva trovato una traccia."""
    problemi = []
    ponte.rel_avvia(1)
    comandi = comandi_di(os.path.join(QUI, "tutto.txt"))
    for cmd in comandi:
        prima = len(ponte._cronaca)
        t = json.loads(ponte.rel_comando(cmd))
        if t["cronaca"]["nuova"] and t["cronaca"]["nuova"]["tracce"]:
            break
    else:
        return ["nel percorso «tutto» nessuna traccia da disfare"]
    t = json.loads(ponte.rel_comando("annulla"))
    if t["cronaca"]["lunghezza"] != prima or len(ponte._cronaca) != prima:
        problemi.append(f"dopo ANNULLA {len(ponte._cronaca)} voci invece di {prima}")
    if any(v["tracce"] for v in ponte._cronaca):
        problemi.append("dopo ANNULLA la traccia disfatta resta nella cronaca")
    return problemi


def placca():
    """Le iniziali di L.V. si leggono esaminando la placca, nella serra."""
    ponte.rel_avvia(1)
    for cmd in comandi_di(os.path.join(QUI, "tutto.txt")):
        if "placca" in [o["id"] for o in json.loads(ponte.rel_comando(cmd))["pulsanti"]["oggetti"]]:
            break
    else:
        return ["nel percorso «tutto» la placca non è mai in vista"]
    voce = json.loads(ponte.rel_comando("esamina la placca"))["cronaca"]["nuova"]
    if voce is None or not voce["iniziali"]:
        return ["esaminare la placca non segna le iniziali"]
    if "L.V." not in "".join(e["testo"] for e in voce["eventi"]):
        return ["la placca esaminata non dice le iniziali: il segno non vale più"]
    return []


def protezione():
    """Con l'aria sotto 30, prima della fuga, tradurre non è leggere."""
    ponte.rel_avvia(1)
    for cmd in comandi_di(os.path.join(QUI, "tutto.txt")):
        if "bassorilievo" in [o["id"] for o in json.loads(ponte.rel_comando(cmd))["pulsanti"]["oggetti"]]:
            break
    else:
        return ["nel percorso «tutto» il bassorilievo non è mai in vista"]
    ponte._mondo.variabili["aria"] = 20
    t = json.loads(ponte.rel_comando("traduci il bassorilievo"))
    voce = t["cronaca"]["nuova"]
    if voce is None:
        return ["«traduci il bassorilievo» non è entrato nella cronaca"]
    if voce["lettura"] is not None:
        return ["una traduzione chiusa dalla protezione vitale è diventata una lettura"]
    if "PROTEZIONE VITALE" not in "".join(e["testo"] for e in voce["eventi"]):
        return ["la prova della protezione non ha avuto la risposta della protezione"]
    return []


def main():
    ap = argparse.ArgumentParser(description="La cronaca del diario: giocata, ricostruita, i segni.")
    ap.add_argument("percorsi", nargs="*")
    ap.add_argument("-v", action="store_true", help="i segni di ogni percorso")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    esito = json.loads(ponte.rel_compila(STORIA))
    if not esito["ok"]:
        print("Compilazione fallita:", esito.get("errore"), esito.get("rapporto", ""))
        return 2
    percorsi = a.percorsi or sorted(f for f in glob.glob(os.path.join(QUI, "*.txt")) if leggi_attese(f))
    falliti, voci_in_tutto, piu_lento = 0, 0, 0.0
    for percorso in percorsi:
        nome = os.path.basename(percorso)
        problemi, voci, ms = gioca(percorso)
        voci_in_tutto += len(voci)
        piu_lento = max(piu_lento, ms)
        if nome == "tutto.txt":
            s = segni(voci)
            if sorted(s["tracce"]) != sorted(t[0] for t in ponte.TRACCE_LV):
                problemi.append(f"le tracce di L.V.: {s['tracce']}")
            if s["iniziali"]:
                problemi.append("le iniziali risultano lette, ma «tutto» non esamina la placca")
            if not s["voci"] or not s["letture"] or not s["reperti"]:
                problemi.append(f"mancano voci, letture o reperti: {s}")
        riga = f"{nome} ({len(voci)} voci; caricamento con la cronaca {ms:.0f} ms)"
        if problemi:
            falliti += 1
            print(f"[NO] {riga}")
            for p in problemi[:8]:
                print(f"     {p}")
        else:
            print(f"[OK] {riga}")
        if a.v:
            print(f"     {segni(voci)}")
    for nome, prova in (("ANNULLA toglie il turno disfatto", annulla),
                        ("le iniziali di L.V. sulla placca", placca),
                        ("la protezione vitale non è una lettura", protezione)):
        problemi = prova()
        if problemi:
            falliti += 1
        print(f"[{'NO' if problemi else 'OK'}] {nome}")
        for p in problemi:
            print(f"     {p}")
    # il diario non cambia la partita: il percorso dal ponte e dal motore da solo
    ponte.rel_avvia(1)
    comandi = comandi_di(os.path.join(QUI, "vivi.txt"))
    for cmd in comandi:
        if ponte._mondo.stato_partita != "in_corso":
            break
        ponte.rel_comando(cmd)
    p = Partita(compila_mondo(STORIA), seme=1)
    for cmd in comandi:
        if not p.in_corso:
            break
        p.esegui(cmd)
    uguale = p.m.impronta_stato() == ponte._mondo.impronta_stato()
    if not uguale:
        falliti += 1
    print(f"[{'OK' if uguale else 'NO'}] il diario non cambia la partita («Vivi»)")
    # tornare al gioco dal menu principale: la stessa partita, lo stesso diario
    prima, voci = ponte._mondo.impronta_stato(), senza_chiave(ponte._cronaca)
    r = json.loads(ponte.rel_riprendi())
    ripresa = (r["ok"] and ponte._mondo.impronta_stato() == prima
               and senza_chiave(r["diario"]["cronaca"]) == voci and r["turno"]["eventi"])
    if not ripresa:
        falliti += 1
    print(f"[{'OK' if ripresa else 'NO'}] riprendere dal menu non cambia la partita né il diario")
    print(f"\nPercorsi: {len(percorsi)}; falliti: {falliti}. Voci di cronaca: {voci_in_tutto}; "
          f"il caricamento più lento: {piu_lento:.0f} ms.")
    return 1 if falliti else 0


if __name__ == "__main__":
    sys.exit(main())
