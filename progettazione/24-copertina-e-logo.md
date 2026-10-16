# La copertina e il logo dell'eseguibile: il breve

Versione 1.0, 16 ottobre 2026. È il breve per la fase 9 (06, §14), chiesto dall'autore il 15 ottobre 2026: **la direzione la dà lui, io preparo il materiale**. Dice che cosa serve, dove va, che cosa deve (e non deve) mostrare, e dà i prompt da usare nello strumento di immagini che sceglie. Niente è deciso: le decisioni sono nel §8.

**Un fatto da sapere subito.** L'icona dell'eseguibile, oggi, è **quella di Tauri** (i due cerchi giallo e azzurro: `app/src-tauri/icons/`). Compare nella barra delle applicazioni, nell'installer e nel collegamento sul desktop. Va sostituita prima di qualunque consegna pubblica.

---

## 1. Che cosa serve

| Che cosa | A che cosa serve | Formato |
|---|---|---|
| **Il logo** (il segno) | l'icona dell'eseguibile, dell'installer e del collegamento; la favicon della finestra | un master quadrato **1024 × 1024**, PNG con sfondo (o SVG). Dal master `npm --prefix app run tauri icon master.png` genera tutte le misure (`.ico`, `.icns`, i `Square*`, `32x32`, `128x128`) |
| **La copertina** | la testata del README su GitHub, l'immagine di anteprima del repository (1280 × 640), la pagina delle release, il menu principale se si vuole | un master **2752 × 1536** (16:9, come l'originale), PNG; i ritagli li faccio io |
| **L'immagine dell'installer** (facoltativa) | la testata (150 × 57) e la colonna laterale (164 × 314) dell'installer di Windows | le ricavo dalla copertina e dal logo |

**Il titolo e la scritta non si fanno nell'immagine.** Gli strumenti di immagini sbagliano le lettere. La copertina si chiede **senza testo**; il titolo lo compongo io, in codice, con i caratteri del gioco (stencil delle targhe della Santa Maria per «IL RELITTO SILENTE»; Newsreader in corsivo per «dal racconto «Il Relitto», in *Dal registro della Santa Maria*»).

## 2. Che cosa deve dire

Il gioco è **fantascienza**, non giallo e non horror (come per la musica, 22 §5.7): stupore, vastità, solitudine, una cosa antica che ascolta. L'idea che regge tutto è **«il fiato è l'interfaccia»**; l'immagine che la storia ha già scelto è questa (intro, scena B ed E): **la Santa Maria, piccola, davanti a un muro nero che occupa il cielo e beve le stelle**. Il relitto è «la massa» e, visto da lontano, «il fuso»: una **forma nera dove le stelle mancano**. Dentro, **una cosa viva che pulsa**, in verde (il seme).

Il canone visivo, da non rompere (06, §17):

- **La Santa Maria** (TSC-1972) è la nave del sequel: scafo grigio sporco, strisce arancioni, finestre della plancia accese d'ambra. **Si usa l'immagine canonica** (`app/public/intro/prua.webp`, di tre quarti dal davanti, scontornata), non una nuova: così è la stessa nave dei due giochi.
- **Il relitto non ha una faccia.** Non si disegnano stanze, creature, l'Anziano, la teca, il corridoio dell'originale. Solo la massa nera, e al più il suo bordo dove la luce non arriva.
- **Niente che sveli la storia**: né il seme nella teca (`s_01` è esclusa), né il volto di L.V., né un finale. Il verde, se c'è, è un **punto**.
- **La scala**: il relitto è enormemente più grande della nave (decisione 17.5); la Santa Maria sta in un angolo, di un quinto della larghezza del quadro al più.

La tavolozza è quella del gioco, nessun altro colore: **acciaio freddo** e nero; **ambra** delle finestre; **azzurro** della luce (`#5FD4DC`); **verde del seme** (`#8BF0A2`), usato una volta sola.

## 3. Il logo: il segno

*(Fatto: vedi D41 nel §8. Il testo che segue è il ragionamento di partenza.)*

Deve reggere a 16 pixel e dire una cosa sola. Tre strade, in ordine di preferenza:

- **A · Il fuso e il seme** *(la mia scelta)*. Un fondo quasi nero (un quadrato con gli angoli appena arrotondati, come le targhe); una **lente nera appuntita**, orizzontale, che taglia un campo di piccole stelle, con le stelle che si spengono dove passa; nel suo centro **un solo punto verde**. Senza testo. A 16 px resta: un'ombra nera con un punto verde.
- **B · La spia.** Il punto verde della scatola nera di L.V., con il suo alone, su un nero pieno (è la prima immagine del gioco: la spia di sei pixel). Essenziale, ma dice meno della storia.
- **C · Il monogramma.** «R·S» in stencil d'acciaio con la venatura verde che gli cresce sopra (la membrana). Il più «da logo», il meno poetico.

