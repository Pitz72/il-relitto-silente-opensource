// ============================================================================
//  Le misure dello schermo di gioco in Edge senza finestra (revisione 37, L8):
//  apre il browser dello sviluppo alla misura data, con «Testo: grande» o
//  normale, lascia che la prova dei finali giochi da sola e a ogni schermata
//  ferma fa misurare a schermo.js che cosa non torna. Senza finestra perché una
//  pagina nascosta va al rallentatore, e le misure non finirebbero mai.
//    npm --prefix app run dev                         (in un altro terminale: la porta 5274)
//    node strumenti/misure/schermo.mjs 1280 720 --grande
//    node strumenti/misure/schermo.mjs 1920 1080 --grande --foto <cartella>
//    node strumenti/misure/schermo.mjs 1280 720       (il testo normale: che cosa c'era già)
//  --foto: una fotografia delle schermate che contano (la prima di ogni atmosfera, il
//  ramo più pieno, i fiori, ogni dialogo, la protezione vitale).
//  Che cosa leggere nel risultato: «fuori» (testi oltre la finestra), «toccano» (pulsanti ed
//  etichette che si sovrappongono), «petali» (i fiori sui pulsanti o sul testo), «dialogo.scorre»
//  (quante volte le parole non stanno nel loro spazio), «visore», «piccoli» (i corpi sotto il minimo),
//  e quante cose finiscono dietro «+N» (conPiu su conRamo, nascostiMedia).
//  Non tocca le opzioni di nessuno: Edge parte con un profilo suo, usa e getta.
//  RELITTO_EDGE cambia il percorso di Edge, RELITTO_PAGINA l'indirizzo.
// ============================================================================
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const QUI = path.dirname(fileURLToPath(import.meta.url));
const EDGE = process.env.RELITTO_EDGE ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PAGINA = process.env.RELITTO_PAGINA ?? "http://localhost:5274/?prova=finali";
const argomenti = process.argv.slice(2);
const grande = argomenti.includes("--grande");
const iFoto = argomenti.indexOf("--foto");
const foto = iFoto >= 0 ? argomenti[iFoto + 1] : null;
const [W, H] = argomenti.filter((a) => /^\d+$/.test(a)).map(Number);
if (!W || !H) {
  console.log("uso: node strumenti/misure/schermo.mjs <larghezza> <altezza> [--grande] [--foto <cartella>]");
  process.exit(1);
}
const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

