# Referto — Simulazione integrale del gioco

**Data:** 2026-06-01 · **Versione verificata:** 1.5.1 · **Esito:** ✓ TUTTO CONNESSO

Questo documento registra la verifica end-to-end eseguita per chiudere il progetto in
vista della pubblicazione. Il gioco è stato **giocato davvero** dall'inizio alla fine,
non solo ispezionato: il motore (`processCommand`, funzione pura) è stato guidato da un
harness attraverso l'intera avventura e ogni transizione di stato è stata verificata.

## Metodo

- **Simulazione dinamica** — `gioco/sim/playthrough.ts`. Guida il motore lungo il
  critical path **e** tutto il contenuto opzionale, con assert su location, inventario,
  flag e testo a ogni passo. Compilato a CommonJS (`tsc -p sim/tsconfig.sim.json`) ed
  eseguito con Node. Riproducibile in qualsiasi momento come test di non-regressione.
- **Micro-test di branch** — 9 controlli su stati isolati per i rami che un walkthrough
  lineare non separa (gate di sicurezza, soglie, blocchi).
- **Audit statico** — lettura incrociata delle 15 stanze: destinazioni di movimento,
  raggiungibilità, item ottenibili, flag morti, collisioni di sinonimi.

## Risultato della simulazione dinamica

```
Passi eseguiti:        104
Stanze visitate:       15/15
Echi di superficie:    11/11
Echi profondi:         4/4
Traduzione:            100%
Tracce INCIDI:         3/3
Stato finale:          Santuario Centrale (finale raggiunto)
VALUTAZIONE:           CUSTODE DELLA MEMORIA (punteggio massimo)
FALLIMENTI:            0
```

Copertura confermata:
- **Critical path completo**: Plancia → Stiva → Scafo → Camera → Corridoio → (Serra,
  Arca Biologica, Alloggi, Laboratori, Santuario del Silenzio, Scriptorium, Arca della
  Memoria) → Porta Ovest → Ponte → Anticamera → Santuario Centrale → finale.
- **3 chiavi** (Seme, Stele, Nucleo) ottenute e inserite; porta finale aperta.
- **Sotto-quest energia**: Dispositivo+Cristallo → Cristallo Attivato → macchinari →
  `isPowerRestored` → console del Ponte → mappa stellare. (Smentisce il falso positivo
  dell'audit statico: il Cristallo Attivato È generato, da comando globale.)
- **WS1 — TRADUCI**: testato a tutte le soglie (<18 muto, 18–74 frammenti, 75 pieno,
  100 con riga nascosta) su bassorilievi, proiettori, lastra, mappa.
- **WS2 — echi**: 11/11 di superficie (inclusi i 3 retroattivi sigillati: Plancia,
  Stiva, Camera) + 4/4 profondi (Laboratori a 75%, Serra dopo Seme, Alloggi dopo
  Cilindro, Santuario del Silenzio a 100%), con segnalazione quando lo strato è bloccato.
- **WS3 — INCIDI**: 3/3 tracce (Corridoio, Arca accanto a L.V., Santuario del
  Silenzio); paragrafo della catena presente nell'epilogo, con nome L.V.
- **WS5**: la Porta a Tre Punte è apribile anche deducendo i «tre soli» dalla Stele;
  resta gated da `isHologramActive` (energia obbligatoria preservata).

## Micro-test di branch (9/9 superati)

| Test | Stato | Atteso |
|---|---|---|
| WS5 gate energia | knowsTrinary, ¬hologram | porta NON si apre, «pannello morto» |
| WS5 senza sapere | ¬knowsTrinary, hologram | «non sai la combinazione» |
| WS5 Stele-only | knowsTrinary, hologram | porta si apre (mappa non richiesta) |
| WS1 TRADUCI <18 | tp=4 | «le parole restano chiuse» |
| WS1 TRADUCI mappa spenta | ¬hologram | «nessuna mappa» |
| WS3 INCIDI senza taglierina | inventario vuoto | rifiuto, nessuna traccia |
| WS3 INCIDI Arca senza esame | ¬cadavereEsaminato | rifiuto, nessuna traccia |
| Input ignoto | "qwerty zxcvb" | «Non capisco» senza crash |

## Audit statico (connettività)

- Destinazioni di movimento: **tutte valide** (chiavi esatte di `gameData`).
- Raggiungibilità: **15/15 stanze raggiungibili**; uscite a senso unico solo dove
  volute (discesa iniziale, B11) — by design.
- Item raccoglibili: **tutti ottenibili**.
- Flag morti / contraddizioni: nessuna reale.
- Collisioni di sinonimi: nessuna (lastra/tavoletta/stele già disambiguati in B21).
- *Unico "critico" segnalato* (Cristallo Attivato mai generato): **falso positivo**,
  smentito dalla simulazione dinamica — l'attivazione è un comando globale.

## Difetti trovati e corretti in questa sessione (→ v1.5.1)
1. Fuzzy che auto-suggeriva il comando già corretto.
2. `ESAMINA/GUARDA <nome stanza>` non gestito.
3. Epilogo che non nominava L.V. pur avendone i dati.

## Annotazione per la documentazione (prossima sessione)
`docs/giocatore/SOLUZIONE.md` (ferma alla 1.2.5) è disallineata: echi Anticamera↔Plancia
invertiti, e nessuna copertura di TRADUCI / echi profondi / INCIDI.

## Come rieseguire la verifica
```
cd gioco
npx tsc -p sim/tsconfig.sim.json
printf '{"type":"commonjs"}' > sim/build/package.json
node sim/build/sim/playthrough.js
```
Exit code 0 e «RISULTATO: ✓ TUTTO CONNESSO» = gioco integro.
