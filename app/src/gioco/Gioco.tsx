// ============================================================================
//  Lo schermo del gioco (06-app-desktop.md, §4 e §4.7; stile C, «Membrana»).
//  Il motore vero in Pyodide; il modello d'azione fa i menu; la grammatica
//  tipografica veste il testo; le atmosfere seguono lo stato del gioco.
// ============================================================================
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { caricaMotore, type Motore } from "../motore/runtime";
import type { Turno } from "../motore/tipi";
import { costruisciModello, type ModelloAzione } from "../azione/modello";
import { AZIONI_DI_SITUAZIONE } from "../azione/situazione";
import { climaDi, tavolozza, variabiliCss } from "../stile/atmosfere";
import { attributiSchermo, useMovimentoRidotto, useOpzioni } from "../stile/opzioni";
import { blocchiDelTurno, segnaNomi, type Blocco } from "./lamina/grammatica";
import Lamina, { type VoceDiario } from "./lamina/Lamina";
import Ramo from "./ramo/Ramo";
import { accesiDa, attrezzoDelVerbo, bersagli, NESSUNA, type Azione, type Selezione } from "./ramo/azioni";
import type { Filo } from "./ramo/geometria";
import Visore, { CartelloAtto, useCartelloAtto } from "./visore/Visore";
import "../stile/base.css";
import "./gioco.css";

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

