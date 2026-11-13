// ============================================================================
//  «Havela», l'inno degli alieni (documento 32, §3.11): le parole nella loro
//  lingua inventata, «la morbida», con l'italiano accanto, sui tempi del file
//  `audio/musica-ia/CT/CT-02-havela.mp3` (178 secondi). Si ascolta dal colloquio
//  con l'Anziano, al nodo «musica», con «Ascolta il canto» (Inno.tsx); la musica
//  la suona il motore audio (mondo/musica.rs, `inno`).
//
//  I tempi sono quelli del canto: la voce entra a 18 s, i ritornelli a 55 e a
//  119,5, il congedo a 148, e dopo 170 il canto sfuma in silenzio (l'energia
//  della banda della voce, misurata sul file). Dentro ogni strofa i tempi delle
//  righe sono a orecchio: ogni riga sta a schermo fino alla fine della strofa,
//  quindi qualche secondo di scarto non si vede.
// ============================================================================

export interface Riga {
  /** da che secondo del brano compare */
  da: number;
  /** nella loro lingua */
  loro: string;
  /** in italiano */
  italiano: string;
}

export interface Strofa {
  /** il nome, per chi legge il codice */
  nome: "strofa" | "ritornello" | "congedo";
  righe: readonly Riga[];
  /** a che secondo se ne va dallo schermo (il momento in cui comincia la strofa dopo, o la fine del canto) */
  fino: number;
}

/** Quanto dura il file: lo stesso numero di `INNO_DURATA` in mondo/musica.rs (la prova `inno.test.ts` li tiene uguali). */
export const INNO_DURATA = 178;

const RITORNELLO = (da: number): Riga[] => [
  { da, loro: "Nahemo selano,", italiano: "Noi siamo un canto," },
  { da: da + 5.5, loro: "nahemo selana.", italiano: "noi siamo un seme." },
  { da: da + 12, loro: "Havela, menuri,", italiano: "Vivi, giardino," },
  { da: da + 18, loro: "havela.", italiano: "vivi." },
];

export const STROFE: readonly Strofa[] = [
  {
    nome: "strofa",
    fino: 55,
    righe: [
      { da: 18, loro: "Tire oruma, nime selana.", italiano: "Tre soli, un seme solo." },
      { da: 30, loro: "Sivane oruma rosime,", italiano: "Vedemmo i soli sanguinare," },
      { da: 34.5, loro: "na hurane ulame.", italiano: "non maledicemmo il cielo." },
      { da: 42, loro: "Lovane, lovane.", italiano: "Piantammo, piantammo." },
    ],
  },
  { nome: "ritornello", fino: 85, righe: RITORNELLO(55) },
  {
    nome: "strofa",
    fino: 119.5,
    righe: [
      { da: 85, loro: "Lovane, na homane.", italiano: "Piantammo, e non raccogliemmo." },
      { da: 92, loro: "Alane, na revane.", italiano: "Salimmo, e non arrivammo." },
      { da: 100, loro: "Na sohura, na sohura:", italiano: "Non fu una fuga, non fu una fuga:" },
      { da: 109, loro: "selanave.", italiano: "fu una semina." },
    ],
  },
  { nome: "ritornello", fino: 148, righe: RITORNELLO(119.5) },
  {
    nome: "congedo",
    fino: 172,
    righe: [
      { da: 148, loro: "Selano nahema veluna,", italiano: "Il nostro canto è finito," },
      { da: 153.5, loro: "isena lemora ahena.", italiano: "a te resta il fiato." },
      { da: 159.5, loro: "Menuri eno.", italiano: "Il giardino è qui." },
      { da: 165, loro: "Havela.", italiano: "Vivi." },
    ],
  },
];

/** Che cosa si vede al secondo `s` del brano: la strofa in corso e quante sue righe sono già comparse. */
export function aSchermo(s: number): { strofa: Strofa; quante: number } | null {
  const strofa = STROFE.find((x) => s >= x.righe[0].da && s < x.fino);
  if (!strofa) return null;
  return { strofa, quante: strofa.righe.filter((r) => s >= r.da).length };
}
