// I momenti dell'intro, i pezzi della voce di L.V. e le due voci nello spazio, in JSON, per il suono dell'intro:
//   node --experimental-strip-types strumenti/intro/momenti.mjs > momenti.json
// Sono gli stessi che la pagina manda al motore (app/src/intro/suono.ts): una fonte sola, scaletta.ts.
import { datiPerIlSuono } from "../../app/src/intro/scaletta.ts";

console.log(JSON.stringify(datiPerIlSuono(), null, 2));
