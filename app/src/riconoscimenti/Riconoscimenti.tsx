// ============================================================================
//  «Riconoscimenti e licenze» (06-app-desktop.md, §18.3). Prima del gioco al
//  primo avvio e dopo ogni aggiornamento che aggiunge nomi, saltabile dopo tre
//  secondi; sempre raggiungibile dal menu. L'elenco lo genera
//  strumenti/riconoscimenti.py dagli elenchi veri (i suoni, le immagini, i
//  caratteri, i pacchetti JavaScript, i crate Rust, Pyodide), così non resta
//  mai indietro; i testi delle licenze stanno in fondo, interi.
//  Gli indirizzi si leggono e si copiano, ma non si aprono: l'app non va in rete.
//  Impaginato per lo schermo largo (nota dell'autore sulla 0.2.4: è un gioco da
//  scrivania, niente pagine da telefono): a sinistra l'indice delle sezioni, a
//  destra la sezione scelta su più colonne, non un foglio lungo da scorrere.
// ============================================================================
import { useEffect, useRef, useState } from "react";
import type { Elenco, Pacchetto } from "./visti";
import "./riconoscimenti.css";

/** Quanto resta prima di poter andare avanti, al primo avvio. */
const ATTESA = 3000;

const PIATTAFORME: Record<string, string> = {
  "x86_64-pc-windows-msvc": "Windows",
  "x86_64-unknown-linux-gnu": "Linux",
  "aarch64-apple-darwin": "macOS",
};

const NOMI_LICENZE: Record<string, string> = {
  "MIT": "MIT",
  "Apache-2.0": "Apache 2.0",
  "MPL-2.0": "Mozilla Public License 2.0",
  "OFL-1.1": "SIL Open Font License 1.1",
  "PSF-2.0": "Python Software Foundation License",
  "Unicode-3.0": "Unicode License v3",
  "BSD-3-Clause": "BSD a tre clausole",
  "Zlib": "zlib",
  "Unlicense": "Unlicense",
  "0BSD": "BSD a zero clausole",
  "CC0-1.0": "CC0 1.0",
};
const nomeLicenza = (spdx: string) => NOMI_LICENZE[spdx] ?? spdx;
/** «Copyright (c) 2023 X» diventa «© 2023 X»: vale lo stesso, e nelle colonne dei crate sta in una riga. */
const conSimbolo = (c: string) => c.replace(/^\s*copyright\s*(\(c\)|©)?\s*/i, "© ");
const licenze = (p: Pacchetto) => p.usata.map(nomeLicenza).join(" e ");

interface Props {
  elenco: Elenco;
  /** al primo avvio: si va avanti dopo tre secondi; altrimenti si torna al menu */
  primoAvvio: boolean;
  avanti: () => void;
}

/** Quanto sfumano le scritte prima della dichiarazione (riconoscimenti.css). */
const SFUMA = 800;

/** Le sezioni dell'indice, nell'ordine. */
type Sezione = { id: string; titolo: string; conto?: number };

