/* ───────────────────────────────────────────────────────────────────────────
   SIMULAZIONE INTEGRALE — Il Relitto Silente
   Guida il motore puro (processCommand) dall'inizio alla fine giocando davvero
   l'intero gioco: critical path + TUTTO il contenuto opzionale (11 echi di
   superficie + 4 profondi, TRADUCI a ogni soglia, 3 INCIDI, 7 analisi, 15
   stanze, porta finale, epilogo). Verifica connettività e stato a ogni passo.
   Non è un test del codice di rendering: è un walkthrough end-to-end del motore.
   Esecuzione: esbuild bundle → node.
   ─────────────────────────────────────────────────────────────────────────── */
import { processCommand, initialState, getStats, getMappa } from '../game/gameLogic';
import { PlayerState } from '../types';
import { LOCATION_TO_ECHO, DEEP_ECHOES } from '../game/echoData';

let state: PlayerState = JSON.parse(JSON.stringify(initialState));
const failures: string[] = [];
const warnings: string[] = [];
let stepNo = 0;

type Opt = {
    ok?: boolean;            // false = non pretendo successo (comando deliberatamente bloccato)
    allowError?: boolean;    // accetta eventType 'error' senza segnalarlo
    loc?: string;            // location attesa dopo il comando
    contains?: string | string[];
    notContains?: string | string[];
    flag?: Record<string, boolean | number | string>;
    item?: string | string[];
    noItem?: string | string[];
    gameOver?: boolean;
    gameOverContains?: string | string[];
};

function step(cmd: string, opt: Opt = {}): any {
    stepNo++;
    const { response, newState } = processCommand(cmd, state);
    state = newState;
    const desc = response.description || '';
    // Flusso completo mostrato al giocatore: descrizione + continuazione ([PAUSE])
    // + eventuale epilogo. I controlli di testo guardano l'intera catena, perché
    // i room command spezzano [PAUSE] in description/continueText (impaginazione UI).
    const fullText = desc + (response.continueText || '') + (response.gameOver || '');
    const isErr = response.eventType === 'error';
    const notUnderstood = desc.startsWith('Non capisco') || desc === 'Non capisco quel comando.';
    const tag = `#${String(stepNo).padStart(3)} [${state.location}] "${cmd}"`;

    if (opt.ok !== false) {
        if (notUnderstood) failures.push(`${tag} → NON CAPITO: ${desc.slice(0, 90)}`);
        else if (isErr && !opt.allowError) failures.push(`${tag} → ERRORE INATTESO: ${desc.slice(0, 110)}`);
    }
    if (opt.loc && state.location !== opt.loc) failures.push(`${tag} → loc attesa "${opt.loc}" ma sei in "${state.location}"`);
    for (const s of ([] as string[]).concat(opt.contains ?? [])) if (!fullText.includes(s)) failures.push(`${tag} → manca testo "${s}"`);
    for (const s of ([] as string[]).concat(opt.notContains ?? [])) if (fullText.includes(s)) failures.push(`${tag} → testo indesiderato presente "${s}"`);
    for (const [k, v] of Object.entries(opt.flag ?? {})) if (state.flags[k] !== v) failures.push(`${tag} → flag ${k}=${JSON.stringify(state.flags[k])} atteso ${JSON.stringify(v)}`);
    for (const it of ([] as string[]).concat(opt.item ?? [])) if (!state.inventory.includes(it)) failures.push(`${tag} → manca in inventario "${it}"`);
    for (const it of ([] as string[]).concat(opt.noItem ?? [])) if (state.inventory.includes(it)) failures.push(`${tag} → item indesiderato "${it}"`);
    if (opt.gameOver && !response.gameOver) failures.push(`${tag} → atteso gameOver, assente`);
    for (const s of ([] as string[]).concat(opt.gameOverContains ?? [])) if (!(response.gameOver || '').includes(s)) failures.push(`${tag} → gameOver manca "${s}"`);
    return response;
}

const echoCount = () => state.echoes.length;
const deepCount = () => DEEP_ECHOES.filter(d => state.flags[d.id]).length;
const tp = () => (state.flags.translationProgress as number) ?? 0;

