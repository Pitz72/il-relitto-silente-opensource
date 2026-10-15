// ============================================================================
//  Il dialogo (06-app-desktop.md, §4.5 e §4.7; la tavola della membrana, §02).
//  La vista diventa grande: Yusuf al comunicatore, l'onda della voce giovane
//  che gira su sé stessa, la figura dell'Anziano fatta di punti, i bordi che
//  si sfanno «come una fotografia esposta troppe volte». Le risposte sono semi
//  numerati, da 1 a 9 sulla tastiera, uno sotto l'altro sotto le battute. Yusuf ha il suo ritratto, quello del
//  sequel (il comunicatore del Magazzino Quattro); le altre viste definitive
//  sono della fase 5.
// ============================================================================
import { useEffect, useRef } from "react";
import type { Forma } from "../../stile/atmosfere";
import type { SceltaModello } from "../../azione/modello";
import type { Blocco, Segmento } from "../lamina/grammatica";
import { generatore } from "../../intro/glifi";
import "./dialogo.css";

interface Props {
  personaggio: string;
  /** i blocchi del turno: le battute, e la narrazione che le accompagna */
  blocchi: readonly Blocco[];
  /** la risposta appena data, come si legge */
  detto: string | null;
  scelte: readonly SceltaModello[];
  forma: Forma;
  ridotto: boolean;
  scegli: (s: SceltaModello) => void;
}

const CHI: Record<string, string> = { anziano: "l’Anziano", yusuf: "Yusuf", eco: "l’eco" };

