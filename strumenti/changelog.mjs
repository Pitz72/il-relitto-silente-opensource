// ============================================================================
//  Il Relitto Silente — il CHANGELOG letto dagli strumenti (sviluppo/VERSIONI.md).
// ----------------------------------------------------------------------------
//  L'ordine delle versioni (SemVer 2.0.0), le sezioni del CHANGELOG e le righe
//  «Per chi gioca»: le novità che il gioco mostra dopo un aggiornamento e che la
//  release porta nel suo corpo (nota dell'autore del 19 ottobre 2026). Lo usano
//  versione.mjs e la build dell'app (app/vite.config.ts).
// ============================================================================

// SemVer 2.0.0, espressione ufficiale (semver.org), senza metadati di build:
// quelli (il commit) li aggiunge la build, non si scrivono nei file.
export const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/;

export function analizza(v) {
  const m = SEMVER.exec(v);
  if (!m) throw new Error(`«${v}» non è una versione SemVer valida (MAJOR.MINOR.PATCH[-pre]).`);
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ? m[4].split(".") : [] };
}

// Precedenza SemVer (§11): numeri, poi pre-release < release, poi identificatori.
export function confronta(a, b) {
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

// --- le sezioni (formato Keep a Changelog, in italiano) -------------------------
export const INTESTAZIONE_NR = "## [Non rilasciato]";
export const PER_CHI_GIOCA = "### Per chi gioca";

export function sezione(testo, titoloRegex) {
  const righe = testo.replace(/\r\n/g, "\n").split("\n");
  const i = righe.findIndex((r) => titoloRegex.test(r));
  if (i < 0) return null;
  let j = i + 1;
  while (j < righe.length && !/^## \[/.test(righe[j])) j++;
  return { inizio: i, fine: j, corpo: righe.slice(i + 1, j).join("\n").trim() };
}
export const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const titoloVersione = (v) => new RegExp(`^## \\[${escape(v)}\\] - \\d{4}-\\d{2}-\\d{2}$`);
export const titoloNonRilasciato = () => new RegExp(`^${escape(INTESTAZIONE_NR)}$`);

/** Le righe «Per chi gioca» del corpo di una sezione: le voci dell'elenco, senza i
 *  collegamenti e senza il codice (chi gioca non li vede), con il grassetto. */
export function perChiGioca(corpo) {
  const righe = corpo.replace(/\r\n/g, "\n").split("\n");
  const i = righe.findIndex((r) => r.trim() === PER_CHI_GIOCA);
  if (i < 0) return [];
  const voci = [];
  for (const r of righe.slice(i + 1)) {
    if (/^#{1,3} /.test(r)) break;
    const m = /^[-*] +(.*)$/.exec(r);
    if (m) voci.push(m[1].trim());
    else if (r.trim() && voci.length) voci[voci.length - 1] += " " + r.trim();
  }
  return voci.map((v) => v.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/`([^`]*)`/g, "$1"));
}

/** Le versioni datate del CHANGELOG, nell'ordine del file (la più recente prima), con le
 *  loro righe «Per chi gioca» (vuote se la sezione non ne ha). */
export function novita(testo) {
  const out = [];
  const righe = testo.replace(/\r\n/g, "\n").split("\n");
  for (const r of righe) {
    const m = /^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})$/.exec(r);
    if (!m || !SEMVER.test(m[1])) continue;
    const s = sezione(testo, titoloVersione(m[1]));
    out.push({ versione: m[1], data: m[2], righe: s ? perChiGioca(s.corpo) : [] });
  }
  return out;
}

/** Il corpo della release di una versione: le righe per chi gioca (il gioco le mostra nella
 *  domanda «È uscita la versione…», aggiornamenti.ts), poi dove stanno le note intere. */
export function corpoRelease(versione, righe) {
  const elenco = righe.map((r) => `- ${r}`).join("\n");
  return [
    "Per chi gioca:",
    "",
    elenco,
    "",
    `Il remake de «Il Relitto Silente», un programma a sé. Tutte le note della versione ${versione} sono nel CHANGELOG.`,
  ].join("\n");
}
