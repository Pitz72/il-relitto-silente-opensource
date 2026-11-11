// ============================================================================
//  I momenti con un'animazione loro (documento 30, §9) nell'eseguibile vero, per
//  guardarli con il suono e misurarli mentre qualcuno li guarda.
//    python strumenti/misure/salvataggi_momenti.py <cartella>
//    node strumenti/misure/momenti.mjs app/src-tauri/target/release/il-relitto-silente.exe <cartella> [posto]
//  Apre l'eseguibile con i quattro salvataggi di quella cartella (RELITTO_SALVATAGGI:
//  quelli di chi gioca non si toccano), salta i loghi e la dichiarazione, carica il
//  posto 1 (il laboratorio di risonanza, davanti alla nave che si sveglia; o il posto
//  dato per terzo: 2 la mappa stellare, 3 l'Anziano che appare, 4 il suo congedo) e resta a
//  guardare: per ogni momento (la tela .momento) e per ogni colloquio, quanto dura e
//  come scorrono i fotogrammi (il più lento, quanti oltre 34 e oltre 50 millisecondi).
//  Gli altri momenti si raggiungono dal gioco: «menu», «Carica», i posti 2, 3 e 4.
//  Stampa «PRONTO» quando il gioco è nel laboratorio, e il rapporto quando si chiude.
//  Il gioco si apre sullo schermo: prima si avvisa l'autore.
// ============================================================================
import { spawn } from "node:child_process";

const [exe, salvataggi, posto = "1"] = process.argv.slice(2);
const PORTA = 9351;
const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

const figlio = spawn(exe, [], {
  env: { ...process.env, RELITTO_SALVATAGGI: salvataggi, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${PORTA}` },
  stdio: "ignore",
  detached: true,
});
figlio.unref();
let chiuso = false;
figlio.on("exit", () => (chiuso = true));

let pagina;
for (let i = 0; i < 120 && !pagina; i++) {
  await attendi(250);
  try {
    pagina = (await (await fetch(`http://127.0.0.1:${PORTA}/json`)).json()).find((x) => x.type === "page");
  } catch {}
}
if (!pagina) {
  console.log(JSON.stringify({ errore: "l'eseguibile non ha aperto la pagina" }));
  process.exit(1);
}
const ws = new WebSocket(pagina.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
ws.addEventListener("close", () => (chiuso = true));
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
  new Promise((r, no) => {
    if (chiuso) return no(new Error("chiuso"));
    const mio = ++id;
    attese.set(mio, r);
    ws.send(JSON.stringify({ id: mio, method, params }));
    setTimeout(() => attese.has(mio) && (attese.delete(mio), no(new Error("senza risposta"))), 8000);
  });
const valuta = async (expr) => {
  const m = await manda("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (m.result?.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description ?? "errore");
  return m.result?.result?.value;
};
const finche = async (expr, che, ms = 60000) => {
  const t0 = Date.now();
  for (;;) {
    const v = await valuta(expr);
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error(`tempo scaduto: ${che}`);
    await attendi(150);
  }
};

const rapporto = { arrivo: null, opzioni: null, ridotto: null, versione: null, visto: null };
const stampa = () => console.log(JSON.stringify(rapporto, null, 1));

try {
  // --- dai loghi al menu: i loghi con Esc, la dichiarazione con «continua»
  const VISTA = `(() => { const el = (s) => document.querySelector(s); return el(".gioco") ? "gioco" : el(".menu-voci button") ? "menu" : el(".dichiarazione") ? "dichiarazione" : el("[aria-label='Loghi di apertura']") ? "loghi" : ""; })()`;
  for (let giri = 0; giri < 60; giri++) {
    const v = await valuta(VISTA);
    if (v === "menu" || v === "gioco") break;
    if (v === "loghi") await valuta(`window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }))`);
    else if (v === "dichiarazione") await valuta(`document.querySelector(".dichiarazione button")?.click()`);
    await attendi(400);
  }
  await finche(`!!document.querySelector(".menu-voci button[data-voce='carica']")`, "«Carica» nel menu");
  // il motore deve aver finito di caricarsi
  await finche(`!document.querySelector(".menu-caricamento")`, "il motore pronto", 120000);
  rapporto.versione = await valuta(`document.querySelector(".menu-piede span")?.textContent`);
  rapporto.opzioni = await valuta(`localStorage.getItem("relitto.opzioni")`);
  rapporto.ridotto = await valuta(`matchMedia("(prefers-reduced-motion: reduce)").matches`);
  await valuta(`document.querySelector(".menu-voci button[data-voce='carica']").click()`);
  await finche(`[...document.querySelectorAll(".posti .posto")].some((b) => b.querySelector(".nome-posto")?.textContent === "posto ${posto}" && !b.disabled)`, `il posto ${posto}`);
  await attendi(300);
  await valuta(`[...document.querySelectorAll(".posti .posto")].find((b) => b.querySelector(".nome-posto")?.textContent === "posto ${posto}").click()`);
  await finche(`!!document.querySelector(".gioco .lamina")`, "il gioco dopo il caricamento");
  await attendi(600);
  rapporto.arrivo = await valuta(`(document.querySelector(".lamina")?.textContent ?? "").trim().replace(/\\s+/g, " ").slice(0, 90)`);

  // --- chi guarda: i fotogrammi mentre c'è un momento (la tela .momento) o un dialogo
  await valuta(`(() => {
    if (window.__oss) return;
    const o = (window.__oss = { periodi: [], corrente: null });
    let prima = performance.now();
    const giro = (t) => {
      const d = t - prima;
      prima = t;
      const tipo = document.querySelector("canvas.momento") ? "momento" : document.querySelector(".dialogo") ? "dialogo" : null;
      let c = o.corrente;
      if (c && c.tipo !== tipo) {
        c.secondi = +((t - c.da) / 1000).toFixed(2);
        delete c.da;
        o.periodi.push(c);
        c = o.corrente = null;
      }
      if (tipo && !c) c = o.corrente = { tipo, stanza: (document.querySelector(".gioco")?.dataset.stanza ?? ""), da: t, fotogrammi: 0, massimo: 0, oltre34: 0, oltre50: 0, lunghi: [] };
      else if (c) {
        c.fotogrammi += 1;
        if (d > c.massimo) c.massimo = +d.toFixed(1);
        if (d > 34) c.oltre34 += 1;
        if (d > 50) {
          c.oltre50 += 1;
          if (c.lunghi.length < 12) c.lunghi.push([+((t - c.da) / 1000).toFixed(2), Math.round(d)]);
        }
      }
      requestAnimationFrame(giro);
    };
    requestAnimationFrame(giro);
  })()`);
  console.log("PRONTO " + JSON.stringify({ arrivo: rapporto.arrivo, versione: rapporto.versione, opzioni: rapporto.opzioni, ridotto: rapporto.ridotto }));
} catch (e) {
  rapporto.errore = String(e?.message ?? e);
  console.log("ERRORE " + rapporto.errore);
}

// --- si resta a guardare finché il gioco è aperto
while (!chiuso) {
  await attendi(2000);
  try {
    const v = await valuta(`JSON.stringify(window.__oss ? { periodi: window.__oss.periodi, corrente: window.__oss.corrente && { ...window.__oss.corrente, secondi: +((performance.now() - window.__oss.corrente.da) / 1000).toFixed(2) } } : null)`);
    if (v) rapporto.visto = JSON.parse(v);
  } catch {
    try {
      await fetch(`http://127.0.0.1:${PORTA}/json`);
    } catch {
      chiuso = true;
    }
  }
}
stampa();
process.exit(0);
