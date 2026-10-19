// ============================================================================
//  Le diciotto stanze del relitto, come le legge il multiscanner (revisione 25,
//  E1; documento 06, §8). Ognuna dal punto in cui ci si entra, con le misure e
//  le cose che dice il testo del gioco: le tre gole del vestibolo, le teche
//  forzate e il groviglio, i soli del nido, il pilastro che pulsa ancora. Le
//  scene cambiano con lo stato che il ponte manda al suono (la nicchia vuota,
//  la teca dissolta, il pilastro acceso o spento, la mappa sulla cupola…).
//  Disegnate dall'autore del codice su richiesta dell'autore del gioco («genera
//  tu le stanze del relitto usando immaginazione, dettagli presi dalla storia»,
//  19 ottobre 2026). Pure: le prove le leggono in Node.
// ============================================================================
import type { StatiSuono } from "../../../motore/tipi.ts";
import {
  cerchio,
  cerchioDiFronte,
  cilindro,
  cupola,
  disco,
  piano,
  poligono,
  Scena,
  segmento,
  spirale,
  sposta,
  stella,
  suParete,
  suPiano,
  tubo,
  type Camera,
  type Strato,
  type Tono,
  type V3,
} from "./disegno.ts";

export type Stati = Partial<StatiSuono>;

export interface DefStanza {
  /** la frase per il lettore di schermo */
  descrizione: (s: Stati) => string;
  /** gli stati che cambiano il disegno, in una chiave (il disegno si rifà solo quando cambia) */
  chiave: (s: Stati) => string;
  disegna: (s: Stati) => Strato[];
  /** le varianti da vedere nella galleria dello sviluppo e da provare */
  varianti: Record<string, Stati>;
}

const PI = Math.PI;
const FRONTE = PI / 2;
const CAM: Camera = { f: 300, cx: 310, cy: 150, h: 1.6 };
const cam = (o: Partial<Camera> = {}): Camera => ({ ...CAM, ...o });
const fuga = (s: Stati) => s.fuga === "iniziata";
const pinza = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

// ---- i mattoni comuni --------------------------------------------------------------------------------

/** Una stanza tonda: pavimento, parete, volta, con i buchi delle aperture. */
function stanzaTonda(
  sc: Scena,
  o: {
    cz: number;
    R: number;
    h: number;
    volta?: number;
    buco?: (a: number, y: number) => boolean;
    pavimento?: number;
    parete?: number;
    cupola?: number;
    /** sopra quest'altezza la parete si perde nel buio */
    buioDa?: number;
    tono?: Tono;
  },
) {
  const tono = o.tono ?? "vena";
  sc.nuvola(tono, disco(0, 0, o.cz, o.R), o.pavimento ?? 800, { forza: 0.8, righe: 16 });
  const parete = cilindro(0, o.cz, o.R, 0, o.h, -0.5, PI + 0.5);
  sc.nuvola(
    tono,
    (u, v) => {
      const p = parete(u, v);
      const a = -0.5 + (PI + 1) * u;
      return o.buco?.(a, p[1]) ? null : p;
    },
    o.parete ?? 1400,
    { righe: Math.round(o.h * 7), tieni: o.buioDa ? (p) => (p[1] < o.buioDa! ? 1 : pinza(1 - (p[1] - o.buioDa!) / (o.h - o.buioDa!))) : undefined },
  );
  if (o.volta) sc.nuvola(tono, cupola(0, o.h, o.cz, o.R, o.volta), o.cupola ?? 700, { forza: 0.7, righe: 7 });
  sc.linee(tono, [cerchio(0, 0.01, o.cz, o.R, -0.3, PI + 0.3, 80), ...(o.volta ? [cerchio(0, o.h, o.cz, o.R, -0.3, PI + 0.3, 80)] : [])], { forza: 0.4, spessore: 0.8 });
}

/** Le curve di livello su una parete tonda: anelli a più altezze, tratteggiati. */
function livelli(sc: Scena, cz: number, R: number, quote: readonly number[], forza = 0.16) {
  sc.linee("vena", quote.map((y) => cerchio(0, y, cz, R, -0.3, PI + 0.3, 72)), { forza, tratteggio: "1.5 3.5", spessore: 0.7 });
}

/** Un'arcata (una porta, una gola, una nicchia) disegnata sulla parete tonda: larga 2·l, alta h. */
function arcata(cz: number, R: number, a: number, y0: number, l: number, h: number): V3[] {
  const forma: [number, number][] = [[-l, 0], [-l, h - l]];
  for (let i = 0; i <= 16; i++) {
    const t = PI - (PI * i) / 16;
    forma.push([l * Math.cos(t), h - l + l * Math.sin(t)]);
  }
  forma.push([l, 0]);
  return suParete(0, cz, R, a, y0, forma);
}

/** Dentro un'arcata? (s lungo la parete, dall'asse; y dal pavimento) */
function nellArcata(R: number, a0: number, y0: number, l: number, h: number) {
  return (a: number, y: number) => {
    const s = (a0 - a) * R;
    const t = y - y0;
    if (Math.abs(s) > l || t < 0 || t > h) return false;
    if (t < h - l) return true;
    return Math.hypot(s, t - (h - l)) < l;
  };
}

/** Venature: passeggiate che si ramificano su una superficie (s, t) → stanza. */
function venature(sc: Scena, su: (s: number, t: number) => V3, area: { s0: number; s1: number; t0: number; t1: number }, quante: number, passi: number, passo: readonly [number, number] = [0.16, 0.12]): V3[][] {
  const out: V3[][] = [];
  const r = sc.r;
  const [ps, pt] = passo;
  for (let k = 0; k < quante; k++) {
    let s = area.s0 + r() * (area.s1 - area.s0);
    let t = area.t0 + r() * (area.t1 - area.t0);
    let dir = r() * PI * 2;
    const linea: V3[] = [su(s, t)];
    for (let i = 0; i < passi; i++) {
      dir += (r() - 0.5) * 0.9;
      s += Math.cos(dir) * ps;
      t += Math.sin(dir) * pt;
      if (s < area.s0 || s > area.s1 || t < area.t0 || t > area.t1) break;
      linea.push(su(s, t));
      if (r() < 0.12 && linea.length > 2) out.push([linea[linea.length - 2], ...segmentoRamo(su, s, t, dir + (r() < 0.5 ? 1 : -1), r, ps * 0.8, pt * 0.8)]);
    }
    out.push(linea);
  }
  return out;
}

function segmentoRamo(su: (s: number, t: number) => V3, s: number, t: number, dir: number, r: () => number, ps: number, pt: number): V3[] {
  const out: V3[] = [];
  for (let i = 0; i < 4; i++) {
    dir += (r() - 0.5) * 0.8;
    s += Math.cos(dir) * ps;
    t += Math.sin(dir) * pt;
    out.push(su(s, t));
  }
  return out;
}

/** La sagoma di un cilindro verticale visto da davanti: il cerchio di sopra, il mezzo cerchio di sotto, i fianchi. */
function cilindroInPiedi(x: number, z: number, R: number, y0: number, y1: number): V3[][] {
  return [cerchio(x, y1, z, R, 0, PI * 2, 40), cerchio(x, y0, z, R, PI, PI * 2, 24), segmento([x - R, y0, z], [x - R, y1, z], 6), segmento([x + R, y0, z], [x + R, y1, z], 6)];
}

/** Gli spigoli di una scatola. */
function scatola(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): V3[][] {
  const v = (i: number, j: number, k: number): V3 => [i ? x1 : x0, j ? y1 : y0, k ? z1 : z0];
  return [
    [v(0, 0, 0), v(1, 0, 0), v(1, 1, 0), v(0, 1, 0), v(0, 0, 0)],
    [v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1), v(0, 0, 1)],
    [v(0, 0, 0), v(0, 0, 1)],
    [v(1, 0, 0), v(1, 0, 1)],
    [v(1, 1, 0), v(1, 1, 1)],
    [v(0, 1, 0), v(0, 1, 1)],
  ];
}

/** Un ellissoide di punti (un corpo, un bozzolo, una testa). */
const ellissoide = (c: V3, rx: number, ry: number, rz: number) => (u: number, v: number): V3 => {
  const a = u * PI * 2;
  const e = Math.acos(2 * v - 1);
  return [c[0] + rx * Math.sin(e) * Math.cos(a), c[1] + ry * Math.cos(e), c[2] + rz * Math.sin(e) * Math.sin(a)];
};

/** Un filamento del groviglio: dalla base di una teca, sul pavimento, e a volte su nel buio. */
function filamento(r: () => number, da: V3, verso: V3 | null, sale: boolean, lungo = 7): V3[] {
  const out: V3[] = [da];
  let [x, y, z] = da;
  let dir = r() * PI * 2;
  for (let i = 0; i < 26; i++) {
    if (verso) dir = Math.atan2(verso[2] - z, verso[0] - x) + (r() - 0.5) * 0.9;
    else dir += (r() - 0.5) * 0.8;
    const passo = lungo / 26;
    x += Math.cos(dir) * passo;
    z += Math.sin(dir) * passo;
    if (sale && i > 14) y += passo * (0.5 + r() * 0.6);
    else y = 0.05 + Math.abs(Math.sin(i * 0.9 + r())) * 0.12;
    out.push([x, y, z]);
  }
  return out;
}

// ---- le stanze -------------------------------------------------------------------------------------

/** La camera di compensazione: bassa e tonda, la porta interna a ovest con l'incisione del seme sopra. */
function cameraDiCompensazione(s: Stati): Strato[] {
  const sc = new Scena(cam(), 101, [3, 6]);
  const cz = 2.8, R = 3.0;
  const porta = nellArcata(R, FRONTE, 0, 0.55, 1.75);
  stanzaTonda(sc, { cz, R, h: 2.1, volta: 0.55, buco: porta, pavimento: 600, parete: 1500, cupola: 650 });
  livelli(sc, cz, R, [0.55, 1.1, 1.6, 2.05]);
  // la porta interna, nera come lo scafo; aperta, la sala bassa da cui sale il brusio
  const contorno = arcata(cz, R, FRONTE, 0, 0.55, 1.75);
  if (s.porta_interna === "aperta") {
    sc.massa(contorno, 0.5);
    sc.nuvola("vena", piano([-0.9, 0, 9], [1.8, 0, 0], [0, 1.6, 0]), 140, { forza: 0.35 });
    sc.alone([0, 0.8, 7], 1.4, "vena", 0.35);
  } else {
    sc.massa(contorno, 0.35);
  }
  // sopra la porta, l'incisione: una stella da cui parte una linea che finisce in una spirale, come un seme che germoglia
  const y = 1.86;
  const seme: [number, number][] = [...sposta(spirale(1.6, 0.06), 0.16, 0.08), [0.1, 0.08], [0, 0.06], [-0.06, 0.03], [-0.12, 0.02]];
  sc.linea("vivo", suParete(0, cz, R, FRONTE, y, sposta(stella(5, 0.065, 0.028), -0.17, 0.02)), { forza: 0.85, spessore: 1.1 });
  sc.linea("vivo", suParete(0, cz, R, FRONTE, y, seme.reverse()), { forza: 0.85, spessore: 1.1 });
  // il pannello liscio accanto alla porta: sembra morto
  sc.linea("vena", suParete(0, cz, R, FRONTE, 1.0, [[-0.85, 0], [-0.65, 0], [-0.65, 0.3], [-0.85, 0.3], [-0.85, 0]]), { forza: 0.4, tratteggio: "2 2" });
  // il varco nella volta: aperto, la luce gialla del boccaporto; chiuso, una cicatrice
  const anello = cerchio(0, 2.6, cz, 0.5, 0, PI * 2, 40);
  if (s.ingresso === "aperto" || fuga(s)) {
    sc.alone([0, 2.62, cz], 1.0, "caldo", 0.75);
    sc.linea("caldo", anello, { forza: 0.9, spessore: 1.2 });
    sc.nuvola("caldo", (u, v) => [Math.cos(u * 7) * 0.4 * v, 2.6 - v * 1.2, cz + Math.sin(u * 7) * 0.4 * v], 90, { forza: 0.5 });
    if (fuga(s)) sc.linea("osso", [[0.42, 2.58, cz + 0.2], [0.5, 2.1, cz + 0.25], [0.44, 1.6, cz + 0.3], [0.52, 1.25, cz + 0.28]], { forza: 0.7, spessore: 1.2 });
  } else {
    sc.linea("vena", anello, { forza: 0.28, tratteggio: "1 3" });
  }
  return sc.strati;
}

