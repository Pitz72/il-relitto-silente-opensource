# Il Relitto Silente — la musica con Lyria 3.5

Documento 22 della progettazione · 16 ottobre 2026 · la musica generata con Lyria 3.5 in Google Flow Music, i prompt e il metodo

Nasce dall’ascolto del 16 ottobre 2026. L’autore ha giudicato i suoni del gioco (il tocco dei pulsanti, gli echi del Sintonizzatore, il resto dell’audio): «in linea di principio vanno tutti bene». Ha giudicato **le musiche del documento 21: no**. La musica sintetizzata in Rust non resta; la musica la genera Lyria 3.5 in Flow Music, e i suoni restano sintetizzati. Questo documento dice che cosa si sa dello strumento (e che cosa no), che cosa chiedergli, con quali prompt, e che cosa succede ai file quando tornano.

**Aggiornamento del 16 ottobre 2026 (sera): l’autore usa anche Suno.** Per A1, A2 e A3 molti file arrivati sono di **Suno** (lo dicono i tag: «made with suno»), non di Lyria, e l’autore ha confermato: «sto usando entrambi i modelli», Suno è ammesso. Il titolo del documento resta «con Lyria» per storia, ma **le schede e i prompt valgono per tutti e due** (i prompt in inglese funzionano come punto di partenza anche per Suno). La cartella è `audio/musica-ia/`, e il registro dice, riga per riga, quale modello ha fatto che cosa. Il piano di Suno non è dichiarato: vedi D40 in fondo.

## 0. In sintesi

- **Che cosa cambia.** Si rovescia, **solo per la musica**, la scelta «tutto in codice» (06, §19; 21, §0). I suoni, le stanze, gli eventi, il Sintonizzatore restano sintetizzati nel motore audio. La musica diventa un insieme di file generati da Lyria 3.5, che il motore suona, incrocia e abbassa come suona già la sua.
- **Che cosa serve all’autore.** Un account Flow Music, il tempo di generare e ascoltare, e i prompt del §5. Io non posso usare Flow Music al suo posto: i file li scarica lui, e li mette in `audio/musica-ia/` (§6).
- **Che cosa resta nostro.** La **mappa musicale** del documento 21 non cambia: il re (re₂, 73,42 Hz) è casa, il sol♯ è la nota del relitto a un tritono, il tema sono quattro note di vetro, l’Anziano va dal sol♯ al re, ogni chiusura ha il suo carattere. I prompt dicono a Lyria quella mappa con parole sue.
- **Che cosa Lyria non può darci.** L’altezza esatta in hertz e l’intervallo 7/6 del clic armonioso (una terza che non è la nostra). Lyria suona in temperamento uguale: il sol♯, il si, il re♯ e il re saranno quelli del pianoforte. Si perde una sfumatura, non la struttura (§3).
- **Che cosa serve al motore.** Un lettore di file per la musica (con ripetizione senza stacco, dissolvenze incrociate, la sua strada nella sala e il suo cursore): lavoro mio, dopo che i primi file ci sono (§7).
- **Che cosa decide l’autore, oltre ai prompt**: il piano e i diritti (§2.4), la dichiarazione sull’IA e i riconoscimenti (§8), la licenza dei file di musica nel repository (§8).

## 1. Lo strumento, com’è oggi (16 ottobre 2026)

Le informazioni vengono da fonti pubbliche, controllate il 16 ottobre 2026; le più recenti che ho trovato sono di fine agosto. Ho distinto ciò che dice Google da ciò che dicono i recensori, e ciò che ho **verificato** da ciò che **non ho potuto verificare**.

**Verificato su fonti di Google**

