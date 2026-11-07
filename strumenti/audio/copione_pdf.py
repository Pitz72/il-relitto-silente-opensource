# Il copione di William in PDF, per Leonardo Tomassetti: dai dati di strumenti/audio/copione_william.py
# (doppiaggio/william/copione.json) e dalle due righe di contesto scritte a mano per ogni blocco
# (doppiaggio/william/contesti.json).
#
#   python strumenti/audio/copione_william.py && python strumenti/audio/copione_pdf.py
#
# Ne esce doppiaggio/william/Il Relitto Silente - Il copione di William.pdf (A4, con l'indice e i segnalibri).
# I caratteri sono quelli di Windows (Georgia per il testo da leggere, Segoe UI per le indicazioni).
import json
import os
import re
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, CondPageBreak, Flowable, Frame, KeepTogether, NextPageTemplate,
                                PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle)
from reportlab.platypus.tableofcontents import TableOfContents

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.normpath(os.path.join(QUI, "..", ".."))
CARTELLA = os.path.join(RADICE, "doppiaggio", "william")
USCITA = os.path.join(CARTELLA, "Il Relitto Silente - Il copione di William.pdf")
VERSIONE = json.load(open(os.path.join(RADICE, "versione.json"), encoding="utf-8"))["gioco"]
DATA = "7 novembre 2026"

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
ACCENTO = colors.HexColor("#1F5C73")     # il colore delle sigle e delle intestazioni
VOCE = colors.HexColor("#A0522D")        # «detto ad alta voce»
EVIDENZA = "#FFE9A8"                     # il segnaposto della cifra

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
    "blocco": ParagraphStyle("blocco", fontName="Segno-B", fontSize=13.5, leading=17, textColor=INCHIOSTRO),
    "dove": ParagraphStyle("dove", fontName="Segno", fontSize=8, leading=10, textColor=GRIGIO),
    "contesto": ParagraphStyle("contesto", fontName="Testo-I", fontSize=10.5, leading=14.5, textColor=GRIGIO_SCURO),
    "sigla": ParagraphStyle("sigla", fontName="Segno-B", fontSize=9.5, leading=12, textColor=ACCENTO),
    "quando": ParagraphStyle("quando", fontName="Segno-I", fontSize=8.5, leading=11, textColor=GRIGIO, spaceAfter=2),
    "battuta": ParagraphStyle("battuta", fontName="Testo", fontSize=12.5, leading=18, textColor=INCHIOSTRO),
    "uguale": ParagraphStyle("uguale", fontName="Segno-I", fontSize=9, leading=12, textColor=GRIGIO),
    "toc0": ParagraphStyle("toc0", fontName="Segno-B", fontSize=11, leading=15, leftIndent=0, spaceBefore=6),
    "toc1": ParagraphStyle("toc1", fontName="Segno", fontSize=9, leading=11.5, leftIndent=16, textColor=GRIGIO_SCURO),
}

CHI = {"servizio": "voce di servizio", "registro": "computer di bordo", "etichetta": "", "breve": "registrazione"}
TIPI = {"descrizione": "Descrizione", "risposta": "Quando chi gioca scrive", "evento": "Quando succede",
        "demone": "Ogni tanto, da sé", "dopo": "Più tardi", "battuta": "Nel dialogo", "opzione": "Risposta nel dialogo",
        "finale": "Finale"}


# ---------------------------------------------------------------------------------------------------------------
#  Il testo delle battute
# ---------------------------------------------------------------------------------------------------------------
def x(t):
    """Il testo per Paragraph: l'apostrofo tipografico, gli a capo, il segnaposto della cifra in evidenza."""
    t = escape(t.replace("'", "’"))
    t = re.sub(r"\[(aria|risveglio)\]", lambda m: f'<font backColor="{EVIDENZA}" name="Segno-B">[{m.group(1)}]</font>', t)
    return t.replace("\n", "<br/>")


def chi_parla(s):
    tipo, testo, chi = s
    if tipo == "voce":
        if chi.startswith("NV-"):
            return "voce della nave"
        if chi.startswith("YU-"):
            return "Yusuf"
        if chi.startswith("LV-"):
            return "L.V."
        return chi
    return CHI.get(tipo, "")


