//! Una voce sintetica, per il brusio (bibbia sonora, §5.2).
//!
//! La sorgente è la glottide che si apre e si chiude (il modello KLGLOTT88), con il
//! suo tremito da un periodo all’altro e il soffio dell’aria; il tratto vocale è una
//! cascata di cinque risonatori (le formanti, alla maniera di Klatt); le fricative
//! passano in parallelo. La voce parla per sillabe inventate (vocali, nasali, liquide,
//! fricative, occlusive) con un’intonazione che scende lungo la frase e gli accenti
//! che la sollevano. Non c’è nessuna lingua, quindi nessuna parola: «tante voci, una
//! sopra l’altra, nessuna intera».
//!
//! Le creature sono «alte e sottili»: un tratto vocale più lungo del nostro, quindi
//! formanti più basse di qualche semitono (la `scala`).

use super::dsp::{Caso, Risonatore, Svf, UnPolo};

const VOCALI: [[f32; 3]; 7] = [
    [270.0, 2290.0, 3010.0], // i
    [400.0, 2000.0, 2550.0], // e
    [530.0, 1840.0, 2480.0], // ɛ
    [730.0, 1090.0, 2440.0], // a
    [570.0, 840.0, 2410.0],  // ɔ
    [300.0, 870.0, 2240.0],  // u
    [500.0, 1500.0, 2500.0], // ə
];
const VOCALI_BW: [f32; 3] = [70.0, 100.0, 140.0];

#[derive(Clone, Copy, Default)]
struct Segmento {
    durata: f32,
    f: [f32; 3],
    bw: [f32; 3],
    voce: f32,
    soffio: f32,
    fric: f32,
    fric_f: f32,
    fric_q: f32,
    /// il tempo in cui le ampiezze passano al segmento (s)
    morbido: f32,
    accento: f32,
    /// la pausa fra due frasi: dopo, l’intonazione ricomincia
    pausa: bool,
}

const CODA: usize = 16;

// i pesi della sorgente, tarati sulle misure
const VOCE_G: f32 = 1.0;
const SOFFIO_G: f32 = 0.35;
const FRIC_G: f32 = 0.6;
const USCITA_G: f32 = 0.066;

pub struct Voce {
    sr: f32,
    dt: f32,
    caso: Caso,
    // chi parla
    f0_base: f32,
    scala: f32,
    ritmo: f32,
    soffio_base: f32,
    // quello che sta dicendo
    coda: [Segmento; CODA],
    testa: usize,
    n: usize,
    seg: Segmento,
    t_seg: f32,
    frase_t: f32,
    frase_durata: f32,
    domanda: bool,
    sillabe_rimaste: u32,
    // i parametri che scorrono
    f: [f32; 3],
    bw: [f32; 3],
    voce: f32,
    soffio: f32,
    fric: f32,
    fric_f: f32,
    fric_q: f32,
    accento: f32,
    k_ampiezza: f32,
    // la sorgente
    glottide: f32,
    f0: f32,
    ampiezza: f32,
    vibrato: f32,
    inclina: UnPolo,
    // il tratto
    tratto: [Risonatore; 5],
    fricativa: Svf,
    conto: u32,
}

impl Voce {
    pub fn nuova(sr: f32, seme: u64, f0_base: f32, scala: f32, ritmo: f32, soffio_base: f32) -> Self {
        let mut caso = Caso::nuovo(seme);
        let sillabe = 1 + caso.indice(8) as u32;
        let mut v = Voce {
            sr,
            dt: 1.0 / sr,
            f0_base,
            scala,
            ritmo,
            soffio_base,
            coda: [Segmento::default(); CODA],
            testa: 0,
            n: 0,
            seg: Segmento { durata: caso.tra(0.05, 1.5), pausa: true, morbido: 0.03, f: VOCALI[6], bw: VOCALI_BW, ..Default::default() },
            t_seg: 0.0,
            frase_t: 0.0,
            frase_durata: 1.0,
            domanda: false,
            sillabe_rimaste: sillabe,
            f: VOCALI[6],
            bw: VOCALI_BW,
            voce: 0.0,
            soffio: 0.0,
            fric: 0.0,
            fric_f: 3000.0,
            fric_q: 1.0,
            accento: 0.0,
            k_ampiezza: 0.01,
            glottide: caso.f(),
            f0: f0_base,
            ampiezza: 1.0,
            vibrato: caso.f() * 6.0,
            inclina: UnPolo::nuovo(2400.0, sr),
            tratto: [Risonatore::default(); 5],
            fricativa: Svf::nuovo(3000.0, 1.0, sr),
            conto: 0,
            caso,
        };
        v.aggiorna_filtri();
        v
    }

    fn accoda(&mut self, s: Segmento) {
        if self.n < CODA {
            self.coda[(self.testa + self.n) % CODA] = s;
            self.n += 1;
        }
    }

