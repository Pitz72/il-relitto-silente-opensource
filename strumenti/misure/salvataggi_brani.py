# salvataggi_brani.py — il salvataggio per sentire «Held by the Dark», il tema della
# Grande Porta (revisione 37, L31), dal percorso «Vivi».
#
# Uso (dalla radice del progetto):
#   python strumenti/misure/salvataggi_brani.py <cartella dei salvataggi>
#
# Lo scrive il ponte in CPython, come il collaudo dei salvataggi, e l'eseguibile
# lo carica «identica». Il posto 1 è salvato subito prima del comando che apre la
# Grande Porta (la terza chiave): caricato, basta quel comando, e il tema parte
# con il gong. L'altro brano, «Hull of the Ancient», apre il giro del menu: non
# gli serve un salvataggio.
# La cartella si dà all'eseguibile con RELITTO_SALVATAGGI: i salvataggi di chi
# gioca non si toccano.
import datetime
import json
import os
import subprocess
import sys

RADICE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if len(sys.argv) != 2:
    sys.exit("Uso: python strumenti/misure/salvataggi_brani.py <cartella dei salvataggi>")
CARTELLA = os.path.abspath(sys.argv[1])
sys.path.insert(0, os.path.join(RADICE, "motore"))
sys.path.insert(0, os.path.join(RADICE, "app", "src", "motore"))
sys.path.insert(0, os.path.join(RADICE, "collaudo"))
sys.stdout.reconfigure(encoding="utf-8")

import ponte  # noqa: E402

esito = json.loads(ponte.rel_compila(os.path.join(RADICE, "relitto-silente", "relitto.fav")))
assert esito["ok"], esito
comandi = json.loads(ponte.rel_percorso(os.path.join(RADICE, "collaudo", "vivi.txt")))["comandi"]
commit = subprocess.run(["git", "-C", RADICE, "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip()
identita = f"{ponte._versione.get('gioco')} · {commit}"
os.makedirs(CARTELLA, exist_ok=True)


def porta_aperta() -> bool:
    return ponte._prop(ponte._mondo, "grande porta", "aperta") is not None


ponte.rel_avvia(1)
scritto = False
for i, cmd in enumerate(comandi, 1):
    prima = None
    if "grande porta" in cmd and not porta_aperta():
        prima = ponte.rel_salva(identita, f"{datetime.date.today().isoformat()}T12:01:00.000Z")
        impronta = ponte._mondo.impronta_stato()
    t = json.loads(ponte.rel_comando(cmd))
    if prima is not None and porta_aperta():
        suono = [e.get("evento") for e in t.get("suono", {}).get("eventi", [])]
        assert "grande_porta" in suono, suono
        with open(os.path.join(CARTELLA, "posto-1.json"), "w", encoding="utf-8", newline="") as f:
            f.write(prima)
        r = json.loads(prima)["riassunto"]
        print(f"posto 1: prima di «{cmd}» (comando {i}); {r['nome_stanza']}, atto {r['atto']}, turno {r['turno']}, aria {r['aria']}")
        print(f"   dopo «{cmd}»: suono {suono}")
        # il salvataggio si ricarica identico?
        c = json.loads(ponte.rel_carica(prima))
        assert c["ok"] and c["esito"] == "identica" and ponte._mondo.impronta_stato() == impronta, c.get("messaggio")
        scritto = True
        break
assert scritto, "nel percorso «Vivi» la Grande Porta non si apre"
print("cartella:", CARTELLA)
