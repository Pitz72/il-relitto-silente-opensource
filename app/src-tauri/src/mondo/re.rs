//! Il re del reattore: re₂ a 73,42 Hz con otto armonici e un secondo banco appena
//! scordato che batte lentamente. L’altezza non cambia mai («una nota sola, tenuta,
//! che non cambia mai»): cambiano il volume, gli armonici alti e i battimenti.
//! Ogni parziale ha la sua fase, così i battimenti si possono muovere senza scatti.

use std::f64::consts::TAU;

use super::dsp::Scorrevole;

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

pub struct Re {
    fb: [f64; 8],
    fs: [f64; 8],
    respiro: f64,
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
    pub fn nuovo() -> Self {
        Re {
            fb: [0.0; 8],
            fs: std::array::from_fn(|i| (i + 1) as f64 * 0.7),
            respiro: 0.0,
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
            self.fb[i] = (self.fb[i] + TAU * RE * n * dt) % TAU;
            self.fs[i] = (self.fs[i] + TAU * (RE * n + scarto * n) * dt) % TAU;
            let base = self.fb[i].sin();
            sl += a * (0.62 * base + 0.38 * self.fs[i].sin());
            sr += a * (0.62 * base + 0.38 * (self.fs[i] + 0.35).sin());
        }
        if g < 1e-6 {
            return (0.0, 0.0);
        }
        let k = (1.0 + 0.08 * self.respiro.sin()) * 0.11;
        // una saturazione morbida: calore, non distorsione
        (((sl * k).tanh() * g) as f32, ((sr * k).tanh() * g) as f32)
    }
}
