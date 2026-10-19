// ============================================================================
//  Le novità (nota dell'autore del 19 ottobre 2026; menu/novita.ts): dopo un
//  aggiornamento, al primo arrivo al menu, che cosa c'è di nuovo per chi gioca.
//  Poche righe semplici per versione, la più recente prima. Se le versioni sono
//  tante scorre solo il foglio, come nelle Opzioni (revisione 25, M2): «chiudi»
//  resta sempre in vista. Si chiude con «chiudi» o Esc.
// ============================================================================
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Pannello } from "../gioco/pannelli/Pannelli";
import { giorno } from "./registro";
import RigheNovita from "./RigheNovita";
import type { Novita } from "./novita";

const quando = (data: string) => giorno(`${data}T12:00:00`);

export default function FinestraNovita({ versioni, chiudi }: { versioni: readonly Novita[]; chiudi: () => void }) {
  const una = versioni.length === 1 ? versioni[0] : null;
  const foglioRef = useRef<HTMLDivElement>(null);
  const [sotto, setSotto] = useState(false);
  const misura = useCallback(() => {
    const f = foglioRef.current;
    if (f) setSotto(f.scrollHeight - f.scrollTop - f.clientHeight > 4);
  }, []);
  useLayoutEffect(() => {
    const f = foglioRef.current;
    if (!f) return;
    misura();
    const o = new ResizeObserver(misura);
    o.observe(f);
    return () => o.disconnect();
  }, [misura]);

  return (
    <Pannello forma="membrana" titolo={una ? `Novità della versione ${una.versione}` : "Novità"} classe="novita" daSolo>
      <div className={`novita-foglio${sotto ? " altro-sotto" : ""}`} ref={foglioRef} onScroll={misura}>
        {una ? (
          <>
            {una.data && <p className="novita-data">{quando(una.data)}</p>}
            <RigheNovita righe={una.righe} />
          </>
        ) : (
          versioni.map((v) => (
            <section key={v.versione} className="novita-versione" aria-label={`Versione ${v.versione}`}>
              <h3>
                {v.versione}
                {v.data && <span className="novita-data"> · {quando(v.data)}</span>}
              </h3>
              <RigheNovita righe={v.righe} />
            </section>
          ))
        )}
      </div>
      <div className="piede-novita">
        <button type="button" className="chiudi" onClick={chiudi}>
          chiudi <span className="tasto">Esc</span>
        </button>
        {sotto && (
          <button type="button" className="continua-opzioni" tabIndex={-1} aria-hidden="true" onClick={() => foglioRef.current?.scrollBy({ top: foglioRef.current.clientHeight * 0.8, behavior: "smooth" })}>
            continua ↓
          </button>
        )}
      </div>
    </Pannello>
  );
}
