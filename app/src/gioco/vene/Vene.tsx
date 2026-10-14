// ============================================================================
//  Le vene della membrana sullo schermo (06-app-desktop.md, §3, «C rivista»).
//  Al primo contatto nel vestibolo («per farsi sentire beve dalla tua stessa
//  batteria») le venature entrano dai bordi e crescono, in cinque secondi,
//  intorno al testo e agli strumenti senza attraversarli mai. Con l'energia
//  ripristinata si accendono del tutto. Nella protezione vitale si spengono;
//  nella fuga si lacerano e lampeggiano; nell'ipossia sbiadiscono.
//  Con il movimento ridotto sono ferme e compaiono in dissolvenza.
// ============================================================================
import { useEffect, useRef } from "react";
import type { Clima } from "../../stile/atmosfere";
import { Venature, type Atmosfera, type Zona } from "./venature";

interface Props {
  clima: Clima;
  /** l'energia del relitto è tornata: le venature si accendono */
  energia: boolean;
  ridotto: boolean;
  /** cambia quando la membrana deve crescere adesso (il primo contatto) */
  crescita: number;
}

/** Quanto dura la crescita (la tavola: 5,2 s). */
const DURATA = 5200;

/** Le parti dello schermo che le vene girano intorno, con un margine. */
const ZONE = [".palco .lamina", ".visore .lente", ".visore .strumenti", ".visore .mappa", ".palco .atto"];

function atmosferaDelleVene(c: Clima): Atmosfera {
  if (c.ipossia) return "ipossia";
  if (c.protezione) return "protezione";
  if (c.atmosfera === "fuga") return "fuga";
  return "relitto";
}

export default function Vene({ clima, energia, ridotto, crescita }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const vene = useRef(new Venature());
  const inizio = useRef<number | null>(null);
  const primo = useRef(crescita);
  const membrana = clima.forma === "membrana";

  // la crescita parte quando cambia il segnale, non al caricamento
  useEffect(() => {
    if (crescita !== primo.current) inizio.current = performance.now();
  }, [crescita]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    const schermo = cv.parentElement!;
    let fermo = false;
    let id = 0;
    let misure = "";

    /** Le vene si rigenerano quando cambia la finestra (le zone sono le misure vere). */
    const prepara = () => {
      const r = schermo.getBoundingClientRect();
      const palco = schermo.querySelector(".palco")?.getBoundingClientRect();
      const dpr = devicePixelRatio || 1;
      const chiave = `${r.width}|${r.height}|${dpr}|${palco?.width}`;
      if (chiave === misure) return dpr;
      misure = chiave;
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      const u = (palco?.width ?? r.width) / 100;
      const zone: Zona[] = [];
      for (const sel of ZONE)
        for (const el of schermo.querySelectorAll(sel)) {
          const b = el.getBoundingClientRect();
          if (b.width && b.height) zone.push({ x0: b.left - r.left - 1.2 * u, y0: b.top - r.top - 1.2 * u, x1: b.right - r.left + 1.2 * u, y1: b.bottom - r.top + 1.2 * u });
        }
      // i fili del ramo, sul palco; la fascia del fiore resta libera, come nella
      // tavola: lì le vene corrono sotto il testo, e il fiore aperto ci sta sopra
      if (palco) zone.push({ x0: palco.left - r.left, y0: palco.top - r.top + 45.2 * u, x1: palco.right - r.left, y1: palco.bottom - r.top + 50 });
      vene.current.genera(r.width, r.height, zone, 1, u);
      return dpr;
    };

    const tinta = () => {
      const st = getComputedStyle(schermo);
      return { colori: [st.getPropertyValue("--vena").trim() || "#5fd4dc", st.getPropertyValue("--vena-2").trim() || "#8bf0a2"] as [string, string], luce: energia ? 1 : 0.6 };
    };

    const atm = atmosferaDelleVene(clima);
    const disegna = (t: number) => {
      const dpr = prepara();
      const quanta = inizio.current === null ? 1 : Math.min(1, (t - inizio.current) / DURATA);
      const k = quanta * quanta * (3 - 2 * quanta);
      if (quanta >= 1) inizio.current = null;
      if (k < 1 || atm === "fuga" || atm === "ipossia") vene.current.disegna(g, t, k, atm, dpr, tinta());
      else vene.current.disegnaConCache(g, t, atm, dpr, tinta());
    };

    if (!membrana) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, cv.width, cv.height);
      return;
    }
    // solo nello sviluppo: un fotogramma della crescita a una frazione data (0–1),
    // per guardarla quando il pannello è nascosto e il ciclo non gira
    if (import.meta.env.DEV)
      (window as unknown as Record<string, unknown>).__vene = (k: number) => {
        fermo = true;
        vene.current.disegna(g, performance.now(), k, atm, prepara(), tinta());
        return `${vene.current.numero} vene, ${vene.current.punti} punti`;
      };
    if (ridotto) {
      const dpr = prepara();
      vene.current.ferme(g, atm, dpr, tinta());
      inizio.current = null;
      const ridisegna = () => vene.current.ferme(g, atm, prepara(), tinta());
      addEventListener("resize", ridisegna);
      return () => removeEventListener("resize", ridisegna);
    }
    const ciclo = (t: number) => {
      if (fermo) return;
      disegna(t);
      id = requestAnimationFrame(ciclo);
    };
    id = requestAnimationFrame(ciclo);
    return () => {
      fermo = true;
      cancelAnimationFrame(id);
    };
  }, [membrana, clima.atmosfera, clima.protezione, clima.ipossia, clima.stanza, energia, ridotto]); // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={ref} className={`vene${membrana ? " accese" : ""}`} aria-hidden="true" />;
}
