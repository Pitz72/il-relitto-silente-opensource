# La voce di William nel gioco (documento 41)

Scritto il 16 novembre 2026, a notte. La richiesta dell’autore, il 15 novembre, con le prime quattordici prese di
Leonardo Tomassetti (la plancia, `SM-001`…`SM-014`): «ma non ti avevo già mandato dei file di Leo? perché non sono
integrati? Il modo in cui l’audio del parlato e dei dialoghi deve funzionare è esattamente come abbiamo fatto ne Il
Viaggiatore». Poi: «Sì, costruiscila».

Le prime quattro prese erano arrivate il 13 novembre: controllate e archiviate, nel gioco non c’erano, perché il
gioco non aveva un lettore per la voce di William. Avrei dovuto dirlo subito e proporre di costruirlo.

## 1. Come funziona nel Viaggiatore

Studiato il 15 novembre sul sorgente (`C:\Users\Utente\Documents\GitHub\IlViaggiatore`, versione 1.42.0:
`app/src/gioco/voce.ts`, `parti.ts`, `components/ViaggiatorePlayer.tsx`, `gioco/musica.ts`; il progetto è in
`pre-produzione/08-doppiaggio-tts.md`). Come lo vive chi gioca:

- il testo del turno compare tutto, e la voce parte da sola con lui; il testo non avanza con la voce;
- le parti si ritrovano dal **testo stampato**: il racconto è del narratore, le «» del personaggio, le parentesi della
  voce di servizio; vanno **in fila** nell’ordine del testo, con 0,3 s fra due frasi della stessa riga e 0,55 fra due
  righe;
- al primo tasto (non Maiusc, non Tab) o al primo comando la voce **tace di colpo**, e il testo resta; Esc, se la voce
  parla, la zittisce soltanto, senza aprire la pausa; **F2** ridice l’ultimo turno;
- le **risposte dei dialoghi** le legge il narratore (è il protagonista) quando ci si ferma sopra con il mouse un terzo
  di secondo, o ci si arriva con la tastiera; mai sopra chi sta parlando; scelta una risposta, non si ridice;
- una riga **senza file resta muta**: niente sintesi di riserva;
- un modo della voce nelle opzioni («recitata», «nessuna», «lettore di schermo»), un cursore «Voce»;
- la musica scende di 6 dB sotto la voce.

## 2. Come è fatto qui

**Le prese** (`strumenti/audio/voce_william.py`). Leonardo consegna un WAV per presa, con la sigla del copione come
nome (`sm-001.wav`, e così via: le sigle e i testi sono in `doppiaggio/william/copione.json`). Lo strumento, per ogni
presa arrivata in `doppiaggio/william/consegne/` (fuori da git):

- toglie il silenzio ai due capi: la voce comincia dove un pezzo di 20 ms passa −40 dBFS, e da lì si torna indietro
  finché c’è qualcosa sopra −66 (il **respiro** prima della prima parola resta); ogni presa di Leonardo comincia con
  mezzo secondo di rumore della registrazione, staccato dalla voce da un silenzio vero, che resta fuori;
- porta le parole a −23 dBFS (la mediana dei pezzi di 50 ms) e piega piano i picchi sopra −4,5 dB fino a −1,5;
  nessun filtro, nessun taglio dentro la presa;
- scrive `audio/musica-ia/WI/WI-<SIGLA>.mp3` (mono, 44,1 kHz, 96 kbit/s), le impronte, la tabella per il ponte e per
  la pagina (`app/src/motore/racconto.json`: ogni pezzo del copione che ha la sua presa, con le parole che William
  dice), la tabella delle sigle per il motore (`app/src-tauri/src/mondo/prese_william.rs`, tutte le 604 sigle del
  copione) e le risorse dell’app (`tauri.conf.json`).

Una presa «uguale» a un’altra (il copione le registra una volta sola) suona quella. Una presa già fatta dalla stessa
sorgente non si rifà. Quando arrivano prese nuove: si copiano in `doppiaggio/william/consegne/` e si lancia lo
strumento, poi si costruisce il gioco.

