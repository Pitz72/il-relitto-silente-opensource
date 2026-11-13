# salvataggi_inno.py — due salvataggi per provare «Ascolta il canto» (documento 32, §3.12) nell'eseguibile.
#
# Uso (dalla radice del progetto):
#   python strumenti/misure/salvataggi_inno.py <cartella dei salvataggi>
#
# Dal percorso «La prima nota» (collaudo/prima-nota.txt), scritti dal ponte in CPython come gli altri:
#   posto 1   subito prima di «parla con l'anziano»: tutto il colloquio, dal primo contatto
#   posto 2   subito prima di «[Accendi il Sintonizzatore.]»: l'ultima scelta prima del nodo «musica», dove compare
#             «Ascolta il canto»
# La cartella si dà all'eseguibile con RELITTO_SALVATAGGI: i salvataggi di chi gioca non si toccano.
import datetime
import json
import os
import subprocess
import sys

RADICE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if len(sys.argv) != 2:
    sys.exit("Uso: python strumenti/misure/salvataggi_inno.py <cartella dei salvataggi>")
CARTELLA = os.path.abspath(sys.argv[1])
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))
sys.path.insert(0, os.path.join(RADICE, "collaudo"))
sys.stdout.reconfigure(encoding="utf-8")

import ponte  # noqa: E402

# il posto, e il comando prima del quale si salva
PRIMA_DI = {"parla con l'anziano": "1", "[Accendi il Sintonizzatore.]": "2"}

esito = json.loads(ponte.rel_compila(os.path.join(RADICE, "relitto-silente", "relitto.fav")))
assert esito["ok"], esito
comandi = json.loads(ponte.rel_percorso(os.path.join(RADICE, "collaudo", "prima-nota.txt")))["comandi"]
commit = subprocess.run(["git", "-C", RADICE, "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
identita = f"{ponte._versione.get('gioco')} · {commit}"
os.makedirs(CARTELLA, exist_ok=True)

ponte.rel_avvia(1)
scritti = []
for i, cmd in enumerate(comandi, 1):
    if cmd in PRIMA_DI and PRIMA_DI[cmd] not in scritti:
        posto = PRIMA_DI[cmd]
        testo = ponte.rel_salva(identita, f"{datetime.date.today().isoformat()}T12:0{posto}:00.000Z")
        with open(os.path.join(CARTELLA, f"posto-{posto}.json"), "w", encoding="utf-8", newline="") as f:
            f.write(testo)
        r = json.loads(testo)["riassunto"]
        print(f"posto {posto}: prima di «{cmd}» (comando {i}); {r['nome_stanza']}, atto {r['atto']}, turno {r['turno']}")
        prima = ponte._mondo.impronta_stato()
        c = json.loads(ponte.rel_carica(testo))
        assert c["ok"] and c["esito"] == "identica" and ponte._mondo.impronta_stato() == prima, c.get("messaggio")
        scritti.append(posto)
    ponte.rel_comando(cmd)
assert scritti == ["1", "2"], scritti
print("cartella:", CARTELLA)
