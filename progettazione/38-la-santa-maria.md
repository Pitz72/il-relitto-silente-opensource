# 38 — La Santa Maria: la scheda unica della nave

13 novembre 2026. Primo dei tre passi del **progetto della nave** (documento 09, §14): la scheda, poi le
schematiche, poi il modello in Blender. Nasce da due frasi dell’autore, lo stesso giorno: «credo che la Santa
Maria abbia gravi problemi di coerenza» e «Non lo so quale è l’immagine vera della Santa Maria, avendo generato
tutto con generatori di immagine non c’è mai stata una coerenza tra navi e tra nave e interno. Forse potrebbe
essere ideale progettarla proprio, disegnare delle schematiche».

> **Una nave sola, per tutti i progetti.** L’autore, il 13 novembre 2026, chiudendo la sessione: «la nave che
> stiamo lavorando sarà la nave in tutti i progetti». La Santa Maria di questo documento e del 39 è il canone
> ovunque compaia: nel Relitto Silente, nel *Mistero della Santa Maria*, nel cortometraggio, in quello che
> verrà. Il progetto della nave sta qui, e gli altri progetti la prendono da qui.

Questo documento **non decide niente**. Mette in fila quello che i due giochi e le immagini approvate dicono
della nave come oggetto (§2–§5), elenca le contraddizioni che contano per disegnarla, ognuna con una proposta
(§6), e dice che cosa nessuno ha mai scritto (§7). Le decisioni sono dell’autore. Lo schizzo
`38-la-santa-maria-schizzo.png` disegna la nave **come verrebbe con le proposte del §6**: è uno schizzo, non una
schematica.

---

## 1. Le fonti

**Il Relitto Silente** (intorno al 2201). Il testo del gioco: `relitto-silente/santamaria.fav` (l’atto sulla
nave), `relitto.fav` (la topologia), `ingresso.fav`, `fuga.fav`, `finali.fav`. Dove qui c’è un numero dopo i due
punti, è la riga.

**Il Mistero della Santa Maria** (2204), nella cartella `IlMisteroDellaSantaMaria/`, accanto a questa:

| Sigla | File | Che cos’è |
|---|---|---|
| 05 | `gioco/preproduzione/design/05_MappaNaveSantaMaria.md` | gli interni, schermata per schermata (S_01…S_10) |
| 05B | `gioco/preproduzione/design/05B_SchedaNaveEsterno.md` | la scheda canonica dello scafo, versione 1.4, ratificata dall’autore fra il 31 agosto e il 1° settembre 2026 |
| S01…S10 | `gioco/src/game/screens/S_01_plancia.ts` … `S_10_airlock.ts` | le battute che il gioco dice davvero |
| TB | `gioco/preproduzione/production/RevisioneTesti/00_TerminiBloccati.md` | il registro dei numeri canonici |
| PIS | `gioco/preproduzione/production/PromptImmagini_Schermate.md` | i prompt delle immagini |
| 12 | `gioco/preproduzione/narrative/12_IntroScene.md` | l’intro del seguito |
| BV | `progettazione/Cortometraggio/04_BibbiaVisiva.md` | il cortometraggio (adatta un altro racconto: vale come indizio) |

**Le immagini approvate** (`IlMisteroDellaSantaMaria/progettazione/assets/assets di gioco/immagini/`):
`nave-esterno/turnaround_approvato_2026-09-01.png` (la tavola: fianco, fronte, tre quarti, poppa),
`still_3-4_canonico_v2` (da cui viene `prua.webp` dell’intro), `still_clip03_poppa` (da cui viene `poppa.webp`),
`still_clip02_scafo-matricola`, `still_slot5_william-sullo-scafo`; e gli interni `location/nuove/s_01_b` …
`s_10`. Il Relitto usa per la lente del visore la plancia `s_01_b`, la cabina `s_03` (come cuccetta), la sala
macchine `s_05` e l’airlock `s_10` (come «la stiva verso poppa»): `grafica/LICENZE.md`.

