// ============================================================================
//  Le azioni di situazione (06-app-desktop.md, §6.1).
//  Quattro verbi non hanno una cosa da toccare, o ce l'hanno ma conta il posto:
//  si accosta dalla plancia, si costeggiano le teche nella loro sala, si rientra
//  dallo scafo, si ricarica la tuta al generatore. Hanno un posto fisso,
//  «Azioni», e compaiono nella stanza dove servono, purché il motore offra il
//  comando. Che cosa risponde il gioco fuori tempo (accostare due volte,
//  ricaricare a generatore spento) lo dice il testo, non il pulsante.
// ============================================================================

export interface AzioneDiSituazione {
  id: string;
  /** l'etichetta è il comando come si scriverebbe (§2, principio 4) */
  etichetta: string;
  comando: string;
  stanze: readonly string[];
}

export const AZIONI_DI_SITUAZIONE: readonly AzioneDiSituazione[] = [
  { id: "accosta", etichetta: "Accosta", comando: "accosta", stanze: ["plancia"] },
  { id: "costeggia", etichetta: "Costeggia", comando: "costeggia", stanze: ["sala delle teche"] },
  { id: "rientra", etichetta: "Rientra", comando: "rientra", stanze: ["scafo"] },
  { id: "ricarica", etichetta: "Ricarica la tuta", comando: "ricarica la tuta", stanze: ["laboratorio di risonanza"] },
];
