/* ─── Storage Service ──────────────────────────────────────────────────────
   Livello di astrazione unico per tutta la persistenza del gioco.

   Quando disponibile (Electron), usa il filesystem tramite IPC:
   - Salvataggi: <userData>/saves/slot-{id}.json  |  autosave.json
   - Impostazioni: <userData>/settings.json

   Fallback per la modalità web pura (npm run dev senza Electron):
   usa localStorage con le stesse chiavi dell'API precedente.

   Le preferenze audio sono caricate in memoria una volta sola all'avvio
   (initStorageSettings) e poi lette sincronamente — questo permette
   all'audioService di rimanere interamente sincrono.                     */

declare global {
    interface Window {
        electronAPI?: {
            writeSlot:     (id: number, data: string) => Promise<void>;
            readSlot:      (id: number) => Promise<string | null>;
            writeSettings: (data: string) => Promise<void>;
            readSettings:  () => Promise<string | null>;
            quit:          () => void;
        };
    }
}

const isElectron = (): boolean =>
    typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined';

/* ─── Settings (preferenze audio) ─────────────────────────────────────────
   Cache in-memoria: initStorageSettings va chiamato una volta al boot
   prima che qualsiasi suono possa essere riprodotto.                     */
let settingsCache: Record<string, string> = {};

export async function initStorageSettings(): Promise<void> {
    if (isElectron()) {
        try {
            const raw = await window.electronAPI!.readSettings();
            settingsCache = raw ? (JSON.parse(raw) as Record<string, string>) : {};
        } catch {
            settingsCache = {};
        }
        // Garantisce che eventuali preferenze in attesa di debounce vengano
        // scritte prima della chiusura della finestra (vedi BUG B15).
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', flushSettings);
        }
    } else {
        // Dev mode: specchia le chiavi rilevanti da localStorage nella cache
        const keys = [
            'relitto_sfx_on', 'relitto_sfx_vol',
            'relitto_ambience_on', 'relitto_ambience_vol',
        ];
        for (const k of keys) {
            const v = localStorage.getItem(k);
            if (v !== null) settingsCache[k] = v;
        }
    }
}

/** Lettura sincrona dalla cache in-memoria. */
export function getSettingSync(key: string): string | null {
    return settingsCache[key] ?? null;
}

/* Scrittura su disco con debounce: lo spostamento di uno slider audio genera
   decine di setSetting al secondo. Riscrivere l'intero settings.json ad ogni
   tick (fire-and-forget) causava scritture concorrenti e potenziale corruzione
   del file (BUG B15). Coalizziamo le scritture in una sola ogni 300 ms. */
let settingsFlushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSettingsFlush(): void {
    if (settingsFlushTimer) clearTimeout(settingsFlushTimer);
    settingsFlushTimer = setTimeout(() => {
        settingsFlushTimer = null;
        window.electronAPI!.writeSettings(JSON.stringify(settingsCache)).catch(() => {});
    }, 300);
}

/** Forza subito su disco le preferenze in sospeso (es. prima di chiudere). */
/* ─── Uscita applicazione ─────────────────────────────────────────────────
   In Electron chiude l'app via IPC; nel browser non c'è una chiusura
   affidabile (window.close è no-op per le finestre non aperte da script). */
export function quitApp(): void {
    if (isElectron()) {
        window.electronAPI!.quit();
    } else {
        window.close();
    }
}

export function flushSettings(): void {
    if (settingsFlushTimer) { clearTimeout(settingsFlushTimer); settingsFlushTimer = null; }
    if (isElectron()) {
        window.electronAPI!.writeSettings(JSON.stringify(settingsCache)).catch(() => {});
    }
}

/** Scrittura sincrona nella cache + write-through (debounced) su disco. */
export function setSetting(key: string, value: string): void {
    settingsCache[key] = value;
    if (isElectron()) {
        scheduleSettingsFlush();
    } else {
        try { localStorage.setItem(key, value); } catch { /* quota exceeded, ignorabile */ }
    }
}

/* ─── Save slots ───────────────────────────────────────────────────────────
   id 0–4 = slot manuali  |  id -1 = autosave                            */

export async function writeSlotData(id: number, data: string): Promise<void> {
    if (isElectron()) {
        await window.electronAPI!.writeSlot(id, data);
    } else {
        const key = id === -1 ? 'relitto-autosave' : `relitto-slot-${id}`;
        try { localStorage.setItem(key, data); } catch { /* quota exceeded */ }
    }
}

export async function readSlotData(id: number): Promise<string | null> {
    if (isElectron()) {
        return window.electronAPI!.readSlot(id);
    } else {
        const key = id === -1 ? 'relitto-autosave' : `relitto-slot-${id}`;
        return localStorage.getItem(key);
    }
}
