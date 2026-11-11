# La revisione globale (37)

Versione 1.0, 11 novembre 2026. Chiesta dall’autore: «fai una revisione globale individuando criticità gravissime, gravi, medie e lievi». È la seconda dopo quella del 18 ottobre (documento 25), e guarda soprattutto quello che è nato da allora: l’interfaccia viva, la prima persona, l’intro definitiva, la revisione narrativa, le voci registrate. Fotografa il repository al commit `c426b36` (la 0.2.5-beta.10 più i tre lavori non ancora in una beta). Non corregge niente: ogni voce dice dove sta il problema, che cosa succede a chi gioca, come lo si corregge e come l’ho verificata. Le correzioni le decide l’autore.

---

## 0. In breve

**Le prove passano tutte**: 98 in Rust, 96 in node, i tipi puliti, le versioni e i riconoscimenti in regola, i collaudi sui 16 percorsi (regressioni con le riprese, 1547 comandi giocati con i pulsanti, gli eventi del suono, il diario, i comandi scritti, 553 salvataggi). La copia del motore è identica al tag 1.6.1 di Favella1 (98 file su 98). Le prove su GitHub sono verdi. I 128 file di musica e voci del pacchetto, quelli che il motore audio nomina e quelli tracciati in git combaciano.

**Non ho trovato criticità gravissime.** Ho trovato **3 criticità gravi**, **26 medie** e **40 lievi**.

Le tre gravi sono difetti veri che finora nessuna prova vedeva.

- **Dopo una «Nuova partita» spariscono dallo schermo «diario» e «menu»**: chi gioca con il solo mouse non può più aprire la pausa, salvare, cambiare le opzioni o tornare al menu. C’è in tutte le dieci beta.
- **«La prima nota», quando il re si riconosce tornando in stiva, è registrata come «Vivi»**: il testo è quello giusto, ma il registro dei finali e la musica no. C’è nelle beta 9 e 10.
- **Il congedo dell’Anziano si può disfare**: chiudendo la conversazione dopo la dissolvenza lo si ritrova lì; e riparlandogli durante la fuga il colloquio ricomincia e il seme torna sul sostegno, senza una parola.

| Gravità | Quante | Le voci |
|---|---|---|
| Gravissime | 0 | (§2) |
| Gravi | 3 | G1 «diario» e «menu» spariti dopo l’intro · G2 «La prima nota» registrata come «Vivi» · G3 il congedo dell’Anziano che si disfa |
| Medie | 26 | §4: sei per chi gioca con il mouse e vede poco, tre nell’intro, due nella modalità scritta e nella tastiera, quattro nel suono, due nei salvataggi, quattro nella distribuzione e nel progetto, cinque nella storia e nel collaudo |
| Lievi | 40 | §5 |

**Le prime cose da fare**, in ordine: G1 (poche righe di stile, e una prova che la tenga chiusa) e G2 (una riga nel ponte); poi le decisioni dell’autore sul testo, perché G3 e tre medie della storia toccano i `.fav`; poi il gruppo di chi gioca con il mouse e vede poco (M1–M6); poi il suono al caricamento e ai titoli (M12, M13); poi le due librerie da aggiornare e una copia delle prese delle voci (M18, M19). Tutto questo prima della beta 11.

## 1. Come ho lavorato, e la scala

**Che cosa ho fatto.** Ho lanciato tutte le prove del progetto. Ho fatto leggere il codice per intero a quattro sessioni indipendenti, in parallelo e in sola lettura, una per area: il processo Tauri con i salvataggi e il motore audio (circa 16.000 righe di Rust); la pagina che fa girare il gioco; l’intro, i loghi, i titoli di coda, le scansioni e la costruzione; la storia, il ponte e il collaudo. A nessuna ho dato un’ipotesi da confermare, e a tutte ho chiesto di non ripetere i trenta punti del documento 25. Io ho rivisto il rilascio, l’aggiornamento automatico, i flussi di GitHub, le licenze, le dipendenze, i documenti e il repository, interrogando GitHub in sola lettura. Poi ho verificato le voci una per una: sul codice (le righe citate qui sotto le ho rilette io) e, dove si poteva, nel browser dello sviluppo, a 1280 × 720 e a 1093 × 614. Le voci della storia le ho rigiocate nel motore, comando per comando. Ogni voce dice come è stata verificata. Le voci segnalate e non confermate stanno nel §6.

**La scala** è quella del documento 25.

- **Gravissima**: rende il gioco inservibile per molti, corrompe dati, compromette la sicurezza. Blocca un rilascio.
- **Grave**: un difetto che chi gioca incontra in un percorso comune, oppure un rischio che rompe la distribuzione.
- **Media**: un difetto in condizioni particolari, un glitch che si vede o si sente, una fragilità o un rischio di prestazioni.
- **Lieve**: cosmetica, documenti, igiene del codice.

## 2. Gravissime: nessuna

Ho cercato in particolare: la perdita o la corruzione dei salvataggi (posti da un elenco chiuso, nessun percorso dalla pagina, scrittura su un file provvisorio con `sync_all`, la riserva del posto automatico; 553 salvataggi provati oggi, tutti buoni); le cadute del motore audio (nessun `unwrap`, `expect` o indice non controllato nel codice che gira nel thread audio, nessun lock, code tutte con un tetto; l’unico caso trovato è M14, in una condizione rara, e il gioco resta muto invece di chiudersi); gli ingressi dall’esterno (la politica dei contenuti permette solo `'self'`, permessi minimi, aggiornamenti firmati, nessun segreto nel repository né nella sua storia); il gioco non vincibile (i sei finali si raggiungono, con i pulsanti e con i soli menu; giocando sequenze insolite non è uscito nessun vicolo cieco e nessun oggetto che si duplica o si perde per sempre; «annulla» tiene allineati il motore e il diario in ogni punto); le tabelle del ponte scritte a mano (i segni a sorte, le voci dell’Anziano, della nave, di Yusuf, di L.V. e di servizio: combaciano tutte con i `.fav` di oggi). Nessuna di queste strade porta a un problema di questa gravità.

## 3. Gravi

### G1 · Dopo una «Nuova partita» spariscono «diario» e «menu», e i fili del ramo

**Dove.** `app/src/intro/intro.css:31-40`. Due regole dell’intro non stanno sotto `.intro`: valgono per tutta la pagina.

```css
.palco { position: relative; container-type: size; aspect-ratio: 16 / 9; … overflow: hidden; }
.palco > * { position: absolute; }
```

Anche il gioco ha un suo `.palco` (`app/src/gioco/Gioco.tsx:628`), e dentro c’è `.esplorazione`, che non ha nessuna regola sua. Il foglio di stile dell’intro entra nella pagina la prima volta che l’intro si carica e ci resta fino alla chiusura del gioco. Da quel momento `.esplorazione` diventa un riquadro di zero per zero, e tutto quello che dentro di lei si misura da destra, dal basso o dai quattro lati finisce nel posto sbagliato; in più il palco taglia quello che esce.

