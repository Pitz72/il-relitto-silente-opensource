# L’interfaccia viva: il programma estetico dello schermo di gioco

Versione 1.1, 27 ottobre 2026 (il §8 racconta il primo lotto fatto, la scheda «Grafica» e le misure). Risponde alla richiesta dell’autore: «vorrei un rafforzamento importante
della parte estetica, animazioni, effetti, lievissime pulsazioni, tutto quello che possa servire per dare
uno step in avanti. Parlo di interfaccia di gioco. Poi ci occuperemo del perfezionamento dell’intro e una
eventuale finale. Poi torneremo a tutte le altre fasi».

Riguarda lo schermo di gioco: la lamina del testo, il visore, il ramo delle azioni, le vene, i pannelli.
L’intro e il finale (E2 della revisione 25) vengono dopo, in un documento loro.

---

## 1. In breve

- **Il cuore regge, i passaggi no.** La membrana del relitto ha già una vita sua (le vene che crescono,
  la cellula che respira, la lamina che cambia forma in diciotto secondi, la mappa che pulsa). Quasi tutto
  il resto è fermo, e soprattutto **ogni cambiamento arriva di colpo**:
  - una stanza nuova sostituisce il testo e i pulsanti in un fotogramma;
  - una cosa presa sparisce da «qui» e ricompare in «con te»;
  - l’aria che cala si legge solo nel «−4» che sale;
  - i pannelli si limitano a comparire in dissolvenza.
  
  La Santa Maria (l’acciaio) è ferma del tutto: una foto, tre righe di testo, una cornice.
- **Trovato guardando:** cambiando zona del relitto le vene tengono il colore di prima. Entrando nel
  laboratorio restano ciano invece che azzurro elettrico; dopo la fuga, davanti all’Anziano, restano rosse.
  Le vene leggono i colori una volta sola (revisione 25, M10), proprio nel momento in cui i colori
  stanno cambiando: prendono quello vecchio e lo tengono. È la prima correzione del lotto 1.
- **Il programma** è in tre lotti:
  1. **la luce che vive**: la grana, il vetro del casco, la luce che respira, il segnale sui fili;
  2. **i momenti**: l’arrivo in una stanza, l’aria che si consuma, le cose che si spostano, i pannelli,
     il cartello d’atto, la protezione vitale, la fuga, l’ipossia;
  3. **le rifiniture**: il tocco dei pulsanti, i nomi nel testo, la Santa Maria che lavora.
  
  Il lotto 1 e la parte più sicura del 2 (2.1–2.5) sono fatti (§8); il resto dopo il giudizio dell’autore.
- **Niente si toglie** (decisione dell’autore, 27 ottobre: «non voglio che togli l’effettistica dal gioco,
  al massimo fai un pannello impostazioni per la grafica più evoluto»). Gli effetti restano tutti accesi
  di base; nelle Opzioni c’è una scheda **«Grafica»** con tre livelli e un interruttore per effetto (§8).

---

## 2. Le regole che restano

Le regole del documento 06 (§2, §5) e della revisione 25 non si toccano:

1. **Il testo prima di tutto.** Niente si muove vicino al testo mentre lo si legge: la colonna del testo
   ha solo la sua rivelazione a righe. Gli effetti stanno ai bordi, nel visore, sui fili.
2. **Diegetico.** Ogni effetto è qualcosa che William vede: il vetro del casco, la grana del monitor di
   bordo, la luce che corre nella membrana, il segnale sul cavo. Niente scintille decorative.
3. **Le forme si muovono, le cifre no.** La cifra dell’aria non rotola: è la cellula che si contrae.
4. **Il movimento ridotto** spegne ogni movimento decorativo (`data-movimento="pieno"`); restano i colori
   e le dissolvenze brevi.
5. **Il conto delle prestazioni** (revisione 25, M10). A gioco fermo, misurato nell’eseguibile a
   1920 × 1080, la pagina deve restare sotto il 30 % di un core e la scheda video sotto il 25 %, come
   oggi.
   - I movimenti continui si fanno solo con l’opacità e le trasformazioni, che la scheda video compone
     senza ridipingere.
   - I disegni su tela vanno al più a 30 fotogrammi al secondo.
   - Gli effetti che costano, come la sfocatura dietro i pannelli, vivono solo finché servono.
6. **Leggibilità:** i contrasti di `atmosfere.ts` (4,5:1 per il testo) e nessun testo sotto i 12 px.
   La grana e i riflessi sono decorazione: non scendono mai sotto il testo in modo da abbassarne il
   contrasto misurabile.

