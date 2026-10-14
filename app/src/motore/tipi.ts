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
  uscite: { comando: string; etichetta: string; stanza?: string | null }[];
  servizio: Scelta[];
}

/** Una cosa in vista, con i fatti su cui il modello d'azione filtra i verbi. */
export interface Cosa {
  id: string;
  etichetta: string;
  con_te: boolean;
  /** il nome come lo scrive la storia («Il risuonatore») */
  nome: string;
  /** gli altri nomi dichiarati dall'autore («razzo» per il bengala) */
  nomi: string[];
  prendibile: boolean;
  personaggio: boolean;
  /** le radici delle proprietà («chius», «vestit») */
  radici: string[];
  /** i verbi per cui l'autore ha scritto una regola su questa cosa sola */
  regole: string[];
  /** i verbi per cui c'è una regola con questa cosa e una seconda («usa X su Y») */
  regole_in_coppia: string[];
  /** verbo → le radici delle proprietà che le sue regole danno a questa cosa */
  effetti: Record<string, string[]>;
}

export interface StanzaMappa {
  nome: string;
  atto: number | null;
  /** direzione → stanza, se già vista; null se la direzione porta dove non sei stato */
  uscite: Record<string, string | null>;
}

export interface StatoStrumenti {
  stanza: string;
  nome_stanza: string | null;
  atto: number;
  titolo_atto: string;
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
  /** quali contatori del visore sono già entrati nel gioco (06, §4.3) */
  mostra: { aria: boolean; matrice: boolean; voci: boolean; chiavi: boolean; tracce: boolean };
  turno: number;
  inventario: string[];
  visitate: string[];
  mappa: Record<string, StanzaMappa>;
  dialogo: string | null;
  nodo: string | null;
}

/** Gli stati che servono al suono (bibbia sonora, §2.4). */
export interface StatiSuono {
  stanza: string;
  atto: number;
  tuta: boolean;
  aria: number | null;
  protezione: boolean;
  fuga: string | null;
  ingresso: string | null;
  contatto: string | null;
  connessione: string | null;
  energia: string | null;
  dialogo: string | null;
  nodo: string | null;
  faro: "pieno" | "basso" | null;
  bengala: "acceso" | "spento" | null;
  minaccia: string | null;
  groviglio: "quieto" | "desto" | null;
  teca: "sigillata" | "svuotata" | null;
  seme: "vivente" | "scuro" | null;
  seme_con_te: boolean;
  risuonatore: "incastrato" | "staccato" | null;
  risuonatore_con_te: boolean;
  taglio: number | null;
  archivio: string | null;
  nota: string | null;
  aggancio: string | null;
  scansione: string | null;
  proiezione: string | null;
  sistema: string | null;
  ricarica: string | null;
  voce_nomi: string | null;
  porta_interna: "aperta" | "chiusa" | null;
  porta_circolare: "aperta" | "chiusa" | null;
  grande_porta: "aperta" | "chiusa" | null;
  pannello: "acceso" | "spento" | null;
  giuntura: "compatta" | "tagliata" | null;
  altare: "serrato" | "schiuso" | null;
  terminale: "spento" | "acceso" | null;
  cristallo: "opaco" | "attivo" | null;
  disco: "incastrato" | "staccato" | null;
  kit: "chiuso" | "aperto" | null;
  cassetta: "chiusa" | "aperta" | null;
  registro: "intonso" | "sfogliato" | null;
  tacche: "vergine" | "segnata" | null;
  cella: boolean;
  chiavi: number | null;
  traduzione: number | null;
  echi: number | null;
  risonanze: number | null;
  tracce: number | null;
  risonate: string[];
  esito: string;
}

/** Un evento per il suono, trovato per differenza di stato (o per comando). */
export interface EventoSuono {
  evento: string;
  [campo: string]: unknown;
}

/** Il comando del turno, scomposto. */
export interface ComandoAnalizzato {
  testo: string;
  verbo: string | null;
  cosa: string | null;
  secondo: string | null;
  gruppo: "scelta" | "uscita" | "verbo" | "servizio" | "scritto" | null;
}

export interface Turno {
  ok: true;
  /** solo nel primo turno: l'intestazione e il prologo (nell'app, l'intro) */
  apertura?: Evento[];
  eventi: Evento[];
  pulsanti: Pulsanti;
  cose: Cosa[];
  stato: StatoStrumenti;
  suono: { stati: StatiSuono; eventi: EventoSuono[] };
  comando: ComandoAnalizzato | null;
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
  versione?: { gioco: string | null; formatoSalvataggi: number };
  errore?: string;
  rapporto?: string;
}

export interface SceltaPulsante {
  trovato: boolean;
  /** «nessun effetto»: il comando non cambia niente, e non c'è niente da premere (comando null) */
  modo?: "uguale" | "equivalente" | "stesso stato" | "nessun effetto";
  comando?: string | null;
  gruppo?: "scelta" | "uscita" | "verbo" | "servizio" | null;
  etichetta?: string | null;
  prove?: number;
  fase?: string;
  ms: number;
}

export interface Percorso {
  comandi: string[];
  attese: string[];
}

/** Il file di un salvataggio (lo scrive rel_salva, lo legge rel_carica). */
export interface Salvataggio {
  formato: "il-relitto-silente/salvataggio";
  versione: number;
  gioco: string | null;
  identita: string | null;
  creato: string | null;
  motore: string;
  impronta_storia: string;
  seme: number;
  riassunto: {
    stanza: string;
    nome_stanza: string | null;
    atto: number;
    titolo_atto: string;
    turno: number;
    aria: number | null;
    esito: string;
  };
  /** il salvataggio del motore: la sequenza dei comandi e l'impronta dello stato */
  partita: Record<string, unknown>;
}

export type EsitoCaricamento =
  | { ok: true; esito: "identica" | "ricostruita" | "diversa"; messaggio: string; impronta: string; turno: Turno; ms: number }
  | { ok: false; motivo: "illeggibile" | "formato" | "piu_recente" | "danneggiato" | "motore"; messaggio: string; ms: number };
