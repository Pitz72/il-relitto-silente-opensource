// ============================================================================
//  Fotografa l'intro ai secondi dati, a 1920 × 1080, dalla revisione nel browser
//  di sviluppo (documento 09, §14). Serve a guardarla scena per scena e a mettere
//  accanto il prima e il dopo.
//    npm --prefix app run dev            (in un altro terminale: la porta 5274)
//    node strumenti/intro/fotografa.mjs <cartella> 64 71 124.2 …
//  Scrive <cartella>/t064.0.png, t071.0.png… Le foto oltre il secondo 177 (la
//  plancia che entra nella lente) non riescono: quelle si guardano nel pannello.
// ============================================================================
import { mkdirSync, writeFileSync } from "node:fs";
import { apriRevisione } from "./cdp_edge.mjs";

const [uscita, ...tempi] = process.argv.slice(2);
if (!uscita || !tempi.length) {
  console.log("uso: node strumenti/intro/fotografa.mjs <cartella> <secondi…>");
  process.exit(1);
}
const r = await apriRevisione(9377, "relitto-edge-foto");
mkdirSync(uscita, { recursive: true });
for (const t of tempi) {
  await r.vai(t);
  const f = await r.manda("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 } });
  const nome = `${uscita}/t${Number(t).toFixed(1).padStart(5, "0")}.png`;
  writeFileSync(nome, Buffer.from(f.result.data, "base64"));
  console.log("ok", nome);
}
await r.chiudi();
