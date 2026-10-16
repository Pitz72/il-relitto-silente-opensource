import React, { useEffect } from 'react';

interface PauseOverlayProps {
    onResume:   () => void;
    onSave:     () => void;
    onLoad:     () => void;
    onRestart:  () => void;
    onQuit:     () => void;
}

const ITEMS = [
    { key: '1', label: 'CONTINUA' },
    { key: '2', label: 'SALVA'    },
    { key: '3', label: 'CARICA'   },
    { key: '4', label: 'RICOMINCIA' },
    { key: '5', label: 'ESCI'     },
] as const;

const PauseOverlay: React.FC<PauseOverlayProps> = ({
    onResume, onSave, onLoad, onRestart, onQuit,
}) => {
    const actions: Record<string, () => void> = {
        '1': onResume,
        '2': onSave,
        '3': onLoad,
        '4': onRestart,
        '5': onQuit,
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            e.stopImmediatePropagation();
            e.preventDefault();
            if (e.key === 'Escape' || e.key === 'F9') { onResume(); return; }
            const fn = actions[e.key];
            if (fn) fn();
        };
        window.addEventListener('keydown', handleKey, { capture: true });
        return () => window.removeEventListener('keydown', handleKey, { capture: true });
    }, [onResume, onSave, onLoad, onRestart, onQuit]);

    return (
        <div style={{
            position:       'absolute',
            inset:          0,
            background:     'rgba(3, 11, 2, 0.97)',
            zIndex:         110,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
        }}>
            <div style={{
                width:     '380px',
                border:    '2px solid var(--p-main)',
                boxShadow: '0 0 40px rgba(51,255,0,0.25), 0 0 80px rgba(51,255,0,0.08)',
                background:'var(--bg-screen)',
                fontSize:  '0.85rem',
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
                    PAUSA
                </div>

                <div style={{ padding: '0.6rem 0' }}>
                    {ITEMS.map(item => (
                        <div
                            key={item.key}
                            onClick={actions[item.key]}
                            style={{
                                display:     'flex',
                                alignItems:  'center',
                                gap:         '1rem',
                                padding:     '0.65rem 1.4rem',
                                cursor:      'pointer',
                                borderBottom:'1px solid var(--border-crt)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(51,255,0,0.07)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <span style={{
                                display:       'inline-block',
                                background:    'var(--p-main)',
                                color:         'var(--bg-screen)',
                                padding:       '2px 7px',
                                fontSize:      '0.75rem',
                                flexShrink:    0,
                                letterSpacing: '0.04em',
                                minWidth:      '2ch',
                                textAlign:     'center',
                            }}>{item.key}</span>
                            <span style={{ color: 'var(--p-main)', letterSpacing: '0.1em' }}>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', color: 'var(--p-dim)', fontSize: '0.7rem', letterSpacing: '0.08em', padding: '0.5rem' }}>
                    ESC / F9 per riprendere
                </div>
            </div>
        </div>
    );
};

export default PauseOverlay;
