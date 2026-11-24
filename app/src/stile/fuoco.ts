// ============================================================================
//  Il contorno del fuoco, soltanto per chi sta usando la tastiera.
//  L'autore, 16 novembre 2026, con una schermata del menu: «è tornato il cerchio
//  verde intorno alle voci interattive del menu e NON DEVONO ESSERCI».
//  Perché tornava: quando una schermata mette il fuoco su un pulsante (la prima
//  voce del menu, «continua»), il browser disegna il contorno se l'ultima cosa
//  fatta è stata un tasto, e anche se non è stato ancora fatto niente. La
//  dichiarazione d'apertura se ne andava da sola dopo venti secondi: chi non
//  aveva ancora toccato il mouse arrivava al menu con il contorno intorno a
//  «Continua». (Nella demo no: il suo primo cartello vuole un clic.) Chiedere al
//  browser di non disegnarlo, `focus({ focusVisible: false })`, in WebView2 non
//  basta: l'opzione non c'è.
//  Qui la pagina tiene il conto da sé: il contorno si disegna dopo un tasto che
//  sposta il fuoco (Tab, le frecce, Inizio, Fine, Pagina su e giù), e sparisce
//  appena si muove o si preme il mouse. base.css lo disegna solo con
//  `data-tastiera` sulla radice. Le voci del menu principale non lo hanno mai:
//  hanno già il loro segno, il filo che si accende accanto (menu.css).
// ============================================================================

/** I tasti con cui ci si sposta da un controllo all'altro. */
export const TASTI_CHE_SPOSTANO = new Set(["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"]);

/** Che cosa fa un evento al contorno: lo accende, lo spegne, o niente. */
export function effettoSulContorno(e: { type: string; key?: string; movementX?: number; movementY?: number }): boolean | null {
  if (e.type === "keydown") return e.key !== undefined && TASTI_CHE_SPOSTANO.has(e.key) ? true : null;
  if (e.type === "pointerdown" || e.type === "wheel") return false;
  // il mouse che si muove davvero: il browser manda un movimento anche quando è la pagina a scorrergli sotto
  if (e.type === "pointermove") return e.movementX || e.movementY ? false : null;
  return null;
}

let installato = false;

/** Da chiamare una volta, all'avvio della pagina. */
export function seguiLaTastiera(radice: HTMLElement = document.documentElement): void {
  if (installato) return;
  installato = true;
  const senti = (e: Event) => {
    const effetto = effettoSulContorno(e as KeyboardEvent & PointerEvent);
    if (effetto === true) radice.dataset.tastiera = "";
    else if (effetto === false) delete radice.dataset.tastiera;
  };
  for (const tipo of ["keydown", "pointerdown", "pointermove", "wheel"]) addEventListener(tipo, senti, { capture: true, passive: true });
}
