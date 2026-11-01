# 32 — Le voci di L.V. e dell’Anziano (ElevenLabs v4)

Scritto il 1° novembre 2026. L’autore: «in Il Viaggiatore abbiamo fatto la stragrande maggioranza del
doppiaggio con Eleven Labs tramite il connettore per Claude […] Dove non abbiamo trovato la voce giusta,
l’abbiamo disegnata. Vorrei sostituire la voce di L.V. con una voce di qualità ma solo se sai come facciamo a
dare quel tocco di stanchezza, affanno e respirazione alla fine dell’ossigeno e della vita di L.V.» E poi
l’Anziano: «come parla, con che voce? deve essere qualcosa di evocativo o esoterico? deve parlare nella sua
lingua e noi sentiamo le parole dal traduttore?»

È un’analisi: non è stato generato né cambiato niente. Le decisioni sono al §5.

## 0. In sintesi

- **L.V.: sì, si può fare.** Quattro mosse insieme: (1) una voce **disegnata sana**, un uomo sui trentacinque
  anni; (2) la fatica **scritta nel testo** con i tag di recitazione di v4, che salgono di blocco in blocco;
  (3) i **tre corpi** che il testo dà già, la sete, il freddo e l’aria; (4) i **respiri dosati dopo**, uno per
  uno, con Whisper e la catena radio che c’è già. Niente panico e niente rantoli: un uomo calmo che si spegne.
- **L’Anziano: niente traduttore.** L’ha già deciso il testo: «le parole mi si aprono dentro la testa, limpide e
  intere». In tutto il gioco è l’unica voce che arriva intera, e il suo valore sta in questo. **Né esoterico né
  solenne**: una voce semplice, calda, lenta, vicinissima, senza stanza e senza fiato. La sua lingua vera, il
  canto, si sente **sotto**, con il coro che il gioco ha già, e soltanto al primo contatto **prima** delle parole.

## 1. Lo strumento

Il connettore ElevenLabs di questa sessione ha:

- **eleven_v4**, il modello predefinito per il parlato. Capisce l’italiano e i **tag fra parentesi quadre**,
  messi prima delle parole che colorano: valgono fino al tag dopo. Quelli che servono qui: `[tired]`,
  `[breathless]`, `[raspy]`, `[trembling voice]`, `[softly]`, `[whispers]`, `[slowly]`, `[warmly]`,
  `[exhales]`, `[sighs]`, `[swallows]`, `[pause]`, `[long pause]`. I tag descrivono **come** si dice una
  frase, non che cosa fa chi parla. Le ellissi (…) danno pause più lunghe delle virgole.
- Due regolazioni: la **stabilità** (0–1: alta = prese uguali fra loro, bassa = più varie e più vive) e la
  **somiglianza** alla voce scelta. v4 non ha la velocità: il passo si fa con `[slowly]`, `[pause]` e le ellissi.
- **Il disegno di una voce** (eleven_ttv_v3): una descrizione (età, timbro, modo di parlare) e una frase da
  100 a 1000 caratteri; restituisce tre anteprime fra cui scegliere, e quella scelta si salva fra le voci del suo
  spazio di lavoro. È quello che si è fatto nel Viaggiatore quando la voce giusta non c’era.
- **I costi** sono piccoli: il prologo di L.V. è di circa 400 caratteri, i quattro pezzi della scatola nera di circa 540,
  l’Anziano di 917 parole (circa 5500 caratteri). Prima di ogni lotto si può chiedere il preventivo
  (`estimate_only`).

## 2. L.V.

### 2.1 Che cosa succede al suo corpo

La regia c’è già nel testo approvato. Il prologo (`relitto.fav`) e la scatola nera (`vita.fav`) dicono tre cose
del suo corpo, e ognuna ha un suono:

| Nel testo | Nel corpo | Nella voce |
|---|---|---|
| «L’acqua è finita ieri» | la gola secca | ruvida, qualche deglutizione: `[raspy]`, `[swallows]` (una o due in tutto) |
| «Il riscaldamento stanotte» | il freddo | un tremito appena, non i denti che battono: `[trembling voice]`, poco |
| «diciannove» | l’aria che manca | frasi spezzate, il fiato preso a metà: `[breathless]`, `[exhales]` |
| «prima di dirlo, l’ho già perso» | la mente che si annebbia | più lento, le parole che scivolano via, la voce che cala a fine frase |

**La curva vera della fine dell’aria.** In una tuta che non rinnova più l’aria viene prima l’affanno (il fiato
corto, la fame d’aria), poi il torpore: la mente si confonde e rallenta, il respiro si fa piccolo, viene sonno.
Chi muore così non grida. È anche la scelta che tiene lontano il «pacchiano»: un uomo lucido che si stanca, non
un attore che ansima. La placca graffiata fa la stessa curva: «I primi solchi sono profondi, decisi; gli ultimi
appena accennati, di quando la mano non teneva più». La voce deve fare come la mano.

### 2.2 La curva, blocco per blocco

