// ============================================================================
//  Lo schermo del gioco (06-app-desktop.md, §4 e §4.7; stile C, «Membrana»).
//  Il motore vero in Pyodide; il modello d'azione fa i menu; la grammatica
//  tipografica veste il testo; le atmosfere seguono lo stato del gioco.
//  Le modalità (§4.5): l'esplorazione, il dialogo, la conferma, il cartello
//  d'atto; sopra, la pausa (Esc), il diario (D), i salvataggi (F5, F9), le
//  opzioni.
// ============================================================================
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { caricaMotore, type Motore } from "../motore/runtime";
import type { Evento, Turno, VoceCronaca } from "../motore/tipi";
import { costruisciModello, type ModelloAzione, type SceltaModello } from "../azione/modello";
import { AZIONI_DI_SITUAZIONE } from "../azione/situazione";
import { climaDi, tavolozza, variabiliCss } from "../stile/atmosfere";
import { attributiSchermo, useMovimentoRidotto, useOpzioni } from "../stile/opzioni";
import { comando, dentroTauri } from "../lib/tauri";
import { blocchiDelTurno, segnaNomi, type Blocco } from "./lamina/grammatica";
import Lamina, { type VoceDiario } from "./lamina/Lamina";
import Ramo from "./ramo/Ramo";
import { accesiDa, attrezzoDelVerbo, bersagli, NESSUNA, type Azione, type Selezione } from "./ramo/azioni";
import type { Filo } from "./ramo/geometria";
import Visore, { CartelloAtto, useCartelloAtto } from "./visore/Visore";
import Dialogo from "./dialogo/Dialogo";
import Diario from "./diario/Diario";
import type { IdPagina } from "./diario/pagine";
import Vene from "./vene/Vene";
import { Avviso, Conferma, PannelloOpzioni, Pausa, Salvataggi, useAvviso, type Domanda } from "./pannelli/Pannelli";
import { archivio, type IdPosto, type Posto } from "./salvataggi";
import "../stile/base.css";
import "./gioco.css";

const VERSIONE = __VERSIONE__;

// Un solo motore per pagina, anche quando React (StrictMode) monta due volte.
let caricamento: ReturnType<typeof caricaMotore> | null = null;

