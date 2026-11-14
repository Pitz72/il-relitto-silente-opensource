// ============================================================================
//  Edge senza finestra, con la scheda video vera, aperto sulla revisione
//  dell'intro nel browser di sviluppo (`?intro&revisione`, porta 5274). Lo usano
//  `fotografa.mjs`, `costo.mjs` (documento 09, §14) e `filma.mjs`.
//  RELITTO_INTRO cambia l'indirizzo, RELITTO_EDGE il percorso di Edge.
// ============================================================================
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import net from "node:net";

const URL_INTRO = process.env.RELITTO_INTRO ?? "http://localhost:5274/?intro&revisione";
const EDGE = process.env.RELITTO_EDGE ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

export const attendi = (ms) => new Promise((r) => setTimeout(r, ms));

/** Il canale con Edge: un WebSocket ridotto all'osso, senza compressione. Quello di Node la chiede, e allora
 *  rifiuta i messaggi oltre i 4 MB («Max decompressed message size exceeded») e si chiude senza dirlo: la foto
 *  della plancia sotto la grana li supera (per questo, fino al 14 novembre 2026, le foto oltre il secondo 177
 *  non riuscivano). `messaggio` riceve ogni testo che arriva; `chiuso` è chiamata se il canale cade. */
function canale(indirizzo) {
  const u = new URL(indirizzo);
  return new Promise((risolvi, rifiuta) => {
    const s = net.connect(Number(u.port), u.hostname);
    let pezzi = [], tot = 0, serve = 1, aperto = false, frammenti = [];
    const scrivi = (op, corpo) => {
      const n = corpo.length, maschera = randomBytes(4);
      let testa;
      if (n < 126) testa = Buffer.from([128 | op, 128 | n]);
      else if (n < 65536) testa = Buffer.from([128 | op, 254, n >> 8, n & 255]);
      else {
        testa = Buffer.alloc(10);
        testa[0] = 128 | op;
        testa[1] = 255;
        testa.writeBigUInt64BE(BigInt(n), 2);
      }
      const velato = Buffer.from(corpo);
      for (let i = 0; i < n; i++) velato[i] ^= maschera[i & 3];
      s.write(Buffer.concat([testa, maschera, velato]));
    };
    const c = { messaggio: () => {}, chiuso: () => {}, manda: (testo) => scrivi(1, Buffer.from(testo, "utf8")), chiudi: () => s.destroy() };
    const leggi = () => {
      while (tot >= serve) {
        if (pezzi.length > 1) pezzi = [Buffer.concat(pezzi)];
        const b = pezzi[0];
        const avanza = (k) => {
          pezzi = [b.subarray(k)];
          tot -= k;
        };
        if (!aperto) {
          const fine = b.indexOf("\r\n\r\n");
          if (fine < 0) {
            serve = tot + 1;
            return;
          }
          if (!b.toString("latin1", 0, 12).startsWith("HTTP/1.1 101")) return rifiuta(new Error(`Edge non apre il canale: ${b.toString("latin1", 0, 60)}`));
          aperto = true;
          avanza(fine + 4);
          serve = 2;
          risolvi(c);
          continue;
        }
        let n = b[1] & 127, o = 2;
        if (n === 126) o = 4;
        else if (n === 127) o = 10;
        if (b.length < o) {
          serve = o;
          return;
        }
        if (o === 4) n = b.readUInt16BE(2);
        else if (o === 10) n = Number(b.readBigUInt64BE(2));
        if (b.length < o + n) {
          serve = o + n;
          return;
        }
        const op = b[0] & 15, ultimo = b[0] & 128, corpo = b.subarray(o, o + n);
        avanza(o + n);
        serve = 2;
        if (op === 8) return s.destroy();
        if (op === 9) scrivi(10, corpo);
        else if (op !== 10) {
          frammenti.push(corpo);
          if (ultimo) {
            const testo = (frammenti.length === 1 ? frammenti[0] : Buffer.concat(frammenti)).toString("utf8");
            frammenti = [];
            c.messaggio(testo);
          }
        }
      }
    };
    s.on("connect", () =>
      s.write(
        `GET ${u.pathname} HTTP/1.1\r\nHost: ${u.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n` +
          `Sec-WebSocket-Key: ${randomBytes(16).toString("base64")}\r\nSec-WebSocket-Version: 13\r\n\r\n`,
      ),
    );
    s.on("data", (d) => {
      pezzi.push(d);
      tot += d.length;
      leggi();
    });
    s.on("error", (e) => (aperto ? c.chiuso(e) : rifiuta(e)));
    s.on("close", () => c.chiuso(new Error("il canale con Edge si è chiuso")));
  });
}

/** Apre la revisione dell'intro: il palco è 16:9 sopra la barra, alta 112 punti, quindi 1920 × 1080 esatti.
 *  `altri`: altre opzioni per Edge. */
export async function apriRevisione(porta, profilo, altri = []) {
  const figlio = spawn(
    EDGE,
    [
      "--headless=new",
      `--remote-debugging-port=${porta}`,
      `--user-data-dir=${process.env.TEMP}/${profilo}`,
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1920,1192",
      ...altri,
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
  const ws = await canale(pagina.webSocketDebuggerUrl);
  let id = 0, caduto = null;
  const attese = new Map();
  ws.messaggio = (testo) => {
    const m = JSON.parse(testo);
    if (m.id && attese.has(m.id)) {
      attese.get(m.id).si(m);
      attese.delete(m.id);
    }
  };
  // se il canale cade, chi aspetta una risposta lo viene a sapere, invece di aspettare per sempre
  ws.chiuso = (e) => {
    caduto = e;
    for (const a of attese.values()) a.no(e);
    attese.clear();
  };
  const manda = (method, params = {}) =>
    new Promise((si, no) => {
      if (caduto) return no(caduto);
      const mio = ++id;
      attese.set(mio, { si, no });
      ws.manda(JSON.stringify({ id: mio, method, params }));
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
    ws.chiudi();
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
  /** Una casella della barra di revisione (la si trova dal suo testo): accesa o spenta. */
  const scegli = (parte, vuoi) =>
    valuta(
      `(()=>{const l=[...document.querySelectorAll('.revisione label')].find(x=>x.textContent.includes(${JSON.stringify(parte)}));` +
        `const c=l.querySelector('input');if(c.checked!==${!!vuoi})c.click();})()`,
    );
  /** Ferma il ciclo dell'intro: da qui la pagina si ridisegna solo quando `vai` la sposta, una volta per
   *  fotogramma, e la scheda video non lavora a vuoto fra una foto e l'altra (lo usa `filma.mjs`).
   *  `window.__quadroVero` resta il vero requestAnimationFrame. */
  const fermaCiclo = async () => {
    await valuta(
      `(()=>{if(window.__quadroVero)return;window.__quadroVero=window.requestAnimationFrame.bind(window);` +
        `window.requestAnimationFrame=()=>0;})()`,
    );
    await attendi(200);
  };
  // Edge si chiude da sé (con i suoi processi figli); se non risponde, lo si ferma
  const chiudi = async () => {
    await Promise.race([manda("Browser.close").catch(() => {}), attendi(3000)]);
    ws.chiudi();
    figlio.kill();
  };
  return { manda, valuta, vai, scegli, fermaCiclo, chiudi };
}
