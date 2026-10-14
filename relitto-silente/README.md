# Il Relitto Silente — remake

Avventura testuale in FAVELLA 1 (motore 1.4.4), di Simone Pizzi. Ispirata a «Il Relitto», racconto
primo di *Dal registro della Santa Maria*.

Intorno al 2201. Sei William T. Eriksonn, unico abitante della Santa Maria, cargo TSC-1972. La stiva
è vuota da sei settimane e Yusuf non ti fa più credito. Sulla rotta c’è una massa che beve il
radar. Ci sali per tagliarne un pezzo da vendere. Dentro trovi una nave cresciuta invece che
costruita, che parla ancora, e un uomo arrivato prima di te.

## Come si gioca

Dalla radice del progetto:

```bash
python motore/favella.py gioca relitto-silente/relitto.fav
```

Oltre ai comandi soliti (direzioni, `esamina`, `prendi`, `usa X su Y`, `parla con`, `inventario`,
`guarda`, `annulla`, `salva`), il gioco usa: `analizza` (lo scanner), `traduci` (la matrice),
`sintonizza` (il Sintonizzatore), `incidi`, `tocca`, `ascolta`, `stacca`, `accosta`, `spara`,
`abbassa` e `alza` (il faro), `segui la parete`, `gira`, `suona`, `firma`, `completa`, `ricarica la
tuta`, `rientra`, `entra`.

Ascoltare e tradurre costano aria: la cifra è sul visore (`esamina il visore`). Sotto il 30%, prima
della fuga, la tuta entra in protezione vitale: niente ascolti né traduzioni, e il faro resta al
minimo finché non le dai altra aria. Prima della fuga si muore solo portando il risuonatore.

## Mappa

```
SANTA MARIA      Cuccetta
                    │
 Sala macchine ─ Stiva ─ Plancia (inizio)
                    │ fuori
RELITTO           Scafo
                    │ giù
                  Camera di compensazione
                    │ ovest
 Corridoio ──── Vestibolo delle gole
 principale         │ giù
                  Gola di mezzo
                    │ giù
       Vivaio ─── Sala delle teche ─ ─ Gola del ritorno (solo nella fuga) ─ ─ Santuario centrale

Dal Corridoio: nord Santuario del silenzio (→ Scriptorium → Arca della memoria), sud Serra morente
(→ Arca biologica), giù Laboratorio, nordest Alloggio (→ Nido), ovest Ponte (→ Anticamera →
Santuario centrale).
```

## Moduli

| File | Contenuto |
|---|---|
| `relitto.fav` | Orchestratore: titolo, prologo, stati globali, direzioni, topologia |
| `aria.fav` | L’aria della tuta: consumi e soglie (incluso per penultimo, così vede tutto quello che il turno ha tolto) |
| `santamaria.fav` | Atto I — la Santa Maria, Yusuf |
| `ingresso.fav` | Atto II — scafo, camera, vestibolo, gola di mezzo |
| `corridoio.fav`, `vita.fav`, `tecnica.fav`, `equipaggio.fav`, `memoria.fav` | Atto III — il corridoio e le quattro ali |
| `ponte.fav` | Atto IV — il Ponte, l’Anziano |
| `fuga.fav` | Atto V — la fuga |
| `traduci.fav`, `echi.fav` | La matrice di traduzione, il Sintonizzatore |
| `finali.fav` | I sei finali |

Il progetto completo (mappa, decisioni, collaudo) è in `../progettazione/`. Le soluzioni dei finali
sono in `../collaudo/`, con le prove di non regressione (`python collaudo/regressioni.py`). L’originale intatto è in `../motore/esempi/demo/relitto-silente/`.
