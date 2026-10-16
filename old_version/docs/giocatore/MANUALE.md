# MANUALE OPERATIVO — IL RELITTO SILENTE (v1.5.1)

Benvenuto, pilota. Questo documento contiene tutte le informazioni necessarie per navigare nel relitto e completare la tua missione.

---

## 1. INTRODUZIONE

Sei un mercante dello spazio, pilota della nave da carico *Santa Maria*. Durante una rotta di routine, i tuoi sensori rilevano un'anomalia: una nave stellare di origine sconosciuta, alla deriva nel silenzio. La tua missione: abbordare il relitto, scoprire cosa è successo e comprendere ciò che ti aspetta.

---

## 2. INTERFACCIA

Il gioco simula un terminale retrò a fosfori verdi. Scrivi i comandi nel prompt in basso e premi INVIO.

### Tasti Funzione

| Tasto | Attivo quando | Azione |
|---|---|---|
| **F1** | Menu principale | Leggi le istruzioni |
| **F2** | Menu / Istruzioni | Inizia una nuova partita |
| **F3** | Menu / In gioco | Carica partita (overlay slot) |
| **F4** | In gioco | Salva partita (overlay slot) |
| **F5** | Sempre | Esci dall'applicazione |
| **F6** | In gioco | Apri Inventario |
| **F7** | In gioco | Apri Mappa |
| **F8** | Menu | Crediti |
| **F9 / ESC** | In gioco | Apri/chiudi schermata Pausa |

### Schermata Pausa (F9 / ESC)

Durante il gioco, F9 o ESC apre la pausa con le opzioni: **Continua · Salva · Carica · Ricomincia · Esci**. Usa i tasti 1–5 o il mouse.

---

## 3. COMANDI DI BASE

| Comando | Abbreviazione | Descrizione |
|---|---|---|
| **GUARDA** | **L** | Ridescrive la stanza attuale |
| **ESAMINA** [oggetto] | **X** [oggetto] | Descrizione visiva di un oggetto (o di una stanza: `ESAMINA CORRIDOIO`) |
| **ANALIZZA** [oggetto] | — | Scanner avanzato: dati tecnici e indizi nascosti |
| **TOCCA** [oggetto] | — | Feedback tattile e atmosferico |
| **TRADUCI** [oggetto] | **DECIFRA** | Legge i testi alieni a strati: più la traduzione è avanzata, più riveli |
| **INCIDI** [bersaglio] | **SCRIVI / MARCA / FIRMA** | Lascia un tuo segno (richiede la Taglierina al Plasma) |
| **VAI** [direzione] | **N S E O** | Spostamento |
| **VAI ALTO / VAI BASSO** | **U / D** | Spostamento verticale tra livelli |
| **PRENDI** [oggetto] | — | Raccoglie un oggetto nell'inventario |
| **USA** [oggetto] | — | Usa un oggetto |
| **USA** [oggetto] **SU** [bersaglio] | — | Usa un oggetto su un altro o su uno scenario |
| **INVENTARIO** | **I** | Lista oggetti in possesso |
| **MAPPA** | — | Mappa ASCII a rivelazione progressiva: le stanze compaiono man mano che vengono esplorate, con la posizione corrente sempre evidenziata |
| **NOTA** / **DIARIO** | — | Log delle scoperte con barre di progressione |
| **ASPETTA** / **Z** | — | Lascia trascorrere il tempo |
| **AIUTO** / **SUGGERIMENTO** | — | Hint contestuale: suggerisce cosa fare dopo |

> **Sinonimi naturali.** Il parser accetta anche varianti dei verbi base, così non devi indovinare la parola esatta: **ISPEZIONA** = ESAMINA, **OSSERVA** = GUARDA, **STUDIA** = ANALIZZA, **AFFERRA** = PRENDI, **DECIFRA** = TRADUCI, **SCRIVI / MARCA / FIRMA** = INCIDI.

### Comandi di Sistema

