// ============================================================================
//  Da dove riprende «Continua» (06-app-desktop.md, §4.6). Pura.
//  La partita in corso, se c'è (tornando dal gioco al menu); altrimenti il
//  salvataggio più recente fra quelli che si leggono e la cui partita non è
//  finita, automatico compreso.
// ============================================================================
import type { Posto } from "../gioco/salvataggi";
import { romano } from "../lib/italiano.ts";

export function daContinuare(posti: readonly Posto[] | null): Posto | null {
  let meglio: Posto | null = null;
  for (const p of posti ?? []) {
    if (!p.presente || !p.leggibile || !p.creato) continue;
    if (p.riassunto && p.riassunto.esito && p.riassunto.esito !== "in_corso") continue;
    if (!meglio || p.creato > meglio.creato!) meglio = p;
  }
  return meglio;
}

/** «La stiva · atto I · turno 6»: dove si riprende, sotto «Continua». */
export function dettaglioDi(p: Posto): string {
  const r = p.riassunto;
  if (!r) return p.posto === "automatico" ? "l’ultima stanza" : `posto ${p.posto}`;
  const stanza = (r.nome_stanza ?? r.stanza ?? "").replace(/'/g, "’").replace(/^./, (x) => x.toUpperCase());
  return `${stanza} · atto ${romano(r.atto)} · turno ${r.turno}`;
}
