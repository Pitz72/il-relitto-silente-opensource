// Le prove dei titoli di testa della cinematica d'apertura (documento 09, §16; le «scelte definitive»
// dell'autore, 14 novembre 2026): i cartelli e i crediti, la stampa a cursore, il titolo che si scioglie
// dai glifi, la pellicola.
//   node --test prove/titoli-di-testa.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { CARATTERI_AL_SECONDO, SCALETTA, VOCE, luceDiA, opacitaCredito, pezziDellaVoce, testoCredito } from "../src/intro/scaletta.ts";
import { avanzamento, contorni, lungoLaLinea, posa, sciogli, spartisci, spezzata, type P } from "../src/intro/titolo.ts";
import { glifiDelTitolo } from "../src/intro/glifi.ts";
import { BANDA, CURVE, GRANA, SCATTI, respiro, sfarfallio, sporcature, taglio } from "../src/pellicola/scatti.ts";

const S = SCALETTA;
const credito = (id: string) => S.crediti.find((c) => c.id === id)!;
const blocco = (id: string) => S.blocchi.find((b) => b.id === id)!;

test("i titoli di testa: sei, con le parole dell'autore, nell'ordine in cui li ha chiesti", () => {
  assert.deepEqual(S.crediti.map((c) => testoCredito(c)), [
    "RUNTIME MULTIMEDIA presenta",
    "un gioco di SIMONE PIZZI",
    "produttore esecutivo MICHELA DE PAOLA",
    "tratto dal libro DAL REGISTRO DELLA SANTA MARIA di SIMONE PIZZI",
    "tema musicale originale di ALIRIO BRUNI",
    "LEONARDO TOMASSETTI è William T. Erickson",
  ]);
  assert.deepEqual(S.crediti.map((c) => c.posto), ["centro", "centro", "centro", "alto", "basso", "basso"]);
  for (let i = 1; i < S.crediti.length; i++) assert.ok(S.crediti[i].entra >= S.crediti[i - 1].via, "due crediti insieme");
  // il libro non sta più sotto il titolo
  assert.equal(blocco("T").testo, "IL RELITTO SILENTE");
  assert.equal(blocco("T").sotto, undefined);
});

test("mezzo secondo di nero, poi «Runtime Multimedia presenta»; la spia si accende dopo", () => {
  const k0 = credito("K0");
  assert.equal(k0.entra, 0.5);
  assert.ok(S.momenti.spia > k0.via + 1, `la spia a ${S.momenti.spia}, il cartello via a ${k0.via}`);
  assert.ok(S.momenti.fruscioA >= k0.via, "il fruscio della traccia comincia sotto il cartello");
  assert.ok(blocco("B0").entra > S.momenti.spia);
});

test("i due cartelli nel nero: l'immagine cala, il cartello, l'immagine torna, e L.V. non parla sopra", () => {
  assert.equal(S.neri.length, 2);
  const pezzi = pezziDellaVoce();
  for (const [i, id] of (["K1", "K2"] as const).entries()) {
    const k = credito(id), n = S.neri[i];
    assert.ok(n.cala[1] < k.entra && k.via < n.torna[0], `${id}: il cartello non sta tutto nel nero`);
    assert.equal(luceDiA(n.cala[0] - 0.01), 1);
    assert.equal(luceDiA((k.entra + k.via) / 2), 0);
    assert.equal(luceDiA(n.torna[1] + 0.01), 1);
    assert.ok(luceDiA((n.cala[0] + n.cala[1]) / 2) > 0.3 && luceDiA((n.cala[0] + n.cala[1]) / 2) < 0.7, "la discesa è una dissolvenza");
    // nessun pezzo della voce suona fra l'inizio della discesa e la fine della risalita
    for (const p of pezzi) assert.ok(p.t + (p.a - p.da) <= n.cala[0] + 0.01 || p.t >= n.torna[1], `${id}: L.V. parla sopra il cartello`);
    assert.equal(opacitaCredito(k, k.pieno + 0.1), 1);
  }
  // il primo prima di «L'acqua è finita ieri», il secondo dopo «Lo rileggo: diciannove»
  assert.ok(credito("K1").via < blocco("B2").entra && credito("K1").entra > blocco("B1").esce);
  assert.ok(credito("K2").entra > blocco("B4").esce && credito("K2").via < S.momenti.battito[0]);
});

