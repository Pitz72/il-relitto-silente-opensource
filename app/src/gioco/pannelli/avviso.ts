// Quanto resta a schermo un avviso (Pannelli.tsx, `useAvviso`). A parte, senza React, perché le prove lo leggano.

/** Quanto resta a schermo un avviso che se ne va da solo (ms): almeno come prima della revisione 37 (3,2 s, 6 se è
 *  grave), e di più se è lungo: quindici caratteri al secondo, più il tempo di accorgersene. La frase della partita
 *  ricostruita, di centocinquanta caratteri, restava 3,2 secondi (M5): ora non se ne va da sola. */
export function durataAvviso(testo: string, grave = false): number {
  return Math.max(grave ? 6000 : 3200, 1500 + testo.length * 70);
}
