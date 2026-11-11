// ============================================================================
//  La nave che si sveglia (documento 30, §9.d): i tempi, e l'onda che le vene
//  leggono. Nel laboratorio di risonanza, quando il cristallo entra nel
//  generatore (tecnica.fav, relitto.fav): «Con un rombo che sale, i macchinari
//  si svegliano: l'elettricità corre fra le bobine, i monitor si accendono […]
//  Lo scafo mi vibra sotto i piedi, una volta sola. Lontano, dietro le pareti,
//  sistemi spenti da sempre tornano a respirare uno dopo l'altro, e per la prima
//  volta sento la nave lavorare.»
//  Non c'è un velo: è l'interfaccia stessa che si spegne e si riaccende. Tutto
//  va al buio, restano le vene appena visibili; la lente (dove si vede il
//  generatore) guizza con gli archi; al brivido dello scafo una luce parte da lì
//  e si allarga piano su tutto lo schermo: dove passa le vene si accendono, e gli
//  strumenti tornano uno dopo l'altro. Per ultime, le parole.
//  I tempi sono quelli del suono (mondo/regia.rs, l'evento «energia»): il rombo
//  che sale, i quattro archi, il brivido a 3,4 secondi, i respiri dopo.
// ============================================================================

/** I momenti, in secondi dall'inizio. */
export const TEMPI = {
  /** tutto si spegne, mentre il rombo comincia a salire: quanto ci mette */
  buio: 0.9,
  /** gli archi fra le bobine: la lente guizza (gli stessi istanti del motore audio) */
  archi: [1.2, 1.7, 2.3, 2.6],
  /** il brivido dello scafo: la luce parte dal generatore; e quando arriva all'angolo più lontano */
  onda: [3.4, 8.6],
  /** la lamina torna, con le parole */
  parole: 9.0,
} as const;

/** Quanto dura tutto. */
export const DURATA = 10.6;
/** Quanto ci mette un sistema a tornare, quando la luce lo raggiunge (almeno). */
export const ACCENSIONE = 1.2;
/** Quanto ci mettono le parole. */
export const PAROLE = 1.4;

/** L'onda di luce nelle vene: la scrive Risveglio.tsx, la legge Vene.tsx a ogni fotogramma. */
export interface Onda {
  attiva: boolean;
  /** il generatore, nelle misure della tela delle vene */
  x: number;
  y: number;
  /** dove è arrivato il fronte, e quanto corre (al secondo) */
  raggio: number;
  velocita: number;
  /** quanto si vedono le vene dove la luce non è ancora arrivata (1 = accese) */
  buio: number;
}
export const onda: Onda = { attiva: false, x: 0, y: 0, raggio: 0, velocita: 1, buio: 1 };

const blocca = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const morbido = (x: number) => {
  const c = blocca(x);
  return c * c * (3 - 2 * c);
};

/** Dove è arrivata la luce al secondo `s`: 0 al generatore, 1 all'angolo più lontano. Va sempre alla stessa
 *  velocità (e continua oltre l'uno: dietro di lei la luce delle vene deve posarsi). */
export const fronte = (s: number) => Math.max(0, (s - TEMPI.onda[0]) / (TEMPI.onda[1] - TEMPI.onda[0]));

/** Le vene dove la luce non è arrivata: da com'erano senza energia a quasi spente. */
export const veneAlBuio = (s: number) => 0.82 - 0.52 * morbido(s / TEMPI.buio);

/** Quanto è spenta la lente da ferma, al buio. */
const FONDO = 0.06;

/** La luce della lente al secondo `s` (0–1): si spegne con il resto; poi guizza a ogni arco, ogni volta
 *  un poco di più, mentre sotto sale piano; al brivido dello scafo si accende del tutto. */
export function luceLente(s: number): number {
  if (s < TEMPI.buio) return 1 - (1 - FONDO) * morbido(s / TEMPI.buio);
  let l = FONDO + 0.16 * morbido((s - TEMPI.archi[0]) / (TEMPI.onda[0] - TEMPI.archi[0]));
  TEMPI.archi.forEach((a, n) => {
    const d = s - a;
    if (d >= 0) l += (0.3 + 0.13 * n) * Math.min(1, d / 0.08) * Math.exp(-d / 0.3);
  });
  l += (1 - FONDO - 0.16) * morbido((s - TEMPI.onda[0]) / ACCENSIONE);
  return Math.min(1, l);
}

const quando = (s: number) => blocca(s / DURATA);

/** I fotogrammi dell'opacità di un sistema: si spegne subito, resta al buio (`buio`, in frazione di com'era),
 *  e torna in `dura` secondi quando la luce lo raggiunge, al secondo `sveglia`. */
export function chiavi(buio: number, sveglia: number, dura: number, pieno = 1): Keyframe[] {
  const fine = Math.min(sveglia + dura, DURATA - 0.1);
  return [
    { offset: 0, opacity: pieno, easing: "ease-in-out" },
    { offset: quando(TEMPI.buio), opacity: pieno * buio, easing: "linear" },
    { offset: quando(Math.min(sveglia, fine)), opacity: pieno * buio, easing: "ease-out" },
    { offset: quando(fine), opacity: pieno, easing: "linear" },
    { offset: 1, opacity: pieno },
  ];
}

/** Appena acceso uno strumento è un poco più chiaro, e poi si posa. */
export function fioritura(sveglia: number): Keyframe[] {
  const a = Math.min(sveglia, DURATA - 2.2);
  return [
    { offset: 0, filter: "brightness(1)", easing: "linear" },
    { offset: quando(a), filter: "brightness(1)", easing: "ease-out" },
    { offset: quando(a + 0.5), filter: "brightness(1.45)", easing: "ease-in-out" },
    { offset: quando(a + 2.1), filter: "brightness(1)", easing: "linear" },
    { offset: 1, filter: "brightness(1)" },
  ];
}