**Che cosa vale di più.** Per il Relitto, il testo del gioco. Per il seguito, il codice delle schermate e TB;
05 dichiara da sé che le sue battute sono superate e che resta buono come descrizione d’ambiente. I prompt e le
immagini valgono meno dei testi: sono quello che un generatore ha capito.

---

## 2. Quello su cui tutti sono d’accordo

| | | Fonte |
|---|---|---|
| Nome e matricola | Santa Maria, **TSC-1972**, cargo | relitto.fav:6 · S01:25 |
| Prima registrazione | **14 marzo 2105** | santamaria.fav:201 · S09:197 |
| Età | 96 anni nel Relitto, 99 al disarmo | santamaria.fav:201 · S01:27, TB:64 |
| Chi c’è a bordo | William, da solo; **una poltrona**, **una branda** | santamaria.fav:44, 174 · 05:89, S03:33 |
| Lunghezza | **80 metri** (il Relitto non la dice mai nel gioco) | 05B:33, PIS:19 |
| Carattere | una nave da lavoro, riparata cento volte: toppe di metalli diversi, niente eleganza, niente vernice | 05B, «Aspetto» e decisione 6 |
| Lo scafo | lungo e basso, costruito intorno alla stiva; prua abitata e piccola; poppa compatta | 05B, «La sagoma» |
| Fuori | due banchi di pannelli solari fissi sui fianchi, alcuni di ricambio; arancione solo sulle marcature; la matricola in basso a prua della stiva, su tutti e due i lati, e ripetuta sulla piastra di poppa; un collare di presa sul dorso | 05B, decisioni 1, 5, 6, 7 |
| La stiva | il volume più grande, alta, con i ganci e un braccio su binario a soffitto | santamaria.fav:256, 266 · S04:143 |
| Il suono | il reattore si sente in tutta la nave, sotto i pavimenti | santamaria.fav:44, 215 · S02:42 |

I due giochi sono d’accordo anche sui lati, senza saperlo. Nel Relitto la stiva è a ovest della plancia e ha la
«paratia di poppa»: quindi **est è la prua**, e la cuccetta, a nord, cade sul **fianco sinistro** (babordo). Nel
seguito la cabina di William è a babordo (05:161).

---

## 3. La nave nel Relitto Silente

Quattro stanze, e fuori lo scafo (relitto.fav:113-116).

- **La plancia.** Una poltrona; gli schermi, con uno «schermo grande»; il quadrante del margine; la spia rossa
  della prossimità; la cloche, i vettori, il pilota automatico; la radio a lungo raggio; da qui si comandano il
  faro di prua e il lanciarpioni. Un oblò, «l’oblò principale». «Sotto il pavimento, il lamento basso del
  reattore» (:44). A ovest la stiva, a nord la cuccetta: che cosa ci sia in mezzo (una porta, un passaggio) non
  è detto.
- **La cuccetta.** «Poco più di un corridoio: una branda con i cassetti sotto, una lampada da lettura, un
  armadietto, un oblò grande quanto una mano» (:174). Dall’oblò piccolo: «Da questo lato la massa non si vede:
  solo stelle, ferme» (:193), in ogni momento della partita.
- **La stiva.** Vuota; «otto file di ganci da carico» al soffitto; «il mio passo rimbomba fino alla paratia di
  poppa»; contro la paratia la rastrelliera con la tuta; «da una botola si scende in sala macchine, e a poppa il
  boccaporto esterno dà sul vuoto» (:256). Il boccaporto: «due portelli e, in mezzo, abbastanza spazio per una
  persona in tuta» (:287), con una spia verde o rossa.
- **La sala macchine.** «Si scende per una scaletta stretta e l’aria cambia: calda, ferma, olio e ozono. Il
  reattore prende quasi tutto lo spazio, un cilindro d’acciaio rattoppato in tre punti» (:215). Il reattore è
  «vecchio quanto la nave» e tiene un re basso.
