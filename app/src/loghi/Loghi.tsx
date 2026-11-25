// ====================================================================
//  I loghi all'avvio: Runtime Multimedia, poi Favella1, poi l'avviso.
// --------------------------------------------------------------------
//  Due loghi che si creano davanti a chi guarda (src/loghi/): lo schermo di
//  Runtime che si accende, scrive il marchio e si spegne come un tubo
//  catodico; il simbolo di FAVELLA che si compone pezzo per pezzo, con la
//  scritta e il motto battuto a macchina. Un solo orologio
//  (requestAnimationFrame) per tutti e due: ogni logo riceve il suo tempo e
//  scrive soltanto stili e attributi. Il suono (src/loghi/suono.ts) si
//  programma tutto all'inizio sul clock dell'audio, e l'orologio delle
//  immagini parte con lui. Si parte a caratteri caricati, perché scritta e
//  motto di FAVELLA si misurano su Sora e Inter.
//  Esc o un clic saltano i loghi (il clic non nel primo secondo: il secondo
//  clic di un doppio clic su «Nuova partita» cadrebbe qui). Con il movimento
//  ridotto non si mostrano: quello delle Opzioni del gioco, o quello del sistema
//  se il gioco non dice niente. Il suono segue il «Volume generale» (revisione
//  37, M3).
//  Dal 14 novembre 2026 i loghi sono l'inizio della cinematica d'apertura
//  (documento 09, §16): stanno nello stesso formato largo dell'intro, con le
//  bande nere sopra e sotto, e sotto la stessa pellicola (pellicola/). I due
//  loghi non sono cambiati: è cambiato il quadro in cui stanno. E passano due
//  volte: all'avvio del gioco, e di nuovo subito prima dell'intro, quando si
//  comincia una partita nuova (l'autore: «legare i loghi […] alla cinematica
//  iniziale anche se significa ripeterli»): lì stanno sopra l'intro, che sotto
//  si prepara e parte quando finiscono.
//  Prima dell'intro aspettano `parti` (Relitto.tsx): l'intro, sotto, prepara
//  la nave nella scheda video e per qualche secondo il disegno si ferma; se
//  quei secondi cadevano sul logo di Runtime, lo si sentiva e non lo si vedeva
//  (l'autore, 16 novembre 2026). Fino ad allora, nero.
//  Dal 25 novembre 2026 il logo di Runtime Multimedia è il filmato dell'autore
//  (8,5 s, nel formato largo dei loghi: public/loghi/), muto, con il suo suono
//  nella partitura dei loghi (suono.ts), così segue il volume come prima e parte
//  sullo stesso orologio. L'orologio delle immagini tiene il filmato al passo.
//  Dove il filmato non si può suonare (o non arriva in tre secondi) resta il
//  logo animato di prima, con il suo suono sintetizzato.
//  Solo in sviluppo: ?loghi=3.2 ferma l'orologio a quel secondo (muto);
//  window.__loghiT lo sposta, window.__rendiSuonoLoghi rende l'audio in un
//  file (vedi src/loghi/esporta.ts): servono a esportare i video dei loghi.
// ====================================================================
import { useEffect, useRef, useState } from "react";
import LogoRuntime, { DURATA_RUNTIME, type Animabile } from "../loghi/LogoRuntime";
import LogoFavella, { DURATA_FAVELLA } from "../loghi/LogoFavella";
import { caricaSuonoFilmato, SuonoLoghi, type SuonoFilmato } from "../loghi/suono";
import Pellicola, { type PellicolaViva } from "../pellicola/Pellicola";
import { BANDA } from "../pellicola/scatti";

const CODA = 0.35;   // nero dopo l'ultimo logo

/** Il filmato del logo di Runtime Multimedia, muto, e il suo suono (documento 09). */
const FILMATO = "./loghi/runtime-multimedia.webm";
const SUONO_FILMATO = "./loghi/runtime-multimedia.mp3";
export const DURATA_FILMATO = 8.5;
/** Quanto si aspetta il filmato, al più, prima di ripiegare sul logo animato. */
const ATTESA_FILMATO = 3000;
const filmatoPossibile = () => typeof document !== "undefined" && document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== "";
const CARATTERI = ["700 100px Sora", "400 40px Inter"];

const fermo = (() => {
  if (!import.meta.env.DEV) return null;
  const v = new URLSearchParams(location.search).get("loghi");
  return v !== null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null;
})();
if (import.meta.env.DEV) import("../loghi/esporta").then((m) => m.installa());

/** Per quanti millisecondi dalla comparsa un clic non salta i loghi. */
const GUARDIA_DEL_CLIC = 1000;

