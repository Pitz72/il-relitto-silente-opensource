// ============================================================================
//  Il diario (06-app-desktop.md, §4.6; si apre con D, si chiude con D o Esc).
//  La trascrizione della partita; il fascicolo di chi è passato prima; le voci
//  ascoltate, da rileggere; le traduzioni, ognuna nella lettura fatta con la
//  matrice più avanti. Le pagine vengono dalla cronaca del ponte (pagine.ts);
//  il testo è quello del gioco, vestito dalla grammatica tipografica, e i
//  suggerimenti del passato restano accesi ma non sono più pulsanti.
// ============================================================================
import { useLayoutEffect, useMemo, useRef, type KeyboardEvent } from "react";
import type { Forma } from "../../stile/atmosfere";
import { romano } from "../../lib/italiano";
import type { Evento, VoceCronaca } from "../../motore/tipi";
import { blocchiDelTurno, type Blocco } from "../lamina/grammatica";
import { TestoInerte, Turno } from "../lamina/Lamina";
import { Pannello } from "../pannelli/Pannelli";
import { allaMatrice, nomeDiLuogo, pagine, pagineAperte, titoloPagina, type IdPagina } from "./pagine";
import "./diario.css";

/** I blocchi di una voce si calcolano una volta sola: la cronaca non cambia. */
const memoria = new WeakMap<object, Blocco[]>();
function blocchiDi(chi: object, eventi: readonly Evento[], verbi: ReadonlySet<string>): Blocco[] {
  let b = memoria.get(chi);
  if (!b) {
    b = blocchiDelTurno(eventi, { verbi });
    memoria.set(chi, b);
  }
  return b;
}

interface Props {
  forma: Forma;
  /** il prologo e la prima stanza */
  apertura: readonly Evento[];
  cronaca: readonly VoceCronaca[];
  /** tutte le parole dei verbi: i suggerimenti si riconoscono anche nel passato */
  verbi: ReadonlySet<string>;
  pagina: IdPagina;
  sceglie: (p: IdPagina) => void;
  chiudi: () => void;
}

export default function Diario({ forma, apertura, cronaca, verbi, pagina, sceglie, chiudi }: Props) {
  const p = useMemo(() => pagine(cronaca), [cronaca]);
  const aperte = pagineAperte(p);
  const attuale = aperte.includes(pagina) ? pagina : "trascrizione";
  const foglioRef = useRef<HTMLDivElement>(null);
  const schedeRef = useRef<HTMLDivElement>(null);

  // la trascrizione si apre sull'ultimo turno; le altre pagine dall'inizio
  useLayoutEffect(() => {
    const f = foglioRef.current;
    if (f) f.scrollTop = attuale === "trascrizione" ? f.scrollHeight : 0;
  }, [attuale]);

  // le schede (ARIA tabs): le frecce passano da una all'altra
  const frecce = (e: KeyboardEvent) => {
    const i = aperte.indexOf(attuale);
    const j =
      e.key === "ArrowRight" ? (i + 1) % aperte.length
      : e.key === "ArrowLeft" ? (i - 1 + aperte.length) % aperte.length
      : e.key === "Home" ? 0
      : e.key === "End" ? aperte.length - 1
      : -1;
    if (j < 0) return;
    e.preventDefault();
    sceglie(aperte[j]);
    requestAnimationFrame(() => schedeRef.current?.querySelector<HTMLElement>(`[data-pagina="${aperte[j]}"]`)?.focus());
  };

  return (
    <Pannello forma={forma} classe="diario" etichetta="Diario">
      <header className="diario-testa">
        <h2>{forma === "acciaio" ? "Diario di bordo" : "Diario"}</h2>
        <div className="diario-schede" role="tablist" aria-label="Pagine del diario" ref={schedeRef} onKeyDown={frecce}>
          {aperte.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`scheda-${id}`}
              data-pagina={id}
              aria-selected={id === attuale}
              aria-controls="diario-foglio"
              tabIndex={id === attuale ? 0 : -1}
              data-primo={id === attuale ? "" : undefined}
              onClick={() => sceglie(id)}
            >
              {titoloPagina(id, p)}
            </button>
          ))}
        </div>
      </header>
      <div className="diario-foglio" id="diario-foglio" role="tabpanel" aria-labelledby={`scheda-${attuale}`} tabIndex={0} ref={foglioRef}>
        <TestoInerte>
          <div className="diario-colonna">
            {attuale === "trascrizione" && <Trascrizione apertura={apertura} cronaca={cronaca} verbi={verbi} forma={forma} />}
            {attuale === "fascicolo" && (
              <>
                <h3 className="diario-titolo">{p.fascicolo.iniziali ? "Fascicolo L.V." : "Qualcuno, prima di te"}</h3>
                {p.fascicolo.tracce.map((t) => (
                  <Scheda key={t.id} titolo={t.titolo} voce={t.voce} verbi={verbi} forma={forma} />
                ))}
              </>
            )}
            {attuale === "voci" &&
              p.voci.map((v) => <Scheda key={v.chiave} voce={v} verbi={verbi} forma={forma} />)}
            {attuale === "traduzioni" && (
              <>
                {p.traduzioni.reperti.length > 0 && <h3 className="diario-titolo">I reperti</h3>}
                {p.traduzioni.reperti.map((r) => (
                  <Scheda key={`${r.cosa}-${r.voce.chiave}`} titolo={nomeDiLuogo(r.nome)} voce={r.voce} verbi={verbi} forma={forma} />
                ))}
                {p.traduzioni.iscrizioni.length > 0 && <h3 className="diario-titolo">Le iscrizioni</h3>}
                {p.traduzioni.iscrizioni.map((l) => (
                  <Scheda key={l.cosa} titolo={nomeDiLuogo(l.nome)} nota={`matrice ${allaMatrice(l.matrice)}`} voce={l.voce} verbi={verbi} forma={forma} />
                ))}
              </>
            )}
          </div>
        </TestoInerte>
      </div>
      <footer className="diario-piede">
        <button type="button" className="chiudi" onClick={chiudi}>
          torna al gioco <span className="tasto">D · Esc</span>
        </button>
      </footer>
    </Pannello>
  );
}