def battuta(pezzo):
    """I segmenti di un pezzo: il tuo in nero; quello degli altri in grigio, con chi lo dice."""
    out = []
    for s in pezzo["segmenti"]:
        tipo, testo = s[0], s[1]
        if tipo in ("william", "citazione", "parlato"):
            out.append(x(testo))
        elif tipo == "spazio":
            out.append(x(testo))
        else:
            c = chi_parla(s)
            etichetta = f'<font name="Segno-B" size="7" color="#8C8C8C">{escape(c.upper())}</font> ' if c else ""
            out.append(f'<font color="#9A9A9A">{etichetta}{x(testo)}</font>')
    return "".join(out).strip().replace("<br/><br/>", "<br/><br/>")


def descrivi_presa(p):
    tipo = TIPI.get(p["tipo"], p["tipo"])
    cosa = p["soggetto"] or ""
    if p["tipo"] == "battuta":
        nome = cosa.split(" · ")[0].replace("'", "’")
        nome = {"L’anziano": "l’Anziano", "L’eco": "l’eco del Piccolo"}.get(nome, nome)
        cosa = f"con {nome}, al nodo «{cosa.split(' · ')[-1]}»"
    elif p["tipo"] == "opzione":
        cosa = f"al nodo «{cosa.split()[-1]}»"
    elif p["tipo"] in ("demone", "finale", "evento") and not cosa:
        cosa = ""
    elif p["tipo"] == "descrizione":
        cosa = cosa.replace("'", "’")
    else:
        cosa = f"«{cosa.replace(chr(39), '’')}»" if cosa else ""
    riga = f"{tipo} {cosa}".strip()
    if p.get("condizione"):
        riga += f" · quando {p['condizione'].replace(chr(39), '’')}"
    return riga


# ---------------------------------------------------------------------------------------------------------------
#  Il documento
# ---------------------------------------------------------------------------------------------------------------
class Voce(Flowable):
    """Un segno invisibile per l'indice e i segnalibri."""

    def __init__(self, livello, testo, chiave):
        super().__init__()
        self.voce = (livello, testo, chiave)

    def wrap(self, *a):
        return (0, 0)

    def draw(self):
        pass


class Copione(BaseDocTemplate):
    def __init__(self, f):
        super().__init__(f, pagesize=A4, leftMargin=2.2 * cm, rightMargin=2.2 * cm, topMargin=2.3 * cm,
                         bottomMargin=2.0 * cm, title="Il Relitto Silente · Il copione di William",
                         author="Simone Pizzi", subject="Il copione di William per il doppiaggio (Leonardo Tomassetti)",
                         creator="strumenti/audio/copione_pdf.py")
        cornice = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="testo", leftPadding=0,
                        rightPadding=0, topPadding=0, bottomPadding=0)
        self.capitolo = ""
        self.addPageTemplates([PageTemplate("copertina", [cornice]),
                               PageTemplate("pagina", [cornice], onPageEnd=self.testata)])

    def testata(self, canv, doc):
        canv.saveState()
        canv.setFont("Segno", 8)
        canv.setFillColor(GRIGIO)
        y = A4[1] - 1.35 * cm
        canv.drawString(self.leftMargin, y, "Il Relitto Silente · Il copione di William")
        canv.drawRightString(A4[0] - self.rightMargin, y, self.capitolo)
        canv.setStrokeColor(FILO)
        canv.setLineWidth(0.5)
        canv.line(self.leftMargin, y - 4, A4[0] - self.rightMargin, y - 4)
        canv.drawCentredString(A4[0] / 2, 1.1 * cm, str(doc.page))
        canv.restoreState()

    def afterFlowable(self, f):
        if isinstance(f, Voce):
            livello, testo, chiave = f.voce
            if livello == 0:
                self.capitolo = testo
            self.notify("TOCEntry", (livello, testo, self.page, chiave))
            self.canv.bookmarkPage(chiave)
            self.canv.addOutlineEntry(testo, chiave, level=livello, closed=livello > 0)


def h1(testo, chiave):
    return [Voce(0, testo, chiave), Paragraph(escape(testo), S["h1"])]


def p(testo, stile="corpo"):
    return Paragraph(testo, S[stile])


def punti(voci):
    return [Paragraph(v, S["elenco"], bulletText="•") for v in voci]


