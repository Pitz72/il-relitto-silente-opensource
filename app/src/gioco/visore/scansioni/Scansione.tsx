// ============================================================================
//  La scansione di una stanza del relitto nella lente del visore (revisione 25,
//  E1). Gli strati di stanze.ts vestiti in SVG: le nuvole di punti in tre fasce
//  di profondità, le linee, le masse scure, i bagliori, le marche sugli oggetti
//  schedati, e sotto il righello del multiscanner. Entrando nella stanza il
//  multiscanner la legge una volta, da sinistra a destra; poi la scansione resta
//  ferma, e a gioco fermo non costa niente (revisione 25, M10). Nella fuga trema,
//  con la protezione vitale si abbassa, nell'ipossia si appanna.
// ============================================================================
import { useId, useMemo } from "react";
import type { Clima } from "../../../stile/atmosfere";
import { ALTO, LARGO, type Strato, type Tono } from "./disegno";
import { STANZE, type Stati } from "./stanze";
import "./scansioni.css";

const COLORI: Record<Tono, string> = {
  vena: "var(--vena, #5fd4dc)",
  vivo: "var(--vena-2, #8bf0a2)",
  caldo: "#f2c879",
  osso: "#ece4cf",
  brina: "#dcf1f5",
  rosso: "#ff6b47",
};
const TONI = Object.keys(COLORI) as Tono[];
/** le tre fasce di profondità: quanto è grande e acceso un punto */
const FASCE = [
  { w: 2.3, a: 1 },
  { w: 1.7, a: 0.72 },
  { w: 1.25, a: 0.42 },
] as const;

export const haScansione = (stanza: string) => stanza in STANZE;

export default function Scansione({ stanza, stati, clima, ridotto }: { stanza: string; stati: Stati; clima: Clima; ridotto: boolean }) {
  const def = STANZE[stanza];
  const chiave = def.chiave(stati);
  // il disegno si rifà solo quando cambia la stanza o uno degli stati che lo cambiano
  const strati = useMemo(() => def.disegna(stati), [stanza, chiave]); // eslint-disable-line react-hooks/exhaustive-deps
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const instabile = clima.atmosfera === "fuga";
  return (
    <div
      key={`${stanza}|${chiave}`}
      className="scansione"
      data-ridotto={ridotto || undefined}
      data-instabile={instabile || undefined}
      data-protezione={clima.protezione || undefined}
      data-ipossia={clima.ipossia || undefined}
    >
      <div className="scansione-corpo">
        <svg viewBox={`0 0 ${LARGO} ${ALTO}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Scansione del multiscanner: ${def.descrizione(stati)}.`}>
          <defs>
            <radialGradient id={`${id}-fondo`} cx="50%" cy="56%" r="72%">
              <stop offset="0" stopColor="#081719" />
              <stop offset="0.6" stopColor="#040b0c" />
              <stop offset="1" stopColor="#010303" />
            </radialGradient>
            {TONI.map((t) => (
              <radialGradient key={t} id={`${id}-${t}`}>
                <stop offset="0" style={{ stopColor: COLORI[t], stopOpacity: 0.6 }} />
                <stop offset="0.4" style={{ stopColor: COLORI[t], stopOpacity: 0.18 }} />
                <stop offset="1" style={{ stopColor: COLORI[t], stopOpacity: 0 }} />
              </radialGradient>
            ))}
          </defs>
          <rect width={LARGO} height={ALTO} fill={`url(#${id}-fondo)`} />
          {strati.map((s, i) => (
            <StratoSvg key={i} s={s} id={id} />
          ))}
          <Righello />
        </svg>
      </div>
      {!ridotto && <div className="scansione-onda" aria-hidden="true" />}
    </div>
  );
}

function StratoSvg({ s, id }: { s: Strato; id: string }) {
  switch (s.tipo) {
    case "punti":
      return (
        <g style={{ stroke: COLORI[s.tono] }} strokeLinecap="round" fill="none">
          {s.d.map((d, k) =>
            d ? <path key={k} d={d} strokeWidth={FASCE[k].w} opacity={Math.min(1, s.forza * FASCE[k].a)} /> : null,
          )}
        </g>
      );
    case "linea":
      return (
        <path
          d={s.d}
          fill="none"
          style={{ stroke: COLORI[s.tono] }}
          strokeWidth={s.spessore}
          strokeDasharray={s.tratteggio}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={Math.min(1, s.forza)}
        />
      );
    case "massa":
      return <path d={s.d} fill="#010404" style={{ stroke: COLORI.vena }} strokeWidth={0.7} strokeOpacity={s.forza} />;
    case "alone":
      return <circle cx={s.x} cy={s.y} r={s.r} fill={`url(#${id}-${s.tono})`} opacity={Math.min(1, s.forza)} />;
    case "marca": {
      const x0 = s.x - s.l / 2, x1 = s.x + s.l / 2, y0 = s.y - s.a / 2, y1 = s.y + s.a / 2;
      const c = Math.min(7, s.l / 4, s.a / 4);
      const d = `M${x0} ${y0 + c}V${y0}H${x0 + c}M${x1 - c} ${y0}H${x1}V${y0 + c}M${x1} ${y1 - c}V${y1}H${x1 - c}M${x0 + c} ${y1}H${x0}V${y1 - c}`;
      return <path d={d} fill="none" style={{ stroke: COLORI.vivo }} strokeWidth={1.1} opacity={0.85} className="scansione-marca" />;
    }
  }
}

/** Il righello del multiscanner, in basso, dentro l'ovale della lente. */
function Righello() {
  let d = "";
  for (let i = 0; i <= 24; i++) {
    const x = 214 + i * 8;
    d += `M${x} 274v${i % 6 === 0 ? -7 : -3.5}`;
  }
  return <path d={d + "M214 274H406M40 150h14M566 150h14"} fill="none" style={{ stroke: COLORI.vena }} strokeWidth={0.8} opacity={0.32} />;
}
