// ============================================================================
//  Le atmosfere (06-app-desktop.md, §5): il tema dello schermo come stato del
//  gioco. Un'atmosfera di base (Santa Maria, visore, relitto, fuga), le zone
//  del relitto, e due stati che le attraversano: la protezione vitale e
//  l'ipossia. Più la forma: l'acciaio della Santa Maria, la membrana dal primo
//  contatto (§3, «C rivista»).
//
//  È l'unica fonte dei colori: lo schermo li riceve come variabili CSS
//  (variabiliCss), la prova dei contrasti (prove/atmosfere.test.ts) li misura
//  da qui. Puro: niente DOM.
//
//  I ruoli. Il testo, il tenue (didascalie, etichette, il turno passato),
//  l'accento e l'accento 2 sono colori di TESTO: stanno sopra 4,5:1 su ogni
//  fondo su cui compaiono, in ogni atmosfera e in ogni stato. Le vene, la
//  spenta, il bordo e l'alone sono DECORAZIONE: non portano mai parole. Il
//  fuoco (l'anello della tastiera) sta sopra 3:1 sul fondo e sulla lamina.
// ============================================================================
import type { StatoStrumenti } from "../motore/tipi.ts";

export type Atmosfera = "santamaria" | "visore" | "relitto" | "fuga";
export type Forma = "acciaio" | "membrana";

export interface Tavolozza {
  /** il fondo dello schermo, dal centro ai bordi */
  fondo1: string;
  fondo2: string;
  /** la lamina del testo, in alto e in basso (opaca: niente trasparenze sul testo) */
  lamina1: string;
  lamina2: string;
  testo: string;
  tenue: string;
  /** testo accentato: le voci, le uscite («bocche») */
  accento: string;
  /** testo accentato forte: i suggerimenti, ciò che è acceso */
  accento2: string;
  /** decorazione: le venature e la loro luce */
  vena: string;
  vena2: string;
  spenta: string;
  bordo: string;
  alone: string;
  fuoco: string;
  /** la protezione vitale, scritta */
  rosso: string;
  /** le targhe a stampo dell'acciaio (TSC-1972 · REGISTRO DI BORDO) */
  targa: string;
}

// ----------------------------------------------------------------------------
//  Le tavolozze di base. I valori vengono da 06-proposta-membrana.html; dove la
//  tavola stava sotto 4,5:1 per un testo, il colore è schiarito (la targa).
// ----------------------------------------------------------------------------
const SANTA_MARIA: Tavolozza = {
  fondo1: "#14110e",
  fondo2: "#080706",
  lamina1: "#16130f",
  lamina2: "#100e0b",
  testo: "#ede3d3",
  tenue: "#a39684",
  accento: "#e8833f", // la ruggine
  accento2: "#f2a03d", // l'ambra
  vena: "#e07a3c",
  vena2: "#f2a03d",
  spenta: "#4a3b2c",
  bordo: "#3a2f24",
  alone: "rgba(242, 160, 61, 0)",
  fuoco: "#f2a03d",
  rosso: "#ff5247",
  targa: "#918069",
};

/** Con la tuta: la stessa luce, più il bordo del visore (la cifra verde
 *  dell'aria la dà coloreAria). */
const VISORE: Tavolozza = { ...SANTA_MARIA, alone: "rgba(125, 227, 155, 0.05)" };

const RELITTO: Tavolozza = {
  fondo1: "#071312",
  fondo2: "#020606",
  lamina1: "#0b1e1d",
  lamina2: "#071514",
  testo: "#d9f2ea",
  tenue: "#7fa9a3",
  accento: "#5fd4dc", // il ciano della luce del corridoio
  accento2: "#8bf0a2", // il verde del seme
  vena: "#5fd4dc",
  vena2: "#8bf0a2",
  spenta: "#2c5352",
  bordo: "#1f4243",
  alone: "rgba(139, 240, 162, 0.10)",
  fuoco: "#8bf0a2",
  rosso: "#ff5247",
  targa: "#7d9c99",
};

const FUGA: Tavolozza = {
  fondo1: "#1b0807",
  fondo2: "#060202",
  lamina1: "#220b0a",
  lamina2: "#170606",
  testo: "#f3dedb",
  tenue: "#b08c88",
  accento: "#ff6a5a",
  accento2: "#ffb020",
  vena: "#ff5a4a",
  vena2: "#ffb020",
  spenta: "#5a2522",
  bordo: "#4a1c19",
  alone: "rgba(255, 90, 74, 0.08)",
  fuoco: "#ffb020",
  rosso: "#ff6a5a",
  targa: "#a8857f",
};

