// ============================================================================
//  Il visore (06-app-desktop.md, §4.3, §4.4, §4.7): la colonna di destra.
//  La lente (la telecamera di bordo sulla Santa Maria, il multiscanner nel
//  relitto), l'aria (un anello graduato nell'acciaio, una cellula che respira
//  nella membrana), i satelliti (la matrice, le voci, le chiavi), la mappa.
//  I contatori compaiono quando il ponte dice `mostra`: nessuno spiega niente
//  prima del tempo. Le forme si muovono, le cifre no; ogni stato è anche scritto.
//  Le viste delle stanze (revisione 25, E1): sulla Santa Maria la telecamera di
//  bordo, con le scene canoniche del sequel (lo scafo, la telecamera esterna,
//  composto in codice: strumenti/viste/scafo.py); nel relitto le scansioni del
//  multiscanner, disegnate in codice stanza per stanza (scansioni/).
// ============================================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { cicloA, FOTOGRAMMI } from "../ritmo";
import { romano } from "../../lib/italiano";
import type { Turno } from "../../motore/tipi";
import { statoAria, type Clima } from "../../stile/atmosfere";
import { generatore, glifo } from "../../intro/glifi";
import { costellazione } from "./mappa";
import Scansione, { haScansione } from "./scansioni/Scansione";
import type { StatiSuono } from "../../motore/tipi";
import "./visore.css";

interface Props {
  turno: Turno;
  clima: Clima;
  ridotto: boolean;
  /** quanta aria è costato l'ultimo turno (il segno che si dissolve vicino alla cifra) */
  differenza: number | null;
  /** cambia a ogni turno: fa ripartire il segno della differenza */
  battito: number;
}

const DI_BORDO = new Set(["plancia", "cuccetta", "sala macchine", "stiva", "scafo"]);
const TELECAMERE: Record<string, string> = { plancia: "cam 01", cuccetta: "cam 02", stiva: "cam 03", "sala macchine": "cam 04", scafo: "cam esterna" };
// le scene della Santa Maria (grafica/LICENZE.md): la stiva è la sua poppa, con il boccaporto e le tute (s_10 del
// sequel), perché la stiva del sequel ha pallet e casse e quella del Relitto è vuota da sei settimane (06, §17)
const IMMAGINI: Record<string, string> = {
  plancia: "./intro/plancia.webp",
  cuccetta: "./viste/cuccetta.webp",
  stiva: "./viste/stiva.webp",
  "sala macchine": "./viste/sala-macchine.webp",
  scafo: "./viste/scafo.webp",
};

export default function Visore({ turno, clima, ridotto, differenza, battito }: Props) {
  const s = turno.stato;
  const acciaio = clima.forma === "acciaio";
  const aria = s.mostra.aria ? s.aria : null;
  return (
    <aside className="visore" data-forma={clima.forma} aria-label="Il visore">
      <Lente stanza={s.stanza} nome={s.nome_stanza ?? s.stanza} stati={turno.suono.stati} clima={clima} ridotto={ridotto} />
      <div className="strumenti">
        {aria !== null ? (
          <Cellula aria={aria} acciaio={acciaio} protezione={clima.protezione} fuga={s.fuga === "iniziata"} ridotto={ridotto} differenza={differenza} battito={battito} />
        ) : (
          <StrumentiDiBordo scansione={turno.suono.stati.scansione} acciaio={acciaio} />
        )}
        <div className="satelliti">
          {s.mostra.matrice && <Matrice percento={s.traduzione ?? 0} protezione={clima.protezione} />}
          {s.mostra.voci && <Voci echi={s.echi ?? 0} risonanze={s.risonanze ?? 0} protezione={clima.protezione} />}
          {s.mostra.chiavi && <Chiavi chiavi={s.chiavi ?? 0} />}
        </div>
      </div>
      <Mappa turno={turno} acciaio={acciaio} />
    </aside>
  );
}

