import { contextBridge, ipcRenderer } from 'electron';

/* ─── Desktop storage API ──────────────────────────────────────────────────
   Espone all'renderer un'API ristretta e tipizzata tramite contextBridge.
   Il renderer non ha accesso diretto a Node né al filesystem:
   tutta la I/O avviene tramite IPC con validazione nel processo principale. */
contextBridge.exposeInMainWorld('electronAPI', {
    writeSlot: (id: number, data: string): Promise<void> =>
        ipcRenderer.invoke('storage:writeSlot', id, data),
    readSlot: (id: number): Promise<string | null> =>
        ipcRenderer.invoke('storage:readSlot', id),
    writeSettings: (data: string): Promise<void> =>
        ipcRenderer.invoke('storage:writeSettings', data),
    readSettings: (): Promise<string | null> =>
        ipcRenderer.invoke('storage:readSettings'),
    quit: (): void =>
        ipcRenderer.send('app:quit'),
});
