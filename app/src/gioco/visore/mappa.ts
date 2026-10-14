// ============================================================================
//  La mappa del visore (06-app-desktop.md, §4.4 e §4.7): la costellazione delle
//  stanze viste. La disegna il multiscanner man mano: compaiono solo le stanze
//  viste, con le uscite conosciute. Orientata come la bussola del gioco: ovest a
//  sinistra, nord in alto (la Santa Maria a est, il relitto che si addentra
//  verso ovest); su e giù scendono di un passo. Il riquadro è 310 × 100.
// ============================================================================
import type { StanzaMappa } from "../../motore/tipi.ts";

export const POSIZIONI: Readonly<Record<string, readonly [number, number]>> = {
  // la Santa Maria
  cuccetta: [292, 12],
  plancia: [292, 34],
  stiva: [262, 34],
  "sala macchine": [262, 58],
  // fuori, e l'ingresso
  scafo: [234, 46],
  "camera di compensazione": [208, 58],
  "vestibolo delle gole": [180, 58],
  // sotto il vestibolo, e la fuga
  "gola di mezzo": [180, 76],
  "sala delle teche": [180, 92],
  vivaio: [154, 92],
  "gola del ritorno": [206, 88],
  // il corridoio e le ali
  "corridoio principale": [146, 50],
  "laboratorio di risonanza": [162, 72],
  "serra morente": [132, 72],
  "arca biologica": [106, 76],
  "santuario del silenzio": [146, 26],
  scriptorium: [118, 26],
  "arca della memoria": [118, 8],
  "alloggio dell'equipaggio": [170, 34],
  nido: [170, 14],
  // il Ponte
  "ponte di comando": [96, 50],
  anticamera: [66, 50],
  "santuario centrale": [36, 50],
};

/** Dove punta una direzione, per i monconi delle uscite che non si conoscono. */
const VERSO: Readonly<Record<string, readonly [number, number]>> = {
  nord: [0, -1],
  sud: [0, 1],
  est: [1, 0],
  ovest: [-1, 0],
  nordest: [0.7, -0.7],
  nordovest: [-0.7, -0.7],
  sudest: [0.7, 0.7],
  sudovest: [-0.7, 0.7],
  su: [0.35, -0.94],
  giù: [-0.35, 0.94],
  dentro: [0.94, -0.35],
  fuori: [-0.94, 0.35],
};

export interface Costellazione {
  stanze: { id: string; x: number; y: number; qui: boolean }[];
  passaggi: { da: string; a: string; x1: number; y1: number; x2: number; y2: number }[];
  /** le uscite verso stanze mai viste: un moncone che sfuma */
  monconi: { x1: number; y1: number; x2: number; y2: number }[];
}

export function costellazione(mappa: Readonly<Record<string, StanzaMappa>>, qui: string): Costellazione {
  const stanze = Object.keys(mappa)
    .filter((id) => POSIZIONI[id])
    .map((id) => ({ id, x: POSIZIONI[id][0], y: POSIZIONI[id][1], qui: id === qui }));
  const passaggi: Costellazione["passaggi"] = [];
  const visti = new Set<string>();
  const monconi: Costellazione["monconi"] = [];
  for (const [id, s] of Object.entries(mappa)) {
    const p = POSIZIONI[id];
    if (!p) continue;
    for (const [dir, dest] of Object.entries(s.uscite)) {
      if (dest && POSIZIONI[dest]) {
        const chiave = [id, dest].sort().join("|");
        if (visti.has(chiave)) continue;
        visti.add(chiave);
        passaggi.push({ da: id, a: dest, x1: p[0], y1: p[1], x2: POSIZIONI[dest][0], y2: POSIZIONI[dest][1] });
      } else if (!dest && VERSO[dir]) {
        const [dx, dy] = VERSO[dir];
        monconi.push({ x1: p[0], y1: p[1], x2: p[0] + dx * 11, y2: p[1] + dy * 11 });
      }
    }
  }
  return { stanze, passaggi, monconi };
}
