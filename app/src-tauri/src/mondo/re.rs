//! Il re del reattore: re₂ a 73,42 Hz con otto armonici e un secondo banco appena
//! scordato che batte lentamente. L’altezza non cambia mai («una nota sola, tenuta,
//! che non cambia mai»): cambiano il volume, gli armonici alti e i battimenti.
//!
//! Perché suoni come una macchina e non come un organo: ogni armonico deriva piano
//! di volume per conto suo, e sotto i primi quattro c’è una banda di rumore stretta
//! un hertz, che li fa vivere come il ronzio di un trasformatore vero. Ogni parziale
//! ha la sua fase, così i battimenti si possono muovere senza scatti.

use std::f64::consts::TAU;

use super::dsp::{Caso, Lento, Modo, Scorrevole};

pub const RE: f64 = 73.416_191_979_351_6; // re₂, la = 440 Hz

// (armonico, ampiezza): pari più deboli dei dispari, come il ronzio di un
// trasformatore sotto carico; il sesto e l’ottavo danno il metallo.
const ARMONICI: [(f64, f64); 8] = [
    (1.0, 1.0),
    (2.0, 0.42),
    (3.0, 0.55),
    (4.0, 0.18),
    (5.0, 0.22),
    (6.0, 0.09),
    (7.0, 0.07),
    (8.0, 0.05),
];

/// Una banda di rumore stretta intorno a un armonico, con un’uscita di valore
/// efficace 1: un modo lungo eccitato dal rumore bianco.
struct Banda {
    l: Modo,
    r: Modo,
    k: f32,
}

impl Banda {
    fn nuova(f: f32, t60: f32, sr: f32) -> Self {
        let r = (-6.907_755 / (t60 * sr)).exp();
        // la varianza di un risonatore lungo eccitato dal bianco (varianza 1/3)
        let k = (2.0 * (1.0 - r * r) * 3.0).sqrt();
        Banda { l: Modo::nuovo(f, t60, 1.0, sr), r: Modo::nuovo(f, t60, 1.0, sr), k }
    }
}

pub struct Re {
    fb: [f64; 8],
    fs: [f64; 8],
    respiro: f64,
    deriva: [Lento; 8],
    bande: [Banda; 4],
    caso: Caso,
    dt: f32,
    /// il volume, lineare
    pub g: Scorrevole,
    /// gli armonici sopra il quarto (1 = pieni)
    pub alti: Scorrevole,
    /// lo scarto del secondo banco, in Hz per armonico (0,11 di solito; di più quando fatica)
    pub scarto: Scorrevole,
    /// quanto si rinforza l’ottavo armonico, il re del sonaglio (0 = niente)
    pub ottavo: Scorrevole,
}

impl Re {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let deriva = std::array::from_fn(|_| Lento::nuovo((1.5, 6.0), &mut caso));
        let bande = std::array::from_fn(|i| Banda::nuova((RE * (i + 1) as f64) as f32, 2.0, sr));
        Re {
            fb: [0.0; 8],
            fs: std::array::from_fn(|i| (i + 1) as f64 * 0.7),
            respiro: 0.0,
            deriva,
            bande,
            caso,
            dt: 1.0 / sr,
            g: Scorrevole::nuovo(0.0),
            alti: Scorrevole::nuovo(1.0),
            scarto: Scorrevole::nuovo(0.11),
            ottavo: Scorrevole::nuovo(0.0),
        }
    }

    #[inline]
    pub fn campione(&mut self, dt: f64) -> (f32, f32) {
        let g = self.g.passo() as f64;
        let alti = self.alti.passo() as f64;
        let scarto = self.scarto.passo() as f64;
        let ottavo = self.ottavo.passo() as f64;
        self.respiro = (self.respiro + TAU * 0.07 * dt) % TAU;
        let mut sl = 0.0;
        let mut sr = 0.0;
        for (i, (n, a)) in ARMONICI.iter().enumerate() {
            let a = a * if *n > 4.0 { alti } else { 1.0 } * if *n == 8.0 { 1.0 + ottavo } else { 1.0 };
            let vita = 1.0 + 0.12 * self.deriva[i].campione(self.dt, &mut self.caso) as f64;
            self.fb[i] = (self.fb[i] + TAU * RE * n * dt) % TAU;
            self.fs[i] = (self.fs[i] + TAU * (RE * n + scarto * n) * dt) % TAU;
            let base = self.fb[i].sin();
            sl += a * vita * (0.62 * base + 0.38 * self.fs[i].sin());
            sr += a * vita * (0.62 * base + 0.38 * (self.fs[i] + 0.35).sin());
        }
        if g < 1e-6 {
            return (0.0, 0.0);
        }
        // le bande di rumore sotto i primi quattro armonici
        for (i, b) in self.bande.iter_mut().enumerate() {
            let a = ARMONICI[i].1 * 0.25;
            let (nl, nr) = (self.caso.bianco(), self.caso.bianco());
            sl += (b.l.elabora(nl) * b.k) as f64 * a;
            sr += (b.r.elabora(nr) * b.k) as f64 * a;
        }
        let k = (1.0 + 0.08 * self.respiro.sin()) * 0.11;
        // una saturazione morbida: calore, non distorsione
        (((sl * k).tanh() * g) as f32, ((sr * k).tanh() * g) as f32)
    }
}
