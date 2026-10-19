/// <reference types="vite/client" />

/** Vero nello sviluppo e nelle consegne di ascolto (RELITTO_REGIA=1): c'è la console di regia. */
declare const __REGIA__: boolean;

declare const __VERSIONE__: {
  gioco: string;
  motore: string;
  formatoSalvataggi: number;
  commit: string;
  data: string;
};

/** Le righe «Per chi gioca» del CHANGELOG (vite.config.ts; src/menu/novita.ts): le versioni fino a
 *  questa, la più recente prima; «prossima», solo nello sviluppo, quelle di «Non rilasciato». */
declare const __NOVITA__: {
  elenco: { versione: string; data: string; righe: string[] }[];
  prossima: string[];
};
