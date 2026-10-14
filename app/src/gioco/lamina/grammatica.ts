// ============================================================================
//  La grammatica tipografica (06-app-desktop.md, §4.1 e §4.2).
//  Il motore manda il testo così com'è; qui lo si riconosce, evento per evento
//  e riga per riga, e lo si divide in blocchi e segmenti che la lamina veste:
//
//    la stanza            «--- La plancia ---»               display grande, una riga sottile
//    il paragrafo         la descrizione, la risposta         serif
//    la voce del relitto  IL NAVARCA: «…»                     rientro, corsivo, filo; il nome in maiuscoletto
//    la registrazione     la scatola nera di L.V. e il prologo grana, buchi come pause grafiche
//    la lettura           ANALISI…, LETTURA:, Lunghezza: …    mono, su una fascia scura
//    il dialogo           Yusuf: «…»                          la modalità del dialogo (§4.5)
//    il registro di bordo «Registro di bordo, TSC-1972. …»    la riga che chiude un finale
//  e dentro i paragrafi: i suggerimenti in maiuscolo (pulsanti), la protezione
//  vitale, ciò che è scritto su uno schermo (MATERIALE NON IN ARCHIVIO), le
//  etichette dello scanner ‹…›, la matrice e l'intraducibile, le scritte a
//  stampo (TSC-1972) e quelle graffiate (QUI PRIMA. IL SEME. NON SIAMO S—).
//
//  Il testo non si riscrive (§7): ogni blocco porta la sua sorgente, e il testo
//  dei suoi segmenti la ricostruisce carattere per carattere. L'unica
//  trasformazione è l'apostrofo tipografico, solo a schermo (§7, lezione L13).
//  Il collaudo (collaudo/tipografia.mjs) lo controlla su tutti i percorsi.
//  Puro: niente DOM.
// ============================================================================
import type { Evento } from "../../motore/tipi.ts";
import { frasiMaiuscole, verboDi, type Suggerimento } from "../../azione/suggerimenti.ts";

