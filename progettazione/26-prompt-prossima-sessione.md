# Prompt per la prossima sessione (26)

> **Superato dal 27** (`progettazione/27-prompt-prossima-sessione.md`, 19 ottobre 2026, mattina).

Sostituisce il 23. Scritto il 19 ottobre 2026, a fine sessione, su richiesta dell’autore: «memorizza dove siamo arrivati e prepara la prossima sessione al completamento di questo programma», cioè della revisione totale (documento 25).

## Il prompt

Riprendiamo «Il Relitto Silente». Carica la memoria del progetto, poi leggi questo documento e il **documento 25** (`progettazione/25-revisione-totale.md`): il §8 è l’ordine consigliato, il §9 il registro di ciò che è già corretto, commit per commit. Il resto si legge quando serve: `sviluppo/STRUTTURA.md` (la mappa e i comandi), `sviluppo/VERSIONI.md` (§7: aggiornamento automatico, canali, chiave di firma), `CHANGELOG.md` (il «Non rilasciato» elenca tutte le correzioni).

**Come si lavora (regole fisse dell’autore):**

- **L’autore è ipovedente.** Faccio io ogni passo, dall’inizio alla fine: niente elenchi di passi manuali, niente comandi da scrivere a mano, niente pagine di impostazioni da navigare. Le sole cose che non faccio io sono caricare chiavi, password o token su un servizio online: per quelle preparo uno script, gli lascio **un solo comando** in un blocco `bash` (il pulsante Esegui), dico in una riga che cosa fa, e poi verifico io il risultato. Il suo terminale lo leggo io, con `read_terminal`. Risposte brevi.
- **Dopo ogni commit si fa push** su `origin main`, senza mai forzare, e `git status -sb` deve dire `main...origin/main`. Un commit per correzione, con la voce nel CHANGELOG e la riga nel §9 del documento 25.
- **Le prove su GitHub** (`.github/workflows/prove.yml`) partono a ogni push che tocca il gioco o l’app, e devono restare verdi: si controlla l’esito con `gh run list` e `gh run watch`. Un push ne annulla un’altra in corso: per verificare un lotto basta l’ultima.
- **Il suono resta sintetizzato nel motore, la musica è fatta di file, i `.fav` sono congelati.** La musica è fantascienza, mai giallo.

## Dove siamo (19 ottobre 2026, notte)

Versione **0.2.3** (nessuna consegna nuova dopo la revisione). Ultimo commit `29633b8`, cartella e GitHub allineati, prove su GitHub verdi.

**La revisione totale** ha trovato 0 criticità gravissime, 5 gravi, 10 medie, 15 lievi e 10 proposte per l’estetica. **Fatte e su GitHub**, ognuna con le sue prove:

