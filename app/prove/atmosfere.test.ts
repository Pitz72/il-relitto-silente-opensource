// Le prove delle atmosfere (src/stile/atmosfere.ts): i contrasti di ogni ruolo
// di testo in ogni clima del gioco, e il clima che lo stato del gioco sceglie.
//   node --test prove/atmosfere.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  climaDi,
  coloreAria,
  contrasto,
  misura,
  spegni,
  statoAria,
  tavolozza,
  TAVOLOZZE,
  tuttiIClimi,
  variabiliCss,
} from "../src/stile/atmosfere.ts";
import type { StatoStrumenti } from "../src/motore/tipi.ts";

test("il contrasto WCAG: i casi noti", () => {
  assert.equal(Number(contrasto("#ffffff", "#000000").toFixed(1)), 21);
  assert.equal(Number(contrasto("#777777", "#ffffff").toFixed(2)), 4.48);
  assert.equal(contrasto("#123456", "#123456"), 1);
});

test("ogni testo di ogni clima sta sopra la soglia (4,5:1; il fuoco 3:1)", () => {
  const sotto: string[] = [];
  const climi = tuttiIClimi();
  for (const c of climi)
    for (const { coppia, rapporto } of misura(c))
      if (rapporto < coppia.minimo)
        sotto.push(`${c.atmosfera}/${c.forma}${c.stanza ? `/${c.stanza}` : ""}${c.protezione ? "+protezione" : ""}${c.ipossia ? "+ipossia" : ""}: ${coppia.ruolo} ${rapporto.toFixed(2)}`);
  assert.deepEqual(sotto, []);
  assert.ok(climi.length >= 30, `climi provati: ${climi.length}`);
});

test("l'ipossia spegne il colore e non il contrasto", () => {
  for (const colore of ["#5fd4dc", "#8bf0a2", "#ff5a4a", "#ffb020"]) {
    const spento = spegni(colore, 0.6);
    assert.notEqual(spento, colore);
    const sulNero = (x: string) => contrasto(x, "#000000");
    assert.ok(Math.abs(sulNero(spento) - sulNero(colore)) < 0.35, `${colore} → ${spento}`);
  }
  assert.equal(spegni("rgba(95, 212, 220, 0.24)", 0).replace(/\s/g, ""), "rgba(95,212,220,0.24)");
});

test("l'aria: quattro colori e quattro stati scritti", () => {
  assert.deepEqual([100, 60, 59, 30, 29, 16, 15, 0].map(statoAria), ["regolare", "regolare", "ambra", "ambra", "rosso", "rosso", "ipossia", "ipossia"]);
  assert.equal(new Set([100, 59, 29, 15].map(coloreAria)).size, 4);
  assert.equal(statoAria(null), "assente");
});

const stato = (s: Partial<StatoStrumenti>): StatoStrumenti => ({
  stanza: "plancia", nome_stanza: "La plancia", atto: 1, titolo_atto: "Il margine", aria: null, traduzione: 0, echi: 0,
  risonanze: 0, chiavi: 0, tracce: 0, fuga: "lontana", ingresso: "aperto", contatto: "nuovo", energia: "assente",
  tuta: false, protezione: false, mostra: { aria: false, matrice: false, voci: false, chiavi: false, tracce: false },
  turno: 0, inventario: [], visitate: [], mappa: {}, dialogo: null, nodo: null, ...s,
});

test("il clima segue il gioco: acciaio fino al primo contatto, poi membrana", () => {
  assert.deepEqual(climaDi(stato({})), { atmosfera: "santamaria", forma: "acciaio", stanza: "plancia", protezione: false, ipossia: false });
  assert.equal(climaDi(stato({ stanza: "stiva", tuta: true, aria: 100 })).atmosfera, "visore");
  assert.equal(climaDi(stato({ stanza: "scafo", tuta: true, aria: 99 })).atmosfera, "visore");
  const camera = climaDi(stato({ stanza: "camera di compensazione", tuta: true, aria: 98, ingresso: "richiuso" }));
  assert.equal(camera.atmosfera, "relitto");
  assert.equal(camera.forma, "acciaio");
  const vestibolo = climaDi(stato({ stanza: "vestibolo delle gole", tuta: true, aria: 96, contatto: "avvenuto" }));
  assert.equal(vestibolo.forma, "membrana");
  const prot = climaDi(stato({ stanza: "alloggio dell'equipaggio", tuta: true, aria: 27, contatto: "avvenuto", protezione: true }));
  assert.ok(prot.protezione && !prot.ipossia);
  const fuga = climaDi(stato({ stanza: "gola di mezzo", tuta: true, aria: 13, contatto: "avvenuto", fuga: "iniziata" }));
  assert.equal(fuga.atmosfera, "fuga");
  assert.ok(fuga.ipossia);
});

test("le variabili CSS: tutte, e colori validi", () => {
  const v = variabiliCss(tavolozza({ atmosfera: "relitto", forma: "membrana", stanza: null, protezione: false, ipossia: false }), 58);
  assert.equal(v["--aria"], coloreAria(58));
  for (const [k, x] of Object.entries(v)) assert.match(x, /^(#[0-9a-f]{6}|rgba\(.+\))$/, k);
  assert.equal(Object.keys(v).length, Object.keys(TAVOLOZZE.relitto).length + 1);
});
