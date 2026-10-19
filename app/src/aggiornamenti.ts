// ============================================================================
//  L'aggiornamento automatico (documento 06, fase 9; sviluppo/VERSIONI.md §2.1 e §7).
//  Le release del remake su GitHub portano un latest.json e i pacchetti firmati; il flusso
//  canale.yml copia il latest.json di ogni versione pubblicata nella release fissa
//  «aggiornamenti», che l'app legge (non la «Latest» di GitHub: revisione 25, G3). L'app
//  confronta la sua versione con quella e, se c'è di meglio, lo dice a chi gioca, che
//  decide. La firma si verifica con la chiave pubblica di tauri.conf.json: un pacchetto
//  non firmato dall'autore non si installa. Mentre scarica racconta quanto ha fatto
//  (menu/Aggiornamento.tsx: la barra, nota dell'autore del 19 ottobre 2026). Fuori da
//  Tauri (il browser dello sviluppo) non c'è niente da cercare; con
//  ?aggiornamento-finto, solo nello sviluppo, si finge un aggiornamento per vedere la barra.
// ============================================================================
import { dentroTauri } from "./lib/tauri";
import type { Avanzamento } from "./menu/avanzamento";

/** Lo sviluppo, con ?aggiornamento-finto: un aggiornamento finto, per vedere il pannello. */
export const FINTO = import.meta.env.DEV && new URLSearchParams(location.search).has("aggiornamento-finto");

export type Esito =
  | { tipo: "nuova"; versione: string; note: string; installa: (avanza?: (a: Avanzamento) => void) => Promise<void> }
  | { tipo: "aggiornato" }
  /** il canale risponde ma non ha ancora un latest.json: nessuna versione pubblicata */
  | { tipo: "nessuna" }
  | { tipo: "errore"; testo: string };

/** Il canale c'è ma non ha niente (il plugin, quando nessun indirizzo risponde 200: un 404). */
const NESSUNA = /valid release JSON/i;

/** Un pacchetto con la firma sbagliata (la chiave pubblica di tauri.conf.json non lo riconosce). */
export const FIRMA = /signature|minisign/i;

/** Cerca una versione nuova. Non installa niente: restituisce come farlo. */
export async function cercaAggiornamento(): Promise<Esito> {
  if (FINTO) return finto();
  if (!dentroTauri()) return { tipo: "errore", testo: "L'aggiornamento c'è solo nell'app installata." };
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const u = await check();
    if (!u) return { tipo: "aggiornato" };
    return {
      tipo: "nuova",
      versione: u.version,
      note: u.body ?? "",
      installa: async (avanza) => {
        // l'avanzamento arriva a pezzi di pochi kB: alla pagina se ne dice al più uno ogni decimo di secondo
        let totale: number | null = null;
        let scaricati = 0;
        let ultimo = 0;
        await u.downloadAndInstall((ev) => {
          if (ev.event === "Started") {
            totale = ev.data.contentLength ?? null;
            avanza?.({ fase: "scarica", scaricati: 0, totale });
          } else if (ev.event === "Progress") {
            scaricati += ev.data.chunkLength;
            const ora = performance.now();
            if (ora - ultimo > 100) {
              ultimo = ora;
              avanza?.({ fase: "scarica", scaricati, totale });
            }
          } else if (ev.event === "Finished") {
            avanza?.({ fase: "installa" });
          }
        });
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      },
    };
  } catch (e) {
    const testo = e instanceof Error ? e.message : String(e);
    if (NESSUNA.test(testo)) return { tipo: "nessuna" };
    return { tipo: "errore", testo };
  }
}

/** Solo nello sviluppo: le novità della prossima versione, 44 MB in otto secondi, poi «Installo», e basta. */
function finto(): Esito {
  return {
    tipo: "nuova",
    versione: "9.9.9-finta",
    // le righe della prossima versione, come le porterebbe il corpo della release
    note: ["Per chi gioca:", "", ...__NOVITA__.prossima.map((r) => `- ${r}`)].join("\n"),
    installa: async (avanza) => {
      const totale = 44 * 1024 * 1024;
      avanza?.({ fase: "scarica", scaricati: 0, totale });
      for (let k = 1; k <= 80; k++) {
        await new Promise((r) => setTimeout(r, 100));
        avanza?.({ fase: "scarica", scaricati: (totale * k) / 80, totale });
      }
      avanza?.({ fase: "installa" });
      await new Promise(() => undefined);
    },
  };
}
