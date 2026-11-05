# Stile G · proposta C: `vita.fav`, `echi.fav`, `equipaggio.fav`, `fuga.fav`

Scritta il 5 novembre 2026 per il blocco G della revisione narrativa (documento 33, §9, RN-G1–G6). È una **proposta**: nessun `.fav` è cambiato. Le righe sono quelle del testo al commit `82cb805`.

Per ogni voce, «Prima» è la stringa intera fra le virgolette del `.fav`, copiata dal file; «Dopo» è la stringa intera nuova. Con più righe, una stringa per riga, nell’ordine del titolo. Nelle stringhe la tipografia è quella dei `.fav` (apostrofo dritto, « », …); i `\n` sono quelli del file.

Nessuna frase è in una battuta registrata. Nei percorsi del collaudo (righe `# atteso`, etichette delle scelte) e in `ponte.py` (`SEGNI_A_SORTE`, `APPUNTI`, `SOSPESI`) il testo vecchio non è citato: compare soltanto nelle trascrizioni generate (`collaudo/trascrizione-*.txt`), che si rifanno con `trascrivi.py`.

## C-01 · echi.fav 33 · G5
Prima:
> Il Sintonizzatore scorre le frequenze e torna a zero: lì non è rimasta impressa nessuna voce. Le voci stanno nelle cose silenziose delle stanze dove è rimasta memoria.
Dopo:
> Il Sintonizzatore scorre le frequenze e torna a zero: lì non è rimasta impressa nessuna voce. Forse devo puntarlo su una cosa che qualcuno, a bordo, teneva vicino.
Perché: via la massima; resta l’informazione utile (le voci sono nelle cose), detta come un’ipotesi di William sul suo attrezzo. L’invito vero resta nella descrizione del Sintonizzatore (`tecnica.fav` 42, «SINTONIZZA le cose delle stanze silenziose»).
Dipendenze: nessuna.

## C-02 · echi.fav 71 · G1
Prima:
> Il Sintonizzatore non si spegne: scende di frequenza, e dal fondo viene su un secondo strato. IL NAVARCA, e stavolta non parla all'equipaggio, parla a se stesso: «Mi domando se qualcuno verrà. Non per salvarci: è impossibile da prima che io nascessi. Solo per vedere. Per sapere che siamo stati qui. Se sei tu che ascolti, da qualunque tempo tu venga: ho tenuto le luci accese fino all'ultimo respiro. Non contro il buio. Perché tu trovassi la strada.»
Dopo:
> Il Sintonizzatore non si spegne: scende di frequenza, e dal fondo viene su un secondo strato. IL NAVARCA, e stavolta non parla all'equipaggio, parla a se stesso: «Mi domando se qualcuno verrà. È tardi per salvarci, lo era già prima che io nascessi. Verrà per vedere, magari. Per sapere che siamo stati qui. Se sei tu che ascolti, da qualunque tempo tu venga: ho tenuto le luci accese fino all'ultimo respiro. Non contro il buio. Perché tu trovassi la strada.»
Perché: il Navarca in privato pensa ad alta voce: constata e spera, senza la cadenza «non X: Y»; così l’unica antitesi della battuta resta quella tenuta, «Non contro il buio. Perché tu trovassi la strada.»
Dipendenze: `collaudo/trascrizione-tutto.txt` 373 (trascrizione generata: si rigenera con `trascrivi.py`).

