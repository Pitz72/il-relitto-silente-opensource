# riconoscimenti.py — l'elenco dei riconoscimenti e delle licenze
# (progettazione/06-app-desktop.md, §18.3), generato dagli elenchi così che non
# resti mai indietro. Dal 19 ottobre 2026 (decisione dell'autore) i nomi scorrono
# nei titoli di coda (app/src/riconoscimenti/Titoli.tsx), e le note intere (le
# righe di copyright, i testi delle licenze) stanno in un file di testo che va
# accanto al gioco, nell'installazione e nella versione portatile.
#
# Uso (dalla radice del progetto):
#   python strumenti/riconoscimenti.py              scrive app/src/riconoscimenti/elenco.json
#                                                   e app/src-tauri/risorse/Riconoscimenti e licenze.txt
#   python strumenti/riconoscimenti.py --verifica   controlla che i due file siano aggiornati
#                                                   (esce con 1 se non lo sono)
#
# Le fonti:
#   relitto-silente/relitto.fav   il titolo e l'autore del gioco
#   audio/LICENZE.md              i suoni, riga per riga
#   audio/musica-ia/REGISTRO.md   i brani generati (Lyria 3.5, Suno) che entrano nel gioco
#   grafica/LICENZE.md            le immagini, riga per riga
#   app/package-lock.json         i pacchetti JavaScript che entrano nell'app (non quelli
#                                 dello sviluppo); i caratteri stanno a parte
#   cargo tree                    i crate Rust dell'eseguibile, per la piattaforma su cui
#                                 si lancia lo strumento: le altre restano come sono nel
#                                 file (per Linux lo si lancia nella WSL, dove si costruisce)
#   motore/, app/public/pyodide   FAVELLA, Pyodide, CPython, lark
#   strumenti/licenze/            i testi delle licenze, uno per licenza
# Le righe di copyright di ogni pacchetto si leggono dai suoi file di licenza
# (LICENSE, COPYING, NOTICE…); dove non ce ne sono, valgono gli autori dichiarati.
# Nessuna rete: cargo lavora --offline, e tutto il resto è già sul disco.

import argparse
import glob
import json
import os
import re
import subprocess
import sys
import zipfile

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(QUI)
APP = os.path.join(RADICE, "app")
USCITA = os.path.join(APP, "src", "riconoscimenti", "elenco.json")
# il nome lo dicono anche i titoli di coda (Titoli.tsx, FILE_LICENZE) e tauri.conf.json
FILE_TESTO = os.path.join(APP, "src-tauri", "risorse", "Riconoscimenti e licenze.txt")
LICENZE = os.path.join(QUI, "licenze")

# Quando un pacchetto si può usare con più licenze («MIT OR Apache-2.0»), il
# gioco lo usa con la prima di questa lista: meno testo, stessi diritti.
PREFERENZA = ("MIT", "Apache-2.0", "Zlib", "BSD-3-Clause", "Unlicense", "0BSD", "CC0-1.0", "MIT-0",
              "BSL-1.0", "ISC", "MPL-2.0", "Unicode-3.0", "OFL-1.1", "PSF-2.0")

# I nomi delle famiglie dei caratteri, dai pacchetti Fontsource.
CARATTERI = {
    "@fontsource-variable/newsreader": ("Newsreader", "il testo"),
    "@fontsource/ibm-plex-mono": ("IBM Plex Mono", "gli strumenti, le letture dello scanner"),
    "@fontsource-variable/big-shoulders-stencil": ("Big Shoulders Stencil", "le targhe della Santa Maria"),
    "@fontsource-variable/atkinson-hyperlegible-next": ("Atkinson Hyperlegible Next", "la leggibilità, nelle opzioni"),
}


