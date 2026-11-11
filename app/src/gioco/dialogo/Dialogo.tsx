// ============================================================================
//  Il dialogo (06-app-desktop.md, §4.5 e §4.7; la tavola della membrana, §02).
//  La vista diventa grande: Yusuf al comunicatore, l'onda della voce giovane
//  che gira su sé stessa, la figura dell'Anziano fatta di punti, i bordi che
//  si sfanno «come una fotografia esposta troppe volte». Le risposte sono semi
//  numerati, da 1 a 9 sulla tastiera, uno sotto l'altro sotto le battute. Yusuf ha il suo ritratto, quello del
//  sequel (il comunicatore del Magazzino Quattro); le altre viste definitive
//  sono della fase 5.
// ============================================================================
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cicloA, FOTOGRAMMI } from "../ritmo";
import type { Forma } from "../../stile/atmosfere";
import type { SceltaModello } from "../../azione/modello";
import type { Blocco, Segmento } from "../lamina/grammatica";
import { generatore } from "../../intro/glifi";
import { DURATA, type Arrivo } from "./apparizione";
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
  /** la modalità a solo testo: al posto dei semi c'è la riga di comando (le risposte stanno nel testo) */
  riga?: ReactNode;
  /** come compare la figura quando il colloquio si apre (oggi solo l'Anziano): la prima volta della partita
   *  l'apparizione intera, le altre quella breve; niente se si riprende un colloquio a metà */
  arrivo?: Arrivo;
}

const CHI: Record<string, string> = { anziano: "l’Anziano", yusuf: "Yusuf", eco: "l’eco" };

