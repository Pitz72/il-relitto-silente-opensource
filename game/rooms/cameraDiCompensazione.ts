import { Room } from '../../types';
import { gameData } from '../gameData';

export const cameraDiCompensazioneRoom: Room = {
    description: (state) => {
        let desc = "CAMERA DI COMPENSAZIONE\n\nSei all'interno. Il silenzio qui è diverso da quello del vuoto fuori — è il silenzio di qualcosa che aspetta. È una piccola stanza buia, dalle pareti lisce e prive di angoli. L'aria, se così si può chiamare, è immobile, fredda e senza odore. Di fronte a te, a EST, c'è una porta interna, perfettamente integrata nella parete. Accanto ad essa noti un piccolo pannello di controllo, completamente spento. Mentre i tuoi occhi si abituano alla penombra, noti una debole incisione sulla parete, proprio sopra la porta interna.";

        if (state.flags.isAirlockDoorPowered && !state.flags.isAirlockDoorOpen) {
            desc += "\nUna singola linea di luce ambrata brilla debolmente sul pannello."
        } else if (state.flags.isAirlockDoorOpen) {
            desc += "\nA EST, la porta è aperta e rivela un lungo corridoio."
        }
        desc += "\nL'apertura da cui sei entrato si è richiusa, senza lasciare alcuna fessura visibile.";
        return desc;
    },
    commands: [
        // MOVIMENTO
        {
            regex: "^((vai|va) )?(est|e|dentro|corridoio)$", handler: (state) => {
                if (state.flags.isAirlockDoorOpen) {
                    state.location = "Corridoio Principale";
                    return { description: gameData["Corridoio Principale"].description(state), eventType: 'movement' };
                }
                return { description: "Devi prima aprire la porta.", eventType: 'error' };
            }
        },
        {
            regex: "^(entra|vai dentro|entra corridoio|entra stanza|entra nave)$", handler: (state) => {
                if (state.flags.isAirlockDoorOpen) {
                    state.location = "Corridoio Principale";
                    return { description: gameData["Corridoio Principale"].description(state), eventType: 'movement' };
                }
                return { description: "La porta è chiusa.", eventType: 'error' };
            }
        },
        { regex: "^((vai|va) )?(ovest|o|indietro|fuori)$", handler: () => ({ description: "L'apertura da cui sei entrato si è sigillata senza lasciare traccia. Non puoi tornare indietro." }) },
        // ESAMINA
        { regex: "^(esamina|guarda) (incisione|simbolo)$", handler: () => ({ description: "È un'incisione semplice ma elegante. Raffigura una stella stilizzata, dalla quale parte una linea che termina in una piccola spirale, simile a un seme che germoglia. È quasi un diagramma, una dichiarazione d'intenti." }) },
        { regex: "^(esamina|guarda) (porta|uscita|porta interna)$", handler: () => ({ description: "È una porta monolitica, dello stesso materiale nero opaco dello scafo. Non ha maniglie, cerniere o fessure visibili. Sembra sigillata ermeticamente." }) },
        { regex: "^(esamina|guarda) (pannello|pannello di controllo|controlli)$", handler: () => ({ description: "È una piccola superficie liscia e scura incassata nella parete. Non ci sono schermi, pulsanti o interruttori visibili. Sembra inerte." }) },
        { regex: "^(esamina|guarda) (muro|pareti|soffitto|pavimento)$", handler: () => ({ description: "Le pareti della stanza sono curve e senza giunture. La geometria è strana, quasi organica. Toccarle trasmette una sensazione di freddo assoluto." }) },
        // ANALIZZA
        { regex: "^(analizza) (incisione|simbolo)$", handler: () => ({ description: "Lo scanner rileva tracce infinitesimali di bio-luminescenza all'interno dei solchi. Sembra che l'incisione fosse progettata per brillare debolmente, forse come un segnale di benvenuto o un promemoria. L'energia residua è quasi incalcolabilmente antica.", eventType: 'magic' }) },
        { regex: "^(analizza) (porta)$", handler: () => ({ description: "L'analisi rivela un complesso meccanismo di chiusura magnetico all'interno della porta. È completamente privo di energia.", eventType: 'magic' }) },
        {
            regex: "^(analizza) (pannello|pannello di controllo)$", handler: (state) => {
                state.flags.knowsAboutPanelPower = true;
                return { description: "Il tuo multiscanner rileva una micro-rete di fibre energetiche sotto la superficie liscia. Il sistema è progettato per gestire la pressurizzazione della stanza e l'apertura della porta interna, ma è dormiente. Sembra esserci una porta di accesso per una fonte di energia esterna a basso voltaggio.", eventType: 'magic' };
            }
        },
        // USA / TOCCA
        { regex: "^(tocca) (pareti|muro|soffitto|pavimento)$", handler: () => ({ description: "Appoggi una mano sulla parete. È fredda come il ghiaccio e liscia come il vetro. Non senti alcuna vibrazione, solo una quiete profonda e antica." }) },
        {
            regex: "^(usa) (batteria|batteria di emergenza) su (pannello|pannello di controllo)$", handler: (state) => {
                if (!state.inventory.includes("Batteria di Emergenza")) {
                    return { description: "Non hai una batteria.", eventType: 'error' };
                }
                if (!state.flags.knowsAboutPanelPower) {
                    return { description: "Non sai come usare la batteria su questo pannello.", eventType: 'error' };
                }
                if (state.flags.isAirlockDoorPowered) {
                    return { description: "Il pannello è già alimentato.", eventType: 'error' };
                }
                state.flags.isAirlockDoorPowered = true;
                const batteryIndex = state.inventory.indexOf("Batteria di Emergenza");
                if (batteryIndex > -1) {
                    state.inventory.splice(batteryIndex, 1);
                }
                return { description: "Seguendo le indicazioni del tuo scanner, trovi un piccolo incavo quasi invisibile sul pannello. Inserisci il connettore della batteria di emergenza. Il pannello si anima con un debole ronzio e una singola linea di luce ambrata appare sulla sua superficie. Senti un 'clack' sordo provenire dalla porta a est. Sembra che ora sia possibile aprirla.", eventType: 'item_use' };
            }
        },
        { regex: "^(usa) (taglierina|taglierina al plasma) su (porta)$", handler: () => ({ description: "La tua taglierina al plasma graffia a malapena la superficie. Questo materiale è molto più resistente di quello dello scafo esterno. Non puoi aprirla con la forza.", eventType: 'error' }) },
        // APRI
        {
            regex: "^(apri) (porta)$", handler: (state) => {
                if (state.flags.isAirlockDoorOpen) {
                    return { description: "La porta è già aperta.", eventType: 'error' };
                }
                if (!state.flags.isAirlockDoorPowered) {
                    return { description: "La porta è sigillata e non si muove. Non c'è alcun meccanismo di apertura visibile.", eventType: 'error' };
                }
                state.flags.isAirlockDoorOpen = true;
                return { description: "Appoggi una mano sulla linea di luce ambrata del pannello. Con un sibilo quasi impercettibile, la porta si ritrae silenziosamente nella parete, rivelando un lungo corridoio a EST.", eventType: 'magic' };
            }
        },
    ]
};