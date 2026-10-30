# Prompt per la prossima sessione (31)

Sostituisce il 28. Scritto il 27 ottobre 2026, nel pomeriggio, quando l’autore ha chiuso la sessione:
«per ora ci fermiamo un momento qui. Poi dalle prossime volte dovremmo riprendere con maggiore ordine».

Questo documento è **il punto di partenza unico**: dove siamo e che cosa viene dopo, in ordine. A fine
sessione si aggiorna qui, e non con note aggiunte in fondo ad altri documenti.

## Il prompt

Riprendiamo «Il Relitto Silente». Carica la memoria del progetto, poi leggi questo documento, e solo
questo. Gli altri si aprono quando il lavoro li tocca (l’elenco è in fondo). Comincia dal punto 1 dell’ordine
del lavoro.

## Le regole fisse dell’autore

- **È ipovedente.** Faccio io ogni passo, dall’inizio alla fine: niente passi manuali, niente comandi da
  scrivere a mano, niente pagine di impostazioni da navigare. Per chiavi, password e token preparo uno
  script e gli lascio un solo comando, poi verifico io. Risposte brevi. Le decisioni una per volta, con
  la mia raccomandazione.
- **Dopo ogni commit si fa push** su `origin main`, senza forzare; `git status -sb` deve dire
  `main...origin/main`. Un commit per lavoro, con la voce nel CHANGELOG; la riga «Per chi gioca» la
  scrivo io, senza la sua approvazione (solo il **grassetto** compare nella finestra delle novità).
- **Gli effetti non si tolgono** (27 ottobre): se costano, si alleggeriscono e si mettono fra le scelte
  della scheda «Grafica» delle Opzioni, tutti accesi di base.
- **Le misure** si fanno senza la lente di Windows: quando gioca la toglie.
- **Prima di aprire l’eseguibile** lo avviso: il gioco gli si apre sullo schermo e gioca da solo.
- **I `.fav` sono congelati**: toccarli è una sua decisione (il 27 ottobre l’aria fra 0 e 100; il 29 tutto il testo
  in prima persona). **William racconta in prima persona**; ogni indizio per chi gioca va fra parentesi
  («Lo scanner saprebbe leggerla. (ANALIZZALA.)»), e le voci degli altri, le scelte e i messaggi del motore
  restano come sono. Una frase cambiata va cercata anche in `app/src/motore/ponte.py` (`SEGNI_A_SORTE`) e nelle
  righe `# atteso` di `collaudo/`.
  La copia del motore in `motore/` non si corregge mai a mano: si rifà da un tag di Favella1.
- **Il nome del motore è «Favella1».** La musica è fantascienza, mai giallo. Il gioco è da scrivania:
  niente impaginazioni da telefono, nessun testo sotto i 12 px.
- Le prove su GitHub (`prove.yml`) devono restare verdi.

## Dove siamo (29 ottobre 2026)

- **La versione** pubblicata è la **0.2.5-beta.6**, una pre-release nel canale di prova
  (`aggiornamenti-prova`): William racconta in prima persona, in tutto il gioco (29 ottobre, su sua
  richiesta: «committa pusha e rilascia. Così lo vedono anche gli altri»). Prima c’era la beta.5 (27 ottobre),
  la prima con la finestra delle novità.
- **La voce, più avanti.** Il 29 ottobre l’autore ha chiesto quanto lavoro sarebbe per **Leonardo Tomassetti**
  (il William del *Mistero della Santa Maria*) leggere il gioco. Divisione come nel Viaggiatore: Leonardo il
  racconto e le scelte (circa 14.500 parole tolti i doppioni, circa 1 ora e 50 di audio, 6–9 ore di sala,
  contro le circa 5.900 parole di William nel Santa Maria); le altre voci (Yusuf è l’autore, l’Anziano, le echi,
  L.V., le traduzioni) circa 2.300; una voce di servizio con la sintesi per i suggerimenti, le percentuali, i
  referti dello scanner e i messaggi del motore, meno di 1.000. Niente è deciso oltre la prima persona.
- **L’intro ha le scene definitive** (29 ottobre, seconda sessione: l’autore ha chiesto di portarla «a livello
  top», con un tocco cinematografico, prima delle altre cose; documento 09, §12). La plancia intera a piena
  risoluzione con la vista fuori dal vivo nell’oblò, il cambio di fuoco vero, il radar a fosforo, il faro che cerca,
  i glifi che si tracciano, e la fine che vola nella lente del gioco mentre la partita parte sotto. È nella
  **0.2.5-beta.7**, pubblicata nel canale di prova la notte del 29.
- **La voce di L.V. e il tema della Santa Maria nell’intro** (notte del 29–30 ottobre; documento 09, §13): la voce
  l’ha generata l’autore con Gemini (voce «Riko»), passata da una trasmittente leggera; il tema è «The Santa Maria Theme» di
  Alirio Bruni. L’intro dura 2:59. Su `main`, non ancora in una beta; l’ascolto è in `consegne/Ascolto intro 2026-10-30/`.
