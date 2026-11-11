// Le prove dei fogli di stile: una schermata non deve spostare le cose di un'altra.
//   node --test prove/stili.test.ts        (da app/)
//
// I fogli delle schermate caricate a parte (l'intro, i titoli, il menu) entrano nella pagina la prima
// volta che la schermata si apre e ci restano. Il 14 ottobre 2026 due regole dell'intro senza `.intro`
// davanti (`.palco` e `.palco > *`) hanno cominciato a valere anche per il palco del gioco: dopo ogni
// «Nuova partita» «diario» e «menu» finivano fuori dallo schermo e il ramo perdeva i fili (revisione 37, G1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));

/** Tutti i fogli di stile di src/, con il percorso scritto con le barre. */
function fogli(cartella = SRC): string[] {
  return readdirSync(cartella, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? fogli(join(cartella, e.name)) : e.name.endsWith(".css") ? [join(cartella, e.name)] : [],
  );
}
const nome = (f: string) => relative(SRC, f).split(sep).join("/");

/** I selettori di un foglio, uno per voce (le virgole divise), senza i commenti, le regole `@` e i passi dei `@keyframes`. */
function selettori(css: string): string[] {
  const testo = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  let profondita = 0;
  let fuori = 0; // la profondità sotto cui si è dentro un @keyframes o un @font-face
  let riga = "";
  for (const c of testo) {
    if (c === "{") {
      const s = riga.trim();
      riga = "";
      if (/^@(keyframes|font-face)/.test(s)) fuori = profondita + 1;
      else if (!s.startsWith("@") && !fuori) out.push(...s.split(",").map((x) => x.trim()).filter(Boolean));
      profondita++;
    } else if (c === "}") {
      profondita--;
      if (fuori && profondita < fuori) fuori = 0;
      riga = "";
    } else if (c === ";" && profondita > 0) riga = "";
    else riga += c;
  }
  return out;
}

test("il lettore dei selettori: le virgole, i commenti, le regole @", () => {
  const s = selettori("/* .via */ .a, .b > * { x: 1; } @media (x) { .c .d { y: 2; } } @keyframes k { 55% { z: 3; } } .e { }");
  assert.deepEqual(s, [".a", ".b > *", ".c .d", ".e"]);
});

test("il foglio dell'intro vale solo dentro l'intro", () => {
  const s = selettori(readFileSync(join(SRC, "intro", "intro.css"), "utf8"));
  assert.ok(s.length > 40, "il foglio dell'intro si legge");
  const liberi = s.filter((x) => !/^\.intro(?![\w-])/.test(x));
  assert.deepEqual(liberi, [], "ogni regola dell'intro comincia con .intro: il foglio resta nella pagina anche dopo");
});

test("il palco del gioco lo tocca solo il gioco", () => {
  // `.palco` come classe intera (non `.palco-app`, che è del menu)
  const palco = /\.palco(?![\w-])/;
  const altri: string[] = [];
  for (const f of fogli()) {
    const n = nome(f);
    if (n.startsWith("gioco/")) continue;
    for (const x of selettori(readFileSync(f, "utf8"))) {
      // l'intro ha un palco suo, dentro `.intro`
      if (palco.test(x) && !(n === "intro/intro.css" && x.startsWith(".intro "))) altri.push(`${n}: ${x}`);
    }
  }
  assert.deepEqual(altri, []);
});

test("le schermate caricate a parte non hanno regole per tutta la pagina", () => {
  // Niente selettori che cominciano da un elemento o da `*`: varrebbero anche per il gioco. (La pagina
  // di prova e il campionario sono pagine a sé, mai insieme al gioco.)
  const fuori = ["prova/", "campionario/", "stile/"];
  const larghi: string[] = [];
  for (const f of fogli()) {
    const n = nome(f);
    if (fuori.some((p) => n.startsWith(p)) || n.startsWith("gioco/")) continue;
    for (const x of selettori(readFileSync(f, "utf8"))) if (/^(\*|[a-z])/i.test(x)) larghi.push(`${n}: ${x}`);
  }
  assert.deepEqual(larghi, []);
});

test("l'esplorazione resta nel flusso del palco, qualunque foglio arrivi dopo", () => {
  const s = selettori(readFileSync(join(SRC, "gioco", "gioco.css"), "utf8"));
  assert.ok(s.includes(".palco > .esplorazione"), "gioco.css dice dove sta l'esplorazione");
});
