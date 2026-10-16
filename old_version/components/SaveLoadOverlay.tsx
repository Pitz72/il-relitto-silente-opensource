import React, { useEffect, useState } from 'react';
import { PlayerState } from '../types';
import { writeSlotData, readSlotData } from '../services/storageService';

/* ═══════════════════════════════════════════════
   SISTEMA A SLOT — filesystem via IPC Electron
   Fallback localStorage in modalità dev web.
   Nessun dialogo di sistema Windows:
   tutto avviene nell'interfaccia CRT del gioco.
   ═══════════════════════════════════════════════ */

const SLOT_COUNT = 5;

interface SlotData {
  playerState: PlayerState;
  savedAt: string;    // "DD/MM/YYYY · HH:mm"
  location: string;   // nome stanza per anteprima
}

function makeSlotData(playerState: PlayerState): SlotData {
  const now  = new Date();
  const date = now.toLocaleDateString('it-IT');
  const time = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  return { playerState, savedAt: `${date} · ${time}`, location: playerState.location };
}

function parseSlotData(raw: string | null): SlotData | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as SlotData; }
  catch { return null; }
}

/* ─── API pubblica usata da App.tsx ──────────────────────────────────────── */

export async function writeSlot(id: number, playerState: PlayerState): Promise<void> {
  await writeSlotData(id, JSON.stringify(makeSlotData(playerState)));
}

export async function writeAutosave(playerState: PlayerState): Promise<void> {
  await writeSlot(-1, playerState);
}

export async function loadSlotState(id: number): Promise<PlayerState | null> {
  const raw = await readSlotData(id);
  return parseSlotData(raw)?.playerState ?? null;
}

/* ─── Componente ─────────────────────────────── */

interface SaveLoadOverlayProps {
  mode: 'save' | 'load';
  playerState: PlayerState;
  onSave: (slotId: number) => void;
  onLoad: (slotId: number, loadedState: PlayerState) => void;
  onCancel: () => void;
}

