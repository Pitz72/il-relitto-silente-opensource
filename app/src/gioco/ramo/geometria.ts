// ============================================================================
//  La geometria del ramo e del fiore (06-app-desktop.md, §4.7; la tavola della
//  membrana). Pura: prende le misure dei pezzi in pixel e la larghezza del
//  palco, restituisce dove stanno. Le prove sono in prove/ramo.test.ts.
//
//  Il ramo ha due fili. Quello alto porta le uscite (le bocche), le cose che
//  stanno qui (i baccelli) e le azioni; quello basso, più sottile, le cose che
//  porti, con gli attrezzi in testa. Il fiore di una cosa si apre sempre nella
//  fascia libera fra la lamina del testo e il filo alto, su due anelli: la base
//  e i verbi dell'autore vicino, gli attrezzi fuori (12, §9).
// ============================================================================
import type { Forma } from "../../stile/atmosfere";

export type Filo = "alto" | "basso";

/** Le misure del palco che contano, in unità del palco (cqw: un centesimo della larghezza). */
export const MISURE = {
  /** il fondo della lamina del testo */
  fondoLamina: 38.4,
  /** il filo alto e quello basso, al centro dello schermo */
  filoAlto: 47.8,
  filoBasso: 53.1,
  /** i margini ai lati del ramo */
  margine: 3,
  /** lo spazio fra due pezzi dello stesso gruppo, e fra due gruppi */
  spazio: 0.8,
  spazioGruppo: 2.4,
  /** quanto si possono stringere i pezzi prima di nasconderne qualcuno, al più; ma mai sotto i
   *  12 px (scalaMinimaPer) */
  scalaMinima: 0.8,
  /** gli anelli del fiore, sopra il filo alto */
  anello1: 3.7,
  anello2: 6.7,
} as const;

/** L'altezza del filo, in cqw, a una frazione della larghezza (0–1). Nella
 *  membrana un ramo che si incurva; nell'acciaio una rotaia dritta. */
export function quotaDelFilo(filo: Filo, x01: number, forma: Forma): number {
  const base = filo === "alto" ? MISURE.filoAlto : MISURE.filoBasso;
  if (forma === "acciaio") return base;
  const ampiezza = filo === "alto" ? 1 : 0.6;
  return base + ampiezza * (Math.sin(x01 * Math.PI) * 1.1 - Math.sin(x01 * Math.PI * 3) * 0.35) - ampiezza * 0.4;
}

/** Il disegno del filo nel riquadro SVG del palco (1000 × 562,5). */
export function percorsoDelFilo(filo: Filo, forma: Forma, da = 0.02, a = 0.98): string {
  const punti: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = da + ((a - da) * i) / 60;
    punti.push(`${i ? "L" : "M"}${(x * 1000).toFixed(1)} ${(quotaDelFilo(filo, x, forma) * 10).toFixed(1)}`);
  }
  return punti.join(" ");
}

export interface Gruppo {
  nome: string;
  /** le larghezze dei pezzi, in pixel, alla scala piena */
  larghezze: number[];
  /** se i pezzi in più si possono raccogliere in un «+N» (le cose sì, le uscite no) */
  riducibile: boolean;
}

export interface Posto {
  x: number;
  y: number;
}

export interface Disposizione {
  /** per ogni gruppo, i centri dei pezzi mostrati (i primi `mostrati`) */
  posti: Posto[][];
  /** per ogni gruppo, dove sta l'etichetta (sopra il primo pezzo) */
  etichette: (Posto | null)[];
  /** per ogni gruppo, quanti pezzi si vedono; il resto va nel «+N», che è l'ultimo dei posti */
  mostrati: number[];
  /** la scala dei pezzi (1, o meno se il filo era stretto) */
  scala: number;
}

