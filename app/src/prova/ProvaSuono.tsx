// ============================================================================
//  La sezione «Suono» della pagina di prova: il prototipo dei tre ambienti
//  (progettazione/10-bibbia-sonora.md, §8), tutto sintetizzato nel motore in
//  Rust. Si ascolta dal vivo, con i comandi del mondo sonoro e i colpi uno per
//  uno; con RELITTO_PROVA=mondo misura da sola, scrive il rapporto e chiude.
// ============================================================================
import { useCallback, useEffect, useRef, useState } from "react";
import {
  comando,
  dentroTauri,
  type AmbienteMondo,
  type AvvioMondo,
  type ComandoMondo,
  type EventoMondo,
  type InfoSistema,
  type IstantaneaMondo,
  type MisureAudio,
  type NaveMondo,
  type ProvaMondo,
} from "../lib/tauri";
import { arrotonda, attesa } from "./statistiche";

const AMBIENTI: { id: AmbienteMondo; etichetta: string }[] = [
  { id: "plancia", etichetta: "Plancia" },
  { id: "scafo", etichetta: "Scafo" },
  { id: "vestibolo", etichetta: "Vestibolo" },
  { id: "silenzio", etichetta: "Silenzio" },
];

const EVENTI: { id: EventoMondo; etichetta: string; dove: AmbienteMondo[] }[] = [
  { id: "primo_contatto", etichetta: "Primo contatto", dove: ["vestibolo"] },
  { id: "tocca_venature", etichetta: "Tocca le venature", dove: ["vestibolo"] },
  { id: "sala_tace", etichetta: "La sala tace", dove: ["vestibolo"] },
  { id: "gemito", etichetta: "Un gemito", dove: ["vestibolo"] },
  { id: "goccia", etichetta: "Una goccia", dove: ["vestibolo"] },
  { id: "sorpresa", etichetta: "Sorpresa", dove: ["scafo", "vestibolo"] },
];

// i colpi uno per uno, dove si sentono (la plancia per il metallo, il vestibolo per il resto)
const COLPI: { id: ProvaMondo; etichetta: string; dove: AmbienteMondo[] }[] = [
  { id: "lamiera", etichetta: "Lamiera", dove: ["plancia"] },
  { id: "rele", etichetta: "Relè", dove: ["plancia"] },
  { id: "cigolio", etichetta: "Cigolio", dove: ["plancia"] },
  { id: "spinta", etichetta: "Spinta", dove: ["plancia"] },
  { id: "arpione", etichetta: "Arpione", dove: ["plancia"] },
  { id: "urto", etichetta: "Urto lungo", dove: ["plancia"] },
  { id: "goccia", etichetta: "Goccia", dove: ["vestibolo"] },
  { id: "granello", etichetta: "Granello", dove: ["vestibolo"] },
  { id: "crepa", etichetta: "Crepa", dove: ["vestibolo"] },
  { id: "gemito", etichetta: "Gemito", dove: ["vestibolo"] },
  { id: "una_voce", etichetta: "Una voce sola", dove: ["vestibolo"] },
  { id: "coro", etichetta: "Il coro", dove: ["vestibolo"] },
];

const VERSIONE = __VERSIONE__;

interface Props {
  sistema: InfoSistema | null;
  scrivi: (riga: string) => void;
}