## C-03 · echi.fav 127 · G1
Prima:
> Sotto la voce dell'Ingegnere il Sintonizzatore aggancia un secondo strato: una voce più bassa, quasi un canto sottovoce.[se la connessione è avvenuta] È la stessa che nella gola di mezzo non si lasciava spegnere.[fine] «Li ho scritti tutti, qui sul banco. Ogni nome di chi è salito sulle navi, e ogni nome di chi è rimasto quaggiù con me a tenere fermo il campo. Non per la storia: la storia non verrà. Perché siano detti ad alta voce ancora una volta, finché c'è una voce che li dice. Allora li dico. Uno per uno. Piano. Finché la voce regge.»
Dopo:
> Sotto la voce dell'Ingegnere il Sintonizzatore aggancia un secondo strato: una voce più bassa, quasi un canto sottovoce.[se la connessione è avvenuta] È la stessa che nella gola di mezzo non si lasciava spegnere.[fine] «Li ho scritti tutti, qui sul banco. Ogni nome di chi è salito sulle navi, e ogni nome di chi è rimasto quaggiù con me a tenere fermo il campo. Dopo di noi non li leggerà nessuno. Vanno detti ad alta voce ancora una volta, finché c'è una voce che li dice. Allora li dico. Uno per uno. Piano. Finché la voce regge.»
Perché: l’ingegnere non crede che verrà qualcuno (il contrario del Navarca, di cui non ripete più la forma): li ha scritti sul banco, nessuno li leggerà, quindi vanno detti. «Vanno detti» è il suo registro di procedura; markup `[se …]…[fine]` intatto.
Dipendenze: `collaudo/trascrizione-tutto.txt` 513 (trascrizione generata).

## C-04 · equipaggio.fav 92 · G1
Prima:
> Non c'è nessuno: c'è una voce giovane, impressa nella culla, che il Sintonizzatore tiene agganciata. Fa sempre la stessa domanda.
Dopo:
> Soltanto una voce giovane, impressa nella culla, che il Sintonizzatore tiene agganciata. Fa sempre la stessa domanda.
Perché: «soltanto» dice già che nella culla non c’è nessuno, senza la negazione davanti.
Dipendenze: nessuna.

## C-05 · equipaggio.fav 96 · G2
Prima:
> «…perché non si muove… perché nessuno…» La domanda gira e ricomincia, uguale, come chi chiede e non aspetta più risposta.
Dopo:
> «…perché non si muove… perché nessuno…» La domanda gira e ricomincia, uguale, con una pausa breve fra un giro e l'altro.
Perché: «non aspetta risposta» lo dice già la sintonia (`echi.fav` 81); al suo posto un dettaglio di ascolto, la pausa, che è anche il posto dove William può rispondere (le tre scelte del nodo).
Dipendenze: `collaudo/trascrizione-tutto.txt` 628 (trascrizione generata).

## C-06 · equipaggio.fav 106 · G3
Prima:
> La domanda gira ancora una volta. «…perché non si muove…» Poi, per la prima volta, non ricomincia. Resta il fruscio della registrazione, e basta. Non so se mi ha sentito. Non so nemmeno se una registrazione può sentire.
Dopo:
> La domanda gira ancora una volta. «…perché non si muove…» Poi, per la prima volta, non ricomincia. Nella cuffia resta il fruscio della registrazione, che va avanti a vuoto. Non so se mi ha sentito. Non so nemmeno se una registrazione può sentire.
Perché: via la chiusa «e basta»: la registrazione che continua senza la domanda dice lo stesso vuoto con una cosa che si sente.
Dipendenze: `collaudo/trascrizione-tutto.txt` 636 (trascrizione generata).

## C-07 · fuga.fav 80 · G6
Prima:
> La gola di mezzo trema e si stringe, e le venature si accendono tutte insieme di un verde malato, come per l'ultima volta. Sopra, il vestibolo. Sotto, il groviglio.
Dopo:
> La gola di mezzo trema e si stringe, e le venature si accendono tutte insieme di un verde malato, che va e viene a scatti. Sopra, il vestibolo. Sotto, il groviglio.
Perché: «per l’ultima volta» resta soltanto in `fuga.fav` 42; qui la luce che va e viene a scatti mostra la nave che cede, senza dirlo.
Dipendenze: `collaudo/trascrizione-tutto.txt` 747 e `trascrizione-vivi.txt` 385 (trascrizioni generate). `SEGNI_A_SORTE["incrinature"]` in `ponte.py` cita `fuga.fav` 42, che non cambia.