/** Quanto è largo un filo con i primi `mostrati` pezzi di ogni gruppo, a una scala. */
function larghezzaFilo(gruppi: Gruppo[], mostrati: number[], scala: number, u: number, larghezzaPiu: number): number {
  let tot = 0;
  let gruppiVisti = 0;
  gruppi.forEach((g, i) => {
    const n = mostrati[i];
    const nascosti = g.larghezze.length - n;
    const pezzi = g.larghezze.slice(0, n).map((w) => w * scala);
    if (nascosti > 0) pezzi.push(larghezzaPiu * scala);
    if (!pezzi.length) return;
    tot += pezzi.reduce((a, b) => a + b, 0) + (pezzi.length - 1) * MISURE.spazio * u;
    gruppiVisti++;
  });
  return tot + Math.max(0, gruppiVisti - 1) * MISURE.spazioGruppo * u;
}

/** Il corpo più piccolo che si legge e si tocca (revisione 25, M3). */
export const CORPO_MINIMO = 12;

/** Quanto si può stringere il ramo: fino alla scala minima, ma non oltre il punto in cui il pezzo
 *  più piccolo (gli attrezzi e il «+N», `corpoPiccolo` px alla scala piena) scenderebbe sotto i
 *  12 px. A 1280 × 720 è 0,91; sugli schermi grandi resta 0,8. Se non basta, un pezzo in più va
 *  nel «+N»: meglio che un baccello illeggibile. */
export function scalaMinimaPer(corpoPiccolo: number): number {
  return Math.min(1, Math.max(MISURE.scalaMinima, CORPO_MINIMO / Math.max(1, corpoPiccolo)));
}

/** Quanti pezzi del gruppo `indice` stanno sul filo, con gli altri gruppi
 *  interi e alla scala minima, senza «+N». Le cose in più del filo alto
 *  scendono su quello basso, prima di ciò che porti. */
export function quantiStanno(gruppi: Gruppo[], indice: number, W: number, scalaMinima: number = MISURE.scalaMinima): number {
  const u = W / 100;
  const utile = W - 2 * MISURE.margine * u;
  const mostrati = gruppi.map((g) => g.larghezze.length);
  while (mostrati[indice] > 0 && larghezzaFilo(gruppi, mostrati, scalaMinima, u, 0) > utile) mostrati[indice]--;
  // se il gruppo non ci sta tutto, si tiene un pezzo di margine: la scala non resta al minimo
  return mostrati[indice] < gruppi[indice].larghezze.length ? Math.max(1, mostrati[indice] - 1) : mostrati[indice];
}

/** Dispone i gruppi lungo un filo. `larghezzaPiu`: quanto è largo il «+N». */
export function disponiFilo(gruppi: Gruppo[], W: number, filo: Filo, forma: Forma, larghezzaPiu: number, scalaMinima: number = MISURE.scalaMinima): Disposizione {
  const u = W / 100;
  const utile = W - 2 * MISURE.margine * u;
  const presenti = gruppi.map((g) => g.larghezze.length);
  const largo = (mostrati: number[], scala: number) => larghezzaFilo(gruppi, mostrati, scala, u, larghezzaPiu);
  // prima si stringe, fino alla scala minima
  let scala = Math.min(1, utile / Math.max(1, largo(presenti, 1)));
  const mostrati = [...presenti];
  if (scala < scalaMinima) {
    scala = scalaMinima;
    // poi si raccolgono in un «+N» i pezzi in coda del gruppo riducibile più lungo
    while (largo(mostrati, scala) > utile) {
      let scelto = -1;
      gruppi.forEach((g, i) => {
        if (g.riducibile && mostrati[i] > 1 && (scelto < 0 || mostrati[i] > mostrati[scelto])) scelto = i;
      });
      if (scelto < 0) break;
      mostrati[scelto]--;
    }
  }
  // i gruppi da sinistra; quello che avanza si divide fra i gruppi, al massimo 4 cqw
  const tot = largo(mostrati, scala);
  const visibili = gruppi.filter((g, i) => mostrati[i] > 0 || g.larghezze.length > 0).length;
  const extra = visibili > 1 ? Math.min(4 * u - MISURE.spazioGruppo * u, (utile - tot) / (visibili - 1)) : 0;
  let x = MISURE.margine * u;
  const posti: Posto[][] = [];
  const etichette: (Posto | null)[] = [];
  let primo = true;
  gruppi.forEach((g, i) => {
    const n = mostrati[i];
    const larghezze = g.larghezze.slice(0, n).map((w) => w * scala);
    if (g.larghezze.length > n) larghezze.push(larghezzaPiu * scala);
    if (!larghezze.length) {
      posti.push([]);
      etichette.push(null);
      return;
    }
    if (!primo) x += MISURE.spazioGruppo * u + Math.max(0, extra);
    primo = false;
    const qui: Posto[] = [];
    larghezze.forEach((w, k) => {
      if (k) x += MISURE.spazio * u;
      const cx = x + w / 2;
      qui.push({ x: cx, y: quotaDelFilo(filo, cx / W, forma) * u });
      x += w;
    });
    posti.push(qui);
    etichette.push({ x: qui[0].x - larghezze[0] / 2, y: qui[0].y });
  });
  return { posti, etichette, mostrati, scala };
}

