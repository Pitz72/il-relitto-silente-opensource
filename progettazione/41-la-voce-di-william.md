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
limitatore del mixer, così il mondo sotto di lui non si abbassa a ogni consonante forte.

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
  pezzo, e dentro non si taglia. Con le prese della plancia non succede.

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

Quattordici, la plancia (`SM-001`…`SM-014`), arrivate il 13 e il 15 novembre; sedici pezzi del copione hanno la voce
(due sono uguali a un’altra presa), su 736. Il controllo del 15 novembre (`doppiaggio/william/consegne/controllo-2026-11-15.json`):
il testo è quello del copione; tre parole da far sentire all’autore (SM-011 «nel rosso», che Whisper sente «del
rosso»; SM-014 «lo faccio correre», sentito «scorrere»; in SM-001 Whisper sente un «ebbe» in più dopo «servirebbe»).
I file sono a 16 bit (il copione chiedeva 24), con i picchi sotto −3 dB.

Il 16 novembre 2026 l’autore ha chiesto se nella cartella `Downloads/DOPPIAGGIO LEO` c’era altro: i sedici file
(sciolti e nei due archivi TransferNow, identici byte per byte) sono tutti nel gioco, tranne `intro2.wav`, una
seconda versione del registro di bordo dell’intro. L’autore: «Archivialo come materiale storico»; sta in
`audio/sorgenti/voce/william-registro-intro-leonardo-presa2-storica-2026-11-15.wav`, fuori dal gioco.
