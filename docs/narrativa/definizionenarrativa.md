# DEFINIZIONE NARRATIVA — IL RELITTO SILENTE
## Roadmap di rifinitura finale · pre-chiusura progetto

> **[STORICO — piano narrativo v1.1.x]** Questo è il piano di rifinitura narrativa N1–N11, redatto su v1.1.25 e chiuso a v1.1.33/v1.1.37 (2026-03-21). È un documento di progettazione, non lo stato corrente. Lo sviluppo è poi proseguito con meccaniche narrative successive (verbo `TRADUCI`, echi profondi, verbo `INCIDI`, secondo percorso WS5): vedi `../changelog/1.4.0.md`, `1.5.0.md`, `1.5.1.md` e lo stato in `../sviluppo/STATO_PROGETTO.md`.

*Documento redatto dopo valutazione narrativa completa del testo di gioco (v1.1.25).*
*Le voci sono ordinate per priorità e impatto sull'esperienza.*

---

## ✅ STATO IMPLEMENTAZIONE — COMPLETATO AL 100%

**Data chiusura:** 2026-03-21 · **Versione finale:** 1.1.33 (narrativa) + 1.1.37 (bugfix post-simulazione)

| Voce | Priorità | Versione | Stato |
|---|---|---|---|
| N1 — Monologo ingresso relitto | `[!!]` | v1.1.26 | ✅ Implementato |
| N2 — Monologo corpo umano | `[!!]` | v1.1.26 | ✅ Implementato |
| N3 — Ingresso Santuario Centrale | `[!!]` | v1.1.26 | ✅ Implementato |
| N4 — Taglio monologo Anziano | `[!!]` | v1.1.26 | ✅ Implementato (chirurgico) |
| N5 — Rimuovi suggerimento "TOCCA TRE PUNTE" | `[!!]` | v1.1.27 | ✅ Implementato |
| N6 — Scriptorium: fisicità della scrittura | `[!]` | v1.1.28 | ✅ Implementato |
| N7 — Secondo punto di contatto L.V. | `[!]` | v1.1.29 | ✅ Implementato (tacche nel Corridoio) |
| N8 — Anticamera prima del Santuario | `[~]` | v1.1.30 | ✅ Implementato (nuova stanza) |
| N9 — Voce umana negli echi | `[~]` | v1.1.32 | ✅ Implementato (traccia RF nelle tacche) |
| N10 — Eco corridoio anonima | `[~]` | v1.1.31 | ✅ Implementato (identificatore deliberato) |
| N11 — Incavi porta ovest | `[?]` | v1.1.33 | ✅ Implementato (forme spostate ad ANALIZZA) |

**Tutte le 11 voci narrative sono state implementate.** Il documento è chiuso.

---

## LEGENDA PRIORITÀ

| Simbolo | Significato |
|---|---|
| `[!!]` | Indispensabile — cambia la qualità percepita del gioco in modo netto |
| `[!]` | Alta priorità — migliora significativamente un momento già buono |
| `[~]` | Affinamento — non necessario ma eleva la coerenza complessiva |
| `[?]` | Opzionale / da valutare — da decidere se apre più problemi di quanti ne risolve |

---

## SEZIONE 1 — INTROSPEZIONE DEL PROTAGONISTA

Il difetto strutturale principale del testo attuale: il protagonista è una camera su treppiede nei momenti di massima densità narrativa. Non mancano stanze — mancano reazioni umane nei tre punti dove la scoperta dovrebbe colpire più forte.

---

### N1 `[!!]` — Passaggio dallo scafo umano al relitto alieno

**Dove:** `scafoEsterno.ts` — descrizione della stanza / risposta a ENTRA
**Problema:** il passaggio fisico tra la Santa Maria e la nave aliena è il momento di non-ritorno del gioco. Il giocatore lo attraversa quasi senza registrarlo. È una porta che si apre con una taglierina.