**Che cosa succede.** Avvio, «Nuova partita», l’intro (vista o saltata), il gioco. Misurato a 1280 × 720:

| | prima dell’intro | dopo l’intro |
|---|---|---|
| «diario» e «menu» (`.comandi-app`) | a 540 px da sinistra, visibili | a **−675 px**: fuori dallo schermo |
| il ramo e i suoi fili (`.ramo`, `.ramo-fili`) | 1280 × 720 | **0 × 0**: i fili non si disegnano |
| la scritta dell’atto (`.atto`) | una riga | stretta a 69 px, su tre righe, sopra l’orlo della lamina |
| la lamina, il visore, i pulsanti del ramo | al loro posto | al loro posto |

Chi gioca con il solo mouse non ha più modo di aprire la pausa: niente salvataggi a mano, niente opzioni, niente diario, niente ritorno al menu, niente «Esci». Con la tastiera Esc e D funzionano. Nella modalità a comandi scritti anche la riga dove si scrive esce dallo schermo (misura della sessione di lettura sui fogli di stile costruiti; non l’ho rifatta io). Resta così fino al riavvio, anche tornando al menu. Avviando il gioco e facendo subito «Continua» non succede, perché l’intro non è mai stata caricata.

**Da quando.** Le due regole sono del 14 ottobre: il difetto è in tutte le beta, dalla 1 alla 10.

**Perché nessuno l’ha visto.** Le prove nel browser partono da `?gioco`, senza intro. La prova dei sei finali nell’eseguibile apre la pausa con Esc. Lo strumento che misura i testi scarta ciò che un contenitore taglia.

**Come l’ho verificata.** Nel browser dello sviluppo, con la pagina vera: prima caricando il solo foglio di stile dell’intro sopra il gioco, poi nel percorso reale (`?nuova`: l’intro, saltata, e il gioco). Le misure della tabella sono quelle. Nel foglio di stile costruito (`app/dist/assets/Intro-*.css`) le due regole ci sono. Nell’eseguibile non l’ho guardata: per chiuderla del tutto basta una partita nuova.

**Correzione.** Mettere ogni selettore di `intro.css` sotto `.intro`; dare a `.esplorazione` una regola sua; una prova che, dopo «Nuova partita», trovi «diario» e «menu» dentro la finestra; nello strumento delle misure, contare come fuori anche ciò che il palco taglia.

### G2 · «La prima nota» riconosciuta in stiva: il gioco la mostra, ma la registra come «Vivi»

**Dove.** `relitto-silente/finali.fav:24`: dal 5 novembre (RN-F3) il finale segreto si apre anche a chi ha suonato il sonaglio e riconosce il re tornando in stiva (`la nota è sonaglio`). `app/src/motore/ponte.py:895`: il ponte è rimasto alla regola di prima (`nota == "riconosciuta"`).

**Che cosa succede.** Chi arriva a «La prima nota» per la strada nuova legge il finale giusto, ma il ponte dice al resto dell’app che è «Vivi»: nel registro dei finali si scrive «Vivi», e la musica della chiusura è quella di «Vivi». Per questa strada «La prima nota» nel registro non compare mai. È nelle beta 9 e 10.

**Come l’ho verificata.** Le due righe, lette. E la prova degli eventi di oggi lo stampa da sé: `[OK] prima-nota-in-stiva (238 eventi, finale «vivi»)`. Il percorso che arriva a «La prima nota» manda «vivi», e la prova resta verde perché accetta qualunque finale.

**Correzione.** Una riga nel ponte, nessun `.fav`. Nella prova degli eventi, il finale atteso percorso per percorso.

### G3 · Il congedo dell’Anziano si può disfare, e nella fuga gli si può riparlare da capo

**Dove.** `relitto-silente/ponte.fav:215-221`: le conseguenze del congedo (la fuga comincia, il seme è sul sostegno) stanno tutte sull’ultima risposta, «[Apri gli occhi.]». `ponte.fav:130-136`: finito il colloquio l’Anziano resta una cosa della stanza a cui si può parlare.

**Che cosa succede.** Due casi.

- **Chiudendo la conversazione dopo la dissolvenza.** Il pulsante «Chiudi la conversazione» c’è a ogni battuta (`app/src/gioco/dialogo/Dialogo.tsx:66`). Chi lo preme dopo aver letto che la figura si è raccolta nel seme, e dopo l’ultima voce, ritrova l’Anziano che lo guarda: nessun seme, nessuna gola aperta. Deve rifare il colloquio da «Benvenuto».
- **Parlandogli durante la fuga.** A fuga cominciata e seme preso, «parla con l’Anziano» ricomincia il colloquio da «Creatura di carbonio… Benvenuto», con la sua voce registrata, mentre la stanza trema e la figura non c’è più. Arrivati in fondo, il seme esce dall’inventario e torna sul sostegno, senza una parola. Chi non se ne accorge esce con «Mani vuote» invece che con «Vivi».

Si recupera in tutti e due i casi, ma è la scena madre del gioco.

**Come l’ho verificata.** Rigiocati nel motore: i primi 71 comandi di `collaudo/vivi.txt` e poi «esci» e «guarda»; i primi 73 e poi «parla con l’anziano», le sei risposte e «inventario». Le uscite sono quelle dette.

**Correzione.** Tocca `ponte.fav`: è una decisione dell’autore. Per il primo caso, senza testo nuovo: spostare le conseguenze sulla risposta del congedo (la sessione di lettura l’ha provato su una copia: 16 percorsi su 16), oppure togliere «Chiudi la conversazione» negli ultimi due nodi, dal lato dell’app. Per il secondo serve una riga nuova per chi gli parla nella fuga, o che l’Anziano non sia più una cosa a cui parlare.

## 4. Medie

### Chi gioca con il mouse, chi vede poco

### M1 · «Carica» dentro la partita non chiede conferma

**Dove.** `app/src/gioco/Gioco.tsx:728-733` (il pannello) e `:489` («carica 3» scritto). Il menu principale invece la chiede (`app/src/Relitto.tsx:428-431`).

**Che cosa succede.** Pausa, «Carica», un clic su un posto: la partita in corso è sostituita subito. «Salva» e «Carica» sono due voci vicine e aprono due pannelli quasi uguali. Resta soltanto quello che il posto automatico aveva all’ultimo cambio di stanza.

**Correzione.** La stessa conferma del menu, quando c’è una partita in corso con almeno un turno. **Verificata** sul codice.

### M2 · L’aggiornamento non ha un tetto di tempo, e il suo pannello non ha un’uscita

