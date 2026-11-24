# La voce di William nel gioco (documento 41): le prese di Leonardo Tomassetti, dalla cartella delle consegne al
# gioco. L'autore, 15 novembre 2026: «Il modo in cui l'audio del parlato e dei dialoghi deve funzionare è esattamente
# come abbiamo fatto ne Il Viaggiatore».
#
#   python strumenti/audio/voce_william.py
#
# Legge:
#   doppiaggio/william/copione.json        le prese, i loro pezzi e il testo di ognuno (copione_william.py)
#   doppiaggio/william/consegne/*.wav      le prese che Leonardo ha mandato (fuori da git): sm-001.wav, fi-002b.wav…
# Scrive:
#   audio/musica-ia/WI/WI-<SIGLA>.mp3      una presa per file: tolto il silenzio ai due capi (il respiro prima della
#                                          prima parola resta), le parole a −23 dBFS, i picchi sotto −1,5; mono,
#                                          44,1 kHz, 96 kbit/s. Una presa già fatta dalla stessa sorgente non si rifà
#   audio/musica-ia/WI/IMPRONTE.sha256     un'impronta per file, e accanto quella della sorgente (prese.json)
#   app/src/motore/racconto.json           per il ponte e per la pagina: ogni pezzo del copione che ha la sua presa, con
#                                          le parole che William dice (il racconto, le scritte che legge, le risposte);
#                                          e le parole dei pezzi che non ce l'hanno ancora («muti», per il ponte)
#   app/src-tauri/src/mondo/prese_william.rs   per il motore audio: tutte le sigle del copione e i loro file
#   app/src-tauri/tauri.conf.json          le prese fra le risorse dell'app (si tolgono quelle che non ci sono più)
#
# Una presa uguale a un'altra («uguale» nel copione) non ha un file suo: suona quella. Una presa che non c'è resta
# muta: il testo c'è, la voce no, come nel Viaggiatore.
#
# Le prese con la voce di servizio in mezzo (documento 41, §5; l'autore, 24 novembre 2026: «la questione […] voce
# William e Computer, va sistemato»). Nel testo William si ferma, parla il computer di bordo o la tuta, e William
# riprende; Leonardo le legge in una presa sola, lasciando una pausa dove parla l'altra voce. La presa si lavora
# intera, come le altre, e poi si divide in quelle pause (`TAGLI`): WI-<SIGLA>-p1.mp3, -p2… Niente si toglie alla
# presa: i tagli cadono nel silenzio, e a ogni parte restano i suoi capi (il respiro compreso). Nel gioco entrano le
# parti, ognuna dove sta il suo testo, e l'altra voce parla in mezzo. Il file intero resta accanto, fuori dal gioco.
#
#   python strumenti/audio/voce_william.py --pause sm-030     elenca i silenzi di una consegna, per scegliere i tagli
import hashlib
import json
import os
import re
import subprocess
import sys

import numpy as np

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
COPIONE = os.path.join(RADICE, "doppiaggio", "william", "copione.json")
CONSEGNE = os.path.join(RADICE, "doppiaggio", "william", "consegne")
USCITA = os.path.join(RADICE, "audio", "musica-ia", "WI")
RACCONTO = os.path.join(RADICE, "app", "src", "motore", "racconto.json")
TABELLA = os.path.join(RADICE, "app", "src-tauri", "src", "mondo", "prese_william.rs")
TAURI = os.path.join(RADICE, "app", "src-tauri", "tauri.conf.json")
SR = 44100

# i segmenti che dice William: il racconto, le scritte che legge fra «» (quando nessun'altra voce le dice), le risposte
# dei dialoghi dette ad alta voce
DI_WILLIAM = ("william", "citazione", "parlato")
PAROLE_DB = -23.0
PICCO_DB = -1.5
# I capi: la voce comincia dove un pezzo di 20 ms passa −40 dBFS; da lì si torna indietro finché c'è qualcosa sopra
# −66 (il respiro prima della prima parola), per un secondo al più, e così dopo l'ultima parola. Ogni presa di Leonardo
# comincia con mezzo secondo di rumore della registrazione, staccato dalla voce da un silenzio vero (−80): resta fuori.
VOCE_DB, RESPIRO_DB, RESPIRO_S = -40.0, -66.0, 1.0
TESTA, CODA = 0.06, 0.12

