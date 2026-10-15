// ============================================================================
//  Il registro dei finali su disco, accanto ai salvataggi
//  (src-tauri/src/salvataggi.rs); nel browser dello sviluppo, nel localStorage.
// ============================================================================
import { comando, dentroTauri } from "../lib/tauri";
import { pulisci, type VoceRegistro } from "./registro";

const CHIAVE = "relitto.registro-dei-finali";

export async function leggiRegistro(): Promise<VoceRegistro[]> {
  try {
    const testo = dentroTauri() ? await comando<string>("registro_finali_leggi") : (localStorage.getItem(CHIAVE) ?? "[]");
    return pulisci(JSON.parse(testo));
  } catch {
    return [];
  }
}

export async function scriviRegistro(registro: readonly VoceRegistro[]): Promise<void> {
  const testo = JSON.stringify(registro);
  if (dentroTauri()) await comando<void>("registro_finali_scrivi", { testo });
  else localStorage.setItem(CHIAVE, testo);
}
