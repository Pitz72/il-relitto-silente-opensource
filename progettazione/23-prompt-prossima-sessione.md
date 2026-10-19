# Prompt per la prossima sessione (23)

**Superato dal 26** (19 ottobre 2026): resta come storia. Sostituiva il 17. Scritto il 16 ottobre 2026, a fine sessione, su richiesta dell’autore: «nella prossima sessione cerchiamo di rimettere ordine».

## Il prompt

Riprendiamo «Il Relitto Silente». Carica la memoria del progetto, poi leggi `README.md` (la facciata pubblica), `sviluppo/STRUTTURA.md` (la mappa e i comandi, ex README), `sviluppo/VERSIONI.md`, `LICENZE.md`, `progettazione/22-musica-con-lyria.md` (la musica generata, la regola dell’integrazione §7.1) e `audio/musica-ia/REGISTRO.md`. Il documento 21 resta la **mappa** della musica (che cosa suona dove); il 17 è sostituito da questo.

**Come si lavora (regole fisse dell’autore):**

- **Dopo ogni commit si fa push** su `origin main`, senza mai forzare, e si controlla che `git status -sb` dica `main...origin/main` senza avanti né indietro. La cartella locale e GitHub restano sempre sincronizzate. Se un push grosso va in timeout (HTTP 408), si spinge a tratti di cinque commit con ripetizioni.
- **In git restano solo gli MP3 che il gioco usa** (17 in `audio/musica-ia/<sigla>/`); gli originali, le alternative e le anteprime (`originali/`, `anteprime/`) stanno fuori da git, in locale e nel backup.
- **Il backup** è in `F:\Backup\` (cartella con la data, senza `old_version/`, `node_modules`, `target`, `dist`); ne fa fede il `LEGGIMI-BACKUP.txt` che c’è dentro.
- **La musica è fantascienza**, mai giallo: un brano fallito si rifà con un prompt a partitura (documento 22, §5.7). Gli MP3 sono la base: i miei strati sintetizzati integrano solo dove serve e dopo il suo ascolto (§7.1).
- Il suono resta sintetizzato nel motore; **la musica è fatta di file**; **le voci le registrerà lui con il TTS di Google**, in seguito.
- Le decisioni si propongono **una per volta**, con la raccomandazione, e la risposta si scrive nel documento che la riguarda.

## Stato al 16 ottobre 2026, sera

- **Il repository** è su GitHub, `Pitz72/il-relitto-silente-opensource`, ramo `main` predefinito; il vecchio gioco sta in `old_version/` con la sua storia e i tag. Licenza: **MIT per il codice, CC BY-NC-SA 4.0 per storia, testi, immagini e musica** (`LICENZE.md`). Il remake **parte dalla 1.0.0** (due programmi diversi). README pubblico, descrizione e argomenti impostati.
- **Il gioco** è alla 0.2.0 (fase 3 quasi chiusa); l’ultima consegna (`0.2.0+c1836f6`) è **anteriore** al suono. Il suono è fatto e approvato. Le prove del gioco non sono state rilanciate dopo il lavoro sulla musica (si è toccato solo audio e documenti).
- **La musica**: ogni scheda ha un file (documento 22 e registro), scelto **sulle misure, non all’ascolto**; nel gioco non è ancora collegata (il motore suona ancora quella sintetizzata del documento 21).

## Prima di tutto: che cosa vuol dire «rimettere ordine»

Si chiede all’autore, in una domanda, che cosa intende. Candidati, dal lavoro di oggi:

1. **I documenti**: `sviluppo/STRUTTURA.md` elenca i documenti solo fino al 21; i prompt vecchi (07, 11, 13, 15, 17) sono superati; il CHANGELOG, il registro delle licenze dei suoni (`audio/LICENZE.md`) e i riconoscimenti non conoscono ancora la musica generata.
2. **Il registro della musica**: per quasi ogni brano mancano il prompt esatto, il piano e la strada (A prompt, B con la traccia guida); per Suno, se Pro o Premier.
3. **La repo**: la storia di git conserva ancora gli originali caricati e poi tolti (circa 45 MB di MP3); una riscrittura della storia dei soli commit della musica sarebbe possibile, ma vuol dire un force-push e va decisa.
4. **Le cartelle di lavoro**: `Il Relitto - backup` (il `.bundle` del 16 ottobre) e il nuovo backup in `F:\Backup\`.
5. **La nota sulle consegne**: nessun installer ha ancora il suono.

## Il lavoro, in ordine

1. **La scheda «Audio» nelle impostazioni** (richiesta dell’autore, 16 ottobre 2026). Una scheda nuova nelle opzioni, con **tre volumi separati**: **effetti** (il suono del mondo, dei pulsanti, del Sintonizzatore), **musica** (oggi il cursore «Musica» già c’è, §9.2 del 06, ed è un solo cursore in mezzo al resto) e **parlato** (le voci: oggi non c’è nulla da regolare, ma serve il canale pronto, perché l’autore **registrerà tutti gli audio con il TTS di Google**, che è un discorso a parte e per dopo). Più il volume generale che c’è già. Salvati con le opzioni, applicati al mixer in Rust (`mondo/mod.rs`: `Mix.musica` e il volume generale), con una prova. Decisione di progetto da scrivere nel documento 06, §9.2 e nel documento 14.
2. **Il lettore di musica nel motore audio**: suona i file di `audio/musica-ia/` (ripetizione senza stacco, dissolvenze incrociate, i quattro letti dell’Anziano `A1`–`A4` mappati sui quattordici nodi, la pausa che abbassa di 10 dB, il silenzio vero a «Resto ad ascoltare», la sala ridotta o saltata perché i file hanno il loro riverbero, `C5` suonata solo dall’ultima metà), tenendo la musica sintetizzata come ripiego. Poi **un ascolto dentro il gioco**, e solo allora le integrazioni sintetizzate del §7.1 (il battito a 54 di `C1`, la seconda onda di `C2`, i tre tocchi di vetro di `C4`, il tritono di `A2`, il tema di quattro note in codice).
3. **Le decisioni pendenti**, una per volta: il documento 18 (la modalità a solo testo, D21–D26); il 19 (la Santa Maria su FAVELLA, senza fretta); il 20 (il Relitto in inglese, D28–D34); il 16, §7 e §8 (le frasi nuove di FAVELLA 1.5.0 nei `.fav`); la copertina e il logo dell’eseguibile; la musica dell’intro e le scene di chiusura; la partita a tastiera. Dal documento 22: D35 (il piano di Flow Music), D36 (la terza 7/6, rinunciata di fatto), D37 (i quattro letti), D40 (Suno: il piano e la dichiarazione).
4. **La riga sull’IA nel gioco** (`riconoscimenti/Dichiarazione.tsx`, testo da far approvare all’autore) e i riconoscimenti della musica (`strumenti/riconoscimenti.py`).
5. **L’aggiornamento automatico** (Tauri: `tauri-plugin-updater`, chiave di firma nei Secrets di GitHub e chiave pubblica in `tauri.conf.json`, `latest.json` sulle Release, flusso di rilascio della fase 9) e **una consegna nuova** con suono e musica.

**Da non dimenticare.** Linux è costruito ma non provato su una macchina vera. I tag del remake non riusano mai 1.2.6, 1.5.1, 1.5.3 (`VERSIONI.md`, §2.1).

## Decisioni prese il 16 ottobre 2026 (seconda sessione) (sessione «rimettere ordine»)

Per «ordine» l'autore ha scelto: i documenti e i registri, e la storia di git.

- **Storia di git: non si riscrive** (niente force-push). Il repository pesa circa 81 MB compressi; il guadagno era piccolo e il rischio alto.
- **Documento 18** (solo testo): sì, nella rifinitura (fase 8).
- **Documento 19** (Santa Maria su FAVELLA): parcheggiata, nessuna fretta.
- **Documento 20** (inglese): sì, con la **1.1**; da subito le stringhe nuove in tabella.
- **Documento 16, §7–§8**: i `.fav` restano congelati.
- **Documento 22, D36 e D37**: confermate (niente terza 7/6; quattro letti A1–A4 per i 14 nodi).
- **Copertina e logo dell'eseguibile**: in fase 9, dopo i pacchetti; l'autore sceglie l'immagine, a Claude un breve con la direzione visiva.
- **Musica dell'intro e scene di chiusura**: aspettano le scene definitive (fase 6); non c'è decisione da prendere.
- **Ancora aperti**: D35 e D40 (il piano di Flow Music e quello di Suno, Pro o Premier: sono dati da dare per il registro, non scelte); la partita intera giocata a mano.
- **Fatto**: STRUTTURA.md aggiornata, prompt 07/11/13/15 segnati superati, regola 3 di `audio/LICENZE.md` aggiornata con la licenza della musica.


## Dove siamo, a fine giornata (16 ottobre 2026, notte)

Dopo quasi venti ore di lavoro, l'autore ha detto basta: si riprende **domani o domenica**. Tutto è su GitHub, la cartella locale e `origin/main` sono allineate, il backup in `F:\Backup` è aggiornato.

**Fatto oggi** (versione **0.2.3**, nel CHANGELOG le voci): il riordino dei documenti e le decisioni (18, 19, 20, 16, 22); la scheda **Audio** con cursori da mixer (effetti, interfaccia, musica, parlato); il **lettore dei 17 MP3**; il **mix d'autore** (`livelli.json`) e la **console di regia** Ctrl+Maiusc+M (solo nelle consegne di ascolto, `RELITTO_REGIA=1`); il **sound design dell'intro**; il **versioning** (una PATCH a ogni consegna); i riconoscimenti e la dichiarazione IA per la musica; l'**aggiornamento automatico** firmato e il flusso di rilascio; la **modalità a solo testo**; il **logo** (approvato) e le **copertine** in cinque formati (il poster ha i credits e il marchio di Runtime Multimedia).

**La consegna da ascoltare**: `consegne/Il Relitto Silente 0.2.3+b906407 (regia)/` (installer e portatile). L'autore non l'ha ancora provata: tutte le sue note sull'audio (livelli dei canali con la console, musica nel gioco, intro) e sulla modalità a solo testo vengono da lì.

**Da fare, in ordine:**

1. **Le note dell'autore dopo l'ascolto**: i livelli del mix (li regola con la console e mi manda il `livelli.json` copiato), la musica nel gioco (le integrazioni sintetizzate del 22 §7.1 solo dopo il suo ascolto), l'intro, la modalità a solo testo (NVDA e l'eseguibile non sono provati).
2. **La musica dell'intro** (`I-B`, `I-E`, `I-G`): i prompt sono nel 22 §5.8, li genera lui con Lyria; il lettore li prende al posto della guida del re.
3. **Il tema** (`T-01`, `T-02`) non è collegato da nessuna parte: decidere dove.
4. **La copertina**: D42–D44 del documento 24 (le copertine in codice ci sono; se vuole un cielo generato da uno strumento, `componi.py` lo usa).
5. **Chiave dell'aggiornamento**: copiare `C:\Users\Utente\.tauri\relitto-aggiornamenti.key` in un posto sicuro e metterla nei Secrets di GitHub (`TAURI_SIGNING_PRIVATE_KEY`). Il flusso di rilascio non è provato finché non c'è il primo tag (una pre-release, per esempio `v0.9.0-beta.1`).
6. **I dati dell'autore** per il registro della musica: i prompt esatti, il piano di Flow Music, il piano di Suno (Pro o Premier).
7. **Linux** su una macchina vera; **la partita intera giocata a mano** (chiude la fase 3); poi l'inglese in 1.1 e **la revisione angolo per angolo** («quando consideriamo il programma di sviluppo concluso»).
