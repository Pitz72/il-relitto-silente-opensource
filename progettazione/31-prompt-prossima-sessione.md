# Prompt per la prossima sessione (31)

Sostituisce il 28. Scritto il 27 ottobre 2026, nel pomeriggio, quando l’autore ha chiuso la sessione:
«per ora ci fermiamo un momento qui. Poi dalle prossime volte dovremmo riprendere con maggiore ordine».
Aggiornato l’ultima volta il 24 novembre 2026: il punto della situazione, la scansione lunga con il computer di bordo in mezzo a William, e la revisione 37 (le medie e le lievi che non toccano la storia). Le tre medie della storia (M22, M23, M24) sono applicate con il suo sì. Alla prossima: le frasi lievi della storia (L35, L36, L37), le sue scelte, e una beta.
Prima, il 16 novembre 2026, nel pomeriggio: la revisione della cinematica e le sue correzioni (documento 09, §19–20), dodici prese nuove di Leonardo, la beta 15 pubblicata.
Prima, lo stesso giorno, di giorno: le note dell’autore sulla beta 13 (documento 09, §18:
il cartello fermo all’avvio, il logo nero, la «cupola nera» sul muso, il passaggio, i due dettagli, il quadro largo
che si allarga fino al titolo, Elio voce TTS di Google; la voce di William più alta, documento 41) e la beta 14,
pubblicata su suo ordine («non rifare il filmato, rilascia direttamente la beta così la vedo direttamente nel
gioco»). Alla prossima: le sue note sulla beta 14.
Prima, il 16 novembre 2026, a notte: la voce di William nel gioco, come nel Viaggiatore
(documento 41), e la beta 13, pubblicata su suo ordine («quando hai finito, committa, pusha […] e rilascia nuova
versione senza ulteriori autorizzazioni. Buonanotte»).
Prima, il 15 novembre 2026, a notte: William e Yusuf nella cinematica d’apertura, e i
titoli di testa con la tipografia del poster (documento 09, §17); fatto, da fargli vedere nel filmato.
Prima, il 14 novembre 2026, nella notte, dopo il modello della Santa Maria in Blender (la
forma, una prima superficie e, dopo le sue note, i pezzi nuovi e gli anni: documento 40) e dopo la nave vera
dentro l’intro, con i reattori che si spengono e il loro suono; approvata dai fogli, da vedere nel gioco.
Poi, lo stesso giorno, il filmato intero dell’intro che ha chiesto per prendere appunti.
Poi ancora, le sue «scelte definitive» sulla cinematica d’apertura (documento 09, §16): fatte, da fargli vedere.
Prima, il 13 novembre 2026, in mattinata, dopo le prime prese di Leonardo e il primo passo
sull’estetica della cinematica (il cielo), con la Santa Maria ferma in attesa di un modello in Blender.
Prima, il 12 novembre 2026, nella notte, quando l’autore ha chiuso la sessione dopo aver
ascoltato «Havela», l’inno degli alieni (documento 32, §3.11): «Domani ti dico cosa ne faremo. Per oggi ci
fermiamo qui». Prima, l’11 novembre, a notte, dopo i quattro momenti con un’animazione loro
(documento 30, §9) guardati nell’eseguibile. Prima, lo stesso giorno, dopo la revisione globale (documento 37).
Prima, il 7 novembre, nel pomeriggio, quando l’autore ha chiuso la sessione dopo aver
mandato le quattro righe del computer di bordo: «Ok per ora ci fermiamo». Prima, il 6 novembre, dopo le otto frasi
fatte del blocco G (i blocchi dalla A alla G sono scritti, con la taratura dell’aria, F1).
Prima, il 3 novembre, a notte, l’autore aveva chiuso la sessione dopo la lettura integrale e la valutazione:
«Dalla prossima sessione fare punto per tutto i tanti piccoli dettagli rilevati con
una discussione e delle decisioni. Interverremo fortemente su tutto quello che allontana questo gioco da
un’opera matura vera e non solo “sopra la media”. […] Per ora è tutto. Buonanotte».

Questo documento è **il punto di partenza unico**: dove siamo e che cosa viene dopo, in ordine. A fine
sessione si aggiorna qui, e non con note aggiunte in fondo ad altri documenti.

## Il prompt

Riprendiamo «Il Relitto Silente». Carica la memoria del progetto, poi leggi questo documento e il documento 33
(`progettazione/33-revisione-narrativa.md`, la roadmap della revisione narrativa). Gli altri si aprono quando il
lavoro li tocca (l’elenco è in fondo). Comincia dal punto 0 dell’ordine del lavoro: i blocchi dalla A alla F del
documento 33 sono decisi (4 novembre 2026; le decisioni sono nel registro, §9; le schede delle voci nel documento
34). **La scrittura** (documento 33, §2 e §10, punto 4) è finita per i blocchi dalla A alla F (5 novembre 2026),
compresi il diario di William (F7) e la taratura dell’aria (F1, documento 33, §12: i costi restano, cambiano due
avvisi). Anche **il blocco G, lo stile, è scritto** (5 novembre 2026; registro, §9, RN-G1–G6, e le proposte in
`progettazione/stile-G/`), con le otto frasi fatte che le sue sessioni avevano segnalato fuori dalle decisioni
(6 novembre 2026, approvate una per una). Si continua con **il blocco H, le dipendenze** (documento 33, §8), e
una beta sola. Prima del commit di ogni blocco, all’autore si mostra ogni frase prima e dopo, e si aspetta il suo
sì. Ogni proposta all’autore va scritta per intera nel
messaggio finale, dopo la casella della domanda: mai «la proposta è quella sopra».

## Le regole fisse dell’autore

- **I pezzi dello schermo si chiamano per quello che si vede**, mai con i nomi del codice (11 novembre: «mi dici
  lente ma io non la vedo la lente»): «l’ovale in alto a destra», non «la lente».
- **È ipovedente.** Faccio io ogni passo, dall’inizio alla fine: niente passi manuali, niente comandi da
  scrivere a mano, niente pagine di impostazioni da navigare. Per chiavi, password e token preparo uno
  script e gli lascio un solo comando, poi verifico io. Risposte brevi. Le decisioni una per volta, con
  la mia raccomandazione.
- **Dopo ogni commit si fa push** su `origin main`, senza forzare; `git status -sb` deve dire
  `main...origin/main`. Un commit per lavoro, con la voce nel CHANGELOG; la riga «Per chi gioca» la
  scrivo io, senza la sua approvazione (solo il **grassetto** compare nella finestra delle novità).
- **Gli effetti non si tolgono** (27 ottobre): se costano, si alleggeriscono e si mettono fra le scelte
  della scheda «Grafica» delle Opzioni, tutti accesi di base.
- **Le misure** si fanno senza la lente di Windows: quando gioca la toglie.
- **Prima di aprire l’eseguibile** lo avviso: il gioco gli si apre sullo schermo e gioca da solo.
- **I `.fav` sono congelati**: toccarli è una sua decisione (il 27 ottobre l’aria fra 0 e 100; il 29 tutto il testo
  in prima persona). **William racconta in prima persona**; ogni indizio per chi gioca va fra parentesi
  («Lo scanner saprebbe leggerla. (ANALIZZALA.)»), e le voci degli altri, le scelte e i messaggi del motore
  restano come sono. Una frase cambiata va cercata anche in `app/src/motore/ponte.py` (`SEGNI_A_SORTE`) e nelle
  righe `# atteso` di `collaudo/`.
  La copia del motore in `motore/` non si corregge mai a mano: si rifà da un tag di Favella1.
- **Il nome del motore è «Favella1».** La musica è fantascienza, mai giallo. Il gioco è da scrivania:
  niente impaginazioni da telefono, nessun testo sotto i 12 px.
- **Quando entra una presa nuova** (una consegna di Leonardo, una voce generata, un brano) si rifà la copia sul disco di
  backup: `audio/sorgenti/`, `doppiaggio/william/consegne/` e gli originali della musica, in una cartella con la data
  (revisione 37, M19; l’ultima è del 24 novembre 2026).
- **Le sue parole sul lavoro** (24 novembre 2026): sull’interfaccia non ha chiesto di cambiare niente, ha chiesto «una
  revisione estetica per individuare in cosa, tra animazioni, look e quant’altro, potesse essere migliorato»: si
  individua e gli si propone, non si fa. Il finale «è un tema che dovremo affrontare seriamente ma non ora». Gli effetti
  e i suoni d’ambiente «li possiamo rifare da zero con 11labs e il connettore». I media da regalare «non sono urgenti».
- Le prove su GitHub (`prove.yml`) devono restare verdi. A fine sessione guardo l’esito dell’ultimo flusso
  (`gh run list`): non si chiude con le prove rosse (revisione 37, M20: dal 7 all’11 novembre lo erano, e
  nessuno lo sapeva).
- **Il bilanciamento si misura su molte partite verosimili**, mai su una sola (5 novembre: «la combinazione che rende
  più verosimile il fatto che ce la possano fare»; e «se così vincono sempre tutti, dove sta la sfida?»):
  `collaudo/verosimili.py`, con la fuga giocata da principianti veri.

## Dove siamo (24 novembre 2026)

- **24 novembre 2026: il punto della situazione, e la revisione 37.** L’autore ha chiesto il punto, e ha risposto punto per
  punto. **Il cerchio verde nel menu**: nella demo non c’è; la causa era la dichiarazione d’apertura che se ne andava da
  sola dopo venti secondi (chi non aveva ancora toccato il mouse arrivava al menu con il contorno intorno a
  «Continua»; nella demo il primo cartello vuole un clic). Corretto alla radice: il contorno si disegna solo dopo un
  tasto che sposta il fuoco, e mai sulle voci del menu (`app/src/stile/fuoco.ts`). **«Havela»**: nel gioco, in «Ascolta
  il canto», c’è la versione di ElevenLabs (la più corta, scelta da lui il 13 novembre); quella di Suno è da parte.
  **La scansione lunga** (`SM-030`): «va sistemato». Fatto: la presa divisa nelle pause di Leonardo, il computer di
  bordo in mezzo (documento 41, §5); l’ascolto approvato: «l’audio è giusto come ordine. Ottimo». Lo stesso per `IN-010`.
