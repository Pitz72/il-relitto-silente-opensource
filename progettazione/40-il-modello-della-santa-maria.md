# 40 — Il modello della Santa Maria

14 novembre 2026. Terzo passo del progetto della nave (documento 38: la scheda unica; documento 39: le
schematiche, approvate il 13 novembre). La nave è costruita in Blender dalla stessa tabella delle misure da cui
nascono le tavole. In una sessione sono fatti **la forma**, **una prima superficie** e, dopo le note
dell’autore, **i pezzi che mancavano e una superficie più vecchia**.

> **Le note dell’autore, 14 novembre 2026**, sui primi due fogli: «Di base direi che ci siamo. In fondo una nave
> spaziale mercantile non deve avere ali o tocchi esotici alla Millennium Falcon, per quanto strano sia può anche
> essere solo un tubo. Cercherei di mettere qualche oggetto sullo scafo, manca un punto da dove lanciare arpioni
> d’aggancio, dei radar o una griglia di sensori e poi degli attacchi per l’attracco ai moli spaziali. La texture
> mi piace […] la superficie deve dimostrare oltre 90 anni di attività ma diciamo che sono soddisfatto». La forma
> e la sagoma semplice sono approvate; dei particolari inventati non ne ha tolto nessuno. Le sue tre richieste e
> gli anni in più sono nel terzo foglio (più sotto), **approvato** lo stesso giorno: «Sì, vai avanti».

## I fogli

In `progettazione/40-modello/`, da 2560 × 1440, con i nomi scritti grandi:

| Foglio | Che cosa mostra |
|---|---|
| `foglio-1-la-forma.jpg` | la nave liscia, di un grigio solo: lo scafo e i suoi pezzi, com’è nelle tavole |
| `foglio-2-la-superficie.jpg` | la stessa nave con le lamiere, le toppe, la matricola, i particolari |
| `foglio-3-i-pezzi-e-gli-anni.jpg` | dopo le note dell’autore: il lanciarpioni, i sensori, gli attacchi d’ormeggio, e la superficie invecchiata |

In ogni foglio: in alto le due viste di tre quarti, che sono quelle dell’intro (da prua, con il fianco sinistro
e il portello di carico, per la scena B; da poppa, con il fianco destro e il portello d’uscita, per la scena E);
sotto i due fianchi. I primi due fogli sono memoria dei passi: con gli attrezzi di oggi si rifà il terzo. Le otto viste intere (anche il muso, la poppa, dall’alto, da sotto) si rifanno con un
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
    python strumenti/nave/foglio.py foglio-3-i-pezzi-e-gli-anni "terzo passo: i pezzi nuovi e novant’anni di attività"

La tessitura si fa in otto secondi; la nave e le otto viste (1920 × 1080, 160 campioni, sulla scheda video) in
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

## Il terzo passo: i pezzi che mancavano, e gli anni

**Tre pezzi nuovi**, chiesti dall’autore. Sono nella tabella (`misure.py`) e nelle tavole del documento 39,
ridisegnate lo stesso giorno: tavole e modello restano uguali.

- **Il lanciarpioni**: un mento sotto il muso, largo 4,2 metri, con la faccia inclinata; ne escono i due tubi
  di lancio, con le teste magnetiche degli arpioni in vista; ai due lati, i tamburi dei duecento metri di cavo.
  Prima c’erano solo due tubi appesi sotto il muso, e da fuori non si leggevano.
- **I sensori**: una griglia in piedi sul dorso, al principio della stiva (3,2 × 2 metri, ventotto celle, che
  guarda avanti, con due puntoni dietro), e un pannello piatto di venti celle su ogni guancia del muso. Il
  radar che gira resta dov’era.
- **Gli attacchi d’ormeggio**: quattro, sul fianco sinistro, due a prua e due a poppa dei pannelli: una
  piastra imbullonata, un blocco, la staffa dove il molo aggancia. Stanno sul fianco del portello di carico,
  perché la nave si ormeggia dal lato da cui carica (05B, decisione 3); il fianco destro non ne ha, e così i
  due fianchi si distinguono ancora meglio (05B, decisione 4). Il collare sul dorso resta la presa del bacino
  di disarmo.

**Gli anni.** L’autore: «la superficie deve dimostrare oltre 90 anni di attività». Sulla tessitura, in più:

- le lamiere appena imbarcate, in dentro o in fuori, e le ordinate che si leggono sotto la pelle, una ogni due
  metri;
- una settantina di ammaccature, più fitte a prua e sul fianco del carico;
- le saldature delle riparazioni: cordoni chiari e storti, con l’alone scuro del calore;
- le perdite: macchie brune che partono da un punto del fianco e colano verso la chiglia;
- l’antiruggine che affiora a chiazze vicino alle giunte (bruna, non arancione);
- il muso sabbiato dalla polvere, più chiaro e più opaco; la poppa cotta dal calore, più bruna;
- i segni del carico: graffi corti e fitti intorno al portello;
- lo sporco che si ferma sopra la fascia scura.

