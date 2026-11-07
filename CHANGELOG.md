# Registro delle modifiche

Le modifiche rilevanti al gioco e all’app, versione per versione. Formato
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); numeri di versione
[SemVer 2.0.0](https://semver.org/lang/it/) secondo le regole di
[`sviluppo/VERSIONI.md`](sviluppo/VERSIONI.md). Il *come* e il *perché* di ogni passo stanno nei
documenti di `progettazione/`.

## [Non rilasciato]

### Per chi gioca

- **L’Anziano parla.** La prima volta che lo incontri, prima delle parole, si sente il suo canto, la sua lingua; poi la sua voce, profonda e vicina, come dentro la testa. Dice con la sua voce tutto quello che dice.
- **La musica dell’Anziano è più bassa**, e sempre uguale anche mentre parla.
- **La Santa Maria è com’è nei racconti:** in plancia c’è una poltrona sola, in cuccetta una branda sola.
- **Il gioco dice meno ad alta voce.** William non si chiama più «un testimone», e l’Anziano non fa più la morale: del senso del viaggio resta una frase sola, la sua.
- **Le voci della nave sono persone.** Parlano meno a chi verrà e più di sé: c’è chi non voleva partire, chi ha sbagliato, chi ha scritto una speranza senza crederci.
- **L’Anziano ti ascolta, invece di spiegare.** Davanti a lui puoi fare dei gesti: mostrargli il sonaglio, accendere il Sintonizzatore, guardare la cifra dell’aria. E, se lo porti, posare il risuonatore: le voci tornano nella nave, e nella fuga le senti ancora.
- **Il congedo dell’Anziano è cambiato**, e lo dice con la sua voce.
- **Nell’arca della memoria la scelta la vedi sempre.** Con la corrente, l’ultimo pilastro si sveglia piano, una fascia alla volta, e la tuta paga la sua parte d’aria; la taglierina apre subito.
- **Nella fuga la voce dei nomi non te lo dice più:** se vuoi fermarti ad ascoltarla, lo decidi tu.
- **Yusuf ha una voce.** In plancia la senti dalla radio; nella fuga, mentre sei sullo scafo e corri verso il boccaporto, chiama su un canale che va e viene.
- **I finali non giudicano più.** Ognuno dice com’è andata, e basta.
- **Tradurre non costa niente finché la matrice non legge.** Sotto il 18% le traduzioni restano forme, e l’aria non scende; quando la matrice comincia a leggere, William te lo dice.
- **Le voci a due strati si fanno notare:** dopo la prima eco il Sintonizzatore resta agganciato più del dovuto.
- **«La prima nota» non dipende più dall’ordine:** se hai suonato il sonaglio, il re del reattore lo riconosci anche tornando in stiva.
- **Il diario di William.** Nel diario (D) due pagine nuove, scritte da lui: «Appunti», la storia fin qui, e «In sospeso», quello che lo ferma e quello che non ha ancora capito.
- **La tuta ti avvisa prima.** Quando l’aria scende al 40%, una riga sul visore ti ricorda che sotto il 30 la tuta non ti lascerà più ascoltare né tradurre. E sul Ponte, prima della porta tonda, l’avviso sulla strada del ritorno arriva prima: sotto il 55, non più sotto il 45.
- **Il testo è più asciutto.** William fa meno frasi a effetto e meno massime, e dice quello che vede. Le porte e le macchine non «aspettano» più, la Grande Porta si apre in un varco e la teca del seme si sbriciola.
- **Le voci della nave si sentono.** Quando il Sintonizzatore aggancia un’eco, parla chi c’era: quindici persone, ognuna con la sua voce, che entra un po’ metallica e in mezzo secondo si fa chiara. Lo scanner legge le registrazioni con la voce del traduttore, che migliora con la matrice; e dopo il congedo dell’Anziano si sente l’ultima voce, piena di vuoti.
- **Chi risponde aspetta il suo turno.** Nel corridoio e nelle gole fra una voce e l’altra c’è una pausa.
- **Il Piccolo smette quando glielo dici.** Se resti in silenzio, la domanda finisce il suo giro e, dopo una pausa, parla il Navarca; se gli dici che siete arrivati, la domanda gira un’ultima volta, a metà.
- **La voce di L.V. è un nastro vecchio** che si sta rovinando, una registrazione che nessuno doveva ascoltare: non più la radio della tuta.
- **Nella serra la scatola nera di L.V. si sente.** Quando innesti il cavo, dalla cuffia esce la sua voce, sul nastro rovinato, con i buchi dove il nastro non tiene più.

### Aggiunto

- **La scatola nera di L.V. nella serra, con la sua voce** (documento 35, V4 e §10). «Elio», la voce di Google dell’intro, generata il 7 novembre 2026 da Google AI Studio (Gemini 3.8 Flash TTS) sul copione con le parole del gioco, identiche, e le indicazioni di recitazione; il secondo pezzo viene da una seconda presa, perché nella prima la voce mangiava la «o» di «al medico ho detto». `strumenti/intro/voce_lv.py --serra` monta i quattro pezzi che il testo cita, tagliati nei silenzi, con i suoi due buchi («Un buco.», «Un buco più lungo.»: il nastro tace, resta poco fruscio, uno scatto ai due capi) e l’ultima frase «troppo piano», 16 dB sotto e più cupa; poi li passa dallo stesso nastro vecchio dell’intro (`audio/musica-ia/LV/LV-02-scatola-serra.mp3`, 1:25). Lo strumento ora ha la catena in una funzione sola: l’intro esce identica. Il ponte la manda con l’evento `voci` (`VOCI_LV`); il motore la fa uscire asciutta come Yusuf, 1,2 secondi dopo il cavo, e dell’evento «scatola_nera» resta soltanto lo scatto del cavo. Una prova nuova in Rust.
- **Tutte le voci dell’Anziano, e quella di Yusuf** (documento 33, RN-H1; documento 35, §8). L’Anziano dice con la sua voce («Edoardo Straniero», ElevenLabs eleven_v4) tutte e ventisei le varianti delle sue battute: le ventitré nuove e il congedo rifatto sul testo rivisto (`audio/musica-ia/AN/`, dalle prese del 7 novembre, tagliate ai due capi). Il ponte (`VOCI_ANZIANO`) le confronta parola per parola, senza la punteggiatura, e il collaudo prova tutte le combinazioni delle parti condizionali. Yusuf ha la voce dell’autore, clonata con ElevenLabs (Instant Voice Clone), in otto battute già passate dalla radio (`audio/musica-ia/YU/`, `strumenti/audio/voce_yusuf.py`): la radio di plancia nell’atto I, un canale instabile nella fuga. Il ponte le manda con l’evento `voci` (`VOCI_YUSUF`); il motore le fa uscire asciutte, sul cursore del parlato, mezzo secondo dopo lo schiocco della linea; una battuta nuova prende il posto di quella che parlava, e quando la linea si chiude la voce se ne va. Le battute dell’Anziano si caricano quando servono e a fine colloquio lasciano la memoria. Nel registro dei suoni (AN e YU, con le impronte), nei titoli di coda, nel file dei riconoscimenti e nella dichiarazione d’apertura; tre prove nuove in Rust.
- **Le voci della nave** (richiesta dell’autore del 7 novembre 2026, «dobbiamo creare TUTTE le voci che non sono William»; documento 35). Quindici voci disegnate con ElevenLabs (Voice Design, eleven_ttv_v3), ognuna con un nome, dalle schede del documento 34; le anteprime scelte sono le prese, approvate dall’autore («Vanno bene»). `strumenti/audio/voci_nave.py` le taglia nei silenzi in ventisette battute e le lavora (`audio/musica-ia/NV/`): l’aggancio del Sintonizzatore (la voce entra spostata di +70 Hz e scende al suo posto), il secondo strato dal basso, il traduttore dello scanner al 4, al 18 e al 75 % con un tic al posto di «(intraducibile)», l’Archivista pulita, l’ultima voce con i vuoti; e la metà della domanda del Piccolo, lo stesso suono tagliato nel silenzio. Il ponte (`ponte.py`, `VOCI_NAVE`) manda l’evento nuovo `voci` con le battute che sono a schermo, frammento per frammento, nell’ordine in cui ci stanno (le varianti più corte restano scritte); il collaudo degli eventi controlla che tutte e ventisette siano ancora nel gioco. Il motore audio ha un lettore loro (`voci_nave.rs`): al posto del filo sintetico, nella cuffia, sul cursore del parlato, allo stesso livello del filo (le battute si misurano sulle parole, non sui silenzi); in fila, la prima 1,6 secondi dopo l’eco, le altre dopo la fine della precedente e 1,4 secondi di pausa (l’autore, ascoltate: le voci che si rispondono stavano «troppo a ridosso della fine frase della voce precedente»). L’anello del Piccolo gira con la voce registrata; al nodo «taciuto» finisce il giro e parla il Navarca, al nodo «arrivati» un mezzo giro e basta; un giro non si taglia mai. Senza i file resta il filo di prima. Dieci prove nuove in Rust; `rendi_echi` manda anche l’evento `voci`. Nel registro dei suoni (`audio/LICENZE.md`, NV, con le impronte in `NV/IMPRONTE.sha256`), nei titoli di coda e nel file dei riconoscimenti.
- **Gli strumenti della taratura dell’aria** (documento 33, §12, RN-F1). Tre partite da principiante scritte a mano, senza attese (`collaudo/principiante-curioso.txt`, `principiante-frettoloso.txt`, `principiante-sperduto.txt`): dicono che cosa vuole fare chi gioca, e la cella e la ricarica le usa da sé `collaudo/aria.py`, come un principiante (la cella appena scatta la protezione vitale, poi la ricarica al generatore; all’avviso del Ponte va a ricaricare e passa; nella fuga si strappa al groviglio e, sotto il 20, usa la cella che gli resta). `aria.py` misura l’aria passo per passo: la stanza, la cifra, quanto cambia, la protezione vitale, le tre chiavi alla Grande Porta, dove si spende. `collaudo/verosimili.py` ricava dalle tre partite centinaia di partite diverse per sei caratteri (il curioso, chi vuole tutto, il medio, il maldestro, lo sperduto, il frettoloso): ogni voce, traduzione ed errore si fa oppure no, con le probabilità del carattere; nella fuga i passi sprecati, la deviazione nel vivaio e l’avviso ignorato, a due livelli (`--fuga 0.5`, `--fuga 1`). Dice quanti tornano vivi, con quanta aria, quanti arrivano alla porta sopra il 30, quanti con «La prima nota». Gioca su tutti i processori.
- **Il diario di William** (idea dell’autore del 4 novembre 2026; documento 33, RN-F7). Due pagine nuove nel diario dell’app, dopo la trascrizione, con il testo grande e tutto il mouse: «Appunti» («Fin qui»: una riga nella voce di William quando succede qualcosa che conta, con il luogo e il turno; venti appunti, dalla massa nera alla fuga) e «In sospeso» (quello che lo blocca, detto da lui, e quello che ha notato e non capisce, come domande; com’è dopo l’ultimo turno). Le scrive il ponte (`ponte.py`, `APPUNTI` e `SOSPESI`), leggendo lo stato del mondo a ogni turno: ogni voce della cronaca porta gli appunti nuovi e le cose in sospeso, e la cronaca ricostruita dopo un caricamento li ritrova uguali. Fra le cose in sospeso: la porta grande con i suoi tre incavi («Sono vuoti.», «Uno è pieno.», «Due sono pieni.»), la teca e la sua chiave, il generatore spento, «Il pilastro dell’archivio aspetta corrente, e il generatore è spento.» (D3), la porta tonda, l’aria sotto il trenta; e le domande: le tre tacche, la giuntura già tagliata, i soli del Piccolo, e le quattro voci a due strati («Sotto la voce dell’ingegnere ce n’è un’altra. Che cosa dice?», F6). Nella fuga una cosa sola: «Tornare alla Santa Maria, adesso.». Mai i gesti che contano (ascoltare, firmare, restituire le voci, restare). Le pagine si aprono quando hanno qualcosa, come le altre. Prove nuove: due nelle pagine (`prove/diario.test.ts`), e nel collaudo del diario gli appunti senza doppioni e le cose in sospeso alla fine di «tutto».
- **La voce e il canto dell’Anziano** (richiesta dell’autore del 1° e 2 novembre 2026; documento 32, §3). La voce è stata disegnata con ElevenLabs sulla descrizione approvata dall’autore («Edoardo Straniero», eleven_v4: la terza anteprima, scelta da lui per «il suo suono profondo quasi da subwoofer»); tre battute dalla seconda presa, intera, tagliate soltanto ai due capi (`audio/musica-ia/AN/AN-01-benvenuto.mp3`, `AN-02-piccolo-vera.mp3`, `AN-03-congedo-ascolto.mp3`). Il canto è di ElevenLabs Music v2.5 (`AN-00-canto.mp3`, 7 secondi; la prima di due versioni, «perfetta ed è incredibile»; non è in sol♯ come chiesto, ma su re e la). Il ponte (`ponte.py`, `VOCI_ANZIANO`) aggiunge agli eventi «dialogo» e «nodo» dell’Anziano il nome della battuta con la voce, solo se a schermo ci sono proprio quelle parole: il benvenuto con le echi o con il risuonatore, il Piccolo senza la risposta vera, il congedo senza l’ascolto restano scritti. Il motore audio suona la battuta con un lettore suo, sul cursore del parlato, asciutta, quattro decimi dopo il testo; se si passa al nodo dopo mentre parla, la battuta sfuma. Al primo contatto, una volta per partita, il canto suona da solo, il primo letto entra a quattro secondi mentre il canto sfuma, e la voce a 4,6, come nell’ascolto approvato (`consegne/Ascolto Anziano 2026-11-02/`); un caricamento nel mezzo del colloquio non canta e non parla. La voce è nel registro dei suoni (`audio/LICENZE.md`, AN), il canto in quello della musica; tutti e due nei titoli di coda e nel file dei riconoscimenti. Il collaudo degli eventi controlla che le tre battute siano ancora nel gioco, parola per parola; sui percorsi del collaudo il benvenuto parla in otto partite su dieci (nelle altre il giocatore ha già le echi o il risuonatore). Due prove nuove in Rust: il canto, il letto e la voce al primo contatto; il caricamento che non canta.

### Cambiato

- **La revisione narrativa, blocco A: le fondamenta** (decisioni dell’autore del 4 novembre 2026; documento 33, §9 e §11). La cronologia privata non si dice mai, ma il testo non la contraddice più: i «secoli» diventano un tempo senza misura («sistemi spenti da sempre», i macchinari che «si svegliano», il groviglio «cresciuto su se stesso per un tempo che lo scanner non sa datare», che preme verso il germinatoio «chissà da quanto»); il quinto, nel corridoio (`echi.fav` 41), si riscrive con il blocco B. La semina resta un dubbio: dall’Anziano (nodo «sangue») via «quella musica nuova», «nel tuo sangue», «la prima nota» e «molto prima che tu nascessi»; restano il seminare, il non saperlo e «Ma tu sei qui». Della morale detta resta soltanto «Restare è già una risposta. Pochi la danno.»: via «Non sono più uno scopritore. Sono un testimone.» alla matrice completa (il momento resta: «Per un momento leggo i loro glifi senza più accorgermi che sono glifi.»), via la massima del nodo «prezzo» («Tutti quelli che arrivano vengono a prendere. Qualcuno resta ad ascoltare.») e la chiusa del nodo «tracce» («Perché essere passati conta, anche quando non guarda nessuno.»). La Santa Maria come nei racconti e nelle immagini: una poltrona sola in plancia, una branda sola in cuccetta (via la branda di sopra, «omologata per un equipaggio di quattro» e «Yusuf la chiama incoscienza»); cambiano anche il percorso `prova-atti-I-II.txt`, le trascrizioni e la provenienza dell’immagine della cuccetta nei riconoscimenti. Le tre battute con la voce dell’Anziano non cambiano. Cambia l’impronta della storia: i salvataggi di prima si caricano «ricostruita», con l’avviso.
- **La revisione narrativa, blocco B: le voci della nave** (decisioni dell’autore del 4 novembre 2026; documento 33, §9, e le schede del documento 34). Ogni voce è una persona; la solennità resta ai testi pubblici, al Custode e all’Anziano. Nel corridoio la voce senza ruolo non annuncia più le tre chiavi: è chi non voleva partire («Io non volevo salire. Hanno letto il mio nome, e sono salito. A casa ho lasciato la finestra aperta…»), e il tecnico di bordo recita la sua formula «d’un fiato, come una formula imparata a memoria»; via anche l’ultimo «secoli». Lo xeno-botanico, nel profondo, ammette l’errore delle teche invece di consolare («Quelli delle teche li ho rovinati io… Sono miei.»). L’ufficiale di navigazione finisce su «Noi non ci saremo». Lo Scriba parla da artigiano («ogni solco è dritto. Le mie dita non lo sono più»), e la sua firma parla di sé e si ferma dove comincia il nome, come la placca di L.V. Il Custode, nel profondo, rivela di aver inciso da solo, di notte e senza crederci, l’ultima riga del fregio (al posto di «Ti ho aspettato… E tu, restando, hai risposto»). Dei messaggi a chi verrà ne restano cinque: via quello del cilindro, quello del fregio al 75% e quello dell’Archivista, che adesso dice soltanto di aver salvato una cosa sola (che cosa, lo dirà l’Anziano, con il blocco D). Le voci migliori (il capitano, il tecnico di carico, il medico, il Navarca, il Piccolo, l’ingegnere) restano come sono.
- **La revisione narrativa, blocco C: l’Anziano** (decisioni dell’autore del 4 novembre 2026; documento 33, §9, RN-C1–C5, con il D2 e il filo della colpa del D1). Dice soltanto quello che William non sa. «Chi eravate?» racconta la storia in breve a chi ha letto poco («Vivevamo sotto tre soli, e i tre soli si spegnevano…»), e a chi ha decifrato la Stele dice soltanto «La Stele dice che non piangemmo il nostro mondo.» (Una pausa.) «Piangemmo.». «Cosa ne è stato di voi?» non elenca più quello che William ha visto: reagisce all’archivio (con il fuoco la memoria è arrivata a pezzi, «Avevi fretta. I vivi ne hanno sempre.»; con la pazienza, intera, e l’Anziano dice la cosa sola che l’Archivista aveva salvato: la pioggia, «il rumore che faceva sui tetti di casa, sotto i tre soli») e alle voci ascoltate. Per L.V. dice che il groviglio sono «le cose che abbiamo sbagliato noi». Tre gesti al posto di tre domande: «[Mostra il sonaglio.]» (se William ce l’ha; le parole del Piccolo restano, con la voce), «[Accendi il Sintonizzatore.]» (il Sintonizzatore aggancia il canto sotto la sua voce: «Lo senti.»), «[Guarda la cifra dell’aria.]», che porta al congedo. Il congedo è un saluto e non una lezione: «Allora è ora. La nostra canzone è finita da tempo; a te resta del fiato.» (Una pausa.) «Vivi.». **Il risuonatore restituito:** nel benvenuto, se William lo porta, «[Posa il risuonatore.]» (nodo nuovo, «voci»): le voci lasciano l’arnese e si sentono una per una, l’Anziano tace, il risuonatore resta sulla nave, spento, e smette di bere aria. Nella fuga, nel vestibolo delle gole, accanto alla nicchia vuota le voci si sentono una per una, e una ripete «Deve.» (il tecnico di carico, se lo si è ascoltato nel corridoio); chi il risuonatore lo porta ancora lo sente tirare verso le pareti. «Vivi» e «Mani vuote» ne tengono una riga. Stati nuovi: il gesto del sonaglio, la restituzione. La musica da file del nodo «voci» è il primo letto, come il benvenuto (`musica.rs`). Corretta anche una seconda persona rimasta («appena lo tocchi» → «appena lo tocco»). Le battute con la voce: il benvenuto e il Piccolo non cambiano e suonano ancora; il congedo è cambiato, è uscito da `VOCI_ANZIANO` e resta scritto finché non si registra di nuovo (RN-C5). Nel collaudo le scelte nuove nei percorsi, e un percorso nuovo, `restituisci.txt` (il risuonatore posato, «Vivi»): i percorsi sono 15. Cambia l’impronta della storia: i salvataggi di prima si caricano «ricostruita», con l’avviso.
- **La revisione narrativa, blocco D: la struttura** (decisioni dell’autore del 4 novembre 2026; documento 33, §9, RN-D1–D4). I tre fili del D1 passano già per le voci scritte con i blocchi B e C, e il D2 è scritto con il C. **D3, la forza o la pazienza, per tutti:** senza corrente, la stanza dice che l’ultimo pilastro pulsa «come se aspettasse corrente; il terminale accanto è spento, e non ne ha»; con la corrente, il pilastro non si accende più di colpo all’ingresso, ma si sveglia dal basso, una fascia alla volta, finché William resta nell’arca: la prima fascia all’ingresso, poi tre turni, ognuno 2 d’aria che il terminale beve dalla tuta, «come il risuonatore» (contatore nuovo, «risveglio»; sotto 3 d’aria il pilastro aspetta). Lo dice il testo all’ingresso («Se resto, il pilastro salirà una fascia alla volta, e la tuta pagherà. Oppure la taglierina apre il bypass adesso.»), e lo ripetono le descrizioni del pilastro («ne sono accese [risveglio] su quattro») e del terminale. Il costo si tara con l’F1. **D4:** via «(Potresti fermarti ad ASCOLTARE LA VOCE.)» dalla voce dei nomi, che adesso dice nomi «senza fretta»; se William sale senza fermarsi, nel vestibolo «la voce dei nomi tace a metà di un nome» (stato nuovo della voce: ascoltata, taciuta). Nel collaudo i percorsi della pazienza aspettano tre turni nell’arca; «stiva al limite» prende il Nucleo con la taglierina, così arriva ancora con 2 d’aria; «tutto» risintonizza il generatore dopo la ricarica e usa la cella prima di rispondere al Piccolo, così ascolta ancora tutto. Cambia l’impronta della storia.
- **La revisione narrativa, blocco E: i finali** (decisioni dell’autore del 4 novembre 2026; documento 33, §9, RN-E1–E5). **E1:** in «La stiva piena» il risuonatore «continua a dire nomi», senza più «a nessuno», e il margine verde resta; in «Doppio fondo» via «cioè sempre» e «Per vent’anni nessuno lo saprà» (fra il Relitto e il Mistero passano tre anni, documento 33, §11), e il finale chiude sul seme: «Ogni tanto, quando sono solo, nella teca batte un poco di luce verde.». **E4:** Yusuf chiama durante la fuga, appena William è sullo scafo, sul canale della Santa Maria che la tuta aggancia dal boccaporto (stato nuovo, «la chiamata di Yusuf»): con la promessa del carico «William. Ce l’hai, il mio pezzo?» Aspetta. «William?»; senza, «William.» Una pausa, e dietro di lui il magazzino. «Niente. Volevo sapere se c’eri.», come William all’inizio. William non risponde: «Il fiato mi serve per arrivarci.». È una battuta da registrare con la voce dell’autore. **E5:** in «Due lettere», se a uccidere è il risuonatore, «Nella mano il brusio continua: le voci hanno bevuto anche l’ultima aria, e vanno avanti senza di me.». E2 ed E3 non chiedono testo: «Vivi» resta com’è, con il seme sul ripiano davanti alla poltrona, dove lo trova il secondo gioco. Nel collaudo, attese nuove in «Vivi», «La prima nota» e «Due lettere».
- **La revisione narrativa, blocco F, il testo** (decisioni dell’autore del 4 novembre 2026; documento 33, §9, RN-F2–F6; il diario, F7, e la taratura dell’aria, F1, vengono a parte). **F2:** sotto il 18% le cinque traduzioni (il bassorilievo, il globo, la lastra, la mappa, le tabelle) non costano più aria; al cilindro, quando la matrice arriva al 18%, William: «Adesso la matrice legge davvero. E leggere, come ascoltare, costa fiato.». **F3:** «La prima nota» si apre anche con la nota del solo sonaglio: rientrando in stiva, «Sotto il pavimento il reattore tiene il suo re, e per la prima volta lo sento: è lo stesso del sonaglio, nella cella del Piccolo.» (nel risveglio comune); le condizioni di «La prima nota» e di «Vivi» leggono «riconosciuta oppure sonaglio». **F4:** dall’eco della culla via il comando «(PARLA CON L’ECO.)», nelle tre righe che lo avevano (dopo la prima sintonia, alla seconda e nella descrizione dell’eco); l’invito resta nel testo. **F5:** nel bassorilievo «In basso, al margine, sotto una riga più piccola delle altre, resta un palmo di pietra nuda.»; nelle capsule «su nessuna c’è un segno, un nome, niente che dica chi c’è dentro». **F6:** dopo la prima eco delle quattro voci a due strati (lo xeno-botanico, il Navarca, il Custode, l’ingegnere), «Il Sintonizzatore resta agganciato più del dovuto, come se sotto ci fosse altro.». Nel collaudo un percorso nuovo, `prima-nota-in-stiva.txt` (senza ascoltare il reattore): i percorsi sono 16; «limite I3» prende il Nucleo con la taglierina, così muore ancora sullo scafo (con le traduzioni gratis la protezione vitale scatta più tardi, e si ascolta una voce in più).
- **La revisione narrativa, blocco F: la taratura dell’aria** (decisione dell’autore del 5 novembre 2026, «Oggi, più avvisi»; documento 33, §12, RN-F1). Misurata a tavolino su centinaia di partite verosimili per carattere, con la fuga giocata da principianti veri: più si ascolta, più si rischia (il curioso torna in due partite su tre o quattro su cinque, chi vuole tutto in una su due o meno, chi ascolta poco quasi sempre), e la regola del registro regge. I costi restano quelli di oggi; cambiano due avvisi. L’avviso prima della porta tonda (`ponte.fav`) scatta sotto il 55 invece che sotto il 45: si poteva uscire dal Ponte col 45% e morire sullo scafo senza un avviso (gli sperduti vivi salgono di venti punti). Un preavviso nuovo (`aria.fav`, stato «preavviso»), al 40%, prima della fuga e una volta sola: «[aria]. Sotto la cifra si accende una riga che conosco dal manuale: SOTTO 30, PROTEZIONE VITALE. Ancora poco, e la tuta non mi lascerà più ascoltare né tradurre.». Scartati, con le misure: la prima voce di ogni eco a 3 (tornano quasi tutti, e «ascoltare tutto» torna possibile), la fuga a 6 per turno (muore un curioso su cinque), la cella e la ricarica ridistribuite. Nell’app «SOTTO 30,» ha lo stile delle scritte dello schermo e «PROTEZIONE VITALE» il suo (`grammatica.ts`, con una prova). Nel collaudo «tutto» passa l’avviso del Ponte e controlla i due avvisi. Cambia l’impronta della storia.
- **La revisione narrativa, blocco G: lo stile** (decisioni e approvazione dell’autore del 5 novembre 2026; documento 33, §9, RN-G1–G6; le proposte, ogni frase prima e dopo, in `progettazione/stile-G/`). Cinquanta frasi riscritte in dieci `.fav`, scritte in tre sessioni parallele con le skill di prosa e armonizzate qui. **G1:** delle venticinque antitesi «non X: Y» ne restano otto («Non era una stiva: era un’arca.», «Non fu una fuga: fu una semina.», «Non numeri: nomi.», «Non contro il buio. Perché tu trovassi la strada.», «Non un archivio: una firma.», il silenzio del santuario centrale, L.V. «seccato, come le felci», «Non aggancia parole…»); le altre diciassette dicono lo stesso in modo diretto (fra queste il Navarca, «È tardi per salvarci, lo era già prima che io nascessi», e l’ingegnere, «Dopo di noi non li leggerà nessuno»). **G2:** tre «come chi» su sei, e via il doppione «come se aspettasse corrente» nel pilastro. **G3:** tre chiuse secche su sei. **G4:** via le luci di repertorio: la Grande Porta «si fa trasparente e sempre più sottile, finché al suo posto resta un varco aperto», la teca «si copre di crepe e si sbriciola in una polvere fine», la Stele «sollevata di un dito dal fondo senza niente che la regga». **G5:** via nove frasi solenni (fra queste «È la loro seconda morte, più totale della prima.» → «Di tutto questo non potrò leggere quasi niente.»). **G6:** «mezzo metro» da 6 a 5, «parte e non torna» da 5 a 3, «Da solo.» in chiusa da 3 a 1, «in centocinquant’anni non è mai arrivata una parola» una volta sola (alla placca: «AURORA-7. Non l’ho mai sentita nominare.»), «per l’ultima volta» una volta nella fuga, e l’«aspettare» tolto ai meccanismi (la Grande Porta, i suoi incavi, l’incavo della teca, le punte, il cristallo). Nessuna battuta registrata cambia; il collaudo, il suono, i menu, i pulsanti, il diario, i salvataggi e la tipografia sono verdi, e l’aria delle partite da principiante è la stessa. Rigenerate le trascrizioni. Cambia l’impronta della storia.
- **Le otto frasi fatte del blocco G** (approvazione dell’autore del 6 novembre 2026, una frase per volta; documento 33, §9). Le sessioni dello stile le avevano segnalate fuori dalle decisioni; adesso William dice quello che vede. I globi dello scriptorium sotto il 18%: via «È come voler bere da una cascata», al suo posto «e dietro ne arrivano altri cento». I pilastri dell’arca della memoria: le crepe non sono più «come ferite», ma «lungo le crepe il cristallo si è fatto bianco»; nell’analisi, via «polvere digitale» e «Di tutto questo non potrò leggere quasi niente», al loro posto «Ne resta una parola su centomila, e non so quale.». Il cristallo risvegliato non pulsa più «come un cuore che ha ripreso a battere»: «si accende e si spegne, sempre con lo stesso ritmo»; e il dispositivo medico si accende senza «una certa esitazione». Sul Ponte, al posto dell’«ondata di energia silenziosa», «Le postazioni si accendono una dopo l’altra lungo la sala, senza un suono». Il segno sulla capsula: via «Non un nome: non saprei quale scrivere», al suo posto «Un tratto corto. Dice soltanto che qualcuno è passato…». Le punte della porta tonda: via «Il numero dev’essere la chiave» (le chiavi del gioco sono le tre della Grande Porta), al suo posto «tutte uguali: l’unica cosa che può cambiare è quante ne premo». Nessuna battuta registrata cambia; il collaudo, il suono, i menu, i pulsanti, il diario, i salvataggi e la tipografia sono verdi. Rigenerate le trascrizioni. Cambia l’impronta della storia.
- **Una risonanza senza il Sintonizzatore non è un’eco.** La scatola nera di L.V. e il silenzio con il Piccolo fanno salire le risonanze anche loro: nella serra, dopo l’eco dello xeno-botanico, ascoltare la scatola nera faceva partire il suo secondo strato. Adesso il motore lo suona soltanto quando nel turno c’è il Sintonizzatore al lavoro (una prova in più).
- **La musica dell’Anziano, 5 dB più giù e fissa** (l’autore, 2 novembre 2026: «preferisco che abbassi un po’ la musica e che togli il ducking che fa troppo radio»): i letti da file a −5 dB, la musica sintetizzata di ripiego da +3 a −2 dB; nessun abbassamento sotto la voce.
- **La dichiarazione d’apertura e i titoli di coda** dicono anche ElevenLabs: «La musica è stata generata con l’intelligenza artificiale (Lyria 3.5 di Google, Suno ed ElevenLabs), scelta e diretta dall’autore; […] La voce di L.V. è stata generata con la sintesi vocale di Google, quelle dell’Anziano, di Yusuf (la voce dell’autore, clonata) e delle voci della nave con ElevenLabs; ogni altro suono del gioco è sintetizzato dal suo motore audio.»
- **La voce di L.V., un nastro che si rovina** (l’autore, 7 novembre 2026: «LV non lo ascolta William dal casco, è una registrazione che non ascolterà nessuno, si perde. Deve sembrare una cosa più sporca, come un vecchio nastro che si sta deteriorando»; approvata: «LV ora va bene»). `strumenti/intro/voce_lv.py` ha una catena nuova al posto della trasmittente leggera con il casco del 30 ottobre: la banda di un nastro vecchio (180 Hz–3,8 kHz, una gobba a 1,2 kHz), il trascinamento che non tiene il passo (una deriva lenta e un tremolio a 6,5 Hz), la saturazione dell’ossido, le cadute (ogni 3–7 secondi, più basse e più cupe, senza togliere parole), un fruscio basso e qualche crepitio. Le parole e i tempi sono gli stessi; rigenerati `LV-01-la-traccia.mp3` e l’inviluppo dell’intro (`intro/voce.ts`).

## [0.2.5-beta.8] - 2026-10-30

### Per chi gioca

- **L.V. ha una voce.** Nell’intro la sua ultima registrazione si sente: stanca, senza fiato, dalla radio della tuta, sopra una statica continua. Mentre parla, sullo schermo resta solo la scritta della scatola nera.
- **Le parole di L.V. sono nuove**, nell’intro e nella sua scatola nera: più semplici, più sue («Il numero dell’aria lo leggo sul visore e, prima di dirlo, l’ho già perso»).
- **Il tema della Santa Maria** accompagna l’intro da quando si apre lo spazio, e si abbassa quando L.V. parla; il suo cuore continua ancora un poco, lontano, dopo il buio.

### Aggiunto

- **La voce di L.V. nell’intro** (richiesta dell’autore, notte del 29 ottobre 2026: l’ha generata lui con la sintesi vocale di Google, sul copione con le pause e le indicazioni di recitazione preparate qui; documento 09, §13). La ripresa in uso è la seconda, del 30 ottobre, con la voce «Elio» e il testo rivisto; i pezzi lasciano fuori «lunga pausa» e «molta pausa», che il modello ha letto ad alta voce (le ho trovate con Whisper, e con Whisper ho controllato che nell’intro resa non ci siano più). Un file solo (`audio/musica-ia/LV/LV-01-la-traccia.mp3`), passato da una trasmittente leggera (`strumenti/intro/voce_lv.py`: banda 170 Hz–5,4 kHz dolce, un poco di presenza, il casco, una saturazione appena, un compressore lento che alza i respiri), che il motore audio suona a pezzi, uno per testo, sul cursore del parlato, con un lettore dei file suo (`mondo/intro.rs`). `VOCE` in `scaletta.ts` dice dove sta ogni frase nel file; l’intro segue la voce, respiri compresi (un blocco non comincia finché il pezzo di prima suona), e passa da 2:40,75 a 3:02,12 (la scena nera da 46 a 60 secondi). Quando la voce si sente, i testi di L.V. non compaiono e resta solo la scritta della scatola nera (l’autore, 30 ottobre 2026); senza voce (il parlato a zero, o la revisione nel browser) compaiono, e restano finché lui li ha detti. Il nastro della scatola nera in A si muove con la voce vera (il suo inviluppo, `app/src/intro/voce.ts`), e la spia si accende un poco di più quando L.V. parla. I respiri sintetizzati non ci sono più. La statica resta, ma continua e sempre uguale: i buchi della traccia (un quarto di secondo di silenzio fra le frasi) e il lento respiro del fruscio se ne sono andati, perché si sentivano come le cuciture di un file in loop (l’autore: «dobbiamo rendere tutto omogeneo»; una prova in Rust controlla che il fruscio non vari più di un decibel). Il cuore va avanti per cinque colpi dopo il passaggio allo spazio, sempre più lento e lontano. La voce è nel registro dei suoni (`audio/LICENZE.md`, eccezione voluta dall’autore) e nei titoli di coda.
- **Il tema della Santa Maria** («The Santa Maria Theme» di Alirio Bruni, la musica del menu del *Mistero della Santa Maria*, scelta dall’autore; non è musica generata): entra quando si apre lo spazio, tre decibel sotto la musica del gioco, si abbassa di otto mentre L.V. parla, e finisce con la sua coda lunga sotto il titolo (il gioco non ha musica nella prima scena in cui sfumarlo). Prende il posto del re che nel vuoto faceva da musica; il reattore resta nella plancia, più basso. Nel registro della musica e nei titoli di coda.

### Cambiato

- **Il testo di L.V., rivisto** (l’autore, 30 ottobre 2026: «Faccio fatica a pensare che le skill antipattern LLM e Humanizer non abbiano individuato il discorso del contare»; la terza eccezione al congelamento dei `.fav`). Riletto con stop-slop, humanizer e prosa-italiana: via la ripresa «L’aria la conto ancora, ma la conto male» con la spiegazione e la chiusa («e lo so cosa vuol dire»), il gioco «registra / Facciamo finta che registri», la chiusa «Ci tenevo tanto», lo specchio «La vedo pulsare. Non la so aprire» (dove «la» era la cosa viva, ma a non aprirsi è il vetro); nella scatola nera dell’atto III anche «ecco la verità», il «Il cavo.» ripetuto e «davvero». Il prologo nuovo, approvato dall’autore: «…la spia è verde. Allora registra, o almeno così dice. / L’acqua è finita ieri. Il riscaldamento stanotte. Il numero dell’aria lo leggo sul visore e, prima di dirlo, l’ho già perso. Lo rileggo: diciannove. / Ho firmato tutte le carte che servivano per partire da solo. Ho insistito io. / Qui dentro c’è una cosa viva. Sta dietro un vetro, a mezzo metro da me. La vedo pulsare, e quel vetro non lo so aprire.» Cambiano `relitto.fav` (il prologo), `vita.fav` (la scatola nera), `PROLOGO` in `scaletta.ts` e le trascrizioni; cambia l’impronta della storia, e i salvataggi di prima si caricano «ricostruita», con l’avviso.
- **La dichiarazione d’apertura** dice la verità sull’intro (l’autore, 30 ottobre 2026: la voce è della sintesi vocale di Google, il tema è di Alirio Bruni): «La musica è stata generata con l’intelligenza artificiale (Lyria 3.5 di Google e Suno), scelta e diretta dall’autore; il tema dell’intro è «The Santa Maria Theme» di Alirio Bruni. La voce di L.V. è stata generata con la sintesi vocale di Google; ogni altro suono del gioco è sintetizzato dal suo motore audio.» Nei titoli di coda il tema è di Alirio Bruni, dal *Mistero della Santa Maria*, fuori dalla musica generata.

## [0.2.5-beta.7] - 2026-10-29

### Per chi gioca

- **L’intro è nuova, come al cinema.** La plancia della Santa Maria si vede nitida e grande; il fuoco passa dal radar all’oblò, e nell’oblò le stelle si spengono una a una dietro la sagoma nera; il faro si accende, cerca e si perde nel buio. Il titolo si scrive con i glifi alieni, che la matrice traduce lettera per lettera. Alla fine la camera esce dal nero del fuso, arretra fino alla plancia intera e la porta nel visore: lì comincia la partita, senza stacchi.
- **La registrazione dell’inizio respira**: il nastro della scatola nera si muove con il fiato e con il cuore, e si interrompe dove la traccia è rovinata.

### Cambiato

- **Le scene definitive dell’intro** (richiesta dell’autore del 29 ottobre 2026: «portare a livello top questa intro», con «un tocco cinematografico»; documento 09, §12). La scaletta, i tempi, i testi e il suono restano quelli dello storyboard (2:40,75; le 92 prove dell’app verdi), e la musica che verrà si potrà scrivere sugli stessi tempi. **C, D e H** non sono più quadri fermi a 1.280 punti: c’è una plancia sola, `s_01_b` intera a 3.120 × 1.328, con il vetro dell’oblò bucato (`strumenti/intro/plancia_hd.py`), e una camera che si muove sopra (`app/src/intro/plancia.ts`). Dietro il vetro il motore della scala disegna dal vivo la vista fuori (un quadro nuovo, `plancia`, e un’ottica che mette il quadro nel vetro o lo ingrandisce: `scala.ts`). In C il cambio di fuoco è vero, dalla console alla parete, con l’obiettivo che «respira»; il radar è a fosforo, con la scia, gli echi, il settore muto e le scritte «CONTATTO · N.ID.» ed «ECO — —»; la spia rossa della prossimità batte una volta al secondo e getta luce sulla console; le quattro stelle che si spengono sono punti veri del bordo del fuso, cercati quando l’intro si prepara, e le copre il fuso, non un tempo. In D il relè del faro si accende sotto lo schermo, la lampada esita una volta e il fascio entra dal basso a destra, cerca di pochi gradi nella polvere e si perde; la camera si accosta piano all’oblò. **H** entra nel nero del fuso sopra la nave ed esce dal vetro dell’oblò; arretra fino alla plancia intera, che con le bande che si ritirano diventa la telecamera di bordo (la scritta «cam 01 · plancia · tsc-1972», le righe del monitor, la tinta della lente) e vola nella lente del visore, allo stesso pixel (controllato). La partita parte sotto l’intro (`Relitto.tsx`), e l’intro si apre sul gioco; saltata prima, la partita parte come sempre. L’interfaccia finta della fase dell’animatic non c’è più. **A** ha il nastro della scatola nera ai lati della spia, che scorre dal centro: il fruscio, il respiro di L.V. che si accorcia, i quattro colpi del cuore, e i buchi della traccia negli stessi istanti del suono; la voce dell’apparecchio si stampa lettera per lettera con il cursore, quella di L.V. viene a fuoco salendo appena. **G**: i glifi si tracciano come incisi, con l’alone; la matrice aggancia ognuno con quattro angoli prima di tradurlo, e la lettera nasce ciano e si raffredda nel bianco; il titolo intero prende aria e una luce lo attraversa una volta. Sopra la plancia c’è la grana della scheda «Grafica» (mossa, ferma o niente). Il movimento ridotto ha la sua versione di ogni scena nuova. Misurato nel browser di sviluppo: 60 fotogrammi al secondo fissi in C, D e H. Le immagini dei quadri fermi (`plancia-radar`, `plancia-oblo`, `plancia-faro`, `lente`) escono dal gioco; entrano `plancia-hd.webp` (519 kB) e `plancia-sfocata.webp` (30 kB), nel registro delle immagini. Nello sviluppo, `?nuova` porta dritti all’intro di una partita nuova e `&da=150` la fa partire da quel secondo.

## [0.2.5-beta.6] - 2026-10-29

### Per chi gioca

- **William racconta in prima persona.** Tutto il gioco, dalla Santa Maria ai finali, ora lo dice lui: «Lancio la scansione lunga», «Sono fuori», «Qualcuno è arrivato fin qui prima di me». I suggerimenti per chi gioca stanno fra parentesi, come «(ANALIZZALA.)», e restano pulsanti.
- **I salvataggi di prima si caricano lo stesso**, con l’avviso che la storia è cambiata.

### Cambiato

- **La prima persona** (decisione dell’autore del 29 ottobre 2026, pensando a una versione recitata: William ha la voce di Leonardo Tomassetti, che nel *Mistero della Santa Maria* legge già in prima persona anche le descrizioni dei luoghi). Prima l’atto I, come prova, poi tutti gli atti: circa 370 frasi in tutti i quattordici `.fav`, la seconda eccezione al congelamento del 16 ottobre. William racconta al presente, in prima persona («Regolo la taglierina», «Mi siedo sullo scafo nero»); ogni indizio che parla a chi gioca va fra parentesi, staccato dal racconto («Lo scanner saprebbe leggerla. (ANALIZZALA.)», «(Adesso puoi ACCOSTARE.)», «(STACCALO.)»), e i 41 suggerimenti in maiuscolo trovano ancora tutti il loro pulsante (`collaudo/menu.mjs`). Restano come erano le voci degli altri (Yusuf, l’Anziano, le echi, L.V., le traduzioni), le etichette delle scelte e i messaggi del motore («Puoi vedere qui», «Uscite», «Stai portando»), che sono la voce del gioco e non di William. Cambiano con il testo l’ultima frase dell’intro (la plancia, `intro/Intro.tsx`), l’inizio del crollo nella fuga che il ponte riconosce per il suo segno (`motore/ponte.py`: senza, il crollo sarebbe rimasto muto), sei attese dei percorsi di `collaudo/` e i commenti che citano il testo (`regia.rs`, `stanze.rs`, `atmosfere.ts`, `suggerimenti.ts`); le trascrizioni sono rigenerate. Tutti i collaudi sono verdi: i quattordici percorsi, i pulsanti, i menu, gli scritti, il suono (gli stessi 1.826 eventi), il diario, i salvataggi, la tipografia e le 92 prove dell’app. Cambia l’impronta della storia: i salvataggi di prima si caricano «ricostruita», con l’avviso.

## [0.2.5-beta.5] - 2026-10-27

### Per chi gioca

- **Le stanze si vedono.** Nel relitto il multiscanner disegna ogni stanza quando ci entri, e la scansione cambia con quello che fai (la nicchia vuota, la teca dissolta, il pilastro acceso o spento, la mappa sulla cupola del Ponte); sulla Santa Maria le telecamere di bordo mostrano la cuccetta, la stiva, la sala macchine e, da fuori, lo scafo.
- **Le novità, dopo ogni aggiornamento.** Quando il gioco si riapre con una versione nuova, il menu dice in poche righe che cosa è cambiato; e prima di scaricarla, la domanda «È uscita la versione…» dice che cosa porta.
- **I loghi d’apertura scorrono lisci**, senza fermarsi a metà.
- **Le scritte piccole sono cresciute**: nessuna sotto i 12 pixel, anche sugli schermi piccoli.
- **A gioco fermo il computer si riposa**: la scheda video lavora meno della metà di prima.
- **Il testo segue la finestra**: allargandola o stringendola, la risposta resta in vista.
- **Dopo la sospensione del computer** lo sfondo del menu torna com’era, invece di restare nero.
- **In una finestra, senza lampi**: con l’opzione «Schermo intero: no, in una finestra» il gioco si apre direttamente in finestra, invece di passare un attimo dallo schermo intero.
- **Se l’audio si rompe, il gioco va avanti**: senza suono, invece di chiudersi.
- **Il sottotitolo nuovo**: «Una storia tratta da Il Registro della Santa Maria», nel menu, nell’intro e nei titoli di coda.
- **L’aria non scende sotto lo zero**: quando la tuta resta senza fiato, il visore segna 0, come dice il testo, e non più un numero sotto lo zero. I salvataggi fatti prima si caricano lo stesso, con l’avviso che la storia è cambiata.
- **Lo schermo di gioco è più vivo**: una grana leggera come su un monitor di bordo, la luce della stanza che respira dietro il testo, un segnale che corre sul filo delle azioni, il riflesso del casco e, quando l’aria è poca, il fiato che appanna il vetro.
- **I passaggi si vedono**: entrando in una stanza il nome si posa e la telecamera di bordo cambia canale; una cosa presa scivola fra quelle che porti; la cellula dell’aria si contrae a ogni consumo e si allarga con una ricarica; dietro i pannelli il gioco si sfoca.
- **Una scheda «Grafica» nelle Opzioni**: tre livelli, piena, leggera ed essenziale, e ogni effetto acceso o spento a parte.
- **Le vene hanno sempre il colore della zona**: cambiando zona restavano del colore di prima, rosse anche dopo la fuga.

### Aggiunto

- **Le novità dopo un aggiornamento** (nota dell’autore del 19 ottobre 2026; revisione 25, L15, la seconda metà). Ogni versione del CHANGELOG ha ora una sezione **«Per chi gioca»**, la prima: poche righe semplici, per chi gioca e non per chi programma, che scrivo io (decisione dell’autore). La build le mette nel gioco (`strumenti/changelog.mjs`, `app/vite.config.ts`); al primo arrivo al menu con una versione diversa dall’ultima vista, una finestra le mostra (`app/src/menu/FinestraNovita.tsx`): quelle di tutte le versioni arrivate da allora, la più recente prima, con «chiudi» sempre in vista. Le mostrano anche le pre-release; chi installa da zero non vede niente (per lui non c’è niente di nuovo), e nemmeno chi torna a una versione più vecchia. La versione vista si ricorda nel browser dell’app (`relitto.versione-vista`). Le stesse righe vanno nel corpo della release (`node strumenti/versione.mjs corpo`, in `rilascio.yml`), e quindi nel `latest.json`: la domanda «È uscita la versione…» le mostra prima di scaricare. `verifica --rilascio` non lascia rilasciare una versione senza le sue righe. La finestra e la domanda, quando si aprono da sole, non cerchiano il primo pulsante (come il menu), e il gioco cerca un altro aggiornamento solo dopo che le novità sono state chiuse. Nello sviluppo, `?novita` mostra la finestra con le righe di «Non rilasciato», e `?aggiornamento-finto` la domanda con le stesse righe.
- **Le viste delle stanze nel visore** (revisione 25, E1; documento 06, §8; il piano lo ha deciso l’autore: «genera tu le stanze del relitto usando immaginazione, dettagli presi dalla storia e la qualità SVG che sai fare tu», e per la Santa Maria «puoi usare tranquillamente le location del sequel», 19 ottobre 2026). Prima la lente aveva una vista vera in una stanza su ventitré, la plancia. **Il relitto** ha ora diciotto scansioni del multiscanner, una per stanza, disegnate in codice (`app/src/gioco/visore/scansioni/`): ogni stanza è descritta in metri, dal punto in cui ci si entra, con quello che dice il testo del gioco (le tre gole del vestibolo e il risuonatore nella nicchia, le teche forzate e il groviglio, il germinatoio, la Grande Porta con il diagramma di stelle e le tre tacche, le bobine e il vano vuoto, la serra con il seme e l’uomo in tuta, le capsule di stasi coperte di brina, i bassorilievi dei tre soli, i globi di testo dello scriptorium, i pilastri dell’arca con l’ultimo che pulsa d’ambra, le alcove a nido d’ape con il Navarca, i cento soli del nido, la stella del Ponte, il buio dell’anticamera, l’Anziano di punti di luce). Una telecamera virtuale la proietta in nuvole di punti per righe di scansione, come un lidar, con le linee, le masse scure, i bagliori e le marche verdi sugli oggetti schedati. Diciassette varianti seguono lo stato della partita (`turno.suono.stati`). Entrando nella stanza il multiscanner la legge una volta, da sinistra a destra; poi la scansione resta ferma e a gioco fermo non costa niente (la ricostruzione di prima ridisegnava la lente trenta volte al secondo). Nella fuga trema, con la protezione vitale si abbassa, nell’ipossia si appanna; con il movimento ridotto compare intera. Ogni scansione ha una frase per il lettore di schermo. Disegnarne una costa al più 4 ms. **La Santa Maria** ha le scene canoniche del sequel nella telecamera di bordo: la cuccetta (`s_03`), la sala macchine (`s_05`) e, per la stiva, la sua poppa con il boccaporto e le tute (`s_10`: la stiva del sequel, `s_04`, ha pallet e casse, quella del Relitto è vuota da sei settimane). Lo scafo è la telecamera esterna, composta in codice come le copertine (`strumenti/viste/scafo.py`): la Santa Maria canonica davanti alla massa nera, legata dalle funi degli arpioni, con la luce gialla del boccaporto. Le immagini nuove sono nel registro (`grafica/LICENZE.md`) e nei riconoscimenti. Nello sviluppo, `?scansioni` mostra tutte le scansioni con le loro varianti (`?scansioni=teche&grande` una sola, larga). Tre prove in node: ogni stanza ha la sua vista; ogni variante si disegna dentro la cornice, sempre uguale e in fretta; gli stati cambiano il disegno, la chiave e la frase.
- **L’interfaccia viva, il primo lotto** (richiesta dell’autore del 27 ottobre 2026: «un rafforzamento importante della parte estetica, animazioni, effetti, lievissime pulsazioni»; documento 30). La grana (`gioco/Grana.tsx`: una tessera di rumore fatta una volta, su uno strato che si sposta a scatti con una trasformazione), il riflesso del vetro del casco e il fiato che lo appanna sotto il 30 %, la luce della stanza dietro la lamina, il segnale sul filo alto del ramo; l’arrivo in una stanza (il nome e la sua riga di luce, la telecamera di bordo che cambia canale, le righe del monitor, la spia della registrazione); la cellula dell’aria che si contrae e si allarga; i baccelli che si spostano dal posto di prima (FLIP) e quelli nuovi che germogliano lungo il filo; la sfocatura dietro i pannelli (revisione 25, E6), con i movimenti dietro fermi. Tutto dietro il movimento ridotto, che lo ferma.
- **La scheda «Grafica» nelle Opzioni** (decisione dell’autore del 27 ottobre: niente si toglie, «al massimo fai un pannello impostazioni per la grafica più evoluto»; documento 30, §8). Tre livelli (piena, di base; leggera; essenziale) e un interruttore per la grana, le vene, la luce della stanza, il segnale, i riflessi e la sfocatura (`stile/opzioni.ts`, `QUALITA`, `qualitaDi`; gli attributi `data-grana`, `data-riflessi`, `data-luce`, `data-segnale`, `data-sfocatura` sulla radice dello schermo).

### Cambiato

- **Il motore Favella1 1.6.1** (richieste dell’autore del 26 e del 27 ottobre 2026; documento 29). La copia in `motore/` è rifatta dal tag `v1.6.1` (prima 1.5.0), con gli stessi file; i `.fav` non cambiano, come deciso il 16 ottobre. Il Relitto gioca identico: 255 partite giocate con la 1.5.0 e con la 1.6.0 (i percorsi di collaudo e partite a caso dell’esploratore), 39.083 passi, con la stessa impronta e gli stessi pulsanti a ogni passo; il testo cambia solo nell’eco di un nome sconosciuto scritto a mano (`Non vedo 'cammello' qui.` invece di `Non vedo 'un cammello' qui.`). La 1.6.1 cambia dalla 1.6.0 una sola espressione regolare, che trova le stesse dichiarazioni. Nella modalità a solo testo il motore capisce anche i comandi con un numero («prendi 2 il faro di prua» vale «prendi il faro di prua»), e il verbo nuovo «consuma», che nei menu non compare. Tutti i collaudi sono verdi, anche nell’eseguibile vero, e con il solo cambio di motore i salvataggi fatti con il motore 1.5.0 si caricano identici, senza avviso (provato anche sui sei salvataggi veri dell’autore). Le frasi nuove della 1.6 (l’invariante `resta sempre fra`, i passaggi `senza ritorno`, le relazioni, le procedure, gli oggetti contabili) non sono usate, tranne l’invariante per l’aria, che l’autore ha voluto il 27 ottobre (sotto, in «Corretto»); il documento 29 dice dove servirebbero le altre. Il prezzo è all’avvio: dentro Pyodide la storia si compila in 0,80 secondi invece di 0,62, durante la dichiarazione. La 1.6.0 ne prendeva 0,93, per un difetto di Favella1 che la 1.6.1 corregge (la ricerca degli oggetti contabili ripartiva da ogni carattere del sorgente); il resto è il parser della grammatica 1.6, più grande, che si costruisce a ogni avvio.
- **Il codice del gioco più ordinato** (revisione 25, L13). La tastiera del gioco è uscita da `Gioco.tsx` in un modulo suo (`gioco/tastiera.ts`), com’era; le sonde delle prove (quella dei finali, la prova dei salvataggi nell’eseguibile, il percorso di collaudo dello sviluppo) in `gioco/sonde.ts`: `Gioco.tsx` passa da 916 a 755 righe. I numeri romani degli atti, che stavano copiati in quattro file, e i mesi, in due, sono scritti una volta sola (`lib/italiano.ts`). Il campionario del sistema visivo (`?campionario`) non entra più nelle versioni da pubblicare; la pagina di prova sì, perché le prove automatiche girano nell’eseguibile vero. La spia del ponte che riconosce le cose nominate da un comando scritto non dipende più dal nome di una funzione del motore scritto in una stringa: se il motore la rinominasse, il ponte non partirebbe invece di diventare cieco in silenzio, e `collaudo/scritti.py` ora controlla che un comando scritto a mano risolva la stessa cosa del suo pulsante (con la spia accecata apposta, la prova cade). Restano com’erano, apposta, i comandi del prototipo nel motore audio (`Ambiente`, `Nave`, `Rampa`, `Cammina`): li usano la pagina di prova del suono e le registrazioni.
- **Un errore nell’audio non chiude più il gioco** (decisione dell’autore, 19 ottobre 2026; revisione 25, M4). L’eseguibile di rilascio era costruito con `panic = "abort"`: un errore in un punto qualunque, anche nel thread dell’audio, chiudeva tutto il gioco. Ora è `panic = "unwind"`: se cade il thread dell’audio, cade solo lui e il gioco continua muto. Provato nell’eseguibile con una caduta finta del thread dell’audio a metà della prova dei sei finali (in una build di prova, non nel repository): con `abort` il gioco si chiudeva lì, con `unwind` ha finito i sei finali e i titoli di coda. Il prezzo: l’eseguibile passa da 12,7 a 16,7 MB, ma compresso, come si scarica, da 9,0 a 9,7 MB.
- **Il sottotitolo del gioco** (decisione dell’autore, 19 ottobre 2026; revisione 25, L6): era «dal racconto «Il Relitto», in Dal registro della Santa Maria», con la prima parte in corsivo e il titolo del libro in tondo, al contrario dell’uso italiano. L’autore l’ha riscritto: «Una storia tratta da *Il Registro della Santa Maria*», in tondo e con il titolo del libro in corsivo, nel menu, nei titoli di coda, nel cartello del titolo dell’intro (anche nella frase per il lettore di schermo), nell’elenco dei riconoscimenti e nelle copertine social (`strumenti/copertina/componi.py`, rigenerate). Il cartello del titolo resta fermo i suoi 6,55 secondi dello storyboard anche se il sottotitolo ha una parola in meno: l’intro dura sempre 2:40,75, e la sua musica, ancora da fare, si potrà scrivere sui tempi di sempre.

### Corretto

- **I loghi d’apertura non si inceppano più** (revisione 25, M1): il motore del gioco si carica finiti i loghi, durante la dichiarazione. Prima le sue chiamate sincrone fermavano l’immagine dei loghi per quasi un secondo; ora durante i loghi resta un solo blocco di 79 ms, quando si montano.
- **Nessun testo sotto i 12 px** (revisione 25, M3, E5 ed E10): a 1280 × 720 (uno schermo 1920 × 1080 al 150 %) i tasti delle uscite scendevano a 8,5 px, gli attrezzi a 10,4, le didascalie del visore a 10,5. Ora ogni testo che si legge o si tocca sta a 12 px almeno: il ramo è un po’ più grande e si stringe solo fin dove resta leggibile (se non basta, una voce in più va nel «+N»); le etichette dei gruppi del ramo sono nel maiuscoletto delle targhe, sempre sopra il filo (sotto il filo basso uscivano dallo schermo); le scritte di servizio del visore hanno una forma sola, nella membrana come nell’acciaio. Controllato giocando i sei finali a tre misure di finestra.
- **Il gioco fermo non fa più lavorare la scheda video come un videogioco d’azione** (revisione 25, M10). Misurato nell’eseguibile: nel relitto, a gioco fermo, la pagina usava il 46–50 % di un core e la scheda video il 42–53 %. Le vene, la lente, la cellula e l’oscilloscopio ora disegnano a 30 fotogrammi al secondo, il respiro della lamina va a scatti lenti, l’impulso della mappa ha uno strato suo: la pagina scende al 16–28 % di un core e la scheda video al 16–22 %, come nel menu.
- **La risposta resta in vista quando cambia la finestra** (revisione 25, L9): la lamina sceglieva dove scorrere solo al turno nuovo, e allargando o stringendo la finestra la risposta poteva restare tagliata. Ora l’ancora si rifà quando la lamina o il suo testo cambiano misura (`ResizeObserver`), finché chi gioca non fa scorrere a mano: allora il testo resta dove l’ha messo, fino al turno dopo. Provato nel browser dello sviluppo da 1280 × 720 a 1000 × 460.
- **Lo sfondo del menu sopravvive alla perdita del contesto WebGL** (revisione 25, L10): quando il sistema toglie la scheda video alla pagina (un driver aggiornato, il ritorno dalla sospensione) lo sfondo restava nero o fermo. Ora il menu chiede il contesto indietro e, quando torna, rifà la scena da capo (`menu/Sfondo.tsx`); l’intro, se lo perde a metà, si salta e si va al gioco, come senza WebGL2. Provato nel browser dello sviluppo con `WEBGL_lose_context`: perso e restituito, lo sfondo torna a disegnare le stelle.
- **La finestra nasce come la vuole l’opzione** (revisione 25, L8): con «Schermo intero: no, in una finestra» il gioco partiva comunque a schermo intero (lo diceva `tauri.conf.json`) e ne usciva quando la pagina leggeva l’opzione, un lampo a ogni avvio. Ora la pagina ricorda l’opzione anche al processo Tauri (`finestra.json`, nella cartella della configurazione), che crea la finestra già nella forma giusta, nascosta finché non l’ha presa: così sparisce anche la finestra normale che, a schermo intero, si vedeva per 60 ms prima di allargarsi. Senza il file, a schermo intero, come prima. Misurato da fuori con le API di Windows, nell’eseguibile: la prima finestra visibile è già 1616 × 939 in finestra, o 1920 × 1080 a schermo intero, e non cambia.
- **I comandi lenti fuori dal thread principale** (revisione 25, L12): aprire il dispositivo audio (`audio_mondo_avvia`, `audio_avvia`) e scrivere un rapporto giravano nel thread principale, e la finestra si fermava per quel tempo. Ora girano a parte, come i salvataggi; gli altri comandi dell’audio restano dove sono, apposta, perché sono brevi e devono arrivare nell’ordine in cui la pagina li manda (il gioco aspetta che il mondo sonoro sia partito prima di mandarne).
- **Il percorso della cartella di lavoro non è più nell’eseguibile** (revisione 25, L7): il gioco ci cercava la musica come ultimo ripiego, anche nelle versioni da pubblicare. Ora il ripiego c’è solo nello sviluppo, e nell’eseguibile il percorso non entra nemmeno (controllato: nessuna traccia della cartella del progetto). Restano i percorsi interni delle librerie di Rust, che nelle versioni costruite su GitHub sono quelli della macchina di GitHub e non dicono niente di nessuno.
- **Il nome del motore è «Favella1»** (decisione dell’autore, 19 ottobre 2026; revisione 25, L5): la dichiarazione all’avvio lo scriveva già così, e il motore stesso si chiama da sé «favella1»; il piede del menu, i titoli di coda, il file «Riconoscimenti e licenze.txt», le etichette dei loghi per il lettore di schermo, la scritta del caricamento e il README dicevano invece «FAVELLA 1». Ora dicono «Favella1» (nel piede del menu «Favella1 1.5.0»). La scritta disegnata del logo resta «FAVELLA1», com’è il marchio; la riga di copyright della licenza del motore, che dice «FAVELLA 1», la corregge `strumenti/riconoscimenti.py` come già correggeva il nome dell’autore. I documenti di progetto dei giorni scorsi restano come sono stati scritti.
- **Le venature non si fermano più quando la finestra misura zero** (trovato provando le scansioni): ridotto il gioco a icona, la tela delle venature misurava zero, il disegno dalla memoria lanciava un errore e il ciclo delle vene si fermava per sempre, fino alla schermata dopo. Ora con una tela vuota non si disegna niente, e il ciclo dei disegni chiede il fotogramma dopo prima di disegnare, così un errore non lo ferma più (`gioco/ritmo.ts`).
- **Le vene con il colore del clima** (documento 30, 1.1). Dalla revisione 25 (M10) le vene leggevano i colori dal CSS una volta per clima, proprio quando il CSS li stava cambiando: tenevano quelli di prima fino al clima dopo (ciano nel laboratorio invece che azzurre, rosse davanti all’Anziano dopo la fuga). Ora li prendono dalla tavolozza del clima e li mescolano nel tempo del passaggio, come il resto dello schermo.
- **Le animazioni lente a piccoli passi** (documento 30, §8). Il respiro della luce, del vetro e del fiato, l’impulso della mappa, il segnale e la luce dei suggerimenti andavano a 60 fotogrammi e facevano ricomporre lo schermo intero a ogni fotogramma; a passi di 10–30 al secondo (`steps()`), invisibili a quella lentezza, e con le animazioni che partono una volta lasciate libere quando finiscono (`backwards`), il gioco fermo nel relitto costa alla scheda video l’11–15 %, contro il 15–18 % di prima del lotto e il 37–40 % del lotto con le animazioni a 60 (misurato nell’eseguibile, 1920 × 1080). `strumenti/misure/consumo.mjs` ora spegne le cose sugli elementi: il `<style>` aggiunto alla pagina, nell’eseguibile, lo blocca la politica di sicurezza dei contenuti.
- **L’aria resta fra 0 e 100** (decisione dell’autore del 27 ottobre 2026; documento 29, §6.1 e §9). Nella fuga l’aria scende di 4 a turno, 8 con il risuonatore, e nel turno della morte andava sotto lo zero: nel percorso `limite-I3` la partita finiva con l’aria a −5, e il visore segnava −5 mentre il testo dice «La cifra sul visore è a zero». Ora `aria.fav` dice `L'aria resta sempre fra 0 e 100.`, l’invariante di Favella1 1.6, e le cinque conseguenze `e adesso l'aria resta fra 0 e 100` scritte a mano dopo le ricariche (la cella di riserva in `santamaria.fav`, la ricarica al generatore in `tecnica.fav`) sono tolte: il tetto lo tiene l’invariante. È la prima riga dei `.fav` cambiata dal congelamento del 16 ottobre. Sui 2.529 comandi dei file di `collaudo/` il testo è identico, e l’impronta cambia in due passi soli, la morte di `limite-I3` e il passo dopo (aria 0 invece di −5); la soglia della morte scatta come prima. Nelle 255 partite del documento 29 (39.083 passi, con le partite a caso dell’esploratore) testo e pulsanti sono identici a ogni passo; l’impronta cambia in 16 passi, tutti a partita finita per l’aria, con 0 invece di un numero fra −1 e −5. Tutti i collaudi sono verdi, anche nell’eseguibile vero; `collaudo/finali-menu.json` si riscrive identico. Cambia l’impronta della storia, quindi i salvataggi di prima si caricano «ricostruita», con l’avviso che la storia è cambiata: provato sui sei salvataggi veri dell’autore, tutti ricostruiti fino al loro turno.

### Sicurezza

- **Le dipendenze e le azioni fissate** (revisione 25, L14): `@tauri-apps/plugin-process` e `@tauri-apps/plugin-updater` avevano il `^`, unici fra le dipendenze dell’app: ora sono fissate alla versione del lockfile (2.4.0 e 2.14.0). Le azioni dei flussi di GitHub erano fissate al numero maggiore (`@v4`), che chi le pubblica può spostare: ora all’impronta del commit, con la versione in un commento (`actions/checkout` v4.4.0, `actions/setup-node` v4.4.0, `actions/setup-python` v5.6.0, `swatinem/rust-cache` v2.9.2, `tauri-apps/tauri-action` v0.6.2, `dtolnay/rust-toolchain` sul canale `stable`). Le dipendenze di Rust le fissa già `Cargo.lock`, nel repository.
- **I nomi dei rapporti delle prove** (revisione 25, L11): `scrivi_rapporto` rifiutava le barre e `..` ma non i due punti, che su Windows aprono `C:nome` e i flussi alternativi (`nome:flusso`). Ora un nome è `prova-` seguito solo da lettere, cifre, punti, trattini e trattini bassi, che esclude anche i nomi riservati di Windows (CON, NUL…). Una prova in Rust.

## [0.2.5-beta.4] - 2026-10-19

### Cambiato

- **Nessuna modifica al gioco.** Questa pre-release serve a vedere dal vero la barra dell’aggiornamento: una 0.2.5-beta.3 installata la scarica mostrando i megabyte, e poi si installa.

## [0.2.5-beta.3] - 2026-10-19

### Aggiunto

- **Si vede l’aggiornamento che scarica** (nota dell’autore dopo la prima prova riuscita dell’aggiornamento automatico, 19 ottobre 2026; revisione 25, L15). Prima, dopo «Aggiorna», un avviso spariva in tre secondi e si restava ad aspettare senza sapere niente. Ora un pannello sopra il menu dice la versione che arriva, riempie una barra con i megabyte scaricati («Scarico l’aggiornamento: 21,3 di 43,9 MB (48 %).») e poi dice «Scaricato. Installo: il gioco si chiude e si riapre da solo.»; se qualcosa va storto lo dice, e il gioco resta com’era. Prima di scaricare, la partita in corso va da sola nel posto automatico, e la domanda lo dice.

## [0.2.5-beta.2] - 2026-10-19

### Cambiato

- **Nessuna modifica al gioco.** Questa pre-release serve a provare l’aggiornamento automatico (`sviluppo/VERSIONI.md`, §7): una 0.2.5-beta.1 installata da GitHub deve trovarla nel canale di prova, scaricarla, controllarne la firma e installarla.

## [0.2.5-beta.1] - 2026-10-19

### Aggiunto

- **I titoli di coda** (decisione dell’autore, 19 ottobre 2026; `app/src/riconoscimenti/Titoli.tsx`). I riconoscimenti non sono più una schermata da sito all’avvio: scorrono alla fine, come al cinema, con la loro canzone, **«Voice in the Deep»** (Lyria 3.5, 2:58; generata dall’autore con lo stile e il testo in inglese del documento 22, §5.9: la solitudine, l’estinzione, il lasciare una traccia). Il nastro va con l’orologio della canzone: l’ultimo cartello arriva quando la voce canta da sola l’ultima riga, «A voice in the deep», a 2:40,5, resta fermo tre secondi, e poi tutto va lentamente nel nero (sette secondi) mentre la canzone sfuma con lui (`Brano::Titoli` e `Comando::Sfuma` nel motore audio). Partono dopo un finale, con il pulsante «Titoli di coda» accanto ad «Annulla l’ultima mossa», «Ricomincia» e «Carica», e dalla voce «Riconoscimenti» del menu; alla fine si torna al menu. Il titolo e l’autore; le fondamenta, la musica, i suoni, le immagini e i caratteri, con il ruolo a sinistra e il nome a destra; le librerie, soli nomi, in un blocco fitto; i marchi. L’ultimo cartello è il titolo e, in bianco, i marchi di Runtime Multimedia e di FAVELLA 1 (`app/src/loghi/Marchi.tsx`, le forme dei loghi d’apertura). «salta», Esc o Invio li chiudono (nel nero in poco più di un secondo); la rotella del mouse li porta avanti e indietro; con il movimento ridotto si mostrano a pagine, che durano quanto serve per arrivare all’ultima riga con la voce. La prova dei finali nell’eseguibile, dopo l’ultimo finale, li fa partire e li salta.
- **Il file «Riconoscimenti e licenze.txt» accanto al gioco**: le righe di copyright e i testi interi delle licenze, che prima stavano nella schermata, in un file di testo da leggere con il Blocco note, nell’installazione e nella versione portatile. Lo scrive `strumenti/riconoscimenti.py` insieme all’elenco, e `--verifica` controlla anche lui.

### Cambiato

- **All’avvio, i loghi e la dichiarazione**: i riconoscimenti non compaiono più prima del gioco (e il gioco non ricorda più quali nomi sono stati visti).
- **La dichiarazione impaginata per lo schermo largo** (nota dell’autore sulla 0.2.4: è un gioco da scrivania, niente impaginazioni da telefono): non è più una pila stretta al centro, ma una lastra orizzontale, con la vena a sinistra, il testo allineato a sinistra, e «Buon divertimento» e «continua» sulla stessa riga. Come nel menu, «continua» non ha più il contorno all’arrivo.

### Corretto

- **Il menu non cerchia più la prima voce all’avvio** (nota dell’autore sulla 0.2.4): arrivando al menu senza aver cliccato un pulsante (per esempio quando la dichiarazione passa da sola) «Continua» aveva già il contorno, e a chi gioca col mouse sembrava già scelta. Il fuoco resta sulla prima voce, così Invio la prende, ma il contorno compare solo alla prima freccia.

## [0.2.4] - 2026-10-19

### Aggiunto

- **Le copertine social** (16 ottobre 2026; `progettazione/24-copertina-e-logo.md`, §9): in cinque formati (16:9, 21:9, 9:16, poster 2:3, anteprima 2:1), composte in codice (`strumenti/copertina/componi.py`): il fuso nero che mangia le stelle, il seme verde, la Santa Maria canonica, il titolo con i caratteri del gioco. L'anteprima da 1280 × 640 è nel repository (`grafica/copertine/`), le altre si rigenerano.
- **La revisione totale** (18 ottobre 2026; `progettazione/25-revisione-totale.md`): le criticità del codice per gravità (nessuna gravissima, 5 gravi, 10 medie, 15 lievi), i difetti trovati giocando a cinque misure di schermo, e dieci proposte per l’estetica.

### Corretto

- **La pausa non porta più alla pagina delle misure tecniche** (revisione 25, G1): il pulsante c’era in ogni build, ricaricava la pagina e la partita in memoria si perdeva. Ora c’è solo nello sviluppo.
- **Il «chiudi» delle Opzioni è sempre in vista** (revisione 25, M2): il pannello era più alto dello schermo e il pulsante finiva sotto il bordo, senza barra per accorgersene. Le schede e il piede restano fermi e scorre solo il foglio, con una sfumatura e «continua ↓» quando c’è altro.
- **Annullare la mossa di un finale non spegne più il mondo** (revisione 25, G2): dopo la morte, «Annulla l’ultima mossa» lasciava suonare la musica della chiusura sopra la partita e poi il mondo taceva del tutto, con il fiato fermo. Il ponte manda adesso l’evento `ripresa` quando un ANNULLA accorcia la sequenza dei comandi, e la regia lo tratta come un caricamento; un caricamento rimette a posto anche il fiato dopo gli ultimi respiri, la radio della plancia, i fondi, il re toccato e il filo. Una prova in Rust, un ramo nuovo in `collaudo/eventi.py`.
- **Cambiare le cuffie a partita in corso non stona più la musica** (revisione 25, M4): se il dispositivo passava a un’altra frequenza (per esempio da 48 a 44,1 kHz), la musica dai file suonava l’8 % più lenta e un semitono e mezzo più bassa, e i filtri del mondo si spostavano. Il mondo sonoro resta alla frequenza con cui è nato e la sua uscita si ricampiona; un mondo nuovo nasce alla frequenza del dispositivo di quel momento. Una prova in Rust.
- **Il thread audio non tocca più il disco e non libera la musica** (revisione 25, M5): quando un brano partiva, il thread audio cercava il file sul disco e creava un thread; quando un pezzo usciva di memoria, liberava lì decine di megabyte. Su un disco lento o con l’antivirus erano buchi possibili proprio all’ingresso di un brano. Ora i file si cercano una volta, quando nasce la biblioteca della musica, e un solo thread di lavoro decodifica e libera; il lettore non alloca più nel suo passo. Tre prove in Rust.
- **L’aggiornamento automatico legge un canale fisso** (revisione 25, G3): chiedeva la release «Latest» di GitHub, che nel repository è la v1.5.3 del gioco originale; l’indirizzo dava 404, «Cerca aggiornamenti» rispondeva «serve la rete» anche con la rete, e le release del remake, con numeri più bassi, rischiavano di non essere mai viste. Ora il gioco legge la release fissa `aggiornamenti` (le build di una pre-release `aggiornamenti-prova`), dove il nuovo flusso `canale.yml` copia il `latest.json` quando l’autore pubblica una versione. I messaggi distinguono la rete assente, il canale ancora vuoto e la firma sbagliata.
- **Le prove girano su GitHub, e il rilascio parte solo a prove verdi** (revisione 25, G5): il nuovo flusso `prove.yml` lancia a ogni push su `main` (non per i soli documenti) le prove in Rust, le 14 partite nel motore audio, i riconoscimenti e le versioni su Windows, e le prove in node con tutti i collaudi del gioco su Linux. `rilascio.yml` le chiama prima di costruire. Linux esce dal rilascio finché l’autore non lo prova su una macchina vera e non accende la variabile del repository `LINUX_PROVATO`.
- **La chiave di firma degli aggiornamenti è nuova, con una password** (revisione 25, G4): quella del 16 ottobre non aveva password e stava in una copia sola. La chiave pubblica in `tauri.conf.json` è cambiata: le consegne di prova 0.2.2 e 0.2.3 non si aggiorneranno da sole.
- **Uscendo non si perde più la stanza in corso** (revisione 25, M6): chiudendo la finestra (la X, Alt+F4) o con «Esci» dal menu, la partita in corso va nel posto automatico, e «Continua» la riprende da lì; prima si salvava solo al cambio di stanza. Nelle versioni da pubblicare i tasti del browser non fanno più niente: F5 e Ctrl+R ricaricavano la pagina e perdevano la partita, Ctrl+P stampava, Ctrl+F cercava, Alt+← tornava indietro.
- **Gli errori hanno una via d’uscita** (revisione 25, M7): se il gioco si inceppa compare una schermata con una frase, «Riavvia il gioco» (che prima salva, se può) e il dettaglio tecnico ripiegato, da copiare; prima c’era la pila delle chiamate in rosso, senza pulsanti. Se il motore non parte, il menu lo dice e offre di riavviare, invece di restare per sempre su «importazione del motore…». Senza WebGL2 l’intro si salta e si va al gioco, invece di restare sul messaggio.
- **Un comando che cade non lascia la partita a metà** (revisione 25, M8): se qualcosa si rompeva durante un comando (un demone, il turno, il ponte), il clic non faceva niente, senza dirlo, e la partita poteva restare a metà. Ora il ponte fotografa la partita prima di ogni comando e, se cade, la rimette com’era; il gioco dice «Questo comando non è andato a buon fine: la partita è rimasta com’era.».
- **I salvataggi resistono di più** (revisione 25, M9): se in Documenti non si può scrivere (l’«Accesso controllato alle cartelle» di Windows) i salvataggi vanno nella cartella dei dati del gioco, invece di fallire a ogni cambio di stanza; ogni file si scrive davvero su disco prima di prendere il posto del vecchio; se OneDrive o l’antivirus tengono il file per un attimo si riprova; il posto automatico tiene la versione di prima, da cui si riparte se l’ultima si rovina. Le operazioni sui salvataggi non fermano più l’interfaccia.
- **I riconoscimenti di lark** (revisione 25, L2): sotto il copyright compariva una riga del testo della licenza MIT.
- **Testi** (revisione 25, L1, L3, L4): il refuso «un’ avventura» nelle opzioni; il README diceva «versione 0.2.0» e «niente comandi da scrivere»; nel registro delle modifiche la 0.2.2 aveva due sezioni «Aggiunto» e la 0.2.1 diceva che la musica generata non era ancora collegata.

## [0.2.3] - 2026-10-16

### Aggiunto

- **Il logo e l'icona dell'eseguibile** (16 ottobre 2026; `progettazione/24-copertina-e-logo.md`): un fuso nero che mangia le stelle, con il seme verde al centro, disegnato in codice (`strumenti/logo/disegna_logo.py`; master e vettoriale in `grafica/logo/`). **Sostituisce l'icona di Tauri** (i due cerchi giallo e azzurro) nell'eseguibile, nell'installer e nel collegamento; le icone dell'app sono rigenerate dal master con `tauri icon`.

## [0.2.2] - 2026-10-16

### Aggiunto

- **La modalità a solo testo** (16 ottobre 2026; `progettazione/18-modalita-solo-testo.md`, §8): nelle opzioni, «Comandi: con i pulsanti / scritti». Scritti, il gioco è un'avventura testuale pura: una riga di comando al posto del ramo (Invio, frecce su e giù per i comandi già dati, Esc), l'elenco, le risposte del dialogo e le domande del motore nel testo, e le parole dell'app (SALVA, CARICA, DIARIO, OPZIONI, MENU, TASTI, RICOMINCIA, AIUTO). Il ponte capisce i comandi scritti («x placca», «prendila», «staccalo») come quelli dei pulsanti, così il diario e il suono non perdono niente. Nuovo collaudo `collaudo/scritti.py` e `tipografia.mjs --solo-testo`; cinque prove in node.
- **L'aggiornamento automatico** (16 ottobre 2026; `sviluppo/VERSIONI.md`, §7): il gioco cerca una versione nuova nelle release su GitHub (all'avvio se l'opzione «Aggiornamenti» lo vuole, di base sì; a mano dal menu, «Cerca aggiornamenti»), lo dice e chiede; installa solo pacchetti **firmati** con la chiave dell'autore (chiave pubblica in `tauri.conf.json`). Il flusso di rilascio (`.github/workflows/rilascio.yml`) costruisce Windows e Linux su un tag `v` + versione e prepara una bozza di release con il suo `latest.json`. Non provato su GitHub finché non c'è il primo tag.
- **I riconoscimenti della musica** (16 ottobre 2026): la schermata «Riconoscimenti e licenze» ha una sezione «La musica» con i 17 brani generati (titolo, dove suona, Lyria 3.5 o Suno, licenza), ricavata da `audio/musica-ia/REGISTRO.md` da `strumenti/riconoscimenti.py`. Poiché aggiunge nomi, la schermata si rivede al primo avvio dopo l'aggiornamento. La **dichiarazione sull'IA** dice anche della musica (testo approvato dall'autore).

## [0.2.1] - 2026-10-16

### Aggiunto

- **Il suono dell'intro** (16 ottobre 2026; storyboard, §11): l'intro ha adesso la sua colonna sonora, sintetizzata nel
  motore e legata ai momenti dell'animatic (fruscio e buchi della traccia, clic della spia, respiro, cuore, re nel
  vuoto, reattore, radar, relè del faro, brusio dalla radio, glifi e lettere del titolo, console che parte). La musica
  vera (B, E, G) aspetta Lyria: i prompt sono nel documento 22, §5.8; intanto suona una guida del re. Quattro prove in
  Rust, una in node; `rendi_intro` rende l'intro su file e dice il livello di ogni scena.
- **Il mix d'autore e la console di regia** (16 ottobre 2026, dall'ascolto dell'autore; bibbia sonora, §12): i livelli
  relativi dei canali (fiato, ventola, re, macchine, stanza, corpo, bengala, colpi, brusio, echi, radio, pulsanti,
  musica) sono decisi dalla regia in `app/src/gioco/livelli.json`, un file solo per il motore e per la pagina, e si
  regolano ascoltando con **Ctrl+Maiusc+M** (la console, in qualunque schermata): uno strumento di sviluppo, presente solo nello sviluppo e nelle consegne di ascolto (`RELITTO_REGIA=1`), non nelle versioni da pubblicare. Di partenza il fiato scende di 10 dB, la
  ventola, le macchine e la stanza di 6, il re di 4. **L'interfaccia ha il suo cursore** («Interfaccia» nella scheda
  Audio) e non sta più sul canale degli effetti. Due prove in Rust.
