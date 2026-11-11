# salvataggi_momenti.py — quattro salvataggi, uno davanti a ogni momento con
# un'animazione sua (documento 30, §9), dal percorso «Vivi».
#
# Uso (dalla radice del progetto):
#   python strumenti/misure/salvataggi_momenti.py <cartella dei salvataggi>
#
# Li scrive il ponte in CPython, come il collaudo dei salvataggi, e l'eseguibile
# li carica «identica». Ogni posto è salvato subito prima del comando che fa
# partire il momento:
#   posto 1   la nave che si sveglia    usa il cristallo sul generatore
#   posto 2   la mappa stellare         usa la postazione
#   posto 3   l'Anziano che appare      parla con l'anziano
#   posto 4   l'Anziano nel seme        [Chiudi gli occhi e lascia andare.]
# La cartella si dà poi all'eseguibile con RELITTO_SALVATAGGI (lo fa
# strumenti/misure/momenti.mjs): i salvataggi di chi gioca non si toccano.
import datetime
import json
import os
import subprocess
import sys

RADICE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if len(sys.argv) != 2:
    sys.exit("Uso: python strumenti/misure/salvataggi_momenti.py <cartella dei salvataggi>")
CARTELLA = os.path.abspath(sys.argv[1])
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))
sys.path.insert(0, os.path.join(RADICE, "collaudo"))
sys.stdout.reconfigure(encoding="utf-8")

import ponte  # noqa: E402

# il posto, e il comando che fa partire il momento: si salva subito prima
MOMENTI = [("1", "usa il cristallo sul generatore"),
           ("2", "usa la postazione"),
           ("3", "parla con l'anziano"),
           ("4", "[Chiudi gli occhi e lascia andare.]")]

esito = json.loads(ponte.rel_compila(os.path.join(RADICE, "relitto-silente", "relitto.fav")))
assert esito["ok"], esito
comandi = json.loads(ponte.rel_percorso(os.path.join(RADICE, "collaudo", "vivi.txt")))["comandi"]
commit = subprocess.run(["git", "-C", RADICE, "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
identita = f"{ponte._versione.get('gioco')} · {commit}"
os.makedirs(CARTELLA, exist_ok=True)

ponte.rel_avvia(1)
attesi = dict((c, p) for p, c in MOMENTI)
scritti = []
for i, cmd in enumerate(comandi, 1):
    if cmd in attesi and attesi[cmd] not in scritti:
        posto = attesi[cmd]
        testo = ponte.rel_salva(identita, f"{datetime.date.today().isoformat()}T12:0{posto}:00.000Z")
        with open(os.path.join(CARTELLA, f"posto-{posto}.json"), "w", encoding="utf-8", newline="") as f:
            f.write(testo)
        r = json.loads(testo)["riassunto"]
        m = ponte._mondo
        print(f"posto {posto}: prima di «{cmd}» (comando {i}); {r['nome_stanza']}, atto {r['atto']}, turno {r['turno']}, aria {r['aria']}; dialogo {m.dialogo_attivo!r}")
        # il salvataggio si ricarica identico?
        prima = m.impronta_stato()
        c = json.loads(ponte.rel_carica(testo))
        assert c["ok"] and c["esito"] == "identica" and ponte._mondo.impronta_stato() == prima, c.get("messaggio")
        scritti.append(posto)
    t = json.loads(ponte.rel_comando(cmd))
    if cmd in attesi:
        suono = [e.get("evento") for e in t.get("suono", {}).get("eventi", [])]
        print(f"   dopo «{cmd}»: suono {suono}; nodo {ponte._stato().get('nodo')!r}")
assert scritti == ["1", "2", "3", "4"], scritti
print("cartella:", CARTELLA)