- **Fuori.** Il **faro di prua**: «un occhio da duecento metri» (:93). Il **lanciarpioni**: «due arpioni a testa
  magnetica, duecento metri di cavo ciascuno. Servono a tenere ferma una preda mentre la taglio» (:114); le funi
  restano «tese fra la prua della Santa Maria e lo scafo nero» (ingresso.fav:55). Dal boccaporto una **rampa**
  («finché tengo un piede sulla rampa sento il reattore nelle ossa») e una **luce gialla**.

**L’incontro con il relitto.** La massa «sta ferma sulla mia rotta»; William si accosta «a spinte corte» e si
ferma «a cinquanta metri dalla prua», con la sagoma che «riempie l’oblò da un bordo all’altro»; spara gli arpioni
e avvolge i cavi «finché le due navi non si toccano, con un urto lungo che fa tremare la plancia» (:118). Poi
esce dal boccaporto di poppa, e «fuori, a pochi metri, c’è la massa nera» (:257).

---

## 4. La nave nel Mistero della Santa Maria

Dieci schermate. Le misure dichiarate sono poche, e sono queste.

| | Stanza | Che cosa se ne sa |
|---|---|---|
| S_01 | plancia | «stretta ma verticalmente generosa» (05:87); la console al centro, la sedia del pilota girata fuori asse; il pannello dei sistemi vitali; un oblò (vedi §6, N2) |
| S_09 | modulo comunicazioni | addossato alla plancia a tribordo, dietro una porta socchiusa; **due metri per tre** (S09:305); il comunicatore occupa una parete |
| S_02 | corridoio principale | **quattordici metri** (S02:28), largo «abbastanza per far passare due persone»; undici luci al soffitto; si restringe verso la plancia e verso la sala macchine. Porte: la cabina (babordo, scorrevole), l’archivio (babordo, verso poppa, scorrevole), la stiva (tribordo, un portello a scorrimento verticale: «Pesa come una paratia. Perché lo è.», S02:119) |
| S_03 | cabina di William | stretta; una cuccetta a parete con la rete, una scrivania che si abbassa, una parete intera di ripiani; l’unica stanza con la luce calda. Nessuna finestra dichiarata |
| S_08 | archivio | «forse tre metri per tre» (05:723), ricavato da uno spazio che nei piani non aveva nome |
| S_04 | stiva | «quasi un terzo della lunghezza della nave» (05:291); «duecento metri quadri» (12:322); il braccio su binario, **due tonnellate** (S04:143). Il cortometraggio le dà 26 × 9 metri, alta più di 7 (BV:137): i numeri tornano |
| S_05 | sala macchine | quattro gradi più calda del resto; **due motori Hargreaves-Vance serie 7** in parallelo, che occupano due terzi dello spazio (05:360, S05:66); tre filtri dell’aria |
| S_06 | sezione strutturale | dietro un pannello imbullonato della sala macchine: larga due metri, bassa, buia |
| S_07 | vano cieco | dietro un altro pannello: tre metri per due, alto due; non è in nessuna planimetria; quattro casse |
| S_10 | airlock | «nella sezione di poppa», da un corridoio laterale di servizio che parte dalla sala macchine; un portello esterno con un oblò piccolo; due tute d’emergenza. «L’ho usato tre volte in diciassette anni, tutte per manutenzione esterna» (S10:71) |

Altri fatti: «Trentotto compartimenti» (il monologo dell’intro; TB:79): le schermate sono dieci, gli altri
ventotto non hanno nome. Nel 2156 la nave è stata restaurata (S05:131). In tutto il seguito le aperture verso
fuori sono due: l’oblò della plancia e quello dell’airlock.