- **Il lettore dei file di musica** (16 ottobre 2026; `progettazione/22-musica-con-lyria.md`, §10): il motore audio suona
  adesso i diciassette MP3 di `audio/musica-ia/`: il menu (due pezzi che si alternano), le soglie degli atti, i quattro
  letti dell'Anziano (uno per gruppo di nodi, incrociati al cambio di nodo, silenzio vero a «silenzio»), le chiusure dei
  finali. Ogni pezzo è portato allo stesso livello, passa dal cursore «Musica» e dalla pausa, non dalla sala (i file hanno il
  loro riverbero). Se un file manca suona la musica sintetizzata di prima. I file sono nelle risorse dell'installazione.
  Dieci prove in Rust più una sui file veri. **Da ascoltare nel gioco** prima di ogni integrazione sintetizzata.
- **La scheda «Audio» nelle opzioni** (16 ottobre 2026, richiesta dell’autore): le opzioni hanno due schede, «Gioco» e «Audio». In «Audio» tre cursori da mixer (0–100, anche con le frecce) — **Effetti** (tutto il suono del mondo), **Musica** e **Parlato** — più il volume generale, mono, dinamica e suoni intensi. Il parlato ha già il suo canale nel mixer in Rust (`Mix.parlato`), pronto per le voci che l’autore registrerà con il TTS di Google; per ora non ci passa niente. I vecchi cursori «Ambienti» e «Voci» non ci sono più: li muove tutti l’unico «Effetti». Una prova in Rust.
- **La licenza** (16 ottobre 2026, scelta dell’autore): **MIT per il codice** (`LICENSE`) e **CC BY-NC-SA 4.0 per
  la storia, i testi, le immagini e la musica**; la divisione precisa, le dipendenze di terzi, i loghi e la nota
  sull’intelligenza artificiale stanno in `LICENZE.md`. Vale anche per `old_version/`, dal commit che la introduce.
