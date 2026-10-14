// ============================================================================
//  Il Relitto Silente — le versioni (regole in sviluppo/VERSIONI.md).
// ----------------------------------------------------------------------------
//  Fonte di verità: versione.json («gioco», SemVer 2.0.0; «formatoSalvataggi»,
//  intero). Tutto il resto deve concordare, e questo strumento lo garantisce:
//  app/package.json e il suo lockfile, app/src-tauri/Cargo.toml e Cargo.lock.
//  (app/src-tauri/tauri.conf.json non porta un numero: legge package.json.)
//  Viene dallo strumento del Viaggiatore, adattato a Tauri.
//
//    node strumenti/versione.mjs mostra
//    node strumenti/versione.mjs verifica [--rilascio]
//    node strumenti/versione.mjs prepara <major|minor|patch|pre|X.Y.Z> [--pre alpha|beta|rc]
//    node strumenti/versione.mjs note [X.Y.Z]
//
//  verifica            coerenza fra i file
//  verifica --rilascio in più: il CHANGELOG ha la sezione datata della versione
//  prepara             calcola la nuova versione, aggiorna tutti i file e chiude
//                      nel CHANGELOG la sezione «Non rilasciato» con la data
//  note                stampa le note di una versione (il corpo della release)
// ============================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const P = (...p) => path.join(radice, ...p);
const leggi = (f) => fs.readFileSync(P(f), "utf8");
const leggiJson = (f) => JSON.parse(leggi(f));
const scriviJson = (f, d) => fs.writeFileSync(P(f), JSON.stringify(d, null, 2) + "\n");

// SemVer 2.0.0, espressione ufficiale (semver.org), senza metadati di build:
// quelli (il commit) li aggiunge la build, non si scrivono nei file.
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/;
const PRE = ["alpha", "beta", "rc"];

function analizza(v) {
  const m = SEMVER.exec(v);
  if (!m) throw new Error(`«${v}» non è una versione SemVer valida (MAJOR.MINOR.PATCH[-pre]).`);
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ? m[4].split(".") : [] };
}

// Precedenza SemVer (§11): numeri, poi pre-release < release, poi identificatori.
function confronta(a, b) {
  const x = analizza(a), y = analizza(b);
  for (const k of ["major", "minor", "patch"]) if (x[k] !== y[k]) return x[k] - y[k];
  if (!x.pre.length || !y.pre.length) return (x.pre.length ? -1 : 0) - (y.pre.length ? -1 : 0);
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i], q = y.pre[i];
    if (p === undefined) return -1;
    if (q === undefined) return 1;
    const np = /^\d+$/.test(p), nq = /^\d+$/.test(q);
    if (np && nq && +p !== +q) return +p - +q;
    if (np !== nq) return np ? -1 : 1;
    if (p !== q) return p < q ? -1 : 1;
  }
  return 0;
}

// Regole di npm version: se l'attuale è già una pre-release della versione di
// destinazione, «minor» (o major/patch) punta alla STESSA destinazione:
// 1.1.0-beta.2 + minor = 1.1.0; + minor --pre beta = 1.1.0-beta.3.
function successiva(attuale, passo, pre) {
  const v = analizza(attuale);
  const nucleo = `${v.major}.${v.minor}.${v.patch}`;
  const inPre = v.pre.length > 0;
  let base;
  if (SEMVER.test(passo)) base = passo.split("-")[0];
  else if (passo === "major") base = inPre && v.minor === 0 && v.patch === 0 ? nucleo : `${v.major + 1}.0.0`;
  else if (passo === "minor") base = inPre && v.patch === 0 ? nucleo : `${v.major}.${v.minor + 1}.0`;
  else if (passo === "patch") base = inPre ? nucleo : `${v.major}.${v.minor}.${v.patch + 1}`;
  else if (passo === "pre") {
    if (!inPre) throw new Error(`«pre» vale solo da una pre-release (${attuale} non lo è).`);
    base = nucleo;
    pre = pre ?? v.pre[0];
  } else throw new Error(`Passo sconosciuto «${passo}»: major, minor, patch, pre o una versione X.Y.Z.`);
  if (!pre) return SEMVER.test(passo) ? passo : base;
  if (!PRE.includes(pre)) throw new Error(`Pre-release «${pre}» non ammessa: ${PRE.join(", ")}.`);
  if (inPre && base === nucleo) {
    if (v.pre[0] === pre) return `${base}-${pre}.${(+v.pre[1] || 0) + 1}`;
    if (PRE.indexOf(pre) < PRE.indexOf(v.pre[0])) throw new Error(`Da ${v.pre[0]} non si torna a ${pre}.`);
  }
  return `${base}-${pre}.1`;
}

