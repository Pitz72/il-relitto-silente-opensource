// ============================================================================
//  Il disegno delle scansioni del relitto (revisione 25, E1; documento 06, §8:
//  «del relitto non esistono immagini, solo letture»). Ogni stanza si descrive
//  in metri, come la vede il multiscanner dal punto in cui si entra: pavimenti,
//  pareti, cupole, oggetti. Una telecamera virtuale la proietta nella cornice
//  della lente (620 × 300) in nuvole di punti, curve di livello, masse scure,
//  bagliori e marche sugli oggetti schedati. Il risultato è una lista di strati,
//  dati puri, che Scansione.tsx veste in SVG.
//  Puro: niente React, niente DOM, perché le prove lo leggano in Node.
// ============================================================================

/** Un punto della stanza, in metri: x a destra, y in su, z davanti a chi guarda. */
export type V3 = readonly [number, number, number];

/** I toni del multiscanner: la lettura normale, il vivo (ciò che vive ancora), il caldo (le poche
 *  luci calde), l'osso (le cose pallide: il groviglio, i corpi), la brina, il rosso del bengala. */
export type Tono = "vena" | "vivo" | "caldo" | "osso" | "brina" | "rosso";

export type Strato =
  /** una nuvola di punti in tre fasce di profondità: vicino, medio, lontano */
  | { tipo: "punti"; tono: Tono; d: readonly [string, string, string]; forza: number }
  | { tipo: "linea"; tono: Tono; d: string; forza: number; spessore: number; tratteggio?: string }
  /** una massa che il sensore non attraversa: copre quello che sta dietro */
  | { tipo: "massa"; d: string; forza: number }
  | { tipo: "alone"; x: number; y: number; r: number; tono: Tono; forza: number }
  /** un oggetto schedato dal multiscanner: quattro angoli intorno */
  | { tipo: "marca"; x: number; y: number; l: number; a: number };

export const LARGO = 620;
export const ALTO = 300;

export interface Camera {
  /** la focale, in unità della cornice */
  f: number;
  /** dove cade l'asse della vista nella cornice */
  cx: number;
  cy: number;
  /** l'altezza degli occhi, in metri */
  h: number;
  /** di quanto la vista guarda in su (positivo) o in giù (negativo), in radianti */
  beccheggio?: number;
}

export interface Proiezione {
  x: number;
  y: number;
  /** la profondità lungo la vista, in metri */
  z: number;
}

export function proiettore(c: Camera): (p: V3) => Proiezione | null {
  const cos = Math.cos(c.beccheggio ?? 0);
  const sin = Math.sin(c.beccheggio ?? 0);
  return (p) => {
    const dy = p[1] - c.h;
    const yc = dy * cos - p[2] * sin;
    const zc = dy * sin + p[2] * cos;
    if (zc < 0.3) return null;
    return { x: c.cx + (c.f * p[0]) / zc, y: c.cy - (c.f * yc) / zc, z: zc };
  };
}

