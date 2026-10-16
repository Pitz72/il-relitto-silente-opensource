// I momenti dell'animatic e i buchi della traccia, in JSON, per il suono dell'intro:
//   node --experimental-strip-types strumenti/intro/momenti.mjs > momenti.json
// Sono gli stessi che la pagina manda al motore (app/src/intro/suono.ts): una fonte sola, scaletta.ts.
import { SCALETTA, buchiDellaTraccia } from "../../app/src/intro/scaletta.ts";

console.log(JSON.stringify({ momenti: SCALETTA.momenti, durata: SCALETTA.durata, buchi: buchiDellaTraccia(SCALETTA) }, null, 2));