Il nastro è uno solo: il prologo dell’intro ne è l’inizio, la scatola nera nella Serra ne fa sentire altri pezzi,
più avanti nel tempo. Conviene generarlo **tutto adesso, con la stessa voce**, anche i pezzi della Serra che oggi
il gioco scrive soltanto: serviranno quando il gioco avrà le voci, e la stanchezza resterà coerente.

| Blocco | Dove | Com’è | Tag | Stabilità |
|---|---|---|---|---|
| 1. «…la spia è verde» → «diciannove» | intro B1–B4; Serra, primo pezzo | stanco ma lucido; gola secca; fiato corto a fine frase | `[tired] [raspy]`, un `[exhales]` | 0,5 |
| 2. «Ho firmato…» / «…volevo andarmene» | intro B5–B6; Serra, secondo pezzo | la confessione: più lento, più basso | `[tired] [softly]` | 0,5 |
| 3. «Qui dentro c’è una cosa viva» / «…la chiave della teca» | intro B7–B9; Serra, terzo pezzo | la fatica del corpo: il fiato preso dentro la frase | `[breathless]`, `[pause]` a metà frase | 0,4 |
| 4. «…Matthew. Se mi senti» | Serra, quarto pezzo | il torpore: quasi un sussurro, le parole lontane fra loro | `[whispers] [trembling voice]`, `[long pause]` | 0,3 |
| 5. «dice ancora qualcosa, troppo piano» | Serra, la fine | una frase vera, sussurrata, poi abbassata sotto la statica finché non si capisce più | `[whispers]` | 0,3 |

Il blocco 5 può avere una frase che nessuno capirà mai: se l’autore vuole, la sceglie lui e resta un segreto del
gioco.

**Le parole non cambiano.** Si aggiungono soltanto i tag e qualche ellissi, nel testo che si dà a ElevenLabs;
il testo del gioco resta quello approvato il 30 ottobre. Un esempio per il prologo:

```
[tired] [raspy] …la spia è verde. [exhales] Allora registra… o almeno così dice.
[long pause]
L'acqua è finita ieri. [pause] Il riscaldamento… stanotte. [breathless] Il numero dell'aria lo leggo
sul visore e… prima di dirlo, l'ho già perso. [exhales] Lo rileggo… [pause] diciannove.
[long pause]
[softly] Ho firmato tutte le carte che servivano per partire da solo. [pause] Ho insistito io.
[long pause]
[breathless] Qui dentro c'è una cosa viva. [exhales] Sta dietro un vetro… a mezzo metro da me.
[whispers] La vedo pulsare… e quel vetro… non lo so aprire.
```

E per Matthew:

```
[whispers] [trembling voice] …Matthew. [long pause] Se mi senti… [exhales] ci ho provato.
[pause] Con te, dico. [long pause] Non so se è servito…
```

**Le prese.** Il nastro si genera in una presa continua per registrazione (il prologo, la scatola nera), perché
la stanchezza cresca da sola dentro la stessa recitazione; tre o quattro prese per volta. Se un blocco non va, si
rifà soltanto quello. Whisper (`strumenti/intro/trascrivi.py`) controlla che ogni parola ci sia e si capisca e
che il modello non abbia letto ad alta voce un tag (con «Elio» era successo con «lunga pausa»). L’autore ascolta
le due migliori e sceglie.

### 2.3 La voce: disegnata, e sana

Una voce già pronta della libreria si può provare, ma L.V. è una persona precisa: italiano, sui trentacinque
anni («di uno che a vederlo vivo avrei detto sui trentacinque anni»), intelligente, uno che è partito da solo e
se n’è pentito. Va **disegnata**, come nel Viaggiatore.

E va disegnata **sana**: la fatica la mettono i tag. Una voce nata già morente sarebbe stanca dalla prima parola,
e la curva del §2.2 non avrebbe dove salire. Del corpo resta nel timbro soltanto un poco di raucedine, che c’è
dall’inizio (l’acqua è finita ieri).

**Bozza della descrizione** (da approvare o cambiare: il disegno parte dalle sue parole):

> Italian man in his mid-thirties, native speaker with neutral standard Italian. Medium-low voice, warm, slightly
> hoarse, intelligent and understated. He speaks close to the microphone and quietly, like a man recording a
> private log for himself. Never theatrical.

La frase delle anteprime è il prologo approvato (circa 400 caratteri, nei limiti).

**La voce scelta (1° novembre 2026).** L’autore ha approvato la bozza così com’è; il disegno (eleven_ttv_v3,
italiano) ha dato tre anteprime di 29, 33 e 31 secondi. L’autore ha scelto **la seconda** e l’ha salvata nel suo
spazio ElevenLabs con il nome «Leonard De Rossi» (`voice_id` `R1Pl0D3WybQUkHdcw5HK`).

### 2.4 Il respiro, dopo

