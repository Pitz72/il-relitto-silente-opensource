// ============================================================================
//  L'intro, nella sua prima forma: l'animatic (09-intro-storyboard.md, §9).
//  Tutte le scene, cronometrate sulla scaletta (scaletta.ts), a bassa qualità
//  dove la scena definitiva non c'è ancora:
//    A  la spia e i testi                              definitiva nella forma
//    B  il margine, nel motore della scala              motore definitivo
//    C  il radar sulla console, le stelle che si spengono  quadri fermi della tavola, radar e stelle dal vivo
//    D  il faro                                         quadri fermi della tavola
//    E  la scala                                        motore definitivo
//    F  la traccia sul quadro finale                    definitiva nella forma
//    G  i glifi e il titolo                             definitiva nella forma
//    H  la plancia e l'interfaccia d'acciaio            quadri fermi e una prima interfaccia
//  Il suono non c'è ancora: lo raccontano i sottotitoli dei suoni (§2.5), che
//  nell'app saranno un'opzione per chi non sente.
//  Si salta con Esc, Spazio o un clic. Con il movimento ridotto ogni scena ha
//  la sua versione (§2.5 e scena per scena nello storyboard).
//  Ogni fotogramma si disegna fuori da React: lo stato di React serve solo
//  alla barra di revisione.
// ============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { glifiDelTitolo } from "./glifi";
import { Scala } from "./scala";
import { introSuono } from "./suono";
import {
  SCALETTA,
  SOTTOTITOLO,
  TITOLO,
  formatoTempo,
  fra,
  morbido,
  opacitaBlocco,
  scenaA,
  type Blocco,
} from "./scaletta";
import "./intro.css";

const S = SCALETTA;
const M = S.momenti;
const BANDA = (1 - 16 / 9 / 2.39) / 2; // 0,128 dell'altezza del palco
const IMG = { w: 1280, h: 535 }; // i quadri fermi della tavola

/** Un punto di un quadro fermo (in pixel dell'immagine) sul palco (0–1). */
const sulPalco = (x: number, y: number) => ({ x: x / IMG.w, y: BANDA + (y / IMG.h) * (1 - 2 * BANDA) });

// Le misure dei quadri della plancia (strumenti/intro/plancia.py e la tavola)
const RADAR = { centro: sulPalco(564, 464), raggio: 58 / IMG.w };
const SPIA_ROSSA = sulPalco(707, 486);
const STELLE_OBLO = [sulPalco(575, 286), sulPalco(655, 241), sulPalco(735, 216), sulPalco(820, 190)];
const OBLO_PLANCIA = { x: 771 / IMG.w, y: 254 / IMG.h }; // nel quadro, 0–1
// La spia verde: in A poco sopra il centro; in F nel nero del fuso, sopra il testo e sopra il punto
// della nave (il bordo del fuso, al centro, è a 0,32 del palco; il punto a 0,51).
const SPIA_A = { x: 0.5, y: 0.455 };
const SPIA_F = { x: 0.5, y: 0.365 };
// Gli echi del radar: (angolo in gradi, raggio 0–1). Nessuno nel settore muto.
const ECHI = [[100, 0.42], [128, 0.71], [151, 0.33], [205, 0.86], [236, 0.55], [262, 0.24], [301, 0.78], [338, 0.62]];
const SETTORE_MUTO = [-55, 10]; // gradi, in senso orario dall'asse x
// I battiti: in A il cuore di L.V., che rallenta e si ferma al quarto colpo; in F la cosa viva.
const BATTITI_A = [M.battito[0], M.battito[0] + 0.95, M.battito[0] + 1.95, M.battito[0] + 3.0];

const PLANCIA_TESTO =
  "La plancia della Santa Maria: due poltrone, e ne usi una; schermi che conosci a memoria; sotto il pavimento, il lamento basso del reattore. Sul quadrante del margine la lancetta sta dove hai imparato a non guardarla. Nell’oblò, contro le stelle, c’è una sagoma nera che non ne lascia passare nessuna.";

interface Opzioni {
  ridotto: boolean;
  sottotitoli: boolean;
  ridotta: boolean;
}

const preferisceMenoMovimento = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Un colpo di battito: due impulsi (il doppio colpo del cuore), morbidi. */
function impulso(t: number, colpi: number[]): number {
  let v = 0;
  for (const c of colpi) {
    for (const [d, a] of [[0, 1], [0.28, 0.6]]) {
      const x = t - c - d;
      if (x >= 0 && x < 0.9) v = Math.max(v, a * Math.exp(-x / 0.18) * Math.min(1, x / 0.04));
    }
  }
  return v;
}

/** Il quadro della nave che entra nel margine: il tempo del motore per un istante dell'intro. */
function tempoMargine(t: number, calibra: { t0: number; k: number; meta: number }, ridotto: boolean) {
  return ridotto ? calibra.meta : calibra.t0 + (t - M.naveB) * calibra.k;
}

