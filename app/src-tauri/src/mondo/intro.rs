//! Il suono dell'intro (09-intro-storyboard.md, §2.3, §5 e §13): la colonna sonora, scena per scena,
//! con i suoni del gioco (il re, la ventilazione, il brusio, i relè, i tic, il cuore), la voce di L.V.
//! e il tema della Santa Maria.
//!
//! La pagina manda **i momenti** dell'intro (quando comincia ogni scena, il radar, il faro…: gli
//! stessi di `app/src/intro/scaletta.ts`) e **i pezzi della voce**, e il motore ne ricava una
//! partitura e la suona con il suo orologio, senza passare dal mondo (nessuna stanza, nessun casco:
//! nell'intro si ascolta una registrazione, poi la plancia vista da fuori). Se l'intro cambia i suoi
//! tempi, la partitura li segue da sé.
//!
//! Quattro uscite: il **sound design** (il fruscio della traccia, i clic, il cuore), il **re** (nella
//! plancia è il reattore; sul titolo, una nota), il **tema** e la **voce**. La voce di L.V. e il tema
//! sono due file (decisione dell'autore del 29 ottobre 2026: la voce generata da lui con Gemini, la
//! voce «Riko», passata da una trasmittente leggera, `strumenti/intro/voce_lv.py`; il tema è «The Santa
//! Maria Theme» di Alirio Bruni, la musica del menu del *Mistero della Santa Maria*): li suona un lettore
//! dei file dell'intro, il suo (`musica_file.rs`). Il tema entra quando si apre lo spazio e si
//! abbassa sotto la voce; la voce va sul cursore del parlato.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use super::colpi::{self, Bus, Colpo, Corpo};
use super::dsp::{db, Biquad, Caso, Scorrevole};
use super::fondi::Ventilazione;
use super::brusio::Brusio;
use super::musica_file::{Biblioteca, Dopo, Lettore, Pezzo, Richiesta};
use super::re::Re;
use super::riverbero::Riverbero;

/// I momenti dell'intro, in secondi dall'inizio: quelli di `Momenti` in scaletta.ts.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Momenti {
    pub fruscio_a: f32,
    pub spia: f32,
    pub battito: [f32; 2],
    pub stella: [f32; 2],
    /// entra il tema, quando si apre lo spazio (−1: la pagina non lo manda, e il tema non c'è)
    #[serde(default = "senza")]
    pub tema: f32,
    pub nave_b: f32,
    pub re_b: f32,
    pub radar: [f32; 2],
    pub fuoco: [f32; 2],
    pub stelle_spente: [f32; 2],
    pub faro: f32,
    pub brusio: [f32; 2],
    pub scala: [f32; 2],
    pub scala_ferma: f32,
    pub fruscio_f: f32,
    pub pulsa: [f32; 2],
    pub spia_spenta: f32,
    pub glifi: [f32; 2],
    pub traduzione: [f32; 2],
    pub raccordo: [f32; 2],
    pub arretra: [f32; 2],
    pub interfaccia: [f32; 2],
    pub partita: [f32; 2],
}

fn senza() -> f32 {
    -1.0
}

/// Un pezzo della voce di L.V.: comincia al secondo `t` dell'intro, e va da `da` ad `a` del file.
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct PezzoVoce {
    pub t: f32,
    pub da: f32,
    pub a: f32,
}

/// Quello che la pagina manda quando l'intro comincia.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DatiIntro {
    pub momenti: Momenti,
    /// la durata dell'intro
    pub durata: f32,
    /// i pezzi della voce di L.V., ognuno con il suo testo
    #[serde(default)]
    pub voce: Vec<PezzoVoce>,
}

/// Una cosa che la partitura fa a un dato secondo.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Cue {
    /// il fruscio della traccia: (livello dB, secondi); −120 lo toglie
    Nastro(f32, f32),
    /// un pezzo della voce di L.V.: (da, a) nel file
    Voce(f32, f32),
    /// entra il tema
    Tema,
    /// il tema sotto la voce: (quanto più basso, in dB; secondi)
    Abbassa(f32, f32),
    /// il re: (livello dB, armonici 0–1, secondi); nella plancia è il reattore
    Re(f32, f32, f32),
    /// la ventilazione della plancia: (livello dB, secondi)
    Vent(f32, f32),
    /// il soffio di brusio dalla radio: (livello dB, secondi)
    Brusio(f32, f32),
    /// un tic: (chiarezza, livello dB, posto)
    Tic(f32, f32, f32),
    /// un relè: (chiude, livello dB, posto)
    Rele(bool, f32, f32),
    /// un colpo sordo del cuore: (livello dB, quanto più debole il secondo colpo del doppio)
    Cuore(f32),
    /// un fruscio che sale, la lettera trovata: (livello dB)
    Lettera(f32),
    /// un clic granulare, il glifo che compare: (livello dB, posto)
    Glifo(f32, f32),
    /// lo squelch della radio che si apre o si chiude: (livello dB)
    Squelch(f32),
    /// tutto verso il silenzio, in secondi (i file no: hanno la loro fine)
    Tace(f32),
    /// la fine dell'intro: tutto verso il silenzio, anche i file, e poi smette di calcolare
    Fine(f32),
}

