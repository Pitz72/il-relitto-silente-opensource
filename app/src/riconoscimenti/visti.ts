// ============================================================================
//  Quando mostrare i riconoscimenti prima del gioco (06-app-desktop.md, §18.3):
//  al primo avvio, e dopo ogni aggiornamento che aggiunge nomi. Un nome è un
//  suono, un'immagine, un carattere, una libreria: una versione nuova della
//  stessa libreria non è un nome nuovo. I nomi già mostrati si ricordano nel
//  browser dell'app (localStorage), come le opzioni.
// ============================================================================

export interface Elenco {
  gioco: { titolo: string; autore: string; racconto: string };
  musica: { sigla: string; titolo: string; modello: string; fonte: string; autore: string; licenza: string; uso: string }[];
  suoni: { sigla: string; titolo: string; autore: string; fonte: string; url: string | null; licenza: string; ridistribuibile: string; uso: string }[];
  immagini: { file: string; che_cosa: string; da_dove: string; autore: string; licenza: string }[];
  caratteri: (Pacchetto & { famiglia: string; ruolo: string })[];
  principali: (Pacchetto & { ruolo: string })[];
  javascript: Pacchetto[];
  /** per piattaforma (x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu…) */
  rust: Record<string, Pacchetto[]>;
  /** i testi delle licenze, per identificativo SPDX */
  testi: Record<string, string>;
}

export interface Pacchetto {
  nome: string;
  versione: string;
  /** come la dichiara il pacchetto («MIT OR Apache-2.0») */
  licenza: string;
  /** quelle con cui il gioco lo usa */
  usata: string[];
  copyright: string[];
  autori?: string[];
  sorgente: string | null;
}

/** I nomi dell'elenco, uno per cosa. */
export function nomi(e: Elenco): string[] {
  return [
    ...e.musica.map((m) => `musica:${m.titolo}|${m.modello}`),
    ...e.suoni.map((s) => `suono:${s.titolo}|${s.autore}`),
    ...e.immagini.map((i) => `immagine:${i.file}`),
    ...e.caratteri.map((c) => `carattere:${c.famiglia}`),
    ...e.principali.map((p) => `libreria:${p.nome}`),
    ...e.javascript.map((p) => `js:${p.nome}`),
    ...Object.values(e.rust).flatMap((l) => l.map((p) => `rust:${p.nome}`)),
  ].filter((x, i, a) => a.indexOf(x) === i);
}

/** C'è almeno un nome che chi gioca non ha ancora visto? */
export const ciSonoNomiNuovi = (attuali: readonly string[], visti: readonly string[]) => {
  const v = new Set(visti);
  return attuali.some((n) => !v.has(n));
};

const CHIAVE = "relitto.riconoscimenti-visti";

export function nomiVisti(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(CHIAVE) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function segnaVisti(n: readonly string[]): void {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(n));
  } catch {
    /* niente spazio: si rivedranno al prossimo avvio */
  }
}
