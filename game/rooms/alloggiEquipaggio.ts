import { Room } from '../../types';
import { gameData } from '../gameData';

export const alloggiEquipaggioRoom: Room = {
    description: (state) => {
        let desc = "ALLOGGI DELL'EQUIPAGGIO\n\nVarchi la soglia ed entri in un ambiente pervaso da un silenzio reverenziale. La stanza è circolare, simile al ponte, ma più piccola. Le pareti sono suddivise in una serie di alcove a nido d'ape, disposte su più livelli. Non ci sono letti o arredi, solo queste nicchie lisce che emanano la stessa, debole luce bluastra del resto della nave. L'atmosfera è di una serenità monastica.";
        if (!state.flags.cilindroPreso) {
            desc += "\nIn una delle alcove più basse, riesci a scorgere una forma immobile.";
        } else {
            desc += "\nIn una delle alcove più basse, riposano i resti di uno degli occupanti della nave.";
        }
        desc += "\nL'unica uscita è a NORD.";
        return desc;
    },
    items: [
        {
            id: 'alcove',
            name: 'alcove',
            synonyms: ['nicchie', 'letti', 'pareti', 'celle'],
            description: "Sono celle di riposo o meditazione. Sono lisce e prive di qualsiasi oggetto personale. Sembrano più bozzoli che letti.",
            isFixed: true
        },
        {
            id: 'cadavere',
            name: 'cadavere',
            synonyms: ['forma', 'forma immobile', 'resti', 'corpo', 'alieno', 'creatura'],
            description: "Il corpo è conservato fino al dettaglio. La creatura era alta, sottile e allungata, con arti a doppia articolazione. La pelle traslucida, simile a pergamena, è tesa su una struttura ossea delicata. Non c'è alcun segno di violenza o sofferenza. La sua posa è serena, quasi di attesa.",
            details: "L'analisi biologica conferma che il processo di mummificazione è avvenuto in un arco di tempo lunghissimo. La causa del decesso sembra essere semplicemente la vecchiaia o un arresto metabolico volontario. Non ci sono patogeni o segni di lotta.",
            isFixed: true
        },
        {
            id: 'cilindro_mnemonico',
            name: 'Cilindro Mnemonico',
            synonyms: ['cilindro', 'oggetto'],
            description: "Un piccolo cilindro metallico stretto tra le dita della creatura.",
            details: "Sembra un dispositivo di registrazione personale. Il tuo scanner può tentare una decodifica — usa ANALIZZA CILINDRO.",
            isPickable: true,
            onUse: (state) => {
                // Delega all'analisi: USA CILINDRO ≡ ANALIZZA CILINDRO
                if (!state.flags.cilindroAnalizzato) {
                    state.flags.translationProgress = 18;
                    state.flags.cilindroAnalizzato = true;
                    return {
                        description: "Inserisci il cilindro nello scanner. È un'altra registrazione. La tua matrice di traduzione si aggiorna.[PAUSE]Stato traduzione: 18%\nLa voce tradotta è più chiara, più personale:\n...il legame-collettivo si affievolisce. I cicli sono quasi compiuti. Il 'Grande Salto' è stato un successo, ma il nostro tempo finisce. Lasciamo questa eco... questo (parola intraducibile: 'seme-dell-anima')... perché chi verrà dopo possa conoscere il motivo. Non la fine. La continuazione...",
                        eventType: 'magic'
                    };
                }
                return { description: `Hai già analizzato il cilindro. Stato traduzione: ${state.flags.translationProgress}%.`, eventType: 'magic' };
            },
            onAnalyze: (state) => {
                if (!state.flags.cilindroAnalizzato) {
                    state.flags.translationProgress = 18;
                    state.flags.cilindroAnalizzato = true;
                    return {
                        description: "Inserisci il cilindro nello scanner. È un'altra registrazione. La tua matrice di traduzione si aggiorna.[PAUSE]Stato traduzione: 18%\nLa voce tradotta è più chiara, più personale:\n...il legame-collettivo si affievolisce. I cicli sono quasi compiuti. Il 'Grande Salto' è stato un successo, ma il nostro tempo finisce. Lasciamo questa eco... questo (parola intraducibile: 'seme-dell-anima')... perché chi verrà dopo possa conoscere il motivo. Non la fine. La continuazione...",
                        eventType: 'magic'
                    };
                }
                return { description: `Hai già analizzato il cilindro. Stato traduzione: ${state.flags.translationProgress}%.`, eventType: 'magic' };
            }
        }
    ],
    commands: [
        // MOVIMENTO
        {
            regex: "^((vai|va) )?(nord|n|corridoio|indietro)$", handler: (state) => {
                state.location = "Corridoio Principale";
                return { description: gameData["Corridoio Principale"].description(state), eventType: 'movement' };
            }
        },
        // ESAMINA EXTRA (per gestire descrizioni dinamiche del corpo)
        {
            regex: "^(esamina|guarda) (forma|forma immobile|resti|corpo|alieno|creatura)$", handler: (state) => {
                let desc = "Il corpo è conservato fino al dettaglio. La creatura era alta, sottile e allungata, con arti a doppia articolazione. La pelle traslucida, simile a pergamena, è tesa su una struttura ossea delicata. Non c'è alcun segno di violenza o sofferenza. La sua posa è serena, quasi di attesa.";
                if (!state.flags.cilindroPreso) {
                    desc += " Una delle sue mani a tre dita stringe debolmente un piccolo cilindro metallico.";
                }
                if (state.echoes.includes('echo_alloggi')) {
                    desc += "\n\nL'eco del Sintonizzatore ti torna in mente: 'Qualcuno deve spegnere le luci quando tutti se ne sono andati.' Questo era il Navarca. Ha atteso qui, solo, finché non ha potuto più aspettare. E ha scelto di non andarsene.";
                }
                return { description: desc };
            }
        },
        // PRENDI
        {
            // 'oggetto' incluso: è un sinonimo dell'item Cilindro e senza di esso
            // "prendi oggetto" passava dal pickup generico dell'item-system, che
            // non setta cilindroPreso e lasciava lo stato incoerente (audit 2026-07-11).
            regex: "^(prendi) (cilindro|cilindro mnemonico|oggetto)$", handler: (state) => {
                if (state.flags.cilindroPreso) {
                    return { description: "L'hai già preso.", eventType: 'error' };
                }
                state.inventory.push("Cilindro Mnemonico");
                state.flags.cilindroPreso = true;
                return { description: "Delicatamente, apri le dita della creatura e prendi il cilindro. È freddo e liscio.", eventType: 'item_pickup' };
            }
        },
        { regex: "^(prendi) (resti|corpo|alieno)$", handler: () => ({ description: "No. Mostri rispetto per i morti, chiunque essi siano." }) },
        // TOCCA
        { regex: "^(tocca) (alcove|nicchie|letti|pareti|celle|muro)$", handler: () => ({ description: "Le alcove sono lisce e fredde come porcellana. Il contatto trasmette una quiete sedativa. Pensi ai corpi che ci dormivano, alle menti che ci riposavano prima dell'ultimo ciclo." }) },
        { regex: "^(tocca) (cadavere|corpo|alieno|creatura|forma)$", handler: () => ({ description: "No. C'è qualcosa di sbagliato nel disturbare quella posa serena. Lascia il suo riposo intatto." }) },
        { regex: "^tocca$", handler: () => ({ description: "Sei negli alloggi dell'equipaggio. Puoi toccare le alcove o i resti della creatura che riposa qui." }) },
    ]
};