/** Il vestibolo delle gole: le tre bocche, le venature spente, la nicchia del risuonatore. */
function vestibolo(s: Stati): Strato[] {
  const sc = new Scena(cam(), 202, [4, 8]);
  const cz = 4.2, R = 4.4, h = 2.4;
  const aL = FRONTE + 0.3, aM = FRONTE - 0.1, aC = FRONTE - 0.5, aN = FRONTE - 1.2;
  const larga = nellArcata(R, aL, 0, 0.9, 2.2), mezzo = nellArcata(R, aM, 0, 0.6, 1.45), crollata = nellArcata(R, aC, 0, 0.7, 1.8);
  stanzaTonda(sc, { cz, R, h, volta: 0.8, buco: (a, y) => larga(a, y) || mezzo(a, y) || crollata(a, y), pavimento: 900, parete: 1700, cupola: 600 });
  livelli(sc, cz, R, [0.6, 1.2, 1.8, 2.35]);
  // le venature spente, una rete fine sotto la superficie
  const su = (si: number, t: number): V3 => suParete(0, cz, R, FRONTE, 0, [[si, t]])[0];
  sc.linee("vena", venature(sc, su, { s0: -5.5, s1: 5.5, t0: 0.15, t1: 2.3 }, 16, 30), { forza: 0.17, spessore: 0.6 });
  const dentro = (a: number, y: number, k: number, salita: number): V3 => {
    const p = suParete(0, cz, R, a, y, [[0, 0]])[0];
    const dx = Math.cos(a), dz = Math.sin(a);
    return [p[0] + dx * k, p[1] + salita, p[2] + dz * k];
  };
  // la gola larga sale verso ovest, verso una luminescenza azzurrina (crollata, nella fuga)
  const spinaL: V3[] = [dentro(aL, 1.1, 0, 0), dentro(aL, 1.1, 2, 0.6), dentro(aL, 1.1, 4.5, 1.8), dentro(aL, 1.1, 7, 3)];
  sc.linea("vena", arcata(cz, R, aL, 0, 0.9, 2.2), { forza: 0.6 });
  if (fuga(s)) {
    sc.massa(arcata(cz, R, aL, 0, 0.9, 2.2), 0.4);
    sc.linee("vena", Array.from({ length: 9 }, () => Array.from({ length: 7 }, (_, i) => suParete(0, cz, R - 0.1, aL, 0.2 + sc.r() * 1.9, [[-0.85 + i * 0.28, (sc.r() - 0.5) * 0.3]])[0])), { forza: 0.4 });
  } else {
    sc.nuvola("vena", tubo(spinaL, [1.0, 0.9, 0.75, 0.6]), 1100, { forza: 0.8, righe: 14, nel: sc.sagoma(arcata(cz, R, aL, 0, 0.9, 2.2)), tieni: (p) => pinza(1.2 - Math.hypot(p[0], p[2] - 9) / 9) });
    // la luminescenza azzurrina, dentro la bocca
    sc.alone(dentro(aL, 1.45, 1.2, 0.1), 0.9, "vena", 0.6);
  }
  // la gola di mezzo scende: da lì il brusio sale più forte
  const spinaM: V3[] = [dentro(aM, 0.7, 0, 0), dentro(aM, 0.7, 1.4, -0.7), dentro(aM, 0.7, 2.3, -2.1), dentro(aM, 0.7, 2.9, -3.6)];
  sc.linea("vena", arcata(cz, R, aM, 0, 0.6, 1.45), { forza: 0.65 });
  sc.nuvola("vena", tubo(spinaM, [0.62, 0.58, 0.52, 0.48]), 800, { forza: 0.6, righe: 12, nel: sc.sagoma(arcata(cz, R, aM, 0, 0.6, 1.45)) });
  sc.linee("vena", [0.7, 1.05, 1.4].map((k) => suParete(0, cz, R - 0.2, aM, 0.9, Array.from({ length: 13 }, (_, i) => [(i / 12 - 0.5) * k, Math.sin((i / 12) * PI) * 0.25 * k] as [number, number]))), { forza: 0.3, tratteggio: "2 3" });
  // la terza è crollata su se stessa: materia schiacciata, piegata come carta bagnata
  sc.massa(arcata(cz, R, aC, 0, 0.7, 1.8), 0.45);
  sc.linee("vena", Array.from({ length: 8 }, () => Array.from({ length: 6 }, (_, i) => suParete(0, cz, R - 0.05, aC, 0.15 + sc.r() * 1.5, [[-0.65 + i * 0.26, (sc.r() - 0.5) * 0.35]])[0])), { forza: 0.45 });
  // la nicchia all'altezza della mano: il risuonatore, già schedato; staccato, i tuoi tagli
  const nicchia = suParete(0, cz, R, aN, 1.0, [[-0.28, 0], [0.28, 0], [0.28, 0.42], [-0.28, 0.42], [-0.28, 0]]);
  sc.massa(nicchia, 0.6);
  const c = suParete(0, cz, R - 0.12, aN, 1.2, [[0, 0]])[0];
  if (s.risuonatore === "staccato") {
    sc.linee("osso", [-0.12, 0, 0.12].map((k) => suParete(0, cz, R - 0.02, aN, 1.08, [[k - 0.06, 0.24], [k + 0.05, 0.08]])), { forza: 0.8, spessore: 1.1 });
  } else {
    sc.linea("vena", suParete(0, cz, R - 0.12, aN, 1.12, [[-0.2, 0.05], [-0.08, 0.16], [0.1, 0.17], [0.2, 0.08], [0.12, 0.02], [-0.05, 0.03], [-0.2, 0.05]]), { forza: 0.95, spessore: 1.2 });
    sc.linea("vena", suParete(0, cz, R - 0.12, aN, 1.12, [[0.12, 0.02], [0.16, -0.06]]), { forza: 0.95, spessore: 1.2 });
    sc.alone(c, 0.25, "vena", 0.5);
    sc.marca(c, 0.62, 0.48);
  }
  return sc.strati;
}

/** La gola di mezzo: scende a scatti, si stringe e si riallarga; una venatura verde per un palmo. */
function golaDiMezzo(s: Stati): Strato[] {
  const sc = new Scena(cam({ h: 1.9, beccheggio: -0.8, cy: 150 }), 303, [3, 6]);
  const spina: V3[] = [[0, 0.9, 1.5], [0.05, 0.2, 2.1], [0.35, -0.9, 2.7], [-0.25, -2.1, 3.3], [0.3, -3.4, 3.9], [-0.15, -4.8, 4.4], [0.2, -6.4, 4.9]];
  const raggi = [1.2, 0.72, 1.3, 0.78, 1.15, 0.7, 0.9];
  const forma = tubo(spina, raggi);
  const vista = (p: V3) => Math.hypot(p[0], p[1] - 1.9, p[2]);
  sc.nuvola("vena", forma, 3400, { righe: 40, tieni: (p) => (vista(p) < 2 ? 0 : pinza(1.45 - vista(p) / 9)) });
  sc.linee("vena", spina.map((_, i) => Array.from({ length: 33 }, (_, k) => forma(i / (spina.length - 1) - 1e-6 + (i === 0 ? 2e-6 : 0), k / 32))), { forza: 0.22, tratteggio: "1.5 3" });
  // le venature: spente, tranne un palmo che corre verde dove passa il guanto (nella fuga, tutte, di un verde malato)
  const su = (u: number, v: number): V3 => forma(pinza(u, 0, 0.999), ((v % 1) + 1) % 1);
  const vene = venature(sc, su, { s0: 0.02, s1: 0.9, t0: 0, t1: 1 }, 14, 30, [0.012, 0.035]);
  sc.linee(fuga(s) ? "vivo" : "vena", vene, { forza: fuga(s) ? 0.55 : 0.16, spessore: fuga(s) ? 0.9 : 0.6 });
  if (!fuga(s)) {
    const palmo = Array.from({ length: 9 }, (_, i) => su(0.36 + i * 0.01, 0.62 + Math.sin(i) * 0.01));
    sc.linea("vivo", palmo, { forza: 0.95, spessore: 1.3 });
    sc.alone(palmo[4], 0.35, "vivo", 0.6);
  } else {
    sc.alone(spina[2], 2.5, "vivo", 0.3);
  }
  // dal basso sale un freddo diverso, umido
  sc.nuvola("brina", (u, v) => [spina[6][0] + (u - 0.5) * 1.4, spina[6][1] + v * 1.6, spina[6][2] + (v - 0.5) * 0.8], 260, { forza: 0.45 });
  sc.alone(spina[6], 1.6, "brina", 0.25);
  return sc.strati;
}

/** La sala delle teche: file di teche alte il doppio di te, forzate da dentro; il groviglio. */
function salaDelleTeche(s: Stati): Strato[] {
  const basso = s.faro === "basso";
  const sc = new Scena(cam({ h: 2.6, beccheggio: -0.1 }), 404, [6, 14]);
  const portata = basso ? 9 : 24;
  const luce = (p: V3) => pinza(1.3 - p[2] / portata);
  sc.nuvola("vena", piano([-7, 0, 2], [14, 0, 0], [0, 0, 36]), 1700, { tieni: luce, forza: 0.7 });
  const centro: V3 = [0, 0.1, 12];
  const bengala = s.bengala === "acceso";
  const sveglio = fuga(s) || s.groviglio === "desto";
  const aperte: V3[] = [];
  // le file: al centro molte forzate, lungo le pareti chiuse e bianche di brina
  for (const x of [-6.4, -4.1, -1.9, 1.9, 4.1, 6.4]) {
    const parete = Math.abs(x) > 6;
    for (let z = 5.4; z <= 34; z += 3.2) {
      const p: V3 = [x, 0, z + (sc.r() - 0.5) * 0.4];
      const forza = pinza(1.3 - p[2] / portata) * (parete ? 0.75 : 0.65);
      if (forza < 0.06) continue;
      const aperta = !parete && sc.r() < 0.72;
      if (aperta) aperte.push(p);
      const sag = cilindroInPiedi(p[0], p[2], 0.55, 0.05, 3.4);
      if (aperta) {
        // il vetro spinto in fuori da dentro: i fianchi rotti, le schegge piegate verso fuori
        sc.linee("vena", [sag[0], sag[1], segmento([p[0] - 0.55, 0.05, p[2]], [p[0] - 0.55, 1.2, p[2]], 3), segmento([p[0] + 0.55, 2.4, p[2]], [p[0] + 0.55, 3.4, p[2]], 3)], { forza });
        const sx = sc.r() < 0.5 ? -1 : 1;
        sc.linee("vena", [[[p[0] + sx * 0.55, 1.4, p[2]], [p[0] + sx * 0.85, 1.7, p[2] - 0.2], [p[0] + sx * 0.6, 2.0, p[2]]], [[p[0] + sx * 0.55, 2.0, p[2]], [p[0] + sx * 0.95, 2.25, p[2] - 0.3]]], { forza: forza * 1.1 });
      } else {
        sc.linee(parete ? "brina" : "vena", sag, { forza });
        sc.nuvola("brina", cilindro(p[0], p[2], 0.56, 0.1, 3.3, PI, PI * 2), parete ? 90 : 50, { forza: forza * 1.2 });
      }
    }
  }
  // il groviglio: filamenti pallidi, spessi come una fune, sul pavimento e su nel buio
  const fili: V3[][] = [];
  for (const p of aperte) {
    const quanti = sveglio ? 3 : 2;
    for (let k = 0; k < quanti; k++) fili.push(filamento(sc.r, [p[0] + (sc.r() - 0.5) * 0.6, 0.05, p[2]], bengala ? centro : null, !bengala && (sveglio || sc.r() < 0.35), bengala ? 9 : 6));
  }
  const energia = s.energia === "ripristinata" && !fuga(s);
  sc.linee("osso", energia ? fili.map((f) => f.map((q) => [q[0], 0.04, q[2]] as V3)) : fili, { forza: sveglio ? 0.65 : 0.42, spessore: 1.25 });
  sc.puntiLungo("osso", fili, 900, 0.05, { forza: 0.6, tieni: luce });
  if (energia) {
    // il campo regge a tratti: una luce azzurrina lungo le file, e il groviglio giù, come erba
    sc.linee("vena", [-4.1, -1.9, 1.9, 4.1].map((x) => segmento([x, 0.06, 4], [x, 0.06, 34], 20)), { forza: 0.75, spessore: 1.2 });
  }
  if (bengala) {
    sc.alone(centro, 3.2, "rosso", 0.95);
    sc.alone(centro, 0.6, "rosso", 1);
  }
  // in fondo, oltre il groviglio, il passaggio
  sc.massa(suPiano([-0.6, 0, 36], [1, 0, 0], [0, 1, 0], [[0, 0], [1.2, 0], [1.2, 2.2], [0, 2.2]]), 0.3);
  return sc.strati;
}

