# Prompt per la prossima sessione (28)

Sostituisce il 27. Scritto il 19 ottobre 2026, a fine mattina, su richiesta dell’autore: «tutto questo lo faremo nella prossima sessione che questa è durata anche troppo quindi commit, push, verifica sync tra git e locale, salva tutto e prepara prossima sessione».

## Il prompt

Riprendiamo «Il Relitto Silente». Carica la memoria del progetto, poi leggi questo documento. Il resto si legge quando serve: il **documento 25** (`progettazione/25-revisione-totale.md`; il §9 è il registro di tutto ciò che è stato corretto, commit per commit), `sviluppo/STRUTTURA.md` (la mappa e i comandi), `sviluppo/VERSIONI.md` (§7 del CHANGELOG: le righe «Per chi gioca»; §7 dell’aggiornamento automatico), `CHANGELOG.md`, `audio/musica-ia/REGISTRO.md` (i brani), `progettazione/22-musica-con-lyria.md` (§5.9: la canzone dei titoli di coda).

**Come si lavora (regole fisse dell’autore):**

- **L’autore è ipovedente.** Faccio io ogni passo, dall’inizio alla fine: niente elenchi di passi manuali, niente comandi da scrivere a mano, niente pagine di impostazioni da navigare. Le sole cose che non faccio io sono caricare chiavi, password o token su un servizio online: per quelle preparo uno script, gli lascio **un solo comando** in un blocco `bash` (il pulsante Esegui), dico in una riga che cosa fa, e poi verifico io. Risposte brevi. Le decisioni una per volta, con la mia raccomandazione.
- **Dopo ogni commit si fa push** su `origin main`, senza mai forzare, e `git status -sb` deve dire `main...origin/main`. Un commit per correzione, con la voce nel CHANGELOG (e la riga «Per chi gioca» se chi gioca se ne accorge) e la riga nel §9 del documento 25 quando viene dalla revisione.
- **Le righe «Per chi gioca» le scrivo io, senza la sua approvazione** (sua decisione del 19 ottobre). Poche righe semplici, l’inizio in grassetto, niente termini tecnici; la finestra delle novità mostra solo il **grassetto**, mai gli asterischi singoli.
- **Le prove su GitHub** (`.github/workflows/prove.yml`) partono a ogni push che tocca il gioco o l’app e devono restare verdi (`gh run list`, `gh run watch`; un push annulla quella ancora in corso; se la rete cade si riprova).
- **Il suono resta sintetizzato nel motore, la musica è fatta di file, i `.fav` sono congelati.** La musica è fantascienza, mai giallo. **Un gioco da scrivania**: niente impaginazioni da telefono, si compone in orizzontale; nessun testo sotto i 12 px.
- **Il motore si chiama «Favella1»** (sua correzione del 19 ottobre), mai «FAVELLA 1»; la scritta disegnata del logo resta «FAVELLA1».
- **Le prove nell’eseguibile vero**: `npm --prefix app run tauri build -- --no-bundle`, poi `python strumenti/prova_eseguibile.py finali` e `salvataggi`. **Prima di lanciarle, avvisarlo**: il gioco gli si apre sullo schermo e gioca da solo.
- **Due inciampi di questo computer**: il server di sviluppo di Vite, dopo modifiche rapide fatte da script, a volte serve il modulo vecchio (si ritoccano i file con `touch`); negli script Python scritti dentro un heredoc della shell le barre rovesciate si rovinano (`\\n` diventa un a capo): per le stringhe con le barre si usa l’editor.

## Dove siamo (19 ottobre 2026, fine mattina)

Versione **0.2.5-beta.4** (quella installata sul suo computer, arrivata con l’aggiornamento automatico). Tutto il lavoro di questa sessione è su `main` ma **in nessuna release**: l’autore non ha voluto una beta in mezzo. La prossima beta (`0.2.5-beta.5`) avrebbe molte righe «Per chi gioca» e porterebbe per la prima volta la finestra delle novità. Le prove su GitHub sono verdi fino a `c3a7bba`.

**Fatto in questa sessione** (nel CHANGELOG, «Non rilasciato», e nel documento 25, §9):