- **La revisione 37**: «Occupati, nell’ordine che ritieni sensato e logico, delle 26 medie e 40 lievi». Fatte in sette
  lotti, ognuno con le sue prove e il suo commit (documento 37, §9, «Le medie e le lievi, dal 24 novembre 2026»): chi
  gioca con il mouse e vede poco; le lievi della pagina e la modalità scritta; l’intro; i documenti e le licenze; i
  flussi di GitHub e la copia delle voci; il motore audio e i salvataggi (una sessione parallela, riletta e riprovata);
  il ponte e il collaudo. Le prove: 166 in node, 134 in Rust, 20 percorsi di collaudo (erano 17), le 20 partite nel
  motore audio. **Niente è stato guardato né ascoltato nell’eseguibile, e niente è in una beta.**
- **Le tre medie della storia sono applicate** (M22, M23, M24: «Sì, applicale», 24 novembre; documento 37, §9, in
  fondo): i segni della fuga non escono più dentro la Santa Maria; le tre chiavi in qualunque ordine; «Est» nel
  santuario durante la fuga. Nessuna sigla del copione di William si è spostata; le prese sono 611, il PDF e il
  rapporto per Leonardo sono rifatti (`doppiaggio/william/`) e **vanno mandati a Leonardo** al posto di quelli del
  21 novembre.
- **Che cosa aspetta lui** (in fondo al §9 del documento 37): **L35, L36, L37** e il commento di `aria.fav`, da
  proporgli frase per frase (sette sono pronte, quattro da studiare); le scelte **L8, L12, L26, L31**; le tre impostazioni del repository su GitHub (gli avvisi sulle
  dipendenze, la scansione dei segreti, la protezione dei push) e la sua descrizione, che dice ancora «FAVELLA 1».
- **Da decidere con lui**: una **beta 16** (c’è molto per chi gioca: 112 prese in più, la cifra dell’aria con la voce
  della tuta, la scansione lunga, tutta la revisione), e se **rifare la demo** con le stesse correzioni
  (`configura.py`, le due build, `gh release upload demo-atto-1 … --clobber`). Nella nuova beta va guardato per
  primo: il menu senza cerchio, l’aggiornamento con «Annulla», il finale e subito i titoli di coda.
- **Aperte, sue parole del 24 novembre**: la revisione estetica dell’interfaccia (individuare, non fare); il finale,
  «seriamente ma non ora»; gli effetti e i suoni d’ambiente da rifare con ElevenLabs; un brano audio fra i media da
  regalare, «ci penseremo poi».

## Prima (21 novembre 2026)

- **21 novembre 2026, poi: la demo è pubblica** (documento 42, §6): release `demo-atto-1` su GitHub, articolo di lancio e
  pulsanti sul sito thesantamaria.it (v1.1.12). Dopo una consegna di Leonardo, se si vuole aggiornare la demo:
  `configura.py`, le due build, `gh release upload demo-atto-1 … --clobber`.
- **21 novembre 2026: la demo dell’atto I** (documento 42), chiesta dall’autore per Leonardo e forse per il sito:
  Windows (installatore) e Linux (AppImage) in `consegne/Demo atto I 2026-11-21/`, provate con la prova dei
  salvataggi; da giocare dall’autore. Le prese a oggi: 138 (22,8 %), l’atto I completo.

## Prima (20 novembre 2026)

- **20 novembre 2026, alla chiusura.** Fatto dal 19: le 101 cifre di Kira nel gioco (`0691cd2`), `SM-056` approvata
  all’ascolto, le 26 prese dell’atto II (`IN-003`…`IN-036`) nel gioco: 126 prese, il 20,7 % senza `IN-013`, da
  rifare («dalla grana», `DA_RIFARE` in `copione_pdf.py`). Per Leonardo: il copione (479 prese) e il rapporto di una
  pagina (`strumenti/audio/rapporto_william_pdf.py`, `doppiaggio/william/resoconti/`), approvato dall’autore («ok
  così»). Alla prossima consegna: copiare in `consegne/`, controllo (formato + Whisper), `voce_william.py`,
  `copione_pdf.py`, `rapporto_william_pdf.py`; togliere da `DA_RIFARE` le prese rifatte.

- **19 novembre 2026: le prese del 19 novembre e la cifra dell’aria alla voce della tuta** (documento 41, §5;
  documento 35, §11). Nel gioco cento prese di William (24 nuove, `SM-062` e `SM-056` rifatta). La cifra dell’aria
  non è più di William: nei `.fav` è la scritta «ARIA [aria]%» (33 frasi, approvate dall’autore), la legge Kira; il
  copione per Leonardo ha soltanto le prese da registrare (504) e la firma «doppia vu, ti». **Restano due cose
  dell’autore**: ascoltare `SM-056` (`consegne/Ascolto SM-056 2026-11-19/`: la firma, e un piccolo suono prima di
  «novantasei anni») e generare con Kira `doppiaggio/servizio/servizio-nuove.txt` (le 101 cifre, circa quattro
  minuti e mezzo); poi taglio io con `taglia_servizio.py … --nuove` e aggiungo i file al motore
  (`musica_file.rs`, come le righe del registro in `222f881`). Il PDF nuovo va mandato a Leonardo.

## Prima (16 novembre 2026)

- **16 novembre 2026, alla chiusura: la beta 15 è confermata, e c’è una cosa da fare per prima.** L’autore, giocata
  la beta 15: «Ok, tutto confermato. Funziona tutto, niente da segnalare. L’intro va bene, ora ha abbastanza varietà
  per far seguire il racconto senza restare solo su una immagine. Belli gli effetti di luce. Per ora stiamo bene
  così. Alla prossima sessione.» E poi, con una schermata del menu: **«Voglio però che ti appunti il fatto che è
  tornato il cerchio verde intorno alle voci interattive del menu e NON DEVONO ESSERCI.»** Nella schermata l’anello
  verde sta intorno a «Continua», la prima voce. **È la prima cosa della prossima sessione.** Quello che ho visto,
  senza toccare niente: è l’anello generale della tastiera (`app/src/stile/base.css`, `.tema :focus-visible`); il
  menu mette il fuoco sulla prima voce con `focus({ focusVisible: false })` (`app/src/menu/Menu.tsx`), e
  nell’eseguibile evidentemente non basta (la mia ipotesi: dopo un tasto premuto sul cartello dell’avvio o sulla
  dichiarazione). La correzione da proporgli: nessun contorno sulle voci del menu, mai (il menu ha già il suo segno,
  il filo che si accende accanto alla voce), e lo stesso controllo sugli altri elenchi (la pausa, i pannelli, le
  risposte dei dialoghi); da verificare nell’eseguibile. Era già stato tolto una volta (19 ottobre 2026): è un
  ritorno. **Restano aperte le tre domande sulle prese di Leonardo** (SM-018, SM-031, SM-030, qui sotto): non ha
  ancora risposto.

- **16 novembre 2026, pomeriggio: le correzioni dopo la revisione** (documento 09, §20). L’autore: «applica tutto con
  qualità secondo le tue indicazioni». Fatto: il tema di Alirio in tre passaggi, mai due insieme, con il punto forte
  sul titolo e la musica fino al gioco; via il «re» del reattore da tutta l’intro; le fiamme dei reattori lunghe e
  visibili di fianco; il fascio del faro largo quanto la lente, la lente con il suo bagliore; il riflesso
  dell’obiettivo (la striscia dalle luci forti: lo ha chiesto lui vedendo i fotogrammi, «flare o effetti di
  luminescenza realistici»); i materiali da vicino; le camere (il margine con la nave grande il doppio, il
  passaggio con la Via Lattea, i due dettagli ripresi da capo, con carrello e pulviscolo); il titolo e il libro
  senza sovrapposizione; la voce di servizio al livello di William. **Dodici prese nuove di Leonardo** nel gioco
  (26 in tutto; documento 41, §5). **Nella beta 15**, pubblicata lo stesso pomeriggio sul suo «Sì, pubblicala». **Alla prossima: le sue note sulla beta 15.** **Da dirgli**: due
  parole delle prese da far sentire (SM-018 «ferma» o «firma»; SM-031 «scansione» o «canzone»); SM-030 (la
  scansione lunga): Leonardo ha letto in una presa sola le tre parti di William, e la voce del computer arriva dopo,
  tutta insieme (tenerla così, o chiedergli tre prese?). **Limiti**: il suono è misurato, non ascoltato; il
  movimento visto a fotogrammi fermi.

- **16 novembre 2026, dopo la beta 14: la revisione della cinematica** (documento 09, §19: le sue parole, le
  quattro segnalazioni con la diagnosi, e altri nove punti che non tornano). Ha chiesto di individuare tutto
  «prima di fare qualcosa»: **niente è cambiato nel codice, aspetta le sue decisioni.** Le diagnosi: sotto il tema
  di Alirio suonano una seconda copia del tema stesso (49 s, errore mio) e il «re» sintetizzato del reattore; il
  tema finisce a 4:14 e lui lo vuole fino al gioco (proposta: tre passaggi, mai due insieme, via il «re»
  dall’intro); il fascio del faro nasce da un punto (deve nascere largo quanto la lente); la voce di servizio è
  5 dB sotto William; le fiamme dei reattori si vedono solo da dietro. **Si riparte dalle sue risposte.**

