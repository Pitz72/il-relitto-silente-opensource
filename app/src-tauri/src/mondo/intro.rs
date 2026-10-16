//! Il suono dell'intro (09-intro-storyboard.md, §2.3 e §5): la colonna sonora dell'animatic, scena
//! per scena, con i suoni del gioco (il fiato, il re, la ventilazione, il brusio, i relè, i tic).
//!
//! La pagina manda **i momenti** dell'animatic (quando comincia ogni scena, il radar, il faro…: gli
//! stessi di `app/src/intro/scaletta.ts`) e il motore ne ricava una partitura e la suona con il
//! suo orologio, senza passare dal mondo (nessuna stanza, nessun casco: nell'intro si ascolta una
//! registrazione, poi la plancia vista da fuori). Se l'animatic cambia i suoi tempi, la partitura li
//! segue da sé.
//!
//! Due uscite: il **sound design** (il fruscio della traccia, il respiro, i clic) e la **guida del
//! re** (la nota che nel vuoto è musica, B, E e G; nella plancia è il reattore). La guida è
//! provvisoria: la musica vera dell'intro la farà l'autore con Lyria (documento 22, §5.8) e prenderà
//! il suo posto.

use serde::{Deserialize, Serialize};

use super::colpi::{self, Bus, Colpo, Corpo};
use super::dsp::{db, Biquad, Caso, Lento, Scorrevole};
use super::fiato::Fiato;
use super::fondi::Ventilazione;
use super::brusio::Brusio;
use super::re::Re;
use super::riverbero::Riverbero;

/// I momenti dell'animatic, in secondi dall'inizio dell'intro: quelli di `Momenti` in scaletta.ts.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Momenti {
    pub fruscio_a: f32,
    pub spia: f32,
    pub battito: [f32; 2],
    pub stella: [f32; 2],
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

/// Quello che la pagina manda quando l'intro comincia.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DatiIntro {
    pub momenti: Momenti,
    /// la durata dell'intro
    pub durata: f32,
    /// dove la traccia ha i suoi buchi: fra una frase e l'altra, mai sulle parole (storyboard, A)
    pub buchi: Vec<f32>,
}

/// Una cosa che la partitura fa a un dato secondo.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Cue {
    /// il fruscio della traccia: (livello dB, secondi); −120 lo toglie
    Nastro(f32, f32),
    /// la traccia ha un buco: il fruscio cade a zero per un quarto di secondo
    Buco,
    /// il respiro di L.V. nel casco: (aria: più è alta più è lento, livello dB, secondi)
    Fiato(f32, f32, f32),
    /// il re: (livello dB, armonici 0–1, secondi); è la guida della musica
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
    /// tutto verso il silenzio, in secondi
    Tace(f32),
    /// la fine dell'intro: tutto verso il silenzio, e poi smette di calcolare
    Fine(f32),
}

const SPENTO: f32 = -120.0;
const MAX_COLPI: usize = 48;

