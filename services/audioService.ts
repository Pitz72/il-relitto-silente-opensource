import { getSettingSync, setSetting } from './storageService';

/* ─── AudioContext ─────────────────────────────────────────────────────────
   Inizializzato al primo input utente (policy browser/Electron).
   In Electron (Chromium moderno) AudioContext è sempre disponibile:
   il fallback webkitAudioContext non è necessario.                       */
let audioCtx: AudioContext | null = null;
/** True se l'inizializzazione audio è già fallita: evita di ritentare a ogni
    keystroke (e di rilanciare la stessa eccezione) quando Web Audio non è
    disponibile o è stato bloccato dalla piattaforma (BUG B3). */
let audioUnavailable = false;

const initializeAudio = () => {
    if (audioUnavailable) return;
    try {
        if (!audioCtx) {
            const Ctx: typeof AudioContext | undefined =
                (typeof AudioContext !== 'undefined' ? AudioContext : undefined) ??
                (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!Ctx) { audioUnavailable = true; return; }
            audioCtx = new Ctx();
        }
        if (audioCtx.state === 'suspended') {
            void audioCtx.resume().catch(() => { /* ripreso al prossimo input */ });
        }
    } catch (err) {
        // Web Audio non disponibile: degrada silenziosamente, gioco muto ma funzionante.
        audioUnavailable = true;
        audioCtx = null;
        console.warn('[audio] AudioContext non disponibile, audio disabilitato:', err);
    }
};

const ensureAudioInitialized = () => {
    if (!audioCtx || audioCtx.state === 'suspended') {
        initializeAudio();
    }
};

/* ─── Sistema SFX (effetti sonori) ────────────────────────────────────────
   Toggle e volume indipendenti dall'ambience.
   Lettura sempre sincrona dalla cache di storageService.

   SET v2 (approvato 2026-07-12): niente più onde quadre/denti di sega nudi.
   Ogni suono ha un attacco morbido (nessun click digitale), decadimento
   esponenziale, filtri e — dove serve — una leggera variazione casuale di
   intonazione perché la ripetizione non stanchi. Il progetto sonoro completo
   e ascoltabile è in docs (demo "prova audio v2").                        */

const SFX_ON_KEY  = 'relitto_sfx_on';
const SFX_VOL_KEY = 'relitto_sfx_vol';

export const isSfxEnabled = (): boolean => {
    const v = getSettingSync(SFX_ON_KEY);
    return v === null ? true : v === 'true';
};

export const getSfxVol = (): number => {
    const v = getSettingSync(SFX_VOL_KEY);
    return v !== null ? Math.max(0.01, Math.min(1, parseFloat(v))) : 0.7;
};

export const toggleSfx = (): boolean => {
    const next = !isSfxEnabled();
    setSetting(SFX_ON_KEY, String(next));
    return next;
};

export const setSfxVol = (val: number): void => {
    setSetting(SFX_VOL_KEY, String(Math.max(0.01, Math.min(1, val))));
};

/* I picchi di gain del set v2 sono calibrati sul volume di default (0.7):
   questo fattore riscala l'intero set quando l'utente muove lo slider.   */
const sfxScale = (): number => getSfxVol() / 0.7;

/* Inviluppo standard: attacco esponenziale breve (evita i click) + coda. */
const envGain = (g: GainNode, t0: number, peak: number, attack: number, decay: number): void => {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
};

/* Oscillatore one-shot con inviluppo, detune e pitch-bend opzionali.
   I nodi vengono disconnessi a fine suono (BUG B13).                     */
const playOsc = (
    type: OscillatorType, freq: number, t0: number, dur: number,
    peak: number, attack: number, detune = 0, bendTo: number | null = null,
): void => {
    if (!audioCtx || !isSfxEnabled()) return;
    const c = audioCtx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    o.detune.value = detune;
    if (bendTo) o.frequency.exponentialRampToValueAtTime(bendTo, t0 + dur);
    envGain(g, t0, peak * sfxScale(), attack, dur - attack);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
    o.onended = () => {
        try { o.disconnect(); } catch { /* già disconnesso */ }
        try { g.disconnect(); } catch { /* già disconnesso */ }
    };
};

const makeNoiseBuffer = (dur: number): AudioBuffer => {
    const c = audioCtx!;
    const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
};

