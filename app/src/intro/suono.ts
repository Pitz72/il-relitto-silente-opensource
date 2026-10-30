// ============================================================================
//  Il suono dell'intro (09-intro-storyboard.md, §5; mondo/intro.rs). La pagina dice al motore
//  audio in Rust quando succedono le cose (i momenti della scaletta); è il motore che ne ricava la
//  partitura e la suona con il suo orologio. Se l'animatic cambia i suoi tempi, il suono li segue.
// ============================================================================
import { mandaIntro } from "../gioco/suono";
import { pezziDellaVoce, SCALETTA, type Scaletta } from "./scaletta";

/** L'intro comincia: il motore suona la sua colonna sonora; `false` la ferma (Esc, o la fine). */
export function introSuono(si: boolean, s: Scaletta = SCALETTA): Promise<void> {
  return mandaIntro(si ? { momenti: s.momenti, durata: s.durata, voce: pezziDellaVoce(s) } : null);
}