- **16 novembre 2026, di giorno: le note dell’autore sulla beta 13** (documento 09, §18, con le sue parole punto per
  punto). Fatto: all’avvio il **cartello fermo** (Runtime Multimedia e Favella1, i marchi fermi su nero; i loghi
  animati solo prima dell’intro); il **logo nero** all’inizio della cinematica (la preparazione dell’intro gli
  cadeva sopra: ora i loghi aspettano); la **«cupola nera» sul muso** (non un’ombra: il piano vicino della camera
  tagliava la nave; trovata con il parallelepipedo che ha suggerito lui, scatti in `consegne/Ombra sul muso
  2026-11-16/`); il **passaggio** con Yusuf (la nave accanto alla camera, reattori accesi, altro cielo); i **due
  dettagli** in F (il radar che gira, il faro che cerca, davanti al muro nero del relitto: i pezzi si muovono
  davvero, la nave riesportata da Blender con il numero dei pezzi); il **quadro largo** che torna per «La vedo
  pulsare» e si allarga fino al titolo, il **libro** a ridosso del titolo; **Elio** «voce TTS di Google»; la **voce
  di William** nel gioco 4 dB più alta (documento 41). Le prese di Leo nella cartella Download sono tutte nel
  gioco; `intro2.wav` è archiviata come materiale storico. **Nella beta 14**, pubblicata su sua richiesta senza
  filmato. **Le scelte mie da dirgli** (09, §18.8): il quadro largo torna per «La vedo pulsare» e non al titolo;
  niente suono per il passaggio e i dettagli; il cartello muto. **Alla prossima: le sue note sulla beta 14.**
- **16 novembre 2026, a notte: la voce di William nel gioco** (documento 41: lì il Viaggiatore studiato, come è fatto
  qui, le scelte mie e le prove). L’autore: «Sì, costruiscila». Fatto: le prese di Leonardo entrano nel gioco con
  `strumenti/audio/voce_william.py` (dalla cartella `doppiaggio/william/consegne/`); il ponte le trova nel testo a
  schermo e manda l’evento «racconto»; il motore audio ha un lettore suo (`mondo/racconto.rs`), e le altre voci
  aspettano William; un comando o un tasto lo fanno tacere, F2 lo ridice, Esc lo zittisce; le risposte dei dialoghi
  le dice passandoci sopra con il mouse; nelle opzioni «Voce di William: recitata / nessuna». Le prese sono
  quattordici, la plancia (`SM-001`…`SM-014`). L’ascolto dell’inizio di una partita, reso dal motore del gioco:
  `consegne/Ascolto voce di William 2026-11-16/`. **Le scelte mie da dirgli** (41, §3): la musica non scende sotto
  William (la sua regola del 2 novembre, non quella del Viaggiatore); fra due prese 0,55 s. **Nella beta 13**,
  pubblicata la stessa notte su sua richiesta, insieme all’intro con William e Yusuf e ai titoli di testa nuovi.
  **Alla prossima: le sue note sulla beta 13** (la voce nel gioco, l’intro), le tre parole delle prese da fargli
  sentire (41, §5), e le prese nuove di Leonardo quando arrivano (si copiano in `consegne/` e si lancia lo strumento).

- **15 novembre 2026, a notte: William e Yusuf nell’intro, e i titoli di testa con la tipografia del poster**
  (documento 09, §17: lì stanno le sue disposizioni parola per parola e quello che è stato fatto). Leonardo ha
  mandato il registro di bordo (la versione scritta e detta, che chiude con «W. T.»; `intro.wav`; c’è anche una
  seconda versione, `intro2.wav`, archiviata come materiale storico il 16 novembre in `audio/sorgenti/voce/`), e l’autore ha deciso il montaggio: il registro parte quando il nero
  con la luce verde è diventato lo spazio; subito dopo un beep di registrazione e il messaggio di Yusuf, in più
  pezzi con il beep in mezzo, dalla radio; «il resto tutto uguale». I crediti: Leonardo al posto del libro,
  «Simone Pizzi è Yusuf» (senza dire che la voce è clonata), la voce di L.V. quando L.V. ricomincia, il libro
  dopo il titolo; e la tipografia del poster per i titoli di testa e per il titolo. **Fatto tutto**, con le
  prove (145 in node, 107 in Rust). L’intro dura 4:49 (era 3:24).
  **Le scelte mie, che deve giudicare** (09, §17.2): la scena nello spazio dura 84 secondi, con le due voci
  tutte lì; «Ho firmato tutte le carte… Ho insistito io» apre la seconda parte di L.V.; il tema, che dura
  1:52, ricomincia da capo venti secondi prima della plancia; l’attore digitale di L.V. è scritto «ELIO»; il
  libro dopo il titolo è un cartello a sé, dove stava il titolo; il beep è una nota sola (un si), e dopo
  l’ultimo pezzo di Yusuf non c’è (la radio si chiude e basta). Nella dichiarazione d’apertura una frase in
  più: «William, nell’intro, ha la voce dell’attore Leonardo Tomassetti». La voce di Leonardo nei registri è
  scritta «fuori dalla licenza libera del gioco» finché l’autore non dice altro.
  **Non l’ha ancora visto né sentito**: il filmato è `consegne/Filmato intro 2026-11-15/Il Relitto Silente -
  intro con William e Yusuf.mp4`. Non è in una beta. **Alla prossima: le sue note sul filmato.**
- **15 novembre 2026: le prese di Leonardo per il gioco, e come deve funzionare il parlato.** L’autore: «ma
  non ti avevo già mandato dei file di Leo? perché non sono integrati? Il modo in cui l’audio del parlato e
  dei dialoghi deve funzionare è esattamente come abbiamo fatto ne Il Viaggiatore»; e ne manderà altre. Le
  prese arrivate sono **quattordici** (`SM-001`…`SM-014`, tutta la plancia; le prime quattro rimandate con i
  picchi sotto −3 dB, come gli era stato chiesto; 16 bit), in `doppiaggio/william/consegne/` (fuori da git;
  quelle del 13 in `2026-11-13/`), controllate (`controllo-2026-11-15.json`): testo fedele; tre parole da far
  sentire all’autore (SM-011 «nel rosso» sentito «del rosso»; SM-014 «lo faccio correre» sentito «scorrere»;
  in SM-001 Whisper sente un «ebbe» in più dopo «servirebbe»). **Nel gioco dal 16 novembre** (vedi sopra; prima il gioco non
  aveva un lettore per la voce di William). Va costruito sul modello del Viaggiatore
  (`C:\Users\Utente\Documents\GitHub\IlViaggiatore`: `app/src/gioco/voce.ts`, `parti.ts`,
  `components/ViaggiatorePlayer.tsx`, `gioco/musica.ts`; il progetto è in `pre-produzione/08-doppiaggio-tts.md`):
  il testo del turno compare tutto e la voce parte da sola con lui; le parti si ritrovano dal testo stampato
  (il racconto è del narratore, le «» del personaggio, le parentesi della voce di servizio), in fila
  nell’ordine del testo, 0,3 s fra le frasi e 0,55 fra le righe; al primo tasto o comando la voce tace di
  colpo e il testo resta; Esc, se parla, la zittisce soltanto; F2 la ridice; le scelte dei dialoghi le legge
  il narratore quando il mouse ci si ferma un terzo di secondo, mai sopra chi sta parlando; una riga senza
  file resta muta; un modo «voce recitata / nessuna / lettore di schermo». Qui il copione dice già quale presa
  è quale testo (`doppiaggio/william/copione.json`), e le altre voci (la nave, l’Anziano, Yusuf, la voce di
  servizio) ci sono già, in fila nel motore audio; i file di William sono 604 e non possono essere voci fisse
  del lettore (`Pezzo` in `musica_file.rs` è un elenco chiuso): serve un lettore per nome di file. **Una cosa
  da chiedergli prima**: nel Viaggiatore la musica scende di 6 dB sotto la voce; qui il 2 novembre ha chiesto
  musica ferma e più bassa, senza salire e scendere («fa troppo radio»): quale delle due.
- **14 novembre 2026, sera: il registro di bordo di William e il messaggio di Yusuf** (in pausa quella sera;
  **deciso e fatto il 15**, vedi sopra: Leonardo ha registrato la versione B). L’autore vuole
  nell’intro, dove oggi in B c’è «Ho firmato tutte le carte… Ho insistito io» (che andrà più avanti), un registro
  di bordo detto da William; **il posto e il montaggio li decide lui: non toccare la scaletta finché non lo dice**.
  Il testo è scritto e quasi approvato (sua correzione: «il giorno che smetterà, mi preoccuperò»); due versioni,
  A (detto a voce) e B (scritto sul registro di carta del gioco e detto ad alta voce, chiude con «Settimana sei.
  Stiva vuota. Nessun contatto. W. T.»): **la scelta fra A e B è ancora sua**. Lo registrerà Leonardo; l’autore
  torna quando Leonardo gli ha mandato la presa. Corretto il cognome nei titoli di testa: «Eriksonn» (7c2f928).
  Il messaggio di Yusuf (segreteria, voce clonata dell’autore, 34,5 s) è fatto e approvato, **da tenere da parte**
  finché non decide dove va: documento 35, §12. Nel libro e nel gioco Yusuf dice «William», mai «Will».

