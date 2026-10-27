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

