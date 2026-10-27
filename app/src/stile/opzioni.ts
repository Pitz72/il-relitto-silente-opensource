// ============================================================================
//  Le opzioni di chi gioca che toccano lo schermo (06-app-desktop.md, §2,
//  principio 6: «movimento ridotto, testo più grande, colori non come unico
//  segnale: sono opzioni, ma il gioco è progettato perché funzionino da subito»).
//  Si ricordano nel browser dell'app (localStorage): sono comodità di chi gioca,
//  non stato del gioco; se lo spazio non c'è, valgono quelle di base.
// ============================================================================
import { useCallback, useEffect, useState } from "react";

export interface Opzioni {
  /** «sistema» segue la preferenza del sistema operativo */
  movimento: "sistema" | "ridotto" | "pieno";
  /** la rivelazione del testo a righe (§4.1); si può spegnere */
  rivelazione: boolean;
  carattere: "newsreader" | "atkinson";
  testoGrande: boolean;
  /** i nomi delle cose toccabili nel testo (D15: sì, attivi di base) */
  nomiToccabili: boolean;
  /** come si danno i comandi: con i pulsanti (il ramo e il fiore) o scritti (l'avventura testuale, documento 18) */
  comandi: "pulsanti" | "scritti";
  /** cerca una versione nuova all'avvio (si collega a GitHub; il controllo a mano c'è sempre, nel menu) */
  cercaAggiornamenti: boolean;
  /** lo schermo intero (l'app ci parte; si può scegliere la finestra) */
  schermoIntero: boolean;
  /** il suono (bibbia sonora, §2.5): i volumi da 0 a 1, il mono, la dinamica ridotta,
   *  i suoni intensi ridotti (per chi soffre di acufeni, emicrania, ansia da suoni forti) */
  volume: number;
  /** gli effetti: tutto il suono del mondo (le stanze, le macchine, il fiato, i passi, il
   *  Sintonizzatore, il brusio); i livelli fra un suono e l'altro li decide la regia (mondo/livelli.rs) */
  volumeEffetti: number;
  /** il tocco dei pulsanti: un cursore a parte */
  volumeInterfaccia: number;
  /** la musica (documenti 21 e 22) */
  volumeMusica: number;
  /** il parlato: le voci registrate (narratore, personaggi). Il canale c'è, le registrazioni no */
  volumeParlato: number;
  mono: boolean;
  dinamicaRidotta: boolean;
  suoniIntensiRidotti: boolean;
  /** la grafica (documento 30, §8): gli effetti dello schermo di gioco, uno per uno. Di base tutti
   *  accesi; la qualità «leggera» ed «essenziale» li alleggerisce per le macchine più deboli */
  grana: "mossa" | "ferma" | "no";
  /** i riflessi sul vetro del casco, e il fiato che lo appanna */
  riflessi: boolean;
  /** la luce della stanza che respira dietro il testo */
  luceStanza: boolean;
  /** il segnale che corre sui fili del ramo */
  segnaleFili: boolean;
  /** le vene della membrana che crescono e si accendono (no: ferme, come con il movimento ridotto) */
  veneVive: boolean;
  /** il gioco sfocato dietro i pannelli */
  sfocatura: boolean;
}

export type Qualita = "piena" | "leggera" | "essenziale";
type Effetti = Pick<Opzioni, "grana" | "riflessi" | "luceStanza" | "segnaleFili" | "veneVive" | "sfocatura">;

/** I tre livelli della grafica: ognuno è una scelta di effetti, che poi si cambiano uno per uno. */
export const QUALITA: Readonly<Record<Qualita, Effetti>> = {
  piena: { grana: "mossa", riflessi: true, luceStanza: true, segnaleFili: true, veneVive: true, sfocatura: true },
  leggera: { grana: "ferma", riflessi: true, luceStanza: false, segnaleFili: true, veneVive: true, sfocatura: false },
  essenziale: { grana: "no", riflessi: false, luceStanza: false, segnaleFili: false, veneVive: false, sfocatura: false },
};

