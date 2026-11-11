// ============================================================================
//  La nave che si sveglia (documento 30, §9.d). Un momento con un'animazione
//  sua: dieci secondi e mezzo, una volta, quando nel laboratorio di risonanza
//  torna l'energia. Non copre il gioco con un velo: è l'interfaccia che si
//  spegne e si riaccende. Lenta, e niente vola (documento 30, §9.4).
//  Tutto va al buio, e restano le vene, appena visibili. La lente, dove si vede
//  il generatore, guizza quattro volte con gli archi fra le bobine. Al brivido
//  dello scafo una luce parte da lì e si allarga piano su tutto lo schermo: dove
//  passa le vene si accendono (Vene.tsx legge l'onda da tempiRisveglio.ts) e gli
//  strumenti tornano uno dopo l'altro, ognuno quando la luce lo raggiunge. Per
//  ultima la lamina, con le parole (che compaiono soltanto adesso). Un clic o un
//  tasto portano subito alle parole.
//  Qui c'è una tela trasparente sopra il palco (la luce del generatore e la
//  fascia dell'onda; e ferma i gesti finché dura), e le animazioni di ogni
//  sistema, guidate da un orologio solo. I tempi sono in tempiRisveglio.ts.
// ============================================================================
import { useEffect, useRef } from "react";
import { cicloA, FOTOGRAMMI } from "../ritmo";
import { ACCENSIONE, chiavi, DURATA, fioritura, fronte, luceLente, morbido, onda, PAROLE, TEMPI, veneAlBuio } from "./tempiRisveglio";

/** Solo nello sviluppo: `window.__risveglio = 4.2` ferma tutto a quel secondo, per guardarlo. */
const fermo = (): number | undefined => (import.meta.env.DEV ? (window as unknown as { __risveglio?: number }).__risveglio : undefined);

/** I sistemi che si spengono e tornano quando la luce li raggiunge: quanto restano visibili al buio, e se
 *  appena accesi sono più chiari. La lente, la lamina e la luce della stanza hanno i loro tempi. */
const SISTEMI: { sel: string; buio: number; fiorisce?: boolean }[] = [
  { sel: ".visore .strumenti > *", buio: 0.07, fiorisce: true },
  { sel: ".visore .mappa", buio: 0.07, fiorisce: true },
  { sel: ".comandi-app", buio: 0.05 },
  { sel: ".atto", buio: 0.05 },
  { sel: ".ramo-fili path, .ramo-segnale path", buio: 0.05 },
  { sel: ".etichetta-ramo", buio: 0.05 },
  { sel: ".baccello", buio: 0.05 },
];

/** Un colore del clima (`#rrggbb`) in tre numeri, per le sfumature della tela. */
function rgb(colore: string): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(colore.trim());
  return m ? `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}` : "139,240,162";
}

