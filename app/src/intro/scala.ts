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
//  Dal 16 novembre 2026 (le note dell'autore sulla beta 13) ci sono tre quadri
//  nuovi: il passaggio (B, la nave che passa accanto alla camera con i
//  reattori accesi) e due dettagli in F (i sensori, con il radar che gira; il
//  faro che cerca). Nei dettagli il faro e la barra del radar si muovono: il
//  modello porta il numero del pezzo nel quarto ottetto della normale
//  (strumenti/nave/modello.py, PARTI), e gli shader li girano intorno ai perni.
//  Dopo la beta 14 (documento 09, §20): le fiamme dei reattori sono lunghe e si
//  vedono anche di fianco; il fascio del faro nasce largo quanto la lente; da
//  vicino il metallo ha la sua grana, i suoi spigoli e una luce di taglio; nei
//  dettagli la camera fa un carrello lentissimo e il pulviscolo attraversa il
//  fascio; nel margine la nave è grande il doppio; il passaggio ha il suo cielo.
//
//  Il mondo è in metri. X è la rotta della Santa Maria, Y l'alto, Z il fianco
//  destro.
// ============================================================================

export type Quadro = "scala" | "margine" | "oblo" | "faro" | "plancia" | "passaggio" | "sensori" | "cerca";
type V3 = [number, number, number];
/** il sole della nave, e la sua mappa d'ombra: uno per ripresa */
type Sole = "poppa" | "prua" | "passaggio";
/** I pezzi che si muovono, in radianti: il faro gira (intorno all'asse verticale) e alza la lampada (intorno
 *  all'asse delle forcelle); la barra del radar gira sul suo albero. */
export interface Parti {
  giro: number;
  alzo: number;
  radar: number;
}

