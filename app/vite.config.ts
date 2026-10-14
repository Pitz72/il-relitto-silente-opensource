import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// ============================================================================
//  «Il Relitto Silente» — l'app.
//  Il motore (../motore) e il gioco (../relitto-silente) restano dove sono:
//  entrano nel pacchetto come testo (import.meta.glob con ?raw), e Pyodide li
//  scrive nel suo filesystem all'avvio. Pyodide e lark stanno in public/pyodide
//  (li copia scripts/sincronizza.mjs): niente rete, mai.
// ============================================================================

// Il percorso canonico: la cartella del progetto ha spazi e su Windows può
// arrivare col nome breve; Vite confronterebbe le due forme e rifiuterebbe i file.
const radice = fs.realpathSync.native(fileURLToPath(new URL(".", import.meta.url)));
const progetto = path.resolve(radice, "..");

// L'identità della build (vedi sviluppo/VERSIONI.md): la versione del gioco da
// ../versione.json, quella del motore da ../motore/strutture.py, commit e data.
const versioni = JSON.parse(fs.readFileSync(path.join(progetto, "versione.json"), "utf8"));
const motore =
  /VERSIONE_MOTORE\s*=\s*"([^"]+)"/.exec(fs.readFileSync(path.join(progetto, "motore", "strutture.py"), "utf8"))?.[1] ??
  "?";
const commit = (() => {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { cwd: progetto, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "locale";
  }
})();
const VERSIONE = {
  gioco: versioni.gioco as string,
  motore,
  formatoSalvataggi: versioni.formatoSalvataggi as number,
  commit,
  data: new Date().toISOString().slice(0, 10),
};

export default defineConfig({
  root: radice,
  base: "./",
  define: { __VERSIONE__: JSON.stringify(VERSIONE) },
  plugins: [react()],
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_ENV_"],
  server: {
    port: 5274,
    strictPort: true,
    fs: { allow: [progetto] },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    // il motore e il gioco viaggiano come testo: il blocco è grande per natura
    chunkSizeWarningLimit: 2500,
  },
});
