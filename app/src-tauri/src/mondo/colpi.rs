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

use super::dsp::{campana, campioni, db, pan, Caso, Lento, Modo, Rosa, Svf, UnPolo};
use super::stanze::Superficie;

/// La strada di un suono (bibbia sonora, §1.1). L’altoparlante è la radio di bordo;
/// «Em» è la cuffia sola (il brusio, che non passa dall’aria); l’interfaccia è il tocco
/// sui pulsanti, asciutto e vicino, fuori dalla stanza e dalla pausa (§5.8).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Bus {
    Esterno,
    Em,
    Casco,
    Ossa,
    Altoparlante,
    Interfaccia,
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

/// Il filtro di un fruscio.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Filtro {
    Banda,
    Basso,
    Alto,
}

/// Un fruscio modellato: rumore che passa per un filtro che si sposta, con il suo
/// inviluppo. Le pagine, il tessuto, le cerniere, i sibili dell’aria, il boccaporto
/// che si svuota, la polvere, la fiamma, la taglierina, la sintonia.
#[derive(Clone, Copy)]
pub struct Fruscio {
    t: f32,
    durata: f32,
    cima: f32,
    curva: f32,
    fc0: f32,
    fc1: f32,
    andata_e_ritorno: bool,
    q: f32,
    tipo: Filtro,
    filtro: Svf,
    rosa: Rosa,
    usa_rosa: bool,
    am: (f32, f32),
    fase_am: f32,
    ruvido: f32,
    lento: UnPolo,
    conto: u32,
    sr: f32,
    dt: f32,
    g: f32,
}

impl Fruscio {
    /// `fc`: la banda all’inizio e alla fine (Hz); `cima`: dove sta il massimo (0–1).
    pub fn nuovo(durata: f32, cima: f32, fc: (f32, f32), q: f32, tipo: Filtro, sr: f32) -> Self {
        let mut filtro = Svf::default();
        filtro.imposta(fc.0, q, sr);
        Fruscio {
            t: 0.0,
            durata: durata.max(0.005),
            cima,
            curva: 1.0,
            fc0: fc.0,
            fc1: fc.1,
            andata_e_ritorno: false,
            q,
            tipo,
            filtro,
            rosa: Rosa::default(),
            usa_rosa: false,
            am: (0.0, 0.0),
            fase_am: 0.0,
            ruvido: 0.0,
            lento: UnPolo::nuovo(40.0, sr),
            conto: 0,
            sr,
            dt: 1.0 / sr,
            g: 1.0,
        }
    }

    /// Un tremolio a scatti: i denti di una cerniera, lo sfrigolio (Hz, profondità 0–1).
    pub fn con_am(mut self, f: f32, profondita: f32) -> Self {
        self.am = (f, profondita);
        self
    }

    /// La ruvidezza: il rumore trema lento, come la carta e il tessuto (0–1).
    pub fn ruvido(mut self, r: f32) -> Self {
        self.ruvido = r;
        self
    }

    /// Il rumore rosa invece del bianco: più corpo, meno sibilo.
    pub fn rosa(mut self) -> Self {
        self.usa_rosa = true;
        self
    }

    /// L’esponente dell’inviluppo: più alto, più netto.
    pub fn curva(mut self, c: f32) -> Self {
        self.curva = c;
        self
    }

    /// La banda va da fc0 a fc1 e torna indietro (la sintonia).
    pub fn andata_e_ritorno(mut self) -> Self {
        self.andata_e_ritorno = true;
        self
    }

    #[inline]
    fn campione(&mut self, caso: &mut Caso) -> Option<f32> {
        let x = self.t / self.durata;
        if x >= 1.0 {
            return None;
        }
        self.conto = self.conto.wrapping_add(1);
        if self.conto.is_multiple_of(16) {
            let y = if self.andata_e_ritorno { (PI * x).sin() } else { x };
            // la banda si sposta su una scala logaritmica, come l’orecchio
            let fc = self.fc0 * (self.fc1 / self.fc0).powf(y);
            self.filtro.imposta(fc, self.q, self.sr);
        }
        let w = caso.bianco();
        let mut n = if self.usa_rosa { self.rosa.campione(w) * 5.0 } else { w };
        if self.ruvido > 0.0 {
            let l = self.lento.elabora(caso.bianco(), 0).abs() * 12.0;
            n *= 1.0 - self.ruvido + self.ruvido * l;
        }
        if self.am.1 > 0.0 {
            self.fase_am = (self.fase_am + self.am.0 * self.dt * (1.0 + 0.25 * caso.bianco())) % 1.0;
            let dente = if self.fase_am < 0.35 { 1.0 } else { 0.0 };
            n *= 1.0 - self.am.1 + self.am.1 * dente;
        }
        let (b, bp, h) = self.filtro.elabora(n);
        let y = match self.tipo {
            Filtro::Banda => bp,
            Filtro::Basso => b,
            Filtro::Alto => h,
        };
        let inv = campana(x, self.cima).powf(self.curva);
        self.t += self.dt;
        Some(y * inv * self.g)
    }
}

