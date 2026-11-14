// ============================================================================
//  La pellicola: l'immagine della cinematica d'apertura (i loghi e l'intro) con
//  il suo taglio di colore, e sopra la grana, le sporcature e la lampada del
//  proiettore (documento 09, §16). I conti stanno in scatti.ts, e dipendono
//  solo dal tempo: chi la usa chiama `aggiorna(t)` a ogni fotogramma, e la
//  pellicola scrive soltanto stili, attributi e un canvas, a scatti.
//
//  `forza` (0–1) la spegne per gradi: alla fine dell'intro, quando l'immagine
//  diventa il gioco, la pellicola se ne va. `spenta` la toglie (scheda Grafica).
//  La grana segue la scelta «Grana» della scheda Grafica: mossa, ferma o niente.
//  Con il movimento ridotto restano il colore e la grana ferma.
// ============================================================================
import { forwardRef, useEffect, useId, useImperativeHandle, useMemo, useRef, type ReactNode } from "react";
import { BANDA, GRANA, postoGrana, respiro, scatto, sfarfallio, sporcature, taglio } from "./scatti";
import "./pellicola.css";

export interface PellicolaViva {
  /** porta la pellicola all'istante t (secondi), con la sua forza (di suo, piena) */
  aggiorna(t: number, forza?: number): void;
}

interface Proprieta {
  children: ReactNode;
  /** la scelta della scheda Grafica */
  grana?: "mossa" | "ferma" | "no";
  /** senza pellicola: resta l'immagine com'è */
  spenta?: boolean;
  /** movimento ridotto: niente sfarfallio, niente sporcature, grana ferma */
  ridotto?: boolean;
  /** quanta parte dell'altezza, sopra e sotto, sta sotto le bande del formato: lì le sporcature non vanno */
  banda?: number;
  /** il fondo dell'immagine (i loghi: nero). Senza un fondo pieno la grana non ha niente con cui fondersi */
  fondo?: string;
}

/** La tessera della grana: grigi intorno al mezzo tono (in «overlay» non scurisce né schiarisce in media),
 *  sempre gli stessi. */
