import { Room } from '../../types';
import { gameData } from '../gameData';

export const scafoEsternoRoom: Room = {
    description: (state) => {
         let desc = "SCAFO ESTERNO DEL RELITTO\n\nSei fuori. Il silenzio è assoluto, rotto solo dal suono ovattato del tuo respiro nel casco. Sei agganciato magneticamente all'impenetrabile scafo della nave aliena. La tua Santa Maria, a pochi metri di distanza, sembra un giocattolo in confronto. La superficie nera si estende a perdita d'occhio in ogni direzione, assorbendo la luce delle stelle e non restituendo nulla. Non vedi portelli, finestre, o scritte di alcun tipo.";
         if(state.flags.isHoleCut) {
             desc += "\nC'è un'apertura che hai creato con la taglierina."
         }
         desc += "\nL'unica via di ritorno visibile è il boccaporto della tua nave a NORD.";
         return desc;
    },
    items: [],
    commands: [
        // MOVIMENTO
        { regex: "^((vai|va) )?(nord|n|indietro|santa maria)$", handler: (state) => {
            state.location = "Stiva";
            return { description: gameData["Stiva"].description(state), eventType: 'movement' };
        }},
        { regex: "^(entra|entra apertura|entra camera|entra varco|entra foro|((vai|va) )?(dentro|apertura))$", handler: (state) => {
            if (!state.flags.isHoleCut) {
                return { description: "Non c'è nessun posto dove entrare.", eventType: 'error' };
            }
            state.location = "Camera di Compensazione";
            if (!state.flags.primoIngressoRelitto) {
                state.flags.primoIngressoRelitto = true;
                const monologo =
                    `Passi attraverso il varco che hai creato. Il taglio è appena abbastanza largo per il casco.\n\n` +
                    `L'unica cosa che percepisci con chiarezza, in questo momento, è che il suono della tua tuta —` +
                    `i microprocessori, la pompa dell'ossigeno, il ciclo del clima — si sente improvvisamente troppo forte. ` +
                    `Come quando si spegne la musica e ci si accorge per la prima volta del silenzio che c'era già.\n\n` +
                    `La Santa Maria è a tre metri alle tue spalle.\n\nGuardi avanti.`;
                return {
                    description: `${monologo}[PAUSE]${gameData["Camera di Compensazione"].description(state)}`,
                    eventType: 'movement'
                };
            }
            return { description: gameData["Camera di Compensazione"].description(state), eventType: 'movement' };
        }},
        { regex: "^((vai|va) )?(sud|s|ovest|o|est|e)$", handler: () => ({ description: "Ti muovi per qualche metro lungo lo scafo, ma il panorama non cambia. È una distesa monotona e infinita. Meglio non allontanarsi troppo dalla tua nave." }) },
        // TOCCA
        { regex: "^(tocca) (scafo|superficie|muro|parete|nave|relitto)$", handler: () => ({ description: "Appoggi la mano guantata sullo scafo. Il materiale è liscio sotto il guanto e assorbe ogni fotone senza restituire nulla. Zero vibrazioni, zero calore. È come toccare il nulla solidificato. La tua mano appare stranamente enorme contro quella perfezione oscura." }) },
        { regex: "^tocca$", handler: () => ({ description: "Sei agganciato allo scafo alieno. Puoi toccare la superficie della nave o le stelle di spazio intorno a te. O quasi." }) },
        // ESAMINA
        { regex: "^(esamina|guarda) (scafo|nave|superficie|muro|parete)$", handler: () => ({ description: "Lo scafo è una distesa infinita di un materiale nero opaco, liscio al tatto anche attraverso i guanti della tuta. Non c'è un singolo rivetto, saldatura o pannello visibile. Sembra un unico, solido pezzo di oscurità." }) },
        { regex: "^(esamina|guarda) (santa maria|mia nave|nave da carico)$", handler: () => ({ description: "La tua nave da carico sembra piccola e vulnerabile, agganciata a questo colosso silenzioso. Le sue luci esterne sono l'unica fonte di illuminazione familiare in questo vuoto." }) },
        { regex: "^(esamina|guarda) (stelle|spazio)$", handler: () => ({ description: "Le stelle sono fredde e immobili. La loro luce non riesce a scalfire la tenebra dello scafo alieno." }) },
        { regex: "^(esamina|guarda) (crepa|giuntura|discontinuita|fessura)$", handler: (state) => {
            if (state.flags.knowsAboutCrack) {
                return { description: "Osservando da vicino il punto indicato dal tuo scanner, noti una linea sottilissima, al limite del visibile. Non è una crepa da danno, sembra più una giuntura di manutenzione sigillata con una precisione disumana. È l'unica imperfezione che riesci a trovare su questo scafo altrimenti perfetto." };
            }
            return { description: "Giri intorno, ispezionando lo scafo, ma non vedi nessuna crepa o giuntura evidente. La superficie è perfettamente liscia.", eventType: 'error' };
        }},
        // ANALIZZA
        { regex: "^(analizza) (scafo|nave|superficie)$", handler: (state) => {
            state.flags.knowsAboutCrack = true;
            return { description: "Il tuo multiscanner emette un debole segnale. L'analisi della superficie indica che è composta da una lega di carbonio e metalli sconosciuti, estremamente densa. Tuttavia, il sensore rileva una sottile discontinuità strutturale a pochi passi da te, come una giuntura sigillata dall'interno. È invisibile a occhio nudo.", eventType: 'magic' };
        }},
        { regex: "^(analizza) (crepa|giuntura|discontinuita|fessura)$", handler: (state) => {
            if (state.flags.knowsAboutCrack) {
                return { description: "Lo scanner conferma che la giuntura è il punto strutturalmente più debole dello scafo esterno. Il materiale qui è più sottile, progettato per essere tagliato e poi risaldato. È la tua unica via d'ingresso.", eventType: 'magic' };
            }
            return { description: "Non hai ancora individuato una crepa da analizzare.", eventType: 'error' };
        }},
        // USA
        { regex: "^(usa) (taglierina|taglierina al plasma) su (crepa|giuntura|discontinuita|fessura)$", handler: (state) => {
            if (!state.inventory.includes("Taglierina al Plasma")) {
                return { description: "Non hai una taglierina.", eventType: 'error' };
            }
            if (!state.flags.knowsAboutCrack) {
                return { description: "Non vedi nessuna crepa o giuntura particolare su cui usarla.", eventType: 'error' };
            }
            if (state.flags.isHoleCut) {
                return { description: "L'hai già fatto.", eventType: 'error' };
            }
            state.flags.isHoleCut = true;
            return { description: "Attivi la taglierina al plasma. Un getto di luce brillante e silenziosa incide il metallo oscuro. Dopo un momento, la sezione che hai tagliato si stacca, rivelando un'apertura scura. Sembra l'ingresso di una camera di compensazione. Puoi ENTRARE.", eventType: 'item_use' };
        }},
        { regex: "^(usa) (taglierina|taglierina al plasma) su (scafo)$", handler: () => ({ description: "Lo scafo è troppo vasto e resistente. Devi trovare un punto debole.", eventType: 'error' })},
        { regex: "^(usa) (batteria|batteria di emergenza) su (.+)$", handler: () => ({ description: "Appoggi la batteria contro la superficie. Non succede assolutamente nulla." })},
    ]
};