**Dove.** `app/src/aggiornamenti.ts:38` e `:49` (`check()` e `downloadAndInstall()` senza `timeout`; nel plugin 2.14.0 il valore di base è nessun tetto, `updater.rs:234`); `app/src/menu/Aggiornamento.tsx` mostra «Chiudi» solo se c’è un errore.

**Che cosa succede.** Se la rete cade in silenzio a metà dello scaricamento (68 MB), la barra resta ferma, il menu è coperto e non c’è nessun pulsante. A schermo intero, con il solo mouse, non si esce. La partita è già nel posto automatico: non si perde niente, ma il gioco va chiuso da fuori.

**Correzione.** Un tetto sul controllo e uno sull’ultimo pezzo arrivato; un «Annulla» sempre presente mentre scarica. **Verificata** sul codice; quanto spesso succeda dipende da come cade la rete.

### M3 · I loghi non si saltano con il mouse, e non seguono né il volume né il «movimento ridotto» del gioco

**Dove.** `app/src/loghi/Loghi.tsx:44` e `:49`; `app/src/loghi/suono.ts:25`; `app/src/Relitto.tsx:370`.

**Che cosa succede.** A ogni avvio, quasi tredici secondi che si saltano solo con Esc: nessun clic, nessuna scritta, il cursore nascosto. Il suono dei loghi è fuori dal mixer, a un livello fisso: suona anche con il «Volume generale» spento. Il «movimento ridotto» scelto nelle Opzioni non li ferma (guardano solo l’impostazione di Windows).

**Correzione.** Un clic che li chiude; passare ai loghi il volume e il movimento delle Opzioni. **Verificata** sul codice.

### M4 · La dichiarazione sull’intelligenza artificiale se ne va dopo 20 secondi, ma oggi è lunga il triplo

**Dove.** `app/src/riconoscimenti/Dichiarazione.tsx:24` e `:43`. Il tempo è del 15 ottobre, quando il testo aveva una quarantina di parole; con le voci ne ha più di centoventi.

**Che cosa succede.** A ogni avvio il testo scompare a metà lettura, e non c’è modo di fermarlo. Per chi legge piano o con la lente non si legge.

**Correzione.** Togliere la scadenza (resta «continua»), o calcolarla dalla lunghezza. **Verificata** sul codice.

### M5 · L’avviso di «partita ricostruita» resta 3,2 secondi

**Dove.** `app/src/gioco/Gioco.tsx:292-293`; `app/src/gioco/pannelli/Pannelli.tsx:562-569`.

**Che cosa succede.** Dopo ogni versione che tocca la storia (finora tutte le beta) «Continua» ricostruisce la partita e lo dice con una frase di centocinquanta caratteri, in alto, per 3,2 secondi. È l’unico segno che la partita può non essere quella di prima, e non si fa in tempo a leggerlo.

**Correzione.** Per «ricostruita» e «diversa», un avviso che resta finché non lo si chiude; per gli altri, una durata che segue la lunghezza. **Verificata** sul codice.

### M6 · Un clic salta tutta l’intro, e un doppio clic su «Nuova partita» la salta prima che cominci

**Dove.** `app/src/intro/Intro.tsx:814-816` e `:731-736`: il palco accetta il clic dal momento in cui compare, senza un tempo di guardia.

**Che cosa succede.** Il secondo clic di un doppio clic su «Nuova partita» cade sull’intro appena montata: tre minuti saltati alla prima partita, senza saperlo. Lo stesso per un clic dato per riportare davanti la finestra. La scritta a schermo dice solo «Esc · salta».

**Correzione.** Ignorare i clic per il primo secondo e finché l’intro non è pronta; dire a schermo che anche il clic salta. **Verificata** sul codice; nel percorso del doppio clic conta in quanti millisecondi l’intro si monta.

### L’intro

### M7 · L’immagine dell’intro perde il passo con la voce e la musica, e non lo ritrova

**Dove.** `app/src/intro/Intro.tsx:685-686`: il tempo dell’immagine si somma fotogramma per fotogramma, con un tetto di un decimo di secondo; il suono parte una volta e va con l’orologio del motore audio. I loghi e i titoli di coda leggono l’orologio, e non hanno il problema.

**Che cosa succede.** Ogni fotogramma più lungo di un decimo di secondo lascia l’immagine indietro: il motore Python che si carica se si sceglie «Nuova partita» subito dopo la dichiarazione (due blocchi da 594 e 779 ms, misurati in ottobre), la finestra nascosta o ridotta a icona, una scheda video lenta. La voce di L.V., il relè del faro, i colpi del cuore non cadono più sull’immagine, fino alla fine. Può essere una delle cose che nell’intro «non vanno».

**Correzione.** Il tempo dell’intro dall’orologio, contato da quando parte il suono; non far partire l’intro finché il motore non è pronto. **Verificata** sul codice; di quanto si sfasi davvero va misurato nell’eseguibile.

### M8 · Senza audio, l’intro non ha né la voce né le parole di L.V.

**Dove.** `app/src/Relitto.tsx:388`: i testi di L.V. si nascondono quando i due cursori del gioco non sono a zero. La pagina non sa se il sistema è muto, se le casse sono spente o se il dispositivo audio non si è aperto.

**Che cosa succede.** Con il volume di Windows a zero, o senza cuffie, un minuto di nero senza una parola. Chi non sente non ha né il monologo né le didascalie dei suoni. Il prologo resta nel diario.

**Correzione.** È una decisione dell’autore (il 30 ottobre: mentre L.V. parla, i suoi testi non ci sono): la proposta è un’opzione «Sottotitoli» nella scheda Audio, spenta di base, e i testi sempre quando il motore audio non è partito. **Verificata** sul codice.

### M9 · L’intro non segue la scheda «Grafica»

**Dove.** `app/src/intro/Intro.tsx:163` e `:290`; `app/src/intro/scala.ts:749-750`. La «qualità ridotta» dell’intro esiste solo nella barra di revisione.

**Che cosa succede.** Su uno schermo 4K o su una grafica integrata l’intro lavora a piena risoluzione qualunque livello si scelga; se scende sotto i dieci fotogrammi al secondo scatta anche M7. Con il movimento ridotto una scena disegna due quadri interi a ogni fotogramma per mostrare un’immagine ferma.

**Correzione.** Legare la qualità dell’intro al livello della scheda «Grafica». **Dalla lettura**; nessuna misura nell’eseguibile.

### La modalità scritta e la tastiera

### M10 · La modalità scritta ha tre difetti suoi

