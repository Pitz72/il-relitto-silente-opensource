/* ─── inventoryItems.ts ─────────────────────────────────────────────────────
   Registro degli oggetti che esistono SOLO come stringhe di inventario:
   nascono da comandi (USA KIT, USA DISPOSITIVO SU CRISTALLO, PRENDI SEME
   via room command) e non appartengono agli `items` di nessuna stanza.
   Senza queste definizioni, ESAMINA/ANALIZZA/USA su Taglierina, Batteria,
   Seme Vivente e Cristallo Dati Attivato cadevano nel "Non capisco quel
   comando" — un buco di omogeneità del parser (audit 2026-07-11).
   Il motore li cerca qui quando l'oggetto è in inventario e non è stato
   trovato tra gli item della stanza corrente.
   ─────────────────────────────────────────────────────────────────────── */

import { Item } from '../types';

export const INVENTORY_ITEMS: Item[] = [
    {
        id: 'inv_taglierina',
        name: 'Taglierina al Plasma',
        synonyms: ['taglierina'],
        description: "Uno strumento da taglio industriale, compatto e ben bilanciato. L'ugello emette, quando attiva, un getto di plasma capace di incidere quasi ogni lega. La ghiera di regolazione permette di dosare la potenza, dal minimo per le incisioni fini al massimo per il taglio strutturale.",
        details: "Analisi: utensile di fabbricazione umana, standard Weyland Corp. Cella energetica al 94%. Con la potenza al massimo può erogare picchi energetici brevi e violenti — utile anche come fonte di shock elettrico d'emergenza, non solo come lama.",
    },
    {
        id: 'inv_batteria',
        name: 'Batteria di Emergenza',
        synonyms: ['batteria'],
        description: "Una cella energetica portatile a basso voltaggio, con connettore universale. È il tipo di batteria che tiene in vita i sistemi essenziali quando tutto il resto si spegne.",
        details: "Analisi: carica completa, uscita stabile a basso voltaggio. Compatibile con la maggior parte delle porte di alimentazione d'emergenza — anche, sorprendentemente, con standard che umani non sono.",
    },
    {
        id: 'inv_seme',
        name: 'Seme Vivente',
        synonyms: ['seme'],
        description: "Il Seme pulsa di una gentile luce verde tra le tue mani, caldo, quasi febbrile. Una vibrazione costante ti risale lungo il braccio, come un battito. È l'unica cosa viva uscita da quella serra di morte — e ora dipende da te.",
        details: "Lo scanner rileva un'intensa attività biologica. Il Seme non è solo in stasi: è vivo e sano, e contiene un genoma di una complessità sbalorditiva. Una vera e propria arca genetica in miniatura.",
        onUse: () => ({
            description: "Il Seme non si 'usa': si custodisce. Ma la sua forma ovoidale sembra fatta per essere accolta da qualcosa — un incavo, un alloggiamento, da qualche parte su questa nave.",
            eventType: null,
        }),
    },
    {
        id: 'inv_cristallo_attivato',
        name: 'Cristallo Dati Attivato',
        synonyms: ['cristallo', 'cristallo attivato', 'cristallo dati'],
        description: "Il cristallo, un tempo opaco, è ora trasparente: al suo interno una matrice di filamenti luminosi pulsa in sincrono, come un cuore che ha ripreso a battere. È tiepido e vibra debolmente. Sembra in attesa.",
        details: "Analisi: supporto di memoria cristallino ad altissima capacità, ora attivo e stabile. La geometria dell'involucro corrisponde a un alloggiamento standard K'tharr: è fatto per essere inserito in qualcosa.",
        onUse: () => ({
            description: "Il cristallo vibra piano nella tua mano, in attesa. Da solo non fa nulla: dev'essere inserito in un alloggiamento compatibile.",
            eventType: null,
        }),
    },
];