---

## 3. Il lotto 1: la luce che vive

| | Che cosa | Dove | Come, e quanto costa |
|---|---|---|---|
| 1.1 | **Le vene con il colore giusto**, che passano da un clima all’altro in un secondo e mezzo, come il resto dello schermo | `vene/Vene.tsx` | i colori arrivano dalla tavolozza del clima (`atmosfere.ts`), non dal CSS a metà del passaggio; il ciclo li mescola nel tempo del passaggio |
| 1.2 | **La grana.** Sulla Santa Maria la grana del monitor di bordo, nel relitto il rumore del sensore del visore | `gioco/Grana.tsx` | una tessera di rumore fatta una volta, su uno strato solo; si sposta a scatti, dieci volte al secondo, con una trasformazione (niente da ridipingere); ferma con il movimento ridotto |
| 1.3 | **Il vetro del casco.** Con la tuta: il riflesso curvo in alto a sinistra, la rifrazione ai bordi; sotto il 30 % di aria il fiato appanna il fondo del vetro, al ritmo del respiro | `gioco.css`, `visore.css` | strati fermi con l’opacità che respira, come il bordo che c’è già |
| 1.4 | **La luce che respira.** Dietro la lamina, la luce della stanza: nel relitto l’alone della membrana, sulla Santa Maria il riverbero caldo del reattore dal basso. Un respiro di quattordici secondi | `gioco.css` | uno strato con un gradiente, solo opacità |
| 1.5 | **Il segnale sui fili.** Ogni sette secondi una luce corre lungo il filo alto del ramo: nella membrana la linfa verde, nell’acciaio un impulso ambra sul cavo | `ramo/Ramo.tsx`, `ramo.css` | un tratto solo, in uno strato suo |

## 4. Il lotto 2: i momenti

| | Che cosa | Dove | Come |
|---|---|---|---|
| 2.1 | **L’arrivo in una stanza**: il nome della stanza entra con la sua riga di luce, che si allunga da sinistra; sulla Santa Maria la telecamera cambia canale (un lampo di disturbo, la riga che rotola); nel relitto la scansione c’è già | `lamina.css`, `Visore.tsx` | animazioni che partono una volta, al cambio di stanza |
| 2.2 | **L’aria che si consuma**: la cellula si contrae, come un sorso, a ogni consumo; con una ricarica si allarga, e un anello di luce si apre intorno | `Visore.tsx`, `visore.css` | una classe che riparte a ogni turno |
| 2.3 | **Le cose che si spostano**: una cosa presa scivola da «qui» a «con te»; i pulsanti di una stanza nuova germogliano da sinistra a destra lungo il filo, nell’acciaio si accendono come spie | `Ramo.tsx`, `ramo.css` | le posizioni di prima ricordate per chiave (FLIP), trasformazioni |
| 2.4 | **I pannelli** (revisione 25, E6): il gioco dietro si sfoca, il pannello sale di poco mentre compare | `pannelli.css`, `diario.css` | la sfocatura vive solo a pannello aperto |
| 2.5 | **La spia della registrazione** sulla telecamera di bordo: un punto rosso che lampeggia lento accanto alla didascalia | `Visore.tsx` | opacità a scatti |
| 2.6 | **Il cartello d’atto**: il numero entra largo e si stringe, la riga di luce si disegna sotto, poi tutto si spegne | `visore.css` | una sola animazione, due secondi e mezzo come oggi |
| 2.7 | **La protezione vitale**: quando scatta, un’onda rossa attraversa il vetro e la fascia scende dall’alto | `visore.css` | una volta, all’ingresso nello stato |
| 2.8 | **La fuga**: crepe sui bordi del vetro, che si aprono all’inizio della fuga e pulsano rosse | `gioco/Crepe.tsx` | un disegno fermo con l’opacità che pulsa |
| 2.9 | **L’ipossia**: la vignettatura che stringe con il battito, invece di un respiro regolare | `visore.css` | opacità e scala di uno strato |

## 5. Il lotto 3: le rifiniture

- **Il tocco**: il pulsante premuto si abbassa (una scala di 0,97), e dal baccello parte un’onda di luce
  lungo il filo.
- **I nomi nel testo**: la sottolineatura di un nome toccabile cresce da sinistra al passaggio del
  mouse; il suggerimento acceso respira anche nell’acciaio, come una spia.
- **La Santa Maria che lavora**: al posto della riga «radar · contatto non identificato» un piccolo
  schermo radar con la sua spazzata e il punto del contatto, con la scritta sotto; la lancetta del
  margine nel rosso.
