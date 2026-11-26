// Le prove della voce di William nella pagina (documento 41): la tabella delle prese, le risposte dei dialoghi
// che William dice quando ci si ferma sopra, i tasti.
//   node --test prove/racconto.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { parole, presaDellaRisposta, risposteDa, SOSTA } from "../src/gioco/racconto.ts";

const tabella = JSON.parse(readFileSync(new URL("../src/motore/racconto.json", import.meta.url), "utf8")) as {
  impronta_fav: string;
  pezzi: { id: string; file: string; tipo: string; parti: string[]; file_parti?: string[] }[];
};

test("le parole si contano come le conta il ponte: minuscole, senza punteggiatura, con l'apostrofo dritto", () => {
  assert.equal(parole("Nell’oblò, contro le stelle, c’è una sagoma nera."), "nell oblò contro le stelle c è una sagoma nera");
  assert.equal(parole("Mi serve credito."), "mi serve credito");
  assert.equal(parole("TSC-1972. Prima registrazione: 14 marzo 2105."), "tsc 1972 prima registrazione 14 marzo 2105");
});

test("ogni presa della tabella ha il suo file, e la tabella viene dal copione di adesso", () => {
  const copione = JSON.parse(readFileSync(new URL("../../doppiaggio/william/copione.json", import.meta.url), "utf8")) as { impronta_fav: string };
  assert.equal(tabella.impronta_fav, copione.impronta_fav);
  assert.ok(tabella.pezzi.length > 0);
  const risorse = readFileSync(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8");
  for (const p of tabella.pezzi) {
    // una presa divisa (la voce di servizio in mezzo) suona con le sue parti: un nome per ogni pezzo di testo
    assert.ok(!p.file_parti || p.file_parti.length === p.parti.length, `${p.id}: le parti non combaciano con il testo`);
    for (const f of p.file_parti ?? [p.file]) {
      assert.ok(existsSync(new URL(`../../audio/musica-ia/WI/WI-${f}.mp3`, import.meta.url)), `${p.id}: manca WI-${f}.mp3`);
      assert.ok(risorse.includes(`"musica/WI-${f}.mp3"`), `${p.id}: WI-${f}.mp3 non è fra le risorse dell'app`);
    }
    assert.ok(p.parti.every((x) => x === parole(x)), `${p.id}: le parole non sono normalizzate`);
  }
  // all'inizio della partita la plancia
  assert.ok(tabella.pezzi.some((p) => p.id === "SM-001" && p.tipo === "descrizione"));
  // la scansione lunga: tre parti, e il computer di bordo in mezzo (documento 41, §5)
  assert.deepEqual(tabella.pezzi.find((p) => p.id === "SM-030")?.file_parti, ["SM-030-p1", "SM-030-p2", "SM-030-p3"]);
  // il coro delle gole: tre parti, e le due voci della nave in mezzo
  assert.deepEqual(tabella.pezzi.find((p) => p.id === "IN-079")?.file_parti, ["IN-079-p1", "IN-079-p2", "IN-079-p3"]);
});

test("le risposte dei dialoghi: la presa giusta per la risposta a schermo, niente per quelle non registrate", () => {
  const risposte = new Map([["mi serve credito", "SM-039"], ["ho trovato una cosa", "SM-040"]]);
  assert.equal(presaDellaRisposta("Mi serve credito.", risposte), "SM-039");
  assert.equal(presaDellaRisposta("Ho trovato una cosa.", risposte), "SM-040");
  assert.equal(presaDellaRisposta("Lascia stare.", risposte), null);
  assert.equal(SOSTA, 330, "un terzo di secondo, come nel Viaggiatore");
  // dalla tabella vera: solo le risposte (tipo «opzione»), con le loro parole
  const vere = risposteDa(readFileSync(new URL("../src/motore/racconto.json", import.meta.url), "utf8"));
  for (const p of tabella.pezzi.filter((x) => x.tipo === "opzione")) assert.equal(vere.get(p.parti.join(" ")), p.file);
  assert.equal(vere.size, new Set(tabella.pezzi.filter((x) => x.tipo === "opzione").map((x) => x.parti.join(" "))).size);
  assert.equal(risposteDa("non è json").size, 0);
});

test("i tasti: F2 ridice, ogni altro tasto zittisce, tranne Maiusc, Tab ed Esc (che zittisce soltanto se parla)", () => {
  const t = readFileSync(new URL("../src/gioco/tastiera.ts", import.meta.url), "utf8");
  assert.match(t, /e\.key === "F2"[\s\S]{0,120}ridiciWilliam\(\)/);
  assert.match(t, /TASTI_MUTI = new Set\(\["Shift", "Control", "Alt", "AltGraph", "Meta", "CapsLock", "Tab", "Escape", "F2"\]\)/);
  assert.match(t, /if \(!TASTI_MUTI\.has\(e\.key\)\) void zittisciWilliam\(\)/);
  assert.match(t, /parla \? void zittisciWilliam\(\) : altrimenti\(\)/);
});
