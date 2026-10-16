import { Room } from '../../types';
import { gameData } from '../gameData';

export const santuarioDelSilenzioRoom: Room = {
    description: (state) => {
        let desc = "SANTUARIO DEL SILENZIO\n\nLa porta a nord si apre su un ambiente completamente diverso. La debole luce blu qui è sostituita da una fredda luminescenza bianca che emana da motivi geometrici sul pavimento. Sei in una sala circolare dal soffitto a volta altissimo, che si perde nell'oscurità. L'aria è immobile e ha un odore neutro, quasi sterile, come di pietra antica.\nLe pareti sono interamente coperte da intricati bassorilievi che raffigurano scene di una civiltà aliena. Al centro esatto della sala, si erge un altare cilindrico di pietra nera levigata.\nOltre all'uscita a SUD da cui sei entrato, c'è un altro passaggio a OVEST.";

        if (state.flags.steleRevealed && !state.flags.stelePresa) {
            desc += "\nUno scomparto segreto è aperto nel fianco dell'altare. All'interno brilla la Stele del Ricordo.";
        } else if (state.flags.stelePresa) {
            desc += "\nLo scomparto nell'altare è aperto e vuoto.";
        }

        return desc;
    },
    items: [
        {
            id: 'bassorilievi',
            name: 'bassorilievi',
            synonyms: ['muri', 'pareti', 'incisioni', 'scene'],
            description: "Sono scene incredibilmente dettagliate. Vedi creature alte e sottili che osservano un cielo con tre soli. Le vedi piantare semi luminosi su un pianeta fertile. Le vedi costruire navi immense, identiche a questa, che partono verso le stelle. L'ultima scena raffigura le creature che entrano nelle navi, con un'espressione non di paura, ma di solenne determinazione. È la storia di un esodo, di un sacrificio.",
            details: "L'analisi del materiale rivela che la pietra è stata scolpita con una precisione atomica. Le incisioni non sono state scavate, ma 'piegate' a livello molecolare. La tecnologia è incomprensibile.",
            isFixed: true,
            onTranslate: (state) => {
                const pct = (state.flags.translationProgress as number) ?? 0;
                if (pct < 18) {
                    return { description: "Provi a leggere i glifi incisi accanto a ogni scena. La matrice di traduzione restituisce solo forme: linee che si rincorrono, spirali, un ritmo. Le immagini parlano — tre soli, semi di luce, navi in partenza — ma le parole restano chiuse. Ti serve più materiale linguistico prima di poterle aprire.", eventType: 'magic' };
                }
                if (pct < 75) {
                    return { description: "Stavolta qualche parola affiora dai glifi, isolata, come una pietra che spunta dalla bassa marea: «...sanguinarono...», «...non il mondo, ma l'idea...», «...affidare...». Il senso completo ti sfugge ancora, ma non è più soltanto arte: è una frase spezzata, che qualcuno ha voluto lasciare.", eventType: 'magic' };
                }
                let d = "I glifi si sciolgono in lingua. Sotto ogni scena scorre una didascalia, e per la prima volta il fregio non racconta soltanto: dice.\n\n«Vedemmo i tre soli sanguinare e non maledicemmo il cielo. Piantammo dove non avremmo raccolto. Salimmo sapendo di non arrivare. Chi troverà queste pareti sappia: non fu una fuga. Fu una semina.»";
                if (pct >= 100) {
                    d += "[PAUSE]Un'ultima riga corre al margine inferiore, più piccola, dove la pietra si fa quasi liscia — incisa, forse, da una mano sola, dopo tutte le altre:\n\n«E se la semina ha attecchito, allora qualcuno sta leggendo. Allora non eravamo soli. Allora è bastato.»";
                }
                return { description: d, eventType: 'magic' };
            }
        },
        {
            id: 'altare',
            name: 'altare',
            synonyms: ['pietra', 'centro', 'cilindro', 'incavo'],
            description: "È un blocco cilindrico di una pietra nera che assorbe la luce. La superficie superiore è perfettamente liscia, tranne per un incavo circolare, profondo pochi centimetri. Sembra fatto per alloggiare un oggetto specifico.",
            details: "Lo scanner rileva un complesso meccanismo a pressione e a massa specifica sotto l'incavo. Per attivarlo, non basta un oggetto qualsiasi. Serve un oggetto circolare con una massa e una densità molto precise. Il meccanismo, se attivato, aprirebbe uno scomparto nascosto all'interno dell'altare stesso.",
            isFixed: true,
            onCombine: (_targetId, _state) => {
                // L'interazione USA DISCO SU ALTARE è gestita dal room command regex (riga 94).
                // Questo handler è un fallback difensivo per combinazioni non previste.
                return { description: "Non succede nulla.", eventType: 'error' };
            }
        },
        {
            id: 'stele_item',
            name: 'Stele del Ricordo',
            // Solo 'stele': 'tavoletta' e 'lastra' collidevano con "Tavoletta Incisa"
            // (Serra) e "Lastra Dati" (Corridoio), rendendo ESAMINA/ANALIZZA ambigui
            // quando più di questi oggetti erano in inventario (BUG B21).
            synonyms: ['stele'],
            description: "Una lastra di materiale sconosciuto, densa di informazioni.",
            isPickable: true,
            onUse: (_state) => {
                return { description: "Non puoi usarla qui. Forse il Corridoio Principale richiede che tu la inserisca da qualche parte.", eventType: 'error' };
            },
            onAnalyze: (state) => {
                if (!state.inventory.includes("Stele del Ricordo")) {
                    return { description: "Non hai una stele da analizzare.", eventType: 'error' };
                }
                if (state.flags.steleAnalizzata) {
                    return { description: `Hai già analizzato la stele. Stato traduzione: ${state.flags.translationProgress}%.`, eventType: 'magic' };
                }
                state.flags.translationProgress = 75;
                state.flags.steleAnalizzata = true;
                // WS5 — secondo percorso deduttivo per la Porta a Tre Punte: la Stele
                // nomina esplicitamente i «tre soli», quindi chi la analizza apprende
                // il sistema trino anche senza aver letto la mappa stellare sul Ponte.
                // Il puzzle finale resta comunque gated da isHologramActive (energia
                // ripristinata + console attivata): la lore dà il NUMERO, non l'accesso.
                state.flags.knowsAboutTrinarySystem = true;
                return {
                    description: "Analizzi la stele. Lo scanner assorbe i dati a una velocità impressionante. È una chiave di volta linguistica, un archivio culturale immenso.[PAUSE]Stato traduzione: 75%\nUna voce quasi perfetta, poetica e malinconica, risuona dal tuo traduttore:\n«Quando i tre soli sanguinarono, sapemmo che il tempo era cenere. Non piangemmo il nostro mondo, perché il mondo è un'idea, e le idee non muoiono. Lo affidammo al Grande Vuoto, perché un nuovo seme potesse attecchire in un terreno non ancora scritto. Il nostro corpo è polvere, ma il nostro ricordo è una stella.»",
                    eventType: 'magic'
                };
            }
        }
    ],
    commands: [
        {
            regex: "^((vai|va) )?(sud|s|corridoio|indietro)$", handler: (state) => {
                state.location = "Corridoio Principale";
                return { description: gameData["Corridoio Principale"].description(state), eventType: 'movement' };
            }
        },
        {
            regex: "^((vai|va) )?(ovest|o)$", handler: (state) => {
                state.location = "Scriptorium";
                return { description: gameData["Scriptorium"].description(state), eventType: 'movement' };
            }
        },
        // TOCCA
        { regex: "^(tocca) (bassorilievi|muri|pareti|incisioni|scene)$", handler: () => ({ description: "Le dita seguono i solchi delle incisioni. La pietra è levigata, ogni taglio perfetto. Senti sotto le dita la storia di una civiltà morta — creature che guardano tre soli, semi che germogliano tra le stelle, navi che partono verso l'infinito. Un epitaffio scolpito nell'eternità." }) },
        { regex: "^(tocca) (altare|pietra|cilindro|incavo|centro)$", handler: () => ({ description: "Appoggi la mano sull'altare. La pietra nera assorbe la luce e il calore. È fredda, ma c'è qualcosa sotto — una risonanza appena percettibile, come se la pietra ricordasse tutte le mani che l'hanno toccata prima di te." }) },
        { regex: "^tocca$", handler: () => ({ description: "Sei nel Santuario del Silenzio. Puoi toccare i bassorilievi o l'altare al centro della stanza." }) },
        // INCIDI (WS3) — una riga umana tra le incisioni K'tharr. Non sblocca nulla:
        // cambia il mondo e si riflette nell'epilogo.
        {
            regex: "^incidi( (bassorilievi|parete|pareti|muro|incisioni|scene|segno|nome|riga))?$", handler: (state) => {
                if (!state.inventory.includes("Taglierina al Plasma")) {
                    return { description: "Non hai uno strumento per incidere.", eventType: 'error' };
                }
                if (state.flags.incisoSantuario) {
                    return { description: "La tua riga è già lì, in basso, dove il fregio lasciava un palmo di pietra nuda. Goffa, umana, tua. Non l'hai cancellata.", eventType: 'error' };
                }
                state.flags.incisoSantuario = true;
                return { description: "Cerchi un angolo libero, in basso, dove il fregio K'tharr lascia un palmo di pietra nuda. Con la taglierina incidi una riga tutta tua — storta accanto alla loro precisione atomica, una grafia umana tra simboli piegati a livello molecolare.[PAUSE]Non racconta un esodo, non custodisce un sapere. Dice soltanto, nella tua lingua, che sei passato di qui e che hai capito. È pochissimo, di fianco a tutto il resto. Ma è vero, ed è tuo.", eventType: 'magic' };
            }
        },
        // USA DISCO SU ALTARE
        {
            regex: "^(usa) (disco|disco di pietra) su (altare|incavo)$", handler: (state) => {
                if (!state.inventory.includes("Disco di Pietra")) {
                    return { description: "Non hai un disco da usare.", eventType: 'error' };
                }
                if (state.flags.steleRevealed || state.flags.stelePresa) {
                    return { description: "L'hai già fatto.", eventType: 'error' };
                }
                const discoIndex = state.inventory.indexOf("Disco di Pietra");
                state.inventory.splice(discoIndex, 1);
                state.flags.steleRevealed = true;
                return { description: "Appoggi il pesante disco di pietra nell'incavo dell'altare. Calza a pennello. Per un istante non succede nulla, poi senti un profondo 'clunk' provenire dall'interno della pietra. Una sezione dell'altare si ritrae silenziosamente, rivelando uno scomparto segreto. All'interno, adagiata su un cuscino di luce solidificata, c'è una tavoletta rettangolare coperta di simboli complessi: la Stele del Ricordo.", eventType: 'magic' };
            }
        },
        // PRENDI STELE
        {
            regex: "^(prendi) (stele|stele del ricordo|tavoletta)$", handler: (state) => {
                if (!state.flags.steleRevealed) {
                    return { description: "Non vedi nessuna stele qui.", eventType: 'error' };
                }
                if (state.flags.stelePresa) {
                    return { description: "L'hai già presa.", eventType: 'error' };
                }
                state.inventory.push("Stele del Ricordo");
                state.flags.stelePresa = true;
                return { description: "Prendi la Stele del Ricordo dallo scomparto. È sorprendentemente leggera e calda al tatto.", eventType: 'item_pickup' };
            }
        }
    ]
};