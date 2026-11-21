// ============================================================================
//  La fine della demo (app/src/demo.ts): quando William esce dal boccaporto e mette piede sullo scafo nero. La
//  stessa lastra della dichiarazione d'apertura, ferma finché non si sceglie: «continua» porta ai titoli di coda,
//  e dai titoli si torna al menu.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import "./dichiarazione.css";

export const TESTO_FINE_DEMO = [
  "Qui finisce la demo: l’atto I, la Santa Maria.",
  "Oltre il boccaporto c’è lo scafo nero, e il resto del Relitto Silente.",
];
export const SALUTO_FINE_DEMO = "Grazie di aver giocato.";

export default function FineDemo({ onFine }: { onFine: () => void }) {
  const [visibile, setVisibile] = useState(false);
  const fatto = useRef(false);
  const fine = useRef(onFine);
  fine.current = onFine;
  const pulsante = useRef<HTMLButtonElement>(null);
  const prosegui = () => {
    if (!fatto.current) {
      fatto.current = true;
      fine.current();
    }
  };

  useEffect(() => {
    pulsante.current?.focus({ preventScroll: true, focusVisible: false });
    const comparsa = window.setTimeout(() => setVisibile(true), 120);
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        prosegui();
      }
    };
    window.addEventListener("keydown", tasto);
    return () => {
      window.clearTimeout(comparsa);
      window.removeEventListener("keydown", tasto);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="dichiarazione" role="alertdialog" aria-modal="true" aria-label="Fine della demo" aria-describedby="fine-demo-testo">
      <div className={`dic-lastra${visibile ? " visibile" : ""}`}>
        <div className="dic-vena" aria-hidden="true" />
        <div>
          <div id="fine-demo-testo" className="dic-testo">
            {TESTO_FINE_DEMO.map((r) => (
              <p key={r}>{r}</p>
            ))}
          </div>
          <div className="dic-piede">
            <p className="dic-saluto">{SALUTO_FINE_DEMO}</p>
            <button type="button" ref={pulsante} onClick={prosegui}>
              titoli di coda <span className="tasto">Invio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
