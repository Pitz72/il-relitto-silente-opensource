//! I suoni di un colpo solo, tutti sintetizzati: partono (anche in ritardo), suonano,
//! finiscono. Quattro famiglie di modelli fisici:
//!
//! - **modale**: un eccitatore (un impulso, un soffio di rumore, un crepitio) che
//!   colpisce un banco di modi di vibrazione. Le lamiere, i relè, la pietra, il
//!   ghiaccio, i granelli.
//! - **tonfo**: una sinusoide che cade di altezza e si spegne in fretta, con un
//!   soffio sordo davanti. I colpi che si sentono nelle ossa: stivali, spinte, arpioni.
//! - **bolla**: il modello di van den Doel, una sinusoide che sale e si spegne. Le
//!   gocce.
//! - **attrito**: scivolamenti a scatti (stick-slip) che fanno suonare i modi di una
//!   struttura grande. Il gemito della nave, gli scafi che si strofinano, i cigolii.
//!
//! Niente memoria allocata nel thread dell’audio: ogni colpo è un valore di
//! dimensione fissa.

use std::f32::consts::{PI, TAU};

use super::dsp::{campana, campioni, db, pan, Caso, Lento, Modo, Svf, UnPolo};

/// La strada di un suono (bibbia sonora, §1.1). L’altoparlante è la radio di bordo;
/// «Em» è la cuffia sola (il brusio, che non passa dall’aria).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Bus {
    Esterno,
    Em,
    Casco,
    Ossa,
    Altoparlante,
}

const MODI: usize = 16;
const IMPULSI: usize = 12;

/// Che cosa colpisce i modi.
#[derive(Clone, Copy, Default)]
pub struct Eccitatore {
    /// impulsi programmati: (campione, ampiezza)
    impulsi: [(u32, f32); IMPULSI],
    n: usize,
    k: usize,
    /// un soffio di rumore all’inizio: durata in campioni, ampiezza, filtro a un polo
    soffio: u32,
    soffio_g: f32,
    soffio_lp: f32,
    soffio_a: f32,
    /// un crepitio: la probabilità di un granello per campione, e quanto cala
    crepitio: f32,
    crepitio_cala: f32,
    t: u32,
}

impl Eccitatore {
    pub fn impulso(g: f32) -> Self {
        let mut e = Eccitatore::default();
        e.aggiungi(0, g);
        e
    }

    pub fn aggiungi(&mut self, campione: u32, g: f32) {
        if self.n < IMPULSI {
            self.impulsi[self.n] = (campione, g);
            self.n += 1;
        }
    }

    pub fn con_soffio(mut self, secondi: f32, g: f32, taglio: f32, sr: f32) -> Self {
        self.soffio = campioni(secondi, sr).max(1);
        self.soffio_g = g;
        self.soffio_a = (-TAU * taglio / sr).exp();
        self
    }

    pub fn con_crepitio(mut self, densita_al_secondo: f32, dura: f32, sr: f32) -> Self {
        self.crepitio = densita_al_secondo / sr;
        // dopo `dura` secondi la densità è scesa a un millesimo
        self.crepitio_cala = (-6.907_755 / (dura.max(0.005) * sr)).exp();
        self
    }

    #[inline]
    fn campione(&mut self, caso: &mut Caso) -> f32 {
        let mut x = 0.0;
        while self.k < self.n && self.impulsi[self.k].0 <= self.t {
            x += self.impulsi[self.k].1;
            self.k += 1;
        }
        if self.t < self.soffio {
            let resta = 1.0 - self.t as f32 / self.soffio as f32;
            self.soffio_lp = (1.0 - self.soffio_a) * caso.bianco() + self.soffio_a * self.soffio_lp;
            x += self.soffio_lp * self.soffio_g * resta * resta;
        }
        if self.crepitio > 1e-7 {
            if caso.f() < self.crepitio {
                x += caso.bianco();
            }
            self.crepitio *= self.crepitio_cala;
        }
        self.t += 1;
        x
    }

    fn finito(&self) -> bool {
        self.k >= self.n && self.t >= self.soffio && self.crepitio <= 1e-7
    }
}

