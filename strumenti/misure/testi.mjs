// ============================================================================
//  M3, E5, E10 (revisione 25): mentre la prova dei sei finali gioca da sola,
//  tre volte al secondo, i testi sotto i 12 px, quelli fuori dalla finestra, i
//  baccelli e le etichette del ramo che si sovrappongono, quanto si stringe il
//  ramo e quante voci finiscono nel «+N», a una misura di finestra finta
//  (Emulation.setDeviceMetricsOverride, senza ricaricare: ricaricando resta grigia).
//    node strumenti/misure/testi.mjs <eseguibile> 1280 720
// ============================================================================
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { lancia, attendi } from "./cdp.mjs";

const [exe, W, H] = process.argv.slice(2);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "relitto-m3-"));
fs.mkdirSync(path.join(tmp, "s"));
fs.mkdirSync(path.join(tmp, "r"));
const { manda, valuta, chiudi, figlio } = await lancia(exe, 9341, { RELITTO_PROVA: "finali", RELITTO_SALVATAGGI: path.join(tmp, "s"), RELITTO_RAPPORTI: path.join(tmp, "r") });
await manda("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });

const VERIFICA = `(() => {
  const W = innerWidth, H = innerHeight;
  // il rettangolo che si vede davvero: la finestra, tagliata dai contenitori che scorrono o nascondono
  const visibile = (el) => {
    let r = el.getBoundingClientRect(); let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const st = getComputedStyle(p);
      if (+st.opacity === 0 || st.visibility === "hidden" || st.display === "none") return null;
      if (/(auto|scroll|hidden|clip)/.test(st.overflow + st.overflowX + st.overflowY)) { const q = p.getBoundingClientRect(); x0 = Math.max(x0, q.left); y0 = Math.max(y0, q.top); x1 = Math.min(x1, q.right); y1 = Math.min(y1, q.bottom); }
    }
    return x1 - x0 > 1 && y1 - y0 > 1 ? { r, x0, y0, x1, y1 } : null;
  };
  const piccoli = {}; const fuori = []; const nome = (el) => (typeof el.className === "string" && el.className ? el.className.split(" ").slice(0, 2).join(".") : el.tagName.toLowerCase());
  for (const el of document.querySelectorAll(".gioco *, .menu-principale *, .pannello *")) {
    const testo = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
    if (!testo) continue;
    const st = getComputedStyle(el);
    if (st.visibility === "hidden" || st.display === "none" || el.closest(".misura, .solo-lettori, [aria-hidden='true']:not(.ramo)")) continue;
    const v = visibile(el); if (!v) continue;
    const fs = parseFloat(st.fontSize), k = nome(el);
    if (fs < 11.95) piccoli[k] = Math.min(piccoli[k] ?? 99, +fs.toFixed(1)) + " «" + testo.slice(0, 16) + "»";
    // fuori dalla finestra (non dentro un contenitore che scorre: quello lo taglia e va bene)
    if (v.r.right > W + 1 || v.r.bottom > H + 1 || v.r.left < -1 || v.r.top < -1) { if (v.x1 > W || v.y1 > H || v.x0 < 0 || v.y0 < 0) fuori.push(k + " «" + testo.slice(0, 16) + "» " + [v.r.left, v.r.top, v.r.right, v.r.bottom].map(Math.round).join(",")); }
  }
  const b = [...document.querySelectorAll(".ramo .baccello:not(.misura)")].filter((x) => x.style.visibility !== "hidden" && getComputedStyle(x).opacity !== "0").map((x) => ({ t: x.textContent.trim().slice(0, 14), r: x.getBoundingClientRect() }));
  const sovr = [];
  for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) { const a = b[i].r, c = b[j].r; if (a.left < c.right - 2 && c.left < a.right - 2 && a.top < c.bottom - 2 && c.top < a.bottom - 2) sovr.push(b[i].t + " / " + b[j].t); }
  for (const e of document.querySelectorAll(".etichetta-ramo")) { if (getComputedStyle(e).opacity === "0") continue; const a = e.getBoundingClientRect(); for (const x of b) { const c = x.r; if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) sovr.push("etichetta " + e.textContent + " / " + x.t); } }
  const scale = [...document.querySelectorAll(".ramo .baccello:not(.misura)")].map((x) => +x.style.getPropertyValue("--scala")).filter((x) => x > 0);
  return { piccoli, fuori, sovr, baccelli: b.length, scalaMin: scale.length ? Math.min(...scale) : null, piu: b.filter((x) => /^\\+/.test(x.t)).length, nascosti: b.filter((x) => /^\\+\\d/.test(x.t)).reduce((a, x) => a + parseInt(x.t.slice(1)), 0) };
})()`;

const piccoli = {}, fuori = new Set(), sovr = new Set();
let campioni = 0, conBaccelli = 0, scalaMin = 9, conPiu = 0, maxBaccelli = 0; const nascosti = [];
const t0 = Date.now();
while (figlio.exitCode === null && Date.now() - t0 < 150000) {
  try {
    const v = await valuta(VERIFICA);
    campioni++;
    if (v.baccelli) conBaccelli++;
    maxBaccelli = Math.max(maxBaccelli, v.baccelli);
    if (v.scalaMin) scalaMin = Math.min(scalaMin, v.scalaMin);
    if (v.piu) conPiu++;
    if (v.baccelli) nascosti.push(v.nascosti);
    Object.assign(piccoli, v.piccoli);
    v.fuori.forEach((x) => fuori.add(x));
    v.sovr.forEach((x) => sovr.add(x));
  } catch {
    break;
  }
  await attendi(300);
}
chiudi();
if (figlio.exitCode === null) figlio.kill();
console.log(JSON.stringify({ misura: `${W}x${H}`, campioni, conBaccelli, maxBaccelli, scalaMin, conPiu, nascostiMedia: +(nascosti.reduce((a, x) => a + x, 0) / Math.max(1, nascosti.length)).toFixed(1), nascostiMax: Math.max(0, ...nascosti), piccoli, fuori: [...fuori].slice(0, 15), sovrapposti: [...sovr].slice(0, 15) }, null, 1));
