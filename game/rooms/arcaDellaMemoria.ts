import { Room } from '../../types';
import { gameData } from '../gameData';

export const arcaDellaMemoriaRoom: Room = {
    description: (state) => {
        let desc = "ARCA DELLA MEMORIA\n\nLa porta si apre su una caverna di cristallo nero. Enormi pilastri di dati, simili a monoliti, si ergono dal pavimento fino a un soffitto che non riesci a vedere. La maggior parte di essi è scura, inerte, alcuni sono visibilmente incrinati, emanando un'aura di profonda rovina. La debole luce bianca dello scriptorium qui è quasi assente, sostituita da un'oscurità quasi totale. L'aria è fredda e immobile, carica del peso di un silenzio millenario.\nIn fondo alla sala, un singolo pilastro emette una debolissima e intermittente pulsazione di luce ambrata. È l'unica fonte di luce in questo mausoleo di informazioni. Accanto ad esso, c'è un terminale di accesso.";

        if (state.flags.isTerminalActive && !state.inventory.includes("Nucleo di Memoria")) {
            desc += "\nLo scomparto alla base del terminale è aperto, rivelando un cristallo poliedrico che pulsa di luce ambrata: il Nucleo di Memoria.";
        }

        desc += "\nL'unica uscita è a SUD.";
        return desc;
    },
    items: [
        {
            id: 'pilastri',
            name: 'pilastri',
            synonyms: ['monoliti', 'cristalli', 'pilastro'],
            description: "Sono archivi di dati cristallini di una capacità inimmaginabile. La maggior parte è irrimediabilmente danneggiata. Le crepe che li attraversano sembrano ferite mortali. Quello pulsante è l'unico che mostra ancora segni di vita.",
            details: "Lo scanner conferma la tua peggiore paura.[PAUSE]ANALISI ARCHIVIO CENTRALE: Integrità dati stimata: 0.001%.\nCAUSA: corruzione a cascata dovuta a degradazione entropica nel lungo periodo. Perdita di dati catastrofica e irreversibile.[PAUSE]Millenni di storia, scienza, arte e filosofia. Tutta la conoscenza di una civiltà che ha attraversato le galassie... svanita. Polvere digitale. Questa è la loro seconda morte, più totale e definitiva della prima.",
            isFixed: true
        },
        {
            id: 'terminale',
            name: 'terminale',
            synonyms: ['console', 'accesso', 'pannello'],
            description: "È un terminale di accesso al pilastro di dati. È completamente spento. Sulla sua superficie c'è un pannello di bypass energetico, chiaramente progettato per le emergenze.",
            details: "Il terminale è in uno stato di ibernazione profonda. Per riattivarlo, anche solo per un istante, servirebbe un picco di energia improvviso e ad alto voltaggio, diretto al pannello di bypass. Un sovraccarico controllato.",
            isFixed: true
        },
        {
            id: 'nucleo_memoria',
            name: 'Nucleo di Memoria',
            synonyms: ['nucleo', 'cristallo poliedrico'],
            description: "Un cristallo poliedrico che pulsa di luce ambrata. Sembra contenere qualcosa di importante.",
            details: "È un supporto di memoria cristallino di altissima capacità. Analizzalo con il tuo scanner per tentare la decodifica.",
            isPickable: false,   // Il pickup è gated dal comando regex (richiede terminale attivo)
            isFixed: false,
            onAnalyze: (state) => {
                if (!state.inventory.includes("Nucleo di Memoria")) {
                    return { description: "Non hai un Nucleo di Memoria da analizzare.", eventType: 'error' };
                }
                if (state.flags.translationProgress === 100) {
                    return { description: "Hai già estratto l'ultima, triste eco da questo cristallo. Non c'è altro da scoprire.", eventType: 'magic' };
                }
                state.flags.translationProgress = 100;
                return {
                    description: "Inserisci il cristallo nel tuo scanner. Non contiene dati storici o scientifici. Contiene una singola registrazione audio-mnemonica, l'ultima voce salvata prima del collasso totale dell'archivio.[PAUSE]Stato traduzione: 100%. Testo decifrato.[PAUSE](Una voce calma ma infinitamente stanca risuona nella tua mente)\n«Log dell'Archivista, ciclo... non ha più importanza. Le matrici si stanno sfaldando. Il canto della nostra storia svanisce. Presto, tutto ciò che eravamo... non sarà mai stato. Ho salvato questo singolo pensiero. Un'eco nell'oscurità. Se qualcuno un giorno lo troverà, sappia che siamo esistiti. E che abbiamo sperato. Fine della registrazione.»[PAUSE]Lo scanner emette un tono acuto, breve — diverso da tutti gli altri che hai sentito. Sul display appare una riga che non avevi mai visto:\n\nMATRICE DI TRADUZIONE: 100%. DECODIFICA COMPLETATA.\n\nOgni iscrizione, ogni simbolo, ogni voce raccolta in questa nave — adesso comprensibile fino all'ultima sfumatura. Non c'è più nulla di alieno nel linguaggio. Per un momento, la distanza tra te e loro collassa completamente. Non sei più uno scopritore. Sei un testimone.",
                    eventType: 'magic'
                };
            }
        }
    ],
    commands: [
        // MOVIMENTO
        {
            regex: "^((vai|va) )?(sud|s|scriptorium|indietro)$", handler: (state) => {
                state.location = "Scriptorium";
                return { description: gameData["Scriptorium"].description(state), eventType: 'movement' };
            }
        },
        { regex: "^((vai|va) )?(nord|est|ovest|n|e|o)$", handler: () => ({ description: "Non puoi andare in quella direzione. L'unica via d'uscita è a SUD.", eventType: 'error' }) },
        // TOCCA
        { regex: "^(tocca) (pilastri|monoliti|cristalli|pilastro)$", handler: () => ({ description: "La superficie cristallina è stranamente tiepida sotto le dita. Una singola scintilla, appena percettibile, risponde al tuo tocco — un arco di luce ambrata, piccolo come un'emozione soppressa — poi si spegne. Come l'ultima scintilla di un fuoco morente." }) },
        { regex: "^(tocca) (terminale|console)$", handler: () => ({ description: "Il pannello del terminale è liscio e privo di reazione. Le fibre energetiche dentro sono dormienti, in attesa di uno shock che le risvegli." }) },
        { regex: "^tocca$", handler: () => ({ description: "Sei nell'Arca della Memoria. I pilastri di cristallo si ergono nel buio intorno a te. Puoi toccarli." }) },
        // USA
        {
            regex: "^(usa) (taglierina|taglierina al plasma) su (pannello|terminale|console|accesso)$", handler: (state) => {
                if (!state.inventory.includes("Taglierina al Plasma")) {
                    return { description: "Non hai una taglierina al plasma.", eventType: 'error' };
                }
                if (state.flags.isTerminalActive) {
                    return { description: "L'hai già fatto. Il terminale è attivo, anche se a malapena.", eventType: 'error' };
                }
                state.flags.isTerminalActive = true;
                return {
                    description: "È un'idea folle, ma è l'unica che hai. Imposti la tua taglierina al plasma sulla massima potenza e, per una frazione di secondo, dirigi il getto energetico sul pannello di bypass.[PAUSE]Il terminale sfrigola, un odore acre di metallo fuso sale nell'aria per un istante. Per un istante temi di averlo distrutto. Poi, lo schermo si accende con un'unica parola nella lingua aliena e un piccolo scomparto si apre alla base del terminale, rivelando un cristallo poliedrico.",
                    eventType: 'item_use'
                };
            }
        },
        { regex: "^(usa) (.+) su (terminale|pannello)$", handler: () => ({ description: "Non ha alcun effetto. Il terminale ha bisogno di un potente shock energetico.", eventType: 'error' }) },
        // PRENDI
        {
            regex: "^(prendi) (nucleo|cristallo|nucleo di memoria)$", handler: (state) => {
                if (!state.flags.isTerminalActive) {
                    return { description: "È sigillato all'interno del terminale.", eventType: 'error' };
                }
                if (state.inventory.includes("Nucleo di Memoria")) {
                    return { description: "L'hai già preso.", eventType: 'error' };
                }
                state.inventory.push("Nucleo di Memoria");
                return {
                    description: "OK, hai preso il Nucleo di Memoria.",
                    eventType: 'item_pickup'
                };
            }
        },
    ]
};