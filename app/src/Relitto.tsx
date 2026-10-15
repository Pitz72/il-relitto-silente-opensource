// ============================================================================
//  L'app, dall'avvio alla partita (06-app-desktop.md, §4.6, §10, §18.3).
//    all'avvio      il motore comincia a caricarsi, dietro; al primo avvio, e
//                   dopo un aggiornamento che aggiunge nomi, i riconoscimenti
//                   e le licenze (si va avanti dopo tre secondi)
//    il menu        Continua, Nuova partita, Carica, Opzioni, Registro dei
//                   finali, Riconoscimenti, Esci, sopra la scena finale
//                   dell'intro
//    Nuova partita  l'intro (Esc la salta), poi la plancia
//    il gioco       dalla pausa si torna al menu: la partita resta nel motore,
//                   e Continua la riprende
//  I finali raggiunti si scrivono nel registro dei finali, su disco.
// ============================================================================
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { avviaMotore, usaPassoMotore } from "./motore/condiviso";
import { tavolozza, variabiliCss } from "./stile/atmosfere";
import { attributiSchermo, useMovimentoRidotto, useOpzioni } from "./stile/opzioni";
import { comando, dentroTauri } from "./lib/tauri";
import { archivio, type Posto } from "./gioco/salvataggi";
import type { Inizio } from "./gioco/Gioco";
import { Avviso, Conferma, PannelloOpzioni, Salvataggi, useAvviso, type Domanda } from "./gioco/pannelli/Pannelli";
import Menu, { type VoceMenu } from "./menu/Menu";
import RegistroFinali from "./menu/RegistroFinali";
import { daContinuare, dettaglioDi } from "./menu/continua";
import { conFinale, type VoceRegistro } from "./menu/registro";
import { leggiRegistro, scriviRegistro } from "./menu/registroSuDisco";
import { ciSonoNomiNuovi, nomi, nomiVisti, segnaVisti, type Elenco } from "./riconoscimenti/visti";
import elencoJson from "./riconoscimenti/elenco.json";
import "./stile/base.css";
import "./menu/menu.css";

const Gioco = lazy(() => import("./gioco/Gioco"));
const Intro = lazy(() => import("./intro/Intro"));
const Riconoscimenti = lazy(() => import("./riconoscimenti/Riconoscimenti"));

const ELENCO = elencoJson as unknown as Elenco;
const VERSIONE = __VERSIONE__;

type Schermata =
  | { tipo: "riconoscimenti"; primoAvvio: boolean }
  | { tipo: "menu" }
  | { tipo: "intro" }
  | { tipo: "gioco"; inizio: Inizio; chiave: number };

type PannelloMenu = null | "carica" | "opzioni" | "registro";

/** Il clima del menu e dei riconoscimenti: il relitto, nella membrana. */
const STILE = variabiliCss(tavolozza({ atmosfera: "relitto", forma: "membrana", stanza: null, protezione: false, ipossia: false }), null) as CSSProperties;

export default function Relitto() {
  const [opzioni, cambiaOpzioni] = useOpzioni();
  const ridotto = useMovimentoRidotto(opzioni.movimento);
  const passo = usaPassoMotore();
  const nomiAttuali = useMemo(() => nomi(ELENCO), []);
  const [schermata, setSchermata] = useState<Schermata>(() =>
    ciSonoNomiNuovi(nomiAttuali, nomiVisti()) ? { tipo: "riconoscimenti", primoAvvio: true } : { tipo: "menu" },
  );
  /** c'è una partita nel motore, non finita: Continua la riprende */
  const [inCorso, setInCorso] = useState(false);
  const [registro, setRegistro] = useState<VoceRegistro[]>([]);
  const registroRef = useRef<VoceRegistro[]>([]);
  const [posti, setPosti] = useState<Posto[] | null>(null);
  const [dove, setDove] = useState("");
  const [pannello, setPannello] = useState<PannelloMenu>(null);
  const [domanda, setDomanda] = useState<Domanda | null>(null);
  const [avviso, mostraAvviso] = useAvviso();
  const partite = useRef(0);

  // all'avvio: il motore comincia a caricarsi, e il registro dei finali si legge
  useEffect(() => {
    void avviaMotore().catch(() => undefined);
    void leggiRegistro().then((r) => {
      registroRef.current = r;
      setRegistro(r);
    });
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

  const dopoIRiconoscimenti = useCallback(() => {
    segnaVisti(nomiAttuali);
    setSchermata({ tipo: "menu" });
  }, [nomiAttuali]);

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
  voci.push({ id: "riconoscimenti", etichetta: "Riconoscimenti", azione: () => setSchermata({ tipo: "riconoscimenti", primoAvvio: false }) });
  if (dentroTauri()) voci.push({ id: "esci", etichetta: "Esci", azione: () => void comando("esci", { codice: 0 }) });

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
  if (schermata.tipo === "gioco")
    return (
      <Suspense fallback={null}>
        <Gioco key={schermata.chiave} inizio={schermata.inizio} alMenu={alMenu} alFinale={alFinale} />
      </Suspense>
    );
  if (schermata.tipo === "intro")
    return (
      <Suspense fallback={null}>
        <Intro ridotto={ridotto} onFine={() => gioca({ tipo: "nuova" })} />
      </Suspense>
    );

  const caricamento = passo === "pronto" ? null : passo.replace(/…$/, "").toLowerCase() + "…";
  return (
    <div className="schermo tema relitto-app" style={STILE} data-forma="membrana" {...attributiSchermo(opzioni, ridotto)}>
      <main className="palco-app">
        {schermata.tipo === "menu" && (
          <>
            <Menu
              voci={voci}
              ridotto={ridotto}
              identita={`${VERSIONE.gioco} · ${VERSIONE.commit} · FAVELLA ${VERSIONE.motore}`}
              caricamento={caricamento}
              coperto={!!pannello || !!domanda}
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
          </>
        )}
        {schermata.tipo === "riconoscimenti" && (
          <Suspense fallback={null}>
            <Riconoscimenti elenco={ELENCO} primoAvvio={schermata.primoAvvio} avanti={dopoIRiconoscimenti} />
          </Suspense>
        )}
        {avviso && <Avviso testo={avviso.testo} grave={avviso.grave} />}
      </main>
    </div>
  );
}