def tabella(righe, larghezze, testata=True, prima="sigla"):
    dati = [[Paragraph(c, S["piccolo"] if i else S[prima]) if isinstance(c, str) else c for i, c in enumerate(r)]
            for r in righe]
    t = Table(dati, colWidths=larghezze, hAlign="LEFT")
    stile = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, 0), (-1, -1), 0.4, FILO),
             ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
             ("LEFTPADDING", (0, 0), (-1, -1), 4)]
    if testata:
        stile += [("BACKGROUND", (0, 0), (-1, 0), CARTA)]
    t.setStyle(TableStyle(stile))
    return t


# ---------------------------------------------------------------------------------------------------------------
#  Le pagine davanti
# ---------------------------------------------------------------------------------------------------------------
def copertina(tot):
    return [Spacer(1, 5.5 * cm), p("Il Relitto Silente", "titolo"), Spacer(1, 0.6 * cm),
            p("Il copione di William", "sottotitolo"), Spacer(1, 1.6 * cm),
            p("per <b>Leonardo Tomassetti</b>", "copertina"), Spacer(1, 3.2 * cm),
            p(f"{tot['blocchi']} blocchi di contesto · {tot['da_registrare']} prese da registrare · "
              f"circa {tot['parole_da_registrare']:,} parole".replace(",", "."), "copertina"),
            p(f"Il gioco alla versione {VERSIONE} · {DATA}", "copertina"), Spacer(1, 2.6 * cm),
            p("Simone Pizzi", "copertina"),
            p("Documento di lavoro per il doppiaggio: non è da diffondere.", "copertina"),
            NextPageTemplate("pagina"), PageBreak()]


def durata(minuti):
    m = int(round(minuti / 5) * 5)
    ore, resto = divmod(m, 60)
    o = "un’ora" if ore == 1 else f"{ore} ore"
    return o + (f" e {resto} minuti" if resto else "")


