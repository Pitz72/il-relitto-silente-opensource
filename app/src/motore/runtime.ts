// ============================================================================
//  Il motore FAVELLA dentro Pyodide.
//  Carica l'interprete (public/pyodide, mai dalla rete), installa lark dalla sua
//  ruota, scrive motore, gioco e ponte nel filesystem di Pyodide e importa il
//  ponte. Ogni passo è misurato: la fase 1 deve sapere quanto costa l'avvio.
// ============================================================================
import { fileDaScrivere, STORIA } from "./sorgenti";
import type { Compilazione, DiarioIntero, EsitoCaricamento, EsitoRipresa, Percorso, SceltaPulsante, StatoStrumenti, Turno } from "./tipi";

const RUOTA_LARK = "lark-1.3.1-py3-none-any.whl";

export interface TempiAvvio {
  /** dall'inizio della pagina al primo comando: i passi, in ms */
  script: number;
  interprete: number;
  lark: number;
  file: number;
  importazione: number;
  compilazione: number;
  /** la compilazione misurata dentro Python */
  compilazionePython: number;
  primoTurno: number;
  totale: number;
}

type FunzionePy = (...a: unknown[]) => string;

export interface Motore {
  avvia(seme?: number): Turno;
  comando(cmd: string): Turno;
  /** il pulsante che gioca un comando; `candidati`: solo fra questi (i comandi dei menu) */
  pulsantePer(cmd: string, candidati?: string[]): SceltaPulsante;
  percorso(nome: string): Percorso;
  stato(): StatoStrumenti;
  /** il testo del salvataggio della partita in corso (lo scrive su file il processo Tauri) */
  salva(identita?: string, creato?: string): string;
  /** rigioca un salvataggio; se lo rifiuta, la partita in corso non cambia */
  carica(testo: string): EsitoCaricamento;
  /** l'impronta SHA-256 dello stato della partita in corso */
  impronta(): string;
  /** il diario intero: il prologo con la prima stanza, e la cronaca */
  diario(): DiarioIntero;
  /** la partita in corso, ridisegnata senza cambiarla (il ritorno dal menu principale) */
  riprendi(): EsitoRipresa;
  compilazione: Compilazione;
  versionePython: string;
  versionePyodide: string;
}

const iniettaScript = (src: string) =>
  new Promise<void>((risolvi, rifiuta) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => risolvi();
    s.onerror = () => rifiuta(new Error(`Impossibile caricare ${src}`));
    document.head.appendChild(s);
  });

export async function caricaMotore(avanzamento: (passo: string) => void): Promise<{ motore: Motore; tempi: TempiAvvio }> {
  const base = new URL("./pyodide/", location.href).href;
  const t0 = performance.now();
  const tempi: Partial<TempiAvvio> = {};
  let t = t0;
  const segna = (k: keyof TempiAvvio) => {
    const ora = performance.now();
    tempi[k] = ora - t;
    t = ora;
  };

  avanzamento("Avvio dell’interprete Python…");
  await iniettaScript(`${base}pyodide.js`);
  segna("script");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pyodide = await (window as any).loadPyodide({ indexURL: base, fullStdLib: false });
  segna("interprete");

  avanzamento("Installazione di lark…");
  const ruota = await fetch(`${base}${RUOTA_LARK}`);
  if (!ruota.ok) throw new Error(`Manca ${RUOTA_LARK} (HTTP ${ruota.status})`);
  pyodide.unpackArchive(await ruota.arrayBuffer(), "wheel");
  segna("lark");

  avanzamento("Scrittura del motore e del gioco…");
  for (const [percorso, testo] of Object.entries(fileDaScrivere())) {
    pyodide.FS.mkdirTree(percorso.slice(0, percorso.lastIndexOf("/")));
    pyodide.FS.writeFile(percorso, testo);
  }
  segna("file");

  avanzamento("Importazione del motore Favella1…");
  pyodide.runPython(`
import sys
sys.path[:0] = ["/relitto/app", "/relitto/motore"]
import ponte
`);
  const ponte = pyodide.globals.get("ponte");
  const f = (nome: string): FunzionePy => ponte[nome];
  segna("importazione");

  avanzamento("Compilazione del gioco…");
  const compilazione = JSON.parse(f("rel_compila")(STORIA)) as Compilazione;
  if (!compilazione.ok) throw new Error(`Compilazione fallita: ${compilazione.errore}\n${compilazione.rapporto ?? ""}`);
  segna("compilazione");
  tempi.compilazionePython = compilazione.ms ?? 0;

  const avvia = f("rel_avvia");
  const comando = f("rel_comando");
  const pulsantePer = f("rel_pulsante_per");
  const percorso = f("rel_percorso");
  const stato = f("rel_stato");
  const salva = f("rel_salva");
  const carica = f("rel_carica");
  const impronta = f("rel_impronta");
  const diario = f("rel_diario");
  const riprendi = f("rel_riprendi");

  const motore: Motore = {
    avvia: (seme) => JSON.parse(avvia(seme ?? null)) as Turno,
    comando: (cmd) => {
      const r = JSON.parse(comando(cmd));
      if (!r.ok) throw new Error(r.errore);
      return r as Turno;
    },
    pulsantePer: (cmd, candidati) =>
      JSON.parse(pulsantePer(cmd, candidati ? JSON.stringify(candidati) : null)) as SceltaPulsante,
    percorso: (nome) => JSON.parse(percorso(`/relitto/collaudo/${nome}`)) as Percorso,
    stato: () => JSON.parse(stato()) as StatoStrumenti,
    salva: (identita, creato) => salva(identita ?? null, creato ?? null),
    carica: (testo) => JSON.parse(carica(testo)) as EsitoCaricamento,
    impronta: () => (JSON.parse(impronta()) as { impronta: string }).impronta,
    diario: () => JSON.parse(diario()) as DiarioIntero,
    riprendi: () => JSON.parse(riprendi()) as EsitoRipresa,
    compilazione,
    versionePython: pyodide.runPython("import sys; sys.version.split()[0]") as string,
    versionePyodide: pyodide.version as string,
  };

  avanzamento("Prima stanza…");
  motore.avvia(1);
  segna("primoTurno");
  tempi.totale = performance.now() - t0;
  return { motore, tempi: tempi as TempiAvvio };
}
