# Prompt per la prossima sessione

Scritto il 14 ottobre 2026, a chiusura della sessione che ha rivisto e corretto il gioco e
progettato l’app desktop. Da incollare così com’è all’inizio della sessione nuova.

---

```
Carica la memoria di Claude per questo progetto, poi leggi, in quest'ordine:
README.md, progettazione/06-app-desktop.md (soprattutto il §17, che vale su tutto il resto),
progettazione/06-proposta-membrana.html (è il riferimento visivo approvato: aprila e guardala
nel browser integrato) e, per la struttura dello schermo e l'abbozzo dell'intro,
progettazione/06-proposte-visive.html. Rispondimi in italiano.

CHE COSA È GIÀ DECISO (non rimetterlo in discussione)
- Il gioco «Il Relitto Silente» (FAVELLA 1.4.4, relitto-silente/) è finito, rivisto e corretto.
  Il motore in motore/ non si tocca. Il testo del gioco non si tocca. Il collaudo deve restare
  verde: python collaudo/regressioni.py --riprese (14 percorsi su 14).
- Diventa un'app desktop per Windows e Linux con Tauri 2 (Rust), React + TypeScript + Vite, il
  motore vero dentro Pyodide (come nel Viaggiatore: github.com/Pitz72/il-viaggiatore-favella,
  da cui si riusano idee e parti: il ponte Python, i salvataggi che rigiocano la partita con
  l'impronta SHA-256, la struttura del trailer). Niente web, niente server, niente rete.
- Solo pulsanti, niente parser: la prova sta nel §1 del 06 (1.294 comandi su 1.294).
- Lo stile è la direzione C, «Membrana», com'è nelle schermate di 06-proposta-membrana.html:
  look, colori e animazioni approvati. Sulla Santa Maria l'interfaccia è acciaio; al primo
  contatto nel vestibolo il relitto la colonizza e la fa crescere; nella fuga si lacera.
- Le immagini del sequel («Il Mistero della Santa Maria», in
  C:\Users\Utente\Documents\Claude\Projects\IL MISTERO DELLA SANTA MARIA\assets\assets di gioco\immagini\)
  si usano solo dopo averle controllate contro il canone del Relitto, che viene prima. La plancia
  è location/nuove/s_01_b.png. Mai s_01.png né zoom_s01_teca.png: mostrano il seme nella teca,
  cioè quello che in questo gioco si deve ancora trovare. Mai s_10_b.png (cassa del sequel).
  s_03 (una branda sola) e s_04 (pallet e casse, mentre la stiva del Relitto è vuota) vanno
  rifatte o ritoccate. Yusuf: dialoghi/COMUNICATORI_v2/YUSUF_COM.png.
- I suoni ambientali e d'atmosfera devono essere credibili e realistici il più possibile.
- L'intro abbozzata nelle tavole è solo una bozza: va fatta a un livello molto più alto, con un
  respiro cinematografico. I testi restano sullo schermo il tempo di leggerli e un po' di più;
  niente si comprime per stare in un minutaggio.
- La nave aliena è enormemente più grande della Santa Maria: l'intro deve farlo sentire.
- Lavori con lo sforzo al massimo: usalo soprattutto per la qualità del design.

CHE COSA FARE IN QUESTA SESSIONE
Tre lavori, in quest'ordine di priorità. Il primo è tecnico, gli altri due sono preproduzione che
va approvata da me prima di passare alla produzione.

1. FASE 1 DEL PIANO, LA PROVA TECNICA (§14 del 06). Lo scopo è togliere subito i rischi, Linux
   per primo.
   - Crea app/ (Vite + React 19 + TypeScript) e app/src-tauri/ (Tauri 2). Installare le
     dipendenze npm e cargo fa parte del lavoro: dimmi all'inizio che cosa installi.
   - Pyodide con il motore 1.4.4 e i quattordici moduli del gioco; un ponte minimo che compila il
     gioco, esegue un comando, restituisce gli eventi del turno (raccogli_uscita), i pulsanti
     (gioco.pulsanti, con mondo.modo_comandi = "pulsanti" impostato dal ponte, senza toccare il
     .fav) e lo stato che serve agli strumenti (aria, traduzione, echi, risonanze, chiavi, stanza).
   - Una schermata grezza che gioca il percorso collaudo/vivi.txt solo con i pulsanti.
   - Un suono da Rust con kira, comandato dalla pagina con un comando Tauri (anche solo il re del
     reattore sintetizzato e un campione in loop), per misurare latenza e tenuta.
   - Il generatore delle venature di 06-proposta-membrana.html portato nell'app, su canvas, per
     misurare i fotogrammi.
   - Costruzione e prova su Windows; costruzione su Linux in WSL (Ubuntu), con le dipendenze di
     webkit2gtk 4.1. Prova la finestra anche in WSLg, sapendo che la prova vera va fatta su una
     macchina Linux con una scheda grafica vera: preparami le istruzioni per farla io.
   - Misura e scrivi in progettazione/08-fase-1-prova-tecnica.md: avvio (Pyodide + compilazione),
     tempo per turno, fotogrammi delle venature, latenza dell'audio, dimensioni dei pacchetti, e
     che cosa non ha funzionato. Chiudi con un sì o un no per ogni rischio del §13.2.

2. L'INTRO, STORYBOARD 2 (preproduzione della fase 6).
   - Riscrivi la sequenza d'apertura da capo, con un respiro cinematografico. Il punto di partenza
     resta il §10 del 06 (la spia della scatola nera di L.V., il battito, il margine, il radar, le
     stelle che si spengono, il faro che entra e non torna, il titolo che nasce dai glifi, la
     plancia), ma tempi, inquadrature e ritmo si rifanno.
   - Regola per i testi: almeno 0,35 secondi per parola più due secondi fermi, mai meno di
     quattro secondi per riga, dissolvenze di almeno un secondo, e la camera ferma o quasi mentre
     si legge. La durata totale la decide il ritmo: probabilmente intorno ai due minuti.
   - La scala: la Santa Maria (scafo grigio consumato, strisce arancioni, la scritta TSC-1972;
     riferimenti nave-esterno/still_3-4_canonico_v2_2026-09-01.png e
     turnaround_approvato_2026-09-01.png) è una cosa piccola davanti a un muro nero che occupa il
     cielo. Trova le inquadrature che lo fanno sentire: per esempio seguire la Santa Maria da
     vicino e poi arretrare finché non è un punto contro la sagoma che spegne le stelle. Il gioco
     dice «trecentoquaranta metri» e «massa: stima incerta»: la scala visiva segue me, non lo
     scanner.
   - Livello di realizzazione: WebGL2 (shader propri, o three.js solo se si guadagna il posto),
     stelle con profondità e parallasse, Via Lattea con rumore frattale, fascio del faro
     volumetrico, bagliore, grana, la Santa Maria in 3D o in 2,5D ricavata dai riferimenti.
   - Consegna: un documento progettazione/09-intro-storyboard.md (scena per scena: tempo,
     inquadratura, movimento di camera, testo, suono, luce) e una tavola HTML con i fotogrammi
     chiave. Più una sola inquadratura realizzata al livello finale, come prova di look: quella
     della scala (la Santa Maria davanti alla massa). Non animare il resto prima che io approvi lo
     storyboard.
   - La musica (decisione D14 del 06) non è ancora decisa: chiedimela quando serve.

3. IL SUONO, BIBBIA SONORA (preproduzione della fase 4).
   - Un documento progettazione/10-bibbia-sonora.md: per ogni stanza e ogni evento del gioco gli
     strati (ambiente, dettagli, eventi), come si costruiscono, da dove vengono, come si
     elaborano. Il respiro nel casco legato all'aria, il re del reattore come filo musicale, il
     brusio, il groviglio, la fuga, l'ipossia (filtro su tutto), la protezione vitale (il brusio
     tace).
   - Realismo: registrazioni vere, stratificate ed elaborate (equalizzazione, riverberi a
     convoluzione di ambienti metallici, l'acustica chiusa del casco); la sintesi solo dove serve.
     Fisica giusta: nel vuoto non c'è suono, sullo scafo si sente solo ciò che arriva per contatto.
   - Fonti con licenza compatibile con la distribuzione (CC0, Sonniss GDC, Pixabay; ogni file
     verificato) e un registro audio/LICENZE.md. Prima di scaricare qualunque file chiedimi il
     permesso, con nome, fonte e dimensione.
   - Se i file ci sono, un prototipo in kira di tre ambienti (la plancia con il reattore, il casco
     sullo scafo, il vestibolo con il brusio).

REGOLE DI LAVORO
- Ogni testo italiano che scrivi (documenti, interfaccia) segue la skill prosa-italiana e il suo
  contratto tipografico (caporali, apostrofi, «…»). I .fav non si toccano.
- Prima di disegnare, carica la skill ui-ux-pro-max; tutte le coppie di colori del testo almeno
  4,5:1; movimento ridotto previsto da subito.
- Commit locali frequenti, con l'attribuzione. Niente push e niente GitHub senza il mio permesso.
- A fine sessione: aggiorna il §14 del 06 con lo stato delle fasi, la memoria del progetto e il
  README, e chiudi con un commit.
```
