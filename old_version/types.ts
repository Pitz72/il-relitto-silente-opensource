
export enum GameState {
    Boot,
    StartMenu,
    Instructions,
    Intro,
    Playing,
    GameOver,
    Credits,
}

export type GameEventType = 'item_pickup' | 'item_use' | 'magic' | 'movement' | 'error' | 'tech' | 'echo' | null;

export interface PlayerState {
    location: string;
    inventory: string[];
    flags: Record<string, boolean | number | string>;
    echoes: string[];        // IDs of discovered echoes
    visitedRooms?: string[]; // IDs of visited rooms (optional for backward compat save files)
}

export interface GameResponse {
    description: string;
    eventType: GameEventType;
    clearScreen?: boolean;
    gameOver?: string | null;
    continueText?: string | null;
    typewriter?: boolean;
    html?: boolean; // Se true, description viene renderizzata come HTML (kind: 'html')
}

export interface CommandHandlerResult {
    description: string;
    eventType?: GameEventType;
    gameOver?: string | null;
    typewriter?: boolean;      // Se true, il testo viene animato carattere per carattere
}

export type CommandHandler = (state: PlayerState, match: RegExpMatchArray) => CommandHandlerResult;

export interface Command {
    regex: string;
    handler: CommandHandler;
}

export interface Item {
    id: string;
    name: string;
    synonyms: string[];
    description: string; // Per ESAMINA
    details?: string;    // Per ANALIZZA

    isPickable?: boolean;
    isFixed?: boolean; // Se true, non può essere preso (con messaggio specifico)

    onUse?: (state: PlayerState) => CommandHandlerResult;
    onAnalyze?: (state: PlayerState) => CommandHandlerResult; // Per ANALIZZA con side-effects su stato
    onTranslate?: (state: PlayerState) => CommandHandlerResult; // Per TRADUCI: lettura stratificata in base a translationProgress (sola lettura, nessun side-effect)
    onCombine?: (targetId: string, state: PlayerState) => CommandHandlerResult; // targetId è l'oggetto SU cui usiamo questo oggetto
}

export interface Room {
    description: (state: PlayerState) => string;
    commands: Command[]; // Manteniamo per retrocompatibilità e comandi speciali
    items?: Item[];      // Nuovo sistema oggetti
}

// Modello output terminale: 'text' viene renderizzato come testo React puro (sicuro),
// 'html' viene renderizzato via dangerouslySetInnerHTML (solo per markup UI generato dal codice).
export type OutputLine =
    | { kind: 'text'; content: string }
    | { kind: 'html'; content: string }
    | { kind: 'typewriter'; content: string };