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

/** Chi gioca ha detto «Annulla», o lo scaricamento si è fermato: quello che arriva dopo non si installa. */
export interface Segnale {
  annullato: boolean;
}

// I tetti di tempo (revisione 37, M2): senza, se la rete cadeva in silenzio la barra restava ferma per sempre, sopra
// il menu, senza un pulsante: a schermo intero e con il solo mouse il gioco si poteva chiudere solo da fuori.
/** Quanto si aspetta la risposta del canale degli aggiornamenti (ms). */
export const TETTO_CONTROLLO = 20_000;
/** Dopo quanto tempo senza un pezzo nuovo lo scaricamento è fermo (ms). */
export const TETTO_SENZA_PEZZI = 45_000;
/** Gli errori che `installa` solleva da sé: lo scaricamento fermo, e l'«Annulla» di chi gioca. */
export const FERMO = "scaricamento fermo";
export const ANNULLATO = "aggiornamento annullato";

/** Aspetta uno scaricamento tenendolo d'occhio: se per `tetto` ms non arriva un pezzo (`ultimoPezzo` dice quando è
 *  arrivato l'ultimo), o se chi gioca annulla, smette di aspettare con l'errore giusto. A parte, perché le prove la
 *  leggano senza Tauri. */
export function sorveglia(scarico: Promise<void>, ultimoPezzo: () => number, segnale: Segnale, tetto = TETTO_SENZA_PEZZI, ogni = 500): Promise<void> {
  return new Promise<void>((riuscito, fallito) => {
    const guardia = setInterval(() => {
      if (segnale.annullato) finisci(() => fallito(new Error(ANNULLATO)));
      else if (performance.now() - ultimoPezzo() > tetto) {
        segnale.annullato = true;
        finisci(() => fallito(new Error(FERMO)));
      }
    }, ogni);
    const finisci = (poi: () => void) => {
      clearInterval(guardia);
      poi();
    };
    scarico.then(
      () => finisci(() => (segnale.annullato ? fallito(new Error(ANNULLATO)) : riuscito())),
      (e) => finisci(() => fallito(e)),
    );
  });
}