// ----------------------------------------------------------------------------
//  La lente: la telecamera di bordo, o la ricostruzione del multiscanner
// ----------------------------------------------------------------------------
function Lente({ stanza, nome, stati, clima, ridotto }: { stanza: string; nome: string; stati: StatiSuono; clima: Clima; ridotto: boolean }) {
  const diBordo = DI_BORDO.has(stanza);
  const immagine = diBordo ? IMMAGINI[stanza] : undefined;
  const didascalia = diBordo
    ? `${TELECAMERE[stanza] ?? "cam"} · ${nome.replace(/^(la|il|lo|l')\s*/i, "").toLowerCase()} · tsc-1972`
    : clima.ipossia
      ? "…"
      : clima.atmosfera === "fuga"
        ? "lettura instabile · struttura in cedimento"
        : clima.protezione
          ? "multiscanner · canali secondari chiusi"
          : "multiscanner · materiale non in archivio";
  return (
    <figure className="lente">
      <div className="lente-vetro">
        {immagine ? (
          <>
            {/* entrando in una stanza la telecamera cambia canale: un lampo di disturbo, la riga che
                rotola (documento 30, 2.1); poi la riga lenta del monitor */}
            <img key={stanza} src={immagine} alt={`La telecamera di bordo: ${nome}`} draggable={false} />
            {!ridotto && <div key={`canale:${stanza}`} className="cambio-canale" aria-hidden="true" />}
            <div className="monitor" aria-hidden="true" />
          </>
        ) : !diBordo && haScansione(stanza) ? (
          <Scansione stanza={stanza} stati={stati} clima={clima} ridotto={ridotto} />
        ) : (
          <Ricostruzione stanza={stanza} diBordo={diBordo} clima={clima} ridotto={ridotto} />
        )}
      </div>
      <figcaption>
        {/* la spia della registrazione, sulla telecamera di bordo (documento 30, 2.5) */}
        {diBordo && <span className="rec" aria-hidden="true" />}
        {didascalia}
      </figcaption>
    </figure>
  );
}

/** I punti della ricostruzione: un pavimento e una cupola, diversi per ogni stanza. */
function puntiDi(stanza: string) {
  let seme = 7;
  for (const c of stanza) seme = (seme * 31 + c.charCodeAt(0)) % 2147483647;
  const r = generatore(seme || 3);
  const larga = 0.36 + r() * 0.12;
  const alta = 0.45 + r() * 0.25;
  const p: [number, number, number, number][] = [];
  for (let i = 0; i < 1100; i++) {
    const t = r() * 6.28;
    const q = Math.sqrt(r());
    p.push([0.5 + Math.cos(t) * q * larga, 0.74 + Math.sin(t) * q * 0.13, r(), 0]);
  }
  for (let i = 0; i < 1300; i++) {
    const t = Math.PI + r() * Math.PI;
    const h = r();
    p.push([0.5 + Math.cos(t) * (larga + 0.04) * (1 - h * 0.15), 0.74 - h * alta + Math.sin(t) * 0.1 * (1 - h), r(), 1]);
  }
  return p;
}

function Ricostruzione({ stanza, diBordo, clima, ridotto }: { stanza: string; diBordo: boolean; clima: Clima; ridotto: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const punti = useMemo(() => puntiDi(stanza), [stanza]);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    // i colori del clima, letti una volta (il ciclo si rifà quando il clima cambia; revisione 25, M10)
    const st = getComputedStyle(cv);
    const c1 = st.getPropertyValue("--vena").trim() || "#5fd4dc";
    const c2 = st.getPropertyValue("--vena-2").trim() || "#8bf0a2";
    const disegna = (t: number) => {
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      const s = devicePixelRatio || 1;
      if (cv.width !== Math.round(w * s)) {
        cv.width = Math.round(w * s);
        cv.height = Math.round(h * s);
      }
      g.setTransform(s, 0, 0, s, 0, 0);
      g.fillStyle = "#020505";
      g.fillRect(0, 0, w, h);
      if (diBordo) {
        // una telecamera senza immagine (fase 5): la grana del sensore, ferma
        const r = generatore(Math.floor(t / 120) + 1);
        g.globalAlpha = 0.18;
        g.fillStyle = "#cfc6b6";
        for (let i = 0; i < 900; i++) g.fillRect(r() * w, r() * h, 1, 1);
        g.globalAlpha = 1;
        return;
      }
      const onda = ((t / 3800) % 1.3) - 0.15;
      const instabile = clima.atmosfera === "fuga" || clima.ipossia;
      for (const [x0, y0, z, k] of punti) {
        let x = x0 * w;
        let y = y0 * h;
        const d = Math.hypot(x0 - 0.5, (y0 - 0.6) * 2);
        const vicino = !ridotto && Math.abs(d - onda) < 0.04;
        if (instabile && !ridotto) {
          x += Math.sin(t / 80 + z * 50) * 1.3;
          y += Math.cos(t / 95 + z * 40);
        }
        g.globalAlpha = (0.25 + z * 0.4) * (vicino ? 2.6 : 1) * (clima.protezione ? 0.45 : 1);
        g.fillStyle = vicino ? c2 : c1;
        g.fillRect(x, y, k ? 1.3 : 1.05, k ? 1.3 : 1.05);
      }
      g.globalAlpha = 1;
    };
    if (ridotto) {
      disegna(0);
      return;
    }
    disegna(performance.now());
    return cicloA(FOTOGRAMMI, disegna);
  }, [punti, diBordo, clima.atmosfera, clima.protezione, clima.ipossia, ridotto]);
  return <canvas ref={ref} aria-label={diBordo ? "Telecamera di bordo: nessuna immagine" : "Ricostruzione del multiscanner"} role="img" />;
}

