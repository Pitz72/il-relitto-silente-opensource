// ============================================================================
//  Le venature della membrana (06-app-desktop.md, §3; 06-proposta-membrana.html).
//  Crescono dai bordi e dagli angoli, girano intorno alle zone vietate (il
//  testo, la lente, la cellula, gli strumenti, il ramo) senza attraversarle;
//  una luce le percorre una alla volta. Nella protezione vitale si spengono;
//  nella fuga si lacerano e lampeggiano; nell'ipossia sbiadiscono.
//  Stesso algoritmo e stesso seme della tavola. Lo usano il gioco (Vene.tsx) e
//  la pagina di prova, che ne misura i fotogrammi su Windows e su Linux.
// ============================================================================

export type Atmosfera = "contatto" | "relitto" | "protezione" | "fuga" | "ipossia";

export interface Zona {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface Vena {
  pts: [number, number][];
  prof: number;
  inizio: number;
  fase: number;
  rotta: number;
}

/** Come disegnare: i colori del clima (le variabili --vena e --vena-2) e
 *  quanto sono accese (prima che torni l'energia, meno). */
export interface Tinta {
  colori?: [string, string];
  /** 0–1: l'intensità delle vene e della luce che scorre */
  luce?: number;
}

const COLORI: Record<Atmosfera, [string, string]> = {
  contatto: ["#5FD4DC", "#8BF0A2"],
  relitto: ["#5FD4DC", "#8BF0A2"],
  protezione: ["#3E6463", "#4F7A78"],
  fuga: ["#FF5A4A", "#FFB020"],
  ipossia: ["#8A4A44", "#A07A50"],
};

function generatore(seme: number) {
  return () => (seme = (seme * 16807) % 2147483647) / 2147483647;
}

/** Le zone della schermata di gioco della tavola, in unità di larghezza (cqw). */
export function zoneSchermata(W: number, H: number): Zona[] {
  const u = W / 100;
  const r = (x: number, y: number, w: number, h: number): Zona => ({ x0: x * u, y0: y * u, x1: (x + w) * u, y1: (y + h) * u });
  const m = 1.2;
  const zone = [
    r(4 - m, 4.6 - m, 54 + 2 * m, 35 + 2 * m), // la lamina del testo
    r(100 - 3.6 - 31 - m, 3 - m, 31 + 2 * m, 16 + 2 * m), // la lente
    r(100 - 3.6 - 31, 19.6 - m, 31, 1.6 + 2 * m), // la didascalia
    r(100 - 20 - 13 - m, 22.6 - m, 13 + 2 * m, 13 + 2 * m), // la cellula
    r(100 - 3.6 - 15 - m, 23.4 - m, 15 + 2 * m, 12 + 2 * m), // i satelliti
    r(100 - 3.6 - 31 - m, 37 - m, 31 + 2 * m, 10 + 2 * m), // la costellazione
    r(4.4 - m, 2.2 - m, 16 + 2 * m, 1.6 + 2 * m), // l'atto
  ];
  zone.push({ x0: 0, y0: H - 9 * u, x1: W, y1: H + 50 }); // la fascia dei baccelli
  return zone;
}

export class Venature {
  private vene: Vena[] = [];
  private W = 0;
  private H = 0;
  /** quante volte le radici della tavola: 1 normale, 3 per la prova sotto sforzo */
  densita = 1;

