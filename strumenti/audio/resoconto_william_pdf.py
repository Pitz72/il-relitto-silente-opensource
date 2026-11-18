# Il resoconto tecnico delle consegne di William, in PDF, per Leonardo Tomassetti (l'autore, 18 novembre 2026:
# «fammi un altro PDF con il report per Leonardo, senza messaggi amichevoli o usare il mio tono, fai proprio un
# report tecnico con le cose che mancano»).
#
#   python strumenti/audio/resoconto_william_pdf.py
#
# Legge il copione (doppiaggio/william/copione.json), le prese nel gioco (audio/musica-ia/WI/) e i controlli delle
# consegne (doppiaggio/william/consegne/controllo-*.json, fuori da git). Le consegne e le anomalie sono scritte qui
# sotto (CONSEGNE, ANOMALIE): si aggiornano a ogni consegna. Ne esce
# doppiaggio/william/resoconti/Il Relitto Silente - Resoconto consegne William <data>.pdf (A4).
import glob
import json
import os
import re
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, KeepTogether, PageTemplate, Paragraph, Spacer, Table, TableStyle

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
WILLIAM = os.path.join(RADICE, "doppiaggio", "william")
DATA, DATA_FILE = "18 novembre 2026", "2026-11-18"
USCITA = os.path.join(WILLIAM, "resoconti", f"Il Relitto Silente - Resoconto consegne William {DATA_FILE}.pdf")

# le consegne ricevute (data, sigle, file, nota)
CONSEGNE = [
    ("13 novembre", "SM-001…SM-004", 4, ""),
    ("15 novembre", "SM-005…SM-014", 10, ""),
    ("16 novembre", "SM-017…SM-022, SM-026…SM-031", 12, "Archivio TransferNow identico ai file sciolti."),
    ("17 novembre", "SM-032…SM-042, SM-044…SM-048, SM-050…SM-058", 25, "Archivio TransferNow identico ai file sciolti."),
    ("18 novembre", "SM-059…SM-082 (SM-074 e SM-078 in due parti, a e b)", 25,
     "Archivio TransferNow identico ai file sciolti. Il file sm-062.wav contiene SM-063: vedi 2.1."),
]

FONT = r"C:\Windows\Fonts"
for nome, file in [("Testo", "georgia.ttf"), ("Testo-B", "georgiab.ttf"), ("Testo-I", "georgiai.ttf"),
                   ("Testo-BI", "georgiaz.ttf"), ("Segno", "segoeui.ttf"), ("Segno-B", "segoeuib.ttf"),
                   ("Segno-I", "segoeuii.ttf"), ("Segno-BI", "segoeuiz.ttf")]:
    pdfmetrics.registerFont(TTFont(nome, os.path.join(FONT, file)))
pdfmetrics.registerFontFamily("Testo", normal="Testo", bold="Testo-B", italic="Testo-I", boldItalic="Testo-BI")
pdfmetrics.registerFontFamily("Segno", normal="Segno", bold="Segno-B", italic="Segno-I", boldItalic="Segno-BI")

INCHIOSTRO = colors.HexColor("#1B1B1B")
GRIGIO = colors.HexColor("#8C8C8C")
GRIGIO_SCURO = colors.HexColor("#5E5E5E")
FILO = colors.HexColor("#C9C2B4")
CARTA = colors.HexColor("#F3EFE6")
ACCENTO = colors.HexColor("#1F5C73")
ROSSO = colors.HexColor("#9B2C2C")