// ═══ ATTO I — L'INGRESSO ════════════════════════════════════════════════════
step('inizia');
step('esamina plancia', { contains: 'PLANCIA DELLA SANTA MARIA' });   // Fix B: ESAMINA <nome stanza>
step('esamina stanza', { contains: 'PLANCIA DELLA SANTA MARIA' });    // Fix B: parola generica
step('analizza plancia');                                            // ANALIZZA generico (nessun item "plancia")
step('o', { loc: 'Stiva' });
step('esamina lettore', { contains: 'Ghiaccio' });                // ESAMINA: titolo parziale
step('analizza lettore', { contains: 'CASTELLO DI GHIACCIO' });   // ANALIZZA: easter egg completo
step('prendi kit', { item: 'Kit di Manutenzione' });
step('usa kit', { item: ['Taglierina al Plasma', 'Batteria di Emergenza'], flag: { kitAperto: true } });
step('prendi tuta', { item: 'Tuta Spaziale' });
step('usa tuta', { flag: { isWearingSuit: true } });
// Backtracking prima del relitto è ok (Stiva<->Plancia), ma verifichiamo il vuoto-gate:
step('s', { loc: 'Scafo Esterno del Relitto' });
step('esamina scafo');
step('analizza scafo', { flag: { knowsAboutCrack: true } });
step('usa taglierina su crepa', { flag: { isHoleCut: true } });
step('entra', { loc: 'Camera di Compensazione' });
step('esamina incisione');
step('analizza pannello', { flag: { knowsAboutPanelPower: true } });
step('usa batteria su pannello', { flag: { isAirlockDoorPowered: true }, noItem: 'Batteria di Emergenza' });
// Sigillo B11: non si torna indietro a ovest
step('ovest', { ok: false, allowError: true });
step('apri porta', { flag: { isAirlockDoorOpen: true } });
step('e', { loc: 'Corridoio Principale' });

// ═══ ATTO II — recupero Sintonizzatore + echi retroattivi ═══════════════════
step('analizza lastra', { flag: { translationProgress: 4, lastraAnalizzata: true } });
step('analizza tacche');                    // pezzo mistero L.V. (traccia RF)
step('d', { loc: 'Laboratori di Risonanza' });
step('prendi sintonizzatore', { item: 'Sintonizzatore di Frequenza' });
// Prima attivazione: echo_lab + retroattivi sigillati (plancia, stiva, camera) = 4.
// Eco profondo lab è bloccato (tp=4 < 75) → deve segnalare l'esistenza.
step('usa sintonizzatore', { contains: ['INGEGNERE CAPO'] });
if (echoCount() !== 4) failures.push(`Echi dopo 1ª attivazione Labs: ${echoCount()} (attesi 4: lab+plancia+stiva+camera)`);
if (deepCount() !== 0) failures.push(`Deep dopo 1ª attivazione (tp=4): ${deepCount()} (atteso 0, bloccato)`);
step('u', { loc: 'Corridoio Principale' });
step('usa sintonizzatore', { contains: ['VOCE'] });   // echo_corridoio

// ═══ ramo SUD: Serra + Arca Biologica ═══════════════════════════════════════
step('s', { loc: 'Serra Morente' });
step('usa sintonizzatore');                 // echo_serra (deep bloccato: seme non liberato)
step('prendi tavoletta', { item: 'Tavoletta Incisa' });
step('usa tavoletta su teca', { flag: { semeLiberato: true } });
step('prendi seme', { item: 'Seme Vivente' });
// Ritorno col seme liberato: ora l'eco profondo della Serra si sblocca.
step('usa sintonizzatore', { contains: ['Una foresta intera può cominciare da uno'] });
if (!state.flags['echo_serra_deep']) failures.push('echo_serra_deep non catturato dopo semeLiberato');
step('o', { loc: 'Arca Biologica' });
step('usa sintonizzatore');                 // echo_arca
step('esamina cadavere', { flag: { cadavereEsaminatoFirst: true } });
step('analizza cadavere', { flag: { cadavereAnalizzato: true } });
step('analizza tuta', { flag: { tutaAnalizzata: true }, contains: 'L.V.' });
step('analizza capsule', { flag: { capsulaAnalizzata: true } });
step('prendi dispositivo', { item: 'Dispositivo Medico Alieno' });
step('prendi cristallo', { item: 'Cristallo Dati Opaco' });
step('usa dispositivo su cristallo', { item: 'Cristallo Dati Attivato', flag: { isCrystalAwake: true } });
// WS3 — INCIDI accanto a L.V. (cadavere esaminato + tuta analizzata → cita L.V.)
step('incidi', { flag: { incisoArca: true }, contains: 'L.V.' });
step('incidi', { ok: false, allowError: true });   // ripetuto: già fatto
step('e', { loc: 'Serra Morente' });
step('n', { loc: 'Corridoio Principale' });

