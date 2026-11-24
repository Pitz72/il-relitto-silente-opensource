// ============================================================================
//  L'app, dall'avvio alla partita (06-app-desktop.md, §4.6, §10, §18.3; gli
//  appunti dell'autore del 15 ottobre 2026).
//    all'avvio      lo schermo intero, nero; il motore comincia a caricarsi,
//                   dietro. Dopo un attimo il cartello fermo: una produzione
//                   Runtime Multimedia, realizzato con Favella1, con i due
//                   marchi (loghi/Cartello.tsx; l'autore, 16 novembre 2026:
//                   i loghi animati passano soltanto prima dell'intro; Esc lo
//                   salta). Poi la dichiarazione su come è nato il gioco. I
//                   riconoscimenti non ci sono più (decisione dell'autore,
//                   19 ottobre 2026): sono i titoli di coda
//    il menu        Continua, Nuova partita, Carica, Opzioni, Registro dei
//                   finali, Riconoscimenti, Esci, sopra la scena finale
//                   dell'intro
//    Nuova partita  i loghi animati e l'intro (Esc li salta), poi la plancia
//    il gioco       dalla pausa si torna al menu: la partita resta nel motore,
//                   e Continua la riprende
//    i titoli       dopo un finale («Titoli di coda») o da «Riconoscimenti»
//                   nel menu: scorrono con la loro musica, poi il menu
//  I finali raggiunti si scrivono nel registro dei finali, su disco.
//  RELITTO_PROVA=finali (o ?prova=finali nel browser): la prova dei sei finali
//  attraverso l'interfaccia (prova/finali.ts), con il seme 1; alla fine il
//  rapporto, e nell'eseguibile si esce.
// ============================================================================
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { avviaMotore, MOTORE_FALLITO, usaPassoMotore } from "./motore/condiviso";
import { tavolozza, variabiliCss } from "./stile/atmosfere";
import { attributiSchermo, opzioniRicordate, qualitaDi, useMovimentoRidotto, useOpzioni } from "./stile/opzioni";
import { comando, dentroTauri } from "./lib/tauri";
import { ricordaSchermoIntero, schermoIntero } from "./lib/finestra";
import { salvaUscendo } from "./gioco/uscita";
import { ANNULLATO, cercaAggiornamento, FERMO, FINTO, FIRMA, type Segnale } from "./aggiornamenti";
import { DEMO } from "./demo";
import Aggiornamento from "./menu/Aggiornamento";
import FinestraNovita from "./menu/FinestraNovita";
import { daMostrare, leggiVista, ricordaVista, righeDalleNote, type Novita as NovitaVersione } from "./menu/novita";
import type { Avanzamento } from "./menu/avanzamento";
import { avviaSuono, menuSuono, mixSuono, suonaTocco, suonoVivo } from "./gioco/suono";
import { gestoDelClic } from "./gioco/tocco";
import { archivio, type Posto } from "./gioco/salvataggi";
import type { Inizio } from "./gioco/Gioco";
import { Avviso, Conferma, PannelloOpzioni, Salvataggi, useAvviso, type Domanda } from "./gioco/pannelli/Pannelli";
import Menu, { type VoceMenu } from "./menu/Menu";
import RegistroFinali from "./menu/RegistroFinali";
import { daContinuare, dettaglioDi } from "./menu/continua";
import { conFinale, type VoceRegistro } from "./menu/registro";
import { leggiRegistro, scriviRegistro } from "./menu/registroSuDisco";
import "./stile/base.css";
import "./menu/menu.css";
import "./loghi/caratteri.css";

const Gioco = lazy(() => import("./gioco/Gioco"));
const Intro = lazy(() => import("./intro/Intro"));
const Titoli = lazy(() => import("./riconoscimenti/Titoli"));
const Loghi = lazy(() => import("./loghi/Loghi"));
const Cartello = lazy(() => import("./loghi/Cartello"));
const Dichiarazione = lazy(() => import("./riconoscimenti/Dichiarazione"));
const FineDemo = lazy(() => import("./riconoscimenti/FineDemo"));

/** Il nero prima del cartello: «avvii il gioco, va in fullscreen nero; dopo un secondo…» */
const NERO = 400;
/** I loghi prima dell'intro aspettano che l'intro sia pronta (vedi sotto), ma non più di così (ms). */
const ATTESA_INTRO = 8000;

