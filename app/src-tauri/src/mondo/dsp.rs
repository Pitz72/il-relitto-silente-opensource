//! Gli attrezzi dell’elaborazione: il caso, i rumori, i filtri, i risonatori, i
//! parametri che scorrono. Tutto il suono del gioco nasce da qui: nessun campione
//! registrato (decisione dell’autore, 15 ottobre 2026).

use std::f32::consts::PI;

/// Un generatore piccolo e veloce (xorshift64*). Il caso dell’audio è separato da
/// quello del gioco: non tocca i salvataggi né il collaudo.
#[derive(Clone)]
pub struct Caso(u64);

impl Caso {
    pub fn nuovo(seme: u64) -> Self {
        Caso(seme.wrapping_mul(0x9E37_79B9_7F4A_7C15) | 1)
    }

    pub fn u64(&mut self) -> u64 {
        let mut x = self.0;
        x ^= x >> 12;
        x ^= x << 25;
        x ^= x >> 27;
        self.0 = x;
        x.wrapping_mul(0x2545_F491_4F6C_DD1D)
    }

    /// Fra 0 e 1.
    #[inline]
    pub fn f(&mut self) -> f32 {
        (self.u64() >> 40) as f32 / 16_777_216.0
    }

    /// Fra −1 e 1: il rumore bianco.
    #[inline]
    pub fn bianco(&mut self) -> f32 {
        self.f() * 2.0 - 1.0
    }

    /// Quasi gaussiano, con deviazione 1 (la somma di tre uniformi).
    #[inline]
    pub fn gauss(&mut self) -> f32 {
        (self.f() + self.f() + self.f() - 1.5) * 2.0
    }

    pub fn tra(&mut self, a: f32, b: f32) -> f32 {
        a + (b - a) * self.f()
    }

    pub fn indice(&mut self, n: usize) -> usize {
        if n == 0 { 0 } else { (self.u64() % n as u64) as usize }
    }

    /// Un indice diverso dall’ultimo, quando ce n’è più di uno.
    pub fn indice_nuovo(&mut self, n: usize, ultimo: usize) -> usize {
        if n < 2 {
            return 0;
        }
        let i = self.indice(n - 1);
        if i >= ultimo { i + 1 } else { i }
    }

    /// Vero una volta su `n`.
    pub fn una_su(&mut self, n: u32) -> bool {
        self.indice(n.max(1) as usize) == 0
    }

    /// Vero con probabilità `p`.
    pub fn se(&mut self, p: f32) -> bool {
        self.f() < p
    }
}

pub fn db(x: f32) -> f32 {
    10f32.powf(x / 20.0)
}

/// Il tempo in campioni.
pub fn campioni(secondi: f32, sr: f32) -> u32 {
    (secondi.max(0.0) * sr) as u32
}

// -------------------------------------------------------------------------------------
//  I rumori
// -------------------------------------------------------------------------------------

/// Il rumore rosa (il filtro di Paul Kellet): −3 dB per ottava, come l’aria che si
/// muove e quasi tutti i fondi del mondo.
#[derive(Clone, Copy, Default)]
pub struct Rosa {
    b: [f32; 7],
}

impl Rosa {
    #[inline]
    pub fn campione(&mut self, w: f32) -> f32 {
        let b = &mut self.b;
        b[0] = 0.99886 * b[0] + w * 0.055_517_9;
        b[1] = 0.99332 * b[1] + w * 0.075_075_9;
        b[2] = 0.96900 * b[2] + w * 0.153_852;
        b[3] = 0.86650 * b[3] + w * 0.310_485_6;
        b[4] = 0.55000 * b[4] + w * 0.532_952_2;
        b[5] = -0.7616 * b[5] - w * 0.016_898;
        let y = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + w * 0.5362;
        b[6] = w * 0.115_926;
        // con il bianco uniforme fra −1 e 1, un valore efficace di 0,1
        y * 0.057
    }
}

/// Un valore a caso che scorre liscio da un punto all’altro: le derive lente, i
/// tremiti, le turbolenze. Da −1 a 1.
#[derive(Clone, Copy)]
pub struct Lento {
    a: f32,
    b: f32,
    t: f32,
    passo: f32,
    periodo: (f32, f32),
}