// ═══ ripristino energia (Laboratori) ════════════════════════════════════════
step('d', { loc: 'Laboratori di Risonanza' });
step('usa cristallo su macchinari', { flag: { isPowerRestored: true }, noItem: 'Cristallo Dati Attivato' });
step('u', { loc: 'Corridoio Principale' });

// ═══ Alloggi (opzionale): cilindro + tp=18 + eco profondo (gate cilindroPreso)
step('entra alloggi', { loc: "Alloggi dell'Equipaggio" });
step('esamina cadavere');
step('prendi cilindro', { item: 'Cilindro Mnemonico', flag: { cilindroPreso: true } });
step('analizza cilindro', { flag: { translationProgress: 18, cilindroAnalizzato: true } });
// Superficie + profondo nella stessa attivazione (gate cilindroPreso già vero):
step('usa sintonizzatore', { contains: ['NAVARCA', 'ho tenuto le luci accese'] });
if (!state.flags['echo_alloggi_deep']) failures.push('echo_alloggi_deep non catturato (gate cilindroPreso)');
step('n', { loc: 'Corridoio Principale' });

// ═══ WS1 — TRADUCI a tp=18 (frammenti) prima del nord ═══════════════════════
step('n', { loc: 'Santuario del Silenzio' });
step('usa sintonizzatore', { contains: ['CUSTODE'] });   // echo_santuario_sil (deep bloccato tp=18)
step('traduci bassorilievi', { contains: 'bassa marea' });   // tier 18-74
step('esamina altare');
step('o', { loc: 'Scriptorium' });
step('prendi disco', { item: 'Disco di Pietra' });
step('usa sintonizzatore', { contains: ['SCRIBA'] });    // echo_scriptorium
step('analizza proiettori');
step('traduci proiettori', { contains: 'registro di chi nacque' });  // tier 18-74
step('traduci lastra', { contains: 'prima persona' });               // tier 18-74
step('e', { loc: 'Santuario del Silenzio' });
step('usa disco su altare', { flag: { steleRevealed: true } });
step('prendi stele', { item: 'Stele del Ricordo', flag: { stelePresa: true } });
// WS5 — analizzare la Stele insegna il sistema trino (knowsAboutTrinarySystem)
step('analizza stele', { flag: { translationProgress: 75, steleAnalizzata: true, knowsAboutTrinarySystem: true } });
// WS1 — TRADUCI bassorilievi a tp=75 (tier pieno)
step('traduci bassorilievi', { contains: 'non racconta soltanto: dice' });
// WS3 — INCIDI nel Santuario del Silenzio
step('incidi', { flag: { incisoSantuario: true }, contains: 'grafia umana' });

// ═══ WS2 — torna ai Labs a tp=75: l'eco profondo dell'Ingegnere si sblocca ═══
step('s', { loc: 'Corridoio Principale' });
step('d', { loc: 'Laboratori di Risonanza' });
step('usa sintonizzatore', { contains: ['Li ho scritti tutti'] });   // deep_lab
if (!state.flags['echo_lab_deep']) failures.push('echo_lab_deep non catturato a tp=75');
step('u', { loc: 'Corridoio Principale' });

