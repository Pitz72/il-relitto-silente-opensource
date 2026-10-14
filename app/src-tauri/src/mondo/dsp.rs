//! Gli attrezzi dell’elaborazione: il caso, i filtri, i parametri che scorrono.

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
    pub fn f(&mut self) -> f32 {
        (self.u64() >> 40) as f32 / 16_777_216.0
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
}

pub fn db(x: f32) -> f32 {
    10f32.powf(x / 20.0)
}

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
#[derive(Clone, Copy)]
pub struct UnPolo {
    a: f32,
    z: [f32; 2],
}

impl UnPolo {
    pub fn nuovo(fc: f32, sr: f32) -> Self {
        UnPolo { a: (-2.0 * PI * fc / sr).exp(), z: [0.0; 2] }
    }

    #[inline]
    pub fn elabora(&mut self, x: f32, c: usize) -> f32 {
        self.z[c] = (1.0 - self.a) * x + self.a * self.z[c];
        self.z[c]
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

/// La finestra di Hann in tabella, per i grani del brusio.
pub struct Hann(Vec<f32>);

impl Hann {
    pub fn nuova(n: usize) -> Self {
        Hann((0..=n).map(|i| 0.5 - 0.5 * (2.0 * PI * i as f32 / n as f32).cos()).collect())
    }

    #[inline]
    pub fn a(&self, t: f32) -> f32 {
        let n = (self.0.len() - 1) as f32;
        self.0[(t.clamp(0.0, 1.0) * n) as usize]
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
