// ============================================================================
//  La scaletta dell'intro (09-intro-storyboard.md): scene, testi, momenti,
//  sottotitoli dei suoni. Pura: la calcola la regola di lettura del §2.1, come
//  strumenti/intro/tempi.py, e le prove la confrontano con la tabella dello
//  storyboard.
//
//  La regola: ogni blocco resta fermo almeno 0,35 s per parola più 2, mai meno
//  di 4; entra in 1,2 s ed esce in 1,0. Un blocco che continua il precedente
//  (B4 dopo B3, B6 dopo B5) entra sotto quando il primo ha finito il suo tempo;
//  il primo si attenua, ed escono insieme.
//  Dal 29 ottobre 2026 L.V. ha una voce (documento 09, §13): i suoi blocchi
//  restano anche il tempo che lui ci mette a dirli, e il blocco che continua
//  la frase entra poco prima della sua prima parola.
//  Dal 14 novembre 2026 l'intro ha i titoli di testa (documento 09, §16, le
//  «scelte definitive» dell'autore): tre cartelli nel nero (chi presenta, di chi
//  è il gioco, chi lo produce) e tre crediti in sovrimpressione (il libro, il
//  tema musicale, la voce di William). La voce dell'apparecchio si stampa con
//  il suo cursore, trenta caratteri al secondo, e si sente.
// ============================================================================
import { SPEGNIMENTO } from "./scala.ts";

export type IdScena = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
export type Voce = "apparecchio" | "lv" | "titolo";

export interface Scena {
  id: IdScena;
  nome: string;
  inizio: number;
  fine: number;
}

export interface Blocco {
  id: string;
  testo: string;
  /** la riga sotto, per il titolo */
  sotto?: string;
  voce: Voce;
  scena: IdScena;
  parole: number;
  fermo: number;
  /** comincia a entrare */
  entra: number;
  /** è pieno */
  pieno: number;
  /** comincia a uscire */
  esce: number;
  /** è uscito */
  via: number;
  /** il blocco sopra a cui si aggiunge, se ne continua la frase */
  sottoA?: string;
  /** la voce di L.V. che comincia con questo blocco: quando (secondi dell'intro), e il pezzo del file */
  pezzo?: Pezzo;
  /** la voce dell'apparecchio: in quanti secondi si stampa, lettera per lettera */
  stampa?: number;
}

/** Una riga di un credito: la parte piccola (il ruolo, in corsivo), la parte grande (il nome, in maiuscolo
 *  spaziato), o tutte e due sulla stessa riga. `minore`: una riga di firma, un grado sotto. */
export interface Riga {
  piccolo?: string;
  grande?: string;
  minore?: boolean;
}

/** Dove sta un credito nel quadro: un cartello al centro del nero, o in sovrimpressione in un angolo. */
export type Posto = "centro" | "alto" | "basso";

/** Un credito dei titoli di testa: entra, è pieno, comincia a uscire, è uscito. */
export interface Credito {
  id: string;
  righe: Riga[];
  posto: Posto;
  entra: number;
  pieno: number;
  esce: number;
  via: number;
}

/** L'immagine di A che va nel nero per un cartello, e ne torna: (da, a) della discesa e della risalita. */
export interface Nero {
  cala: [number, number];
  torna: [number, number];
}

/** Un testo che l'apparecchio stampa: da quando a quando, e che cosa (il motore audio ne fa il cursore). */
export interface Stampa {
  da: number;
  a: number;
  testo: string;
}

/** Un pezzo del file della voce di L.V.: comincia al secondo `t` dell'intro, e va da `da` ad `a` del file. */
export interface Pezzo {
  t: number;
  da: number;
  a: number;
}

export interface Sottotitolo {
  inizio: number;
  fine: number;
  testo: string;
}

export const ENTRA = 1.2;
export const ESCE = 1.0;

/** Quanto resta fermo un testo: 0,35 s per parola più 2, mai meno di 4. */
export function fermoPer(testo: string): { fermo: number; parole: number } {
  const parole = testo.split(/\s+/).filter(Boolean).length;
  return { fermo: Math.max(4, Math.round((0.35 * parole + 2) * 100) / 100), parole };
}

const arrotonda = (x: number) => Math.round(x * 100) / 100;

