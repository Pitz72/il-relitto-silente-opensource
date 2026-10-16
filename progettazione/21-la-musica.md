# Il Relitto Silente — la musica (D14)

Documento 21 della progettazione · 16 ottobre 2026 · la musica, fatta con i materiali del gioco

Vale insieme al §18 di `06-app-desktop.md` (la decisione D14: la musica è fatta con i materiali del gioco, il re come radice, il sol♯ a un tritono) e alla bibbia sonora (`10-bibbia-sonora.md`, §1.3 e §11). Il 16 ottobre 2026 l’autore, ascoltato l’audio del gioco («mi sembra ok»), ha chiesto di cominciare dalla musica, con il tocco dei pulsanti del menu principale. Questo documento dice che cosa è stato fatto, come, e che cosa resta.

**Aggiornamento del 16 ottobre 2026.** Ascoltata la musica, l’autore l’ha **scartata** (i suoni, invece, vanno bene): la musica si rifà con Lyria 3.5 in Google Flow Music, e i brani sintetizzati qui sotto restano come **mappa** (che cosa suona dove, con quali note) e come **traccia guida**, finché i file nuovi non li sostituiscono. Come si fa, con i prompt: `22-musica-con-lyria.md`.

## 0. In sintesi

- **È tutta sintetizzata, nel motore audio in Rust**, con gli stessi strumenti del resto del suono: il re del reattore, un campo di parziali sul sol♯ delle macchine del relitto, le voci tenute del brusio che cantano l’accordo del «clic armonioso», il sonaglio del Piccolo, un tam-tam strofinato, il vetro del tema, il battito del seme. Nessun file, nessuna registrazione (06, §19).
- **Non ha battute né una melodia in tempo.** Ogni brano è una sequenza lenta di entrate e uscite degli strati, scritta in secondi. Il re, la nota di casa, non cambia mai; il sol♯, la nota del relitto, gli sta a un tritono; le chiusure e l’Anziano decidono da che parte sta la nave.
- **Cinque brani vivono nel gioco**: il menu principale (che si ricompone da solo), la soglia di ogni atto dal secondo, l’Anziano (nodo per nodo, dal sol♯ al re), la chiusura di cinque finali su sei, e il tema che le lega. «Mani vuote» non ha musica: il reattore, e basta (06, §11).
- **La musica ha la sua strada**: una sala molto grande, il suo cursore nelle opzioni («Musica»), e un volume che si abbassa nella pausa. Non passa dal casco né dalle ossa: non sta nel mondo. Il motore la accende da solo, dallo stato e dagli eventi del turno; il menu lo chiede la pagina.
- **Non c’è ancora la musica dell’intro** (B, E, G: il re che entra nel vuoto, che si assottiglia, che si chiude sul titolo): si compone sul montaggio bloccato, e il montaggio aspetta le scene definitive (09, §6). Il motore è pronto per farla (§7).

## 1. I materiali, e dove stanno le note

| Strato | Che cos’è | Come è fatto |
|---|---|---|
| **Il re** | il reattore, re₂ a 73,42 Hz | lo stesso `Re` del mondo (`re.rs`), una copia della musica: otto armonici, un secondo banco appena scordato che batte, le bande di rumore sotto i primi quattro. Gli armonici alti salgono e scendono («cresce di armonici quando la nave è vicina», 09, §6) |
| **Il campo** | il sol♯₃ (207,65 Hz), le macchine del relitto | otto parziali quasi armonici (un poco allargati, come un metallo che canta), un secondo banco scordato, ogni parziale che respira per conto suo; l’altezza scivola in doppia precisione (una nota bassa e un decimo di hertz non stanno in un `f32`) |
| **Il coro** | le voci tenute del brusio | cinque voci di `voce.rs` (la glottide KLGLOTT88, le formanti di Klatt), ognuna sulla sua vocale (a, ɔ, u, a, ə), che cantano un accordo; cambiare accordo è una dissolvenza |
| **Il sonaglio** | il re₅ del Piccolo (587,33 Hz) | `colpi::sonaglio`: il tintinnio, poi la nota che resta nell’aria più del dovuto |
| **Il tam-tam strofinato** | un canto che nasce dal metallo | nuovo, in `colpi.rs`: i modi del tam-tam, tenuti vivi da un rumore morbido che sale per metà del tempo e poi si alza; cresce, fiorisce, si spegne da solo |
| **Il vetro** | le note del tema | le risonanze del vetro del clic armonioso, suonate con un martelletto di feltro (una rampa di quattro millisecondi invece di un colpo): la nota entra, non scatta |
| **Il battito** | il seme (e il cuore) | il `Battito` del mondo: un colpo sordo a 44 Hz |