def pagine_davanti(tot):
    st = []
    st += h1("Prima di cominciare", "prima")
    st += [p("In queste pagine c’è tutto quello che William dice nel <i>Relitto Silente</i>: il racconto in prima "
             "persona, le poche frasi che dice ad alta voce, le parole che legge. Il resto del gioco parla già. "
             "L’Anziano, Yusuf, le quindici voci della nave, L.V. e la voce di servizio della tuta sono registrati. "
             "Nel copione le loro battute compaiono in grigio, perché tu sappia che cosa succede intorno alle tue "
             "righe: non sono da leggere."),
           p("Il gioco non è un testo lineare. Chi gioca sceglie dove andare e che cosa fare, e ogni presa è un "
             "momento che può arrivare oppure no. Molte prese sono varianti dello stesso momento: la stanza con la "
             "luce accesa o spenta, la stessa domanda prima o dopo aver capito qualcosa. Il copione segue l’ordine "
             "della storia, atto per atto e stanza per stanza; in fondo vengono le cose che attraversano tutta la "
             "nave: il Sintonizzatore, la matrice di traduzione, l’aria della tuta."),
           p("Ogni blocco comincia con due righe di contesto: dove sei, che cosa sta succedendo, con che fiato lo "
             "dici. Sono un riferimento, non una regia. La regia la facciamo insieme in sala.")]
    st.append(tabella([
        ["In numeri", ""],
        ["Blocchi di contesto", str(tot["blocchi"])],
        ["Prese da registrare", f"{tot['da_registrare']} (più {tot['uguali']} uguali ad altre, che non si registrano)"],
        ["Parole da registrare", f"circa {tot['parole_da_registrare']:,}".replace(",", ".")],
        ["Frasi dette ad alta voce", f"{tot['parlato']} (le risposte nei dialoghi)"],
        ["Parole lette fra «»", f"circa {tot['citazione']} (incisioni tradotte, scritte, la firma sul registro)"],
        ["Durata stimata", f"circa {durata(tot['minuti'])} di parlato finito, più le cifre dell’aria "
                           "(appendice A)"],
    ], [5 * cm, 11.5 * cm]))

    st.append(PageBreak())
    st += h1("William", "william")
    st += [p("<b>William T. Eriksonn</b>, recuperante. Intorno al 2201 vive da solo sulla <i>Santa Maria</i>, un "
             "cargo di novantasei anni con la sigla TSC-1972. La stiva è vuota da sei settimane, e Yusuf, il "
             "fornitore del Magazzino Quattro, non gli fa più credito. Il radar intercetta una massa nera che beve "
             "la luce e il segnale: William ci sale per tagliarne un pezzo da vendere."),
           p("Dentro c’è una nave antichissima, non umana, morta da molto tempo. Le voci di chi c’era sono rimaste "
             "impresse nelle pareti, e con il Sintonizzatore si possono ascoltare. In una serra secca c’è un uomo "
             "arrivato prima di lui, centocinquant’anni fa, morto a mezzo metro da quello che cercava: le sue "
             "iniziali sono L.V. William è venuto a prendere. Che cosa porti via, e che cosa lasci, lo decide chi "
             "gioca: i finali sono sei."),
           p("È lo stesso William del <i>Mistero della Santa Maria</i>, qualche anno prima: più solo, con meno "
             "parole, con il debito con Yusuf ancora aperto.")]
    st += [p("Come parla", "h2")]
    st += punti([
        "<b>Prima persona, al presente.</b> Racconta mentre succede, dentro il casco: non legge un diario, dice "
        "quello che ha davanti adesso.",
        "<b>Asciutto.</b> Frasi da uomo di mestiere, che conosce i suoi attrezzi e conta tutto: l’aria, i metri, "
        "i debiti. L’ironia è secca e rara. Il testo è stato ripulito dalle frasi a effetto: non serve caricarlo.",
        "<b>L’aria.</b> La cifra dell’aria scende per tutto il gioco. Quando è poca, le descrizioni si accorciano "
        "fino a parole sole («Gola. Buio. Il fruscio, in fondo. Ovest.»): lì il fiato è corto davvero, ma senza "
        "teatro.",
        "<b>I momenti forti</b> (l’uomo nella serra, il nido del Piccolo, l’Anziano, i finali) si dicono piano. "
        "L’emozione resta sotto, come nella vita di uno che vive solo da anni.",
        "<b>Il suo nome non lo dice mai.</b> Lo dice Yusuf, e lo legge il computer di bordo nella riga del "
        "registro che chiude ogni finale. Sulle sue pagine del registro William firma con le iniziali, W. T.",
        "<b>Detto ad alta voce.</b> Le risposte nei dialoghi sono le sole frasi che William pronuncia davvero. A "
        "Yusuf parla alla radio, al microfono, come a uno che conosce da vent’anni e a cui deve dei soldi. "
        "All’Anziano parla dentro il casco, a una voce che gli si apre nella testa. Al Piccolo risponde come a un "
        "bambino. Nel copione queste frasi hanno il segno <font color='#A0522D' name='Segno-B'>DETTO AD ALTA "
        "VOCE</font>.",
        "<b>Fra parentesi</b>, dentro le battute dell’Anziano e degli altri, c’è il racconto di William: i gesti, "
        "le pause («(Una pausa.)», «(Gli mostro il sonaglio.)»). È suo, con la voce del racconto.",
        "<b>Fra «»</b>, quando nessun’altra voce le dice, ci sono parole che William legge: un’incisione tradotta, "
        "una scritta, la prima pagina del registro. Le legge lui, con il tono di chi legge ad alta voce un testo "
        "che non è suo.",
    ])

    st.append(PageBreak())
    st += h1("Come si legge il copione", "legenda")
    st += [p("Ogni <b>blocco</b> ha una sigla (per esempio <font name='Segno-B' color='#1F5C73'>SM-03</font>: SM è "
             "il capitolo, la Santa Maria), un titolo, le due righe di contesto e le prese. Sotto il titolo, in "
             "piccolo, il punto del gioco da cui viene il blocco: serve a noi."),
           p("Ogni <b>presa</b> ha la sua sigla (per esempio <font name='Segno-B' color='#1F5C73'>SM-027</font>), "
             "che diventa il nome del file. Sopra il testo, in grigio corsivo, c’è il momento in cui il gioco la "
             "dice: che cosa ha scritto chi gioca, e a quale condizione («quando ho il risuonatore», «quando "
             "l’aria è sotto 30»). Le condizioni sono scritte come le legge il motore del gioco, a volte con "
             "una grammatica da macchina («le tracce è almeno 3»): servono a capire il momento, non a recitarlo.")]
    st.append(tabella([
        ["Come appare", "Che cosa vuol dire"],
        ["<font name='Testo' size='11'>Testo nero</font>", "È tuo: lo leggi."],
        ["<font name='Testo' size='11' color='#9A9A9A'><font name='Segno-B' size='7'>YUSUF</font> «Magazzino "
         "Quattro.»</font>", "Lo dice un’altra voce, già registrata: non lo leggi. Ti serve per sapere dove "
         "entri e dove esci."],
        ["<font name='Testo' size='11' color='#9A9A9A'><font name='Segno-B' size='7'>VOCE DI SERVIZIO</font> "
         "PROTEZIONE VITALE.</font>", "La voce della tuta (le scritte del visore, lo scanner, la matrice, i "
         "suggerimenti). Non la leggi; spesso la tua frase comincia subito dopo."],
        [f"<font name='Segno-B' backColor='{EVIDENZA}'>[aria]</font>", "Qui il gioco mette la cifra dell’aria. Leggi "
         "la frase dicendo «quaranta» al posto della cifra, con il ritmo naturale: le cifre vere le registri a "
         "parte (appendice A) e le montiamo noi."],
        ["<font name='Segno-B' color='#A0522D'>DETTO AD ALTA VOCE</font>", "Una frase che William pronuncia "
         "davvero, a qualcuno."],
        ["<font name='Segno-I' color='#8C8C8C'>uguale a SM-012</font>", "La stessa frase c’è già: non si registra "
         "di nuovo."],
    ], [5.5 * cm, 11 * cm], prima="piccolo"))
    st += [p("Le frasi che cambiano", "h2"),
           p("Molti testi del gioco hanno parti che ci sono soltanto in certe partite. Il copione le divide in due "
             "modi:"),
           *punti(["<b>A pezzi</b>, quando le parti che cambiano sono frasi intere. Ogni pezzo è una presa a sé, con "
                   "la stessa sigla e una lettera (<font name='Segno-B' color='#1F5C73'>FI-002a</font>, "
                   "<font name='Segno-B' color='#1F5C73'>FI-002b</font>…): il gioco li monta uno dopo l’altro. "
                   "Sopra ogni pezzo c’è scritto se c’è sempre o soltanto in certi casi. Leggili come parti di un "
                   "unico discorso: lo stesso tono, lo stesso fiato, e un piccolo respiro fra l’uno e l’altro.",
                   "<b>Intere</b>, quando la parte che cambia sta dentro una frase. Allora la frase c’è due o più "
                   "volte, ogni volta completa, una per caso: sopra c’è scritto «intera» e la condizione."]),
           p("Le pagine dei finali sono le più lunghe e hanno molti pezzi: lì vale la pena leggere prima il blocco "
             "intero, poi registrarlo un pezzo alla volta.")]

    st.append(PageBreak())
    st += h1("Le pronunce", "pronunce")
    st += [p("Le parole difficili che William dice, come le ha fissate Simone.")]
    st.append(tabella([
        ["Parola", "Come si dice", "Dove"],
        ["Yusuf", "Iùsuf, con l’accento sulla prima.", "Atto I e i finali"],
        ["Santa Maria", "Come si scrive: è il nome della nave di William.", "dappertutto"],
        ["TSC-1972", "«ti esse ci, millenovecentosettantadue». È la sigla della Santa Maria, letta sulla prima "
                     "pagina del registro.", "SM: il registro di bordo"],
        ["TSC", "«ti esse ci»: la sigla sul kit.", "SM: il kit"],
        ["14 marzo 2105", "«quattordici marzo duemilacentocinque».", "SM: il registro di bordo"],
        ["W. T.", "«vu ti»: la firma di William, le sue iniziali, in fondo alla sua ultima riga del registro "
                  "(«Settimana sei. Stiva vuota. Nessun contatto. W. T.»).", "SM: il registro di bordo"],
        ["L.V.", "«elle vu», lettera per lettera: le iniziali dell’uomo nella serra.", "VI: la placca"],
        ["QUI PRIMA. IL SEME. NON SIAMO S—", "Graffiato sulla placca. La «S—» si interrompe: una esse che non "
                                             "diventa parola.", "VI: la placca"],
        ["OLI", "«o-li»: le lettere che completano «soli», scritte da un’altra mano.", "VI: la placca"],
        ["AURORA-7", "«Aurora sette»: la missione di L.V.", "VI: la placca"],
        ["«…nello di Ghiaccio»", "Il titolo di un vecchio gioco sullo schermo rotto di un lettore: comincia "
                                 "tagliato, «…nello».", "SM: la stiva"],
        ["Ganimede, Callisto", "Ganimède, Callìsto: due lune di Giove.", "SM e i finali"],
        ["multiscanner", "multiscànner.", "dappertutto"],
        ["Navarca", "Navàrca: il capo dell’equipaggio della nave.", "EQ, EC, FU"],
    ], [4.2 * cm, 8.6 * cm, 3.7 * cm]))

    st.append(PageBreak())
    st += h1("Come registrare", "tecnica")
    st += punti([
        "<b>Formato</b>: WAV, 48 kHz, 24 bit, mono.",
        "<b>Asciutto</b>: niente effetti, niente compressione, niente equalizzazione, niente riverbero. Il casco, "
        "la radio e le stanze li mette il gioco.",
        "<b>Sempre uguale</b>: lo stesso microfono, la stessa distanza (20–30 cm, con l’antipop), la stessa stanza "
        "per tutte le sessioni, perché le prese di giorni diversi si montano una accanto all’altra.",
        "<b>Livello</b>: i picchi intorno a −6 dBFS, mai sopra −3. Non normalizzare.",
        "<b>Il silenzio della stanza</b>: all’inizio di ogni sessione, dieci secondi di silenzio, a microfono aperto.",
        "<b>Un file per presa</b>, con il nome della sigla: <font name='Segno-B'>SM-027.wav</font>, "
        "<font name='Segno-B'>FI-002b.wav</font>. Se rifai una presa, <font name='Segno-B'>SM-027_2.wav</font>: "
        "teniamo l’ultima, salvo una tua nota.",
        "<b>Un secondo di silenzio</b> prima e dopo ogni presa. I respiri restano: non tagliarli.",
        "<b>Gli a capo</b> dentro una presa sono un cambio di paragrafo: una pausa naturale, intorno a un secondo.",
        "<b>Le prese «uguale a»</b> non si registrano.",
        "<b>La consegna</b>: una cartella per capitolo (SM, IN, CO, VI, TE, EQ, ME, PO, FU, FI, EC, TR, AR, RE, "
        "ARIA, FASCE) e un foglio con le note di sessione (le prese da rifare, i dubbi).",
    ])
    st += [p("Il gioco in sala", "h2"),
           p("Le voci degli altri si possono ascoltare nel gioco (la beta, nel canale di prova) o nei file che Simone "
             "ti manda a parte. Per le scene con Yusuf e con l’Anziano conviene sentirle prima: le tue risposte "
             "arrivano dopo le loro, con una pausa vera di circa un secondo e mezzo.")]
    st.append(PageBreak())
    return st


