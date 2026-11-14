// ============================================================================
//  Il filmato dell'intro, intero: ogni fotogramma preso dalla revisione nel
//  browser di sviluppo, al suo istante esatto (l'intro si disegna dal tempo, non
//  dall'orologio: Intro.tsx, `fotogramma`), e passato a ffmpeg insieme al suono
//  reso dal motore del gioco. Serve all'autore per guardarla e ascoltarla
//  fermandola dove vuole, e prendere appunti (14 novembre 2026).
//
//    npm --prefix app run dev                          (la porta 5274)
//    node strumenti/intro/momenti.mjs > momenti.json
//    cargo run --release --example rendi_intro -- momenti.json <cartella>   (ne esce intro.wav)
//    node strumenti/intro/filma.mjs <filmato.mp4> [--suono intro.wav] [--fps 30]
//         [--da 0] [--a <secondi>] [--crf 18] [--sottotitoli] [--testi]
//
//  Com'è nel gioco di chi non ha toccato le opzioni: con la voce di L.V. (i suoi
//  testi non si vedono) e senza i sottotitoli dei suoni. `--testi` la filma senza
//  voce, con i testi di L.V.; `--sottotitoli` aggiunge i sottotitoli dei suoni.
//  Il minuto e il secondo del filmato sono quelli dell'intro.
//  Limite: nella revisione sotto l'intro non c'è il gioco, quindi negli ultimi
//  secondi la plancia entra nell'ovale su un fondo nero, senza lo schermo di gioco.
// ============================================================================
import { spawn } from "node:child_process";
import { once } from "node:events";
import { apriRevisione, attendi } from "./cdp_edge.mjs";

const argomenti = process.argv.slice(2);
const uscita = argomenti.find((a) => !a.startsWith("--") && a.endsWith(".mp4"));
const opzione = (nome, senza) => {
  const i = argomenti.indexOf(`--${nome}`);
  return i >= 0 ? argomenti[i + 1] : senza;
};
if (!uscita) {
  console.log("uso: node strumenti/intro/filma.mjs <filmato.mp4> [--suono intro.wav] [--fps 30] [--da 0] [--a secondi] [--crf 18] [--sottotitoli] [--testi]");
  process.exit(1);
}
const fps = Number(opzione("fps", 30));
const suono = opzione("suono", null);
const conSottotitoli = argomenti.includes("--sottotitoli");
const conTesti = argomenti.includes("--testi");
const CODA = 1.5; // l'ultimo fotogramma resta, mentre il suono finisce

const r = await apriRevisione(9379, "relitto-edge-film");
// i caratteri, tutti, prima del primo fotogramma: il titolo si scrive in un canvas, che non li aspetta
await r.valuta(`(async()=>{await Promise.all([...document.fonts].map(f=>f.load().catch(()=>0)));await document.fonts.ready;})()`);
// le opzioni della barra, e il cursore del tempo senza scatti (di suo va a passi di un ventesimo di secondo)
const durata = await r.valuta(
  `(()=>{const metti=(parte,vuoi)=>{const l=[...document.querySelectorAll('.revisione label')].find(x=>x.textContent.includes(parte));` +
    `const c=l.querySelector('input');if(c.checked!==vuoi)c.click();};` +
    `metti('sottotitoli',${conSottotitoli});metti('voce di L.V.',${!conTesti});metti('movimento ridotto',false);metti('qualità ridotta',false);` +
    `const i=document.querySelector('.revisione input[type=range]');i.step='any';return Number(i.max);})()`,
);
await r.fermaCiclo();
const da = Number(opzione("da", 0));
const a = Math.min(durata, Number(opzione("a", durata)));
const quanti = Math.floor((a - da) * fps) + 1;

/** Porta l'intro a quel secondo, ferma, e aspetta che il fotogramma sia sullo schermo. Le animazioni dei
 *  fogli di stile (la spia rossa della telecamera) vanno con l'orologio: le si mette al tempo dell'intro. */
const vai = (t) =>
  r.valuta(
    `(async()=>{const i=document.querySelector('.revisione input[type=range]');` +
      `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,'${t.toFixed(5)}');` +
      `i.dispatchEvent(new Event('input',{bubbles:true}));` +
      `for(const an of document.getAnimations()){an.pause();an.currentTime=${(t * 1000).toFixed(2)};}` +
      `await new Promise(f=>window.__quadroVero(()=>window.__quadroVero(f)));` +
      `return Number(i.value);})()`,
  );

const ffmpeg = spawn(
  "ffmpeg",
  [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-",
    ...(suono ? ["-ss", String(da), "-i", suono] : []),
    "-vf", `tpad=stop_mode=clone:stop_duration=${CODA},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`,
    "-c:v", "libx264", "-preset", "slow", "-crf", String(opzione("crf", 18)), "-x264-params", "aq-mode=3",
    "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
    ...(suono ? ["-c:a", "aac", "-b:a", "256k"] : []),
    "-t", String((quanti - 1) / fps + CODA), "-movflags", "+faststart",
    uscita,
  ],
  { stdio: ["pipe", "inherit", "inherit"] },
);
let caduto = null;
ffmpeg.on("exit", (c) => (caduto = c));
ffmpeg.stdin.on("error", () => {});

const inizio = Date.now();
for (let n = 0; n < quanti; n++) {
  const t = da + n / fps;
  const messo = await vai(t);
  if (Math.abs(messo - t) > 0.002) throw new Error(`il cursore è a ${messo}, non a ${t}`);
  const f = await Promise.race([
    r.manda("Page.captureScreenshot", { format: "png", optimizeForSpeed: true, clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 } }).catch((e) => ({ error: String(e.message ?? e) })),
    attendi(30000).then(() => ({ error: "mezzo minuto senza risposta" })),
  ]);
  if (!f.result?.data) {
    ffmpeg.kill();
    await Promise.race([r.chiudi(), attendi(4000)]);
    console.error(`il fotogramma ${n} (secondo ${t.toFixed(2)}) non è arrivato: ${JSON.stringify(f.error ?? {})}`);
    process.exit(1);
  }
  if (caduto !== null) throw new Error(`ffmpeg si è fermato (${caduto})`);
  if (!ffmpeg.stdin.write(Buffer.from(f.result.data, "base64"))) await once(ffmpeg.stdin, "drain");
  if (n % (fps * 10) === 0) console.log(`secondo ${t.toFixed(0)} di ${a.toFixed(0)} · ${((Date.now() - inizio) / 1000).toFixed(0)} s di lavoro`);
}
ffmpeg.stdin.end();
await r.chiudi();
if (caduto === null) await once(ffmpeg, "exit");
console.log(caduto === 0 ? `fatto: ${uscita} (${quanti} fotogrammi a ${fps} al secondo)` : `ffmpeg è uscito con ${caduto}`);
process.exit(caduto === 0 ? 0 : 1);