- **«continua ↓»** che respira quando c’è altro da leggere.
- **La riga del comando dato** (sopra la risposta) che si scrive in fretta, come su un terminale.
- Da decidere con l’autore: **E7**, la cornice sugli schermi 16:10; **E4**, la modalità scritta.

## 6. Come si prova

- Ogni effetto si guarda nel gioco dello sviluppo (`?gioco`, e `window.__gioco.percorso(nome, passo)`
  per arrivare in un punto della partita), in tutti i climi: Santa Maria, visore, relitto, le cinque
  zone, protezione, fuga, ipossia.
- Con il movimento ridotto non si muove niente di decorativo.
- Le prestazioni si misurano nell’eseguibile con `strumenti/misure/consumo.mjs`, a gioco fermo e nella
  fuga, contro i numeri della revisione 25 (M10).
- Restano verdi `npm run prove`, i collaudi del ponte e le due prove nell’eseguibile (`finali`,
  `salvataggi`).

---

## 7. Registro

### 7.1 Il primo lotto (27 ottobre 2026)

Fatti: 1.1–1.5 e 2.1–2.5, più la scheda «Grafica» (§8). Restano 2.6–2.9 e il lotto 3.

- **1.1** `Vene.tsx`: i colori dalla tavolozza del clima (`tavolozza()`), mescolati nel secondo e mezzo del
  passaggio; durante il passaggio le vene si ridisegnano intere, poi tornano alla copia in memoria.
  Provato: dalla Santa Maria al vestibolo sono ciano e verdi, nel laboratorio azzurre, dopo la fuga davanti
  all’Anziano non più rosse.
- **1.2** `Grana.tsx`, `grana.css`: la tessera di 192 px fatta una volta (punti chiari più rari e più tenui
  degli scuri), su uno strato che sporge solo in alto e a sinistra, dentro un contenitore che lo ritaglia:
  sporgendo, lo schermo diventava più alto di sé e un fuoco lo faceva scorrere di 25 px.
- **1.3** il riflesso (`.riflesso`) e il fiato sotto il 30 % (`.appannato`), al passo del respiro del vetro.
- **1.4** `.luce-stanza`: l’alone della membrana (rosso nella protezione e nella fuga), il riverbero del
  reattore sulla Santa Maria.
- **1.5** `.ramo-segnale`: un tratto sul filo alto, `pathLength` 1000, ogni sette secondi; nell’acciaio un
  impulso ambra più corto; fermo nella protezione vitale, più frequente nella fuga.
- **2.1** il nome della stanza e la sua riga (`lamina.css`), la telecamera che cambia canale, le righe del
  monitor e la riga chiara che scende (`Visore.tsx`, `visore.css`).
- **2.2** la cellula (o l’anello) che si contrae a ogni consumo, più forte se il consumo è grande, e si
  allarga con una ricarica, con l’anello di luce (Web Animations, sulla forma: la cifra non si muove).
- **2.3** i baccelli (`Ramo.tsx`): le posizioni di prima per chiave, e chi si sposta parte da lì (FLIP); i
  nuovi germogliano da sinistra a destra, nell’acciaio si accendono come spie. Una cosa presa scivola da
  «qui» a «con te».
- **2.4** i pannelli: la sfocatura dietro, il pannello che sale; con un pannello aperto i movimenti dietro
  si fermano, vene comprese (`data-pannello`, `inPausa`).
- **2.5** la spia rossa della registrazione accanto alla didascalia della telecamera.

Provato nel gioco dello sviluppo (la plancia, la stiva, il vestibolo, il laboratorio, la protezione
vitale, la ricarica, la pausa, le opzioni); con il movimento ridotto non parte nessuna animazione;
`npm run prove` 92 su 92; nell’eseguibile vero i sei finali con i titoli di coda e i salvataggi.

---

## 8. La scheda «Grafica» e quanto costa

**La scheda.** Nelle Opzioni, fra «Gioco» e «Audio». Una riga «Qualità degli effetti» con tre livelli, e
sotto un interruttore per ogni effetto; scegliendo un effetto a mano nessun livello resta premuto.

| Effetto | piena (di base) | leggera | essenziale |
|---|---|---|---|
| grana | mossa | ferma | niente |
| vene della membrana | vive | vive | ferme |
| luce della stanza | sì | no | no |
| segnale sui fili | sì | sì | no |
| riflessi sul vetro | sì | sì | no |
| sfocatura dietro i pannelli | sì | no | no |