// ----------------------------------------------------------------------------
//  L'aria: un anello graduato nell'acciaio, una cellula nella membrana
// ----------------------------------------------------------------------------
const SCRITTA: Record<ReturnType<typeof statoAria>, string> = { assente: "", regolare: "aria", ambra: "aria", rosso: "protezione vitale", ipossia: "ipossia" };

function formaCellula(R: number, amp: number, t: number, respiro: number) {
  let d = "";
  for (let k = 0; k <= 72; k++) {
    const a = (k / 72) * Math.PI * 2;
    const r = R * respiro * (1 + amp * (Math.sin(3 * a + t / 900) * 0.6 + Math.sin(5 * a - t / 1300) * 0.4));
    d += (k ? "L" : "M") + (Math.cos(a) * r).toFixed(1) + " " + (Math.sin(a) * r).toFixed(1);
  }
  return d + "Z";
}

function Cellula({ aria, acciaio, protezione, fuga, ridotto, differenza, battito }: { aria: number; acciaio: boolean; protezione: boolean; fuga: boolean; ridotto: boolean; differenza: number | null; battito: number }) {
  const stato = statoAria(aria);
  const scritta = protezione || fuga ? SCRITTA[stato] : stato === "rosso" ? "aria" : SCRITTA[stato];
  const corpo = useRef<SVGSVGElement>(null);
  const esterno = useRef<SVGPathElement>(null);
  const interno = useRef<SVGPathElement>(null);
  const spore = useRef<SVGGElement>(null);
  // il respiro: più rapido quando l'aria scende, irregolare nell'ipossia
  const periodo = aria >= 60 ? 4400 : aria >= 30 ? 3400 : aria > 15 ? 2200 : 6400;
  const contrazione = aria < 30 && !fuga ? 0.82 : 1;
  const amp = aria <= 15 ? 0.09 : aria < 30 ? 0.07 : 0.045;
  useEffect(() => {
    if (acciaio) return;
    const disegna = (t: number) => {
      const irregolare = aria <= 15 ? Math.sin(t / 700) * 0.4 + Math.sin(t / 233) * 0.2 : 0;
      const respiro = ridotto ? 1 : 1 + 0.045 * Math.sin((t / periodo) * Math.PI * 2 + irregolare);
      const tt = ridotto ? 0 : t;
      esterno.current?.setAttribute("d", formaCellula(62 * contrazione, amp, tt, respiro));
      interno.current?.setAttribute("d", formaCellula(46 * contrazione, amp * 1.6, tt + 4000, respiro));
      spore.current?.querySelectorAll("circle").forEach((c, k) => {
        const a = k * 0.9 + tt / 9000;
        const rr = 30 * contrazione + (k % 3) * 7;
        c.setAttribute("cx", (Math.cos(a) * rr).toFixed(1));
        c.setAttribute("cy", (Math.sin(a) * rr).toFixed(1));
      });
    };
    disegna(0);
    if (ridotto) return;
    return cicloA(FOTOGRAMMI, disegna);
  }, [acciaio, aria, periodo, contrazione, amp, ridotto]);

  // a ogni consumo la cellula (o l'anello) si contrae, come un sorso; con una ricarica si allarga
  // (documento 30, 2.2): una forma che si muove, mai la cifra
  useEffect(() => {
    const el = corpo.current;
    if (ridotto || !differenza || !el?.animate) return;
    const sorso = differenza < 0;
    const forte = Math.min(1, Math.abs(differenza) / 8);
    el.animate(
      sorso
        ? [{ transform: "scale(1)" }, { transform: `scale(${(0.965 - 0.035 * forte).toFixed(3)})`, offset: 0.22 }, { transform: "scale(1)" }]
        : [{ transform: "scale(1)" }, { transform: "scale(1.07)", offset: 0.3 }, { transform: "scale(1)" }],
      { duration: sorso ? 760 : 1200, easing: "cubic-bezier(.3, .7, .3, 1)" },
    );
  }, [battito]); // eslint-disable-line react-hooks/exhaustive-deps

  const C = 2 * Math.PI * 56;
  return (
    <div className={`cellula stato-${stato}`} role="img" aria-label={`Aria ${aria}${scritta && scritta !== "aria" ? `, ${scritta}` : ""}`}>
      <svg ref={corpo} viewBox="-80 -80 160 160" aria-hidden="true">
        {acciaio ? (
          <>
            <circle r="56" className="anello-fondo" />
            <circle r="56" className="anello" strokeDasharray={`${(C * aria) / 100} ${C}`} transform="rotate(-90)" />
            {Array.from({ length: 12 }, (_, k) => (
              <line key={k} x1="0" y1="-67" x2="0" y2="-62" className="tacca" transform={`rotate(${k * 30})`} />
            ))}
          </>
        ) : (
          <>
            <defs>
              <radialGradient id="cellula-luce" cx="40%" cy="35%">
                <stop offset="0" stopColor="var(--aria)" stopOpacity=".28" />
                <stop offset=".7" stopColor="var(--aria)" stopOpacity=".06" />
                <stop offset="1" stopColor="var(--aria)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path ref={esterno} className="membrana-esterna" />
            <path ref={interno} className="membrana-interna" />
            <g ref={spore}>
              {Array.from({ length: 7 }, (_, k) => (
                <circle key={k} r={1 + (k % 2)} className="spora" />
              ))}
            </g>
          </>
        )}
      </svg>
      <div className="cifra">
        <b>{aria}</b>
        <i>{acciaio ? "ARIA" : scritta}</i>
      </div>
      {differenza && differenza > 0 && !ridotto ? <span key={`onda:${battito}`} className="onda-ricarica" aria-hidden="true" /> : null}
      {differenza ? (
        <span key={battito} className="differenza" aria-hidden="true">
          {differenza > 0 ? `+${differenza}` : `−${Math.abs(differenza)}`}
        </span>
      ) : null}
    </div>
  );
}

