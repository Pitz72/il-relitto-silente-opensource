# 40 — Il modello della Santa Maria

14 novembre 2026. Terzo passo del progetto della nave (documento 38: la scheda unica; documento 39: le
schematiche, approvate il 13 novembre). La nave è costruita in Blender dalla stessa tabella delle misure da cui
nascono le tavole. In una sessione sono fatti **la forma** e **una prima superficie**. L’autore ha visto i due
fogli mentre il lavoro andava avanti; le sue note non ci sono ancora.

## I fogli

In `progettazione/40-modello/`, da 2560 × 1440, con i nomi scritti grandi:

| Foglio | Che cosa mostra |
|---|---|
| `foglio-1-la-forma.jpg` | la nave liscia, di un grigio solo: lo scafo e i suoi pezzi, com’è nelle tavole |
| `foglio-2-la-superficie.jpg` | la stessa nave con le lamiere, le toppe, la matricola, i particolari |

In ogni foglio: in alto le due viste di tre quarti, che sono quelle dell’intro (da prua, con il fianco sinistro
e il portello di carico, per la scena B; da poppa, con il fianco destro e il portello d’uscita, per la scena E);
sotto i due fianchi. Il primo foglio è di prima della superficie: resta come memoria del passo, e con gli
attrezzi di oggi non si rifà. Le otto viste intere (anche il muso, la poppa, dall’alto, da sotto) si rifanno con un
comando e restano fuori da git, in `progettazione/40-modello/viste/`.

## Come è fatta

Quattro attrezzi in `strumenti/nave/`, accanto a `misure.py` e a `schematiche.py`:

| Attrezzo | Che cosa fa |
|---|---|
| `modello.py` | dentro Blender, senza finestra: costruisce lo scafo e i pezzi dalla tabella, ci stende la superficie, salva il file di Blender e rende le viste |
| `superficie.py` | dipinge la tessitura dello scafo (il colore, quanto è ruvido, quanto è metallo, il rilievo): quattro immagini |
| `pelle.py` | dice dove va ogni punto dello scafo sulla tessitura; lo leggono i due attrezzi qui sopra, così una lamiera dipinta a un certo metro cade su quel metro della nave |
| `foglio.py` | mette le viste in un foglio solo |

