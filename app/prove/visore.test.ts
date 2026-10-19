// Le prove della mappa del visore (src/gioco/visore/mappa.ts) e delle scansioni del relitto (src/gioco/visore/scansioni/).
//   node --test prove/visore.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { costellazione, POSIZIONI } from "../src/gioco/visore/mappa.ts";
import type { StanzaMappa } from "../src/motore/tipi.ts";
import { existsSync } from "node:fs";
import { STANZE as SCANSIONI } from "../src/gioco/visore/scansioni/stanze.ts";
import { ALTO, LARGO } from "../src/gioco/visore/scansioni/disegno.ts";

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

// ---- le viste delle stanze (revisione 25, E1) ----------------------------------------------------------
const DI_BORDO = ["plancia", "stiva", "cuccetta", "sala macchine", "scafo"];

test("ogni stanza ha la sua vista: la telecamera di bordo sulla Santa Maria, una scansione nel relitto", () => {
  for (const nome of STANZE) {
    if (DI_BORDO.includes(nome)) continue;
    assert.ok(SCANSIONI[nome], `${nome} non ha una scansione`);
  }
  assert.deepEqual(Object.keys(SCANSIONI).sort(), STANZE.filter((n) => !DI_BORDO.includes(n)).sort());
  for (const f of ["intro/plancia.webp", "viste/cuccetta.webp", "viste/stiva.webp", "viste/sala-macchine.webp", "viste/scafo.webp"])
    assert.ok(existsSync(new URL(`../public/${f}`, import.meta.url)), `manca ${f}`);
});

test("le scansioni: ogni variante si disegna, dentro la cornice, sempre uguale, in fretta", () => {
  for (const [nome, def] of Object.entries(SCANSIONI)) {
    for (const [variante, stati] of Object.entries(def.varianti)) {
      const t0 = performance.now();
      const strati = def.disegna(stati);
      const ms = performance.now() - t0;
      const chi = `${nome} · ${variante}`;
      assert.ok(ms < 250, `${chi}: ${ms.toFixed(0)} ms`);
      assert.ok(strati.length > 3, `${chi}: quasi vuota`);
      const punti = strati.filter((s) => s.tipo === "punti").reduce((n, s) => n + (s.tipo === "punti" ? s.d.join("").split("M").length - 1 : 0), 0);
      assert.ok(punti > 300 && punti < 12000, `${chi}: ${punti} punti`);
      for (const s of strati) {
        const testo = JSON.stringify(s);
        assert.ok(!/NaN|Infinity/.test(testo), `${chi}: un numero che non è un numero in ${s.tipo}`);
        if (s.tipo === "alone" || s.tipo === "marca") assert.ok(s.x > -200 && s.x < LARGO + 200 && s.y > -200 && s.y < ALTO + 200, `${chi}: ${s.tipo} fuori`);
      }
      assert.deepEqual(def.disegna(stati), strati, `${chi}: non si ridisegna uguale`);
      assert.ok(def.descrizione(stati).length > 20, `${chi}: senza descrizione`);
    }
  }
});

test("le scansioni cambiano con lo stato che le cambia, e la chiave lo dice", () => {
  const cambia = (nome: string, a: object, b: object) => {
    const def = SCANSIONI[nome];
    assert.notDeepEqual(def.disegna(a), def.disegna(b), `${nome}: lo stato non cambia il disegno`);
    assert.notEqual(def.chiave(a), def.chiave(b), `${nome}: la chiave non cambia`);
    assert.notEqual(def.descrizione(a), def.descrizione(b), `${nome}: la descrizione non cambia`);
  };
  cambia("vestibolo delle gole", { risuonatore: "incastrato" }, { risuonatore: "staccato" });
  cambia("serra morente", { teca: "sigillata" }, { teca: "svuotata" });
  cambia("arca della memoria", { archivio: "intatto" }, { archivio: "forzato" });
  cambia("ponte di comando", {}, { proiezione: "attiva" });
  cambia("corridoio principale", {}, { grande_porta: "aperta" });
  cambia("sala delle teche", {}, { bengala: "acceso" });
  cambia("santuario centrale", {}, { fuga: "iniziata" });
});
