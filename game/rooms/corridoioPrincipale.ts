import { Room } from '../../types';
import { gameData } from '../gameData';

export const corridoioPrincipaleRoom: Room = {
    description: (state) => {
        let desc = "CORRIDOIO PRINCIPALE\n\nIl sibilo della porta che si chiude alle tue spalle è l'ultimo suono familiare che senti. Ora sei nel cuore del relitto. Ti trovi in un corridoio immenso, molto più vasto di quanto le dimensioni esterne della nave lasciassero presagire. Le pareti non sono piane, ma si curvano dolcemente verso un soffitto che non riesci a distinguere nell'oscurità.\nNon ci sono lampade, eppure l'ambiente è immerso in una debole e fredda luminescenza bluastra che sembra emanare direttamente dalle pareti. L'aria è immobile. Il silenzio è assoluto.";

        // Controllo flag lastra (picked_Corridoio Principale_lastra_dati) o inventario
        // (lastraPresa era un flag morto, mai scritto: rimosso — BUG B20)
        if (!state.flags['picked_Corridoio Principale_lastra_dati'] && !state.inventory.includes("Lastra Dati")) {
            desc += "\nAppoggiata in una piccola nicchia poco profonda in una parete, noti una piccola lastra di un materiale liscio e scuro, simile a onice.";
        }

        desc += "\nDi fronte a te vedi tre passaggi: una porta a NORD, una porta a SUD e una porta più grande e imponente a OVEST. La porta da cui sei entrato è a EST — indistinguibile ora dal resto della parete. Alla sua base, appena visibili, tre tacche orizzontali sono incise nel materiale. Accanto, noti un pannello di controllo per un montacarichi di servizio che scende verso il basso.\nNoti anche una porta laterale socchiusa, da cui proviene un silenzio diverso, più intimo.";
        return desc;
    },
    items: [
        {
            id: 'lastra_dati',
            name: 'Lastra Dati',
            synonyms: ['lastra'],
            description: "È una lastra sottile e levigata, fredda al tatto. È della dimensione del palmo della tua mano. La sua superficie è completamente liscia, ma quando la muovi nella luce, vedi deboli circuiti perlescenti scorrere sotto la superficie.",
            isPickable: true,
            onAnalyze: (state) => {
                if (state.flags.lastraAnalizzata) {
                    return { description: `Hai già analizzato la lastra. Stato traduzione: ${state.flags.translationProgress ?? 4}%.`, eventType: 'magic' };
                }
                state.flags.lastraAnalizzata = true;
                state.flags.translationProgress = 4;
                return {
                    description: "Inserisci la lastra in un alloggiamento del tuo multiscanner. Lo strumento emette un ronzio e i suoi processori iniziano a lavorare febbrilmente.[PAUSE]I dati sono una registrazione audio-mnemonica. Il linguaggio è incomprensibile, ma lo scanner sta iniziando a costruire una matrice di traduzione.\nUna voce metallica e distorta emette dal tuo scanner una traduzione frammentaria:\n...giorno del Grande Salto... (parola intraducibile: 'canto-radice')... le tre lune danzano fredde. Il Viaggio è la nostra (parola intraducibile: 'dovere-gioia')... presto vedremo nuove stelle...",
                    eventType: 'magic'
                };
            }
        },
        {
            id: 'pareti',
            name: 'pareti',
            synonyms: ['muro', 'soffitto', 'pavimento'],
            description: "Le pareti non sembrano costruite, ma... cresciute. La superficie è liscia ma con una micro-trama simile all'osso o alla madreperla. È da qui che proviene la debole luce bluastra.",
            details: "Il tuo scanner emette un crepitio a bassa frequenza. L'analisi conferma una struttura organica complessa e tracce di bioluminescenza. È un materiale sconosciuto, un biopolimero cristallizzato. L'energia emessa è trascurabile, ma costante e incredibilmente antica.",
            isFixed: true
        },
        {
            id: 'luce',
            name: 'luminescenza',
            synonyms: ['luce'],
            description: "La luce non ha una fonte. Le pareti stesse brillano debolmente, proiettando ombre lunghe e incerte. È una luce fredda, quasi spettrale.",
            isFixed: true
        },
        {
            id: 'porta_nord',
            name: 'porta nord',
            synonyms: ['porta a nord', 'porta spirale nord'],
            description: "È un pannello perfettamente integrato nella parete. Al suo centro è inciso un semplice simbolo, simile a una spirale. Non ci sono maniglie o controlli visibili.",
            details: "Il meccanismo di apertura è integrato nella struttura. Lo scanner rileva una rete di micro-conduttori che converge verso il simbolo inciso. Sembra rispondere a un input bio-elettrico, come un tocco.",
            isFixed: true
        },
        {
            id: 'porta_sud',
            name: 'porta sud',
            synonyms: ['porta a sud', 'porta spirale sud'],
            description: "È un pannello perfettamente integrato nella parete. Al suo centro è inciso un semplice simbolo, simile a una spirale. Non ci sono maniglie o controlli visibili.",
            details: "Il meccanismo di apertura è integrato nella struttura. Lo scanner rileva una rete di micro-conduttori che converge verso il simbolo inciso. Sembra rispondere a un input bio-elettrico, come un tocco.",
            isFixed: true
        },
        {
            id: 'porta_ovest',
            name: 'porta ovest',
            synonyms: ['porta a ovest', 'porta ovest', 'grande porta'],
            description: "Questa porta è visibilmente più grande e massiccia delle altre. Il simbolo inciso qui è molto più complesso, una sorta di diagramma stellare a più punte. Alla base della porta, tre incavi scuri attendono qualcosa. La porta è fredda e inerte.",
            details: "Lo scanner rileva una rete di micro-conduttori che converge verso il simbolo inciso. I tre incavi alla base hanno forme distinte: uno compatibile con un oggetto organico di forma ovoidale, uno con una superficie rettangolare piatta, uno con una geometria cristallina poliedrica. Sembra richiedere tre chiavi specifiche.",
            isFixed: true
        },
        {
            id: 'porta_est',
            name: 'porta est',
            synonyms: ['porta a est', 'porta est', 'entrata'],
            description: "È la porta della camera di compensazione da cui sei entrato. Ora è chiusa e indistinguibile dal resto della parete.",
            isFixed: true
        },
        {
            id: 'tacche',
            name: 'tacche',
            synonyms: ['segni', 'incisioni', 'marchi', 'graffi', 'tacca'],
            description: "Tre tacche orizzontali, parallele, incise nella base della parete est. Sono troppo regolari per essere deterioramento. Qualcuno le ha fatte deliberatamente — la convenzione di chi marca i punti già esplorati per non perdersi.",
            details: "Lo scanner rileva che le incisioni sono state prodotte con uno strumento a punta di dimensioni e caratteristiche incompatibili con la tecnologia K'tharr. Le tracce del materiale d'usura indicano un utensile metallico leggero, portatile. L'età è difficile da quantificare con precisione — ma su scala geologica, recente.\n\nNel processo di scansione, il multiscanner rileva anche una traccia residua di segnale su banda a radiofrequenza standard umana. Il segnale è troppo degradato per la riproduzione. Ma era qui. Qualcuno trasmetteva, in questo punto, su una frequenza che nessun dispositivo K'tharr avrebbe potuto ricevere.",
            isFixed: true
        },
        {
            id: 'montacarichi',
            name: 'montacarichi',
            synonyms: ['ascensore', 'pannello', 'basso'],
            description: "Un pannello di controllo semplice che comanda un montacarichi gravitazionale verso i livelli inferiori.",
            details: "Conduce al settore tecnico e ai laboratori.",
            isFixed: true
        },
        {
            id: 'porta_laterale',
            name: 'porta laterale',
            synonyms: ['alloggi', 'dormitori'],
            description: "Una porta più piccola, lasciata socchiusa. Conduce agli alloggi dell'equipaggio.",
            isFixed: true
        }
    ],
    commands: [
        // MOVIMENTO
        {
            regex: "^((vai|va) )?(nord|n)$", handler: (state) => {
                state.location = "Santuario del Silenzio";
                return { description: gameData["Santuario del Silenzio"].description(state), eventType: 'movement' };
            }
        },
        {
            regex: "^((vai|va) )?(sud|s)$", handler: (state) => {
                state.location = "Serra Morente";
                return { description: gameData["Serra Morente"].description(state), eventType: 'movement' };
            }
        },
        {
            regex: "^((vai|va) )?(ovest|o)$", handler: (state) => {
                if (state.flags.isWestDoorUnlocked) {
                    state.location = "Ponte di Comando";
                    return {
                        description: gameData["Ponte di Comando"].description(state),
                        eventType: 'movement'
                    };
                }
                return { description: "La grande porta a ovest è sigillata. I tre incavi alla sua base sembrano suggerire che siano necessarie delle chiavi per aprirla.", eventType: 'error' };
            }
        },
        {
            regex: "^((vai|va) )?(est|e|indietro)$", handler: (state) => {
                return { description: "La porta da cui sei entrato si è richiusa, diventando indistinguibile dal resto della parete. Non c'è via di ritorno.", eventType: 'error' };
            }
        },
        {
            regex: "^((vai|va) )?(basso|giu|montacarichi)$", handler: (state) => {
                state.location = "Laboratori di Risonanza";
                return { description: gameData["Laboratori di Risonanza"].description(state), eventType: 'movement' };
            }
        },
        {
            regex: "^((vai|va|entra) )?(alloggi|dormitori|porta laterale|laterale)$", handler: (state) => {
                state.location = "Alloggi dell'Equipaggio";
                return { description: gameData["Alloggi dell'Equipaggio"].description(state), eventType: 'movement' };
            }
        },
        // APRI / USA / TOCCA (Logica complessa mantenuta qui)
        {
            regex: "^(usa|inserisci) (seme vivente|seme|stele del ricordo|stele|nucleo di memoria|nucleo) su (porta|porta ovest|incavo)$",
            handler: (state, match) => {
                const itemUsed = match[2];
                let itemKey = '';
                let flagKey = '';
                let itemName = '';
                let responseText = '';

                if (itemUsed.includes('seme')) {
                    itemKey = "Seme Vivente";
                    flagKey = "seedPlaced";
                    itemName = "il Seme Vivente";
                    responseText = "Avvicini il Seme Vivente all'incavo a forma di seme. Viene attratto da una forza invisibile e si incastra con un 'clic' delicato. Una debole linea di luce verde smeraldo si traccia lungo il bordo della porta, pulsando lentamente.";
                } else if (itemUsed.includes('stele')) {
                    itemKey = "Stele del Ricordo";
                    flagKey = "stelePlaced";
                    itemName = "la Stele del Ricordo";
                    responseText = "Inserisci la Stele del Ricordo nell'incavo rettangolare. Si adatta perfettamente. Una linea di luce bianca e pura si aggiunge alle altre, emanando un'aura solenne.";
                } else if (itemUsed.includes('nucleo')) {
                    itemKey = "Nucleo di Memoria";
                    flagKey = "corePlaced";
                    itemName = "il Nucleo di Memoria";
                    responseText = "Posizioni il Nucleo di Memoria nell'incavo poliedrico. Una linea di luce ambrata si unisce alle altre, completando il circuito. Un ronzio profondo e armonico riempie il corridoio.";
                }

                if (!itemKey) {
                    return { description: `Non capisco cosa vuoi usare.`, eventType: 'error' };
                }

                if (!state.inventory.includes(itemKey)) {
                    return { description: `Non hai ${itemName}.`, eventType: 'error' };
                }

                if (state.flags[flagKey]) {
                    return { description: `Hai già posizionato ${itemName}.`, eventType: 'error' };
                }

                state.flags[flagKey] = true;
                const itemIndex = state.inventory.indexOf(itemKey);
                if (itemIndex > -1) {
                    state.inventory.splice(itemIndex, 1);
                }

                const allPlaced = state.flags.seedPlaced && state.flags.stelePlaced && state.flags.corePlaced;

                if (allPlaced) {
                    state.flags.isWestDoorUnlocked = true;
                    responseText += "[PAUSE]Le tre luci — verde, bianca e ambrata — pulsano all'unisono, la loro frequenza aumenta rapidamente. Il ronzio si trasforma in un 'gong' risonante che vibra attraverso la struttura stessa della nave.[PAUSE]Il complesso simbolo a stella al centro della porta brilla di una luce accecante.[PAUSE]Lentamente, la grande porta a Ovest non si apre. Si dissolve in particelle di luce, come stelle che tornano al cielo, rivelando l'ingresso a una sala avvolta in un'oscurità familiare: il Ponte di Comando.";
                    return {
                        description: responseText,
                        eventType: 'magic'
                    };
                } else {
                    return {
                        description: responseText,
                        eventType: 'item_use'
                    };
                }
            }
        },
        {
            regex: "^(usa|inserisci) (.+) su (porta|porta ovest|incavo)$", handler: (state, match) => {
                return { description: `Provi a usare ${match[2]} sulla porta, ma non sembra avere alcun effetto.`, eventType: 'error' };
            }
        },
        { regex: "^(apri|usa|tocca) (porta ovest)$", handler: () => ({ description: "Appoggi la mano sul complesso simbolo a stella. A differenza delle altre, questa porta non reagisce. Rimane fredda, inerte e sigillata. I tre incavi alla base suggeriscono che serva qualcos'altro.", eventType: 'error' }) },
        { regex: "^(tocca) (pareti|muro|soffitto|pavimento)$", handler: () => ({ description: "La superficie è liscia e stranamente tiepida, quasi come pelle. Senti una debolissima, quasi impercettibile vibrazione, come un respiro lentissimo." }) },
        { regex: "^(tocca) (tacche|segni|incisioni|marchi|graffi)$", handler: () => ({ description: "Le tacche sono poco profonde ma precise. Il materiale intorno non si è sgretolato — chi le ha fatte sapeva quanto premere. Tre colpi. Non uno di più." }) },
        {
            regex: "^(esamina|guarda|analizza) porta$", handler: () => ({
                description: "Ci sono diverse porte: una a NORD, una a SUD, una grande porta a OVEST e quella da cui sei entrato a EST. Usa 'esamina porta nord', 'esamina porta sud', 'esamina porta ovest' o 'esamina porta est' per esaminarle singolarmente.",
                eventType: null
            })
        },
    ]
};