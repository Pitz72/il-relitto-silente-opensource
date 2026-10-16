# Il Relitto Silente — la bibbia sonora

Documento 10 della progettazione · prima versione, 14 ottobre 2026 · seconda, 15 ottobre 2026: il suono tutto sintetizzato (§10) · terza, 16 ottobre 2026: il gioco che suona (§11) · quarta, 16 ottobre 2026: i tocchi dell’interfaccia (§11.4) · quinta, 16 ottobre 2026: la musica (§11.5) · sesta, 16 ottobre 2026: il filo del Sintonizzatore (§11.6)

Che cosa si sente in ogni stanza e in ogni evento del gioco, da quali registrazioni nasce e come si lavora. Vale insieme al §9 di `06-app-desktop.md` e al punto 3 del suo §17: suono credibile e realistico, registrazioni vere con licenza compatibile, la fisica giusta. Per l’intro vale il §5 di `09-intro-storyboard.md`. La musica (D14) è nel documento 21 (`21-la-musica.md`): qui compare solo dove tocca il resto del suono (§11.5).

## 0. In sintesi

- **Cinque strade.** Un suono arriva a William per l’aria, attraverso il guscio del casco, dalla cuffia della tuta, dentro il casco o per contatto, nelle ossa. Ogni suono ne prende una o più, e la fisica decide quali. Nel vuoto l’aria non c’è (§1.1).
- **Il re è la nota di casa.** Il reattore lo tiene sotto i piedi per tutto l’Atto I. Nel relitto non suona mai, finché non lo suona il sonaglio del Nido. Le macchine della Santa Maria si ripuliscono dalle note che litigherebbero con lui (§1.3).
- **Tutto sintetizzato, per ora (§10).** Il 15 ottobre 2026, ascoltato il prototipo fatto con le registrazioni, l’autore ha deciso che non andavano: niente suoni campionati, ogni suono si fa con il codice. Macchine, aria, metallo, acqua, ghiaccio, la tuta, il fiato e il brusio nascono da modelli fisici nel motore in Rust. Più avanti l’autore potrà portare suoni veri, generati o cercati da lui.
- **Il fiato è lo strumento dell’aria.** La cifra sul visore decide quanto spesso e quanto a fondo respiri (§5.1).
- **Sei silenzi diversi**, ognuno costruito (§1.5).
- **Le fonti.** Il §7 resta come strada possibile per il giorno in cui torneranno le registrazioni: Freesound in CC0, l’archivio Sonniss GDC, LibriVox, le registrazioni in casa. Oggi il gioco non usa nessun file: i dodici del prototipo sono usciti dal gioco e dai riconoscimenti, e restano in `audio/LICENZE.md` come storia.
- **Stato.** Il prototipo dei tre ambienti è stato fatto con le registrazioni (§8) e poi rifatto tutto in sintesi (§10): un motore in Rust con le cinque strade, il riverbero delle stanze, il fiato, la voce e il brusio, il metallo, l’acqua e il ghiaccio; gli ascolti sono in `progettazione/ascolti/` (i nuovi cominciano con 11).

## 1. I principi

### 1.1 Le cinque strade

| Strada | Che cosa porta | Com’è fatta | Quando c’è |
|---|---|---|---|
| **Aria** | il luogo: macchine, riverbero, passi, distanza | la stanza intera, in stereo | senza tuta |
| **Guscio** | l’aria del luogo che passa attraverso il casco chiuso | legge di massa del guscio (sotto): i bassi passano, gli acuti no | con la tuta, dove c’è un’atmosfera |
| **Cuffia** | i microfoni esterni della tuta, il brusio, il Sintonizzatore | banda di un apparato di comunicazione (150–7000 Hz), un poco compressa, con il suo fruscio di fondo | con la tuta; nel vuoto resta solo il suo fruscio |
| **Casco** | il fiato, la ventola, la pompa, i segnali del visore | asciutta, vicinissima, dentro una bolla di trenta centimetri | dalla vestizione alla fine |
| **Ossa** | quello che arriva per contatto: gli stivali, la rampa, il reattore toccato, i crolli, le vibrazioni delle stanze | sotto i 250 Hz, al centro, senza stereo | sempre |

**Il guscio, in numeri.** Un casco di policarbonato di due millimetri pesa circa 2,4 kg/m². Per la legge di massa, quanto isola cresce di 6 dB a ogni ottava: circa 3 dB a 125 Hz, 15 dB a 500 Hz, 21 dB a 1 kHz, 33 dB a 4 kHz. È un ordine di grandezza (un casco vero ha risonanze e la tenuta del collo), ma fissa il carattere: con il casco chiuso il mondo resta nei bassi. Per questo nella stiva «la stiva vuota rimbomba lo stesso»: il rimbombo è basso, e il guscio lo lascia passare.

**Le ossa.** Il corpo porta bene le basse frequenze e male le alte. Con le orecchie chiuse dalla cuffia, i suoni del proprio corpo (il passo, la deglutizione, il colpo degli stivali) crescono sotto i 500 Hz di 10–20 dB (l’effetto di occlusione). Le ossa non si spengono: restano con la protezione vitale, nel vuoto e nell’ipossia.

**La cuffia.** Il gioco la nomina come la strada dei suoni di fuori: un gemito «che ti arriva nei denti prima che nelle cuffie». Le ossa arrivano prima, la cuffia dopo, per qualche decimo di secondo. La protezione vitale spegne la cuffia («stacca i canali secondari»): il mondo resta solo attraverso il guscio, attutito, e il fiato si fa più vicino.

### 1.2 Il vuoto, e l’aria che torna

- Nel vuoto non arriva niente per aria. Sullo scafo esistono solo il casco e le ossa.
- I testi lo dicono già, e il suono li segue alla lettera: «Finché tieni un piede sulla rampa senti il reattore nelle ossa; sullo scafo nero, più niente.» La taglierina sulla giuntura: «Nessuna scintilla», e il lembo si piega «senza un suono». Nel vuoto la taglierina è solo la sua vibrazione nel guanto.
- Il passaggio dall’aria al vuoto si sente. Quando il boccaporto si svuota, il suono delle pompe cala con la pressione (a un decimo di atmosfera circa −20 dB, a un centesimo −40) e perde gli acuti prima dei bassi, finché resta solo quello che passa per contatto.
- Nel relitto c’è un’atmosfera, fredda e ferma. La rivela il «sibilo appena percepibile» della porta interna, che è l’aria della nave che entra nella camera; la confermano la serra «secca come carta» e la gola «umida». Da quel sibilo in poi esiste di nuovo una strada per l’aria (attraverso il guscio e la cuffia).
- Nell’aria molto secca gli acuti si spengono prima: i riverberi della serra sono più scuri di quelli della gola umida.

### 1.3 Il re, e la sua assenza

- Il re del reattore è re₂, 73,416 Hz, con otto armonici e due banchi appena scordati che battono lentamente. È già nel prototipo, in `app/src-tauri/src/audio.rs`. L’altezza non cambia mai, perché il testo dice «una nota sola, tenuta, che non cambia mai»; cambiano il volume, il timbro e i battimenti.
- Sulla Santa Maria nessun altro suono deve avere un’altezza che litighi con il re. Le registrazioni di macchine si puliscono dai toni di rete (50 e 60 Hz con le armoniche) e dai giri dei motori, con filtri notch stretti.
- Nel relitto il re non c’è. L’orecchio del giocatore lo ha avuto sotto i piedi per tutto l’Atto I, e adesso gli manca. Quando il sonaglio del Nido suona il suo re, l’orecchio lo riconosce prima della frase.
- Il sonaglio suona re₅, 587,33 Hz: esattamente l’ottavo armonico del reattore. Quando la nota è «riconosciuta», ogni volta che il re del reattore torna (la stiva e la plancia della fine) il suo ottavo armonico è un poco più forte. È così che il re «risuona in due».
- **Deciso con la musica (D14, 06 §18).** Le macchine del relitto girano intorno al sol diesis, a un tritono dal re: la distanza più grande che ci sia fra due note. Il generatore, i pilastri dell’archivio e il «clic armonioso» stanno lì. La nave suona lontana da casa, e il re del sonaglio, in mezzo a lei, è un’anomalia che si sente. L’Anziano dice che sono stati «la prima nota di qualcosa»: la musica dell’Anziano va dal sol diesis al re.

### 1.4 Vero, e sintetico dove serve

- **Registrazioni vere** per tutto quello che esiste nel mondo: macchine, ventilazione, metallo, acqua, ghiaccio, polvere, pietra, la tuta, il fiato.
- **Sintesi** per il re, che è una nota e deve restare esatta, e per i segnali del visore, che sono elettronica.
- **Il brusio** è un caso a sé: nasce da voci vere (LibriVox, pubblico dominio) e passa da un motore granulare che le smonta in frammenti più corti di una sillaba. Nessuna parola sopravvive (§5.2).
- **Niente suoni generati dall’IA.** Il realismo che l’autore chiede passa da microfoni veri. Anche il divieto della licenza Sonniss (§7.1) va in questa direzione.

*Il 15 ottobre 2026 questo paragrafo è superato dal §10: per decisione dell’autore, per ora anche quello che esiste nel mondo si sintetizza, con modelli fisici scritti nel codice. La sintesi non è un suono generato dall’IA: è fisica in forma di programma.*

### 1.5 I sei silenzi

| Dove | Che silenzio | Come si costruisce |
|---|---|---|
| sullo scafo | il vuoto | il casco e le ossa, nient’altro; nessun fondo di stanza |
| nell’arca biologica | il gelo delle capsule spente | nessuna macchina; un fondo bassissimo; ogni tanto la brina che scricchiola, lontana |
| nell’alloggio | «un silenzio da chiesa vuota» | il riverbero di una chiesa vuota, che solo il tuo passo eccita |
| nel santuario del silenzio | la memoria «quando le parole finiscono» | il fondo più basso del relitto e un riverbero di dieci secondi che aspetta |
| nell’anticamera | un buio «che assorbe invece di mancare» | anecoico: nessun riflesso, nessun passo; dopo un poco, il cuore e il fischio sottile del proprio orecchio |
| nel santuario centrale | il silenzio «di qualcosa che aspetta da molto tempo di essere ascoltato» | quasi niente, ma vivo: la stanza respira lentissima, al limite dell’udibile |

Il silenzio vero non esiste: c’è sempre almeno il casco. Quello che cambia è il fondo intorno, e il fondo si progetta come uno strato.

### 1.6 Il tempo e i turni

- Il gioco va a turni, il suono no: gli ambienti vivono in tempo reale anche mentre il giocatore legge.
- Gli eventi partono con il testo del turno. Un suono può anticipare il testo di 100–150 ms, mai seguirlo.
- Niente si ripete uguale due volte di seguito: ogni evento ha più varianti, ogni fondo ha strati di lunghezze diverse (per esempio 47, 61 e 83 secondi) che si riallineano solo dopo ore.
- Il caso dell’audio è separato da quello del gioco: non tocca i salvataggi né il collaudo.
- Gli eventi si riconoscono dal cambio di stato fra prima e dopo il turno (l’aggancio che passa da «lontano» a «fatto», la nota da «ignota» a «sonaglio»). Il testo della risposta non si usa: è fragile. Dove lo stato non cambia (ascolta il reattore, la seconda volta) basta il comando. Per farlo il ponte deve esporre qualche stato in più (§2.4).

### 1.7 I livelli

- **Fondi:** ogni strato si normalizza a −28 LUFS integrati prima del missaggio. Una stanza calma, tutta insieme, sta intorno a −24 LUFS.
- **Il fiato:** il primo piano del gioco, intorno a −22 LUFS da calmo, fino a −14 nella fuga.
- **Eventi:** fino a −12 LUFS momentanei. I più grandi (la Grande Porta, il generatore, i crolli) arrivano a −8. Il picco reale resta sempre sotto −1 dBTP.
- **Dinamica ridotta:** un’opzione per chi gioca piano o di notte, con un compressore sul canale generale (3:1 sopra −30 dBFS) che alza i suoni piccoli.

## 2. L’architettura del mix

### 2.1 Canali e strade

Il §9 del 06 fissa cinque canali con il loro cursore: generale, ambienti, musica, effetti, voci. Le strade del §1.1 sono un’altra cosa: non decidono il volume, decidono come il suono si trasforma. In `kira` ogni strada è una traccia con i suoi effetti, e dentro ogni strada stanno le sotto-tracce dei canali. Così il cursore degli ambienti abbassa gli ambienti su tutte le strade insieme.

```
generale   filtro dell’ipossia · compressore della dinamica ridotta
├─ aria    riverbero della stanza                       ambienti · effetti
├─ guscio  legge di massa del casco                     ambienti · effetti
├─ cuffia  banda 150–7000 Hz · compressione · fruscio   ambienti · effetti · voci
├─ casco   la bolla (risposta all’impulso di un casco)  effetti
├─ ossa    passa-basso 250 Hz · mono                    ambienti · effetti
└─ musica                                               musica
```

L’interfaccia va negli effetti. Il brusio e il Sintonizzatore sono voci. Il fiato è un effetto, perché deve restare anche con gli ambienti a zero. La radio di bordo esce dall’altoparlante della plancia: è aria, con la banda stretta di una radio.

### 2.2 Le scene del mix

Le atmosfere del §5 del 06 diventano scene: i volumi e i filtri delle strade, con un tempo di passaggio.

