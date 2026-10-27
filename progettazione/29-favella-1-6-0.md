# Favella1 1.6.0: che cosa cambia per il Relitto

Versione 1.1, 27 ottobre 2026 (la prima è del 26; il §8 racconta la 1.6.1). Segue il documento 16, che ha fatto la stessa strada con la 1.5.0, e risponde
alla richiesta dell’autore: «Ora Favella è arrivato a 1.6.0. Vedi di integrare il nuovo engine e cosa e come
questo può portare vantaggi al gioco».

---

## 1. In breve

- **Favella1 1.6.0** è il tag `v1.6.0` del 24 ottobre 2026 (commit `e6c3f7c`): cinque frasi nuove, tutte
  aggiunte, senza cambiare il significato di quelle che c’erano. La semantica è in
  `motore/documentazione/grammatica-1.6.0.md`, §29 e §30.
- **Il motore del gioco è aggiornato.** È il primo livello del documento 16: `motore/` rifatta dal tag, i
  `.fav` intatti, come l’autore ha deciso il 16 ottobre (documento 16, §11). Il Relitto gioca identico:
  255 partite giocate con i due motori, 39.083 passi, con la stessa impronta e gli stessi pulsanti a ogni
  passo, e lo stesso testo tranne l’eco di un nome sconosciuto scritto a mano (§4). Tutti i collaudi sono verdi, anche nell’eseguibile vero; i sei salvataggi veri dell’autore,
  fatti con il motore 1.5.0, si caricano «identica», senza avviso (§4).
- **Chi gioca non vede niente di diverso**, ed è il risultato voluto: stesse risposte, stessi pulsanti,
  stessi suoni. Cambia solo la scritta in fondo al menu, «Favella1 1.6.0».
- **C’è un prezzo, piccolo**: all’avvio la compilazione della storia, dentro Pyodide, passava da 0,61 a 0,90
  secondi, mentre si legge la dichiarazione. Quasi metà era un difetto del motore, un’espressione regolare
  che cercava gli oggetti contabili a ogni carattere: l’autore ha chiesto di correggerlo in Favella1, ed è la
  **1.6.1** (27 ottobre), con la copia rifatta. Il resto è il parser della grammatica 1.6, più grande:
  0,80 secondi contro 0,62 della 1.5.0 (§5 e §8).
- **I vantaggi veri stanno nelle frasi nuove**, che toccano i `.fav` (§6). Per il Relitto ne conta una:
  `L'aria resta sempre fra 0 e 100.`. Toglie una piccola incoerenza (quando si muore il visore segna −5 e il
  testo dice che la cifra è a zero), sostituisce cinque `resta fra` scritti a mano, e sui percorsi di
  collaudo non cambia una sola parola. Le procedure servirebbero a mettere ordine nel sorgente; relazioni,
  oggetti contabili e passaggi senza ritorno qui servono poco o niente.

---

## 2. Che cosa c’è di nuovo, e che cosa ne fa il Relitto

| Frase | Esempio del manuale | Nel Relitto |
|---|---|---|
| l’invariante | `La sete resta sempre fra 0 e 100.` | l’aria: oggi il limite in alto è scritto a mano in cinque regole, in basso non c’è (§6.1) |
| il passaggio senza ritorno | `La botola collega giù a il pozzo senza ritorno.` | le due soglie del Ponte, che oggi rispondono «non torni indietro» (§6.2) |
| le procedure | `Definisci "far passare la notte" come: …` e poi `esegui far passare la notte` | dieci sequenze di conseguenze ripetute, in 22 regole (§6.3) |
| le relazioni | `"si fida di" è una relazione molti a molti.` | nessun uso: tre personaggi (l’eco, l’Anziano, Yusuf), con stati semplici |
| gli oggetti contabili | `La pozione, plurale "pozioni", è contabile.` | nessun uso: nel relitto non c’è niente in più copie |

Le parole riservate nuove (`sempre`, `ritorno`, `relazione`, `molti`, `ed`, `reciproca`, `reciproco`,
`qualcuno`, `definisci`, `esegui`, `plurale`, `contabile`, `Ci`) non disturbano il Relitto: compila come
prima, 23 stanze e 93 oggetti, nessun avviso.