export default function Dialogo({ personaggio, blocchi, detto, scelte, forma, ridotto, scegli, riga, arrivo }: Props) {
  const primoSeme = useRef<HTMLButtonElement>(null);
  const chiave = blocchi.map((b) => b.sorgente).join("|");
  // L'apparizione si decide quando il colloquio si apre, e non cambia con le battute. Le parole compaiono
  // soltanto ad apparizione finita, in dissolvenza (l'autore, 11 novembre 2026): prima c'è solo la figura
  // che si forma. Al primo incontro finisce quando, nel suono, il canto lascia il posto alla sua voce. Un
  // clic o un tasto la chiudono subito.
  const arrivoIniziale = useRef<Arrivo>(personaggio === "anziano" && !ridotto ? (arrivo ?? null) : null).current;
  // l'apparizione in corso: quale, e quante ne sono partite (nello sviluppo la si può rivedere)
  const [apparizione, setApparizione] = useState<{ tipo: "primo" | "ritorno"; n: number } | null>(arrivoIniziale ? { tipo: arrivoIniziale, n: 1 } : null);
  const [formata, setFormata] = useState(arrivoIniziale === null);
  const [salta, setSalta] = useState(0);
  useEffect(() => {
    if (formata || !apparizione) return;
    const subito = () => {
      setSalta((n) => n + 1);
      setFormata(true);
    };
    addEventListener("keydown", subito);
    addEventListener("pointerdown", subito);
    // se il disegno non gira (la finestra nascosta, la tela che non parte) le parole arrivano lo stesso
    const comunque = setTimeout(() => setFormata(true), (DURATA[apparizione.tipo] + 2.5) * 1000);
    return () => {
      removeEventListener("keydown", subito);
      removeEventListener("pointerdown", subito);
      clearTimeout(comunque);
    };
  }, [formata, apparizione]);
  // solo nello sviluppo: un clic sulla figura la fa apparire di nuovo, con le parole che aspettano
  const rivedi = import.meta.env.DEV && personaggio === "anziano" && !ridotto
    ? (tipo: "primo" | "ritorno") => {
        setFormata(false);
        setApparizione((a) => ({ tipo, n: (a?.n ?? 0) + 1 }));
      }
    : undefined;
  // il fuoco sul primo seme a ogni battuta nuova (e quando le parole arrivano)
  useEffect(() => {
    if (formata) primoSeme.current?.focus({ preventScroll: true });
  }, [chiave, formata]);
  const battute = blocchi.filter((b) => b.tipo === "dialogo");
  const narrazione = blocchi.filter((b) => b.tipo === "paragrafo");
  return (
    <section className={`dialogo dialogo-${personaggio}`} data-forma={forma} aria-label={`Dialogo con ${CHI[personaggio] ?? personaggio}`}>
      <Vista personaggio={personaggio} ridotto={ridotto} apparizione={apparizione} salta={salta} allaFine={() => setFormata(true)} rivedi={rivedi} />
      <div className={`sinistra${formata ? "" : " attesa"}`} inert={!formata}>
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
      {riga ?? (
      <nav className="semi" aria-label="Le risposte">
        {scelte.map((s, i) => (
          <button key={s.comando} ref={i === 0 ? primoSeme : undefined} type="button" data-comando={s.comando} className={s.comando === "esci" ? "esci" : ""} onClick={() => scegli(s)} aria-keyshortcuts={s.tasto ?? undefined}>
            {s.tasto && <span className="numero">{s.tasto}</span>}
            {s.etichetta.replace(/'/g, "’")}
          </button>
        ))}
      </nav>
      )}
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

interface DatiVista {
  personaggio: string;
  ridotto: boolean;
  /** l'apparizione da far partire (un numero nuovo la fa ripartire) */
  apparizione?: { tipo: "primo" | "ritorno"; n: number } | null;
  /** un clic o un tasto: la figura è subito intera */
  salta?: number;
  /** l'apparizione è finita: adesso le parole */
  allaFine?: () => void;
  /** solo nello sviluppo: rivederla */
  rivedi?: (tipo: "primo" | "ritorno") => void;
}

function Vista({ personaggio, ridotto, apparizione: chiesta = null, salta = 0, allaFine, rivedi }: DatiVista) {
  const ref = useRef<HTMLCanvasElement>(null);
  // l'apparizione in corso: di che tipo, e da quale fotogramma è cominciata (lo dice il primo disegno)
  const apparizione = useRef<{ tipo: "primo" | "ritorno"; da: number | null } | null>(null);
  const fine = useRef(allaFine);
  fine.current = allaFine;
  const numero = chiesta?.n ?? 0;
  const tipo = chiesta?.tipo ?? null;
  useEffect(() => {
    apparizione.current = tipo ? { tipo, da: null } : null;
  }, [numero, tipo]);
  // un clic o un tasto: la figura è subito intera
  useEffect(() => {
    if (salta) apparizione.current = null;
  }, [salta]);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d")!;
    // i colori, letti una volta (revisione 25, M10)
    const st = getComputedStyle(cv);
    const c1 = st.getPropertyValue("--vena").trim() || "#5fd4dc";
    const c2 = st.getPropertyValue("--accento-2").trim() || "#8bf0a2";
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
      if (personaggio === "anziano") {
        const a = apparizione.current;
        let s: number | null = null;
        if (a) {
          if (a.da === null) a.da = t;
          s = (t - a.da) / 1000;
          if (s >= DURATA[a.tipo]) {
            apparizione.current = null;
            s = null;
            fine.current?.();
          }
        }
        anziano(g, w, h, t, a && s !== null ? { tipo: a.tipo, s } : null);
      } else if (personaggio === "eco") eco(g, w, h, t, c1, c2);
      else comunicatore(g, w, h, t, c2);
    };
    disegna(ridotto ? 0 : performance.now());
    if (ridotto) return;
    return cicloA(FOTOGRAMMI, disegna);
  }, [personaggio, ridotto]);
  const etichetta = personaggio === "anziano" ? "La figura dell’Anziano, fatta di punti di luce" : personaggio === "eco" ? "L’onda della registrazione, che gira su se stessa" : "Il comunicatore: Yusuf, dal Magazzino Quattro";
  return (
    <div className="vista">
      {personaggio === "yusuf" && (
        <div className="ritratto" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}viste/yusuf.webp`} alt="" draggable={false} />
        </div>
      )}
      {/* nello sviluppo un clic sulla figura la fa apparire di nuovo, per guardarla */}
      <canvas
        ref={ref}
        role="img"
        aria-label={etichetta}
        onClick={rivedi ? (e) => rivedi(e.shiftKey ? "ritorno" : "primo") : undefined}
      />
      {personaggio === "yusuf" && <div className="canale">canale · magazzino quattro</div>}
    </div>
  );
}

const blocca = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Da 0 a 1, morbido ai due capi. */
const morbido = (x: number) => {
  const c = blocca(x);
  return c * c * (3 - 2 * c);
};
/** Parte piano, corre, arriva piano. */
const cubica = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/** I tre cerchi del pavimento (su una vista larga 600). */
const ANELLI = [60, 120, 190];
/** Quanti giri fa un punto intorno al sostegno mentre sale. */
const GIRI = 1.25;
/** Quando la figura si è chiusa un'onda si allarga sul pavimento, per nove decimi. */
const ONDA_DA = 3.7;
const ONDA_DURA = 0.9;

/**
 * L'Anziano. Senza apparizione è la figura di sempre: i punti al loro posto, i bordi che si sfanno.
 *
 * Il primo incontro (`primo`, 4,6 s). Il pavimento si traccia: i tre cerchi, uno dopo l'altro, e i raggi dal
 * centro. Il sostegno sale. Poi i punti nascono sulle linee del pavimento, salgono girando intorno al sostegno
 * e si chiudono nella figura, dalla base alla testa: ognuno ha la sua scia. Quando la testa è chiusa l'alone
 * si accende e un'onda si allarga sul pavimento. Tutto succede mentre nel suono canta il primo contatto.
 *
 * Le altre volte (`ritorno`, 2 s) i punti rientrano da poco lontano, dal basso verso l'alto.
 */
function anziano(g: CanvasRenderingContext2D, w: number, h: number, t: number, ap: { tipo: "primo" | "ritorno"; s: number } | null = null) {
  const primo = ap?.tipo === "primo" ? ap.s : null;
  const ritorno = ap?.tipo === "ritorno" ? ap.s : null;
  const cx = w * 0.5;
  const fy = h * 0.9;
  const k = w / 600;
  // il pavimento: la geometria stellare del Ponte, ridotta a qualcosa di intimo
  g.save();
  g.translate(cx, fy);
  g.scale(1, 0.28);
  // mentre i punti nascono le linee sono più vive
  const vive = primo === null ? 0 : morbido(primo / 0.5) * (1 - morbido((primo - 2.8) / 1.1));
  g.strokeStyle = `rgba(95,212,220,${0.22 + 0.3 * vive})`;
  g.lineWidth = 1;
  ANELLI.forEach((rr, n) => {
    const f = primo === null ? 1 : cubica(blocca((primo - n * 0.14) / 0.85));
    if (f <= 0) return;
    g.beginPath();
    g.arc(0, 0, rr * k, -Math.PI / 2, -Math.PI / 2 + f * 2 * Math.PI);
    g.stroke();
  });
  for (let n = 0; n < 10; n++) {
    const f = primo === null ? 1 : cubica(blocca((primo - 0.25 - n * 0.035) / 0.6));
    if (f <= 0) continue;
    const a = (n / 10) * 6.28 + t / 30000;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(Math.cos(a) * 200 * k * f, Math.sin(a) * 200 * k * f);
    g.stroke();
  }
  if (primo !== null && primo > ONDA_DA && primo < ONDA_DA + ONDA_DURA) {
    const f = (primo - ONDA_DA) / ONDA_DURA;
    g.strokeStyle = `rgba(244,235,208,${0.5 * (1 - f)})`;
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(0, 0, (30 + 210 * (1 - (1 - f) ** 3)) * k, 0, 7);
    g.stroke();
  }
  g.restore();
  // il sostegno, che sale dal pavimento
  const su = primo === null ? 1 : cubica(blocca((primo - 0.2) / 0.8));
  g.fillStyle = "rgba(160,200,200,.10)";
  g.fillRect(cx - 3, fy - h * 0.28 * su, 6, h * 0.28 * su);
  const H = h * 0.66;
  const top = h * 0.06;
  // una colonna di luce sale lungo il sostegno insieme alla figura, e si spegne quando è chiusa: è la forma
  // grande, quella che si legge anche da lontano (i punti da soli sono fini)
  if (primo !== null && primo > 0.9 && primo < 4.5) {
    const fronte = blocca((primo - 1.4) / 2.3); // dove è arrivata la figura: 0 alla base, 1 alla testa
    const cima = fy - (fy - top) * (0.25 + 0.75 * fronte);
    const forza = 0.13 * morbido((primo - 0.9) / 1.1) * (1 - morbido((primo - 3.6) / 0.9));
    g.save();
    g.translate(cx, (cima + fy) / 2);
    g.scale(H * 0.2, (fy - cima) / 2);
    const colonna = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    colonna.addColorStop(0, `rgba(175,230,226,${forza})`);
    colonna.addColorStop(1, "rgba(175,230,226,0)");
    g.fillStyle = colonna;
    g.fillRect(-1, -1, 2, 2);
    g.restore();
  }
  // dove sta un punto in volo, a `p` del suo viaggio: dal pavimento, girando intorno al sostegno, al suo posto
  let px = 0;
  let py = 0;
  const volo = (q: (typeof FIGURA)[number], p: number) => {
    const e = cubica(p);
    const angolo = (q.v >= 0 ? 0 : Math.PI) + (1 - e) * (q.d * 6.283 + GIRI * 6.283);
    const r0 = ANELLI[Math.min(2, Math.floor(q.z * 3))] * k;
    const r = r0 + (Math.abs(q.v) * H * 0.24 - r0) * e + Math.sin(Math.PI * e) * w * 0.025;
    px = cx + r * Math.cos(angolo);
    py = fy + (top + q.u * H - fy) * e ** 0.85 + r * Math.sin(angolo) * 0.28 * (1 - e);
  };
  for (const q of FIGURA) {
    const bordo = Math.abs(q.v) > 0.3 || q.u > 0.7;
    const alfa = 0.18 + q.z * 0.55;
    const colore = q.z > 0.82 ? "#F4EBD0" : "#AFE6E2";
    // quanto il punto è fermo al suo posto: i bordi cominciano a sfarsi dopo l'arrivo
    let posato = 1;
    if (primo !== null) {
      // dalla base (u = 1) alla testa (u = 0)
      const parte = 0.4 + (1 - q.u) * 1.75 + ((q.z * 7.13) % 1) * 0.2;
      const dura = 1.3 + ((q.d * 3.71) % 1) * 0.25;
      const p = (primo - parte) / dura;
      if (p <= 0) continue;
      if (p < 1) {
        const nasce = Math.min(1, p / 0.12);
        g.fillStyle = colore;
        volo(q, p);
        // in volo il punto è più grande e più vivo, e si porta dietro la scia
        g.globalAlpha = Math.min(1, alfa * (2.2 - 1.2 * p) + 0.12) * nasce;
        g.fillRect(px, py, 2.3 - 0.9 * p, 2.3 - 0.9 * p);
        if (p > 0.06) {
          volo(q, p - 0.035);
          g.globalAlpha = (alfa * 0.6 + 0.05) * nasce;
          g.fillRect(px, py, 1.6, 1.6);
        }
        if (p > 0.1) {
          volo(q, p - 0.07);
          g.globalAlpha = alfa * 0.3 * nasce;
          g.fillRect(px, py, 1.3, 1.3);
        }
        continue;
      }
      posato = blocca((primo - parte - dura) / 0.6);
    } else if (ritorno !== null) {
      const parte = (1 - q.u) * 0.5;
      const dura = 1 + ((q.d * 3.71) % 1) * 0.4;
      const p = (ritorno - parte) / dura;
      if (p <= 0) continue;
      if (p < 1) {
        const manca = (1 - p) ** 3;
        g.fillStyle = colore;
        g.globalAlpha = alfa * (1 - manca);
        g.fillRect(cx + q.v * H * 0.24 + (q.v >= 0 ? 1 : -1) * (30 + q.z * 60) * k * manca, top + q.u * H + (20 + q.d * 30) * k * manca, 1.4, 1.4);
        continue;
      }
      posato = blocca((ritorno - parte - dura) / 0.6);
    }
    const deriva = bordo ? ((t / 5000 + q.d) % 1) * posato : 0;
    const x = cx + q.v * H * 0.24 + (bordo ? Math.sign(q.v) * deriva * 26 : 0) + Math.sin(t / 900 + q.z * 9) * 0.6;
    const y = top + q.u * H - (bordo ? deriva * 14 : 0);
    g.globalAlpha = alfa * (bordo ? 1 - deriva : 1);
    g.fillStyle = colore;
    g.fillRect(x, y, 1.4, 1.4);
  }
  // l'alone: si accende quando la testa è chiusa, un poco di più, e si posa
  const calore =
    primo !== null
      ? primo < 3.9
        ? morbido((primo - 3) / 0.9) * 1.7
        : 1 + 0.7 * (1 - morbido((primo - 3.9) / 0.7))
      : ritorno !== null
        ? morbido(ritorno / 1.6)
        : 1;
  const al = g.createRadialGradient(cx, top + H * 0.35, 0, cx, top + H * 0.35, H * 0.55);
  al.addColorStop(0, `rgba(244,235,208,${0.1 * calore})`);
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
