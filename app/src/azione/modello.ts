// ============================================================================
//  Il modello d'azione: che cosa si può fare adesso, in menu (06-app-desktop.md, §6).
//  Puro: prende un turno del ponte e restituisce i menu, senza DOM e senza stato.
//  Lo usano l'app e il collaudo dei finali (collaudo/menu.mjs), che gioca le
//  partite soltanto con quello che questi menu mostrano: un verbo nascosto per
//  sbaglio è un gioco che non si finisce (§6.3).
//
//  Prima la cosa, poi il verbo. Il menu di una cosa mostra (§6.1):
//    1. sempre Esamina; Prendi (se si prende) o Lascia (se la porti); Apri o
//       Chiudi le cose che si aprono; Usa e Usa con… le cose che porti;
//    2. i verbi degli attrezzi che hai: Analizza e Traduci con la tuta (il
//       multiscanner e la matrice), Sintonizza con il Sintonizzatore, Incidi e
//       Taglia con la taglierina. Su tutte le cose: il verbo nasce
//       dall'attrezzo, e non svela niente;
//    3. i verbi per cui l'autore ha scritto una regola su quella cosa (Stacca il
//       risuonatore, Firma e Completa la placca, Segui le teche chiuse…);
//    4. Parla con chi si può chiamare.
//  Poi le uscite, le azioni di situazione (situazione.ts), il servizio
//  (Aspetta, Guarda) e, fuori dall'esplorazione, le scelte: le risposte di un
//  dialogo, il sì e il no di una conferma.
// ============================================================================
import type { Cosa, Pulsanti, Turno, VerboPulsante } from "../motore/tipi.ts";
import { AZIONI_DI_SITUAZIONE } from "./situazione.ts";
import { trovaSuggerimenti, type Suggerimento } from "./suggerimenti.ts";

export type GruppoVoce = "base" | "attrezzo" | "autore" | "dialogo";

export interface Bersaglio {
  id: string;
  etichetta: string;
  comando: string;
}

export interface Voce {
  verbo: string;
  etichetta: string;
  gruppo: GruppoVoce;
  /** il comando, se la voce basta da sola; null se serve una seconda cosa */
  comando: string | null;
  /** le seconde cose («Usa con…»): tutte quelle possibili, non solo le giuste */
  secondi: Bersaglio[];
}

export interface MenuCosa {
  id: string;
  etichetta: string;
  conTe: boolean;
  personaggio: boolean;
  voci: Voce[];
}

export interface UscitaModello {
  comando: string;
  etichetta: string;
  /** la stanza dove porta, se già vista */
  stanza: string | null;
  tasto: string | null;
}

export interface AzioneModello {
  id: string;
  etichetta: string;
  comando: string;
}

export interface SceltaModello {
  etichetta: string;
  comando: string;
  tasto: string | null;
}

export type IdAttrezzo = "multiscanner" | "matrice" | "sintonizzatore" | "taglierina";

/** Un attrezzo in mano: si sceglie l'attrezzo, poi la cosa (§6.1). */
export interface Attrezzo {
  id: IdAttrezzo;
  etichetta: string;
  verbi: { verbo: string; etichetta: string; bersagli: Bersaglio[] }[];
}

export interface ModelloAzione {
  fase: Pulsanti["fase"];
  /** le cose davanti a te, poi quelle che porti */
  qui: MenuCosa[];
  conTe: MenuCosa[];
  uscite: UscitaModello[];
  situazione: AzioneModello[];
  attrezzi: Attrezzo[];
  servizio: AzioneModello[];
  scelte: SceltaModello[];
  suggerimenti: Suggerimento[];
}

// ----------------------------------------------------------------------------
//  Le tabelle
// ----------------------------------------------------------------------------
interface DefinizioneAttrezzo {
  id: IdAttrezzo;
  etichetta: string;
  verbi: readonly string[];
  disponibile: (t: Turno) => boolean;
}

const porti = (t: Turno, id: string) => t.stato.inventario.includes(id) || t.cose.some((c) => c.id === id && c.con_te);

/** Gli attrezzi e i loro verbi. Il multiscanner e la matrice sono della tuta:
 *  il primo c'è da quando la indossi, la seconda dal primo contatto, quando «la
 *  tuta prova a tradurre» (ingresso.fav). Si usano sulle cose del mondo; su
 *  quelle che porti solo dove l'autore ha scritto una regola: si analizza la
 *  stele presa, non la propria cella d'aria. */
export const ATTREZZI: readonly DefinizioneAttrezzo[] = [
  { id: "multiscanner", etichetta: "Multiscanner", verbi: ["analizza"], disponibile: (t) => t.stato.tuta },
  { id: "matrice", etichetta: "Matrice", verbi: ["traduci"], disponibile: (t) => t.stato.tuta && t.stato.contatto === "avvenuto" },
  { id: "sintonizzatore", etichetta: "Sintonizzatore", verbi: ["sintonizza"], disponibile: (t) => porti(t, "sintonizzatore") },
  { id: "taglierina", etichetta: "Taglierina", verbi: ["incidi", "taglia"], disponibile: (t) => porti(t, "taglierina") },
];