v4 respira da sé (con `[breathless]` ed `[exhales]` respira di più), ma quanti respiri e dove non si decide
prima. Con «Riko» l’autore aveva chiesto di togliere i respiri sintetizzati; con «Elio» sono rimasti. Qui si
tengono quelli della recitazione e si **dosano uno per uno**: Whisper dà dove sta ogni parola, i respiri sono
quello che sta in mezzo. Un piccolo attrezzo nuovo in `strumenti/intro/` misura ogni respiro e lo lascia, lo
abbassa o lo toglie secondo la curva: pochi all’inizio, di più verso la fine. Nessun respiro preso da altrove.

La catena radio (`strumenti/intro/voce_lv.py`, approvata) resta com’è. Il suo compressore lento alza i respiri:
va controllato che con la voce nuova non diventino troppi.

### 2.5 Che cosa cambia intorno

- **I tempi dell’intro** cambiano di nuovo: Whisper, poi `VOCE` in `scaletta.ts`, poi le prove, e le finestre di
  `strumenti/misure/intro_voce.mjs` (oggi tarate su 182,12 secondi).
- **La Dichiarazione sull’IA, i titoli di coda e `audio/LICENZE.md`** (voce LV) oggi dicono «Google TTS, voce
  Elio»: diventerebbero ElevenLabs v4, voce disegnata. Il piano ElevenLabs dell’autore deve permettere l’uso
  commerciale (con il Viaggiatore è già così, da verificare).
- **«Elio» resta** finché la voce nuova non lo convince all’ascolto.

### 2.6 La prova, e la decisione (1° novembre 2026)

Tre prese del prologo con i tag del §2.2 e la voce «Leonard De Rossi» (eleven_v4, 1674 crediti). Whisper:
tutte le 77 parole in tutte e tre, nessun tag letto ad alta voce, nessuna parola incerta (una sola, «una», nella
terza). Durano 38, 40 e 36 secondi, contro gli 86,6 della ripresa «Elio». Dentro le frasi il passo è simile a
quello di «Elio» o più svelto (fino a 3 parole al secondo in B3, B5, B7 e B8); i `[long pause]` hanno dato pause
di un secondo e mezzo al massimo, e i respiri sono brevi: la misura ne trova, ma sono prese di fiato corte, non i
respiri lunghi di «Elio».

L’autore: «sono tutte e tre di grande qualità. Ma per quanto la qualità di 11labs sia superiore al tts di
google, a Google resta tutta la parte di respiri che qui praticamente non c’è. Credo che teniamo quella di
Google senza spendere altri soldi.» **L.V. resta «Elio»** (D-V1). La voce «Leonard De Rossi» resta salvata nel
suo spazio ElevenLabs, non usata.

**Che cosa insegna per l’Anziano.** v4 respira poco e corre: per L.V. è un difetto, per l’Anziano, che non
respira e non ha fretta, la prima metà è un pregio. La seconda va corretta già nel disegno: la descrizione deve
chiedere un passo molto lento, e nel testo servono ellissi, non soltanto i tag delle pause.

## 3. L’Anziano

### 3.1 Che cosa dice già il testo

Da `ponte.fav`:

- «La figura non muove le labbra, ma le parole mi si aprono dentro la testa, limpide e intere.»
- «La nostra lingua era un canto. Le tue macchine traducono le parole, e le parole ne erano la parte più piccola.»
- «più vecchio del Navarca, con paramenti da cerimonia e un’espressione di calma profonda. Non minaccia: aspetta.»
- «i bordi che si sfanno appena, come una fotografia esposta troppe volte»
- «Sono quello che resta quando il cantastorie è svanito: l’ultima frase, scritta nella luce.»

### 3.2 Il traduttore: no

Il gioco ha già un arco di voci, e l’Anziano ne è la cima:

1. il traduttore al 4 %: «una voce metallica, distorta» (la lastra dati);
2. al 18 %: «più chiara, più personale» (il cilindro);
3. al 75 %: «quasi perfetta, malinconica» (la stele);
4. le echi, prese dal Sintonizzatore; L.V., da una radio rovinata;
5. **l’Anziano: l’unica voce intera**, senza macchine in mezzo;
6. subito dopo, l’ultima voce: «la più rovinata di tutte», piena di vuoti.

Se a parlare per lui fosse il traduttore, si contraddirebbe il testo e si perderebbe la cima. Le sue parole sono
in italiano perché arrivano nella testa di William come significato, nella lingua di William.

### 3.3 La sua lingua: il canto, sotto

Quello che è evocativo non sta nella voce, ma sotto. Il gioco ha già un **coro sintetizzato** (`musica.rs`,
`Coro`: cinque voci che cantano un accordo, ognuna sulla sua vocale) e ogni nodo dell’Anziano ha la sua scena,
dal sol♯ al re (`SCENE`). Due usi:

- **Il primo contatto.** Al nodo «benvenuto» (oggi senza coro), prima delle parole, il coro canta due o tre
  secondi l’accordo della scena: è la sua lingua vera. Poi il canto sfuma mentre la voce entra, e le parole «si
  aprono» dal canto, come dice il testo. Soltanto la prima volta: dopo, l’orecchio ha capito.
