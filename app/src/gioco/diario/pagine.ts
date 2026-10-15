// ============================================================================
//  Le pagine del diario (06-app-desktop.md, §4.3 e §4.6), composte dalla
//  cronaca che il ponte tiene (ponte.py, _voce_di_cronaca). Puro: niente
//  React, niente motore. I segni li trova il ponte, dallo stato e dal comando;
//  qui si raccolgono e si ordinano.
//    trascrizione  tutta la partita, comando per comando
//    fascicolo     chi è passato prima: le tracce di L.V. nell'ordine della sua
//                  strada, mai con i posti vuoti (non si dice quante mancano);
//                  si chiama «L.V.» solo dopo che la placca l'ha detto
//    voci          le voci ascoltate, nell'ordine in cui le hai sentite
//    traduzioni    i reperti decifrati, e ogni iscrizione nella lettura fatta
//                  con la matrice più avanti
// ============================================================================
import type { TracciaLV, VoceCronaca } from "../../motore/tipi";

export type IdPagina = "trascrizione" | "fascicolo" | "voci" | "traduzioni";

/** Le tracce, nell'ordine della strada di L.V. (vita.fav: entrò dalla giuntura,
 *  segnò le tacche, perse il cavo guida fra le teche, morì nella serra). */
export const TRACCE: readonly { id: TracciaLV; titolo: string }[] = [
  { id: "giuntura", titolo: "La giuntura" },
  { id: "tacche", titolo: "Le tacche" },
  { id: "cavo", titolo: "Il cavo guida" },
  { id: "uomo", titolo: "L’uomo" },
  { id: "voce", titolo: "La sua voce" },
];

export interface Traccia {
  id: TracciaLV;
  titolo: string;
  voce: VoceCronaca;
}

export interface Lettura {
  cosa: string;
  nome: string;
  /** la matrice di traduzione al momento della lettura, in percentuale */
  matrice: number;
  voce: VoceCronaca;
}

export interface Reperto {
  cosa: string;
  nome: string;
  voce: VoceCronaca;
}

export interface Pagine {
  fascicolo: { iniziali: boolean; tracce: Traccia[] };
  voci: VoceCronaca[];
  traduzioni: { reperti: Reperto[]; iscrizioni: Lettura[] };
}

export function pagine(cronaca: readonly VoceCronaca[]): Pagine {
  const trovate = new Map<TracciaLV, VoceCronaca>();
  const iscrizioni = new Map<string, Lettura>();
  const reperti: Reperto[] = [];
  let iniziali = false;
  for (const v of cronaca) {
    for (const t of v.tracce) if (!trovate.has(t)) trovate.set(t, v);
    if (v.iniziali) iniziali = true;
    for (const r of v.reperti) reperti.push({ ...r, voce: v });
    const l = v.lettura;
    if (l) {
      // la lettura più avanti vince; a pari matrice, l'ultima
      const prima = iscrizioni.get(l.cosa);
      if (!prima || l.matrice >= prima.matrice) iscrizioni.set(l.cosa, { ...l, voce: v });
    }
  }
  return {
    fascicolo: {
      iniziali,
      tracce: TRACCE.filter((t) => trovate.has(t.id)).map((t) => ({ ...t, voce: trovate.get(t.id)! })),
    },
    voci: cronaca.filter((v) => v.voce),
    // le iscrizioni nell'ordine in cui le hai lette la prima volta (la Map lo conserva)
    traduzioni: { reperti, iscrizioni: [...iscrizioni.values()] },
  };
}

/** Le pagine che hanno qualcosa: la trascrizione sempre, le altre quando la
 *  loro meccanica entra nel gioco (come i contatori del visore, §4.3). */
export function pagineAperte(p: Pagine): IdPagina[] {
  const out: IdPagina[] = ["trascrizione"];
  if (p.fascicolo.tracce.length) out.push("fascicolo");
  if (p.voci.length) out.push("voci");
  if (p.traduzioni.reperti.length || p.traduzioni.iscrizioni.length) out.push("traduzioni");
  return out;
}

/** Il nome di una pagina, come lo legge chi gioca. */
export function titoloPagina(id: IdPagina, p: Pagine): string {
  switch (id) {
    case "trascrizione":
      return "Trascrizione";
    case "fascicolo":
      return p.fascicolo.iniziali ? "L.V." : "Prima di te";
    case "voci":
      return "Voci";
    case "traduzioni":
      return "Traduzioni";
  }
}

/** «vestibolo delle gole» → «Vestibolo delle gole», con l'apostrofo tipografico. */
export const nomeDiLuogo = (s: string | null) => (s ?? "").replace(/'/g, "’").replace(/^./, (x) => x.toUpperCase());

/** «al 18%», «allo 0%», «all’8%»: la preposizione segue il numero come si legge. */
export const allaMatrice = (n: number) =>
  `${n === 0 ? "allo " : n === 8 || n === 11 || (n >= 80 && n < 90) ? "all’" : "al "}${n}%`;
