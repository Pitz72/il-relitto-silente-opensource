// ============================================================================
//  L'aggiornamento automatico (documento 06, fase 9; sviluppo/VERSIONI.md §2.1 e §7).
//  Le release del remake su GitHub portano un latest.json e i pacchetti firmati; il flusso
//  canale.yml copia il latest.json di ogni versione pubblicata nella release fissa
//  «aggiornamenti», che l'app legge (non la «Latest» di GitHub: revisione 25, G3). L'app
//  confronta la sua versione con quella e, se c'è di meglio, lo dice a chi gioca, che
//  decide. La firma si verifica con la chiave pubblica di tauri.conf.json: un pacchetto
//  non firmato dall'autore non si installa. Fuori da Tauri (il browser dello sviluppo)
//  non c'è niente da cercare.
// ============================================================================
import { dentroTauri } from "./lib/tauri";

export type Esito =
  | { tipo: "nuova"; versione: string; note: string; installa: () => Promise<void> }
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
    const testo = e instanceof Error ? e.message : String(e);
    if (NESSUNA.test(testo)) return { tipo: "nessuna" };
    return { tipo: "errore", testo };
  }
}
