// ============================================================================
//  Il registro dei finali (06-app-desktop.md, §4.6): una pagina del registro di
//  bordo della Santa Maria, sei righe. Quelle scritte, nell'ordine in cui le hai
//  scritte; sotto, le righe ancora vuote. Nessun conto, nessuna percentuale.
// ============================================================================
import { Pannello } from "../gioco/pannelli/Pannelli";
import { FINALI, giorno, type VoceRegistro } from "./registro";

export default function RegistroFinali({ registro, chiudi }: { registro: readonly VoceRegistro[]; chiudi: () => void }) {
  const vuote = Math.max(0, FINALI.length - registro.length);
  return (
    <Pannello forma="acciaio" titolo="Registro dei finali" classe="registro-finali">
      <p className="registro-targa" aria-hidden="true">
        TSC-1972 · registro di bordo
      </p>
      <ol className="registro-righe">
        {registro.map((v) => (
          <li key={v.finale}>
            <span className="registro-data">{giorno(v.data)}</span>
            <span className="registro-titolo">{v.titolo}</span>
            {v.riga && <span className="registro-riga">{v.riga}</span>}
          </li>
        ))}
        {Array.from({ length: vuote }, (_, i) => (
          <li key={`vuota-${i}`} className="vuota">
            <span className="solo-lettori">riga vuota</span>
          </li>
        ))}
      </ol>
      <button type="button" className="chiudi" onClick={chiudi}>
        chiudi <span className="tasto">Esc</span>
      </button>
    </Pannello>
  );
}
