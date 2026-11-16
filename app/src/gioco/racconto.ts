// ============================================================================
//  La voce di William nella pagina (documento 41): le risposte dei dialoghi che
//  William dice quando ci si ferma sopra con il mouse, come nel Viaggiatore. Il
//  racconto del turno no: quello lo trova il ponte nel testo a schermo, e lo
//  suona il motore audio (mondo/racconto.rs).
//  La tabella è la stessa del ponte: app/src/motore/racconto.json, scritta da
//  strumenti/audio/voce_william.py con le prese che ci sono.
// ============================================================================
export interface PezzoDelRacconto {
  id: string;
  file: string;
  tipo: string;
  parti: string[];
}

/** Le parole di un testo come le conta il ponte (`_parole` in ponte.py): minuscole, senza punteggiatura. */
export const parole = (testo: string) => (testo.replace(/’/g, "'").toLowerCase().match(/[\p{L}\p{N}_]+/gu) ?? []).join(" ");

/** Le risposte dei dialoghi registrate: le loro parole → la sigla della presa. */
export function risposteDa(json: string): Map<string, string> {
  const m = new Map<string, string>();
  try {
    for (const p of (JSON.parse(json) as { pezzi: PezzoDelRacconto[] }).pezzi) if (p.tipo === "opzione") m.set(p.parti.join(" "), p.file);
  } catch {
    /* senza tabella le risposte restano mute */
  }
  return m;
}

/** La presa di William per una risposta di un dialogo, se Leonardo l'ha già registrata. */
export const presaDellaRisposta = (etichetta: string, risposte: ReadonlyMap<string, string>): string | null => risposte.get(parole(etichetta)) ?? null;

/** Quanto bisogna fermarsi su una risposta perché William la dica: un terzo di secondo, come nel Viaggiatore. */
export const SOSTA = 330;