const SPENTO: f32 = -120.0;
const MAX_COLPI: usize = 48;
/// La voce di L.V. sopra il livello a cui il lettore porta ogni file: il parlato sta a circa
/// −22 dBFS di valore efficace (il file intero, con le sue pause, a −27).
const LIV_VOCE: f32 = -1.0;
/// Il tema, un poco sotto la musica del gioco: è sotto le parole e sotto le immagini.
const LIV_TEMA: f32 = -3.0;
/// Quanto si abbassa il tema mentre L.V. parla.
const SOTTO_LA_VOCE: f32 = -8.0;

/// La partitura dell'intro: (secondo, cue), in ordine. Pura: si prova senza il motore.
pub fn partitura(d: &DatiIntro) -> Vec<(f32, Cue)> {
    let m = &d.momenti;
    let mut c: Vec<(f32, Cue)> = Vec::new();
    let mut p = |t: f32, q: Cue| c.push((t.max(0.0), q));

    // ---- A · la traccia: la statica della radio della tuta, continua, e il clic della spia. Il fiato
    // è quello vero, nella voce di L.V.: il respiro sintetizzato non c'è più. I buchi della traccia
    // (un quarto di secondo di silenzio fra le frasi) non ci sono più: si sentivano come le cuciture di
    // un file in loop (l'autore, 30 ottobre 2026: «dobbiamo rendere tutto omogeneo»)
    p(m.fruscio_a, Cue::Nastro(-14.0, 1.0));
    p(m.spia, Cue::Tic(600.0, -16.0, 0.0));
    // la voce di L.V., un pezzo per ogni testo; mentre parla il tema (se suona) si abbassa
    for v in &d.voce {
        p(v.t, Cue::Voce(v.da, v.a));
        p(v.t - 0.6, Cue::Abbassa(SOTTO_LA_VOCE, 0.9));
        p(v.t + (v.a - v.da) + 0.2, Cue::Abbassa(0.0, 2.5));
    }
    // il cuore (54 al minuto, che rallenta): quattro doppi colpi nel nero; poi, quando si apre lo
    // spazio, va avanti ancora un poco, sempre più lento e lontano, finché non si sente più
    let battiti = [(0.0, -14.0), (0.95, -16.0), (2.0, -18.0), (3.1, -20.0), (4.3, -23.0), (5.65, -26.5), (7.1, -30.0), (8.7, -34.0), (10.4, -39.0)];
    for (dt, liv) in battiti {
        p(m.battito[0] + dt, Cue::Cuore(liv));
    }
    p(m.battito[0], Cue::Nastro(-24.0, 2.5));
    p(m.battito[0] + 3.2, Cue::Nastro(SPENTO, 0.3));

    // ---- B · il margine: il nastro tace, il cuore si allontana, e quando si apre lo spazio entra il tema
    p(m.battito[1], Cue::Tace(0.3));
    if m.tema >= 0.0 {
        p(m.tema, Cue::Tema);
    }

    // ---- C · il radar: il reattore sotto il pavimento, la ventilazione, il tic del radar a ogni giro
    p(m.radar[0], Cue::Re(-16.0, 0.45, 3.0));
    p(m.radar[0], Cue::Vent(-22.0, 3.0));
    let mut t = m.radar[0] + 1.5;
    while t < m.faro {
        p(t, Cue::Tic(2000.0, -22.0, 0.25));
        t += 3.0;
    }

    // ---- D · il faro: il relè, e per un secondo e mezzo il brusio dalla radio, poi di colpo niente
    p(m.faro, Cue::Rele(true, -16.0, -0.2));
    p(m.brusio[0] - 0.12, Cue::Squelch(-20.0));
    p(m.brusio[0], Cue::Brusio(-18.0, 0.15));
    p(m.brusio[1], Cue::Brusio(SPENTO, 0.03));
    p(m.brusio[1], Cue::Squelch(-24.0));

    // ---- E · la scala: fuori dalla nave la plancia tace; resta il tema
    p(m.scala[0], Cue::Vent(SPENTO, 1.0));
    p(m.scala[0], Cue::Re(SPENTO, 0.0, 2.0));

    // ---- F · la traccia, seconda parte: il ponte dal fruscio; il cuore, dopo «La vedo pulsare»
    p(m.fruscio_f, Cue::Nastro(-18.0, 1.5));
    p(m.pulsa[0] + 2.4, Cue::Cuore(-16.0));
    p(m.pulsa[0] + 3.55, Cue::Cuore(-19.0));
    p(m.spia_spenta - 0.2, Cue::Tace(0.6));

    // ---- G · il titolo: sedici glifi, un clic granulare ciascuno; sedici lettere, un fruscio che sale
    let glifi = 16usize;
    for i in 0..glifi {
        let t = m.glifi[0] + (m.glifi[1] - m.glifi[0]) * (i as f32 / glifi as f32);
        let posto = ((i * 7 % 11) as f32 / 5.0) - 1.0;
        p(t, Cue::Glifo(-22.0, posto * 0.5));
    }
    for i in 0..glifi {
        // non da sinistra a destra: a intervalli diseguali (il passo non è costante)
        let x = (i as f32 + 0.5 * ((i * 5 % 7) as f32 / 7.0)) / glifi as f32;
        p(m.traduzione[0] + (m.traduzione[1] - m.traduzione[0]) * x.min(0.98), Cue::Lettera(-26.0 + (i as f32) * 0.35));
    }
    // il titolo intero: una nota bassa, il re, sotto la coda del tema
    p(m.traduzione[1], Cue::Re(-15.0, 0.3, 2.0));

    // ---- H · la plancia: il re è il reattore, la ventilazione, la console che parte
    p(m.raccordo[0], Cue::Re(-14.0, 0.5, 1.2));
    p(m.arretra[0], Cue::Vent(-20.0, 3.0));
    for (i, dt) in [0.0, 0.45, 0.9, 1.35, 1.9, 2.4].iter().enumerate() {
        let t = m.interfaccia[0] + dt;
        p(t, Cue::Rele(i % 2 == 0, -20.0, -0.5 + 0.2 * i as f32));
        p(t + 0.07, Cue::Tic(1400.0 + 400.0 * i as f32, -26.0, -0.4 + 0.16 * i as f32));
    }
    // la partita comincia: l'intro sfuma e il gioco ha la sua plancia
    p((d.durata - 1.5).max(m.partita[0]), Cue::Fine(1.5));

    c.sort_by(|a, b| a.0.total_cmp(&b.0));
    c
}