- **I bordi che si sfanno.** Sulla coda dell’ultima parola di ogni battuta, un alone brevissimo, come i bordi
  della figura. Facoltativo, e leggero.

Alla dissolvenza il suono c’è già: la luce entra nel seme sulla nota di vetro in re.

### 3.4 La voce

- **Né esoterico né solenne.** Niente riverbero da cattedrale, niente voce abbassata di tono, niente sussurro
  misterioso, niente effetti «alieni». Il testo è già solenne («Creatura di carbonio. Figlio delle stelle»): una
  voce solenne sopra lo raddoppia e diventa il saggio alieno che si è già sentito cento volte. Meglio il
  contrario: semplice, calda, bassa, lenta, quasi tenera. Un vecchio che parla di notte a chi gli si è seduto
  accanto. «Non minaccia: aspetta.»
- **Dentro la testa.** Asciutta, al centro, vicinissima, senza l’eco della stanza: l’unica voce del gioco senza
  stanza e senza radio. L’orecchio capisce «dentro la testa» da questo, senza effetti.
- **Non respira.** È una memoria fatta di luce: nei suoi testi non si mettono tag di fiato. (Che i respiri si
  tolgano dopo, tagliando, è superato: l’autore li accetta, e i tagli dentro la presa rovinano le parole, §3.7.) L.V. è tutto fiato, l’Anziano non ne ha. Al nodo «silenzio» si sente soltanto il fiato di William
  nel casco: il testo lo fa già.
- **L’età nel timbro, non nella debolezza.** Vecchio, più del Navarca, ma non fragile né tremante: è durato.
- **Stabilità alta** (0,7): le sue 31 battute devono essere della stessa persona, uguale a sé. Lui non cambia,
  aspetta. I tag pochi: `[softly]`, `[warmly]`, `[pause]` dove il testo dice «(Una pausa.)», `[long pause]` per
  «(Una pausa lunga.)»; per «(E poi, più piano:) Grazie di essere rimasto.» un `[softly]` più basso.
- **Non deve somigliare** alla voce di William (Leonardo Tomassetti, nella versione doppiata) né al traduttore.

**Bozza della descrizione** (da approvare o cambiare; rivista dopo la prova di L.V., §2.6: il passo molto lento
e il fiato che non si sente sono scritti nella descrizione):

> Very old man, calm, unhurried and deeply patient; his age is in the timbre, not in weakness. Deep, warm voice
> with a soft grain. He speaks very slowly and quietly, very close, as if right beside the listener, leaving long
> silences between sentences. No audible breathing. Gentle and kind; never solemn, never theatrical, never
> mysterious, never frail or trembling. Native Italian, clear standard diction.

La frase delle anteprime: il primo e l’ultimo saluto, «benvenuto» e «congedo», perché si senta la voce
all’inizio e alla fine del colloquio (circa 470 caratteri): «Creatura di carbonio. Figlio delle stelle, forse.
Benvenuto. So cosa cerchi: una risposta. Ma io non sono che la memoria di una domanda. Sono quello che resta
quando il cantastorie è svanito: l’ultima frase, scritta nella luce. La nostra canzone è finita. Le ultime
armonie si sciolgono adesso, in questo istante. A chi viene dopo abbiamo sempre chiesto una cosa sola: che la
musica fosse suonata, con forza, fino all’ultima nota. Vivi. Sarà il suono più bello.»

**La voce scelta (2 novembre 2026).** L’autore ha approvato la descrizione rivista; il disegno (eleven_ttv_v3,
italiano) ha dato tre anteprime di 56, 64 e 59 secondi: il passo lento chiesto nella descrizione è arrivato (con
il passo di L.V. lo stesso testo durerebbe circa 35 secondi). L’autore ha scelto **la terza** e l’ha salvata con il
nome «Edoardo Straniero» (`voice_id` `iTY5K16b3692EfhKhm8M`): «il suo suono profondo quasi da subwoofer lo rende
qualcosa che è oltre un suono in una stanza. Perfetta».

**Il basso è la sua firma, e non si taglia.** Nessun passa-alto su questa voce, né nella lavorazione né nel gioco
(il canale del parlato, oggi, è soltanto un guadagno: va bene così). Due attenzioni: sotto di lui suonano il re
grave della scena e i letti A1–A4, che possono impastarsi con la sua voce, quindi sotto la voce la musica scende
nel grave più che nel resto; e le parole devono capirsi anche dagli altoparlanti di un portatile, dove il grave
non arriva (si prova anche lì).

**Quanto è.** 917 parole in 31 battute diverse (23 righe, con le varianti che dipendono da quello che il
giocatore ha fatto). Una voce, una sessione.

**Dove suona.** Oggi nel gioco l’Anziano è testo da leggere con la musica sotto (`LIVELLO_ANZIANO`); la regia
segue già i nodi uno per uno, e la voce entrerebbe lì. Sarebbe il primo dialogo con la voce dentro il gioco, una
parte della versione doppiata.

