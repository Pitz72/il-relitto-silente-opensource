import { PlayerState, GameResponse, Item } from '../types';
import { gameData } from './gameData';
import cloneDeep from 'lodash.clonedeep';
import { ECHO_TEXTS } from './echoData';

// Cache regex compilate a livello di modulo: ogni pattern viene compilato una sola volta.
const regexCache = new Map<string, RegExp>();

/* ─── Registro globale item precalcolato ──────────────────────────────────
   Costruito una volta sola invece di attraversare tutte le 14 stanze
   ad ogni singolo input utente.                                         */
let _allItemsCache: Item[] | null = null;

const getAllItems = (): Item[] => {
    if (!_allItemsCache) {
        _allItemsCache = Object.values(gameData).flatMap(r => r.items ?? []);
    }
    return _allItemsCache;
};
const getCachedRegex = (pattern: string): RegExp => {
    let re = regexCache.get(pattern);
    if (!re) {
        re = new RegExp(pattern, 'i');
        regexCache.set(pattern, re);
    }
    return re;
};

/* ─── Distanza di Levenshtein ──────────────────────────────────────────────
   Usata per il sistema fuzzy "intendi...?" quando nessun comando viene
   riconosciuto. Complessità O(m×n), accettabile per stringhe corte di input.  */
function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1]
                ? dp[i-1][j-1]
                : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
}

const KNOWN_VERBS = [
    'guarda', 'esamina', 'analizza', 'prendi', 'raccogli', 'usa', 'attiva',
    'tocca', 'parla', 'entra', 'inventario', 'aiuto', 'echi', 'nord', 'sud',
    'est', 'ovest', 'alto', 'basso', 'apri', 'leggi', 'indossa', 'pulisci',
    'nota', 'diario',
];

/* ─── Barra di progresso traduzione ───────────────────────────────────────
   Visualizza lo stato corrente della matrice di traduzione ogni volta che
   translationProgress viene aggiornato da un'analisi.                    */
function progressBar(pct: number): string {
    const filled = Math.round(pct / 10);
    return `[ MATRICE TRADUZIONE: ${'█'.repeat(filled)}${'░'.repeat(10 - filled)} ${pct}% ]`;
}

const getHelpText = (): string => {
    return `COMANDI DISPONIBILI:
- GUARDA / L [oggetto/stanza]
- ESAMINA / X [oggetto]
- ANALIZZA [oggetto]
- VAI [direzione] (N, S, E, O)
- PRENDI [oggetto]
- USA [oggetto] SU/CON [bersaglio]
- INDOSSA [oggetto]
- APRI [oggetto]
- TOCCA [oggetto]
- INVENTARIO / I
- HINT / SUGGERIMENTO: Suggerisce cosa fare dopo
- NOTA / DIARIO: Mostra le scoperte registrate
- MAPPA: Mostra la mappa delle zone esplorate
- ECHI: Riascolta gli echi temporali registrati
- ASPETTA / Z
- SALVA / CARICA
- PULISCI / CLEAR`;
};

/* ─── Sistema HINT contestuale ────────────────────────────────────────────
   Analizza lo stato corrente (posizione, inventario, flag) e restituisce
   il suggerimento più rilevante per il prossimo passo.               */