/** I verbi che il modello tratta da sé; gli altri valgono solo con una regola. */
const VERBI_DI_BASE = new Set(["esamina", "prendi", "lascia", "apri", "chiudi", "usa", "metti", "parla", "chiedi"]);
const VERBI_DEGLI_ATTREZZI = new Set(ATTREZZI.flatMap((a) => a.verbi));
const VERBI_DI_SITUAZIONE = new Set(AZIONI_DI_SITUAZIONE.map((a) => a.comando.split(" ")[0]));

/** I servizi che giocano un turno; annulla, salva e carica sono dell'app. */
const SERVIZIO = ["aspetta", "guarda"];

/** I tasti delle uscite (§6.2): le frecce, PagSu e PagGiù, poi il resto. */
export const TASTI_DELLE_USCITE: Readonly<Record<string, string>> = {
  nord: "ArrowUp",
  sud: "ArrowDown",
  est: "ArrowRight",
  ovest: "ArrowLeft",
  su: "PageUp",
  giù: "PageDown",
  dentro: "Home",
  fuori: "End",
  nordovest: "Numpad7",
  nordest: "Numpad9",
  sudovest: "Numpad1",
  sudest: "Numpad3",
};

// ----------------------------------------------------------------------------
//  Il modello
// ----------------------------------------------------------------------------
const norm = (s: string) => s.replace(/’/g, "'").toLowerCase().split(/\s+/).filter(Boolean).join(" ");

function primoDi(v: VerboPulsante | undefined, id: string) {
  return v?.primi.find((p) => p.id === id);
}

function secondiDi(v: VerboPulsante, primo: { id: string; testo: string }): Bersaglio[] {
  const lista = v.secondi ?? v.secondi_per?.[primo.id] ?? [];
  return lista
    .filter((s) => s.id !== primo.id)
    .map((s) => ({ id: s.id ?? s.testo, etichetta: s.etichetta, comando: `${v.verbo} ${primo.testo} ${s.testo}` }));
}

/** I verbi che restano sempre: si riesamina, si riprende ciò che si è posato. */
const SEMPRE = new Set(["esamina", "prendi", "lascia"]);

/** Un verbo che non cambierebbe più niente: tutte le proprietà che le sue
 *  regole danno a questa cosa ce l'ha già (il faro già pieno non si alza, la
 *  tuta indossata non si indossa, la porta aperta non si apre). */
function giaFatto(c: Cosa, verbo: string): boolean {
  const effetti = c.effetti[verbo];
  return !SEMPRE.has(verbo) && !!effetti?.length && effetti.every((r) => c.radici.includes(r));
}

function menuDi(c: Cosa, verbi: Map<string, VerboPulsante>, attrezzi: Set<string>): MenuCosa {
  const voci: Voce[] = [];
  const ha = (verbo: string) => c.regole.includes(verbo);
  const inCoppia = (verbo: string) => c.regole_in_coppia.includes(verbo);
  /** una voce, se il motore offre quel verbo su questa cosa */
  const aggiungi = (verbo: string, gruppo: GruppoVoce, modo: "intero" | "solo" | "con" = "intero", etichetta?: string) => {
    const v = verbi.get(verbo);
    const primo = primoDi(v, c.id);
    if (!v || !primo) return;
    if (modo !== "con" && giaFatto(c, verbo)) return;
    const comando = modo !== "con" && v.secondo !== "obbligatorio" ? `${verbo} ${primo.testo}` : null;
    const secondi = modo !== "solo" && v.secondo !== "no" ? secondiDi(v, primo) : [];
    if (comando === null && !secondi.length) return;
    voci.push({ verbo, etichetta: etichetta ?? v.etichetta, gruppo, comando, secondi });
  };

  // 1. sempre
  aggiungi("esamina", "base");
  if (c.con_te) aggiungi("lascia", "base");
  else if (c.prendibile || ha("prendi")) aggiungi("prendi", "base");
  aggiungi("parla", "dialogo");
  aggiungi("chiedi", "dialogo");
  const aperta = c.radici.includes("apert");
  const chiusa = c.radici.includes("chius") || c.radici.includes("apribil");
  if (ha("apri") || (chiusa && !aperta)) aggiungi("apri", "base");
  if (ha("chiudi") || aperta) aggiungi("chiudi", "base");
  if (ha("usa")) aggiungi("usa", "base", "solo");
  if (c.con_te || inCoppia("usa")) aggiungi("usa", "base", "con", "Usa con…");
  if (ha("metti") || inCoppia("metti")) aggiungi("metti", "base", "con", "Metti…");
  // 2. gli attrezzi
  for (const a of ATTREZZI) {
    for (const verbo of a.verbi) {
      // senza l'attrezzo vale solo lo scanner di bordo della Santa Maria (analizza la massa)
      if ((attrezzi.has(a.id) && (!c.con_te || ha(verbo))) || (verbo === "analizza" && ha(verbo))) aggiungi(verbo, "attrezzo");
    }
  }
  // 3. i verbi dell'autore, nell'ordine del motore (quelli delle azioni di
  //    situazione stanno in «Azioni», non sulle cose: «ricarica la tuta»)
  for (const v of verbi.values()) {
    if (VERBI_DI_BASE.has(v.verbo) || VERBI_DEGLI_ATTREZZI.has(v.verbo) || VERBI_DI_SITUAZIONE.has(v.verbo)) continue;
    if (ha(v.verbo) || inCoppia(v.verbo)) aggiungi(v.verbo, "autore");
  }
  return { id: c.id, etichetta: c.etichetta, conTe: c.con_te, personaggio: c.personaggio, voci };
}