/** Il vivaio: basso e tiepido, i banchi di semina in file, il germinatoio che lavora ancora. */
function vivaio(_s: Stati): Strato[] {
  const sc = new Scena(cam(), 505, [3.5, 7]);
  const alto = 2.35;
  sc.nuvola("vena", piano([-3.6, 0, 1], [7.2, 0, 0], [0, 0, 9]), 800, { forza: 0.6 });
  sc.nuvola("vena", piano([-3.6, alto, 1], [7.2, 0, 0], [0, 0, 9]), 420, { forza: 0.45 });
  sc.nuvola("vena", piano([-3.6, 0, 1], [0, 0, 9], [0, alto, 0]), 380, { forza: 0.55 });
  sc.nuvola("vena", piano([3.6, 0, 1], [0, 0, 9], [0, alto, 0]), 380, { forza: 0.55 });
  sc.nuvola("vena", piano([-3.6, 0, 10], [7.2, 0, 0], [0, alto, 0]), 300, { forza: 0.5 });
  // i banchi in file ordinate, ognuno sotto la sua lampada spenta; sopra, colonne di simboli
  for (const z of [4.4, 6.4, 8.4]) {
    for (const x of [-2.2, 2.2]) {
      sc.linee("vena", scatola(x - 0.75, 0, z, x + 0.75, 0.9, z + 0.7), { forza: 0.5 });
      sc.nuvola("vena", piano([x - 0.75, 0.9, z], [1.5, 0, 0], [0, 0, 0.7]), 70, { forza: 0.6 });
      sc.linea("vena", cerchio(x, 2.0, z + 0.35, 0.22, PI, PI * 2, 16), { forza: 0.4 });
      sc.linea("vena", cerchio(x, 2.0, z + 0.35, 0.22, 0, PI, 16), { forza: 0.25, tratteggio: "1 2" });
      sc.linea("vena", segmento([x, 2.0, z + 0.35], [x, alto, z + 0.35], 2), { forza: 0.3 });
      sc.linee(
        "vena",
        [0, 1, 2, 3].map((k) => suPiano([x - 0.6 + k * 0.38, 0.75, z], [1, 0, 0], [0, 1, 0], Array.from({ length: 6 }, (_, i) => [0.04 * (i % 2), -i * 0.1] as [number, number]))),
        { forza: 0.35, tratteggio: "0.8 1.6", spessore: 0.6 },
      );
    }
  }
  // al centro il germinatoio: un vassoio di germogli lunghi un dito, sotto un coperchio trasparente
  const g: V3 = [0, 0.95, 5.0];
  sc.linee("vena", scatola(-0.25, 0, 4.75, 0.25, 0.85, 5.25), { forza: 0.45 });
  sc.linee("vena", scatola(-0.45, 0.85, 4.7, 0.45, 0.97, 5.3), { forza: 0.6 });
  sc.linee("vena", [cerchio(0, 0.97, 5.0, 0.42, 0, PI * 2, 32), ...[0.3, 0.6].map((k) => cerchio(0, 0.97 + 0.32 * k, 5.0, 0.42 * Math.sqrt(1 - k * k), 0, PI * 2, 28)), cerchioDiFronte(0, 0.97, 5.0, 0.42, 0, PI, 20)], { forza: 0.4 });
  const germogli = Array.from({ length: 34 }, () => {
    const x = (sc.r() - 0.5) * 0.75, z = 4.75 + sc.r() * 0.5, alt = 0.08 + sc.r() * 0.12, piega = (sc.r() - 0.5) * 0.06;
    return [[x, 0.97, z], [x + piega * 0.4, 0.97 + alt * 0.6, z], [x + piega, 0.97 + alt, z]] as V3[];
  });
  sc.linee("vivo", germogli, { forza: 0.9, spessore: 1 });
  sc.alone(g, 0.8, "vivo", 0.6);
  sc.alone([0, 1.2, 5], 3.2, "caldo", 0.2);
  sc.nuvola("caldo", piano([-3.4, 0.05, 2], [6.8, 0, 0], [0, 0, 7]), 160, { forza: 0.35 });
  return sc.strati;
}

/** La gola del ritorno: ripida, nera, trema; il faro apre un metro alla volta; la polvere cade. */
function golaDelRitorno(_s: Stati): Strato[] {
  const sc = new Scena(cam({ h: 1.9, beccheggio: -0.9, cy: 150 }), 606, [3, 5.5]);
  const spina: V3[] = [[0, 0.9, 1.4], [0.1, -0.8, 1.9], [-0.12, -2.6, 2.4], [0.18, -4.4, 2.8], [0, -6.3, 3.2], [-0.4, -7.9, 3.8], [-1.6, -8.9, 4.5]];
  const forma = tubo(spina, [0.95, 0.82, 0.88, 0.72, 0.8, 0.78, 0.9]);
  const vista = (p: V3) => Math.hypot(p[0], p[1] - 1.9, p[2]);
  const faro = (p: V3) => (vista(p) < 1.3 ? 0 : pinza(1.5 * Math.exp(-vista(p) / 5)));
  sc.nuvola("vena", forma, 3200, { tieni: faro, righe: 44 });
  const su = (u: number, v: number): V3 => forma(pinza(u, 0, 0.999), ((v % 1) + 1) % 1);
  sc.linee("vena", venature(sc, su, { s0: 0.02, s1: 0.7, t0: 0, t1: 1 }, 12, 28, [0.012, 0.035]), { forza: 0.13, spessore: 0.6 });
  // la polvere fine che cade dalle pareti
  const polvere = Array.from({ length: 46 }, () => {
    const k = 0.12 + sc.r() * 0.4;
    const c = su(k, sc.r());
    const x = c[0] * 0.6, z = c[2], y = c[1];
    return segmento([x, y, z], [x, y - 0.06 - sc.r() * 0.1, z], 2);
  });
  sc.linee("osso", polvere, { forza: 0.45, spessore: 0.8 });
  sc.nuvola("osso", (u, v) => su(u * 0.6, v), 220, { forza: 0.4 });
  // in fondo, a ovest, il fruscio del groviglio
  sc.linee("osso", Array.from({ length: 5 }, () => filamento(sc.r, [-1.8 + sc.r() * 0.4, -8.8, 4.6 + sc.r() * 0.3], null, false, 1.4)), { forza: 0.28, spessore: 1.2 });
  return sc.strati;
}

/** Il corridoio principale: immenso, le pareti che fanno luce; in fondo la Grande Porta con il diagramma di stelle. */
function corridoio(s: Stati): Strato[] {
  const sc = new Scena(cam({ beccheggio: 0.1, cy: 158 }), 707, [8, 20]);
  const profilo: [number, number][] = [[4.5, 0], [4.65, 1.5], [4.6, 3], [4.3, 4.5], [3.8, 6], [3.2, 7.5], [2.4, 9], [1.5, 10.5], [0.6, 12]];
  const fine = 34;
  const varco = (lato: number, y: number, z: number) => (Math.abs(z - 13) < 1.2 && y < 3.2) || (lato > 0 && z > 4.8 && z < 6.2 && y < 2.4);
  for (const lato of [-1, 1]) {
    sc.nuvola(
      "vena",
      (u, v) => {
        const k = v * (profilo.length - 1);
        const i = Math.min(profilo.length - 2, Math.floor(k));
        const t = k - i;
        const x = (profilo[i][0] + (profilo[i + 1][0] - profilo[i][0]) * t) * lato;
        const y = profilo[i][1] + (profilo[i + 1][1] - profilo[i][1]) * t;
        const z = 1 + u * (fine - 1);
        return varco(lato, y, z) ? null : [x, y, z];
      },
      3600,
      { tieni: (p) => (p[1] < 5 ? 1 : pinza(1 - (p[1] - 5) / 7)) },
    );
    // le costole della volta e la trama fine, come d'osso
    sc.linee("vena", [6, 11, 16, 21, 26, 31].map((z) => profilo.map(([x, y]) => [x * lato, y, z] as V3)), { forza: 0.18, spessore: 0.7 });
    sc.linee("vena", [1, 2.5, 4].map((y) => segmento([4.6 * lato, y, 1], [4.6 * lato, y, fine], 30)), { forza: 0.14, tratteggio: "1 3", spessore: 0.6 });
    for (const z of [4, 10, 18, 27]) sc.alone([4.3 * lato, 1.6, z], 2.6, "vena", 0.12);
  }
  sc.nuvola("vena", piano([-4.5, 0, 1], [9, 0, 0], [0, 0, fine - 1]), 1500, { forza: 0.6 });
  // a nord e a sud i due passaggi; il montacarichi; la porta socchiusa a nordest
  for (const lato of [-1, 1]) sc.massa(suPiano([4.55 * lato, 0, 11.8], [0, 0, 1], [0, 1, 0], [[0, 0], [2.4, 0], [2.4, 2.4], [1.2, 3.2], [0, 2.4]]), 0.5);
  sc.massa([[-1, 0.01, 15.5], [1, 0.01, 15.5], [1, 0.01, 17.5], [-1, 0.01, 17.5]], 0.6);
  sc.linee("vena", [-0.8, 0, 0.8].map((x) => segmento([x, 0.01, 16.5], [x, -2.5, 16.5], 4)), { forza: 0.25, tratteggio: "1 2" });
  sc.massa(suPiano([4.6, 0, 4.9], [0, 0, 1], [0, 1, 0], [[0, 0], [1.2, 0], [1.2, 2.3], [0, 2.3]]), 0.45);
  sc.linea("vena", segmento([4.58, 0.05, 5.45], [4.58, 2.25, 5.45], 6), { forza: 0.85, spessore: 1.4 });
  // in fondo la Grande Porta, su una parete più scura: il diagramma di stelle e tre incavi per tre chiavi
  sc.nuvola("vena", piano([-4.5, 0, fine], [9, 0, 0], [0, 9, 0]), 500, { forza: 0.3, tieni: (p) => (Math.hypot(p[0], p[1] - 3.4) < 3.3 ? 0 : 0.6) });
  const porta = cerchioDiFronte(0, 3.4, fine - 0.05, 3.2, 0, PI * 2, 72);
  if (s.grande_porta === "aperta") {
    sc.massa(porta, 0.7);
    sc.linee("vena", [-1, 1].map((l) => segmento([l * 2.6, 0.2, fine], [l * 1.1, 1.0, fine + 14], 10)), { forza: 0.3 });
    sc.alone([0, 2.2, fine + 12], 3, "vena", 0.35);
  } else {
    sc.massa(porta, 0.65);
    sc.linea("vena", suPiano([0, 3.4, fine - 0.06], [1, 0, 0], [0, 1, 0], stella(8, 2.3, 0.85)), { forza: 0.7, spessore: 1.1 });
    sc.linee("vena", [cerchioDiFronte(0, 3.4, fine - 0.06, 0.55), cerchioDiFronte(0, 3.4, fine - 0.06, 2.75, 0, PI * 2, 64)], { forza: 0.4 });
    const incavi: V3[][] = [
      suPiano([-1.0, 0.75, fine - 0.06], [1, 0, 0], [0, 1, 0], poligono(24, 0.2).map(([x, y]) => [x * 0.75, y * 1.1] as [number, number])),
      suPiano([0, 0.75, fine - 0.06], [1, 0, 0], [0, 1, 0], [[-0.3, -0.08], [0.3, -0.08], [0.3, 0.08], [-0.3, 0.08], [-0.3, -0.08]]),
      suPiano([1.0, 0.75, fine - 0.06], [1, 0, 0], [0, 1, 0], [[0, 0.25], [0.17, 0.1], [0.14, -0.15], [0, -0.25], [-0.14, -0.15], [-0.17, 0.1], [0, 0.25], [0, -0.25]]),
    ];
    sc.linee("vena", incavi, { forza: 0.85, spessore: 1.1 });
  }
  // accanto all'imbocco, alla base della parete, le tacche di qualcuno che segnava i posti già visti
  const tacche = s.tacche === "segnata" ? 4 : 3;
  sc.linee("osso", Array.from({ length: tacche }, (_, i) => segmento([-4.45, 0.22 + i * 0.075, 7.2], [-4.45, 0.22 + i * 0.075, 7.55], 2)), { forza: 0.95, spessore: 1.3 });
  sc.alone([-4.45, 0.33, 7.4], 0.4, "osso", 0.25);
  return sc.strati;
}