I comandi, dalla radice del progetto (Blender 5.2.4 LTS è in `%LOCALAPPDATA%\Programs\Blender\5.2.4\`):

    python strumenti/nave/superficie.py
    blender --background --factory-startup --python strumenti/nave/modello.py -- --viste
    python strumenti/nave/foglio.py foglio-2-la-superficie "secondo passo: la superficie"

La tessitura si fa in cinque secondi; la nave e le otto viste (1920 × 1080, 160 campioni, sulla scheda video) in
un minuto. Il file di Blender (`strumenti/nave/uscita/santa-maria.blend`) e le quattro immagini della tessitura
stanno fuori da git: si rifanno da qui, sempre uguali (tutto il caso viene da un numero solo, il seme 1972).

**Nessun numero della nave è scritto nel modello.** Lunghezze, posti e misure vengono da `misure.py`; nel
modello ci sono soltanto gli spessori dei pezzi. Per cambiare la nave si cambia un numero nella tabella, e
tavole e modello cambiano insieme.

## Il primo passo: la forma

Lo scafo è una pelle sola, chiusa, tesa fra le sezioni della tabella (un rettangolo dagli spigoli tondi che
cambia lungo la nave): misurato sul modello, **80,0 × 13,0 × 12,0 metri**. I gomiti dei tre profili (a 1,2, 4,
8, 12 e 77 metri) sono spigoli veri, come nelle tavole. Intorno, 160 pezzi, ognuno con il suo nome in italiano
nel file di Blender:

- **a prua**: l’oblò tondo con la sua ghiera; l’oblò piccolo della cuccetta, sul fianco sinistro; il modulo delle
  comunicazioni, sul fianco destro, che segue lo scafo e ne sporge di 45 centimetri; i due arpioni sotto il muso;
- **sul dorso**: il faro di prua (una base, una forcella, la lampada che guarda avanti e appena in giù), il
  radar, il collare di presa, l’antenna della radio;
- **sui fianchi**: i pannelli solari, quattro per fianco, su staffe corte (due sono di ricambio, di un’altra
  tinta: scheda 05B, decisione 1); il portello di carico a sinistra, chiuso, a due ante; il portello d’uscita a
  destra, a poppa, con il suo oblò, la luce gialla e la pedana;
- **a poppa**: i quattro scarichi in due coppie, i due fanali d’ambra, il camminamento sotto la piastra.

Le luci hanno ognuna il suo materiale (l’oblò, i fanali, la luce dell’uscita, il faro, gli scarichi, che per ora
sono spenti): è quello che serve dopo, per renderle separate e farle animare all’intro.

## Il secondo passo: la superficie

Viene dalla scheda 05B del seguito: «metallo trattato nudo», «toppe di scafo in tonalità di metallo diverse»,
«fasciame rivettato, giunti di piastra, crateri da micrometeorite, stencil consumato», l’arancione soltanto
sulle marcature delle due aperture, la matricola «sulla fascia scura dello scafo».

**Lo scafo è dipinto**, su una tessitura di 4096 × 2944 punti (circa due centimetri per punto):

- **il fasciame**: ventiquattro corsi di lamiere lungo la nave; le lamiere finiscono ai gomiti dello scafo e poi
  ogni quattro metri, sfalsate da un corso all’altro; ogni lamiera ha la sua giunta e la sua fila di rivetti;
- **le toppe**: tre lamiere su dieci sono di un altro metallo (più chiaro, più scuro, appena più caldo o più
  freddo), e una quarantina di toppe più piccole stanno sopra le altre, con i rivetti fitti; nessuna copre i
  portelli o la matricola;
- **la fascia scura**: il fondo, i due spigoli bassi e il primo corso dei fianchi, fino a 0,9 metri sotto il
  ponte, sono di una lega più scura;
- **la matricola**: «TSC-1972» e «SANTA MARIA» a stencil, bianchi e consumati, sulla fascia scura dei due
  fianchi e sulla piastra di poppa;
- **le fasce arancioni** intorno al portello di carico e al portello d’uscita, con gli angoli tagliati, scrostate;
- **il tempo**: macchie larghe, colature rade sui fianchi, lo sporco nelle giunte, graffi lunghi nel verso del
  viaggio, crateri piccoli (più fitti verso prua), il nero del fumo intorno agli scarichi.

**I pezzi** hanno un metallo macchiato fatto dentro Blender, e i pannelli solari il reticolo delle celle.

**I particolari**, in rilievo: sei botole d’accesso sul dorso, con la maniglia; due corrimano lungo il dorso,
dal principio della stiva alla poppa; un condotto lungo ogni fianco, con una fascetta ogni quattro metri; una
griglia della sala macchine per fianco; i pioli che dal portello d’uscita salgono al dorso.

## Quello che è inventato qui

Nessun testo e nessuna tavola lo dice: sono proposte, e l’autore le conferma o le toglie guardando i fogli.

- **I particolari** del paragrafo qui sopra: le botole, i corrimano, i condotti, le griglie, i pioli. Vengono da
  una frase della scheda 05B («c’è un esterno su cui si cammina, e William ci ha lavorato») e dal documento 39,
  che lasciava al modello «i pannelli d’accesso sul dorso».
- **Come sono fatti i pezzi**: la forcella del faro; il radar come una barra che gira (nelle tavole era un
  segno inclinato); l’anello e i quattro denti del collare; le cerniere e i chiavistelli del portello di carico;
  il corrimano della pedana dell’uscita; i puntoni delle pedane.
- **Il disegno del fasciame**: quanti corsi, dove finiscono le lamiere, dove comincia la fascia scura.
- **Il fumo intorno agli scarichi** e un’ombra di ruggine nelle colature (la scheda vuole l’arancione solo
  sulle marcature: questa è bruna, e poca).

## Che cosa non va ancora

- **La sagoma è quella semplice delle tavole.** È giusta nelle misure, ma di lontano è un tubo: gli still di
  oggi (`prua.webp`, `poppa.webp`) hanno casse, sovrastrutture e tubi che qui non ci sono. Aggiungerne è una
  scelta dell’autore: ogni volume in più va nella tabella e nelle tavole, non solo nel modello.
- **La luce delle viste è da studio** (un sole da dietro la macchina e una schiarita), su fondo scuro: serve a
  leggere la nave, e non è la fotografia dell’intro.
- **La tessitura regge il campo lungo e i tre quarti**, non il dettaglio da vicino: per una scena sul fasciame
  ne servirebbe una più fitta, solo di quel tratto.
- **Le scritte piccole** («SANTA MARIA» sui fianchi) da lontano non si leggono; «TSC-1972» sì.
- Nel foglio i due fianchi toccano i bordi del riquadro.

## Che cosa viene dopo

1. Le note dell’autore sui due fogli: la forma, la superficie, le cose inventate.
2. Le due riprese dell’intro (da prua di tre quarti per B, da poppa per E), con le luci separate: lo scafo,
   l’oblò d’ambra, i fanali, la spinta dei quattro scarichi; messe accanto agli still di oggi, perché decida lui.
3. Il faro, e la fotografia unica dell’intro (documento 09, §14).