S = {
    "titolo": ParagraphStyle("titolo", fontName="Segno-B", fontSize=20, leading=25, textColor=INCHIOSTRO),
    "sotto": ParagraphStyle("sotto", fontName="Segno", fontSize=10.5, leading=15, textColor=GRIGIO_SCURO, spaceAfter=14),
    "h1": ParagraphStyle("h1", fontName="Segno-B", fontSize=13.5, leading=18, textColor=ACCENTO, spaceBefore=14, spaceAfter=6),
    "h2": ParagraphStyle("h2", fontName="Segno-B", fontSize=11, leading=15, textColor=INCHIOSTRO, spaceBefore=8, spaceAfter=4),
    "corpo": ParagraphStyle("corpo", fontName="Testo", fontSize=10.5, leading=15, textColor=INCHIOSTRO, spaceAfter=6),
    "cella": ParagraphStyle("cella", fontName="Segno", fontSize=9, leading=12, textColor=INCHIOSTRO),
    "cella_b": ParagraphStyle("cella_b", fontName="Segno-B", fontSize=9, leading=12, textColor=INCHIOSTRO),
    "cella_n": ParagraphStyle("cella_n", fontName="Segno", fontSize=9, leading=12, textColor=INCHIOSTRO, alignment=2),
    "testa_n": ParagraphStyle("testa_n", fontName="Segno-B", fontSize=8.5, leading=11, textColor=GRIGIO_SCURO, alignment=2),
    "testa": ParagraphStyle("testa", fontName="Segno-B", fontSize=8.5, leading=11, textColor=GRIGIO_SCURO),
    "battuta": ParagraphStyle("battuta", fontName="Testo", fontSize=11.5, leading=16.5, textColor=INCHIOSTRO,
                              leftIndent=10, spaceBefore=2, spaceAfter=6),
}


def p(t, s="corpo"):
    return Paragraph(t, S[s])


def x(t):
    return escape(t.replace("'", "’"))


def n(v, dec=1):
    """Un numero all'italiana: la virgola, il segno meno tipografico."""
    return f"{v:.{dec}f}".replace(".", ",").replace("-", "−")


def tabella(righe, larghezze, numeri=()):
    dati = [[Paragraph(c, S["testa_n"] if i in numeri else S["testa"]) for i, c in enumerate(righe[0])]]
    for r in righe[1:]:
        dati.append([Paragraph(str(c), S["cella_b"] if i == 0 else S["cella_n"] if i in numeri else S["cella"])
                     for i, c in enumerate(r)])
    t = Table(dati, colWidths=larghezze, hAlign="LEFT", repeatRows=1)
    stile = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.4, FILO),
             ("BACKGROUND", (0, 0), (-1, 0), CARTA), ("TOPPADDING", (0, 0), (-1, -1), 3),
             ("BOTTOMPADDING", (0, 0), (-1, -1), 3), ("LEFTPADDING", (0, 0), (-1, -1), 4)]
    t.setStyle(TableStyle(stile))
    return t


class Resoconto(BaseDocTemplate):
    def __init__(self, f):
        super().__init__(f, pagesize=A4, leftMargin=2.0 * cm, rightMargin=2.0 * cm, topMargin=2.2 * cm,
                         bottomMargin=1.9 * cm, title="Il Relitto Silente · Resoconto consegne William",
                         author="Runtime Multimedia", subject="Resoconto tecnico delle consegne del doppiaggio di William",
                         creator="strumenti/audio/resoconto_william_pdf.py")
        cornice = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, leftPadding=0, rightPadding=0,
                        topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate("pagina", [cornice], onPageEnd=self.testata)])

    def testata(self, canv, doc):
        canv.saveState()
        canv.setFont("Segno", 8)
        canv.setFillColor(GRIGIO)
        y = A4[1] - 1.3 * cm
        canv.drawString(self.leftMargin, y, "Il Relitto Silente · Doppiaggio di William · Resoconto tecnico")
        canv.drawRightString(A4[0] - self.rightMargin, y, DATA)
        canv.setStrokeColor(FILO)
        canv.setLineWidth(0.5)
        canv.line(self.leftMargin, y - 4, A4[0] - self.rightMargin, y - 4)
        canv.drawCentredString(A4[0] / 2, 1.0 * cm, str(doc.page))
        canv.restoreState()


def parole(pezzo):
    return sum(len(s[1].split()) for s in pezzo["segmenti"] if s[0] == "william")


def testo(pezzo):
    return " ".join(s[1] for s in pezzo["segmenti"] if s[0] == "william").strip()


