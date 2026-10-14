import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";

// Niente menu contestuale del browser e niente zoom col tasto Ctrl (§2.5 del 06).
addEventListener("contextmenu", (e) => e.preventDefault());
addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), { passive: false });
addEventListener("keydown", (e) => {
  if (e.ctrlKey && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
});

// Le pagine, ognuna con i suoi stili (si caricano solo quando servono):
//   ?intro            l'intro (con &revisione, la barra per rivedere l'animatic)
//   ?campionario      il campionario del sistema visivo: caratteri, atmosfere, contrasti
//   ?gioco            il gioco (fase 3, in costruzione)
//   altrimenti        la pagina di prova della fase 1
const Intro = lazy(() => import("./intro/Intro"));
const Prova = lazy(() => import("./prova/Prova"));
const Campionario = lazy(() => import("./campionario/Campionario"));
const Gioco = lazy(() => import("./gioco/Gioco"));

const parametri = new URLSearchParams(location.search);

function Pagina() {
  if (parametri.has("intro")) return <Intro revisione={parametri.has("revisione")} />;
  if (parametri.has("campionario")) return <Campionario />;
  if (parametri.has("gioco")) return <Gioco />;
  return <Prova />;
}

createRoot(document.getElementById("radice")!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Pagina />
    </Suspense>
  </StrictMode>,
);
