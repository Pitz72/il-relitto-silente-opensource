/* ─── echoData.ts ──────────────────────────────────────────────────────────
   Unica fonte di verità per gli echi temporali del Sintonizzatore.
   Importato sia da gameLogic.ts (per ECHO_TEXTS display) sia da
   laboratoriRisonanza.ts (per onUse del Sintonizzatore), evitando
   la dipendenza circolare gameLogic ↔ rooms.
   ─────────────────────────────────────────────────────────────────────── */

import { PlayerState } from '../types';

/** Mappa echoId → testo leggibile mostrato al giocatore. */
export const ECHO_TEXTS: Record<string, string> = {
    'echo_plancia':     "CAPITANO: 'Rotta impostata per il sistema trino. I motori sono al limite. Che Dio ci perdoni per quello che stiamo portando a casa.'",
    'echo_serra':       "XENO-BOTANICO: 'Stanno morendo tutte. Il filtro atmosferico è collassato. Non c'è più acqua. Ho provato a salvare il Seme, ma...'",
    'echo_lab':         "INGEGNERE CAPO: 'La risonanza è instabile! Il cristallo non regge il carico! Evacuare il settore! SUBITO!' — [pausa] — 'Non riesco a farlo. Se lascio il generatore adesso il campo collassa e con lui tutta la Sezione Seme. Non posso. Devo stabilizzare prima. Voi andate. Io... resto.'",
    'echo_arca':        "UFFICIALE MEDICO: 'I sistemi vitali sono offline. Sono tutti morti nel sonno. Il freddo... è stato misericordioso.'",
    'echo_alloggi':     "NAVARCA: 'Questo sarà il mio ultimo ciclo di veglia. Ho chiesto di rimanere l'ultimo. Qualcuno deve spegnere le luci quando tutti se ne sono andati. È... è un onore.'",
    'echo_ponte':       "UFFICIALE DI NAVIGAZIONE: 'La rotta è confermata e sigillata nei cristalli. Tra 4.7 milioni di cicli, il sistema bersaglio sarà maturo. Noi non ci saremo. Ma il canto... il canto ci sarà.'",
    'echo_corridoio':   "UNA VOCE — senza identificativo di ruolo: 'Il Seme è al sicuro. La Stele è al sicuro. Il Nucleo è al sicuro. Abbiamo fatto tutto quello che potevamo. Tutto. Ora è nelle mani del tempo — e del futuro che non conosceremo mai.'",
    'echo_camera':      "TECNICO DI BORDO: 'Porta esterna sigillata. Protocollo silenzio attivato. La musica ha trovato la sua ultima casa. Che continui, oltre il freddo, oltre il buio. Che continui.'",
    'echo_scriptorium': "LO SCRIBA: 'L'ultima iscrizione è completa. La Stele porta tutto ciò che siamo stati — ogni scoperta, ogni errore, ogni speranza. Non so se sarà mai letta. Ma la verità deve avere un posto dove stare.'",
    'echo_stiva':       "TECNICO DI CARICO: 'Il Seme è sigillato. Ho controllato ogni capsula tre volte. Se anche tutto il resto fallisse... questo deve arrivare. Deve.'",
    'echo_santuario_sil': "CUSTODE: 'Il silenzio non è assenza. È la forma che la memoria prende quando le parole finiscono. Ho dedicato tutta la mia vita a impararlo. Solo adesso capisco che era vero.'",
};

/** Mappa location name → echoId per il Sintonizzatore. */
export const LOCATION_TO_ECHO: Record<string, string> = {
    'Plancia della Santa Maria':    'echo_plancia',
    'Serra Morente':                'echo_serra',
    'Laboratori di Risonanza':      'echo_lab',
    'Arca Biologica':               'echo_arca',
    "Alloggi dell'Equipaggio":      'echo_alloggi',
    'Ponte di Comando':             'echo_ponte',
    'Corridoio Principale':         'echo_corridoio',
    'Camera di Compensazione':      'echo_camera',
    'Scriptorium':                  'echo_scriptorium',
    'Stiva':                        'echo_stiva',
    'Santuario del Silenzio':       'echo_santuario_sil',
};

/** Stanze con eco le cui uscite si sigillano a senso unico durante la discesa
    verso i Laboratori di Risonanza: dopo aver preso il Sintonizzatore non sono
    più raggiungibili. I loro echi vengono catturati retroattivamente alla prima
    attivazione del dispositivo (per le stanze già attraversate), così che il
    100% degli echi resti ottenibile senza alterare la mappa (BUG B2). */
export const SEALED_ECHO_ROOMS: string[] = [
    'Plancia della Santa Maria',
    'Stiva',
    'Camera di Compensazione',
];