/// La statica della radio della tuta: un fruscio alto e continuo, sempre uguale. Niente respiro del
/// volume, niente scoppiettii, niente buchi: un fondo omogeneo, che non si nota se non quando manca.
struct Nastro {
    caso: Caso,
    hp: Biquad,
    lp: Biquad,
    g: Scorrevole,
}

impl Nastro {
    fn nuovo(sr: f32, seme: u64) -> Self {
        Nastro { caso: Caso::nuovo(seme), hp: Biquad::passaalto(1400.0, 0.7, sr), lp: Biquad::passabasso(9000.0, 0.7, sr), g: Scorrevole::nuovo(0.0) }
    }

    #[inline]
    fn campione(&mut self) -> f32 {
        let b = self.caso.bianco();
        self.lp.elabora(self.hp.elabora(b, 0), 0) * self.g.passo() * NORM_NASTRO * NORM_CONTINUO
    }
}

/// Il fruscio senza il suo respiro (che lo portava fra 0,7 e 1) vale come prima, in media.
const NORM_CONTINUO: f32 = 0.85;

/// Livelli a cui un «0 dB» di ogni strato vale circa −30 dBFS di valore efficace.
const NORM_NASTRO: f32 = 0.10;
const NORM_RE: f32 = 1.58;
const NORM_VENT: f32 = 1.0;
const NORM_BRUSIO: f32 = 1.0;

/// Un campione dell'intro: le quattro uscite, ognuna stereo, ognuna per il suo cursore.
#[derive(Clone, Copy, Debug, Default)]
pub struct Uscita {
    /// il sound design: il cursore degli effetti
    pub suoni: (f32, f32),
    /// il re, con la sua sala: il cursore della musica
    pub re: (f32, f32),
    /// il tema, da file: il cursore della musica, al livello dei file
    pub tema: (f32, f32),
    /// la voce di L.V.: il cursore del parlato
    pub voce: (f32, f32),
}

