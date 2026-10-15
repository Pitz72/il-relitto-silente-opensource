//! Il brusio (bibbia sonora, §5.2): «tante voci, una sopra l’altra, nessuna intera».
//! Fino a quaranta voci sintetiche (voce.rs), ognuna con il suo timbro, la sua
//! altezza, il suo ritmo e il suo posto nello spazio; ognuna si allontana e si
//! avvicina piano. Le voci entrano ed escono senza scatti.

use super::dsp::{db, pan, Caso, Lento, PassaTutto, Scorrevole};
use super::voce::Voce;

pub const MAX_FLUSSI: usize = 40;

struct Flusso {
    voce: Voce,
    gl: f32,
    gr: f32,
    g: f32,
    lontano: Lento,
}

pub struct Brusio {
    flussi: Vec<Flusso>,
    caso: Caso,
    /// quanti flussi suonano (scorre: i flussi entrano ed escono piano)
    pub quanti: Scorrevole,
    /// il volume, lineare
    pub guadagno: Scorrevole,
    diff: [PassaTutto; 4],
    k_flusso: f32,
    dt: f32,
    conto: u32,
    lontananze: [f32; MAX_FLUSSI],
}

impl Brusio {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let flussi = (0..MAX_FLUSSI)
            .map(|k| {
                // voci gravi e voci più chiare, mescolate
                let f0 = if caso.una_su(3) { caso.tra(150.0, 225.0) } else { caso.tra(85.0, 135.0) };
                let voce = Voce::nuova(sr, seme ^ (k as u64 * 0x9E37 + 1), f0, caso.tra(0.78, 0.92), caso.tra(0.8, 1.25), caso.tra(0.04, 0.15));
                let (gl, gr) = pan(caso.tra(-0.85, 0.85));
                Flusso { voce, gl, gr, g: 0.0, lontano: Lento::nuovo((2.0, 8.0), &mut caso) }
            })
            .collect();
        let ms = |x: f32| (x * sr / 1000.0) as usize;
        Brusio {
            flussi,
            caso,
            quanti: Scorrevole::nuovo(0.0),
            guadagno: Scorrevole::nuovo(0.0),
            // quattro passa-tutto corti: le voci si fondono in un coro
            diff: [PassaTutto::nuovo(ms(4.7), 0.45), PassaTutto::nuovo(ms(11.3), 0.4), PassaTutto::nuovo(ms(5.3), 0.45), PassaTutto::nuovo(ms(12.9), 0.4)],
            k_flusso: 1.0 - (-1.0 / (0.25 * sr)).exp(),
            dt: 1.0 / sr,
            conto: 0,
            lontananze: [1.0; MAX_FLUSSI],
        }
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let quanti = self.quanti.passo();
        let guadagno = self.guadagno.passo();
        if guadagno < 1e-5 && quanti < 0.01 {
            return (0.0, 0.0);
        }
        // ogni voce si allontana e si avvicina piano (±4 dB), ogni 64 campioni
        self.conto = self.conto.wrapping_add(1);
        let aggiorna = self.conto.is_multiple_of(64);
        let mut l = 0.0;
        let mut r = 0.0;
        for (k, f) in self.flussi.iter_mut().enumerate() {
            let meta = if (k as f32) < quanti { 1.0 } else { 0.0 };
            f.g += (meta - f.g) * self.k_flusso;
            if f.g < 1e-4 && meta == 0.0 {
                continue;
            }
            if aggiorna {
                self.lontananze[k] = db(4.0 * f.lontano.campione(self.dt * 64.0, &mut self.caso));
            }
            let s = f.voce.campione() * f.g * self.lontananze[k];
            l += s * f.gl;
            r += s * f.gr;
        }
        // la somma di n voci cresce come la radice di n: il volume resta quello chiesto
        let norma = 1.0 / quanti.max(1.0).sqrt();
        let l = self.diff[0].elabora(l * norma);
        let l = self.diff[1].elabora(l);
        let r = self.diff[2].elabora(r * norma);
        let r = self.diff[3].elabora(r);
        (l * guadagno, r * guadagno)
    }
}
