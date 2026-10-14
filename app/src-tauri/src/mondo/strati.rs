//! Gli strati semplici: i letti ad anello, le voci di un colpo solo, la pioggia di
//! eventi casuali, i segnali sintetici del visore.

use std::f32::consts::TAU;
use std::sync::Arc;

use super::campioni::Campione;
use super::dsp::{db, pan, Biquad, Caso, Scorrevole};

/// La strada di un suono (bibbia sonora, §1.1). L’altoparlante è la radio di bordo.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Bus {
    Esterno,
    Em,
    Casco,
    Ossa,
    Altoparlante,
}

/// Un letto: un anello lungo che gira senza fine, con il suo volume che scorre.
pub struct Letto {
    c: Arc<Campione>,
    pos: f64,
    passo: f64,
    pub g: Scorrevole,
}

impl Letto {
    pub fn nuovo(c: Arc<Campione>, sr: f32, caso: &mut Caso) -> Self {
        let pos = caso.f() as f64 * c.frame() as f64;
        let passo = c.sr as f64 / sr as f64;
        Letto { c, pos, passo, g: Scorrevole::nuovo(0.0) }
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let g = self.g.passo();
        let n = self.c.frame() as f64;
        let (l, r) = if g > 1e-5 { self.c.leggi_anello(self.pos) } else { (0.0, 0.0) };
        self.pos += self.passo;
        if self.pos >= n {
            self.pos -= n;
        }
        (l * g, r * g)
    }
}

/// Un suono di un colpo solo: parte (anche in ritardo), suona, finisce.
pub struct Voce {
    c: Arc<Campione>,
    pos: f64,
    passo: f64,
    gl: f32,
    gr: f32,
    pub bus: Bus,
    ritardo: u32,
    filtro: Option<(Biquad, Biquad)>,
}

impl Voce {
    /// `velocita` 1 = altezza originale; `pan` da −1 a 1; `ritardo` in secondi.
    pub fn nuova(c: Arc<Campione>, sr: f32, velocita: f32, guadagno_db: f32, p: f32, bus: Bus, ritardo: f32) -> Self {
        let (pl, pr) = pan(p);
        let g = db(guadagno_db) * std::f32::consts::SQRT_2;
        Voce {
            passo: c.sr as f64 / sr as f64 * velocita as f64,
            c,
            pos: 0.0,
            gl: g * pl,
            gr: g * pr,
            bus,
            ritardo: (ritardo.max(0.0) * sr) as u32,
            filtro: None,
        }
    }

    /// Un passa-alto e un passa-basso sul colpo (0 = nessuno).
    pub fn con_filtro(mut self, passaalto: f32, passabasso: f32, sr: f32) -> Self {
        let hp = if passaalto > 0.0 { Biquad::passaalto(passaalto, 0.7, sr) } else { Biquad::picco(1000.0, 1.0, 0.0, sr) };
        let lp = if passabasso > 0.0 { Biquad::passabasso(passabasso, 0.7, sr) } else { Biquad::picco(1000.0, 1.0, 0.0, sr) };
        self.filtro = Some((hp, lp));
        self
    }

    /// `None` quando è finita.
    #[inline]
    pub fn campione(&mut self) -> Option<(f32, f32)> {
        if self.ritardo > 0 {
            self.ritardo -= 1;
            return Some((0.0, 0.0));
        }
        if self.pos >= (self.c.frame().saturating_sub(1)) as f64 {
            return None;
        }
        let (mut l, mut r) = self.c.leggi(self.pos);
        self.pos += self.passo;
        if let Some((hp, lp)) = &mut self.filtro {
            l = lp.elabora(hp.elabora(l, 0), 0);
            r = lp.elabora(hp.elabora(r, 1), 1);
        }
        Some((l * self.gl, r * self.gr))
    }
}

