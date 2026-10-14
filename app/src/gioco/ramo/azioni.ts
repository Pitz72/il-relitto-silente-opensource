// ============================================================================
//  Dal modello d'azione ai pezzi del ramo e del fiore (06-app-desktop.md,
//  §6.1). Puro: il ramo e il fiore li disegna Ramo.tsx.
//
//  - Le cose diventano baccelli; le uscite bocche; le azioni di situazione e
//    il servizio stanno in fondo al filo alto.
//  - Gli attrezzi stanno in testa al filo basso. Il multiscanner e la matrice
//    sono della tuta: hanno un baccello loro, e si prendono in mano con un
//    tocco. Il Sintonizzatore e la taglierina sono cose che porti: il loro
//    fiore ha anche i verbi dell'attrezzo («Sintonizza…»), che lo mettono in mano.
//  - Il fiore di una cosa: la base e i verbi dell'autore sull'anello vicino,
//    gli attrezzi su quello fuori (12, §9).
//  - I suggerimenti del testo accendono il loro pulsante per qualche secondo.
// ============================================================================
import type { Cosa } from "../../motore/tipi.ts";
import type { Attrezzo, IdAttrezzo, MenuCosa, ModelloAzione, Voce } from "../../azione/modello.ts";

/** Che cosa fa un pulsante del ramo o del fiore. */
export type Azione =
  | { tipo: "comando"; comando: string; comeSiLegge?: string }
  | { tipo: "apri"; cosa: string }
  | { tipo: "chiudi" }
  | { tipo: "usaCon"; cosa: string; voce: Voce }
  | { tipo: "inMano"; attrezzo: IdAttrezzo; verbo: string };

/** Che cosa è aperto o in mano adesso. */
export type Selezione =
  | { tipo: "nessuna" }
  | { tipo: "fiore"; cosa: string }
  | { tipo: "usaCon"; cosa: string; voce: Voce }
  | { tipo: "inMano"; attrezzo: IdAttrezzo; verbo: string; etichetta: string };

export const NESSUNA: Selezione = { tipo: "nessuna" };

const ARTICOLO = /^(il|lo|la|i|gli|le|l['’]|un|uno|una)(\s+|(?<=['’]))/i;

/** Il nome di una cosa come lo dice il testo, con l'articolo minuscolo
 *  («il risuonatore», «l’arca»); i nomi propri restano come sono («Yusuf»). */
export function nomeDi(c: Pick<Cosa, "nome" | "etichetta">): string {
  const n = (c.nome || c.etichetta).replace(/'/g, "’");
  return ARTICOLO.test(n) ? n[0].toLowerCase() + n.slice(1) : n;
}

/** Gli attrezzi che sono anche cose che porti. */
const ATTREZZI_COSA: Partial<Record<IdAttrezzo, string>> = { sintonizzatore: "sintonizzatore", taglierina: "taglierina" };

export interface Baccello {
  chiave: string;
  etichetta: string;
  /** quel che succede al tocco */
  azione: Azione;
  tipo: "cosa" | "bocca" | "azione" | "attrezzo" | "scelta";
  /** la cosa (per i baccelli delle cose e degli attrezzi-cosa) */
  cosa?: string;
  /** l'attrezzo, se il baccello lo è */
  attrezzo?: IdAttrezzo;
  /** il tasto (le uscite, le scelte) */
  tasto?: string | null;
  /** il titolo per chi passa con il mouse (dove porta un'uscita) */
  titolo?: string;
}

/** Il glifo del tasto di un'uscita, per impararlo guardando (§6.2). */
export const GLIFO_TASTO: Readonly<Record<string, string>> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  PageUp: "PgSu",
  PageDown: "PgGiù",
  Home: "Inizio",
  End: "Fine",
  Numpad7: "7",
  Numpad9: "9",
  Numpad1: "1",
  Numpad3: "3",
};

export interface GruppoDiBaccelli {
  nome: string;
  /** quel che si legge sopra il gruppo, se non è il nome */
  etichetta?: string;
  baccelli: Baccello[];
  riducibile: boolean;
}

export interface Fili {
  alto: GruppoDiBaccelli[];
  basso: GruppoDiBaccelli[];
}