**Come sono collegate.** 05B scrive: «È una spina da prua a poppa: nessun ponte sovrapposto, nessuna diramazione
laterale» (05B:67), e dice di averlo ricavato dal codice; ma nel codice ci sono solo gli elenchi delle uscite,
senza geometria. In nessun file del seguito c’è una scala, una botola o un passaggio fra due livelli; e in
nessuno è scritto con che cosa si passa dalla stiva alla sala macchine. Le tre piante che esistono (lo schema di
05, `MappaNaveSVG.svg`, la mappa che il gioco mostra con F6) non coincidono fra loro: in una la stiva sta sulla
spina, in un’altra di lato; in una cabina e archivio stanno sullo stesso fianco, in un’altra su fianchi opposti.

---

## 5. Le immagini

- **La tavola approvata.** Fianco: scafo lungo e basso, muso vetrato, due banchi di pannelli a prua della stiva
  e due a poppa, il portello di carico aperto (poi deciso chiuso), fari e un tamburo sul dorso, un pattino sotto
  la prua (difetto dichiarato). Misurata: l’altezza è circa un sesto della lunghezza, e il corpo è largo quanto
  è alto. A 80 metri: **circa 13 metri di larghezza e 12–13 di altezza**, 19–20 di larghezza con i pannelli.
  Di fronte: due ordini di vetrate. Da dietro: un blocco motori stretto con **quattro scarichi in quadrato**.
- **Lo still di tre quarti** (`prua.webp`): muso tondo vetrato, il portello di carico chiuso con il telaio
  arancione, la matricola in basso a prua.
- **Lo still di poppa** (`poppa.webp`): una **piastra piatta larga quanto lo scafo**, con la matricola e
  **quattro scarichi in due coppie in fila**, in basso; un faro grande sul dorso.
- **William sullo scafo**: il dorso è una superficie larga e curva, su cui si cammina, con pannelli d’accesso.
- **La plancia** (`s_01_b`, in tutti e due i giochi): una stanza a sezione rotonda; **un oblò tondo**, largo
  circa un metro, nella parete di fondo, sopra la console; la poltrona a sinistra; un pannello di schermi a
  destra.
- **Gli altri interni**: il corridoio dritto che finisce in un portello tondo; la cabina calda con una branda;
  la stiva alta, con il gancio; la sala macchine con **due motori**, uno per lato; l’airlock con due tute, la
  porta interna e il portello esterno con la ruota.

---

## 6. Le contraddizioni da sciogliere

> **Decise il 13 novembre 2026.** L’autore ha letto le otto proposte e ha risposto: «Sì, tutte». Da qui in
> avanti le otto voci valgono come canone della nave, per tutti e due i giochi. Le schematiche (documento 39)
> partono da qui.

Sono quelle che cambiano il disegno. Per ognuna: che cosa dicono le fonti, e che cosa propongo. Ho cercato, dove
si può, la lettura in cui **hanno ragione tutti e due i giochi**.

### N1 · La sala macchine sta sotto, o dietro?

- **Il Relitto**: sotto. «Da una botola si scende in sala macchine»; «si scende per una scaletta stretta»; il
  reattore «sotto il pavimento» della plancia; dalla plancia, il brusio «viene da giù, dalla stiva»
  (finali.fav:30).
- **Il seguito**: 05B dice «nessun ponte sovrapposto»; ma nessun testo dice come si passa dalla stiva alla sala
  macchine. E qualche battuta guarda in basso: «sotto le piastrelle […] c’è la struttura portante. Sotto ci si
  arriva dai pannelli» (S02:42-47); il vano cieco è «qui sotto» (S07:205).
- **Le immagini**: uno scafo alto dodici metri, con stanze alte due e mezzo.

**Propongo: un ponte solo, e la sala macchine più in basso.** Non due piani abitati: un ponte, quello dove si
vive, e a poppa la sala macchine con il pavimento più giù, dove si arriva dal fondo della stiva per una botola e
una scaletta. Sotto tutto il ponte corre uno spazio tecnico basso (la struttura, i condotti), ed è lì che il
reattore si sente da ogni stanza. Così il Relitto resta vero parola per parola, e nel seguito non cambia una
battuta; in 05B si corregge una frase.

