# Il Relitto Silente — mappa dell'espansione

**Strato 1: struttura, mappa, meccaniche, finali.** Versione 0.5, 14 ottobre 2026.

Dalla 0.4: la revisione (`04-revisione.md`) ha precisato D6 (la protezione vitale abbassa anche il
faro) e il cavo di L.V. (T3: fra le teche c'è il suo cavo guida). Il resto del documento è il
progetto com'era.

Dalla 0.3: il remake è completo. Gli strati 3, 4 e 5 sono descritti in `03-strati-3-5.md`, che
riporta anche i valori d'aria tarati (diversi dalle stime del §5.1) e la divisione finale dei
moduli (che aggiunge `corridoio.fav` e tiene `traduci.fav` ed `echi.fav` come moduli trasversali).

Dalla 0.2: prese anche le decisioni D4 e D6–D10 (§15); §14.1 aggiornato alla divisione in moduli
per atto adottata nello strato 2. Lo strato 2 (Atti I e II) è fatto: vedi
`02-strato-2-atti-I-II.md`.

Dalla 0.1: decise la voce narrante (D1), L.V. come nel libro (D2), la stiva vuota (D3), l'Anziano
che spera (D5). L.V. passa dall'Arca biologica alla Serra morente. I finali si chiudono con una riga
del registro di bordo. Il gioco si apre con un frammento della scatola nera di L.V.

Fonti: il gioco in `relitto-silente/` (FAVELLA 1, motore 1.4.4) e «Il Relitto», racconto primo
di *Dal registro della Santa Maria* (master di impaginazione del 23 agosto 2026).

Notazione (quella della progettazione Hyper Fable): `→` transizione, `⇒` transizione condizionale,
`✗` passaggio chiuso o morte, `★` finale, `[!]` punto di non ritorno, `[loop]` rivisitabile.
Gli ID di stato sono in `MAIUSCOLO_CON_TRATTINO_BASSO`.

---

## 0. In sintesi

| | Originale | Espansione | Variazione |
|---|---|---|---|
| Stanze | 15 | 23 | +53% |
| Oggetti (cose e personaggi) | 50 | ~83 | +66% |
| Enigmi | 12 | 23 | +92% |
| Finali | 1 | 5, più una variante segreta | |
| Nodi di dialogo | 7 (un personaggio) | 21 (tre personaggi) | +200% |
| Voci del Sintonizzatore | 11 di superficie + 4 profonde | 14 + 7 | +40% |
| Testo per chi gioca | ~7.300 parole | 12.000–14.000 parole (stima) | +65–90% |
| Percorso minimo vincente | 54 comandi | ~100 comandi (stima) | |
| Contatori tracciati e mai letti | 2 (`echi`, `risonanze`) | 0 | |

Le tre idee che reggono l'espansione:

1. **L'aria è la lingua del gioco.** Il racconto lo dice in ogni pagina: ascoltare costa fiato.
   Nel gioco ogni voce ascoltata e ogni testo tradotto consumano la riserva della tuta. Nessuno
   ascolta tutto e porta via tutto: l'aria basta per una delle due cose.
2. **La nave si attraversa due volte.** All'andata si sale per la strada dei costruttori (le tre
   chiavi, la Grande Porta). Al ritorno si scende per quella di L.V. (le gole, le teche, i
   filamenti), con l'aria che cala e la nave che si disgrega.
3. **La scelta finale si fa con le mani, non nel dialogo.** L'Anziano non decide niente per chi
   gioca. Dopo il congedo restano un seme scuro su un sostegno e, due gallerie più su, una
   macchina che vale il viaggio e altri tre. Si esce con quello che si riesce a portare.

---

## 1. Dal racconto al gioco

### Cosa prendo

| Nel racconto | Nel gioco | Dove |
|---|---|---|
| William T. Eriksonn, recuperante, stiva vuota da sei settimane, il conto aperto con Yusuf | Il movente. La stiva diventa vuota, la radio porta Yusuf, sulla plancia un quadrante mostra il margine | Atto I |
| La massa che beve il radar e la luce del faro (cap. 1) | La scansione lunga e il faro di prua: gesti di apertura, con la luce che entra e non torna | Atto I |
| Arpioni, tuta, cavo di sicurezza (cap. 1) | Enigma dell'accostamento. Il cavo torna come indizio: quello di L.V. è stato tranciato | Atti I e III |
| L'arnese nella nicchia che parla ancora e vale una stiva piena (cap. 1) | Il **risuonatore** (nome nuovo, vedi §5.3), la tentazione che resta in vista per tutta la partita | Atti II e V |
| La tuta che traduce e intanto beve dalla stessa batteria dell'aria (capp. 1–2) | La meccanica dell'aria: ascoltare e tradurre costano | Ovunque |
| La riga sul visore: la connessione la tiene l'altro capo (cap. 2) | Evento scritto nella Gola di mezzo: il Sintonizzatore non si spegne | Atto II |
| La voce che dice nomi che il traduttore non sa rendere (cap. 2) | Eco involontaria nella Gola di mezzo; il profondo dell'Ingegnere (che c'è già) svela chi parlava | Atti II e III |
| Le teche forzate da dentro, i filamenti che cercano calore e luce (cap. 2) | La Sala delle teche: enigma del faro con tre soluzioni; ci si ripassa nella fuga | Atti III e V |
| La voce giovane che chiede perché la nave non si muove (cap. 2) | Il Nido e l'eco del Piccolo, a cui si può rispondere | Atto III |
| La voce che non fa parole ma graffia, e si ferma sempre nello stesso punto (cap. 2) | Profondo dello Scriba sulla lastra incisa (il glifo incompiuto è già nel gioco) | Atto III |
| L'uomo seduto contro la colonna, la punta del carotatore, la placca graffiata, la frase spezzata, le due lettere (cap. 3) | L.V. come nel racconto, nella Serra morente: seduto contro la base di una colonna spenta, a mezzo metro dalla teca con il seme vivo che non è riuscito ad aprire | Atto III |
| William che graffia le sue due lettere accanto a quelle del morto (cap. 3) | `incidi la placca`: firmare accanto a lui o completare la sua parola | Atto III |
| La scatola nera della tuta, spenta da un secolo e mezzo; il diario del Prologo | Il gioco si apre con un frammento di quella voce, senza dire di chi è. Nella Serra la scatola nera si accende collegandola alla propria tuta: la voce di L.V. costa aria | Prologo, Atto III |
| La carta di rotta: tre soli morti e una linea fino al nostro sole (cap. 4) | Resta sul Ponte; i disegni del Nido ne sono l'eco | Atti III e IV |
| Il seme scuro che non pulsa (cap. 4) | Il seme torna scuro dalla Grande Porta e dall'Anziano | Atto IV |
| L'ultima voce, a buchi, con poche parole intere (cap. 4) | Sul sostegno, dopo il congedo. Resta a buchi anche con la traduzione al 100% | Atto IV |
| La fuga, la caviglia afferrata, il pensiero che rallenta per mancanza d'ossigeno (cap. 4) | L'Atto V; sotto il 15% d'aria le descrizioni si accorciano e si spezzano | Atto V |
| Il risveglio in poltrona, la massa sparita, il seme che dà un battito di luce (cap. 4) | Il finale «Vivi» | Finali |
| Il reattore che riprende il suo lamento in re (cap. 4) | La sala macchine; la stessa nota torna nel Nido; la variante «La prima nota» | Atti I e III, finali |
| Il seme mai dichiarato, poi la teca sulla mensola (Undici Chili, Coda) | «Vivi» e «Doppio fondo» chiudono con lo stesso gancio | Finali |

### Cosa resta del gioco (le differenze volute)

I K'tharr, l'Anziano, le tre chiavi e la Grande Porta, la matrice di traduzione, il Sintonizzatore
con i suoi echi, il Ponte con le punte, il Santuario centrale. Il racconto non ha un Anziano: nel
gioco resta, ed è il posto dove le voci smettono di essere registrazioni e diventano una
conversazione.

Nel racconto la sala tonda contiene insieme il morto, la mappa e il seme. Il gioco li divide in tre
luoghi: L.V. accanto al seme vivo nella Serra, la mappa sul Ponte, il seme scuro nel Santuario. Chi
gioca rimette insieme da sé, un pezzo alla volta, quello che William vede in un colpo solo. L'ordine
resta quello del racconto: prima l'uomo, poi la mappa, poi il seme, poi la fuga.

### Cosa lascio

- La rinuncia di William alla macchina che parla: nel racconto la decide lui, nel gioco tocca a chi
  gioca.
- Il limite dell'«ora» data a sé stesso: nel gioco il tempo è l'aria, non l'orologio.

---

## 2. Visione

**Premessa.** Intorno al 2201. Sei William T. Eriksonn, unico abitante della Santa Maria, cargo
TSC-1972. Recuperi quello che gli altri lasciano indietro. La stiva è vuota da sei settimane e Yusuf
non ti fa più credito. Sulla rotta c'è una massa che beve il radar. Ci sali per tagliarne un pezzo
da vendere. Dentro trovi una nave cresciuta invece che costruita, che parla ancora, e un uomo
arrivato prima di te.

