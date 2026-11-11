// ============================================================================
//  La nascita della mappa stellare (documento 30, §9.b). Un momento con
//  un'animazione sua: copre il palco per venti secondi scarsi, una volta, quando
//  la proiezione del Ponte si accende. È lenta apposta, e niente vola (l'autore,
//  11 novembre 2026, sulla prima versione: «troppo veloce, manca di solennità,
//  ricorda le stelle comete delle pubblicità natalizie»; su questa: «animazione
//  meravigliosa»).
//  Un velo scuro scende sul gioco; in basso le postazioni si accendono una dopo
//  l'altra, dalle più vicine alle più lontane, e poi la struttura a stella. La
//  luce sale sulla cupola, e dove arriva le stelle affiorano al loro posto, senza
//  muoversi: due galassie, la loro in alto a sinistra e la nostra in basso a
//  destra, e in mezzo il vuoto. Si segnano i tre soli, con il loro contorno; la
//  rotta si traccia piano dentro la loro galassia e attraverso il vuoto, fino a un
//  punto piccolo e giallo, che si accende per ultimo. Poi tutto rientra, ancora
//  al buio, nella lente del visore, dove la mappa resta (MappaNellaLente.tsx: lo
//  stesso disegno, fermo all'ultimo fotogramma); e solo allora il velo si alza
//  sulle parole (che compaiono soltanto adesso). Il cartello dell'atto sta
//  sopra, all'inizio, mentre scende il buio (gioco.css). Un clic o un tasto la
//  mandano subito al ritiro.
//  Per tutto il tempo la carta gira appena su sé stessa e si allontana appena:
//  è «a tre dimensioni», e le cose vicine scorrono più delle lontane.
//  La geometria e i tempi sono in mappa.ts, il disegno in disegnaMappa.ts; qui
//  ci sono il velo, il rientro nella lente e l'orologio.
// ============================================================================
import { useEffect, useRef } from "react";
import { cicloA, FOTOGRAMMI } from "../ritmo";
import { blocca, cubica, disegnaMappa, morbido } from "./disegnaMappa";
import { DURATA, TEMPI } from "./mappa";

/** Solo nello sviluppo: `window.__mappa = 4.2` ferma il disegno a quel secondo, per guardarlo. */
const fermo = (): number | undefined => (import.meta.env.DEV ? (window as unknown as { __mappa?: number }).__mappa : undefined);

export default function MappaStellare({ onFine }: { onFine: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fine = useRef(onFine);
  fine.current = onFine;
  useEffect(() => {
    const cv = ref.current;
    const palco = cv?.parentElement;
    if (!cv || !palco) return;
    const g = cv.getContext("2d")!;
    // il colore della rotta è quello del clima (letto una volta)
    const accento = getComputedStyle(cv).getPropertyValue("--accento-2").trim() || "#8bf0a2";
    let da: number | null = null;
    let finita = false;
    const chiudi = () => {
      if (finita) return;
      finita = true;
      fine.current();
    };
    /** Dove sta la lente del visore, in frazioni del palco: lì la mappa rientra, intera. */
    const lente = () => {
      const l = palco.parentElement?.querySelector(".visore .lente-vetro")?.getBoundingClientRect();
      const p = palco.getBoundingClientRect();
      if (!l || !p.width || !p.height) return null;
      return { x: (l.left + l.width / 2 - p.left) / p.width, y: (l.top + l.height / 2 - p.top) / p.height, scala: Math.min(l.width / p.width, l.height / p.height) };
    };
    const arrivo = lente();

    const disegna = (t: number) => {
      if (finita) return;
      if (da === null) da = t;
      const s = fermo() ?? (t - da) / 1000;
      if (s >= DURATA) return chiudi();
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      if (W < 2 || H < 2) return;
      const dpr = devicePixelRatio || 1;
      if (cv.width !== Math.round(W * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      // il velo: scende piano e copre tutto; si alza quando la mappa è già nella lente
      g.globalAlpha = 1;
      g.fillStyle = `rgba(3,6,8,${morbido(s / TEMPI.velo) * (1 - morbido((s - TEMPI.ritiro - 0.9) / (DURATA - TEMPI.ritiro - 0.95)))})`;
      g.fillRect(0, 0, W, H);

      g.save();
      // il ritiro: da 0 (la mappa riempie il palco) a 1 (è nella lente)
      const ritiro = cubica(blocca((s - TEMPI.ritiro) / 1.3));
      if (ritiro > 0 && arrivo) {
        // intera e senza schiacciarsi: il centro del palco va al centro della lente
        const scala = 1 + (arrivo.scala - 1) * ritiro;
        g.translate(W / 2 + (arrivo.x - 0.5) * W * ritiro, H / 2 + (arrivo.y - 0.5) * H * ritiro);
        g.scale(scala, scala);
        g.translate(-W / 2, -H / 2);
      }
      // arrivata nella lente si perde, mentre il velo si alza: sotto c'è la stessa carta, ferma
      disegnaMappa(g, W, s, t, { accento, resta: 1 - morbido((s - TEMPI.ritiro - 1.1) / 0.7) });
      g.restore();
    };

    const ferma = cicloA(FOTOGRAMMI, disegna);
    // un clic o un tasto: subito al ritiro (e il gesto non arriva al gioco che sta sotto)
    const salta = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      const ora = performance.now();
      if (da !== null && (ora - da) / 1000 < TEMPI.ritiro) da = ora - TEMPI.ritiro * 1000;
    };
    addEventListener("keydown", salta, true);
    palco.addEventListener("pointerdown", salta, true);
    // se il disegno non gira (la finestra nascosta) il gioco torna comunque
    const comunque = setTimeout(() => {
      if (fermo() === undefined) chiudi();
    }, (DURATA + 2.5) * 1000);
    return () => {
      ferma();
      removeEventListener("keydown", salta, true);
      palco.removeEventListener("pointerdown", salta, true);
      clearTimeout(comunque);
    };
  }, []);
  return <canvas ref={ref} className="momento" aria-hidden="true" />;
}