# ---------------------------------------------------------------------------------------------------------------
#  I blocchi
# ---------------------------------------------------------------------------------------------------------------
def blocco(b, contesti):
    c = contesti.get(b["id"])
    titolo = c["titolo"] if c else b["titolo"].title()
    dove = f"{b['prese'][0]['riga'].split(':')[0]} · {b['titolo']}".replace("'", "’")
    testa = [Voce(1, f"{b['id']} · {titolo}", b["id"]),
             Paragraph(f"<font color='#1F5C73'>{b['id']}</font>  {escape(titolo)}", S["blocco"]),
             Paragraph(escape(dove), S["dove"]), Spacer(1, 4)]
    if c:
        box = Table([[Paragraph(escape(c["contesto"]), S["contesto"])]], colWidths=[16.6 * cm])
        box.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CARTA), ("LEFTPADDING", (0, 0), (-1, -1), 9),
                                 ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 6),
                                 ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                                 ("LINEBEFORE", (0, 0), (0, -1), 2.2, ACCENTO)]))
        testa.append(box)
    else:
        testa.append(Paragraph("<font color='#B00020'>MANCA IL CONTESTO</font>", S["piccolo"]))
    testa.append(Spacer(1, 8))
    prese = [presa(q) for q in b["prese"]]
    prese = [r for r in prese if r]
    out = [CondPageBreak(6 * cm), KeepTogether(testa + prese[:1])] + prese[1:] + [Spacer(1, 14)]
    return out


