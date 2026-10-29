// ============================================================================
//  I suggerimenti in maiuscolo (06-app-desktop.md, §6.1 e §4.2).
//  Il gioco scrive i suoi indizi in maiuscolo, fra parentesi (William racconta in
//  prima persona, l'indizio parla a chi gioca), in quattro forme:
//    il comando intero         (Per chiamare Yusuf: PARLA CON YUSUF.)
//    il verbo, poi la cosa     … il multiscanner lo troverebbe. (ANALIZZA lo scafo nero.)
//    il verbo con il pronome   Lo scanner saprebbe leggerla. (ANALIZZALA.) · (STACCALO.)
//    l'infinito                (Adesso puoi ACCOSTARE.)
//  Qui una frase in maiuscolo diventa il pulsante che la gioca, se c'è nei menu
//  di adesso. Il pronome indica la cosa del comando appena dato («esamina il
//  cilindro» → «ANALIZZALO» → analizza il cilindro). Una frase che non nomina
//  una cosa precisa («SINTONIZZA le cose delle stanze silenziose») indica
//  soltanto il verbo, cioè l'attrezzo.
//  Le altre maiuscole del gioco (IL NAVARCA:, MATERIALE NON IN ARCHIVIO,
//  PROTEZIONE VITALE) non cominciano con un verbo dei menu e restano testo.
// ============================================================================
import type { Evento } from "../motore/tipi.ts";

export interface Suggerimento {
  /** la frase come la scrive il gioco */
  frase: string;
  verbo: string;
  /** il comando del pulsante da accendere, se nei menu c'è */
  comando: string | null;
  /** la cosa indicata, se la frase ne nomina una */
  cosa: string | null;
  /** dove sta il pulsante */
  dove: "cosa" | "situazione" | "attrezzo" | null;
}

/** Quello che serve dei menu per risolvere un suggerimento. */
export interface MenuPerSuggerimenti {
  cose: { id: string; nomi: string[]; voci: { verbo: string; comando: string | null }[] }[];
  situazione: { comando: string }[];
  attrezzi: { verbi: { verbo: string }[] }[];
  /** tutti i verbi che il motore conosce adesso */
  verbi: ReadonlySet<string>;
}

const LETTERA = /[A-Za-zÀÈÉÌÒÙàèéìòù]/;
const LETTERA_MAIUSCOLA = /[A-ZÀÈÉÌÒÙ]/;
const MINUSCOLA = /[a-zàèéìòù]/;
const CLITICI = ["celo", "cela", "lo", "la", "li", "le", "ne", "gli"];
const PAROLE_VUOTE = new Set([
  "il", "lo", "la", "l", "i", "gli", "le", "un", "uno", "una", "un'", "con", "a", "ad", "di", "d",
  "del", "dello", "della", "dei", "degli", "delle", "sul", "sullo", "sulla", "sui", "sugli", "sulle",
  "al", "allo", "alla", "ai", "agli", "alle", "nel", "nello", "nella", "in", "su", "da",
]);

