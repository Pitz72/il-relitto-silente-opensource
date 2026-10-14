// ============================================================================
//  Il campionario: la pagina delle misure del sistema visivo (fase 3).
//  I quattro caratteri, ogni atmosfera nei suoi ruoli di testo con i contrasti
//  misurati (gli stessi della prova, da src/stile/atmosfere.ts), il movimento
//  ridotto. Si apre con ?campionario.
// ============================================================================
import type { CSSProperties, ReactNode } from "react";
import {
  coloreAria,
  misura,
  statoAria,
  tavolozza,
  variabiliCss,
  type Clima,
} from "../stile/atmosfere";
import { attributiSchermo, useMovimentoRidotto, useOpzioni, type Opzioni } from "../stile/opzioni";
import "../stile/base.css";
import "./campionario.css";

interface Esempio {
  nome: string;
  quando: string;
  clima: Clima;
  aria: number | null;
  atto: string;
  stanza: string;
}

const ESEMPI: Esempio[] = [
  { nome: "Santa Maria", quando: "Atto I, senza la tuta", clima: { atmosfera: "santamaria", forma: "acciaio", stanza: "plancia", protezione: false, ipossia: false }, aria: null, atto: "Atto I · il margine", stanza: "La plancia" },
  { nome: "Visore", quando: "la tuta indossata", clima: { atmosfera: "visore", forma: "acciaio", stanza: "stiva", protezione: false, ipossia: false }, aria: 100, atto: "Atto I · il margine", stanza: "La stiva" },
  { nome: "Acciaio nella luce fredda", quando: "la camera di compensazione, prima del contatto", clima: { atmosfera: "relitto", forma: "acciaio", stanza: "camera di compensazione", protezione: false, ipossia: false }, aria: 97, atto: "Atto II · il brusio", stanza: "La camera di compensazione" },
  { nome: "Relitto", quando: "dal primo contatto", clima: { atmosfera: "relitto", forma: "membrana", stanza: "vestibolo delle gole", protezione: false, ipossia: false }, aria: 58, atto: "Atto II · il brusio", stanza: "Il vestibolo delle gole" },
  { nome: "Serra morente", quando: "zona del relitto: secca e grigia", clima: { atmosfera: "relitto", forma: "membrana", stanza: "serra morente", protezione: false, ipossia: false }, aria: 64, atto: "Atto III · le voci", stanza: "La serra morente" },
  { nome: "Laboratorio di risonanza", quando: "zona del relitto: elettrica", clima: { atmosfera: "relitto", forma: "membrana", stanza: "laboratorio di risonanza", protezione: false, ipossia: false }, aria: 44, atto: "Atto III · le voci", stanza: "Il laboratorio di risonanza" },
  { nome: "Protezione vitale", quando: "aria sotto 30, prima della fuga", clima: { atmosfera: "relitto", forma: "membrana", stanza: "alloggio dell'equipaggio", protezione: true, ipossia: false }, aria: 27, atto: "Atto III · le voci", stanza: "L'alloggio dell'equipaggio" },
  { nome: "Fuga", quando: "Atto V", clima: { atmosfera: "fuga", forma: "membrana", stanza: "sala delle teche", protezione: false, ipossia: false }, aria: 41, atto: "Atto V · la fuga", stanza: "La sala delle teche" },
  { nome: "Ipossia", quando: "aria a 15 e sotto", clima: { atmosfera: "fuga", forma: "membrana", stanza: "gola di mezzo", protezione: false, ipossia: true }, aria: 13, atto: "Atto V · la fuga", stanza: "La gola di mezzo" },
];

const SCRITTA_ARIA: Record<ReturnType<typeof statoAria>, string> = {
  assente: "",
  regolare: "aria",
  ambra: "aria · ambra",
  rosso: "protezione vitale",
  ipossia: "ipossia",
};

const virgola = (n: number, cifre = 1) => n.toFixed(cifre).replace(".", ",");