interface Inquadratura {
  pos: V3;
  nave: V3;
  fov: number;
  avanti: V3;
  /** la nave si vede, e con quale sole: da poppa (la scala e i dettagli), da prua (il margine), il passaggio;
   *  nell'oblò non c'è */
  sprite: Sole | null;
  faro: boolean;
  fuso: boolean;
  polvere?: boolean;
  luceFaro?: number;
  /** solo la plancia: di quanti gradi il faro si sposta dalla sua direzione */
  faroGradi?: number;
  /** i dettagli: i pezzi che si muovono */
  parti?: Parti;
  /** i dettagli: l'ombra si rifà a ogni fotogramma (i pezzi si muovono), stretta intorno a quello che si vede */
  ombraStretta?: { centro: V3; raggio: number };
  /** il cielo di questo quadro si guarda da un'altra parte (il passaggio: un'altra regione dello stesso cielo) */
  cieloVerso?: V3;
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
// Il passaggio: da dietro, a sinistra e dall'alto, perché prenda il fianco sinistro, il dorso e la poppa.
const SOLE_NAVE: Record<Sole, V3> = { poppa: norm([-0.6, 0.45, 0.66]), prua: norm([0.34, 0.6, -0.72]), passaggio: norm([-0.45, 0.55, -0.7]) };
// quanto erano larghi gli still di prima, in metri: `proietta` lo dice ancora all'intro, che ci regola i tempi
const LARGHEZZA_NAVE: Record<Sole, number> = { poppa: 96, prua: 112, passaggio: 112 };
const rad = (gradi: number) => (gradi * Math.PI) / 180;
/** Il riflesso dell'obiettivo: sopra quale luce nasce la striscia (in unità della scena, prima dell'esposizione) e
 *  quanto pesa nel quadro. Sobrio: deve sembrare un obiettivo, non un effetto. */
const RIFLESSO = { soglia: 0.85, forza: 0.7 };
/** La fiamma dei reattori: nel modello è lunga 5 m (strumenti/nave/modello.py); nell'intro 14, perché si veda anche
 *  da lontano e di fianco (l'autore, 16 novembre 2026: «si dovrebbero comunque intravedere le fiamme dei reattori
 *  anche se è da lontano»). Il suo bagliore sta a `bagliore` metri dietro gli scarichi. */
const FIAMMA = { nelModello: 5, lunga: 14, bagliore: 5.5 };
// la fotografia della nave: quanto è forte il sole (appena caldo), quanta luce fredda viene dal cielo, e le sue
// luci (l'oblò, i fanali, la luce dell'uscita, la lente del faro acceso, la spinta dei quattro scarichi)
// (la lente del faro da lontano è un punto, e deve bucare; nei dettagli è grande mezzo quadro: esposta così le si
// vedono il centro caldo e gli anelli)
const LUCE_NAVE = { sole: [1.7, 1.63, 1.52], cielo: [0.02, 0.03, 0.055], oblo: 3.0, fanali: 6.0, uscita: 4.0, faro: 14.0, faroVicino: 1.9, spinta: 0.6 };
/** Il riflettore visto dall'oblò (l'autore, 14 novembre 2026: «il faro non è laterale come lo mostriamo nella
 *  sequenza, ma è sopra l'area di plancia, perpendicolare all'oblò stesso. La luce deve venire frontalmente»).
 *  Sta dov'è nel progetto della nave (strumenti/nave/misure.py, FARO: sul dorso, nove metri dietro il muso e
 *  quattro sopra l'oblò), e guarda dove guarda l'oblò: da dentro si vede la luce scendere dall'alto del vetro
 *  e andare dritta davanti, verso il punto in cui si perde. */
const FARO_SUL_DORSO = { su: 4.2, dietro: 9 };
/** La lente del faro, nel modello: quanto è larga (il raggio, in metri) e quanto sta dentro il fanale, dietro il suo
 *  bordo (strumenti/nave/modello.py, `dorso`). Il fascio nasce da lei, largo quanto lei. */
const LENTE = { raggio: 0.56, dentro: 0.3, asse: norm([1, -0.07, 0]) };
const faroDi = (q: Quadro, gradi = 0): { origine: V3; apertura: number; portata: number; direzione: V3; raggio?: number } => {
  const apertura = (3.2 * Math.PI) / 180;
  if (q === "faro" || q === "plancia") {
    const dritto = azimut(OBLO.gradi, OBLO.elev);
    return {
      origine: somma(somma(OBLO.pos, [0, FARO_SUL_DORSO.su, 0]), per(dritto, -FARO_SUL_DORSO.dietro)),
      apertura,
      portata: 210,
      // quando cerca si sposta di poco, di lato e appena in alto: resta davanti
      direzione: azimut(OBLO.gradi + gradi, OBLO.elev + gradi * 0.1),
    };
  }
  return { origine: [44, 7, -3], apertura, portata: 210, direzione: norm([1, -0.03, -0.02]) };
};

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

/** Il passaggio (B, sul messaggio di Yusuf; l'autore, 16 novembre 2026: «Potremmo inventare una nuova
 *  inquadratura dove vediamo la nave da un'altra angolazione che passa accanto alla telecamera? ovviamente la nave
 *  in questa fase ha i reattori accesi e lo sfondo di stelle deve essere diverso»). La camera è ferma, a babordo
 *  della rotta e qualche metro sopra; la nave arriva da dietro, le scivola accanto ed entra dal bordo destro, poi si
 *  allontana mostrando la poppa con i quattro scarichi accesi. Va alla velocità del margine. Il cielo è quello del
 *  margine visto da un'altra parte: le stesse stelle, un'altra regione del cielo. */
export const PASSAGGIO = {
  // la nave entra un secondo prima di come entrava nella beta 14 (lì c'erano quattro secondi di cielo vuoto)
  parte: -17,
  velocita: 7,
  camera: [0, 4.5, -26] as V3,
  guarda: norm([1, -0.035, 0.13]),
  fov: 50,
  // il cielo: quello del margine, guardato dove passa il braccio lontano della Via Lattea (senza il nucleo): la
  // direzione vera del quadro dava una regione quasi vuota. In coordinate della galassia del margine (gradi)
  cielo: { latitudine: 9, longitudine: 158 },
};
function passaggio(t: number): Inquadratura {
  const P = PASSAGGIO;
  return {
    pos: P.camera,
    nave: [P.parte + P.velocita * t, 0, 0],
    fov: rad(P.fov),
    avanti: P.guarda,
    sprite: "passaggio",
    faro: false,
    fuso: false,
    polvere: false,
    cieloVerso: nelCieloDelMargine(P.cielo.latitudine, P.cielo.longitudine),
  };
}

/** I pezzi che si muovono nei dettagli di F, nel tempo della scala (che continua dopo i suoi 23,5 s): il radar fa un
 *  giro ogni sei secondi e mezzo; il faro cerca piano, nove gradi per parte in undici secondi, e alza e abbassa
 *  appena la lampada (più su che giù: sotto il mezzo grado lo spigolo della base le spunta dentro la lente). Lenti,
 *  come chi cerca qualcosa che non sa dove sia. */
export function partiDi(t: number): Parti {
  return { giro: rad(9) * Math.sin((2 * Math.PI * t) / 11), alzo: rad(0.5) + rad(1.1) * Math.sin((2 * Math.PI * t) / 7.3), radar: rad(24) + (2 * Math.PI * t) / 6.5 };
}

/** I dettagli di F (l'autore, 16 novembre 2026: «una animazione di dettaglio, tipo inquadratura che mostra sensori e
 *  faro che si muovono alla ricerca»). La nave è quella della scala, nel suo tempo: avanza per inerzia, a reattori
 *  spenti, verso il relitto. La camera le sta addosso, bassa sul dorso, a dritta (il lato che il sole prende), e
 *  guarda avanti e in su: davanti c'è il fuso nero, alto fino a 22° sopra l'orizzonte, e sopra il suo bordo le
 *  stelle. L'obiettivo è largo, perché stiano nel quadro gli strumenti vicini e il bordo lontano. I sensori: il radar
 *  che gira, il faro più avanti. Il faro: la lampada che cerca, e il fascio che entra nel buio. */
// Dopo la beta 14: i sensori si guardano da più avanti (nella beta 14 un dente del collare di presa, vicinissimo e in
// ombra, faceva una scatola scura in basso a sinistra); il faro si guarda da davanti e di lato, con la lente accesa, il
// radar che gira dietro e il fascio che esce dal quadro verso il buio (era di spalle, quasi tutto nero). In tutti e due
// la camera fa un carrello lentissimo (metri al secondo, dal secondo `da` della scala): gli strumenti vicini scorrono
// appena contro quello che sta lontano.
const SENSORI = { da: [24.2, 6.8, 4.6] as V3, verso: [34, 7.75, -2.5] as V3, fov: 70, t0: 24, carrello: [0.08, 0, -0.03] as V3 };
// il faro: da dritta, poco davanti alla lente (a sessanta gradi dal suo asse: più di fronte, il fascio visto quasi
// d'infilata diventa una foschia; così è una colonna di luce che attraversa mezzo quadro ed esce a destra)
const CERCA = { da: [35.0, 7.3, 6.2] as V3, verso: [31.2, 5.9, -0.6] as V3, fov: 55, t0: 38, carrello: [-0.05, 0.01, -0.06] as V3 };
function dettaglio(q: "sensori" | "cerca", t: number): Inquadratura {
  const D = q === "sensori" ? SENSORI : CERCA;
  const nave: V3 = [NAVE.velocita * t, 0, 0];
  const da = somma(D.da, per(D.carrello, t - D.t0));
  return {
    pos: somma(nave, da),
    nave,
    fov: rad(D.fov),
    avanti: verso(D.da, D.verso),
    sprite: "poppa",
    faro: true,
    fuso: true,
    polvere: true,
    luceFaro: q === "cerca" ? 0.07 : 0.026,
    parti: partiDi(t),
    ombraStretta: q === "sensori" ? { centro: [29, 6.8, 0], raggio: 13 } : { centro: [27, 7, 0], raggio: 14 },
  };
}

/** Il quadro largo della fine, «anche poco più largo» (l'autore, 16 novembre 2026): la camera della scala arretra
 *  ancora un poco e l'obiettivo si apre appena (non oltre i 44° per cui il cielo è cotto). `k` da 0 a 1. */
export function allargamento(k: number): { distanza: number; fov: number } {
  return { distanza: 1 + 0.16 * k, fov: 1 + 0.085 * k };
}
function allargata(cam: Inquadratura, a: { distanza: number; fov: number }): Inquadratura {
  const d: V3 = [cam.pos[0] - cam.nave[0], cam.pos[1] - cam.nave[1], cam.pos[2] - cam.nave[2]];
  return { ...cam, pos: somma(cam.nave, per(d, a.distanza)), fov: cam.fov * a.fov };
}

/** I reattori nella scala (l'autore, 14 novembre 2026: «dovremmo fare un effetto di spegnimento dei reattori,
 *  per una questione di realismo la nave continuerà comunque ad avvicinarsi per inerzia»). Accesi all'inizio,
 *  mentre la camera è vicina; poi si spengono in due secondi scarsi, con due singhiozzi, e la fiamma si
 *  accorcia; negli scarichi resta la brace, che si raffredda piano. La nave non rallenta. Gli stessi due
 *  momenti vanno al motore audio (scaletta.ts, `reattori`): il re del reattore muore con la fiamma. */
export const SPEGNIMENTO = { quando: 1.3, dura: 1.9, brace: 3.4 };
export function reattori(q: Quadro, t: number): { forza: number; lunga: number; brace: number } {
  // nei dettagli di F i reattori sono spenti da un pezzo, e la brace è fredda
  if (q === "sensori" || q === "cerca") return { forza: 0, lunga: 0.2, brace: 0 };
  if (q !== "scala") return { forza: 1, lunga: 1, brace: 0 };
  const u = clamp01((t - SPEGNIMENTO.quando) / SPEGNIMENTO.dura);
  if (u <= 0) return { forza: 1, lunga: 1, brace: 0 };
  const cala = Math.pow(1 - u, 1.6);
  const singhiozzi = 1 - 0.6 * Math.exp(-(((u - 0.16) / 0.045) ** 2)) - 0.45 * Math.exp(-(((u - 0.4) / 0.04) ** 2));
  const dopo = Math.max(0, t - SPEGNIMENTO.quando - SPEGNIMENTO.dura);
  return { forza: cala * Math.max(0, singhiozzi), lunga: 0.2 + 0.8 * cala, brace: Math.min(1, u * 2.5) * Math.exp(-dopo / SPEGNIMENTO.brace) };
}

/** Il margine: da dove guardava la camera (la direzione resta quella), e quanto si è avvicinata. */
const MARGINE = { da: [395, 49, -429] as V3, avanti: verso([395, 49, -429], [-60, 38, 0]), vicino: 0.5 };
/** La galassia del cielo del margine (le stesse formule di `cielo`): una direzione data in latitudine e longitudine
 *  galattiche, in gradi. Longitudine 0 è il nucleo, che sta nel quadro del margine; 180 il braccio dalla parte opposta. */
function nelCieloDelMargine(latitudine: number, longitudine: number): V3 {
  const avanti = MARGINE.avanti, destra = norm(croce(avanti, [0, 1, 0])), su = croce(destra, avanti);
  const d0 = norm(somma(avanti, somma(per(destra, 0.2), per(su, 0.02))));
  const ang = rad(62);
  const polo = norm(croce(d0, norm(somma(per(destra, Math.cos(ang)), per(su, Math.sin(ang))))));
  const x = norm(somma(d0, per(polo, -(d0[0] * polo[0] + d0[1] * polo[1] + d0[2] * polo[2]))));
  const y = croce(polo, x);
  const b = rad(latitudine), l = rad(longitudine);
  return norm(somma(somma(per(x, Math.cos(b) * Math.cos(l)), per(y, Math.cos(b) * Math.sin(l))), per(polo, Math.sin(b))));
}

/** I quadri. `t` è il tempo del quadro, in secondi. */
export function inquadratura(q: Quadro, t: number, faro = 0, faroGradi = 0): Inquadratura {
  if (q === "plancia") return oblo(t, faro, faroGradi);
  if (q === "passaggio") return passaggio(t);
  if (q === "sensori" || q === "cerca") return dettaglio(q, t);
  if (q === "margine") {
    // la nave avanza; la camera, davanti e a babordo, è ferma. Con la nave vera, lunga ottanta metri, sta a
    // due terzi della distanza di prima sulla stessa retta: la nave tiene nel quadro il posto che aveva lo still
    // Dopo la beta 14 la camera sta a metà strada sulla stessa geometria (tutto scalato di un mezzo intorno alla rotta):
    // guarda dalla stessa parte, e il cielo è quello di prima, ma la nave è grande il doppio nel quadro
    const nave: V3 = [NAVE.velocita * 3 * (t - 4), 0, 0];
    return { pos: per(MARGINE.da, MARGINE.vicino), nave, fov: (34 * Math.PI) / 180, avanti: MARGINE.avanti, sprite: "prua", faro: false, fuso: false, polvere: false };
  }
  if (q === "oblo" || q === "faro") {
    const faro = q === "faro";
    const pos: V3 = faro ? [12, 5, 6] : [40, 9, -1];
    return { pos, nave: [0, 0, 0], fov: (52 * Math.PI) / 180, avanti: azimut(-60, 2), sprite: null, faro, fuso: true, polvere: faro, luceFaro: 0.034 };
  }
  return camera(t);
}

/** La direzione di riferimento del cielo: dove guarda il quadro (per la scala, alla fine), o dove guarda il suo cielo. */
const direzioneCielo = (q: Quadro): V3 => {
  if (q === "scala") return DIREZIONE;
  const cam = inquadratura(q, 0);
  return cam.cieloVerso ?? cam.avanti;
};
/** I quadri nuovi non hanno stelle loro (costerebbero quasi un secondo ciascuno): usano quelle di un altro quadro,
 *  viste dalla loro parte. Il passaggio quelle del margine, i dettagli quelle della scala (lo stesso cielo del
 *  quadro largo che li circonda). */
const CIELO_DI: Partial<Record<Quadro, Quadro>> = { passaggio: "margine", sensori: "scala", cerca: "scala" };

// ---- i pezzi che si muovono: matrici 4×4 per colonne, come le vuole WebGL -----------------------------
type M4 = number[];
const IDENTITA: M4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function molt(a: M4, b: M4): M4 {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
const sposta = (v: V3): M4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, v[0], v[1], v[2], 1];
/** intorno all'asse verticale (Y): positivo, la prua va verso babordo */
const giraY = (a: number): M4 => [Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1];
/** intorno all'asse Z (le forcelle del faro): positivo, la lampada alza il muso */
const giraZ = (a: number): M4 => [Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const intorno = (perno: V3, m: M4): M4 => molt(sposta(perno), molt(m, sposta([-perno[0], -perno[1], -perno[2]])));
export const applica = (m: M4, p: V3, w = 1): V3 => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12] * w,
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13] * w,
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14] * w,
];
/** Le quattro matrici dei pezzi (0 lo scafo, fermo; 1 le forcelle del faro; 2 la lampada; 3 la barra del radar). */
export function matriciParti(parti: Parti | undefined, perni: { faro: V3; radar: V3 } | undefined): M4[] {
  if (!parti || !perni) return [IDENTITA, IDENTITA, IDENTITA, IDENTITA];
  const forcelle = intorno(perni.faro, giraY(parti.giro));
  const lampada = intorno(perni.faro, molt(giraY(parti.giro), giraZ(parti.alzo)));
  return [IDENTITA, forcelle, lampada, intorno(perni.radar, giraY(parti.radar - rad(24)))];
}

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