/* Rumore one-shot filtrato con inviluppo; f1 opzionale = sweep del filtro. */
const playNoiseFx = (
    t0: number, dur: number, peak: number, attack: number,
    filterType: BiquadFilterType, f0: number, f1: number | null, q: number,
): void => {
    if (!audioCtx || !isSfxEnabled()) return;
    const c = audioCtx;
    const src = c.createBufferSource();
    src.buffer = makeNoiseBuffer(dur + 0.05);
    const fl = c.createBiquadFilter();
    fl.type = filterType; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t0);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = c.createGain();
    envGain(g, t0, peak * sfxScale(), attack, dur - attack);
    src.connect(fl); fl.connect(g); g.connect(c.destination);
    src.start(t0); src.stop(t0 + dur + 0.05);
    src.onended = () => {
        try { src.disconnect(); } catch { /* già disconnesso */ }
        try { fl.disconnect(); } catch { /* già disconnesso */ }
        try { g.disconnect(); } catch { /* già disconnesso */ }
    };
};

/* Tasto premuto: click meccanico — soffio filtrato + micro-blip con
   intonazione variabile a ogni battuta (il suono più frequente del gioco). */
export const playKeystrokeSound = (): void => {
    ensureAudioInitialized();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const jitter = 1 + (Math.random() - 0.5) * 0.18;
    playNoiseFx(t, 0.030, 0.05, 0.002, 'highpass', 2600, null, 0.8);
    playOsc('sine', 1500 * jitter, t, 0.030, 0.025, 0.002);
};

/* Invio comando: conferma a due note morbide, il "ricevuto" del terminale. */
export const playSubmitSound = (): void => {
    ensureAudioInitialized();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    playOsc('sine', 523, t, 0.09, 0.06, 0.006);
    playOsc('sine', 784, t + 0.07, 0.14, 0.05, 0.008);
};

/* Oggetto raccolto/usato: arpeggio caldo con seconda voce scordata. */
export const playItemSound = (): void => {
    ensureAudioInitialized();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    ([[659, 0], [830, 0.07], [988, 0.14]] as const).forEach(([f, dt]) => {
        playOsc('triangle', f, t + dt, 0.22, 0.05, 0.010);
        playOsc('sine', f, t + dt, 0.22, 0.03, 0.010, 8);
    });
};

/* Scoperta/magia: accordo che fiorisce con attacco lento e coda luminosa. */
export const playMagicSound = (): void => {
    ensureAudioInitialized();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    ([[523, 0.030], [659, 0.024], [784, 0.020], [1046, 0.012]] as const).forEach(([f, p], i) => {
        playOsc('sine', f, t + i * 0.05, 1.1 - i * 0.1, p, 0.12, i % 2 ? 6 : -6);
    });
    playNoiseFx(t + 0.1, 0.7, 0.008, 0.15, 'bandpass', 3200, 4200, 2.5);
};

/* Movimento: sbuffo pneumatico — filtro che scende, una porta che scorre. */
export const playMoveSound = (): void => {
    ensureAudioInitialized();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    playNoiseFx(t, 0.34, 0.09, 0.03, 'lowpass', 1100, 240, 0.9);
    playOsc('sine', 70, t, 0.30, 0.035, 0.02, 0, 46);
};

/* Errore: un "no" basso e rotondo con calo di intonazione. */
export const playErrorSound = (): void => {
    ensureAudioInitialized();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    playOsc('sine', 150, t, 0.20, 0.09, 0.006, 0, 96);
    playOsc('triangle', 300, t, 0.12, 0.03, 0.006, 0, 190);
};

/* Eco temporale: l'aggancio di frequenza del Sintonizzatore — glissando
   discendente a due voci scordate con soffio in coda. */
export const playEchoSound = (): void => {
    ensureAudioInitialized();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    playOsc('sine', 1900, t, 0.45, 0.035, 0.02, 0, 620);
    playOsc('sine', 1900, t + 0.02, 0.45, 0.022, 0.02, 9, 626);
    playNoiseFx(t, 0.4, 0.012, 0.05, 'bandpass', 1400, 700, 3);
};

/* Beep dati (IntroScreen): blip brevissimo, ora con inviluppo morbido. */
export const playTerminalBeep = (): void => {
    ensureAudioInitialized();
    if (!audioCtx) return;
    playOsc('sine', 1320, audioCtx.currentTime, 0.05, 0.03, 0.004);
};

/* ─── Sistema Ambience ─────────────────────────────────────────────────────
   Loop procedurali per atmosfera per stanza. Il master GainNode gestisce
   fade-in/fade-out puliti per eliminare click e pop audio.
   Toggle e volume persistono tramite storageService.

   SET v2 (approvato 2026-07-12): niente più droni statici. Ogni profilo è
   costruito su strati che respirano — oscillatori vicini che battono
   lentamente tra loro, filtri che vagano, LFO indipendenti su ampiezza e
   intonazione con cicli di 10–30 secondi: nessun momento è identico al
   precedente. Solo sinusoidi/triangolari filtrate passa-basso + rumore
   filtrato; volumi calibrati per stare sotto il testo del gioco.         */

