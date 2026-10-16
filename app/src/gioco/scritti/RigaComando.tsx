// ============================================================================
//  La riga di comando della modalità a solo testo (progettazione/18-modalita-solo-testo.md,
//  §5.2 e §5.3). Prende il posto del ramo: il segno «›», lo stesso con cui la lamina ripete il
//  comando dato, e il cursore. Le lettere, le cifre, lo spazio e le frecce sono della riga:
//    qualunque lettera  scrive; se il testo sta comparendo, prima lo completa
//    Invio              dà il comando; su una riga vuota completa il testo
//    ↑ ↓                i comandi già dati
//    Esc                svuota la riga; se è vuota, apre la pausa (lo fa chi ascolta Esc)
// ============================================================================
import { useEffect, useRef, useState } from "react";
import "./riga.css";

interface Props {
  invia: (testo: string) => void;
  /** completa il testo che sta comparendo */
  completa: () => void;
  /** i comandi dati, dal più vecchio al più recente */
  storia: readonly string[];
  /** un pannello o una domanda sono aperti: la riga non prende il fuoco */
  bloccata: boolean;
  /** cambia a ogni turno: il fuoco torna sulla riga */
  chiave: unknown;
  /** nel dialogo la riga serve a scegliere: scrive il numero o la frase */
  inDialogo?: boolean;
}

export default function RigaComando({ invia, completa, storia, bloccata, chiave, inDialogo = false }: Props) {
  const [testo, setTesto] = useState("");
  // dove si è nella storia con le frecce (-1: la riga che si stava scrivendo)
  const posizione = useRef(-1);
  const scritta = useRef("");
  const campo = useRef<HTMLInputElement>(null);

  // il fuoco sulla riga: all'apertura, a ogni turno, quando si chiude un pannello
  useEffect(() => {
    if (!bloccata) campo.current?.focus({ preventScroll: true });
  }, [bloccata, chiave]);

  // chi scrive senza avere il fuoco sulla riga (ha toccato il testo) scrive nella riga
  useEffect(() => {
    if (bloccata) return;
    const giu = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.length !== 1) return;
      const ora = document.activeElement;
      if (ora === campo.current || ora instanceof HTMLInputElement || ora instanceof HTMLTextAreaElement) return;
      campo.current?.focus({ preventScroll: true });
    };
    addEventListener("keydown", giu, true);
    return () => removeEventListener("keydown", giu, true);
  }, [bloccata]);

  const mandaIl = (t: string) => {
    posizione.current = -1;
    scritta.current = "";
    setTesto("");
    invia(t);
  };

  return (
    <form
      className="riga-comando"
      data-in-dialogo={inDialogo ? "" : undefined}
      onSubmit={(e) => {
        e.preventDefault();
        const t = testo.trim();
        if (t) mandaIl(t);
        else completa();
      }}
    >
      <label className="segno" htmlFor="riga-comando">
        <span aria-hidden="true">›</span>
        <span className="solo-lettori">Scrivi un comando</span>
      </label>
      <input
        ref={campo}
        id="riga-comando"
        type="text"
        value={testo}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="send"
        aria-describedby="riga-aiuto"
        onChange={(e) => {
          setTesto(e.target.value);
          posizione.current = -1;
        }}
        onKeyDown={(e) => {
          // i tasti della riga non arrivano alla tastiera del gioco
          if (e.key === "Escape") {
            if (testo) {
              e.preventDefault();
              e.stopPropagation();
              setTesto("");
              posizione.current = -1;
            }
            return;
          }
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            e.stopPropagation();
            if (!storia.length) return;
            if (posizione.current === -1) scritta.current = testo;
            const prossima = e.key === "ArrowUp" ? Math.min(posizione.current + 1, storia.length - 1) : posizione.current - 1;
            posizione.current = prossima;
            setTesto(prossima < 0 ? scritta.current : storia[storia.length - 1 - prossima]);
            return;
          }
          if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) completa();
          // le altre cose della tastiera (F5, F9, F11) le prende il gioco; i tasti normali restano qui
          if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End" || e.key === " ") e.stopPropagation();
        }}
      />
      <span id="riga-aiuto" className="solo-lettori">
        {inDialogo ? "Scrivi il numero della risposta, o le sue parole, e premi Invio." : "Scrivi un comando e premi Invio. AIUTO li ricorda."}
      </span>
    </form>
  );
}
