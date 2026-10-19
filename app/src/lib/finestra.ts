// ============================================================================
//  Lo schermo intero (gli appunti dell'autore, 15 ottobre 2026: «è un
//  videogioco e deve partire a tutto schermo»). L'app parte a schermo intero;
//  l'opzione «Schermo intero» e F11 lo cambiano, e l'opzione si ricorda: anche
//  al processo Tauri, perché la finestra nasca già così al prossimo avvio, senza
//  il lampo dello schermo intero (lib.rs, revisione 25, L8). Nel browser dello
//  sviluppo è la Fullscreen API (solo dopo un gesto).
// ============================================================================
import { getCurrentWindow } from "@tauri-apps/api/window";
import { comando, dentroTauri } from "./tauri";

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

/** Dice al processo Tauri come deve nascere la finestra al prossimo avvio (L8). */
export async function ricordaSchermoIntero(acceso: boolean): Promise<void> {
  if (!dentroTauri()) return;
  await comando("finestra_ricorda", { schermoIntero: acceso }).catch(() => undefined);
}
