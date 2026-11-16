// ====================================================================
//  Il cartello fermo dell'avvio (l'autore, 16 novembre 2026): «dato che
//  mettiamo i loghi animati attaccati alla cinematica, prima del menu di
//  gioco facciamo un cartello senza loghi animati. Cartello statico in nero
//  che dice che è una produzione Runtime Multimedia e che è realizzato con
//  Favella1. Ovviamente i loghi grafici devi metterceli.»
//  All'avvio, dopo il nero e prima della dichiarazione, al posto dei loghi
//  animati: quelli passano soltanto prima dell'intro, come inizio della
//  cinematica (Loghi.tsx). I marchi sono quelli fermi dei titoli di coda
//  (Marchi.tsx), nel bianco freddo dei titoli di testa; le due righe piccole
//  come i ruoli dei crediti (Newsreader corsivo leggero). Nessun suono.
//  Entra in 1,2 s, resta fermo, esce in 1,0; Esc, Invio, Spazio o un clic
//  lo saltano.
// ====================================================================
import { useEffect, useRef, useState } from "react";
import { MarchioFavella, MarchioRuntime } from "./Marchi";
import "../stile/caratteri.css";
import "./cartello.css";

/** i tempi, in millisecondi: un attimo di nero, l'entrata, il fermo, l'uscita */
export const CARTELLO = { nero: 150, entra: 1200, fermo: 4200, esce: 1000 };
/** il bianco freddo del poster, quello dei titoli di testa (intro.css) */
const FREDDO = "#cdd8e0";
const CARATTERI = ["italic 300 20px Newsreader", "700 100px Sora", "400 40px Inter"];

export default function Cartello({ onFine }: { onFine: () => void }) {
  const [fase, setFase] = useState<"prima" | "pieno" | "via">("prima");
  const fatto = useRef(false);
  const fine = useRef(onFine);
  fine.current = onFine;
  const prosegui = () => {
    if (!fatto.current) {
      fatto.current = true;
      fine.current();
    }
  };

  useEffect(() => {
    const { nero, entra, fermo, esce } = CARTELLO;
    const t: number[] = [];
    let vivo = true;
    // si parte a caratteri caricati (la scritta e il motto di FAVELLA1, le righe piccole), al più dopo un secondo e mezzo
    const caratteri = Promise.all(CARATTERI.map((f) => document.fonts?.load(f).catch(() => null)));
    void Promise.race([caratteri, new Promise((r) => window.setTimeout(r, 1500))]).then(() => {
      if (!vivo) return;
      t.push(
        window.setTimeout(() => setFase("pieno"), nero),
        window.setTimeout(() => setFase("via"), nero + entra + fermo),
        window.setTimeout(prosegui, nero + entra + fermo + esce),
      );
    });
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        prosegui();
      }
    };
    window.addEventListener("keydown", tasto);
    return () => {
      vivo = false;
      t.forEach((x) => window.clearTimeout(x));
      window.removeEventListener("keydown", tasto);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="cartello-avvio" role="img" aria-label="Una produzione Runtime Multimedia, realizzata con Favella1" onClick={prosegui}>
      <div className={`cartello-lastra ${fase}`} aria-hidden="true">
        <div className="cartello-voce">
          <p className="cartello-ruolo">una produzione</p>
          <MarchioRuntime className="cartello-marchio cartello-runtime" colore={FREDDO} />
        </div>
        <div className="cartello-voce">
          <p className="cartello-ruolo">realizzato con</p>
          <MarchioFavella className="cartello-marchio cartello-favella" colore={FREDDO} />
        </div>
      </div>
    </div>
  );
}
