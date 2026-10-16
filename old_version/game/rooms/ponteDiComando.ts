import { Room } from '../../types';
import { gameData } from '../gameData';

export const ponteDiComandoRoom: Room = {
    description: (state) => {
        let desc = "PONTE DI COMANDO\n\nEntri in una sala vasta e circolare, avvolta in una profonda oscurità e in un silenzio tombale. Il soffitto è una cupola di cristallo nero impenetrabile. Al centro della stanza, una complessa struttura a forma di stella fluttua a mezz'aria, immobile e spenta. Tutt'intorno, disposte a raggiera, ci sono diverse postazioni di controllo, anch'esse silenziose.";

        if (state.flags.isHologramActive) {
            desc = "PONTE DI COMANDO\n\nSei nel vasto Ponte di Comando circolare. L'ambiente ora non è più buio. Al centro, la struttura si è animata e proietta sulla cupola una magnifica e silenziosa mappa stellare tridimensionale. La mappa mostra una rotta chiara che attraversa il vuoto interstellare, con un punto di arrivo inconfondibile: il tuo sistema solare.";
        }

        desc += "\nUn'unica postazione, più grande delle altre, si trova direttamente di fronte a te. Sembra la postazione del comandante.";

        if (state.flags.isFinalDoorOpen) {
            desc += "\nDietro la postazione del comandante, la porta circolare è aperta, rivelando un passaggio verso l'oscurità sacra del Santuario Centrale.";
        } else {
            desc += "\nUna sottile porta circolare, a malapena distinguibile, è incassata nella parete dietro la postazione del comandante. È l'unica altra uscita oltre a quella da cui sei entrato a SUD.";
        }

        return desc;
    },
    items: [
        {
            id: 'postazione_comandante',
            name: 'postazione comandante',
            synonyms: ['postazione', 'console', 'postazione principale'],
            description: "È più grande delle altre. La sua superficie liscia e scura sembra attendere un input. C'è un'unica depressione a forma di mano al centro della console.",
            details: "L'analisi conferma che questa è la console di comando principale. La depressione a forma di mano è un'interfaccia bio-metrica. Sembra essere il catalizzatore per risvegliare i sistemi del ponte.",
            isFixed: true,
            onUse: (state) => {
                if (state.flags.isHologramActive) {
                    return { description: "Hai già attivato la console. La mappa stellare brilla sopra di te.", eventType: 'error' };
                }
                // La console del Ponte richiede l'energia ripristinata dai Laboratori di
                // Risonanza (USA CRISTALLO SU MACCHINARI): è là che il flusso viene
                // reindirizzato verso il Ponte. Senza, la sotto-quest del Cristallo non
                // sbloccherebbe nulla (BUG B10).
                if (!state.flags.isPowerRestored) {
                    return { description: "Appoggi la mano sulla depressione bio-metrica, ma la console resta morta e gelida. Nessun bagliore, nessuna vibrazione. Manca l'energia: questa postazione — e l'intero Ponte — sono inerti finché i sistemi della nave non vengono ripristinati.", eventType: 'error' };
                }
                state.flags.isHologramActive = true;
                const intro = state.flags.isWestDoorUnlocked
                    ? "Appoggi la tua mano guantata sulla depressione. La console reagisce al tuo tocco, riconoscendoti non per la tua identità, ma per il tuo intento. Riconosce che hai riunito l'eredità della nave."
                    : "Appoggi la tua mano guantata sulla depressione. La console reagisce al tuo tocco — non alle tue credenziali, ma alla tua presenza.";
                return { description: `${intro}[PAUSE]Un'ondata di energia silenziosa attraversa la stanza. Le postazioni si illuminano. La struttura centrale si anima e proietta sulla cupola una magnifica e silenziosa mappa stellare tridimensionale.[PAUSE]La mappa mostra una rotta chiara, un viaggio millenario che attraversa il vuoto interstellare. Il punto di arrivo è inconfondibile: il tuo sistema solare.`, eventType: 'magic' };
            }
        },
        {
            id: 'struttura_centrale',
            name: 'struttura centrale',
            synonyms: ['struttura', 'stella', 'centro stanza'],
            description: "È una scultura metallica complessa, formata da anelli e punte interconnessi. Sembra un proiettore olografico di incredibile complessità.",
            isFixed: true
        },
        {
            id: 'mappa_stellare',
            name: 'mappa stellare',
            synonyms: ['mappa', 'ologramma', 'rotta'],
            description: "Una proiezione olografica di immensa bellezza.",
            details: "Segui la rotta a ritroso, partendo da casa. Il viaggio ti porta in un'altra galassia, fino a un ammasso stellare denso e luminoso. Il punto di origine è inequivocabile: un sistema trino, con tre soli che danzano l'uno attorno all'altro. La culla della loro civiltà.",
            isFixed: true,
            onUse: (_state) => {
                // USA MAPPA non ha senso: è un ologramma proiettato.
                // Il flag knowsAboutTrinarySystem viene settato dal comando ESAMINA MAPPA
                // definito nella lista commands, che permette il side-effect sullo stato.
                return { description: "Non puoi usarla, è un ologramma.", eventType: 'error' };
            },
            onTranslate: (state) => {
                if (!state.flags.isHologramActive) {
                    return { description: "Non c'è nessuna mappa proiettata da tradurre. Il Ponte è ancora inerte.", eventType: 'error' };
                }
                const pct = (state.flags.translationProgress as number) ?? 0;
                if (pct < 18) {
                    return { description: "Lungo la rotta, accanto a ogni tappa, galleggiano piccole annotazioni in simboli alieni. La matrice non le aggancia: per ora sono solo decorazioni di luce su un viaggio che non sai ancora leggere.", eventType: 'magic' };
                }
                if (pct < 75) {
                    return { description: "Qualche annotazione si lascia leggere a tratti: numeri di cicli, distanze, e una parola sola, ripetuta con insistenza vicino al punto d'arrivo — il tuo sistema solare. Non riesci ancora a renderla, ma è scritta più grande delle altre, come se contasse più di tutto il resto.", eventType: 'magic' };
                }
                let d = "Le annotazioni si aprono lungo tutta la rotta: segnavia, un conto alla rovescia di cicli che nessuno avrebbe visto scadere, le coordinate della partenza presso i tre soli. E accanto al tuo sole, finalmente, quella parola ripetuta:\n\n«giardino — qui, se da qualche parte.»";
                if (pct >= 100) {
                    d += "[PAUSE]Proprio sopra il tuo sistema solare, in una grafia più piccola, aggiunta dopo, qualcuno ha lasciato una riga che non è una rotta:\n\n«Non torneremo a vedere se è fiorito. Va bene così.»";
                }
                return { description: d, eventType: 'magic' };
            }
        },
        {
            id: 'porta_circolare',
            name: 'porta circolare',
            synonyms: ['porta'],
            description: "È una porta perfettamente circolare, senza maniglie o simboli visibili, tranne per un piccolo meccanismo di blocco al centro. Sembra condurre al cuore della nave.",
            details: "Il meccanismo di blocco è un piccolo pannello con diverse punte luminose retrattili.",
            isFixed: true
        }
    ],
    commands: [
        // MOVIMENTO
        {
            regex: "^((vai|va) )?(sud|s|corridoio|indietro)$", handler: (state) => {
                state.location = "Corridoio Principale";
                return { description: gameData["Corridoio Principale"].description(state), eventType: 'movement' };
            }
        },
        {
            regex: "^(entra|vai dentro|usa porta|vai porta|vai porta circolare|entra santuario|entra portale|entra porta)$", handler: (state) => {
                if (state.flags.isFinalDoorOpen) {
                    state.location = "Anticamera Santuario";
                    return { description: gameData["Anticamera Santuario"].description(state), eventType: 'movement' };
                }
                return { description: "La porta è chiusa.", eventType: 'error' };
            }
        },
        {
            regex: "^(apri) (porta|porta circolare)$", handler: (state) => {
                if (state.flags.isFinalDoorOpen) {
                    return { description: "La porta è già aperta.", eventType: 'error' };
                }
                return { description: "Non si apre manualmente. Devi attivare il meccanismo di sblocco.", eventType: 'error' };
            }
        },
        // ESAMINA PORTA — hint contestuale quando conosci il sistema trino
        {
            regex: "^(esamina|guarda|analizza) (porta|porta circolare|meccanismo|pannello punte)$", handler: (state) => {
                if (state.flags.isFinalDoorOpen) {
                    return { description: "La porta circolare è aperta." };
                }
                if (state.flags.knowsAboutTrinarySystem) {
                    return { description: "La porta circolare presenta un meccanismo con cinque punte luminose retrattili disposte a raggiera sul pannello centrale. Guardandole, pensi involontariamente alla mappa stellare: tre soli che danzano intorno al loro centro. Tre. Il numero sembra rilevante. Forse attivare esattamente tre punte è la chiave.", eventType: null };
                }
                return { description: "Il meccanismo di sblocco al centro presenta diverse punte luminose retrattili. Senza capire il principio di funzionamento, non sai quale combinazione usare. Forse esplorare di più la nave ti darà indizi.", eventType: null };
            }
        },
        // TOCCA PUNTE senza numero — guida il giocatore verso la soluzione
        {
            regex: "^(tocca|attiva|usa|premi) (punte|pulsanti|punti|luci|meccanismo)$", handler: (state) => {
                if (state.flags.isFinalDoorOpen) {
                    return { description: "La porta è già aperta.", eventType: 'error' };
                }
                if (!state.flags.isHologramActive) {
                    return { description: "Non c'è niente di attivo su cui agire.", eventType: 'error' };
                }
                if (state.flags.knowsAboutTrinarySystem) {
                    return { description: "Le punte luminose attendono un input preciso. Hai visto la risposta nella mappa stellare: il loro sistema aveva tre soli.", eventType: null };
                }
                return { description: "Sfiori alcune punte a caso — nulla accade. Il meccanismo sembra richiedere una combinazione specifica. Forse c'è un indizio da qualche parte.", eventType: 'error' };
            }
        },
        // ESAMINA MAPPA (Custom per side-effect + monologo interiore)
        {
            regex: "^(esamina|guarda) (mappa|mappa stellare)$", handler: (state) => {
                if (!state.flags.isHologramActive) {
                    return { description: "Non c'è nessuna mappa da esaminare.", eventType: 'error' };
                }
                state.flags.knowsAboutTrinarySystem = true;
                let mapDesc = "Segui la rotta a ritroso, partendo da casa. Il viaggio ti porta in un'altra galassia, fino a un ammasso stellare denso e luminoso. Il punto di origine è inequivocabile: un sistema trino, con tre soli che danzano l'uno attorno all'altro. La culla della loro civiltà.";
                if (!state.flags.mappaMonologo) {
                    state.flags.mappaMonologo = true;
                    mapDesc += "[PAUSE](Rimani immobile davanti alla mappa per un lungo momento. Segui la rotta ancora una volta, e ancora. La freccia punta verso casa — verso il sole che hai conosciuto per tutta la vita, verso Europa, verso la Santa Maria che aspetta nell'oscurità fuori da questo scafo. Non riesci a capire esattamente quando la meraviglia si è trasformata in qualcos'altro. Come il frammento di un ricordo che non hai mai avuto.)";
                }
                return { description: mapDesc };
            }
        },
        // ANALIZZA MAPPA — dettaglio proto-fertile (D5)
        {
            regex: "^(analizza) (mappa|mappa stellare|rotta|ologramma)$", handler: (state) => {
                if (!state.flags.isHologramActive) {
                    return { description: "Non c'è nessuna mappa attiva da analizzare.", eventType: 'error' };
                }
                return { description: "Lo scanner analizza i dati sovrapposti alla proiezione olografica. Oltre alla rotta principale emergono annotazioni in simboli alieni — alcune le riconosci già, altre sono ancora al limite della comprensione del traduttore.\n\nUna di esse è ripetuta accanto al punto di arrivo, il tuo sistema solare, con maggiore enfasi rispetto alle altre. Il traduttore propone: 'Proto-fertile. Firma amino-acida confermata. Candidato primario — classe Giardino.'\n\nNon hanno scelto questo sistema a caso: lo stavano studiando da prima ancora di partire. Il sistema solare era già nei loro registri come il luogo più promettente — quello in cui la vita avrebbe attecchito.", eventType: 'magic' };
            }
        },
        // PUZZLE FINALE — regex espansa per coprire varianti naturali di input
        {
            regex: "^(tocca|attiva|usa|premi) (tre|3) (punte|pulsanti|punti|luci)( (su|della) (porta|pannello))?$", handler: (state) => {
                if (!state.flags.knowsAboutTrinarySystem) {
                    return { description: "Non sai quale combinazione usare.", eventType: 'error' };
                }
                // Il sapere può venire dalla mappa O dalla Stele (WS5), ma il pannello
                // resta inerte finché il Ponte non è alimentato e risvegliato: la lore
                // dà il numero, non l'accesso. Preserva l'obbligo di energia (B10).
                if (!state.flags.isHologramActive) {
                    return { description: "Sai quante punte attivare — tre, come i loro soli. Ma il pannello della porta è morto: nessuna punta risponde. Il meccanismo resta inerte finché il Ponte non viene alimentato e la console di comando risvegliata.", eventType: 'error' };
                }
                if (state.flags.isFinalDoorOpen) {
                    return { description: "La porta è già aperta.", eventType: 'error' };
                }
                state.flags.isFinalDoorOpen = true;
                return { description: "Ricordando la mappa stellare, la culla a tre soli, appoggi la mano sul pannello e attivi tre delle punte luminose.[PAUSE]Un 'clic' armonioso risuona nel silenzio. La porta circolare si apre con un movimento fluido e silenzioso, rivelando una stanza avvolta in un'oscurità totale e sacra.", eventType: 'magic' };
            }
        },
        // TOCCA — oggetti specifici e handler generico
        {
            regex: "^(tocca) (struttura|stella|proiettore|centro)$", handler: (state) => {
                if (state.flags.isHologramActive) {
                    return { description: "Ti avvicini alla struttura animata. L'ologramma della mappa ti avvolge le dita — luce proiettata, nessuna consistenza. La struttura metallica sottostante è tiepida, come se l'energia che l'attraversa avesse scaldato il metallo dall'interno." };
                }
                return { description: "La struttura stellare è spenta e immobile. La sua superficie metallica è fredda, quasi gelatinosa al tatto — un materiale che non conosci. Le punte irradiano verso l'esterno come raggi, perfettamente equidistanti." };
            }
        },
        {
            regex: "^(tocca) (postazione|console|pannello|controlli|depressione)$", handler: (state) => {
                if (state.flags.isHologramActive) {
                    return { description: "La console è ancora attiva. La depressione bio-metrica conserva il calore della tua mano precedente. Sotto le dita senti una vibrazione impercettibile — il sistema continua a elaborare." };
                }
                return { description: "Appoggi la mano sulla superficie scura e liscia. È fredda, completamente inerte. Al centro, la depressione a forma di mano sembra attendere. Senti che basterebbe appoggiarci la mano con intenzione." };
            }
        },
        {
            regex: "^(tocca) (porta|porta circolare|meccanismo)$", handler: (state) => {
                if (state.flags.isFinalDoorOpen) {
                    return { description: "La porta è aperta. Il bordo circolare è levigato, senza sbavature, come se fosse stato tagliato con precisione assoluta." };
                }
                return { description: "La porta circolare non ha maniglie né incavi. La superficie è più fredda delle pareti circostanti. Il meccanismo al centro — cinque punte luminose disposte a raggiera — non reagisce al tocco semplice." };
            }
        },
        {
            regex: "^tocca$", handler: () => ({
                description: "Cosa vuoi toccare? Sul Ponte di Comando puoi toccare la struttura centrale, la postazione del comandante o la porta circolare."
            })
        },
    ]
};