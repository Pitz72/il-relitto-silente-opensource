// ============================================================================
//  La pellicola della cinematica d'apertura (documento 09, §16; l'autore, 14
//  novembre 2026: «un effetto unitario da inizio a fine intro: effetto
//  cinematografico di pellicola»). Lo spunto è il prototipo dell'Avventura
//  Vettoriale (v2/js/film.js), con le sue differenze: lo sfarfallio più leggero,
//  il respiro della luce molto più lento, la grana, la polvere e i graffi ancora
//  più radi e tenui, e un taglio di colore da fantascienza moderna al posto del
//  «Fuji anni Ottanta».
//
//  Qui stanno solo i conti, puri: tutto dipende dal tempo (o dallo scatto), non
//  dall'orologio né dal caso, così la stessa intro è sempre la stessa pellicola
//  e il filmato di `strumenti/intro/filma.mjs` la riprende com'è.
// ============================================================================

/** Il formato della cinematica: 2,39 a 1, quello del cinema (i «21:9» degli schermi), dentro un palco 16:9.
 *  Quanta parte dell'altezza del palco sta sotto ogni banda nera, sopra e sotto. */
export const FORMATO = 2.39;
export const BANDA = (1 - 16 / 9 / FORMATO) / 2;

/** La pellicola va a ventiquattro scatti al secondo: grana, lampada e sporcature cambiano a scatti. */
export const SCATTI = 24;

/** Un numero a caso ma sempre lo stesso, da 0 a 1. */
export const caso = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const tra = (a: number, b: number, u: number) => a + (b - a) * u;

/** Lo scatto di un istante. */
export const scatto = (t: number) => Math.floor(t * SCATTI);

/** La lampada del proiettore allo scatto f: di quanto scurisce il quadro (0–1). Quasi sempre sotto l'uno
 *  per cento; tre scatti su cento un respiro appena più fondo, mai oltre il due e mezzo (nel prototipo
 *  erano il 2,6 e il 7). Ogni scatto si porta dietro un poco dei due prima: la lampada non salta. */
export function sfarfallio(f: number): number {
  const bersaglio = (k: number) => (caso(k, 11) < 0.03 ? tra(0.014, 0.022, caso(k, 12)) : tra(0, 0.009, caso(k, 13)));
  return 0.62 * bersaglio(f) + 0.26 * bersaglio(f - 1) + 0.12 * bersaglio(f - 2);
}

/** Il respiro lento della luce (il «fading» della pellicola): due onde lunghe, di diciassette e di undici
 *  secondi, che non vanno mai insieme. Da 0 a 0,014: non si vede salire né scendere, si sente che è viva. */
export function respiro(t: number): number {
  return 0.007 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 17.3)) + 0.007 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 11.1 + 1.9));
}

/** Un granello di polvere: dove (0–1 del quadro), quanto grande (in millesimi della larghezza), chiaro o scuro. */
export interface Granello {
  x: number;
  y: number;
  r: number;
  schiaccia: number;
  gira: number;
  chiaro: boolean;
  alfa: number;
}

/** Un graffio verticale: dove, e i suoi tratti (da, a, in 0–1 dell'altezza), con i vuoti in mezzo. */
export interface Graffio {
  x: number;
  chiaro: boolean;
  alfa: number;
  tratti: [number, number][];
}

/** Un pelo: una curva corta, uno scatto solo. */
export interface Pelo {
  punti: [number, number][];
  alfa: number;
}

export interface Sporcature {
  granelli: Granello[];
  graffio: Graffio | null;
  pelo: Pelo | null;
}

/** ogni quanti scatti può nascere un graffio (cinque secondi), e quanto spesso nasce davvero */
const FINESTRA = 120;
const GRAFFIO_OGNI = 0.22;

/** Le sporcature dello scatto f. Un granello in uno scatto su dodici (due al secondo; nel prototipo quasi
 *  quattro), di rado una manciata; un graffio ogni venti secondi circa, che dura meno di mezzo secondo e
 *  trema di poco; un pelo ogni mezzo minuto, uno scatto solo. Tutti più tenui che nel prototipo. */
