# La demo dell'atto I (app/src/demo.ts; l'autore, 21 novembre 2026: «io voglio una DEMO dell'atto 1 e basta. Prima di
# tutto per Leo e poi decido se metterlo sul sito»): scrive app/src-tauri/tauri.demo.conf.json, la configurazione che
# si aggiunge a quella del gioco quando si costruisce la demo.
#
#   python strumenti/demo/configura.py
#   (poi, da app/)  npx tauri build --config src-tauri/tauri.demo.conf.json --bundles nsis
#
# Che cosa cambia rispetto al gioco intero:
#   - un'app a sé: nome, eseguibile e identificatore suoi (i salvataggi in Documenti/Il Relitto Silente - Demo, i dati
#     della pagina in una cartella sua), la finestra con il suo titolo;
#   - la pagina costruita in modalità «demo» (vite --mode demo): il gioco finisce sullo scafo nero;
#   - niente pacchetti per l'aggiornamento automatico (e la pagina non lo cerca);
#   - fra le risorse, niente voci degli atti dopo il primo: le prese di William che non sono dell'atto I (sigle SM)
#     né dell'ingresso (IN),
#     l'Anziano, le voci della nave, L.V. nella serra e Yusuf nella fuga. Il motore audio prende i file che trova: un
#     pezzo che non c'è resta muto. La musica resta tutta: le regie dell'atto I la usano, e la demo resta il gioco vero.
# La configurazione si unisce a quella del gioco come una «merge patch» (RFC 7396): una risorsa con il valore null
# viene tolta. Va rifatta quando cambiano le risorse del gioco (voce_william.py le scrive a ogni consegna).
import json
import os
import re

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
GIOCO = os.path.join(RADICE, "app", "src-tauri", "tauri.conf.json")
USCITA = os.path.join(RADICE, "app", "src-tauri", "tauri.demo.conf.json")

NOME = "Il Relitto Silente - Demo"
# le voci che nell'atto I non si sentono
FUORI = [
    # William: delle prese del copione restano quelle dell'atto I (SM) e quelle dell'ingresso (IN), perché qualche
    # regola dell'ingresso vale già nella stiva: «entra nel boccaporto» è IN-030 (l'autore, 21 novembre 2026, nella
    # prima demo era muta). Una presa si sente soltanto se a schermo c'è la sua frase. Il registro dell'intro (WI-01)
    # resta.
    re.compile(r"/WI/WI-(?!SM-|IN-)[A-Z]{2}-\d"),
    re.compile(r"/AN/"),                    # l'Anziano (atto IV)
    re.compile(r"/NV/"),                    # le voci della nave (dall'atto II)
    re.compile(r"/LV/LV-02"),               # L.V. nella serra (atto III); LV-01, la traccia del prologo, resta
    re.compile(r"/YU/YU-0[78]"),            # Yusuf nella fuga (atto V)
]


def main():
    gioco = json.load(open(GIOCO, encoding="utf-8"))
    risorse = gioco["bundle"]["resources"]
    via = sorted(k for k in risorse if any(r.search(k) for r in FUORI))
    finestre = [dict(f, title=NOME) for f in gioco["app"]["windows"]]
    demo = {
        "productName": NOME,
        "mainBinaryName": "il-relitto-silente-demo",
        "identifier": gioco["identifier"] + ".demo",
        "build": {"beforeBuildCommand": "npm run build -- --mode demo"},
        "app": {"windows": finestre},
        "bundle": {
            "createUpdaterArtifacts": False,
            "shortDescription": "Avventura testuale: la demo dell'atto I",
            "resources": {k: None for k in via},
        },
    }
    with open(USCITA, "w", encoding="utf-8", newline="\n") as f:
        json.dump(demo, f, ensure_ascii=False, indent=2)
        f.write("\n")
    restano = [k for k in risorse if k not in via]
    print(f"{os.path.relpath(USCITA, RADICE)}: {len(via)} risorse tolte, {len(restano)} restano "
          f"(prese di William: {sum('/WI/WI-' in k for k in restano)})")


if __name__ == "__main__":
    main()