function getContextualHint(state: PlayerState): string {
    const inv = state.inventory;
    // Uguaglianza esatta (normalizzata), non sottostringa: tutte le query has()
    // usano nomi oggetto completi. La vecchia includes() poteva produrre falsi
    // positivi in stati limite e quindi hint errati (BUG B18).
    const has = (name: string) => inv.some(i => normalizeCommand(i) === normalizeCommand(name));
    const flags = state.flags;
    const loc = state.location;

    // Fase finale
    if (loc === 'Santuario Centrale') {
        return "Sei quasi alla fine del viaggio. Parla con la figura luminosa: PARLA CON ANZIANO.";
    }

    // Ha tutte e tre le chiavi
    if (has('Stele del Ricordo') && has('Seme Vivente') && has('Nucleo di Memoria')) {
        if (loc === 'Ponte di Comando') {
            if (flags.isFinalDoorOpen) {
                return "La porta circolare è aperta. ENTRA per raggiungere l'Anticamera del Santuario.";
            }
            if (flags.knowsAboutTrinarySystem) {
                return "Hai studiato la mappa: il sistema K'tharr aveva tre soli. Attiva esattamente tre punte sulla porta circolare: TOCCA TRE PUNTE.";
            }
            if (flags.isHologramActive) {
                return "La mappa stellare è attiva sopra di te. Studia la rotta: ESAMINA MAPPA.";
            }
            return "USA POSTAZIONE per attivare la mappa stellare, poi ESAMINA MAPPA per trovare l'indizio finale.";
        }
        if (loc === 'Corridoio Principale') {
            return "Hai le tre chiavi! Usale sulla Grande Porta a Ovest in questo ordine:\nUSA SEME SU PORTA OVEST — USA STELE SU PORTA OVEST — USA NUCLEO SU PORTA OVEST.";
        }
        return "Hai le tre chiavi. Torna al Corridoio Principale e usa ciascuna sulla Grande Porta a Ovest.";
    }

    // Cristallo da attivare
    if (has('Cristallo Dati Opaco') && has('Dispositivo Medico Alieno') && !has('Cristallo Dati Attivato')) {
        return "Hai il Cristallo Opaco e il Dispositivo Medico. Per attivarlo prova: USA DISPOSITIVO SU CRISTALLO.";
    }

    // Nucleo mancante
    if (!has('Nucleo di Memoria') && has('Taglierina al Plasma')) {
        if (has('Stele del Ricordo') && has('Seme Vivente')) {
            if (loc === "Arca della Memoria") {
                if (flags.isTerminalActive) {
                    return "Lo scomparto del terminale è aperto. PRENDI NUCLEO per ottenere la terza chiave.";
                }
                return "Il terminale è spento. Per riattivarlo con un picco di energia: USA TAGLIERINA SU TERMINALE.";
            }
            if (loc === 'Scriptorium') {
                return "Il Nucleo è nell'Arca della Memoria. Da qui vai NORD.";
            }
            if (loc === 'Santuario del Silenzio') {
                return "Il Nucleo è nell'Arca della Memoria. Da qui: OVEST → Scriptorium, poi NORD → Arca. Usa la Taglierina sul terminale.";
            }
            return "Ti manca solo il Nucleo di Memoria (Chiave 3/3). Percorso: Corridoio → Santuario (N) → Scriptorium (O) → Arca della Memoria (N). Usa la Taglierina sul terminale.";
        }
        if (!has('Sintonizzatore di Frequenza')) {
            if (loc === 'Laboratori di Risonanza') {
                return "Sei nei Laboratori. Il Sintonizzatore è sul banco di lavoro: PRENDI SINTONIZZATORE.";
            }
            return "Esplora in profondità: VAI BASSO dal Corridoio Principale per raggiungere i Laboratori di Risonanza.";
        }
    }

    // Stele mancante
    if (!has('Stele del Ricordo') && has('Taglierina al Plasma')) {
        if (loc === 'Santuario del Silenzio') {
            if (flags.steleRevealed && !flags.stelePresa) {
                return "Lo scomparto dell'altare è aperto. PRENDI STELE per ottenere la prima chiave.";
            }
            if (has('Disco di Pietra')) {
                return "Hai il Disco. Appoggialo nell'incavo dell'altare: USA DISCO SU ALTARE.";
            }
            return "Il Disco che apre l'altare si trova nello Scriptorium, a OVEST. Vai a prenderlo e torna qui.";
        }
        if (loc === 'Scriptorium') {
            if (has('Disco di Pietra')) {
                return "Hai il Disco. Torna al Santuario del Silenzio: vai EST, poi USA DISCO SU ALTARE per aprire lo scomparto segreto.";
            }
            return "Il Disco di Pietra è incastrato nel proiettore rotto sulla parete nord. PRENDI DISCO per recuperarlo.";
        }
        return "Cerca la Stele del Ricordo (Chiave 1/3) nel Santuario del Silenzio. Dal Corridoio vai Nord, poi Ovest verso lo Scriptorium: prendi il Disco e usalo sull'Altare.";
    }

    // Seme mancante
    if (!has('Seme Vivente') && has('Taglierina al Plasma')) {
        if (loc === 'Serra Morente') {
            if (flags.semeLiberato) {
                return "Il Seme fluttua libero sopra il piedistallo. PRENDI SEME per ottenere la seconda chiave.";
            }
            if (has('Tavoletta Incisa')) {
                return "Hai la Tavoletta. Inseriscila nel pannello alla base della teca: USA TAVOLETTA SU TECA.";
            }
            return "La Tavoletta è nascosta tra i resti di un arbusto vicino alla parete. PRENDI TAVOLETTA, poi USA TAVOLETTA SU TECA.";
        }
        return "Cerca il Seme Vivente (Chiave 2/3) nella Serra Morente. Dal Corridoio vai Sud, esamina le piante, prendi la Tavoletta e usala sulla Teca.";
    }

    // Phase 1: entrare nel relitto
    if (!has('Taglierina al Plasma')) {
        if (loc === 'Plancia della Santa Maria') {
            return "Esplora la tua nave. Vai OVEST verso la Stiva per trovare gli strumenti.";
        }
        if (loc === 'Stiva') {
            if (!flags['kitAperto']) {
                return "C'è un Kit di Manutenzione qui. PRENDI KIT, poi USA KIT per ottenere Taglierina e Batteria.";
            }
            return "Hai gli strumenti. Ora prendi e indossa la tuta: PRENDI TUTA, poi USA TUTA.";
        }
        return "Torna alla Stiva della tua nave e apri il kit di manutenzione.";
    }

    if (!flags['isWearingSuit']) {
        if (loc === 'Stiva') {
            return "Hai gli strumenti. Ora prendi e indossa la tuta spaziale: PRENDI TUTA, poi USA TUTA.";
        }
        return "Devi indossare la tuta spaziale prima di uscire nel vuoto. Torna in Stiva.";
    }

    if (loc === 'Stiva') {
        return "Sei equipaggiato. Vai SUD per raggiungere lo Scafo Esterno del Relitto.";
    }
    if (loc === 'Scafo Esterno del Relitto') {
        return "ANALIZZA SCAFO per trovare un punto debole, poi USA TAGLIERINA SU CREPA per creare un varco. Poi ENTRA.";
    }
    if (loc === 'Camera di Compensazione') {
        return "Il sistema è senza energia. ANALIZZA PANNELLO, poi USA BATTERIA SU PANNELLO. Infine APRI PORTA.";
    }
    if (loc === 'Corridoio Principale') {
        return "Sei nel cuore del relitto. Hai bisogno di tre chiavi per la Grande Porta a Ovest. Esplora Nord (Santuario), Sud (Serra) e in profondità (VAI BASSO).";
    }

    // Anticamera: unica azione possibile è avanzare
    if (loc === 'Anticamera Santuario') {
        return "Sei nell'Anticamera del Santuario. Un solo passo ti separa dalla fine: AVANTI, o ENTRA.";
    }

    // Laboratori di Risonanza: sintonizzatore o attivazione energia
    if (loc === 'Laboratori di Risonanza') {
        if (!has('Sintonizzatore di Frequenza')) {
            return "Sei nei Laboratori di Risonanza. Cerca il Sintonizzatore di Frequenza sul banco di lavoro: PRENDI SINTONIZZATORE.";
        }
        if (has('Cristallo Dati Attivato') && !flags['isPowerRestored']) {
            return "Hai il Cristallo Dati Attivato. Inseriscilo nei macchinari per ripristinare l'energia della nave: USA CRISTALLO SU MACCHINARI.";
        }
        return "Sei nei Laboratori. Hai già preso il Sintonizzatore. Risali al Corridoio Principale: VAI ALTO.";
    }

    // Ponte di Comando: richiede energia ripristinata prima di attivare la console
    if (loc === 'Ponte di Comando') {
        if (!flags['isPowerRestored']) {
            return "Il Ponte è inerte: manca l'energia. Ripristina i sistemi della nave dai Laboratori di Risonanza (USA CRISTALLO SU MACCHINARI), poi torna qui e USA CONSOLE.";
        }
        if (!flags['isHologramActive']) {
            return "I sistemi sono alimentati. USA CONSOLE (la postazione del comandante) per risvegliare il Ponte e proiettare la mappa stellare.";
        }
        if (!flags['isFinalDoorOpen']) {
            return "La mappa stellare è attiva. ESAMINA MAPPA per capire la rotta, poi apri la porta finale: la chiave è il numero dei soli del loro sistema. TOCCA TRE PUNTE.";
        }
        return "La porta finale è aperta. ENTRA per raggiungere il Santuario.";
    }

    // Alloggi dell'Equipaggio: recupero cilindro mnemonico
    if (loc === "Alloggi dell'Equipaggio") {
        if (!flags['cilindroPreso']) {
            return "Negli Alloggi c'è qualcosa da recuperare: ESAMINA CADAVERE, poi PRENDI CILINDRO e ANALIZZA CILINDRO per ascoltare le ultime voci dell'equipaggio K'tharr.";
        }
        return "Hai già recuperato il Cilindro Mnemonico. Torna al Corridoio Principale: VAI NORD.";
    }

    return "Esplora con attenzione. Usa ESAMINA per gli oggetti visibili e ANALIZZA per i dati tecnici nascosti. Ogni stanza ha i suoi segreti.";
}