## C-08 · fuga.fav 90 · G2
Prima:
> Il brusio, e sotto il brusio un ritmo, come qualcuno che legge.
Dopo:
> Il brusio, e sotto il brusio un ritmo lento, con la cadenza di un elenco.
Perché: via il secondo «come chi legge»: resta il legame con la voce dei nomi (`ingresso.fav` 252, «con la pazienza di chi legge un elenco»), detto con il suono e non con una persona.
Dipendenze: nessuna.

## C-09 · vita.fav 58 · G4
Prima:
> Una serra a cupola, vasta, con l'aria secca come carta. Felci scheletriche e funghi contorti pendono dalle pareti nella posa in cui sono morti, sotto uno strato di polvere che sembra neve grigia. Una vibrazione bassa attraversa la stanza, più nelle ossa che nell'aria. Al centro, sotto la cupola, qualcosa brilla di luce propria. Contro la base di una delle colonne spente che reggono la cupola, a mezzo metro da quella luce, è seduto un uomo in tuta. A nord si torna al corridoio; dietro i funghi, a ovest, si apre un passaggio più scuro.
Dopo:
> Una serra a cupola, vasta, con l'aria secca come carta. Felci scheletriche e funghi contorti pendono dalle pareti nella posa in cui sono morti, sotto uno strato di polvere che sembra neve grigia. Una vibrazione bassa attraversa la stanza, più nelle ossa che nell'aria. Al centro, sotto la cupola, pulsa piano una luce verde. Contro la base di una delle colonne spente che reggono la cupola, a mezzo metro da quella luce, è seduto un uomo in tuta. A nord si torna al corridoio; dietro i funghi, a ovest, si apre un passaggio più scuro.
Perché: via la luce di repertorio: il seme ha il colore del sistema (verde) e pulsa come pulserà da vicino (`vita.fav` 144, 157); resta il mistero, perché dalla soglia non dico che cos’è. «A mezzo metro da quella luce», subito dopo, regge ancora.
Dipendenze: `collaudo/trascrizione-tutto.txt` 235 e `trascrizione-vivi.txt` 150 (trascrizioni generate).

## C-10 · vita.fav 59 · G6 (e G4, per coerenza con la C-14)
Prima:
> La serra morta. Il campo di contenimento si è spento e il silenzio adesso è completo. Al centro, sul piedistallo, i resti della teca dissolta. Contro la colonna, a mezzo metro, l'uomo in tuta, il casco calato sul petto. A nord il corridoio; a ovest, dietro i funghi, il passaggio scuro.
Dopo:
> La serra morta. Il campo di contenimento si è spento e il silenzio adesso è completo. Al centro, sul piedistallo, la polvere della teca. Contro la colonna, l'uomo in tuta, il casco calato sul petto. A nord il corridoio; a ovest, dietro i funghi, il passaggio scuro.
Perché: via «a mezzo metro» dalla descrizione che si legge a ogni ritorno («mezzo metro» scende da 6 a 5: restano `relitto.fav` 34, `ponte.fav` 181, `vita.fav` 58 e 160, `finali.fav` 27); «teca dissolta» diventa «la polvere della teca», perché con la C-14 la teca non si dissolve più. Se la C-14 non passa, tenere qui «i resti della teca dissolta».
Dipendenze: `collaudo/trascrizione-tutto.txt` 278, 533, 555 e `trascrizione-vivi.txt` 182 (trascrizioni generate). Legata alla C-14.

## C-11 · vita.fav 84 · G6
Prima:
> Il multiscanner emette un tono lento.\nANALISI BIOMETRICA — specie: Homo sapiens. Età al decesso: trentacinque anni circa. Cause: anossia, ipotermia. Decesso stimato: centocinquant'anni fa, con lo stesso margine d'errore della giuntura.\nUn uomo, su una nave che nessun uomo ha costruito. Venuto fin qui da solo.
Dopo:
> Il multiscanner emette un tono lento.\nANALISI BIOMETRICA — specie: Homo sapiens. Età al decesso: trentacinque anni circa. Cause: anossia, ipotermia. Decesso stimato: centocinquant'anni fa, con lo stesso margine d'errore della giuntura.\nUn uomo, su una nave che nessun uomo ha costruito.
Perché: «da solo» in chiusa resta soltanto in «Da solo. Come me.» (`vita.fav` 62); la frase si toglie, senza sostituirla: la solitudine di L.V. la dicono già lo specchio e la giuntura (nessun’altra nave).
Dipendenze: nessuna.

