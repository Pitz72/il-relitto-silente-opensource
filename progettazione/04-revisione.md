# Il Relitto Silente — revisione dopo gli strati 1–5

Versione 1.0, 14 ottobre 2026. Fotografia del gioco al commit `f898d10`.

Rilettura completa dei quattordici moduli e dei tre documenti di progetto, più una serie di
partite-sonda giocate sul motore per verificare ogni sospetto. Il collaudo ufficiale resta verde
(6 finali su 6, esploratore pulito, test del motore 1180 + 50): i problemi qui sotto stanno fuori
dai percorsi scritti, ed è per questo che il collaudo non li vedeva.

Per decisione dell'autore i testi non si cambiano, per ora. Ogni proposta dice se si può applicare
**senza toccare il testo** (si cambia solo una condizione o una conseguenza) oppure se richiede
una frase nuova, che resta in attesa.

Niente di questo documento è stato applicato.

---

## 1. Codice e gameplay

Tutti i punti di questa sezione sono riprodotti su una partita vera, salvo dove è detto.

| # | Gravità | Problema | Dove | Correzione proposta | Testo |
|---|---|---|---|---|---|
| C1 | **Alta** | Il risuonatore, una volta posato, non si riprende più: «Non puoi prenderlo.» | `ingresso.fav:224` | Nel terzo taglio aggiungere `e adesso il risuonatore è prendibile` (il `prendibile` dinamico c'è dalla 1.3) | invariato |
| C2 | Media | Si muore prima della fuga senza il risuonatore, contro la decisione D6 | `vita.fav:249-250` | Da decidere (§1.2) | dipende |
| C3 | Media | Si può morire nella stiva della Santa Maria, al sicuro, appena entrati | `aria.fav:39-41` | I consumi della fuga saltano la stiva: `… e il giocatore non è nella stiva` | invariato |
| C4 | Bassa | Le soglie dell'aria arrivano un turno dopo, e con la cifra sbagliata, quando l'aria la toglie un demone di un modulo successivo | `aria.fav:44-47` | Spostare le quattro soglie in un modulo incluso dopo `echi.fav` e prima di `finali.fav` | invariato |
| C5 | Bassa | La connessione della gola di mezzo scatta anche con il risuonatore in mano, che per regola copre ogni eco | `ingresso.fav:250` | `… e il giocatore non ha il risuonatore` nel demone | invariato |
| C6 | Bassa | Disco, stele e nucleo, posati e ripresi altrove, ripetono il testo della prima presa | `memoria.fav:66, 108, 155` | Legare le tre regole al posto d'origine (`se il disco è nello scriptorium`, ecc.): altrove vale il «Preso» del motore | invariato |
| C7 | Bassa | Dal vivaio si torna alla gola di mezzo senza passare il groviglio: costa solo il −4 dell'avvicinamento | `vita.fav:260` | Da decidere: il passaggio è sorvegliato solo verso ovest | dipende |
| C8 | Bassa | Prima della fuga le uscite della sala delle teche elencano «Est», che è chiusa | `relitto.fav:120`, `vita.fav:257` | Uscita dinamica: si crea nel demone d'inizio fuga, come il varco della camera | invariato |
| C9 | Bassa | Due stati scritti e mai letti: `gli echi` (dodici scritture) e `l'ultima voce` | `echi.fav`, `ponte.fav:203` | Toglierli, oppure dare a `gli echi` il lettore previsto (§1.3) | dipende |

### 1.1 Come si riproducono

- **C1.** Dal vestibolo: `stacca il risuonatore` tre volte, `lascia il risuonatore`, `prendi il
  risuonatore`. Il motore risponde «Non puoi prenderlo.». Il §5.3 della mappa dice che il
  risuonatore si lascia dove si vuole e si perde solo se lo si lascia fuori dal percorso della
  fuga: oggi si perde ovunque. Chi lo stacca presto, ne impara il costo e lo posa nel vestibolo per
  riprenderlo nella fuga, al ritorno trova «Puoi vedere qui: un risuonatore» e non può prenderlo.
  Perde «La stiva piena» e «Doppio fondo» senza saperlo.
- **C2.** Dal vestibolo, con l'aria quasi piena e il faro al massimo: `giù`, `giù`, `aspetta`, e
  poi `giù` + `aspetta` a ripetizione. Il groviglio si avvicina (−4), afferra e respinge (−8):
  dodici punti a giro. Dopo otto giri la partita finisce in «Due lettere» con la fuga ancora
  lontana. Si arriva a zero anche toccando a ripetizione le venature del vestibolo (−1) o il
  risuonatore incastrato (−1, −2 per `prendi`).
- **C3.** Nella fuga, arrivare sullo scafo con l'aria a 4 ed entrare. Il consumo della fuga scatta
  nel turno d'arrivo e porta l'aria a 0 prima che il finale controlli «l'aria è più di 0»: scatta
  «Due lettere» nella stiva della propria nave («Ti siedi. La schiena trova una parete…»). Lo
  stesso meccanismo, con l'aria più alta, fa comparire la soglia rossa («Adesso la tuta non ti
  protegge più da niente») un istante prima del risveglio: lo si legge in fondo a
  `collaudo/trascrizione-tutto.txt`.