/** I baccelli dei due fili. */
export function baccelliDi(m: ModelloAzione, cose: readonly Cosa[]): Fili {
  const nome = (id: string) => {
    const c = cose.find((x) => x.id === id);
    return c ? nomeDi(c) : id;
  };
  if (m.fase !== "gioco") {
    return {
      alto: [
        {
          nome: m.fase === "conferma" ? "conferma" : m.fase === "fine" ? "fine" : "risposte",
          riducibile: false,
          baccelli: m.scelte.map((s) => ({
            chiave: `scelta:${s.comando}`,
            etichetta: s.etichetta.replace(/'/g, "’"),
            azione: { tipo: "comando", comando: s.comando, comeSiLegge: s.etichetta },
            tipo: "scelta",
            tasto: s.tasto,
          })),
        },
      ],
      basso: [],
    };
  }
  const uscite: Baccello[] = m.uscite.map((u) => ({
    chiave: `uscita:${u.comando}`,
    etichetta: u.etichetta.toLowerCase(),
    azione: { tipo: "comando", comando: u.comando },
    tipo: "bocca",
    tasto: u.tasto,
    titolo: u.stanza ? `verso ${u.stanza.replace(/'/g, "’").replace(/^./, (x) => x.toLowerCase())}` : "dove non sei ancora stato",
  }));
  const qui: Baccello[] = m.qui.map((c) => ({ chiave: `cosa:${c.id}`, etichetta: nome(c.id), azione: { tipo: "apri", cosa: c.id }, tipo: "cosa", cosa: c.id }));
  const azioni: Baccello[] = [...m.situazione, ...m.servizio].map((a) => ({
    chiave: `azione:${a.comando}`,
    etichetta: a.etichetta.replace(/^./, (x) => x.toLowerCase()),
    azione: { tipo: "comando", comando: a.comando },
    tipo: "azione",
  }));
  // il filo basso: gli attrezzi della tuta, poi le cose che porti
  const dellaTuta: Baccello[] = m.attrezzi
    .filter((a) => !ATTREZZI_COSA[a.id])
    .map((a) => ({
      chiave: `attrezzo:${a.id}`,
      etichetta: a.etichetta.toLowerCase(),
      azione: { tipo: "inMano", attrezzo: a.id, verbo: a.verbi[0]?.verbo ?? "" },
      tipo: "attrezzo",
      attrezzo: a.id,
    }));
  const conTe: Baccello[] = m.conTe.map((c) => {
    const attrezzo = (Object.keys(ATTREZZI_COSA) as IdAttrezzo[]).find((k) => ATTREZZI_COSA[k] === c.id && m.attrezzi.some((a) => a.id === k));
    return { chiave: `cosa:${c.id}`, etichetta: nome(c.id), azione: { tipo: "apri", cosa: c.id }, tipo: "cosa", cosa: c.id, attrezzo };
  });
  return {
    alto: [
      { nome: "uscite", baccelli: uscite, riducibile: false },
      { nome: "qui", baccelli: qui, riducibile: true },
      { nome: "azioni", baccelli: azioni, riducibile: false },
    ].filter((g) => g.baccelli.length),
    basso: [
      { nome: "attrezzi", baccelli: dellaTuta, riducibile: false },
      { nome: "con te", baccelli: conTe, riducibile: true },
    ].filter((g) => g.baccelli.length),
  };
}

/** Il verbo di uno degli attrezzi, se il verbo lo è («sintonizza» → il Sintonizzatore). */
export function attrezzoDelVerbo(attrezzi: readonly Attrezzo[], verbo: string): Attrezzo | undefined {
  return attrezzi.find((a) => a.verbi.some((v) => v.verbo === verbo));
}

export interface VocePetalo {
  chiave: string;
  /** il verbo del petalo (la protezione vitale spegne l'ascolto e la traduzione) */
  verbo?: string;
  etichetta: string;
  /** la nota piccola: l'attrezzo che fa il verbo, o quanta aria è costato l'ultima volta */
  nota: string | null;
  anello: 1 | 2;
  azione: Azione;
  /** il comando, se il petalo ne manda uno (per i suggerimenti accesi) */
  comando: string | null;
}

/** Il nome dell'attrezzo che fa un verbo, per la nota del petalo. */
const NOME_ATTREZZO: Readonly<Record<string, string>> = {
  analizza: "multiscanner",
  traduci: "matrice",
  incidi: "taglierina",
  taglia: "taglierina",
};

/** I petali del fiore di una cosa. `costi`: verbo → l'aria che è costato
 *  l'ultima volta (D16: la stima compare dopo che quel tipo di azione è stato
 *  provato una volta). */
export function petaliDi(menu: MenuCosa, m: ModelloAzione, costi: ReadonlyMap<string, number>): VocePetalo[] {
  const out: VocePetalo[] = [];
  const nota = (v: Voce) => {
    const c = costi.get(v.verbo);
    if (c) return c > 0 ? `+${c}` : `−${Math.abs(c)}`;
    // l'attrezzo, solo se c'è davvero (senza la tuta, Analizza è lo scanner di bordo)
    return v.gruppo === "attrezzo" && attrezzoDelVerbo(m.attrezzi, v.verbo) ? (NOME_ATTREZZO[v.verbo] ?? null) : null;
  };
  for (const v of menu.voci) {
    const anello = v.gruppo === "attrezzo" ? 2 : 1;
    if (v.comando !== null)
      out.push({ chiave: `${v.verbo}:${v.comando}`, verbo: v.verbo, etichetta: v.etichetta, nota: nota(v), anello, azione: { tipo: "comando", comando: v.comando }, comando: v.comando });
    if (v.secondi.length)
      out.push({
        chiave: `${v.verbo}:con`,
        verbo: v.verbo,
        etichetta: v.comando !== null ? `${v.etichetta} con…` : v.etichetta,
        nota: null,
        anello,
        azione: { tipo: "usaCon", cosa: menu.id, voce: v },
        comando: null,
      });
  }
  // un attrezzo che è anche una cosa: i suoi verbi, per prenderlo in mano
  const attrezzo = m.attrezzi.find((a) => (a.id === "sintonizzatore" || a.id === "taglierina") && a.id === menu.id);
  if (attrezzo)
    for (const v of attrezzo.verbi)
      out.push({
        chiave: `inMano:${v.verbo}`,
        verbo: v.verbo,
        etichetta: `${v.etichetta}…`,
        nota: "in mano",
        anello: 2,
        azione: { tipo: "inMano", attrezzo: attrezzo.id, verbo: v.verbo },
        comando: null,
      });
  return out;
}

/** I verbi che la protezione vitale spegne: «Niente ascolto, niente traduzione,
 *  finché non le dai altra aria» (aria.fav). Il pulsante resta, spento, e dice
 *  perché (06, §4.3). */
export const CANALI_SECONDARI: ReadonlySet<string> = new Set(["ascolta", "sintonizza", "traduci"]);
export const MOTIVO_CANALI = "Protezione vitale: canali secondari chiusi";

/** I bersagli possibili adesso: in «Usa con…» le seconde cose, con un attrezzo
 *  in mano le cose su cui si usa. Chiave: l'id della cosa; valore: il comando. */
export function bersagli(sel: Selezione, m: ModelloAzione): Map<string, string> {
  const out = new Map<string, string>();
  if (sel.tipo === "usaCon") for (const s of sel.voce.secondi) out.set(s.id, s.comando);
  if (sel.tipo === "inMano") {
    // le stesse cose dei menu: un attrezzo non si usa sulle cose che porti, se l'autore non l'ha previsto (12, §4.2)
    const menu = new Map([...m.qui, ...m.conTe].map((c) => [c.id, c] as const));
    const a = m.attrezzi.find((x) => x.id === sel.attrezzo);
    for (const b of a?.verbi.find((v) => v.verbo === sel.verbo)?.bersagli ?? []) {
      const c = menu.get(b.id);
      if (!c || c.voci.some((v) => v.verbo === sel.verbo && v.comando === b.comando)) out.set(b.id, b.comando);
    }
  }
  return out;
}

/** Che cosa accendono i suggerimenti del turno: le chiavi dei baccelli e dei petali. */
export function accesiDa(m: ModelloAzione): Set<string> {
  const out = new Set<string>();
  for (const s of m.suggerimenti) {
    if (s.dove === "cosa" && s.cosa) {
      out.add(`cosa:${s.cosa}`);
      if (s.comando) out.add(`comando:${s.comando}`);
    } else if (s.dove === "situazione" && s.comando) out.add(`azione:${s.comando}`);
    else if (s.dove === "attrezzo") {
      const a = attrezzoDelVerbo(m.attrezzi, s.verbo);
      if (a) out.add(ATTREZZI_COSA[a.id] ? `cosa:${ATTREZZI_COSA[a.id]}` : `attrezzo:${a.id}`);
    }
  }
  return out;
}