Gli oggetti contabili sono la sola novità che tocca il giro di gioco: il motore ora stacca un numero in testa
al nome per «prendi», «lascia» e il verbo nuovo «consuma» («prendi 2 pozioni», «prendi una pozione»,
«prendi tutte le pozioni»). Il numero si stacca anche davanti alle cose che
non sono contabili, che poi si trattano come prima: «prendi 2 il faro di prua» vale «prendi il faro di
prua». I pulsanti non scrivono mai comandi così, e per chi gioca con il ramo non cambia niente; nella
modalità a solo testo il motore diventa un po’ più tollerante (§4). «Consuma» non compare nei menu del ramo:
il modello d’azione dell’app mostra un verbo della libreria solo se ha un motivo, e nessuna cosa del Relitto
ne dà uno (le 255 partite del §4 hanno gli stessi pulsanti a ogni passo).

**Che cosa la 1.6.0 non porta.** Per la Santa Maria su Favella1 (documento 19) servivano testi con un
identificativo, dialoghi avviati da una regola, nodi che avanzano da soli, opzioni da usare una volta sola e
una voce della libreria sovrascrivibile: nella 1.6.0 non c’è nessuna di queste cose, e il documento 19
resta com’è. Per l’inglese (documento 20) non cambia niente: la traduzione resta a valle del motore,
nell’app. Favella Studio 1.4.0, uscito dopo il tag, mostra sulla mappa l’analisi statica di vincibilità che
il motore aveva già (`collaudo.analizza_vincibilita`): per il gioco non è una novità.

---

## 3. Come si è aggiornato `motore/`

1. **La copia.** Prima di toccarla, i moduli di `motore/` erano identici al tag `v1.5.0`. La copia è
   rifatta dal tag `v1.6.0` con gli stessi file di prima (i 97 file che git conosce in `motore/`: nelle
   cartelle copiate la 1.6.0 non toglie e non aggiunge niente). La specifica della grammatica passa dalla
   1.5.0 alla 1.6.0, e accanto al piano della 1.5.0 c’è quello della 1.6.0
   (`documentazione/evoluzione-oltre-1.5.0.md`). Il comando, dalla radice del Relitto, con `elenco.txt` che
   contiene i file di `motore/` (`git ls-files motore`, senza il prefisso):

   ```
   tr '\n' '\0' < elenco.txt | xargs -0 git -C ../../../GitHub/FAVELLA1 archive v1.6.0 | tar -x -C motore
   ```

   I cinque moduli che l’app porta dentro Pyodide (`favella_utils.py`, `strutture.py`,
   `libreria_azioni.py`, `compilatore.py`, `gioco.py`) sono identici al tag, a parte i fine riga.
   `VERSIONE_MOTORE` dice `1.6.0`.
2. **Il repository Favella1** ha, dopo il tag, altri 22 commit (Favella Studio 1.4.0, il sito, i manuali
   rigenerati): nessuno tocca i moduli del motore. La copia segue il tag, come sempre.
3. **L’app.** Niente da cambiare: la ruota di Lark 1.3.1 va bene, e il ponte usa le stesse funzioni del
   motore di prima. La spia che riconosce le cose nominate da un comando scritto si aggancia al codice di
   `_esegui_comando`, che nella 1.6.0 è cambiato: la spia lo legge all’avvio, e `collaudo/scritti.py` dice
   che vede ancora. Nel ponte è cambiato solo il commento in testa.
4. **I documenti**: `sviluppo/STRUTTURA.md`, `sviluppo/VERSIONI.md`, `relitto-silente/README.md`, i
   riconoscimenti (`python strumenti/riconoscimenti.py`: «Favella1 1.6.0» nei titoli di coda e nel file
   delle licenze). Per `VERSIONI.md`, §3, un motore *minor* nuovo prima della 1.0 entra con la fase in
   corso, come la 1.5.0: il numero del gioco non cambia adesso.

---

## 4. Le prove

