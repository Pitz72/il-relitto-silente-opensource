// Le prove della scaletta dell'intro: i tempi sono quelli della regola di lettura (§2.1 di
// 09-intro-storyboard.md, strumenti/intro/tempi.py), allungati dalla voce di L.V. (§13, 29 ottobre 2026).
//   node --test prove/intro.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANTICIPO_VOCE, SCALETTA, VOCE, fermoPer, opacitaBlocco, pezziDellaVoce, scenaA } from "../src/intro/scaletta.ts";
import { reattori } from "../src/intro/scala.ts";

const blocco = (id: string) => SCALETTA.blocchi.find((b) => b.id === id)!;

test("la durata: 3:24,16 con i titoli di testa (era 3:02,12; 2:40,75 prima della voce di L.V.)", () => {
  assert.equal(SCALETTA.durata, 204.16);
});

test("la regola di lettura: 0,35 s per parola più 2, mai meno di 4", () => {
  assert.deepEqual(fermoPer("Ho insistito io."), { fermo: 4, parole: 3 });
  assert.deepEqual(fermoPer("i numeri mi arrivano tardi, uno alla volta, e lo so cosa vuol dire."), { fermo: 6.9, parole: 14 });
});

test("i testi entrano, sono pieni ed escono quando dicono la regola e la voce", () => {
  const attesi: Record<string, [number, number, number]> = {
    B0: [7.4, 8.6, 15.1], B1: [16, 17.2, 29.55], B2: [37.05, 38.25, 47.9], B3: [48.8, 50, 68.15],
    B4: [61.03, 62.23, 68.15], B5: [82.15, 83.35, 96.68], B6: [90.48, 91.68, 96.68], B7: [144.52, 145.72, 153.01],
    B8: [153.61, 154.81, 161.38], B9: [161.98, 163.18, 171.81], B10: [172.41, 173.61, 178.61], T: [186.41, 187.61, 195.16],
  };
  for (const [id, [entra, pieno, via]] of Object.entries(attesi)) {
    const b = blocco(id);
    assert.deepEqual([b.entra, b.pieno, b.via], [entra, pieno, via], id);
  }
});

test("le scene cominciano dove dice la scaletta", () => {
  const inizi = Object.fromEntries(SCALETTA.scene.map((s) => [s.id, s.inizio]));
  assert.deepEqual(inizi, { A: 0, B: 78.65, C: 99.22, D: 112.02, E: 121.02, F: 144.52, G: 179.61, H: 195.16 });
  assert.equal(scenaA(105).id, "C");
  assert.equal(scenaA(300).id, "H");
});

test("un blocco che continua la frase attenua quello sopra, ed escono insieme", () => {
  const b3 = blocco("B3");
  assert.equal(opacitaBlocco(b3, 53), 1);
  assert.ok(opacitaBlocco(b3, 63) < 0.7 && opacitaBlocco(b3, 63) > 0.5);
  assert.equal(opacitaBlocco(b3, 68.2), 0);
});

test("i sottotitoli dei suoni stanno dentro l'intro e in ordine", () => {
  let prima = 0;
  for (const s of SCALETTA.sottotitoli) {
    assert.ok(s.inizio >= prima - 0.01 && s.fine > s.inizio && s.fine <= SCALETTA.durata, s.testo);
    prima = s.inizio;
  }
});

test("la scala dura 23,5 s e si ferma a 23", () => {
  assert.deepEqual(SCALETTA.momenti.scala, [121.02, 144.52]);
  assert.equal(SCALETTA.momenti.scalaFerma, 144.02);
  // i reattori si spengono mentre la camera è ancora vicina (arretra dal terzo secondo): il suono lo segue
  assert.deepEqual(SCALETTA.momenti.reattori, [122.32, 124.22]);
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

test("i reattori della Santa Maria: accesi quando la scala comincia, spenti prima che la camera arretri", () => {
  assert.deepEqual(reattori("scala", 0.5), { forza: 1, lunga: 1, brace: 0 });
  // a metà dello spegnimento la fiamma è più corta e più debole
  const meta = reattori("scala", 2.2);
  assert.ok(meta.forza > 0 && meta.forza < 0.6 && meta.lunga < 1, JSON.stringify(meta));
  // la camera comincia ad arretrare al terzo secondo: la fiamma non c'è più, resta la brace
  assert.equal(reattori("scala", 3.3).forza, 0);
  assert.ok(reattori("scala", 3.3).brace > 0.8);
  // e la brace si raffredda: da lontano, e nel menu, gli scarichi sono spenti
  assert.ok(reattori("scala", 20).brace < 0.01);
  // nel margine la nave arriva con i reattori accesi
  assert.deepEqual(reattori("margine", 10), { forza: 1, lunga: 1, brace: 0 });
});