| Scena | Quando | Aria | Guscio | Cuffia | Casco | Ossa | Passaggio |
|---|---|---|---|---|---|---|---|
| **Santa Maria** | Atto I, senza tuta | piena | — | — | — | piena | — |
| **Visore** | tuta indossata, a bordo | — | piena | — | pieno | piena | 2,5 s, sul blocco del casco |
| **Vuoto** | scafo; camera prima della porta | — | — | solo il suo fruscio | pieno | piena | 6–8 s, con il boccaporto |
| **Relitto** | dalla porta interna | — | −8 dB | piena | pieno | piena | 3 s, sul sibilo |
| **Protezione vitale** | aria sotto 30, prima della fuga | — | piena | spenta | pieno, il fiato +2 dB | piena | 1,2 s, sui relè |
| **Fuga** | dal congedo dell’Anziano | — | −8 dB | piena | pieno | +6 dB | 2 s |
| **Ipossia** | aria al massimo 15 | filtro su tutto | | | | | segue la cifra |
| **Anticamera** | nell’anticamera | — | senza riverbero | senza riverbero | asciutto | piena | 4 s |
| **Casa** | il casco tolto nella stiva | piena | — | — | — | piena | la pressione che si pareggia |

**L’ipossia** è un filtro sul canale generale: un passa-basso che scende da 9 kHz (aria a 15) a 2,5 kHz (aria a 1), e lo stereo che si stringe fino al 30%. Il fiato si spezza (§5.1). Il gioco scrive in quel momento «ragioni più piano, e la cosa non ti spaventa»: niente avverte del pericolo, e nemmeno il suono lo fa.

### 2.3 Lo spazio

- **Senza tuta** il mondo è in stereo vero, con la profondità della stanza.
- **Con la tuta** i microfoni della cuffia sono due, ai lati del casco: lo stereo resta, più stretto e più vicino. Il brusio invece entra direttamente nella cuffia: sta al centro, dentro la testa, ed è questo che lo rende diverso da ogni suono di fuori.
- **Il risuonatore portato** si sente dalla mano: un poco a destra e in basso, sempre, in ogni stanza.
- **Il mono** (opzione) somma i canali e conserva le differenze di volume, così il risuonatore resta riconoscibile anche con un orecchio solo.

### 2.4 I segnali dal ponte

Il ponte manda già al suono la stanza, l’aria, la tuta, la protezione, la fuga, l’ingresso, il contatto, l’energia, l’inventario e il dialogo (`_stato()` in `app/src/motore/ponte.py`). Per il suono servono anche: il faro del casco (pieno o basso), il bengala, la minaccia e il groviglio delle teche, la teca della serra, il seme, l’archivio, la nota, l’aggancio e la scansione, la porta interna, la porta circolare, la proiezione, la grande porta. Il ponte è dell’app, non del motore: si estende nella fase 4 senza toccare `motore/` né i `.fav`.

### 2.5 Accessibilità

- Ogni informazione che porta il suono è anche nel testo o sul visore. Nessun suono è l’unico segnale (la stessa regola del colore).
- Cinque cursori e un muto; il mono; la dinamica ridotta.
- **Riduci i suoni intensi:** limita le ossa e i bassi profondi a −12 dB, toglie i picchi degli eventi più grandi, toglie il battito e il fischio dell’anticamera. È per chi soffre di acufeni, di emicrania o di ansia da suoni forti.
- Nessun suono ripetuto più veloce di quattro volte al secondo, tranne i tic del visore nelle discese brusche (dieci in 0,6 s), che restano bassi.

## 3. Le stanze

Per ogni stanza: gli strati con la loro strada, la fonte e la lavorazione; le varianti di stato; il riverbero (RT60); i passi. Le sigle delle fonti (P1, C5, V2…) rimandano al §8. «Da cercare» vuol dire che la fonte è indicata per tipo nel §7.2 e va scelta.

### Atto I — la Santa Maria

#### 3.1 Plancia

*Cabina piccola, piena di superfici: RT60 0,4 s. Passi: lamiera, con la gomma delle suole.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il re attraverso il pavimento | ossa, aria | sintesi | passa-basso 180 Hz; −12 dB rispetto alla sala macchine; la risonanza del pavimento a 120 Hz |
| la ventilazione | aria | P2 | notch su 50, 100, 150 Hz; il colore di una bocchetta piccola (picco a 2,5 kHz) |
| le console | aria | da cercare: ronzio di apparecchi, relè | bassissime; un relè ogni 20–40 s |
| le lamiere | aria | P3, C6 | i tic del metallo che si dilata, uno ogni 15–60 s, mai regolari |

- **La spia della prossimità non suona.** «Il suono l’hai tolto subito; la spia no»: nessun allarme, mai.
- **Accostata:** «Il reattore abbassa il suo lamento». Il re perde 6 dB e gli armonici sopra il quarto perdono 12 dB. L’altezza resta ferma.
- **Agganciata:** «ogni minuto così costa reattore». I battimenti del re si fanno più fitti (lo scarto dei banchi passa da 0,11·n a 0,2·n Hz), come una fatica. Dalla radio, ogni 30–90 s, «un fruscio che non è statica»: il brusio in banda radio, bassissimo, per 4–10 s.
- **Il risveglio della fine:** la plancia di sempre, e «il radar batte il vuoto e ridà vuoto». Il radar non ha suono: non l’ha mai avuto.

#### 3.2 Cuccetta

*Poco più di un corridoio, coperte e materassi: RT60 0,25 s, morbido. Passi: lamiera coperta da un tappeto di gomma.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il re, lontano | ossa | sintesi | passa-basso 150 Hz, −30 dB rispetto alla sala macchine |
| la bocchetta | aria | P2 | più bassa e più vicina che in plancia; un leggero fischio |
| la nave che si assesta | aria | P3 | rarissima: uno scricchiolio ogni due minuti |

È il posto più quieto della Santa Maria, e il più umano. Il registro ha le sue pagine di carta spessa, e la chiavetta d’ottone che scivola fra le pagine.

#### 3.3 Sala macchine

*Stretta, metallo, il cilindro che occupa tutto: RT60 0,8 s, con le risonanze del metallo. Passi: la «scaletta stretta» all’entrata e all’uscita, poi grigliato.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il re pieno | aria, ossa | sintesi | tutti gli armonici, fino a 2 kHz |
| le pompe e il fluido | aria | P1 | notch sui toni dei motori; −6 dB sotto i 120 Hz, per lasciare il re da solo |
| le tre toppe | aria | P3 | il cilindro è «rattoppato in tre punti»: tre vibrazioni metalliche che si accendono quando il quarto armonico (re₄) le eccita, a ondate lente |
| il caldo fermo | — | — | nessuna ventilazione: l’aria è «calda, ferma». È l’unica stanza della nave senza ventola |

- **Ascolta il reattore:** il mix toglie per otto secondi tutto il resto (le pompe −12 dB) e lascia la nota sola. Con la nota già sentita nel sonaglio, l’ottavo armonico emerge appena.
- **Tocca il reattore:** la vibrazione «sale per il braccio fino ai denti». Il re cresce di 9 dB nelle ossa per tre secondi.
- **La cassetta:** la chiavetta nella serratura piccola, e «il coperchio si alza con il suo cigolio di sempre».

#### 3.4 Stiva

*Vuota, di lamiera, lunga fino alla paratia di poppa: RT60 2,8 s, con echi a pettine fra le pareti parallele. Passi: il passo che «rimbomba fino alla paratia di poppa».*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il re attraverso lo scafo | ossa, aria | sintesi | passa-basso 300 Hz, −18 dB |
| il vuoto della stiva | aria | P2 | la ventilazione lontana, con il riverbero lungo |
| i ganci | aria | da cercare: catene e ganci d’acciaio | otto file di ganci vuoti. Fermi, di solito; dopo l’urto dell’aggancio oscillano e tintinnano per un minuto |
| il boccaporto | aria | P3 | una spia non fa rumore; il portello sì, quando lo si usa |

- **Con la tuta:** «Dentro la tuta il respiro ti torna addosso, più vicino, e la stiva vuota rimbomba lo stesso». Scena Visore: il fiato in primo piano e il rimbombo attraverso il guscio, che lascia passare i bassi.
- **Nella fuga:** la stiva della fine, «con la sua luce gialla di servizio», è la stanza della casa: il casco tolto, l’aria piena, il re che torna (§4.6).

### Atto II — l’ingresso

#### 3.5 Scafo

*Il vuoto: nessun riverbero, nessun fondo. Passi: i magneti degli stivali, un colpo sordo a ogni appoggio e uno strappo a ogni distacco, solo per le ossa.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il fiato, la ventola, la pompa | casco | C1–C5 | §5.1 |
| gli stivali | ossa | C6, P3 | passa-basso 800 Hz; il colpo arriva al ginocchio, non all’orecchio |
| il cavo di sicurezza | ossa | da cercare: un mulinello a cricchetto | si srotola a scatti dalla cintura quando cammini |
| il re della rampa | ossa | sintesi | presente solo vicino al boccaporto: si spegne in 1,5 s quando ti allontani, «più niente» |
| il canale della tuta | cuffia | sintesi | un fruscio elettronico a −60 dBFS: la cuffia è accesa, ma fuori non c’è niente da sentire |

- **Dopo il taglio:** l’apertura buia. Nessun suono: nel vuoto un buco non fa rumore.
- **Nella fuga:** «Lo scafo nero trema sotto i magneti degli stivali, e le funi degli arpioni vibrano come corde tese». Le ossa portano il tremito. Le funi si sentono solo quando la mano le stringe: allora arrivano per il guanto, come le corde di un basso enorme, sotto i 60 Hz, con battimenti. Vicino alla rampa il re torna nelle ossa: è la prima cosa di casa.

#### 3.6 Camera di compensazione

*Bassa, tonda, «senza un angolo»: RT60 0,5 s quando c’è aria. Prima della porta interna è vuoto. Passi: per le ossa, su una superficie che non è metallo.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il casco | casco | C1–C5 | |
| la camera | ossa | — | niente, nel vuoto; il «clac sordo» della porta arriva per il pavimento |
| dopo il sibilo | guscio, cuffia | da cercare: un soffio d’aria vero, bassissimo | l’aria che entra; poi il fondo freddo del relitto |

- **Il varco che si richiude.** Il lembo si chiude senza suono, e lo strappo del cavo arriva alla cintura: un colpo secco e piccolo, nelle ossa. Il fiato si ferma un istante (il respiro di sorpresa del §5.1).
- **La porta interna:** «Con un sibilo appena percepibile la porta si ritira nella parete». È l’aria della nave che entra: da qui nasce la scena Relitto. Un soffio di brusio arriva nella cuffia per due o tre secondi, «prima ancora che tu entri», e si ritira. Nel vestibolo, al primo contatto, la cuffia ha di nuovo «soltanto il tuo fiato».
- **Nella fuga:** «La camera trema» e sopra si apre il varco. Il vuoto torna a metà, dall’alto: la cuffia perde il fondo dell’aria man mano che sali.

#### 3.7 Vestibolo delle gole

*La prima sala vera, bassa e tonda, con tre bocche nella parete: RT60 1,2 s. Passi: duri e un poco cavi, come su un osso grande.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il brusio | cuffia | V1 (§5.2) | dal risuonatore nella nicchia, e più forte dalla gola di mezzo («è da lì che il brusio sale più forte») |
| l’aria ferma e fredda | cuffia | — | quasi niente: il fruscio della cuffia e del casco fa da fondo |
| la gola crollata | cuffia | V3, da cercare: detriti | ogni tanto un granello che scivola, uno scricchiolio |
| la nave che si assesta | ossa, cuffia | V3 | §4.3, gli assestamenti |

- **Il brusio ha due sorgenti:** la nave intera, che «non smette», con il punto più forte nella gola di mezzo; e il risuonatore, dovunque sia (nella nicchia, nella tua mano, posato in una stanza). Staccato il risuonatore, nel vestibolo resta solo la gola.
- **Nella fuga:** la gola larga crollata. Se il risuonatore è rimasto nella nicchia, «il brusio sale, uguale a sempre».

#### 3.8 Gola di mezzo

*Stretta, irregolare, «cresciuta per conto suo»: RT60 0,6 s con riflessioni vicinissime. Passi: a scatti, con il fiato che si sente di più nelle strettoie.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il brusio, più forte | cuffia | V1 | +4 dB rispetto al vestibolo, più denso |
| il freddo umido dal basso | cuffia | V2 | gocce rade e lontane, sotto |
| un filo d’aria | cuffia | da cercare: vento in un tubo, lontano | appena udibile, sale dal basso |

- **Nella fuga:** «La gola di mezzo trema e si stringe». Le venature si accendono tutte insieme «di un verde malato»: un crepitio lungo e diffuso (V3).

#### 3.9 Sala delle teche

*Vastissima, piena di teche alte il doppio di te: RT60 3 s, ma diffuso dalle teche. Passi: il pavimento vuoto, poi i filamenti sotto gli stivali.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il groviglio | cuffia, ossa | da cercare: corde e alghe bagnate, cuoio, tubi di gomma | §5.6: si muove con il faro |
| le teche chiuse | cuffia | V3 | la brina: tic di ghiaccio lontani lungo le pareti |
| il nodo di fibre, a est | cuffia | da cercare: vento fra canne | «senti un’aria che si muove»: solo se ti fermi vicino al nodo |

- **Faro pieno:** il groviglio sente la luce e viene verso di te. Fruscio umido che cresce e si moltiplica; uno ti sfiora lo stivale, nelle ossa.
- **Faro basso:** il groviglio «si è fermato a mezz’aria e cerca». Fruscii radi, lenti, intorno, che non si avvicinano.
- **Il bengala:** tutto il groviglio va verso il «finto sole». Un fruscio massiccio che si sposta verso il centro della sala, e la strada libera intorno a te.
- **L’energia:** «Il campo regge a tratti». Un ronzio elettrico che passa e ripassa lungo le file; dove passa, il groviglio si piega e tace.
- **Dalla parte del vivaio** («la sala si vede al contrario»): lo stesso, con il groviglio fra te e la gola.
- **Nella fuga:** il groviglio sveglio, «a frustate molli e cieche», dappertutto.

