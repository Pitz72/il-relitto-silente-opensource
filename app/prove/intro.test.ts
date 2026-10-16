// Le prove della scaletta dell'intro: i tempi sono quelli di strumenti/intro/tempi.py
// e della tabella del §2.1 di 09-intro-storyboard.md.
//   node --test prove/intro.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { SCALETTA, buchiDellaTraccia, fermoPer, opacitaBlocco, scenaA } from "../src/intro/scaletta.ts";

const blocco = (id: string) => SCALETTA.blocchi.find((b) => b.id === id)!;

test("la durata è quella dello storyboard: 2:40,75", () => {
  assert.equal(SCALETTA.durata, 160.75);
});

test("la regola di lettura: 0,35 s per parola più 2, mai meno di 4", () => {
  assert.deepEqual(fermoPer("Ci tenevo tanto."), { fermo: 4, parole: 3 });
  assert.deepEqual(fermoPer("i numeri mi arrivano tardi, uno alla volta, e lo so cosa vuol dire."), { fermo: 6.9, parole: 14 });
});

test("i testi entrano, sono pieni ed escono quando dice la tabella (tempi.py)", () => {
  const attesi: Record<string, [number, number, number]> = {
    B0: [3.0, 4.2, 10.7], B1: [11.6, 12.8, 19.3], B2: [20.2, 21.4, 26.85], B3: [27.75, 28.95, 42.85],
    B4: [33.75, 34.95, 42.85], B5: [49.35, 50.55, 62.6], B6: [56.4, 57.6, 62.6], B7: [108.9, 110.1, 115.2],
    B8: [115.8, 117.0, 123.15], B9: [123.75, 124.95, 130.4], B10: [131.0, 132.2, 137.2], T: [143.0, 144.2, 151.75],
  };
  for (const [id, [entra, pieno, via]] of Object.entries(attesi)) {
    const b = blocco(id);
    assert.deepEqual([b.entra, b.pieno, b.via], [entra, pieno, via], id);
  }
});

test("le scene cominciano dove dice la scaletta", () => {
  const inizi = Object.fromEntries(SCALETTA.scene.map((s) => [s.id, s.inizio]));
  assert.deepEqual(inizi, { A: 0, B: 45.85, C: 63.6, D: 76.4, E: 85.4, F: 108.9, G: 138.2, H: 151.75 });
  assert.equal(scenaA(70).id, "C");
  assert.equal(scenaA(200).id, "H");
});

test("un blocco che continua la frase attenua quello sopra, ed escono insieme", () => {
  const b3 = blocco("B3");
  assert.equal(opacitaBlocco(b3, 30), 1);
  assert.ok(opacitaBlocco(b3, 36) < 0.7 && opacitaBlocco(b3, 36) > 0.5);
  assert.equal(opacitaBlocco(b3, 42.9), 0);
});

test("i sottotitoli dei suoni stanno dentro l'intro e in ordine", () => {
  let prima = 0;
  for (const s of SCALETTA.sottotitoli) {
    assert.ok(s.inizio >= prima - 0.01 && s.fine > s.inizio && s.fine <= SCALETTA.durata, s.testo);
    prima = s.inizio;
  }
});

test("la scala dura 23,5 s e si ferma a 23", () => {
  assert.deepEqual(SCALETTA.momenti.scala, [85.4, 108.9]);
  assert.equal(SCALETTA.momenti.scalaFerma, 108.4);
});

test("i buchi della traccia: un quarto di secondo fra una frase e l'altra, mai su una parola", () => {
  const buchi = buchiDellaTraccia(SCALETTA);
  assert.ok(buchi.length >= 5, `pochi buchi: ${buchi.length}`);
  for (const t of buchi) {
    const scena = scenaA(t).id;
    assert.ok(scena === "A" || scena === "F", `il buco a ${t} s è nella scena ${scena}`);
    // nessun testo visibile (neanche un poco) nel quarto di secondo del buco
    for (const b of SCALETTA.blocchi) {
      for (const x of [t, t + 0.25]) assert.equal(opacitaBlocco(b, x), 0, `il buco a ${t} s cade sul blocco ${b.id}`);
    }
  }
});