/** Il laboratorio di risonanza: bobine, cristalli di focalizzazione, il vano vuoto, il banco che pulsa. */
function laboratorio(s: Stati): Strato[] {
  const sc = new Scena(cam({ beccheggio: 0.06 }), 808, [4.5, 9]);
  const vivo = s.energia === "ripristinata";
  sc.nuvola("vena", piano([-6, 0, 1.5], [12, 0, 0], [0, 0, 11]), 1000, { forza: 0.6 });
  sc.nuvola("vena", piano([-6, 0, 12.5], [12, 0, 0], [0, 4.6, 0]), 650, { forza: 0.55 });
  sc.nuvola("vena", piano([-6, 0, 1.5], [0, 0, 11], [0, 4.6, 0]), 450, { forza: 0.5 });
  sc.nuvola("vena", piano([6, 0, 1.5], [0, 0, 11], [0, 4.6, 0]), 450, { forza: 0.5 });
  sc.linee("vena", [3.6, 4.1].map((y) => segmento([-6, y, 12.4], [6, y, 12.4], 12)), { forza: 0.25, spessore: 1.6 });
  // le bobine
  for (const [x, z] of [[-3.4, 8.2], [3.4, 8.6]] as const) {
    sc.linea("vena", Array.from({ length: 200 }, (_, i) => [x + 0.8 * Math.cos(i * 0.28), 0.4 + i * 0.016, z + 0.8 * Math.sin(i * 0.28)] as V3), { forza: vivo ? 0.8 : 0.55, spessore: 0.8 });
    sc.linee("vena", cilindroInPiedi(x, z, 0.95, 0, 0.4), { forza: 0.5 });
    sc.linee("vena", cilindroInPiedi(x, z, 0.5, 3.6, 4.0), { forza: 0.45 });
  }
  // i cristalli di focalizzazione, puntati sul vano vuoto al centro
  const centro: V3 = [0, 1.25, 7.2];
  for (const a of [PI * 0.15, PI * 0.42, PI * 0.58, PI * 0.85]) {
    const b: V3 = [Math.cos(a) * 2.1, 0, 7.2 + Math.sin(a) * 1.3];
    const c: V3 = [b[0], 1.8, b[2]];
    const verso = [(centro[0] - c[0]) * 0.18, 0.12, (centro[2] - c[2]) * 0.18];
    const punta: V3 = [c[0] + verso[0], c[1] + verso[1] + 0.35, c[2] + verso[2]];
    const giu: V3 = [c[0], c[1] - 0.35, c[2]];
    const fianchi: V3[] = [[c[0] - 0.14, c[1], c[2]], [c[0], c[1], c[2] - 0.14], [c[0] + 0.14, c[1], c[2]], [c[0], c[1], c[2] + 0.14]];
    sc.linee("vena", [...fianchi.map((f) => [punta, f, giu]), [...fianchi, fianchi[0]]], { forza: 0.75 });
    sc.linea("vena", segmento(b, giu, 4), { forza: 0.35 });
  }
  // il generatore: il vano di alimentazione è vuoto, ci starebbe un cristallo
  sc.linee("vena", cilindroInPiedi(0, 7.2, 0.7, 0, 1.05), { forza: 0.55 });
  sc.linea("vena", [[0, 1.05, 7.2], [0.12, 1.25, 7.2], [0, 1.5, 7.2], [-0.12, 1.25, 7.2], [0, 1.05, 7.2]], { forza: 0.8, tratteggio: "2 2" });
  sc.marca([0, 1.27, 7.2], 0.5, 0.6);
  // il banco ingombro di schemi, e qualcosa che pulsa di una luce irregolare
  sc.linee("vena", scatola(-3.3, 0, 3.4, -1.4, 0.95, 4.2), { forza: 0.5 });
  sc.linee(
    "vena",
    Array.from({ length: 9 }, () => {
      const x = -3.2 + sc.r() * 1.6, z = 3.5 + sc.r() * 0.6, l = 0.12 + sc.r() * 0.3;
      return [[x, 0.96, z], [x + l, 0.96, z], [x + l, 0.96, z + 0.12], [x, 0.96, z + 0.12], [x, 0.96, z]] as V3[];
    }),
    { forza: 0.4, spessore: 0.6 },
  );
  const pulsa: V3 = [-1.85, 1.02, 3.75];
  sc.linee("vena", scatola(-2.0, 0.95, 3.65, -1.7, 1.08, 3.85), { forza: 0.8 });
  sc.alone(pulsa, 0.35, "caldo", 0.85);
  sc.marca(pulsa, 0.45, 0.3);
  if (vivo) {
    // archi di elettricità fra le bobine, i monitor accesi
    const arco = (a: V3, b: V3) => Array.from({ length: 14 }, (_, i) => {
      const t = i / 13;
      return [a[0] + (b[0] - a[0]) * t + (i % 13 ? (sc.r() - 0.5) * 0.4 : 0), a[1] + (b[1] - a[1]) * t + Math.sin(t * PI) * 0.6 + (i % 13 ? (sc.r() - 0.5) * 0.3 : 0), a[2] + (b[2] - a[2]) * t] as V3;
    });
    sc.linee("brina", [arco([-3.4, 3.6, 8.2], [3.4, 3.6, 8.6]), arco([-3.4, 3.2, 8.2], centro), arco([3.4, 3.3, 8.6], centro)], { forza: 0.9, spessore: 1.1 });
    sc.alone([0, 3.4, 8.4], 2.5, "brina", 0.3);
    sc.linee("vena", [-4, -1.5, 1.5].map((x) => suPiano([x, 1.6, 12.38], [1, 0, 0], [0, 1, 0], [[0, 0], [1.8, 0], [1.8, 1.0], [0, 1.0], [0, 0]])), { forza: 0.8 });
  }
  // l'aria è carica di statica: il multiscanner crepita di interferenze
  let d = "";
  for (let i = 0; i < 11; i++) {
    const y = 20 + sc.r() * 260, x = sc.r() * 540, l = 30 + sc.r() * 160;
    d += `M${x.toFixed(1)} ${y.toFixed(1)}h${l.toFixed(1)}m${(4 + sc.r() * 10).toFixed(1)} 0h${(sc.r() * 40).toFixed(1)}`;
  }
  sc.segno("vena", d, { forza: vivo ? 0.2 : 0.32, spessore: 0.7 });
  return sc.strati;
}

/** La serra morente: la cupola, le colonne spente, le felci scheletriche, la teca che brilla, l'uomo in tuta. */
function serra(s: Stati): Strato[] {
  const sc = new Scena(cam({ beccheggio: 0.16, cy: 160 }), 909, [6, 11]);
  const cz = 9.4, R = 9;
  sc.nuvola("vena", disco(0, 0, cz, R), 1100, { forza: 0.6 });
  sc.nuvola("vena", cupola(0, 0, cz, R, 8), 2000, { forza: 0.7, tieni: (p) => (p[2] < 1 ? 0 : 1) });
  sc.linee("vena", [...Array.from({ length: 14 }, (_, k) => Array.from({ length: 13 }, (_, i) => {
    const t = i / 12, a = (k / 14) * PI * 2;
    const r = R * Math.cos((t * PI) / 2);
    return [r * Math.cos(a), 8 * Math.sin((t * PI) / 2), cz + r * Math.sin(a)] as V3;
  })), ...[2, 4.5, 6.5].map((y) => cerchio(0, y, cz, R * Math.sqrt(1 - (y / 8) ** 2), 0, PI * 2, 64))], { forza: 0.15, spessore: 0.6 });
  // le colonne spente che reggono la cupola
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * PI * 2 + 0.2;
    const x = Math.cos(a) * 6.3, z = cz + Math.sin(a) * 6.3;
    if (z < 1.5) continue;
    const top = 8 * Math.sqrt(1 - (6.3 / R) ** 2);
    sc.linee("vena", [segmento([x - 0.25, 0, z], [x - 0.25, top, z], 6), segmento([x + 0.25, 0, z], [x + 0.25, top, z], 6)], { forza: 0.42 });
  }
  // la colonna vicina alla luce, l'uomo seduto contro la sua base
  const col: V3 = [-0.9, 0, cz - 0.6];
  sc.linee("vena", [segmento([col[0] - 0.2, 0, col[2]], [col[0] - 0.2, 8, col[2]], 8), segmento([col[0] + 0.2, 0, col[2]], [col[0] + 0.2, 8, col[2]], 8)], { forza: 0.5 });
  const uomo: V3 = [col[0] + 0.15, 0, col[2] - 0.35];
  sc.nuvola("osso", ellissoide([uomo[0], 0.82, uomo[2] - 0.1], 0.17, 0.17, 0.17), 160, { forza: 0.85 });
  sc.nuvola("osso", ellissoide([uomo[0], 0.48, uomo[2]], 0.2, 0.3, 0.14), 220, { forza: 0.75 });
  sc.nuvola("osso", (u, v) => [uomo[0] + (u < 0.5 ? -0.1 : 0.1) + (v - 0.5) * 0.05, 0.12, uomo[2] - 0.2 - ((u * 2) % 1) * 0.9], 140, { forza: 0.7 });
  sc.linea("osso", cerchioDiFronte(uomo[0], 0.82, uomo[2] - 0.12, 0.18, 0, PI * 2, 24), { forza: 0.6 });
  // al centro la teca: dentro, sospeso, il seme che pulsa di una luce verde gentile (svuotata: niente)
  const teca: V3 = [0.15, 0, cz - 0.9];
  sc.linee("vena", cilindroInPiedi(teca[0], teca[2], 0.35, 0, 0.5), { forza: 0.55 });
  if (s.teca === "svuotata") {
    sc.linee("vena", cilindroInPiedi(teca[0], teca[2], 0.22, 0.5, 1.45), { forza: 0.3, tratteggio: "1 3" });
  } else {
    sc.linee("vena", cilindroInPiedi(teca[0], teca[2], 0.22, 0.5, 1.45), { forza: 0.7 });
    sc.alone([teca[0], 1.0, teca[2]], 3.6, "vivo", 0.28);
    sc.alone([teca[0], 1.0, teca[2]], 0.6, "vivo", 0.95);
    sc.nuvola("vivo", ellissoide([teca[0], 1.0, teca[2]], 0.06, 0.08, 0.06), 60, { forza: 1 });
    sc.marca([teca[0], 0.98, teca[2]], 0.7, 1.15);
  }
  // le felci scheletriche e i funghi contorti, appesi alle pareti
  const felce = (x0: number, y0: number, l: number): [number, number][][] => {
    const out: [number, number][][] = [[[x0, y0], [x0 + l * 0.1, y0 - l]]];
    for (let i = 1; i < 9; i++) {
      const t = i / 9, x = x0 + l * 0.1 * t, y = y0 - l * t, f = (1 - t) * l * 0.35;
      out.push([[x, y], [x - f, y + f * 0.4]], [[x, y], [x + f, y + f * 0.4]]);
    }
    return out;
  };
  for (let k = 0; k < 12; k++) {
    const a = FRONTE + (k - 5.5) * 0.22 + (sc.r() - 0.5) * 0.12;
    const y = 3.4 + sc.r() * 2.6;
    const rr = R * Math.sqrt(1 - (y / 8) ** 2) - 0.1;
    sc.linee("osso", felce(0, 0, 1.4 + sc.r()).map((f) => suParete(0, cz, rr, a, y, f)), { forza: 0.35, spessore: 0.7 });
  }
  for (let k = 0; k < 7; k++) {
    const a = FRONTE + (k - 3) * 0.4 + 0.1;
    const y = 0.8 + sc.r() * 1.6;
    sc.linee("osso", [suParete(0, cz, R - 0.15, a, y, [[0, 0], [0.12, 0.25], [0.05, 0.5]]), suParete(0, cz, R - 0.15, a, y + 0.5, Array.from({ length: 9 }, (_, i) => [0.05 + 0.18 * Math.cos(PI - (PI * i) / 8), 0.08 * Math.sin((PI * i) / 8)] as [number, number]))], { forza: 0.32, spessore: 0.7 });
  }
  // la polvere, come neve grigia
  sc.nuvola("osso", (u, v) => [(u - 0.5) * 14, v * 6, 2.5 + sc.r() * 12], 900, { forza: 0.22 });
  return sc.strati;
}

