// Le prove della modalità a solo testo (progettazione/18-modalita-solo-testo.md):
// le parole che sono dell'app, e il testo che i pulsanti nascondevano.
//   node --test prove/scritti.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { interpreta } from "../src/gioco/scritti/comandiApp.ts";
import { blocchiDelTurno, nascosto } from "../src/gioco/lamina/grammatica.ts";
import type { Evento } from "../src/motore/tipi.ts";

test("le parole dell'app: salva e carica, con o senza posto", () => {
  assert.deepEqual(interpreta("salva"), { tipo: "salva", posto: null, capito: true });
  assert.deepEqual(interpreta("SALVA 3"), { tipo: "salva", posto: "3", capito: true });
  assert.deepEqual(interpreta("salva nel posto 2."), { tipo: "salva", posto: "2", capito: true });
  assert.deepEqual(interpreta("carica 6"), { tipo: "carica", posto: "6", capito: true });
  assert.deepEqual(interpreta("carica automatico"), { tipo: "carica", posto: "automatico", capito: true });
  // il salvataggio su file del motore («salva mattina») non c'è nell'app: si spiega
  assert.deepEqual(interpreta("salva mattina"), { tipo: "salva", posto: null, capito: false });
});

test("le altre parole dell'app", () => {
  assert.deepEqual(interpreta("diario"), { tipo: "diario" });
  assert.deepEqual(interpreta("Trascrizione"), { tipo: "diario" });
  assert.deepEqual(interpreta("opzioni"), { tipo: "opzioni" });
  assert.deepEqual(interpreta("menu"), { tipo: "menu" });
  assert.deepEqual(interpreta("tasti"), { tipo: "tasti" });
  assert.deepEqual(interpreta("aiuto"), { tipo: "aiuto" });
  assert.deepEqual(interpreta("ricomincia"), { tipo: "ricomincia" });
});

test("tutto il resto è del motore: i verbi, i movimenti, 'esci' (che in una stanza è un movimento)", () => {
  for (const c of ["esamina la radio", "x radio", "prendila", "nord", "esci", "annulla", "ancora", "inventario", "analizza la nave aliena", "diario di bordo", "ricomincia da capo", "menu del giorno", ""])
    assert.equal(interpreta(c), null, `«${c}» dovrebbe andare al motore`);
});

const ev = (tipo: Evento["tipo"], testo: string): Evento => ({ tipo, testo });

test("a solo testo l'elenco, le risposte e le domande del motore restano nel testo", () => {
  const eventi = [ev("intestazione", "IL RELITTO"), ev("elenco", "Puoi vedere qui: una radio."), ev("opzione", "1. Mi serve credito."), ev("domanda", "Vuoi ricominciare?")];
  // con i pulsanti li mostrano il ramo, i semi e la conferma
  assert.equal(blocchiDelTurno(eventi).length, 0);
  assert.ok(eventi.slice(1).every((e) => nascosto(e)));
  // a solo testo si leggono (l'intestazione è dell'intro, sempre)
  const b = blocchiDelTurno(eventi, { soloTesto: true });
  assert.equal(b.length, 3);
  assert.equal(nascosto(eventi[0], true), true);
  assert.ok(eventi.slice(1).every((e) => !nascosto(e, true)));
});

test("a solo testo anche i messaggi che chiedono di scrivere un comando restano", () => {
  const e = ev("sistema", "Scrivi CARICA per ripartire da un salvataggio.");
  assert.equal(nascosto(e), true);
  assert.equal(nascosto(e, true), false);
});
