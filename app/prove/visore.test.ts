// Le prove della mappa del visore (src/gioco/visore/mappa.ts).
//   node --test prove/visore.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { costellazione, POSIZIONI } from "../src/gioco/visore/mappa.ts";
import type { StanzaMappa } from "../src/motore/tipi.ts";

// le 23 stanze del gioco (relitto-silente/README.md)
const STANZE = [
  "plancia", "stiva", "cuccetta", "sala macchine", "scafo", "camera di compensazione", "vestibolo delle gole",
  "corridoio principale", "gola di mezzo", "sala delle teche", "vivaio", "santuario del silenzio", "serra morente",
  "laboratorio di risonanza", "alloggio dell'equipaggio", "ponte di comando", "scriptorium", "arca della memoria",
  "arca biologica", "nido", "anticamera", "santuario centrale", "gola del ritorno",
];

test("ogni stanza del gioco ha il suo posto, e due stanze non si sovrappongono", () => {
  assert.equal(STANZE.length, 23);
  for (const s of STANZE) assert.ok(POSIZIONI[s], `manca ${s}`);
  const posti = STANZE.map((s) => POSIZIONI[s]);
  for (let i = 0; i < posti.length; i++)
    for (let j = i + 1; j < posti.length; j++)
      assert.ok(Math.hypot(posti[i][0] - posti[j][0], posti[i][1] - posti[j][1]) >= 12, `${STANZE[i]} e ${STANZE[j]} troppo vicine`);
  for (const [x, y] of posti) assert.ok(x >= 8 && x <= 302 && y >= 6 && y <= 94, "dentro il riquadro 310 × 100");
});

test("la bussola: ovest a sinistra, nord in alto", () => {
  assert.ok(POSIZIONI.stiva[0] < POSIZIONI.plancia[0], "la stiva è a ovest della plancia");
  assert.ok(POSIZIONI.cuccetta[1] < POSIZIONI.plancia[1], "la cuccetta è a nord");
  assert.ok(POSIZIONI["corridoio principale"][0] < POSIZIONI["vestibolo delle gole"][0]);
  assert.ok(POSIZIONI["santuario del silenzio"][1] < POSIZIONI["corridoio principale"][1]);
});

test("i passaggi solo fra stanze viste; verso quelle mai viste, un moncone", () => {
  const mappa: Record<string, StanzaMappa> = {
    plancia: { nome: "La plancia", atto: 1, uscite: { nord: null, ovest: "stiva" } },
    stiva: { nome: "la stiva", atto: 1, uscite: { est: "plancia", fuori: null, "giù": null } },
  };
  const c = costellazione(mappa, "stiva");
  assert.deepEqual(c.stanze.map((s) => [s.id, s.qui]), [["plancia", false], ["stiva", true]]);
  assert.equal(c.passaggi.length, 1, "plancia e stiva, una volta sola");
  assert.equal(c.monconi.length, 3, "la cuccetta, lo scafo, la sala macchine: non ancora viste");
});
