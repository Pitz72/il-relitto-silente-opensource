// tipografia.mjs — la grammatica tipografica dell'app (app/src/gioco/lamina/
// grammatica.ts) su tutte le trascrizioni dei percorsi di collaudo, con il
// motore vero in CPython (06-app-desktop.md, §15: «ogni tipo di testo del gioco
// si riconosce, su tutte le trascrizioni»).
//
// Uso (dalla radice del progetto; Node 22):
//   node collaudo/tipografia.mjs                 tutti i percorsi con «# atteso:»
//   node collaudo/tipografia.mjs collaudo/vivi.txt
//   node collaudo/tipografia.mjs -v              con i blocchi di ogni turno
//   node collaudo/tipografia.mjs --solo-testo    come la modalità a solo testo (documento 18): l'elenco, le risposte e le
//                                                domande del motore restano nel testo, e si ricostruiscono come ogni altro
//
// Ogni percorso si gioca con i suoi comandi, come le trascrizioni. A ogni turno:
//   - il testo non si riscrive: ogni evento si ricostruisce dai suoi blocchi,
//     carattere per carattere (a parte l'apostrofo tipografico, solo a schermo);
//   - non si stampa solo ciò che diventa altro (l'elenco, le opzioni…);
//   - ogni maiuscolo del gioco ha un tipo: nessuno resta sconosciuto;
//   - ogni suggerimento del modello d'azione è un pulsante nel testo;
// e, contati per un'altra strada (espressioni più larghe, sul testo grezzo):
//   - le voci del relitto, la protezione vitale, la scatola nera di L.V. e il
//     prologo, le letture, il dialogo, le stanze, la riga del registro dei finali.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { costruisciModello } from "../app/src/azione/modello.ts";
import { AZIONI_DI_SITUAZIONE } from "../app/src/azione/situazione.ts";
import { blocchiDelTurno, nascosto, ricostruisciEvento } from "../app/src/gioco/lamina/grammatica.ts";
import { Ponte, RADICE, STORIA } from "./ponte.mjs";

const QUI = dirname(fileURLToPath(import.meta.url));

const conAttese = (file) => /^\s*#\s*atteso:/m.test(readFileSync(file, "utf8"));

/** Tutti i segmenti di un blocco, anche quelli delle voci e dei dialoghi. */
const segmentiDi = (b) => b.segmenti ?? [];

