# Il copione di L.V. in PDF, per un doppiatore (l'autore, 18 novembre 2026: «mi fai gentilmente un PDF del solo
# parlato di L.V. con indicazioni per il doppiatore? forse abbiamo trovato una voce umana per farlo»).
#
#   python strumenti/audio/copione_lv_pdf.py
#
# Il testo si legge dai .fav del gioco (il prologo in relitto.fav, la scatola nera in vita.fav), così il copione
# resta uguale al gioco; le indicazioni sono quelle già scritte per la voce di oggi (documento 32, §2.1–2.2;
# consegne/Voce L.V. serra 2026-11-07/copione.txt), riscritte per un attore. Ne esce
# doppiaggio/lv/Il Relitto Silente - Il copione di L.V..pdf (A4). Stessi caratteri del copione di William.
import os
import re
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, KeepTogether, NextPageTemplate, PageBreak, PageTemplate,
                                Paragraph, Spacer, Table, TableStyle)

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
CARTELLA = os.path.join(RADICE, "doppiaggio", "lv")
USCITA = os.path.join(CARTELLA, "Il Relitto Silente - Il copione di L.V..pdf")
DATA = "18 novembre 2026"
VIDEO = "https://www.youtube.com/watch?v=PuwYTqvPrjY"

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

S = {
    "titolo": ParagraphStyle("titolo", fontName="Segno-B", fontSize=34, leading=40, textColor=INCHIOSTRO, alignment=TA_CENTER),
    "sottotitolo": ParagraphStyle("sottotitolo", fontName="Testo-I", fontSize=20, leading=26, textColor=ACCENTO, alignment=TA_CENTER),
    "copertina": ParagraphStyle("copertina", fontName="Segno", fontSize=12, leading=18, textColor=GRIGIO_SCURO, alignment=TA_CENTER),
    "h1": ParagraphStyle("h1", fontName="Segno-B", fontSize=20, leading=25, textColor=ACCENTO, spaceBefore=4, spaceAfter=10),
    "h2": ParagraphStyle("h2", fontName="Segno-B", fontSize=13, leading=17, textColor=INCHIOSTRO, spaceBefore=12, spaceAfter=5),
    "corpo": ParagraphStyle("corpo", fontName="Testo", fontSize=11, leading=16, textColor=INCHIOSTRO, spaceAfter=7),
    "elenco": ParagraphStyle("elenco", fontName="Testo", fontSize=11, leading=16, textColor=INCHIOSTRO, leftIndent=14,
                             bulletIndent=2, spaceAfter=4, bulletFontName="Testo"),
    "piccolo": ParagraphStyle("piccolo", fontName="Segno", fontSize=9, leading=12.5, textColor=GRIGIO_SCURO),
    "sigla": ParagraphStyle("sigla", fontName="Segno-B", fontSize=9.5, leading=12, textColor=ACCENTO),
    "contesto": ParagraphStyle("contesto", fontName="Testo-I", fontSize=10.5, leading=14.5, textColor=GRIGIO_SCURO),
    "come": ParagraphStyle("come", fontName="Segno-I", fontSize=9.5, leading=13, textColor=GRIGIO_SCURO, spaceBefore=3),
    "battuta": ParagraphStyle("battuta", fontName="Testo", fontSize=13, leading=17.5, textColor=INCHIOSTRO),
}


def p(testo, stile="corpo"):
    return Paragraph(testo, S[stile])


def punti(voci):
    return [Paragraph(v, S["elenco"], bulletText="•") for v in voci]


def x(t):
    return escape(t.replace("'", "’"))


# ---------------------------------------------------------------------------------------------------------------
#  Il testo, dai .fav
# ---------------------------------------------------------------------------------------------------------------
def leggi(nome, chiave):
    f = os.path.join(RADICE, "relitto-silente", nome)
    if not os.path.isfile(f):
        f = next(os.path.join(d, nome) for d, _, fs in os.walk(os.path.join(RADICE, "relitto-silente")) if nome in fs)
    for riga in open(f, encoding="utf-8"):
        if riga.startswith(chiave):
            return riga
    raise SystemExit(f"{nome}: non trovo «{chiave}»")