## C-12 · vita.fav 99 · G6
Prima:
> ANALISI MANIFATTURA — origine terrestre, centocinquant'anni circa, modello fuori produzione. IDENTIFICAZIONE MISSIONE — logo: AURORA-7. Esplorazione in solitaria, non documentata negli archivi pubblici.\nDi una missione così, in centocinquant'anni, non è mai arrivata una parola.
Dopo:
> ANALISI MANIFATTURA — origine terrestre, centocinquant'anni circa, modello fuori produzione. IDENTIFICAZIONE MISSIONE — logo: AURORA-7. Esplorazione in solitaria, non documentata negli archivi pubblici.\nAURORA-7. Non l'ho mai sentita nominare.
Perché: il motivo resta alla giuntura (`ingresso.fav` 80); qui William legge il nome sul logo e dice soltanto che non lo conosce: lo stesso fatto, in piccolo e suo.
Dipendenze: nessuna.

## C-13 · vita.fav 112 · G6
Prima:
> Mi chino. La parola si ferma all'inizio di una lettera, un graffio che parte e non torna, come il glifo dello Scriba. Con la taglierina al minimo lo proseguo: O. L. I. Non siamo soli. La mia grafia è storta accanto alla sua, ma la frase adesso arriva in fondo.
Dopo:
> Mi chino. La parola si ferma all'inizio di una lettera, in un graffio rimasto a metà, come la punta dello Scriba sulla pietra. Con la taglierina al minimo lo proseguo: O. L. I. Non siamo soli. La mia grafia è storta accanto alla sua, ma la frase adesso arriva in fondo.
Perché: «parte e non torna» resta sulla placca (`vita.fav` 96), sulla lastra (`memoria.fav` 98) e nel Sintonizzatore (`echi.fav` 105); qui il legame con lo Scriba passa da quello che William ha sentito (la punta che «si interrompe sempre allo stesso punto, a metà del segno», `echi.fav` 105), e la riga 111 garantisce che l’ha sentito.
Dipendenze: `collaudo/trascrizione-tutto.txt` 560 (trascrizione generata).

## C-14 · vita.fav 145 e 151 · G4
Prima:
> La teca si è dissolta in pulviscolo di luce, e il seme fluttua libero sopra il piedistallo.
> Inserisco la tavoletta nell'incavo: si adatta. I simboli si accendono uno dopo l'altro, con un clic armonioso, e la teca si dissolve in un pulviscolo di luce. Il seme resta a fluttuare libero davanti a me. La vibrazione cessa di colpo, e la serra diventa silenziosa del tutto.
Dopo:
> Della teca resta una polvere fine sparsa sul piedistallo; sopra, il seme fluttua libero.
> Inserisco la tavoletta nell'incavo: si adatta. I simboli si accendono uno dopo l'altro, con un clic armonioso, e le pareti della teca si coprono di crepe e si sbriciolano in una polvere fine, che si posa sul piedistallo. Il seme resta a fluttuare libero davanti a me. La vibrazione cessa di colpo, e la serra diventa silenziosa del tutto.
Perché: la Grande Porta si dissolve in luce; la teca invece si incrina e cade in polvere, una cosa fisica. «Un velo di pulviscolo spento» (`vita.fav` 146, quando il seme è preso) resta com’è e torna: è quella polvere, opaca; «teca dissolta» in `vita.fav` 59 è nella C-10. Da confrontare con la riscrittura della Grande Porta (`relitto.fav` 183), perché non scelgano la stessa immagine.
Dipendenze: `collaudo/trascrizione-tutto.txt` 243 e `trascrizione-vivi.txt` 158 (trascrizioni generate). L’appunto `seme` in `APPUNTI` di `ponte.py` («La teca si è aperta. Il seme è vivo.») resta vero. Legata alla C-10.

