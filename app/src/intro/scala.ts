// ============================================================================
//  Il motore della scala: lo spazio dell'intro in WebGL2, con shader propri.
//  È il motore della prova di look (progettazione/09-prova-di-look.html), lo
//  stesso codice portato in un modulo: la scena E è già al livello finale, e
//  qui disegna anche il margine (B). La Santa Maria è uno still canonico
//  scontornato, su un piano nello spazio (2,5D); il fuso, le stelle, la Via
//  Lattea, la polvere, il fascio del faro e la luce sono calcolati.
//
//  Il mondo è in metri. X è la rotta della Santa Maria, Y l'alto, Z il fianco
//  destro.
// ============================================================================

export type Quadro = "scala" | "margine" | "oblo" | "faro";
type V3 = [number, number, number];

interface Inquadratura {
  pos: V3;
  nave: V3;
  fov: number;
  avanti: V3;
  sprite: "poppa" | "prua" | null;
  faro: boolean;
  fuso: boolean;
  polvere?: boolean;
  luceFaro?: number;
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
const faroDi = (q: Quadro) => ({
  origine: [44, 7, -3] as V3,
  apertura: (3.2 * Math.PI) / 180,
  portata: 210,
  direzione: q === "faro" ? norm([Math.cos((-64 * Math.PI) / 180), 0.02, Math.sin((-64 * Math.PI) / 180)]) : norm([1, -0.03, -0.02]),
});

/** La scala (E): 0–3 s segue la nave a 165 m; 3–23 s arretra fino a 18 km, a
 *  velocità costante in scala logaritmica, con un avvio e un arresto morbidi;
 *  l'obiettivo passa da 44° a 40°. */
function camera(t: number): Inquadratura {
  const u = clamp01((t - 3) / 20);
  const e = 0.5 - 0.5 * Math.cos(Math.PI * Math.pow(u, 0.8));
  const D = Math.exp(lerp(Math.log(165), Math.log(18000), e));
  const fov = (lerp(44, 40, e) * Math.PI) / 180;
  const nave: V3 = [NAVE.velocita * t, 0, 0];
  return { pos: somma(nave, per(DIREZIONE, -D)), nave, fov, avanti: DIREZIONE, sprite: "poppa", faro: true, fuso: true };
}

/** I quadri. `t` è il tempo del quadro, in secondi. */
export function inquadratura(q: Quadro, t: number): Inquadratura {
  if (q === "margine") {
    // la nave avanza; la camera, davanti e a babordo, è ferma
    const nave: V3 = [NAVE.velocita * 3 * (t - 4), 0, 0];
    const pos: V3 = [640, 55, -660];
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

// ============================================================================
//  Gli shader (identici alla prova di look)
// ============================================================================
const TESTA = `#version 300 es
precision highp float;
`;
const VS_PIENO = TESTA + `
in vec2 a; out vec2 uv;
void main(){ uv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;
const VISTA = `
uniform vec3 uDestra, uSu, uAvanti;
uniform vec2 uTan;
vec3 vista(vec2 uv){ vec2 p = (uv * 2.0 - 1.0) * uTan; return normalize(uDestra * p.x + uSu * p.y + uAvanti); }`;
const RUMORE = `
float hash13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float rumore(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 x, int ottave){ float v = 0.0, a = 0.5; for (int k = 0; k < 8; k++){ if (k >= ottave) break; v += a * rumore(x); x = x * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return v; }`;

const FS_CIELO = TESTA + VISTA + RUMORE + `
in vec2 uv; out vec4 o;
uniform vec3 uPolo, uCentroGal;
uniform int uOttave;
void main(){
  vec3 d = vista(uv);
  vec3 x = normalize(uCentroGal - uPolo * dot(uCentroGal, uPolo));
  vec3 y = cross(uPolo, x);
  float lon = atan(dot(d, y), dot(d, x));
  float lat = asin(clamp(dot(d, uPolo), -1.0, 1.0));
  float nucleo = exp(-pow(lon / 0.9, 2.0));
  float larghezza = 0.075 + 0.085 * nucleo;
  float sfrangia = (fbm(d * 7.0 + 2.0, 3) - 0.5) * 0.6;
  float banda = exp(-pow(lat / (larghezza * (1.0 + sfrangia)), 2.0));
  vec3 o3 = vec3(0.0);
  if (banda > 0.002) {
    vec3 q = d * 9.0;
    vec3 w = vec3(fbm(q + 3.1, 3), fbm(q + 7.7, 3), fbm(q + 1.3, 3));
    float nubi = fbm(d * 16.0 + w * 1.2, uOttave);
    float nubiFini = fbm(d * 44.0 + w * 2.0 + 9.0, uOttave);
    float luce = banda * (0.10 + 1.35 * pow(nubi, 2.6)) * (0.55 + 0.9 * nubiFini * nubiFini);
    float fenditura = smoothstep(0.40, 0.70, fbm(d * 10.0 + w * 1.8 + 11.0, uOttave)) * exp(-pow((lat + 0.012) / (larghezza * 0.42), 2.0));
    float filamenti = smoothstep(0.52, 0.80, fbm(d * 30.0 + w * 2.6 + 4.0, uOttave));
    luce *= (1.0 - 0.93 * fenditura) * (1.0 - 0.55 * filamenti * banda);
    vec3 bianco = vec3(0.86, 0.89, 1.0), caldo = vec3(1.0, 0.84, 0.66), ruggine = vec3(0.55, 0.36, 0.26);
    vec3 tinta = mix(bianco, caldo, nucleo * 0.85);
    tinta = mix(tinta, ruggine, clamp(fenditura * 0.5 + filamenti * 0.25, 0.0, 1.0) * 0.5);
    o3 = tinta * luce * (0.020 + 0.060 * nucleo);
  }
  o3 += vec3(0.0016, 0.0021, 0.0032) * (0.8 + 0.4 * fbm(d * 3.0, 3));
  o = vec4(o3, 1.0);
}`;

const VS_STELLE = TESTA + `
in vec3 aDir; in vec4 aCol;
uniform vec3 uDestra, uSu, uAvanti; uniform vec2 uTan; uniform float uScala;
out vec4 col; out float dim;
void main(){
  vec3 c = vec3(dot(aDir, uDestra), dot(aDir, uSu), dot(aDir, uAvanti));
  if (c.z <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  gl_Position = vec4(c.xy / c.z / uTan, 0.0, 1.0);
  dim = clamp(1.6 + sqrt(aCol.a) * 6.0, 1.5, 9.0) * uScala;
  gl_PointSize = dim;
  col = aCol;
}`;
const FS_STELLE = TESTA + `
in vec4 col; in float dim; out vec4 o;
void main(){
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float r2 = dot(p, p) * dim * dim * 0.25;
  float psf = exp(-r2 / 0.9) + 0.05 * exp(-r2 / 9.0) * smoothstep(0.3, 1.0, col.a);
  o = vec4(col.rgb * col.a * psf, 1.0);
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
uniform mat4 uVP; uniform vec3 uPos, uO, uD, uSole; uniform float uCos, uPortata, uAltezza, uT;
out float lum;
void main(){
  vec3 p = aP.xyz + vec3(sin(uT * 0.11 + aP.w * 7.0), cos(uT * 0.07 + aP.w * 3.0), sin(uT * 0.05 + aP.w)) * 1.2;
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

const VS_NAVE = TESTA + `
in vec2 a; out vec2 uv;
uniform mat4 uVP; uniform vec3 uCentro, uDestra, uSu; uniform vec2 uMezza;
void main(){
  uv = vec2(a.x * 0.5 + 0.5, 0.5 - a.y * 0.5);
  vec3 p = uCentro + uDestra * a.x * uMezza.x + uSu * a.y * uMezza.y;
  gl_Position = uVP * vec4(p, 1.0);
}`;
const FS_NAVE = TESTA + `
in vec2 uv; out vec4 o;
uniform sampler2D uTex; uniform float uEsp;
void main(){
  vec4 c = texture(uTex, uv);
  vec3 lin = pow(max(c.rgb, 0.0), vec3(2.2));
  float l = dot(lin, vec3(0.2126, 0.7152, 0.0722));
  lin = mix(vec3(l), lin, 0.82) * vec3(0.94, 0.97, 1.04);
  o = vec4(lin * uEsp, c.a);
}`;

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
in float lum; out vec4 o;
void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float r = dot(p, p);
  o = vec4(vec3(1.0, 0.62, 0.22) * lum * (exp(-r * 18.0) * 1.0 + exp(-r * 4.0) * 0.08), 1.0); }`;

const FS_GIU = TESTA + `
in vec2 uv; out vec4 o; uniform sampler2D uTex; uniform vec2 uTexel;
void main(){
  vec3 c = texture(uTex, uv).rgb * 0.5;
  c += texture(uTex, uv + uTexel * vec2(-1, -1)).rgb * 0.125; c += texture(uTex, uv + uTexel * vec2(1, -1)).rgb * 0.125;
  c += texture(uTex, uv + uTexel * vec2(-1, 1)).rgb * 0.125;  c += texture(uTex, uv + uTexel * vec2(1, 1)).rgb * 0.125;
  o = vec4(c, 1.0);
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
uniform sampler2D uScena, uScenaB, uBagliore; uniform float uMisto, uBag, uEsp, uGrana, uSeme, uLuce;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec3 c = mix(texture(uScena, uv).rgb, texture(uScenaB, uv).rgb, uMisto);
  c += texture(uBagliore, uv).rgb * uBag;
  c = aces(c * uEsp);
  vec2 v = uv - 0.5; c *= 1.0 - 0.32 * smoothstep(0.25, 0.85, dot(v * vec2(1.25, 1.0), v * vec2(1.25, 1.0)) * 2.0);
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
interface Sprite {
  img: HTMLImageElement;
  tex: WebGLTexture | null;
  aspetto: number;
  larghezza: number;
  esp: number;
}
interface Cielo {
  polo: V3;
  centro: V3;
  stelle: { vao: WebGLVertexArrayObject; n: number };
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

export interface OpzioniQuadro {
  /** metà della risoluzione e meno ottave nel cielo */
  ridotta?: boolean;
  /** 0 nero, 1 pieno */
  luce?: number;
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
  private sprite: Record<"poppa" | "prua", Sprite>;

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error("Questo sistema non ha WebGL2.");
    this.gl = gl;
    this.hdr = !!gl.getExtension("EXT_color_buffer_float");
    this.formato = this.hdr ? { interno: gl.RGBA16F, tipo: gl.HALF_FLOAT } : { interno: gl.RGBA8, tipo: gl.UNSIGNED_BYTE };
    this.P.cielo = this.programma(VS_PIENO, FS_CIELO);
    this.P.stelle = this.programma(VS_STELLE, FS_STELLE);
    this.P.fuso = this.programma(VS_PIENO, FS_FUSO);
    this.P.fascio = this.programma(VS_PIENO, FS_FASCIO);
    this.P.polvere = this.programma(VS_POLVERE, FS_POLVERE);
    this.P.nave = this.programma(VS_NAVE, FS_NAVE);
    this.P.luci = this.programma(VS_LUCI, FS_LUCI);
    this.P.giu = this.programma(VS_PIENO, FS_GIU);
    this.P.su = this.programma(VS_PIENO, FS_SU);
    this.P.finale = this.programma(VS_PIENO, FS_FINALE);

    this.vaoPieno = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoPieno);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    for (const nome of ["cielo", "fuso", "fascio", "giu", "su", "finale", "nave"]) {
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
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(8), gl.DYNAMIC_DRAW);
      const lP = gl.getAttribLocation(this.P.luci.p, "aP"), lI = gl.getAttribLocation(this.P.luci.p, "aI");
      gl.enableVertexAttribArray(lP);
      gl.vertexAttribPointer(lP, 3, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(lI);
      gl.vertexAttribPointer(lI, 1, gl.FLOAT, false, 16, 12);
      return { vao, b };
    })();
    this.sprite = {
      poppa: { img: new Image(), tex: null, aspetto: 0.5, larghezza: 96, esp: 0.62 },
      prua: { img: new Image(), tex: null, aspetto: 0.4, larghezza: 112, esp: 0.52 },
    };
  }

  /** Carica gli still scontornati della nave. */
  async carica(poppa: string, prua: string): Promise<void> {
    const gl = this.gl;
    await Promise.all(
      (["poppa", "prua"] as const).map(
        (k) =>
          new Promise<void>((risolvi, rifiuta) => {
            const s = this.sprite[k];
            s.img.onload = () => {
              s.tex = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, s.tex);
              gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s.img);
              gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
              gl.generateMipmap(gl.TEXTURE_2D);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              s.aspetto = s.img.height / s.img.width;
              risolvi();
            };
            s.img.onerror = () => rifiuta(new Error(`Manca l'immagine della nave: ${k}`));
            s.img.src = k === "poppa" ? poppa : prua;
          }),
      ),
    );
  }

  /** Prepara in anticipo il cielo di un quadro (le stelle si calcolano una volta). */
  prepara(q: Quadro): void {
    this.cielo(q);
    this.polvereDi(q);
  }

  // ---- un fotogramma -------------------------------------------------------------
  /** Disegna il quadro `q` all'istante `t`. */
  quadro(q: Quadro, t: number, opz: OpzioniQuadro = {}): void {
    this.dimensiona(!!opz.ridotta);
    const B = this.B!;
    this.disegna(q, t, B.scena, !!opz.ridotta);
    this.finale(0, this.bagliore(B.scena), Math.floor(t * 24), opz.luce ?? 1);
  }

  /** Il movimento ridotto: due quadri fermi e una dissolvenza (0 il primo, 1 il secondo). */
  dissolvenza(q: Quadro, tA: number, tB: number, misto: number, opz: OpzioniQuadro = {}): void {
    this.dimensiona(!!opz.ridotta);
    const B = this.B!;
    this.disegna(q, tA, B.scena, !!opz.ridotta);
    this.disegna(q, tB, B.scenaB, !!opz.ridotta);
    this.finale(misto, this.bagliore(misto < 0.5 ? B.scena : B.scenaB), 0, opz.luce ?? 1);
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
    const sp = cam.sprite ? this.sprite[cam.sprite] : { larghezza: 0 };
    return { x: 0.5 + x / 2, y: 0.5 - y / 2, larghezza: sp.larghezza / z / tanX / 2, davanti: z > 0 };
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
    const colore = () => {
      const temp = r();
      return temp < 0.12 ? [1.0, 0.72, 0.48] : temp < 0.4 ? [1.0, 0.9, 0.78] : temp < 0.85 ? [0.95, 0.97, 1.0] : [0.72, 0.82, 1.0];
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
      dati.push(d[0], d[1], d[2], c[0], c[1], c[2], 0.01 + r() ** 9 * 2.6);
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
      dati.push(d[0], d[1], d[2], c[0], c[1], c[2], 0.004 + r() ** 3 * 0.05);
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
    const cielo = { polo, centro: d0, stelle: { vao, n: dati.length / 7 } };
    this.cieli.set(chiave, cielo);
    return cielo;
  }

  /** La polvere intorno alla rotta, e un velo più fitto dove passa il fascio. */
  private polvereDi(q: Quadro) {
    const fatto = this.polvere.get(q);
    if (fatto) return fatto;
    const gl = this.gl;
    const FARO = faroDi(q);
    const r = generatore(7), dati: number[] = [];
    for (let i = 0; i < 1600; i++) dati.push(lerp(-500, 420, r()), lerp(-130, 150, r()), lerp(-230, 420, r()), r());
    const fd = FARO.direzione, fu = norm(croce(fd, [0, 1, 0])), fv = croce(fu, fd);
    for (let i = 0; i < 1400; i++) {
      const s = 40 + r() ** 1.6 * 260, raggio = Math.tan(FARO.apertura) * s * 1.3 * Math.sqrt(r()), a = r() * Math.PI * 2;
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
    const r = this.canvas.getBoundingClientRect();
    const k = Math.min(devicePixelRatio || 1, 2) * (ridotta ? 0.5 : 1);
    const w = Math.max(320, Math.round(r.width * k)), h = Math.max(180, Math.round(r.height * k));
    if (this.B && this.B.w === w && this.B.h === h) return;
    const gl = this.gl;
    if (this.B) {
      for (const b of [this.B.scena, this.B.scenaB, ...this.B.catena]) {
        gl.deleteTexture(b.tex);
        gl.deleteFramebuffer(b.fb);
      }
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

  private matriceVP(cam: Inquadratura, destra: V3, su: V3, avanti: V3, aspetto: number) {
    const fx = 1 / Math.tan(cam.fov / 2), fy = fx * aspetto, n = 0.5, fr = 200000;
    const p = cam.pos;
    const V = [destra[0], su[0], -avanti[0], 0, destra[1], su[1], -avanti[1], 0, destra[2], su[2], -avanti[2], 0,
      -(destra[0] * p[0] + destra[1] * p[1] + destra[2] * p[2]), -(su[0] * p[0] + su[1] * p[1] + su[2] * p[2]),
      avanti[0] * p[0] + avanti[1] * p[1] + avanti[2] * p[2], 1];
    const Pm = [fx, 0, 0, 0, 0, fy, 0, 0, 0, 0, (fr + n) / (n - fr), -1, 0, 0, (2 * fr * n) / (n - fr), 0];
    const out = new Array<number>(16).fill(0);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += Pm[k * 4 + r] * V[c * 4 + k];
    return out;
  }

  private disegna(q: Quadro, t: number, verso: Bersaglio, ridotta: boolean) {
    const gl = this.gl, P = this.P, B = this.B!;
    const cam = inquadratura(q, t);
    const FARO = faroDi(q);
    const cielo = this.cielo(q);
    const aspetto = B.w / B.h;
    const avanti = cam.avanti, destra = norm(croce(avanti, [0, 1, 0])), su = croce(destra, avanti);
    const tanX = Math.tan(cam.fov / 2), tanY = tanX / aspetto;
    const VP = this.matriceVP(cam, destra, su, avanti, aspetto);

    gl.bindFramebuffer(gl.FRAMEBUFFER, verso.fb);
    gl.viewport(0, 0, verso.w, verso.h);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    const vista = (prog: Programma) => {
      gl.uniform3fv(prog.u.uDestra, destra);
      gl.uniform3fv(prog.u.uSu, su);
      gl.uniform3fv(prog.u.uAvanti, avanti);
      gl.uniform2f(prog.u.uTan, tanX, tanY);
    };

    // 1. il cielo
    gl.useProgram(P.cielo.p);
    vista(P.cielo);
    gl.uniform3fv(P.cielo.u.uPolo, cielo.polo);
    gl.uniform3fv(P.cielo.u.uCentroGal, cielo.centro);
    gl.uniform1i(P.cielo.u.uOttave, ridotta ? 4 : 6);
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
      gl.uniform1f(P.fuso.u.uPix, (2 * tanX) / verso.w);
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
      gl.uniform1f(P.polvere.u.uCos, Math.cos(FARO.apertura * 1.4));
      gl.uniform1f(P.polvere.u.uPortata, FARO.portata);
      gl.uniform1f(P.polvere.u.uAltezza, verso.h);
      gl.uniform1f(P.polvere.u.uT, t);
      gl.bindVertexArray(pv.vao);
      gl.drawArrays(gl.POINTS, 0, pv.n);
    }

    // 6. la nave
    const sp = cam.sprite ? this.sprite[cam.sprite] : null;
    if (sp && sp.tex) {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(P.nave.p);
      gl.uniformMatrix4fv(P.nave.u.uVP, false, VP);
      gl.uniform3fv(P.nave.u.uCentro, cam.nave);
      gl.uniform3fv(P.nave.u.uDestra, destra);
      gl.uniform3fv(P.nave.u.uSu, su);
      gl.uniform2f(P.nave.u.uMezza, sp.larghezza / 2, (sp.larghezza * sp.aspetto) / 2);
      gl.uniform1f(P.nave.u.uEsp, sp.esp);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sp.tex);
      gl.uniform1i(P.nave.u.uTex, 0);
      gl.bindVertexArray(this.vaoPieno);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    if (sp && sp.tex && cam.sprite === "poppa") {
      // 7. i fanali di poppa: sul piano della nave, agli angoli alti della poppa, e respirano
      const mezza = [sp.larghezza / 2, (sp.larghezza * sp.aspetto) / 2];
      const sulPiano = (u: number, v: number) => somma(cam.nave, somma(per(destra, (u * 2 - 1) * mezza[0]), per(su, (1 - v * 2) * mezza[1])));
      const respiro = 0.55 + 0.45 * Math.sin((t * 2 * Math.PI) / 2.6) ** 2;
      const L1 = sulPiano(0.082, 0.208), L2 = sulPiano(0.368, 0.192);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.luci.b);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([...L1, 2.2 * respiro, ...L2, 2.2 * respiro]));
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(P.luci.p);
      gl.uniformMatrix4fv(P.luci.u.uVP, false, VP);
      gl.uniform1f(P.luci.u.uAltezza, verso.h);
      gl.bindVertexArray(this.luci.vao);
      gl.drawArrays(gl.POINTS, 0, 2);
    }
    gl.disable(gl.BLEND);
  }

  private bagliore(sorgente: Bersaglio): Bersaglio {
    const gl = this.gl, P = this.P, B = this.B!;
    gl.disable(gl.BLEND);
    let prima = sorgente;
    gl.useProgram(P.giu.p);
    for (const b of B.catena) {
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

  private finale(misto: number, bag: Bersaglio, seme: number, luce: number) {
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
    gl.uniform1f(P.finale.u.uGrana, 0.022);
    gl.uniform1f(P.finale.u.uSeme, seme);
    gl.uniform1f(P.finale.u.uLuce, luce);
    gl.bindVertexArray(this.vaoPieno);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