const AMBIENCE_ON_KEY  = 'relitto_ambience_on';
const AMBIENCE_VOL_KEY = 'relitto_ambience_vol';

export const isAmbienceEnabled = (): boolean => {
    const v = getSettingSync(AMBIENCE_ON_KEY);
    return v === null ? true : v === 'true';
};

export const getAmbienceVol = (): number => {
    const v = getSettingSync(AMBIENCE_VOL_KEY);
    return v !== null ? Math.max(0.01, Math.min(1, parseFloat(v))) : 0.5;
};

export const setAmbienceVol = (val: number): void => {
    const clamped = Math.max(0.01, Math.min(1, val));
    setSetting(AMBIENCE_VOL_KEY, String(clamped));
    if (ambienceGain && audioCtx) {
        ambienceGain.gain.setValueAtTime(clamped, audioCtx.currentTime);
    }
};

export const toggleAmbience = (): boolean => {
    const next = !isAmbienceEnabled();
    setSetting(AMBIENCE_ON_KEY, String(next));
    if (!next) stopAmbience();
    return next;
};

let ambienceGain: GainNode | null = null;
/* Tutti i nodi con .stop() — sorgenti E oscillatori LFO — finiscono qui:
   fermarli allo stop libera l'intero sottografo (gain/filtri inclusi). */
let ambienceStoppable: Array<OscillatorNode | AudioBufferSourceNode> = [];

export const stopAmbience = (): void => {
    const nodesToStop = [...ambienceStoppable];
    ambienceStoppable = [];
    const gainToFade = ambienceGain;
    ambienceGain = null;
    if (audioCtx && gainToFade && nodesToStop.length > 0) {
        const now = audioCtx.currentTime;
        const cur = Math.max(gainToFade.gain.value, 0.0001);
        gainToFade.gain.setValueAtTime(cur, now);
        gainToFade.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        setTimeout(() => {
            nodesToStop.forEach(n => { try { n.stop(); } catch { /* già fermato */ } });
            try { gainToFade.disconnect(); } catch { /* già disconnesso */ }
        }, 750);
    } else {
        nodesToStop.forEach(n => { try { n.stop(); } catch { /* ignorato */ } });
        if (gainToFade) { try { gainToFade.disconnect(); } catch { /* ignorato */ } }
    }
};

/* — Mattoni dei profili ambientali — */

/** Oscillatore continuo con proprio gain, collegato a dest. */
const ambOsc = (
    dest: AudioNode, type: OscillatorType, freq: number, gainVal: number, detune = 0,
): { o: OscillatorNode; g: GainNode } => {
    const c = audioCtx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    g.gain.value = gainVal;
    o.connect(g); g.connect(dest);
    o.start();
    ambienceStoppable.push(o);
    return { o, g };
};

/** Rumore in loop filtrato con proprio gain, collegato a dest. */
const ambNoise = (
    dest: AudioNode, gainVal: number, filterType: BiquadFilterType, freq: number, q: number,
): { src: AudioBufferSourceNode; fl: BiquadFilterNode; g: GainNode } => {
    const c = audioCtx!;
    const src = c.createBufferSource();
    src.buffer = makeNoiseBuffer(4);
    src.loop = true;
    const fl = c.createBiquadFilter();
    fl.type = filterType; fl.frequency.value = freq; fl.Q.value = q;
    const g = c.createGain();
    g.gain.value = gainVal;
    src.connect(fl); fl.connect(g); g.connect(dest);
    src.start();
    ambienceStoppable.push(src);
    return { src, fl, g };
};

/** LFO sinusoidale su un AudioParam (ampiezza, frequenza filtro, detune...). */
const ambLfo = (param: AudioParam, rate: number, depth: number): void => {
    const c = audioCtx!;
    const lfo = c.createOscillator();
    const lg = c.createGain();
    lfo.type = 'sine'; lfo.frequency.value = rate;
    lg.gain.value = depth;
    lfo.connect(lg); lg.connect(param);
    lfo.start();
    ambienceStoppable.push(lfo);
};

/** Passa-basso condiviso verso il master (ammorbidisce l'intero profilo). */
const ambLowpass = (dest: AudioNode, freq: number, q = 0.7): BiquadFilterNode => {
    const c = audioCtx!;
    const fl = c.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.value = freq; fl.Q.value = q;
    fl.connect(dest);
    return fl;
};

