// ============================================================================
//  La lamina del testo (06-app-desktop.md, §4.1 e §4.7; 06-proposta-membrana).
//  Il turno corrente in basso, pieno; quelli di prima sopra, piccoli e spenti
//  (si rileggono nel diario). Il comando dato sopra la risposta, piccolo. La
//  risposta appare a righe, rapida; un clic o Spazio la completano; si spegne
//  nelle opzioni. Nell'acciaio è il registro di bordo; nella membrana una
//  lamina dai bordi irregolari che respira, solo ai bordi.
//  I blocchi arrivano già riconosciuti (grammatica.ts): qui li si veste.
// ============================================================================
import { createContext, Fragment, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Forma } from "../../stile/atmosfere";
import type { Blocco, RigaRegistrazione, Segmento } from "./grammatica";
import "./lamina.css";

export interface VoceDiario {
  /** unica nella partita: la chiave per React */
  chiave: number;
  /** il comando dato, come si scriverebbe («stacca il risuonatore»); null all'inizio */
  comando: string | null;
  /** quanta aria è costato il turno (−2), se la cifra è cambiata */
  differenza: number | null;
  blocchi: Blocco[];
}

interface Props {
  diario: readonly VoceDiario[];
  forma: Forma;
  /** la rivelazione a righe (l'opzione, e mai con il movimento ridotto) */
  rivelazione: boolean;
  /** quanti turni di prima restano visibili sopra quello corrente */
  passati?: number;
  /** un nome toccato nel testo (D15): apre il menu della cosa */
  suNome?: (cosa: string, ancora: HTMLElement) => void;
  /** un suggerimento toccato: il suo indice fra quelli del modello */
  suSuggerimento?: (indice: number, ancora: HTMLElement) => void;
  /** chiede di completare la rivelazione da fuori (Spazio): cambia il numero */
  completa?: number;
}

/** Quanto dura una riga della rivelazione, e la pausa fra un blocco e l'altro. */
const PER_RIGA = 62;
const FRA_BLOCCHI = 90;