- **Lyria 3.5 è uscito il 29 luglio 2026 dentro Flow Music** (`flowmusic.app`, già `flowmusic.google`). Google dichiara quattro miglioramenti: melodie più complesse e naturali, testi migliori e più fedeli al prompt, voci più espressive e con pronuncia migliore, **controllo più facile del tempo e della durata**. ([annuncio di Google](https://blog.google/innovation-and-ai/models-and-research/google-labs/lyria-3-5/))
- **Flow Music** è uno studio sul web (e un’app iOS): si «chatta con il Producer» come in uno studio. La pagina ufficiale elenca: canzoni complete con voce, remix dell’audio, effetti, **separazione delle tracce (stem)**, video musicali. ([flowmusic.app](https://flowmusic.app/))
- **La guida ufficiale ai prompt** (DeepMind, per Lyria 3) dice: partire da una richiesta semplice e aggiungere dettagli; scegliere genere ed epoca, anche incrociando generi; il **tempo** si chiede con le parole (veloce, lento, o uno stile che lo implica); si nominano **strumenti precisi**, anche inattesi (altrimenti Lyria sceglie quelli del genere); si descrive come il pezzo si muove fra le sezioni (una costruzione piano che sale in un ritornello forte); per le voci si descrive il cantante (timbro, lingua); «**Lyrics:**» prima delle proprie parole, i cori fra parentesi tonde. ([guida di DeepMind](https://deepmind.google/models/lyria/prompt-guide/))
- **La guida di Google Cloud** (per Lyria 3 e 3 Pro) dà lo schema: *genere e stile + umore + strumenti + tempo e ritmo + voce e lingua + testo*. Si scrive «**Instrumental**» per togliere le voci. Non documenta numeri di BPM, tonalità, tag di struttura né prompt negativi: dice di **descrivere ciò che si vuole**, non ciò che non si vuole. Documenta però i **prompt a tempi**, `[MM:SS]` a inizio riga, per Lyria 3 Pro. ([guida di Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-lyria-3-pro))
- **Ogni brano porta la filigrana SynthID** (un segno inaudibile) e metadati C2PA. ([Google Cloud](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-lyria-3-pro))
- **Google dice di non rivendicare la proprietà** del contenuto originale generato in Flow Music, e che i diritti d’uso commerciale sono pubblicizzati per i piani Google AI Plus, Pro e Ultra e i livelli corrispondenti di Flow Music; chi carica materiale resta responsabile dei suoi diritti. Questo non stabilisce né il diritto d’autore sul brano né l’assenza di diritti di terzi. ([MLQ](https://mlq.ai/news/google-releases-lyria-35-in-flow-music-with-upgraded-vocals-and-song-controls/), [The Rundown](https://www.therundown.ai/tools/lyria-3-5))

**Riportato da terzi (da controllare nell’app)**

- Durata dei brani **da 30 secondi a circa tre minuti**. (Il Rundown, MLQ, Kompozy.)
- Ingressi: testo, immagini, **audio caricato o registrato**, parole proprie. (MLQ.)
- Si può **rivedere il brano parlando al Producer**: accorciare l’introduzione, aggiungere un ponte, cambiare mix, strumenti, stile. (MLQ.)
- Piani: gratuito (crediti giornalieri, 2 generazioni insieme), Starter 8 $, Plus 24 $, Member 64 $ al mese. Le fonti non dicono quale piano include Lyria 3.5 e se il piano gratuito lo include. (Il Rundown; prezzi controllati il 31 agosto.)
- Scarico: MP3, WAV, M4A e stem; da verificare in quale piano. (Il Rundown.)
- Limiti: la coerenza varia da prompt a prompt e può servire rigenerare; la modifica fine «è ancora limitata rispetto a un DAW». (Kompozy.)
- I tempi dei prompt a `[MM:SS]` vengono, secondo Artlist, arrotondati alla battuta più vicina: in musica senza battuta, aspettiamoci che servano poco. ([Artlist](https://artlist.io/blog/lyria-3-prompts/))

**Non verificato: provalo nell’app prima di contarci**

- un campo per il **BPM** o per la **tonalità** (le fonti dicono solo «controllo del tempo e della durata»);
- «estendi» un brano, «sostituisci» una sezione, un interruttore «solo strumentale»;
- se i prompt a tempi valgono anche per Lyria 3.5 (sono documentati per 3 Pro);
- se il coro **senza parole** si ottiene con «Instrumental» (probabilmente no: vedi il §4, regola 5);
- che cosa dicono i Termini di Flow Music sull’uso in un videogioco.

## 2. Come lavorare

### 2.1 Il metodo in cinque mosse

1. **Un brano alla volta.** Si incolla il prompt della scheda nel Producer, con la durata impostata nell’interfaccia se c’è il campo (e scritta nel prompt).
2. **Quattro versioni per prompt.** Lyria cambia a ogni giro: se ne generano quattro, si scartano le peggiori, si ascolta il meglio con le cuffie.
3. **Si corregge parlando al Producer**, con le frasi del §4 («le correzioni»). Una correzione alla volta, e si riascolta.
4. **Si scarica il formato migliore** (WAV se il piano lo dà; altrimenti il più alto) e si annota nel registro (§6): il prompt esatto, la data, il piano, il modello (Lyria 3.5).
5. **Si passano a me i file migliori** (due o tre per scheda, non di più). Li misuro (altezza del bordone, livello, dove si può ripetere) e dico che cosa ne farò (§7).

### 2.2 Che cosa si cerca all’ascolto

Cinque domande, in quest’ordine; basta un «no» per scartare.

1. **Non c’è un ritmo.** Niente batteria, niente pulsazione regolare di basso, niente «beat». (Eccezione: il battito del cuore nelle schede che lo chiedono, lento e solo.)
2. **Non c’è una melodia in tempo.** Niente tema che si ripete a battute. Si ammettono le note isolate, lente, quando la scheda le chiede.
3. **La nota di casa è il re.** Il bordone grave sta sul re, e non scivola su altre note a metà brano (salvo dove la scheda lo dice).
4. **Il carattere è quello della scheda**: freddo, vasto, intimo, mai «epico», mai «cinema d’azione», mai dolce da sala d’attesa.
5. **Si può ripetere**, se la scheda lo chiede: comincia e finisce sullo stesso bordone, senza un finale che chiude.

### 2.3 Il linguaggio dei prompt, in inglese

I prompt sono **in inglese**: la guida di Lyria è in inglese, gli esempi sono in inglese, e un modello musicale dà il meglio con le parole del suo catalogo. Il testo dell’interfaccia e questo documento restano in italiano. Il vocabolario è quello della guida (genere, umore, strumenti, tempo, dinamica), con tre accorgimenti nostri:

- **Aggettivi, non negazioni.** La guida dice di descrivere ciò che si vuole. Dove serve escludere (il ritmo), si usano parole che già escludono: *beatless, drumless, free tempo, rubato, sustained, ambient, drone*.
- **Note con il loro nome.** «D» (re), «G-sharp» (sol♯), «B» (si), «D-sharp» (re♯). Lyria non obbedirà al centesimo, ma la tonalità si sente.
- **Niente nomi di artisti o di film.** La guida non lo vieta, ma una fonte (Artlist) dice che nomi propri possono bloccare la generazione; e descrivere i tratti musicali funziona meglio.

### 2.4 Il piano, i diritti, i dati

- **Il piano gratuito può non includere Lyria 3.5** e non dichiara diritti commerciali. Il gioco è un progetto pubblico e aperto che l’autore distribuirà: **conviene un piano a pagamento per il tempo della generazione** (il più basso basta come crediti: 3 000 crediti al mese sono circa 600 canzoni), e conviene **leggere i Termini di Flow Music e di Google AI** nell’account, perché i diritti commerciali dipendono dal piano. Questo è un punto dell’autore, non mio: io non posso verificare i suoi Termini.
- **I dati**: Google dice che i caricamenti e i brani possono servire a migliorare i prodotti, salvo si disattivi l’opzione, e che campioni possono essere riletti da persone. Se l’autore carica materiale suo (§3, strada B), disattivi quell’opzione.
- **SynthID**: ogni file ne porta il segno. Non è un difetto: lo si dichiara nel gioco (§8).

## 3. Due strade per ogni scheda

**Strada A, il prompt.** Si scrive il prompt della scheda. È quella che si prova per prima.

**Strada B, la traccia guida.** Flow Music accetta anche **audio caricato** (MLQ). Il motore sintetizzato del documento 21 ha già scritto la mappa di ogni brano: `progettazione/ascolti/14-musica-menu.mp3`, `14-musica-atti.mp3`, `14-musica-chiusure.mp3`. Si può caricare uno di quei file e dire al Producer *«Reimagine this as a real recorded piece»* con il prompt della scheda: l’altezza e l’ordine delle entrate verrebbero dalla traccia guida, il timbro da Lyria. **Non ho verificato quanto Lyria segua l’audio caricato**: si prova con il menu, e si guarda se il re resta il re. Se funziona, è la strada migliore per le chiusure, dove l’ordine delle cose conta più dell’atmosfera. (La traccia guida è nostra: caricarlo non cede nulla, ma vale la nota sui dati del §2.4.)

**Che cosa si perde, senza rimedio.** Il clic armonioso del gioco canta una terza minore settimale (7/6, 267 centesimi; 484,5 Hz), «un si che non è il nostro». Lyria suonerà il si temperato (300 centesimi). La quinta e il sol♯ restano quelle; il re₂ sarà a 73,4 Hz circa, se Lyria tiene il diapason a 440. **L’autore deve saperlo e decidere** (§9, D36): se un giorno vorrà quella terza giusta, resta il sintetizzatore, e il tema di quattro note si può rifare in codice (sono quattro note di vetro) e sovrapporre alla musica di Lyria.

## 4. Le correzioni: le frasi per il Producer

Da dire una alla volta, dopo aver ascoltato. Sono in inglese, perché il Producer risponde meglio.

1. *Ritmo che si insinua*: «Remove every drum and percussion hit. Keep only sustained tones, slow swells and long reverberant tails. No pulse at all.»
2. *Troppo melodico*: «Replace the melody with single long notes separated by silence. Nothing should sound like a tune.»
3. *Troppo «epico», troppo cinema*: «Make it colder, emptier and quieter. Less cinematic drama, more isolation and distance. No rising orchestral crescendos.»
4. *Il bordone non è sul re*: «Hold one deep sustained D drone (about 73 Hz) under the whole piece and never change it.»
5. *Il coro senza parole non viene, o canta parole*: togliere «Instrumental» e scrivere «Wordless choir vocalise on the vowels “ah” and “oo”. No words, no lyrics.»; se canta parole, aggiungere «The voices sing only open vowels, never words.»
6. *L’introduzione è lunga*: «Shorten the introduction; begin directly with the sustained D drone.»
7. *Non si ripete*: «Make the ending return to the same bare D drone the piece began with, so it can loop. No final chord, no ending flourish.»
8. *È troppo piena*: «Remove everything except the D drone and the one element described in the second sentence.»
9. *È troppo forte e compressa*: «More dynamic range, more space between events, much quieter overall.»

## 5. I prompt

**Premessa comune** (il «mondo»), già dentro ogni prompt: una nave aliena morta, vasta, in cui un pilota solo cammina. Il relitto canta sul sol♯; la nostra casa canta sul re; fra le due note c’è la distanza più grande possibile. La musica non ha battute: è fatta di strati che entrano e escono, lenti, in una sala enorme.

Ogni scheda dice: **dove serve**, **la durata**, **il prompt**, **che cosa deve sentirsi** (per il collaudo all’ascolto), **la variante** se la prima non viene.

### 5.1 Il menu principale (`M1`)

- **Dove serve:** il menu principale, in ripetizione. **Durata:** 3 minuti (si ripete e il motore lo ricompone; §7).
- **Prompt:**

```
Instrumental. Dark, spacious cinematic ambient drone for the main menu of a lonely science-fiction text adventure set inside a vast derelict alien starship. Free tempo, beatless and drumless, no melody in time: only sustained tones that slowly enter, swell and fade, with very long reverberant tails and long near-silences between them. The key centre never leaves D. A deep, warm sub-bass drone on D (about 73 Hz) holds under the whole piece; its upper harmonics slowly brighten and dim, like a reactor breathing. Over it, four slow episodes in separate moments: first, a cold, metallic, slightly inharmonic shimmer on G-sharp rises from the depths, bends up a little, and withdraws; second, a hushed wordless choir sings a sustained open chord on the vowels "ah" and "oo", and one soft felt-hammered glass note touches it; third, a tiny child's rattle rings a high D, and then a bowed tam-tam sings slowly out of the metal; fourth, the wordless choir sings an open fifth on D, then a warm D major chord with a bright F-sharp, and fades away. Very distant at the end, four slow glass-harmonica notes: G-sharp, B, D-sharp, then D. The piece begins and ends on the same bare D drone so that it loops seamlessly.
```

- **Che cosa deve sentirsi:** il bordone sul re sempre; i quattro episodi distinti; il vetro di quattro note sul finale; mai un ritmo.
- **Variante breve** (se il prompt lungo viene ignorato, perché la guida consiglia da tre a cinque frasi): *«Instrumental. Dark beatless ambient drone in D for a lonely sci-fi game about a derelict alien starship: a deep sustained D bass drone under everything, a cold metallic shimmer on G-sharp, a hushed wordless choir on “ah” and “oo”, a tiny rattle on a high D, and at the very end four distant glass-harmonica notes: G-sharp, B, D-sharp, D. Free tempo, huge reverb, long silences, loopable, 3 minutes.»*
- **Variante a tempi** (sperimentale; documentata per Lyria 3 Pro):

```
[00:00] Begin with only a deep, warm D drone (about 73 Hz) breathing slowly, beatless, in a huge dark space.
[00:35] A cold, metallic, slightly inharmonic shimmer on G-sharp rises from the depths, bends up a little, and withdraws.
[01:05] A hushed wordless choir sings a sustained open chord on "ah" and "oo"; one soft felt-hammered glass note touches it.
[01:35] A tiny child's rattle rings a high D; then a bowed tam-tam sings slowly out of the metal.
[02:05] The wordless choir sings an open fifth on D, then a warm D major chord with a bright F-sharp, and fades away.
[02:40] Four distant glass-harmonica notes: G-sharp, B, D-sharp, then D. Return to the bare D drone alone at [03:00], loopable.
```

### 5.2 Le soglie degli atti (`S2`–`S5`)

Brevi, per il cartello d’atto (da 9 a 15 secondi, con la coda). Lyria non le fa brevi: la prima prova (`S2`, 16 ottobre 2026) è uscita di **56 secondi** pur con «20-second» nel prompt, e l’autore non è riuscito a ottenere 30 secondi dal campo della durata. **Non ci si ostina**: si lascia il prompt com’è, si prende quello che esce e **taglio io** (da 15 a 20 secondi, con la dissolvenza in uscita; il motore ne suona l’inizio e lo abbassa nella sala). Le schede dicono che cosa deve esserci nel tratto che si tiene.

**`S2` · Atto II, «L’ingresso»** (20 s)

```
Instrumental. A 20-second dark ambient sting, beatless and drumless. A deep sustained D drone tightens, its harmonics narrowing like a throat closing. Below it a cold, metallic, slightly inharmonic field on G-sharp rises from underneath, as if a vast machine lay beneath the ship's hull, then slowly withdraws. One soft felt-hammered glass note rings once, far away, in a huge reverberant space. No melody, no rhythm, no vocals.
```

Deve sentirsi: il re che si stringe; l’ombra del sol♯ che sale e si ritira; una nota di vetro. Si taglia a 15 s.

**`S3` · Atto III, «Il corridoio»** (20 s)

```
Instrumental. A 20-second dark ambient sting, beatless. A hushed wordless choir sings a low sustained open chord: G-sharp, a minor third above it, and a perfect fifth, on the vowels "ah" and "oo", slowly swelling. Then two soft, distant felt-hammered glass notes: G-sharp, then B. Huge reverberant space, free tempo, no drums, no melody in time.
```

**`S4` · Atto IV, «Il Ponte»** (25 s)

```
Instrumental. A 25-second dark ambient sting, beatless. A bowed tam-tam sings slowly out of the metal and blooms. A tiny child's rattle rings a high D and a long note remains in the air after it. A hushed wordless choir holds a bare open fifth on G-sharp. Then three soft glass notes, very slow: G-sharp, B, D-sharp. Vast reverberant space, free tempo, no drums.
```

**`S5` · Atto V, «La fuga»** (25 s; la fine è un taglio netto)

```
Instrumental. A 25-second tense ambient sting. A deep D drone and a G-sharp metallic drone collide, beating against each other about three times a second. A dull, soft heartbeat begins slowly and accelerates until it is racing. A bowed tam-tam rises. The piece ends abruptly, in the middle of the sound, with no tail and no resolution. No melody, no drum kit.
```

Deve sentirsi: il battimento (la sensazione di due note che sfregano), il cuore che accelera, la fine di colpo. (Il motore lo spegne comunque di colpo; se Lyria lo smorza, si taglia.)

### 5.3 L’Anziano: quattro «letti» (`A1`–`A4`)

Il colloquio con l’Anziano ha quattordici nodi, e nel documento 21 la musica li seguiva uno per uno. Con file non si possono generare quattordici brani incrociabili; si generano **quattro letti**, lunghi e stabili, e il motore li incrocia nodo per nodo (§7), come faceva con i suoi strati. **La mappa proposta:**

| Letto | Che cosa è | Nodi dove suona |
|---|---|---|
| `A1` **presenza** | il sol♯ da solo, e il re sotto; freddo | benvenuto, silenzio (poi di nuovo benvenuto), memoria, tracce |
| `A2` **tensione** | il re e il sol♯ uno contro l’altro; senza voci | prezzo, altro (più un battito lento), aiuto |
| `A3` **calore** | il coro canta per la prima volta un accordo di casa | salto, piccolo, sangue, musica |
| `A4` **scioglimento** | il sol♯ scivola sul re; poi il re solo | congedo, dissolvenza, ultima voce |

Ciascuno dura **due minuti**, è stabile (senza una vera costruzione, per potersi ripetere), e comincia e finisce sullo stesso suono.

**`A1` · presenza** (2 min)

```
Instrumental. A cold, very slow, beatless ambient bed for a conversation with an ancient alien intelligence, two minutes, loopable. A single cold metallic drone on G-sharp, slightly inharmonic, like a vast machine singing alone, with a very low, quiet D drone far underneath it. No melody, no rhythm. Occasional slow swells. The piece begins and ends on the same sound, with long near-silences, in an enormous reverberant space.
```

**`A2` · tensione** (2 min)

```
Instrumental. A tense, very slow, beatless ambient bed, two minutes, loopable. A deep sustained D drone and a cold metallic G-sharp drone sit against each other, a tritone apart, grinding slowly with slow audible beating. No voices, no melody, no percussion. The tension never resolves and never builds into a climax. Enormous reverberant space; begins and ends on the same two sustained tones.
```

**`A3` · calore** (2 min)

```
Instrumental, with a wordless choir. A warm but still solemn, very slow, beatless ambient bed, two minutes, loopable. A deep D drone underneath. A wordless choir on the vowels "ah" and "oo" sings, for the first time, a gentle open chord on D, then A, then D, then F-sharp, each one dissolving into the next. A tiny child's rattle rings once on a high D, far away. No melody in time, no drums, enormous reverberant space. Begins and ends on the bare D drone.
```

**`A4` · scioglimento** (2 min)

```
Instrumental. A very slow, beatless ambient piece, two minutes, about leaving and being forgiven. At the start, a cold metallic drone on G-sharp. Over about twelve seconds it slowly glides down to a deep, warm, sustained D, and the metallic character dissolves. A bowed tam-tam blooms and fades. Then the D alone, bare and low, slowly losing its upper harmonics until only the deepest note remains and fades into silence. No melody, no drums, no vocals, enormous reverberant space.
```

### 5.4 Le chiusure dei finali (`C1`–`C5`)

Ogni chiusura dura da 55 a 70 secondi ed entra dove il mondo si è fatto silenzio. «Mani vuote» non ha musica (06, §11).

**`C1` · Vivi** (65 s)

```
Instrumental, with a wordless choir. A warm, slow, beatless ambient piece, 65 seconds, about coming home alive. A deep D drone, the home note of a spaceship's reactor. Under it a soft, dull heartbeat at 54 beats per minute, in time with the drone. A wordless choir on "ah" and "oo" sings four slow chords in order: D, A, D, F-sharp, the last one bright, like light. Then four very slow glass-harmonica notes: G-sharp, B, D-sharp, and finally landing on a high D, which resolves everything. No drum kit, no melody in time. Huge reverberant space.
```

Deve sentirsi: la risoluzione sul re; il battito a 54; la luce del fa♯.

**`C2` · La prima nota** (60 s)

```
Instrumental. A slow, beatless ambient piece, 60 seconds, about a single note that has been waiting. A sustained D, played twice at once: the second copy starts slightly out of tune with the first, beating against it about three and a half times a second, and over twenty-six seconds slowly settles into perfect unison, until the two become one. Then a high D rings in glass, and a bare open fifth on D settles underneath. No melody, no drums, no vocals, huge reverberant space.
```

**`C3` · La stiva piena** (70 s)

```
Instrumental, with a wordless choir. A dark, slow, swelling ambient piece, 70 seconds, about a hundred voices rising at once. A wordless choir builds over twenty seconds from a whisper to a vast layered chord on the vowels "ah" and "oo", on G-sharp, a minor third above it and a fifth, hundreds of overlapping voices. A metallic G-sharp field opens wide beneath. Then everything settles: a bowed tam-tam, and a final high D ringing in glass. No drums, no melody, huge reverberant space.
```

**`C4` · Doppio fondo** (55 s)

```
Instrumental. A dark, unresolved, beatless ambient piece, 55 seconds. A low hum of machinery with a slow dull heartbeat under it. Three soft felt-hammered glass notes, all on the same pitch, G-sharp, spaced far apart. The piece never goes to D and never resolves: it ends hanging on the G-sharp, with nothing to answer it. No melody, no drums, no vocals. Huge, cold reverberant space.
```

Deve sentirsi: **nessun re**; non si risolve.

**`C5` · Due lettere** (60 s)

```
Instrumental. An extremely sparse, beatless ambient piece, 60 seconds, about someone who has stopped breathing. A single deep D, full of harmonics, begins. One by one the upper harmonics leave, until only one low, bare note remains, and then not even that, fading into complete silence. No other instruments, no melody, no rhythm, no vocals. A very large, quiet room.
```

### 5.5 Il tema (`T`), da usare anche a parte (15 s)

```
Instrumental. A 15-second, very slow, quiet glass-harmonica motif in a vast dark reverberant space. Four notes only, each ringing out fully before the next: G-sharp, B, D-sharp, and then D, one semitone below the last. Played soft, with a felt hammer, no attack. No other instruments, no rhythm, nothing else.
```

Il tema si può anche rifare in codice (il motore ha già il vetro) e sovrapporre ai brani: è la strada sicura se Lyria sbaglia le note.

### 5.6 Che cosa non si chiede ancora

- **La musica dell’intro** (21, §7): aspetta le scene definitive.
- **Le tracce di «Mani vuote»**: non ce ne sono.

## 6. I file, dove stanno, come si chiamano

- Cartella: `audio/musica-ia/<sigla>/` (es. `audio/musica-ia/M1/`), con i file nominati `M1-01.wav`, `M1-02.wav`… (in ordine di giro) e, per quelli che l’autore tiene, `M1-scelto.wav`.
- Il **registro** `audio/musica-ia/REGISTRO.md`: per ogni file, la scheda, la data, il piano di Flow Music, il modello («Lyria 3.5»), il prompt **esatto** (con le correzioni dette al Producer, in ordine), e l’esito dell’ascolto. Serve a due cose: ritrovare come si è ottenuto un brano, e dire la verità nella dichiarazione sull’IA (§8).
- Non si perde nulla: i file non scelti restano (i brani sono pesanti; si valuterà se tenerli fuori dal repository, ma i prompt si tengono sempre).
- **Formato: MP3** (decisione dell’autore, 16 ottobre 2026: «non è un gioco commerciale, possiamo accontentarci»). Circa 3,6 MB a brano di tre minuti: i file entrano in git, il repository resta leggero. I formati pesanti (WAV, M4A, FLAC) restano fuori (`.gitignore`). Gli originali scaricati, intatti, stanno in `audio/musica-ia/<sigla>/originali/`: portano il manifesto C2PA di Google, e una modifica dei tag potrebbe invalidarlo (non ho uno strumento per verificarlo); i file in `<sigla>/` sono le copie di lavoro, con i tag.
- **I tag** (ID3) delle copie di lavoro: titolo di Flow Music, artista «Simone Pizzi · Lyria 3.5», artista dell’album «Simone Pizzi», album «Il Relitto Silente — Musica, menu principale», numero di traccia, genere Dark Ambient, data, lingua «zxx» (nessun contenuto linguistico), un commento con la provenienza e, in campi propri, il generatore e la scheda. La copertina di Flow Music e il manifesto C2PA restano dentro.

## 7. Che cosa fa il motore (lavoro mio)

Quando ci sono i primi file scelti, **io**:

1. **li misuro**: l’altezza del bordone (deve stare vicina a 73,4 Hz), il livello (LUFS e picco), la presenza di ritmo, la fine;
2. **li preparo**: ritaglio, dissolvenze, normalizzazione ai livelli dei vecchi brani (21, §4), conversione in OGG; per il menu e i letti dell’Anziano, **il punto di ripetizione** (un taglio incrociato che non si sente);
3. **scrivo il lettore**: un modulo del motore audio in Rust che suona un file in ripetizione o una volta, con la sua strada (la sala e il cursore «Musica» già descritti in 21, §2; **i file di Lyria hanno già il loro riverbero: la sala grande va abbassata o saltata, altrimenti impasta**), le dissolvenze incrociate fra i quattro letti dell’Anziano secondo la mappa del §5.3, la pausa che abbassa di 10 dB, il silenzio vero a «Resto ad ascoltare»;
4. **tengo il sintetizzatore musicale** nel codice come ripiego (se un file manca, suona il vecchio brano) finché la musica nuova non è tutta a posto; poi si toglie.
5. **aggiorno le prove** (le tredici prove in Rust sulla musica diventano prove sui file) e il collaudo del suono.

## 8. Che cosa cambia fuori dal suono

- **La dichiarazione sull’IA** (`riconoscimenti/Dichiarazione.tsx`, TESTO_DICHIARAZIONE, approvato il 15 ottobre 2026) dice oggi che cosa ha fatto l’IA nel gioco. Con Lyria si aggiunge una riga: la musica è generata con **Lyria 3.5 di Google (Flow Music)**, e ogni file porta la filigrana SynthID. **Il testo lo approva l’autore** (è suo: come la prima volta, glielo propongo e lo scrive lui, o lo approva).
- **I riconoscimenti** (`strumenti/riconoscimenti.py`): una riga per la musica; la verifica delle licenze (`--verifica`) deve sapere dei nuovi file.
- **La licenza.** Il repository diventa aperto; la licenza del codice, quella dei testi e delle immagini, e **quella dei file di musica generati** non sono ancora scelte. Per la musica pesa quello che dicono i Termini di Flow Music (§2.4). **Decisione dell’autore, da prendere con la licenza** (§9, D38).
- **La bibbia sonora** (10, §11) e il documento 21 si aggiornano: il 21 resta la **mappa** (che cosa suona dove), il 22 dice come si fa.

## 9. Le decisioni, e l’esito dell’ascolto

**L’ascolto del 16 ottobre 2026** (decisione 1 dell’elenco del prompt 17):

- `13-interfaccia`, `15-echi` e il resto dell’audio: **approvati** («in linea di principio i suoni vanno tutti bene»).
- `14-musica-menu`, `14-musica-atti`, `14-musica-chiusure`: **no**. La musica si rifà con Lyria 3.5 (questo documento). I tre ascolti restano in `progettazione/ascolti/` come **guide** (§3, strada B).

**Le decisioni che questo documento apre** (per l’autore; si prendono una alla volta):

- **D35 · Il piano di Flow Music.** Quale, e se paga per il tempo della generazione (§2.4). Raccomandazione: un piano a pagamento, il più basso, per un mese, dopo aver letto i Termini.
- **D36 · L’intervallo.** Rinunciare alla terza 7/6 del clic armonioso (§3), con il tema di quattro note rifatto in codice se Lyria non le dà giuste. Raccomandazione: sì, la struttura conta più dell’intervallo; il vetro nel codice resta come rimedio.
- **D37 · I quattro letti dell’Anziano** (§5.3) al posto delle quattordici scene. Raccomandazione: sì; è la sola strada che i file permettono.
- **D38 · La licenza della musica** e la riga sull’IA (§8): con la scelta della licenza del repository.
- **D40 · Suno.** Ammesso dall’autore il 16 ottobre 2026 («sto usando entrambi i modelli»). Restano da scrivere: **il piano di Suno** (conta per i diritti d’uso: da verificare nei Termini attuali, non so dirlo io), la **riga della dichiarazione sull’IA** che nomina anche Suno (§8), e la **licenza dei file** del repository aperto, che dipende dai Termini di tutti e due i servizi. Raccomandazione: tenere il registro aggiornato file per file (c’è), e decidere la licenza della musica insieme alla licenza del repository.
- **D39 · L’ordine.** Raccomandazione: prima **`M1`** (il menu) con le due strade, A e B, per vedere quanto Lyria segue la traccia guida e il re; poi **`C1`** (Vivi), la chiusura più importante; poi tutto il resto. Dopo il menu, decide se continuare.

**Stato (16 ottobre 2026):** `M1` ha due versioni, **tutte e due «bellissime» per l’autore**: «Bare Resonance» (2:55) e «Resonant Void» (2:40), in `audio/musica-ia/M1/`. Misure: il re₂ sta a 73,2 e 73,6 Hz (a 4 e 5 centesimi da 73,42), quindi **la musica sta in casa**; sono molto più forti dei brani sintetizzati (−16,2 e −16,6 LUFS contro −24,9: il motore li abbasserà di circa 8 dB, senza toccare i file); cominciano piano e finiscono in silenzio; nessuna pulsazione ritmica. **Non c’è il sol♯ del relitto**: Bare Resonance sta sul re con il sol (una quarta) e Resonant Void sul re con il la (una quinta). Per il menu, la casa è giusta; il sol♯ e il tritono servono alle soglie e all’Anziano (`S`, `A`), che non sono ancora generati. Il prompt usato e il piano di Flow Music, da compilare nel registro, aspettano l’autore. Prossimo passo: l’autore sceglie la prossima scheda (raccomandata: `C1`, Vivi).

**Aggiornamento (16 ottobre 2026, sera):** sono scelti e nel registro `S2`–`S5` (Lyria), `A1` «Cold Iron Orbit» (Lyria), `A2` «Tritone Loop», `A3` «Drones of the Deep» e `A4` «Departure and Forgiveness» (tutti e tre Suno); mancano `C1`–`C5` (le chiusure) e `T` (il tema). I letti dell’Anziano, tranne A1, stanno sul re e non hanno il sol♯ dei prompt (A2 non ha il tritono): bene per «casa», meno per «il relitto». Per averlo, una frase per il Producer: «Add a cold metallic G-sharp drone against the D, a tritone apart, beating slowly». Dopo i quattro letti si mappano ai quattordici nodi (§5.3) quando scrivo il lettore.
