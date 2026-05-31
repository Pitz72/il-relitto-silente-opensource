import { Room } from '../../types';
import { gameData } from '../gameData';

export const serraMorenteRoom: Room = {
    description: (state) => {
        let desc = "SERRA MORENTE\n\nApri la porta a sud e un'aria innaturalmente secca ti investe. La luce bluastra del corridoio lascia il posto a una debole luminescenza verdastra, malata. Sei in una vasta serra a cupola. Enormi piante aliene, simili a felci scheletriche e funghi contorti, pendono dalle pareti, rinsecchite nella posa in cui sono morte. Tutto è secco, morto, coperto da uno strato di polvere che sembra neve grigia.";
        if (state.flags.semeLiberato) {
            desc += "\nIl campo di contenimento si è spento. Il silenzio ora è completo.";
        } else {
            desc += "\nUna vibrazione a bassa frequenza attraversa la stanza — si percepisce più nell'osso che nell'aria.";
        }

        if (!state.flags.semeLiberato) {
            desc += "\nAl centro della sala, sotto la cupola, c'è una teca di cristallo trasparente. All'interno, qualcosa brilla di una luce propria.";
        } else {
            desc += "\nAl centro della sala, i resti del contenitore del seme giacciono inattivi.";
        }

        // Controllo flag picked_Serra Morente_tavoletta_incisa (tavolettaPresa era
        // un flag morto, mai scritto: rimosso — BUG B20)
        if (!state.flags['picked_Serra Morente_tavoletta_incisa'] && !state.inventory.includes("Tavoletta Incisa")) {
            desc += "\nMentre osservi la stanza, noti che dietro un ammasso di funghi cristallizzati sulla parete OVEST, una sezione del muro sembra diversa. Inoltre, nascosta tra i resti di un grosso arbusto, intravedi una forma geometrica regolare: una tavoletta.";
        } else {
            desc += "\nMentre osservi la stanza, noti che dietro un ammasso di funghi cristallizzati sulla parete OVEST, una sezione del muro sembra diversa, più scura, come se fosse un passaggio.";
        }

        desc += "\nL'unica altra uscita è a NORD, da dove sei entrato.";
        return desc;
    },
    items: [
        {
            id: 'piante',
            name: 'piante',
            synonyms: ['felci', 'funghi', 'vegetazione'],
            description: "Sono i resti secchi di una flora aliena un tempo rigogliosa. Toccandone una, si sbriciola in polvere fine. La polvere ti solletica la gola anche attraverso i filtri della tuta.",
            details: "L'analisi cellulare mostra una struttura biologica complessa, ma completamente inerte. La morte è avvenuta per disidratazione e collasso atmosferico in un tempo molto, molto lungo.",
            isFixed: true
        },
        {
            id: 'teca',
            name: 'teca',
            synonyms: ['cristallo', 'centro', 'contenitore'],
            description: "È una teca di contenimento sigillata, alta circa un metro. All'interno, sospeso in un campo di stasi, c'è un singolo seme che pulsa di una gentile luce verde. È l'unica cosa viva in questa stanza di morte. Alla base della teca c'è un piccolo pannello con una serie di simboli incisi e un unico incavo rettangolare.",
            details: "La teca è protetta da un blocco magnetico complesso. Il pannello alla base è l'unica interfaccia. Lo scanner non riesce a bypassarlo. La sequenza di sblocco sembra richiedere un input esterno, da inserire nell'incavo rettangolare.",
            isFixed: true
        },
        {
            id: 'tavoletta_incisa',
            name: 'Tavoletta Incisa',
            synonyms: ['tavoletta'],
            description: "È una tavoletta rettangolare di pietra scura, con incisi tre simboli botanici e una sequenza di linee accanto a ciascuno.",
            details: "L'analisi rivela che i simboli sono una chiave di accesso. Corrispondono al protocollo di sicurezza della teca.",
            isPickable: true
        },
        {
            id: 'polvere',
            name: 'polvere',
            synonyms: ['neve', 'spore'],
            description: "È uno strato di spore morte e materia vegetale decomposta. Non sembra pericoloso, solo... triste.",
            details: "Lo scanner rileva un'alta concentrazione di spore organiche inerti nell'aria.",
            isFixed: true
        },
        {
            id: 'passaggio',
            name: 'passaggio',
            synonyms: ['muro ovest', 'apertura'],
            description: "È un'apertura non contrassegnata, nascosta dalla vegetazione morta. Conduce in un'area ancora più buia e fredda.",
            isFixed: true
        }
    ],
    commands: [
        {
            regex: "^((vai|va) )?(nord|n|indietro|corridoio)$", handler: (state) => {
                state.location = "Corridoio Principale";
                return { description: gameData["Corridoio Principale"].description(state), eventType: 'movement' };
            }
        },
        {
            regex: "^((vai|va) )?(ovest|o|passaggio)$", handler: (state) => {
                state.location = "Arca Biologica";
                return { description: gameData["Arca Biologica"].description(state), eventType: 'movement' };
            }
        },
        // ANALIZZA SEME (Oggetto in inventario o dentro teca)
        {
            regex: "^(analizza) (seme|seme vivente)$", handler: (state) => {
                return { description: "Incredibile. Lo scanner rileva un'intensa attività biologica. Questo seme non è solo in stasi, è vivo e sano. Contiene un genoma di una complessità sbalorditiva. È una vera e propria arca genetica in miniatura.", eventType: 'magic' };
            }
        },
        // ESAMINA TECA (Dinamico)
        {
            regex: "^(esamina|guarda) (teca|cristallo|contenitore)$", handler: (state) => {
                if (state.flags.semeLiberato) {
                    return { description: "La teca si è dissolta in un pulviscolo luminoso che ora giace inerte sul piedistallo. Il campo di contenimento è disattivato." };
                }
                return { description: "È una teca di contenimento sigillata, alta circa un metro. All'interno, sospeso in un campo di stasi, c'è un singolo seme che pulsa di una gentile luce verde. È l'unica cosa viva in questa stanza di morte. Alla base della teca c'è un piccolo pannello con una serie di simboli incisi e un unico incavo rettangolare." };
            }
        },
        // ESAMINA SEME (Dinamico)
        {
            regex: "^(esamina|guarda) (seme|seme vivente)$", handler: (state) => {
                if (state.inventory.includes("Seme Vivente")) {
                    return { description: "È caldo e pulsa di vita nel tuo inventario." };
                }
                if (state.flags.semeLiberato) {
                    return { description: "Il Seme Vivente fluttua a mezz'aria sopra il piedistallo, pulsando di una luce verde smeraldo. È libero." };
                }
                return { description: "Lo vedi attraverso il cristallo della teca. Sembra chiamarti." };
            }
        },
        // PRENDI SEME (Manuale)
        {
            regex: "^(prendi|raccogli) (seme|seme vivente)$", handler: (state) => {
                if (state.inventory.includes("Seme Vivente")) {
                    return { description: "L'hai già preso.", eventType: 'error' };
                }
                if (!state.flags.semeLiberato) {
                    return { description: "Non puoi prenderlo. È sigillato all'interno della teca di cristallo.", eventType: 'error' };
                }
                state.inventory.push("Seme Vivente");
                let pickupDesc = "Allunghi la mano e chiudi le dita attorno al Seme Vivente. È caldo, quasi febbrile, e senti una vibrazione costante che risale lungo il tuo braccio. Hai recuperato la prima chiave.";
                if (!state.flags.semeMonologo) {
                    state.flags.semeMonologo = true;
                    pickupDesc += "\n\n(La luce verde pulsa sul tuo guanto. Pensi a cosa tieni in mano — non un oggetto, non una 'chiave'. Una promessa: l'ultima di una civiltà che è morta credendo nel futuro. Una responsabilità che non hai chiesto, e che non puoi ignorare.)";
                }
                return { description: pickupDesc, eventType: 'item_pickup' };
            }
        },
        // TOCCA
        { regex: "^(tocca) (piante|felci|funghi|vegetazione)$", handler: () => ({ description: "Sfiori una delle felci scheletriche. Si sbriciola in una nuvola di polvere fine che si disperde nell'aria immobile. Ogni cosa qui è morta, ma morta con una tale lentezza che sembra ancora in attesa." }) },
        { regex: "^(tocca) (polvere|spore|neve)$", handler: () => ({ description: "La polvere si solleva al minimo contatto e galleggia nell'aria come coriandoli di cenere. Il tuo filtro respiratorio registra un picco di particolato organico inerte." }) },
        { regex: "^(tocca) (teca|contenitore|cristallo)$", handler: (state) => {
            if (state.flags.semeLiberato) {
                return { description: "La teca non c'è più. Si è dissolta in pulviscolo." };
            }
            return { description: "Il cristallo della teca è gelido al tatto. All'interno, il Seme pulsa di luce verde, indifferente al tuo contatto." };
        }},
        { regex: "^tocca$", handler: () => ({ description: "La serra è piena di resti vegetali secchi. Quasi tutto si sbriciolerà al contatto." }) },
        // USA TAVOLETTA SU TECA (Legacy Command)
        {
            regex: "^(usa) (tavoletta|tavoletta incisa) su (pannello|teca|incavo)$", handler: (state) => {
                if (!state.inventory.includes("Tavoletta Incisa")) {
                    return { description: "Non hai una tavoletta da usare.", eventType: 'error' };
                }
                if (state.flags.semeLiberato) {
                    return { description: "L'hai già fatto.", eventType: 'error' };
                }
                const tavolettaIndex = state.inventory.indexOf("Tavoletta Incisa");
                state.inventory.splice(tavolettaIndex, 1);
                // state.inventory.push("Seme Vivente"); // RIMOSSO AUTO-PICKUP
                state.flags.semeLiberato = true;
                return { description: "Inserisci la tavoletta nell'incavo del pannello. Si adatta perfettamente. I simboli sulla tavoletta si illuminano in sequenza, e il pannello emette un 'clic' armonioso.[PAUSE]La teca di cristallo si dissolve in un pulviscolo di luce, lasciando il Seme Vivente fluttuare a mezz'aria davanti a te, libero e pulsante.[PAUSE]La vibrazione cessa di colpo. Il silenzio cala sulla stanza come neve.", eventType: 'magic' };
            }
        },
    ]
};