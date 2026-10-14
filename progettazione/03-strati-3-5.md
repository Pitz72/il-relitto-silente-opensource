# Il Relitto Silente — strati 3, 4 e 5

Versione 1.1, 14 ottobre 2026. Segue `02-strato-2-atti-I-II.md`. Dalla 1.1 i numeri e le note
tecniche descrivono il gioco dopo le correzioni della revisione (`04-revisione.md`, §5). Con questo documento il remake
descritto in `01-mappa-espansione.md` è completo: tutti e cinque gli atti sono scritti,
implementati e collaudati, e non restano parti dell'originale da riscrivere.

Per leggere il gioco come lo vede chi gioca ci sono tre trascrizioni in `collaudo/`:
`trascrizione-atti-I-II.txt` (gli Atti I e II, ogni oggetto), `trascrizione-vivi.txt` (la partita
più breve, 78 comandi) e `trascrizione-tutto.txt` (la partita più ricca: tutte le voci, tutte le
tracce, «La prima nota»).

---

## 1. Il gioco, alla fine

| | Originale | Remake | Variazione |
|---|---|---|---|
| Stanze | 15 | 23 | +53% |
| Oggetti | 50 | 93 | +86% |
| Regole «Invece di» | 131 | 362 | +176% |
| Testo per chi gioca | ~7.500 parole | ~19.000 parole | +155% |
| Finali | 1 | 5, più una variante segreta | |
| Nodi di dialogo | 7 | 23 (Anziano 14, Yusuf 5, eco del Piccolo 4) | |
| Voci del Sintonizzatore | 11 + 4 | 14 + 7 | |
| Percorso minimo vincente | 54 comandi | 78 comandi | |

I file del gioco, in `relitto-silente/`:

| File | Contenuto |
|---|---|
| `relitto.fav` | Orchestratore: titolo, prologo, stati globali, direzioni, topologia, moduli |
| `aria.fav` | Il margine: aria, visore, consumi, soglie |
| `santamaria.fav` | Atto I |
| `ingresso.fav` | Atto II |
| `corridoio.fav` | Atto III: il corridoio, le tacche, la Grande Porta |
| `vita.fav` | Atto III: serra (L.V.), arca biologica, sala delle teche, vivaio |
| `tecnica.fav` | Atto III: laboratorio, energia, ricarica |
| `equipaggio.fav` | Atto III: alloggio, nido, eco del Piccolo |
| `memoria.fav` | Atto III: santuario del silenzio, scriptorium, archivio |
| `ponte.fav` | Atto IV: ponte, anticamera, santuario centrale, l'Anziano |
| `fuga.fav` | Atto V |
| `traduci.fav` | La matrice di traduzione |
| `echi.fav` | Il Sintonizzatore |
| `finali.fav` | I sei finali |

I moduli dell'originale (`stanze`, `oggetti`, `regole`, `dialoghi`) non ci sono più: il loro
contenuto è migrato tutto nei moduli per atto. L'originale intatto resta in
`motore/esempi/demo/relitto-silente/`.

---

## 2. Strato 3 — l'Atto III

**Ala della Vita** (`vita.fav`). L.V. è nella serra, come nel libro: seduto contro una colonna spenta,
a mezzo metro dalla teca con il seme vivo. Lo «specchio» scatta al primo ingresso. La placca porta
il messaggio frammentario del racconto; si può firmare (`firma la placca`) o, dopo il raschio
dello Scriba, completare la sua parola (`completa la parola`). La scatola nera si ascolta
collegandola alla propria tuta (`ascolta la scatola nera`, −10): quattro frammenti di diario,
con Matthew e con l'indizio sul cavo e sulla parete fredda.
La tavoletta è nel vivaio, oltre la sala delle teche. Il groviglio sente luce e calore: col faro al
massimo prima si avvicina (−4), poi afferra e respinge nella gola di mezzo (−8). Si passa in tre
modi: faro basso e mano sulla parete (`segui la parete`, `costeggia`), il bengala come finto sole
per tre turni, oppure il campo che regge a tratti dopo l'energia, in tutti e due i sensi: anche al ritorno dal vivaio.
Nelle teche c'è il cavo guida tranciato di L.V. (T3); il suo cavo di sicurezza, che la nave gli ha
tagliato all'ingresso come a te, gli pende ancora dalla cintura.
L'arca biologica non ha più il corpo; la lettura delle capsule non chiama più «K'tharr» un animale
(audit A8).

**Ala Tecnica** (`tecnica.fav`). Il generatore, il Sintonizzatore, il banco con i nomi. Con
l'energia, `ricarica la tuta` una volta sola (+25).

**Ala dell'Equipaggio** (`equipaggio.fav`). Il nido, nuovo: i disegni di un sole solo (con la
mappa vista, «È il tuo»), il sonaglio che suona un re, la culla da cui si sintonizza la voce
giovane. Poi `parla con l'eco`: tre risposte, e la vera («Perché siete arrivati») si apre solo dopo
aver visto la rotta. Il silenzio fa sentire la risposta che il Navarca diede al Piccolo.

