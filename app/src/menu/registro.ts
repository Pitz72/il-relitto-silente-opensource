// ============================================================================
//  Il registro dei finali (06-app-desktop.md, §4.6): le sei righe del registro
//  di bordo, che si scrivono finale dopo finale. Invoglia a rigiocare senza
//  parlare di trofei: niente contatori, niente percentuali.
//  Ogni voce ha il nome del finale (i nomi dell'autore, in finali.fav) e la
//  riga del registro di bordo come il gioco l'ha scritta, se c'è: «Vivi» e «La
//  prima nota» chiudono con la stessa riga, e in «Due lettere» Eriksonn non
//  torna a scriverla.
//  Puro: la lettura e la scrittura su disco stanno in registroSuDisco.ts.
// ============================================================================
import type { Evento } from "../motore/tipi";
import { MESI } from "../lib/italiano.ts";

/** I sei finali (ponte.py, FINALI), con i loro nomi. */
export const FINALI: readonly { id: string; titolo: string }[] = [
  { id: "vivi", titolo: "Vivi" },
  { id: "prima-nota", titolo: "La prima nota" },
  { id: "stiva-piena", titolo: "La stiva piena" },
  { id: "doppio-fondo", titolo: "Doppio fondo" },
  { id: "mani-vuote", titolo: "Mani vuote" },
  { id: "due-lettere", titolo: "Due lettere" },
];

export interface VoceRegistro {
  finale: string;
  titolo: string;
  /** la riga del registro di bordo del finale, o null se il finale non la scrive */
  riga: string | null;
  /** quando è stato raggiunto la prima volta (ISO) */
  data: string;
}

/** La riga del registro di bordo nel testo di un finale («Registro di bordo, TSC-1972. …»). */
export function rigaDelRegistro(eventi: readonly Evento[]): string | null {
  for (const e of eventi)
    for (const r of e.testo.split("\n")) if (/^Registro di bordo, /.test(r.trim())) return r.trim().replace(/'/g, "’");
  return null;
}

/** Il registro con un finale in più: la prima volta resta, le altre no. In ordine di data. */
export function conFinale(registro: readonly VoceRegistro[], finale: string, riga: string | null, data: string): VoceRegistro[] {
  const titolo = FINALI.find((f) => f.id === finale)?.titolo;
  if (!titolo || registro.some((v) => v.finale === finale)) return [...registro];
  return [...registro, { finale, titolo, riga, data }].sort((a, b) => a.data.localeCompare(b.data));
}

/** Solo le voci buone: un registro rovinato o di un'altra versione non deve impedire di giocare. */
export function pulisci(dati: unknown): VoceRegistro[] {
  if (!Array.isArray(dati)) return [];
  const visti = new Set<string>();
  const out: VoceRegistro[] = [];
  for (const v of dati) {
    if (!v || typeof v !== "object") continue;
    const { finale, riga, data } = v as Record<string, unknown>;
    const f = FINALI.find((x) => x.id === finale);
    if (!f || visti.has(f.id) || typeof data !== "string") continue;
    visti.add(f.id);
    out.push({ finale: f.id, titolo: f.titolo, riga: typeof riga === "string" ? riga : null, data });
  }
  return out.sort((a, b) => a.data.localeCompare(b.data));
}

/** «15 ottobre 2026»: la data di una voce del registro. */
export function giorno(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
}
