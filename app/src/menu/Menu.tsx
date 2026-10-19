// ============================================================================
//  Il menu principale (06-app-desktop.md, §4.6): sopra la scena finale
//  dell'intro, viva e lentissima, il titolo e le voci. Continua, Nuova partita,
//  Carica, Opzioni, Registro dei finali, Riconoscimenti, Esci. Le frecce
//  passano da una voce all'altra, Invio sceglie; il mouse come sempre.
//  Le voci le decide chi lo usa (Relitto.tsx): qui si mostrano.
// ============================================================================
import { useEffect, useRef, type KeyboardEvent } from "react";
import Sfondo from "./Sfondo";
import "./menu.css";

export interface VoceMenu {
  id: string;
  etichetta: string;
  /** una riga sotto, piccola: dove riprende «Continua» */
  dettaglio?: string;
  azione: () => void;
}

interface Props {
  voci: readonly VoceMenu[];
  ridotto: boolean;
  /** la versione e il commit, in basso */
  identita: string;
  /** il motore si sta ancora caricando: lo si dice, piano */
  caricamento: string | null;
  /** il motore non è partito (revisione 25, M7): lo si dice, e si offre di riavviare */
  problema?: string | null;
  /** il pannello aperto sopra il menu (il menu non prende i tasti) */
  coperto: boolean;
}

export default function Menu({ voci, ridotto, identita, caricamento, problema = null, coperto }: Props) {
  const navRef = useRef<HTMLElement>(null);

  // il fuoco sulla prima voce: all'arrivo, quando si chiude un pannello, e
  // quando compare «Continua» (i salvataggi si leggono dopo). Senza il contorno:
  // nessuno l'ha scelta, e a chi gioca col mouse sembrava già cliccata; Invio la
  // prende lo stesso, e il contorno torna alla prima freccia
  const prima = voci[0]?.id;
  useEffect(() => {
    if (!coperto) navRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true, focusVisible: false });
  }, [coperto, prima]);

  const frecce = (e: KeyboardEvent) => {
    const tutti = [...(navRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const i = tutti.indexOf(document.activeElement as HTMLButtonElement);
    const j =
      e.key === "ArrowDown" ? (i + 1) % tutti.length
      : e.key === "ArrowUp" ? (i - 1 + tutti.length) % tutti.length
      : e.key === "Home" ? 0
      : e.key === "End" ? tutti.length - 1
      : -1;
    if (j < 0) return;
    e.preventDefault();
    tutti[j]?.focus();
  };

  return (
    <div className="menu-principale" aria-hidden={coperto ? true : undefined}>
      <Sfondo ridotto={ridotto} />
      <div className="menu-velo" aria-hidden="true" />
      <header className="menu-titolo">
        <h1>Il Relitto Silente</h1>
        <div className="menu-vena" aria-hidden="true" />
        <p>
          Una storia tratta da <i>Il Registro della Santa Maria</i>
        </p>
      </header>
      <nav className="menu-voci" aria-label="Menu principale" ref={navRef} onKeyDown={frecce}>
        {voci.map((v) => (
          <button key={v.id} type="button" data-voce={v.id} onClick={v.azione}>
            <span className="menu-etichetta">{v.etichetta}</span>
            {v.dettaglio && <span className="menu-dettaglio">{v.dettaglio}</span>}
          </button>
        ))}
      </nav>
      <footer className="menu-piede">
        <span>{identita}</span>
        {caricamento && (
          <span className="menu-caricamento" role="status">
            {caricamento}
          </span>
        )}
        {problema && (
          <span className="menu-problema" role="alert">
            {problema}{" "}
            <button type="button" onClick={() => location.reload()}>
              Riavvia il gioco
            </button>
          </span>
        )}
      </footer>
    </div>
  );
}