/** Il punto in cui un raggio da `da` nella direzione `dir` incontra il fuso, o null. */
export function puntoDelFuso(da: V3, dir: V3): V3 | null {
  let t = 0;
  for (let i = 0; i < 200; i++) {
    const p = somma(da, per(dir, t));
    const h = distanzaDalFuso(p);
    if (h < 0.0002 * Math.max(t, 1)) return p;
    t += h * 0.9;
    if (t > 200000) break;
  }
  return null;
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
uniform vec3 uPos, uO, uD; uniform float uCos, uPortata, uI, uT, uD0;
// Il cono. Dove la nave si vede da fuori il fascio nasce dalla lente, larga quanto è: il vertice del cono (uO) sta
// dietro di lei di uD0 metri, e la luce comincia al piano della lente (prima era un cono che nasceva da un punto: un
// raggio sottile che usciva da un fanale molto più grande, l'autore, 16 novembre 2026)
bool cono(vec3 ro, vec3 rd, out float ta, out float tb){
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
bool intervallo(vec3 ro, vec3 rd, out float ta, out float tb){
  if (!cono(ro, rd, ta, tb)) return false;
  if (uD0 > 0.0) {
    float cv = dot(ro - uO, uD), dv = dot(rd, uD);
    if (abs(dv) < 1e-6) return cv >= uD0;
    float tl = (uD0 - cv) / dv;
    if (dv > 0.0) ta = max(ta, tl); else tb = min(tb, tl);
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
    if (asse <= uD0) continue;
    float coseno = asse / max(length(op), 1e-3);
    float bordo = smoothstep(uCos, mix(uCos, 1.0, 0.55), coseno);
    float lungo = asse - uD0;
    float cala = 1.0 / (1.0 + pow(lungo / 26.0, 2.0)) * exp(-lungo / (uPortata * 0.55));
    float polvere = 0.30 + 0.70 * smoothstep(0.35, 0.85, rumore(p * 0.06 + vec3(0.0, 0.0, uT * 0.4)));
    luce += vec3(1.0, 0.93, 0.80) * bordo * cala * polvere * dt;
  }
  float g = 0.35, ct = dot(uD, -rd);
  float fase = (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * ct, 1.5);
  o = vec4(luce * uI * fase, 1.0);
}`;

const VS_POLVERE = TESTA + `
in vec4 aP;
uniform mat4 uVP; uniform vec3 uPos, uO, uD, uSole, uSposta; uniform float uCos, uPortata, uAltezza, uT, uD0; uniform vec2 uDa;
out float lum;
void main(){
  vec3 p = aP.xyz + uSposta + vec3(sin(uT * 0.11 + aP.w * 7.0), cos(uT * 0.07 + aP.w * 3.0), sin(uT * 0.05 + aP.w)) * 1.2;
  vec4 c = uVP * vec4(p, 1.0);
  gl_Position = c;
  float z = max(c.w, 0.1);
  gl_PointSize = clamp(uAltezza * 0.022 / z, 1.0, 3.0);
  vec3 op = p - uO; float asse = dot(op, uD);
  float nelFascio = asse > uD0 ? smoothstep(uCos, mix(uCos, 1.0, 0.5), asse / length(op)) / (1.0 + pow((asse - uD0) / 30.0, 2.0)) : 0.0;
  float sole = 0.012 * (0.4 + 0.6 * fract(aP.w * 13.7));
  lum = (sole + nelFascio * 3.5) * smoothstep(uDa.x, uDa.y, z) * (1.0 - smoothstep(600.0, 1400.0, z));
}`;
const FS_POLVERE = TESTA + `
in float lum; out vec4 o;
void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; o = vec4(vec3(1.0, 0.96, 0.9) * lum * exp(-dot(p, p) * 3.0), 1.0); }`;

// La nave vera. Un punto: la posizione (dal centro della nave), la normale, il posto sulla tessitura, la
// tinta e il tipo del pezzo (0 lo scafo, 1 il metallo dei pezzi, 2 le celle dei pannelli, 3 lo scuro, da 4 a
// 8 le luci, 9 la spinta). I posti degli attributi sono fissi: lo stesso vao serve anche alle ombre.
// I pezzi che si muovono: il quarto numero della normale dice quale (0 lo scafo, fermo), uParte lo gira.
const VS_SCAFO = TESTA + `
layout(location = 0) in vec3 aP; layout(location = 1) in vec4 aN; layout(location = 2) in vec2 aUV; layout(location = 3) in vec4 aC;
uniform mat4 uVP; uniform vec3 uCentro, uLente; uniform mat4 uParte[4]; uniform float uPennacchio;
out vec3 p; out vec3 p0; out vec3 n; out vec2 uv; out vec3 tinta; out float riflesso; flat out int tipo;
void main(){
  int parte = clamp(int(aN.w * 127.0 + 0.5), 0, 3);
  mat4 m = uParte[parte];
  tipo = int(aC.a * 255.0 + 0.5);
  vec3 q = aP;
  // la spinta: la fiamma è più lunga di com'è nel modello (uPennacchio metri in più, in fondo)
  if (tipo == 9) q.x -= uPennacchio * aUV.x;
  // p0 è il punto a riposo: le macchie e la grana del metallo stanno ferme sul pezzo anche quando il pezzo gira
  p0 = q;
  p = (m * vec4(q, 1.0)).xyz; n = mat3(m) * aN.xyz; uv = aUV; tinta = aC.rgb;
  // la luce della lente sulla parete interna del fanale, fra la lente e il bordo
  vec3 dl = aP - uLente; float rr = length(dl.yz);
  riflesso = parte == 2 && tipo == 1 ? max(-dot(aN.yz, dl.yz / max(rr, 1e-3)), 0.0) * smoothstep(0.5, 0.0, dl.x) * step(-0.05, dl.x) : 0.0;
  gl_Position = uVP * vec4(p + uCentro, 1.0);
}`;
// Nello spazio la luce è un sole solo: la si calcola dal vivo (diffusa e riflessa), con l'ombra portata da
// una mappa fatta una volta, e un poco di luce fredda del cielo da ogni parte.
const FS_SCAFO = TESTA + RUMORE + `
in vec3 p; in vec3 p0; in vec3 n; in vec2 uv; in vec3 tinta; in float riflesso; flat in int tipo;
out vec4 o;
uniform sampler2D uColore, uRuvido, uMetallo, uRilievo;
uniform highp sampler2DShadow uOmbra;
uniform mat4 uLuceVP;
uniform vec2 uBias;   // la correzione dell'ombra, nelle unità della sua profondità (fissa, e per la pendenza)
uniform vec3 uSole, uOcchio, uSoleLuce, uCieloLuce, uLente;
uniform vec4 uLuci;   // l'oblò, i fanali, la luce dell'uscita, la lente del faro
uniform vec2 uTexel;
uniform float uSpinta, uLunga, uBrace, uT, uPendenza;
const float PI = 3.14159265;
void main(){
  vec3 N = normalize(n);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uOcchio - p);
  // quanto è vicina la camera: metri di nave per punto di schermo. Da lontano (il margine, la scala) non cambia niente;
  // sotto qualche centimetro per punto (i dettagli, il passaggio) il metallo prende la sua grana, i suoi spigoli
  float mpp = length(fwidth(p));
  float vicino = 1.0 - smoothstep(0.006, 0.035, mpp);
  if (tipo == 9) {
    // la spinta: una fiamma di plasma. Il cuore corto e chiaro alla bocca, il corpo azzurro che si perde; trema appena.
    // Si vede anche di fianco (la luce di un volume sottile è quella del suo spessore: di lato poca, non niente);
    // quando i reattori si spengono la fiamma si accorcia (uLunga) prima di sparire
    float s = uv.x / max(uLunga, 0.05);
    float trema = 0.9 + 0.1 * sin(uT * 31.0 + p0.z * 3.0) * sin(uT * 17.3 + p0.y);
    float cuore = exp(-s * 10.0), corpo = pow(max(1.0 - s, 0.0), 2.4);
    float spessore = 0.3 + 0.7 * abs(dot(N, V));
    float forza = uSpinta * trema * spessore * (1.3 * cuore + 0.42 * corpo) * smoothstep(0.0, 0.015, s);
    o = vec4(mix(vec3(0.72, 0.86, 1.0), vec3(0.22, 0.36, 1.0), smoothstep(0.0, 0.55, s)) * forza, 0.0);
    return;
  }
  vec3 alb; float ruv, met; vec3 emi = vec3(0.0);
  // la grana fine del metallo e le righe della lavorazione: stanno sul pezzo (p0), e contano solo da vicino
  float grana = fbm(p0 * 34.0, 3), righe = rumore(vec3(p0.x * 5.0, p0.y * 70.0, p0.z * 70.0));
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
    // da vicino la tessitura (26 punti per metro) è sfocata: la grana le ridà una superficie
    alb *= 1.0 + vicino * (0.24 * (grana - 0.45) + 0.10 * (righe - 0.5));
    ruv = clamp(ruv + vicino * 0.25 * (grana - 0.45), 0.05, 1.0);
  } else if (tipo == 1) {
    // il metallo dei pezzi: la tinta, con le macchie di chi sta fuori da novant'anni. Da vicino le macchie grandi si
    // attenuano (a un metro sembravano pietra) e restano la grana, le righe, gli spigoli consumati, più riflesso
    float k = clamp((0.75 * fbm(p0 * 0.9 + 3.0, 4) + 0.25 * rumore(p0 * 12.6) - 0.3) / 0.4, 0.0, 1.0);
    float kv = mix(k, 0.5, 0.65 * vicino);
    alb = pow(tinta, vec3(2.2)) * mix(0.38, 1.3, kv) * (1.0 + vicino * (0.18 * (grana - 0.45) + 0.12 * (righe - 0.5)));
    ruv = clamp(mix(0.73, 0.43, kv) - 0.10 * vicino + vicino * 0.22 * (grana - 0.45), 0.08, 1.0); met = 0.45 + 0.3 * vicino;
    // gli spigoli: dove la superficie gira stretta il metallo è consumato, più chiaro e più lucido
    float curva = length(fwidth(normalize(n))) / max(mpp, 1e-5);
    float spigolo = vicino * smoothstep(8.0, 30.0, curva);
    alb = mix(alb, vec3(0.50, 0.52, 0.55), 0.55 * spigolo); ruv = mix(ruv, 0.28, 0.6 * spigolo);
    // la luce della lente sulla parete interna del fanale
    emi = vec3(1.0, 0.90, 0.72) * min(uLuci.w, 3.0) * 0.22 * riflesso;
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
    else if (tipo == 7) {
      // la lente accesa: più forte e più calda al centro, con gli anelli della sua lavorazione
      float rl = length((p0 - uLente).yz) / 0.56;
      emi = vec3(1.0, 0.95, 0.82) * uLuci.w * (0.30 + 1.5 * exp(-rl * rl * 2.5)) * (0.86 + 0.14 * cos(rl * 44.0));
    }
    else emi = vec3(0.62, 0.82, 1.0) * uSpinta * 5.0 + vec3(1.0, 0.30, 0.07) * uBrace * 1.8;  // la fiamma, e poi la brace
  }
  // da vicino, il rilievo fine della grana: la luce radente la disegna
  if (tipo <= 1) {
    vec3 dpx = dFdx(p), dpy = dFdy(p);
    vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
    float det = dot(dpx, r1);
    N = normalize(abs(det) * N - vicino * 0.0035 * sign(det) * (dFdx(grana) * r1 + dFdy(grana) * r2));
  }
  float NL = dot(N, uSole), NV = max(dot(N, V), 1e-3);
  float ombra = 0.0;
  if (NL > 0.0) {
    vec4 l = uLuceVP * vec4(p + normalize(n) * 0.06, 1.0);
    vec3 s = l.xyz * 0.5 + 0.5;
    s.z -= uBias.x + uBias.y * (1.0 - NL);
    float passo = 1.0 / float(textureSize(uOmbra, 0).x);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) ombra += texture(uOmbra, vec3(s.xy + vec2(x, y) * passo, s.z));
    ombra /= 9.0;
    // fuori dalla mappa (l'ombra stretta dei dettagli copre solo una parte della nave): luce piena
    if (any(lessThan(s, vec3(0.0))) || any(greaterThan(s, vec3(1.0)))) ombra = 1.0;
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
  // da vicino, un filo di luce fredda di taglio (la galassia, dall'alto) stacca le forme dal nero
  c += vicino * mix(vec3(0.04), alb, met) * vec3(0.55, 0.70, 1.0) * 0.32 * pow(1.0 - NV, 3.0) * (0.35 + 0.65 * max(N.y, 0.0));
  o = vec4(c + emi, 1.0);
}`;
// L'ombra: la nave vista dal sole, solo la profondità.
const VS_OMBRA = TESTA + `
layout(location = 0) in vec3 aP; layout(location = 1) in vec4 aN;
uniform mat4 uLuceVP; uniform mat4 uParte[4];
void main(){ gl_Position = uLuceVP * (uParte[clamp(int(aN.w * 127.0 + 0.5), 0, 3)] * vec4(aP, 1.0)); }`;
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
// Il riflesso dell'obiettivo: la striscia orizzontale che le lenti anamorfiche (quelle del formato largo dell'intro)
// tirano dalle luci forti. Si prende solo quello che supera uSoglia (la lente del faro, le fiamme, i fanali, le
// stelle più forti, un riflesso del sole sul metallo) e lo si allarga in orizzontale, a passi sempre più lunghi. Il
// nucleo è normalizzato: la striscia porta tanta luce quanta ne ha la sorgente, come in un obiettivo vero (un
// fanale piccolo ne tira una sottile, la lente in primo piano una larga). L'autore, 16 novembre 2026: «il nostro
// motore 3d non è in grado di produrre flare o effetti di luminescenza realistici?»
const FS_STRISCIA = TESTA + `
in vec2 uv; out vec4 o; uniform sampler2D uTex; uniform vec2 uPasso; uniform float uSoglia;
void main(){
  const float w[5] = float[5](0.227, 0.194, 0.122, 0.054, 0.016);
  vec3 c = vec3(0.0);
  for (int i = -4; i <= 4; i++) c += max(texture(uTex, uv + uPasso * float(i)).rgb - uSoglia, 0.0) * w[abs(i)];
  o = vec4(c, 1.0);
}`;
// La resa finale, senza le bande (le disegna l'intro sopra, per tutte le scene).
// uLuce porta il quadro dal nero (0) al pieno (1).
const FS_FINALE = TESTA + `
in vec2 uv; out vec4 o;
uniform sampler2D uScena, uScenaB, uBagliore, uStriscia; uniform float uMisto, uBag, uStr, uEsp, uGrana, uSeme, uLuce, uVignetta;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec3 c = mix(texture(uScena, uv).rgb, texture(uScenaB, uv).rgb, uMisto);
  c += texture(uBagliore, uv).rgb * uBag;
  // la striscia dell'obiettivo, appena fredda (il trattamento delle lenti)
  c += texture(uStriscia, uv).rgb * vec3(0.70, 0.84, 1.0) * uStr;
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
  /** i perni dei pezzi che si muovono (dal 16 novembre 2026) */
  parti?: { faro: V3; radar: V3 };
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
  /** la correzione, nelle unità della profondità della mappa */
  bias: [number, number];
  /** l'ombra stretta si rifà a ogni fotogramma: la sua cornice resta */
  fb?: WebGLFramebuffer;
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
  /** la scala, alla fine: quanto è allargata (0 com'era, 1 «poco più larga»; vedi `allargamento`) */
  allarga?: number;
  /** il riflesso dell'obiettivo (la striscia delle luci forti): di base come dice il motore (`riflessi`); l'oblò
   *  della plancia no, perché lì si guarda da un vetro e non da un obiettivo */
  riflessi?: boolean;
}

