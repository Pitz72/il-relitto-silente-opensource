// ============================================================================
//  La nascita della mappa stellare (documento 30, §9.b; idea dell'autore,
//  11 novembre 2026): la geometria e i tempi, senza disegno.
//  Sul Ponte, quando William appoggia la mano sulla postazione (ponte.fav):
//  «Le postazioni si accendono una dopo l'altra lungo la sala, senza un suono,
//  e la struttura centrale proietta sulla cupola una mappa stellare a tre
//  dimensioni. La rotta è chiara, e il punto d'arrivo inconfondibile: il mio
//  sole.» Guardandola: «Una rotta parte da tre soli stretti in un pugno di
//  cielo, segnati con un contorno diverso dagli altri, attraversa una distanza
//  che fa male anche solo a guardarla, e finisce su un punto piccolo, giallo,
//  senza niente di speciale.» E analizzandola: «Attraversa un'altra galassia,
//  fino a un ammasso denso e luminoso.»
//  Quindi la mappa mostra DUE galassie (la cronologia privata, documento 33,
//  §11: «Con il Grande Salto la nave attraversa un'altra galassia»): la loro in
//  alto a sinistra, con l'ammasso e i tre soli; la nostra in basso a destra,
//  con il punto giallo; in mezzo il vuoto, che è la cosa più grande del quadro.
//  Le misure sono in larghezze del palco, per x e per y (il palco è 16:9: y va
//  da 0 a 0,5625); z è la profondità, nella stessa unità.
// ============================================================================
import { generatore } from "../../intro/glifi.ts";

/** I momenti, in secondi dall'inizio. È lenta apposta (l'autore, 11 novembre 2026: «manca di solennità»). */
export const TEMPI = {
  /** il velo scuro che copre il gioco: quanto ci mette a scendere */
  velo: 1.4,
  /** le postazioni, una dopo l'altra: quando si accende la prima, e ogni quanto la successiva */
  postazioni: [0.7, 0.4],
  /** la struttura a stella si accende */
  stella: [1.9, 3.5],
  /** la luce sale sulla cupola: quando parte dalla struttura, e quando arriva in fondo */
  cielo: [2.8, 5.8],
  /** i tre soli, uno dopo l'altro */
  soli: [8.0, 8.7, 9.4],
  /** la rotta si traccia */
  rotta: [10.9, 15.1],
  /** il nostro sole si accende, per ultimo */
  sole: 15.1,
  /** tutto rientra nella lente del visore, al buio; poi il velo si alza */
  ritiro: 17.5,
} as const;

/** Quanto dura tutto: poi le parole. */
export const DURATA = 19.6;

/** Da dove nasce: la struttura a stella, in basso al centro. */
export const PROIETTORE = { x: 0.5, y: 0.523 } as const;

/** La struttura, come nella scansione del visore (scansioni/stanze.ts): tre anelli e dodici punte
 *  intrecciati, ferma («galleggia immobile»). Qui le punte: la direzione, lunga al più uno. */
export const PUNTE: readonly { x: number; y: number }[] = (() => {
  const r = generatore(1616);
  return Array.from({ length: 12 }, () => {
    const a = r() * Math.PI * 2;
    const e = (r() - 0.5) * 2.4;
    return { x: Math.cos(a) * Math.cos(e), y: -Math.sin(e) };
  });
})();

/** Il pavimento della sala, visto dalla postazione di William: un'ellisse schiacciata, in basso. */
export const SALA = { x: 0.5, y: 0.537, rx: 0.42, ry: 0.017 } as const;

/** Le postazioni ai due lati di William, dalla più vicina alla più lontana: l'angolo dal davanti. */
export const POSTAZIONI: readonly number[] = [0.5, 0.95, 1.4];

export interface Galassia {
  x: number;
  y: number;
  z: number;
  raggio: number;
  /** quanto il disco è piegato rispetto al quadro (0 = di faccia) */
  inclina: number;
  /** quanto è girato nel quadro */
  giro: number;
  bracci: number;
}