- **La musica generata** (`progettazione/22-musica-con-lyria.md`, `audio/musica-ia/`): i brani del menu, le soglie
  degli atti, i letti dell’Anziano, le chiusure dei finali e il tema, generati con Lyria 3.5 (Google Flow Music) e
  con Suno, in MP3, con il registro file per file. Li suona il lettore dei file di musica, qui sopra.
- **Il filo del Sintonizzatore** (bibbia sonora, §5.3 e §11.6): il flusso che si stacca dal brusio passa per uno
  spostamento di frequenza vero, a banda laterale unica (+60–90 Hz: il ritmo e l’intonazione restano, le
  parole no). Ogni eco ha la sua voce (l’Ingegnere urgente, le pareti del corridoio a quattro fili, il Capitano
  lento, l’Ufficiale medico piano, il Navarca tremante, il Custode grave…); il secondo strato è lo stesso filo,
  più grave e nudo, senza il coro; il Piccolo è un anello di quattro secondi che ricomincia uguale, e resta il
  fruscio quando smette; la lastra incisa non parla, graffia. Tredici prove in Rust; ascolto 15
  (`cargo run --release --example rendi_echi`).
- **La musica** (D14; `progettazione/21-la-musica.md`): scritta e generata nel motore audio, con i materiali del
  gioco (il re del reattore, il campo del sol♯ a un tritono, le voci tenute del brusio che cantano l’accordo del
  clic, il sonaglio, un tam-tam strofinato, il vetro del tema, il battito del seme). Suona il menu principale
  (quattro episodi in ordine sempre diverso, si ricompone da sola), la soglia dei cartelli d’atto dal secondo,
  l’Anziano nodo per nodo (dal sol♯ al re; per otto secondi, a «Resto ad ascoltare», niente) e la chiusura di cinque
  finali su sei (a «Mani vuote» il reattore, e basta). Ha la sua sala, il suo cursore nelle opzioni («Musica») e si
  abbassa nella pausa. Tredici prove in Rust; ascolti 14 (`cargo run --release --example rendi_musica`).