impl Lento {
    /// `periodo`: quanto dura, in secondi, il cammino da un punto all’altro.
    pub fn nuovo(periodo: (f32, f32), caso: &mut Caso) -> Self {
        Lento { a: caso.bianco(), b: caso.bianco(), t: caso.f(), passo: 0.0, periodo }
    }

    #[inline]
    pub fn campione(&mut self, dt: f32, caso: &mut Caso) -> f32 {
        if self.passo == 0.0 {
            self.passo = dt / caso.tra(self.periodo.0, self.periodo.1);
        }
        self.t += self.passo;
        if self.t >= 1.0 {
            self.t -= 1.0;
            self.a = self.b;
            self.b = caso.bianco();
            self.passo = dt / caso.tra(self.periodo.0, self.periodo.1);
        }
        let s = self.t * self.t * (3.0 - 2.0 * self.t);
        self.a + (self.b - self.a) * s
    }
}

// -------------------------------------------------------------------------------------
//  I filtri
// -------------------------------------------------------------------------------------

/// Un filtro biquadratico (le formule di Robert Bristow-Johnson), per due canali.
#[derive(Clone, Copy, Default)]
pub struct Biquad {
    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32,
    z1: [f32; 2],
    z2: [f32; 2],
}

impl Biquad {
    fn da(b: [f64; 3], a: [f64; 3]) -> Self {
        Biquad {
            b0: (b[0] / a[0]) as f32,
            b1: (b[1] / a[0]) as f32,
            b2: (b[2] / a[0]) as f32,
            a1: (a[1] / a[0]) as f32,
            a2: (a[2] / a[0]) as f32,
            z1: [0.0; 2],
            z2: [0.0; 2],
        }
    }

    fn base(f0: f32, q: f32, sr: f32) -> (f64, f64) {
        let w = 2.0 * std::f64::consts::PI * f0.min(sr * 0.45) as f64 / sr as f64;
        (w.cos(), w.sin() / (2.0 * q as f64))
    }

    pub fn passabasso(f0: f32, q: f32, sr: f32) -> Self {
        let (c, al) = Self::base(f0, q, sr);
        Self::da([(1.0 - c) / 2.0, 1.0 - c, (1.0 - c) / 2.0], [1.0 + al, -2.0 * c, 1.0 - al])
    }

    pub fn passaalto(f0: f32, q: f32, sr: f32) -> Self {
        let (c, al) = Self::base(f0, q, sr);
        Self::da([(1.0 + c) / 2.0, -(1.0 + c), (1.0 + c) / 2.0], [1.0 + al, -2.0 * c, 1.0 - al])
    }

    pub fn picco(f0: f32, q: f32, guadagno_db: f32, sr: f32) -> Self {
        let a = 10f64.powf(guadagno_db as f64 / 40.0);
        let (c, al) = Self::base(f0, q, sr);
        Self::da([1.0 + al * a, -2.0 * c, 1.0 - al * a], [1.0 + al / a, -2.0 * c, 1.0 - al / a])
    }

    /// Una mensola bassa: alza o abbassa tutto quello che sta sotto `f0`.
    pub fn mensola_bassa(f0: f32, guadagno_db: f32, sr: f32) -> Self {
        let a = 10f64.powf(guadagno_db as f64 / 40.0);
        let (c, al) = Self::base(f0, std::f32::consts::FRAC_1_SQRT_2, sr);
        let sq = 2.0 * a.sqrt() * al;
        Self::da(
            [a * ((a + 1.0) - (a - 1.0) * c + sq), 2.0 * a * ((a - 1.0) - (a + 1.0) * c), a * ((a + 1.0) - (a - 1.0) * c - sq)],
            [(a + 1.0) + (a - 1.0) * c + sq, -2.0 * ((a - 1.0) + (a + 1.0) * c), (a + 1.0) + (a - 1.0) * c - sq],
        )
    }

