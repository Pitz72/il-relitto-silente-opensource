// ============================================================================
//  Il ramo delle azioni e il fiore (06-app-desktop.md, §4.7 e §6; la tavola
//  della membrana). Il ramo attraversa il fondo dello schermo su due fili: le
//  cose sono baccelli, le uscite bocche. Toccare una cosa apre il suo fiore,
//  nella fascia libera sotto il testo. «Usa con…» si fa in due tocchi: le cose
//  possibili si accendono tutte. Un attrezzo in mano accende le cose su cui si
//  usa. I suggerimenti del testo accendono il loro pulsante per qualche secondo.
// ============================================================================
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Forma } from "../../stile/atmosfere";
import type { Cosa } from "../../motore/tipi";
import type { ModelloAzione } from "../../azione/modello";
import { disponiFilo, disponiFiore, gambo, percorsoDelFilo, quantiStanno, type Disposizione, type Filo, type PostoPetalo } from "./geometria";
import { baccelliDi, bersagli, CANALI_SECONDARI, GLIFO_TASTO, MOTIVO_CANALI, petaliDi, type Azione, type Baccello, type Fili, type Selezione, type VocePetalo } from "./azioni";
import "./ramo.css";

interface Props {
  modello: ModelloAzione;
  cose: readonly Cosa[];
  forma: Forma;
  selezione: Selezione;
  /** le chiavi accese dai suggerimenti */
  accesi: ReadonlySet<string>;
  /** verbo → l'aria che è costato l'ultima volta (D16) */
  costi: ReadonlyMap<string, number>;
  /** la larghezza e l'altezza del palco, in pixel */
  palco: { W: number; H: number };
  azione: (a: Azione) => void;
  /** «altri» apre il gruppo nascosto di un filo */
  apriAltri: (filo: Filo, gruppo: string) => void;
  altri: { filo: Filo; gruppo: string } | null;
  /** la protezione vitale: l'ascolto e la traduzione sono spenti */
  canaliChiusi?: boolean;
}

interface Pezzo extends Baccello {
  filo: Filo;
  gruppo: string;
}

const STRINGI = "+";