export default function Lamina({ diario, forma, rivelazione, passati = 2, suNome, suSuggerimento, completa = 0 }: Props) {
  const scorreRef = useRef<HTMLDivElement>(null);
  const attualeRef = useRef<HTMLDivElement>(null);
  const [rivelata, setRivelata] = useState(true);
  const [altro, setAltro] = useState(false);
  const ultimo = diario[diario.length - 1];
  const prima = diario.slice(Math.max(0, diario.length - 1 - passati), -1);

  // un turno nuovo: le righe di ogni blocco, i ritardi, poi il testo intero
  useLayoutEffect(() => {
    const el = attualeRef.current;
    const scorre = scorreRef.current;
    if (!el || !scorre || !ultimo) return;
    // la risposta comincia in vista: se non ci sta, si legge dall'alto
    const inizio = el.offsetTop - 12;
    const fondo = scorre.scrollHeight - scorre.clientHeight;
    scorre.scrollTop = el.offsetHeight > scorre.clientHeight - 24 ? inizio : fondo;
    if (!rivelazione) {
      setRivelata(true);
      return;
    }
    let ritardo = 0;
    for (const b of el.querySelectorAll<HTMLElement>("[data-riv]")) {
      const st = getComputedStyle(b);
      const riga = parseFloat(st.lineHeight) || 26;
      const alto = b.offsetHeight - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom);
      const righe = Math.max(1, Math.round(alto / riga));
      b.style.setProperty("--righe", String(righe));
      b.style.setProperty("--ritardo", `${ritardo}ms`);
      b.style.setProperty("--durata", `${righe * PER_RIGA}ms`);
      ritardo += righe * PER_RIGA + FRA_BLOCCHI;
    }
    setRivelata(false);
    const t = setTimeout(() => setRivelata(true), ritardo + 40);
    return () => clearTimeout(t);
  }, [ultimo?.chiave, rivelazione]); // eslint-disable-line react-hooks/exhaustive-deps

  // Spazio, da fuori: completa
  useEffect(() => {
    if (completa) setRivelata(true);
  }, [completa]);

  // c'è altro sotto? (la freccia «continua»)
  const misura = useCallback(() => {
    const s = scorreRef.current;
    if (s) setAltro(s.scrollHeight - s.scrollTop - s.clientHeight > 6);
  }, []);
  useLayoutEffect(misura, [ultimo?.chiave, misura]);

  const clic = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    const nome = t.closest<HTMLElement>("[data-cosa]");
    if (nome && suNome) {
      e.stopPropagation();
      setRivelata(true);
      suNome(nome.dataset.cosa!, nome);
      return;
    }
    if (!rivelata) setRivelata(true);
  };

  return (
    <div className={`lamina${altro ? " con-altro" : ""}`} data-forma={forma} onClick={clic}>
      {forma === "acciaio" && (
        <div className="lamina-targa" aria-hidden="true">
          TSC-1972 · registro di bordo
        </div>
      )}
      <div className="lamina-scorre" ref={scorreRef} onScroll={misura}>
        <div className="lamina-colonna">
          {prima.map((v, i) => (
            <div key={v.chiave} className="turno passato" style={{ opacity: 0.42 - (prima.length - 1 - i) * 0.14 }} aria-hidden="true">
              <Turno voce={v} forma={forma} />
            </div>
          ))}
          <div ref={attualeRef} className={`turno attuale ${rivelata ? "rivelato" : "in-rivelazione"}`} aria-live="polite" aria-atomic="false">
            {ultimo && <Turno key={ultimo.chiave} voce={ultimo} forma={forma} suSuggerimento={suSuggerimento} rivela />}
          </div>
        </div>
      </div>
      {altro && (
        <button
          className="lamina-continua"
          onClick={(e) => {
            e.stopPropagation();
            const s = scorreRef.current!;
            s.scrollBy({ top: s.clientHeight * 0.8, behavior: "smooth" });
          }}
        >
          continua <span aria-hidden="true">↓</span>
        </button>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
//  Un turno: il comando, poi i blocchi
// ----------------------------------------------------------------------------
/** Dentro un testo inerte (il diario) i suggerimenti non sono pulsanti: si
 *  leggono accesi come nella lamina, ma il loro momento è passato. */
const Inerte = createContext(false);
export function TestoInerte({ children }: { children: ReactNode }) {
  return <Inerte.Provider value={true}>{children}</Inerte.Provider>;
}

export function Turno({ voce, forma, suSuggerimento, rivela = false }: { voce: VoceDiario; forma: Forma; suSuggerimento?: Props["suSuggerimento"]; rivela?: boolean }) {
  const riv = rivela ? { "data-riv": "" } : {};
  return (
    <>
      {(voce.comando || voce.differenza) && (
        <div className="comando" {...riv}>
          <span className="solo-lettori">Hai scelto: </span>
          {voce.comando ? <span className="comando-testo">› {forma === "acciaio" ? voce.comando.toUpperCase() : voce.comando}</span> : null}
          {voce.differenza ? (
            <span className="comando-aria" aria-label={`aria ${voce.differenza}`}>
              {voce.differenza > 0 ? `+${voce.differenza}` : `−${Math.abs(voce.differenza)}`}
            </span>
          ) : null}
        </div>
      )}
      {raggruppa(voce.blocchi).map((g, i) =>
        g.fine !== undefined ? (
          <div key={i} className={`fine fine-${g.fine}`}>
            {g.blocchi.map((b, j) => (
              <VistaBlocco key={j} b={b} riv={riv} suSuggerimento={suSuggerimento} />
            ))}
          </div>
        ) : (
          <Fragment key={i}>
            {g.blocchi.map((b, j) => (
              <VistaBlocco key={j} b={b} riv={riv} suSuggerimento={suSuggerimento} />
            ))}
          </Fragment>
        ),
      )}
    </>
  );
}

/** I blocchi di un finale stanno insieme, nella loro cornice. */
function raggruppa(blocchi: readonly Blocco[]): { fine?: string; blocchi: Blocco[] }[] {
  const out: { fine?: string; blocchi: Blocco[] }[] = [];
  for (const b of blocchi) {
    const g = out[out.length - 1];
    if (g && g.fine === b.fine) g.blocchi.push(b);
    else out.push({ fine: b.fine, blocchi: [b] });
  }
  return out;
}

// ----------------------------------------------------------------------------
//  Un blocco
// ----------------------------------------------------------------------------
function VistaBlocco({ b, riv, suSuggerimento }: { b: Blocco; riv: object; suSuggerimento?: Props["suSuggerimento"] }) {
  // una voce che continua la riga della narrazione resta attaccata a lei
  const classi = (tipo: string) => `b-${tipo}${b.stacco || b.vuote ? " stacco" : ""}${!b.aCapo ? " stessa-riga" : ""}`;
  switch (b.tipo) {
    case "stanza":
      return (
        <div className={classi("stanza")} {...riv}>
          <h2>{b.nome}</h2>
          <div className="vena-titolo" aria-hidden="true" />
        </div>
      );
    case "paragrafo":
      return (
        <p className={classi("paragrafo")} {...riv}>
          <Segmenti s={b.segmenti} suSuggerimento={suSuggerimento} />
        </p>
      );
    case "lettura":
      return (
        <p className={classi("lettura")} {...riv}>
          <Segmenti s={b.segmenti} suSuggerimento={suSuggerimento} />
        </p>
      );
    case "voce":
      return (
        <blockquote className={classi("voce")} {...riv}>
          <span className="chi">{b.chi}</span>
          {b.inciso && <span className="inciso">{b.inciso}</span>}
          <span className="detto">
            <Segmenti s={b.segmenti} suSuggerimento={suSuggerimento} />
          </span>
          <span className="solo-lettori">{` (${b.etichetta.trim()})`}</span>
        </blockquote>
      );
    case "registrazione":
      return (
        <div className={classi("registrazione")} {...riv}>
          {b.righe.map((r, i) => (
            <RigaDellaTraccia key={i} r={r} />
          ))}
        </div>
      );
    case "dialogo":
      return (
        <p className={classi("dialogo")} {...riv}>
          <span className="chi">{b.chi}</span> <Segmenti s={b.segmenti} suSuggerimento={suSuggerimento} />
        </p>
      );
    case "registro":
      return (
        <p className={classi("registro")} {...riv}>
          <Segmenti s={b.segmenti} suSuggerimento={suSuggerimento} />
        </p>
      );
    case "sistema":
      return (
        <p className={classi("sistema")} {...riv}>
          {b.testo}
        </p>
      );
  }
}

function RigaDellaTraccia({ r }: { r: RigaRegistrazione }) {
  if (r.tipo === "buco")
    return (
      <span className={`traccia-buco${r.vuote ? " stacco" : ""}`}>
        <span className="buco-segno" aria-hidden="true" />
        <span className="buco-testo">{r.testo}</span>
        <span className="buco-segno" aria-hidden="true" />
      </span>
    );
  return <span className={`traccia-${r.tipo}${r.vuote ? " stacco" : ""}`}>{r.testo}</span>;
}

// ----------------------------------------------------------------------------
//  I segmenti
// ----------------------------------------------------------------------------
function Segmenti({ s, suSuggerimento }: { s: readonly Segmento[]; suSuggerimento?: Props["suSuggerimento"] }) {
  const inerte = useContext(Inerte);
  const out: ReactNode[] = [];
  s.forEach((x, i) => {
    const att = x.attenuato ? " attenuato" : "";
    switch (x.tipo) {
      case "testo":
        out.push(x.attenuato ? <span key={i} className="attenuato">{x.testo}</span> : x.testo);
        break;
      case "suggerimento":
        if (inerte) {
          out.push(
            <span key={i} className={`s-suggerimento inerte${att}`}>
              {x.testo}
            </span>,
          );
          break;
        }
        out.push(
          <button
            key={i}
            type="button"
            className={`s-suggerimento${att}`}
            data-indice={x.suggerimento}
            disabled={(x.suggerimento ?? -1) < 0}
            onClick={(e) => {
              e.stopPropagation();
              if ((x.suggerimento ?? -1) >= 0) suSuggerimento?.(x.suggerimento!, e.currentTarget);
            }}
          >
            {x.testo}
          </button>,
        );
        break;
      case "nome":
        out.push(
          <span key={i} className="s-nome" data-cosa={x.cosa}>
            {x.testo}
          </span>,
        );
        break;
      default:
        out.push(
          <span key={i} className={`s-${x.tipo}${att}`}>
            {x.testo}
          </span>,
        );
    }
  });
  return <>{out}</>;
}
