// Le prove della scaletta dell'intro: i tempi sono quelli della regola di lettura (§2.1 di
// 09-intro-storyboard.md, strumenti/intro/tempi.py), allungati dalla voce di L.V. (§13, 29 ottobre 2026).
//   node --test prove/intro.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANTICIPO_VOCE, SCALETTA, VOCE, fermoPer, opacitaBlocco, pezziDellaVoce, scenaA } from "../src/intro/scaletta.ts";

const blocco = (id: string) => SCALETTA.blocchi.find((b) => b.id === id)!;

test("la durata: 2:59,13 (era 2:40,75 prima della voce di L.V.)", () => {
  assert.equal(SCALETTA.durata, 179.13);
});

test("la regola di lettura: 0,35 s per parola più 2, mai meno di 4", () => {
  assert.deepEqual(fermoPer("Ci tenevo tanto."), { fermo: 4, parole: 3 });
  assert.deepEqual(fermoPer("i numeri mi arrivano tardi, uno alla volta, e lo so cosa vuol dire."), { fermo: 6.9, parole: 14 });
});

test("i testi entrano, sono pieni ed escono quando dicono la regola e la voce", () => {
  const attesi: Record<string, [number, number, number]> = {
    B0: [3.0, 4.2, 10.7], B1: [11.6, 12.8, 25.21], B2: [26.11, 27.31, 37.98], B3: [38.88, 40.08, 55.97],
    B4: [45.59, 46.79, 55.97], B5: [62.47, 63.67, 78.4], B6: [72.2, 73.4, 78.4], B7: [124.7, 125.9, 131.0],
    B8: [131.6, 132.8, 139.11], B9: [139.71, 140.91, 148.78], B10: [149.38, 150.58, 155.58], T: [161.38, 162.58, 170.13],
  };
  for (const [id, [entra, pieno, via]] of Object.entries(attesi)) {
    const b = blocco(id);
    assert.deepEqual([b.entra, b.pieno, b.via], [entra, pieno, via], id);
  }
});

test("le scene cominciano dove dice la scaletta", () => {
  const inizi = Object.fromEntries(SCALETTA.scene.map((s) => [s.id, s.inizio]));
  assert.deepEqual(inizi, { A: 0, B: 58.97, C: 79.4, D: 92.2, E: 101.2, F: 124.7, G: 156.58, H: 170.13 });
  assert.equal(scenaA(85).id, "C");
  assert.equal(scenaA(200).id, "H");
});

test("un blocco che continua la frase attenua quello sopra, ed escono insieme", () => {
  const b3 = blocco("B3");
  assert.equal(opacitaBlocco(b3, 42), 1);
  assert.ok(opacitaBlocco(b3, 48) < 0.7 && opacitaBlocco(b3, 48) > 0.5);
  assert.equal(opacitaBlocco(b3, 56.0), 0);
});

test("i sottotitoli dei suoni stanno dentro l'intro e in ordine", () => {
  let prima = 0;
  for (const s of SCALETTA.sottotitoli) {
    assert.ok(s.inizio >= prima - 0.01 && s.fine > s.inizio && s.fine <= SCALETTA.durata, s.testo);
    prima = s.inizio;
  }
});

test("la scala dura 23,5 s e si ferma a 23", () => {
  assert.deepEqual(SCALETTA.momenti.scala, [101.2, 124.7]);
  assert.equal(SCALETTA.momenti.scalaFerma, 124.2);
});

test("la voce di L.V.: ogni frase comincia con il suo testo, e il testo resta finché l'ha detta", () => {
  const pezzi = pezziDellaVoce();
  assert.equal(pezzi.length, 7, "sette pezzi: B1, B2, B3 con B4, B5 con B6, B7, B8, B9");
  for (const b of SCALETTA.blocchi) {
    const v = VOCE[b.id as keyof typeof VOCE];
    if (!v) continue;
    // il pezzo che contiene questo blocco: il suo, o quello del blocco sopra
    const p = b.pezzo ?? blocco(b.sottoA!).pezzo!;
    if (b.pezzo) assert.equal(p.t, Math.round((b.entra + ANTICIPO_VOCE) * 100) / 100, `${b.id}: la voce non comincia con il testo`);
    const prima = p.t + (v.parola - p.da), ultima = p.t + (v.fine - p.da);
    assert.ok(prima >= b.entra, `${b.id}: la prima parola arriva prima del testo`);
    assert.ok(ultima + 0.79 <= b.esce, `${b.id}: il testo comincia a uscire prima dell'ultima parola`);
    // e il pezzo finisce prima che il testo se ne sia andato
    assert.ok(p.t + (p.a - p.da) <= b.via + 0.01, `${b.id}: la voce va oltre il suo testo`);
  }
});

test("la musica entra quando si apre lo spazio", () => {
  const m = SCALETTA.momenti;
  assert.ok(m.tema > m.stella[0] && m.tema < m.naveB, `il tema a ${m.tema} s`);
});
