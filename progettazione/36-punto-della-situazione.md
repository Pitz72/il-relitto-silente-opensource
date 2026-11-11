# Il punto della situazione (36)

Scritto l’11 novembre 2026, su richiesta dell’autore: «Mi fai un resoconto globale e accuratissimo di quello che è
stato fatto e di quello che ancora c’è da fare? Una sorta di punto fondamentale della situazione». È scritto per lui,
in seconda persona, e controllato sui documenti di progetto, sul CHANGELOG, su git e su GitHub di oggi. Non prende il
posto del prompt 31, che resta il punto di partenza delle sessioni.

## 1. In breve

- Il remake è un gioco intero: si gioca dall’inizio alla fine nell’app per Windows, con l’intro, i sei finali, le
  voci, la musica e il suono. L’ultima versione pubblicata è la 0.2.5-beta.10, del 7 novembre, nel canale di prova.
- La revisione narrativa è chiusa: i 37 punti sono tutti decisi e scritti. Tutte le voci che non sono William sono
  registrate e dentro il gioco.
- L’ultimo lavoro è del 7 novembre. Da allora non è cambiato niente, e il computer e GitHub sono allineati.
- Oggi ho trovato una cosa che nessun documento diceva: le prove automatiche su GitHub sono rosse dagli ultimi due
  lavori del 7 novembre. Il gioco funziona; la causa sta nella macchina delle prove. Finché non si corregge, la
  prossima beta non si costruisce (§4).
- Restano, in ordine: le tue note sulle beta e l’ascolto del computer di bordo; la beta 11; il resto
  dell’interfaccia; l’intro; il finale. Poi la colonna sonora ufficiale, il doppiaggio di William, Linux, la partita
  giocata a mano, la 1.0 e l’inglese con la 1.1.

## 2. Che cosa è stato fatto, in ordine di tempo

Il remake è cominciato il 14 ottobre 2026. Da allora: 215 commit in diciassette giornate di lavoro, dieci beta
pubblicate, trentacinque documenti di progetto.

**Prima del remake.** Il vecchio gioco, fatto con Electron, ha avuto le sue versioni dalla 1.2.6 (2 aprile 2026)
alla 1.5.3 (12 luglio). È conservato intero, con la sua storia, nella cartella del vecchio gioco; su GitHub la 1.5.3 è
ancora la versione segnata «Latest».

**14 ottobre.** Il remake scritto in Favella (allora la 1.4.4), in cinque strati: 23 stanze, sei finali. Una
revisione con dodici difetti di codice, cinque di storia e cinque di collaudo, tutti corretti. Il progetto dell’app
desktop e lo stile «Membrana»: l’acciaio della Santa Maria, la membrana del relitto che cresce. La fase 1, la prova
tecnica, chiusa con la versione 0.1.0; la fase 2, il ponte fra il motore e l’app, con la 0.2.0. Lo storyboard
dell’intro, approvato, e il suo animatic. La bibbia sonora.

**15 ottobre.** Hai bocciato i suoni registrati del prototipo: da allora ogni suono è sintetizzato dal codice, in
Rust. Il motore è passato a Favella 1.5.0 senza cambiare il gioco. Il diario, il menu principale, il registro dei
finali. Le tue prime note sull’eseguibile: lo schermo intero, i loghi del Viaggiatore, la dichiarazione
sull’intelligenza artificiale, Yusuf al comunicatore, la pagina dei tasti. Tre valutazioni: la modalità a solo
testo, il Mistero della Santa Maria su Favella, la traduzione inglese.

**16 ottobre.** Il gioco suona: 23 stanze, 85 eventi, i tocchi dei pulsanti, il filo del Sintonizzatore; l’audio
l’hai approvato. La musica sintetizzata l’hai bocciata: la musica sono file, generati da te con Lyria e Suno. La
modalità a solo testo è fatta: nelle Opzioni si sceglie fra pulsanti e comandi scritti. Il logo, il fuso nero con il
seme verde, e le icone del gioco. La scheda Audio con tre volumi. Il repository su GitHub, con il vecchio gioco
dentro.

**18 e 19 ottobre.** La revisione totale (documento 25): trenta problemi, nessuno gravissimo, cinque gravi, dieci
medi, quindici lievi, tutti corretti. L’aggiornamento automatico firmato, provato dal vero dalla beta.1 alla beta.4
(hai visto la barra dello scaricamento). La finestra delle novità dopo un aggiornamento. Le viste delle stanze:
diciotto scansioni del relitto disegnate in codice, e le immagini della Santa Maria dal sequel. I titoli di coda con
la canzone «Voice in the Deep». Il sottotitolo nuovo, «Una storia tratta da *Il Registro della Santa Maria*». Il nome
«Favella1». Se l’audio si rompe, il gioco continua muto.

