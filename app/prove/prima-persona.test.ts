// Il racconto è in prima persona, dappertutto. L'autore, 25 novembre 2026: «tutto il racconto è in prima persona,
// questo è assoluto, non si torna indietro». William racconta («apro», «la tocco»); il «tu» resta soltanto dove non
// è racconto: nelle parole degli altri, fra «», negli indizi per chi gioca, fra parentesi («(Se vuoi passare lo
// stesso, ripeti.)»), e nelle risposte che William dice a qualcuno.
//   node --test prove/prima-persona.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const STORIA = fileURLToPath(new URL("../../relitto-silente/", import.meta.url));

/** I pronomi e le forme verbali della seconda persona che il racconto non deve avere. Non ci sono le parole che
 *  hanno anche un altro senso («sei» settimane, i «passi», «prima che io lo tocchi»): quelle si guardano con il loro
 *  contesto, più sotto. */
const TU = /\b(tu|ti|tuo|tua|tuoi|tue|puoi|devi|vuoi|hai|sai|riesci|potresti|dovresti|avresti|saresti)\b/i;
/** Le frasi che erano in seconda persona, trovate dalla revisione 37 (L37): non devono tornare. */
const DI_PRIMA = ["Se la muovi nella luce", "Quando ci passi sopra il guanto", "Dove la tocchi, si accende", "Prima prendilo."];

/** Le stringhe di un file della storia, con quello che le precede sulla riga (per sapere che cosa sono). */
function stringhe(file: string): { riga: number; prima: string; testo: string }[] {
  const out: { riga: number; prima: string; testo: string }[] = [];
  readFileSync(STORIA + file, "utf8").split("\n").forEach((r, i) => {
    if (r.trimStart().startsWith("#")) return;
    for (const m of r.matchAll(/"([^"]*)"/g)) out.push({ riga: i + 1, prima: r.slice(0, m.index), testo: m[1] });
  });
  return out;
}

test("il racconto è in prima persona: nessun «tu» fuori dalle parole degli altri e dagli indizi", () => {
  const file = readdirSync(STORIA).filter((f) => f.endsWith(".fav"));
  assert.ok(file.length >= 14);
  const trovate: string[] = [];
  for (const f of file) {
    for (const { riga, prima, testo } of stringhe(f)) {
      // i nomi delle cose e dei nodi, e le risposte che William dice a qualcuno
      if (/(si chiama anche|l'opzione|al nodo|conduce al nodo|comincia con)\s*$/.test(prima)) continue;
      // le battute di un colloquio: fra parentesi lì c'è il racconto di William, che si guarda; fuori dai colloqui
      // le parentesi sono indizi per chi gioca
      const colloquio = /\bdice\s*$/.test(prima);
      let racconto = testo.replace(/«[^»]*»/g, " ").replace(/\[[^\]]*\]/g, " ");
      if (!colloquio) racconto = racconto.replace(/\([^)]*\)/g, " ");
      const m = TU.exec(racconto);
      if (m) trovate.push(`${f}:${riga} «${m[0]}» in: ${racconto.slice(Math.max(0, m.index - 40), m.index + 40).trim()}`);
      for (const frase of DI_PRIMA) if (testo.includes(frase)) trovate.push(`${f}:${riga} è tornata «${frase}»`);
    }
  }
  assert.deepEqual(trovate, [], "il racconto ha delle frasi in seconda persona:\n" + trovate.join("\n"));
});

test("le quattro frasi della revisione 37 sono in prima persona", () => {
  const tutto = readdirSync(STORIA).filter((f) => f.endsWith(".fav")).map((f) => readFileSync(STORIA + f, "utf8")).join("\n");
  for (const frase of ["Se la muovo nella luce", "Quando ci passo sopra il guanto", "Dove la tocco, si accende.", "Prima devo prenderlo."])
    assert.ok(tutto.includes(frase), `manca «${frase}»`);
});
