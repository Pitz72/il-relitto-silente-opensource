// ============================================================================
//  I pannelli sopra il gioco (06-app-desktop.md, §4.5 e §4.6): la conferma, la
//  pausa (Esc), i salvataggi (F5 salva, F9 carica: sei posti più l'automatico),
//  le opzioni, i tasti, l'avviso breve. Hanno la forma del momento: acciaio o membrana.
// ============================================================================
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Forma } from "../../stile/atmosfere";
import type { Opzioni } from "../../stile/opzioni";
import { POSTI, quando, type IdPosto, type Posto } from "../salvataggi";
import "./pannelli.css";

/** Il fuoco entra nel pannello all'apertura, e ci resta (Tab gira dentro). */
function useTrappola(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prima = document.activeElement as HTMLElement | null;
    el.querySelector<HTMLElement>("[data-primo], button:not(:disabled):not([tabindex='-1'])")?.focus({ preventScroll: true });
    const tab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      // le schede non scelte (tabindex −1) si raggiungono con le frecce, non con Tab
      const tutti = [...el.querySelectorAll<HTMLElement>("button:not(:disabled):not([tabindex='-1']), [tabindex='0']")];
      if (!tutti.length) return;
      const i = tutti.indexOf(document.activeElement as HTMLElement);
      const prossimo = e.shiftKey ? (i <= 0 ? tutti.length - 1 : i - 1) : i === tutti.length - 1 ? 0 : i + 1;
      e.preventDefault();
      tutti[prossimo].focus();
    };
    el.addEventListener("keydown", tab);
    return () => {
      el.removeEventListener("keydown", tab);
      prima?.focus?.({ preventScroll: true });
    };
  }, [ref]);
}

