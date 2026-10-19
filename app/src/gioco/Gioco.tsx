// ============================================================================
//  Lo schermo del gioco (06-app-desktop.md, §4 e §4.7; stile C, «Membrana»).
//  Il motore vero in Pyodide; il modello d'azione fa i menu; la grammatica
//  tipografica veste il testo; le atmosfere seguono lo stato del gioco.
//  Le modalità (§4.5): l'esplorazione, il dialogo, la conferma, il cartello
//  d'atto; sopra, la pausa (Esc), il diario (D), i salvataggi (F5, F9), le
//  opzioni. Il motore lo carica l'app all'avvio (motore/condiviso.ts); la
//  partita comincia come la sceglie il menu principale: nuova, da un
//  salvataggio, o ripresa (tornando dal menu).
//  La tastiera sta in tastiera.ts, le sonde delle prove in sonde.ts
//  (revisione 25, L13).
// ============================================================================
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Motore } from "../motore/runtime";
import { avviaMotore, usaPassoMotore } from "../motore/condiviso";
import type { DiarioIntero, Evento, Turno, VoceCronaca } from "../motore/tipi";
import { costruisciModello, type ModelloAzione, type SceltaModello } from "../azione/modello";
import { AZIONI_DI_SITUAZIONE } from "../azione/situazione";
import { climaDi, tavolozza, variabiliCss } from "../stile/atmosfere";
import { attributiSchermo, useMovimentoRidotto, useOpzioni } from "../stile/opzioni";
import { schermoIntero as cambiaSchermo } from "../lib/finestra";
import { avviaSuono, mixSuono, pausaSuono, suonaTocco, suonaTurno, taciSuono } from "./suono";
import { gestoDelClic } from "./tocco";
import { blocchiDelTurno, segnaNomi, type Blocco } from "./lamina/grammatica";
import Lamina, { type VoceDiario } from "./lamina/Lamina";
import Ramo from "./ramo/Ramo";
import { accesiDa, attrezzoDelVerbo, bersagli, COMANDO_TITOLI, NESSUNA, type Azione, type Selezione } from "./ramo/azioni";
import type { Filo } from "./ramo/geometria";
import Visore, { CartelloAtto, useCartelloAtto } from "./visore/Visore";
import Dialogo from "./dialogo/Dialogo";
import RigaComando from "./scritti/RigaComando";
import { AIUTO_DELL_APP, interpreta, type ComandoApp } from "./scritti/comandiApp";
import Diario from "./diario/Diario";
import type { IdPagina } from "./diario/pagine";
import Vene from "./vene/Vene";
import { Avviso, Conferma, PannelloOpzioni, PannelloTasti, Pausa, Salvataggi, useAvviso, type Domanda } from "./pannelli/Pannelli";
import { archivio, type IdPosto, type Posto } from "./salvataggi";
import { salvaUscendo } from "./uscita";
import { useTastiera, type Pannello } from "./tastiera";
import { useSonde } from "./sonde";
import { rigaDelRegistro } from "../menu/registro";
import "../stile/base.css";
import "./gioco.css";

const VERSIONE = __VERSIONE__;

/** Quanto costa in aria un tipo di azione, imparato giocando (D16): resta per
 *  tutta la sessione, anche tornando dal menu; una partita nuova lo azzera. */
const costi = new Map<string, number>();

/** Come comincia la partita: la sceglie il menu principale (06, §4.6). */
export type Inizio = { tipo: "nuova"; seme?: number } | { tipo: "carica"; posto: IdPosto } | { tipo: "riprendi" };

interface Props {
  /** RELITTO_PROVA: «salvataggi», la prova dei salvataggi nell'eseguibile;
   *  «finali», la prova dei finali attraverso l'interfaccia (prova/finali.ts),
   *  che legge il turno dalla sonda del gioco */
  prova?: "salvataggi" | "finali";
  inizio?: Inizio;
  /** torna al menu principale, dicendo come sta la partita («invariata» se un caricamento è stato
   *  rifiutato e la partita di prima resta), con un avviso se serve */
  alMenu?: (esito: string, avviso?: string) => void;
  /** un finale raggiunto, con la riga del registro di bordo se il finale la scrive */
  alFinale?: (finale: string, riga: string | null) => void;
  /** dopo un finale, «Titoli di coda»: li fa partire l'app, e poi si torna al menu */
  aiTitoli?: () => void;
}