const ARTICOLO = /^(?:il|lo|la|i|gli|le|l['’]|un|uno|una|dei|degli|delle)\s*/i;

/** Quanto restano accesi i pulsanti di un suggerimento (§6.1: «per qualche secondo»). */
const ACCESI_PER = 6000;

/** I blocchi di un turno, con i nomi toccabili se l'opzione è accesa. */
function blocchiDi(t: Turno, m: ModelloAzione, nomi: boolean): Blocco[] {
  const verbi = new Set([...t.pulsanti.verbi.map((v) => v.verbo), ...AZIONI_DI_SITUAZIONE.map((a) => a.comando.split(" ")[0])]);
  const blocchi = blocchiDelTurno(t.eventi, { suggerimenti: m.suggerimenti, verbi });
  if (!nomi) return blocchi;
  return segnaNomi(
    blocchi,
    t.cose.map((c) => ({ id: c.id, nomi: [c.id, c.nome.replace(ARTICOLO, ""), c.etichetta, ...c.nomi] })),
  );
}

/** Quanta aria è costato il turno. */
const differenzaAria = (t: Turno) => (t.suono.eventi.find((e) => e.evento === "aria")?.differenza as number | undefined) ?? null;

/** Il seme di una partita nuova: il caso del gioco cambia da una partita all'altra. */
const semeNuovo = () => 1 + Math.floor(Math.random() * 2147483646);

/** Il congedo dell'Anziano: il punto di non ritorno che chiede una conferma (D16). */
const CONGEDO = /^\[Chiudi gli occhi/;

type Pannello = null | "pausa" | "diario" | "salva" | "carica" | "opzioni";

/** La prova dei salvataggi nell'eseguibile vero (RELITTO_PROVA=salvataggi):
 *  sei comandi, il salvataggio nel posto 6 attraverso il processo Tauri,
 *  l'elenco, la rilettura, il caricamento; poi un rapporto, e si esce. */
const PROVA_SALVATAGGI = ["analizza la nave aliena", "accosta", "spara gli arpioni", "ovest", "prendi la tuta", "indossa la tuta"];

export default function Gioco({ prova }: { prova?: "salvataggi" } = {}) {
  const [opzioni, cambiaOpzioni] = useOpzioni();
  const ridotto = useMovimentoRidotto(opzioni.movimento);
  const motoreRef = useRef<Motore | null>(null);
  const palcoRef = useRef<HTMLElement>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [passo, setPasso] = useState("Avvio…");
  const [turno, setTurno] = useState<Turno | null>(null);
  const [diario, setDiario] = useState<VoceDiario[]>([]);
  /** il diario (D): il prologo con la prima stanza, la cronaca del ponte, la pagina aperta */
  const [aperturaDiario, setAperturaDiario] = useState<readonly Evento[]>([]);
  const [cronaca, setCronaca] = useState<readonly VoceCronaca[]>([]);
  const [paginaDiario, setPaginaDiario] = useState<IdPagina>("trascrizione");
  const [verbi, setVerbi] = useState<ReadonlySet<string>>(new Set());
  const [completa, setCompleta] = useState(0);
  const [selezione, setSelezione] = useState<Selezione>(NESSUNA);
  const [altri, setAltri] = useState<{ filo: Filo; gruppo: string } | null>(null);
  const [accesi, setAccesi] = useState<ReadonlySet<string>>(new Set());
  const [palco, setPalco] = useState({ W: 0, H: 0 });
  const [pannello, setPannello] = useState<Pannello>(null);
  const [domanda, setDomanda] = useState<Domanda | null>(null);
  const [posti, setPosti] = useState<Posto[] | null>(null);
  const [dove, setDove] = useState("");
  const [avviso, mostraAvviso] = useAvviso();
  const costi = useRef(new Map<string, number>());
  const contatore = useRef(0);
  const ultimoPosto = useRef<IdPosto>("1");
  /** la stanza dell'ultimo turno: il salvataggio automatico scatta quando cambia */
  const stanzaRef = useRef<string | null>(null);
  /** il contatto dell'ultimo turno: quando diventa «avvenuto», la membrana cresce */
  const contattoRef = useRef<string | null>(null);
  const [crescita, setCrescita] = useState(0);

  const modello = useMemo(() => (turno ? costruisciModello(turno) : null), [turno]);

  /** Una partita che comincia (o ricomincia): il prologo spento sopra la prima stanza. */
  const comincia = useCallback(
    (primo: Turno) => {
      const m = costruisciModello(primo);
      stanzaRef.current = primo.stato.stanza;
      contattoRef.current = primo.stato.contatto;
      setTurno(primo);
      setSelezione(NESSUNA);
      setAltri(null);
      setDiario([
        { chiave: contatore.current++, comando: null, differenza: null, blocchi: blocchiDelTurno(primo.apertura ?? []) },
        { chiave: contatore.current++, comando: null, differenza: null, blocchi: blocchiDi(primo, m, opzioni.nomiToccabili) },
      ]);
      setAperturaDiario([...(primo.apertura ?? []), ...primo.eventi]);
      setCronaca([]);
    },
    [opzioni.nomiToccabili],
  );

  // ---- l'avvio --------------------------------------------------------------
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        caricamento ??= caricaMotore(setPasso);
        const { motore } = await caricamento;
        if (!vivo) return;
        motoreRef.current = motore;
        setVerbi(new Set(motore.compilazione.verbi ?? []));
        comincia(motore.avvia(semeNuovo()));
      } catch (e) {
        setErrore(String(e instanceof Error ? (e.stack ?? e.message) : e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- la misura del palco (il ramo e il fiore si dispongono in pixel) ------
  useLayoutEffect(() => {
    const el = palcoRef.current;
    if (!el) return;
    const o = new ResizeObserver(() => setPalco({ W: el.clientWidth, H: el.clientHeight }));
    o.observe(el);
    return () => o.disconnect();
  }, []);

  // ---- i salvataggi -----------------------------------------------------------
  const salvaNel = useCallback(
    async (posto: IdPosto, silenzioso = false) => {
      const m = motoreRef.current;
      if (!m) return;
      try {
        const testo = m.salva(`${VERSIONE.gioco} · ${VERSIONE.commit}`, new Date().toISOString());
        await archivio().scrivi(posto, testo);
        if (!silenzioso) mostraAvviso(`Salvato nel posto ${posto}.`);
      } catch (e) {
        mostraAvviso(`Il salvataggio non è riuscito: ${String(e instanceof Error ? e.message : e)}`, true);
      }
    },
    [mostraAvviso],
  );

  const caricaDa = useCallback(
    async (posto: IdPosto) => {
      const m = motoreRef.current;
      if (!m) return;
      try {
        const testo = await archivio().leggi(posto);
        const r = m.carica(testo);
        if (!r.ok) {
          mostraAvviso(r.messaggio, true);
          return;
        }
        const mod = costruisciModello(r.turno);
        stanzaRef.current = r.turno.stato.stanza;
        contattoRef.current = r.turno.stato.contatto;
        setTurno(r.turno);
        setSelezione(NESSUNA);
        setAltri(null);
        setDiario([{ chiave: contatore.current++, comando: null, differenza: null, blocchi: blocchiDi(r.turno, mod, opzioni.nomiToccabili) }]);
        setAperturaDiario(r.diario.apertura);
        setCronaca(r.diario.cronaca);
        if (r.esito === "identica") mostraAvviso(posto === "automatico" ? "Partita ripresa dall’ultima stanza." : `Partita caricata dal posto ${posto}.`);
        else mostraAvviso(r.messaggio, r.esito === "diversa");
      } catch (e) {
        mostraAvviso(`Il caricamento non è riuscito: ${String(e instanceof Error ? e.message : e)}`, true);
      }
    },
    [mostraAvviso, opzioni.nomiToccabili],
  );

  const apriSalvataggi = useCallback(async (modo: "salva" | "carica") => {
    setPannello(modo);
    setPosti(null);
    try {
      const a = archivio();
      setDove(await a.dove());
      setPosti(await a.elenco());
    } catch (e) {
      setPosti([]);
      setDove(String(e));
    }
  }, []);

  // ---- un comando ------------------------------------------------------------
  const gioca = useCallback(
    (comando: string, comeSiLegge?: string) => {
      const m = motoreRef.current;
      if (!m) return;
      const prima = stanzaRef.current;
      const t = m.comando(comando);
      stanzaRef.current = t.stato.stanza;
      // il primo contatto: la membrana entra dai bordi (§3)
      if (contattoRef.current === "nuovo" && t.stato.contatto === "avvenuto") setCrescita((n) => n + 1);
      contattoRef.current = t.stato.contatto;
      const mod = costruisciModello(t);
      const differenza = differenzaAria(t);
      // D16: quanto costa un tipo di azione lo si sa dopo averla provata
      if (differenza && t.comando?.verbo) costi.current.set(t.comando.verbo, differenza);
      setTurno(t);
      setSelezione(NESSUNA);
      setAltri(null);
      setDiario((d) => [
        ...d.slice(-40),
        { chiave: contatore.current++, comando: comeSiLegge ?? comando, differenza, blocchi: blocchiDi(t, mod, opzioni.nomiToccabili) },
      ]);
      // la cronaca segue la sequenza del motore: ANNULLA la accorcia
      const c = t.cronaca;
      if (c) setCronaca((v) => [...v.slice(0, c.lunghezza - (c.nuova ? 1 : 0)), ...(c.nuova ? [c.nuova] : [])]);
      // il salvataggio automatico, a ogni cambio di stanza (§4.6)
      if (t.stato.stanza !== prima && t.esito === "in_corso" && t.pulsanti.fase === "gioco") void salvaNel("automatico", true);
    },
    [opzioni.nomiToccabili, salvaNel],
  );

  // i suggerimenti del turno accendono i loro pulsanti per qualche secondo
  useEffect(() => {
    if (!modello) return;
    const a = accesiDa(modello);
    setAccesi(a);
    if (!a.size) return;
    const t = setTimeout(() => setAccesi(new Set()), ACCESI_PER);
    return () => clearTimeout(t);
  }, [modello]);

  const chiudi = useCallback(() => {
    setSelezione(NESSUNA);
    setAltri(null);
  }, []);

  const ricomincia = useCallback(() => {
    const m = motoreRef.current;
    if (!m) return;
    setPannello(null);
    costi.current.clear();
    comincia(m.avvia(semeNuovo()));
  }, [comincia]);

  const azione = useCallback(
    (a: Azione) => {
      if (a.tipo === "comando") {
        // alla fine della partita, ricominciare e caricare sono dell'app
        if (modello?.fase === "fine" && a.comando === "ricomincia") return ricomincia();
        if (modello?.fase === "fine" && a.comando === "carica") return void apriSalvataggi("carica");
        gioca(a.comando, a.comeSiLegge);
      } else if (a.tipo === "chiudi") chiudi();
      else if (a.tipo === "apri") {
        setAltri(null);
        setSelezione({ tipo: "fiore", cosa: a.cosa });
      } else if (a.tipo === "usaCon") {
        setAltri(null);
        setSelezione({ tipo: "usaCon", cosa: a.cosa, voce: a.voce });
      } else if (a.tipo === "inMano") {
        const attrezzo = modello?.attrezzi.find((x) => x.id === a.attrezzo);
        const verbo = attrezzo?.verbi.find((v) => v.verbo === a.verbo);
        setAltri(null);
        setSelezione({ tipo: "inMano", attrezzo: a.attrezzo, verbo: a.verbo, etichetta: verbo ? `${attrezzo!.etichetta} (${verbo.etichetta.toLowerCase()})` : (attrezzo?.etichetta ?? a.attrezzo) });
      }
    },
    [gioca, chiudi, modello, ricomincia, apriSalvataggi],
  );

  /** Una risposta del dialogo: il congedo dell'Anziano chiede conferma. */
  const scegli = useCallback(
    (s: SceltaModello) => {
      if (turno?.stato.dialogo === "anziano" && CONGEDO.test(s.etichetta))
        setDomanda({ testo: "Da qui non si torna.", si: "Chiudi gli occhi", no: "Non ancora", allora: () => gioca(s.comando, s.etichetta) });
      else gioca(s.comando, s.etichetta);
    },
    [turno?.stato.dialogo, gioca],
  );

  // un nome toccato nel testo: un bersaglio, se se ne sta scegliendo uno; altrimenti il suo fiore
  const suNome = useCallback(
    (cosa: string) => {
      if (!modello) return;
      const possibili = bersagli(selezione, modello);
      if (possibili.size) {
        const c = possibili.get(cosa);
        if (c) gioca(c);
        else chiudi();
        return;
      }
      if ([...modello.qui, ...modello.conTe].some((m) => m.id === cosa)) azione({ tipo: "apri", cosa });
    },
    [modello, selezione, gioca, chiudi, azione],
  );

  // un suggerimento toccato nel testo
  const suSuggerimento = useCallback(
    (i: number) => {
      const s = modello?.suggerimenti[i];
      if (!s) return;
      if (s.comando) gioca(s.comando);
      else if (s.dove === "attrezzo") {
        const a = attrezzoDelVerbo(modello!.attrezzi, s.verbo);
        if (a) azione({ tipo: "inMano", attrezzo: a.id, verbo: s.verbo });
      }
    },
    [modello, gioca, azione],
  );

  const schermoIntero = useCallback(async () => {
    if (dentroTauri()) {
      const w = getCurrentWindow();
      await w.setFullscreen(!(await w.isFullscreen()));
    } else if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }, []);

  // ---- la tastiera (§6.2) ----------------------------------------------------
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
      const d = e.key === "d" || e.key === "D";
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
      const suPulsante = e.target instanceof HTMLButtonElement;
      if (e.key === "Escape") {
        e.preventDefault();
        if (selezione.tipo !== "nessuna" || altri) {
          const cosa = selezione.tipo === "fiore" ? selezione.cosa : null;
          chiudi();
          // il fuoco torna sulla cosa da cui il fiore si era aperto
          if (cosa) setTimeout(() => document.querySelector<HTMLButtonElement>(`.baccello[data-chiave="cosa:${CSS.escape(cosa)}"]`)?.focus(), 0);
        } else if (turno) setPannello("pausa");
        return;
      }
      if (e.key === " " && !suPulsante) {
        e.preventDefault();
        setCompleta((n) => n + 1);
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
  }, [modello, selezione, altri, gioca, chiudi, scegli, pannello, domanda, turno, apriSalvataggi, schermoIntero]);

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

  const [cartello, chiudiCartello] = useCartelloAtto(turno?.stato.atto);
  const clima = turno ? climaDi(turno.stato) : null;
  const forma = clima?.forma ?? "acciaio";
  const stile = (clima ? variabiliCss(tavolozza(clima), turno!.stato.aria) : {}) as CSSProperties;
  const inMano = selezione.tipo === "inMano";
  const ultima = diario[diario.length - 1];
  const aria = turno?.stato.mostra.aria ? turno.stato.aria : null;
  // il bordo del visore respira al ritmo del fiato, che accelera quando l'aria scende
  const respiro = aria === null ? 4.4 : aria >= 60 ? 4.4 : aria >= 30 ? 3.4 : aria > 15 ? 2.2 : 6.4;
  const inDialogo = modello?.fase === "dialogo" && !!turno?.stato.dialogo;
  // la conferma che chiede il motore (fase «conferma»): Sì e No dai suoi pulsanti
  const domandaDelMotore: Domanda | null =
    modello?.fase === "conferma" && turno
      ? {
          testo: turno.eventi.filter((e) => e.tipo === "domanda").map((e) => e.testo).join(" ") || "Confermi?",
          si: modello.scelte.find((s) => s.tasto === "s")?.etichetta ?? "Sì",
          no: modello.scelte.find((s) => s.tasto === "n")?.etichetta ?? "No",
          allora: () => gioca(modello.scelte.find((s) => s.tasto === "s")?.comando ?? "sì", "sì"),
          altrimenti: () => gioca(modello.scelte.find((s) => s.tasto === "n")?.comando ?? "no", "no"),
        }
      : null;

  return (
    <div
      className="schermo tema gioco"
      style={stile}
      data-forma={forma}
      data-atmosfera={clima?.atmosfera ?? "santamaria"}
      data-protezione={clima?.protezione ? "" : undefined}
      data-ipossia={clima?.ipossia ? "" : undefined}
      data-in-mano={inMano ? "" : undefined}
      {...attributiSchermo(opzioni, ridotto)}
    >
      {clima && <Vene clima={clima} energia={turno?.stato.energia === "ripristinata"} ridotto={ridotto} crescita={crescita} />}
      <main className="palco" aria-label="Il Relitto Silente" ref={palcoRef} onClick={() => (selezione.tipo !== "nessuna" || altri) && chiudi()}>
        <div className="esplorazione" aria-hidden={inDialogo || !!pannello || !!domanda ? true : undefined}>
          {turno && (
            <div className="atto" aria-label={`Atto ${turno.stato.atto}: ${turno.stato.titolo_atto}`}>
              Atto {["I", "II", "III", "IV", "V"][turno.stato.atto - 1]} · {turno.stato.titolo_atto.toLowerCase()}
            </div>
          )}
          {turno && (
            <nav className="comandi-app" aria-label="Diario e menu">
              <button type="button" onClick={() => setPannello("diario")}>
                diario <span className="tasto">D</span>
              </button>
              <button type="button" onClick={() => setPannello("pausa")}>
                menu <span className="tasto">Esc</span>
              </button>
            </nav>
          )}
          <Lamina
            diario={diario}
            forma={forma}
            rivelazione={opzioni.rivelazione && !ridotto}
            completa={completa}
            suNome={suNome}
            suSuggerimento={suSuggerimento}
          />
          {modello && turno && !inDialogo && modello.fase !== "conferma" && (
            <Ramo
              modello={modello}
              cose={turno.cose}
              forma={forma}
              selezione={selezione}
              accesi={accesi}
              costi={costi.current}
              palco={palco}
              azione={azione}
              altri={altri}
              canaliChiusi={clima?.protezione}
              apriAltri={(filo, gruppo) => {
                setSelezione(NESSUNA);
                setAltri({ filo, gruppo });
              }}
            />
          )}
          {turno && clima && <Visore turno={turno} clima={clima} ridotto={ridotto} differenza={ultima?.differenza ?? null} battito={ultima?.chiave ?? 0} />}
        </div>
        {inDialogo && modello && turno && ultima && (
          <Dialogo personaggio={turno.stato.dialogo!} blocchi={ultima.blocchi} detto={ultima.comando && ultima.comando !== turno.comando?.testo ? ultima.comando : null} scelte={modello.scelte} forma={forma} ridotto={ridotto} scegli={scegli} />
        )}
        {aria !== null && <div className="vetro" style={{ ["--respiro" as string]: `${respiro}s` }} aria-hidden="true" />}
        {clima?.protezione && (
          <div className="velo-protezione" role="status">
            protezione vitale · canali secondari chiusi
          </div>
        )}
        {clima?.ipossia && <div className="ipossia-velo" aria-hidden="true" />}
        {cartello !== null && turno && <CartelloAtto atto={cartello} titolo={turno.stato.titolo_atto} acciaio={forma === "acciaio"} chiudi={chiudiCartello} />}

        {pannello === "pausa" && (
          <Pausa
            forma={forma}
            voci={{
              riprendi: () => setPannello(null),
              diario: () => setPannello("diario"),
              salva: () => void apriSalvataggi("salva"),
              carica: () => void apriSalvataggi("carica"),
              annulla: turno && turno.stato.turno > 0 ? () => (setPannello(null), gioca("annulla", "annulla l’ultima mossa")) : null,
              opzioni: () => setPannello("opzioni"),
              ricomincia: () =>
                setDomanda({ testo: "Ricominciare da capo?", sotto: "La partita in corso si perde, se non l’hai salvata.", si: "Ricomincia", no: "Torna al gioco", allora: ricomincia }),
              misure: () => (location.search = "?prova"),
            }}
          />
        )}
        {(pannello === "salva" || pannello === "carica") && (
          <Salvataggi
            modo={pannello}
            forma={forma}
            posti={posti}
            dove={dove}
            chiudi={() => setPannello(null)}
            scegli={(p) => {
              if (pannello === "carica") {
                setPannello(null);
                void caricaDa(p.posto);
                return;
              }
              const salva = () => {
                ultimoPosto.current = p.posto;
                setPannello(null);
                void salvaNel(p.posto);
              };
              if (p.presente) setDomanda({ testo: `Sovrascrivere il posto ${p.posto}?`, si: "Sovrascrivi", no: "Lascia stare", allora: salva });
              else salva();
            }}
          />
        )}
        {pannello === "diario" && (
          <Diario
            forma={forma}
            apertura={aperturaDiario}
            cronaca={cronaca}
            verbi={verbi}
            pagina={paginaDiario}
            sceglie={setPaginaDiario}
            chiudi={() => setPannello(null)}
          />
        )}
        {pannello === "opzioni" && <PannelloOpzioni forma={forma} opzioni={opzioni} cambia={cambiaOpzioni} chiudi={() => setPannello("pausa")} />}
        {(domanda ?? domandaDelMotore) && <Conferma domanda={(domanda ?? domandaDelMotore)!} forma={forma} chiudi={() => setDomanda(null)} />}
        {avviso && <Avviso testo={avviso.testo} grave={avviso.grave} />}
        {!turno && !errore && <div className="avvio">{passo}</div>}
        {errore && <pre className="avvio errore">{errore}</pre>}
      </main>
    </div>
  );
}
