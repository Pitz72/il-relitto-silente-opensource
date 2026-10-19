// ============================================================================
//  La tastiera del gioco (06-app-desktop.md, §6.2): tutto si fa anche senza
//  mouse. F5 e F9 i salvataggi, F11 lo schermo intero, Esc la pausa o indietro,
//  D il diario, Spazio completa il testo, i tasti delle uscite e delle scelte.
//  Tolta da Gioco.tsx così com'era (revisione 25, L13): Gioco le passa lo stato
//  e le azioni.
// ============================================================================
import { useEffect } from "react";
import type { ModelloAzione, SceltaModello } from "../azione/modello";
import type { Turno } from "../motore/tipi";
import type { Domanda } from "./pannelli/Pannelli";
import type { Selezione } from "./ramo/azioni";
import type { Filo } from "./ramo/geometria";

/** Il pannello aperto sopra il gioco. */
export type Pannello = null | "pausa" | "diario" | "salva" | "carica" | "opzioni" | "tasti";

export interface Tastiera {
  modello: ModelloAzione | null;
  selezione: Selezione;
  /** il ramo delle altre voci aperto («+N») */
  altri: { filo: Filo; gruppo: string } | null;
  pannello: Pannello;
  domanda: Domanda | null;
  turno: Turno | null;
  /** la modalità a solo testo: le lettere sono della riga */
  scritti: boolean;
  apriSalvataggi: (modo: "salva" | "carica") => Promise<void>;
  schermoIntero: () => Promise<void>;
  setPannello: (p: Pannello) => void;
  /** chiude il fiore, «Usa con…» e il ramo delle altre voci */
  chiudi: () => void;
  /** completa la rivelazione del testo */
  completa: () => void;
  gioca: (comando: string) => void;
  scegli: (s: SceltaModello) => void;
}

export function useTastiera({ modello, selezione, altri, pannello, domanda, turno, scritti, apriSalvataggi, schermoIntero, setPannello, chiudi, completa, gioca, scegli }: Tastiera) {
  useEffect(() => {
    const giu = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      // F5 e F9 non ricaricano la pagina: salvano e caricano
      if (e.key === "F5" || e.key === "F9") {
        e.preventDefault();
        if (!domanda && turno) void apriSalvataggi(e.key === "F5" ? "salva" : "carica");
        return;
      }
      if (e.key === "F11") {
        e.preventDefault();
        void schermoIntero();
        return;
      }
      if (domanda) return; // la conferma ha i suoi tasti
      // a solo testo le lettere sono della riga: il diario si apre scrivendo DIARIO
      const d = !scritti && (e.key === "d" || e.key === "D");
      if (pannello) {
        if (pannello === "diario" && (e.key === "Escape" || d)) {
          e.preventDefault();
          setPannello(null);
        } else if (pannello === "pausa" && d) {
          e.preventDefault();
          setPannello("diario");
        } else if (e.key === "Escape") {
          e.preventDefault();
          setPannello(pannello === "pausa" ? null : "pausa");
        }
        return;
      }
      if (d && turno) {
        e.preventDefault();
        setPannello("diario");
        return;
      }
      if (scritti) {
        // Esc: la riga lo prende se ha del testo da svuotare; a riga vuota arriva qui, e apre la pausa
        if (e.key === "Escape") {
          e.preventDefault();
          if (turno) setPannello("pausa");
        }
        return;
      }
      const suPulsante = e.target instanceof HTMLButtonElement;
      if (e.key === "Escape") {
        e.preventDefault();
        if (selezione.tipo !== "nessuna" || altri) {
          // il fuoco torna sulla cosa da cui il fiore o «Usa con…» era partito, o sull'attrezzo
          // (che è della tuta, o una cosa che porti, come la taglierina)
          const chiavi =
            selezione.tipo === "fiore" || selezione.tipo === "usaCon"
              ? [`cosa:${selezione.cosa}`]
              : selezione.tipo === "inMano"
                ? [`attrezzo:${selezione.attrezzo}`, `cosa:${selezione.attrezzo}`]
                : [];
          chiudi();
          if (chiavi.length)
            setTimeout(() => {
              for (const k of chiavi) {
                const b = document.querySelector<HTMLButtonElement>(`.baccello[data-chiave="${CSS.escape(k)}"]`);
                if (b) return b.focus();
              }
            }, 0);
        } else if (turno) setPannello("pausa");
        return;
      }
      // Spazio completa il testo; su un pulsante lo preme, tranne su una cosa mentre il testo sta comparendo
      const suCosa = e.target instanceof HTMLButtonElement && e.target.classList.contains("baccello") && !!document.querySelector(".turno.attuale.in-rivelazione");
      if (e.key === " " && (!suPulsante || suCosa)) {
        e.preventDefault();
        completa();
        return;
      }
      if (!modello || selezione.tipo !== "nessuna" || altri) return;
      // le uscite e le scelte hanno il loro tasto
      const tasto = e.code.startsWith("Numpad") ? e.code : e.key;
      const uscita = modello.fase === "gioco" ? modello.uscite.find((u) => u.tasto === tasto) : undefined;
      if (uscita) {
        e.preventDefault();
        gioca(uscita.comando);
        return;
      }
      const scelta = modello.scelte.find((s) => s.tasto && s.tasto === e.key.toLowerCase());
      if (scelta) {
        e.preventDefault();
        scegli(scelta);
      }
    };
    addEventListener("keydown", giu);
    return () => removeEventListener("keydown", giu);
  }, [modello, selezione, altri, gioca, chiudi, scegli, pannello, domanda, turno, apriSalvataggi, schermoIntero, scritti, setPannello, completa]);
}
