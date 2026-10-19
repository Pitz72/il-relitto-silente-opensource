// ============================================================================
//  Le parole e la misura dell'aggiornamento in corso (menu/Aggiornamento.tsx).
//  A parte, senza React e senza Tauri, perché le prove le leggano (prove/menu.test.ts).
// ============================================================================

/** Dove sta l'aggiornamento: prima di scaricare, mentre scarica, mentre si installa. */
export type Avanzamento =
  | { fase: "prepara" }
  /** `totale` è null se il server non dice quanto pesa il pacchetto */
  | { fase: "scarica"; scaricati: number; totale: number | null }
  | { fase: "installa" };

const MB = 1024 * 1024;
const mega = (byte: number) => (byte / MB).toFixed(1).replace(".", ",");

/** Quanto è fatto, da 0 a 1; null se non si sa. */
export function frazione(a: Avanzamento): number | null {
  if (a.fase === "prepara") return 0;
  if (a.fase === "installa") return 1;
  if (!a.totale) return null;
  return Math.min(1, Math.max(0, a.scaricati / a.totale));
}

/** La riga sotto la barra. */
export function testoAvanzamento(a: Avanzamento): string {
  if (a.fase === "prepara") return "Comincio a scaricare…";
  if (a.fase === "installa") return "Scaricato. Installo: il gioco si chiude e si riapre da solo.";
  const f = frazione(a);
  return f === null
    ? `Scarico l’aggiornamento: ${mega(a.scaricati)} MB.`
    : `Scarico l’aggiornamento: ${mega(a.scaricati)} di ${mega(a.totale!)} MB (${Math.floor(f * 100)} %).`;
}