/** L'apostrofo dritto dei .fav diventa tipografico, solo a schermo. */
export const tipografico = (s: string) => s.replace(/'/g, "’");
/** Il ritorno: per confrontare il testo a schermo con quello del motore. */
export const dritto = (s: string) => s.replace(/’/g, "'");

export type TipoSegmento =
  | "testo"
  | "parlato" // «…» dentro una voce o un dialogo
  | "didascalia" // (Una pausa.), o la narrazione dentro una voce
  | "suggerimento"
  | "protezione"
  | "schermo" // scritto su un display: MATERIALE NON IN ARCHIVIO, ANALISI BIOMETRICA
  | "etichetta" // ‹FLORA DI XYLOS›
  | "matrice" // (Matrice di traduzione: 18%)
  | "intraducibile" // (intraducibile: canto-radice)
  | "stampo" // TSC-1972, AURORA-7
  | "graffio" // QUI PRIMA. IL SEME. NON SIAMO S—
  | "maiuscolo" // un maiuscolo che la grammatica non conosce (il collaudo lo segnala)
  | "nome"; // il nome di una cosa che si può toccare (D15)

export interface Segmento {
  tipo: TipoSegmento;
  /** il testo a schermo, con gli apostrofi tipografici */
  testo: string;
  /** dentro la parentesi di un suggerimento: il testo resta, attenuato (§4.2) */
  attenuato?: boolean;
  /** per un suggerimento: la sua posizione fra quelli del modello (−1: il modello non lo conosce) */
  suggerimento?: number;
  /** per un nome: la cosa */
  cosa?: string;
}

export interface RigaRegistrazione {
  tipo: "apparecchio" | "voce" | "buco";
  testo: string;
  /** righe vuote sopra */
  vuote: number;
}

interface Origine {
  /** l'evento del turno da cui viene */
  evento: number;
  /** il testo del motore, così com'è */
  sorgente: string;
  /** comincia una riga (falso: continua quella del blocco prima, come una voce dopo la narrazione) */
  aCapo: boolean;
  /** le righe vuote sopra, dentro l'evento */
  vuote: number;
  /** l'evento chiedeva uno stacco */
  stacco: boolean;
  /** viene dal testo di un finale: l'esito */
  fine?: string;
  /** gli a capo in fondo all'evento, sull'ultimo dei suoi blocchi */
  coda?: number;
}

export type Blocco = Origine &
  (
    | { tipo: "stanza"; nome: string; id: string | null }
    | { tipo: "paragrafo"; segmenti: Segmento[] }
    | { tipo: "voce"; etichetta: string; chi: string; inciso: string | null; segmenti: Segmento[] }
    | { tipo: "registrazione"; righe: RigaRegistrazione[] }
    | { tipo: "lettura"; segmenti: Segmento[] }
    | { tipo: "dialogo"; etichetta: string; chi: string; personaggio: string; segmenti: Segmento[] }
    | { tipo: "registro"; segmenti: Segmento[] }
    | { tipo: "sistema"; testo: string }
  );

export type TipoBlocco = Blocco["tipo"];

export interface OpzioniGrammatica {
  /** i suggerimenti del modello d'azione per questo turno */
  suggerimenti?: readonly Suggerimento[];
  /** i verbi che il motore conosce adesso: un maiuscolo che comincia con uno di
   *  questi è un suggerimento anche se il modello non ha il suo pulsante */
  verbi?: ReadonlySet<string>;
}

// ----------------------------------------------------------------------------
//  Gli eventi che la lamina non stampa
// ----------------------------------------------------------------------------
/** L'elenco («Puoi vedere qui», «Uscite») diventa il ramo delle azioni;
 *  l'intestazione è dell'intro; le opzioni e la domanda sono pulsanti; i
 *  messaggi del motore che chiedono di scrivere un comando non valgono in
 *  un'app senza parser (l'app ha i suoi pulsanti per ricominciare e caricare). */
export function nascosto(e: Evento): boolean {
  if (e.tipo === "elenco" || e.tipo === "intestazione" || e.tipo === "opzione" || e.tipo === "domanda") return true;
  if (e.tipo === "sistema" && /\b(Scrivi|scrivi|CARICA|ANNULLA|RICOMINCIA)\b/.test(e.testo)) return true;
  return false;
}

// ----------------------------------------------------------------------------
//  I riconoscitori
// ----------------------------------------------------------------------------
const MAIUSCOLA = "A-ZÀÈÉÌÒÙ";
/** IL NAVARCA:, L'INGEGNERE CAPO:, LO XENO-BOTANICO, con un filo di voce più fermo: «…» */
const ETICHETTA_VOCE = new RegExp(
  `(?<=^|[\\s(—])((?:[${MAIUSCOLA}]+['’])?[${MAIUSCOLA}][${MAIUSCOLA}'’-]+(?:\\s+(?:[${MAIUSCOLA}]+['’])?[${MAIUSCOLA}][${MAIUSCOLA}'’-]*)*)((?:,[^:«»]*)?):\\s*(?=«)`,
  "gu",
);
/** La voce di L.V. nella scatola nera, e il prologo (§4.2). */
const VOCE_DI_LV = /una voce d['’]uomo:\s*$/;
const PROLOGO = /^Scatola nera di una tuta extraveicolare\./;
const FINE_TRACCIA = /^Fine della traccia\.$/;
const BUCO = /^Un buco\b/;
/** Le righe che sono una lettura dello scanner o del computer di bordo. */
const LETTURA = /^(?:ANALISI\b|LETTURA:|IDENTIFICAZIONE\b|DATAZIONE\b|Lunghezza: )/;
/** La riga del registro di bordo che chiude un finale. */
const REGISTRO = /^Registro di bordo, /;
const STANZA = /^---\s*(.*?)\s*---$/;
const PARLANTE = /^([^:«(]{1,40}):\s/;

/** I segni dentro una riga, nell'ordine in cui vincono quando si toccano. */
const SEGNI: { re: RegExp; tipo: TipoSegmento }[] = [
  { re: /\(intraducibile:[^)]*\)/g, tipo: "intraducibile" },
  { re: /\((?:Matrice di traduzione|MATRICE DI TRADUZIONE):[^)]*\)/g, tipo: "matrice" },
  { re: /‹[^›]*›/g, tipo: "etichetta" },
  { re: /QUI PRIMA\. IL SEME\. NON SIAMO S—/g, tipo: "graffio" },
  { re: /(?<=: )OLI(?=\.)/g, tipo: "graffio" },
  { re: /TSC-1972|\bTSC\b|AURORA-7/g, tipo: "stampo" },
  { re: /PROTEZIONE VITALE/g, tipo: "protezione" },
  { re: /MATERIALE NON IN ARCHIVIO|CHIUSURA RIFIUTATA|CANALE APERTO DA REMOTO|DECODIFICA COMPLETATA/g, tipo: "schermo" },
  {
    re: new RegExp(`(?:ANALISI|IDENTIFICAZIONE|LETTURA|DATAZIONE)(?:\\s+(?:[${MAIUSCOLA}]+['’])?[${MAIUSCOLA}]{2,})*`, "g"),
    tipo: "schermo",
  },
];

interface Pezzo {
  inizio: number;
  fine: number;
  tipo: TipoSegmento;
  suggerimento?: number;
}

/** I segmenti di una riga (o di un pezzo di riga) di prosa. */
export function segmenta(riga: string, o: OpzioniGrammatica = {}): Segmento[] {
  const pezzi: Pezzo[] = [];
  const libero = (a: number, b: number) => !pezzi.some((p) => a < p.fine && b > p.inizio);
  const trovati: Pezzo[] = [];
  for (const { re, tipo } of SEGNI) {
    re.lastIndex = 0;
    for (let m = re.exec(riga); m; m = re.exec(riga)) if (m[0]) trovati.push({ inizio: m.index, fine: m.index + m[0].length, tipo });
  }
  trovati.sort((a, b) => a.inizio - b.inizio || b.fine - a.fine);
  for (const p of trovati) if (libero(p.inizio, p.fine)) pezzi.push(p);
  // i maiuscoli: le frasi dei suggerimenti, o maiuscoli da riconoscere
  for (const f of frasiMaiuscole(riga)) {
    if (!libero(f.inizio, f.fine)) continue;
    if (!new RegExp(`[${MAIUSCOLA}]{2,}`).test(f.testo)) continue; // le iniziali: L.V., W. T.
    const i = o.suggerimenti?.findIndex((s) => s.frase === f.testo) ?? -1;
    const verbo = i < 0 && o.verbi ? verboDi(f.parole[0], o.verbi) : null;
    if (i >= 0 || verbo) pezzi.push({ inizio: f.inizio, fine: f.fine, tipo: "suggerimento", suggerimento: i });
    else pezzi.push({ inizio: f.inizio, fine: f.fine, tipo: "maiuscolo" });
  }
  pezzi.sort((a, b) => a.inizio - b.inizio);

  // la parentesi di un suggerimento resta, attenuata: «(Per chiamare Yusuf: PARLA CON YUSUF.)»
  const attenuate: [number, number][] = [];
  for (const p of pezzi) {
    if (p.tipo !== "suggerimento") continue;
    const apre = riga.lastIndexOf("(", p.inizio);
    const chiude = riga.indexOf(")", p.fine);
    if (apre >= 0 && chiude >= 0 && riga.lastIndexOf(")", p.inizio) < apre) attenuate.push([apre, chiude + 1]);
  }
  const tagli = new Set<number>([0, riga.length]);
  for (const p of pezzi) tagli.add(p.inizio).add(p.fine);
  for (const [a, b] of attenuate) tagli.add(a).add(b);
  const punti = [...tagli].sort((a, b) => a - b);
  const out: Segmento[] = [];
  for (let k = 0; k + 1 < punti.length; k++) {
    const [a, b] = [punti[k], punti[k + 1]];
    if (a === b) continue;
    const p = pezzi.find((x) => x.inizio <= a && b <= x.fine);
    const seg: Segmento = { tipo: p?.tipo ?? "testo", testo: tipografico(riga.slice(a, b)) };
    if (p?.suggerimento !== undefined) seg.suggerimento = p.suggerimento;
    if (attenuate.some(([x, y]) => x <= a && b <= y)) seg.attenuato = true;
    // un segno tagliato in due da una parentesi resta uno: si unisce al precedente
    const prima = out[out.length - 1];
    if (prima && p && prima.tipo === seg.tipo && prima.attenuato === seg.attenuato && prima.suggerimento === seg.suggerimento && seg.tipo !== "testo")
      prima.testo += seg.testo;
    else if (prima && !p && prima.tipo === "testo" && prima.attenuato === seg.attenuato) prima.testo += seg.testo;
    else out.push(seg);
  }
  return out;
}

/** Il parlato e le didascalie: «…» parlato, (…) didascalia, il resto come si dice. */
function segmentaParlato(resto: string, restoCome: TipoSegmento): Segmento[] {
  const out: Segmento[] = [];
  const re = /«[^»]*»?|\([^)]*\)?/g;
  let ultimo = 0;
  const metti = (tipo: TipoSegmento, testo: string) => {
    if (!testo) return;
    const prima = out[out.length - 1];
    if (prima && prima.tipo === tipo) prima.testo += tipografico(testo);
    else out.push({ tipo, testo: tipografico(testo) });
  };
  for (let m = re.exec(resto); m; m = re.exec(resto)) {
    metti(restoCome, resto.slice(ultimo, m.index));
    if (m[0].startsWith("«")) {
      // dentro il parlato restano visibili gli intraducibili della matrice
      for (const s of segmenta(m[0])) metti(s.tipo === "testo" ? "parlato" : s.tipo, dritto(s.testo));
    } else metti("didascalia", m[0]);
    ultimo = m.index + m[0].length;
  }
  metti(restoCome, resto.slice(ultimo));
  return out;
}

