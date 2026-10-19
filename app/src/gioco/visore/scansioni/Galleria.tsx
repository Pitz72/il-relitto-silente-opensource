// ============================================================================
//  La galleria delle scansioni (solo nello sviluppo, ?scansioni): ogni stanza del
//  relitto con le sue varianti di stato, alla misura e con l'ovale della lente,
//  nel clima del relitto. Per disegnarle e correggerle senza giocare fin lì.
// ============================================================================
import type { CSSProperties } from "react";
import { tavolozza, variabiliCss, type Clima } from "../../../stile/atmosfere";
import "../../../stile/base.css";
import Scansione from "./Scansione";
import { STANZE } from "./stanze";

const CLIMA: Clima = { atmosfera: "relitto", forma: "membrana", stanza: null, protezione: false, ipossia: false } as Clima;

export default function Galleria() {
  const stile = variabiliCss(tavolozza(CLIMA), null) as CSSProperties;
  const solo = new URLSearchParams(location.search).get("scansioni");
  const ovale = !new URLSearchParams(location.search).has("rettangolo");
  // ?grande: larghe quanto la finestra, per guardarle da vicino
  const largo = new URLSearchParams(location.search).has("grande") ? Math.min(innerWidth - 48, 1400) : 600;
  return (
    <div style={{ ...stile, background: "#030707", minHeight: "100vh", padding: 24, color: "#9fb8b6", fontFamily: "monospace" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        {Object.entries(STANZE)
          .filter(([nome]) => !solo || nome.includes(solo))
          .flatMap(([nome, def]) =>
            Object.entries(def.varianti).map(([variante, stati]) => (
              <figure key={`${nome}|${variante}`} style={{ margin: 0 }} data-stanza={nome} data-variante={variante}>
                <div style={{ position: "relative", width: largo, height: Math.round((largo * 290) / 600), background: "#020505", clipPath: ovale ? "ellipse(50% 50% at 50% 50%)" : undefined }}>
                  <Scansione stanza={nome} stati={stati} clima={CLIMA} ridotto />
                </div>
                <figcaption style={{ fontSize: 13, marginTop: 6 }}>
                  {nome} · {variante}
                </figcaption>
              </figure>
            )),
          )}
      </div>
    </div>
  );
}