const SaveLoadOverlay: React.FC<SaveLoadOverlayProps> = ({
  mode, playerState, onSave, onLoad, onCancel,
}) => {
  const [slots, setSlots]             = useState<(SlotData | null)[]>([]);
  const [autosave, setAutosave]       = useState<SlotData | null>(null);
  const [feedback, setFeedback]       = useState<string>('');
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  /* Carica lo stato degli slot all'apertura */
  useEffect(() => {
    const loadAll = async () => {
      // Ogni lettura è isolata: un errore IPC o un file corrotto su un singolo
      // slot non deve far fallire l'intera schermata di caricamento (BUG B14).
      const safeRead = (id: number) =>
        readSlotData(id).then(parseSlotData).catch(() => null);
      const results = await Promise.all(
        Array.from({ length: SLOT_COUNT }, (_, i) => safeRead(i))
      );
      setSlots(results);
      setAutosave(await safeRead(-1));
    };
    void loadAll();
  }, []);

  const selectSlot = async (slotId: number) => {
    if (mode === 'save') {
      await writeSlotData(slotId, JSON.stringify(makeSlotData(playerState)));
      onSave(slotId);
    } else {
      const raw    = await readSlotData(slotId);
      const loaded = parseSlotData(raw);
      if (!loaded) {
        setFeedback(`SLOT ${slotId + 1}: nessun dato — seleziona uno slot occupato`);
        setTimeout(() => setFeedback(''), 2500);
        return;
      }
      onLoad(slotId, loaded.playerState);
    }
  };

  const selectAutosave = async () => {
    if (mode === 'save') return;
    if (!autosave) {
      setFeedback('AUTOSAVE: nessun dato — gioca per generare un autosave');
      setTimeout(() => setFeedback(''), 2500);
      return;
    }
    onLoad(-1, autosave.playerState);
  };

  /* Gestore tastiera */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      e.stopImmediatePropagation();
      e.preventDefault();
      if (e.key === 'Escape') { onCancel(); return; }
      const num = parseInt(e.key, 10);
      if (num === 0) { void selectAutosave(); return; }
      if (num >= 1 && num <= SLOT_COUNT) void selectSlot(num - 1);
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, playerState, onSave, onLoad, onCancel, slots]);

  const title = mode === 'save' ? 'SALVATAGGIO PARTITA' : 'CARICAMENTO PARTITA';

  return (
    <div
      style={{
        position:       'absolute',
        inset:          0,
        background:     'rgba(3, 11, 2, 0.96)',
        zIndex:         100,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width:     '660px',
          border:    '2px solid var(--p-main)',
          boxShadow: '0 0 40px rgba(51,255,0,0.25), 0 0 80px rgba(51,255,0,0.08)',
          fontSize:  '0.82rem',
          background:'var(--bg-screen)',
        }}
      >
        <div
          style={{
            background:    'var(--p-main)',
            color:         'var(--bg-screen)',
            padding:       '0.55rem 1rem',
            fontSize:      '0.85rem',
            letterSpacing: '0.14em',
            textAlign:     'center',
            textShadow:    'none',
          }}
        >
          {title}
        </div>

        {/* Slot AUTOSAVE */}
        {(() => {
          const isLoadable    = mode === 'load';
          const isHoveredAuto = hoveredSlot === -1;
          return (
            <div
              onClick={() => isLoadable && void selectAutosave()}
              onMouseEnter={() => isLoadable && setHoveredSlot(-1)}
              onMouseLeave={() => setHoveredSlot(null)}
              style={{
                display:      'flex',
                alignItems:   'center',
                padding:      '0.75rem 1rem',
                borderBottom: '1px solid var(--border-crt)',
                cursor:       isLoadable ? 'pointer' : 'default',
                gap:          '1rem',
                background:   isHoveredAuto ? 'rgba(51,255,0,0.07)' : 'rgba(51,255,0,0.025)',
              }}
            >
              <span style={{
                display:       'inline-block',
                background:    isLoadable && autosave ? 'var(--p-bright)' : 'var(--p-dim)',
                color:         'var(--bg-screen)',
                padding:       '2px 7px',
                fontSize:      '0.78rem',
                flexShrink:    0,
                letterSpacing: '0.04em',
                minWidth:      '2ch',
                textAlign:     'center',
              }}>0</span>

              {autosave ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', overflow: 'hidden' }}>
                  <span style={{ color: 'var(--p-bright)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>
                    ★ AUTOSAVE{mode === 'save' ? '  —  gestito automaticamente' : ''}
                  </span>
                  <span style={{ color: 'var(--p-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {autosave.location}
                  </span>
                  <span style={{ color: 'var(--p-dim)', fontSize: '0.7rem' }}>{autosave.savedAt}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ color: 'var(--p-bright)', fontSize: '0.72rem', letterSpacing: '0.1em' }}>★ AUTOSAVE</span>
                  <span style={{ color: 'var(--p-dim)', fontStyle: 'italic', fontSize: '0.78rem' }}>— nessun dato —</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Lista slot manuali */}
        {Array.from({ length: SLOT_COUNT }, (_, i) => {
          const slot       = slots[i];
          const isEmpty    = !slot;
          const isDisabled = mode === 'load' && isEmpty;
          const isHovered  = hoveredSlot === i;

          return (
            <div
              key={i}
              onClick={() => !isDisabled && void selectSlot(i)}
              onMouseEnter={() => !isDisabled && setHoveredSlot(i)}
              onMouseLeave={() => setHoveredSlot(null)}
              style={{
                display:       'flex',
                alignItems:    'center',
                padding:       '0.75rem 1rem',
                borderBottom:  '1px solid var(--border-crt)',
                cursor:        isDisabled ? 'default' : 'pointer',
                gap:           '1rem',
                background:    isHovered ? 'rgba(51,255,0,0.07)' : 'transparent',
                transition:    'background 0.1s',
              }}
            >
              <span
                style={{
                  display:       'inline-block',
                  background:    isDisabled ? 'var(--p-dim)' : 'var(--p-main)',
                  color:         isDisabled ? '#040904' : 'var(--bg-screen)',
                  padding:       '2px 7px',
                  fontSize:      '0.78rem',
                  flexShrink:    0,
                  letterSpacing: '0.04em',
                  minWidth:      '2ch',
                  textAlign:     'center',
                }}
              >
                {i + 1}
              </span>

              {isEmpty ? (
                <span style={{ color: 'var(--p-dim)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                  — SLOT VUOTO —
                </span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                  <span
                    style={{
                      color:        'var(--p-main)',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                    }}
                  >
                    {slot.location}
                  </span>
                  <span style={{ color: 'var(--p-dim)', fontSize: '0.7rem' }}>
                    {slot.savedAt}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {feedback && (
          <div
            style={{
              padding:      '0.45rem 1rem',
              color:        '#e8c84a',
              fontSize:     '0.72rem',
              borderBottom: '1px solid var(--border-crt)',
              letterSpacing:'0.04em',
            }}
          >
            {feedback}
          </div>
        )}

        <div
          style={{
            borderTop:     '1px solid var(--border-crt)',
            padding:       '0.5rem 1rem',
            display:       'flex',
            justifyContent:'space-between',
            fontSize:      '0.68rem',
            color:         'var(--p-dim)',
          }}
        >
          <span>
            <span style={{ color: 'var(--p-main)' }}>[0]</span>{' '}autosave
            {'  '}
            <span style={{ color: 'var(--p-main)' }}>[1–{SLOT_COUNT}]</span>{' '}slot
          </span>
          <span>
            <span style={{ color: 'var(--p-main)' }}>[ESC]</span>
            {' '}per annullare
          </span>
        </div>
      </div>
    </div>
  );
};

export default SaveLoadOverlay;
