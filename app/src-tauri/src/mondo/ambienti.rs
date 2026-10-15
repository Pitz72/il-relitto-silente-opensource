//! Gli strati continui delle stanze del relitto e degli stati della partita, tutti
//! sintetizzati (bibbia sonora, §3 e §10): il fondo dell’aria ferma, i ronzii delle
//! macchine intorno al sol diesis, il groviglio, i battiti nelle ossa, il fischio
//! dell’orecchio, il tremito della fuga, i soffi d’aria, i crepitii, il canale della
//! radio, le toppe della sala macchine. Ognuno tiene il valore efficace intorno a 0,1
//! quando il suo volume è 1: i livelli si danno nel mix (mod.rs, regia.rs).

use std::f32::consts::TAU;

use super::dsp::{campana, pan, Caso, Lento, Modo, Rosa, Scorrevole, Svf, UnPolo};

/// Il sol diesis delle macchine del relitto, a un tritono dal re (bibbia, §1.3).
pub const SOL_DIESIS: f32 = 207.652_35; // sol♯₃

// -------------------------------------------------------------------------------------
//  Il fondo: l’aria ferma di una stanza
// -------------------------------------------------------------------------------------

/// L’aria ferma di una stanza del relitto: rumore rosa scurito, con una deriva lenta;
/// nel santuario centrale, il respiro lentissimo della stanza che aspetta.
pub struct Fondo {
    caso: Caso,
    rosa: [Rosa; 2],
    lp: [Svf; 2],
    hp: [Svf; 2],
    deriva: Lento,
    fase: f32,
    periodo: f32,
    profondita: Scorrevole,
    taglio: f32,
    k: f32,
    sr: f32,
    dt: f32,
    pub g: Scorrevole,
}

impl Fondo {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let deriva = Lento::nuovo((3.0, 9.0), &mut caso);
        let mut f = Fondo {
            caso,
            rosa: [Rosa::default(); 2],
            lp: [Svf::default(); 2],
            hp: [Svf::nuovo(35.0, 0.7, sr), Svf::nuovo(35.0, 0.7, sr)],
            deriva,
            fase: 0.0,
            periodo: 0.0,
            profondita: Scorrevole::nuovo(0.0),
            taglio: 0.0,
            k: 1.0,
            sr,
            dt: 1.0 / sr,
            g: Scorrevole::nuovo(0.0),
        };
        f.imposta(600.0, (0.0, 0.0), 0.0);
        f
    }

    /// Il colore (il passa-basso) e il respiro della stanza: (periodo in s, profondità).
    pub fn imposta(&mut self, taglio: f32, respiro: (f32, f32), secondi: f32) {
        if (taglio - self.taglio).abs() > 1.0 {
            self.taglio = taglio;
            for f in self.lp.iter_mut() {
                f.imposta(taglio, 0.6, self.sr);
            }
            // il rosa ha la stessa energia per ottava: si compensa la parte che il filtro toglie
            self.k = (6.9 / (taglio / 20.0).max(1.5).ln()).sqrt() * 1.05;
        }
        if respiro.0 > 0.0 {
            self.periodo = respiro.0;
        }
        self.profondita.verso(respiro.1, secondi, self.sr);
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let g = self.g.passo();
        let prof = self.profondita.passo();
        if g < 1e-5 {
            return (0.0, 0.0);
        }
        let vita = 1.0 + 0.12 * self.deriva.campione(self.dt, &mut self.caso);
        let mut respiro = 1.0;
        if self.periodo > 0.0 && prof > 1e-4 {
            self.fase = (self.fase + self.dt / self.periodo) % 1.0;
            // un respiro: sale piano, si ferma, scende
            respiro = 1.0 - prof * (0.5 + 0.5 * (TAU * self.fase).cos());
        }
        let comune = self.caso.bianco();
        let mut out = [0.0f32; 2];
        for (c, o) in out.iter_mut().enumerate() {
            let w = 0.6 * comune + 0.8 * self.caso.bianco();
            let p = self.rosa[c].campione(w);
            let y = self.lp[c].basso(p);
            *o = self.hp[c].alto(y) * self.k;
        }
        let s = g * vita * respiro;
        (out[0] * s, out[1] * s)
    }
}

