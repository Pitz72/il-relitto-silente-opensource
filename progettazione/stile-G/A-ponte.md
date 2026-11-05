# Blocco G, lo stile: proposta A, il Ponte, il relitto, il corridoio e l’aria

Proposta di riscrittura per `ponte.fav`, `relitto.fav`, `corridoio.fav` e `aria.fav`, secondo le decisioni dell’autore
del 5 novembre 2026 (documento 33, §8 e §9, RN-G1–G6). Nessun `.fav` è stato toccato: la sessione principale
armonizza, mostra all’autore, poi applica.

Le righe «Prima» sono estratte a macchina dai `.fav` e sono esatte, byte per byte; le righe «Dopo» seguono la stessa
tipografia del file: apostrofo dritto ('), virgolette « », nessun trattino lungo aggiunto. Il resto di questo file
usa l’apostrofo curvo dei documenti di progettazione. I numeri di riga sono quelli di oggi (commit 82cb805).

Le trascrizioni `collaudo/trascrizione-*.txt` citate nelle dipendenze sono uscite di `collaudo/trascrivi.py`: dopo
l’applicazione si rigenerano, non si correggono a mano. Nessuna voce tocca una riga `# atteso`, un’etichetta di scelta
del collaudo, `APPUNTI`, `SOSPESI` o `VOCI_ANZIANO`.

## A-01 · aria.fav 68 · G1+G3
Prima (la stringa intera fra le virgolette del .fav, esatta):
> [aria]. La cifra è rossa. Adesso la tuta non mi protegge più da niente: mi tiene in vita, e basta.
Dopo (la stringa intera nuova):
> [aria]. La cifra è rossa. Da qui alla Santa Maria la tuta lavora soltanto per tenermi in vita.
Perché: via l’antitesi e la chiusa «e basta»: il fatto detto una volta, con la meta della fuga al posto della formula. Niente «PROTEZIONE VITALE», perché nella fuga la tuta non chiude canali (`aria.fav` 16, `relitto.fav` 55) e la scritta sembrerebbe vietare l’ascolto.
Dipendenze: collaudo/trascrizione-tutto.txt 759 (trascrizione generata da `collaudo/trascrivi.py`: si rigenera).

## A-02 · corridoio.fav 28 · G1
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Non sembrano costruite: sembrano cresciute, con una trama fine come d'osso o di madreperla. È da lì dentro che viene la luce azzurrina.
Dopo (la stringa intera nuova):
> Sembrano cresciute, con una trama fine come d'osso o di madreperla e nessuna giuntura in vista. È da lì dentro che viene la luce azzurrina.
Perché: si dice soltanto la Y («cresciute»); al posto di «non costruite» c’è la prova che lo fa pensare, nessuna giuntura. «Luce azzurrina» resta: è anche un nome dell’oggetto.
Dipendenze: nessuna.

## A-03 · corridoio.fav 36 · G2
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Tre tacche orizzontali, parallele, alla base della parete accanto all'imbocco. Troppo regolari per essere usura: qualcuno le ha fatte apposta, come fa chi segna i posti già visti per non perdersi.
Dopo (la stringa intera nuova):
> Tre tacche orizzontali, parallele, alla base della parete accanto all'imbocco. Troppo regolari per essere usura: qualcuno le ha fatte apposta, forse per segnare un posto già visto e non perdersi.
Perché: il fatto senza «come fa chi»; il «forse» tiene il tono d’ipotesi della similitudine, e l’Anziano più avanti dà alle tacche un’altra ragione (`ponte.fav` 204). L’invito dell’F5 resta: segnare un posto.
Dipendenze: nessuna nel collaudo né in `ponte.py` (la domanda del diario, «Tre tacche nel corridoio… Chi le ha fatte?», resta coerente). Solo un commento nel codice, non visibile, ripete la vecchia immagine: `app/src/gioco/visore/scansioni/stanze.ts` 477.

## A-04 · corridoio.fav 61 · G4
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Dove c'era la Grande Porta adesso c'è luce che si disperde: il passaggio a ovest è aperto sul Ponte.
Dopo (la stringa intera nuova):
> Dove c'era la Grande Porta adesso c'è un varco netto, senza stipiti: il passaggio a ovest dà sul Ponte.
Perché: via la luce di repertorio; resta quello che si vede dopo una porta che si è dissolta, un’apertura senza telaio. Si lega alla A-15, che finisce sul «varco aperto».
Dipendenze: nessuna (va applicata insieme alla A-15).

## A-05 · corridoio.fav 68 · G6
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Non ha maniglie né serrature: ha tre incavi, e aspetta quello che ci va dentro.
Dopo (la stringa intera nuova):
> Non ha maniglie né serrature. Si apre soltanto con quello che va nei tre incavi.
Perché: via l’«aspetta» del meccanismo e la mezza antitesi «non ha…: ha…»; l’indizio resta intero, la porta si apre con quello che va negli incavi.
Dipendenze: nessuna.

## A-06 · corridoio.fav 71 · G6
Prima (la stringa intera fra le virgolette del .fav, esatta):
> La Grande Porta è sigillata. I tre incavi alla sua base aspettano le loro chiavi.
Dopo (la stringa intera nuova):
> La Grande Porta è sigillata. Finché nei tre incavi alla sua base mancano le chiavi, di qui non passo.
Perché: via «aspettano»; la regola la dice William, in prima persona, e «mancano» vale anche quando uno o due incavi sono già pieni.
Dipendenze: nessuna.

## A-07 · ponte.fav 79 · G1
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Appoggio la mano guantata sulla depressione, e la console reagisce: non a chi sono, ma a quello che voglio. Un'ondata di energia silenziosa attraversa la sala, le postazioni si accendono, e la struttura centrale proietta sulla cupola una mappa stellare a tre dimensioni. La rotta è chiara, e il punto d'arrivo inconfondibile: il mio sole.
Dopo (la stringa intera nuova):
> Appoggio la mano guantata sulla depressione, e la console reagisce a quello che voglio, anche se non sono uno di loro. Un'ondata di energia silenziosa attraversa la sala, le postazioni si accendono, e la struttura centrale proietta sulla cupola una mappa stellare a tre dimensioni. La rotta è chiara, e il punto d'arrivo inconfondibile: il mio sole.
Perché: «non a chi sono, ma a quello che voglio» detto diritto: la console obbedisce a uno che non è dei loro. Il resto della stringa è identico.
Dipendenze: collaudo/trascrizione-tutto.txt 590 e collaudo/trascrizione-vivi.txt 308 (generate: si rigenerano).

## A-08 · ponte.fav 89 · G6
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Le punte aspettano un numero preciso, e non so quale. Da qualche parte, sulla nave, ci sarà un indizio.
Dopo (la stringa intera nuova):
> Devo premere un numero preciso di punte, e non so quale. Da qualche parte, sulla nave, ci sarà un indizio.
Perché: via «Le punte aspettano»: il numero lo deve trovare William. La seconda frase resta.
Dipendenze: la stessa stringa, identica, è anche a `ponte.fav` 93 (PREMI le punte, accanto a TOCCA): vanno cambiate tutte e due, 2 occorrenze. Nel collaudo e in `ponte.py` niente.

## A-09 · ponte.fav 106 · G1
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Il passaggio si stringe. Le pareti non fanno più luce: qui è tutto scuro, di un buio che assorbe invece di mancare. I miei passi non fanno rumore, e non so se è il pavimento o se ho smesso di farne io. Davanti, a ovest, una soglia aperta.
Dopo (la stringa intera nuova):
> Il passaggio si stringe. Le pareti non fanno più luce: qui è tutto scuro, di un buio denso che assorbe ogni riflesso. I miei passi non fanno rumore, e non so se è il pavimento o se ho smesso di farne io. Davanti, a ovest, una soglia aperta.
Perché: via «invece di mancare»: resta la Y, un buio che assorbe, con un oggetto concreto (i riflessi). Il faro lo tiene la A-10, così le due stringhe della stanza non dicono la stessa cosa.
Dipendenze: collaudo/trascrizione-tutto.txt 675 e collaudo/trascrizione-vivi.txt 320 (generate: si rigenerano).

## A-10 · ponte.fav 113 · G1
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Non è assenza di luce: è qualcosa che la beve. Le pareti si avvicinano verso il centro, come una strozzatura. Uno spazio fatto per essere attraversato, non visitato.
Dopo (la stringa intera nuova):
> Il buio beve anche la luce del faro, che qui arriva a pochi passi. Le pareti si avvicinano verso il centro, come una strozzatura, e lasciano lo spazio appena per passare.
Perché: le due antitesi diventano fatti: il buio beve la luce (resta il verbo, senza «non è assenza»), e «attraversato, non visitato» diventa uno spazio che basta appena per passare. Il faro arriva «a pochi passi», così le pareti si vedono ancora.
Dipendenze: nessuna.

## A-11 · ponte.fav 135 · G1
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Una proiezione di uno di loro, ma più vecchio del Navarca, con paramenti da cerimonia e un'espressione di calma profonda. Non minaccia: aspetta. (PARLA CON L'ANZIANO.)
Dopo (la stringa intera nuova):
> Una proiezione di uno di loro, ma più vecchio del Navarca, con paramenti da cerimonia e un'espressione di calma profonda. Tace, e lascia a me la prima parola. (PARLA CON L'ANZIANO.)
Perché: via «Non minaccia: aspetta»; la calma dice già che non minaccia, e «lascia a me la prima parola» porta al suggerimento, che resta identico. Niente «aspetta», che la descrizione della stanza usa già (`ponte.fav` 121, frase tenuta).
Dipendenze: nessuna (le battute registrate dell’Anziano non c’entrano: questa è la descrizione).