/** Il cartello del titolo resta fermo quanto nello storyboard (6,55 s). Il sottotitolo con il libro non c'è
 *  più (l'autore, 14 novembre 2026: «Togli il riferimento al libro, lo abbiamo messo prima»). */
const FERMO_TITOLO = 6.55;
/** i glifi del titolo: quanto ci mettono a tracciarsi, e quanto a sciogliersi nelle lettere */
const GLIFI = 2.6;
const TRADUZIONE = 4.2;

// I testi, parola per parola quelli del prologo (relitto.fav). L'unica
// trasformazione è quella permessa dal §7 del 06: gli apostrofi tipografici.
export const PROLOGO = {
  B0: "Scatola nera di una tuta extraveicolare. Traccia recuperata, integrità parziale.",
  B1: "«…la spia è verde. Allora registra, o almeno così dice.",
  B2: "L’acqua è finita ieri. Il riscaldamento stanotte.",
  B3: "Il numero dell’aria lo leggo sul visore e, prima di dirlo, l’ho già perso.",
  B4: "Lo rileggo: diciannove.",
  B5: "Ho firmato tutte le carte che servivano per partire da solo.",
  B6: "Ho insistito io.",
  B7: "Qui dentro c’è una cosa viva.",
  B8: "Sta dietro un vetro, a mezzo metro da me.",
  B9: "La vedo pulsare, e quel vetro non lo so aprire.»",
  B10: "Fine della traccia.",
} as const;

/** La voce di L.V. (documento 09, §13; `strumenti/intro/voce_lv.py`; la voce «Elio», 30 ottobre 2026: fuori
 *  dai pezzi restano «lunga pausa» e «molta pausa», che il modello ha letto ad alta voce, a 13,9 e a 47,9 s
 *  del file; il resto c'è tutto, respiri compresi): dove sta ogni frase nel file,
 *  in secondi. Il pezzo (da, a) si suona intero; parola e fine sono la prima e l'ultima parola del
 *  blocco. Un blocco che continua la frase (B4, B6) sta nel pezzo del blocco sopra, com'è stato detto. */
export const VOCE: Partial<Record<keyof typeof PROLOGO, { da?: number; a?: number; parola: number; fine: number }>> = {
  B1: { da: 0.05, a: 13.45, parola: 2.48, fine: 8.22 },
  B2: { da: 15.3, a: 26.0, parola: 17.8, fine: 24.2 },
  B3: { da: 26.4, a: 45.6, parola: 28.32, fine: 35.9 },
  B4: { parola: 39.08, fine: 43.16 },
  B5: { da: 51.4, a: 62.3, parola: 52.86, fine: 56.9 },
  B6: { parola: 60.18, fine: 61.12 },
  B7: { da: 64.4, a: 71.6, parola: 67.68, fine: 70.94 },
  B8: { da: 71.6, a: 78.3, parola: 73.24, fine: 77.42 },
  B9: { da: 78.3, a: 86.55, parola: 79.72, fine: 86.18 },
};
/** dove finisce «La vedo pulsare» nel file: dopo, il cuore della cosa viva (F) */
const FINE_PULSARE = 81.56;
/** la voce comincia appena dopo che il testo comincia a entrare */
export const ANTICIPO_VOCE = 0.15;
/** il blocco che continua la frase entra così prima della sua prima parola */
const PRIMA_DELLA_PAROLA = 0.6;
/** e ogni blocco resta almeno così dopo l'ultima parola */
const DOPO_LA_PAROLA = 0.8;
const SEGUITO: Partial<Record<string, keyof typeof PROLOGO>> = { B3: "B4", B5: "B6" };

export const TITOLO = "IL RELITTO SILENTE";

/** I titoli di testa, con le parole dell'autore (14 novembre 2026). Il libro è nominato qui, e non più
 *  sotto il titolo. */