function tessera(): string {
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas");
  c.width = c.height = GRANA.tessera;
  const g = c.getContext("2d");
  if (!g) return "";
  const d = g.createImageData(GRANA.tessera, GRANA.tessera);
  let seme = 1972;
  const r = () => (seme = (seme * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 128 + (r() + r() + r() - 1.5) * 92;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  return c.toDataURL("image/png");
}

const Pellicola = forwardRef<PellicolaViva, Proprieta>(function Pellicola({ children, grana = "mossa", spenta = false, ridotto = false, banda = BANDA, fondo }, ref) {
  const id = `pellicola-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const immagine = useRef<HTMLDivElement>(null);
  const stratoGrana = useRef<HTMLDivElement>(null);
  const sporco = useRef<HTMLCanvasElement>(null);
  const lampada = useRef<HTMLDivElement>(null);
  const matrice = useRef<SVGFEColorMatrixElement>(null);
  const curve = useRef<(SVGElement | null)[]>([]);
  const stato = useRef({ scatto: -1, forza: -1, tempo: 0 });
  const opzioni = useRef({ grana, spenta, ridotto, banda });
  opzioni.current = { grana, spenta, ridotto, banda };
  const trama = useMemo(() => (spenta || grana === "no" ? "" : tessera()), [spenta, grana]);

  const aggiorna = (t: number, forza = 1) => {
    const o = opzioni.current;
    const s = stato.current;
    s.tempo = t;
    const k = o.spenta ? 0 : Math.max(0, Math.min(1, forza));
    // il colore: solo quando la forza cambia
    if (k !== s.forza) {
      const tg = taglio(k);
      matrice.current?.setAttribute("values", tg.matrice);
      [tg.r, tg.g, tg.b].forEach((v, i) => curve.current[i]?.setAttribute("tableValues", v));
      // a forza zero il filtro non serve: l'immagine torna com'è, e non costa niente
      if (immagine.current) immagine.current.style.filter = k > 0 ? `url(#${id})` : "";
    }
    const f = scatto(t);
    const cambiato = f !== s.scatto || k !== s.forza;
    s.forza = k;
    if (!cambiato) {
      // la lampada respira anche fra uno scatto e l'altro
      if (lampada.current && k > 0 && !o.ridotto) lampada.current.style.opacity = ((sfarfallio(f) + respiro(t)) * k).toFixed(4);
      return;
    }
    s.scatto = f;
    const g = stratoGrana.current;
    if (g) {
      g.style.opacity = o.grana === "no" ? "0" : (GRANA.forza * k).toFixed(4);
      if (o.grana === "mossa" && !o.ridotto) {
        const [x, y] = postoGrana(f);
        g.style.backgroundPosition = `${x}px ${y}px`;
      }
    }
    if (lampada.current) lampada.current.style.opacity = k > 0 && !o.ridotto ? ((sfarfallio(f) + respiro(t)) * k).toFixed(4) : "0";
    const cv = sporco.current;
    if (!cv) return;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W || cv.height !== H) {
      cv.width = W;
      cv.height = H;
    }
    const c = cv.getContext("2d");
    if (!c) return;
    c.clearRect(0, 0, W, H);
    if (k <= 0 || o.ridotto) return;
    const sp = sporcature(f);
    // le sporcature stanno nel quadro, non sotto le bande
    const y0 = o.banda * H, alto = H * (1 - 2 * o.banda), u = W / 1000;
    c.globalAlpha = k;
    for (const gr of sp.granelli) {
      c.fillStyle = gr.chiaro ? `rgba(240,234,218,${gr.alfa})` : `rgba(8,8,10,${gr.alfa})`;
      c.beginPath();
      c.ellipse(gr.x * W, y0 + gr.y * alto, gr.r * u, gr.r * u * gr.schiaccia, gr.gira, 0, Math.PI * 2);
      c.fill();
    }
    if (sp.graffio) {
      c.strokeStyle = sp.graffio.chiaro ? `rgba(235,230,215,${sp.graffio.alfa})` : `rgba(6,6,8,${sp.graffio.alfa * 1.6})`;
      c.lineWidth = Math.max(0.6, 0.55 * u);
      c.beginPath();
      for (const [a, b] of sp.graffio.tratti) {
        c.moveTo(sp.graffio.x * W, y0 + a * alto);
        c.lineTo(sp.graffio.x * W, y0 + b * alto);
      }
      c.stroke();
    }
    if (sp.pelo) {
      const p = sp.pelo.punti.map(([x, y]) => [x * W, y0 + y * alto]);
      c.strokeStyle = `rgba(8,8,10,${sp.pelo.alfa})`;
      c.lineWidth = Math.max(0.6, 0.6 * u);
      c.beginPath();
      c.moveTo(p[0][0], p[0][1]);
      c.bezierCurveTo(p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1]);
      c.stroke();
    }
  };
  useImperativeHandle(ref, () => ({ aggiorna }));

  // quando cambiano le scelte, la pellicola si ridisegna dov'era
  useEffect(() => {
    const s = stato.current;
    const forza = s.forza < 0 ? 1 : s.forza;
    s.scatto = -1;
    s.forza = -1;
    aggiorna(s.tempo, forza);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grana, spenta, ridotto, banda]);

  return (
    <div className="pellicola">
      <svg className="pellicola-filtro" aria-hidden="true" focusable="false">
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix ref={matrice} type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR ref={(e) => void (curve.current[0] = e)} type="table" tableValues="0 1" />
            <feFuncG ref={(e) => void (curve.current[1] = e)} type="table" tableValues="0 1" />
            <feFuncB ref={(e) => void (curve.current[2] = e)} type="table" tableValues="0 1" />
          </feComponentTransfer>
        </filter>
      </svg>
      <div className="pellicola-immagine" ref={immagine} style={fondo ? { background: fondo } : undefined}>
        {children}
      </div>
      {!spenta && (
        <>
          <div className="pellicola-strato pellicola-grana" ref={stratoGrana} aria-hidden="true" style={{ backgroundImage: trama ? `url(${trama})` : undefined, backgroundSize: `${GRANA.tessera}px ${GRANA.tessera}px` }} />
          <canvas className="pellicola-strato" ref={sporco} aria-hidden="true" />
          <div className="pellicola-strato pellicola-lampada" ref={lampada} aria-hidden="true" />
        </>
      )}
    </div>
  );
});

export default Pellicola;
