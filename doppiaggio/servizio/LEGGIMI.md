# La voce di servizio

La tuta e il gioco che parlano a chi gioca (documento 35, §11): PROTEZIONE VITALE, le scritte dei display, le letture
dello scanner, la matrice di traduzione, i suggerimenti fra parentesi. Si fa come nel Viaggiatore: una voce di Google
AI Studio, **Kira**, con il modello Gemini 3.8 Flash TTS, generata dall’autore. Niente crediti.

I testi li scrive `strumenti/audio/voce_servizio.py` leggendo il gioco: non si scrivono a mano. Se un testo del gioco
cambia, si rilancia lo strumento e si rigenera.

| File | Che cos’è |
|---|---|
| `servizio.txt` | il testo da incollare in AI Studio: una parte per riga, con `<long pause>` fra l’una e l’altra (serve a tagliare l’audio dopo, nei punti giusti). Le parole in maiuscolo sono abbassate, perché la voce le leggerebbe come se urlasse; le percentuali sono in lettere |
| `manifest.json` | per ogni parte: il suo codice, il testo per la voce, il testo com’è nel gioco, il tipo, da dove viene; nello stesso ordine del file da incollare |

Il file dura circa **2 minuti e mezzo**: sta in una generazione sola (AI Studio arriva a circa sei minuti). Se un giorno
le parti crescessero oltre i cinque minuti, lo strumento le divide da solo in `servizio-a.txt`, `servizio-b.txt`…

## Come si genera

1. Google AI Studio, «Generate speech» (Playground), **Create new dialog**.
2. **Speaker 1**: la voce **Kira** (nella ricerca delle voci scrivi «Kira»).
3. **Style**: incolla la descrizione qui sotto, sempre identica.
4. Nel blocco di testo incolla **tutto** `servizio.txt`.
5. **Run** (o Ctrl+Invio). Alla fine la durata deve essere vicina a 2 minuti e mezzo.
6. Scarica con l’icona di download, conferma il salvataggio, e dimmi che c’è: il file finisce nella cartella Download
   («Generated Audio…wav»). Il taglio, il controllo con Whisper e il resto li faccio io.

La descrizione (in inglese, come nel Viaggiatore; il parlato resta italiano):

> A woman in her thirties speaking Italian: the voice of a spacesuit's onboard system and of the game's interface.
> Calm, clear and neutral, mid-pitch, even and unhurried pacing. Precise, slightly cool and technical, like a
> well-made instrument readout; friendly but flat, never warm, never dramatic, no emotion. Crisp consonants,
> standard Italian, no regional accent.

Una voce femminile e fredda è voluta: si deve capire a orecchio, senza guardare lo schermo, se parla il mondo
(William, le voci) o la macchina.