| Comando | Descrizione |
|---|---|
| **SALVA** | Apre l'overlay di salvataggio (5 slot) |
| **CARICA** | Apre l'overlay di caricamento |
| **AUDIO** / **MUSICA** | Toggle audio ambientale on/off |
| **IMPOSTAZIONI** | Apre l'overlay impostazioni audio (toggle + slider volume) |
| **PULISCI** / **CLEAR** | Pulisce lo schermo e ridescrive la stanza |

---

## 4. MECCANICHE DI GIOCO

### Vedere vs. Capire
- **ESAMINA**: cosa vedono i tuoi occhi.
- **ANALIZZA**: cosa rilevano i tuoi sensori. Se qualcosa sembra strano, analizzalo sempre.
- **TOCCA**: cosa senti al contatto fisico. Raramente necessario per i puzzle, ma arricchisce il mondo.

### Gli Echi Temporali
Il **Sintonizzatore di Frequenza** (trovato nei Laboratori di Risonanza) capta le ultime voci dell'equipaggio scomparso in 11 stanze della nave. Usa `USA SINTONIZZATORE` dopo averlo raccolto. Gli echi contengono lore importante e a volte indizi.

Quattro stanze nascondono un **secondo strato** — un *eco profondo* — sotto l'eco di superficie. Si rivela solo se hai soddisfatto una condizione correlata in quella stanza (traduzione avanzata, o un oggetto/atto già compiuto lì): il dispositivo te lo segnala e, se sei pronto, scende di frequenza per svelarlo. Gli echi profondi sono un extra narrativo: compaiono a parte in `ECHI` e nel resoconto, ma **non entrano nel punteggio**.

### Progressione Traduzione
Ogni volta che `ANALIZZA` decodifica un artefatto alieno (Lastra, Cilindro, Stele, Nucleo), la barra di progressione avanza. La comprensione è anche una **lente**: con `TRADUCI [oggetto]` (alias `DECIFRA`) rileggi i testi alieni della nave, e ciò che leggi cambia a soglie — sotto il 18% i glifi restano muti, dal 18% affiorano frammenti, dal 75% il testo si scioglie in lingua, al 100% compare una riga nascosta in più. Conviene tornare sui testi man mano che capisci di più. Raggiungere il 100% nel momento giusto porta a un riconoscimento speciale.

### Sistema HINT
Se sei bloccato, scrivi `AIUTO` o `SUGGERIMENTO`. Il sistema analizza la tua posizione, l'inventario e i flag di avanzamento per fornirti il suggerimento più preciso possibile per la stanza in cui ti trovi — senza mai rivelare la soluzione completa.

### Salvataggio
Il gioco si salva automaticamente ad ogni cambio di stanza (autosave, slot 0). Puoi salvare manualmente su 5 slot aggiuntivi con F4 o il comando `SALVA`.

---

## 5. GUIDA ALLA SOLUZIONE (Walkthrough)

> **⚠ ATTENZIONE: SPOILER COMPLETI**
> Per la soluzione dettagliata, consulta il file `SOLUZIONE.md`.

### Riassunto in tre atti

**ATTO I — L'ingresso**
Stiva → Scafo Esterno → Camera di Compensazione → Corridoio Principale

**ATTO II — Le tre chiavi**
- *Seme Vivente* (Serra Morente)
- *Stele del Ricordo* (Santuario del Silenzio / Scriptorium)
- *Nucleo di Memoria* (Laboratori di Risonanza → Arca della Memoria)

**ATTO III — La rivelazione**
Porta Ovest → Ponte di Comando → Santuario Centrale

---

## 6. NOTE AUDIO

Il gioco genera suoni procedurali in tempo reale tramite Web Audio API (nessun file audio esterno). L'audio ambientale cambia automaticamente ad ogni stanza. Per regolare o disattivare il suono usa il comando `IMPOSTAZIONI` o `AUDIO`.

---

## 7. CREDITS

**Autore:** Simone Pizzi
**Versione:** 1.5.1

*Fine del Manuale.*