const VERSIONE = __VERSIONE__;
const NOVITA = __NOVITA__;
/** Lo sviluppo, con ?novita: la finestra delle novità con le righe della prossima versione. */
const PROVA_NOVITA = import.meta.env.DEV && new URLSearchParams(location.search).has("novita");
/** Lo sviluppo, con ?nuova: dritti all'intro di una partita nuova (con &da=150, da quel secondo), per
 *  provare la fine dell'intro, che si apre sul gioco. */
const PROVA_NUOVA = import.meta.env.DEV && new URLSearchParams(location.search).has("nuova");

type Schermata =
  | { tipo: "nero" }
  | { tipo: "cartello" }
  | { tipo: "titoli" }
  | { tipo: "finedemo" }
  | { tipo: "avvisodemo" }
  | { tipo: "dichiarazione" }
  | { tipo: "menu" }
  | { tipo: "intro" }
  | { tipo: "gioco"; inizio: Inizio; chiave: number };

type PannelloMenu = null | "carica" | "opzioni" | "registro" | "novita";

/** Il clima del menu, della dichiarazione e dei titoli: il relitto, nella membrana. */
const STILE = variabiliCss(tavolozza({ atmosfera: "relitto", forma: "membrana", stanza: null, protezione: false, ipossia: false }), null) as CSSProperties;