/** Sulla Santa Maria, prima della tuta: la console di bordo. Quello che la
 *  plancia già dice: il re del reattore, il margine nel rosso, il radar. */
function StrumentiDiBordo({ scansione, acciaio }: { scansione: string | null; acciaio: boolean }) {
  return (
    <dl className={`di-bordo ${acciaio ? "" : "spenti"}`}>
      <dt>reattore</dt>
      <dd>re · 73,4 Hz</dd>
      <dt>margine</dt>
      <dd className="rosso">nel rosso</dd>
      <dt>radar</dt>
      <dd>{scansione === "completa" ? "340 m · non in archivio" : "contatto non identificato"}</dd>
    </dl>
  );
}

// ----------------------------------------------------------------------------
//  I satelliti: la matrice, le voci, le chiavi
// ----------------------------------------------------------------------------
const GLIFI_MATRICE = (() => {
  const r = generatore(4096);
  return Array.from({ length: 8 }, () => glifo(r));
})();

/** Le soglie della matrice (§4.3): a ogni soglia si accendono due glifi. */
const SOGLIE = [4, 18, 75, 100];

function Matrice({ percento, protezione }: { percento: number; protezione: boolean }) {
  const accesi = SOGLIE.filter((s) => percento >= s).length * 2;
  return (
    <div className={`satellite matrice${protezione ? " spento" : ""}`}>
      <span className="etichetta">matrice</span>
      <span className="glifi" aria-hidden="true">
        {GLIFI_MATRICE.map((tratti, i) => (
          <svg key={i} viewBox="0 0 32 56" className={i < accesi ? "acceso" : ""}>
            {tratti.map((d, k) => (
              <path key={k} d={d} />
            ))}
          </svg>
        ))}
      </span>
      <span className="numero">{protezione ? "spenta" : `${percento}%`}</span>
    </div>
  );
}

function Voci({ echi, risonanze, protezione }: { echi: number; risonanze: number; protezione: boolean }) {
  return (
    <div className={`satellite voci${protezione ? " spento" : ""}`} role="img" aria-label={`Voci: ${echi} echi, ${risonanze} risonanze`}>
      <span className="etichetta">voci</span>
      <span className="spore" aria-hidden="true">
        {Array.from({ length: echi }, (_, i) => (
          <i key={`e${i}`} className="eco" />
        ))}
        {Array.from({ length: risonanze }, (_, i) => (
          <i key={`r${i}`} className="risonanza" />
        ))}
        {!echi && !risonanze && <span className="nessuna">nessuna</span>}
      </span>
    </div>
  );
}