// ═══ Arca della Memoria: Nucleo + tp=100 ════════════════════════════════════
step('n', { loc: 'Santuario del Silenzio' });
step('o', { loc: 'Scriptorium' });
step('n', { loc: 'Arca della Memoria' });
step('usa taglierina su terminale', { flag: { isTerminalActive: true } });
step('prendi nucleo', { item: 'Nucleo di Memoria' });
step('analizza nucleo', { flag: { translationProgress: 100 }, contains: 'Sei un testimone' });
step('analizza pilastri');

// ═══ WS2 — Santuario del Silenzio a tp=100: eco profondo del Custode ═════════
step('s', { loc: 'Scriptorium' });
step('e', { loc: 'Santuario del Silenzio' });
step('usa sintonizzatore', { contains: ['Ti ho aspettato'] });   // deep_santuario_sil
if (!state.flags['echo_santuario_sil_deep']) failures.push('echo_santuario_sil_deep non catturato a tp=100');
// WS1 — TRADUCI bassorilievi a tp=100: riga nascosta
step('traduci bassorilievi', { contains: ['Allora non eravamo soli'] });
step('s', { loc: 'Corridoio Principale' });

// ═══ WS3 — INCIDI nel Corridoio (quarta tacca) ══════════════════════════════
step('incidi', { flag: { incisoCorridoio: true }, contains: 'Quattro tacche' });

// ═══ ATTO III — Porta Ovest + Ponte + finale ════════════════════════════════
step('usa seme su porta ovest', { flag: { seedPlaced: true } });
step('usa stele su porta ovest', { flag: { stelePlaced: true } });
step('usa nucleo su porta ovest', { flag: { corePlaced: true, isWestDoorUnlocked: true } });
step('o', { loc: 'Ponte di Comando' });
step('usa sintonizzatore', { contains: ['NAVIGAZIONE'] });   // echo_ponte
step('usa postazione', { flag: { isHologramActive: true } });
step('esamina mappa');
// WS1 — TRADUCI mappa a tp=100: annotazioni + riga nascosta
step('traduci mappa', { contains: ['giardino', 'Non torneremo a vedere se è fiorito'] });
step('analizza mappa');
step('tocca tre punte', { flag: { isFinalDoorOpen: true } });
step('entra', { loc: 'Anticamera Santuario' });
// Anticamera NON ha eco (verifica discrepanza con SOLUZIONE.md 1.2.5)
const echoesBeforeAntic = echoCount();
step('usa sintonizzatore', { allowError: true });
if (echoCount() !== echoesBeforeAntic) failures.push('Anticamera ha catturato un eco: incoerente con il codice (LOCATION_TO_ECHO non la include)');
step('avanti', { loc: 'Santuario Centrale' });

// ═══ FINALE ═════════════════════════════════════════════════════════════════
step('parla con anziano', {
    gameOver: true,
    gameOverContains: ['FINE', 'anello della catena', 'L.V.'],  // marks paragraph (incisoArca cita L.V.)
    flag: { hasHeardMonologue: true },
});

// ═══ VERIFICHE FINALI GLOBALI ═══════════════════════════════════════════════
const visited = state.visitedRooms ?? [];
if (visited.length !== 15) failures.push(`Stanze visitate: ${visited.length}/15 — mancano: ${Object.keys({}).length}`);
if (echoCount() !== 11) failures.push(`Echi di superficie: ${echoCount()}/11`);
if (deepCount() !== 4) failures.push(`Echi profondi: ${deepCount()}/4`);
if (tp() !== 100) failures.push(`Traduzione finale: ${tp()}% (atteso 100)`);
const marks = ['incisoCorridoio', 'incisoArca', 'incisoSantuario'].filter(f => state.flags[f]).length;
if (marks !== 3) failures.push(`Tracce INCIDI: ${marks}/3`);

// Copertura stanze rispetto al registro completo
const allRooms = Object.keys(LOCATION_TO_ECHO).concat(['Scafo Esterno del Relitto', 'Arca della Memoria', 'Santuario Centrale', 'Anticamera Santuario']);
const allRoomNames = ['Plancia della Santa Maria', 'Stiva', 'Scafo Esterno del Relitto', 'Camera di Compensazione', 'Corridoio Principale', 'Serra Morente', 'Arca Biologica', "Alloggi dell'Equipaggio", 'Laboratori di Risonanza', 'Santuario del Silenzio', 'Scriptorium', 'Arca della Memoria', 'Ponte di Comando', 'Anticamera Santuario', 'Santuario Centrale'];
const missing = allRoomNames.filter(r => !visited.includes(r));
if (missing.length) failures.push(`Stanze mai visitate: ${missing.join(', ')}`);