// ----------------------------------------------------------------------------
//  Dagli eventi ai blocchi
// ----------------------------------------------------------------------------
interface Riga {
  testo: string;
  vuote: number;
}

function righe(testo: string): Riga[] {
  const out: Riga[] = [];
  let vuote = 0;
  for (const r of testo.split("\n")) {
    if (r.trim() === "") vuote++;
    else {
      out.push({ testo: r, vuote });
      vuote = 0;
    }
  }
  return out;
}

const bilancio = (s: string) => [...s].reduce((n, c) => n + (c === "«" ? 1 : c === "»" ? -1 : 0), 0);

export function blocchiDelTurno(eventi: readonly Evento[], o: OpzioniGrammatica = {}): Blocco[] {
  const out: Blocco[] = [];
  eventi.forEach((e, evento) => {
    if (nascosto(e)) return;
    const quanti = out.length;
    blocchiDellEvento(e, evento, o, out);
    // gli a capo in fondo all'evento restano, sull'ultimo blocco
    const coda = /\n*$/.exec(e.testo)![0].length;
    if (coda && out.length > quanti && e.tipo !== "stanza" && e.tipo !== "sistema" && e.tipo !== "errore" && e.tipo !== "dialogo")
      out[out.length - 1] = { ...out[out.length - 1], coda };
  });
  return out;
}

