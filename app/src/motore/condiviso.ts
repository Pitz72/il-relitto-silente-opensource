// ============================================================================
//  Il motore, uno per l'app. Comincia a caricarsi all'avvio (riconoscimenti,
//  menu e intro lo lasciano lavorare dietro: 06-app-desktop.md, §10) e lo
//  usano tutte le schermate. Anche quando React (StrictMode) monta due volte,
//  Pyodide si carica una volta sola.
// ============================================================================
import { useEffect, useState } from "react";
import { caricaMotore, type Motore, type TempiAvvio } from "./runtime";

let caricamento: Promise<{ motore: Motore; tempi: TempiAvvio }> | null = null;
let passo = "Avvio…";
/** Il passo di un motore che non è partito (revisione 25, M7): il menu lo dice, invece di aspettare. */
export const MOTORE_FALLITO = "fallito";
let pronto: Motore | null = null;
const ascoltatori = new Set<(p: string) => void>();

/** Comincia a caricare il motore (se non è già partito) e lo restituisce quando è pronto. */
export function avviaMotore(): Promise<{ motore: Motore; tempi: TempiAvvio }> {
  caricamento ??= caricaMotore((p) => {
    passo = p;
    for (const a of ascoltatori) a(p);
  })
    .then((r) => {
      pronto = r.motore;
      passo = "pronto";
      for (const a of ascoltatori) a(passo);
      return r;
    })
    .catch((e: unknown) => {
      console.error("[motore] non è partito:", e);
      passo = MOTORE_FALLITO;
      for (const a of ascoltatori) a(passo);
      throw e;
    });
  return caricamento;
}

/** Il motore, se è già pronto. */
export const motoreSePronto = (): Motore | null => pronto;

/** Il passo del caricamento («Importazione del motore FAVELLA…», poi «pronto»). */
export function usaPassoMotore(): string {
  const [p, setP] = useState(passo);
  useEffect(() => {
    ascoltatori.add(setP);
    setP(passo);
    return () => void ascoltatori.delete(setP);
  }, []);
  return p;
}
