# Il Relitto Silente — strato 2: Atti I e II

Versione 1.0, 14 ottobre 2026. Segue `01-mappa-espansione.md` (v0.3).

> Le incoerenze temporanee del §6 sono state chiuse negli strati 3 e 4, e i valori d'aria del §4
> sono stati ritarati nello strato 5: vedi `03-strati-3-5.md`.

Gli Atti I e II sono scritti, implementati e collaudati. Il testo definitivo è nei file del gioco,
che restano l'unica fonte. Per leggerlo come lo vede chi gioca c'è la trascrizione:
`collaudo/trascrizione-atti-I-II.txt`.

---

## 1. Cosa c'è

| | Prima | Dopo lo strato 2 |
|---|---|---|
| Stanze | 15 | 19 (Cuccetta, Sala macchine, Vestibolo delle gole, Gola di mezzo) |
| Oggetti | 50 | 77 |
| Percorso vincente | 54 comandi | 60 comandi (la vittoria è ancora quella dell'originale) |
| Finali | 1 | 2 («Due lettere» è nuovo) |

File nuovi in `relitto-silente/`:

| File | Contenuto |
|---|---|
| `aria.fav` | Il margine: contatore, visore, soglie (60, 30, 15), consumo del risuonatore |
| `santamaria.fav` | Atto I: Plancia, Cuccetta, Sala macchine, Stiva; Yusuf; tuta, faro, cella |
| `ingresso.fav` | Atto II: Scafo, Camera, Vestibolo, Gola di mezzo; risuonatore; primo contatto; connessione |
| `finali.fav` | «Due lettere» |

File modificati: `relitto.fav` (riscritto: titolo, prologo, direzioni, topologia, moduli),
`stanze.fav` e `oggetti.fav` (tolte plancia, stiva, scafo e camera; direzioni nuove nei testi delle
stanze dell'Atto III), `regole.fav` (gating con le direzioni nuove), `echi.fav` e `traduci.fav`
(costi d'aria e protezione vitale). Tutti i file del gioco sono passati da fine riga CRLF a LF.

---

## 2. Le stanze

### Atto I — Il margine

**Plancia** (inizio). Uscite: ovest → Stiva, nord → Cuccetta.
Stati letti: `SCANSIONE` (assente / completa), `AGGANCIO` (lontano / accostato / fatto). Quattro
descrizioni, una per fase della manovra.
Essenziali: comandi di manovra, lanciarpioni, radio. Sfondo: oblò principale, nave aliena, quadro
di prossimità, quadrante del margine, faro di prua.
Enigma N1: `analizza la nave aliena` → `accosta` → `spara gli arpioni`. Ogni tentativo fuori
ordine ha la sua risposta e indica il verbo giusto.
Yusuf (personaggio di scena, alla radio): cinque nodi. «Ho trovato una cosa» compare solo dopo la
scansione e fissa `PROMESSA = carico`. «Volevo sentire una voce» è una scelta di carattere,
dichiarata come tale.

**Cuccetta**. Uscite: sud → Plancia.
Essenziali: registro di bordo (non si prende: «il registro non lascia la nave»), chiavetta (compare
leggendo il registro). Sfondo: branda di sopra, armadietto, oblò piccolo.
Il registro porta la data di canone (14 marzo 2105), i novantasei anni di nave e la firma
«W. T. Eriksonn»: è uno dei tre posti in cui il nome compare.

**Sala macchine**. Uscite: su → Stiva.
Essenziale: cassetta di ferraglia (chiusa a chiave; dentro il bengala e l'amplificatore di firma,
omaggio a *Undici Chili*). Sfondo: reattore.
`ascolta il reattore` fissa `NOTA = reattore`: prima metà della variante segreta «La prima nota».

**Stiva**. Uscite: est → Plancia, giù → Sala macchine, fuori → Scafo (servono tuta indossata e
aggancio fatto).
Essenziali: tuta, kit (taglierina, batteria), cella di riserva. Sfondo: ganci, rastrelliera,
lettore con *Castello di Ghiaccio*, boccaporto.
`indossa la tuta` dà il visore e il faro del casco. La cella (+25) si rifiuta sopra il 75%.

### Atto II — Il brusio

**Scafo**. Uscite: dentro → Stiva, giù → Camera (solo a giuntura tagliata).
La giuntura non c'è finché non `analizza lo scafo nero`. `analizza la giuntura` dà la traccia T1: il
taglio di centocinquant'anni fa.
Per entrare valgono `giù`, `scendi`, `entra nel varco`; per tornare `dentro`, `rientra`.

**Camera di compensazione**. Uscite: ovest → Vestibolo (porta interna aperta).
Al primo ingresso la nave richiude il varco: l'uscita in alto sparisce davvero dalla topologia e il
cavo di sicurezza resta tranciato alla cintura (lo specchio, in anticipo, del cavo di L.V.).
Il pannello si accende con la batteria; senza batteria, con la tuta (−10 aria).

**Vestibolo delle gole**. Uscite: est → Camera, ovest → Corridoio, giù → Gola di mezzo.
Primo contatto (una volta): il brusio, la cifra che scende di due punti, la mano che si stacca.
Essenziale: il risuonatore. Sfondo: nicchia, gole (eco di superficie, serve il Sintonizzatore),
venature spente (toccarle costa un punto).
N3: tre `stacca il risuonatore` con la taglierina. Poi consuma aria a ogni turno e copre gli echi.

**Gola di mezzo**. Uscite: su → Vestibolo.
Con il Sintonizzatore (dal Laboratorio, Atto III) parte la connessione che non si spegne (−3, una
volta, solo con l'aria al 30% o più).
Temporaneo: `giù` è chiuso da un nodo di fibre finché lo strato 3 non porta la Sala delle teche.

---

## 3. Decisioni prese scrivendo

1. **Sfondo e oggetti essenziali** (indicazione di Simone). Lo sfondo è `di scena` e vive solo nella
   descrizione della stanza; gli oggetti che servono li elenca il motore in «Puoi vedere qui», e la
   descrizione non li nomina. Vale da qui in avanti per tutto il gioco.
2. **Direzioni**. Solo punti cardinali, su e giù, e `dentro`/`fuori` per il boccaporto («esci» e
   «entra» li capisce il motore). Corridoio: ovest Ponte, nordest Alloggio, giù Laboratorio, est
   Vestibolo. Ponte → Anticamera → Santuario: ovest. Il gating usa «se il giocatore è in…».
3. **«Entra» è un verbo, non una direzione.** Sullo scafo il motore avrebbe letto «entra nel varco»
   come `dentro`, cioè di nuovo a bordo. Con `entra` e `rientra` dichiarati come comandi, «entra nel
   varco» porta nel relitto e «rientra» sulla Santa Maria.
4. **Niente vicoli ciechi all'ingresso.** Nell'originale chi entrava senza batteria restava chiuso
   nella camera. Ora il pannello si alimenta anche con la tuta, a caro prezzo d'aria.
5. **Il cavo tranciato.** Quando il varco si richiude, il cavo di sicurezza si taglia. Chi trova il
   cavo di L.V. nella Sala delle teche (strato 3) vedrà la stessa cosa.
6. **I segni della nave.** Il gemito ogni nove turni, sempre uguale, diventa tre segni diversi, rari
   (circa uno ogni dodici turni), e solo dentro il relitto.
7. **Le uscite non dicono i nomi dei luoghi mai visti.**
8. **Tipografia nei file del gioco.** Il compilatore trasforma gli apostrofi curvi in dritti anche nel
   testo, e le virgolette dritte sono la sintassi delle stringhe: nei `.fav` gli apostrofi restano
   dritti. Caporali, `…` e `—` restano come nel volume. Mai virgolette curve doppie, che
   romperebbero le stringhe.

---

## 4. L'aria, come funziona adesso

Implementata per intero, salvo la fuga e la ricarica al generatore (strati 4 e 3).

| Cosa | Costo |
|---|---|
| Primo contatto nel Vestibolo | −2, una volta |
| Connessione nella Gola di mezzo | −3, una volta |
| Eco di superficie (9 àncore, gole comprese) | −4 |
| Eco profonda (4 àncore) | −6 |
| Traduzione (16 letture a soglia) | −1 |
| Risuonatore: mano sulla nicchia −2, ogni taglio −1, portarlo −1 a turno | |
| Pannello alimentato con la tuta | −10 |
| Cella di riserva | +25, una volta |

Protezione vitale: sotto il 30%, prima della fuga, ogni eco e ogni traduzione risponde con
PROTEZIONE VITALE. Con il risuonatore addosso ogni eco risponde che il coro copre le voci.

---

## 5. Collaudo

| Prova | Esito |
|---|---|
| Compilazione | 19 stanze, 77 oggetti, nessun avviso |
| `collaudo/soluzione.txt` | vittoria in 60 comandi |
| `collaudo/due-lettere.txt` | sconfitta «Due lettere» in 113 comandi; soglie 60, 30, 15 annunciate |
| `collaudo/prova-atti-I-II.txt` | 102 comandi, ogni oggetto e ogni ramo di Yusuf, nessuna eccezione |
| Esploratore (24 partite a caso, ~5.000 comandi) | 19/19 stanze visitate, 0 anomalie |
| Verifica tipografica dei file nuovi | pulita: nessun `...`, caporali bilanciati, nessun avverbio in -mente |

Strumento nuovo: `collaudo/trascrivi.py` gioca un percorso e scrive la trascrizione.

```bash
python collaudo/trascrivi.py relitto-silente/relitto.fav collaudo/prova-atti-I-II.txt -o collaudo/trascrizione-atti-I-II.txt
```

---

## 6. Incoerenze temporanee (si chiudono negli strati 3 e 4)

Il gioco è giocabile dall'inizio alla fine, ma dal corridoio in poi è ancora l'originale. Per questo:

- L.V. è ancora nell'Arca biologica, morto «~847 anni fa», con la placca che spiega tutto (strato 3).
- La tavoletta è ancora nella Serra, accanto alla teca (strato 3).
- La Gola di mezzo non scende ancora alla Sala delle teche (strato 3).
- L'eco del Capitano parla di Dio e di «portare a casa» (strato 3, audit A7).
- L'alias «tre punte» rivela ancora la soluzione della porta circolare (strato 4, A3).
- L'epilogo dell'Anziano parla delle «casse della stiva», che ora è vuota, e l'Anziano è ancora
  certo e non spera (strato 4).
- Alcuni testi dell'originale hanno ancora `...` e uno spazio prima della punteggiatura (si
  sistemano quando quei testi vengono riscritti).

---

## 7. Prossimo strato

Strato 3, l'Atto III un'ala alla volta. Proposta d'ordine:

1. **Ala della Vita**: Sala delle teche e Vivaio, L.V. nella Serra, tavoletta spostata,
   filamenti, bengala, cavo spezzato. È l'ala che chiude più incoerenze.
2. **Ala Tecnica**: ricarica al generatore, voce dei nomi collegata all'Ingegnere.
3. **Ala dell'Equipaggio**: Nido, eco del Piccolo, sonaglio.
4. **Ala della Memoria**: disco da orientare, nucleo con la via della pazienza.
