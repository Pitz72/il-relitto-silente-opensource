# Il copione di William

Il doppiaggio di William, per Leonardo Tomassetti (documento 33, RN-H4; documento 35, V1). Tutte le altre voci
sono già registrate: qui c’è soltanto quello che dice William.

| File | Che cos’è |
|---|---|
| `Il Relitto Silente - Il copione di William.pdf` | il copione per Leonardo: la guida (chi è William, come parla, come si legge il copione, le pronunce, come registrare), i blocchi di contesto con le prese, le appendici (le cifre dell’aria, le voci che non sono sue, i punti aperti) |
| `copione.json` | i dati: capitoli, blocchi, prese, pezzi, segmenti (di William e degli altri), le prese uguali; lo scrive lo strumento |
| `contesti.json` | le due righe di contesto e il titolo di ogni blocco, scritte a mano (7 novembre 2026) |

**Le prese, quando arrivano** (dal 16 novembre 2026, documento 41): si copiano in `consegne/` con il nome che hanno
(la sigla: `sm-015.wav`), e poi, dalla radice:

    python strumenti/audio/voce_william.py

Lo strumento le prepara per il gioco (`audio/musica-ia/WI/`), scrive le tabelle per il ponte, la pagina e il motore, e
le mette fra le risorse dell'app; poi si costruisce il gioco. Se i `.fav` cambiano, prima si rifà il copione (qui sotto):
il collaudo (`collaudo/eventi.py`) se ne accorge.

Il registro di bordo dell’intro (`consegne/intro.wav`) non passa da qui: lo prepara `strumenti/intro/voci_spazio.py`,
dalla sua copia in `audio/sorgenti/voce/william-registro-intro-leonardo-2026-11-15.wav`. Leonardo ne aveva mandato
anche una seconda versione (`intro2.wav`): l’autore, 16 novembre 2026, «Archivialo come materiale storico»; sta in
`audio/sorgenti/voce/william-registro-intro-leonardo-presa2-storica-2026-11-15.wav` (impronta
`6912944192a5eed684896f4c20720ecf7b6bf018a655fd7b8b08c97288028939`), fuori dal gioco.

Dal 19 novembre 2026 il PDF ha soltanto le prese ancora da registrare: quelle che hanno già il loro file nel gioco
(e quelle uguali a loro) non si stampano. La cifra dell’aria («ARIA [aria]%») la legge la voce di servizio, non
William: non ci sono più le cifre da registrare (documento 41, §5).

Il copione si rifà così, dalla radice:

    python strumenti/audio/copione_william.py
    python strumenti/audio/copione_pdf.py

`copione_william.py` legge i `.fav` e divide il testo: è di William il racconto, quello che dice ad alta voce (le
opzioni dei dialoghi, non i gesti) e quello che legge fra «» quando nessun’altra voce lo dice; non è suo quello che
dicono l’Anziano, Yusuf, L.V., le voci della nave (anche le varianti brevi), la voce di servizio, il nome davanti
alle voci della nave e la riga del registro di bordo che chiude i finali. Le frasi che cambiano con la partita
diventano pezzi (se i rami sono frasi intere) o frasi intere, una per combinazione (se il ramo sta dentro una
frase). Le prese uguali si registrano una volta sola.

Se il gioco cambia, gli id dei blocchi e delle prese possono spostarsi: `copione_pdf.py` dice quali blocchi non
hanno più il loro contesto. Le sigle delle prese sono anche i nomi dei file che Leonardo consegnerà
(`SM-027.wav`, `FI-002b.wav`; le cifre dell’aria `ARIA-040-c.wav` e `ARIA-040-s.wav`).

La prima versione, del 7 novembre 2026, sul gioco 0.2.5-beta.10: 125 blocchi, 605 prese da registrare (più 130
uguali), circa 16.000 parole, 111 pagine. I punti aperti sono in fondo al PDF.

Rifatto l’11 novembre 2026, dopo la correzione del congedo dell’Anziano (revisione 37, G3): la frase «Non c’è più.
La sua luce è dentro il seme.» la dice anche chi parla all’Anziano nella fuga, ed è la stessa presa. Lo strumento
riconosce ora come una presa sola una frase scritta con e senza le parentesi (così anche «Una pausa.»): 604 prese
da registrare (più 132 uguali), 111 pagine. Le sigle delle prese del Ponte dopo `PO-038` sono salite di uno.

Rifatto il 24 novembre 2026, dopo tre correzioni alla storia approvate dall’autore (revisione 37: M22, M23, M24).
Le varianti nuove stanno dentro le regole che c’erano già, e **nessuna sigla si è spostata**: tre prese sono
diventate pezzi (`CO-001a`…`c`, `CO-012a`…`d`, `PO-035a`…`c`), cinque hanno il testo nuovo (`CO-015`, `CO-016`,
`ME-019`, `ME-056`, `RE-009`). Nessuna era registrata. Le prese sono 611 (più 132 uguali); nel PDF le 473 ancora da
registrare, 92 pagine. È questo il PDF da mandare a Leonardo, con il rapporto del 24 novembre.

Rifatto il 25 novembre 2026, dopo sette frasi piccole approvate dall’autore (revisione 37: L35 in parte, L37), con
la sua regola: tutto il racconto è in prima persona. Anche stavolta **nessuna sigla si è spostata**: tre prese sono
diventate pezzi (`ME-003a`…`c`, `EQ-015a`…`c`, `AR-009a` e `b`), quattro hanno il testo nuovo (`CO-011`, `IN-062`,
`IN-082`, `ME-030`: dicevano «tu», ora dice William), due sono nuove in fondo al loro capitolo e uguali a una che
c’è già (`EQ-026` come `IN-078`, `TR-044` come `TR-041`). Nessuna era registrata. Le prese sono 616 (più 134
uguali); nel PDF le 478 ancora da registrare, 92 pagine. È questo il PDF da mandare a Leonardo, con il rapporto del
25 novembre (138 su 616, il 22,4 %).

Lo stesso giorno sono arrivate diciotto prese nuove (`IN-047`…`IN-068`; documento 41, §5): ora sono 156 su 616, il
25,3 %. Il PDF ha le 460 ancora da registrare, 90 pagine, e il rapporto è quello del 25 novembre rifatto: sono questi
da mandare a Leonardo.

Il 26 novembre sono arrivate trenta prese nuove (`IN-069`…`IN-084`, `CO-001a`…`CO-010b`; documento 41, §5): ora sono
186 su 616. Due sono da rifare (`CO-004`, `IN-083`): senza di loro 184, il 29,9 %. Il PDF ha le 432 ancora da
registrare, 86 pagine, con le due da rifare spiegate a pagina 2 e segnate in rosso al loro posto (`DA_RIFARE` ed
`ERRORI` in `copione_pdf.py`); il rapporto è quello del 26 novembre. Sono questi da mandare a Leonardo.