/// Un banco di modi colpito da un eccitatore.
#[derive(Clone, Copy)]
pub struct Modale {
    modi: [Modo; MODI],
    n: usize,
    ecc: Eccitatore,
    lp: UnPolo,
    conto: u32,
}

impl Modale {
    /// `modi`: (frequenza, t60, ampiezza). `taglio`: un passa-basso sull’uscita.
    pub fn nuovo(modi: &[(f32, f32, f32)], ecc: Eccitatore, taglio: f32, sr: f32) -> Self {
        let mut m = [Modo::default(); MODI];
        let n = modi.len().min(MODI);
        for (i, (f, t, a)) in modi.iter().take(n).enumerate() {
            m[i] = Modo::nuovo(*f, *t, *a, sr);
        }
        Modale { modi: m, n, ecc, lp: UnPolo::nuovo(taglio, sr), conto: 0 }
    }

    #[inline]
    fn campione(&mut self, caso: &mut Caso) -> Option<f32> {
        let x = self.ecc.campione(caso);
        let mut y = 0.0;
        for m in self.modi[..self.n].iter_mut() {
            y += m.elabora(x);
        }
        self.conto = self.conto.wrapping_add(1);
        if self.conto.is_multiple_of(256) && self.ecc.finito() {
            let e: f32 = self.modi[..self.n].iter().map(|m| m.energia()).sum();
            if e < 2e-5 {
                return None;
            }
        }
        Some(self.lp.elabora(y, 0))
    }
}

/// Un tonfo: una sinusoide che scende da `f0` verso `f1` e si spegne, con un soffio
/// sordo davanti.
#[derive(Clone, Copy)]
pub struct Tonfo {
    fase: f32,
    f: f32,
    f1: f32,
    kf: f32,
    a: f32,
    ka: f32,
    attacco: f32,
    t: u32,
    soffio: u32,
    soffio_g: f32,
    filtro: Svf,
    sr: f32,
}

impl Tonfo {
    /// `cala`: il tempo (s) in cui l’altezza fa il 63% del cammino; `spegne`: il t60.
    #[allow(clippy::too_many_arguments)]
    pub fn nuovo(f0: f32, f1: f32, cala: f32, spegne: f32, g: f32, soffio: f32, soffio_g: f32, soffio_f: f32, sr: f32) -> Self {
        Tonfo {
            fase: 0.0,
            f: f0,
            f1,
            kf: (-1.0 / (cala.max(0.001) * sr)).exp(),
            a: g,
            ka: (-6.907_755 / (spegne.max(0.01) * sr)).exp(),
            attacco: 0.002 * sr,
            t: 0,
            soffio: campioni(soffio, sr),
            soffio_g,
            filtro: Svf::nuovo(soffio_f, 0.7, sr),
            sr,
        }
    }

    #[inline]
    fn campione(&mut self, caso: &mut Caso) -> Option<f32> {
        if self.a < 1e-5 && self.t >= self.soffio {
            return None;
        }
        self.f = self.f1 + (self.f - self.f1) * self.kf;
        self.fase += TAU * self.f / self.sr;
        if self.fase > TAU {
            self.fase -= TAU;
        }
        let att = (self.t as f32 / self.attacco).min(1.0);
        let mut y = self.fase.sin() * self.a * att;
        self.a *= self.ka;
        if self.t < self.soffio {
            let resta = 1.0 - self.t as f32 / self.soffio as f32;
            y += self.filtro.basso(caso.bianco()) * self.soffio_g * resta * resta;
        }
        self.t += 1;
        Some(y)
    }
}

/// Una bolla che risuona (van den Doel): la goccia che cade nell’acqua. Davanti, lo
/// schiocco dell’impatto.
#[derive(Clone, Copy)]
pub struct Bolla {
    fase: f32,
    f0: f32,
    sigma: f32,
    kd: f32,
    a: f32,
    t: f32,
    dt: f32,
    schiocco: u32,
    schiocco_g: f32,
    passaalto: Svf,
    n: u32,
}