**Il ponte** (`app/src/motore/ponte.py`, `_racconto`). A ogni turno trova a schermo i pezzi che hanno la loro presa:
le parti che dice William (il racconto, le scritte che legge fra «», mai le voci degli altri) devono esserci tutte, in
fila; fra una parte e l’altra possono stare le voci degli altri. Il pezzo più lungo vince, e due pezzi non si
sovrappongono. Manda al suono l’evento **«racconto»**, con due liste: le prese che nel testo vengono prima di ogni
altra voce (`prese`) e quelle che vengono dopo una di loro (`poi`: un personaggio parla, e William racconta dopo).
Anche il primo turno: all’inizio della partita William racconta la plancia. Le risposte dei dialoghi non vanno
nell’evento.

**Il motore audio** (`app/src-tauri/src/mondo/racconto.rs`). Un lettore suo, asciutto (è il narratore: non passa
dalla cuffia), sul cursore del parlato, con le parole intorno a −18 dBFS. Erano −22 (fra Yusuf e la voce di
servizio), appena 2 dB sopra la plancia calma: l’autore, giocando la beta 13 il 16 novembre 2026, «La voce di
William nella parte "gioco" è un po bassina». Alzata di 4 dB (`LIV_WILLIAM` in `mondo/mod.rs`); i suoi picchi (la
cresta delle prese è di 19 dB sopra le parole) li piega un tetto suo a −4,5 dBFS (`TETTO_WILLIAM`), prima del
limitatore del mixer, così il mondo sotto di lui non si abbassa a ogni consonante forte. Lo stesso giorno, sulla
beta 14: «la voce dell’assistente è bassa come era bassa la voce di William nel gioco, quando legge il risultato
dell’analisi della nave»: la voce di servizio stava 5 dB sotto William, e nello stesso turno si sentono uno dopo
l’altra. Portata al suo livello (`LIV_SERVIZIO`, +9 dB sopra il lettore), con lo stesso tetto ai picchi.

- Un turno nuovo fa tacere quello che diceva, in sei centesimi di secondo; le prese del turno partono con il testo
  (0,15 s; la prima della partita 2 s, quando l’intro si è aperta sulla plancia), in fila, con 0,55 s fra l’una e
  l’altra.
- Le altre voci (la nave, Yusuf, la scatola nera, la voce di servizio) **aspettano William**, e poi la loro pausa; le
  prese `poi` aspettano che le altre voci, e l’Anziano, abbiano finito.
- F2 ridice le prese dell’ultimo turno in cui William ha parlato; una partita nuova o caricata le dimentica.
- L’anteprima di una risposta parte solo se William non sta raccontando il turno; un’anteprima può prendere il posto
  di un’altra, e non diventa l’ultimo turno di F2.
- Una presa che non c’è non tiene ferma la fila.
- La pagina può sapere se William parla (`audio_mondo_stato`, il campo `racconto`).

**La pagina.** F2 ridice (`tastiera.ts`); ogni altro tasto lo fa tacere, tranne Maiusc, Ctrl, Alt, Tab ed Esc; Esc, se
William parla, lo zittisce soltanto, se no fa quello che faceva (chiude il fiore, apre la pausa). Nel dialogo
(`Dialogo.tsx`), fermandosi un terzo di secondo con il mouse su una risposta, o arrivandoci con la tastiera, William
la dice, se Leonardo l’ha registrata (`racconto.ts`, `racconto-tabella.ts`); se a un turno nuovo il mouse è già fermo
su una risposta, aspetta che si muova, e il fuoco che il dialogo mette da sé sulla prima risposta non conta. Nella
scheda Audio delle opzioni, **«Voce di William»: recitata o nessuna** (di base recitata); il testo del cursore
«Parlato» non dice più che le voci non ci sono.

## 3. Le scelte mie, da dire all’autore

- **La musica non scende sotto William.** Nel Viaggiatore scende di 6 dB; qui il 2 novembre l’autore ha chiesto
  musica ferma e più bassa sotto le voci, senza salire e scendere («fa troppo radio»). Ho tenuto la sua regola del
  Relitto. Se la vuole come nel Viaggiatore, è una riga.
- **Le pause.** Fra due prese di William 0,55 s (la pausa fra due righe del Viaggiatore); fra William e una voce
  della nave resta la pausa approvata il 7 novembre (1,4 s).
