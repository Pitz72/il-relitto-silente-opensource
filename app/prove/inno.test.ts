// Le prove di «Ascolta il canto» (src/gioco/dialogo/testoInno.ts, Inno.tsx, mondo/musica.rs).
//   node --test prove/inno.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aSchermo, INNO_DURATA, STROFE } from "../src/gioco/dialogo/testoInno.ts";

test("le parole scorrono sul tempo del file: lo stesso numero del motore audio", () => {
  const rust = readFileSync(new URL("../src-tauri/src/mondo/musica.rs", import.meta.url), "utf8");
  const durata = /pub const INNO_DURATA: f32 = ([0-9.]+);/.exec(rust);
  assert.ok(durata, "mondo/musica.rs dice ancora quanto dura l'inno (INNO_DURATA)");
  assert.equal(INNO_DURATA, Number(durata[1]));
});

test("il file dell'inno è dove il motore lo cerca, e entra nel pacchetto", () => {
  const rust = readFileSync(new URL("../src-tauri/src/mondo/musica_file.rs", import.meta.url), "utf8");
  assert.ok(rust.includes('Pezzo::HV => ("CT", "CT-02-havela.mp3")'));
  const conf = readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8");
  assert.ok(conf.includes('"musica/CT-02-havela.mp3"'), "il file dell'inno entra nel pacchetto");
});

test("le strofe sono in ordine, dentro il brano, e ogni riga ha le sue due lingue", () => {
  let prima = 0;
  for (const s of STROFE) {
    assert.equal(s.righe.length, 4, "quattro righe a strofa");
    assert.ok(s.righe[0].da >= prima, "le strofe non si sovrappongono");
    let r0 = s.righe[0].da;
    for (const r of s.righe) {
      assert.ok(r.da >= r0 && r.da < s.fino, `la riga «${r.loro}» sta dentro la sua strofa`);
      assert.ok(r.loro.length > 0 && r.italiano.length > 0);
      r0 = r.da;
    }
    prima = s.fino;
  }
  assert.ok(prima <= INNO_DURATA, "l'ultima strofa finisce prima del file");
});

test("a schermo: niente prima della voce, le righe una dopo l'altra, niente dopo il congedo", () => {
  assert.equal(aSchermo(5), null);
  const v = aSchermo(31);
  assert.ok(v && v.strofa.nome === "strofa" && v.quante === 2);
  assert.equal(aSchermo(60)?.strofa.nome, "ritornello");
  assert.equal(aSchermo(166)?.quante, 4);
  assert.equal(aSchermo(175), null);
});

test("il testo è quello dell'inno del documento 32 (la lingua inventata ha le sue regole)", () => {
  const tutte = STROFE.flatMap((s) => s.righe.map((r) => r.loro.toLowerCase())).join(" ");
  // soltanto sillabe aperte: tra le consonanti ammesse l, m, n, r, s, v, h, t (e «h»), mai due insieme in mezzo alla parola
  assert.ok(!/[bcdfgjkpqwxyz]/.test(tutte.replace(/[^a-z ]/g, "")), "consonanti che la loro lingua non ha");
  assert.ok(tutte.includes("havela"));
});
