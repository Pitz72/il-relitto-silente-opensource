import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
}

interface ErrorState {
    hasError: boolean;
    message: string;
}

/* ─── ErrorBoundary ────────────────────────────────────────────────────────
   Cattura qualsiasi eccezione non gestita nel render tree React.
   Invece di far crashare l'intera app, mostra una schermata di errore
   in stile CRT con le informazioni minime per il debug.               */
export class ErrorBoundary extends Component<Props, ErrorState> {
    // Dichiarazioni esplicite necessarie perché React 19 non ha .d.ts bundled
    // e TypeScript risolve Component come any
    declare readonly props: Readonly<Props>;
    state: ErrorState = { hasError: false, message: '' };

    static getDerivedStateFromError(error: unknown): ErrorState {
        const message = error instanceof Error ? error.message : String(error);
        return { hasError: true, message };
    }

    componentDidCatch(error: unknown, info: ErrorInfo) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleRestart = () => {
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div style={{
                position:       'fixed',
                inset:          0,
                background:     '#020802',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontFamily:     '"Press Start 2P", monospace',
                color:          '#33ff00',
            }}>
                <div style={{ maxWidth: '640px', padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', letterSpacing: '0.1em', marginBottom: '2rem', color: '#ff4444' }}>
                        *** ERRORE DI SISTEMA ***
                    </div>
                    <div style={{ fontSize: '0.6rem', lineHeight: 2, marginBottom: '1.5rem' }}>
                        Si è verificato un errore interno del motore di gioco.
                    </div>
                    <div style={{
                        fontSize:     '0.5rem',
                        color:        '#888',
                        marginBottom: '2rem',
                        wordBreak:    'break-word',
                        textAlign:    'left',
                        background:   '#010501',
                        padding:      '0.75rem',
                        border:       '1px solid #333',
                    }}>
                        {this.state.message || 'Errore sconosciuto'}
                    </div>
                    <button
                        onClick={this.handleRestart}
                        style={{
                            fontFamily:    '"Press Start 2P", monospace',
                            fontSize:      '0.65rem',
                            background:    '#33ff00',
                            color:         '#020802',
                            border:        'none',
                            padding:       '0.6rem 1.2rem',
                            cursor:        'pointer',
                            letterSpacing: '0.1em',
                        }}
                    >
                        RIAVVIA
                    </button>
                </div>
            </div>
        );
    }
}
