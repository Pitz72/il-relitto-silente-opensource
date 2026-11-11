# Il copione di William

Il doppiaggio di William, per Leonardo Tomassetti (documento 33, RN-H4; documento 35, V1). Tutte le altre voci
sono già registrate: qui c’è soltanto quello che dice William.

| File | Che cos’è |
|---|---|
| `Il Relitto Silente - Il copione di William.pdf` | il copione per Leonardo: la guida (chi è William, come parla, come si legge il copione, le pronunce, come registrare), i blocchi di contesto con le prese, le appendici (le cifre dell’aria, le voci che non sono sue, i punti aperti) |
| `copione.json` | i dati: capitoli, blocchi, prese, pezzi, segmenti (di William e degli altri), le prese uguali; lo scrive lo strumento |
| `contesti.json` | le due righe di contesto e il titolo di ogni blocco, scritte a mano (7 novembre 2026) |

Si rifà così, dalla radice:

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