export function sporcature(f: number): Sporcature {
  const granelli: Granello[] = [];
  let n = caso(f, 1) < 0.085 ? 1 : 0;
  if (caso(f, 2) < 0.008) n += 2 + Math.floor(caso(f, 3) * 2);
  for (let i = 0; i < n; i++) {
    const chiaro = caso(f, 40 + i) < 0.35;
    granelli.push({
      x: caso(f, 50 + i),
      y: caso(f, 60 + i),
      r: tra(0.35, 1.1, caso(f, 70 + i)),
      schiaccia: tra(0.5, 1.2, caso(f, 80 + i)),
      gira: caso(f, 90 + i) * Math.PI,
      chiaro,
      alfa: chiaro ? tra(0.1, 0.22, caso(f, 100 + i)) : tra(0.18, 0.34, caso(f, 100 + i)),
    });
  }

  let graffio: Graffio | null = null;
  for (const k of [Math.floor(f / FINESTRA), Math.floor(f / FINESTRA) - 1]) {
    if (caso(k, 21) >= GRAFFIO_OGNI) continue;
    const nasce = k * FINESTRA + Math.floor(caso(k, 22) * (FINESTRA - 20));
    const vive = 4 + Math.floor(caso(k, 23) * 7);
    if (f < nasce || f >= nasce + vive) continue;
    const tratti: [number, number][] = [];
    let y = tra(-0.05, 0.08, caso(f, 24));
    for (let i = 0; y < 1 && i < 12; i++) {
      const lungo = tra(0.08, 0.38, caso(f, 25 + i));
      tratti.push([Math.max(0, y), Math.min(1, y + lungo)]);
      y += lungo + tra(0.012, 0.11, caso(f, 37 + i));
    }
    graffio = {
      x: tra(0.06, 0.94, caso(k, 26)) + (caso(f, 27) - 0.5) * 0.0012,
      chiaro: caso(k, 28) < 0.7,
      alfa: tra(0.035, 0.075, caso(k, 29)),
      tratti,
    };
    break;
  }

  let pelo: Pelo | null = null;
  if (caso(f, 31) < 0.0015) {
    const x = tra(0.05, 0.95, caso(f, 32)), y = tra(0.08, 0.92, caso(f, 33));
    const a = caso(f, 34) * Math.PI * 2, l = tra(0.012, 0.03, caso(f, 35));
    const storto = (i: number) => (caso(f, 36 + i) - 0.5) * 0.014;
    pelo = {
      punti: [
        [x, y],
        [x + Math.cos(a) * l * 0.4 + storto(0), y + Math.sin(a) * l * 0.4 + storto(1)],
        [x + Math.cos(a) * l * 0.7 + storto(2), y + Math.sin(a) * l * 0.7 + storto(3)],
        [x + Math.cos(a) * l, y + Math.sin(a) * l],
      ],
      alfa: 0.26,
    };
  }
  return { granelli, graffio, pelo };
}

/** La grana: quanto si vede sopra l'immagine (nel prototipo 0,085), e quanto è larga la sua tessera. */
export const GRANA = { forza: 0.05, tessera: 192 };

/** Dove va la tessera della grana allo scatto f: un posto nuovo a ogni scatto. */
export function postoGrana(f: number): [number, number] {
  return [Math.floor(caso(f, 5) * GRANA.tessera), Math.floor(caso(f, 6) * GRANA.tessera)];
}

// ---- il taglio di colore ---------------------------------------------------------------------
// Una pellicola da fantascienza di oggi: i neri appena sollevati e freddi (blu petrolio), i mezzi toni
// neutri, le luci morbide e appena calde, la saturazione un filo trattenuta. Niente verde-ciano nei neri
// e niente crema nelle luci, com'era il «Fuji»: qui il nero resta quasi nero, e si raffredda.

/** La matrice del colore (righe R, G, B; l'ultima colonna è lo scarto). */
export const MATRICE: number[] = [
  0.948, 0.042, 0.010, 0, 0,
  0.020, 0.952, 0.028, 0, 0,
  0.012, 0.058, 0.930, 0, 0,
  0, 0, 0, 1, 0,
];
const NEUTRA: number[] = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

/** Le curve dei tre colori, in nove punti dal nero al bianco. */
export const CURVE: { r: number[]; g: number[]; b: number[] } = {
  r: [0.008, 0.108, 0.232, 0.368, 0.508, 0.648, 0.782, 0.896, 0.976],
  g: [0.013, 0.118, 0.244, 0.378, 0.512, 0.646, 0.776, 0.888, 0.966],
  b: [0.024, 0.132, 0.258, 0.386, 0.512, 0.636, 0.756, 0.862, 0.940],
};
const DRITTA = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

/** Il taglio di colore a una data forza (0: l'immagine com'è; 1: la pellicola), scritto per il filtro SVG. */
export function taglio(forza: number): { matrice: string; r: string; g: string; b: string } {
  const k = Math.max(0, Math.min(1, forza));
  const mescola = (a: number[], b: number[]) => a.map((v, i) => tra(v, b[i], k).toFixed(4)).join(" ");
  return { matrice: mescola(NEUTRA, MATRICE), r: mescola(DRITTA, CURVE.r), g: mescola(DRITTA, CURVE.g), b: mescola(DRITTA, CURVE.b) };
}
