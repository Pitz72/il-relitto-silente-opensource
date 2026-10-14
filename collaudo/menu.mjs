// menu.mjs — i percorsi di collaudo giocati soltanto con i menu del modello
// d'azione dell'app (app/src/azione), con il motore vero in CPython.
//
// Uso (dalla radice del progetto; Node 22, che legge il TypeScript da sé):
//   node collaudo/menu.mjs                  tutti i percorsi con «# atteso:»
//   node collaudo/menu.mjs collaudo/vivi.txt
//   node collaudo/menu.mjs -v collaudo/vivi.txt     ogni passo, con il comando scelto
//
// È la prova del §6.3 di 06-app-desktop.md: filtrare i verbi è un rischio, e un
// verbo nascosto per sbaglio è un gioco che non si finisce. Per ogni comando del
// percorso si cerca, fra i soli comandi che i menu mostrano in quel momento,
// quello che lo gioca: lo stesso, o uno che porta allo stesso stato con la
// stessa risposta (vedi rel_pulsante_per nel ponte). Un comando che non cambia
// niente, nemmeno il turno («giù» dove non si scende), si salta: con i menu non
// si preme niente. Se i menu non lo hanno, il percorso fallisce. Alla fine si
// controllano le attese del percorso.
// In più: ogni suggerimento in maiuscolo del gioco deve accendere un pulsante
// dei menu (o, se non nomina una cosa, almeno l'attrezzo del suo verbo).

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { comandiDelModello, costruisciModello } from "../app/src/azione/modello.ts";
import { Ponte, RADICE, STORIA } from "./ponte.mjs";

const QUI = dirname(fileURLToPath(import.meta.url));
const FINALI = ["vivi", "prima-nota", "stiva-piena", "doppio-fondo", "mani-vuote", "due-lettere"];

const norm = (s) => s.replace(/’/g, "'").toLowerCase().split(/\s+/).filter(Boolean).join(" ").replace(/\.$/, "");

function conAttese(file) {
  return /^\s*#\s*atteso:/m.test(readFileSync(file, "utf8"));
}

async function gioca(ponte, percorso, verboso) {
  const dati = await ponte.chiama("rel_percorso", percorso);
  let turno = await ponte.chiama("rel_avvia", 1);
  const modi = { uguale: 0, equivalente: 0, "stesso stato": [], "nessun effetto": [] };
  const problemi = [];
  const suggerimenti = { tutti: 0, senza: [] };
  const misure = { cose: 0, voci: 0, massimo: 0, grezze: 0 };
  let giocati = 0;
  for (const cmd of dati.comandi) {
    if (turno.esito !== "in_corso") break;
    const modello = costruisciModello(turno);
    for (const cosa of [...modello.qui, ...modello.conTe]) {
      misure.cose += 1;
      misure.voci += cosa.voci.length;
      misure.massimo = Math.max(misure.massimo, cosa.voci.length);
      misure.grezze += turno.pulsanti.verbi.filter((v) => v.primi.some((p) => p.id === cosa.id)).length;
    }
    const comandi = comandiDelModello(modello);
    let scelto = comandi.find((c) => norm(c) === norm(cmd));
    let modo = "uguale";
    if (!scelto && modello.fase !== "gioco") {
      const opzione = modello.scelte.find((s) => norm(s.etichetta) === norm(cmd));
      if (opzione) scelto = opzione.comando;
    }
    if (!scelto) {
      const r = await ponte.chiama("rel_pulsante_per", cmd, JSON.stringify(comandi));
      if (!r.trovato) {
        problemi.push(["ogni comando ha il suo pulsante nei menu", `nessuna voce dei menu per «${cmd}»`]);
        if (verboso) console.log(`  ✗ ${JSON.stringify(cmd)}: i menu offrono ${comandi.length} comandi`);
        break;
      }
      scelto = r.comando;
      modo = r.modo;
    }
    if (modo === "stesso stato") modi["stesso stato"].push(`${cmd} → ${scelto}`);
    else if (modo === "nessun effetto") modi["nessun effetto"].push(cmd);
    else modi[modo] += 1;
    if (verboso) {
      const segno = { uguale: "=", equivalente: "≈", "stesso stato": "~", "nessun effetto": "∅" }[modo];
      console.log(`  ${segno} ${JSON.stringify(cmd).padEnd(44)} → ${scelto ?? "(niente)"}`);
    }
    // un comando che non cambia niente, nemmeno il turno: con i menu non si preme niente
    if (scelto === null) continue;
    turno = await ponte.chiama("rel_comando", scelto);
    if (!turno.ok) {
      problemi.push(["nessun errore del ponte", turno.errore]);
      break;
    }
    giocati += 1;
    const dopo = costruisciModello(turno);
    const disponibili = new Set(comandiDelModello(dopo).map(norm));
    for (const s of dopo.suggerimenti) {
      suggerimenti.tutti += 1;
      const acceso = s.comando !== null ? disponibili.has(norm(s.comando)) : s.dove === "attrezzo";
      if (!acceso) suggerimenti.senza.push(`«${s.frase}» dopo «${scelto}»`);
      if (verboso) console.log(`      ↳ suggerimento «${s.frase}» → ${s.comando ?? `(${s.dove ?? "niente"})`}`);
    }
  }
  for (const [attesa, motivo] of await ponte.chiama("controlla", dati.attese)) problemi.push([attesa, motivo]);
  return { problemi, giocati, modi, suggerimenti, misure };
}

