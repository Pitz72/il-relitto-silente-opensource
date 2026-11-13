# 39 — Le schematiche della Santa Maria

13 novembre 2026. Secondo passo del progetto della nave (documento 38). L’autore ha approvato le otto proposte
del documento 38, §6 («Sì, tutte»); queste tavole le mettono in misura. Sono una **prima stesura, da
approvare**: quando l’autore le ha viste e corrette, dalle stesse misure si costruisce il modello in Blender.

## Le tavole

Tre fogli da 2560 × 1440, in `progettazione/39-schematiche/`:

| Tavola | Che cosa mostra |
|---|---|
| `tavola-1-fuori.png` | il fianco sinistro, il fianco destro, il muso, la poppa |
| `tavola-2-dentro.png` | la sezione lungo la nave, tagliata nel mezzo; la pianta del ponte |
| `tavola-3-sotto.png` | la pianta del livello basso; tre sezioni di traverso (la plancia, la stiva, la sala macchine), ingrandite |

Le disegna `strumenti/nave/schematiche.py` dalla tabella `strumenti/nave/misure.py`, che è **l’unico posto dove
stanno i numeri**: la stessa tabella costruirà il modello, così tavole e modello non possono divergere. Per
cambiare la nave si cambia un numero lì e si rifanno le tavole (`python strumenti/nave/schematiche.py`).

Le convenzioni: tutto in metri; la x va da prua (0) a poppa (80); la y dal fianco sinistro (negativa) al destro
(positiva); la z è l’altezza, e 0 è il pavimento del ponte. Nelle piante la prua è a sinistra e il fianco destro
in alto. Il fianco sinistro è quello con il portello di carico: è la vista «di fianco» della tavola approvata.

## Da dove viene ogni cosa

**Dalle otto decisioni (38, §6).** Un ponte solo, con la sala macchine 2,6 metri più in basso, raggiunta dal
fondo della stiva per la botola e la scaletta, e uno spazio tecnico sotto tutto il ponte (N1). Un solo oblò
tondo a prua, in un muso chiuso (N2). La poppa piatta con quattro scarichi in due coppie; dentro, il reattore al
centro e un motore per lato (N3). Un’uscita sola per le persone, a poppa sul fianco destro (N4), che è il fianco
che resta contro il relitto (N5). L’oblò piccolo della cuccetta sul fianco sinistro (N6). Il corridoio di 14
metri (N7). 80 × 13 × 12 metri, e la stiva 26 × 9, alta 7 (N8).

**Dai testi dei due giochi.** La plancia «stretta ma verticalmente generosa» (4 × 5, alta 4,2). Il modulo delle
comunicazioni di due metri per tre, addossato alla plancia a tribordo «come un’aggiunta»: sporge appena dallo
scafo. La cabina a babordo, la prima porta; l’archivio di tre metri per tre, a babordo, più verso poppa. Il
portello della stiva in fondo al corridoio. Il braccio su binario e i ganci al soffitto della stiva. La sezione
strutturale larga due metri e bassa, dietro la sala macchine; il vano cieco di tre metri per due. Il portello di
carico sul fianco sinistro della stiva. La matricola in basso a prua della stiva, sui due fianchi, e sulla
piastra di poppa. Il collare di presa sul dorso, a prua della stiva. Il faro di prua e i due arpioni (Relitto).

**Dalle immagini approvate.** La sagoma lunga e bassa; i pannelli solari ai due lati del portello di carico
(quattro per fianco); il faro sul dorso; i fanali di poppa; la piastra di poppa con il camminamento sotto.

## Quello che è inventato qui

Nessun testo lo dice: sono proposte, e l’autore le conferma o le cambia guardando le tavole.

- **Il muso**: tronco, chiuso, con la faccia di prua larga 3,4 metri e alta 3; l’oblò ha 1,1 metri di diametro,
  come nell’immagine della plancia.
- **Il passaggio di servizio**: un corridoio stretto lungo il fianco destro, dal fondo del corridoio principale
  fino all’uscita, con una porta dal fondo della stiva e una per la sala macchine. È quello che permette al
  Relitto di uscire «dalla stiva» e al seguito di arrivare all’uscita «dalla sala macchine», e dà al seguito il
  suo collegamento diretto fra corridoio e sala macchine.
- **La cuccetta** come stanza stretta e lunga (2,6 × 4,2), dalla porta fino allo scafo.
- **I locali senza nome** intorno al corridoio, in grigio nelle tavole: aria e acqua, cambusa e bagno, un
  deposito, un locale tecnico; sopra, i serbatoi.
- **Il portello d’uscita**: 1,2 × 2 metri, con sopra la luce gialla e fuori una pedana (la «rampa» del
  Relitto).
- **Sul dorso**: dove stanno il faro, il radar, l’antenna della radio. **Sotto il muso**: i due tubi degli
  arpioni.
- **Le macchine**: il reattore, un cilindro di 2,4 metri per 10; i due motori di 2,4 metri di diametro; i
  condotti che corrono sotto le stanze di poppa fino agli scarichi, in basso sulla piastra.

## Che cosa manca, e viene con il modello

Lo scafo delle tavole è un solido semplice: i particolari della superficie (le toppe di metalli diversi, le
staffe dei pannelli, i pannelli d’accesso sul dorso, il fasciame rivettato) sono lavoro del modello, sulla
scheda 05B del seguito. Così le luci: l’ambra dell’oblò, i fanali, la luce gialla dell’uscita, la spinta dei
quattro scarichi.
