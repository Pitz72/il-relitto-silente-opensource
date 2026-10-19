// Le righe delle novità, con il loro grassetto: nella finestra delle novità (FinestraNovita.tsx) e nella
// domanda «È uscita la versione…» (la Conferma di gioco/pannelli/Pannelli.tsx).
import { pezzi } from "./novita";

export default function RigheNovita({ righe }: { righe: readonly string[] }) {
  return (
    <ul className="novita-righe">
      {righe.map((r, i) => (
        <li key={i}>{pezzi(r).map((p, j) => (p.forte ? <strong key={j}>{p.testo}</strong> : <span key={j}>{p.testo}</span>))}</li>
      ))}
    </ul>
  );
}