// --- i file che portano la versione ------------------------------------------
const PACCHETTO = "app/package.json";
const LOCK = "app/package-lock.json";
const CARGO = "app/src-tauri/Cargo.toml";
const CARGO_LOCK = "app/src-tauri/Cargo.lock";
const TAURI = "app/src-tauri/tauri.conf.json";
const NOME_CRATE = "il-relitto-silente";

// la versione del [package] di Cargo.toml: la prima riga «version = …» della sezione
const RE_CARGO = /(\[package\][^[]*?\nversion\s*=\s*")([^"]+)(")/;
const reCargoLock = () => new RegExp(`(\\[\\[package\\]\\]\\nname = "${NOME_CRATE}"\\nversion = ")([^"]+)(")`);

function versioniNeiFile() {
  const out = {};
  out[PACCHETTO] = leggiJson(PACCHETTO).version;
  const l = leggiJson(LOCK);
  out[LOCK] = l.version;
  out[`${LOCK} (packages[""])`] = l.packages?.[""]?.version;
  out[CARGO] = RE_CARGO.exec(leggi(CARGO).replace(/\r\n/g, "\n"))?.[2];
  if (fs.existsSync(P(CARGO_LOCK))) out[CARGO_LOCK] = reCargoLock().exec(leggi(CARGO_LOCK).replace(/\r\n/g, "\n"))?.[2];
  return out;
}

function scriviVersione(v) {
  const vj = leggiJson("versione.json");
  vj.gioco = v;
  scriviJson("versione.json", vj);
  const pk = leggiJson(PACCHETTO);
  pk.version = v;
  scriviJson(PACCHETTO, pk);
  const l = leggiJson(LOCK);
  l.version = v;
  if (l.packages?.[""]) l.packages[""].version = v;
  scriviJson(LOCK, l);
  fs.writeFileSync(P(CARGO), leggi(CARGO).replace(/\r\n/g, "\n").replace(RE_CARGO, `$1${v}$3`));
  if (fs.existsSync(P(CARGO_LOCK)))
    fs.writeFileSync(P(CARGO_LOCK), leggi(CARGO_LOCK).replace(/\r\n/g, "\n").replace(reCargoLock(), `$1${v}$3`));
}

const versioneMotore = () => /VERSIONE_MOTORE\s*=\s*"([^"]+)"/.exec(leggi("motore/strutture.py"))?.[1];

// --- CHANGELOG (formato Keep a Changelog, in italiano) -------------------------
const CL = "CHANGELOG.md";
const INTESTAZIONE_NR = "## [Non rilasciato]";
const leggiCL = () => leggi(CL).replace(/\r\n/g, "\n");