/// Il tam-tam della Grande Porta (§4.3): i modi bassi colpiti dalla mazza, e i modi
/// alti che fioriscono dopo, come in un tam-tam vero, dove l’energia sale verso
/// l’acuto per qualche decimo di secondo. Un tam-tam non ha un’altezza precisa:
/// non è un re.
#[derive(Clone, Copy)]
pub struct Gong {
    bassi: [Modo; 12],
    alti: [Modo; 12],
    t: f32,
    dt: f32,
    mazza: UnPolo,
    fiore: UnPolo,
    conto: u32,
}

impl Gong {
    pub fn nuovo(caso: &mut Caso, sr: f32) -> Self {
        let base = caso.tra(62.0, 74.0);
        let bassi = std::array::from_fn(|k| {
            let f = base * (1.0 + k as f32).powf(1.42) * caso.tra(0.97, 1.03);
            Modo::nuovo(f, caso.tra(6.0, 10.0) * (1.0 - 0.04 * k as f32), 1.0 / (1.0 + 0.25 * k as f32), sr)
        });
        let alti = std::array::from_fn(|k| {
            let f = base * (13.0 + k as f32 * 1.7).powf(1.42) * caso.tra(0.97, 1.03);
            Modo::nuovo(f.min(sr * 0.4), caso.tra(2.0, 4.5) * (1.0 - 0.03 * k as f32), 0.5 / (1.0 + 0.15 * k as f32), sr)
        });
        Gong { bassi, alti, t: 0.0, dt: 1.0 / sr, mazza: UnPolo::nuovo(700.0, sr), fiore: UnPolo::nuovo(3000.0, sr), conto: 0 }
    }

    #[inline]
    fn campione(&mut self, caso: &mut Caso) -> Option<f32> {
        let t = self.t;
        // la mazza: dodici millisecondi di rumore morbido
        let mazza = if t < 0.012 { self.mazza.elabora(caso.bianco(), 0) * (1.0 - t / 0.012) * 6.0 } else { 0.0 };
        // il fiore: un soffio che cresce fino a 0,6 s e si spegne a 2 s
        let fiore = if t < 2.0 { self.fiore.elabora(caso.bianco(), 0) * campana(t / 2.0, 0.3) * 0.08 } else { 0.0 };
        let mut y = 0.0;
        for m in self.bassi.iter_mut() {
            y += m.elabora(mazza);
        }
        for m in self.alti.iter_mut() {
            y += m.elabora(fiore + mazza * 0.1);
        }
        self.t += self.dt;
        if t > 2.0 {
            self.conto = self.conto.wrapping_add(1);
            if self.conto.is_multiple_of(512) {
                let e: f32 = self.bassi.iter().chain(self.alti.iter()).map(|m| m.energia()).sum();
                if e < 3e-5 {
                    return None;
                }
            }
        }
        Some(y * 0.2)
    }
}

/// Il re₅ del sonaglio: l’ottavo armonico del reattore (§1.3).
pub const RE5: f32 = 587.329_5;

/// Il sonaglio del Nido (§5.4): prima il tintinnio del metallo leggero, poi la nota,
/// che resta nell’aria più del dovuto: dopo il primo secondo e mezzo smette di calare
/// e si allarga, invece di stringersi.
#[derive(Clone, Copy)]
pub struct Sonaglio {
    tintinnio: Modale,
    fasi: [f32; 4],
    t: f32,
    dt: f32,
    g: f32,
}

impl Sonaglio {
    pub fn nuovo(caso: &mut Caso, sr: f32) -> Self {
        let modi = [(3650.0, 0.06, 1.0), (5220.0, 0.04, 0.7), (7390.0, 0.03, 0.5), (4410.0, 0.05, 0.6)];
        let mut e = Eccitatore::default();
        let mut t = 0.0;
        for _ in 0..(4 + caso.indice(3)) {
            e.aggiungi(campioni(t, sr), caso.tra(0.3, 1.0));
            t += caso.tra(0.025, 0.07);
        }
        Sonaglio { tintinnio: Modale::nuovo(&modi, e, 12000.0, sr), fasi: [0.0; 4], t: 0.0, dt: 1.0 / sr, g: 1.0 }
    }