Il movimento ridotto, nella scheda «Gioco», resta l’opzione di accessibilità: ferma tutto, a ogni livello.
È la prima parte dei «livelli di qualità» della fase 8 (documento 06, §14).

**Le misure** (nell’eseguibile, 1920 × 1080, a gioco fermo, `strumenti/misure/consumo.mjs`, senza la lente
di Windows: l’autore la toglie quando gioca).

| | scheda video | pagina (un core) |
|---|---|---|
| prima del lotto (217c08c), i salvataggi 3 e 4 | 15–18 % | 19–26 % |
| il lotto, con le animazioni lente a 60 fotogrammi | 37–40 % | 22–39 % |
| il lotto finito, grafica piena (salvataggi 3, 4, 5) | **11–15 %** | 21–30 % |
| grafica leggera, essenziale (salvataggio 3) | 11 % | 19–20 % |
| il menu, prima e dopo | 16 % | 4–5 % |

Due cose imparate misurando:

- **Il costo non era degli effetti, ma della frequenza.** Le animazioni lentissime (il respiro della luce, del
  vetro, del fiato, l’impulso della mappa, il segnale) a 60 fotogrammi costringevano la scheda video a
  ricomporre lo schermo intero sessanta volte al secondo, con tutti gli strati sopra. A piccoli passi
  (`steps()`: da 10 a 30 al secondo, invisibili a quella lentezza) lo schermo si ricompone solo quando
  qualcosa cambia davvero, e il gioco costa meno di prima. Le animazioni che partono una volta lasciano il
  posto allo stile quando finiscono (`backwards` invece di `both`): tenute, restavano vive fino al turno dopo.
- **Lo strumento di misura spegneva per finta.** Per togliere un effetto aggiungeva un `<style>` alla
  pagina, ma nell’eseguibile la politica di sicurezza dei contenuti lo blocca: non si spegneva niente, e ogni
  prova diceva «nessuna differenza». Ora spegne sugli elementi (CSSOM). Lo stesso valeva per le scene
  «animazioni» e «varianti» del 19 ottobre (revisione 25, M10): la frase «spenti uno alla volta non cambiava
  niente» viene da lì. Le misure prima e dopo di M10, a eseguibili interi, restano buone.

---

## 9. I momenti con un’animazione loro (11 novembre 2026)

L’autore, dopo la revisione globale: «ci sono momenti che potrebbero richiedere un’animazione speciale giusto per introdurli? Io ad esempio farei un’animazione di creazione della mappa stellare olografica e cercherei un modo per far apparire l’Anziano in modo molto molto stiloso. Ce ne potrebbero essere un altro o due?» Ha chiesto anche che cosa migliorerei nell’interfaccia e nell’estetica della cinematica d’apertura.

### 9.1 La proposta

**I momenti**, quattro:

| | Momento | Come | Stato |
|---|---|---|---|
| 9.a | **L’apparizione dell’Anziano** (dell’autore) | i punti della figura nascono sulle linee del pavimento, salgono girando intorno al sostegno e la chiudono dalla base alla testa, sul canto del primo contatto; le volte dopo, due secondi | **fatta e approvata** (§9.2) |
| 9.b | **La mappa stellare** (dell’autore) | le postazioni e la struttura a stella si accendono, la luce sale sulla cupola e le stelle affiorano al loro posto: due galassie e il vuoto in mezzo; la rotta si traccia piano dai tre soli fino al nostro, che si accende per ultimo; poi tutto rientra nella lente del visore, dove resta. Venti secondi scarsi, una volta sola | **fatta e approvata** (§9.4) |
| 9.c | **La dissolvenza dell’Anziano** | lo stesso movimento al contrario: al gesto «[Chiudi gli occhi e lascia andare.]» i punti si stringono in un punto di luce, che scende sul sostegno e diventa il seme | **fatta e approvata** (§9.3) |
| 9.d | **La nave che si sveglia** | quando torna l’energia lo schermo si spegne; la lente guizza con gli archi; poi una luce parte dal generatore e attraversa piano tutto lo schermo: dove passa le vene si accendono e gli strumenti tornano uno dopo l’altro; per ultime le parole. Dieci secondi e mezzo, una volta sola | **fatta e approvata** (§9.5) |

Scartate: la Grande Porta e il primo passo sullo scafo, che hanno già la soglia dell’atto, con la sua musica e il suo cartello.

