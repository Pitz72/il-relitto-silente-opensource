import { PlayerState, GameEventType, CommandHandlerResult, CommandHandler, Command, Room } from '../types';
import { planciaRoom } from './rooms/plancia';
import { stivaRoom } from './rooms/stiva';
import { corridoioPrincipaleRoom } from './rooms/corridoioPrincipale';
import { santuarioDelSilenzioRoom } from './rooms/santuarioDelSilenzio';
import { arcaDellaMemoriaRoom } from './rooms/arcaDellaMemoria';
import { scriptoriumRoom } from './rooms/scriptorium';
import { serraMorenteRoom } from './rooms/serraMorente';
import { arcaBiologicaRoom } from './rooms/arcaBiologica';
import { ponteDiComandoRoom } from './rooms/ponteDiComando';
import { laboratoriRisonanzaRoom } from './rooms/laboratoriRisonanza';
import { scafoEsternoRoom } from './rooms/scafoEsterno';
import { cameraDiCompensazioneRoom } from './rooms/cameraDiCompensazione';
import { santuarioCentraleRoom } from './rooms/santuarioCentrale';
import { alloggiEquipaggioRoom } from './rooms/alloggiEquipaggio';
import { anticameraSantuarioRoom } from './rooms/anticameraSantuario';


// Esporta l'oggetto aggregato delle stanze per essere utilizzato dal motore di gioco.
export const gameData: Record<string, Room> = {
    "Plancia della Santa Maria": planciaRoom,
    "Stiva": stivaRoom,
    "Corridoio Principale": corridoioPrincipaleRoom,
    "Santuario del Silenzio": santuarioDelSilenzioRoom,
    "Arca della Memoria": arcaDellaMemoriaRoom,
    "Scriptorium": scriptoriumRoom,
    "Serra Morente": serraMorenteRoom,
    "Arca Biologica": arcaBiologicaRoom,
    "Ponte di Comando": ponteDiComandoRoom,
    "Laboratori di Risonanza": laboratoriRisonanzaRoom,
    "Scafo Esterno del Relitto": scafoEsternoRoom,
    "Camera di Compensazione": cameraDiCompensazioneRoom,
    "Santuario Centrale": santuarioCentraleRoom,
    "Alloggi dell'Equipaggio": alloggiEquipaggioRoom,
    "Anticamera Santuario": anticameraSantuarioRoom
};

// Le definizioni di tipo comuni sono state spostate in ../types.ts
// Esportiamo comunque alcuni tipi specifici se necessario localmente,
// anche se la best practice è importarli da un file centrale di tipi.
export type { PlayerState, GameEventType, CommandHandlerResult, CommandHandler, Command, Room };