export class Scala {
  private gl: WebGL2RenderingContext;
  private P: Record<string, Programma> = {};
  private vaoPieno!: WebGLVertexArrayObject;
  private polvere = new Map<Quadro, { vao: WebGLVertexArrayObject; n: number }>();
  private cieli = new Map<string, Cielo>();
  private luci!: { vao: WebGLVertexArrayObject; b: WebGLBuffer };
  private B: { w: number; h: number; scena: Bersaglio; scenaB: Bersaglio; catena: Bersaglio[]; striscia: [Bersaglio, Bersaglio] } | null = null;
  /** il riflesso dell'obiettivo nei quadri (l'intro lo lega all'effetto pellicola; lo sfondo del menu non lo usa) */
  riflessi = true;
  /** la striscia di questo fotogramma, se c'è */
  private strisciaPronta: Bersaglio | null = null;
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
    this.P.striscia = this.programma(VS_PIENO, FS_STRISCIA);

    this.vaoPieno = gl.createVertexArray()!;
    gl.bindVertexArray(this.vaoPieno);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    for (const nome of ["forno", "cielo", "fuso", "fascio", "giu", "su", "finale", "copia", "striscia"]) {
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
    const cielo = this.cielo(q);
    this.polvereDi(q);
    // l'ombra della nave, per il sole di questa ripresa: si calcola adesso, e non al primo fotogramma (quella stretta
    // dei dettagli si rifà comunque a ogni fotogramma)
    const cam = inquadratura(q, 0);
    if (this.nave && cam.sprite && !cam.ombraStretta) this.ombraDi(cam.sprite);
    // e il cielo si cuoce adesso, perché al primo fotogramma dopo uno stacco non si fermi l'immagine
    if (this.canvas.clientWidth > 0) {
      this.dimensiona(false);
      this.inforna(q, cielo, this.B!.w, this.B!.h, false);
    }
  }