export default function ProvaSuono({ sistema, scrivi }: Props) {
  const [avvio, setAvvio] = useState<AvvioMondo | null>(null);
  const [ambiente, setAmbiente] = useState<AmbienteMondo>("silenzio");
  const [aria, setAria] = useState(100);
  const [nave, setNave] = useState<NaveMondo>("libera");
  const [rampa, setRampa] = useState(1);
  const [cammina, setCammina] = useState(false);
  const [sforzo, setSforzo] = useState(false);
  const [ist, setIst] = useState<IstantaneaMondo | null>(null);
  const [misure, setMisure] = useState<MisureAudio | null>(null);
  const [occupato, setOccupato] = useState(false);

  const manda = useCallback(async (c: ComandoMondo) => {
    await comando("audio_mondo", { comando: c });
  }, []);

  const avvia = useCallback(async () => {
    const a = await comando<AvvioMondo>("audio_mondo_avvia");
    setAvvio(a);
    scrivi(`Mondo sonoro: tutto sintetizzato, avviato in ${arrotonda(a.avvio_ms)} ms`);
    return a;
  }, [scrivi]);

  // quello che il motore dice di sé, cinque volte al secondo
  useEffect(() => {
    if (!avvio) return;
    const id = setInterval(async () => {
      try {
        setIst(await comando<IstantaneaMondo | null>("audio_mondo_stato"));
      } catch {
        /* il motore si sta fermando */
      }
    }, 200);
    return () => clearInterval(id);
  }, [avvio]);

  const vaiIn = useCallback(
    async (a: AmbienteMondo) => {
      setAmbiente(a);
      await manda({ tipo: "ambiente", valore: a });
    },
    [manda],
  );

  const cambiaAria = useCallback(
    async (v: number) => {
      setAria(v);
      await manda({ tipo: "aria", valore: v });
    },
    [manda],
  );

  // ---- la prova da sola: ogni ambiente, i suoi stati, le misure del flusso ----------
  const misuraMondo = useCallback(async () => {
    setOccupato(true);
    try {
      const caricato = await avvia();
      const passi: { nome: string; secondi: number; comandi: ComandoMondo[] }[] = [
        { nome: "plancia calma", secondi: 15, comandi: [{ tipo: "ambiente", valore: "plancia" }] },
        { nome: "plancia agganciata", secondi: 15, comandi: [{ tipo: "nave", valore: "agganciata" }] },
        { nome: "scafo, camminando", secondi: 12, comandi: [{ tipo: "ambiente", valore: "scafo" }, { tipo: "aria", valore: 100 }, { tipo: "cammina", valore: true }] },
        { nome: "scafo, fame d’aria", secondi: 12, comandi: [{ tipo: "cammina", valore: false }, { tipo: "aria", valore: 25 }] },
        { nome: "vestibolo, brusio", secondi: 15, comandi: [{ tipo: "ambiente", valore: "vestibolo" }, { tipo: "aria", valore: 80 }, { tipo: "evento", valore: "primo_contatto" }] },
        { nome: "vestibolo, protezione vitale", secondi: 10, comandi: [{ tipo: "aria", valore: 28 }] },
        { nome: "vestibolo, ipossia", secondi: 10, comandi: [{ tipo: "aria", valore: 10 }] },
      ];
      const risultati = [];
      for (const p of passi) {
        for (const c of p.comandi) await manda(c);
        await attesa(1500);
        await comando("audio_azzera");
        await attesa(p.secondi * 1000);
        const m = await comando<MisureAudio>("audio_misure");
        const i = await comando<IstantaneaMondo | null>("audio_mondo_stato");
        risultati.push({ passo: p.nome, misure: m, istantanea: i });
        scrivi(`${p.nome}: CPU media ${arrotonda(m.cpu_media * 100)}%, max ${arrotonda(m.cpu_max * 100)}%; buco massimo ${arrotonda(m.gap_max_ms)} ms; errori ${m.errori_flusso}`);
        setMisure(m);
      }
      await manda({ tipo: "ambiente", valore: "silenzio" });
      const dati = { data: new Date().toISOString(), versione: VERSIONE, sistema, caricamento: caricato, passi: risultati };
      const nome = `prova-suono-${sistema?.sistema ?? "browser"}-${Date.now()}.json`;
      const dove = await comando<string>("scrivi_rapporto", { nome, contenuto: JSON.stringify(dati, null, 2) });
      scrivi(`Rapporto del suono: ${dove}`);
      if (sistema?.prova === "mondo") await comando("esci", { codice: 0 });
    } catch (e) {
      scrivi(`Prova del suono interrotta: ${String(e)}`);
    } finally {
      setOccupato(false);
    }
  }, [avvia, manda, scrivi, sistema]);

  const partita = useRef(false);
  useEffect(() => {
    if (!partita.current && sistema?.prova === "mondo") {
      partita.current = true;
      misuraMondo();
    }
  }, [sistema, misuraMondo]);

  const fuori = !dentroTauri();
  const eventiQui = EVENTI.filter((e) => e.dove.includes(ambiente));
  const colpiQui = COLPI.filter((c) => c.dove.includes(ambiente));

  return (
    <div className="suono">
      <h2>Suono · il prototipo</h2>
      <div className="riga">
        <button disabled={fuori || occupato} onClick={avvia}>
          {avvio ? "Ricarica il mondo sonoro" : "Avvia il mondo sonoro"}
        </button>
        <button className="forte" disabled={fuori || occupato} onClick={misuraMondo}>
          Misura e rapporto
        </button>
      </div>
      {avvio && (
        <>
          <div className="riga" role="group" aria-label="Ambiente">
            {AMBIENTI.map((a) => (
              <button key={a.id} aria-pressed={ambiente === a.id} className={ambiente === a.id ? "scelto" : ""} onClick={() => vaiIn(a.id)}>
                {a.etichetta}
              </button>
            ))}
          </div>
          <label className="cursore">
            <span>aria {aria}</span>
            <input type="range" min={0} max={100} step={1} value={aria} onChange={(e) => cambiaAria(Number(e.target.value))} />
          </label>
          {ambiente === "plancia" && (
            <div className="riga" role="group" aria-label="La Santa Maria">
              {(["libera", "accostata", "agganciata"] as NaveMondo[]).map((n) => (
                <button
                  key={n}
                  aria-pressed={nave === n}
                  className={nave === n ? "scelto" : ""}
                  onClick={async () => {
                    setNave(n);
                    await manda({ tipo: "nave", valore: n });
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          {ambiente === "scafo" && (
            <>
              <label className="cursore">
                <span>rampa {rampa.toFixed(1)}</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={rampa}
                  onChange={async (e) => {
                    const v = Number(e.target.value);
                    setRampa(v);
                    await manda({ tipo: "rampa", valore: v });
                  }}
                />
              </label>
              <div className="riga">
                <button
                  aria-pressed={cammina}
                  className={cammina ? "scelto" : ""}
                  onClick={async () => {
                    setCammina(!cammina);
                    await manda({ tipo: "cammina", valore: !cammina });
                  }}
                >
                  Cammina
                </button>
                <button
                  aria-pressed={sforzo}
                  className={sforzo ? "scelto" : ""}
                  onClick={async () => {
                    setSforzo(!sforzo);
                    await manda({ tipo: "sforzo", valore: !sforzo });
                  }}
                >
                  Sforzo
                </button>
              </div>
            </>
          )}
          {eventiQui.length > 0 && (
            <div className="riga" role="group" aria-label="Eventi">
              {eventiQui.map((e) => (
                <button key={e.id} onClick={() => manda({ tipo: "evento", valore: e.id })}>
                  {e.etichetta}
                </button>
              ))}
            </div>
          )}
          {colpiQui.length > 0 && (
            <div className="riga" role="group" aria-label="I colpi, uno per uno">
              {colpiQui.map((c) => (
                <button key={c.id} onClick={() => manda({ tipo: "prova", valore: c.id })}>
                  {c.etichetta}
                </button>
              ))}
            </div>
          )}
          {ist && (
            <dl className="misure" aria-live="off">
              <dt>respiro</dt>
              <dd>
                {ist.respiri_al_minuto > 0 ? `${arrotonda(ist.respiri_al_minuto)} al minuto` : "—"}
                {ist.fase >= 0 ? " · inspira/espira" : ""}
              </dd>
              <dt>protezione</dt>
              <dd className={ist.protezione ? "rosso" : ""}>{ist.protezione ? "vitale: canali secondari spenti" : "no"}</dd>
              <dt>livello</dt>
              <dd>{arrotonda(ist.livello_db)} dBFS</dd>
              <dt>voci in corso</dt>
              <dd>{ist.voci}</dd>
            </dl>
          )}
          {misure && (
            <p className="esito">
              CPU media {arrotonda(misure.cpu_media * 100)}%, max {arrotonda(misure.cpu_max * 100)}%; buco massimo {arrotonda(misure.gap_max_ms)} ms; errori {misure.errori_flusso}.
            </p>
          )}
        </>
      )}
    </div>
  );
}