async function main() {
  const argomenti = process.argv.slice(2);
  const verboso = argomenti.includes("-v");
  const scelti = argomenti.filter((a) => a !== "-v").map((a) => join(RADICE, a));
  const percorsi = scelti.length
    ? scelti
    : readdirSync(QUI)
        .filter((f) => f.endsWith(".txt"))
        .sort()
        .map((f) => join(QUI, f))
        .filter(conAttese);
  const ponte = new Ponte();
  const compilazione = await ponte.chiama("rel_compila", STORIA);
  if (!compilazione.ok) {
    console.log("Compilazione fallita:", compilazione.errore);
    ponte.chiudi();
    return 2;
  }
  let falliti = 0;
  const totale = { comandi: 0, uguale: 0, equivalente: 0, stesso: 0, fermi: 0, suggerimenti: 0, spenti: 0 };
  const misure = { cose: 0, voci: 0, massimo: 0, grezze: 0 };
  const finali = new Set();
  for (const percorso of percorsi) {
    const t0 = performance.now();
    const r = await gioca(ponte, percorso, verboso);
    totale.comandi += r.giocati;
    totale.uguale += r.modi.uguale;
    totale.equivalente += r.modi.equivalente;
    totale.stesso += r.modi["stesso stato"].length;
    totale.fermi += r.modi["nessun effetto"].length;
    totale.suggerimenti += r.suggerimenti.tutti;
    totale.spenti += r.suggerimenti.senza.length;
    for (const k of Object.keys(misure)) misure[k] = k === "massimo" ? Math.max(misure[k], r.misure[k]) : misure[k] + r.misure[k];
    const nome = relative(RADICE, percorso).replaceAll("\\", "/");
    const dettaglio =
      `${r.giocati} comandi: ${r.modi.uguale} uguali, ${r.modi.equivalente} equivalenti, ` +
      `${r.modi["stesso stato"].length} con lo stesso stato` +
      (r.modi["nessun effetto"].length ? `, ${r.modi["nessun effetto"].length} senza effetto` : "") +
      `; ${((performance.now() - t0) / 1000).toFixed(1)} s`;
    const problemi = [...r.problemi, ...r.suggerimenti.senza.map((s) => ["ogni suggerimento accende un pulsante", s])];
    if (problemi.length) {
      falliti += 1;
      console.log(`[NO] ${nome} (${dettaglio})`);
      for (const [attesa, motivo] of problemi) console.log(`     ${attesa}: ${motivo}`);
    } else {
      console.log(`[OK] ${nome} (${dettaglio})`);
      const finale = FINALI.find((f) => nome.endsWith(`/${f}.txt`));
      if (finale) finali.add(finale);
    }
    for (const riga of [...new Set(r.modi["stesso stato"])].sort()) console.log(`     ~ ${riga} (risposta diversa)`);
    for (const riga of [...new Set(r.modi["nessun effetto"])].sort())
      console.log(`     ∅ ${riga} (non cambia niente: nessun pulsante)`);
  }
  ponte.chiudi();
  const media = (misure.voci / Math.max(1, misure.cose)).toFixed(1);
  const grezza = (misure.grezze / Math.max(1, misure.cose)).toFixed(1);
  console.log(
    `\nPercorsi: ${percorsi.length}; falliti: ${falliti}. Comandi giocati con i menu: ${totale.comandi}: ` +
      `${totale.uguale} con lo stesso comando, ${totale.equivalente} con uno equivalente (stesso stato, stessa ` +
      `risposta), ${totale.stesso} con lo stesso stato e una risposta diversa; ${totale.fermi} comandi senza ` +
      `effetto, saltati.`,
  );
  console.log(
    `Finali giocati con i soli menu: ${finali.size} su ${FINALI.length}. Suggerimenti in maiuscolo: ` +
      `${totale.suggerimenti}, senza pulsante: ${totale.spenti}. Voci per cosa: ${media} in media, ` +
      `${misure.massimo} al massimo (i pulsanti grezzi del motore: ${grezza}).`,
  );
  return falliti ? 1 : 0;
}

process.exitCode = await main();