function sezione(testo, titoloRegex) {
  const righe = testo.split("\n");
  const i = righe.findIndex((r) => titoloRegex.test(r));
  if (i < 0) return null;
  let j = i + 1;
  while (j < righe.length && !/^## \[/.test(righe[j])) j++;
  return { inizio: i, fine: j, corpo: righe.slice(i + 1, j).join("\n").trim() };
}
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const titoloVersione = (v) => new RegExp(`^## \\[${escape(v)}\\] - \\d{4}-\\d{2}-\\d{2}$`);

// --- comandi -------------------------------------------------------------------
const [comando, ...argomenti] = process.argv.slice(2);
const opzione = (nome) => {
  const i = argomenti.indexOf(nome);
  return i >= 0 ? argomenti[i + 1] : undefined;
};

try {
  const vj = leggiJson("versione.json");
  const gioco = vj.gioco;

  if (comando === "mostra" || !comando) {
    console.log(`gioco              ${gioco}`);
    console.log(`motore FAVELLA     ${versioneMotore()}`);
    console.log(`formato salvataggi ${vj.formatoSalvataggi}`);
    process.exit(0);
  }

  if (comando === "verifica") {
    const errori = [];
    try {
      analizza(gioco);
    } catch (e) {
      errori.push(e.message);
    }
    if (!Number.isInteger(vj.formatoSalvataggi) || vj.formatoSalvataggi < 1) errori.push("formatoSalvataggi dev’essere un intero ≥ 1.");
    for (const [f, v] of Object.entries(versioniNeiFile())) if (v !== gioco) errori.push(`${f}: ${v} ≠ ${gioco}`);
    if (leggiJson(TAURI).version !== "../package.json") errori.push(`${TAURI}: «version» deve essere "../package.json".`);
    const cl = leggiCL();
    if (!cl.includes(INTESTAZIONE_NR)) errori.push(`${CL}: manca la sezione «${INTESTAZIONE_NR}».`);
    if (argomenti.includes("--rilascio")) {
      const s = sezione(cl, titoloVersione(gioco));
      if (!s) errori.push(`${CL}: manca la sezione «## [${gioco}] - AAAA-MM-GG» (esegui «prepara»).`);
      else if (!s.corpo) errori.push(`${CL}: la sezione ${gioco} è vuota.`);
    }
    if (!versioneMotore()) errori.push("motore/strutture.py: VERSIONE_MOTORE non trovata.");
    if (errori.length) {
      console.error("Versioni NON coerenti:\n  - " + errori.join("\n  - "));
      process.exit(1);
    }
    console.log(`Versioni coerenti: gioco ${gioco}, motore ${versioneMotore()}, formato salvataggi ${vj.formatoSalvataggi}.`);
    process.exit(0);
  }

  if (comando === "prepara") {
    const passo = argomenti[0];
    if (!passo) throw new Error("Indica il passo: major, minor, patch o X.Y.Z.");
    const cl = leggiCL();
    const nr = sezione(cl, new RegExp(`^${escape(INTESTAZIONE_NR)}$`));
    if (!nr) throw new Error(`${CL}: manca la sezione «${INTESTAZIONE_NR}».`);
    if (!nr.corpo) throw new Error(`${CL}: «${INTESTAZIONE_NR}» è vuota: non c’è niente da rilasciare.`);
    // la prima versione può essere quella attuale, mai rilasciata
    const giaRilasciata = sezione(cl, titoloVersione(gioco)) !== null;
    const nuova = successiva(gioco, passo, opzione("--pre"));
    if (giaRilasciata ? confronta(nuova, gioco) <= 0 : confronta(nuova, gioco) < 0) {
      throw new Error(`La nuova versione ${nuova} deve seguire la ${gioco}.`);
    }
    const oggi = new Date().toISOString().slice(0, 10);
    const righe = cl.split("\n");
    righe.splice(nr.inizio, nr.fine - nr.inizio, INTESTAZIONE_NR, "", `## [${nuova}] - ${oggi}`, "", nr.corpo, "");
    fs.writeFileSync(P(CL), righe.join("\n"));
    scriviVersione(nuova);
    console.log(`Versione ${gioco} → ${nuova}. Aggiornati: versione.json, ${PACCHETTO}, ${LOCK}, ${CARGO}, ${CARGO_LOCK}, ${CL}.`);
    console.log(`Poi: collaudo e commit «chore(versioni): ${nuova}».`);
    process.exit(0);
  }

  if (comando === "note") {
    const v = argomenti[0] ?? gioco;
    const s = sezione(leggiCL(), titoloVersione(v));
    if (!s) throw new Error(`${CL}: nessuna sezione per ${v}.`);
    console.log(s.corpo);
    process.exit(0);
  }

  throw new Error(`Comando sconosciuto «${comando}». Usa: mostra, verifica, prepara, note.`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
