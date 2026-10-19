// ============================================================================
//  Il ritmo dei cicli di disegno (revisione 25, M10). Le vene, la lente del
//  visore, la cellula dell'aria e l'oscilloscopio del dialogo andavano a
//  requestAnimationFrame pieno, alla frequenza dello schermo: misurato
//  nell'eseguibile, il gioco fermo nel relitto teneva la pagina al 40 % di un
//  core e la scheda video al 40 %. Sono movimenti lenti: trenta fotogrammi al
//  secondo bastano (lo sfondo del menu ne fa venti), e a metà dei fotogrammi la
//  pagina non ha niente da ridipingere.
// ============================================================================

/** Fa girare `disegna` al più `fps` volte al secondo; restituisce come fermarlo. */
export function cicloA(fps: number, disegna: (t: number) => void): () => void {
  const passo = 1000 / fps;
  let ultimo = -Infinity;
  let fermo = false;
  let id = 0;
  const ciclo = (t: number) => {
    if (fermo) return;
    // il fotogramma dopo si chiede prima di disegnare: un errore in un disegno non ferma il ciclo
    // per sempre (una finestra ridotta a icona che misura zero lo fermava)
    id = requestAnimationFrame(ciclo);
    // un fotogramma quando ne è passato uno intero (meno un millisecondo: lo schermo a 60 Hz
    // non batte esattamente ogni 16,67 ms, e a 30 si perderebbe un fotogramma su tanti)
    if (t - ultimo >= passo - 1) {
      ultimo = t;
      disegna(t);
    }
  };
  id = requestAnimationFrame(ciclo);
  return () => {
    fermo = true;
    cancelAnimationFrame(id);
  };
}

/** I cicli di disegno del gioco: trenta fotogrammi al secondo. */
export const FOTOGRAMMI = 30;
