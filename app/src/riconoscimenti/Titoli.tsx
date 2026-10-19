// ============================================================================
//  I titoli di coda (decisione dell'autore, 19 ottobre 2026): i riconoscimenti
//  non stanno più prima del gioco, in una schermata da sito; scorrono alla fine,
//  come al cinema, con la loro canzone, «Voice in the Deep» (mondo/musica.rs,
//  `Brano::Titoli`), e sono tarati su di lei: l'ultimo cartello arriva con
//  l'ultima riga cantata, resta fermo tre secondi, e tutto sfuma lentamente nel
//  nero insieme alla canzone. Partono dopo un finale («Titoli di coda», accanto ad
//  «Annulla l'ultima mossa», «Ricomincia», «Carica») e dalla voce
//  «Riconoscimenti» del menu; alla fine si torna al menu.
//  Scorrono i nomi: l'elenco lo genera strumenti/riconoscimenti.py (elenco.json),
//  che scrive anche, accanto al gioco, il file con le righe di copyright e i
//  testi interi delle licenze. Finiscono fermi sull'ultimo cartello: il titolo e,
//  in bianco, i marchi di Runtime Multimedia e di Favella1 (loghi/Marchi.tsx).
//  «salta», Esc o Invio li chiudono; la rotella del mouse li porta avanti e
//  indietro. Con il movimento ridotto non scorrono: si mostrano a pagine, in
//  dissolvenza.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import elencoJson from "./elenco.json";
import { nomiDelleLibrerie, type Elenco } from "./elenco";
import { sfumaSuono, titoliSuono } from "../gioco/suono";
import { MarchioFavella, MarchioRuntime } from "../loghi/Marchi";
import "./titoli.css";

const E = elencoJson as unknown as Elenco;

/** Il file accanto al gioco con le note intere (strumenti/riconoscimenti.py, tauri.conf.json). */
export const FILE_LICENZE = "Riconoscimenti e licenze.txt";

/** La canzone dei titoli, «Voice in the Deep» (documento 22, §5.9; audio/musica-ia/REGISTRO.md):
 *  dura 2:58, e la voce canta da sola l'ultima riga, «A voice in the deep», a 160,5 secondi. Il
 *  nastro è tarato su di lei (scelta dell'autore, 19 ottobre 2026): l'ultimo cartello arriva al
 *  centro in quell'istante, a qualunque altezza di schermo. */