#### 3.10 Vivaio

*Basso e tiepido, «il primo posto caldo»: RT60 0,5 s. Passi: morbidi.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il germinatoio | cuffia | da cercare: una pompa d’acquario che lavora a fatica | «Respira piano»: un ritmo lento e irregolare, come un fiato |
| il tepore | cuffia | — | il fondo più caldo del relitto: niente acuti freddi, il fruscio più basso |
| il groviglio, di là | cuffia | come nelle teche | «È verso questo calore che il groviglio, di là, preme da secoli»: un fruscio lontano contro la parete est |

### Atto III — il corridoio e le ali

#### 3.11 Corridoio principale

*Immenso, «le pareti curve che salgono fino a perdersi nel buio»: RT60 7 s, con gli acuti che muoiono prima. Passi: radi e lunghi, che tornano indietro dal buio.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| l’aria ferma | cuffia | — | «L’aria non si muove»: nessun vento, il fondo più grande e più vuoto del relitto |
| il brusio, lontano | cuffia | V1 | sale dalla gola larga, a est, con il riverbero del corridoio |
| la luce delle pareti | — | — | la luce non fa rumore |
| gli assestamenti | ossa, cuffia | V3 | qui suonano più grandi che altrove |

- **Il montacarichi:** un movimento liscio, senza ingranaggi. Un sospiro idraulico e un peso che scende, nelle ossa.
- **La Grande Porta aperta:** il passaggio verso il Ponte è un poco più chiaro nel riverbero (si apre uno spazio nuovo).

#### 3.12 Santuario del silenzio

*Circolare, «il soffitto così alto che il faro non lo trova»: RT60 10 s. Passi: ogni passo resta nell’aria a lungo, e per questo cammini piano.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il fondo | cuffia | — | il più basso di tutto il relitto, dopo l’anticamera |
| la luce bianca | — | — | non fa rumore |

- **L’altare:** «un colpo profondo» dall’interno della pietra, e la sezione che si ritira «senza rumore» (§4.3).

#### 3.13 Scriptorium

*Biblioteca circolare: RT60 2 s. Passi: su pietra levigata.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| i proiettori | cuffia | da cercare: ronzii di piccoli apparecchi | uno per nicchia, intorno, ognuno appena diverso dagli altri: insieme battono, come un coro elettrico lentissimo |
| il proiettore rotto | cuffia | da cercare: scintille elettriche | «fa soltanto scintille»: crepitii brevi e irregolari dalla nicchia a nord |

- **Il disco liberato:** il meccanismo molla la pietra e le scintille smettono. «Il proiettore resta spento».

#### 3.14 Arca della memoria

*Una caverna di cristallo nero: RT60 4 s, con un riverbero vetroso. Passi: duri, che squillano appena.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| l’ultimo pilastro | cuffia | da cercare: un ronzio elettrico | pulsa con la luce ambrata, «intermittente, come se aspettasse qualcosa»; intorno al sol diesis (§1.3) |
| i pilastri incrinati | cuffia | da cercare: vetro sotto sforzo | tic di cristallo, radi |

- **Forzato:** il terminale «sfrigola», poi la scintilla dell’ultimo pilastro, «più forte delle altre», e il suo ronzio muore. Da quel momento la caverna è muta: nessun ronzio, mai più.
- **Salutato:** il pilastro «si accende per intero». Il ronzio a intermittenza diventa continuo e caldo.

#### 3.15 Arca biologica

*Lunga e gelida, capsule «a perdita di luce»: RT60 5 s. Passi: «Una brina sottile copre tutto e non prende impronte»: i passi non scricchiolano, sono ovattati e sbagliati.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| nessuna macchina | — | — | «I sistemi vitali sono spenti»: nessun ronzio |
| la brina | cuffia | V3 | tic di ghiaccio, rarissimi, lontani |
| il fondo del gelo | cuffia | — | il fruscio della cuffia, appena più acuto: l’aria fredda e secca |

Il respiro si condensa sul vetro: il suono del fiato non cambia, cambia l’immagine. È il silenzio delle capsule, che l’Anziano distingue dal suo.

#### 3.16 Serra morente

*Una cupola vasta, l’aria «secca come carta»: RT60 3 s, scuro, perché l’aria secca si mangia gli acuti. Passi: soffici, nella polvere grigia.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| la vibrazione | ossa | sintesi, su una base registrata a contatto | «Una vibrazione bassa attraversa la stanza, più nelle ossa che nell’aria»: un battito lento sotto i 60 Hz, il ritmo del seme (lo stesso battito che nell’intro passa dalla spia alla cosa viva) |
| le piante secche | cuffia | da cercare: felci e foglie secche | crepitano solo se le sfiori |
| la polvere | cuffia | da cercare: sabbia fine | un fruscio sottilissimo, quando la smuovi |

- **La teca aperta:** «La vibrazione cessa di colpo, e la serra diventa silenziosa del tutto». Le ossa si spengono di netto, e anche il fondo della cuffia scende di 6 dB. È uno dei pochissimi tagli secchi di tutto il gioco.
- **L’uomo in tuta:** nessun suono nuovo. Il fiato si ferma per un respiro.

#### 3.17 Laboratorio di risonanza

*Il ventre della nave, macchinari massicci: RT60 1,5 s. Passi: su una superficie che vibra.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| la statica | casco | da cercare: scariche elettrostatiche | «la senti pizzicare sotto il casco»: crepitii piccoli, dentro il casco |
| le interferenze | cuffia | da cercare: disturbi radio veri | «il multiscanner crepita di interferenze» |
| la luce irregolare | cuffia | da cercare: un ronzio elettrico | un tic che segue il pulsare irregolare del banco |

- **L’energia:** «Con un rombo che sale, i macchinari si svegliano dopo secoli». Poi «archi di elettricità corrono fra le bobine» e «L’aria vibra»: un ronzio denso, intorno al sol diesis (§1.3).

#### 3.18 Alloggio dell’equipaggio

*Tonda, alcove a nido d’ape: RT60 3,5 s, caldo, «un silenzio da chiesa vuota». Passi: ogni passo risuona come in una navata.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il fondo | cuffia | — | quasi niente, e il riverbero di una chiesa che solo il tuo passo eccita |

#### 3.19 Nido

*Una cella piccola, a misura di qualcuno più piccolo: RT60 0,3 s, morbido. Passi: corti, perché la stanza è corta.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il fondo | cuffia | — | il più intimo del relitto |
| il sonaglio | cuffia | da registrare (§5.4) | solo quando lo suoni |
| l’eco del Piccolo | voci | V1 | solo con il Sintonizzatore (§5.3) |

### Atto IV — il Ponte

#### 3.20 Ponte di comando

*Vasto, tondo, una cupola di cristallo nero: RT60 4,5 s, brillante. Passi: lunghi, sotto la cupola.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il fondo | cuffia | — | «al buio e muta»: il fondo del corridoio, più chiuso |

- **La postazione:** «Un’ondata di energia silenziosa attraversa la sala». È silenziosa, quindi non si sente niente. Per un attimo il mix si svuota (il fondo −6 dB) mentre la luce riempie lo schermo.
- **La porta tonda:** tre scatti e «Un clic armonioso» (§5.5); poi la porta si apre «senza attrito», cioè in silenzio.

#### 3.21 Anticamera

*Anecoica: nessun riverbero. Passi: nessuno. «I tuoi passi non fanno rumore, e non sai se è il pavimento o se hai smesso di farne tu».*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il fiato | casco | §5.1 | più asciutto che altrove: la bolla del casco perde anche i suoi riflessi |
| il cuore | ossa | da registrare o da cercare: un battito cardiaco | dopo dieci secondi, appena udibile; si toglie con «riduci i suoni intensi» |
| il fischio dell’orecchio | casco | sintesi | dopo venti secondi, un tono sottile e altissimo, bassissimo di volume: è quello che si sente davvero in una camera anecoica; si toglie con «riduci i suoni intensi» |

#### 3.22 Santuario centrale

*Piccolo, le pareti che convergono in alto: RT60 2,5 s. Passi: pochi; il giocatore si ferma.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| la stanza che aspetta | cuffia | da cercare: il fondo di una sala grande e vuota | un respiro della stanza lentissimo, un periodo di 9–12 s, al limite dell’udibile |
| l’Anziano | musica | D14 | §4.5 |

- **Nella fuga:** «La stanza trema». Le linee del pavimento si spengono (la luce non suona) e il pavimento si apre su una gola: pietra che si spacca, polvere.

### Atto V — la fuga

#### 3.23 Gola del ritorno

*Ripida, nera, che trema: RT60 0,8 s, stretta. Passi: in discesa, sul materiale che si sbriciola.*

| Strato | Strada | Fonte | Lavorazione |
|---|---|---|---|
| il tremito | ossa | da cercare: frane, crolli a contatto | continuo, con i crolli del §4.6 |
| la polvere | cuffia | da cercare: sabbia fine che cade | «dalle pareti cade una polvere fine» |
| il groviglio, davanti | cuffia | come nelle teche | «In fondo, a ovest, senti un fruscio che conosci» |
| le luci del Navarca | cuffia | sintesi, su un crepitio vero | se le alcove sono svelate le venature si accendono una dopo l’altra, e ognuna fa un crepitio elettrico freddo che corre avanti a te |

Sotto il 15% d’aria il testo si riduce a «Gola. Buio. Il fruscio, in fondo. Ovest.», e il suono fa lo stesso: restano il fiato, il fruscio e il tremito.

## 4. Gli eventi

Ogni evento ha il suo testo nel gioco. La colonna «Strade» dice come arriva; le fonti sono per tipo (§7.2) o per sigla (§8).

### 4.1 Atto I

| Evento | Quando | Che cosa si sente | Strade |
|---|---|---|---|
| **La scansione lunga** | analizza la massa | il computer «se la prende comoda»: dischi e relè che lavorano, si fermano, ripartono, tre volte. Poi un segnale sordo di due note: MATERIALE NON IN ARCHIVIO | aria |
| **L’accostamento** | accosta | «a spinte corte»: dentro una nave i propulsori si sentono come colpi sordi nella struttura, non come getti (lo raccontano gli astronauti). Il re che abbassa il lamento | ossa, aria |
| **Gli arpioni** | spara | «Due colpi sordi, che senti nelle ossa più che nelle orecchie». I cavi che volano: niente, fuori è vuoto. Il morso che torna lungo il cavo come un tonfo lontano. Il verricello «a strappi corti». «Un urto lungo che fa tremare la plancia»: lo strofinio lungo di due scafi | ossa, aria |
| **La radio con Yusuf** | parla con Yusuf | lo squelch, il canale aperto. Dietro, Magazzino Quattro: «un muletto in retromarcia, qualcuno che litiga con una bolla di carico». «La linea fa il suo schiocco». Nessuna voce recitata (D18): la voce di Yusuf è il testo | aria, dall’altoparlante, in banda radio |
| **Il registro** | esamina il registro | pagine di carta spessa; la chiavetta d’ottone fra le pagine | aria |
| **La cassetta** | apri la cassetta | la chiavetta nella serratura; «il coperchio si alza con il suo cigolio di sempre» | aria |
| **Il reattore ascoltato** | ascolta il reattore | otto secondi di re da solo (§3.3) | aria, ossa |
| **Il reattore toccato** | tocca il reattore | il re nelle ossa, +9 dB per tre secondi | ossa |
| **Il kit** | apri il kit | due chiusure a scatto di una valigetta di metallo; la gommapiuma | aria |
| **La vestizione** | indossa la tuta | «Strato su strato»: tessuto tecnico, chiusure, guarnizioni, l’anello del casco che si blocca. La tuta che si pressurizza: un soffio breve, le orecchie che sentono la pressione. Il visore si accende con un segnale; il faro con il suo scatto; la ventola parte. Il mondo passa dall’aria al guscio in 2,5 s, sul blocco del casco | aria → guscio, casco |
| **Il faro del casco** | alza o abbassa | la ghiera a scatti, quattro o cinque fermi | casco |
| **La cella di riserva** | usa la cella | lo sgancio della cella esausta, l’innesto della nuova, «La valvola sibila», e la cifra che risale con un tic per punto | casco, ossa |
| **Il boccaporto** | fuori, con l’aggancio | il portello interno che si chiude; le pompe che svuotano il boccaporto, e il loro suono che muore con la pressione (§1.2); il portello esterno che si apre nel silenzio, e lo senti solo nelle mani | aria → ossa |
| **Il rientro** | entra nel boccaporto | il contrario: la pressione che torna, il sibilo che cresce, il re che riappare dal pavimento | ossa → guscio |

### 4.2 Atto II