- **AIUTO** mostra l’aiuto del motore già spento, come un turno passato, e lo nasconde al lettore di schermo; si legge bene solo l’aggiunta dell’app (`app/src/gioco/Gioco.tsx:507-511`).
- **Dopo un finale non si arriva ai titoli di coda**: nei comandi scritti non c’è una parola per chiederli (`app/src/gioco/scritti/comandiApp.ts:42-71`; i titoli partono solo dal pulsante, `Gioco.tsx:403`).
- **Nel dialogo le risposte numerate stanno sopra la battuta** a cui rispondono, e il lettore di schermo le legge prima (`app/src/gioco/dialogo/Dialogo.tsx:41-60`).

**Correzione.** Una voce sola per AIUTO; la parola «titoli» alla fine della partita; i blocchi del dialogo nell’ordine in cui arrivano. **Verificate** sul codice; non viste a schermo.

### M11 · I cinque cursori dei volumi non si raggiungono dalla tastiera

**Dove.** `app/src/gioco/pannelli/Pannelli.tsx:22-31`: la trappola del fuoco dei pannelli conosce i pulsanti, non i cursori, e ferma sempre il Tab.

**Che cosa succede.** Nelle Opzioni, scheda Audio, il Tab salta dai pulsanti al «chiudi». Chi usa la tastiera o un lettore di schermo non cambia nessun volume, mentre la pagina dei tasti dice «Tutto si fa anche senza mouse».

**Correzione.** Aggiungere i cursori ai due selettori. **Verificata** sul codice.

### Il suono

### M12 · Dal finale ai titoli di coda in meno di 14 secondi: tornano la plancia e la musica del finale

**Dove.** `app/src-tauri/src/mondo/regia.rs:1497-1519` (il finale programma il silenzio a 4 s, il risveglio sulla plancia a 12 s e la sua musica a 14 s); `regia.rs:95` e `:119` (solo un caricamento svuota le cose programmate); `app/src/gioco/suono.ts:42` (uscendo dal gioco la pagina manda una stanza vuota, che non è un caricamento).

**Che cosa succede.** Chi sceglie «Titoli di coda» entro 14 secondi dal finale (10 per «Due lettere») sente tornare sotto i titoli il re e la ventilazione della plancia, e la musica del finale prende il posto di «Voice in the Deep»; poi niente musica, con i titoli tarati sulla canzone. Chi legge il finale per intero non lo incontra.

**Correzione.** Trattare la stanza vuota come un caricamento; una prova in Rust. **Verificata** sul codice; non ascoltata.

### M13 · Un caricamento, un «annulla» o «Ricomincia» non fermano tutto

Il ramo che azzera il mondo sonoro (`regia.rs:99-122`) dimentica quattro cose.

- **La voce registrata dell’Anziano** continua fino alla fine della battuta sopra la stanza caricata (`regia.rs:271-281`; `musica.rs:1085-1092`).
- **I colpi programmati con ritardo** arrivano nella partita ripresa: il crollo e il rombo di «Due lettere» dopo un «annulla», i tic del traduttore (in `regia.rs` e `mod.rs` la coda dei colpi non si svuota mai).
- **I ganci della stiva e il re sullo scafo** restano nello stato di prima (`regia.rs:667`, `:140-143`).
- **Il canto del primo contatto** si ricorda per mondo sonoro, non per partita: dopo «Continua» può tornare, dopo un «annulla» può mancare (`musica.rs:908-929`).

**Correzione.** Quattro righe nel ramo del caricamento, e una riga in più nella prova `annullare_un_finale_riporta_il_mondo_di_prima`. **Verificati** sul codice i primi due; gli altri dalla lettura.

### M14 · Il ricampionatore può far cadere l’audio

**Dove.** `app/src-tauri/src/mondo/mod.rs:1324-1341`. Quando il dispositivo scende sotto un quarto della frequenza a cui il mondo sonoro è nato, alla fine di un blocco si tolgono più campioni di quanti ce ne siano.

**Che cosa succede.** Cuffie Bluetooth che passano al vivavoce a 8 kHz mentre si gioca, o un mondo nato a 192 kHz e cuffie normali collegate dopo: il thread audio cade e il gioco resta muto fino al riavvio (non si chiude, grazie alla scelta del 19 ottobre).

**Correzione.** Una riga (`via` non oltre la lunghezza), e una prova con rapporti sopra quattro. **Verificata** rifacendo il conto: mondo a 44,1 kHz, dispositivo a 8 kHz, primo blocco di 47 campioni, 257 in memoria e 259 da togliere.

### M15 · Il mondo sonoro di prima resta in memoria fino al successivo

**Dove.** `app/src-tauri/src/audio.rs:416-447`; ogni mondo apre sette lettori di file (`mondo/mod.rs:682-689`).

**Che cosa succede.** Passando dal menu al gioco, il mondo del menu tace ma tiene i suoi brani decodificati (da 60 a 100 MB) e sette thread fermi per tutta la partita; al ritorno tocca a quello del gioco. Nel momento peggiore, nell’ordine di 200–250 MB, un terzo dei quali non serve. Nessun effetto su quello che si sente.

**Correzione.** Far lasciare i pezzi ai lettori quando il mondo è fermo; un solo thread di lavoro per mondo. **Dalla lettura**: i megabyte sono calcolati dalle durate, non misurati.

### I salvataggi

### M16 · La prova di scrittura può scartare la cartella dei salvataggi per tutta la sessione

**Dove.** `app/src-tauri/src/salvataggi.rs:88-93` e `:62-73`. La prova scrive un file e lo cancella, e conta come fallita anche se fallisce soltanto la cancellazione; la scelta vale fino alla chiusura.

**Che cosa succede.** Se OneDrive o l’antivirus tengono quel file per un attimo, il gioco passa alla cartella di ripiego: per quella sessione il menu non mostra «Continua» né i posti di Documenti, e quello che si salva lì non si vede all’avvio dopo. Niente è distrutto, ma i salvataggi sembrano spariti due volte.

**Correzione.** La prova è riuscita se la scrittura è riuscita; se in Documenti ci sono già salvataggi, non passare al ripiego in silenzio. **Verificata** sul codice; quanto spesso scatti non lo so.

### M17 · Un registro dei finali che per un momento non si legge viene riscritto da capo

**Dove.** `app/src-tauri/src/salvataggi.rs:183-201`; `app/src/Relitto.tsx:180-186`. Un registro illeggibile vale come vuoto, e il finale dopo scrive un registro con una riga sola, senza copia di riserva.

**Che cosa succede.** I finali già raggiunti spariscono dal menu e poi dal disco. Raro.

**Correzione.** Distinguere «non c’è» da «non si legge»; una copia accanto prima di sostituire. **Verificata** sul codice.

### La distribuzione e il progetto

### M18 · Due vulnerabilità note nelle librerie dell’aggiornamento, e nessuno che avvisi