### 3.5 Le battute di prova

Tre battute, scelte perché fanno sentire tre registri: il primo contatto («benvenuto», senza le varianti delle
echi e del risuonatore), il calore («piccolo», nella variante della risposta vera, la più ricca) e l’addio
(«congedo», nella variante dell’ascolto dato, che finisce con «Grazie di essere rimasto»). Soltanto le sue parole,
quelle fra «»; le indicazioni fra parentesi del testo diventano tag: «(Una pausa lunga.)» è `[long pause]`,
«(E poi, più piano:)» è `[softly]`. Niente `[slowly]`: la voce è già lenta di suo. Le parole non cambiano;
si aggiungono soltanto i tag e due ellissi.

```
[softly] Creatura di carbonio… Figlio delle stelle, forse. [pause] Benvenuto. [long pause] So cosa cerchi:
una risposta. [pause] Ma io non sono che la memoria di una domanda. [pause] Sono quello che resta quando il
cantastorie è svanito… l'ultima frase, scritta nella luce.

Era l'unico nato durante il viaggio. Non vide mai i tre soli: disegnava quello verso cui andavamo. Quando la
nave si fermò, chiese perché, e nessuno di noi ebbe il coraggio di rispondergli. [long pause] [warmly] Glielo
hai detto tu. Siete arrivati. [pause] Era vero, ed era la sola cosa che avesse bisogno di sentire.

La nostra canzone è finita. Le ultime armonie si sciolgono adesso, in questo istante. A chi viene dopo abbiamo
sempre chiesto una cosa sola: che la musica fosse suonata, con forza, fino all'ultima nota. [pause] Vivi.
[pause] Sarà il suono più bello. [long pause] [softly] Grazie di essere rimasto.
```

Due prese delle tre battute insieme, in una presa sola ciascuna: preventivo 1830 crediti.

**Le due prese (2 novembre 2026)**, 69 secondi l’una, misurate con Whisper e con
`esamina_anziano.py` (nella cartella di lavoro della sessione):

| | Presa 1 | Presa 2 |
|---|---|---|
| Parole | tutte, più una ripetuta: «adesso **in in** questo istante» (a 52 s) | tutte, nessuna differenza |
| Tag letti ad alta voce | nessuno | nessuno |
| Passo (parole al secondo) | benvenuto 1,65 · piccolo 2,27 · congedo 1,99 | 1,73 · 2,25 · 1,92 |
| Pausa più lunga | 1,5 s | 1,5 s |
| Fiato | cinque prese brevi, da −10 a −15 dB sotto la voce | sei, da −14 a −22 dB |
| Il grave | fondamentale 90 Hz; il 68 % dell’energia sotto i 150 Hz | 91 Hz; 69 % |

Raccomandazione: **la seconda**, intera e pulita. **L’autore ha scelto la seconda** (2 novembre). Il grave misurato conferma l’orecchio dell’autore: una
fondamentale intorno ai 90 Hz, più bassa della voce maschile comune, e due terzi dell’energia sotto i 150 Hz.

**Che cosa resta da fare dopo, e perché è facile** (superato: l’autore non vuole tagli dentro la presa, §3.7). I `[long pause]` danno al massimo un secondo e mezzo, poco
per «(Una pausa lunga.)». Ma l’Anziano non respira: le poche prese di fiato stanno nei vuoti e si tolgono, e
un vuoto senza fiato si allunga quanto si vuole aggiungendo silenzio, senza che si senta il taglio. Le pause
lunghe si fanno al montaggio, come chiede la regola dei tempi lunghi (respiri e pause veri, mai accorciati).

### 3.6 La musica di ElevenLabs: come funziona, e i tempi (2 novembre 2026)

L’autore: «Attenzione che 11labs genera anche musica. Ma dovresti documentarti come questa versione viene gestita
o con che sintassi e se è possibile dare il timing che si vuole.» Fonti: la documentazione ufficiale (le
*composition plans*, l’*inpainting*, le buone pratiche, il registro delle modifiche del 22 giugno 2026) e lo
schema del connettore.

**I modelli.** `eleven_music_v1`, `v2` e `v2.5`; il più avanzato è il **v2.5**. Si scrive come suona la musica,
non che cosa racconta: genere, umore, strumenti, tempo, produzione, in una-tre frasi; per i pezzi lunghi, come
cambia l’energia nel tempo. Tonalità e BPM scritti nel testo («in A minor», «130 BPM») vengono tenuti con
precisione, abbastanza da sovrapporre il pezzo ad altro materiale.

**Due strade, e il controllo dei tempi è diverso.**

