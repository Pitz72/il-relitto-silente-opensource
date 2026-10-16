// ============================================================================
//  Il filo dal gioco al suono (06, §9.1; bibbia sonora, §10). A ogni turno il
//  gioco manda al motore audio in Rust gli stati e gli eventi del suono così come
//  li calcola il ponte (`turno.suono`): è la regia del motore che decide che cosa
//  suonare. Il mondo sonoro parte con la partita, si abbassa nella pausa e tace
//  tornando al menu. Fuori da Tauri (il browser dello sviluppo) tutto tace.
// ============================================================================
import { comando, dentroTauri, type ComandoMondo, type MixMondo } from "../lib/tauri";
import type { Turno } from "../motore/tipi";
import type { Opzioni } from "../stile/opzioni";
import type { Gesto } from "./tocco";
import { leggiLivelli } from "./livelli";

let avviato: Promise<unknown> | null = null;

async function manda(c: ComandoMondo): Promise<void> {
  if (!dentroTauri() || !avviato) return;
  await avviato;
  try {
    await comando("audio_mondo", { comando: c });
  } catch {
    /* il motore audio non c'è (nessun dispositivo): il gioco va avanti muto */
  }
}

/** Avvia un mondo sonoro nuovo per la partita (il vecchio sfuma). Muto nelle prove. */
export function avviaSuono(muto = false): void {
  if (!dentroTauri()) return;
  avviato = comando("audio_mondo_avvia").catch(() => null);
  // il mix d'autore che la console di regia ha lasciato (se non ha toccato niente, quello del file)
  void manda({ tipo: "livelli", valore: leggiLivelli() });
  if (muto) void manda({ tipo: "volume", valore: -120 });
}

/** Il turno, come lo manda il ponte. */
export const suonaTurno = (t: Turno) => manda({ tipo: "turno", valore: t.suono });

/** La pausa, il diario, i pannelli: il mondo si abbassa, non si ferma. */
export const pausaSuono = (si: boolean) => manda({ tipo: "pausa", valore: si });

/** Tornando al menu il mondo tace: una stanza vuota lo fa sfumare. */
export const taciSuono = () => manda({ tipo: "turno", valore: { stati: { stanza: "", esito: "in_corso" }, eventi: [] } });

/** Il menu principale (documento 21): il mondo tace, l'interfaccia è tutta membrana, e suona la
 *  musica del menu; `false` la fa sfumare (si va all'intro o al gioco). */
export const menuSuono = (si: boolean) => manda({ tipo: "menu", valore: si });

/** Un tocco su un pulsante: il motore sceglie la voce (acciaio, membrana, strappo) dallo
 *  stato. Nello sviluppo i gesti si segnano in `window.__tocchi`, per vederli senza Tauri. */
export function suonaTocco(g: Gesto): Promise<void> {
  if (import.meta.env.DEV) ((window as unknown as { __tocchi?: string[] }).__tocchi ??= []).push(g);
  return manda({ tipo: "tocco", valore: g });
}

/** I cursori e le opzioni del suono. */
export function mixDa(o: Opzioni): MixMondo {
  return {
    generale: o.volume,
    // gli effetti sono un cursore solo per chi gioca: il motore ne tiene tre bus
    ambienti: o.volumeEffetti,
    effetti: o.volumeEffetti,
    voci: o.volumeEffetti,
    musica: o.volumeMusica,
    interfaccia: o.volumeInterfaccia,
    parlato: o.volumeParlato,
    mono: o.mono,
    dinamica_ridotta: o.dinamicaRidotta,
    intensi_ridotti: o.suoniIntensiRidotti,
  };
}

/** Il mix d'autore (la console di regia): i livelli dei canali in dB. */
export const livelliSuono = (l: Record<string, number>) => manda({ tipo: "livelli", valore: l });

/** L'intro (mondo/intro.rs): i momenti dell'animatic, per far partire la sua colonna sonora; `null` la ferma. */
export const mandaIntro = (valore: unknown) => manda({ tipo: "intro", valore });

export const mixSuono = (o: Opzioni) => manda({ tipo: "mix", valore: mixDa(o) });