**L’interfaccia**, in ordine di effetto: i quattro momenti del lotto 2 mai fatti (2.6–2.9: il cartello d’atto, la protezione vitale, le crepe della fuga, l’ipossia); la Santa Maria che lavora (il radar al posto della riga di testo, la lancetta del margine: lotto 3); una schermata per il finale (revisione 25, E2); il menu con il marchio del gioco (E3); per chi vede poco, «diario» e «menu» più grandi, «Testo: grande» anche su pulsanti e dialogo, il pulsante sotto il mouse più evidente (revisione 37, L8 e L9).

**La cinematica d’apertura**, solo l’estetica: portare al livello delle altre le tre scene rimaste com’erano (B, E, F: documento 09, §12); il relitto come materia dove passa il faro (un rilievo appena leggibile, una vena verde spenta); la Santa Maria illuminata (le luci di posizione, il bagliore dei motori, il bordo acceso dal faro); un cielo più ricco (la Via Lattea delle copertine, stelle di temperature diverse su più piani); una fotografia sola per tutte le scene. Per l’autore, che vede poco: luce e forme grandi prima del dettaglio fine. Prima di toccarla va guardata scena per scena, mostrandogli i fotogrammi. *13 novembre 2026:* guardata, e cominciata (documento 09, §14): **il cielo è rifatto**; il punto del relitto come materia è **ritirato** (il testo lo vuole nero assoluto, e il faro non trova niente); la Santa Maria aspetta, perché l’autore pensa di rifarla come modello in Blender.

Le regole del §2 valgono tutte: sobrio, dentro quello che William vede, niente che si muova accanto al testo mentre lo si legge, fermo con il movimento ridotto, spegnibile dalla scheda «Grafica».

### 9.2 Registro: l’apparizione dell’Anziano

Fatta l’11 novembre 2026 sulla figura di punti che c’era già (`app/src/gioco/dialogo/Dialogo.tsx`, la funzione `anziano`; i tempi in `dialogo/apparizione.ts`). L’autore l’ha guardata nel browser dello sviluppo: «l’animazione è bellissima ma il testo deve apparire solo ad animazione finita, con una dissolvenza»; corretto, «perfetto così».

- **Il primo incontro**, 4,6 secondi: il pavimento si traccia (i tre cerchi uno dopo l’altro, i raggi dal centro), il sostegno sale; i 3.200 punti nascono sulle linee del pavimento, salgono a spirale intorno al sostegno, ognuno con la sua scia, e chiudono la figura dalla base alla testa; una colonna di luce sale con loro (la forma grande, quella che si legge anche da lontano); quando la testa è chiusa l’alone si accende e un’onda si allarga sul pavimento.
- **I tempi sono quelli del suono**: finisce quando il canto del primo contatto lascia il posto alla voce (`CANTO_VOCE`, 4,6 s, in `mondo/musica.rs`). La prova `app/prove/apparizione.test.ts` tiene uguali i due numeri.
- **Le parole dopo** (decisione dell’autore): le battute e le risposte compaiono soltanto ad apparizione finita, in una dissolvenza di un secondo. Un clic o un tasto la chiudono subito; se il disegno non gira (la finestra nascosta) le parole arrivano comunque dopo qualche secondo.
- **Le volte dopo**, due secondi: i punti rientrano da poco lontano, dal basso verso l’alto.
- **Quando**: se il colloquio si apre in quel turno (non riprendendo una partita a metà colloquio); il primo incontro lo dice la cronaca, che segue i caricamenti e gli «annulla» (`Gioco.tsx`, `arrivo`).
- **Le scelte di chi gioca**: con il movimento ridotto la figura c’è subito; nella scheda «Grafica» l’interruttore «Apparizioni» (acceso nei livelli pieno e leggero, spento nell’essenziale).
- **Quanto costa**: misurato nel browser dello sviluppo a 1280 × 720, nessun fotogramma perso nei 4,6 secondi (276 fotogrammi, al più 16,9 ms l’uno). A gioco fermo non costa niente: dopo, il disegno è quello di prima.
- **Per guardarla** nello sviluppo: `?gioco&percorso=vivi.txt&fino=66`; un clic sulla figura la fa apparire di nuovo.
- **Vista e ascoltata** dall’autore nell’eseguibile, con il canto, la sera dell’11 novembre 2026 (§9.6).

### 9.3 Registro: la dissolvenza dell’Anziano

Fatta l’11 novembre 2026, dopo l’apparizione, sulla stessa figura (`Dialogo.tsx`: `dissolvenza`, `andato`, `seme`, `pavimento`). L’autore l’ha guardata nel browser dello sviluppo: «Sì, va bene».