# ----------------------------------------------------------------------------
#  Le licenze: le espressioni SPDX e le righe di copyright
# ----------------------------------------------------------------------------
def scelta(espressione):
    """Le licenze con cui il gioco usa un pacchetto: per «A OR B» la preferita,
    per «A AND B» tutte e due. «MIT/Apache-2.0» (la forma vecchia) vale OR."""
    testo = espressione.replace("/", " OR ")
    pezzi = re.findall(r"\(|\)|\bAND\b|\bOR\b|[A-Za-z0-9.+-]+", testo)
    pos = 0

    def rango(insieme):
        return sum(PREFERENZA.index(x) if x in PREFERENZA else 99 for x in insieme) + 10 * len(insieme)

    def primario():
        nonlocal pos
        if pezzi[pos] == "(":
            pos += 1
            r = espr()
            pos += 1  # «)»
            return r
        pos += 1
        return {pezzi[pos - 1]}

    def termine():
        nonlocal pos
        r = primario()
        while pos < len(pezzi) and pezzi[pos] == "AND":
            pos += 1
            r = r | primario()
        return r

    def espr():
        nonlocal pos
        alternative = [termine()]
        while pos < len(pezzi) and pezzi[pos] == "OR":
            pos += 1
            alternative.append(termine())
        return min(alternative, key=rango)

    return sorted(espr(), key=lambda x: PREFERENZA.index(x) if x in PREFERENZA else 99)


_FILE_DI_LICENZA = re.compile(r"^(licen[cs]e|copying|notice|copyright|unlicense|authors)", re.I)
_RIGA = re.compile(r"^\s*(copyright\b|©|\(c\)\s*\d)", re.I)
_MODELLO = re.compile(r"\[yyyy\]|\{yyyy\}|<year>|\[name of|\{name of|copyright holder|copyright notice|copyright owner|"
                      r"copyright and permission|copyright license|copyrights? in|copyright law|copyright to|"
                      r"copyright statement|copyright and related", re.I)


def separa(riga):
    """Una riga con più copyright in fila (i caratteri di Fontsource ne mettono uno
    per file: «… Authors (url) Newsreader-Italic[opsz,wght].ttf: Copyright …»)
    diventa una riga per copyright, senza i nomi dei file."""
    out = []
    for pezzo in re.split(r"(?=\bCopyright\b)", riga):
        pezzo = re.sub(r"\s*\S+\.(?:ttf|otf|woff2?):\s*$", "", pezzo.strip())
        if pezzo:
            out.append(pezzo)
    return out


def copyright_in(cartella):
    """Le righe di copyright dei file di licenza di un pacchetto (al più quattro)."""
    righe = []
    try:
        nomi = sorted(os.listdir(cartella))
    except OSError:
        return []
    for nome in nomi:
        p = os.path.join(cartella, nome)
        if not _FILE_DI_LICENZA.match(nome) or not os.path.isfile(p):
            continue
        with open(p, encoding="utf-8", errors="replace") as f:
            for riga in f:
                r = " ".join(riga.strip().split())
                if not _RIGA.match(r) or _MODELLO.search(r):
                    continue
                for pezzo in separa(r):
                    if len(pezzo) > 12 and chiave_di(pezzo) not in {chiave_di(x) for x in righe}:
                        righe.append(pezzo[:240])
    return righe[:4]


def chiave_di(riga):
    """La stessa nota scritta in due file («Copyright 2023 X» e «Copyright (c) 2023 X.»)."""
    return re.sub(r"\W+", " ", re.sub(r"\(c\)|©", " ", riga.lower())).strip()


# ----------------------------------------------------------------------------
#  Le fonti
# ----------------------------------------------------------------------------
def tabella(percorso, intestazione):
    """Le righe della tabella che sta sotto il titolo `intestazione` di un .md."""
    with open(percorso, encoding="utf-8") as f:
        testo = f.read()
    parte = testo.split(intestazione, 1)[1].split("\n## ", 1)[0]
    righe = [r for r in parte.splitlines() if r.startswith("|")]
    colonne = [c.strip() for c in righe[0].strip("|").split("|")]
    out = []
    for r in righe[2:]:
        celle = [c.strip() for c in r.strip("|").split("|")]
        out.append(dict(zip(colonne, celle)))
    return out


def collegamento(cella):
    m = re.match(r"\[([^\]]+)\]\(([^)]+)\)", cella)
    return (m.group(1), m.group(2)) if m else (cella, None)


def senza_codice(s):
    return s.replace("`", "")