impl Bolla {
    /// `raggio` in metri (1–4 mm per le gocce).
    pub fn nuova(raggio: f32, g: f32, schiocco_g: f32, sr: f32) -> Self {
        let r = raggio.clamp(0.0005, 0.01);
        let f0 = 3.0 / r;
        let d = 0.13 / r + 0.0072 * r.powf(-1.5);
        Bolla {
            fase: 0.0,
            f0,
            sigma: 0.1 * d,
            kd: (-d / sr).exp(),
            a: g,
            t: 0.0,
            dt: 1.0 / sr,
            schiocco: campioni(0.0012, sr),
            schiocco_g,
            passaalto: Svf::nuovo(2500.0, 0.7, sr),
            n: 0,
        }
    }

    #[inline]
    pub fn campione(&mut self, caso: &mut Caso) -> Option<f32> {
        if self.a < 1e-5 && self.n >= self.schiocco {
            return None;
        }
        let f = self.f0 * (1.0 + self.sigma * self.t);
        self.fase += TAU * f * self.dt;
        if self.fase > TAU {
            self.fase -= TAU;
        }
        // la bolla nasce un istante dopo l’impatto
        let nasce = (self.t / 0.0008).min(1.0);
        let mut y = self.fase.sin() * self.a * nasce;
        self.a *= self.kd;
        if self.n < self.schiocco {
            let resta = 1.0 - self.n as f32 / self.schiocco as f32;
            y += self.passaalto.alto(caso.bianco()) * self.schiocco_g * resta;
        }
        self.n += 1;
        self.t += self.dt;
        Some(y)
    }
}

/// Lo scivolamento a scatti di due superfici che si premono: ogni scatto fa suonare
/// i modi della struttura. Il ritmo degli scatti, che deriva, è il lamento.
#[derive(Clone, Copy)]
pub struct Attrito {
    modi: [Modo; MODI],
    n: usize,
    t: f32,
    durata: f32,
    cima: f32,
    dt: f32,
    tasso: f32,
    escursione: f32,
    deriva: Lento,
    fase: f32,
    irregolare: f32,
    rumore_g: f32,
    rombo: Svf,
    rombo_g: f32,
    lp: UnPolo,
    conto: u32,
    k_scatti: f32,
    k_rumore: f32,
}

impl Attrito {
    #[allow(clippy::too_many_arguments)]
    pub fn nuovo(
        modi: &[(f32, f32, f32)],
        durata: f32,
        cima: f32,
        tasso: f32,
        escursione: f32,
        deriva: (f32, f32),
        irregolare: f32,
        rumore_g: f32,
        rombo_g: f32,
        taglio: f32,
        caso: &mut Caso,
        sr: f32,
    ) -> Self {
        let mut m = [Modo::default(); MODI];
        let n = modi.len().min(MODI);
        for (i, (f, t, a)) in modi.iter().take(n).enumerate() {
            m[i] = Modo::nuovo(*f, *t, *a, sr);
        }
        // i modi lunghi accumulano: gli scatti fitti e il rumore continuo si
        // normalizzano sul tempo medio dei modi, così il volume resta quello chiesto
        let t60 = modi.iter().take(n).map(|m| m.1).sum::<f32>() / n.max(1) as f32;
        let k_scatti = 1.0 / (1.0 + tasso * t60 / 6.9).sqrt();
        let k_rumore = (13.8 / (t60 * sr)).sqrt() * 3f32.sqrt();
        Attrito {
            modi: m,
            n,
            t: 0.0,
            durata,
            cima,
            dt: 1.0 / sr,
            tasso,
            escursione,
            deriva: Lento::nuovo(deriva, caso),
            fase: caso.f(),
            irregolare,
            rumore_g,
            rombo: Svf::nuovo(70.0, 0.7, sr),
            rombo_g,
            lp: UnPolo::nuovo(taglio, sr),
            conto: 0,
            k_scatti,
            k_rumore,
        }
    }

