// ============================================================================
//  La schermata della prova tecnica (fase 1).
//  Grezza per scelta: gioca la partita con i soli pulsanti del motore, misura
//  l'avvio, i turni, l'audio di Rust e le venature, e scrive un rapporto.
//  Con RELITTO_PROVA=completa (o =esci) fa tutto da sola e, con =esci, chiude;
//  con RELITTO_PROVA=mondo misura il prototipo del suono (ProvaSuono.tsx).
// ============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { caricaMotore, type Motore, type TempiAvvio } from "../motore/runtime";
import type { Evento, Pulsanti, SceltaPulsante, Turno } from "../motore/tipi";
import { comando, dentroTauri, type AvvioAudio, type InfoSistema, type MisureAudio } from "../lib/tauri";
import { Venature, zoneSchermata, type Atmosfera } from "./venature";
import { arrotonda, attesa, media, prossimoFotogramma, riassumi, type MisuraFotogrammi, type Riassunto } from "./statistiche";
import ProvaSuono from "./ProvaSuono";
import "./prova.css";

const VERSIONE = __VERSIONE__;

// Un solo motore per pagina, anche quando React (StrictMode, in sviluppo)
// monta il componente due volte.
let caricamento: ReturnType<typeof caricaMotore> | null = null;

interface Voce {
  comando?: string;
  eventi: Evento[];
}

interface EsitoPercorso {
  percorso: string;
  comandi: number;
  giocati: number;
  modi: Record<string, number>;
  diversi: string[];
  nonTrovato: string | null;
  attese: { attesa: string; ok: boolean; motivo?: string }[];
  turnoJs: Riassunto;
  turnoPython: { motore: Riassunto; pulsanti: Riassunto; json: Riassunto };
  ricerca: Riassunto;
  secondi: number;
}

interface MisuraAudio {
  avvio?: AvvioAudio;
  ipcAndataRitorno?: Riassunto;
  segnaleResa?: Riassunto;
  quiete?: MisureAudio;
  sottoCarico?: MisureAudio;
  errore?: string;
}

const testoDi = (eventi: Evento[]) => eventi.map((e) => (e.stacco ? "\n" : "") + e.testo + "\n").join("");

