# prova_eseguibile.py — le prove automatiche dentro l'eseguibile vero.
#
# Uso (dalla radice del progetto, dopo «npm --prefix app run tauri build -- --no-bundle»):
#   python strumenti/prova_eseguibile.py finali       i sei finali attraverso l'interfaccia
#   python strumenti/prova_eseguibile.py salvataggi   salva, elenca, rilegge e carica
#   python strumenti/prova_eseguibile.py mondo        il mondo sonoro sintetizzato, misurato
#   python strumenti/prova_eseguibile.py finali --exe <percorso>
#
# Lancia l'eseguibile con RELITTO_PROVA, i salvataggi e i rapporti in cartelle
# temporanee (i salvataggi e il registro dei finali di chi gioca non si
# toccano), aspetta che esca e riassume il rapporto. Esce con 0 se la prova è
# riuscita.
#   finali       app/src/prova/finali.ts: dal menu principale, «Nuova partita»,
#                l'intro saltata, poi ogni passo dei sei finali cliccato nel DOM;
#                l'impronta finale deve essere quella di collaudo/finali-menu.json
#                (scritto da collaudo/menu.mjs con il motore in CPython), e i sei
#                finali devono finire nel registro.
#   salvataggi   app/src/gioco/Gioco.tsx: sei comandi, il posto 6 scritto, riletto
#                e caricato «identica».
#   mondo        app/src/prova/ProvaSuono.tsx: i tre ambienti del prototipo nei loro
#                stati, con la CPU del thread audio, i buchi del flusso e gli errori;
#                riesce se il flusso non ha errori e nessun buco supera i 50 ms.

import argparse
import glob
import json
import os
import subprocess
import sys
import tempfile
import time

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RILASCIO = os.path.join(RADICE, "app", "src-tauri", "target", "release")


def eseguibile():
    for nome in ("il-relitto-silente.exe", "il-relitto-silente"):
        p = os.path.join(RILASCIO, nome)
        if os.path.isfile(p):
            return p
    return None


def main():
    ap = argparse.ArgumentParser(description="Le prove automatiche nell'eseguibile vero.")
    ap.add_argument("prova", choices=["finali", "salvataggi", "mondo"])
    ap.add_argument("--exe", help="l'eseguibile (di base quello di rilascio)")
    ap.add_argument("--attesa", type=int, default=600, help="secondi al più (di base 600)")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    exe = os.path.abspath(a.exe) if a.exe else eseguibile()
    if not exe:
        print("Manca l'eseguibile: npm --prefix app run tauri build -- --no-bundle")
        return 2
    with tempfile.TemporaryDirectory(prefix="relitto-prova-") as cartella:
        salvataggi, rapporti = os.path.join(cartella, "salvataggi"), os.path.join(cartella, "rapporti")
        os.makedirs(salvataggi)
        os.makedirs(rapporti)
        ambiente = {**os.environ, "RELITTO_PROVA": a.prova, "RELITTO_SALVATAGGI": salvataggi, "RELITTO_RAPPORTI": rapporti}
        t0 = time.perf_counter()
        try:
            uscita = subprocess.run([exe], env=ambiente, timeout=a.attesa, capture_output=True).returncode
        except subprocess.TimeoutExpired:
            print(f"[NO] la prova «{a.prova}» non è finita in {a.attesa} s")
            return 1
        secondi = time.perf_counter() - t0
        file = glob.glob(os.path.join(rapporti, "*.json"))
        if not file:
            print(f"[NO] la prova «{a.prova}» non ha scritto il rapporto (uscita {uscita})")
            return 1
        with open(file[0], encoding="utf-8") as f:
            r = json.load(f)
    v = r.get("versione", {})
    print(f"Eseguibile {v.get('gioco')} · {v.get('commit')} · FAVELLA {v.get('motore')}; {secondi:.0f} s")
    if a.prova == "finali":
        for x in r.get("finali", []):
            modi = ", ".join(f"{n} {k}" for k, n in sorted(x.get("modi", {}).items(), key=lambda kv: -kv[1]))
            stato = "OK" if not x.get("errore") else "NO"
            print(f"[{stato}] {x['finale']}: {x['passi']} passi in {x['ms'] / 1000:.1f} s ({modi})"
                  + (f"\n     {x['errore']}" if x.get("errore") else ""))
        print(f"Il registro dei finali: {', '.join(r.get('registro', [])) or 'vuoto'}")
        if r.get("errore"):
            print(f"     {r['errore']}")
    elif a.prova == "mondo":
        ok = bool(r.get("passi"))
        print(f"Avvio del mondo sonoro: {r.get('caricamento', {}).get('avvio_ms', 0):.1f} ms")
        for p in r.get("passi", []):
            m = p["misure"]
            buono = m["errori_flusso"] == 0 and m["gap_max_ms"] < 50
            ok = ok and buono
            print(f"[{'OK' if buono else 'NO'}] {p['passo']}: CPU media {m['cpu_media'] * 100:.1f}%, "
                  f"max {m['cpu_max'] * 100:.1f}%; buco massimo {m['gap_max_ms']:.1f} ms; errori {m['errori_flusso']}")
        r["ok"] = ok
    else:
        print(f"Caricamento: {r.get('caricamento')}; letto uguale: {r.get('letto_uguale')}; "
              f"stessa impronta: {r.get('impronta_uguale')}")
        if r.get("errore"):
            print(f"     {r['errore']}")
    print(f"\n{'Riuscita' if r.get('ok') else 'Fallita'} (uscita {uscita}).")
    return 0 if r.get("ok") and uscita == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