    #[inline]
    fn campione(&mut self, caso: &mut Caso) -> Option<f32> {
        let t = self.t;
        if t > 9.5 {
            return None;
        }
        let mut y = self.tintinnio.campione(caso).unwrap_or(0.0) * 0.5;
        let n = t - 0.18;
        if n > 0.0 {
            let attacco = (n / 0.004).min(1.0);
            // cala per un secondo e mezzo, poi quasi si ferma, e si allarga
            let corpo = if n < 1.5 { (-n * 1.5).exp() } else { (-2.25f32).exp() * (-(n - 1.5) * 0.45).exp() };
            let largo = ((n - 1.5) / 3.0).clamp(0.0, 1.0);
            let coda = if t > 8.5 { (9.5 - t).max(0.0) } else { 1.0 };
            let parziali = [(RE5, 1.0), (RE5 * 1.0006, 0.6 * largo), (RE5 * 2.0, 0.12), (RE5 * 3.0, 0.05)];
            let mut s = 0.0;
            for (k, (f, a)) in parziali.iter().enumerate() {
                self.fasi[k] = (self.fasi[k] + TAU * f * self.dt) % TAU;
                s += self.fasi[k].sin() * a;
            }
            y += s * corpo * attacco * coda * 0.5;
        }
        self.t += self.dt;
        Some(y * self.g)
    }
}

/// Un tono che scivola da un’altezza all’altra: il motorino del multiscanner.
#[derive(Clone, Copy)]
pub struct Glissato {
    fase: f32,
    f0: f32,
    f1: f32,
    t: f32,
    durata: f32,
    armonici: f32,
    dt: f32,
    g: f32,
}

impl Glissato {
    #[inline]
    fn campione(&mut self) -> Option<f32> {
        let x = self.t / self.durata;
        if x >= 1.0 {
            return None;
        }
        let f = self.f0 * (self.f1 / self.f0).powf(x);
        self.fase = (self.fase + TAU * f * self.dt) % TAU;
        let s = self.fase.sin() + self.armonici * (0.5 * (2.0 * self.fase).sin() + 0.25 * (3.0 * self.fase).sin());
        self.t += self.dt;
        Some(s * campana(x, 0.2) * self.g)
    }
}

#[derive(Clone, Copy)]
pub enum Corpo {
    Modale(Modale),
    Tonfo(Tonfo),
    Bolla(Bolla),
    Attrito(Attrito),
    Nota(Nota),
    Fruscio(Fruscio),
    Gong(Gong),
    Sonaglio(Sonaglio),
    Glissato(Glissato),
}

impl Corpo {
    /// Lo stesso colpo, `k` volte più forte: i colpi degli eventi stanno con il picco
    /// intorno a 1 (0 dB), così i livelli della regia sono picchi veri.
    pub fn per(self, k: f32) -> Corpo {
        match self {
            Corpo::Modale(mut m) => {
                for modo in m.modi[..m.n].iter_mut() {
                    modo.scala(k);
                }
                Corpo::Modale(m)
            }
            Corpo::Tonfo(mut t) => {
                t.a *= k;
                t.soffio_g *= k;
                Corpo::Tonfo(t)
            }
            Corpo::Bolla(mut b) => {
                b.a *= k;
                b.schiocco_g *= k;
                Corpo::Bolla(b)
            }
            Corpo::Attrito(mut a) => {
                for modo in a.modi[..a.n].iter_mut() {
                    modo.scala(k);
                }
                a.rombo_g *= k;
                Corpo::Attrito(a)
            }
            Corpo::Nota(mut n) => {
                n.g *= k;
                Corpo::Nota(n)
            }
            Corpo::Fruscio(mut f) => {
                f.g *= k;
                Corpo::Fruscio(f)
            }
            Corpo::Gong(mut g) => {
                for modo in g.bassi.iter_mut().chain(g.alti.iter_mut()) {
                    modo.scala(k);
                }
                Corpo::Gong(g)
            }
            Corpo::Sonaglio(mut s) => {
                s.g *= k;
                Corpo::Sonaglio(s)
            }
            Corpo::Glissato(mut g) => {
                g.g *= k;
                Corpo::Glissato(g)
            }
        }
    }
}

/// Il cursore che comanda un suono (06, §9.2): gli ambienti, gli effetti, le voci.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Canale {
    Ambienti,
    Effetti,
    Voci,
}

/// Un suono di un colpo solo, con la sua strada, il suo canale, il suo posto e il
/// suo ritardo.
#[derive(Clone, Copy)]
pub struct Colpo {
    pub bus: Bus,
    pub canale: Canale,
    gl: f32,
    gr: f32,
    ritardo: u32,
    corpo: Corpo,
}

impl Colpo {
    pub fn nuovo(corpo: Corpo, bus: Bus, guadagno_db: f32, p: f32, ritardo: f32, sr: f32) -> Self {
        let (pl, pr) = pan(p);
        let g = db(guadagno_db) * std::f32::consts::SQRT_2;
        Colpo { bus, canale: Canale::Effetti, gl: g * pl, gr: g * pr, ritardo: campioni(ritardo, sr), corpo }
    }