pub struct Intro {
    sr: f32,
    dt: f32,
    caso: Caso,
    attiva: bool,
    t: f32,
    cue: Vec<(f32, Cue)>,
    prossimo: usize,
    nastro: Nastro,
    re: Re,
    vent: Ventilazione,
    brusio: Brusio,
    brusio_g: Scorrevole,
    brusio_filtro: [Biquad; 2],
    colpi: Vec<Colpo>,
    sala: Riverbero,
    /// i file dell'intro: la voce di L.V. e il tema, ognuno con il suo lettore (vanno su due cursori)
    voce: Lettore,
    tema: Lettore,
    /// il tema sotto la voce
    abbassa: Scorrevole,
    /// il volume di tutta l'intro (l'uscita, e l'avvio)
    master: Scorrevole,
}

impl Intro {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let mut sala = Riverbero::nuovo(sr);
        // il vuoto: una sala enorme e fredda per il re
        sala.stanza(7.0, 3.0, 1.0, 2.0, 0.0);
        Intro {
            sr,
            dt: 1.0 / sr,
            caso: Caso::nuovo(seme ^ 0x1A7120),
            attiva: false,
            t: 0.0,
            cue: Vec::new(),
            prossimo: 0,
            nastro: Nastro::nuovo(sr, seme ^ 0x7A57),
            re: Re::nuovo(sr, seme ^ 0x2E),
            vent: Ventilazione::nuova(sr, seme ^ 0x7E27),
            brusio: Brusio::nuovo(sr, seme ^ 0xB005),
            brusio_g: Scorrevole::nuovo(0.0),
            brusio_filtro: [Biquad::passabasso(3400.0, 0.7, sr), Biquad::passaalto(350.0, 0.7, sr)],
            colpi: Vec::with_capacity(MAX_COLPI),
            sala,
            voce: Lettore::nuovo(sr),
            tema: Lettore::nuovo(sr),
            abbassa: Scorrevole::nuovo(1.0),
            master: Scorrevole::nuovo(0.0),
        }
    }

    /// Dove stanno i file (la cartella della musica). Va chiamata fuori dal thread audio.
    pub fn con_cartella(&mut self, cartella: PathBuf) {
        self.voce.biblioteca = Some(Biblioteca::nuova(cartella.clone()));
        self.tema.biblioteca = Some(Biblioteca::nuova(cartella));
    }

    pub fn attiva(&self) -> bool {
        self.attiva
    }

    /// L'intro comincia: la partitura si ricava dai momenti, e i due file cominciano a decodificarsi
    /// (la prima frase di L.V. arriva dopo una decina di secondi: ce n'è il tempo).
    pub fn avvia(&mut self, d: &DatiIntro) {
        self.cue = partitura(d);
        self.prossimo = 0;
        self.t = 0.0;
        self.attiva = true;
        self.colpi.clear();
        self.nastro.g.v = 0.0;
        self.nastro.g.verso(0.0, 0.0, self.sr);
        self.re.g.verso(0.0, 0.0, self.sr);
        self.vent.g.verso(0.0, 0.0, self.sr);
        self.brusio_g.verso(0.0, 0.0, self.sr);
        self.voce.tace(0.02);
        self.tema.tace(0.02);
        self.abbassa.verso(1.0, 0.0, self.sr);
        if !d.voce.is_empty() {
            self.voce.precarica(Pezzo::LV);
        }
        if d.momenti.tema >= 0.0 {
            self.tema.precarica(Pezzo::SM);
        }
        self.master.verso(1.0, 0.3, self.sr);
    }

    /// L'intro finisce (o si salta con Esc): sfuma e smette.
    pub fn ferma(&mut self, secondi: f32) {
        if !self.attiva {
            return;
        }
        self.cue.clear();
        self.prossimo = 0;
        self.esegui(Cue::Fine(secondi));
    }

    fn esegui(&mut self, c: Cue) {
        let sr = self.sr;
        match c {
            Cue::Nastro(liv, s) => self.nastro.g.verso(lin(liv), s, sr),
            Cue::Voce(da, a) => self.voce.avvia(Richiesta { pezzo: Pezzo::LV, da, a: Some(a), entra: 0.03, dopo: Dopo::Niente, incrocio: 0.0, esce: 0.2, livello: LIV_VOCE }),
            Cue::Tema => self.tema.avvia(Richiesta { pezzo: Pezzo::SM, da: 0.0, a: None, entra: 2.5, dopo: Dopo::Niente, incrocio: 0.0, esce: 4.0, livello: LIV_TEMA }),
            Cue::Abbassa(liv, s) => self.abbassa.verso(db(liv), s, sr),
            Cue::Re(liv, alti, s) => {
                self.re.g.verso(lin(liv) * NORM_RE, s, sr);
                self.re.alti.verso(alti, s, sr);
            }
            Cue::Vent(liv, s) => self.vent.g.verso(lin(liv) * NORM_VENT, s, sr),
            Cue::Brusio(liv, s) => {
                self.brusio.quanti.verso(if liv <= -100.0 { 0.0 } else { 18.0 }, s, sr);
                self.brusio_g.verso(lin(liv) * NORM_BRUSIO, s, sr);
            }
            Cue::Tic(chiaro, liv, posto) => self.colpo(colpi::tic(chiaro, sr), liv, posto),
            Cue::Rele(chiude, liv, posto) => {
                let c = colpi::rele(chiude, &mut self.caso, sr);
                self.colpo(c, liv, posto);
            }
            Cue::Cuore(liv) => {
                // un doppio colpo sordo: il secondo, più piano, dopo un quarto di secondo
                let a = colpi::spinta(&mut self.caso, sr);
                self.colpo(a, liv, 0.0);
                let b = colpi::spinta(&mut self.caso, sr);
                self.colpo_in(b, liv - 5.0, 0.0, 0.26);
            }
            Cue::Lettera(liv) => {
                let fc0 = self.caso.tra(900.0, 1500.0);
                let f = colpi::Fruscio::nuovo(0.22, 0.85, (fc0, fc0 * 3.2), 2.2, colpi::Filtro::Banda, sr);
                let posto = self.caso.tra(-0.3, 0.3);
                self.colpo(Corpo::Fruscio(f).per(2.0), liv, posto);
            }
            Cue::Glifo(liv, posto) => {
                let c = colpi::granello(&mut self.caso, sr);
                self.colpo(c, liv, posto);
            }
            Cue::Squelch(liv) => self.colpo(colpi::squelch(sr), liv, 0.1),
            Cue::Fine(s) => {
                self.esegui(Cue::Tace(s));
                self.voce.tace(s);
                self.tema.tace(s);
                self.master.verso(0.0, s.max(0.05), sr);
            }
            Cue::Tace(s) => {
                self.nastro.g.verso(0.0, s, sr);
                self.re.g.verso(0.0, s, sr);
                self.vent.g.verso(0.0, s, sr);
                self.brusio.quanti.verso(0.0, s, sr);
                self.brusio_g.verso(0.0, s, sr);
            }
        }
    }

    fn colpo(&mut self, c: Corpo, liv: f32, posto: f32) {
        self.colpo_in(c, liv, posto, 0.0);
    }

    fn colpo_in(&mut self, c: Corpo, liv: f32, posto: f32, ritardo: f32) {
        if self.colpi.len() < MAX_COLPI {
            self.colpi.push(Colpo::nuovo(c, Bus::Esterno, liv, posto, ritardo, self.sr));
        }
    }

    /// Fa andare il tempo dell'intro (a ogni blocco).
    pub fn passo(&mut self, dt: f32) {
        if !self.attiva {
            return;
        }
        self.t += dt;
        while self.prossimo < self.cue.len() && self.cue[self.prossimo].0 <= self.t {
            let c = self.cue[self.prossimo].1;
            self.prossimo += 1;
            self.esegui(c);
        }
        self.voce.passo(dt);
        self.tema.passo(dt);
        // finito: la partitura è esaurita, il volume è a zero
        if self.prossimo >= self.cue.len() && self.master.v < 1e-4 && self.master.meta() == 0.0 {
            self.attiva = false;
            self.voce.tace(0.02);
            self.tema.tace(0.02);
        }
    }

    /// Un campione: le quattro uscite, stereo.
    #[inline]
    pub fn campione(&mut self) -> Uscita {
        if !self.attiva {
            return Uscita::default();
        }
        let g = self.master.passo();
        let dt = self.dt;
        let mut l = 0.0f32;
        let mut r = 0.0f32;
        // il fruscio della traccia, al centro
        let n = self.nastro.campione();
        l += n;
        r += n;
        // la ventilazione della plancia
        let (vl, vr) = self.vent.campione();
        l += vl;
        r += vr;
        // il brusio dalla radio: banda stretta
        let bg = self.brusio_g.passo();
        if bg > 1e-6 {
            let (bl, br) = self.brusio.campione();
            let m = (bl + br) * 0.5 * bg;
            let m = self.brusio_filtro[0].elabora(m, 0);
            let m = self.brusio_filtro[1].elabora(m, 0);
            l += m * 0.8;
            r += m;
        }
        // i colpi
        let mut k = 0;
        while k < self.colpi.len() {
            match self.colpi[k].campione(&mut self.caso) {
                Some((a, b)) => {
                    l += a;
                    r += b;
                    k += 1;
                }
                None => {
                    self.colpi.swap_remove(k);
                }
            }
        }
        // il re, con la sala del vuoto
        let (rl, rr) = self.re.campione(dt as f64);
        let (wl, wr) = self.sala.elabora(rl, rr);
        // i file: il tema (sotto la voce si abbassa) e la voce
        let ab = self.abbassa.passo();
        let (tl, tr) = self.tema.campione();
        let (pl, pr) = self.voce.campione();
        Uscita { suoni: (l * g, r * g), re: ((rl * 0.6 + wl) * g, (rr * 0.6 + wr) * g), tema: (tl * ab * g, tr * ab * g), voce: (pl * g, pr * g) }
    }
}