def presa(q):
    utili = [z for z in q["pezzi"] if z["william"]]
    if not utili:
        return None
    righe = []
    opzione = q["tipo"] == "opzione"
    for z in q["pezzi"]:
        if not z["william"]:
            continue
        cond = z["condizione"]
        if len(utili) > 1:
            if cond is None:
                sopra = "sempre"
            elif cond.startswith("intera: "):
                sopra = "intera, " + cond[8:].replace("'", "’")
            else:
                sopra = "solo " + cond.replace("'", "’") if cond.startswith("se ") else cond.replace("'", "’")
        else:
            sopra = cond.replace("intera: ", "intera, ").replace("'", "’") if cond else ""
        if z.get("uguale"):
            testo = Paragraph(f"uguale a {z['uguale']} · «{escape(z['william'][:70].replace(chr(39), '’'))}"
                              f"{'…' if len(z['william']) > 70 else ''}»", S["uguale"])
            cella = [Paragraph(escape(sopra), S["quando"])] if sopra else []
            cella.append(testo)
        else:
            cella = [Paragraph(escape(sopra), S["quando"])] if sopra else []
            prefisso = ("<font name='Segno-B' size='7.5' color='#A0522D'>DETTO AD ALTA VOCE</font><br/>"
                        if opzione else "")
            cella.append(Paragraph(prefisso + battuta(z), S["battuta"]))
        sigla = Paragraph(z["id"] if not z.get("uguale") else f"<font color='#9A9A9A'>{z['id']}</font>", S["sigla"])
        if not righe:
            # la sigla scende all'altezza del testo, sotto la riga dell'intestazione
            sigla = [Spacer(1, 12), sigla]
        righe.append([sigla, cella])
    # l'intestazione della presa sta nella stessa riga del primo pezzo: la tabella si può spezzare fra un pezzo e
    # l'altro, mai fra l'intestazione e il suo testo
    righe[0][1] = [Paragraph(escape(descrivi_presa(q)), S["quando"])] + righe[0][1]
    t = Table(righe, colWidths=[2.0 * cm, 14.6 * cm])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 2), ("TOPPADDING", (0, 0), (-1, -1), 1),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 5), ("LINEABOVE", (0, 0), (-1, 0), 0.4, FILO)]))
    return t


