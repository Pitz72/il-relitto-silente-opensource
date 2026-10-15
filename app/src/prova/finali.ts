// ============================================================================
//  La prova dei finali attraverso l'interfaccia (RELITTO_PROVA=finali
//  nell'eseguibile; ?prova=finali nel browser dello sviluppo).
//  Gioca i sei finali come chi gioca con il mouse: dal menu principale «Nuova
//  partita», l'intro saltata con Esc, poi ogni passo cliccando nel DOM il
//  pulsante che lo manda (un'uscita, un'azione, un seme del dialogo, il baccello
//  di una cosa e il petalo del suo fiore, «Usa con…» e la cosa accesa, le cose
//  in più dietro «+N», la conferma); a fine partita la pausa e «Menu
//  principale». Ogni pulsante deve essere in vista quando lo si tocca.
//  Le voci da giocare e l'impronta finale vengono da collaudo/finali-menu.json,
//  che scrive collaudo/menu.mjs con il motore in CPython (seme 1): il motore
//  dentro l'app deve arrivare alla stessa impronta, e ogni finale deve finire
//  nel registro dei finali.
// ============================================================================
import riferimenti from "../../../collaudo/finali-menu.json";
import type { ModelloAzione } from "../azione/modello";

interface Riferimento {
  percorso: string;
  scelte: string[];
  impronta: string;
  esito: string;
  finale: string;
}

/** Quello che il gioco lascia vedere alla prova (Gioco.tsx, prova «finali»). */
export interface Sonda {
  esito: string;
  modello: ModelloAzione | null;
  /** i comandi giocati da quando la partita è cominciata */
  passi: number;
  finale: string | null;
  impronta(): string;
}

export interface EsitoFinale {
  finale: string;
  passi: number;
  /** come si è arrivati ai pulsanti: direttamente, dal fiore, in due passi, dalle cose in più */
  modi: Record<string, number>;
  ms: number;
  esito?: string;
  impronta_uguale?: boolean;
  errore?: string;
}

export interface Rapporto {
  ok: boolean;
  finali: EsitoFinale[];
  registro: string[];
  ms: number;
  errore?: string;
}

const RIFERIMENTI = riferimenti as Record<string, Riferimento>;
const aspetta = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sonda = () => (window as unknown as { __sondaGioco?: Sonda }).__sondaGioco ?? null;

/** Aspetta che `f` dia qualcosa (o fallisce dopo `ms`, dicendo che cosa aspettava). */
async function finche<T>(f: () => T | null | undefined | false, che: string, ms = 20000): Promise<T> {
  const t0 = performance.now();
  for (;;) {
    const v = f();
    if (v) return v;
    if (performance.now() - t0 > ms) throw new Error(`tempo scaduto: ${che}`);
    await aspetta(15);
  }
}

/** In vista: dentro la finestra, non nascosto, non sotto un pannello. */
function visibile(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2 || r.right <= 0 || r.bottom <= 0 || r.left >= innerWidth || r.top >= innerHeight) return false;
  const st = getComputedStyle(el);
  if (st.visibility === "hidden" || st.display === "none" || Number(st.opacity) === 0 && !el.closest(".fiore")) return false;
  return !el.closest("[aria-hidden='true']");
}

const etichetta = (el: Element) => (el.textContent ?? "").trim().replace(/\s+/g, " ");

/** Tocca un pulsante come un clic vero: prima deve essere in vista e attivo. */
async function tocca(el: HTMLElement, che: string) {
  await finche(() => el.isConnected && visibile(el) && !(el as HTMLButtonElement).disabled, `«${che}» in vista (${etichetta(el)})`, 3000);
  el.click();
  await aspetta(0);
}

function pulsante(selettore: string): HTMLElement | null {
  return [...document.querySelectorAll<HTMLElement>(selettore)].find(visibile) ?? null;
}
const conComando = (c: string) => pulsante(`[data-comando="${CSS.escape(c)}"]`);

function esc() {
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
}

/** Dove sta un comando nei menu di questo turno. */
type Piano = { via: "diretto" } | { via: "fiore"; cosa: string } | { via: "con"; cosa: string; verbo: string };

function piano(m: ModelloAzione, c: string): Piano | null {
  if ([...m.scelte, ...m.uscite, ...m.situazione, ...m.servizio].some((x) => x.comando === c)) return { via: "diretto" };
  for (const cosa of [...m.qui, ...m.conTe])
    for (const v of cosa.voci) {
      if (v.comando === c) return { via: "fiore", cosa: cosa.id };
      if (v.secondi.some((s) => s.comando === c)) return { via: "con", cosa: cosa.id, verbo: v.verbo };
    }
  return null;
}

