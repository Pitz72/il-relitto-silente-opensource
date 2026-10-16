// ============================================================================
//  Il mix d'autore (mondo/livelli.rs): i livelli relativi dei canali del suono, in dB,
//  decisi da chi fa il gioco e non da chi gioca. I valori di partenza stanno in
//  livelli.json, un file solo che legge anche il motore in Rust. La console di regia
//  (console/ConsoleMix.tsx) li muove ascoltando; le modifiche si ricordano nel browser
//  dell'app finché non diventano i valori del file.
// ============================================================================
import base from "./livelli.json";

export type Livelli = typeof base;
export type Canale = keyof Livelli;

export const LIVELLI_DI_BASE: Livelli = base;

/** I canali, nell'ordine della console: come si chiamano e che cosa ci passa. */
export const CANALI: readonly { chiave: Canale; nome: string; cosa: string }[] = [
  { chiave: "fiato", nome: "Fiato", cosa: "il respiro dentro il casco" },
  { chiave: "ventola", nome: "Ventola", cosa: "la ventola della tuta" },
  { chiave: "re", nome: "Re del reattore", cosa: "il ronzio basso della nave, dal pavimento e nelle ossa" },
  { chiave: "fondi", nome: "Macchine", cosa: "la ventilazione e le pompe della Santa Maria" },
  { chiave: "stanza", nome: "Stanza", cosa: "il fondo del relitto, i ronzii, il groviglio, i soffi, i crepitii" },
  { chiave: "corpo", nome: "Corpo", cosa: "il battito, il cuore, il fischio dell'orecchio" },
  { chiave: "fuoco", nome: "Bengala", cosa: "il fuoco e il suo crepitio" },
  { chiave: "colpi_ambienti", nome: "Colpi dell'ambiente", cosa: "le lamiere, i crolli" },
  { chiave: "colpi_effetti", nome: "Colpi degli effetti", cosa: "i passi, gli attrezzi, le cose che accadono" },
  { chiave: "brusio", nome: "Brusio", cosa: "le voci del relitto, nessuna intera" },
  { chiave: "filo", nome: "Echi (filo)", cosa: "il Sintonizzatore: le voci che si staccano dal brusio" },
  { chiave: "radio", nome: "Radio di bordo", cosa: "i messaggi della radio" },
  { chiave: "colpi_voci", nome: "Colpi delle voci", cosa: "gli eventi di voce" },
  { chiave: "interfaccia", nome: "Pulsanti", cosa: "il tocco dei pulsanti" },
  { chiave: "musica", nome: "Musica", cosa: "i file, sopra il livello comune; e la guida del re nell'intro" },
  { chiave: "intro", nome: "Intro (suoni)", cosa: "il sound design dell'intro: la traccia, il respiro, i clic, la plancia" },
];

const CHIAVE = "relitto.livelli";
/** Le modifiche valgono solo sopra la base con cui sono state fatte: se il file cambia, ripartono dal file. */
const IMPRONTA = JSON.stringify(base);

export function leggiLivelli(): Livelli {
  try {
    const dati = JSON.parse(localStorage.getItem(CHIAVE) ?? "null");
    if (dati && dati.base === IMPRONTA && typeof dati.livelli === "object") return { ...base, ...dati.livelli };
  } catch {
    /* niente spazio o niente dati: valgono quelli del file */
  }
  return { ...base };
}

export function scriviLivelli(l: Livelli): void {
  try {
    if (JSON.stringify(l) === IMPRONTA) localStorage.removeItem(CHIAVE);
    else localStorage.setItem(CHIAVE, JSON.stringify({ base: IMPRONTA, livelli: l }));
  } catch {
    /* le modifiche valgono fino alla chiusura */
  }
}