**26 e 27 ottobre.** Il motore a Favella1 1.6.0, poi 1.6.1: ho corretto in Favella1 la lentezza della compilazione, e
la 1.6.1 è pubblicata ovunque (GitHub, PyPI, il manuale, favella.eu). L’aria non scende più sotto zero. L’interfaccia
viva, il primo lotto: la grana, la luce della stanza, il segnale sui fili, il vetro del casco, l’arrivo nelle stanze,
l’aria che si consuma, le cose che si spostano, i pannelli; e la scheda Grafica, con tre livelli e un interruttore per
effetto, perché gli effetti non si tolgono. La beta.5, la prima con la finestra delle novità.

**29 ottobre.** Tutto il testo riscritto in prima persona: racconta William (beta.6). L’intro con le scene
definitive, con il tocco cinematografico (beta.7).

**30 ottobre.** La voce di L.V. nell’intro, «Elio» di Google, generata da te sul testo rivisto e approvato; il tema
della Santa Maria di Alirio Bruni; la statica continua. L’intro dura 3 minuti e 2 secondi (beta.8). Chiudendo la
sessione hai detto che nell’intro «c’è ancora da fare».

**1 e 2 novembre.** Le prove con ElevenLabs: L.V. resta «Elio»; l’Anziano ha la sua voce, «Edoardo Straniero», e il
canto del primo contatto.

**3 novembre.** La lettura integrale, la valutazione, e la roadmap della revisione narrativa (documento 33): 37 punti
in otto blocchi, verso «un’opera matura vera».

**4 novembre.** Decisi i blocchi dalla A alla F, le schede dei personaggi (documento 34), il diario di William.

**5 e 6 novembre.** Scritti i blocchi dalla A alla G, ogni frase approvata da te: la cronologia, le voci della nave
come persone, l’Anziano che ascolta invece di spiegare, la scelta fra forza e pazienza per tutti, i finali che non
giudicano, Yusuf che chiama nella fuga, il diario con «Appunti» e «In sospeso», la taratura dell’aria su centinaia di
partite simulate (due avvisi nuovi, al 55 e al 40 per cento), lo stile (cinquanta frasi) e le otto frasi fatte.

**7 novembre.** Il blocco H: le quindici voci della nave, disegnate con ElevenLabs, con la pausa fra una voce e
l’altra; tutte le 26 battute dell’Anziano; le 8 di Yusuf con la tua voce clonata; L.V. nella scatola nera della
serra. La beta.9: la revisione narrativa è chiusa. Poi la voce di servizio, «Kira», divisa in 41 parti (beta.10; hai
detto «capolavoro l’audio»). Il copione di William per Leonardo Tomassetti, un PDF di 111 pagine, e le tue quattro
decisioni: TSC-1972 si legge «millenovecentosettantadue», la firma è «W. T.», la riga del registro la legge il
computer di bordo, la frase delle fasce è corretta. Le quattro righe del computer di bordo sono nel gioco. Hai chiuso
con «Ok per ora ci fermiamo».

## 3. Com’è il gioco oggi

- **La storia.** Quattordici file di Favella1, circa 2.200 righe: 23 stanze, sei finali, in prima persona. I file
  sono di nuovo congelati: si toccano solo per una tua decisione.
- **Il motore**: Favella1 1.6.1.
- **L’app**, per Windows: i loghi, la dichiarazione, il menu, l’intro di 3:02, il gioco con i pulsanti o con i
  comandi scritti, il diario, sei posti di salvataggio più quello automatico, le Opzioni (Gioco, Grafica, Audio), il
  registro dei finali, i titoli di coda, l’aggiornamento automatico con la finestra delle novità.
- **Il suono** è tutto sintetizzato dal motore audio. **La musica**: 18 brani generati (12 con Lyria, 6 con Suno), il
  tema di Alirio Bruni nell’intro, il canto dell’Anziano.
- **Le voci**: L.V. («Elio»), l’Anziano (26 battute), Yusuf (8, la tua voce), le quindici voci della nave (27
  battute), la voce di servizio (45 parti, computer di bordo compreso). Manca soltanto William.
- **Le prove**: 16 partite di collaudo che arrivano ai sei finali, i pulsanti, i salvataggi, il diario, la
  tipografia, oltre cento prove del codice in Rust; i sei finali giocati anche nell’eseguibile vero.