/** L'arca biologica: lunga e gelida, file di capsule di stasi oltre la portata del faro, la brina. */
function arcaBiologica(_s: Stati): Strato[] {
  const sc = new Scena(cam(), 1010, [6, 13]);
  const portata = (p: V3) => pinza(1.35 - p[2] / 20);
  sc.nuvola("brina", piano([-6.5, 0, 2], [13, 0, 0], [0, 0, 50]), 1500, { forza: 0.6, tieni: portata });
  sc.nuvola("vena", piano([-6.5, 5, 2], [13, 0, 0], [0, 0, 50]), 500, { forza: 0.35, tieni: portata });
  for (const x of [-5.4, -3.4, 3.4, 5.4]) {
    for (const y0 of Math.abs(x) > 5 ? [0.1, 2.5] : [0.1]) {
      for (let z = 3.2; z <= 52; z += 1.5) {
        const f = pinza(1.3 - z / 22);
        if (f < 0.05) continue;
        const caps: V3[] = suPiano([x, y0, z], [0, 0, 1], [0, 1, 0], [
          [-0.45, 0.15], [-0.45, 1.85], [-0.3, 2.05], [0.3, 2.05], [0.45, 1.85], [0.45, 0.15], [0.3, 0], [-0.3, 0], [-0.45, 0.15],
        ]);
        sc.massa(caps, 0);
        sc.linea("brina", caps, { forza: 0.55 * f });
        if (z < 16) sc.nuvola("brina", piano([x, y0 + 0.1, z - 0.4], [0, 0, 0.8], [0, 1.9, 0]), 30, { forza: 0.8 * f });
      }
    }
  }
  sc.alone([0, 1, 8], 4, "brina", 0.12);
  // il respiro che si condensa sul vetro del casco
  sc.strati.push({ tipo: "alone", x: 120, y: 300, r: 170, tono: "brina", forza: 0.16 }, { tipo: "alone", x: 500, y: 300, r: 170, tono: "brina", forza: 0.16 });
  return sc.strati;
}

/** Il santuario del silenzio: la luce che sale dal pavimento, i bassorilievi dei tre soli, l'altare nero. */
function santuarioDelSilenzio(s: Stati): Strato[] {
  const sc = new Scena(cam({ beccheggio: 0.1, cy: 150 }), 1111, [5, 10]);
  const cz = 7.2, R = 7;
  sc.nuvola("vena", cilindro(0, cz, R, 0, 15, -0.4, PI + 0.4), 3000, { righe: 60, tieni: (p) => (p[1] < 6 ? 1 : pinza(1 - (p[1] - 6) / 7)) });
  // le fasce dei bassorilievi sulla parete
  sc.linee("vena", [0.75, 2.45, 3.0, 5.25, 5.5, 7.9].map((y) => suParete(0, cz, R - 0.03, FRONTE, y, Array.from({ length: 25 }, (_, i) => [-5 + i * (10 / 24), 0] as [number, number]))), { forza: 0.22, spessore: 0.7 });
  // il pavimento: disegni geometrici da cui sale una luce bianca e fredda
  sc.linee("brina", [1.4, 2.8, 4.2, 5.6, 6.8].map((r) => suPiano([0, 0.01, cz], [1, 0, 0], [0, 0, 1], poligono(8, r, PI / 8))), { forza: 0.5 });
  sc.linee("brina", Array.from({ length: 16 }, (_, k) => segmento([0, 0.01, cz], [Math.cos((k / 16) * PI * 2) * 6.8, 0.01, cz + Math.sin((k / 16) * PI * 2) * 6.8], 8)), { forza: 0.3 });
  sc.linea("brina", suPiano([0, 0.01, cz], [1, 0, 0], [0, 0, 1], stella(8, 4.2, 2.1, 0)), { forza: 0.55 });
  sc.alone([0, 0.2, cz], 6, "brina", 0.18);
  // i bassorilievi, da terra fino al buio: le creature alte e sottili, i tre soli, i semi di luce, le navi in partenza
  const figura = (s0: number): [number, number][][] => [
    [[s0, 0], [s0 + 0.02, 1.15]],
    sposta(poligono(10, 0.07), s0 + 0.02, 1.25),
    [[s0 - 0.18, 0.55], [s0 + 0.01, 0.95], [s0 + 0.2, 0.55]],
    [[s0 - 0.08, 0], [s0, 0.4], [s0 + 0.09, 0]],
  ];
  sc.linee("vena", Array.from({ length: 15 }, (_, i) => figura(-4.6 + i * 0.66)).flat().map((f) => suParete(0, cz, R - 0.05, FRONTE, 0.9, f)), { forza: 0.5, spessore: 0.8 });
  sc.linee("caldo", [sposta(poligono(20, 0.42), 0, 4.7), sposta(poligono(18, 0.3), -0.95, 3.85), sposta(poligono(16, 0.24), 0.9, 3.85)].map((f) => suParete(0, cz, R - 0.05, FRONTE, 0, f)), { forza: 0.6 });
  sc.linea("vena", suParete(0, cz, R - 0.05, FRONTE, 0, Array.from({ length: 21 }, (_, i) => [-3.4 + i * 0.34, 3.1 + Math.sin(i * 0.5) * 0.06] as [number, number])), { forza: 0.4 });
  sc.linee("vena", Array.from({ length: 9 }, (_, i) => figura(-2.8 + i * 0.7).map((f) => sposta(f, 0, 0, 0.55))).flat().map((f) => suParete(0, cz, R - 0.05, FRONTE, 3.1, f)), { forza: 0.35, spessore: 0.7 });
  sc.linee("vivo", Array.from({ length: 7 }, (_, i) => {
    const sx = -3.9 + i * 0.32;
    return [[sx, 3.25], [sx, 3.38]] as [number, number][];
  }).map((f) => suParete(0, cz, R - 0.05, FRONTE - 0.75, 0, f)), { forza: 0.6, spessore: 1.2 });
  sc.linee("vivo", [sposta(poligono(6, 0.05), 0, 0)].flatMap(() => Array.from({ length: 7 }, (_, i) => sposta(poligono(6, 0.05), -3.9 + i * 0.32, 3.45))).map((f) => suParete(0, cz, R - 0.05, FRONTE - 0.75, 0, f)), { forza: 0.7 });
  const nave = (s0: number, t0: number, k: number): [number, number][] => [[s0, t0], [s0 + 0.18 * k, t0 + 0.5 * k], [s0, t0 + 1.4 * k], [s0 - 0.18 * k, t0 + 0.5 * k], [s0, t0]];
  sc.linee("vena", [nave(-2.2, 5.6, 1), nave(-0.6, 6.0, 1.2), nave(1.4, 5.7, 0.9), nave(2.8, 6.2, 0.7)].map((f) => suParete(0, cz, R - 0.05, FRONTE, 0, f)), { forza: 0.42 });
  sc.linee("vena", [[-2.2, 5.6], [-0.6, 6.0], [1.4, 5.7], [2.8, 6.2]].map(([s0, t0]) => suParete(0, cz, R - 0.05, FRONTE, 0, [[s0, t0 - 0.1], [s0 + 0.05, t0 - 0.9]])), { forza: 0.25, tratteggio: "1 2" });
  // al centro il blocco cilindrico di pietra nera, l'incavo tondo con la tacca
  const a: V3 = [0, 0, cz - 0.5];
  sc.massa([...cerchio(a[0], 1.1, a[2], 0.62, 0, PI, 20), ...cerchio(a[0], 0, a[2], 0.62, PI, PI * 2, 20)], 0.4);
  sc.linee("vena", [cerchio(a[0], 1.1, a[2], 0.62, 0, PI * 2, 40), cerchio(a[0], 1.1, a[2], 0.16, 0, PI * 2, 24), segmento([a[0], 1.1, a[2] + 0.16], [a[0], 1.1, a[2] + 0.26], 2)], { forza: 0.7 });
  if (s.altare === "schiuso") {
    sc.massa(suPiano([a[0] - 0.22, 0.4, a[2] - 0.62], [1, 0, 0], [0, 1, 0], [[0, 0], [0.44, 0], [0.44, 0.4], [0, 0.4]]), 0.8);
    sc.alone([a[0], 0.6, a[2] - 0.6], 0.4, "caldo", 0.6);
  }
  return sc.strati;
}

