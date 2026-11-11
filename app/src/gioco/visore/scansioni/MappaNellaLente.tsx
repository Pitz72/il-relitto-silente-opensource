// ============================================================================
//  La mappa stellare nella lente del visore (documento 30, §9.b). Sul Ponte, da
//  quando la proiezione è accesa, la lente non mostra più la scansione della
//  sala: tiene l'ultimo fotogramma dell'animazione della mappa, fermo (l'autore,
//  11 novembre 2026: «dovresti sostituire l'immagine statica con il frame finale
//  dell'animazione»). È lo stesso disegno (momenti/disegnaMappa.ts), alto quanto
//  la lente e al centro: proprio dove l'animazione, finendo, lo riporta.
//  Si comporta come una scansione (scansioni.css): entrando nella stanza il
//  multiscanner la legge una volta, da sinistra a destra; nella fuga trema, con
//  la protezione vitale si abbassa, nell'ipossia si appanna. Ferma, non costa
//  niente: si disegna una volta, e di nuovo solo se la lente cambia misura.
// ============================================================================
import { useEffect, useRef } from "react";
import type { Clima } from "../../../stile/atmosfere";
import { disegnaMappa } from "../../momenti/disegnaMappa";
import { TEMPI } from "../../momenti/mappa";
import "./scansioni.css";

/** Quando la lente mostra la mappa al posto della scansione. */
export const haLaMappa = (stanza: string, stati: { proiezione?: string | null }) => stanza === "ponte di comando" && stati.proiezione === "attiva";

/** La carta è disegnata come su un palco largo così, e poi rimpicciolita: come nell'animazione. */
const LARGO = 1280;

export default function MappaNellaLente({ clima, ridotto }: { clima: Clima; ridotto: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    const accento = getComputedStyle(cv).getPropertyValue("--accento-2").trim() || "#8bf0a2";
    const disegna = () => {
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (w < 2 || h < 2) return;
      const dpr = devicePixelRatio || 1;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.fillStyle = "#030608";
      g.fillRect(0, 0, w, h);
      // intera: alta quanto la lente, e al centro
      const scala = h / ((LARGO * 9) / 16);
      g.translate((w - LARGO * scala) / 2, 0);
      g.scale(scala, scala);
      disegnaMappa(g, LARGO, TEMPI.ritiro, 0, { accento, rinforzo: 2 });
    };
    disegna();
    const misura = new ResizeObserver(disegna);
    misura.observe(cv);
    return () => misura.disconnect();
  }, [clima.atmosfera, clima.protezione]);
  return (
    <div
      className="scansione"
      data-ridotto={ridotto || undefined}
      data-instabile={clima.atmosfera === "fuga" || undefined}
      data-protezione={clima.protezione || undefined}
      data-ipossia={clima.ipossia || undefined}
    >
      <div className="scansione-corpo">
        <canvas
          ref={ref}
          role="img"
          aria-label="Il multiscanner sul ponte di comando: sulla cupola la mappa stellare. Due galassie: la rotta parte da tre soli segnati in un ammasso della prima, attraversa il vuoto e finisce su un punto giallo nella seconda."
        />
      </div>
      {!ridotto && <div className="scansione-onda" aria-hidden="true" />}
    </div>
  );
}