- **C4.** Nella partita di C2 il visore annuncia «la cifra passa all'ambra: 58» quando l'aria è
  già a 50. Le soglie sono in `aria.fav`, il primo modulo; il groviglio, il primo contatto e la
  connessione tolgono aria da demoni dichiarati più avanti, che le soglie non vedono fino al turno
  dopo. La correzione dello strato 5 vale solo per i consumi di `aria.fav`.
- **C5.** Con il Sintonizzatore preso, staccare il risuonatore nel vestibolo e scendere nella gola
  di mezzo con l'arnese in mano: la voce dei nomi parte lo stesso.
- **C6.** `lascia il disco`, `prendi il disco` in qualunque stanza: «Liberi il disco di pietra
  incastrato nel meccanismo del proiettore…». Stele: «Prendi la Stele del Ricordo dallo scomparto.
  […] La seconda chiave.». Nucleo: «…dallo scomparto del terminale. La terza chiave.».
- **C7.** Nel vivaio con il faro al massimo: `est`, `su`. Si arriva nella gola di mezzo con quattro
  punti in meno. All'andata il groviglio «ti si stringe davanti»; al ritorno, lungo la stessa sala,
  non c'è.

### 1.2 Le due decisioni

**C2, la morte prima della fuga.** La decisione D6 dice che si muore solo nella fuga o portando il
risuonatore, e il `03` la dà per verificata. Per gli ascolti è vero (la protezione vitale li ferma
al 30%), per il groviglio no. Le strade:

1. accettarlo e correggere D6: morire nelle teche, dove L.V. ha perso il cavo, è coerente, e il
   finale ha già la variante `[se il giocatore è nella sala delle teche]`;
2. sotto il 30% il groviglio respinge ma non beve. Serve una variante del testo della presa, che
   oggi dice «è scesa di otto punti».

**C7, il ritorno dal vivaio.** O è voluto (chi è arrivato al vivaio ha già capito come si passa),
oppure il gating su `ovest` va replicato, con la stessa logica, sull'uscita `su` per chi viene dal
vivaio. La seconda strada chiede un modo di sapere da che parte si entra: uno stato in più.

### 1.3 Gli stati senza lettori