    fn prossimo(&mut self) {
        if self.n == 0 {
            self.sillaba();
        }
        if self.n == 0 {
            return;
        }
        let era_pausa = self.seg.pausa;
        self.seg = self.coda[self.testa];
        self.testa = (self.testa + 1) % CODA;
        self.n -= 1;
        self.k_ampiezza = 1.0 - (-1.0 / (self.seg.morbido.max(0.0005) * self.sr)).exp();
        if era_pausa && !self.seg.pausa {
            self.frase_t = 0.0;
        }
    }

    fn vocale(&mut self) -> [f32; 3] {
        let v = VOCALI[self.caso.indice(VOCALI.len())];
        // ogni vocale un poco diversa: le creature non hanno i nostri bersagli esatti
        [v[0] * self.caso.tra(0.92, 1.08), v[1] * self.caso.tra(0.92, 1.08), v[2] * self.caso.tra(0.95, 1.05)]
    }

    /// Una consonante prima (o dopo) la vocale `v`.
    fn consonante(&mut self, v: [f32; 3], coda: bool) {
        let r = self.caso.f();
        let base = Segmento { f: v, bw: VOCALI_BW, morbido: 0.012, fric_f: 3000.0, fric_q: 1.0, ..Default::default() };
        let rit = 1.0 / self.ritmo;
        if r < 0.3 && !coda {
            // un’occlusiva: la chiusura, l’esplosione, il soffio
            let (ff, fq) = match self.caso.indice(3) {
                0 => (1000.0, 0.6),
                1 => (4200.0, 1.2),
                _ => (2100.0, 1.5),
            };
            let sorda = self.caso.una_su(2);
            let chiusa = self.caso.tra(0.035, 0.07) * rit;
            let aspira = self.caso.tra(0.02, 0.04);
            self.accoda(Segmento { durata: chiusa, morbido: 0.004, voce: if sorda { 0.0 } else { 0.08 }, ..base });
            self.accoda(Segmento { durata: 0.012, morbido: 0.0008, fric: 0.75, fric_f: ff, fric_q: fq, ..base });
            if sorda {
                self.accoda(Segmento { durata: aspira, morbido: 0.004, soffio: 0.35, ..base });
            }
        } else if r < 0.52 {
            // una nasale
            let f2 = if self.caso.una_su(2) { 1100.0 } else { 1600.0 };
            let durata = self.caso.tra(0.05, 0.09) * rit;
            self.accoda(Segmento {
                durata,
                f: [250.0, f2, 2300.0],
                bw: [100.0, 300.0, 400.0],
                voce: 0.42,
                ..base
            });
        } else if r < 0.75 {
            // una fricativa
            let (ff, fq, g) = match self.caso.indice(4) {
                0 => (5500.0, 3.0, 0.5),
                1 => (3100.0, 2.5, 0.55),
                2 => (2300.0, 0.5, 0.22),
                _ => (1500.0, 0.6, 0.0),
            };
            let sonora = g > 0.0 && self.caso.una_su(3);
            let durata = self.caso.tra(0.06, 0.13) * rit;
            self.accoda(Segmento {
                durata,
                voce: if sonora { 0.3 } else { 0.0 },
                soffio: if g == 0.0 { 0.45 } else { 0.0 },
                fric: g,
                fric_f: ff,
                fric_q: fq,
                ..base
            });
        } else {
            // una liquida
            let f = if self.caso.una_su(2) { [360.0, 1150.0, 2700.0] } else { [420.0, 1300.0, 1750.0] };
            let durata = self.caso.tra(0.035, 0.07) * rit;
            self.accoda(Segmento { durata, f, bw: [80.0, 120.0, 200.0], voce: 0.75, ..base });
        }
    }

    fn sillaba(&mut self) {
        if self.sillabe_rimaste == 0 {
            // la frase è finita: una pausa, poi un’altra frase
            let durata = self.caso.tra(0.25, 1.6);
            self.accoda(Segmento { durata, morbido: 0.04, pausa: true, f: VOCALI[6], bw: VOCALI_BW, ..Default::default() });
            self.sillabe_rimaste = 2 + self.caso.indice(11) as u32;
            self.frase_durata = self.sillabe_rimaste as f32 * 0.21 / self.ritmo;
            self.domanda = self.caso.una_su(5);
            return;
        }
        self.sillabe_rimaste -= 1;
        let v = self.vocale();
        let accento = if self.caso.una_su(3) { self.caso.tra(0.5, 1.0) } else { 0.0 };
        let r = self.caso.f();
        if r < 0.78 {
            self.consonante(v, false);
        }
        if r > 0.9 {
            // un gruppo: occlusiva e liquida
            self.consonante(v, true);
        }
        let durata = self.caso.tra(0.06, 0.14) * (1.0 + 0.4 * accento) / self.ritmo;
        self.accoda(Segmento {
            durata,
            f: v,
            bw: VOCALI_BW,
            voce: 1.0,
            soffio: self.soffio_base,
            morbido: 0.012,
            accento,
            fric_f: 3000.0,
            fric_q: 1.0,
            ..Default::default()
        });
        if self.caso.una_su(3) {
            self.consonante(v, true);
        }
    }