    /// Cambia i coefficienti e tiene la memoria: per i filtri che si muovono.
    pub fn aggiorna(&mut self, nuovo: Biquad) {
        let (z1, z2) = (self.z1, self.z2);
        *self = nuovo;
        self.z1 = z1;
        self.z2 = z2;
    }

    #[inline]
    pub fn elabora(&mut self, x: f32, c: usize) -> f32 {
        let y = self.b0 * x + self.z1[c];
        self.z1[c] = self.b1 * x - self.a1 * y + self.z2[c];
        self.z2[c] = self.b2 * x - self.a2 * y;
        y
    }
}

/// Un polo solo: un passa-basso a 6 dB per ottava, come la legge di massa del casco.
#[derive(Clone, Copy, Default)]
pub struct UnPolo {
    a: f32,
    z: [f32; 2],
}

impl UnPolo {
    pub fn nuovo(fc: f32, sr: f32) -> Self {
        UnPolo { a: (-2.0 * PI * fc / sr).exp(), z: [0.0; 2] }
    }

    pub fn imposta(&mut self, fc: f32, sr: f32) {
        self.a = (-2.0 * PI * fc.max(1.0) / sr).exp();
    }

    #[inline]
    pub fn elabora(&mut self, x: f32, c: usize) -> f32 {
        self.z[c] = (1.0 - self.a) * x + self.a * self.z[c];
        self.z[c]
    }
}

/// Il filtro a variabili di stato (Simper, a trapezi): resta stabile anche mentre si
/// muove, e dà insieme il passa-basso, il passa-banda e il passa-alto. Un canale.
#[derive(Clone, Copy, Default)]
pub struct Svf {
    k: f32,
    a1: f32,
    a2: f32,
    a3: f32,
    ic1: f32,
    ic2: f32,
}

impl Svf {
    pub fn nuovo(fc: f32, q: f32, sr: f32) -> Self {
        let mut s = Svf::default();
        s.imposta(fc, q, sr);
        s
    }

    pub fn imposta(&mut self, fc: f32, q: f32, sr: f32) {
        let g = (PI * fc.clamp(8.0, sr * 0.48) / sr).tan();
        let k = 1.0 / q.max(0.05);
        let a1 = 1.0 / (1.0 + g * (g + k));
        self.k = k;
        self.a1 = a1;
        self.a2 = g * a1;
        self.a3 = g * self.a2;
    }

    /// (passa-basso, passa-banda con picco a 1, passa-alto)
    #[inline]
    pub fn elabora(&mut self, v0: f32) -> (f32, f32, f32) {
        let v3 = v0 - self.ic2;
        let v1 = self.a1 * self.ic1 + self.a2 * v3;
        let v2 = self.ic2 + self.a2 * self.ic1 + self.a3 * v3;
        self.ic1 = 2.0 * v1 - self.ic1;
        self.ic2 = 2.0 * v2 - self.ic2;
        (v2, self.k * v1, v0 - self.k * v1 - v2)
    }

    #[inline]
    pub fn basso(&mut self, x: f32) -> f32 {
        self.elabora(x).0
    }

    #[inline]
    pub fn banda(&mut self, x: f32) -> f32 {
        self.elabora(x).1
    }

    #[inline]
    pub fn alto(&mut self, x: f32) -> f32 {
        self.elabora(x).2
    }
}

/// Un risonatore a due poli con guadagno 1 in continua (Klatt): le formanti della
/// voce e del fiato. `banda` è la larghezza di banda in Hz.
#[derive(Clone, Copy, Default)]
pub struct Risonatore {
    a: f32,
    b: f32,
    c: f32,
    y1: f32,
    y2: f32,
}

impl Risonatore {
    pub fn nuovo(f: f32, banda: f32, sr: f32) -> Self {
        let mut r = Risonatore::default();
        r.imposta(f, banda, sr);
        r
    }

    pub fn imposta(&mut self, f: f32, banda: f32, sr: f32) {
        let t = 1.0 / sr;
        let f = f.clamp(20.0, sr * 0.45);
        let c = -(-2.0 * PI * banda * t).exp();
        let b = 2.0 * (-PI * banda * t).exp() * (2.0 * PI * f * t).cos();
        self.a = 1.0 - b - c;
        self.b = b;
        self.c = c;
    }