function Chiavi({ chiavi }: { chiavi: number }) {
  // tre incavi: ovoidale, rettangolare, a faccette (§4.3)
  const forme = ["M16 3c7 0 11 6 11 13s-4 13-11 13S5 23 5 16 9 3 16 3z", "M7 4h18v24H7z", "M16 3l11 6.5v13L16 29 5 22.5v-13z"];
  return (
    <div className="satellite chiavi" role="img" aria-label={`Chiavi: ${chiavi} su 3`}>
      <span className="etichetta">chiavi</span>
      <span className="incavi" aria-hidden="true">
        {forme.map((d, i) => (
          <svg key={i} viewBox="0 0 32 32" className={i < chiavi ? "piena" : ""}>
            <path d={d} />
          </svg>
        ))}
      </span>
    </div>
  );
}

// ----------------------------------------------------------------------------
//  La mappa: le stanze viste
// ----------------------------------------------------------------------------
function Mappa({ turno, acciaio }: { turno: Turno; acciaio: boolean }) {
  const c = useMemo(() => costellazione(turno.stato.mappa, turno.stato.stanza), [turno.stato.mappa, turno.stato.stanza]);
  const n = c.stanze.length;
  return (
    <figure className="mappa">
      <svg viewBox="0 0 310 100" role="img" aria-label={`Mappa: ${n} ${n === 1 ? "stanza vista" : "stanze viste"}`}>
        {c.monconi.map((m, i) => (
          <line key={`m${i}`} x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} className="moncone" />
        ))}
        {c.passaggi.map((p) => {
          if (acciaio) return <line key={`${p.da}|${p.a}`} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} className="passaggio" />;
          const mx = (p.x1 + p.x2) / 2 + (p.y2 - p.y1) * 0.22;
          const my = (p.y1 + p.y2) / 2 - (p.x2 - p.x1) * 0.22;
          return <path key={`${p.da}|${p.a}`} d={`M${p.x1} ${p.y1} Q${mx} ${my} ${p.x2} ${p.y2}`} className="passaggio" />;
        })}
        {c.stanze.map((s) =>
          acciaio ? (
            <rect key={s.id} x={s.x - 4} y={s.y - 4} width="8" height="8" className={`stanza${s.qui ? " qui" : ""}`} />
          ) : (
            <g key={s.id}>
              <circle cx={s.x} cy={s.y} r={s.qui ? 4.2 : 2.6} className={`stanza${s.qui ? " qui" : ""}`} />
            </g>
          ),
        )}
      </svg>
      {/* l'impulso sulla stanza dove sei, in uno strato suo sopra la mappa: animato dentro la
          mappa la faceva ridipingere intera, con i bagliori delle stanze, a ogni fotogramma
          (revisione 25, M10) */}
      {!acciaio && (
        <svg viewBox="0 0 310 100" className="mappa-impulso" aria-hidden="true">
          {c.stanze
            .filter((s) => s.qui)
            .map((s) => (
              <circle key={s.id} cx={s.x} cy={s.y} r="8" className="impulso" />
            ))}
        </svg>
      )}
      <figcaption>{acciaio ? `mappa · ${n} ${n === 1 ? "stanza" : "stanze"}` : `${n} ${n === 1 ? "stanza vista" : "stanze viste"}`}</figcaption>
    </figure>
  );
}

// ----------------------------------------------------------------------------
//  Il cartello d'atto (§4.5): due secondi, sopra il gioco, saltabile
// ----------------------------------------------------------------------------
export function CartelloAtto({ atto, titolo, acciaio, chiudi }: { atto: number; titolo: string; acciaio: boolean; chiudi: () => void }) {
  useEffect(() => {
    const t = setTimeout(chiudi, 2600);
    return () => clearTimeout(t);
  }, [chiudi]);
  return (
    <div className={`cartello-atto${acciaio ? " acciaio" : ""}`} role="status" onClick={chiudi}>
      <span className="numero">Atto {romano(atto)}</span>
      <span className="titolo">{titolo}</span>
    </div>
  );
}

/** Il cartello si mostra quando l'atto cresce, non al caricamento. */
export function useCartelloAtto(atto: number | undefined): [number | null, () => void] {
  const [mostra, setMostra] = useState<number | null>(null);
  const prima = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (atto !== undefined && prima.current !== undefined && atto > prima.current) setMostra(atto);
    prima.current = atto;
  }, [atto]);
  return [mostra, () => setMostra(null)];
}