def suoni():
    """I suoni registrati che il gioco usa davvero. Dal 15 ottobre 2026 tutto il
    suono è sintetizzato: le righe del registro con «nessuno» restano come storia e
    non entrano nei riconoscimenti."""
    out = []
    for r in tabella(os.path.join(RADICE, "audio", "LICENZE.md"), "## I file"):
        if r["Usato in"].startswith("nessuno"):
            continue
        fonte, url = collegamento(r["Fonte"])
        out.append({"sigla": r["Sigla"], "titolo": r["Titolo"], "autore": r["Autore"], "fonte": fonte, "url": url,
                    "licenza": r["Licenza"], "ridistribuibile": r["Ridistribuibile"], "uso": r["Usato in"]})
    return out


# Dove suona ogni scheda della musica (progettazione/22-musica-con-lyria.md, §10).
USO_MUSICA = {
    "M1": "il menu principale", "S2": "la soglia dell'Atto II", "S3": "la soglia dell'Atto III",
    "S4": "la soglia dell'Atto IV", "S5": "la soglia dell'Atto V, la fuga",
    "A1": "l'Anziano: il primo letto", "A2": "l'Anziano: il secondo letto", "A3": "l'Anziano: il terzo letto",
    "A4": "l'Anziano: il quarto letto", "C1": "il finale «Vivi»", "C2": "il finale «La prima nota»",
    "C3": "il finale «La stiva piena»", "C4": "il finale «Doppio fondo»", "C5": "il finale «Due lettere»",
    "T": "il tema", "CT": "i titoli di coda",
}


def musica():
    """I brani generati che entrano nel gioco: quelli del registro che stanno in
    `audio/musica-ia/<sigla>/` (non gli originali e le alternative, che restano fuori)."""
    out = []
    for r in tabella(os.path.join(RADICE, "audio", "musica-ia", "REGISTRO.md"), "## I brani"):
        cella = senza_codice(r["File"])
        m = re.match(r"(\S+\.mp3)\s*\(«([^»]+)»", cella)
        if not m or "/originali/" in m.group(1) or "/anteprime/" in m.group(1):
            continue
        if not os.path.isfile(os.path.join(RADICE, "audio", "musica-ia", m.group(1))):
            continue
        modello = "Suno" if r["Modello"].startswith("Suno") else "Lyria 3.5"
        out.append({"sigla": r["Scheda"], "titolo": m.group(2), "modello": modello,
                    "fonte": "Suno" if modello == "Suno" else "Google Flow Music",
                    "autore": "Simone Pizzi", "licenza": "CC BY-NC-SA 4.0", "uso": USO_MUSICA.get(r["Scheda"], "")})
    return out


def immagini():
    return [{"file": os.path.basename(senza_codice(r["File"])), "che_cosa": r["Che cosa"], "da_dove": senza_codice(r["Da dove"]),
             "autore": r["Autore"], "licenza": r["Licenza"]}
            for r in tabella(os.path.join(RADICE, "grafica", "LICENZE.md"), "## I file")]


def gioco():
    with open(os.path.join(RADICE, "relitto-silente", "relitto.fav"), encoding="utf-8") as f:
        fav = f.read()
    titolo = re.search(r'^Il titolo è "([^"]+)"', fav, re.M).group(1)
    autore = re.search(r'^L\'autore è "([^"]+)"', fav, re.M).group(1)
    return {"titolo": titolo, "autore": autore,
            "racconto": "dal racconto «Il Relitto», in Dal registro della Santa Maria"}


def pacchetti_js():
    """I pacchetti JavaScript che entrano nell'app, e i caratteri."""
    with open(os.path.join(APP, "package-lock.json"), encoding="utf-8") as f:
        lock = json.load(f)
    js, caratteri = [], []
    for chiave, v in sorted(lock["packages"].items()):
        if not chiave or v.get("dev"):
            continue
        nome = chiave.split("node_modules/")[-1]
        cartella = os.path.join(APP, *chiave.split("/"))
        with open(os.path.join(cartella, "package.json"), encoding="utf-8") as f:
            pj = json.load(f)
        repo = pj.get("repository")
        repo = repo.get("url") if isinstance(repo, dict) else repo
        voce = {"nome": nome, "versione": v["version"], "licenza": v.get("license") or pj.get("license"),
                "copyright": copyright_in(cartella), "sorgente": pulisci_url(repo)}
        voce["usata"] = scelta(voce["licenza"])
        if nome in CARATTERI:
            famiglia, ruolo = CARATTERI[nome]
            caratteri.append({**voce, "famiglia": famiglia, "ruolo": ruolo})
        else:
            autore = pj.get("author")
            if not voce["copyright"] and autore:
                voce["autori"] = [autore if isinstance(autore, str) else autore.get("name", "")]
            elif not voce["copyright"] and pj.get("authors"):
                # i plugin di Tauri dichiarano «authors» (un elenco), non «author»
                voce["autori"] = [a if isinstance(a, str) else a.get("name", "") for a in pj["authors"]]
            js.append(voce)
    return js, caratteri


