// ============================================================================
//  L'app, dall'avvio alla partita (06-app-desktop.md, §4.6, §10, §18.3; gli
//  appunti dell'autore del 15 ottobre 2026).
//    all'avvio      lo schermo intero, nero; il motore comincia a caricarsi,
//                   dietro. Dopo un attimo i loghi di Runtime Multimedia e di
//                   FAVELLA 1 (loghi/, pari pari dal Viaggiatore; Esc li salta).
//                   Poi la dichiarazione su come è nato il gioco. I
//                   riconoscimenti non ci sono più (decisione dell'autore,
//                   19 ottobre 2026): sono i titoli di coda
//    il menu        Continua, Nuova partita, Carica, Opzioni, Registro dei
//                   finali, Riconoscimenti, Esci, sopra la scena finale
//                   dell'intro
//    Nuova partita  l'intro (Esc la salta), poi la plancia
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
import { attributiSchermo, useMovimentoRidotto, useOpzioni } from "./stile/opzioni";
import { comando, dentroTauri } from "./lib/tauri";
import { schermoIntero } from "./lib/finestra";
import { salvaUscendo } from "./gioco/uscita";
import { cercaAggiornamento, FINTO, FIRMA } from "./aggiornamenti";
import Aggiornamento from "./menu/Aggiornamento";
import type { Avanzamento } from "./menu/avanzamento";
import { avviaSuono, menuSuono, mixSuono, suonaTocco } from "./gioco/suono";
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
const Dichiarazione = lazy(() => import("./riconoscimenti/Dichiarazione"));

/** Il nero prima dei loghi: «avvii il gioco, va in fullscreen nero; dopo un secondo…»
 *  (la luce del primo logo arriva 0,6 secondi dopo che i loghi partono). */
const NERO = 400;

const VERSIONE = __VERSIONE__;

type Schermata =
  | { tipo: "nero" }
  | { tipo: "loghi" }
  | { tipo: "titoli" }
  | { tipo: "dichiarazione" }
  | { tipo: "menu" }
  | { tipo: "intro" }
  | { tipo: "gioco"; inizio: Inizio; chiave: number };

