// ============================================================================
//  Quanto costa un fotogramma dello spazio dell'intro, quadro per quadro, in
//  millisecondi, a 1920 × 1080 e a qualità ridotta (documento 09, §14). Disegna
//  ogni quadro 240 volte e aspetta la scheda video: è una misura per confrontare
//  un prima e un dopo sulla stessa macchina, non un numero assoluto.
//    npm --prefix app run dev            (in un altro terminale: la porta 5274)
//    node strumenti/intro/costo.mjs
// ============================================================================
import { apriRevisione } from "./cdp_edge.mjs";

const r = await apriRevisione(9378, "relitto-edge-costo");
// in pausa sulla scena nera, perché l'intro non disegni lo spazio nel mezzo
await r.vai(3);
const esito = await r.valuta(`(async () => {
  const m = window.__intro.motore, gl = m.gl, px = new Uint8Array(4), out = {};
  const prove = [["margine", 10, {}], ["scala", 1, {}], ["scala", 12, {}], ["scala", 23.5, {}], ["plancia", 8, { faro: 1 }],
    ["margine", 10, { ridotta: true }], ["scala", 23.5, { ridotta: true }]];
  for (const [q, t, o] of prove) {
    for (let i = 0; i < 20; i++) m.quadro(q, t, o);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const N = 240, t0 = performance.now();
    for (let i = 0; i < N; i++) m.quadro(q, t + i * 0.001, o);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    out[q + " " + t + " s" + (o.ridotta ? ", ridotta" : "")] = +((performance.now() - t0) / N).toFixed(2);
  }
  const e = gl.getExtension("WEBGL_debug_renderer_info");
  out.scheda = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?";
  return JSON.stringify(out, null, 1);
})()`);
console.log(esito);
await r.chiudi();
