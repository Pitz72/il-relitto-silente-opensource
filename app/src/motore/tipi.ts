// I dati che il ponte (ponte.py) restituisce, in forma TypeScript.

export interface Evento {
  tipo:
    | "intestazione"
    | "stanza"
    | "testo"
    | "elenco"
    | "domanda"
    | "dialogo"
    | "opzione"
    | "sistema"
    | "fine"
    | "errore";
  testo: string;
  stacco?: boolean;
  dati?: Record<string, unknown>;
}

export interface Scelta {
  etichetta: string;
  comando: string;
}

export interface OggettoPulsante {
  id: string;
  etichetta: string;
  con_te: boolean;
}

export interface Secondo {
  id?: string;
  etichetta: string;
  testo: string;
}

export interface VerboPulsante {
  verbo: string;
  etichetta: string;
  oggetto: boolean;
  da_solo: boolean;
  primi: { id: string; testo: string }[];
  secondo: "no" | "facoltativo" | "obbligatorio";
  secondi?: Secondo[];
  secondi_per?: Record<string, Secondo[]>;
}

export interface Pulsanti {
  modo: "entrambi" | "pulsanti" | "testo";
  fase: "gioco" | "dialogo" | "conferma" | "scelta" | "fine";
  scelte: Scelta[];
  oggetti: OggettoPulsante[];
  verbi: VerboPulsante[];
  uscite: { comando: string; etichetta: string; stanza?: string }[];
  servizio: Scelta[];
}

export interface StatoStrumenti {
  stanza: string;
  nome_stanza: string | null;
  aria: number | null;
  traduzione: number | null;
  echi: number | null;
  risonanze: number | null;
  chiavi: number | null;
  tracce: number | null;
  fuga: string | null;
  ingresso: string | null;
  contatto: string | null;
  energia: string | null;
  tuta: boolean;
  protezione: boolean;
  turno: number;
  inventario: string[];
  visitate: string[];
  dialogo: string | null;
}

export interface Turno {
  ok: true;
  eventi: Evento[];
  pulsanti: Pulsanti;
  stato: StatoStrumenti;
  esito: "in_corso" | "vinta" | "persa" | string;
  /** i tempi misurati dentro Python, in ms */
  ms: { motore: number; pulsanti: number; stato: number; json: number };
}

export interface Compilazione {
  ok: boolean;
  ms?: number;
  stanze?: number;
  oggetti?: number;
  motore?: string;
  impronta_storia?: string;
  errore?: string;
  rapporto?: string;
}

export interface SceltaPulsante {
  trovato: boolean;
  modo?: "uguale" | "stesso stato";
  comando?: string;
  gruppo?: "scelta" | "uscita" | "verbo" | "servizio";
  etichetta?: string;
  prove?: number;
  fase?: string;
  ms: number;
}

export interface Percorso {
  comandi: string[];
  attese: string[];
}
