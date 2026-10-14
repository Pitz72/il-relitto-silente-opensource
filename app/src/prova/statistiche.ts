// Statistiche delle misure: percentili, medie, riassunti dei fotogrammi.

export function percentile(valori: number[], p: number): number {
  if (!valori.length) return NaN;
  const v = [...valori].sort((a, b) => a - b);
  const i = Math.min(v.length - 1, Math.max(0, Math.ceil((p / 100) * v.length) - 1));
  return v[i];
}

export const media = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN);

export interface Riassunto {
  n: number;
  media: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
}

export function riassumi(v: number[]): Riassunto {
  return {
    n: v.length,
    media: arrotonda(media(v)),
    p50: arrotonda(percentile(v, 50)),
    p95: arrotonda(percentile(v, 95)),
    p99: arrotonda(percentile(v, 99)),
    max: arrotonda(v.length ? Math.max(...v) : NaN),
  };
}

export const arrotonda = (x: number, cifre = 2) => (Number.isFinite(x) ? Math.round(x * 10 ** cifre) / 10 ** cifre : x);

export interface MisuraFotogrammi {
  modo: string;
  secondi: number;
  fps: number;
  intervalli: Riassunto;
  /** quota di fotogrammi oltre 20 ms (un vsync perso a 60 Hz) e oltre 34 ms */
  oltre20: number;
  oltre34: number;
  disegno: Riassunto;
  larghezza: number;
  altezza: number;
  dpr: number;
  vene: number;
  punti: number;
}

export const attesa = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const prossimoFotogramma = () => new Promise<number>((r) => requestAnimationFrame(r));
