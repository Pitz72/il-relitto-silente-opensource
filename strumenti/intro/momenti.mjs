// I momenti dell'intro e i pezzi della voce di L.V., in JSON, per il suono dell'intro:
//   node --experimental-strip-types strumenti/intro/momenti.mjs > momenti.json
// Sono gli stessi che la pagina manda al motore (app/src/intro/suono.ts): una fonte sola, scaletta.ts.
import { SCALETTA, pezziDellaVoce } from "../../app/src/intro/scaletta.ts";

console.log(JSON.stringify({ momenti: SCALETTA.momenti, durata: SCALETTA.durata, voce: pezziDellaVoce(SCALETTA) }, null, 2));
