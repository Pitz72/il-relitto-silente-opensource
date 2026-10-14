// ponte.mjs — il ponte dell'app in CPython (collaudo/servizio_ponte.py), a
// richiesta, per i collaudi scritti in Node (menu.mjs, tipografia.mjs): il
// modello d'azione e la grammatica dell'app sono in TypeScript, il motore resta
// quello vero, in Python.

import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const QUI = dirname(fileURLToPath(import.meta.url));
export const RADICE = dirname(QUI);
export const STORIA = join(RADICE, "relitto-silente", "relitto.fav");

export class Ponte {
  constructor() {
    this.attese = new Map();
    this.prossimo = 1;
    this.processo = spawn(process.env.PYTHON ?? "python", ["-X", "utf8", join(QUI, "servizio_ponte.py")], {
      stdio: ["pipe", "pipe", "inherit"],
    });
    createInterface({ input: this.processo.stdout }).on("line", (riga) => {
      const r = JSON.parse(riga);
      const attesa = this.attese.get(r.id);
      this.attese.delete(r.id);
      if (r.errore) attesa.rifiuta(new Error(r.errore));
      else attesa.risolvi(r.r);
    });
  }
  chiama(f, ...a) {
    const id = this.prossimo++;
    return new Promise((risolvi, rifiuta) => {
      this.attese.set(id, { risolvi, rifiuta });
      this.processo.stdin.write(JSON.stringify({ id, f, a }) + "\n");
    });
  }
  chiudi() {
    this.processo.stdin.end();
  }
}