**Ala della Memoria** (`memoria.fav`). Il disco va orientato (`gira il disco`, `ruota il disco`)
come i tre soli dell'alba del Salto, che il bassorilievo mostra con il più grande in alto. Il nucleo
si prende con la forza (la taglierina: l'ultimo pilastro si spegne) o con la pazienza (con
l'energia il terminale si sveglia da solo e saluta). La lastra incisa ha la sua voce profonda: il
raschio dello Scriba che si ferma a metà del segno, come la parola di L.V.

**Corridoio** (`corridoio.fav`). Le tacche diventano la traccia T2 (`analizza le tacche`: una punta
da carotatore terrestre).

**Le voci e le traduzioni**, riscritte come moduli trasversali. Correzioni: la battuta del
Capitano (A7) non parla più di Dio né di «portare a casa»; lo xeno-botanico dice dove è finita la
chiave e cosa cerca il groviglio; l'Ingegnere si riconosce come la voce della gola di mezzo. Nelle
traduzioni ogni reperto si legge una volta sola e alza la matrice solo se è più in basso:
nell'originale, analizzare il nucleo prima della stele cancellava il testo della stele.

---

## 3. Strato 4 — Atti IV e V, i finali

**Ponte** (`ponte.fav`). Prima dell'anticamera, se l'aria è sotto il 45%, la tuta avverte una
volta, dicendo se generatore e cella sono ancora disponibili. L'alias «tre punte», che rivelava la
soluzione, non c'è più (A3).

**L'Anziano**: quattordici nodi. Spera, non sa (D5). Riconosce L.V. (`C'era un uomo, prima di me`,
con almeno tre tracce), la promessa a Yusuf (`Sono venuto per vendervi`: «Non più» la cancella),
la risposta al Piccolo, l'archivio aperto con la forza o con la pazienza, i segni lasciati, la
musica (con quattro voci profonde). «Resto ad ascoltare» non è più una scelta falsa (A6). Il
congedo porta alla dissolvenza nel seme e all'ultima voce, sempre a buchi.

**La fuga** (`fuga.fav`). Dal santuario si scende nella gola del ritorno; il nodo di fibre si apre
sulle teche; il varco sopra la camera si riapre; il corridoio crolla. L'aria scende di 4 a turno. Il
groviglio, sveglio, si passa con la luce fredda del Navarca (se ne hai ascoltato la voce profonda),
il bengala, il faro basso e la parete, o strappandosi via (−6). Torna la voce dei nomi. Sotto il
15% le descrizioni si spezzano in tre parole.

**I finali** (`finali.fav`): «Vivi», «La prima nota», «La stiva piena», «Doppio fondo», «Mani vuote»,
«Due lettere». Ognuno, tranne l'ultimo, chiude con la riga del registro di bordo firmata
«W. T. Eriksonn». Il risveglio in plancia è comune; il resto cambia con il seme, il risuonatore, la
placca, la risposta al Piccolo, la promessa e la confessione a Yusuf.

---

## 4. Strato 5 — bilanciamento e audit

### 4.1 I valori dell'aria, tarati

| Cosa | Valore |
|---|---|
| Primo contatto / connessione | −2 / −3, una volta |
| Eco di superficie / profonda | −4 / −6 |
| Scatola nera di L.V. | −10 |
| Traduzione | −1 |
| Groviglio col faro al massimo: si avvicina / afferra | −4 / −8 |
| Risuonatore: mano / ogni taglio / portarlo / portarlo nella fuga | −2 / −2 / −1 a turno / −4 a turno |
| Fuga | −4 a turno (non nella stiva della Santa Maria) |
| Nella fuga, strapparsi dal groviglio o restare presi | −6 |
| Cella di riserva / ricarica al generatore | +25 / +25, una volta ciascuna |
| Protezione vitale / avviso del Ponte / ipossia | sotto 30 / sotto 45 / sotto 15 |
| Protezione vitale, prima della fuga | niente ascolti né traduzioni, faro al minimo, venature chiuse |

### 4.2 Gli invarianti, verificati

| Invariante | Percorso | Esito |
|---|---|---|
| I1: il percorso critico consuma al massimo il 35% | `vivi.txt` | 34 su 150 (23%), aria finale 66 |
| I2: chi ascolta tutto torna, ma solo con entrambe le ricariche | `tutto.txt` | «La prima nota», aria finale 25, con le 21 voci (echi 14, risonanze 7) e tutte le traduzioni |
| I3: chi ascolta tutto non ha aria per il risuonatore | `limite-I3.txt` | «Due lettere» sullo scafo, aria −5 |
| I4: prima della fuga si muore solo portando il risuonatore | `groviglio-ostinato.txt`, 200 partite a caso | la protezione vitale ferma gli ascolti e abbassa il faro; nessuna morte fuori dalla fuga senza il risuonatore |
| I5: ogni soglia si annuncia | tutti | 60, 30, 15 e l'avviso del Ponte |

### 4.3 Percorsi di collaudo

| Percorso | Finale | Comandi |
|---|---|---|
| `soluzione.txt` = `vivi.txt` | «Vivi» | 78 |
| `prima-nota.txt` | «La prima nota» | 137 |
| `tutto.txt` | «La prima nota», ascoltando tutto | 151 |
| `stiva-piena.txt` | «La stiva piena» | 80 |
| `doppio-fondo.txt` | «Doppio fondo» | 81 |
| `mani-vuote.txt` | «Mani vuote» | 77 |
| `due-lettere.txt` | «Due lettere», portando il risuonatore | 110 |
| `limite-I3.txt` | «Due lettere», nella fuga | 153 |
| `prova-atti-I-II.txt` | (nessuno: ogni oggetto degli Atti I e II) | 101 |
| `riprendi-risuonatore.txt` | «La stiva piena», con il risuonatore posato e ripreso | 82 |
| `stiva-al-limite.txt` | «Vivi», entrando in stiva con l'aria a 2 | 94 |
| `groviglio-ostinato.txt` | (nessuno: il groviglio non uccide prima della fuga) | 45 |
| `vivaio-ritorno.txt` | (nessuno: il groviglio sbarra anche il ritorno) | 27 |

Ogni percorso dichiara in testa quello che deve succedere (`# atteso: …`), e
`python collaudo/regressioni.py --riprese` lo controlla, insieme alla prova di ripresa di ogni
oggetto.

Collaudo dei finali con tutti i percorsi: **6 finali dichiarati, 6 raggiunti**. Collaudatore
statico: nessun avviso del linter, nessuna regola irraggiungibile. Esploratore (partite a caso dai
percorsi): 23 stanze su 23, nessuna anomalia, nessuna eccezione del motore. Verifica tipografica
su tutti i quattordici moduli: nessun `...`, nessuna virgoletta curva doppia, caporali bilanciati,
fine riga LF.

### 4.4 Audit dell'originale: tutto chiuso

| # | Problema | Dove è stato chiuso |
|---|---|---|
| A1 | L.V. morto «847 anni fa» | strati 2–3: centocinquant'anni, come nel libro |
| A2 | `echi` e `risonanze` mai letti | strato 4: li leggono l'Anziano e i finali |
| A3 | alias «tre punte» | strato 4 |
| A4 | tavoletta accanto alla teca | strato 3: è nel vivaio |
| A5 | nucleo con una sola soluzione | strato 3: forza o pazienza |
| A6 | scelta falsa nel dialogo | strato 4: «Resto ad ascoltare» ha il suo nodo |
| A7 | il Capitano e Dio | strato 3 |
| A8 | «K'tharr predatore alfa» | strato 3 |
| A9 | l'aria che non contava | strato 2 |
| A10 | il logo Weyland | strato 2 |
| A11 | la stiva piena senza movente | strato 2 |
| A12 | l'Anziano che sa tutto | strato 4: spera |
| A13 | il seme che ricompare da solo | strato 4: si porta, o si lascia |

Problemi trovati e chiusi durante il collaudo: il vicolo cieco nella camera senza batteria (strato
2), «entra nel varco» che riportava a bordo (strato 2), l'ordine di lettura dei reperti (strato 3),
l'ultima voce e i varchi che arrivavano un turno in ritardo dopo il congedo (strato 4), le soglie
dell'aria che mostravano il valore del turno prima (strato 5).

---

## 5. Note tecniche per chi rimette mano al codice

- Fra regole e descrizioni condizionali vince la prima dichiarata: l'ordine dei moduli in
  `relitto.fav` conta. Le varianti di descrizione dei moduli che vengono prima di `fuga.fav` hanno
  «e la fuga è lontana», così nella fuga valgono quelle della fuga.
- Le opzioni di dialogo non accettano «collega» fra le conseguenze. I demoni non scattano nel turno
  in cui un dialogo si chiude: per questo l'ultima voce è un nodo, e dal santuario si scende con uno
  spostamento diretto.
- Uno spostamento diretto dentro una regola su «vai» non stampa la stanza d'arrivo: la descrizione
  sta nel testo della regola.
- Le etichette dei nodi valgono per tutta la storia: due personaggi non possono avere un nodo con lo
  stesso nome.
- I consumi d'aria per turno sono dichiarati prima delle soglie, perché i demoni si valutano
  nell'ordine in cui sono scritti. Per lo stesso motivo `aria.fav` è incluso per penultimo: le
  soglie devono vedere anche quello che tolgono il groviglio, il primo contatto e la connessione.
- La sala delle teche ha due sponde (lo stato `la sponda`): il groviglio sbarra `ovest` a chi
  viene dalla gola e `su` a chi viene dal vivaio o, nella fuga, dalla gola del ritorno.
- Disco, stele e nucleo sono «incastrati» fino alla prima presa, come il risuonatore: il testo
  della prima presa non si ripete.
- Il risuonatore diventa prendibile al terzo taglio: un oggetto messo in inventario da una regola
  non è prendibile, se non lo si dichiara.

---

## 6. Cosa resta

Niente del piano. Restano scelte che spettano all'autore:

- rileggere il testo nelle trascrizioni e indicare le battute da cambiare;
- decidere se pubblicare il gioco, per esempio con `favella1 esporta` (un HTML giocabile);
- il progetto è sotto git dal 14 ottobre 2026.
