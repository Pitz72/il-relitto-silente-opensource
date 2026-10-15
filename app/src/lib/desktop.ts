// ============================================================================
//  Il «siamo nell'app desktop?» dei loghi d'apertura (loghi/suono.ts, copiato
//  pari pari dal Viaggiatore, lo chiede per far partire il suono da solo).
//  Nel Viaggiatore la risposta la dà il ponte di Electron; qui è Tauri.
// ============================================================================
import { dentroTauri } from "./tauri";

/** True dentro l'app desktop (Tauri): lì il suono dei loghi parte senza un gesto. */
export const inDesktop = (): boolean => dentroTauri();
