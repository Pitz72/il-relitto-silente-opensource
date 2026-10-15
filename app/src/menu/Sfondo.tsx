// ============================================================================
//  Lo sfondo del menu principale (06-app-desktop.md, §4.6): la scena finale
//  dell'intro, la Santa Maria ridotta a un punto davanti alla massa che beve le
//  stelle, viva e lentissima. La disegna lo stesso motore WebGL dell'intro
//  (intro/scala.ts), a metà risoluzione e a venti fotogrammi al secondo al
//  più: si muove di pochi metri al minuto. Con il movimento ridotto è un quadro
//  fermo. Senza WebGL2 resta il colore del fondo.
//  Nello sviluppo, window.__sfondo(t, luce) disegna un fotogramma a mano (il
//  pannello del browser nascosto non fa girare requestAnimationFrame).
// ============================================================================
import { useEffect, useRef } from "react";
import { Scala } from "../intro/scala";

/** Il tempo della scena della scala (09, scena E): la camera fra 12 e 18 km dalla poppa. */
const PIU_VICINO = 21.4;
const PIU_LONTANO = 23.5;
/** Un respiro di quattro minuti, avanti e indietro. */
const PERIODO = 240;
const PASSO = 1 / 20;
/** La luce sale in due secondi e mezzo. */
const ALBA = 2.5;

const tempoDelloSfondo = (s: number) =>
  PIU_VICINO + (PIU_LONTANO - PIU_VICINO) * (0.5 + 0.5 * Math.cos((2 * Math.PI * s) / PERIODO));

export default function Sfondo({ ridotto }: { ridotto: boolean }) {
  const tela = useRef<HTMLCanvasElement>(null);
  // Il motore e il suo contesto WebGL restano uno: React, nello sviluppo, monta
  // due volte, e spegnere il contesto alla prima pulizia lascerebbe la tela
  // morta. Si spegne solo quando il componente se ne va davvero.
  const pronta = useRef<Promise<Scala> | null>(null);
  const addio = useRef<number | null>(null);

  useEffect(() => {
    const c = tela.current;
    if (!c) return;
    if (addio.current !== null) clearTimeout(addio.current);
    addio.current = null;
    let vivo = true;
    let raf = 0;
    pronta.current ??= (async () => {
      const s = new Scala(c);
      const base = new URL("./intro/", location.href).href;
      await s.carica(`${base}poppa.webp`, `${base}prua.webp`);
      s.prepara("scala");
      return s;
    })();
    const scala = pronta.current;
    (async () => {
      let s0: Scala;
      try {
        s0 = await scala;
      } catch {
        return;
      }
      if (!vivo) return;
      if (import.meta.env.DEV)
        (window as unknown as Record<string, unknown>).__sfondo = (t = PIU_LONTANO, luce = 1) => s0.quadro("scala", t, { luce, ridotta: true });
      if (ridotto) {
        s0.quadro("scala", PIU_LONTANO, { luce: 1, ridotta: true });
        return;
      }
      const t0 = performance.now();
      let ultimo = -Infinity;
      const disegna = (ora: number) => {
        if (!vivo) return;
        const s = Math.max(0, (ora - t0) / 1000);
        const luce = Math.min(1, s / ALBA);
        if (s - ultimo >= PASSO || luce < 1) {
          ultimo = s;
          s0.quadro("scala", tempoDelloSfondo(s), { luce, ridotta: true });
        }
        raf = requestAnimationFrame(disegna);
      };
      // il primo fotogramma subito: la tela non resta mai vuota
      disegna(t0);
    })();
    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      addio.current = window.setTimeout(() => {
        void scala.then((s) => s.distruggi()).catch(() => undefined);
        pronta.current = null;
        addio.current = null;
      }, 0);
    };
  }, [ridotto]);

  return <canvas ref={tela} className="sfondo-menu" aria-hidden="true" />;
}