    pub fn nel_canale(mut self, c: Canale) -> Self {
        self.canale = c;
        self
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
            Corpo::Fruscio(f) => f.campione(caso),
            Corpo::Gong(g) => g.campione(caso),
            Corpo::Sonaglio(s) => s.campione(caso),
            Corpo::Glissato(g) => g.campione(),
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

// -------------------------------------------------------------------------------------
//  I colpi degli eventi del gioco
// -------------------------------------------------------------------------------------

/// Una pagina di carta spessa che si volta.
pub fn pagina(caso: &mut Caso, sr: f32) -> Corpo {
    let fc = caso.tra(1400.0, 2200.0);
    Corpo::Fruscio(Fruscio::nuovo(caso.tra(0.3, 0.5), 0.3, (fc, fc * 1.8), 0.8, Filtro::Banda, sr).ruvido(0.6)).per(1.6)
}

/// Il tessuto tecnico che si piega e si tira.
pub fn tessuto(caso: &mut Caso, sr: f32) -> Corpo {
    let fc = caso.tra(600.0, 1100.0);
    Corpo::Fruscio(Fruscio::nuovo(caso.tra(0.3, 0.7), caso.tra(0.2, 0.5), (fc, fc * 1.4), 0.7, Filtro::Banda, sr).ruvido(0.8)).per(2.0)
}

/// Una cerniera: i denti, uno dopo l’altro.
pub fn cerniera(caso: &mut Caso, sr: f32) -> Corpo {
    let fc = caso.tra(2600.0, 3400.0);
    Corpo::Fruscio(Fruscio::nuovo(caso.tra(0.5, 0.9), 0.5, (fc, fc * 1.15), 1.0, Filtro::Banda, sr).con_am(caso.tra(70.0, 110.0), 0.9)).per(1.3)
}

/// L’aria che entra da una fessura: il sibilo della porta interna, della valvola.
pub fn sibilo(durata: f32, caso: &mut Caso, sr: f32) -> Corpo {
    let fc = caso.tra(2300.0, 2800.0);
    Corpo::Fruscio(Fruscio::nuovo(durata, 0.15, (fc, fc * 0.6), 1.5, Filtro::Banda, sr)).per(1.5)
}

/// La tuta che si pressurizza: un soffio breve, che le orecchie sentono.
pub fn pressione(sr: f32) -> Corpo {
    Corpo::Fruscio(Fruscio::nuovo(0.6, 0.2, (500.0, 1800.0), 0.7, Filtro::Basso, sr).rosa()).per(1.0)
}

/// Le pompe che svuotano il boccaporto: il suono muore con la pressione, e perde gli
/// acuti prima dei bassi (§1.2).
pub fn svuota(sr: f32) -> Corpo {
    Corpo::Fruscio(Fruscio::nuovo(6.5, 0.06, (3200.0, 140.0), 0.7, Filtro::Basso, sr).rosa().curva(1.6)).per(0.68)
}

/// Il contrario: la pressione che torna, il sibilo che cresce.
pub fn riempie(sr: f32) -> Corpo {
    Corpo::Fruscio(Fruscio::nuovo(4.0, 0.85, (180.0, 4200.0), 0.7, Filtro::Basso, sr).rosa()).per(0.7)
}

/// Il casco strappato prima che la pressione sia pareggiata: un colpo d’aria.
pub fn colpo_d_aria(sr: f32) -> Corpo {
    Corpo::Fruscio(Fruscio::nuovo(0.45, 0.04, (2500.0, 300.0), 0.6, Filtro::Basso, sr).rosa().curva(2.0)).per(0.77)
}

/// Polvere fine che cade dalle pareti.
pub fn polvere(caso: &mut Caso, sr: f32) -> Corpo {
    let fc = caso.tra(2500.0, 3500.0);
    Corpo::Fruscio(Fruscio::nuovo(caso.tra(1.0, 2.2), 0.25, (fc, fc * 0.7), 0.9, Filtro::Banda, sr).ruvido(0.9)).per(1.4)
}

/// Il bengala: la linguetta strappata e l’accensione.
pub fn accensione(sr: f32) -> Corpo {
    Corpo::Fruscio(Fruscio::nuovo(0.5, 0.1, (700.0, 2600.0), 0.6, Filtro::Banda, sr).ruvido(0.5)).per(2.9)
}

/// La taglierina in atmosfera: il sibilo del getto, che sfrigola.
pub fn getto(durata: f32, caso: &mut Caso, sr: f32) -> Corpo {
    let fc = caso.tra(3800.0, 5200.0);
    Corpo::Fruscio(Fruscio::nuovo(durata, 0.1, (fc, fc * 0.85), 0.6, Filtro::Banda, sr).con_am(caso.tra(25.0, 45.0), 0.35).curva(0.5)).per(1.0)
}

/// Un terminale che sfrigola.
pub fn sfrigolio(caso: &mut Caso, sr: f32) -> Corpo {
    Corpo::Fruscio(Fruscio::nuovo(caso.tra(0.8, 1.4), 0.3, (5200.0, 3800.0), 0.8, Filtro::Alto, sr).con_am(caso.tra(28.0, 40.0), 0.8)).per(0.69)
}

/// La sintonia di un apparecchio che cerca: un fruscio stretto che scorre e torna.
pub fn sintonia(caso: &mut Caso, sr: f32) -> Corpo {
    let lo = caso.tra(700.0, 1000.0);
    Corpo::Fruscio(Fruscio::nuovo(caso.tra(1.2, 2.0), 0.5, (lo, lo * caso.tra(2.5, 3.5)), 9.0, Filtro::Banda, sr).andata_e_ritorno()).per(3.5)
}

/// Lo squelch della radio: il canale che si apre o si chiude.
pub fn squelch(sr: f32) -> Corpo {
    Corpo::Fruscio(Fruscio::nuovo(0.13, 0.05, (1500.0, 1800.0), 0.5, Filtro::Banda, sr).curva(2.0)).per(1.5)
}

/// Una luce che corre giù per la gola: un soffio vetroso che scende e si allontana.
pub fn soffio_vetroso(sr: f32) -> Corpo {
    Corpo::Fruscio(Fruscio::nuovo(1.4, 0.15, (3600.0, 700.0), 7.0, Filtro::Banda, sr)).per(3.0)
}

/// Qualcosa di bagnato e pesante che frusta o afferra.
pub fn frustata(caso: &mut Caso, sr: f32) -> Corpo {
    let fc = caso.tra(300.0, 650.0);
    Corpo::Fruscio(Fruscio::nuovo(caso.tra(0.12, 0.3), 0.08, (fc * 1.6, fc), 1.8, Filtro::Banda, sr).ruvido(0.9).curva(1.5)).per(9.0)
}

/// Un passo, sulla sua superficie (§3). `None`: i passi che non fanno rumore.
pub fn passo(superficie: Superficie, caso: &mut Caso, sr: f32) -> Option<Corpo> {
    let s = caso.tra(0.92, 1.08);
    let tonfo = |f0: f32, f1: f32, spegne: f32, g: f32, soffio: f32, soffio_f: f32| {
        Corpo::Tonfo(Tonfo::nuovo(f0 * s, f1 * s, 0.03, spegne, g, 0.012, soffio, soffio_f, sr))
    };
    // niente memoria allocata: i modi scalati stanno in un vettore fisso
    let modale = |modi: &[(f32, f32, f32)], soffio: f32, taglio: f32| {
        let mut m = [(0.0f32, 0.0f32, 0.0f32); 8];
        let n = modi.len().min(8);
        for (i, (f, t, a)) in modi.iter().take(n).enumerate() {
            m[i] = (f * s, *t, *a);
        }
        Corpo::Modale(Modale::nuovo(&m[..n], Eccitatore::impulso(0.6).con_soffio(0.012, soffio, taglio, sr), 9000.0, sr))
    };
    let norma = match superficie {
        Superficie::Lamiera => 0.1,
        Superficie::Tappeto => 2.0,
        Superficie::Grigliato => 0.27,
        Superficie::Magneti => 1.0,
        Superficie::Osso => 0.24,
        Superficie::Filamenti => 1.0,
        Superficie::Morbido => 2.5,
        Superficie::Pietra => 0.23,
        Superficie::Cristallo => 0.21,
        Superficie::Brina => 1.65,
        Superficie::Polvere => 2.0,
        Superficie::Vibrante => 0.16,
        Superficie::Navata => 0.31,
        Superficie::Nessuna => 1.0,
        Superficie::Sbriciola => 0.72,
    };
    Some(match superficie {
        Superficie::Lamiera => modale(&[(165.0, 0.09, 1.0), (390.0, 0.07, 0.5), (820.0, 0.05, 0.3), (1540.0, 0.04, 0.15)], 1.2, 900.0),
        Superficie::Tappeto => tonfo(110.0, 70.0, 0.08, 0.6, 0.5, 450.0),
        Superficie::Grigliato => {
            let mut e = Eccitatore::impulso(0.7).con_soffio(0.01, 0.8, 1200.0, sr);
            e.aggiungi(campioni(caso.tra(0.012, 0.02), sr), 0.35);
            e.aggiungi(campioni(caso.tra(0.03, 0.045), sr), 0.15);
            let modi = [(140.0 * s, 0.08, 1.0), (980.0 * s, 0.06, 0.45), (2150.0 * s, 0.05, 0.35), (3420.0 * s, 0.04, 0.2)];
            Corpo::Modale(Modale::nuovo(&modi, e, 9000.0, sr))
        }
        Superficie::Magneti => stivale(true, caso, sr),
        Superficie::Osso => modale(&[(180.0, 0.12, 1.0), (410.0, 0.08, 0.6), (760.0, 0.05, 0.35), (1250.0, 0.03, 0.2)], 1.0, 700.0),
        Superficie::Filamenti => frustata(caso, sr),
        Superficie::Morbido => tonfo(95.0, 60.0, 0.07, 0.45, 0.6, 350.0),
        Superficie::Pietra => modale(&[(150.0, 0.06, 1.0), (920.0, 0.05, 0.4), (1730.0, 0.04, 0.3), (2620.0, 0.03, 0.2), (3910.0, 0.02, 0.1)], 1.0, 1500.0),
        Superficie::Cristallo => modale(&[(160.0, 0.05, 1.0), (1930.0, 0.15, 0.35), (3120.0, 0.12, 0.25), (4710.0, 0.09, 0.18), (6890.0, 0.06, 0.1)], 0.8, 2000.0),
        Superficie::Brina => Corpo::Fruscio(Fruscio::nuovo(0.12, 0.2, (520.0, 380.0), 0.7, Filtro::Basso, sr).rosa().ruvido(0.5)),
        Superficie::Polvere => Corpo::Fruscio(Fruscio::nuovo(caso.tra(0.15, 0.25), 0.2, (1800.0, 1300.0), 0.5, Filtro::Banda, sr).ruvido(0.8)),
        Superficie::Vibrante => modale(&[(120.0, 0.35, 1.0), (240.0, 0.3, 0.5), (360.0, 0.25, 0.3), (980.0, 0.05, 0.2)], 1.0, 900.0),
        Superficie::Navata => modale(&[(130.0, 0.08, 1.0), (880.0, 0.06, 0.45), (1690.0, 0.05, 0.3), (2540.0, 0.04, 0.2)], 1.2, 1300.0),
        Superficie::Nessuna => return None,
        Superficie::Sbriciola => {
            let e = Eccitatore::impulso(0.6).con_crepitio(caso.tra(300.0, 600.0), caso.tra(0.08, 0.16), sr);
            let modi = [(140.0 * s, 0.06, 1.0), (1650.0 * s, 0.03, 0.5), (2900.0 * s, 0.02, 0.4), (4300.0 * s, 0.015, 0.3)];
            Corpo::Modale(Modale::nuovo(&modi, e, 8000.0, sr))
        }
    }
    .per(norma))
}

/// Un arco elettrico che corre fra le bobine: un crepitio ruvido.
pub fn scarica(caso: &mut Caso, sr: f32) -> Corpo {
    let fc = caso.tra(2500.0, 4000.0);
    Corpo::Fruscio(Fruscio::nuovo(caso.tra(0.15, 0.5), 0.1, (fc, fc * 0.7), 0.5, Filtro::Banda, sr).con_am(caso.tra(80.0, 150.0), 0.85)).per(1.0)
}

/// «Qualcosa crolla, con un rumore che non arriva: lo senti nelle suole»: solo ossa,
/// fra 25 e 60 Hz, lungo.
pub fn crollo(caso: &mut Caso, sr: f32) -> Corpo {
    Corpo::Tonfo(Tonfo::nuovo(caso.tra(45.0, 58.0), 25.0, 0.4, caso.tra(1.8, 2.8), 1.0, 0.9, 1.4, 70.0, sr))
}

/// Uno scatto meccanico piccolo: un fermo, un interruttore.
pub fn scatto(caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.9, 1.1);
    let modi = [(3100.0 * s, 0.008, 1.0), (4800.0 * s, 0.006, 0.6), (7200.0 * s, 0.004, 0.4), (900.0 * s, 0.015, 0.5)];
    Corpo::Modale(Modale::nuovo(&modi, Eccitatore::impulso(1.0), 11000.0, sr)).per(0.59)
}

/// La chiusura a scatto di una valigetta di metallo.
pub fn chiusura(caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.92, 1.08);
    let mut e = Eccitatore::impulso(1.0);
    e.aggiungi(campioni(caso.tra(0.006, 0.01), sr), 0.4);
    let modi = [(1250.0 * s, 0.05, 1.0), (2870.0 * s, 0.03, 0.6), (4410.0 * s, 0.02, 0.4), (430.0 * s, 0.04, 0.5)];
    Corpo::Modale(Modale::nuovo(&modi, e, 10000.0, sr)).per(0.65)
}

