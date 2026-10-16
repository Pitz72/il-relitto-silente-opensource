import { Room } from '../../types';
import { gameData } from '../gameData';

export const anticameraSantuarioRoom: Room = {
    description: (_state) => {
        return `ANTICAMERA DEL SANTUARIO\n\nIl corridoio si restringe. Le pareti non emettono più la luce bluastra del resto della nave — qui è tutto scuro, una tonalità di buio diversa da quella del vuoto esterno. Non è assenza di luce. È qualcosa che assorbe.\n\nI tuoi passi non fanno rumore. Non sai se è il materiale del pavimento o se hai smesso di fare rumore tu.\n\nDavanti, una soglia aperta.`;
    },
    commands: [
        {
            regex: "^((vai|va) )?(avanti|nord|n|dentro|avanza|santuario|continua)$|^entra$|^(entra|vai) (santuario|dentro|avanti)$",
            handler: (state) => {
                state.location = "Santuario Centrale";
                return { description: gameData["Santuario Centrale"].description(state), eventType: 'movement' };
            }
        },
        // TOCCA
        { regex: "^(tocca) (pareti|muro|pavimento|soffitto)$", handler: () => ({ description: "Le pareti sono fredde. Non c'è bioluminescenza, non c'è vibrazione. È il primo materiale completamente inerte che hai toccato su questa nave." }) },
        { regex: "^tocca$", handler: () => ({ description: "Puoi toccare le pareti. O continuare ad avanzare." }) },
        // ESAMINA
        { regex: "^(esamina|guarda) (stanza|corridoio|buio|oscurita|soglia|ambiente)$", handler: () => ({ description: "La stanza è breve — quattro o cinque passi. Le pareti si avvicinano leggermente verso il centro, come una strozzatura. Non ci sono decorazioni, nessun simbolo. È uno spazio che non era destinato a essere visitato, solo attraversato." }) },
        // INDIETRO non permesso narrativamente
        { regex: "^((vai|va) )?(sud|s|indietro|ponte|ponte di comando)$", handler: () => ({ description: "Hai attraversato la soglia. Non torni indietro adesso.", eventType: 'error' }) },
    ]
};
