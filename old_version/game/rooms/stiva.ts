import { Room } from '../../types';
import { gameData } from '../gameData';

export const stivaRoom: Room = {
    description: (state) => {
        let desc = "STIVA\n\nLa stiva della Santa Maria è piena di casse di minerali grezzi destinate a una colonia su Europa. L'aria è stantia, densa di minerali e circuiti caldi — il respiro di una nave che viaggia da sola da troppo tempo. Su una parete c'è la rastrelliera con l'equipaggiamento di manutenzione.";

        const objectsInRoom = [];
        // Controllo se gli oggetti sono stati presi usando i flag generati dal parser o logica custom
        if (!state.flags['picked_Stiva_tuta_spaziale'] && !state.inventory.some(i => i.includes("Tuta Spaziale"))) {
            objectsInRoom.push("una Tuta Spaziale");
        }
        if (!state.flags['picked_Stiva_kit_manutenzione'] && !state.inventory.includes("Kit di Manutenzione") && !state.flags.kitAperto) {
            objectsInRoom.push("un Kit di Manutenzione");
        }

        if (objectsInRoom.length > 0) {
            desc += `\nVedi ${objectsInRoom.join(" e ")}.`;
        }
        desc += "\nA EST c'è la porta per tornare alla plancia. A SUD c'è il portello del boccaporto esterno.";
        return desc;
    },
    items: [
        {
            id: 'tuta_spaziale',
            name: 'Tuta Spaziale',
            synonyms: ['tuta', 'scafandro'],
            description: "È la tua tuta da lavoro extraveicolare. Pesante, affidabile, con abbastanza ossigeno per sei ore di lavoro.",
            isPickable: true,
            onUse: (state) => {
                if (state.flags.isWearingSuit) {
                    return { description: "La stai già indossando.", eventType: 'error' };
                }
                // Trova la tuta nell'inventario (stringa)
                const index = state.inventory.indexOf("Tuta Spaziale");
                if (index === -1) {
                    // Se non è in inventario, forse è nella stanza?
                    // Per ora assumiamo che debba essere presa prima di indossarla, 
                    // oppure il comando USA la prende e indossa automaticamente?
                    // Manteniamo logica semplice: devi averla.
                    return { description: "Devi prima prenderla.", eventType: 'error' };
                }
                // NON rinominare la stringa in inventario: "Tuta Spaziale (indossata)"
                // romperebbe il match esatto (normalizeCommand) usato da ESAMINA/ANALIZZA
                // TUTA dall'inventario, rendendole irraggiungibili (BUG B9). Lo stato
                // "indossata" è tracciato dal flag isWearingSuit; l'etichetta visiva
                // viene aggiunta in getInventarioHtml.
                state.flags.isWearingSuit = true;
                return { description: "Ora indossi la tuta spaziale. I sistemi di supporto vitale si attivano con un leggero ronzio e il display interno si accende nel tuo casco.", eventType: 'item_use' };
            }
        },
        {
            id: 'kit_manutenzione',
            name: 'Kit di Manutenzione',
            synonyms: ['kit', 'valigetta', 'attrezzi'],
            description: "Una valigetta metallica con il logo della Weyland Corp. Contiene gli attrezzi base per le riparazioni d'emergenza.",
            isPickable: true,
            onUse: (state) => {
                const index = state.inventory.indexOf("Kit di Manutenzione");
                if (index === -1) {
                    return { description: "Devi prima prenderlo.", eventType: 'error' };
                }
                state.inventory.splice(index, 1);
                state.inventory.push("Taglierina al Plasma", "Batteria di Emergenza");
                state.flags.kitAperto = true;
                // Marca anche il flag di raccolta del parser: garantisce che il Kit non
                // possa essere ri-raccolto e ri-aperto generando oggetti all'infinito (BUG B8).
                state.flags['picked_Stiva_kit_manutenzione'] = true;
                return { description: "Apri la valigetta. Dentro trovi una Taglierina al Plasma e una Batteria di Emergenza.", eventType: 'item_use' };
            }
        },
        {
            id: 'casse_minerali',
            name: 'casse di minerale',
            synonyms: ['casse', 'minerale', 'carico', 'contenitori'],
            description: "Sono casse di minerale di ferro e nichel. Contenuto standard, noioso ma redditizio. In un angolo, tra due contenitori semiaperti, noti della cianfrusaglia personale: un vecchio lettore di ebook ammaccato, con lo schermo rotto che mostra ancora debolmente il titolo di un'antica avventura testuale: '...nello di Ghiaccio'.",
            details: "L'analisi spettrale conferma il contenuto: ferro e nichel di alta purezza. Nessuna anomalia energetica o biologica.",
            isFixed: true
        },
        {
            id: 'lettore_ebook',
            name: 'lettore',
            synonyms: ['lettore di ebook', 'ebook', 'schermo rotto', 'libro', 'avventura testuale', 'castello di ghiaccio', 'castello'],
            description: "Un vecchio lettore di ebook ammaccato, incastrato tra due casse di nichel. Lo schermo è incrinato ma ancora illuminato, con la batteria residua di qualche ora. Mostra il titolo di un'avventura testuale: '...nello di Ghiaccio'.",
            onAnalyze: (state) => {
                if (state.flags.lettoreEsaminato) {
                    return { description: "L'hai già letto. 'CASTELLO DI GHIACCIO' — l'hai già trovato.", eventType: null };
                }
                state.flags.lettoreEsaminato = true;
                return {
                    description: `Il titolo completo, appena leggibile attraverso il vetro incrinato, è "CASTELLO DI GHIACCIO".\n\nUn'avventura testuale italiana degli anni '80. Qualcuno, probabilmente il mercante che ha usato questa stiva prima di te, l'ha giocata. Ha anche lasciato una nota nel file di salvataggio, scritta con la penna digitale:\n\n"Conosci tutta la mappa, conosci tutti i comandi, ma il testo è la vera avventura.\nVai sempre a Nord. Non c'è sempre un Nord. Ma prova lo stesso."\n\n(Il pensiero ti colpisce senza che tu lo voglia: stai giocando la stessa partita.\nSolo su scala galattica. E il Nord, stavolta, è davanti a te.)`,
                    eventType: 'echo'
                };
            },
            isFixed: true
        },
        {
            id: 'portello_sud',
            name: 'portello esterno',
            synonyms: ['portello', 'boccaporto', 'uscita', 'porta'],
            description: "È il boccaporto esterno. Una spessa lastra di metallo che conduce al vuoto dello spazio.",
            isFixed: true
        }
    ],
    commands: [
        // MOVIMENTO
        {
            regex: "^((vai|va) )?(est|e|plancia)$", handler: (state) => {
                state.location = "Plancia della Santa Maria";
                return { description: gameData["Plancia della Santa Maria"].description(state), eventType: 'movement' };
            }
        },
        // TOCCA
        { regex: "^(tocca) (casse|minerale|carico|contenitori)$", handler: () => ({ description: "Le casse di minerale sono fredde e lisce, con qualche ammaccatura dai carichi precedenti. La routine quotidiana di un recuperante. Stai per abbandonarla per qualcosa di molto più grande." }) },
        { regex: "^(tocca) (rastrelliera|equipaggiamento|attrezzi)$", handler: () => ({ description: "Il metallo della rastrelliera è graffiato e usurato, ma solido. Gli attrezzi sono stati sistemati con cura, ogni cosa al suo posto. Qualcuno si preoccupava di tenere in ordine questa stiva." }) },
        { regex: "^tocca$", handler: () => ({ description: "Tocchi le superfici intorno a te. Metallo umano, familiare. L'odore di ferro e ozono è ovunque. Tra poco potresti rimpiangere queste cose banali." }) },
        {
            regex: "^((vai|va) )?(sud|s|fuori|esterno)$", handler: (state) => {
                if (state.flags.isWearingSuit) {
                    state.location = "Scafo Esterno del Relitto";
                    return { description: gameData["Scafo Esterno del Relitto"].description(state), eventType: 'movement' };
                }
                return { description: "Sarebbe un suicidio. Devi prima indossare la tuta spaziale per uscire nel vuoto.", eventType: 'error' };
            }
        },
    ]
};