| Evento | Quando | Che cosa si sente | Strade |
|---|---|---|---|
| **Lo scafo analizzato** | analizza lo scafo | il motorino e i relè del multiscanner arrivano per la spalla; i segnali dei dati, nel casco | ossa, casco |
| **La giuntura tagliata** | taglia la giuntura | la taglierina, nel vuoto, è solo il ronzio nel guanto. Quando il materiale «si ritira dal getto», il ronzio si fa irregolare. Il lembo si piega «senza un suono» | ossa |
| **La discesa** | entra nella giuntura | il bordo sotto gli stivali; «Il tremito del reattore, che ti saliva dalle suole, non c’è più»: il re scende a zero in 1,5 s | ossa |
| **Il varco che si richiude** | arrivo nella camera | §3.6 | ossa, casco |
| **Il pannello acceso** | batteria o tuta sul pannello | il connettore nell’incavo. Con la tuta, la cifra che scende di dieci in un colpo: dieci tic in 0,6 s. «Dalla porta arriva un clac sordo»: nel vuoto arriva per il pavimento | ossa, casco |
| **La porta interna** | apri la porta | il sibilo, l’aria che nasce, il soffio di brusio (§3.6) | guscio, cuffia |
| **Il primo contatto** | arrivo nel vestibolo | il multiscanner «si impenna»: segnali che si accavallano. Nella cuffia «entra un brusio», pieno. Il traduttore restituisce «una sillaba, poi niente»: un granello del brusio, più lungo degli altri. La cifra scende, un tic per punto. Quando stacchi la mano il brusio si abbassa e i tic si fermano | cuffia, casco |
| **Le venature spente** | tocca le venature | il brusio sale sotto il guanto, +8 dB in 0,4 s, poi torna giù; un tic. Con la protezione vitale il brusio «si ferma lì» e non c’è nessun tic | cuffia, casco |
| **Il risuonatore** | prendi o tocca | il brusio sale e la cifra riprende a scendere | cuffia, casco |
| **Il primo taglio** | stacca il risuonatore | la taglierina, qui in atmosfera, sibila davvero. «Il brusio si alza di colpo», e una voce si stacca: «chiede qualcosa, in fretta, a qualcuno». Poi rientra nel coro | cuffia, voci |
| **Il secondo taglio** | stacca | «La parete cede come cartilagine». Le voci «tante e vicine», e una «sembra contare»: un filo con un ritmo regolare | cuffia, voci |
| **Il terzo taglio** | stacca | l’arnese «ti cade nel palmo»; da qui il brusio viene dalla mano (§2.3) | cuffia, voci |
| **Le gole sintonizzate** | sintonizza le gole | due fili si separano dal coro, poi «il resto è coro» (§5.3) | voci |
| **Le venature verdi** | tocca le venature verdi | una luce che corre «per un palmo, giù per la gola»: un soffio vetroso che scende e si allontana | cuffia |
| **La connessione** | gola di mezzo, con il Sintonizzatore | il Sintonizzatore si accende da solo. Una voce bassa, paziente, con il ritmo di un elenco; a ogni parola un tic del traduttore («nome proprio: intraducibile»). L’interruttore premuto due volte, a vuoto | voci, casco |

### 4.3 Atto III

| Evento | Quando | Che cosa si sente | Strade |
|---|---|---|---|
| **Il groviglio sente il faro** | teche, faro pieno | §3.9: il fruscio che si avvicina, uno stivale sfiorato | cuffia, ossa |
| **Il groviglio prende** | teche, la minaccia vicina | «Un filamento ti trova il fianco»: la stretta umida, la tuta che tira. «Ti strappi via, scalci, e risali la gola a spinte di gomiti»: calci nelle ossa, il fiato che esplode, i tic di otto punti | cuffia, ossa, casco |
| **Il bengala** | accendi il bengala nelle teche | la linguetta strappata, l’accensione, la fiamma che soffia e crepita. Il groviglio «si gira tutto insieme e striscia verso il finto sole». Tre turni dopo: «Il bengala sfrigola, si fa arancione, poi si spegne», e il groviglio «torna a cercare» | cuffia |
| **Il campo che regge** | teche, con l’energia | §3.9 | cuffia |
| **Le tacche** | incidi le tacche | la taglierina al minimo: un sibilo sottile. «Il materiale resiste, poi cede in un solco netto e sottile» | cuffia |
| **La Grande Porta** | la terza chiave | le tre luci che pulsano all’unisono, il ronzio che accelera e «diventa un gong risonante che vibra in tutta la nave». Poi la porta «si dissolve in particelle di luce». Il gong è un tam-tam vero, che un’altezza precisa non ce l’ha (quindi non è un re), con il suo rombo nelle ossa; la dissoluzione è lo stesso tam-tam smontato in granelli acuti | cuffia, ossa |
| **L’energia** | il cristallo nel generatore | §3.17: il rombo che sale, gli archi, l’aria che vibra | cuffia, ossa |
| **Il brivido dello scafo** | subito dopo | «Un brivido percorre lo scafo»: un’onda nelle ossa che attraversa da un lato all’altro. «Sistemi dormienti da secoli tornano a respirare uno dopo l’altro»: soffi e ronzii lontanissimi, in fila | ossa, cuffia |
| **La ricarica** | ricarica la tuta | «Un ronzio, la cifra sul visore che risale»: venticinque tic che salgono | casco |
| **Il dispositivo medico** | sul cristallo | «un ronzio appena udibile»; il cristallo che si accende e pulsa | cuffia |
| **L’altare** | il disco sull’altare | il disco di pietra nell’incavo; «dall’interno della pietra arriva un colpo profondo»; la sezione che si ritira «senza rumore» | cuffia, ossa |
| **Il disco liberato** | prendi il disco | §3.13 | cuffia |
| **La teca della serra** | la tavoletta sulla teca | i simboli che si accendono «con un clic armonioso» (§5.5); la teca che si dissolve in un pulviscolo; la vibrazione che «cessa di colpo» (§3.16) | cuffia, ossa |
| **Il seme preso** | prendi il seme | «una vibrazione costante ti risale il braccio»: il battito del seme nelle ossa, finché il seme è vivo | ossa |
| **Il terminale forzato** | la taglierina sul terminale | §3.14 | cuffia |
| **L’archivio che saluta** | l’arca con l’energia | §3.14; lo scomparto che si apre «piano, come una mano» | cuffia |
| **La postazione** | usa la postazione | §3.20: il silenzio | — |
| **La porta tonda** | premi le punte | §3.20 e §5.5 | cuffia |
| **Il sonaglio** | suona il sonaglio | §5.4 | cuffia |
| **Le echi** | sintonizza | §5.3 | voci |
| **La traduzione completa** | la matrice arriva a 100 | nessun suono di vittoria: «Per un momento la distanza tra te e loro collassa». Per tre secondi il brusio, ovunque sia, diventa un accordo di voci tenute | voci |

**Gli assestamenti della nave.** Fuori dalla fuga, ognuno con probabilità 1 su 36 a turno:

- «qualcosa si assesta, con un gemito lungo e basso che ti arriva nei denti prima che nelle cuffie»: prima le ossa, poi la cuffia con 0,3 s di ritardo; il ghiaccio del lago (V3) rallentato di un’ottava e mezza, e una struttura metallica sotto sforzo;
- «il brusio cala fino quasi a sparire, come una sala piena che smette di parlare quando entri»: il brusio scende a zero in 2 s, resta zero 3 s, risale in 4 s;
- «qualcosa nelle pareti si accende tutto insieme e si rispegne»: un crepitio elettrico unico, ovunque, per un battito.

### 4.4 Il visore, a ogni soglia

| Evento | Che cosa si sente |
|---|---|
| un punto d’aria in meno | un tic morbido, quasi un clic, a −30 dB: mai un bip |
| molti punti in una volta | i tic in fila, veloci (dieci in 0,6 s) |
| l’aria sale | i tic in salita, più chiari |
| la cifra passa all’ambra (60) | due note discendenti, sottovoce |
| **la protezione vitale (sotto 30)** | tre note d’allarme, poi la sequenza dei relè: la tuta «stacca i canali secondari», e lo si sente: la cuffia si spegne con uno scatto, il brusio sparisce, il mondo resta attutito dietro il guscio. Il faro scende da solo (la ghiera, a scatti) |
| la cifra torna sopra il rosso | la sequenza al contrario: i canali che si riaprono, il faro che torna |
| l’ipossia (15) | niente. «Ti accorgi che ragioni più piano, e che la cosa non ti spaventa»: il visore non avverte, e il suono comincia a chiudersi (§2.2) |
| la protezione vitale nella fuga (sotto 30) | tre note d’allarme e nessun relè: «Adesso la tuta non ti protegge più da niente» |

### 4.5 Atto IV — l’Anziano

| Evento | Quando | Che cosa si sente |
|---|---|---|
| **L’Anziano** | parla con l’Anziano | la musica (D14). Sotto, la stanza che aspetta (§3.22) |
| **Resto ad ascoltare** | il nodo «silenzio» | esattamente quello che dice il testo, e nient’altro: «un ronzio lontano, il tuo fiato nel casco, qualcosa che si assesta». Per otto secondi la musica tace |
| **Il congedo e la fuga** | «[Apri gli occhi.]» | «La nave trema»: un rombo che cresce nelle ossa. Le linee del pavimento si spengono una dopo l’altra (la luce, in silenzio); il pavimento si apre su una gola (pietra che si spacca, polvere). «Sul visore, la cifra dell’aria ha cominciato a scendere da sola»: da qui, quattro tic a ogni turno |

### 4.6 Atto V — la fuga e la fine

| Evento | Quando | Che cosa si sente | Strade |
|---|---|---|---|
| **I crolli** | 1 su 4 a turno | «Da qualche parte dietro di te qualcosa crolla, con un rumore che non arriva: lo senti nelle suole». Solo ossa, fra 25 e 60 Hz, lunghi; nessun acuto | ossa |
| **Le incrinature** | 1 su 4 a turno | «Le pareti si incrinano in lunghe linee verdi»: crepitii lunghi che corrono da un lato all’altro (V3) | cuffia |
| **Il groviglio desto** | teche nella fuga | «a frustate molli e cieche»: colpi molli e bagnati, ovunque, che cercano il caldo. La caviglia presa, lo strappo, il calcio | cuffia, ossa |
| **La voce dei nomi** | gola di mezzo nella fuga | la voce bassa che torna; ascoltarla costa, e la cifra scende con lei. «Poi l’elenco finisce, e la voce, dopo una pausa, ne dice uno in più, più piano degli altri» (§5.3) | voci |
| **Lo scafo nella fuga** | | §3.5 | ossa, casco |
| **Il casco tolto** | la stiva, alla fine | «Ti strappi il casco prima che la pressione sia pareggiata». Un colpo d’aria, le orecchie che si stappano, e tutto il mondo che torna insieme: l’aria piena, il re pieno, la ventilazione. «Sa di olio e di casa». Poi «Il pavimento si avvicina. Dormi.»: tutto scende a zero in sei secondi | aria |
| **Il risveglio** | in plancia | §3.1: il re, la ventilazione, il radar che non suona | aria |

**I finali.**

- **Con il seme:** «dentro il seme si accende un battito di luce verde. Si spegne. Torna.» Nessun suono nuovo: la plancia, e il re. Se la nota è riconosciuta, il re ha il suo ottavo armonico (§1.3).
- **Con il risuonatore:** «un brusio che viene da giù, dalla stiva». Per la prima volta il brusio arriva per l’aria, senza cuffia, da una stanza vera della Santa Maria, e cambia natura: è diventato un suono di bordo.
- **Con tutti e due:** il seme nel pugno, e «Da giù, dalla stiva, sale il brusio del risuonatore».
- **A mani vuote:** la plancia, il re, nient’altro.
- **L’aria a zero:** «il visore non ha più niente da dirti». I segnali del visore smettono; la ventola rallenta e si ferma; il fiato si fa lento, poi l’ultimo. Se c’è la taglierina, le lettere incise: nel vuoto solo nel guanto, nel relitto con il sibilo. Nella fuga, «la nave trema, e poi, dopo tanto tempo, si muove. Ti porta con sé»: un movimento enorme nelle ossa, e poi niente. Fuori dalla fuga, il silenzio della stanza in cui sei.

Le chiusure dei finali (§11 del 06) hanno la loro musica (D14); il suono del mondo si ferma dove si ferma il testo.

## 5. Gli strumenti

### 5.1 Il fiato

Il fiato è il suono più presente del gioco: c’è in ogni stanza dalla vestizione alla fine. Racconta l’aria meglio della cifra, perché lo si sente senza guardare.

**La fisiologia.** In una tuta chiusa l’aria che cala vuol dire due cose insieme: l’anidride carbonica che sale e l’ossigeno che scende. La prima fa respirare più spesso e più a fondo (la fame d’aria); la seconda, alla fine, rallenta il pensiero e toglie la paura. È la progressione del gioco: l’ambra, il rosso, poi «ragioni più piano, e la cosa non ti spaventa».

| Aria | Stato | Respiri al minuto | Inspira / espira | Carattere |
|---|---|---|---|---|
| 100–61 | verde | 12–14 | 1,6 s / 2,4 s | dal naso, quasi inudibile; un sospiro ogni dodici respiri |
| 60–30 | ambra | 16–18 | 1,3 s / 1,9 s | dalla bocca, +3 dB |
| 29–16 | rosso | 20–24 | 1,0 s / 1,5 s | la fame d’aria: inspirazioni più profonde e più rumorose |
| 15–1 | ipossia | 10–26, irregolare | spezzato | pause, respiri a scatti, ogni tanto un sospiro lunghissimo |

**I modificatori.**

- **Lo sforzo** (la fuga, le spinte di gomiti, i calci): +6 respiri al minuto e un gradino di intensità in più.
- **La sorpresa** (il varco che si chiude, l’uomo in tuta, il groviglio che prende): un’inspirazione secca, poi il fiato trattenuto per 1,5 s.
- **L’ascolto** (il Sintonizzatore acceso, «Resto ad ascoltare»): il fiato si fa più leggero e più lento, −3 dB. Ascoltare costa aria, e si sente che si trattiene.

**Il motore.** In Rust, una macchina a stati (inspira, pausa, espira, pausa) che pesca da gruppi di campioni separati per fase e per intensità, senza ripetere lo stesso campione due volte di seguito, con piccole variazioni di durata e di volume. Il motore manda all’interfaccia la fase del respiro, così il bordo del visore respira con il fiato e non per conto suo.

**Le fonti.** Per il prototipo, quattro registrazioni CC0 (C1–C4). Per il gioco, una sessione registrata apposta (§7.4): servono più di duecento respiri separati, e nessuna libreria li ha tutti dalla stessa voce.

