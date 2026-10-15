//! I fondi che non smettono mai: la ventilazione e le pompe della Santa Maria, la
//! ventola della tuta. Tutti sintetizzati dal rumore, con le derive lente che li
//! tengono vivi: niente anelli, niente ripetizioni.
//!
//! Sulla Santa Maria nessun suono deve avere un’altezza che litighi con il re
//! (bibbia sonora, §1.3): dove la ventilazione risuona, risuona sugli armonici del
//! re, come se i condotti fossero tagliati sulla sua misura.

use std::f32::consts::TAU;

use super::colpi::Bolla;
use super::dsp::{campana, Caso, Lento, Modo, Rosa, Scorrevole, Svf, UnPolo};
use super::re::RE;

// -------------------------------------------------------------------------------------
//  La ventilazione della Santa Maria
// -------------------------------------------------------------------------------------

/// L’aria che corre nei condotti: il corpo del soffio (rumore rosa sotto il kHz),
/// i condotti che risuonano piano sugli armonici del re, il sibilo della griglia
/// intorno ai 2,5 kHz che trema con la turbolenza.
pub struct Ventilazione {
    caso: Caso,
    rosa: [Rosa; 2],
    corpo: [UnPolo; 2],
    sotto: [Svf; 2],
    condotti: [[Svf; 3]; 2],
    griglia: [Svf; 2],
    deriva: Lento,
    turbo: [Lento; 2],
    dt: f32,
    /// il volume, lineare
    pub g: Scorrevole,
    /// il colore della bocchetta: 1 in plancia (piccola), meno dove è lontana
    pub griglia_g: f32,
}

impl Ventilazione {
    pub fn nuova(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let condotto = |k: usize| Svf::nuovo((RE * (k + 1) as f64) as f32, 3.0, sr);
        let deriva = Lento::nuovo((2.0, 7.0), &mut caso);
        let turbo = [Lento::nuovo((0.04, 0.16), &mut caso), Lento::nuovo((0.04, 0.16), &mut caso)];
        Ventilazione {
            caso,
            rosa: [Rosa::default(); 2],
            corpo: [UnPolo::nuovo(800.0, sr); 2],
            sotto: [Svf::nuovo(45.0, 0.7, sr); 2],
            condotti: [[condotto(0), condotto(1), condotto(2)], [condotto(0), condotto(1), condotto(2)]],
            griglia: [Svf::nuovo(2200.0, 0.7, sr), Svf::nuovo(2350.0, 0.7, sr)],
            deriva,
            turbo,
            dt: 1.0 / sr,
            g: Scorrevole::nuovo(0.0),
            griglia_g: 1.0,
        }
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let g = self.g.passo();
        if g < 1e-5 {
            return (0.0, 0.0);
        }
        let vita = 1.0 + 0.16 * self.deriva.campione(self.dt, &mut self.caso);
        let comune = self.caso.bianco();
        let mut out = [0.0f32; 2];
        for (c, o) in out.iter_mut().enumerate() {
            // i due lati condividono un poco del soffio: lo stereo di una stanza piccola
            let w = 0.55 * comune + 0.83 * self.caso.bianco();
            let p = self.rosa[c].campione(w);
            // il corpo, senza il rombo sotto i 45 Hz
            let corpo = self.corpo[c].elabora(p, 0) * 1.3;
            let corpo = corpo - self.sotto[c].basso(corpo);
            let condotti = self.condotti[c][0].banda(p) * 0.5 + self.condotti[c][1].banda(p) * 0.35 + self.condotti[c][2].banda(p) * 0.2;
            let turbo = 1.0 + 0.35 * self.turbo[c].campione(self.dt, &mut self.caso);
            let griglia = self.griglia[c].banda(w) * turbo * 0.2 * self.griglia_g;
            *o = (corpo * 1.6 + condotti * 0.9 + griglia) * vita;
        }
        (out[0] * g, out[1] * g)
    }
}

// -------------------------------------------------------------------------------------
//  Le pompe e il fluido
// -------------------------------------------------------------------------------------

/// Una pompa a pistone: a ogni corsa il soffio del fluido spinto, e all’inizio il
/// colpo della valvola.
struct Pompa {
    fase: f32,
    frequenza: f32,
    soffio: Svf,
    valvola: [Modo; 4],
    p: (f32, f32),
}

impl Pompa {
    fn nuova(frequenza: f32, centro: f32, valvola: [f32; 4], p: f32, sr: f32) -> Self {
        Pompa {
            fase: 0.0,
            frequenza,
            soffio: Svf::nuovo(centro, 1.2, sr),
            valvola: [
                Modo::nuovo(valvola[0], 0.12, 1.0, sr),
                Modo::nuovo(valvola[1], 0.09, 0.6, sr),
                Modo::nuovo(valvola[2], 0.05, 0.35, sr),
                Modo::nuovo(valvola[3], 0.02, 0.2, sr),
            ],
            p: super::dsp::pan(p),
        }
    }
}

/// Le pompe della sala macchine e il fluido nei tubi: due pompe a ritmi diversi, che
/// si incontrano e si perdono; il fluido che scorre e ogni tanto gorgoglia.
pub struct Pompe {
    caso: Caso,
    pompe: [Pompa; 2],
    rosa: Rosa,
    fluido: [Svf; 2],
    centro: [Lento; 2],
    bolle: [Option<Bolla>; 4],
    prossima_bolla: f32,
    conto: u32,
    sr: f32,
    dt: f32,
    pub g: Scorrevole,
}