def main():
    copione = json.load(open(os.path.join(WILLIAM, "copione.json"), encoding="utf-8"))
    fatte = {f[3:-4].upper() for f in os.listdir(os.path.join(RADICE, "audio", "musica-ia", "WI")) if f.startswith("WI-SM")
             or re.match(r"WI-[A-Z]+-\d", f)}
    fatte = {f for f in fatte if re.match(r"[A-Z]+-\d", f)}
    controlli = []
    for f in sorted(glob.glob(os.path.join(WILLIAM, "consegne", "controllo-*.json"))):
        controlli += json.load(open(f, encoding="utf-8"))

    # le sigle da registrare (non «uguale»), per capitolo
    capitoli, mancanti_atto1, tutte, uguali = [], [], {}, 0
    for cap in copione["capitoli"]:
        tot = cons = w_tot = w_cons = 0
        for b in cap["blocchi"]:
            for pr in b["prese"]:
                for z in pr["pezzi"]:
                    if "id" not in z:
                        continue
                    if "uguale" in z:
                        uguali += 1
                        continue
                    k = parole(z)
                    tutte[z["id"]] = (pr, z)
                    tot += 1
                    w_tot += k
                    if z["id"].upper() in fatte:
                        cons += 1
                        w_cons += k
                    elif cap["sigla"] == "SM":
                        mancanti_atto1.append((z["id"], pr, z))
        capitoli.append((cap["sigla"], cap["titolo"], tot, cons, w_tot, w_cons))
    T = sum(c[2] for c in capitoli)
    C = sum(c[3] for c in capitoli)
    WT = sum(c[4] for c in capitoli)
    WC = sum(c[5] for c in capitoli)

    st = [p("Doppiaggio di William T. Eriksonn", "titolo"),
          p(f"Resoconto tecnico delle consegne · Il Relitto Silente · {DATA}<br/>"
            "Destinatario: Leonardo Tomassetti · Riferimento: «Il Relitto Silente – Il copione di William» "
            "(PDF del 7 novembre 2026, 604 sigle)", "sotto")]

    # 1. stato
    st += [p("1. Stato", "h1"),
           tabella([["Voce", "Valore"],
                    ["Sigle consegnate e integrate", f"{C} su {T} ({n(100 * C / T)} %)"],
                    ["Parole consegnate", f"{WC:,} su {WT:,}".replace(",", ".") + f" ({n(100 * WC / WT)} %)"],
                    ["Atto I · La Santa Maria", f"{capitoli[0][3]} sigle su {capitoli[0][2]} "
                     f"({n(100 * capitoli[0][5] / capitoli[0][4], 0)} % delle parole)"],
                    ["Sigle «uguale a» (non da registrare)", str(uguali)],
                    ["Ultima sigla consegnata", "SM-082"]],
                   [7.0 * cm, 10.0 * cm]),
           p("Consegne ricevute", "h2"),
           tabella([["Data", "Sigle", "File", "Nota"]] + [list(c) for c in CONSEGNE],
                   [2.6 * cm, 6.2 * cm, 1.0 * cm, 7.2 * cm], numeri=(2,))]

    # 2. anomalie
    pr, z = tutte["SM-062"]
    st += [p("2. Anomalie da risolvere", "h1"),
           p("2.1 SM-062: non consegnata", "h2"),
           p("Il file <b>sm-062.wav</b> della consegna del 18 novembre contiene il testo di <b>SM-063</b> («Il re del "
             "reattore. Sempre quello.»), verificato con trascrizione automatica. Il file è stato integrato come "
             "SM-063. <b>SM-062 non è stata consegnata</b> e va registrata:"),
           p(f"<font name='Segno-B' color='#1F5C73'>SM-062</font> · Sala macchine · risposta ad «ascolta il "
             f"reattore», la prima volta, quando la nota del reattore è ancora sconosciuta", "cella"),
           p(x(testo(z)), "battuta")]

    # 3. conformità
    picchi = [r["picco"] for r in controlli]
    sopra = [(r["sigla"], r["picco"]) for r in controlli if r["picco"] > -3]
    bit = sorted({r["bit"] for r in controlli})
    sr = sorted({r["sr"] for r in controlli})
    canali = sorted({r["canali"] for r in controlli})
    n_file = len(controlli)
    fmt_sopra = ", ".join(f"{s[:-1] + s[-1].lower() if s[-1] in 'AB' else s} ({n(v)} dBFS)" for s, v in sopra)
    righe = [["Requisito (copione, «Come registrare»)", "Rilevato su tutte le consegne", "Esito"],
             ["WAV, 48 kHz", f"{', '.join(str(s) for s in sr)} Hz su {n_file} file", "Conforme"],
             ["Mono", f"{', '.join(str(c) for c in canali)} canale su {n_file} file", "Conforme"],
             ["24 bit", f"{', '.join(str(b) for b in bit)} bit su {n_file} file", "<font color='#9B2C2C'>Non conforme</font>"],
             ["Picchi intorno a −6 dBFS, mai sopra −3", f"da {n(min(picchi))} a {n(max(picchi))} dBFS; sopra −3: "
              f"{fmt_sopra or 'nessuno'}; nessun campione a fondo scala",
              "Conforme" if not sopra else f"<font color='#9B2C2C'>{len(sopra)} file fuori soglia</font>"],
             ["Un secondo di silenzio prima e dopo", f"in testa {n(min(r['testa'] for r in controlli))}–"
              f"{n(max(r['testa'] for r in controlli))} s su tutti i file; in coda {n(min(r['coda'] for r in controlli))}–"
              f"{n(max(r['coda'] for r in controlli))} s, sotto 1 s in {sum(r['coda'] < 1.0 for r in controlli)} file su {n_file}, "
              f"sotto 0,5 s in {sum(r['coda'] < 0.5 for r in controlli)}",
              "Testa conforme; <font color='#9B2C2C'>coda non conforme</font>"],
             ["Asciutto, senza trattamenti", f"rumore di fondo da {n(min(r['fondo'] for r in controlli))} a "
              f"{n(max(r['fondo'] for r in controlli))} dBFS; nessun effetto rilevato", "Conforme"],
             ["Un file per presa, nome = sigla", "rispettato, salvo sm-062.wav (vedi 2.1)", "Conforme, 1 eccezione"],
             ["Dieci secondi di silenzio della stanza per sessione", "nessun file ricevuto",
              "<font color='#9B2C2C'>Mancante</font>"],
             ["Foglio con le note di sessione", "nessun foglio ricevuto", "<font color='#9B2C2C'>Mancante</font>"]]
    st += [p("3. Conformità tecnica", "h1"),
           tabella(righe, [5.4 * cm, 8.4 * cm, 3.2 * cm]),
           Spacer(1, 4),
           p("Le prese consegnate sono state integrate così come sono (16 bit, il picco di SM-074b, le code corte): non è "
             "richiesta una nuova registrazione. Dalle prossime consegne: 24 bit, picchi entro −3 dBFS, un secondo di "
             "silenzio anche dopo l’ultima parola, il silenzio della stanza e il foglio delle note.")]

    # 4. restanti
    st += [p("4. Prese da registrare", "h1"),
           p(f"4.1 Atto I · La Santa Maria: {len(mancanti_atto1)} sigle", "h2")]
    righe = [["Sigla", "Momento", "Soggetto"]]
    for sigla, pr, z in mancanti_atto1:
        cond = f" · quando {pr['condizione']}" if pr.get("condizione") else ""
        tipo = {"descrizione": "descrizione", "risposta": "risposta", "evento": "evento"}.get(pr["tipo"], pr["tipo"])
        righe.append([sigla, tipo, x((pr.get("soggetto") or "") + cond)])
    st += [tabella(righe, [2.2 * cm, 2.8 * cm, 12.0 * cm])]
    titolo_42 = p("4.2 Per capitolo", "h2")
    righe = [["Capitolo", "Titolo", "Sigle", "Consegnate", "Da registrare", "Parole da registrare"]]
    for sigla, titolo, tot, cons, w_tot, w_cons in capitoli:
        righe.append([sigla, x(titolo), tot, cons, tot - cons, f"{w_tot - w_cons:,}".replace(",", ".")])
    righe.append(["Totale", "", T, C, T - C, f"{WT - WC:,}".replace(",", ".")])
    st += [KeepTogether([titolo_42, tabella(righe, [1.6 * cm, 6.6 * cm, 1.4 * cm, 2.3 * cm, 2.4 * cm, 2.7 * cm],
                                            numeri=(2, 3, 4, 5))]),
           Spacer(1, 4),
           p("Le sigle «uguale a» non sono contate e non vanno registrate. Le parole sono quelle del testo di William "
             "nel copione.", "cella")]

    os.makedirs(os.path.dirname(USCITA), exist_ok=True)
    doc = Resoconto(USCITA)
    doc.build(st)
    print(f"{os.path.relpath(USCITA, RADICE)}: {doc.page} pagine; {C}/{T} sigle, {WC}/{WT} parole; "
          f"atto I mancanti {len(mancanti_atto1)}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