- **La versione**: la 0.2.5-beta.10 è l’ultima pubblicata. Dopo, su GitHub ma in nessuna beta: la firma «W. T.», la
  frase delle fasce e il computer di bordo.

## 4. Una cosa trovata oggi: le prove su GitHub sono rosse

Gli ultimi due lavori del 7 novembre (le quattro decisioni del copione e il computer di bordo) hanno fatto fallire le
prove automatiche su GitHub. Il gioco non c’entra: la prova degli eventi del suono adesso usa lo strumento che taglia
la voce di servizio, e quello strumento ha bisogno di una libreria di calcolo (numpy) che sulla macchina di GitHub non
c’è. Sul mio computer c’è, e per questo non me ne sono accorto.

Conta per una ragione pratica: il flusso di rilascio fa le prove prima di costruire, e con le prove rosse **la beta
11 non si costruirebbe**. La correzione è piccola, un commit: la prova non deve caricare lo strumento intero. Nella
stessa pagina GitHub avvisa di due cambiamenti suoi (le azioni su Node 20 a riposo, il passaggio a Ubuntu 26): per
ora sono avvisi, non errori.

**Corretto lo stesso giorno**, alla tua risposta «Sì, correggile» (commit `b62dbaf`): la prova adesso prende i nomi
dei file da uno strumento leggero. Provata prima sul mio computer in un ambiente come quello di GitHub, poi su GitHub:
tutte le prove sono di nuovo verdi.

## 5. Che cosa resta da fare, in ordine

L’ordine è quello che hai deciso il 27 ottobre e il 3 novembre (prompt 31).

### Subito

1. **Le tue note sulle beta.** Nei documenti non ci sono tue note sulle beta giocate, dalla 5 alla 10: la prima
   persona, l’intro, la voce di L.V., la revisione narrativa, le voci, la voce di servizio. Insieme, che cosa resta da
   fare nell’intro.
2. **L’ascolto del computer di bordo**: la consegna è pronta, 49 secondi del finale «Vivi» con la riga del registro.
3. **La correzione delle prove** (§4).
4. **La beta 11**, con la firma, le fasce, il computer di bordo e quello che diranno le tue note.

### L’interfaccia (documento 30)

- I quattro momenti rimasti: il cartello d’atto che entra largo e si stringe; l’onda rossa quando scatta la
  protezione vitale; le crepe sul vetro nella fuga; la vignettatura dell’ipossia che stringe con il battito.
- Il lotto 3, le rifiniture: il pulsante che si abbassa quando lo premi; la sottolineatura dei nomi che cresce al
  passaggio del mouse; un piccolo radar sulla Santa Maria al posto della riga di testo; «continua» che respira; la
  riga del comando che si scrive come su un terminale.
- Due decisioni tue: E7, gli schermi 16:10 (le due fasce sopra e sotto come cornice voluta, oppure il gioco che
  cresce in altezza); E4, la modalità scritta che usa lo spazio che libera.

### L’intro

- Quello che «c’è ancora da fare»: non l’hai detto, e te lo chiedo prima di toccarla.
- I titoli di testa, «o altro».
- Se confermi, l’addio ai tre brani dell’intro di prima (I-B, I-E, I-G), che il tema di Alirio Bruni ha sostituito.

### Il finale

- Una schermata vera per i finali, invece della casella che scorre (E2): il testo a tutta altezza, il nome del finale
  come titolo, la riga del registro in fondo. L’hai chiamata «una eventuale finale»: si propone, e decidi tu.

### Il resto, dopo

- **Gli effetti e i suoni d’ambiente rifatti.** L’hai detto il 7 novembre: «ci penseremo più in là». Se ne parla
  quando lo riporti tu.
- **La colonna sonora ufficiale**: le tue sette idee del 19 ottobre (titoli nuovi ed eleganti, l’autore The
  Runtimers, l’album «The Silent Wreck Official Soundtrack», il modello che ha generato ogni brano, lo zip, la voce
  «Extra» nel menu, il testo dell’Anziano dal racconto). Prima domanda: il titolo esatto della raccolta, «Il Registro
  della Santa Maria» o «Dal Registro della Santa Maria», perché oggi si trovano tutti e due. Poi i titoli dei brani,
  lo zip dentro il gioco o su GitHub, la copertina dell’album.
- **Il marchio nel gioco**: il logo nel menu principale (E3), la regola delle due famiglie di immagini da scrivere
  (E8), la copertina (le decisioni D42, D43 e D44 del documento 24).
