// Le prove della mappa stellare del Ponte (src/gioco/momenti/mappa.ts): la carta dice quello che dice la storia.
//   node --test prove/mappa.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AMMASSO, CIELO, DURATA, LORO, NOSTRA, rotta, SOLE, SOLI, TEMPI } from "../src/gioco/momenti/mappa.ts";

const dista = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

test("la storia dice ancora quello che la carta disegna", () => {
  const fav = readFileSync(new URL("../../relitto-silente/ponte.fav", import.meta.url), "utf8");
  assert.match(fav, /Attraversa un.altra galassia, fino a un ammasso denso e luminoso/, "la rotta attraversa un'altra galassia: per questo le galassie sono due");
  assert.match(fav, /tre soli stretti in un pugno di cielo, segnati con un contorno diverso dagli altri/);
  assert.match(fav, /finisce su un punto piccolo, giallo, senza niente di speciale/);
  assert.match(fav, /Le postazioni si accendono una dopo l.altra lungo la sala/);
});

test("le galassie sono due, e il vuoto in mezzo è la cosa più grande", () => {
  const vuoto = dista(LORO, NOSTRA) - LORO.raggio - NOSTRA.raggio;
  assert.ok(vuoto > LORO.raggio + NOSTRA.raggio, "il vuoto è più largo delle due galassie messe insieme");
});

test("i tre soli stanno stretti in un pugno di cielo: nell'ammasso, sull'orlo della loro galassia", () => {
  assert.equal(SOLI.length, 3);
  for (let a = 0; a < 3; a++) {
    assert.ok(dista(SOLI[a], AMMASSO) < 0.03, "ogni sole è dentro l'ammasso");
    for (let b = a + 1; b < 3; b++) {
      const d = dista(SOLI[a], SOLI[b]);
      // a 1280 i contorni arrivano a 19 px dal centro: sotto 0,031 si toccherebbero
      assert.ok(d > 0.031 && d < 0.05, `i soli ${a} e ${b} sono vicini senza che i contorni si tocchino (${d.toFixed(3)})`);
    }
  }
  assert.ok(dista(AMMASSO, LORO) < LORO.raggio * 1.3, "l'ammasso è della loro galassia");
  assert.ok(dista(AMMASSO, NOSTRA) > dista(AMMASSO, LORO) * 4);
});

test("la rotta parte dai tre soli, passa dentro la loro galassia, attraversa il vuoto e finisce sul nostro sole", () => {
  const partenza = { x: (SOLI[0].x + SOLI[1].x + SOLI[2].x) / 3, y: (SOLI[0].y + SOLI[1].y + SOLI[2].y) / 3 };
  assert.ok(dista(rotta(0), partenza) < 1e-9);
  assert.ok(dista(rotta(1), SOLE) < 1e-9);
  const passi = Array.from({ length: 101 }, (_, n) => rotta(n / 100));
  assert.ok(passi.some((p) => dista(p, LORO) < LORO.raggio * 0.4), "passa dentro la loro galassia");
  const nelVuoto = passi.filter((p) => dista(p, LORO) > LORO.raggio * 1.2 && dista(p, NOSTRA) > NOSTRA.raggio * 1.2).length;
  assert.ok(nelVuoto >= 40, `quasi metà della rotta è nel vuoto (${nelVuoto} passi su 101)`);
  // va sempre avanti, da sinistra a destra: non torna mai indietro
  for (let n = 1; n < passi.length; n++) assert.ok(passi[n].x > passi[n - 1].x);
});

test("il nostro sole è nella nostra galassia, fuori dal centro: «senza niente di speciale»", () => {
  const d = dista(SOLE, NOSTRA);
  assert.ok(d < NOSTRA.raggio * 0.8 && d > NOSTRA.raggio * 0.25, `in un braccio, né al centro né sull'orlo (${(d / NOSTRA.raggio).toFixed(2)} del raggio)`);
});

test("tutto quello che conta sta dentro il palco, lontano dai bordi", () => {
  for (const p of [...SOLI, SOLE, AMMASSO]) assert.ok(p.x > 0.03 && p.x < 0.97 && p.y > 0.03 && p.y < 0.5);
  const fuori = CIELO.filter((q) => q.x < 0 || q.x > 1 || q.y < 0 || q.y > 9 / 16).length;
  assert.equal(fuori, 0, "nessuna stella fuori dal palco");
});

test("i tempi vanno in ordine, ed è lenta apposta", () => {
  const ordine = [0, TEMPI.postazioni[0], TEMPI.stella[0], TEMPI.cielo[0], TEMPI.cielo[1], ...TEMPI.soli, TEMPI.rotta[0], TEMPI.rotta[1]];
  for (let n = 1; n < ordine.length; n++) assert.ok(ordine[n] > ordine[n - 1], `il momento ${n} viene dopo il precedente`);
  assert.ok(TEMPI.sole >= TEMPI.rotta[1] && TEMPI.ritiro > TEMPI.sole + 2, "il nostro sole si accende per ultimo, e resta da guardare");
  assert.ok(TEMPI.rotta[1] - TEMPI.rotta[0] >= 4, "la rotta ci mette almeno quattro secondi (la prima versione ne metteva uno e mezzo: «troppo veloce»)");
  assert.ok(TEMPI.cielo[1] - TEMPI.cielo[0] >= 2.5, "la luce sale piano sulla cupola");
  assert.ok(DURATA - TEMPI.ritiro >= 2, "il velo si alza quando la mappa è già nella lente");
  assert.ok(DURATA >= 15 && DURATA <= 22);
});

test("il disegno non pesa: meno di quattromila punti, sempre gli stessi", () => {
  assert.ok(CIELO.length > 3000 && CIELO.length < 4000);
  const caldi = CIELO.findIndex((q) => q.caldo);
  assert.ok(caldi > 0 && CIELO.slice(caldi).every((q) => q.caldo), "prima i freddi e poi i caldi: il disegno cambia colore una volta sola");
});