/** Lo scriptorium: le nicchie, i globi di testo a mezz'aria, la lastra inclinata, il proiettore spento. */
function scriptorium(s: Stati): Strato[] {
  const sc = new Scena(cam({ beccheggio: 0.08 }), 1212, [4, 8]);
  const cz = 6, R = 5.8;
  sc.nuvola("vena", disco(0, 0, cz, R), 800, { forza: 0.55 });
  sc.nuvola("vena", cilindro(0, cz, R, 0, 5.5, -0.4, PI + 0.4), 1700, { tieni: (p) => (p[1] < 3.8 ? 1 : pinza(1 - (p[1] - 3.8) / 2.5)) });
  const nicchie = Array.from({ length: 9 }, (_, i) => FRONTE - 1.32 + i * 0.33);
  const rotto = nicchie[1];
  for (const a of nicchie) {
    const arco = arcata(cz, R, a, 0.5, 0.42, 1.6);
    sc.massa(arco, 0.45);
    if (a === rotto) {
      // il proiettore che fa solo scintille: nel meccanismo, il disco di pietra
      if (s.disco !== "staccato") {
        const c = suParete(0, cz, R - 0.15, a, 1.2, [[0, 0]])[0];
        sc.linea("vena", suParete(0, cz, R - 0.12, a, 1.2, poligono(20, 0.2)), { forza: 0.6 });
        sc.linee("caldo", [[[-0.05, 0.03], [0.04, -0.03]], [[0.06, 0.05], [0.12, 0.09]], [[-0.1, -0.06], [-0.15, -0.1]]].map((f) => suParete(0, cz, R - 0.13, a, 1.55, f as [number, number][])), { forza: 0.9 });
        sc.marca(c, 0.5, 0.5);
      }
      continue;
    }
    const g = suParete(0, cz, R - 0.7, a, 2.75, [[0, 0]])[0];
    const q = sc.pr(g);
    if (!q) continue;
    const r = Math.abs((sc.pr([g[0] + 0.42, g[1], g[2]])?.x ?? q.x + 10) - q.x);
    // il globo: la sagoma, e il testo alieno lungo i paralleli, come un nastro che gira
    let d = `M${(q.x - r).toFixed(1)} ${q.y.toFixed(1)}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`;
    sc.segno("vena", d, { forza: 0.55, spessore: 0.8 });
    d = "";
    for (const k of [-0.55, -0.2, 0.2, 0.55]) {
      const rr = r * Math.sqrt(1 - k * k), y = q.y + k * r;
      d += `M${(q.x - rr).toFixed(1)} ${y.toFixed(1)}a${rr.toFixed(1)} ${(rr * 0.28).toFixed(1)} 0 1 0 ${(2 * rr).toFixed(1)} 0`;
    }
    sc.segno("vena", d, { forza: 0.8, spessore: 0.9, tratteggio: "1.2 1.6 3 1.6" });
    sc.strati.push({ tipo: "alone", x: q.x, y: q.y, r: r * 2.2, tono: "vena", forza: 0.32 });
  }
  // al centro la lastra scura e inclinata; incise, le righe di una firma; l'ultimo glifo parte e non torna
  const o: V3 = [-0.95, 0.95, 4.6];
  const ex: V3 = [1, 0, 0], ey: V3 = [0, 0.38, 0.92];
  sc.linee("vena", scatola(-0.5, 0, 4.7, 0.5, 0.92, 5.3), { forza: 0.35 });
  sc.massa(suPiano(o, ex, ey, [[0, 0], [1.9, 0], [1.9, 0.95], [0, 0.95]]), 0.6);
  sc.linee("vena", Array.from({ length: 5 }, (_, i) => {
    const t = 0.78 - i * 0.15;
    const segni: [number, number][][] = [];
    for (let x = 0.15; x < 1.7; x += 0.09 + sc.r() * 0.06) segni.push([[x, t], [x + 0.04, t + 0.05 * (sc.r() - 0.3)]]);
    return segni.map((f) => suPiano(o, ex, ey, f));
  }).flat(), { forza: 0.7, spessore: 0.8 });
  sc.linea("vena", suPiano(o, ex, ey, [[0.2, 0.16], [0.9, 0.15], [1.5, 0.12], [1.9, 0.08], [2.2, 0.05]]), { forza: 0.7 });
  // gli utensili dalle punte di misure diverse, in ordine
  sc.linee("osso", Array.from({ length: 6 }, (_, i) => suPiano([-0.6 + i * 0.2, 0.96, 4.5], [0, 0, -1], [0, 1, 0], [[0, 0], [0.1 + i * 0.03, 0]])), { forza: 0.75, spessore: 1.1 });
  return sc.strati;
}

/** L'arca della memoria: la caverna di cristallo nero, i pilastri spenti e incrinati, l'ultimo che pulsa d'ambra. */
function arcaDellaMemoria(s: Stati): Strato[] {
  const sc = new Scena(cam({ beccheggio: 0.18, cy: 168 }), 1313, [8, 16]);
  const archivio = s.archivio ?? "intatto";
  sc.nuvola("vena", piano([-11, 0, 2], [22, 0, 0], [0, 0, 34]), 1100, { forza: 0.5 });
  const pilastro = (x: number, z: number, r: number, forza: number, tono: Tono, crepe: boolean) => {
    const esa = poligono(6, r, 0.3).map(([a, b]) => [x + a, z + b] as const);
    sc.linee(tono, [esa.map(([a, b]) => [a, 0, b] as V3), ...esa.slice(0, 6).map(([a, b]) => segmento([a, 0, b], [a, 12, b], 8))], { forza });
    sc.nuvola(tono, cilindro(x, z, r, 0, 12, 0, PI * 2), tono === "caldo" ? 420 : 70, { forza, tieni: (p) => (p[1] < 6 ? 1 : pinza(1 - (p[1] - 6) / 6)) });
    if (crepe) sc.linee(tono, [Array.from({ length: 8 }, (_, i) => [x - r * 0.4 + (i % 2) * 0.25, 0.8 + i * 0.6 + sc.r() * 0.2, z - r] as V3)], { forza: forza * 1.3, spessore: 0.8 });
  };
  for (const z of [6, 11, 16, 21, 26]) {
    for (const x of [-7, -3.8, 3.8, 7]) pilastro(x + (sc.r() - 0.5) * 0.8, z + (sc.r() - 0.5) * 1.5, 0.7, pinza(0.6 - z / 60), "vena", sc.r() < 0.6);
  }
  // in fondo l'ultimo pilastro: pulsa ancora d'ambra; acceso per intero; o spento, dal plasma
  const ultimo: V3 = [0, 0, 30];
  if (archivio === "forzato") {
    pilastro(ultimo[0], ultimo[2], 0.9, 0.3, "vena", true);
  } else {
    pilastro(ultimo[0], ultimo[2], 0.9, archivio === "salutato" ? 1 : 0.85, "caldo", false);
    sc.alone([0, 4, 30], archivio === "salutato" ? 14 : 3, "caldo", archivio === "salutato" ? 0.5 : 0.55);
    if (archivio === "salutato") sc.nuvola("caldo", piano([-11, 0, 10], [22, 0, 0], [0, 0, 24]), 500, { forza: 0.4 });
    sc.marca([0, 3.5, 30], 2.2, 7);
  }
  sc.linee("vena", scatola(1.3, 0, 28.6, 2.1, 1.1, 29.2), { forza: 0.4 });
  return sc.strati;
}

/** L'alloggio dell'equipaggio: le alcove a nido d'ape, il Navarca che riposa in una delle più basse. */
function alloggio(_s: Stati): Strato[] {
  const sc = new Scena(cam({ beccheggio: 0.12, cy: 160 }), 1414, [4, 7]);
  const cz = 4.9, R = 4.7;
  stanzaTonda(sc, { cz, R, h: 4.6, volta: 1.1, pavimento: 650, parete: 1300, cupola: 500 });
  // in basso le alcove lunghe, per stendersi; sopra, celle a nido d'ape su più livelli
  const esa = (rx: number, ry: number): [number, number][] => [[-rx, 0], [-rx * 0.6, ry], [rx * 0.6, ry], [rx, 0], [rx * 0.6, -ry], [-rx * 0.6, -ry], [-rx, 0]];
  const celle: { s: number; t: number; rx: number; ry: number }[] = [];
  for (let s0 = -5.4; s0 <= 5.4; s0 += 2.05) celle.push({ s: s0, t: 0.62, rx: 0.95, ry: 0.42 });
  for (let riga = 0; riga < 5; riga++) {
    const t = 1.55 + riga * 0.62;
    for (let s0 = -5.6 + (riga % 2) * 0.38; s0 <= 5.6; s0 += 0.76) celle.push({ s: s0, t, rx: 0.4, ry: 0.3 });
  }
  sc.linee("vena", celle.map((c) => suParete(0, cz, R - 0.02, FRONTE, 0, sposta(esa(c.rx, c.ry), c.s, c.t))), { forza: 0.5, spessore: 0.8 });
  for (const c of celle.filter((_, i) => i % 3 === 0)) {
    const p = suParete(0, cz, R - 0.1, FRONTE, c.t, [[c.s, 0]])[0];
    sc.alone(p, c.rx * 0.9, "vena", 0.16);
  }
  // il Navarca: alto e sottile, la posa serena; nella mano a tre dita, il cilindro di metallo
  const base = celle[2];
  const su = (si: number, t: number, k = 0.15): V3 => suParete(0, cz, R - k, FRONTE, 0, [[si, t]])[0];
  sc.nuvola("osso", (u, v) => {
    const si = base.s - 0.82 + u * 1.6;
    const spessore = si < base.s - 0.62 ? 0.07 : si < base.s - 0.05 ? 0.09 : 0.05;
    return su(si, base.t - 0.12 + (v - 0.5) * spessore * 2, 0.12 + (v - 0.5) * 0.1);
  }, 800, { forza: 1 });
  sc.nuvola("osso", ellissoide(su(base.s - 0.9, base.t - 0.06, 0.15), 0.1, 0.08, 0.08), 120, { forza: 1 });
  sc.alone(su(base.s, base.t - 0.1, 0.15), 0.9, "osso", 0.2);
  const mano = su(base.s + 0.05, base.t + 0.02, 0.2);
  sc.alone(mano, 0.12, "caldo", 0.8);
  sc.marca(mano, 0.25, 0.2);
  // a nord, una porta più piccola delle altre
  sc.massa(arcata(cz, R, FRONTE + 0.02, 0, 0.32, 1.25), 0.5);
  return sc.strati;
}

/** Il nido: una cella piccola, cento soli gialli disegnati sulle pareti, il bozzolo grande la metà. */
function nido(s: Stati): Strato[] {
  const sc = new Scena(cam({ h: 1.35, f: 280 }), 1515, [2.5, 4]);
  const alto = 2.0;
  sc.nuvola("vena", piano([-1.7, 0, 0.6], [3.4, 0, 0], [0, 0, 3.6]), 350, { forza: 0.55 });
  sc.nuvola("vena", piano([-1.7, alto, 0.6], [3.4, 0, 0], [0, 0, 3.6]), 220, { forza: 0.4 });
  for (const [o, ex] of [[[-1.7, 0, 0.6], [0, 0, 3.6]], [[1.7, 0, 0.6], [0, 0, 3.6]], [[-1.7, 0, 4.2], [3.4, 0, 0]]] as const) {
    sc.nuvola("vena", piano(o, ex, [0, alto, 0]), 280, { forza: 0.45 });
  }
  // il sole solo, giallo, piccolo, tracciato con qualcosa di morbido: cento volte, mai tre
  const sole = (r: () => number): [number, number][][] => {
    const rr = 0.05 + r() * 0.02;
    const giro = Array.from({ length: 11 }, (_, i) => {
      const a = (i / 10) * PI * 2;
      const w = rr * (1 + (r() - 0.5) * 0.25);
      return [w * Math.cos(a), w * Math.sin(a)] as [number, number];
    });
    const raggi = Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * PI * 2 + r() * 0.3;
      return [[Math.cos(a) * rr * 1.4, Math.sin(a) * rr * 1.4], [Math.cos(a) * rr * (2.1 + r() * 0.5), Math.sin(a) * rr * (2.1 + r() * 0.5)]] as [number, number][];
    });
    return [giro, ...raggi];
  };
  const pareti: [V3, V3, number][] = [[[-1.68, 0, 0.6], [0, 0, 1], 3.6], [[1.68, 0, 4.2], [0, 0, -1], 3.6], [[-1.7, 0, 4.18], [1, 0, 0], 3.4]];
  const soli: V3[][] = [];
  for (const [o, ex, largo] of pareti) {
    for (let t = 0.35; t < alto - 0.15; t += 0.3) {
      for (let s0 = 0.2 + (Math.round(t * 10) % 2) * 0.12; s0 < largo - 0.15; s0 += 0.32) {
        if (sc.r() < 0.12) continue;
        soli.push(...sole(sc.r).map((f) => suPiano(o, ex, [0, 1, 0], sposta(f, s0 + (sc.r() - 0.5) * 0.06, t + (sc.r() - 0.5) * 0.06))));
      }
    }
  }
  sc.linee("caldo", soli, { forza: s.proiezione === "attiva" ? 0.95 : 0.75, spessore: 0.9 });
  // in un angolo, il bozzolo di riposo grande la metà degli altri; vicino, il sonaglio a conchiglia
  const b: V3 = [-1.05, 0.42, 3.55];
  sc.nuvola("vena", ellissoide(b, 0.5, 0.4, 0.42), 520, { forza: 0.85 });
  const q = sc.pr(b);
  if (q) {
    const k = sc.pr([b[0] + 0.5, b[1], b[2]]);
    const rx = k ? Math.abs(k.x - q.x) : 30;
    sc.segno("vena", `M${(q.x - rx).toFixed(1)} ${q.y.toFixed(1)}a${rx.toFixed(1)} ${(rx * 0.82).toFixed(1)} 0 1 0 ${(2 * rx).toFixed(1)} 0a${rx.toFixed(1)} ${(rx * 0.82).toFixed(1)} 0 1 0 ${(-2 * rx).toFixed(1)} 0`, { forza: 0.6 });
  }
  sc.linea("caldo", suPiano([-0.35, 0.02, 3.0], [1, 0, 0], [0, 0, 1], spirale(2.2, 0.09)), { forza: 0.9, spessore: 1.1 });
  sc.alone([0, 1.0, 3.5], 2.2, "caldo", 0.14);
  return sc.strati;
}