/** I comandi che il motore accetta adesso, come li mandano i suoi pulsanti. */
function comandiDelMotore(p: Pulsanti): Set<string> {
  const out = new Set<string>();
  for (const v of p.verbi) {
    if (v.da_solo) out.add(norm(v.verbo));
    for (const primo of v.primi) if (v.secondo !== "obbligatorio") out.add(norm(`${v.verbo} ${primo.testo}`));
  }
  return out;
}

export function costruisciModello(t: Turno): ModelloAzione {
  const p = t.pulsanti;
  const verbi = new Map(p.verbi.map((v) => [v.verbo, v] as const));
  const disponibili = new Set(ATTREZZI.filter((a) => a.disponibile(t)).map((a) => a.id));
  const menu = t.cose.map((c) => menuDi(c, verbi, disponibili));
  const motore = comandiDelMotore(p);

  const uscite: UscitaModello[] = p.uscite.map((u) => ({
    comando: u.comando,
    etichetta: u.etichetta,
    stanza: u.stanza ?? null,
    tasto: TASTI_DELLE_USCITE[u.comando] ?? null,
  }));

  const situazione: AzioneModello[] = AZIONI_DI_SITUAZIONE.filter(
    (a) => a.stanze.includes(t.stato.stanza) && motore.has(norm(a.comando)),
  ).map((a) => ({ id: a.id, etichetta: a.etichetta, comando: a.comando }));

  const attrezzi: Attrezzo[] = ATTREZZI.filter((a) => disponibili.has(a.id)).map((a) => ({
    id: a.id,
    etichetta: a.etichetta,
    verbi: a.verbi
      .map((verbo) => {
        const v = verbi.get(verbo);
        return {
          verbo,
          etichetta: v?.etichetta ?? verbo,
          bersagli: (v?.primi ?? []).map((pr) => ({
            id: pr.id,
            etichetta: t.cose.find((c) => c.id === pr.id)?.etichetta ?? pr.testo,
            comando: `${verbo} ${pr.testo}`,
          })),
        };
      })
      .filter((v) => v.bersagli.length),
  }));

  const servizio: AzioneModello[] = p.servizio
    .filter((s) => SERVIZIO.includes(s.comando))
    .map((s) => ({ id: s.comando, etichetta: s.etichetta, comando: s.comando }));

  const scelte: SceltaModello[] = p.scelte.map((s) => ({
    etichetta: s.etichetta,
    comando: s.comando,
    tasto:
      /^[1-9]$/.test(s.comando) ? s.comando : p.fase === "conferma" ? (s.comando === "sì" ? "s" : s.comando === "no" ? "n" : null) : null,
  }));

  const modello: ModelloAzione = {
    fase: p.fase,
    qui: menu.filter((m) => !m.conTe),
    conTe: menu.filter((m) => m.conTe),
    uscite,
    situazione,
    attrezzi,
    servizio,
    scelte,
    suggerimenti: [],
  };
  modello.suggerimenti = trovaSuggerimenti(
    t.eventi,
    {
      cose: menu.map((m) => {
        const c = t.cose.find((x) => x.id === m.id)!;
        return { id: m.id, nomi: [c.id, c.etichetta, c.nome, ...c.nomi], voci: m.voci };
      }),
      situazione,
      attrezzi,
      verbi: new Set([...verbi.keys(), ...AZIONI_DI_SITUAZIONE.map((a) => a.comando.split(" ")[0])]),
    },
    t.comando?.cosa ?? null,
  );
  return modello;
}

/** Tutti i comandi che i menu mostrano: ciò che chi gioca può mandare. */
export function comandiDelModello(m: ModelloAzione): string[] {
  const out: string[] = [];
  const visti = new Set<string>();
  const metti = (c: string | null) => {
    if (c === null || visti.has(norm(c))) return;
    visti.add(norm(c));
    out.push(c);
  };
  for (const s of m.scelte) metti(s.comando);
  for (const u of m.uscite) metti(u.comando);
  for (const cosa of [...m.qui, ...m.conTe]) {
    for (const v of cosa.voci) {
      metti(v.comando);
      for (const s of v.secondi) metti(s.comando);
    }
  }
  for (const a of m.situazione) metti(a.comando);
  for (const a of m.servizio) metti(a.comando);
  return out;
}