/** Le parole di un testo, senza articoli né preposizioni. */
export function paroleDi(testo: string): string[] {
  return testo
    .toLowerCase()
    .replace(/[’']/g, " ")
    .split(/[^a-zàèéìòù0-9]+/)
    .filter((p) => p && !PAROLE_VUOTE.has(p));
}

/** Il verbo dei menu nascosto in una parola maiuscola, e se porta un pronome. */
export function verboDi(parola: string, verbi: ReadonlySet<string>): { verbo: string; pronome: boolean } | null {
  const p = parola.toLowerCase();
  const infinito = (s: string): string | null => {
    if (s.endsWith("are")) return s.slice(0, -3) + "a";
    if (s.endsWith("ere") || s.endsWith("ire")) return s.slice(0, -3) + "i";
    return null;
  };
  if (verbi.has(p)) return { verbo: p, pronome: false };
  const daInfinito = infinito(p);
  if (daInfinito && verbi.has(daInfinito)) return { verbo: daInfinito, pronome: false };
  // «Lo studi meglio se lo ANALIZZI»: il presente dei verbi in -are, seconda persona, con il
  // pronome davanti (la cosa è quella del comando appena dato)
  if (p.endsWith("i") && p.length > 4 && verbi.has(p.slice(0, -1) + "a")) return { verbo: p.slice(0, -1) + "a", pronome: true };
  for (const c of CLITICI) {
    if (!p.endsWith(c) || p.length < c.length + 3) continue;
    const base = p.slice(0, -c.length);
    if (verbi.has(base)) return { verbo: base, pronome: true };
    // «staccarlo»: l'infinito ha perso la «e» davanti al pronome
    const tronco = /[aei]r$/.test(base) ? infinito(base + "e") : null;
    if (tronco && verbi.has(tronco)) return { verbo: tronco, pronome: true };
  }
  return null;
}

export interface Frase {
  parole: string[];
  testo: string;
  /** le parole minuscole che seguono, fino alla punteggiatura */
  seguito: string;
  /** dove sta la frase nel testo (la lamina la sostituisce con il suo pulsante) */
  inizio: number;
  fine: number;
}

/** Le frasi in maiuscolo di un testo: parole senza minuscole, una dopo l'altra,
 *  separate da uno spazio e senza punteggiatura in mezzo. */
export function frasiMaiuscole(testo: string): Frase[] {
  const out: Frase[] = [];
  let parole: string[] = [];
  let inizio = -1;
  let fine = -1;
  let aperta = false; // l'ultima parola della frase non aveva punteggiatura dopo
  const chiudi = () => {
    if (parole.length) {
      const resto = testo.slice(fine);
      const seguito = /^ [a-zàèéìòù]/.test(resto) ? resto.slice(1).split(/[.,;:!?()«»—]/)[0] : "";
      out.push({ parole, testo: testo.slice(inizio, fine), seguito, inizio, fine });
    }
    parole = [];
    aperta = false;
  };
  const re = /\S+/g;
  for (let m = re.exec(testo); m; m = re.exec(testo)) {
    const grezza = m[0];
    // la parola senza la punteggiatura intorno: «(PARLA», «YUSUF.)», «L'ECO.)»
    const a = grezza.search(LETTERA);
    const nuda = a < 0 ? "" : grezza.slice(a).replace(/[^A-Za-zÀÈÉÌÒÙàèéìòù'’]+$/, "");
    const maiuscola = nuda !== "" && LETTERA_MAIUSCOLA.test(nuda) && !MINUSCOLA.test(nuda);
    if (!maiuscola) {
      chiudi();
      continue;
    }
    const da = m.index + a;
    const contigua = aperta && a === 0 && testo.slice(fine, m.index) === " ";
    if (!contigua) {
      chiudi();
      inizio = da;
    }
    parole.push(nuda);
    fine = da + nuda.length;
    aperta = a + nuda.length === grezza.length;
    if (!aperta) chiudi();
  }
  chiudi();
  return out;
}

/** La cosa dei menu che delle parole nominano (tutte le parole nel suo nome). */
function trovaCosa(parole: string[], menu: MenuPerSuggerimenti): string | null {
  if (!parole.length) return null;
  for (const c of menu.cose) {
    for (const nome of c.nomi) {
      const p = paroleDi(nome);
      if (p.length && parole.every((w) => p.includes(w))) return c.id;
    }
  }
  return null;
}

export function trovaSuggerimenti(
  eventi: readonly Evento[],
  menu: MenuPerSuggerimenti,
  cosaDelComando: string | null,
): Suggerimento[] {
  const out: Suggerimento[] = [];
  const visti = new Set<string>();
  for (const e of eventi) {
    if (e.tipo !== "testo") continue;
    for (const f of frasiMaiuscole(e.testo)) {
      const v = verboDi(f.parole[0], menu.verbi);
      if (!v) continue;
      const resto = paroleDi(f.parole.slice(1).join(" "));
      const nominate = resto.length ? resto : f.parole.length === 1 ? paroleDi(f.seguito) : [];
      const cosa = v.pronome ? cosaDelComando : trovaCosa(nominate, menu);
      const s: Suggerimento = { frase: f.testo, verbo: v.verbo, comando: null, cosa, dove: null };
      const situazione = menu.situazione.find(
        (a) => a.comando.split(" ")[0] === v.verbo && (!nominate.length || nominate.every((w) => a.comando.includes(w))),
      );
      const voce = cosa ? menu.cose.find((c) => c.id === cosa)?.voci.find((x) => x.verbo === v.verbo) : undefined;
      if (situazione && (!cosa || !voce?.comando)) {
        s.comando = situazione.comando;
        s.dove = "situazione";
      } else if (voce) {
        s.comando = voce.comando;
        s.dove = "cosa";
      } else if (menu.attrezzi.some((a) => a.verbi.some((x) => x.verbo === v.verbo))) {
        s.dove = "attrezzo";
      }
      const chiave = `${s.verbo}|${s.comando ?? s.frase}`;
      if (visti.has(chiave)) continue;
      visti.add(chiave);
      out.push(s);
    }
  }
  return out;
}
