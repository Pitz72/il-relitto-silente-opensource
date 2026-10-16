import { Room } from '../../types';
import { gameData } from '../gameData';

export const planciaRoom: Room = {
    description: () => "PLANCIA DELLA SANTA MARIA\n\nSei sulla plancia della tua nave da carico, la Santa Maria. È un ambiente familiare, vissuto, pieno di schermi e comandi che conosci a memoria. Lo spazio profondo ti circonda, punteggiato da stelle lontane. Davanti a te, nell'oblò principale, fluttua l'anomalia: un'ombra contro le stelle, un oggetto vasto e completamente buio che i tuoi sensori a lungo raggio hanno a malapena registrato. È una nave, non c'è dubbio, ma di un design che non hai mai visto. Silenziosa. Morta.\nSul pannello di controllo, una luce rossa lampeggia, indicando un allarme di prossimità.\nA OVEST c'è la porta che conduce alla stiva.",
    items: [
        {
            id: 'nave_aliena',
            name: 'nave aliena',
            synonyms: ['nave', 'relitto', 'ombra', 'anomalia', 'astronave', 'nave stellare', 'oblo', 'finestrino', 'vista'],
            description: "Vedi la Nave Stellare aliena. È enorme, a forma di fuso allungato, e la sua superficie non riflette alcuna luce. Sembra un buco nel tessuto dello spazio. Non si vedono portelli, motori o segni di vita.",
            details: "Il tuo multiscanner portatile emette un debole 'bip'. Il bersaglio è troppo lontano e la sua massa è troppo grande per ottenere una lettura dettagliata da questa distanza. L'unica cosa certa è l'assoluta assenza di emissioni energetiche.",
            isFixed: true,
        },
        {
            id: 'pannello_comandi',
            name: 'pannello di controllo',
            synonyms: ['pannello', 'controlli', 'luce', 'console', 'schermi', 'comandi'],
            description: "Sono i controlli della tua Santa Maria. La luce rossa dell'allarme di prossimità lampeggia con insistenza. Tutti gli altri sistemi sono nominali.",
            details: "Il multiscanner registra solo emissioni umane standard: navigazione attiva, sistema di supporto vitale nominale, comunicazioni su frequenza di prossimità. L'unica anomalia è la luce rossa — allarme di prossimità per la struttura sconosciuta. Niente di alieno qui. Per ora.",
            isFixed: true,
        },
        {
            id: 'radio_comunicazioni',
            name: 'radio',
            synonyms: ['comunicazioni', 'trasmittente'],
            description: "È il pannello delle comunicazioni a lungo raggio. Un pezzo di equipaggiamento standard ma affidabile. Al momento, è sintonizzato su frequenze di prossimità.",
            details: "Il sistema è in ascolto passivo su tutte le frequenze standard, militari e di emergenza. Le antenne captano solo rumore cosmico di fondo. Nessuna emissione attiva o passiva proveniente dalla struttura aliena. Silenzio totale.",
            isFixed: true,
            onUse: () => ({ description: "Attivi la radio di prossimità. Provi su tutte le frequenze, standard e di emergenza. C'è solo silenzio. La nave aliena non risponde." })
        }
    ],
    commands: [
        // MOVIMENTO
        {
            regex: "^((vai|va) )?(ovest|o|stiva)$", handler: (state) => {
                state.location = "Stiva";
                return { description: gameData["Stiva"].description(state), eventType: 'movement', };
            }
        },
        { regex: "^((vai|va) )?(nord|n|sud|s|est|e)$", handler: () => ({ description: "Non puoi andare in quella direzione.", eventType: 'error' }) },
        // TOCCA
        { regex: "^(tocca) (pannello|comandi|console|schermo|schermi|controlli)$", handler: () => ({ description: "Sfiorano la console della Santa Maria. Ogni tasto, ogni interruttore è familiare, consumato dall'uso. C'è un comfort strano nel toccare qualcosa di costruito da mani umane, dopo aver guardato a lungo quella cosa nera là fuori." }) },
        { regex: "^(tocca) (nave|relitto|ombra|anomalia)$", handler: () => ({ description: "Non puoi toccarla da qui. È a centinaia di metri di distanza, nell'oscurità dello spazio. Ma senti il suo peso lo stesso." }) },
        { regex: "^tocca$", handler: () => ({ description: "Cosa vuoi toccare? Sei sulla plancia della tua nave — i controlli, il pannello, la vista sull'oblò. Tutto è familiare e umano, per ora." }) },
    ]
};