**La bolla del casco.** Il fiato passa per la risposta all’impulso di un casco vero. Le prime riflessioni arrivano entro un millesimo di secondo e colorano il suono fra 500 e 1500 Hz. Anche questa si registra (§7.4).

### 5.2 Il brusio

«Tante voci, una sopra l’altra, nessuna intera.» È il suono del relitto, e beve dalla stessa batteria della tuta.

**La materia.** Voci vere, una per volta, pulite: le raccolte multilingue di LibriVox (pubblico dominio), con decine di lettori in decine di lingue, così nessuna lingua umana prevale. Si preparano offline: si separano i lettori, si tolgono i silenzi, si normalizzano, si taglia sotto i 100 Hz. Ne bastano 30–40, un minuto ciascuno.

**Il motore.** Granulare, in Rust, come il re:

- da 4 a 40 flussi, uno per voce; ogni flusso legge frammenti di 60–220 ms (finestra di Hann) in punti casuali della sua voce, con un ritmo irregolare;
- ogni flusso è abbassato di 2–4 semitoni (le creature sono «alte e sottili»: un tratto vocale più lungo dà formanti più basse), con un vibrato lento e diverso dagli altri;
- un frammento su sei è rovesciato; una sfocatura spettrale breve (una convoluzione con 30 ms di rumore) toglie gli attacchi delle consonanti;
- tutto passa per la cuffia (150–7000 Hz). Con sei flussi o più, e frammenti sotto i 220 ms, nessuna parola sopravvive: è la soglia sotto la quale una sillaba non si chiude.

**Gli stati.**

| Dove o quando | Flussi | Livello | Note |
|---|---|---|---|
| soffio della porta interna | 6 | −30 dB | due o tre secondi, poi via |
| vestibolo | 16 | −18 dB | dalla nicchia e dalla gola di mezzo |
| una mano sulla parete | 24 | +8 dB | per il tempo del contatto |
| gola di mezzo | 24 | −14 dB | |
| corridoio e oltre | 8 | −28 dB | lontano, dalla gola larga |
| il risuonatore portato | 40 | −12 dB | dalla mano, in ogni stanza |
| la protezione vitale | 0 | — | «Niente ascolto, niente traduzione» |
| la radio della Santa Maria agganciata | 10 | −34 dB | in banda radio, a tratti |

### 5.3 Il Sintonizzatore e le echi

Le echi sono testo: nessuna voce recitata nella 1.0 (D18). Il suono racconta come il Sintonizzatore le trova. *(Fatto: §11.6.)*

- **La ricerca:** un fruscio di sintonia, come su una radio a onde corte, che scorre e torna.
- **La cosa trovata:** il brusio scende di 10 dB e un flusso solo resta in primo piano, con frammenti più lunghi (300–500 ms) messi in ordine, così ha il ritmo di una frase. Per non farne una lingua umana, il flusso passa per uno spostamento di frequenza di +60–90 Hz: il ritmo e l’intonazione restano, le parole no.
- **«Soltanto un residuo statico»:** il fruscio di sintonia e nient’altro.
- **«Torna a zero»:** la sintonia che scorre e si ferma sul niente.
- **Il secondo strato:** la frequenza «scende sotto la soglia di prima»; lo stesso filo, più grave e più nudo, senza il coro intorno.

Ogni eco ha il suo filo:

| Eco | Dove | Il filo |
|---|---|---|
| le gole | vestibolo | due fili: uno urgente, uno basso che «risponde a chi non la ascolta» |
| il corridoio | pareti del corridoio | molti fili uno dopo l’altro; il Capitano più lento |
| lo Xeno-botanico | serra | una voce media, stanca; il secondo strato «con un filo di voce più fermo» |
| l’Ufficiale medico | arca biologica | una voce piana, quasi senza intonazione |
| il Navarca | alloggio | vecchia, lenta; il secondo strato parla «a se stesso», più vicino |
| il Piccolo | nido | «giovane, acuta», che «gira su se stessa»: un anello di quattro secondi che ricomincia uguale; quando smette, «Resta il fruscio della registrazione» |
| l’Ufficiale di navigazione | Ponte | precisa, regolare |
| lo Scriba | scriptorium | una voce piana, una pausa lunga alla fine |
| la lastra incisa | scriptorium | non una voce: «una punta contro la pietra, ostinata, che incide, si ferma, riprende», e si ferma sempre allo stesso punto. È un graffio vero su pietra, registrato, ripetuto con le sue pause |
| il Custode | santuario del silenzio | grave; il secondo strato «non trema più» |
| l’Ingegnere | laboratorio | urgente, «La risonanza è instabile!»; poi «più piano». Il secondo strato è «quasi un canto sottovoce» |
| la voce dei nomi | gola di mezzo | bassa, paziente, il ritmo di un elenco, e il tic del traduttore a ogni parola |

### 5.4 Il sonaglio

«Una nota sola, chiara, che resta nell’aria più del dovuto: un re.» È il suono più importante del relitto, perché è l’unico re.

- **Lo strumento:** «un piccolo strumento di metallo leggero, a forma di conchiglia, con tre fori». Lo si scuote: prima il tintinnio del metallo leggero, poi la nota.
- **La nota:** re₅, 587,33 Hz, l’ottavo armonico del reattore (§1.3).
- **Più del dovuto:** un oggetto così piccolo dovrebbe spegnersi in un secondo o due; questo resta otto secondi, con una coda che si allarga invece di stringersi. Dopo i primi 1,5 s il suono vero passa in un riverbero che lo congela piano.
- **La fonte:** da registrare (§7.4). Campanelli d’ottone, tingsha, oggetti di metallo a conchiglia: si sceglie quello con i parziali più puliti e lo si accorda su re₅ spostandolo il meno possibile (al massimo due semitoni).
- **«Resti fermo finché non si spegne»:** mentre il sonaglio suona, il fiato si ferma.

### 5.5 Il clic armonioso

Il gioco usa due volte le stesse parole: i simboli della teca della serra si accendono «con un clic armonioso», e la porta tonda del Ponte si apre con «Un clic armonioso». Diventano un motivo: tre scatti vetrosi che formano un accordo. Come vuole il §1.3, l’accordo sta intorno al sol diesis (415 Hz, 484 Hz, 622 Hz: una terza minore settimale e una quinta), lontano dal re. È lo stesso suono tutte e due le volte, perché è la stessa mano che li ha costruiti.

### 5.6 Il groviglio

«Filamenti pallidi, spessi come una fune», che cercano il caldo e la luce.

- **La materia:** corde e alghe bagnate trascinate, cuoio bagnato, tubi di gomma, sedano e porri torti (il foley classico della carne). Si rallenta di un’ottava per il peso.
- **Il comportamento:** segue lo stato del faro e della minaccia (§3.9). Più flussi di fruscio indipendenti (da 3 a 12), ognuno con il suo punto nello spazio; con il faro pieno si avvicinano, con il faro basso girano.
- **Nella fuga:** «a frustate molli e cieche». Asciugamani bagnati sbattuti, rallentati, ovunque.

### 5.7 Gli attrezzi

| Attrezzo | Nel vuoto | In atmosfera |
|---|---|---|
| **multiscanner** | il motorino per la spalla, i segnali nel casco | lo stesso; nel laboratorio «crepita di interferenze» |
| **matrice di traduzione** | — | un aggancio: tre impulsi rapidi e un tono che si ferma |
| **Sintonizzatore** | — | §5.3 |
| **taglierina al plasma** | solo il ronzio nel guanto («un getto di luce che non fa rumore») | il sibilo del getto, e il materiale che si ritira |
| **faro del casco** | la ghiera a scatti | la stessa |
| **cella di riserva** | lo sgancio e l’innesto per le ossa; la valvola nel casco | la stessa |
| **batteria d’emergenza** | il connettore nell’incavo, per le ossa | lo stesso, più chiaro |
| **bengala** | — | la linguetta, l’accensione, la fiamma che soffia |
| **dispositivo medico** | — | «un ronzio appena udibile» |

### 5.8 L’interfaccia

I pulsanti hanno un suono discreto, diegetico, sotto i −24 dB: un tocco, mai un passaggio del mouse, mai lo scorrimento. *(Fatto, per il gioco: §11.4.)*

- **Sulla Santa Maria (acciaio):** interruttori e relè veri, tre varianti per ogni gesto (scegli, conferma, annulla).
- **Nel relitto (membrana):** man mano che le venature colonizzano l’interfaccia (lo stile C), il tocco cambia. Il clic d’acciaio si mescola con un tocco morbido e smorzato (un dito su una superficie umida) e con un parziale vetroso appena accennato. Il rapporto segue la crescita della membrana, da 0 a 1.
- **Nella fuga:** un crepitio sottile su ogni tocco, la membrana che si strappa.
- **In «Vivi»:** resta una venatura verde, e resta un tocco di membrana.

## 6. La lavorazione

### 6.1 Offline, prima di entrare nel gioco

1. Ogni sorgente si conforma a 48 kHz.
2. Si ripulisce: rumore di fondo, ronzii di rete (notch su 50 e 60 Hz e armoniche), clic.
3. Sulla Santa Maria si tolgono le altezze che litigano con il re (§1.3).
4. Equalizzazione e filtri della strada, quando sono fissi (le strade che cambiano in gioco restano in `kira`).
5. I riverberi delle stanze grandi (corridoio, santuario, alloggio, arche) si calcolano offline per convoluzione con risposte all’impulso di luoghi veri, e si uniscono ai fondi. Gli eventi brevi usano il riverbero di `kira`.
6. I fondi diventano anelli: dissolvenza incrociata a potenza costante di 2–4 s, punti di taglio scelti a orecchio.
7. Loudness: −28 LUFS integrati per i fondi; picco reale sotto −1 dBTP.
8. Esportazione: Ogg Vorbis, qualità 5 o 6, 48 kHz; mono per le voci del brusio e per le ossa.

Gli script della catena staranno in `strumenti/audio/`, come quelli dell’intro, così ogni file del gioco si potrà rifare dalla sua sorgente.

### 6.2 In gioco

- **Fondi lunghi:** in streaming da disco. **Eventi e campioni brevi:** in memoria.
- **Sintesi:** il re, il brusio e i segnali del visore sono `Sound` di `kira` scritti in Rust, come nel prototipo della fase 1.
- **Budget:** circa 80 MB di audio nel pacchetto (fondi ~50, eventi ~15, voci ~15). Da verificare nella fase 4; se serve si scende a qualità 4.
- **CPU:** il brusio a 40 flussi e il re costano poco; la convoluzione è offline. La fase 1 ha misurato 4,6 ms dal comando al primo blocco audio su Windows, e sotto carico nessun buco oltre 10,3 ms e zero errori (in WSLg 24 ms, dopo la correzione; la macchina Linux vera deve ancora confermarlo).

## 7. Le fonti e le licenze

### 7.1 Che cosa entra e che cosa no

| Licenza | Si usa? | Che cosa chiede |
|---|---|---|
| **CC0** (Freesound e altri) | sì | niente; il credito si dà lo stesso, per gentilezza |
| **Pubblico dominio** (LibriVox, opere della NASA) | sì | niente. LibriVox dice «pubblico dominio negli Stati Uniti»: le registrazioni lo sono, e si scelgono testi di autori morti da più di settant’anni, così anche il testo è libero ovunque |
| **Sonniss GDC** | sì | nessuna attribuzione; uso illimitato nei giochi. Vietato ridistribuire i file come effetti sonori, anche modificati, e vietato usarli per addestrare IA |
| **CC BY 4.0** | sì | il nome dell’autore nei titoli di coda e in `audio/LICENZE.md` |
| **CC BY-SA** | da evitare | il file modificato deve restare BY-SA: si può fare, ma complica |
| **CC BY-NC, NC-SA** | no | non commerciale: il gioco potrebbe essere venduto |
| **CC BY-ND** | no | non si può modificare, e qui tutto si modifica |
| **Sampling+** | no | licenza ritirata, con limiti commerciali |
| **BBC Sound Effects (RemArc)** | no | solo uso personale, educativo o di ricerca |
| **senza licenza chiara, video ripresi, «gratis per uso personale»** | no | |
| **generati dall’IA** | no | §1.4 |

**Il repository.** Il codice dell’app è MIT; i suoni no, e vanno tenuti distinti. Le sorgenti grezze stanno in `audio/sorgenti/`, fuori da git, con la loro impronta SHA-256 nel registro. Finché il repository resta locale, i suoni lavorati possono stare in `app/src-tauri/risorse/audio/`. Se un giorno il repository diventa pubblico, i suoni derivati da Sonniss non possono starci in chiaro, perché sarebbero una ridistribuzione: o si escludono, o si usano solo fonti CC0 e di pubblico dominio. È una decisione da prendere prima della pubblicazione.

### 7.2 Dove cercare, per tipo

