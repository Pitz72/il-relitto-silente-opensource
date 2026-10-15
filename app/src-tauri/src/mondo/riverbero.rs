//! Il riverbero delle stanze: una rete di sedici linee di ritardo che si scambiano
//! il suono attraverso una matrice di Hadamard (una «feedback delay network»), con
//! le prime riflessioni davanti. Ogni linea ha il suo filtro: i bassi durano
//! `rt_basso` secondi, gli acuti `rt_alto` (l’aria secca della serra se li mangia
//! prima, la gola umida li tiene). Quattro linee ondeggiano appena, così la coda non
//! suona di metallo. Si cambia stanza senza scatti: tutto scorre.

use super::dsp::{PassaTutto, Ritardo, Scorrevole};

const N: usize = 16;

// le lunghezze delle linee, in millisecondi, per una stanza di dimensione 1
const LUNGHEZZE_MS: [f32; N] = [
    11.3, 13.7, 15.1, 17.9, 19.3, 22.1, 23.9, 26.3, 28.7, 31.1, 33.7, 36.1, 39.7, 42.1, 45.3, 49.1,
];
// le prime riflessioni: (ritardo in ms per dimensione 1, guadagno, lato)
const RIFLESSIONI: [(f32, f32, f32); 6] = [
    (3.1, 0.55, -0.7),
    (5.9, 0.45, 0.8),
    (8.3, 0.38, -0.2),
    (11.7, 0.32, 0.5),
    (15.2, 0.26, -0.9),
    (21.4, 0.2, 0.3),
];
const DIMENSIONE_MAX: f32 = 2.2;

pub struct Riverbero {
    sr: f32,
    linee: Vec<Ritardo>,
    lp: [f32; N],
    coef: [(f32, f32); N],
    ingresso: Ritardo,
    diff: [PassaTutto; 4],
    fasi: [f32; 4],
    passi: [f32; 4],
    conto: u32,
    /// i secondi della coda nei bassi e negli acuti (−60 dB)
    pub rt_basso: Scorrevole,
    pub rt_alto: Scorrevole,
    /// quanto si sente il riverbero (lineare)
    pub umido: Scorrevole,
    /// la dimensione della stanza (1 = una sala media)
    pub dimensione: Scorrevole,
}

impl Riverbero {
    pub fn nuovo(sr: f32) -> Self {
        let ms = |x: f32| (x * sr / 1000.0) as usize;
        let massimo = ms(LUNGHEZZE_MS[N - 1] * DIMENSIONE_MAX + 4.0);
        let passi = [0.13, 0.21, 0.29, 0.37].map(|f: f32| std::f32::consts::TAU * f / sr);
        Riverbero {
            sr,
            linee: (0..N).map(|_| Ritardo::nuovo(massimo)).collect(),
            lp: [0.0; N],
            coef: [(0.0, 0.0); N],
            ingresso: Ritardo::nuovo(ms(RIFLESSIONI[5].0 * DIMENSIONE_MAX + 40.0)),
            diff: [
                PassaTutto::nuovo(ms(1.7), 0.6),
                PassaTutto::nuovo(ms(3.9), 0.55),
                PassaTutto::nuovo(ms(2.3), 0.6),
                PassaTutto::nuovo(ms(4.7), 0.55),
            ],
            fasi: [0.0, 1.3, 2.6, 3.9],
            passi,
            conto: 0,
            rt_basso: Scorrevole::nuovo(1.0),
            rt_alto: Scorrevole::nuovo(0.5),
            umido: Scorrevole::nuovo(0.0),
            dimensione: Scorrevole::nuovo(1.0),
        }
    }

    /// Porta la stanza verso nuovi valori, in `secondi`.
    pub fn stanza(&mut self, rt_basso: f32, rt_alto: f32, umido: f32, dimensione: f32, secondi: f32) {
        let sr = self.sr;
        self.rt_basso.verso(rt_basso.max(0.05), secondi, sr);
        self.rt_alto.verso(rt_alto.max(0.03), secondi, sr);
        self.umido.verso(umido, secondi, sr);
        self.dimensione.verso(dimensione.clamp(0.2, DIMENSIONE_MAX), secondi, sr);
    }

    fn calcola(&mut self) {
        let sr = self.sr;
        let d = self.dimensione.v;
        let (tb, ta) = (self.rt_basso.v, self.rt_alto.v.min(self.rt_basso.v));
        for i in 0..N {
            let l = LUNGHEZZE_MS[i] * d * sr / 1000.0;
            let g_dc = 10f32.powf(-3.0 * l / (tb * sr));
            let g_hf = 10f32.powf(-3.0 * l / (ta * sr));
            let a = (g_dc - g_hf) / (g_dc + g_hf);
            self.coef[i] = (g_dc * (1.0 - a), a);
        }
    }

