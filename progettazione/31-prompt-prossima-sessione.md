# Prompt per la prossima sessione (31)

Sostituisce il 28. Scritto il 27 ottobre 2026, nel pomeriggio, quando l’autore ha chiuso la sessione:
«per ora ci fermiamo un momento qui. Poi dalle prossime volte dovremmo riprendere con maggiore ordine».
Aggiornato l’ultima volta il 7 novembre 2026, nel pomeriggio, quando l’autore ha chiuso la sessione dopo aver
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
- Le prove su GitHub (`prove.yml`) devono restare verdi.
- **Il bilanciamento si misura su molte partite verosimili**, mai su una sola (5 novembre: «la combinazione che rende
  più verosimile il fatto che ce la possano fare»; e «se così vincono sempre tutti, dove sta la sfida?»):
  `collaudo/verosimili.py`, con la fuga giocata da principianti veri.

## Dove siamo (7 novembre 2026)

- **11 novembre 2026: il punto della situazione** (documento 36, chiesto dall’autore: tutto quello che è fatto e
  tutto quello che resta). Trovato rileggendo: **le prove su GitHub sono rosse** dai commit `34c936d` e `222f881`
  (7 novembre). `collaudo/eventi.py` importa `strumenti/audio/taglia_servizio.py`, che importa numpy, e `prove.yml`
  non lo installa. **Corretto lo stesso giorno** (`b62dbaf`, «Sì, correggile»): `nome_file` sta in
  `voce_servizio.py`, che usa soltanto la libreria standard; le prove su GitHub sono di nuovo verdi, e la beta 11 si
  può costruire.
- **La versione** pubblicata è la **0.2.5-beta.10**, una pre-release nel canale di prova
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
   **0.2.5-beta.10**, pubblicata il 7 novembre nel canale di prova. **Il copione di William** per Leonardo è pronto (7 novembre): `doppiaggio/william/`, un PDF di
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
   **La sessione dell’11 novembre si è chiusa qui** («fai una verifica finale generale e salva… Poi torno»): tutto su
   GitHub, prove verdi. **Alla prossima:** le sue note sulle beta (dalla 5 alla 10) e quello che resta nell’intro;
   poi la beta 11 (la firma «W. T.», le fasce, il computer di bordo, più le sue note). **La sessione
   si è chiusa qui** (7 novembre, pomeriggio: «Ok per ora ci fermiamo»). **Alla prossima:** chiedergli le note
   sulla beta.10; fargli sentire il computer di bordo (la consegna, già pronta); poi una beta con queste
   correzioni (la firma «W. T.», le fasce, il computer di bordo). Effetti e suoni d’ambiente rifatti, più avanti,
   quando ne riparla lui.

1. **Le sue note sulle beta, dalla 5 alla 8.** Prima cosa: chiedergli come gli sono sembrate nel gioco vero,
   con il suono, la prima persona e l’intro con la voce di L.V., e correggere quello che dice.
2. **Il resto dell’interfaccia** (documento 30):
   - i momenti 2.6–2.9: il cartello d’atto, l’ingresso nella protezione vitale, le crepe della fuga,
     l’ipossia;
   - il lotto 3, le rifiniture;
   - due decisioni sue: E7, la cornice sugli schermi 16:10; E4, la modalità scritta.
3. **L’intro, perfezionata**:
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
   L’autore ha detto «una eventuale finale»: si propone, e decide lui.
5. **Il resto**, dopo:
   - **gli effetti e i suoni d’ambiente, rifatti** (l’autore, 7 novembre 2026: «ora teniamo buono questo
     environment sound ma credo che poi fx e suoni vadano rifatti, ma ci penseremo più in là»): dopo il blocco H
     e la beta, se ne riparla con lui (documento 35, §9);
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
| `sviluppo/VERSIONI.md` | le versioni, il CHANGELOG, l’aggiornamento automatico e il rilascio (§7) |
| `CHANGELOG.md` | le modifiche, versione per versione |
| `progettazione/25-revisione-totale.md` | la revisione totale; il §9 è il registro delle correzioni |
| `progettazione/29-favella-1-6-0.md` | Favella1 1.6 nel Relitto, la 1.6.1, l’aria fra 0 e 100 |
| `progettazione/30-interfaccia-viva.md` | il programma dell’interfaccia, il registro, la scheda «Grafica», le misure |
| `progettazione/28-prompt-prossima-sessione.md` | il prompt di prima; il §1 tiene i dettagli della colonna sonora |
| `progettazione/09-intro-storyboard.md`, `22-musica-con-lyria.md` | l’intro e la sua musica |
| `progettazione/36-punto-della-situazione.md` | il punto della situazione dell’11 novembre 2026: che cosa è fatto, che cosa resta, che cosa aspetta l’autore |
| `progettazione/33-revisione-narrativa.md` | la revisione narrativa: i 37 punti, il metodo, il registro delle decisioni, il calendario |
| `progettazione/34-schede-personaggi.md` | le schede delle voci della nave (blocco B della revisione narrativa) |
| `progettazione/32-voci-lv-e-anziano.md` | le voci di L.V. e dell’Anziano con ElevenLabs v4: l’analisi e le decisioni |
| `strumenti/prova_eseguibile.py`, `strumenti/misure/consumo.mjs` | le prove e le misure nell’eseguibile vero |