impl Pompe {
    pub fn nuove(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let centro = [Lento::nuovo((1.0, 3.5), &mut caso), Lento::nuovo((1.0, 3.5), &mut caso)];
        Pompe {
            pompe: [
                Pompa::nuova(1.37, 380.0, [163.0, 371.0, 612.0, 1840.0], -0.35, sr),
                Pompa::nuova(0.91, 290.0, [141.0, 327.0, 545.0, 2210.0], 0.4, sr),
            ],
            rosa: Rosa::default(),
            fluido: [Svf::nuovo(450.0, 2.5, sr), Svf::nuovo(600.0, 2.5, sr)],
            centro,
            bolle: [None; 4],
            prossima_bolla: caso.tra(0.5, 2.0),
            conto: 0,
            sr,
            dt: 1.0 / sr,
            g: Scorrevole::nuovo(0.0),
            caso,
        }
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let g = self.g.passo();
        if g < 1e-5 {
            return (0.0, 0.0);
        }
        let mut l = 0.0;
        let mut r = 0.0;
        // le pompe
        for p in self.pompe.iter_mut() {
            p.fase += p.frequenza * self.dt;
            let mut colpo = 0.0;
            if p.fase >= 1.0 {
                p.fase -= 1.0;
                colpo = self.caso.tra(0.7, 1.0);
                p.frequenza *= 1.0 + 0.01 * self.caso.bianco();
                p.frequenza = p.frequenza.clamp(0.7, 1.6);
            }
            let corsa = campana(p.fase / 0.7, 0.35).powf(1.5);
            let soffio = p.soffio.banda(self.caso.bianco()) * corsa * 0.5;
            let mut valvola = 0.0;
            for m in p.valvola.iter_mut() {
                valvola += m.elabora(colpo);
            }
            let s = soffio + valvola * 0.35;
            l += s * p.p.0;
            r += s * p.p.1;
        }
        // il fluido nei tubi: il centro del filtro che deriva
        self.conto = self.conto.wrapping_add(1);
        if self.conto.is_multiple_of(32) {
            for (k, f) in self.fluido.iter_mut().enumerate() {
                let c = 470.0 + 220.0 * self.centro[k].campione(self.dt * 32.0, &mut self.caso) + 80.0 * k as f32;
                f.imposta(c, 2.5, self.sr);
            }
        }
        let p = self.rosa.campione(self.caso.bianco());
        l += self.fluido[0].banda(p) * 0.9;
        r += self.fluido[1].banda(p) * 0.9;
        // ogni tanto il fluido gorgoglia: bolle grandi, basse
        self.prossima_bolla -= self.dt;
        if self.prossima_bolla <= 0.0 {
            self.prossima_bolla = self.caso.tra(0.3, 2.5);
            if let Some(posto) = self.bolle.iter_mut().find(|b| b.is_none()) {
                let raggio = self.caso.tra(0.006, 0.0095);
                *posto = Some(Bolla::nuova(raggio, self.caso.tra(0.1, 0.25), 0.0, self.sr));
            }
        }
        for b in self.bolle.iter_mut() {
            if let Some(bolla) = b {
                match bolla.campione(&mut self.caso) {
                    Some(x) => {
                        l += x * 0.6;
                        r += x * 0.4;
                    }
                    None => *b = None,
                }
            }
        }
        (l * g, r * g)
    }
}

// -------------------------------------------------------------------------------------
//  La ventola della tuta
// -------------------------------------------------------------------------------------

/// La ventola della tuta, dietro la nuca: un soffio morbido con il fremito delle pale
/// e un tono appena accennato che non si ferma mai su una nota.
pub struct Ventola {
    caso: Caso,
    rosa: Rosa,
    corpo: Svf,
    sibilo: Svf,
    tono: f32,
    giro: f32,
    deriva: Lento,
    dt: f32,
    pub g: Scorrevole,
}

impl Ventola {
    pub fn nuova(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let deriva = Lento::nuovo((1.5, 5.0), &mut caso);
        Ventola {
            caso,
            rosa: Rosa::default(),
            corpo: Svf::nuovo(420.0, 0.5, sr),
            sibilo: Svf::nuovo(3200.0, 0.6, sr),
            tono: 0.0,
            giro: 0.0,
            deriva,
            dt: 1.0 / sr,
            g: Scorrevole::nuovo(0.0),
        }
    }

    #[inline]
    pub fn campione(&mut self) -> f32 {
        let g = self.g.passo();
        if g < 1e-5 {
            return 0.0;
        }
        let d = self.deriva.campione(self.dt, &mut self.caso);
        // le pale: sette, a circa 2000 giri; il tono di passaggio deriva di un poco
        let f = 236.0 * (1.0 + 0.008 * d);
        self.tono = (self.tono + TAU * f * self.dt) % TAU;
        self.giro = (self.giro + TAU * f / 7.0 * self.dt) % TAU;
        let w = self.caso.bianco();
        let p = self.rosa.campione(w);
        let fremito = 1.0 + 0.07 * self.giro.sin();
        let y = self.corpo.banda(p) * fremito * 1.4 + self.sibilo.banda(w) * 0.035 + self.tono.sin() * 0.012;
        y * g
    }
}