export default function Loghi({ onFine, grana = "mossa", pellicola = true, parti = true, ridotto, volume = 1 }: { onFine: () => void; grana?: "mossa" | "ferma" | "no"; pellicola?: boolean; parti?: boolean; /** il movimento ridotto come lo vuole il gioco (le Opzioni, o il sistema) */ ridotto?: boolean; /** il «Volume generale» delle Opzioni, da 0 a 1 */ volume?: number }) {
  const film = useRef<PellicolaViva>(null);
  const runtime = useRef<Animabile>(null);
  const favella = useRef<Animabile>(null);
  const [caratteri, setCaratteri] = useState(false);
  // il filmato di Runtime: «attesa» finché non si può suonare, poi «si» o, se non arriva, «no» (il logo animato)
  const video = useRef<HTMLVideoElement>(null);
  const [filmato, setFilmato] = useState<"attesa" | "si" | "no">(() => (filmatoPossibile() ? "attesa" : "no"));
  const suonoFilmato = useRef<AudioBuffer | null>(null);
  // partono a caratteri caricati, con il filmato pronto (o lasciato perdere), e quando chi li ospita lo dice
  const pronti = caratteri && parti && filmato !== "attesa";
  const fatto = useRef(false);
  const fine = useRef(onFine);
  fine.current = onFine;
  const chiudi = () => { if (!fatto.current && fermo === null) { fatto.current = true; fine.current(); } };
  const nato = useRef(performance.now());
  const livello = useRef(volume);
  livello.current = volume;

  useEffect(() => {
    if (ridotto ?? window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { chiudi(); return; }
    let vivo = true;
    const caratteri = Promise.all(CARATTERI.map((f) => document.fonts?.load(f).catch(() => null)));
    Promise.race([caratteri, new Promise((r) => setTimeout(r, 1500))])
      .then(() => { if (vivo) { favella.current?.prepara?.(); setCaratteri(true); } });
    // il filmato e il suo suono: tutti e due pronti; se il filmato non si legge, il logo animato
    if (filmatoPossibile()) {
      const v = video.current;
      const immagini = new Promise<boolean>((r) => {
        if (!v) return r(false);
        if (v.readyState >= 3) return r(true);
        v.addEventListener("canplay", () => r(true), { once: true });
        v.addEventListener("error", () => r(false), { once: true });
      });
      void Promise.all([immagini, caricaSuonoFilmato(SUONO_FILMATO)]).then(([ok, s]) => {
        suonoFilmato.current = s;
        if (vivo) setFilmato((f) => (f === "attesa" ? (ok ? "si" : "no") : f));
      });
    }
    const tasto = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); chiudi(); } };
    window.addEventListener("keydown", tasto);
    return () => { vivo = false; window.removeEventListener("keydown", tasto); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // l'attesa del filmato si conta da quando tutto il resto è pronto: prima l'intro, sotto, può tenere ferma la pagina
  // per qualche secondo (prepara la nave nella scheda video), e un conto partito prima scadeva a vuoto
  useEffect(() => {
    if (!caratteri || !parti || filmato !== "attesa") return;
    const t = setTimeout(() => setFilmato((f) => (f === "attesa" ? "no" : f)), ATTESA_FILMATO);
    return () => clearTimeout(t);
  }, [caratteri, parti, filmato]);

  useEffect(() => {
    if (!pronti) return;
    const conFilmato = filmato === "si";
    const primo = conFilmato ? DURATA_FILMATO : DURATA_RUNTIME;
    const durata = primo + DURATA_FAVELLA + CODA;
    const sf: SuonoFilmato | undefined = conFilmato ? { suono: suonoFilmato.current, durata: primo } : undefined;
    const suono = fermo === null ? SuonoLoghi.avvia(livello.current, sf) : null;
    const v = video.current;
    let raf = 0;
    const t0 = performance.now() + (suono?.anticipo ?? 0) * 1000;
    const passo = (ora: number) => {
      const t = fermo !== null ? ((window as unknown as { __loghiT?: number }).__loghiT ?? fermo) : (ora - t0) / 1000;
      // in sviluppo, per esportare un logo alla volta: window.__loghiSolo = "runtime" | "favella"
      const solo = import.meta.env.DEV ? (window as unknown as { __loghiSolo?: string }).__loghiSolo : undefined;
      if (conFilmato && v) {
        // il filmato al passo con l'orologio (e con il suono, che parte sullo stesso istante)
        const dentro = t >= 0 && t < primo;
        v.style.visibility = dentro ? "visible" : "hidden";
        if (fermo !== null) { v.pause(); v.currentTime = Math.min(Math.max(t, 0), primo - 0.05); }
        else if (dentro && v.paused && !v.ended) void v.play().catch(() => {});
        else if (dentro && Math.abs(v.currentTime - t) > 0.12) v.currentTime = t;
      } else if (solo !== "favella") runtime.current?.aggiorna(t);
      if (solo !== "runtime") favella.current?.aggiorna(t - primo);
      film.current?.aggiorna(Math.max(0, t));
      if (t >= durata) { chiudi(); if (fermo === null) return; }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => { cancelAnimationFrame(raf); suono?.sfuma(); v?.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronti]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "#000", cursor: "none", overflow: "hidden", userSelect: "none", display: "grid", placeItems: "center" }}
      aria-label="Loghi di apertura"
      onClick={() => { if (performance.now() - nato.current > GUARDIA_DEL_CLIC) chiudi(); }}>
      {/* il palco 16:9, come quello dell'intro; dentro, l'immagine sotto la pellicola, e le due bande nere sopra a tutto */}
      <div style={{ position: "relative", aspectRatio: "16 / 9", width: "min(100vw, calc(100vh * 16 / 9))", overflow: "hidden" }}>
        <Pellicola ref={film} grana={grana} spenta={!pellicola} banda={BANDA} fondo="#000">
          {/* il filmato nel formato largo, fra le due bande; finché non parte, nascosto */}
          {filmato !== "no" ? (
            <video ref={video} src={FILMATO} muted playsInline preload="auto" aria-hidden="true" disablePictureInPicture
              style={{ position: "absolute", left: 0, width: "100%", top: `${BANDA * 100}%`, height: `${(1 - 2 * BANDA) * 100}%`, objectFit: "cover", background: "#000", visibility: "hidden" }} />
          ) : (
            <LogoRuntime ref={runtime} />
          )}
          <LogoFavella ref={favella} />
        </Pellicola>
        <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: 0, height: `${BANDA * 100}%`, background: "#000" }} />
        <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${BANDA * 100}%`, background: "#000" }} />
      </div>
    </div>
  );
}
