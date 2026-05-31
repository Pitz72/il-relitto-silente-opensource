import React, { useEffect } from 'react';
import { playKeystrokeSound } from '../services/audioService';
import { quitApp } from '../services/storageService';
import { getAppVersion } from '../version';

interface GameOverScreenProps {
    onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ onRestart }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            if (key === 'm') {
                playKeystrokeSound();
                onRestart();
            } else if (key === 'escape' || key === 'e') {
                playKeystrokeSound();
                quitApp();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onRestart]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center" style={{ gap: '2.5rem' }}>
            <h1
                style={{
                    fontSize: '2.2rem',
                    color: '#e8c84a',
                    textShadow: '0 0 10px rgba(232,200,74,0.5)',
                    letterSpacing: '0.1em',
                }}
            >
                FINE DELLA TRASMISSIONE
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                    <span style={{ color: 'var(--p-bright)' }}>[ M ]</span>
                    <span style={{ color: 'var(--p-main)' }}>TORNA AL MENU PRINCIPALE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
                    <span style={{ color: '#ff4444' }}>[ ESC ]</span>
                    <span style={{ color: 'var(--p-main)' }}>ESCI DAL SISTEMA</span>
                </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: 'var(--p-dim)', marginTop: '1rem' }}>
                IL RELITTO SILENTE  v{getAppVersion()}
            </div>
        </div>
    );
};

export default GameOverScreen;
