//! Il brusio (bibbia sonora, §5.2): «tante voci, una sopra l’altra, nessuna intera».
//! Voci vere (LibriVox, pubblico dominio) smontate in grani più corti di una sillaba,
//! abbassate di qualche semitono, sparse nello spazio: ogni flusso è una voce, e con
//! sei flussi o più nessuna parola sopravvive.

use std::sync::Arc;

use super::campioni::Campione;
use super::dsp::{pan, Caso, Hann, PassaTutto, Scorrevole};

pub const MAX_FLUSSI: usize = 40;
const GRANI: usize = 4;

#[derive(Clone, Copy, Default)]
struct Grano {
    attivo: bool,
    pos: f64,
    passo: f64,
    t: f32,
    durata: f32,
    g: f32,
}

struct Flusso {
    voce: usize,
    grani: [Grano; GRANI],
    attesa: f32,
    gl: f32,
    gr: f32,
    semitoni: f32,
    g: f32,
}

pub struct Brusio {
    voci: Vec<Arc<Campione>>,
    flussi: Vec<Flusso>,
    /// quanti flussi suonano (scorre: i flussi entrano ed escono piano)
    pub quanti: Scorrevole,
    /// il volume, lineare
    pub guadagno: Scorrevole,
    hann: Hann,
    diff: [PassaTutto; 4],
    caso: Caso,
    sr: f32,
    k_flusso: f32,
}

impl Brusio {
    pub fn nuovo(voci: Vec<Arc<Campione>>, sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let n = voci.len().max(1);
        let mut ordine: Vec<usize> = (0..n).collect();
        for i in (1..n).rev() {
            let j = caso.indice(i + 1);
            ordine.swap(i, j);
        }
        let flussi = (0..MAX_FLUSSI)
            .map(|k| {
                let (gl, gr) = pan(caso.tra(-0.85, 0.85));
                Flusso {
                    voce: ordine[k % n],
                    grani: [Grano::default(); GRANI],
                    attesa: caso.tra(0.0, 0.1),
                    gl,
                    gr,
                    semitoni: caso.tra(2.0, 4.0),
                    g: 0.0,
                }
            })
            .collect();
        let ms = |x: f32| (x * sr / 1000.0) as usize;
        Brusio {
            voci,
            flussi,
            quanti: Scorrevole::nuovo(0.0),
            guadagno: Scorrevole::nuovo(0.0),
            hann: Hann::nuova(1024),
            // quattro passa-tutto corti: sbavano le consonanti
            diff: [PassaTutto::nuovo(ms(4.7), 0.55), PassaTutto::nuovo(ms(11.3), 0.5), PassaTutto::nuovo(ms(5.3), 0.55), PassaTutto::nuovo(ms(12.9), 0.5)],
            caso,
            sr,
            k_flusso: 1.0 - (-1.0 / (0.25 * sr)).exp(),
        }
    }

    fn avvia_grano(&mut self, k: usize) {
        let Some(v) = self.voci.get(self.flussi[k].voce).cloned() else { return };
        let f = &mut self.flussi[k];
        let Some(slot) = f.grani.iter().position(|g| !g.attivo) else { return };
        let durata = self.caso.tra(0.06, 0.22);
        let semitoni = f.semitoni + self.caso.tra(-0.3, 0.3);
        let velocita = 2f64.powf(-semitoni as f64 / 12.0);
        let passo = v.sr as f64 / self.sr as f64 * velocita;
        let serve = (durata as f64 * self.sr as f64 * passo) + 2.0;
        let n = v.frame() as f64;
        if n <= serve + 2.0 {
            return;
        }
        let rovescio = self.caso.una_su(6);
        let inizio = self.caso.f() as f64 * (n - serve - 2.0);
        f.grani[slot] = Grano {
            attivo: true,
            pos: if rovescio { inizio + serve } else { inizio },
            passo: if rovescio { -passo } else { passo },
            t: 0.0,
            durata,
            g: self.caso.tra(0.6, 1.0),
        };
    }

    #[inline]
    pub fn campione(&mut self, dt: f32) -> (f32, f32) {
        let quanti = self.quanti.passo();
        let guadagno = self.guadagno.passo();
        if guadagno < 1e-5 && quanti < 0.01 {
            return (0.0, 0.0);
        }
        let mut l = 0.0;
        let mut r = 0.0;
        for k in 0..MAX_FLUSSI {
            let meta = if (k as f32) < quanti { 1.0 } else { 0.0 };
            {
                let f = &mut self.flussi[k];
                f.g += (meta - f.g) * self.k_flusso;
                if f.g < 1e-4 && meta == 0.0 {
                    continue;
                }
                f.attesa -= dt;
            }
            if self.flussi[k].attesa <= 0.0 && meta > 0.0 {
                self.avvia_grano(k);
                self.flussi[k].attesa = self.caso.tra(0.04, 0.12);
            }
            let f = &mut self.flussi[k];
            let v = &self.voci[f.voce];
            let mut s = 0.0;
            for g in f.grani.iter_mut() {
                if !g.attivo {
                    continue;
                }
                let (x, _) = v.leggi(g.pos);
                s += x * self.hann.a(g.t / g.durata) * g.g;
                g.pos += g.passo;
                g.t += dt;
                if g.t >= g.durata {
                    g.attivo = false;
                }
            }
            s *= f.g;
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