**Cosa aggiungere:** un monologo interiore breve (3-5 righe) al momento di ENTRA, prima che la Camera di Compensazione venga descritta. Non stupore generico — qualcosa di specifico: il silenzio che cambia timbro nello spazio, il momento in cui il casco non trasmette più la vibrazione dei motori della Santa Maria. Il protagonista smette di sentire la propria nave.

**Tono di riferimento:** lo stesso registro del monologo sulla mappa stellare nel Ponte di Comando — osservazione precisa, non esclamativa.

**Esempio di innesco:** il testo potrebbe apparire come `[PAUSE]` dopo la risposta "Crei un varco" prima del cambio stanza, oppure come primo paragrafo nella descrizione della Camera di Compensazione alla prima visita.

---

### N2 `[!!]` — Ritrovamento del corpo umano nell'Arca Biologica

**Dove:** `arcaBiologica.ts` — risposta a ESAMINA CADAVERE (primo esame, prima del pickup degli oggetti)
**Problema:** è il momento narrativamente più esplosivo del gioco. Un essere umano, morto qui 847 anni fa. Il giocatore lo esamina e ottiene una descrizione oggettiva ("Giace rannicchiato... indossa una tuta... stringe qualcosa"). La risposta emotiva del protagonista è assente.

**Cosa aggiungere:** prima della descrizione tecnica del cadavere, o subito dopo, un momento di arresto. Il protagonista non riesce a fare immediatamente la mossa successiva. Pensa a cosa significa: un umano ci è arrivato prima. Non in questo secolo. Non nella sua generazione. Ottocento anni fa. Qualcuno ha fatto esattamente quello che stai facendo tu, in questo punto esatto dello spazio, quando la Terra stava costruendo le prime cattedrali gotiche.

**Nota:** questo è il monologo più importante che manca. L'analisi della tuta (L.V., AURORA-7) è già scritta bene — ma arriva dopo che il giocatore ha già metabolizzato la presenza del corpo. La reazione iniziale al *corpo in quanto tale* — non ai dati che trasporta — non c'è.

---

### N3 `[!!]` — Ingresso nel Santuario Centrale

**Dove:** `santuarioCentrale.ts` — descrizione della stanza (primo ingresso)
**Problema:** il giocatore ha appena dissolto una porta con tre artefatti millenari, attraversato il Ponte di Comando, e ora si trova in quello che è evidentemente il punto culminante di tutto. La descrizione attuale è funzionale ma piatta: "Sei nel Santuario Centrale. Di fronte a te, fluttua la figura luminosa dell'Anziano..." — non c'è pausa, non c'è respiro.

**Cosa aggiungere:** nella descrizione al primo ingresso, prima dell'Anziano, una o due righe di registrazione spaziale e sensoriale che abbassino il ritmo. Non è il momento per informazioni — è il momento per creare silenzio prima che il silenzio venga riempito. Il giocatore deve sentire di essere arrivato da qualche parte. Questo è l'unico posto del gioco dove il ritmo dovrebbe quasi fermarsi prima di procedere.

**Suggerimento tecnico:** usare il marcatore `[PAUSE]` dopo la descrizione ambientale e prima della menzione dell'Anziano, in modo che il giocatore debba premere Invio per vederlo. È già usato altrove — qui sarebbe più giustificato che in qualsiasi altro punto del gioco.

---

## SEZIONE 2 — IL DISCORSO DELL'ANZIANO

### N4 `[!!]` — Il monologo over-spiega la tesi

**Dove:** `santuarioCentrale.ts` — handler PARLA CON ANZIANO
**Problema:** il monologo è bello ma eccede di circa un terzo. Tre specifiche linee fanno il lavoro di spiegare quello che il giocatore ha già capito:
- *"Tu... sei quella nuova musica. Una melodia che potevamo solo immaginare, nata nel silenzio che ci siamo lasciati alle spalle."*
- *"Nel tuo sangue, porti il fantasma dei nostri tre soli. Sei la nostra discendenza."*
- L'intera frase *"Ma noi non siamo i tuoi dèi. Siamo solo il ricordo della prima nota."*

