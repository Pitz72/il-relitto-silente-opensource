// La tabella delle prese di William per la pagina (documento 41): la stessa del ponte, app/src/motore/racconto.json.
// Sta a sé perché le prove in node non sanno leggere gli import «?raw» di Vite (racconto.ts sì, e lo provano).
import tabella from "../motore/racconto.json?raw";
import { presaDellaRisposta as presa, risposteDa } from "./racconto";

const RISPOSTE = risposteDa(tabella);

/** La presa di William per una risposta di un dialogo, se Leonardo l'ha già registrata. */
export const presaDellaRisposta = (etichetta: string) => presa(etichetta, RISPOSTE);
