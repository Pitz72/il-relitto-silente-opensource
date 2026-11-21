// ============================================================================
//  Il cartello della demo (app/src/demo.ts; documento 42): prima di ogni cosa, all'avvio, e alla fine, quando
//  William esce dal boccaporto e mette piede sullo scafo nero. La stessa lastra della dichiarazione d'apertura,
//  ferma finché non si sceglie. L'autore, 21 novembre 2026: «Devi mettere un messaggio prima di ogni cosa che
//  questa è una demo, non corrisponde necessariamente alla versione finale e molte cose, comprese voci, potranno
//  essere diverse nella versione finale. Rappresenta solo il primissimo pezzo del gioco e che serve per valutare la
//  tipologia di gioco e la qualità del lavoro»; e: «si finisce con il cartello che dice che è una demo ecc ecc e poi
//  menu principale».
// ============================================================================
import { useEffect, useRef, useState } from "react";
import "./dichiarazione.css";

export const AVVISO_DEMO =
  "Non corrisponde necessariamente alla versione finale del gioco: molte cose, comprese le voci, potranno essere " +
  "diverse. È soltanto il primissimo pezzo del gioco, e serve a farsi un’idea del tipo di gioco e della qualità " +
  "del lavoro.";

const TESTI = {
  avvio: { prima: "Questa è una demo del Relitto Silente.", saluto: "", pulsante: "continua" },
  fine: { prima: "Qui finisce la demo: l’atto I, la Santa Maria.", saluto: "Grazie di aver giocato.", pulsante: "menu principale" },
};

export default function FineDemo({ quando = "fine", onFine }: { quando?: "avvio" | "fine"; onFine: () => void }) {
  const testi = TESTI[quando];
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
    <div className="dichiarazione" role="alertdialog" aria-modal="true" aria-label="La demo" aria-describedby="demo-testo">
      <div className={`dic-lastra${visibile ? " visibile" : ""}`}>
        <div className="dic-vena" aria-hidden="true" />
        <div>
          <div id="demo-testo" className="dic-testo">
            <p>{testi.prima}</p>
            <p>{AVVISO_DEMO}</p>
          </div>
          <div className="dic-piede">
            <p className="dic-saluto">{testi.saluto}</p>
            <button type="button" ref={pulsante} onClick={prosegui}>
              {testi.pulsante} <span className="tasto">Invio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