- **La finestra delle novità dopo un aggiornamento** (`d82cea8`; L15 chiusa): la sezione «Per chi gioca» nel CHANGELOG, la finestra al primo arrivo al menu con una versione nuova, le stesse righe nel corpo della release e nella domanda «È uscita la versione…». Anche le beta la mostrano; chi installa da zero no.
- **Le lievi L7–L14**: la finestra nasce come vuole l’opzione «Schermo intero», senza lampi (L8); la lamina segue la finestra (L9); lo sfondo del menu rinasce dopo la perdita del contesto WebGL (L10); i nomi dei rapporti (L11); i comandi lenti fuori dal thread principale (L12); la tastiera e le sonde fuori da `Gioco.tsx`, le parole fisse in `lib/italiano.ts`, la spia del ponte che non può più diventare cieca in silenzio (L13); plugin e azioni di GitHub fissati (L14); il percorso della cartella di lavoro tolto dall’eseguibile (L7).
- **Le sue decisioni**: `panic = "unwind"` (se l’audio cade il gioco continua muto; provato con una caduta finta; +0,6 MB compressi); il motore si chiama **Favella1** (L5); il sottotitolo nuovo **«Una storia tratta da *Il Registro della Santa Maria*»** (L6), con il cartello del titolo dell’intro a tempo fisso perché l’intro resti di 2:40,75.
- **E1, le viste delle stanze** (`1eaf309`): diciotto scansioni del multiscanner disegnate in codice dalla storia (`app/src/gioco/visore/scansioni/`, la galleria `?scansioni` nello sviluppo), con diciassette varianti di stato e una frase per il lettore di schermo; la Santa Maria con le scene del sequel (`s_03`, `s_05`, e `s_10` per la stiva) e lo scafo composto in codice (`strumenti/viste/scafo.py`). Gli ho mandato `consegne/Le viste delle stanze.html`, con tutte le scansioni. Viste nel gioco dello sviluppo: vestibolo, stiva, scafo; la prova dei finali nell’eseguibile passa per quasi tutte le stanze ed è verde.
- **Trovato strada facendo**: con la finestra ridotta a icona il ciclo delle venature moriva per sempre (`c3a7bba`).

**Aggiunto il 26 e 27 ottobre 2026: Favella1 1.6.1.** Su richiesta dell’autore il motore è passato alla 1.6.0 (documento 29): `motore/` rifatta dal tag, `.fav` intatti, il gioco identico, tutti i collaudi verdi anche nell’eseguibile. Il giorno dopo, sempre su sua richiesta, ho corretto in Favella1 il difetto che rallentava la compilazione (versione 1.6.1, tag `v1.6.1`) e rifatto la copia. Resta una decisione sua, nel §7 del documento 29: l’aria che non scende sotto lo zero (una riga nei `.fav`, oppure solo nel visore, oppure niente). La 1.6.1 non è ancora pubblicata come Release, su PyPI e sul sito: anche questo lo decide lui. La colonna sonora resta il primo lavoro.

## Il lavoro, in ordine

### 1. La colonna sonora ufficiale (l’idea dell’autore, 19 ottobre 2026)

Le sue parole, punto per punto:

1. rinominare tutte le canzoni con **titoli più eleganti e criptici**, non quelli di Lyria;
2. assegnare a tutti i brani l’autore **The Runtimers**;
3. il nome dell’album: **«The Silent Wreck Official Soundtrack»**;
4. lasciare sempre il **riferimento generativo** («di Lyria 3.5»);
5. farne **un file zip**, dentro il gioco o su GitHub;
6. una voce **«Extra»** nel menu di avvio, e come prima cosa **«Scarica la colonna sonora ufficiale»**;
7. dire che il brano finale usa **il testo dell’Anziano, tratto dal racconto originale «Il Relitto»**, nella raccolta di racconti *Dal Registro della Santa Maria*.

**Quello che ho già verificato** (19 ottobre): i brani nel gioco sono **18, per 37,3 MB** (`tauri.conf.json`, `bundle.resources`). **Dodici sono di Lyria 3.5** (M1-01, M1-02, S2–S5, A1-03, C4-01, C5-03, T-01, T-02, CT-01) e **sei di Suno** (A2-02, A3-02, A4-01, C1-02, C2-02, C3-01: account pitz72, piano «a pagamento, Pro o Premier: da precisare»). Il punto 4 va quindi detto brano per brano («Lyria 3.5» o «Suno»): è la prima cosa da portargli, con la raccomandazione di scrivere il modello vero di ciascuno. `mutagen` 1.47 è installato (i tag ID3).

**Da decidere con lui, una cosa per volta, con la raccomandazione:**