L'audit A2 dell'originale («echi e risonanze crescono e nessuna regola li legge») è dato per
chiuso nel `03`, ma lo è solo per `le risonanze`. `gli echi` arriva a 14 e nessuno lo legge: la
mappa (§11) prevedeva una battuta dell'Anziano sopra 8. `l'ultima voce` si scrive nell'ultimo nodo
del dialogo e non si legge da nessuna parte. Neanche la variante di «Vivi» con quattro o più
tracce (§7.3 della mappa) è stata scritta: `le tracce` si legge una volta sola, `almeno 3`.

---

## 2. Storia

La cronologia regge: 14 marzo 2105 più novantasei anni fa 2201; L.V. intorno al 2050;
«centocinquant'anni» torna uguale nella giuntura, nel cavo, nel cadavere, nella placca e nel
finale. La regola del nome è rispettata: «William» lo dicono solo Yusuf, il registro e le righe
che chiudono i finali.

| # | Peso | Problema | Strade possibili |
|---|---|---|---|
| S1 | **Alto** | **Il cavo di L.V.** Quando entri, la nave richiude il varco e ti trancia il cavo alla prima stanza. L.V. è entrato dalla stessa giuntura («qualcuno ha già aperto qui, e la nave ha richiuso»), quindi il suo cavo doveva tranciarsi lì. Invece lo trovi nella sala delle teche, quattro stanze più giù, «attaccato alla sua linea», e il diario dice che gliel'hanno preso i filamenti | (a) il suo era un filo guida srotolato dentro la nave, non il cavo di sicurezza: cambia un nome e una riga; (b) centocinquant'anni fa la nave non richiudeva: il varco si è chiuso dopo la sua morte. Regge senza toccare il testo, ma allora perché con te lo fa subito? (c) lasciarlo com'è, come contraddizione voluta del racconto |
| S2 | Medio | **La nave di L.V.** È arrivato con la sua nave, finita addosso alla massa. Della nave non resta traccia: lo scanner non la vede, nessuno la nomina. È la prima domanda che si fa chi ha letto la placca | Una riga di scanner o di registro (alla deriva, cannibalizzata dalla massa), oppure un gancio lasciato aperto di proposito |
| S3 | Basso | «Due lettere» nella fuga promette che «fra centocinquant'anni, forse, qualcuno passerà di qui», ma la nave si sta disgregando e negli altri finali «non c'è più» | Una variante `[se la fuga è iniziata]`, oppure va bene così: il lettore la prende come speranza, non come fatto |
| S4 | Basso | Morire sullo scafo, fuori, nella fuga: «La schiena trova una parete» | Una variante per lo scafo (con C3, l'unico posto in cui la frase non funziona) |
| S5 | Regge | **L'energia.** L'Anziano dice che la nave non aveva forza per rispondere a L.V., eppure senza energia richiude il varco e apre un canale «da remoto» sul tuo Sintonizzatore. Regge per deduzione: il risuonatore beve dalla batteria di chi passa, e il canale passa dal Sintonizzatore, che L.V. non ha mai trovato | Niente da fare. Se un giorno serve, una riga dell'Anziano può renderlo esplicito |

S1 è l'unico punto che un lettore attento nota da solo, perché il gioco gli fa vivere la scena del
cavo tranciato prima di mostrargli quello di L.V.: è la stessa immagine messa due volte apposta (vedi
`02`, §3, punto 5), e le due volte non tornano.

---

## 3. Collaudo e documentazione

| # | Problema | Proposta |
|---|---|---|
| D1 | `collaudo/tutto.txt` dice di ascoltare «le 21 voci», ma salta il corridoio (quattro voci in una) e le capsule: chiude con `echi=9` su 14. Rifatto con le due voci mancanti, finisce comunque in «La prima nota», con l'aria a 21 invece che a 29: l'invariante I2 regge, con meno margine | Aggiungere i due ascolti al percorso e aggiornare il §4.2 del `03` |
| D2 | Il `03` (§4.2, I4) e la decisione D6 dicono che prima della fuga non si muore: vale per gli ascolti, non per il groviglio (C2) | Correggere dopo la decisione su C2 |
| D3 | Il `03` (§4.4, A2) dà per chiusi gli stati mai letti: resta `gli echi` (C9) | Correggere con C9 |
| D4 | L'intestazione di `ponte.fav` dice «Tredici nodi», il dialogo ne ha quattordici | Un commento |
| D5 | Il collaudo dei finali e l'esploratore non trovano C1 (le partite a caso non posano e riprendono gli oggetti) né C3 (serve arrivare in stiva con l'aria esatta) | Un percorso per ciascuno in `collaudo/`, da tenere come prova di non regressione dopo le correzioni |

---

## 4. Ordine consigliato

1. **C1**: una conseguenza, nessun testo. È l'unico problema che toglie finali a chi gioca bene.
2. **C3, C4, C5, C6, C8**: condizioni e spostamenti, nessun testo. Con i percorsi di D5 e D1.
3. **C2 e C7**: decisioni dell'autore.
4. **S1**: decisione dell'autore; la (a) chiede due righe di testo.
5. **C9, S2, S3, S4**: testo nuovo, quando si riaprono le frasi.