## 4. La copertina: tre direzioni

- **A · Il muro nero** *(la mia scelta)*. Campo largo, il cielo di stelle e la Via Lattea in diagonale; a destra e in alto **il fuso nero**, enorme, che occupa il cielo e mangia le stelle ai suoi bordi; in basso a sinistra la **Santa Maria** piccola, di tre quarti, con le finestre d'ambra e il faro di prua; nel cuore del fuso, lontanissimo, **un punto verde**. In alto o a destra, vuoto per il titolo. È la scena finale dell'intro e del menu: la copertina e il gioco si riconoscono.
- **B · La luce del corridoio.** Un portello o un oblò visto dall'interno della Santa Maria, con la massa nera nel vetro e il riflesso azzurro del pannello sul bordo; un guanto che si appoggia al vetro. Più intimo, meno immediato.
- **C · «La vedo pulsare».** Un primo piano: un guanto della tuta che tiene un piccolo vetro con dentro una luce verde che pulsa, e nella visiera, minuscolo, il fuso nero. È la frase più forte del prologo, ma è anche la più vicina a svelare il seme.

**Come si ottiene (strada consigliata): due pezzi.** Si chiede allo strumento **solo il cielo con il fuso**, con lo spazio vuoto in basso a sinistra; la Santa Maria la metto io (l'immagine canonica, scontornata) e il titolo anche. Così la nave è identica a quella dei due giochi, e se lo strumento sbaglia la nave non si perde il resto. Se invece si vuole una copertina intera dallo strumento, vale lo stesso prompt con la nave descritta (§6, «versione intera»).

## 5. I prompt: il logo

Da incollare, in inglese; il primo per la strada A. Se lo strumento non fa una lente così pulita, la **disegno io in codice** (SVG) e si salta lo strumento: è un segno semplice, e il codice lo fa più preciso.

```
App icon, square, flat vector style, no text. A near-black rounded square background with a faint field of tiny cold-white stars. Across the center, a perfectly black, sharp, horizontal lens-shaped spindle shape that cuts through the stars and swallows them at its edges. At the exact center of the spindle, one single small glowing green dot (#8BF0A2), crisp, no glow bleeding outside. Minimal, symmetrical, extremely readable when shrunk to 16 pixels. Cold, vast, quiet science fiction. Palette only: black, steel grey, cold white, one green.
```

Per la B (la spia):

```
App icon, square, flat vector, no text. Pure black background. In the upper center a single six-pixel-wide green indicator light (#8BF0A2) with a soft round halo, like the recording light of a dead machine. Nothing else. Minimal, cold, readable at 16 pixels.
```

## 6. I prompt: la copertina

**Solo il cielo (consigliata).** 16:9, 2752 × 1536.

```
Cinematic wide shot of deep space, no text, no logos. A colossal black spindle-shaped mass, hundreds of times larger than any ship, hangs across the upper right of the frame like a wall: perfectly black, matte, with no visible surface detail, so that it reads only as the place where the stars are missing; the stars at its edge are being swallowed. The Milky Way crosses the sky diagonally, soft and cold. Deep inside the black mass, extremely far away, one single tiny green point of light (#8BF0A2). The lower left third of the frame is empty dark sky, left free. Mood: awe, vastness, cosmic loneliness, quiet; science fiction, not horror, not mystery. Palette: black, steel blue-grey, cold white starlight, one green point. Photoreal film still, 2.39:1 feel, fine grain, no lens flare, no spaceship, no people, no text.
```

**Versione intera** (la nave la fa lo strumento; si perde l'identità con il sequel):

```
Cinematic wide shot, no text. A small weathered grey industrial cargo spaceship with orange stripes and amber-lit cockpit windows, three-quarter view from the front, in the lower left, tiny against a colossal black spindle-shaped mass that fills the upper right of the sky like a wall and swallows the stars at its edges. Milky Way diagonal, cold. Deep in the black mass one tiny green point of light. Awe, vastness, loneliness; science fiction, not horror. Palette: black, steel grey-blue, amber windows, cold white stars, one green point. Photoreal film still, fine grain, no text, no people.
```

**Da evitare** (frasi che fanno uscire il genere sbagliato): *tentacles, monster, creature, skull, eyes, horror, dark mystery, detective*; *cyberpunk, neon city*; *glowing alien runes everywhere*. **Variazioni utili** da chiedere a ogni giro: *«the black mass larger, more of the sky»*, *«fewer stars near the mass»*, *«the green point smaller and farther»*, *«remove any structure or texture on the black mass»*.

## 7. Che cosa faccio io, quando c'è il file

1. **Il logo**: se arriva un'immagine, la metto a punto (ritaglio, margini di sicurezza dell'80%, prova a 16, 32, 48, 256 px) e rigenero **tutte** le icone dell'app (`tauri icon`); se il segno lo disegno io, lo faccio in SVG e lo esporto.
2. **La copertina**: compongo la Santa Maria canonica (`prua.webp`) in basso a sinistra, il titolo e la riga del racconto in codice, e ne ricavo la testata del README, l'anteprima del repository (1280 × 640), la pagina delle release e, se si vuole, le immagini dell'installer.
3. **I registri**: una riga in `grafica/LICENZE.md` per ogni immagine nuova (strumento usato, data, i **prompt esatti**, come per la musica) e nella sezione «Le immagini» dei riconoscimenti; la dichiarazione sull'IA dice già che il gioco è nato con l'aiuto dell'intelligenza artificiale: se la copertina o il logo sono generati, **si aggiunge una riga** (testo suo, come la volta scorsa). Prima di pubblicare, vanno letti i **termini dello strumento** per l'uso commerciale e per la licenza CC BY-NC-SA che il repository dà alle immagini (`LICENZE.md`).
4. **L'originale**: la copertina del 1° gioco (`grafica/cover-relitto.jpeg`, il corridoio) **non** è quella del remake. Resta come omaggio nei riconoscimenti.

## 8. Le decisioni per l'autore

- **D41 · Il segno.** A (il fuso e il seme), B (la spia) o C (il monogramma). **DECISA il 16 ottobre 2026: A, disegnato in codice, e approvato dall’autore dopo averlo visto** (`strumenti/logo/disegna_logo.py`, uscite in `grafica/logo/`; le icone dell'app sono rigenerate dal master con `tauri icon`). Nota di disegno: il primo tentativo, una lente larga con il punto al centro, **sembrava un occhio**; il fuso è stato allungato (lungo e stretto, come una lama) e messo in diagonale, come la Via Lattea dell'intro.
- **D42 · La copertina.** A (il muro nero), B (la luce del corridoio) o C («La vedo pulsare»). Raccomandazione: **A**, in due pezzi (cielo dallo strumento, nave canonica e titolo miei).
- **D43 · Lo strumento.** Quale usi, e se i suoi termini permettono l'uso nel gioco e nel repository con la licenza che ha (D17 del 06 resta aperta per il sequel, e vale anche qui).
- **D44 · Il titolo in copertina.** Lo stencil dell'acciaio (la Santa Maria) o il corsivo del libro (Newsreader). Raccomandazione: **stencil** per «IL RELITTO SILENTE», corsivo per la riga del racconto.

Quando hai i file, mettili in `grafica/nuovi/` (fuori da git finché non li scegliamo) e dimmi quale è quale; il resto è mio.

## 9. Le copertine social, composte in codice (16 ottobre 2026)

L'autore ha chiesto subito le copertine social in **16:9, 9:16, formato poster e 21:9**. Invece di aspettare uno strumento di immagini, la direzione A («il muro nero») è stata **composta in codice**: `python strumenti/copertina/componi.py` (tutti i formati, in `grafica/copertine/`; oppure `… 16x9 poster`).

| Formato | Misura | A che cosa serve |
|---|---|---|
| `16x9` | 2752 × 1536 | testata, YouTube, pagina del gioco |
| `21x9` | 3440 × 1440 | schermi ultralarghi, banner |
| `9x16` | 1440 × 2560 | storie e video verticali (titolo sopra la zona dei comandi della piattaforma) |
| `poster` | 2400 × 3600 (2:3) | stampa, con la cornice e il credito «un'avventura testuale di Simone Pizzi» |
| `social` | 1280 × 640 (2:1) | l'anteprima del repository su GitHub (Settings → Social preview) |

**Che cosa c'è.** Il cielo (nero azzurro, un chiarore freddo dalla parte del sole, la Via Lattea in diagonale, qualche migliaio di stelle che si fanno più piccole e più spente vicino al fuso); **il fuso nero**, enorme, con un filo di luce fredda sul bordo; **il punto verde del seme** nel suo cuore; **la Santa Maria canonica** (`app/public/intro/prua.webp`, scontornata) piccola in un angolo, un poco più fredda dalla parte opposta al sole; il titolo in stencil e la riga del racconto in corsivo, con i caratteri del gioco. Una grana finissima e la vignettatura tolgono le bande dai gradienti.

**Che cosa non è.** Non è un'illustrazione generata: il cielo è procedurale e il fuso una forma geometrica, quindi la copertina è «pulita» ma meno ricca di quella che potrebbe fare uno strumento di immagini. **La strada del §4 resta aperta**: se l'autore genera un cielo con il fuso (prompt del §6), `componi.py` può prendere il suo posto e continuare a mettere la nave e il titolo. Per questo le copertine, tranne l'anteprima da 1280 × 640 (che serve al README), **non sono in git**: si rigenerano in mezzo minuto.

Il tutto è in `grafica/LICENZE.md` come immagine dell'autore, senza strumenti di IA.

