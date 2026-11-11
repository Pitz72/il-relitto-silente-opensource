// Le prove dell'apparizione dell'Anziano (src/gioco/dialogo/apparizione.ts).
//   node --test prove/apparizione.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DURATA } from "../src/gioco/dialogo/apparizione.ts";
import { OPZIONI_DI_BASE, QUALITA } from "../src/stile/opzioni.ts";

test("al primo incontro la figura è finita quando comincia la voce (lo stesso numero del motore audio)", () => {
  const rust = readFileSync(new URL("../src-tauri/src/mondo/musica.rs", import.meta.url), "utf8");
  const voce = /const CANTO_VOCE: f32 = ([0-9.]+);/.exec(rust);
  assert.ok(voce, "mondo/musica.rs dice ancora quando entra la voce dopo il canto (CANTO_VOCE)");
  assert.equal(DURATA.primo, Number(voce[1]), "le parole compaiono quando l'Anziano comincia a parlare");
});

test("le volte dopo l'apparizione è breve", () => {
  assert.ok(DURATA.ritorno > 0 && DURATA.ritorno <= DURATA.primo / 2);
});

test("la dissolvenza è un gesto lento, ma non tiene ferme le parole più di sette secondi", () => {
  assert.ok(DURATA.dissolvenza > DURATA.primo && DURATA.dissolvenza <= 7);
});

test("i nodi senza la figura sono quelli della storia", () => {
  const fav = readFileSync(new URL("../../relitto-silente/ponte.fav", import.meta.url), "utf8");
  const componente = readFileSync(new URL("../src/gioco/dialogo/Dialogo.tsx", import.meta.url), "utf8");
  const nodi = /const SENZA_FIGURA = \[([^\]]+)\]/.exec(componente);
  assert.ok(nodi, "Dialogo.tsx dice in quali nodi l'Anziano non c'è più");
  for (const n of nodi[1].split(",").map((x) => x.trim().replace(/"/g, ""))) assert.ok(fav.includes(`al nodo "${n}" dice`), `il nodo «${n}» c'è ancora in ponte.fav`);
});

test("le apparizioni sono un effetto della scheda Grafica: accese di base, spente nel livello essenziale", () => {
  assert.equal(OPZIONI_DI_BASE.apparizioni, true);
  assert.equal(QUALITA.piena.apparizioni, true);
  assert.equal(QUALITA.leggera.apparizioni, true);
  assert.equal(QUALITA.essenziale.apparizioni, false);
});
