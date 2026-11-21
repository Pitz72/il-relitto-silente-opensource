# 42 · La demo dell’atto I

L’autore, 21 novembre 2026: «possiamo fare una demo in formato EXE del solo atto 1?», e poi: «io voglio una DEMO
dell’atto 1 e basta. Prima di tutto per Leo e poi decido se metterlo sul sito. Se ce la facciamo sia win che Linux
altrimenti solo Win». Fatte tutte e due il giorno stesso.

## 1. Che cos’è

Lo stesso gioco, con l’intro e tutto l’atto I (la Santa Maria, interamente doppiata da Leonardo Tomassetti), che
finisce quando William esce dal boccaporto e mette piede sullo scafo nero: il primo comando che porta nell’atto II
non si mostra né si salva, e al suo posto compare una lastra («Qui finisce la demo: l’atto I, la Santa Maria. Oltre
il boccaporto c’è lo scafo nero, e il resto del Relitto Silente. Grazie di aver giocato.»), con «titoli di coda»;
dai titoli si torna al menu. Il testo dei `.fav` non cambia.

## 2. Come è fatta

- **La pagina in modalità demo** (`vite build --mode demo`): `app/src/demo.ts` (`DEMO`, `ATTO_OLTRE_LA_DEMO = 2`).
  `Gioco.tsx` controlla l’atto dopo ogni comando (l’atto è la stanza più avanti fra quelle viste: `_atto` del ponte;
  lo scafo è il primo luogo dell’atto II); `Relitto.tsx` mostra la lastra (`riconoscimenti/FineDemo.tsx`, lo stile
  della dichiarazione d’apertura), non cerca aggiornamenti, non ha «Cerca aggiornamenti» nel menu né la finestra
  delle novità, e sotto il menu dice «Demo dell’atto I». Nello sviluppo: `npm run dev -- --mode demo`
  (`.claude/launch.json`, «app-demo»), e `?gioco&percorso=vivi.txt&fino=10` apre la stiva pronta a uscire.
- **Un’app a sé** (`app/src-tauri/tauri.demo.conf.json`, scritto da `strumenti/demo/configura.py`): «Il Relitto
  Silente - Demo», eseguibile `il-relitto-silente-demo`, identificatore `….demo` (i salvataggi in
  `Documenti/Il Relitto Silente - Demo`: `salvataggi.rs`, `cartella_documenti`), niente pacchetti di aggiornamento.
- **Le risorse**: fuori le voci che nell’atto I non si sentono (le prese di William degli altri capitoli,
  l’Anziano, le voci della nave, L.V. nella serra, Yusuf nella fuga), con il valore `null` nella merge patch;
  restano le 99 prese dell’atto I, le voci dell’intro e tutta la musica. Il motore audio prende i file che trova.
  `configura.py` va rilanciato quando cambiano le risorse del gioco.

## 3. Come si costruisce

    python strumenti/demo/configura.py
    cd app && npx tauri build --config src-tauri/tauri.demo.conf.json --bundles nsis
    strumenti/linux/costruisci.sh --senza-node --demo        (in WSL, dopo la build Windows: usa la stessa app/dist)

## 4. La prima, del 21 novembre 2026

Sul gioco 0.2.5-beta.15 (`93d6200`), in `consegne/Demo atto I 2026-11-21/` con un `LEGGIMI.txt`:

- **Windows**: l’installatore NSIS, 73,6 MB. Dentro: 280 file audio, le 99 prese dell’atto I, nessuna voce dopo
  l’atto I (letto con 7-Zip). La prova dei salvataggi nell’eseguibile vero (`prova_eseguibile.py salvataggi --exe`)
  riesce: avvio in 5 s, il caricamento «identica».
- **Linux**: l’AppImage, 157 MB, costruita in WSL; stesso contenuto; la stessa prova dei salvataggi, avviata in WSL,
  riesce. Su una macchina Linux vera non è mai stata provata (come il gioco intero: `LINUX_PROVATO`).
- La fine della demo provata nella pagina di sviluppo: «fuori» dalla stiva porta alla lastra.

Non ancora: un ascolto o una partita dell’autore nella demo installata; la decisione sul sito.

## 5. Le note dell’autore sulla prima demo (21 novembre 2026)

