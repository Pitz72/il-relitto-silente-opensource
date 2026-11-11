// Le prove della nave che si sveglia (src/gioco/momenti/tempiRisveglio.ts): i tempi sono quelli del suono.
//   node --test prove/risveglio.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ACCENSIONE, chiavi, DURATA, fioritura, fronte, luceLente, PAROLE, TEMPI, veneAlBuio } from "../src/gioco/momenti/tempiRisveglio.ts";

test("la storia dice ancora quello che l'animazione fa", () => {
  const fav = (nome: string) => readFileSync(new URL(`../../relitto-silente/${nome}`, import.meta.url), "utf8");
  assert.match(fav("tecnica.fav"), /Con un rombo che sale, i macchinari si svegliano: l.elettricità corre fra le bobine, i monitor si accendono/);
  assert.match(fav("relitto.fav"), /Lo scafo mi vibra sotto i piedi, una volta sola\. Lontano, dietro le pareti, sistemi spenti da sempre tornano a respirare uno dopo l.altro/);
});

test("gli archi e il brivido dello scafo cadono negli stessi istanti del motore audio", () => {
  const rust = readFileSync(new URL("../src-tauri/src/mondo/regia.rs", import.meta.url), "utf8");
  const blocco = /"energia" => \{([\s\S]*?)\n {12}\}/.exec(rust);
  assert.ok(blocco, "mondo/regia.rs suona ancora l'evento «energia»");
  const archi = /for t in \[([^\]]+)\] \{\s*let p = [^;]+;\s*let c = colpi::scarica/.exec(blocco[1]);
  assert.ok(archi, "le scariche fra le bobine hanno ancora i loro istanti");
  assert.deepEqual(archi[1].split(",").map(Number), [...TEMPI.archi], "la lente guizza quando si sente l'arco");
  const brivido = /colpi::crollo[\s\S]*?self\.suona\(c, Bus::Ossa, [-0-9.]+, [-0-9.]+, ([0-9.]+)\)/.exec(blocco[1]);
  assert.ok(brivido, "il brivido dello scafo ha ancora il suo istante");
  assert.equal(Number(brivido[1]), TEMPI.onda[0], "la luce parte dal generatore quando lo scafo vibra");
  const respiri = /for t in \[([^\]]+)\] \{\s*let c = colpi::sibilo/.exec(blocco[1]);
  assert.ok(respiri, "i sistemi che tornano a respirare hanno ancora i loro istanti");
  for (const t of respiri[1].split(",").map(Number)) assert.ok(t > TEMPI.onda[0] && t < TEMPI.onda[1], `il respiro a ${t} s cade mentre la luce attraversa lo schermo`);
});

test("i tempi vanno in ordine, ed è lenta: la luce ci mette almeno cinque secondi", () => {
  const ordine = [0, TEMPI.buio, ...TEMPI.archi, TEMPI.onda[0], TEMPI.onda[1], TEMPI.parole, TEMPI.parole + PAROLE, DURATA];
  for (let n = 1; n < ordine.length; n++) assert.ok(ordine[n] >= ordine[n - 1], `il momento ${n} non viene prima del precedente`);
  assert.ok(TEMPI.onda[1] - TEMPI.onda[0] >= 5);
  assert.ok(DURATA >= 9 && DURATA <= 13);
});

test("la lente si spegne, guizza a ogni arco un poco di più, e poi resta accesa", () => {
  assert.equal(luceLente(0), 1);
  assert.ok(luceLente(TEMPI.buio + 0.1) < 0.1, "al buio quasi non si vede");
  let prima = 0;
  for (const a of TEMPI.archi) {
    const picco = luceLente(a + 0.1);
    assert.ok(picco > luceLente(a - 0.02) + 0.15, `all'arco di ${a} s la lente guizza`);
    assert.ok(picco > prima, "ogni guizzo è più forte del precedente");
    assert.ok(picco < 0.95, "ma nessuno è un lampo pieno");
    prima = picco;
  }
  for (let s = TEMPI.onda[0] + ACCENSIONE; s <= DURATA; s += 0.1) assert.equal(luceLente(s), 1);
  for (let s = 0; s <= DURATA; s += 0.01) assert.ok(luceLente(s) >= 0 && luceLente(s) <= 1);
});

test("la luce va sempre alla stessa velocità, e le vene al buio restano visibili", () => {
  assert.equal(fronte(TEMPI.onda[0] - 1), 0);
  assert.ok(Math.abs(fronte((TEMPI.onda[0] + TEMPI.onda[1]) / 2) - 0.5) < 1e-9);
  assert.ok(Math.abs(fronte(TEMPI.onda[1]) - 1) < 1e-9);
  assert.ok(fronte(TEMPI.onda[1] + 1) > 1, "continua oltre lo schermo: dietro di lei la luce delle vene si posa");
  assert.ok(veneAlBuio(0) > 0.8, "all'inizio le vene sono com'erano senza energia");
  assert.ok(veneAlBuio(TEMPI.buio) > 0.2 && veneAlBuio(TEMPI.buio) < 0.4, "al buio si vedono appena, ma si vedono");
});

test("i fotogrammi di ogni sistema vanno avanti, e finiscono com'erano cominciati", () => {
  for (const [buio, sveglia, dura, pieno] of [[0.05, TEMPI.onda[0], ACCENSIONE, 1], [0.07, 6.2, 2.8, 0.8], [0.05, TEMPI.onda[1], 3, 1], [0, TEMPI.parole, PAROLE, 1]]) {
    const f = chiavi(buio, sveglia, dura, pieno);
    for (let n = 1; n < f.length; n++) assert.ok((f[n].offset as number) >= (f[n - 1].offset as number), `sveglia ${sveglia}: i fotogrammi vanno avanti`);
    assert.equal(f[0].opacity, pieno);
    assert.equal(f[f.length - 1].opacity, pieno);
    assert.equal(f[f.length - 2].opacity, pieno, "è tornato prima della fine");
    assert.equal(f[1].opacity, pieno * buio);
  }
  for (const sveglia of [TEMPI.onda[0], 6, TEMPI.onda[1], DURATA]) {
    const f = fioritura(sveglia);
    for (let n = 1; n < f.length; n++) assert.ok((f[n].offset as number) >= (f[n - 1].offset as number));
    assert.equal(f[f.length - 1].filter, "brightness(1)");
  }
});

test("le parole arrivano per ultime", () => {
  assert.ok(TEMPI.parole >= TEMPI.onda[1], "quando la luce ha attraversato tutto lo schermo");
  assert.ok(TEMPI.parole + PAROLE <= DURATA);
});
