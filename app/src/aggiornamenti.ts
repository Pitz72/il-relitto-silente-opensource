// ============================================================================
//  L'aggiornamento automatico (documento 06, fase 9; sviluppo/VERSIONI.md §2.1).
//  Le release del remake su GitHub portano un latest.json e i pacchetti firmati; l'app
//  confronta la sua versione con quella e, se c'è di meglio, lo dice a chi gioca, che
//  decide. La firma si verifica con la chiave pubblica di tauri.conf.json: un pacchetto
//  non firmato dall'autore non si installa. Fuori da Tauri (il browser dello sviluppo)
//  non c'è niente da cercare.
// ============================================================================
import { dentroTauri } from "./lib/tauri";

export type Esito =
  | { tipo: "nuova"; versione: string; note: string; installa: () => Promise<void> }
  | { tipo: "aggiornato" }
  | { tipo: "errore"; testo: string };

/** Cerca una versione nuova. Non installa niente: restituisce come farlo. */
export async function cercaAggiornamento(): Promise<Esito> {
  if (!dentroTauri()) return { tipo: "errore", testo: "L'aggiornamento c'è solo nell'app installata." };
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const u = await check();
    if (!u) return { tipo: "aggiornato" };
    return {
      tipo: "nuova",
      versione: u.version,
      note: u.body ?? "",
      installa: async () => {
        await u.downloadAndInstall();
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      },
    };
  } catch (e) {
    return { tipo: "errore", testo: e instanceof Error ? e.message : String(e) };
  }
}