### N2 · Il viso della nave: un oblò tondo, o un muso di vetro?

- **Dentro**, in tutti e due i giochi, la plancia ha **un oblò tondo** («l’oblò principale»; «Quarantotto anni
  di oblò», S01:101; l’intro del Relitto è costruita su quell’oblò).
- **I documenti del seguito** dicono un’altra cosa: «l’oblò principale occupa quasi l’intera parete di prua,
  curvo» (05:87), ed è «l’unica apertura grande della nave, e da fuori è la cosa che si legge per prima»
  (05B, «La sagoma»).
- **Fuori**, tutte le immagini hanno un muso vetrato a più vetri, su due ordini: una cabina da aereo.

Sono tre navi diverse. **Propongo: un solo oblò tondo, grande, a prua, in un muso di metallo chiuso.** È l’oblò
che il giocatore conosce da dentro in tutti e due i giochi; è «la cosa che si legge per prima» come vuole 05B;
ed è un occhio (i titoli di coda del seguito si chiamano *Eye of the Ship*). Il muso vetrato è quello che i
generatori disegnano quando leggono «astronave»: la regola di 05B contro il generatore vale anche qui.

### N3 · La poppa: quattro scarichi come, e che cosa c’è dietro?

- 05B: «quattro porte piccole, a filo della piastra di poppa» (e avverte che è la decisione meno solida).
- La tavola: quattro in quadrato, su un blocco stretto. Lo still di poppa: due coppie in fila, su una piastra
  larga.
- Dentro: nel Relitto **un reattore**, un cilindro che prende quasi tutta la sala; nel seguito **due motori**
  in parallelo, che ne prendono due terzi.

**Propongo: la poppa dello still.** Una piastra piatta, quattro scarichi in due coppie, una coppia per motore:
è l’immagine approvata, è quella che l’intro del Relitto usa già, e rispetta 05B. Dentro, la sala macchine ha
tutte e due le cose: **il reattore al centro**, che dà l’energia e tiene il re, e **i due motori ai lati**, che
spingono. Nessuno dei due giochi viene smentito: ognuno guarda la macchina che gli serve.

### N4 · Da dove si esce

- **Il Relitto**: dalla stiva, «a poppa», per un boccaporto con la camera per una persona; la rastrelliera con
  la tuta è lì accanto.
- **Il seguito**: dall’airlock, «a poppa, a tribordo» (05B, decisione 4), che si raggiunge dalla sala macchine
  per un corridoio laterale di servizio. Il portello di carico è un’altra cosa, sul fianco sinistro della stiva
  (decisione 3), e nel Relitto non compare mai.

**Propongo: un’uscita sola per le persone, a poppa sul fianco destro.** È lo stesso portello nei due giochi: sta
in fondo a un breve passaggio di servizio che parte dal fondo della stiva e costeggia la sala macchine. Nel
Relitto William ci arriva dalla stiva; nel seguito, dalla sala macchine. Il portello di carico resta sul fianco
sinistro, chiuso.

### N5 · Come sta la nave contro il relitto

Il testo del Relitto dice quattro cose che insieme non tornano: la prua guarda la massa a cinquanta metri; le
funi partono dalla prua; i cavi si avvolgono «finché le due navi non si toccano»; e si esce da poppa, con la
massa «a pochi metri». Dall’oblò della cuccetta, poi, la massa non si vede mai.

**Propongo: affiancata, sul fianco destro.** La nave arriva di prua e spara; mentre avvolge i cavi, la prua
tocca e la poppa gira, finché tutto il fianco destro è contro lo scafo nero («un urto lungo»; la bibbia sonora
ha già «lo strofinio lungo di due scafi»). A quel punto il portello d’uscita, che è a poppa su quel fianco, ha
il nero a pochi metri; e l’oblò della cuccetta, sull’altro fianco, vede solo stelle. Con N4 e con i lati del §2
torna tutto, senza cambiare il testo.

