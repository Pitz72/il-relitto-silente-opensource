// ============================================================================
//  I glifi del titolo (scena G): «linee che si rincorrono, spirali, un ritmo».
//  Sedici forme, una per lettera di IL RELITTO SILENTE, sempre le stesse (un
//  seme fisso), nella cornice 32 × 56 della tavola dello storyboard. Ogni glifo
//  cambia forma due o tre volte prima che la matrice lo riconosca; l'ordine in
//  cui li riconosce non è da sinistra a destra.
// ============================================================================

export function generatore(seme: number) {
  return () => (seme = (seme * 16807) % 2147483647) / 2147483647;
}

/** I tratti di un glifo, come percorsi SVG nella cornice 32 × 56. */
export function glifo(r: () => number): string[] {
  const tratti: string[] = [];
  // una spirale piccola, da un lato
  const cx = 6 + r() * 20, cy = 10 + r() * 30, giri = 1.2 + r() * 1.3, verso = r() < 0.5 ? 1 : -1;
  let d = "";
  for (let k = 0; k <= 40; k++) {
    const t = k / 40, a = verso * t * giri * Math.PI * 2, rr = 1 + t * (5 + r() * 0.2);
    d += (k ? "L" : "M") + (cx + Math.cos(a) * rr).toFixed(1) + " " + (cy + Math.sin(a) * rr).toFixed(1);
  }
  tratti.push(d);
  // due linee che si rincorrono: la stessa curva, sfalsata
  const y0 = 4 + r() * 8, ampiezza = 4 + r() * 6, fase = r() * 6;
  for (const sfasa of [0, 5 + r() * 3]) {
    let c = "";
    for (let k = 0; k <= 24; k++) {
      const t = k / 24, x = 4 + t * 24 + sfasa * 0.3, y = y0 + t * 40 + Math.sin(t * 5 + fase) * ampiezza + sfasa;
      c += (k ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }
    tratti.push(c);
  }
  return tratti;
}

export interface GlifoDelTitolo {
  lettera: string;
  /** la posizione fra le lettere, spazi compresi */
  indice: number;
  /** le forme che prende, in ordine: l'ultima è quella che la matrice riconosce */
  forme: string[][];
  /** quando compare (0–1 dentro la comparsa) */
  compare: number;
  /** quando la matrice lo riconosce (0–1 dentro la traduzione) */
  riconosciuto: number;
}

/** I sedici glifi di IL RELITTO SILENTE. */
export function glifiDelTitolo(titolo: string): GlifoDelTitolo[] {
  const r = generatore(1972);
  const lettere = [...titolo].map((lettera, indice) => ({ lettera, indice })).filter((x) => x.lettera !== " ");
  // l'ordine del riconoscimento: un mescolamento con il seme
  const ordine = lettere.map((_, i) => i);
  const rm = generatore(73);
  for (let i = ordine.length - 1; i > 0; i--) {
    const j = Math.floor(rm() * (i + 1));
    [ordine[i], ordine[j]] = [ordine[j], ordine[i]];
  }
  return lettere.map((x, i) => {
    const forme = [glifo(r)];
    const cambi = 2 + (rm() < 0.5 ? 1 : 0);
    for (let k = 0; k < cambi; k++) forme.push(glifo(r));
    return {
      ...x,
      forme,
      compare: i / lettere.length,
      riconosciuto: (ordine.indexOf(i) + 1) / lettere.length,
    };
  });
}