# ---------------------------------------------------------------------------------------------------------------
#  Le appendici
# ---------------------------------------------------------------------------------------------------------------
def appendici(prese_cifra):
    st = [PageBreak()]
    st += h1("Appendice A · Le cifre dell’aria", "cifre")
    st += [p("La cifra dell’aria sta sul bordo del visore, e William la legge. Nelle prese con <font name='Segno-B' "
             f"backColor='{EVIDENZA}'>[aria]</font> hai detto «quaranta»; qui registri le cifre vere, da zero a "
             "cento, che il gioco mette al suo posto."),
           p("Due letture per ogni numero:"),
           *punti(["<b>conclusiva</b>, come a fine frase: «…la cifra dell’aria: <i>quaranta</i>.», e come quando la "
                   "frase comincia con la cifra: «<i>Quaranta</i>. La cifra è rossa.»;",
                   "<b>sospesa</b>, dentro una frase che continua: «Con l’aria a <i>quaranta</i> la tuta non mi lascia "
                   "ascoltare niente…»."]),
           p("I file: <font name='Segno-B'>ARIA-000-c.wav</font> … <font name='Segno-B'>ARIA-100-c.wav</font> per la "
             "conclusiva, <font name='Segno-B'>ARIA-000-s.wav</font> … <font name='Segno-B'>ARIA-100-s.wav</font> per "
             "la sospesa. Si possono registrare di fila, con un respiro fra l’uno e l’altro: li tagliamo noi. Il tono è "
             "quello di chi legge uno strumento, non di chi annuncia."),
           p(f"Le prese che usano la cifra: {', '.join(prese_cifra['aria'])}.", "piccolo"),
           Spacer(1, 8),
           p("Le fasce del pilastro", "h2"),
           p("Una sola presa, nell’arca della memoria, dice quante fasce del pilastro sono accese: «…una fascia alla "
             f"volta: <font name='Segno-B' backColor='{EVIDENZA}'>[risveglio]</font> su quattro, per ora.» "
             f"({', '.join(prese_cifra['risveglio'])}). Nella presa dici «due»; qui registri, sospese, «zero», «una», "
             "«due» e «tre» (sono fasce: «una», non «uno»): <font name='Segno-B'>FASCE-0.wav</font> … "
             "<font name='Segno-B'>FASCE-3.wav</font>.")]
    st += [PageBreak()]
    st += h1("Appendice B · Le voci che non sono tue", "altre")
    st += [p("Già registrate, compaiono nel copione in grigio. Non sono da leggere."),
           tabella([
               ["Chi", "Che cosa dice", "La voce"],
               ["L.V.", "La scatola nera del prologo e quella della serra", "Google, la voce «Elio»"],
               ["L’Anziano", "Tutte le sue battute, nel santuario centrale", "ElevenLabs, una voce disegnata"],
               ["Yusuf", "La radio di plancia, la chiamata nella fuga", "la voce di Simone, clonata"],
               ["Le voci della nave", "Le echi del Sintonizzatore, le registrazioni lette dallo scanner, l’ultima "
                                      "voce: quindici persone dell’equipaggio, il Piccolo compreso", "ElevenLabs, quindici "
                                                                                                    "voci disegnate"],
               ["La voce di servizio", "La tuta e il gioco: PROTEZIONE VITALE, le scritte del visore, le letture dello "
                                       "scanner, la matrice di traduzione, i suggerimenti fra parentesi", "Google, la voce "
                                                                                                         "«Kira»"],
               ["Il computer di bordo", "La riga del registro che chiude ogni finale («Registro di bordo, TSC-1972. "
                                        "Operatore W. T. Eriksonn…»), quando chi gioca ci arriva", "la voce di servizio, "
                                                                                                  "come altoparlante "
                                                                                                  "della plancia"],
               ["I messaggi del gioco", "Le risposte automatiche ai comandi che il gioco non capisce", "nessuna, per ora"],
           ], [3.4 * cm, 8.4 * cm, 4.7 * cm])]
    st += [PageBreak()]
    st += h1("Le decisioni", "decisioni")
    st += [p("Prese da Simone il 7 novembre 2026, dopo la prima versione di questo copione:")]
    st += punti([
        "<b>La sigla TSC-1972</b> si legge «ti esse ci, millenovecentosettantadue».",
        "<b>La firma sul registro</b> sono le iniziali: «Settimana sei. Stiva vuota. Nessun contatto. W. T.» "
        "William legge «vu ti», e il suo nome resta non detto.",
        "<b>La riga del registro di bordo</b> che chiude i finali la legge il computer di bordo, con la voce di "
        "servizio: non è di William.",
        "<b>Le fasce del pilastro</b>: la frase è stata corretta nel gioco («…una fascia alla volta: [risveglio] su "
        "quattro, per ora.»), e va bene con qualunque numero.",
    ])
    return st


