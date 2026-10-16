import React, { useState, useEffect } from 'react';
import { playKeystrokeSound } from '../services/audioService';
import bootScreenImg from '../assets/boot_screen.png';

interface BootScreenProps {
    onComplete: () => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
    const [progress, setProgress]   = useState(0);
    const [textLog, setTextLog]     = useState<string[]>([]);
    const [isReady, setIsReady]     = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) { clearInterval(interval); setIsReady(true); return 100; }
                return prev + Math.random() * 2;
            });
        }, 50);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (progress > 10 && textLog.length === 0) setTextLog(prev => [...prev, "BIOS CHECK.................... OK"]);
        if (progress > 30 && textLog.length === 1) setTextLog(prev => [...prev, "LOADING KERNEL................ OK"]);
        if (progress > 50 && textLog.length === 2) setTextLog(prev => [...prev, "MOUNTING FILESYSTEM........... OK"]);
        if (progress > 70 && textLog.length === 3) setTextLog(prev => [...prev, "INITIALIZING GRAPHICS......... OK"]);
        if (progress > 90 && textLog.length === 4) setTextLog(prev => [...prev, "LOADING ASSETS................ OK"]);
    }, [progress, textLog]);

    useEffect(() => {
        const handleKeyDown = () => { if (isReady) { playKeystrokeSound(); onComplete(); } };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isReady, onComplete]);

    return (
        <div
            className="flex flex-col items-center justify-center h-full"
            style={{ background: 'var(--bg-screen)', color: 'var(--p-main)', fontFamily: "'Press Start 2P', monospace" }}
        >
            {/*
              Contenitore immagine boot.
              Tecnica: grayscale → moltiplicazione con overlay #33ff00
              mix-blend-mode:multiply su sfondo nero:
                bianco × #33ff00 = #33ff00  (fosforo pieno)
                grigio × #33ff00 = tono intermedio del fosforo
                nero   × qualsiasi = nero
              Questo garantisce che il verde dell'immagine sia
              esattamente uguale a --p-main (#33ff00) del resto del gioco.
            */}
            <div
                style={{
                    position: 'relative',
                    marginBottom: '1.5rem',
                    border: '2px solid var(--border-crt)',
                    padding: '4px',
                    width: '580px',
                    height: '435px',
                    background: '#000',
                    boxShadow: '0 0 30px rgba(51,255,0,0.12)',
                    overflow: 'hidden',
                }}
            >
                {/* Immagine in scala di grigi — la base neutra */}
                <img
                    src={bootScreenImg}
                    alt="Boot Screen"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                        display: 'block',
                        filter: `grayscale(1) contrast(1.5) brightness(${Math.max(5, progress)}%)`,
                        clipPath: `inset(0 0 ${100 - progress}% 0)`,
                    }}
                />

                {/* Overlay colore fosforo — mix-blend-mode:multiply tinge
                    l'immagine grigia con esattamente #33ff00 */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: '#33ff00',
                        mixBlendMode: 'multiply',
                        clipPath: `inset(0 0 ${100 - progress}% 0)`,
                        pointerEvents: 'none',
                    }}
                />

                <div className="scanline" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
            </div>

            {/* Barra di avanzamento */}
            <div style={{ width: '580px', height: '6px', border: '1px solid var(--p-dim)', marginBottom: '1.2rem', background: '#000' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--p-main)', boxShadow: '0 0 6px var(--p-glow-a)', transition: 'width 0.05s linear' }} />
            </div>

            {/* Log di avvio */}
            <div style={{ width: '580px', textAlign: 'left', fontSize: '0.72rem', lineHeight: '2.0', minHeight: '8rem' }}>
                {textLog.map((log, i) => (
                    <div key={i} style={{ color: 'var(--p-main)' }}>{log}</div>
                ))}
            </div>

            {/* Prompt finale */}
            {isReady && (
                <div
                    className="animate-blink"
                    style={{
                        width: '580px',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        color: 'var(--p-bright)',
                        textShadow: '0 0 8px var(--p-glow-a)',
                        marginTop: '0.8rem',
                    }}
                >
                    PRESS ANY KEY TO START SYSTEM
                </div>
            )}
        </div>
    );
};

export default BootScreen;