- **Il tocco dei pulsanti anche nel menu principale**, che ha adesso un suo mondo sonoro (sempre di membrana).
- **Il suono dei pulsanti** (bibbia sonora, §5.8 e §11.4): un tocco su ogni pulsante del gioco, diegetico e
  sotto i −24 dB. Sulla Santa Maria è acciaio (un interruttore che sceglie, un relè in due tempi che
  conferma, un relè che si apre e annulla); al primo contatto la membrana cresce in cinque secondi e il
  tocco si fa morbido e umido, con un filo vetroso dentro l’accordo del sol diesis; nella fuga ogni tocco
  strappa la membrana. La pagina dice solo il gesto (`app/src/gioco/tocco.ts`), il motore decide la voce
  dallo stato (`app/src-tauri/src/mondo/interfaccia.rs`). Otto prove in Rust, cinque in node, e l’ascolto
  `progettazione/ascolti/13-interfaccia.mp3` (`cargo run --release --example rendi_interfaccia`).
- **Il gioco suona** (bibbia sonora, §11): a ogni turno la partita manda al motore audio gli stati e gli
  eventi del ponte, e la regia in Rust fa le ventitré stanze (ognuna con la sua aria, il suo fondo e i
  suoi passi), le scene del mix, gli ottantacinque eventi e i finali. Il mondo sonoro si abbassa nella
  pausa e tace tornando al menu.