const profilo = mkdtempSync(path.join(os.tmpdir(), "relitto-schermo-"));
const porta = 9351 + Math.floor(Math.random() * 400); // più misure possono girare insieme
const figlio = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${porta}`, `--user-data-dir=${profilo}`, "--hide-scrollbars", "--force-device-scale-factor=1", `--window-size=${W},${H}`, "--mute-audio", "about:blank"], { stdio: "ignore" });
let pagina;
for (let i = 0; i < 80 && !pagina; i++) {
  await attendi(250);
  try {
    pagina = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find((x) => x.type === "page");
  } catch {}
}
if (!pagina) {
  figlio.kill();
  throw new Error("Edge non ha aperto la pagina");
}
const ws = new WebSocket(pagina.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const attese = new Map();
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && attese.has(m.id)) {
    attese.get(m.id)(m);
    attese.delete(m.id);
  }
});
const manda = (method, params = {}) =>
  new Promise((r) => {
    const mio = ++id;
    attese.set(mio, r);
    ws.send(JSON.stringify({ id: mio, method, params }));
  });
const valuta = async (expr) => {
  const m = await manda("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 400));
  return m.result?.result?.value;
};
const chiudi = async () => {
  await Promise.race([manda("Browser.close").catch(() => {}), attendi(3000)]);
  try { ws.close(); } catch {}
  figlio.kill();
  await attendi(500);
  try { rmSync(profilo, { recursive: true, force: true }); } catch {}
};

const opzioni = { testoGrande: grande, movimento: "ridotto", apparizioni: false };
// le fotografie: dopo la misura, se la schermata è una di quelle che contano, la prova aspetta che qui si scatti
const CHIEDI_FOTO = `
(() => {
  const misura = window.__aOgniPasso;
  const viste = new Set(); let baccelli = 15, petali = 5; const semi = {};
  window.__aOgniPasso = async (quando) => {
    await misura(quando);
    const g = document.querySelector(".gioco"); if (!g) return;
    const nomi = [];
    const una = (n) => { if (!viste.has(n)) { viste.add(n); nomi.push(n); } };
    const d = document.querySelector(".dialogo");
    if (d) {
      const chi = (d.querySelector(".chi")?.textContent ?? "x").trim().toLowerCase().replace(/[^a-zà-ù]+/g, "-");
      const n = d.querySelectorAll(".semi button").length, par = d.querySelector(".parole");
      if (!(chi in semi) || n > semi[chi]) { semi[chi] = n; nomi.push("dialogo-" + chi + "-" + n + "-semi"); }
      if (par && par.scrollHeight - par.clientHeight > 2) una("dialogo-" + chi + "-che-scorre-" + n);
    } else {
      una("stanza-" + g.dataset.forma + "-" + g.dataset.atmosfera);
      if (g.hasAttribute("data-protezione")) una("protezione-vitale");
      if (g.hasAttribute("data-ipossia")) una("ipossia");
      const b = [...document.querySelectorAll(".ramo .baccello:not(.misura)")].filter((x) => x.style.visibility !== "hidden").length;
      if (b > baccelli) { baccelli = b; nomi.push("ramo-" + b + "-baccelli"); }
      const f = document.querySelector(".fiore.aperto");
      if (f) {
        const p = f.querySelectorAll(".petalo").length;
        una(document.querySelector(".scelta-in-corso") ? "fiore-usa-con" : document.querySelector(".baccello.piu.aperto") ? "fiore-cose-in-piu" : "fiore");
        if (p > petali) { petali = p; nomi.push("fiore-" + p + "-petali"); }
      }
    }
    if (nomi.length && document.querySelector(".fiore")) await new Promise((r) => setTimeout(r, 500));
    for (const nome of nomi) await new Promise((r) => { window.__foto = { nome, fatto: r }; });
  };
})();`;
await manda("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await manda("Page.enable");
await manda("Page.addScriptToEvaluateOnNewDocument", {
  source: `try { localStorage.setItem("relitto.opzioni", ${JSON.stringify(JSON.stringify(opzioni))}); } catch {}\n${readFileSync(path.join(QUI, "schermo.js"), "utf8")}\n${foto ? CHIEDI_FOTO : ""}`,
});
await manda("Page.navigate", { url: PAGINA });
if (foto) mkdirSync(foto, { recursive: true });

const t0 = Date.now();
let fatte = 0, rapporto = null;
while (Date.now() - t0 < 420000) {
  const stato = await valuta(`JSON.stringify({ fine: !!window.__rapportoFinali, foto: window.__foto?.nome ?? null })`).then(JSON.parse).catch(() => null);
  if (stato?.foto) {
    const f = await manda("Page.captureScreenshot", { format: "jpeg", quality: 88 });
    writeFileSync(path.join(foto, `${String(++fatte).padStart(2, "0")}-${stato.foto}.jpg`), Buffer.from(f.result.data, "base64"));
    await valuta(`(() => { const f = window.__foto; window.__foto = null; f?.fatto(); })()`);
    continue;
  }
  if (stato?.fine) {
    rapporto = JSON.parse(await valuta(`JSON.stringify({ finali: window.__rapportoFinali.finali.map((f) => [f.finale, f.passi, f.errore ?? "ok"]), schermo: JSON.parse(window.__schermo.rapporto(${grande ? 14.4 : 12})) })`));
    break;
  }
  await attendi(foto ? 60 : 400);
}
await chiudi();
if (!rapporto) {
  console.error("la prova non è finita in sette minuti: il server di sviluppo gira? (npm --prefix app run dev)");
  process.exit(1);
}
console.log(JSON.stringify(rapporto, null, 1));
if (foto) console.error(`${fatte} fotografie in ${foto}`);
process.exit(rapporto.finali.every((f) => f[2] === "ok") ? 0 : 1);
