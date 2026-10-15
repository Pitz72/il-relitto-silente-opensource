// Le prove delle pagine del diario (src/gioco/diario/pagine.ts).
//   node --test prove/diario.test.ts        (da app/)
// La cronaca vera la prova collaudo/diario.py; qui le pagine, su voci fatte a mano.
import { test } from "node:test";
import assert from "node:assert/strict";
import { allaMatrice, pagine, pagineAperte, titoloPagina, TRACCE } from "../src/gioco/diario/pagine.ts";
import type { VoceCronaca } from "../src/motore/tipi.ts";

let n = 0;
function voce(v: Partial<VoceCronaca> = {}): VoceCronaca {
  n++;
  return {
    chiave: n,
    comando: `comando ${n}`,
    eventi: [{ tipo: "testo", testo: `Turno ${n}.` }],
    differenza: null,
    stanza: "plancia",
    nome_stanza: "plancia",
    atto: 1,
    titolo_atto: "Il margine",
    turno: n,
    tracce: [],
    voce: false,
    lettura: null,
    reperti: [],
    iniziali: false,
    ...v,
  };
}

test("all'inizio c'è solo la trascrizione", () => {
  const p = pagine([voce(), voce()]);
  assert.deepEqual(pagineAperte(p), ["trascrizione"]);
  assert.equal(p.fascicolo.tracce.length, 0);
});

test("le tracce di L.V. stanno nell'ordine della sua strada, non in quello in cui le trovi", () => {
  const cronaca = [voce({ tracce: ["uomo"] }), voce(), voce({ tracce: ["giuntura"] }), voce({ tracce: ["cavo"] })];
  const p = pagine(cronaca);
  assert.deepEqual(p.fascicolo.tracce.map((t) => t.id), ["giuntura", "cavo", "uomo"]);
  assert.equal(p.fascicolo.tracce[0].voce, cronaca[2]);
  // nessun posto vuoto per le tracce che mancano: non si dice quante sono
  assert.equal(p.fascicolo.tracce.length, 3);
  assert.deepEqual(TRACCE.map((t) => t.id), ["giuntura", "tacche", "cavo", "uomo", "voce"]);
});

test("il fascicolo si chiama L.V. solo dopo la placca", () => {
  const prima = pagine([voce({ tracce: ["giuntura"] })]);
  assert.equal(titoloPagina("fascicolo", prima), "Prima di te");
  const dopo = pagine([voce({ tracce: ["giuntura"] }), voce({ iniziali: true })]);
  assert.equal(titoloPagina("fascicolo", dopo), "L.V.");
  assert.deepEqual(pagineAperte(dopo), ["trascrizione", "fascicolo"]);
});

test("le voci ascoltate, nell'ordine in cui le hai sentite", () => {
  const cronaca = [voce({ voce: true }), voce(), voce({ voce: true })];
  const p = pagine(cronaca);
  assert.deepEqual(p.voci, [cronaca[0], cronaca[2]]);
  assert.deepEqual(pagineAperte(p), ["trascrizione", "voci"]);
});

test("ogni iscrizione nella lettura con la matrice più avanti; a pari matrice, l'ultima", () => {
  const leggi = (cosa: string, matrice: number) => voce({ lettura: { cosa, nome: `il ${cosa}`, matrice } });
  const cronaca = [leggi("bassorilievo", 0), leggi("globo olografico", 18), leggi("bassorilievo", 75), leggi("bassorilievo", 18), leggi("globo olografico", 18)];
  const p = pagine(cronaca);
  assert.deepEqual(
    p.traduzioni.iscrizioni.map((l) => [l.cosa, l.matrice, l.voce.chiave]),
    [
      ["bassorilievo", 75, cronaca[2].chiave],
      ["globo olografico", 18, cronaca[4].chiave],
    ],
  );
  assert.deepEqual(pagineAperte(p), ["trascrizione", "traduzioni"]);
});

test("i reperti, nell'ordine in cui li hai decifrati", () => {
  const cronaca = [voce({ reperti: [{ cosa: "stele", nome: "la stele" }] }), voce({ reperti: [{ cosa: "nucleo", nome: "il nucleo" }] })];
  assert.deepEqual(pagine(cronaca).traduzioni.reperti.map((r) => r.cosa), ["stele", "nucleo"]);
});

test("la preposizione della matrice", () => {
  assert.equal(allaMatrice(0), "allo 0%");
  assert.equal(allaMatrice(4), "al 4%");
  assert.equal(allaMatrice(18), "al 18%");
  assert.equal(allaMatrice(75), "al 75%");
  assert.equal(allaMatrice(100), "al 100%");
  assert.equal(allaMatrice(8), "all’8%");
});
