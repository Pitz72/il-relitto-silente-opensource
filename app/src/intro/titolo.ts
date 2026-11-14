// ============================================================================
//  Il titolo (scena G): ogni glifo si scioglie nella sua lettera (documento 09,
//  §16; l'autore, 14 novembre 2026: «trova un morfing di altissimo livello,
//  l'effetto in cui diventano caratteri normali è brutto»).
//
//  Prima il glifo cambiava forma a scatti e la lettera gli compariva sopra. Ora
//  è una linea sola che si muove: i tratti del glifo e il contorno della lettera
//  sono la stessa fila di punti, e ogni punto va dal suo posto nel glifo al suo
//  posto sulla lettera, uno dopo l'altro lungo la linea, come inchiostro che
//  scorre. Quando il contorno è chiuso la lettera si riempie, e il tratto si
//  spegne. Niente salta, niente lampeggia.
//
//  Qui la geometria, pura: le spezzate, il contorno di una lettera da una
//  mappa di trasparenze, la corrispondenza dei punti, la posa di un istante.
// ============================================================================

export type P = [number, number];

/** Una spezzata "M x y L x y …" (i tratti dei glifi), come punti. */
export function spezzata(d: string): P[] {
  const n = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const p: P[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]);
  return p;
}

const lungo = (l: P[], chiusa: boolean) => {
  let s = 0;
  for (let i = 1; i < l.length; i++) s += Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]);
  if (chiusa && l.length > 1) s += Math.hypot(l[0][0] - l[l.length - 1][0], l[0][1] - l[l.length - 1][1]);
  return s;
};

/** `n` punti a passo costante lungo una linea (aperta: i due capi compresi; chiusa: senza ripetere il primo). */
export function lungoLaLinea(l: P[], n: number, chiusa: boolean): P[] {
  const giro = chiusa ? [...l, l[0]] : l;
  const tot = lungo(l, chiusa);
  if (n <= 0) return [];
  if (tot === 0 || giro.length < 2) return Array.from({ length: n }, () => [l[0][0], l[0][1]] as P);
  const passo = tot / (chiusa ? n : Math.max(1, n - 1));
  const out: P[] = [];
  let i = 1, fatto = 0;
  for (let k = 0; k < n; k++) {
    const s = Math.min(tot, k * passo);
    for (;;) {
      const d = Math.hypot(giro[i][0] - giro[i - 1][0], giro[i][1] - giro[i - 1][1]);
      if (fatto + d >= s || i === giro.length - 1) {
        const u = d > 0 ? Math.max(0, Math.min(1, (s - fatto) / d)) : 0;
        out.push([giro[i - 1][0] + (giro[i][0] - giro[i - 1][0]) * u, giro[i - 1][1] + (giro[i][1] - giro[i - 1][1]) * u]);
        break;
      }
      fatto += d;
      i++;
    }
  }
  return out;
}

/** Quanti punti a ogni linea, in proporzione alla lunghezza (almeno `minimo` ciascuna); la somma è `n`. */
export function spartisci(lunghezze: number[], n: number, minimo = 4): number[] {
  const tot = lunghezze.reduce((a, b) => a + b, 0) || 1;
  const q = lunghezze.map((l) => Math.max(minimo, Math.round((n * l) / tot)));
  // l'arrotondamento si aggiusta sulla linea più lunga
  const piu = lunghezze.indexOf(Math.max(...lunghezze));
  q[piu] += n - q.reduce((a, b) => a + b, 0);
  return q;
}

/** I contorni chiusi di una forma, da una mappa di trasparenze (larga `w`, alta `h`, un valore 0–255 per
 *  punto): dove la trasparenza passa per `soglia`. Quadrati in marcia, con il punto messo dove la soglia
 *  cade davvero fra i due vicini: il contorno non è a scalini. Il bordo della mappa conta come vuoto. */