test("i crediti in sovrimpressione: il libro dopo «Ho insistito io», il tema nella scala, la voce quando L.V. riprende", () => {
  const b5 = blocco("B5").pezzo!;
  const detto = b5.t + (VOCE.B6!.fine - VOCE.B5!.da!);
  const k3 = credito("K3"), k4 = credito("K4"), k5 = credito("K5");
  assert.ok(k3.entra > detto && k3.entra < detto + 1, `il libro a ${k3.entra}, «Ho insistito io» finisce a ${detto.toFixed(2)}`);
  assert.ok(k3.via <= S.scene.find((s) => s.id === "C")!.inizio, "il libro resta sulle stelle: C aspetta");
  // la camera della scala arretra dal terzo secondo: a nove e mezzo la nave è già piccola
  assert.ok(k4.entra >= S.momenti.scala[0] + 9 && k4.via < S.momenti.scala[1] - 5);
  const b7 = blocco("B7").pezzo!;
  assert.ok(k5.entra >= b7.t && k5.entra < b7.t + 1, "la voce di William non arriva quando L.V. riprende a parlare");
});

test("la voce dell'apparecchio si stampa a trenta caratteri al secondo, e il motore audio lo sa", () => {
  assert.equal(S.stampe.length, 2);
  for (const [i, id] of (["B0", "B10"] as const).entries()) {
    const b = blocco(id), s = S.stampe[i];
    assert.equal(s.testo, b.testo);
    assert.equal(s.da, b.entra);
    assert.ok(Math.abs(s.a - s.da - b.testo.length / CARATTERI_AL_SECONDO) < 0.011, id);
    assert.ok(s.a < b.esce, `${id}: la stampa finisce mentre il testo è ancora lì`);
  }
});

test("il titolo: le spezzate, i punti lungo la linea, la spartizione", () => {
  assert.deepEqual(spezzata("M1 2L3.5 4L-1 0"), [[1, 2], [3.5, 4], [-1, 0]]);
  const quadro: P[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
  assert.deepEqual(lungoLaLinea(quadro, 4, true), quadro);
  const aperta = lungoLaLinea([[0, 0], [10, 0]], 5, false);
  assert.deepEqual(aperta.map((p) => p[0]), [0, 2.5, 5, 7.5, 10]);
  assert.deepEqual(spartisci([30, 10], 40), [30, 10]);
  assert.equal(spartisci([100, 1, 1], 60).reduce((a, b) => a + b, 0), 60);
});

test("il contorno di una lettera: un anello ha due giri, il profilo e l'occhiello", () => {
  const w = 40, h = 40;
  const alfa = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x - 19.5, y - 19.5);
    alfa[y * w + x] = d < 16 && d > 8 ? 255 : 0;
  }
  const giri = contorni(alfa, w, h);
  assert.equal(giri.length, 2);
  // il più lungo per primo, e tutti e due chiusi intorno al centro, ai loro raggi
  const raggio = (g: P[]) => g.reduce((s, p) => s + Math.hypot(p[0] - 19.5, p[1] - 19.5), 0) / g.length;
  assert.ok(Math.abs(raggio(giri[0]) - 16) < 0.8 && Math.abs(raggio(giri[1]) - 8) < 0.8, `${raggio(giri[0])}, ${raggio(giri[1])}`);
  // una forma che tocca il bordo della mappa si chiude lo stesso
  const pieno = new Uint8Array(16).fill(255);
  assert.equal(contorni(pieno, 4, 4).length, 1);
});

test("il glifo si scioglie nella lettera: gli stessi punti, dal glifo al contorno, senza salti", () => {
  const gl = glifiDelTitolo("IL RELITTO SILENTE")[0];
  const tratti = gl.forme[0].map(spezzata);
  const giri: P[][] = [lungoLaLinea([[0, 0], [20, 0], [20, 50], [0, 50]], 80, true), lungoLaLinea([[6, 10], [14, 10], [14, 30], [6, 30]], 40, true)];
  const s = sciogli(tratti, giri, 240);
  assert.equal(s.da.length, 240);
  assert.equal(s.a.length, 240);
  assert.equal(new Set(s.tratto).size, 3, "i tre tratti del glifo");
  assert.deepEqual(s.capi.map(([a, b]) => b - a + 1).reduce((x, y) => x + y, 0), 240);
  // a zero è il glifo, a uno è la lettera
  const inizio = posa(s, 0), fine = posa(s, 1);
  for (let i = 0; i < 240; i += 17) {
    assert.ok(Math.hypot(inizio.p[i][0] - s.da[i][0], inizio.p[i][1] - s.da[i][1]) < 1e-9);
    assert.ok(Math.hypot(fine.p[i][0] - s.a[i][0], fine.p[i][1] - s.a[i][1]) < 1e-9);
  }
  // in mezzo ogni punto è per strada, e fra un istante e il successivo nessuno salta
  let prima = posa(s, 0).p;
  for (let k = 0.02; k <= 1.0001; k += 0.02) {
    const ora = posa(s, k).p;
    for (let i = 0; i < 240; i++) assert.ok(Math.hypot(ora[i][0] - prima[i][0], ora[i][1] - prima[i][1]) < 6, `il punto ${i} salta a ${k.toFixed(2)}`);
    prima = ora;
  }
  // i punti partono uno dopo l'altro lungo la linea, e arrivano tutti
  assert.ok(avanzamento(0, 240, 0.3) > avanzamento(239, 240, 0.3));
  assert.equal(avanzamento(239, 240, 1), 1);
  assert.equal(avanzamento(0, 240, 0), 0);
});