export function Pannello({ forma, titolo, children, classe = "", etichetta }: { forma: Forma; titolo?: string; children: ReactNode; classe?: string; etichetta?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useTrappola(ref);
  return (
    <div className="velo-pannello">
      <div ref={ref} className={`pannello ${classe}`} data-forma={forma} role="dialog" aria-modal="true" aria-label={etichetta ?? titolo}>
        {titolo && <h2>{titolo}</h2>}
        {children}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
//  La conferma: una domanda al centro, Sì e No (S e N; Esc vale No)
// ----------------------------------------------------------------------------
export interface Domanda {
  testo: string;
  sotto?: string;
  si: string;
  no: string;
  allora: () => void;
  /** se No deve fare qualcosa oltre a chiudere */
  altrimenti?: () => void;
  /** i comandi del motore che Sì e No mandano, quando la domanda è sua */
  comandoSi?: string;
  comandoNo?: string;
}

export function Conferma({ domanda, forma, chiudi }: { domanda: Domanda; forma: Forma; chiudi: () => void }) {
  useEffect(() => {
    const tasto = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        chiudi();
        domanda.allora();
      } else if (k === "n" || k === "escape") {
        e.preventDefault();
        e.stopPropagation();
        chiudi();
        domanda.altrimenti?.();
      }
    };
    addEventListener("keydown", tasto, true);
    return () => removeEventListener("keydown", tasto, true);
  }, [domanda, chiudi]);
  return (
    <Pannello forma={forma} classe="conferma" etichetta={domanda.testo}>
      <p className="domanda">{domanda.testo}</p>
      {domanda.sotto && <p className="sotto">{domanda.sotto}</p>}
      <div className="scelte-conferma">
        <button
          type="button"
          data-primo=""
          data-risposta="si"
          data-comando={domanda.comandoSi}
          onClick={() => {
            chiudi();
            domanda.allora();
          }}
        >
          {domanda.si} <span className="tasto">S</span>
        </button>
        <button
          type="button"
          data-risposta="no"
          data-comando={domanda.comandoNo}
          onClick={() => {
            chiudi();
            domanda.altrimenti?.();
          }}
        >
          {domanda.no} <span className="tasto">N</span>
        </button>
      </div>
    </Pannello>
  );
}

// ----------------------------------------------------------------------------
//  La pausa
// ----------------------------------------------------------------------------
export interface VociPausa {
  riprendi: () => void;
  diario: () => void;
  salva: () => void;
  carica: () => void;
  annulla: (() => void) | null;
  opzioni: () => void;
  tasti: () => void;
  ricomincia: () => void;
  misure: () => void;
  /** il menu principale: la partita resta, e Continua la riprende */
  menu: (() => void) | null;
}

export function Pausa({ forma, voci }: { forma: Forma; voci: VociPausa }) {
  return (
    <Pannello forma={forma} titolo="In pausa" classe="pausa">
      <nav className="voci-pausa">
        <button type="button" data-primo="" data-tocco="annulla" onClick={voci.riprendi}>
          Riprendi <span className="tasto">Esc</span>
        </button>
        <button type="button" onClick={voci.diario}>
          Diario <span className="tasto">D</span>
        </button>
        <button type="button" onClick={voci.salva}>
          Salva <span className="tasto">F5</span>
        </button>
        <button type="button" onClick={voci.carica}>
          Carica <span className="tasto">F9</span>
        </button>
        {voci.annulla && (
          <button type="button" onClick={voci.annulla}>
            Annulla l’ultima mossa
          </button>
        )}
        <button type="button" onClick={voci.opzioni}>
          Opzioni
        </button>
        <button type="button" onClick={voci.tasti}>
          Tasti
        </button>
        <button type="button" onClick={voci.ricomincia}>
          Ricomincia da capo
        </button>
        {voci.menu && (
          <button type="button" onClick={voci.menu}>
            Menu principale
          </button>
        )}
      </nav>
      <button type="button" className="misure" onClick={voci.misure}>
        la pagina delle misure tecniche
      </button>
    </Pannello>
  );
}

// ----------------------------------------------------------------------------
//  I salvataggi
// ----------------------------------------------------------------------------
const ROMANI = ["I", "II", "III", "IV", "V"];

export function Salvataggi({
  modo,
  forma,
  posti,
  dove,
  scegli,
  chiudi,
}: {
  modo: "salva" | "carica";
  forma: Forma;
  posti: Posto[] | null;
  dove: string;
  scegli: (p: Posto) => void;
  chiudi: () => void;
}) {
  const elenco = (posti ?? []).filter((p) => modo === "carica" || p.posto !== "automatico");
  const ordine = (p: Posto) => (p.posto === "automatico" ? -1 : POSTI.indexOf(p.posto as IdPosto));
  return (
    <Pannello forma={forma} titolo={modo === "salva" ? "Salva la partita" : "Carica una partita"} classe="salvataggi">
      {!posti ? (
        <p className="sotto">Lettura dei posti…</p>
      ) : (
        <div className="posti">
          {[...elenco]
            .sort((a, b) => ordine(a) - ordine(b))
            .map((p, i) => {
              const vuoto = !p.presente;
              const disabilitato = modo === "carica" && (vuoto || !p.leggibile);
              const r = p.riassunto;
              return (
                <button key={p.posto} type="button" className={`posto${vuoto ? " vuoto" : ""}${p.posto === "automatico" ? " automatico" : ""}`} disabled={disabilitato} data-primo={i === 0 ? "" : undefined} data-tocco="conferma" onClick={() => scegli(p)}>
                  <span className="nome-posto">{p.posto === "automatico" ? "automatico" : `posto ${p.posto}`}</span>
                  {vuoto ? (
                    <span className="stanza-posto">vuoto</span>
                  ) : !p.leggibile ? (
                    <span className="stanza-posto">illeggibile</span>
                  ) : (
                    <>
                      <span className="stanza-posto">{(r?.nome_stanza ?? r?.stanza ?? "").replace(/'/g, "’").replace(/^./, (x) => x.toUpperCase())}</span>
                      <span className="dettagli-posto">
                        {r ? `Atto ${ROMANI[r.atto - 1] ?? r.atto} · turno ${r.turno}${r.aria !== null ? ` · aria ${r.aria}` : ""}` : ""}
                      </span>
                      <span className="data-posto">{quando(p.creato)}</span>
                    </>
                  )}
                </button>
              );
            })}
        </div>
      )}
      <p className="dove">I salvataggi stanno in {dove}.</p>
      <button type="button" className="chiudi" onClick={chiudi}>
        chiudi <span className="tasto">Esc</span>
      </button>
    </Pannello>
  );
}

// ----------------------------------------------------------------------------
//  Le opzioni
// ----------------------------------------------------------------------------
export function PannelloOpzioni({ forma, opzioni, cambia, chiudi }: { forma: Forma; opzioni: Opzioni; cambia: (c: Partial<Opzioni>) => void; chiudi: () => void }) {
  const riga = <K extends keyof Opzioni>(nome: string, chiave: K, valori: [Opzioni[K], string][], spiega?: string) => (
    <div className="opzione" role="group" aria-label={nome}>
      <span className="nome-opzione">{nome}</span>
      <span className="valori">
        {valori.map(([v, etichetta]) => (
          <button key={String(v)} type="button" aria-pressed={opzioni[chiave] === v} onClick={() => cambia({ [chiave]: v } as Partial<Opzioni>)}>
            {etichetta}
          </button>
        ))}
      </span>
      {spiega && <span className="spiega">{spiega}</span>}
    </div>
  );
  return (
    <Pannello forma={forma} titolo="Opzioni" classe="opzioni">
      {riga("Movimento", "movimento", [["sistema", "come il sistema"], ["ridotto", "ridotto"], ["pieno", "pieno"]], "Ridotto: il tremito, il respiro dei bordi e le venature si fermano; restano i colori.")}
      {riga("Rivelazione del testo", "rivelazione", [[true, "a righe"], [false, "tutto subito"]])}
      {riga("Carattere", "carattere", [["newsreader", "Newsreader"], ["atkinson", "Atkinson Hyperlegible"]])}
      {riga("Testo", "testoGrande", [[false, "normale"], [true, "grande"]])}
      {riga("Schermo intero", "schermoIntero", [[true, "sì"], [false, "no, in una finestra"]], "Si cambia anche con F11.")}
      {riga("Nomi toccabili nel testo", "nomiToccabili", [[true, "sì"], [false, "no"]], "Toccare un nome nella descrizione apre il menu di quella cosa.")}
      {riga("Volume", "volume", [[0, "muto"], [0.25, "25%"], [0.5, "50%"], [0.75, "75%"], [1, "100%"]])}
      {riga("Ambienti", "volumeAmbienti", [[0, "spenti"], [0.5, "50%"], [0.75, "75%"], [1, "100%"]], "Le stanze, le macchine, l’aria, il re.")}
      {riga("Effetti", "volumeEffetti", [[0, "spenti"], [0.5, "50%"], [0.75, "75%"], [1, "100%"]], "Il fiato, i passi, gli attrezzi, il visore, le cose che accadono.")}
      {riga("Voci", "volumeVoci", [[0, "spente"], [0.5, "50%"], [0.75, "75%"], [1, "100%"]], "Il brusio, le echi, la radio.")}
      {riga("Musica", "volumeMusica", [[0, "spenta"], [0.5, "50%"], [0.75, "75%"], [1, "100%"]], "Il menu, la soglia degli atti, l’Anziano, la fine.")}
      {riga("Suono", "mono", [[false, "stereo"], [true, "mono"]], "Mono: i due canali insieme, per chi sente da un orecchio solo.")}
      {riga("Dinamica", "dinamicaRidotta", [[false, "piena"], [true, "ridotta"]], "Ridotta: i suoni piccoli più alti e i grandi più bassi, per giocare piano o di notte.")}
      {riga("Suoni intensi", "suoniIntensiRidotti", [[false, "come sono"], [true, "ridotti"]], "Ridotti: meno bassi profondi, niente picchi, niente battito né fischio nell’anticamera.")}
      <button type="button" className="chiudi" onClick={chiudi}>
        chiudi <span className="tasto">Esc</span>
      </button>
    </Pannello>
  );
}

// ----------------------------------------------------------------------------
//  I tasti: come si gioca senza mouse (06, §6.2). Tutto quello che fa la
//  tastiera, scritto in un posto solo: lo schermo mostra i tasti delle uscite
//  e dei pannelli, ma non Tab, Invio e le frecce nel fiore (14, §15).
// ----------------------------------------------------------------------------
const NOMI_DEI_TASTI: Readonly<Record<string, string>> = { "↑": "freccia su", "↓": "freccia giù", "←": "freccia sinistra", "→": "freccia destra" };

const TASTI: readonly { gruppo: string; righe: readonly { tasti: readonly string[]; fa: string }[] }[] = [
  {
    gruppo: "Muoversi",
    righe: [
      { tasti: ["↑", "↓", "←", "→"], fa: "nord, sud, ovest, est" },
      { tasti: ["PgSu", "PgGiù"], fa: "su, giù" },
      { tasti: ["Inizio", "Fine"], fa: "dentro, fuori" },
      { tasti: ["7", "9", "1", "3"], fa: "dal tastierino, le diagonali: nordovest, nordest, sudovest, sudest" },
    ],
  },
  {
    gruppo: "Le cose",
    righe: [
      { tasti: ["Tab"], fa: "da una cosa all’altra (con Maiusc, all’indietro)" },
      { tasti: ["Invio"], fa: "apre il fiore della cosa; nel fiore, sceglie" },
      { tasti: ["←", "→"], fa: "nel fiore, da un petalo all’altro" },
      { tasti: ["Esc"], fa: "chiude il fiore, annulla «Usa con…», posa l’attrezzo" },
    ],
  },
  {
    gruppo: "Il testo e le voci",
    righe: [
      { tasti: ["Spazio"], fa: "completa il testo che sta comparendo" },
      { tasti: ["1–9"], fa: "le risposte, nel dialogo" },
      { tasti: ["S", "N"], fa: "sì e no, quando il gioco lo chiede" },
    ],
  },
  {
    gruppo: "La partita",
    righe: [
      { tasti: ["D"], fa: "il diario; le pagine con ← →" },
      { tasti: ["Esc"], fa: "la pausa" },
      { tasti: ["F5", "F9"], fa: "salva, carica" },
      { tasti: ["F11"], fa: "schermo intero, o in una finestra" },
    ],
  },
];

export function PannelloTasti({ forma, chiudi }: { forma: Forma; chiudi: () => void }) {
  return (
    <Pannello forma={forma} titolo="Tasti" classe="tasti">
      <p className="sotto">Tutto si fa anche senza mouse, e si può passare dall’uno all’altra quando si vuole.</p>
      <div className="gruppi-tasti">
        {TASTI.map((g) => (
          <section key={g.gruppo} className="gruppo-tasti" aria-label={g.gruppo}>
            <h3>{g.gruppo}</h3>
            <dl>
              {g.righe.map((r) => (
                <div key={r.tasti.join(" ") + r.fa} className="riga-tasti">
                  <dt>
                    {r.tasti.map((t) => (
                      <kbd key={t}>
                        {NOMI_DEI_TASTI[t] ? (
                          <>
                            <span aria-hidden="true">{t}</span>
                            <span className="solo-lettori">{NOMI_DEI_TASTI[t]}</span>
                          </>
                        ) : (
                          t
                        )}
                      </kbd>
                    ))}
                  </dt>
                  <dd>{r.fa}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
      <button type="button" className="chiudi" onClick={chiudi}>
        chiudi <span className="tasto">Esc</span>
      </button>
    </Pannello>
  );
}

// ----------------------------------------------------------------------------
//  L'avviso: due o tre secondi, in alto
// ----------------------------------------------------------------------------
export function Avviso({ testo, grave = false }: { testo: string; grave?: boolean }) {
  return (
    <div className={`avviso${grave ? " grave" : ""}`} role={grave ? "alert" : "status"}>
      {testo}
    </div>
  );
}

export function useAvviso(): [{ testo: string; grave: boolean } | null, (testo: string, grave?: boolean) => void] {
  const [avviso, setAvviso] = useState<{ testo: string; grave: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mostra = (testo: string, grave = false) => {
    if (timer.current) clearTimeout(timer.current);
    setAvviso({ testo, grave });
    timer.current = setTimeout(() => setAvviso(null), grave ? 6000 : 3200);
  };
  return [avviso, mostra];
}
