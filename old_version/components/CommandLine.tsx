
import React, { useState, useEffect, useRef } from 'react';
import { playKeystrokeSound } from '../services/audioService';

interface CommandLineProps {
  onSubmit: (command: string) => void;
  isLoading: boolean;
  history: string[];
  historyIndex: number;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  /** True quando un overlay (pausa, save/load, impostazioni, info) copre il gioco. */
  overlayOpen?: boolean;
}

const CommandLine: React.FC<CommandLineProps> = ({ onSubmit, isLoading, history, historyIndex, setHistoryIndex, overlayOpen = false }) => {
  const [command, setCommand] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  // Ripristina il focus quando un overlay si chiude: senza questo, dopo aver
  // chiuso pausa/salvataggi/impostazioni la riga di comando restava senza focus
  // e l'utente doveva cliccare per poter digitare (BUG B12).
  useEffect(() => {
    if (!overlayOpen && !isLoading) inputRef.current?.focus();
  }, [overlayOpen, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(command);
    setCommand('');
  };

  const handleCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommand(e.target.value);
    playKeystrokeSound();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const idx = Math.min(historyIndex + 1, history.length - 1);
      if (idx >= 0) { setHistoryIndex(idx); setCommand(history[idx]); }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = Math.max(historyIndex - 1, -1);
      setHistoryIndex(idx);
      setCommand(idx >= 0 ? history[idx] : '');
    }
  };

  const focusInput = () => { if (!isLoading) inputRef.current?.focus(); };

  return (
    <div
      style={{ flexShrink: 0, paddingTop: '0.5rem', borderTop: '1px solid var(--border-crt)' }}
      onClick={focusInput}
    >
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        {/* Input invisibile — cattura la tastiera */}
        <input
          ref={inputRef}
          type="text"
          value={command}
          onChange={handleCommandChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          autoFocus
          autoComplete="off"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            opacity: 0, cursor: 'none',
            background: 'transparent', border: 'none', padding: 0,
          }}
        />

        {/* Layer visivo */}
        <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', lineHeight: 1 }}>

          {/* Prompt > */}
          <span style={{ color: 'var(--p-bright)', marginRight: '0.5em', flexShrink: 0 }}>{'>'}</span>

          {isLoading ? (
            <span style={{ color: 'var(--p-dim)' }}>Elaborazione in corso...</span>
          ) : command.length > 0 ? (
            /* ── Stato: testo in corso di digitazione ── */
            <>
              <span style={{ color: 'var(--p-main)', whiteSpace: 'pre' }}>{command}</span>
              {/* Cursore DOPO il testo digitato */}
              <span
                className="animate-blink"
                style={{
                  display: 'inline-flex', alignSelf: 'center', flexShrink: 0,
                  width: '0.6ch', height: '0.85em',
                  background: 'var(--p-main)', marginLeft: '1px',
                }}
              />
            </>
          ) : (
            /* ── Stato: campo vuoto — cursore sovrapposto alla prima lettera
                 Il cursore è a x=0 (position:absolute, left:0) e copre
                 la 'C' di "Cosa fai?" quando è acceso. Quando lampeggia
                 e si spegne, la lettera sottostante torna visibile.
                 Comportamento identico ai veri terminali anni '80. ── */
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span
                className="animate-blink"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '0.6ch',
                  height: '0.85em',
                  background: 'var(--p-main)',
                  zIndex: 2,
                  display: 'block',
                }}
              />
              <span style={{ color: 'var(--p-dim)', position: 'relative', zIndex: 1 }}>Cosa fai?</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default CommandLine;