La prima di queste è la peggiore: dice esplicitamente "tu sei il risultato del nostro progetto". Il giocatore lo ha già capito dall'analisi della tuta, dalla mappa stellare, dalla Stele. Ridirlo qui è nervosismo narrativo — la paura che il giocatore non abbia capito.

**Cosa fare:** tagliare o condensare le tre righe identificate. La rivelazione deve essere lasciata nell'aria, non consegnata con un fiocco. Il finale del monologo — "Vivi. Sarà il suono più bello" — è perfetto e non va toccato. Tutto quello che lo precede dovrebbe guadagnare in densità eliminando la sovra-spiegazione.

**Criterio di verifica:** dopo il taglio, rileggere il monologo chiedendosi: qualcosa è diventato oscuro, incomprensibile, non deducibile? Se no, il taglio è corretto.

---

## SEZIONE 3 — PUZZLE DEL PONTE DI COMANDO

### N5 `[!!]` — "TOCCA TRE PUNTE" non deve essere suggerito dal testo

**Dove:** `ponteDiComando.ts` — handler TOCCA PUNTE (con flag knowsAboutTrinarySystem)
**Problema:** il testo dice esplicitamente *"Prova: TOCCA TRE PUNTE."* È il puzzle finale del gioco — l'unico momento in cui il giocatore dovrebbe connettere da solo due cose che ha scoperto (tre soli → tre punte). Regalarglielo distrugge l'unica vera soddisfazione cognitiva del finale.

**Cosa fare:** rimuovere la riga che suggerisce il comando letterale. Il testo può ancora evocare il concetto ("il loro sistema aveva tre soli... il numero sembra avere un significato") ma non deve mai scrivere il comando. Il giocatore che ha prestato attenzione ci arriverà. Quello che non ci arriva ha il sistema HINT per questo.

**Testo attuale da correggere:**
> *"Le punte luminose attendono un input preciso. Quante? Hai visto la risposta nella mappa stellare: il loro sistema aveva tre soli. Prova: TOCCA TRE PUNTE."*

**Direzione di riscrittura:** fermarsi prima dell'ultima frase. Lasciare la deduzione aperta.

---

## SEZIONE 4 — STANZE SOTTOSVILUPPATE

### N6 `[!]` — Scriptorium: il luogo della scrittura è un corridoio

**Dove:** `scriptorium.ts`
**Problema:** il Custode nel Santuario del Silenzio dice nell'eco: *"L'ultima iscrizione è completa. La Stele porta tutto ciò che siamo stati..."*. Lo Scriba porta nell'eco il peso di aver fissato una civiltà in simboli. Ma la stanza dove questo è avvenuto — lo Scriptorium — è attualmente un punto di transito: prendi il disco, vai avanti.

C'è un'ironia narrativa qui che il gioco non sfrutta: il luogo fisico della scrittura millenaria ridotto a un corridoio. Chi ha giocato con attenzione sente la dissonanza.

**Cosa aggiungere:** nella descrizione della stanza, uno o due elementi che rendano fisicamente presente l'atto dello scrivere — strumenti, superfici, la postura suggerita dalla disposizione degli oggetti. Non occorre aggiungere un puzzle: basta che la stanza si *senta* come il posto dove qualcuno ha trascorso gli ultimi giorni della civiltà K'tharr a incidere simboli.

**Opzionale:** una risposta a TOCCA PARETI / TOCCA ISCRIZIONI che aggiunga una nota tattile. Come si sente toccare la superficie dove sono incise le ultime parole di una lingua morta?

---

### N7 `[!]` — L.V./AURORA-7: un secondo punto di contatto