/** Il ponte di comando: la cupola di cristallo nero, la stella al centro, le postazioni, la porta tonda. */
function ponte(s: Stati): Strato[] {
  const sc = new Scena(cam({ beccheggio: 0.24, cy: 170 }), 1616, [7, 13]);
  const cz = 10, R = 10;
  const accesa = s.proiezione === "attiva";
  sc.nuvola("vena", disco(0, 0, cz, R), 1100, { forza: 0.55 });
  sc.nuvola("vena", cilindro(0, cz, R, 0, 3, -0.4, PI + 0.4), 900, { forza: 0.5 });
  sc.nuvola("vena", cupola(0, 3, cz, R, 8), 1500, { forza: 0.35 });
  sc.linee("vena", [...Array.from({ length: 16 }, (_, k) => Array.from({ length: 11 }, (_, i) => {
    const t = i / 10, a = (k / 16) * PI * 2;
    const r = R * Math.cos((t * PI) / 2);
    return [r * Math.cos(a), 3 + 8 * Math.sin((t * PI) / 2), cz + r * Math.sin(a)] as V3;
  })), ...[5, 8].map((y) => cerchio(0, y, cz, R * Math.sqrt(1 - ((y - 3) / 8) ** 2), 0, PI * 2, 64))], { forza: 0.12, spessore: 0.6 });
  // al centro la struttura a forma di stella: anelli e punte intrecciati
  const c: V3 = [0, 3.3, cz];
  const anello = (inclina: number, giro: number) => Array.from({ length: 49 }, (_, i) => {
    const a = (i / 48) * PI * 2;
    const x0 = Math.cos(a) * 1.35, y0 = Math.sin(a) * 1.35;
    const y1 = y0 * Math.cos(inclina), z1 = y0 * Math.sin(inclina);
    return [c[0] + x0 * Math.cos(giro) - z1 * Math.sin(giro), c[1] + y1, c[2] + x0 * Math.sin(giro) + z1 * Math.cos(giro)] as V3;
  });
  const punte = Array.from({ length: 12 }, () => {
    const a = sc.r() * PI * 2, e = (sc.r() - 0.5) * 2.4;
    const d: V3 = [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)];
    return segmento([c[0] + d[0] * 0.3, c[1] + d[1] * 0.3, c[2] + d[2] * 0.3], [c[0] + d[0] * 2, c[1] + d[1] * 2, c[2] + d[2] * 2], 3);
  });
  sc.linee("vena", [anello(PI / 2, 0), anello(PI / 5, 0.6), anello(-PI / 4, -0.9), ...punte], { forza: accesa ? 0.95 : 0.45, spessore: accesa ? 1.1 : 0.8 });
  if (accesa) sc.alone(c, 2.4, "vena", 0.5);
  // le postazioni intorno; quella del comandante, più grande, con l'impronta di una mano
  for (let k = 0; k < 7; k++) {
    const a = FRONTE + (k - 3) * 0.62;
    if (k === 3) continue;
    sc.linee("vena", [cerchio(0, 0.95, cz, 4.3, a - 0.16, a + 0.16, 8), cerchio(0, 0.95, cz, 4.8, a - 0.14, a + 0.14, 8), cerchio(0, 0, cz, 4.7, a - 0.14, a + 0.14, 8)], { forza: 0.5 });
  }
  const capo = FRONTE;
  sc.linee("vena", [cerchio(0, 1.0, cz, 5.0, capo - 0.22, capo + 0.22, 12), cerchio(0, 1.0, cz, 5.7, capo - 0.2, capo + 0.2, 12), cerchio(0, 0, cz, 5.6, capo - 0.2, capo + 0.2, 12)], { forza: 0.6 });
  const mano = suPiano([0, 1.01, cz + 5.35], [1, 0, 0], [0, 0, 1], [[-0.09, -0.1], [-0.1, 0.05], [-0.05, 0.16], [-0.02, 0.05], [0.0, 0.18], [0.03, 0.05], [0.07, 0.15], [0.1, 0.03], [0.08, -0.1], [-0.09, -0.1]]);
  sc.linea("caldo", mano, { forza: 0.85 });
  sc.marca([0, 1.02, cz + 5.35], 0.5, 0.25);
  // dietro, nella parete, la porta tonda con le cinque punte luminose
  const p: V3 = [0, 2.1, cz + R - 0.1];
  if (s.porta_circolare === "aperta") {
    sc.massa(cerchioDiFronte(p[0], p[1], p[2], 1.4), 0.6);
  } else {
    sc.linee("vena", [cerchioDiFronte(p[0], p[1], p[2], 1.4, 0, PI * 2, 64), cerchioDiFronte(p[0], p[1], p[2], 0.22, 0, PI * 2, 24)], { forza: 0.55 });
    // il meccanismo al centro: cinque punte luminose retrattili, a raggiera
    sc.linee("vena", Array.from({ length: 5 }, (_, k) => {
      const a = PI / 2 + (k / 5) * PI * 2;
      return segmento([p[0] + Math.cos(a) * 0.26, p[1] + Math.sin(a) * 0.26, p[2]], [p[0] + Math.cos(a) * 0.9, p[1] + Math.sin(a) * 0.9, p[2]], 3);
    }), { forza: 0.9, spessore: 1.4 });
  }
  if (accesa) {
    // sulla cupola la mappa stellare a tre dimensioni: una rotta attraverso il vuoto, e in fondo il tuo sole
    const stellaSu = (u: number, v: number): V3 => cupola(0, 3, cz, R - 0.3, 7.6)(u, 0.15 + v * 0.85);
    sc.nuvola("brina", stellaSu, 520, { forza: 1 });
    const rotta = Array.from({ length: 24 }, (_, i) => cupola(0, 3, cz, R - 0.4, 7.4)(0.16 + i * 0.011, 0.22 + Math.sin((i / 23) * PI) * 0.6));
    sc.linea("vivo", rotta, { forza: 0.9, spessore: 1, tratteggio: "3 2" });
    sc.alone(rotta[rotta.length - 1], 0.5, "caldo", 1);
  }
  return sc.strati;
}