- **Segue il testo del nodo, riga per riga**, in 6,8 secondi: «Chiudo gli occhi. Quando li riapro appena, la figura si sta raccogliendo: i bordi rientrano, la luce si stringe in un punto, e il punto scende piano sul sostegno al centro della stanza. Lì adesso c’è il seme che avevo dato alla porta. La luce ci entra dentro, e si spegne.»
- **Gli occhi**: un velo su tutto il colloquio (`.palpebre` in `dialogo.css`), sopra la figura e sotto le parole. Si chiude in tre decimi e mezzo, resta chiuso un momento, si riapre appena; poi resta socchiuso fino alla fine del colloquio. Dentro la tela si vedeva il bordo del riquadro: per questo è un elemento a sé.
- **La figura**: i bordi smettono di sfarsi; i punti partono dalla testa e dall’orlo per primi e girando si stringono in un punto all’altezza del petto, ognuno con la sua scia; la luce raccolta cresce con i punti che arrivano, scende piano in cima al sostegno, dove compare il seme, ci entra e si spegne. L’alone se ne va con la figura.
- **Le parole dopo**, come nell’apparizione; un clic o un tasto la chiudono subito. Parte nello stesso disegno in cui il nodo diventa «dissolvenza» (lo stato derivato nel componente), così il testo nuovo non si vede prima del tempo.
- **Dopo, la figura non c’è più**: nei nodi «dissolvenza» e «ultima voce» sul sostegno resta soltanto il seme, piccolo e scuro, anche senza animazioni (il movimento ridotto, «Apparizioni» spento, una partita ripresa a metà colloquio). Prima la figura restava a schermo.
- **Vista** dall’autore nell’eseguibile la sera dell’11 novembre 2026 (§9.6).

### 9.4 Registro: la nascita della mappa stellare

Fatta l’11 novembre 2026 (`app/src/gioco/momenti/`). Ci sono volute due versioni.