| | Il connettore (quello che usiamo) | Le API, con la chiave |
|---|---|---|
| Che cosa si dà | la descrizione; `duration_seconds` (da 3 a 600); `lyrics_type` (`auto`, `custom`, `instrumental`) e `lyrics`; un audio di riferimento facoltativo (circa 30 secondi, solo musica propria, con un controllo dei diritti) | un **piano di composizione**: una lista `chunks` di blocchi, fino a 30 |
| La durata totale | esatta | esatta (da 3 secondi a 10 minuti) |
| I tempi dentro | solo a parole: «le voci entrano a 15 secondi», «solo strumentale dopo 1:45»; il modello li segue, ma niente li garantisce, e i silenzi vanno scritti, altrimenti li riempie | **ogni blocco ha la sua durata in millisecondi** (`duration_ms`, da 3.000 a 120.000), e con v2 e v2.5 la durata è sempre rispettata |
| Altro | | `with_timestamps` dà i tempi di ogni parola cantata; l’*inpainting* (sotto) |

**La sintassi di un blocco** (`chunks`): `text` con il nome della sezione fra quadre, le righe del testo
separate da a capo, le indicazioni brevi fra graffe e i suoni senza parole fra tonde, per esempio
`"[Canto]\n(ooh)\n(aah)"` o `{instrumental break}`; `duration_ms`; `positive_styles` e `negative_styles` (fino a
50 parole ciascuno: «a cappella», «G sharp», «no percussion»…); `context_adherence` (`low`, `medium`, `high`:
quanto il blocco segue quelli accanto). Gli stili del primo blocco danno il tono a tutto il pezzo.

**L’inpainting** (v2 e v2.5): un brano si conserva (`song_id`) e si ricompone con un piano che mescola pezzi
tenuti uguali (`range`, `start_ms`–`end_ms`, al minimo 50 millisecondi) e blocchi nuovi. Così si rifà una
finestra precisa, si allunga un pezzo o se ne fa un giro che si ripete.

**Quindi: si può dare il tempo che si vuole?** Sì, a blocchi di almeno 3 secondi, al millisecondo, con le API;
dentro un blocco no. Con il connettore è esatta soltanto la durata totale, e il resto si chiede a parole. Le API
vogliono la chiave del suo account ElevenLabs: per le sue regole gli preparo uno script e un solo comando, e la
chiave resta fuori da git, come i segreti dell’aggiornamento (revisione 25, G4).

**Che cosa può dare all’Anziano: il canto del primo contatto (§3.3).** È un pezzo corto con una forma sola,
quindi basta il connettore: una durata esatta di 7 secondi, voci senza parole (`lyrics_type` `custom`, `lyrics`
solo vocali fra tonde: `(ooooh)`, `(aaaah)`, come vuole la documentazione per i suoni senza parole), e la
sfumatura finale si rifinisce al montaggio. In sol♯, la nota della scena «benvenuto»: il letto A1 è «il sol♯ da
solo, e il re sotto», e il coro sintetico del gioco canta l’accordo «clic» sul sol♯. La descrizione, scritta come
una partitura (la regola dei prompt di musica):

> A cappella wordless choir, about twelve low male and female voices on sustained open vowels, centred on G sharp
> with a minor seventh and an open fifth. No pulse, no rhythm: a very slow swell from silence to a soft, warm
> chord, then the voices thin out to a single held note and fade. Distant and airy, as if heard from far inside a
> vast, empty ship. Science fiction, ancient and gentle; not religious, not gregorian, not a horror or mystery
> choir. No lyrics, no instruments, no percussion. 7 seconds.

Il nodo è pronto nel suo spazio ElevenLabs («Canto del primo contatto (prova)», v2.5, 7 secondi), non generato.
**Preventivo: 350 crediti per due versioni** (circa 25 crediti al secondo di musica). Nel montaggio di prova si
mettono a confronto, sotto la stessa voce, il canto di ElevenLabs e il coro sintetico che il gioco ha già: decide
l’orecchio. Se resta il canto di ElevenLabs, è un file di musica come i letti A1–A4: va nel registro della musica
(`audio/musica-ia/REGISTRO.md`), nella Dichiarazione sull’IA e nei titoli di coda.

### 3.7 Il canto e l’ascolto di prova (2 novembre 2026)

**Il canto.** Due versioni, chieste di 7 secondi: ne sono arrivate una di 7,03 e una di 9,02 (la durata del
connettore non è sempre esatta). Nessuna delle due è in sol♯, nonostante la descrizione: la prima sta su **re e
la**, la quinta vuota di re (nel gioco è l’accordo «ReVuoto», «la quinta vuota di casa»); la seconda su re con
mi♭, si♭, sol e fa. L’autore: «la prima è indubbiamente più evocativa mentre la seconda già partiva un qualcosa
di simil gregoriano. Quindi la prima per me è perfetta ed è incredibile». **Resta la prima, così com’è.** Due
lezioni: la tonalità scritta nella descrizione non è garantita (come con Lyria e Suno: in A3 manca il fa♯, in A4
il sol♯), quindi ogni file si misura; e il re, per caso, è la nota d’arrivo del colloquio («dal sol♯ al re»,
06, §18): il primo contatto canta la casa che il colloquio raggiunge alla fine. Sotto il benvenuto suona però A1,
in sol♯, a un tritono dal re: nell’ascolto la musica della scena entra a 4 secondi, mentre il canto sfuma, e i
due si toccano piano per due o tre secondi. Il coro sintetico non è servito: l’autore ha scelto a orecchio.

