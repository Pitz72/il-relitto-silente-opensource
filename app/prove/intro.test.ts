// Le prove della scaletta dell'intro: i tempi sono quelli della regola di lettura (§2.1 di
// 09-intro-storyboard.md, strumenti/intro/tempi.py), allungati dalla voce di L.V. (§13, 29 ottobre 2026).
//   node --test prove/intro.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANTICIPO_VOCE, SCALETTA, VOCE, fermoPer, opacitaBlocco, pezziDellaVoce, scenaA } from "../src/intro/scaletta.ts";

const blocco = (id: string) => SCALETTA.blocchi.find((b) => b.id === id)!;

test("la durata: 3:02,12 (era 2:40,75 prima della voce di L.V.)", () => {
  assert.equal(SCALETTA.durata, 182.12);
});

test("la regola di lettura: 0,35 s per parola più 2, mai meno di 4", () => {
  assert.deepEqual(fermoPer("Ho insistito io."), { fermo: 4, parole: 3 });
  assert.deepEqual(fermoPer("i numeri mi arrivano tardi, uno alla volta, e lo so cosa vuol dire."), { fermo: 6.9, parole: 14 });
});

test("i testi entrano, sono pieni ed escono quando dicono la regola e la voce", () => {
  const attesi: Record<string, [number, number, number]> = {
    B0: [3.0, 4.2, 10.7], B1: [11.6, 12.8, 25.15], B2: [26.05, 27.25, 36.9], B3: [37.8, 39.0, 57.15],
    B4: [50.03, 51.23, 57.15], B5: [63.65, 64.85, 78.18], B6: [71.98, 73.18, 78.18], B7: [124.48, 125.68, 132.97],
    B8: [133.57, 134.77, 141.34], B9: [141.94, 143.14, 151.77], B10: [152.37, 153.57, 158.57], T: [164.37, 165.57, 173.12],
  };
  for (const [id, [entra, pieno, via]] of Object.entries(attesi)) {
    const b = blocco(id);
    assert.deepEqual([b.entra, b.pieno, b.via], [entra, pieno, via], id);
  }
});

test("le scene cominciano dove dice la scaletta", () => {
  const inizi = Object.fromEntries(SCALETTA.scene.map((s) => [s.id, s.inizio]));
  assert.deepEqual(inizi, { A: 0, B: 60.15, C: 79.18, D: 91.98, E: 100.98, F: 124.48, G: 159.57, H: 173.12 });
  assert.equal(scenaA(85).id, "C");
  assert.equal(scenaA(200).id, "H");
});

test("un blocco che continua la frase attenua quello sopra, ed escono insieme", () => {
  const b3 = blocco("B3");
  assert.equal(opacitaBlocco(b3, 42), 1);
  assert.ok(opacitaBlocco(b3, 52) < 0.7 && opacitaBlocco(b3, 52) > 0.5);
  assert.equal(opacitaBlocco(b3, 57.2), 0);
});

test("i sottotitoli dei suoni stanno dentro l'intro e in ordine", () => {
  let prima = 0;
  for (const s of SCALETTA.sottotitoli) {
    assert.ok(s.inizio >= prima - 0.01 && s.fine > s.inizio && s.fine <= SCALETTA.durata, s.testo);
    prima = s.inizio;
  }
});

test("la scala dura 23,5 s e si ferma a 23", () => {
  assert.deepEqual(SCALETTA.momenti.scala, [100.98, 124.48]);
  assert.equal(SCALETTA.momenti.scalaFerma, 123.98);
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
    // e il pezzo, respiri compresi, finisce prima che il testo se ne sia andato: il blocco dopo non gli comincia sopra
    assert.ok(p.t + (p.a - p.da) <= b.via + 0.01, `${b.id}: la voce va oltre il suo testo`);
  }
});

test("il cuore della cosa viva batte dopo «La vedo pulsare», mentre c'è ancora il suo testo", () => {
  const m = SCALETTA.momenti;
  assert.ok(m.pulsare > m.pulsa[0] && m.pulsare + 1.5 < m.pulsa[1], `«pulsare» finisce a ${m.pulsare} s`);
});

test("la musica entra quando si apre lo spazio", () => {
  const m = SCALETTA.momenti;
  assert.ok(m.tema > m.stella[0] && m.tema < m.naveB, `il tema a ${m.tema} s`);
});