// Diario, mappa, stats — devono generarsi senza eccezioni
const diarioResp = processCommand('diario', state).response;
const mappaResp = processCommand('mappa', state).response;
const echiResp = processCommand('echi', state).response;
if (!mappaResp.description.includes('15/15')) warnings.push(`Mappa non mostra 15/15: "${mappaResp.description.split('\n')[0]}"`);
if (!echiResp.description.includes('ECHI PROFONDI')) warnings.push('La schermata ECHI non elenca gli echi profondi');

// ═══ MICRO-VERIFICHE DI BRANCH (stati isolati) ══════════════════════════════
// Coprono i rami che il walkthrough lineare non separa: gate WS5, percorso
// Stele-only, soglie estreme TRADUCI, blocchi INCIDI.
function mk(location: string, inventory: string[], flags: Record<string, any>): PlayerState {
    const s: PlayerState = JSON.parse(JSON.stringify(initialState));
    s.location = location;
    s.inventory = inventory;
    Object.assign(s.flags, flags);
    return s;
}
function probe(label: string, st: PlayerState, cmd: string,
               exp: { contains?: string; error?: boolean; flagAfter?: [string, any]; locAfter?: string; itemAfter?: string; itemCountAfter?: [string, number] }) {
    const { response, newState } = processCommand(cmd, st);
    const text = (response.description || '') + (response.continueText || '');
    if (exp.contains && !text.includes(exp.contains)) failures.push(`[micro] ${label}: manca "${exp.contains}" → "${text.slice(0, 70)}"`);
    if (exp.error !== undefined && (response.eventType === 'error') !== exp.error) failures.push(`[micro] ${label}: error atteso=${exp.error}, eventType=${response.eventType}`);
    if (exp.flagAfter) { const [k, v] = exp.flagAfter; if (newState.flags[k] !== v) failures.push(`[micro] ${label}: flag ${k}=${JSON.stringify(newState.flags[k])} atteso ${JSON.stringify(v)}`); }
    if (exp.locAfter && newState.location !== exp.locAfter) failures.push(`[micro] ${label}: loc "${newState.location}" attesa "${exp.locAfter}"`);
    if (exp.itemAfter && !newState.inventory.includes(exp.itemAfter)) failures.push(`[micro] ${label}: manca in inventario "${exp.itemAfter}"`);
    if (exp.itemCountAfter) { const [name, n] = exp.itemCountAfter; const c = newState.inventory.filter(i => i === name).length; if (c !== n) failures.push(`[micro] ${label}: "${name}" x${c} in inventario, atteso x${n}`); }
}

// WS5 — la porta a tre punte: il sapere può venire dalla Stele, ma SERVE l'energia (isHologramActive).
probe('WS5 gate energia', mk('Ponte di Comando', [], { knowsAboutTrinarySystem: true, isHologramActive: false }),
      'tocca tre punte', { error: true, contains: 'pannello', flagAfter: ['isFinalDoorOpen', undefined] });
probe('WS5 senza sapere', mk('Ponte di Comando', [], { knowsAboutTrinarySystem: false, isHologramActive: true }),
      'tocca tre punte', { error: true, contains: 'combinazione', flagAfter: ['isFinalDoorOpen', undefined] });
probe('WS5 percorso Stele-only', mk('Ponte di Comando', [], { knowsAboutTrinarySystem: true, isHologramActive: true }),
      'tocca tre punte', { error: false, flagAfter: ['isFinalDoorOpen', true] });

// WS1 — soglia minima e prerequisito mappa.
probe('WS1 TRADUCI <18', mk('Santuario del Silenzio', [], { translationProgress: 4 }),
      'traduci bassorilievi', { contains: 'restano chiuse' });
