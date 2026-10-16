import React, { useEffect } from 'react';

interface StartScreenProps {
    onChoice: (event: KeyboardEvent) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onChoice }) => {

    useEffect(() => {
        window.addEventListener('keydown', onChoice);
        return () => { window.removeEventListener('keydown', onChoice); };
    }, [onChoice]);

    return (
        <div
            className="w-full h-full flex flex-col items-center justify-center text-center"
            style={{ gap: '2rem' }}
        >
            {/* Titolo con persistenza fosforo */}
            <h1
                className="animate-blink"
                style={{
                    fontSize:    '3.2rem',
                    letterSpacing: '0.12em',
                    lineHeight:  '1.5',
                    color:       'var(--p-bright)',
                    textShadow:  '0 0 14px var(--p-glow-a), 0 0 35px var(--p-glow-b)',
                }}
            >
                IL RELITTO SILENTE
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <p style={{ fontSize: '1rem', color: 'var(--p-main)' }}>
                    di Simone Pizzi
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--p-dim)' }}>
                    Anno: 1980+45
                </p>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--p-dim)', letterSpacing: '0.06em', marginTop: '1rem' }}>
                Un'avventura testuale dalle profondità oscure dello spazio
            </p>
        </div>
    );
};

export default StartScreen;