- **Il titolo del libro.** Il sottotitolo nuovo dice *Il Registro della Santa Maria*; il punto 7 dice *Dal Registro della Santa Maria* (il titolo di prima del remake). Chiedere qual è il titolo esatto della raccolta, e allinearlo dappertutto (sottotitolo, titoli di coda, intro, copertine, riconoscimenti).
- **I titoli nuovi.** Li propongo io (eleganti e criptici, in inglese come l’album, uno per brano, legati alla scena che accompagnano: il menu, le soglie degli atti, l’Anziano, le chiusure, il tema, i titoli di coda) e lui sceglie; oppure li scrivo io senza approvazione, come le righe «Per chi gioca». Chiederlo.
- **Dove stanno i titoli.** Raccomandazione: i nomi dei file dentro il gioco restano quelli tecnici (li usano `tauri.conf.json`, il motore audio in `mondo/musica.rs`, il registro); i titoli pubblici vanno in una colonna nuova del `REGISTRO.md`, da cui li prendono i titoli di coda, i riconoscimenti, i tag ID3 e i nomi dei file dello zip.
- **Lo zip: dentro il gioco o su GitHub.** Raccomandazione: **dentro il gioco, senza scaricare niente**. I 18 file ci sono già (37 MB nell’installatore): «Scarica la colonna sonora ufficiale» li raccoglie in uno zip nella cartella Download, con i tag (titolo, artista The Runtimers, album, numero di traccia, anno, la copertina dell’album e il commento con il modello e la licenza CC BY-NC-SA 4.0), un file di testo con i titoli, i crediti e la licenza, e poi apre la cartella con il file selezionato. Così non pesa niente in più e funziona senza rete. In alternativa uno zip come allegato fisso di una release su GitHub, che il gioco apre nel browser. Da verificare: che `symphonia` legga i file con i tag ID3 nuovi (si provano i 18 nel motore audio prima di consegnare), e se lo zip va scritto in Rust (un comando Tauri) o preparato alla build.
- **La copertina dell’album**: dalle copertine social (`strumenti/copertina/componi.py`, il formato quadrato da fare) con il titolo dell’album.
- **La voce «Extra»**: un pannello nel menu principale, nello stile del registro dei finali; per ora una voce sola, «Scarica la colonna sonora ufficiale», con la frase di conferma «Salvata nella cartella Download» e la cartella aperta.
- **Il punto 7** risponde anche alla domanda rimasta aperta («chi firma le parole della canzone»): nei titoli di coda e nel registro, il testo di «Voice in the Deep» (con il suo titolo nuovo) viene dalle parole dell’Anziano nel racconto «Il Relitto»; io l’ho adattato in inglese. Proporgli la riga esatta.

Poi: la voce nel CHANGELOG con le righe «Per chi gioca», il registro (`grafica/LICENZE.md` per la copertina, `audio/LICENZE.md` o il `REGISTRO.md` per i brani), i riconoscimenti rigenerati (`strumenti/riconoscimenti.py`), le prove.

### 2. Il resto della revisione

- **L’estetica**, nell’ordine del documento 25, §6.2: **E2** (una schermata per il finale) ed **E3** (il logo del gioco, il fuso nero col seme verde, nel menu) per prime; poi E4, E6, E7, E8 (la regola delle due immagini, da scrivere nel documento 14: la Santa Maria si fotografa, il relitto si legge), E9.
- **Da provare dal vero** (l’autore, nell’eseguibile, alla prossima beta): la finestra delle novità; le viste delle stanze nella lente (anche cuccetta e sala macchine, non ancora viste dentro una partita); l’opzione «in una finestra» all’avvio; le Opzioni; morire e «Annulla l’ultima mossa»; le cuffie collegate a metà partita; chiudere con la X e riprendere; la modalità a solo testo; i titoli di coda.
- **La prossima beta**, quando lui la vuole: `node strumenti/versione.mjs prepara pre`, il commit «chore(versioni)», il tag; il flusso scrive il corpo della release con le righe «Per chi gioca»; dalla beta.4 alla beta.5 deve comparire la finestra delle novità.
- **Le cose in sospeso da prima**: la musica dell’intro (`I-B`, `I-E`, `I-G`, la genera lui; l’intro dura 2:40,75 e le scene cominciano dove dice `intro/scaletta.ts`); il tema `T-01`/`T-02`, di nuovo non collegato; la copertina (D42–D44 del documento 24); i dati del registro della musica (i piani di Suno da precisare); Linux su una macchina vera (poi `LINUX_PROVATO`); la partita intera giocata a mano; l’inglese con la 1.1.
- **Il primo rilascio pubblico**, quando lo decide lui: una versione normale va nel canale `aggiornamenti`; GitHub la segnerebbe «Latest» al posto della `v1.5.3` del gioco originale: decidere con lui (`gh release edit --latest`), e controllare il README.