/// La ghiera del faro: quattro o cinque fermi.
pub fn ghiera(caso: &mut Caso, sr: f32) -> Corpo {
    let mut e = Eccitatore::default();
    let mut t = 0.0;
    for _ in 0..(4 + caso.indice(2)) {
        e.aggiungi(campioni(t, sr), caso.tra(0.6, 1.0));
        t += caso.tra(0.06, 0.09);
    }
    let modi = [(2600.0, 0.01, 1.0), (4100.0, 0.007, 0.6), (6300.0, 0.005, 0.4)];
    Corpo::Modale(Modale::nuovo(&modi, e, 10000.0, sr)).per(0.73)
}

/// La chiavetta d’ottone in una serratura piccola: i suoi scatti, e il giro.
pub fn chiave(caso: &mut Caso, sr: f32) -> Corpo {
    let mut e = Eccitatore::default();
    let mut t = 0.0;
    for _ in 0..4 {
        e.aggiungi(campioni(t, sr), caso.tra(0.3, 0.8));
        t += caso.tra(0.05, 0.12);
    }
    e.aggiungi(campioni(t + 0.15, sr), 1.0);
    let modi = [(2200.0, 0.03, 1.0), (3500.0, 0.02, 0.6), (5100.0, 0.015, 0.4), (7700.0, 0.01, 0.2)];
    Corpo::Modale(Modale::nuovo(&modi, e, 11000.0, sr)).per(0.6)
}