- **Il motore** è Favella1 1.6.1 (documento 29), pubblicata anche su GitHub, PyPI e favella.eu.
- **La revisione totale** (documento 25): i 30 problemi (5 gravi, 10 medi, 15 lievi) sono tutti
  corretti. Delle proposte estetiche sono fatte E1, E5, E6, E9 ed E10.
- **L’interfaccia viva** (documento 30): sono fatti il primo lotto (la grana, la luce della stanza, il
  segnale sui fili, il vetro del casco), i passaggi 2.1–2.5 e la scheda «Grafica», con tre livelli e un
  interruttore per effetto. A gioco fermo la scheda video lavora meno di prima del lotto.

## L’ordine del lavoro (deciso dall’autore il 27 ottobre)

1. **Le sue note sulla beta.5 e sulla beta.6.** Prima cosa: chiedergli come gli sono sembrate nel gioco vero,
   con il suono, e la prima persona, e correggere quello che dice.
2. **Il resto dell’interfaccia** (documento 30):
   - i momenti 2.6–2.9: il cartello d’atto, l’ingresso nella protezione vitale, le crepe della fuga,
     l’ipossia;
   - il lotto 3, le rifiniture;
   - due decisioni sue: E7, la cornice sugli schermi 16:10; E4, la modalità scritta.
3. **L’intro, perfezionata**:
   - ~~le scene definitive~~: fatte il 29 ottobre (documento 09, §12). Prima cosa, le sue note quando la vede
     nel gioco, con il suono: gli aggiustamenti, i titoli di testa «o altro»;
   - ~~la musica~~: il tema della Santa Maria e la voce di L.V. (§13) prendono il posto di `I-B`, `I-E` e `I-G`
     (documento 22, §5.8), che non servono più, se l’autore conferma.
   - **il testo di L.V., rivisto** (30 ottobre: «il discorso del contare»; con stop-slop, humanizer e prosa-italiana).
     Proposto all’autore, da approvare; poi lui rigenera la voce con Gemini e io la rimonto (`VOCE` in `scaletta.ts`),
     e il testo nuovo va nel prologo di `relitto.fav`, in `PROLOGO` di `scaletta.ts` e nella scatola nera di `vita.fav`
     (riga 134). La proposta, per l’intro: «…la spia è verde. Allora registra, o almeno così dice. / L'acqua è finita
     ieri. Il riscaldamento stanotte. Il numero dell'aria lo leggo sul visore e, prima di dirlo, l'ho già perso. Lo
     rileggo: diciannove. / Ho firmato tutte le carte che servivano per partire da solo. Ho insistito io. / Qui dentro
     c'è una cosa viva. Sta dietro un vetro, a mezzo metro da me. La vedo pulsare, e quel vetro non lo so aprire.»
     Per la scatola nera: «Il numero dell'aria lo leggo, e me lo scordo…»; via «ecco la verità», «Il cavo.» ripetuto e
     «davvero».
4. **Il finale** (revisione 25, E2): una schermata vera per il finale, invece della casella che scorre.
   L’autore ha detto «una eventuale finale»: si propone, e decide lui.
5. **Il resto**, dopo:
   - la colonna sonora ufficiale: le sue sette idee e le decisioni da prendere stanno nel documento 28,
     §1, ancora valide;
   - il logo nel menu (E3), la regola delle immagini (E8), la copertina (D42–D44 del documento 24);
   - il tema `T-01`/`T-02` da ricollegare;
   - Linux su una macchina vera;
   - la partita intera giocata a mano;
   - il primo rilascio pubblico, la 1.0: su GitHub prenderebbe il posto della `v1.5.3` del gioco originale;
   - l’inglese, con la 1.1.

## Dove sono le cose

| Documento | Che cosa |
|---|---|
| `sviluppo/STRUTTURA.md` | la mappa del progetto e i comandi |
| `sviluppo/VERSIONI.md` | le versioni, il CHANGELOG, l’aggiornamento automatico e il rilascio (§7) |
| `CHANGELOG.md` | le modifiche, versione per versione |
| `progettazione/25-revisione-totale.md` | la revisione totale; il §9 è il registro delle correzioni |
| `progettazione/29-favella-1-6-0.md` | Favella1 1.6 nel Relitto, la 1.6.1, l’aria fra 0 e 100 |
| `progettazione/30-interfaccia-viva.md` | il programma dell’interfaccia, il registro, la scheda «Grafica», le misure |
| `progettazione/28-prompt-prossima-sessione.md` | il prompt di prima; il §1 tiene i dettagli della colonna sonora |
| `progettazione/09-intro-storyboard.md`, `22-musica-con-lyria.md` | l’intro e la sua musica |
| `strumenti/prova_eseguibile.py`, `strumenti/misure/consumo.mjs` | le prove e le misure nell’eseguibile vero |