def prologo():
    """Le frasi del prologo come le divide l'intro (B1…B9 di app/src/intro/scaletta.ts), controllate contro il
    prologo del gioco (relitto.fav). Le scritte sullo schermo (B0, B10) restano fuori."""
    scaletta = open(os.path.join(RADICE, "app", "src", "intro", "scaletta.ts"), encoding="utf-8").read()
    blocco = re.search(r"export const PROLOGO = \{(.*?)\n\}", scaletta, re.S).group(1)
    frasi = [m.group(2).strip("«»") for m in re.finditer(r'(B\d+): "(.*?)",', blocco) if m.group(1) not in ("B0", "B10")]
    riga = leggi("relitto.fav", "Il prologo è")
    dentro = re.search(r"«(.*?)»", riga.replace("\\n", " "), re.S).group(1)

    def piano(s):
        return re.sub(r"\s+", " ", s.replace("’", "'")).strip()

    assert piano(" ".join(frasi)) == piano(dentro), "il prologo dell'intro non è quello del gioco"
    return frasi


def scatola():
    """I quattro pezzi della scatola nera della serra, fra «»."""
    riga = leggi("vita.fav", "Invece di ascolta la scatola nera:")
    return re.findall(r"«(.*?)»", riga.replace("\\n", "\n"), re.S)


# ---------------------------------------------------------------------------------------------------------------
#  Il documento
# ---------------------------------------------------------------------------------------------------------------
class Copione(BaseDocTemplate):
    def __init__(self, f):
        super().__init__(f, pagesize=A4, leftMargin=2.2 * cm, rightMargin=2.2 * cm, topMargin=2.3 * cm,
                         bottomMargin=2.0 * cm, title="Il Relitto Silente · Il copione di L.V.", author="Simone Pizzi",
                         subject="Il copione di L.V. per il doppiaggio", creator="strumenti/audio/copione_lv_pdf.py")
        cornice = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="testo", leftPadding=0,
                        rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate("copertina", [cornice]),
                               PageTemplate("pagina", [cornice], onPageEnd=self.testata)])

    def testata(self, canv, doc):
        canv.saveState()
        canv.setFont("Segno", 8)
        canv.setFillColor(GRIGIO)
        y = A4[1] - 1.35 * cm
        canv.drawString(self.leftMargin, y, "Il Relitto Silente · Il copione di L.V.")
        canv.drawRightString(A4[0] - self.rightMargin, y, DATA)
        canv.setStrokeColor(FILO)
        canv.setLineWidth(0.5)
        canv.line(self.leftMargin, y - 4, A4[0] - self.rightMargin, y - 4)
        canv.drawCentredString(A4[0] / 2, 1.1 * cm, str(doc.page))
        canv.restoreState()


