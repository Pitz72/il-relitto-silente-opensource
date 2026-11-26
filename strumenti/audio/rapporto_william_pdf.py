# Il rapporto breve per Leonardo Tomassetti (documento 41, §5): a che punto è il doppiaggio di William, che cosa è da
# rifare, che cosa manca nella serie che ha registrato. Una pagina, da allegare al copione. L'autore, 20 novembre 2026:
# «fammi un piccolo rapporto per Leo, percentuale di completamento e file da rifare e lo allego al PDF».
#
#   python strumenti/audio/rapporto_william_pdf.py
#
# I numeri vengono dal copione (doppiaggio/william/copione.json) e dalle prese nel gioco (audio/musica-ia/WI/prese.json);
# le prese da rifare e le loro note da copione_pdf.py (DA_RIFARE), così il rapporto e il copione dicono le stesse cose.
import datetime
import json
import os
import re
import sys
from xml.sax.saxutils import escape

from reportlab.lib.units import cm
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import copione_pdf as cp  # noqa: E402  (i caratteri, gli stili, le prese fatte e quelle da rifare)

MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre",
        "novembre", "dicembre"]
OGGI = datetime.date.today()
DATA = f"{OGGI.day} {MESI[OGGI.month - 1]} {OGGI.year}"
USCITA = os.path.join(cp.CARTELLA, "resoconti", f"Il Relitto Silente - A che punto siamo {OGGI.isoformat()}.pdf")
# Le prese che sono cambiate dopo che Leonardo le aveva già nel copione: il 19 novembre 2026 la cifra dell'aria è
# passata alla voce della tuta, e le frasi di William che la contenevano sono state riscritte senza.
CAMBIATE = "le frasi che contenevano la cifra dell’aria"
# Le note sulle consegne dell'ultima volta: che cosa abbiamo sistemato noi, perché Leonardo lo sappia.
NOTE = {"IN-079 e IN-084": "Hai lasciato le pause giuste dove parlano le altre voci: nel gioco ci entrano in mezzo. "
                           "Continua così, un secondo e mezzo o poco più va benissimo."}


def numero(x, decimali=1):
    return f"{x:.{decimali}f}".replace(".", ",")


def main():
    dati = json.load(open(os.path.join(cp.CARTELLA, "copione.json"), encoding="utf-8"))
    fatte = cp.FATTE                       # già senza quelle da rifare
    righe, tot, buone, parole_tot, parole_buone = [], 0, 0, 0, 0
    mancano_serie = []                     # le sigle senza file prima dell'ultima consegnata, capitolo per capitolo
    for c in dati["capitoli"]:
        sigle, n, f = [], 0, 0
        for b in c["blocchi"]:
            for q in b["prese"]:
                for z in q["pezzi"]:
                    if "id" not in z or z.get("uguale") or not z.get("william"):
                        continue
                    w = len(re.findall(r"\w+", z["william"]))
                    n += 1
                    parole_tot += w
                    sigle.append((z["id"], z["id"] in fatte or z["id"] in cp.DA_RIFARE, z["william"]))
                    if z["id"] in fatte:
                        f += 1
                        parole_buone += w
        tot += n
        buone += f
        consegnate = [i for i, (_, ok, _) in enumerate(sigle) if ok]
        if consegnate:
            mancano_serie += [(s, t) for s, ok, t in sigle[:consegnate[-1]] if not ok]
        righe.append((c["titolo"], f, n))

    st = [Paragraph("Il Relitto Silente", cp.S["h1"]),
          Paragraph(f"Il doppiaggio di William · a che punto siamo · {DATA}", cp.S["h2"]),
          Spacer(1, 6),
          cp.p(f"Ciao Leonardo, ecco il punto sulle prese. Nel gioco ce ne sono <b>{buone} su {tot}</b>, il "
               f"<b>{numero(100 * buone / tot)} %</b> del copione (contando le parole, il "
               f"{numero(100 * parole_buone / parole_tot)} %)"
               + (", senza contare quelle da rifare" if cp.DA_RIFARE else "")
               + ". Tutte quelle che hai mandato sono già nel gioco, e il formato va benissimo."),
          cp.p("Il copione allegato ha soltanto quello che resta da registrare, con le stesse sigle di prima. Dal 19 "
               "novembre le cifre dell’aria non sono più tue: le legge la voce della tuta, e le frasi dove c’era la "
               "cifra sono state riscritte senza. Quelle che avevi registrato non servono: grazie lo stesso.")]

    if NOTE:
        st += [Paragraph("Dall’ultima consegna", cp.S["h2"])]
        st += cp.punti([f"<b>{k}</b> · {escape(v)}" for k, v in NOTE.items()])
    if cp.DA_RIFARE:
        st += [Paragraph("Da rifare", cp.S["h2"])]
        st += cp.punti([f"<b>{k}</b> · {escape(v)}" for k, v in cp.DA_RIFARE.items()])
    if mancano_serie:
        st += [Paragraph("Mancano nella serie che hai registrato", cp.S["h2"]),
               cp.p("Sigle rimaste indietro, prima dell’ultima che hai consegnato:")]
        st += cp.punti([f"<b>{s}</b> · «{escape(t.strip().replace(chr(39), '’'))}»"
                        + (f" <i>(è una delle {CAMBIATE}: il testo è nuovo)</i>" if s == "SM-094" else "")
                        for s, t in mancano_serie])

    st += [Paragraph("Capitolo per capitolo", cp.S["h2"])]
    tabella = [["Capitolo", "Fatte", "In tutto", "%"]]
    for titolo, f, n in righe:
        tabella.append([titolo, str(f), str(n), f"{round(100 * f / n)} %" if n else ""])
    tabella.append(["<b>In tutto</b>", f"<b>{buone}</b>", f"<b>{tot}</b>", f"<b>{numero(100 * buone / tot)} %</b>"])
    t = cp.tabella(tabella, [11.0 * cm, 1.8 * cm, 1.8 * cm, 1.9 * cm], prima="piccolo")
    st += [t, Spacer(1, 10), cp.p("Simone")]

    os.makedirs(os.path.dirname(USCITA), exist_ok=True)
    doc = BaseDocTemplate(USCITA, pagesize=cp.A4, leftMargin=2.2 * cm, rightMargin=2.2 * cm, topMargin=1.5 * cm,
                          bottomMargin=1.4 * cm, title="Il Relitto Silente · A che punto siamo",
                          author="Simone Pizzi", creator="strumenti/audio/rapporto_william_pdf.py")
    doc.addPageTemplates([PageTemplate("p", [Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="t")])])
    doc.build(st)
    print(f"{os.path.relpath(USCITA, cp.RADICE)}: {doc.page} pagine; {buone} su {tot} "
          f"({numero(100 * buone / tot)} %), da rifare {len(cp.DA_RIFARE)}, mancano nella serie {len(mancano_serie)}")


if __name__ == "__main__":
    main()