export const TAVOLOZZE: Readonly<Record<Atmosfera, Tavolozza>> = {
  santamaria: SANTA_MARIA,
  visore: VISORE,
  relitto: RELITTO,
  fuga: FUGA,
};

/** L'acciaio dentro la luce fredda del relitto: la camera di compensazione,
 *  prima del primo contatto. La lamina e le targhe si raffreddano. */
const ACCIAIO_FREDDO: Partial<Tavolozza> = {
  lamina1: "#101819",
  lamina2: "#0b1112",
  bordo: "#2a3a3c",
  targa: "#7f9696",
};

// ----------------------------------------------------------------------------
//  Le zone del relitto (§5): variazioni dell'accento, stanza per stanza.
//  Toccano solo la decorazione e il fondo; il testo resta quello del relitto.
// ----------------------------------------------------------------------------
export const ZONE: Readonly<Record<string, Partial<Tavolozza>>> = {
  // la serra morente, secca e grigia
  "serra morente": { vena: "#8fa39a", vena2: "#b9c79d", spenta: "#3b4541", fondo1: "#0d1211" },
  // il laboratorio di risonanza, elettrico
  "laboratorio di risonanza": { vena: "#79b6ff", vena2: "#c4e3ff", spenta: "#24405e", fondo1: "#07101a" },
  // i santuari, bianchi
  "santuario del silenzio": { vena: "#cfe3df", vena2: "#f4ebd0", spenta: "#3f4d4b", fondo1: "#0c1414" },
  "santuario centrale": { vena: "#cfe3df", vena2: "#f4ebd0", spenta: "#3f4d4b", fondo1: "#0c1414" },
  // l'anticamera, nera
  anticamera: { vena: "#3e6a6b", vena2: "#5f8f86", spenta: "#1c2e2e", fondo1: "#030606", fondo2: "#000202" },
};

// ----------------------------------------------------------------------------
//  I colori
// ----------------------------------------------------------------------------
type Rgb = [number, number, number];

export function rgb(colore: string): Rgb {
  const h = colore.trim().replace("#", "");
  if (/^[0-9a-f]{6}$/i.test(h)) return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(colore.trim());
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  throw new Error(`colore non riconosciuto: ${colore}`);
}

const esa = ([r, g, b]: Rgb) =>
  "#" + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("");

const lineare = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const gamma = (l: number) => 255 * (l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055);