export default function Dialogo({ personaggio, blocchi, detto, scelte, forma, ridotto, scegli }: Props) {
  const primoSeme = useRef<HTMLButtonElement>(null);
  const chiave = blocchi.map((b) => b.sorgente).join("|");
  // il fuoco sul primo seme a ogni battuta nuova
  useEffect(() => {
    primoSeme.current?.focus({ preventScroll: true });
  }, [chiave]);
  const battute = blocchi.filter((b) => b.tipo === "dialogo");
  const narrazione = blocchi.filter((b) => b.tipo === "paragrafo");
  return (
    <section className={`dialogo dialogo-${personaggio}`} data-forma={forma} aria-label={`Dialogo con ${CHI[personaggio] ?? personaggio}`}>
      <Vista personaggio={personaggio} ridotto={ridotto} />
      <div className="sinistra">
      <div className="parole">
        <div className="chi">{CHI[personaggio] ?? personaggio}</div>
        {detto && <div className="detto">› {detto}</div>}
        <div className="battute" aria-live="polite">
          {narrazione.map((b, i) => (
            <p key={`n${i}`} className="narrazione">
              <Segmenti s={b.tipo === "paragrafo" ? b.segmenti : []} />
            </p>
          ))}
          {battute.map((b, i) => (
            <p key={i} className="battuta">
              <Segmenti s={b.tipo === "dialogo" ? b.segmenti : []} />
            </p>
          ))}
        </div>
      </div>
      <nav className="semi" aria-label="Le risposte">
        {scelte.map((s, i) => (
          <button key={s.comando} ref={i === 0 ? primoSeme : undefined} type="button" data-comando={s.comando} className={s.comando === "esci" ? "esci" : ""} onClick={() => scegli(s)} aria-keyshortcuts={s.tasto ?? undefined}>
            {s.tasto && <span className="numero">{s.tasto}</span>}
            {s.etichetta.replace(/'/g, "’")}
          </button>
        ))}
      </nav>
      </div>
    </section>
  );
}

function Segmenti({ s }: { s: readonly Segmento[] }) {
  return (
    <>
      {s.map((x, i) =>
        x.tipo === "testo" ? (
          <span key={i} className="racconto">
            {x.testo}
          </span>
        ) : (
          <span key={i} className={`s-${x.tipo}`}>
            {x.testo}
          </span>
        ),
      )}
    </>
  );
}

// ----------------------------------------------------------------------------
//  La vista: l'Anziano, il comunicatore, l'eco
// ----------------------------------------------------------------------------
/** La figura dell'Anziano: alta e sottile, la testa allungata, gli arti lunghi;
 *  la veste che si sfa in basso (dalla tavola della membrana). */
const FIGURA = (() => {
  const r = generatore(29);
  const p: { u: number; v: number; z: number; d: number }[] = [];
  const sagoma = (u: number, v: number) => {
    const a = Math.abs(v);
    if (u < 0.15) return (a / 0.2) ** 2 + ((u - 0.075) / 0.075) ** 2 < 1;
    if (u < 0.2) return a < 0.055;
    if (u < 0.25) return a < 0.06 + ((u - 0.2) / 0.05) * 0.2;
    if (u < 0.66 && Math.abs(a - (0.31 + (u - 0.25) * 0.14)) < 0.028) return true;
    if (u < 0.66 && u > 0.43 && Math.abs(a - (0.37 + (u - 0.43) * 0.1)) < 0.03) return true;
    if (u < 0.56) return a < 0.25 - (u - 0.25) * 0.16;
    return a < 0.2 + (u - 0.56) * 0.55 && r() > (u - 0.56) * 1.5;
  };
  while (p.length < 3200) {
    const u = r();
    const v = r() * 2 - 1;
    if (sagoma(u, v)) p.push({ u, v, z: r(), d: r() });
  }
  return p;
})();

function Vista({ personaggio, ridotto }: { personaggio: string; ridotto: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    let fermo = false;
    let id = 0;
    const disegna = (t: number) => {
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      const s = devicePixelRatio || 1;
      if (cv.width !== Math.round(w * s)) {
        cv.width = Math.round(w * s);
        cv.height = Math.round(h * s);
      }
      g.setTransform(s, 0, 0, s, 0, 0);
      g.clearRect(0, 0, w, h);
      const st = getComputedStyle(cv);
      const c1 = st.getPropertyValue("--vena").trim() || "#5fd4dc";
      const c2 = st.getPropertyValue("--accento-2").trim() || "#8bf0a2";
      if (personaggio === "anziano") anziano(g, w, h, t);
      else if (personaggio === "eco") eco(g, w, h, t, c1, c2);
      else comunicatore(g, w, h, t, c2);
    };
    disegna(ridotto ? 0 : performance.now());
    if (ridotto) return;
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
  }, [personaggio, ridotto]);
  const etichetta = personaggio === "anziano" ? "La figura dell’Anziano, fatta di punti di luce" : personaggio === "eco" ? "L’onda della registrazione, che gira su se stessa" : "Il comunicatore: Yusuf, dal Magazzino Quattro";
  return (
    <div className="vista">
      {personaggio === "yusuf" && (
        <div className="ritratto" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}viste/yusuf.webp`} alt="" draggable={false} />
        </div>
      )}
      <canvas ref={ref} role="img" aria-label={etichetta} />
      {personaggio === "yusuf" && <div className="canale">canale · magazzino quattro</div>}
    </div>
  );
}

function anziano(g: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // il pavimento: la geometria stellare del Ponte, ridotta a qualcosa di intimo
  g.save();
  g.translate(w * 0.5, h * 0.9);
  g.scale(1, 0.28);
  g.strokeStyle = "rgba(95,212,220,.22)";
  g.lineWidth = 1;
  for (const rr of [60, 120, 190]) {
    g.beginPath();
    g.arc(0, 0, (rr * w) / 600, 0, 7);
    g.stroke();
  }
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * 6.28 + t / 30000;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo((Math.cos(a) * 200 * w) / 600, (Math.sin(a) * 200 * w) / 600);
    g.stroke();
  }
  g.restore();
  g.fillStyle = "rgba(160,200,200,.10)";
  g.fillRect(w * 0.5 - 3, h * 0.62, 6, h * 0.28);
  const H = h * 0.66;
  const cx = w * 0.5;
  const top = h * 0.06;
  for (const q of FIGURA) {
    const bordo = Math.abs(q.v) > 0.3 || q.u > 0.7;
    const deriva = bordo ? (t / 5000 + q.d) % 1 : 0;
    const x = cx + q.v * H * 0.24 + (bordo ? Math.sign(q.v) * deriva * 26 : 0) + Math.sin(t / 900 + q.z * 9) * 0.6;
    const y = top + q.u * H - (bordo ? deriva * 14 : 0);
    g.globalAlpha = (0.18 + q.z * 0.55) * (bordo ? 1 - deriva : 1);
    g.fillStyle = q.z > 0.82 ? "#F4EBD0" : "#AFE6E2";
    g.fillRect(x, y, 1.4, 1.4);
  }
  const al = g.createRadialGradient(cx, top + H * 0.35, 0, cx, top + H * 0.35, H * 0.55);
  al.addColorStop(0, "rgba(244,235,208,.10)");
  al.addColorStop(1, "rgba(244,235,208,0)");
  g.globalAlpha = 1;
  g.fillStyle = al;
  g.fillRect(0, 0, w, h);
}

/** L'eco del Piccolo: solo l'onda della registrazione, che gira su se stessa. */
function eco(g: CanvasRenderingContext2D, w: number, h: number, t: number, c1: string, c2: string) {
  const cx = w * 0.5;
  const cy = h * 0.48;
  const R = Math.min(w, h) * 0.26;
  for (const [alfa, spessore, fase] of [
    [0.12, 7, 0],
    [0.7, 1.4, 0],
    [0.35, 1, 1.7],
  ] as const) {
    g.beginPath();
    for (let k = 0; k <= 240; k++) {
      const a = (k / 240) * Math.PI * 2;
      const voce = Math.sin(a * 9 + t / 420 + fase) * Math.sin(a * 2 - t / 1700) * 0.12 + Math.sin(a * 23 + t / 260) * 0.02;
      const r = R * (1 + voce);
      const x = cx + Math.cos(a + t / 6000) * r;
      const y = cy + Math.sin(a + t / 6000) * r;
      if (k) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.strokeStyle = fase ? c2 : c1;
    g.globalAlpha = alfa;
    g.lineWidth = spessore;
    g.stroke();
  }
  g.globalAlpha = 1;
}

/** Il comunicatore della Santa Maria: sopra il ritratto di Yusuf, in una fascia
 *  in basso, l'onda della voce sul canale. */
function comunicatore(g: CanvasRenderingContext2D, w: number, h: number, t: number, colore: string) {
  const alto = h * 0.78;
  const y0 = h * 0.89;
  const fascia = g.createLinearGradient(0, alto, 0, h);
  fascia.addColorStop(0, "rgba(4,6,6,0)");
  fascia.addColorStop(0.45, "rgba(4,6,6,.62)");
  fascia.addColorStop(1, "rgba(4,6,6,.8)");
  g.fillStyle = fascia;
  g.fillRect(0, alto, w, h - alto);
  g.strokeStyle = colore;
  g.globalAlpha = 0.85;
  g.lineWidth = 1.4;
  g.beginPath();
  for (let x = 0; x <= w; x += 2) {
    const u = x / w;
    const inviluppo = Math.max(0, Math.sin(t / 900 + u * 3)) * Math.sin(u * Math.PI);
    const y = y0 + Math.sin(u * 80 + t / 60) * h * 0.05 * inviluppo + Math.sin(u * 31 - t / 90) * h * 0.012 * inviluppo;
    if (x) g.lineTo(x, y);
    else g.moveTo(x, y);
  }
  g.stroke();
  g.globalAlpha = 1;
}