def pulisci_url(u):
    if not u:
        return None
    u = re.sub(r"^git\+", "", u)
    u = re.sub(r"\.git$", "", u)
    u = re.sub(r"^git://", "https://", u)
    return u


def crate_rust():
    """I crate dell'eseguibile per la piattaforma di questa macchina."""
    host = re.search(r"^host: (\S+)", subprocess.run(["rustc", "-vV"], capture_output=True, text=True, check=True).stdout,
                     re.M).group(1)
    r = subprocess.run(["cargo", "tree", "--offline", "-e", "normal", "--prefix", "none", "--target", host,
                        "-f", "{p}\t{l}\t{r}"], cwd=os.path.join(APP, "src-tauri"), capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"cargo tree non riesce: {r.stderr.strip()}")
    registro = glob.glob(os.path.join(os.environ.get("CARGO_HOME", os.path.expanduser("~/.cargo")),
                                      "registry", "src", "*"))
    visti, out = set(), []
    for riga in r.stdout.splitlines():
        parti = riga.split("\t")
        if len(parti) < 2:
            continue
        testa = parti[0].split()
        nome, versione = testa[0], testa[1].lstrip("v")
        if nome == "il-relitto-silente" or (nome, versione) in visti:
            continue
        visti.add((nome, versione))
        licenza = parti[1].strip() or "?"
        cartella = next((c for base in registro for c in [os.path.join(base, f"{nome}-{versione}")] if os.path.isdir(c)),
                        None)
        voce = {"nome": nome, "versione": versione, "licenza": licenza, "usata": scelta(licenza),
                "copyright": copyright_in(cartella) if cartella else [],
                "sorgente": parti[2].strip() if len(parti) > 2 and parti[2].strip() else None}
        if not voce["copyright"]:
            # senza righe di copyright né autori dichiarati: gli autori del progetto, alla sua sorgente
            voce["autori"] = (autori_cargo(os.path.join(cartella, "Cargo.toml")) if cartella else []) or [f"gli autori di {nome}"]
        out.append(voce)
    out.sort(key=lambda v: (v["nome"].lower(), v["versione"]))
    return host, out


def autori_cargo(percorso):
    try:
        with open(percorso, encoding="utf-8") as f:
            testo = f.read()
    except OSError:
        return []
    m = re.search(r"^authors\s*=\s*\[(.*?)\]", testo, re.M | re.S)
    if not m:
        return []
    return [re.sub(r"\s*<[^>]*>", "", a).strip() for a in re.findall(r'"([^"]+)"', m.group(1))][:4]


def caratteri_dei_loghi():
    """Sora e Inter, i caratteri dei loghi d'apertura (app/src/loghi/caratteri/,
    copiati dal Viaggiatore con la loro licenza)."""
    p = os.path.join(APP, "src", "loghi", "caratteri", "LICENZA.txt")
    if not os.path.isfile(p):
        return []
    ruoli = {"Sora": "la scritta del logo di Favella1", "Inter": "il motto del logo di Favella1"}
    out = []
    with open(p, encoding="utf-8") as f:
        for riga in f:
            m = re.match(r"^(\w[\w ]*?) — (Copyright .+)$", riga.strip())
            if m and m.group(1) in ruoli:
                sorgente = re.search(r"\((https?://[^)]+)\)", m.group(2))
                out.append({"nome": m.group(1).lower(), "famiglia": m.group(1), "versione": "", "licenza": "OFL-1.1",
                            "usata": ["OFL-1.1"], "copyright": [m.group(2)], "ruolo": ruoli[m.group(1)],
                            "sorgente": sorgente.group(1) if sorgente else None})
    return out


