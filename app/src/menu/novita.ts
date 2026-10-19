// ============================================================================
//  Le novità dopo un aggiornamento (nota dell'autore del 19 ottobre 2026): quando
//  il gioco si riapre con una versione nuova, al primo arrivo al menu, una finestra
//  dice che cosa c'è di nuovo per chi gioca (menu/FinestraNovita.tsx). Le righe sono quelle
//  «Per chi gioca» del CHANGELOG, che la build mette nel gioco (vite.config.ts,
//  strumenti/changelog.mjs). Le decisioni dell'autore: anche le pre-release le
//  mostrano; chi installa da zero non vede niente, perché per lui non c'è niente di
//  «nuovo». La versione vista si ricorda nel browser dell'app.
//  A parte, senza React, perché le prove le leggano (prove/menu.test.ts).
// ============================================================================

export interface Novita {
  versione: string;
  /** AAAA-MM-GG, dal titolo della sezione */
  data: string;
  righe: string[];
}

export const CHIAVE_VISTA = "relitto.versione-vista";

// SemVer 2.0.0 (semver.org), come strumenti/changelog.mjs: qui solo l'ordine, e una
// versione che non si legge vale null
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/** La precedenza SemVer (§11): < 0 se a viene prima di b; null se una delle due non si legge. */
export function confronta(a: string, b: string): number | null {
  const x = SEMVER.exec(a), y = SEMVER.exec(b);
  if (!x || !y) return null;
  for (const k of [1, 2, 3]) if (+x[k] !== +y[k]) return +x[k] - +y[k];
  const p = x[4]?.split(".") ?? [], q = y[4]?.split(".") ?? [];
  if (!p.length || !q.length) return (p.length ? -1 : 0) - (q.length ? -1 : 0);
  for (let i = 0; i < Math.max(p.length, q.length); i++) {
    if (p[i] === undefined) return -1;
    if (q[i] === undefined) return 1;
    const np = /^\d+$/.test(p[i]), nq = /^\d+$/.test(q[i]);
    if (np && nq && +p[i] !== +q[i]) return +p[i] - +q[i];
    if (np !== nq) return np ? -1 : 1;
    if (p[i] !== q[i]) return p[i] < q[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Che cosa mostrare arrivando al menu, e se ricordare questa versione come vista.
 *   - la stessa versione dell'ultima volta: niente;
 *   - nessuna versione ricordata: chi installa da zero non vede niente; chi aveva già giocato
 *     (`tracce`: opzioni, salvataggi, finali) con una versione che non ricordava, le novità di
 *     questa;
 *   - una versione più vecchia: le novità di tutte le versioni dopo quella, fino a questa, la
 *     più recente prima;
 *   - una versione più nuova (si è tornati indietro, per esempio con la copia portatile): niente,
 *     e si ricorda la più nuova, perché tornando avanti non ricompaiano.
 */
export function daMostrare(elenco: readonly Novita[], vista: string | null, attuale: string, tracce: boolean): { mostra: Novita[]; ricorda: boolean } {
  const ordine = vista === null ? null : confronta(attuale, vista);
  if (ordine === 0) return { mostra: [], ricorda: false };
  if (ordine !== null && ordine < 0) return { mostra: [], ricorda: false };
  const mostra =
    ordine === null
      ? tracce
        ? elenco.filter((n) => n.versione === attuale)
        : []
      : elenco.filter((n) => (confronta(n.versione, vista!) ?? 0) > 0 && (confronta(n.versione, attuale) ?? 1) <= 0);
  return { mostra: mostra.filter((n) => n.righe.length).sort((a, b) => confronta(b.versione, a.versione) ?? 0), ricorda: true };
}

/** Le righe «Per chi gioca» nel corpo di una release (strumenti/changelog.mjs, corpoRelease):
 *  le voci dell'elenco. Le release di prima non ne hanno: allora nessuna. */
export function righeDalleNote(note: string): string[] {
  return note
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((r) => /^\s*[-*] +(.*)$/.exec(r)?.[1].trim())
    .filter((r): r is string => !!r);
}

/** Una riga in pezzi: il grassetto del CHANGELOG (**così**) e il resto. */
export function pezzi(riga: string): { testo: string; forte: boolean }[] {
  return riga
    .split("**")
    .map((testo, i) => ({ testo, forte: i % 2 === 1 }))
    .filter((p) => p.testo);
}

export function leggiVista(): string | null {
  try {
    return localStorage.getItem(CHIAVE_VISTA);
  } catch {
    return null;
  }
}

export function ricordaVista(versione: string) {
  try {
    localStorage.setItem(CHIAVE_VISTA, versione);
  } catch {
    /* niente spazio: la finestra potrà ricomparire, e basta */
  }
}