// -------------------------------------------------------------------------------------
//  I ronzii
// -------------------------------------------------------------------------------------

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum FormaRonzio {
    /// più voci appena scordate, che battono insieme: i proiettori dello scriptorium
    Coro,
    /// una voce che si accende e si spegne, «come se aspettasse qualcosa»: il pilastro
    Pulsante,
    /// una voce ferma e calda: il pilastro salutato
    Continuo,
    /// un ronzio fitto di armonici: il laboratorio quando torna l’energia
    Denso,
    /// un ronzio che passa e ripassa lungo le file: il campo delle teche
    Passante,
}

const VOCI_RONZIO: usize = 6;

/// Un ronzio elettrico intorno al sol diesis (§1.3): le macchine del relitto suonano
/// lontane da casa.
pub struct Ronzio {
    fasi: [[f32; 5]; VOCI_RONZIO],
    freq: [f32; VOCI_RONZIO],
    pan: [(f32, f32); VOCI_RONZIO],
    n: usize,
    armonici: [f32; 5],
    norma: f32,
    forma: FormaRonzio,
    deriva: [Lento; VOCI_RONZIO],
    acceso: bool,
    resta: f32,
    inviluppo: Scorrevole,
    passaggio: f32,
    caso: Caso,
    sr: f32,
    dt: f32,
    pub g: Scorrevole,
}

impl Ronzio {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let deriva = std::array::from_fn(|_| Lento::nuovo((1.0, 4.0), &mut caso));
        let mut r = Ronzio {
            fasi: [[0.0; 5]; VOCI_RONZIO],
            freq: [SOL_DIESIS; VOCI_RONZIO],
            pan: [(0.707, 0.707); VOCI_RONZIO],
            n: 1,
            armonici: [1.0, 0.0, 0.0, 0.0, 0.0],
            norma: 1.0,
            forma: FormaRonzio::Continuo,
            deriva,
            acceso: true,
            resta: 1.0,
            inviluppo: Scorrevole::nuovo(1.0),
            passaggio: 0.0,
            caso,
            sr,
            dt: 1.0 / sr,
            g: Scorrevole::nuovo(0.0),
        };
        r.imposta(FormaRonzio::Continuo);
        r
    }

    pub fn imposta(&mut self, forma: FormaRonzio) {
        self.forma = forma;
        let (n, base, armonici, scarto): (usize, f32, [f32; 5], f32) = match forma {
            FormaRonzio::Coro => (6, SOL_DIESIS, [1.0, 0.35, 0.2, 0.08, 0.04], 0.006),
            FormaRonzio::Pulsante => (2, SOL_DIESIS / 2.0, [1.0, 0.5, 0.3, 0.15, 0.05], 0.002),
            FormaRonzio::Continuo => (2, SOL_DIESIS / 2.0, [1.0, 0.7, 0.35, 0.12, 0.05], 0.0015),
            FormaRonzio::Denso => (3, SOL_DIESIS, [1.0, 0.8, 0.65, 0.5, 0.4], 0.004),
            FormaRonzio::Passante => (2, SOL_DIESIS * 2.0, [1.0, 0.45, 0.3, 0.2, 0.1], 0.003),
        };
        self.n = n;
        self.armonici = armonici;
        let energia: f32 = armonici.iter().map(|a| a * a).sum();
        self.norma = 0.1 * std::f32::consts::SQRT_2 / (energia * n as f32).sqrt();
        for k in 0..n {
            let s = if n == 1 { 0.0 } else { k as f32 / (n - 1) as f32 * 2.0 - 1.0 };
            self.freq[k] = base * (1.0 + scarto * s + 0.0007 * self.caso.bianco());
            self.pan[k] = pan(s * 0.7);
        }
        self.acceso = true;
        self.resta = 1.0;
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let g = self.g.passo();
        if g < 1e-5 {
            return (0.0, 0.0);
        }
        // l’inviluppo della forma
        match self.forma {
            FormaRonzio::Pulsante => {
                self.resta -= self.dt;
                if self.resta <= 0.0 {
                    self.acceso = !self.acceso;
                    self.resta = if self.acceso { self.caso.tra(0.5, 1.4) } else { self.caso.tra(0.9, 2.8) };
                    self.inviluppo.verso(if self.acceso { 1.0 } else { 0.05 }, 0.18, self.sr);
                }
            }
            FormaRonzio::Passante => {
                self.resta -= self.dt;
                if self.resta <= 0.0 {
                    self.acceso = !self.acceso;
                    self.resta = if self.acceso { self.caso.tra(1.2, 2.5) } else { self.caso.tra(2.0, 6.0) };
                    self.inviluppo.verso(if self.acceso { 1.0 } else { 0.0 }, 0.6, self.sr);
                }
                self.passaggio = (self.passaggio + self.dt * 0.35) % 2.0;
            }
            _ => {}
        }
        let inv = self.inviluppo.passo();
        if inv < 1e-4 {
            return (0.0, 0.0);
        }
        let mut l = 0.0;
        let mut r = 0.0;
        for k in 0..self.n {
            let f = self.freq[k] * (1.0 + 0.0012 * self.deriva[k].campione(self.dt, &mut self.caso));
            let mut s = 0.0;
            for (h, a) in self.armonici.iter().enumerate() {
                if *a <= 0.0 {
                    continue;
                }
                let fase = &mut self.fasi[k][h];
                *fase += TAU * f * (h + 1) as f32 * self.dt;
                if *fase > TAU {
                    *fase -= TAU;
                }
                s += fase.sin() * a;
            }
            let (pl, pr) = if self.forma == FormaRonzio::Passante {
                // il campo che corre lungo le file, da un lato all’altro
                pan(self.passaggio - 1.0)
            } else {
                self.pan[k]
            };
            l += s * pl;
            r += s * pr;
        }
        let k = self.norma * g * inv;
        (l * k, r * k)
    }
}