export default function Gioco() {
  const [opzioni] = useOpzioni();
  const ridotto = useMovimentoRidotto(opzioni.movimento);
  const motoreRef = useRef<Motore | null>(null);
  const palcoRef = useRef<HTMLElement>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [passo, setPasso] = useState("Avvio…");
  const [turno, setTurno] = useState<Turno | null>(null);
  const [diario, setDiario] = useState<VoceDiario[]>([]);
  const [completa, setCompleta] = useState(0);
  const [selezione, setSelezione] = useState<Selezione>(NESSUNA);
  const [altri, setAltri] = useState<{ filo: Filo; gruppo: string } | null>(null);
  const [accesi, setAccesi] = useState<ReadonlySet<string>>(new Set());
  const [palco, setPalco] = useState({ W: 0, H: 0 });
  const costi = useRef(new Map<string, number>());
  const contatore = useRef(0);

  const modello = useMemo(() => (turno ? costruisciModello(turno) : null), [turno]);

  // ---- l'avvio --------------------------------------------------------------
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        caricamento ??= caricaMotore(setPasso);
        const { motore } = await caricamento;
        if (!vivo) return;
        motoreRef.current = motore;
        const primo = motore.avvia(1);
        const m = costruisciModello(primo);
        setTurno(primo);
        setDiario([
          // il prologo resta sopra la prima stanza, spento: l'intro finisce lì
          { chiave: contatore.current++, comando: null, differenza: null, blocchi: blocchiDelTurno(primo.apertura ?? []) },
          { chiave: contatore.current++, comando: null, differenza: null, blocchi: blocchiDi(primo, m, opzioni.nomiToccabili) },
        ]);
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

  // ---- un comando ------------------------------------------------------------
  const gioca = useCallback(
    (comando: string, comeSiLegge?: string) => {
      const m = motoreRef.current;
      if (!m) return;
      const t = m.comando(comando);
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
    },
    [opzioni.nomiToccabili],
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

  const azione = useCallback(
    (a: Azione) => {
      if (a.tipo === "comando") gioca(a.comando, a.comeSiLegge);
      else if (a.tipo === "chiudi") chiudi();
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
    [gioca, chiudi, modello],
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

  // ---- la tastiera (§6.2) ----------------------------------------------------
  useEffect(() => {
    const giu = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const suPulsante = e.target instanceof HTMLButtonElement;
      if (e.key === "Escape") {
        if (selezione.tipo !== "nessuna" || altri) {
          e.preventDefault();
          const cosa = selezione.tipo === "fiore" ? selezione.cosa : null;
          chiudi();
          // il fuoco torna sulla cosa da cui il fiore si era aperto
          if (cosa) setTimeout(() => document.querySelector<HTMLButtonElement>(`.baccello[data-chiave="cosa:${CSS.escape(cosa)}"]`)?.focus(), 0);
        }
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
        gioca(scelta.comando, scelta.etichetta);
      }
    };
    addEventListener("keydown", giu);
    return () => removeEventListener("keydown", giu);
  }, [modello, selezione, altri, gioca, chiudi]);

  // Solo nello sviluppo: un percorso di collaudo giocato fino a un passo, per
  // guardare lo schermo in un punto preciso della partita (le prove della fase 3).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as Record<string, unknown>).__gioco = {
      gioca,
      percorso: (nome: string, fino = Infinity) => {
        const m = motoreRef.current;
        if (!m) return "il motore non è pronto";
        const p = m.percorso(nome);
        const primo = m.avvia(1);
        const mod = costruisciModello(primo);
        setTurno(primo);
        setDiario([{ chiave: contatore.current++, comando: null, differenza: null, blocchi: blocchiDi(primo, mod, opzioni.nomiToccabili) }]);
        let n = 0;
        for (const c of p.comandi.slice(0, fino)) {
          gioca(c);
          n++;
        }
        return `${nome}: ${n} comandi`;
      },
    };
  }, [gioca, opzioni.nomiToccabili]);

  const [cartello, chiudiCartello] = useCartelloAtto(turno?.stato.atto);
  const clima = turno ? climaDi(turno.stato) : null;
  const stile = (clima ? variabiliCss(tavolozza(clima), turno!.stato.aria) : {}) as CSSProperties;
  const inMano = selezione.tipo === "inMano";
  const ultima = diario[diario.length - 1];
  const aria = turno?.stato.mostra.aria ? turno.stato.aria : null;
  // il bordo del visore respira al ritmo del fiato, che accelera quando l'aria scende
  const respiro = aria === null ? 4.4 : aria >= 60 ? 4.4 : aria >= 30 ? 3.4 : aria > 15 ? 2.2 : 6.4;

  return (
    <div
      className="schermo tema gioco"
      style={stile}
      data-forma={clima?.forma ?? "acciaio"}
      data-atmosfera={clima?.atmosfera ?? "santamaria"}
      data-protezione={clima?.protezione ? "" : undefined}
      data-ipossia={clima?.ipossia ? "" : undefined}
      data-in-mano={inMano ? "" : undefined}
      {...attributiSchermo(opzioni, ridotto)}
    >
      <main className="palco" aria-label="Il Relitto Silente" ref={palcoRef} onClick={() => (selezione.tipo !== "nessuna" || altri) && chiudi()}>
        {turno && (
          <div className="atto" aria-label={`Atto ${turno.stato.atto}: ${turno.stato.titolo_atto}`}>
            Atto {["I", "II", "III", "IV", "V"][turno.stato.atto - 1]} · {turno.stato.titolo_atto.toLowerCase()}
          </div>
        )}
        <Lamina
          diario={diario}
          forma={clima?.forma ?? "acciaio"}
          rivelazione={opzioni.rivelazione && !ridotto}
          completa={completa}
          suNome={suNome}
          suSuggerimento={suSuggerimento}
        />
        {modello && turno && (
          <Ramo
            modello={modello}
            cose={turno.cose}
            forma={clima?.forma ?? "acciaio"}
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
        {turno && clima && (
          <Visore turno={turno} clima={clima} ridotto={ridotto} differenza={ultima?.differenza ?? null} battito={ultima?.chiave ?? 0} />
        )}
        {aria !== null && <div className="vetro" style={{ ["--respiro" as string]: `${respiro}s` }} aria-hidden="true" />}
        {clima?.protezione && (
          <div className="velo-protezione" role="status">
            protezione vitale · canali secondari chiusi
          </div>
        )}
        {clima?.ipossia && <div className="ipossia-velo" aria-hidden="true" />}
        {cartello !== null && turno && (
          <CartelloAtto atto={cartello} titolo={turno.stato.titolo_atto} acciaio={clima?.forma === "acciaio"} chiudi={chiudiCartello} />
        )}
        {!turno && !errore && <div className="avvio">{passo}</div>}
        {errore && <pre className="avvio errore">{errore}</pre>}
      </main>
    </div>
  );
}