/* ─── Diario di bordo ─────────────────────────────────────────────────────
   Raccoglie tutti i flag di scoperta e li presenta in un log leggibile.
   Nessun side-effect: è pura lettura dello stato.                         */
function getDiario(state: PlayerState): string {
    const entries: string[] = [];
    const flags = state.flags;
    const pct = (flags.translationProgress as number) ?? 0;

    if (flags.lastraAnalizzata)      entries.push("▸ LASTRA DATI [4%]\n  '...giorno del Grande Salto...'");
    if (flags.cilindroAnalizzato)    entries.push("▸ CILINDRO MNEMONICO [18%]\n  '...seme-dell-anima...'");
    if (flags.steleAnalizzata)       entries.push("▸ STELE DEL RICORDO [75%]\n  '...Tre soli sanguinarono...'");
    if (pct >= 100)                  entries.push("▸ NUCLEO DI MEMORIA [100%]\n  '...sappia che siamo esistiti...'");
    if (flags['cadavereAnalizzato']) entries.push("▸ ASTRONAUTA UMANO [Arca Biologica]\n  Homo sapiens. ~847 anni fa.");
    if (flags.tutaAnalizzata)        entries.push("▸ MISSIONE AURORA-7\n  'NON SIAMO SOLI — L.V.'");
    if (flags['capsulaAnalizzata'])  entries.push("▸ ARCA BIOLOGICA\n  Ecosistema completo. Tutto perduto.");
    if (state.echoes.length > 0)     entries.push(`▸ ECHI TEMPORALI\n  ${state.echoes.length}/11 registrati.`);
    if (flags.knowsAboutTrinarySystem) entries.push("▸ SISTEMA TRINO K'THARR\n  Tre soli. 'Grande Salto'...");

    if (entries.length === 0) return "Il diario di bordo è vuoto. Esplora e usa ANALIZZA.";
    const bar = pct > 0 ? progressBar(pct) : '';
    return `DIARIO DI BORDO\n${'─'.repeat(40)}${bar ? '\n' + bar : ''}\n\n${entries.join('\n\n')}`;
}