- Nelle opzioni, il suono: il volume, gli ambienti, gli effetti, le voci, il mono, la dinamica ridotta, i
  suoni intensi ridotti (bibbia, §2.5).
- `strumenti/audio/traccia.py` (le tracce sonore dei percorsi), gli esempi `prova_partite` (le quattordici
  partite giocate dal motore audio, con i loro controlli) e `rendi_partita` (una partita intera su file).
- **Il diario** (06, §4.6; D, la pausa o il pulsante in alto): la trascrizione di tutta la partita,
  con i cartelli degli atti; il fascicolo di chi è passato prima, che si compone da sé e prende il
  nome di L.V. solo dopo la placca; le voci ascoltate, da rileggere; le traduzioni, ognuna nella
  lettura fatta con la matrice più avanti, e i reperti. La cronaca la tiene il ponte, comando per
  comando, e dopo un caricamento la ricostruisce rigiocando (`rel_diario`, `cronaca` nel turno);
  le pagine le compone `app/src/gioco/diario/pagine.ts`. Il collaudo `collaudo/diario.py` e sette
  prove nuove.
- I pulsanti «diario» e «menu» sopra la lamina, per chi gioca con il mouse.
- **La pagina dei tasti**, nella pausa (06, §6.2): come si gioca senza mouse, in quattro gruppi
  (muoversi, le cose, il testo e le voci, la partita). Prima lo schermo mostrava i tasti delle uscite e
  dei pannelli, ma non che le cose si raggiungono con Tab e che Invio apre il fiore: l’autore, a mano,
  non aveva trovato come si gioca con la tastiera.
