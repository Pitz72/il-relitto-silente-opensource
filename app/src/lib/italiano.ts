// ============================================================================
//  Le parole fisse che il gioco scrive in più posti, scritte una volta sola
//  (revisione 25, L13: stavano copiate in quattro file i numeri degli atti, in
//  due i mesi). Pure: le prove le leggono in Node.
// ============================================================================

const ROMANI = ["I", "II", "III", "IV", "V"];

/** L'atto in numeri romani («III»); oltre il quinto, la cifra. */
export const romano = (n: number): string => ROMANI[n - 1] ?? String(n);

export const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