**Il linguaggio delle altezze.** Il re (re₂ = 73,42 Hz) è casa. Il sol♯ è «la distanza più grande che ci sia fra due note»: le macchine, i pilastri e il clic armonioso stanno lì (bibbia, §1.3). L’accordo del clic è sol♯, la terza minore settimale (7/6: 484,5 Hz, un si che non è il nostro) e la quinta; la musica lo canta un’ottava sotto (207,7, 242,3, 311,1 Hz), a volte vuoto (sol♯ e quinta). Casa ha i suoi accordi, presi dalla serie degli armonici del re: re, la, re, fa♯ (la terza maggiore naturale, 5° armonico: la luce).

**Il tema.** Quattro note di vetro: sol♯₅, la terza, la quinta (l’arpeggio dell’accordo del clic: 830,6, 969,0, 1244,5 Hz) e poi, un semitono sotto la quinta, il re₆ (1174,7 Hz): la nave risponde alla chiave. Torna alla fine di ogni ciclo del menu, nel nodo «La musica» dell’Anziano, quasi intero nella soglia dell’Atto IV, e nella chiusura di «Vivi». Nella chiusura di «Doppio fondo» manca: resta il sol♯, che non si risolve.

## 2. L’architettura

- **`mondo/musica.rs`** tiene tutto: gli strati, la tabella delle scene dell’Anziano, i brani. La musica ha il suo orologio (in doppia precisione, perché un menu può restare acceso ore) e un programma di azioni in ordine di secondo: `Az::Re`, `Campo`, `Coro`, `Battito`, `Vetro`, `Sonaglio`, `Strofinato`, `Tace`, `Master`. Il programma sta in un vettore a capienza fissa: niente allocazioni nel thread dell’audio.
- **Il comando.** La pagina manda `Comando::Menu(bool)` (il menu principale: il mondo tace, l’interfaccia è tutta membrana, parte la musica del menu) e, per le prove, `Comando::Musica(Brano)`. Il resto lo accende la regia (`regia.rs`, `musica_del_turno`, gli eventi `dialogo`, `nodo`, `dialogo_fine` e `finale`): una soglia d’atto quando l’atto cresce (non al caricamento, non a un atto che torna indietro), l’Anziano nodo per nodo, la chiusura di un finale dopo il silenzio del mondo (14 s dopo il finale; 10 s a «Due lettere», quando il fiato si è fermato).
- **La strada.** `mod.rs` mescola la musica dopo il resto: la sua sala (un riverbero a sedici linee, 8 s nei bassi e 3,5 s negli acuti, la dimensione massima), il 60% dell’asciutto, il suo cursore (`Mix.musica`, il quinto del §9.2 del 06) e il volume generale. **Il volume della musica sta dopo la sala**: un silenzio vero porta con sé anche la coda del riverbero (a «Resto ad ascoltare» la musica tace davvero, per otto secondi). La pausa la abbassa di 10 dB; l’ingresso della partita e il silenzio del mondo (un finale) non la toccano: ha il suo tempo.
- **Il costo.** Il menu e la musica dell’Anziano nell’eseguibile stanno fra il 5 e il 6% di un core in media, con un picco intorno al 12%, senza buchi oltre i 10,3 ms. Un brano finito si spegne del tutto: se tace da sedici secondi, il motore non la calcola più.
- **Il suono dell’interfaccia nel menu.** Il menu ha un mondo sonoro suo (`Relitto.tsx`: parte entrando nel menu, sfuma uscendone; il gioco ne avvia uno nuovo): così ha la sua musica e il tocco dei pulsanti, sempre di membrana (il menu è membrana, 14, §13). I riconoscimenti raggiunti dal menu lo tengono; quelli del primo avvio e la dichiarazione no, perché vengono prima.

## 3. I brani

### 3.1 Il menu

Un ciclo di 190 secondi, ricomposto da sé a otto secondi dalla fine, in modo che non si ripeta uguale. Il re (−8 dB) respira: ogni otto secondi i suoi armonici salgono e scendono. Sopra, quattro episodi, in un ordine che cambia a ogni ciclo, a 44 secondi l’uno dall’altro:

- **l’ombra**: il campo del sol♯ sale dal fondo, si alza di un quarto di tono, se ne va;
- **il clic**: il coro canta l’accordo del clic, una nota di vetro (sol♯₅) lo tocca;
- **il Piccolo**: il sonaglio (il suo re), e nove secondi dopo un tam-tam strofinato;
- **la casa**: il coro canta la quinta vuota del re, poi il suo accordo, poi se ne va.