- **I loghi d’apertura** di Runtime Multimedia e di FAVELLA 1, animati e sonori, copiati pari pari dal
  Viaggiatore (`app/src/loghi/`), dopo un attimo di nero; Esc li salta. Con loro, i caratteri Sora e
  Inter (SIL OFL) nei riconoscimenti.
- **La dichiarazione d’apertura**: come è nato il gioco, a ogni avvio, sul fondo dei riconoscimenti.
- **Yusuf al comunicatore**: il suo ritratto del sequel nella vista del dialogo.
- L’opzione «Schermo intero», che si ricorda; F11 la cambia anche nel menu.
- **La prova dei finali nell’eseguibile** (`RELITTO_PROVA=finali`; `python strumenti/prova_eseguibile.py
  finali`): dal menu principale, l’intro saltata, poi i sei finali giocati cliccando nell’interfaccia vera
  ogni pulsante, che deve essere in vista; l’impronta finale deve essere quella del motore in CPython
  (`collaudo/finali-menu.json`, che scrive `collaudo/menu.mjs`), e i sei finali devono finire nel
  registro. Ogni pulsante del ramo, del fiore, del dialogo e della conferma dice nel DOM che cosa manda
  (`data-comando`, `data-avvia`).
- **Il menu principale** (06, §4.6): Continua (la partita in corso, o il salvataggio più recente),
  Nuova partita (con l’intro, che Esc salta), Carica, Opzioni, Registro dei finali, Riconoscimenti,
  Esci, sopra la scena finale dell’intro, viva e lentissima. Dalla pausa si torna al menu, e la partita
  resta (`rel_riprendi` nel ponte). Il motore comincia a caricarsi all’avvio, dietro.
