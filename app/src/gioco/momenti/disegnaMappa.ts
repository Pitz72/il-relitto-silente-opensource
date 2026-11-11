// ============================================================================
//  Il disegno della mappa stellare del Ponte (documento 30, §9.b): com'è al
//  secondo `s`, su una tela. Lo usano in due: l'animazione che copre il palco
//  quando la proiezione si accende (MappaStellare.tsx), e la lente del visore,
//  che da quel momento tiene l'ultimo fotogramma, fermo (MappaNellaLente.tsx;
//  l'autore, 11 novembre 2026: «dovresti sostituire l'immagine statica con il
//  frame finale dell'animazione»). Un disegno solo, così sono la stessa carta.
//  La geometria e i tempi sono in mappa.ts.
// ============================================================================
import { AMMASSO, CIELO, DURATA, LONTANE, LORO, lontano, NOSTRA, POSTAZIONI, PROIETTORE, PUNTE, rotta, SALA, SEGNAVIA, SOLE, SOLI, TEMPI, type Galassia } from "./mappa.ts";

export const blocca = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const morbido = (x: number) => {
  const c = blocca(x);
  return c * c * (3 - 2 * c);
};
export const cubica = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

const CHIARO = "#AFE6E2";
const CALDO = "#F4EBD0";
const GIALLO = "#FFD86B";
/** Il centro della carta: intorno a questo punto gira e si allontana. */
const MEZZO = { x: 0.5, y: 0.25 };
const PRIMO_CALDO = CIELO.findIndex((q) => q.caldo);

export interface Come {
  /** il colore della rotta: quello del clima */
  accento: string;
  /** quanto se ne vede (1 = tutta): alla fine dell'animazione si perde nella lente */
  resta?: number;
  /** nella lente la carta è piccola: i punti e le righe più grossi, perché si leggano (1 = com'è) */
  rinforzo?: number;
}

/**
 * Disegna la mappa com'è al secondo `s`, in un quadro 16:9 largo `W` con l'origine in alto a sinistra.
 * Non pulisce la tela e non stende il velo: lo fa chi chiama. `t` è l'orologio (il tremolio, il respiro).
 */