**Dove.** `cargo audit` di oggi: `rustls-webpki` 0.103.15 (RUSTSEC-2026-0382) e `webpki-root-certs` 1.0.9 (RUSTSEC-2026-0383), che arrivano da `tauri-plugin-updater`. Riguardano la verifica dei certificati della connessione sicura. Su GitHub gli avvisi sulle dipendenze, la scansione dei segreti e la protezione dei push sono spenti, e le prove non controllano le dipendenze. `npm audit` non trova niente.

**Che cosa succede.** Il danno possibile è piccolo: il pacchetto dell’aggiornamento porta la firma dell’autore, e una connessione falsata non la può imitare. Ma sono due difetti noti dentro il gioco pubblicato, e si chiudono con un comando.

**Correzione.** `cargo update` delle due librerie; accendere gli avvisi e la scansione dei segreti (tre impostazioni del repository, che cambio io se l’autore dice sì); un passo `cargo audit` nelle prove. **Verificata** oggi.

### M19 · Le prese originali delle voci non hanno una copia

**Dove.** `audio/sorgenti/` (240 MB, fuori da git) e gli originali della musica. L’unico backup della cartella del progetto su F: è del 16 ottobre; le voci sono nate fra il 29 ottobre e il 7 novembre.

**Che cosa succede.** Se il disco C: si rompe, il gioco è salvo (i file tagliati sono su GitHub), ma le prese intere di «Elio», di «Kira», dell’Anziano e di Yusuf sono perse. La sintesi vocale non ridà la stessa presa: sono quelle approvate, e servono per rifare tagli e trattamenti.

**Correzione.** Un backup nuovo su F:, e la regola di rifarlo quando entra una presa nuova. **Verificata** guardando le due cartelle.

### M20 · Le prove su GitHub possono restare rosse senza che nessuno lo sappia

**Dove.** Dal 7 all’11 novembre le prove erano rosse (documento 36, §4) e nessun documento lo diceva. La causa di quel giorno è corretta; quella di fondo resta: sul mio computer ci sono librerie che la macchina di GitHub non ha, e niente controlla l’esito dopo un push.

**Che cosa succede.** Con le prove rosse il flusso di rilascio non costruisce: lo si scopre il giorno della beta.

**Correzione.** Una regola fissa nel prompt 31: a fine sessione guardo l’esito dell’ultimo flusso su GitHub, e non chiudo con le prove rosse. È scritta con questa revisione (§9).

### M21 · Il README e `LICENZE.md` non dicono più il vero

**Dove.** `README.md:9`, `:24`, `:49`, `:55`; `LICENZE.md:3` e la sezione sull’intelligenza artificiale.

**Che cosa succede.** La facciata pubblica dice «non ancora rilasciato» e che le release sono solo quelle del vecchio gioco (ci sono dieci beta del remake); dice che il suono è tutto sintetizzato; e la nota sull’intelligenza artificiale non nomina le voci generate né la voce dell’autore clonata: 108 file su 128. La dichiarazione dentro il gioco invece è giusta. La nota sulla licenza si ferma alla beta.8.

**Correzione.** Riscrivere le quattro righe con le stesse parole della dichiarazione del gioco. **Verificata** leggendo i file.

### La storia e il collaudo

### M22 · I segni della fuga escono anche dentro la Santa Maria

**Dove.** `relitto-silente/fuga.fav:41-42`: i due segni a sorte della fuga non guardano in che stanza si è.

**Che cosa succede.** Nell’ultima schermata di «Vivi», già in stiva, esce almeno un segno in 117 partite su 300 (il 39 %); «Le pareti si incrinano in lunghe linee verdi…» in 65 (il 22 %): le pareti del relitto che si incrinano dentro la Santa Maria, fra la descrizione della stiva e il portello che si chiude. Anche sullo scafo. Il suono segue il testo.

**Correzione.** Una condizione in più nelle due regole: tocca un `.fav`, senza testo nuovo. **Verificate** le due righe; le percentuali sono della sessione di lettura (300 partite con semi diversi), non le ho rifatte.

### M23 · I testi delle tre chiavi presuppongono l’ordine seme, Stele, Nucleo

**Dove.** `relitto-silente/corridoio.fav:18`, `:60`, `:66`, `:67`; `memoria.fav:67` e `:174`.

**Che cosa succede.** La Stele messa per prima: «Una linea di luce bianca si aggiunge alla prima.» La porta con una chiave già dentro: «tre incavi scuri… servono tre chiavi». «La seconda chiave.» e «La terza chiave.» qualunque sia l’ordine. E il corridoio dice «tre tacche» anche dopo averne incisa una quarta. La Stele è la chiave più facile, e spesso è la prima; tutti i percorsi del collaudo le mettono nell’ordine previsto.

**Correzione.** Varianti nei `.fav`: decide l’autore. **Verificata** rigiocando la Stele per prima.

### M24 · Nella fuga, «Est» nel santuario costa aria e parla ancora della figura

**Dove.** `relitto-silente/ponte.fav:138`.

**Che cosa succede.** A fuga cominciata il pulsante «Est» c’è. Risponde «Non c’è più nessun indietro. C’è soltanto la figura luminosa, e quello che ha da dirmi.», quando la figura non c’è più, e costa quattro d’aria.

**Correzione.** Una variante per la fuga: tocca un `.fav`. **Verificata** rigiocandola (aria da 88 a 84).

### M25 · Un salvataggio di una versione di prima può riaprirsi in un altro punto, con lo stesso avviso

**Dove.** `app/src/motore/ponte.py:1479-1491`. Caricare vuol dire rigiocare i comandi sulla storia di oggi: se un comando non vale più, quelli dopo si rigiocano alla cieca.

**Che cosa succede.** Misura della sessione di lettura, con i percorsi giocati sulle versioni dei tag e ricaricati oggi.

| Salvataggi fatti con | Quanti | Stesso punto | Solo l’aria diversa | Altrove |
|---|---|---|---|---|
| la beta.10 | 517 | 517 | 0 | 0 |
| la beta.9 | 517 | 517 | 0 | 0 |
| la beta.8 | 433 | 207 | 59 | 167 |

Un esempio dalla beta.8: nel file lo scafo, atto V, turno 70; caricato, il vestibolo, turno 60, senza il Nucleo. L’avviso è sempre lo stesso: «Controlla che tutto sia come lo ricordi.» Niente si corrompe e la partita si può finire, ma il posto promette un punto e ne apre un altro. Le risposte dei dialoghi entrano nei salvataggi come numeri: una risposta spostata verrebbe rigiocata come un’altra. Oggi tocca soltanto i salvataggi dell’autore; dopo la 1.0 toccherà chi gioca a ogni cambio della storia.

**Correzione.** Nel ponte, confrontare il riassunto del salvataggio con la partita ricostruita, e dirlo quando non torna (insieme a M5); una prova sui tag di prima. **Non rifatta** da me.