| Prova | Esito con il motore 1.6.0 |
|---|---|
| la suite del motore | `test_linguaggio.py` 1.434 passati, 0 falliti (su un estratto del tag); `test_collaudo.py` 50 su 50 (nella copia) |
| `python collaudo/regressioni.py --riprese` | 14 percorsi su 14, con la prova di ripresa; le stesse arie finali di prima |
| `python collaudo/pulsanti.py` | 14 su 14; 1.291 comandi: 1.112 con lo stesso comando, 179 con uno equivalente, nessuno con lo stesso stato e una risposta diversa |
| `node collaudo/menu.mjs` | 14 su 14, i sei finali con i soli menu; 1.291 comandi: 1.109 uguali, 179 equivalenti, 3 con lo stesso stato e una risposta diversa («inventario», che nei menu diventa «aspetta»): gli stessi numeri del motore 1.5.0. Il riferimento `collaudo/finali-menu.json` è riscritto identico |
| `python collaudo/eventi.py` | 14 su 14; 85 eventi su 85; i cinque segni a sorte; il ponte non cambia i sei finali |
| `python collaudo/salvataggi.py` | 14 su 14; 463 salvataggi ricaricati identici; i rifiuti e le segnalazioni (11 casi) |
| `python collaudo/diario.py`, `python collaudo/scritti.py` | verdi |
| `node collaudo/tipografia.mjs` (anche `--solo-testo`) | 1.131 stringhe, nessun problema |
| `npm --prefix app run prove` | 92 su 92 |
| `python strumenti/audio/traccia.py --tutti`, poi `prova_partite` | 14 partite su 14 |
| l’eseguibile vero (`prova_eseguibile.py finali` e `salvataggi`) | i sei finali e i titoli di coda; il salvataggio torna «identica» |
| i sei salvataggi veri dell’autore (`Documenti/Il Relitto Silente/salvataggi`, motore 1.5.0) | tutti «identica», senza avviso: il ponte riconosce che è cambiato solo il motore (documento 16, §10) |

**Le due versioni a confronto.** Come per la 1.5.0 (documento 16, §1), le stesse partite giocate con il
motore 1.5.0 e con il 1.6.0, confrontando a ogni passo il testo, l’impronta dello stato e i pulsanti offerti
(il dizionario intero di `pulsanti()`, nel modo «pulsanti» del ponte). Le partite: i file di `collaudo/`
giocati per intero, e da ogni stanza nuova che toccano una partita a caso di al più 120 comandi con l’esploratore
del motore, nei suoi quattro caratteri (refusi, parole a caso, cose che non ci sono, «annulla» compresi). In
tutto 255 partite e 39.083 passi:

| Confronto | Esito |
|---|---|
| impronta dello stato | uguale a ogni passo |
| pulsanti offerti | uguali a ogni passo (anche i verbi: «consuma» non entra) |
| testo | uguale, tranne 39 passi: «prendi un cammello», un comando sbagliato dell’esploratore, risponde `Non vedo 'cammello' qui.` invece di `Non vedo 'un cammello' qui.` (il motore stacca l’«un» prima di cercare il nome) |

**Le sonde.** Lungo ogni percorso, a ogni passo, per ogni cosa in vista o portata, dieci comandi con una
quantità o con il verbo nuovo, giocati su un ramo con `prova()` e poi disfatti: «prendi un/una …», «prendi
2 …», «prendi due …», «prendi tutte le …», «prendi tutto …», «lascia uno …», «lascia tre …», «consuma …»,
«consuma una …». In tutto 261.560 sonde. Dove la 1.5.0 rispondeva `Non vedo '2 il faro di prua' qui.` o
«Non capisco questo verbo.», la 1.6.0 capisce: «prendi 2 il faro di prua» risponde come «prendi il faro di
prua» («Non puoi prenderlo.»), e «consuma …» risponde «Non succede nulla di particolare.». In 69 sonde la
1.5.0 capiva la cosa sbagliata e la 1.6.0 quella giusta: «lascia uno la teca» lasciava la tavoletta, ora
dice «Non ce l’hai.»; «prendi una la tuta» rispondeva «No.», ora «Ce l’hai già.». Nessuna sonda va peggio.

Questi comandi non nascono mai dai pulsanti; contano solo nella modalità a solo testo (documento 18), dove
la 1.6.0 è più tollerante. Una sola conseguenza da sapere: «consuma …» scritto a mano adesso è un’azione e
fa passare il turno, come «prendi il faro di prua» rifiutato; con il risuonatore addosso costa aria.

---

## 5. Il prezzo: la compilazione all’avvio

| Misura | 1.5.0 | 1.6.0 |
|---|---|---|
| compilazione del Relitto in CPython (dalla seconda in poi) | 140–160 ms | 260–310 ms |
| dentro Pyodide 0.27.8, come nell’app: importazione del motore e del ponte | 0,22 s | 0,23 s |
| dentro Pyodide: compilazione | 0,61 s | 0,90 s |
| dentro Pyodide: partita nuova | 30 ms | 31 ms |