    #[inline]
    pub fn elabora(&mut self, x: f32) -> f32 {
        let y = self.a * x + self.b * self.y1 + self.c * self.y2;
        self.y2 = self.y1;
        self.y1 = y;
        y
    }
}

/// Un modo di vibrazione: un risonatore che, colpito da un impulso di 1, suona una
/// sinusoide di ampiezza `ampiezza` che si spegne in `t60` secondi (−60 dB). È il
/// mattone della sintesi modale: le lamiere, i relè, la pietra, il ghiaccio.
#[derive(Clone, Copy, Default)]
pub struct Modo {
    c1: f32,
    c2: f32,
    g: f32,
    y1: f32,
    y2: f32,
}

impl Modo {
    pub fn nuovo(f: f32, t60: f32, ampiezza: f32, sr: f32) -> Self {
        let w = 2.0 * PI * f.clamp(10.0, sr * 0.45) / sr;
        let r = (-6.907_755 / (t60.max(0.001) * sr)).exp();
        Modo { c1: 2.0 * r * w.cos(), c2: -r * r, g: ampiezza * w.sin(), y1: 0.0, y2: 0.0 }
    }

    #[inline]
    pub fn elabora(&mut self, x: f32) -> f32 {
        let y = self.c1 * self.y1 + self.c2 * self.y2 + self.g * x;
        self.y2 = self.y1;
        self.y1 = y;
        y
    }

    #[inline]
    pub fn energia(&self) -> f32 {
        self.y1.abs() + self.y2.abs()
    }
}

/// Un parametro che va verso il suo bersaglio senza scatti, su una curva esponenziale.
#[derive(Clone, Copy)]
pub struct Scorrevole {
    pub v: f32,
    meta: f32,
    k: f32,
}

impl Scorrevole {
    pub fn nuovo(v: f32) -> Self {
        Scorrevole { v, meta: v, k: 1.0 }
    }

    /// Fa il 98% del cammino in `secondi`.
    pub fn verso(&mut self, meta: f32, secondi: f32, sr: f32) {
        self.meta = meta;
        self.k = if secondi <= 0.0 { 1.0 } else { 1.0 - (-4.0 / (secondi * sr)).exp() };
    }

    #[inline]
    pub fn passo(&mut self) -> f32 {
        self.v += (self.meta - self.v) * self.k;
        self.v
    }

    pub fn meta(&self) -> f32 {
        self.meta
    }
}

/// Un inseguitore d’inviluppo, per il compressore della cuffia.
pub struct Inseguitore {
    att: f32,
    ril: f32,
    e: f32,
}

impl Inseguitore {
    pub fn nuovo(attacco_s: f32, rilascio_s: f32, sr: f32) -> Self {
        Inseguitore { att: (-1.0 / (attacco_s * sr)).exp(), ril: (-1.0 / (rilascio_s * sr)).exp(), e: 0.0 }
    }

    #[inline]
    pub fn segui(&mut self, x: f32) -> f32 {
        let x = x.abs();
        let k = if x > self.e { self.att } else { self.ril };
        self.e = x + k * (self.e - x);
        self.e
    }
}

/// Un passa-tutto di Schroeder: sbava gli attacchi senza colorare.
pub struct PassaTutto {
    buf: Vec<f32>,
    i: usize,
    g: f32,
}

impl PassaTutto {
    pub fn nuovo(campioni: usize, g: f32) -> Self {
        PassaTutto { buf: vec![0.0; campioni.max(1)], i: 0, g }
    }

    #[inline]
    pub fn elabora(&mut self, x: f32) -> f32 {
        let wd = self.buf[self.i];
        let w = x + self.g * wd;
        let y = -self.g * w + wd;
        self.buf[self.i] = w;
        self.i += 1;
        if self.i == self.buf.len() {
            self.i = 0;
        }
        y
    }
}

/// Una linea di ritardo con ritorno: le riflessioni dentro la bolla del casco.
pub struct Pettine {
    buf: Vec<[f32; 2]>,
    i: usize,
    g: f32,
}