def main():
    dati = json.load(open(os.path.join(CARTELLA, "copione.json"), encoding="utf-8"))
    contesti = json.load(open(os.path.join(CARTELLA, "contesti.json"), encoding="utf-8"))
    blocchi = [b for c in dati["capitoli"] for b in c["blocchi"]]
    mancano = [b["id"] for b in blocchi if b["id"] not in contesti]
    if mancano:
        print("Blocchi senza contesto:", ", ".join(mancano))
    da_registrare, parole = 0, 0
    cifra = {"aria": [], "risveglio": []}
    for b in blocchi:
        for q in b["prese"]:
            for z in q["pezzi"]:
                if z["william"] and not z.get("uguale"):
                    da_registrare += 1
                    parole += len(re.findall(r"\w+", z["william"]))
                    for k in cifra:
                        if f"[{k}]" in z["william"]:
                            cifra[k].append(z["id"])
    tot = dict(dati["totali"], blocchi=len(blocchi), da_registrare=da_registrare, parole_da_registrare=parole,
               minuti=round(parole / 145))
    doc = Copione(USCITA)
    toc = TableOfContents(levelStyles=[S["toc0"], S["toc1"]], dotsMinLevel=0)
    storia = copertina(tot)
    storia += [Paragraph("Indice", S["h1"]), toc, PageBreak()]
    storia += pagine_davanti(tot)
    for c in dati["capitoli"]:
        storia += h1(c["titolo"], c["sigla"])
        for b in c["blocchi"]:
            storia += blocco(b, contesti)
        storia.append(PageBreak())
    storia += appendici(cifra)
    doc.multiBuild(storia)
    print(f"{os.path.relpath(USCITA, RADICE)}: {doc.page} pagine, {len(blocchi)} blocchi, {da_registrare} prese da "
          f"registrare, {parole} parole")


if __name__ == "__main__":
    main()
