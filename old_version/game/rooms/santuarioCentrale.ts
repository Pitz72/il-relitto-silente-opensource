import { Room } from '../../types';

export const santuarioCentraleRoom: Room = {
    description: (state) => {
        if (state.flags.santuarioDescritto) {
            return "SANTUARIO CENTRALE\n\nLa stanza è nella penombra. La figura luminosa fluttua al centro, silenziosa. Non ci sono uscite visibili.";
        }
        state.flags.santuarioDescritto = true;
        return `SANTUARIO CENTRALE\n\nLa stanza è più piccola di quanto ti aspettassi. Le pareti convergono verso l'alto, nell'oscurità. Il pavimento è uno schema di linee luminose — la stessa geometria stellare che hai visto nel Ponte di Comando, ma ridotta qui a qualcosa di intimo. Al centro, uno spazio aperto.\n\nIl silenzio ha una qualità diversa da tutto quello che hai incontrato fino ad ora. Non è il silenzio del vuoto, né quello definitivo dell'Arca Biologica. È il silenzio di qualcosa che aspetta da molto tempo di essere ascoltato.[PAUSE]Di fronte a te, fluttua la figura luminosa dell'Anziano. I bordi della proiezione si dissolvono appena, come una fotografia esposta troppe volte. Ma lo sguardo è chiaro.\n\nTi sta guardando.\n\nNon ci sono uscite visibili.`;
    },
    commands: [
        {
            regex: "^(parla|parla su|parla con)( anziano| ologramma| figura)?$", handler: (state) => {
                state.flags.hasHeardMonologue = true;

                /* Traccia del giocatore (WS3): l'epilogo riconosce i segni lasciati
                   con INCIDI. Non cambia l'esito — dà un footprint allo stance del
                   giocatore, che da testimone diventa anello della catena. */
                const marks: string[] = [];
                if (state.flags.incisoCorridoio) marks.push("una quarta tacca alla base di una parete, accanto alle tre che una mano umana aveva inciso prima di te");
                if (state.flags.incisoArca)      marks.push(state.flags.tutaAnalizzata
                    ? "un segno sul vetro di una capsula criogenica, accanto a L.V. — il compagno umano che era arrivato lì otto secoli prima di te"
                    : "un segno sul vetro di una capsula criogenica, accanto al compagno che era arrivato lì molto prima di te");
                if (state.flags.incisoSantuario) marks.push("una riga storta e umana tra le incisioni perfette di una civiltà perduta");
                let marksParagraph = '';
                if (marks.length > 0) {
                    const elenco = marks.length === 1
                        ? marks[0]
                        : marks.slice(0, -1).join('; ') + '; e ' + marks[marks.length - 1];
                    marksParagraph = `[PAUSE]\nE poi c'è quello che hai lasciato tu, là dietro, nel buio in cui il Relitto è svanito: ${elenco}. Non cambieranno niente. Forse sono già polvere, insieme alla nave. Ma li hai fatti lo stesso — per la stessa ragione per cui qualcuno, prima di te, aveva inciso tre tacche in una parete che nessuno avrebbe più letto. Perché essere passati conta, anche quando non guarda nessuno.\n\nNon sei più soltanto un testimone. Sei un anello della catena.\n`;
                }

                return {
                    description: `(La figura non muove le labbra, ma le parole non sono un suono. Sono un pensiero che fiorisce direttamente nella tua mente, limpido e completo.)
«Creatura di carbonio... Figlio delle Stelle... Benvenuto.»
«So cosa cerchi. Una risposta. Ma io non sono che la memoria di una domanda. Sono ciò che resta quando il cantastorie è svanito. L'ultima frase, scritta nella luce.»
«Il nostro tempo era un cerchio che si chiudeva. Il grande fuoco del nostro universo si stava riducendo a brace, e noi eravamo le ultime scintille. Ma la vita... la vita è una fiamma che non deve mai essere lasciata spegnere del tutto.»
[PAUSE]
«Così intraprendemmo il 'Grande Salto'. Non per conquistare, ma per comporre. Intrecciammo le note del nostro stesso essere nella trama silenziosa di mondi giovani, sperando che una nuova, imprevedibile sinfonia potesse un giorno iniziare.»
«Tu... sei quella nuova musica.»
«Nel tuo sangue, porti il fantasma dei nostri tre soli. Siamo solo il ricordo della prima nota.»
[PAUSE]
(La figura luminosa ti osserva, e per un istante senti il peso di un tempo incalcolabile)
«La nostra canzone è finita. Le sue ultime armonie si dissolvono ora, in questo istante. Tutto ciò che abbiamo sempre chiesto alla musica a venire... è che venisse suonata, con forza, fino all'ultima nota.»
«Vivi. Sarà il suono più bello.»`,
                    eventType: 'magic',
                    typewriter: true,
                    gameOver: `Ti risvegli di soprassalto.
[PAUSE]
Non sei più nel buio del Santuario. Sei sulla plancia della Santa Maria, seduto sulla tua poltrona di comando. L'aria odora di ozono riciclato e caffè stantio. Familiarità.

Non ricordi come sei tornato. È stato un sogno? Un'allucinazione indotta dall'isolamento?
[PAUSE]
Guardi fuori dall'oblò principale. Il Relitto Silente è scomparso. Lo spazio è vuoto, nero e indifferente, come se non fosse mai stato lì. I tuoi sensori non mostrano alcuna traccia.

Stai quasi per convincerti di aver immaginato tutto, quando un 'bip' sommesso attira la tua attenzione.
[PAUSE]
Sul pannello di controllo, dove prima non c'era nulla, c'è un piccolo oggetto. Un seme fossilizzato. Ma ora non è più inerte. Al suo interno, una debole luce verde pulsa lentamente, come un cuore addormentato in attesa della primavera.
[PAUSE]
La ricchezza che cercavi... non l'hai trovata. Ma hai trovato qualcos'altro.

Un'eredità. Un segreto. Una responsabilità.

La rotta per la colonia di Europa è ancora lì, che ti aspetta. Ma ora, il carico più prezioso che trasporti non è nelle casse nella stiva.

È qui, con te, sulla plancia.
${marksParagraph}
<span style="color:var(--p-bright);font-size:2.2rem;display:block;text-align:center;margin-top:1.5rem;text-shadow:0 0 12px var(--p-glow-a);">FINE</span>`
                };
            }
        },
        {
            regex: "^(esamina|guarda) (anziano|ologramma|figura)$", handler: (state) => {
                if (state.flags.hasHeardMonologue) {
                    return { description: "Non c'è più nulla qui. Solo il silenzio e l'oscurità.", eventType: 'error' };
                }
                return { description: "È una proiezione tridimensionale di uno degli alieni, ma sembra più vecchio, più saggio di quello che hai visto negli alloggi. Indossa vesti cerimoniali e la sua espressione è di una calma profonda. Non sembra minaccioso, solo... in attesa." };
            }
        },
        // TOCCA
        {
            regex: "^(tocca) (anziano|ologramma|figura|luce)$", handler: (state) => {
                if (state.flags.hasHeardMonologue) {
                    return { description: "Non c'è più nulla da toccare. Il silenzio è totale." };
                }
                return { description: "La mano attraversa la figura luminosa senza incontrare resistenza. È solo luce — o qualcosa che le somiglia. Eppure mentre la tua mano è dentro quell'alone, senti qualcosa che non è calore, non è freddo. È presenza." };
            }
        },
        { regex: "^(tocca) (pavimento|linee|diagramma|mappa)$", handler: () => ({ description: "Il pavimento è liscio come specchio. Le linee luminose reagiscono al tocco con un brevissimo pulso, poi si riassestano nel loro schema geometrico. Un diagramma che non comprendi, ma che senti come qualcosa di antico." }) },
        { regex: "^tocca$", handler: () => ({ description: "Puoi toccare la figura luminosa o il pavimento con le sue linee di luce." }) },
        {
            regex: "^(esamina|guarda) (stanza|santuario|luci|pavimento)$", handler: (state) => {
                if (state.flags.hasHeardMonologue) {
                    return { description: "La stanza è tornata nell'oscurità totale.", eventType: 'error' };
                }
                return { description: "È una stanza vasta e vuota, priva di qualsiasi arredo se non il piedistallo centrale. Le linee di luce sul pavimento formano un complesso diagramma che ricorda una mappa galattica." };
            }
        },
    ]
};