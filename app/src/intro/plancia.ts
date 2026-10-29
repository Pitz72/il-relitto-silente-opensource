// ============================================================================
//  La plancia dell'intro (C, D, H; 09-intro-storyboard.md, §10: «le scene
//  definitive»). Un'immagine sola, s_01_b a piena risoluzione, con il vetro
//  dell'oblò bucato (strumenti/intro/plancia_hd.py): dietro il buco il motore
//  della scala disegna la vista fuori, dal vivo. Una camera sola si muove
//  sull'immagine:
//    C  la console e l'oblò; il fuoco passa dallo schermo al vetro, e l'obiettivo
//       «respira» (l'immagine cresce di un poco); le quattro stelle si spengono
//       quando il bordo del fuso le copre davvero
//    D  il faro si accende e cerca; la camera si accosta piano all'oblò
//    H  dal nero del fuso, dentro il vetro, la camera arretra fino alla plancia
//       intera; le bande si ritirano, l'immagine diventa la telecamera di bordo
//       e va al suo posto, nella lente del gioco
//  Il radar, la spia rossa della prossimità e il relè del faro si disegnano
//  sopra l'immagine, con la luce che gettano sulla console.
// ============================================================================
import type { Ottica, Scala } from "./scala";
import { fra, morbido, SCALETTA } from "./scaletta";

const S = SCALETTA;
const M = S.momenti;
type V3 = [number, number, number];

export const BANDA = (1 - 16 / 9 / 2.39) / 2; // 0,128 dell'altezza del palco
export const IMMAGINE = { w: 3120, h: 1328 };
/** il vetro dell'oblò, in pixel dell'immagine (plancia_hd.py) */
export const OBLO = { x: 1868, y: 632, r: 183 };
const SCHERMO = { x0: 1735, y0: 885, x1: 1913, y1: 1001, raggio: 9 };
/** i tre tasti sotto lo schermo: il terzo è la spia della prossimità, il secondo il relè del faro */
const SPIA_ROSSA = { x: 1910.5, y: 1016 };
const RELE = { x: 1895.5, y: 1016 };
/** plancia.webp, l'immagine della lente nel gioco: s_01_b dalla riga 8 alla 1313, a 1280 × 535 */
const LENTE_IMG = { y0: 8, h: 1305 };
const CENTRO_LENTE = { x: IMMAGINE.w / 2, y: LENTE_IMG.y0 + LENTE_IMG.h / 2 };