**Dove:** da decidere — candidato migliore: `alloggiEquipaggio.ts` o `corridoioPrincipale.ts`
**Problema:** L.V. viene introdotto con grande dettaglio nell'Arca Biologica (analisi biometrica, iniziali incise nella placca) e poi non riappare. Il gioco dichiara che il silenzio è intenzionale, ma narrativamente il mistero si chiude prima di aprirsi davvero.

**Cosa fare:** aggiungere un secondo oggetto umano minimalista, non identificato come di L.V. a prima vista, in un'altra stanza. Qualcosa che L.V. potrebbe aver lasciato intenzionalmente come briciola — non per spiegare, ma per segnalare che è stato qui, che ha esplorato, che aveva uno scopo. Il giocatore che collega i puntini sente il brivido. Quello che non lo fa non perde nulla.

**Vincoli:** deve essere piccolo, non dare informazioni nuove sulla trama, e non generare domande a cui il gioco non può rispondere. La firma di L.V. nell'Arca Biologica è già il massimo di esplicitezza consentita — questo secondo oggetto deve essere più ambiguo.

**Candidati:** un marchio di utensile umano su una superficie aliena (segno che qualcuno ci ha lavorato), un sistema di marcatura su una porta (frecce o tacche incise, convenzione di esplorazione), un oggetto consumato che ha una funzione K'tharr ma mostra tracce di uso umano recente (su scala geologica).

---

### N8 `[~]` — Anticamera prima del Santuario Centrale

**Dove:** architettura di navigazione — transizione Ponte di Comando → Santuario
**Problema:** la porta circolare si apre e si entra direttamente nel finale. Non c'è decelerazione narrativa prima della scena più importante del gioco.

**Cosa fare:** valutare se aggiungere un micro-ambiente — non una stanza completa, ma un corridoio/soglia con una sola descrizione — tra l'apertura della porta e il Santuario. Anche solo quattro righe che cambino il passo: l'oscurità che diventa diversa, l'aria che cambia, qualcosa che segnali che si sta attraversando una soglia irreversibile.

**Nota:** questa modifica richiede un cambio di navigazione (nuova location) e un aggiornamento della mappa. Valutare se l'impatto giustifica la complessità. Se il N3 (introspezione all'ingresso del Santuario) viene implementato bene, questo potrebbe diventare superfluo.

---

## SEZIONE 5 — COERENZA DEGLI ECHI

### N9 `[~]` — Gli echi K'tharr vs. la voce umana

**Dove:** `echoData.ts`
**Problema:** tutti gli 11 echi sono voci K'tharr. L'unica voce umana nel gioco è il messaggio inciso sulla placca di L.V. Gli echi creano un universo monoliticamente alieno — il che è narrativamente coerente — ma significa che il giocatore non sente mai la voce di un umano che ha vissuto questa stessa esperienza.

**Considerazione:** se N7 viene implementato (un secondo artefatto di L.V.), valutare se uno degli artefatti potrebbe contenere un frammento audio recuperato — non una voce intera, ma un frame: una parola, un rumore riconoscibile. Non è necessario. Ma se L.V. viene reso più presente, la discrepanza tra la ricchezza di voci K'tharr e il silenzio umano diventa più acuta.

**Raccomandazione:** solo se N7 viene implementato e lo giustifica.

---

### N10 `[~]` — L'eco del Corridoio Principale è troppo anonima

**Dove:** `echoData.ts` — `echo_corridoio`
**Testo attuale:** *"VOCE ANONIMA: 'Il Seme è al sicuro. La Stele è al sicuro. Il Nucleo è al sicuro. Abbiamo fatto tutto quello che potevamo. Tutto. Ora è nelle mani del tempo — e del futuro che non conosceremo mai.'"*