- **tutte le gravi**: G1 (le misure tecniche fuori dalla pausa), G2 (annullare un finale non spegne più il mondo), G3 (l’aggiornamento legge il canale fisso `aggiornamenti`, non la «Latest» del vecchio gioco), G4 (chiave di firma nuova con password: chiave in `C:\Users\Utente\.relitto-signing\`, password **solo** in `F:\Backup\Relitto-chiavi-firma-2026-10-19\`, i due Secrets su GitHub), G5 (le prove a ogni push, il rilascio solo a prove verdi, Linux fuori finché non è provato: variabile `LINUX_PROVATO`);
- **le medie** M2 (il «chiudi» delle Opzioni), M4 (il mondo sonoro ricampiona se cambia il dispositivo), M5 (il disco e la memoria della musica fuori dal thread audio), M6 (uscendo la partita va nel posto automatico; i tasti del browser bloccati), M7 (una via d’uscita dagli errori), M8 (un comando che cade non lascia la partita a metà), M9 (i salvataggi: cartella di ripiego, scrittura su disco, versione di prima del posto automatico);
- **le lievi** L1–L4 (refuso, riconoscimenti di lark, README, CHANGELOG), e L12 per la parte dei salvataggi.

**Una decisione aspetta l’autore:** `panic = "unwind"` nel rilascio (oggi `abort`). Con `unwind` una caduta del thread audio lascia il gioco muto invece di chiuderlo; misurato, l’eseguibile passa da 5,6 a 9,5 MB. Documento 25, M4 e §9.

## Il lavoro, in ordine

1. **Prima di tutto, una domanda all’autore:** la **consegna 0.2.4** da provare prima di andare avanti (consigliata: dalla 0.2.3 non ha più provato niente, e il suono è cambiato) oppure subito il lotto successivo. La consegna: `node strumenti/versione.mjs prepara patch`, il commit «chore(versioni): 0.2.4», poi l’eseguibile di ascolto con la console di regia (`RELITTO_REGIA=1`, vedi `sviluppo/STRUTTURA.md` e le consegne precedenti in `consegne/`, «… (regia)»), le prove `python strumenti/prova_eseguibile.py finali` e `salvataggi`. Da fargli provare: le Opzioni, morire e «annulla», le cuffie collegate a metà partita, chiudere con la X e riprendere con «Continua», la modalità a solo testo.
   **Fatta il 19 ottobre 2026, su sua scelta:** `consegne/Il Relitto Silente 0.2.4+7f32a1a (regia)/` (l’installazione e la portatile; nella portatile non ci sono più i vecchi campioni del prototipo, rimasti nella cartella di costruzione: il gioco non li usa e l’installazione non li porta). Nell’eseguibile riuscite le prove dei sei finali, dei salvataggi e del mondo sonoro, anche sulla copia portatile. Si aspettano le sue note.
2. **Il lotto delle prestazioni e della leggibilità:**
   - **M1**: il motore Python blocca il disegno dei loghi (due blocchi da 0,7 e 0,8 s). Subito: far partire `avviaMotore()` alla fine dei loghi, durante la dichiarazione (`Relitto.tsx`). Poi, da valutare: Pyodide in un Web Worker.
   - **M3** con **E5** ed **E10**: a 1280 × 720 (un 1080p al 150 %) tasti delle uscite a 8,5 px, attrezzi a 10,4 px, didascalie del visore a 10,5 px; sotto quella misura le etichette del filo basso escono dallo schermo. Un pavimento di 12 px per ogni testo che si tocca o si legge; le etichette dei gruppi sopra il filo, o via.
   - **M10**: misurare nell’eseguibile CPU e GPU dei cicli di disegno (vene, lente, cellula, oscilloscopio) nel relitto, nella fuga e con l’Anziano; se serve, 30 fotogrammi al secondo e i colori letti una volta per clima.
3. **Le lievi tecniche rimaste:** L7 (il percorso della cartella di lavoro dentro l’eseguibile: ripiego della musica solo in sviluppo, `--remap-path-prefix`), L8 (il lampo dello schermo intero con l’opzione «finestra»), L9 (la lamina che non si riallinea quando cambia la finestra), L10 (la perdita del contesto WebGL), L11 (i nomi dei rapporti con «:»), L12 (i comandi audio ancora sincroni), L13 (il codice di prova nel pacchetto, `Gioco.tsx` da dividere, i doppioni), L14 (dipendenze e azioni fissate), L15 (l’avanzamento e le note dell’aggiornamento).
4. **Le decisioni dell’autore**, una per volta, con la raccomandazione: `panic = "unwind"`; L5 («Favella1» nella dichiarazione); L6 (il titolo del libro in corsivo); il piano di **E1** (le viste delle 22 stanze senza immagine: quante fotografiche per la Santa Maria, quante scansioni in codice per il relitto).
5. **L’estetica**, nell’ordine del documento 25 §6.2: **E2** (una schermata per il finale) ed **E3** (il marchio nel menu e nei riconoscimenti) per prime; poi E4 (la modalità scritta che usa lo spazio), E6 (i pannelli), E7 (lo schermo 16:10), E8 (la regola delle due famiglie di immagini), E9.
6. **Le cose in sospeso da prima della revisione** (prompt 23): le note dell’autore dopo l’ascolto; la musica dell’intro (`I-B`, `I-E`, `I-G`, la genera lui con Lyria); il tema `T-01`/`T-02`, non collegato; la copertina (D42–D44 del documento 24); i dati del registro della musica (prompt, piani di Flow Music e di Suno); Linux su una macchina vera (poi `LINUX_PROVATO`); la partita intera giocata a mano; l’inglese con la 1.1.
7. **Il primo rilascio** quando l’autore lo decide: la strada è in `VERSIONI.md` §7 (due pre-release di fila per provare l’aggiornamento, poi la prima versione normale).