La matricola dei fianchi tiene di più la vernice: «TSC-1972» deve restare leggibile.

## Quello che è inventato qui

Nessun testo e nessuna tavola lo dice: sono proposte, e l’autore le conferma o le toglie guardando i fogli.

- **I particolari** del secondo passo: le botole, i corrimano, i condotti, le griglie, i pioli. L’autore li ha
  visti e non ne ha tolto nessuno («Di base direi che ci siamo»). Vengono da
  una frase della scheda 05B («c’è un esterno su cui si cammina, e William ci ha lavorato») e dal documento 39,
  che lasciava al modello «i pannelli d’accesso sul dorso».
- **Come sono fatti i tre pezzi nuovi**: le richieste sono dell’autore; la forma del mento e dei tamburi, il
  numero delle celle dei sensori, dove stanno i quattro attacchi sono proposte.
- **Come sono fatti i pezzi**: la forcella del faro; il radar come una barra che gira (nelle tavole era un
  segno inclinato); l’anello e i quattro denti del collare; le cerniere e i chiavistelli del portello di carico;
  il corrimano della pedana dell’uscita; i puntoni delle pedane.
- **Il disegno del fasciame**: quanti corsi, dove finiscono le lamiere, dove comincia la fascia scura.
- **Il fumo intorno agli scarichi** e un’ombra di ruggine nelle colature (la scheda vuole l’arancione solo
  sulle marcature: questa è bruna, e poca).

## Che cosa non va ancora

- **La sagoma è semplice, la scheda la vuole così, e l’autore l’ha confermata** («può anche essere solo un
  tubo»): «I pannelli solari sono la sola cosa che rompe la
  sagoma» (05B, «La sagoma»), «una nave che nessuno ha progettato per essere guardata». Di lontano però è un
  tubo, e gli still di oggi (`prua.webp`, `poppa.webp`) hanno casse, sovrastrutture e tubi che la scheda non
  prevede e che qui non ci sono. La strada è quella presa con il terzo passo: oggetti sullo scafo, ognuno
  prima nella tabella e nelle tavole.
- **La luce delle viste è da studio** (un sole da dietro la macchina e una schiarita), su fondo scuro: serve a
  leggere la nave, e non è la fotografia dell’intro.
- **La tessitura regge il campo lungo e i tre quarti**, non il dettaglio da vicino: per una scena sul fasciame
  ne servirebbe una più fitta, solo di quel tratto.
- **Le scritte piccole** («SANTA MARIA» sui fianchi) da lontano non si leggono; «TSC-1972» sì.

## Che cosa viene dopo

1. **Una scelta dell’autore, aperta** (14 novembre 2026). Mentre preparavo le due riprese ferme ha chiesto: «Ma
   non conviene fare il render delle animazioni della nave direttamente in Blender e poi applicarle con l’uso
   di un canale alpha o qualcosa del genere?». Oggi l’intro è una scena in tre dimensioni disegnata dal vivo
   (`app/src/intro/scala.ts`), e la nave ci sta come una foto ritagliata su un cartello che guarda la macchina.
   Nella scena B la nave passa davanti a una macchina ferma, a circa 900 metri: l’angolo da cui la si vede
   cambia, e una foto non può girare. Nella scena E la macchina arretra da 165 metri a 18 chilometri sulla
   stessa retta: cambia la prospettiva, e la foto resta quella da vicino. Le strade sono tre:
   - **le foto ferme**, con le luci separate (il piano di prima): poco lavoro, ma la nave resta un cartello;
   - **il filmato da Blender, con la trasparenza** (la sua idea): la nave si muove davvero e la luce è quella
     di Blender; ma un filmato va tenuto a tempo con il cielo, la polvere e il faro, che l’intro disegna dal
     vivo, e basta un fotogramma di scarto perché la nave scivoli; pesa; è fatto per una sola misura di
     schermo; e la trasparenza nei filmati su Linux non è sicura;
   - **la nave vera dentro l’intro** (la mia raccomandazione): il modello e la sua tessitura caricati nella
     scena, disegnati dal vivo con la stessa macchina del cielo; niente da tenere a tempo, nitida a ogni
     misura, pochi megabyte, e le luci (l’oblò, i fanali, la spinta, il faro) nascono nei loro punti veri. Nello
     spazio la luce è un sole solo, e dal vivo viene quasi come in Blender; le ombre morbide si possono
     cuocere in Blender una volta. È più codice nell’intro.
   Decide lui.
2. Se restano le foto ferme: le due riprese dell’intro (da prua di tre quarti per B, da poppa per E), con le luci separate: lo scafo,
   l’oblò d’ambra, i fanali, la spinta dei quattro scarichi; messe accanto agli still di oggi, perché decida lui.
3. Il faro, e la fotografia unica dell’intro (documento 09, §14).
