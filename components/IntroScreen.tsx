import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playKeystrokeSound, playTerminalBeep } from '../services/audioService';

/* ═══════════════════════════════════════════════════════════════════
   INTRO SCREEN ANIMATA — stile terminale di bordo S/V Santa Maria
   I segmenti appaiono uno a uno con beep acuti. Qualsiasi tasto
   salta l'animazione; INVIO avanza alla pagina successiva o avvia
   il gioco.
   ═══════════════════════════════════════════════════════════════════ */

interface IntroSegment {
  html: string;
  beep: boolean;
}

interface IntroPage {
  segments: IntroSegment[];
}

const SEP = `<div style="color:var(--p-dim);font-size:0.68rem;margin:0.5rem 0;">──────────────────────────────────────────────────────────────</div>`;

const label = (text: string) =>
  `<span style="color:var(--p-dim);display:inline-block;min-width:26ch;">${text}</span>`;

const val   = (text: string) =>
  `<span style="color:var(--p-main);">${text}</span>`;

const bright = (text: string) =>
  `<span style="color:var(--p-bright);">${text}</span>`;

const row = (k: string, v: string, highlight = false) =>
  `<div style="margin-left:1.5ch;font-size:0.75rem;line-height:2.0;">${label(k)}${highlight ? bright(v) : val(v)}</div>`;

const INTRO_PAGES: IntroPage[] = [
  /* ── Pagina 1 — Rapporto sensori ─────────────────────────────── */
  {
    segments: [
      {
        html: `<div style="color:var(--p-dim);font-size:0.68rem;letter-spacing:0.06em;">S/V SANTA MARIA  ·  SISTEMA DI NAVIGAZIONE IA-7  ·  BOOT SEQUENZA COMPLETATA</div>`,
        beep: false,
      },
      { html: SEP, beep: false },
      {
        html: `<div style="color:var(--p-bright);letter-spacing:0.1em;font-size:0.78rem;margin:0.4rem 0;">▌ RAPPORTO SENSORI  —  FASCIA DI KUIPER  ·  SETTORE KP-7712</div>`,
        beep: false,
      },
      { html: row('COORDINATA',        '47.221° / -12.008° / +0.334°'),                 beep: true  },
      { html: row('DISTANZA OGGETTO',  '2.4 UA'),                                        beep: true  },
      { html: row('MASSA STIMATA',     '8.2 × 10⁴ tonnellate'),                          beep: true  },
      { html: row('TEMPERATURA SCAFO', '3.1 K — anomalia termica rilevata'),              beep: true  },
      { html: row('EMISSIONI EM',      'ASSENTI — silenzio totale'),                      beep: true  },
      { html: row('CLASSIFICAZIONE',   'ORIGINE SCONOSCIUTA', true),                     beep: true  },
      { html: SEP, beep: false },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">Nessun registro corrispondente nei database UNN, AstroCorp o Confederazione delle Colonie.</div>`,
        beep: false,
      },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">L'oggetto non trasmette segnali di soccorso. Non risponde ai ping di identificazione.</div>`,
        beep: false,
      },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">Si muove con traiettoria stabile — non è un detrito in deriva.</div>`,
        beep: false,
      },
      { html: SEP, beep: false },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-bright);">▌ NOTA IA-7:  possibile bene non reclamato — protocollo Recupero Libero applicabile.</div>`,
        beep: true,
      },
    ],
  },

  /* ── Pagina 2 — Profilo operatore ────────────────────────────── */
  {
    segments: [
      {
        html: `<div style="color:var(--p-dim);font-size:0.68rem;letter-spacing:0.06em;">S/V SANTA MARIA  ·  REGISTRO DI BORDO  ·  PROFILO OPERATORE</div>`,
        beep: false,
      },
      { html: SEP, beep: false },
      {
        html: `<div style="color:var(--p-bright);letter-spacing:0.1em;font-size:0.78rem;margin:0.4rem 0;">▌ OPERATORE CERTIFICATO — CLASSE MERCANTE INDIPENDENTE</div>`,
        beep: false,
      },
      { html: row('NAVE',             'S/V Santa Maria — cargo leggero classe Delta'),   beep: true  },
      { html: row('ROTTA CORRENTE',   'Marte → Stazione Ganimede IV'),                   beep: true  },
      { html: row('CARICO',           '40 t minerali, lotto #7731-B'),                   beep: true  },
      { html: row('CONSUMABILI',      '18 giorni — tuta EVA e scanner personale attivi'), beep: true  },
      { html: row('LICENZA RECUPERO', 'ATTIVA  ·  zona periferica', true),               beep: true  },
      { html: SEP, beep: false },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">Sei un lupo solitario. Nello spazio profondo le leggi sono un'eco lontana — e tu lo sai da sempre.</div>`,
        beep: false,
      },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">Un relitto non reclamato può valere più di dieci carichi di minerali.</div>`,
        beep: false,
      },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">Hai già rimandato la consegna una volta. Rischieresti una penale.</div>`,
        beep: false,
      },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-bright);line-height:1.9;">Ma quell'oggetto è lì. Freddo. Silenzioso. In attesa.</div>`,
        beep: false,
      },
    ],
  },

  /* ── Pagina 3 — Decisione rotta ──────────────────────────────── */
  {
    segments: [
      {
        html: `<div style="color:var(--p-dim);font-size:0.68rem;letter-spacing:0.06em;">S/V SANTA MARIA  ·  INTERFACCIA PILOTA  ·  DECISIONE RICHIESTA</div>`,
        beep: false,
      },
      { html: SEP, beep: false },
      {
        html: `<div style="color:var(--p-bright);letter-spacing:0.1em;font-size:0.78rem;margin:0.4rem 0;">▌ ROTTA ALTERNATIVA CALCOLATA  —  IN ATTESA DI CONFERMA</div>`,
        beep: false,
      },
      { html: row('DEVIAZIONE',     '+14 ore — penale consegna stimata'),                beep: true  },
      { html: row('DESTINAZIONE',   'oggetto KP-7712 — aggancio a 200 m'),               beep: true  },
      { html: row('RISCHIO STIMATO','INDETERMINATO — dati insufficienti', true),         beep: true  },
      { html: SEP, beep: false },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">Inserisci la rotta alternativa. La Santa Maria aggiusta il muso verso le stelle più fredde.</div>`,
        beep: false,
      },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">Due ore dopo, il relitto occupa tutto il tuo schermo di navigazione.</div>`,
        beep: false,
      },
      { html: `<div style="line-height:1.5;">&nbsp;</div>`, beep: false },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">È enorme. Scuro come il vuoto. E <span style="color:var(--p-bright);letter-spacing:0.06em;">silenzioso</span>.</div>`,
        beep: false,
      },
      { html: `<div style="line-height:1.5;">&nbsp;</div>`, beep: false },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">Indossi la tuta. Controlli lo scanner. Apri il portello.</div>`,
        beep: false,
      },
      {
        html: `<div style="font-size:0.75rem;color:var(--p-main);line-height:1.9;">Non sai cosa ti aspetta. Ma sai che devi scoprirlo.</div>`,
        beep: false,
      },
      {
        html: `<div style="color:var(--p-dim);font-size:0.68rem;margin-top:1rem;border-top:1px solid var(--border-crt);padding-top:0.6rem;letter-spacing:0.06em;">IA-7:  SESSIONE DI VOLO SOSPESA  ·  MODALITÀ ESPLORAZIONE ATTIVA  ·  IN BOCCA AL LUPO.</div>`,
        beep: true,
      },
    ],
  },
];