**Tema.** Contare e ascoltare. Il gioco misura tutto: aria, percentuali di traduzione, crediti,
turni. Chiede a chi gioca quando smettere di contare. Sotto c'è la solitudine scelta, e il segno che
si lascia per qualcuno che forse non passerà mai.

**Conflitto.** Fuori: l'aria, la nave che si disgrega, i filamenti. Dentro: la stiva da riempire
contro una memoria che non vale niente per nessun compratore.

**Obiettivo dichiarato** (da Yusuf): riempire la stiva. **Obiettivo che emerge**: arrivare al
cuore, e decidere cosa portare via.

**Tono.** Fantascienza riflessiva. Brutalismo d'acciaio sulla Santa Maria, materia organica e luce
fredda sul relitto. Nessun combattimento. Il pericolo viene dal freddo, dal buio e dal proprio
fiato.

**Voce** (deciso, D1). Seconda persona, presente, come ora e come i messaggi fissi del motore.
Regola: **la voce narrante non dice mai «William»**. Il nome arriva solo da fuori: da Yusuf alla radio,
dal registro di bordo nella Cuccetta, e dalla riga di registro che chiude ogni finale (§7.3). Chi
gioca è William senza che glielo si ripeta.

**Prologo.** Prima della plancia, un frammento della scatola nera di L.V.: una voce che non sa se il
registratore funziona, che conta il fiato, che non dice di chi è. Il libro si apre allo stesso modo.
Chi lo riascolta nella Serra (N7) riconosce la voce. Va scritto nuovo, sull'idea del Prologo del
racconto, non copiato.

**Durata.** 23 stanze, percorso minimo intorno ai 100 comandi, partita tipica di due o tre ore.
Cinque finali, tutti raggiungibili e collaudati con un percorso scritto.

---

## 3. Struttura in cinque atti

```
ATTO I ──fuori──▶ ATTO II ──soglia──▶ ATTO III (rete) ──portale──▶ ATTO IV ──oltre [!]──▶ dialogo
   Santa Maria       ingresso           quattro ali                  mappa e cuore              │
                                                                                               ▼
                                                    ★ finali ◀── stiva ◀── ATTO V: la fuga
```

| Atto | Titolo | Stanze | Cosa succede, cosa insegna | Collo di bottiglia |
|---|---|---|---|---|
| I | Il margine | Plancia, Cuccetta, Sala macchine, Stiva | Il movente (Yusuf, il quadrante), la scansione, l'accostamento. Si prendono la tuta, il faro del casco, la cella d'aria, il bengala. Il reattore canta un re. | Tuta indossata + arpioni agganciati → `fuori` |
| II | Il brusio | Scafo, Camera di compensazione, Vestibolo delle gole, Gola di mezzo | Il taglio, l'ingresso, il varco che si richiude. Primo contatto con il brusio: la cifra scende. Il risuonatore nella nicchia. La connessione che non si spegne. | Nessuno: dal Vestibolo si apre il resto |
| III | Le voci | Corridoio (hub) e quattro ali: Memoria (nord), Vita (sud e gole), Tecnica (basso), Equipaggio (laterale) | Esplorazione a rete, ordine libero. Le tre chiavi, l'energia, L.V. (lo specchio), le voci profonde, i segni. | Tre chiavi + energia → `portale` |
| IV | La mappa | Ponte, Anticamera, Santuario centrale | La mappa stellare, la porta circolare, l'Anziano. | `oltre` è il punto di non ritorno [!] |
| V | La fuga | Gola del ritorno, Sala delle teche, Gola di mezzo, Vestibolo, Camera, Scafo, Stiva | La nave si disgrega. L'aria cala a ogni turno. Il seme, il risuonatore, i filamenti svegli. | Arrivare in stiva con l'aria sopra lo zero |

### Le ali dell'Atto III

| Ala | Stanze | Contiene |
|---|---|---|
| Memoria (nord) | Santuario del silenzio, Scriptorium, Arca della memoria | Stele, Nucleo, lo Scriba, il Custode |
| Vita (sud e gole) | Serra morente, Arca biologica, Sala delle teche, Vivaio | Seme vivente e L.V. (Serra), dispositivo e cristallo (Arca biologica), i filamenti, la tavoletta (Vivaio) |
| Tecnica (basso) | Laboratorio di risonanza | Energia, Sintonizzatore, l'Ingegnere, la ricarica della tuta |
| Equipaggio (laterale) | Alloggio, Nido | Navarca, cilindro, il Piccolo |

La Sala delle teche e il Vivaio si raggiungono dal Vestibolo, scendendo per la Gola di mezzo: è la
strada di L.V., una diramazione separata dal corridoio. Chi la prende per prima incontra i filamenti
prima di sapere cosa sono, come succede nel racconto.

---

## 4. Mappa delle stanze

### 4.1 Santa Maria e ingresso

Come si leggono i collegamenti: in `A ──x / y── B` da A si va a B con *x* e si torna con *y*; nei tratti verticali la prima direzione è quella di chi sta sopra. `║` è un passaggio che esiste solo nella fuga.

```
 SANTA MARIA ──────────────────────────────────────────────────────────────────────

                                                                  [Cuccetta]
                                                                      │ sud / nord
            [Sala macchine] ──su / giù── [Stiva] ──est / ovest── [Plancia] ★inizio
                                             │
                                             │ fuori / rientro
                                             │ (tuta indossata + nave agganciata)
 RELITTO ────────────────────────────────────┼─────────────────────────────────────
                                          [Scafo]
                                             │ varco / risigillo
                                             │ (giuntura tagliata; ✗ risigillo fino alla fuga)
                                 [Camera di compensazione]
                                             │ soglia / sigillo
                                             │ (pannello + porta interna; ✗ sigillo fino alla fuga)
 [Corridoio principale] ──est / ovest── [Vestibolo delle gole]
   (hub, vedi 4.2)        ✗ nella fuga       │ giù / su
                                      [Gola di mezzo]
                                             │ giù / su
             [Vivaio] ──est / ovest── [Sala delle teche]
                     (attraversamento)       ║ est / ovest
                                             ║ (nodo di fibre: si apre solo nella fuga)
                                      [Gola del ritorno]
                                             ║ su / giù
                                             ║ (aperta dal congedo; ✗ su nella fuga)
                                     [Santuario centrale]
```

### 4.2 Il corridoio e le ali

```
                  [Arca della memoria]
                          │ sud / nord
                    [Scriptorium] ──est / ovest── [Santuario del silenzio]
                                                            │ sud / nord
[Ponte di comando] ──arretra / portale── [Corridoio principale] ──est / ovest── [Vestibolo]
    │                   (3 chiavi)          │       │       │
    │ avanti                                │ basso │ sud   │ laterale
    │ (porta circolare)                     │       │       │
[Anticamera]                          [Laboratorio] │    [Alloggio] ──nord / sud── [Nido]
    │ oltre [!]                                     │
[Santuario centrale]                                │
                 [Arca biologica] ──est / ovest── [Serra morente]
```

### 4.3 Il percorso della fuga

```
[Santuario centrale] ─giù─▶ [Gola del ritorno] ─ovest─▶ [Sala delle teche] ─su─▶ [Gola di mezzo]
        │                                               (filamenti svegli)
        │ il seme scuro è qui, sul sostegno                                          │ su
        ▼                                                                            ▼
                         ★ ◀── [Stiva] ◀─rientro─ [Scafo] ◀─risigillo─ [Camera] ◀─sigillo─ [Vestibolo]
                                                                                 (il risuonatore)
```

Sette spostamenti, più le azioni nella Sala delle teche e quelle facoltative davanti al
risuonatore. Nella fuga il Vestibolo non collega più a ovest (il corridoio è crollato) e la Gola del
ritorno non risale al Santuario: il percorso è un collo di bottiglia senza deviazioni, a parte quella
che si sceglie davanti alla nicchia.

### 4.4 Stanze nuove

**[LOC_CUCCETTA] Cuccetta** · Atto I
Uscite: sud → Plancia.
Oggetti: la seconda cuccetta (rifatta, mai usata), il registro di bordo, la chiavetta (dentro il
registro, come segnalibro).
Funzione: dà un corpo alla solitudine. Il registro porta la data della prima registrazione
autonoma della nave, 14 marzo 2105 (Cronologia del libro), e qualche annotazione di William. La
chiavetta apre la cassetta della Sala macchine.

**[LOC_MACCHINE] Sala macchine** · Atto I
Uscite: su → Stiva.
Oggetti: il reattore, la cassetta di ferraglia (contenitore chiuso, contiene il bengala).
Funzione: `ascolta il reattore` restituisce sempre la stessa nota, un re (stato `NOTA`, vedi §5.7).
Il bengala serve nella Sala delle teche, una volta sola.

**[LOC_VESTIBOLO] Vestibolo delle gole** · Atti II e V
Uscite: ovest → Corridoio principale (✗ nella fuga), giù → Gola di mezzo, sigillo → Camera (✗ fino
alla fuga).
Oggetti: il risuonatore (incastrato), la nicchia, le gole.
Descrizione: la prima sala del relitto, bassa, da cui si aprono tre o quattro gole. Qui il
multiscanner si impenna e nella cuffia entra il brusio. Alla prima visita la cifra sul visore scende
di due punti, e smette di scendere quando togli il guanto dalla parete. È la lezione che regge tutto
il gioco.
Stato dinamico: dopo L.V. (`SPECCHIO = visto`) la descrizione del risuonatore cambia: vale ancora
quello che valeva, e chi gioca lo sa.

