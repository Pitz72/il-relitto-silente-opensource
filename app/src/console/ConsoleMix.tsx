// ============================================================================
//  La console di regia: i livelli relativi dei canali del suono, mossi ascoltando (mondo/livelli.rs).
//  Ctrl+Maiusc+M la apre e la chiude in qualunque schermata, senza fermare il gioco. Ogni cursore è
//  in dB rispetto al mix di base; si sente subito. «Copia» mette negli appunti il file livelli.json
//  con i valori di adesso: è quello che va a sostituire app/src/gioco/livelli.json.
// ============================================================================
import { useEffect, useState } from "react";
import { CANALI, LIVELLI_DI_BASE, leggiLivelli, scriviLivelli, type Livelli } from "../gioco/livelli";
import { livelliSuono } from "../gioco/suono";
import "./console.css";

const fmt = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1).replace(".", ",")} dB`;

export default function ConsoleMix() {
  const [aperta, setAperta] = useState(false);
  const [livelli, setLivelli] = useState<Livelli>(leggiLivelli);
  const [copiato, setCopiato] = useState(false);

  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setAperta((a) => !a);
      }
    };
    addEventListener("keydown", tasto);
    return () => removeEventListener("keydown", tasto);
  }, []);

  const cambia = (chiave: keyof Livelli, valore: number) => {
    const nuovi = { ...livelli, [chiave]: valore };
    setLivelli(nuovi);
    scriviLivelli(nuovi);
    void livelliSuono(nuovi);
  };
  const ripristina = () => {
    setLivelli({ ...LIVELLI_DI_BASE });
    scriviLivelli({ ...LIVELLI_DI_BASE });
    void livelliSuono({ ...LIVELLI_DI_BASE });
  };
  const copia = async () => {
    const testo = JSON.stringify(livelli, null, 2) + "\n";
    try {
      await navigator.clipboard.writeText(testo);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2500);
    } catch {
      /* gli appunti non ci sono: si legge dal riquadro */
    }
  };

  if (!aperta) return null;
  return (
    <aside className="console-mix" role="dialog" aria-label="Console di regia" onKeyDown={(e) => e.stopPropagation()}>
      <header>
        <h2>Console di regia</h2>
        <button type="button" onClick={() => setAperta(false)} aria-label="Chiudi la console">
          ✕
        </button>
      </header>
      <p className="nota">Livelli relativi dei canali, in dB. Si sentono subito. Ctrl+Maiusc+M la chiude.</p>
      <div className="canali">
        {CANALI.map(({ chiave, nome, cosa }) => {
          const v = livelli[chiave];
          const base = LIVELLI_DI_BASE[chiave];
          return (
            <label key={chiave} className={v !== base ? "cambiato" : undefined} title={cosa}>
              <span className="nome">{nome}</span>
              <input type="range" min={-40} max={12} step={0.5} value={v} aria-label={nome} aria-valuetext={fmt(v)} onChange={(e) => cambia(chiave, Number(e.target.value))} />
              <output>{fmt(v)}</output>
            </label>
          );
        })}
      </div>
      <footer>
        <button type="button" onClick={ripristina}>
          Ripristina
        </button>
        <button type="button" onClick={copia}>
          {copiato ? "Copiato" : "Copia i valori"}
        </button>
      </footer>
    </aside>
  );
}