- **14 novembre 2026, nella notte: il modello della Santa Maria, cominciato** (documento 40). L’autore:
  «continuiamo il lavoro?». Fatti in una sessione **la forma** (lo scafo e 160 pezzi, costruiti in Blender da
  `strumenti/nave/modello.py` a partire da `misure.py`: 80 × 13 × 12 metri misurati sul modello, una pelle
  chiusa) e **una prima superficie** (`superficie.py` dipinge la tessitura dello scafo sulla scheda 05B: i corsi
  di lamiere con giunte e rivetti, le toppe di metalli diversi, la fascia scura in basso con la matricola a
  stencil, le fasce arancioni intorno ai due portelli; `pelle.py` dice dove cade ogni punto). In più, in
  rilievo, i particolari che nessuna tavola dice: sei botole e due corrimano sul dorso, un condotto per
  fianco, le griglie della sala macchine, i pioli dall’uscita al dorso. **Sono proposte**: l’elenco è nel
  documento 40. I due fogli (`progettazione/40-modello/foglio-1-la-forma.jpg`, `foglio-2-la-superficie.jpg`)
  gli sono stati mandati durante il lavoro. **Le sue note** (14 novembre): «Di base direi che ci siamo. In
  fondo una nave spaziale mercantile non deve avere ali o tocchi esotici […] può anche essere solo un tubo.
  Cercherei di mettere qualche oggetto sullo scafo, manca un punto da dove lanciare arpioni d’aggancio, dei
  radar o una griglia di sensori e poi degli attacchi per l’attracco ai moli spaziali. La texture mi piace […]
  la superficie deve dimostrare oltre 90 anni di attività ma diciamo che sono soddisfatto». **Fatto lo stesso
  giorno** (terzo foglio, `foglio-3-i-pezzi-e-gli-anni.jpg`): il lanciarpioni (un mento sotto il muso, i due
  tubi, i tamburi del cavo), i sensori (una griglia in piedi sul dorso, un pannello per guancia del muso), i
  quattro attacchi d’ormeggio sul fianco sinistro; e la superficie invecchiata (lamiere imbarcate,
  ammaccature, saldature, perdite, antiruggine, il muso sabbiato, la poppa cotta). I tre pezzi sono anche
  nella tabella e nelle tavole del documento 39, ridisegnate. **Il terzo foglio è approvato** («Sì, vai avanti»).
  Poi una sua domanda, **aperta**: «non conviene fare il render delle animazioni della nave direttamente in
  Blender e poi applicarle con l’uso di un canale alpha?». Tre strade (documento 40, in fondo): le foto ferme
  con le luci separate; il filmato da Blender con la trasparenza (la sua idea); la nave vera caricata nella
  scena dell’intro e disegnata dal vivo (la mia raccomandazione: niente da tenere a tempo, nitida a ogni
  misura, leggera). **Ha scelto: «Nave vera dal vivo».** **Fatta lo stesso giorno** (documento 40, «Il quarto
  passo»; documento 09, §15): il motore dell’intro carica il modello (`app/public/intro/nave/`, 2,4 MB) e lo
  disegna dal vivo, con la luce di un sole per ripresa, le ombre, le luci nei loro punti (l’oblò, i fanali,
  l’uscita, il faro) e la spinta dei quattro scarichi; un fotogramma non costa più di prima. Mentre lavoravo
  ha chiesto: «dovremmo fare un effetto di spegnimento dei reattori, per una questione di realismo la nave
  continuerà comunque ad avvicinarsi per inerzia»: **fatto** (nella scena da dietro la fiamma si accorcia e
  sparisce nei primi tre secondi, resta la brace; la nave non rallenta). Due decisioni tecniche mie: la
  macchina è più vicina alla nave nelle due scene (la nave vera è lunga e sottile); tempi e fine della scala
  identici. I fogli 4 e 5 gli sono stati mandati: **approvata** («Sì, va bene»), sapendo che la nave vera è
  più nuda della foto di prima. **Poi il suono dello spegnimento** (documento 40): il re del reattore resta
  quando la scena esce dalla nave e muore con la fiamma, con lo scatto dell’interruttore, due colpi sordi e
  tre tic di lamiera che si raffredda; l’ascolto è in `consegne/Ascolto reattori 2026-11-14/`. **Non l’ha
  ancora sentito, e nell’eseguibile la nave non è ancora vista.**
  Quello che non va, detto nel
  documento: la sagoma è semplice, come vuole la scheda 05B («I pannelli solari sono la sola cosa che rompe la
  sagoma»), ma di lontano è un tubo, e gli still di oggi hanno casse e sovrastrutture che qui non ci sono (se
  gli sembra nuda: altri particolari piccoli sulla pelle, non volumi nuovi); la luce delle viste è da studio. **Alla prossima**: una beta (la 12) perché veda la nave vera nel gioco e senta lo
  spegnimento dei reattori: serve il suo sì per pubblicarla; poi le sue note. L’intro del gioco è
  cambiata (la nave); non è in una beta. **Prima della beta ha chiesto un filmato intero dell’intro**
  («in modo da poterla vedere e ascoltare mettendo in pausa per prendere appunti su una versione finale»,
  14 novembre): fatto con `strumenti/intro/filma.mjs` (1920 × 1080, 30 fotogrammi al secondo, il suono del
  motore del gioco, con la voce di L.V.), in `consegne/Filmato intro 2026-11-14/` (fuori da git); il minuto e
  il secondo del filmato sono quelli dell’intro, e negli ultimi secondi manca lo schermo di gioco sotto.
  **I suoi appunti sono arrivati lo stesso giorno: «Cinematica d’apertura, scelte definitive»** (documento 09,
  §16, dove stanno una per una): una tipografia dei titoli di testa; sei crediti (tre cartelli nel nero, tre
  in sovrimpressione); il cursore che scrive, con il suo suono; il faro che illumina davanti; il titolo con
  un colore e uno scioglimento nuovi e senza il suono delle lettere; tutto nel formato largo, loghi compresi;
  una pellicola unica su loghi e intro. **Fatte tutte**, con le prove; l’intro dura 3:24. **Non le ha ancora
  viste né sentite**: il filmato nuovo è `consegne/Filmato intro 2026-11-14/Il Relitto Silente - intro con i
  titoli di testa.mp4`. **Il suo giudizio sul filmato nuovo, lo stesso giorno: «L’intro è quasi perfetta […] Per il resto per ora è
  perfetta».** Tre correzioni, fatte (documento 09, §16.9): i loghi passano anche subito prima dell’intro; allo
  spegnimento dei reattori nessun suono («meglio non mettere niente»: se trova suoni di scandaglio o di eco radar
  li porta lui); i glifi del titolo si sciolgono in silenzio. Il credito di Leonardo non l’ha toccato: resta.
  **La beta 12 è pubblicata** (su sua richiesta, senza rifare il filmato). **Alla prossima: le sue note sulla
  beta 12 giocata**; poi il resto di questo prompt. **Il titolo del libro è deciso: «Dal Registro della Santa Maria», dappertutto**
  (menu, titoli di coda, riconoscimenti, copertine: «Una storia tratta dal libro *Dal Registro della Santa
  Maria*»; la copertina dell’anteprima su GitHub va ricaricata a mano dalle impostazioni del repository, se
  la vuole aggiornata). Il filmato si rifà in un quarto d’ora (`strumenti/intro/LEGGIMI.md`).
- **13 novembre 2026, mattina: le prime prese di Leonardo.** Sono arrivate `sm-001.wav`…`sm-004.wav`, le
  quattro descrizioni della plancia. Controllate: il testo è quello del copione, parola per parola (Whisper
  scrive «cucetta», ma l’autore ha ascoltato: «cuccetta va bene»; con le doppie Whisper sbaglia, non si
  segnala più); circa due parole al secondo; la stanza fra −75 e −80 dBFS; un secondo di silenzio prima e
  dopo. Due note tecniche, scritte in un messaggio che l’autore gira a Leonardo: i picchi troppo alti
  (SM-002 a −0,9 dBFS, SM-003 e SM-004 toccano lo zero; il copione chiede mai sopra −3) e 16 bit invece di 24.
  Le quattro prese non si rifanno. Stanno in `doppiaggio/william/consegne/` (fuori da git: le 604 prese
  peseranno circa 1,5 GB). **Non sono ancora nel gioco.**
- **13 novembre 2026: l’estetica della cinematica d’apertura, cominciata** (documento 09, §14). L’autore:
  «ora se non erro dovevamo far lavorare Fable 5.2 alla cinematica»; e il confine: tempi e sceneggiatura non
  cambiano, «se non per tua decisione tecnica»; quello che restava da fare nell’intro dal 30 ottobre
  riguarda «i testi o i titoli di testa», e si vedrà dopo. Guardata scena per scena (i fotogrammi di
  com’era sono in `consegne/Cinematica 2026-11-13 - com'è oggi/`). **Fatto il cielo**: la Via Lattea fredda
  delle copertine, le stelle con grandezze vere, il fondo blu notte che stacca il fuso nero, il bagliore solo
  dalle luci; calcolato una volta sola, e un fotogramma dello spazio costa da tre a cinque volte meno.
  **Approvato dalle immagini** a fine sessione («è molto buono e quindi va bene»); nell’eseguibile non l’ha
  ancora visto, e non è in una beta. Il punto «il relitto come materia» è
  ritirato (il testo lo vuole nero assoluto).