**L’ascolto** sta in `consegne/Ascolto Anziano 2026-11-02/` (fuori da git): «1 - Benvenuto, con il canto»,
«2 - Il Piccolo (la risposta vera)», «3 - Congedo (con l’ascolto)», circa 35 secondi l’uno.

- **La voce:** la presa 2, battuta per battuta, pulita dai fiati (21 vuoti dove la presa di fiato è diventata
  silenzio vero), con le pause allungate fino alla misura della punteggiatura e delle indicazioni: 2,6 secondi
  dopo «Benvenuto.», 3,2 prima di «Glielo hai detto tu», 3,0 prima di «Grazie di essere rimasto». A circa
  −20 dBFS di valore efficace, al centro, asciutta.
- **I tagli** non seguono i tempi di Whisper, che sbagliano di qualche centesimo (la prima prova spezzava le
  parole: «tu. Tu siete arrivati», «Sì, era vero»), ma l’inviluppo della voce: si taglia dove il suono si spegne
  davvero, 35 dB sotto le parole, e dove ricomincia. Nella presa le battute sono attaccate («…di sentire la
  nostra canzone»): lì si taglia sull’attacco di Whisper, mai dentro la parola dell’altra battuta.
- **La musica** è quella del gioco, resa dal motore (`rendi_musica` e una prova temporanea, ora fuori dal repo):
  i letti A1, A3 e A4 dai file. Il dialogo si apre sempre dal benvenuto, che precarica i letti; aprirlo a freddo
  su un altro nodo, nella resa più veloce del tempo reale, dà silenzio, perché il file non è ancora pronto. Sotto
  la voce la musica scende di 7 dB, e il grave sotto i 200 Hz di altri 5.
- **Il canto** entra a 0,3 secondi, la voce a 4,6, mentre il canto sfuma.

**Le note dell’autore e la seconda versione (2 novembre 2026).** Sul canto: «Sotto non si tratta di un coro ma
di un brano armonioso e molto spazio misterioso. Per me è un capolavoro.» Sulla voce: «nello spezzone 2 e 3 la
voce è tagliata malissimo. Le prese di fiato non c’erano e anche se ci fossero stati erano accettabili. Così si
sentono alcune parole tagliate e un briciolo di quello che è tagliato riparte più avanti.» Sulla musica:
«preferisco che abbassi un po’ la musica e che togli il ducking che fa troppo radio.» Rifatto così: **la voce
intera**, com’è nella presa, tagliata soltanto ai due capi di ogni battuta (nessun fiato tolto, nessuna pausa
allungata: le pause sono quelle che ha recitato); **la musica fissa**, 5 dB sotto il livello del motore, senza
abbassarsi quando lui parla. Le battute durano 21,6, 22,7 e 23,4 secondi, come nella presa; Whisper ci sente
tutte le parole, senza frammenti. Per il team c’è anche un file solo, «L’Anziano - ascolto di prova
(integrale)», 1:28, MP3 a 256 kbps nella stessa cartella: le tre battute in fila, 2,5 secondi di silenzio fra
l’una e l’altra, la musica della seconda e della terza che entra in un secondo.

**L’ultima correzione.** L’autore: «quando dice "avesse bisogno di sentire" il re è spezzato e si riprende nel
segmento finale». Whisper aveva messo l’attacco di «La nostra canzone» a 45,32 secondi della presa, dentro il
«re»; in realtà «sentire» finisce a 45,58, segue più di un secondo di silenzio vero, e «La» comincia a 46,68. Il
taglio fra due battute ora cade nel silenzio vero più lungo che le separa (almeno 80 ms, 45 dB sotto le parole),
non sui tempi di Whisper: il Piccolo finisce a 45,63, il Congedo comincia a 46,63. L’integrale dura 1:26; Whisper
ci sente tutte le 138 parole (più un «Grazie a tutti» inventato a 85,5 secondi, sulla musica che sfuma: la voce
finisce a 82,9). Per il resto l’autore: «tutto perfetto direi». Le regole che ne
vengono, per tutte le voci: una presa non si taglia dentro, e sotto una voce la musica non fa ducking. Il resto
di questo paragrafo descrive la prima versione, scartata.

**La verifica con Whisper** della prima versione, sul missaggio pieno e sullo stesso senza il grave (un passa-alto a 250 Hz, come da
un portatile): tutte le parole delle tre battute, in tutti e due i casi, e nessun frammento ai tagli. L’unica
mancanza è un «è» («il cantastorie è svanito») nel missaggio pieno del benvenuto, che senza il grave c’è: una
svista di Whisper su una parola di una sillaba, non un taglio. Le parole si capiscono anche senza il grave.