### M26 · Il collaudo lascia fuori metà dei testi, e due prove non provano

**Che cosa succede.** Dei 635 testi del gioco, 369 (il 58 %) non escono in nessuno dei 16 percorsi; con le tre partite da principiante, il 49 %. Mai giocati: buona parte del colloquio con l’Anziano (i nodi «silenzio», «memoria», «aiuto», «prezzo», «tracce», il sonaglio mostrato), il ritorno dell’eco, nella fuga la voce dei nomi ascoltata e il groviglio tagliato, la firma sulla placca, le righe facoltative dei finali. «Doppio fondo» e «Mani vuote» hanno un percorso solo. Due prove sono deboli: quella degli eventi accetta qualunque finale (`collaudo/eventi.py:200`: così è passata G2); quella dei salvataggi prova «ricostruita» con un’impronta finta sulla stessa storia (`collaudo/salvataggi.py:162`: così M25 non si vede). G3, M22, M23 e M24 le avrebbe trovate un percorso in più.

**Correzione.** Quattro o cinque percorsi nuovi (gli altri rami dell’Anziano, la Stele per prima, la conversazione chiusa a metà, parlare nella fuga), e il finale atteso per ogni percorso. I conti sono della sessione di lettura, e sono una stima per difetto.

## 5. Lievi

