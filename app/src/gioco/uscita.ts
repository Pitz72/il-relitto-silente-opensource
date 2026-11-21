// ============================================================================
//  Salvare uscendo (revisione 25, M6). Il salvataggio automatico scatta a ogni
//  cambio di stanza; quello che si fa dentro una stanza si perdeva chiudendo la
//  finestra, con «Esci» o con Alt+F4. Uscendo, la partita in corso (se c'è, e
//  non è finita) va nel posto automatico, da cui «Continua» la riprende.
//  La partita vive nel motore, non in una schermata: si salva anche dal menu.
// ============================================================================
import { motoreSePronto } from "../motore/condiviso";
import type { Salvataggio } from "../motore/tipi";
import { archivio } from "./salvataggi";
import { DEMO } from "../demo";

const VERSIONE = __VERSIONE__;

/** Quanto si aspetta il salvataggio prima di chiudere lo stesso: chi esce non deve restare bloccato. */
const PAZIENZA = 2000;

/** Scrive la partita in corso nel posto automatico. Vero se l'ha scritta; mai un errore. */
export async function salvaUscendo(): Promise<boolean> {
  // la demo dell'atto I non salva (documento 42): nel suo menu non c'è niente da riprendere
  if (DEMO) return false;
  try {
    const m = motoreSePronto();
    if (!m) return false;
    const testo = m.salva(`${VERSIONE.gioco} · ${VERSIONE.commit}`, new Date().toISOString());
    const r = (JSON.parse(testo) as Salvataggio).riassunto;
    // niente da salvare: una partita finita, o nessun comando giocato (anche la partita di prova
    // che il motore fa all'avvio, per misurarsi, ha il turno 0)
    if (!r || r.esito !== "in_corso" || !r.turno) return false;
    const scritto = archivio()
      .scrivi("automatico", testo)
      .then(() => true)
      .catch(() => false);
    return await Promise.race([scritto, new Promise<boolean>((fatto) => setTimeout(() => fatto(false), PAZIENZA))]);
  } catch {
    return false;
  }
}
