# 40 — Il modello della Santa Maria

14 novembre 2026. Terzo passo del progetto della nave (documento 38: la scheda unica; documento 39: le
schematiche, approvate il 13 novembre). La nave è costruita in Blender dalla stessa tabella delle misure da cui
nascono le tavole. In una sessione sono fatti **la forma**, **una prima superficie** e, dopo le note
dell’autore, **i pezzi che mancavano e una superficie più vecchia**; poi **la nave vera dentro l’intro del
gioco**, con i reattori che si spengono.

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
| `foglio-4-la-nave-nell-intro.jpg` | l’intro prima e dopo: la foto ritagliata e la nave vera, nelle due scene |
| `foglio-5-i-reattori-si-spengono.jpg` | la scena da dietro, quattro istanti: i reattori accesi, la fiamma che si accorcia, la brace, spenti |

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
    blender --background --factory-startup --python strumenti/nave/modello.py -- --viste --intro
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

## Il quarto passo: la nave vera nell’intro

L’autore ha scelto la terza strada (più sotto, «Che cosa viene dopo»): **«Nave vera dal vivo»**. È fatta lo
stesso giorno. Nell’intro la Santa Maria non è più una foto ritagliata su un cartello: è il modello, con la sua
tessitura, disegnato dal vivo dal motore dell’intro (`app/src/intro/scala.ts`) con la stessa macchina del cielo.

**Che cosa si carica.** In `app/public/intro/nave/`, 2,4 megabyte in tutto:

| File | Che cosa è | Chi lo scrive |
|---|---|---|
| `santa-maria.bin` | la forma: 50.803 punti, 35.144 triangoli, più gli 800 della spinta | `modello.py --intro` |
| `santa-maria.json` | i punti che il motore deve conoscere: dove stanno l’oblò, i fanali, la luce dell’uscita, gli scarichi, la lente del faro | `modello.py --intro` |
| `colore.webp`, `ruvido.webp`, `metallo.webp`, `rilievo.webp` | la tessitura dello scafo, a metà misura (2048 × 1472) | `superficie.py` |

Nel motore non c’è nessun numero della nave: vengono tutti da questi file, cioè dalla tabella `misure.py`.

**Come è disegnata.** Nello spazio la luce è un sole solo, e si calcola dal vivo: la parte diffusa e quella
riflessa, punto per punto, con il rilievo delle lamiere preso dalla tessitura; l’ombra che un pezzo fa
sull’altro viene da una mappa calcolata una volta per ripresa (la nave non gira rispetto al sole); un poco di
luce fredda arriva dal cielo da ogni parte. I pezzi hanno il loro metallo macchiato e i pannelli il reticolo
delle celle, calcolati. La nave si disegna in uno strato suo, con quattro campioni per punto perché i bordi
siano lisci, e poi si posa sulla scena; il bagliore, la grana e la resa finale sono quelli di tutto il resto.

**Le luci, nei loro punti veri.** L’oblò d’ambra; i due fanali, che respirano come prima; la luce gialla
dell’uscita; la lente del faro, da cui adesso parte il fascio (prima partiva da un punto messo a mano davanti
al muso); la spinta dei quattro scarichi, un cono di luce azzurra che trema appena. Gli aloni si vedono solo
se la luce guarda la macchina.

**I reattori si spengono** (l’autore, lo stesso giorno: «nell’inquadratura dove vediamo la Santa Maria dal
lato posteriore e ci allontaniamo […] dovremmo fare un effetto di spegnimento dei reattori, per una questione di
realismo la nave continuerà comunque ad avvicinarsi per inerzia»). Nella scena da dietro (E) la spinta è accesa
per poco più di un secondo; poi si spegne in 1,9 secondi, con due singhiozzi, e la fiamma si accorcia; negli
scarichi resta la brace arancione, che si raffredda in qualche secondo. Succede mentre la macchina è ancora
vicina; quando arretra, gli scarichi sono spenti. La nave non rallenta. Nella scena con il cielo (B) arriva con
i reattori accesi. Il suono dell’intro non è cambiato: se lo spegnimento deve sentirsi, è lavoro da fare
(`reattori()` in `scala.ts`, con la sua prova in `app/prove/intro.test.ts`).

**Due decisioni tecniche sulla macchina**, perché la nave vera è lunga ottanta metri e sottile, e nel quadro
sembrava piccola (gli still di prima disegnavano una nave più corta e più tozza). I tempi non cambiano.

- Nella scena con il cielo (B) la macchina sta a due terzi della distanza di prima, sulla stessa retta: guarda
  nello stesso punto, e il cielo è lo stesso.
- Nella scena da dietro (E) parte da 85 metri invece che da 165, e da vicino mira alla poppa e non al mezzo
  della nave; arretrando la mira torna al mezzo, senza che si veda. La direzione è la stessa, e la fine della
  scena (la nave piccola contro la grande forma nera) è identica.

**Il sole è uno per ripresa**: in ognuna prende i fianchi che la macchina vede. Ogni quadro aveva già il suo
cielo.

**Quanto costa** (`node strumenti/intro/costo.mjs`, 1920 × 1080, GeForce RTX 2070; millisecondi per
fotogramma): la scena con il cielo 2,1 (con lo still 3,0); la scena da dietro 5,0 all’inizio, 4,1 a metà, 3,9
alla fine (5,8, 5,0, 4,7). Non costa di più. Le prove dell’app sono 128, verdi.

**I due fogli**: `foglio-4-la-nave-nell-intro.jpg` (prima e dopo, nelle due scene) e
`foglio-5-i-reattori-si-spengono.jpg` (quattro istanti). I fotogrammi interi sono in
`consegne/Cinematica 2026-11-14 - la nave/` (fuori da git); li rifà `strumenti/nave/confronto.py`.

**Che cosa non va ancora.**

- **È più semplice della foto di prima.** Lo still aveva la ricchezza di un’immagine generata (casse, tubi,
  sovrastrutture, una luce drammatica); la nave vera è coerente, gira davvero ed è la stessa da ogni lato, ma
  è più nuda. È la scelta fatta con la forma («può anche essere solo un tubo»); la strada per arricchirla è
  mettere altri oggetti sullo scafo, come i tre del terzo passo.
- **Non è ancora vista nell’eseguibile**: le foto vengono dal browser di sviluppo, con la stessa scheda video.
- I due still (`poppa.webp`, `prua.webp`) restano in `app/public/intro/`: `prua.webp` serve ancora alla
  copertina e alle viste dello scafo; `poppa.webp` non la usa più nessuno, e si toglie quando l’autore ha visto
  la nave nuova nel gioco.
- Il menu usa lo stesso motore, con la nave a diciotto chilometri: carica anche lui la nave vera (si apre senza
  errori; a quella distanza è un punto con i suoi fanali).

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

1. **Una scelta dell’autore, presa** (14 novembre 2026): la terza strada, «Nave vera dal vivo». Mentre preparavo le due riprese ferme ha chiesto: «Ma
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
   Ha scelto la terza: è il quarto passo, più sopra.
2. Le sue note sulla nave vera nell’intro (i fogli 4 e 5), e l’intro guardata nell’eseguibile.
3. Se lo spegnimento dei reattori deve sentirsi: il suo suono.
4. Altri oggetti sullo scafo, se la vuole più ricca; poi il faro e la fotografia unica dell’intro (documento
   09, §14).