/* ─── Inventario formattato HTML ──────────────────────────────────────────
   Genera markup HTML sicuro (contenuto interamente da dati interni) con
   colori CRT per header e bullet ►. Nessun input utente incluso.         */
/** Neutralizza i metacaratteri HTML. I nomi oggetto sono dati interni, ma il
    risultato finisce in dangerouslySetInnerHTML: l'escape impedisce che un
    valore di stato inatteso venga interpretato come markup/script (BUG B6). */
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function getInventarioHtml(state: PlayerState): string {
    const inv = state.inventory;
    const header = `<span style="color:var(--p-bright);letter-spacing:0.08em;">INVENTARIO [${inv.length}/\u221e]</span>`;
    if (inv.length === 0) {
        return header + `<br/><span style="color:var(--p-main);">Nessun oggetto.</span>`;
    }
    const items = inv.map(item => {
        // Etichetta "(indossata)" derivata dal flag, senza alterare la stringa in
        // inventario (vedi BUG B9 in stiva.ts).
        const label = (item === 'Tuta Spaziale' && state.flags.isWearingSuit)
            ? 'Tuta Spaziale (indossata)'
            : item;
        return `<br/><span style="color:var(--p-bright);">\u25ba</span> <span style="color:var(--p-main);">${escapeHtml(label)}</span>`;
    }).join('');
    return header + items;
}

/* ─── Mappa ASCII progressiva ────────────────────────────────────────────
   Mostra le stanze esplorate con nome completo; quelle non visitate come
   [???]. La posizione corrente è marcata con [*NM*].                     */
export function getMappa(state: PlayerState): string {
    const visited = state.visitedRooms ?? [];
    const cur     = state.location;
    const vis     = (name: string) => visited.includes(name);

    /* — Nodo: label se visitata, spazi identici (stessa larghezza) se inesplorata ——— */
    const n = (name: string, abbrev: string): string => {
        if (!vis(name)) return ' '.repeat(abbrev.length + 2);
        return cur === name ? `[*${abbrev}*]` : `[${abbrev}]`;
    };

    /* — Connettori: visibili solo se almeno una stanza adiacente è stata visitata ——— */
    const h  = (a: string, b: string): string => (vis(a) || vis(b)) ? '──' : '  ';
    const v  = (a: string, b: string): string => (vis(a) || vis(b)) ? '│' : ' ';
    const br = (a: string, b: string): string => (vis(a) || vis(b)) ? '└' : ' ';

    const rP  = 'Plancia della Santa Maria';
    const rS  = 'Stiva';
    const rSE = 'Scafo Esterno del Relitto';
    const rCC = 'Camera di Compensazione';
    const rCO = 'Corridoio Principale';
    const rAL = "Alloggi dell'Equipaggio";
    const rSR = 'Serra Morente';
    const rAB = 'Arca Biologica';
    const rSS = 'Santuario del Silenzio';
    const rSC = 'Scriptorium';
    const rAM = 'Arca della Memoria';
    const rLR = 'Laboratori di Risonanza';
    const rPC = 'Ponte di Comando';
    const rAN = 'Anticamera Santuario';
    const rSX = 'Santuario Centrale';

    const P  = n(rP,  'PLANCIA');
    const S  = n(rS,  'STIVA');
    const SE = n(rSE, 'SCAFO EST.');
    const CC = n(rCC, 'CAM.COMP.');
    const CO = n(rCO, 'CORRIDOIO');
    const AL = n(rAL, 'ALLOGGI');
    const SR = n(rSR, 'SERRA');
    const AB = n(rAB, 'ARC.BIO.');
    const SS = n(rSS, 'SAN.SIL.');
    const SC = n(rSC, 'SCRIPTORI.');
    const AM = n(rAM, 'ARC.MEM.');
    const LR = n(rLR, 'LABORAT.');
    const PC = n(rPC, 'PONTE COM.');
    const AN = n(rAN, 'ANTICAM.');
    const SX = n(rSX, 'SAN.CENT.');

    const visitedCount = visited.length;
    const ln = '─'.repeat(42);

    return `MAPPA DI NAVIGAZIONE — ${visitedCount}/15 esplorate
${ln}
  ${P}${h(rP,rS)}${S}
                    ${v(rS,rSE)}
              ${SE}
                    ${v(rSE,rCC)}
              ${CC}
                    ${v(rCC,rCO)}
${SS}${h(rSS,rCO)}${CO}${h(rCO,rAL)}${AL}
   ${v(rSS,rSC)}       ${v(rCO,rSR)}  ${br(rAL,rLR)}${h(rAL,rLR)}${LR}
  ${SC}  ${SR}        ${v(rLR,rPC)}
   ${v(rSC,rAM)}       ${v(rSR,rAB)}     ${PC}
  ${AM} ${AB}        ${v(rPC,rAN)}
                    ${AN}
                     ${v(rAN,rSX)}
                    ${SX}
${ln}
[*NM*] = posizione attuale   aree inesplorate non mostrate`;
}