/** Il generatore del caso, con un seme: lo stesso disegno a ogni volta. */
export function caso(seme: number): () => number {
  let s = Math.max(1, Math.floor(seme) % 2147483647);
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const n1 = (x: number) => (Math.round(x * 10) / 10).toString();
const dentro = (q: Proiezione, margine = 24) => q.x > -margine && q.x < LARGO + margine && q.y > -margine && q.y < ALTO + margine;

export interface OpzioniNuvola {
  forza?: number;
  /** la probabilità di tenere un punto (per le pareti che si perdono nel buio, il faro che non arriva) */
  tieni?: (p: V3) => number;
  /** le righe di scansione: il multiscanner legge per righe, come un lidar; `v` cade su `righe`
   *  livelli (gli anelli sul pavimento, le fasce sulle pareti, i paralleli delle volte) */
  righe?: number;
  /** si vede solo dentro questo poligono della cornice: l'interno di una gola, attraverso la sua bocca */
  nel?: readonly (readonly [number, number])[];
}

export interface OpzioniLinea {
  forza?: number;
  spessore?: number;
  tratteggio?: string;
}

/**
 * Una scena: la telecamera, il caso e gli strati, nell'ordine in cui si disegnano (quello dopo
 * copre quello prima). Le fasce di profondità dicono quanto è grande e acceso un punto.
 */
export class Scena {
  readonly strati: Strato[] = [];
  readonly pr: (p: V3) => Proiezione | null;
  readonly r: () => number;
  private readonly fasce: readonly [number, number];

  constructor(camera: Camera, seme: number, fasce: readonly [number, number] = [4, 11]) {
    this.pr = proiettore(camera);
    this.r = caso(seme);
    this.fasce = fasce;
  }

  /** Tanti punti presi a caso su una superficie: `forma(u, v)` con u e v fra 0 e 1, null per un buco. */
  nuvola(tono: Tono, forma: (u: number, v: number) => V3 | null, quanti: number, o: OpzioniNuvola = {}) {
    const d: [string[], string[], string[]] = [[], [], []];
    const righe = o.righe ?? 0;
    for (let i = 0; i < quanti; i++) {
      const u = this.r();
      let v = this.r();
      // tre punti su quattro sulle righe, il quarto dove cade
      if (righe && this.r() < 0.75) v = Math.min(1, Math.max(0, (Math.floor(v * righe) + 0.5 + (this.r() - 0.5) * 0.12) / righe));
      const p = forma(u, v);
      if (!p) continue;
      if (o.tieni && this.r() > o.tieni(p)) continue;
      const q = this.pr(p);
      if (!q || !dentro(q, 4)) continue;
      if (o.nel && !nelPoligono(q.x, q.y, o.nel)) continue;
      const k = q.z < this.fasce[0] ? 0 : q.z < this.fasce[1] ? 1 : 2;
      d[k].push(`M${n1(q.x)} ${n1(q.y)}h.01`);
    }
    this.strati.push({ tipo: "punti", tono, d: [d[0].join(""), d[1].join(""), d[2].join("")], forza: o.forza ?? 1 });
  }

  /** Punti lungo delle polilinee (una fila di cose, un bordo che si legge a tratti). */
  puntiLungo(tono: Tono, linee: readonly (readonly V3[])[], quanti: number, sparsi = 0, o: OpzioniNuvola = {}) {
    const tratti = linee.flatMap((l) => l.slice(1).map((b, i) => [l[i], b] as const));
    if (!tratti.length) return;
    const j = () => (sparsi ? (this.r() - 0.5) * 2 * sparsi : 0);
    this.nuvola(
      tono,
      (u) => {
        const [a, b] = tratti[Math.min(tratti.length - 1, Math.floor(u * tratti.length))];
        const t = (u * tratti.length) % 1;
        return [a[0] + (b[0] - a[0]) * t + j(), a[1] + (b[1] - a[1]) * t + j(), a[2] + (b[2] - a[2]) * t + j()];
      },
      quanti,
      o,
    );
  }

  /** Un poligono della stanza, nella cornice (per ritagliare quello che si vede attraverso un'apertura). */
  sagoma(pts: readonly V3[]): [number, number][] {
    return pts.map((p) => this.pr(p)).filter((q): q is Proiezione => !!q).map((q) => [q.x, q.y]);
  }

  /** Il percorso SVG di una polilinea proiettata; si spezza dove un punto esce dalla vista. */
  percorso(pts: readonly V3[], chiusa = false): string {
    let d = "";
    let su = false;
    for (const p of pts) {
      const q = this.pr(p);
      if (!q) {
        su = false;
        continue;
      }
      d += `${su ? "L" : "M"}${n1(q.x)} ${n1(q.y)}`;
      su = true;
    }
    return chiusa && d ? d + "Z" : d;
  }

  linea(tono: Tono, pts: readonly V3[], o: OpzioniLinea & { chiusa?: boolean } = {}) {
    const d = this.percorso(pts, o.chiusa);
    if (d) this.strati.push({ tipo: "linea", tono, d, forza: o.forza ?? 0.5, spessore: o.spessore ?? 0.9, tratteggio: o.tratteggio });
  }

  linee(tono: Tono, tutte: readonly (readonly V3[])[], o: OpzioniLinea = {}) {
    const d = tutte.map((pts) => this.percorso(pts)).join("");
    if (d) this.strati.push({ tipo: "linea", tono, d, forza: o.forza ?? 0.5, spessore: o.spessore ?? 0.9, tratteggio: o.tratteggio });
  }

  /** Un percorso già nella cornice (un segno che non ha profondità: le interferenze, le scintille). */
  segno(tono: Tono, d: string, o: OpzioniLinea = {}) {
    if (d) this.strati.push({ tipo: "linea", tono, d, forza: o.forza ?? 0.5, spessore: o.spessore ?? 0.9, tratteggio: o.tratteggio });
  }

  /** Una massa scura che copre: un poligono nella stanza. */
  massa(pts: readonly V3[], forza = 0.3) {
    const d = this.percorso(pts, true);
    if (d) this.strati.push({ tipo: "massa", d, forza });
  }

  /** Un bagliore: il raggio in metri, alla profondità del punto. */
  alone(p: V3, raggio: number, tono: Tono, forza: number) {
    const q = this.pr(p);
    const a = this.pr([p[0] + raggio, p[1], p[2]]);
    if (!q || !a) return;
    this.strati.push({ tipo: "alone", x: q.x, y: q.y, r: Math.max(6, Math.abs(a.x - q.x)), tono, forza });
  }

  /** La marca del multiscanner su un oggetto schedato: larghezza e altezza in metri. */
  marca(p: V3, larghezza: number, altezza: number) {
    const q = this.pr(p);
    if (!q) return;
    const a = this.pr([p[0] + larghezza / 2, p[1] + altezza / 2, p[2]]);
    if (!a) return;
    this.strati.push({ tipo: "marca", x: q.x, y: q.y, l: Math.max(10, Math.abs(a.x - q.x) * 2), a: Math.max(10, Math.abs(q.y - a.y) * 2) });
  }
}

/** Il punto sta dentro il poligono? (pari e dispari) */
export function nelPoligono(x: number, y: number, poli: readonly (readonly [number, number])[]): boolean {
  let dentro = false;
  for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
    const [xi, yi] = poli[i], [xj, yj] = poli[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

// ---- le forme: superfici per le nuvole (u, v fra 0 e 1) --------------------------------------------

const GIRO = Math.PI * 2;

/** Un disco orizzontale (un pavimento tondo, una piattaforma). */
export const disco = (cx: number, y: number, cz: number, R: number) => (u: number, v: number): V3 => {
  const r = R * Math.sqrt(v);
  return [cx + r * Math.cos(GIRO * u), y, cz + r * Math.sin(GIRO * u)];
};

/** Una parete curva: un pezzo di cilindro fra due angoli (0 a destra, π/2 di fronte, π a sinistra). */
export const cilindro = (cx: number, cz: number, R: number, y0: number, y1: number, a0 = 0, a1 = GIRO) => (u: number, v: number): V3 => {
  const a = a0 + (a1 - a0) * u;
  return [cx + R * Math.cos(a), y0 + (y1 - y0) * v, cz + R * Math.sin(a)];
};

/** Una cupola schiacciata: la base a y0, il colmo a y0 + h. */
export const cupola = (cx: number, y0: number, cz: number, R: number, h: number) => (u: number, v: number): V3 => {
  const t = Math.sqrt(v);
  const r = R * Math.sqrt(Math.max(0, 1 - t * t));
  return [cx + r * Math.cos(GIRO * u), y0 + h * t, cz + r * Math.sin(GIRO * u)];
};

/** Un parallelogramma: un'origine e due lati. */
export const piano = (o: V3, ex: V3, ey: V3) => (u: number, v: number): V3 => [o[0] + ex[0] * u + ey[0] * v, o[1] + ex[1] * u + ey[1] * v, o[2] + ex[2] * u + ey[2] * v];

/** Un tubo lungo una spina, con un raggio per ogni punto della spina (le gole). */
export const tubo = (spina: readonly V3[], raggi: readonly number[]) => (u: number, v: number): V3 => {
  const k = Math.min(spina.length - 2, Math.floor(u * (spina.length - 1)));
  const t = u * (spina.length - 1) - k;
  const a = spina[k], b = spina[k + 1];
  const c: V3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const r = raggi[k] + (raggi[k + 1] - raggi[k]) * t;
  // l'anello sta nel piano perpendicolare (circa) alla spina: per spine che scendono basta il piano x-z
  // ruotato verso la direzione; qui un'approssimazione che regge per gole quasi verticali o quasi orizzontali
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const lung = Math.hypot(dx, dy, dz) || 1;
  const w: V3 = [dx / lung, dy / lung, dz / lung];
  const su: V3 = Math.abs(w[1]) > 0.9 ? [0, 0, 1] : [0, 1, 0];
  // e1 = su × w, e2 = w × e1
  const e1: V3 = norm([su[1] * w[2] - su[2] * w[1], su[2] * w[0] - su[0] * w[2], su[0] * w[1] - su[1] * w[0]]);
  const e2: V3 = norm([w[1] * e1[2] - w[2] * e1[1], w[2] * e1[0] - w[0] * e1[2], w[0] * e1[1] - w[1] * e1[0]]);
  const ang = GIRO * v;
  return [c[0] + r * (Math.cos(ang) * e1[0] + Math.sin(ang) * e2[0]), c[1] + r * (Math.cos(ang) * e1[1] + Math.sin(ang) * e2[1]), c[2] + r * (Math.cos(ang) * e1[2] + Math.sin(ang) * e2[2])];
};

function norm(v: V3): V3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

// ---- le polilinee ---------------------------------------------------------------------------------

/** Un cerchio orizzontale (o un suo arco). */
export function cerchio(cx: number, y: number, cz: number, R: number, a0 = 0, a1 = GIRO, passi = 64): V3[] {
  return Array.from({ length: passi + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / passi;
    return [cx + R * Math.cos(a), y, cz + R * Math.sin(a)] as V3;
  });
}

/** Un cerchio in un piano verticale di fronte (z costante): una porta tonda, un anello. */
export function cerchioDiFronte(cx: number, cy: number, z: number, R: number, a0 = 0, a1 = GIRO, passi = 48): V3[] {
  return Array.from({ length: passi + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / passi;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a), z] as V3;
  });
}

/** Un segmento diviso in tanti passi (perché si spezzi bene se esce dalla vista). */
export function segmento(a: V3, b: V3, passi = 12): V3[] {
  return Array.from({ length: passi + 1 }, (_, i) => {
    const t = i / passi;
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as V3;
  });
}

/**
 * Una forma disegnata su una parete curva (un cilindro di centro cx, cz e raggio R): `s` è la
 * distanza lungo la parete in metri dal punto di angolo `a`, `t` l'altezza dal livello `y`.
 */
export function suParete(cx: number, cz: number, R: number, a: number, y: number, forma: readonly (readonly [number, number])[]): V3[] {
  return forma.map(([s, t]) => {
    const ang = a - s / R;
    return [cx + R * Math.cos(ang), y + t, cz + R * Math.sin(ang)] as V3;
  });
}

/** Una forma disegnata su un piano: `o` l'origine, `ex` ed `ey` i versori (in metri). */
export function suPiano(o: V3, ex: V3, ey: V3, forma: readonly (readonly [number, number])[]): V3[] {
  return forma.map(([s, t]) => [o[0] + ex[0] * s + ey[0] * t, o[1] + ex[1] * s + ey[1] * t, o[2] + ex[2] * s + ey[2] * t] as V3);
}

/** Un anello di forme 2D: un poligono regolare di raggio r (un esagono per le alcove). */
export function poligono(lati: number, r: number, rot = 0): [number, number][] {
  return Array.from({ length: lati + 1 }, (_, i) => {
    const a = rot + (GIRO * i) / lati;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}

/** Una stella a punte (il diagramma della Grande Porta, il pavimento del santuario). */
export function stella(punte: number, rFuori: number, rDentro: number, rot = -Math.PI / 2): [number, number][] {
  return Array.from({ length: punte * 2 + 1 }, (_, i) => {
    const a = rot + (Math.PI * i) / punte;
    const r = i % 2 ? rDentro : rFuori;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}

/** Una spirale piana, dal centro in fuori (l'incisione del seme, il sonaglio). */
export function spirale(giri: number, r: number, passi = 40): [number, number][] {
  return Array.from({ length: passi + 1 }, (_, i) => {
    const t = i / passi;
    const a = t * giri * GIRO;
    return [r * t * Math.cos(a), r * t * Math.sin(a)];
  });
}

/** Sposta e scala una forma 2D. */
export const sposta = (forma: readonly (readonly [number, number])[], dx: number, dy: number, k = 1): [number, number][] => forma.map(([x, y]) => [dx + x * k, dy + y * k]);