  /** La camera di un quadro con le sue opzioni (la scala allargata, alla fine). */
  private camera(q: Quadro, t: number, opz: OpzioniQuadro = {}): Inquadratura {
    const cam = inquadratura(q, t, opz.faro ?? 0, opz.faroGradi ?? 0);
    return opz.allarga ? allargata(cam, allargamento(opz.allarga)) : cam;
  }

  /** Dove cade un punto del mondo sullo schermo (0–1, dall'alto a sinistra), e se sta davanti. */
  proiettaPunto(q: Quadro, t: number, P: V3, opz: OpzioniQuadro = {}, aspetto = 16 / 9): { x: number; y: number; davanti: boolean } {
    const cam = this.camera(q, t, opz);
    const avanti = cam.avanti, destra = norm(croce(avanti, [0, 1, 0])), su = croce(destra, avanti);
    const d: V3 = [P[0] - cam.pos[0], P[1] - cam.pos[1], P[2] - cam.pos[2]];
    const z = d[0] * avanti[0] + d[1] * avanti[1] + d[2] * avanti[2];
    const tanX = Math.tan(cam.fov / 2), tanY = tanX / aspetto;
    const x = (d[0] * destra[0] + d[1] * destra[1] + d[2] * destra[2]) / z / tanX;
    const y = (d[0] * su[0] + d[1] * su[1] + d[2] * su[2]) / z / tanY;
    return { x: 0.5 + x / 2, y: 0.5 - y / 2, davanti: z > 0 };
  }