# I tagli delle prese con la voce di servizio in mezzo: per sigla, i secondi (nel file di Leonardo) a metà della pausa
# che lui ha lasciato dove parla l'altra voce. Uno per ogni punto del testo in cui la voce di servizio sta fra due pezzi
# di William. Scelti con `--pause` e verificati con Whisper (large-v3), parola per parola:
#   SM-030  «…se la prende comoda.» 7,36 | 8,93 «Il calcolo parte…»;  «…si arrende e scrive.» 16,02 | 18,32 «Una cosa…»
#   IN-010  «…rinuncia e scrive di nuovo.» 8,50 | 9,82 «Poi, a tre passi da me…»
# Una presa con un'altra voce in mezzo e senza tagli suona intera, come prima (`SM-048`, con Yusuf: approvata così
# dall'autore il 17 novembre 2026).
TAGLI = {
    "SM-030": [8.41, 17.57],
    "IN-010": [9.49],
}
# le voci degli altri che nel testo stanno fra due pezzi di William (gli spazi e le etichette non sono voci)
NON_VOCI = ("spazio", "etichetta")


def parole(testo):
    return " ".join(re.findall(r"\w+", testo.replace("’", "'").lower()))


def leggi(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)


def parlato_db(x):
    """Il livello delle parole: la mediana dei pezzi di 50 ms entro 30 dB dal più forte (come il lettore del gioco)."""
    n = int(0.05 * SR)
    e = np.array([10 * np.log10(np.mean(x[i:i + n] ** 2) + 1e-20) for i in range(0, len(x) - n, n)])
    p = np.sort(e[e > e.max() - 30])
    return float(p[len(p) // 2])


def energia(x):
    n = int(0.02 * SR)
    return np.array([10 * np.log10(np.mean(x[i:i + n] ** 2) + 1e-20) for i in range(0, len(x) - n, n)])


def capi(e, da, a, n_campioni):
    """Dove comincia e dove finisce la voce fra i pezzi `da` e `a` (di 20 ms): in campioni. La voce comincia dove un
    pezzo passa −40 dBFS; da lì si torna indietro finché c'è qualcosa sopra −66 (il respiro), per un secondo al più,
    senza uscire dal tratto; e così dopo l'ultima parola."""
    voce = da + np.where(e[da:a] > VOCE_DB)[0]
    i, j, passi = voce[0], voce[-1], int(RESPIRO_S / 0.02)
    while i > da and voce[0] - i < passi and e[i - 1] > RESPIRO_DB:
        i -= 1
    while j < a - 1 and j - voce[-1] < passi and e[j + 1] > RESPIRO_DB:
        j += 1
    return max(da * 0.02 * SR, int((i * 0.02 - TESTA) * SR)), min(min(a * 0.02 * SR, n_campioni), int(((j + 1) * 0.02 + CODA) * SR))


def rifinisci(y, guadagno):
    y = y * guadagno
    # i picchi oltre −4,5 dB si piegano piano fino a −1,5: qualche consonante, mai le parole
    soglia, tetto = 10 ** (-4.5 / 20), 10 ** (PICCO_DB / 20)
    s = np.abs(y) > soglia
    y[s] = np.sign(y[s]) * (soglia + (tetto - soglia) * np.tanh((np.abs(y[s]) - soglia) / (tetto - soglia)))
    k = int(0.005 * SR)
    y[:k] *= np.linspace(0, 1, k)
    y[-k:] *= np.linspace(1, 0, k)
    return y


def lavora(sorgente, tagli=()):
    """La presa intera, e le sue parti se ha dei tagli: ognuna con i suoi capi, tutte con il guadagno della presa
    intera (le parti, messe in fila, sono la presa: niente cambia di livello fra l'una e l'altra)."""
    x = leggi(sorgente)
    e = energia(x)
    a, b = (int(v) for v in capi(e, 0, len(e), len(x)))
    guadagno = 10 ** ((PAROLE_DB - parlato_db(x[a:b])) / 20)
    y = rifinisci(x[a:b].copy(), guadagno)
    parti = []
    if tagli:
        confini = [0] + [int(t / 0.02) for t in tagli] + [len(e)]
        for da, fino in zip(confini, confini[1:]):
            pa, pb = (int(v) for v in capi(e, da, fino, len(x)))
            parti.append(rifinisci(x[pa:pb].copy(), guadagno))
    return y, a / SR, (len(x) - b) / SR, parti


def pause(nome):
    """I silenzi di una consegna (sotto −50 dBFS per almeno 0,45 s): per scegliere i tagli di una presa con un'altra
    voce in mezzo. Poi si verifica con Whisper fra quali parole cadono (strumenti/intro/trascrivi.py)."""
    f = next((os.path.join(CONSEGNE, n) for n in os.listdir(CONSEGNE) if n.lower() == nome.lower() + ".wav"), None)
    if f is None:
        sys.exit(f"{nome}.wav non è fra le consegne")
    x = leggi(f)
    e = energia(x)
    print(f"{os.path.basename(f)}: {len(x) / SR:.2f} s")
    muto, i = e < -50, 0
    while i < len(muto):
        j = i
        while j < len(muto) and muto[j]:
            j += 1
        if (j - i) * 0.02 >= 0.45:
            print(f"  silenzio {i * 0.02:6.2f} – {j * 0.02:6.2f}  ({(j - i) * 0.02:.2f} s), a metà {(i + j) * 0.01:.2f}")
        i = max(j, i + 1)


def scrivi_mp3(y, f):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-c:a", "libmp3lame", "-b:a", "96k", "-write_xing", "1", f],
                   input=np.clip(y, -1, 1).astype(np.float32).tobytes(), check=True)


def impronta(f):
    return hashlib.sha256(open(f, "rb").read()).hexdigest()


def gruppi(segmenti):
    """Per ogni pezzo di William di una presa, il numero della parte in cui sta: la parte cambia dove fra due pezzi
    suoi parla un'altra voce. Una presa senza voci in mezzo è una parte sola."""
    out, parte, voce = [], 1, False
    for s in segmenti:
        if s[0] in DI_WILLIAM and parole(s[1]):
            if voce and out:
                parte += 1
            voce = False
            out.append(parte)
        elif s[0] not in NON_VOCI:
            voce = True
    return out


def main():
    if len(sys.argv) > 2 and sys.argv[1] == "--pause":
        return pause(sys.argv[2])
    copione = json.load(open(COPIONE, encoding="utf-8"))
    sigle, pezzi = [], []
    for cap in copione["capitoli"]:
        for b in cap["blocchi"]:
            for p in b["prese"]:
                for z in p["pezzi"]:
                    if "id" not in z:
                        continue
                    if "uguale" not in z:
                        sigle.append(z["id"])
                    parti = [parole(s[1]) for s in z["segmenti"] if s[0] in DI_WILLIAM and parole(s[1])]
                    if parti:
                        pezzi.append({"id": z["id"], "file": z.get("uguale", z["id"]), "tipo": p["tipo"], "parti": parti,
                                      "gruppi": gruppi(z["segmenti"])})

    # le consegne: una per sigla (il nome del file è la sigla, in minuscolo o in maiuscolo). Le sigle delle prese in più
    # parti hanno la lettera minuscola («SM-074a»): il confronto si fa in maiuscolo, la chiave resta quella del copione
    # (il 18 novembre 2026 sm-074a.wav non veniva riconosciuto)
    per_maiuscolo = {s.upper(): s for s in sigle}
    arrivate = {}
    for nome in sorted(os.listdir(CONSEGNE)):
        m = re.fullmatch(r"([a-z]+-\d+[a-z]?(?:-[cs])?)\.wav", nome, re.I)
        if m and m.group(1).upper() in per_maiuscolo:
            arrivate[per_maiuscolo[m.group(1).upper()]] = os.path.join(CONSEGNE, nome)
    arrivate_m = {k.upper() for k in arrivate}
    estranee = [n for n in os.listdir(CONSEGNE) if n.lower().endswith(".wav") and re.sub(r"\.wav$", "", n, flags=re.I).upper() not in arrivate_m]

    os.makedirs(USCITA, exist_ok=True)
    registro_f = os.path.join(USCITA, "prese.json")
    registro = json.load(open(registro_f, encoding="utf-8")) if os.path.isfile(registro_f) else {}
    # quante parti ha ogni presa nel testo (le voci degli altri in mezzo): i tagli devono essere uno di meno
    parti_nel_testo = {z["id"]: z["gruppi"][-1] for z in pezzi}
    fatte, rifatte = {}, 0
    for sigla, sorgente in arrivate.items():
        f = os.path.join(USCITA, f"WI-{sigla}.mp3")
        hs = impronta(sorgente)
        tagli = TAGLI.get(sigla, [])
        if tagli and len(tagli) + 1 != parti_nel_testo.get(sigla, 1):
            sys.exit(f"{sigla}: {len(tagli)} tagli, ma nel testo le parti sono {parti_nel_testo.get(sigla, 1)}")
        nomi = [f"WI-{sigla}-p{k + 1}.mp3" for k in range(len(tagli) + 1)] if tagli else []
        prima = registro.get(sigla, {})
        if (os.path.isfile(f) and prima.get("sorgente") == hs and prima.get("tagli", []) == tagli
                and all(os.path.isfile(os.path.join(USCITA, n)) for n in nomi)):
            fatte[sigla] = prima
            continue
        y, testa, coda, parti = lavora(sorgente, tagli)
        # la presa intera non si riscrive se c'è già dalla stessa sorgente: cambiano soltanto le parti
        if os.path.isfile(f) and prima.get("sorgente") == hs:
            fatte[sigla] = {k: prima[k] for k in ("sorgente", "secondi", "tolti")}
        else:
            scrivi_mp3(y, f)
            fatte[sigla] = {"sorgente": hs, "secondi": round(len(y) / SR, 2), "tolti": [round(testa, 2), round(coda, 2)]}
            print(f"{os.path.relpath(f, RADICE)}: {len(y) / SR:5.2f} s (tolti {testa:.2f} s in testa e {coda:.2f} in coda)")
        rifatte += 1
        if tagli:
            for n, parte in zip(nomi, parti):
                scrivi_mp3(parte, os.path.join(USCITA, n))
                print(f"{os.path.relpath(os.path.join(USCITA, n), RADICE)}: {len(parte) / SR:5.2f} s")
            fatte[sigla]["tagli"] = tagli
            fatte[sigla]["parti"] = [round(len(parte) / SR, 2) for parte in parti]
    # una presa con un'altra voce in mezzo e senza tagli: da decidere, intanto suona intera
    for z in pezzi:
        if z["id"] in fatte and z["gruppi"][-1] > 1 and z["id"] not in TAGLI:
            print(f"attenzione: {z['id']} ha un'altra voce in mezzo ({z['gruppi'][-1]} parti) e nessun taglio: suona intera")
    # le prese che non sono più fra le consegne lasciano il gioco, e così le parti che non servono più
    for n in os.listdir(USCITA):
        m = re.fullmatch(r"WI-([A-Z]+-\d+[a-z]?(?:-[cs])?)(?:-p(\d+))?\.mp3", n)
        if m and (m.group(1) not in fatte or (m.group(2) and int(m.group(2)) > len(fatte[m.group(1)].get("parti", [])))):
            os.remove(os.path.join(USCITA, n))
            print("tolta", n)
    json.dump(dict(sorted(fatte.items())), open(registro_f, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
    with open(os.path.join(USCITA, "IMPRONTE.sha256"), "w", encoding="utf-8", newline="\n") as o:
        for n in sorted(os.listdir(USCITA)):
            if n.endswith(".mp3"):
                o.write(f"{impronta(os.path.join(USCITA, n))}  {n}\n")

    # il ponte e la pagina: i pezzi che hanno la loro presa; e, per il ponte, le parole dei pezzi che non ce l'hanno
    # ancora (le risposte no): a schermo occupano il loro testo e restano muti, così una presa corta non entra dentro
    # una frase più lunga che la contiene («Una pausa.» dentro «Una pausa, e dietro di lui il magazzino.»)
    # una presa divisa porta, per ogni suo pezzo di testo, il nome della parte che lo dice (`file_parti`)
    con_voce = []
    for z in pezzi:
        if z["file"] not in fatte:
            continue
        v = {k: z[k] for k in ("id", "file", "tipo", "parti")}
        if fatte[z["file"]].get("parti"):
            v["file_parti"] = [f"{z['file']}-p{g}" for g in z["gruppi"]]
        con_voce.append(v)
    divise = sorted(s for s in fatte if fatte[s].get("parti"))
    muti = sorted({tuple(z["parti"]) for z in pezzi if z["file"] not in fatte and z["tipo"] != "opzione"})
    with open(RACCONTO, "w", encoding="utf-8", newline="\n") as o:
        json.dump({"nota": "Scritto da strumenti/audio/voce_william.py: non si corregge a mano.",
                   "impronta_fav": copione["impronta_fav"], "pezzi": con_voce, "muti": [list(m) for m in muti]},
                  o, ensure_ascii=False, indent=0)
        o.write("\n")

    # il motore: tutte le sigle del copione (la tabella cambia solo se cambia il copione), e in fondo le parti
    # delle prese divise
    nomi_parti = [f"{s}-p{k + 1}" for s in divise for k in range(len(fatte[s]["parti"]))]
    with open(TABELLA, "w", encoding="utf-8", newline="\n") as o:
        o.write("//! Scritto da `strumenti/audio/voce_william.py`: non si corregge a mano.\n"
                "//! Le prese di William (documento 41): tutte le sigle del copione (`doppiaggio/william/copione.json`), con\n"
                "//! il nome del loro file in `audio/musica-ia/WI/`. Una presa che non è ancora arrivata ha la sua sigla e\n"
                "//! nessun file: resta muta. In fondo, le parti delle prese con la voce di servizio in mezzo (`-p1`, `-p2`…).\n\n")
        o.write(f"pub const PRESE: [(&str, &str); {len(sigle) + len(nomi_parti)}] = [\n")
        for s in sigle + nomi_parti:
            o.write(f'    ("{s}", "WI-{s}.mp3"),\n')
        o.write("];\n")

    # Tauri: le prese fra le risorse, accanto alla musica
    conf = open(TAURI, encoding="utf-8").read()
    righe = conf.split("\n")
    righe = [r for r in righe if not re.search(r'"\.\./\.\./audio/musica-ia/WI/WI-[A-Z]+-\d+', r)]
    i = next(k for k, r in enumerate(righe) if "WI-01-registro-di-bordo.mp3" in r)
    # di una presa divisa entrano nel gioco le parti, non il file intero
    nuove = [f'      "../../audio/musica-ia/WI/WI-{s}.mp3": "musica/WI-{s}.mp3",'
             for s in sorted([s for s in fatte if s not in divise] + nomi_parti)]
    righe[i + 1:i + 1] = nuove
    open(TAURI, "w", encoding="utf-8", newline="\n").write("\n".join(righe))

    print(f"prese arrivate {len(arrivate)} (rifatte {rifatte}); pezzi con la voce {len(con_voce)} su {len(pezzi)}; sigle {len(sigle)}")
    if estranee:
        print("nella cartella, senza una sigla del copione:", ", ".join(estranee))


if __name__ == "__main__":
    sys.exit(main())
