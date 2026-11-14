// ============================================================================
//  Il motore della scala: lo spazio dell'intro in WebGL2, con shader propri.
//  Nasce dal motore della prova di look (progettazione/09-prova-di-look.html),
//  portato in un modulo; qui disegna anche il margine (B). Dal 13 novembre 2026
//  il cielo è rifatto (documento 09, §14): freddo come nelle copertine, e
//  calcolato una volta sola per quadro. Dal 14 novembre 2026 la Santa Maria è
//  la nave vera (documento 40): il modello costruito in Blender dalla tabella
//  delle misure, con la sua tessitura, disegnato dal vivo con la stessa camera
//  del cielo (prima era uno still scontornato su un piano). Il fuso, le stelle,
//  la Via Lattea, la polvere, il fascio del faro e la luce sono calcolati.
//
//  Il mondo è in metri. X è la rotta della Santa Maria, Y l'alto, Z il fianco
//  destro.
// ============================================================================

export type Quadro = "scala" | "margine" | "oblo" | "faro" | "plancia";
type V3 = [number, number, number];

interface Inquadratura {
  pos: V3;
  nave: V3;
  fov: number;
  avanti: V3;
  /** la nave si vede, e da dove: da poppa (la scala) o da prua (il margine); nell'oblò non c'è */
  sprite: "poppa" | "prua" | null;
  faro: boolean;
  fuso: boolean;
  polvere?: boolean;
  luceFaro?: number;
  /** solo la plancia: di quanti gradi il faro si sposta dalla sua direzione */
  faroGradi?: number;
}

// ---- vettori -----------------------------------------------------------------
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};
const croce = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const somma = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const per = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const verso = (da: V3, a: V3): V3 => norm([a[0] - da[0], a[1] - da[1], a[2] - da[2]]);
const azimut = (gradi: number, elev = 0): V3 => {
  const a = (gradi * Math.PI) / 180;
  const e = (elev * Math.PI) / 180;
  return norm([Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)]);
};

// ---- le costanti del mondo -----------------------------------------------------
const NAVE = { larghezza: 96, velocita: 5 };
const ALFA = (40 * Math.PI) / 180; // la camera è 40° a destra della rotta
const DIREZIONE = norm([Math.cos(ALFA), 0.03, -Math.sin(ALFA)]);
// il fuso: 25 km per 4,6, fermo sulla rotta, a sei chilometri. Lo scanner dirà 340 metri.
const FUSO = { centro: [4900, -380, -2380] as V3, semiLunghezza: 12500, semiLarghezza: 2300, inclinazione: (-6 * Math.PI) / 180 };
const SOLE = norm([-0.55, 0.62, 0.56]);
// il sole della nave, ripresa per ripresa: prende i fianchi che la camera vede (da poppa il destro e la
// piastra; da prua il sinistro, e il muso di striscio). Ogni quadro ha già il suo cielo.
const SOLE_NAVE: Record<"poppa" | "prua", V3> = { poppa: norm([-0.6, 0.45, 0.66]), prua: norm([0.34, 0.6, -0.72]) };
// quanto erano larghi gli still di prima, in metri: `proietta` lo dice ancora all'intro, che ci regola i tempi
const LARGHEZZA_NAVE = { poppa: 96, prua: 112 };
// la fotografia della nave: quanto è forte il sole (appena caldo), quanta luce fredda viene dal cielo, e le sue
// luci (l'oblò, i fanali, la luce dell'uscita, la lente del faro acceso, la spinta dei quattro scarichi)
const LUCE_NAVE = { sole: [1.7, 1.63, 1.52], cielo: [0.02, 0.03, 0.055], oblo: 3.0, fanali: 6.0, uscita: 4.0, faro: 14.0, spinta: 0.6 };
const faroDi = (q: Quadro, gradi = 0) => ({
  origine: [44, 7, -3] as V3,
  apertura: (3.2 * Math.PI) / 180,
  portata: 210,
  direzione:
    q === "faro" || q === "plancia"
      ? norm([Math.cos(((-64 + gradi) * Math.PI) / 180), 0.02 + gradi * 0.0015, Math.sin(((-64 + gradi) * Math.PI) / 180)])
      : norm([1, -0.03, -0.02]),
});

/** L'oblò della plancia (C, D, H): la camera è il vetro. La nave scivola di lato, e il bordo del fuso
 *  avanza sulle stelle e le spegne (C); il faro si accende e cerca (D). Il tempo è quello dell'intro.
 *  La nave si porta dietro la camera e il faro; la polvere resta ferma, e le passa accanto. */
const OBLO = { pos: [14, 15, 5] as V3, gradi: -60.5, elev: 1.2, fov: 46, deriva: 6 };
function oblo(t: number, faro: number, faroGradi: number): Inquadratura {
  const avanti = azimut(OBLO.gradi, OBLO.elev);
  const destra = norm(croce(avanti, [0, 1, 0]));
  const nave = per(destra, OBLO.deriva * t);
  return {
    pos: somma(OBLO.pos, nave),
    nave,
    fov: (OBLO.fov * Math.PI) / 180,
    avanti,
    sprite: null,
    faro: faro > 0,
    fuso: true,
    polvere: faro > 0,
    luceFaro: 0.06 * faro,
    faroGradi,
  };
}

/** La scala (E): 0–3 s segue la nave a 85 m; 3–23 s arretra fino a 18 km, a
 *  velocità costante in scala logaritmica, con un avvio e un arresto morbidi;
 *  l'obiettivo passa da 44° a 40°. Da vicino la camera mira alla poppa, e non al
 *  mezzo della nave (che è lunga ottanta metri: di tre quarti non starebbe nel
 *  quadro); arretrando la mira torna al mezzo, senza che si veda. */
function camera(t: number): Inquadratura {
  const u = clamp01((t - 3) / 20);
  const e = 0.5 - 0.5 * Math.cos(Math.PI * Math.pow(u, 0.8));
  const D0 = 85;
  const D = Math.exp(lerp(Math.log(D0), Math.log(18000), e));
  const fov = (lerp(44, 40, e) * Math.PI) / 180;
  const nave: V3 = [NAVE.velocita * t, 0, 0];
  const mira: V3 = [nave[0] - (26 * D0) / D, 0, 0];
  return { pos: somma(mira, per(DIREZIONE, -D)), nave, fov, avanti: DIREZIONE, sprite: "poppa", faro: true, fuso: true };
}

/** I reattori nella scala (l'autore, 14 novembre 2026: «dovremmo fare un effetto di spegnimento dei reattori,
 *  per una questione di realismo la nave continuerà comunque ad avvicinarsi per inerzia»). Accesi all'inizio,
 *  mentre la camera è vicina; poi si spengono in due secondi scarsi, con due singhiozzi, e la fiamma si
 *  accorcia; negli scarichi resta la brace, che si raffredda piano. La nave non rallenta. */
const SPEGNIMENTO = { quando: 1.3, dura: 1.9, brace: 3.4 };
export function reattori(q: Quadro, t: number): { forza: number; lunga: number; brace: number } {
  if (q !== "scala") return { forza: 1, lunga: 1, brace: 0 };
  const u = clamp01((t - SPEGNIMENTO.quando) / SPEGNIMENTO.dura);
  if (u <= 0) return { forza: 1, lunga: 1, brace: 0 };
  const cala = Math.pow(1 - u, 1.6);
  const singhiozzi = 1 - 0.6 * Math.exp(-(((u - 0.16) / 0.045) ** 2)) - 0.45 * Math.exp(-(((u - 0.4) / 0.04) ** 2));
  const dopo = Math.max(0, t - SPEGNIMENTO.quando - SPEGNIMENTO.dura);
  return { forza: cala * Math.max(0, singhiozzi), lunga: 0.2 + 0.8 * cala, brace: Math.min(1, u * 2.5) * Math.exp(-dopo / SPEGNIMENTO.brace) };
}

/** I quadri. `t` è il tempo del quadro, in secondi. */
export function inquadratura(q: Quadro, t: number, faro = 0, faroGradi = 0): Inquadratura {
  if (q === "plancia") return oblo(t, faro, faroGradi);
  if (q === "margine") {
    // la nave avanza; la camera, davanti e a babordo, è ferma. Con la nave vera, lunga ottanta metri, sta a
    // due terzi della distanza di prima sulla stessa retta: la nave tiene nel quadro il posto che aveva lo still
    const nave: V3 = [NAVE.velocita * 3 * (t - 4), 0, 0];
    const pos: V3 = [395, 49, -429];
    return { pos, nave, fov: (34 * Math.PI) / 180, avanti: verso(pos, [-60, 38, 0]), sprite: "prua", faro: false, fuso: false, polvere: false };
  }
  if (q === "oblo" || q === "faro") {
    const faro = q === "faro";
    const pos: V3 = faro ? [12, 5, 6] : [40, 9, -1];
    return { pos, nave: [0, 0, 0], fov: (52 * Math.PI) / 180, avanti: azimut(-60, 2), sprite: null, faro, fuso: true, polvere: faro, luceFaro: 0.034 };
  }
  return camera(t);
}

/** La direzione di riferimento del cielo: dove guarda il quadro (per la scala, alla fine). */
const direzioneCielo = (q: Quadro): V3 => (q === "scala" ? DIREZIONE : inquadratura(q, 0).avanti);

/** Il fuso nel mondo: i due capi. */
function capiDelFuso(): [V3, V3] {
  const asse: V3 = [0, Math.sin(FUSO.inclinazione), Math.cos(FUSO.inclinazione)];
  return [somma(FUSO.centro, per(asse, -FUSO.semiLunghezza)), somma(FUSO.centro, per(asse, FUSO.semiLunghezza))];
}