- **La prima, rifiutata.** Sette secondi e mezzo: le stelle volavano dalla struttura alla cupola lasciando una scia, e la galassia era una sola. L’autore: «l’animazione è veramente troppo veloce, manca di solennità, ricorda un po’ le animazioni delle stelle comete nelle pubblicità natalizie»; e: «non è chiaro dalla storia se questi alieni venissero dalla nostra galassia o da un’altra galassia, visivamente questo cambia molto».
- **Da dove vengono.** Il gioco lo dice in un punto solo, a chi analizza la mappa (`ponte.fav`): «Attraversa un’altra galassia, fino a un ammasso denso e luminoso». Lo conferma la cronologia privata (documento 33, §11: «Con il Grande Salto la nave attraversa un’altra galassia»). A chi la mappa la guarda soltanto, il testo non lo dice; e l’analisi del pilastro (`memoria.fav`) parla di «una civiltà che ha attraversato una galassia». La carta disegna quindi **due galassie**: la loro in alto a sinistra, con l’ammasso («il pugno di cielo») e i tre soli; la nostra in basso a destra, con il punto giallo in un braccio, fuori dal centro; in mezzo il vuoto, che è la cosa più grande del quadro («una distanza che fa male anche solo a guardarla»).
- **La seconda, approvata** («animazione meravigliosa»). 19,6 secondi, e niente vola. Il velo scende in un secondo e mezzo e copre tutto il gioco; le postazioni si accendono una dopo l’altra ai due lati, dalle più vicine alle più lontane; la struttura a stella si accende, ferma, tre anelli e dodici punte come nella scansione; la luce sale sulla cupola in tre secondi, e dove arriva le stelle affiorano al loro posto, senza muoversi; dopo una pausa i tre soli si segnano uno alla volta, con un cerchio che si chiude e tre tacche; la rotta si traccia in più di quattro secondi, dentro la loro galassia e poi attraverso il vuoto, con sei segnavia; il nostro sole si accende per ultimo, con un cerchio solo che si allarga e si perde; due secondi fermi; poi tutto rientra, ancora al buio, nella lente del visore, e solo allora il velo si alza sulle parole. Per tutto il tempo la carta gira appena su sé stessa e si allontana appena: è «a tre dimensioni», e le cose vicine scorrono più delle lontane.
- **Che cosa se ne ricava per i prossimi momenti**: lenti; niente scie e niente punti che volano; un movimento alla volta, con una pausa fra l’uno e l’altro; il vuoto e il buio contano quanto le cose.
- **Il cartello dell’atto.** L’atto IV («La mappa») comincia nello stesso istante: il cartello sta sopra la tela (`gioco.css`) e fa da titolo mentre scende il buio.
- **Nella lente** (dell’autore: «dovresti sostituire l’immagine statica con il frame finale dell’animazione»; poi: «lavoro eccellente»). Sul Ponte, da quando la proiezione è accesa, la lente tiene l’ultimo fotogramma, fermo, disegnato dallo stesso codice (`disegnaMappa.ts`, da `visore/scansioni/MappaNellaLente.tsx`): è dove l’animazione, finendo, riporta la carta. I punti e le righe sono più grossi, perché lì è piccola. La scansione del Ponte resta soltanto per la sala spenta.
- **Un clic o un tasto** la mandano al rientro. Con il movimento ridotto o con «Apparizioni» spento non c’è, e la lente mostra comunque la mappa.
- **Le prove**: `app/prove/mappa.test.ts` (la carta dice quello che dice la storia; i tempi restano lenti). Nel browser dello sviluppo, a 1280 × 720, nessun fotogramma oltre i 40 millisecondi.
- **Vista** dall’autore nell’eseguibile la sera dell’11 novembre 2026 (§9.6). Non aveva un suono suo, ed è stato il suo unico appunto: «andrebbe sonorizzato in modo delicato anche l’animazione della rotta, quando si crea l’immagine, il viaggio».
- **Il suono** (scritto la notte stessa; approvato ascoltandolo nell’eseguibile: «Sì, va bene»). È nel motore audio, come gli altri (`mondo/regia.rs`, `mappa_stellare`), sui tempi dell’animazione, e vale la regola dell’immagine: niente che brilla o tintinna, poche note tenute, sottovoce, e il silenzio fra l’una e l’altra.
  - *Le postazioni*: niente. Il testo dice che si accendono «senza un suono»; il fondo della sala si abbassa di 6 dB, e resta basso finché la carta sta sulla cupola.
  - *L’immagine*: l’accordo delle creature, il sol diesis con la sua quinta su due ottave (lo stesso della traduzione completa), una nota alla volta dal basso: la prima quando la struttura si accende, le altre mentre la luce sale sulla cupola. Tace prima che la rotta parta.
  - *I tre soli*: le tre note del clic armonioso (la porta tonda, la teca), lente, una per sole, a sinistra dove sta l’ammasso.
  - *Il viaggio*: una nota sola che parte dal loro sol diesis e scende fino al re, la nota della Santa Maria, cioè casa. Segue il tratto della rotta (lenta alla partenza e all’arrivo), va da sinistra a destra, ed è più sottile nel vuoto di mezzo. A ogni segnavia lascia un punto, un’ottava sopra.
  - *Il nostro sole*: la nota arrivata resta, e si perde in più di quattro secondi; intorno le affiorano la sua quinta e la sua ottava sotto. (Un re nuovo sopra quello arrivato si sommerebbe o si toglierebbe secondo la fase: è la stessa nota che resta.)
  - *Chi va avanti*: al turno dopo le note sfumano in meno di un secondo e il fondo torna. Chi salta l’animazione con un clic le sente finire sotto il testo.
  - *Le misure*: da sola fra −35 e −31 dB efficaci, picco a −23 dBFS; nel mix da 3 a 8 dB sopra il fondo del Ponte. La nota del viaggio va da 415 a 294 Hz fra 10,9 e 15,1 secondi, come la rotta. Nell’eseguibile, mentre l’autore l’ascoltava: 19,6 secondi, 1.176 fotogrammi, nessuno perso.
  - *Le prove*: due nel motore audio, una in `app/prove/mappa.test.ts` (i tempi del suono sono quelli dell’animazione; la prima nota non viene prima dell’ultima postazione).

### 9.5 Registro: la nave che si sveglia

Fatta l’11 novembre 2026 (`app/src/gioco/momenti/tempiRisveglio.ts` e `Risveglio.tsx`), con le regole uscite dalla mappa (§9.4). L’autore l’ha guardata nel browser dello sviluppo: «Sì, va bene».

