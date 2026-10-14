import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Prova from "./prova/Prova";

// Niente menu contestuale del browser e niente zoom col tasto Ctrl (§2.5 del 06).
addEventListener("contextmenu", (e) => e.preventDefault());
addEventListener("wheel", (e) => e.ctrlKey && e.preventDefault(), { passive: false });
addEventListener("keydown", (e) => {
  if (e.ctrlKey && ["+", "-", "=", "0"].includes(e.key)) e.preventDefault();
});

createRoot(document.getElementById("radice")!).render(
  <StrictMode>
    <Prova />
  </StrictMode>,
);