    #[inline]
    fn campione(&mut self, caso: &mut Caso) -> Option<f32> {
        let x = self.t / self.durata;
        let mut ecc = 0.0;
        let mut inv = 0.0;
        if x < 1.0 {
            inv = campana(x, self.cima).powf(1.2);
            let r = self.tasso * (1.0 + self.escursione * self.deriva.campione(self.dt, caso)) * (0.55 + 0.45 * inv);
            self.fase += r * self.dt * (1.0 + self.irregolare * caso.bianco());
            if self.fase >= 1.0 {
                self.fase -= 1.0;
                ecc = inv * (0.65 + 0.35 * caso.f()) * self.k_scatti;
            }
            ecc += caso.bianco() * self.rumore_g * self.k_rumore * inv;
        } else {
            self.conto = self.conto.wrapping_add(1);
            if self.conto.is_multiple_of(256) {
                let e: f32 = self.modi[..self.n].iter().map(|m| m.energia()).sum();
                if e < 2e-5 {
                    return None;
                }
            }
        }
        let mut y = 0.0;
        for m in self.modi[..self.n].iter_mut() {
            y += m.elabora(ecc);
        }
        y += self.rombo.basso(caso.bianco()) * self.rombo_g * inv;
        self.t += self.dt;
        Some(self.lp.elabora(y, 0))
    }
}

/// Una nota del visore: una sinusoide morbida con un filo di seconda armonica.
#[derive(Clone, Copy)]
pub struct Nota {
    f: f32,
    durata: f32,
    t: f32,
    dt: f32,
    g: f32,
}

impl Nota {
    #[inline]
    fn campione(&mut self) -> Option<f32> {
        if self.t >= self.durata {
            return None;
        }
        let x = self.t / self.durata;
        let inv = (self.t / 0.006).min(1.0) * (1.0 - x) * (-3.0 * x).exp();
        let s = (TAU * self.f * self.t).sin() + 0.12 * (2.0 * TAU * self.f * self.t).sin();
        self.t += self.dt;
        Some(s * inv * self.g)
    }
}

#[derive(Clone, Copy)]
pub enum Corpo {
    Modale(Modale),
    Tonfo(Tonfo),
    Bolla(Bolla),
    Attrito(Attrito),
    Nota(Nota),
}

/// Un suono di un colpo solo, con la sua strada, il suo posto e il suo ritardo.
#[derive(Clone, Copy)]
pub struct Colpo {
    pub bus: Bus,
    gl: f32,
    gr: f32,
    ritardo: u32,
    corpo: Corpo,
}

impl Colpo {
    pub fn nuovo(corpo: Corpo, bus: Bus, guadagno_db: f32, p: f32, ritardo: f32, sr: f32) -> Self {
        let (pl, pr) = pan(p);
        let g = db(guadagno_db) * std::f32::consts::SQRT_2;
        Colpo { bus, gl: g * pl, gr: g * pr, ritardo: campioni(ritardo, sr), corpo }
    }

    /// `None` quando è finito.
    #[inline]
    pub fn campione(&mut self, caso: &mut Caso) -> Option<(f32, f32)> {
        if self.ritardo > 0 {
            self.ritardo -= 1;
            return Some((0.0, 0.0));
        }
        let y = match &mut self.corpo {
            Corpo::Modale(m) => m.campione(caso),
            Corpo::Tonfo(t) => t.campione(caso),
            Corpo::Bolla(b) => b.campione(caso),
            Corpo::Attrito(a) => a.campione(caso),
            Corpo::Nota(n) => n.campione(),
        }?;
        Some((y * self.gl, y * self.gr))
    }
}

// -------------------------------------------------------------------------------------
//  I materiali: i modi di una lamiera, di un relè, di una pietra
// -------------------------------------------------------------------------------------

/// I modi di una lastra appoggiata: f(m,n) ∝ m² + ρ²·n², con ρ il rapporto dei lati.
/// Il punto dove la si colpisce decide quanto suona ogni modo.
#[derive(Clone, Copy)]
pub struct Lastra {
    base: f32,
    rho: f32,
    t60: f32,
    smorza: f32,
}

impl Lastra {
    pub fn a_caso(base: (f32, f32), t60: (f32, f32), caso: &mut Caso) -> Self {
        Lastra { base: caso.tra(base.0, base.1), rho: caso.tra(0.55, 0.95), t60: caso.tra(t60.0, t60.1), smorza: caso.tra(0.5, 0.8) }
    }