test("la pellicola: lo sfarfallio e il respiro sono leggeri, e il respiro è lento", () => {
  let massimo = 0, somma = 0;
  for (let f = 0; f < SCATTI * 600; f++) {
    const v = sfarfallio(f);
    massimo = Math.max(massimo, v);
    somma += v;
  }
  assert.ok(massimo <= 0.022, `lo sfarfallio arriva a ${massimo}`);
  assert.ok(somma / (SCATTI * 600) < 0.008, "in media la lampada scurisce meno dell'uno per cento");
  let piu = 0, salto = 0;
  for (let t = 0; t < 600; t += 0.1) {
    piu = Math.max(piu, respiro(t));
    salto = Math.max(salto, Math.abs(respiro(t + 1) - respiro(t)));
  }
  assert.ok(piu <= 0.0141, `il respiro arriva a ${piu}`);
  assert.ok(salto < 0.004, `in un secondo il respiro cambia di ${salto}: non è lento`);
});

test("la pellicola: la polvere e i graffi sono radi, e sempre gli stessi", () => {
  const scatti = SCATTI * 600; // dieci minuti
  let granelli = 0, conGraffio = 0, peli = 0;
  for (let f = 0; f < scatti; f++) {
    const s = sporcature(f);
    granelli += s.granelli.length;
    if (s.graffio) conGraffio++;
    if (s.pelo) peli++;
    for (const g of s.granelli) assert.ok(g.x >= 0 && g.x <= 1 && g.y >= 0 && g.y <= 1 && g.alfa <= 0.34);
    if (s.graffio) assert.ok(s.graffio.alfa <= 0.075 && s.graffio.tratti.every(([a, b]) => a >= 0 && b <= 1 && b > a));
  }
  assert.ok(granelli / 600 > 1 && granelli / 600 < 3.5, `${(granelli / 600).toFixed(2)} granelli al secondo`);
  assert.ok(conGraffio / SCATTI < 30, `i graffi si vedono per ${(conGraffio / SCATTI).toFixed(1)} s su 600`);
  assert.ok(conGraffio > 0 && peli > 0 && peli < 40);
  assert.deepEqual(sporcature(4321), sporcature(4321));
});

test("la pellicola: il taglio di colore lascia il nero quasi nero e freddo, e le luci appena calde", () => {
  const spento = taglio(0), pieno = taglio(1);
  assert.equal(spento.matrice, "1.0000 0.0000 0.0000 0.0000 0.0000 0.0000 1.0000 0.0000 0.0000 0.0000 0.0000 0.0000 1.0000 0.0000 0.0000 0.0000 0.0000 0.0000 1.0000 0.0000");
  assert.equal(spento.r, "0.0000 0.1250 0.2500 0.3750 0.5000 0.6250 0.7500 0.8750 1.0000");
  assert.equal(pieno.b.split(" ")[0], CURVE.b[0].toFixed(4));
  // il nero: sollevato di meno di tre centesimi, e più blu che rosso
  assert.ok(CURVE.b[0] < 0.03 && CURVE.b[0] > CURVE.g[0] && CURVE.g[0] > CURVE.r[0]);
  // le luci: il rosso più del blu
  assert.ok(CURVE.r[8] > CURVE.g[8] && CURVE.g[8] > CURVE.b[8] && CURVE.b[8] > 0.9);
  // i mezzi toni restano dov'erano
  for (const c of [CURVE.r, CURVE.g, CURVE.b]) assert.ok(Math.abs(c[4] - 0.5) < 0.02);
  assert.ok(GRANA.forza <= 0.06, "la grana è più leggera di quella del prototipo (0,085)");
});

test("il formato è lo stesso per i loghi e per l'intro: 2,39 a 1", () => {
  // la stessa formula di intro/plancia.ts (che qui non si può caricare: importa senza estensione)
  assert.equal(BANDA, (1 - 16 / 9 / 2.39) / 2);
  assert.ok(Math.abs(BANDA - 0.128) < 0.001);
});
