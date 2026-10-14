// ============================================================================
//  I comandi del processo Tauri, con un ripiego quando la pagina gira in un
//  browser qualunque (sviluppo con «npm run dev»): lì l'audio e il rapporto
//  non ci sono, e la pagina lo dice invece di rompersi.
// ============================================================================
import { invoke } from "@tauri-apps/api/core";

export const dentroTauri = () => "__TAURI_INTERNALS__" in window;

export async function comando<T>(nome: string, argomenti?: Record<string, unknown>): Promise<T> {
  if (!dentroTauri()) throw new Error(`«${nome}» funziona solo nell’app`);
  return invoke<T>(nome, argomenti);
}

export interface InfoSistema {
  sistema: string;
  architettura: string;
  versione_app: string;
  webview: string;
  grafica_compatibile: boolean;
  prova: string | null;
}

export interface AvvioAudio {
  info: { host: string; frequenza: number; buffer_interno: number; avvio_ms: number };
  campione_ms: number;
}

export interface MisureAudio {
  blocchi: number;
  frame_per_blocco: number;
  gap_max_ms: number;
  classi_gap: number[];
  cpu_media: number;
  cpu_max: number;
  cpu_campioni: number;
  errori_flusso: number;
  errori_tipi: string[];
  errori_scartati: number;
  buffer_richiesto: number;
  ultimo_segnale_ms: number | null;
  re_acceso: boolean;
  campione_acceso: boolean;
}