- **Il registro dei finali**: sei righe del registro di bordo, con il nome del finale, la riga che il
  gioco scrive e la data; su disco accanto ai salvataggi (`registro_finali_leggi` e
  `registro_finali_scrivi` nel processo Tauri).
- **La schermata «Riconoscimenti e licenze»** (06, §18.3), al primo avvio e quando arrivano nomi nuovi,
  saltabile dopo tre secondi: il gioco, le fondamenta (FAVELLA, Pyodide, CPython, lark, Tauri, kira,
  React), i suoni, le immagini, i caratteri, le librerie della pagina e del programma con le loro righe
  di copyright, i testi delle licenze. La genera `strumenti/riconoscimenti.py` dalle fonti vere
  (`--verifica` controlla che non resti indietro); i testi delle licenze in `strumenti/licenze/`; il
  registro delle immagini nuovo, `grafica/LICENZE.md`.
- **Le fondamenta del sistema visivo** (fase 3): i quattro caratteri dentro l’app (Newsreader, IBM
  Plex Mono, Big Shoulders Stencil, Atkinson Hyperlegible Next; SIL OFL, dai pacchetti Fontsource,
  solo il sottoinsieme latino, 457 KB); le atmosfere come variabili CSS da un modulo solo
  (`app/src/stile/atmosfere.ts`): Santa Maria, visore, relitto con le sue zone, fuga, e la protezione
  vitale e l’ipossia sopra; la forma, acciaio fino al primo contatto e membrana dopo; i contrasti di
  ogni testo in 54 climi provati sopra 4,5:1 (`app/prove/atmosfere.test.ts`); il movimento ridotto
  come attributo unico della radice; le opzioni di chi gioca (movimento, carattere, testo grande); il
  campionario delle misure (`?campionario`).
- **La lamina del testo con la grammatica tipografica** (06, §4.1 e §4.2): il riconoscimento di ogni
  tipo di testo del gioco in TypeScript (`app/src/gioco/lamina/grammatica.ts`): la stanza, la prosa,
  le voci del relitto, la scatola nera di L.V. e il prologo, le letture dello scanner, il dialogo, la
  riga del registro dei finali, e dentro la prosa i suggerimenti (pulsanti), la protezione vitale, ciò
  che è scritto sugli schermi, le etichette, la matrice, gli intraducibili, le scritte a stampo e
  quelle graffiate, i nomi delle cose toccabili. Ogni blocco ricostruisce il testo del motore
  carattere per carattere; l’unica trasformazione è l’apostrofo tipografico, solo a schermo. Il
  collaudo `collaudo/tipografia.mjs` lo prova sui 14 percorsi (1.308 turni) e sulle 1.131 stringhe dei
  `.fav`. La lamina (`Lamina.tsx`): il comando sopra la risposta con il costo in aria, la rivelazione a
  righe che Spazio o un clic completano, il turno di prima spento sopra, l’acciaio e la membrana.
  La pagina del gioco in costruzione (`?gioco`).