/// La partitura dell'intro: (secondo, cue), in ordine. Pura: si prova senza il motore.
pub fn partitura(d: &DatiIntro) -> Vec<(f32, Cue)> {
    let m = &d.momenti;
    let mut c: Vec<(f32, Cue)> = Vec::new();
    let mut p = |t: f32, q: Cue| c.push((t.max(0.0), q));

    // ---- A · la traccia: un nastro rovinato, il clic della spia, il respiro nel casco
    p(m.fruscio_a, Cue::Nastro(-14.0, 1.0));
    p(m.spia, Cue::Tic(600.0, -16.0, 0.0));
    p(5.0, Cue::Fiato(46.0, -14.0, 1.5));
    p(m.battito[0] * 0.45, Cue::Fiato(38.0, -14.0, 0.5));
    p(m.battito[0] * 0.8, Cue::Fiato(32.0, -14.0, 0.5));
    for &b in &d.buchi {
        p(b, Cue::Buco);
    }
    // il battito (54 al minuto, rallenta): quattro doppi colpi, poi niente
    let battiti = [0.0, 0.95, 2.0, 3.1];
    for (i, dt) in battiti.iter().enumerate() {
        p(m.battito[0] + dt, Cue::Cuore(-14.0 - 2.0 * i as f32));
    }
    p(m.battito[0], Cue::Nastro(-24.0, 2.5));
    p(m.battito[0] + 3.2, Cue::Fiato(32.0, SPENTO, 0.3));
    p(m.battito[0] + 3.2, Cue::Nastro(SPENTO, 0.3));

    // ---- B · il margine: silenzio vero, poi il re, bassissimo (musica)
    p(m.battito[1], Cue::Tace(0.3));
    p(m.re_b, Cue::Re(-11.0, 0.0, 6.0));

    // ---- C · il radar: il re diventa il reattore, la ventilazione, il tic del radar a ogni giro
    p(m.radar[0], Cue::Re(-8.0, 0.45, 3.0));
    p(m.radar[0], Cue::Vent(-20.0, 3.0));
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

    // ---- E · la scala: dalla plancia al vuoto; il re si assottiglia fino a una nota sola
    p(m.scala[0], Cue::Vent(SPENTO, 1.0));
    p(m.scala[0], Cue::Re(-9.0, 0.85, 1.0));
    p(m.scala[0] + 4.0, Cue::Re(-13.0, 0.35, (m.scala_ferma - m.scala[0] - 6.0).max(1.0)));
    p(m.scala_ferma, Cue::Re(-28.0, 0.0, 1.5));

    // ---- F · la traccia, seconda parte: il ponte dal fruscio, il respiro più lento, due colpi, silenzio
    p(m.fruscio_f, Cue::Nastro(-18.0, 1.5));
    p(m.fruscio_f + 0.5, Cue::Fiato(64.0, -16.0, 1.0));
    p(m.pulsa[0], Cue::Cuore(-16.0));
    p(m.pulsa[0] + 1.6, Cue::Cuore(-18.0));
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
    p(m.traduzione[1], Cue::Re(-8.0, 0.3, 2.0));

    // ---- H · la plancia: il re è il reattore, la ventilazione, la console che parte
    p(m.raccordo[0], Cue::Re(-8.0, 0.5, 1.2));
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

/// Il fruscio di una registrazione rovinata: rumore alto, con i suoi scoppiettii, che un buco può far cadere.
struct Nastro {
    caso: Caso,
    hp: Biquad,
    lp: Biquad,
    onda: Lento,
    g: Scorrevole,
    buco: Scorrevole,
    buco_fino: f32,
}

impl Nastro {
    fn nuovo(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let onda = Lento::nuovo((0.3, 1.2), &mut caso);
        Nastro { caso, hp: Biquad::passaalto(1400.0, 0.7, sr), lp: Biquad::passabasso(9000.0, 0.7, sr), onda, g: Scorrevole::nuovo(0.0), buco: Scorrevole::nuovo(1.0), buco_fino: -1.0 }
    }

    #[inline]
    fn campione(&mut self, dt: f32) -> f32 {
        let b = self.caso.bianco();
        let mut y = self.lp.elabora(self.hp.elabora(b, 0), 0);
        // il fruscio respira piano, e ogni tanto scoppietta
        y *= 0.7 + 0.3 * self.onda.campione(dt, &mut self.caso);
        if self.caso.f() < 0.0004 {
            y += self.caso.bianco() * 3.0;
        }
        y * self.g.passo() * self.buco.passo() * NORM_NASTRO
    }
}

/// Livelli a cui un «0 dB» di ogni strato vale circa −30 dBFS di valore efficace.
const NORM_NASTRO: f32 = 0.10;
const NORM_FIATO: f32 = 1.0;
const NORM_RE: f32 = 1.58;
const NORM_VENT: f32 = 1.0;
const NORM_BRUSIO: f32 = 1.0;

pub struct Intro {
    sr: f32,
    dt: f32,
    caso: Caso,
    attiva: bool,
    t: f32,
    cue: Vec<(f32, Cue)>,
    prossimo: usize,
    nastro: Nastro,
    fiato: Fiato,
    fiato_g: Scorrevole,
    re: Re,
    vent: Ventilazione,
    brusio: Brusio,
    brusio_g: Scorrevole,
    brusio_filtro: [Biquad; 2],
    colpi: Vec<Colpo>,
    sala: Riverbero,
    /// il volume di tutta l'intro (l'uscita, e l'avvio)
    master: Scorrevole,
}

impl Intro {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let mut sala = Riverbero::nuovo(sr);
        // il vuoto: una sala enorme e fredda per la guida del re
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
            fiato: Fiato::nuovo(sr, seme ^ 0xF1A7),
            fiato_g: Scorrevole::nuovo(0.0),
            re: Re::nuovo(sr, seme ^ 0x2E),
            vent: Ventilazione::nuova(sr, seme ^ 0x7E27),
            brusio: Brusio::nuovo(sr, seme ^ 0xB005),
            brusio_g: Scorrevole::nuovo(0.0),
            brusio_filtro: [Biquad::passabasso(3400.0, 0.7, sr), Biquad::passaalto(350.0, 0.7, sr)],
            colpi: Vec::with_capacity(MAX_COLPI),
            sala,
            master: Scorrevole::nuovo(0.0),
        }
    }

    pub fn attiva(&self) -> bool {
        self.attiva
    }

    /// L'intro comincia: la partitura si ricava dai momenti.
    pub fn avvia(&mut self, d: &DatiIntro) {
        self.cue = partitura(d);
        self.prossimo = 0;
        self.t = 0.0;
        self.attiva = true;
        self.colpi.clear();
        self.nastro.g.v = 0.0;
        self.nastro.g.verso(0.0, 0.0, self.sr);
        self.fiato.acceso = false;
        self.fiato_g.verso(0.0, 0.0, self.sr);
        self.re.g.verso(0.0, 0.0, self.sr);
        self.vent.g.verso(0.0, 0.0, self.sr);
        self.brusio_g.verso(0.0, 0.0, self.sr);
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
            Cue::Buco => {
                self.nastro.buco.verso(0.0, 0.03, sr);
                self.nastro.buco_fino = self.t + 0.25;
            }
            Cue::Fiato(aria, liv, s) => {
                self.fiato.aria = aria;
                if liv <= -100.0 {
                    self.fiato.acceso = false;
                } else {
                    self.fiato.acceso = true;
                }
                self.fiato_g.verso(lin(liv) * NORM_FIATO, s, sr);
            }
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
                self.master.verso(0.0, s.max(0.05), sr);
            }
            Cue::Tace(s) => {
                self.nastro.g.verso(0.0, s, sr);
                self.fiato_g.verso(0.0, s, sr);
                self.fiato.acceso = false;
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
        if self.nastro.buco_fino >= 0.0 && self.t >= self.nastro.buco_fino {
            self.nastro.buco.verso(1.0, 0.05, self.sr);
            self.nastro.buco_fino = -1.0;
        }
        // finito: la partitura è esaurita, il volume è a zero
        if self.prossimo >= self.cue.len() && self.master.v < 1e-4 && self.master.meta() == 0.0 {
            self.attiva = false;
        }
    }

    /// Un campione: (il sound design, la guida del re con la sua sala), stereo.
    #[inline]
    pub fn campione(&mut self) -> ((f32, f32), (f32, f32)) {
        if !self.attiva {
            return ((0.0, 0.0), (0.0, 0.0));
        }
        let g = self.master.passo();
        let dt = self.dt;
        let mut l = 0.0f32;
        let mut r = 0.0f32;
        // il fruscio della traccia, al centro
        let n = self.nastro.campione(dt);
        l += n;
        r += n;
        // il respiro, vicino e chiuso: al centro
        let fg = self.fiato_g.passo();
        if fg > 1e-6 || self.fiato.acceso {
            let f = self.fiato.campione() * fg;
            l += f;
            r += f;
        }
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
        // la guida del re, con la sala del vuoto
        let (rl, rr) = self.re.campione(dt as f64);
        let (wl, wr) = self.sala.elabora(rl, rr);
        (((l) * g, (r) * g), ((rl * 0.6 + wl) * g, (rr * 0.6 + wr) * g))
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
        // i momenti di scaletta.ts, quelli dell'intro com'è oggi
        let json = r#"{"momenti": {"fruscioA": 0.8, "spia": 2.2, "battito": [42.9, 45.9], "stella": [45.9, 48.4], "naveB": 48.4, "reB": 49.4,
            "radar": [60.0, 66.2], "fuoco": [66.2, 67.8], "stelleSpente": [67.8, 72.8], "faro": 72.8, "brusio": [74.85, 76.35],
            "scala": [80.0, 103.5], "scalaFerma": 103.0, "fruscioF": 101.5, "pulsa": [115.0, 120.0], "spiaSpenta": 124.0,
            "glifi": [130.0, 131.8], "traduzione": [131.8, 134.8], "raccordo": [138.0, 139.2], "arretra": [139.2, 142.4],
            "interfaccia": [142.4, 145.4], "partita": [145.4, 147.0]},
            "durata": 147.0, "buchi": [3.5, 14.5, 22.0, 30.0]}"#;
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
        assert!(tra(3.0, 40.0, &|c| matches!(c, Cue::Fiato(..))), "A: manca il respiro");
        assert_eq!(p.iter().filter(|(_, c)| *c == Cue::Buco).count(), 4, "i buchi della traccia");
        assert!(tra(42.0, 46.0, &|c| matches!(c, Cue::Cuore(..))), "A: manca il battito");
        assert!(tra(49.0, 50.0, &|c| matches!(c, Cue::Re(..))), "B: il re non entra a 49,4");
        assert!(!tra(46.0, 49.3, &|c| matches!(c, Cue::Nastro(l, _) if *l > -100.0) || matches!(c, Cue::Re(..))), "B: i due secondi di vuoto non sono vuoti");
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
    fn i_buchi_non_cadono_sulle_parole_e_il_nastro_li_fa() {
        // il quarto di secondo di buco porta il fruscio quasi a zero
        let mut i = Intro::nuovo(24000.0, 5);
        let d = momenti_di_prova();
        i.avvia(&d);
        let rms = |i: &mut Intro, da: f32, a: f32| {
            let mut e = 0.0f64;
            let mut n = 0;
            let mut t = i.t;
            while t < a {
                i.passo(128.0 / 24000.0);
                for _ in 0..128 {
                    let ((l, _), _) = i.campione();
                    if t >= da {
                        e += (l * l) as f64;
                        n += 1;
                    }
                }
                t += 128.0 / 24000.0;
            }
            10.0 * (e / n.max(1) as f64 + 1e-20).log10()
        };
        // prima del respiro (che comincia a 5 s) si sente solo il fruscio: lì cade il buco
        let fuori = rms(&mut i, 2.8, 3.4);
        let dentro = rms(&mut i, 3.55, 3.7);
        assert!(fuori > -60.0, "il fruscio non suona ({fuori:.1} dB)");
        assert!(dentro < fuori - 12.0, "il buco non c'è: {fuori:.1} → {dentro:.1} dB");
    }

    #[test]
    fn l_intro_suona_tace_dove_deve_e_finisce() {
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
                let ((l, r), (gl, gr)) = i.campione();
                assert!(l.is_finite() && r.is_finite() && gl.is_finite() && gr.is_finite(), "campione non finito a {t:.1} s");
                e += l * l + r * r + gl * gl + gr * gr;
            }
            sez.push((t, e / (blocco as f32 * 4.0)));
            t += blocco as f32 / 24000.0;
        }
        let db = |da: f32, a: f32| {
            let v: Vec<f32> = sez.iter().filter(|(t, _)| *t >= da && *t < a).map(|(_, e)| *e).collect();
            10.0 * (v.iter().sum::<f32>() / v.len().max(1) as f32 + 1e-20).log10()
        };
        assert!(db(3.0, 10.0) > -70.0, "A è muta ({:.1} dB)", db(3.0, 10.0));
        assert!(db(47.0, 48.9) < -75.0, "il vuoto prima del re non è vuoto ({:.1} dB)", db(47.0, 48.9));
        assert!(db(52.0, 58.0) > -80.0, "il re di B non si sente ({:.1} dB)", db(52.0, 58.0));
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
                let ((l, _), _) = i.campione();
                max = max.max(l.abs());
            }
        }
        i.ferma(0.5);
        let mut ultimo = 0.0f32;
        for _ in 0..(2.0 * 24000.0 / 128.0) as usize {
            i.passo(128.0 / 24000.0);
            for _ in 0..128 {
                let ((l, _), (g, _)) = i.campione();
                ultimo = l.abs() + g.abs();
            }
        }
        assert!(ultimo < 1e-3, "dopo lo stop suona ancora ({ultimo})");
        assert!(!i.attiva(), "dopo lo stop l'intro è ancora attiva");
        assert!(max < 1.5, "il picco prima dello stop è troppo alto ({max})");
    }
}