export default function Relitto({ prova }: { prova?: "finali" } = {}) {
  const [opzioni, cambiaOpzioni] = useOpzioni();
  const ridotto = useMovimentoRidotto(opzioni.movimento);
  const passo = usaPassoMotore();
  const [schermata, setSchermata] = useState<Schermata>({ tipo: "nero" });
  /** c'è una partita nel motore, non finita: Continua la riprende */
  const [inCorso, setInCorso] = useState(false);
  const [registro, setRegistro] = useState<VoceRegistro[]>([]);
  const registroRef = useRef<VoceRegistro[]>([]);
  const [posti, setPosti] = useState<Posto[] | null>(null);
  const [dove, setDove] = useState("");
  const [pannello, setPannello] = useState<PannelloMenu>(null);
  const [domanda, setDomanda] = useState<Domanda | null>(null);
  const [avviso, mostraAvviso, chiudiAvviso] = useAvviso();
  /** l'aggiornamento in corso: il pannello con la barra (menu/Aggiornamento.tsx) */
  const [aggiornamento, setAggiornamento] = useState<{ versione: string; avanzamento: Avanzamento; errore: string | null } | null>(null);
  /** l'«Annulla» dello scaricamento in corso (revisione 37, M2) */
  const segnaleAggiornamento = useRef<Segnale | null>(null);
  /** le novità da mostrare (menu/FinestraNovita.tsx), e se si è già deciso, in questo avvio */
  const [novita, setNovita] = useState<NovitaVersione[]>([]);
  const [novitaDecise, setNovitaDecise] = useState(false);
  const partite = useRef(0);

  // all'avvio: il nero, poi il cartello; il registro dei finali si legge
  useEffect(() => {
    const t = setTimeout(() => setSchermata((s) => (s.tipo === "nero" ? (PROVA_NUOVA ? { tipo: "intro" } : DEMO ? { tipo: "avvisodemo" } : { tipo: "cartello" }) : s)), NERO);
    if (PROVA_NUOVA) void avviaMotore().catch(() => undefined);
    void leggiRegistro().then((r) => {
      registroRef.current = r;
      setRegistro(r);
    });
    return () => clearTimeout(t);
  }, []);

  const leggiPosti = useCallback(async () => {
    try {
      const a = archivio();
      setDove(await a.dove());
      setPosti(await a.elenco());
    } catch (e) {
      setPosti([]);
      setDove(String(e instanceof Error ? e.message : e));
    }
  }, []);
  useEffect(() => {
    if (schermata.tipo === "menu") void leggiPosti();
  }, [schermata.tipo, leggiPosti]);

  // ---- le novità dopo un aggiornamento (nota dell'autore del 19 ottobre 2026; menu/novita.ts): al
  // primo arrivo al menu con una versione diversa dall'ultima vista. Si decide quando i salvataggi
  // sono letti: con il registro dei finali e le opzioni dicono se qui si era già giocato. Le prove
  // non le vedono e non le ricordano
  useEffect(() => {
    if (schermata.tipo !== "menu" || novitaDecise || posti === null) return;
    setNovitaDecise(true);
    if (prova !== undefined || DEMO) return;
    if (PROVA_NOVITA) {
      setNovita([{ versione: "non ancora rilasciata", data: "", righe: NOVITA.prossima }]);
      setPannello("novita");
      return;
    }
    const tracce = registroRef.current.length > 0 || posti.some((p) => p.presente) || opzioniRicordate();
    const { mostra, ricorda } = daMostrare(NOVITA.elenco, leggiVista(), VERSIONE.gioco, tracce);
    if (ricorda) ricordaVista(VERSIONE.gioco);
    if (mostra.length) {
      setNovita(mostra);
      setPannello("novita");
    }
  }, [schermata.tipo, novitaDecise, posti, prova]);

  const gioca = useCallback((inizio: Inizio) => {
    setPannello(null);
    setSchermata({ tipo: "gioco", inizio, chiave: ++partite.current });
  }, []);

  // la fine dell'intro (09-intro-storyboard.md, H): la partita parte sotto l'intro, che resta sopra
  // finché la plancia non è andata nella lente del gioco, e poi si apre su di lui. Saltata prima, la
  // partita parte quando l'intro se ne va
  const [introSopra, setIntroSopra] = useState(false);
  // i loghi passano di nuovo subito prima dell'intro: sono l'inizio della cinematica d'apertura (documento
  // 09, §16; l'autore, 14 novembre 2026). L'intro è già montata sotto, ferma, e parte quando finiscono
  const [loghiPrima, setLoghiPrima] = useState(false);
  const finitiILoghi = useCallback(() => setLoghiPrima(false), []);
  // e partono quando l'intro è pronta: la sua preparazione (la nave e i cieli nella scheda video, Intro.tsx) tiene
  // fermo il disegno per qualche secondo, e il logo di Runtime restava nero mentre il suo suono andava avanti
  // (l'autore, 16 novembre 2026: «si sente l'audio ma parte in nero e il logo non appare fino a che l'animazione
  // non è finita»). Prima, qualche istante di nero
  const [introPronta, setIntroPronta] = useState(false);
  const pronteLeImmagini = useCallback(() => setIntroPronta(true), []);
  // e quando il motore del gioco ha finito di caricarsi: i suoi due blocchi (più di mezzo secondo l'uno, misurati
  // in ottobre) cadevano sui loghi o sull'inizio dell'intro, se si sceglieva «Nuova partita» subito dopo la
  // dichiarazione (revisione 37, M7). Nell'uno e nell'altro caso, non oltre ATTESA_INTRO
  const [attesaFinita, setAttesaFinita] = useState(false);
  const motorePronto = passo === "pronto" || passo === MOTORE_FALLITO;
  useEffect(() => {
    if (!loghiPrima) return;
    setAttesaFinita(false);
    const t = setTimeout(() => {
      setIntroPronta(true);
      setAttesaFinita(true);
    }, ATTESA_INTRO);
    return () => clearTimeout(t);
  }, [loghiPrima]);
  const partitaSotto = useRef(false);
  const partitaDallIntro = useCallback(() => {
    if (partitaSotto.current) return;
    partitaSotto.current = true;
    setIntroSopra(true);
    gioca({ tipo: "nuova", seme: prova ? 1 : undefined });
  }, [gioca, prova]);
  const fineIntro = useCallback(() => {
    if (!partitaSotto.current) gioca({ tipo: "nuova", seme: prova ? 1 : undefined });
    partitaSotto.current = false;
    setIntroSopra(false);
  }, [gioca, prova]);

  const alMenu = useCallback(
    (esito: string, messaggio?: string) => {
      if (esito !== "invariata") setInCorso(esito === "in_corso");
      setSchermata({ tipo: "menu" });
      if (messaggio) mostraAvviso(messaggio, true);
    },
    [mostraAvviso],
  );

  const alFinale = useCallback((finale: string, riga: string | null) => {
    const nuovo = conFinale(registroRef.current, finale, riga, new Date().toISOString());
    if (nuovo.length === registroRef.current.length) return;
    registroRef.current = nuovo;
    setRegistro(nuovo);
    void scriviRegistro(nuovo).catch(() => undefined);
  }, []);

  // dopo il cartello, la dichiarazione
  const dopoIlCartello = useCallback(() => setSchermata({ tipo: "dichiarazione" }), []);

  // il motore comincia a caricarsi finito il cartello (revisione 25, M1): l'importazione del ponte e la
  // compilazione sono chiamate sincrone di Pyodide, e fermavano per quasi un secondo i loghi che stavano qui
  // (e fermerebbero le dissolvenze del cartello). La dichiarazione è un testo fermo: regge l'attesa. Un attimo
  // dopo, perché la sua dissolvenza d'entrata cominci prima
  const versoIlMotore = schermata.tipo !== "nero" && schermata.tipo !== "cartello";
  useEffect(() => {
    if (!versoIlMotore) return;
    const t = setTimeout(() => void avviaMotore().catch(() => undefined), 300);
    return () => clearTimeout(t);
  }, [versoIlMotore]);

  // i titoli di coda: dopo un finale la partita è finita, e Continua non la riprende
  const aiTitoli = useCallback(() => {
    setInCorso(false);
    setSchermata({ tipo: "titoli" });
  }, []);

  // la demo dell'atto I (demo.ts): finita, la partita non si riprende; dalla lastra si va ai titoli
  const alFineDemo = useCallback(() => {
    setInCorso(false);
    setSchermata({ tipo: "finedemo" });
  }, []);

  // ---- il suono del menu (documento 21): un mondo sonoro suo, con la musica del menu e il
  // tocco dei pulsanti (l'intro e il gioco sfumano la musica: il gioco avvia un mondo suo;
  // i titoli suonano la loro nel mondo che trovano)
  const nelMenu = schermata.tipo === "menu";
  /** il motore audio suona davvero (c'è un dispositivo): se no, nell'intro le parole delle voci compaiono scritte */
  const [audioVivo, setAudioVivo] = useState(true);
  useEffect(() => {
    if (!nelMenu) return;
    avviaSuono(prova !== undefined);
    void menuSuono(true);
    let vivo = true;
    void suonoVivo().then((v) => vivo && setAudioVivo(v));
    return () => {
      vivo = false;
      void menuSuono(false);
    };
  }, [nelMenu, prova]);
  useEffect(() => {
    if (nelMenu && prova === undefined) void mixSuono(opzioni);
  }, [nelMenu, opzioni, prova]);

  // lo schermo intero: come dice l'opzione (l'app ci parte); F11 lo cambia, e l'opzione lo ricorda,
  // anche al processo Tauri, perché la finestra nasca così al prossimo avvio (revisione 25, L8)
  useEffect(() => {
    void schermoIntero(opzioni.schermoIntero);
    void ricordaSchermoIntero(opzioni.schermoIntero);
  }, [opzioni.schermoIntero]);
  useEffect(() => {
    if (schermata.tipo === "gioco") return; // nel gioco F11 lo tiene Gioco.tsx
    const tasto = (e: KeyboardEvent) => {
      if (e.key !== "F11") return;
      e.preventDefault();
      void schermoIntero().then((v) => cambiaOpzioni({ schermoIntero: v }));
    };
    addEventListener("keydown", tasto);
    return () => removeEventListener("keydown", tasto);
  }, [schermata.tipo, cambiaOpzioni]);

  // la prova dei finali: la guida il pilota, dal DOM, come chi gioca con il mouse
  // (uno solo: nello sviluppo React esegue gli effetti due volte)
  const pilota = useRef(false);
  useEffect(() => {
    if (prova !== "finali" || pilota.current) return;
    pilota.current = true;
    (async () => {
      const { provaDeiFinali } = await import("./prova/finali");
      const r = await provaDeiFinali();
      const rapporto = { data: new Date().toISOString(), versione: VERSIONE, ...r };
      console.info("[prova dei finali]", rapporto);
      (window as unknown as Record<string, unknown>).__rapportoFinali = rapporto;
      if (!dentroTauri()) return;
      await comando("scrivi_rapporto", { nome: `prova-finali-${Date.now()}.json`, contenuto: JSON.stringify(rapporto, null, 2) });
      await comando("esci", { codice: r.ok ? 0 : 1 });
    })();
  }, [prova]);

  // ---- uscire senza perdere niente (revisione 25, M6): chiudendo la finestra (la X, Alt+F4) la
  // partita in corso va nel posto automatico, e Continua la riprende. Le prove non salvano.
  useEffect(() => {
    if (!dentroTauri() || prova !== undefined) return;
    let via: (() => void) | null = null;
    let vivo = true;
    void import("@tauri-apps/api/window").then(({ getCurrentWindow }) =>
      getCurrentWindow()
        .onCloseRequested(async () => {
          await salvaUscendo();
        })
        .then((u) => (vivo ? (via = u) : u())),
    );
    return () => {
      vivo = false;
      via?.();
    };
  }, [prova]);

  // ---- l'aggiornamento: all'avvio in silenzio (se l'opzione lo vuole), dal menu a mano ----
  const cercaNuova = useCallback(
    async (aMano: boolean) => {
      if (aMano) mostraAvviso("Cerco una versione nuova…");
      const e = await cercaAggiornamento();
      if (e.tipo === "nuova") {
        setDomanda({
          testo: `È uscita la versione ${e.versione}.`,
          // le sue novità, dal corpo della release (le righe «Per chi gioca»; revisione 25, L15)
          righe: righeDalleNote(e.note),
          daSolo: !aMano,
          sotto: "Si scarica, si installa e il gioco si riapre. Una partita in corso si salva da sola nel posto automatico, e «Continua» la riprende.",
          si: "Aggiorna",
          no: "Più tardi",
          allora: () => {
            // il pannello con la barra, fino a quando il gioco si chiude per installare
            const v = e.versione;
            setAggiornamento({ versione: v, avanzamento: { fase: "prepara" }, errore: null });
            const avanza = (a: Avanzamento) => setAggiornamento((s) => (s && !s.errore ? { ...s, avanzamento: a } : s));
            const segnale: Segnale = { annullato: false };
            segnaleAggiornamento.current = segnale;
            void salvaUscendo()
              .then(() => e.installa(avanza, segnale))
              .catch((err) => {
                const testo = String(err instanceof Error ? err.message : err);
                // annullato da chi gioca: il pannello è già chiuso, e non c'è niente da dire di più
                if (testo === ANNULLATO) return;
                setAggiornamento((s) => ({
                  versione: v,
                  avanzamento: s?.avanzamento ?? { fase: "prepara" },
                  errore: FIRMA.test(testo)
                    ? "L’aggiornamento non porta la firma dell’autore: non lo installo."
                    : testo === FERMO
                      ? "Lo scaricamento si è fermato: la rete non risponde. Il gioco resta com’era; puoi riprovare più tardi, da «Cerca aggiornamenti»."
                      : "L’aggiornamento non è andato a buon fine. Il gioco resta com’era.",
                }));
              });
          },
        });
      } else if (aMano) {
        mostraAvviso(
          e.tipo === "aggiornato"
            ? "Il gioco è aggiornato."
            : e.tipo === "nessuna"
              ? "Non c’è ancora una versione da scaricare."
              : "Non riesco a controllare: serve la rete.",
          e.tipo === "errore",
        );
      }
    },
    [mostraAvviso],
  );
  // (dopo le novità: prima si legge che cosa è arrivato, poi si sente se c'è altro)
  const cercatoAvvio = useRef(false);
  useEffect(() => {
    if (schermata.tipo !== "menu" || cercatoAvvio.current || !opzioni.cercaAggiornamenti || !(dentroTauri() || FINTO) || prova !== undefined || DEMO) return;
    if (!novitaDecise || pannello === "novita") return;
    cercatoAvvio.current = true;
    void cercaNuova(false);
  }, [schermata.tipo, opzioni.cercaAggiornamenti, prova, cercaNuova, novitaDecise, pannello]);

  // ---- le voci del menu ---------------------------------------------------------
  const salvato = daContinuare(posti);
  const voci: VoceMenu[] = [];
  if (inCorso && !DEMO) voci.push({ id: "continua", etichetta: "Continua", dettaglio: "la partita in corso", azione: () => gioca({ tipo: "riprendi" }) });
  else if (salvato && !DEMO) voci.push({ id: "continua", etichetta: "Continua", dettaglio: dettaglioDi(salvato), azione: () => gioca({ tipo: "carica", posto: salvato.posto }) });
  voci.push({
    id: "nuova",
    etichetta: DEMO ? "Gioca" : "Nuova partita",
    azione: () => {
      const via = () => {
        setIntroPronta(false);
        setLoghiPrima(true);
        setSchermata({ tipo: "intro" });
      };
      if (inCorso)
        setDomanda({ testo: "Cominciare una partita nuova?", sotto: "La partita in corso si perde, se non l’hai salvata.", si: "Comincia", no: "Lascia stare", allora: via });
      else via();
    },
  });
  if (!DEMO) {
    if (posti?.some((p) => p.presente)) voci.push({ id: "carica", etichetta: "Carica", azione: () => setPannello("carica") });
    voci.push({ id: "opzioni", etichetta: "Opzioni", azione: () => setPannello("opzioni") });
    voci.push({ id: "registro", etichetta: "Registro dei finali", azione: () => setPannello("registro") });
    voci.push({ id: "riconoscimenti", etichetta: "Riconoscimenti", azione: () => setSchermata({ tipo: "titoli" }) });
    if (dentroTauri()) voci.push({ id: "aggiorna", etichetta: "Cerca aggiornamenti", azione: () => void cercaNuova(true) });
  } else {
    // la demo (documento 42), l'autore: «il menu deve avere solo gioca, vai al sito, esci»
    voci.push({ id: "sito", etichetta: "Vai al sito", dettaglio: "thesantamaria.it", azione: () => void comando("apri_sito").catch(() => mostraAvviso("Il sito non si apre: thesantamaria.it", true)) });
  }
  // uscendo, la partita in corso va nel posto automatico (M6): niente da confermare, Continua la riprende
  if (dentroTauri()) voci.push({ id: "esci", etichetta: "Esci", azione: () => void salvaUscendo().then(() => comando("esci", { codice: 0 })) });

  // Esc chiude il pannello aperto sopra il menu
  useEffect(() => {
    if (schermata.tipo !== "menu" || !pannello || domanda) return;
    const tasto = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setPannello(null);
    };
    addEventListener("keydown", tasto);
    return () => removeEventListener("keydown", tasto);
  }, [schermata.tipo, pannello, domanda]);

  // ---- le schermate -------------------------------------------------------------
  if (schermata.tipo === "nero") return <div className="nero-avvio" aria-hidden="true" />;
  if (schermata.tipo === "cartello")
    return (
      <Suspense fallback={<div className="nero-avvio" aria-hidden="true" />}>
        <Cartello onFine={dopoIlCartello} />
      </Suspense>
    );
  // il gioco, e l'intro: alla fine dell'intro stanno insieme, l'intro sopra (la stessa posizione nell'albero,
  // perché l'intro non riparta quando sotto arriva il gioco)
  if (schermata.tipo === "gioco" || schermata.tipo === "intro")
    return (
      <>
        {schermata.tipo === "gioco" ? (
          <Suspense key="gioco" fallback={null}>
            <Gioco key={schermata.chiave} prova={prova} inizio={schermata.inizio} alMenu={alMenu} alFinale={alFinale} aiTitoli={aiTitoli} alFineDemo={alFineDemo} coperto={introSopra} />
          </Suspense>
        ) : null}
        {schermata.tipo === "intro" || introSopra ? (
          <Suspense key="intro" fallback={null}>
            <Intro
              ridotto={ridotto}
              grana={opzioni.grana}
              pellicola={opzioni.pellicola}
              attesa={loghiPrima && schermata.tipo === "intro"}
              onPronta={pronteLeImmagini}
              // le voci si sentono, e nessuno ha chiesto i sottotitoli: allora le loro parole non compaiono scritte
              // (l'autore, 30 ottobre 2026). Senza suono, o con «Sottotitoli della cinematica», compaiono (M8)
              voce={dentroTauri() && audioVivo && opzioni.volume > 0 && opzioni.volumeParlato > 0 && !opzioni.sottotitoli}
              sottotitoli={opzioni.sottotitoli || (dentroTauri() && (!audioVivo || opzioni.volume <= 0))}
              leggera={(() => {
                const q = qualitaDi(opzioni);
                return q === "leggera" || q === "essenziale";
              })()}
              carattere={opzioni.carattere}
              testoGrande={opzioni.testoGrande}
              onPartita={partitaDallIntro}
              onFine={fineIntro}
            />
          </Suspense>
        ) : null}
        {schermata.tipo === "intro" && loghiPrima ? (
          <Suspense key="loghi-intro" fallback={<div className="nero-avvio" aria-hidden="true" />}>
            <Loghi onFine={finitiILoghi} grana={opzioni.grana} pellicola={opzioni.pellicola} parti={introPronta && (motorePronto || attesaFinita)} ridotto={ridotto} volume={opzioni.volume} />
          </Suspense>
        ) : null}
      </>
    );

  const caricamento = passo === "pronto" || passo === MOTORE_FALLITO ? null : passo.replace(/…$/, "").toLowerCase() + "…";
  return (
    <div
      className="schermo tema relitto-app"
      style={STILE}
      data-forma="membrana"
      {...attributiSchermo(opzioni, ridotto)}
      onClickCapture={(e) => {
        // il tocco sul pulsante, anche nel menu (bibbia sonora, §5.8): tutto membrana
        const g = gestoDelClic(e.target);
        if (g) void suonaTocco(g);
      }}
    >
      <main className="palco-app">
        {schermata.tipo === "menu" && (
          <>
            <Menu
              voci={voci}
              ridotto={ridotto}
              identita={`${DEMO ? "Demo dell’atto I · " : ""}${VERSIONE.gioco} · ${VERSIONE.commit} · Favella1 ${VERSIONE.motore}`}
              caricamento={caricamento}
              problema={passo === MOTORE_FALLITO ? "Il motore del gioco non è partito." : null}
              coperto={!!pannello || !!domanda || !!aggiornamento}
            />
            {pannello === "carica" && (
              <Salvataggi
                modo="carica"
                forma="membrana"
                posti={posti}
                dove={dove}
                chiudi={() => setPannello(null)}
                scegli={(p) => {
                  const via = () => gioca({ tipo: "carica", posto: p.posto });
                  if (inCorso) setDomanda({ testo: `Caricare il posto ${p.posto}?`, sotto: "La partita in corso si perde, se non l’hai salvata.", si: "Carica", no: "Lascia stare", allora: via });
                  else via();
                }}
              />
            )}
            {pannello === "opzioni" && <PannelloOpzioni forma="membrana" opzioni={opzioni} cambia={cambiaOpzioni} chiudi={() => setPannello(null)} />}
            {pannello === "registro" && <RegistroFinali registro={registro} chiudi={() => setPannello(null)} />}
            {pannello === "novita" && <FinestraNovita versioni={novita} chiudi={() => setPannello(null)} />}
            {domanda && <Conferma domanda={domanda} forma="membrana" chiudi={() => setDomanda(null)} />}
            {aggiornamento && (
              <Aggiornamento
                versione={aggiornamento.versione}
                avanzamento={aggiornamento.avanzamento}
                errore={aggiornamento.errore}
                chiudi={() => setAggiornamento(null)}
                annulla={() => {
                  if (segnaleAggiornamento.current) segnaleAggiornamento.current.annullato = true;
                  setAggiornamento(null);
                  mostraAvviso("Aggiornamento annullato: il gioco resta com’era.");
                }}
              />
            )}
          </>
        )}
        {schermata.tipo === "titoli" && (
          <Suspense fallback={null}>
            <Titoli ridotto={ridotto} onFine={() => setSchermata({ tipo: "menu" })} />
          </Suspense>
        )}
        {schermata.tipo === "avvisodemo" && (
          <Suspense fallback={null}>
            <FineDemo quando="avvio" onFine={() => setSchermata({ tipo: "cartello" })} />
          </Suspense>
        )}
        {schermata.tipo === "finedemo" && (
          <Suspense fallback={null}>
            <FineDemo quando="fine" onFine={() => setSchermata({ tipo: "menu" })} />
          </Suspense>
        )}
        {schermata.tipo === "dichiarazione" && (
          <Suspense fallback={null}>
            <Dichiarazione onFine={() => setSchermata({ tipo: "menu" })} />
          </Suspense>
        )}
        {avviso && <Avviso testo={avviso.testo} grave={avviso.grave} chiudi={avviso.resta ? chiudiAvviso : undefined} />}
      </main>
    </div>
  );
}