// -------------------------------------------------------------------------------------
//  Il groviglio
// -------------------------------------------------------------------------------------

#[derive(Clone, Copy, Default)]
struct Grano {
    attivo: bool,
    t: f32,
    durata: f32,
    cima: f32,
    fc0: f32,
    fc1: f32,
    q: f32,
    g: f32,
    gl: f32,
    gr: f32,
    filtro: Svf,
    umido: UnPolo,
}

const GRANI: usize = 16;

/// Il groviglio: «filamenti pallidi, spessi come una fune» (§5.6). Fruscii umidi e
/// pesanti, ognuno con il suo posto nello spazio; con il faro pieno si avvicinano, con
/// il faro basso girano e cercano, con il bengala vanno tutti verso il finto sole,
/// nella fuga frustano.
pub struct Groviglio {
    grani: [Grano; GRANI],
    caso: Caso,
    sr: f32,
    dt: f32,
    prossimo: f32,
    lontano: [UnPolo; 2],
    conto: u32,
    /// grani al secondo
    pub densita: Scorrevole,
    /// 0 lontano, 1 addosso: il volume e la chiarezza
    pub vicino: Scorrevole,
    /// dove sta, da −1 (sinistra) a 1 (destra)
    pub centro: Scorrevole,
    /// quanto è sparso intorno al centro
    pub larghezza: Scorrevole,
    /// 0 fruscii, 1 frustate molli e cieche
    pub frusta: Scorrevole,
    pub g: Scorrevole,
}

