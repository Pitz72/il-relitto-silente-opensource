// ============================================================================
//  Lo schermo intero (gli appunti dell'autore, 15 ottobre 2026: «è un
//  videogioco e deve partire a tutto schermo»). L'app parte a schermo intero
//  (tauri.conf.json); l'opzione «Schermo intero» e F11 lo cambiano, e l'opzione
//  si ricorda. Nel browser dello sviluppo è la Fullscreen API (solo dopo un gesto).
// ============================================================================
import { getCurrentWindow } from "@tauri-apps/api/window";
import { dentroTauri } from "./tauri";

/** Mette (true), toglie (false) o scambia (undefined) lo schermo intero; dice com'è dopo. */
export async function schermoIntero(acceso?: boolean): Promise<boolean> {
  if (dentroTauri()) {
    const w = getCurrentWindow();
    const ora = await w.isFullscreen();
    const voluto = acceso ?? !ora;
    if (voluto !== ora) await w.setFullscreen(voluto);
    return voluto;
  }
  const ora = !!document.fullscreenElement;
  const voluto = acceso ?? !ora;
  if (voluto && !ora) await document.documentElement.requestFullscreen().catch(() => undefined);
  if (!voluto && ora) await document.exitFullscreen().catch(() => undefined);
  return !!document.fullscreenElement;
}