export default function Riconoscimenti({ elenco: e, primoAvvio, avanti: poi }: Props) {
  const [pronto, setPronto] = useState(!primoAvvio);
  // al primo avvio le scritte sfumano, e sullo stesso fondo arriva la dichiarazione
  const [uscita, setUscita] = useState(false);
  const avanti = () => {
    if (!primoAvvio) return poi();
    if (uscita) return;
    setUscita(true);
    const ridotto = document.querySelector("[data-movimento='ridotto']") !== null;
    setTimeout(poi, ridotto ? 300 : SFUMA);
  };
  const foglio = useRef<HTMLDivElement>(null);
  const indice = useRef<HTMLDivElement>(null);

  const sezioni: Sezione[] = [
    { id: "gioco", titolo: "Il gioco" },
    { id: "fondamenta", titolo: "Le fondamenta", conto: e.principali.length },
    { id: "musica", titolo: "La musica", conto: e.musica.length },
    { id: "suoni", titolo: "I suoni", conto: e.suoni.length || undefined },
    { id: "immagini", titolo: "Le immagini", conto: e.immagini.length },
    { id: "caratteri", titolo: "I caratteri", conto: e.caratteri.length },
    { id: "pagina", titolo: "Le librerie della pagina", conto: e.javascript.length },
    ...Object.entries(e.rust).map(([piattaforma, crate]) => ({
      id: `rust-${piattaforma}`,
      titolo: `Le librerie del programma · ${PIATTAFORME[piattaforma] ?? piattaforma}`,
      conto: crate.length,
    })),
    { id: "licenze", titolo: "I testi delle licenze", conto: Object.keys(e.testi).length },
  ];
  const [scelta, setScelta] = useState("gioco");
  const [licenza, setLicenza] = useState(Object.keys(e.testi)[0] ?? "");
  const sezione = sezioni.find((x) => x.id === scelta) ?? sezioni[0];

  const scegli = (id: string) => {
    setScelta(id);
    if (foglio.current) foglio.current.scrollTop = 0;
  };

  useEffect(() => {
    // il fuoco sul foglio (le frecce scorrono, Invio prosegue), senza contorno: nessuno l'ha scelto
    foglio.current?.focus({ preventScroll: true, focusVisible: false });
    if (!primoAvvio) return;
    const t = setTimeout(() => setPronto(true), ATTESA);
    return () => clearTimeout(t);
  }, [primoAvvio]);

  useEffect(() => {
    const tasto = (ev: KeyboardEvent) => {
      if (!pronto) return;
      if (ev.key === "Escape" || (primoAvvio && ev.key === "Enter" && ev.target === foglio.current)) {
        ev.preventDefault();
        avanti();
      }
    };
    addEventListener("keydown", tasto);
    return () => removeEventListener("keydown", tasto);
  }, [pronto, primoAvvio, avanti]); // eslint-disable-line react-hooks/exhaustive-deps

  // l'indice (ARIA tabs, in verticale): le frecce passano da una sezione all'altra
  const frecce = (ev: React.KeyboardEvent) => {
    const i = sezioni.findIndex((x) => x.id === scelta);
    const n = sezioni.length;
    const j = ev.key === "ArrowDown" ? (i + 1) % n : ev.key === "ArrowUp" ? (i - 1 + n) % n : ev.key === "Home" ? 0 : ev.key === "End" ? n - 1 : -1;
    if (j < 0) return;
    ev.preventDefault();
    scegli(sezioni[j].id);
    requestAnimationFrame(() => indice.current?.querySelector<HTMLElement>(`[data-sezione="${sezioni[j].id}"]`)?.focus());
  };

  return (
    <div className={`riconoscimenti${uscita ? " uscita" : ""}`}>
      <div className="ric-corpo">
        <nav className="ric-indice" aria-label="Sezioni dei riconoscimenti">
          <h1>Riconoscimenti e licenze</h1>
          <div className="ric-schede" role="tablist" aria-orientation="vertical" ref={indice} onKeyDown={frecce}>
            {sezioni.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                id={`ric-${x.id}`}
                data-sezione={x.id}
                aria-selected={x.id === scelta}
                aria-controls="ric-foglio"
                tabIndex={x.id === scelta ? 0 : -1}
                onClick={() => scegli(x.id)}
              >
                <span>{x.titolo}</span>
                {x.conto !== undefined && <span className="ric-conto">{x.conto}</span>}
              </button>
            ))}
          </div>
        </nav>

        <div id="ric-foglio" className="ric-foglio" ref={foglio} tabIndex={0} role="tabpanel" aria-labelledby={`ric-${sezione.id}`}>
          {sezione.id === "gioco" ? (
            <section className="ric-gioco">
              <p className="ric-titolo">{e.gioco.titolo}</p>
              <p className="ric-autore">di {e.gioco.autore}</p>
              <p className="ric-racconto">
                <i>dal racconto «Il Relitto», in</i> Dal registro della Santa Maria
              </p>
              <p className="ric-marchi">
                I loghi d’apertura vengono da Il Viaggiatore, dello stesso autore. I marchi di Runtime Multimedia e di FAVELLA 1 sono
                dei loro titolari, e non rientrano nelle licenze del gioco.
              </p>
            </section>
          ) : (
            <section>
              <h2>
                {sezione.titolo}
                {sezione.conto !== undefined && <span className="ric-conto">{sezione.conto}</span>}
              </h2>
              {sezione.id === "fondamenta" && (
                <ul className="ric-voci">
                  {e.principali.map((p) => (
                    <li key={p.nome}>
                      <span className="ric-nome">
                        {p.nome} <span className="ric-versione">{p.versione}</span>
                      </span>
                      <span className="ric-ruolo">{p.ruolo}</span>
                      <Note p={p} />
                    </li>
                  ))}
                </ul>
              )}
              {sezione.id === "musica" && (
                <>
                  <p className="ric-nota">
                    Generata con l'intelligenza artificiale (Lyria 3.5 di Google, in Flow Music, e Suno) su indicazione e scelta dell'autore, che ne è il
                    regista. I brani di Lyria portano la filigrana SynthID.
                  </p>
                  <ul className="ric-voci">
                    {e.musica.map((m) => (
                      <li key={m.sigla + m.titolo}>
                        <span className="ric-nome">«{m.titolo}»</span>
                        <span className="ric-ruolo">
                          {m.uso} · di {m.autore}, con {m.modello}
                        </span>
                        <span className="ric-licenza">{m.licenza}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {sezione.id === "suoni" && (
                <>
                  {e.suoni.length === 0 && <p className="ric-nota">Ogni suono del gioco è sintetizzato nel suo motore audio, senza registrazioni.</p>}
                  <ul className="ric-voci">
                    {e.suoni.map((s) => (
                      <li key={s.sigla}>
                        <span className="ric-nome">«{s.titolo}»</span>
                        <span className="ric-ruolo">
                          di {s.autore}, da {s.fonte}
                        </span>
                        <span className="ric-licenza">
                          {s.licenza}
                          {s.ridistribuibile === "no" ? " · non ridistribuibile fuori dal gioco" : ""}
                        </span>
                        {s.url && <span className="ric-sorgente">{s.url}</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {sezione.id === "immagini" && (
                <ul className="ric-voci">
                  {e.immagini.map((i) => (
                    <li key={i.file}>
                      <span className="ric-nome">{i.che_cosa.replace(/^./, (x) => x.toUpperCase())}</span>
                      <span className="ric-ruolo">{i.da_dove}</span>
                      <span className="ric-licenza">
                        {i.autore} · {i.licenza}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {sezione.id === "caratteri" && (
                <ul className="ric-voci">
                  {e.caratteri.map((c) => (
                    <li key={c.nome}>
                      <span className="ric-nome">
                        {c.famiglia} <span className="ric-versione">{c.versione}</span>
                      </span>
                      <span className="ric-ruolo">{c.ruolo}</span>
                      <Note p={c} />
                    </li>
                  ))}
                </ul>
              )}
              {sezione.id === "pagina" && (
                <ul className="ric-voci">
                  {e.javascript.map((p) => (
                    <li key={p.nome}>
                      <span className="ric-nome">
                        {p.nome} <span className="ric-versione">{p.versione}</span>
                      </span>
                      <Note p={p} />
                    </li>
                  ))}
                </ul>
              )}
              {sezione.id.startsWith("rust-") && (
                <ul className="ric-crate">
                  {(e.rust[sezione.id.slice("rust-".length)] ?? []).map((p) => (
                    <li key={`${p.nome}@${p.versione}`}>
                      <span className="ric-nome">{p.nome}</span> <span className="ric-versione">{p.versione}</span>
                      <span className="ric-licenza">{licenze(p)}</span>
                      <span className="ric-copyright">{(p.copyright.length ? p.copyright.map(conSimbolo) : (p.autori ?? []).map((a) => `© ${a}`)).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              )}
              {sezione.id === "licenze" && (
                <>
                  <p className="ric-nota">Dove un pacchetto si può usare con più licenze, il gioco lo usa con quella scritta accanto al suo nome.</p>
                  <div className="ric-licenze">
                    <div className="ric-licenze-nomi">
                      {Object.keys(e.testi).map((spdx) => (
                        <button key={spdx} type="button" aria-pressed={spdx === licenza} onClick={() => setLicenza(spdx)}>
                          {nomeLicenza(spdx)}
                        </button>
                      ))}
                    </div>
                    <pre className="ric-testo" aria-label={`Il testo della licenza ${nomeLicenza(licenza)}`}>
                      {e.testi[licenza]}
                    </pre>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      </div>
      <footer className="ric-piede">
        <button type="button" disabled={!pronto} onClick={avanti} className={pronto ? "pronto" : "attesa"}>
          {primoAvvio ? "Continua" : "Torna al menu"} <span className="tasto">{primoAvvio ? "Invio" : "Esc"}</span>
          {primoAvvio && <span className="ric-attesa" aria-hidden="true" />}
        </button>
      </footer>
    </div>
  );
}

function Note({ p }: { p: Pacchetto }) {
  const chi = p.copyright.length ? p.copyright : (p.autori ?? []).map((a) => `© ${a}`);
  return (
    <>
      <span className="ric-licenza">{licenze(p)}</span>
      {chi.map((c) => (
        <span key={c} className="ric-copyright">
          {c}
        </span>
      ))}
      {p.sorgente && <span className="ric-sorgente">{p.sorgente}</span>}
    </>
  );
}
