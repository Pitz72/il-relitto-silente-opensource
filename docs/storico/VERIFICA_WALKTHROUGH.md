# VERIFICA WALKTHROUGH — IL RELITTO SILENTE

> **[STORICO — snapshot 2026-03-21, v1.1.33]** Verifica del percorso critico di una versione intermedia. Non riflette il codice corrente (v1.5.1): non copre `TRADUCI`, gli echi profondi, `INCIDI` né il secondo percorso WS5. Per la verifica end-to-end del codice attuale vedi `../verifica/SIMULAZIONE-INTEGRALE.md` (2026-06-01). I 4 bug qui elencati sono stati risolti in v1.1.34–v1.1.37.

**Data:** 2026-03-21
**Versione simulata:** 1.1.33 (post-implementazione narrativa N1–N11)
**Metodo:** simulazione mentale integrale basata su lettura completa di tutti i file di stanza, gameLogic.ts e types.ts

---

## Risultato generale

**Nessun blocco critico sul percorso principale.** Il gioco è completabile dall'inizio alla fine su tutti i rami. Il percorso narrativo e i tre rami di raccolta chiavi convergono correttamente al finale.

---

## Percorso critico verificato

### Atto I — Ingresso
| Passo | Stanza | Azione | Flag risultante |
|---|---|---|---|
| 1 | Stiva | PRENDI KIT → USA KIT | taglierina + batteria in inventario |
| 2 | Stiva | USA TUTA | `isWearingSuit = true` |
| 3 | Scafo Esterno | ANALIZZA SCAFO → USA TAGLIERINA SU CREPA | `knowsAboutCrack`, `isHoleCut` |
| 4 | Scafo Esterno | ENTRA | `primoIngressoRelitto`, location → Camera |
| 5 | Camera Compensazione | ANALIZZA PANNELLO → USA BATTERIA SU PANNELLO → APRI PORTA | `isAirlockDoorPowered`, `isAirlockDoorOpen` |
| 6 | Camera Compensazione | VAI EST | location → Corridoio Principale |

### Atto II — Tre chiavi
| Chiave | Percorso | Puzzle | Oggetto |
|---|---|---|---|
| Stele | Corridoio→N→Santuario→O→Scriptorium→E→Santuario | USA DISCO SU ALTARE → PRENDI STELE | Stele del Ricordo |
| Seme | Corridoio→S→Serra | PRENDI TAVOLETTA → USA TAVOLETTA SU PANNELLO → PRENDI SEME | Seme Vivente |
| Nucleo | Corridoio→N→Santuario→O→Scriptorium→N→Arca Memoria | USA TAGLIERINA SU TERMINALE → PRENDI NUCLEO | Nucleo di Memoria |

### Atto III — Finale
| Passo | Azione | Risultato |
|---|---|---|
| 1 | USA SEME/STELE/NUCLEO SU PORTA | `isWestDoorUnlocked = true` |
| 2 | VAI O → Ponte di Comando | postazione attivabile |
| 3 | USA POSTAZIONE → ESAMINA MAPPA | `isHologramActive`, `knowsAboutTrinarySystem` |
| 4 | TOCCA TRE PUNTE | `isFinalDoorOpen = true` |
| 5 | ENTRA | location → Anticamera Santuario (N8) |
| 6 | AVANTI/ENTRA | location → Santuario Centrale |
| 7 | PARLA CON ANZIANO | gameOver → epilogo |

---

## Bug trovati e risolti

### Bug 1 — N2 monologo bypassabile [v1.1.34]
**Stanza:** arcaBiologica.ts
**Problema:** Il comando di stanza N2 intercettava `esamina cadavere/corpo/figura/astronauta` ma non `forma`, `forma immobile`, `resti`, `alieno`, `creatura` — alias presenti nella descrizione della stanza e coperti da un secondo handler preesistente. Prima visita via questi alias → monologo saltato, flag `cadavereEsaminatoFirst` non impostato.
**Fix:** Regex esteso per coprire tutti gli alias del corpo.

### Bug 2 — Disco di Pietra puntava alla porta ovest [v1.1.35]
**Stanza:** scriptorium.ts
**Problema:** La descrizione base del Disco di Pietra diceva "simboli uguali alla porta a Ovest nel corridoio principale." Il Disco va invece sull'Altare del Santuario del Silenzio. Il giocatore poteva dedurre erroneamente che il Disco servisse per la porta ovest.
**Fix:** Testo corretto: "li hai visti sull'altare di pietra nera nella sala da cui vieni."

### Bug 3 — Postazione del Comandante — testo prematuro [v1.1.36]
**Stanza:** ponteDiComando.ts
**Problema:** `onUse` della Postazione diceva sempre "Riconosce che hai riunito l'eredità della nave" anche se i tre artefatti non erano stati posizionati sulla porta. Attivabile in qualsiasi momento.
**Fix:** Testo condizionale su `state.flags.isWestDoorUnlocked`. Senza artefatti: "la console reagisce — non alle tue credenziali, ma alla tua presenza."

### Bug 4 — Attivazione Cristallo Dati — solo nel Corridoio [v1.1.37]
**Stanza:** corridoioPrincipale.ts / gameLogic.ts
**Problema:** `USA DISPOSITIVO SU CRISTALLO` era un Room Command del Corridoio Principale. Il giocatore che raccoglieva entrambi gli item nell'Arca Biologica e tentava di attivarli lì riceveva un fallimento silenzioso (item system cercava il cristallo nella stanza, non in inventario).
**Fix:** Logica promossa a comando globale in `processCommand` di gameLogic.ts, prima dei Room Commands. Rimosso il comando ridondante da corridoioPrincipale.ts.

---

## Osservazioni architetturali (non critiche, non corrette)

Nessuna osservazione residua. Tutti i problemi individuati sono stati risolti nelle versioni v1.1.34–v1.1.37.

---

*Verifica eseguita il 2026-03-21 · Il Relitto Silente Project*