/// Il campanello minuscolo della chiavetta che scivola fra le pagine.
pub fn ottone(sr: f32) -> Corpo {
    let modi = [(3480.0, 0.35, 1.0), (5230.0, 0.25, 0.5), (7710.0, 0.15, 0.3)];
    Corpo::Modale(Modale::nuovo(&modi, Eccitatore::impulso(0.5), 12000.0, sr)).per(1.0)
}

/// L’anello del casco che si blocca sul collo della tuta.
pub fn anello(sr: f32) -> Corpo {
    let mut e = Eccitatore::impulso(1.0).con_soffio(0.004, 0.5, 3000.0, sr);
    e.aggiungi(campioni(0.012, sr), 0.6);
    let modi = [(520.0, 0.25, 1.0), (1180.0, 0.18, 0.6), (2150.0, 0.12, 0.4), (3330.0, 0.08, 0.25)];
    Corpo::Modale(Modale::nuovo(&modi, e, 9000.0, sr)).per(0.3)
}

/// Un connettore che entra nel suo incavo.
pub fn connettore(caso: &mut Caso, sr: f32) -> Corpo {
    let mut e = Eccitatore::impulso(0.7);
    e.aggiungi(campioni(caso.tra(0.03, 0.06), sr), 1.0);
    let modi = [(820.0, 0.04, 1.0), (1910.0, 0.03, 0.5), (3300.0, 0.02, 0.3)];
    Corpo::Modale(Modale::nuovo(&modi, e, 7000.0, sr)).per(0.76)
}