- **Il lettore di schermo** non ha un modo suo: il gioco ha già la sua accessibilità, e la scelta è «recitata» o
  «nessuna».
- **Una presa che contiene la voce di un altro in mezzo** (per esempio il racconto, poi una voce della nave, poi
  ancora il racconto, in una presa sola) suona intera e poi lascia parlare l’altro: Leonardo registra una presa per
  pezzo, e dentro non si taglia. Il contrario, una battuta di Yusuf con il racconto in mezzo, dal 17 novembre si
  divide nelle sue frasi (§5). Con le prime quattordici non succedeva; succede con `SM-030`, la scansione lunga
  (§5).

## 4. Le prove

- **In Rust** (`racconto.rs`): le prese partono con il testo, in fila con la pausa; un comando nuovo le fa tacere e F2
  le ridice; le prese `poi` aspettano le altre voci; l’anteprima non parla sopra il racconto, una prende il posto
  dell’altra; spenta, non parte niente; una presa che manca non ferma la fila. Le 17 partite nel motore audio
  (`prova_partite`) con l’evento nuovo.
- **In node** (`prove/racconto.test.ts`): le parole contate come il ponte; ogni presa della tabella ha il suo file; le
  risposte; i tasti.
- **Il collaudo** (`collaudo/eventi.py`, punto 8): il copione è quello del gioco di adesso (se i `.fav` cambiano, le
  sigle possono spostarsi: si rifanno il copione e le prese), le prese della tabella hanno il loro file, e
  all’inizio della partita William racconta la plancia.

## 5. Le prese, a oggi

**Cinquantuno**: `SM-001`…`SM-014` (arrivate il 13 e il 15 novembre), `SM-017`…`SM-022`, `SM-026`…`SM-031`
(arrivate il 16 novembre) e `SM-032`…`SM-058` (arrivate il 17 novembre 2026): la plancia, Yusuf alla radio, la
cuccetta. Sessantatré pezzi del copione hanno la voce, su 736. Nel gioco le cinquantuno prese durano 9:14 (le
venticinque nuove 3:47).

**Nella serie non manca niente fino a `SM-058`.** I sette numeri che non hanno un file non lo avranno: il copione
li registra una volta sola, e nel gioco suonano la presa uguale (`SM-015` è `SM-013`, `SM-016` è `SM-014`: il faro
di prua con «usa» invece di «accendi»; `SM-023` è `SM-020`, `SM-024` è `SM-021`, `SM-025` è `SM-022`: il
lanciarpioni con «usa» invece di «spara»; `SM-043` è `SM-040`, «Ho trovato una cosa.», e `SM-049` è `SM-047`, «Te
lo porto.», le stesse risposte a Yusuf in due nodi). La prima presa che manca è `SM-059`, la sala macchine.

**Le prime quattordici.** Il controllo del 15 novembre (`doppiaggio/william/consegne/controllo-2026-11-15.json`):
il testo è quello del copione; tre parole da far sentire all’autore (SM-011 «nel rosso», che Whisper sente «del
rosso»; SM-014 «lo faccio correre», sentito «scorrere»; in SM-001 Whisper sente un «ebbe» in più dopo «servirebbe»).
I file sono a 16 bit (il copione chiedeva 24), con i picchi sotto −3 dB.

Il 16 novembre 2026 l’autore ha chiesto se nella cartella `Downloads/DOPPIAGGIO LEO` c’era altro: i sedici file
(sciolti e nei due archivi TransferNow, identici byte per byte) sono tutti nel gioco, tranne `intro2.wav`, una
seconda versione del registro di bordo dell’intro. L’autore: «Archivialo come materiale storico»; sta in
`audio/sorgenti/voce/william-registro-intro-leonardo-presa2-storica-2026-11-15.wav`, fuori dal gioco.

**Le dodici del 16 novembre** (`SM-017`, `018`, `019`, `020`, `021`, `022`, `026`, `027`, `028`, `029`, `030`,
`031`): i comandi di manovra; il lanciarpioni guardato (prima e dopo l’aggancio) e sparato (da lontano, a segno,
a cavi già tesi); la radio guardata (prima e dopo l’aggancio), usata, ascoltata; la scansione lunga, la prima volta
e le altre. I dodici file sciolti e i dodici dell’archivio `TransferNow-20261116TIGWzGyk.zip` sono identici byte
per byte. Giocati dal ponte sulla plancia, i comandi le fanno dire tutte e dodici.