/** La luminanza relativa (WCAG 2.x). */
export function luminanza(colore: string): number {
  const [r, g, b] = rgb(colore).map(lineare);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Il rapporto di contrasto WCAG fra due colori opachi, da 1 a 21. */
export function contrasto(a: string, b: string): number {
  const [x, y] = [luminanza(a), luminanza(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Un colore spento verso il grigio della sua stessa luminanza: il contrasto
 *  resta quello, il colore se ne va (l'ipossia). */
export function spegni(colore: string, quota: number): string {
  if (colore.startsWith("rgba")) {
    const alfa = Number(/,\s*([\d.]+)\s*\)$/.exec(colore)?.[1] ?? 1);
    const [r, g, b] = rgb(spegni(esa(rgb(colore)), quota));
    return `rgba(${r}, ${g}, ${b}, ${alfa})`;
  }
  // in luce lineare: il grigio ha la stessa luminanza, e la miscela anche
  const y = luminanza(colore);
  return esa(rgb(colore).map((x) => gamma(lineare(x) + (y - lineare(x)) * quota)) as Rgb);
}

/** Due colori mescolati in sRGB (q = quanto del secondo). */
export function mescola(a: string, b: string, q: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return esa(x.map((v, i) => v + (y[i] - v) * q) as Rgb);
}

// ----------------------------------------------------------------------------
//  La tavolozza di un momento del gioco
// ----------------------------------------------------------------------------
export interface Clima {
  atmosfera: Atmosfera;
  forma: Forma;
  /** la stanza, per le zone del relitto */
  stanza: string | null;
  protezione: boolean;
  ipossia: boolean;
}

/** Quanto l'ipossia spegne i colori (§5: «i colori si spengono del 60%»). */
export const SPEGNIMENTO_IPOSSIA = 0.6;

export function tavolozza(c: Clima): Tavolozza {
  let t: Tavolozza = { ...TAVOLOZZE[c.atmosfera] };
  if (c.atmosfera === "relitto" && c.stanza && ZONE[c.stanza]) t = { ...t, ...ZONE[c.stanza] };
  if (c.forma === "acciaio" && c.atmosfera === "relitto") t = { ...t, ...ACCIAIO_FREDDO };
  if (c.protezione) {
    // le venature si spengono, il rosso entra; i testi accentati restano leggibili
    t = {
      ...t,
      vena: mescola(t.spenta, t.vena, 0.35),
      vena2: mescola(t.spenta, t.vena2, 0.35),
      accento: spegni(t.accento, 0.35),
      accento2: spegni(t.accento2, 0.35),
      alone: "rgba(255, 82, 71, 0.06)",
      bordo: mescola(t.bordo, "#5a2a27", 0.5),
    };
  }
  if (c.ipossia) {
    const q = SPEGNIMENTO_IPOSSIA;
    t = {
      ...t,
      accento: spegni(t.accento, q),
      accento2: spegni(t.accento2, q),
      vena: spegni(mescola(t.vena, t.fondo1, 0.3), q),
      vena2: spegni(mescola(t.vena2, t.fondo1, 0.3), q),
      spenta: spegni(t.spenta, q),
      bordo: spegni(t.bordo, q),
      alone: "rgba(0, 0, 0, 0)",
      fuoco: spegni(t.fuoco, q * 0.5),
      targa: spegni(t.targa, q),
      tenue: spegni(t.tenue, q),
    };
  }
  return t;
}

/** Il colore dell'aria (§4.3): verde, ambra sotto 60, rosso sotto 30, il rosso
 *  spento dell'ipossia a 15 e sotto. Non è mai l'unico segnale: la forma della
 *  cellula e la scritta cambiano insieme. */
export function coloreAria(aria: number | null): string {
  if (aria === null) return "#8f9a97";
  if (aria >= 60) return "#7de39b";
  if (aria >= 30) return "#f2b23d";
  if (aria > 15) return "#ff5247";
  return "#e86a62";
}

export type StatoAria = "assente" | "regolare" | "ambra" | "rosso" | "ipossia";

export function statoAria(aria: number | null): StatoAria {
  if (aria === null) return "assente";
  if (aria >= 60) return "regolare";
  if (aria >= 30) return "ambra";
  if (aria > 15) return "rosso";
  return "ipossia";
}

// ----------------------------------------------------------------------------
//  Dallo stato del gioco al clima dello schermo
// ----------------------------------------------------------------------------
/** Le stanze della Santa Maria e dello scafo: lì la luce è quella di bordo. */
const DI_BORDO = new Set(["plancia", "cuccetta", "sala macchine", "stiva", "scafo"]);

/** Il clima di un momento del gioco. La membrana cresce al primo contatto (nel
 *  vestibolo, «per farsi sentire beve dalla mia stessa batteria»), non prima:
 *  nella camera di compensazione la luce è già del relitto, l'interfaccia è
 *  ancora acciaio. La protezione vitale è quella del gioco (sotto 30, prima
 *  della fuga); l'ipossia comincia a 15, con la tuta addosso. */
export function climaDi(s: StatoStrumenti): Clima {
  const forma: Forma = s.contatto === "avvenuto" ? "membrana" : "acciaio";
  let atmosfera: Atmosfera;
  if (s.fuga === "iniziata") atmosfera = "fuga";
  else if (!DI_BORDO.has(s.stanza)) atmosfera = "relitto";
  else if (s.tuta) atmosfera = "visore";
  else atmosfera = "santamaria";
  return {
    atmosfera,
    forma,
    stanza: s.stanza,
    protezione: s.protezione,
    ipossia: s.aria !== null && s.aria <= 15 && (s.tuta || s.fuga === "iniziata"),
  };
}

/** Le variabili CSS di una tavolozza (le registra base.css, che le fa passare
 *  da un'atmosfera all'altra in un secondo e mezzo). */
export function variabiliCss(t: Tavolozza, aria: number | null): Record<string, string> {
  return {
    "--fondo-1": t.fondo1,
    "--fondo-2": t.fondo2,
    "--lamina-1": t.lamina1,
    "--lamina-2": t.lamina2,
    "--testo": t.testo,
    "--tenue": t.tenue,
    "--accento": t.accento,
    "--accento-2": t.accento2,
    "--vena": t.vena,
    "--vena-2": t.vena2,
    "--spenta": t.spenta,
    "--bordo": t.bordo,
    "--alone": t.alone,
    "--fuoco": t.fuoco,
    "--rosso": t.rosso,
    "--targa": t.targa,
    "--aria": coloreAria(aria),
  };
}

// ----------------------------------------------------------------------------
//  Che cosa si misura (la prova e il campionario usano la stessa lista)
// ----------------------------------------------------------------------------
export interface Coppia {
  ruolo: string;
  /** il colore del testo (o della forma), e il fondo su cui sta */
  davanti: keyof Tavolozza | "aria";
  dietro: keyof Tavolozza;
  /** 4,5 per il testo, 3 per il fuoco e le cifre grandi */
  minimo: number;
}

export const COPPIE: readonly Coppia[] = [
  { ruolo: "testo sulla lamina", davanti: "testo", dietro: "lamina1", minimo: 4.5 },
  { ruolo: "testo in fondo alla lamina", davanti: "testo", dietro: "lamina2", minimo: 4.5 },
  { ruolo: "tenue sulla lamina", davanti: "tenue", dietro: "lamina1", minimo: 4.5 },
  { ruolo: "tenue sul fondo", davanti: "tenue", dietro: "fondo1", minimo: 4.5 },
  { ruolo: "accento sulla lamina", davanti: "accento", dietro: "lamina1", minimo: 4.5 },
  { ruolo: "accento sul fondo", davanti: "accento", dietro: "fondo1", minimo: 4.5 },
  { ruolo: "accento 2 sulla lamina", davanti: "accento2", dietro: "lamina1", minimo: 4.5 },
  { ruolo: "accento 2 sul fondo", davanti: "accento2", dietro: "fondo1", minimo: 4.5 },
  { ruolo: "protezione vitale sulla lamina", davanti: "rosso", dietro: "lamina1", minimo: 4.5 },
  { ruolo: "targa sulla lamina", davanti: "targa", dietro: "lamina1", minimo: 4.5 },
  { ruolo: "cifra dell'aria sul fondo", davanti: "aria", dietro: "fondo1", minimo: 4.5 },
  { ruolo: "fuoco sul fondo", davanti: "fuoco", dietro: "fondo1", minimo: 3 },
  { ruolo: "fuoco sulla lamina", davanti: "fuoco", dietro: "lamina1", minimo: 3 },
];

/** Tutti i climi possibili: ogni atmosfera, con e senza gli stati, nelle forme
 *  in cui compare, e le zone. */
export function tuttiIClimi(): Clima[] {
  const out: Clima[] = [];
  const forme: Record<Atmosfera, Forma[]> = {
    santamaria: ["acciaio"],
    visore: ["acciaio"],
    relitto: ["acciaio", "membrana"],
    fuga: ["membrana"],
  };
  for (const atmosfera of Object.keys(TAVOLOZZE) as Atmosfera[]) {
    const stanze = atmosfera === "relitto" ? [null, ...Object.keys(ZONE)] : [null];
    for (const forma of forme[atmosfera])
      for (const stanza of stanze)
        for (const protezione of atmosfera === "relitto" ? [false, true] : [false])
          for (const ipossia of atmosfera === "santamaria" ? [false] : [false, true])
            out.push({ atmosfera, forma, stanza, protezione, ipossia });
  }
  return out;
}

/** I contrasti di un clima, con l'aria peggiore per quel clima. */
export function misura(c: Clima): { coppia: Coppia; rapporto: number }[] {
  const t = tavolozza(c);
  const arie: (number | null)[] = c.ipossia ? [15, 5] : c.protezione ? [29, 20] : c.atmosfera === "santamaria" ? [null] : [100, 59, 30, 29, 16];
  const out: { coppia: Coppia; rapporto: number }[] = [];
  for (const coppia of COPPIE) {
    const dietro = t[coppia.dietro];
    if (coppia.davanti === "aria") {
      const peggiore = Math.min(...arie.map((a) => contrasto(coloreAria(a), dietro)));
      out.push({ coppia, rapporto: peggiore });
    } else out.push({ coppia, rapporto: contrasto(t[coppia.davanti], dietro) });
  }
  return out;
}