export function disegnaMappa(g: CanvasRenderingContext2D, W: number, s: number, t: number, { accento, resta = 1, rinforzo = 1 }: Come): void {
  const H = (W * 9) / 16;
  const k = W / 1280;
  const punto = Math.max(1, k) * rinforzo;
  const riga = 1.3 * punto;
  /** i contorni e le tacche: più grandi nella lente, ma meno dei punti */
  const segno = 1 + (rinforzo - 1) * 0.5;
  const px = PROIETTORE.x * W;
  const py = PROIETTORE.y * W;

  // --- le postazioni: «si accendono una dopo l'altra lungo la sala, senza un suono»
  g.strokeStyle = CHIARO;
  POSTAZIONI.forEach((a, n) => {
    const da0 = TEMPI.postazioni[0] + n * TEMPI.postazioni[1];
    const f = morbido((s - da0) / 0.7);
    if (f <= 0) return;
    // appena accesa è più chiara, poi si posa
    const posa = 1 - 0.4 * morbido((s - da0 - 0.7) / 1.4);
    for (const lato of [-1, 1]) {
      for (const [raggio, forza] of [[1, 0.85], [0.925, 0.4]]) {
        g.beginPath();
        for (let m = 0; m <= 8; m++) {
          const b = a - 0.11 + (m / 8) * 0.22;
          const x = (SALA.x + lato * Math.sin(b) * SALA.rx * raggio) * W;
          const y = (SALA.y + Math.cos(b) * SALA.ry * raggio) * W;
          if (m) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
        g.lineWidth = riga * (raggio === 1 ? 1.4 : 1);
        g.globalAlpha = forza * f * posa * resta;
        g.stroke();
      }
    }
  });

  // --- la struttura a stella: tre anelli e dodici punte intrecciati, ferma. Spenta si indovina appena
  const accesa = morbido((s - TEMPI.stella[0]) / (TEMPI.stella[1] - TEMPI.stella[0]));
  const corpo = (0.22 * morbido(s / 1.2) + 0.6 * accesa) * resta;
  if (accesa > 0) {
    // la luce che manda in alto: un chiarore largo e morbido, senza bordi
    g.save();
    g.translate(px, py);
    g.scale(1.7, 1);
    const fascio = g.createRadialGradient(0, 0, 0, 0, 0, H * 0.7);
    fascio.addColorStop(0, `rgba(175,230,226,${0.18 * accesa * resta})`);
    fascio.addColorStop(0.5, `rgba(175,230,226,${0.04 * accesa * resta})`);
    fascio.addColorStop(1, "rgba(175,230,226,0)");
    g.globalAlpha = 1;
    g.fillStyle = fascio;
    g.fillRect(-W, -H, W * 2, H * 2);
    g.restore();
  }
  if (corpo > 0) {
    g.strokeStyle = CHIARO;
    g.lineWidth = riga;
    g.globalAlpha = corpo;
    for (const [ry, giro] of [[11, 0], [36, 0.42], [30, -0.62]]) {
      g.beginPath();
      g.ellipse(px, py, 46 * k, ry * k, giro, 0, 7);
      g.stroke();
    }
    for (const d of PUNTE) {
      g.beginPath();
      g.moveTo(px + d.x * 10 * k, py + d.y * 10 * k);
      g.lineTo(px + d.x * 68 * k, py + d.y * 68 * k);
      g.stroke();
    }
  }
  if (accesa > 0) {
    // il cuore: un punto caldo, che respira appena
    const cuore = g.createRadialGradient(px, py, 0, px, py, 30 * k);
    cuore.addColorStop(0, `rgba(244,235,208,${(0.5 + 0.06 * Math.sin(t / 1100)) * accesa * resta})`);
    cuore.addColorStop(1, "rgba(244,235,208,0)");
    g.globalAlpha = 1;
    g.fillStyle = cuore;
    g.fillRect(px - 30 * k, py - 30 * k, 60 * k, 60 * k);
    g.globalAlpha = accesa * resta;
    g.fillStyle = CALDO;
    g.beginPath();
    g.arc(px, py, 3.2 * punto, 0, 7);
    g.fill();
  }

  // --- la carta: gira appena su sé stessa e si allontana appena, finché non rientra nella lente
  const giro = -0.07 + 0.14 * (Math.min(s, TEMPI.ritiro) / DURATA);
  const sn = Math.sin(giro);
  const cs = Math.cos(giro);
  const zoom = 1.04 - 0.04 * Math.min(1, s / TEMPI.ritiro);
  const X = (x: number, z: number) => (MEZZO.x + ((x - MEZZO.x) * cs + z * sn) * zoom) * W;
  const Y = (y: number) => (MEZZO.y + (y - MEZZO.y) * zoom) * W;
  const [c0, c1] = TEMPI.cielo;
  /** Quando la luce arriva a un punto lontano così dalla struttura. */
  const arriva = (q: number) => c0 + q * (c1 - c0);

  // la luce che sale sulla cupola: una fascia larga e tenue, che si perde salendo
  const fronte = (s - c0) / (c1 - c0);
  if (fronte > 0 && fronte < 1.2) {
    const R = fronte * 0.72 * W;
    const largo = 0.09 * W;
    const fascia = g.createRadialGradient(px, py, Math.max(0, R - largo), px, py, R + largo);
    fascia.addColorStop(0, "rgba(175,230,226,0)");
    fascia.addColorStop(0.5, `rgba(175,230,226,${0.05 * (1 - fronte / 1.2) * resta})`);
    fascia.addColorStop(1, "rgba(175,230,226,0)");
    g.globalAlpha = 1;
    g.fillStyle = fascia;
    g.fillRect(0, 0, W, H);
  }

  // le altre galassie, lontanissime: macchie morbide
  g.fillStyle = CHIARO;
  for (const q of LONTANE) {
    const f = morbido((s - arriva(lontano(q.x, q.y)) - q.d) / 2.4);
    if (f <= 0) continue;
    for (const [largo, forza] of [[1, 0.1], [0.5, 0.16]]) {
      g.globalAlpha = forza * f * resta;
      g.beginPath();
      g.ellipse(X(q.x, q.z), Y(q.y), q.lungo * k * largo, q.lungo * k * 0.5 * largo, q.giro, 0, 7);
      g.fill();
    }
  }

  // il chiarore delle due galassie, e dell'ammasso
  const alone = (c: Galassia) => {
    const f = morbido((s - arriva(lontano(c.x, c.y))) / 2.8) * resta;
    if (f <= 0) return;
    const r = c.raggio * W * zoom;
    g.save();
    g.translate(X(c.x, c.z), Y(c.y));
    g.rotate(c.giro);
    g.scale(1, Math.cos(c.inclina));
    const luce = g.createRadialGradient(0, 0, 0, 0, 0, r);
    luce.addColorStop(0, `rgba(244,235,208,${0.3 * f})`);
    luce.addColorStop(0.16, `rgba(244,235,208,${0.1 * f})`);
    luce.addColorStop(0.6, `rgba(175,230,226,${0.035 * f})`);
    luce.addColorStop(1, "rgba(175,230,226,0)");
    g.globalAlpha = 1;
    g.fillStyle = luce;
    g.fillRect(-r, -r, 2 * r, 2 * r);
    g.restore();
  };
  alone(LORO);
  alone(NOSTRA);
  {
    const f = morbido((s - arriva(lontano(AMMASSO.x, AMMASSO.y))) / 2.8) * resta;
    if (f > 0) {
      const x = X(AMMASSO.x, AMMASSO.z);
      const y = Y(AMMASSO.y);
      const r = 0.05 * W * zoom;
      const luce = g.createRadialGradient(x, y, 0, x, y, r);
      luce.addColorStop(0, `rgba(244,235,208,${0.16 * f})`);
      luce.addColorStop(1, "rgba(244,235,208,0)");
      g.globalAlpha = 1;
      g.fillStyle = luce;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
  }

  // --- le stelle: affiorano al loro posto quando la luce ci arriva. Non si muovono
  g.fillStyle = CHIARO;
  for (let n = 0; n < CIELO.length; n++) {
    const q = CIELO[n];
    if (n === PRIMO_CALDO) g.fillStyle = CALDO;
    const p = (s - arriva(q.lontano) - q.d * 0.6) / (1.5 + q.d);
    if (p <= 0) continue;
    const lato = (0.9 + q.l * 1.5) * punto;
    g.globalAlpha = morbido(p) * (0.22 + 0.78 * q.l) * (0.93 + 0.07 * Math.sin(t / 900 + q.d * 50)) * resta;
    g.fillRect(X(q.x, q.z) - lato / 2, Y(q.y) - lato / 2, lato, lato);
  }

  // --- i tre soli, «segnati con un contorno diverso dagli altri»
  SOLI.forEach((c, n) => {
    const f = (s - TEMPI.soli[n]) / 1.3;
    if (f <= 0) return;
    const x = X(c.x, c.z);
    const y = Y(c.y);
    // un alone solo, lento, quando si accende
    if (f < 2.6) {
      const al = g.createRadialGradient(x, y, 0, x, y, 36 * k);
      al.addColorStop(0, `rgba(244,235,208,${0.26 * Math.sin(Math.PI * blocca(f / 2.6)) * resta})`);
      al.addColorStop(1, "rgba(244,235,208,0)");
      g.globalAlpha = 1;
      g.fillStyle = al;
      g.fillRect(x - 36 * k, y - 36 * k, 72 * k, 72 * k);
    }
    const c1a = morbido(f);
    g.globalAlpha = c1a * resta;
    g.fillStyle = CALDO;
    g.beginPath();
    g.arc(x, y, 3.6 * punto, 0, 7);
    g.fill();
    // il contorno: un cerchio che si chiude piano, e tre tacche
    g.strokeStyle = CALDO;
    g.lineWidth = riga;
    g.globalAlpha = 0.85 * c1a * resta;
    g.beginPath();
    g.arc(x, y, 12 * k * segno, -Math.PI / 2, -Math.PI / 2 + morbido(f) * 6.283);
    g.stroke();
    // (nella lente i tre contorni stanno già stretti: le tacche si toccherebbero)
    if (f > 0.85 && rinforzo === 1) {
      g.globalAlpha = 0.7 * morbido((f - 0.85) / 0.6) * resta;
      for (let m = 0; m < 3; m++) {
        const a = -Math.PI / 2 + (m * 6.283) / 3;
        g.beginPath();
        g.moveTo(x + Math.cos(a) * 15 * k, y + Math.sin(a) * 15 * k);
        g.lineTo(x + Math.cos(a) * 19 * k, y + Math.sin(a) * 19 * k);
        g.stroke();
      }
    }
  });

  // --- la rotta: un arco solo, dentro la loro galassia e poi attraverso tutto il vuoto
  const fr = morbido((s - TEMPI.rotta[0]) / (TEMPI.rotta[1] - TEMPI.rotta[0]));
  if (fr > 0) {
    const passi = Math.max(2, Math.round(140 * fr));
    const traccia = () => {
      g.beginPath();
      for (let n = 0; n <= passi; n++) {
        const c = rotta((n / passi) * fr);
        if (n) g.lineTo(X(c.x, c.z), Y(c.y));
        else g.moveTo(X(c.x, c.z), Y(c.y));
      }
    };
    g.strokeStyle = accento;
    // sotto, una riga larga e tenue: è la forma che si legge da lontano
    g.lineWidth = 6 * k * rinforzo;
    g.globalAlpha = 0.13 * resta;
    traccia();
    g.stroke();
    g.lineWidth = 1.5 * punto;
    g.globalAlpha = 0.9 * resta;
    traccia();
    g.stroke();
    // i segnavia: una tacca di traverso, quando la rotta ci passa
    g.lineWidth = riga;
    for (const dove of SEGNAVIA) {
      const f = morbido((fr - dove) / 0.03);
      if (f <= 0) continue;
      const a = rotta(dove - 0.01);
      const b = rotta(dove + 0.01);
      const c = rotta(dove);
      const dx = X(b.x, b.z) - X(a.x, a.z);
      const dy = Y(b.y) - Y(a.y);
      const lungo = Math.hypot(dx, dy) || 1;
      const nx = (-dy / lungo) * 5 * k * segno;
      const ny = (dx / lungo) * 5 * k * segno;
      g.globalAlpha = 0.8 * f * resta;
      g.beginPath();
      g.moveTo(X(c.x, c.z) - nx, Y(c.y) - ny);
      g.lineTo(X(c.x, c.z) + nx, Y(c.y) + ny);
      g.stroke();
    }
    // la punta che avanza: una luce piccola
    if (fr < 1) {
      const c = rotta(fr);
      const x = X(c.x, c.z);
      const y = Y(c.y);
      const al = g.createRadialGradient(x, y, 0, x, y, 16 * k);
      al.addColorStop(0, "rgba(244,235,208,.85)");
      al.addColorStop(1, "rgba(244,235,208,0)");
      g.globalAlpha = resta;
      g.fillStyle = al;
      g.fillRect(x - 16 * k, y - 16 * k, 32 * k, 32 * k);
    }
  }

  // --- il nostro sole: piccolo, giallo, per ultimo
  const fs = s - TEMPI.sole;
  if (fs > 0) {
    const x = X(SOLE.x, SOLE.z);
    const y = Y(SOLE.y);
    if (fs < 2.4) {
      // un cerchio solo, che si allarga piano e si perde
      g.strokeStyle = GIALLO;
      g.lineWidth = riga;
      g.globalAlpha = 0.6 * (1 - fs / 2.4) * resta;
      g.beginPath();
      g.arc(x, y, (6 + 32 * (1 - (1 - fs / 2.4) ** 3)) * k, 0, 7);
      g.stroke();
    }
    const r = 30 * k * segno;
    const al = g.createRadialGradient(x, y, 0, x, y, r);
    al.addColorStop(0, `rgba(255,216,107,${0.45 * morbido(fs / 1.6) * resta})`);
    al.addColorStop(1, "rgba(255,216,107,0)");
    g.globalAlpha = 1;
    g.fillStyle = al;
    g.fillRect(x - r, y - r, 2 * r, 2 * r);
    g.globalAlpha = morbido(fs / 1.2) * resta;
    g.fillStyle = GIALLO;
    g.beginPath();
    g.arc(x, y, 3.6 * punto, 0, 7);
    g.fill();
  }
  g.globalAlpha = 1;
}