| | Dove | Che cosa | Correzione |
|---|---|---|---|
| L1 | `dialogo.css:95-97`, `lamina.css:71`, `intro.css:51`, `intro/plancia.ts:502` | Testi sotto i 12 px: i numeri delle risposte nel dialogo con Yusuf (10,1 px fino a 1444 px di palco); i turni già passati della lamina (da 10,5 a 11,8 px); una didascalia dell’intro (11,1 px a 1093); le scritte del radar disegnate nell’intro (da 7 a 10 px) | un pavimento di 12 px nei primi tre; il radar lo decide l’autore |
| L2 | `Pannelli.tsx:409` | Nelle Opzioni, sotto «Parlato»: «Le voci registrate. Per ora non ce ne sono: il cursore è pronto.» È falso dalla beta.8 | riscrivere |
| L3 | `visore/Visore.tsx:424-445` | Il cartello d’atto riparte a ogni ridisegno, resta invisibile sopra tutto e si prende il primo clic; compare anche caricando un salvataggio di un atto più avanti | `useCallback`, e azzerare lo stato al caricamento |
| L4 | `Pannelli.tsx:76-88`, `Relitto.tsx:281-289` | La conferma prende «s» e «n» anche con Ctrl; la domanda dell’aggiornamento arriva da sola con il fuoco su «Aggiorna», e un Invio dato al menu fa partire lo scaricamento | ignorare i tasti con i modificatori; il fuoco sul «no» |
| L5 | `Gioco.tsx:364-372`, `ramo/Ramo.tsx:58-85` | «Nomi toccabili: no» e il cambio di carattere non valgono per il turno in corso | ricomporre il turno |
| L6 | `Pannelli.tsx:152`, `comandiApp.ts:53` | Nella modalità scritta la pausa mostra il tasto D, che lì non funziona; «esci», «quit» e «riavvia» vanno al motore, che risponde «A presto!» e non succede niente, o ricomincia da sé | nascondere il tasto; portare le tre parole all’app |
| L7 | `stile/opzioni.ts:94-101` | Le opzioni lette dal disco non si controllano: un volume del tipo sbagliato fa rifiutare tutto il mix, in silenzio | tenere solo i valori del tipo giusto |
| L8 | `base.css:44`, `ramo.css:9` | «Testo: grande» ingrandisce la lamina, il diario e i pannelli; non i pulsanti del ramo, il dialogo, il visore | decide l’autore |
| L9 | `gioco.css:55-60`, `pannelli.css:106` | Bersagli piccoli: «diario» e «menu» sono alti 28 px; «continua ↓» una ventina | 36–40 px |
| L10 | `Gioco.tsx:555-566` | Un suggerimento senza comando resta un pulsante acceso che non fa niente | spegnerlo |
| L11 | `Relitto.tsx:375-394`, `tastiera.ts` | Negli ultimi secondi dell’intro il gioco sotto riceve già i tasti: una freccia gioca un turno che non si vede | tastiera spenta finché l’intro è sopra |
| L12 | `Relitto.tsx:338-343` | «Nuova partita» non chiede niente se c’è soltanto il salvataggio automatico su disco, che al primo cambio di stanza è sovrascritto | un avviso, o una copia; decide l’autore |
| L13 | `tastiera.ts:41-126` | Un tasto tenuto premuto si ripete: più stanze attraversate, più aria spesa | `if (e.repeat) return` |
| L14 | `intro/Intro.tsx:235-237` | Il motore grafico dell’intro non si spegne all’uscita: ogni intro lascia in memoria un contesto con le sue immagini | chiamare `distruggi()` |
| L15 | `intro/Intro.tsx:830`, `intro.css:29` | A schermo c’è solo «Esc · salta»; sulle fasce nere di uno schermo 16:10 il clic non salta | «clic o Esc · salta» |
| L16 | `loghi/Marchi.tsx:31` | Nei titoli di coda i pixel del marchio Runtime sono spostati di mezzo lato rispetto al logo d’apertura | `x={p.x} y={p.y}` |
| L17 | `scansioni/stanze.ts:1028`, `:1094`, `:1100` | Le frasi delle scansioni per il lettore di schermo: nella fuga dicono il groviglio fermo; il cilindro e il sonaglio restano detti e disegnati dopo averli presi; sono in seconda persona | due stati in più dal ponte; la prima persona |
| L18 | `intro/` | L’intro non riceve il carattere né il «testo grande» scelti nelle Opzioni | passarle il tema |
| L19 | `riconoscimenti/Titoli.tsx:66-68` | Partita la sfumatura finale dei titoli, «salta» ed Esc non fanno più niente per sette secondi | lasciarli vivi |
| L20 | `motore/sorgenti.ts:24-28`, `lib.rs:156` | Nel pacchetto entrano la pagina di prova, venti percorsi di collaudo (le soluzioni) e un suono di prova; `RELITTO_PROVA=salvataggi` senza la sua cartella scrive nei posti veri | scelta dichiarata in ottobre; la variabile da proteggere |
| L21 | `mondo/regia.rs:742-748` | La protezione vitale può restare accesa per il suono se si accende e si spegne in meno di 0,6 s | una riga |
| L22 | `mondo/musica.rs`, `musica_file.rs`, `intro.rs` | Igiene del motore audio: restano piccole allocazioni nel thread audio; il letto dell’Anziano può mancare dopo sei cambi in undici secondi; il menu dai file fa girare a vuoto il ciclo sintetizzato; i pezzi decodificati riservano più memoria del dovuto; un `expect` all’avvio del lettore; il fruscio della cuffia segue solo il volume generale | in rifinitura |
| L23 | `salvataggi.rs:155` | Il file provvisorio ha un nome fisso per posto: due scritture insieme dello stesso posto si pestano, e la seconda dà un avviso d’errore senza danno | un lucchetto intorno alla scrittura |
| L24 | `lib.rs:163-185` | `scrivi_rapporto` resta nell’eseguibile di rilascio: la pagina può scrivere file `prova-…` di qualunque misura nella cartella dei dati | solo `.json`, con un tetto |
| L25 | vari | Commenti e campi che dicono il falso dopo le voci («nessun campione registrato», «i diciotto MP3», «dopo i riconoscimenti», «Electron»); `Cargo.toml` con `repository` vuoto; `app/package.json` con «FAVELLA 1.5.0… a soli pulsanti»; la descrizione su GitHub e `LICENZE.md` con «FAVELLA 1» | riscrivere |
| L26 | `LICENZE.md`, `audio/musica-ia/REGISTRO.md` | Il tema di Alirio Bruni è un dono al progetto (l’autore, 11 novembre 2026), ma non è scritto: `LICENZE.md` mette tutta `audio/musica-ia/` sotto CC BY-NC-SA a nome dell’autore, senza l’eccezione | scrivere il dono nei due registri; decide l’autore se chiedere a Bruni due righe scritte |
| L27 | `sviluppo/STRUTTURA.md` | Fermo a ottobre in una decina di punti: «Versione: 0.2.0», «il 28 è il prompt in vigore», i 17 MP3, «senza registrazioni», la fase 3 «quasi chiusa», l’elenco dei documenti fino al 29, il comando verso una cartella di Favella1 che non c’è più | aggiornare |
| L28 | `progettazione/31-…`, `36-…` | Il prompt 31 ha il titolo «Dove siamo (7 novembre)», due chiusure di sessione in ordine inverso, il punto 1 fermo alle beta dalla 5 alla 8; il documento 36 elenca ancora le prove rosse | riordinare (lo faccio con questa revisione) |
| L29 | `sviluppo/VERSIONI.md` | Due sezioni «7»; «costruisce Windows e Linux»; in un repository pubblico dice dove stanno la chiave di firma e la sua password | rinumerare; togliere i percorsi |
| L30 | `.github/workflows/` | `prove.yml:30`: la condizione che non dovrebbe annullare le prove chiamate dal rilascio non scatta mai (dentro un flusso chiamato l’evento è quello di chi chiama); Rust «stable» non fissato, quindi l’eseguibile pubblicato nasce con il compilatore del giorno; le azioni su una versione di Node deprecata; un cambio al solo CHANGELOG, che entra nel gioco, non fa partire le prove | correggere la condizione; fissare Rust; aggiornare le azioni |
| L31 | `tauri.conf.json`, i titoli | I due brani del tema (`T-01`, `T-02`) sono nel pacchetto (2,7 MB) e nei titoli di coda, ma il gioco non li suona mai | ricollegarli (già in lista) o toglierli |
| L32 | `audio/LICENZE.md`, `grafica/LICENZE.md` | Nel registro dei suoni le eccezioni non nominano Yusuf, la voce di servizio e Suno, e la regola 8 parla ancora della schermata d’apertura; nel registro delle immagini la tabella è spezzata da un paragrafo, e non dice quali immagini sono generate, mentre il README rimanda lì | riordinare |
| L33 | `strumenti/versione.mjs:167` | La data della versione è quella di Greenwich: fra mezzanotte e l’una (le due d’estate) è il giorno prima | la data locale |
| L34 | `progettazione/ascolti/` | Diciannove MP3 di ascolto, 60 MB, nella storia di git: il repository pesa 157 MB | solo da sapere |
| L35 | vari `.fav` | Nove risposte che non seguono lo stato: sotto il 18 % il sostegno costa 1 d’aria, mentre le altre traduzioni sono gratis (`traduci.fav:86`); il bassorilievo inciso dice ancora «un palmo di pietra nuda» (`memoria.fav:37`); l’eco «fa sempre la stessa domanda» dopo che la registrazione si è fermata (`equipaggio.fav:92`); con il risuonatore la culla «copre ogni eco», ma l’eco risponde (`equipaggio.fav:101`); nella fuga «ascolta la voce» si ripete uguale, anche dopo che la voce tace (`fuga.fav:89`); la cella usata nella fuga «restituisce il faro» che nessuno ha tolto (`aria.fav:69`); «[Accendi il Sintonizzatore.]» c’è anche senza averlo (`ponte.fav:201`); «ricarica la tuta» e «togli la tuta» fuori posto (`tecnica.fav:49`, `santamaria.fav:346`); nei comandi scritti «prendi il seme» davanti alla teca chiusa risponde `Non vedo 'il seme' qui.` (`vita.fav:153-159`) | toccano i `.fav`: decide l’autore |
| L36 | `santamaria.fav:222`, `fuga.fav:38`, `ponte.fav:193` | Tre regole che non scattano mai; la battuta di base del nodo «piccolo» non si raggiunge, e la sua presa registrata non suona mai | togliere, o rimettere in strada |
| L37 | `corridoio.fav:51`, `ingresso.fav:201` e `:247`, `memoria.fav:113` | Quattro frasi in seconda persona nel racconto («Se la muovi nella luce», «Quando ci passi sopra il guanto», «Dove la tocchi», «Prima prendilo.»): le prime tre possono essere un «tu» impersonale voluto | decide l’autore |
| L38 | `relitto-silente/README.md:27`, `aria.fav:21`, documenti 04 e 33, `collaudo/verosimili.py:19` | Due frasi che non sono più vere: «si muore solo portando il risuonatore» (si muore anche provando 49 volte a prenderlo) e «le uscite sbagliate non costano» (nella fuga tre uscite offerte costano 4 d’aria) | correggere i documenti |
| L39 | `ponte.py` (`APPUNTI`, `SOSPESI`) | Nel diario l’appunto «La nave trema…» entra un turno prima che il gioco lo dica; il sospeso della porta descrive i tre incavi prima che la porta sia stata guardata | spostare le due condizioni |
| L40 | `ponte.py:912`, `:953-957`, `:361` | Il ponte manda il suono della presa del groviglio anche a chi torna su da solo; se la fuga comincia con l’aria sotto il 30 non manda mai `protezione_fuga`; legge tre nomi interni del motore con un valore di ripiego, e se Favella1 li cambia l’atto, la mappa e gli appunti si guastano in silenzio | due condizioni; una prova che cada se i nomi spariscono |

## 6. Segnalate e non confermate