/** La loro galassia: lontana, in alto a sinistra. */
export const LORO: Galassia = { x: 0.19, y: 0.16, z: -0.2, raggio: 0.115, inclina: 1.08, giro: -0.38, bracci: 2 };
/** La nostra: in basso a destra, appena più grande perché è casa. */
export const NOSTRA: Galassia = { x: 0.8, y: 0.355, z: 0.2, raggio: 0.15, inclina: 0.98, giro: 0.42, bracci: 4 };

/** Un punto del disco di una galassia (u, v sul piano, w fuori dal piano), messo nel quadro. */
export function nelDisco(g: Galassia, u: number, v: number, w = 0): { x: number; y: number; z: number } {
  const y1 = v * Math.cos(g.inclina) - w * Math.sin(g.inclina);
  const z1 = v * Math.sin(g.inclina) + w * Math.cos(g.inclina);
  return { x: g.x + u * Math.cos(g.giro) - y1 * Math.sin(g.giro), y: g.y + u * Math.sin(g.giro) + y1 * Math.cos(g.giro), z: g.z + z1 };
}

/** «Un ammasso denso e luminoso», sull'orlo della loro galassia: il pugno di cielo. */
export const AMMASSO = { x: 0.075, y: 0.185, z: -0.27 } as const;

/** I tre soli da cui sono partiti: «stretti in un pugno di cielo». */
export const SOLI: readonly { x: number; y: number; z: number }[] = [
  { x: AMMASSO.x - 0.015, y: AMMASSO.y - 0.016, z: AMMASSO.z },
  { x: AMMASSO.x + 0.019, y: AMMASSO.y - 0.004, z: AMMASSO.z },
  { x: AMMASSO.x - 0.006, y: AMMASSO.y + 0.02, z: AMMASSO.z },
];

/** Il punto d'arrivo: «un punto piccolo, giallo, senza niente di speciale. Il mio sole.» In un braccio, fuori dal centro. */
export const SOLE = nelDisco(NOSTRA, -0.042, 0.073);

const PARTENZA = { x: (SOLI[0].x + SOLI[1].x + SOLI[2].x) / 3, y: (SOLI[0].y + SOLI[1].y + SOLI[2].y) / 3, z: AMMASSO.z };
const CURVA = { x: 0.43, y: 0.085, z: 0 };

/** La rotta, da 0 (i tre soli) a 1 (il nostro): un arco solo, che passa dentro la loro galassia e poi nel vuoto. */
export function rotta(t: number): { x: number; y: number; z: number } {
  const u = 1 - t;
  return {
    x: u * u * PARTENZA.x + 2 * u * t * CURVA.x + t * t * SOLE.x,
    y: u * u * PARTENZA.y + 2 * u * t * CURVA.y + t * t * SOLE.y,
    z: u * u * PARTENZA.z + 2 * u * t * CURVA.z + t * t * SOLE.z,
  };
}

/** I segnavia lungo la rotta («segnavia, un conto alla rovescia di cicli»): dove stanno, da 0 a 1. */
export const SEGNAVIA: readonly number[] = [1, 2, 3, 4, 5, 6].map((n) => n / 7);

/** Quanto un punto è lontano dalla struttura (da 0 a 1): la luce ci arriva dopo. */
export const lontano = (x: number, y: number) => Math.min(1, Math.hypot(x - PROIETTORE.x, y - PROIETTORE.y) / 0.72);

export interface Punto {
  x: number;
  y: number;
  z: number;
  /** quanta luce fa (da 0 a 1) */
  l: number;
  /** un numero a caso tutto suo (il ritardo, il tremolio) */
  d: number;
  caldo: boolean;
  lontano: number;
}