function Riquadro({ e }: { e: Esempio }) {
  const t = tavolozza(e.clima);
  const stile = variabiliCss(t, e.aria) as CSSProperties;
  const misure = misura(e.clima);
  const acciaio = e.clima.forma === "acciaio";
  return (
    <figure className="esempio">
      <div className="tema riquadro" style={stile} data-forma={e.clima.forma} data-atmosfera={e.clima.atmosfera}>
        <div className="r-atto">{e.atto}</div>
        <div className="r-lamina">
          {acciaio && <div className="r-targa">TSC-1972 · registro di bordo</div>}
          <div className="r-comando">{acciaio ? "› ANALIZZA LA NAVE ALIENA" : "› stacca il risuonatore"}</div>
          <div className="r-stanza">{e.stanza}</div>
          <div className="r-riga" />
          <p className="r-testo">
            Una sala bassa e tonda, la prima vera sala della nave. Tre gole si aprono nella parete verso il buio.
          </p>
          <p className="r-tenue">Stacchi la mano. Il brusio si abbassa, la cifra si ferma.</p>
          <p className="r-testo">
            <span className="r-accento">il navarca</span> · per portarlo via dovresti <span className="r-accento2">STACCARLO</span> ·{" "}
            <span className="r-rosso">PROTEZIONE VITALE</span>
          </p>
        </div>
        {e.aria !== null && (
          <div className="r-aria">
            <b>{e.aria}</b>
            <i>{SCRITTA_ARIA[statoAria(e.aria)]}</i>
          </div>
        )}
      </div>
      <figcaption>
        <b>{e.nome}</b> <span>{e.quando}</span>
        <ul className="misure">
          {misure.map(({ coppia, rapporto }) => (
            <li key={coppia.ruolo} className={rapporto >= coppia.minimo ? "" : "sotto"}>
              {coppia.ruolo} <b>{virgola(rapporto)}</b>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

const CARATTERI: { famiglia: string; ruolo: string; classe: string; campione: ReactNode }[] = [
  {
    famiglia: "Newsreader",
    ruolo: "il testo; corsivi per le voci. Variabile: dimensioni ottiche 6–72, peso 200–800",
    classe: "f-newsreader",
    campione: (
      <>
        <span className="grande">La plancia</span>
        <span>
          Sul quadrante del margine la lancetta sta dove hai imparato a non guardarla. <i>«Questo sarà il mio ultimo ciclo di veglia.»</i>
        </span>
      </>
    ),
  },
  {
    famiglia: "IBM Plex Mono",
    ruolo: "gli strumenti, le letture dello scanner, le cifre (400, 400 corsivo, 500)",
    classe: "f-plex",
    campione: (
      <>
        <span className="grande">58 · 18%</span>
        <span>ANALISI BIOMETRICA — specie: Homo sapiens. MATERIALE NON IN ARCHIVIO.</span>
      </>
    ),
  },
  {
    famiglia: "Big Shoulders Stencil",
    ruolo: "i cartelli e le targhe della Santa Maria. Variabile: dimensioni ottiche 10–72, peso 100–900",
    classe: "f-stencil",
    campione: (
      <>
        <span className="grande">TSC-1972</span>
        <span>Registro di bordo · Atto I · il margine</span>
      </>
    ),
  },
  {
    famiglia: "Atkinson Hyperlegible Next",
    ruolo: "l'alternativa di leggibilità, nelle opzioni. Variabile: peso 200–800, con i corsivi",
    classe: "f-atkinson",
    campione: (
      <>
        <span className="grande">Il vestibolo delle gole</span>
        <span>
          Qualunque cosa sia, per farsi sentire beve dalla tua stessa batteria. <i>«…perché non si muove…»</i>
        </span>
      </>
    ),
  },
];

function Scelta<K extends keyof Opzioni>({ chiave, valori, opzioni, cambia, nome }: { chiave: K; valori: [Opzioni[K], string][]; opzioni: Opzioni; cambia: (c: Partial<Opzioni>) => void; nome: string }) {
  return (
    <div className="scelta" role="group" aria-label={nome}>
      <span>{nome}</span>
      {valori.map(([v, etichetta]) => (
        <button key={String(v)} aria-pressed={opzioni[chiave] === v} onClick={() => cambia({ [chiave]: v } as Partial<Opzioni>)}>
          {etichetta}
        </button>
      ))}
    </div>
  );
}

export default function Campionario() {
  const [opzioni, cambia] = useOpzioni();
  const ridotto = useMovimentoRidotto(opzioni.movimento);
  const fondo = variabiliCss(tavolozza(ESEMPI[3].clima), 58) as CSSProperties;
  return (
    <div className="schermo tema campionario" style={fondo} {...attributiSchermo(opzioni, ridotto)} data-forma="membrana">
      <header>
        <div className="sopra">Il Relitto Silente · fase 3 · campionario</div>
        <h1>Le fondamenta del sistema visivo</h1>
        <p>
          I caratteri dentro l’app, le atmosfere come variabili CSS con i contrasti misurati, il movimento ridotto. I numeri sono quelli della
          prova <code>prove/atmosfere.test.ts</code>: ogni testo sta sopra 4,5:1, il fuoco sopra 3:1.
        </p>
        <div className="scelte">
          <Scelta nome="movimento" chiave="movimento" opzioni={opzioni} cambia={cambia} valori={[["sistema", "del sistema"], ["ridotto", "ridotto"], ["pieno", "pieno"]]} />
          <Scelta nome="carattere" chiave="carattere" opzioni={opzioni} cambia={cambia} valori={[["newsreader", "Newsreader"], ["atkinson", "Atkinson"]]} />
          <Scelta nome="testo" chiave="testoGrande" opzioni={opzioni} cambia={cambia} valori={[[false, "normale"], [true, "grande"]]} />
          <span className="stato-movimento" aria-live="polite">
            movimento {ridotto ? "ridotto" : "pieno"}
            {opzioni.movimento === "sistema" ? " (dal sistema)" : ""}
          </span>
        </div>
      </header>

      <section>
        <h2>I caratteri</h2>
        <div className="caratteri">
          {CARATTERI.map((c) => (
            <div key={c.famiglia} className={`carattere ${c.classe}`}>
              <div className="nome">{c.famiglia}</div>
              <div className="ruolo">{c.ruolo}</div>
              <div className="campione">{c.campione}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Le atmosfere</h2>
        <div className="esempi">
          {ESEMPI.map((e) => (
            <Riquadro key={e.nome} e={e} />
          ))}
        </div>
      </section>

      <section>
        <h2>Il movimento</h2>
        <div className="movimento">
          <div className="visore-prova" aria-hidden="true" />
          <p>
            Il bordo del visore respira al ritmo del fiato. Con il movimento ridotto si ferma: resta il colore. È l’attributo{" "}
            <code>data-movimento</code> sulla radice dello schermo, uno solo per tutto il gioco.
          </p>
        </div>
        <p className="aria-colori">
          {[100, 59, 29, 13].map((a) => (
            <span key={a} style={{ color: coloreAria(a) }}>
              {a} {SCRITTA_ARIA[statoAria(a)]}
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}