Il controllo (`doppiaggio/william/consegne/controllo-2026-11-16.json`, come quello del 15): 48 kHz, 16 bit (il
copione ne chiede 24), mono; i picchi fra −6,6 e −3,5 dBFS, nessun campione pieno, nessuna presa sopra −3; le parole
fra −26,3 e −18,7 dBFS (lo strumento le porta tutte a −23); il fondo fra −82 e −74,5 dBFS; in testa 1,1–1,3 s, in
coda 0,4–1,4 s. Negli MP3 del gioco i picchi stanno fra −8,4 e −2,0 dBFS (`SM-030` il più alto). Il testo è quello
del copione, e riascoltati dopo il taglio ai due capi gli MP3 hanno tutte le parole. Le cifre che Whisper scrive in
numero («200», «4» per «duecento», «Quattro») non sono differenze. Due parole da far sentire all’autore:

- `SM-018`, «Servono a tenere **ferma** una preda»: Whisper sente «firma» (large-v3, large-v3-turbo e medium);
- `SM-031`, «La **scansione** è sullo schermo», le prime parole della presa: large-v3 e medium sentono «La canzone
  (è) sullo schermo», large-v3-turbo sente «La scansione è sullo schermo».

**`SM-030`, la scansione lunga, ha in mezzo la voce del computer** (è il caso del §3). Nel testo William parla tre
volte, e fra una e l’altra il computer di bordo dice «Lunghezza: trecentoquaranta metri…» e «MATERIALE NON IN
ARCHIVIO.»; in fondo c’è il suggerimento «(Adesso puoi ACCOSTARE.)». Leonardo ha letto le tre parti di William in una
presa sola, senza le parole del computer, con una pausa dove parlerebbe lui: 1,6 s dopo «se la prende comoda», 2,3 s
dopo «si arrende e scrive». Nel gioco la presa suona intera (28,6 s) e poi la voce di servizio dice in fila le sue
tre parti (7,3 s, 1,9 s, 1,4 s): chi ascolta sente William dire «si arrende e scrive», poi il suo commento, e
soltanto alla fine il computer, con la lunghezza e con «MATERIALE NON IN ARCHIVIO.». Nella prima pausa la parte del
computer non ci sta (7,3 s contro 1,6), e dentro una presa non si taglia. Da far sentire all’autore, che decide:
tenerla così, o chiedere a Leonardo le tre parti in tre prese.

**Le venticinque del 17 novembre** (`SM-032`…`SM-042`, `SM-044`…`SM-048`, `SM-050`…`SM-058`): la manovra
(accostare, la scansione lunga chiesta prima, l’accostata a cinquanta metri); Yusuf alla radio (la descrizione, il
racconto dentro le sue battute, le risposte che William gli dà); la cuccetta (la stanza, la branda, l’armadietto,
l’oblò, il registro di bordo guardato, esaminato e preso, la chiavetta). I venticinque file sciolti e quelli
dell’archivio `TransferNow-20261117Ps9DUvnw.zip` sono gli stessi.

Il controllo (`doppiaggio/william/consegne/controllo-2026-11-17.json`, come i precedenti): 48 kHz, 16 bit, mono; i
picchi fra −9,0 e −3,7 dBFS, nessun campione pieno; le parole fra −29,6 e −22,5 dBFS (`SM-037` e `SM-038`, «Una
pausa», le più basse: lo strumento le porta tutte a −23); il fondo fra −81,6 e −74,5 dBFS; in testa 1,1–1,4 s, in
coda 0,5–1,1 s. Negli MP3 del gioco i picchi stanno fra −8,2 e −1,5 dBFS. Il testo è quello del copione; nel
registro di bordo (`SM-055`, `SM-056`) Leonardo legge anche le scritte fra «» («TSC-1972…», «Settimana sei…»), che
sono sue. Le cifre di Whisper («4», «340», «2105») non sono differenze, e nemmeno «cucetta» e «ferraia» (Whisper
perde le doppie e il «gli»). Da far sentire all’autore:

- `SM-046`, la risposta «E se dentro c’è qualcuno?»: Leonardo dice «E se **c’è dentro** qualcuno?», le due parole
  scambiate (le stesse parole, a schermo resta il testo del gioco);
- `SM-056`, la firma «W. T.» in fondo all’ultima riga del registro: Whisper sente «VT».

**Le battute di Yusuf con il racconto in mezzo.** In cinque battute (`apertura` due volte, `credito`, `cosa`,
`qualcuno`) il testo alterna Yusuf e William: «Magazzino Quattro.» — *Una pausa, il tempo di leggere chi chiama.* —
«William. Se è per il credito…». Leonardo ha registrato solo il racconto, come chiede il copione, e la battuta di
Yusuf era un file solo: il gioco faceva dire a Yusuf tutta la battuta e poi a William il suo racconto, e in `cosa`
William finiva su «Poi:» quando Yusuf aveva già parlato.

L’autore, 17 novembre 2026: «Sì, dividile». Fatto così:

- **I file di Yusuf** (`strumenti/audio/voce_yusuf.py`, `PARTI`): la battuta si lavora intera, come prima (rifatta,
  è identica campione per campione ai file di prima), e poi si divide in una parte per frase fra «»: `YU-01a`,
  `YU-01b`… (sedici file al posto di otto, più il messaggio dell’intro). I tagli cadono a metà dei silenzi veri fra
  due frasi (sotto −70 dBFS, 0,15–0,8 s), con 20 ms di dissolvenza; nella fuga (`YU-07`, `YU-08`: anche lì il testo
  ha il racconto in mezzo, «Aspetta.», «Una pausa, e dietro di lui il magazzino.») la statica del canale non tace
  mai, e il taglio cade a metà del tratto senza voce, con 120 ms di dissolvenza. Il conto sottovoce del credito
  («Uno, due… dieci.») sta con la seconda frase: William dice che Yusuf conta, «come fa sempre prima di dirmi di
  sì», poi si sente il conto, e il «No.». La risata corta di `qualcuno` sta con la frase che la segue. Riascoltate
  con Whisper, le sedici parti hanno ognuna la sua frase, intera.
- **Il ponte** riconosce la battuta intera (`VOCI_YUSUF`) e manda le parti (`PARTI_YUSUF`), ognuna dove sta la sua
  frase. Per ogni presa «poi» manda anche quante voci asciutte (Yusuf, L.V.) vengono prima di lei nel testo
  (`dopo_voci` nell’evento «racconto»).
- **Il motore audio**: la fila della radio conta le battute finite nel turno; finite quelle che stanno prima della
  presa di William, cede a lui (`VociNave::passo_con`, `Racconto::soglia`), e la presa entra con la sua pausa
  (0,55 s). Finita la presa, la frase che continua la battuta entra dopo la stessa pausa. Senza la voce di William
  (o senza la sua presa) le frasi di Yusuf restano attaccate, con il silenzio che hanno nei file: come prima.
  `SM-048` è una presa sola con dentro due pezzi di racconto («Lo sento ridere, corto.» e «Un’altra pausa.»): entra
  dopo la prima frase di Yusuf, intera, e le altre due frasi la seguono.

Una prova del motore (`william_racconta_fra_le_frasi_di_yusuf`) lo controlla; l’ascolto delle sei scene alla radio,
reso dal motore con i tempi del gioco, è in `consegne/Ascolto Yusuf e William 2026-11-17/` (2:10).

**Le prese corte dentro le frasi lunghe.** Con le prese del 17 novembre il ponte metteva «Una pausa.» (`SM-038`, e
le cinque battute del Ponte uguali a lei) dentro la chiamata della fuga, «Una pausa, e dietro di lui il magazzino.»:
le parole di una presa corta c’erano tutte, in fila, dentro una frase più lunga che non ha ancora la sua presa. Ora
`racconto.json` porta anche le parole dei pezzi senza presa (`muti`, 536): a schermo occupano il loro testo e
restano muti, come nel Viaggiatore, e il pezzo più lungo vince. Rigiocati i diciassette percorsi del collaudo,
nessuna presa che prima si sentiva ha perso la voce.
