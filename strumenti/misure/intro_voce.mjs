// ============================================================================
//  L'intro nell'eseguibile vero (documento 09, §13), dal menu «Nuova partita»: il
//  livello d'uscita del motore audio ogni quarto di secondo (audio_mondo_stato) e la
//  media nei momenti chiave, il testo a schermo mentre L.V. parla (non ci deve essere
//  niente di suo), qualche foto, e la fine che si apre sul gioco. I tempi sono quelli
//  della voce «Elio» (intro di 3:02,12): se cambiano i tempi di scaletta.ts, vanno
//  cambiati anche qui. Profilo e salvataggi in una cartella temporanea.
//    node strumenti/misure/intro_voce.mjs <exe> <cartella delle foto>
//  Beta.8, 30 ottobre 2026: statica −46 dBFS, voce −32,5, voce sopra il tema −31,
//  sul gioco a 182,9 s.
// ============================================================================
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { lancia, attendi } from "./cdp.mjs";

const [exe, foto] = process.argv.slice(2);
fs.mkdirSync(foto, { recursive: true });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "relitto-elio-"));
fs.mkdirSync(path.join(tmp, "s"));
fs.mkdirSync(path.join(tmp, "w"));
const { manda, valuta, chiudi, figlio } = await lancia(exe, 9377, { RELITTO_SALVATAGGI: path.join(tmp, "s"), WEBVIEW2_USER_DATA_FOLDER: path.join(tmp, "w") });
for (let i = 0; i < 60; i++) {
  try {
    await valuta("1");
    break;
  } catch {
    await attendi(250);
  }
}
for (let i = 0; i < 120; i++) {
  let s = "loghi";
  try {
    s = await valuta("document.querySelector('.menu-voci button[data-voce=\"nuova\"]') ? 'menu' : document.querySelector('.dichiarazione') ? 'dic' : 'loghi'");
  } catch {}
  if (s === "menu") break;
  if (s === "dic") await valuta("document.querySelector('.dichiarazione').click()");
  else await valuta("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))").catch(() => {});
  await attendi(500);
}
await attendi(1500);
await valuta("document.querySelector('.pannello [data-chiudi], .novita button')?.click()");
for (let i = 0; i < 120; i++) {
  if (await valuta("!document.querySelector('.menu .caricamento, .menu-caricamento')")) break;
  await attendi(500);
}
console.log("versione:", await valuta("document.body.innerText.match(/0\\.2\\.5-beta\\.\\d+/)?.[0] ?? '?'"));
await valuta("document.querySelector('.menu-voci button[data-voce=\"nuova\"]').click()");
for (let i = 0; i < 100 && !(await valuta("!!document.querySelector('.intro.in-corso')")); i++) await attendi(100);
const t0 = Date.now();
const secondo = () => (Date.now() - t0) / 1000;
const campioni = [];
const appunti = new Map([[20, "A-20 (B1)"], [31, "A-31 (B2)"], [68, "B-68 (B5, sopra il tema)"], [137, "F-137 (B8)"], [155, "F-155 (B10)"], [168, "G-168 (titolo)"]]);
const fatti = new Set();
let fine = null;
while (secondo() < 195) {
  const t = secondo();
  const st = await valuta("window.__TAURI_INTERNALS__.invoke('audio_mondo_stato').then((x) => x ? (x.livello_db ?? x.livelloDb) : null).catch((e) => String(e))");
  campioni.push([t, st]);
  for (const [s, nome] of appunti) {
    if (t >= s && !fatti.has(s)) {
      fatti.add(s);
      const testo = await valuta("(document.querySelector('.intro')?.innerText ?? '').replace(/\\s+/g, ' ').trim()");
      console.log(`${nome} a ${t.toFixed(1)} s, a schermo: «${testo}»`);
      const r = await manda("Page.captureScreenshot", { format: "jpeg", quality: 80 });
      fs.writeFileSync(path.join(foto, `${nome.split(" ")[0]}.jpg`), Buffer.from(r.result.data, "base64"));
    }
  }
  if (t > 170) {
    const s = await valuta("({ intro: !!document.querySelector('.intro'), gioco: !!document.querySelector('.gioco .lente-vetro img') })");
    if (!s.intro && s.gioco) {
      fine = t;
      break;
    }
  }
  await attendi(250);
}
const media = (a, b) => {
  const v = campioni.filter(([t, l]) => t >= a && t < b && typeof l === "number").map(([, l]) => 10 ** (l / 10));
  return v.length ? (10 * Math.log10(v.reduce((x, y) => x + y, 0) / v.length)).toFixed(1) : "—";
};
for (const [nome, a, b] of [
  ["solo la statica (5–11 s)", 5, 11],
  ["L.V., B1 (13–24 s)", 13, 24],
  ["L.V., B2 (27,5–36 s)", 27.5, 36],
  ["L.V., B3–B4 (39–56 s)", 39, 56],
  ["il cuore (57,5–60 s)", 57.5, 60],
  ["il tema entra (60,6–63,5 s)", 60.6, 63.5],
  ["L.V. sopra il tema (65–77 s)", 65, 77],
  ["il tema col reattore (80–90 s)", 80, 90],
  ["L.V. in F (126–151 s)", 126, 151],
  ["il titolo (164–172 s)", 164, 172],
]) console.log(`${nome.padEnd(34)} ${media(a, b)} dBFS`);
console.log(fine ? `l'intro si è aperta sul gioco e se n'è andata a ${fine.toFixed(1)} s` : "ERRORE: l'intro non se n'è andata");
await attendi(1500);
const r = await manda("Page.captureScreenshot", { format: "jpeg", quality: 80 });
fs.writeFileSync(path.join(foto, "gioco.jpg"), Buffer.from(r.result.data, "base64"));
console.log("errori:", await valuta("JSON.stringify(window.__erroriIntro ?? null)"));
chiudi();
figlio.kill();