probe('WS1 TRADUCI mappa spenta', mk('Ponte di Comando', [], { isHologramActive: false }),
      'traduci mappa', { error: true, contains: 'nessuna mappa' });

// WS3 — blocchi di INCIDI.
probe('WS3 INCIDI senza taglierina', mk('Corridoio Principale', [], {}),
      'incidi', { error: true, contains: 'strumento', flagAfter: ['incisoCorridoio', undefined] });
probe('WS3 INCIDI Arca senza esame', mk('Arca Biologica', ['Taglierina al Plasma'], {}),
      'incidi', { error: true, flagAfter: ['incisoArca', undefined] });

// Robustezza: comando vuoto e ignoto non devono crashare.
probe('input ignoto', mk('Corridoio Principale', [], {}), 'qwerty zxcvb', { contains: 'Non capisco' });

// ═══ REGRESSIONI AUDIT 2026-07-11 (v1.5.2) ══════════════════════════════════
// A2 — RACCOGLI non deve scavalcare il gate della Stele (puzzle del Disco)…
probe('A2 raccogli stele senza reveal', mk('Santuario del Silenzio', [], {}),
      'raccogli stele', { error: true, contains: 'Non vedi nessuna stele', flagAfter: ['stelePresa', undefined] });
// …né duplicarla quando è già stata presa.
probe('A2 raccogli stele duplicato', mk('Santuario del Silenzio', ['Stele del Ricordo'], { steleRevealed: true, stelePresa: true }),
      'raccogli stele', { error: true, itemCountAfter: ['Stele del Ricordo', 1] });
// A3 — "prendi oggetto" (sinonimo del Cilindro) deve passare dal room command gated.
probe('A3 prendi oggetto = cilindro', mk("Alloggi dell'Equipaggio", [], {}),
      'prendi oggetto', { error: false, contains: 'cilindro', flagAfter: ['cilindroPreso', true], itemAfter: 'Cilindro Mnemonico' });
probe('A3 raccogli cilindro duplicato', mk("Alloggi dell'Equipaggio", ['Cilindro Mnemonico'], { cilindroPreso: true }),
      'raccogli cilindro', { error: true, itemCountAfter: ['Cilindro Mnemonico', 1] });
// B-a — oggetti d'inventario "fantasma" ora esaminabili/analizzabili ovunque.
probe('B-a esamina taglierina', mk('Corridoio Principale', ['Taglierina al Plasma'], {}),
      'esamina taglierina', { error: false, contains: 'plasma' });
probe('B-a esamina batteria', mk('Corridoio Principale', ['Batteria di Emergenza'], {}),
      'esamina batteria', { error: false, contains: 'cella' });
probe('B-a esamina seme fuori Serra', mk('Corridoio Principale', ['Seme Vivente'], {}),
      'esamina seme', { error: false, contains: 'pulsa' });
probe('B-a esamina cristallo attivato', mk('Corridoio Principale', ['Cristallo Dati Attivato'], {}),
      'esamina cristallo', { error: false, contains: 'filamenti' });
probe('B-a usa taglierina da sola', mk('Corridoio Principale', ['Taglierina al Plasma'], {}),
      'usa taglierina', { error: true, contains: 'su qualcosa' });
// B-b — l'item system gira anche nelle stanze SENZA items (Camera di Compensazione).
probe('B-b esamina inventario in Camera', mk('Camera di Compensazione', ['Taglierina al Plasma'], {}),
      'esamina taglierina', { error: false, contains: 'plasma' });
probe('B-b esamina tuta in Santuario Centrale', mk('Santuario Centrale', ['Tuta Spaziale'], { santuarioDescritto: true }),
      'esamina tuta', { error: false, contains: 'extraveicolare' });
// B-c — articoli elisi: "esamina l'altare".
probe("B-c esamina l'altare", mk('Santuario del Silenzio', [], {}),
      "esamina l'altare", { error: false, contains: 'incavo' });
probe("B-c usa disco su l'altare (elisione+prep)", mk('Santuario del Silenzio', ['Disco di Pietra'], {}),
      "usa disco sull'altare", { error: false, flagAfter: ['steleRevealed', true] });
