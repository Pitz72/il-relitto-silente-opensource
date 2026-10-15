// Le prove del menu principale (src/menu/) e dei riconoscimenti (src/riconoscimenti/visti.ts).
//   node --test prove/menu.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { conFinale, FINALI, giorno, pulisci, rigaDelRegistro } from "../src/menu/registro.ts";
import { daContinuare, dettaglioDi } from "../src/menu/continua.ts";
import { ciSonoNomiNuovi, nomi, type Elenco } from "../src/riconoscimenti/visti.ts";
import type { Posto } from "../src/gioco/salvataggi.ts";

test("i sei finali, con i nomi dell'autore", () => {
  assert.deepEqual(FINALI.map((f) => f.id), ["vivi", "prima-nota", "stiva-piena", "doppio-fondo", "mani-vuote", "due-lettere"]);
  // i nomi dei commenti di finali.fav
  const fav = readFileSync(new URL("../../relitto-silente/finali.fav", import.meta.url), "utf8");
  for (const f of FINALI) assert.ok(fav.includes(`«${f.titolo}»`), `${f.titolo} non è in finali.fav`);
});

test("la riga del registro di bordo, dal testo del finale; e nessuna, se il finale non la scrive", () => {
  const eventi = [{ tipo: "fine" as const, testo: "Ti guardi le mani.\n\nRegistro di bordo, TSC-1972. Operatore W. T. Eriksonn. Nessun evento da registrare." }];
  assert.equal(rigaDelRegistro(eventi), "Registro di bordo, TSC-1972. Operatore W. T. Eriksonn. Nessun evento da registrare.");
  assert.equal(rigaDelRegistro([{ tipo: "fine", testo: "La cifra sul visore è a zero." }]), null);
  assert.equal(rigaDelRegistro([{ tipo: "fine", testo: "Registro di bordo, TSC-1972. Carico: un manufatto. Nient'altro da dichiarare." }]),
    "Registro di bordo, TSC-1972. Carico: un manufatto. Nient’altro da dichiarare.");
});

test("un finale si scrive una volta sola, con la data della prima; le righe in ordine di data", () => {
  let r = conFinale([], "mani-vuote", "Nessun evento da registrare.", "2026-10-15T10:00:00Z");
  r = conFinale(r, "vivi", "Rotta ripresa.", "2026-10-14T10:00:00Z");
  r = conFinale(r, "mani-vuote", "altro", "2026-10-16T10:00:00Z");
  r = conFinale(r, "finale-che-non-esiste", null, "2026-10-17T10:00:00Z");
  assert.deepEqual(r.map((v) => [v.finale, v.titolo, v.data]), [
    ["vivi", "Vivi", "2026-10-14T10:00:00Z"],
    ["mani-vuote", "Mani vuote", "2026-10-15T10:00:00Z"],
  ]);
  assert.equal(giorno("2026-10-15T12:00:00Z"), "15 ottobre 2026");
});

test("un registro rovinato non impedisce di giocare: restano le voci buone", () => {
  assert.deepEqual(pulisci({ non: "una lista" }), []);
  const r = pulisci([null, 3, { finale: "vivi", riga: 7, data: "2026-10-15T10:00:00Z" }, { finale: "vivi", data: "2026-10-16" }, { finale: "x", data: "2026" }, { finale: "due-lettere" }]);
  assert.deepEqual(r, [{ finale: "vivi", titolo: "Vivi", riga: null, data: "2026-10-15T10:00:00Z" }]);
});

const posto = (p: Partial<Posto> & { posto: Posto["posto"] }): Posto => ({ presente: true, leggibile: true, riassunto: null, creato: null, gioco: "0.2.0", ...p });
const riassunto = (esito: string, turno = 5) => ({ stanza: "stiva", nome_stanza: "la stiva", atto: 1, titolo_atto: "Il margine", turno, aria: 100, esito });

test("Continua riprende dal salvataggio più recente che si legge e non è finito", () => {
  assert.equal(daContinuare(null), null);
  assert.equal(daContinuare([posto({ posto: "1", presente: false })]), null);
  const scelto = daContinuare([
    posto({ posto: "1", creato: "2026-10-15T10:00:00Z", riassunto: riassunto("in_corso") }),
    posto({ posto: "automatico", creato: "2026-10-15T11:00:00Z", riassunto: riassunto("in_corso", 9) }),
    posto({ posto: "2", creato: "2026-10-15T12:00:00Z", riassunto: riassunto("vinta") }),
    posto({ posto: "3", creato: "2026-10-15T13:00:00Z", leggibile: false }),
  ]);
  assert.equal(scelto?.posto, "automatico");
  assert.equal(dettaglioDi(scelto!), "La stiva · atto I · turno 9");
});

test("i riconoscimenti si rivedono solo quando arriva un nome nuovo", () => {
  const elenco = JSON.parse(readFileSync(new URL("../src/riconoscimenti/elenco.json", import.meta.url), "utf8")) as Elenco;
  const n = nomi(elenco);
  assert.ok(n.length > 200, "l'elenco ha i suoni, i caratteri, le librerie");
  assert.equal(new Set(n).size, n.length, "un nome una volta sola");
  assert.ok(ciSonoNomiNuovi(n, []), "al primo avvio");
  assert.ok(!ciSonoNomiNuovi(n, n), "già visti");
  assert.ok(ciSonoNomiNuovi([...n, "suono:Un suono nuovo|qualcuno"], n), "un suono in più");
  // una versione nuova della stessa libreria non è un nome nuovo
  const rust = Object.values(elenco.rust)[0];
  const aggiornato = { ...elenco, rust: { x: rust.map((p) => ({ ...p, versione: "99.0.0" })) } } as Elenco;
  assert.ok(!ciSonoNomiNuovi(nomi(aggiornato), n));
});

test("l'elenco dei riconoscimenti ha un testo per ogni licenza che usa", () => {
  const e = JSON.parse(readFileSync(new URL("../src/riconoscimenti/elenco.json", import.meta.url), "utf8")) as Elenco;
  const tutti = [...e.caratteri, ...e.principali, ...e.javascript, ...Object.values(e.rust).flat()];
  for (const p of tutti) for (const l of p.usata) assert.ok(e.testi[l], `${p.nome}: manca il testo di ${l}`);
  for (const p of tutti) assert.ok(p.copyright.length || p.autori?.length, `${p.nome}: né copyright né autori`);
  assert.ok(e.suoni.length && e.immagini.length && e.caratteri.length === 4);
});
