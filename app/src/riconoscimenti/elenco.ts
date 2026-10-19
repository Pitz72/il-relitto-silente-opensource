// ============================================================================
//  La forma di elenco.json, l'elenco dei riconoscimenti e delle licenze che
//  genera strumenti/riconoscimenti.py dalle fonti vere (i suoni, la musica, le
//  immagini, i caratteri, i pacchetti JavaScript, i crate Rust, Pyodide). Lo
//  leggono i titoli di coda (Titoli.tsx); le note intere, con i testi delle
//  licenze, vanno nel file accanto al gioco che lo stesso strumento scrive.
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

/** I nomi delle librerie, una volta sola anche se ce n'è più di una versione, in ordine. */
export function nomiDelleLibrerie(e: Elenco): string[] {
  const tutti = [...e.javascript, ...Object.values(e.rust).flat()].map((p) => p.nome);
  return [...new Set(tutti)].sort((a, b) => a.localeCompare(b, "it"));
}