/** La distanza dal fuso: la vesica dello shader FS_FUSO, in JavaScript. */
function distanzaDalFuso(p: V3): number {
  const [a, b] = capiDelFuso();
  const w = FUSO.semiLarghezza;
  const c = per(somma(a, b), 0.5);
  const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const v: V3 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l];
  const pc: V3 = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
  const y = pc[0] * v[0] + pc[1] * v[1] + pc[2] * v[2];
  const qx = Math.hypot(pc[0] - y * v[0], pc[1] - y * v[1], pc[2] - y * v[2]), qy = Math.abs(y);
  const r = 0.5 * l, d = (0.5 * (r * r - w * w)) / w;
  const h = r * qx < d * (qy - r) ? [0, r, 0] : [-d, 0, d + w];
  return Math.hypot(qx - h[0], qy - h[1]) - h[2];
}

/** Se un raggio da `da` nella direzione `dir` incontra il fuso. */
export function colpisceIlFuso(da: V3, dir: V3): boolean {
  let t = 0;
  for (let i = 0; i < 160; i++) {
    const h = distanzaDalFuso(somma(da, per(dir, t)));
    if (h < 0.0002 * Math.max(t, 1)) return true;
    t += h * 0.9;
    if (t > 80000) return false;
  }
  return false;
}

