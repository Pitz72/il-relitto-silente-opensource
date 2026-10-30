// ============================================================================
//  La dichiarazione d'apertura (gli appunti dell'autore, 15 ottobre 2026):
//  come è nato il gioco. Dopo i loghi e, al primo avvio, dopo i riconoscimenti,
//  sullo stesso fondo: le scritte dei riconoscimenti sfumano e compare questa.
//  Il comportamento è quello dell'avviso del Viaggiatore (components/Avviso.tsx):
//  a ogni avvio, anche con il movimento ridotto (è una comunicazione, non un
//  effetto); si legge in una ventina di secondi, poi prosegue da sé, oppure
//  subito con Invio, Spazio, Esc o un clic. Lo stile è quello del Relitto.
//  Il testo è dell'autore: si cambia solo qui.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import "./dichiarazione.css";

export const TESTO_DICHIARAZIONE =
  "Il Relitto Silente è nato come demo di Favella1, il linguaggio di programmazione e motore di narrativa " +
  "interattiva in italiano. È stato sviluppato con l’ausilio dell’intelligenza artificiale dei modelli Claude, " +
  "ma è il frutto di una progettazione metodica e accurata del suo autore. " +
  "La musica è stata generata con l’intelligenza artificiale (Lyria 3.5 di Google e Suno), scelta e diretta dall’autore; " +
  "il tema dell’intro è «The Santa Maria Theme» di Alirio Bruni. " +
  "La voce di L.V. è stata generata con la sintesi vocale di Google; ogni altro suono del gioco è sintetizzato dal suo motore audio.";
/** L'ultima frase sta a sé, come un saluto (come nel Viaggiatore). */
export const SALUTO = "Buon divertimento.";

const ATTESA_MASSIMA = 20_000; // ms: poi prosegue da solo

export default function Dichiarazione({ onFine }: { onFine: () => void }) {
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
    // il fuoco su «continua» (Invio lo prende), senza contorno: nessuno l'ha scelto
    pulsante.current?.focus({ preventScroll: true, focusVisible: false });
    const comparsa = window.setTimeout(() => setVisibile(true), 120);
    const scadenza = window.setTimeout(prosegui, ATTESA_MASSIMA);
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        prosegui();
      }
    };
    window.addEventListener("keydown", tasto);
    return () => {
      window.clearTimeout(comparsa);
      window.clearTimeout(scadenza);
      window.removeEventListener("keydown", tasto);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="dichiarazione" role="alertdialog" aria-modal="true" aria-label="Come è nato il gioco" aria-describedby="dichiarazione-testo" onClick={prosegui}>
      <div className={`dic-lastra${visibile ? " visibile" : ""}`}>
        <div className="dic-vena" aria-hidden="true" />
        <div>
          <p id="dichiarazione-testo" className="dic-testo">
            {TESTO_DICHIARAZIONE}
          </p>
          <div className="dic-piede">
            <p className="dic-saluto">{SALUTO}</p>
            <button
              type="button"
              ref={pulsante}
              onClick={(e) => {
                e.stopPropagation();
                prosegui();
              }}
            >
              continua <span className="tasto">Invio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