  /** `u`: l'unità del passo (un centesimo del palco); di base, della larghezza disegnata. */
  genera(W: number, H: number, zone: Zona[], densita = 1, u = W / 100) {
    this.W = W;
    this.H = H;
    this.densita = densita;
    this.cache = null;
    const r = generatore(11);
    const vietato = (x: number, y: number) => zone.some((z) => x > z.x0 && x < z.x1 && y > z.y0 && y < z.y1);
    const vene: Vena[] = [];
    const radici: [number, number, number, number][] = [];
    for (let d = 0; d < densita; d++) {
      const sp = d * 0.031;
      for (let k = 0; k < 5; k++) radici.push([0, H * (0.12 + k * 0.16 + sp), 0, 1]);
      for (let k = 0; k < 4; k++) radici.push([W, H * (0.18 + k * 0.18 + sp), Math.PI, 1]);
      for (let k = 0; k < 4; k++) radici.push([W * (0.12 + k * 0.2 + sp), 0, Math.PI / 2, 0.8]);
      radici.push([0, 0, Math.PI / 4, 1.3], [W, 0, Math.PI * 0.75, 1.2], [0, H * 0.78, -Math.PI / 6, 1.2]);
    }
    const passo = 0.55 * u;
    const cresci = (x: number, y: number, ang: number, prof: number, lunghezza: number, inizio: number) => {
      const pts: [number, number][] = [[x, y]];
      const fase = r() * 10;
      const curv = (r() - 0.5) * 0.06;
      let tentativi = 0;
      for (let s = 0; s < lunghezza && tentativi < 40; s++) {
        ang += Math.sin(s * 0.13 + fase) * 0.07 + curv;
        const nx = x + Math.cos(ang) * passo;
        const ny = y + Math.sin(ang) * passo;
        if (vietato(nx, ny)) {
          ang += 0.55 * (r() < 0.5 ? 1 : -1);
          tentativi++;
          s--;
          continue;
        }
        if (nx < -8 || ny < -8 || nx > W + 8 || ny > H + 8) break;
        x = nx;
        y = ny;
        pts.push([x, y]);
        tentativi = 0;
        if (prof < 2 && s > 10 && r() < 0.03)
          cresci(x, y, ang + (r() < 0.5 ? 0.8 : -0.8), prof + 1, lunghezza * (0.35 + r() * 0.25), inizio + (s / lunghezza) * 0.4);
      }
      if (pts.length > 4) vene.push({ pts, prof, inizio, fase: r() * 6.28, rotta: r() });
    };
    for (const [x, y, a, f] of radici) cresci(x, y, a + (r() - 0.5) * 0.4, 0, (22 + r() * 34) * f, r() * 0.2);
    this.vene = vene;
  }

  get numero() {
    return this.vene.length;
  }

  get punti() {
    return this.vene.reduce((n, v) => n + v.pts.length, 0);
  }

  /** Disegna tutto, ogni fotogramma: la crescita, la fuga, l'ipossia. */
  disegna(g: CanvasRenderingContext2D, t: number, crescita: number, atm: Atmosfera, dpr: number, tinta: Tinta = {}) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, this.W, this.H);
    if (crescita <= 0.001) return;
    const [c1, c2] = tinta.colori ?? COLORI[atm];
    const luce = tinta.luce ?? 1;
    const fuga = atm === "fuga" || atm === "ipossia";
    const spente = atm === "protezione";
    const fioca = atm === "ipossia" ? 0.5 : 1;
    g.lineCap = "round";
    g.lineJoin = "round";
    this.vene.forEach((v, idx) => {
      const quota = Math.max(0, Math.min(1, (crescita - v.inizio) / (1 - v.inizio)));
      if (quota <= 0) return;
      const n = Math.max(2, Math.floor(v.pts.length * quota));
      const larg = [1.7, 1.05, 0.7][v.prof];
      const lampo = fuga ? (Math.sin(t / 150 + v.fase * 9) > 0.55 ? 1 : 0.45) : 1;
      for (const [alfa, spess] of [
        [0.07, 5],
        [0.42, 1],
      ]) {
        g.beginPath();
        for (let i = 0; i < n; i++) {
          if (fuga && v.rotta < 0.5 && i % 19 > 14) {
            g.moveTo(v.pts[i][0], v.pts[i][1]);
            continue;
          }
          const [x, y] = v.pts[i];
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
        g.strokeStyle = c1;
        g.globalAlpha = alfa * lampo * (spente ? 0.4 : 1) * fioca * (0.55 + 0.45 * luce);
        g.lineWidth = larg * spess;
        g.stroke();
      }
      // in crescita, la punta di ogni vena è accesa: la membrana che avanza
      if (quota < 1 && n > 2) {
        const [x, y] = v.pts[n - 1];
        g.globalAlpha = 0.7 * fioca;
        g.fillStyle = c2;
        g.beginPath();
        g.arc(x, y, 1.6, 0, 7);
        g.fill();
      }
      if (!spente && quota > 0.97 && v.prof === 0) this.luceCheScorre(g, t, idx, v, n, c2, fioca * luce);
    });
    g.globalAlpha = 1;
  }