export default function Risveglio({ onFine }: { onFine: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fine = useRef(onFine);
  fine.current = onFine;
  useEffect(() => {
    const cv = ref.current;
    const palco = cv?.parentElement;
    const schermo = palco?.parentElement;
    if (!cv || !palco || !schermo) return;
    const g = cv.getContext("2d")!;
    const luce = rgb(getComputedStyle(cv).getPropertyValue("--vena-2"));
    const p = palco.getBoundingClientRect();
    const sc = schermo.getBoundingClientRect();
    // il generatore è dove lo si vede: al centro della lente
    const l = palco.querySelector(".visore .lente-vetro")?.getBoundingClientRect();
    const ox = l ? l.left + l.width / 2 : p.left + p.width * 0.81;
    const oy = l ? l.top + l.height / 2 : p.top + p.height * 0.18;
    const dista = (x: number, y: number) => Math.hypot(x - ox, y - oy);
    const lontano = Math.max(dista(sc.left, sc.top), dista(sc.right, sc.top), dista(sc.left, sc.bottom), dista(sc.right, sc.bottom));
    const velocita = lontano / (TEMPI.onda[1] - TEMPI.onda[0]);

    // --- ogni sistema ha la sua animazione, ferma: la muove l'orologio qui sotto
    const animazioni: Animation[] = [];
    const anima = (el: Element, fotogrammi: Keyframe[]) => {
      const a = el.animate(fotogrammi, { duration: DURATA * 1000, fill: "both" });
      a.pause();
      animazioni.push(a);
    };
    /** I sistemi si raccolgono a ogni fotogramma, non una volta sola: il ramo ridisegna i suoi baccelli un
     *  istante dopo il turno (li misura fuori dallo schermo, poi li mette al loro posto), e quelli nuovi
     *  resterebbero accesi nel buio. Chi arriva dopo prende l'animazione al punto in cui è l'orologio. */
    const presi = new WeakSet<Element>();
    const raccogli = () => {
      for (const { sel, buio, fiorisce } of SISTEMI) {
        for (const el of palco.querySelectorAll(sel)) {
          if (presi.has(el)) continue;
          const b = el.getBoundingClientRect();
          // (un baccello appena spuntato misura ancora zero, ma sta già al suo posto: conta; quello che serve
          // solo a misurare sta fuori dallo schermo, e uno nascosto non ha un posto)
          if ((!b.width && !b.height && !b.left && !b.top) || b.right < sc.left || b.left > sc.right || b.bottom < sc.top || b.top > sc.bottom) continue;
          presi.add(el);
          const vicino = Math.hypot(Math.max(b.left - ox, 0, ox - b.right), Math.max(b.top - oy, 0, oy - b.bottom));
          const fondo = Math.max(dista(b.left, b.top), dista(b.right, b.top), dista(b.left, b.bottom), dista(b.right, b.bottom));
          const sveglia = TEMPI.onda[0] + vicino / velocita;
          // un sistema largo torna mentre la luce lo attraversa
          anima(el, chiavi(buio, sveglia, Math.max(ACCENSIONE, (fondo - vicino) / velocita)));
          if (fiorisce) anima(el, fioritura(sveglia));
        }
      }
    };
    raccogli();
    const lente = palco.querySelector(".visore .lente");
    if (lente) {
      const n = Math.round(DURATA * 30);
      anima(lente, Array.from({ length: n + 1 }, (_, i) => ({ offset: i / n, opacity: luceLente((i / n) * DURATA) })));
      anima(lente, fioritura(TEMPI.onda[0]));
    }
    // la luce della stanza, dietro la lamina: torna quando l'onda arriva al suo centro (respira: si parte da
    // quanta ce n'è adesso)
    const stanza = palco.querySelector(".luce-stanza");
    if (stanza) anima(stanza, chiavi(0, TEMPI.onda[0] + dista(p.left + p.width * 0.31, p.top + p.height * 0.44) / velocita, 2.2, Number(getComputedStyle(stanza).opacity) || 1));
    // la lamina per ultima, con le parole
    const lamina = palco.querySelector(".lamina");
    if (lamina) anima(lamina, chiavi(0, TEMPI.parole, PAROLE));

    // --- l'onda nelle vene (la tela delle vene copre tutto lo schermo)
    Object.assign(onda, { attiva: true, x: ox - sc.left, y: oy - sc.top, raggio: 0, velocita, buio: veneAlBuio(0) });

    let da: number | null = null;
    let finita = false;
    const chiudi = () => {
      if (finita) return;
      finita = true;
      fine.current();
    };
    const X = ox - p.left;
    const Y = oy - p.top;

    const ferma = cicloA(FOTOGRAMMI, (t) => {
      if (finita) return;
      if (da === null) da = t;
      const s = fermo() ?? (t - da) / 1000;
      if (s >= DURATA) return chiudi();
      raccogli();
      for (const a of animazioni) a.currentTime = s * 1000;
      onda.raggio = fronte(s) * lontano;
      onda.buio = veneAlBuio(s);

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
      const k = W / 1280;
      // il generatore: una luce che guizza con gli archi, e si perde quando la lente è accesa
      const accesa = s < TEMPI.buio ? 0 : luceLente(s) * (1 - morbido((s - TEMPI.onda[0] - 0.4) / 1.8));
      if (accesa > 0.01) {
        const r = (110 + 70 * accesa) * k;
        const al = g.createRadialGradient(X, Y, 0, X, Y, r);
        al.addColorStop(0, `rgba(${luce},${0.42 * accesa})`);
        al.addColorStop(0.4, `rgba(${luce},${0.14 * accesa})`);
        al.addColorStop(1, `rgba(${luce},0)`);
        g.fillStyle = al;
        g.fillRect(X - r, Y - r, 2 * r, 2 * r);
      }
      // l'onda: una fascia larga e tenue che si allarga piano, e si perde andando
      const f = fronte(s);
      if (f > 0 && f < 1.1) {
        const R = f * lontano;
        const largo = 0.075 * W;
        const fascia = g.createRadialGradient(X, Y, Math.max(0, R - largo), X, Y, R + largo);
        fascia.addColorStop(0, `rgba(${luce},0)`);
        fascia.addColorStop(0.5, `rgba(${luce},${0.13 * (1 - 0.55 * Math.min(1, f)) * (1 - morbido((f - 1) / 0.1))})`);
        fascia.addColorStop(1, `rgba(${luce},0)`);
        g.fillStyle = fascia;
        g.fillRect(0, 0, W, H);
      }
    });

    // un clic o un tasto: subito alle parole (e il gesto non arriva al gioco che sta sotto)
    const salta = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      const ora = performance.now();
      if (da !== null && (ora - da) / 1000 < TEMPI.parole) da = ora - TEMPI.parole * 1000;
    };
    addEventListener("keydown", salta, true);
    palco.addEventListener("pointerdown", salta, true);
    // se il disegno non gira (la finestra nascosta) il gioco torna comunque
    const comunque = setTimeout(() => {
      if (fermo() === undefined) chiudi();
    }, (DURATA + 2.5) * 1000);
    return () => {
      ferma();
      for (const a of animazioni) a.cancel();
      onda.attiva = false;
      removeEventListener("keydown", salta, true);
      palco.removeEventListener("pointerdown", salta, true);
      clearTimeout(comunque);
    };
  }, []);
  return <canvas ref={ref} className="momento" aria-hidden="true" />;
}
