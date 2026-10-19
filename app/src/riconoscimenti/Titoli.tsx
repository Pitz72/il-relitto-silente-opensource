// ============================================================================
//  I titoli di coda (decisione dell'autore, 19 ottobre 2026): i riconoscimenti
//  non stanno più prima del gioco, in una schermata da sito; scorrono alla fine,
//  come al cinema, con la loro musica (per ora il tema, mondo/musica.rs,
//  `Brano::Titoli`). Partono dopo un finale («Titoli di coda», accanto ad
//  «Annulla l'ultima mossa», «Ricomincia», «Carica») e dalla voce
//  «Riconoscimenti» del menu; alla fine si torna al menu.
//  Scorrono i nomi: l'elenco lo genera strumenti/riconoscimenti.py (elenco.json),
//  che scrive anche, accanto al gioco, il file con le righe di copyright e i
//  testi interi delle licenze. Finiscono fermi sull'ultimo cartello: il titolo e,
//  in bianco, i marchi di Runtime Multimedia e di FAVELLA 1 (loghi/Marchi.tsx).
//  «salta», Esc o Invio li chiudono; la rotella del mouse li porta avanti e
//  indietro. Con il movimento ridotto non scorrono: si mostrano a pagine, in
//  dissolvenza.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import elencoJson from "./elenco.json";
import { nomiDelleLibrerie, type Elenco } from "./elenco";
import { titoliSuono } from "../gioco/suono";
import { MarchioFavella, MarchioRuntime } from "../loghi/Marchi";
import "./titoli.css";

const E = elencoJson as unknown as Elenco;

/** Il file accanto al gioco con le note intere (strumenti/riconoscimenti.py, tauri.conf.json). */
export const FILE_LICENZE = "Riconoscimenti e licenze.txt";

/** Quanto ci mette un'altezza di schermo a passare: lento, da leggere. */
const SECONDI_PER_SCHERMO = 13;
/** Con il movimento ridotto: quanto resta ogni pagina, e quanto dura la dissolvenza. */
const PAGINA_MS = 9000;
const DISSOLVENZA_MS = 700;
/** Quanto resta fermo l'ultimo cartello, il titolo e i marchi, prima di sfumare. */
const TENUTA_MS = 6000;
/** La chiusura: i titoli sfumano, poi il menu. */
const CHIUSURA_MS = 1200;

