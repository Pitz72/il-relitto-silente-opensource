import { Room } from '../../types';
import { gameData } from '../gameData';

export const arcaBiologicaRoom: Room = {
    description: (state) => {
        let desc = "ARCA BIOLOGICA\n\nTi fai strada oltre la vegetazione morta e varchi la soglia. L'aria diventa immediatamente gelida, tagliente. Sei in una sala di dimensioni colossali, così vasta che le pareti lontane si perdono nell'oscurità. L'architettura è austera, funzionale. File e file di capsule di stasi criogenica, simili a sarcofagi di vetro scuro, si estendono a perdita d'occhio in corridoi ordinati. Sono centinaia, forse migliaia. Un sottile strato di brina ricopre ogni superficie, e il tuo respiro si condensa all'interno del casco.\nIl silenzio qui è diverso. È il silenzio fermo e definitivo di un cimitero.";

        if (!state.flags['picked_Arca Biologica_dispositivo_medico'] && !state.inventory.includes("Dispositivo Medico Alieno")) {
            desc += "\nNoti una figura immobile accasciata contro una delle capsule vicine. Un cadavere mummificato in una tuta antica.";
        } else {
            desc += "\nIl cadavere dell'antico astronauta giace ancora lì, testimone silenzioso della tragedia.";
        }

        // Una volta esaminato il cadavere, gli oggetti che stringe diventano
        // esplicitamente raccoglibili: prima non erano nominati nella descrizione
        // e si potevano prendere solo a tentativi (BUG B22).
        if (state.flags.cadavereEsaminatoFirst) {
            const recuperabili: string[] = [];
            if (!state.flags['picked_Arca Biologica_dispositivo_medico'] && !state.inventory.includes("Dispositivo Medico Alieno")) {
                recuperabili.push("un Dispositivo Medico Alieno");
            }
            if (!state.flags['picked_Arca Biologica_cristallo_dati_opaco'] && !state.inventory.includes("Cristallo Dati Opaco")) {
                recuperabili.push("un Cristallo Dati Opaco");
            }
            if (recuperabili.length > 0) {
                desc += `\nTra le mani irrigidite del cadavere, allentati nella presa, distingui ${recuperabili.join(" e ")}: puoi PRENDERLI.`;
            }
        }

        desc += "\nL'unica uscita è a EST, verso la serra.";
        return desc;
    },
    items: [
        {
            id: 'capsule',
            name: 'capsule',
            synonyms: ['sarcofagi', 'contenitori', 'capsula'],
            description: "Sono capsule di stasi criogenica. La loro superficie di vetro scuro è gelida al tatto. Attraverso il materiale opaco non riesci a distinguere cosa ci sia all'interno. Ce ne sono troppe per contarle.",
            onAnalyze: (state) => {
                if (state.flags['capsulaAnalizzata']) {
                    return { description: "Hai già analizzato le capsule. La litania di fallimenti è ancora nella memoria del tuo scanner.", eventType: null };
                }
                state.flags['capsulaAnalizzata'] = true;
                return {
                    description: `Punti lo scanner verso la capsula più vicina. L'apparecchio emette un 'bip' lento e malinconico.[PAUSE]LETTURA CAMPIONE: [SPECIE K'THARR: PREDATORE ALFA]\nSTATO: deceduto. Integrità genomica: 0.02%.\nCAUSA: guasto catastrofico dei sistemi di supporto vitale nel ciclo 9.875.342.[PAUSE]Provi con un'altra capsula. E un'altra ancora. La risposta è sempre la stessa, una litania di fallimenti.\n[FLORA DI XYLOS: SIMBIONTE]... deceduto.\n[FORMA DI VITA SILICEA: COSTRUTTORE]... deceduto.[PAUSE]Questa non era una stiva. Era un'arca. Un intero ecosistema, forse di un intero mondo, conservato qui. E ora è tutto perduto.[PAUSE](Rimani immobile a lungo. Qualcuno ha provato a salvare un mondo intero per chi sarebbe venuto dopo. E chi sarebbe venuto dopo non è arrivato in tempo. O forse è ancora in cammino. Forse è ancora possibile.)`,
                    eventType: 'magic',
                    typewriter: true
                };
            },
            isFixed: true
        },
        {
            id: 'brina',
            name: 'brina',
            synonyms: ['ghiaccio', 'pavimento'],
            description: "È uno strato sottile di cristalli di ghiaccio. L'ambiente è ben al di sotto dello zero.",
            details: "Il sensore termico segna -197°C. La criogenesi ha mantenuto questo ambiente a temperature vicino all'azoto liquido per millenni. È la ragione per cui le capsule sono ancora strutturalmente intatte, anche se i loro occupanti non lo sono.",
            isFixed: true
        },
        {
            id: 'cadavere',
            name: 'cadavere',
            synonyms: ['corpo', 'figura', 'astronauta'],
            description: "Giace rannicchiato contro una capsula. Indossa una tuta simile alla tua, ma di un design molto più antico. Stringe qualcosa tra le mani.",
            details: "È morto da secoli. La tuta ha preservato il corpo, mummificandolo. Tra le mani stringe un dispositivo medico e un piccolo cristallo scuro.",
            onAnalyze: (state) => {
                const alreadyScanned = state.flags['cadavereAnalizzato'];
                state.flags['cadavereAnalizzato'] = true;
                if (alreadyScanned) {
                    return { description: "Hai già analizzato l'astronauta. I dati sono già nel tuo scanner.", eventType: null };
                }
                return {
                    description: `Lo scanner emette un tono lento, reverenziale, mentre elabora i dati.
[PAUSE]
ANALISI BIOMETRICA — SOGGETTO ANONIMO
SPECIE: Homo sapiens — compatibilità genomica 99.97%
ETÀ BIOLOGICA AL DECESSO: circa 35 anni solari
CAUSA DEL DECESSO: ipotermia progressiva, insufficienza multiorgano
DATA STIMATA: circa 847 anni prima del calendario standard
[PAUSE]
Un essere umano. Morto qui, su questa nave aliena, quasi un millennio fa.
Non sei il primo ad aver abbordato questo relitto. Qualcuno ci è arrivato prima di te — molto prima. Come? Perché? Forse cercava le stesse risposte.
[PAUSE]
Noti i dettagli della tuta: è di fabbricazione umana, ma con modifiche artigianali che non riconosci. Qualcuno aveva tentato di adattarla agli ambienti alieni. Nei taschini laterali, oltre agli oggetti che stringeva, lo scanner individua il profilo di un registratore vocale ormai scarico e irrecuperabile.
Qualunque cosa avesse da dirti, è andata perduta con il freddo.`,
                    eventType: 'magic',
                };
            },
            isFixed: true
        },
        {
            id: 'tuta_antica',
            name: 'tuta',
            synonyms: ['tuta spaziale', 'scafandro', 'tuta antica', 'placca', 'badge', 'aurora', 'missione aurora', 'aurora-7'],
            description: "La tuta è di fabbricazione umana — simile alla tua per concept ma di un design molto più antico. Sul petto, quasi illeggibile per l'usura, c'è una placca identificativa.",
            onAnalyze: (state) => {
                if (state.flags.tutaAnalizzata) {
                    return { description: "Hai già analizzato la tuta. I dati identificativi sono nel tuo scanner.", eventType: null };
                }
                state.flags.tutaAnalizzata = true;
                return {
                    description: `Lo scanner lavora in silenzio per qualche secondo, poi emette una serie di bip rapidi.[PAUSE]ANALISI MANIFATTURA\nOrigine: terrestre. Età stimata: 780-850 anni solari.\nStandard costruttivo: pre-coloniale. Modifiche artigianali post-produzione rilevate — adattamenti per ambienti a bassa pressione e temperatura criogenica.[PAUSE]IDENTIFICAZIONE MISSIONE\nLogo parzialmente leggibile sul petto: AURORA-7.\nProgramma di esplorazione deep-space. Classificazione: missione non documentata negli archivi pubblici.[PAUSE]NOTA MANOSCRITTA — incisa sul retro della placca con uno strumento appuntito:\n"SE TROVI QUESTO: NON SIAMO SOLI. ERANO QUI PRIMA DI NOI. IL SEME È LA PROVA.\n— L.V."[PAUSE](Ti blocchi sulla firma. L.V. Non un nome completo — solo due iniziali e un messaggio. Qualcuno, ottocento anni fa, ha raggiunto questa nave, ha capito quello che stai capendo tu adesso, e ha trovato solo il modo di lasciare due lettere incise nel metallo. Sperando che qualcuno, un giorno, le trovasse.)[PAUSE]Come L.V. abbia raggiunto questa nave — con quale vettore, da dove, da solo o con altri — sono domande che il tuo scanner non può rispondere. Non ci sono registri della missione AURORA-7 negli archivi pubblici, e questo corpo non porta altri dati. Forse lo ha voluto così. Forse l'unica cosa che importava era che il messaggio arrivasse, non chi lo aveva portato. Due lettere. Un fatto. Il resto è silenzio — e il silenzio, su questa nave, ha una forma precisa.`,
                    eventType: 'magic'
                };
            },
            isFixed: true
        },
        {
            id: 'dispositivo_medico',
            name: 'Dispositivo Medico Alieno',
            synonyms: ['dispositivo', 'strumento', 'medico'],
            description: "È uno strumento portatile dal design elegante. Sembra intatto.",
            details: "È un rigeneratore tissutale a risonanza. Tecnologia medica avanzata.",
            isPickable: true
        },
        {
            id: 'cristallo_dati_opaco',
            name: 'Cristallo Dati Opaco',
            synonyms: ['cristallo', 'cristallo scuro'],
            description: "Un piccolo cristallo scuro, freddo e inerte.",
            details: "Sembra un supporto di memoria, ma è 'dormiente'. Ha bisogno di una fonte di energia o di uno stimolo per attivarsi.",
            isPickable: true
        }
    ],
    commands: [
        // ESAMINA CADAVERE — primo contatto (intercetta prima dell'item system)
        { regex: "^(esamina|guarda) (cadavere|corpo|figura|forma|forma immobile|resti|astronauta|alieno|creatura)$", handler: (state) => {
            if (!state.flags.cadavereEsaminatoFirst) {
                state.flags.cadavereEsaminatoFirst = true;
                return {
                    description: `Non è uno degli alieni.\n\nLa tuta ha la forma sbagliata per una fisiologia K'tharr. È costruita attorno a un corpo come il tuo — stesse proporzioni, stessi punti di articolazione. La tecnologia è più elementare, più vecchia, ma il principio è identico. Un essere umano ha progettato quella tuta. Un essere umano l'ha indossata.\n\nGiace rannicchiato contro la capsula, come se si fosse appoggiato lì e non si fosse mai più rialzato. Le mani stringono ancora qualcosa.\n\nNon riesci subito a staccare gli occhi da quei guanti. Sono uguali ai tuoi.`
                };
            }
            return { description: "Giace rannicchiato contro una capsula. Indossa una tuta simile alla tua, ma di un design molto più antico. Stringe qualcosa tra le mani." };
        }},
        // MOVIMENTO
        {
            regex: "^((vai|va) )?(est|e|serra|indietro)$", handler: (state) => {
                state.location = "Serra Morente";
                return { description: gameData["Serra Morente"].description(state), eventType: 'movement' };
            }
        },
        { regex: "^((vai|va) )?(nord|sud|ovest|n|s|o)$", handler: () => ({ description: "Cammini per un po' lungo i corridoi silenziosi di questo cimitero galattico, ma il panorama non cambia. File infinite di tombe di vetro. Con un brivido, decidi di tornare indietro." }) },
        // TOCCA
        { regex: "^(tocca) (capsule|sarcofagi|contenitori|capsula)$", handler: () => ({ description: "Il vetro delle capsule è gelido, coperto di un sottile strato di brina. Il tuo guanto si appanna a contatto con la superficie. Senti zero vibrazioni, zero calore. Sono tombe perfette." }) },
        { regex: "^(tocca) (brina|ghiaccio|pavimento)$", handler: () => ({ description: "La brina si frantuma al minimo tocco, rivelando il metallo lucido sotto. Il freddo è così intenso che lo senti anche attraverso l'isolamento della tuta." }) },
        { regex: "^(tocca) (cadavere|corpo|figura|astronauta)$", handler: () => ({ description: "Non riesci a farlo. C'è qualcosa di profondamente sbagliato nel disturbare un corpo che ha riposato così a lungo." }) },
        { regex: "^tocca$", handler: () => ({ description: "Sei in una sala criogenica. Le capsule sono ovunque, gelide e silenziose. Il pavimento è coperto di brina." }) },
        // ANALIZZA — copertura generale stanza
        {
            regex: "^(analizza) (stanza|ambiente|aria|tutto|arca|sala)$", handler: () => ({
                description: "Lo scanner scansiona l'ambiente. Temperatura: -197°C. Pressione: quasi zero. Il sistema di criogenesi ha mantenuto queste condizioni per un periodo di tempo inimmaginabile.\nLe capsule sono centinaia — forse migliaia. Ogni segnatura biologica letta è spenta. Non c'è alcun segno di vita. Solo dati, e silenzio.",
                eventType: 'magic'
            })
        },
        // INCIDI (WS3) — un segno accanto al compagno umano caduto (L.V.). Non
        // sblocca nulla: cambia il mondo e si riflette nell'epilogo.
        {
            regex: "^incidi( (capsula|cadavere|astronauta|corpo|parete|muro|segno|nome|lv|l\\.v\\.|lapide))?$", handler: (state) => {
                if (!state.inventory.includes("Taglierina al Plasma")) {
                    return { description: "Non hai uno strumento per incidere.", eventType: 'error' };
                }
                if (!state.flags.cadavereEsaminatoFirst) {
                    return { description: "Esiti. C'è una figura accasciata contro una delle capsule, ma non l'hai ancora guardata davvero. Prima di lasciare un segno, vorresti sapere accanto a chi lo stai lasciando.", eventType: 'error' };
                }
                if (state.flags.incisoArca) {
                    return { description: "Il tuo segno è già lì, sul vetro della capsula, accanto al posto in cui ha riposato per ottocento anni. Non sei più l'unico essere umano vivo ad averlo guardato.", eventType: 'error' };
                }
                state.flags.incisoArca = true;
                const knowsLV = state.flags.tutaAnalizzata;
                const corpo = knowsLV
                    ? "accanto al punto in cui L.V., ottocento anni fa, aveva graffiato due lettere nel metallo sperando che qualcuno le trovasse"
                    : "accanto al compagno che è arrivato qui prima di te e non è più ripartito";
                return { description: `Ti inginocchi accanto all'astronauta. Regoli la taglierina al minimo e incidi un segno sul vetro scuro della capsula, ${corpo}.[PAUSE]Non è un nome — non sapresti quale scrivere, e forse non importa. È solo la prova che qualcun altro è venuto, ha visto, e non se n'è andato senza fermarsi. Ottocento anni vi separano. Lo stesso gesto vi tiene insieme.`, eventType: 'magic' };
            }
        },
        // USA / APRI
        { regex: "^(apri) (capsula|capsule)$", handler: () => ({ description: "Le capsule sono sigillate ermeticamente e i meccanismi di apertura sono privi di energia. Anche se potessi, senti che sarebbe una profanazione." }) },
        { regex: "^(usa) (taglierina|taglierina al plasma) su (capsula|capsule)$", handler: () => ({ description: "Anche se la taglierina potesse incidere il vetro criogenico, non servirebbe a nulla. Non c'è nessuno da salvare qui. Abbassi l'attrezzo." }) },
    ]
};