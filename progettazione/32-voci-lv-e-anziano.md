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
- **Non respira.** È una memoria fatta di luce: tutti i respiri si tolgono dopo, e nei suoi testi non si mettono
  tag di fiato. L.V. è tutto fiato, l’Anziano non ne ha. Al nodo «silenzio» si sente soltanto il fiato di William
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

**Quanto è.** 917 parole in 31 battute diverse (23 righe, con le varianti che dipendono da quello che il
giocatore ha fatto). Una voce, una sessione.

**Dove suona.** Oggi nel gioco l’Anziano è testo da leggere con la musica sotto (`LIVELLO_ANZIANO`); la regia
segue già i nodi uno per uno, e la voce entrerebbe lì. Sarebbe il primo dialogo con la voce dentro il gioco, una
parte della versione doppiata.

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
| D-V4 | La descrizione della voce dell’Anziano | La bozza del §3.4. |
| D-V5 | L’Anziano con la voce subito, o con la versione doppiata? | Prima trovare la voce (passo 3); poi decidere. |
