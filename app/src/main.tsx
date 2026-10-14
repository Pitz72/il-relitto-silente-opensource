import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Intro from "./intro/Intro";
import Prova from "./prova/Prova";

// Niente menu contestuale del browser e niente zoom col tasto Ctrl (§2.5 del 06).
addEventListener("contextmenu", (e) => e.preventDefault());
addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), { passive: false });
addEventListener("keydown", (e) => {
  if (e.ctrlKey && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
});

// ?intro: l'intro (con ?revisione, la barra per rivedere l'animatic); altrimenti la pagina di prova.
const parametri = new URLSearchParams(location.search);

createRoot(document.getElementById("radice")!).render(
  <StrictMode>{parametri.has("intro") ? <Intro revisione={parametri.has("revisione")} /> : <Prova />}</StrictMode>,
);
