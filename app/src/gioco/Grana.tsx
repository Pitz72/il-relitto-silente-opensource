// ============================================================================
//  La grana (documento 30, 1.2): sulla Santa Maria la grana del monitor di
//  bordo, nel relitto il rumore del sensore del visore (06-app-desktop.md, §5:
//  «grana di monitor»). Una tessera di rumore fatta una volta sola, su uno
//  strato solo, che si sposta a scatti con una trasformazione: la scheda video
//  la ricompone senza ridipingere niente (revisione 25, M10). Con il movimento
//  ridotto resta ferma. È decorazione: punti chiari e scuri quasi trasparenti,
//  che non spostano il contrasto del testo.
// ============================================================================
import "./grana.css";

const LATO = 192;
let tessera: string | null = null;

/** La tessera: ogni punto un po' più chiaro o un po' più scuro, mai di colore. */
function tesseraDiRumore(): string {
  if (tessera) return tessera;
  const c = document.createElement("canvas");
  c.width = c.height = LATO;
  const g = c.getContext("2d");
  if (!g) return (tessera = "");
  const img = g.createImageData(LATO, LATO);
  let seme = 20261027;
  const caso = () => (seme = (seme * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < img.data.length; i += 4) {
    const v = caso();
    // i chiari più rari e più tenui dei scuri: sul fondo scuro la grana non schiarisce lo schermo
    const chiaro = v > 0.62;
    const quanto = chiaro ? (v - 0.62) / 0.38 : (0.62 - v) / 0.62;
    const c0 = chiaro ? 255 : 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = c0;
    img.data[i + 3] = Math.round(quanto * (chiaro ? 34 : 46));
  }
  g.putImageData(img, 0, 0);
  return (tessera = c.toDataURL("image/png"));
}

export default function Grana() {
  // lo strato che si sposta è più grande dello schermo: il contenitore lo ritaglia, perché lo schermo
  // non diventi più alto di sé e non lo si possa far scorrere
  return (
    <div className="grana-strato" aria-hidden="true">
      <div className="grana" style={{ backgroundImage: `url(${tesseraDiRumore()})` }} />
    </div>
  );
}