- **Il ramo delle azioni e il fiore** (06, §4.7 e §6): i menu del modello d’azione su due fili, le
  uscite come bocche con il loro tasto, le cose come baccelli, le azioni in fondo; sotto, gli attrezzi
  della tuta e ciò che porti. Quando il filo alto non basta le cose in più scendono, e il «+N» resta
  per i casi in cui sono pieni tutti e due (il caso peggiore dei percorsi, 26 baccelli, ci sta). Il
  fiore di una cosa nella fascia fra il testo e il ramo, su due anelli: la base e i verbi dell’autore
  vicino, gli attrezzi fuori, con la nota dell’attrezzo o la stima dell’aria (D16). «Usa con…» in due
  tocchi con tutte le cose possibili accese; gli attrezzi in mano, con il mirino; i suggerimenti che
  accendono il loro pulsante per sei secondi; la tastiera del §6.2 (le uscite, i numeri delle
  risposte, Esc, le frecce dentro il fiore). La geometria è pura e provata (`app/prove/ramo.test.ts`).
- **Il visore** (06, §4.3, §4.4, §4.7): la lente (la telecamera di bordo sulla Santa Maria, la
  ricostruzione del multiscanner nel relitto, in attesa delle viste della fase 5); l’aria come anello
  graduato nell’acciaio e come cellula che respira nella membrana, con il segno del consumo che si
  dissolve; la matrice con i glifi che si accendono alle soglie, le voci come spore, i tre incavi
  delle chiavi; prima della tuta, la console di bordo. I contatori compaiono quando il ponte dice
  `mostra`. La mappa come costellazione delle stanze viste, orientata come la bussola del gioco, con
  i monconi delle uscite mai prese. Il cartello d’atto, la fascia della protezione vitale (con
  l’ascolto e la traduzione spenti e il motivo), il bordo del visore che respira, la vignettatura
  dell’ipossia, il tremito della fuga che non tocca mai il testo.
- **Il dialogo, la conferma, i salvataggi; la pagina del gioco** (06, §4.5 e §4.6). Il dialogo copre il
  palco: la vista grande (la figura di punti dell’Anziano, il comunicatore di Yusuf, l’onda dell’eco),
  chi parla, la battuta con le didascalie, le risposte come semi numerati. Il congedo dell’Anziano
  chiede conferma («Da qui non si torna.», D16); la conferma del motore ha la stessa forma, con S e N.
  I salvataggi su disco: sei posti più uno automatico a ogni cambio di stanza, scritti dal processo
  Tauri in Documenti/Il Relitto Silente (`src-tauri/src/salvataggi.rs`, con le sue prove), mostrati
  con il riassunto senza rigiocare; F5 salva, F9 carica. La pausa (Esc) con le opzioni, l’annullamento
  dell’ultima mossa, il ricominciare; F11 per lo schermo intero; alla fine della partita Ricomincia e
  Carica sono dell’app. La pagina del gioco è quella principale; la pagina di prova resta su `?prova`
  e per le prove automatiche (`RELITTO_PROVA`); `RELITTO_PROVA=salvataggi` prova i salvataggi
  nell’eseguibile vero e scrive un rapporto.
- **La crescita della membrana al primo contatto** (06, §3): le venature entrano dai bordi e crescono
  in cinque secondi intorno al testo e agli strumenti, con le zone vietate prese dalle misure vere
  dello schermo; prima dell’energia sono fioche, con l’energia si accendono; nella protezione vitale si
  spengono, nella fuga si lacerano e lampeggiano, nell’ipossia sbiadiscono. Con il movimento ridotto
  sono ferme e compaiono in dissolvenza. Il generatore della prova tecnica è passato al gioco
  (`app/src/gioco/vene/`), e la pagina di prova lo misura da lì.
- **Il documento della prima metà della fase 3** (`progettazione/14-fase-3-sistema-visivo.md`: che
  cosa c’è, le decisioni prese, le misure, che cosa resta) e il prompt della sessione dopo
  (`progettazione/15-prompt-prossima-sessione.md`).
- **L’animatic dell’intro** (`app/src/intro/`, §10 di `progettazione/09-intro-storyboard.md`): tutte
  le scene sulla scaletta di 2:40,75, calcolata con la regola di lettura e provata contro la tabella
  dello storyboard; il motore della scala in un modulo (la scena E definitiva, e il margine di B); i
  glifi del titolo; il radar, la spia rossa e le stelle che si spengono disegnati dal vivo sui quadri
  della plancia; il salto, il movimento ridotto scena per scena, i sottotitoli dei suoni; una barra di
  revisione (`?intro&revisione`).

### Cambiato

- **Il suono è tutto sintetizzato** (decisione dell’autore, 15 ottobre 2026; bibbia sonora, §10). Il
  motore audio in Rust non legge più nessun file: il re, la ventilazione, le pompe, la ventola della
  tuta, il fiato, le voci del brusio, le lamiere, i relè, gli stivali, gli arpioni, l’urto degli
  scafi, il gemito della nave, le gocce, i granelli, le crepe e il riverbero delle stanze nascono da
  modelli fisici, in tempo reale (sintesi modale, attrito a scatti, bolle di van den Doel, voci a
  formanti, una rete di ritardi per le stanze). I dodici campioni del prototipo e i 109 file lavorati
  sono usciti dal pacchetto, dal repository e dalla schermata dei riconoscimenti, che adesso dice che
  ogni suono è sintetizzato. Il mondo sonoro parte in 26 ms invece di un secondo, e senza 86 MB di
  campioni in memoria. La pagina di prova fa suonare i colpi uno per uno; `examples/misura_strati.rs`
  misura ogni generatore; `python strumenti/prova_eseguibile.py mondo` misura il suono
  nell’eseguibile.
- L’app parte a schermo intero, nel nero, con i loghi; il nome dell’autore nei riconoscimenti è Simone
  Pizzi; le risposte dei dialoghi stanno una sotto l’altra.
- L’app si apre sul menu principale (o sui riconoscimenti, al primo avvio), non più dentro la partita;
  `?gioco` porta ancora dritti al gioco, per lo sviluppo. Le opzioni sono una sola per tutta l’app, e
  l’intro prende da lì il movimento ridotto.
- **Il motore passa a FAVELLA 1.5.0** (ambito `motore`; `progettazione/16-favella-1-5-0.md`). La copia in
  `motore/` si rifà dal tag `v1.5.0` del repository FAVELLA1; i `.fav` non cambiano e il gioco gioca
  identico, con lo stesso testo e la stessa impronta a ogni passo. Il ponte lascia i suoi tre rimedi
  per l’interfaccia pubblica degli ospiti: `nuova_partita` (il punto di partenza dopo l’apertura, L18),
  `prova` (il ramo disfatto, senza più sedici campi di sessione copiati a mano, N4) e
  `mostra_situazione` (la stanza ridisegnata dopo un caricamento senza segnarla come vista, L19).
  L’impronta della storia cambia con il motore: un salvataggio della 0.2.0 si carica comunque
  identico, perché il ponte riconosce che è cambiato soltanto il motore (`sviluppo/VERSIONI.md`, §4).
- I suggerimenti riconoscono anche «se lo ANALIZZI» (il presente, seconda persona, con il pronome davanti): la
  proiezione del Ponte accende il suo Analizza.
- `collaudo/menu.mjs` prende il ponte in Node da `collaudo/ponte.mjs`, che usa anche il collaudo della
  tipografia.
- Il diario passa da Tab a D (06, §6.2): Tab resta al fuoco della tastiera.
- La pagina di prova della fase 1 non è più la pagina principale dell’app: si apre con `?prova`, e
  parte da sola con `RELITTO_PROVA`.

### Corretto

- Con la tastiera, dopo un comando scelto nel fiore il fuoco si perdeva e Tab ripartiva da «diario»: ora
  torna sulla cosa da cui il comando era partito, anche alla fine di un dialogo. «Usa con…» e un
  attrezzo in mano portano il fuoco sulla prima cosa accesa, ed Esc lo riporta sulla cosa di partenza.
  Spazio su una cosa, mentre il testo sta comparendo, lo completa invece di riaprire il fiore.
- Con «Usa con…», quando la seconda cosa stava dietro un «+N», il ramo leggeva un petalo che non c’era
  più e l’app intera si smontava (succedeva con «usa il disco con l’altare»). L’ha trovato la prova dei
  finali nell’eseguibile.

## [0.2.0] - 2026-10-14

### Aggiunto

- **Il prototipo del suono** (bibbia sonora, §8): dodici sorgenti CC0 e di pubblico dominio,
  registrate in `audio/LICENZE.md`; la catena che ne fa 109 suoni (`strumenti/audio/`); il mondo
  sonoro in Rust (`app/src-tauri/src/mondo/`) con le cinque strade, il re, il fiato guidato
  dall’aria e il brusio granulare; la sezione «Suono» della pagina di prova e la sua misura
  automatica; tre ascolti in `progettazione/ascolti/`.
- **Le decisioni delegate dall’autore** (06, §18): lo storyboard dell’intro approvato, la musica
  fatta con i materiali del gioco, le licenze in una schermata prima del gioco.
- **L’app, fase 2 (il ponte e il modello d’azione).** Il ponte completo per FAVELLA 1.4: per ogni
  turno gli eventi (con l’intestazione e il prologo a parte), i pulsanti, le cose in vista con le
  regole dell’autore e i loro effetti, lo stato del visore (l’atto, la mappa delle stanze viste, i
  contatori che compaiono quando servono), il comando scomposto. Il modello dei menu in TypeScript
  (`app/src/azione/`): i verbi di una cosa filtrati per regole, attrezzi e stato, le quattro azioni di
  situazione, i tasti delle uscite, i suggerimenti in maiuscolo che accendono il loro pulsante.
  Decisioni e misure in `progettazione/12-fase-2-ponte-e-modello.md`.
- **I salvataggi** a riprese: il file con il formato di `versione.json`, l’impronta della storia, il
  seme, un riassunto per i posti, la sequenza dei comandi; il caricamento che rigioca e dice se la
  partita è identica, ricostruita su una storia cambiata o diversa; i rifiuti dei file estranei, più
  recenti o danneggiati.
- **Gli stati e gli eventi per il suono** (bibbia sonora, §1.6 e §2.4): 51 stati, 84 tipi di evento
  trovati per differenza fra prima e dopo il turno, il finale riconosciuto per nome.
- **I collaudi dell’app**: `collaudo/menu.mjs` (i sei finali con i soli menu), `collaudo/salvataggi.py`
  (salva e ricarica in ogni stanza), `collaudo/eventi.py` (il suono), le prove del modello
  (`npm --prefix app run prove`).

### Cambiato

- I documenti di progettazione usano gli apostrofi tipografici anche nelle parti vecchie
  (`strumenti/apostrofi.py`).
- Il collaudo a pulsanti salta i comandi che non cambiano niente, nemmeno il turno («giù» dove non si
  scende), invece di giocarli con un altro comando a vuoto.
- La pagina di prova non ristampa il prologo sulla plancia, e salva e ricarica a metà del percorso.

### Corretto

- Un salvataggio fatto dopo la prima stanza si caricava «diverso»: il punto di partenza del motore
  precede la prima stanza mostrata. Il ponte lo fissa dopo l’apertura (lezione L18).
- Caricare segnava come vista la stanza in cui si era, e dopo la gola del ritorno l’impronta non
  tornava più. Il ponte mostra la stanza su un ramo, poi disfatto (lezione L19).

## [0.1.0] - 2026-10-14

### Aggiunto

- **Il gioco, rifatto.** Il remake de «Il Relitto Silente» in FAVELLA 1.4.4: 23 stanze, 93 oggetti,
  6 finali, quattordici moduli; rivisto e corretto (`progettazione/04-revisione.md`). Collaudo:
  14 percorsi con le loro attese, più la prova di ripresa di ogni oggetto.
- **L’app, fase 1 (la prova tecnica).** Tauri 2 con React 19 e TypeScript; il motore FAVELLA vero
  dentro Pyodide, con lark, senza rete; il ponte (`app/src/motore/ponte.py`) che per ogni turno
  restituisce eventi, pulsanti e stato degli strumenti; una schermata grezza che gioca la partita a
  soli pulsanti; l’audio in Rust con kira (il re del reattore sintetizzato, un campione in loop); le
  venature della membrana su canvas. Misure in `progettazione/08-fase-1-prova-tecnica.md`.
- **Il collaudo a pulsanti** (`collaudo/pulsanti.py`): i 14 percorsi giocati con i soli pulsanti del
  motore, attraverso lo stesso ponte dell’app.
- **Le versioni**: `versione.json`, `sviluppo/VERSIONI.md`, `strumenti/versione.mjs`, questo registro.
- **L’intro, storyboard 2** (`progettazione/09-intro-storyboard.md`): otto scene, 2:40, i testi fermi
  il tempo di leggerli. La tavola dei fotogrammi chiave e il quadro finito della scala in WebGL2
  (`09-intro-tavola.html`, `09-prova-di-look.html`); gli strumenti con cui sono fatti in
  `strumenti/intro/`. In attesa di approvazione.
- **La bibbia sonora** (`progettazione/10-bibbia-sonora.md`): le 23 stanze e gli eventi, le cinque
  strade del suono con la fisica del vuoto, il fiato, il brusio, le fonti e le licenze. Il registro
  delle licenze dei suoni (`audio/LICENZE.md`).