/* ─── Statistiche fine partita ───────────────────────────────────────────
   Genera il resoconto di missione mostrato prima del game-over finale.
   Raccoglie dati da visitedRooms, echoes e flag di analisi.              */
export function getStats(state: PlayerState): string {
    const visitedCount  = (state.visitedRooms ?? []).length;
    const totalRooms    = 15;
    const echoCount     = state.echoes.length;
    const totalEchoes   = 11; // 11 stanze con eco su 15 totali (le 4 senza eco: Scafo Esterno, Arca della Memoria, Santuario Centrale, Anticamera del Santuario). Tutti gli 11 echi sono ottenibili: quelli delle stanze sigillate vengono catturati retroattivamente dal Sintonizzatore — vedi SEALED_ECHO_ROOMS in echoData.ts (BUG B2).
    const pct           = (state.flags.translationProgress as number) ?? 0;

    const analysisFlagsList = [
        'lastraAnalizzata', 'cilindroAnalizzato', 'steleAnalizzata',
        'cadavereAnalizzato', 'tutaAnalizzata', 'capsulaAnalizzata',
    ];
    const analyzedCount = analysisFlagsList.filter(f => state.flags[f]).length
                        + (pct >= 100 ? 1 : 0);
    const totalAnalyzed = 7;

    const bar = (n: number, total: number, w = 10): string => {
        const filled = Math.min(w, Math.round(n / total * w));
        return '█'.repeat(filled) + '░'.repeat(w - filled);
    };

    const score  = Math.round(
        (visitedCount / totalRooms)   * 40 +
        (echoCount    / totalEchoes)  * 30 +
        (analyzedCount / totalAnalyzed) * 30
    );
    const rating = score >= 80 ? 'CUSTODE DELLA MEMORIA' :
                   score >= 60 ? 'ARCHIVISTA STELLARE'   :
                   score >= 40 ? 'RECUPERATORE DI FRAMMENTI' :
                                 'ESPLORATORE CURIOSO';

    const ln = '─'.repeat(38);
    return `RESOCONTO MISSIONE
${ln}
Stanze esplorate: ${String(visitedCount).padStart(2)}/${totalRooms}  ${bar(visitedCount, totalRooms)}
Echi temporali:    ${echoCount}/${totalEchoes}  ${bar(echoCount, totalEchoes)}
Traduzione:       ${String(pct).padStart(3)}%  ${bar(pct, 100)}
Oggetti analizzati:${String(analyzedCount).padStart(2)}/${totalAnalyzed}  ${bar(analyzedCount, totalAnalyzed)}
${ln}
VALUTAZIONE: ${rating}`;
}