    fn aggiorna_filtri(&mut self) {
        let s = self.scala;
        for i in 0..3 {
            self.tratto[i].imposta(self.f[i] * s, self.bw[i], self.sr);
        }
        self.tratto[3].imposta(3400.0 * s, 250.0, self.sr);
        self.tratto[4].imposta(4100.0 * s, 300.0, self.sr);
        self.fricativa.imposta(self.fric_f, self.fric_q, self.sr);
    }

    #[inline]
    pub fn campione(&mut self) -> f32 {
        self.t_seg += self.dt;
        if self.t_seg >= self.seg.durata {
            self.t_seg -= self.seg.durata;
            self.prossimo();
        }
        self.frase_t += self.dt;

        // le ampiezze scorrono a ogni campione, le formanti ogni sedici
        let k = self.k_ampiezza;
        self.voce += (self.seg.voce - self.voce) * k;
        self.soffio += (self.seg.soffio - self.soffio) * k;
        self.fric += (self.seg.fric - self.fric) * k;
        self.conto = self.conto.wrapping_add(1);
        if self.conto.is_multiple_of(16) {
            let kf = 1.0 - (-16.0 / (0.025 * self.sr)).exp();
            for i in 0..3 {
                self.f[i] += (self.seg.f[i] - self.f[i]) * kf;
                self.bw[i] += (self.seg.bw[i] - self.bw[i]) * kf;
            }
            self.fric_f += (self.seg.fric_f - self.fric_f) * kf * 2.0;
            self.fric_q += (self.seg.fric_q - self.fric_q) * kf * 2.0;
            let ka = 1.0 - (-16.0 / (0.06 * self.sr)).exp();
            self.accento += (self.seg.accento - self.accento) * ka;
            self.aggiorna_filtri();
            self.vibrato += 16.0 * self.dt * 5.3 * std::f32::consts::TAU;
            if self.vibrato > std::f32::consts::TAU {
                self.vibrato -= std::f32::consts::TAU;
            }
        }
        if self.voce + self.soffio + self.fric < 1e-5 {
            // silenzio: si lascia solo spegnere il tratto
            let mut y = 0.0;
            for r in self.tratto.iter_mut() {
                y = r.elabora(y);
            }
            return y * USCITA_G;
        }

        // la sorgente: la glottide
        self.glottide += self.f0 * self.dt;
        if self.glottide >= 1.0 {
            self.glottide -= 1.0;
            // un periodo nuovo: l’intonazione, e il tremito da un periodo all’altro
            let x = (self.frase_t / self.frase_durata.max(0.2)).min(1.0);
            let mut curva = 1.12 - 0.24 * x;
            if self.domanda && x > 0.75 {
                curva += 0.7 * (x - 0.75);
            }
            let f0 = self.f0_base * curva * (1.0 + 0.22 * self.accento) * (1.0 + 0.006 * self.vibrato.sin());
            self.f0 = f0 * (1.0 + 0.012 * self.caso.bianco());
            self.ampiezza = 1.0 + 0.08 * self.caso.bianco();
        }
        let oq = 0.6;
        let aperta = self.glottide < oq;
        let g = if aperta {
            let u = self.glottide / oq;
            2.0 * u - 3.0 * u * u
        } else {
            0.0
        };
        let g = self.inclina.elabora(g * self.ampiezza, 0) * 4.0;
        let n = self.caso.bianco();
        let soffio = n * self.soffio * if aperta { 1.0 } else { 0.4 };
        let mut y = g * self.voce * VOCE_G + soffio * SOFFIO_G;
        for r in self.tratto.iter_mut() {
            y = r.elabora(y);
        }
        y += self.fricativa.banda(self.caso.bianco()) * self.fric * FRIC_G;
        y * USCITA_G
    }
}

#[cfg(test)]
mod prove {
    use super::*;

    #[test]
    fn la_voce_parla_e_tace() {
        let sr = 48000.0;
        let mut v = Voce::nuova(sr, 9, 120.0, 0.85, 1.0, 0.08);
        let mut somma = 0.0f64;
        let mut silenzi = 0;
        let mut massimo = 0.0f32;
        let blocco = 2400;
        for b in 0..200 {
            let mut e = 0.0f64;
            for _ in 0..blocco {
                let y = v.campione();
                assert!(y.is_finite());
                massimo = massimo.max(y.abs());
                e += (y * y) as f64;
            }
            somma += e;
            if e / (blocco as f64) < 1e-7 && b > 0 {
                silenzi += 1;
            }
        }
        let rms = (somma / (200.0 * blocco as f64)).sqrt();
        assert!(rms > 0.005, "rms {rms}");
        assert!(massimo < 4.0, "massimo {massimo}");
        // fra una frase e l’altra la voce tace
        assert!(silenzi > 0);
    }
}
