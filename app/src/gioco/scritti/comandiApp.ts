// ============================================================================
//  I comandi che nella modalità a solo testo sono dell'app, non del mondo
//  (progettazione/18-modalita-solo-testo.md, §5.4). Il motore sa eseguire anche SALVA e
//  CARICA da sé, ma nell'app devono passare dall'app, che ha il suo stato (il diario, i
//  salvataggi su disco, la pausa). Tutto il resto lo scrive chi gioca e lo legge il motore.
//  Pura: si prova senza lo schermo.
// ============================================================================
import type { IdPosto } from "../salvataggi.ts";

export type ComandoApp =
  /** `capito: false`: «salva mattina»: i posti sono sei, con un numero */
  | { tipo: "salva"; posto: IdPosto | null; capito: boolean }
  | { tipo: "carica"; posto: IdPosto | null; capito: boolean }
  | { tipo: "ricomincia" }
  | { tipo: "diario" }
  | { tipo: "opzioni" }
  | { tipo: "menu" }
  | { tipo: "tasti" }
  | { tipo: "aiuto" }
  /** a partita finita: i titoli di coda (revisione 37, M10) */
  | { tipo: "titoli" };

/** Quello che l'app sa della partita quando legge una riga: serve a capire le parole che cambiano senso. */
export interface Contesto {
  /** si sta parlando con qualcuno: lì «esci» chiude la conversazione, ed è del motore */
  dialogo?: boolean;
  /** la stanza ha un'uscita «fuori»: lì «esci» è un movimento, ed è del motore */
  fuori?: boolean;
  /** la partita è finita */
  finita?: boolean;
}

const POSTI_VALIDI = new Set(["1", "2", "3", "4", "5", "6", "automatico"]);

/** Le parole, in minuscolo, senza il punto finale e con l'apostrofo dritto. */
function parole(testo: string): string[] {
  return testo
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/[.!]+$/, "")
    .split(/\s+/)
    .filter(Boolean);
}

/** Il posto di «salva 3», «carica nel posto 2», «carica automatico»; null se non c'è. */
function postoDi(resto: string[]): IdPosto | null | undefined {
  const util = resto.filter((p) => !["nel", "nello", "al", "il", "posto", "slot", "numero", "n"].includes(p));
  if (util.length === 0) return null;
  if (util.length === 1 && POSTI_VALIDI.has(util[0])) return util[0] as IdPosto;
  return undefined; // un'altra cosa: non è un comando dell'app
}

/** Il comando dell'app che chi gioca ha scritto, o null se è una riga per il motore.
 *  «quit», «riavvia» e, dove non è un movimento, «esci» il motore li prende per sé: chiede conferma, risponde
 *  «A presto!» e non succede niente, o ricomincia la partita senza che l'app lo sappia (revisione 37, L6). Qui
 *  aprono la pausa, o la conferma dell'app. */
export function interpreta(testo: string, contesto: Contesto = {}): ComandoApp | null {
  const p = parole(testo);
  if (p.length === 0) return null;
  const [verbo, ...resto] = p;
  switch (verbo) {
    case "salva":
    case "carica": {
      const posto = postoDi(resto);
      // «salva mattina» è il salvataggio su file del motore, che nell'app non c'è: si spiega come si fa
      return posto === undefined ? { tipo: verbo, posto: null, capito: false } : { tipo: verbo, posto, capito: true };
    }
    case "ricomincia":
      return resto.length === 0 ? { tipo: "ricomincia" } : null;
    case "ricominciare":
    case "riavvia":
      return resto.length === 0 && !contesto.dialogo ? { tipo: "ricomincia" } : null;
    case "esci":
      // nel dialogo chiude la conversazione; dove c'è un'uscita «fuori» è un passo. Dell'app soltanto quando si
      // sa che qui «fuori» non c'è, o a partita finita
      if (resto.length || contesto.dialogo) return null;
      return contesto.finita || contesto.fuori === false ? { tipo: "menu" } : null;
    case "quit":
    case "exit":
      return resto.length === 0 && !contesto.dialogo ? { tipo: "menu" } : null;
    case "fine":
    case "basta":
      // a partita finita il motore direbbe «A presto!»: qui si torna alla pausa, da dove si va al menu
      return resto.length === 0 && contesto.finita ? { tipo: "menu" } : null;
    case "titoli":
    case "riconoscimenti":
      return contesto.finita && (resto.length === 0 || resto.join(" ") === "di coda") ? { tipo: "titoli" } : null;
    case "diario":
    case "trascrizione":
      return resto.length === 0 ? { tipo: "diario" } : null;
    case "opzioni":
    case "impostazioni":
      return resto.length === 0 ? { tipo: "opzioni" } : null;
    case "menu":
    case "pausa":
      return resto.length === 0 ? { tipo: "menu" } : null;
    case "tasti":
      return resto.length === 0 ? { tipo: "tasti" } : null;
    case "aiuto":
    case "help":
      return resto.length === 0 ? { tipo: "aiuto" } : null;
    default:
      return null;
  }
}

/** Il testo che AIUTO aggiunge, sotto quello del motore: i verbi propri del gioco, e le parole dell'app. */
export const AIUTO_DELL_APP = [
  "Oltre ai comandi di sempre, nel Relitto si può: ANALIZZARE, TRADURRE, SINTONIZZARE, INCIDERE.",
  "Le parole dell'app: SALVA e CARICA (anche con un numero, «salva 3»), DIARIO, OPZIONI, MENU, TASTI, RICOMINCIA; a partita finita, TITOLI.",
  "Con le frecce su e giù si ritrovano i comandi già dati. Esc svuota la riga, e a riga vuota apre la pausa.",
].join("\n");