  /** Il punto del fuso che cade nel punto (x, y) dello schermo (0–1), o null se lì non c'è il fuso. */
  puntoSulFuso(q: Quadro, t: number, x: number, y: number, opz: OpzioniQuadro = {}, aspetto = 16 / 9): V3 | null {
    const cam = this.camera(q, t, opz);
    const avanti = cam.avanti, destra = norm(croce(avanti, [0, 1, 0])), su = croce(destra, avanti);
    const tanX = Math.tan(cam.fov / 2), tanY = tanX / aspetto;
    const dir = norm(somma(avanti, somma(per(destra, (x * 2 - 1) * tanX), per(su, (1 - y * 2) * tanY))));
    return puntoDelFuso(cam.pos, dir);
  }

  // ---- un fotogramma -------------------------------------------------------------
  /** Disegna il quadro `q` all'istante `t`. */
  quadro(q: Quadro, t: number, opz: OpzioniQuadro = {}): void {
    this.dimensiona(!!opz.ridotta);
    const B = this.B!;
    this.disegna(q, t, B.scena, opz);
    this.finale(0, this.bagliore(B.scena, opz.riflessi ?? this.riflessi), Math.floor(t * 24), opz);
  }

  /** Il movimento ridotto: due quadri fermi e una dissolvenza (0 il primo, 1 il secondo). */
  dissolvenza(q: Quadro, tA: number, tB: number, misto: number, opz: OpzioniQuadro = {}): void {
    this.dimensiona(!!opz.ridotta);
    const B = this.B!;
    this.disegna(q, tA, B.scena, opz);
    this.disegna(q, tB, B.scenaB, opz);
    this.finale(misto, this.bagliore(misto < 0.5 ? B.scena : B.scenaB, opz.riflessi ?? this.riflessi), 0, opz);
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
    const di = CIELO_DI[q];
    if (di) {
      // le stesse stelle e la stessa galassia di un altro quadro; il forno è suo, nella sua direzione
      const b = this.cielo(di);
      const c: Cielo = { polo: b.polo, centro: b.centro, stelle: b.stelle, rif: { destra, su, avanti }, forno: null };
      this.cieli.set(chiave, c);
      return c;
    }
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
  private faro(q: Quadro, gradi = 0, cam?: Inquadratura) {
    const f = faroDi(q, gradi);
    if (!this.nave || q === "plancia" || q === "oblo" || q === "faro") return f;
    // dove la nave si vede da fuori il fascio parte dalla lente vera, largo quanto lei, lungo l'asse del fanale
    const lente = this.lente();
    if (!cam?.parti || !this.nave.dati.parti) return { ...f, origine: lente, direzione: LENTE.asse, raggio: LENTE.raggio };
    // la lampada gira e alza il muso: il fascio parte dalla lente dove sta adesso, e guarda dove guarda lei
    const lampada = matriciParti(cam.parti, this.nave.dati.parti)[2];
    return { ...f, origine: applica(lampada, lente), direzione: norm(applica(lampada, LENTE.asse, 0)), raggio: LENTE.raggio };
  }

  /** Il centro della lente del faro, a riposo: il punto del modello sta sul bordo del fanale, la lente poco dentro. */
  private lente(): V3 {
    return somma(this.nave!.dati.luci.faro, per(LENTE.asse, -LENTE.dentro));
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
    // nei dettagli il pulviscolo sta fermo nel mondo, lungo il tratto che la nave percorre in quei secondi, intorno
    // a dove passa il fascio: la nave gli scorre in mezzo, e i granelli attraversano la luce
    if (q === "sensori" || q === "cerca") for (let i = 0; i < 9000; i++) dati.push(lerp(120, 480, r()), lerp(1, 15, r()), lerp(-20, 20, r()), r());
    else for (let i = 0; i < (q === "plancia" ? 2600 : 1400); i++) {
      // dall'oblò il fascio comincia subito sopra il vetro: la polvere c'è anche lì vicino
      const s = (q === "plancia" ? 14 : 40) + r() ** 1.6 * 260, raggio = Math.tan(FARO.apertura) * s * largo * Math.sqrt(r()), a = r() * Math.PI * 2;
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
      for (const b of [this.B.scena, this.B.scenaB, ...this.B.catena, ...this.B.striscia]) {
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
    const q = catena[1];
    this.B = { w, h, scena: this.bersaglio(w, h), scenaB: this.bersaglio(w, h), catena, striscia: [this.bersaglio(q.w, q.h), this.bersaglio(q.w, q.h)] };
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

  /** L'ombra della nave per un sole: la nave vista da lì, una volta sola (la nave non gira). Nei dettagli i pezzi si
   *  muovono e la camera è vicina: l'ombra si rifà a ogni fotogramma, in una cornice stretta intorno a quello che si
   *  vede (più fine), con i pezzi dove stanno adesso. */
  private ombraDi(chi: Sole, stretta?: { centro: V3; raggio: number }, parti?: Float32Array): Ombra {
    const chiave = stretta ? `${chi}:stretta` : chi;
    const fatta = this.ombre.get(chiave);
    if (fatta && !stretta) return fatta;
    const gl = this.gl, N = this.nave!, lato = 2048;
    const c: V3 = stretta?.centro ?? [0, 0, 0];
    const R = stretta?.raggio ?? N.dati.raggio;
    // in profondità la cornice resta larga quanto la nave intera (anche dal centro stretto), perché niente di
    // quello che fa ombra resti fuori; la precisione basta (24 bit)
    const Rz = N.dati.raggio + Math.hypot(c[0], c[1], c[2]);
    const f = per(SOLE_NAVE[chi], -1), r = norm(croce(f, [0, 1, 0])), u = croce(r, f);
    const pc = (v: V3) => v[0] * c[0] + v[1] * c[1] + v[2] * c[2];
    const vp = [r[0] / R, u[0] / R, f[0] / Rz, 0, r[1] / R, u[1] / R, f[1] / Rz, 0, r[2] / R, u[2] / R, f[2] / Rz, 0, -pc(r) / R, -pc(u) / R, -pc(f) / Rz, 1];
    // la correzione: per la nave intera quella di sempre; da vicino 2 cm più 4 per la pendenza
    const bias: [number, number] = stretta ? [0.02 / (2 * Rz), 0.04 / (2 * Rz)] : [0.0012, 0.003];
    let tex = fatta?.tex, fb = fatta?.fb;
    if (!tex) {
      tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, lato, lato, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    }
    if (!fb) {
      fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
      gl.drawBuffers([gl.NONE]);
      gl.readBuffer(gl.NONE);
    } else gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
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
    gl.uniformMatrix4fv(this.P.ombra.u.uParte, false, parti ?? new Float32Array(matriciParti(undefined, undefined).flat()));
    gl.bindVertexArray(N.vao);
    gl.drawElements(gl.TRIANGLES, N.opachi, gl.UNSIGNED_INT, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // la cornice dell'ombra fatta una volta non serve più; quella stretta si tiene, per il prossimo fotogramma
    if (!stretta) {
      gl.deleteFramebuffer(fb);
      fb = undefined;
    }
    const ombra: Ombra = { tex, vp, bias, fb };
    this.ombre.set(chiave, ombra);
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
    const cam = this.camera(q, t, opz);
    const FARO = this.faro(q, cam.faroGradi ?? 0, cam);
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

    // il cielo e le stelle si guardano con gli assi del cielo del quadro, se ne ha di suoi (il passaggio: un'altra
    // regione dello stesso cielo; le stelle stanno all'infinito, e la nave non se ne accorge)
    const vistaCielo = (prog: Programma) => {
      vista(prog);
      if (!cam.cieloVerso) return;
      gl.uniform3fv(prog.u.uDestra, cielo.rif.destra);
      gl.uniform3fv(prog.u.uSu, cielo.rif.su);
      gl.uniform3fv(prog.u.uAvanti, cielo.rif.avanti);
    };

    // 1. il cielo
    gl.useProgram(P.cielo.p);
    vistaCielo(P.cielo);
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
    vistaCielo(P.stelle);
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

    // 4. il fascio del faro (additivo). Il vertice del cono sta dietro la lente quanto serve perché alla lente il
    // fascio sia largo quanto lei (d0); dove il faro si guarda da dentro (la plancia) nasce da un punto, com'era
    const d0 = FARO.raggio ? FARO.raggio / Math.tan(FARO.apertura) : 0;
    const O = somma(cam.nave, somma(FARO.origine, per(FARO.direzione, -d0)));
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
      gl.uniform1f(P.fascio.u.uD0, d0);
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
      gl.uniform1f(P.polvere.u.uD0, d0);
      // nei dettagli la camera sta in mezzo al pulviscolo: lo si vede anche a un metro
      gl.uniform2f(P.polvere.u.uDa, cam.parti ? 0.5 : 1.0, cam.parti ? 2.5 : 6.0);
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
      const parti = new Float32Array(matriciParti(cam.parti, N.dati.parti).flat());
      const ombra = this.ombraDi(chi, cam.ombraStretta, parti);
      const S = this.stratoNave(verso.w, verso.h);
      // la profondità si misura intorno alla nave: precisa da vicino come a diciotto chilometri. Lungo l'asse della
      // camera, non in linea d'aria: con la nave sul bordo del quadro il centro è più vicino all'obiettivo di
      // quanto dica la distanza, e il piano vicino tagliava via il muso (la «cupola nera» dei primi secondi di B,
      // 16 novembre 2026: si vedeva l'interno vuoto dello scafo)
      const profonda = -(occhio[0] * avanti[0] + occhio[1] * avanti[1] + occhio[2] * avanti[2]);
      const VPn = this.matriceVP(cam, destra, su, avanti, ot.quadrata ? 1 : aspetto, ot, Math.max(0.5, profonda - N.dati.raggio * 1.2), Math.max(1, profonda + N.dati.raggio * 1.2));
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
      gl.uniformMatrix4fv(Ps.u.uParte, false, parti);
      gl.uniform2f(Ps.u.uBias, ombra.bias[0], ombra.bias[1]);
      gl.uniform3fv(Ps.u.uCentro, cam.nave);
      gl.uniform3fv(Ps.u.uLente, this.lente());
      gl.uniform1f(Ps.u.uPennacchio, FIAMMA.lunga - FIAMMA.nelModello);
      gl.uniform3fv(Ps.u.uOcchio, occhio);
      gl.uniform3fv(Ps.u.uSole, SOLE_NAVE[chi]);
      gl.uniform3f(Ps.u.uSoleLuce, LUCE_NAVE.sole[0], LUCE_NAVE.sole[1], LUCE_NAVE.sole[2]);
      gl.uniform3f(Ps.u.uCieloLuce, LUCE_NAVE.cielo[0], LUCE_NAVE.cielo[1], LUCE_NAVE.cielo[2]);
      gl.uniform4f(Ps.u.uLuci, LUCE_NAVE.oblo, LUCE_NAVE.fanali * respiro, LUCE_NAVE.uscita, cam.faro ? (cam.parti ? LUCE_NAVE.faroVicino : LUCE_NAVE.faro) : 0.25);
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
      // la nave copre una luce se le sta davanti: la scatola dello scafo, in coordinate della nave. Le luci si
      // sommano senza guardare la profondità, e senza questo quelle dietro lo scafo gli brillerebbero attraverso
      const coperta = (p: V3) => {
        const scatola: V3 = [40, 6, 6.5];
        let t0 = 0, t1 = 1;
        for (let k = 0; k < 3; k++) {
          const d = p[k] - occhio[k];
          if (Math.abs(d) < 1e-9) {
            if (Math.abs(occhio[k]) > scatola[k]) return false;
            continue;
          }
          const a = (-scatola[k] - occhio[k]) / d, b = (scatola[k] - occhio[k]) / d;
          t0 = Math.max(t0, Math.min(a, b));
          t1 = Math.min(t1, Math.max(a, b));
          if (t0 > t1) return false;
        }
        return true;
      };
      // quanto si vede un punto (0–1): cinque prove intorno, perché una luce che spunta dietro lo spigolo della poppa
      // non si accenda di colpo
      const siVede = (p: V3) => [-1, -0.5, 0, 0.5, 1].reduce((v, dz) => v + (coperta([p[0], p[1], p[2] + dz]) ? 0 : 0.2), 0);
      // il bagliore della spinta sta nel cuore della fiamma, qualche metro dietro gli scarichi: da dietro è pieno, di
      // fianco resta (meno forte), e da davanti lo copre la nave
      const cuori = L.scarichi.map((p): V3 => [p[0] - FIAMMA.bagliore, p[1], p[2]]);
      aloni([...L.fanali.map((p): [V3, number] => [p, 2.2 * respiro * verso_(p, dietro)]), [L["oblò"], 0.9 * verso_(L["oblò"], [1, 0, 0])]], [1.0, 0.62, 0.22]);
      aloni([[L.uscita, 0.5 * verso_(L.uscita, [0, 0, 1])]], [1.0, 0.86, 0.45]);
      // da lontano la spinta non copre il respiro dei fanali
      aloni(cuori.map((p): [V3, number] => [p, 0.7 * LUCE_NAVE.spinta * spinta * (0.3 + 0.7 * verso_(p, dietro)) * siVede(p) * Math.min(1, 700 / lontana)]), [0.55, 0.75, 1.0]);
      aloni(L.scarichi.map((p): [V3, number] => [p, 0.3 * R.brace * verso_(p, dietro) * Math.min(1, 400 / lontana)]), [1.0, 0.32, 0.08]);
    }
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
  }

  private bagliore(sorgente: Bersaglio, riflessi = false): Bersaglio {
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
    // la striscia dell'obiettivo: dal quadro a un quarto (prima che la risalita lo cambi), sei passate orizzontali
    // a passi che raddoppiano; la prima tiene solo quello che supera la soglia
    this.strisciaPronta = null;
    if (riflessi) {
      gl.useProgram(P.striscia.p);
      gl.uniform1i(P.striscia.u.uTex, 0);
      let da = B.catena[1];
      for (let k = 0; k < 6; k++) {
        const a = B.striscia[k % 2];
        gl.bindFramebuffer(gl.FRAMEBUFFER, a.fb);
        gl.viewport(0, 0, a.w, a.h);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, da.tex);
        gl.uniform2f(P.striscia.u.uPasso, (1 << k) / da.w, 0);
        gl.uniform1f(P.striscia.u.uSoglia, k === 0 ? RIFLESSO.soglia : 0);
        gl.bindVertexArray(this.vaoPieno);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        da = a;
      }
      this.strisciaPronta = da;
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
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, (this.strisciaPronta ?? bag).tex);
    gl.uniform1i(P.finale.u.uStriscia, 3);
    gl.uniform1f(P.finale.u.uStr, this.strisciaPronta ? RIFLESSO.forza : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1f(P.finale.u.uEsp, 1.55);
    gl.uniform1f(P.finale.u.uGrana, opz.grana === false ? 0 : 0.022);
    gl.uniform1f(P.finale.u.uSeme, seme);
    gl.uniform1f(P.finale.u.uLuce, opz.luce ?? 1);
    gl.uniform1f(P.finale.u.uVignetta, opz.vignetta === false ? 0 : 1);
    gl.bindVertexArray(this.vaoPieno);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
