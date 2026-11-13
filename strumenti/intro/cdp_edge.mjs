// ============================================================================
//  Edge senza finestra, con la scheda video vera, aperto sulla revisione
//  dell'intro nel browser di sviluppo (`?intro&revisione`, porta 5274). Lo usano
//  `fotografa.mjs` e `costo.mjs` (documento 09, §14).
//  RELITTO_INTRO cambia l'indirizzo, RELITTO_EDGE il percorso di Edge.
// ============================================================================
import { spawn } from "node:child_process";

const URL_INTRO = process.env.RELITTO_INTRO ?? "http://localhost:5274/?intro&revisione";
const EDGE = process.env.RELITTO_EDGE ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

export const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

/** Apre la revisione dell'intro: il palco è 16:9 sopra la barra, alta 112 punti, quindi 1920 × 1080 esatti. */
export async function apriRevisione(porta, profilo) {
  const figlio = spawn(
    EDGE,
    [
      "--headless=new",
      `--remote-debugging-port=${porta}`,
      `--user-data-dir=${process.env.TEMP}/${profilo}`,
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1920,1192",
      "about:blank",
    ],
    { stdio: "ignore" },
  );
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
    if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 600));
    return m.result?.result?.value;
  };
  await manda("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1192, deviceScaleFactor: 1, mobile: false });
  await manda("Page.enable");
  await manda("Page.navigate", { url: URL_INTRO });
  let pronta = false;
  // la prima volta il server di sviluppo deve ancora preparare la pagina: fino a un minuto
  for (let i = 0; i < 240 && !pronta; i++) {
    await attendi(250);
    pronta = await valuta("!!document.querySelector('.revisione input[type=range]') && !!window.__intro");
  }
  if (!pronta) {
    ws.close();
    figlio.kill();
    throw new Error(`l'intro non si è aperta: il server di sviluppo gira? (${URL_INTRO})`);
  }
  await attendi(2500);
  /** Il cursore del tempo della revisione: mette in pausa e porta l'intro a quel secondo. */
  const vai = async (secondi) => {
    await valuta(
      `(()=>{const i=document.querySelector('.revisione input[type=range]');` +
        `const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;` +
        `s.call(i,'${Number(secondi)}');i.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await attendi(700);
  };
  // Edge si chiude da sé (con i suoi processi figli); se non risponde, lo si ferma
  const chiudi = async () => {
    await Promise.race([manda("Browser.close"), attendi(3000)]);
    try {
      ws.close();
    } catch {}
    figlio.kill();
  };
  return { manda, valuta, vai, chiudi };
}
