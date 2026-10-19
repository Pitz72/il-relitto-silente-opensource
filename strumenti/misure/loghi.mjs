// ============================================================================
//  M1 (revisione 25): i blocchi del thread dell'interfaccia (più di 50 ms) dai
//  loghi alla dichiarazione, nell'eseguibile vero.
//    node strumenti/misure/loghi.mjs app/src-tauri/target/release/il-relitto-silente.exe
//  Stampa le fasi (loghi, dichiarazione, menu) con i loro millisecondi e i blocchi.
// ============================================================================
import { lancia, attendi } from "./cdp.mjs";

const [exe] = process.argv.slice(2);
const { manda, valuta, chiudi } = await lancia(exe, 9340);
await manda("Page.enable");
await manda("Page.addScriptToEvaluateOnNewDocument", {
  source: `window.__lunghi = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lunghi.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: "longtask", buffered: true });
  window.__fasi = []; let prima = ""; setInterval(() => { const s = document.querySelector("[aria-label='Loghi di apertura']") ? "loghi" : document.querySelector(".dichiarazione") ? "dichiarazione" : document.querySelector(".menu-principale") ? "menu" : "altro"; if (s !== prima) { window.__fasi.push([s, Math.round(performance.now())]); prima = s; } }, 50);`,
});
await manda("Page.reload");
await attendi(17000);
const r = await valuta("JSON.stringify({ lunghi: window.__lunghi, fasi: window.__fasi })");
console.log(r);
await valuta("window.__TAURI_INTERNALS__.invoke('esci', { codice: 0 })").catch(() => {});
chiudi();
