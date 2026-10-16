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