- **Il tema** (T-01 e T-02), da ricollegare nel gioco.
- **Il registro della musica**: per molti brani mancano i dati (il piano di Suno, i prompt usati).
- **ElevenLabs, rimandati per i crediti**: la canzone dei titoli di coda e gli effetti sonori. Il 4 dicembre arrivano
  30.000 crediti nuovi.
- **Il doppiaggio di William.** Il copione è pronto: 605 prese, circa 16.000 parole, circa due ore di audio finito,
  fra sei ore e mezza e nove ore e mezza di sala. Da fare: mandarlo a Leonardo, la registrazione, e il progetto di
  come la sua voce entra nel gioco, che non è ancora scritto da nessuna parte. Se cambia una frase del gioco, il
  copione si rigenera.
- **Linux** su una macchina vera: finché non è provato, resta fuori dai rilasci.
- **La partita intera giocata a mano**, e le prove nel gioco vero che dal 19 ottobre non risultano fatte: le cuffie
  collegate a metà partita, morire e annullare l’ultima mossa, chiudere con la X e riprendere, la modalità scritta con
  un lettore di schermo (NVDA).
- **La licenza della 1.0**: «in definizione» dal 31 ottobre.
- **I numeri di versione.** Siamo ancora alle beta della 0.2.5, mentre il piano andava dalla 0.3.0 alla 0.9.0, una
  per fase, prima della 1.0. Molte di quelle fasi sono fatte in parte; quando chiudere i numeri lo decidi tu.
- **Il primo rilascio pubblico, la 1.0**: su GitHub prenderà il posto della 1.5.3 del vecchio gioco come versione
  «Latest».
- **L’inglese, con la 1.1.** È deciso soltanto che in inglese si gioca a pulsanti; restano chi traduce, il titolo
  inglese, i nomi, le etichette, la tipografia e dove si sceglie la lingua (D29–D34 del documento 20).
- **Il Mistero della Santa Maria su Favella1**: parcheggiato dal 15 ottobre, senza fretta.

## 6. Che cosa aspetta te

Le note sulle beta; l’ascolto del computer di bordo; che cosa manca nell’intro, e i titoli di testa; l’addio ai tre
brani dell’intro di prima; il 16:10 e la modalità scritta; la schermata del finale; il titolo esatto della raccolta e
le altre scelte della colonna sonora; la copertina; quando mandare il copione a Leonardo; la licenza della 1.0; i
numeri di versione e il giorno della 1.0; le scelte dell’inglese. Gli effetti rifatti aspettano che ne parli tu.

## 7. Da dove ripartirei

Correggo le prove; tu ascolti il computer di bordo e mi dici le note sulle beta; poi preparo la beta 11. Dopo,
l’interfaccia, l’intro e il finale, nell’ordine che hai scelto.

## 8. Dove sono le cose

| Che cosa | Dove |
|---|---|
| il punto di partenza delle sessioni | `progettazione/31-prompt-prossima-sessione.md` |
| la revisione narrativa, i 37 punti e il registro | `progettazione/33-revisione-narrativa.md`, `34-schede-personaggi.md` |
| le voci | `progettazione/32-voci-lv-e-anziano.md`, `35-le-voci-non-william.md`, `audio/musica-ia/` (AN, NV, SV, YU, LV) |
| l’interfaccia viva, il lotto 3, E4 ed E7 | `progettazione/30-interfaccia-viva.md` |
| la revisione totale, E2, E3, E8 | `progettazione/25-revisione-totale.md` |
| l’intro | `progettazione/09-intro-storyboard.md` (§12, §13) |
| la colonna sonora ufficiale | `progettazione/28-prompt-prossima-sessione.md`, §1; `audio/musica-ia/REGISTRO.md` |
| la copertina, D42–D44 | `progettazione/24-copertina-e-logo.md` |
| la modalità a solo testo | `progettazione/18-modalita-solo-testo.md` (§8) |
| il Mistero su Favella1 | `progettazione/19-santa-maria-su-favella.md` |
| l’inglese, D29–D34 | `progettazione/20-traduzione-inglese.md` |
| le versioni, il rilascio, l’aggiornamento | `sviluppo/VERSIONI.md`, `CHANGELOG.md` |
| il copione di William | `doppiaggio/william/` |
| l’ascolto del computer di bordo | `consegne/Ascolto computer di bordo 2026-11-07/` |
| le prove rosse | `collaudo/eventi.py` (riga 160) importa `strumenti/audio/taglia_servizio.py`, che importa numpy; `prove.yml` non lo installa. Commit `34c936d` e `222f881` |