def principali(js, rust):
    """I pezzi su cui il gioco sta in piedi, prima dell'elenco completo."""
    out = []
    # il motore del gioco
    with open(os.path.join(RADICE, "motore", "strutture.py"), encoding="utf-8") as f:
        versione = re.search(r'^VERSIONE_MOTORE = "([^"]+)"', f.read(), re.M).group(1)
    # l'autore si firma Simone Pizzi (i suoi appunti, 15 ottobre 2026): la licenza del motore
    # dice «Simone (Pitz72)», ed è la stessa persona; e il motore si chiama Favella1 (l'autore,
    # 19 ottobre 2026), dove la licenza dice «FAVELLA 1»
    favella = [r.replace("Simone (Pitz72)", "Simone Pizzi").replace("FAVELLA 1", "Favella1")
               for r in copyright_in(os.path.join(RADICE, "motore"))]
    out.append({"nome": "Favella1", "versione": versione, "licenza": "MIT", "usata": ["MIT"],
                "copyright": favella, "ruolo": "il motore del gioco",
                "sorgente": "https://github.com/Pitz72/FAVELLA1"})
    # Python nella pagina
    with open(os.path.join(APP, "node_modules", "pyodide", "package.json"), encoding="utf-8") as f:
        pyo = json.load(f)
    with open(os.path.join(APP, "public", "pyodide", "pyodide-lock.json"), encoding="utf-8") as f:
        info = json.load(f)["info"]
    out.append({"nome": "Pyodide", "versione": pyo["version"], "licenza": pyo.get("license", "MPL-2.0"),
                "usata": scelta(pyo.get("license", "MPL-2.0")), "copyright": [], "autori": ["i contributori di Pyodide"],
                "ruolo": "Python dentro l’app", "sorgente": pulisci_url((pyo.get("repository") or {}).get("url"))
                or "https://github.com/pyodide/pyodide"})
    # la nota di copyright della PSF sta nel testo della licenza, su più righe e con
    # tutti gli anni: qui il primo e l'ultimo
    with open(os.path.join(LICENZE, "PSF-2.0.txt"), encoding="utf-8") as f:
        psf = re.search(r'"Copyright \(c\) ([\d,\s]+?)\s*Python Software Foundation;\s*All Rights Reserved"', f.read())
    anni = re.findall(r"\d{4}", psf.group(1)) if psf else []
    out.append({"nome": "CPython", "versione": info["python"], "licenza": "PSF-2.0", "usata": ["PSF-2.0"],
                "copyright": [f"Copyright (c) {anni[0]}-{anni[-1]} Python Software Foundation; All Rights Reserved"]
                if anni else [],
                "ruolo": "l’interprete, dentro Pyodide", "sorgente": "https://github.com/python/cpython"})
    ruota = glob.glob(os.path.join(APP, "public", "pyodide", "lark-*.whl"))[0]
    with zipfile.ZipFile(ruota) as z:
        meta = z.read(next(n for n in z.namelist() if n.endswith("METADATA"))).decode("utf-8")
        lic = next(n for n in z.namelist() if "licenses/" in n or n.upper().endswith("LICENSE"))
        # lo stesso filtro dei pacchetti: una riga del testo MIT che comincia con «COPYRIGHT
        # HOLDERS BE LIABLE…» non è un copyright (revisione 25, L2)
        righe = [" ".join(r.split()) for r in z.read(lic).decode("utf-8").splitlines()
                 if _RIGA.match(" ".join(r.split())) and not _MODELLO.search(r)]
    out.append({"nome": "lark", "versione": re.search(r"^Version: (\S+)", meta, re.M).group(1), "licenza": "MIT",
                "usata": ["MIT"], "copyright": righe[:2], "ruolo": "la grammatica di Favella1",
                "sorgente": "https://github.com/lark-parser/lark"})
    for nome, ruolo, elenco in (("tauri", "la finestra e il processo dell’app", rust), ("kira", "il motore audio", rust),
                                ("react", "l’interfaccia", js)):
        v = next((x for x in elenco if x["nome"] == nome), None)
        if v:
            out.append({**v, "nome": {"tauri": "Tauri", "kira": "kira", "react": "React"}[nome], "ruolo": ruolo})
    return out