impl Pettine {
    pub fn nuovo(campioni: usize, g: f32) -> Self {
        Pettine { buf: vec![[0.0; 2]; campioni.max(1)], i: 0, g }
    }

    #[inline]
    pub fn elabora(&mut self, l: f32, r: f32) -> (f32, f32) {
        let d = self.buf[self.i];
        let y = [l + self.g * d[0], r + self.g * d[1]];
        self.buf[self.i] = y;
        self.i += 1;
        if self.i == self.buf.len() {
            self.i = 0;
        }
        (y[0], y[1])
    }
}

/// Una linea di ritardo semplice, letta anche fra un campione e l’altro.
pub struct Ritardo {
    buf: Vec<f32>,
    i: usize,
}

impl Ritardo {
    pub fn nuovo(massimo: usize) -> Self {
        Ritardo { buf: vec![0.0; massimo.max(2) + 2], i: 0 }
    }

    #[inline]
    pub fn scrivi(&mut self, x: f32) {
        self.buf[self.i] = x;
        self.i += 1;
        if self.i == self.buf.len() {
            self.i = 0;
        }
    }

    /// Il campione scritto `d` campioni fa (d ≥ 1), con l’interpolazione lineare.
    #[inline]
    pub fn leggi(&self, d: f32) -> f32 {
        let n = self.buf.len();
        let d = d.clamp(1.0, (n - 2) as f32);
        let di = d as usize;
        let t = d - di as f32;
        let a = self.buf[(self.i + n - di) % n];
        let b = self.buf[(self.i + n - di - 1) % n];
        a + (b - a) * t
    }
}

/// Un panoramico a potenza costante: da −1 (sinistra) a 1 (destra).
pub fn pan(p: f32) -> (f32, f32) {
    let a = (p.clamp(-1.0, 1.0) + 1.0) * PI / 4.0;
    (a.cos(), a.sin())
}

/// Un limitatore morbido: lascia stare tutto sotto 0,8 e piega i picchi.
#[inline]
pub fn morbido(x: f32) -> f32 {
    let a = x.abs();
    if a < 0.8 { x } else { x.signum() * (0.8 + 0.2 * ((a - 0.8) / 0.2).tanh()) }
}

/// Una curva a campana asimmetrica fra 0 e 1: sale fino a `cima` (la frazione della
/// durata dove sta il massimo), poi scende. `x` va da 0 a 1.
#[inline]
pub fn campana(x: f32, cima: f32) -> f32 {
    if x <= 0.0 || x >= 1.0 {
        return 0.0;
    }
    if x < cima {
        0.5 - 0.5 * (PI * x / cima).cos()
    } else {
        0.5 + 0.5 * (PI * (x - cima) / (1.0 - cima)).cos()
    }
}

#[cfg(test)]
mod prove {
    use super::*;

    #[test]
    fn il_modo_suona_e_si_spegne() {
        let sr = 48000.0;
        let mut m = Modo::nuovo(1000.0, 0.5, 1.0, sr);
        let mut picco = 0.0f32;
        for i in 0..(sr as usize) {
            let y = m.elabora(if i == 0 { 1.0 } else { 0.0 });
            if i < 200 {
                picco = picco.max(y.abs());
            }
        }
        assert!((picco - 1.0).abs() < 0.05, "picco {picco}");
        // dopo un secondo (due t60) resta meno di −100 dB
        assert!(m.energia() < 1e-5);
    }

    #[test]
    fn il_rosa_resta_nei_limiti() {
        let mut c = Caso::nuovo(3);
        let mut r = Rosa::default();
        let mut somma = 0.0f64;
        let n = 480_000;
        let mut massimo = 0.0f32;
        for _ in 0..n {
            let y = r.campione(c.bianco());
            somma += (y * y) as f64;
            massimo = massimo.max(y.abs());
        }
        let rms = (somma / n as f64).sqrt();
        assert!(rms > 0.08 && rms < 0.12, "rms {rms}");
        assert!(massimo < 0.6, "massimo {massimo}");
    }
}
