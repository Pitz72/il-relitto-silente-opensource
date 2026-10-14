import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { comando, dentroTauri, type InfoSistema } from "./lib/tauri";

// Niente menu contestuale del browser e niente zoom col tasto Ctrl (§2.5 del 06).
addEventListener("contextmenu", (e) => e.preventDefault());
addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), { passive: false });
addEventListener("keydown", (e) => {
  if (e.ctrlKey && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
});

// Le pagine, ognuna con i suoi stili (si caricano solo quando servono):
//   (niente)          il gioco
//   ?prova            la pagina di prova della fase 1: le misure tecniche (anche
//                     con RELITTO_PROVA impostata, per le prove automatiche;
//                     RELITTO_PROVA=salvataggi prova invece i salvataggi nel gioco)
//   ?intro            l'intro (con &revisione, la barra per rivedere l'animatic)
//   ?campionario      il campionario del sistema visivo: caratteri, atmosfere, contrasti
const Gioco = lazy(() => import("./gioco/Gioco"));
const Intro = lazy(() => import("./intro/Intro"));
const Prova = lazy(() => import("./prova/Prova"));
const Campionario = lazy(() => import("./campionario/Campionario"));

const parametri = new URLSearchParams(location.search);

async function pagina() {
  if (parametri.has("intro")) return <Intro revisione={parametri.has("revisione")} />;
  if (parametri.has("campionario")) return <Campionario />;
  if (parametri.has("prova")) return <Prova />;
  // le prove automatiche: quella dei salvataggi sul gioco, le altre della fase 1 sulla pagina di prova
  if (dentroTauri()) {
    try {
      const prova = (await comando<InfoSistema>("info_sistema")).prova;
      if (prova === "salvataggi") return <Gioco prova="salvataggi" />;
      if (prova) return <Prova />;
    } catch {
      /* senza le informazioni del sistema, il gioco */
    }
  }
  return <Gioco />;
}

pagina().then((p) =>
  createRoot(document.getElementById("radice")!).render(
    <StrictMode>
      <Suspense fallback={null}>{p}</Suspense>
    </StrictMode>,
  ),
);