// B-d — "vai a nord", "torna indietro".
probe('B-d vai a nord', mk('Corridoio Principale', [], {}),
      'vai a nord', { error: false, locAfter: 'Santuario del Silenzio' });
probe('B-d torna indietro', mk('Serra Morente', [], {}),
      'torna indietro', { error: false, locAfter: 'Corridoio Principale' });
// C — fallback omogenei: direzioni, verbi nudi, parla, esamina/prendi ignoti.
probe('C direzione non gestita', mk('Plancia della Santa Maria', [], {}),
      'alto', { error: true, contains: 'direzione' });
probe('C parla senza interlocutore', mk('Corridoio Principale', [], {}),
      'parla', { contains: 'Nessuno risponde' });
probe('C parla con X senza interlocutore', mk('Corridoio Principale', [], {}),
      'parla con navarca', { contains: 'Nessuno risponde' });
probe('C prendi nudo', mk('Corridoio Principale', [], {}),
      'prendi', { contains: 'Cosa vuoi prendere' });
probe('C entra nudo', mk('Corridoio Principale', [], {}),
      'entra', { contains: 'Entra dove' });
probe('C esamina oggetto ignoto', mk('Corridoio Principale', [], {}),
      'esamina sedia', { contains: 'Non vedi' });
probe('C prendi oggetto ignoto', mk('Corridoio Principale', [], {}),
      'prendi sedia', { error: true, contains: 'da prendere' });
probe('C usa oggetto non posseduto', mk('Corridoio Principale', [], {}),
      'usa chiave inglese', { error: true, contains: 'Non hai' });
// C13 — nome completo del dispositivo medico nel comando globale del Cristallo.
probe('C13 usa dispositivo medico alieno su cristallo',
      mk('Corridoio Principale', ['Dispositivo Medico Alieno', 'Cristallo Dati Opaco'], {}),
      'usa dispositivo medico alieno su cristallo', { error: false, itemAfter: 'Cristallo Dati Attivato' });
// C17 — sinonimi del Nucleo nel pickup gated.
probe('C17 prendi cristallo poliedrico', mk('Arca della Memoria', [], { isTerminalActive: true }),
      'prendi cristallo poliedrico', { error: false, itemAfter: 'Nucleo di Memoria' });
probe('C17 raccogli nucleo sigillato', mk('Arca della Memoria', [], {}),
      'raccogli nucleo', { error: true, contains: 'sigillato' });
// Ce l'hai già: PRENDI su oggetto già posseduto risponde onestamente.
probe('prendi tuta già presa', mk('Stiva', ['Tuta Spaziale'], { 'picked_Stiva_tuta_spaziale': true }),
      'prendi tuta', { error: true, contains: 'già' });

// ═══ REPORT ═════════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(70));
console.log('  SIMULAZIONE INTEGRALE — IL RELITTO SILENTE');
console.log('═'.repeat(70));
console.log(`Passi eseguiti:        ${stepNo}`);
console.log(`Stanze visitate:       ${visited.length}/15`);
console.log(`Echi di superficie:    ${echoCount()}/11`);
console.log(`Echi profondi:         ${deepCount()}/4`);
console.log(`Traduzione:            ${tp()}%`);
console.log(`Tracce INCIDI:         ${marks}/3`);
console.log(`Stato finale:          ${state.location} (hasHeardMonologue=${state.flags.hasHeardMonologue})`);
console.log('─'.repeat(70));
console.log(getStats(state));
console.log('─'.repeat(70));
if (warnings.length) {
    console.log(`\n⚠ AVVISI (${warnings.length}):`);
    warnings.forEach(w => console.log('  - ' + w));
}
if (failures.length) {
    console.log(`\n✗ FALLIMENTI (${failures.length}):`);
    failures.forEach(f => console.log('  - ' + f));
    console.log('\n RISULTATO: ✗ FALLITO\n');
    process.exit(1);
} else {
    console.log('\n RISULTATO: ✓ TUTTO CONNESSO — gioco completabile al 100% con ogni contenuto opzionale\n');
    process.exit(0);
}
