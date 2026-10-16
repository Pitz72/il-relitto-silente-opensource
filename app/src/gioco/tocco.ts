// ============================================================================
//  Il tocco sui pulsanti (bibbia sonora, §5.8). Il suono dell'interfaccia lo
//  decide il motore audio dallo stato del gioco (l'acciaio, la membrana, la
//  fuga): la pagina dice soltanto quale gesto è stato fatto. Il gesto si ricava
//  dal pulsante che riceve il clic, non dal suo testo:
//    · annulla  — chiude, torna indietro, dice di no, esce dal discorso;
//    · conferma — manda un comando al motore, dice di sì, sceglie un posto;
//    · scegli   — tutto il resto: apre un fiore, un menu, una pagina.
//  Mai un passaggio del mouse, mai lo scorrimento: solo il clic (e quindi anche
//  Invio e Spazio su un pulsante a fuoco).
// ============================================================================

export type Gesto = "scegli" | "conferma" | "annulla";

/** Quello che serve sapere di un pulsante per scegliere il suo gesto. */
export interface Pulsante {
  classi: readonly string[];
  /** gli attributi data-* (`data-comando` → `comando`) */
  dati: Readonly<Record<string, string | undefined>>;
  disabilitato: boolean;
}

/** Le classi dei pulsanti che chiudono: «chiudi» dei pannelli, «annulla» dell'attrezzo in
 *  mano, «esci» dal discorso. */
const CHIUDONO = ["annulla", "chiudi", "esci"];

/** Il gesto di un pulsante; `null` se è spento (non fa niente, non suona). */
export function gestoDel(p: Pulsante): Gesto | null {
  if (p.disabilitato) return null;
  if (p.dati.tocco === "annulla" || p.dati.risposta === "no" || CHIUDONO.some((c) => p.classi.includes(c))) return "annulla";
  if (p.dati.tocco === "conferma" || p.dati.risposta === "si" || p.dati.comando !== undefined) return "conferma";
  return "scegli";
}

/** Il gesto di un clic, dal pulsante (o dalla voce di menu) che lo riceve. */
export function gestoDelClic(bersaglio: EventTarget | null): Gesto | null {
  if (!(bersaglio instanceof Element)) return null;
  const b = bersaglio.closest<HTMLElement>("button, [role='menuitem']");
  if (!b) return null;
  return gestoDel({ classi: [...b.classList], dati: { ...b.dataset }, disabilitato: b.matches(":disabled, [aria-disabled='true']") });
}
