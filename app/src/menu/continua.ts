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

/** Il salvataggio automatico di una partita non finita, se c'è: una partita nuova ci scrive sopra al primo cambio di
 *  stanza, e «Nuova partita» prima lo dice e chiede (revisione 37, L12). Un file che non si legge non ha niente da
 *  perdere; una partita finita nemmeno. */
export function automaticoDaPerdere(posti: readonly Posto[] | null): Posto | null {
  const a = (posti ?? []).find((p) => p.posto === "automatico");
  if (!a || !a.presente || !a.leggibile) return null;
  if (a.riassunto?.esito && a.riassunto.esito !== "in_corso") return null;
  return a;
}

/** «La stiva · atto I · turno 6»: dove si riprende, sotto «Continua». */
export function dettaglioDi(p: Posto): string {
  const r = p.riassunto;
  if (!r) return p.posto === "automatico" ? "l’ultima stanza" : `posto ${p.posto}`;
  const stanza = (r.nome_stanza ?? r.stanza ?? "").replace(/'/g, "’").replace(/^./, (x) => x.toUpperCase());
  return `${stanza} · atto ${romano(r.atto)} · turno ${r.turno}`;
}
