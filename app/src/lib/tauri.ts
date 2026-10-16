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

import type { EventoSuono, StatiSuono } from "../motore/tipi";

// --- il mondo sonoro del prototipo (src-tauri/src/mondo) ------------------------
export type AmbienteMondo = "silenzio" | "plancia" | "scafo" | "vestibolo";
export type NaveMondo = "libera" | "accostata" | "agganciata";
export type EventoMondo = "primo_contatto" | "tocca_venature" | "sala_tace" | "gemito" | "goccia" | "sorpresa";

export type ComandoMondo =
  | { tipo: "ambiente"; valore: AmbienteMondo }
  | { tipo: "aria"; valore: number }
  | { tipo: "nave"; valore: NaveMondo }
  | { tipo: "rampa"; valore: number }
  | { tipo: "cammina"; valore: boolean }
  | { tipo: "sforzo"; valore: boolean }
  | { tipo: "evento"; valore: EventoMondo }
  | { tipo: "volume"; valore: number }
  | { tipo: "solo"; valore: string | null }
  | { tipo: "ferma" }
  | { tipo: "prova"; valore: ProvaMondo }
  | { tipo: "turno"; valore: { stati: Partial<StatiSuono>; eventi: EventoSuono[] } }
  | { tipo: "mix"; valore: MixMondo }
  | { tipo: "pausa"; valore: boolean }
  | { tipo: "tocco"; valore: "scegli" | "conferma" | "annulla" };

/** I cursori e le opzioni del suono (mondo/mod.rs, `Mix`): i volumi da 0 a 1. */
export interface MixMondo {
  generale: number;
  ambienti: number;
  effetti: number;
  voci: number;
  mono: boolean;
  dinamica_ridotta: boolean;
  intensi_ridotti: boolean;
}

/** I colpi che la pagina di prova fa suonare a comando (mondo/mod.rs, `Comando::Prova`). */
export type ProvaMondo =
  | "lamiera"
  | "rele"
  | "cigolio"
  | "goccia"
  | "crepa"
  | "granello"
  | "gemito"
  | "spinta"
  | "arpione"
  | "urto"
  | "una_voce"
  | "coro";

/** Il mondo sonoro è tutto sintetizzato: non c’è niente da caricare. */
export interface AvvioMondo {
  avvio_ms: number;
}

export interface IstantaneaMondo {
  fase: number;
  respiri_al_minuto: number;
  livello_db: number;
  protezione: boolean;
  voci: number;
}
