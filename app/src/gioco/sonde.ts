// ============================================================================
//  Le sonde del gioco: il codice che serve alle prove, non a chi gioca, tolto da
//  Gioco.tsx (revisione 25, L13). Resta nel pacchetto perché le prove girano
//  anche nell'eseguibile vero (strumenti/prova_eseguibile.py), ma non fa niente
//  se nessuno lo chiede:
//    RELITTO_PROVA=finali      la sonda che la prova dei finali legge (prova/finali.ts)
//    RELITTO_PROVA=salvataggi  la prova dei salvataggi attraverso il processo Tauri
//    lo sviluppo               window.__gioco, un percorso di collaudo fino a un passo
// ============================================================================
import { useEffect, useRef, type RefObject } from "react";
import type { ModelloAzione } from "../azione/modello";
import { comando } from "../lib/tauri";
import type { Motore } from "../motore/runtime";
import type { Turno, VoceCronaca } from "../motore/tipi";
import { archivio, type Posto } from "./salvataggi";

const VERSIONE = __VERSIONE__;

/** La prova dei salvataggi nell'eseguibile vero (RELITTO_PROVA=salvataggi):
 *  sei comandi, il salvataggio nel posto 6 attraverso il processo Tauri,
 *  l'elenco, la rilettura, il caricamento; poi un rapporto, e si esce. */
const PROVA_SALVATAGGI = ["analizza la nave aliena", "accosta", "spara gli arpioni", "ovest", "prendi la tuta", "indossa la tuta"];

interface Sonde {
  prova?: "salvataggi" | "finali";
  turno: Turno | null;
  modello: ModelloAzione | null;
  motoreRef: RefObject<Motore | null>;
  /** i comandi giocati da quando la partita è cominciata, e il finale */
  passi: RefObject<number>;
  finaleRef: RefObject<string | null>;
  gioca: (comando: string) => void;
  comincia: (primo: Turno) => void;
  setCronaca: (c: readonly VoceCronaca[]) => void;
}

export function useSonde({ prova, turno, modello, motoreRef, passi, finaleRef, gioca, comincia, setCronaca }: Sonde) {
  // la sonda della prova dei finali: il turno come lo vede il modello, i passi, il finale
  useEffect(() => {
    if (prova !== "finali") return;
    const w = window as unknown as Record<string, unknown>;
    w.__sondaGioco = {
      esito: turno?.esito ?? "in_corso",
      modello,
      passi: passi.current,
      finale: finaleRef.current,
      impronta: () => motoreRef.current?.impronta() ?? "",
    };
    return () => {
      delete w.__sondaGioco;
    };
  }, [prova, turno, modello]);

  // la prova dei salvataggi nell'eseguibile (RELITTO_PROVA=salvataggi)
  const provaFatta = useRef(false);
  useEffect(() => {
    if (prova !== "salvataggi" || !turno || provaFatta.current) return;
    provaFatta.current = true;
    (async () => {
      const m = motoreRef.current!;
      const esito: Record<string, unknown> = { data: new Date().toISOString(), versione: VERSIONE, ok: false };
      try {
        for (const c of PROVA_SALVATAGGI) gioca(c);
        await new Promise((r) => setTimeout(r, 400)); // il salvataggio automatico del cambio di stanza
        const impronta = m.impronta();
        const testo = m.salva(`${VERSIONE.gioco} · ${VERSIONE.commit} · prova`, new Date().toISOString());
        const a = archivio();
        await a.scrivi("6", testo);
        const elenco = await a.elenco();
        const letto = await a.leggi("6");
        const r = m.carica(letto);
        esito.cartella = await a.dove();
        esito.posto6 = elenco.find((p) => p.posto === "6");
        esito.automatico = elenco.find((p) => p.posto === "automatico");
        esito.letto_uguale = letto === testo;
        esito.caricamento = r.ok ? { esito: r.esito, ms: r.ms } : { rifiuto: r.motivo, messaggio: r.messaggio };
        esito.impronta_uguale = r.ok && m.impronta() === impronta;
        esito.ok = esito.letto_uguale === true && r.ok && r.esito === "identica" && esito.impronta_uguale === true && !!(esito.automatico as Posto | undefined)?.presente;
      } catch (e) {
        esito.errore = String(e instanceof Error ? e.message : e);
      }
      await comando("scrivi_rapporto", { nome: `prova-salvataggi-${Date.now()}.json`, contenuto: JSON.stringify(esito, null, 2) });
      await comando("esci", { codice: esito.ok ? 0 : 1 });
    })();
  }, [prova, turno, gioca]);

  // Solo nello sviluppo: un percorso di collaudo giocato fino a un passo, per
  // guardare lo schermo in un punto preciso della partita (le prove della fase 3).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as Record<string, unknown>).__gioco = {
      gioca,
      percorso: (nome: string, fino = Infinity) => {
        const m = motoreRef.current;
        if (!m) return "il motore non è pronto";
        const lista = m.percorso(nome).comandi.slice(0, fino);
        comincia(m.avvia(1));
        // i primi in fretta, gli ultimi tre come se li si giocasse adesso (il diario, il turno)
        const veloci = Math.max(0, lista.length - 3);
        for (const c of lista.slice(0, veloci)) m.comando(c);
        setCronaca(m.diario().cronaca);
        for (const c of lista.slice(veloci)) gioca(c);
        return `${nome}: ${lista.length} comandi`;
      },
    };
  }, [gioca, comincia]);
}