impl Groviglio {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        Groviglio {
            grani: [Grano::default(); GRANI],
            caso: Caso::nuovo(seme),
            sr,
            dt: 1.0 / sr,
            prossimo: 0.0,
            lontano: [UnPolo::nuovo(3000.0, sr); 2],
            conto: 0,
            densita: Scorrevole::nuovo(4.0),
            vicino: Scorrevole::nuovo(0.3),
            centro: Scorrevole::nuovo(0.0),
            larghezza: Scorrevole::nuovo(0.8),
            frusta: Scorrevole::nuovo(0.0),
            g: Scorrevole::nuovo(0.0),
        }
    }

    fn nasce(&mut self, frusta: f32, centro: f32, larghezza: f32) {
        let Some(k) = self.grani.iter().position(|g| !g.attivo) else { return };
        let c = &mut self.caso;
        let colpo = c.f() < frusta;
        let fc0 = if colpo { c.tra(250.0, 700.0) } else { c.tra(350.0, 1500.0) };
        let p = (centro + larghezza * c.bianco()).clamp(-1.0, 1.0);
        let (gl, gr) = pan(p);
        let mut filtro = Svf::default();
        filtro.imposta(fc0, 2.0, self.sr);
        self.grani[k] = Grano {
            attivo: true,
            t: 0.0,
            durata: if colpo { c.tra(0.05, 0.14) } else { c.tra(0.08, 0.38) },
            cima: if colpo { 0.06 } else { c.tra(0.15, 0.4) },
            fc0,
            fc1: fc0 * c.tra(0.45, 0.7),
            q: c.tra(1.4, 3.5),
            g: if colpo { c.tra(1.4, 2.4) } else { c.tra(0.4, 1.0) },
            gl,
            gr,
            filtro,
            umido: UnPolo::nuovo(c.tra(60.0, 180.0), self.sr),
        };
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let g = self.g.passo();
        let densita = self.densita.passo();
        let vicino = self.vicino.passo();
        let centro = self.centro.passo();
        let larghezza = self.larghezza.passo();
        let frusta = self.frusta.passo();
        if g < 1e-5 {
            return (0.0, 0.0);
        }
        self.prossimo -= self.dt;
        if self.prossimo <= 0.0 {
            self.nasce(frusta, centro, larghezza);
            // gli intervalli di un processo di Poisson: mai un ritmo
            let u = self.caso.f().max(1e-4);
            self.prossimo = -u.ln() / densita.max(0.05);
        }
        self.conto = self.conto.wrapping_add(1);
        let aggiorna = self.conto.is_multiple_of(16);
        if aggiorna {
            let taglio = 700.0 + 5200.0 * vicino * vicino;
            for f in self.lontano.iter_mut() {
                f.imposta(taglio, self.sr);
            }
        }
        let mut l = 0.0;
        let mut r = 0.0;
        for gr in self.grani.iter_mut() {
            if !gr.attivo {
                continue;
            }
            let x = gr.t / gr.durata;
            if x >= 1.0 {
                gr.attivo = false;
                continue;
            }
            if aggiorna {
                let fc = gr.fc0 + (gr.fc1 - gr.fc0) * x;
                gr.filtro.imposta(fc, gr.q, self.sr);
            }
            // l’umido: il rumore che tremola in fretta, come qualcosa di bagnato che scivola
            let tremolio = gr.umido.elabora(self.caso.bianco(), 0).abs() * 9.0;
            let n = self.caso.bianco() * (0.35 + tremolio);
            let y = gr.filtro.banda(n) * campana(x, gr.cima) * gr.g;
            l += y * gr.gl;
            r += y * gr.gr;
            gr.t += self.dt;
        }
        let k = g * (0.25 + 0.75 * vicino) * 3.3;
        (self.lontano[0].elabora(l, 0) * k, self.lontano[1].elabora(r, 0) * k)
    }
}

// -------------------------------------------------------------------------------------
//  I battiti nelle ossa
// -------------------------------------------------------------------------------------

#[derive(Clone, Copy, Default)]
struct Colpetto {
    fase: f32,
    f: f32,
    f1: f32,
    kf: f32,
    a: f32,
    ka: f32,
    ritardo: f32,
}

/// Un battito che si sente nelle ossa: il seme (lento, sotto i 60 Hz, un colpo
/// solo), il cuore dell’anticamera (due colpi, lub-dub).
pub struct Battito {
    colpi: [Colpetto; 2],
    t: f32,
    pub periodo: f32,
    pub doppio: bool,
    pub f: f32,
    pub spegne: f32,
    caso: Caso,
    sr: f32,
    dt: f32,
    pub g: Scorrevole,
}