**[LOC_GOLA_MEZZO] Gola di mezzo** · Atti II e V
Uscite: su → Vestibolo, giù → Sala delle teche.
Oggetti: le venature (si accendono di un verde stanco al passaggio del guanto).
Evento: la prima volta che ci entri con il Sintonizzatore, parte la voce che dice i nomi e il
Sintonizzatore non si spegne (vedi §5.6). Il costo d'aria è fisso e messo in conto.
Buia: no. La luce viene dalle venature. Vedi la nota tecnica in §5.2.

**[LOC_TECHE] Sala delle teche** · Atti III e V
Uscite: su → Gola di mezzo, ovest → Vivaio (solo ad attraversamento riuscito), est → Gola del
ritorno (solo nella fuga).
Oggetti: le teche aperte, le teche chiuse (lungo le pareti, coperte di brina), i filamenti, il cavo
spezzato (traccia di L.V.), il nodo di fibre (a est).
Descrizione: file di teche alte il doppio di te, alcune forzate da dentro. Filamenti pallidi spessi
come funi corrono sul pavimento e salgono nel buio. Dove si posa il cono del faro, si muovono verso
di te.
Stato dinamico: `FILAMENTI` = quieti / esca / desti; `ENERGIA = ripristinata` (il campo regge a
tratti); fuga.
Funzione: il primo pericolo vero. È anche il posto in cui L.V. ha perso la strada: il suo cavo
tranciato è qui.

**[LOC_VIVAIO] Vivaio** · Atto III
Uscite: est → Sala delle teche.
Oggetti: il germinatoio (ancora tiepido, l'ultima cosa verde della nave), la tavoletta (spostata qui
dalla Serra), le tabelle di semina (si traducono).
Funzione: dove la semina era ancora sotto controllo. La tavoletta che apre la teca della Serra sta
qui: il primo enigma dell'originale, che oggi si risolve senza uscire dalla stanza, diventa una
spedizione.

**[LOC_NIDO] Nido** · Atto III
Uscite: sud → Alloggio dell'equipaggio.
Oggetti: la culla, i disegni sulle pareti, il sonaglio, l'eco del Piccolo (personaggio, compare
quando sintonizzi la culla).
Descrizione: una cella a misura di qualcuno più piccolo. Sulle pareti lo stesso disegno, cento
volte: un sole solo, giallo, piccolo. Il Piccolo è nato in viaggio e non ha mai visto i tre soli: ha
disegnato quello verso cui andavano. Se hai già visto la mappa sul Ponte, la descrizione aggiunge una
riga sola: è il tuo.
Funzione: la rivelazione più semplice del gioco, mostrata e mai spiegata. Il sonaglio suona un re.

**[LOC_GOLA_RITORNO] Gola del ritorno** · Atto V
Uscite: ovest → Sala delle teche, su → Santuario centrale (✗ nella fuga, crollata).
Oggetti: le venature del ritorno.
Stato dinamico: accese se hai ascoltato il profondo del Navarca, che disse di aver tenuto le luci
accese perché qualcuno trovasse la strada. Senza quell'eco è buia e serve il faro.
Funzione: il primo tratto della fuga. Il premio dell'ascolto si vede qui.

### 4.5 Stanze modificate

| Stanza | Cosa cambia |
|---|---|
| Plancia | Radio con Yusuf, comandi di manovra, lanciarpioni, faro di prua, quadrante del margine. Nuova uscita a nord. Il seme del finale «Vivi» finisce sul ripiano. |
| Stiva | Vuota da sei settimane. Le casse di minerale per Europa diventano i ganci vuoti. Restano la tuta, il kit, il lettore con *Castello di Ghiaccio*. Arrivano la cella d'aria e il faro del casco. Nuova uscita in giù. È il traguardo della fuga. |
| Scafo | `analizza la giuntura` rivela un taglio vecchio, risaldato dalla nave: qualcuno è entrato di qui (traccia T1). Nella fuga il varco si riapre. |
| Camera di compensazione | La soglia porta al Vestibolo e non più al corridoio. Nella fuga la porta fusa nella parete si riapre. |
| Corridoio principale | La parete est non è più cieca: dà sul Vestibolo. Le tre tacche diventano di L.V. (T2). |
| Santuario del silenzio | L'altare chiede il disco orientato (enigma N5). |
| Arca della memoria | Il terminale si apre in due modi (N6). Il pilastro può restare acceso o spegnersi. |
| Serra morente | La tavoletta non è più qui. Arriva L.V., come nel racconto: seduto, la schiena contro la base di una delle colonne spente che reggono la cupola, le gambe aperte, il casco calato sul petto; la tuta di un secolo e mezzo, di un modello fuori produzione; la punta del carotatore stretta nella destra, le dita chiuse dal freddo. A mezzo metro, la teca con il seme vivo. L'aria secca della serra non l'ha corrotto: l'ha asciugato. Nuovi la scatola nera, la placca e la punta. |
| Arca biologica | Senza L.V. Restano le capsule, il dispositivo medico e il cristallo. L'incisione sulle capsule va riscritta: non è più accanto all'astronauta ma accanto ai K'tharr morti nel sonno. |
| Laboratorio | Dopo l'energia il generatore ricarica la tuta, una volta. |
| Alloggio | Nuova uscita a nord, verso il Nido. |
| Santuario centrale | Il sostegno al centro. Dopo il congedo si apre l'uscita in giù. |

---

## 5. Meccaniche nuove

### 5.1 L'aria (il margine)

`ARIA` è un contatore da 0 a 100 e parte da 100. Si legge con `esamina il visore` o `esamina la
tuta` («La cifra sul visore: [aria]»), e a ogni soglia la annuncia un demone.

**Cosa la consuma** (valori indicativi, da tarare con i percorsi di collaudo, §14):

| Azione | Costo |
|---|---|
| Primo contatto nel Vestibolo (scritto, una volta) | −2 |
| La connessione che non si spegne nella Gola di mezzo (scritto, una volta) | −3 |
| `sintonizza`: eco di superficie | −4 |
| `sintonizza` o dialogo: eco profonda | −6 |
| Scatola nera di L.V. (oltre al costo dell'eco profonda) | −4 |
| `traduci` | −1 |
| Allungare la mano sul risuonatore ancora incastrato | −2 |
| Staccare il risuonatore: tre turni | −1 a turno |
| Portare il risuonatore | −1 a turno (−2 nella fuga) |
| Sala delle teche con il faro pieno | −4 a turno; essere afferrati: −8 |
| Fuga | −3 a turno |

**Cosa la restituisce:** la cella d'aria della Santa Maria (+25, una volta, in qualsiasi momento) e
la ricarica al generatore dopo l'energia (+25, una volta). Tetto: 100.

**Cosa non la consuma:** muoversi, esaminare, `analizza` (lo scanner lavora per conto suo), la vita a
bordo della Santa Maria.

**Le soglie:**

| Soglia | Effetto |
|---|---|
| 60 | La cifra passa all'ambra. |
| 30 | Rosso. **Protezione vitale**: fino al congedo la tuta stacca i canali secondari e non lascia più ascoltare né tradurre. Si torna ad ascoltare solo dopo una ricarica. |
| 15 | Il pensiero rallenta. Le descrizioni della fuga passano alla variante breve, spezzata: frasi di tre parole. Il ritmo della prosa segue il fiato. |
| 0 | Finale «Due lettere». |

**Invarianti di bilanciamento** (vanno verificati con i percorsi di collaudo, non a occhio):

- I1. Il percorso critico del finale «Vivi», senza ascolti facoltativi, consuma al massimo il 35%
  dell'aria disponibile.
- I2. Chi ascolta tutto (21 voci e tutte le traduzioni) arriva al congedo con l'aria per tornare
  dritto, ma solo se ha usato tutte e due le ricariche.
- I3. Chi ascolta tutto non ha aria per staccare e portare via il risuonatore.
- I4. Prima del congedo non si muore ascoltando (protezione vitale al 30%).
- I5. Ogni soglia è annunciata. Prima di `avanti` dal Ponte, se l'aria è sotto 30, la tuta avverte
  che una risalita potrebbe non bastare. È l'ultimo punto in cui si può ancora tornare al generatore.

Con i valori della tabella tutti gli ascolti (compresi i due scritti) valgono circa 110 punti e la
fuga diretta circa 27 (nove turni). Il risuonatore nella fuga aggiunge circa 18: tre turni per
staccarlo e il suo peso fino alla Stiva. Su 150 disponibili (100 + 25 + 25): 110 + 27 = 137 ci sta
(I2), 137 + 18 = 155 non ci sta (I3).

### 5.2 Il faro e il calore

Il faro del casco si accende quando indossi la tuta e ha due posizioni, **pieno** e **basso**
(`abbassa il faro` / `alza il faro`; anche `spegni il faro` lo porta al minimo). Il racconto fa
proprio questo: William lo stringe fin quasi a chiuderlo nel guanto.

Nella Sala delle teche:
- faro pieno: al primo turno i filamenti si protendono (avviso), dal secondo ti afferrano (−8 aria,
  vieni respinto nella Gola di mezzo);
- faro basso: non ti trovano, ma da qui il Vivaio non si vede. Passa solo chi si tiene lungo le
  pareti, dove le teche sono ancora chiuse e il freddo tiene fermi i filamenti (`segui la parete`,
  `tocca le teche chiuse`, `costeggia`: tre verbi, un solo effetto).

**Nota tecnica.** Nel motore una stanza buia (`è buia`) impedisce di esaminare, prendere e lasciare.
Per questo la Sala delle teche non è dichiarata buia: il pericolo dipende dallo stato del faro, non
dalla luce del motore. Il buio vero resta all'Anticamera e alla Gola del ritorno, dove ci si muove e
basta.

### 5.3 Il risuonatore

Nel racconto la macchina della nicchia si chiama «matrice». Nel gioco «matrice» è già la matrice di
traduzione, quindi l'oggetto prende il nome di **risuonatore** (alias: arnese, matrice, nicchia
parlante). È la sorgente del brusio: tutte le voci della nave, una sopra l'altra.