/** Un rettangolo del palco, in frazioni (x e larghezza della larghezza, y e altezza dell'altezza). */
export interface Rett {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** Dove guarda la camera (cx, cy, in pixel dell'immagine), quanta immagine vede in altezza (sh), e in
 *  quale rettangolo del palco la mette. */
export interface Ripresa {
  cx: number;
  cy: number;
  sh: number;
  q: Rett;
}

const PIENO: Rett = { x: 0, y: BANDA, w: 1, h: 1 - 2 * BANDA };
const INTERO: Rett = { x: 0, y: 0, w: 1, h: 1 };
/** la lente del visore nel gioco (visore.css: left 65,4cqw, top 2,6cqw, 31 × 15cqw), sullo stesso palco 16:9 */
export const LENTE: Rett = { x: 0.654, y: 0.026 * (16 / 9), w: 0.31, h: 0.15 * (16 / 9) };

const C0 = S.scene[2].inizio;
const D0 = S.scene[3].inizio;
const E0 = M.scala[0];
/** il taglio di H, nel nero: dal fuso del titolo al fuso dentro il vetro */
export const TAGLIO_H = M.raccordo[0] + 0.8;
/** quando l'immagine, già telecamera di bordo, comincia ad andare nella lente, e quando ci arriva */
export const VOLO: [number, number] = [M.interfaccia[0] + 1.15, M.interfaccia[0] + 2.9];

// le inquadrature: C sulla console con l'oblò sopra; D l'oblò che riempie l'altezza
const QC = { cx: 1832, cy: 752, sh: 560 };
const QC2 = { cx: 1836, cy: 748, sh: 548 };
const QD = { cx: 1868, cy: 650, sh: 430 };
/** nel vetro, il rettangolo 2,39:1 più grande che ci sta dentro: solo nero e stelle */
const SH_VETRO = (2 * OBLO.r) / Math.hypot(1, 2.39) * 0.97;

const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const mixR = (a: Rett, b: Rett, k: number): Rett => ({ x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), w: mix(a.w, b.w, k), h: mix(a.h, b.h, k) });

/** Le riprese di un istante: di solito una; nel movimento ridotto, alla fine, due in dissolvenza. */
export function riprese(t: number, ridotto: boolean): { r: Ripresa; alfa: number }[] {
  if (t >= C0 && t < E0) {
    const creep = ridotto ? 0 : fra(t, C0, D0);
    const spinta = ridotto ? 0 : morbido(fra(t, D0 + 0.4, E0));
    const cx = mix(mix(QC.cx, QC2.cx, creep), QD.cx, spinta);
    const cy = mix(mix(QC.cy, QC2.cy, creep), QD.cy, spinta);
    let sh = mix(mix(QC.sh, QC2.sh, creep), QD.sh, spinta);
    // il fuoco che va lontano fa crescere appena l'immagine: il respiro dell'obiettivo
    if (!ridotto) sh /= 1 + 0.014 * morbido(fra(t, M.fuoco[0], M.fuoco[1]));
    return [{ r: { cx, cy, sh, q: PIENO }, alfa: 1 }];
  }
  if (t < TAGLIO_H) return [];
  const intera = { cx: CENTRO_LENTE.x, cy: CENTRO_LENTE.y, sh: LENTE_IMG.h };
  const bande = morbido(fra(t, M.interfaccia[0], M.interfaccia[0] + 1.0));
  const qFeed = mixR(PIENO, INTERO, bande);
  if (ridotto) {
    // la plancia intera, poi la lente, in dissolvenza
    const k = morbido(fra(t, VOLO[0], VOLO[1]));
    const out = [];
    if (k < 1) out.push({ r: { ...intera, q: qFeed }, alfa: 1 - k });
    if (k > 0) out.push({ r: { ...intera, q: LENTE }, alfa: k });
    return out;
  }
  // dal vetro alla plancia intera: la distanza cresce a passo costante sulla scala logaritmica,
  // con un avvio e un arresto morbidi; il centro resta sull'oblò finché la plancia non entra
  const u = morbido(fra(t, TAGLIO_H, M.arretra[1]));
  const e = Math.pow(u, 0.85);
  const sh = Math.exp(mix(Math.log(SH_VETRO), Math.log(LENTE_IMG.h), e));
  const verso = Math.pow(u, 2.2);
  const cx = mix(OBLO.x, intera.cx, verso), cy = mix(OBLO.y, intera.cy, verso);
  const volo = morbido(fra(t, VOLO[0], VOLO[1]));
  return [{ r: { cx, cy, sh, q: mixR(qFeed, LENTE, volo) }, alfa: 1 }];
}

/** Dove va l'immagine sul palco: s pixel del palco per pixel dell'immagine, e lo scarto. */
export function mappa(r: Ripresa, W: number, H: number) {
  const qw = r.q.w * W, qh = r.q.h * H;
  const s = qh / r.sh;
  const sw = qw / s;
  const cx = Math.max(sw / 2, Math.min(IMMAGINE.w - sw / 2, r.cx));
  const cy = Math.max(r.sh / 2, Math.min(IMMAGINE.h - r.sh / 2, r.cy));
  return { s, ox: r.q.x * W + qw / 2 - cx * s, oy: r.q.y * H + qh / 2 - cy * s, qx: r.q.x * W, qy: r.q.y * H, qw, qh };
}

/** L'ottica del motore perché la vista fuori cada nel vetro dell'oblò di questa ripresa. */
export function otticaOblo(r: Ripresa, W: number, H: number): Ottica {
  const m = mappa(r, W, H);
  const px = m.ox + OBLO.x * m.s, py = m.oy + OBLO.y * m.s, R = OBLO.r * m.s;
  const x0 = Math.max(m.qx, px - R), y0 = Math.max(m.qy, py - R);
  const x1 = Math.min(m.qx + m.qw, px + R), y1 = Math.min(m.qy + m.qh, py + R);
  return {
    sca: [(2 * R) / W, (2 * R) / H],
    off: [(2 * px) / W - 1, 1 - (2 * py) / H],
    quadrata: true,
    ritaglio: [x0 / W, y0 / H, Math.max(0, x1 - x0) / W, Math.max(0, y1 - y0) / H],
  };
}

/** Il tempo del motore per la vista dall'oblò: in C e D quello della scena; in H un altro momento. */
export function tempoOblo(t: number): number {
  return t < E0 ? t - C0 : 40 + (t - TAGLIO_H);
}

/** Il fuoco: quanto sono nitide la console (vicina) e la parete con l'oblò (lontana). */
export function fuochi(t: number): { console: number; parete: number } {
  if (t >= C0 && t < E0) {
    const k = morbido(fra(t, M.fuoco[0], M.fuoco[1]));
    return { console: 1 - k, parete: k };
  }
  return { console: 1, parete: 1 };
}

/** Il faro della plancia: acceso dal relè, con un attimo d'incertezza della lampada; poi cerca, di
 *  pochi gradi, e resta acceso. */
export function faro(t: number, ridotto: boolean): { luce: number; gradi: number } {
  // in H il faro è ancora acceso, dove ha smesso di cercare
  if (t >= TAGLIO_H) return { luce: 1, gradi: ridotto ? 0 : -1.2 };
  if (t < M.faro || t >= E0) return { luce: 0, gradi: 0 };
  const x = t - M.faro;
  // la lampada: sale, esita una volta, poi si stabilizza (un solo calo: niente lampi)
  const luce = x < 0.09 ? (x / 0.09) * 0.4 : x < 0.2 ? 0.4 - ((x - 0.09) / 0.11) * 0.22 : 0.18 + 0.82 * morbido(fra(x, 0.2, 0.75));
  if (ridotto) return { luce, gradi: 0 };
  // cerca: a destra, una pausa, a sinistra, poi torna appena
  const gradi = 4.2 * morbido(fra(x, 1.0, 2.4)) - 7.4 * morbido(fra(x, 3.0, 5.0)) + 2.0 * morbido(fra(x, 5.4, 6.9));
  return { luce, gradi };
}

// ---------------------------------------------------------------------------
//  Il disegno
// ---------------------------------------------------------------------------
export interface Immagini {
  hd: HTMLImageElement;
  sfocata: HTMLImageElement;
  lente: HTMLImageElement;
}

interface Stella {
  dir: V3;
  /** quando la copre il fuso (o, se non si è trovato il bordo, quando si spegne) */
  via: number;
  /** se la copre il fuso davvero */
  fuso: boolean;
  luce: number;
}

/** Le macchie di polvere nell'aria della plancia, fra la camera e la parete: fuori fuoco, lente. */
const POLVERE = Array.from({ length: 22 }, (_, i) => {
  const r = (k: number) => {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return { x: r(1), y: r(2), raggio: 0.006 + r(3) * 0.016, luce: 0.03 + r(4) * 0.06, vx: (r(5) - 0.5) * 0.004, vy: -0.002 - r(6) * 0.004, fase: r(7) * 6.28 };
});

export class Plancia {
  private img: Immagini;
  private strato = document.createElement("canvas");
  private stelle: Stella[] = [];

  constructor(img: Immagini) {
    this.img = img;
  }

  /** Le quattro stelle che si spengono in C: per ognuna si cerca un punto del bordo del fuso, nel
   *  vetro, nell'istante in cui deve spegnersi; il motore poi la copre da sé. */
  prepara(m: Scala): void {
    const stelle: Stella[] = [];
    const righe = [-0.42, -0.14, 0.18, 0.46, -0.6, 0.62, 0.0, -0.28, 0.32];
    const usate = new Set<number>();
    for (let i = 0; i < 4; i++) {
      const via = M.stelleSpente[0] + 0.4 + i * 1.25;
      const tq = tempoOblo(via);
      let trovata: Stella | null = null;
      for (const y of righe) {
        if (trovata) break;
        if (usate.has(y)) continue;
        // il bordo lungo la riga y, da sinistra a destra
        let prima = m.cieloDallOblo(m.direzioneDallOblo(-0.9, y, tq), tq).coperta;
        for (let k = 1; k <= 90 && !trovata; k++) {
          const x = -0.9 + (k * 1.8) / 90;
          const ora = m.cieloDallOblo(m.direzioneDallOblo(x, y, tq), tq).coperta;
          if (ora !== prima) {
            let a = x - 1.8 / 90, b = x;
            for (let n = 0; n < 30; n++) {
              const c = (a + b) / 2;
              if (m.cieloDallOblo(m.direzioneDallOblo(c, y, tq), tq).coperta === prima) a = c;
              else b = c;
            }
            const xb = prima ? b : a; // dalla parte scoperta
            if (Math.hypot(xb, y) > 0.82) {
              prima = ora;
              continue;
            }
            const dir = m.direzioneDallOblo(xb, y, tq);
            const primaDi = m.cieloDallOblo(dir, tq - 0.6).coperta;
            const dopo = m.cieloDallOblo(dir, tq + 0.6).coperta;
            if (!primaDi && dopo) {
              trovata = { dir, via, fuso: true, luce: 1 - i * 0.06 };
              usate.add(y);
            }
          }
          prima = ora;
        }
      }
      // se il bordo non si trova (un'altra inquadratura del cielo): la stella si spegne a tempo
      stelle.push(trovata ?? { dir: m.direzioneDallOblo(-0.5 + i * 0.3, 0.3 - i * 0.2, tq), via, fuso: false, luce: 0.85 });
    }
    this.stelle = stelle;
  }

  /** Disegna la plancia dell'istante t (niente, fuori dalle sue scene). Torna l'ottica del motore
   *  per il vetro, se l'oblò si vede, e se la vista fuori va disegnata. */
  disegna(g: CanvasRenderingContext2D, t: number, W: number, H: number, m: Scala | null, ridotto: boolean): void {
    const rs = riprese(t, ridotto);
    if (!rs.length) return;
    for (const { r, alfa } of rs) {
      g.save();
      g.globalAlpha = alfa;
      this.ripresa(g, r, t, W, H, m, ridotto);
      g.restore();
    }
  }

  private ripresa(g: CanvasRenderingContext2D, r: Ripresa, t: number, W: number, H: number, m: Scala | null, ridotto: boolean) {
    const mp = mappa(r, W, H);
    const { s, ox, oy } = mp;
    const X = (x: number) => ox + x * s;
    const Y = (y: number) => oy + y * s;
    const volo = morbido(fra(t, VOLO[0], VOLO[1]));
    const inH = t >= TAGLIO_H;
    // l'immagine della lente del gioco prende il posto della plancia viva durante il volo
    const lenteFinale = inH ? morbido(fra(t, VOLO[0] + 0.1, VOLO[0] + 0.9)) : 0;
    // la telecamera di bordo: la tinta seppia della lente, le righe del monitor
    const feed = inH ? morbido(fra(t, M.interfaccia[0] + 0.25, VOLO[1])) : 0;

    g.save();
    // il quadro: nella lente, gli angoli arrotondati dell'acciaio (.3cqw)
    const raggio = 0.003 * W * volo;
    g.beginPath();
    if (raggio > 0.2) g.roundRect(mp.qx, mp.qy, mp.qw, mp.qh, raggio);
    else g.rect(mp.qx, mp.qy, mp.qw, mp.qh);
    g.clip();

    // 1. le stelle che si spengono, dentro il vetro (sotto l'immagine: il bordo del vetro le copre)
    if (m && t >= M.fuoco[0] && t < E0) this.stelleNelVetro(g, t, X(OBLO.x), Y(OBLO.y), OBLO.r * s, m);

    // 2. l'immagine: la sfocata sotto, la nitida sopra dove il fuoco la vuole
    const filtro = feed > 0 ? `sepia(${0.55 * feed}) saturate(${1 + 0.2 * feed}) hue-rotate(${-8 * feed}deg) brightness(${1 - 0.2 * feed})` : "none";
    if (lenteFinale < 1) {
      const f = fuochi(t);
      g.filter = filtro;
      this.immagine(g, this.img.sfocata, 0.5, mp, W, H);
      if (f.console >= 0.999 && f.parete >= 0.999) this.immagine(g, this.img.hd, 1, mp, W, H);
      else if (f.console > 0.001 || f.parete > 0.001) this.nitidaConMaschera(g, mp, W, H, f, Y);
      g.filter = "none";

      // 3. le luci della console: il radar, la spia rossa, il relè del faro; e la loro luce intorno
      this.console(g, t, s, X, Y, f.console, ridotto);
    }
    if (lenteFinale > 0) {
      g.globalAlpha *= lenteFinale;
      g.filter = filtro;
      g.drawImage(this.img.lente, X(0), Y(LENTE_IMG.y0), IMMAGINE.w * s, LENTE_IMG.h * s);
      g.filter = "none";
      g.globalAlpha /= lenteFinale;
    }

    // 4. l'aria della plancia: la polvere fuori fuoco davanti alla camera (C e D)
    if (t < E0 && !ridotto) this.polvere(g, t, mp);

    // 5. la luce del quadro: una vignetta da cinema, che sparisce quando diventa telecamera
    const vig = (t < E0 ? 1 : 1 - morbido(fra(t, M.interfaccia[0], M.interfaccia[0] + 1.2))) * 0.5;
    if (vig > 0.01) {
      const cxq = mp.qx + mp.qw / 2, cyq = mp.qy + mp.qh / 2;
      const gr = g.createRadialGradient(cxq, cyq, Math.min(mp.qw, mp.qh) * 0.35, cxq, cyq, Math.hypot(mp.qw, mp.qh) * 0.58);
      gr.addColorStop(0, "rgba(0,0,0,0)");
      gr.addColorStop(1, `rgba(0,0,0,${vig})`);
      g.fillStyle = gr;
      g.fillRect(mp.qx, mp.qy, mp.qw, mp.qh);
    }

    // 6. la telecamera di bordo: le righe del monitor e il cambio di canale, come nella lente del gioco
    if (feed > 0) {
      g.fillStyle = `rgba(0,0,0,${0.22 * feed})`;
      const passo = Math.max(3, (3 * H) / 1080);
      for (let y = mp.qy; y < mp.qy + mp.qh; y += passo) g.fillRect(mp.qx, y, mp.qw, Math.max(1, passo / 3));
      const canale = fra(t, M.interfaccia[0] + 0.15, M.interfaccia[0] + 0.8);
      if (canale > 0 && canale < 1 && !ridotto) {
        // la riga chiara che rotola, una volta
        const yb = mp.qy + mp.qh * (1.1 - canale * 1.4);
        const gr = g.createLinearGradient(0, yb - mp.qh * 0.06, 0, yb + mp.qh * 0.06);
        gr.addColorStop(0, "rgba(240,232,214,0)");
        gr.addColorStop(0.5, `rgba(240,232,214,${0.28 * (1 - canale)})`);
        gr.addColorStop(1, "rgba(240,232,214,0)");
        g.fillStyle = gr;
        g.fillRect(mp.qx, yb - mp.qh * 0.06, mp.qw, mp.qh * 0.12);
      }
      // l'ombra del vetro della lente, dentro il bordo (visore.css)
      if (volo > 0) {
        g.strokeStyle = `rgba(0,0,0,${0.6 * volo})`;
        g.lineWidth = 0.012 * W;
        g.filter = `blur(${0.006 * W}px)`;
        g.strokeRect(mp.qx - 0.004 * W, mp.qy - 0.004 * W, mp.qw + 0.008 * W, mp.qh + 0.008 * W);
        g.filter = "none";
      }
    }
    g.restore();
  }

  /** Una parte dell'immagine (nitida o sfocata): solo quello che si vede. */
  private immagine(g: CanvasRenderingContext2D, img: HTMLImageElement, k: number, mp: ReturnType<typeof mappa>, _W: number, _H: number) {
    const sx = Math.max(0, (mp.qx - mp.ox) / mp.s), sy = Math.max(0, (mp.qy - mp.oy) / mp.s);
    const ex = Math.min(IMMAGINE.w, (mp.qx + mp.qw - mp.ox) / mp.s), ey = Math.min(IMMAGINE.h, (mp.qy + mp.qh - mp.oy) / mp.s);
    if (ex <= sx || ey <= sy) return;
    g.drawImage(img, sx * k, sy * k, (ex - sx) * k, (ey - sy) * k, mp.ox + sx * mp.s, mp.oy + sy * mp.s, (ex - sx) * mp.s, (ey - sy) * mp.s);
  }

  /** La nitida, dove il fuoco la vuole: sopra la riga 830 la parete con l'oblò, sotto la 900 la console. */
  private nitidaConMaschera(g: CanvasRenderingContext2D, mp: ReturnType<typeof mappa>, W: number, H: number, f: { console: number; parete: number }, Y: (y: number) => number) {
    const c = this.strato;
    const dpr = g.getTransform().a;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    const h = c.getContext("2d")!;
    h.setTransform(dpr, 0, 0, dpr, 0, 0);
    h.globalCompositeOperation = "source-over";
    h.clearRect(0, 0, W, H);
    h.filter = g.filter;
    this.immagine(h, this.img.hd, 1, mp, W, H);
    h.filter = "none";
    h.globalCompositeOperation = "destination-in";
    const y0 = Y(830), y1 = Y(905);
    const gr = h.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, `rgba(0,0,0,${f.parete})`);
    gr.addColorStop(1, `rgba(0,0,0,${f.console})`);
    h.fillStyle = gr;
    h.fillRect(0, 0, W, H);
    h.globalCompositeOperation = "source-over";
    const prima = g.filter;
    g.filter = "none";
    g.drawImage(c, 0, 0, W, H);
    g.filter = prima;
  }

  /** Le quattro stelle nel vetro, più chiare delle altre: l'occhio le trova prima che si spengano. */
  private stelleNelVetro(g: CanvasRenderingContext2D, t: number, px: number, py: number, R: number, m: Scala) {
    const vis = morbido(fra(t, M.fuoco[0] + 0.6, M.fuoco[1]));
    if (vis <= 0) return;
    const tq = tempoOblo(t);
    g.save();
    g.beginPath();
    g.arc(px, py, R, 0, Math.PI * 2);
    g.clip();
    g.globalCompositeOperation = "lighter";
    for (const st of this.stelle) {
      let luce = st.luce * vis;
      if (st.fuso) {
        if (m.cieloDallOblo(st.dir, tq).coperta) continue;
      } else luce *= 1 - morbido(fra(t, st.via, st.via + 0.12));
      if (luce <= 0.002) continue;
      const q = m.cieloDallOblo(st.dir, tq);
      const x = px + q.x * R, y = py - q.y * R;
      const k = R / 260;
      const alone = g.createRadialGradient(x, y, 0, x, y, 22 * k);
      alone.addColorStop(0, `rgba(215,228,255,${0.5 * luce})`);
      alone.addColorStop(0.25, `rgba(200,218,255,${0.16 * luce})`);
      alone.addColorStop(1, "rgba(215,228,255,0)");
      g.fillStyle = alone;
      g.fillRect(x - 22 * k, y - 22 * k, 44 * k, 44 * k);
      // quattro raggi corti e tenui: la stella più forte del campo
      g.fillStyle = `rgba(225,235,255,${0.22 * luce})`;
      g.fillRect(x - 16 * k, y - 0.45 * k, 32 * k, 0.9 * k);
      g.fillRect(x - 0.45 * k, y - 16 * k, 0.9 * k, 32 * k);
      g.fillStyle = `rgba(250,252,255,${luce})`;
      g.beginPath();
      g.arc(x, y, Math.max(1.1, 2.1 * k), 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  /** Il radar a fosforo sullo schermo verde, la spia rossa, il relè del faro, e la loro luce. */
  private console(g: CanvasRenderingContext2D, t: number, s: number, X: (x: number) => number, Y: (y: number) => number, nitida: number, ridotto: boolean) {
    const sfoca = (1 - nitida) * 9 * s;
    const x0 = X(SCHERMO.x0), y0 = Y(SCHERMO.y0), w = (SCHERMO.x1 - SCHERMO.x0) * s, h = (SCHERMO.y1 - SCHERMO.y0) * s;
    const tc = t - C0;
    g.save();
    if (sfoca > 0.3) g.filter = `blur(${sfoca.toFixed(1)}px)`;

    // la luce dello schermo sulla console e sulla parete, un respiro appena
    const vivo = 0.94 + 0.06 * Math.sin(tc * 2 * Math.PI * 0.37);
    g.globalCompositeOperation = "screen";
    const sp = g.createRadialGradient(x0 + w / 2, y0 + h / 2, w * 0.3, x0 + w / 2, y0 + h / 2, w * 1.25);
    sp.addColorStop(0, `rgba(60,200,110,${0.16 * vivo})`);
    sp.addColorStop(1, "rgba(60,200,110,0)");
    g.fillStyle = sp;
    g.fillRect(x0 - w, y0 - h * 1.4, w * 3, h * 3.6);
    g.globalCompositeOperation = "source-over";

    // il vetro dello schermo
    g.save();
    g.beginPath();
    g.roundRect(x0, y0, w, h, SCHERMO.raggio * s);
    g.clip();
    const base = g.createRadialGradient(x0 + w * 0.45, y0 + h * 0.5, 0, x0 + w * 0.45, y0 + h * 0.5, w * 0.75);
    base.addColorStop(0, "#0d2c17");
    base.addColorStop(1, "#020a05");
    g.fillStyle = base;
    g.fillRect(x0, y0, w, h);
    // il radar: a sinistra; le scritte a destra
    const cx = x0 + w * 0.38, cy = y0 + h * 0.52, R = h * 0.4;
    g.strokeStyle = "rgba(60,190,100,0.38)";
    g.lineWidth = Math.max(0.8, 0.9 * s);
    for (const k of [1, 0.66, 0.33]) {
      g.beginPath();
      g.arc(cx, cy, R * k, 0, Math.PI * 2);
      g.stroke();
    }
    g.beginPath();
    g.moveTo(cx - R, cy);
    g.lineTo(cx + R, cy);
    g.moveTo(cx, cy - R);
    g.lineTo(cx, cy + R);
    g.stroke();
    // il fascio, un giro ogni tre secondi, con la scia del fosforo
    const ang = ((tc / 3) % 1) * Math.PI * 2 - Math.PI / 2;
    const scia = g.createConicGradient(ang, cx, cy);
    scia.addColorStop(0, "rgba(120,255,150,0)");
    scia.addColorStop(0.62, "rgba(120,255,150,0)");
    scia.addColorStop(0.97, "rgba(120,255,150,0.30)");
    scia.addColorStop(1, "rgba(150,255,175,0.55)");
    g.fillStyle = scia;
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(190,255,205,0.95)";
    g.shadowColor = "rgba(120,255,150,0.9)";
    g.shadowBlur = 4 * s;
    g.lineWidth = Math.max(1, 1.1 * s);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
    g.stroke();
    // gli echi: si accendono quando il fascio li passa, poi il fosforo li lascia andare. Nessuno nel
    // settore della cosa: un arco ambra ne segna il bordo
    const ECHI: [number, number][] = [[100, 0.42], [128, 0.71], [151, 0.33], [205, 0.86], [236, 0.55], [262, 0.24], [301, 0.78], [338, 0.62], [170, 0.9], [285, 0.45]];
    for (const [gradi, rr] of ECHI) {
      const a = (gradi * Math.PI) / 180;
      const dopo = (((ang - a) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const luce = Math.exp(-dopo / 1.9);
      g.fillStyle = `rgba(150,255,175,${0.1 + 0.9 * luce})`;
      g.shadowBlur = 5 * s * luce;
      g.beginPath();
      g.arc(cx + Math.cos(a) * R * rr, cy + Math.sin(a) * R * rr, Math.max(1, 1.5 * s), 0, Math.PI * 2);
      g.fill();
    }
    g.shadowBlur = 0;
    const [m0, m1] = [(-55 * Math.PI) / 180, (10 * Math.PI) / 180];
    g.strokeStyle = "rgba(242,178,61,0.9)";
    g.lineWidth = Math.max(1, 1.4 * s);
    g.beginPath();
    g.arc(cx, cy, R * 1.06, m0, m1);
    g.stroke();
    // le scritte: «CONTATTO · N.ID.», «ECO — —»
    g.font = `500 ${(7.2 * s).toFixed(1)}px "IBM Plex Mono", Consolas, monospace`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const tx = x0 + w * 0.8;
    g.fillStyle = "rgba(150,255,175,0.95)";
    g.shadowColor = "rgba(120,255,150,0.8)";
    g.shadowBlur = 3 * s;
    g.fillText("CONTATTO", tx, y0 + h * 0.2);
    g.fillText("N.ID.", tx, y0 + h * 0.33);
    g.fillStyle = "rgba(120,200,140,0.75)";
    g.fillText("ECO", tx, y0 + h * 0.56);
    // la riga dell'eco lampeggia piano, come un campo che aspetta
    g.fillStyle = `rgba(242,178,61,${0.6 + 0.35 * Math.sin(tc * Math.PI) ** 2})`;
    g.shadowColor = "rgba(242,178,61,0.7)";
    g.fillText("— —", tx, y0 + h * 0.69);
    g.shadowBlur = 0;
    // le righe del tubo e un riflesso sul vetro
    g.fillStyle = "rgba(0,0,0,0.28)";
    for (let y = y0; y < y0 + h; y += 2 * s) g.fillRect(x0, y, w, Math.max(0.6, 0.7 * s));
    const vetro = g.createLinearGradient(x0, y0, x0 + w, y0 + h);
    vetro.addColorStop(0, "rgba(220,240,230,0.10)");
    vetro.addColorStop(0.35, "rgba(220,240,230,0.02)");
    vetro.addColorStop(1, "rgba(0,0,0,0.25)");
    g.fillStyle = vetro;
    g.fillRect(x0, y0, w, h);
    g.restore();

    // la spia rossa della prossimità: una volta al secondo, morbida, e non suona
    const rosso = ridotto ? 0.6 : 0.2 + 0.8 * Math.sin((tc % 1) * Math.PI) ** 2;
    this.tasto(g, X(SPIA_ROSSA.x), Y(SPIA_ROSSA.y), s, [255, 70, 52], rosso, 1.0);
    // il relè del faro: si accende con il faro, ambra, e resta
    const rele = morbido(fra(t, M.faro - 0.05, M.faro + 0.1));
    if (rele > 0) this.tasto(g, X(RELE.x), Y(RELE.y), s, [255, 176, 70], rele * 0.85, 0.7);
    g.restore();
  }

  /** Un tasto illuminato sotto lo schermo, con il suo alone sulla console. */
  private tasto(g: CanvasRenderingContext2D, x: number, y: number, s: number, [r, gr, b]: number[], luce: number, alone: number) {
    g.save();
    g.globalCompositeOperation = "screen";
    const a = g.createRadialGradient(x, y, 0, x, y, 46 * s);
    a.addColorStop(0, `rgba(${r},${gr},${b},${0.42 * luce * alone})`);
    a.addColorStop(0.25, `rgba(${r},${gr},${b},${0.12 * luce * alone})`);
    a.addColorStop(1, `rgba(${r},${gr},${b},0)`);
    g.fillStyle = a;
    g.fillRect(x - 46 * s, y - 46 * s, 92 * s, 92 * s);
    g.globalCompositeOperation = "source-over";
    g.fillStyle = `rgba(${r},${Math.min(255, gr + 60 * luce)},${Math.min(255, b + 40 * luce)},${0.25 + 0.75 * luce})`;
    g.shadowColor = `rgba(${r},${gr},${b},${luce})`;
    g.shadowBlur = 6 * s * luce;
    g.beginPath();
    g.roundRect(x - 5 * s, y - 3.2 * s, 10 * s, 6.4 * s, 1.4 * s);
    g.fill();
    g.restore();
  }

  /** La polvere nell'aria: macchie chiare, larghe e sfocate, che salgono piano. */
  private polvere(g: CanvasRenderingContext2D, t: number, mp: ReturnType<typeof mappa>) {
    const tc = t - C0;
    g.save();
    g.globalCompositeOperation = "screen";
    for (const p of POLVERE) {
      const x = mp.qx + ((((p.x + p.vx * tc) % 1) + 1) % 1) * mp.qw;
      const y = mp.qy + ((((p.y + p.vy * tc + 0.01 * Math.sin(tc * 0.3 + p.fase)) % 1) + 1) % 1) * mp.qh;
      const r = p.raggio * mp.qw;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(230,236,240,${p.luce})`);
      gr.addColorStop(0.6, `rgba(230,236,240,${p.luce * 0.6})`);
      gr.addColorStop(1, "rgba(230,236,240,0)");
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    g.restore();
  }
}