/** Apre il fiore di una cosa: il suo baccello, o «+N» e il petalo della cosa nascosta. */
async function apri(cosa: string): Promise<"fiore" | "altri"> {
  const chiave = `cosa:${CSS.escape(cosa)}`;
  // il ramo si dispone dopo aver misurato il palco e i baccelli: prima lo si aspetta
  await finche(() => pulsante(".ramo .baccello"), "il ramo", 3000);
  // il «+N» che nasconde la cosa (data-nascosti): se c'è, la cosa sta lì
  const tutti = [...document.querySelectorAll<HTMLElement>(".ramo [data-avvia='altri']")].filter(visibile);
  const giusto = (el: HTMLElement) => (el.dataset.nascosti ?? "").split(" ").includes(`cosa:${cosa}`);
  const b = tutti.some(giusto) ? null : await finche(() => pulsante(`.ramo .baccello[data-chiave="${chiave}"]`), `il baccello di ${cosa}`, 2000).catch(() => null);
  if (b) {
    await tocca(b, cosa);
    return "fiore";
  }
  for (const piu of [...tutti.filter(giusto), ...tutti.filter((el) => !giusto(el))]) {
    await tocca(piu, "+N");
    const p = await finche(() => pulsante(`.fiore .petalo[data-chiave="${chiave}"]`), `«${cosa}» fra le cose in più`, 1500).catch(() => null);
    if (p) {
      await tocca(p, cosa);
      return "altri";
    }
    esc();
    await aspetta(0);
  }
  throw new Error(`la cosa «${cosa}» non ha un baccello in vista, né fra le cose in più`);
}

/** Gioca un comando cliccando nell'interfaccia; restituisce come ci è arrivato. */
async function gioca(c: string): Promise<string> {
  const s = await finche(() => sonda()?.modello && sonda(), "il turno");
  const prima = s.passi;
  const fatto = () => (sonda()?.passi ?? 0) > prima;
  const m = s.modello!;
  const p = piano(m, c);
  if (!p) throw new Error(`«${c}» non è in nessun menu di questo turno (fase ${m.fase})`);
  let modo: string = p.via;
  if (p.via === "fiore" || p.via === "con") {
    if ((await apri(p.cosa)) === "altri") modo = `${p.via} (cose in più)`;
    if (p.via === "con") {
      const con = await finche(() => pulsante(`.fiore .petalo[data-avvia="usaCon"][data-chiave="${CSS.escape(`${p.verbo}:con`)}"]`), `«${p.verbo} con…» nel fiore di ${p.cosa}`, 3000);
      await tocca(con, `${p.verbo} con…`);
    }
  }
  // il congedo dell'Anziano chiede conferma all'app: il seme, poi «Chiudi gli occhi»
  const bersaglio = await finche(() => conComando(c), `il pulsante di «${c}» (${modo})`, 3000);
  await tocca(bersaglio, c);
  await finche(() => fatto() || pulsante(".pannello.conferma [data-risposta='si']:not([data-comando])"), `la risposta a «${c}»`, 8000);
  if (!fatto()) {
    await tocca(pulsante(".pannello.conferma [data-risposta='si']")!, "la conferma");
    modo += " e conferma";
    await finche(fatto, `la risposta a «${c}» dopo la conferma`, 8000);
  }
  return modo;
}

/** Dalla schermata in cui si è al menu principale: i loghi (Esc), i riconoscimenti
 *  («Continua» dopo tre secondi), la dichiarazione («continua»), il gioco (la pausa). */
async function alMenu() {
  for (let giri = 0; giri < 8; giri++) {
    if (pulsante(".menu-voci button[data-voce='nuova']")) return;
    await finche(
      () => document.querySelector(".menu-voci button, .riconoscimenti, .gioco, [aria-label='Loghi di apertura']"),
      "una schermata",
    );
    if (document.querySelector("[aria-label='Loghi di apertura']")) {
      esc();
      await finche(() => !document.querySelector("[aria-label='Loghi di apertura']"), "la fine dei loghi", 5000);
    } else if (document.querySelector(".dichiarazione")) {
      await tocca(await finche(() => pulsante(".dichiarazione button"), "«continua» della dichiarazione", 5000), "continua");
    } else if (document.querySelector(".riconoscimenti")) {
      const avanti = await finche(() => pulsante(".ric-piede button:not(:disabled)"), "«Continua» dopo i riconoscimenti", 10000);
      await tocca(avanti, "Continua");
      await finche(() => !document.querySelector(".ric-piede"), "la fine dei riconoscimenti", 5000);
    } else if (document.querySelector(".gioco")) {
      if (!document.querySelector(".voci-pausa")) esc();
      const menu = await finche(() => [...document.querySelectorAll<HTMLElement>(".voci-pausa button")].find((b) => etichetta(b).startsWith("Menu principale") && visibile(b)), "«Menu principale» nella pausa");
      await tocca(menu, "Menu principale");
    }
    await aspetta(50);
  }
  await finche(() => pulsante(".menu-voci button[data-voce='nuova']"), "il menu principale");
}