function blocchiDellEvento(e: Evento, evento: number, o: OpzioniGrammatica, out: Blocco[]) {
  {
    const stacco = !!e.stacco;
    const base = (r: Riga, aCapo = true): Origine => ({ evento, sorgente: r.testo, aCapo, vuote: r.vuote, stacco });
    if (e.tipo === "stanza") {
      const nome = STANZA.exec(e.testo)?.[1] ?? e.testo;
      out.push({ ...base({ testo: e.testo, vuote: 0 }), tipo: "stanza", nome: tipografico(nome), id: (e.dati?.id as string) ?? null });
      return;
    }
    if (e.tipo === "sistema" || e.tipo === "errore") {
      out.push({ ...base({ testo: e.testo, vuote: 0 }), tipo: "sistema", testo: tipografico(e.testo) });
      return;
    }
    if (e.tipo === "dialogo") {
      const m = PARLANTE.exec(e.testo);
      const etichetta = m ? m[0] : "";
      const resto = e.testo.slice(etichetta.length);
      out.push({
        ...base({ testo: e.testo, vuote: 0 }),
        tipo: "dialogo",
        etichetta: tipografico(etichetta),
        chi: tipografico(m?.[1] ?? ""),
        personaggio: (e.dati?.personaggio as string) ?? "",
        segmenti: segmentaParlato(resto, "testo"),
      });
      return;
    }
    // testo e fine: riga per riga
    const fine = e.tipo === "fine" ? String(e.dati?.esito ?? "") : undefined;
    const tutte = righe(e.testo);
    for (let k = 0; k < tutte.length; k++) {
      const r = tutte[k];
      const conFine = <T extends Origine>(b: T): T => (fine !== undefined ? { ...b, fine } : b);
      // la registrazione: la scatola nera di L.V., o il prologo
      if (PROLOGO.test(r.testo) || (VOCE_DI_LV.test(r.testo) && k + 1 < tutte.length && tutte[k + 1].testo.startsWith("«"))) {
        const registrazione: RigaRegistrazione[] = [];
        let sorgente = "";
        const aggiungi = (x: Riga, tipo: RigaRegistrazione["tipo"]) => {
          registrazione.push({ tipo, testo: tipografico(x.testo), vuote: registrazione.length ? x.vuote : 0 });
          sorgente += (sorgente ? "\n" + "\n".repeat(x.vuote) : "") + x.testo;
        };
        let primaRiga = r;
        if (PROLOGO.test(r.testo)) aggiungi(r, "apparecchio");
        else {
          out.push(conFine({ ...base(r), tipo: "paragrafo", segmenti: segmenta(r.testo, o) }));
          k++;
          primaRiga = tutte[k];
          aggiungi(primaRiga, "voce");
        }
        let aperte = bilancio(registrazione[registrazione.length - 1].testo);
        while (k + 1 < tutte.length) {
          const x = tutte[k + 1];
          if (aperte > 0 || x.testo.startsWith("«")) aggiungi(x, "voce");
          else if (BUCO.test(x.testo)) aggiungi(x, "buco");
          else if (FINE_TRACCIA.test(x.testo)) aggiungi(x, "apparecchio");
          else break;
          aperte += bilancio(x.testo);
          k++;
        }
        out.push(conFine({ evento, sorgente, aCapo: true, vuote: primaRiga.vuote, stacco, tipo: "registrazione", righe: registrazione }));
        continue;
      }
      if (LETTURA.test(r.testo)) {
        out.push(conFine({ ...base(r), tipo: "lettura", segmenti: segmenta(r.testo, o) }));
        continue;
      }
      if (fine !== undefined && REGISTRO.test(r.testo)) {
        out.push(conFine({ ...base(r), tipo: "registro", segmenti: segmenta(r.testo, o) }));
        continue;
      }
      // le voci del relitto: dalla loro etichetta alla fine della riga
      ETICHETTA_VOCE.lastIndex = 0;
      const voci = [...r.testo.matchAll(ETICHETTA_VOCE)];
      if (!voci.length) {
        out.push(conFine({ ...base(r), tipo: "paragrafo", segmenti: segmenta(r.testo, o) }));
        continue;
      }
      let da = 0;
      voci.forEach((m, i) => {
        const a = m.index!;
        if (a > da) {
          const prima = r.testo.slice(da, a);
          out.push(conFine({ ...base({ testo: prima, vuote: da === 0 ? r.vuote : 0 }, da === 0), tipo: "paragrafo", segmenti: segmenta(prima, o) }));
        }
        const b = i + 1 < voci.length ? voci[i + 1].index! : r.testo.length;
        const pezzo = r.testo.slice(a, b);
        const etichetta = m[0];
        const inciso = m[2] ? m[2].replace(/^,\s*/, "").trim() : null;
        out.push(
          conFine({
            ...base({ testo: pezzo, vuote: a === 0 ? r.vuote : 0 }, a === 0),
            tipo: "voce",
            etichetta: tipografico(etichetta),
            chi: tipografico(m[1]),
            inciso: inciso ? tipografico(inciso) : null,
            segmenti: segmentaParlato(pezzo.slice(etichetta.length), "didascalia"),
          }),
        );
        da = b;
      });
    }
  }
}

