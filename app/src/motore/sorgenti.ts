// ============================================================================
//  I sorgenti che Pyodide scrive nel suo filesystem: i cinque moduli del motore
//  FAVELLA (../motore, mai copiati né modificati), i quattordici moduli del
//  gioco, il ponte e i percorsi di collaudo. Vite li porta dentro il pacchetto
//  come testo: l'app non legge niente da fuori.
// ============================================================================
import ponte from "./ponte.py?raw";

const motore = import.meta.glob(
  "../../../motore/{favella_utils,strutture,libreria_azioni,compilatore,gioco}.py",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const storia = import.meta.glob("../../../relitto-silente/*.fav", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const percorsi = import.meta.glob(["../../../collaudo/*.txt", "!../../../collaudo/trascrizione-*.txt"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const nome = (p: string) => p.slice(p.lastIndexOf("/") + 1);

/** Percorso nel filesystem di Pyodide → contenuto. */
export function fileDaScrivere(): Record<string, string> {
  const file: Record<string, string> = { "/relitto/app/ponte.py": ponte };
  for (const [p, testo] of Object.entries(motore)) file[`/relitto/motore/${nome(p)}`] = testo;
  for (const [p, testo] of Object.entries(storia)) file[`/relitto/relitto-silente/${nome(p)}`] = testo;
  for (const [p, testo] of Object.entries(percorsi)) file[`/relitto/collaudo/${nome(p)}`] = testo;
  return file;
}

export const STORIA = "/relitto/relitto-silente/relitto.fav";
export const MODULI_MOTORE = Object.keys(motore).length;
export const MODULI_STORIA = Object.keys(storia).length;