/* ─── Echi PROFONDI (WS2) ───────────────────────────────────────────────────
   Un secondo strato d'ascolto, distinto dagli 11 echi canonici: NON entra in
   state.echoes (così il conteggio 11/11, lo score e la cattura retroattiva B2
   restano invariati). Viene tracciato con un flag booleano omonimo (l'id).
   Ogni eco profondo si sblocca solo con una condizione *correlata* — alta
   comprensione (translationProgress) o un indizio fisico già ottenuto in quella
   stanza — così l'ascolto profondo è informazione guadagnata, non automatica.  */
export const DEEP_ECHO_TEXTS: Record<string, string> = {
    'echo_lab_deep':          "INGEGNERE CAPO — la voce più bassa, quasi un canto sottovoce: 'Li ho scritti tutti, qui sul banco. Ogni nome di chi è salito sulle navi, e ogni nome di chi è rimasto quaggiù con me a tenere fermo il campo. Non per la storia: la storia non verrà. Perché siano detti ad alta voce ancora una volta, finché c'è una voce che li dice. ...Allora li dico. Uno per uno. Piano. Finché la voce regge.'",
    'echo_alloggi_deep':      "NAVARCA — e stavolta non parla all'equipaggio, parla a se stesso: 'Mi domando se qualcuno verrà. Non per salvarci — quello è impossibile da prima che io nascessi. Solo per vedere. Per sapere che siamo stati qui. ...Se sei tu che ascolti, da qualunque tempo tu venga: ho tenuto le luci accese fino all'ultimo respiro. Non contro il buio. Perché tu trovassi la strada.'",
    'echo_serra_deep':        "XENO-BOTANICO — un filo di voce, ma più ferma di prima: 'Uno. Ne ho salvato uno. Lo so che non basta: un giardino non lo fai con un seme solo. ...Ma una foresta sì. Una foresta intera può cominciare da uno, se trova la terra giusta e qualcuno che abbia la pazienza del tempo. Quel qualcuno non sarò io. Forse sarai tu. Abbi cura del tempo: è l'unica cosa che non posso lasciarti.'",
    'echo_santuario_sil_deep':"CUSTODE — e adesso la voce non trema più: 'Ti ho aspettato. Non te, il tuo volto non potevo conoscerlo. Ma qualcuno. Chiunque arrivasse fin qui e si fermasse ad ascoltare, invece di prendere e ripartire. Il silenzio non era una serratura da forzare. Era una domanda. E tu, restando, hai risposto.'",
};

export interface DeepEcho {
    room: string;                          // stanza in cui si attiva
    id: string;                            // id eco profondo (= chiave flag di possesso)
    surfaceId: string;                     // eco di superficie corrispondente
    gate: (state: PlayerState) => boolean; // condizione correlata di sblocco
    lockedHint: string;                    // segnalazione quando lo strato esiste ma è ancora bloccato
}

const tp = (state: PlayerState): number => (state.flags.translationProgress as number) ?? 0;

export const DEEP_ECHOES: DeepEcho[] = [
    {
        room: 'Laboratori di Risonanza',
        id: 'echo_lab_deep',
        surfaceId: 'echo_lab',
        gate: (s) => tp(s) >= 75,
        lockedHint: "Sotto la voce dell'ingegnere ne affiora un'altra, più bassa, che sembra recitare una lista — ma il traduttore non la aggancia ancora. (Forse con la matrice più avanzata.)",
    },
    {
        room: "Alloggi dell'Equipaggio",
        id: 'echo_alloggi_deep',
        surfaceId: 'echo_alloggi',
        gate: (s) => Boolean(s.flags.cilindroPreso),
        lockedHint: "Dietro l'eco del Navarca intuisci un secondo strato, più privato. Il sintonizzatore non riesce a fissarlo: manca qualcosa, in questa stanza, che lo tenga ancorato.",
    },
    {
        room: 'Serra Morente',
        id: 'echo_serra_deep',
        surfaceId: 'echo_serra',
        gate: (s) => Boolean(s.flags.semeLiberato),
        lockedHint: "C'è un secondo strato sotto questa voce, ma resta fuori fuoco: qualcosa, qui, non è ancora compiuto.",
    },
    {
        room: 'Santuario del Silenzio',
        id: 'echo_santuario_sil_deep',
        surfaceId: 'echo_santuario_sil',
        gate: (s) => tp(s) >= 100,
        lockedHint: "Sotto le parole del Custode senti una risonanza più profonda, ancora illeggibile. Forse quando la matrice di traduzione sarà completa.",
    },
];
