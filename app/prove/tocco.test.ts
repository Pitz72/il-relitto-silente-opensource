// Le prove del tocco sui pulsanti (src/gioco/tocco.ts): quale gesto è un clic.
//   node --test prove/tocco.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gestoDel, type Pulsante } from "../src/gioco/tocco.ts";

const p = (classi: string[] = [], dati: Record<string, string> = {}, disabilitato = false): Pulsante => ({ classi, dati, disabilitato });

test("un pulsante qualunque sceglie: il baccello che apre il fiore, le voci del menu", () => {
  assert.equal(gestoDel(p(["baccello"], { chiave: "cosa:valvola", avvia: "apri" })), "scegli");
  assert.equal(gestoDel(p(["baccello", "piu"], { avvia: "altri" })), "scegli");
  assert.equal(gestoDel(p([], { primo: "" })), "scegli");
  assert.equal(gestoDel(p([])), "scegli");
});

test("un comando che parte conferma: i petali, i baccelli diretti, le risposte del dialogo", () => {
  assert.equal(gestoDel(p(["petalo"], { chiave: "p1", comando: "esamina valvola" })), "conferma");
  assert.equal(gestoDel(p(["baccello"], { comando: "ovest" })), "conferma");
  assert.equal(gestoDel(p([], { comando: "1" })), "conferma");
  assert.equal(gestoDel(p([], { risposta: "si", comando: "sì" })), "conferma");
  // i posti dei salvataggi dicono da sé che confermano
  assert.equal(gestoDel(p(["posto"], { tocco: "conferma" })), "conferma");
});

test("chiudere, dire di no e uscire dal discorso annullano, anche se portano un comando", () => {
  assert.equal(gestoDel(p(["chiudi"])), "annulla");
  assert.equal(gestoDel(p(["annulla"])), "annulla");
  assert.equal(gestoDel(p(["esci"], { comando: "esci" })), "annulla");
  assert.equal(gestoDel(p([], { risposta: "no", comando: "no" })), "annulla");
  assert.equal(gestoDel(p([], { tocco: "annulla" })), "annulla");
  // «annulla» vince su «conferma» se sono tutti e due
  assert.equal(gestoDel(p(["chiudi"], { comando: "x" })), "annulla");
});

test("un pulsante spento non suona", () => {
  assert.equal(gestoDel(p(["petalo", "chiuso"], { comando: "x" }, true)), null);
  assert.equal(gestoDel(p([], {}, true)), null);
});

test("i segni che il tocco legge ci sono ancora nei componenti", () => {
  // se qualcuno rinomina una classe o un attributo, il suono sbaglia gesto in silenzio:
  // questa prova lo dice
  const leggi = (f: string) => readFileSync(new URL(`../src/gioco/${f}`, import.meta.url), "utf8");
  const pannelli = leggi("pannelli/Pannelli.tsx");
  assert.match(pannelli, /className="chiudi"/);
  assert.match(pannelli, /data-risposta="si"/);
  assert.match(pannelli, /data-risposta="no"/);
  assert.match(pannelli, /data-tocco="annulla"/); // «Riprendi»
  assert.match(pannelli, /data-tocco="conferma"/); // i posti
  const ramo = leggi("ramo/Ramo.tsx");
  assert.match(ramo, /className="annulla"/);
  assert.match(ramo, /data-comando=/);
  const dialogo = leggi("dialogo/Dialogo.tsx");
  assert.match(dialogo, /data-comando=\{s\.comando\}/);
  assert.match(dialogo, /"esci"/);
  assert.match(leggi("diario/Diario.tsx"), /className="chiudi"/);
  // il menu principale suona il suo tocco, e accende la sua musica
  const relitto = readFileSync(new URL("../src/Relitto.tsx", import.meta.url), "utf8");
  assert.match(relitto, /onClickCapture/);
  assert.match(relitto, /menuSuono\(true\)/);
  assert.match(relitto, /menuSuono\(false\)/);
});