// ----------------------------------------------------------------------------
//  La ricostruzione: il testo a schermo deve essere quello del motore
// ----------------------------------------------------------------------------
const unisci = (s: Segmento[]) => s.map((x) => x.testo).join("");

/** Il testo di un blocco come lo mostra la lamina (apostrofi tipografici). */
export function testoDelBlocco(b: Blocco): string {
  switch (b.tipo) {
    case "stanza":
      // le lineette intorno al nome sono la cornice del motore: a schermo resta il nome
      return b.sorgente.includes(dritto(b.nome)) ? tipografico(b.sorgente) : b.nome;
    case "paragrafo":
    case "lettura":
    case "registro":
      return unisci(b.segmenti);
    case "voce":
    case "dialogo":
      return b.etichetta + unisci(b.segmenti);
    case "registrazione":
      return b.righe.map((r, i) => (i ? "\n" + "\n".repeat(r.vuote) : "") + r.testo).join("");
    case "sistema":
      return b.testo;
  }
}

/** Il testo di un evento rimesso insieme dai suoi blocchi. */
export function ricostruisciEvento(blocchi: readonly Blocco[], evento: number): string {
  let s = "";
  let primo = true;
  for (const b of blocchi) {
    if (b.evento !== evento) continue;
    if (b.aCapo && !primo) s += "\n";
    s += "\n".repeat(b.aCapo ? b.vuote : 0) + dritto(testoDelBlocco(b)) + "\n".repeat(b.coda ?? 0);
    primo = false;
  }
  return s;
}