export default function Ramo({ modello, cose, forma, selezione, accesi, costi, palco, azione, apriAltri, altri, canaliChiusi = false }: Props) {
  const fili = useMemo(() => baccelliDi(modello, cose), [modello, cose]);
  const pezzi: Pezzo[] = useMemo(
    () => (["alto", "basso"] as Filo[]).flatMap((filo) => fili[filo].flatMap((g) => g.baccelli.map((b) => ({ ...b, filo, gruppo: g.nome })))),
    [fili],
  );
  const misure = useRef(new Map<string, HTMLElement>());
  // i gruppi come stanno davvero sui fili (le cose in più del filo alto scendono), e dove
  const [stato, setStato] = useState<{ fili: Fili; d: Record<Filo, Disposizione> } | null>(null);
  const { W } = palco;

  // misura i baccelli alla scala piena, poi li dispone sui due fili
  useLayoutEffect(() => {
    if (!W) return;
    // la larghezza alla scala piena: un baccello già stretto si misura e si divide
    const largo = (chiave: string) => {
      const el = misure.current.get(chiave);
      return el ? el.offsetWidth / Number(el.dataset.scala ?? 1) : 80;
    };
    const piu = misure.current.get("misura:+")?.offsetWidth ?? 50;
    const gruppi = (gs: Fili["alto"]) => gs.map((g) => ({ nome: g.nome, larghezze: g.baccelli.map((b) => largo(b.chiave)), riducibile: g.riducibile }));
    let alto = fili.alto;
    let basso = fili.basso;
    const iQui = alto.findIndex((g) => g.nome === "qui");
    if (iQui >= 0) {
      const k = quantiStanno(gruppi(alto), iQui, W);
      if (k < alto[iQui].baccelli.length) {
        const coda = alto[iQui].baccelli.slice(k);
        alto = alto.map((g, i) => (i === iQui ? { ...g, baccelli: g.baccelli.slice(0, k) } : g));
        basso = [{ nome: "qui-segue", etichetta: "e qui", baccelli: coda, riducibile: true }, ...basso];
      }
    }
    setStato({
      fili: { alto, basso },
      d: { alto: disponiFilo(gruppi(alto), W, "alto", forma, piu), basso: disponiFilo(gruppi(basso), W, "basso", forma, piu) },
    });
  }, [fili, W, forma]);
  const disposizione = stato?.d ?? null;
  const disposti = stato?.fili ?? fili;

  const possibili = useMemo(() => bersagli(selezione, modello), [selezione, modello]);
  const scegliendo = selezione.tipo === "usaCon" || selezione.tipo === "inMano";

  // dove sta ogni baccello (e i «+N»)
  const posti = new Map<string, { x: number; y: number; scala: number }>();
  const piu: { filo: Filo; gruppo: string; nascosti: Pezzo[]; x: number; y: number; scala: number }[] = [];
  if (disposizione)
    for (const filo of ["alto", "basso"] as Filo[]) {
      const d = disposizione[filo];
      disposti[filo].forEach((g, i) => {
        const n = d.mostrati[i];
        g.baccelli.slice(0, n).forEach((b, k) => posti.set(b.chiave, { ...d.posti[i][k], scala: d.scala }));
        if (g.baccelli.length > n)
          piu.push({
            filo,
            gruppo: g.nome,
            nascosti: g.baccelli.slice(n).map((b) => ({ ...b, filo, gruppo: g.nome })),
            ...d.posti[i][n],
            scala: d.scala,
          });
      });
    }

  // ---- il fiore ------------------------------------------------------------
  const aperta = selezione.tipo === "fiore" ? selezione.cosa : null;
  const menu = aperta ? [...modello.qui, ...modello.conTe].find((m) => m.id === aperta) : undefined;
  const petali: VocePetalo[] = useMemo(() => {
    if (menu) return petaliDi(menu, modello, costi);
    if (altri) {
      const g = disposti[altri.filo].find((x) => x.nome === altri.gruppo);
      const n = disposizione?.[altri.filo].mostrati[disposti[altri.filo].indexOf(g!)] ?? 0;
      return (g?.baccelli.slice(n) ?? []).map((b) => ({ chiave: b.chiave, etichetta: b.etichetta, nota: null, anello: 1, azione: b.azione, comando: null }));
    }
    if (scegliendo) {
      // i bersagli che non sono baccelli in vista: un petalo ciascuno
      const out: VocePetalo[] = [];
      for (const [id, comando] of possibili)
        if (!posti.has(`cosa:${id}`)) out.push({ chiave: `bersaglio:${id}`, etichetta: nomeDelBersaglio(id, cose, selezione), nota: null, anello: 1, azione: { tipo: "comando", comando }, comando });
      return out;
    }
    return [];
  }, [menu, altri, scegliendo, possibili, modello, costi, disposti, disposizione]); // eslint-disable-line react-hooks/exhaustive-deps

  const ancora = (() => {
    if (aperta) {
      const p = posti.get(`cosa:${aperta}`) ?? piu.find((x) => x.nascosti.some((b) => b.cosa === aperta));
      return p ? { x: p.x, y: p.y } : null;
    }
    if (altri) {
      const p = piu.find((x) => x.filo === altri.filo && x.gruppo === altri.gruppo);
      return p ? { x: p.x, y: p.y } : null;
    }
    if (scegliendo && petali.length) return { x: palco.W / 2, y: (disposizione?.alto.posti[0]?.[0]?.y ?? palco.H * 0.85) };
    return null;
  })();

  const misurePetali = useRef(new Map<string, HTMLElement>());
  const [postiPetali, setPostiPetali] = useState<PostoPetalo[] | null>(null);
  useLayoutEffect(() => {
    if (!ancora || !petali.length) {
      setPostiPetali(null);
      return;
    }
    const p = petali.map((x) => {
      const el = misurePetali.current.get(x.chiave);
      return { larghezza: el?.offsetWidth ?? 90, altezza: el?.offsetHeight ?? 32, anello: x.anello };
    });
    setPostiPetali(disponiFiore(ancora, p, W, forma));
  }, [petali, ancora?.x, ancora?.y, W, forma]); // eslint-disable-line react-hooks/exhaustive-deps

  // il primo petalo prende il fuoco quando il fiore si apre
  const fioreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (postiPetali && (aperta || altri)) fioreRef.current?.querySelector<HTMLButtonElement>("button.petalo")?.focus({ preventScroll: true });
  }, [postiPetali !== null, aperta, altri]); // eslint-disable-line react-hooks/exhaustive-deps

  const frecceNelFiore = (e: ReactKeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    const tutti = [...(fioreRef.current?.querySelectorAll<HTMLButtonElement>("button.petalo") ?? [])];
    const i = tutti.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    e.stopPropagation();
    const avanti = e.key === "ArrowRight" || e.key === "ArrowDown";
    tutti[(i + (avanti ? 1 : tutti.length - 1)) % tutti.length].focus();
  };

  const toccaBaccello = (b: Pezzo) => {
    if (scegliendo) {
      const comando = b.cosa ? possibili.get(b.cosa) : undefined;
      if (comando) azione({ tipo: "comando", comando });
      else azione({ tipo: "chiudi" });
      return;
    }
    if (b.azione.tipo === "apri" && aperta === b.cosa) azione({ tipo: "chiudi" });
    else azione(b.azione);
  };

  const H = palco.H;
  const classeBaccello = (b: Pezzo) => {
    const c = ["baccello", b.tipo];
    if (b.gruppo === "con te") c.push("con-te");
    if (b.attrezzo) c.push("strumento");
    if (aperta && b.cosa === aperta) c.push("aperto");
    if (accesi.has(b.chiave)) c.push("acceso");
    if (scegliendo) c.push(b.cosa && possibili.has(b.cosa) ? "possibile" : "spento");
    if (selezione.tipo === "inMano" && b.attrezzo === selezione.attrezzo) c.push("in-mano");
    return c.join(" ");
  };

  return (
    <div className="ramo" data-forma={forma} data-scegliendo={scegliendo ? "" : undefined}>
      <svg className="ramo-fili" viewBox="0 0 1000 562.5" preserveAspectRatio="none" aria-hidden="true">
        {disposti.alto.length > 0 && <path className="filo alto" d={percorsoDelFilo("alto", forma)} vectorEffect="non-scaling-stroke" />}
        {disposti.basso.length > 0 && <path className="filo basso" d={percorsoDelFilo("basso", forma, 0.02, 0.98)} vectorEffect="non-scaling-stroke" />}
      </svg>

      {/* le etichette dei gruppi */}
      {disposizione &&
        (["alto", "basso"] as Filo[]).flatMap((filo) =>
          disposti[filo].map((g, i) => {
            const e = disposizione[filo].etichette[i];
            return e ? (
              <div key={`${filo}:${g.nome}`} className={`etichetta-ramo ${filo}`} style={{ left: e.x, top: e.y }} aria-hidden="true">
                {g.etichetta ?? g.nome}
              </div>
            ) : null;
          }),
        )}

      {/* i baccelli: misurati alla scala piena, poi messi al loro posto */}
      <nav className="baccelli" aria-label={modello.fase === "gioco" ? "Che cosa fare" : "Le risposte"}>
        {(["alto", "basso"] as Filo[]).map((filo) => (
          <div key={filo} role="group" aria-label={filo === "alto" ? "Qui" : "Con te"}>
            {pezzi
              .filter((b) => b.filo === filo)
              .map((b) => {
                const p = posti.get(b.chiave);
                const glifo = b.tasto ? (GLIFO_TASTO[b.tasto] ?? b.tasto.toUpperCase()) : null;
                return (
                  <button
                    key={b.chiave}
                    ref={(el) => {
                      if (el) misure.current.set(b.chiave, el);
                      else misure.current.delete(b.chiave);
                    }}
                    type="button"
                    data-chiave={b.chiave}
                    className={classeBaccello(b)}
                    style={p ? { left: p.x, top: p.y, ["--scala" as string]: p.scala } : { visibility: "hidden", left: -9999, top: 0 }}
                    data-scala={p?.scala ?? 1}
                    tabIndex={p && (!scegliendo || (b.cosa && possibili.has(b.cosa))) ? 0 : -1}
                    aria-hidden={p ? undefined : true}
                    aria-haspopup={b.azione.tipo === "apri" ? "menu" : undefined}
                    aria-expanded={b.azione.tipo === "apri" ? aperta === b.cosa : undefined}
                    aria-keyshortcuts={b.tasto ?? undefined}
                    disabled={canaliChiusi && b.attrezzo === "matrice"}
                    aria-label={b.titolo ? `${b.etichetta}, ${b.titolo}` : canaliChiusi && b.attrezzo === "matrice" ? `${b.etichetta}: ${MOTIVO_CANALI.toLowerCase()}` : undefined}
                    title={canaliChiusi && b.attrezzo === "matrice" ? MOTIVO_CANALI : b.titolo}
                    onClick={(e) => {
                      e.stopPropagation();
                      toccaBaccello(b);
                    }}
                  >
                    <span className="baccello-testo">{b.etichetta}</span>
                    {glifo && <span className="tasto" aria-hidden="true">{glifo}</span>}
                  </button>
                );
              })}
          </div>
        ))}
        {piu.map((x) => (
          <button
            key={`piu:${x.filo}:${x.gruppo}`}
            type="button"
            className={`baccello piu ${x.gruppo === "con te" ? "con-te" : ""} ${altri?.gruppo === x.gruppo && altri.filo === x.filo ? "aperto" : ""} ${x.nascosti.some((b) => accesi.has(b.chiave)) ? "acceso" : ""}`}
            style={{ left: x.x, top: x.y, ["--scala" as string]: x.scala }}
            aria-haspopup="menu"
            aria-expanded={altri?.gruppo === x.gruppo}
            aria-label={`altre ${x.nascosti.length} cose: ${x.nascosti.map((b) => b.etichetta).join(", ")}`}
            onClick={(e) => {
              e.stopPropagation();
              if (altri?.gruppo === x.gruppo && altri.filo === x.filo) azione({ tipo: "chiudi" });
              else apriAltri(x.filo, x.gruppo);
            }}
          >
            {STRINGI}
            {x.nascosti.length}
          </button>
        ))}
        {/* il campione del «+N», per misurarlo */}
        <span
          className="baccello piu misura"
          aria-hidden="true"
          ref={(el) => {
            if (el) misure.current.set("misura:+", el);
          }}
        >
          +99
        </span>
      </nav>

      {/* «Usa con…» e l'attrezzo in mano: che cosa si sta facendo */}
      {scegliendo && (
        <div className="scelta-in-corso" role="status">
          {selezione.tipo === "usaCon"
            ? `${selezione.voce.etichetta.replace(/\s*con…$|…$/, "")} ${nomeDiCosa(selezione.cosa, cose)} ${/con…$/.test(selezione.voce.etichetta) || selezione.voce.comando !== null ? "con" : ""}… tocca una cosa accesa`.replace(/ +…/, "…")
            : `${selezione.etichetta} in mano: tocca una cosa accesa`}
          <button type="button" className="annulla" onClick={() => azione({ tipo: "chiudi" })}>
            annulla <span aria-hidden="true">· Esc</span>
          </button>
        </div>
      )}

      {/* il fiore */}
      {ancora && petali.length > 0 && (
        <div className={`fiore ${postiPetali ? "aperto" : ""}`} ref={fioreRef} role="menu" aria-label={menu ? `Che cosa fare con ${nomeDiCosa(menu.id, cose)}` : "Altre cose"} onKeyDown={frecceNelFiore}>
          <svg className="gambi" viewBox={`0 0 ${palco.W} ${H}`} aria-hidden="true">
            {postiPetali?.map((p, i) => {
              const el = misurePetali.current.get(petali[i].chiave);
              return <path key={petali[i].chiave} d={gambo({ x: ancora.x, y: ancora.y - (el?.offsetHeight ?? 32) / 2 }, p, el?.offsetHeight ?? 32)} />;
            })}
          </svg>
          {petali.map((p, i) => {
            const posto = postiPetali?.[i];
            const chiuso = canaliChiusi && !!p.verbo && CANALI_SECONDARI.has(p.verbo);
            return (
              <button
                key={p.chiave}
                ref={(el) => {
                  if (el) misurePetali.current.set(p.chiave, el);
                  else misurePetali.current.delete(p.chiave);
                }}
                type="button"
                role="menuitem"
                className={`petalo anello-${posto?.anello ?? p.anello} ${p.comando && accesi.has(`comando:${p.comando}`) ? "acceso" : ""}${chiuso ? " chiuso" : ""}`}
                disabled={chiuso}
                title={chiuso ? MOTIVO_CANALI : undefined}
                aria-label={chiuso ? `${p.etichetta}: ${MOTIVO_CANALI.toLowerCase()}` : undefined}
                style={posto ? { left: posto.x, top: posto.y, transitionDelay: `${i * 35}ms` } : { visibility: "hidden", left: -9999, top: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  azione(p.azione);
                }}
              >
                {p.etichetta}
                {p.nota && <small>{p.nota}</small>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function nomeDiCosa(id: string, cose: readonly Cosa[]): string {
  const c = cose.find((x) => x.id === id);
  if (!c) return id;
  const n = c.nome.replace(/'/g, "’");
  return /^(Il|Lo|La|I|Gli|Le|L’|Un|Uno|Una)\b/.test(n) ? n[0].toLowerCase() + n.slice(1) : n;
}

function nomeDelBersaglio(id: string, cose: readonly Cosa[], sel: Selezione): string {
  if (cose.some((c) => c.id === id)) return nomeDiCosa(id, cose);
  if (sel.tipo === "usaCon") return sel.voce.secondi.find((s) => s.id === id)?.etichetta ?? id;
  return id;
}
