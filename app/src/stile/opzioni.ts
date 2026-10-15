// ============================================================================
//  Le opzioni di chi gioca che toccano lo schermo (06-app-desktop.md, §2,
//  principio 6: «movimento ridotto, testo più grande, colori non come unico
//  segnale: sono opzioni, ma il gioco è progettato perché funzionino da subito»).
//  Si ricordano nel browser dell'app (localStorage): sono comodità di chi gioca,
//  non stato del gioco; se lo spazio non c'è, valgono quelle di base.
// ============================================================================
import { useCallback, useEffect, useState } from "react";

export interface Opzioni {
  /** «sistema» segue la preferenza del sistema operativo */
  movimento: "sistema" | "ridotto" | "pieno";
  /** la rivelazione del testo a righe (§4.1); si può spegnere */
  rivelazione: boolean;
  carattere: "newsreader" | "atkinson";
  testoGrande: boolean;
  /** i nomi delle cose toccabili nel testo (D15: sì, attivi di base) */
  nomiToccabili: boolean;
}

export const OPZIONI_DI_BASE: Opzioni = {
  movimento: "sistema",
  rivelazione: true,
  carattere: "newsreader",
  testoGrande: false,
  nomiToccabili: true,
};

const CHIAVE = "relitto.opzioni";

function leggi(): Opzioni {
  try {
    const dati = JSON.parse(localStorage.getItem(CHIAVE) ?? "{}");
    return { ...OPZIONI_DI_BASE, ...(typeof dati === "object" && dati ? dati : {}) };
  } catch {
    return { ...OPZIONI_DI_BASE };
  }
}

function scrivi(o: Opzioni) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(o));
  } catch {
    /* niente spazio: le opzioni valgono fino alla chiusura */
  }
}

// Un deposito solo per tutta l'app: il menu e il gioco vedono le stesse opzioni.
let attuali: Opzioni | null = null;
const ascoltatori = new Set<(o: Opzioni) => void>();

export function useOpzioni(): [Opzioni, (cambio: Partial<Opzioni>) => void] {
  const [opzioni, setOpzioni] = useState<Opzioni>(() => (attuali ??= leggi()));
  useEffect(() => {
    ascoltatori.add(setOpzioni);
    return () => void ascoltatori.delete(setOpzioni);
  }, []);
  const cambia = useCallback((cambio: Partial<Opzioni>) => {
    attuali = { ...(attuali ?? leggi()), ...cambio };
    scrivi(attuali);
    for (const a of ascoltatori) a(attuali);
  }, []);
  return [opzioni, cambia];
}

const RIDOTTO = "(prefers-reduced-motion: reduce)";

/** Vero se il movimento va ridotto: per l'opzione, o per il sistema. */
export function useMovimentoRidotto(preferenza: Opzioni["movimento"]): boolean {
  const [sistema, setSistema] = useState(() => typeof matchMedia === "function" && matchMedia(RIDOTTO).matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const m = matchMedia(RIDOTTO);
    const cambio = () => setSistema(m.matches);
    m.addEventListener("change", cambio);
    return () => m.removeEventListener("change", cambio);
  }, []);
  return preferenza === "ridotto" || (preferenza === "sistema" && sistema);
}

/** Gli attributi della radice dello schermo che dicono le opzioni al CSS. */
export function attributiSchermo(o: Opzioni, ridotto: boolean): Record<string, string> {
  return {
    "data-movimento": ridotto ? "ridotto" : "pieno",
    "data-carattere": o.carattere,
    "data-testo": o.testoGrande ? "grande" : "normale",
  };
}