/** Il livello che corrisponde agli effetti scelti, o null se sono stati scelti uno per uno. */
export function qualitaDi(o: Opzioni): Qualita | null {
  for (const [q, e] of Object.entries(QUALITA) as [Qualita, Effetti][])
    if ((Object.keys(e) as (keyof Effetti)[]).every((k) => o[k] === e[k])) return q;
  return null;
}

export const OPZIONI_DI_BASE: Opzioni = {
  movimento: "sistema",
  rivelazione: true,
  carattere: "newsreader",
  testoGrande: false,
  nomiToccabili: true,
  schermoIntero: true,
  comandi: "pulsanti",
  cercaAggiornamenti: true,
  volume: 0.75,
  volumeEffetti: 1,
  volumeInterfaccia: 1,
  volumeMusica: 1,
  volumeParlato: 1,
  mono: false,
  dinamicaRidotta: false,
  suoniIntensiRidotti: false,
  ...QUALITA.piena,
};

const CHIAVE = "relitto.opzioni";

function leggi(): Opzioni {
  try {
    const dati = JSON.parse(localStorage.getItem(CHIAVE) ?? "{}");
    return { ...OPZIONI_DI_BASE, ...(typeof dati === "object" && dati ? dati : {}) };
  } catch {
    return { ...OPZIONI_DI_BASE };
  }
}

/** Se qualcuno ha già scelto le sue opzioni, qui: una traccia di chi aveva già giocato (menu/novita.ts). */
export function opzioniRicordate(): boolean {
  try {
    return localStorage.getItem(CHIAVE) !== null;
  } catch {
    return false;
  }
}

function scrivi(o: Opzioni) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(o));
  } catch {
    /* niente spazio: le opzioni valgono fino alla chiusura */
  }
}

// Un deposito solo per tutta l'app: il menu e il gioco vedono le stesse opzioni.
let attuali: Opzioni | null = null;
const ascoltatori = new Set<(o: Opzioni) => void>();

export function useOpzioni(): [Opzioni, (cambio: Partial<Opzioni>) => void] {
  const [opzioni, setOpzioni] = useState<Opzioni>(() => (attuali ??= leggi()));
  useEffect(() => {
    ascoltatori.add(setOpzioni);
    return () => void ascoltatori.delete(setOpzioni);
  }, []);
  const cambia = useCallback((cambio: Partial<Opzioni>) => {
    attuali = { ...(attuali ?? leggi()), ...cambio };
    scrivi(attuali);
    for (const a of ascoltatori) a(attuali);
  }, []);
  return [opzioni, cambia];
}

const RIDOTTO = "(prefers-reduced-motion: reduce)";

/** Vero se il movimento va ridotto: per l'opzione, o per il sistema. */
export function useMovimentoRidotto(preferenza: Opzioni["movimento"]): boolean {
  const [sistema, setSistema] = useState(() => typeof matchMedia === "function" && matchMedia(RIDOTTO).matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const m = matchMedia(RIDOTTO);
    const cambio = () => setSistema(m.matches);
    m.addEventListener("change", cambio);
    return () => m.removeEventListener("change", cambio);
  }, []);
  return preferenza === "ridotto" || (preferenza === "sistema" && sistema);
}

/** Gli attributi della radice dello schermo che dicono le opzioni al CSS. */
export function attributiSchermo(o: Opzioni, ridotto: boolean): Record<string, string> {
  return {
    "data-movimento": ridotto ? "ridotto" : "pieno",
    "data-carattere": o.carattere,
    "data-testo": o.testoGrande ? "grande" : "normale",
    // la grafica (documento 30, §8): il CSS accende e ferma gli effetti da qui
    "data-grana": o.grana,
    "data-riflessi": o.riflessi ? "si" : "no",
    "data-luce": o.luceStanza ? "si" : "no",
    "data-segnale": o.segnaleFili ? "si" : "no",
    "data-sfocatura": o.sfocatura ? "si" : "no",
  };
}