export const CREDITI = {
  K0: { righe: [{ grande: "RUNTIME MULTIMEDIA" }, { piccolo: "presenta" }], posto: "centro", fermo: 2.6 },
  K1: { righe: [{ piccolo: "un gioco di" }, { grande: "SIMONE PIZZI" }], posto: "centro", fermo: 2.6 },
  K2: { righe: [{ piccolo: "produttore esecutivo" }, { grande: "MICHELA DE PAOLA" }], posto: "centro", fermo: 2.6 },
  K3: {
    righe: [{ piccolo: "tratto dal libro" }, { grande: "DAL REGISTRO DELLA SANTA MARIA" }, { piccolo: "di", grande: "SIMONE PIZZI", minore: true }],
    posto: "alto",
    fermo: 4.5,
  },
  K4: { righe: [{ piccolo: "tema musicale originale di" }, { grande: "ALIRIO BRUNI" }], posto: "basso", fermo: 3.6 },
  K5: { righe: [{ grande: "LEONARDO TOMASSETTI" }, { piccolo: "è William T. Erickson" }], posto: "basso", fermo: 3.6 },
} as const satisfies Record<string, { righe: readonly Riga[]; posto: Posto; fermo: number }>;
/** un credito entra in un secondo ed esce in poco meno */
export const ENTRA_C = 1.0;
export const ESCE_C = 0.9;
/** il cartello nel nero: l'immagine cala, un attimo di nero, il cartello, un attimo di nero, l'immagine torna,
 *  e L.V. aspetta un respiro prima di continuare */
const NERO = { cala: 0.9, pausa: 0.35, torna: 1.0, respiro: 0.4 };
/** la voce dell'apparecchio si stampa a trenta caratteri al secondo, come i terminali dei vecchi film */
export const CARATTERI_AL_SECONDO = 30;

/** Il testo di un credito, in fila: per chi usa un lettore di schermo. */
export const testoCredito = (c: { righe: readonly Riga[] }) => c.righe.map((r) => [r.piccolo, r.grande].filter(Boolean).join(" ")).join(" ");

export interface Scaletta {
  durata: number;
  scene: Scena[];
  blocchi: Blocco[];
  /** i titoli di testa: i cartelli nel nero e i crediti in sovrimpressione */
  crediti: Credito[];
  /** quando l'immagine di A va nel nero per un cartello */
  neri: Nero[];
  /** quello che l'apparecchio stampa con il cursore */
  stampe: Stampa[];
  /** i momenti con un nome, in secondi (vedi sotto) */
  momenti: Momenti;
  sottotitoli: Sottotitolo[];
}

export interface Momenti {
  fruscioA: number;
  spia: number;
  battito: [number, number];
  stella: [number, number];
  /** entra la musica: il tema della Santa Maria, quando si apre lo spazio */
  tema: number;
  naveB: number;
  reB: number;
  radar: [number, number];
  fuoco: [number, number];
  stelleSpente: [number, number];
  faro: number;
  brusio: [number, number];
  scala: [number, number];
  scalaFerma: number;
  /** nella scala i reattori si spengono: da quando a quando (scala.ts, SPEGNIMENTO) */
  reattori: [number, number];
  fruscioF: number;
  pulsa: [number, number];
  /** finisce «La vedo pulsare»: poco dopo si sente il cuore della cosa viva */
  pulsare: number;
  spiaSpenta: number;
  glifi: [number, number];
  traduzione: [number, number];
  raccordo: [number, number];
  arretra: [number, number];
  interfaccia: [number, number];
  partita: [number, number];
}