## A-12 · relitto.fav 93 · G5
Prima (la stringa intera fra le virgolette del .fav, esatta):
> [se l'ingresso è richiuso]Passo il guanto, piano: su questa nave quasi tutto chiede di essere sfiorato con rispetto. Non succede niente.[altrimenti]Sfioro appena. Non succede niente.[fine]
Dopo (la stringa intera nuova):
> [se l'ingresso è richiuso]Passo il guanto, piano, perché su questa nave le cose a volte rispondono. Non succede niente.[altrimenti]Sfioro appena. Non succede niente.[fine]
Perché: la massima del «rispetto» diventa una ragione pratica, quello che William ha imparato toccando (le venature, il brusio); così «Non succede niente» arriva come una piccola delusione. Il markup resta identico.
Dipendenze: nessuna.

## A-13 · relitto.fav 97 · G5
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Sollevo la taglierina, poi mi fermo. Non ogni parete merita un segno. Alcuni luoghi, su questa nave, lo chiedono. Qui no.
Dopo (la stringa intera nuova):
> Sollevo la taglierina, poi mi fermo. Su questa nave ci sono posti da segnare, e questo non mi sembra uno di quelli.
Perché: via la massima e la chiusa «Qui no.»; resta l’informazione per chi gioca (altrove incidere ha senso), detta come un’impressione di William. Non dice dove, così regge anche sulle pareti del corridoio accanto alle tacche.
Dipendenze: nessuna.

## A-14 · relitto.fav 175 · G3
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Da qualche parte nella nave qualcosa si assesta, con un gemito lungo e basso che mi arriva nei denti prima che nelle cuffie. Poi più niente.
Dopo (la stringa intera nuova):
> Da qualche parte nella nave qualcosa si assesta, con un gemito lungo e basso che mi arriva nei denti prima che nelle cuffie. Resto fermo ad ascoltare, ma non ne segue un altro.
Perché: via la chiusa «Poi più niente.»: il silenzio dopo il gemito lo dice William che aspetta il secondo. Gli altri due segni a sorte (176 e 177) finiscono già in modo diverso.
Dipendenze: `app/src/motore/ponte.py` 584, `SEGNI_A_SORTE["assestamento"]` = «Da qualche parte nella nave qualcosa si assesta» (confronto per sottostringa, `inizio in t`): l’inizio resta identico, `ponte.py` non cambia. Trascrizioni generate: trascrizione-atti-I-II.txt 350 e 444; trascrizione-tutto.txt 175, 273, 298, 597; trascrizione-vivi.txt 113, 220, 243.

## A-15 · relitto.fav 183 · G1+G4
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Le tre luci — verde, bianca e ambrata — pulsano all'unisono. La loro frequenza accelera, il ronzio diventa un gong risonante che vibra in tutta la nave. Il simbolo a stella brilla di luce accecante, e la Grande Porta, a ovest, non si apre: si dissolve in particelle di luce, come stelle che tornano al cielo.
Dopo (la stringa intera nuova):
> Le tre luci — verde, bianca e ambrata — pulsano all'unisono. La loro frequenza accelera, il ronzio diventa un gong risonante che vibra in tutta la nave. Il simbolo a stella si accende una punta dopo l'altra, e la Grande Porta, a ovest, si fa trasparente e sempre più sottile, finché al suo posto resta un varco aperto.
Perché: via «luce accecante», «non si apre: si dissolve» e le «particelle di luce, come stelle»; il diagramma a più punte (`corridoio.fav` 60) si accende punta per punta, la porta sparisce senza immagini e lascia il «varco» della A-04. Le tre luci restano, con i trattini lunghi di prima.
Dipendenze: collaudo/trascrizione-tutto.txt 580 e collaudo/trascrizione-vivi.txt 298 (generate: si rigenerano). Va applicata insieme alla A-04.

## A-16 · relitto.fav 184 · G5
Prima (la stringa intera fra le virgolette del .fav, esatta):
> Un brivido percorre lo scafo. Lontano, sistemi spenti da sempre tornano a respirare uno dopo l'altro. Per la prima volta, il relitto non è del tutto morto.
Dopo (la stringa intera nuova):
> Lo scafo mi vibra sotto i piedi, una volta sola. Lontano, dietro le pareti, sistemi spenti da sempre tornano a respirare uno dopo l'altro, e per la prima volta sento la nave lavorare.
Perché: via «Un brivido percorre» (frase fatta del catalogo) e la chiusa solenne «il relitto non è del tutto morto»; «per la prima volta» resta, attaccato a una cosa che William sente. «Tornano a respirare» resta: la nave viva è un motivo del testo.
Dipendenze: collaudo/trascrizione-tutto.txt 305 e collaudo/trascrizione-vivi.txt 205 (generate: si rigenerano).

## Altro che ho notato

Fuori dalle decisioni, soltanto segnalati, senza riscriverli.

- `corridoio.fav` 60, la Grande Porta: «Aspetta tre chiavi.» È ancora l’«aspettare» di un meccanismo, ma il G6 toglie soltanto 68 e 71: dopo questa proposta resta l’unico della porta. Da decidere se va anche questo.
- `ponte.py` 955, il diario («In sospeso»): «La porta tonda ha cinque punte. Quante ne vuole?» Il «volere» detto di un meccanismo è parente dell’«aspettare» del G6.
- `ponte.fav` 79: «Un’ondata di energia silenziosa attraversa la sala» è un’immagine di repertorio, fuori dalle cinque luci decise nel G4. La A-07 non la tocca.
- `ponte.fav` 74: «Il numero dev’essere la chiave.» «La chiave» nel senso di soluzione è una frase fatta, e sta su una porta in un gioco dove le chiavi vere sono tre oggetti.
- `relitto.fav` 175 e 176, due segni a sorte dello stesso gruppo: «nelle cuffie» al plurale, poi «Nella cuffia» al singolare.
