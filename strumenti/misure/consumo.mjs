// ============================================================================
//  M10 (revisione 25): quanto costa il gioco fermo, scena per scena, nell'eseguibile
//  vero: il processore (il gioco con il suono, e la pagina), la scheda video (i
//  motori 3D dei processi, dal contatore «GPU Engine»), i fotogrammi al secondo e
//  quanto lavora il thread dell'interfaccia. Le scene vengono da una copia dei
//  salvataggi (gli originali non si toccano): «menu», «3», «4», «5» (i posti); e
//  le prove fatte per trovare il colpevole: «varianti», «animazioni», «fermi»
//  (senza i cicli JavaScript, poi senza le animazioni CSS), «sonda» (le animazioni,
//  le tele, i filtri), «foto» (una fotografia del salvataggio 3).
//    node strumenti/misure/consumo.mjs <eseguibile> "<cartella dei salvataggi>" menu,3,4,5
//  Windows in italiano scrive i decimali con la virgola: si leggono con `numero`.
//  Per spegnere una cosa si scrive sugli elementi (CSSOM): un <style> aggiunto alla pagina, nell'eseguibile,
//  lo blocca la politica di sicurezza dei contenuti e non spegne niente (trovato il 27 ottobre 2026: le
//  scene «animazioni» e «varianti» del 19 ottobre usavano quello, e non toglievano niente).
// ============================================================================
// Uso: node m10.mjs <exe> <cartella dei salvataggi da copiare> [scene: menu,3,4,5]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { lancia, attendi } from "./cdp.mjs";

const [exe, salvataggi, quali = "menu,3,4,5"] = process.argv.slice(2);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "relitto-m10-"));
fs.mkdirSync(path.join(tmp, "s"));
for (const f of fs.readdirSync(salvataggi)) if (/^posto-\d\.json$/.test(f)) fs.copyFileSync(path.join(salvataggi, f), path.join(tmp, "s", f));

const { manda, valuta, chiudi, figlio } = await lancia(exe, 9344, { RELITTO_SALVATAGGI: path.join(tmp, "s") });
await manda("Performance.enable");

const ps = (cmd) => execFileSync("powershell", ["-NoProfile", "-Command", cmd], { encoding: "utf8" }).trim();
const pid = figlio.pid;
const pids = () => {
  const altri = ps(`Get-CimInstance Win32_Process -Filter "Name='msedgewebview2.exe'" | Where-Object { $_.CommandLine -like '*relittosilente*' } | ForEach-Object { $_.ProcessId }`)
    .split(/\s+/).filter(Boolean).map(Number);
  return [pid, ...altri];
};
const numero = (t) => Number(String(t).trim().replace(",", ".")) || 0;
const cpuSecondi = (lista) => numero(ps(`(Get-Process -Id ${lista.join(",")} -ErrorAction SilentlyContinue | Measure-Object -Property CPU -Sum).Sum`));