    /// Prende il suono asciutto, rende solo la parte riverberata.
    #[inline]
    pub fn elabora(&mut self, l: f32, r: f32) -> (f32, f32) {
        // i parametri scorrono a ogni campione; i coefficienti si rifanno ogni 64
        self.rt_basso.passo();
        self.rt_alto.passo();
        let d = self.dimensione.passo();
        let umido = self.umido.passo();
        if self.conto.is_multiple_of(64) {
            self.calcola();
        }
        self.conto = self.conto.wrapping_add(1);
        let sr_ms = self.sr / 1000.0;

        // l’ingresso, sbavato da quattro passa-tutto
        let il = self.diff[0].elabora(l);
        let il = self.diff[1].elabora(il);
        let ir = self.diff[2].elabora(r);
        let ir = self.diff[3].elabora(ir);
        self.ingresso.scrivi((l + r) * 0.5);

        // le prime riflessioni
        let mut el = 0.0;
        let mut er = 0.0;
        for (t, g, lato) in RIFLESSIONI {
            let x = self.ingresso.leggi(t * d * sr_ms) * g;
            el += x * (1.0 - lato) * 0.5;
            er += x * (1.0 + lato) * 0.5;
        }

        // la rete: si legge, si smorza, si mescola, si riscrive
        let mut y = [0.0f32; N];
        for i in 0..N {
            let mut lung = LUNGHEZZE_MS[i] * d * sr_ms;
            if i < 4 {
                self.fasi[i] += self.passi[i];
                if self.fasi[i] > std::f32::consts::TAU {
                    self.fasi[i] -= std::f32::consts::TAU;
                }
                lung += self.fasi[i].sin() * 0.25 * sr_ms * d;
            }
            let x = self.linee[i].leggi(lung);
            let (b, a) = self.coef[i];
            self.lp[i] = b * x + a * self.lp[i];
            y[i] = self.lp[i];
        }
        let mut uscita_l = 0.0;
        let mut uscita_r = 0.0;
        for i in 0..N {
            if i % 2 == 0 {
                uscita_l += y[i];
            } else {
                uscita_r += y[i];
            }
        }
        hadamard(&mut y);
        for (i, linea) in self.linee.iter_mut().enumerate() {
            let entra = if i % 2 == 0 { il } else { ir };
            linea.scrivi(y[i] + entra * 0.35);
        }
        ((uscita_l * 0.3 + el) * umido, (uscita_r * 0.3 + er) * umido)
    }
}

/// La trasformata di Hadamard su sedici valori, normalizzata: la matrice che mescola
/// le linee senza perdere energia.
#[inline]
fn hadamard(x: &mut [f32; N]) {
    let mut h = 1;
    while h < N {
        let mut i = 0;
        while i < N {
            for j in i..i + h {
                let a = x[j];
                let b = x[j + h];
                x[j] = a + b;
                x[j + h] = a - b;
            }
            i += h * 2;
        }
        h *= 2;
    }
    for v in x.iter_mut() {
        *v *= 0.25;
    }
}

#[cfg(test)]
mod prove {
    use super::*;

    /// La coda deve spegnersi nel tempo chiesto: dopo rt_basso secondi, −60 dB circa.
    #[test]
    fn la_coda_si_spegne_nel_suo_tempo() {
        let sr = 48000.0;
        let mut r = Riverbero::nuovo(sr);
        r.stanza(1.0, 1.0, 1.0, 1.0, 0.0);
        let energia = |r: &mut Riverbero, da: usize, a: usize, primo: bool| {
            let mut e = 0.0f64;
            for i in da..a {
                let x = if primo && i == 0 { 1.0 } else { 0.0 };
                let (l, rr) = r.elabora(x, x);
                e += (l * l + rr * rr) as f64;
            }
            e
        };
        let _ = energia(&mut r, 0, 4800, true);
        let e1 = energia(&mut r, 4800, 9600, false); // 0,1–0,2 s
        let _ = energia(&mut r, 9600, 48000, false);
        let e2 = energia(&mut r, 48000, 52800, false); // 1,0–1,1 s
        let calo = 10.0 * (e1 / e2).log10();
        // fra 0,15 s e 1,05 s passano 0,9 s: circa 54 dB con rt 1 s
        assert!(calo > 40.0 && calo < 70.0, "calo {calo} dB");
    }
}