def testi(usate):
    out = {}
    for spdx in sorted(usate):
        p = os.path.join(LICENZE, f"{spdx}.txt")
        if not os.path.isfile(p):
            raise SystemExit(f"manca il testo della licenza {spdx}: aggiungilo in strumenti/licenze/{spdx}.txt")
        with open(p, encoding="utf-8") as f:
            out[spdx] = f.read()
    return out


# ----------------------------------------------------------------------------
#  L'elenco
# ----------------------------------------------------------------------------
def elenco(vecchio):
    js, caratteri = pacchetti_js()
    host, rust = crate_rust()
    # le altre piattaforme restano come sono (si generano là, nella WSL per Linux)
    tutte_rust = dict((vecchio or {}).get("rust", {}))
    tutte_rust[host] = rust
    usate = {"OFL-1.1", "PSF-2.0", "MPL-2.0", "MIT"}
    for gruppo in (js, caratteri, *tutte_rust.values()):
        for v in gruppo:
            usate.update(v["usata"])
    return {
        "gioco": gioco(),
        "suoni": suoni(),
        "musica": musica(),
        "immagini": immagini(),
        "caratteri": caratteri + caratteri_dei_loghi(),
        "principali": principali(js, rust),
        "javascript": js,
        "rust": dict(sorted(tutte_rust.items())),
        "testi": testi(usate),
    }


def testo_di(dati):
    return json.dumps(dati, ensure_ascii=False, indent=1) + "\n"


PIATTAFORME = {"x86_64-pc-windows-msvc": "Windows", "x86_64-unknown-linux-gnu": "Linux", "aarch64-apple-darwin": "macOS"}
NOMI_LICENZE = {"MIT": "MIT", "Apache-2.0": "Apache 2.0", "MPL-2.0": "Mozilla Public License 2.0", "OFL-1.1": "SIL Open Font License 1.1",
                "PSF-2.0": "Python Software Foundation License", "Unicode-3.0": "Unicode License v3", "BSD-3-Clause": "BSD a tre clausole",
                "Zlib": "zlib", "Unlicense": "Unlicense", "0BSD": "BSD a zero clausole", "CC0-1.0": "CC0 1.0"}


def file_di_testo(d):
    """Le note intere, per il file accanto al gioco: chi, che cosa, con quale licenza, le
    righe di copyright e, in fondo, i testi delle licenze. Testo semplice, da leggere con
    il Blocco note."""
    righe = []
    a = righe.append

    def titolo(t):
        a("")
        a("")
        a(t.upper())
        a("-" * len(t))
        a("")

    def pacchetto(p, ruolo=None):
        nome = p.get("famiglia", p["nome"])
        a(f"{nome} {p['versione']}" + (f" — {ruolo}" if ruolo else ""))
        a("  Licenza: " + " e ".join(NOMI_LICENZE.get(x, x) for x in p["usata"])
          + (f" (dichiarata: {p['licenza']})" if p["licenza"] and " " in p["licenza"] else ""))
        for c in p["copyright"] or [f"© {x}" for x in p.get("autori") or []]:
            a(f"  {c}")
        if p.get("sorgente"):
            a(f"  {p['sorgente']}")
        a("")

    g = d["gioco"]
    a(g["titolo"].upper())
    a(f"di {g['autore']}")
    a(g["racconto"])
    a("")
    a("Riconoscimenti e licenze")
    a("")
    a("Questo file accompagna il gioco. I nomi scorrono nei titoli di coda; qui ci sono le note intere:")
    a("chi ha fatto che cosa, con quale licenza il gioco lo usa, le righe di copyright e, in fondo,")
    a("i testi delle licenze. Lo scrive strumenti/riconoscimenti.py dagli elenchi veri: non si corregge a mano.")
    a("I loghi d’apertura vengono da Il Viaggiatore, dello stesso autore. I marchi di Runtime Multimedia")
    a("e di Favella1 sono dei loro titolari, e non rientrano nelle licenze del gioco.")

    titolo("Le fondamenta")
    for p in d["principali"]:
        pacchetto(p, p["ruolo"])

    titolo("La musica")
    a("Generata con l’intelligenza artificiale (Lyria 3.5 di Google, in Flow Music, e Suno),")
    a(f"scelta e diretta da {g['autore']}. I brani di Lyria portano la filigrana SynthID.")
    a("")
    for m in d["musica"]:
        a(f"«{m['titolo']}» — {m['uso']}")
        a(f"  di {m['autore']}, con {m['modello']} ({m['fonte']}) · {m['licenza']}")

    titolo("I suoni")
    if not d["suoni"]:
        a("Ogni suono del gioco è sintetizzato nel suo motore audio, senza registrazioni.")
    for x in d["suoni"]:
        a(f"«{x['titolo']}» — {x['uso']}")
        a(f"  di {x['autore']}, da {x['fonte']} · {x['licenza']}" + (f" · {x['url']}" if x["url"] else ""))

    titolo("Le immagini")
    for i in d["immagini"]:
        a(i["che_cosa"][:1].upper() + i["che_cosa"][1:])
        a(f"  {i['autore']} · {i['licenza']} · {i['da_dove']}")

    titolo("I caratteri")
    for c in d["caratteri"]:
        pacchetto(c, c["ruolo"])

    titolo("Le librerie della pagina")
    for p in d["javascript"]:
        pacchetto(p)

    for piattaforma, crate in d["rust"].items():
        titolo(f"Le librerie del programma · {PIATTAFORME.get(piattaforma, piattaforma)} ({len(crate)})")
        for p in crate:
            pacchetto(p)

    titolo("I testi delle licenze")
    a("Dove un pacchetto si può usare con più licenze, il gioco lo usa con quella scritta accanto al suo nome.")
    for spdx, testo in d["testi"].items():
        a("")
        a("=" * 72)
        a(NOMI_LICENZE.get(spdx, spdx) + f" ({spdx})")
        a("=" * 72)
        a("")
        righe.extend(testo.rstrip("\n").split("\n"))
    return "\n".join(righe).rstrip("\n") + "\n"