| Che cosa | Dove | Note |
|---|---|---|
| il fiato | **da registrare** (§7.4); nel prototipo C1–C4 | il suono più presente del gioco |
| la ventola e la pompa della tuta | una ventola piccola e una pompa d’acquario, da vicino; nel prototipo C5 | |
| la bolla del casco | **da registrare**: la risposta all’impulso di un casco da moto | |
| il reattore (la tessitura) | P1; sale macchine di navi, centrali di pompaggio (Sonniss GDC, Freesound CC0) | ripulire i toni |
| la ventilazione | P2; ambienti industriali (Sonniss GDC) | |
| lamiere e ticchettii | registrazioni a contatto (P3, C6); un cofano d’auto che si raffredda | |
| i propulsori, gli arpioni | colpi registrati a contatto | |
| il verricello | argani e paranchi elettrici | |
| l’urto fra le navi | traghetti all’attracco, lo sfregamento contro i parabordi | |
| la radio | scariche e squelch veri di ricetrasmittenti; il segnalatore di retromarcia di un muletto; un magazzino lontano | |
| la tuta e gli attrezzi | **da registrare**: giacca tecnica, cerniere, fibbie, le chiusure di una valigetta, una ghiera | |
| il brusio | V1 e le altre raccolte multilingue di LibriVox | voci pulite, una per volta |
| gocce e umido | V2; grotte, cantine, cisterne | |
| assestamenti, gemiti, incrinature | V3; il ghiaccio dei laghi, il legno e il metallo sotto sforzo registrati a contatto | |
| il groviglio | foley (§5.6) | |
| il bengala | un bengala stradale vero | |
| archi e statica | bobine di Tesla, scale di Giacobbe, scariche elettrostatiche | |
| il generatore | avvii di turbine e di generatori (Sonniss GDC) | |
| il gong | un tam-tam vero, colpito e strofinato | |
| il sonaglio | **da registrare** (§5.4) | |
| la pietra | lastre trascinate, colpi sordi a contatto | |
| il graffio sulla pietra | una punta d’acciaio che incide una lastra | la lastra incisa |
| i riverberi | risposte all’impulso di luoghi veri (la biblioteca OpenAIR dell’Università di York) | licenze diverse da una all’altra: si verificano una per una |

**L’archivio Sonniss GDC.** Dal 2015 al 2024 più il 2026 (nel 2025 non c’è stato), circa 215 GB in tutto; il 2026 sono 7,5 GB in cinque parti. Si scarica senza account, per parti o con il torrent. Conviene scegliere le annate leggendo prima l’elenco dei titoli e scaricare solo quelle che servono, con il tuo permesso per ognuna.

### 7.3 Il registro

`audio/LICENZE.md` ha una riga per ogni file, prima che il file entri nel gioco: sigla, titolo, autore, fonte, licenza, data, formato, dimensione, impronta SHA-256, dove si usa. Le regole sono in testa al registro.

### 7.4 Le registrazioni da fare in casa

Facoltative: l’autore ha deciso che nessuna registrazione è a suo carico (06, §18), e le fonti vengono dalle librerie. Restano qui come strada possibile, perché sono le più vere e quelle con la licenza più pulita. Basta un registratore portatile o un buon telefono, a 48 kHz e 24 bit, in una stanza sorda (un armadio pieno di vestiti funziona).

1. **Il fiato (venti minuti).** Microfono a 10–15 cm, di lato alla bocca, per evitare i colpi d’aria. Quaranta respiri calmi dal naso, quaranta dalla bocca, quaranta dopo trenta piegamenti, trenta di fame d’aria, venti spezzati, dieci sospiri, dieci inspirazioni di sorpresa, dieci fiati trattenuti e lasciati, cinque ultimi respiri. Fra un gruppo e l’altro, una pausa. **Mai iperventilare fino a girare la testa**: le parti spezzate e affannate si recitano, seduti.
2. **Il fiato dentro un casco.** Gli stessi gruppi, più corti, con un casco da moto in testa e la visiera chiusa, il microfono dentro, vicino all’orecchio. È il suono vero del fiato in una bolla.
3. **La bolla del casco.** Con il casco su un sostegno, un piccolo altoparlante dentro, al posto della bocca, che suona uno sweep da 20 Hz a 20 kHz, e il microfono all’orecchio. Si ricava la risposta all’impulso.
4. **La tuta.** Una giacca tecnica, cerniere, velcro, fibbie, i ganci di uno zaino, le chiusure di una valigetta di metallo, la ghiera di un obiettivo, una chiave in una serratura piccola, una cerniera che cigola, un quaderno di carta spessa.
5. **Il sonaglio.** Tutti i piccoli oggetti di metallo che suonano a portata di mano: campanelli, tingsha, conchiglie di metallo, cucchiaini. Ognuno scosso piano, cinque volte, con lunghe pause per le code.

## 8. Il prototipo dei tre ambienti

### 8.1 Che cosa deve dimostrare

Tre ambienti, nel motore audio vero della fase 1, con le registrazioni vere:

1. **La plancia con il reattore:** il re sintetico sotto, la tessitura delle pompe, la ventilazione, le lamiere. Si verifica che il re resti l’unica altezza e che il fondo non stanchi in dieci minuti.
2. **Il casco sullo scafo:** il vuoto. Il fiato che segue un cursore dell’aria (100, 60, 29, 15), la ventola, i magneti degli stivali nelle ossa, il re della rampa che si spegne. Si verifica che il silenzio del vuoto regga senza annoiare.
3. **Il vestibolo con il brusio:** il motore granulare sulle voci di LibriVox, le gocce, gli assestamenti, il passaggio alla protezione vitale (la cuffia che si spegne). Si verifica che nessuna parola si capisca, nemmeno in italiano.

Più tre interruttori per ascoltarli in ogni stato: la tuta, la protezione vitale, l’ipossia. E le misure: CPU del motore audio, memoria, buchi.

### 8.2 I dodici file

Tutti con licenza verificata sulla pagina di ciascuno, il 14 ottobre 2026.

