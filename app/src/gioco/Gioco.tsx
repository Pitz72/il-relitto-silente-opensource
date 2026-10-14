// ============================================================================
//  Lo schermo del gioco (06-app-desktop.md, §4 e §4.7; stile C, «Membrana»).
//  Il motore vero in Pyodide; il modello d'azione fa i menu; la grammatica
//  tipografica veste il testo; le atmosfere seguono lo stato del gioco.
// ============================================================================
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { caricaMotore, type Motore } from "../motore/runtime";
import type { Turno } from "../motore/tipi";
import { comandiDelModello, costruisciModello, type ModelloAzione } from "../azione/modello";
import { AZIONI_DI_SITUAZIONE } from "../azione/situazione";
import { climaDi, tavolozza, variabiliCss } from "../stile/atmosfere";
import { attributiSchermo, useMovimentoRidotto, useOpzioni } from "../stile/opzioni";
import { blocchiDelTurno, segnaNomi, type Blocco } from "./lamina/grammatica";
import Lamina, { type VoceDiario } from "./lamina/Lamina";
import "../stile/base.css";
import "./gioco.css";

// Un solo motore per pagina, anche quando React (StrictMode) monta due volte.
let caricamento: ReturnType<typeof caricaMotore> | null = null;

const ARTICOLO = /^(?:il|lo|la|i|gli|le|l['’]|un|uno|una|dei|degli|delle)\s*/i;

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
  const [errore, setErrore] = useState<string | null>(null);
  const [passo, setPasso] = useState("Avvio…");
  const [turno, setTurno] = useState<Turno | null>(null);
  const [diario, setDiario] = useState<VoceDiario[]>([]);
  const [completa, setCompleta] = useState(0);
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

  // ---- un comando ------------------------------------------------------------
  const gioca = useCallback(
    (comando: string, comeSiLegge?: string) => {
      const m = motoreRef.current;
      if (!m) return;
      const t = m.comando(comando);
      const mod = costruisciModello(t);
      setTurno(t);
      setDiario((d) => [
        ...d.slice(-40),
        { chiave: contatore.current++, comando: comeSiLegge ?? comando, differenza: differenzaAria(t), blocchi: blocchiDi(t, mod, opzioni.nomiToccabili) },
      ]);
    },
    [opzioni.nomiToccabili],
  );

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

  // Spazio completa il testo (quando non si è sopra un pulsante)
  useEffect(() => {
    const giu = (e: KeyboardEvent) => {
      if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        setCompleta((n) => n + 1);
      }
    };
    addEventListener("keydown", giu);
    return () => removeEventListener("keydown", giu);
  }, []);

  const clima = turno ? climaDi(turno.stato) : null;
  const stile = (clima ? variabiliCss(tavolozza(clima), turno!.stato.aria) : {}) as CSSProperties;

  return (
    <div
      className="schermo tema gioco"
      style={stile}
      data-forma={clima?.forma ?? "acciaio"}
      data-atmosfera={clima?.atmosfera ?? "santamaria"}
      data-protezione={clima?.protezione ? "" : undefined}
      data-ipossia={clima?.ipossia ? "" : undefined}
      {...attributiSchermo(opzioni, ridotto)}
    >
      <main className="palco" aria-label="Il Relitto Silente">
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
          suSuggerimento={(i) => {
            const s = modello?.suggerimenti[i];
            if (s?.comando) gioca(s.comando);
          }}
        />
        {modello && <AzioniProvvisorie modello={modello} gioca={gioca} />}
        {!turno && !errore && <div className="avvio">{passo}</div>}
        {errore && <pre className="avvio errore">{errore}</pre>}
      </main>
    </div>
  );
}

/** Solo per il passo 2: i comandi del modello in fila. Il passo 3 li porta sul ramo. */
function AzioniProvvisorie({ modello, gioca }: { modello: ModelloAzione; gioca: (c: string, l?: string) => void }) {
  const comandi = comandiDelModello(modello);
  return (
    <nav className="provvisorie" aria-label="Comandi (provvisori)">
      {modello.scelte.length
        ? modello.scelte.map((s) => (
            <button key={s.comando} onClick={() => gioca(s.comando, s.etichetta)}>
              {s.etichetta}
            </button>
          ))
        : comandi.map((c) => (
            <button key={c} onClick={() => gioca(c)}>
              {c}
            </button>
          ))}
    </nav>
  );
}
