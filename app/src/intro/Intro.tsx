// ============================================================================
//  L'intro (09-intro-storyboard.md), con le scene definitive (§10):
//    A  la traccia: la spia e il nastro della scatola nera, che respira, batte
//       e si interrompe nei buchi; la voce dell'apparecchio si stampa, quella
//       di L.V. viene a fuoco
//    B  il margine, nel motore della scala
//    C  la plancia a piena risoluzione (plancia.ts): il radar a fosforo, la
//       spia rossa, il cambio di fuoco vero; nell'oblò il cielo dal vivo, e le
//       stelle che il bordo del fuso copre
//    D  il faro si accende e cerca; la camera si accosta all'oblò
//    E  la scala, nel motore
//    F  la traccia, seconda parte, sul quadro finale
//    G  i glifi che si tracciano, la matrice che li legge, il titolo
//    H  la camera entra nel nero del fuso ed esce dal vetro dell'oblò; arretra
//       fino alla plancia intera, che diventa la telecamera di bordo e va nella
//       lente del gioco. Il gioco parte sotto, e l'intro si apre su di lui
//  Si salta con Esc, Spazio o un clic. Con il movimento ridotto ogni scena ha
//  la sua versione (§2.5 e scena per scena nello storyboard).
//  Ogni fotogramma si disegna fuori da React: lo stato di React serve solo
//  alla barra di revisione.
// ============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { glifiDelTitolo } from "./glifi";
import { BANDA, Plancia, VOLO, TAGLIO_H, faro as faroDi, fuochi, otticaOblo, riprese, tempoOblo } from "./plancia";
import { Scala } from "./scala";
import { introSuono } from "./suono";
import {
  SCALETTA,
  SOTTOTITOLO,
  TITOLO,
  buchiDellaTraccia,
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
const C0 = S.scene[2].inizio;
const E0 = M.scala[0];
const BUCHI = buchiDellaTraccia(S);
// La spia verde: in A poco sopra il centro; in F nel nero del fuso, sopra il testo e sopra il punto
// della nave (il bordo del fuso, al centro, è a 0,32 del palco; il punto a 0,51).
const SPIA_A = { x: 0.5, y: 0.455 };
const SPIA_F = { x: 0.5, y: 0.365 };
// I battiti: in A il cuore di L.V., che rallenta e si ferma al quarto colpo; in F la cosa viva.
const BATTITI_A = [M.battito[0], M.battito[0] + 0.95, M.battito[0] + 1.95, M.battito[0] + 3.0];
/** nel raccordo di H la camera entra nel nero del fuso, sopra il punto della nave */
const NEL_NERO = { x: 0.5, y: 0.4 };
/** la voce dell'apparecchio si stampa in questo tempo */
const STAMPA = 1.5;

export type Grana = "mossa" | "ferma" | "no";

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

/** Un numero a caso ma sempre lo stesso, da 0 a 1. */
const caso = (a: number, b = 0) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Il livello della traccia di A nell'istante τ (0–1): il fruscio, il respiro di L.V. che si accorcia,
 *  il cuore; zero nei buchi e dopo l'ultimo colpo. */
function livelloTraccia(τ: number): number {
  if (τ < M.spia || τ > BATTITI_A[3] + 0.9) return 0;
  for (const b of BUCHI) if (τ >= b && τ < b + 0.25) return 0;
  // il respiro: un ciclo che si accorcia, da 4,6 a 3,5 secondi
  const fase = (2 * Math.PI * τ) / 4.6 + (Math.PI * τ * τ) / (4.6 * 4.6 * 42);
  const respiro = Math.max(0, Math.sin(fase)) ** 2 * 0.55 + Math.max(0, -Math.sin(fase)) ** 3 * 0.18;
  return Math.min(1, 0.14 + respiro + impulso(τ, BATTITI_A) * 1.1);
}

/** La lunghezza di un tratto "M x y L x y …" (i glifi sono spezzate). */
function lunghezza(d: string): number {
  const n = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  let l = 0;
  for (let i = 2; i + 1 < n.length; i += 2) l += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
  return l;
}

export default function Intro({
  revisione = false,
  onFine,
  onPartita,
  ridotto,
  grana = "mossa",
}: {
  revisione?: boolean;
  onFine?: () => void;
  /** la partita può partire sotto l'intro: alla fine di H l'intro si apre sul gioco */
  onPartita?: () => void;
  ridotto?: boolean;
  grana?: Grana;
}) {
  const radice = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const spazio = useRef<HTMLCanvasElement>(null);
  const canvasPlancia = useRef<HTMLCanvasElement>(null);
  const sopra = useRef<HTMLCanvasElement>(null);
  const motore = useRef<Scala | null>(null);
  const plancia = useRef<Plancia | null>(null);
  const calibra = useRef({ t0: 0, k: 1, meta: 0 });
  const testi = useRef<Record<string, HTMLDivElement | null>>({});
  const bande = useRef<(HTMLDivElement | null)[]>([]);
  const strato = useRef<HTMLDivElement>(null);
  const didascalia = useRef<HTMLDivElement>(null);
  const suono = useRef<HTMLDivElement>(null);
  const salta = useRef<HTMLDivElement>(null);
  const annuncio = useRef<HTMLDivElement>(null);

  // nello sviluppo, &da=150 la fa partire da quel secondo
  const tempo = useRef(import.meta.env.DEV ? Math.max(0, Math.min(S.durata, Number(new URLSearchParams(location.search).get("da")) || 0)) : 0);
  const pausa = useRef(false);
  const finita = useRef(false);
  // la partita sotto: chiesta, e l'istante in cui la lente del gioco c'è
  const partita = useRef(false);
  const giocoPronto = useRef<number | null>(null);
  const conPartita = !!onPartita && !revisione;
  // il movimento ridotto: l'opzione dell'app, se arriva dal gioco; se no, il sistema
  const [opzioni, setOpzioni] = useState<Opzioni>(() => ({ ridotto: ridotto ?? preferisceMenoMovimento(), sottotitoli: revisione, ridotta: false }));
  const opz = useRef(opzioni);
  opz.current = opzioni;
  const [pronta, setPronta] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [mostrato, setMostrato] = useState(0);
  const [inPausa, setInPausa] = useState(false);
  const [fps, setFps] = useState<string>("");
  const glifi = useMemo(() => glifiDelTitolo(TITOLO).map((g) => ({ ...g, lunghezze: g.forme.map((f) => f.map(lunghezza)) })), []);

  // ---- la preparazione: il motore, le immagini, i cieli --------------------------
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        // in sviluppo React monta due volte: il motore (e il suo contesto WebGL) resta uno
        const m = motore.current ?? new Scala(spazio.current!);
        motore.current = m;
        const base = new URL("./intro/", location.href).href;
        const immagine = (f: string) =>
          new Promise<HTMLImageElement>((risolvi, rifiuta) => {
            const i = new Image();
            i.onload = () => risolvi(i);
            i.onerror = () => rifiuta(new Error(`Manca l'immagine dell'intro: ${f}`));
            i.src = base + f;
          });
        const [, hd, sfocata, lente] = await Promise.all([
          m.carica(`${base}poppa.webp`, `${base}prua.webp`),
          immagine("plancia-hd.webp"),
          immagine("plancia-sfocata.webp"),
          immagine("plancia.webp"),
        ]);
        // decodificate prima, perché la prima volta che si disegnano non fermino un fotogramma; con la
        // finestra nascosta la decodifica aspetta che torni visibile: si va avanti lo stesso
        const attesa = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
        await Promise.all([hd, sfocata, lente].map((i) => Promise.race([i.decode().catch(() => undefined), attesa(1500)])));
        m.prepara("margine");
        m.prepara("scala");
        m.prepara("plancia");
        const p = new Plancia({ hd, sfocata, lente });
        p.prepara(m);
        plancia.current = p;
        // le immagini della plancia passano una volta nella scheda video adesso, e non al primo stacco su C
        const cp = canvasPlancia.current?.getContext("2d");
        if (cp) {
          for (const i of [hd, sfocata, lente]) cp.drawImage(i, 0, 0, 2, 2);
          cp.clearRect(0, 0, 4, 4);
        }
        // nello sviluppo, per guardarci dentro dalla console
        if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__intro = { plancia: p, motore: m };
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

  /** Quando l'intro comincia ad aprirsi sul gioco (null: non ancora). */
  const inizioRivelazione = () => (giocoPronto.current === null ? null : Math.max(giocoPronto.current + 0.15, M.partita[0] + 0.35));

  // ---- un fotogramma ------------------------------------------------------------------
  const fotogramma = useCallback(
    (t: number) => {
      const o = opz.current;
      const ridotto = o.ridotto;
      const p = palco.current;
      if (!p) return;
      const W = p.clientWidth, H = p.clientHeight;

      // 1. lo spazio (WebGL): il margine in B; la plancia e il suo oblò in C, D e H; la scala in E, F, G
      //    e all'inizio del raccordo
      const m = motore.current;
      let quadroGl: "margine" | "scala" | "plancia" | null = null;
      const lenteFinale = morbido(fra(t, VOLO[0] + 0.1, VOLO[0] + 0.9));
      if (t >= M.stella[0] + 0.4 && t < C0) quadroGl = "margine";
      else if (t >= C0 && t < E0) quadroGl = "plancia";
      else if (t >= E0 && t < TAGLIO_H) quadroGl = "scala";
      else if (t >= TAGLIO_H && lenteFinale < 1) quadroGl = "plancia";
      const sp = spazio.current;
      if (sp) sp.style.visibility = quadroGl ? "visible" : "hidden";
      if (m && quadroGl === "margine") {
        const luce = morbido(fra(t, M.stella[0] + 0.4, M.naveB));
        m.quadro("margine", tempoMargine(t, calibra.current, ridotto), { ridotta: o.ridotta, luce });
      } else if (m && quadroGl === "scala") {
        const tE = Math.min(t - M.scala[0], 23.5);
        if (t >= M.raccordo[0] && !ridotto) {
          // il raccordo: la camera entra nel nero del fuso, sopra la nave, finché il nero è tutto
          const k = Math.exp(morbido(fra(t, M.raccordo[0], TAGLIO_H)) * Math.log(18));
          const P: [number, number] = [NEL_NERO.x * 2 - 1, 1 - NEL_NERO.y * 2];
          m.quadro("scala", 23.5, { ridotta: o.ridotta, ottica: { sca: [k, k], off: [P[0] * (1 - k), P[1] * (1 - k)] } });
        } else if (t >= M.raccordo[0]) {
          m.quadro("scala", 23.5, { ridotta: o.ridotta, luce: 1 - morbido(fra(t, M.raccordo[0], TAGLIO_H)) });
        } else if (ridotto) m.dissolvenza("scala", 0.5, 23.5, morbido(fra(tE, 3, 6)), { ridotta: o.ridotta });
        else m.quadro("scala", tE, { ridotta: o.ridotta });
      } else if (m && quadroGl === "plancia") {
        const rp = riprese(t, ridotto)[0];
        const f = faroDi(t, ridotto);
        if (rp) {
          // dal nero del taglio la vista fuori si accende piano
          const luce = t >= TAGLIO_H ? morbido(fra(t, TAGLIO_H, TAGLIO_H + 0.5)) : 1;
          m.quadro("plancia", tempoOblo(t), { ridotta: o.ridotta, ottica: otticaOblo(rp.r, W, H), faro: f.luce, faroGradi: f.gradi, grana: false, vignetta: false, luce });
        }
      }
      // il fuoco sull'oblò: prima del cambio di fuoco la vista fuori è sfocata
      if (sp) {
        const sfoca = quadroGl === "plancia" ? (1 - fuochi(t).parete) * 8 * (H / 1080) : 0;
        const filtro = sfoca > 0.2 ? `blur(${sfoca.toFixed(1)}px)` : "";
        if (sp.style.filter !== filtro) sp.style.filter = filtro;
      }

      // 2. la plancia: l'immagine, la console, la telecamera di bordo
      disegnaPlancia(t, W, H, ridotto);

      // 3. le bande che si ritirano, la grana sopra la plancia, la didascalia della telecamera
      const banda = BANDA * (1 - morbido(fra(t, M.interfaccia[0], M.interfaccia[0] + 1.0)));
      for (const b of bande.current) if (b) b.style.height = `${banda * 100}%`;
      const st = strato.current;
      if (st) {
        const conPlancia = (t >= C0 && t < E0) || (t >= TAGLIO_H && t < VOLO[1]);
        const vis = grana === "no" ? 0 : conPlancia ? 1 - (t >= TAGLIO_H ? morbido(fra(t, VOLO[0], VOLO[1])) : 0) : 0;
        st.style.opacity = String(0.42 * vis);
        if (vis > 0 && grana === "mossa" && !ridotto) {
          const f = Math.floor(t * 24);
          st.style.backgroundPosition = `${Math.floor(caso(f, 1) * 256)}px ${Math.floor(caso(f, 2) * 256)}px`;
        }
      }
      const di = didascalia.current;
      if (di) {
        const vis = morbido(fra(t, M.interfaccia[0] + 0.55, M.interfaccia[0] + 1.0)) * (1 - morbido(fra(t, VOLO[0] - 0.1, VOLO[0] + 0.35)));
        di.style.opacity = String(vis);
        di.style.visibility = vis > 0 ? "visible" : "hidden";
      }

      // 4. i testi
      let parla = "";
      for (const b of S.blocchi) {
        if (b.voce === "titolo") continue;
        const el = testi.current[b.id];
        if (!el) continue;
        const op = opacitaBlocco(b, t);
        if (b.voce === "apparecchio") {
          // la voce dell'apparecchio si stampa, lettera per lettera, con il cursore che poi se ne va
          const quante = ridotto ? b.testo.length : Math.round(b.testo.length * fra(t, b.entra, b.entra + STAMPA));
          const scritto = el.firstElementChild as HTMLElement, cursore = scritto.nextElementSibling as HTMLElement, resto = cursore.nextElementSibling as HTMLElement;
          if (scritto.textContent!.length !== quante) {
            scritto.textContent = b.testo.slice(0, quante);
            resto.textContent = b.testo.slice(quante);
          }
          const dopo = t - (b.entra + STAMPA);
          cursore.style.opacity = !ridotto && t >= b.entra && (dopo < 0 || (dopo < 1.9 && Math.floor(dopo / 0.32) % 2 === 1)) ? "1" : "0";
          el.style.opacity = String(t < b.esce ? (t >= b.entra ? 1 : 0) : op);
        } else {
          // la voce di L.V. viene a fuoco, salendo di un poco
          const entra = morbido(fra(t, b.entra, b.pieno));
          const esce = t > b.esce ? morbido(fra(t, b.esce, b.via)) : 0;
          const sfoca = ridotto ? 0 : (1 - entra) * 5 + esce * 2.5;
          el.style.opacity = String(op);
          el.style.filter = sfoca > 0.05 ? `blur(${((sfoca * H) / 1080).toFixed(2)}px)` : "";
          el.style.transform = ridotto ? "" : `translateY(${((1 - entra) * 0.45).toFixed(3)}cqw)`;
        }
        el.style.visibility = op > 0 ? "visible" : "hidden";
        if (op > 0.5) parla = b.testo;
      }
      const T = S.blocchi.find((b) => b.voce === "titolo")!;
      if (opacitaBlocco(T, t) > 0.5) parla = `${TITOLO}. ${SOTTOTITOLO}`;
      if (annuncio.current && annuncio.current.textContent !== parla) annuncio.current.textContent = parla;

      // 5. il disegno sopra: la spia, il nastro, i glifi e il titolo
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

      // 7. la fine: il gioco parte sotto, e l'intro si apre su di lui
      const r = radice.current;
      if (r) {
        const tR = inizioRivelazione();
        const buio = tR === null ? 1 : 1 - morbido(fra(t, tR, tR + 0.9));
        r.style.setProperty("--buio", buio.toFixed(3));
        const cp = canvasPlancia.current;
        if (cp) cp.style.opacity = tR === null ? "1" : String(1 - morbido(fra(t, tR + 0.9, tR + 1.3)));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ---- la plancia (canvas 2D) ------------------------------------------------------------
  const disegnaPlancia = (t: number, W: number, H: number, ridotto: boolean) => {
    const cv = canvasPlancia.current;
    if (!cv) return;
    const vede = (t >= C0 && t < E0) || t >= TAGLIO_H;
    cv.style.visibility = vede ? "visible" : "hidden";
    if (!vede) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    }
    const g = cv.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    plancia.current?.disegna(g, t, W, H, motore.current, ridotto);
  };

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
    const k = H / 1080;

    /** La spia: il punto, l'alone, e la riga orizzontale dell'obiettivo. */
    const spia = (x: number, y: number, luce: number, sfoca = 0) => {
      if (luce <= 0.003) return;
      const X = px(x), Y = py(y);
      const r = (3 + sfoca * 22) * k;
      const alone = (20 + sfoca * 30) * k;
      g.save();
      g.globalCompositeOperation = "lighter";
      const grad = g.createRadialGradient(X, Y, 0, X, Y, alone);
      grad.addColorStop(0, `rgba(139, 240, 162, ${0.55 * luce})`);
      grad.addColorStop(0.35, `rgba(110, 220, 140, ${0.16 * luce})`);
      grad.addColorStop(1, "rgba(139, 240, 162, 0)");
      g.fillStyle = grad;
      g.fillRect(X - alone, Y - alone, 2 * alone, 2 * alone);
      // la riga dell'obiettivo: sottile, larga, appena verde
      const lungo = (150 + 60 * luce) * k * (1 - sfoca);
      if (lungo > 1) {
        const riga = g.createLinearGradient(X - lungo, 0, X + lungo, 0);
        riga.addColorStop(0, "rgba(120, 230, 160, 0)");
        riga.addColorStop(0.5, `rgba(150, 245, 180, ${0.2 * luce})`);
        riga.addColorStop(1, "rgba(120, 230, 160, 0)");
        g.fillStyle = riga;
        g.fillRect(X - lungo, Y - 0.8 * k, 2 * lungo, 1.6 * k);
      }
      g.globalCompositeOperation = "source-over";
      g.fillStyle = `rgba(${200 - sfoca * 60}, 255, ${210 - sfoca * 40}, ${luce * (1 - sfoca * 0.75)})`;
      g.beginPath();
      g.arc(X, Y, r, 0, Math.PI * 2);
      g.fill();
      g.restore();
    };

    // A: il nastro della scatola nera. Il livello della registrazione scorre dal centro verso i lati:
    // il respiro, il cuore, i buchi. Dopo l'ultimo colpo, niente; poi la spia diventa una stella
    if (t >= M.spia && t < M.stella[0] + 1.6) {
      const vis = morbido(fra(t, M.spia, M.spia + 1.2)) * (1 - morbido(fra(t, M.stella[0], M.stella[0] + 1.2)));
      const Y = py(SPIA_A.y), X = px(SPIA_A.x);
      const mezzo = 0.2 * W, buco = 26 * k, passo = 3 * k;
      const v = 0.075 * W; // la velocità del nastro, in pixel al secondo
      g.save();
      g.fillStyle = `rgba(150, 225, 178, ${0.5 * vis})`;
      const n = Math.floor((mezzo - buco) / passo);
      for (let i = 0; i < n; i++) {
        const d = buco + i * passo;
        const τ = ridotto ? t : t - d / v;
        const liv = livelloTraccia(τ);
        // sbiadisce verso i lati
        const lato = 1 - i / n;
        for (const segno of [-1, 1]) {
          const h = Math.max(0.6 * k, liv * (0.35 + 0.65 * caso(Math.floor(τ * 30), i * segno)) * 19 * k * (0.35 + 0.65 * lato));
          g.globalAlpha = 0.25 + 0.75 * lato;
          g.fillRect(X + segno * d - 0.6 * k, Y - h, 1.2 * k, 2 * h);
        }
      }
      g.restore();
    }

    // A: la spia, il respiro della luce, il battito; poi sfoca e diventa una stella (B)
    if (t >= M.spia && t < M.stella[1]) {
      const accesa = morbido(fra(t, M.spia, M.spia + (ridotto ? 0.8 : 0.15)));
      const respiro = 0.86 + 0.14 * Math.sin((t * 2 * Math.PI) / 4.5);
      const colpo = impulso(t, BATTITI_A) * (ridotto ? 0.5 : 1);
      const sfoca = morbido(fra(t, M.stella[0], M.stella[0] + 1.8));
      const luce = accesa * (0.62 * respiro + 0.5 * colpo) * (1 - sfoca);
      spia(SPIA_A.x, SPIA_A.y, luce, sfoca);
    }
    if (t >= M.stella[0] + 0.5 && t < C0) {
      const s = morbido(fra(t, M.stella[0] + 0.5, M.stella[0] + 1.6));
      g.fillStyle = `rgba(240, 244, 255, ${0.95 * s})`;
      g.beginPath();
      g.arc(px(SPIA_A.x), py(SPIA_A.y), 1.6 * k + 0.6, 0, Math.PI * 2);
      g.fill();
      const grad = g.createRadialGradient(px(SPIA_A.x), py(SPIA_A.y), 0, px(SPIA_A.x), py(SPIA_A.y), 7 * k);
      grad.addColorStop(0, `rgba(220, 230, 255, ${0.35 * s})`);
      grad.addColorStop(1, "rgba(220, 230, 255, 0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(px(SPIA_A.x), py(SPIA_A.y), 7 * k, 0, Math.PI * 2);
      g.fill();
    }

    // F: la spia ricompare sopra il testo; con «La vedo pulsare» batte; a «Fine della traccia» si spegne
    if (t >= M.scala[1] - 0.5 && t < M.spiaSpenta + 1) {
      const accesa = morbido(fra(t, M.scala[1], M.scala[1] + 1.2)) * (1 - morbido(fra(t, M.spiaSpenta - 0.2, M.spiaSpenta + 0.6)));
      const colpi: number[] = [];
      for (let c = M.pulsa[0] + 1.2; c < M.pulsa[1]; c += 1.15) colpi.push(c);
      const colpo = impulso(t, colpi) * (ridotto ? 0.5 : 1);
      spia(SPIA_F.x, SPIA_F.y, accesa * (0.5 + 0.55 * colpo) * 0.85);
    }

    // G: i glifi che si tracciano, la matrice che li legge, il titolo
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
      // il titolo, fermo, si allarga appena: le lettere prendono aria
      const aria = ridotto ? 1 : 1 + 0.022 * morbido(fra(t, T.pieno, T.esce));
      const posti: number[] = [];
      for (const ch of TITOLO) {
        const w = g.measureText(ch).width;
        posti.push(W / 2 + (x + w / 2 - W / 2) * aria);
        x += w;
      }
      const titolo = opacitaBlocco(T, t);
      const glifoH = 0.044 * W, glifoW = 0.032 * W;
      g.letterSpacing = "0px";
      g.textAlign = "center";
      for (const gl of glifi) {
        const cx = posti[gl.indice];
        const appare = M.glifi[0] + (M.glifi[1] - M.glifi[0]) * gl.compare;
        const traccia = ridotto ? morbido(fra(t, M.glifi[0], M.glifi[1])) : fra(t, appare, appare + 0.55);
        const riconosciuto = M.traduzione[0] + (M.traduzione[1] - M.traduzione[0]) * gl.riconosciuto - 0.1;
        // la lettera: fino al titolo pieno; poi la sostituisce il blocco del titolo, che esce con le regole dei testi
        const lettera = ridotto ? morbido(fra(t, M.traduzione[0], M.traduzione[1])) : morbido(fra(t, riconosciuto, riconosciuto + 0.28));
        const alfaLettera = t < T.pieno ? lettera : titolo;
        if (lettera < 1 && traccia > 0) {
          // il glifo, e le forme che prende mentre la matrice lo cerca
          let k2 = 0;
          if (!ridotto && t >= M.traduzione[0]) {
            const passi = gl.forme.length - 1;
            k2 = Math.min(passi, Math.floor(fra(t, M.traduzione[0], riconosciuto) * (passi + 1)));
          }
          const forma = gl.forme[k2], lungh = gl.lunghezze[k2];
          // una forma nuova si ritraccia in fretta; la prima si traccia piano
          const disegnata = k2 === 0 ? traccia : Math.min(1, fra(t, M.traduzione[0] + ((riconosciuto - M.traduzione[0]) * k2) / gl.forme.length, M.traduzione[0] + ((riconosciuto - M.traduzione[0]) * k2) / gl.forme.length + 0.16));
          g.save();
          g.globalAlpha = (ridotto ? traccia : Math.min(1, traccia * 3)) * (1 - lettera);
          g.translate(cx - glifoW / 2, yTitolo - glifoH * 0.82);
          g.scale(glifoW / 32, glifoH / 56);
          g.lineCap = "round";
          g.lineJoin = "round";
          // l'alone, il tratto, e il fondo del solco: i glifi sono «incisi a fondo»
          for (const [colore, largo, blur] of [["rgba(95, 212, 220, 0.35)", 3.4, 10], ["#86e8ee", 1.9, 4], ["rgba(4, 40, 46, 0.75)", 0.55, 0]] as const) {
            g.strokeStyle = colore;
            g.lineWidth = largo;
            g.shadowColor = "rgba(95, 212, 220, 0.8)";
            g.shadowBlur = blur * k;
            forma.forEach((d, i) => {
              const L = lungh[i];
              if (!ridotto) {
                g.setLineDash([L, L]);
                g.lineDashOffset = L * (1 - disegnata);
              }
              g.stroke(new Path2D(d));
            });
          }
          g.restore();
          // la matrice lo aggancia: quattro angoli che si stringono, nell'ultimo istante prima della lettera
          if (!ridotto && t >= M.traduzione[0]) {
            const aggancio = fra(t, riconosciuto - 0.4, riconosciuto + 0.15);
            if (aggancio > 0 && aggancio < 1) {
              const largo = (1.5 - 0.5 * morbido(Math.min(1, aggancio / 0.7))) * glifoW * 0.75;
              const alto = (1.5 - 0.5 * morbido(Math.min(1, aggancio / 0.7))) * glifoH * 0.62;
              const cy = yTitolo - glifoH * 0.34;
              const a = 0.12 * glifoW;
              g.save();
              g.strokeStyle = `rgba(150, 236, 240, ${0.7 * Math.sin(Math.PI * aggancio)})`;
              g.lineWidth = Math.max(1, 1.2 * k);
              g.beginPath();
              for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
                const xx = cx + sx * largo, yy = cy + sy * alto;
                g.moveTo(xx - sx * a, yy);
                g.lineTo(xx, yy);
                g.lineTo(xx, yy - sy * a);
              }
              g.stroke();
              g.restore();
            }
          }
        }
        if (alfaLettera > 0) {
          // la lettera trovata nasce ciano e si raffredda nel bianco del titolo
          const nuova = t < T.pieno ? 1 - lettera : 0;
          g.save();
          g.shadowColor = `rgba(120, 230, 236, ${0.9 * nuova})`;
          g.shadowBlur = 18 * k * nuova;
          g.fillStyle = `rgba(${Math.round(236 - 90 * nuova)}, ${Math.round(240 - 10 * nuova)}, ${Math.round(238 + 4 * nuova)}, ${alfaLettera})`;
          g.fillText(gl.lettera, cx, yTitolo);
          g.restore();
        }
      }
      // una luce passa sul titolo, una volta, appena è intero
      const passa = fra(t, T.pieno + 0.5, T.pieno + 2.6);
      if (!ridotto && passa > 0 && passa < 1 && titolo > 0) {
        const xs = W * (0.2 + 0.6 * morbido(passa));
        const luce = g.createLinearGradient(xs - 0.07 * W, 0, xs + 0.07 * W, 0);
        luce.addColorStop(0, "rgba(255,255,255,0)");
        luce.addColorStop(0.5, `rgba(255,252,244,${0.55 * titolo * Math.sin(Math.PI * passa)})`);
        luce.addColorStop(1, "rgba(255,255,255,0)");
        g.save();
        g.globalCompositeOperation = "lighter";
        g.fillStyle = luce;
        g.shadowColor = "rgba(255,250,240,0.6)";
        g.shadowBlur = 14 * k;
        for (const gl of glifi) g.fillText(gl.lettera, posti[gl.indice], yTitolo);
        g.restore();
      }
      // il sottotitolo, dopo il titolo: in tondo, e il titolo del libro in corsivo (l'uso italiano;
      // il testo è dell'autore, 19 ottobre 2026)
      const sotto = titolo * morbido(fra(t, T.pieno + 0.2, T.pieno + 1.6));
      if (sotto > 0) {
        const fs2 = 0.0165 * W;
        const corsivo = `italic 300 ${fs2}px Newsreader, Georgia, "Times New Roman", serif`;
        const tondo = `300 ${fs2}px Newsreader, Georgia, "Times New Roman", serif`;
        const libro = "Il Registro della Santa Maria";
        const prima = SOTTOTITOLO.slice(0, SOTTOTITOLO.indexOf(libro));
        g.textAlign = "left";
        g.letterSpacing = `${0.02 * fs2}px`;
        g.font = tondo;
        const w1 = g.measureText(prima).width;
        g.font = corsivo;
        const w2 = g.measureText(libro).width;
        const x0 = (W - w1 - w2) / 2;
        g.fillStyle = `rgba(184, 194, 191, ${sotto})`;
        g.font = tondo;
        g.fillText(prima, x0, 0.59 * H);
        g.font = corsivo;
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
    // con la partita sotto, l'intro dura finché si è aperta sul gioco (al più qualche secondo in più)
    const limite = conPartita ? S.durata + 6 : S.durata;
    const ciclo = (ora: number) => {
      if (ultimo !== null && !pausa.current && !finita.current) {
        const dt = Math.min(0.1, (ora - ultimo) / 1000);
        tempo.current = Math.min(limite, tempo.current + dt);
        campioni.push(dt);
        if (campioni.length > 90) campioni = campioni.slice(-90);
        const t = tempo.current;
        if (conPartita) {
          if (!partita.current && t >= M.partita[0]) {
            partita.current = true;
            onPartita?.();
          }
          if (partita.current && giocoPronto.current === null) {
            const img = document.querySelector<HTMLImageElement>(".gioco .lente-vetro img");
            if (img?.complete && img.naturalWidth > 0) giocoPronto.current = t;
          }
          const tR = inizioRivelazione();
          if ((tR !== null && t >= tR + 1.35) || t >= limite) {
            finita.current = true;
            onFine?.();
          }
        } else if (t >= S.durata) {
          finita.current = true;
          onFine?.();
        }
      }
      ultimo = ora;
      fotogramma(Math.min(tempo.current, conPartita ? tempo.current : S.durata));
      if (ora - ultimoAggiornamento > 100) {
        ultimoAggiornamento = ora;
        setMostrato(Math.min(S.durata, tempo.current));
        if (campioni.length > 20) setFps(`${(campioni.length / campioni.reduce((a, b) => a + b, 0)).toFixed(0)} fps`);
      }
      id = requestAnimationFrame(ciclo);
    };
    id = requestAnimationFrame(ciclo);
    return () => cancelAnimationFrame(id);
  }, [pronta, fotogramma, onFine, onPartita, conPartita]);

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
    if (finita.current && !revisione) return;
    vai(S.durata);
    finita.current = true;
    onFine?.();
  }, [vai, onFine, revisione]);
  const alterna = useCallback(() => {
    if (finita.current) vai(0);
    pausa.current = !pausa.current;
    setInPausa(pausa.current);
  }, [vai]);

  // la tastiera: Esc e Spazio saltano; nella revisione Spazio mette in pausa e le frecce spostano.
  // L'intro ascolta per prima: con il gioco già sotto, Esc salta l'intro e non apre il menu
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        saltaAllaFine();
      } else if (e.key === " ") {
        if ((e.target as HTMLElement).tagName === "BUTTON") return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (revisione) alterna();
        else saltaAllaFine();
      } else if (revisione && e.key === "ArrowLeft") vai(tempo.current - 5);
      else if (revisione && e.key === "ArrowRight") vai(tempo.current + 5);
      else if (revisione && e.key === "Home") vai(0);
    };
    addEventListener("keydown", tasto, true);
    return () => removeEventListener("keydown", tasto, true);
  }, [revisione, alterna, saltaAllaFine, vai]);

  useEffect(() => {
    if (pronta) fotogramma(tempo.current);
  }, [opzioni, pronta, fotogramma]);

  // la grana sopra la plancia: una tessera di rumore, fatta una volta
  const tessera = useMemo(() => {
    if (typeof document === "undefined") return "";
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    if (!g) return "";
    const d = g.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = 128 + (caso(i, 7) + caso(i, 13) - 1) * 46;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    return c.toDataURL("image/png");
  }, []);

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
      {b.voce === "apparecchio" ? (
        <>
          <span className="scritto" />
          <span className="cursore">▌</span>
          <span className="resto">{b.testo}</span>
        </>
      ) : (
        b.testo
      )}
    </div>
  );

  return (
    <div ref={radice} className={`intro${!revisione && pronta ? " in-corso" : ""}${conPartita ? " sopra" : ""}`} style={{ ["--barra" as string]: revisione ? "112px" : "0px" }}>
      <div
        className="palco"
        ref={palco}
        aria-label="L’intro del Relitto Silente"
        onClick={() => {
          if (!revisione) saltaAllaFine();
        }}
      >
        <canvas ref={spazio} aria-hidden="true" />
        <canvas ref={canvasPlancia} className="plancia" aria-hidden="true" />
        <div className="grana-intro" ref={strato} aria-hidden="true" style={{ backgroundImage: tessera ? `url(${tessera})` : undefined }} />
        <canvas ref={sopra} aria-hidden="true" />
        {S.blocchi.filter((b) => b.voce !== "titolo").map(blocco)}
        <div className="didascalia" ref={didascalia} aria-hidden="true">
          <span className="rec" />
          cam 01 · plancia · tsc-1972
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
        <div className="revisione" role="group" aria-label="Revisione dell’intro">
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