impl Battito {
    pub fn nuovo(sr: f32, seme: u64, periodo: f32, f: f32, doppio: bool, spegne: f32) -> Self {
        Battito {
            colpi: [Colpetto::default(); 2],
            t: 0.0,
            periodo,
            doppio,
            f,
            spegne,
            caso: Caso::nuovo(seme),
            sr,
            dt: 1.0 / sr,
            g: Scorrevole::nuovo(0.0),
        }
    }

    fn colpisci(&mut self, k: usize, a: f32, ritardo: f32) {
        self.colpi[k] = Colpetto {
            fase: 0.0,
            f: self.f * 1.35,
            f1: self.f,
            kf: (-1.0 / (0.03 * self.sr)).exp(),
            a,
            ka: (-6.907_755 / (self.spegne * self.sr)).exp(),
            ritardo,
        };
    }

    #[inline]
    pub fn campione(&mut self) -> f32 {
        let g = self.g.passo();
        if g < 1e-5 {
            self.t = 0.0;
            return 0.0;
        }
        self.t += self.dt;
        if self.t >= self.periodo {
            self.t = self.caso.tra(-0.03, 0.03) * self.periodo;
            let a = self.caso.tra(0.85, 1.0);
            self.colpisci(0, a, 0.0);
            if self.doppio {
                self.colpisci(1, a * 0.7, 0.28 * self.periodo.min(1.0));
            }
        }
        let mut y = 0.0;
        for c in self.colpi.iter_mut() {
            if c.a < 1e-5 {
                continue;
            }
            if c.ritardo > 0.0 {
                c.ritardo -= self.dt;
                continue;
            }
            c.f = c.f1 + (c.f - c.f1) * c.kf;
            c.fase += TAU * c.f * self.dt;
            if c.fase > TAU {
                c.fase -= TAU;
            }
            y += c.fase.sin() * c.a;
            c.a *= c.ka;
        }
        y * g * 0.3
    }
}

// -------------------------------------------------------------------------------------
//  Il fischio dell’orecchio
// -------------------------------------------------------------------------------------

/// Il tono sottile e altissimo che si sente davvero in una camera anecoica.
pub struct Acufene {
    fase: f32,
    vibrato: f32,
    dt: f32,
    pub g: Scorrevole,
}

impl Acufene {
    pub fn nuovo(sr: f32) -> Self {
        Acufene { fase: 0.0, vibrato: 0.0, dt: 1.0 / sr, g: Scorrevole::nuovo(0.0) }
    }

    #[inline]
    pub fn campione(&mut self) -> f32 {
        let g = self.g.passo();
        if g < 1e-6 {
            return 0.0;
        }
        self.vibrato = (self.vibrato + TAU * 0.23 * self.dt) % TAU;
        let f = 8200.0 * (1.0 + 0.0008 * self.vibrato.sin());
        self.fase = (self.fase + TAU * f * self.dt) % TAU;
        self.fase.sin() * 0.14 * g
    }
}

// -------------------------------------------------------------------------------------
//  Il tremito
// -------------------------------------------------------------------------------------

/// Il tremito della nave nella fuga: un rombo sotto i 50 Hz, nelle ossa, con le sue
/// scosse.
pub struct Tremito {
    caso: Caso,
    lp1: Svf,
    lp2: Svf,
    deriva: Lento,
    scosse: Lento,
    dt: f32,
    pub g: Scorrevole,
}

impl Tremito {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let deriva = Lento::nuovo((0.3, 1.2), &mut caso);
        let scosse = Lento::nuovo((2.0, 6.0), &mut caso);
        Tremito { caso, lp1: Svf::nuovo(48.0, 0.8, sr), lp2: Svf::nuovo(48.0, 0.8, sr), deriva, scosse, dt: 1.0 / sr, g: Scorrevole::nuovo(0.0) }
    }

    #[inline]
    pub fn campione(&mut self) -> f32 {
        let g = self.g.passo();
        if g < 1e-5 {
            return 0.0;
        }
        let d = 0.55 + 0.45 * self.deriva.campione(self.dt, &mut self.caso);
        let s = self.scosse.campione(self.dt, &mut self.caso).max(0.0);
        let n = self.lp2.basso(self.lp1.basso(self.caso.bianco()));
        n * (d + 1.2 * s * s) * 9.0 * g
    }
}