L’autore, giocata la demo: «Ottima la demo». Le sue note, fatte lo stesso giorno:

- **«l’unica frase che dice se provi ad entrare nel boccaporto»**: «Il boccaporto porta fuori, nel vuoto: si esce, non
  si entra.» non mancava al copione: è `IN-030`, consegnata da Leonardo il 20 novembre. La regola sta in
  `ingresso.fav` ma vale anche nella stiva, e la demo aveva tolto tutte le prese che non erano dell’atto I. Ora
  restano anche le prese dell’ingresso (IN): si sentono soltanto se a schermo c’è la loro frase.
- **Un cartello prima di ogni cosa**: «Devi mettere un messaggio prima di ogni cosa che questa è una demo, non
  corrisponde necessariamente alla versione finale e molte cose, comprese voci, potranno essere diverse nella versione
  finale. Rappresenta solo il primissimo pezzo del gioco e che serve per valutare la tipologia di gioco e la qualità
  del lavoro.» All’avvio, prima del cartello e della dichiarazione: «Questa è una demo del Relitto Silente. Non
  corrisponde necessariamente alla versione finale del gioco: molte cose, comprese le voci, potranno essere diverse.
  È soltanto il primissimo pezzo del gioco, e serve a farsi un’idea del tipo di gioco e della qualità del lavoro.»
  (`FineDemo.tsx`, `quando="avvio"`).
- **«il menu deve avere solo gioca, vai al sito, esci. Niente carica, niente continua»**: così. «Vai al sito» apre
  `https://thesantamaria.it` nel browser (il comando `apri_sito` in `lib.rs`, con l’indirizzo fisso). Di
  conseguenza la demo non salva più: niente salvataggio automatico, niente «Salva» e «Carica» nella pausa, F5 e F9
  muti, niente salvataggio uscendo. La prova dei salvataggi, nella demo, non pretende il posto automatico.
- **«Togli anche i titoli di coda, si finisce con il cartello che dice che è una demo ecc ecc e poi menu
  principale»**: alla fine lo stesso avviso, aperto da «Qui finisce la demo: l’atto I, la Santa Maria.», con «Grazie
  di aver giocato.» e «menu principale».

Ricostruite: Windows 78,6 MB, Linux 162 MB (319 file audio: le 99 prese dell’atto I, le 39 dell’ingresso, nessuna
voce degli atti dopo). La prova dei salvataggi riesce nell’eseguibile Windows e nell’AppImage avviata in WSL.

**L’icona dell’installatore.** L’autore: «IL FILE DELLA DEMO NON HA IL LOGO». L’installatore aveva l’icona generica
di NSIS (il programma installato aveva già la sua): la configurazione non ne indicava una. Ora `tauri.conf.json` ha
`bundle.windows.nsis.installerIcon` = `icons/icon.ico`, per la demo e per il gioco intero (anche gli installatori
delle beta l’avevano generica). Demo per Windows ricostruita, 78,6 MB; l’icona estratta dal file è quella del gioco.

## 6. L’uscita pubblica (21 novembre 2026)

L’autore: «rilasciamo pubblicamente la demo»; i file «ok per github», l’articolo di lancio con «un po’ di enfasi»
(Leonardo Tomassetti «non è un attore ma uno speaker, usa il termine doppiatore»), il pulsante in home come
proposto.

- **GitHub**: la release `demo-atto-1` (non pre-release, non «Latest»: l’ultima resta `v1.5.3`; il tag non è `v…`,
  quindi né `rilascio.yml` né `canale.yml` partono), con `Il-Relitto-Silente-Demo-atto-I-Windows.exe` e
  `Il-Relitto-Silente-Demo-atto-I-Linux.AppImage`: https://github.com/Pitz72/il-relitto-silente-opensource/releases/tag/demo-atto-1
- **Il sito** (thesantamaria.it, v1.1.12): l’articolo «Il Relitto Silente: è uscita la demo ufficiale, in italiano»
  (`la-demo-ufficiale`, it/en), la sezione «La demo» nella pagina del Relitto (`/relitto/#demo`) con i due pulsanti
  e la riga nella scheda, in home l’invito «Gioca la demo del Relitto Silente» sotto il titolo e la carta del
  Relitto con «la demo è uscita». Caricato con `carica-diff.mjs` (103 file su 307).