// ----------------------------------------------------------------------------
//  La trascrizione: il prologo, la prima stanza, poi ogni turno; un cartello
//  dove l'atto cambia
// ----------------------------------------------------------------------------
function Trascrizione({ apertura, cronaca, verbi, forma }: { apertura: readonly Evento[]; cronaca: readonly VoceCronaca[]; verbi: ReadonlySet<string>; forma: Forma }) {
  return (
    <>
      <section className="diario-turno">
        <Turno voce={{ chiave: 0, comando: null, differenza: null, blocchi: blocchiDi(apertura, apertura, verbi) }} forma={forma} />
      </section>
      {cronaca.map((v, i) => (
        <section key={v.chiave} className="diario-turno">
          {v.atto !== (cronaca[i - 1]?.atto ?? 1) && (
            <div className="diario-atto">
              Atto {romano(v.atto)} · {v.titolo_atto.toLowerCase()}
            </div>
          )}
          <Turno voce={{ chiave: v.chiave, comando: v.comando, differenza: v.differenza, blocchi: blocchiDi(v, v.eventi, verbi) }} forma={forma} />
        </section>
      ))}
    </>
  );
}

// ----------------------------------------------------------------------------
//  Una scheda del fascicolo, delle voci, delle traduzioni: il luogo e il turno,
//  poi il testo di quel turno senza il nome della stanza (lo dice la riga sopra)
// ----------------------------------------------------------------------------
function Scheda({ titolo, nota, voce, verbi, forma }: { titolo?: string; nota?: string; voce: VoceCronaca; verbi: ReadonlySet<string>; forma: Forma }) {
  const blocchi = blocchiDi(voce, voce.eventi, verbi).filter((b) => b.tipo !== "stanza");
  return (
    <article className="diario-scheda">
      <header>
        {titolo && <h4>{titolo}</h4>}
        <span className="diario-dove">
          {nomeDiLuogo(voce.nome_stanza)} · turno {voce.turno}
          {nota ? ` · ${nota}` : ""}
        </span>
      </header>
      <Turno voce={{ chiave: voce.chiave, comando: voce.comando, differenza: null, blocchi }} forma={forma} />
    </article>
  );
}