/** Le occorrenze, sul testo grezzo, contate per un'altra strada. */
const conta = (re, s) => (s.match(re) ?? []).length;
const ORACOLI = {
  voci: /[A-ZÀÈÉÌÒÙ][A-ZÀÈÉÌÒÙ'\- ]+(?:,[^:«»\n]*)?:\s*«/g,
  protezione: /PROTEZIONE VITALE/g,
  scatola: /una voce d'uomo:\n«|^Scatola nera di una tuta extraveicolare\./gm,
  letture: /^(?:ANALISI|LETTURA:|Lunghezza:)/gm,
  registro: /^Registro di bordo, /gm,
};

// la modalità a solo testo: nessun evento nascosto, tranne l'intestazione; i suggerimenti non sono pulsanti
const SOLO_TESTO = process.argv.includes("--solo-testo");

function controllaTurno(eventi, blocchi, modello, dove, problemi, totali) {
  const no = (cosa) => problemi.push(`${dove}: ${cosa}`);
  eventi.forEach((e, i) => {
    if (nascosto(e, SOLO_TESTO)) {
      if (!["elenco", "intestazione", "opzione", "domanda", "sistema"].includes(e.tipo)) no(`evento «${e.tipo}» nascosto`);
      if (SOLO_TESTO && e.tipo !== "intestazione") no(`a solo testo l'evento «${e.tipo}» non si legge`);
      return;
    }
    const r = ricostruisciEvento(blocchi, i);
    if (r !== e.testo) no(`il testo dell'evento ${i} (${e.tipo}) non si ricostruisce:\n      motore: ${JSON.stringify(e.testo.slice(0, 160))}\n      lamina: ${JSON.stringify(r.slice(0, 160))}`);
  });
  for (const b of blocchi) {
    totali.blocchi[b.tipo] = (totali.blocchi[b.tipo] ?? 0) + 1;
    totali.unici[b.tipo] ??= new Set();
    totali.unici[b.tipo].add(b.sorgente);
    for (const s of segmentiDi(b)) {
      totali.segmenti[s.tipo] = (totali.segmenti[s.tipo] ?? 0) + 1;
      if (s.tipo === "maiuscolo") no(`maiuscolo sconosciuto «${s.testo}» in «${b.sorgente.slice(0, 80)}»`);
    }
    if (b.tipo === "stanza" && (!b.nome || b.nome.includes("---"))) no(`stanza senza nome: «${b.sorgente}»`);
    if (b.tipo === "dialogo" && !b.chi) no(`dialogo senza chi parla: «${b.sorgente.slice(0, 60)}»`);
    if (b.tipo === "voce" && !b.segmenti.some((s) => s.tipo === "parlato")) no(`voce senza parlato: «${b.sorgente.slice(0, 60)}»`);
  }
  // ogni suggerimento del modello è un pulsante nel testo
  const segnati = new Set(blocchi.flatMap(segmentiDi).filter((s) => s.tipo === "suggerimento").map((s) => s.suggerimento));
  (SOLO_TESTO ? [] : (modello?.suggerimenti ?? [])).forEach((s, i) => {
    totali.suggerimenti++;
    if (!segnati.has(i)) no(`il suggerimento «${s.frase}» non è segnato nel testo`);
  });
  // gli oracoli, sul testo grezzo
  const grezzo = eventi.filter((e) => e.tipo === "testo" || e.tipo === "fine").map((e) => e.testo).join("\n");
  const quanti = (tipo) => blocchi.filter((b) => b.tipo === tipo).length;
  const prova = (nome, attesi, trovati) => {
    totali.oracoli[nome] = (totali.oracoli[nome] ?? 0) + attesi;
    if (attesi !== trovati) no(`${nome}: ${attesi} nel testo, ${trovati} riconosciute`);
  };
  prova("voci del relitto", conta(ORACOLI.voci, grezzo), quanti("voce"));
  prova("protezione vitale", conta(ORACOLI.protezione, grezzo), blocchi.flatMap(segmentiDi).filter((s) => s.tipo === "protezione").length);
  prova("scatola nera e prologo", conta(ORACOLI.scatola, grezzo), quanti("registrazione"));
  prova("letture", conta(ORACOLI.letture, grezzo), quanti("lettura"));
  prova("registro dei finali", conta(ORACOLI.registro, eventi.filter((e) => e.tipo === "fine").map((e) => e.testo).join("\n")), quanti("registro"));
  prova("dialoghi", eventi.filter((e) => e.tipo === "dialogo").length, quanti("dialogo"));
  prova("stanze", eventi.filter((e) => e.tipo === "stanza").length, quanti("stanza"));
}

async function gioca(ponte, percorso, verboso, totali) {
  const dati = await ponte.chiama("rel_percorso", percorso);
  const problemi = [];
  let turno = await ponte.chiama("rel_avvia", 1);
  const nome = relative(RADICE, percorso).replaceAll("\\", "/");
  // l'apertura: il prologo è una registrazione
  controllaTurno(turno.apertura, blocchiDelTurno(turno.apertura, { soloTesto: SOLO_TESTO }), null, `${nome} · apertura`, problemi, totali);
  let n = 0;
  for (const cmd of [null, ...dati.comandi]) {
    if (cmd !== null) {
      if (turno.esito !== "in_corso") break;
      turno = await ponte.chiama("rel_comando", cmd);
      n++;
    }
    const modello = costruisciModello(turno);
    const verbi = new Set([...turno.pulsanti.verbi.map((v) => v.verbo), ...AZIONI_DI_SITUAZIONE.map((a) => a.comando.split(" ")[0])]);
    const blocchi = blocchiDelTurno(turno.eventi, { suggerimenti: SOLO_TESTO ? [] : modello.suggerimenti, verbi, soloTesto: SOLO_TESTO });
    controllaTurno(turno.eventi, blocchi, modello, `${nome} · ${cmd === null ? "inizio" : `${n}. «${cmd}»`}`, problemi, totali);
    if (verboso && blocchi.length) {
      console.log(`  ${cmd === null ? "(inizio)" : `› ${cmd}`}`);
      for (const b of blocchi) {
        const sotto = (b.segmenti ?? []).filter((s) => s.tipo !== "testo").map((s) => `${s.tipo}:${s.testo}`);
        console.log(`    ${b.tipo.padEnd(13)} ${(b.chi ? `[${b.chi}] ` : "") + (b.sorgente.split("\n")[0].slice(0, 70))}${sotto.length ? `  ⟨${sotto.join(" · ")}⟩` : ""}`);
      }
    }
  }
  totali.turni += n + 1;
  return { problemi, comandi: n };
}

async function main() {
  const argomenti = process.argv.slice(2);
  const verboso = argomenti.includes("-v");
  const scelti = argomenti.filter((a) => a !== "-v" && a !== "--solo-testo").map((a) => join(RADICE, a));
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
  const totali = { turni: 0, suggerimenti: 0, blocchi: {}, unici: {}, segmenti: {}, oracoli: {} };
  let falliti = 0;
  for (const percorso of percorsi) {
    const t0 = performance.now();
    const nome = relative(RADICE, percorso).replaceAll("\\", "/");
    if (verboso) console.log(nome);
    const r = await gioca(ponte, percorso, verboso, totali);
    const secondi = ((performance.now() - t0) / 1000).toFixed(1);
    if (r.problemi.length) {
      falliti++;
      console.log(`[NO] ${nome} (${r.comandi} comandi; ${secondi} s)`);
      for (const p of r.problemi.slice(0, 30)) console.log(`     ${p}`);
      if (r.problemi.length > 30) console.log(`     … e altri ${r.problemi.length - 30}`);
    } else console.log(`[OK] ${nome} (${r.comandi} comandi; ${secondi} s)`);
  }
  // i verbi del gioco, per il giro su tutto il testo
  const verbi = new Set([...(await ponte.chiama("rel_avvia", 1)).pulsanti.verbi.map((v) => v.verbo), ...AZIONI_DI_SITUAZIONE.map((a) => a.comando.split(" ")[0])]);
  ponte.chiudi();
  const elenca = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
  console.log(`\nPercorsi: ${percorsi.length}; falliti: ${falliti}. Turni: ${totali.turni}.`);
  console.log(`Blocchi: ${elenca(totali.blocchi)}.`);
  console.log(`Blocchi diversi: ${elenca(Object.fromEntries(Object.entries(totali.unici).map(([k, v]) => [k, v.size])))}.`);
  console.log(`Segni nel testo: ${elenca(totali.segmenti)}.`);
  console.log(`Contati per un'altra strada: ${elenca(totali.oracoli)}; suggerimenti del modello ${totali.suggerimenti}, tutti nel testo.`);

  // tutto il testo del gioco, anche quello che i percorsi non attraversano
  if (!scelti.length) {
    const t = tuttoIlTesto();
    const tot = { turni: 0, suggerimenti: 0, blocchi: {}, unici: {}, segmenti: {}, oracoli: {} };
    const problemi = [];
    for (const { file, riga, testo } of t) {
      const eventi = [{ tipo: "testo", testo }];
      controllaTurno(eventi, blocchiDelTurno(eventi, { verbi, soloTesto: SOLO_TESTO }), null, `${file}:${riga}`, problemi, tot);
    }
    console.log(`\nIl testo intero del gioco (${t.length} stringhe dei .fav, i rami dei [se] separati): ${problemi.length ? `${problemi.length} PROBLEMI` : "nessun problema"}.`);
    for (const p of problemi.slice(0, 30)) console.log(`     ${p}`);
    console.log(`Blocchi: ${elenca(tot.blocchi)}. Segni: ${elenca(tot.segmenti)}.`);
    if (problemi.length) falliti++;
  }
  return falliti ? 1 : 0;
}

/** Le stringhe dei .fav (sola lettura), con i rami dei condizionali separati e
 *  le variabili riempite da un numero («[traduzione]%» → «42%»). */
function tuttoIlTesto() {
  const cartella = join(RADICE, "relitto-silente");
  const out = [];
  for (const f of readdirSync(cartella).filter((x) => x.endsWith(".fav")).sort()) {
    readFileSync(join(cartella, f), "utf8")
      .split("\n")
      .forEach((riga, i) => {
        if (riga.trimStart().startsWith("#")) return;
        for (const m of riga.matchAll(/"((?:[^"\\]|\\.)*)"/g))
          for (const ramo of m[1].split(/\[(?:se [^\]]*|altrimenti|fine)\]/)) {
            const testo = ramo.replaceAll("\\n", "\n").replace(/\[[a-zàèéìòù' ]+\]/g, "42");
            if (testo.trim()) out.push({ file: f, riga: i + 1, testo });
          }
      });
  }
  return out;
}

process.exitCode = await main();
