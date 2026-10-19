// ============================================================================
//  Un piccolo client del protocollo di DevTools per l'eseguibile vero: lo lancia
//  con la porta di debug di WebView2 (WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS) e
//  restituisce come mandargli comandi e valutare espressioni nella pagina. Lo
//  usano gli strumenti di questa cartella (revisione 25, M1, M3, M10).
// ============================================================================
import { spawn } from "node:child_process";

export const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

export async function lancia(exe, porta, env = {}) {
  const figlio = spawn(exe, [], {
    env: { ...process.env, ...env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${porta}` },
    stdio: "ignore",
  });
  let pagina;
  for (let i = 0; i < 80 && !pagina; i++) {
    await attendi(250);
    try {
      pagina = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find((x) => x.type === "page");
    } catch {}
  }
  if (!pagina) throw new Error("nessuna pagina");
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
    if (m.result?.exceptionDetails) throw new Error(m.result.exceptionDetails.exception?.description ?? "errore");
    return m.result?.result?.value;
  };
  const chiudi = () => {
    try { ws.close(); } catch {}
  };
  return { figlio, manda, valuta, chiudi };
}