| Sigla | Titolo | Autore | Fonte | Licenza | Formato | Durata | Dimensione | Uso |
|---|---|---|---|---|---|---|---|---|
| P1 | Industrial plant atmos 1 of 4 | apintofmild | [Freesound 839813](https://freesound.org/people/apintofmild/sounds/839813/) | CC0 | WAV 48 kHz 16 bit stereo | 3:03 | 33,6 MB | pompe e fluido sotto il re |
| P2 | Ambient Industrial Ventilation Soundscape | amenhotepIV | [Freesound 166014](https://freesound.org/people/amenhotepIV/sounds/166014/) | CC0 | WAV 48 kHz 24 bit stereo | 3:07 | 51,5 MB | ventilazione della Santa Maria |
| P3 | Metal door hit – contact mic | Salomé_Lubczanski | [Freesound 733837](https://freesound.org/people/Salom%C3%A9_Lubczanski/sounds/733837/) | CC0 | WAV 48 kHz 24 bit stereo | 0:54 | 14,9 MB | lamiere, colpi a contatto |
| C1 | Male_Breath_Fast_Loop_Stereo | Nox_Sound | [Freesound 554907](https://freesound.org/people/Nox_Sound/sounds/554907/) | CC0 | WAV 96 kHz 24 bit stereo | 0:05 | 2,8 MB | fiato veloce |
| C2 | Male_Breath_Scared_Frozen_Loop_Stereo | Nox_Sound | [Freesound 554906](https://freesound.org/people/Nox_Sound/sounds/554906/) | CC0 | WAV 96 kHz 24 bit stereo | 0:07 | 3,9 MB | fiato trattenuto, sorpresa |
| C3 | Heavy Breathing | Under7dude | [Freesound 163383](https://freesound.org/people/Under7dude/sounds/163383/) | CC0 | WAV 48 kHz 16 bit stereo | 0:04 | 0,8 MB | fiato pesante |
| C4 | Sigh – man – breath in nose – breath out mouth | ValentinPetiteau | [Freesound 569568](https://freesound.org/people/ValentinPetiteau/sounds/569568/) | CC0 | WAV 44,1 kHz 24 bit mono | 0:08 | 1,0 MB | fiato calmo, sospiro |
| C5 | Fan_01 | moai15 | [Freesound 336387](https://freesound.org/people/moai15/sounds/336387/) | CC0 | WAV 48 kHz 24 bit stereo | 0:39 | 10,8 MB | ventola della tuta |
| C6 | metallic door contact mic | bruno.auzet | [Freesound 718386](https://freesound.org/people/bruno.auzet/sounds/718386/) | CC0 | WAV 48 kHz 24 bit stereo | 1:32 | 25,4 MB | magneti degli stivali, il corpo |
| V1 | Multilingual Poetry Collection 001 | LibriVox, 17 lettori, 12 lingue | [LibriVox](https://librivox.org/multilingual-poetry-collection-001) (archive.org) | pubblico dominio | ZIP di MP3 64 kbit/s | 39:17 | 18,4 MB | la materia del brusio |
| V2 | Ambience INT water drip … grotto (Quinta da Regaleira) | corkob | [Freesound 392668](https://freesound.org/people/corkob/sounds/392668/) | CC0 | FLAC 44,1 kHz 16 bit stereo | 0:20 | 1,7 MB | gocce |
| V3 | Ice – Lake fractures | Vrymaa | [Freesound 737896](https://freesound.org/people/Vrymaa/sounds/737896/) | CC0 | WAV 44,1 kHz 16 bit mono | 0:58 | 4,9 MB | gemiti, assestamenti, incrinature |

**Totale: 169,7 MB.** Le registrazioni di Freesound sono tutte vere, dichiarate dai loro autori con il registratore usato. Due candidate che sembravano adatte sono state scartate perché sintetiche: «control_room.wav» (fatta con gli oscillatori) e «Cave Ambience» (archiviata come sintetica).

**Come sono stati scaricati.** Gli originali di Freesound, con l’account dell’autore: è entrato da sé nel pannello del browser, e da quella sessione sono partiti i download (151,3 MB). LibriVox da archive.org, senza account. Le impronte SHA-256 sono in `audio/LICENZE.md`.

### 8.3 Com’è costruito

*Così era il prototipo del 14 ottobre. Il 15 ottobre la catena offline, i campioni lavorati e la loro banca sono stati tolti dal repository (restano nella storia di git): il motore adesso sintetizza tutto (§10).*

- **Una catena offline** (`strumenti/audio/prepara_prototipo.py`, con gli attrezzi di `comune.py`) prende le sorgenti da `audio/sorgenti/` e scrive 109 file Ogg in `app/src-tauri/risorse/audio/prototipo/` (9 MB), con `indice.json` che dice da quale sorgente viene ciascuno:
  - tre letti ad anello, a −28 LUFS: la ventilazione (P2, senza il rombo a 32 Hz e senza il ronzio di rete a 60 e 120 Hz), le pompe (P1, senza le cinque righe tonali che litigavano con il re: 65, 141, 746, 858 e 1000 Hz), la ventola della tuta (C5: il motore a 62 Hz teneva quasi tutta l’energia, e un passa-alto ripido a 110 Hz lascia l’aria);
  - quindici cicli di respiro, tagliati dove l’inspirazione (più acuta) cede all’espirazione: calmo, sospiro, teso, pesante, veloce, sorpresa;
  - i colpi e i cigolii a contatto (P3, C6), le gocce (V2), le crepe del ghiaccio e otto gemiti (V3 rallentato di un’ottava e mezza);
  - venti voci da LibriVox, mono a 24 kHz, senza l’annuncio iniziale e senza i silenzi.
- **Il motore** è un modulo Rust, `app/src-tauri/src/mondo/`: un solo `Sound` di kira che mescola dentro di sé tutti gli strati lungo le cinque strade, con i filtri di ciascuna (il guscio a un polo, la cuffia in banda stretta e compressa, la bolla del casco, le ossa sotto i 250 Hz). Così il filtro del guscio è davvero a 6 dB per ottava, e lo stesso codice gira anche fuori dall’app. Dentro ci sono il re (con le fasi di ogni parziale, per muovere i battimenti senza scatti), il fiato (la macchina a stati del §5.1), il brusio granulare (§5.2) e le piogge di eventi.
- **Fuori dall’app**, `examples/rendi_ambienti.rs` rende i tre ambienti su file WAV, anche uno strato per volta: è così che i livelli sono stati tarati sulle misure.
- **Nell’app**, i comandi `audio_mondo_avvia`, `audio_mondo` e `audio_mondo_stato`. La pagina di prova ha la sezione «Suono · il prototipo»: gli ambienti, il cursore dell’aria, la nave, la rampa, i passi, lo sforzo, gli eventi. Con `RELITTO_PROVA=mondo` misura da sola e scrive il rapporto.

### 8.4 Stato e misure

**Fatto e misurato, il 14 ottobre 2026.** Gli ascolti sono in `progettazione/ascolti/` (10-plancia, 10-scafo, 10-vestibolo, in MP3).

| Misura | Risultato |
|---|---|
| Livelli (dai rendering) | plancia calma −26 LUFS (re −29, ventilazione −30, pompe −38); fiato calmo −27, ambra −26, fame d’aria −21; brusio −31; ventola −35; picchi sotto −3 dBFS |
| Il re è l’unica nota della plancia? | sì: le sole righe tonali fra 30 e 1500 Hz sono 73,2, 147,2 e 220,5 Hz, i primi tre armonici del re, entro 5 cent |
| Il brusio si capisce? | no: l’inviluppo delle sillabe è più piatto del 61% rispetto a una voce sola (profondità della modulazione 0,49 contro 1,26) |
| Scatti | nessuno nei tre rendering |
| Il fiato segue l’aria? | sì: 13,9 respiri al minuto con l’aria piena, 22 con la fame d’aria (misurati dall’app) |
| CPU, fuori dall’app | da 57 a 106 volte più veloce del tempo reale, su un core |
| CPU, nell’app (Windows, WASAPI) | thread audio in media dall’1,1 al 2,7%, al massimo il 4,9% |
| Flusso, nell’app | buco massimo 10,3 ms (il periodo di WASAPI), zero errori, in tutti e sette i passi della prova |
| Memoria e caricamento | 86 MB di campioni a 16 bit, caricati in 1,1 s fuori dal thread principale |

**Che cosa manca prima del gioco vero** (fase 4; aggiornato dal §10, che ha tolto i campioni: i letti in streaming e la memoria non servono più):

- ~~i letti lunghi in streaming dal disco invece che in memoria (86 MB sono troppi per 23 stanze)~~;
- ~~i cinque cursori dei canali~~ (ci sono tutti, la musica compresa);
- ~~il «filo» del Sintonizzatore e lo spostamento di frequenza delle echi (§5.3)~~ (fatto: §11.6);
- ~~più materiale per il fiato: quindici cicli si riconoscono, dopo qualche minuto~~ (sintetizzato, ogni respiro è diverso);
- ~~i riverberi delle stanze grandi per convoluzione, offline~~ (ora un riverbero algoritmico in tempo reale, §10.2);
- la prova sulla macchina Linux vera.

## 9. Decisioni dell’autore

Il 14 ottobre, la sera, l’autore ha delegato le decisioni di questa fase (06, §18):

1. i file del §8.2 si scaricano, con il suo account Freesound: l’autore entra da sé nel pannello del browser;
2. nessuna registrazione in casa: il fiato, la tuta e il sonaglio si cercano nelle librerie;
3. l’archivio Sonniss solo dove manca un’alternativa CC0 o di pubblico dominio;
4. la musica (D14) è fatta con i materiali del gioco, e il sol diesis del §1.3 è deciso;
5. le licenze vanno in una schermata «Riconoscimenti e licenze» prima del gioco, generata dal registro.

## 10. Il suono sintetizzato

### 10.1 La decisione

Il 15 ottobre 2026 l’autore ha ascoltato i tre ascolti del prototipo (§8) e ha detto che i suoni scelti non andavano. Ha deciso: per ora niente suoni campionati; ogni suono si fa con il codice, al meglio possibile; più avanti, se servirà, porterà lui dei suoni veri, generati o cercati.

Il prototipo è stato rifatto tutto in sintesi, lo stesso giorno. Valgono ancora i principi del §1 (le cinque strade, il re e la sua assenza, i sei silenzi, i tempi, i livelli), le scene del mix (§2.2) e le stanze, gli eventi e gli strumenti dei §3–§5: cambia soltanto da dove nasce il suono. Il motore resta pronto a ricevere un suono vero al posto di uno strato, se un giorno arriverà.

### 10.2 I modelli

Tutto gira in tempo reale dentro il motore audio (`app/src-tauri/src/mondo/`), nello stesso `Sound` di kira, senza un file e senza memoria allocata nel thread dell’audio. Ogni modello ha le sue derive lente, così niente si ripete mai uguale.

| Suono | Modello | Dove |
|---|---|---|
| **il re** | sintesi additiva: otto armonici di re₂, un secondo banco scordato che batte; ogni armonico deriva piano di volume per conto suo (±12%), e sotto i primi quattro c’è una banda di rumore larga un hertz, che li fa vivere come il ronzio di un trasformatore vero. L’altezza non si muove mai | `re.rs` |
| **la ventilazione** | rumore rosa con un polo a 800 Hz (circa −5 dB per ottava, come un impianto vero), i condotti che risuonano piano sugli armonici del re, il sibilo della griglia intorno ai 2,2 kHz che trema con la turbolenza | `fondi.rs` |
| **le pompe e il fluido** | due pompe a pistone a ritmi diversi (1,37 e 0,91 corse al secondo, che si incontrano e si perdono): a ogni corsa il soffio del fluido spinto, all’inizio il colpo della valvola su quattro modi; il fluido in due bande che derivano, e ogni tanto un gorgoglio (bolle grandi, il modello di van den Doel) | `fondi.rs` |
| **la ventola della tuta** | rumore rosa in banda, il fremito delle sette pale, un tono di passaggio intorno ai 236 Hz che deriva e non si posa mai su una nota (nel relitto il re deve mancare) | `fondi.rs` |
| **le lamiere** | sintesi modale di lastre appoggiate: i modi seguono f(m,n) ∝ m² + ρ²·n², e il punto dove la lastra scatta decide quanto suona ogni modo; sei lastre per la plancia, ognuna con la sua voce; a volte scattano due volte | `colpi.rs` |
| **i relè** | l’ancora che batte sul nucleo e rimbalza due volte (a 1,6 e 3,2 ms), su sei modi piccoli; quando si apre, un colpo solo e più debole | `colpi.rs` |
| **gli stivali, le spinte** | tonfi: una sinusoide che cade di altezza e si spegne, con un soffio sordo davanti; nelle ossa | `colpi.rs` |
| **gli arpioni** | otto modi bassi di uno scafo, colpiti da un impulso e da un soffio | `colpi.rs` |
| **l’urto lungo, il gemito, i cigolii** | attrito a scatti (*stick-slip*): due superfici che si premono scivolano a strappi, e ogni strappo fa suonare i modi di una struttura; il ritmo degli strappi deriva, ed è quello il lamento. Il gemito è lento (16–28 strappi al secondo) su modi di una struttura enorme, fra 40 e 440 Hz | `colpi.rs` |
| **le gocce** | la bolla che risuona (van den Doel, la frequenza di Minnaert): una sinusoide che sale e si spegne, dopo lo schiocco dell’impatto; una goccia su cinque fa solo «tic» | `colpi.rs` |
| **i granelli, le crepe** | una pietra piccola che rimbalza sempre più vicino; un crepitio che si dirada su modi alti | `colpi.rs` |
| **il fiato** | il rumore dell’aria che passa, che trema come la turbolenza vera, colorato da tre strade: il naso (una banda larga intorno ai 3,3 kHz), la bocca (quattro formanti alla maniera di Klatt, come in una «h»), le labbra e i denti (un sibilo in alto che cresce più in fretta del flusso). Più forte si respira, più il soffio si schiarisce. Nei sospiri e nella fatica la voce si accende appena, all’inizio dell’espirazione; a volte le labbra schioccano prima di prendere aria. La tabella del §5.1 decide il ritmo; ogni respiro è diverso nella durata, nella forza e nel colore | `fiato.rs` |
| **il brusio** | fino a quaranta voci sintetiche: la glottide che si apre e si chiude (KLGLOTT88) con il suo tremito, il tratto vocale a cinque formanti, le fricative in parallelo. Ogni voce parla per sillabe inventate (vocali, nasali, liquide, fricative, occlusive) con l’intonazione che scende lungo la frase e gli accenti che la sollevano; nessuna lingua, quindi nessuna parola. Le formanti stanno più basse delle nostre (le creature sono «alte e sottili») | `voce.rs`, `brusio.rs` |
| **il riverbero delle stanze** | una rete di sedici linee di ritardo che si scambiano il suono con una matrice di Hadamard, con le prime riflessioni davanti; i bassi e gli acuti si spengono ognuno nel suo tempo, quattro linee ondeggiano appena perché la coda non suoni di metallo. La plancia: 0,45 s; il vestibolo: 1,3 s; nel vuoto niente | `riverbero.rs` |
| **il visore** | tic modali brevissimi (mai un bip), note sottovoce, i relè della protezione vitale | `colpi.rs`, `mod.rs` |

### 10.3 Come si è tarato

- **I volumi interni**: ogni generatore misurato da solo (`cargo run --release --example misura_strati`), con il valore efficace e il picco; i fondi a 0,1 di valore efficace, i colpi con il picco intorno a 1.
- **Il timbro del fiato**: lo spettro medio del respiro sintetizzato messo accanto a quello di quattro respiri veri, solo come misura (il naso che inspira, la bocca che espira, l’affanno, il respiro veloce). Il primo fiato era troppo scuro dal naso e troppo sibilante dalla bocca; adesso il naso ha il suo altopiano fra 1,5 e 4 kHz e la bocca cade sopra i 2–3 kHz, come quelli veri.
- **I livelli del mix**, in LUFS sui rendering, come chiede il §1.7.

### 10.4 Le misure

Dai rendering dei tre ambienti e del campionario (`cargo run --release --example rendi_ambienti`), il 15 ottobre 2026.

| Misura | Risultato |
|---|---|
| La plancia calma | −25,8 LUFS (il re da solo −28,7, la ventilazione −30, le pompe −38) |
| Il fiato, dentro il casco | verde −26 LUFS, ambra −23,3, fame d’aria −18,9, ipossia −25 |
| La ventola | −35 LUFS |
| Il brusio, sedici voci nella cuffia | −28,6 LUFS |
| Scatti | nessuno: la sorpresa interrompe il respiro in corso senza un clic (la forza scorre in otto millisecondi) |
| CPU, fuori dall’app | da 31 a 54 volte più veloce del tempo reale, su un core (il vestibolo, con sedici voci, è il più caro) |
| CPU, nell’app (Windows, WASAPI; `python strumenti/prova_eseguibile.py mondo`) | thread audio in media dal 2,3 al 4,6%, al massimo il 9,2% (il vestibolo) |
| Flusso, nell’app | buco massimo 10,2 ms (il periodo di WASAPI), zero errori, in tutti e sette i passi della prova |
| Avvio | 26 ms (il prototipo con le registrazioni caricava i campioni in 1,1 s) |
| Memoria | nessun campione: il prototipo con le registrazioni ne caricava 86 MB |
| Le prove | sei prove nuove in Rust (il modo che si spegne, il rosa, il riverbero che si spegne nel suo tempo, ogni colpo che finisce, il fiato che segue l’aria, la voce che parla e tace) |

### 10.5 Gli ascolti

In `progettazione/ascolti/`, in MP3: `11-plancia`, `11-scafo`, `11-vestibolo` (le tre scene del §8.1, con gli stessi comandi del prototipo) e `11-campionario`, i suoni uno per uno:

| Da | Che cosa |
|---|---|
| 0:00 | il re da solo, sotto il pavimento della plancia |
| 0:08 | la ventilazione |
| 0:16 | le pompe e il fluido |
| 0:25 | quattro lamiere |
| 0:33 | due relè, che si chiudono e poi si riaprono |
| 0:40 | due cigolii |
| 0:47 | due spinte dei propulsori, nelle ossa e nell’aria |
| 0:50 | due arpioni |
| 0:56 | l’urto lungo degli scafi |
| 1:01 | la ventola della tuta |
| 1:07 | il fiato: verde (dal naso), poi dalle 1:29 ambra, dalle 1:44 la fame d’aria, dalle 1:59 l’ipossia, alle 2:18 una sorpresa |
| 2:25 | gli stivali magnetici sullo scafo |
| 2:33 | una voce sola del brusio, poi dalle 2:43 il coro di sedici voci |
| 3:01 | quattro gocce |
| 3:08 | due granelli |
| 3:14 | tre crepe |
| 3:21 | due gemiti della nave |

Gli ascolti 10 (le registrazioni) restano per confronto.

### 10.6 Che cosa resta

- **Il giudizio dell’autore**, sugli ascolti: è l’orecchio che decide. Le misure dicono che i suoni hanno la forma giusta, non che sono belli.
- I punti deboli che si conoscono: una voce sintetica sola, da vicino, tradisce un poco la sua origine (nel coro e nella cuffia no); il fiato non ha i dettagli minuti di una bocca vera (la saliva, la deglutizione); il gemito è un attrito costruito, e può suonare più di macchina che di nave.
- Poi il resto della fase 4, come prima: il filo dal gioco al motore, gli ambienti delle 23 stanze, gli eventi, gli strumenti, il mix e le opzioni. Senza più la ricerca delle sorgenti.

## 11. Il filo: il gioco che suona

Il 16 ottobre 2026 l’autore ha ascoltato gli ascolti sintetizzati e ha detto che lo convincono; da lì il gioco è stato collegato al motore audio, e adesso la partita intera si sente.

### 11.1 Come passa il suono

- **La pagina non decide niente** (06, §9.1). A ogni turno il gioco manda al motore `turno.suono` così come lo calcola il ponte: gli stati e gli eventi (`app/src/gioco/suono.ts`, `Comando::Turno`). Il mondo sonoro parte con la partita, si abbassa di 10 dB nella pausa e nei pannelli, tace tornando al menu; nelle prove automatiche resta muto.
- **La regia** (`app/src-tauri/src/mondo/regia.rs`) ricava dallo stato tutto quello che dura e dagli eventi quello che accade una volta. Un caricamento rimette lo stato senza suonare gli eventi; la partita nuova sale dal nero in tre secondi.
- **Le ventitré stanze** stanno in una tabella (`stanze.rs`, dal §3): il mondo (la Santa Maria, il vuoto, la camera, il relitto), il riverbero, il re, la ventilazione, le pompe, il fondo dell’aria ferma, il brusio, le piogge di eventi, gli strati che sono solo loro, la superficie dei passi.
- **Le scene del §2.2** vengono dallo stato: la tuta (vera per il suono quando il casco si blocca, tre secondi dopo l’inizio della vestizione), la protezione vitale (dopo i relè), la fuga (le ossa più forti, il fiato sotto sforzo, il tremito), l’ipossia, l’anticamera (il casco asciutto), la casa (il casco tolto).
- **Gli strati nuovi** (`ambienti.rs`): il fondo dell’aria ferma, che nel santuario centrale respira ogni dieci secondi; i ronzii intorno al sol diesis (i proiettori in coro, il pilastro che pulsa e che, salutato, resta acceso, il laboratorio con l’energia, il campo che passa lungo le teche); il groviglio, che segue il faro, il bengala, l’energia e la fuga; il battito della serra e del seme nelle ossa; il cuore e il fischio dell’anticamera; il tremito; i soffi (il germinatoio, il filo d’aria nella gola, le canne); i crepitii (le scintille, la statica, la polvere); il canale della radio con Magazzino Quattro; le tre toppe della sala macchine.
- **Gli eventi**: tutti gli ottantacinque che il ponte può mandare sono conosciuti (`EVENTI_NOTI`); suonano i passi da una stanza all’altra, il boccaporto che si svuota, il rientro, il varco, la porta interna con il soffio di brusio, il primo contatto, i tre tagli con le voci che si staccano, la connessione, il groviglio, il bengala, la Grande Porta (il ronzio che accelera, il tam-tam, la dissoluzione), l’energia, l’altare, la teca della serra e la porta tonda (il clic armonioso), il sonaglio (il fiato si ferma), la fuga, la voce dei nomi, le echi, la traduzione completa (un accordo di voci tenute), i finali (il silenzio, la plancia del risveglio; con il risuonatore il brusio sale dalla stiva per l’aria; nelle due lettere la ventola rallenta e il fiato si spegne).
- **Il mix e le opzioni** (§2.5): i cursori del volume, degli ambienti, degli effetti e delle voci, il mono, la dinamica ridotta, i suoni intensi ridotti; un tetto vero a −2 dB sui picchi.

### 11.2 Le prove

- `python strumenti/audio/traccia.py --tutti` gioca i quattordici percorsi di collaudo con il ponte vero e scrive le loro tracce sonore in `collaudo/tracce/` (fuori da git).
- `cargo run --release --example prova_partite -- ../../collaudo/tracce` le fa giocare al motore: ogni evento conosciuto, ogni stanza nella tabella, nessun turno muto, nessun picco sopra −1 dB, da 21 a 33 volte più veloce del tempo reale. Il 16 ottobre: quattordici partite su quattordici.
- `cargo run --release --example rendi_partita -- <traccia> <file.wav>` rende una partita intera con il tempo di leggere ogni turno, e accanto scrive le note (a che minuto arriva ogni comando). «Vivi» dura undici minuti e sta a −24,3 LUFS.
- Quattro prove nuove in Rust (quattordici in tutto), fra cui una partita corta attraverso la regia; nell’eseguibile, i sei finali cliccati nell’interfaccia con il mondo sonoro acceso (muto), e la prova del suono: dal 2,7 al 4,9% della CPU in media, al massimo l’11%, nessun buco oltre i 10,5 ms, nessun errore.

### 11.3 Che cosa manca

La musica dell’intro (D14: il re che entra nel vuoto, che si assottiglia, che si chiude sul titolo; si compone sul montaggio bloccato, 21, §7), le luci del Navarca nella gola del ritorno, il montacarichi, la prova su Linux. L’orecchio dell’autore sulla partita intera c’è: il 16 ottobre 2026, ascoltato l’audio, ha detto che gli sembra ok; sul tocco dei pulsanti e sulla musica non ancora.

### 11.4 L’interfaccia: il tocco sui pulsanti

Il §5.8 è fatto, per il gioco e per il menu principale (che ha un mondo sonoro suo, con la musica: §11.5). Il codice è in `app/src-tauri/src/mondo/interfaccia.rs`.

- **Chi decide.** La pagina dice soltanto il gesto (`Comando::Tocco`): `scegli`, `conferma`, `annulla`. Lo ricava dal pulsante che riceve il clic (`app/src/gioco/tocco.ts`): chiudere, tornare indietro, dire di no, uscire dal discorso annullano; un comando che parte, un sì, un posto di salvataggio confermano; tutto il resto (aprire un fiore, un menu, una pagina) sceglie. Solo il clic, quindi anche Invio e Spazio su un pulsante a fuoco; mai un passaggio del mouse né lo scorrimento. Le lettere dei comandi e i tasti S e N non fanno clic, e per ora non suonano. Il motore decide da sé la voce, dallo stato del turno.
- **L’acciaio** (la Santa Maria): scegliere è un interruttore a levetta, un colpo secco e il suo rimbalzo; confermare è un relè che chiude, in due tempi (il secondo colpo a 50–60 ms); annullare è il relè che si apre, un colpo solo, più basso. Ogni tocco varia un poco di altezza.
- **La membrana** cresce con il primo contatto, in 5,2 s come le venature (`membrana` nel mondo, da 0 a 1; una partita ripresa dopo il contatto la trova già tutta). L’acciaio scende da 0 a −9 dB e non sparisce; sale un tocco morbido (un tonfo che cade da 230 a 130 Hz, con un soffio, un dito su una superficie umida), una bollicina che si chiude sotto il dito (non nell’annullare, che si stacca asciutto) e un parziale vetroso appena accennato (−16 dB), preso dal clic armonioso due ottave sopra: la terza, la quinta e la tonica del sol diesis, così il tocco sta sempre nell’accordo del gioco.
- **La fuga**: a ogni tocco un crepitio sottile, otto decibel sotto, la membrana che si strappa. **A casa** (la plancia del risveglio) resta il 30% della membrana: un tocco di membrana.
- **Il livello.** Il picco di un tocco sta fra −24 e −28 dBFS, la somma degli strati riportata a quella dell’acciaio solo (§5.8: «sotto i −24 dB»); con la membrana piena e nella fuga arriva a −22 circa. Sui mondi dell’ascolto 13 il tocco sta da 9 a 14 dB sopra l’ambiente nelle bande dei medi e degli acuti.
- **La strada.** Una strada nuova, `Bus::Interfaccia`: asciutta, fuori dalla stanza, dal casco e dalle ossa. Segue il volume generale e il cursore degli effetti; non segue la pausa né l’ingresso della partita, perché nei pannelli si tocca di continuo.
- **Le prove.** Otto prove in Rust (22 in tutto con le altre): ogni strato sta intorno a 0 dB e finisce; la conferma ha due tempi e la scelta uno; le dosi seguono la membrana; un tocco suona sotto i −22 dBFS e sopra i −35 in ogni stato (prima del contatto, dopo, nella fuga); segue i cursori e non la pausa; la membrana cresce in cinque secondi e a casa ne resta il 30%; la fuga aggiunge lo strappo; il JSON dalla pagina è quello che il motore legge. In node, cinque prove sul classificatore dei gesti, che controllano anche che le classi e gli attributi che legge siano ancora nei componenti. L’ascolto: `cargo run --release --example rendi_interfaccia -- <cartella>`; il file per l’autore è `progettazione/ascolti/13-interfaccia.mp3`, con le note accanto (a che secondo cade ogni tocco: la Santa Maria, la membrana che cresce, il relitto, la fuga).

### 11.5 La musica

Il 16 ottobre 2026 l’autore ha chiesto di cominciare dalla musica (D14), con il tocco del menu principale. È tutta sintetizzata, con i materiali del gioco: il re del reattore, il campo del sol♯, le voci tenute del brusio che cantano l’accordo del clic, il sonaglio del Piccolo, il tam-tam strofinato, il vetro del tema, il battito del seme. Il progetto, i brani (il menu, le soglie degli atti, l’Anziano nodo per nodo, le chiusure di cinque finali), le misure e le prove sono nel documento 21 (`progettazione/21-la-musica.md`); il codice è in `app/src-tauri/src/mondo/musica.rs`. Il motore la accende da solo, dallo stato e dagli eventi del turno (`regia.rs`); il menu lo chiede la pagina (`Comando::Menu`). Ha la sua strada (la sua sala, il suo cursore «Musica», il volume dopo la sala: un silenzio vero porta via anche la coda), e il suo posto: non passa dal casco né dalle ossa. Gli ascolti: `ascolti/14-musica-menu.mp3`, `14-musica-atti.mp3`, `14-musica-chiusure.mp3`.

### 11.6 Il filo del Sintonizzatore

Fatto il 16 ottobre 2026 (§5.3). Il codice è in `app/src-tauri/src/mondo/sintonia.rs` e nella regia; gli ascolti in `ascolti/15-echi.mp3`.

- **Lo spostamento di frequenza è vero.** Un `Spostatore` a banda laterale unica: due catene di passa-tutto (la trasformata di Hilbert di Olli Niemitalo, dodici poli; la prima va ritardata di un campione) fanno il segnale analitico, un oscillatore lo gira, e ogni componente si sposta della stessa quantità. La banda laterale sbagliata resta circa cinquanta decibel sotto. Una voce ha gli armonici a multipli della sua altezza: spostati di 60–90 Hz non lo sono più, e il suono è quello di un metallo che parla; la distanza fra gli armonici, cioè l’altezza che si sente, e il ritmo restano («il ritmo e l’intonazione restano, le parole no»). Il filo passa dallo spostatore in ogni suo uso: le echi, la voce che si stacca al taglio, la voce bassa della connessione e quella dei nomi.
- **Ogni eco ha il suo filo** (la tabella del §5.3, `ECHI`): chi parla è un profilo (altezza, tratto vocale, ritmo, quanto intona, quanto trema, soffio, spostamento, livello). L’Ingegnere è urgente e poi più piano; le pareti del corridoio sono quattro fili in fila, il Capitano più lento; le gole due fili, uno urgente e uno basso che risponde; lo Xeno-botanico stanco; l’Ufficiale medico piano (l’intonazione quasi a zero); il Navarca vecchio e tremante; lo Scriba piano; l’Ufficiale di navigazione preciso; il Custode grave. Le voci hanno due manopole nuove (`Voce::carattere`): l’intonazione e il tremito. Il filo arriva con la cosa che risuona (`risuonata`), un secondo e mezzo dopo la ricerca (il fruscio di sintonia, che fa l’attrezzo).
- **Il secondo strato** («la frequenza scende sotto la soglia di prima»): lo stesso filo, più grave e più nudo, senza il coro intorno (il brusio sparisce, −20 dB invece di −10), preceduto da una sintonia che scende. Il motore sa quale eco è, dalla stanza e da `risonate` (le cose già risuonate, nello stato del turno): una risonanza che non è il secondo strato di un’eco (la scatola nera, nella serra) non fa parlare nessuno. Quello dell’Ingegnere è «quasi un canto sottovoce»; quello del Custode «non trema più» (il tremito a zero); quello del Navarca parla «a se stesso, più vicino» (più forte, meno spostato).
- **Il Piccolo** è un anello di quattro secondi che ricomincia uguale: a ogni giro la voce nasce di nuovo con lo stesso seme, e l’oscillatore dello spostamento riparte da zero. Gira cinque volte, e finché si parla con lui (il dialogo con l’eco); quando smette, resta il fruscio della registrazione.
- **La lastra incisa** non è una voce: tre graffi uguali di una punta contro la pietra, con una pausa fra l’uno e l’altro, che si fermano sempre allo stesso punto.
- **Le prove.** Tredici prove in Rust (48 in tutto): lo spostatore sposta ogni componente della stessa quantità (quattro frequenze) e non cambia il volume; una voce spostata ha il secondo e il terzo armonico dove devono stare; le tabelle sono coerenti con il §5.3 e con le cose da sintonizzare di `echi.fav` e `ingresso.fav` (nessuna in più, nessuna in meno); attraverso il mondo vero, un’eco ha il suo filo dopo la ricerca e lo finisce, il secondo strato c’è solo se la cosa ha già risuonato, la lastra graffia e si ferma, l’anello gira cinque volte, ricomincia identico, non si ferma durante il dialogo e smette alla sua fine. Resta fuori «Torna a zero» (la sintonia che scorre e si ferma sul niente): oggi un comando a vuoto fa soltanto la ricerca, come «Soltanto un residuo statico».
- **Gli ascolti**: `cargo run --release --example rendi_echi -- <cartella>` (con `SOLO_FILO` impostata, soltanto il filo, per guardarne lo spettro) rende le quindici scene (ogni eco nella sua stanza, i secondi strati, l’anello e il dialogo con il Piccolo); `Solo("filo")` isola il filo nel mondo.


---

## 12. Il mix d'autore e la console di regia (16 ottobre 2026)

**Dopo la prima consegna con il suono, l'autore ha notato** che l'interfaccia e gli ambienti stavano nello stesso canale, che i rumori ambientali (soprattutto il respiro) erano troppo alti, e che fondere tutto in una sola traccia toglie a chi fa il gioco la possibilità di decidere i volumi. Decisione: **due livelli distinti**.

1. **Chi gioca** ha cinque cursori nella scheda «Audio» (06, §9.2): generale, **effetti** (tutto il suono del mondo, respiro e ambienti compresi: sono sempre effetti, e per lui un canale solo), **interfaccia** (il tocco dei pulsanti, che non è più sul canale degli effetti), musica, parlato.
2. **Chi fa il gioco** decide i **livelli relativi dei canali**, in dB, nel mix d'autore (`app/src-tauri/src/mondo/livelli.rs`): fiato, ventola, re del reattore, macchine (ventilazione e pompe), stanza, corpo (battito, cuore, fischio), bengala, colpi dell'ambiente, colpi degli effetti, brusio, filo del Sintonizzatore (le echi), radio, colpi delle voci, pulsanti, musica. I valori di partenza stanno in **`app/src/gioco/livelli.json`**, un file solo letto sia dal motore (a tempo di compilazione) sia dalla pagina. Partenza dopo l'ascolto dell'autore: fiato −10 dB, ventola −6, re −4, macchine −6, stanza −6, il resto a 0.

**La console di regia** è uno **strumento di sviluppo**, non una cosa per chi gioca: il mix d'autore si definisce *prima* del file finale, e nelle versioni da pubblicare i livelli sono quelli di `livelli.json`, fissi. La console c'è nello sviluppo e nelle consegne di ascolto (`RELITTO_REGIA=1 npm --prefix app run tauri build`), e non entra nel pacchetto di rilascio (la costante `__REGIA__` di `vite.config.ts`). `app/src/console/ConsoleMix.tsx`: **Ctrl+Maiusc+M** in qualunque schermata, senza fermare il gioco; un cursore per canale (da −40 a +12 dB), l'effetto si sente subito, i canali cambiati si colorano; le modifiche si ricordano nel browser dell'app (e valgono solo sopra la base con cui sono state fatte); «Ripristina» torna al file; «Copia i valori» mette negli appunti il nuovo `livelli.json`, da sostituire a quello del repository. Il ciclo è: si ascolta, si regola, si copia, si incolla nel file, si fa la consegna.