// -------------------------------------------------------------------------------------
//  I soffi
// -------------------------------------------------------------------------------------

/// Un soffio di rumore in una banda che si sposta piano: il filo d’aria in un tubo,
/// l’aria fra le canne, la polvere che cade, la fiamma del bengala.
pub struct Soffio {
    caso: Caso,
    filtri: [Svf; 2],
    centro: (f32, f32),
    q: f32,
    deriva: [Lento; 2],
    ampiezza: Lento,
    conto: u32,
    k: f32,
    sr: f32,
    dt: f32,
    pub g: Scorrevole,
}

impl Soffio {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let deriva = [Lento::nuovo((1.5, 5.0), &mut caso), Lento::nuovo((1.5, 5.0), &mut caso)];
        let ampiezza = Lento::nuovo((0.8, 3.0), &mut caso);
        let mut s = Soffio {
            caso,
            filtri: [Svf::default(); 2],
            centro: (400.0, 900.0),
            q: 4.0,
            deriva,
            ampiezza,
            conto: 0,
            k: 1.0,
            sr,
            dt: 1.0 / sr,
            g: Scorrevole::nuovo(0.0),
        };
        s.imposta((400.0, 900.0), 4.0);
        s
    }

    /// La banda in cui si muove (Hz) e quanto è stretta.
    pub fn imposta(&mut self, centro: (f32, f32), q: f32) {
        self.centro = centro;
        self.q = q;
        let medio = (centro.0 * centro.1).sqrt();
        // il bianco (valore efficace 0,58) in una banda larga medio/q: si riporta a 0,1
        self.k = 0.1 / 0.58 / ((medio / q) / (self.sr * 0.5)).sqrt().max(1e-3);
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let g = self.g.passo();
        if g < 1e-5 {
            return (0.0, 0.0);
        }
        self.conto = self.conto.wrapping_add(1);
        if self.conto.is_multiple_of(32) {
            for c in 0..2 {
                let d = 0.5 + 0.5 * self.deriva[c].campione(self.dt * 32.0, &mut self.caso);
                let fc = self.centro.0 * (self.centro.1 / self.centro.0).powf(d);
                self.filtri[c].imposta(fc, self.q, self.sr);
            }
        }
        let a = 0.7 + 0.3 * self.ampiezza.campione(self.dt, &mut self.caso);
        let k = self.k * a * g;
        (self.filtri[0].banda(self.caso.bianco()) * k, self.filtri[1].banda(self.caso.bianco()) * k)
    }
}

// -------------------------------------------------------------------------------------
//  I crepitii
// -------------------------------------------------------------------------------------

/// Una pioggia fitta di granelli: la statica sotto il casco, le scintille di un
/// proiettore rotto, la polvere, la fiamma. A raffiche, mai a ritmo.
pub struct Crepitio {
    caso: Caso,
    modi: [[Modo; 3]; 2],
    passaalto: [Svf; 2],
    raffiche: Lento,
    /// granelli al secondo, nei momenti più fitti
    densita: f32,
    /// quanto le raffiche contano (0 = sempre uguale)
    a_raffiche: f32,
    dt: f32,
    pub g: Scorrevole,
}