/** La scheda video, campionata ogni secondo per `n` secondi, in parallelo: la media della somma dei motori 3D dei processi. */
function gpu(lista, n) {
  return new Promise((risolvi) => {
    const filtro = lista.map((p) => `pid_${p}_`).join("|");
    const cmd = `$s = Get-Counter '\\GPU Engine(*engtype_3D)\\Utilization Percentage' -SampleInterval 1 -MaxSamples ${n}; $s | ForEach-Object { ($_.CounterSamples | Where-Object { $_.InstanceName -match '${filtro}' } | Measure-Object -Property CookedValue -Sum).Sum } | Measure-Object -Average | ForEach-Object { $_.Average }`;
    const p = spawn("powershell", ["-NoProfile", "-Command", cmd], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", () => risolvi(numero(out)));
  });
}

const metrica = async () => Object.fromEntries((await manda("Performance.getMetrics")).result.metrics.map((m) => [m.name, m.value]));
const fps = () => valuta(`new Promise((r) => { const raf = (window.__raf || window.requestAnimationFrame).bind(window); let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) raf(f); else r(Math.round(n / ((performance.now() - t0) / 1000))); }; raf(f); })`);

async function misura(nome) {
  await attendi(2500);
  const lista = pids();
  const c0 = cpuSecondi(lista), m0 = await metrica(), t0 = Date.now();
  const e0 = cpuSecondi([pid]);
  const g = gpu(lista, 8);
  const f = await fps();
  await attendi(8000 - 2000);
  const gpuMedia = await g;
  const c1 = cpuSecondi(lista), m1 = await metrica(), dt = (Date.now() - t0) / 1000;
  const e1 = cpuSecondi([pid]);
  const scena = await valuta(`JSON.stringify({ stanza: document.querySelector('.lente figcaption, .mappa figcaption')?.textContent?.slice(0, 40) ?? '', fuga: !!document.querySelector('[data-fuga], .fuga'), dialogo: !!document.querySelector('.dialogo') })`);
  const r = {
    scena: nome,
    cpu: `${(((c1 - c0) / dt) * 100).toFixed(1)} % di un core (il gioco e il suono ${(((e1 - e0) / dt) * 100).toFixed(1)}, la pagina ${((((c1 - c0) - (e1 - e0)) / dt) * 100).toFixed(1)})`,
    gpu3D: `${gpuMedia.toFixed(1)} %`,
    fps: f,
    threadInterfaccia: `${(((m1.TaskDuration - m0.TaskDuration) / dt) * 100).toFixed(1)} %`,
    script: `${(((m1.ScriptDuration - m0.ScriptDuration) / dt) * 100).toFixed(1)} %`,
    dove: JSON.parse(scena),
  };
  console.log(JSON.stringify(r));
}

// fino al menu: Esc salta i loghi, un clic la dichiarazione
for (let i = 0; i < 120; i++) {
  const s = await valuta("document.querySelector('.menu-voci button[data-voce=\"nuova\"]') ? 'menu' : document.querySelector('.dichiarazione') ? 'dic' : 'loghi'");
  if (s === "menu") break;
  if (s === "dic") await valuta("document.querySelector('.dichiarazione').click()");
  else await valuta("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))");
  await attendi(400);
}
// che il motore sia pronto
for (let i = 0; i < 60; i++) { if (await valuta("!document.querySelector('.menu-dettaglio, .menu-caricamento')?.textContent?.includes('…')")) break; await attendi(500); }

const alMenu = async () => {
  if (await valuta("!!document.querySelector('.menu-principale')")) return;
  await valuta("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))");
  await attendi(600);
  await valuta("[...document.querySelectorAll('.voci-pausa button')].find((b) => b.textContent.includes('Menu principale'))?.click()");
  await attendi(1500);
};
const carica = async (n) => {
  await alMenu();
  for (let i = 0; i < 40; i++) { if (await valuta("!!document.querySelector('.menu-voci button[data-voce=\"carica\"]')")) break; await attendi(300); }
  await valuta("document.querySelector('.menu-voci button[data-voce=\"carica\"]').click()");
  await attendi(800);
  await valuta(`[...document.querySelectorAll('button.posto')].find((b) => b.textContent.includes('posto ${n}'))?.click()`);
  await attendi(600);
  await valuta("document.querySelector('.pannello.conferma [data-risposta=\"si\"]')?.click()");
  for (let i = 0; i < 40; i++) { if (await valuta("!!document.querySelector('.ramo .baccello')")) break; await attendi(500); }
  await attendi(1500);
};

for (const q of quali.split(",")) {
  if (q === "menu") { await alMenu(); await misura("menu"); }
  else if (q === "foto") {
    await carica(3);
    await attendi(2500);
    const f = await manda("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(os.tmpdir(), "relitto-foto-gioco.png"), Buffer.from(f.result.data, "base64"));
    console.log(await valuta(`JSON.stringify((() => { const q = document.querySelector(".mappa .stanza.qui")?.getBoundingClientRect(); const i = document.querySelector(".mappa-impulso .impulso")?.getBoundingClientRect(); return { qui: q && [q.x + q.width / 2, q.y + q.height / 2].map(Math.round), impulso: i && [i.x + i.width / 2, i.y + i.height / 2].map(Math.round) }; })())`));
  }
  else if (q === "fermi") {
    await carica(3);
    await misura("posto 3, tutto");
    await valuta("window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; 'ok'");
    await misura("posto 3, senza i cicli JavaScript");
    await valuta("document.getAnimations().forEach((a) => a.pause()); 'ok'");
    await misura("posto 3, senza cicli e senza animazioni CSS");
    await valuta("window.requestAnimationFrame = window.__raf; location.hash = ''; 'ok'");
  }
  else if (q === "animazioni") {
    await carica(3);
    await misura("posto 3, tutto");
    await valuta(`document.querySelectorAll(${JSON.stringify(".lamina")}).forEach((e) => e.style.setProperty("animation", "none", "important")); 'ok'`);
    await misura("posto 3, senza il respiro della lamina");
    await valuta(`document.querySelectorAll(${JSON.stringify(".mappa .impulso")}).forEach((e) => e.style.setProperty("animation", "none", "important")); 'ok'`);
    await misura("posto 3, e senza l'impulso della mappa");
    await valuta(`document.querySelectorAll(${JSON.stringify(".vetro")}).forEach((e) => e.style.setProperty("animation", "none", "important")); 'ok'`);
    await misura("posto 3, e senza il respiro del vetro");
    await valuta(`document.querySelectorAll(${JSON.stringify("canvas.vene, .lente-vetro canvas, .cellula")}).forEach((e) => e.style.setProperty("display", "none", "important")); 'ok'`);
    await misura("posto 3, e senza vene, lente e cellula");
  }
  else if (q === "varianti") {
    await carica(3);
    await misura("posto 3, tutto");
    await valuta(`document.querySelectorAll(${JSON.stringify("canvas.vene")}).forEach((e) => e.style.setProperty("display", "none", "important")); 'ok'`);
    await misura("posto 3, senza le vene");
    await valuta(`document.querySelectorAll(${JSON.stringify(".lente-vetro canvas")}).forEach((e) => e.style.setProperty("display", "none", "important")); 'ok'`);
    await misura("posto 3, senza vene e lente");
    await valuta(`document.querySelectorAll(${JSON.stringify(".cellula, .visore svg")}).forEach((e) => e.style.setProperty("display", "none", "important")); 'ok'`);
    await misura("posto 3, senza vene, lente e cellula");
  }
  else if (q === "sonda") {
    await carica(3);
    await attendi(2000);
    console.log(await valuta(`JSON.stringify({
      animazioni: document.getAnimations().map((a) => [a.animationName ?? a.transitionProperty ?? a.constructor.name, (a.effect?.target?.className?.baseVal ?? a.effect?.target?.className ?? a.effect?.target?.tagName ?? "").toString().slice(0, 40), a.effect?.getTiming?.().iterations, a.playState]).slice(0, 40),
      tele: [...document.querySelectorAll("canvas")].map((c) => [c.className || c.parentElement?.className, c.width, c.height, !!c.getContext && (c.dataset.contesto ?? "")]),
      filtri: [...document.querySelectorAll(".gioco *")].filter((e) => { const st = getComputedStyle(e); return st.backdropFilter !== "none" || (st.filter !== "none" && st.filter !== "") ; }).map((e) => [(e.className?.baseVal ?? e.className).toString().slice(0, 30), getComputedStyle(e).filter, getComputedStyle(e).backdropFilter]).slice(0, 20),
      video: document.querySelectorAll("video").length,
    })`));
  }
  else if (q === "qualita") {
    // i tre livelli della grafica (documento 30, §8), messi sulla radice dello schermo come fa l'opzione
    // (le vene restano vive: le ferma lo stato del gioco, non un attributo)
    await carica(3);
    await misura("posto 3, grafica piena");
    const metti = (a) => valuta(`(() => { const s = document.querySelector('.schermo.gioco'); Object.assign(s.dataset, ${JSON.stringify(a)}); return 'ok'; })()`);
    await metti({ grana: "ferma", riflessi: "si", luce: "no", segnale: "si", sfocatura: "no" });
    await misura("posto 3, grafica leggera");
    await metti({ grana: "no", riflessi: "no", luce: "no", segnale: "no", sfocatura: "no" });
    await misura("posto 3, grafica essenziale (con le vene vive)");
  }
  else if (q === "resto") {
    // con i cicli fermi e gli effetti nuovi tolti: che cosa costa ancora, animazione per animazione
    await carica(3);
    await valuta("window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; document.querySelectorAll('.grana-strato, .luce-stanza, .ramo-segnale, .riflesso, .appannato').forEach((e) => e.style.setProperty('display', 'none', 'important')); 'ok'");
    await attendi(1000);
    await misura("resto: senza cicli e senza gli effetti nuovi");
    await valuta("document.getAnimations().filter((a) => a.playState === 'finished').forEach((a) => a.cancel()); 'ok'");
    await misura("resto: e senza le animazioni finite");
    for (const nome of ["impulso", "respiro-vetro", "lamina-respira"]) {
      await valuta(`document.getAnimations().filter((a) => a.animationName === ${JSON.stringify(nome)}).forEach((a) => a.pause()); 'ok'`);
      await misura(`resto: e senza ${nome}`);
    }
    console.log(await valuta("JSON.stringify(document.getAnimations().filter((a) => a.playState === 'running').map((a) => [a.constructor.name, a.animationName ?? a.transitionProperty, (a.effect?.target?.className?.baseVal ?? a.effect?.target?.className ?? '').toString().slice(0, 40)]))"));
    await valuta("window.requestAnimationFrame = window.__raf; 'ok'");
  }
  else if (q === "lotto30") {
    // il documento 30: gli effetti nuovi tolti uno alla volta, prima con tutto acceso, poi con i cicli
    // JavaScript fermi. Si tolgono sugli elementi (CSSOM): un <style> aggiunto alla pagina, nell'eseguibile,
    // lo blocca la politica di sicurezza dei contenuti, e non toglie niente
    const togli = (sel, prop = "display", val = "none") =>
      valuta(`document.querySelectorAll(${JSON.stringify(sel)}).forEach((e) => e.style.setProperty(${JSON.stringify(prop)}, ${JSON.stringify(val)}, "important")); 'ok'`);
    for (const cicli of [true, false]) {
      await carica(3);
      const come = cicli ? "" : ", senza cicli";
      if (!cicli) await valuta("window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0; 'ok'");
      await misura(`posto 3${come}, tutto`);
      await togli(".grana-strato");
      await misura(`posto 3${come}, senza la grana`);
      await togli(".luce-stanza");
      await misura(`posto 3${come}, e senza la luce della stanza`);
      await togli(".ramo-segnale");
      await misura(`posto 3${come}, e senza il segnale`);
      await togli(".riflesso, .appannato");
      await misura(`posto 3${come}, e senza il riflesso`);
      if (!cicli) await valuta("window.requestAnimationFrame = window.__raf; 'ok'");
      await alMenu();
    }
  }
  else { await carica(q); await misura(`posto ${q}`); }
}
console.log(JSON.stringify({ baccelli: await valuta("[...document.querySelectorAll('.ramo .baccello:not(.misura)')].map((b) => b.textContent.trim()).join(' | ')") }));
await valuta("window.__TAURI_INTERNALS__.invoke('esci', { codice: 0 })").catch(() => {});
chiudi();
await attendi(1500);
if (figlio.exitCode === null) figlio.kill();