/// Il motorino del multiscanner: un ronzio piccolo che sale.
pub fn motorino(caso: &mut Caso, sr: f32) -> Corpo {
    let f0 = caso.tra(520.0, 640.0);
    Corpo::Glissato(Glissato { fase: 0.0, f0, f1: f0 * caso.tra(1.4, 1.7), t: 0.0, durata: caso.tra(0.35, 0.6), armonici: 0.6, dt: 1.0 / sr, g: 0.88 })
}

/// La taglierina nel vuoto: «un getto di luce che non fa rumore», solo il suo ronzio
/// nel guanto, che si fa irregolare quando il materiale si ritira.
pub fn taglierina_nel_guanto(durata: f32, caso: &mut Caso, sr: f32) -> Corpo {
    let modi = [(118.0, 0.25, 1.0), (236.0, 0.2, 0.5), (354.0, 0.15, 0.3), (472.0, 0.1, 0.2)];
    Corpo::Attrito(Attrito::nuovo(&modi, durata, 0.15, 118.0, 0.12, (0.1, 0.4), 0.15, 0.1, 0.0, 600.0, caso, sr)).per(0.44)
}

/// Una nota vetrosa: un pezzo del clic armonioso (§5.5).
pub fn vetro(f: f32, sr: f32) -> Corpo {
    let modi = [(f, 0.9, 1.0), (f * 2.32, 0.45, 0.45), (f * 4.25, 0.2, 0.25), (f * 6.8, 0.08, 0.12)];
    let e = Eccitatore::impulso(1.0).con_soffio(0.0008, 0.3, 9000.0, sr);
    Corpo::Modale(Modale::nuovo(&modi, e, 12000.0, sr)).per(0.52)
}

/// Il clic armonioso: sol♯, una terza minore settimale sopra, la quinta (§5.5).
pub const CLIC_ARMONIOSO: [f32; 3] = [415.305, 484.522, 622.254];