/// Una pioggia di eventi: a intervalli casuali, un campione a caso dal suo gruppo.
pub struct Pioggia {
    pub banca: Vec<Arc<Campione>>,
    pub bus: Bus,
    /// secondi fra un evento e l’altro
    pub intervallo: (f32, f32),
    pub guadagno: (f32, f32),
    pub pan: (f32, f32),
    pub velocita: (f32, f32),
    /// passa-alto e passa-basso (0 = nessuno)
    pub filtro: (f32, f32),
    pub attiva: bool,
    prossimo: f32,
    ultimo: usize,
}

impl Pioggia {
    pub fn nuova(banca: Vec<Arc<Campione>>, bus: Bus, intervallo: (f32, f32), guadagno: (f32, f32)) -> Self {
        Pioggia {
            banca,
            bus,
            intervallo,
            guadagno,
            pan: (-0.8, 0.8),
            velocita: (0.97, 1.03),
            filtro: (0.0, 0.0),
            attiva: false,
            prossimo: 0.0,
            ultimo: 0,
        }
    }

    pub fn accendi(&mut self, si: bool, caso: &mut Caso) {
        if si && !self.attiva {
            self.prossimo = caso.tra(self.intervallo.0 * 0.3, self.intervallo.1);
        }
        self.attiva = si;
    }

    /// Un campione a caso, diverso dall’ultimo.
    pub fn voce(&mut self, sr: f32, caso: &mut Caso) -> Option<Voce> {
        if self.banca.is_empty() {
            return None;
        }
        self.ultimo = caso.indice_nuovo(self.banca.len(), self.ultimo);
        let v = Voce::nuova(
            self.banca[self.ultimo].clone(),
            sr,
            caso.tra(self.velocita.0, self.velocita.1),
            caso.tra(self.guadagno.0, self.guadagno.1),
            caso.tra(self.pan.0, self.pan.1),
            self.bus,
            0.0,
        );
        Some(if self.filtro != (0.0, 0.0) { v.con_filtro(self.filtro.0, self.filtro.1, sr) } else { v })
    }

    /// Da chiamare a ogni blocco: se è il momento, aggiunge un evento.
    pub fn passo(&mut self, dt: f32, sr: f32, caso: &mut Caso, voci: &mut Vec<Voce>) {
        if !self.attiva {
            return;
        }
        self.prossimo -= dt;
        if self.prossimo <= 0.0 {
            if let Some(v) = self.voce(sr, caso) {
                voci.push(v);
            }
            self.prossimo = caso.tra(self.intervallo.0, self.intervallo.1);
        }
    }
}

/// Un segnale sintetico breve: i tic e le note del visore, gli scatti dei relè.
pub struct Blip {
    f: f32,
    f2: f32,
    durata: f32,
    t: f32,
    g: f32,
    ritardo: f32,
    pub bus: Bus,
}

impl Blip {
    pub fn nuovo(f: f32, durata: f32, guadagno_db: f32, ritardo: f32, bus: Bus) -> Self {
        Blip { f, f2: 0.0, durata, t: 0.0, g: db(guadagno_db), ritardo, bus }
    }

    /// Lo scatto di un relè: due parziali inarmoniche che si spengono in fretta.
    pub fn rele(guadagno_db: f32, ritardo: f32, bus: Bus) -> Self {
        Blip { f: 3150.0, f2: 1170.0, durata: 0.012, t: 0.0, g: db(guadagno_db), ritardo, bus }
    }

    #[inline]
    pub fn campione(&mut self, dt: f32) -> Option<f32> {
        if self.ritardo > 0.0 {
            self.ritardo -= dt;
            return Some(0.0);
        }
        if self.t >= self.durata {
            return None;
        }
        let x = self.t / self.durata;
        // un attacco di due millisecondi, poi una discesa esponenziale
        let inv = (self.t / 0.002).min(1.0) * (-5.0 * x).exp() * (1.0 - x);
        let s = (TAU * self.f * self.t).sin() + if self.f2 > 0.0 { 0.7 * (TAU * self.f2 * self.t).sin() } else { 0.0 };
        self.t += dt;
        Some(s * inv * self.g)
    }
}