// FIX: Export normalizeCommand to be used in other files.
export const normalizeCommand = (command: string): string => {
    let normalized = command
        .toLowerCase()
        .trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Rimuove accenti
        .replace(/\b(il|lo|la|i|gli|le|un|uno|una|un'|l')\s+/g, '') // Rimuove articoli
        .replace(/\b(quel|quello|quella|quei|quegli|quelle|questo|questa|questi|queste)\s+/g, '') // Rimuove dimostrativi
        .replace(/\b(con|sopra)\b/g, 'su') // Normalizza preposizioni
        .replace(/\s+/g, ' ') // Collassa spazi multipli
        .replace(/^(entra|vai) (nel|nella|nell'|nello|nelle|in) /, '$1 '); // Rimuove prep. articolate dopo entra/vai

    // Gestione Abbreviazioni — Movimento
    if (normalized === 'n') return 'nord';
    if (normalized === 's') return 'sud';
    if (normalized === 'e') return 'est';
    if (normalized === 'o' || normalized === 'w') return 'ovest';
    if (normalized === 'u') return 'alto';
    if (normalized === 'd' || normalized === 'giu') return 'basso'; // giu = giù dopo rimozione accento

    // Azioni
    if (normalized === 'l') return 'guarda';
    if (normalized === 'i' || normalized === 'inv') return 'inventario';

    // Alias verbi: INDOSSA → USA, LEGGI → ANALIZZA
    if (normalized.startsWith('indossa ')) {
        return normalized.replace(/^indossa /, 'usa ');
    }
    if (normalized.startsWith('leggi ')) {
        return normalized.replace(/^leggi /, 'analizza ');
    }

    // Comandi con argomenti (es. "x oggetto")
    if (normalized.startsWith('x ')) {
        return normalized.replace(/^x /, 'esamina ');
    }

    return normalized;
};

export const initialState: PlayerState = {
    location: 'Plancia della Santa Maria',
    inventory: [],
    flags: {},
    echoes: [],
    visitedRooms: ['Plancia della Santa Maria'],
};

/* ─── Helper: confronto nome item (normalizzato) ──────────────────────── */
const matchesItemName = (item: Item, target: string): boolean =>
    normalizeCommand(item.name) === target ||
    item.synonyms.some(s => normalizeCommand(s) === target);

export const processCommand = (command: string, currentState: PlayerState): { response: GameResponse; newState: PlayerState } => {
    const newState = cloneDeep(currentState);
    const normalizedCommand = normalizeCommand(command);

    /* Appende la barra di progresso alla descrizione se translationProgress
       è cambiato durante l'elaborazione del comando corrente.            */
    const withProgressBar = (desc: string): string => {
        const prev = currentState.flags.translationProgress as number | undefined;
        const next = newState.flags.translationProgress as number | undefined;
        return (next !== undefined && next !== prev)
            ? desc + '\n\n' + progressBar(next)
            : desc;
    };

    let response: GameResponse = {
        description: "Non capisco quel comando.",
        eventType: 'error',
    };

    /* ── Comandi globali ─────────────────────────────────────────────── */
    if (command.toLowerCase().trim() === 'inizia') {
        const room = gameData[newState.location];
        response = { description: room.description(newState), eventType: null, clearScreen: true };
        return { response, newState };
    }

    if (normalizedCommand === 'guarda' || normalizedCommand === 'esamina stanza' || normalizedCommand === 'guardati intorno' || normalizedCommand === 'esamina') {
        const room = gameData[newState.location];
        response = { description: room.description(newState), eventType: null, clearScreen: false };
        return { response, newState };
    }

    if (normalizedCommand === 'aiuto' || normalizedCommand === 'help') {
        response = { description: getHelpText(), eventType: null };
        return { response, newState };
    }

    if (normalizedCommand === 'hint' || normalizedCommand === 'suggerimento' || normalizedCommand === 'consiglio' || normalizedCommand === 'suggerisci') {
        response = { description: `[ SUGGERIMENTO ]\n${getContextualHint(newState)}`, eventType: null };
        return { response, newState };
    }

    if (normalizedCommand === 'aspetta' || normalizedCommand === 'z' || normalizedCommand === 'attendi') {
        response = { description: "Aspetti. Il silenzio della nave ti avvolge completamente. Nulla si muove, nulla cambia. Il tempo scorre, indifferente.", eventType: null };
        return { response, newState };
    }

    if (normalizedCommand === 'mappa' || normalizedCommand === 'map' || normalizedCommand === 'mostra mappa') {
        response = { description: getMappa(newState), eventType: null };
        return { response, newState };
    }

    if (normalizedCommand === 'echi' || normalizedCommand === 'mostra echi' || normalizedCommand === 'echi temporali') {
        if (newState.echoes.length === 0) {
            response = { description: "Non hai ancora rilevato nessun eco temporale. Usa il Sintonizzatore di Frequenza nelle stanze silenziose.", eventType: null };
        } else {
            const echoList = newState.echoes
                .map((id, i) => `[ECO ${i + 1}] ${ECHO_TEXTS[id] ?? id}`)
                .join('\n\n');
            response = { description: `ECHI TEMPORALI REGISTRATI (${newState.echoes.length}):\n\n${echoList}`, eventType: 'echo' };
        }
        return { response, newState };
    }

    if (normalizedCommand === 'nota' || normalizedCommand === 'diario' || normalizedCommand === 'appunti' || normalizedCommand === 'log') {
        response = { description: getDiario(newState), eventType: null };
        return { response, newState };
    }

    if (normalizedCommand === 'inventario') {
        response = { description: getInventarioHtml(newState), eventType: null, html: true };
        return { response, newState };
    }

    /* ── Attivazione Cristallo Dati — comando globale ────────────────────
       Funziona in qualsiasi stanza: entrambi gli item sono in inventario.
       Precedentemente era un Room Command di corridoioPrincipale.ts,
       causando un fallimento silenzioso se tentato in altre stanze.      */
    const crystalActivateMatch = normalizedCommand.match(/^(usa|attiva) (dispositivo|dispositivo medico|strumento) (su|con) (cristallo|cristallo dati|cristallo dati opaco)$/);
    if (crystalActivateMatch) {
        if (newState.inventory.includes("Cristallo Dati Attivato")) {
            response = { description: "Il cristallo dati è già attivo.", eventType: 'error' };
            return { response, newState };
        }
        if (!newState.inventory.includes("Dispositivo Medico Alieno")) {
            response = { description: "Non hai un dispositivo medico.", eventType: 'error' };
            return { response, newState };
        }
        if (!newState.inventory.includes("Cristallo Dati Opaco")) {
            response = { description: "Non hai un cristallo dati opaco da attivare.", eventType: 'error' };
            return { response, newState };
        }
        const crystalIndex = newState.inventory.indexOf("Cristallo Dati Opaco");
        newState.inventory.splice(crystalIndex, 1);
        newState.inventory.push("Cristallo Dati Attivato");
        newState.flags.isCrystalAwake = true;
        const activationFull = "Con una certa esitazione, attivi il dispositivo medico. La sua punta di cristallo emette un ronzio quasi inudibile e una debole luce ambrata. Avvicini la punta al cristallo opaco che tieni nell'altra mano.[PAUSE]Non appena si toccano, il cristallo dati reagisce. La sua superficie lattiginosa diventa trasparente, rivelando al suo interno una complessa matrice di filamenti luminosi che pulsano in sincrono, come un cuore che ha ripreso a battere. Ora è tiepido e vibra debolmente. Sembra... in attesa. Sembra fatto per essere inserito in qualcosa.";
        const pauseIdx = activationFull.indexOf('[PAUSE]');
        response = {
            description: activationFull.substring(0, pauseIdx),
            continueText: activationFull.substring(pauseIdx + '[PAUSE]'.length),
            eventType: 'magic'
        };
        return { response, newState };
    }

    const currentRoomData = gameData[newState.location];
    if (!currentRoomData) {
        response = { description: "ERRORE CRITICO: La stanza non esiste.", eventType: 'error' };
        return { response, newState };
    }

    /* ── Room commands (regex prioritari — logica complessa, puzzle, movimento) */
    for (const cmd of currentRoomData.commands) {
        const match = normalizedCommand.match(getCachedRegex(cmd.regex));
        if (match) {
            const result = cmd.handler(newState, match);
            let description = result.description;
            let continueText: string | null = null;
            const pauseMarker = "[PAUSE]";
            if (description.includes(pauseMarker)) {
                const parts = description.split(pauseMarker);
                description = parts[0];
                continueText = parts.slice(1).join(pauseMarker);
            }
            response = {
                description,
                eventType: result.eventType || null,
                gameOver: result.gameOver || null,
                continueText,
                typewriter: result.typewriter,
            };
            if (newState.location !== currentState.location) {
                response.clearScreen = true;
                if (!newState.visitedRooms) newState.visitedRooms = [];
                if (!newState.visitedRooms.includes(newState.location)) {
                    newState.visitedRooms.push(newState.location);
                }
            }
            return { response, newState };
        }
    }

    /* ── Item System ─────────────────────────────────────────────────────
       Due percorsi nettamente separati per evitare ambiguità:
       1. USA X SU Y  — combinazione oggetto+bersaglio (onCombine)
       2. VERBO X     — azione semplice su oggetto (room o inventario)     */
    if (currentRoomData.items) {
        const allItems = getAllItems();

        /* — Percorso 1: USA / ATTIVA  X  SU/CON/CONTRO  Y ————————————— */
        const combineMatch = normalizedCommand.match(/^(usa|attiva) (.+?) (su|con|contro) (.+)$/);
        if (combineMatch) {
            const sourceName = combineMatch[2].trim();
            const targetName = combineMatch[4].trim();

            // Sorgente: stanza prima, poi ricerca globale tra item in inventario
            const sourceItem =
                currentRoomData.items.find(i => matchesItemName(i, sourceName)) ??
                allItems.find(i =>
                    matchesItemName(i, sourceName) &&
                    newState.inventory.some(inv => normalizeCommand(inv) === normalizeCommand(i.name))
                );
            // Bersaglio: solo nella stanza corrente
            const targetItem = currentRoomData.items.find(i => matchesItemName(i, targetName));

            if (sourceItem && targetItem) {
                if (sourceItem.onCombine) {
                    const result = sourceItem.onCombine(targetItem.id, newState);
                    response = { description: result.description, eventType: result.eventType || 'item_use', gameOver: result.gameOver, typewriter: result.typewriter };
                    return { response, newState };
                }
                response = { description: `Usare ${sourceItem.name} su ${targetItem.name} non sembra avere alcun effetto.`, eventType: 'error' };
                return { response, newState };
            }
            // Sorgente trovata ma non nell'inventario e non fissa
            if (sourceItem && !sourceItem.isFixed &&
                !newState.inventory.some(inv => normalizeCommand(inv) === normalizeCommand(sourceItem.name))) {
                response = { description: `Non hai ${sourceItem.name}.`, eventType: 'error' };
                return { response, newState };
            }
            // targetItem non trovato: fall through ai fallback generici
        }

        /* — Percorso 2: VERBO semplice su X ———————————————————————————— */
        const simpleMatch = normalizedCommand.match(/^(esamina|guarda|analizza|prendi|raccogli|usa|attiva|apri) (.+)$/);
        if (simpleMatch) {
            const verb       = simpleMatch[1];
            const targetName = simpleMatch[2].trim();

            // Non processare "usa X su Y" qui: già gestito nel Percorso 1
            if (!targetName.includes(' su ') && !targetName.includes(' con ') && !targetName.includes(' contro ')) {

                // Cerca nella stanza; se non trovato, cerca tra gli item in inventario (globale)
                const item =
                    currentRoomData.items.find(i => matchesItemName(i, targetName)) ??
                    allItems.find(i =>
                        matchesItemName(i, targetName) &&
                        newState.inventory.some(inv => normalizeCommand(inv) === normalizeCommand(i.name))
                    );

                if (item) {
                    if (verb === 'esamina' || verb === 'guarda') {
                        response = { description: item.description, eventType: null };
                        return { response, newState };
                    }

                    if (verb === 'analizza') {
                        if (item.onAnalyze) {
                            const result = item.onAnalyze(newState);
                            response = { description: withProgressBar(result.description), eventType: result.eventType || 'magic', gameOver: result.gameOver, typewriter: result.typewriter };
                            return { response, newState };
                        }
                        if (item.details) {
                            response = { description: withProgressBar(item.details), eventType: 'magic' };
                            return { response, newState };
                        }
                        response = { description: `Analizzi ${item.name}, ma non rilevi nulla di insolito.`, eventType: null };
                        return { response, newState };
                    }

                    if (verb === 'prendi' || verb === 'raccogli') {
                        if (item.isFixed) {
                            response = { description: "Non puoi prenderlo.", eventType: 'error' };
                        } else if (item.isPickable) {
                            const flagId = `picked_${newState.location}_${item.id}`;
                            if (newState.flags[flagId]) {
                                response = { description: "Non c'è più nulla da prendere.", eventType: 'error' };
                            } else {
                                newState.inventory.push(item.name);
                                newState.flags[flagId] = true;
                                response = { description: `Hai preso: ${item.name}.`, eventType: 'item_pickup' };
                            }
                        } else {
                            response = { description: "Non serve prenderlo.", eventType: 'error' };
                        }
                        return { response, newState };
                    }

                    if (verb === 'usa' || verb === 'attiva' || verb === 'apri') {
                        if (item.onUse) {
                            const result = item.onUse(newState);
                            response = { description: withProgressBar(result.description), eventType: result.eventType || 'item_use', gameOver: result.gameOver, typewriter: result.typewriter };
                            return { response, newState };
                        }
                        response = { description: `Non sai come usare ${item.name} da solo. Forse devi usarlo su qualcosa.`, eventType: 'error' };
                        return { response, newState };
                    }
                }
            }
        }
    }

    /* ── Fallback generici ───────────────────────────────────────────── */

    // Caso speciale: usa taglierina su batteria
    if (/^(usa) (taglierina|taglierina al plasma) su (batteria|batteria di emergenza)$/.test(normalizedCommand)) {
        if (newState.inventory.includes("Taglierina al Plasma") && newState.inventory.includes("Batteria di Emergenza")) {
            response = { description: `Sarebbe un'idea terribilmente stupida. Potresti causare un'esplosione.`, eventType: 'error' };
            return { response, newState };
        }
    }

    // USA X SU Y generico — nessuna corrispondenza nell'item system
    const genericUsaSuY = normalizedCommand.match(/^(usa|attiva) (.+) su (.+)$/);
    if (genericUsaSuY) {
        const srcName = genericUsaSuY[2].trim();
        const hasItem = newState.inventory.some(inv => {
            const n = normalizeCommand(inv);
            return n === srcName || n.startsWith(srcName + ' ');
        });
        if (hasItem) {
            response = { description: `Usare ${srcName} su ${genericUsaSuY[3]} non sembra avere alcun effetto.`, eventType: 'error' };
        } else {
            response = { description: `Non hai '${srcName}'.`, eventType: 'error' };
        }
        return { response, newState };
    }

    // TOCCA X generico — oggetto non trovato o senza handler nella stanza corrente
    const genericTocca = normalizedCommand.match(/^tocca (.+)$/);
    if (genericTocca) {
        response = { description: `Sfioreresti ${genericTocca[1]}, ma non c'è nulla di particolare da notare al tatto.`, eventType: null };
        return { response, newState };
    }

    // USA / ATTIVA / APRI / LEGGI X singolo generico
    const genericUsaSingle = normalizedCommand.match(/^(usa|attiva|apri|leggi) (.+)$/);
    if (genericUsaSingle) {
        const itemName = genericUsaSingle[2].trim();
        const action   = genericUsaSingle[1];
        const hasItem  = newState.inventory.some(inv => {
            const n = normalizeCommand(inv);
            return n === itemName || n.startsWith(itemName + ' ');
        });
        const verbInfinitive: Record<string, string> = {
            usa: 'usare', attiva: 'attivare', apri: 'aprire', leggi: 'leggere'
        };
        const infinitive = verbInfinitive[action] ?? action;
        if (hasItem) {
            response = { description: `Cosa vuoi ${infinitive} con '${itemName}'? Devi essere più specifico (es. USA ${itemName.toUpperCase()} SU ...).`, eventType: 'error' };
            return { response, newState };
        }
    }

    // ANALIZZA generico — oggetto non trovato
    const genericAnalizza = normalizedCommand.match(/^(analizza) (.+)$/);
    if (genericAnalizza) {
        response = { description: `Analizzi ${genericAnalizza[2]}, ma non c'è nulla di anormale o interessante da segnalare.`, eventType: null };
        return { response, newState };
    }

    /* ── Suggerimento fuzzy ──────────────────────────────────────────────
       Se il primo token del comando somiglia (Levenshtein ≤ 2) a un verbo
       noto, suggerisce la correzione invece di mostrare solo "Non capisco". */
    const firstWord = normalizedCommand.split(' ')[0];
    if (firstWord.length >= 3) {
        const closest = KNOWN_VERBS
            .map(v => ({ verb: v, dist: levenshtein(firstWord, v) }))
            .filter(x => x.dist <= 2 && x.dist < firstWord.length)
            .sort((a, b) => a.dist - b.dist)[0];
        if (closest) {
            const suggestion = normalizedCommand.replace(firstWord, closest.verb);
            response = {
                description: `Non capisco "${command.trim()}". Intendevi "${suggestion.toUpperCase()}"?`,
                eventType: 'error',
            };
            return { response, newState };
        }
    }

    return { response, newState };
};