export default function Intro({ revisione = false, onFine, ridotto }: { revisione?: boolean; onFine?: () => void; ridotto?: boolean }) {
  const palco = useRef<HTMLDivElement>(null);
  const spazio = useRef<HTMLCanvasElement>(null);
  const sopra = useRef<HTMLCanvasElement>(null);
  const motore = useRef<Scala | null>(null);
  const calibra = useRef({ t0: 0, k: 1, meta: 0 });
  const quadri = useRef<Record<string, HTMLDivElement | null>>({});
  const testi = useRef<Record<string, HTMLDivElement | null>>({});
  const acciaio = useRef<HTMLDivElement>(null);
  const lente = useRef<HTMLDivElement>(null);
  const lenteVicina = useRef<HTMLImageElement>(null);
  const bande = useRef<(HTMLDivElement | null)[]>([]);
  const suono = useRef<HTMLDivElement>(null);
  const salta = useRef<HTMLDivElement>(null);
  const annuncio = useRef<HTMLDivElement>(null);

  const tempo = useRef(0);
  const pausa = useRef(false);
  const finita = useRef(false);
  // il movimento ridotto: l'opzione dell'app, se arriva dal gioco; se no, il sistema
  const [opzioni, setOpzioni] = useState<Opzioni>(() => ({ ridotto: ridotto ?? preferisceMenoMovimento(), sottotitoli: revisione, ridotta: false }));
  const opz = useRef(opzioni);
  opz.current = opzioni;
  const [pronta, setPronta] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [mostrato, setMostrato] = useState(0);
  const [inPausa, setInPausa] = useState(false);
  const [fps, setFps] = useState<string>("");
  const glifi = useMemo(() => glifiDelTitolo(TITOLO), []);

  // ---- la preparazione: il motore, le immagini, i cieli --------------------------
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        // in sviluppo React monta due volte: il motore (e il suo contesto WebGL) resta uno
        const m = motore.current ?? new Scala(spazio.current!);
        motore.current = m;
        const base = new URL("./intro/", location.href).href;
        await m.carica(`${base}poppa.webp`, `${base}prua.webp`);
        await Promise.all(
          Object.values(quadri.current)
            .flatMap((d) => [...(d?.querySelectorAll("img") ?? [])])
            .concat(lenteVicina.current ? [lenteVicina.current] : [])
            .map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))),
        );
        m.prepara("margine");
        m.prepara("scala");
        // la nave del margine: entra da destra quando comincia B e ha attraversato il quadro alla fine
        const cerca = (x: number) => {
          let lo = -60, hi = 60;
          for (let i = 0; i < 60; i++) {
            const mid = (lo + hi) / 2;
            if (m.proietta("margine", mid).x > x) lo = mid;
            else hi = mid;
          }
          return (lo + hi) / 2;
        };
        const t0 = cerca(1.12), t1 = cerca(0.16);
        calibra.current = { t0, k: (t1 - t0) / (S.scene[2].inizio - M.naveB), meta: cerca(0.56) };
        if (vivo) setPronta(true);
      } catch (e) {
        if (!vivo) return;
        setErrore(String(e instanceof Error ? e.message : e));
        // senza WebGL2 (o con le immagini che non si caricano) l'intro non si può vedere: si va
        // al gioco invece di restare sul messaggio (revisione 25, M7). Nella revisione resta.
        console.warn("[intro] si salta:", e);
        if (!revisione) onFine?.();
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  // il contesto WebGL perso a metà (un driver aggiornato, il ritorno dalla sospensione: revisione
  // 25, L10): l'intro non si può più vedere, e si va al gioco, come senza WebGL2. Nella revisione resta
  useEffect(() => {
    const c = spazio.current;
    if (!c || revisione) return;
    const perso = () => {
      if (finita.current) return;
      finita.current = true;
      console.warn("[intro] contesto WebGL perso: si salta");
      onFine?.();
    };
    c.addEventListener("webglcontextlost", perso);
    return () => c.removeEventListener("webglcontextlost", perso);
  }, [revisione, onFine]);

  // ---- un fotogramma ------------------------------------------------------------------
  const fotogramma = useCallback(
    (t: number) => {
      const o = opz.current;
      const ridotto = o.ridotto;
      const p = palco.current;
      if (!p) return;
      const W = p.clientWidth, H = p.clientHeight;

      // 1. lo spazio (WebGL): il margine in B, la scala in E, F, G e nel raccordo di H
      const m = motore.current;
      let quadroGl: "margine" | "scala" | null = null;
      if (t >= M.stella[0] + 0.4 && t < S.scene[2].inizio) quadroGl = "margine";
      else if (t >= M.scala[0] && t < M.raccordo[1]) quadroGl = "scala";
      if (spazio.current) spazio.current.style.visibility = quadroGl ? "visible" : "hidden";
      if (m && quadroGl === "margine") {
        const luce = morbido(fra(t, M.stella[0] + 0.4, M.naveB));
        m.quadro("margine", tempoMargine(t, calibra.current, ridotto), { ridotta: o.ridotta, luce });
      } else if (m && quadroGl === "scala") {
        const tE = Math.min(t - M.scala[0], 23.5);
        if (ridotto) m.dissolvenza("scala", 0.5, 23.5, morbido(fra(tE, 3, 6)), { ridotta: o.ridotta });
        else m.quadro("scala", tE, { ridotta: o.ridotta });
      }

      // 2. i quadri fermi della plancia
      const q = quadri.current;
      const imposta = (k: string, opacita: number, trasforma = "", origine = "50% 50%") => {
        const d = q[k];
        if (!d) return;
        d.style.opacity = String(opacita);
        d.style.visibility = opacita > 0 ? "visible" : "hidden";
        const img = d.firstElementChild as HTMLElement | null;
        if (img) {
          img.style.transform = trasforma;
          img.style.transformOrigin = origine;
        }
      };
      const inC = t >= S.scene[2].inizio && t < M.scala[0];
      const fuoco = morbido(fra(t, M.fuoco[0], M.fuoco[1]));
      imposta("radar", inC ? 1 - fuoco : 0, ridotto ? "" : `scale(${1 + 0.05 * fuoco})`);
      imposta("oblo", inC ? fuoco : 0, ridotto ? "" : `scale(${1.05 - 0.05 * fuoco})`);
      imposta("faro", inC ? morbido(fra(t, M.faro, M.faro + 0.8)) : 0);
      // H: il raccordo sul fuso, la camera che arretra, la telecamera che scivola nella lente
      const inH = t >= M.raccordo[0];
      const arretra = morbido(fra(t, M.arretra[0], M.arretra[1]));
      const s0 = 3.3;
      const scala = ridotto ? 1 : s0 + (1 - s0) * arretra;
      // il punto dell'oblò va dal centro del quadro al suo posto
      const ox = OBLO_PLANCIA.x, oy = OBLO_PLANCIA.y;
      const cx = 0.5 + (ox - 0.5) * arretra, cy = 0.5 + (oy - 0.5) * arretra;
      const tx = (cx - ox * scala) * 100, ty = (cy - oy * scala) * 100;
      const versoLente = morbido(fra(t, M.interfaccia[0], M.interfaccia[0] + 1.6));
      imposta(
        "plancia",
        inH ? morbido(fra(t, M.raccordo[0], M.raccordo[1])) * (1 - (ridotto ? morbido(fra(t, M.interfaccia[0], M.interfaccia[1])) : versoLente)) : 0,
        ridotto ? "" : `translate(${tx}%, ${ty}%) scale(${scala})`,
        "0 0",
      );
      // la lente che si muove: dal formato pieno alla lente dell'interfaccia
      const l = lente.current;
      if (l) {
        const k = ridotto ? 1 : versoLente;
        const da = { x: 0, y: BANDA, w: 1, h: 1 - 2 * BANDA };
        const a = { x: 1 - 0.036 - 0.31, y: 3.2 / 56.25, w: 0.31, h: 17 / 56.25 };
        const lerp = (u: number, v: number) => u + (v - u) * k;
        l.style.left = `${lerp(da.x, a.x) * 100}%`;
        l.style.top = `${lerp(da.y, a.y) * 100}%`;
        l.style.width = `${lerp(da.w, a.w) * 100}%`;
        l.style.height = `${lerp(da.h, a.h) * 100}%`;
        const vis = t >= M.interfaccia[0] ? (ridotto ? morbido(fra(t, M.interfaccia[0] + 1.2, M.interfaccia[1])) : 1) : 0;
        l.style.opacity = String(vis);
        l.style.visibility = vis > 0 ? "visible" : "hidden";
        if (lenteVicina.current) {
          const seppia = morbido(fra(t, M.interfaccia[0] + 0.9, M.interfaccia[0] + 1.9));
          lenteVicina.current.style.opacity = String(seppia);
        }
      }

      // 3. l'interfaccia d'acciaio, pezzo per pezzo, e le bande che si ritirano
      const ac = acciaio.current;
      if (ac) {
        const fondo = morbido(fra(t, M.interfaccia[0], M.interfaccia[0] + 0.6));
        ac.style.opacity = String(fondo);
        ac.style.visibility = fondo > 0 ? "visible" : "hidden";
        const pezzi = ac.querySelectorAll<HTMLElement>("[data-acceso]");
        for (const el of pezzi) {
          const da = M.interfaccia[0] + Number(el.dataset.acceso);
          el.style.opacity = String(morbido(fra(t, da, da + (ridotto ? 0.6 : 0.25))));
        }
        const finali = ac.querySelectorAll<HTMLElement>("[data-partita]");
        for (const el of finali) {
          const da = M.partita[0] + Number(el.dataset.partita);
          el.style.opacity = String(morbido(fra(t, da, da + 0.5)));
        }
      }
      const banda = BANDA * (1 - morbido(fra(t, M.interfaccia[0], M.interfaccia[1])));
      for (const b of bande.current) if (b) b.style.height = `${banda * 100}%`;

      // 4. i testi
      let parla = "";
      for (const b of S.blocchi) {
        if (b.voce === "titolo") continue;
        const el = testi.current[b.id];
        if (!el) continue;
        const op = opacitaBlocco(b, t);
        el.style.opacity = String(op);
        el.style.visibility = op > 0 ? "visible" : "hidden";
        if (op > 0.5) parla = b.testo;
      }
      const T = S.blocchi.find((b) => b.voce === "titolo")!;
      if (opacitaBlocco(T, t) > 0.5) parla = `${TITOLO}. ${SOTTOTITOLO}`;
      if (annuncio.current && annuncio.current.textContent !== parla) annuncio.current.textContent = parla;

      // 5. il disegno sopra: la spia, il radar, le stelle che si spengono, i glifi e il titolo
      disegnaSopra(t, W, H, ridotto);

      // 6. i sottotitoli dei suoni, il salto
      const su = suono.current;
      if (su) {
        const s = o.sottotitoli ? S.sottotitoli.find((x) => t >= x.inizio && t < x.fine) : undefined;
        if (s) {
          if (su.textContent !== s.testo) su.textContent = s.testo;
          su.style.opacity = String(Math.min(fra(t, s.inizio, s.inizio + 0.3), 1 - fra(t, s.fine - 0.3, s.fine)));
        } else su.style.opacity = "0";
      }
      if (salta.current) salta.current.style.opacity = String(0.9 * fra(t, 1.5, 2.5) * (1 - fra(t, M.interfaccia[0], M.interfaccia[0] + 1)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ---- il disegno sopra (canvas 2D) ------------------------------------------------------
  const disegnaSopra = (t: number, W: number, H: number, ridotto: boolean) => {
    const cv = sopra.current;
    if (!cv) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    const g = cv.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const px = (u: number) => u * W;
    const py = (v: number) => v * H;
    const scalaPx = H / 1080;

    const spia = (x: number, y: number, luce: number, sfoca = 0) => {
      if (luce <= 0.003) return;
      const r = (3 + sfoca * 22) * scalaPx;
      const alone = (18 + sfoca * 30) * scalaPx;
      const grad = g.createRadialGradient(px(x), py(y), 0, px(x), py(y), alone);
      grad.addColorStop(0, `rgba(139, 240, 162, ${0.55 * luce})`);
      grad.addColorStop(1, "rgba(139, 240, 162, 0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(px(x), py(y), alone, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = `rgba(${200 - sfoca * 60}, 255, ${210 - sfoca * 40}, ${luce * (1 - sfoca * 0.75)})`;
      g.beginPath();
      g.arc(px(x), py(y), r, 0, Math.PI * 2);
      g.fill();
    };

    // A: la spia, il respiro della luce, il battito; poi sfoca e diventa una stella (B)
    if (t >= M.spia && t < M.stella[1]) {
      const accesa = morbido(fra(t, M.spia, M.spia + (ridotto ? 0.8 : 0.15)));
      const respiro = 0.86 + 0.14 * Math.sin((t * 2 * Math.PI) / 4.5);
      const colpo = impulso(t, BATTITI_A) * (ridotto ? 0.5 : 1);
      const sfoca = morbido(fra(t, M.stella[0], M.stella[0] + 1.8));
      const luce = accesa * (0.62 * respiro + 0.5 * colpo) * (1 - sfoca);
      spia(SPIA_A.x, SPIA_A.y, luce, sfoca);
    }
    if (t >= M.stella[0] + 0.5 && t < S.scene[2].inizio) {
      const s = morbido(fra(t, M.stella[0] + 0.5, M.stella[0] + 1.6));
      g.fillStyle = `rgba(240, 244, 255, ${0.95 * s})`;
      g.beginPath();
      g.arc(px(SPIA_A.x), py(SPIA_A.y), 1.6 * scalaPx + 0.6, 0, Math.PI * 2);
      g.fill();
      const grad = g.createRadialGradient(px(SPIA_A.x), py(SPIA_A.y), 0, px(SPIA_A.x), py(SPIA_A.y), 7 * scalaPx);
      grad.addColorStop(0, `rgba(220, 230, 255, ${0.35 * s})`);
      grad.addColorStop(1, "rgba(220, 230, 255, 0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(px(SPIA_A.x), py(SPIA_A.y), 7 * scalaPx, 0, Math.PI * 2);
      g.fill();
    }

    // C: il radar sulla console, e la spia rossa della prossimità che lampeggia senza suono
    const inC = t >= S.scene[2].inizio && t < M.fuoco[1];
    if (inC) {
      const vis = 1 - morbido(fra(t, M.fuoco[0], M.fuoco[1]));
      const zoom = ridotto ? 1 : 1 + 0.05 * morbido(fra(t, M.fuoco[0], M.fuoco[1]));
      g.save();
      g.globalAlpha = vis;
      // lo stesso ingrandimento del quadro fermo, intorno al suo centro
      g.translate(W / 2, H / 2);
      g.scale(zoom, zoom);
      g.translate(-W / 2, -H / 2);
      const cx = px(RADAR.centro.x), cy = py(RADAR.centro.y), R = RADAR.raggio * W;
      g.fillStyle = "#04150b";
      g.beginPath();
      g.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(90, 220, 120, 0.45)";
      g.lineWidth = Math.max(1, 0.9 * scalaPx);
      for (const k of [1, 0.66, 0.33]) {
        g.beginPath();
        g.arc(cx, cy, R * k, 0, Math.PI * 2);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(cx - R, cy);
      g.lineTo(cx + R, cy);
      g.moveTo(cx, cy - R);
      g.lineTo(cx, cy + R);
      g.stroke();
      // il fascio: un giro ogni tre secondi, con la scia
      const ang = (((t - S.scene[2].inizio) / 3) % 1) * Math.PI * 2;
      for (let i = 0; i < 24; i++) {
        const a0 = ang - (i + 1) * (Math.PI / 90), a1 = ang - i * (Math.PI / 90);
        g.fillStyle = `rgba(110, 255, 140, ${0.32 * (1 - i / 24) ** 2})`;
        g.beginPath();
        g.moveTo(cx, cy);
        g.arc(cx, cy, R, a0, a1);
        g.closePath();
        g.fill();
      }
      g.strokeStyle = "rgba(170, 255, 190, 0.9)";
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
      g.stroke();
      // il settore muto: il fascio passa e non torna niente; un arco ambra ne segna il bordo
      const [m0, m1] = SETTORE_MUTO.map((d) => (d * Math.PI) / 180);
      g.strokeStyle = "rgba(242, 178, 61, 0.85)";
      g.lineWidth = Math.max(1.2, 1.6 * scalaPx);
      g.beginPath();
      g.arc(cx, cy, R * 1.03, m0, m1);
      g.stroke();
      // gli echi: si accendono quando il fascio li passa, poi sbiadiscono
      for (const [gradi, r] of ECHI) {
        const a = (gradi * Math.PI) / 180;
        const dopo = (((ang - a) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const luce = Math.exp(-dopo / 2.2);
        g.fillStyle = `rgba(140, 255, 170, ${0.15 + 0.85 * luce})`;
        g.beginPath();
        g.arc(cx + Math.cos(a) * R * r, cy + Math.sin(a) * R * r, 2.2 * scalaPx + 0.5, 0, Math.PI * 2);
        g.fill();
      }
      // la spia rossa: una volta al secondo, morbida, e non suona
      const rosso = 0.25 + 0.75 * Math.sin(((t - S.scene[2].inizio) % 1) * Math.PI) ** 2;
      const rx = px(SPIA_ROSSA.x), ry = py(SPIA_ROSSA.y);
      const gr = g.createRadialGradient(rx, ry, 0, rx, ry, 9 * scalaPx);
      gr.addColorStop(0, `rgba(255, 90, 70, ${rosso})`);
      gr.addColorStop(1, "rgba(255, 90, 70, 0)");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(rx, ry, 9 * scalaPx, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    // C: nell'oblò quattro stelle si spengono, una ogni secondo e un quarto, coperte da un bordo che non si vede
    if (t >= M.fuoco[0] && t < M.scala[0]) {
      const vis = morbido(fra(t, M.fuoco[0], M.fuoco[1]));
      const zoom = ridotto ? 1 : 1.05 - 0.05 * morbido(fra(t, M.fuoco[0], M.fuoco[1]));
      STELLE_OBLO.forEach((s, i) => {
        const via = M.stelleSpente[0] + 0.4 + i * 1.25;
        const luce = vis * (1 - morbido(fra(t, via, via + (ridotto ? 0.6 : 0.22))));
        if (luce <= 0) return;
        const x = W / 2 + (px(s.x) - W / 2) * zoom, y = H / 2 + (py(s.y) - H / 2) * zoom;
        // più luminose di quelle del quadro: l'occhio le trova prima che si spengano
        const alone = g.createRadialGradient(x, y, 0, x, y, 9 * scalaPx);
        alone.addColorStop(0, `rgba(225, 233, 255, ${0.4 * luce})`);
        alone.addColorStop(1, "rgba(225, 233, 255, 0)");
        g.fillStyle = alone;
        g.beginPath();
        g.arc(x, y, 9 * scalaPx, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = `rgba(245, 248, 255, ${luce})`;
        g.beginPath();
        g.arc(x, y, 2.3 * scalaPx + 0.6, 0, Math.PI * 2);
        g.fill();
      });
    }

    // F: la spia ricompare sopra il testo; con «La vedo pulsare» batte; a «Fine della traccia» si spegne
    if (t >= M.scala[1] - 0.5 && t < M.spiaSpenta + 1) {
      const accesa = morbido(fra(t, M.scala[1], M.scala[1] + 1.2)) * (1 - morbido(fra(t, M.spiaSpenta - 0.2, M.spiaSpenta + 0.6)));
      const colpi: number[] = [];
      for (let c = M.pulsa[0] + 1.2; c < M.pulsa[1]; c += 1.15) colpi.push(c);
      const colpo = impulso(t, colpi) * (ridotto ? 0.5 : 1);
      spia(SPIA_F.x, SPIA_F.y, accesa * (0.5 + 0.55 * colpo) * 0.85);
    }

    // G: i glifi, la traduzione, il titolo
    if (t >= M.glifi[0] && t < S.blocchi[S.blocchi.length - 1].via) {
      const T = S.blocchi.find((b) => b.voce === "titolo")!;
      const fs = 0.062 * W; // 6,2cqw
      const yTitolo = 0.465 * H;
      g.save();
      g.font = `300 ${fs}px Newsreader, Georgia, "Times New Roman", serif`;
      g.letterSpacing = `${0.06 * fs}px`;
      g.textBaseline = "alphabetic";
      const larghezza = g.measureText(TITOLO).width;
      let x = (W - larghezza) / 2;
      const posti: number[] = [];
      for (const ch of TITOLO) {
        const w = g.measureText(ch).width;
        posti.push(x + w / 2);
        x += w;
      }
      const titolo = opacitaBlocco(T, t);
      const glifoH = 0.044 * W, glifoW = 0.032 * W;
      for (const gl of glifi) {
        const cx = posti[gl.indice];
        const appare = M.glifi[0] + (M.glifi[1] - M.glifi[0]) * gl.compare;
        const visto = ridotto ? morbido(fra(t, M.glifi[0], M.glifi[1])) : morbido(fra(t, appare, appare + 0.25));
        const riconosciuto = M.traduzione[0] + (M.traduzione[1] - M.traduzione[0]) * gl.riconosciuto - 0.1;
        // la lettera: fino al titolo pieno; poi la sostituisce il blocco del titolo, che esce con le regole dei testi
        const lettera = ridotto ? morbido(fra(t, M.traduzione[0], M.traduzione[1])) : morbido(fra(t, riconosciuto, riconosciuto + 0.18));
        const alfaLettera = t < T.pieno ? lettera : titolo;
        if (lettera < 1) {
          // il glifo, e le sue forme mentre la matrice lo cerca
          let forma = gl.forme[0];
          if (!ridotto && t >= M.traduzione[0]) {
            const passi = gl.forme.length - 1;
            const k = Math.min(passi, Math.floor(fra(t, M.traduzione[0], riconosciuto) * (passi + 1)));
            forma = gl.forme[k];
          }
          g.save();
          g.globalAlpha = visto * (1 - lettera);
          g.translate(cx - glifoW / 2, yTitolo - glifoH * 0.82);
          g.scale(glifoW / 32, glifoH / 56);
          g.strokeStyle = "#5fd4dc";
          g.lineWidth = 1.6;
          g.lineCap = "round";
          g.lineJoin = "round";
          g.shadowColor = "rgba(95, 212, 220, 0.5)";
          g.shadowBlur = 6;
          for (const d of forma) g.stroke(new Path2D(d));
          g.restore();
        }
        if (alfaLettera > 0) {
          g.fillStyle = `rgba(236, 240, 238, ${alfaLettera})`;
          g.textAlign = "center";
          g.letterSpacing = "0px";
          g.fillText(gl.lettera, cx, yTitolo);
          g.letterSpacing = `${0.06 * fs}px`;
        }
      }
      // il sottotitolo, con il titolo: in corsivo, e il titolo del libro in tondo
      if (titolo > 0) {
        const fs2 = 0.0165 * W;
        const corsivo = `italic 300 ${fs2}px Newsreader, Georgia, "Times New Roman", serif`;
        const tondo = `300 ${fs2}px Newsreader, Georgia, "Times New Roman", serif`;
        const libro = "Dal registro della Santa Maria";
        const prima = SOTTOTITOLO.slice(0, SOTTOTITOLO.indexOf(libro));
        g.letterSpacing = "0px";
        g.textAlign = "left";
        g.font = corsivo;
        const w1 = g.measureText(prima).width;
        g.font = tondo;
        const w2 = g.measureText(libro).width;
        const x0 = (W - w1 - w2) / 2;
        g.fillStyle = `rgba(184, 194, 191, ${titolo})`;
        g.font = corsivo;
        g.fillText(prima, x0, 0.59 * H);
        g.font = tondo;
        g.fillText(libro, x0 + w1, 0.59 * H);
      }
      g.restore();
    }
  };

  // ---- il suono: la colonna sonora la suona il motore audio, con i momenti di questa scaletta ----
  useEffect(() => {
    if (!pronta || revisione) return;
    void introSuono(true);
    return () => void introSuono(false);
  }, [pronta, revisione]);

  // ---- il tempo ----------------------------------------------------------------------------
  useEffect(() => {
    if (!pronta) return;
    let ultimo: number | null = null;
    let id = 0;
    let campioni: number[] = [];
    let ultimoAggiornamento = 0;
    const ciclo = (ora: number) => {
      if (ultimo !== null && !pausa.current && !finita.current) {
        const dt = Math.min(0.1, (ora - ultimo) / 1000);
        tempo.current = Math.min(S.durata, tempo.current + dt);
        campioni.push(dt);
        if (campioni.length > 90) campioni = campioni.slice(-90);
        if (tempo.current >= S.durata) {
          finita.current = true;
          onFine?.();
        }
      }
      ultimo = ora;
      fotogramma(tempo.current);
      if (ora - ultimoAggiornamento > 100) {
        ultimoAggiornamento = ora;
        setMostrato(tempo.current);
        if (campioni.length > 20) setFps(`${(campioni.length / campioni.reduce((a, b) => a + b, 0)).toFixed(0)} fps`);
      }
      id = requestAnimationFrame(ciclo);
    };
    id = requestAnimationFrame(ciclo);
    return () => cancelAnimationFrame(id);
  }, [pronta, fotogramma, onFine]);

  const vai = useCallback(
    (t: number) => {
      tempo.current = Math.max(0, Math.min(S.durata, t));
      finita.current = tempo.current >= S.durata;
      fotogramma(tempo.current);
      setMostrato(tempo.current);
    },
    [fotogramma],
  );
  const saltaAllaFine = useCallback(() => {
    vai(S.durata);
    onFine?.();
  }, [vai, onFine]);
  const alterna = useCallback(() => {
    if (finita.current) vai(0);
    pausa.current = !pausa.current;
    setInPausa(pausa.current);
  }, [vai]);

  // la tastiera: Esc e Spazio saltano; nella revisione Spazio mette in pausa e le frecce spostano
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        saltaAllaFine();
      } else if (e.key === " ") {
        if ((e.target as HTMLElement).tagName === "BUTTON") return;
        e.preventDefault();
        if (revisione) alterna();
        else saltaAllaFine();
      } else if (revisione && e.key === "ArrowLeft") vai(tempo.current - 5);
      else if (revisione && e.key === "ArrowRight") vai(tempo.current + 5);
      else if (revisione && e.key === "Home") vai(0);
    };
    addEventListener("keydown", tasto);
    return () => removeEventListener("keydown", tasto);
  }, [revisione, alterna, saltaAllaFine, vai]);

  useEffect(() => {
    if (pronta) fotogramma(tempo.current);
  }, [opzioni, pronta, fotogramma]);

  const scena = scenaA(mostrato);
  const blocco = (b: Blocco) => (
    <div
      key={b.id}
      ref={(el) => {
        testi.current[b.id] = el;
      }}
      className={`blocco ${b.voce} scena-${b.scena}${b.sottoA ? " sotto" : ""}`}
      aria-hidden="true"
    >
      {b.testo}
    </div>
  );

  return (
    <div className={`intro${!revisione && pronta ? " in-corso" : ""}`} style={{ ["--barra" as string]: revisione ? "112px" : "0px" }}>
      <div
        className="palco"
        ref={palco}
        aria-label="L’intro del Relitto Silente"
        onClick={() => {
          if (!revisione) saltaAllaFine();
        }}
      >
        <canvas ref={spazio} aria-hidden="true" />
        {(
          [
            ["radar", "plancia-radar.webp"],
            ["oblo", "plancia-oblo.webp"],
            ["faro", "plancia-faro.webp"],
            ["plancia", "plancia.webp"],
          ] as const
        ).map(([k, file]) => (
          <div
            key={k}
            className="quadro-fermo"
            ref={(el) => {
              quadri.current[k] = el;
            }}
            aria-hidden="true"
          >
            <img src={`./intro/${file}`} alt="" draggable={false} />
          </div>
        ))}
        <canvas ref={sopra} aria-hidden="true" />
        {S.blocchi.filter((b) => b.voce !== "titolo").map(blocco)}
        <div className="acciaio" ref={acciaio} aria-hidden="true">
          <div className="atto" data-acceso="0.2">
            Atto I · Il margine
          </div>
          <div className="lamina" data-acceso="0.45">
            <h3>Plancia</h3>
            <div className="riga" />
            <p data-partita="0">{PLANCIA_TESTO}</p>
          </div>
          <div className="cornice-lente" data-acceso="1.4" />
          <div className="didas" data-acceso="1.7">
            cam 01 · plancia · tsc-1972
          </div>
          <dl className="strumenti" data-acceso="1.95">
            <dt>reattore</dt>
            <dd>re · 73,4 hz</dd>
            <dt>margine</dt>
            <dd style={{ color: "#E07A3C" }}>nel rosso da martedì</dd>
            <dt>radar</dt>
            <dd>contatto non identificato</dd>
          </dl>
          <div className="ramo" data-acceso="2.3">
            <span className="et" data-partita="0.3">uscite</span>
            <span className="u" data-partita="0.4">ovest</span>
            <span className="u" data-partita="0.5">nord</span>
            <span className="et" data-partita="0.6">qui</span>
            <span data-partita="0.7">la nave aliena</span>
            <span data-partita="0.8">il quadrante del margine</span>
            <span data-partita="0.9">la radio</span>
            <span data-partita="1.0">Yusuf</span>
          </div>
        </div>
        <div className="lente-mobile" ref={lente} aria-hidden="true">
          <img src="./intro/plancia.webp" alt="" draggable={false} />
          <img
            ref={lenteVicina}
            src="./intro/lente.webp"
            alt=""
            draggable={false}
            style={{ opacity: 0, filter: "sepia(.45) saturate(1.15) hue-rotate(-8deg) brightness(.85)" }}
          />
        </div>
        <div className="banda su" ref={(el) => void (bande.current[0] = el)} />
        <div className="banda giu" ref={(el) => void (bande.current[1] = el)} />
        <div className="suono" ref={suono} aria-hidden="true" />
        <div className="salta" ref={salta} aria-hidden="true">
          Esc · salta
        </div>
        <div className="solo-lettori" ref={annuncio} aria-live="polite" />
        {!pronta && <div className={`preparazione${errore ? " errore" : ""}`}>{errore ?? "Preparazione…"}</div>}
      </div>

      {revisione && (
        <div className="revisione" role="group" aria-label="Revisione dell’animatic">
          <div className="linea">
            {S.scene.map((s, i) => (
              <div
                key={s.id}
                className="segmento"
                style={{
                  left: `${(s.inizio / S.durata) * 100}%`,
                  width: `calc(${((s.fine - s.inizio) / S.durata) * 100}% - 2px)`,
                  background: ["#6be38a", "#9fb6d9", "#8bf0a2", "#f2c46d", "#5fd4dc", "#6be38a", "#e6eae8", "#f2a03d"][i],
                }}
              >
                {s.id}
              </div>
            ))}
            {S.blocchi.map((b) => (
              <div key={b.id} className="testo" style={{ left: `${(b.entra / S.durata) * 100}%`, width: `${((b.via - b.entra) / S.durata) * 100}%` }} />
            ))}
            {[0, 30, 60, 90, 120, 150].map((s) => (
              <div key={s} className="ora" style={{ left: `${(s / S.durata) * 100}%` }}>
                {formatoTempo(s).slice(0, -2)}
              </div>
            ))}
            <div className="testina" style={{ left: `${(mostrato / S.durata) * 100}%` }} />
            <input
              type="range"
              min={0}
              max={S.durata}
              step={0.05}
              value={mostrato}
              aria-label="Tempo dell’intro"
              aria-valuetext={formatoTempo(mostrato)}
              onChange={(e) => {
                pausa.current = true;
                setInPausa(true);
                vai(Number(e.target.value));
              }}
            />
          </div>
          <div className="comandi">
            <button onClick={alterna}>{inPausa ? "Riproduci" : "Pausa"}</button>
            <button onClick={() => vai(0)}>Da capo</button>
            <button onClick={() => vai(tempo.current - 5)} aria-label="Indietro di cinque secondi">
              −5 s
            </button>
            <button onClick={() => vai(tempo.current + 5)} aria-label="Avanti di cinque secondi">
              +5 s
            </button>
            <button onClick={saltaAllaFine}>Salta (Esc)</button>
            <span className="tempo">
              {formatoTempo(mostrato)} / {formatoTempo(S.durata)}
            </span>
            <span className="scena">
              {scena.id} · {scena.nome}
            </span>
            <label>
              <input type="checkbox" checked={opzioni.ridotto} onChange={(e) => setOpzioni({ ...opzioni, ridotto: e.target.checked })} />
              movimento ridotto
            </label>
            <label>
              <input type="checkbox" checked={opzioni.sottotitoli} onChange={(e) => setOpzioni({ ...opzioni, sottotitoli: e.target.checked })} />
              sottotitoli dei suoni
            </label>
            <label>
              <input type="checkbox" checked={opzioni.ridotta} onChange={(e) => setOpzioni({ ...opzioni, ridotta: e.target.checked })} />
              qualità ridotta
            </label>
            <span className="misura">{fps}</span>
          </div>
        </div>
      )}
    </div>
  );
}
