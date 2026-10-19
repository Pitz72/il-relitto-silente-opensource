// ============================================================================
//  I salvataggi (06-app-desktop.md, §4.6; 12-fase-2-ponte-e-modello.md, §6).
//  Sei posti più uno automatico a ogni cambio di stanza. Il testo lo fa il
//  ponte (rel_salva), lo scrive il processo Tauri in Documenti/Il Relitto
//  Silente (src-tauri/src/salvataggi.rs). Nel browser dello sviluppo i posti
//  stanno nel localStorage, con lo stesso formato: la pagina non cambia.
// ============================================================================
import { comando, dentroTauri } from "../lib/tauri";
import { MESI } from "../lib/italiano";
import type { Salvataggio } from "../motore/tipi";

export type IdPosto = "1" | "2" | "3" | "4" | "5" | "6" | "automatico";
export const POSTI: readonly IdPosto[] = ["1", "2", "3", "4", "5", "6"];

export interface Posto {
  posto: IdPosto;
  presente: boolean;
  /** il riassunto che il file porta: per mostrare il posto senza rigiocare */
  riassunto: Salvataggio["riassunto"] | null;
  creato: string | null;
  gioco: string | null;
  /** il file c'è ma non si legge */
  leggibile: boolean;
}

export interface Archivio {
  elenco(): Promise<Posto[]>;
  scrivi(posto: IdPosto, testo: string): Promise<void>;
  leggi(posto: IdPosto): Promise<string>;
  /** dove stanno, per dirlo a chi gioca */
  dove(): Promise<string>;
}

const archivioTauri: Archivio = {
  elenco: () => comando<Posto[]>("salvataggi_elenco"),
  scrivi: (posto, testo) => comando<void>("salvataggio_scrivi", { posto, testo }),
  leggi: (posto) => comando<string>("salvataggio_leggi", { posto }),
  dove: () => comando<string>("salvataggi_cartella"),
};

const CHIAVE = (posto: IdPosto) => `relitto.salvataggio.${posto}`;

const archivioDelBrowser: Archivio = {
  async elenco() {
    return ([...POSTI, "automatico"] as IdPosto[]).map((posto) => {
      let testo: string | null = null;
      try {
        testo = localStorage.getItem(CHIAVE(posto));
      } catch {
        /* niente spazio */
      }
      if (testo === null) return { posto, presente: false, riassunto: null, creato: null, gioco: null, leggibile: true };
      try {
        const v = JSON.parse(testo) as Salvataggio;
        return { posto, presente: true, riassunto: v.riassunto ?? null, creato: v.creato ?? null, gioco: v.gioco ?? null, leggibile: true };
      } catch {
        return { posto, presente: true, riassunto: null, creato: null, gioco: null, leggibile: false };
      }
    });
  },
  async scrivi(posto, testo) {
    localStorage.setItem(CHIAVE(posto), testo);
  },
  async leggi(posto) {
    const t = localStorage.getItem(CHIAVE(posto));
    if (t === null) throw new Error("il posto è vuoto");
    return t;
  },
  async dove() {
    return "la memoria del browser (sviluppo)";
  },
};

export const archivio = (): Archivio => (dentroTauri() ? archivioTauri : archivioDelBrowser);

/** «14 ottobre, 21:40»: la data di un salvataggio, all'italiana. */
export function quando(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const ore = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getDate()} ${MESI[d.getMonth()]}, ${ore}`;
}