La misura dentro Pyodide è fatta con il pacchetto `pyodide` dell’app sotto Node, con gli stessi passi di
`app/src/motore/runtime.ts`, senza aprire l’eseguibile. Nell’eseguibile con il motore 1.5.0 i due blocchi
del motore durante la dichiarazione erano di 585 e 766 ms (`strumenti/misure/loghi.mjs`, 26 ottobre): con la
1.6.0 il secondo cresce di circa 0,3 secondi. La dichiarazione è un testo fermo che resta fino a venti
secondi, e i loghi non ne risentono (il motore parte dopo di loro, revisione 25, M1): chi gioca se ne può
accorgere solo se clicca nel momento esatto del blocco, e aspetta un attimo di più.

**La causa** è nel compilatore della 1.6.0, nella prima passata (`costruisci_symbol_table`): l’espressione
che riconosce `La pozione, plurale "pozioni", è contabile.` (`_RE_DEF_CONTABILE`) comincia con un nome pigro
che il motore prova a ogni posizione del testo. Sui 221 mila caratteri del Relitto costa 126 ms, e non trova
niente. Ancorata all’inizio della frase (`(?<![^.\n])` davanti) trova le stesse dichiarazioni in 6 ms. La
copia in `motore/` non si corregge mai a mano: la correzione va nel repository Favella1 (una 1.6.1), con le
sue prove, e poi la copia si rifà dal tag nuovo. È stato fatto il 27 ottobre: §8.

---

## 6. Se l’autore riapre il testo: che cosa darebbero le frasi nuove

Ogni riga di questo paragrafo tocca i `.fav`, che sono congelati: cambia l’impronta della storia, quindi va
nel CHANGELOG, e i salvataggi di prima si caricano «ricostruita», con l’avviso che la storia è cambiata.
Sono decisioni dell’autore. Sono in ordine di utilità.

### 6.1 L’aria fra 0 e 100 (consigliata, se il testo si riapre)

Oggi l’aria (`aria.fav`, «il contatore aria, 0–100») ha il tetto scritto a mano dopo ogni ricarica,
`e adesso l'aria resta fra 0 e 100`, in cinque regole (`santamaria.fav:368` e `:371`, la cella di riserva;
`tecnica.fav:53`, `:58` e `:62`, la ricarica al generatore). Sotto lo zero, invece, non c’è limite: nella
fuga il consumo è di 4 a turno, 8 con il risuonatore, e la cifra scende sotto lo zero nel turno in cui si
muore. Nel percorso
`limite-I3` la partita finisce con l’aria a −5; il testo della morte dice «La cifra sul visore è a zero», e
il visore dell’app, che mostra il numero del motore, segna −5.

Con la 1.6.0 basta una riga in `aria.fav`, dopo `L'aria parte da 100.`:

```
L'aria resta sempre fra 0 e 100.
```

e le cinque conseguenze `resta fra` si tolgono. **Provato su una copia** dei `.fav`, con il motore 1.6.0: i
14 percorsi restano verdi con tutte le loro attese; su tutti i 2.529 comandi dei file di `collaudo/` il
testo di ogni risposta è identico; l’impronta cambia in due passi soli, la morte di `limite-I3` e il passo
dopo, dove l’aria è 0 invece di −5. La soglia della morte (`Quando l'aria è al massimo 0`) scatta come
prima.

In alternativa, senza toccare i `.fav`: il visore dell’app potrebbe non scendere mai sotto lo zero. Corregge
quello che si vede, ma il motore continuerebbe a dire −5 (ai suoni, al registro dei finali, ai salvataggi).

### 6.2 Le soglie senza ritorno

`ponte.fav:107` e `:130`: dall’anticamera e dal santuario centrale l’uscita «est» c’è, perché ogni
`collega` crea anche il ritorno, ma una regola risponde «Hai attraversato la soglia. Non torni indietro,
adesso.» e «Non c’è più nessun indietro…». Con
`Il ponte di comando collega ovest a l'anticamera senza ritorno.` (e lo stesso per il santuario centrale) l’uscita sparisce del tutto, anche fra i pulsanti. È una
scelta di regia più che una correzione: oggi chi gioca può provare a tornare indietro e leggere la frase, che
è parte della scena. Il consiglio è lasciare com’è.

### 6.3 Le procedure: ordine nel sorgente

