/* ─── Versione applicazione ────────────────────────────────────────────────
   Unica fonte di verità: la versione viene letta direttamente da package.json
   (bundlato da Vite come modulo JSON). Evita le stringhe di versione hardcoded
   sparse nella UI, che restavano stantie ad ogni release.                  */
import pkg from './package.json';

/** Versione corrente dell'app (es. "1.3.3"), letta da package.json. */
export const getAppVersion = (): string => pkg.version;