**Problema:** questa è l'unica voce identificata come "VOCE ANONIMA". Tutti gli altri echi hanno un ruolo — Capitano, Ingegnere Capo, Navarca, Ufficiale Medico. L'anonimato qui potrebbe essere una scelta (l'ultimo che rimane senza titolo) o potrebbe essere un'incompletezza. Decidere quale delle due e, se è una scelta, renderla esplicita nel testo stesso (anche solo con un cambio minore: *"UNA VOCE — non identifica chi parla"* o una costruzione che suggerisca che l'identificatore è stato deliberatamente rimosso).

---

## SEZIONE 6 — STRUTTURA DEI TRE ARTEFATTI

### N11 `[?]` — I tre incavi nella porta la rendono meccanicamente ovvia

**Dove:** `corridoioPrincipale.ts` — descrizione della porta ovest
**Problema:** il testo descrive esplicitamente "tre incavi di forme diverse: uno a forma di seme, uno a forma di tavoletta rettangolare e uno a forma di cristallo poliedrico." Il giocatore vede immediatamente il contratto: ho bisogno di un seme, di una tavoletta, di un cristallo. Non c'è scoperta.

**Problema del problema:** questa è una scelta di design leggibile e onesta verso il giocatore. Le avventure testuali anni '80 spesso *non* facevano questa scelta e risultavano frustranti. Rendere il contratto esplicito è difendibile.

**Cosa valutare:** esistono due opzioni. Prima opzione: mantenere gli incavi ma rimuovere la descrizione delle forme specifiche — il giocatore deve analizzare la porta per scoprirle. Seconda opzione: mantenere il testo attuale e accettare la trasparenza come una scelta stilistica consapevole.

**Raccomandazione:** questa è la modifica più rischiosa della lista. Tocca l'equilibrio puzzle/narrativa. Valutare solo se le altre modifiche sono già consolidate e se si ha certezza sul nuovo testo. Non fare come prima cosa.

---

## ORDINE OPERATIVO SUGGERITO

Le modifiche sono state scritte in ordine di importanza ma l'ordine di implementazione dovrebbe tenere conto del rischio:

| Ordine | Voce | Rischio tecnico | Impatto narrativo |
|---|---|---|---|
| 1 | N4 — Taglio monologo Anziano | Basso (solo testo) | Alto |
| 2 | N5 — Rimuovi suggerimento "TOCCA TRE PUNTE" | Basso (una riga) | Alto |
| 3 | N2 — Monologo sul corpo umano | Basso (testo in stanza esistente) | Massimo |
| 4 | N1 — Monologo ingresso relitto | Basso (testo in stanza esistente) | Alto |
| 5 | N3 — Ingresso Santuario + PAUSE | Basso (testo + marcatore) | Alto |
| 6 | N6 — Scriptorium | Basso (testo in stanza esistente) | Medio |
| 7 | N7 — Secondo artefatto L.V. | Medio (oggetto nuovo) | Medio |
| 8 | N10 — Eco corridoio anonima | Minimo (una parola) | Basso |
| 9 | N8 — Anticamera Santuario | Alto (nuova location + mappa) | Medio |
| 10 | N9 — Voce umana negli echi | Medio (decisionale) | Basso |
| 11 | N11 — Incavi porta ovest | Alto (tocca puzzle logic) | Variabile |

**Le prime 6 voci sono la rifinitura finale.** Le restanti sono opzionali e da valutare caso per caso.

---

## NOTE OPERATIVE

- Ogni modifica narrativa richiede una bump di versione e un log in `/log/`.
- Prima della build di distribuzione: rileggere l'intero testo del gioco in sequenza come se si giocasse per la prima volta. Non per debug tecnico — per ritmo.
- Il test umano già pianificato è il momento ideale per verificare se N1, N2 e N3 bastano da soli a cambiare la percezione del protagonista.
- Le modifiche `[!!]` a basso rischio tecnico (N1–N5) possono essere implementate in un'unica sessione di lavoro.

---

*Documento di lavoro — Il Relitto Silente Project · 2026*