/** La scaletta, con i conti di strumenti/intro/tempi.py. */
export function costruisciScaletta(): Scaletta {
  let T = 0;
  const blocchi: Blocco[] = [];
  const crediti: Credito[] = [];
  const neri: Nero[] = [];
  const scene: Scena[] = [];
  const segna = (durata: number) => {
    const da = T;
    T += durata;
    return da;
  };
  const testo = (id: keyof typeof PROLOGO | "T", voce: Voce, scena: IdScena, sottoA?: string) => {
    const frase = id === "T" ? TITOLO : PROLOGO[id];
    let { fermo } = id === "T" ? { fermo: FERMO_TITOLO } : fermoPer(frase);
    const { parole } = fermoPer(frase);
    // la voce: il testo resta finché L.V. l'ha detto
    const v = id === "T" ? undefined : VOCE[id];
    let pezzo: Pezzo | undefined;
    if (v && !sottoA) {
      pezzo = { t: arrotonda(T + ANTICIPO_VOCE), da: v.da!, a: v.a! };
      const seguito = SEGUITO[id] ? VOCE[SEGUITO[id]!]! : undefined;
      // con un seguito resta fino a quando entra il seguito, poco prima della sua prima parola; senza,
      // fino all'ultima parola, e comunque finché il pezzo suona (i respiri dopo le parole sono suoi:
      // il blocco dopo non comincia sopra di loro)
      const fino = seguito
        ? pezzo.t + (seguito.parola - v.da!) - PRIMA_DELLA_PAROLA
        : Math.max(pezzo.t + (v.fine - v.da!) + DOPO_LA_PAROLA, pezzo.t + (v.a! - v.da!) - ESCE);
      fermo = Math.max(fermo, arrotonda(fino - (T + ENTRA)));
    } else if (v && sottoA) {
      const capo = blocchi.find((x) => x.id === sottoA)!.pezzo!;
      const fino = Math.max(capo.t + (v.fine - capo.da) + DOPO_LA_PAROLA, capo.t + (capo.a - capo.da) - ESCE);
      fermo = Math.max(fermo, arrotonda(fino - (T + ENTRA)));
    }
    const b: Blocco = {
      id,
      testo: frase,
      voce,
      scena,
      parole,
      fermo,
      entra: arrotonda(T),
      pieno: arrotonda(T + ENTRA),
      esce: arrotonda(T + ENTRA + fermo),
      via: arrotonda(T + ENTRA + fermo + ESCE),
      sottoA,
      pezzo,
      stampa: voce === "apparecchio" ? arrotonda(frase.length / CARATTERI_AL_SECONDO) : undefined,
    };
    blocchi.push(b);
    T = T + ENTRA + fermo;
    if (sottoA) {
      // il primo blocco resta, attenuato, ed esce con questo
      const sopra = blocchi.find((x) => x.id === sottoA)!;
      sopra.esce = b.esce;
      sopra.via = b.via;
    }
    return b;
  };
  const scena = (id: IdScena, nome: string, inizio: number) => {
    if (scene.length) scene[scene.length - 1].fine = arrotonda(inizio);
    scene.push({ id, nome, inizio: arrotonda(inizio), fine: 0 });
  };

  /** Un credito, dal secondo `da` (di suo, da adesso): non sposta il tempo. */
  const credito = (id: keyof typeof CREDITI, da = T): Credito => {
    const k = CREDITI[id];
    const c: Credito = {
      id,
      righe: [...k.righe],
      posto: k.posto,
      entra: arrotonda(da),
      pieno: arrotonda(da + ENTRA_C),
      esce: arrotonda(da + ENTRA_C + k.fermo),
      via: arrotonda(da + ENTRA_C + k.fermo + ESCE_C),
    };
    crediti.push(c);
    return c;
  };
  /** Un cartello nel nero, in mezzo ad A: la spia e il nastro calano, il cartello, e tornano. */
  const cartello = (id: keyof typeof CREDITI) => {
    const cala = segna(NERO.cala);
    segna(NERO.pausa);
    T = credito(id).via;
    segna(NERO.pausa);
    const torna = segna(NERO.torna);
    neri.push({ cala: [arrotonda(cala), arrotonda(cala + NERO.cala)], torna: [arrotonda(torna), arrotonda(torna + NERO.torna)] });
    segna(NERO.respiro);
  };

  // --- A. La traccia --------------------------------------------------------
  scena("A", "La traccia", 0);
  // mezzo secondo di nero, poi chi presenta; solo dopo si accende la spia
  segna(0.5);
  T = credito("K0").via;
  segna(1.6);
  const spia = segna(0.8);
  testo("B0", "apparecchio", "A");
  T += ESCE + 0.9;
  testo("B1", "lv", "A");
  T += ESCE;
  cartello("K1");
  testo("B2", "lv", "A");
  T += ESCE + 0.9;
  testo("B3", "lv", "A");
  testo("B4", "lv", "A", "B3");
  T += ESCE;
  cartello("K2");
  const battito = segna(3.0);
  // --- B. Il margine -----------------------------------------------------------
  scena("B", "Il margine", T);
  const stella = segna(2.5);
  const naveB = segna(1.0);
  const reB = T;
  const b5 = testo("B5", "lv", "B");
  testo("B6", "lv", "B", "B5");
  // il libro, in sovrimpressione, appena L.V. ha detto «Ho insistito io»: resta sulle stelle, e C aspetta che se ne vada
  const k3 = credito("K3", b5.pezzo!.t + (VOCE.B6!.fine - VOCE.B5!.da!) + 0.5);
  T = Math.max(T + ESCE + 1.0, k3.via + 0.3);
  // --- C. Il radar ---------------------------------------------------------------
  scena("C", "Il radar", T);
  const radar = segna(6.2);
  const fuoco = segna(1.6);
  const stelleSpente = segna(5.0);
  // --- D. Il faro ------------------------------------------------------------------
  scena("D", "Il faro", T);
  segna(1.8);
  const faro = segna(5.6);
  segna(1.6);
  // --- E. La scala ------------------------------------------------------------------
  scena("E", "La scala", T);
  const scala = segna(23.5);
  // il tema musicale, quando la Santa Maria è diventata piccola
  credito("K4", scala + 9.5);
  // --- F. La traccia, seconda parte ---------------------------------------------------
  scena("F", "La traccia, seconda parte", T);
  const f = T;
  const b7 = testo("B7", "lv", "F");
  // la voce di William, quando L.V. ricomincia a parlare
  credito("K5", b7.pezzo!.t + 0.4);
  T += ESCE + 0.6;
  testo("B8", "lv", "F");
  T += ESCE + 0.6;
  const b9 = testo("B9", "lv", "F");
  T += ESCE + 0.6;
  testo("B10", "apparecchio", "F");
  T += ESCE;
  const spiaSpenta = segna(1.0);
  // --- G. Il titolo --------------------------------------------------------------------
  scena("G", "Il titolo", T);
  // i glifi si tracciano; poi ogni glifo si scioglie nella sua lettera (documento 09, §16)
  const glifi = segna(GLIFI);
  const traduzione = segna(TRADUZIONE);
  testo("T", "titolo", "G");
  T += ESCE;
  // --- H. La plancia ---------------------------------------------------------------------
  scena("H", "La plancia", T);
  const raccordo = segna(1.2);
  const arretra = segna(3.2);
  const interfaccia = segna(3.0);
  const partita = segna(1.6);
  scene[scene.length - 1].fine = arrotonda(T);
  const durata = arrotonda(T);

  const r = arrotonda;
  const momenti: Momenti = {
    fruscioA: r(spia - 1.4),
    spia: r(spia),
    battito: [r(battito), r(battito + 3.0)],
    stella: [r(stella), r(stella + 2.5)],
    tema: r(stella + 0.4),
    naveB: r(naveB),
    reB: r(reB),
    radar: [r(radar), r(radar + 6.2)],
    fuoco: [r(fuoco), r(fuoco + 1.6)],
    stelleSpente: [r(stelleSpente), r(stelleSpente + 5.0)],
    faro: r(faro),
    // «a metà» del faro, per un secondo e mezzo
    brusio: [r(faro + 2.05), r(faro + 3.55)],
    scala: [r(scala), r(scala + 23.5)],
    scalaFerma: r(scala + 23),
    reattori: [r(scala + SPEGNIMENTO.quando), r(scala + SPEGNIMENTO.quando + SPEGNIMENTO.dura)],
    fruscioF: r(f - 2),
    pulsa: [r(b9.entra), r(b9.via)],
    pulsare: r(b9.pezzo!.t + (FINE_PULSARE - b9.pezzo!.da)),
    spiaSpenta: r(spiaSpenta),
    glifi: [r(glifi), r(glifi + GLIFI)],
    traduzione: [r(traduzione), r(traduzione + TRADUZIONE)],
    raccordo: [r(raccordo), r(raccordo + 1.2)],
    arretra: [r(arretra), r(arretra + 3.2)],
    interfaccia: [r(interfaccia), r(interfaccia + 3.0)],
    partita: [r(partita), r(partita + 1.6)],
  };

  // I sottotitoli dei suoni (§2.5): per chi non sente, e, nell'animatic, la
  // colonna sonora che ancora non c'è (§5 dello storyboard).
  const m = momenti;
  const b1 = blocchi.find((b) => b.id === "B1")!;
  const stampe: Stampa[] = blocchi.filter((b) => b.stampa).map((b) => ({ da: b.entra, a: r(b.entra + b.stampa!), testo: b.testo }));
  const b10 = blocchi.find((b) => b.id === "B10")!;
  const sottotitoli: Sottotitolo[] = [
    { inizio: m.fruscioA, fine: m.spia, testo: "il fruscio di una traccia registrata" },
    { inizio: m.spia, fine: m.spia + 0.8, testo: "un clic" },
    { inizio: m.spia + 0.8, fine: m.spia + 0.8 + stampe[0].a - stampe[0].da + 0.6, testo: "un cursore che scrive" },
    { inizio: b1.pezzo!.t, fine: b1.pezzo!.t + 4, testo: "la voce di L.V., dalla radio della tuta, senza fiato" },
    { inizio: m.battito[0], fine: m.tema, testo: "un battito, che rallenta" },
    { inizio: m.tema, fine: m.naveB + 3, testo: "il battito si allontana; entra la musica" },
    { inizio: m.radar[0], fine: m.stelleSpente[0], testo: "il reattore sotto il pavimento; il radar, un tic a ogni giro" },
    { inizio: m.stelleSpente[0], fine: m.faro, testo: "la plancia" },
    { inizio: m.faro, fine: m.brusio[0], testo: "il relè del faro" },
    { inizio: m.brusio[0], fine: m.brusio[1], testo: "dalla radio, molte voci" },
    { inizio: m.scala[0], fine: m.fruscioF, testo: "la musica" },
    { inizio: m.fruscioF, fine: m.pulsa[0], testo: "il fruscio della traccia" },
    { inizio: m.pulsa[0], fine: Math.min(m.pulsa[1], b10.entra), testo: "un battito" },
    { inizio: b10.entra, fine: b10.entra + b10.stampa! + 0.9, testo: "un cursore che scrive" },
    { inizio: m.spiaSpenta, fine: m.glifi[0], testo: "la musica si spegne" },
    { inizio: m.traduzione[1], fine: m.raccordo[0], testo: "una nota bassa" },
    { inizio: m.arretra[0], fine: durata, testo: "il reattore; la console che si accende" },
  ].map((s) => ({ ...s, inizio: r(s.inizio), fine: r(s.fine) }));

  return { durata, scene, blocchi, crediti, neri, stampe, momenti, sottotitoli };
}

