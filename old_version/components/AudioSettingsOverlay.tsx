import React, { useState, useEffect, useCallback } from 'react';
import {
    isAmbienceEnabled, toggleAmbience, getAmbienceVol, setAmbienceVol,
    isSfxEnabled, toggleSfx, getSfxVol, setSfxVol,
    startAmbience, stopAmbience,
} from '../services/audioService';

interface AudioSettingsOverlayProps {
    currentLocation: string;
    roomAmbience: string | null;
    onClose: () => void;
}

const SliderRow: React.FC<{
    label: string;
    value: number;
    onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.4rem 0' }}>
        <span style={{ color: 'var(--p-dim)', width: '8ch', flexShrink: 0, fontSize: '0.75rem' }}>{label}</span>
        <input
            type="range"
            min={1}
            max={100}
            value={Math.round(value * 100)}
            onChange={e => onChange(parseInt(e.target.value, 10) / 100)}
            style={{
                flex: 1,
                accentColor: 'var(--p-main)',
                cursor: 'pointer',
            }}
        />
        <span style={{ color: 'var(--p-bright)', width: '4ch', textAlign: 'right', fontSize: '0.8rem' }}>
            {Math.round(value * 100)}%
        </span>
    </div>
);

const ToggleRow: React.FC<{
    label: string;
    enabled: boolean;
    onToggle: () => void;
}> = ({ label, enabled, onToggle }) => (
    <div
        onClick={onToggle}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            cursor: 'pointer',
        }}
    >
        <span style={{ color: 'var(--p-main)', fontSize: '0.82rem', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{
            color:         enabled ? 'var(--p-bright)' : 'var(--p-dim)',
            border:        `1px solid ${enabled ? 'var(--p-bright)' : 'var(--p-dim)'}`,
            padding:       '2px 10px',
            fontSize:      '0.78rem',
            letterSpacing: '0.1em',
        }}>
            {enabled ? 'ON' : 'OFF'}
        </span>
    </div>
);

type AmbienceKey = 'ship' | 'alien_quiet' | 'alien_cold' | 'alien_electric' | 'sacred';

const AudioSettingsOverlay: React.FC<AudioSettingsOverlayProps> = ({ currentLocation, roomAmbience, onClose }) => {
    const [ambienceOn,  setAmbienceOn]  = useState(isAmbienceEnabled());
    const [ambienceVol, setAmbienceVolState] = useState(getAmbienceVol());
    const [sfxOn,       setSfxOn]       = useState(isSfxEnabled());
    const [sfxVol,      setSfxVolState] = useState(getSfxVol());

    const handleToggleAmbience = useCallback(() => {
        const next = toggleAmbience();
        setAmbienceOn(next);
        if (next && roomAmbience) {
            startAmbience(roomAmbience as AmbienceKey);
        }
    }, [roomAmbience]);

    const handleAmbienceVol = useCallback((v: number) => {
        setAmbienceVol(v);
        setAmbienceVolState(v);
    }, []);

    const handleToggleSfx = useCallback(() => {
        const next = toggleSfx();
        setSfxOn(next);
    }, []);

    const handleSfxVol = useCallback((v: number) => {
        setSfxVol(v);
        setSfxVolState(v);
    }, []);

    /* ESC chiude l'overlay */
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                e.stopImmediatePropagation();
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKey, { capture: true });
        return () => window.removeEventListener('keydown', handleKey, { capture: true });
    }, [onClose]);

    return (
        <div style={{
            position:       'absolute',
            inset:          0,
            background:     'rgba(3, 11, 2, 0.96)',
            zIndex:         100,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
        }}>
            <div style={{
                width:     '500px',
                border:    '2px solid var(--p-main)',
                boxShadow: '0 0 40px rgba(51,255,0,0.25), 0 0 80px rgba(51,255,0,0.08)',
                fontSize:  '0.82rem',
                background:'var(--bg-screen)',
            }}>
                {/* Titolo */}
                <div style={{
                    background:    'var(--p-main)',
                    color:         'var(--bg-screen)',
                    padding:       '0.55rem 1rem',
                    fontSize:      '0.85rem',
                    letterSpacing: '0.14em',
                    textAlign:     'center',
                    textShadow:    'none',
                }}>
                    IMPOSTAZIONI AUDIO
                </div>

                <div style={{ padding: '1.2rem 1.4rem' }}>
                    {/* Sezione Ambience */}
                    <div style={{ marginBottom: '1.2rem' }}>
                        <div style={{ color: 'var(--p-bright)', fontSize: '0.75rem', letterSpacing: '0.12em', marginBottom: '0.6rem', borderBottom: '1px solid var(--border-crt)', paddingBottom: '0.3rem' }}>
                            AUDIO AMBIENTALE
                        </div>
                        <ToggleRow label="ATTIVO" enabled={ambienceOn} onToggle={handleToggleAmbience} />
                        <SliderRow label="VOLUME" value={ambienceVol} onChange={handleAmbienceVol} />
                    </div>

                    {/* Sezione SFX */}
                    <div style={{ marginBottom: '1.4rem' }}>
                        <div style={{ color: 'var(--p-bright)', fontSize: '0.75rem', letterSpacing: '0.12em', marginBottom: '0.6rem', borderBottom: '1px solid var(--border-crt)', paddingBottom: '0.3rem' }}>
                            EFFETTI SONORI
                        </div>
                        <ToggleRow label="ATTIVO" enabled={sfxOn} onToggle={handleToggleSfx} />
                        <SliderRow label="VOLUME" value={sfxVol} onChange={handleSfxVol} />
                    </div>

                    {/* Istruzione chiusura */}
                    <div style={{ textAlign: 'center', color: 'var(--p-dim)', fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                        INVIO o ESC per chiudere
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioSettingsOverlay;