- Incastrato nella nicchia del Vestibolo. `prendi il risuonatore` costa aria e non riesce: la mano
  si ferma a un palmo, come nel racconto.
- `stacca il risuonatore` con la taglierina: tre turni, ognuno con un pezzo di voce.
- Finché lo porti consuma aria (−1 a turno, −2 nella fuga) e copre gli echi: con il coro intero in
  mano il Sintonizzatore non distingue una voce sola. Si può lasciare dove si vuole. Se lo lasci
  lontano dal percorso della fuga, è perso.
- Vale una stiva piena. È l'unico oggetto del relitto che Yusuf saprebbe vendere.

Chi lo stacca subito impara in pochi turni cosa costa, e lo posa. Chi lo prende alla fine lo fa con
l'aria in rosso: la stessa scelta del racconto, decisa questa volta da chi gioca.

### 5.4 Le tracce di L.V.

`TRACCE` è un contatore da 0 a 5. Racconta la strada di chi è venuto prima.

| ID | Dove | Cosa | Come |
|---|---|---|---|
| T1 | Scafo | Un taglio vecchio, risaldato dalla nave | `analizza la giuntura` |
| T2 | Corridoio | Le tre tacche: punta da carotatore, standard terrestre | `analizza le tacche` |
| T3 | Sala delle teche | Un cavo guida terrestre tranciato, il capo avvolto di fibre (il cavo di sicurezza gliel'ha tagliato la nave all'ingresso, come a te: lo porta ancora alla cintura) | `esamina il cavo` |
| T4 | Serra morente | L'uomo, la placca, le due lettere | `esamina il cadavere` |
| T5 | Serra morente | La sua voce | la scatola nera, collegata alla tuta |

Le leggono l'Anziano (nodo «l'altro» da 3 in su) e le varianti dei finali.

**La strada di L.V.**, ricostruibile dalle tracce: entra dalla giuntura (T1), passa per il Vestibolo
e il corridoio, dove segna tre tacche (T2). Nella Serra trova la teca con il seme vivo, ma senza la
tavoletta non la apre. Cerca la chiave, scende per la Gola di mezzo e nella Sala delle teche i
filamenti gli prendono il cavo (T3). Il Vivaio, dove la tavoletta c'era, non lo raggiunge. Torna alla
Serra con l'aria che gli manca, si siede contro una colonna a mezzo metro dalla teca, incide la placca
e muore. Chi gioca rifà la sua strada e arriva dove lui non è arrivato.

### 5.5 Le voci profonde e il canto

`RISONANZE` passa da 4 a 7 voci profonde. Ognuna, oltre al testo, dà qualcosa: un'informazione o un
vantaggio nella fuga. Così l'ascolto costa aria ma non è un lusso.