const ARTICOLO = /^(?:il|lo|la|i|gli|le|l['’]|un|uno|una|dei|degli|delle)\s*/i;

/** Quanto restano accesi i pulsanti di un suggerimento (§6.1: «per qualche secondo»). */
const ACCESI_PER = 6000;

/** I blocchi di un turno, con i nomi toccabili se l'opzione è accesa. */
function blocchiDi(t: Turno, m: ModelloAzione, nomi: boolean, soloTesto = false): Blocco[] {
  const verbi = new Set([...t.pulsanti.verbi.map((v) => v.verbo), ...AZIONI_DI_SITUAZIONE.map((a) => a.comando.split(" ")[0])]);
  // a solo testo i suggerimenti restano nel testo (in maiuscolo, per chi scrive) ma non sono pulsanti
  const blocchi = blocchiDelTurno(t.eventi, { suggerimenti: soloTesto ? [] : m.suggerimenti, verbi, soloTesto });
  if (!nomi || soloTesto) return blocchi;
  return segnaNomi(
    blocchi,
    t.cose.map((c) => ({ id: c.id, nomi: [c.id, c.nome.replace(ARTICOLO, ""), c.etichetta, ...c.nomi] })),
  );
}

/** Quanta aria è costato il turno. */
const differenzaAria = (t: Turno) => (t.suono.eventi.find((e) => e.evento === "aria")?.differenza as number | undefined) ?? null;

/** Il seme di una partita nuova: il caso del gioco cambia da una partita all'altra. */
const semeNuovo = () => 1 + Math.floor(Math.random() * 2147483646);

/** Il congedo dell'Anziano: il punto di non ritorno che chiede una conferma (D16). */
const CONGEDO = /^\[Chiudi gli occhi/;

/** Il gioco che non può andare avanti (revisione 25, M7): una frase, il rimedio, e il dettaglio
 *  tecnico ripiegato, da copiare per chi deve correggere. Prima c'era la pila delle chiamate. */
function Inceppo({ dettaglio, alMenu }: { dettaglio: string; alMenu?: Props["alMenu"] }) {
  const [copiato, setCopiato] = useState(false);
  return (
    <div className="avvio inceppo" role="alert">
      <div className="inceppo-riquadro">
        <p className="inceppo-titolo">Il gioco si è inceppato.</p>
        <p>Non dipende da quello che hai fatto. Riavvialo: con «Continua» riprendi dall’ultimo salvataggio.</p>
        <div className="inceppo-scelte">
          <button type="button" autoFocus onClick={() => void salvaUscendo().then(() => location.reload())}>
            Riavvia il gioco
          </button>
          {alMenu && (
            <button type="button" onClick={() => alMenu("invariata")}>
              Torna al menu
            </button>
          )}
        </div>
        <details>
          <summary>Il dettaglio tecnico</summary>
          <pre>{dettaglio}</pre>
          <button type="button" onClick={() => void navigator.clipboard?.writeText(dettaglio).then(() => setCopiato(true))}>
            {copiato ? "Copiato" : "Copia il dettaglio"}
          </button>
        </details>
      </div>
    </div>
  );
}

export default function Gioco({ prova, inizio = { tipo: "nuova" }, alMenu, alFinale, aiTitoli }: Props = {}) {
  const [opzioni, cambiaOpzioni] = useOpzioni();
  const ridotto = useMovimentoRidotto(opzioni.movimento);
  const motoreRef = useRef<Motore | null>(null);
  const palcoRef = useRef<HTMLElement>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const passo = usaPassoMotore();
  const [turno, setTurno] = useState<Turno | null>(null);
  const [diario, setDiario] = useState<VoceDiario[]>([]);
  /** il diario (D): il prologo con la prima stanza, la cronaca del ponte, la pagina aperta */
  const [aperturaDiario, setAperturaDiario] = useState<readonly Evento[]>([]);
  const [cronaca, setCronaca] = useState<readonly VoceCronaca[]>([]);
  const [paginaDiario, setPaginaDiario] = useState<IdPagina>("trascrizione");
  const [verbi, setVerbi] = useState<ReadonlySet<string>>(new Set());
  const [completa, setCompleta] = useState(0);
  const [selezione, setSelezione] = useState<Selezione>(NESSUNA);
  const [altri, setAltri] = useState<{ filo: Filo; gruppo: string } | null>(null);
  const [accesi, setAccesi] = useState<ReadonlySet<string>>(new Set());
  const [palco, setPalco] = useState({ W: 0, H: 0 });
  const [pannello, setPannello] = useState<Pannello>(null);
  const [domanda, setDomanda] = useState<Domanda | null>(null);
  const [posti, setPosti] = useState<Posto[] | null>(null);
  const [dove, setDove] = useState("");
  const [avviso, mostraAvviso] = useAvviso();
  const contatore = useRef(0);
  const ultimoPosto = useRef<IdPosto>("1");
  /** la stanza dell'ultimo turno: il salvataggio automatico scatta quando cambia */
  const stanzaRef = useRef<string | null>(null);
  /** il contatto dell'ultimo turno: quando diventa «avvenuto», la membrana cresce */
  const contattoRef = useRef<string | null>(null);
  const [crescita, setCrescita] = useState(0);
  /** i comandi giocati da quando la partita è cominciata, e il finale (per la sonda della prova) */
  const passi = useRef(0);
  const finaleRef = useRef<string | null>(null);
  /** il baccello su cui torna il fuoco dopo il comando partito dal ramo (la tastiera, 06 §6.2) */
  const ritornoRef = useRef<string | null>(null);

  const modello = useMemo(() => (turno ? costruisciModello(turno) : null), [turno]);
  /** la modalità a solo testo (documento 18): la riga di comando al posto del ramo */
  const scritti = opzioni.comandi === "scritti";
  /** i comandi scritti, per le frecce su e giù */
  const storiaScritti = useRef<string[]>([]);

  // ---- il suono: parte con la partita, segue ogni turno, si abbassa nella pausa,
  // tace tornando al menu (06, §9.1; bibbia sonora, §10). Nelle prove resta muto.
  useEffect(() => {
    avviaSuono(prova !== undefined);
    return () => void taciSuono();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (turno) void suonaTurno(turno);
  }, [turno]);
  useEffect(() => {
    void pausaSuono(pannello !== null);
  }, [pannello]);
  useEffect(() => {
    if (prova === undefined) void mixSuono(opzioni);
  }, [opzioni, prova]);

  /** Una partita che comincia (o ricomincia): il prologo spento sopra la prima stanza. */
  const comincia = useCallback(
    (primo: Turno) => {
      const m = costruisciModello(primo);
      stanzaRef.current = primo.stato.stanza;
      contattoRef.current = primo.stato.contatto;
      setTurno(primo);
      setSelezione(NESSUNA);
      setAltri(null);
      setDiario([
        { chiave: contatore.current++, comando: null, differenza: null, blocchi: blocchiDelTurno(primo.apertura ?? []) },
        { chiave: contatore.current++, comando: null, differenza: null, blocchi: blocchiDi(primo, m, opzioni.nomiToccabili, scritti) },
      ]);
      setAperturaDiario([...(primo.apertura ?? []), ...primo.eventi]);
      setCronaca([]);
      passi.current = 0;
      finaleRef.current = null;
    },
    [opzioni.nomiToccabili, scritti],
  );

  // ---- l'avvio: la partita come l'ha scelta il menu ---------------------------
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { motore } = await avviaMotore();
        if (!vivo) return;
        motoreRef.current = motore;
        setVerbi(new Set(motore.compilazione.verbi ?? []));
        if (inizio.tipo === "carica") {
          const errore = await caricaDa(inizio.posto);
          // un caricamento rifiutato non tocca la partita che c'era nel motore
          if (errore && vivo) alMenu?.("invariata", errore);
        } else if (inizio.tipo === "riprendi") {
          const r = motore.riprendi();
          if (r.ok) mostra(r.turno, r.diario);
          else alMenu?.("nessuna", "Non c’è una partita da riprendere.");
        } else {
          costi.clear();
          comincia(motore.avvia(inizio.seme ?? semeNuovo()));
        }
      } catch (e) {
        setErrore(String(e instanceof Error ? (e.stack ?? e.message) : e));
      }
    })();
    return () => {
      vivo = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- la misura del palco (il ramo e il fiore si dispongono in pixel) ------
  useLayoutEffect(() => {
    const el = palcoRef.current;
    if (!el) return;
    const o = new ResizeObserver(() => setPalco({ W: el.clientWidth, H: el.clientHeight }));
    o.observe(el);
    return () => o.disconnect();
  }, []);

  // ---- i salvataggi -----------------------------------------------------------
  const salvaNel = useCallback(
    async (posto: IdPosto, silenzioso = false) => {
      const m = motoreRef.current;
      if (!m) return;
      try {
        const testo = m.salva(`${VERSIONE.gioco} · ${VERSIONE.commit}`, new Date().toISOString());
        await archivio().scrivi(posto, testo);
        if (!silenzioso) mostraAvviso(`Salvato nel posto ${posto}.`);
      } catch (e) {
        mostraAvviso(`Il salvataggio non è riuscito: ${String(e instanceof Error ? e.message : e)}`, true);
      }
    },
    [mostraAvviso],
  );

  /** Una partita ridisegnata da capo (un caricamento, il ritorno dal menu): il
   *  turno che la mostra, e il diario intero. */
  const mostra = useCallback(
    (t: Turno, d: DiarioIntero) => {
      const mod = costruisciModello(t);
      stanzaRef.current = t.stato.stanza;
      contattoRef.current = t.stato.contatto;
      setTurno(t);
      setSelezione(NESSUNA);
      setAltri(null);
      setDiario([{ chiave: contatore.current++, comando: null, differenza: null, blocchi: blocchiDi(t, mod, opzioni.nomiToccabili, scritti) }]);
      setAperturaDiario(d.apertura);
      setCronaca(d.cronaca);
    },
    [opzioni.nomiToccabili, scritti],
  );

  /** Carica un posto; restituisce il motivo, se non ci riesce (la partita in corso resta). */
  const caricaDa = useCallback(
    async (posto: IdPosto): Promise<string | null> => {
      const m = motoreRef.current;
      if (!m) return "Il motore non è pronto.";
      try {
        const testo = await archivio().leggi(posto);
        const r = m.carica(testo);
        if (!r.ok) {
          mostraAvviso(r.messaggio, true);
          return r.messaggio;
        }
        mostra(r.turno, r.diario);
        if (r.esito === "identica") mostraAvviso(posto === "automatico" ? "Partita ripresa dall’ultima stanza." : `Partita caricata dal posto ${posto}.`);
        else mostraAvviso(r.messaggio, r.esito === "diversa");
        return null;
      } catch (e) {
        const motivo = `Il caricamento non è riuscito: ${String(e instanceof Error ? e.message : e)}`;
        mostraAvviso(motivo, true);
        return motivo;
      }
    },
    [mostraAvviso, mostra],
  );

  const apriSalvataggi = useCallback(async (modo: "salva" | "carica") => {
    setPannello(modo);
    setPosti(null);
    try {
      const a = archivio();
      setDove(await a.dove());
      setPosti(await a.elenco());
    } catch (e) {
      setPosti([]);
      setDove(String(e));
    }
  }, []);

  // ---- un comando ------------------------------------------------------------
  const gioca = useCallback(
    (comando: string, comeSiLegge?: string) => {
      const m = motoreRef.current;
      if (!m) return;
      const prima = stanzaRef.current;
      let t: Turno;
      try {
        t = m.comando(comando);
      } catch (e) {
        // il ponte ha rimesso la partita com'era (revisione 25, M8): si dice, e si resta qui
        console.error("[gioco] il comando è caduto:", comando, e);
        mostraAvviso("Questo comando non è andato a buon fine: la partita è rimasta com’era.", true);
        return;
      }
      passi.current += 1;
      stanzaRef.current = t.stato.stanza;
      // il primo contatto: la membrana entra dai bordi (§3)
      if (contattoRef.current === "nuovo" && t.stato.contatto === "avvenuto") setCrescita((n) => n + 1);
      contattoRef.current = t.stato.contatto;
      const mod = costruisciModello(t);
      const differenza = differenzaAria(t);
      // D16: quanto costa un tipo di azione lo si sa dopo averla provata
      if (differenza && t.comando?.verbo) costi.set(t.comando.verbo, differenza);
      setTurno(t);
      setSelezione(NESSUNA);
      setAltri(null);
      setDiario((d) => [
        ...d.slice(-40),
        { chiave: contatore.current++, comando: comeSiLegge ?? comando, differenza, blocchi: blocchiDi(t, mod, opzioni.nomiToccabili, scritti) },
      ]);
      // la cronaca segue la sequenza del motore: ANNULLA la accorcia
      const c = t.cronaca;
      if (c) setCronaca((v) => [...v.slice(0, c.lunghezza - (c.nuova ? 1 : 0)), ...(c.nuova ? [c.nuova] : [])]);
      // il salvataggio automatico, a ogni cambio di stanza (§4.6)
      if (t.stato.stanza !== prima && t.esito === "in_corso" && t.pulsanti.fase === "gioco") void salvaNel("automatico", true);
      // un finale: la sua riga nel registro dei finali (§4.6)
      const finale = t.suono.eventi.find((e) => e.evento === "finale");
      if (finale && typeof finale.finale === "string") {
        finaleRef.current = finale.finale;
        alFinale?.(finale.finale, rigaDelRegistro(t.eventi));
      }
    },
    [opzioni.nomiToccabili, scritti, salvaNel, alFinale, mostraAvviso],
  );

  // cambiando modo a metà partita lo stato è lo stesso: il turno di adesso si ricompone
  const modoPrima = useRef(scritti);
  useEffect(() => {
    if (modoPrima.current === scritti) return;
    modoPrima.current = scritti;
    if (!turno || !modello) return;
    setDiario((d) => (d.length ? [...d.slice(0, -1), { ...d[d.length - 1], blocchi: blocchiDi(turno, modello, opzioni.nomiToccabili, scritti) }] : d));
    setSelezione(NESSUNA);
    setAltri(null);
  }, [scritti, turno, modello, opzioni.nomiToccabili]);

  // i suggerimenti del turno accendono i loro pulsanti per qualche secondo
  useEffect(() => {
    if (!modello) return;
    const a = accesiDa(modello);
    setAccesi(a);
    if (!a.size) return;
    const t = setTimeout(() => setAccesi(new Set()), ACCESI_PER);
    return () => clearTimeout(t);
  }, [modello]);

  const chiudi = useCallback(() => {
    setSelezione(NESSUNA);
    setAltri(null);
  }, []);

  const ricomincia = useCallback(() => {
    const m = motoreRef.current;
    if (!m) return;
    setPannello(null);
    costi.clear();
    comincia(m.avvia(semeNuovo()));
  }, [comincia]);

  const azione = useCallback(
    (a: Azione) => {
      if (a.tipo === "comando") {
        // alla fine della partita, ricominciare e caricare sono dell'app
        if (modello?.fase === "fine" && a.comando === "ricomincia") return ricomincia();
        if (modello?.fase === "fine" && a.comando === "carica") return void apriSalvataggi("carica");
        if (modello?.fase === "fine" && a.comando === COMANDO_TITOLI) return aiTitoli?.();
        // il fuoco tornerà sulla cosa da cui il comando è partito: con la tastiera non si riparte da capo
        const qui = document.activeElement;
        ritornoRef.current =
          qui instanceof HTMLElement && qui.closest(".ramo")
            ? selezione.tipo === "fiore" || selezione.tipo === "usaCon"
              ? `cosa:${selezione.cosa}`
              : (qui.dataset.chiave ?? null)
            : null;
        gioca(a.comando, a.comeSiLegge);
      } else if (a.tipo === "chiudi") chiudi();
      else if (a.tipo === "apri") {
        setAltri(null);
        setSelezione({ tipo: "fiore", cosa: a.cosa });
      } else if (a.tipo === "usaCon") {
        setAltri(null);
        setSelezione({ tipo: "usaCon", cosa: a.cosa, voce: a.voce });
      } else if (a.tipo === "inMano") {
        const attrezzo = modello?.attrezzi.find((x) => x.id === a.attrezzo);
        const verbo = attrezzo?.verbi.find((v) => v.verbo === a.verbo);
        setAltri(null);
        setSelezione({ tipo: "inMano", attrezzo: a.attrezzo, verbo: a.verbo, etichetta: verbo ? `${attrezzo!.etichetta} (${verbo.etichetta.toLowerCase()})` : (attrezzo?.etichetta ?? a.attrezzo) });
      }
    },
    [gioca, chiudi, modello, selezione, ricomincia, apriSalvataggi, aiTitoli],
  );

  // dopo il turno, il fuoco torna sul baccello, se c'è ancora e nessun altro l'ha preso;
  // il dialogo e le domande hanno i loro tasti: si torna sulla cosa quando finiscono
  useEffect(() => {
    const chiave = ritornoRef.current;
    const fase = turno?.pulsanti.fase;
    if (!chiave || fase === "dialogo" || fase === "conferma" || fase === "scelta") return;
    ritornoRef.current = null;
    if (fase !== "gioco") return;
    const t = setTimeout(() => {
      const ora = document.activeElement;
      if (ora && ora !== document.body) return;
      document.querySelector<HTMLButtonElement>(`.baccello[data-chiave="${CSS.escape(chiave)}"]`)?.focus({ preventScroll: true });
    }, 0);
    return () => clearTimeout(t);
  }, [turno]);

  // «Usa con…» e l'attrezzo in mano: il fuoco va sulla prima cosa accesa (non se il fiore
  // mostra i bersagli come petali: lì il primo petalo l'ha già preso)
  useEffect(() => {
    if (selezione.tipo !== "usaCon" && selezione.tipo !== "inMano") return;
    const t = setTimeout(() => {
      const ora = document.activeElement;
      if (ora && ora !== document.body && !ora.classList.contains("baccello")) return;
      [...document.querySelectorAll<HTMLButtonElement>(".baccello.possibile")].find((b) => b.tabIndex === 0)?.focus({ preventScroll: true });
    }, 0);
    return () => clearTimeout(t);
  }, [selezione]);

  /** Un posto dove salvare, scritto («salva 3»): chiede conferma se è occupato. */
  const salvaScritto = useCallback(
    async (posto: IdPosto) => {
      let presente = false;
      try {
        presente = !!(await archivio().elenco()).find((p) => p.posto === posto)?.presente;
      } catch {
        /* senza l'elenco si salva e basta */
      }
      const salva = () => {
        ultimoPosto.current = posto;
        void salvaNel(posto);
      };
      if (presente) setDomanda({ testo: `Sovrascrivere il posto ${posto}?`, si: "Sovrascrivi", no: "Lascia stare", allora: salva });
      else salva();
    },
    [salvaNel],
  );

  /** Un comando che nella modalità a solo testo è dell'app (documento 18, §5.4). */
  const eseguiApp = useCallback(
    (c: ComandoApp) => {
      switch (c.tipo) {
        case "salva":
          if (!c.capito) mostraAvviso("Nell’app i posti sono sei: scrivi SALVA 3, per esempio.", true);
          else if (c.posto && c.posto !== "automatico") void salvaScritto(c.posto);
          else if (c.posto === "automatico") mostraAvviso("Il posto automatico lo scrive il gioco da sé.", true);
          else void apriSalvataggi("salva");
          break;
        case "carica":
          if (!c.capito) mostraAvviso("Nell’app i posti sono sei: scrivi CARICA 3, per esempio.", true);
          else if (c.posto) void caricaDa(c.posto);
          else void apriSalvataggi("carica");
          break;
        case "ricomincia":
          setDomanda({ testo: "Ricominciare da capo?", sotto: "La partita in corso si perde, se non l’hai salvata.", si: "Ricomincia", no: "Torna al gioco", allora: ricomincia });
          break;
        case "diario":
          setPannello("diario");
          break;
        case "opzioni":
          setPannello("opzioni");
          break;
        case "menu":
          setPannello("pausa");
          break;
        case "tasti":
          setPannello("tasti");
          break;
        case "aiuto":
          // il testo d'aiuto del motore, e sotto i verbi del gioco e le parole dell'app
          gioca("aiuto");
          setDiario((d) => [...d, { chiave: contatore.current++, comando: null, differenza: null, blocchi: blocchiDelTurno([{ tipo: "sistema", testo: AIUTO_DELL_APP }], { soloTesto: true }) }]);
          break;
      }
    },
    [salvaScritto, apriSalvataggi, caricaDa, ricomincia, gioca, mostraAvviso],
  );

  /** Una riga scritta: o una parola dell'app, o un comando per il motore. */
  const inviaScritto = useCallback(
    (testo: string) => {
      storiaScritti.current = [...storiaScritti.current.filter((x) => x !== testo), testo].slice(-60);
      const app = interpreta(testo);
      if (app) eseguiApp(app);
      else gioca(testo);
    },
    [eseguiApp, gioca],
  );

  /** Una risposta del dialogo: il congedo dell'Anziano chiede conferma. */
  const scegli = useCallback(
    (s: SceltaModello) => {
      if (turno?.stato.dialogo === "anziano" && CONGEDO.test(s.etichetta))
        setDomanda({ testo: "Da qui non si torna.", si: "Chiudi gli occhi", no: "Non ancora", allora: () => gioca(s.comando, s.etichetta) });
      else gioca(s.comando, s.etichetta);
    },
    [turno?.stato.dialogo, gioca],
  );

  // un nome toccato nel testo: un bersaglio, se se ne sta scegliendo uno; altrimenti il suo fiore
  const suNome = useCallback(
    (cosa: string) => {
      if (!modello) return;
      const possibili = bersagli(selezione, modello);
      if (possibili.size) {
        const c = possibili.get(cosa);
        if (c) gioca(c);
        else chiudi();
        return;
      }
      if ([...modello.qui, ...modello.conTe].some((m) => m.id === cosa)) azione({ tipo: "apri", cosa });
    },
    [modello, selezione, gioca, chiudi, azione],
  );

  // un suggerimento toccato nel testo
  const suSuggerimento = useCallback(
    (i: number) => {
      const s = modello?.suggerimenti[i];
      if (!s) return;
      if (s.comando) gioca(s.comando);
      else if (s.dove === "attrezzo") {
        const a = attrezzoDelVerbo(modello!.attrezzi, s.verbo);
        if (a) azione({ tipo: "inMano", attrezzo: a.id, verbo: s.verbo });
      }
    },
    [modello, gioca, azione],
  );

  // lo schermo intero come dice l'opzione (anche aperto da solo, con ?gioco)
  useEffect(() => {
    void cambiaSchermo(opzioni.schermoIntero);
  }, [opzioni.schermoIntero]);

  // F11: lo schermo intero, e l'opzione lo ricorda
  const schermoIntero = useCallback(async () => {
    cambiaOpzioni({ schermoIntero: await cambiaSchermo() });
  }, [cambiaOpzioni]);

  // ---- la tastiera (§6.2): gioco/tastiera.ts ---------------------------------
  const avanzaCompleta = useCallback(() => setCompleta((n) => n + 1), []);
  useTastiera({ modello, selezione, altri, pannello, domanda, turno, scritti, apriSalvataggi, schermoIntero, setPannello, chiudi, completa: avanzaCompleta, gioca, scegli });

  // le sonde delle prove (gioco/sonde.ts): non fanno niente se nessuna prova le chiede
  useSonde({ prova, turno, modello, motoreRef, passi, finaleRef, gioca, comincia, setCronaca });

  const [cartello, chiudiCartello] = useCartelloAtto(turno?.stato.atto);
  const clima = turno ? climaDi(turno.stato) : null;
  const forma = clima?.forma ?? "acciaio";
  const stile = (clima ? variabiliCss(tavolozza(clima), turno!.stato.aria) : {}) as CSSProperties;
  const inMano = selezione.tipo === "inMano";
  const ultima = diario[diario.length - 1];
  const aria = turno?.stato.mostra.aria ? turno.stato.aria : null;
  // il bordo del visore respira al ritmo del fiato, che accelera quando l'aria scende
  const respiro = aria === null ? 4.4 : aria >= 60 ? 4.4 : aria >= 30 ? 3.4 : aria > 15 ? 2.2 : 6.4;
  const inDialogo = modello?.fase === "dialogo" && !!turno?.stato.dialogo;
  // la conferma che chiede il motore (fase «conferma»): Sì e No dai suoi pulsanti
  const domandaDelMotore: Domanda | null =
    !scritti && modello?.fase === "conferma" && turno
      ? {
          testo: turno.eventi.filter((e) => e.tipo === "domanda").map((e) => e.testo).join(" ") || "Confermi?",
          si: modello.scelte.find((s) => s.tasto === "s")?.etichetta ?? "Sì",
          no: modello.scelte.find((s) => s.tasto === "n")?.etichetta ?? "No",
          allora: () => gioca(modello.scelte.find((s) => s.tasto === "s")?.comando ?? "sì", "sì"),
          altrimenti: () => gioca(modello.scelte.find((s) => s.tasto === "n")?.comando ?? "no", "no"),
          comandoSi: modello.scelte.find((s) => s.tasto === "s")?.comando ?? "sì",
          comandoNo: modello.scelte.find((s) => s.tasto === "n")?.comando ?? "no",
        }
      : null;

  return (
    <div
      className="schermo tema gioco"
      style={stile}
      data-forma={forma}
      data-atmosfera={clima?.atmosfera ?? "santamaria"}
      data-protezione={clima?.protezione ? "" : undefined}
      data-ipossia={clima?.ipossia ? "" : undefined}
      data-in-mano={inMano ? "" : undefined}
      {...attributiSchermo(opzioni, ridotto)}
      onClickCapture={(e) => {
        // il tocco sul pulsante (bibbia sonora, §5.8): in cattura, prima che un pannello si chiuda
        const g = gestoDelClic(e.target);
        if (g) void suonaTocco(g);
      }}
    >
      {clima && <Vene clima={clima} energia={turno?.stato.energia === "ripristinata"} ridotto={ridotto} crescita={crescita} />}
      <main className="palco" aria-label="Il Relitto Silente" ref={palcoRef} onClick={() => (selezione.tipo !== "nessuna" || altri) && chiudi()}>
        <div className="esplorazione" aria-hidden={inDialogo || !!pannello || !!domanda ? true : undefined}>
          {turno && (
            <div className="atto" aria-label={`Atto ${turno.stato.atto}: ${turno.stato.titolo_atto}`}>
              Atto {["I", "II", "III", "IV", "V"][turno.stato.atto - 1]} · {turno.stato.titolo_atto.toLowerCase()}
            </div>
          )}
          {turno && (
            <nav className="comandi-app" aria-label="Diario e menu">
              <button type="button" onClick={() => setPannello("diario")}>
                diario {!scritti && <span className="tasto">D</span>}
              </button>
              <button type="button" onClick={() => setPannello("pausa")}>
                menu <span className="tasto">Esc</span>
              </button>
            </nav>
          )}
          <Lamina
            diario={diario}
            forma={forma}
            rivelazione={opzioni.rivelazione && !ridotto}
            completa={completa}
            suNome={scritti ? undefined : suNome}
            suSuggerimento={scritti ? undefined : suSuggerimento}
          />
          {modello && turno && !inDialogo && scritti && (
            <RigaComando invia={inviaScritto} completa={() => setCompleta((n) => n + 1)} storia={storiaScritti.current} bloccata={!!pannello || !!domanda || cartello !== null} chiave={turno} />
          )}
          {modello && turno && !inDialogo && !scritti && modello.fase !== "conferma" && (
            <Ramo
              modello={modello}
              cose={turno.cose}
              forma={forma}
              selezione={selezione}
              accesi={accesi}
              costi={costi}
              palco={palco}
              azione={azione}
              altri={altri}
              canaliChiusi={clima?.protezione}
              apriAltri={(filo, gruppo) => {
                setSelezione(NESSUNA);
                setAltri({ filo, gruppo });
              }}
            />
          )}
          {turno && clima && <Visore turno={turno} clima={clima} ridotto={ridotto} differenza={ultima?.differenza ?? null} battito={ultima?.chiave ?? 0} />}
        </div>
        {inDialogo && modello && turno && ultima && (
          <Dialogo personaggio={turno.stato.dialogo!} blocchi={ultima.blocchi} detto={ultima.comando && ultima.comando !== turno.comando?.testo ? ultima.comando : null} scelte={modello.scelte}
            forma={forma}
            ridotto={ridotto}
            scegli={scegli}
            riga={
              scritti ? (
                <RigaComando inDialogo invia={inviaScritto} completa={() => setCompleta((n) => n + 1)} storia={storiaScritti.current} bloccata={!!pannello || !!domanda || cartello !== null} chiave={turno} />
              ) : undefined
            }
          />
        )}
        {aria !== null && <div className="vetro" style={{ ["--respiro" as string]: `${respiro}s` }} aria-hidden="true" />}
        {clima?.protezione && (
          <div className="velo-protezione" role="status">
            protezione vitale · canali secondari chiusi
          </div>
        )}
        {clima?.ipossia && <div className="ipossia-velo" aria-hidden="true" />}
        {cartello !== null && turno && <CartelloAtto atto={cartello} titolo={turno.stato.titolo_atto} acciaio={forma === "acciaio"} chiudi={chiudiCartello} />}

        {pannello === "pausa" && (
          <Pausa
            forma={forma}
            voci={{
              riprendi: () => setPannello(null),
              diario: () => setPannello("diario"),
              salva: () => void apriSalvataggi("salva"),
              carica: () => void apriSalvataggi("carica"),
              annulla: turno && turno.stato.turno > 0 ? () => (setPannello(null), gioca("annulla", "annulla l’ultima mossa")) : null,
              opzioni: () => setPannello("opzioni"),
              tasti: () => setPannello("tasti"),
              ricomincia: () =>
                setDomanda({ testo: "Ricominciare da capo?", sotto: "La partita in corso si perde, se non l’hai salvata.", si: "Ricomincia", no: "Torna al gioco", allora: ricomincia }),
              // solo nello sviluppo: ricaricare la pagina perderebbe la partita (revisione 25, G1)
              misure: import.meta.env.DEV ? () => (location.search = "?prova") : null,
              menu: alMenu ? () => alMenu(turno?.esito ?? "in_corso") : null,
            }}
          />
        )}
        {(pannello === "salva" || pannello === "carica") && (
          <Salvataggi
            modo={pannello}
            forma={forma}
            posti={posti}
            dove={dove}
            chiudi={() => setPannello(null)}
            scegli={(p) => {
              if (pannello === "carica") {
                setPannello(null);
                void caricaDa(p.posto);
                return;
              }
              const salva = () => {
                ultimoPosto.current = p.posto;
                setPannello(null);
                void salvaNel(p.posto);
              };
              if (p.presente) setDomanda({ testo: `Sovrascrivere il posto ${p.posto}?`, si: "Sovrascrivi", no: "Lascia stare", allora: salva });
              else salva();
            }}
          />
        )}
        {pannello === "diario" && (
          <Diario
            forma={forma}
            apertura={aperturaDiario}
            cronaca={cronaca}
            verbi={verbi}
            pagina={paginaDiario}
            sceglie={setPaginaDiario}
            chiudi={() => setPannello(null)}
          />
        )}
        {pannello === "opzioni" && <PannelloOpzioni forma={forma} opzioni={opzioni} cambia={cambiaOpzioni} chiudi={() => setPannello("pausa")} />}
        {pannello === "tasti" && <PannelloTasti forma={forma} chiudi={() => setPannello("pausa")} scritti={scritti} />}
        {(domanda ?? domandaDelMotore) && <Conferma domanda={(domanda ?? domandaDelMotore)!} forma={forma} chiudi={() => setDomanda(null)} />}
        {avviso && <Avviso testo={avviso.testo} grave={avviso.grave} />}
        {!turno && !errore && <div className="avvio">{passo}</div>}
        {errore && <Inceppo dettaglio={errore} alMenu={alMenu} />}
      </main>
    </div>
  );
}