/** L'anticamera: il passaggio si stringe, un buio che beve la luce; in fondo, la soglia. */
function anticamera(_s: Stati): Strato[] {
  const sc = new Scena(cam(), 1717, [3, 6]);
  const largo = (z: number) => (z < 5 ? 2.4 - (z - 1) * 0.42 : 0.72 + (z - 5) * 0.18);
  const alto = (z: number) => (z < 5 ? 3.2 - (z - 1) * 0.22 : 2.3 + (z - 5) * 0.08);
  const beve = (p: V3) => pinza(0.08 + Math.abs(p[2] - 5.2) / 3.5);
  for (const lato of [-1, 1]) {
    sc.nuvola("vena", (u, v) => {
      const z = 1 + u * 8.5;
      return [largo(z) * lato, v * alto(z), z];
    }, 520, { tieni: beve, forza: 0.6 });
    sc.linee("vena", [0.4, 1.2, 2.0].map((y) => Array.from({ length: 18 }, (_, i) => {
      const z = 1 + i * 0.5;
      return [largo(z) * lato, Math.min(y, alto(z)), z] as V3;
    })), { forza: 0.14, tratteggio: "1 4", spessore: 0.6 });
  }
  sc.nuvola("vena", (u, v) => {
    const z = 1 + u * 8.5;
    return [(v - 0.5) * 2 * largo(z), 0, z];
  }, 360, { tieni: beve, forza: 0.5 });
  // il campo che il sensore non legge: dove il buio beve, solo rumore
  let d = "";
  const q = sc.pr([0, 1.4, 5.2]);
  if (q) {
    for (let i = 0; i < 140; i++) {
      const x = q.x + (sc.r() - 0.5) * 120, y = q.y + (sc.r() - 0.5) * 150;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}h${(1 + sc.r() * 3).toFixed(1)}`;
    }
  }
  sc.segno("vena", d, { forza: 0.26, spessore: 0.8 });
  // davanti, a ovest, una soglia aperta: oltre, le linee luminose del santuario
  const soglia = suPiano([-0.5, 0, 9.6], [1, 0, 0], [0, 1, 0], [[0, 0], [1, 0], [1, 2.1], [0, 2.1], [0, 0]]);
  sc.massa(soglia, 0.25);
  sc.linea("vena", soglia, { forza: 0.4 });
  sc.alone([0, 0.6, 11], 1.6, "brina", 0.4);
  sc.linee("brina", [0.6, 1.2].map((r) => cerchio(0, 0.01, 12.5, r, PI * 1.15, PI * 1.85, 16)), { forza: 0.45 });
  return sc.strati;
}

/** Il santuario centrale: il pavimento di linee luminose, le pareti che convergono, l'Anziano sopra il sostegno. */
function santuarioCentrale(s: Stati): Strato[] {
  const sc = new Scena(cam({ beccheggio: 0.02, cy: 145 }), 1818, [3.5, 6.5]);
  const cz = 4.6, R = 4.2;
  const spento = fuga(s);
  sc.nuvola("vena", (u, v) => {
    const y = v * 10;
    const r = R * (1 - y / 10.5);
    const a = -0.4 + u * (PI + 0.8);
    return [r * Math.cos(a), y, cz + r * Math.sin(a)];
  }, 1700, { tieni: (p) => (p[1] < 4.5 ? 1 : pinza(1 - (p[1] - 4.5) / 5)) });
  sc.linee("vena", Array.from({ length: 9 }, (_, k) => {
    const a = (k / 9) * (PI + 0.8) - 0.4;
    return segmento([R * Math.cos(a), 0, cz + R * Math.sin(a)], [0, 10.5, cz], 10);
  }), { forza: 0.14, spessore: 0.6 });
  // il pavimento: la stessa geometria stellare del Ponte, ridotta a qualcosa di intimo
  const f = spento ? 0.15 : 0.8;
  sc.linee("vena", [1, 2, 3, 4].map((r) => cerchio(0, 0.01, cz, r, 0, PI * 2, 64)), { forza: f * 0.7 });
  sc.linee("vena", Array.from({ length: 12 }, (_, k) => segmento([0, 0.01, cz], [Math.cos((k / 12) * PI * 2) * 4, 0.01, cz + Math.sin((k / 12) * PI * 2) * 4], 8)), { forza: f * 0.55 });
  sc.linea("vena", suPiano([0, 0.01, cz], [1, 0, 0], [0, 0, 1], stella(12, 3.5, 2.1)), { forza: f });
  if (!spento) {
    sc.puntiLungo("vena", [1, 2, 3].map((r) => cerchio(0, 0.01, cz, r, 0, PI * 2, 48)), 600, 0.02, { forza: 0.8 });
    sc.alone([0, 0.1, cz], 4, "vena", 0.28);
  }
  // il sostegno sottile, con una riga di glifi sul bordo
  sc.linee("vena", [segmento([-0.04, 0, cz], [-0.03, 1.1, cz], 4), segmento([0.04, 0, cz], [0.03, 1.1, cz], 4), cerchio(0, 1.1, cz, 0.14, 0, PI * 2, 20)], { forza: 0.7 });
  sc.linea("caldo", cerchio(0, 1.07, cz, 0.14, PI * 1.1, PI * 1.9, 14), { forza: 0.8, tratteggio: "0.8 1.2" });
  if (spento) {
    // il pavimento si è aperto su una gola che scende
    sc.massa(cerchio(0.9, 0.01, cz - 0.6, 0.7, 0, PI * 2, 32), 0.6);
    sc.linee("vena", [0.55, 0.4].map((r, i) => cerchio(0.9, -0.6 - i * 0.7, cz - 0.6, r, 0, PI * 2, 24)), { forza: 0.35 });
    return sc.strati;
  }
  // l'Anziano: una figura di punti di luce, i bordi che si sfanno appena, come una fotografia esposta troppe volte
  const figura = (u: number, v: number): V3 => {
    const y = 1.25 + v * 1.7;
    let largo: number;
    if (y > 2.72) largo = 0.13 * Math.sqrt(Math.max(0, 1 - ((y - 2.85) / 0.14) ** 2));
    else if (y > 2.5) largo = 0.22 + (2.72 - y) * 0.6;
    else largo = 0.3 + (2.5 - y) * 0.18;
    const a = u * PI * 2;
    return [largo * Math.cos(a), y, cz + largo * 0.6 * Math.sin(a)];
  };
  sc.nuvola("osso", figura, 900, { forza: 0.95 });
  sc.nuvola("vena", (u, v) => {
    const p = figura(u, v);
    const k = 1.1 + v * 0.5;
    return [p[0] * k + (u - 0.5) * 0.1, p[1] + v * 0.12, p[2]];
  }, 380, { forza: 0.5 });
  sc.alone([0, 2.3, cz], 0.9, "caldo", 0.45);
  sc.alone([0, 2.2, cz], 2.2, "osso", 0.18);
  return sc.strati;
}

// ---- il registro ----------------------------------------------------------------------------------

const k = (...v: unknown[]) => v.map((x) => String(x ?? "")).join("|");

export const STANZE: Readonly<Record<string, DefStanza>> = {
  "camera di compensazione": {
    descrizione: (s) =>
      `la camera bassa e tonda; a ovest la porta interna${s.porta_interna === "aperta" ? ", aperta" : ""}, con sopra l’incisione di un seme che germoglia; ${s.ingresso === "aperto" || fuga(s) ? "sopra, il varco con la luce gialla del boccaporto" : "sopra, dove c’era il varco, solo parete"}`,
    chiave: (s) => k(s.porta_interna, s.ingresso, s.fuga),
    disegna: cameraDiCompensazione,
    varianti: { chiusa: { ingresso: "chiuso" }, "varco aperto": { ingresso: "aperto" }, "porta aperta": { porta_interna: "aperta" }, fuga: { fuga: "iniziata" } },
  },
  "vestibolo delle gole": {
    descrizione: (s) =>
      `la sala bassa e tonda con tre gole: la larga ${fuga(s) ? "crollata" : "che sale verso una luce azzurrina"}, quella di mezzo che scende, la terza crollata; ${s.risuonatore === "staccato" ? "la nicchia vuota, con i tuoi tagli" : "nella nicchia, il risuonatore schedato"}`,
    chiave: (s) => k(s.risuonatore, s.fuga),
    disegna: vestibolo,
    varianti: { "risuonatore incastrato": { risuonatore: "incastrato" }, "nicchia vuota": { risuonatore: "staccato" }, fuga: { fuga: "iniziata", risuonatore: "staccato" } },
  },
  "gola di mezzo": {
    descrizione: (s) => (fuga(s) ? "la gola che scende, e le venature tutte accese di un verde malato" : "la gola che scende a scatti, si stringe e si riallarga; una venatura verde per un palmo"),
    chiave: (s) => k(s.fuga),
    disegna: golaDiMezzo,
    varianti: { calma: {}, fuga: { fuga: "iniziata" } },
  },
  "sala delle teche": {
    descrizione: (s) =>
      `file di teche alte il doppio di te, molte forzate da dentro, e il groviglio di filamenti pallidi${s.bengala === "acceso" ? " ammassato intorno al bengala rosso" : s.energia === "ripristinata" ? ", piegato sotto la luce azzurrina del campo" : ""}; lungo le pareti le teche chiuse, bianche di brina`,
    chiave: (s) => k(s.bengala, s.energia, s.fuga, s.groviglio, s.faro),
    disegna: salaDelleTeche,
    varianti: { quieta: {}, bengala: { bengala: "acceso" }, energia: { energia: "ripristinata" }, "faro basso": { faro: "basso" }, fuga: { fuga: "iniziata", groviglio: "desto" } },
  },
  vivaio: {
    descrizione: () => "il locale basso e tiepido: i banchi di semina in file, ognuno sotto la sua lampada spenta, e al centro il germinatoio con i germogli",
    chiave: () => "",
    disegna: vivaio,
    varianti: { sempre: {} },
  },
  "gola del ritorno": {
    descrizione: () => "la gola che scende ripida e trema; il faro apre un metro alla volta, la polvere cade, in fondo il fruscio del groviglio",
    chiave: () => "",
    disegna: golaDelRitorno,
    varianti: { sempre: {} },
  },
  "corridoio principale": {
    descrizione: (s) =>
      `il corridoio immenso, le pareti curve che fanno luce; in fondo ${s.grande_porta === "aperta" ? "la Grande Porta aperta verso il Ponte" : "la Grande Porta con il diagramma di stelle e tre incavi"}; alla base della parete, ${s.tacche === "segnata" ? "quattro" : "tre"} tacche`,
    chiave: (s) => k(s.grande_porta, s.tacche),
    disegna: corridoio,
    varianti: { chiusa: {}, "tacca segnata": { tacche: "segnata" }, aperta: { grande_porta: "aperta", tacche: "segnata" } },
  },
  "laboratorio di risonanza": {
    descrizione: (s) =>
      s.energia === "ripristinata"
        ? "il ventre della nave, vivo: archi di elettricità fra le bobine, i monitor accesi"
        : "il ventre della nave: bobine, cristalli di focalizzazione, il vano vuoto al centro, e sul banco qualcosa che pulsa; il sensore crepita di interferenze",
    chiave: (s) => k(s.energia),
    disegna: laboratorio,
    varianti: { spento: {}, energia: { energia: "ripristinata" } },
  },
  "serra morente": {
    descrizione: (s) =>
      `la serra a cupola, le felci scheletriche, la polvere come neve grigia; ${s.teca === "svuotata" ? "al centro i resti della teca dissolta" : "al centro la teca con il seme che brilla di verde"}; contro una colonna, l’uomo in tuta`,
    chiave: (s) => k(s.teca),
    disegna: serra,
    varianti: { sigillata: { teca: "sigillata" }, svuotata: { teca: "svuotata" } },
  },
  "arca biologica": {
    descrizione: () => "la sala lunga e gelida: file di capsule di stasi scure, coperte di brina, che si perdono oltre il faro",
    chiave: () => "",
    disegna: arcaBiologica,
    varianti: { sempre: {} },
  },
  "santuario del silenzio": {
    descrizione: (s) => `la sala circolare: la luce bianca che sale dal pavimento, i bassorilievi dei tre soli e delle navi in partenza, al centro l’altare di pietra nera${s.altare === "schiuso" ? " con lo scomparto aperto" : ""}`,
    chiave: (s) => k(s.altare),
    disegna: santuarioDelSilenzio,
    varianti: { serrato: {}, schiuso: { altare: "schiuso" } },
  },
  scriptorium: {
    descrizione: (s) => `la biblioteca circolare senza libri: i globi di testo alieno a mezz’aria, al centro la lastra incisa${s.disco === "staccato" ? "" : "; in una nicchia il proiettore spento, bloccato da un disco di pietra"}`,
    chiave: (s) => k(s.disco),
    disegna: scriptorium,
    varianti: { "disco incastrato": {}, "disco staccato": { disco: "staccato" } },
  },
  "arca della memoria": {
    descrizione: (s) =>
      `la caverna di cristallo nero, i pilastri spenti e incrinati; ${s.archivio === "forzato" ? "in fondo anche l’ultimo, adesso, è buio" : s.archivio === "salutato" ? "in fondo l’ultimo pilastro è acceso per intero, d’ambra" : "in fondo un pilastro solo pulsa d’ambra"}`,
    chiave: (s) => k(s.archivio),
    disegna: arcaDellaMemoria,
    varianti: { intatto: { archivio: "intatto" }, salutato: { archivio: "salutato" }, forzato: { archivio: "forzato" } },
  },
  "alloggio dell'equipaggio": {
    descrizione: () => "la stanza tonda dalle alcove a nido d’ape; in una delle più basse riposa il Navarca, il cilindro di metallo nella mano",
    chiave: () => "",
    disegna: alloggio,
    varianti: { sempre: {} },
  },
  nido: {
    descrizione: () => "la cella piccola: cento soli gialli disegnati sulle pareti, in un angolo il bozzolo grande la metà degli altri, e il sonaglio",
    chiave: (s) => k(s.proiezione),
    disegna: nido,
    varianti: { sempre: {}, proiezione: { proiezione: "attiva" } },
  },
  "ponte di comando": {
    descrizione: (s) =>
      `la sala vasta e tonda sotto la cupola di cristallo nero; al centro la struttura a stella${s.proiezione === "attiva" ? " accesa, e sulla cupola la mappa stellare con la rotta" : ", spenta"}; intorno le postazioni, e dietro la più grande la porta tonda${s.porta_circolare === "aperta" ? " aperta" : ""}`,
    chiave: (s) => k(s.proiezione, s.porta_circolare),
    disegna: ponte,
    varianti: { spento: {}, proiezione: { proiezione: "attiva" }, "porta aperta": { proiezione: "attiva", porta_circolare: "aperta" } },
  },
  anticamera: {
    descrizione: () => "il passaggio che si stringe in un buio che beve la luce; davanti, la soglia aperta",
    chiave: () => "",
    disegna: anticamera,
    varianti: { sempre: {} },
  },
  "santuario centrale": {
    descrizione: (s) =>
      fuga(s)
        ? "il santuario con le linee del pavimento spente: il sostegno vuoto, e accanto il pavimento aperto su una gola"
        : "la stanza piccola dalle pareti che convergono nel buio; il pavimento di linee luminose, e sopra il sostegno sottile la figura di luce dell’Anziano",
    chiave: (s) => k(s.fuga),
    disegna: santuarioCentrale,
    varianti: { anziano: {}, fuga: { fuga: "iniziata" } },
  },
};