### 3.8 La canzone dei titoli di coda con ElevenLabs? (proposta, 2 novembre 2026)

L’autore: «dato che lyria e suno tendono ad usare sempre le stesse canzoni e dato che qui con il connettore puoi
comunicare perfettamente quello che vuoi e come lo vuoi dalla canzone, che ne pensi di provare a generarla se
avanzano crediti per farla esattamente come la vuoi per metterla a confronto con quella che abbiamo?»

Pronta nel suo spazio ElevenLabs, non generata (nodo «Titoli di coda: Voice in the Deep (prova ElevenLabs)»,
v2.5): **lo stesso testo e lo stesso stile** del §5.9 del documento 22, perché il confronto con «Voice in the
Deep» sia alla pari; la stessa durata, **178 secondi**, perché il nastro dei titoli resti con l’orologio della
canzone; le indicazioni del testo fra graffe, come vuole ElevenLabs (`{low strings enter}`, `{voice alone}`), e
nella descrizione, a parole, «a 2:40 la voce canta da sola l’ultima riga». Che cosa non è garantito: i tempi
interni e la tonalità (§3.6, §3.7). **Preventivo: 8900 crediti per due versioni**, 4450 per una.

**Rimandata** (l’autore, 2 novembre): «mi sono rimasti 1.700 crediti, non ce la facciamo. Questa cosa la
aggiorneremo.» Il nodo resta pronto nel suo spazio ElevenLabs, con il testo e la durata: quando ci sono i
crediti, basta generarlo.

**«Voice in the Deep», riascoltata e approvata**: la canzone di **Lyria** 3.5 del 19 ottobre, che c’è già (l’impronta
del file è quella del registro; la versione di ElevenLabs non è mai stata generata). L’autore, 2 novembre, dopo averla
risentita da sola: «la
canzone è meravigliosa, degna di un grande film di fantascienza evocativa e riflessiva. Approvato.» Resta nei
titoli di coda; la prova con ElevenLabs, se un giorno si fa, è soltanto un confronto.

### 3.9 Gli effetti sonori con ElevenLabs (idea, 2 novembre 2026)

L’autore: «appuntiamoci anche che possiamo rifare tutto il reparto sound fx con 11labs, vedo che si possono fare
anche effetti sonori.» Oggi tutti i suoni del gioco sono sintetizzati nel motore in Rust (bibbia sonora, §10 e
§11: 23 stanze, 85 eventi), da quando, il 15 ottobre, l’autore ha scartato i campioni di prova scaricati; aveva
detto che dei suoni veri sarebbero potuti arrivare più avanti. Che cosa offre ElevenLabs (il modello
`eleven_text_to_sound_v2`, dal connettore): un suono per volta, descritto in una frase concreta (che cos’è, la
grana, l’altezza, l’attacco, lo spazio: «close-mic», «distant»); `duration_seconds` da 0,5 a 30; `loop`, per un
suono che si ripete senza giunture (i fondi delle stanze); `prompt_influence`, quanto segue la descrizione. Le
regole della guida: niente parole visive, un suono per generazione (gli strati si fanno a parte), clip corte.
Niente è deciso: se si fa, è un lavoro a sé, da progettare con la bibbia sonora (quali suoni, quali restano
sintetici, come entrano nel motore), e ha bisogno di crediti.

## 4. L’ordine proposto

1. **L.V., la voce.** L’autore approva la descrizione (§2.3); tre anteprime sul prologo; sceglie lui; si salva.
2. **L.V., il nastro.** Il prologo e la scatola nera intera, in v4, tre o quattro prese; Whisper; le due
   migliori all’ascolto in `consegne/`. Poi i respiri dosati, la catena radio, `VOCE`, le prove, la beta.
3. **L’Anziano, la voce.** Descrizione (§3.4), tre anteprime su «benvenuto», sceglie lui; poi tre battute di
   prova (benvenuto, piccolo, congedo) montate con la loro scena e il coro del primo contatto, in un ascolto in
   `consegne/`.
4. **L’Anziano nel gioco**: subito, o insieme alla versione doppiata (D-V5).

## 5. Le decisioni (una per volta)

| | Domanda | Raccomandazione |
|---|---|---|
| D-V1 | Sostituire «Elio» con ElevenLabs? | **Decisa** il 1° novembre: no, L.V. resta «Elio», che ha i respiri (§2.6). |
| D-V2 | La descrizione della voce di L.V. | **Decisa** il 1° novembre: la bozza del §2.3; scelta la seconda anteprima, «Leonard De Rossi». |
| D-V3 | Il canto prima delle parole, al primo contatto con l’Anziano | Sì, soltanto la prima volta (§3.3). |
| D-V4 | La descrizione della voce dell’Anziano | **Decisa** il 2 novembre: la bozza rivista del §3.4; scelta la terza anteprima, «Edoardo Straniero». |
| D-V5 | L’Anziano con la voce subito, o con la versione doppiata? | Prima trovare la voce (passo 3); poi decidere. |