Il tema chiude il ciclo, lontano (−20 dB).

### 3.2 Le soglie degli atti

Brevi (da 9 a 15 secondi), dentro il cartello d’atto e un poco oltre; la sala della musica le prolunga di qualche secondo:

| Atto | Che cosa si sente |
|---|---|
| **II · L’ingresso** | il re si stringe, il campo del sol♯ sale sotto la Santa Maria e si ritira; una nota di vetro |
| **III · Il corridoio** | il coro canta il clic; le prime due note del tema |
| **IV · Il Ponte** | il tam-tam strofinato, il sonaglio del Piccolo, il coro sul sol♯ vuoto, le prime tre note del tema |
| **V · La fuga** | il re e il sol♯ si scontrano (battimenti di 3,5 Hz), il battito accelera, un tam-tam; poi, di colpo, niente: prende il posto il mondo, che crolla |

L’Atto I non ha soglia: comincia e basta.

### 3.3 L’Anziano

La musica segue il colloquio nodo per nodo (`SCENE`: una scena per nodo di `ponte.fav`, le quattordici). Ogni scena fissa il re, il campo del sol♯, il coro e gli eventi che accadono all’entrata, e ci si va in cinque secondi. **Va dal sol♯ al re**: più nodi diversi si ascoltano, più il re sale (fino a 6 dB) e il sol♯ scende (fino a 8). Le scene:

| Nodo | Che cosa suona |
|---|---|
| benvenuto | il sol♯ da solo, e il re sotto |
| **silenzio** | **niente per otto secondi** (bibbia, §4.5), coda del riverbero compresa; poi la scena di «benvenuto» |
| salto | il coro sul clic, una nota di vetro («intrecciammo le note…») |
| memoria | il sol♯ vuoto, il coro sulla quinta |
| altro | l’uomo che c’era prima: un battito lento e lontano (il suo), una nota di vetro |
| aiuto | il battito si ferma; il coro quasi senza voce |
| prezzo | il re e il sol♯ uno contro l’altro, nessuna voce |
| piccolo | il sonaglio, il suo re; il coro sulla quinta di casa |
| sangue | «forse sei tu, quella musica nuova»: il coro canta per la prima volta l’accordo del re |
| tracce | il sol♯ vuoto, la quinta del tema |
| musica | il coro sul re e il tema intero, che atterra sul re₆ |
| congedo | «le ultime armonie si sciolgono»: il campo scivola dal sol♯ al re in dodici secondi, il tam-tam strofinato, il re sale |
| dissolvenza | il seme riceve la luce: il battito, il re₆ ; il resto si spegne |
| ultima voce | il re da solo, e poi la musica se ne va in dieci secondi |

La fine del colloquio, che coincide con l’atto V, cede il posto alla soglia della fuga. Un caricamento nel mezzo del colloquio riaccende la scena del suo nodo; i dialoghi di Yusuf e dell’eco non suonano la musica dell’Anziano.

### 3.4 Le chiusure

Ogni chiusura entra dove il mondo si è fatto silenzio, e dura da 55 a 70 secondi, con la plancia del risveglio che resta sotto (06, §11):

| Finale | La musica |
|---|---|
| **Vivi** | il re di casa; il battito del seme, a 54 al minuto, a tempo con lui; il coro canta il re (re, la, re, fa♯); il tema, che questa volta atterra sul re₆ |
| **La prima nota** | «il re suonato in due, a tempo»: la seconda onda parte scordata di 3,6 Hz e in ventisei secondi si allinea alla prima, fino a diventare una; il re₆, la quinta di casa |
| **La stiva piena** | cento onde sovrapposte: il coro canta il clic in crescendo (venti secondi), il campo del sol♯ si apre; poi tutto si assesta, il tam-tam, il re₆ |
| **Doppio fondo** | il brusio dalla stiva e un battito sotto; tre note di vetro, tutte sul sol♯₅, e nessun re: non si risolve |
| **Mani vuote** | nessuna musica: il reattore, e basta |
| **Due lettere** | il re da solo: i suoi armonici se ne vanno uno dopo l’altro finché resta una nota bassa e nuda, e poi nemmeno quella; sopravvive al silenzio del mondo |

## 4. I livelli

