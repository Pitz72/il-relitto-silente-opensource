import { Room } from '../../types';
import { gameData } from '../gameData';

export const scriptoriumRoom: Room = {
    description: (state) => {
        let desc = "SCRIPTORIUM\n\nEntri in una biblioteca circolare, ma al posto dei libri, le pareti sono costellate di nicchie scure. Dalla maggior parte di esse, un proiettore olografico proietta a mezz'aria globi di testo alieno che turbinano lentamente, illeggibili e complessi. L'aria è tesa, carica di una quiete che sembra trattenere il respiro.\n\nAl centro della stanza, quasi nascosta dall'alone dei globi, c'è una superficie orizzontale bassa — non una console. Una lastra di materiale scuro, opaco, leggermente inclinata verso chi la usa. I bordi sono consunti. Intorno, in un ordine preciso che parla di abitudine, giacciono utensili con punte di varie dimensioni.";

        // Controllo flag picked_Scriptorium_disco_pietra (discoPreso era un flag
        // morto, mai scritto: rimosso — BUG B20)
        if (!state.flags['picked_Scriptorium_disco_pietra'] && !state.inventory.includes("Disco di Pietra")) {
            desc += "\nUna delle nicchie sulla parete nord è buia. Il suo proiettore è spento e tremola debolmente.";
        } else {
            desc += "\nUna delle nicchie sulla parete nord è buia. Il proiettore, ora libero dall'ostruzione, è spento e inerte.";
        }

        desc += "\nL'unica uscita visibile è a EST. Tuttavia, dietro la postazione del proiettore olografico, noti una porta sottile, che a un primo sguardo ti era sfuggita, e che conduce più in profondità in quest'ala della nave, verso NORD.";
        return desc;
    },
    items: [
        {
            id: 'proiettori',
            name: 'proiettori',
            synonyms: ['nicchie', 'testo', 'ologrammi', 'globi', 'globi di testo'],
            description: "Sono archivi di dati olografici. Il testo è un flusso costante di simboli alieni che cambiano e si ricombinano. Senza una chiave di lettura, sono solo bellissime e incomprensibili opere d'arte digitale.",
            details: "Lo scanner rileva un'enorme densità di dati compressi all'interno dei campi olografici. Stai guardando l'equivalente di intere biblioteche, ma la tecnologia di codifica è al di là della tua comprensione.",
            isFixed: true
        },
        {
            id: 'proiettore_rotto',
            name: 'proiettore rotto',
            synonyms: ['proiettore', 'proiettore spento', 'nicchia buia'],
            description: "Questo proiettore non funziona. Invece di un ologramma, emette solo qualche scintilla intermittente. Guardando più da vicino, vedi la causa del malfunzionamento: un pesante disco di pietra scura è incastrato nel meccanismo di proiezione, bloccandolo.",
            details: "Il meccanismo di proiezione è intatto ma ostruito. Rimuovendo l'oggetto estraneo, potresti non ripararlo, ma almeno recuperare l'oggetto.",
            isFixed: true
        },
        {
            id: 'lastra',
            name: 'lastra',
            synonyms: ['superficie', 'piano', 'utensili', 'strumenti', 'iscrizioni'],
            description: "La superficie è coperta di simboli incisi fisicamente nel materiale — non olografici, non digitali. Sono permanenti, tracciati con uno strumento in profondità, con pressione variabile che suggerisce ritmo e intenzione. Accanto, gli utensili sono disposti nell'ordine di chi sa di aver finito.",
            details: "Lo scanner non riesce a leggere il contenuto — la lingua è la stessa della Stele, ma la densità dei simboli è estrema. Rileva però che queste incisioni sono tra le ultime prodotte in questa stanza. Non un archivio: una firma. L'ultima cosa che qualcuno ha voluto lasciare in una forma che nessuna interruzione di corrente potesse cancellare.",
            isFixed: true
        },
        {
            id: 'disco_pietra',
            name: 'Disco di Pietra',
            synonyms: ['disco'],
            description: "È un disco di pietra nera, pesante e denso, spesso circa dieci centimetri. La sua superficie è coperta da incisioni complesse, simili ma non identiche a quelle sui bassorilievi del santuario. Riconosci alcuni dei simboli: li hai visti sull'altare di pietra nera nella sala da cui vieni.",
            details: "L'analisi conferma che il disco ha una massa e una densità specifiche, molto elevate. La sua forma circolare e le sue proprietà corrispondono esattamente ai requisiti del meccanismo che hai rilevato nell'altare del Santuario. Questa è la chiave.",
            isPickable: true
        }
    ],
    commands: [
        // MOVIMENTO
        {
            regex: "^((vai|va) )?(est|e|santuario|indietro)$", handler: (state) => {
                state.location = "Santuario del Silenzio";
                return { description: gameData["Santuario del Silenzio"].description(state), eventType: 'movement' };
            }
        },
        {
            regex: "^((vai|va) )?(nord|n)$", handler: (state) => {
                state.location = "Arca della Memoria";
                return { description: gameData["Arca della Memoria"].description(state), eventType: 'movement' };
            }
        },
        // TOCCA
        { regex: "^(tocca) (proiettori|nicchie|ologrammi|globi|testo)$", handler: () => ({ description: "Le dita attraversano i globi olografici come se fossero fumo digitale. Il tuo passaggio disturba momentaneamente le traiettorie dei simboli — poi si ricompongono, indifferenti, come uno stormo di uccelli richiamato dall'istinto." }) },
        { regex: "^(tocca) (pareti|muro|nicchie vuote)$", handler: () => ({ description: "Le pareti dello Scriptorium sono lisce e leggermente tiepide. La bioluminescenza sotto la superficie risponde al tuo tocco con un brevissimo impulso, come un riflesso condizionato che sopravvive alla mente che lo aveva programmato." }) },
        { regex: "^(tocca) (lastra|superficie|piano|iscrizioni|utensili|strumenti)$", handler: () => ({ description: "Le incisioni sono profonde, tracciate con pressione decisa. Senti i margini taglienti dei simboli attraverso i guanti. Non sai leggere questa lingua — ma sai riconoscere urgenza, quando la vedi nella forma di qualcosa di irreversibile." }) },
        { regex: "^tocca$", handler: () => ({ description: "Sei nello Scriptorium. Puoi toccare i proiettori olografici, le pareti, o la lastra al centro con le sue iscrizioni." }) },
        // LEGGI — risposta contestuale
        // Nota: "leggi X" viene già convertito a "analizza X" da normalizeCommand.
        // Questo handler intercetta solo "leggi" senza argomenti, che non viene convertito.
        { regex: "^leggi$", handler: () => ({ description: "Le pareti sono coperte di globi olografici con testo alieno. Prova ANALIZZA PROIETTORI per una lettura scanner, oppure ANALIZZA [oggetto] per tentare una traduzione.", eventType: null }) },
    ]
};