type PannelloMenu = null | "carica" | "opzioni" | "registro";

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
  const [avviso, mostraAvviso] = useAvviso();
  /** l'aggiornamento in corso: il pannello con la barra (menu/Aggiornamento.tsx) */
  const [aggiornamento, setAggiornamento] = useState<{ versione: string; avanzamento: Avanzamento; errore: string | null } | null>(null);
  const partite = useRef(0);

  // all'avvio: il nero, poi i loghi; il registro dei finali si legge
  useEffect(() => {
    const t = setTimeout(() => setSchermata((s) => (s.tipo === "nero" ? { tipo: "loghi" } : s)), NERO);
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

  const gioca = useCallback((inizio: Inizio) => {
    setPannello(null);
    setSchermata({ tipo: "gioco", inizio, chiave: ++partite.current });
  }, []);

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

  // dopo i loghi, la dichiarazione
  const dopoILoghi = useCallback(() => setSchermata({ tipo: "dichiarazione" }), []);

  // il motore comincia a caricarsi finiti i loghi (revisione 25, M1): l'importazione del ponte e la
  // compilazione sono chiamate sincrone di Pyodide, e durante i loghi li fermavano per quasi un
  // secondo. La dichiarazione è un testo fermo: regge l'attesa. Un attimo dopo, perché la sua
  // dissolvenza d'entrata cominci prima
  const versoIlMotore = schermata.tipo !== "nero" && schermata.tipo !== "loghi";
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

  // ---- il suono del menu (documento 21): un mondo sonoro suo, con la musica del menu e il
  // tocco dei pulsanti (l'intro e il gioco sfumano la musica: il gioco avvia un mondo suo;
  // i titoli suonano la loro nel mondo che trovano)
  const nelMenu = schermata.tipo === "menu";
  useEffect(() => {
    if (!nelMenu) return;
    avviaSuono(prova !== undefined);
    void menuSuono(true);
    return () => void menuSuono(false);
  }, [nelMenu, prova]);
  useEffect(() => {
    if (nelMenu && prova === undefined) void mixSuono(opzioni);
  }, [nelMenu, opzioni, prova]);

  // lo schermo intero: come dice l'opzione (l'app ci parte); F11 lo cambia, e l'opzione lo ricorda
  useEffect(() => {
    void schermoIntero(opzioni.schermoIntero);
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
          sotto: "Si scarica, si installa e il gioco si riapre. Una partita in corso si salva da sola nel posto automatico, e «Continua» la riprende.",
          si: "Aggiorna",
          no: "Più tardi",
          allora: () => {
            // il pannello con la barra, fino a quando il gioco si chiude per installare
            const v = e.versione;
            setAggiornamento({ versione: v, avanzamento: { fase: "prepara" }, errore: null });
            const avanza = (a: Avanzamento) => setAggiornamento((s) => (s && !s.errore ? { ...s, avanzamento: a } : s));
            void salvaUscendo()
              .then(() => e.installa(avanza))
              .catch((err) =>
                setAggiornamento((s) => ({
                  versione: v,
                  avanzamento: s?.avanzamento ?? { fase: "prepara" },
                  errore: FIRMA.test(String(err instanceof Error ? err.message : err))
                    ? "L’aggiornamento non porta la firma dell’autore: non lo installo."
                    : "L’aggiornamento non è andato a buon fine. Il gioco resta com’era.",
                })),
              );
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
  const cercatoAvvio = useRef(false);
  useEffect(() => {
    if (schermata.tipo !== "menu" || cercatoAvvio.current || !opzioni.cercaAggiornamenti || !(dentroTauri() || FINTO) || prova !== undefined) return;
    cercatoAvvio.current = true;
    void cercaNuova(false);
  }, [schermata.tipo, opzioni.cercaAggiornamenti, prova, cercaNuova]);

  // ---- le voci del menu ---------------------------------------------------------
  const salvato = daContinuare(posti);
  const voci: VoceMenu[] = [];
  if (inCorso) voci.push({ id: "continua", etichetta: "Continua", dettaglio: "la partita in corso", azione: () => gioca({ tipo: "riprendi" }) });
  else if (salvato) voci.push({ id: "continua", etichetta: "Continua", dettaglio: dettaglioDi(salvato), azione: () => gioca({ tipo: "carica", posto: salvato.posto }) });
  voci.push({
    id: "nuova",
    etichetta: "Nuova partita",
    azione: () => {
      const via = () => setSchermata({ tipo: "intro" });
      if (inCorso)
        setDomanda({ testo: "Cominciare una partita nuova?", sotto: "La partita in corso si perde, se non l’hai salvata.", si: "Comincia", no: "Lascia stare", allora: via });
      else via();
    },
  });
  if (posti?.some((p) => p.presente)) voci.push({ id: "carica", etichetta: "Carica", azione: () => setPannello("carica") });
  voci.push({ id: "opzioni", etichetta: "Opzioni", azione: () => setPannello("opzioni") });
  voci.push({ id: "registro", etichetta: "Registro dei finali", azione: () => setPannello("registro") });
  voci.push({ id: "riconoscimenti", etichetta: "Riconoscimenti", azione: () => setSchermata({ tipo: "titoli" }) });
  if (dentroTauri()) voci.push({ id: "aggiorna", etichetta: "Cerca aggiornamenti", azione: () => void cercaNuova(true) });
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
  if (schermata.tipo === "loghi")
    return (
      <Suspense fallback={<div className="nero-avvio" aria-hidden="true" />}>
        <Loghi onFine={dopoILoghi} />
      </Suspense>
    );
  if (schermata.tipo === "gioco")
    return (
      <Suspense fallback={null}>
        <Gioco key={schermata.chiave} prova={prova} inizio={schermata.inizio} alMenu={alMenu} alFinale={alFinale} aiTitoli={aiTitoli} />
      </Suspense>
    );
  if (schermata.tipo === "intro")
    return (
      <Suspense fallback={null}>
        <Intro ridotto={ridotto} onFine={() => gioca({ tipo: "nuova", seme: prova ? 1 : undefined })} />
      </Suspense>
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
              identita={`${VERSIONE.gioco} · ${VERSIONE.commit} · FAVELLA ${VERSIONE.motore}`}
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
            {domanda && <Conferma domanda={domanda} forma="membrana" chiudi={() => setDomanda(null)} />}
            {aggiornamento && (
              <Aggiornamento
                versione={aggiornamento.versione}
                avanzamento={aggiornamento.avanzamento}
                errore={aggiornamento.errore}
                chiudi={() => setAggiornamento(null)}
              />
            )}
          </>
        )}
        {schermata.tipo === "titoli" && (
          <Suspense fallback={null}>
            <Titoli ridotto={ridotto} onFine={() => setSchermata({ tipo: "menu" })} />
          </Suspense>
        )}
        {schermata.tipo === "dichiarazione" && (
          <Suspense fallback={null}>
            <Dichiarazione onFine={() => setSchermata({ tipo: "menu" })} />
          </Suspense>
        )}
        {avviso && <Avviso testo={avviso.testo} grave={avviso.grave} />}
      </main>
    </div>
  );
}