- Ogni strato continuo ha il suo «0 dB» a −20 dBFS di valore efficace (la prova `calibra`); gli eventi (il vetro, il sonaglio, il tam-tam) hanno il picco vicino a 0 dB. I brani sono scritti in decibel sotto questi zeri.
- Da sola, nel rendering: il menu sta a −24,9 LUFS; l’Anziano a −26,3 (è scritto più basso, ma suona tre decibel sopra la scrittura, perché sta sotto un testo da leggere); le chiusure fra −26,4 («Vivi») e −29,1 («Due lettere»), con «Doppio fondo» molto più piano (−39,5); le soglie degli atti, che durano pochi secondi, stanno fra −24 e −34 dBFS di valore efficace in finestre di dieci secondi. Una nota tenuta dentro una sala che dura otto secondi ne raddoppia l’energia: è la sala, non un difetto. Il tetto di tutto resta quello del mondo (−2 dB, il limitatore).
- Le costanti da toccare se all’autore non vanno: `LIV_MUSICA` e `MUSICA_ASCIUTTA` in `mod.rs`, `Brano::livello` e `LIVELLO_ANZIANO` in `musica.rs` (e, per ogni brano, i decibel scritti nel suo programma).

## 5. Le prove

- **Tredici prove in Rust** (`musica.rs`; 35 in tutto con il resto): il campo canta la sua nota; il coro canta l’accordo (e cambia accordo sfumando); il menu si ricompone, resta fra −60 e −18 dB, non scatta e ha il re come radice; ogni brano finisce, non rompe niente e finisce in silenzio vero; la seconda onda della «Prima nota» si allinea senza cancellarsi; l’Anziano segue i nodi, tace otto secondi, va dal sol♯ al re e si spegne; il tema e le scene stanno dove devono; e, attraverso il mondo vero, la soglia di un atto suona da sola (e non a un caricamento), i finali hanno la loro musica tranne «Mani vuote», quella di «Due lettere» sopravvive al silenzio del mondo, il menu segue il cursore e se ne va, la pausa la abbassa, e il colloquio con l’Anziano la accende (e quello con Yusuf no).
- **Nell’eseguibile**: la prova del suono ha due scene nuove (il menu, l’Anziano), senza buchi né errori; i sei finali cliccati nell’interfaccia passano con il menu che suona (muto) sotto.
- **Le quattordici partite** passano la prova del suono con la musica dentro (nessun picco sopra −1 dB).
- La taratura (`calibra`, ignorata di solito) e lo spettrogramma dei rendering hanno guidato il lavoro: ogni nota è dove deve stare (re, sol♯, clic) e i brani si vedono entrare e uscire.

## 6. Gli ascolti

In `progettazione/ascolti/`, con le note accanto (a che secondo accade ogni cosa):

- `14-musica-menu.mp3`: il menu, quattro minuti e mezzo (due cicli);
- `14-musica-atti.mp3`: le soglie dell’Atto II e III, e poi l’Atto IV, l’Anziano nodo per nodo e la soglia della fuga, dentro la partita vera;
- `14-musica-chiusure.mp3`: le sei chiusure, sei turni prima del finale e poi tutta la musica, con la plancia sotto.

Si rendono con `cargo run --release --example rendi_musica -- <cartella> [nome]` (i brani da soli; con `SOLO_MUSICA=1` il mondo resta muto) e con `rendi_partita … --da N --a M --coda S` (un pezzo di partita con la musica, e il tempo della coda).

## 7. Che cosa manca, e che cosa decide l’autore

- **La musica dell’intro** (06, §18 punto 2; 09, §6): il re che entra nel vuoto a 0:49,4, che si assottiglia mentre la camera arretra, che si chiude sul titolo. Si compone sul montaggio bloccato (le scene definitive, fase 6), con l’orologio che passa dalla pagina alla musica (06, §9.1). Il motore ha già tutto quello che serve; mancano la pagina che chiede la posizione del brano a ogni fotogramma e le scene su cui scriverla.
- **Le scene di chiusura** (06, §11: il testo, la scena, la riga del registro, i titoli di coda): la musica è scritta e parte, ma le scene non ci sono ancora; quando ci saranno, si regola il tempo.
- **L’orecchio dell’autore.** Le misure dicono che le note sono quelle giuste e che i livelli stanno; non dicono se è bella. È tutta in codice, e tutto si può cambiare: i livelli, i tempi, le voci del coro, le scene dell’Anziano. Un compositore resta possibile, e questa musica gli farebbe da traccia guida (06, §18).
- **I tasti.** Le lettere dei comandi (e S e N) non fanno clic, e per ora non fanno il tocco; vale anche per le soglie degli atti: il suono di un cartello non si può saltare.
