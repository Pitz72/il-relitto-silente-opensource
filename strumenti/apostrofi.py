# Converte gli apostrofi dritti in apostrofi tipografici nella prosa dei documenti
# Markdown (contratto tipografico di prosa-italiana): mai nei blocchi di codice, mai
# nel codice in linea, mai negli indirizzi dei link. Le virgolette dritte non si
# toccano: nei documenti sono quasi sempre sintassi di FAVELLA.
#
#   python strumenti/apostrofi.py <file.md> [...]          (mostra soltanto)
#   python strumenti/apostrofi.py --scrivi <file.md> [...]  (scrive)
import io
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

# i pezzi da lasciare stare: blocchi recintati, codice in linea (anche su due righe,
# mai oltre un paragrafo), indirizzi dei link, tag HTML
PROTETTI = re.compile(r"```.*?```|`[^`\n]*(?:\n(?!\s*\n)[^`\n]*)*`|\]\([^)]*\)|<[^>\n]+>", re.S)
# l’apostrofo fra due lettere (l'aria), prima di un caporale (dell'«ora»), dopo «po» (un po' di)
APOSTROFO = re.compile(r"(?<=\w)'(?=\w|«)|(?<=\bpo)'")


def converti(testo):
    pezzi, ultimo, n = [], 0, 0
    for m in PROTETTI.finditer(testo):
        prosa, k = APOSTROFO.subn("’", testo[ultimo:m.start()])
        pezzi += [prosa, m.group(0)]
        n += k
        ultimo = m.end()
    prosa, k = APOSTROFO.subn("’", testo[ultimo:])
    pezzi.append(prosa)
    return "".join(pezzi), n + k


if __name__ == "__main__":
    scrivi = "--scrivi" in sys.argv
    for f in [a for a in sys.argv[1:] if a != "--scrivi"]:
        grezzo = io.open(f, "rb").read()
        testo = grezzo.decode("utf-8")
        nuovo, n = converti(testo)
        # l’unica differenza ammessa: ' diventa ’, nelle stesse posizioni
        assert len(nuovo) == len(testo) and all(a == b or (a, b) == ("'", "’") for a, b in zip(testo, nuovo)), f
        print(f"{f}: {n} apostrofi")
        if scrivi and n:
            io.open(f, "w", encoding="utf-8", newline="").write(nuovo)