fn lin(x: f32) -> f32 {
    if x <= -100.0 {
        0.0
    } else {
        db(x)
    }
}

#[cfg(test)]
mod prove {
    use super::*;

    fn momenti_di_prova() -> DatiIntro {
        // momenti come quelli di scaletta.ts (non gli stessi: le prove non devono seguire ogni ritocco)
        let json = r#"{"momenti": {"fruscioA": 0.8, "spia": 2.2, "battito": [42.9, 45.9], "stella": [45.9, 48.4], "tema": 46.3, "naveB": 48.4, "reB": 49.4,
            "radar": [60.0, 66.2], "fuoco": [66.2, 67.8], "stelleSpente": [67.8, 72.8], "faro": 72.8, "brusio": [74.85, 76.35],
            "scala": [80.0, 103.5], "scalaFerma": 103.0, "fruscioF": 101.5, "pulsa": [115.0, 120.0], "spiaSpenta": 124.0,
            "glifi": [130.0, 131.8], "traduzione": [131.8, 134.8], "raccordo": [138.0, 139.2], "arretra": [139.2, 142.4],
            "interfaccia": [142.4, 145.4], "partita": [145.4, 147.0]},
            "durata": 147.0,
            "voce": [{"t": 11.75, "da": 2.2, "a": 15.1}, {"t": 50.0, "da": 47.7, "a": 60.0}]}"#;
        serde_json::from_str(json).expect("i momenti di prova sono scritti male")
    }

    #[test]
    fn la_partitura_e_in_ordine_e_ogni_scena_ha_il_suo_suono() {
        let d = momenti_di_prova();
        let p = partitura(&d);
        assert!(p.windows(2).all(|w| w[0].0 <= w[1].0), "la partitura non è in ordine");
        let tra = |a: f32, b: f32, f: &dyn Fn(&Cue) -> bool| p.iter().any(|(t, c)| *t >= a && *t < b && f(c));
        assert!(tra(0.0, 3.0, &|c| matches!(c, Cue::Nastro(..))), "A: manca il fruscio della traccia");
        assert!(tra(0.0, 3.0, &|c| matches!(c, Cue::Tic(..))), "A: manca il clic della spia");
        assert_eq!(p.iter().filter(|(_, c)| matches!(c, Cue::Voce(..))).count(), 2, "i pezzi della voce");
        assert!(tra(11.7, 11.8, &|c| *c == Cue::Voce(2.2, 15.1)), "A: la prima frase di L.V. non comincia con il suo testo");
        assert!(tra(42.0, 46.0, &|c| matches!(c, Cue::Cuore(..))), "A: manca il battito");
        assert!(tra(47.0, 56.0, &|c| matches!(c, Cue::Cuore(..))), "B: il cuore non va avanti nello spazio");
        assert!(!tra(57.0, 60.0, &|c| matches!(c, Cue::Cuore(..))), "B: il cuore non si spegne");
        assert!(tra(46.2, 46.4, &|c| *c == Cue::Tema), "B: il tema non entra con lo spazio");
        assert!(tra(49.0, 49.6, &|c| matches!(c, Cue::Abbassa(l, _) if *l < 0.0)), "B: il tema non si abbassa sotto la voce");
        assert!(tra(62.0, 63.0, &|c| *c == Cue::Abbassa(0.0, 2.5)), "B: il tema non torna su dopo la voce");
        assert!(!tra(46.0, 60.0, &|c| matches!(c, Cue::Re(..))), "B: il re della guida non c'è più, c'è il tema");
        assert!(tra(60.0, 73.0, &|c| matches!(c, Cue::Vent(..))), "C: manca la ventilazione");
        assert!(p.iter().filter(|(t, c)| *t >= 60.0 && *t < 72.8 && matches!(c, Cue::Tic(..))).count() >= 3, "C: il radar fa un tic a ogni giro");
        assert!(tra(72.7, 73.0, &|c| matches!(c, Cue::Rele(..))), "D: manca il relè del faro");
        assert!(tra(74.0, 77.0, &|c| matches!(c, Cue::Brusio(..))), "D: manca il brusio dalla radio");
        assert!(tra(101.0, 103.0, &|c| matches!(c, Cue::Nastro(..))), "F: il fruscio non torna prima della fine di E");
        assert_eq!(p.iter().filter(|(t, c)| *t >= 130.0 && *t < 131.8 && matches!(c, Cue::Glifo(..))).count(), 16, "G: sedici glifi");
        assert_eq!(p.iter().filter(|(_, c)| matches!(c, Cue::Lettera(..))).count(), 16, "G: sedici lettere");
        assert!(tra(142.0, 146.0, &|c| matches!(c, Cue::Rele(..))), "H: la console non parte");
    }

    #[test]
    fn la_statica_e_continua_senza_buchi_ne_respiri() {
        // l'autore, 30 ottobre 2026: le interruzioni della statica si sentivano come un file in loop
        let mut i = Intro::nuovo(24000.0, 5);
        let d = momenti_di_prova();
        i.avvia(&d);
        let mut finestre: Vec<f64> = Vec::new();
        let (mut e, mut n) = (0.0f64, 0usize);
        let mut t = 0.0f32;
        while t < 11.0 {
            i.passo(128.0 / 24000.0);
            for _ in 0..128 {
                let u = i.campione();
                if t >= 3.0 {
                    e += (u.suoni.0 * u.suoni.0) as f64;
                    n += 1;
                }
            }
            t += 128.0 / 24000.0;
            // finestre di un quinto di secondo
            if n >= 4800 {
                finestre.push(10.0 * (e / n as f64 + 1e-20).log10());
                e = 0.0;
                n = 0;
            }
        }
        let (min, max) = finestre.iter().fold((f64::MAX, f64::MIN), |(a, b), &x| (a.min(x), b.max(x)));
        assert!(min > -60.0, "il fruscio non suona ({min:.1} dB)");
        assert!(max - min < 1.0, "la statica non è omogenea: da {min:.1} a {max:.1} dB in finestre di 0,2 s");
    }

    #[test]
    fn l_intro_suona_tace_dove_deve_e_finisce() {
        // senza i file (nessuna cartella): il tema e la voce non ci sono, il resto sì
        let mut i = Intro::nuovo(24000.0, 9);
        let d = momenti_di_prova();
        i.avvia(&d);
        let blocco = 128usize;
        let mut sez: Vec<(f32, f32)> = Vec::new(); // (secondo, potenza)
        let mut t = 0.0f32;
        while t < d.durata + 3.0 {
            i.passo(blocco as f32 / 24000.0);
            let mut e = 0.0f32;
            for _ in 0..blocco {
                let u = i.campione();
                for (l, r) in [u.suoni, u.re, u.tema, u.voce] {
                    assert!(l.is_finite() && r.is_finite(), "campione non finito a {t:.1} s");
                    e += l * l + r * r;
                }
            }
            sez.push((t, e / (blocco as f32 * 8.0)));
            t += blocco as f32 / 24000.0;
        }
        let db = |da: f32, a: f32| {
            let v: Vec<f32> = sez.iter().filter(|(t, _)| *t >= da && *t < a).map(|(_, e)| *e).collect();
            10.0 * (v.iter().sum::<f32>() / v.len().max(1) as f32 + 1e-20).log10()
        };
        assert!(db(3.0, 10.0) > -70.0, "A è muta ({:.1} dB)", db(3.0, 10.0));
        assert!(db(46.5, 49.5) > -85.0, "il cuore non va avanti nello spazio ({:.1} dB)", db(46.5, 49.5));
        assert!(db(62.0, 70.0) > -80.0, "la plancia è muta ({:.1} dB)", db(62.0, 70.0));
        assert!(db(124.5, 129.0) < -70.0, "il silenzio prima del titolo non è silenzio ({:.1} dB)", db(124.5, 129.0));
        assert!(!i.attiva(), "l'intro non è finita");
        assert!(db(d.durata + 1.0, d.durata + 3.0) < -100.0, "dopo la fine suona ancora");
    }

    #[test]
    fn saltarla_con_esc_la_spegne_senza_scatti() {
        let mut i = Intro::nuovo(24000.0, 3);
        let d = momenti_di_prova();
        i.avvia(&d);
        let mut max = 0.0f32;
        for _ in 0..(10.0 * 24000.0 / 128.0) as usize {
            i.passo(128.0 / 24000.0);
            for _ in 0..128 {
                max = max.max(i.campione().suoni.0.abs());
            }
        }
        i.ferma(0.5);
        let mut ultimo = 0.0f32;
        for _ in 0..(2.0 * 24000.0 / 128.0) as usize {
            i.passo(128.0 / 24000.0);
            for _ in 0..128 {
                let u = i.campione();
                ultimo = u.suoni.0.abs() + u.re.0.abs() + u.voce.0.abs() + u.tema.0.abs();
            }
        }
        assert!(ultimo < 1e-3, "dopo lo stop suona ancora ({ultimo})");
        assert!(!i.attiva(), "dopo lo stop l'intro è ancora attiva");
        assert!(max < 1.5, "il picco prima dello stop è troppo alto ({max})");
    }

    #[test]
    fn la_voce_e_il_tema_suonano_dai_file() {
        // con i file veri, se ci sono (nell'albero di lavoro): la prima frase di L.V. comincia con il
        // suo testo, e il tema entra con lo spazio e si abbassa sotto la voce
        let cartella = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../audio/musica-ia");
        if !cartella.join("LV").join("LV-01-la-traccia.mp3").is_file() {
            return;
        }
        let sr = 24000.0;
        let mut i = Intro::nuovo(sr, 11);
        i.con_cartella(cartella);
        let d = momenti_di_prova();
        i.avvia(&d);
        // il thread di lavoro decodifica i due file: nella realtà ha una decina di secondi, qui li aspetta
        for _ in 0..600 {
            i.voce.passo(0.0);
            i.tema.passo(0.0);
            let pronto = |l: &Lettore, p: Pezzo| l.biblioteca.as_ref().is_some_and(|b| b.pronto(p).is_some());
            if pronto(&i.voce, Pezzo::LV) && pronto(&i.tema, Pezzo::SM) {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
        let mut sez: Vec<(f32, f32, f32)> = Vec::new(); // (secondo, voce, tema)
        let mut sotto = 1.0f32;
        let mut t = 0.0f32;
        while t < 56.0 {
            i.passo(128.0 / sr);
            let (mut v, mut m) = (0.0f32, 0.0f32);
            for _ in 0..128 {
                let u = i.campione();
                v += u.voce.0 * u.voce.0;
                m += u.tema.0 * u.tema.0;
            }
            sez.push((t, v / 128.0, m / 128.0));
            if (53.0..53.1).contains(&t) {
                sotto = i.abbassa.v;
            }
            t += 128.0 / sr;
        }
        let media = |da: f32, a: f32, k: usize| {
            let v: Vec<f32> = sez.iter().filter(|s| s.0 >= da && s.0 < a).map(|s| if k == 0 { s.1 } else { s.2 }).collect();
            10.0 * (v.iter().sum::<f32>() / v.len().max(1) as f32 + 1e-20).log10()
        };
        assert!(media(0.0, 11.7, 0) < -100.0, "la voce parla prima del suo testo ({:.1} dB)", media(0.0, 11.7, 0));
        assert!(media(12.0, 26.0, 0) > -45.0, "la prima frase di L.V. non si sente ({:.1} dB)", media(12.0, 26.0, 0));
        assert!(media(40.0, 46.0, 1) < -100.0, "il tema entra prima dello spazio ({:.1} dB)", media(40.0, 46.0, 1));
        assert!(media(47.0, 49.0, 1) > -60.0, "il tema non entra con lo spazio ({:.1} dB)", media(47.0, 49.0, 1));
        assert!(sotto < db(-6.0), "il tema non si abbassa sotto la voce ({sotto})");
    }
}