### N6 · L’oblò piccolo della cuccetta

Nel Relitto c’è, «grande quanto una mano», e serve (è il lato da cui la massa non si vede). Nel seguito la
cabina non ha finestre dichiarate, e l’immagine non ne mostra.

**Propongo: c’è.** Sul fianco sinistro, piccolo com’è scritto: nella parete della branda, che è quella dello
scafo, dove l’immagine ha la rete e la mensola.

### N7 · Il corridoio

Nel seguito fra la plancia e la stiva ci sono quattordici metri di corridoio, con la cabina e l’archivio. Nel
Relitto dalla plancia «a ovest si va in stiva», e la cuccetta è «a nord».

**Propongo: il corridoio c’è, e il Relitto non lo nomina.** Un’avventura testuale non conta i passi. La porta
della cabina è la prima a sinistra, appena fuori dalla plancia: per chi sta in plancia, è «a nord».

### N8 · Le misure

Nessuno ha mai scritto larghezza e altezza. **Propongo: 80 × 13 × 12 metri** (19 di larghezza con i pannelli),
dalla tavola; la stiva 26 × 9, alta 7, dal cortometraggio, che torna con «un terzo della nave» e con i «duecento
metri quadri». Nel Relitto la lunghezza sta solo in due documenti («un centinaio di metri», 09:17) e nel motore
dell’intro (96 e 112): si portano a 80.

---

## 7. Quello che nessuno dice

Per disegnare la nave bisogna inventarlo, e conviene farlo una volta sola:

- dove stanno il **faro di prua** e il **lanciarpioni** (il seguito non li ha; le immagini mostrano due fari sul
  dorso), e i due verricelli dei cavi;
- la **rampa** e la **luce gialla** del portello d’uscita;
- che cosa c’è nei compartimenti senza nome (trentotto in tutto): l’aria, l’acqua, il propellente, la cucina, il
  bagno; nessun testo li nomina;
- le antenne (il radar, la radio a lungo raggio, il comunicatore del seguito con il suo amplificatore);
- che cosa riempie lo scafo sopra le stanze di prua, alte due metri e mezzo in uno scafo di dodici;
- la gravità: nessuno dice come si sta in piedi (i transpallet hanno le ruote, le suole sono magnetiche solo
  nel cortometraggio);
- dove guarda esattamente l’oblò della plancia (nell’intro del Relitto la massa è avanti e a sinistra, e la
  nave scivola di lato).

Contraddizioni che **non** cambiano il disegno, e restano dove sono: le due tute del portello contro la tuta
sola del Relitto; gli anni di William a bordo nel seguito (diciassette, dodici, venti); «la nave ne ha
quarantotto» (S01:195) contro i novantanove; il numero delle casse; l’airlock «usato tre volte in diciassette
anni», detto da un recuperante.

---

## 8. Dopo

1. ~~Le decisioni dell’autore sulle otto voci del §6~~: prese il 13 novembre 2026 («Sì, tutte»). E la nave
   vale per tutti i progetti (vedi in cima): il progetto resta in questo repository.
2. **Le schematiche**: fianco, pianta, fronte, poppa, sezioni, con le stanze dentro lo scafo e le misure;
   disegnate da uno strumento a partire da una tabella di misure (`strumenti/nave/`), la stessa che poi
   costruisce il modello. **La prima stesura è fatta** lo stesso giorno: documento 39, tre tavole, da
   approvare.
3. **Il modello in Blender** (5.2.4 LTS, guidato da script del progetto), e da lì le due riprese dell’intro con
   le luci separate: lo scafo, l’oblò d’ambra, i fanali, la spinta dei quattro scarichi.
4. Solo alla fine, e solo se l’autore lo vuole: le frasi dei documenti del seguito che le decisioni hanno
   superato (05B:67, 05:87).