const SEGMENT_INTERVAL_MS = 110;

const BlinkCursor: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
    <span style={{ color: 'var(--p-main)' }}>{text}</span>
    <span
      className="animate-blink"
      style={{
        display: 'inline-block',
        width: '0.65ch',
        height: '0.9em',
        background: 'var(--p-main)',
        marginLeft: '0.5em',
        flexShrink: 0,
      }}
    />
  </div>
);

const IntroScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [pageIdx,       setPageIdx]       = useState(0);
  const [visibleCount,  setVisibleCount]  = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPage  = INTRO_PAGES[pageIdx];
  const isLastPage   = pageIdx === INTRO_PAGES.length - 1;
  const isPageDone   = visibleCount >= currentPage.segments.length;

  /* ── Reveal automatico dei segmenti ──────────────────────────── */
  useEffect(() => {
    if (isPageDone) return;
    timerRef.current = setTimeout(() => {
      const seg = currentPage.segments[visibleCount];
      if (seg?.beep) playTerminalBeep();
      setVisibleCount(v => v + 1);
    }, SEGMENT_INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPageDone, visibleCount, currentPage]);

  /* ── Scroll automatico al fondo ───────────────────────────────── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  /* ── Reset al cambio pagina ───────────────────────────────────── */
  useEffect(() => {
    setVisibleCount(0);
  }, [pageIdx]);

  /* ── Gestione tastiera ────────────────────────────────────────── */
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (/^F\d+$/.test(e.key) || e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift') return;
    e.preventDefault();

    if (!isPageDone) {
      /* Salta animazione — mostra tutto subito */
      if (timerRef.current) clearTimeout(timerRef.current);
      /* Riproduci tutti i beep mancanti in rapida successione */
      currentPage.segments.slice(visibleCount).forEach((seg, i) => {
        if (seg.beep) setTimeout(() => playTerminalBeep(), i * 30);
      });
      setVisibleCount(currentPage.segments.length);
      return;
    }

    playKeystrokeSound();
    if (isLastPage) {
      onComplete();
    } else {
      setPageIdx(p => p + 1);
    }
  }, [isPageDone, isLastPage, currentPage, visibleCount, onComplete]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const finalPrompt = isLastPage ? 'Premi INVIO per iniziare' : 'Premi INVIO per proseguire...';

  return (
    <div
      ref={scrollRef}
      className="flex-grow overflow-y-auto no-scrollbar"
      style={{ fontSize: '1.35rem' }}
    >
      {currentPage.segments.slice(0, visibleCount).map((seg, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />
      ))}
      {isPageDone && <BlinkCursor text={finalPrompt} />}
    </div>
  );
};

export default IntroScreen;
