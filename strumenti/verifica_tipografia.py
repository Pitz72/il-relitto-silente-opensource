# Verifica del contratto tipografico (prosa-italiana §7) su documenti tecnici:
# la prosa deve rispettare le invarianti; il codice (blocchi ``` e `…`) è escluso,
# perché lì virgolette e apostrofi dritti sono sintassi.
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")


def prosa(testo):
    testo = re.sub(r"```.*?```", "", testo, flags=re.S)
    testo = re.sub(r"`[^`\n]*`", "", testo)
    testo = re.sub(r"\]\([^)]*\)", "]", testo)          # gli indirizzi dei link
    testo = re.sub(r"<[^>\n]+>", "", testo)              # i tag HTML
    return testo


def verifica(p):
    raw = io.open(p, "rb").read()
    s = raw.decode("utf-8")
    t = prosa(s)
    r = {
        "BOM": raw.startswith(b"\xef\xbb\xbf"),
        "byte NULL": raw.count(b"\x00"),
        "CR": raw.count(b"\r"),
        "newline finale": raw.endswith(b"\n"),
        "apostrofi dritti": t.count("'"),
        "virgolette dritte": t.count('"'),
        "tre punti": t.count("..."),
        "spazi pre-punteg.": len(re.findall(r"[^\s|] [,.;:!?](?!\S*\))", t)),
        "caporali": (t.count("«"), t.count("»")),
        "trattini lunghi": t.count("—"),
        "trattini medi": t.count("–"),
    }
    errori = []
    if r["BOM"]: errori.append("BOM")
    if r["byte NULL"]: errori.append("byte NULL")
    if r["CR"]: errori.append("CR")
    if not r["newline finale"]: errori.append("manca newline finale")
    if r["apostrofi dritti"]:
        righe = [l for l in t.splitlines() if "'" in l]
        errori.append(f"apostrofi dritti: {r['apostrofi dritti']} → {righe[:3]}")
    if r["virgolette dritte"]:
        righe = [l for l in t.splitlines() if '"' in l]
        errori.append(f"virgolette dritte: {r['virgolette dritte']} → {righe[:3]}")
    if r["tre punti"]: errori.append("tre punti")
    if r["caporali"][0] != r["caporali"][1]: errori.append(f"caporali sbilanciati {r['caporali']}")
    print(p, "—", "OK" if not errori else "PROBLEMI", r if errori else "")
    for e in errori:
        print("   ", e)
    return not errori


ok = all([verifica(p) for p in sys.argv[1:]])
sys.exit(0 if ok else 1)