- **La Santa Maria è ferma, in attesa di un modello.** L’autore ha chiesto la spinta dei reattori di poppa
  («se si può metterei un effetto di propulsione dai reattori che si vedono dietro») e poi, mentre la
  preparavo: «credo che la Santa Maria abbia gravi problemi di coerenza. Sto pensando se possa valere la pena
  rifarla in Blender con MCP di Claude Code. Se secondo te può valere la pena fermiamoci un attimo e ci
  ritorniamo con il modello». Gli ho detto di sì: i due still (`prua.webp`, `poppa.webp`) sono due navi
  diverse nei particolari, e sono immagini piatte con la luce già dentro. **Blender 5.2.4 LTS è installato**
  («Sì, prepara tu»; `%LOCALAPPDATA%\Programs\Blender\5.2.4\`, il pacchetto ufficiale, firma verificata) e
  **provato**: disegna senza finestra, con la scheda video. **Il collegamento MCP non c’è**: il controllo di
  sicurezza della sessione non mi ha lasciato eseguire né registrare `mcp-for-blender` (codice di terzi), e
  non si aggira; i tre comandi che può lanciare lui sono nel documento 09, §14. Non serve per lavorare:
  Blender si guida con script del progetto.
- **La nave va progettata, e la scheda c’è già.** L’autore: «Non lo so quale è l’immagine vera della Santa
  Maria […] Forse potrebbe essere ideale progettarla proprio, disegnare delle schematiche». Nel progetto del
  seguito ci sono la scheda canonica dello scafo (`05B_SchedaNaveEsterno.md`, ratificata da lui il 31 agosto
  2026), la tavola approvata (`turnaround_approvato_2026-09-01.png`) e la mappa degli interni
  (`05_MappaNaveSantaMaria.md`). Manca la geometria, e **i due giochi non raccontano la stessa pianta** (nel
  Relitto la sala macchine è sotto la stiva; nel seguito è sullo stesso ponte). La proposta, nel documento
  09, §14: la scheda unica con le contraddizioni da sciogliere, poi le schematiche, poi il modello fatto da
  script. L’autore: «Sì, comincia». **Il primo passo è fatto: la scheda unica** (`38-la-santa-maria.md`, con lo
  schizzo `38-la-santa-maria-schizzo.png`, disegnato da `strumenti/nave/schizzo.py`): quello su cui i due
  giochi sono d’accordo, la nave in ognuno dei due, le immagini, e **otto contraddizioni, ognuna con una
  proposta** (N1 un ponte solo, con la sala macchine più in basso; N2 un solo oblò tondo a prua, niente muso
  vetrato; N3 la poppa dello still, quattro scarichi in due coppie, e dentro il reattore con i due motori; N4
  un’uscita sola, a poppa sul fianco destro; N5 la nave affiancata al relitto sul fianco destro; N6 l’oblò
  piccolo della cuccetta resta; N7 il corridoio c’è, e il Relitto non lo nomina; N8 80 × 13 × 12 metri). Le
  proposte non chiedono di cambiare il testo di nessuno dei due giochi. **Le ha approvate tutte** («Sì,
  tutte», 13 novembre): valgono come canone della nave per i due giochi. **Il secondo passo è cominciato: le
  schematiche, prima stesura** (`39-schematiche-della-santa-maria.md`; tre tavole in
  `progettazione/39-schematiche/`: fuori, dentro, sotto e di traverso), disegnate da
  `strumenti/nave/schematiche.py` a partire da `strumenti/nave/misure.py`, l’unica tabella delle misure, la
  stessa che costruirà il modello. Il documento 39 dice che cosa viene dalle decisioni, che cosa dai testi e
  che cosa è inventato lì (il passaggio di servizio lungo il fianco destro, i locali senza nome, la forma del
  muso, dove stanno faro, radar, antenna e arpioni, la pedana del portello d’uscita). **Le tavole sono
  approvate**, con le parti inventate («Sì vanno benissimo ma facciamo una pausa», 13 novembre): la sessione
  si è fermata qui. **Alla prossima: il terzo passo, il modello in Blender** (5.2.4 LTS, senza finestra, con
  script del progetto in `strumenti/nave/`, a partire da `misure.py`): prima lo scafo e le sue parti, poi la
  superficie sulla scheda 05B del seguito (le toppe, il fasciame, le staffe), poi le due riprese dell’intro
  (da davanti di tre quarti per B, da poppa per E) con le luci separate (lo scafo, l’oblò d’ambra, i fanali,
  la spinta dei quattro scarichi), messe accanto agli still di oggi perché decida lui; poi il faro e la
  fotografia unica. Chiudendo la sessione ha deciso due cose. **Il cielo nuovo è approvato**, dalle immagini:
  «Il cielo non l’ho visto nel gioco ma dalle immagini è molto buono e quindi va bene» (non è ancora in una
  beta). E **«la nave che stiamo lavorando sarà la nave in tutti i progetti»**: la Santa Maria dei documenti
  38 e 39 è il canone ovunque compaia (questo gioco, il *Mistero della Santa Maria*, il cortometraggio, quello
  che verrà). Il progetto resta in questo repository finché non dice altro; gli altri progetti la prendono da
  qui. «Salva tutto e ci vediamo in una prossima sessione».
- **12 novembre 2026, nella notte: «Havela», l’inno degli alieni** (documento 32, §3.11). L’idea è
  dell’autore (11 novembre): la canzone dei titoli di coda rifatta con ElevenLabs come un inno alla vita
  scritto dagli alieni, in una lingua inventata. Ha scelto «la morbida» fra due lingue, e ha chiesto una
  versione sola, senza prove. È generata (2:58, `audio/musica-ia/CT/originali/CT-02-havela.mp3`, fuori da
  git), e lui l’ha ascoltata: «il brano è molto bello. Tienilo ma non sostituirlo a quello che c’è ora nei
  titoli di coda. Domani ti dico cosa ne faremo». **Nel gioco non è cambiato niente**: i titoli hanno ancora
  «Voice in the Deep». **Deciso il 13 novembre** (documento 32, §3.12): «Havela» di ElevenLabs è nel gioco come «Ascolta il canto»,
  nel colloquio con l’Anziano (beta.11), e i titoli restano com’erano; la versione di Suno resta da parte.
  Allora la nota era: chiedergli che cosa farne, e non proporre
  di metterla nei titoli. Dei suoi 7.000 crediti ElevenLabs il connettore ne ha segnati 2.670. Prima di
  chiudere ha chiesto lo stile, il testo e il titolo per provarla lui in Suno V6 (32, §3.11, in fondo), e
  l’ha portata subito (4:03, `CT-03-havela-suno.mp3`, accanto all’altra; misurata, nel registro): «dura più
  di 4 minuti ma poi quando saranno finiti i titoli la sfumiamo. Anche questa, che è bellissima, tienila da
  parte, domani decideremo il futuro di questi brani». **Le versioni da parte sono due**, e decide lui.
- **11 novembre 2026, seconda sessione: la revisione globale** (documento 37, chiesta dall’autore: «criticità
  gravissime, gravi, medie e lievi»). Nessuna gravissima; **3 gravi**, 26 medie, 40 lievi. Le gravi: dopo una
  «Nuova partita» spariscono dallo schermo «diario» e «menu» (il foglio di stile dell’intro vale per tutta la
  pagina; in tutte le beta); «La prima nota» riconosciuta in stiva è registrata come «Vivi» (una riga del ponte);
  il congedo dell’Anziano si può disfare, e nella fuga gli si può riparlare da capo (tocca `ponte.fav`: decide
  lui). Le correzioni le sceglie l’autore, lotto per lotto (documento 37, §8; il registro è il §9). **Le tre
  gravi sono corrette** lo stesso giorno, ognuna con la sua prova: G1 e G2 («Sì, correggile»; commit `d5ca287` e
  `39f6f4a`) e G3 (`2a089d7`), con la proposta che l’autore ha approvato («Procedi»): nessuna frase cambiata né
  aggiunta in `ponte.fav`; la fuga comincia al gesto «[Chiudi gli occhi e lascia andare.]», e il ponte tiene lo
  schermo e il suono com’erano fino a che William apre gli occhi; chi parla all’Anziano nella fuga legge «Non c’è
  più. La sua luce è dentro il seme.»; a occhi chiusi il pulsante «Chiudi la conversazione» non c’è. I percorsi del
  collaudo sono 17. Non sono ancora in una beta, e nell’eseguibile vanno ancora guardate (una partita nuova:
  «diario» e «menu» in alto; il congedo dell’Anziano).
  Lo stesso giorno l’autore ha detto che la musica di Alirio Bruni è un dono al progetto, con libertà d’uso: va
  scritto nei registri delle licenze (37, L26).
- **11 novembre 2026: il punto della situazione** (documento 36, chiesto dall’autore: tutto quello che è fatto e
  tutto quello che resta). Trovato rileggendo: **le prove su GitHub sono rosse** dai commit `34c936d` e `222f881`
  (7 novembre). `collaudo/eventi.py` importa `strumenti/audio/taglia_servizio.py`, che importa numpy, e `prove.yml`
  non lo installa. **Corretto lo stesso giorno** (`b62dbaf`, «Sì, correggile»): `nome_file` sta in
  `voce_servizio.py`, che usa soltanto la libreria standard; le prove su GitHub sono di nuovo verdi, e la beta 11 si
  può costruire.
- **La versione** pubblicata è la **0.2.5-beta.13** (16 novembre 2026, a notte: la voce di William nel gioco, l’intro con William e Yusuf, i titoli di testa nuovi; il canale `aggiornamenti-prova` la serve). Prima, la **0.2.5-beta.12** (14 novembre 2026: la cinematica d’apertura rifatta, cioè la nave vera, i titoli di testa, la pellicola, i loghi nel formato largo e di nuovo prima dell’intro, il titolo nuovo, il faro frontale; e il titolo del libro «Dal Registro della Santa Maria»), una pre-release nel canale di prova. Prima, la **0.2.5-beta.11** (13 novembre 2026: i quattro momenti animati, il suono della mappa, il cielo dell’intro, il computer di bordo, le correzioni della revisione 37 e «Ascolta il canto»), una pre-release nel canale di prova
  (`aggiornamenti-prova`), del 7 novembre: la voce di servizio. Prima: la beta.9 (7 novembre: la revisione
  narrativa e tutte le voci registrate), la beta.8 (30 ottobre: la voce di L.V. e il tema della Santa Maria
  nell’intro), la beta.7 (29 ottobre, notte: le scene definitive dell’intro), la beta.6 (29 ottobre: William racconta in prima
  persona, in tutto il gioco), la beta.5 (27 ottobre, la prima con la finestra delle novità).
- **La voce, più avanti.** Il 29 ottobre l’autore ha chiesto quanto lavoro sarebbe per **Leonardo Tomassetti**
  (il William del *Mistero della Santa Maria*) leggere il gioco. Divisione come nel Viaggiatore: Leonardo il
  racconto e le scelte (circa 14.500 parole tolti i doppioni, circa 1 ora e 50 di audio, 6–9 ore di sala,
  contro le circa 5.900 parole di William nel Santa Maria); le altre voci (Yusuf è l’autore, l’Anziano, le echi,
  L.V., le traduzioni) circa 2.300; una voce di servizio con la sintesi per i suggerimenti, le percentuali, i
  referti dello scanner e i messaggi del motore, meno di 1.000. Niente è deciso oltre la prima persona.
  **Rifatti il 7 novembre** (documento 33, RN-H4), dopo la revisione, con lo stesso strumento sui due testi: il
  racconto +4 %, e Leonardo legge anche le incisioni; alla misura del 29 ottobre circa 15.400 parole, 1 ora e 50 –
  2 ore di audio, 6 ore e mezza – 9 ore e mezza di sala. Le altre voci sono tutte registrate (documento 35).
- **L’intro ha le scene definitive** (29 ottobre, seconda sessione: l’autore ha chiesto di portarla «a livello
  top», con un tocco cinematografico, prima delle altre cose; documento 09, §12). La plancia intera a piena
  risoluzione con la vista fuori dal vivo nell’oblò, il cambio di fuoco vero, il radar a fosforo, il faro che cerca,
  i glifi che si tracciano, e la fine che vola nella lente del gioco mentre la partita parte sotto. È nella
  **0.2.5-beta.7**, pubblicata nel canale di prova la notte del 29.
- **La voce di L.V. e il tema della Santa Maria nell’intro** (notte del 29–30 ottobre; documento 09, §13): la voce
  l’ha generata l’autore con la sintesi vocale di Google (la voce «Elio», sul testo di L.V. rivisto e approvato il 30:
  nuovo anche nel prologo di `relitto.fav` e nella scatola nera di `vita.fav`), passata da una trasmittente leggera;
  il tema è «The Santa Maria Theme» di Alirio Bruni (non è musica generata). Statica continua, nessun testo di L.V.
  a schermo mentre parla: c’è solo il nastro della scatola nera, e la sua scritta prima che parli. L’intro dura
  3:02. È nella **0.2.5-beta.8**; l’ascolto è anche in `consegne/Ascolto intro 2026-10-30/`.
- **Le voci con ElevenLabs** (1–2 novembre, documento 32): L.V. resta «Elio»; l’Anziano parla nel gioco con il
  canto del primo contatto e tre battute (non ancora in una beta).
- **La lettura integrale e la valutazione** (3 novembre): la storia raccontata per intero, la valutazione come
  racconto e come gioco, e la roadmap della revisione narrativa (documento 33).
- **Il blocco A della revisione è deciso** (4 novembre; documento 33, §9 e §11): una cronologia privata (arrivo e
  semina circa quattro miliardi di anni fa, un’orbita che ripassa ogni centocinquant’anni); la semina resta un
  dubbio; la persona a cui va il seme appartiene al secondo gioco, e qui non compare; la cuccetta ha una branda
  sola e la plancia una poltrona sola, come nei racconti e nelle immagini; della morale detta resta una frase sola,
  dell’Anziano. Niente è ancora scritto nei `.fav`: si scrive dopo le decisioni.
- **Il blocco B è deciso** (4 novembre; documento 33, §9, e le schede del documento 34): quattordici persone e tre
  testi pubblici; la solennità resta soltanto alla Stele, al fregio, al sostegno, al Custode e all’Anziano; dei
  messaggi «a chi verrà» ne restano cinque; tre crepe (il «domani» del Navarca, l’errore delle teche dello
  xeno-botanico, la voce senza ruolo che non voleva partire); il «Seminare comunque» del capitano manda le navi di
  semina sul terzo pianeta con la nave che muore (l’autore: «è proprio qui che volevo arrivare»).
- **Il blocco C è deciso** (4 novembre; documento 33, §9): l’Anziano dice soltanto quello che William non sa
  (a chi ha letto la Stele: «Piangemmo»); tre gesti nuovi nel colloquio (il sonaglio, il Sintonizzatore, la cifra
  dell’aria); «[Posa il risuonatore.]» restituisce le voci e si vede nella fuga, nel vestibolo delle gole. E una
  regola nuova dell’autore per tutta la revisione: **nessun vincolo tecnico decide** («tutto si riscrive, codice o
  doppiaggio che sia»); le tre battute di ElevenLabs erano prove e si rifanno con nuovi crediti.
- **Il blocco D è deciso** (4 novembre; documento 33, §9): tre chiavi e mappa come sono, con tre fili fra le ali
  (la colpa delle teche che uccise L.V., la versione ufficiale della Stele, la semina); il Nucleo diventa la memoria
  dell’Anziano (la pazienza regala la cosa salvata dall’Archivista); la scelta fra forza e pazienza la vede
  chiunque; nella fuga la nave risponde, e fermarsi per i nomi è una scelta senza suggerimento.
- **Il diario di William** (RN-F7, idea dell’autore del 4 novembre, deciso): la storia fin qui e le cose da fare,
  nella sua voce, mai i gesti che contano; due pagine nuove nel diario che l’app ha già. I punti della revisione sono ora 37.
- **Il blocco E è deciso** (4 novembre; documento 33, §9 e §11, punti 6 e 7): i finali non giudicano più; «Vivi» è
  il finale del racconto e quello da cui parte «Il mistero della Santa Maria», per tutti, con il salvataggio del
  Relitto come dono che cambia i dettagli e mai la premessa (il seme in plancia); la Santa Maria ha 96 anni nel
  Relitto e il Mistero comincia al disarmo, a 99, tre anni dopo; il risveglio comune resta; Yusuf chiama durante la
  fuga; «Due lettere» dice quando a uccidere è il risuonatore.
- **Il blocco F è deciso** (4 novembre; documento 33, §9): l’aria si ritara a tavolino dopo la scrittura, con tre
  partite da principiante scritte da me (il curioso, il frettoloso, lo sperduto) e una regola (il curioso arriva alla
  Grande Porta con le tre chiavi sopra il 30%; ascoltare tutto non si può); le persone vere non sono garantite.
  Tradurre sotto il 18% non costa aria, con una frase di William al cilindro. «La prima nota» si apre anche
  riconoscendo il re in stiva. Dei 41 suggerimenti si toglie il comando soltanto dai due dell’eco della culla. Un
  invito nel bassorilievo e nelle capsule. Una riga alla fine della prima eco delle quattro voci a due strati, e
  una domanda nel diario.
- **Il blocco A è scritto** (5 novembre 2026, approvato dall’autore frase per frase): via i «secoli», la semina
  resta un dubbio nel nodo «sangue», della morale resta solo «Restare è già una risposta», una poltrona e una
  branda sole sulla Santa Maria. Prove tutte verdi; i salvataggi di prima si caricano «ricostruita».
- **Il blocco B è scritto** (5 novembre 2026, approvato voce per voce): la voce senza ruolo è chi non voleva
  partire; lo xeno-botanico ammette l’errore delle teche; lo Scriba parla da artigiano e la sua firma si ferma dove
  comincia il nome; il Custode ha inciso da solo l’ultima riga del fregio; l’Archivista ha salvato una cosa sola,
  e nel Nucleo c’è «qualcosa che la matrice non sa aprire» (la dirà l’Anziano, con il blocco D).
- **Il blocco C è scritto** (5 novembre 2026, approvato frase per frase): l’Anziano dice soltanto quello che
  William non sa («Piangemmo» a chi ha letto la Stele; la pioggia salvata dall’Archivista a chi ha avuto pazienza);
  tre gesti al posto di tre domande; il congedo è un saluto; «[Posa il risuonatore.]» restituisce le voci, che
  si sentono nella fuga e lasciano una riga in «Vivi» e «Mani vuote». La voce registrata del congedo non suona
  più finché non si registra di nuovo; il benvenuto e il Piccolo la tengono. I percorsi del collaudo sono 15.
- **Il blocco D è scritto** (5 novembre 2026, approvato): nell’arca della memoria la scelta fra forza e pazienza
  la vede chiunque (con la corrente il pilastro si sveglia in tre turni, 2 d’aria l’uno; la taglierina apre
  subito); nella fuga la voce dei nomi non ha più il suggerimento, e tace se William sale. Dopo il blocco la
  soluzione più corta finisce al 60%, «tutto» al 19%.
- **Il blocco E è scritto** (5 novembre 2026, approvato): i finali non giudicano più («a nessuno», «cioè
  sempre» e i vent’anni via); Yusuf chiama sullo scafo durante la fuga, e William non risponde (due battute
  da registrare con la voce dell’autore); «Due lettere» ha la sua riga quando uccide il risuonatore.
- **Il testo del blocco F è scritto** (5 novembre 2026, approvato): traduzioni gratis sotto il 18% con la frase
  al cilindro; il re riconosciuto in stiva; via il comando dall’eco della culla; gli inviti nel bassorilievo e
  nelle capsule; la riga dopo la prima eco delle voci a due strati. I percorsi del collaudo sono 16.
- **Il diario di William è fatto** (5 novembre 2026, approvato): nel diario dell’app le pagine «Appunti» (venti
  appunti, la storia fin qui) e «In sospeso» (quello che lo blocca e le sue domande), scritte dal ponte
  (`ponte.py`, `APPUNTI` e `SOSPESI`).
- **La taratura dell’aria è fatta** (5 novembre 2026; documento 33, §12): tre partite da principiante scritte a mano
  (`collaudo/principiante-*.txt`) e, dall’indicazione dell’autore («la combinazione che rende più verosimile il fatto
  che ce la possano fare»), centinaia di partite verosimili per carattere (`collaudo/verosimili.py`, con
  `collaudo/aria.py`), con la fuga giocata da principianti veri. I costi restano; l’avviso del Ponte scatta sotto il
  55 (prima 45) e c’è un preavviso al 40%. L’autore: «Oggi, più avvisi». Più si ascolta, più si rischia: il curioso
  torna in due partite su tre o quattro su cinque, chi vuole tutto in una su due o meno, chi ascolta poco quasi
  sempre. Il blocco F è finito.
- **Il blocco G è deciso** (5 novembre 2026, punto per punto, contato sul testo riscritto): restano otto antitesi «non
  X: Y» su venticinque, tre «come chi» su sei, tre chiuse secche su sei; via cinque luci di repertorio e nove frasi
  solenni; i motivi ripetuti contati e misurati («mezzo metro», «parte e non torna», «Da solo.», l’«aspettare» dei
  meccanismi). Nessuna frase da riscrivere è in una battuta registrata.
- **Il blocco G è scritto** (5 novembre 2026, approvato: cinquanta frasi): tre sessioni parallele, una per gruppo di
  file, con le skill di prosa, poi l’armonizzazione e il collaudo qui (`progettazione/stile-G/`). L’aria delle partite
  da principiante non cambia.
- **Le otto frasi fatte del G sono scritte** (6 novembre 2026, approvate una per una; documento 33, §9): i globi, i
  pilastri e la loro analisi, il cristallo e il dispositivo medico, la console del Ponte, il segno sulla capsula, le
  punte della porta tonda. Il blocco G è finito: viene il blocco H.
- **L’ultimo lavoro** (6 novembre 2026) è su GitHub, con l’albero pulito e `main` uguale a `origin/main`.
- **Il motore** è Favella1 1.6.1 (documento 29), pubblicata anche su GitHub, PyPI e favella.eu.
- **La revisione totale** (documento 25): i 30 problemi (5 gravi, 10 medi, 15 lievi) sono tutti
  corretti. Delle proposte estetiche sono fatte E1, E5, E6, E9 ed E10.
- **L’interfaccia viva** (documento 30): sono fatti il primo lotto (la grana, la luce della stanza, il
  segnale sui fili, il vetro del casco), i passaggi 2.1–2.5 e la scheda «Grafica», con tre livelli e un
  interruttore per effetto. A gioco fermo la scheda video lavora meno di prima del lotto.

## L’ordine del lavoro (deciso dall’autore il 27 ottobre; il punto 0 il 3 novembre)

0. **La revisione narrativa** (documento 33; l’autore, 3 novembre 2026: «Interverremo fortemente su tutto quello
   che allontana questo gioco da un’opera matura vera»). 37 punti in otto blocchi: A le fondamenta (cronologia,
   quanto dire della semina, William e la persona del racconto, la morale detta ad alta voce), B le voci della
   nave, C l’Anziano, D la struttura, E i finali, F il gioco (con una prova vera dell’aria), G lo stile, H le
   dipendenze (le voci già registrate di L.V. e dell’Anziano, il ponte, il collaudo, i salvataggi). Un blocco per
   sessione, una decisione per volta; poi la scrittura; lo stile per ultimo; una beta sola a lavoro finito. I
   `.fav` si cambiano per i punti che l’autore decide (un’eccezione al congelamento voluta da lui). Il racconto
   originale è la stella polare: William porta via soltanto il seme e lo condivide con una persona sola; Matthew
   è una dedica e non si spiega mai.
   **Il 7 novembre, blocco H** (documento 35): le quindici voci della nave sono disegnate, approvate e **nel
   gioco** (commit `31f4c8a`), con la pausa fra una voce e l’altra che l’autore ha chiesto; L.V. è un nastro
   vecchio che si rovina (approvato); le pause fra le voci approvate («vanno bene»); poi **nel gioco** anche
   tutte le 26 battute dell’Anziano e le 8 di Yusuf (documento 35, §8), e L.V. nella scatola nera della serra
   (§10, approvata: «Va bene»). Fatti anche H2–H6 (documento 33, il registro). **La beta 0.2.5-beta.9 è
   pubblicata** (7 novembre, canale di prova): la revisione narrativa è chiusa. Poi: le sue note sulla beta.9. **La
   voce di servizio** (documento 35, §11) è **nel gioco** dal 7 novembre: «Kira» di Google AI Studio, generata
   dall’autore, tagliata nelle 41 parti (`strumenti/audio/taglia_servizio.py`), in fila con le voci della nave e
   asciutta; l’ascolto (`consegne/Ascolto voce di servizio 2026-11-07/`) approvato: «capolavoro l’audio». Nella
   **0.2.5-beta.11**, pubblicata il 13 novembre nel canale di prova (la beta.10 è del 7). **Il copione di William** per Leonardo è pronto (7 novembre): `doppiaggio/william/`, un PDF di
   111 pagine (125 blocchi con due righe di contesto ciascuno, 605 prese, circa 16.000 parole), fatto da
   `strumenti/audio/copione_william.py` e `copione_pdf.py`; in fondo quattro punti aperti da decidere con l’autore
   (la lettura di TSC-1972, la firma sul registro, chi dice la riga del registro nei finali, la frase delle fasce
   del pilastro con una fascia sola). **Decisi** lo stesso giorno: «millenovecentosettantadue»; la firma «W. T.»;
   la riga del registro la dice la voce di servizio come computer di bordo (quattro parti nuove, `SV-42`…`SV-45`:
   generate dall’autore con Kira, tagliate e **nel gioco** il 7 novembre, documento 35, §11; la riga entra dopo il
   tempo di leggere il finale, 44 s in «Vivi»); la frase delle fasce corretta. **Non ancora in una beta** e non
   ancora ascoltate da lui: l’ascolto è pronto in `consegne/Ascolto computer di bordo 2026-11-07/`.
   *11 novembre:* quell’ascolto metteva in «Vivi» la riga della «Stiva piena» (solo l’ascolto: il gioco è giusto);
   rifatto con i cinque finali, ognuno con la sua riga e il suo ritardo (`consegne/Ascolto computer di bordo
   2026-11-11/`, 5:09), e fatto suonare all’autore («riproduci tu le situazioni»). **Approvato:** «voce computer
   perfetta». Ha chiesto se il respiro sintetizzato che si sente è quello di William: sì, il fiato nel casco del
   motore audio; nell’ascolto dura qualche secondo in più che nel gioco, perché `rendi_echi` non manda il casco tolto
   (nel gioco, al rientro in stiva, il colpo d’aria e il fiato che finisce). Rifare l’ascolto: «No». Se il respiro gli
   suona finto, è fra gli effetti da rifare più avanti (punto 5).
   **La prima sessione dell’11 novembre si è chiusa qui** («fai una verifica finale generale e salva… Poi torno»):
   tutto su GitHub, prove verdi. **La seconda è la revisione globale** (documento 37; vedi «Dove siamo»).
   **Alla prossima:** prima di tutto chiedergli quali altre correzioni del documento 37 fare (le tre gravi sono
   fatte; nella stessa scena del congedo resta M24, che vuole una frase nuova, da proporgli per intero); insieme, le sue note
   sulle beta (dalla 5 alla 10) e quello che resta nell’intro (la M7 del documento 37 può esserne una parte); poi la
   beta 11 (la firma «W. T.», le fasce, il computer di bordo, le tre gravi del documento 37, le altre correzioni scelte, più le sue
   note). Effetti e suoni d’ambiente rifatti, più avanti, quando ne riparla lui.

1. **Le sue note sulle beta, dalla 5 alla 10.** Prima cosa: chiedergli come gli sono sembrate nel gioco vero,
   con il suono, la prima persona, l’intro con la voce di L.V. e le voci registrate, e correggere quello che dice.
2. **Il resto dell’interfaccia** (documento 30). *L’autore, 24 novembre 2026: «Io non avevo chiesto di cambiare
   l’interfaccia, avevo chiesto a Fable di fare una revisione estetica per individuare in cosa, tra animazioni, look e
   quant’altro, potesse essere migliorato». Quello che segue è quindi una lista di proposte da mostrargli, non di
   lavori da fare:*
   - **i momenti con un’animazione loro** (30, §9; l’11 novembre l’autore ha chiesto un’analisi e una proposta
     di miglioramenti estetici): **l’apparizione dell’Anziano è fatta e approvata** («l’animazione è bellissima»,
     e con le parole che compaiono solo alla fine: «perfetto così»), **e anche la sua dissolvenza nel seme**
     («Sì, va bene»); **e la nascita della mappa stellare** (sua idea; rifatta lenta, senza scie e con due galassie: «animazione meravigliosa»), che poi resta nella lente del visore («lavoro eccellente»); **e la nave che si sveglia** quando torna l’energia («Sì, va bene»; 30, §9.5). I quattro momenti sono fatti, e **l’autore li ha guardati nell’eseguibile, con il suono**, la sera dell’11 novembre (30, §9.6): «trovo che questo gioco abbia una componente emotiva importante». Il suo unico appunto, il suono della mappa stellare («in modo delicato», quando si crea l’immagine, e il viaggio), è fatto e approvato la notte stessa, ascoltandolo nell’eseguibile («Sì, va bene»; 30, §9.4). Non sono in una beta. Nello stesso paragrafo
     la lista per l’interfaccia e l’estetica dell’intro;
   - i momenti 2.6–2.9: il cartello d’atto, l’ingresso nella protezione vitale, le crepe della fuga,
     l’ipossia;
   - il lotto 3, le rifiniture;
   - due decisioni sue: E7, la cornice sugli schermi 16:10; E4, la modalità scritta.
3. **L’intro, perfezionata**:
   - **l’estetica, con Fable 5.2** (documento 09, §14; cominciata il 13 novembre): ~~il cielo~~, fatto;
     **il modello della nave è cominciato il 14 novembre** (documento 40: la forma e una prima superficie;
     la forma, i tre pezzi chiesti e gli anni sono approvati; **la nave vera è nell’intro**, disegnata dal
     vivo, con i reattori che si spengono nella scena da dietro; si aspettano le sue note, e va guardata
     nell’eseguibile);
     **la Santa Maria nella luce**, ferma finché non c’è il modello in Blender (l’idea è dell’autore;
     Blender c’è, il collegamento MCP no e non serve; prima il progetto della nave: la scheda unica dai due
     giochi, le schematiche, poi il modello fatto da script, vedi 09, §14; il modello deve essere la nave
     della scheda 05B del seguito: scafo grigio consumato, strisce arancioni, TSC-1972 · SANTA MARIA, i pannelli sui
     fianchi, quattro scarichi a poppa, il faro; dal modello si rendono le due riprese dell’intro, da davanti
     di tre quarti per B e da poppa per E, con la luce dello scafo, delle finestre e dei reattori in immagini
     separate, perché il motore dell’intro le animi; prima di sostituire gli still, il confronto accanto a
     quelli di oggi, e decide lui); poi **il faro** (un cono di luce calda nella polvere, che si perde prima
     del nero) e **una fotografia sola** per tutte le scene;
   - ~~le scene definitive~~: fatte il 29 ottobre (documento 09, §12). Prima cosa, le sue note quando la vede
     nel gioco, con il suono: gli aggiustamenti, i titoli di testa «o altro»;
   - ~~la musica~~: il tema della Santa Maria e la voce di L.V. (§13) prendono il posto di `I-B`, `I-E` e `I-G`
     (documento 22, §5.8), che non servono più, se l’autore conferma.
   - ~~il testo di L.V., rivisto~~: approvato dall’autore il 30 ottobre e applicato, con la voce «Elio» (09, §13).
   - **c’è ancora da fare** (l’autore, 30 ottobre, chiudendo la sessione: «c’è ancora da fare nell’intro. Lo
     faremo prossimamente»). Non ha detto che cosa: chiederglielo, insieme alle note sulla beta.8, prima di
     toccare l’intro. Restano aperti anche i titoli di testa «o altro» e, se conferma, l’addio ai pezzi `I-B`,
     `I-E` e `I-G`. Gli attrezzi: `strumenti/intro/` (la voce, la trascrizione con Whisper, i momenti per
     rendere il suono) e `strumenti/misure/intro_voce.mjs` (l’intro nell’eseguibile, con i livelli del suono).
   - **le voci con ElevenLabs v4** (1° novembre, documento 32): l’autore vorrebbe una voce di qualità per L.V.,
     con la stanchezza, l’affanno e il respiro della fine dell’aria, e un’idea per la voce dell’Anziano. L’analisi
     è fatta (la voce disegnata sana e la fatica nei tag; l’Anziano senza traduttore, senza fiato, con il canto
     sotto); restano le decisioni D-V1–D-V5, a cominciare dalla descrizione della voce di L.V.
     Aggiornamento del 2 novembre: L.V. resta «Elio»; l’Anziano ha la sua voce («Edoardo Straniero») e il canto
     del primo contatto; l’ascolto di prova è in `consegne/Ascolto Anziano 2026-11-02/` (32, §3.4–3.7). Rimandati
     per i crediti: la canzone dei titoli con ElevenLabs (32, §3.8) e l’idea degli effetti sonori (32, §3.9).
     **L’Anziano è nel gioco** (2 novembre, «integra l’anziano che è approvato»; 32, §3.10): il canto al primo
     contatto e la voce nelle tre battute approvate, la musica dei letti 5 dB più bassa e fissa. Non è ancora in una
     beta. Le altre 28 battute restano scritte finché non ci sono i crediti (circa 4.700 per una presa).
     «Voice in the Deep» di Lyria, riascoltata, è approvata di nuovo.
4. **Il finale** (revisione 25, E2): una schermata vera per il finale, invece della casella che scorre.
   L’autore ha detto «una eventuale finale»: si propone, e decide lui. *24 novembre 2026: «il finale è un tema che
   dovremo affrontare seriamente ma non ora».*
5. **Il resto**, dopo:
   - **la canzone dei titoli di coda, rifatta con ElevenLabs** (l’autore, 11 novembre 2026, a notte: «sarebbe
     meraviglioso se rifacessimo la canzone dei titoli di coda con 11labs e il suo connettore magari come se
     fosse una loro canzone, un inno alla vita scritto dagli alieni stessi, con una lingua inventata»). Il
     documento 32, §3.8, la teneva rimandata per i crediti; oggi i titoli hanno «Voice in the Deep» di Lyria.
     **Generata il 12 novembre: «Havela»** (32, §3.11), nella lingua «morbida» scelta da lui. Gli piace
     («il brano è molto bello»), ma **non va al posto di «Voice in the Deep»**: è tenuta da parte, fuori dal
     gioco, e che cosa farne lo dice lui («Domani ti dico cosa ne faremo»). C’è anche la sua versione di
     Suno V6, di 4:03, «bellissima», da parte anche lei («domani decideremo il futuro di questi brani»);
   - **gli effetti e i suoni d’ambiente, rifatti** (l’autore, 7 novembre 2026: «ora teniamo buono questo
     environment sound ma credo che poi fx e suoni vadano rifatti, ma ci penseremo più in là»): dopo il blocco H
     e la beta, se ne riparla con lui (documento 35, §9). *24 novembre 2026: «Effetti sonori e ambientali li
     possiamo rifare da zero con 11labs e il connettore». Prima di generare: un piano stanza per stanza dalla bibbia
     sonora, e il conto dei crediti; si comincia quando lo dice lui;*
   - la colonna sonora ufficiale: le sue sette idee e le decisioni da prendere stanno nel documento 28,
     §1, ancora valide;
   - il logo nel menu (E3), la regola delle immagini (E8), la copertina (D42–D44 del documento 24);
   - il tema `T-01`/`T-02` da ricollegare;
   - Linux su una macchina vera;
   - la partita intera giocata a mano;
   - il primo rilascio pubblico, la 1.0: su GitHub prenderebbe il posto della `v1.5.3` del gioco originale;
   - l’inglese, con la 1.1.

## Dove sono le cose

| Documento | Che cosa |
|---|---|
| `sviluppo/STRUTTURA.md` | la mappa del progetto e i comandi |
| `sviluppo/VERSIONI.md` | le versioni, il CHANGELOG, l’aggiornamento automatico e il rilascio (§9) |
| `CHANGELOG.md` | le modifiche, versione per versione |
| `progettazione/25-revisione-totale.md` | la revisione totale; il §9 è il registro delle correzioni |
| `progettazione/29-favella-1-6-0.md` | Favella1 1.6 nel Relitto, la 1.6.1, l’aria fra 0 e 100 |
| `progettazione/30-interfaccia-viva.md` | il programma dell’interfaccia, il registro, la scheda «Grafica», le misure |
| `progettazione/28-prompt-prossima-sessione.md` | il prompt di prima; il §1 tiene i dettagli della colonna sonora |
| `progettazione/09-intro-storyboard.md`, `22-musica-con-lyria.md` | l’intro e la sua musica |
| `progettazione/36-punto-della-situazione.md` | il punto della situazione dell’11 novembre 2026: che cosa è fatto, che cosa resta, che cosa aspetta l’autore |
| `progettazione/37-revisione-globale.md` | la revisione globale dell’11 novembre 2026: 3 gravi, 26 medie, 40 lievi; il §8 è l’ordine consigliato, il §9 il registro delle correzioni |
| `progettazione/38-la-santa-maria.md`, `38-la-santa-maria-schizzo.png` | il progetto della nave, primo passo: la scheda unica dai due giochi, le otto decisioni (13 novembre 2026), lo schizzo (`strumenti/nave/schizzo.py`) |
| `progettazione/41-la-voce-di-william.md` | la voce di William nel gioco, come nel Viaggiatore (16 novembre 2026): le prese di Leonardo, il ponte, il motore audio, la pagina; `strumenti/audio/voce_william.py` |
| `progettazione/40-il-modello-della-santa-maria.md`, `40-modello/` | il terzo passo: il modello in Blender (14 novembre 2026), la forma e una prima superficie; i due fogli; che cosa è inventato lì e che cosa non va ancora; `strumenti/nave/modello.py`, `superficie.py`, `pelle.py`, `foglio.py` |
| `progettazione/39-schematiche-della-santa-maria.md`, `39-schematiche/` | il secondo passo: le tre tavole e da dove viene ogni misura; `strumenti/nave/misure.py` è la tabella, `schematiche.py` le disegna |
| `progettazione/33-revisione-narrativa.md` | la revisione narrativa: i 37 punti, il metodo, il registro delle decisioni, il calendario |
| `progettazione/34-schede-personaggi.md` | le schede delle voci della nave (blocco B della revisione narrativa) |
| `progettazione/32-voci-lv-e-anziano.md` | le voci di L.V. e dell’Anziano con ElevenLabs v4: l’analisi e le decisioni |
| `strumenti/prova_eseguibile.py`, `strumenti/misure/consumo.mjs` | le prove e le misure nell’eseguibile vero |
