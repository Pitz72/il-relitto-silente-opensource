// ============================================================================
//  La demo dell'atto I (l'autore, 21 novembre 2026: «io voglio una DEMO dell'atto 1 e basta. Prima di tutto per
//  Leo e poi decido se metterlo sul sito»). Si costruisce con `vite build --mode demo` (tauri.demo.conf.json):
//  lo stesso gioco, che finisce quando William mette piede sullo scafo nero, la prima stanza dell'atto II.
//  Niente aggiornamenti automatici (la demo non deve diventare il gioco intero) e niente finestra delle novità.
// ============================================================================

/** Vero nella demo: il gioco si ferma alla fine dell'atto I. */
export const DEMO = import.meta.env.MODE === "demo";

/** L'atto da cui la demo non va oltre: entrandoci, la demo finisce. */
export const ATTO_OLTRE_LA_DEMO = 2;