Dieci sequenze di due o più conseguenze tornano identiche in 22 regole. Le più chiare: la ricarica al
generatore (tre regole, `tecnica.fav:53–62`: aria +25, il tetto, la ricarica usata), la cella di riserva
(due), il bengala acceso nelle teche (tre, `vita.fav:286–288`), la tuta indossata (due). Con una procedura,
e con i testi con un nome della 1.5.0 per le frasi copiate, ognuna si scrive una volta sola. Per chi gioca
non cambia niente; serve a chi scriverà ancora nel Relitto (l’inglese della 1.1, per esempio, non ne ha
bisogno: si traduce a valle). Da fare, semmai, insieme alle frasi della 1.5.0 rimaste fuori (documento 16,
§7), in una sola riapertura del testo.

### 6.4 Relazioni e oggetti contabili

Nessun uso sensato nel Relitto com’è: non ci sono cose in più copie, e i rapporti con l’eco, con l’Anziano e
con Yusuf stanno già in pochi stati semplici e leggibili. Potrebbero servire a un contenuto nuovo (per esempio campioni
da raccogliere), che oggi non è previsto.

---

## 7. Che cosa resta da decidere

1. ~~**La lentezza della compilazione** (§5): correggerla nel repository Favella1, in una 1.6.1, e rifare la
   copia.~~ Fatto il 27 ottobre, su sua richiesta (§8).
2. **L’aria fra 0 e 100** (§6.1): una riga nei `.fav`, oppure il visore che non scende sotto lo zero, oppure
   niente.
3. ~~**Pubblicare la 1.6.1** come le versioni di prima.~~ Fatto il 27 ottobre, su sua richiesta: la Release
   «FAVELLA 1.6.1» con i tre installer e le note del CHANGELOG (l’ultima versione su GitHub), `favella1` 1.6.1
   su PyPI (provato installandolo da zero), il manuale PDF che dice v1.6.1, e favella.eu alla 2.12.1, con il
   motore 1.6.1 nel browser, i download, la notizia e il changelog.
4. Il resto del §6 resta dov’è, finché il testo non si riapre.

---

## 8. La 1.6.1 (27 ottobre 2026)

L’autore ha chiesto di correggere la lentezza nel repository Favella1 e poi di aggiornare la copia.

- **La correzione**, in `compilatore.py` (commit `a520134` di Favella1, tag `v1.6.1`): il nome di un oggetto
  contabile si prova solo dove può cominciare un tratto di frase (`(?<![^,.\n])` davanti all’espressione),
  che è proprio la posizione da cui la ricerca trovava già ogni dichiarazione. Le dichiarazioni trovate sono
  le stesse, nello stesso punto e con lo stesso nome: confrontate su 114 file `.fav` (le storie ufficiali,
  la galleria, Il Viaggiatore, il Relitto) e su 20 mila testi costruiti a caso con 54 mila dichiarazioni.
  Le intestazioni dei moduli, ferme alla 1.5.0, dicono 1.6.1; le copie del motore nel sito di Favella1 sono
  risincronizzate. La suite: `test_linguaggio.py` 1.510 su 1.510 (un test nuovo), collaudo 50, pytest 489.
- **I tempi**, alla prima compilazione, quella che l’app paga a ogni avvio:

  | Misura | 1.5.0 | 1.6.0 | 1.6.1 |
  |---|---|---|---|
  | dentro Pyodide, compilazione del Relitto | 0,62 s | 0,93 s | 0,80 s |
  | CPython con il profilatore: la prima passata (la tabella dei simboli) | 15 ms | 101 ms | 22 ms |
  | CPython con il profilatore: la costruzione del parser | 543 ms | 781 ms | 781 ms |
  | CPython, dalla seconda compilazione in poi (il parser è già pronto) | 93 ms | 178 ms | 101 ms |

  Il difetto è chiuso. Quello che resta, circa 0,18 secondi nell’app, è la costruzione del parser LALR della
  grammatica 1.6, più grande: si fa da capo a ogni avvio, perché Pyodide non conserva niente fra un avvio e
  l’altro. Si potrebbe togliere solo con una cache del parser salvata su disco, un lavoro a sé nel motore e
  nell’app; durante la dichiarazione, che è un testo fermo, non si vede.
- **La copia** è rifatta dal tag `v1.6.1` con lo stesso elenco di file; viene con lei anche il manuale
  rigenerato per la 1.6. I collaudi del §4 sono di nuovo tutti verdi, con gli stessi numeri; i sei salvataggi
  veri dell’autore si caricano «identica».