export function contorni(alfa: ArrayLike<number>, w: number, h: number, soglia = 128): P[][] {
  const v = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : alfa[y * w + x]);
  // ogni lato fra due punti vicini ha un nome; un contorno lo attraversa, e lega due lati della stessa cella
  const lato = (x: number, y: number, verticale: boolean) => (y + 1) * (w + 2) * 2 + (x + 1) * 2 + (verticale ? 1 : 0);
  const dove = new Map<number, P>();
  const vicini = new Map<number, number[]>();
  const lega = (a: number, b: number) => {
    (vicini.get(a) ?? vicini.set(a, []).get(a)!).push(b);
    (vicini.get(b) ?? vicini.set(b, []).get(b)!).push(a);
  };
  const taglio = (x0: number, y0: number, x1: number, y1: number): P => {
    const a = v(x0, y0), b = v(x1, y1);
    const u = a === b ? 0.5 : Math.max(0, Math.min(1, (soglia - a) / (b - a)));
    return [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
  };
  for (let y = -1; y < h; y++) {
    for (let x = -1; x < w; x++) {
      // i quattro angoli della cella: in alto a sinistra, in alto a destra, in basso a destra, in basso a sinistra
      const a = v(x, y) >= soglia, b = v(x + 1, y) >= soglia, c = v(x + 1, y + 1) >= soglia, d = v(x, y + 1) >= soglia;
      const caso = (a ? 8 : 0) | (b ? 4 : 0) | (c ? 2 : 0) | (d ? 1 : 0);
      if (caso === 0 || caso === 15) continue;
      const su = lato(x, y, false), giu = lato(x, y + 1, false), sx = lato(x, y, true), dx = lato(x + 1, y, true);
      if (a !== b) dove.set(su, taglio(x, y, x + 1, y));
      if (d !== c) dove.set(giu, taglio(x, y + 1, x + 1, y + 1));
      if (a !== d) dove.set(sx, taglio(x, y, x, y + 1));
      if (b !== c) dove.set(dx, taglio(x + 1, y, x + 1, y + 1));
      switch (caso) {
        case 1: case 14: lega(sx, giu); break;
        case 2: case 13: lega(giu, dx); break;
        case 3: case 12: lega(sx, dx); break;
        case 4: case 11: lega(su, dx); break;
        case 6: case 9: lega(su, giu); break;
        case 7: case 8: lega(su, sx); break;
        // le due selle: gli angoli pieni restano separati
        case 5: lega(su, dx); lega(sx, giu); break;
        case 10: lega(su, sx); lega(giu, dx); break;
      }
    }
  }
  const visti = new Set<number>();
  const giri: P[][] = [];
  for (const inizio of dove.keys()) {
    if (visti.has(inizio)) continue;
    const giro: P[] = [];
    let ora = inizio, prima = -1;
    while (!visti.has(ora)) {
      visti.add(ora);
      giro.push(dove.get(ora)!);
      const prossimo = (vicini.get(ora) ?? []).find((k) => k !== prima && !visti.has(k));
      if (prossimo === undefined) break;
      prima = ora;
      ora = prossimo;
    }
    if (giro.length >= 8) giri.push(giro);
  }
  // i più lunghi per primi: il profilo di fuori, poi gli occhielli
  return giri.sort((p, q) => lungo(q, true) - lungo(p, true));
}

/** La linea di un glifo che diventa una lettera: gli stessi `n` punti, nel glifo e sulla lettera. */
export interface Scioglimento {
  /** i punti nel glifo, e quelli sul contorno della lettera */
  da: P[];
  a: P[];
  /** per ogni punto, il tratto del glifo e il contorno della lettera a cui appartiene */
  tratto: number[];
  giro: number[];
  /** per ogni contorno della lettera, il primo e l'ultimo dei suoi punti: il giro si chiude dall'ultimo al primo */
  capi: [number, number][];
}

/** Mette in corrispondenza i tratti di un glifo e i contorni di una lettera, con `n` punti. Ogni contorno
 *  comincia e gira nel verso che fa fare ai punti meno strada: la linea non si attorciglia. */
export function sciogli(tratti: P[][], giri: P[][], n: number): Scioglimento {
  const qt = spartisci(tratti.map((l) => lungo(l, false)), n);
  const da: P[] = [], tratto: number[] = [];
  tratti.forEach((l, i) => {
    for (const p of lungoLaLinea(l, qt[i], false)) {
      da.push(p);
      tratto.push(i);
    }
  });
  const qg = spartisci(giri.map((l) => lungo(l, true)), n);
  const a: P[] = [], giro: number[] = [], capi: [number, number][] = [];
  let primo = 0;
  giri.forEach((l, i) => {
    const base = lungoLaLinea(l, qg[i], true);
    const m = base.length;
    // la rotazione e il verso che avvicinano di più il contorno ai punti del glifo che ci andranno
    let meglio = Infinity, scelta: P[] = base;
    for (const verso of [1, -1]) {
      for (let r = 0; r < m; r += Math.max(1, Math.floor(m / 48))) {
        let s = 0;
        for (let k = 0; k < m; k += 2) {
          const q = base[(((r + verso * k) % m) + m) % m], p = da[primo + k];
          s += (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
        }
        if (s < meglio) {
          meglio = s;
          scelta = Array.from({ length: m }, (_, k) => base[(((r + verso * k) % m) + m) % m]);
        }
      }
    }
    for (const p of scelta) {
      a.push(p);
      giro.push(i);
    }
    capi.push([primo, primo + m - 1]);
    primo += m;
  });
  return { da, a, tratto, giro, capi };
}

const morbido = (x: number) => x * x * (3 - 2 * x);

/** Quanto è avanti il punto `i` (0–1) quando lo scioglimento è a `k` (0–1): i punti partono uno dopo
 *  l'altro lungo la linea, e arrivano tutti. */
export function avanzamento(i: number, n: number, k: number, scia = 0.3): number {
  const u = n > 1 ? i / (n - 1) : 0;
  return morbido(Math.max(0, Math.min(1, (k * (1 + scia) - scia * u))));
}

/** I punti della linea quando lo scioglimento è a `k`: ognuno fra il glifo e la lettera, con un arco lieve
 *  (non vanno dritti: girano un poco, tutti dalla stessa parte, e la linea resta una linea). */
export function posa(s: Scioglimento, k: number, arco = 0.1): { p: P[]; e: number[] } {
  const n = s.da.length;
  const p: P[] = new Array(n), e: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const ei = avanzamento(i, n, k);
    const dx = s.a[i][0] - s.da[i][0], dy = s.a[i][1] - s.da[i][1];
    const curva = Math.sin(Math.PI * ei) * arco * (0.6 + 0.4 * Math.sin(i * 0.19));
    p[i] = [s.da[i][0] + dx * ei - dy * curva, s.da[i][1] + dy * ei + dx * curva];
    e[i] = ei;
  }
  return { p, e };
}
