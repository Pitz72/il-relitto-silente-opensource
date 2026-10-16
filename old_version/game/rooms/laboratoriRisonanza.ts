import { Room } from '../../types';
import { gameData } from '../gameData';
import { ECHO_TEXTS, LOCATION_TO_ECHO, SEALED_ECHO_ROOMS, DEEP_ECHOES, DEEP_ECHO_TEXTS } from '../echoData';

export const laboratoriRisonanzaRoom: Room = {
    description: (state) => {
        let desc = "LABORATORI DI RISONANZA\n\nSei sceso nel ventre della nave. Qui l'aria è satura di elettricità statica — i capelli si rizzano contro il casco, lo scanner registra interferenze continue. La stanza è dominata da macchinari massicci, bobine di rame e cristalli di focalizzazione. È qui che l'equipaggio studiava le anomalie temporali.";

        if (!state.flags['picked_Laboratori di Risonanza_sintonizzatore']) {
            desc += "\nSu un banco di lavoro ingombro di schemi tecnici, noti uno strano dispositivo portatile che pulsa di una luce irregolare.";
        }

        desc += "\nUn montacarichi conduce verso l'ALTO, al Corridoio Principale.";
        return desc;
    },
    items: [
        {
            id: 'banco_lavoro',
            name: 'banco di lavoro',
            synonyms: ['banco', 'tavolo'],
            description: "È coperto di appunti frenetici e componenti smontati. Sembra che stessero cercando di calibrare qualcosa in fretta.",
            details: "Gli appunti sono in parte illeggibili — simboli alieni incisi veloci, quasi rabbiosi. Riesci a decifrare alcune cifre ricorrenti accanto a schemi di cristalli. Nella parte bassa del piano c'è qualcosa di diverso: una serie di simboli piccoli, ordinati con cura, lontani dal caos dei calcoli tecnici. Non sono numeri. Sono nomi. Una lista di nomi — dodici, forse quattordici — incisa con precisione deliberata. L'Ingegnere Capo ha voluto che restassero.",
            isFixed: true
        },
        {
            id: 'macchinari',
            name: 'macchinari',
            synonyms: ['bobine', 'cristalli'],
            description: "Generatori di campo e stabilizzatori di fase. Tecnologia molto avanzata, ma ora tacciono.",
            details: "Analisi strutturale: I cristalli sono saturati di energia cronale. Questa stanza è stata esposta a forti distorsioni temporali.",
            isFixed: true
        },
        {
            id: 'sintonizzatore',
            name: 'Sintonizzatore di Frequenza',
            synonyms: ['sintonizzatore', 'dispositivo', 'radio strana'],
            description: "Un dispositivo portatile con un display a frequenza d'onda e diverse manopole di calibrazione.",
            details: "È un rilevatore di anomalie quantistiche. Può 'ascoltare' gli echi residui di eventi passati impressi nella materia.",
            isPickable: true,
            onUse: (state) => {
                const visited = state.visitedRooms ?? [];
                const currentId = LOCATION_TO_ECHO[state.location];

                /* Echi da registrare in questa attivazione:
                   1) l'eco della stanza corrente (meccanica originale);
                   2) gli echi delle stanze sigillate già attraversate, che
                      altrimenti resterebbero irraggiungibili (BUG B2). */
                const toCapture: string[] = [];
                if (currentId && !state.echoes.includes(currentId)) toCapture.push(currentId);
                for (const room of SEALED_ECHO_ROOMS) {
                    const id = LOCATION_TO_ECHO[room];
                    if (id && visited.includes(room) && !state.echoes.includes(id) && !toCapture.includes(id)) {
                        toCapture.push(id);
                    }
                }

                /* Eco PROFONDO della stanza corrente (WS2): secondo strato, fuori
                   dal conteggio canonico. Si cattura solo se la condizione correlata
                   è soddisfatta; altrimenti se ne segnala l'esistenza senza svelarlo. */
                const deep = DEEP_ECHOES.find(d => d.room === state.location);
                let deepText: string | null = null;
                let deepLockedHint: string | null = null;
                if (deep && !state.flags[deep.id]) {
                    if (deep.gate(state)) {
                        state.flags[deep.id] = true;
                        deepText = DEEP_ECHO_TEXTS[deep.id];
                    } else {
                        deepLockedHint = deep.lockedHint;
                    }
                }

                // Nessun eco di superficie nuovo da catturare in questa attivazione.
                if (toCapture.length === 0 && !deepText) {
                    if (deepLockedHint && currentId && state.echoes.includes(currentId)) {
                        return { description: `Riascolti l'eco già noto di questa stanza. ${deepLockedHint}`, eventType: 'tech' };
                    }
                    return {
                        description: currentId
                            ? "Rilevi solo un residuo statico. Hai già decifrato questo eco."
                            : "Il sintonizzatore emette solo statico. Nessuna traccia mnemonica rilevabile in questa zona.",
                        eventType: 'tech'
                    };
                }

                toCapture.forEach(id => state.echoes.push(id));

                const segments: string[] = [];
                if (toCapture.length === 1) {
                    segments.push(`Il sintonizzatore fischia acutamente, agganciando una frequenza fantasma. Una voce attraversa i secoli:\n\n${ECHO_TEXTS[toCapture[0]]}`);
                } else if (toCapture.length > 1) {
                    // Prima attivazione dopo la discesa: il dispositivo riaggancia in
                    // un colpo solo gli echi delle zone ormai sigillate alle spalle.
                    const voices = toCapture.map(id => ECHO_TEXTS[id]).join('\n\n');
                    segments.push(`Il sintonizzatore impazzisce, agganciando in rapida successione le frequenze fantasma rimaste impresse nella materia lungo la tua discesa. Voci sovrapposte riemergono dal silenzio dei secoli:\n\n${voices}`);
                }

                if (deepText) {
                    // Lo strato profondo: il dispositivo non si spegne, scende di frequenza.
                    const lead = toCapture.length > 0
                        ? "Poi il dispositivo non si spegne. La frequenza cala ancora, sotto la soglia di prima, e dal fondo emerge un secondo strato — più vicino, più nudo:"
                        : "Riattivi il sintonizzatore sull'eco già noto di questa stanza. Stavolta, però, il dispositivo non si ferma: la frequenza scende sotto la soglia di prima e dal fondo emerge un secondo strato — più vicino, più nudo:";
                    segments.push(`${lead}\n\n${deepText}`);
                } else if (deepLockedHint) {
                    segments.push(`(${deepLockedHint})`);
                }

                return { description: segments.join('\n\n'), eventType: 'echo' };
            }
        }
    ],
    commands: [
        {
            regex: "^((vai|va) )?(alto|su|corridoio|montacarichi)$", handler: (state) => {
                state.location = "Corridoio Principale";
                return { description: gameData["Corridoio Principale"].description(state), eventType: 'movement' };
            }
        },
        // Puzzle Ingegnere
        {
            regex: "^(usa|inserisci) (cristallo|cristallo dati|cristallo dati attivato) su (macchinari|generatori|nucleo)$",
            handler: (state, match) => {
                const item = match[2];
                if (item.includes('opaco')) {
                    return { description: "Il cristallo è inerte. Devi attivarlo prima con un dispositivo medico adeguato.", eventType: 'error' };
                }

                if (!state.inventory.includes("Cristallo Dati Attivato")) {
                    return { description: "Non hai un cristallo attivo da inserire.", eventType: 'error' };
                }

                if (state.flags.isPowerRestored) {
                    return { description: "Il generatore è già attivo e stabile.", eventType: 'error' };
                }

                const index = state.inventory.indexOf("Cristallo Dati Attivato");
                state.inventory.splice(index, 1);
                state.flags.isPowerRestored = true;

                return {
                    description: "Inserisci il cristallo pulsante nel nucleo del generatore. Con un rombo crescente, i macchinari si risvegliano dopo secoli di silenzio. Archi di elettricità danzano tra le bobine. I monitor si accendono, mostrando flussi di energia che tornano stabili e vengono reindirizzati verso il Ponte di Comando.",
                    eventType: 'magic'
                };
            }
        },
        { regex: "^(usa|attiva) (macchinari|generatori)$", handler: () => ({ description: "I macchinari sono in stand-by. Il nucleo di alimentazione è vuoto. Serve una fonte di energia compatibile (un cristallo dati ad alta capacità).", eventType: 'error' }) },
        // TOCCA
        { regex: "^(tocca) (macchinari|bobine|cristalli|generatori)$", handler: () => ({ description: "Il metallo è freddo sotto le tue dita. Le bobine assorbono ogni vibrazione. Senti però una carica residua — secoli di energia accumulata che aspetta solo uno scintillo per svegliarsi. Come dormire su un fulmine." }) },
        { regex: "^(tocca) (banco|tavolo|schemi)$", handler: () => ({ description: "Il banco di lavoro è ingombro di schemi tecnici arrotolati e componenti smontati. Qualcuno stava lavorando qui, in fretta, quando tutto è finito." }) },
        { regex: "^tocca$", handler: () => ({ description: "Puoi toccare i macchinari o il banco di lavoro. L'elettricità statica nell'aria fa rizzare i peli sulle braccia anche attraverso la tuta." }) },
    ]
};