// ============================================================================
//  Gli shader (dalla prova di look; il cielo, le stelle e il bagliore rifatti
//  il 13 novembre 2026)
// ============================================================================
const TESTA = `#version 300 es
precision highp float;
`;
const VS_PIENO = TESTA + `
in vec2 a; out vec2 uv;
void main(){ uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;
// L'ottica: il quadro virtuale (-1…1) va sullo schermo come ndc = q · uSca + uOff. Di solito è tutto lo
// schermo (uSca 1, uOff 0); nell'oblò è il quadrato del vetro; nel raccordo di H, un ingrandimento.
const VISTA = `
uniform vec3 uDestra, uSu, uAvanti;
uniform vec2 uTan, uSca, uOff;
vec3 vista(vec2 uv){ vec2 p = ((uv * 2.0 - 1.0) - uOff) / uSca * uTan; return normalize(uDestra * p.x + uSu * p.y + uAvanti); }`;
const RUMORE = `
float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float rumore(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 x, int ottave){ float v = 0.0, a = 0.5; for (int k = 0; k < 8; k++){ if (k >= ottave) break; v += a * rumore(x); x = x * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return v; }`;

// Il cielo si calcola una volta sola per quadro (il «forno»), in una tessitura che copre tutto quello che
// il quadro può vedere; a ogni fotogramma la si legge soltanto (FS_CIELO). Così la Via Lattea può essere
// ricca quanto serve senza pesare sui fotogrammi (documento 09, §14).
// La fotografia: il cielo è freddo (blu acciaio, come nelle copertine), e non è nero: nero è solo il fuso.
const FS_FORNO = TESTA + VISTA + RUMORE + `
in vec2 uv; out vec4 o;
uniform vec3 uPolo, uCentroGal;
uniform int uOttave;
uniform float uCod;
// il rumore piegato: creste sottili, per le fenditure di polvere
float creste(vec3 x, int ottave){ float v = 0.0, a = 0.5; for (int k = 0; k < 7; k++){ if (k >= ottave) break; v += a * (1.0 - abs(2.0 * rumore(x) - 1.0)); x = x * 2.07 + vec3(4.1, 2.3, 7.9); a *= 0.5; } return v; }
void main(){
  vec3 d = vista(uv);
  vec3 x = normalize(uCentroGal - uPolo * dot(uCentroGal, uPolo));
  vec3 y = cross(uPolo, x);
  // le coordinate della galassia: g.z è il seno della latitudine
  vec3 g = vec3(dot(d, x), dot(d, y), dot(d, uPolo));
  float lon = atan(g.y, g.x);
  float lat = asin(clamp(g.z, -1.0, 1.0));
  float nucleo = exp(-pow(lon / 0.85, 2.0));
  // i dettagli corrono lungo il piano della galassia: lo spazio del rumore è schiacciato in latitudine
  vec3 ga = vec3(g.xy, g.z * 1.55);
  vec3 w = vec3(fbm(ga * 4.0 + 3.1, 4), fbm(ga * 4.0 + 7.7, 4), fbm(ga * 4.0 + 1.3, 4)) - 0.5;
  float larghezza = 0.066 + 0.088 * nucleo;
  float sfrangia = (fbm(ga * 5.0 + 2.0, 3) - 0.5) * 0.8;
  float banda = exp(-pow(lat / (larghezza * (1.0 + sfrangia)), 2.0));
  float alone = exp(-pow(lat / 0.30, 2.0));
  vec3 o3 = vec3(0.0);
  if (banda > 0.0015) {
    // le nubi di stelle, grandi e fini, e la grana delle stelle che non si distinguono
    float nubi = fbm(ga * 7.5 + w * 2.4, uOttave);
    float fini = fbm(d * 36.0 + w * 3.2 + 9.0, uOttave);
    float grana = fbm(d * 170.0 + 5.0, 3);
    float luce = banda * (0.08 + 1.85 * pow(nubi, 2.6)) * (0.42 + 1.25 * fini * fini) * (0.70 + 0.60 * grana);
    // la grande fenditura: segue il piano e serpeggia, rotta in tratti; i filamenti se ne staccano
    float serpe = (fbm(vec3(lon * 1.7, 2.7, 9.1), 3) - 0.5) * 0.12 * (0.6 + 0.8 * nucleo);
    float solco = exp(-pow((lat - serpe) / (larghezza * 0.34), 2.0));
    float fenditura = solco * smoothstep(0.50, 0.70, creste(ga * 5.2 + w * 1.6 + 11.0, uOttave));
    float filamenti = smoothstep(0.60, 0.84, creste(ga * 12.5 + w * 2.8 + 4.0, uOttave)) * banda;
    float buio = clamp(0.96 * fenditura + 0.62 * filamenti, 0.0, 0.975);
    luce *= 1.0 - buio;
    // il colore: blu acciaio ai margini, bianco freddo nelle nubi, appena avorio nel nucleo
    vec3 acciaio = vec3(0.34, 0.50, 1.0), chiaro = vec3(0.64, 0.77, 1.0), avorio = vec3(0.98, 0.93, 0.88);
    vec3 tinta = mix(acciaio, chiaro, smoothstep(0.25, 0.80, nubi));
    tinta = mix(tinta, avorio, 0.55 * nucleo * smoothstep(0.35, 0.85, nubi));
    // la polvere arrossa appena la luce ai bordi delle fenditure
    tinta = mix(tinta, vec3(0.82, 0.66, 0.60), 0.35 * smoothstep(0.15, 0.6, buio) * (1.0 - smoothstep(0.6, 0.97, buio)));
    o3 = tinta * luce * (0.050 + 0.095 * nucleo);
  }
  // l'alone largo della galassia, e il fondo: un blu notte, che lascia al fuso il nero
  float largo = fbm(d * 2.6 + 1.0, 4);
  o3 += vec3(0.26, 0.42, 0.86) * 0.0046 * alone * (0.55 + 0.9 * largo);
  o3 += vec3(0.0019, 0.0033, 0.0068) * (0.72 + 0.56 * largo);
  if (uCod > 0.5) o3 = sqrt(clamp(o3 * 6.0, 0.0, 1.0));
  o = vec4(o3, 1.0);
}`;
// Il cielo di un fotogramma: la tessitura del forno, letta nella direzione di ogni punto.
const FS_CIELO = TESTA + VISTA + `
in vec2 uv; out vec4 o;
uniform sampler2D uForno;
uniform vec3 uRifDestra, uRifSu, uRifAvanti;
uniform vec2 uRifTan;
uniform float uCod;
void main(){
  vec3 d = vista(uv);
  vec3 c = vec3(dot(d, uRifDestra), dot(d, uRifSu), dot(d, uRifAvanti));
  vec3 t = texture(uForno, clamp(c.xy / max(c.z, 1e-4) / uRifTan * 0.5 + 0.5, 0.0, 1.0)).rgb;
  if (uCod > 0.5) t = t * t / 6.0;
  o = vec4(t, 1.0);
}`;

const VS_STELLE = TESTA + `
in vec3 aDir; in vec4 aCol;
uniform vec3 uDestra, uSu, uAvanti; uniform vec2 uTan, uSca, uOff; uniform float uScala;
out vec4 col; out float dim;
void main(){
  vec3 c = vec3(dot(aDir, uDestra), dot(aDir, uSu), dot(aDir, uAvanti));
  if (c.z <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  gl_Position = vec4(c.xy / c.z / uTan * uSca + uOff, 0.0, 1.0);
  dim = clamp(1.5 + pow(aCol.a, 0.45) * 5.5, 1.5, 18.0) * uScala;
  gl_PointSize = dim;
  col = aCol;
}`;
const FS_STELLE = TESTA + `
in vec4 col; in float dim; out vec4 o;
void main(){
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float rr = dot(p, p), r2 = rr * dim * dim * 0.25;
  // il punto, e per le stelle forti un alone: stretto e poi largo, che finisce prima del bordo
  float psf = exp(-r2 / 0.85) + smoothstep(0.12, 1.2, col.a) * (0.07 * exp(-r2 / 7.0) + 0.012 * exp(-r2 / 42.0));
  o = vec4(col.rgb * col.a * psf * smoothstep(1.0, 0.55, rr), 1.0);
}`;

const FS_FUSO = TESTA + VISTA + `
in vec2 uv; out vec4 o;
uniform vec3 uPos, uA, uB; uniform float uW, uPix;
float sdVesica(vec3 p, vec3 a, vec3 b, float w){
  vec3 c = (a + b) * 0.5; float l = length(b - a); vec3 v = (b - a) / l;
  float y = dot(p - c, v); vec2 q = vec2(length(p - c - y * v), abs(y));
  float r = 0.5 * l; float d = 0.5 * (r * r - w * w) / w;
  vec3 h = (r * q.x < d * (q.y - r)) ? vec3(0.0, r, 0.0) : vec3(-d, 0.0, d + w);
  return length(q - h.xy) - h.z;
}
void main(){
  vec3 rd = vista(uv);
  vec3 c = (uA + uB) * 0.5; float R = length(uB - uA) * 0.5;
  vec3 oc = uPos - c; float b = dot(oc, rd); float cc = dot(oc, oc) - R * R; float disc = b * b - cc;
  if (disc < 0.0) { o = vec4(0.0); return; }
  float t = max(0.0, -b - sqrt(disc)); float tmax = -b + sqrt(disc);
  float minimo = 1e9; bool colpito = false;
  for (int i = 0; i < 90; i++){
    float h = sdVesica(uPos + rd * t, uA, uB, uW);
    minimo = min(minimo, h / t);
    if (h < 0.0002 * t) { colpito = true; break; }
    t += h * 0.9;
    if (t > tmax) break;
  }
  float cop = colpito ? 1.0 : clamp(0.5 - minimo / uPix, 0.0, 1.0);
  o = vec4(0.0, 0.0, 0.0, cop);
}`;

const FS_FASCIO = TESTA + VISTA + RUMORE + `
in vec2 uv; out vec4 o;
uniform vec3 uPos, uO, uD; uniform float uCos, uPortata, uI, uT;
bool intervallo(vec3 ro, vec3 rd, out float ta, out float tb){
  float L = uPortata * 1.6;
  vec3 cs = uO + uD * (L * 0.5); float R = L * 0.5 + L * sqrt(1.0 - uCos * uCos) / uCos;
  vec3 oc = ro - cs; float b = dot(oc, rd); float c = dot(oc, oc) - R * R; float h = b * b - c;
  if (h < 0.0) return false;
  h = sqrt(h); ta = max(-b - h, 0.0); tb = -b + h;
  if (tb <= ta) return false;
  vec3 co = ro - uO;
  float dv = dot(rd, uD), cv = dot(co, uD), c2 = uCos * uCos;
  float A = dv * dv - c2, B = 2.0 * (dv * cv - dot(rd, co) * c2), C = cv * cv - dot(co, co) * c2;
  float disc = B * B - 4.0 * A * C;
  if (abs(A) < 1e-7) return true;
  if (disc < 0.0) return A > 0.0;
  float s = sqrt(disc);
  float r0 = (-B - s) / (2.0 * A), r1 = (-B + s) / (2.0 * A);
  float lo = min(r0, r1), hi = max(r0, r1);
  if (A < 0.0) { ta = max(ta, lo); tb = min(tb, hi); }
  else {
    bool avantiPrima = cv + dv * (lo - 1.0) >= 0.0;
    if (avantiPrima) tb = min(tb, lo); else ta = max(ta, hi);
  }
  return tb > ta;
}
void main(){
  vec3 rd = vista(uv);
  float ta, tb;
  if (!intervallo(uPos, rd, ta, tb)) { o = vec4(0.0); return; }
  vec3 luce = vec3(0.0);
  const int N = 32;
  float dt = (tb - ta) / float(N);
  for (int i = 0; i < N; i++){
    float t = ta + (float(i) + 0.5) * dt;
    vec3 p = uPos + rd * t;
    vec3 op = p - uO; float asse = dot(op, uD);
    if (asse <= 0.0) continue;
    float coseno = asse / max(length(op), 1e-3);
    float bordo = smoothstep(uCos, mix(uCos, 1.0, 0.55), coseno);
    float cala = 1.0 / (1.0 + pow(asse / 26.0, 2.0)) * exp(-asse / (uPortata * 0.55));
    float polvere = 0.30 + 0.70 * smoothstep(0.35, 0.85, rumore(p * 0.06 + vec3(0.0, 0.0, uT * 0.4)));
    luce += vec3(1.0, 0.93, 0.80) * bordo * cala * polvere * dt;
  }
  float g = 0.35, ct = dot(uD, -rd);
  float fase = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * ct, 1.5);
  o = vec4(luce * uI * fase, 1.0);
}`;

const VS_POLVERE = TESTA + `
in vec4 aP;
uniform mat4 uVP; uniform vec3 uPos, uO, uD, uSole, uSposta; uniform float uCos, uPortata, uAltezza, uT;
out float lum;
void main(){
  vec3 p = aP.xyz + uSposta + vec3(sin(uT * 0.11 + aP.w * 7.0), cos(uT * 0.07 + aP.w * 3.0), sin(uT * 0.05 + aP.w)) * 1.2;
  vec4 c = uVP * vec4(p, 1.0);
  gl_Position = c;
  float z = max(c.w, 0.1);
  gl_PointSize = clamp(uAltezza * 0.022 / z, 1.0, 3.0);
  vec3 op = p - uO; float asse = dot(op, uD);
  float nelFascio = asse > 0.0 ? smoothstep(uCos, mix(uCos, 1.0, 0.5), asse / length(op)) / (1.0 + pow(asse / 30.0, 2.0)) : 0.0;
  float sole = 0.012 * (0.4 + 0.6 * fract(aP.w * 13.7));
  lum = (sole + nelFascio * 3.5) * smoothstep(1.0, 6.0, z) * (1.0 - smoothstep(600.0, 1400.0, z));
}`;
const FS_POLVERE = TESTA + `
in float lum; out vec4 o;
void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; o = vec4(vec3(1.0, 0.96, 0.9) * lum * exp(-dot(p, p) * 3.0), 1.0); }`;

// La nave vera. Un punto: la posizione (dal centro della nave), la normale, il posto sulla tessitura, la
// tinta e il tipo del pezzo (0 lo scafo, 1 il metallo dei pezzi, 2 le celle dei pannelli, 3 lo scuro, da 4 a
// 8 le luci, 9 la spinta). I posti degli attributi sono fissi: lo stesso vao serve anche alle ombre.
const VS_SCAFO = TESTA + `
layout(location = 0) in vec3 aP; layout(location = 1) in vec4 aN; layout(location = 2) in vec2 aUV; layout(location = 3) in vec4 aC;
uniform mat4 uVP; uniform vec3 uCentro;
out vec3 p; out vec3 n; out vec2 uv; out vec3 tinta; flat out int tipo;
void main(){
  p = aP; n = aN.xyz; uv = aUV; tinta = aC.rgb; tipo = int(aC.a * 255.0 + 0.5);
  gl_Position = uVP * vec4(aP + uCentro, 1.0);
}`;
// Nello spazio la luce è un sole solo: la si calcola dal vivo (diffusa e riflessa), con l'ombra portata da
// una mappa fatta una volta, e un poco di luce fredda del cielo da ogni parte.
const FS_SCAFO = TESTA + RUMORE + `
in vec3 p; in vec3 n; in vec2 uv; in vec3 tinta; flat in int tipo;
out vec4 o;
uniform sampler2D uColore, uRuvido, uMetallo, uRilievo;
uniform highp sampler2DShadow uOmbra;
uniform mat4 uLuceVP;
uniform vec3 uSole, uOcchio, uSoleLuce, uCieloLuce;
uniform vec4 uLuci;   // l'oblò, i fanali, la luce dell'uscita, la lente del faro
uniform vec2 uTexel;
uniform float uSpinta, uLunga, uBrace, uT, uPendenza;
const float PI = 3.14159265;
void main(){
  vec3 N = normalize(n);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uOcchio - p);
  if (tipo == 9) {
    // la spinta: un cono di luce dietro lo scarico, più forte al centro e vicino alla bocca; trema appena
    // quando i reattori si spengono la fiamma si accorcia (uLunga) prima di sparire
    float s = uv.x / max(uLunga, 0.05);
    float trema = 0.88 + 0.12 * sin(uT * 31.0 + p.z * 3.0) * sin(uT * 17.3 + p.y);
    float forza = uSpinta * trema * pow(abs(dot(N, V)), 1.6) * pow(max(1.0 - s, 0.0), 2.2) * smoothstep(0.0, 0.05, s);
    o = vec4(mix(vec3(0.60, 0.80, 1.0), vec3(0.28, 0.42, 1.0), s) * forza, 0.0);
    return;
  }
  vec3 alb; float ruv, met; vec3 emi = vec3(0.0);
  if (tipo == 0) {
    alb = texture(uColore, uv).rgb;
    ruv = texture(uRuvido, uv).r; met = texture(uMetallo, uv).r;
    // il rilievo: la pendenza della tessitura, portata sulla pelle dello scafo
    vec2 pend = vec2(texture(uRilievo, uv + vec2(uTexel.x, 0.0)).r - texture(uRilievo, uv - vec2(uTexel.x, 0.0)).r,
                     texture(uRilievo, uv + vec2(0.0, uTexel.y)).r - texture(uRilievo, uv - vec2(0.0, uTexel.y)).r) * uPendenza;
    vec3 dp1 = dFdx(p), dp2 = dFdy(p); vec2 d1 = dFdx(uv), d2 = dFdy(uv);
    vec3 a = cross(dp2, N), b = cross(N, dp1);
    vec3 T = a * d1.x + b * d2.x, B = a * d1.y + b * d2.y;
    float im = inversesqrt(max(max(dot(T, T), dot(B, B)), 1e-12));
    N = normalize(N - (T * pend.x + B * pend.y) * im);
  } else if (tipo == 1) {
    // il metallo dei pezzi: la tinta, con le macchie di chi sta fuori da novant'anni
    float k = clamp((0.75 * fbm(p * 0.9 + 3.0, 4) + 0.25 * rumore(p * 12.6) - 0.3) / 0.4, 0.0, 1.0);
    alb = pow(tinta, vec3(2.2)) * mix(0.38, 1.3, k); ruv = mix(0.73, 0.43, k); met = 0.45;
  } else if (tipo == 2) {
    // le celle di un pannello solare: il vetro scuro, e il reticolo chiaro ogni 40 cm (da lontano si perde)
    vec2 g = vec2(p.x, p.y) * 2.5;
    vec2 l = smoothstep(vec2(0.05) + fwidth(g), vec2(0.05), fract(g));
    float reticolo = max(l.x, l.y) * clamp(1.0 - max(fwidth(g.x), fwidth(g.y)) * 2.0, 0.0, 1.0);
    alb = mix(pow(tinta, vec3(2.2)), vec3(0.27, 0.31, 0.37), reticolo); ruv = 0.22; met = 0.3;
  } else if (tipo == 3) {
    alb = pow(tinta, vec3(2.2)); ruv = 0.5; met = 0.3;
  } else {
    alb = vec3(0.03); ruv = 0.35; met = 0.0;
    if (tipo == 4) emi = vec3(0.95, 0.74, 0.40) * uLuci.x;
    else if (tipo == 5) emi = vec3(1.0, 0.62, 0.22) * uLuci.y;
    else if (tipo == 6) emi = vec3(1.0, 0.88, 0.48) * uLuci.z;
    else if (tipo == 7) emi = vec3(1.0, 0.95, 0.82) * uLuci.w;
    else emi = vec3(0.62, 0.82, 1.0) * uSpinta * 5.0 + vec3(1.0, 0.30, 0.07) * uBrace * 1.8;  // la fiamma, e poi la brace
  }
  float NL = dot(N, uSole), NV = max(dot(N, V), 1e-3);
  float ombra = 0.0;
  if (NL > 0.0) {
    vec4 l = uLuceVP * vec4(p + normalize(n) * 0.06, 1.0);
    vec3 s = l.xyz * 0.5 + 0.5;
    s.z -= 0.0012 + 0.003 * (1.0 - NL);
    float passo = 1.0 / float(textureSize(uOmbra, 0).x);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) ombra += texture(uOmbra, vec3(s.xy + vec2(x, y) * passo, s.z));
    ombra /= 9.0;
  }
  NL = max(NL, 0.0);
  vec3 H = normalize(uSole + V);
  float NH = max(dot(N, H), 0.0), VH = max(dot(V, H), 0.0);
  float a = max(ruv * ruv, 0.03), a2 = a * a;
  float d = NH * NH * (a2 - 1.0) + 1.0;
  float D = a2 / (PI * d * d);
  float kk = a * 0.5;
  float G = 0.25 / ((NV * (1.0 - kk) + kk) * (NL * (1.0 - kk) + kk));
  vec3 F0 = mix(vec3(0.04), alb, met);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - VH, 5.0);
  vec3 c = (alb * (1.0 - met) / PI + F * D * G) * uSoleLuce * NL * ombra;
  // la luce del cielo: poca, fredda, da ogni parte; un poco di più dall'alto
  c += alb * uCieloLuce * (0.65 + 0.35 * N.y);
  o = vec4(c + emi, 1.0);
}`;
// L'ombra: la nave vista dal sole, solo la profondità.
const VS_OMBRA = TESTA + `
layout(location = 0) in vec3 aP;
uniform mat4 uLuceVP;
void main(){ gl_Position = uLuceVP * vec4(aP, 1.0); }`;
const FS_OMBRA = TESTA + `
void main(){ }`;
// La nave, disegnata nel suo strato, si posa sulla scena.
const FS_COPIA = TESTA + `
in vec2 uv; out vec4 o; uniform sampler2D uTex;
void main(){ o = texture(uTex, uv); }`;

const VS_LUCI = TESTA + `
in vec3 aP; in float aI;
uniform mat4 uVP; uniform float uAltezza;
out float lum;
void main(){
  vec4 c = uVP * vec4(aP, 1.0);
  gl_Position = c;
  gl_PointSize = clamp(uAltezza * 1.6 / max(c.w, 1.0), 6.0, 28.0);
  lum = aI;
}`;
const FS_LUCI = TESTA + `
in float lum; out vec4 o; uniform vec3 uTinta;
void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float r = dot(p, p);
  o = vec4(uTinta * lum * (exp(-r * 18.0) * 1.0 + exp(-r * 4.0) * 0.08), 1.0); }`;

// Il bagliore nasce solo dalle luci (uSoglia, al primo passo): il fondo del cielo non deve schiarire il
// nero del fuso.
const FS_GIU = TESTA + `
in vec2 uv; out vec4 o; uniform sampler2D uTex; uniform vec2 uTexel; uniform float uSoglia;
void main(){
  vec3 c = texture(uTex, uv).rgb * 0.5;
  c += texture(uTex, uv + uTexel * vec2(-1, -1)).rgb * 0.125; c += texture(uTex, uv + uTexel * vec2(1, -1)).rgb * 0.125;
  c += texture(uTex, uv + uTexel * vec2(-1, 1)).rgb * 0.125;  c += texture(uTex, uv + uTexel * vec2(1, 1)).rgb * 0.125;
  o = vec4(max(c - uSoglia, 0.0), 1.0);
}`;
const FS_SU = TESTA + `
in vec2 uv; out vec4 o; uniform sampler2D uTex; uniform vec2 uTexel;
void main(){
  vec3 c = vec3(0.0);
  c += texture(uTex, uv + uTexel * vec2(-1, -1)).rgb; c += texture(uTex, uv + uTexel * vec2(0, -1)).rgb * 2.0; c += texture(uTex, uv + uTexel * vec2(1, -1)).rgb;
  c += texture(uTex, uv + uTexel * vec2(-1, 0)).rgb * 2.0; c += texture(uTex, uv).rgb * 4.0; c += texture(uTex, uv + uTexel * vec2(1, 0)).rgb * 2.0;
  c += texture(uTex, uv + uTexel * vec2(-1, 1)).rgb; c += texture(uTex, uv + uTexel * vec2(0, 1)).rgb * 2.0; c += texture(uTex, uv + uTexel * vec2(1, 1)).rgb;
  o = vec4(c / 16.0, 1.0);
}`;
// La resa finale, senza le bande (le disegna l'intro sopra, per tutte le scene).
// uLuce porta il quadro dal nero (0) al pieno (1).
const FS_FINALE = TESTA + `
in vec2 uv; out vec4 o;
uniform sampler2D uScena, uScenaB, uBagliore; uniform float uMisto, uBag, uEsp, uGrana, uSeme, uLuce, uVignetta;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec3 c = mix(texture(uScena, uv).rgb, texture(uScenaB, uv).rgb, uMisto);
  c += texture(uBagliore, uv).rgb * uBag;
  c = aces(c * uEsp);
  vec2 v = uv - 0.5; c *= 1.0 - uVignetta * 0.32 * smoothstep(0.25, 0.85, dot(v * vec2(1.25, 1.0), v * vec2(1.25, 1.0)) * 2.0);
  c = pow(c, vec3(1.0 / 2.2));
  float g = h12(gl_FragCoord.xy + uSeme * 97.13) + h12(gl_FragCoord.xy * 1.31 + uSeme * 13.7) - 1.0;
  c += g * uGrana * (0.35 + 0.65 * (1.0 - c));
  o = vec4(c * uLuce, 1.0);
}`;

// ============================================================================
//  Il motore
// ============================================================================
interface Programma {
  p: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null>;
}
interface Bersaglio {
  tex: WebGLTexture;
  fb: WebGLFramebuffer;
  w: number;
  h: number;
}
/** I punti della nave che il motore deve conoscere (santa-maria.json, scritto con il modello). */
interface DatiNave {
  raggio: number;
  pendenza: number;
  tessitura: [number, number];
  luci: { "oblò": V3; fanali: V3[]; uscita: V3; scarichi: V3[]; faro: V3 };
}
interface Nave {
  vao: WebGLVertexArrayObject;
  opachi: number;
  pennacchi: number;
  colore: WebGLTexture;
  ruvido: WebGLTexture;
  metallo: WebGLTexture;
  rilievo: WebGLTexture;
  dati: DatiNave;
}
/** Lo strato dove si disegna la nave, con i bordi lisciati, prima di posarla sulla scena. */
interface Strato {
  fb: WebGLFramebuffer;
  colore: WebGLRenderbuffer;
  fondo: WebGLRenderbuffer;
  risolto: Bersaglio;
  w: number;
  h: number;
}
interface Ombra {
  tex: WebGLTexture;
  vp: number[];
}
interface Cielo {
  polo: V3;
  centro: V3;
  stelle: { vao: WebGLVertexArrayObject; n: number };
  /** il riferimento del quadro: la direzione in cui guarda, e i suoi assi */
  rif: { destra: V3; su: V3; avanti: V3 };
  /** la Via Lattea e il fondo, calcolati una volta (per una misura della tela) */
  forno: (Bersaglio & { tan: [number, number]; ridotta: boolean; per: string }) | null;
}

/** Un generatore deterministico: la stessa notte a ogni avvio. */
function generatore(seme: number) {
  return () => (seme = (seme * 16807) % 2147483647) / 2147483647;
}

/** Un rumore di valore in JavaScript, per raccogliere le stelle deboli in nubi. */
function rumoreJs(x: number, y: number, z: number) {
  const h = (i: number, j: number, k: number) => {
    let n = (i * 374761393 + j * 668265263 + k * 1274126177) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const f = (v: number) => v * v * (3 - 2 * v);
  const u = f(x - xi), v = f(y - yi), w = f(z - zi);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(l(h(xi, yi, zi), h(xi + 1, yi, zi), u), l(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v),
    l(l(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), l(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v),
    w,
  );
}

/** Dove va il quadro sullo schermo: ndc = q · sca + off (q da -1 a 1). Senza, tutto lo schermo. */
export interface Ottica {
  sca: [number, number];
  off: [number, number];
  /** il quadro è quadrato (l'oblò): lo stesso angolo in orizzontale e in verticale */
  quadrata?: boolean;
  /** solo dentro questo rettangolo, in frazioni dello schermo dall'alto a sinistra (x, y, l, a) */
  ritaglio?: [number, number, number, number];
}

export interface OpzioniQuadro {
  /** metà della risoluzione e meno ottave nel cielo */
  ridotta?: boolean;
  /** 0 nero, 1 pieno */
  luce?: number;
  ottica?: Ottica;
  /** la plancia: il faro (0 spento, 1 pieno) e quanti gradi si sposta */
  faro?: number;
  faroGradi?: number;
  /** la grana del motore (di base sì); l'oblò la prende dall'intro, come l'immagine intorno */
  grana?: boolean;
  /** la vignetta del motore (di base sì; nell'oblò no: la luce è quella della plancia) */
  vignetta?: boolean;
}

export class Scala {
  private gl: WebGL2RenderingContext;
  private P: Record<string, Programma> = {};
  private vaoPieno!: WebGLVertexArrayObject;
  private polvere = new Map<Quadro, { vao: WebGLVertexArrayObject; n: number }>();
  private cieli = new Map<string, Cielo>();
  private luci!: { vao: WebGLVertexArrayObject; b: WebGLBuffer };
  private B: { w: number; h: number; scena: Bersaglio; scenaB: Bersaglio; catena: Bersaglio[] } | null = null;
  private formato: { interno: number; tipo: number };
  readonly hdr: boolean;
  private nave: Nave | null = null;
  private strato: Strato | null = null;
  private ombre = new Map<string, Ombra>();

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error("Questo sistema non ha WebGL2.");
    this.gl = gl;
    this.hdr = !!gl.getExtension("EXT_color_buffer_float");
    this.formato = this.hdr ? { interno: gl.RGBA16F, tipo: gl.HALF_FLOAT } : { interno: gl.RGBA8, tipo: gl.UNSIGNED_BYTE };
    this.P.forno = this.programma(VS_PIENO, FS_FORNO);
    this.P.cielo = this.programma(VS_PIENO, FS_CIELO);
    this.P.stelle = this.programma(VS_STELLE, FS_STELLE);
    this.P.fuso = this.programma(VS_PIENO, FS_FUSO);
    this.P.fascio = this.programma(VS_PIENO, FS_FASCIO);
    this.P.polvere = this.programma(VS_POLVERE, FS_POLVERE);
    this.P.scafo = this.programma(VS_SCAFO, FS_SCAFO);
    this.P.ombra = this.programma(VS_OMBRA, FS_OMBRA);
    this.P.copia = this.programma(VS_PIENO, FS_COPIA);
    this.P.luci = this.programma(VS_LUCI, FS_LUCI);
    this.P.giu = this.programma(VS_PIENO, FS_GIU);
    this.P.su = this.programma(VS_PIENO, FS_SU);
    this.P.finale = this.programma(VS_PIENO, FS_FINALE);

    this.vaoPieno = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoPieno);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    for (const nome of ["forno", "cielo", "fuso", "fascio", "giu", "su", "finale", "copia"]) {
      const loc = gl.getAttribLocation(this.P[nome].p, "a");
      if (loc >= 0) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      }
    }
    this.luci = (() => {
      const vao = gl.createVertexArray()!;
      gl.bindVertexArray(vao);
      const b = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(4 * 16), gl.DYNAMIC_DRAW);
      const lP = gl.getAttribLocation(this.P.luci.p, "aP"), lI = gl.getAttribLocation(this.P.luci.p, "aI");
      gl.enableVertexAttribArray(lP);
      gl.vertexAttribPointer(lP, 3, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(lI);
      gl.vertexAttribPointer(lI, 1, gl.FLOAT, false, 16, 12);
      return { vao, b };
    })();
  }

  /** Carica la nave: la forma (santa-maria.bin), i suoi punti (santa-maria.json) e la tessitura dello scafo.
   *  `base` è la cartella, con la barra in fondo. */
  async carica(base: string): Promise<void> {
    const gl = this.gl;
    const immagine = (nome: string) =>
      new Promise<HTMLImageElement>((risolvi, rifiuta) => {
        const i = new Image();
        i.onload = () => risolvi(i);
        i.onerror = () => rifiuta(new Error(`Manca la tessitura della nave: ${nome}`));
        i.src = `${base}${nome}.webp`;
      });
    const scarica = async (nome: string) => {
      const r = await fetch(base + nome);
      if (!r.ok) throw new Error(`Manca la nave dell'intro: ${nome}`);
      return r;
    };
    const [forma, dati, colore, ruvido, metallo, rilievo] = await Promise.all([
      scarica("santa-maria.bin").then((r) => r.arrayBuffer()),
      scarica("santa-maria.json").then((r) => r.json() as Promise<DatiNave>),
      immagine("colore"),
      immagine("ruvido"),
      immagine("metallo"),
      immagine("rilievo"),
    ]);
    const testa = new DataView(forma, 0, 16);
    if (testa.getUint32(0, true) !== 0x314e4d53) throw new Error("La nave dell'intro non è nel formato atteso");
    const punti = testa.getUint32(4, true), opachi = testa.getUint32(8, true), pennacchi = testa.getUint32(12, true);
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(forma, 16, punti * 24), gl.STATIC_DRAW);
    for (let k = 0; k < 4; k++) gl.enableVertexAttribArray(k);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(1, 4, gl.BYTE, true, 24, 12);
    gl.vertexAttribPointer(2, 2, gl.UNSIGNED_SHORT, true, 24, 16);
    gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 24, 20);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(forma, 16 + punti * 24, opachi + pennacchi), gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    const fine = gl.getExtension("EXT_texture_filter_anisotropic");
    const tessitura = (img: HTMLImageElement, interno: number, formato: number) => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, interno, formato, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // lo scafo si guarda quasi sempre di striscio
      if (fine) gl.texParameterf(gl.TEXTURE_2D, fine.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(fine.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number));
      return tex;
    };
    this.nave = {
      vao,
      opachi,
      pennacchi,
      colore: tessitura(colore, gl.SRGB8_ALPHA8, gl.RGBA),
      ruvido: tessitura(ruvido, gl.R8, gl.RED),
      metallo: tessitura(metallo, gl.R8, gl.RED),
      rilievo: tessitura(rilievo, gl.R8, gl.RED),
      dati,
    };
    this.ombre.clear();
  }

  /** Prepara in anticipo il cielo di un quadro (le stelle si calcolano una volta). */
  prepara(q: Quadro): void {
    this.cielo(q);
    this.polvereDi(q);
    // l'ombra della nave, per il sole di questa ripresa: si calcola adesso, e non al primo fotogramma
    if (this.nave && (q === "scala" || q === "margine")) this.ombraDi(q === "scala" ? "poppa" : "prua");
  }

  // ---- un fotogramma -------------------------------------------------------------
  /** Disegna il quadro `q` all'istante `t`. */
  quadro(q: Quadro, t: number, opz: OpzioniQuadro = {}): void {
    this.dimensiona(!!opz.ridotta);
    const B = this.B!;
    this.disegna(q, t, B.scena, opz);
    this.finale(0, this.bagliore(B.scena), Math.floor(t * 24), opz);
  }

  /** Il movimento ridotto: due quadri fermi e una dissolvenza (0 il primo, 1 il secondo). */
  dissolvenza(q: Quadro, tA: number, tB: number, misto: number, opz: OpzioniQuadro = {}): void {
    this.dimensiona(!!opz.ridotta);
    const B = this.B!;
    this.disegna(q, tA, B.scena, opz);
    this.disegna(q, tB, B.scenaB, opz);
    this.finale(misto, this.bagliore(misto < 0.5 ? B.scena : B.scenaB), 0, opz);
  }

  /** Dove cade la nave sullo schermo (0–1, dall'alto a sinistra), e quanto è larga. */
  proietta(q: Quadro, t: number, aspetto = 16 / 9): { x: number; y: number; larghezza: number; davanti: boolean } {
    const cam = inquadratura(q, t);
    const avanti = cam.avanti, destra = norm(croce(avanti, [0, 1, 0])), su = croce(destra, avanti);
    const d: V3 = [cam.nave[0] - cam.pos[0], cam.nave[1] - cam.pos[1], cam.nave[2] - cam.pos[2]];
    const z = d[0] * avanti[0] + d[1] * avanti[1] + d[2] * avanti[2];
    const tanX = Math.tan(cam.fov / 2), tanY = tanX / aspetto;
    const x = (d[0] * destra[0] + d[1] * destra[1] + d[2] * destra[2]) / z / tanX;
    const y = (d[0] * su[0] + d[1] * su[1] + d[2] * su[2]) / z / tanY;
    const larga = cam.sprite ? LARGHEZZA_NAVE[cam.sprite] : 0;
    return { x: 0.5 + x / 2, y: 0.5 - y / 2, larghezza: larga / z / tanX / 2, davanti: z > 0 };
  }

  /** Una direzione del cielo vista dall'oblò della plancia all'istante t: dove cade (nel quadro, -1…1,
   *  prima dell'ottica) e se il fuso la copre. Serve all'intro per le stelle che si spengono. */
  cieloDallOblo(dir: V3, t: number): { x: number; y: number; coperta: boolean } {
    const cam = inquadratura("plancia", t);
    const avanti = cam.avanti, destra = norm(croce(avanti, [0, 1, 0])), su = croce(destra, avanti);
    const z = dir[0] * avanti[0] + dir[1] * avanti[1] + dir[2] * avanti[2];
    const tan = Math.tan(cam.fov / 2);
    const x = (dir[0] * destra[0] + dir[1] * destra[1] + dir[2] * destra[2]) / z / tan;
    const y = (dir[0] * su[0] + dir[1] * su[1] + dir[2] * su[2]) / z / tan;
    return { x, y, coperta: colpisceIlFuso(cam.pos, dir) };
  }

  /** La direzione del cielo che dall'oblò cade nel punto (x, y) del quadro (-1…1) all'istante t. */
  direzioneDallOblo(x: number, y: number, t: number): V3 {
    const cam = inquadratura("plancia", t);
    const avanti = cam.avanti, destra = norm(croce(avanti, [0, 1, 0])), su = croce(destra, avanti);
    const tan = Math.tan(cam.fov / 2);
    return norm(somma(avanti, somma(per(destra, x * tan), per(su, y * tan))));
  }

  distruggi(): void {
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  // ---- interni ---------------------------------------------------------------------
  private shader(tipo: number, sorgente: string) {
    const gl = this.gl;
    const s = gl.createShader(tipo)!;
    gl.shaderSource(s, sorgente);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  }

  private programma(vs: string, fs: string): Programma {
    const gl = this.gl;
    const p = gl.createProgram()!;
    gl.attachShader(p, this.shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, this.shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "programma");
    const u: Programma["u"] = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i)!;
      u[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  /** Il cielo di un quadro: la Via Lattea passa accanto alla punta del fuso, inclinata
   *  di 62°, con il nucleo dentro il quadro; le stelle più fitte vicino alla banda. */
  private cielo(q: Quadro): Cielo {
    const chiave = q === "scala" ? "scala" : q;
    const fatto = this.cieli.get(chiave);
    if (fatto) return fatto;
    const gl = this.gl;
    const avanti = direzioneCielo(q), destra = norm(croce(avanti, [0, 1, 0])), su = croce(destra, avanti);
    const d0 = norm(somma(avanti, somma(per(destra, 0.2), per(su, 0.02))));
    const ang = (62 * Math.PI) / 180;
    const tang = norm(somma(per(destra, Math.cos(ang)), per(su, Math.sin(ang))));
    const polo = norm(croce(d0, tang));
    const r = generatore(1972), dati: number[] = [];
    // le temperature: poche arancio, qualcuna avorio, le più bianche fredde o azzurre
    const colore = () => {
      const temp = r();
      return temp < 0.07 ? [1.0, 0.66, 0.40] : temp < 0.24 ? [1.0, 0.88, 0.74] : temp < 0.70 ? [0.90, 0.95, 1.0] : [0.62, 0.76, 1.0];
    };
    const direzione = (): V3 => {
      const z = r() * 2 - 1, f = r() * Math.PI * 2, s = Math.sqrt(1 - z * z);
      return [s * Math.cos(f), z, s * Math.sin(f)];
    };
    const latitudine = (d: V3) => Math.asin(d[0] * polo[0] + d[1] * polo[1] + d[2] * polo[2]);
    for (let i = 0; i < 36000; i++) {
      let d: V3;
      do d = direzione();
      while (r() > 0.22 + 0.78 * Math.exp(-((latitudine(d) / 0.2) ** 2)));
      const c = colore();
      // le grandezze come in un cielo vero: moltissime deboli, poche forti, pochissime grandi
      dati.push(d[0], d[1], d[2], c[0], c[1], c[2], Math.min(7, 0.02 / Math.max(r(), 1e-4)));
    }
    for (let i = 0; i < 140000; i++) {
      let d: V3;
      for (;;) {
        d = direzione();
        const lat = latitudine(d);
        if (Math.abs(lat) > 0.32) continue;
        const nubi = rumoreJs(d[0] * 16 + 40, d[1] * 16 + 40, d[2] * 16 + 40) * 0.65 + rumoreJs(d[0] * 45 + 9, d[1] * 45 + 9, d[2] * 45 + 9) * 0.35;
        if (r() < Math.exp(-((lat / 0.09) ** 2)) * nubi ** 2.4) break;
      }
      const c = colore();
      dati.push(d[0], d[1], d[2], c[0], c[1], c[2], 0.008 + r() ** 3 * 0.10);
    }
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dati), gl.STATIC_DRAW);
    const lD = gl.getAttribLocation(this.P.stelle.p, "aDir"), lC = gl.getAttribLocation(this.P.stelle.p, "aCol");
    gl.enableVertexAttribArray(lD);
    gl.vertexAttribPointer(lD, 3, gl.FLOAT, false, 28, 0);
    gl.enableVertexAttribArray(lC);
    gl.vertexAttribPointer(lC, 4, gl.FLOAT, false, 28, 12);
    const cielo: Cielo = { polo, centro: d0, stelle: { vao, n: dati.length / 7 }, rif: { destra, su, avanti }, forno: null };
    this.cieli.set(chiave, cielo);
    return cielo;
  }

  /** Il forno: la Via Lattea e il fondo del cielo di un quadro, calcolati una volta in una tessitura
   *  che copre tutto quello che il quadro può vedere (l'obiettivo più largo, che è quello dell'inizio).
   *  Si rifà solo se cambia la misura della tela o la qualità. */
  private inforna(q: Quadro, cielo: Cielo, w: number, h: number, ridotta: boolean): NonNullable<Cielo["forno"]> {
    const quadrata = q === "plancia";
    const per = `${w}x${h}`;
    if (cielo.forno && cielo.forno.per === per && cielo.forno.ridotta === ridotta) return cielo.forno;
    const gl = this.gl, P = this.P.forno;
    if (cielo.forno) {
      gl.deleteTexture(cielo.forno.tex);
      gl.deleteFramebuffer(cielo.forno.fb);
    }
    // l'oblò è quadrato, e la camera della plancia gli si accosta: più punti di quanti ne ha lo schermo.
    // Sugli schermi molto grandi il forno si ferma a 1.920 punti: le nubi sono morbide, e la memoria no
    const lato = Math.min(1536, Math.round(h * 1.5));
    const k = Math.min(1, 1920 / w);
    const W = quadrata ? lato : Math.round(w * k), H = quadrata ? lato : Math.round(h * k);
    const tanX = Math.tan(inquadratura(q, 0).fov / 2) * 1.01, tanY = quadrata ? tanX : (tanX * H) / W;
    const b = this.bersaglio(W, H);
    gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    gl.useProgram(P.p);
    gl.uniform3fv(P.u.uDestra, cielo.rif.destra);
    gl.uniform3fv(P.u.uSu, cielo.rif.su);
    gl.uniform3fv(P.u.uAvanti, cielo.rif.avanti);
    gl.uniform2f(P.u.uTan, tanX, tanY);
    gl.uniform2f(P.u.uSca, 1, 1);
    gl.uniform2f(P.u.uOff, 0, 0);
    gl.uniform3fv(P.u.uPolo, cielo.polo);
    gl.uniform3fv(P.u.uCentroGal, cielo.centro);
    gl.uniform1i(P.u.uOttave, ridotta ? 4 : 6);
    gl.uniform1f(P.u.uCod, this.hdr ? 0 : 1);
    gl.bindVertexArray(this.vaoPieno);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // rimpicciolita (nell'oblò, da lontano) non deve brulicare
    if (quadrata) {
      gl.bindTexture(gl.TEXTURE_2D, b.tex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
    cielo.forno = { ...b, tan: [tanX, tanY], ridotta, per };
    return cielo.forno;
  }

  /** Il faro di un quadro. Dove la nave si vede da fuori, la luce parte dalla sua lente vera. */
  private faro(q: Quadro, gradi = 0) {
    const f = faroDi(q, gradi);
    return this.nave && (q === "scala" || q === "margine") ? { ...f, origine: this.nave.dati.luci.faro } : f;
  }

  /** La polvere intorno alla rotta, e un velo più fitto dove passa il fascio. */
  private polvereDi(q: Quadro) {
    const fatto = this.polvere.get(q);
    if (fatto) return fatto;
    const gl = this.gl;
    const FARO = this.faro(q);
    const r = generatore(7), dati: number[] = [];
    for (let i = 0; i < 1600; i++) dati.push(lerp(-500, 420, r()), lerp(-130, 150, r()), lerp(-230, 420, r()), r());
    const fd = FARO.direzione, fu = norm(croce(fd, [0, 1, 0])), fv = croce(fu, fd);
    // nella plancia il fascio cerca: la polvere sta in un cono più largo
    const largo = q === "plancia" ? 3.4 : 1.3;
    for (let i = 0; i < (q === "plancia" ? 2600 : 1400); i++) {
      const s = 40 + r() ** 1.6 * 260, raggio = Math.tan(FARO.apertura) * s * largo * Math.sqrt(r()), a = r() * Math.PI * 2;
      const p = somma(FARO.origine, somma(per(fd, s), somma(per(fu, Math.cos(a) * raggio), per(fv, Math.sin(a) * raggio))));
      dati.push(p[0], p[1], p[2], r());
    }
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dati), gl.STATIC_DRAW);
    const l = gl.getAttribLocation(this.P.polvere.p, "aP");
    gl.enableVertexAttribArray(l);
    gl.vertexAttribPointer(l, 4, gl.FLOAT, false, 0, 0);
    const p = { vao, n: dati.length / 4 };
    this.polvere.set(q, p);
    return p;
  }

  private bersaglio(w: number, h: number): Bersaglio {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, this.formato.interno, w, h, 0, gl.RGBA, this.formato.tipo, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fb, w, h };
  }

  private dimensiona(ridotta: boolean) {
    // la misura del canvas senza le trasformazioni CSS
    const k = Math.min(devicePixelRatio || 1, 2) * (ridotta ? 0.5 : 1);
    const w = Math.max(320, Math.round(this.canvas.clientWidth * k)), h = Math.max(180, Math.round(this.canvas.clientHeight * k));
    if (this.B && this.B.w === w && this.B.h === h) return;
    const gl = this.gl;
    if (this.B) {
      for (const b of [this.B.scena, this.B.scenaB, ...this.B.catena]) {
        gl.deleteTexture(b.tex);
        gl.deleteFramebuffer(b.fb);
      }
    }
    if (this.strato) {
      gl.deleteFramebuffer(this.strato.fb);
      gl.deleteRenderbuffer(this.strato.colore);
      gl.deleteRenderbuffer(this.strato.fondo);
      gl.deleteTexture(this.strato.risolto.tex);
      gl.deleteFramebuffer(this.strato.risolto.fb);
      this.strato = null;
    }
    this.canvas.width = w;
    this.canvas.height = h;
    const catena: Bersaglio[] = [];
    let cw = w, ch = h;
    for (let i = 0; i < 6; i++) {
      cw = Math.max(1, cw >> 1);
      ch = Math.max(1, ch >> 1);
      catena.push(this.bersaglio(cw, ch));
    }
    this.B = { w, h, scena: this.bersaglio(w, h), scenaB: this.bersaglio(w, h), catena };
  }

  /** Lo strato della nave: un bersaglio con la profondità e quattro campioni per punto (i bordi lisci),
   *  e la tessitura in cui si raccoglie. */
  private stratoNave(w: number, h: number): Strato {
    if (this.strato && this.strato.w === w && this.strato.h === h) return this.strato;
    const gl = this.gl;
    const possibili = gl.getInternalformatParameter(gl.RENDERBUFFER, this.formato.interno, gl.SAMPLES) as Int32Array | null;
    let campioni = possibili && possibili.length ? Math.min(4, possibili[0]) : 0;
    const fb = gl.createFramebuffer()!, colore = gl.createRenderbuffer()!, fondo = gl.createRenderbuffer()!;
    for (;;) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, colore);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, campioni, this.formato.interno, w, h);
      gl.bindRenderbuffer(gl.RENDERBUFFER, fondo);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, campioni, gl.DEPTH_COMPONENT24, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colore);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, fondo);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE || campioni === 0) break;
      campioni = 0; // questa scheda non liscia i bordi in questo formato: si fa senza
    }
    this.strato = { fb, colore, fondo, risolto: this.bersaglio(w, h), w, h };
    return this.strato;
  }

  /** L'ombra della nave per un sole: la nave vista da lì, una volta sola (la nave non gira). */
  private ombraDi(chi: "poppa" | "prua"): Ombra {
    const fatta = this.ombre.get(chi);
    if (fatta) return fatta;
    const gl = this.gl, N = this.nave!, lato = 2048, R = N.dati.raggio;
    const f = per(SOLE_NAVE[chi], -1), r = norm(croce(f, [0, 1, 0])), u = croce(r, f);
    const vp = [r[0] / R, u[0] / R, f[0] / R, 0, r[1] / R, u[1] / R, f[1] / R, 0, r[2] / R, u[2] / R, f[2] / R, 0, 0, 0, 0, 1];
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, lato, lato, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    gl.drawBuffers([gl.NONE]);
    gl.readBuffer(gl.NONE);
    gl.viewport(0, 0, lato, lato);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.P.ombra.p);
    gl.uniformMatrix4fv(this.P.ombra.u.uLuceVP, false, vp);
    gl.bindVertexArray(N.vao);
    gl.drawElements(gl.TRIANGLES, N.opachi, gl.UNSIGNED_INT, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    const ombra = { tex, vp };
    this.ombre.set(chi, ombra);
    return ombra;
  }

  private matriceVP(cam: Inquadratura, destra: V3, su: V3, avanti: V3, aspetto: number, ot: Ottica, n = 0.5, fr = 200000) {
    const fx = 1 / Math.tan(cam.fov / 2), fy = fx * aspetto;
    const p = cam.pos;
    const V = [destra[0], su[0], -avanti[0], 0, destra[1], su[1], -avanti[1], 0, destra[2], su[2], -avanti[2], 0,
      -(destra[0] * p[0] + destra[1] * p[1] + destra[2] * p[2]), -(su[0] * p[0] + su[1] * p[1] + su[2] * p[2]),
      avanti[0] * p[0] + avanti[1] * p[1] + avanti[2] * p[2], 1];
    const Pm = [fx, 0, 0, 0, 0, fy, 0, 0, 0, 0, (fr + n) / (n - fr), -1, 0, 0, (2 * fr * n) / (n - fr), 0];
    const out = new Array<number>(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += Pm[k * 4 + r] * V[c * 4 + k];
    // l'ottica, dopo la proiezione: x' = x · sca + off · w
    for (let c = 0; c < 4; c++) {
      out[c * 4] = out[c * 4] * ot.sca[0] + out[c * 4 + 3] * ot.off[0];
      out[c * 4 + 1] = out[c * 4 + 1] * ot.sca[1] + out[c * 4 + 3] * ot.off[1];
    }
    return out;
  }

  private disegna(q: Quadro, t: number, verso: Bersaglio, opz: OpzioniQuadro) {
    const gl = this.gl, P = this.P, B = this.B!;
    const ridotta = !!opz.ridotta;
    const cam = inquadratura(q, t, opz.faro ?? 0, opz.faroGradi ?? 0);
    const FARO = this.faro(q, cam.faroGradi ?? 0);
    const cielo = this.cielo(q);
    const forno = this.inforna(q, cielo, B.w, B.h, ridotta);
    const aspetto = B.w / B.h;
    const avanti = cam.avanti, destra = norm(croce(avanti, [0, 1, 0])), su = croce(destra, avanti);
    const ot: Ottica = opz.ottica ?? { sca: [1, 1], off: [0, 0] };
    const tanX = Math.tan(cam.fov / 2), tanY = ot.quadrata ? tanX : tanX / aspetto;
    const VP = this.matriceVP(cam, destra, su, avanti, ot.quadrata ? 1 : aspetto, ot);

    gl.bindFramebuffer(gl.FRAMEBUFFER, verso.fb);
    gl.viewport(0, 0, verso.w, verso.h);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    // fuori dal ritaglio (l'oblò) il quadro è nero, e non si calcola
    gl.disable(gl.SCISSOR_TEST);
    if (ot.ritaglio) {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const [rx, ry, rw, rh] = ot.ritaglio;
      const x0 = Math.max(0, Math.floor(rx * verso.w)), x1 = Math.min(verso.w, Math.ceil((rx + rw) * verso.w));
      const y0 = Math.max(0, Math.floor((1 - ry - rh) * verso.h)), y1 = Math.min(verso.h, Math.ceil((1 - ry) * verso.h));
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0));
    }
    const vista = (prog: Programma) => {
      gl.uniform3fv(prog.u.uDestra, destra);
      gl.uniform3fv(prog.u.uSu, su);
      gl.uniform3fv(prog.u.uAvanti, avanti);
      gl.uniform2f(prog.u.uTan, tanX, tanY);
      gl.uniform2f(prog.u.uSca, ot.sca[0], ot.sca[1]);
      gl.uniform2f(prog.u.uOff, ot.off[0], ot.off[1]);
    };

    // 1. il cielo
    gl.useProgram(P.cielo.p);
    vista(P.cielo);
    gl.uniform3fv(P.cielo.u.uRifDestra, cielo.rif.destra);
    gl.uniform3fv(P.cielo.u.uRifSu, cielo.rif.su);
    gl.uniform3fv(P.cielo.u.uRifAvanti, cielo.rif.avanti);
    gl.uniform2f(P.cielo.u.uRifTan, forno.tan[0], forno.tan[1]);
    gl.uniform1f(P.cielo.u.uCod, this.hdr ? 0 : 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, forno.tex);
    gl.uniform1i(P.cielo.u.uForno, 0);
    gl.bindVertexArray(this.vaoPieno);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 2. le stelle (additive)
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P.stelle.p);
    vista(P.stelle);
    gl.uniform1f(P.stelle.u.uScala, Math.max(0.75, verso.h / 1080));
    gl.bindVertexArray(cielo.stelle.vao);
    gl.drawArrays(gl.POINTS, 0, cielo.stelle.n);

    // 3. il fuso: copre tutto quello che sta dietro
    if (cam.fuso) {
      const asse: V3 = [0, Math.sin(FUSO.inclinazione), Math.cos(FUSO.inclinazione)];
      const A = somma(FUSO.centro, per(asse, -FUSO.semiLunghezza)), Bp = somma(FUSO.centro, per(asse, FUSO.semiLunghezza));
      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(P.fuso.p);
      vista(P.fuso);
      gl.uniform3fv(P.fuso.u.uPos, cam.pos);
      gl.uniform3fv(P.fuso.u.uA, A);
      gl.uniform3fv(P.fuso.u.uB, Bp);
      gl.uniform1f(P.fuso.u.uW, FUSO.semiLarghezza);
      gl.uniform1f(P.fuso.u.uPix, (2 * tanX) / (verso.w * ot.sca[0]));
      gl.bindVertexArray(this.vaoPieno);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // 4. il fascio del faro (additivo)
    const O = somma(cam.nave, FARO.origine);
    gl.blendFunc(gl.ONE, gl.ONE);
    if (cam.faro) {
      gl.useProgram(P.fascio.p);
      vista(P.fascio);
      gl.uniform3fv(P.fascio.u.uPos, cam.pos);
      gl.uniform3fv(P.fascio.u.uO, O);
      gl.uniform3fv(P.fascio.u.uD, FARO.direzione);
      gl.uniform1f(P.fascio.u.uCos, Math.cos(FARO.apertura));
      gl.uniform1f(P.fascio.u.uPortata, FARO.portata);
      gl.uniform1f(P.fascio.u.uI, cam.luceFaro ?? 0.01);
      gl.uniform1f(P.fascio.u.uT, t);
      gl.bindVertexArray(this.vaoPieno);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // 5. la polvere (solo dove c'è luce che la mostra)
    if (cam.polvere !== false) {
      const pv = this.polvereDi(q);
      gl.useProgram(P.polvere.p);
      gl.uniformMatrix4fv(P.polvere.u.uVP, false, VP);
      gl.uniform3fv(P.polvere.u.uPos, cam.pos);
      gl.uniform3fv(P.polvere.u.uO, O);
      gl.uniform3fv(P.polvere.u.uD, FARO.direzione);
      gl.uniform3fv(P.polvere.u.uSole, SOLE);
      // nella plancia la polvere del fascio viaggia con la nave, perché il faro la trovi
      gl.uniform3fv(P.polvere.u.uSposta, q === "plancia" ? cam.nave : [0, 0, 0]);
      gl.uniform1f(P.polvere.u.uCos, Math.cos(FARO.apertura * 1.4));
      gl.uniform1f(P.polvere.u.uPortata, FARO.portata);
      gl.uniform1f(P.polvere.u.uAltezza, verso.h * ot.sca[1]);
      gl.uniform1f(P.polvere.u.uT, t);
      gl.bindVertexArray(pv.vao);
      gl.drawArrays(gl.POINTS, 0, pv.n);
    }

    // 6. la nave vera, nel suo strato, e poi sulla scena; 7. le sue luci, nei loro punti
    const N = this.nave;
    if (cam.sprite && N) {
      const chi = cam.sprite, L = N.dati.luci;
      const occhio: V3 = [cam.pos[0] - cam.nave[0], cam.pos[1] - cam.nave[1], cam.pos[2] - cam.nave[2]];
      const lontana = Math.hypot(occhio[0], occhio[1], occhio[2]);
      // i fanali respirano; la spinta trema appena, e nella scala si spegne; il faro è acceso dove cerca
      const respiro = 0.55 + 0.45 * Math.sin((t * 2 * Math.PI) / 2.6) ** 2;
      const R = reattori(q, t);
      const spinta = (0.92 + 0.08 * Math.sin(t * 9.1) * Math.sin(t * 3.7)) * R.forza;
      const ombra = this.ombraDi(chi);
      const S = this.stratoNave(verso.w, verso.h);
      // la profondità si misura intorno alla nave: precisa da vicino come a diciotto chilometri
      const VPn = this.matriceVP(cam, destra, su, avanti, ot.quadrata ? 1 : aspetto, ot, Math.max(0.5, lontana - N.dati.raggio * 1.2), lontana + N.dati.raggio * 1.2);
      gl.disable(gl.SCISSOR_TEST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, S.fb);
      gl.viewport(0, 0, S.w, S.h);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.BLEND);
      const Ps = P.scafo;
      gl.useProgram(Ps.p);
      gl.uniformMatrix4fv(Ps.u.uVP, false, VPn);
      gl.uniformMatrix4fv(Ps.u.uLuceVP, false, ombra.vp);
      gl.uniform3fv(Ps.u.uCentro, cam.nave);
      gl.uniform3fv(Ps.u.uOcchio, occhio);
      gl.uniform3fv(Ps.u.uSole, SOLE_NAVE[chi]);
      gl.uniform3f(Ps.u.uSoleLuce, LUCE_NAVE.sole[0], LUCE_NAVE.sole[1], LUCE_NAVE.sole[2]);
      gl.uniform3f(Ps.u.uCieloLuce, LUCE_NAVE.cielo[0], LUCE_NAVE.cielo[1], LUCE_NAVE.cielo[2]);
      gl.uniform4f(Ps.u.uLuci, LUCE_NAVE.oblo, LUCE_NAVE.fanali * respiro, LUCE_NAVE.uscita, cam.faro ? LUCE_NAVE.faro : 0.25);
      gl.uniform2f(Ps.u.uTexel, 1 / N.dati.tessitura[0], 1 / N.dati.tessitura[1]);
      gl.uniform1f(Ps.u.uPendenza, N.dati.pendenza);
      gl.uniform1f(Ps.u.uSpinta, LUCE_NAVE.spinta * spinta);
      gl.uniform1f(Ps.u.uLunga, R.lunga);
      gl.uniform1f(Ps.u.uBrace, R.brace);
      gl.uniform1f(Ps.u.uT, t);
      const tessiture: [string, WebGLTexture][] = [["uColore", N.colore], ["uRuvido", N.ruvido], ["uMetallo", N.metallo], ["uRilievo", N.rilievo], ["uOmbra", ombra.tex]];
      tessiture.forEach(([nome, tex], k) => {
        gl.activeTexture(gl.TEXTURE0 + k);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(Ps.u[nome], k);
      });
      gl.bindVertexArray(N.vao);
      gl.drawElements(gl.TRIANGLES, N.opachi, gl.UNSIGNED_INT, 0);
      // la spinta: luce che si somma, senza coprire niente
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE);
      gl.depthMask(false);
      gl.drawElements(gl.TRIANGLES, N.pennacchi, gl.UNSIGNED_INT, N.opachi * 4);
      gl.depthMask(true);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0);
      // i quattro campioni per punto si raccolgono in uno, e lo strato si posa sulla scena
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, S.fb);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, S.risolto.fb);
      gl.blitFramebuffer(0, 0, S.w, S.h, 0, 0, S.w, S.h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, verso.fb);
      gl.viewport(0, 0, verso.w, verso.h);
      if (ot.ritaglio) gl.enable(gl.SCISSOR_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(P.copia.p);
      gl.bindTexture(gl.TEXTURE_2D, S.risolto.tex);
      gl.uniform1i(P.copia.u.uTex, 0);
      gl.bindVertexArray(this.vaoPieno);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // 7. gli aloni delle luci: solo se la luce guarda la camera (i fanali e la spinta da poppa, l'oblò da prua)
      const verso_ = (p: V3, n: V3) => {
        const d = norm([occhio[0] - p[0], occhio[1] - p[1], occhio[2] - p[2]]);
        return clamp01((d[0] * n[0] + d[1] * n[1] + d[2] * n[2]) * 4);
      };
      const aloni = (punti: [V3, number][], tinta: V3) => {
        const vivi = punti.filter(([, forza]) => forza > 0.001);
        if (!vivi.length) return;
        const dati = new Float32Array(vivi.length * 4);
        vivi.forEach(([p, forza], k) => dati.set([cam.nave[0] + p[0], cam.nave[1] + p[1], cam.nave[2] + p[2], forza], k * 4));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.luci.b);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, dati);
        gl.uniform3fv(P.luci.u.uTinta, tinta);
        gl.drawArrays(gl.POINTS, 0, vivi.length);
      };
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(P.luci.p);
      gl.uniformMatrix4fv(P.luci.u.uVP, false, VP);
      gl.uniform1f(P.luci.u.uAltezza, verso.h * ot.sca[1]);
      gl.bindVertexArray(this.luci.vao);
      const dietro: V3 = [-1, 0, 0];
      aloni([...L.fanali.map((p): [V3, number] => [p, 2.2 * respiro * verso_(p, dietro)]), [L["oblò"], 0.9 * verso_(L["oblò"], [1, 0, 0])]], [1.0, 0.62, 0.22]);
      aloni([[L.uscita, 0.5 * verso_(L.uscita, [0, 0, 1])]], [1.0, 0.86, 0.45]);
      // da lontano la spinta non copre il respiro dei fanali
      aloni(L.scarichi.map((p): [V3, number] => [p, 0.7 * LUCE_NAVE.spinta * spinta * verso_(p, dietro) * Math.min(1, 700 / lontana)]), [0.55, 0.75, 1.0]);
      aloni(L.scarichi.map((p): [V3, number] => [p, 0.3 * R.brace * verso_(p, dietro) * Math.min(1, 400 / lontana)]), [1.0, 0.32, 0.08]);
    }
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
  }

  private bagliore(sorgente: Bersaglio): Bersaglio {
    const gl = this.gl, P = this.P, B = this.B!;
    gl.disable(gl.BLEND);
    let prima = sorgente;
    gl.useProgram(P.giu.p);
    for (const b of B.catena) {
      gl.uniform1f(P.giu.u.uSoglia, b === B.catena[0] ? 0.02 : 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, b.fb);
      gl.viewport(0, 0, b.w, b.h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, prima.tex);
      gl.uniform1i(P.giu.u.uTex, 0);
      gl.uniform2f(P.giu.u.uTexel, 1 / prima.w, 1 / prima.h);
      gl.bindVertexArray(this.vaoPieno);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      prima = b;
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(P.su.p);
    for (let i = B.catena.length - 1; i > 0; i--) {
      const da = B.catena[i], a = B.catena[i - 1];
      gl.bindFramebuffer(gl.FRAMEBUFFER, a.fb);
      gl.viewport(0, 0, a.w, a.h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, da.tex);
      gl.uniform1i(P.su.u.uTex, 0);
      gl.uniform2f(P.su.u.uTexel, 1 / da.w, 1 / da.h);
      gl.bindVertexArray(this.vaoPieno);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.disable(gl.BLEND);
    return B.catena[0];
  }

  private finale(misto: number, bag: Bersaglio, seme: number, opz: OpzioniQuadro) {
    const gl = this.gl, P = this.P, B = this.B!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, B.w, B.h);
    gl.useProgram(P.finale.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, B.scena.tex);
    gl.uniform1i(P.finale.u.uScena, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, B.scenaB.tex);
    gl.uniform1i(P.finale.u.uScenaB, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, bag.tex);
    gl.uniform1i(P.finale.u.uBagliore, 2);
    gl.uniform1f(P.finale.u.uMisto, misto);
    gl.uniform1f(P.finale.u.uBag, 0.085);
    gl.uniform1f(P.finale.u.uEsp, 1.55);
    gl.uniform1f(P.finale.u.uGrana, opz.grana === false ? 0 : 0.022);
    gl.uniform1f(P.finale.u.uSeme, seme);
    gl.uniform1f(P.finale.u.uLuce, opz.luce ?? 1);
    gl.uniform1f(P.finale.u.uVignetta, opz.vignetta === false ? 0 : 1);
    gl.bindVertexArray(this.vaoPieno);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