// ----------------------------------------------------------------------------
//  I nomi delle cose toccabili nel testo (D15)
// ----------------------------------------------------------------------------
export interface NomeDiCosa {
  id: string;
  /** i nomi con cui il testo la chiama: l'id, gli altri nomi dell'autore */
  nomi: string[];
}

const LETTERA = "A-Za-zÀÈÉÌÒÙàèéìòù";

/** Segna, nei paragrafi, la prima volta che il testo nomina ogni cosa in vista. */
export function segnaNomi(blocchi: readonly Blocco[], cose: readonly NomeDiCosa[]): Blocco[] {
  const termini = cose
    .flatMap((c) => c.nomi.map((n) => ({ id: c.id, n: tipografico(n.toLowerCase().trim()) })))
    .filter((t) => t.n.length >= 3)
    .sort((a, b) => b.n.length - a.n.length);
  if (!termini.length) return [...blocchi];
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?<![${LETTERA}])(${termini.map((t) => esc(t.n)).join("|")})(?![${LETTERA}])`, "gi");
  const segnate = new Set<string>();
  return blocchi.map((b) => {
    if (b.tipo !== "paragrafo") return b;
    const segmenti: Segmento[] = [];
    for (const s of b.segmenti) {
      if (s.tipo !== "testo" || s.attenuato) {
        segmenti.push(s);
        continue;
      }
      let ultimo = 0;
      re.lastIndex = 0;
      for (let m = re.exec(s.testo); m; m = re.exec(s.testo)) {
        const t = termini.find((x) => x.n === m![1].toLowerCase());
        if (!t || segnate.has(t.id)) continue;
        segnate.add(t.id);
        if (m.index > ultimo) segmenti.push({ tipo: "testo", testo: s.testo.slice(ultimo, m.index) });
        segmenti.push({ tipo: "nome", testo: m[1], cosa: t.id });
        ultimo = m.index + m[1].length;
      }
      if (ultimo < s.testo.length) segmenti.push({ tipo: "testo", testo: s.testo.slice(ultimo) });
    }
    return { ...b, segmenti };
  });
}