export interface Petalo {
  larghezza: number;
  altezza: number;
  /** 1: la base e i verbi dell'autore, vicino; 2: gli attrezzi, fuori */
  anello: 1 | 2;
}

export interface PostoPetalo extends Posto {
  anello: 1 | 2;
}

/** I petali del fiore di una cosa, in due anelli sopra il filo alto. Il fiore
 *  sta sempre nella fascia fra la lamina e il filo alto: non copre mai il
 *  testo, e il gambo di una cosa del filo basso passa fra i baccelli. */
export function disponiFiore(ancora: Posto, petali: Petalo[], W: number, forma: Forma): PostoPetalo[] {
  const u = W / 100;
  const sopra = quotaDelFilo("alto", ancora.x / W, forma) * u;
  const out: PostoPetalo[] = new Array(petali.length);
  const anelli: (1 | 2)[] = petali.some((p) => p.anello === 2) && petali.some((p) => p.anello === 1) ? [1, 2] : [1];
  for (const anello of anelli) {
    const indici = petali.map((p, i) => [p, i] as const).filter(([p]) => (anelli.length === 1 ? true : p.anello === anello));
    if (!indici.length) continue;
    const tot = indici.reduce((a, [p]) => a + p.larghezza, 0) + (indici.length - 1) * MISURE.spazio * u;
    const min = MISURE.margine * u;
    const max = W - MISURE.margine * u - tot;
    let x = Math.max(min, Math.min(max, ancora.x - tot / 2));
    const quota = sopra - (anello === 1 ? MISURE.anello1 : MISURE.anello2) * u;
    // l'anello non scende sotto il fondo della lamina
    const alto = Math.max(...indici.map(([p]) => p.altezza));
    const y0 = Math.max(quota, MISURE.fondoLamina * u + alto / 2 + 0.3 * u);
    for (const [p, i] of indici) {
      const cx = x + p.larghezza / 2;
      // un arco basso: i petali al centro più in alto di quelli ai lati
      const rel = (cx - ancora.x) / (tot / 2 + u);
      const arco = 0.6 * u * (1 - Math.min(1, rel * rel));
      out[i] = { x: cx, y: Math.max(MISURE.fondoLamina * u + p.altezza / 2 + 0.2 * u, y0 - arco), anello: anelli.length === 1 ? 1 : anello };
      x += p.larghezza + MISURE.spazio * u;
    }
  }
  return out;
}

/** Il gambo da una cosa al suo petalo, nel riquadro del palco in pixel. */
export function gambo(da: Posto, a: Posto, altezzaPetalo: number): string {
  const ay = a.y + altezzaPetalo / 2;
  // esce dritto dalla cosa e piega verso il petalo
  const cy = ay + (da.y - ay) * 0.35;
  return `M${da.x.toFixed(1)} ${da.y.toFixed(1)} Q${da.x.toFixed(1)} ${cy.toFixed(1)} ${a.x.toFixed(1)} ${ay.toFixed(1)}`;
}