| ID | Voce | Àncora | Si sblocca | Cosa dà |
|---|---|---|---|---|
| R1 | Xeno-botanico | le piante (Serra) | seme liberato (c'è già) | Spiega che i filamenti cercano un sole: indizio per il bengala |
| R2 | Navarca | le alcove (Alloggio) | hai il cilindro (c'è già) | Nella fuga la Gola del ritorno e la Sala delle teche hanno luce fredda: niente faro, niente filamenti |
| R3 | Custode | il bassorilievo | traduzione 100 (c'è già) | Una battuta in più dell'Anziano |
| R4 | Ingegnere: i nomi | il generatore | traduzione ≥ 75 (c'è già) | Svela chi era la voce della Gola di mezzo. Parla del campo da tenere fermo: indizio per la soluzione con l'energia |
| R5 | Il Piccolo | la culla (Nido) | eco di superficie della culla | Il dialogo con l'eco (§9.3) |
| R6 | Lo Scriba: il raschio | la lastra incisa | hai visto la placca di L.V. | Due firme ferme nello stesso punto: apre la scelta «completa la parola» sulla placca |
| R7 | L.V. | la scatola nera | collegata alla tuta | Racconta dove ha perso il cavo: indizio per la fuga |

Le leggono l'Anziano (nodo «la musica» da 4 in su) e la variante segreta «La prima nota» (6 o più).

### 5.6 La connessione che non si spegne

Una volta sola, nella Gola di mezzo, con il Sintonizzatore in mano: parte una voce bassa che dice
nomi, e il traduttore scrive per ognuno la stessa etichetta, nome proprio non traducibile, una riga
dopo l'altra. Il Sintonizzatore non si spegne e sul visore compare la riga che dice che la
connessione la tiene l'altro capo. L'aria scende di 3. È la prova che la nave ascolta, e prepara il
dialogo con l'eco del Piccolo.

### 5.7 La nota

Il reattore della Santa Maria si lamenta da sempre in re. Il sonaglio del Piccolo suona un re. Chi li
ascolta tutti e due legge, la seconda volta, una frase che li accosta (`NOTA = riconosciuta`). Nessuna
spiegazione. Serve alla variante «La prima nota».

### 5.8 Il seme in tre stati

Un oggetto solo, per evitare due «seme» nel parser:

1. **vivente**: nella teca della Serra, pulsa di verde, è la prima chiave;
2. **nella porta**: la Grande Porta lo assorbe;
3. **scuro**: al congedo l'Anziano si raccoglie dentro il seme, che torna sul sostegno del Santuario.
   Non pulsa e non brilla, come nel racconto.

Pulsa di nuovo soltanto sulla Santa Maria, nel finale «Vivi». Lo si è dato alla nave vivo e lo si
riprende scuro: dentro, nel frattempo, ci si sono messi loro.

### 5.9 L'energia è la condizione dell'Anziano

Perché L.V. è morto senza che nessuno gli rispondesse? Perché la nave non aveva più energia per
parlare: ascoltava (le voci restano impresse nella materia) ma non poteva rispondere. Sei tu a
riaccendere il generatore, ed è con quell'energia che l'Anziano ti parla. Quando la spende tutta per
raccogliersi nel seme, la nave comincia a disgregarsi. L'enigma dell'energia diventa così la causa
dell'incontro e della fuga.

---

## 6. La catena degli enigmi

### 6.1 Grafo delle dipendenze

```
ATTO I
  analizza la nave aliena ─▶ accosta ─▶ spara gli arpioni ──┐
  prendi la tuta ─▶ indossa la tuta (faro acceso) ──────────┴─▶ FUORI
  registro di bordo ─▶ chiavetta ─▶ cassetta ─▶ bengala                    (facoltativo)
  cella d'aria · ascolta il reattore                                        (facoltativi)

ATTO II
  kit ─▶ taglierina ─▶ giuntura ─▶ VARCO
  kit ─▶ batteria ─▶ pannello ─▶ porta interna ─▶ SOGLIA
  [taglierina ─▶ stacca il risuonatore]                                     (facoltativo, costa)

ATTO III
  SEME:    Sala delle teche (faro basso + parete │ bengala │ energia) ─▶ Vivaio: tavoletta
           ─▶ Serra: teca ─▶ SEME VIVENTE
  STELE:   Scriptorium: disco ─▶ Santuario: ruota il disco (indizio nel bassorilievo)
           ─▶ altare ─▶ STELE
  NUCLEO:  forza (taglierina sul terminale) │ pazienza (ENERGIA ─▶ il terminale si sveglia)
           ─▶ NUCLEO
  ENERGIA: Arca biologica: dispositivo medico + cristallo ─▶ Laboratorio: generatore ─▶ ENERGIA
  SEME + STELE + NUCLEO ─▶ Grande Porta ─▶ PORTALE

ATTO IV
  ENERGIA ─▶ postazione ─▶ mappa ──────────────────────────────┐
  (analizza la mappa │ analizza la stele) ─▶ SISTEMA NOTO ───────┴─▶ punte ─▶ AVANTI
  ─▶ OLTRE [!] ─▶ Anziano ─▶ congedo

ATTO V
  congedo ─▶ seme scuro sul sostegno (prenderlo o no) ─▶ Gola del ritorno
  ─▶ Sala delle teche, filamenti svegli
     (faro basso + parete │ bengala, se l'hai conservato │ luce del Navarca │ strappo: −aria)
  ─▶ Gola di mezzo ─▶ Vestibolo (risuonatore, se lo vuoi) ─▶ Camera ─▶ Scafo ─▶ Stiva ★
```

Fili facoltativi che attraversano tutto: le tracce di L.V. (T1–T5), le voci profonde (R1–R7), i
segni (quattro posti dove incidere), Yusuf, la nota.

### 6.2 Schede degli enigmi nuovi

**[N1] Accostamento e arpioni** · sequenza · Plancia
Soluzione: `analizza la nave aliena`, poi `accosta` (o `usa i comandi di manovra`), poi `spara gli
arpioni`.
Indizi: il quadrante di prossimità; la stiva: «Senza aggancio, due navi accostate prima o poi si
perdono».
Se sbagli: arpioni prima di accostare → «La massa è troppo lontana: i cavi tornano indietro a
vuoto». `fuori` senza aggancio → «Uscire adesso vuol dire guardare la Santa Maria allontanarsi».
Effetti: `NAVE` = analizzata → accostata → agganciata.

**[N2] La cassetta di ferraglia** · chiave e serratura · Cuccetta, Sala macchine
Soluzione: `leggi il registro` (la chiavetta fa da segnalibro), `prendi la chiavetta`, `apri la
cassetta`, `prendi il bengala`.
Note: enigma da tutorial. Il valore sta nel registro, che dà carattere e una data di canone.

**[N3] Il risuonatore** · sequenza e risorsa · Vestibolo
Soluzione: `stacca il risuonatore` per tre turni, con la taglierina.
Se sbagli: `prendi` senza staccare → la mano si ferma, la cifra scende.
Effetti: `RISUONATORE` = incastrato → staccato; consumo d'aria mentre lo porti.
Note: facoltativo. Decide due finali su cinque.

**[N4] L'attraversamento delle teche** · tre soluzioni · Sala delle teche
Soluzioni:
(a) furtiva: `abbassa il faro`, `segui la parete`, `ovest`;
(b) esca: `accendi il bengala`, `lancia il bengala` (i filamenti vanno al finto sole per tre turni,
poi il bengala si consuma);
(c) di sistema: con l'energia ripristinata il campo regge a tratti e i filamenti stanno fermi.
Indizi: la descrizione (si muovono verso la luce), le teche chiuse coperte di brina, l'eco dello
xeno-botanico (R1), l'Ingegnere (R4).
Se sbagli: faro pieno → avviso, poi presa. `ovest` a faro basso senza parete → «Nel buio perdi
l'orientamento: le mani cercano qualcosa di freddo a cui tenersi».
Note: il bengala è uno solo. Usarlo all'andata vuol dire non averlo nella fuga.

**[N5] L'orientamento del disco** · informazione · Santuario del silenzio
Soluzione: `ruota il disco` finché i tre soli incisi sono disposti come nel bassorilievo (all'alba
del Salto, il più grande in alto), poi `usa il disco sull'altare`.
Se sbagli: «Il disco scende di un dito e si ferma: i solchi non combaciano».
Nota tecnica: contatore `ROTAZIONE` con `riduci … modulo 3`.

**[N6] Il nucleo: forza o pazienza** · soluzione alternativa, ordine · Arca della memoria
Forza (c'è già): taglierina sul terminale. Il nucleo esce, l'ultimo pilastro si spegne.
Pazienza (nuova): con l'energia ripristinata il terminale si accende da solo quando entri, e il
pilastro ti saluta con una riga dell'Archivista prima di aprire lo scomparto.
Indizi: il pilastro «pulsa come se aspettasse»; sul banco del Laboratorio i flussi vanno al Ponte e
all'Archivio.
Effetti: `NUCLEO_VIA` = forza / pazienza (lo legge l'Anziano).

**[N7] La scatola nera** · trasformazione · Serra morente
Soluzione: `collega la scatola nera alla tuta` (o `usa la scatola nera sulla tuta`). La tua tuta fa
da batteria a quella di L.V.
Effetti: R7, T5, aria −10 in tutto.
Testo: adattamento del Prologo «L.V.» del racconto, ridotto a quattro frammenti, con i buchi di una
registrazione rovinata. Va scritto, non copiato.

**[N8] La placca** · scelta · Serra morente
Cosa c'è sulla placca, come nel racconto: in stampatello graffiato con la punta del carotatore, un
«qui prima», «il seme», una frase che si interrompe all'inizio di una parola dopo «non siamo», e sotto
le due lettere, le sole arrivate in fondo. I solchi sono profondi all'inizio e appena accennati alla
fine, quando la mano non teneva più. (Sostituisce il messaggio completo dell'originale, che spiegava
tutto.)
`incidi la placca` chiede cosa: le tue iniziali (`firma la placca`) oppure la fine della sua parola
(`completa la parola`, disponibile dopo R6). C'è spazio per un segno solo.
Effetti: `SEGNO_LV` = firmata / completata. Lo leggono l'Anziano e i finali «Vivi» e «Due lettere».
Note: firmare dice «sono stato qui anch'io»; completare dice «avevi ragione». Sono due cose diverse e
chi gioca deve sceglierne una.

**[N9] La risposta al Piccolo** · informazione · Nido
Soluzione: dopo `sintonizza la culla`, `parla con l'eco`. La risposta vera («Perché siete arrivati»)
compare solo se hai visto la rotta finire sul nostro sole (`PROIEZIONE = attiva`).
Note: la domanda si capisce presto, la risposta si può dare solo tardi. Chi torna nel Nido dopo il
Ponte trova un'opzione in più.

**[N10] La nota** · associazione · Sala macchine e Nido
`ascolta il reattore` + `suona il sonaglio`, in qualsiasi ordine. Segreto, non necessario.

**[N11] La fuga** · tempo e risorse · Atto V
L'aria scende di 3 a ogni turno. Nella Sala delle teche, con i filamenti svegli: faro basso e
parete, bengala se ti è rimasto, luce del Navarca se l'hai ascoltato, oppure liberarsi a forza
(`strappa il filamento`, `taglia il filamento`: −6 e un turno). Davanti alla nicchia del Vestibolo
si decide il risuonatore.

---

## 7. Ramificazioni e finali

### 7.1 Dove il gioco si dirama

- **Ordine**: l'Atto III è una rete. Le quattro ali si visitano come si vuole.
- **Soluzioni alternative**: teche (3), nucleo (2), fuga (4).
- **Scelte morali e di lettura**: il nucleo (forza o pazienza), la placca (firma o parola), il
  Piccolo (tre risposte), il risuonatore, il seme, la promessa a Yusuf. Ce n'è poi una che nessuno
  annuncia: quali voci ascoltare con l'aria che hai.
- **Dialogo**: sette nodi nuovi dell'Anziano si aprono solo in base a ciò che hai fatto.
- **Finali**: cinque, più una variante.

### 7.2 Quale finale

Si decide entrando nella Stiva durante la fuga (o a `ARIA = 0`, ovunque):

| Hai il seme | Hai il risuonatore | Finale |
|---|---|---|
| sì | no | ★ «Vivi» (con 6 o più risonanze e la nota: ★ «La prima nota») |
| no | sì | ★ «La stiva piena» |
| sì | sì | ★ «Doppio fondo» |
| no | no | ★ «Mani vuote» |
| aria a zero | | ✗★ «Due lettere» |

### 7.3 Schede dei finali

Ogni finale si chiude con la riga che William scrive nel registro di bordo. È l'unico punto in cui il
suo nome compare nel testo dei finali, e compare perché lo firma lui: «Registro di bordo, TSC-1972.
Operatore W. T. Eriksonn.», seguito da una riga sola, diversa per ogni finale. Il libro si chiama *Dal
registro della Santa Maria*: le uscite del gioco sono voci di quel registro.

| Finale | Riga di registro (bozza) |
|---|---|
| «Vivi» | Rotta ripresa. Carico: nessuno. (Il seme non si dichiara.) |
| «La prima nota» | Come «Vivi». |
| «La stiva piena» | Carico: un manufatto, origine non dichiarata. Destinazione: Magazzino Quattro. |
| «Doppio fondo» | Carico: un manufatto. Nient'altro da dichiarare. |
| «Mani vuote» | Nessun evento da registrare. |
| «Due lettere» | Nessuna riga: il registro resta sulla Santa Maria. Restano due iniziali incise, il nome intero non arriva. |

```
★ FINE_VIVI — «Vivi»
Richiede: FUGA = in_corso · giocatore nella Stiva · ha SEME · non ha RISUONATORE
Atterraggio: meraviglia, e un peso nuovo. Il risveglio in poltrona. La massa non c'è più e il radar
  ridà vuoto. Nella mano il seme scuro, che dà un battito di luce verde quando c'è qualcuno a
  guardarlo. Il silenzio della plancia, per la prima volta, non basta.
Varianti [se …]: SEGNO_LV (firmata o completata) · risposta al Piccolo · TRACCE ≥ 4 (L.V. ha un posto
  nel testo) · promessa a Yusuf (la chiamata che non fai) · NUCLEO_VIA.
Gancio: una teca per il seme, «alla prima sosta» (Undici Chili).

★ FINE_PRIMA_NOTA — variante di «Vivi»
Richiede: come FINE_VIVI + RISONANZE ≥ 6 + NOTA = riconosciuta
Atterraggio: lo stesso, più una cosa sola. Il reattore riprende il suo lamento in re e il seme
  pulsa a tempo. Il testo lo registra e non lo commenta.

★ FINE_STIVA_PIENA — «La stiva piena»
Richiede: ha RISUONATORE · non ha SEME
Atterraggio: sollievo, poi vuoto. Yusuf richiama: c'è un compratore e non chiede da dove arriva la
  roba. Il margine sul quadrante torna verde. Di notte, in stiva, il risuonatore continua a dire
  nomi a nessuno. Il seme è rimasto nella nave che non c'è più.

★ FINE_DOPPIO_FONDO — «Doppio fondo»
Richiede: ha RISUONATORE · ha SEME
Atterraggio: il compromesso e il segreto. Vendi le voci e nascondi il seme. Per vent'anni nessuno
  lo saprà. È il più vicino a ciò che il William del racconto farà dopo, tenerlo senza dichiararlo,
  con in più le voci vendute.

★ FINE_MANI_VUOTE — «Mani vuote»
Richiede: non ha SEME · non ha RISUONATORE
Atterraggio: il dubbio. La massa è sparita, in mano non hai niente, lo scanner non ha
  registrazioni. Forse un uomo a corto d'aria si è raccontato una storia per non sentire il
  silenzio.
Variante: se il seme è rimasto sul sostegno per scelta (l'ultima voce chiedeva di non prendere, o
  forse no), l'ultima frase lo riconosce.

✗★ FINE_DUE_LETTERE — «Due lettere»
Richiede: ARIA = 0
Atterraggio: la tragedia che continua. Ti siedi contro una parete, come L.V. contro la sua colonna.
  Se hai la taglierina incidi due lettere: il nome intero, a chi lo diresti? Qualcuno, fra
  centocinquant'anni, passerà di qui.
Varianti: nella Sala delle teche (come lui, nel buio delle fibre) · con la placca già firmata
  (adesso, su quella placca, siete in due).
```

Ogni finale atterra in un posto emotivo diverso: meraviglia, sollievo vuoto, segreto, dubbio,
continuità. Nessuno dei cinque è la punizione di un altro.

---

## 8. Personaggi

**William T. Eriksonn** (tu; la voce narrante non lo nomina mai, vedi §2). Recuperante, solo per
scelta e non per rancore. Fa i conti a voce alta,
lascia indietro le riparazioni. Il gioco gli dà un arco possibile, non obbligato: da chi conta i
minuti a chi smette di contarli. Chi prende il risuonatore e torna indietro senza ascoltare niente
non è punito: è un altro William, che il gioco lascia esistere.

**Yusuf** (Magazzino Quattro, alla radio). Il fornitore e creditore di vent'anni. Conta fino a dieci
prima di dire di no, e poi dice sì lo stesso. Ha una vita sua: altri clienti, le richieste tutte
uguali, sua madre che gli ha insegnato a contare. Non sa niente del relitto e non vuole saperlo.
Compare all'inizio e in due finali.

**L.V.** (deciso, D2: come nel libro). Centocinquant'anni prima di William, intorno al 2050, partito
da solo perché voleva andarsene: ha firmato le carte e ha mentito al medico pur di avere l'idoneità a
viaggiare senza equipaggio, e qualcuno gli aveva detto di non partire. La sua nave si è spenta un
pezzo alla volta. Quando è finito addosso alla massa nera stava già morendo, ed è entrato lo stesso.
Ha seguito la strada descritta in §5.4 ed è morto nella Serra, a mezzo metro dal seme vivo che aveva
trovato e non poteva prendere, quando la nave non aveva più energia per rispondergli. Prima ha
graffiato la placca e ha parlato alla scatola nera della tuta, a nessuno, contando le parole come
contava i fiati. Nomina un Matthew, con cui dice di averci provato. Il gioco non spiega chi sia.
Si firma con due lettere perché non è rimasto nessuno a cui dire il nome intero.
Il nome della missione, AURORA-7, viene dall'originale e il racconto non lo contraddice: resta, come
spedizione solitaria di cui non è mai arrivata notizia.

**Il Navarca.** È rimasto sveglio per ultimo, per spegnere le luci. Nell'espansione si scopre, dal
dialogo con l'eco del Piccolo, che è rimasto sveglio anche per lui. Le luci che ha lasciato accese
sono quelle che ti illuminano la fuga.

**Il Piccolo.** L'unico nato durante il viaggio. Non ha mai visto i tre soli e ha disegnato quello
verso cui andavano. La sua voce chiede perché la nave non si muove. È il personaggio più fragile del
gioco: va scritto con misura, una domanda e pochissimo altro.

**L'Ingegnere capo.** C'è già: è rimasto a tenere il campo e ha inciso i nomi sul banco.
L'espansione lo collega alla voce della Gola di mezzo. È lui che li dice, uno per uno.

**L'Anziano.** C'è già. Diventa meno oracolo. Non sa se la semina ha attecchito: lo spera (deciso,
D5). Dove ora dice che chi gioca porta nel sangue i loro tre soli, dirà che vorrebbe crederlo.
Conosce L.V., conosce il prezzo di quello che porti, sa cosa hai risposto al Piccolo. Non ti dice
cosa fare con il seme.

---

## 9. Alberi di dialogo

### 9.1 L'Anziano (da 7 a 12 nodi)

```
[AN_BENVENUTO]  (c'è già)
Battuta in più se hai il risuonatore: «Porti con te le nostre voci.»
Scelte:
  A) «Chi eravate?» → [AN_SALTO]
  B) «Cosa ne è stato di voi?» → [AN_MEMORIA]
  C) «C'era un uomo, prima di me.» ⇒ [AN_ALTRO]       (TRACCE ≥ 3)
  D) «Sono venuto per vendervi.» ⇒ [AN_PREZZO]         (PROMESSA = carico)
  E) «Resto ad ascoltare.» → [AN_SILENZIO]             (prima portava a SALTO come A: scelta falsa)

[AN_SILENZIO]  NUOVO
Testo: l'Anziano tace. Per qualche riga si sente la nave. Poi riprende da dove avresti voluto.
Effetti: ASCOLTO_ANZIANO = vero (cambia una riga del congedo)
Scelte: → [AN_SALTO]

[AN_SALTO]  (c'è già)
Scelte: «E io che c'entro?» → [AN_SANGUE] · «Cosa è rimasto di voi?» → [AN_MEMORIA]
  · «Perché la nave si è fermata?» ⇒ [AN_PICCOLO]      (RISPOSTA ≠ nessuna)

[AN_MEMORIA]  (c'è già)
Battuta variabile su NUCLEO_VIA: con la forza, «avevi fretta, come tutti i vivi»; con la pazienza,
  il pilastro ti ha detto addio e tu c'eri.

[AN_ALTRO]  NUOVO
Testo: lo sentirono camminare per la nave, cercare la chiave della teca e tornare senza. Lo
  ascoltarono fino all'ultimo fiato, a mezzo metro dal seme. Non potevano rispondere: la nave non
  aveva più energia per parlare. «Hai acceso tu la luce in cui ti parlo.»
Scelte: «Avreste potuto aiutarlo?» → [AN_SANGUE] · «Gli ho lasciato un segno.» ⇒ [AN_TRACCE] (SEGNO_LV ≠ vergine)

[AN_PREZZO]  NUOVO
Testo: tutti quelli che arrivano vengono a prendere. Qualcuno resta ad ascoltare. «Tu sei ancora
  qui.»
Scelte: «Mi serve per vivere.» → [AN_SANGUE] · «Non più.» → [AN_SANGUE]
Effetti: ONESTÀ = vero (una riga diversa nei finali con il risuonatore)

[AN_PICCOLO]  NUOVO
Testo variabile su RISPOSTA:
  verità   → «Glielo hai detto tu. Nessuno di noi ne ebbe il coraggio.»
  silenzio → «Hai ascoltato senza rispondere. È quello che facemmo anche noi.»
  non so   → «Neanche noi sapevamo dirlo.»
Scelte: → [AN_SANGUE]

[AN_SANGUE]  (c'è già, riscritto come speranza e non come certezza: deciso, D5)
Scelte: «Ho lasciato dei segni, là dietro.» ⇒ [AN_TRACCE] (c'è già)
  · «E la musica?» ⇒ [AN_MUSICA] (RISONANZE ≥ 4)
  · «Allora cosa devo fare?» → [AN_CONGEDO]

[AN_TRACCE]  (c'è già)
Battuta in più su SEGNO_LV: firmata → «Adesso su quella placca non è più solo.»
  completata → «Hai finito la sua frase. Aveva ragione.»

[AN_MUSICA]  NUOVO
Testo: perché la loro lingua era un canto, e perché la traduzione si ferma dove comincia la musica.
  Comporre, non conservare.
Scelte: → [AN_CONGEDO]

[AN_CONGEDO]  (c'è già)
Scelte: «[Chiudi gli occhi e lascia andare.]» → [AN_DISSOLVENZA] [!]

[AN_DISSOLVENZA]  NUOVO (sostituisce l'epilogo: il risveglio passa ai finali)
Testo: la figura si raccoglie in un punto di luce che scende sul sostegno e si spegne dentro il seme.
  Le linee del pavimento si spengono una per una. La nave trema.
Effetti: chiude il dialogo · FUGA = in_corso · il seme (scuro) è sul sostegno
  · il Santuario centrale collega giù alla Gola del ritorno
Note: il turno dopo parte l'ultima voce (vedi §10, U1).
```

### 9.2 Yusuf (5 nodi)

```
[YU_APERTURA] «Magazzino Quattro.»
Scelte:
  A) «Mi serve credito.» → [YU_CREDITO]
  B) «Ho trovato una cosa.» ⇒ [YU_COSA]                (NAVE ≥ analizzata)
  C) «Niente. Volevo sentire una voce.» → [YU_VOCE]

[YU_CREDITO]  niente credito finché non porti qualcosa. Chiude.
[YU_VOCE]     Yusuf ne deduce che sei messo peggio di quanto pensasse. Chiude. (Scelta di carattere,
              dichiarata come tale.)
[YU_COSA]     «Una nave. Non è nostra.» Yusuf: tagliane un pezzo e portamelo, il compratore lo trova
              lui. Effetti: PROMESSA = carico.
              Scelte: «E se dentro c'è qualcuno?» → [YU_QUALCUNO] · «Va bene.» → chiude
[YU_QUALCUNO] «Allora non è roba mia. E nemmeno tua.» Chiude. (Lo stesso Yusuf che poi, nel finale
              «La stiva piena», non chiede niente.)
```

### 9.3 L'eco del Piccolo (4 nodi)

```
[PI_DOMANDA] la voce giovane chiede perché la nave non si muove, perché nessuno…
Scelte:
  A) «Perché siete arrivati.» ⇒ [PI_ARRIVATI]          (PROIEZIONE = attiva)
  B) «Non lo so.» → [PI_NONSO]
  C) «[Resta in silenzio.]» → [PI_SILENZIO]
Effetti di ognuna: RISPOSTA = verità / non so / silenzio · RISONANZE + 1 · aria −6

[PI_ARRIVATI] la domanda gira ancora una volta, poi per la prima volta non ricomincia. Il testo
              non dice se l'eco ti ha sentito.
[PI_NONSO]    la domanda ricomincia, uguale.
[PI_SILENZIO] ascolti la registrazione fino in fondo. Alla fine c'è la voce del Navarca che risponde
              al Piccolo: dormi, domani te lo dico.
```

Le tre risposte non hanno lo stesso valore e non si equivalgono: la prima chiude una domanda, la
seconda la lascia aperta, la terza rivela che nessuno ha mai risposto.

---

## 10. Le voci

### 10.1 Echi di superficie (da 11 a 14)

| Àncora | Stanza | Voce | Stato |
|---|---|---|---|
| le pareti del corridoio | Corridoio | Plancia, stiva e camera dei K'tharr, in un colpo solo (4 echi) | c'è già |
| le piante | Serra | Xeno-botanico | c'è già |
| le capsule | Arca biologica | Ufficiale medico | c'è già |
| le alcove | Alloggio | Navarca | c'è già |
| la struttura centrale | Ponte | Ufficiale di navigazione | c'è già |
| il globo olografico | Scriptorium | Scriba | c'è già |
| il bassorilievo | Santuario del silenzio | Custode | c'è già |
| il generatore | Laboratorio | Ingegnere capo | c'è già |
| le gole | Vestibolo | Il brusio si separa: qualcuno chiede di tenere il campo, qualcuno risponde che non regge | nuovo |
| le venature | Gola di mezzo | La voce dei nomi (involontaria, §5.6) | nuovo |
| la culla | Nido | La voce giovane | nuovo |

### 10.2 Voci profonde (da 4 a 7)

Vedi la tabella di §5.5.

### 10.3 Le voci senza Sintonizzatore

| ID | Dove | Cosa | Costo |
|---|---|---|---|
| U1 | Santuario centrale, dopo il congedo | L'ultima voce: buchi, e dentro pochissime parole intere (un divieto di prendere, comporre, musica, vivi). Non si completa mai, neanche al 100%: è musica, e la matrice traduce solo parole. | 0 |
| U2 | Gola di mezzo, nella fuga | La voce dei nomi, ancora. Se hai R4 sai di chi è. `ascolta` per fermarti: −6, nessun premio meccanico. | 0 / −6 |

U1 è il centro interpretativo del finale: chi legge «non prendere» può lasciare il seme sul
sostegno, chi legge «vivi» se lo porta via. Il gioco non dice chi ha ragione.

### 10.4 Testi da tradurre nuovi

| Oggetto | Soglie | Contenuto (sintesi) |
|---|---|---|
| le tabelle di semina (Vivaio) | 18 / 75 / 100 | Quote di attecchimento; poi il mondo bersaglio, terzo pianeta, acqua presente, probabilità non calcolabile; infine l'istruzione di seminare comunque |
| il sostegno (Santuario centrale) | 75 / 100 | Una riga sola, per chi raccoglierà |
| i disegni (Nido) | nessuna | Non c'è testo da tradurre. La risposta della matrice lo dice, ed è la battuta |

---

## 11. Specifiche di stato

Per ogni variabile: dove si scrive e dove si legge. Se una variabile non ha lettori, si toglie.

| Variabile | Tipo | Iniziale | Si scrive in | Si legge in |
|---|---|---|---|---|
| `ARIA` | contatore 0–100 | 100 | costi (§5.1), cella, ricarica, fuga | soglie, protezione vitale, descrizioni ipossiche, avviso del Ponte, «Due lettere» |
| `NAVE` | stato: ignota / analizzata / accostata / agganciata | ignota | N1 | `fuori`, opzione di Yusuf |
| `PROMESSA` | stato: nessuna / carico | nessuna | Yusuf | Anziano (AN_PREZZO), finali con il risuonatore |
| `NOTA` | stato: ignota / reattore / sonaglio / riconosciuta | ignota | reattore, sonaglio | «La prima nota» |
| faro del casco | proprietà: pieno / basso | pieno | abbassa, alza | Sala delle teche, Gola del ritorno |
| `FILAMENTI` | stato: quieti / esca / desti | quieti | bengala, fuga | attraversamento, presa |
| `APPOGGIO` | stato: libero / parete | libero | segui la parete; si azzera uscendo | `ovest` dalla Sala delle teche |
| risuonatore | proprietà: incastrato / staccato, più contatore `TAGLIO` 0–3 | incastrato, 0 | N3 | prendi, consumo d'aria, finali |
| `TRACCE` | contatore 0–5 | 0 | T1–T5 | AN_ALTRO, varianti dei finali |
| `SPECCHIO` | stato: non visto / visto | non visto | primo sguardo a L.V. | descrizione del risuonatore, «Vivi» |
| `SEGNO_LV` (proprietà della placca) | vergine / firmata / completata | vergine | N8 | AN_ALTRO, AN_TRACCE, «Vivi», «Due lettere» |
| `ROTAZIONE` | contatore modulo 3 | 0 | `ruota il disco` | altare |
| `NUCLEO_VIA` | stato: nessuna / forza / pazienza | nessuna | N6 | AN_MEMORIA, «Vivi» |
| `RISPOSTA` | stato: nessuna / verità / non so / silenzio | nessuna | eco del Piccolo | AN_SALTO, AN_PICCOLO, «Vivi» |
| `ONESTÀ` | stato: falsa / vera | falsa | AN_PREZZO | «La stiva piena», «Doppio fondo» |
| `ASCOLTO_ANZIANO` | stato: falso / vero | falso | AN_SILENZIO | AN_CONGEDO |
| `RISONANZE` | contatore 0–7 | 0 | R1–R7 | AN_MUSICA, «La prima nota» (prima mai letto) |
| `ECHI` | contatore 0–14 | 0 | echi di superficie | Anziano, una battuta sopra 8 (prima mai letto) |
| `RICARICA` | stato: disponibile / usata | disponibile | generatore | ricarica |
| `FUGA` | stato: no / in corso | no | AN_DISSOLVENZA | consumo, descrizioni, varchi, finali |
| seme | proprietà: vivente / scuro, più posizione | vivente | teca, Grande Porta, AN_DISSOLVENZA | chiavi, finali |
| `TRADUZIONE`, `CHIAVI`, `ENERGIA`, `PROIEZIONE`, `SISTEMA` | come ora | | | |

---

## 12. Catalogo degli oggetti nuovi (~33)

| Oggetto | Stanza | Prendibile | Serve a |
|---|---|---|---|
| Yusuf (personaggio, alla radio) | Plancia | — | movente, finali |
| la radio | Plancia | no | parlare con Yusuf |
| i comandi di manovra | Plancia | no | accosta (N1) |
| il lanciarpioni | Plancia | no | spara gli arpioni (N1) |
| il faro di prua | Plancia | no | atmosfera: la luce entra e non torna |
| il quadrante del margine | Plancia | no | il movente in un oggetto |
| la seconda cuccetta | Cuccetta | no | solitudine |
| il registro di bordo | Cuccetta | sì | data di canone, chiavetta |
| la chiavetta | Cuccetta | sì | cassetta (N2) |
| il reattore | Sala macchine | no | la nota |
| la cassetta di ferraglia (contenitore) | Sala macchine | no | bengala |
| il bengala | Sala macchine | sì | esca (N4, N11) |
| la cella d'aria | Stiva | sì | +25 aria |
| il faro del casco | Stiva (con la tuta) | sì | luce e calore (§5.2) |
| il risuonatore | Vestibolo | dopo N3 | finali |
| la nicchia | Vestibolo | no | àncora |
| le gole | Vestibolo | no | eco di superficie |
| le venature | Gola di mezzo | no | eco involontaria |
| le teche aperte | Sala delle teche | no | descrizione, pericolo |
| le teche chiuse | Sala delle teche | no | la parete fredda (N4) |
| i filamenti | Sala delle teche | no | pericolo, esca |
| il cavo spezzato | Sala delle teche | no | T3 |
| il nodo di fibre | Sala delle teche | no | il varco della fuga |
| il germinatoio | Vivaio | no | atmosfera, tavoletta |
| le tabelle di semina | Vivaio | no | traduzione |
| la scatola nera | Serra morente | no | N7, R7, T5 |
| la punta del carotatore | Serra morente | no (il freddo gli ha chiuso le dita) | le tacche, lo specchio |
| la culla | Nido | no | eco, R5 |
| i disegni | Nido | no | la rivelazione del sole |
| il sonaglio | Nido | sì | la nota |
| l'eco del Piccolo (personaggio) | Nido, dopo la culla | — | dialogo |
| il sostegno | Santuario centrale | no | il seme scuro, U1 |
| le venature del ritorno | Gola del ritorno | no | la luce del Navarca |

Oggetti esistenti che cambiano: la tavoletta (dalla Serra al Vivaio), il disco (si ruota), il seme
(tre stati), il cadavere e la placca (riscritti), le casse (diventano i ganci vuoti), le punte
(perdono l'alias «tre punte», vedi audit).

---

## 13. Audit dell'originale

Da correggere comunque, espansione o no.

| # | Problema | Dove | Proposta |
|---|---|---|---|
| A1 | L.V. è morto «~847 anni fa» in una tuta terrestre: nel 2201 vorrebbe dire intorno al 1354. Anche la placca («~800 anni, pre-coloniale») e l'incisione sulle capsule («Ottocento anni vi separano») | `regole.fav` | Deciso (D2): centocinquant'anni e tutto L.V. come nel racconto, spostato nella Serra |
| A2 | `echi` e `risonanze` crescono e nessuna regola li legge: due stati fantasma | `echi.fav` | Lettori nell'Anziano e nei finali (§11) |
| A3 | L'alias «tre punte» delle punte suggerisce la soluzione dell'enigma | `oggetti.fav` | Togliere l'alias |
| A4 | La tavoletta sta nella stessa stanza della teca che apre: nessuna deduzione | `oggetti.fav` | Spostarla nel Vivaio (N4) |
| A5 | Il nucleo si apre in un modo solo, col plasma, e il gesto non ha conseguenze | `regole.fav` | La via della pazienza e la battuta dell'Anziano (N6) |
| A6 | Nel dialogo «Chi eravate?» e «Resto ad ascoltare.» portano allo stesso nodo: scelta falsa | `dialoghi.fav` | AN_SILENZIO |
| A7 | L'eco del Capitano: «Che Dio ci perdoni per quello che stiamo portando a casa». Un dio al singolare per i K'tharr, e «a casa» per un viaggio che li porta via da casa | `echi.fav` | Riscrivere la battuta |
| A8 | La lettura delle capsule dà «SPECIE K'THARR: PREDATORE ALFA»: K'tharr è il nome della civiltà, qui sembra il nome di un animale | `regole.fav` | Una fauna del loro mondo con un nome suo |
| A9 | La tuta ha «ossigeno per sei ore» e l'aria non conta mai | `oggetti.fav` | Diventa la meccanica (§5.1) |
| A10 | Il kit porta il logo «Weyland Corp», un marchio di *Alien* | `oggetti.fav` | Vedi D4 |
| A11 | La stiva è piena di minerale per Europa: nessun motivo di salire sul relitto oltre la curiosità | `stanze.fav` | Deciso (D3): stiva vuota |
| A12 | L'Anziano afferma come certo che l'umanità è il loro seme: l'NPC sa tutto e chiude troppo pulito | `dialoghi.fav` | Deciso (D5): speranza dichiarata invece di certezza |
| A13 | Il seme ricompare nell'epilogo sulla plancia senza che chi gioca l'abbia portato | `dialoghi.fav` | Il seme si porta, o si lascia (§5.8, §7) |

---

## 14. Dai file alla produzione

### 14.1 Mappatura sui file `.fav`

Dallo strato 2 il gioco si divide in un modulo per atto, più i moduli trasversali. I file
dell'originale (`stanze`, `oggetti`, `regole`, `traduci`, `echi`, `dialoghi`) tengono gli Atti III e
IV finché gli strati 3 e 4 non li riscrivono, un'ala alla volta.

| File | Contenuto | Strato |
|---|---|---|
| `relitto.fav` | Titolo, prologo, stati e contatori globali, direzioni, topologia, moduli, segni della nave | 2 (fatto) |
| `aria.fav` | Il margine: contatore, visore, soglie, consumo del risuonatore | 2 (fatto); ricarica al generatore nel 3 |
| `santamaria.fav` | Atto I | 2 (fatto) |
| `ingresso.fav` | Atto II | 2 (fatto) |
| `vita.fav`, `tecnica.fav`, `equipaggio.fav`, `memoria.fav` | Atto III, le quattro ali (prendono stanze, oggetti, regole, echi e traduzioni delle loro ali dai file dell'originale) | 3 |
| `ponte.fav` | Atto IV: Ponte, Anticamera, Santuario centrale, Anziano | 4 |
| `fuga.fav` | Atto V: apertura dei varchi, crolli, filamenti svegli, ultima voce | 4 |
| `finali.fav` | Le sei uscite, con le varianti `[se …]` e la riga di registro | 2 («Due lettere»), 4 (gli altri) |

### 14.2 Strati di lavoro

1. **Questa mappa.** Revisione e decisioni aperte (§15).
2. **Atti I e II in dettaglio**: schede nodo complete con il testo definitivo, scritto seguendo
   prosa-italiana. Implementazione e collaudo.
3. **Atto III**, un'ala alla volta.
4. **Atti IV e V e i finali.**
5. **Bilanciamento e audit finale**: un percorso di collaudo per ogni finale in `collaudo/`
   (`vivi.txt`, `prima-nota.txt`, `stiva-piena.txt`, `doppio-fondo.txt`, `mani-vuote.txt`,
   `due-lettere.txt`), più due percorsi limite per gli invarianti I2 e I3. Collaudatore statico,
   collaudo dei finali, esploratore.

---

## 15. Decisioni

### Prese (14 ottobre 2026)

| # | Domanda | Decisione |
|---|---|---|
| D1 | Il protagonista ha un nome? | Seconda persona presente. La voce narrante non dice mai «William»: lo dicono Yusuf, il registro di bordo e la riga di registro che chiude ogni finale. |
| D2 | L.V. a centocinquant'anni invece di ottocento? | L.V. come nel libro, in tutto (età, tuta, placca, punta del carotatore, scatola nera, Matthew). Di conseguenza muore nella Serra, a mezzo metro dal seme vivo, e il gioco si apre con un frammento della sua voce. |
| D3 | Stiva vuota invece del minerale per Europa? | Sì: è il movente. |
| D4 | Il logo Weyland Corp? | Tolto: il kit porta la sigla TSC della nave. Il lettore con *Castello di Ghiaccio* resta come omaggio. |
| D5 | L'Anziano è certo o spera che l'umanità sia il loro seme? | Spera. |
| D6 | Quanto è severa l'aria? | Si muore solo nella fuga o portando il risuonatore; prima, la protezione vitale ferma gli ascolti al 30% e abbassa il faro, così il groviglio non afferra (revisione, C2). |
| D7 | La «matrice» del racconto diventa «risuonatore»? | Sì. |
| D8 | Un seme solo in tre stati, o due semi? | Uno solo (§5.8). |
| D9 | Le direzioni di transito | Più leggibili: solo punti cardinali, su e giù, e `dentro`/`fuori` per il boccaporto. Dettaglio in `02-strato-2-atti-I-II.md`, §3. |
| D10 | 23 stanze o 25? | 23. |

### Prese durante lo strato 2

- Gli oggetti di sfondo stanno nella descrizione della scena (dichiarati `di scena`); gli oggetti
  essenziali li elenca il motore, come fa di solito, e la descrizione non li nomina.
- Le altre decisioni prese scrivendo (il verbo «entra», il pannello alimentato dalla tuta, il cavo
  tranciato, i segni della nave) sono in `02-strato-2-atti-I-II.md`, §3.
