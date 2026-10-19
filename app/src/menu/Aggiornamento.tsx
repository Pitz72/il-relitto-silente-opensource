// ============================================================================
//  L'aggiornamento in corso (nota dell'autore del 19 ottobre 2026, dopo la prima
//  prova riuscita: «manca un indicatore… si resta in attesa senza sapere se sta
//  veramente installando»; revisione 25, L15). Un pannello sopra il menu, che non
//  si chiude mentre lavora: la versione che arriva, una barra che si riempie con i
//  megabyte scaricati, poi «Installo»: su Windows parte l'installatore, il gioco si
//  chiude e si riapre da solo. Se qualcosa va storto lo dice, e allora si chiude.
// ============================================================================
import { Pannello } from "../gioco/pannelli/Pannelli";
import { frazione, testoAvanzamento, type Avanzamento } from "./avanzamento";

interface Props {
  versione: string;
  avanzamento: Avanzamento;
  /** se l'aggiornamento non è andato: la frase da dire, e il pannello si può chiudere */
  errore: string | null;
  chiudi: () => void;
}

export default function Aggiornamento({ versione, avanzamento, errore, chiudi }: Props) {
  const f = frazione(avanzamento);
  return (
    <Pannello forma="membrana" classe="conferma aggiornamento" etichetta={`Aggiornamento alla versione ${versione}`}>
      <p className="domanda">Aggiornamento alla versione {versione}</p>
      {errore ? (
        <>
          <p className="sotto" role="alert">
            {errore}
          </p>
          <div className="scelte-conferma">
            <button type="button" data-primo="" onClick={chiudi}>
              Chiudi
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className={`barra-aggiornamento${f === null ? " senza-misura" : ""}${avanzamento.fase === "installa" ? " installa" : ""}`}
            role="progressbar"
            aria-label="Scaricamento dell’aggiornamento"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={f === null ? undefined : Math.floor(f * 100)}
          >
            <span style={{ width: f === null ? undefined : `${f * 100}%` }} />
          </div>
          <p className="sotto" aria-live="polite">
            {testoAvanzamento(avanzamento)}
          </p>
        </>
      )}
    </Pannello>
  );
}