export const startAmbience = (type: 'ship' | 'alien_quiet' | 'alien_cold' | 'alien_electric' | 'sacred' | null): void => {
    stopAmbience();
    if (!isAmbienceEnabled() || !type) return;
    ensureAudioInitialized();
    if (!audioCtx) return;

    ambienceGain = audioCtx.createGain();
    const targetVol = getAmbienceVol();
    ambienceGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    ambienceGain.gain.exponentialRampToValueAtTime(targetVol, audioCtx.currentTime + 2.0);
    ambienceGain.connect(audioCtx.destination);
    const m = ambienceGain;

    switch (type) {
        /* NAVE UMANA — motore caldo che respira: due sinusoidi quasi unisone
           (battimento 0.4 Hz) + ventilazione d'aria con marea lenta. */
        case 'ship': {
            const lp = ambLowpass(m, 260);
            ambOsc(lp, 'sine', 55, 0.055);
            ambOsc(lp, 'sine', 55.4, 0.045);
            ambOsc(lp, 'triangle', 110.2, 0.014);
            const vent = ambNoise(m, 0.020, 'lowpass', 420, 0.5);
            ambLfo(vent.g.gain, 0.07, 0.008);        // la ventola "respira"
            const sub = ambOsc(lp, 'sine', 27.5, 0.025);
            ambLfo(sub.g.gain, 0.05, 0.010);
            break;
        }
        /* QUIETE ALIENA — bioluminescenza: accordo basso di sinusoidi
           leggermente scordate, ciascuna con la propria marea d'ampiezza. */
        case 'alien_quiet': {
            const lp = ambLowpass(m, 700);
            const a = ambOsc(lp, 'sine', 108, 0.030);
            const b = ambOsc(lp, 'sine', 162.3, 0.020);
            const d = ambOsc(lp, 'sine', 216.8, 0.012);
            ambLfo(a.g.gain, 0.043, 0.014);
            ambLfo(b.g.gain, 0.031, 0.010);
            ambLfo(d.g.gain, 0.057, 0.007);
            ambLfo(b.o.detune, 0.021, 5);            // deriva d'intonazione lentissima
            ambNoise(m, 0.005, 'bandpass', 480, 1.0);
            break;
        }
        /* VUOTO / GELO — vento che vaga: il filtro del rumore si sposta da
           solo su un ciclo di ~17 secondi; sub-basso quasi impercettibile. */
        case 'alien_cold': {
            const wind = ambNoise(m, 0.042, 'bandpass', 240, 1.6);
            ambLfo(wind.fl.frequency, 0.058, 110);   // il vento gira
            ambLfo(wind.g.gain, 0.037, 0.015);
            ambOsc(m, 'sine', 30, 0.035);
            const ice = ambNoise(m, 0.0035, 'highpass', 5800, 0.7); // cristalli lontani
            ambLfo(ice.g.gain, 0.11, 0.0030);
            break;
        }
        /* ENERGIA RESIDUA — ronzio rotondo filtrato + statica elettrica che
           pulsa in modo irregolare (due LFO sovrapposti sul crepitio). */
        case 'alien_electric': {
            const lp = ambLowpass(m, 800, 2.5);
            ambOsc(lp, 'triangle', 50, 0.030);
            ambOsc(lp, 'triangle', 100.6, 0.015);
            const hum = ambOsc(lp, 'sine', 150.2, 0.010);
            ambLfo(hum.g.gain, 0.083, 0.006);
            const crackle = ambNoise(m, 0.007, 'highpass', 2600, 0.8);
            ambLfo(crackle.g.gain, 5.7, 0.005);      // sfrigolio veloce...
            ambLfo(crackle.g.gain, 0.13, 0.004);     // ...che va e viene
            break;
        }
        /* SACRO — coro grave in serie armonica con deriva di scordatura;
           un solo armonico alto affiora e svanisce su ciclo lungo. */
        case 'sacred': {
            const lp = ambLowpass(m, 520);
            const f1 = ambOsc(lp, 'sine', 66, 0.034);
            const f2 = ambOsc(lp, 'sine', 99.2, 0.024);
            const f3 = ambOsc(lp, 'sine', 132.5, 0.014);
            ambLfo(f1.g.gain, 0.037, 0.012);
            ambLfo(f2.g.gain, 0.026, 0.009);
            ambLfo(f3.o.detune, 0.019, 7);
            const halo = ambOsc(m, 'sine', 1056, 0.0035);
            ambLfo(halo.g.gain, 0.055, 0.0032);      // l'alone affiora e svanisce
            break;
        }
    }
};
