// ============================================================================
//  «Riconoscimenti e licenze» (06-app-desktop.md, §18.3). Prima del gioco al
//  primo avvio e dopo ogni aggiornamento che aggiunge nomi, saltabile dopo tre
//  secondi; sempre raggiungibile dal menu. L'elenco lo genera
//  strumenti/riconoscimenti.py dagli elenchi veri (i suoni, le immagini, i
//  caratteri, i pacchetti JavaScript, i crate Rust, Pyodide), così non resta
//  mai indietro; i testi delle licenze stanno in fondo, interi.
//  Gli indirizzi si leggono e si copiano, ma non si aprono: l'app non va in rete.
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
const licenze = (p: Pacchetto) => p.usata.map(nomeLicenza).join(" e ");

interface Props {
  elenco: Elenco;
  /** al primo avvio: si va avanti dopo tre secondi; altrimenti si torna al menu */
  primoAvvio: boolean;
  avanti: () => void;
}

export default function Riconoscimenti({ elenco: e, primoAvvio, avanti }: Props) {
  const [pronto, setPronto] = useState(!primoAvvio);
  const foglio = useRef<HTMLDivElement>(null);

  useEffect(() => {
    foglio.current?.focus({ preventScroll: true });
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
  }, [pronto, primoAvvio, avanti]);

  return (
    <div className="riconoscimenti">
      <div className="ric-foglio" ref={foglio} tabIndex={0} aria-label="Riconoscimenti e licenze">
        <div className="ric-colonna">
          <h1>Riconoscimenti e licenze</h1>

          <section className="ric-gioco">
            <p className="ric-titolo">{e.gioco.titolo}</p>
            <p>di {e.gioco.autore}</p>
            <p className="ric-racconto">
              <i>dal racconto «Il Relitto», in</i> Dal registro della Santa Maria
            </p>
          </section>

          <section>
            <h2>Le fondamenta</h2>
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
          </section>

          <section>
            <h2>I suoni</h2>
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
          </section>

          <section>
            <h2>Le immagini</h2>
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
          </section>

          <section>
            <h2>I caratteri</h2>
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
          </section>

          <section>
            <h2>Le librerie della pagina</h2>
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
          </section>

          {Object.entries(e.rust).map(([piattaforma, crate]) => (
            <section key={piattaforma}>
              <h2>
                Le librerie del programma · {PIATTAFORME[piattaforma] ?? piattaforma}
                <span className="ric-conto">{crate.length}</span>
              </h2>
              <ul className="ric-crate">
                {crate.map((p) => (
                  <li key={`${p.nome}@${p.versione}`}>
                    <span className="ric-nome">{p.nome}</span> <span className="ric-versione">{p.versione}</span>
                    <span className="ric-licenza">{licenze(p)}</span>
                    <span className="ric-copyright">{(p.copyright.length ? p.copyright : (p.autori ?? []).map((a) => `© ${a}`)).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <section>
            <h2>I testi delle licenze</h2>
            <p className="ric-nota">
              Dove un pacchetto si può usare con più licenze, il gioco lo usa con quella scritta accanto al suo nome.
            </p>
            {Object.entries(e.testi).map(([spdx, testo]) => (
              <details key={spdx} className="ric-testo">
                <summary>{nomeLicenza(spdx)}</summary>
                <pre>{testo}</pre>
              </details>
            ))}
          </section>
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
