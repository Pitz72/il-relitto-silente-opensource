// ============================================================================
//  «Ascolta il canto» (documento 32, §3.11): l'inno degli alieni, «Havela».
//  Dal nodo «musica» del colloquio con l'Anziano, chi vuole lo ascolta per intero:
//  il letto dell'Anziano sfuma (il motore audio lo fa tornare dopo), le parole
//  della loro lingua compaiono una strofa alla volta con l'italiano accanto.
//  Un clic o un tasto, o il pulsante «Smetti di ascoltare», interrompono.
//  Mentre si ascolta nessun tasto arriva al gioco: un «3» non sceglie una risposta.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import { innoSuono } from "../suono";
import { aSchermo, INNO_DURATA } from "./testoInno";

interface Props {
  ridotto: boolean;
  /** l'ascolto è finito, da solo o perché chi ascolta l'ha interrotto */
  finito: () => void;
}

export default function Inno({ ridotto, finito }: Props) {
  const [s, setS] = useState(0);
  const smetti = useRef<HTMLButtonElement>(null);
  const fine = useRef(finito);
  fine.current = finito;
  // il motore suona finché non finisce da solo: all'interruzione si manda lo stop
  const chiuso = useRef(false);
  useEffect(() => {
    chiuso.current = false;
    void innoSuono(true);
    const t0 = performance.now();
    const chiudi = (interrotto: boolean) => {
      if (chiuso.current) return;
      chiuso.current = true;
      if (interrotto) void innoSuono(false);
      fine.current();
    };
    const giro = setInterval(() => {
      const t = (performance.now() - t0) / 1000;
      setS(t);
      if (t >= INNO_DURATA + 1) chiudi(false);
    }, 250);
    const tasto = (e: KeyboardEvent) => {
      if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      chiudi(true);
    };
    addEventListener("keydown", tasto, true);
    const clic = () => chiudi(true);
    addEventListener("pointerdown", clic, true);
    smetti.current?.focus({ preventScroll: true });
    // se il gioco se ne va mentre si ascolta (il menu, la pagina che si chiude), il canto si ferma
    return () => {
      clearInterval(giro);
      removeEventListener("keydown", tasto, true);
      removeEventListener("pointerdown", clic, true);
      if (!chiuso.current) {
        chiuso.current = true;
        void innoSuono(false);
      }
    };
  }, []);
  const ora = aSchermo(s);
  return (
    <div className="inno" role="dialog" aria-modal="true" aria-label="Havela, il canto degli alieni" data-ridotto={ridotto ? "si" : undefined}>
      <div className="inno-testata">
        <div className="inno-titolo">Havela</div>
        <div className="inno-nota">il canto degli alieni, nella loro lingua · con l’italiano accanto</div>
      </div>
      <div className="inno-righe" aria-live="polite">
        {ora && (
          <div key={ora.strofa.righe[0].da} className="inno-strofa">
            {ora.strofa.righe.slice(0, ora.quante).map((r) => (
              <p key={r.da} className="inno-riga">
                <span className="inno-loro">{r.loro}</span>
                <span className="inno-it">{r.italiano}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      <button ref={smetti} type="button" className="inno-smetti">
        Smetti di ascoltare
      </button>
    </div>
  );
}