async function unFinale(id: string, r: Riferimento): Promise<EsitoFinale> {
  const t0 = performance.now();
  const esito: EsitoFinale = { finale: id, passi: 0, modi: {}, ms: 0 };
  try {
    await alMenu();
    await tocca(pulsante(".menu-voci button[data-voce='nuova']")!, "Nuova partita");
    // con una partita in corso, la conferma; poi l'intro, che Esc salta (una volta sola:
    // un Esc di troppo, nel gioco, aprirebbe la pausa)
    const dopo = await finche(() => pulsante(".pannello.conferma [data-risposta='si']") || document.querySelector<HTMLElement>(".intro"), "l'intro", 10000);
    if (dopo.matches("[data-risposta='si']")) await tocca(dopo, "Comincia");
    await finche(() => document.querySelector(".intro"), "l'intro", 10000);
    await aspetta(300);
    esc();
    await finche(() => document.querySelector(".gioco"), "il gioco dopo l'intro", 60000);
    await finche(() => sonda()?.modello && sonda()!.passi === 0 && sonda(), "la plancia", 60000);
    for (const c of r.scelte) {
      const modo = await gioca(c);
      esito.passi += 1;
      esito.modi[modo] = (esito.modi[modo] ?? 0) + 1;
    }
    const s = sonda()!;
    esito.esito = s.esito;
    esito.impronta_uguale = s.impronta() === r.impronta;
    if (s.esito !== r.esito) esito.errore = `esito ${s.esito}, atteso ${r.esito}`;
    else if (s.finale !== r.finale) esito.errore = `finale ${s.finale}, atteso ${r.finale}`;
    else if (!esito.impronta_uguale) esito.errore = "l'impronta finale non è quella del motore in CPython";
  } catch (e) {
    esito.errore = `${e instanceof Error ? e.message : String(e)} (al passo ${esito.passi + 1})`;
  }
  esito.ms = Math.round(performance.now() - t0);
  return esito;
}

/** I sei finali, uno dopo l'altro; poi il registro dei finali dal menu. */
export async function provaDeiFinali(): Promise<Rapporto> {
  const t0 = performance.now();
  const rapporto: Rapporto = { ok: false, finali: [], registro: [], ms: 0 };
  for (const [id, r] of Object.entries(RIFERIMENTI)) {
    const e = await unFinale(id, r);
    rapporto.finali.push(e);
    console.info(`[prova dei finali] ${id}: ${e.errore ?? "ok"} (${e.passi} passi, ${(e.ms / 1000).toFixed(1)} s)`, e.modi);
    if (e.errore) break;
  }
  try {
    await alMenu();
    await tocca(pulsante(".menu-voci button[data-voce='registro']")!, "Registro dei finali");
    await finche(() => document.querySelector(".registro-righe li"), "il registro dei finali");
    rapporto.registro = [...document.querySelectorAll(".registro-righe li:not(.vuota) .registro-titolo")].map(etichetta);
    esc();
  } catch (e) {
    rapporto.errore = `il registro dei finali: ${e instanceof Error ? e.message : String(e)}`;
  }
  // il registro può avere finali di prima: devono esserci almeno tutti questi
  const titoli = { vivi: "Vivi", "prima-nota": "La prima nota", "stiva-piena": "La stiva piena", "doppio-fondo": "Doppio fondo", "mani-vuote": "Mani vuote", "due-lettere": "Due lettere" } as Record<string, string>;
  const mancanti = rapporto.finali.filter((f) => !f.errore && !rapporto.registro.includes(titoli[f.finale]));
  if (mancanti.length && !rapporto.errore) rapporto.errore = `mancano nel registro: ${mancanti.map((f) => f.finale).join(", ")}`;
  const finiti = rapporto.finali.filter((f) => !f.errore).length;
  rapporto.ok = finiti === Object.keys(RIFERIMENTI).length && !rapporto.errore;
  rapporto.ms = Math.round(performance.now() - t0);
  return rapporto;
}