- **La pausa e i salvataggi fuori dal pannello sugli schermi piccoli.** Segnalata da un conto sui fogli di stile. Misurata nel browser a 1093 × 614, sulla Santa Maria: la pausa ci sta (512 px in 512, «Menu principale» dentro), il pannello dei salvataggi anche (i posti sono su tre colonne). Dentro il relitto, con la forma a membrana e la voce «Annulla», non l’ho misurata.
- **Le battute lunghe dell’Anziano tagliate nel dialogo a 1093 × 614**, senza un segno che c’è altro (`dialogo.css:65-66`). Calcolata, non misurata: da guardare nell’eseguibile.
- **Un errore nel disegno che ferma l’intro** quando il palco misura zero (`Intro.tsx:709-716`): il percorso nel codice c’è, ma non so se la finestra ridotta a icona porti davvero il palco a zero.
- **I cursori del mixer che non arrivano mai a zero** e lasciano numeri piccolissimi nei conti (`dsp.rs:395-398`): su alcuni processori possono costare qualche punto di un core. Serve una misura.
- **Un caricamento che cade a metà** (`ponte.py:1496-1497`): il ponte prende la partita nuova prima di ricostruire la cronaca; se la ricostruzione cadesse, la pagina direbbe che il caricamento non è riuscito con il motore già sull’altra partita. Nessuno è riuscito a provocarlo.
- **Due scritture insieme del posto automatico** quando un tasto si ripete (L13 con L23): l’avviso d’errore senza danno è dedotto, non visto.

## 7. Che cosa ho verificato e che cosa no

**Verificato**: tutte le prove, in locale e su GitHub; G1 nel browser, nel percorso reale; G2 sulle due righe e sull’uscita della prova degli eventi; G3, M23 e M24 rigiocate nel motore; le Opzioni (Gioco, Grafica, Audio), la plancia, la pausa e i salvataggi a 1280 × 720 e a 1093 × 614 (nessun testo sotto i 12 px, niente fuori dalla finestra); le righe di codice di M1–M8, M10–M14, M16, M17 e M22; il conto di M14; le dipendenze (`cargo audit`, `npm audit`); i canali dell’aggiornamento e l’ultima beta su GitHub; la chiave di firma e la sua copia (ci sono tutte e due); il backup; il motore contro il tag; i segreti nel repository e nella sua storia (nessuno).

**Non verificato**: niente è stato guardato né ascoltato nell’eseguibile (G1 compresa, che lì va solo confermata); M7, M9 e M15 sono dedotte dal codice e vanno misurate; M12 e M13 non sono state ascoltate; le misure di M22, M25 e M26 sono della sessione di lettura; Linux; un lettore di schermo vero nella modalità scritta.

**Decisioni note che restano aperte** (non sono difetti nuovi): la firma del codice per Windows (senza, l’installatore mostra l’avviso di SmartScreen; D17 del documento 06); la licenza della 1.0, «in definizione» dal 31 ottobre; Linux su una macchina vera; i numeri di versione.

## 8. L’ordine consigliato

1. **Subito**: G1 con la sua prova, e G2 (una riga nel ponte, e la prova che la tenga). Poi una partita nuova nell’eseguibile, per vedere G1 chiusa.
2. **Le decisioni dell’autore sul testo**, una per volta, perché toccano i `.fav`: G3 (il congedo), M22 (i segni della fuga), M23 (le tre chiavi), M24 («Est» nel santuario), poi L35 e L37. Con i percorsi nuovi di M26.
3. **Chi gioca con il mouse e vede poco**: M1, M2, M3, M4, M5, M6, con L2, L9 e L15. Una consegna.
4. **Il suono**: M12, M13, M14, con L21. Una consegna da ascoltare: un finale e subito i titoli; caricare mentre l’Anziano parla.
5. **La messa in sicurezza**: M18 (le due librerie e gli avvisi), M19 (il backup), M16 e M17 (i salvataggi), M25 (i salvataggi di prima).
6. **L’intro**: M7 prima di tutto, perché può essere parte di quello che nell’intro «non va»; M8 e M9 con le decisioni dell’autore.
7. **Il resto**: la modalità scritta (M10, M11), i documenti (M21 e le lievi dalla L25 alla L34, con L38), le lievi dell’interfaccia.

## 9. Le correzioni fatte

Le sezioni qui sopra sono la fotografia dell’11 novembre, e restano come sono. Con la revisione stessa sono fatte due cose di carta, tutte e due nel prompt 31: **M20**, la regola di guardare l’esito delle prove su GitHub a fine sessione; e la parte di **L28** che riguarda il prompt (la data, le due chiusure di sessione in ordine, il punto 1). Il resto del registro si scrive qui, come nel documento 25.

**G1 e G2, 11 novembre 2026** (scelte dall’autore: «Sì, correggile»), una voce per commit, tutte e due su GitHub:

- **G1** (`d5ca287`): ogni regola di `intro.css` sta sotto `.intro`, e `gioco.css` dice dove sta `.esplorazione` (`.palco > .esplorazione`, nel flusso). La prova nuova `app/prove/stili.test.ts` (cinque prove) cade sul foglio di prima: il foglio dell’intro vale solo dentro l’intro, il palco del gioco lo tocca solo il gioco, nessuna schermata caricata a parte ha regole che cominciano da un elemento. `strumenti/misure/testi.mjs` conta fuori dalla finestra «diario» e «menu» anche quando un contenitore li taglia. Prima di correggere ho controllato tutti i fogli di stile: l’unica classe dell’intro che toccava il gioco era `.palco`. Verificato nel browser dello sviluppo, nel percorso vero (`?nuova`: l’intro, saltata, e il gioco) a 1280 × 720, con il foglio dell’intro ancora nella pagina: «diario» e «menu» a 540 px, il ramo e i fili 1280 × 720, l’atto su una riga; e l’intro com’era (il palco, le bande, «Esc · salta», i testi). Nel foglio costruito non resta nessuna regola `.palco` senza `.intro`. **Non ancora guardata nell’eseguibile**: alla prossima consegna, una partita nuova.
- **G2** (`39f6f4a`): `_finale` nel ponte accetta la nota «riconosciuta» o «sonaglio», come `finali.fav`. `collaudo/eventi.py` legge il finale anche dal testo che il gioco scrive (una frase per finale, controllate su `finali.fav`) e lo confronta con quello che manda il ponte: il percorso `prima-nota-in-stiva` manda ora «prima-nota», e senza la correzione la prova cade. Con questo è chiusa anche una delle due prove deboli di M26.

Prove dopo le due correzioni: node 101 su 101, i tipi puliti, la pagina si costruisce; eventi, pulsanti, menu, diario, comandi scritti e salvataggi (553) verdi. Su GitHub le prove del commit `39f6f4a`, che porta tutte e due le correzioni, sono verdi (24 minuti; quelle del commit di G1 le ha fermate il push successivo, come sempre).