    /// I modi per un colpo nel punto (x, y) della lastra (fra 0 e 1).
    pub fn modi(&self, x: f32, y: f32, quanti: usize) -> ([(f32, f32, f32); MODI], usize) {
        let mut tutti: [(f32, f32, f32); MODI] = [(0.0, 0.0, 0.0); MODI];
        let mut k = 0;
        let norma = 1.0 + self.rho * self.rho;
        for m in 1..=4 {
            for n in 1..=4 {
                let f = self.base * (m * m) as f32 / norma + self.base * self.rho * self.rho * (n * n) as f32 / norma;
                let a = (m as f32 * PI * x).sin() * (n as f32 * PI * y).sin() / ((m * n) as f32).sqrt();
                let t = self.t60 * (self.base / f).powf(self.smorza);
                tutti[k] = (f, t, a);
                k += 1;
            }
        }
        tutti.sort_by(|a, b| a.0.total_cmp(&b.0));
        let n = quanti.min(MODI);
        (tutti, n)
    }
}

// -------------------------------------------------------------------------------------
//  I colpi del gioco
// -------------------------------------------------------------------------------------

/// Una lamiera che si dilata: «tic», con la sua coda di metallo.
pub fn lamiera(lastra: &Lastra, caso: &mut Caso, sr: f32) -> Corpo {
    let (modi, n) = lastra.modi(caso.tra(0.1, 0.9), caso.tra(0.1, 0.9), 12);
    let mut e = Eccitatore::impulso(1.0).con_soffio(0.0006, 0.5, 6000.0, sr);
    // a volte la lamiera scatta due volte
    if caso.una_su(4) {
        e.aggiungi(campioni(caso.tra(0.05, 0.25), sr), caso.tra(0.3, 0.7));
    }
    Corpo::Modale(Modale::nuovo(&modi[..n], e, 9000.0, sr))
}

/// Lo scatto di un relè: l’ancora che batte sul nucleo e rimbalza due volte. Quando si
/// apre, un colpo solo e più debole.
pub fn rele(chiude: bool, caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.94, 1.06);
    let modi = [
        (2300.0 * s, 0.025, 1.0),
        (3700.0 * s, 0.018, 0.7),
        (5200.0 * s, 0.012, 0.5),
        (8100.0 * s, 0.008, 0.3),
        (640.0 * s, 0.03, 0.6),
        (1450.0 * s, 0.02, 0.4),
    ];
    let mut e = Eccitatore::impulso(if chiude { 1.0 } else { 0.55 });
    if chiude {
        e.aggiungi(campioni(caso.tra(0.0013, 0.0019), sr), caso.tra(0.35, 0.5));
        e.aggiungi(campioni(caso.tra(0.0028, 0.0036), sr), caso.tra(0.12, 0.22));
    } else {
        e.aggiungi(campioni(caso.tra(0.0007, 0.0011), sr), 0.25);
    }
    Corpo::Modale(Modale::nuovo(&modi, e, 10000.0, sr))
}

/// Un magnete dello stivale che si attacca (un colpo sordo al ginocchio) o si stacca
/// (uno strappo).
pub fn stivale(appoggio: bool, caso: &mut Caso, sr: f32) -> Corpo {
    if appoggio {
        Corpo::Tonfo(Tonfo::nuovo(caso.tra(90.0, 105.0), 46.0, 0.05, 0.22, 1.0, 0.014, 0.6, 700.0, sr))
    } else {
        Corpo::Tonfo(Tonfo::nuovo(caso.tra(68.0, 78.0), 44.0, 0.04, 0.15, 0.4, 0.035, 0.7, 450.0, sr))
    }
}

/// Una spinta corta dei propulsori, sentita da dentro: un colpo sordo nella struttura.
pub fn spinta(caso: &mut Caso, sr: f32) -> Corpo {
    Corpo::Tonfo(Tonfo::nuovo(caso.tra(52.0, 60.0), 34.0, 0.09, 0.45, 1.0, 0.18, 0.5, 260.0, sr))
}