export const SCALETTA = costruisciScaletta();

/** La scena di un istante. */
export function scenaA(t: number, s: Scaletta = SCALETTA): Scena {
  return s.scene.find((x) => t >= x.inizio && t < x.fine) ?? s.scene[s.scene.length - 1];
}

/** Da 0 a 1 fra a e b, fermo fuori. */
export function fra(t: number, a: number, b: number): number {
  return Math.max(0, Math.min(1, (t - a) / (b - a)));
}

/** L'andamento morbido, ai due capi. */
export function morbido(x: number): number {
  return x * x * (3 - 2 * x);
}

/** Quanto si vede un blocco nell'istante t (0–1), e quanto è attenuato dal blocco sotto. */
export function opacitaBlocco(b: Blocco, t: number, s: Scaletta = SCALETTA): number {
  if (t < b.entra || t >= b.via) return 0;
  let o = t < b.pieno ? morbido(fra(t, b.entra, b.pieno)) : t > b.esce ? 1 - morbido(fra(t, b.esce, b.via)) : 1;
  const sotto = s.blocchi.find((x) => x.sottoA === b.id);
  if (sotto && t >= sotto.entra) o *= 1 - 0.42 * morbido(fra(t, sotto.entra, sotto.pieno));
  return o;
}

/** Quanto si vede un credito nell'istante t (0–1). */
export function opacitaCredito(c: Credito, t: number): number {
  if (t < c.entra || t >= c.via) return 0;
  return t < c.pieno ? morbido(fra(t, c.entra, c.pieno)) : t > c.esce ? 1 - morbido(fra(t, c.esce, c.via)) : 1;
}

/** Quanto si vede l'immagine di A (la spia, il nastro) nell'istante t: zero mentre c'è un cartello. */
export function luceDiA(t: number, s: Scaletta = SCALETTA): number {
  let v = 1;
  for (const n of s.neri) {
    if (t >= n.cala[0] && t < n.torna[1]) v = Math.min(v, t < n.torna[0] ? 1 - morbido(fra(t, n.cala[0], n.cala[1])) : morbido(fra(t, n.torna[0], n.torna[1])));
  }
  return v;
}

export const formatoTempo = (t: number) => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0").replace(".", ",")}`;
};

/** I pezzi della voce di L.V., in ordine: per il motore audio. */
export function pezziDellaVoce(s: Scaletta = SCALETTA): Pezzo[] {
  return s.blocchi.filter((b) => b.pezzo).map((b) => b.pezzo!);
}