def leggi_testo(percorso):
    if not os.path.isfile(percorso):
        return None
    with open(percorso, encoding="utf-8-sig", newline="") as f:
        return f.read().replace("\r\n", "\n")


def scrivi_testo(percorso, testo):
    """Con il BOM e gli a capo di Windows: il Blocco note lo apre bene anche se è vecchio."""
    os.makedirs(os.path.dirname(percorso), exist_ok=True)
    with open(percorso, "w", encoding="utf-8-sig", newline="\r\n") as f:
        f.write(testo)


def main():
    ap = argparse.ArgumentParser(description="L'elenco dei riconoscimenti e delle licenze.")
    ap.add_argument("--verifica", action="store_true", help="controlla soltanto che il file sia aggiornato")
    a = ap.parse_args()
    sys.stdout.reconfigure(encoding="utf-8")
    vecchio = None
    if os.path.isfile(USCITA):
        with open(USCITA, encoding="utf-8") as f:
            vecchio = json.load(f)
    nuovo = elenco(vecchio)
    if a.verifica:
        if vecchio is None or testo_di(vecchio) != testo_di(nuovo):
            print("L'elenco dei riconoscimenti non è aggiornato: python strumenti/riconoscimenti.py")
            return 1
        if leggi_testo(FILE_TESTO) != file_di_testo(nuovo):
            print(f"Il file «{os.path.basename(FILE_TESTO)}» non è aggiornato: python strumenti/riconoscimenti.py")
            return 1
        print("L'elenco dei riconoscimenti e il file delle licenze sono aggiornati.")
        return 0
    os.makedirs(os.path.dirname(USCITA), exist_ok=True)
    with open(USCITA, "w", encoding="utf-8", newline="\n") as f:
        f.write(testo_di(nuovo))
    scrivi_testo(FILE_TESTO, file_di_testo(nuovo))
    n_rust = {k: len(v) for k, v in nuovo["rust"].items()}
    print(f"Scritto {os.path.relpath(USCITA, RADICE)}: {len(nuovo['suoni'])} suoni, {len(nuovo['immagini'])} immagini, "
          f"{len(nuovo['caratteri'])} caratteri, {len(nuovo['javascript'])} pacchetti JavaScript, crate Rust {n_rust}, "
          f"{len(nuovo['testi'])} testi di licenza; e {os.path.relpath(FILE_TESTO, RADICE)}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