/// Il colpo di un arpione nello scafo: più pesante, con il metallo che risponde.
pub fn arpione(caso: &mut Caso, sr: f32) -> Corpo {
    let modi = [
        (58.0, 0.7, 1.0),
        (83.0, 0.6, 0.7),
        (121.0, 0.5, 0.55),
        (167.0, 0.45, 0.4),
        (236.0, 0.35, 0.3),
        (331.0, 0.3, 0.22),
        (452.0, 0.25, 0.15),
        (618.0, 0.2, 0.1),
    ];
    let mut modi = modi;
    for m in modi.iter_mut() {
        m.0 *= caso.tra(0.95, 1.05);
        m.2 *= 0.12;
    }
    let e = Eccitatore::impulso(1.0).con_soffio(0.02, 0.8, 400.0, sr);
    Corpo::Modale(Modale::nuovo(&modi, e, 1200.0, sr))
}

/// Il lungo strofinio di due scafi che si toccano: «un urto lungo che fa tremare la
/// plancia».
pub fn urto_lungo(caso: &mut Caso, sr: f32) -> Corpo {
    let modi = [
        (47.0, 0.9, 1.0),
        (69.0, 0.8, 0.8),
        (97.0, 0.7, 0.7),
        (139.0, 0.6, 0.55),
        (188.0, 0.5, 0.45),
        (262.0, 0.4, 0.35),
        (351.0, 0.35, 0.25),
        (497.0, 0.3, 0.18),
        (690.0, 0.25, 0.12),
        (941.0, 0.2, 0.08),
    ];
    Corpo::Attrito(Attrito::nuovo(&modi, caso.tra(3.2, 4.0), 0.3, caso.tra(55.0, 75.0), 0.45, (0.3, 0.9), 0.7, 0.35, 0.6, 1800.0, caso, sr))
}

/// «Qualcosa si assesta, con un gemito lungo e basso»: una struttura enorme che
/// scivola su se stessa, a scatti lenti.
pub fn gemito(caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.85, 1.15);
    let modi = [
        (41.0 * s, 1.4, 1.0),
        (58.0 * s, 1.2, 0.85),
        (83.0 * s, 1.0, 0.75),
        (112.0 * s, 0.9, 0.6),
        (151.0 * s, 0.8, 0.5),
        (197.0 * s, 0.7, 0.4),
        (263.0 * s, 0.6, 0.3),
        (341.0 * s, 0.5, 0.22),
        (437.0 * s, 0.4, 0.15),
    ];
    Corpo::Attrito(Attrito::nuovo(&modi, caso.tra(3.5, 6.0), caso.tra(0.35, 0.6), caso.tra(16.0, 28.0), 0.4, (0.7, 1.8), 0.25, 0.04, 0.5, 900.0, caso, sr))
}

/// Un cigolio della nave che si assesta: corto, di metallo.
pub fn cigolio(caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.8, 1.25);
    let modi = [
        (173.0 * s, 0.3, 1.0),
        (291.0 * s, 0.25, 0.7),
        (418.0 * s, 0.2, 0.5),
        (622.0 * s, 0.15, 0.35),
        (877.0 * s, 0.12, 0.25),
        (1240.0 * s, 0.08, 0.15),
    ];
    Corpo::Attrito(Attrito::nuovo(&modi, caso.tra(0.5, 1.4), caso.tra(0.3, 0.6), caso.tra(35.0, 70.0), 0.3, (0.2, 0.5), 0.3, 0.02, 0.0, 3000.0, caso, sr))
}

/// Una goccia nell’acqua, lontana.
pub fn goccia(caso: &mut Caso, sr: f32) -> Corpo {
    // non tutte le gocce intrappolano una bolla: alcune fanno solo «tic»
    let raggio = caso.tra(0.0016, 0.0042);
    let bolla = if caso.una_su(5) { 0.0 } else { 1.0 };
    Corpo::Bolla(Bolla::nuova(raggio, bolla, caso.tra(0.15, 0.35), sr))
}