  /** La luce che percorre le vene, una alla volta, a turno. */
  private luceCheScorre(g: CanvasRenderingContext2D, t: number, idx: number, v: Vena, n: number, c2: string, intensita: number) {
    const ciclo = 5200;
    const k = ((t + idx * 1300) % (ciclo * 3)) / ciclo;
    if (k >= 1 || intensita <= 0) return;
    const [x, y] = v.pts[Math.floor(k * (n - 1))];
    g.globalAlpha = 0.9 * Math.sin(k * Math.PI) * intensita;
    g.fillStyle = c2;
    g.beginPath();
    g.arc(x, y, 2, 0, 7);
    g.fill();
    g.globalAlpha *= 0.22;
    g.beginPath();
    g.arc(x, y, 9, 0, 7);
    g.fill();
  }

  /** Il modo economico: le venature ferme dipinte una volta, a ogni fotogramma
   *  solo la copia e le luci che scorrono. Vale fuori dalla fuga e dalla crescita. */
  private cache: HTMLCanvasElement | null = null;
  private cacheChiave = "";

  disegnaConCache(g: CanvasRenderingContext2D, t: number, atm: Atmosfera, dpr: number, tinta: Tinta = {}) {
    const [c1, c2] = tinta.colori ?? COLORI[atm];
    const luce = tinta.luce ?? 1;
    // una finestra ridotta a icona può misurare zero: niente da disegnare, e drawImage con una tela
    // vuota lancerebbe un errore che ferma il ciclo delle vene per sempre
    if (this.W < 1 || this.H < 1) return;
    const chiave = `${atm}|${this.W}|${this.H}|${dpr}|${this.vene.length}|${c1}|${luce}`;
    if (!this.cache || this.cacheChiave !== chiave) {
      const c = document.createElement("canvas");
      c.width = Math.round(this.W * dpr);
      c.height = Math.round(this.H * dpr);
      this.ferme(c.getContext("2d")!, atm, dpr, tinta, false);
      this.cache = c;
      this.cacheChiave = chiave;
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    g.drawImage(this.cache, 0, 0);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (atm === "protezione") return;
    this.vene.forEach((v, idx) => {
      if (v.prof === 0) this.luceCheScorre(g, t, idx, v, v.pts.length, c2, luce);
    });
    g.globalAlpha = 1;
  }

  /** Le venature ferme, cresciute del tutto: il movimento ridotto, e la copia in memoria. */
  ferme(g: CanvasRenderingContext2D, atm: Atmosfera, dpr: number, tinta: Tinta = {}, pulisci = true) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (pulisci) g.clearRect(0, 0, this.W, this.H);
    const [c1] = tinta.colori ?? COLORI[atm];
    const luce = tinta.luce ?? 1;
    const spente = atm === "protezione";
    const fioca = atm === "ipossia" ? 0.5 : 1;
    g.lineCap = "round";
    g.lineJoin = "round";
    for (const v of this.vene) {
      const larg = [1.7, 1.05, 0.7][v.prof];
      for (const [alfa, spess] of [
        [0.07, 5],
        [0.42, 1],
      ]) {
        g.beginPath();
        v.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.strokeStyle = c1;
        g.globalAlpha = alfa * (spente ? 0.4 : 1) * fioca * (0.55 + 0.45 * luce);
        g.lineWidth = larg * spess;
        g.stroke();
      }
    }
    g.globalAlpha = 1;
  }
}
