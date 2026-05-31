
import React, { useEffect, useRef, useState } from 'react';
import { OutputLine } from '../types';

interface TerminalOutputProps {
  output: OutputLine[];
}

/* ─── Key stabili per le righe ─────────────────────────────────────────────
   Ogni OutputLine mantiene la propria identità tra i render (setOutput usa
   lo spread), quindi associamo una key univoca al riferimento dell'oggetto.
   Evita i rimontaggi spuri di TypewriterLine causati da key={index} quando
   la coda dell'output viene rimossa (slice) e sostituita.                 */
const lineKeys = new WeakMap<object, number>();
let lineKeyCounter = 0;
const keyFor = (line: object): number => {
    let k = lineKeys.get(line);
    if (k === undefined) {
        k = lineKeyCounter++;
        lineKeys.set(line, k);
    }
    return k;
};

/* ─── Rilevamento titolo stanza ────────────────────────────────────────────
   Solo stringhe composte esclusivamente da lettere maiuscole italiane,
   spazi, apostrofi e trattini (lunghezza 4-40). Esclude simboli come
   [ ] : % che compaiono nelle barre di progresso e nei suggerimenti.   */
const isRoomTitle = (s: string): boolean => {
    const t = s.trim();
    return t.length >= 4 && t.length <= 40 && /^[A-ZÀÈÉÌÒÙ\s''\-]+$/.test(t);
};

/* ─── Rendering testo con titolo stanza ────────────────────────────────── */
const renderTextContent = (content: string): React.ReactNode => {
    const nnIdx = content.indexOf('\n\n');
    if (nnIdx > 0) {
        const firstLine = content.slice(0, nnIdx);
        if (isRoomTitle(firstLine)) {
            const rest = content.slice(nnIdx);
            return (
                <>
                    <span style={{ color: 'var(--p-bright)', letterSpacing: '0.12em', display: 'block' }}>
                        {firstLine}
                    </span>
                    {rest}
                </>
            );
        }
    }
    return content;
};

/* ─── Componente typewriter ────────────────────────────────────────────────
   Anima il testo carattere per carattere a 10ms/char. Qualsiasi tasto
   (eccetto F-keys e modificatori) completa l'animazione istantaneamente. */
const TypewriterLine: React.FC<{ content: string }> = ({ content }) => {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const charRef = useRef(0);

    useEffect(() => {
        charRef.current = 0;
        setDisplayed('');
        setDone(false);

        /* Listener "salta animazione". Viene rimosso non appena la riga è
           completa (naturalmente o per pressione di un tasto): senza questo,
           ogni TypewriterLine montata teneva un listener globale per tutta la
           sua vita, accumulandone uno per riga di output (BUG B7). */
        const removeKeyListener = () => window.removeEventListener('keydown', handleKey);
        const finish = () => {
            if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
            removeKeyListener();
            setDone(true);
        };
        const handleKey = (e: KeyboardEvent) => {
            if (/^F\d+$/.test(e.key) || ['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock'].includes(e.key)) return;
            setDisplayed(content);
            finish();
        };

        intervalRef.current = setInterval(() => {
            charRef.current++;
            setDisplayed(content.slice(0, charRef.current));
            if (charRef.current >= content.length) {
                finish();
            }
        }, 10);
        window.addEventListener('keydown', handleKey);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            removeKeyListener();
        };
    }, [content]);

    return (
        <span className="whitespace-pre-wrap">
            {renderTextContent(displayed)}
            {!done && (
                <span
                    className="animate-blink"
                    style={{ display: 'inline-block', width: '0.65ch', height: '0.9em', background: 'var(--p-main)', marginLeft: '1px', verticalAlign: 'text-bottom' }}
                />
            )}
        </span>
    );
};

const TerminalOutput: React.FC<TerminalOutputProps> = ({ output }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  return (
    <div className="flex-grow overflow-y-auto pr-2 no-scrollbar">
      {output.map((line) =>
        line.kind === 'html'
          ? <div key={keyFor(line)} className="whitespace-pre-wrap" style={{ color: 'var(--p-main)' }} dangerouslySetInnerHTML={{ __html: line.content }} />
          : line.kind === 'typewriter'
            ? <div key={keyFor(line)} className="whitespace-pre-wrap" style={{ color: 'var(--p-main)' }}><TypewriterLine content={line.content} /></div>
            : <div key={keyFor(line)} className="whitespace-pre-wrap" style={{ color: 'var(--p-main)' }}>{renderTextContent(line.content)}</div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default TerminalOutput;