def presa(sigla, testo, contesto, come):
    """Una presa: la sigla, il momento, la battuta, come si dice."""
    righe = [p(sigla, "sigla"), p(x(contesto), "contesto"), Spacer(1, 4), p(x(testo), "battuta"), p(x(come), "come")]
    t = Table([[righe]], colWidths=[16.6 * cm])
    t.setStyle(TableStyle([("LINEBEFORE", (0, 0), (0, 0), 2, ACCENTO), ("LEFTPADDING", (0, 0), (-1, -1), 10),
                           ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return [KeepTogether([t]), Spacer(1, 5)]


# Le indicazioni, frase per frase. Il prologo: le frasi del .fav in ordine (B1…B9 dell'intro).
INTRO = [
    ("LV-01 · B1", "Ha appena acceso il registratore della tuta e controlla la spia.",
     "Stanco ma lucido. Comincia a metà, come se il nastro lo prendesse mentre parla già. «o almeno così dice»: "
     "un’ironia secca, senza sorriso."),
    ("LV-01 · B2", "Fa il punto, come in un rapporto di servizio.",
     "Piatto, tecnico. La gola è secca: qui si sente la sete. Le due frasi sono due voci di un elenco."),
    ("LV-01 · B3–B4", "Legge la cifra dell’aria sul visore, e la perde.",
     "La testa che si annebbia: la prima frase rallenta e si perde verso la fine. Una pausa vera, poi rilegge. "
     "«diciannove» è un dato, detto piano: niente dramma."),
    ("LV-01 · B5–B6", "La confessione. Nel gioco arriva più tardi, dopo le scene della nave.",
     "Più lento, più basso. Lo dice a se stesso. «Ho insistito io»: si dà la colpa, senza compatirsi."),
    ("LV-01 · B7", "Quello che ha trovato là dentro.",
     "La fatica del corpo: il fiato preso dentro la frase. Meraviglia, ma trattenuta: non annuncia, constata."),
    ("LV-01 · B8", "Dove sta.", "Concreto, semplice. Una misura, non una scoperta."),
    ("LV-01 · B9", "L’ultima cosa del nastro.",
     "Le forze che finiscono: le ultime parole scendono. Nessuna disperazione: un uomo che ammette un limite."),
]
SERRA = [
    ("LV-02 · 1", "Il nastro riparte a metà frase. È lo stesso nastro dell’intro, sentito più avanti nel gioco, "
     "più rovinato: le parole dell’acqua e dell’aria tornano, dette in un altro modo.",
     "Come B2–B3: rapporto tecnico, piatto, stanco. Comincia e finisce a metà."),
    ("LV-02 · 2", "Un buco nel nastro, poi la confessione intera.",
     "Detta a se stesso. In «al medico ho detto» la «o» di «ho» si deve sentire. «Una mi aveva detto di restare» e «Le ho "
     "detto che aveva ragione, e poi sono partito»: più piano, un rimpianto che non si lamenta."),
    ("LV-02 · 3", "Un buco più lungo. Racconta perché non ha potuto aprire la teca.",
     "Concreto, quasi irritato. «capisci?» detto a qualcuno che non c’è. «Sono tornato su a tentoni…»: lento, il "
     "ricordo della paura, senza mostrarla."),
    ("LV-02 · 4", "L’ultimo pezzo che si capisce.",
     "Il punto più stanco di tutto il nastro. «Matthew» detto piano, poi una pausa lunga. Il resto semplice, nudo, "
     "senza enfasi. Mai sentimentale."),
    ("LV-02 · 5", "Dopo, «la voce dice ancora qualcosa, troppo piano». Nel gioco la abbassiamo sotto il fruscio "
     "finché non si capisce più.", "Sussurrato, ma registrato chiaro: lo spegniamo noi."),
]


def contenuto():
    frasi = prologo()
    pezzi = scatola() + ["…se mi senti…"]
    # le frasi del prologo, a gruppi come nell'intro: B1, B2, B3+B4, B5+B6, B7, B8, B9
    gruppi = [frasi[0], frasi[1], frasi[2] + " " + frasi[3], frasi[4] + " " + frasi[5], frasi[6], frasi[7], frasi[8]]
    assert len(frasi) == 9 and len(pezzi) == 5, (len(frasi), len(pezzi))
    parole = sum(len(re.findall(r"\w+", t)) for t in gruppi + pezzi)

    st = [Spacer(1, 5.5 * cm), p("Il Relitto Silente", "titolo"), Spacer(1, 0.6 * cm),
          p("Il copione di L.V.", "sottotitolo"), Spacer(1, 1.6 * cm),
          p(f"Due registrazioni · {len(gruppi) + len(pezzi)} prese · circa {parole} parole", "copertina"),
          p(f"Un gioco di Simone Pizzi · Runtime Multimedia · {DATA}", "copertina"),
          NextPageTemplate("pagina"), PageBreak()]

    st += [p("Chi è L.V.", "h1"),
           p("Un astronauta italiano sui trentacinque anni, intelligente, riservato. È partito da solo e ha firmato "
             "tutte le carte che servivano per farlo: ha insistito lui. È salito sulla nave aliena che nel gioco si "
             "chiama il relitto e non ne è più uscito. Quando William lo trova, è seduto contro una colonna in una "
             "serra morta, dentro la sua tuta, da un secolo e mezzo."),
           p("Di lui resta il nastro della scatola nera della tuta: le cose che ha detto negli ultimi giorni, a "
             "pezzi, quando aveva fiato. Non sa se qualcuno lo sentirà mai. Il gioco lo chiama soltanto L.V., le "
             "iniziali sulla sua placca: il nome non si dice mai."),
           p("Dove si sente", "h2"),
           *punti([
               "<b>Nell’intro</b> (LV-01): la prima voce del gioco. Si sente sul nero, mentre una spia verde respira, e "
               "più avanti, quando la Santa Maria è un punto davanti al relitto. È lì che chi gioca capisce da dove "
               "viene quella voce, e che un uomo è morto là dentro.",
               "<b>Nella serra</b> (LV-02): William attacca il cavo della sua tuta alla scatola nera di L.V. e la "
               "ascolta in cuffia, spendendo la sua aria. Quattro pezzi, separati da buchi del nastro, poi un "
               "sussurro che non si capisce.",
           ]),
           p(f"La versione di oggi, con una voce sintetica, si sente nel video dell’intro: {VIDEO} . È un "
             "riferimento per il contesto, non un modello da imitare."),
           PageBreak()]

    st += [p("La voce", "h1"),
           p("Un uomo adulto, italiano neutro, senza cadenza regionale. Timbro medio-basso, un poco roco per il freddo "
             "e la sete. Parla vicino al microfono, a voce bassa, come chi registra un diario per sé dentro un casco: "
             "voce intima, mai proiettata. Nessuna parola è alzata di volume."),
           p("Il corpo", "h2"),
           p("Il testo dice tre cose del suo corpo, e ognuna ha un suono:"),
           *punti([
               "<b>la sete</b> («L’acqua è finita ieri»): la gola secca, qualche deglutizione, una o due in tutto;",
               "<b>il freddo</b> («Il riscaldamento stanotte»): un tremito appena, non i denti che battono;",
               "<b>l’aria che manca</b> («diciannove»): il fiato preso a metà frase, le frasi che si spezzano;",
               "<b>la testa che si annebbia</b> («prima di dirlo, l’ho già perso»): più lento, le parole che "
               "scivolano via, la voce che cala a fine frase.",
           ]),
           p("Chi muore così non grida. Prima viene il fiato corto, poi il torpore: la mente rallenta, il respiro "
             "si fa piccolo, viene sonno. L.V. è un uomo lucido che si stanca, non un attore che ansima. La sua "
             "placca graffiata fa la stessa curva: «I primi solchi sono profondi, decisi; gli ultimi appena "
             "accennati, di quando la mano non teneva più». La voce deve fare come la mano."),
           p("I respiri", "h2"),
           p("Sono la parte più importante. La voce di oggi è rimasta nel gioco soprattutto per i suoi respiri: "
             "brevi, udibili, prima delle frasi lunghe. Le pause non sono teatrali: sono necessarie, deve riprendere "
             "aria. I puntini di sospensione nel testo sono esitazioni dovute al fiato, non pause costruite. Non "
             "tagliare nessun respiro: li dosiamo noi in montaggio."),
           p("L’animo", "h2"),
           p("Asciutto. Non si compatisce e non piange. Racconta come in un rapporto di servizio, anche le cose che "
             "gli fanno male. La stanchezza sale dall’inizio alla fine, e il punto più basso è «Matthew»."),
           p("Da evitare", "h2"),
           *punti(["il tono da narratore o da speaker, l’enfasi epica;", "il pianto;",
                   "l’affanno continuo e caricaturale;", "il sussurro dall’inizio alla fine."]),
           p("Le pronunce", "h2"),
           *punti(["<b>Matthew</b>: all’inglese, come un nome proprio, detto piano. È un nome: il testo non dice di "
                   "chi, e non serve saperlo per dirlo.",
                   "<b>teca</b>: tèca.",
                   "<b>L.V.</b> non si dice mai."]),
           PageBreak()]

    st += [p("LV-01 · La registrazione dell’intro", "h1"),
           p("Una registrazione sola, dall’inizio alla fine, nell’ordine del testo: la stanchezza deve crescere "
             "dentro la stessa recitazione. Fra un gruppo e l’altro lascia almeno due o tre secondi: nel gioco i pezzi "
             "si separano (fra B4 e B5 passano più di due minuti), e li tagliamo noi. Le scritte che compaiono sullo "
             "schermo prima e dopo («Scatola nera di una tuta extraveicolare…», «Fine della traccia.») non si "
             "leggono.", "contesto"),
           Spacer(1, 8)]
    for (sigla, quando, come), testo in zip(INTRO, gruppi):
        st += presa(sigla, testo, quando, come)

    st += [PageBreak(), p("LV-02 · La scatola nera della serra", "h1"),
           p("Una registrazione sola, con i cinque pezzi in fila. Ogni pezzo comincia e finisce a metà, come se il "
             "nastro si fosse rovinato proprio lì: entra già dentro la frase e lasciala sospesa. Fra un pezzo e "
             "l’altro tre o quattro secondi di silenzio: i buchi del nastro li facciamo noi.", "contesto"),
           Spacer(1, 8)]
    for (sigla, quando, come), testo in zip(SERRA, pezzi):
        st += presa(sigla, testo, quando, come)

    st += [PageBreak(), p("Come registrare", "h1"),
           *punti([
               "<b>Formato</b>: WAV, 48 kHz, 16 o 24 bit, mono.",
               "<b>Asciutto</b>: niente effetti, niente compressione, niente equalizzazione, niente riverbero. La "
               "radio, il nastro vecchio e il fruscio li mette il gioco.",
               "<b>Vicino</b>: 10–15 cm dal microfono, con l’antipop, a voce bassa. Sempre la stessa distanza.",
               "<b>Livello</b>: i picchi intorno a −6 dBFS, mai sopra −3. Non normalizzare.",
               "<b>Il silenzio della stanza</b>: all’inizio della sessione, dieci secondi di silenzio, a microfono "
               "aperto.",
               "<b>Un secondo di silenzio</b> prima e dopo ogni registrazione. I respiri restano.",
               "<b>Due o tre prese intere</b> di ciascuna registrazione. Se un gruppo non va, si può rifare soltanto "
               "quello, in un file a parte.",
               "<b>I nomi dei file</b>: <font name='Segno-B'>LV-01_1.wav</font>, <font name='Segno-B'>LV-01_2.wav</font>… "
               "per l’intro; <font name='Segno-B'>LV-02_1.wav</font>… per la serra; un gruppo rifatto con la sua sigla "
               "(<font name='Segno-B'>LV-01_B7.wav</font>, <font name='Segno-B'>LV-02_4.wav</font>).",
               "<b>La consegna</b>: i file e un foglio con le note della sessione (la presa preferita, i dubbi).",
           ]),
           p("I tempi", "h2"),
           p("Nessun tempo da rispettare: l’intro si adatta alla voce. Per orientarsi, la versione di oggi dura "
             "circa un minuto e mezzo per LV-01, respiri e pause comprese, e un minuto e venti per LV-02.")]
    return st, len(gruppi) + len(pezzi), parole


def main():
    os.makedirs(CARTELLA, exist_ok=True)
    st, prese, parole = contenuto()
    doc = Copione(USCITA)
    doc.build(st)
    print(f"{os.path.relpath(USCITA, RADICE)}: {doc.page} pagine, {prese} prese, {parole} parole")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