const maiuscola = (s: string) => s.replace(/^./, (x) => x.toUpperCase());
/** Gli apostrofi dell'elenco sono dritti: nei titoli, quelli tipografici. */
const curvi = (s: string) => s.replace(/'/g, "’");

interface Props {
  ridotto: boolean;
  /** finiti o saltati: si torna al menu */
  onFine: () => void;
}

export default function Titoli({ ridotto, onFine }: Props) {
  const finestra = useRef<HTMLDivElement>(null);
  const nastro = useRef<HTMLDivElement>(null);
  const salta = useRef<HTMLButtonElement>(null);
  const congedo = useRef<HTMLElement>(null);
  const [chiusura, setChiusura] = useState(false);
  const fatto = useRef(false);
  const fine = useRef(onFine);
  fine.current = onFine;

  const chiudi = () => {
    if (fatto.current) return;
    fatto.current = true;
    setChiusura(true);
    setTimeout(() => fine.current(), ridotto ? 300 : CHIUSURA_MS);
  };
  const chiudiRef = useRef(chiudi);
  chiudiRef.current = chiudi;

  // la musica dei titoli; il menu, dopo, rifà il suo mondo
  useEffect(() => {
    void titoliSuono();
    // il fuoco su «salta» (Invio lo prende), senza contorno: nessuno l'ha scelto
    salta.current?.focus({ preventScroll: true, focusVisible: false });
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        chiudiRef.current();
      }
    };
    addEventListener("keydown", tasto);
    return () => removeEventListener("keydown", tasto);
  }, []);

  // lo scorrimento: il nastro entra dal basso e sale finché l'ultimo cartello (il titolo e i
  // marchi) non è al centro; lì si ferma, resta qualche secondo, e i titoli sfumano. La rotella
  // lo sposta avanti e indietro
  useEffect(() => {
    const f = finestra.current;
    const n = nastro.current;
    const c = congedo.current;
    if (!f || !n || !c) return;
    let pos = 0; // quanto è salito il nastro, in pixel, dal bordo basso della finestra
    let quadro = 0;
    let prima = performance.now();
    let timer = 0;
    let fermo = false;
    /** dove si ferma: il centro dell'ultimo cartello al centro della finestra */
    const fermata = () => f.clientHeight / 2 + c.offsetTop + c.offsetHeight / 2;
    const metti = () => (n.style.transform = `translate3d(0, ${f.clientHeight - pos}px, 0)`);
    const tieni = () => {
      if (fermo) return;
      fermo = true;
      timer = window.setTimeout(() => chiudiRef.current(), TENUTA_MS);
    };

    if (ridotto) {
      // a pagine: ogni pagina è l'80 % della finestra, perché una riga tagliata si rilegga nella
      // successiva; l'ultima è l'ultimo cartello, al centro
      const passo = () => f.clientHeight * 0.8;
      const pagine = () => {
        const out: number[] = [];
        for (let p = f.clientHeight; p < fermata(); p += passo()) out.push(p);
        out.push(fermata());
        return out;
      };
      let pagina = 0;
      const mostra = () => {
        const tutte = pagine();
        pagina = Math.min(pagina, tutte.length - 1);
        pos = tutte[pagina];
        metti();
        n.style.opacity = "1";
      };
      mostra();
      const avanti = () => {
        if (pagina >= pagine().length - 1) return chiudiRef.current();
        n.style.opacity = "0";
        timer = window.setTimeout(() => {
          pagina += 1;
          mostra();
          timer = window.setTimeout(avanti, pagina >= pagine().length - 1 ? TENUTA_MS : PAGINA_MS);
        }, DISSOLVENZA_MS);
      };
      timer = window.setTimeout(avanti, PAGINA_MS);
      const rotella = (e: WheelEvent) => {
        e.preventDefault();
        pagina = Math.max(0, pagina + Math.sign(e.deltaY));
        mostra();
      };
      f.addEventListener("wheel", rotella, { passive: false });
      return () => {
        clearTimeout(timer);
        f.removeEventListener("wheel", rotella);
      };
    }

    const giro = (ora: number) => {
      const dt = Math.min(0.1, (ora - prima) / 1000);
      prima = ora;
      pos = Math.min(fermata(), pos + (f.clientHeight / SECONDI_PER_SCHERMO) * dt);
      metti();
      if (pos >= fermata()) tieni();
      quadro = requestAnimationFrame(giro);
    };
    metti();
    quadro = requestAnimationFrame(giro);
    const rotella = (e: WheelEvent) => {
      e.preventDefault();
      pos = Math.min(fermata(), Math.max(0, pos + e.deltaY));
      metti();
    };
    f.addEventListener("wheel", rotella, { passive: false });
    return () => {
      cancelAnimationFrame(quadro);
      clearTimeout(timer);
      f.removeEventListener("wheel", rotella);
    };
  }, [ridotto]);

  const librerie = nomiDelleLibrerie(E);

  return (
    <div className={`titoli${chiusura ? " chiusura" : ""}${ridotto ? " a-pagine" : ""}`} role="region" aria-label="Titoli di coda">
      <div className="titoli-finestra" ref={finestra}>
        <div className="titoli-nastro" ref={nastro}>
          <section className="tit-apertura">
            <p className="tit-titolo">{E.gioco.titolo}</p>
            <p className="tit-autore">di {E.gioco.autore}</p>
            <p className="tit-racconto">
              <i>dal racconto «Il Relitto», in</i> Dal registro della Santa Maria
            </p>
          </section>

          <section>
            <h2>Le fondamenta</h2>
            <dl className="tit-coppie">
              {E.principali.map((p) => (
                <Coppia key={p.nome} ruolo={p.ruolo} nome={p.nome} />
              ))}
            </dl>
          </section>

          <section>
            <h2>La musica</h2>
            <p className="tit-nota">
              Generata con l’intelligenza artificiale (Lyria 3.5 di Google, in Flow Music, e Suno), scelta e diretta da {E.gioco.autore}. I brani
              di Lyria portano la filigrana SynthID.
            </p>
            <dl className="tit-coppie">
              {E.musica.map((m) => (
                <Coppia key={m.sigla + m.titolo} ruolo={m.uso} nome={`«${m.titolo}»`} sotto={`con ${m.modello}`} />
              ))}
            </dl>
          </section>

          <section>
            <h2>I suoni</h2>
            {E.suoni.length === 0 ? (
              <p className="tit-nota">Ogni suono del gioco è sintetizzato nel suo motore audio, senza registrazioni.</p>
            ) : (
              <dl className="tit-coppie">
                {E.suoni.map((s) => (
                  <Coppia key={s.sigla} ruolo={s.uso} nome={`«${s.titolo}»`} sotto={`di ${s.autore}`} />
                ))}
              </dl>
            )}
          </section>

          <section>
            <h2>Le immagini</h2>
            <dl className="tit-coppie">
              {E.immagini.map((i) => (
                <Coppia key={i.file} ruolo={maiuscola(i.che_cosa)} nome={i.autore} />
              ))}
            </dl>
          </section>

          <section>
            <h2>I caratteri</h2>
            <dl className="tit-coppie">
              {E.caratteri.map((c) => (
                <Coppia key={c.nome} ruolo={c.ruolo} nome={c.famiglia} />
              ))}
            </dl>
          </section>

          <section>
            <h2>Con le librerie</h2>
            <ul className="tit-nomi">
              {librerie.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>

          <section className="tit-chiusa">
            <p className="tit-nota">
              I loghi d’apertura vengono da Il Viaggiatore, dello stesso autore. I marchi di Runtime Multimedia e di FAVELLA 1 sono dei loro
              titolari, e non rientrano nelle licenze del gioco.
            </p>
            <p className="tit-nota">
              Le righe di copyright e i testi interi delle licenze sono nel file «{FILE_LICENZE}», nella cartella del gioco.
            </p>
          </section>

          <section className="tit-congedo" ref={congedo}>
            <p className="tit-titolo">{E.gioco.titolo}</p>
            <div className="tit-marchi">
              <MarchioRuntime className="tit-marchio tit-runtime" />
              <MarchioFavella className="tit-marchio tit-favella" />
            </div>
          </section>
        </div>
      </div>
      <button type="button" className="titoli-salta" ref={salta} onClick={chiudi}>
        salta <span className="tasto">Esc</span>
      </button>
    </div>
  );
}

function Coppia({ ruolo, nome, sotto }: { ruolo: string; nome: string; sotto?: string }) {
  return (
    <div className="tit-coppia">
      <dt>{curvi(ruolo)}</dt>
      <dd>
        {curvi(nome)}
        {sotto && <span className="tit-sotto">{curvi(sotto)}</span>}
      </dd>
    </div>
  );
}