/// Un granello che cade e rimbalza: pietra o qualcosa di simile, piccola.
pub fn granello(caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.8, 1.3);
    let modi = [
        (1180.0 * s, 0.05, 1.0),
        (1910.0 * s, 0.04, 0.7),
        (2730.0 * s, 0.03, 0.5),
        (3850.0 * s, 0.02, 0.35),
        (5200.0 * s, 0.015, 0.2),
    ];
    let mut e = Eccitatore::default();
    // i rimbalzi: sempre più vicini e più deboli, come una pallina che si ferma
    let mut t = 0.0;
    let mut g = 1.0;
    let mut passo = caso.tra(0.09, 0.16);
    for _ in 0..(4 + caso.indice(7)) {
        e.aggiungi(campioni(t, sr), g * caso.tra(0.7, 1.0));
        t += passo;
        passo *= caso.tra(0.6, 0.8);
        g *= caso.tra(0.55, 0.75);
    }
    Corpo::Modale(Modale::nuovo(&modi, e, 7000.0, sr))
}

/// Una crepa: il ghiaccio, la brina, qualcosa che si rompe piano. Un crepitio breve.
pub fn crepa(caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.7, 1.3);
    let modi = [
        (1650.0 * s, 0.05, 0.8),
        (2420.0 * s, 0.04, 1.0),
        (3310.0 * s, 0.03, 0.7),
        (4580.0 * s, 0.02, 0.5),
        (6020.0 * s, 0.015, 0.3),
        (980.0 * s, 0.06, 0.4),
    ];
    let e = Eccitatore::impulso(0.8).con_crepitio(caso.tra(150.0, 450.0), caso.tra(0.08, 0.35), sr);
    Corpo::Modale(Modale::nuovo(&modi, e, 8000.0, sr))
}

/// Un tic del visore: «un tic morbido, quasi un clic»; mai un bip.
pub fn tic(chiaro: f32, sr: f32) -> Corpo {
    let f = 2200.0 + chiaro;
    let modi = [(f, 0.005, 1.0), (f * 1.83, 0.003, 0.4)];
    Corpo::Modale(Modale::nuovo(&modi, Eccitatore::impulso(1.0), 7000.0, sr))
}

/// Una nota del visore, sottovoce.
pub fn nota(f: f32, durata: f32, sr: f32) -> Corpo {
    Corpo::Nota(Nota { f, durata, t: 0.0, dt: 1.0 / sr, g: 1.0 })
}

#[cfg(test)]
mod prove {
    use super::*;

    /// Ogni colpo deve finire, e restare dentro i limiti.
    #[test]
    fn ogni_colpo_finisce() {
        let sr = 48000.0;
        let mut caso = Caso::nuovo(11);
        let lastra = Lastra::a_caso((300.0, 900.0), (0.2, 0.6), &mut caso);
        let corpi = [
            lamiera(&lastra, &mut caso, sr),
            rele(true, &mut caso, sr),
            rele(false, &mut caso, sr),
            stivale(true, &mut caso, sr),
            stivale(false, &mut caso, sr),
            spinta(&mut caso, sr),
            arpione(&mut caso, sr),
            urto_lungo(&mut caso, sr),
            gemito(&mut caso, sr),
            cigolio(&mut caso, sr),
            goccia(&mut caso, sr),
            granello(&mut caso, sr),
            crepa(&mut caso, sr),
            tic(0.0, sr),
            nota(880.0, 0.12, sr),
        ];
        for (k, c) in corpi.into_iter().enumerate() {
            let mut colpo = Colpo::nuovo(c, Bus::Esterno, 0.0, 0.0, 0.0, sr);
            let mut n = 0;
            let mut massimo = 0.0f32;
            while let Some((l, r)) = colpo.campione(&mut caso) {
                massimo = massimo.max(l.abs()).max(r.abs());
                assert!(l.is_finite() && r.is_finite(), "colpo {k}: non finito");
                n += 1;
                assert!(n < 20 * 48000, "colpo {k}: non finisce");
            }
            assert!(massimo > 1e-3, "colpo {k}: muto");
            assert!(massimo < 40.0, "colpo {k}: troppo forte ({massimo})");
        }
    }
}
