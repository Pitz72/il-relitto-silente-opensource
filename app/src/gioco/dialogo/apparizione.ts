// ============================================================================
//  L'apparizione dell'Anziano (11 novembre 2026): i tempi.
//  Al primo incontro la figura si forma punto per punto: i punti nascono sulle
//  linee del pavimento, salgono girando intorno al sostegno e la chiudono dalla
//  base alla testa (Dialogo.tsx, `anziano`). Le parole compaiono soltanto quando
//  è finita, in dissolvenza (l'autore: «il testo deve apparire solo ad
//  animazione finita»).
// ============================================================================

/** L'apparizione di una figura quando il colloquio si apre: «primo» è il primo incontro della partita,
 *  «ritorno» le volte dopo; niente se si riprende un colloquio a metà. */
export type Arrivo = "primo" | "ritorno" | null;

/** I momenti della figura che hanno un'animazione: le due apparizioni, e la dissolvenza nel seme al gesto
 *  del congedo («la luce si stringe in un punto, e il punto scende piano sul sostegno»: ponte.fav). */
export type Momento = "primo" | "ritorno" | "dissolvenza";

/**
 * Quanto dura, in secondi. Al primo incontro finisce tutta (la figura chiusa, l'alone posato, l'onda sul
 * pavimento spenta) quando, nel suono, il canto del primo contatto lascia il posto alla voce dell'Anziano
 * (`CANTO_VOCE` in mondo/musica.rs): le parole compaiono mentre comincia a parlare. La prova
 * prove/apparizione.test.ts tiene uguali i due numeri. Le altre volte, due secondi. La dissolvenza non ha una
 * voce da aspettare (a occhi chiusi parla soltanto il racconto): dura quanto il gesto, poco meno di sette secondi.
 */
export const DURATA = { primo: 4.6, ritorno: 2, dissolvenza: 6.8 } as const;