impl Crepitio {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let raffiche = Lento::nuovo((0.2, 1.5), &mut caso);
        let mut c = Crepitio {
            caso,
            modi: [[Modo::default(); 3]; 2],
            passaalto: [Svf::nuovo(1500.0, 0.7, sr); 2],
            raffiche,
            densita: 10.0,
            a_raffiche: 0.5,
            dt: 1.0 / sr,
            g: Scorrevole::nuovo(0.0),
        };
        c.imposta(10.0, 0.5, [2400.0, 3700.0, 5300.0], 0.01, 1500.0, sr);
        c
    }

    /// La densità (al secondo), le raffiche (0–1), le risonanze del materiale e quanto
    /// durano, il passa-alto.
    pub fn imposta(&mut self, densita: f32, raffiche: f32, risonanze: [f32; 3], t60: f32, passaalto: f32, sr: f32) {
        self.densita = densita;
        self.a_raffiche = raffiche;
        for lato in self.modi.iter_mut() {
            for (k, m) in lato.iter_mut().enumerate() {
                *m = Modo::nuovo(risonanze[k] * self.caso.tra(0.95, 1.05), t60 * (1.0 - 0.2 * k as f32), 0.6 / (k + 1) as f32, sr);
            }
        }
        for f in self.passaalto.iter_mut() {
            f.imposta(passaalto, 0.7, sr);
        }
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let g = self.g.passo();
        if g < 1e-5 {
            return (0.0, 0.0);
        }
        let r = 0.5 + 0.5 * self.raffiche.campione(self.dt, &mut self.caso);
        let p = self.densita * self.dt * (1.0 - self.a_raffiche + self.a_raffiche * 2.0 * r * r);
        let mut out = [0.0f32; 2];
        for (lato, o) in out.iter_mut().enumerate() {
            let mut x = 0.0;
            if self.caso.f() < p * 0.5 {
                // granelli di forza diversa: pochi forti, molti deboli
                let f = self.caso.f();
                x = self.caso.bianco().signum() * f * f * f * 3.0 + self.caso.bianco() * 0.2;
            }
            let mut y = self.passaalto[lato].alto(x) * 0.4;
            for m in self.modi[lato].iter_mut() {
                y += m.elabora(x);
            }
            *o = y * g * 0.5;
        }
        (out[0], out[1])
    }
}

// -------------------------------------------------------------------------------------
//  Il canale della radio
// -------------------------------------------------------------------------------------

/// Il canale aperto con Magazzino Quattro: il fruscio della linea, e dietro il
/// magazzino («un muletto in retromarcia, qualcuno che litiga con una bolla di
/// carico»): il cicalino del muletto, qualche colpo lontano.
pub struct Canale {
    caso: Caso,
    fruscio: Svf,
    cicalino: f32,
    fase: f32,
    resta: f32,
    prossimo: f32,
    colpo: [Modo; 3],
    prossimo_colpo: f32,
    sr: f32,
    dt: f32,
    pub g: Scorrevole,
}

impl Canale {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let prossimo = caso.tra(2.0, 6.0);
        Canale {
            fruscio: Svf::nuovo(1600.0, 0.5, sr),
            cicalino: 0.0,
            fase: 0.0,
            resta: 0.0,
            prossimo,
            colpo: [Modo::default(); 3],
            prossimo_colpo: caso.tra(3.0, 9.0),
            caso,
            sr,
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
        let mut y = self.fruscio.banda(self.caso.bianco()) * 0.5;
        // il muletto in retromarcia: bip a 1,1 kHz, mezzo secondo sì e mezzo no
        self.prossimo -= self.dt;
        if self.prossimo <= 0.0 && self.resta <= 0.0 {
            self.resta = self.caso.tra(2.5, 5.0);
            self.prossimo = self.resta + self.caso.tra(12.0, 30.0);
        }
        if self.resta > 0.0 {
            self.resta -= self.dt;
            self.cicalino = (self.cicalino + self.dt) % 1.0;
            if self.cicalino < 0.5 {
                self.fase = (self.fase + TAU * 1120.0 * self.dt) % TAU;
                let bordo = (self.cicalino / 0.01).min(1.0) * ((0.5 - self.cicalino) / 0.01).min(1.0);
                y += self.fase.sin() * 0.05 * bordo;
            }
        }
        // un colpo lontano nel magazzino
        self.prossimo_colpo -= self.dt;
        let mut x = 0.0;
        if self.prossimo_colpo <= 0.0 {
            self.prossimo_colpo = self.caso.tra(4.0, 14.0);
            let s = self.caso.tra(0.8, 1.25);
            self.colpo = [
                Modo::nuovo(310.0 * s, 0.25, 0.5, self.sr),
                Modo::nuovo(780.0 * s, 0.15, 0.3, self.sr),
                Modo::nuovo(1450.0 * s, 0.08, 0.2, self.sr),
            ];
            x = 1.0;
        }
        for m in self.colpo.iter_mut() {
            y += m.elabora(x) * 0.12;
        }
        y * g
    }
}