## C-15 · vita.fav 148 · G6
Prima:
> Niente maniglie: solo l'incavo, che aspetta la sua chiave.
Dopo:
> Niente maniglie: solo l'incavo alla base, rettangolare, dove va la sua chiave.
Perché: via «aspetta» detto di un meccanismo; l’incavo dice dov’è e che forma ha, come nell’analisi (`vita.fav` 147, «forma rettangolare»).
Dipendenze: nessuna.

## C-16 · vita.fav 177 · G5
Prima:
> Punto lo scanner sulla capsula più vicina. Un bip lento.\nLETTURA: ‹FAUNA DEI TRE SOLI: GRANDE PASCOLATORE› — deceduto. Integrità genomica 0,02%. Provo con un'altra, e un'altra ancora: ‹FLORA DI XYLOS› — deceduto. ‹FORMA SILICEA: COSTRUTTORE› — deceduto.\nNon era una stiva: era un'arca. Un intero mondo, forse, conservato qui. E non c'è più.
Dopo:
> Punto lo scanner sulla capsula più vicina. Un bip lento.\nLETTURA: ‹FAUNA DEI TRE SOLI: GRANDE PASCOLATORE› — deceduto. Integrità genomica 0,02%. Provo con un'altra, e un'altra ancora: ‹FLORA DI XYLOS› — deceduto. ‹FORMA SILICEA: COSTRUTTORE› — deceduto.\nNon era una stiva: era un'arca. Lo scanner scrive «deceduto» su ogni capsula che inquadro, finché lo abbasso.
Perché: «Non era una stiva: era un’arca.» resta, intera e al suo posto; la coda solenne diventa un gesto: lo scanner che dice la stessa parola su tutte, e William che smette di guardare.
Dipendenze: nessuna.

## C-17 · vita.fav 196 · G6
Prima:
> Il cristallo è trasparente, adesso, e dentro una trama di filamenti luminosi pulsa come un cuore che ha ripreso a battere. È tiepido, e aspetta di essere inserito in qualcosa.
Dopo:
> Il cristallo è trasparente, adesso, e dentro una trama di filamenti luminosi pulsa come un cuore che ha ripreso a battere. È tiepido, e ha l'aria di un pezzo da montare in qualche macchina.
Perché: via «aspetta» detto del cristallo; William guarda da recuperatore, a pezzi di ricambio. `vita.fav` 197 («sembra fatto per essere inserito in qualcosa») non ha «aspettare» e resta: adesso le due frasi non si ripetono più.
Dipendenze: nessuna.

## Altro che ho notato

Fuori dalle decisioni, soltanto segnalati.

1. `echi.fav` 71, nella narrazione attorno al Navarca: «non si spegne: scende di frequenza» e «stavolta non parla all’equipaggio, parla a se stesso». Con la C-02 la battuta perde un’antitesi, ma la stringa ne tiene ancora due di William prima di quella tenuta del Navarca.
2. `vita.fav` 100: «Nessun alieno, nessun codice. Un uomo che voleva farsi capire.» È l’elenco negativo che prepara la rivelazione (due «nessuno», poi la frase vera).
3. `vita.fav` 180: «Non un nome: non saprei quale scrivere. Soltanto la prova che qualcuno è passato…» Una «non X: Y» sfuggita al conteggio del G1, nelle capsule.
4. `vita.fav` 196: «pulsa come un cuore che ha ripreso a battere». Similitudine di repertorio, nella stessa stringa della C-17.
5. `vita.fav` 197: «Con una certa esitazione accendo il dispositivo medico». «Una certa» è nel catalogo delle frasi fatte (antipattern, §12).