const ARRIVO_S = 160.5;
/** Con il movimento ridotto: quanto dura la dissolvenza fra una pagina e l'altra. */
const DISSOLVENZA_MS = 700;
/** Quanto resta fermo l'ultimo cartello, il titolo e i marchi, prima di sfumare. */
const TENUTA_MS = 3000;
/** La fine: i titoli vanno lentamente nel nero, e la canzone sfuma con loro; poi il menu. */
const SFUMATURA_MS = 7000;
/** «salta», Esc o Invio: la stessa cosa, svelta. */
const SALTO_MS = 1200;

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
  /** la chiusura in corso, e quanto dura (ms) */
  const [chiusura, setChiusura] = useState<number | null>(null);
  const fatto = useRef(false);
  const fine = useRef(onFine);
  fine.current = onFine;

  /** Chiude i titoli: lenta alla fine, svelta se si salta. Il nero e la musica sfumano insieme. */
  const chiudi = (lenta = false) => {
    if (fatto.current) return;
    fatto.current = true;
    const ms = lenta ? SFUMATURA_MS : ridotto ? 300 : SALTO_MS;
    setChiusura(ms);
    void sfumaSuono(ms / 1000);
    setTimeout(() => fine.current(), ms);
  };
  const chiudiRef = useRef(chiudi);
  chiudiRef.current = chiudi;

  // la canzone dei titoli; il menu, dopo, rifà il suo mondo
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

  // lo scorrimento: il nastro entra dal basso e sale con l'orologio della canzone, finché l'ultimo
  // cartello (il titolo e i marchi) non è al centro, a ARRIVO_S; lì resta fermo TENUTA_MS, poi
  // tutto sfuma nel nero. Il tempo si legge dall'orologio, non si somma fotogramma per
  // fotogramma: anche se la finestra si ferma un attimo, le parole restano a tempo con la voce.
  // La rotella sposta il nastro avanti e indietro
  useEffect(() => {
    const f = finestra.current;
    const n = nastro.current;
    const c = congedo.current;
    if (!f || !n || !c) return;
    const inizio = performance.now();
    const secondi = () => (performance.now() - inizio) / 1000;
    let quadro = 0;
    let timer = 0;
    let fermo = false;
    /** dove si ferma: il centro dell'ultimo cartello al centro della finestra */
    const fermata = () => f.clientHeight / 2 + c.offsetTop + c.offsetHeight / 2;
    const metti = (pos: number) => (n.style.transform = `translate3d(0, ${f.clientHeight - pos}px, 0)`);
    const tieni = () => {
      if (fermo) return;
      fermo = true;
      timer = window.setTimeout(() => chiudiRef.current(true), TENUTA_MS);
    };

    if (ridotto) {
      // a pagine: ogni pagina è l'80 % della finestra, perché una riga tagliata si rilegga nella
      // successiva; l'ultima è l'ultimo cartello, al centro, e arriva a ARRIVO_S
      const pagine = () => {
        const out: number[] = [];
        for (let p = f.clientHeight; p < fermata(); p += f.clientHeight * 0.8) out.push(p);
        out.push(fermata());
        return out;
      };
      let pagina = 0;
      const mostra = () => {
        const tutte = pagine();
        pagina = Math.min(pagina, tutte.length - 1);
        metti(tutte[pagina]);
        n.style.opacity = "1";
        if (pagina === tutte.length - 1) tieni();
      };
      // ogni pagina resta lo stesso tempo, così l'ultima arriva con l'ultima riga
      const intervallo = () => (ARRIVO_S * 1000) / Math.max(1, pagine().length - 1);
      const avanti = () => {
        if (fermo) return;
        n.style.opacity = "0";
        timer = window.setTimeout(() => {
          pagina += 1;
          mostra();
          if (!fermo) timer = window.setTimeout(avanti, intervallo() - DISSOLVENZA_MS);
        }, DISSOLVENZA_MS);
      };
      mostra();
      timer = window.setTimeout(avanti, intervallo() - DISSOLVENZA_MS);
      const rotella = (e: WheelEvent) => {
        e.preventDefault();
        if (fermo) return;
        pagina = Math.max(0, pagina + Math.sign(e.deltaY));
        mostra();
      };
      f.addEventListener("wheel", rotella, { passive: false });
      return () => {
        clearTimeout(timer);
        f.removeEventListener("wheel", rotella);
      };
    }

    let spinta = 0; // quanto ha spostato la rotella, in pixel
    const giro = () => {
      const pos = Math.min(fermata(), Math.max(0, (secondi() / ARRIVO_S) * fermata() + spinta));
      metti(pos);
      if (pos >= fermata()) tieni();
      quadro = requestAnimationFrame(giro);
    };
    metti(0);
    quadro = requestAnimationFrame(giro);
    const rotella = (e: WheelEvent) => {
      e.preventDefault();
      if (!fermo) spinta += e.deltaY;
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
    <div
      className={`titoli${chiusura !== null ? " chiusura" : ""}${ridotto ? " a-pagine" : ""}`}
      style={chiusura !== null ? ({ "--chiusura": `${chiusura}ms` } as React.CSSProperties) : undefined}
      role="region"
      aria-label="Titoli di coda"
    >
      <div className="titoli-finestra" ref={finestra}>
        <div className="titoli-nastro" ref={nastro}>
          <section className="tit-apertura">
            <p className="tit-titolo">{E.gioco.titolo}</p>
            <p className="tit-autore">di {E.gioco.autore}</p>
            <p className="tit-racconto">
              Una storia tratta da <i>Il Registro della Santa Maria</i>
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
              I loghi d’apertura vengono da Il Viaggiatore, dello stesso autore. I marchi di Runtime Multimedia e di Favella1 sono dei loro
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
      <button type="button" className="titoli-salta" ref={salta} onClick={() => chiudi()}>
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