// -------------------------------------------------------------------------------------
//  Le toppe della sala macchine
// -------------------------------------------------------------------------------------

/// Il cilindro del reattore è «rattoppato in tre punti»: tre vibrazioni di metallo che
/// il quarto armonico del re (re₄) accende a ondate lente, ognuna con i suoi parziali
/// stonati.
pub struct Toppe {
    fasi: [[f32; 3]; 3],
    onde: [Lento; 3],
    caso: Caso,
    dt: f32,
    pub g: Scorrevole,
}

const PARZIALI_TOPPE: [f32; 3] = [1.0, 2.76, 5.40];

impl Toppe {
    pub fn nuove(sr: f32, seme: u64) -> Self {
        let mut caso = Caso::nuovo(seme);
        let onde = std::array::from_fn(|_| Lento::nuovo((3.0, 9.0), &mut caso));
        Toppe { fasi: [[0.0; 3]; 3], onde, caso, dt: 1.0 / sr, g: Scorrevole::nuovo(0.0) }
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let g = self.g.passo();
        if g < 1e-5 {
            return (0.0, 0.0);
        }
        let re4 = (super::re::RE * 4.0) as f32;
        let mut l = 0.0;
        let mut r = 0.0;
        for t in 0..3 {
            let onda = (0.5 + 0.5 * self.onde[t].campione(self.dt, &mut self.caso)).powf(3.0);
            let mut s = 0.0;
            for (p, rapporto) in PARZIALI_TOPPE.iter().enumerate() {
                let fase = &mut self.fasi[t][p];
                // le toppe sono di misura diversa: i parziali alti un poco diversi
                let f = re4 * if p == 0 { 1.0 } else { rapporto * (1.0 + 0.013 * t as f32) };
                *fase = (*fase + TAU * f * self.dt) % TAU;
                s += fase.sin() / (1.0 + 2.5 * p as f32);
            }
            let (pl, pr) = pan(t as f32 - 1.0);
            l += s * onda * pl;
            r += s * onda * pr;
        }
        (l * g * 0.12, r * g * 0.12)
    }
}

#[cfg(test)]
mod prove {
    use super::*;

    fn rms(mut f: impl FnMut() -> (f32, f32), secondi: f32) -> f32 {
        let n = (48000.0 * secondi) as usize;
        let mut e = 0.0f64;
        for _ in 0..n {
            let (l, r) = f();
            assert!(l.is_finite() && r.is_finite());
            e += ((l * l + r * r) * 0.5) as f64;
        }
        (e / n as f64).sqrt() as f32
    }

    #[test]
    fn gli_strati_stanno_intorno_a_un_decimo() {
        let sr = 48000.0;
        let mut f = Fondo::nuovo(sr, 1);
        f.g = Scorrevole::nuovo(1.0);
        let v = rms(|| f.campione(), 10.0);
        assert!(v > 0.05 && v < 0.2, "fondo {v}");
        let mut r = Ronzio::nuovo(sr, 2);
        r.imposta(FormaRonzio::Coro);
        r.g = Scorrevole::nuovo(1.0);
        let v = rms(|| r.campione(), 5.0);
        assert!(v > 0.05 && v < 0.2, "ronzio {v}");
        let mut s = Soffio::nuovo(sr, 3);
        s.imposta((300.0, 900.0), 6.0);
        s.g = Scorrevole::nuovo(1.0);
        let v = rms(|| s.campione(), 10.0);
        assert!(v > 0.04 && v < 0.25, "soffio {v}");
        let mut t = Tremito::nuovo(sr, 4);
        t.g = Scorrevole::nuovo(1.0);
        let v = rms(|| (t.campione(), 0.0), 10.0);
        assert!(v > 0.02 && v < 0.4, "tremito {v}");
        let mut g = Groviglio::nuovo(sr, 5);
        g.g = Scorrevole::nuovo(1.0);
        g.densita = Scorrevole::nuovo(10.0);
        g.vicino = Scorrevole::nuovo(1.0);
        let v = rms(|| g.campione(), 10.0);
        assert!(v > 0.02 && v < 0.4, "groviglio {v}");
    }
}
