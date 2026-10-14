// ============================================================================
//  Prima di ogni dev e build: Pyodide e lark dentro public/pyodide.
// ----------------------------------------------------------------------------
//  Solo il nucleo di Pyodide (interprete, libreria standard, lockfile) e la
//  ruota di lark presa da vendor/ (versione fissata, impronta verificata su
//  PyPI). Il motore e il gioco non si copiano: li porta dentro Vite come testo
//  (src/motore/sorgenti.ts). Niente rete: l'app non scarica mai niente.
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const qui = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(qui, "..");

const RUOTE = {
  // nome → SHA-256 pubblicato su PyPI
  "lark-1.3.1-py3-none-any.whl": "c629b661023a014c37da873b4ff58a817398d12635d3bbb2c5a03be7fe5d1e12",
};
const PYODIDE = ["pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];

const dest = path.join(app, "public", "pyodide");
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const f of PYODIDE) fs.copyFileSync(path.join(app, "node_modules", "pyodide", f), path.join(dest, f));
for (const [ruota, attesa] of Object.entries(RUOTE)) {
  const dati = fs.readFileSync(path.join(app, "vendor", ruota));
  const impronta = crypto.createHash("sha256").update(dati).digest("hex");
  if (impronta !== attesa) throw new Error(`${ruota}: impronta ${impronta}, attesa ${attesa}`);
  fs.writeFileSync(path.join(dest, ruota), dati);
}
const versione = JSON.parse(fs.readFileSync(path.join(app, "node_modules", "pyodide", "package.json"), "utf8")).version;
console.log(`[sincronizza] Pyodide ${versione} + ${Object.keys(RUOTE).join(", ")} → public/pyodide`);