function galassia(seme: number, g: Galassia, quanti: number): Punto[] {
  const r = generatore(seme);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r() * 0.999999)) * Math.cos(Math.PI * 2 * r());
  const out: Punto[] = [];
  for (let n = 0; n < quanti; n++) {
    const tipo = r();
    let u: number, v: number, w: number, l: number, caldo: boolean;
    if (tipo < 0.2) {
      // il nucleo: fitto, caldo, un poco più spesso del disco
      const rr = Math.abs(gauss()) * g.raggio * 0.11;
      const a = r() * Math.PI * 2;
      u = Math.cos(a) * rr;
      v = Math.sin(a) * rr;
      w = gauss() * g.raggio * 0.05;
      l = 0.45 + r() * 0.55;
      caldo = true;
    } else {
      // il disco: i bracci a spirale, e fra i bracci un pulviscolo più rado e più debole
      const rr = g.raggio * (0.1 + 0.9 * r() ** 0.75);
      const sparso = tipo > 0.78;
      const braccio = Math.floor(r() * g.bracci);
      const a = sparso ? r() * Math.PI * 2 : (braccio / g.bracci) * Math.PI * 2 + 2.6 * Math.log(1 + (3 * rr) / g.raggio) + gauss() * 0.2;
      u = Math.cos(a) * rr;
      v = Math.sin(a) * rr;
      w = gauss() * g.raggio * 0.025;
      l = r() ** 2 * (sparso ? 0.55 : 1);
      caldo = r() < 0.18;
    }
    const p = nelDisco(g, u, v, w);
    out.push({ ...p, l, d: r(), caldo, lontano: lontano(p.x, p.y) });
  }
  return out;
}

/** Tutti i punti della cupola: le stelle rade del fondo, le due galassie, l'ammasso. Sempre gli stessi. */
export const CIELO: readonly Punto[] = (() => {
  const r = generatore(1972);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - r() * 0.999999)) * Math.cos(Math.PI * 2 * r());
  const out: Punto[] = [];
  // il fondo: poche stelle deboli, perché il vuoto resti vuoto
  while (out.length < 170) {
    const x = 0.01 + r() * 0.98;
    const y = 0.01 + r() * 0.49;
    const z = (r() - 0.5) * 0.6;
    const l = 0.08 + r() ** 3 * 0.4;
    const d = r();
    // intorno alla struttura resta il buio da cui la luce sale
    if (Math.hypot(x - PROIETTORE.x, y - PROIETTORE.y) < 0.09) continue;
    out.push({ x, y, z, l, d, caldo: false, lontano: lontano(x, y) });
  }
  out.push(...galassia(4700, LORO, 1200), ...galassia(1961, NOSTRA, 2000));
  for (let n = 0; n < 150; n++) {
    const x = AMMASSO.x + gauss() * 0.018;
    const y = AMMASSO.y + gauss() * 0.018;
    out.push({ x, y, z: AMMASSO.z + gauss() * 0.016, l: 0.35 + r() * 0.65, d: r(), caldo: r() < 0.6, lontano: lontano(x, y) });
  }
  // prima i freddi e poi i caldi: il disegno cambia colore una volta sola
  return out.sort((a, b) => Number(a.caldo) - Number(b.caldo));
})();

/** Altre galassie, lontanissime: macchie di pochi punti, per dire quanto è grande la carta. */
export const LONTANE: readonly { x: number; y: number; z: number; giro: number; lungo: number; d: number }[] = (() => {
  const r = generatore(33);
  const out: { x: number; y: number; z: number; giro: number; lungo: number; d: number }[] = [];
  while (out.length < 7) {
    const x = 0.04 + r() * 0.92;
    const y = 0.03 + r() * 0.42;
    const c = { x, y, z: (r() - 0.5) * 0.7, giro: r() * Math.PI, lungo: 3 + r() * 4, d: r() };
    if (Math.hypot(x - LORO.x, y - LORO.y) < LORO.raggio * 1.5 || Math.hypot(x - NOSTRA.x, y - NOSTRA.y) < NOSTRA.raggio * 1.5) continue;
    if (Math.hypot(x - AMMASSO.x, y - AMMASSO.y) < 0.07) continue;
    out.push(c);
  }
  return out;
})();