- **Quando.** Nel laboratorio di risonanza, al comando che mette il cristallo nel generatore (l’evento sonoro `energia`): «Con un rombo che sale, i macchinari si svegliano: l’elettricità corre fra le bobine, i monitor si accendono […] Lo scafo mi vibra sotto i piedi, una volta sola. Lontano, dietro le pareti, sistemi spenti da sempre tornano a respirare uno dopo l’altro, e per la prima volta sento la nave lavorare.»
- **Senza velo.** La mappa copre il gioco; qui è l’interfaccia stessa che si spegne e si riaccende, perché è lei la nave. In meno di un secondo tutto va al buio (gli strumenti restano a un ventesimo, la lamina a zero) e restano le vene, appena visibili.
- **Gli archi.** La lente mostra il generatore: guizza quattro volte, ogni volta un poco di più, con una luce intorno; mai un lampo pieno.
- **L’onda.** Al brivido dello scafo la lente si accende del tutto e una luce parte dal suo centro: una fascia larga e tenue che attraversa lo schermo in 5,2 secondi, sempre alla stessa velocità. Dove passa le vene si accendono, con un chiarore che si posa in tre secondi e mezzo, e ogni sistema torna quando la luce lo raggiunge: l’aria e le chiavi, la mappa delle stanze, «diario» e «menu», i fili e i baccelli da destra a sinistra, l’atto. Appena accesi gli strumenti sono un poco più chiari, e poi si posano. La luce della stanza torna quando l’onda arriva al suo centro.
- **Le parole per ultime**: la lamina torna a nove secondi, in dissolvenza.
- **I tempi sono quelli del suono**, che c’era già (`mondo/regia.rs`): il rombo che sale, i quattro archi (1,2, 1,7, 2,3 e 2,6 secondi), il brivido dello scafo (3,4), i tre respiri dei sistemi (4,5, 5,6 e 7,0) mentre la luce attraversa lo schermo. Una prova legge il sorgente Rust: se il suono cambia, la prova si ferma.
- **Com’è fatta.** Ogni sistema ha la sua animazione (Web Animations), creata ferma; un orologio solo le muove tutte, insieme all’onda che le vene leggono. I sistemi si raccolgono a ogni fotogramma: il ramo ridisegna i baccelli un istante dopo il turno, e quelli nuovi restavano accesi nel buio. Alla fine le animazioni si tolgono, e lo schermo resta com’era.
- **Un clic o un tasto** portano alle parole. Con il movimento ridotto o con «Apparizioni» spento non c’è; con «Vene vive» spento le vene restano ferme.
- **Scartato**: il tremito dello schermo al brivido dello scafo. Lo dice già il suono, e chi gioca con la lente d’ingrandimento lo patirebbe.
- **Le prove**: `app/prove/risveglio.test.ts`, sette. Nel browser dello sviluppo, a 1280 × 720, nessun fotogramma oltre i 40 millisecondi.
- **Vista** dall’autore nell’eseguibile, con il suono, la sera dell’11 novembre 2026 (§9.6).

### 9.6 Registro: i quattro momenti nell’eseguibile

La sera dell’11 novembre 2026 l’autore li ha guardati nell’eseguibile vero, costruito dal commit `9ce8aba`, con il suono.

- **Come.** Quattro salvataggi di prova, uno subito prima di ogni momento (`strumenti/misure/salvataggi_momenti.py`: il posto 1 prima di «usa il cristallo sul generatore», il 2 prima di «usa la postazione», il 3 prima di «parla con l’anziano», il 4 prima di «[Chiudi gli occhi e lascia andare.]»), in una cartella a parte: i suoi salvataggi non si toccano. `strumenti/misure/momenti.mjs` apre l’eseguibile, salta i loghi e la dichiarazione, carica il posto 1 e resta a guardare; agli altri posti ci va lui, da «menu» e «Carica».
- **Le misure**, a 1920 × 1080, mentre guardava: la nave che si sveglia, 10,6 secondi, 636 fotogrammi, il più lento di 17 millisecondi; la mappa stellare, 19,6 secondi, 1.176 fotogrammi, il più lento di 17 millisecondi (il passo dello schermo: nessun fotogramma perso); i tre colloqui con l’Anziano (145, 29 e 39 secondi), nessun fotogramma oltre i 50 millisecondi, due fra 34 e 50 in uno solo.
- **Il giudizio**: «ho visto i quattro elementi animati e trovo che questo gioco abbia una componente emotiva importante».
- **Un appunto solo**: «andrebbe sonorizzato in modo delicato anche l’animazione della rotta, quando si crea l’immagine, il viaggio». La mappa era l’unico dei quattro momenti senza un suono suo: fatto la notte stessa, e approvato (§9.4, «Il suono»).
- **Una cosa da ricordare parlando con lui.** Gli avevo scritto «alla fine guarda la lente», e non ha capito che cosa dovesse fare: «lente» è un nome del codice. I pezzi dello schermo si chiamano per quello che si vede: «l’ovale in alto a destra, sopra la scritta MULTISCANNER».