/// La pietra: un disco nel suo incavo, una sezione che scorre.
pub fn pietra(caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.9, 1.1);
    let modi = [(240.0 * s, 0.15, 1.0), (610.0 * s, 0.1, 0.6), (1130.0 * s, 0.07, 0.4), (1870.0 * s, 0.05, 0.25)];
    Corpo::Attrito(Attrito::nuovo(&modi, caso.tra(0.5, 0.9), 0.4, caso.tra(55.0, 80.0), 0.3, (0.1, 0.3), 0.6, 0.15, 0.2, 2500.0, caso, sr)).per(0.9)
}

/// Un tono che sale (o scende) da un’altezza all’altra: il ronzio della Grande Porta
/// che accelera, il rombo dei macchinari che si svegliano, la ricarica.
pub fn salita(f0: f32, f1: f32, durata: f32, armonici: f32, sr: f32) -> Corpo {
    Corpo::Glissato(Glissato { fase: 0.0, f0, f1, t: 0.0, durata, armonici, dt: 1.0 / sr, g: 1.0 / (1.0 + 0.4 * armonici) })
}

/// Un gancio vuoto che oscilla e tintinna contro il suo vicino.
pub fn gancio(caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.85, 1.2);
    let mut e = Eccitatore::default();
    let mut t = 0.0;
    for _ in 0..(1 + caso.indice(3)) {
        e.aggiungi(campioni(t, sr), caso.tra(0.4, 1.0));
        t += caso.tra(0.08, 0.2);
    }
    let modi = [(1830.0 * s, 0.4, 1.0), (3120.0 * s, 0.25, 0.6), (4690.0 * s, 0.15, 0.4), (6400.0 * s, 0.08, 0.2)];
    Corpo::Modale(Modale::nuovo(&modi, e, 11000.0, sr)).per(0.83)
}

/// Il tam-tam.
pub fn gong(caso: &mut Caso, sr: f32) -> Corpo {
    Corpo::Gong(Gong::nuovo(caso, sr)).per(0.044)
}

/// Il sonaglio.
pub fn sonaglio(caso: &mut Caso, sr: f32) -> Corpo {
    Corpo::Sonaglio(Sonaglio::nuovo(caso, sr))
}

/// La dissoluzione: lo stesso tam-tam smontato in granelli acuti.
pub fn granelli_acuti(caso: &mut Caso, sr: f32) -> Corpo {
    let e = Eccitatore::impulso(0.2).con_crepitio(caso.tra(500.0, 800.0), caso.tra(1.6, 2.4), sr);
    let modi = [(3150.0, 0.12, 0.8), (4470.0, 0.1, 0.6), (5820.0, 0.08, 0.5), (7310.0, 0.06, 0.4), (2480.0, 0.15, 0.5)];
    Corpo::Modale(Modale::nuovo(&modi, e, 12000.0, sr)).per(0.27)
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
            pagina(&mut caso, sr),
            tessuto(&mut caso, sr),
            cerniera(&mut caso, sr),
            sibilo(2.0, &mut caso, sr),
            pressione(sr),
            svuota(sr),
            riempie(sr),
            colpo_d_aria(sr),
            polvere(&mut caso, sr),
            accensione(sr),
            getto(1.5, &mut caso, sr),
            sfrigolio(&mut caso, sr),
            sintonia(&mut caso, sr),
            squelch(sr),
            soffio_vetroso(sr),
            frustata(&mut caso, sr),
            scarica(&mut caso, sr),
            crollo(&mut caso, sr),
            scatto(&mut caso, sr),
            chiusura(&mut caso, sr),
            ghiera(&mut caso, sr),
            chiave(&mut caso, sr),
            ottone(sr),
            anello(sr),
            connettore(&mut caso, sr),
            motorino(&mut caso, sr),
            taglierina_nel_guanto(1.5, &mut caso, sr),
            vetro(CLIC_ARMONIOSO[0], sr),
            pietra(&mut caso, sr),
            gong(&mut caso, sr),
            sonaglio(&mut caso, sr),
            granelli_acuti(&mut caso, sr),
            salita(207.0, 415.0, 1.5, 0.6, sr),
            gancio(&mut caso, sr),
        ];
        let mut corpi = corpi.to_vec();
        for superficie in [
            Superficie::Lamiera,
            Superficie::Tappeto,
            Superficie::Grigliato,
            Superficie::Magneti,
            Superficie::Osso,
            Superficie::Filamenti,
            Superficie::Morbido,
            Superficie::Pietra,
            Superficie::Cristallo,
            Superficie::Brina,
            Superficie::Polvere,
            Superficie::Vibrante,
            Superficie::Navata,
            Superficie::Sbriciola,
        ] {
            corpi.push(passo(superficie, &mut caso, sr).expect("un passo"));
        }
        assert!(passo(Superficie::Nessuna, &mut caso, sr).is_none());
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