// ---------------------------------------------------------------------------
//  Le attese dei percorsi, nella forma di collaudo/regressioni.py
// ---------------------------------------------------------------------------
function controllaAttesa(attesa: string, ultimo: Turno, risposte: string[]): { ok: boolean; motivo?: string } {
  let m = /^esito\s+(\w+)$/.exec(attesa);
  if (m) return ultimo.esito === m[1] ? { ok: true } : { ok: false, motivo: `esito ${ultimo.esito}` };
  m = /^stanza\s+(.+)$/.exec(attesa);
  if (m) return ultimo.stato.stanza === m[1] ? { ok: true } : { ok: false, motivo: `stanza ${ultimo.stato.stanza}` };
  m = /^finale\s+«(.+)»$/.exec(attesa);
  if (m) return risposte[risposte.length - 1].includes(m[1]) ? { ok: true } : { ok: false, motivo: "l’ultima risposta non lo contiene" };
  m = /^compare\s+«(.+)»$/.exec(attesa);
  if (m) return risposte.slice(1).some((r) => r.includes(m![1])) ? { ok: true } : { ok: false, motivo: "non compare mai" };
  m = /^mai\s+«(.+)»$/.exec(attesa);
  if (m) return risposte.slice(1).some((r) => r.includes(m![1])) ? { ok: false, motivo: "compare" } : { ok: true };
  m = /^([\w' ]+?)\s*(==|!=|<=|>=|=|<|>)\s*(\S+)$/.exec(attesa);
  if (m) {
    const valore = (ultimo.stato as unknown as Record<string, unknown>)[m[1].trim()];
    if (typeof valore !== "number") return { ok: false, motivo: `«${m[1]}» non è fra gli strumenti` };
    const n = Number(m[3]);
    const ok = { "==": valore === n, "=": valore === n, "!=": valore !== n, "<=": valore <= n, ">=": valore >= n, "<": valore < n, ">": valore > n }[m[2]];
    return ok ? { ok: true } : { ok: false, motivo: `${m[1]} = ${valore}` };
  }
  return { ok: false, motivo: "attesa non riconosciuta" };
}

// ---------------------------------------------------------------------------
//  I pulsanti di una cosa: i verbi che il motore offre per quell'oggetto
// ---------------------------------------------------------------------------
interface PulsanteVerbo {
  etichetta: string;
  comando: string;
}

function verbiPer(p: Pulsanti, id: string): PulsanteVerbo[] {
  const out: PulsanteVerbo[] = [];
  for (const v of p.verbi) {
    const primo = v.primi.find((x) => x.id === id);
    if (!primo) continue;
    const base = `${v.verbo} ${primo.testo}`;
    if (v.secondo !== "obbligatorio") out.push({ etichetta: v.etichetta, comando: base });
    if (v.secondo === "no") continue;
    const secondi = v.secondi ?? v.secondi_per?.[id] ?? [];
    for (const s of secondi) if (s.id !== id) out.push({ etichetta: `${v.etichetta} ${s.testo}`, comando: `${base} ${s.testo}` });
  }
  return out;
}

export default function Prova() {
  const motoreRef = useRef<Motore | null>(null);
  const [passo, setPasso] = useState("Avvio…");
  const [errore, setErrore] = useState<string | null>(null);
  const [tempiAvvio, setTempiAvvio] = useState<TempiAvvio | null>(null);
  const [finestraPronta, setFinestraPronta] = useState<number | null>(null);
  const [sistema, setSistema] = useState<InfoSistema | null>(null);
  const [turno, setTurno] = useState<Turno | null>(null);
  const [diario, setDiario] = useState<Voce[]>([]);
  const [selezionato, setSelezionato] = useState<string | null>(null);
  const [acceso, setAcceso] = useState<string | null>(null);
  const [registro, setRegistro] = useState<string[]>([]);
  const [percorso, setPercorso] = useState<EsitoPercorso | null>(null);
  const [fotogrammi, setFotogrammi] = useState<MisuraFotogrammi[]>([]);
  const [audio, setAudio] = useState<MisuraAudio>({});
  const [occupato, setOccupato] = useState(false);
  const [rapporto, setRapporto] = useState<string | null>(null);
  const erroriJs = useRef<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const venatureRef = useRef(new Venature());
  const testoRef = useRef<HTMLDivElement>(null);

  const scrivi = useCallback((riga: string) => setRegistro((r) => [...r.slice(-200), riga]), []);

  // ---- l'avvio: il motore, le informazioni del sistema ----------------------
  useEffect(() => {
    const suErrore = (e: ErrorEvent) => erroriJs.current.push(`${e.message} (${e.filename}:${e.lineno})`);
    const suRifiuto = (e: PromiseRejectionEvent) => erroriJs.current.push(`promessa rifiutata: ${String(e.reason)}`);
    addEventListener("error", suErrore);
    addEventListener("unhandledrejection", suRifiuto);
    let vivo = true;
    (async () => {
      if (dentroTauri()) {
        setFinestraPronta(await comando<number>("tempo_avvio"));
        setSistema(await comando<InfoSistema>("info_sistema"));
      }
      try {
        caricamento ??= caricaMotore(setPasso);
        const { motore, tempi } = await caricamento;
        if (!vivo) return;
        motoreRef.current = motore;
        setTempiAvvio(tempi);
        const primo = motore.avvia(1);
        setTurno(primo);
        setDiario([{ eventi: primo.eventi }]);
        setPasso("Pronto.");
      } catch (e) {
        setErrore(String(e instanceof Error ? e.stack ?? e.message : e));
      }
    })();
    return () => {
      vivo = false;
      removeEventListener("error", suErrore);
      removeEventListener("unhandledrejection", suRifiuto);
    };
  }, []);

  useEffect(() => {
    testoRef.current?.scrollTo({ top: testoRef.current.scrollHeight });
  }, [diario]);

  // ---- giocare un comando: sempre e solo da un pulsante ----------------------
  const premi = useCallback((cmd: string) => {
    const m = motoreRef.current;
    if (!m) return null;
    const t = m.comando(cmd);
    setTurno(t);
    setSelezionato(null);
    setDiario((d) => [...d.slice(-60), { comando: cmd, eventi: t.eventi }]);
    return t;
  }, []);

  // ---- il percorso a soli pulsanti -------------------------------------------
  const giocaPercorso = useCallback(
    async (nome: string, aVista: boolean): Promise<EsitoPercorso | null> => {
      const m = motoreRef.current;
      if (!m) return null;
      const t0 = performance.now();
      const p = m.percorso(nome);
      let ultimo = m.avvia(1);
      setTurno(ultimo);
      setDiario([{ eventi: ultimo.eventi }]);
      const risposte = [testoDi(ultimo.eventi)];
      const tJs: number[] = [];
      const tMotore: number[] = [];
      const tPulsanti: number[] = [];
      const tJson: number[] = [];
      const tRicerca: number[] = [];
      const modi: Record<string, number> = { uguale: 0, equivalente: 0, "stesso stato": 0 };
      const diversi: string[] = [];
      let nonTrovato: string | null = null;
      let giocati = 0;
      for (const cmd of p.comandi) {
        if (ultimo.esito !== "in_corso") break;
        const r0 = performance.now();
        const s: SceltaPulsante = m.pulsantePer(cmd);
        tRicerca.push(performance.now() - r0);
        if (!s.trovato || !s.comando) {
          nonTrovato = cmd;
          break;
        }
        modi[s.modo!] += 1;
        if (s.modo === "stesso stato") diversi.push(`${cmd} → ${s.comando}`);
        if (aVista) {
          if (s.gruppo === "verbo") {
            const id = ultimo.pulsanti.oggetti.find((o) => verbiPer(ultimo.pulsanti, o.id).some((v) => v.comando === s.comando))?.id;
            if (id) setSelezionato(id);
          }
          setAcceso(s.comando);
          await attesa(260);
        }
        const c0 = performance.now();
        ultimo = premi(s.comando)!;
        tJs.push(performance.now() - c0);
        tMotore.push(ultimo.ms.motore);
        tPulsanti.push(ultimo.ms.pulsanti);
        tJson.push(ultimo.ms.json);
        risposte.push(testoDi(ultimo.eventi));
        giocati++;
        setAcceso(null);
        if (aVista) await attesa(140);
        else if (giocati % 4 === 0) await prossimoFotogramma();
      }
      const esito: EsitoPercorso = {
        percorso: nome,
        comandi: p.comandi.length,
        giocati,
        modi,
        diversi,
        nonTrovato,
        attese: p.attese.map((a) => ({ attesa: a, ...controllaAttesa(a, ultimo, risposte) })),
        turnoJs: riassumi(tJs),
        turnoPython: { motore: riassumi(tMotore), pulsanti: riassumi(tPulsanti), json: riassumi(tJson) },
        ricerca: riassumi(tRicerca),
        secondi: arrotonda((performance.now() - t0) / 1000),
      };
      setPercorso(esito);
      scrivi(
        `Percorso ${nome}: ${giocati}/${p.comandi.length} comandi a pulsanti, attese ${esito.attese.filter((a) => a.ok).length}/${esito.attese.length}; turno p50 ${esito.turnoJs.p50} ms, p95 ${esito.turnoJs.p95} ms`,
      );
      return esito;
    },
    [premi, scrivi],
  );

  // ---- le venature ------------------------------------------------------------
  const misuraVenature = useCallback(
    async (modo: string, atm: Atmosfera, secondi: number, opz: { cache?: boolean; densita?: number; crescita?: boolean } = {}): Promise<MisuraFotogrammi> => {
      const cv = canvasRef.current!;
      const dpr = devicePixelRatio || 1;
      const W = innerWidth;
      const H = innerHeight;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.display = "block";
      const g = cv.getContext("2d")!;
      const v = venatureRef.current;
      v.genera(W, H, zoneSchermata(W, H), opz.densita ?? 1);
      const intervalli: number[] = [];
      const disegno: number[] = [];
      let prima = await prossimoFotogramma();
      const inizio = prima;
      while (prima - inizio < secondi * 1000) {
        const ora = await prossimoFotogramma();
        intervalli.push(ora - prima);
        prima = ora;
        const d0 = performance.now();
        if (opz.cache) v.disegnaConCache(g, ora, atm, dpr);
        else v.disegna(g, ora, opz.crescita ? Math.min(1, (ora - inizio) / 5200) : 1, atm, dpr);
        disegno.push(performance.now() - d0);
      }
      const r: MisuraFotogrammi = {
        modo,
        secondi,
        fps: arrotonda(intervalli.length / ((prima - inizio) / 1000), 1),
        intervalli: riassumi(intervalli),
        oltre20: arrotonda(intervalli.filter((x) => x > 20).length / intervalli.length, 4),
        oltre34: arrotonda(intervalli.filter((x) => x > 34).length / intervalli.length, 4),
        disegno: riassumi(disegno),
        larghezza: W,
        altezza: H,
        dpr,
        vene: v.numero,
        punti: v.punti,
      };
      setFotogrammi((f) => [...f, r]);
      scrivi(`Venature ${modo}: ${r.fps} fps, intervallo p95 ${r.intervalli.p95} ms, disegno p95 ${r.disegno.p95} ms, ${r.vene} vene`);
      return r;
    },
    [scrivi],
  );

  const spegniVenature = () => {
    const cv = canvasRef.current;
    if (cv) cv.style.display = "none";
  };

  // ---- l'audio di Rust -------------------------------------------------------
  const misuraAudio = useCallback(async (): Promise<MisuraAudio> => {
    const ris: MisuraAudio = {};
    try {
      ris.avvio = await comando<AvvioAudio>("audio_avvia");
      scrivi(`Audio: ${ris.avvio.info.frequenza} Hz, avvio ${arrotonda(ris.avvio.info.avvio_ms)} ms, campione letto in ${arrotonda(ris.avvio.campione_ms)} ms`);
      await comando("audio_re", { acceso: true });
      await comando("audio_campione", { acceso: true, volumeDb: -14 });
      await attesa(2500);
      const rtt: number[] = [];
      const resa: number[] = [];
      for (let i = 0; i < 30; i++) {
        const t0 = performance.now();
        await comando("audio_segnale");
        rtt.push(performance.now() - t0);
        await attesa(180);
        const m = await comando<MisureAudio>("audio_misure");
        if (m.ultimo_segnale_ms != null) resa.push(m.ultimo_segnale_ms);
      }
      ris.ipcAndataRitorno = riassumi(rtt);
      ris.segnaleResa = riassumi(resa);
      scrivi(`Audio: andata e ritorno IPC p50 ${ris.ipcAndataRitorno.p50} ms; dal comando al primo blocco audio p50 ${ris.segnaleResa.p50} ms, max ${ris.segnaleResa.max} ms`);
      await comando("audio_azzera");
      await attesa(10000);
      ris.quiete = await comando<MisureAudio>("audio_misure");
      scrivi(`Audio in quiete (10 s): ${ris.quiete.blocchi} blocchi, intervallo max ${arrotonda(ris.quiete.gap_max_ms)} ms, CPU media ${arrotonda(ris.quiete.cpu_media * 100)}%`);
    } catch (e) {
      ris.errore = String(e);
      scrivi(`Audio: errore ${ris.errore}`);
    }
    setAudio({ ...ris });
    return ris;
  }, [scrivi]);

  const audioSottoCarico = useCallback(
    async (ris: MisuraAudio) => {
      if (ris.errore || !dentroTauri()) return ris;
      await comando("audio_azzera");
      // venature in fuga e una partita intera, insieme: il caso peggiore
      const venature = misuraVenature("sotto carico audio (fuga)", "fuga", 14);
      await giocaPercorso("vivi.txt", false);
      await venature;
      ris.sottoCarico = await comando<MisureAudio>("audio_misure");
      scrivi(`Audio sotto carico: intervallo max ${arrotonda(ris.sottoCarico.gap_max_ms)} ms, CPU max ${arrotonda(ris.sottoCarico.cpu_max * 100)}%, errori ${ris.sottoCarico.errori_flusso}`);
      setAudio({ ...ris });
      return ris;
    },
    [giocaPercorso, misuraVenature, scrivi],
  );

  // ---- la prova completa (o solo l'audio, con RELITTO_PROVA=audio) --------------
  const provaCompleta = useCallback(async (soloAudio = false) => {
    setOccupato(true);
    setFotogrammi([]);
    try {
      if (dentroTauri()) {
        await getCurrentWindow().setFullscreen(true);
        await attesa(1200);
      }
      const esitoPercorso = soloAudio ? null : await giocaPercorso("vivi.txt", false);
      let ris: MisuraAudio = {};
      if (dentroTauri()) ris = await misuraAudio();
      const misure: MisuraFotogrammi[] = [];
      if (!soloAudio) {
        misure.push(await misuraVenature("crescita (primo contatto)", "contatto", 8, { crescita: true }));
        misure.push(await misuraVenature("relitto", "relitto", 8));
        misure.push(await misuraVenature("fuga", "fuga", 8));
        misure.push(await misuraVenature("relitto, con la copia in memoria", "relitto", 8, { cache: true }));
        misure.push(await misuraVenature("sotto sforzo: tre volte le vene", "fuga", 8, { densita: 3 }));
      }
      ris = await audioSottoCarico(ris);
      spegniVenature();
      if (dentroTauri()) {
        await comando("audio_re", { acceso: false });
        await comando("audio_campione", { acceso: false, volumeDb: -14 });
      }
      const dati = {
        data: new Date().toISOString(),
        versione: VERSIONE,
        sistema,
        schermo: { larghezza: screen.width, altezza: screen.height, dpr: devicePixelRatio, finestra: [innerWidth, innerHeight] },
        agente: navigator.userAgent,
        finestraPronta,
        avvio: tempiAvvio,
        python: motoreRef.current ? { versione: motoreRef.current.versionePython, pyodide: motoreRef.current.versionePyodide } : null,
        compilazione: motoreRef.current?.compilazione,
        percorso: esitoPercorso,
        venature: misure,
        audio: ris,
        erroriJs: erroriJs.current,
      };
      const nome = `prova-fase1-${soloAudio ? "audio-" : ""}${sistema?.sistema ?? "browser"}-${Date.now()}.json`;
      if (dentroTauri()) {
        const dove = await comando<string>("scrivi_rapporto", { nome, contenuto: JSON.stringify(dati, null, 2) });
        setRapporto(dove);
        scrivi(`Rapporto scritto: ${dove}`);
        if (sistema?.prova === "esci" || sistema?.prova === "audio") await comando("esci", { codice: 0 });
        await getCurrentWindow().setFullscreen(false);
      } else {
        console.log(dati);
        scrivi("Rapporto nella console (fuori dall’app).");
      }
    } catch (e) {
      scrivi(`Prova completa interrotta: ${String(e)}`);
    } finally {
      setOccupato(false);
    }
  }, [audioSottoCarico, finestraPronta, giocaPercorso, misuraAudio, misuraVenature, scrivi, sistema, tempiAvvio]);

  // con RELITTO_PROVA impostata, la prova parte da sola appena il motore è pronto
  const partita = useRef(false);
  useEffect(() => {
    if (!partita.current && turno && sistema?.prova && ["completa", "esci", "audio"].includes(sistema.prova)) {
      partita.current = true;
      provaCompleta(sistema.prova === "audio");
    }
  }, [turno, sistema, provaCompleta]);

  // ---- la pagina ---------------------------------------------------------------
  const p = turno?.pulsanti;
  const qui = useMemo(() => p?.oggetti.filter((o) => !o.con_te) ?? [], [p]);
  const conTe = useMemo(() => p?.oggetti.filter((o) => o.con_te) ?? [], [p]);
  const verbi = useMemo(() => (p && selezionato ? verbiPer(p, selezionato) : []), [p, selezionato]);
  const soli = useMemo(() => p?.verbi.filter((v) => v.da_solo) ?? [], [p]);
  const s = turno?.stato;

  const Pulsante = ({ cmd, testo, classe = "" }: { cmd: string; testo: string; classe?: string }) => (
    <button className={`pulsante ${classe} ${acceso === cmd ? "acceso" : ""}`} disabled={occupato} onClick={() => premi(cmd)}>
      {testo}
    </button>
  );

  return (
    <div className="prova">
      <canvas ref={canvasRef} className="vene" aria-hidden="true" />
      <header>
        <b>Il Relitto Silente</b> · prova tecnica, fase 1 · gioco {VERSIONE.gioco} · motore FAVELLA {VERSIONE.motore} · {VERSIONE.commit}
        {sistema && (
          <span className="tenue">
            {" "}
            · {sistema.sistema} {sistema.architettura} · WebView {sistema.webview}
          </span>
        )}
      </header>
      {errore && <pre className="errore">{errore}</pre>}
      <main>
        <section className="colonna-testo" ref={testoRef} aria-live="polite">
          {!turno && <p className="tenue">{passo}</p>}
          {diario.map((v, i) => (
            <div key={i} className="voce">
              {v.comando && <div className="comando">› {v.comando}</div>}
              {v.eventi.map((e, j) => (
                <p key={j} className={`ev ev-${e.tipo}`}>
                  {e.testo}
                </p>
              ))}
            </div>
          ))}
        </section>
        <aside>
          <h2>Strumenti</h2>
          {s && (
            <dl className="strumenti">
              <dt>stanza</dt>
              <dd>{s.nome_stanza}</dd>
              <dt>aria</dt>
              <dd className={s.protezione ? "rosso" : ""}>{s.tuta ? s.aria : "—"}{s.protezione ? " · protezione vitale" : ""}</dd>
              <dt>matrice</dt>
              <dd>{s.traduzione}%</dd>
              <dt>echi · risonanze</dt>
              <dd>
                {s.echi} · {s.risonanze}
              </dd>
              <dt>chiavi · tracce</dt>
              <dd>
                {s.chiavi} · {s.tracce}
              </dd>
              <dt>fuga · turno</dt>
              <dd>
                {s.fuga} · {s.turno}
              </dd>
            </dl>
          )}
          <h2>Avvio</h2>
          {tempiAvvio ? (
            <dl className="misure">
              {finestraPronta != null && (
                <>
                  <dt>processo → pagina</dt>
                  <dd>{arrotonda(finestraPronta)} ms</dd>
                </>
              )}
              <dt>pyodide.js</dt>
              <dd>{arrotonda(tempiAvvio.script)} ms</dd>
              <dt>interprete</dt>
              <dd>{arrotonda(tempiAvvio.interprete)} ms</dd>
              <dt>lark</dt>
              <dd>{arrotonda(tempiAvvio.lark)} ms</dd>
              <dt>file</dt>
              <dd>{arrotonda(tempiAvvio.file)} ms</dd>
              <dt>import del motore</dt>
              <dd>{arrotonda(tempiAvvio.importazione)} ms</dd>
              <dt>compilazione</dt>
              <dd>{arrotonda(tempiAvvio.compilazione)} ms</dd>
              <dt>prima stanza</dt>
              <dd>{arrotonda(tempiAvvio.primoTurno)} ms</dd>
              <dt>totale</dt>
              <dd>
                <b>{arrotonda(tempiAvvio.totale)} ms</b>
              </dd>
            </dl>
          ) : (
            <p className="tenue">{passo}</p>
          )}
          <h2>Prove</h2>
          <div className="riga">
            <button disabled={occupato || !turno} onClick={async () => { setOccupato(true); await giocaPercorso("vivi.txt", true); setOccupato(false); }}>
              Gioca «Vivi» a pulsanti
            </button>
            <button disabled={occupato || !turno} onClick={async () => { setOccupato(true); await giocaPercorso("vivi.txt", false); setOccupato(false); }}>
              … veloce
            </button>
          </div>
          <div className="riga">
            <button disabled={occupato} onClick={async () => { setOccupato(true); await misuraVenature("relitto", "relitto", 6); setOccupato(false); }}>
              Venature
            </button>
            <button disabled={occupato} onClick={async () => { setOccupato(true); await misuraVenature("fuga", "fuga", 6); setOccupato(false); }}>
              … in fuga
            </button>
            <button disabled={occupato} onClick={spegniVenature}>Spegni</button>
          </div>
          <div className="riga">
            <button disabled={occupato || !dentroTauri()} onClick={async () => { setOccupato(true); await misuraAudio(); setOccupato(false); }}>
              Audio: re, campione, latenza
            </button>
          </div>
          <div className="riga">
            <button className="forte" disabled={occupato || !turno} onClick={() => provaCompleta()}>
              Prova completa e rapporto
            </button>
          </div>
          <ProvaSuono sistema={sistema} scrivi={scrivi} />
          {percorso && (
            <p className="esito">
              «{percorso.percorso}»: {percorso.giocati}/{percorso.comandi} a pulsanti ({percorso.modi.uguale} uguali, {percorso.modi.equivalente} equivalenti,{" "}
              {percorso.modi["stesso stato"]} solo stato); attese {percorso.attese.filter((a) => a.ok).length}/{percorso.attese.length}; turno p50{" "}
              {percorso.turnoJs.p50} ms, p95 {percorso.turnoJs.p95} ms, max {percorso.turnoJs.max} ms.
            </p>
          )}
          {fotogrammi.length > 0 && (
            <p className="esito">
              {fotogrammi.map((f) => `${f.modo}: ${f.fps} fps (p95 ${f.intervalli.p95} ms)`).join(" · ")}
            </p>
          )}
          {audio.segnaleResa && (
            <p className="esito">
              Audio: IPC p50 {audio.ipcAndataRitorno?.p50} ms; comando → blocco audio p50 {audio.segnaleResa.p50} ms (max {audio.segnaleResa.max}); media
              dei tempi {arrotonda(media([audio.segnaleResa.p50, audio.ipcAndataRitorno?.p50 ?? 0]))} ms.
            </p>
          )}
          {rapporto && <p className="esito">Rapporto: {rapporto}</p>}
          <div className="registro">
            {registro.map((r, i) => (
              <div key={i}>{r}</div>
            ))}
          </div>
        </aside>
      </main>
      {p && (
        <footer>
          {p.fase !== "gioco" ? (
            <div className="gruppo">
              <span className="etichetta">{p.fase}</span>
              {p.scelte.map((c) => (
                <Pulsante key={c.comando} cmd={c.comando} testo={c.etichetta} classe="scelta" />
              ))}
            </div>
          ) : (
            <>
              <div className="gruppo">
                <span className="etichetta">uscite</span>
                {p.uscite.map((u) => (
                  <Pulsante key={u.comando} cmd={u.comando} testo={u.stanza ? `${u.etichetta} · ${u.stanza}` : u.etichetta} classe="uscita" />
                ))}
                {soli.map((v) => (
                  <Pulsante key={v.verbo} cmd={v.verbo} testo={v.etichetta} classe="azione" />
                ))}
              </div>
              <div className="gruppo">
                <span className="etichetta">qui</span>
                {qui.map((o) => (
                  <button key={o.id} className={`pulsante cosa ${selezionato === o.id ? "scelto" : ""}`} disabled={occupato} onClick={() => setSelezionato(selezionato === o.id ? null : o.id)}>
                    {o.etichetta}
                  </button>
                ))}
                <span className="etichetta">con te</span>
                {conTe.map((o) => (
                  <button key={o.id} className={`pulsante cosa con-te ${selezionato === o.id ? "scelto" : ""}`} disabled={occupato} onClick={() => setSelezionato(selezionato === o.id ? null : o.id)}>
                    {o.etichetta}
                  </button>
                ))}
              </div>
              {selezionato && (
                <div className="gruppo verbi">
                  <span className="etichetta">verbi</span>
                  {verbi.map((v) => (
                    <Pulsante key={v.comando} cmd={v.comando} testo={v.etichetta} />
                  ))}
                </div>
              )}
              <div className="gruppo">
                <span className="etichetta">servizio</span>
                {p.servizio
                  .filter((c) => ["guarda", "inventario", "aspetta", "annulla"].includes(c.comando))
                  .map((c) => (
                    <Pulsante key={c.comando} cmd={c.comando} testo={c.etichetta} classe="servizio" />
                  ))}
              </div>
            </>
          )}
        </footer>
      )}
    </div>
  );
}
